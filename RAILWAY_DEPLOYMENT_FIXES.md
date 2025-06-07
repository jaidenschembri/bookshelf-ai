# Railway Deployment Fixes

## Issues Fixed

### 1. Permissions-Policy Header Error
**Error**: `Error with Permissions-Policy header: Unrecognized feature: 'browsing-topics'`

**Fix**: Added proper security headers in `frontend/next.config.js`:
```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
        },
        // Additional security headers...
      ]
    }
  ]
}
```

### 2. Process Environment Variable Error
**Error**: `Uncaught ReferenceError: process is not defined`

**Fix**: Removed client-side `process.env` access in `frontend/lib/api.ts`:
- Removed: `console.log('🌐 NEXT_PUBLIC_API_URL env var:', process.env.NEXT_PUBLIC_API_URL)`
- Only `NEXT_PUBLIC_*` variables are available in the browser, but `process.env` object itself is not

## Railway Deployment Setup

### 1. Backend Service Configuration

**Environment Variables** (Set in Railway Dashboard):
```
DEEPSEEK_API_KEY=your_deepseek_api_key_here
JWT_SECRET_KEY=your_jwt_secret_key_here
CORS_ORIGINS=https://your-frontend-url.railway.app
DATABASE_URL=postgresql://... (Railway auto-generates this)
```

**Files**:
- `backend/railway.json` - Railway configuration
- `backend/Procfile` - Process definition
- `backend/requirements.txt` - Python dependencies

### 2. Frontend Service Configuration

**Environment Variables** (Set in Railway Dashboard):
```
NEXTAUTH_URL=https://your-frontend-url.railway.app
NEXTAUTH_SECRET=your_nextauth_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

**Files**:
- `frontend/railway.json` - Railway configuration
- `frontend/package.json` - Node.js dependencies and scripts

### 3. Database Setup

Railway will automatically provide a PostgreSQL database. The `DATABASE_URL` environment variable will be set automatically.

After deployment, run database migrations:
1. Go to your backend service in Railway
2. Open the terminal/console
3. Run: `python db_manager.py migrate`

## Health Check Endpoints

Added health check endpoints for monitoring:
- Backend: `https://your-backend-url.railway.app/health`
- Frontend: `https://your-frontend-url.railway.app/api/health`

## Environment Debugging

For debugging environment variables (development only):
- Frontend: `https://your-frontend-url.railway.app/api/env-check`

## Deployment Steps

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Fix Railway deployment issues"
   git push origin main
   ```

2. **Create Railway Project**:
   - Go to https://railway.app
   - Create new project from GitHub repo

3. **Deploy Backend**:
   - Railway will auto-detect Python app
   - Set environment variables listed above
   - Deploy will start automatically

4. **Deploy Frontend**:
   - Add new service from same repo
   - Set root directory to `frontend`
   - Set environment variables listed above
   - Deploy will start automatically

5. **Add Database**:
   - Add PostgreSQL service to project
   - Railway will automatically connect it to backend

6. **Run Migrations**:
   - Access backend service terminal
   - Run: `python db_manager.py migrate`

## Common Issues & Solutions

### CORS Errors
- Ensure `CORS_ORIGINS` in backend includes your frontend URL
- Use HTTPS URLs for production

### Authentication Issues
- Verify all Google OAuth credentials are set
- Ensure `NEXTAUTH_URL` matches your frontend domain
- Check that `NEXT_PUBLIC_API_URL` points to your backend

### Database Connection
- Railway auto-generates `DATABASE_URL`
- Ensure migrations are run after deployment
- Check backend logs for database connection errors

## Testing Deployment

1. Visit your frontend URL
2. Try Google OAuth login
3. Check browser console for errors
4. Test API endpoints via health checks
5. Verify book search and recommendations work

## Monitoring

- Use Railway's built-in logging and metrics
- Monitor health check endpoints
- Check browser console for client-side errors
- Review backend logs for API errors 