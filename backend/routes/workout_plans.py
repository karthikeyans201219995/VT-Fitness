"""
Workout Plans API Routes
Handles CRUD operations for member workout plans
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
import os
from supabase_client import get_supabase_client
from routes.auth import get_current_user

router = APIRouter(prefix="/api/workout-plans", tags=["workout_plans"])


class Exercise(BaseModel):
    name: str
    sets: int
    reps: str  # Can be "10-12" or "30 seconds"
    rest_seconds: int
    notes: Optional[str] = None


class WorkoutPlanCreate(BaseModel):
    member_id: str
    trainer_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    goal: Optional[str] = None
    duration_weeks: Optional[int] = None
    exercises: List[Exercise] = []
    frequency: Optional[str] = None
    notes: Optional[str] = None
    status: str = "active"


class WorkoutPlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    goal: Optional[str] = None
    duration_weeks: Optional[int] = None
    exercises: Optional[List[Exercise]] = None
    frequency: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


@router.get("/")
async def get_workout_plans(
    member_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all workout plans (filtered by member_id if provided)"""
    try:
        supabase = get_supabase_client()
        query = supabase.table("workout_plans").select("*")
        
        # Filter by role
        if current_user["role"] == "member":
            # Members can only see their own plans
            query = query.eq("member_id", current_user["id"])
        elif member_id:
            # Trainers/admins can filter by member_id
            query = query.eq("member_id", member_id)
        
        if status:
            query = query.eq("status", status)
        
        query = query.order("created_at", desc=True)
        response = query.execute()
        
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{plan_id}")
async def get_workout_plan(
    plan_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific workout plan"""
    try:
        supabase = get_supabase_client()
        response = supabase.table("workout_plans").select("*").eq("id", plan_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Workout plan not found")
        
        plan = response.data[0]
        
        # Check access
        if current_user["role"] == "member" and plan["member_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {"success": True, "data": plan}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_workout_plan(
    plan: WorkoutPlanCreate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Create a new workout plan (trainers and admins only)"""
    try:
        if current_user["role"] not in ["admin", "trainer"]:
            raise HTTPException(status_code=403, detail="Only trainers and admins can create workout plans")
        
        supabase = get_supabase_client()
        
        # Convert exercises to dict for JSONB storage
        exercises_data = [exercise.dict() for exercise in plan.exercises]
        
        plan_data = {
            "member_id": plan.member_id,
            "trainer_id": plan.trainer_id or current_user["id"],
            "name": plan.name,
            "description": plan.description,
            "goal": plan.goal,
            "duration_weeks": plan.duration_weeks,
            "exercises": exercises_data,
            "frequency": plan.frequency,
            "notes": plan.notes,
            "status": plan.status,
            "created_by": current_user["email"]
        }
        
        response = supabase.table("workout_plans").insert(plan_data).execute()
        
        # Log audit
        await log_audit(
            user_id=current_user["id"],
            user_email=current_user["email"],
            action="CREATE",
            entity_type="workout_plan",
            entity_id=response.data[0]["id"],
            request=request
        )
        
        return {"success": True, "data": response.data[0], "message": "Workout plan created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{plan_id}")
async def update_workout_plan(
    plan_id: str,
    plan: WorkoutPlanUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Update a workout plan (trainers and admins only)"""
    try:
        if current_user["role"] not in ["admin", "trainer"]:
            raise HTTPException(status_code=403, detail="Only trainers and admins can update workout plans")
        
        supabase = get_supabase_client()
        
        # Get existing plan
        existing = supabase.table("workout_plans").select("*").eq("id", plan_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Workout plan not found")
        
        # Build update data
        update_data = {}
        if plan.name is not None:
            update_data["name"] = plan.name
        if plan.description is not None:
            update_data["description"] = plan.description
        if plan.goal is not None:
            update_data["goal"] = plan.goal
        if plan.duration_weeks is not None:
            update_data["duration_weeks"] = plan.duration_weeks
        if plan.exercises is not None:
            update_data["exercises"] = [exercise.dict() for exercise in plan.exercises]
        if plan.frequency is not None:
            update_data["frequency"] = plan.frequency
        if plan.notes is not None:
            update_data["notes"] = plan.notes
        if plan.status is not None:
            update_data["status"] = plan.status
        
        response = supabase.table("workout_plans").update(update_data).eq("id", plan_id).execute()
        
        # Log audit
        await log_audit(
            user_id=current_user["id"],
            user_email=current_user["email"],
            action="UPDATE",
            entity_type="workout_plan",
            entity_id=plan_id,
            changes={"before": existing.data[0], "after": response.data[0]},
            request=request
        )
        
        return {"success": True, "data": response.data[0], "message": "Workout plan updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{plan_id}")
async def delete_workout_plan(
    plan_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Delete a workout plan (admins only)"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only admins can delete workout plans")
        
        supabase = get_supabase_client()
        
        # Get existing plan for audit
        existing = supabase.table("workout_plans").select("*").eq("id", plan_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Workout plan not found")
        
        supabase.table("workout_plans").delete().eq("id", plan_id).execute()
        
        # Log audit
        await log_audit(
            user_id=current_user["id"],
            user_email=current_user["email"],
            action="DELETE",
            entity_type="workout_plan",
            entity_id=plan_id,
            changes={"deleted": existing.data[0]},
            request=request
        )
        
        return {"success": True, "message": "Workout plan deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/member/{member_id}/active")
async def get_member_active_plans(
    member_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get active workout plans for a specific member"""
    try:
        # Check access
        if current_user["role"] == "member" and current_user["id"] != member_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        supabase = get_supabase_client()
        response = supabase.table("workout_plans")\
            .select("*")\
            .eq("member_id", member_id)\
            .eq("status", "active")\
            .order("created_at", desc=True)\
            .execute()
        
        return {"success": True, "data": response.data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def log_audit(user_id: str, user_email: str, action: str, entity_type: str, 
                    entity_id: str, request: Request, changes: dict = None):
    """Log audit entry"""
    try:
        supabase = get_supabase_client()
        audit_data = {
            "user_id": user_id,
            "user_email": user_email,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "changes": changes,
            "ip_address": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent")
        }
        supabase.table("audit_logs").insert(audit_data).execute()
    except Exception as e:
        # Don't fail the main operation if audit logging fails
        print(f"Audit log error: {e}")
