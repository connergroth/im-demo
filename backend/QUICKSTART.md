# Quick Start Guide

Get your Life Review API backend up and running in minutes!

## Prerequisites

- Python 3.11+ installed
- OpenAI API key (get one at https://platform.openai.com)

## Local Development (5 minutes)

### Option 1: Use the convenience script

```bash
cd backend
./run_dev.sh
```

This will:
1. Create a virtual environment
2. Install dependencies
3. Create .env file from template
4. Start the development server

### Option 2: Manual setup

1. **Create virtual environment**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Configure environment**
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

4. **Start the server**
```bash
python wsgi.py
```

5. **Test it works**
```bash
curl http://localhost:8080/api/health
```

You should see: `{"service":"life-review-api","status":"healthy"}`

## Deploy to Fly.io (10 minutes)

### 1. Install Fly CLI

**macOS:**
```bash
brew install flyctl
```

**Linux:**
```bash
curl -L https://fly.io/install.sh | sh
```

**Windows:**
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

### 2. Authenticate

```bash
flyctl auth signup  # if new user
# OR
flyctl auth login   # if existing user
```

### 3. Deploy

```bash
cd backend
flyctl launch
```

Follow the prompts:
- App name: `life-review-api` (or your choice)
- Region: Choose closest to you
- PostgreSQL: **No**
- Redis: **No**
- Deploy now: **Yes**

### 4. Set secrets

```bash
flyctl secrets set OPENAI_API_KEY=sk-your-actual-key-here
```

### 5. Verify

```bash
flyctl status
flyctl open  # Opens your app in browser
```

Test the deployed API:
```bash
curl https://your-app-name.fly.dev/api/health
```

## API Endpoints

Once running, your API has these endpoints:

### Health Check
```bash
curl http://localhost:8080/api/health
```

### Extract Questions from PDF
```bash
curl -X POST -F "pdf=@questions.pdf" \
  http://localhost:8080/api/extract-questions
```

### Text-to-Speech
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"text":"What is your favorite memory?","voice":"nova"}' \
  http://localhost:8080/api/text-to-speech \
  --output question.mp3
```

### Transcribe Audio
```bash
curl -X POST -F "audio=@recording.webm" \
  http://localhost:8080/api/transcribe
```

### Analyze Response
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{
    "question":"What is your favorite memory?",
    "answer":"My favorite memory is..."
  }' \
  http://localhost:8080/api/analyze
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py           # Flask app factory
│   ├── config/               # Configuration
│   │   ├── settings.py       # Environment settings
│   ├── routes/               # API endpoints
│   │   └── api.py            # All routes defined here
│   ├── services/             # Business logic
│   │   ├── openai_service.py # OpenAI API integration
│   │   └── pdf_service.py    # PDF processing
│   └── utils/                # Helper functions
│       └── file_utils.py     # File handling
├── wsgi.py                   # App entry point
├── requirements.txt          # Python dependencies
├── Dockerfile               # Docker config
├── fly.toml                 # Fly.io config
└── .env                     # Environment variables (create this)
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
OPENAI_API_KEY=sk-your-key-here
FLASK_ENV=development
SECRET_KEY=your-secret-key
DEBUG=True
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
PORT=8080
```

## Connecting Your Frontend

Update your frontend to point to the backend:

**Local development:**
```typescript
const API_URL = 'http://localhost:8080/api';
```

**Production (Fly.io):**
```typescript
const API_URL = 'https://your-app-name.fly.dev/api';
```

Don't forget to add your frontend domain to CORS_ORIGINS!

## Troubleshooting

### "Module not found" errors
```bash
pip install -r requirements.txt
```

### "OPENAI_API_KEY not configured"
Add your key to `.env`:
```
OPENAI_API_KEY=sk-...
```

### Port already in use
Change the port in `.env`:
```
PORT=8081
```

### CORS errors from frontend
Add your frontend URL to `.env`:
```
CORS_ORIGINS=http://localhost:5173
```

## Next Steps

1. ✅ Backend is running
2. 📱 Connect your React frontend
3. 🧪 Test the full pipeline
4. 🚀 Deploy to production
5. 📊 Monitor with Fly.io dashboard

## Need Help?

- Check [README.md](README.md) for detailed API documentation
- See [DEPLOYMENT.md](DEPLOYMENT.md) for advanced deployment options
- Review logs: `flyctl logs` (if deployed)
- Backend logs: Check terminal output when running locally

## Available Voice Options

For text-to-speech, you can use these voices:
- `alloy` - Neutral, balanced
- `echo` - Clear, expressive
- `fable` - British accent, warm
- `onyx` - Deep, authoritative
- `nova` - Warm, friendly (default)
- `shimmer` - Bright, cheerful

Test them:
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"text":"Hello! This is a test.","voice":"echo"}' \
  http://localhost:8080/api/text-to-speech --output test.mp3 && open test.mp3
```

Happy coding! 🎉
