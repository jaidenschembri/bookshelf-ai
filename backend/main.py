from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from dotenv import load_dotenv
import os
from sqlalchemy import text

from database import engine, Base, AsyncSessionLocal
from routers import auth, books, readings, recommendations, dashboard, social, users, email_auth
from utils import setup_logging

load_dotenv()

# Initialize logging
logger = setup_logging()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Database initialization - environment-aware
    is_production = os.getenv("RAILWAY_ENVIRONMENT") == "production" or os.getenv("PORT") is not None
    db_type = "PostgreSQL" if is_production else "SQLite"
    
    logger.info(f"Starting Bookshelf AI backend ({db_type})")
    logger.info("Initializing database tables...")
    
    try:
        # Always use create_all with checkfirst=True - safe for both environments
        async with engine.begin() as conn:
            # Only create tables that don't exist, never modify existing ones
            await conn.run_sync(Base.metadata.create_all, checkfirst=True)
        
        logger.info(f"Database tables ready ({db_type})")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise
    
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

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for Railway deployment"""
    is_production = os.getenv("RAILWAY_ENVIRONMENT") == "production" or os.getenv("PORT") is not None
    db_type = "PostgreSQL" if is_production else "SQLite"
    environment = "production" if is_production else "development"
    
    try:
        # Test database connectivity
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            result.scalar()
        
        return {
            "status": "healthy",
            "database": "connected",
            "database_type": db_type,
            "environment": environment,
            "message": f"Bookshelf AI backend running normally ({db_type})"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "database": "disconnected",
                "database_type": db_type,
                "environment": environment,
                "error": str(e),
                "message": "Service is experiencing issues"
            }
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

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 