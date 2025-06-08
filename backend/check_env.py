#!/usr/bin/env python3
"""
Environment variable checker for Railway deployment
Run this to diagnose configuration issues
"""

import os
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_environment():
    """Check critical environment variables"""
    print("Environment Variable Check for Railway")
    print("=" * 60)
    
    # Critical variables based on your Railway config
    critical_vars = {
        "DATABASE_URL": "Supabase PostgreSQL connection",
        "JWT_SECRET_KEY": "JWT signing key",
        "DEEPSEEK_API_KEY": "DeepSeek AI API key",
        "CORS_ORIGINS": "Allowed frontend origins"
    }
    
    # Optional variables
    optional_vars = {
        "PORT": "Server port (Railway sets this automatically)",
        "RAILWAY_ENVIRONMENT": "Railway environment indicator",
        "FROM_EMAIL": "Email sender address",
        "FROM_NAME": "Email sender name",
        "BREVO_API_KEY": "Email service API key"
    }
    
    print("\n📋 Critical Variables:")
    all_critical_set = True
    for var, description in critical_vars.items():
        value = os.getenv(var)
        if value:
            # Mask sensitive values
            if "KEY" in var or "SECRET" in var:
                masked = value[:8] + "..." + value[-4:] if len(value) > 12 else "***"
                print(f"  ✅ {var}: {masked} ({description})")
            elif "DATABASE_URL" in var:
                # Show connection type without credentials
                if "supabase" in value:
                    print(f"  ✅ {var}: supabase postgresql connection ({description})")
                elif value.startswith("postgresql"):
                    print(f"  ✅ {var}: postgresql://*** ({description})")
                elif value.startswith("sqlite"):
                    print(f"  ⚠️  {var}: sqlite://*** ({description}) - Should be PostgreSQL for production")
                else:
                    print(f"  ❓ {var}: {value[:20]}... ({description})")
            elif "CORS_ORIGINS" in var:
                origins = [origin.strip() for origin in value.split(",")]
                print(f"  ✅ {var}: {len(origins)} origin(s) configured ({description})")
                for origin in origins:
                    print(f"      - {origin}")
            else:
                print(f"  ✅ {var}: {value} ({description})")
        else:
            print(f"  ❌ {var}: NOT SET ({description})")
            all_critical_set = False
    
    print("\n📋 Optional Variables:")
    for var, description in optional_vars.items():
        value = os.getenv(var)
        if value:
            if "KEY" in var or "SECRET" in var:
                masked = value[:8] + "..." + value[-4:] if len(value) > 12 else "***"
                print(f"  ✅ {var}: {masked} ({description})")
            else:
                print(f"  ✅ {var}: {value} ({description})")
        else:
            print(f"  ⚠️  {var}: NOT SET ({description})")
    
    # Database URL analysis
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        print(f"\n🔗 Database Configuration Analysis:")
        if "supabase" in database_url:
            print("  ✅ Using Supabase PostgreSQL (Recommended)")
            if "pooler.supabase.com" in database_url:
                print("  ✅ Connection pooling enabled")
            if ":6543/" in database_url:
                print("  ✅ Using pooler port (6543)")
            elif ":5432/" in database_url:
                print("  ⚠️  Using direct connection port (5432) - pooler recommended")
        elif database_url.startswith("postgresql"):
            print("  ✅ Using PostgreSQL")
            if "railway" in database_url:
                print("  ✅ Railway PostgreSQL detected")
        elif database_url.startswith("sqlite"):
            print("  ❌ Using SQLite - Should use PostgreSQL for production")
        else:
            print(f"  ❓ Unknown database type")
    
    # CORS analysis
    cors_origins = os.getenv("CORS_ORIGINS")
    if cors_origins:
        print(f"\n🌐 CORS Configuration Analysis:")
        origins = [origin.strip() for origin in cors_origins.split(",")]
        for origin in origins:
            if "railway.app" in origin:
                print(f"  ✅ Railway frontend: {origin}")
            elif "localhost" in origin:
                print(f"  🔧 Local development: {origin}")
            elif "vercel.app" in origin:
                print(f"  ✅ Vercel frontend: {origin}")
            else:
                print(f"  ℹ️  Custom origin: {origin}")
    
    # Environment detection
    print(f"\n🌍 Environment Detection:")
    is_production = os.getenv("RAILWAY_ENVIRONMENT") == "production" or os.getenv("PORT") is not None
    
    if os.getenv("RAILWAY_ENVIRONMENT"):
        print(f"  ✅ Railway environment: {os.getenv('RAILWAY_ENVIRONMENT')}")
    elif os.getenv("PORT"):
        print("  ✅ Likely running on Railway (PORT variable set)")
    elif os.path.exists("/.dockerenv"):
        print("  ✅ Running in Docker container")
    else:
        print("  ℹ️  Running locally")
    
    if is_production:
        print("  Production mode: PostgreSQL will be used")
    else:
        print("  Development mode: SQLite will be used")
    
    # Configuration recommendations
    print(f"\n💡 Recommendations:")
    if not all_critical_set:
        print("  ❌ Some critical variables are missing - deployment may fail")
    
    if database_url and "supabase" in database_url and ":5432/" in database_url:
        print("  ⚠️  Consider using Supabase connection pooler (port 6543) for better performance")
    
    if not os.getenv("RAILWAY_ENVIRONMENT"):
        print("  💡 Consider adding RAILWAY_ENVIRONMENT=production for better logging")
    
    print("\n" + "=" * 60)
    if all_critical_set:
        print("✅ All critical environment variables are configured!")
    else:
        print("❌ Some critical environment variables are missing!")
    print("🚀 Ready to test database connection...")

async def test_database_connection():
    """Test database connection using the current configuration"""
    print("\n🔌 Testing Database Connection...")
    print("-" * 40)
    
    # Determine which database will be used
    is_production = os.getenv("RAILWAY_ENVIRONMENT") == "production" or os.getenv("PORT") is not None
    
    if is_production:
        print("  Testing PostgreSQL connection (Production)")
    else:
        print("  Testing SQLite connection (Development)")
    
    try:
        # Import here to avoid issues if modules aren't available
        from database import AsyncSessionLocal
        from sqlalchemy import text
        
        async with AsyncSessionLocal() as session:
            # Test basic connection
            result = await session.execute(text("SELECT 1 as test"))
            test_value = result.scalar()
            
            if test_value == 1:
                print("  ✅ Database connection successful!")
                
                # Test user table exists
                try:
                    result = await session.execute(text("SELECT COUNT(*) FROM users"))
                    user_count = result.scalar()
                    print(f"  ✅ Users table accessible ({user_count} users)")
                except Exception as e:
                    print(f"  ⚠️  Users table issue (normal for fresh setup): {str(e)}")
                
                return True
            else:
                print("  ❌ Database connection test failed")
                return False
                
    except Exception as e:
        print(f"  ❌ Database connection failed: {str(e)}")
        print(f"     Error type: {type(e).__name__}")
        
        if not is_production and "no such table" in str(e).lower():
            print("  💡 This is normal for a fresh SQLite setup - tables will be created on first run")
        
        return False

async def main():
    """Main function to run all checks"""
    check_environment()
    
    # Test database connection if DATABASE_URL is set
    if os.getenv("DATABASE_URL"):
        await test_database_connection()
    else:
        print("\n⚠️  DATABASE_URL not set - skipping connection test")

if __name__ == "__main__":
    asyncio.run(main()) 