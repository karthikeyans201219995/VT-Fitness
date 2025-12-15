"""
Check QR codes in database
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


def check_qr_codes():
    """Check all member QR codes"""
    supabase = get_supabase_service()
    
    if not supabase:
        logger.error("Failed to connect to Supabase")
        return
    
    try:
        # Get all members with QR codes
        response = supabase.table("members").select("id, full_name, email, qr_code, status").execute()
        
        if not response.data:
            logger.info("No members found")
            return
        
        members = response.data
        logger.info(f"\n{'='*80}")
        logger.info(f"Found {len(members)} members:")
        logger.info(f"{'='*80}\n")
        
        for member in members:
            logger.info(f"Name: {member['full_name']}")
            logger.info(f"Email: {member['email']}")
            logger.info(f"Status: {member['status']}")
            logger.info(f"QR Code: {member.get('qr_code', 'NOT GENERATED')}")
            logger.info(f"Member ID: {member['id']}")
            logger.info("-" * 80)
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    check_qr_codes()
