"""
Generate QR codes for all existing members
"""
from dotenv import load_dotenv
from pathlib import Path
import logging

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from supabase_client import get_supabase_service
from qr_service import generate_qr_code, generate_qr_image
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_qr_codes_for_members():
    """Generate QR codes for all members who don't have one"""
    supabase = get_supabase_service()
    
    if not supabase:
        logger.error("Failed to connect to Supabase")
        return False
    
    try:
        # Get all members without QR codes
        response = supabase.table("members").select("id, full_name, email, qr_code").execute()
        
        if not response.data:
            logger.info("No members found in database")
            return True
        
        members = response.data
        logger.info(f"Found {len(members)} members")
        
        # Create directory for QR code images
        qr_dir = Path("qr_codes")
        qr_dir.mkdir(exist_ok=True)
        
        generated_count = 0
        skipped_count = 0
        
        for member in members:
            member_id = member['id']
            member_name = member['full_name']
            
            # Skip if already has QR code
            if member.get('qr_code'):
                logger.info(f"Skipping {member_name} - already has QR code")
                skipped_count += 1
                continue
            
            # Generate QR code
            qr_code_data = generate_qr_code(member_id)
            
            # Update member with QR code
            supabase.table("members").update({"qr_code": qr_code_data}).eq("id", member_id).execute()
            
            # Generate and save QR image
            qr_image_base64 = generate_qr_image(qr_code_data)
            
            # Save QR code image to file
            import base64
            image_data = qr_image_base64.split(',')[1]  # Remove data:image/png;base64, prefix
            image_bytes = base64.b64decode(image_data)
            
            # Save with member name
            safe_name = "".join(c for c in member_name if c.isalnum() or c in (' ', '-', '_')).strip()
            image_path = qr_dir / f"{safe_name}_{member_id[:8]}.png"
            
            with open(image_path, 'wb') as f:
                f.write(image_bytes)
            
            logger.info(f"✓ Generated QR code for {member_name}")
            logger.info(f"  Code: {qr_code_data}")
            logger.info(f"  Image: {image_path}")
            generated_count += 1
        
        logger.info("=" * 60)
        logger.info(f"QR Code Generation Complete!")
        logger.info(f"Generated: {generated_count}")
        logger.info(f"Skipped: {skipped_count}")
        logger.info(f"QR code images saved to: {qr_dir.absolute()}")
        logger.info("=" * 60)
        
        return True
        
    except Exception as e:
        logger.error(f"Error generating QR codes: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    generate_qr_codes_for_members()
