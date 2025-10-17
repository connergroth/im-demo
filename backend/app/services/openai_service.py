"""
OpenAI API service for TTS, transcription, and AI analysis.
"""
from openai import OpenAI
from typing import Optional
import time
from pathlib import Path


class OpenAIService:
    """Service for handling OpenAI API operations"""

    def __init__(self, api_key: str):
        """
        Initialize OpenAI service.

        Args:
            api_key (str): OpenAI API key
        """
        self.client = OpenAI(api_key=api_key)

    def text_to_speech(self, text: str, voice: str = "nova", output_dir: str = "/tmp") -> Optional[str]:
        """
        Converts text to speech using OpenAI TTS.

        Args:
            text (str): Text to speak
            voice (str): Voice to use (alloy, echo, fable, onyx, nova, shimmer)
            output_dir (str): Directory to save audio file

        Returns:
            str: Path to the saved audio file or None if error
        """
        try:
            # Generate speech with streaming
            response = self.client.audio.speech.create(
                model="tts-1",
                voice=voice,
                input=text
            )

            # Save to file
            speech_file = Path(output_dir) / f"question_speech_{int(time.time())}.mp3"

            with open(speech_file, 'wb') as f:
                for chunk in response.iter_bytes():
                    f.write(chunk)

            return str(speech_file)

        except Exception as e:
            print(f"Error generating speech: {e}")
            return None

    def transcribe_audio(self, audio_path: str) -> Optional[str]:
        """
        Transcribes speech to text using OpenAI Whisper.

        Args:
            audio_path (str): Path to the audio file

        Returns:
            str: Transcribed text or None if error
        """
        try:
            with open(audio_path, "rb") as audio_file:
                transcript = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
            return transcript.text

        except FileNotFoundError:
            print(f"Error: Audio file not found at {audio_path}")
            return None
        except Exception as e:
            print(f"Error transcribing audio: {e}")
            return None

    def analyze_response(self, question: str, transcript_text: str) -> Optional[str]:
        """
        Analyzes a transcribed answer for emotions, themes, and personal values.

        Args:
            question (str): The question that was asked
            transcript_text (str): The transcribed answer

        Returns:
            str: AI-generated summary or None if error
        """
        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a warm, empathetic conversational AI companion conducting a life review interview with an older adult. Your purpose is to guide them through structured life review sessions, capturing their stories to help their family and care team understand them better.

When responding to their answers:
1. Acknowledge their story with warmth and empathy
2. Reflect back the key emotions or themes you heard
3. Ask a natural follow-up question to go deeper (e.g., "That sounds meaningful — how did you feel in that moment?", "What made that so special for you?", "Who was with you during that time?")
4. Keep your response conversational, warm, and brief (2-3 sentences max)
5. Make them feel heard and valued

Your goal is to help them open up and share more details naturally."""
                    },
                    {
                        "role": "user",
                        "content": f"""I just asked: "{question}"

They answered: "{transcript_text}"

Respond warmly and naturally, acknowledging what they shared and asking a thoughtful follow-up question to help them elaborate."""
                    }
                ],
                temperature=0.8
            )
            summary = response.choices[0].message.content.strip()
            return summary

        except Exception as e:
            print(f"Error generating AI response: {e}")
            return None
