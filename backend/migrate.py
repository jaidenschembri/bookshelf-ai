#!/usr/bin/env python3
"""
Safe Database Migration Script for Bookshelf AI

This script ensures database changes never destroy user data.
Use this instead of direct create_all() calls.

Usage:
  python migrate.py check     # Check current database state
  python migrate.py migrate   # Apply pending migrations
  python migrate.py create    # Create new migration file
"""

import asyncio
import os
import sys
import subprocess
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

# Load environment variables
load_dotenv()

def run_alembic_command(command: str):
    """Run an Alembic command safely"""
    try:
        result = subprocess.run(
            f"alembic {command}",
            shell=True,
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent
        )
        
        if result.returncode == 0:
            print(f"✅ Alembic command succeeded: {command}")
            if result.stdout:
                print(result.stdout)
        else:
            print(f"❌ Alembic command failed: {command}")
            if result.stderr:
                print(result.stderr)
            return False
        return True
    except Exception as e:
        print(f"❌ Error running Alembic command: {e}")
        return False

async def check_database_state():
    """Check current database state without making changes"""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("❌ No DATABASE_URL found in environment variables")
        return False
    
    # Convert to async format if needed
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    print(f"🔗 Checking database state...")
    
    try:
        engine = create_async_engine(database_url, echo=False)
        
        async with engine.begin() as conn:
            # Check if alembic_version table exists
            if "sqlite" in database_url:
                result = await conn.execute(text("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name='alembic_version';
                """))
            else:
                result = await conn.execute(text("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' AND table_name = 'alembic_version';
                """))
            
            has_alembic = result.fetchone() is not None
            
            if has_alembic:
                # Get current migration version
                result = await conn.execute(text("SELECT version_num FROM alembic_version;"))
                current_version = result.scalar()
                print(f"📍 Current migration version: {current_version}")
            else:
                print("⚠️  No migration tracking found - database needs initialization")
            
            # Count existing data
            try:
                result = await conn.execute(text("SELECT COUNT(*) FROM users;"))
                user_count = result.scalar()
                print(f"👥 Users in database: {user_count}")
                
                result = await conn.execute(text("SELECT COUNT(*) FROM books;"))
                book_count = result.scalar()
                print(f"📚 Books in database: {book_count}")
                
                result = await conn.execute(text("SELECT COUNT(*) FROM readings;"))
                reading_count = result.scalar()
                print(f"📖 Readings in database: {reading_count}")
                
                if user_count > 0 or book_count > 0 or reading_count > 0:
                    print("✅ Database contains user data - migrations will be safe")
                else:
                    print("ℹ️  Database is empty - safe to initialize")
                    
            except Exception as e:
                print(f"⚠️  Could not check data counts: {e}")
        
        await engine.dispose()
        return True
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        return False

def create_migration(message: str = None):
    """Create a new migration file"""
    if not message:
        message = input("Enter migration message: ").strip()
        if not message:
            message = "auto_migration"
    
    print(f"📝 Creating migration: {message}")
    return run_alembic_command(f'revision --autogenerate -m "{message}"')

def apply_migrations():
    """Apply pending migrations"""
    print("🚀 Applying database migrations...")
    return run_alembic_command("upgrade head")

def init_alembic():
    """Initialize Alembic for existing database"""
    print("🔧 Initializing migration tracking...")
    return run_alembic_command("stamp head")

def main():
    if len(sys.argv) < 2:
        print("Usage: python migrate.py [check|migrate|create|init]")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == "check":
        success = asyncio.run(check_database_state())
        if not success:
            sys.exit(1)
            
    elif command == "migrate":
        success = apply_migrations()
        if not success:
            sys.exit(1)
            
    elif command == "create":
        message = sys.argv[2] if len(sys.argv) > 2 else None
        success = create_migration(message)
        if not success:
            sys.exit(1)
            
    elif command == "init":
        success = init_alembic()
        if not success:
            sys.exit(1)
            
    else:
        print(f"Unknown command: {command}")
        print("Available commands: check, migrate, create, init")
        sys.exit(1)
    
    print("✅ Migration operation completed successfully!")

if __name__ == "__main__":
    main() 