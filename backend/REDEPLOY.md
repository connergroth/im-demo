# How to Redeploy Backend to Fly.io

## Quick Redeploy

From the `backend` directory, run:

```bash
cd backend
flyctl deploy
```

That's it! The deployment will:
1. Build a new Docker image with your changes
2. Push it to Fly.io
3. Replace the running instance
4. Usually takes 1-2 minutes

## What Just Got Updated

The recent changes include:
- ✅ CORS configuration to support Vercel domains (`https://*.vercel.app`)
- ✅ Support for localhost development (`http://localhost:5173`)

## Verify the Deployment

### 1. Check Status
```bash
flyctl status
```

Expected output:
```
ID              = life-review-api
Status          = running
```

### 2. View Logs
```bash
flyctl logs
```

Look for:
```
Starting gunicorn...
Listening at: http://0.0.0.0:8080
```

### 3. Test Health Endpoint
```bash
curl https://life-review-api.fly.dev/api/health
```

Expected response:
```json
{"service":"life-review-api","status":"healthy"}
```

### 4. Test CORS (Optional)

From your terminal:
```bash
curl -X OPTIONS https://life-review-api.fly.dev/api/health \
  -H "Origin: https://your-app.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -i
```

Should show CORS headers in response.

## If You Need to Set Environment Variables

```bash
# Set or update a secret
flyctl secrets set OPENAI_API_KEY=sk-your-new-key

# Set CORS origins (if deploying to a new Vercel URL)
flyctl secrets set CORS_ORIGINS="https://your-new-app.vercel.app,http://localhost:5173"

# List all secrets
flyctl secrets list

# Remove a secret
flyctl secrets unset SECRET_NAME
```

**Note**: Setting secrets automatically triggers a redeploy!

## Common Deployment Commands

```bash
# View recent deployments
flyctl releases

# Rollback to previous version (if something breaks)
flyctl releases rollback

# SSH into the running container
flyctl ssh console

# View real-time logs
flyctl logs -f

# Restart the app
flyctl apps restart life-review-api

# Scale resources (if needed)
flyctl scale memory 512
flyctl scale count 2
```

## Deployment Checklist

Before deploying, make sure:

- [ ] You're in the `backend` directory
- [ ] Your changes are saved
- [ ] You've tested locally (optional)
- [ ] You have OpenAI API key set as secret

After deploying:

- [ ] Check `flyctl status` shows "running"
- [ ] Test health endpoint
- [ ] Check frontend can connect (green "● Online" indicator)
- [ ] Test full pipeline (record → transcribe → analyze)

## Testing Locally Before Deploy (Optional)

To test changes locally first:

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variable
export OPENAI_API_KEY=sk-your-key
export FLASK_ENV=development

# Run locally
python wsgi.py
```

Then test at `http://localhost:8080/api/health`

## Troubleshooting

### Deployment fails

Check build logs:
```bash
flyctl logs
```

Common issues:
- Missing dependencies in `requirements.txt`
- Syntax errors in Python files
- Dockerfile issues

### App won't start

```bash
# Check logs
flyctl logs

# SSH in to debug
flyctl ssh console

# Check if secrets are set
flyctl secrets list
```

### CORS still not working

Update and redeploy:
```bash
flyctl secrets set CORS_ORIGINS="https://your-exact-vercel-url.vercel.app,http://localhost:5173"
```

## Quick Reference

```bash
# Deploy
cd backend && flyctl deploy

# Check status
flyctl status

# View logs
flyctl logs -f

# Update secrets
flyctl secrets set KEY=value

# Rollback
flyctl releases rollback
```

---

**Your backend should now be redeployed with the latest changes!** 🚀

Test your frontend to confirm the connection: The green "● Online" indicator should appear.
