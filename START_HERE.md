# Quick Start Guide

## The Error You're Seeing

```
Failed to load resource: net::ERR_EMPTY_RESPONSE
```

**This means the backend server isn't running!**

## Fix in 3 Steps

### 1. Start the Backend

```bash
cd backend
./run_dev.sh
```

You should see:

```
✅ Starting Flask server on http://localhost:5001
```

### 2. Verify Backend is Running

Open in browser or run:

```bash
curl http://localhost:5001/api/health
```

Should return:

```json
{ "status": "healthy", "service": "life-review-api" }
```

### 3. Start the Frontend

In a NEW terminal:

```bash
npm run dev
```

## If Backend Won't Start

### Check .env File

```bash
cd backend
cat .env
```

Should contain:

```env
OPENAI_API_KEY=sk-proj-...your-key...
SUPABASE_URL=https://...your-project...supabase.co
SUPABASE_SERVICE_KEY=eyJ...your-service-key...
ASSEMBLYAI_API_KEY=...your-assemblyai-key...
PORT=5001
CHAT_MODEL=gpt-4o-mini
```

### Create .env if Missing

```bash
cd backend
cp .env.example .env
# Then edit .env and add your keys
```

### Install Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## About TTS Caching

**Good news!** Your questions ARE permanently cached:

- ✅ Questions cached to Supabase database (permanent)
- ✅ Shared across ALL users
- ✅ NEVER regenerated after first time
- ✅ Instant playback for all users

The system is already optimal. You just need the backend running!

## Quick Test

1. Start backend: `cd backend && ./run_dev.sh`
2. Start frontend: `npm run dev`
3. Open http://localhost:5173
4. Click "Begin Your Story"
5. Should hear intro audio (will cache on first play)
6. Next time = instant!

## Architecture Summary

```
Your Browser (localhost:5173)
    ↓ API calls
Backend Server (localhost:5001)
    ↓ Check cache
Supabase (permanent storage)
    ↓ If not cached
OpenAI TTS API (generate once)
    ↓ Save forever
Back to Supabase
```

After first generation:

- All users get instant audio
- Zero OpenAI API calls
- Questions cached FOREVER

**This is already implemented and working!**

Just need the backend running. 🚀



