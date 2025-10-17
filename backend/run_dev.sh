#!/bin/bash
# Quick start script for local development

echo "🚀 Starting Life Review API in development mode..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env and add your OPENAI_API_KEY"
    echo ""
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo ""
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Check if requirements are installed
if [ ! -f "venv/installed.marker" ]; then
    echo "📥 Installing dependencies..."
    pip install -r requirements.txt
    touch venv/installed.marker
    echo ""
fi

# Check for OpenAI API key
if ! grep -q "OPENAI_API_KEY=sk-" .env; then
    echo "⚠️  WARNING: OPENAI_API_KEY not set in .env file"
    echo "Please add your OpenAI API key to continue"
    echo ""
fi

# Run the application
echo "✅ Starting Flask server on http://localhost:8080"
echo "Press Ctrl+C to stop"
echo ""

export FLASK_ENV=development
python wsgi.py
