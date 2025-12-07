"""
Supabase client configuration and helper functions
"""
import os
from supabase import create_client, Client
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Supabase client instance
supabase_client: Optional[Client] = None
supabase_service_client: Optional[Client] = None


def init_supabase() -> Client:
    """Initialize and return Supabase client"""
    global supabase_client
    
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        logger.warning("Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env file")
        return None
    
    if supabase_url == "YOUR_SUPABASE_PROJECT_URL_HERE" or supabase_key == "YOUR_SUPABASE_ANON_KEY_HERE":
        logger.warning("Supabase credentials are still using placeholder values. Please update with actual credentials.")
        return None
    
    try:
        supabase_client = create_client(supabase_url, supabase_key)
        logger.info("Supabase client initialized successfully")
        return supabase_client
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {str(e)}")
        return None


def get_supabase() -> Optional[Client]:
    """Get Supabase client instance"""
    global supabase_client
    if supabase_client is None:
        supabase_client = init_supabase()
    return supabase_client


def get_supabase_service() -> Optional[Client]:
    """Get Supabase service client (bypasses RLS)"""
    global supabase_service_client
    
    if supabase_service_client is None:
        supabase_url = os.environ.get('SUPABASE_URL')
        supabase_service_key = os.environ.get('SUPABASE_SERVICE_KEY')
        
        if not supabase_url or not supabase_service_key:
            logger.warning("Supabase service credentials not configured")
            return None
        
        try:
            supabase_service_client = create_client(supabase_url, supabase_service_key)
            logger.info("Supabase service client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase service client: {str(e)}")
            return None
    
    return supabase_service_client


def check_supabase_configured() -> bool:
    """Check if Supabase is properly configured"""
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        return False
    
    if supabase_url == "YOUR_SUPABASE_PROJECT_URL_HERE" or supabase_key == "YOUR_SUPABASE_ANON_KEY_HERE":
        return False
    
    return True
