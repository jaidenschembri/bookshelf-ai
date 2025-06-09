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
    
    # Handle different PostgreSQL URL formats and ensure asyncpg driver
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)
    elif DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    # For Supabase: Use direct connection instead of pooler to avoid pgbouncer issues
    if "pooler.supabase.com:6543" in DATABASE_URL:
        logger.info("Supabase pooler detected. Attempting to switch to a direct connection...")
        try:
            # Parse the URL more carefully
            # Example URL: postgresql+asyncpg://postgres.bmgmgscghehroogkssgq:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
            
            # Split into parts
            protocol_and_auth = DATABASE_URL.split('@')[0]  # postgresql+asyncpg://postgres.bmgmgscghehroogkssgq:password
            host_and_db = DATABASE_URL.split('@')[1]        # aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
            
            # Extract project reference from the auth part
            # From postgres.bmgmgscghehroogkssgq:password, get bmgmgscghehroogkssgq
            auth_part = protocol_and_auth.split('://')[-1]  # postgres.bmgmgscghehroogkssgq:password
            project_ref = auth_part.split(':')[0].split('.')[1]  # bmgmgscghehroogkssgq
            
            # Extract database name from the end
            db_name = host_and_db.split('/')[-1]  # postgres
            
            # Create the new direct connection URL
            new_host = f"db.{project_ref}.supabase.co:5432"
            DATABASE_URL = f"{protocol_and_auth}@{new_host}/{db_name}"
            
            logger.info(f"Successfully switched from Supabase pooler to direct connection: {new_host}")
        except (IndexError, ValueError) as e:
            logger.error(f"Could not parse project reference from Supabase URL: {e}. Continuing with pooler.")
    
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