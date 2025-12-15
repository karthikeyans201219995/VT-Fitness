"""
Test QR code scanning
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

# Test with the QR codes from database
test_qr_codes = [
    "GYM-c5e6aac2-7d8d-4b3d-a81a-85fbfb718188-68fa91b2",  # sandhya
    "GYM-77e21aa3-c266-4106-9e87-a5440b11b950-a857a6b7",  # navi
    "GYM-03334958-fb7a-42c0-baf9-71365bd2112a-4a4e97f3",  # nayan
]

def test_scan(qr_code):
    """Test scanning a QR code"""
    url = "http://localhost:8001/api/qr-attendance/scan"
    
    payload = {
        "qr_code": qr_code,
        "notes": None
    }
    
    try:
        response = requests.post(url, json=payload)
        logger.info(f"\nTesting QR: {qr_code}")
        logger.info(f"Status: {response.status_code}")
        logger.info(f"Response: {response.json()}")
        logger.info("-" * 80)
        return response.json()
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return None


if __name__ == "__main__":
    logger.info("Testing QR Code Scanning")
    logger.info("=" * 80)
    
    for qr_code in test_qr_codes:
        test_scan(qr_code)
