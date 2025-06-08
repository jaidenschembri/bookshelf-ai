#!/usr/bin/env python3
"""
Database Management Script for Bookshelf AI

This script helps manage database operations with Supabase:
- Creating tables
- Checking database connection
- Resetting database (development only)
"""

import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(str(Path(__file__).parent))

from database import engine, Base
from models import User, Book, Reading, Recommendation

load_dotenv()

async def create_tables():
    """Create all tables in the database"""
    print("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all, checkfirst=True)
    print("✅ Tables created successfully!")

async def drop_tables():
    """Drop all tables in the database"""
    print("Dropping database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    print("✅ Tables dropped successfully!")

async def check_database_connection():
    """Check if database connection is working"""
    try:
        from sqlalchemy import text
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            result.fetchone()
        print("✅ Database connection successful!")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def setup_supabase():
    """Instructions for setting up Supabase"""
    print("""
🚀 Supabase Setup Instructions:

1. Go to https://supabase.com and create an account
2. Create a new project
3. Get your connection string from Settings > Database
4. Update your .env file with:
   DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

5. Add the same DATABASE_URL to Railway environment variables

For schema changes:
- Use Supabase dashboard SQL editor or Table editor
- Update your models.py to match
- Deploy - create_all() will handle the rest safely
    """)

async def main():
    if len(sys.argv) < 2:
        print("""
📚 Bookshelf AI Database Manager (Supabase Edition)

Usage: python db_manager.py <command>

Commands:
  create-tables    - Create all database tables
  drop-tables      - Drop all database tables  
  check            - Check database connection
  setup-supabase   - Show Supabase setup instructions
  reset            - Drop tables and recreate (DESTRUCTIVE!)

Examples:
  python db_manager.py check
  python db_manager.py create-tables
        """)
        return

    command = sys.argv[1]
    
    if command == "create-tables":
        await create_tables()
    elif command == "drop-tables":
        await drop_tables()
    elif command == "check":
        await check_database_connection()
    elif command == "setup-supabase":
        setup_supabase()
    elif command == "reset":
        print("⚠️  This will delete all data! Are you sure? (y/N)")
        response = input().lower()
        if response == 'y':
            await drop_tables()
            await create_tables()
            print("✅ Database reset complete!")
        else:
            print("❌ Reset cancelled")
    else:
        print(f"❌ Unknown command: {command}")

if __name__ == "__main__":
    asyncio.run(main()) 