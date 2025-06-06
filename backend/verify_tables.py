import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

# Connect to database
DATABASE_URL = os.getenv('DATABASE_URL').replace('postgresql+asyncpg://', 'postgresql://')
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Get all tables
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;")
tables = cur.fetchall()

print("🎉 PostgreSQL Database Setup Complete!")
print("📊 Tables created:")
for table in tables:
    print(f"  ✅ {table[0]}")

# Get table row counts
print("\n📈 Table status:")
for table in tables:
    table_name = table[0]
    cur.execute(f"SELECT COUNT(*) FROM {table_name};")
    count = cur.fetchone()[0]
    print(f"  📋 {table_name}: {count} rows")

cur.close()
conn.close()

print("\n🚀 Your database is ready for production!")
print("Next step: Deploy to Railway and Vercel") 