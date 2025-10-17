# Quick Vercel Deployment Guide

Deploy your Life Review frontend to Vercel in 5 minutes!

## Prerequisites

✅ Backend already deployed to Fly.io at: `https://life-review-api.fly.dev`
✅ Code pushed to Git (GitHub, GitLab, or Bitbucket)

## Option 1: Deploy via Vercel Dashboard (Easiest)

### Step 1: Go to Vercel

Visit: https://vercel.com/new

### Step 2: Import Repository

1. Click "Import Git Repository"
2. Authorize Vercel to access your Git provider
3. Select your repository (`im-demo`)
4. Click "Import"

### Step 3: Configure Project

Vercel will auto-detect your Vite project. Confirm these settings:

- **Framework Preset**: Vite ✅
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 4: Add Environment Variable

Click "Environment Variables" and add:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://life-review-api.fly.dev/api` |

Make sure to select: **Production**, **Preview**, and **Development**

### Step 5: Deploy!

Click "Deploy" and wait 1-2 minutes.

### Step 6: Update Backend CORS

Once deployed, copy your Vercel URL (e.g., `https://your-app-name.vercel.app`)

Update backend CORS:
```bash
cd backend
flyctl secrets set CORS_ORIGINS="https://your-app-name.vercel.app,http://localhost:5173"
```

### Step 7: Test Your App

Visit: `https://your-app-name.vercel.app/demo`

---

## Option 2: Deploy via CLI

### Install Vercel CLI

```bash
npm install -g vercel
```

### Login

```bash
vercel login
```

### Deploy

```bash
# From project root
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? [Your account]
# - Link to existing project? N
# - What's your project's name? life-review-app
# - In which directory is your code located? ./
# - Want to override the settings? N
```

### Add Environment Variable

```bash
vercel env add VITE_API_URL production
# Enter: https://life-review-api.fly.dev/api
```

### Deploy to Production

```bash
vercel --prod
```

### Update Backend CORS

```bash
cd backend
flyctl secrets set CORS_ORIGINS="https://your-deployed-url.vercel.app,http://localhost:5173"
```

---

## Verify Deployment

1. **Open your app**: `https://your-app-name.vercel.app/demo`

2. **Check backend status**: Look for green "● Online" indicator

3. **Test features**:
   - Click "Start Interview"
   - Question should be spoken aloud
   - Record an answer
   - Check transcription works
   - Verify AI analysis appears

---

## Common Issues

### "Backend Offline" error

**Solution**: Check backend CORS includes your Vercel domain:
```bash
flyctl secrets list
flyctl secrets set CORS_ORIGINS="https://your-app.vercel.app,http://localhost:5173"
```

### Environment variable not working

**Solution**: Redeploy after adding variable:
```bash
vercel --prod
```

### Build fails

**Solution**: Test locally first:
```bash
npm run build
```

---

## Update After Changes

### Automatic (Recommended)

Just push to your git repository:
```bash
git add .
git commit -m "Update features"
git push
```

Vercel automatically rebuilds and deploys!

### Manual

```bash
vercel --prod
```

---

## Your URLs

After deployment, you'll have:

- **Homepage**: `https://your-app-name.vercel.app`
- **Demo**: `https://your-app-name.vercel.app/demo`
- **Backend API**: `https://life-review-api.fly.dev/api`

---

## Next Steps

1. ✅ Frontend deployed on Vercel
2. ✅ Backend running on Fly.io
3. ✅ CORS configured
4. 📱 Test on mobile devices
5. 🎨 Customize your landing page
6. 🔐 Add custom domain (optional)

---

## Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/support
- **Check Deployment Logs**: In Vercel dashboard → Deployments → [Your deployment] → Build Logs

---

**Congratulations!** 🎉 Your app is live!

Share your demo: `https://your-app-name.vercel.app/demo`
