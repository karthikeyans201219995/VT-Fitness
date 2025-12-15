"""
Test QR code generation endpoint
"""
from dotenv import load_dotenv
from pathlib import Path
import logging
import requests

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_generate(member_id, member_name):
    """Test generating QR code for a member"""
    url = f"http://localhost:8001/api/qr-attendance/generate/{member_id}"
    
    try:
        response = requests.post(url)
        logger.info(f"\nGenerating QR for: {member_name}")
        logger.info(f"Member ID: {member_id}")
        logger.info(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            logger.info(f"QR Code: {data.get('qr_code')}")
            logger.info(f"Member Name: {data.get('member_name')}")
            logger.info(f"Has Image: {'Yes' if data.get('qr_image') else 'No'}")
            
            # Check if QR image data is correct
            qr_image = data.get('qr_image', '')
            if qr_image.startswith('data:image/png;base64,'):
                logger.info(f"Image format: Valid base64 PNG")
                logger.info(f"Image size: {len(qr_image)} characters")
        else:
            logger.error(f"Error: {response.json()}")
        
        logger.info("-" * 80)
        return response.json() if response.status_code == 200 else None
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return None


if __name__ == "__main__":
    logger.info("Testing QR Code Generation")
    logger.info("=" * 80)
    
    # Test with existing members
    test_generate("c5e6aac2-7d8d-4b3d-a81a-85fbfb718188", "sandhya")
    test_generate("77e21aa3-c266-4106-9e87-a5440b11b950", "navi")
