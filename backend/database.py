from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os
from dotenv import load_dotenv
import logging

load_dotenv()

# Initialize logger
logger = logging.getLogger(__name__)

# Determine environment
is_production = os.getenv("RAILWAY_ENVIRONMENT") == "production" or os.getenv("PORT") is not None

if is_production:
    # Production: Use PostgreSQL from Railway environment
    DATABASE_URL = os.getenv("DATABASE_URL")
    if not DATABASE_URL:
        raise ValueError("DATABASE_URL environment variable is required for production")
    
    logger.info("Production environment detected - using PostgreSQL")
    
    # Note: For Railway deployment with Supabase, use Session Mode connection string:
    # postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
    # This provides IPv4/IPv6 compatibility and is ideal for persistent applications
    
    # Handle different PostgreSQL URL formats and ensure asyncpg driver
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    elif DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    # Production PostgreSQL configuration
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,  # Disable SQL logging in production
        future=True,
        pool_size=10,
        max_overflow=20,
        pool_timeout=30,
        pool_recycle=3600,
        pool_pre_ping=True,
        # Basic connection settings
        connect_args={
            "command_timeout": 60,
            "server_settings": {
                "application_name": "bookshelf-ai-backend",
            },
        }
    )
else:
    # Development: Use SQLite
    DATABASE_URL = "sqlite+aiosqlite:///./bookshelf.db"
    logger.info("Development environment detected - using SQLite")
    
    engine = create_async_engine(
        DATABASE_URL,
        echo=True,  # Enable SQL logging for development
        future=True,
        connect_args={"check_same_thread": False}
    )

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Database session error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close() 