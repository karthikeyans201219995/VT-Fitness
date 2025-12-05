"""
Plans management routes
"""
from fastapi import APIRouter, HTTPException
from typing import List
import logging
from models import PlanCreate, PlanUpdate, PlanResponse
from supabase_client import get_supabase, get_supabase_service
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/plans", tags=["Plans"])


@router.post("", response_model=PlanResponse)
async def create_plan(plan: PlanCreate):
    """Create a new plan"""
    supabase = get_supabase_service()
    
    try:
        plan_data = plan.model_dump()
        plan_data["created_at"] = datetime.utcnow().isoformat()
        
        response = supabase.table("plans").insert(plan_data).execute()
        
        return PlanResponse(**response.data[0])
        
    except Exception as e:
        logger.error(f"Create plan error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[PlanResponse])
async def get_plans(is_active: bool = None):
    """Get all plans"""
    supabase = get_supabase_service()
    
    try:
        query = supabase.table("plans").select("*")
        
        if is_active is not None:
            query = query.eq("is_active", is_active)
        
        response = query.execute()
        
        return [PlanResponse(**plan) for plan in response.data]
        
    except Exception as e:
        logger.error(f"Get plans error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{plan_id}", response_model=PlanResponse)
async def get_plan(plan_id: str):
    """Get plan by ID"""
    supabase = get_supabase_service()
    
    try:
        response = supabase.table("plans").select("*").eq("id", plan_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        return PlanResponse(**response.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get plan error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{plan_id}", response_model=PlanResponse)
async def update_plan(plan_id: str, plan_update: PlanUpdate):
    """Update plan"""
    supabase = get_supabase_service()
    
    try:
        # Check if plan exists
        existing = supabase.table("plans").select("id").eq("id", plan_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        # Update plan
        update_data = plan_update.model_dump(exclude_unset=True)
        response = supabase.table("plans").update(update_data).eq("id", plan_id).execute()
        
        return PlanResponse(**response.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update plan error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{plan_id}")
async def delete_plan(plan_id: str):
    """Delete plan"""
    supabase = get_supabase_service()
    
    try:
        # Check if plan exists
        existing = supabase.table("plans").select("id").eq("id", plan_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Plan not found")
        
        # Check if plan is being used by any member
        members = supabase.table("members").select("id").eq("plan_id", plan_id).execute()
        if members.data:
            raise HTTPException(status_code=400, detail="Cannot delete plan that is assigned to members")
        
        # Delete plan
        supabase.table("plans").delete().eq("id", plan_id).execute()
        
        return {"message": "Plan deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete plan error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
