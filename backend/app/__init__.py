"""
Flask application factory.
"""
from flask import Flask
from flask_cors import CORS
from app.config import config
from app.routes import api_bp
import os


def create_app(config_name=None):
    """
    Create and configure the Flask application.

    Args:
        config_name (str): Configuration name ('development', 'production', or 'default')

    Returns:
        Flask: Configured Flask application
    """
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')

    app = Flask(__name__)

    # Load configuration
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)

    # Initialize CORS
    CORS(app, origins=app.config['CORS_ORIGINS'])

    # Register blueprints
    app.register_blueprint(api_bp)

    # Root route
    @app.route('/')
    def index():
        return {
            'service': 'Life Review API',
            'version': '1.0.0',
            'status': 'running'
        }

    return app
