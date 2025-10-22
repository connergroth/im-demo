# Local Development Setup Guide

This guide will help you run the backend locally and configure the frontend to use your local backend instead of the deployed API.

## Quick Start (TL;DR)

```bash
# Terminal 1 - Run Backend
cd backend
./run_dev.sh

# Terminal 2 - Run Frontend
npm run dev
```

Then update `.env.local` to point to `http://localhost:8080/api`

---

## Step-by-Step Setup

### 1️⃣ Backend Setup

#### A. Navigate to backend directory
```bash
cd backend
```

#### B. Create environment file
```bash
cp .env.example .env
```

#### C. Edit `.env` file with your OpenAI API key
```bash
# Open in your favorite editor
nano .env
# or
code .env
```

Add your OpenAI API key:
```env
OPENAI_API_KEY=sk-your-actual-openai-key-here
FLASK_ENV=development
SECRET_KEY=your_secret_key_here
DEBUG=True
CORS_ORIGINS=http://localhost:8080,http://localhost:5173,http://localhost:3000
PORT=5001
```

#### D. Run the development server
```bash
chmod +x run_dev.sh  # Make script executable (first time only)
./run_dev.sh
```

The script will automatically:
- Create a Python virtual environment
- Install dependencies from `requirements.txt`
- Start the Flask server on http://localhost:5001

You should see:
```
✅ Starting Flask server on http://localhost:5001
Press Ctrl+C to stop
```

#### E. Test the backend is running
Open a new terminal and run:
```bash
curl http://localhost:5001/api/health
```

You should get: `{"status":"ok"}`

---

### 2️⃣ Frontend Setup

#### A. Update frontend to use local backend
Edit `.env.local` in the project root:
```bash
# Open .env.local
nano .env.local
# or
code .env.local
```

**Change this line:**
```env
VITE_API_URL=https://life-review-api.fly.dev/api
```

**To this:**
```env
VITE_API_URL=http://localhost:5001/api
```

#### B. Restart the frontend development server
If the frontend is already running, stop it (Ctrl+C) and restart:
```bash
npm run dev
```

Or if not running yet:
```bash
npm run dev
```

The frontend will now connect to your local backend at `http://localhost:5001/api`

---

## Running Both Together

### Option 1: Two Terminal Windows
**Terminal 1 - Backend:**
```bash
cd backend
./run_dev.sh
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Option 2: Using tmux/screen (Advanced)
```bash
# Start backend in background
cd backend && ./run_dev.sh &

# Start frontend
npm run dev
```

---

## Testing the Setup

### 1. Check Backend Health
```bash
curl http://localhost:5001/api/health
```

Expected: `{"status":"ok"}`

### 2. Test Text-to-Speech
```bash
curl -X POST http://localhost:5001/api/text-to-speech \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","voice":"nova"}' \
  --output test.mp3
```

Expected: Creates `test.mp3` file

### 3. Open the Frontend
Visit: http://localhost:5173

The app should now:
- Show "● Online" status in the top right
- Be able to use all voice features
- Connect to your local backend

---

## Troubleshooting

### Backend won't start
**Error: "OPENAI_API_KEY not set"**
- Solution: Make sure you edited `backend/.env` and added your API key

**Error: "Port 5001 already in use"**
- Solution: Kill the process using port 5001:
  ```bash
  lsof -ti:5001 | xargs kill -9
  ```

**Error: "ModuleNotFoundError"**
- Solution: Delete the virtual environment and reinstall:
  ```bash
  cd backend
  rm -rf venv
  rm venv/installed.marker
  ./run_dev.sh
  ```

### Frontend shows "● Offline"
**Possible causes:**
1. Backend isn't running → Start with `./run_dev.sh`
2. Wrong URL in `.env.local` → Check it says `http://localhost:5001/api`
3. CORS issue → Check `backend/.env` has `CORS_ORIGINS=http://localhost:8080`
4. Browser cache → Hard refresh (Cmd+Shift+R or Ctrl+Shift+F5)

### Voice features don't work
**Check:**
1. OpenAI API key is valid
2. You have credits in your OpenAI account
3. Check browser console for errors (F12 → Console)
4. Check backend terminal for error logs

---

## Switching Back to Production API

When you're done with local development:

**Edit `.env.local`:**
```env
VITE_API_URL=https://life-review-api.fly.dev/api
```

**Restart frontend:**
```bash
npm run dev
```

---

## Backend API Endpoints

Your local backend exposes these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/extract-questions` | POST | Extract questions from PDF |
| `/api/transcribe` | POST | Transcribe audio to text (Whisper) |
| `/api/text-to-speech` | POST | Convert text to speech (TTS) |
| `/api/analyze` | POST | Analyze user responses with AI |

---

## Environment Variables Reference

### Backend (`.env`)
```env
OPENAI_API_KEY=sk-...          # Required - Your OpenAI API key
FLASK_ENV=development          # development or production
SECRET_KEY=...                 # Any random string
DEBUG=True                     # Enable debug mode
CORS_ORIGINS=http://localhost:8080  # Frontend URL (port 8080)
PORT=5001                      # Backend port (different from frontend!)
```

### Frontend (`.env.local`)
```env
VITE_SUPABASE_URL=...          # Your Supabase project URL
VITE_SUPABASE_ANON_KEY=...     # Your Supabase anon key
VITE_API_URL=http://localhost:5001/api  # Local backend (port 5001)
VITE_ASSEMBLYAI_API_KEY=...    # For streaming transcription
```

---

## Need Help?

- Backend logs: Check the terminal where `run_dev.sh` is running
- Frontend logs: Open browser console (F12)
- API testing: Use Postman or curl to test endpoints directly
- Backend code: Check `backend/app/routes/api.py` for endpoint logic
