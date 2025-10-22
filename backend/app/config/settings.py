"""
Application configuration settings.
"""
import os
from pathlib import Path

class Config:
    """Base configuration"""

    # API Keys
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    ASSEMBLYAI_API_KEY = os.getenv('ASSEMBLYAI_API_KEY')
    
    # Supabase configuration for permanent caching
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

    # CORS settings - Allow Vercel domains and localhost
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000,https://*.vercel.app').split(',')

    # Upload settings
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = Path('/tmp/uploads')
    ALLOWED_EXTENSIONS = {'pdf'}

    # OpenAI settings
    TTS_MODEL = "tts-1-hd"  # Higher quality, still fast
    TTS_VOICE = "nova"
    WHISPER_MODEL = "whisper-1"
    CHAT_MODEL = "gpt-3.5-turbo"  # Faster response time

    # Recording settings
    DEFAULT_RECORDING_DURATION = 30

    @staticmethod
    def init_app(app):
        """Initialize application configuration"""
        # Create upload folder if it doesn't exist
        Config.UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False


config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
