from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
from dotenv import load_dotenv
import os
from sqlalchemy import text
from datetime import datetime

from database import engine, Base, AsyncSessionLocal
from routers import auth, books, readings, recommendations, dashboard, social, users
from utils import setup_logging
from error_handlers import (
    BookshelfError, StorageError, DatabaseError, AuthenticationError, 
    ValidationError, ExternalAPIError
)

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

# Add production frontend URL if not already included
production_frontend = "https://libraria.up.railway.app"
if production_frontend not in cors_origins:
    cors_origins.append(production_frontend)

# Check if we're in production
is_production = os.getenv("RAILWAY_ENVIRONMENT") == "production" or os.getenv("PORT") is not None

# In production, use specific origins instead of wildcard to allow credentials
if is_production:
    # Use specific origins for production to allow credentials
    cors_origins = [
        "https://libraria.up.railway.app",
        "http://localhost:3000",  # Keep for local testing
    ]

logger.info(f"CORS origins configured: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Global exception handlers for our custom error types
@app.exception_handler(StorageError)
async def storage_error_handler(request: Request, exc: StorageError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message}
    )

@app.exception_handler(DatabaseError)
async def database_error_handler(request: Request, exc: DatabaseError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message}
    )

@app.exception_handler(AuthenticationError)
async def auth_error_handler(request: Request, exc: AuthenticationError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message}
    )

@app.exception_handler(ValidationError)
async def validation_error_handler(request: Request, exc: ValidationError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message}
    )

@app.exception_handler(ExternalAPIError)
async def external_api_error_handler(request: Request, exc: ExternalAPIError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message}
    )

@app.exception_handler(BookshelfError)
async def bookshelf_error_handler(request: Request, exc: BookshelfError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message}
    )

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "Bookshelf AI - Social Book Platform API is running!"}

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Test database connection
        async with AsyncSessionLocal() as db:
            await db.execute(text("SELECT 1"))
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": "bookshelf-ai-backend",
            "version": "2.0.0",
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": "bookshelf-ai-backend",
            "version": "2.0.0",
            "database": "disconnected",
            "error": str(e)
        }

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(books.router, prefix="/books", tags=["books"])
app.include_router(readings.router, prefix="/readings", tags=["readings"])
app.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(social.router, tags=["social"])
app.include_router(users.router, prefix="/users", tags=["users"])

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 