# Life Review Backend - Complete Setup Guide

Your Colab notebook has been successfully converted into a production-ready Flask backend with proper structure! 🎉

## What Was Created

I've transformed your [life_review_pipeline_with_tts.py](life_review_pipeline_with_tts.py) into a professional backend with:

### ✅ Proper Backend Architecture

```
backend/
├── app/
│   ├── __init__.py              # Flask app factory
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py          # Configuration management
│   ├── routes/
│   │   ├── __init__.py
│   │   └── api.py               # RESTful API endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   ├── openai_service.py    # OpenAI TTS, Whisper, GPT
│   │   └── pdf_service.py       # PDF question extraction
│   └── utils/
│       ├── __init__.py
│       └── file_utils.py        # File handling utilities
├── wsgi.py                      # Application entry point
├── requirements.txt             # Python dependencies
├── Dockerfile                   # Docker configuration
├── fly.toml                     # Fly.io deployment config
├── .env.example                 # Environment variables template
├── run_dev.sh                   # Quick start script
└── test_local.sh               # Local testing script
```

### ✅ Features Implemented

All your Colab functionality is now available via REST API:

1. **PDF Question Extraction** - Upload PDFs, extract questions
2. **Text-to-Speech** - Convert questions to voice (6 voice options)
3. **Audio Transcription** - Whisper API for speech-to-text
4. **AI Analysis** - GPT-4 analyzes responses for emotions, themes, values
5. **CORS Support** - Ready for frontend integration
6. **Production Ready** - Gunicorn, proper error handling, logging

### ✅ Deployment Ready

- **Dockerfile** for containerization
- **fly.toml** for Fly.io deployment
- **Environment-based configuration**
- **Auto-scaling support**

## Quick Start (Choose One)

### Option A: Run Locally (Fastest)

```bash
cd backend
./run_dev.sh
```

Then visit: http://localhost:8080/api/health

### Option B: Deploy to Fly.io (Production)

```bash
# 1. Install Fly CLI (macOS)
brew install flyctl

# 2. Login/Signup
flyctl auth login

# 3. Deploy (from backend directory)
cd backend
flyctl launch

# 4. Set your OpenAI key
flyctl secrets set OPENAI_API_KEY=sk-your-key-here

# 5. Open your deployed app
flyctl open
```

## API Endpoints Available

Once running, you have these endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Health check |
| `/api/extract-questions` | POST | Extract questions from PDF |
| `/api/text-to-speech` | POST | Convert text to speech |
| `/api/transcribe` | POST | Transcribe audio to text |
| `/api/analyze` | POST | Analyze response with AI |

## Example API Calls

### 1. Extract Questions from PDF
```bash
curl -X POST -F "pdf=@questions.pdf" \
  http://localhost:8080/api/extract-questions
```

Response:
```json
{
  "success": true,
  "questions": [
    "What is your earliest childhood memory?",
    "Who has been the most influential person in your life?"
  ],
  "count": 2
}
```

### 2. Generate Speech from Text
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"text":"What is your favorite memory?","voice":"nova"}' \
  http://localhost:8080/api/text-to-speech \
  --output question.mp3
```

### 3. Transcribe Audio
```bash
curl -X POST -F "audio=@recording.webm" \
  http://localhost:8080/api/transcribe
```

Response:
```json
{
  "success": true,
  "transcript": "My favorite memory is when I went to the beach with my family..."
}
```

### 4. Analyze Response
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{
    "question": "What is your favorite memory?",
    "answer": "My favorite memory is when I went to the beach with my family..."
  }' \
  http://localhost:8080/api/analyze
```

Response:
```json
{
  "success": true,
  "analysis": "This response reveals strong family values and appreciation for shared experiences..."
}
```

## Connecting to Your Frontend

Update your React app to use the backend:

```typescript
// src/config/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const api = {
  extractQuestions: (pdfFile: File) => {
    const formData = new FormData();
    formData.append('pdf', pdfFile);
    return fetch(`${API_URL}/extract-questions`, {
      method: 'POST',
      body: formData,
    });
  },

  textToSpeech: (text: string, voice = 'nova') => {
    return fetch(`${API_URL}/text-to-speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice }),
    });
  },

  transcribeAudio: (audioFile: File) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    return fetch(`${API_URL}/transcribe`, {
      method: 'POST',
      body: formData,
    });
  },

  analyzeResponse: (question: string, answer: string) => {
    return fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, answer }),
    });
  },
};
```

## Environment Setup

### For Local Development

Create `backend/.env`:
```env
OPENAI_API_KEY=sk-your-key-here
FLASK_ENV=development
DEBUG=True
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
PORT=8080
SECRET_KEY=dev-secret-change-in-production
```

### For Production (Fly.io)

Set secrets:
```bash
flyctl secrets set OPENAI_API_KEY=sk-your-key-here
flyctl secrets set SECRET_KEY=$(openssl rand -hex 32)
```

Update `backend/fly.toml` CORS if needed:
```toml
[env]
  CORS_ORIGINS = "https://yourfrontend.com"
