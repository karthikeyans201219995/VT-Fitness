"""
Run QR code migration on Supabase
"""
from dotenv import load_dotenv
from pathlib import Path
import logging

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from supabase_client import get_supabase_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_migration():
    """Run the QR code migration"""
    supabase = get_supabase_service()
    
    if not supabase:
        logger.error("Failed to connect to Supabase")
        return False
    
    try:
        # Read the SQL migration file
        with open('add_qr_code_column.sql', 'r') as f:
            sql = f.read()
        
        logger.info("Running QR code migration...")
        
        # Execute the SQL
        # Note: Supabase Python client doesn't directly support raw SQL execution
        # You need to run this in Supabase SQL Editor
        logger.info("=" * 60)
        logger.info("Please run the following SQL in your Supabase SQL Editor:")
        logger.info("=" * 60)
        print(sql)
        logger.info("=" * 60)
        logger.info("\nSteps:")
        logger.info("1. Go to: https://app.supabase.com/project/aovfhvpzixctghtixchl/sql")
        logger.info("2. Copy the SQL above")
        logger.info("3. Paste and run it in the SQL Editor")
        logger.info("=" * 60)
        
        return True
        
    except Exception as e:
        logger.error(f"Migration error: {str(e)}")
        return False

if __name__ == "__main__":
    run_migration()
