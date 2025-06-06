#!/usr/bin/env python3
"""
Setup script for PostgreSQL database initialization
Run this after setting up your PostgreSQL database
"""

import asyncio
import os
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from database import Base

load_dotenv()

async def setup_database():
    """Initialize the database with all tables"""
    database_url = os.getenv("DATABASE_URL")
    
    if not database_url:
        print("❌ DATABASE_URL not found in environment variables")
        print("Please set DATABASE_URL in your .env file")
        return
    
    if not database_url.startswith("postgresql"):
        print("⚠️  This script is for PostgreSQL setup only")
        print("Current DATABASE_URL:", database_url)
        return
    
    print("🚀 Setting up PostgreSQL database...")
    print("Database URL:", database_url.split('@')[0] + '@***')
    
    try:
        # Create async engine
        engine = create_async_engine(database_url, echo=True)
        
        # Create all tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        print("✅ Database setup completed successfully!")
        print("All tables created:")
        for table_name in Base.metadata.tables.keys():
            print(f"  - {table_name}")
            
    except Exception as e:
        print(f"❌ Error setting up database: {e}")
        print("\nTroubleshooting tips:")
        print("1. Check your DATABASE_URL format")
        print("2. Ensure PostgreSQL server is running")
        print("3. Verify database credentials")
        print("4. Make sure the database exists")
    
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(setup_database()) 