```

## Deployment Steps for Fly.io

### First Time Deployment

1. **Install Fly CLI**
   ```bash
   # macOS
   brew install flyctl

   # Linux
   curl -L https://fly.io/install.sh | sh

   # Windows
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Authenticate**
   ```bash
   flyctl auth signup  # or flyctl auth login
   ```

3. **Deploy from backend directory**
   ```bash
   cd backend
   flyctl launch
   ```

   Answer the prompts:
   - App name: `life-review-api` (or your choice)
   - Region: Choose closest to you (e.g., `sjc`)
   - PostgreSQL: **No**
   - Redis: **No**
   - Deploy now: **Yes**

4. **Set secrets**
   ```bash
   flyctl secrets set OPENAI_API_KEY=sk-xxxxx
   ```

5. **Verify deployment**
   ```bash
   flyctl status
   flyctl logs
   flyctl open
   ```

### Subsequent Deployments

After making changes:
```bash
cd backend
flyctl deploy
```

## Testing Your Deployment

### Test Health Endpoint
```bash
curl https://your-app-name.fly.dev/api/health
```

Should return:
```json
{"service":"life-review-api","status":"healthy"}
```

### Test with Frontend
Update your frontend's API URL to:
```
https://your-app-name.fly.dev/api
```

## Monitoring & Debugging

### View Logs
```bash
flyctl logs           # Recent logs
flyctl logs -f        # Follow logs in real-time
```

### Check Status
```bash
flyctl status         # App status
flyctl info          # App details
```

### SSH into Container
```bash
flyctl ssh console
```

### Scale Resources
```bash
flyctl scale memory 512      # Increase memory
flyctl scale count 2         # Run 2 instances
```

## Cost Information

**Fly.io Free Tier includes:**
- Up to 3 shared-cpu VMs with 256MB RAM
- 160GB outbound data transfer
- Auto-sleep after 5 minutes of inactivity (configured)

Your backend is configured to:
- Auto-stop when idle (`auto_stop_machines = true`)
- Auto-start on requests (`auto_start_machines = true`)
- Run 0 machines when idle (`min_machines_running = 0`)

This keeps it within the free tier for moderate usage! 💰

## Next Steps

1. ✅ **Backend is created and structured**
2. 🔧 **Test locally**: Run `./run_dev.sh` in backend directory
3. 🌐 **Deploy to Fly.io**: Follow deployment steps above
4. 🔗 **Connect frontend**: Update API URLs in your React app
5. 🧪 **Test integration**: Verify full pipeline works
6. 📊 **Monitor**: Use Fly.io dashboard for metrics

## Documentation

- **[backend/QUICKSTART.md](backend/QUICKSTART.md)** - Fast setup guide
- **[backend/README.md](backend/README.md)** - Full API documentation
- **[backend/DEPLOYMENT.md](backend/DEPLOYMENT.md)** - Detailed deployment guide

## Troubleshooting

### Local Issues

**"Module not found"**
```bash
cd backend
pip install -r requirements.txt
```

**"Port already in use"**
```bash
# Change port in .env
PORT=8081
```

**"OPENAI_API_KEY not configured"**
```bash
# Add to backend/.env
OPENAI_API_KEY=sk-your-key-here
```

### Deployment Issues

**Build fails**
```bash
flyctl logs
# Check for errors in Dockerfile or requirements.txt
```

**App crashes**
```bash
flyctl ssh console
# Check if files are present and secrets are set
flyctl secrets list
```

**CORS errors**
```bash
# Update CORS_ORIGINS in fly.toml or set as secret
flyctl secrets set CORS_ORIGINS=https://yourfrontend.com
```

## Available Voice Options

Your TTS endpoint supports these voices:
- `alloy` - Neutral, balanced
- `echo` - Clear, expressive
- `fable` - British accent, warm
- `onyx` - Deep, authoritative
- `nova` - Warm, friendly (default)
- `shimmer` - Bright, cheerful

## Support & Resources

- **Fly.io Docs**: https://fly.io/docs
- **OpenAI API Docs**: https://platform.openai.com/docs
- **Flask Docs**: https://flask.palletsprojects.com
- **Fly.io Community**: https://community.fly.io

---

**Your backend is ready! 🚀** Choose local development or deploy to Fly.io to get started.
