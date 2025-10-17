"""
API routes for life review pipeline.
"""
from flask import Blueprint, request, jsonify, send_file, current_app
from werkzeug.exceptions import BadRequest
from app.services import PDFService, OpenAIService
from app.utils import allowed_file, save_upload, cleanup_file
from app.config import Config
import os

api_bp = Blueprint('api', __name__, url_prefix='/api')

# Initialize services
pdf_service = PDFService()


def get_openai_service():
    """Get OpenAI service instance with API key from config"""
    api_key = current_app.config.get('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY not configured")
    return OpenAIService(api_key)


@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'life-review-api'
    }), 200


@api_bp.route('/extract-questions', methods=['POST'])
def extract_questions():
    """
    Extract questions from uploaded PDF.

    Expected: multipart/form-data with 'pdf' file
    Returns: JSON with list of questions
    """
    if 'pdf' not in request.files:
        return jsonify({'error': 'No PDF file provided'}), 400

    file = request.files['pdf']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename, current_app.config['ALLOWED_EXTENSIONS']):
        return jsonify({'error': 'Invalid file type. Only PDF allowed'}), 400

    try:
        # Save uploaded file
        filepath = save_upload(file, current_app.config['UPLOAD_FOLDER'])
        if not filepath:
            return jsonify({'error': 'Failed to save file'}), 500

        # Extract questions
        questions = pdf_service.extract_questions(filepath)

        # Cleanup
        cleanup_file(filepath)

        return jsonify({
            'success': True,
            'questions': questions,
            'count': len(questions)
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/text-to-speech', methods=['POST'])
def text_to_speech():
    """
    Convert text to speech.

    Expected JSON: { "text": "...", "voice": "nova" }
    Returns: Audio file (MP3)
    """
    data = request.get_json()

    if not data or 'text' not in data:
        return jsonify({'error': 'Text is required'}), 400

    text = data['text']
    voice = data.get('voice', 'nova')

    try:
        openai_service = get_openai_service()
        audio_path = openai_service.text_to_speech(text, voice)

        if not audio_path:
            return jsonify({'error': 'Failed to generate speech'}), 500

        return send_file(
            audio_path,
            mimetype='audio/mpeg',
            as_attachment=True,
            download_name='speech.mp3'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/transcribe', methods=['POST'])
def transcribe_audio():
    """
    Transcribe audio to text.

    Expected: multipart/form-data with 'audio' file
    Returns: JSON with transcribed text
    """
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400

    file = request.files['audio']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    try:
        # Save uploaded audio
        filepath = save_upload(file, current_app.config['UPLOAD_FOLDER'])
        if not filepath:
            return jsonify({'error': 'Failed to save audio'}), 500

        # Transcribe
        openai_service = get_openai_service()
        transcript = openai_service.transcribe_audio(filepath)

        # Cleanup
        cleanup_file(filepath)

        if not transcript:
            return jsonify({'error': 'Failed to transcribe audio'}), 500

        return jsonify({
            'success': True,
            'transcript': transcript
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/analyze', methods=['POST'])
def analyze_response():
    """
    Analyze a response for emotions, themes, and values.

    Expected JSON: { "question": "...", "answer": "..." }
    Returns: JSON with AI analysis
    """
    data = request.get_json()

    if not data or 'question' not in data or 'answer' not in data:
        return jsonify({'error': 'Question and answer are required'}), 400

    question = data['question']
    answer = data['answer']

    try:
        openai_service = get_openai_service()
        analysis = openai_service.analyze_response(question, answer)

        if not analysis:
            return jsonify({'error': 'Failed to generate analysis'}), 500

        return jsonify({
            'success': True,
            'analysis': analysis
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/process-question', methods=['POST'])
def process_question():
    """
    Complete pipeline: speak question, transcribe answer, analyze.

    Expected JSON: {
        "question": "...",
        "voice": "nova" (optional),
        "audio": <base64 audio data> (optional)
    }

    Returns: JSON with transcript, analysis, and audio URL
    """
    data = request.get_json()

    if not data or 'question' not in data:
        return jsonify({'error': 'Question is required'}), 400

    question = data['question']
    voice = data.get('voice', 'nova')

    try:
        openai_service = get_openai_service()
        result = {'success': True}

        # Generate TTS for question
        audio_path = openai_service.text_to_speech(question, voice)
        if audio_path:
            result['question_audio'] = audio_path

        # If audio provided, transcribe and analyze
        if 'audio_data' in data:
            # This would need additional handling for base64 audio
            # For now, we expect separate API calls
            pass

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.errorhandler(BadRequest)
def handle_bad_request(e):
    """Handle bad request errors"""
    return jsonify({'error': 'Bad request', 'message': str(e)}), 400


@api_bp.errorhandler(500)
def handle_internal_error(e):
    """Handle internal server errors"""
    return jsonify({'error': 'Internal server error'}), 500
