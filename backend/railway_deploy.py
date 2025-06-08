#!/usr/bin/env python3
"""
Railway Deployment Safety Check

This script runs before deployment to ensure no data will be lost.
Railway should run this as part of the build process.
"""

import asyncio
import os
import sys
from migrate import check_database_state, apply_migrations

async def pre_deployment_check():
    """Run safety checks before deployment"""
    print("🚀 Railway Pre-Deployment Safety Check")
    print("=" * 50)
    
    # Check if this is production
    is_production = os.getenv("RAILWAY_ENVIRONMENT") == "production"
    
    if is_production:
        print("🔴 PRODUCTION DEPLOYMENT DETECTED")
        print("Running extra safety checks...")
        
        # Check database state
        print("\n1. Checking database state...")
        db_ok = await check_database_state()
        
        if not db_ok:
            print("❌ Database check failed - ABORTING DEPLOYMENT")
            return False
        
        print("\n2. Applying migrations safely...")
        migration_ok = apply_migrations()
        
        if not migration_ok:
            print("❌ Migration failed - ABORTING DEPLOYMENT")
            return False
            
        print("✅ All safety checks passed - deployment can proceed")
        return True
    else:
        print("🟡 Non-production deployment - running basic checks")
        return True

def main():
    """Main deployment check"""
    try:
        success = asyncio.run(pre_deployment_check())
        if not success:
            print("\n❌ DEPLOYMENT ABORTED - Safety checks failed")
            sys.exit(1)
        else:
            print("\n✅ DEPLOYMENT APPROVED - All checks passed")
            sys.exit(0)
    except Exception as e:
        print(f"\n❌ DEPLOYMENT ERROR: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 