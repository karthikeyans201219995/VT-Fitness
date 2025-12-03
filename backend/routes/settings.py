"""
Gym settings management routes
"""
from fastapi import APIRouter, HTTPException
import logging
from models import GymSettingsUpdate, GymSettingsResponse
from supabase_client import get_supabase
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("", response_model=GymSettingsResponse)
async def get_settings():
    """Get gym settings"""
    supabase = get_supabase()
    
    try:
        response = supabase.table("settings").select("*").limit(1).execute()
        
        if not response.data:
            # Create default settings if none exist
            default_settings = {
                "gym_name": "My Gym",
                "currency": "USD",
                "timezone": "UTC",
                "updated_at": datetime.utcnow().isoformat()
            }
            create_response = supabase.table("settings").insert(default_settings).execute()
            return GymSettingsResponse(**create_response.data[0])
        
        return GymSettingsResponse(**response.data[0])
        
    except Exception as e:
        logger.error(f"Get settings error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.put("", response_model=GymSettingsResponse)
async def update_settings(settings_update: GymSettingsUpdate):
    """Update gym settings"""
    supabase = get_supabase()
    
    try:
        # Get existing settings
        existing = supabase.table("settings").select("*").limit(1).execute()
        
        update_data = settings_update.model_dump(exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        if existing.data:
            # Update existing settings
            response = supabase.table("settings").update(update_data).eq("id", existing.data[0]["id"]).execute()
        else:
            # Create new settings
            response = supabase.table("settings").insert(update_data).execute()
        
        return GymSettingsResponse(**response.data[0])
        
    except Exception as e:
        logger.error(f"Update settings error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
