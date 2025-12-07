"""
QR Code generation and management service
"""
import qrcode
import io
import base64
import uuid
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def generate_qr_code(member_id: str) -> str:
    """
    Generate a unique QR code string for a member
    Format: GYM-{member_id}-{random_suffix}
    """
    random_suffix = str(uuid.uuid4())[:8]
    qr_code_data = f"GYM-{member_id}-{random_suffix}"
    return qr_code_data


def generate_qr_image(qr_data: str) -> str:
    """
    Generate QR code image and return as base64 string
    """
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        return f"data:image/png;base64,{img_str}"
    except Exception as e:
        logger.error(f"QR image generation error: {str(e)}")
        raise


def parse_qr_code(qr_data: str) -> Optional[str]:
    """
    Parse QR code data and extract member ID
    Returns member_id if valid, None otherwise
    """
    try:
        if qr_data.startswith("GYM-"):
            parts = qr_data.split("-")
            if len(parts) >= 2:
                return parts[1]  # Return member_id
        return None
    except Exception as e:
        logger.error(f"QR parsing error: {str(e)}")
        return None
