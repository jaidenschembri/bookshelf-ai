# Bookshelf AI Deployment Guide

## Overview
This guide covers deploying the Bookshelf AI application with:
- **Backend**: FastAPI on Railway with PostgreSQL
- **Frontend**: Next.js on Vercel
- **Database**: PostgreSQL (Railway/Supabase/Neon)

## Prerequisites
- Railway account (for backend)
- Vercel account (for frontend)
- PostgreSQL database (Railway/Supabase/Neon)
- Google OAuth credentials

## Backend Deployment (Railway)

### 1. Database Setup
Choose one of these PostgreSQL providers:

#### Option A: Railway PostgreSQL
1. Create a new Railway project
2. Add PostgreSQL service
3. Copy the connection string

#### Option B: Supabase (Recommended)
1. Create account at supabase.com
2. Create new project
3. Go to Settings > Database
4. Copy connection string (use "URI" format)

#### Option C: Neon
1. Create account at neon.tech
2. Create new project
3. Copy connection string

### 2. Backend Environment Variables
Add these to your Railway backend service:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://username:password@host:port/database

# CORS (your frontend URL)
CORS_ORIGINS=https://your-app.vercel.app,http://localhost:3000

# JWT Secret (generate a secure random string)
JWT_SECRET_KEY=your-super-secure-jwt-secret-key

# DeepSeek AI
DEEPSEEK_API_KEY=your-deepseek-api-key
```

### 3. Deploy Backend
1. Connect your GitHub repo to Railway
2. Select the `backend` folder as root directory
3. Railway will automatically detect the Dockerfile
4. Deploy!

The deployment will:
- Build the Docker container
- Run database migrations (`alembic upgrade head`)
- Start the FastAPI server

## Frontend Deployment (Vercel)

### 1. Frontend Environment Variables
Add these to your Vercel project:

```bash
# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Backend API
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

### 2. Deploy Frontend
1. Connect your GitHub repo to Vercel
2. Select the `frontend` folder as root directory
3. Vercel will automatically detect Next.js
4. Deploy!

## Database Migration

### Initial Setup
```bash
# In backend directory
alembic upgrade head
```

### Future Migrations
```bash
# Create new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head
```

## Environment Variables Reference

### Backend (.env)
```bash
DATABASE_URL=postgresql+asyncpg://user:pass@host:port/db
CORS_ORIGINS=https://your-app.vercel.app
JWT_SECRET_KEY=your-jwt-secret
DEEPSEEK_API_KEY=your-deepseek-key
```

### Frontend (.env.local)
```bash
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

## Google OAuth Setup

### 1. Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - `https://your-app.vercel.app/api/auth/callback/google`
   - `http://localhost:3000/api/auth/callback/google` (for development)

### 2. Copy Credentials
- Copy Client ID and Client Secret
- Add to your environment variables

## Troubleshooting

### Common Issues

#### Backend not connecting to database
- Check DATABASE_URL format
- Ensure database allows external connections
- Verify credentials

#### CORS errors
- Update CORS_ORIGINS with your frontend URL
- Check both development and production URLs

#### Authentication not working
- Verify Google OAuth credentials
- Check NEXTAUTH_URL matches your domain
- Ensure NEXTAUTH_SECRET is set

#### Database migrations failing
- Check database connection
- Ensure models are imported in alembic/env.py
- Run migrations manually if needed

### Health Checks
- Backend: `https://your-backend.railway.app/health`
- Frontend: `https://your-app.vercel.app`

## Production Checklist

### Before Deployment
- [ ] Database created and accessible
- [ ] All environment variables set
- [ ] Google OAuth configured
- [ ] CORS origins updated
- [ ] JWT secrets generated

### After Deployment
- [ ] Backend health check passes
- [ ] Frontend loads correctly
- [ ] Authentication works
- [ ] Database operations work
- [ ] API calls successful

## Monitoring

### Railway (Backend)
- Check deployment logs
- Monitor resource usage
- Set up alerts

### Vercel (Frontend)
- Check function logs
- Monitor performance
- Review analytics

## Scaling Considerations

### Database
- Monitor connection pool usage
- Consider read replicas for heavy read workloads
- Set up automated backups

### Backend
- Railway auto-scales based on usage
- Monitor response times
- Consider caching for frequently accessed data

### Frontend
- Vercel handles scaling automatically
- Monitor Core Web Vitals
- Optimize images and assets 