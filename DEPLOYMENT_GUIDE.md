# Complete Deployment Guide - Frontend & Backend

This guide covers deploying your Life Review AI application with:
- **Frontend**: React + Vite on Vercel
- **Backend**: Flask API on Fly.io

## 🎯 Architecture Overview

```
┌─────────────────┐         ┌──────────────────────┐
│                 │         │                      │
│  Vercel         │────────▶│  Fly.io              │
│  (Frontend)     │  HTTPS  │  (Backend API)       │
│                 │◀────────│                      │
└─────────────────┘         └──────────────────────┘
      │                              │
      │                              │
      ▼                              ▼
   React App                    Flask + OpenAI
   (Static)                      (Dynamic)
```

## Part 1: Deploy Backend to Fly.io

### Prerequisites
- Fly.io account (sign up at https://fly.io)
- OpenAI API key

### Step 1: Install Fly CLI

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

### Step 2: Login to Fly.io

```bash
flyctl auth login
```

### Step 3: Deploy Backend

```bash
cd backend
flyctl launch
```

Answer the prompts:
- **App name**: `life-review-api` (or your preferred name)
- **Region**: Choose closest to your users (e.g., `sjc` for San Jose)
- **PostgreSQL**: **No**
- **Redis**: **No**
- **Deploy now**: **Yes**

### Step 4: Set Environment Variables

```bash
# Set your OpenAI API key
flyctl secrets set OPENAI_API_KEY=sk-your-actual-key-here

# Generate and set a secure secret key
flyctl secrets set SECRET_KEY=$(openssl rand -hex 32)

# Set CORS origins (will update after Vercel deployment)
flyctl secrets set CORS_ORIGINS="https://your-app.vercel.app,http://localhost:5173"
```

### Step 5: Verify Backend Deployment

```bash
# Check status
flyctl status

# View logs
flyctl logs

# Test health endpoint
curl https://life-review-api.fly.dev/api/health
```

Expected response:
```json
{"service":"life-review-api","status":"healthy"}
```

### Step 6: Note Your Backend URL

Your backend is now live at:
```
https://life-review-api.fly.dev
```

---

## Part 2: Deploy Frontend to Vercel

### Prerequisites
- Vercel account (sign up at https://vercel.com)
- Git repository (GitHub, GitLab, or Bitbucket)

### Method A: Deploy via Vercel Dashboard (Recommended)

#### Step 1: Push to Git

```bash
# If not already initialized
git init
git add .
git commit -m "Prepare for deployment"

# Push to your repository
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

#### Step 2: Import to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your repository
4. Configure your project:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave as is)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

#### Step 3: Add Environment Variables

In Vercel project settings, add:

```
VITE_API_URL=https://life-review-api.fly.dev/api
```

#### Step 4: Deploy

Click "Deploy" and wait for the build to complete!

### Method B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (from project root)
vercel

# Follow the prompts:
# - Set up and deploy: Y
# - Scope: Your account
# - Link to existing project: N
# - Project name: life-review-app
# - Directory: ./
# - Override settings: N

# Set environment variable
vercel env add VITE_API_URL
# Enter: https://life-review-api.fly.dev/api
# Select: Production, Preview, Development

# Deploy to production
vercel --prod
```

---

## Part 3: Update CORS Configuration

After deploying to Vercel, you'll have a URL like:
```
https://your-app-name.vercel.app
```

### Update Backend CORS

```bash
cd backend
flyctl secrets set CORS_ORIGINS="https://your-app-name.vercel.app,http://localhost:5173,http://localhost:3000"
```

Or edit `backend/app/config/settings.py` and redeploy:
```bash
flyctl deploy
```

---

## Part 4: Verify Full Integration

### Test the Flow

1. **Visit your Vercel URL**:
   ```
   https://your-app-name.vercel.app/demo
   ```

2. **Check Backend Connection**:
   - Look for the green "● Online" indicator in the top right
   - If offline, check:
     - Backend is running: `flyctl status`
     - CORS is configured correctly
     - Environment variables are set

3. **Test Full Pipeline**:
   - Click "Start Interview"
   - Record an answer
   - Verify transcription and AI analysis work

---

## Environment Variables Reference

### Frontend (.env.local)
```env
VITE_API_URL=https://life-review-api.fly.dev/api
```

### Backend (Fly.io Secrets)
```bash
OPENAI_API_KEY=sk-...
SECRET_KEY=<generated-key>
CORS_ORIGINS=https://your-app.vercel.app,http://localhost:5173
```

---

## Useful Commands

### Backend (Fly.io)

```bash
# View status
flyctl status

# View logs (real-time)
flyctl logs -f

# SSH into container
flyctl ssh console

# Scale resources
flyctl scale memory 512
flyctl scale count 2

# View secrets
flyctl secrets list

# Update backend
cd backend
flyctl deploy

# Open in browser
flyctl open
```

### Frontend (Vercel)

```bash
# Deploy
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls

# Remove deployment
vercel remove <deployment-url>

# Set environment variable
vercel env add VITE_API_URL

# Open dashboard
vercel
```

---

## Troubleshooting

### Backend Issues

**"Backend Offline" in frontend**

1. Check backend is running:
   ```bash
   flyctl status
   curl https://life-review-api.fly.dev/api/health
   ```

2. Check backend logs:
   ```bash
   flyctl logs
   ```

3. Verify CORS:
   ```bash
   flyctl secrets list
   ```

**OpenAI API errors**

1. Verify API key is set:
   ```bash
   flyctl secrets list
   ```

2. Check API key is valid at https://platform.openai.com

3. Ensure you have credits available

### Frontend Issues

**Environment variables not working**

1. Redeploy after adding variables:
   ```bash
   vercel --prod
   ```

2. Verify in Vercel dashboard under Settings → Environment Variables

**CORS errors**

1. Update backend CORS to include your Vercel domain
2. Check browser console for exact error
3. Ensure protocol matches (https/http)

**Build fails**

1. Test build locally:
   ```bash
   npm run build
   ```

2. Check Vercel build logs
3. Ensure all dependencies are in package.json

---

## Custom Domain Setup

### For Vercel (Frontend)

1. Go to Vercel project settings → Domains
2. Add your custom domain (e.g., `app.yourdomain.com`)
3. Follow DNS configuration instructions
4. Update backend CORS with new domain:
   ```bash
   flyctl secrets set CORS_ORIGINS="https://app.yourdomain.com,https://your-app.vercel.app"
   ```

### For Fly.io (Backend)

1. Add certificate:
   ```bash
   flyctl certs add api.yourdomain.com
   ```

2. Configure DNS as instructed

3. Update frontend environment variable:
   ```bash
   vercel env add VITE_API_URL
   # Enter: https://api.yourdomain.com/api
   ```

---

## Cost Estimation

### Fly.io (Backend)
- **Free Tier**: 3 shared VMs, 256MB RAM each
- **With auto-sleep**: Should stay in free tier
- **If exceeding**: ~$5-10/month for small traffic

### Vercel (Frontend)
- **Hobby (Free)**:
  - 100GB bandwidth
  - Unlimited sites
  - Usually sufficient for personal projects
- **Pro**: $20/month if you need more

### OpenAI
- **TTS**: ~$0.015 per 1K characters
- **Whisper**: ~$0.006 per minute
- **GPT-4**: Variable, depends on usage
- **Estimate**: $5-20/month for moderate use

---

## Monitoring & Maintenance

### Set Up Monitoring

**Fly.io Metrics**:
Visit https://fly.io/dashboard to see:
- Request rates
- Error rates
- Response times
- Resource usage

**Vercel Analytics**:
Enable in Vercel dashboard:
- Page views
- Performance metrics
- Error tracking

### Regular Maintenance

```bash
# Update backend weekly
cd backend
git pull
flyctl deploy

# Update frontend automatically via Git
# Vercel auto-deploys on git push
```

---

## Next Steps

1. ✅ **Both services deployed**
2. 🔧 **Test full workflow**
3. 📊 **Set up monitoring**
4. 🔐 **Configure custom domains (optional)**
5. 📈 **Monitor costs and usage**
6. 🎨 **Customize branding**
7. 📱 **Test on mobile devices**

---

## Support Resources

- **Fly.io Docs**: https://fly.io/docs
- **Vercel Docs**: https://vercel.com/docs
- **OpenAI Docs**: https://platform.openai.com/docs

---

## Quick Reference

### URLs After Deployment

```bash
# Backend API
https://life-review-api.fly.dev/api

# Frontend
https://your-app-name.vercel.app

# Demo Page
https://your-app-name.vercel.app/demo
```

### Important Files

```
Frontend:
- .env.local               # Local environment variables
- vercel.json              # Vercel configuration
- src/lib/api-client.ts    # API client

Backend:
- backend/fly.toml         # Fly.io configuration
- backend/Dockerfile       # Container definition
- backend/app/config/settings.py  # CORS & settings
```

---

**You're all set! 🎉** Your Life Review AI is now live and ready to use!
