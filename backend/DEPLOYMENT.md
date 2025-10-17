# Deployment Guide - Fly.io

This guide will walk you through deploying the Life Review API to Fly.io.

## Prerequisites

1. **OpenAI API Key**: You need an active OpenAI API key
2. **Fly.io Account**: Sign up at https://fly.io

## Step 1: Install Fly CLI

### macOS
```bash
brew install flyctl
```

### Linux
```bash
curl -L https://fly.io/install.sh | sh
```

### Windows
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

Verify installation:
```bash
flyctl version
```

## Step 2: Authenticate with Fly.io

Sign up (if new user):
```bash
flyctl auth signup
```

Or log in (if existing user):
```bash
flyctl auth login
```

## Step 3: Prepare Your Application

Make sure you're in the backend directory:
```bash
cd backend
```

## Step 4: Launch Your Application

Initialize and deploy:
```bash
flyctl launch
```

This command will:
1. Detect your Dockerfile
2. Ask for an app name (or use the one in fly.toml)
3. Ask to select a region (choose the closest to your users)
4. Ask about PostgreSQL database (select "No" - we don't need it)
5. Ask about Redis (select "No")
6. Build and deploy your container

**Important answers:**
- App name: `life-review-api` (or your preferred name)
- Region: Choose closest to you (e.g., `sjc` for San Jose)
- PostgreSQL: **No**
- Redis: **No**
- Deploy now: **Yes**

## Step 5: Set Environment Variables

After the first deployment, set your secrets:

```bash
flyctl secrets set OPENAI_API_KEY=sk-your-actual-key-here
```

Optional additional secrets:
```bash
flyctl secrets set SECRET_KEY=$(openssl rand -hex 32)
```

## Step 6: Verify Deployment

Check app status:
```bash
flyctl status
```

View logs:
```bash
flyctl logs
```

Open in browser:
```bash
flyctl open
```

Test the health endpoint:
```bash
curl https://your-app-name.fly.dev/api/health
```

## Step 7: Subsequent Deployments

After making changes, deploy updates with:
```bash
flyctl deploy
```

## Useful Commands

### View application info
```bash
flyctl info
```

### Scale the application
```bash
flyctl scale count 2  # Run 2 instances
flyctl scale vm shared-cpu-1x --memory 1024  # Increase memory
```

### SSH into your container
```bash
flyctl ssh console
```

### View secrets
```bash
flyctl secrets list
```

### Remove a secret
```bash
flyctl secrets unset SECRET_NAME
```

### View certificates
```bash
flyctl certs list
```

### Check releases
```bash
flyctl releases
```

### Rollback to previous version
```bash
flyctl releases rollback
```

### Destroy the app (careful!)
```bash
flyctl apps destroy your-app-name
```

## Monitoring

### Real-time logs
```bash
flyctl logs -f
```

### Dashboard
Visit https://fly.io/dashboard to see:
- App status
- Metrics
- Logs
- Certificates
- Billing

## Troubleshooting

### Build fails
1. Check Dockerfile syntax
2. Ensure requirements.txt is valid
3. Review build logs: `flyctl logs`

### App crashes on startup
1. Check logs: `flyctl logs`
2. Verify environment variables: `flyctl secrets list`
3. SSH in to debug: `flyctl ssh console`

### API not responding
1. Check if app is running: `flyctl status`
2. Verify health endpoint: `curl https://your-app.fly.dev/api/health`
3. Check logs for errors: `flyctl logs`

### Out of memory
```bash
flyctl scale memory 1024  # Increase to 1GB
```

### Slow responses
```bash
flyctl scale count 2  # Add more instances
```

## Cost Optimization

Fly.io free tier includes:
- Up to 3 shared-cpu-1x VMs with 256MB RAM
- 160GB outbound data transfer

For this app, the default configuration should stay within free limits if traffic is moderate.

To minimize costs:
1. Use `auto_stop_machines = true` in fly.toml (already configured)
2. Set `min_machines_running = 0` (already configured)
3. Machines will auto-sleep after 5 minutes of inactivity
4. They wake up automatically on new requests

## Custom Domain (Optional)

To use a custom domain:

1. Add certificate:
```bash
flyctl certs add yourdomain.com
```

2. Update DNS with the provided values

3. Verify:
```bash
flyctl certs show yourdomain.com
```

## Environment-Specific Deployments

To deploy different environments:

### Production
```bash
flyctl deploy --config fly.toml
```

### Staging
Create `fly.staging.toml` and deploy:
```bash
flyctl deploy --config fly.staging.toml
```

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Fly.io

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

Get your API token:
```bash
flyctl auth token
```

Add it to GitHub repository secrets as `FLY_API_TOKEN`.

## Next Steps

1. Update CORS_ORIGINS in fly.toml to match your frontend domain
2. Set up monitoring and alerts in Fly.io dashboard
3. Configure custom domain if needed
4. Set up CI/CD for automatic deployments
5. Consider adding Redis for session management
6. Add rate limiting for production use

## Support

- Fly.io Docs: https://fly.io/docs
- Community Forum: https://community.fly.io
- Status: https://status.fly.io
