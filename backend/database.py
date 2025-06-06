from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./bookshelf.db")

# Database configuration based on the database type
if DATABASE_URL.startswith("postgresql"):
    # PostgreSQL configuration for production
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,  # Set to False in production
        future=True,
        pool_size=20,
        max_overflow=0,
        pool_pre_ping=True,
        pool_recycle=300,
    )
else:
    # SQLite configuration for development
    engine = create_async_engine(
        DATABASE_URL,
        echo=True,
        future=True
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
        finally:
            await session.close()