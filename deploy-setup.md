# Railway Deployment Setup

## 1. Push to GitHub
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

## 2. Railway Setup
1. Go to https://railway.app
2. Sign up with GitHub
3. Create new project
4. Connect your GitHub repository

## 3. Deploy Backend
1. Select your repo
2. Railway will detect it's a Python app
3. Add these environment variables in Railway dashboard:
   - `DEEPSEEK_API_KEY` = your_deepseek_api_key
   - `JWT_SECRET_KEY` = your_jwt_secret_key
   - `CORS_ORIGINS` = https://your-frontend-url.railway.app
   
## 4. Deploy Frontend  
1. Add another service from same repo
2. Set root directory to `frontend`
3. Add these environment variables:
   - `NEXTAUTH_URL` = https://your-frontend-url.railway.app
   - `NEXTAUTH_SECRET` = your_nextauth_secret
   - `GOOGLE_CLIENT_ID` = your_google_client_id
   - `GOOGLE_CLIENT_SECRET` = your_google_client_secret
   - `NEXT_PUBLIC_API_URL` = https://your-backend-url.railway.app

## 5. Add PostgreSQL Database
1. In Railway dashboard, click "Add Service"
2. Select "PostgreSQL"
3. Railway will automatically set DATABASE_URL for your backend

## 6. Run Migrations
After deployment, run migrations:
```bash
# In Railway backend service terminal
python db_manager.py migrate
```

## Environment Variables Summary

### Backend (.env for local, Railway dashboard for production):
- `DATABASE_URL` = (Railway sets this automatically)
- `DEEPSEEK_API_KEY` = your_deepseek_api_key
- `JWT_SECRET_KEY` = long_random_string
- `CORS_ORIGINS` = https://your-frontend-url.railway.app

### Frontend (.env.local for local, Railway dashboard for production):
- `NEXTAUTH_URL` = https://your-frontend-url.railway.app
- `NEXTAUTH_SECRET` = long_random_string  
- `GOOGLE_CLIENT_ID` = your_google_oauth_id
- `GOOGLE_CLIENT_SECRET` = your_google_oauth_secret
- `NEXT_PUBLIC_API_URL` = https://your-backend-url.railway.app 