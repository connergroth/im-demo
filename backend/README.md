# Life Review API Backend

Flask-based backend API for the Life Review conversational AI application.

## Features

- **PDF Question Extraction**: Upload PDFs and extract questions automatically
- **Text-to-Speech**: Convert questions to natural-sounding voice using OpenAI TTS
- **Speech Transcription**: Transcribe audio responses using Whisper
- **AI Analysis**: Analyze responses for emotions, themes, and values using GPT-4

## Project Structure

```
backend/
├── app/
│   ├── __init__.py           # Flask app factory
│   ├── config/               # Configuration settings
│   │   ├── __init__.py
│   │   └── settings.py
│   ├── routes/               # API routes
│   │   ├── __init__.py
│   │   └── api.py
│   ├── services/             # Business logic
│   │   ├── __init__.py
│   │   ├── openai_service.py
│   │   └── pdf_service.py
│   └── utils/                # Utility functions
│       ├── __init__.py
│       └── file_utils.py
├── wsgi.py                   # WSGI entry point
├── requirements.txt          # Python dependencies
├── Dockerfile               # Docker configuration
├── fly.toml                 # Fly.io configuration
└── .env.example            # Environment variables template
```

## Setup

### Local Development

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Add your OpenAI API key to `.env`:
```
OPENAI_API_KEY=sk-...
```

5. Run the development server:
```bash
python wsgi.py
```

The API will be available at `http://localhost:8080`

## API Endpoints

### Health Check
```
GET /api/health
```

### Extract Questions from PDF
```
POST /api/extract-questions
Content-Type: multipart/form-data

Body: { pdf: <file> }
```

### Text-to-Speech
```
POST /api/text-to-speech
Content-Type: application/json

Body: {
  "text": "Your question here",
  "voice": "nova"  // optional: alloy, echo, fable, onyx, nova, shimmer
}
```

### Transcribe Audio
```
POST /api/transcribe
Content-Type: multipart/form-data

Body: { audio: <file> }
```

### Analyze Response
```
POST /api/analyze
Content-Type: application/json

Body: {
  "question": "What is your favorite memory?",
  "answer": "User's transcribed response..."
}
```

## Deployment to Fly.io

### Prerequisites

1. Install the Fly CLI:
```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Windows
iwr https://fly.io/install.ps1 -useb | iex
```

2. Sign up or log in:
```bash
fly auth signup
# or
fly auth login
```

### Deploy

1. Navigate to the backend directory:
```bash
cd backend
```

2. Launch the app (first time):
```bash
fly launch
```

This will:
- Create a new Fly app
- Set up the fly.toml configuration
- Build and deploy the Docker container

3. Set environment variables:
```bash
fly secrets set OPENAI_API_KEY=your_key_here
```

4. Deploy updates:
```bash
fly deploy
```

5. Check status:
```bash
fly status
```

6. View logs:
```bash
fly logs
```

7. Open in browser:
```bash
fly open
```

## Environment Variables

Required:
- `OPENAI_API_KEY` - Your OpenAI API key

Optional:
- `FLASK_ENV` - Environment (development/production)
- `SECRET_KEY` - Flask secret key for sessions
- `CORS_ORIGINS` - Comma-separated allowed origins
- `PORT` - Server port (default: 8080)

## Testing

Test the API with curl:

```bash
# Health check
curl http://localhost:8080/api/health

# Upload PDF and extract questions
curl -X POST -F "pdf=@questions.pdf" http://localhost:8080/api/extract-questions

# Generate speech
curl -X POST -H "Content-Type: application/json" \
  -d '{"text":"What is your favorite memory?","voice":"nova"}' \
  http://localhost:8080/api/text-to-speech --output speech.mp3
```

## License

MIT
