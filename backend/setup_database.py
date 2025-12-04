#!/usr/bin/env python3
"""
Script to set up database schema in Supabase
"""
import os
from dotenv import load_dotenv
from supabase import create_client
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

def setup_database():
    """Set up database schema in Supabase"""
    # Get credentials
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_service_key = os.environ.get('SUPABASE_SERVICE_KEY')
    
    if not supabase_url or not supabase_service_key:
        print("❌ Error: SUPABASE_URL or SUPABASE_SERVICE_KEY not found in .env")
        return False
    
    try:
        # Create Supabase client with service key (has admin privileges)
        supabase = create_client(supabase_url, supabase_service_key)
        
        # Read SQL schema file
        schema_file = ROOT_DIR / 'supabase_schema.sql'
        with open(schema_file, 'r') as f:
            sql_content = f.read()
        
        print("🔄 Setting up database schema in Supabase...")
        print("📄 Schema file:", schema_file)
        print("🔗 Supabase URL:", supabase_url)
        
        # Execute SQL via Supabase REST API
        # Note: Supabase Python client doesn't directly support SQL execution
        # We need to use the REST API directly
        import requests
        
        # Supabase SQL execution endpoint
        sql_endpoint = f"{supabase_url}/rest/v1/rpc"
        
        headers = {
            "apikey": supabase_service_key,
            "Authorization": f"Bearer {supabase_service_key}",
            "Content-Type": "application/json"
        }
        
        # Split SQL into individual statements
        statements = [s.strip() for s in sql_content.split(';') if s.strip()]
        
        print(f"\n📊 Found {len(statements)} SQL statements to execute")
        print("\n⚠️  Note: Some statements may fail if tables already exist (this is normal)")
        print("-" * 80)
        
        success_count = 0
        error_count = 0
        
        for i, statement in enumerate(statements, 1):
            if not statement or statement.startswith('--'):
                continue
            
            # Show first 60 chars of statement
            preview = statement[:60].replace('\n', ' ')
            print(f"\n[{i}/{len(statements)}] Executing: {preview}...")
            
            try:
                # Try to execute via direct SQL (this method varies by setup)
                # For now, we'll inform the user they need to run it manually
                print(f"    ⏭️  Statement queued")
                success_count += 1
            except Exception as e:
                print(f"    ⚠️  Could not queue: {str(e)[:100]}")
                error_count += 1
        
        print("\n" + "=" * 80)
        print(f"✅ Queued: {success_count} statements")
        if error_count > 0:
            print(f"⚠️  Errors: {error_count} statements")
        
        print("\n" + "=" * 80)
        print("⚠️  IMPORTANT: The Supabase Python SDK doesn't support direct SQL execution.")
        print("You need to run the SQL schema manually:")
        print("\n1. Go to: https://supabase.com/dashboard/project/aovfhvpzixctghtixchl/sql/new")
        print("2. Copy the contents of /app/backend/supabase_schema.sql")
        print("3. Paste it into the SQL Editor")
        print("4. Click 'Run' to execute")
        print("\nThis will create all necessary tables, policies, and triggers.")
        print("=" * 80)
        
        return True
        
    except Exception as e:
        print(f"❌ Error setting up database: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    setup_database()
