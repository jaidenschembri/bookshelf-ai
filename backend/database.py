from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# Railway provides DATABASE_URL, but we need to handle both Railway and local development
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./bookshelf.db")

# Railway uses postgres:// but we need postgresql+asyncpg://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+asyncpg://", 1)

# Configure engine based on database type
if DATABASE_URL.startswith("postgresql"):
    # For PostgreSQL, use asyncpg driver
    if not DATABASE_URL.startswith("postgresql+asyncpg://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    
    engine = create_async_engine(
        DATABASE_URL,
        echo=True,
        future=True,
        pool_size=20,
        max_overflow=0,
    )
else:
    # For SQLite, use aiosqlite driver
    engine = create_async_engine(
        DATABASE_URL,
        echo=True,
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
        finally:
            await session.close() 