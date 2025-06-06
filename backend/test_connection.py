import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Get the DATABASE_URL
database_url = os.getenv("DATABASE_URL")

if not database_url:
    print("❌ No DATABASE_URL found in .env file")
    exit(1)

print(f"Testing connection to: {database_url.split('@')[1] if '@' in database_url else 'unknown'}")

# Convert asyncpg URL to psycopg2 format for testing
if database_url.startswith("postgresql+asyncpg://"):
    test_url = database_url.replace("postgresql+asyncpg://", "postgresql://")
else:
    test_url = database_url

try:
    print("🔄 Attempting to connect...")
    conn = psycopg2.connect(test_url)
    print("✅ Connection successful!")
    
    # Test a simple query
    cursor = conn.cursor()
    cursor.execute("SELECT version();")
    version = cursor.fetchone()
    print(f"📊 PostgreSQL version: {version[0]}")
    
    cursor.close()
    conn.close()
    print("✅ Database is ready for migrations!")
    
except Exception as e:
    print(f"❌ Connection failed: {e}")
    print("\n🔧 Troubleshooting tips:")
    print("1. Check your DATABASE_URL in the .env file")
    print("2. Verify the hostname is correct")
    print("3. Make sure your Supabase project is active")
    print("4. Check your internet connection") 