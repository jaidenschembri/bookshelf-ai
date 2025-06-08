from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from dotenv import load_dotenv
import os

from database import engine, Base
from routers import auth, books, readings, recommendations, dashboard, social, users, email_auth
from utils import setup_logging

load_dotenv()

# Initialize logging
logger = setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Database initialization - SAFE for local dev, MIGRATIONS for production
    logger.info("Starting application - checking database tables")
    
    # Check if we're in production (Railway sets this)
    is_production = os.getenv("RAILWAY_ENVIRONMENT") == "production"
    
    if is_production:
        logger.info("🔴 PRODUCTION MODE: Using migrations only - NO create_all()")
        # In production, migrations should have already been applied
        # during the deployment process via railway_deploy.py
    else:
        logger.info("🟡 DEVELOPMENT MODE: Safe to use create_all() with checkfirst=True")
        async with engine.begin() as conn:
            # Only create tables that don't exist, never modify existing ones
            await conn.run_sync(Base.metadata.create_all, checkfirst=True)
    
    logger.info("Database initialization completed")
    yield
    logger.info("Application shutdown")

app = FastAPI(
    title="Bookshelf AI API",
    description="Social book recommendation platform with AI-powered suggestions - like Letterboxd for books",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
# Remove empty strings from the list
cors_origins = [origin.strip() for origin in cors_origins if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(email_auth.router, tags=["email-authentication"])  # New email auth
app.include_router(books.router, prefix="/books", tags=["books"])
app.include_router(readings.router, prefix="/readings", tags=["readings"])
app.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(social.router, tags=["social"])
app.include_router(users.router, tags=["users"])

@app.get("/")
async def root():
    return {"message": "Bookshelf AI - Social Book Platform API is running!"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 