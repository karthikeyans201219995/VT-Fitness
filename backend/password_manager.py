"""
Password manager for storing and retrieving member passwords
WARNING: Storing passwords is a security risk. Use with caution.
"""
import os
from cryptography.fernet import Fernet
import base64
import logging

logger = logging.getLogger(__name__)


def get_encryption_key():
    """Get or generate encryption key"""
    key = os.environ.get('PASSWORD_ENCRYPTION_KEY')
    if not key:
        # Generate a new key if not exists
        key = Fernet.generate_key().decode()
        logger.warning(f"No PASSWORD_ENCRYPTION_KEY found. Generated new key. Add this to .env: PASSWORD_ENCRYPTION_KEY={key}")
    return key.encode() if isinstance(key, str) else key


def encrypt_password(password: str) -> str:
    """
    Encrypt a password for storage
    
    Args:
        password: Plain text password
        
    Returns:
        Encrypted password as string
    """
    try:
        key = get_encryption_key()
        f = Fernet(key)
        encrypted = f.encrypt(password.encode())
        return encrypted.decode()
    except Exception as e:
        logger.error(f"Error encrypting password: {str(e)}")
        return None


def decrypt_password(encrypted_password: str) -> str:
    """
    Decrypt a stored password
    
    Args:
        encrypted_password: Encrypted password string
        
    Returns:
        Decrypted plain text password
    """
    try:
        key = get_encryption_key()
        f = Fernet(key)
        decrypted = f.decrypt(encrypted_password.encode())
        return decrypted.decode()
    except Exception as e:
        logger.error(f"Error decrypting password: {str(e)}")
        return None
