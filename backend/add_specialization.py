"""
Script to add specialization column to users table
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

def add_specialization_column():
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_SERVICE_KEY')
    
    if not supabase_url or not supabase_key:
        print("Error: Supabase credentials not found in .env file")
        return
    
    supabase = create_client(supabase_url, supabase_key)
    
    try:
        # Execute SQL to add column
        result = supabase.rpc('exec_sql', {
            'sql': 'ALTER TABLE users ADD COLUMN IF NOT EXISTS specialization TEXT'
        }).execute()
        
        print("✓ Specialization column added successfully!")
        
    except Exception as e:
        print(f"Note: Column may already exist or needs to be added via SQL Editor")
        print(f"Error: {str(e)}")
        print("\nPlease run this SQL in your Supabase SQL Editor:")
        print("ALTER TABLE users ADD COLUMN IF NOT EXISTS specialization TEXT;")

if __name__ == "__main__":
    add_specialization_column()
