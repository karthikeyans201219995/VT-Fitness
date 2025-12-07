"""
Trainers management routes
"""
from fastapi import APIRouter, HTTPException
from typing import List
import logging
from pydantic import BaseModel, EmailStr
from supabase_client import get_supabase, get_supabase_service
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/trainers", tags=["Trainers"])


class TrainerCreate(BaseModel):
    email: EmailStr
    full_name: str
    phone: str
    specialization: str | None = None
    password: str = "trainer123"  # Default password


class TrainerUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    specialization: str | None = None
    status: str | None = None


class TrainerResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: str
    specialization: str | None = None
    status: str = "active"
    created_at: str


@router.post("", response_model=TrainerResponse)
async def create_trainer(trainer: TrainerCreate):
    """Create a new trainer"""
    supabase_service = get_supabase_service()
    
    try:
        # Check if email already exists
        existing = supabase_service.table("users").select("id").eq("email", trainer.email).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="User with this email already exists")
        
        # Create auth user using service/admin client
        auth_response = supabase_service.auth.admin.create_user({
            "email": trainer.email,
            "password": trainer.password,
            "email_confirm": True,
            "user_metadata": {
                "full_name": trainer.full_name,
                "phone": trainer.phone,
                "role": "trainer",
                "specialization": trainer.specialization
            }
        })
        
        if not auth_response.user:
            raise HTTPException(status_code=400, detail="Failed to create trainer account")
        
        # Create user profile
        user_data = {
            "id": auth_response.user.id,
            "email": trainer.email,
            "full_name": trainer.full_name,
            "phone": trainer.phone,
            "role": "trainer",
            "created_at": datetime.utcnow().isoformat()
        }
        
        supabase_service.table("users").insert(user_data).execute()
        
        # Create trainer profile with specialization
        trainer_profile = {
            "user_id": auth_response.user.id,
            "specialization": trainer.specialization,
            "status": "active"
        }
        
        # Store specialization in a metadata field or return it directly
        result = {
            **user_data,
            "specialization": trainer.specialization,
            "status": "active"
        }
        
        return TrainerResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create trainer error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[TrainerResponse])
async def get_trainers():
    """Get all trainers"""
    supabase_service = get_supabase_service()
    
    try:
        response = supabase_service.table("users").select("*").eq("role", "trainer").execute()
        
        trainers = []
        for user in response.data:
            trainer_data = {
                **user,
                "specialization": user.get("specialization", "General Training"),
                "status": "active"
            }
            trainers.append(TrainerResponse(**trainer_data))
        
        return trainers
        
    except Exception as e:
        logger.error(f"Get trainers error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{trainer_id}", response_model=TrainerResponse)
async def get_trainer(trainer_id: str):
    """Get trainer by ID"""
    supabase_service = get_supabase_service()
    
    try:
        response = supabase_service.table("users").select("*").eq("id", trainer_id).eq("role", "trainer").execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Trainer not found")
        
        trainer = response.data[0]
        trainer_data = {
            **trainer,
            "specialization": trainer.get("specialization", "General Training"),
            "status": "active"
        }
        
        return TrainerResponse(**trainer_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get trainer error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{trainer_id}", response_model=TrainerResponse)
async def update_trainer(trainer_id: str, trainer_update: TrainerUpdate):
    """Update trainer"""
    supabase_service = get_supabase_service()
    
    try:
        # Check if trainer exists
        existing = supabase_service.table("users").select("*").eq("id", trainer_id).eq("role", "trainer").execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Trainer not found")
        
        # Update trainer
        update_data = trainer_update.model_dump(exclude_unset=True)
        response = supabase_service.table("users").update(update_data).eq("id", trainer_id).execute()
        
        trainer = response.data[0]
        trainer_data = {
            **trainer,
            "specialization": trainer.get("specialization", "General Training"),
            "status": trainer.get("status", "active")
        }
        
        return TrainerResponse(**trainer_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update trainer error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{trainer_id}")
async def delete_trainer(trainer_id: str):
    """Delete trainer"""
    supabase_service = get_supabase_service()
    
    try:
        # Check if trainer exists
        existing = supabase_service.table("users").select("id").eq("id", trainer_id).eq("role", "trainer").execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Trainer not found")
        
        # Delete trainer
        supabase_service.table("users").delete().eq("id", trainer_id).execute()
        
        return {"message": "Trainer deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete trainer error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
