"""
API routes for life review pipeline.
"""
from flask import Blueprint, request, jsonify, send_file, current_app
from werkzeug.exceptions import BadRequest
from app.services import PDFService, OpenAIService
from app.utils import allowed_file, save_upload, cleanup_file
from app.config import Config
from app.config.narratives import INTRO_NARRATIVE, OUTRO_NARRATIVE
import os

api_bp = Blueprint('api', __name__, url_prefix='/api')

# Initialize services
pdf_service = PDFService()

# Pre-caching state to prevent duplicate requests
_pre_caching_in_progress = False


def get_openai_service():
    """Get OpenAI service instance with API key and Supabase config"""
    api_key = current_app.config.get('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY not configured")
    
    # Get Supabase config for permanent caching
    supabase_url = current_app.config.get('SUPABASE_URL')
    supabase_key = current_app.config.get('SUPABASE_SERVICE_KEY')
    
    # Get chat model from config
    chat_model = current_app.config.get('CHAT_MODEL', 'gpt-3.5-turbo')
    
    return OpenAIService(api_key, supabase_url, supabase_key, chat_model)


@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'life-review-api'
    }), 200


@api_bp.route('/assemblyai-token', methods=['GET'])
def get_assemblyai_token():
    """
    Generate a temporary AssemblyAI v3 streaming token for WebSocket authentication.
    """
    import requests

    # Get AssemblyAI API key from environment
    assemblyai_key = current_app.config.get('ASSEMBLYAI_API_KEY')
    if not assemblyai_key:
        return jsonify({'error': 'AssemblyAI API key not configured'}), 500

    # Expiration (seconds) - 60-600 required by API
    expires_in_seconds = request.args.get('expires_in_seconds', default=300, type=int)
    try:
        # Request temporary token from AssemblyAI v3
        resp = requests.get(
            'https://streaming.assemblyai.com/v3/token',
            headers={'Authorization': assemblyai_key},
            params={'expires_in_seconds': expires_in_seconds}
        )
        if resp.ok:
            return jsonify(resp.json()), 200
        return jsonify({'error': 'Failed to get token from AssemblyAI', 'details': resp.text}), resp.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500


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
    Convert text to speech with permanent caching.

    Expected JSON: { "text": "...", "voice": "nova", "content_type": "narrative" }
    Returns: Audio file (MP3)
    """
    data = request.get_json()

    if not data or 'text' not in data:
        return jsonify({'error': 'Text is required'}), 400

    text = data['text']
    voice = data.get('voice', 'nova')
    content_type = data.get('content_type', 'narrative')

    try:
        openai_service = get_openai_service()
        audio_path = openai_service.text_to_speech(text, voice, content_type=content_type)

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


@api_bp.route('/analyze-and-tts', methods=['POST'])
def analyze_and_tts():
    """
    Analyze response and generate TTS in parallel for maximum speed.
    """
    try:
        data = request.get_json()
        if not data or 'question' not in data or 'answer' not in data:
            return jsonify({'error': 'Missing question or answer'}), 400

        question = data['question']
        answer = data['answer']
        voice = data.get('voice', 'nova')

        openai_service = get_openai_service()
        ai_response, tts_path = openai_service.analyze_and_prepare_tts(question, answer, voice)

        if not ai_response:
            return jsonify({'error': 'Failed to generate analysis'}), 500

        if not tts_path:
            return jsonify({'error': 'Failed to generate TTS'}), 500

        # Return both the analysis and TTS file path
        return jsonify({
            'success': True,
            'analysis': ai_response,
            'tts_path': tts_path
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/analyze-followup', methods=['POST'])
def analyze_followup():
    """
    Analyze a follow-up response with context from the original question and answer.
    """
    try:
        data = request.get_json()
        if not data or 'original_question' not in data or 'original_answer' not in data or 'followup_answer' not in data:
            return jsonify({'error': 'Missing original question, original answer, or followup answer'}), 400

        original_question = data['original_question']
        original_answer = data['original_answer']
        followup_answer = data['followup_answer']
        voice = data.get('voice', 'nova')

        openai_service = get_openai_service()
        ai_response, tts_path = openai_service.analyze_followup_response(
            original_question, original_answer, followup_answer, voice
        )

        if not ai_response:
            return jsonify({'error': 'Failed to generate follow-up analysis'}), 500

        if not tts_path:
            return jsonify({'error': 'Failed to generate TTS'}), 500

        # Return both the analysis and TTS file path
        return jsonify({
            'success': True,
            'analysis': ai_response,
            'tts_path': tts_path
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/analyze-session', methods=['POST'])
def analyze_session():
    """
    Analyze a complete life review session with all Q&A pairs.
    
    Expected JSON: { "session_data": [{"question": "...", "answer": "..."}, ...] }
    Returns: JSON with comprehensive analysis and metrics
    """
    try:
        data = request.get_json()
        if not data or 'session_data' not in data:
            return jsonify({'error': 'Missing session_data'}), 400

        session_data = data['session_data']
        
        if not isinstance(session_data, list) or len(session_data) == 0:
            return jsonify({'error': 'session_data must be a non-empty list'}), 400

        openai_service = get_openai_service()
        analysis = openai_service.analyze_full_session(session_data)

        if not analysis:
            return jsonify({'error': 'Failed to generate session analysis'}), 500

        return jsonify({
            'success': True,
            'analysis': analysis
        }), 200

    except Exception as e:
        print(f"[API] Session analysis error: {e}")
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


@api_bp.route('/cache-stats', methods=['GET'])
def cache_stats():
    """
    Get TTS cache statistics.
    
    Returns: JSON with cache statistics
    """
    try:
        openai_service = get_openai_service()
        
        if hasattr(openai_service, 'tts_cache_service') and openai_service.tts_cache_service:
            stats = openai_service.tts_cache_service.get_cache_stats()
        else:
            stats = {
                'supabase_entries': 0,
                'local_files': len(openai_service.tts_cache),
                'memory_cache': len(openai_service.tts_cache),
                'permanent_cache_enabled': False
            }
        
        return jsonify({
            'success': True,
            'stats': stats
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/pre-cache-narratives', methods=['POST'])
def pre_cache_narratives():
    """
    Pre-cache common narratives for faster loading.
    
    Expected JSON: { "voice": "nova" (optional) }
    Returns: JSON with caching results
    """
    global _pre_caching_in_progress
    
    # Prevent duplicate requests
    if _pre_caching_in_progress:
        return jsonify({
            'success': True,
            'message': 'Pre-caching already in progress',
            'cached_count': 0,
            'total_count': 0
        }), 200
    
    data = request.get_json() or {}
    voice = data.get('voice', 'nova')
    
    try:
        _pre_caching_in_progress = True
        print(f"[API] Starting pre-cache for voice: {voice}")
        
        openai_service = get_openai_service()
        
        # Collect all narratives to cache
        all_narratives = [INTRO_NARRATIVE, OUTRO_NARRATIVE]
        
        # ✅ Also pre-cache all questions for instant playback
        from app.config.narratives import QUESTION_SEQUENCE
        questions = [q['prompt'] for q in QUESTION_SEQUENCE]
        all_narratives.extend(questions)
        
        print(f"[API] Pre-caching {len(all_narratives)} items (intro + outro + {len(questions)} questions)")
        
        # Pre-cache narratives
        results = openai_service.pre_cache_narratives(all_narratives, voice)
        
        cached_count = sum(1 for success in results.values() if success)
        total_count = len(results)
        
        print(f"[API] Pre-cache complete: {cached_count}/{total_count} narratives cached")
        
        return jsonify({
            'success': True,
            'cached_count': cached_count,
            'total_count': total_count,
            'results': results
        }), 200
        
    except Exception as e:
        print(f"[API] Pre-cache error: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        _pre_caching_in_progress = False


@api_bp.errorhandler(BadRequest)
def handle_bad_request(e):
    """Handle bad request errors"""
    return jsonify({'error': 'Bad request', 'message': str(e)}), 400


@api_bp.errorhandler(500)
def handle_internal_error(e):
    """Handle internal server errors"""
    return jsonify({'error': 'Internal server error'}), 500
