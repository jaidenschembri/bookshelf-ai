#!/usr/bin/env python3
"""
Database Management Script for Bookshelf AI

This script helps manage database operations including:
- Creating tables
- Running migrations
- Switching between SQLite (dev) and PostgreSQL (prod)
"""

import asyncio
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from alembic.config import Config
from alembic import command
import subprocess

# Add current directory to path
sys.path.append(str(Path(__file__).parent))

from database import engine, Base
from models import User, Book, Reading, Recommendation

load_dotenv()

async def create_tables():
    """Create all tables in the database"""
    print("Creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tables created successfully!")

async def drop_tables():
    """Drop all tables in the database"""
    print("Dropping database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    print("✅ Tables dropped successfully!")

def run_migrations():
    """Run Alembic migrations"""
    print("Running database migrations...")
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")
    print("✅ Migrations completed successfully!")

def create_migration(message: str):
    """Create a new migration"""
    print(f"Creating migration: {message}")
    alembic_cfg = Config("alembic.ini")
    command.revision(alembic_cfg, autogenerate=True, message=message)
    print("✅ Migration created successfully!")

def show_current_revision():
    """Show current database revision"""
    alembic_cfg = Config("alembic.ini")
    command.current(alembic_cfg)

def show_migration_history():
    """Show migration history"""
    alembic_cfg = Config("alembic.ini")
    command.history(alembic_cfg)

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

def setup_postgresql():
    """Instructions for setting up PostgreSQL"""
    print("""
🐘 PostgreSQL Setup Instructions:

1. Install PostgreSQL:
   - Windows: Download from https://www.postgresql.org/download/windows/
   - macOS: brew install postgresql
   - Linux: sudo apt-get install postgresql postgresql-contrib

2. Create a database:
   createdb bookshelf_ai

3. Update your .env file with:
   DATABASE_URL=postgresql+asyncpg://username:password@localhost/bookshelf_ai

4. Run migrations:
   python db_manager.py migrate

For production (like Railway, Heroku, etc.), use the provided DATABASE_URL.
    """)

async def main():
    if len(sys.argv) < 2:
        print("""
📚 Bookshelf AI Database Manager

Usage: python db_manager.py <command>

Commands:
  create-tables    - Create all database tables
  drop-tables      - Drop all database tables  
  migrate          - Run database migrations
  create-migration - Create a new migration (requires message)
  current          - Show current database revision
  history          - Show migration history
  check            - Check database connection
  setup-postgres   - Show PostgreSQL setup instructions
  reset            - Drop tables and recreate (DESTRUCTIVE!)

Examples:
  python db_manager.py migrate
  python db_manager.py create-migration "Add user preferences"
  python db_manager.py check
        """)
        return

    command = sys.argv[1]
    
    if command == "create-tables":
        await create_tables()
    elif command == "drop-tables":
        await drop_tables()
    elif command == "migrate":
        run_migrations()
    elif command == "create-migration":
        if len(sys.argv) < 3:
            print("❌ Please provide a migration message")
            print("Example: python db_manager.py create-migration 'Add user preferences'")
            return
        message = sys.argv[2]
        create_migration(message)
    elif command == "current":
        show_current_revision()
    elif command == "history":
        show_migration_history()
    elif command == "check":
        await check_database_connection()
    elif command == "setup-postgres":
        setup_postgresql()
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