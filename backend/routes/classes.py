"""
Classes API Routes
Handles fitness class scheduling and management
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional
from pydantic import BaseModel
from datetime import time
from supabase_client import get_supabase_client
from routes.auth import get_current_user

router = APIRouter(prefix="/api/classes", tags=["classes"])


class ClassCreate(BaseModel):
    name: str
    description: Optional[str] = None
    trainer_id: Optional[str] = None
    category: Optional[str] = None
    duration_minutes: int
    max_capacity: int
    schedule_day: str
    schedule_time: str  # Format: "HH:MM:SS"
    room: Optional[str] = None
    equipment_needed: Optional[str] = None
    difficulty_level: Optional[str] = "beginner"
    is_recurring: bool = True
    status: str = "active"


class ClassUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trainer_id: Optional[str] = None
    category: Optional[str] = None
    duration_minutes: Optional[int] = None
    max_capacity: Optional[int] = None
    schedule_day: Optional[str] = None
    schedule_time: Optional[str] = None
    room: Optional[str] = None
    equipment_needed: Optional[str] = None
    difficulty_level: Optional[str] = None
    is_recurring: Optional[bool] = None
    status: Optional[str] = None


@router.get("/")
async def get_classes(
    category: Optional[str] = None,
    day: Optional[str] = None,
    status: Optional[str] = "active",
    current_user: dict = Depends(get_current_user)
):
    """Get all classes"""
    try:
        supabase = get_supabase_client()
        query = supabase.table("classes").select("*")
        
        if category:
            query = query.eq("category", category)
        if day:
            query = query.eq("schedule_day", day)
        if status:
            query = query.eq("status", status)
        
        query = query.order("schedule_day").order("schedule_time")
        response = query.execute()
        
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{class_id}")
async def get_class_by_id(
    class_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific class"""
    try:
        supabase = get_supabase_client()
        response = supabase.table("classes").select("*").eq("id", class_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Class not found")
        
        return {"success": True, "data": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_class(
    class_data: ClassCreate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Create new class (admin and trainer only)"""
    try:
        if current_user["role"] not in ["admin", "trainer"]:
            raise HTTPException(status_code=403, detail="Only admins and trainers can create classes")
        
        supabase = get_supabase_client()
        
        class_dict = class_data.dict()
        response = supabase.table("classes").insert(class_dict).execute()
        
        await log_audit(
            user_id=current_user["id"],
            user_email=current_user["email"],
            action="CREATE",
            entity_type="class",
            entity_id=response.data[0]["id"],
            request=request
        )
        
        return {"success": True, "data": response.data[0], "message": "Class created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{class_id}")
async def update_class(
    class_id: str,
    class_data: ClassUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Update class (admin and trainer only)"""
    try:
        if current_user["role"] not in ["admin", "trainer"]:
            raise HTTPException(status_code=403, detail="Only admins and trainers can update classes")
        
        supabase = get_supabase_client()
        
        existing = supabase.table("classes").select("*").eq("id", class_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Class not found")
        
        update_data = {k: v for k, v in class_data.dict(exclude_unset=True).items() if v is not None}
        response = supabase.table("classes").update(update_data).eq("id", class_id).execute()
        
        await log_audit(
            user_id=current_user["id"],
            user_email=current_user["email"],
            action="UPDATE",
            entity_type="class",
            entity_id=class_id,
            changes={"before": existing.data[0], "after": response.data[0]},
            request=request
        )
        
        return {"success": True, "data": response.data[0], "message": "Class updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{class_id}")
async def delete_class(
    class_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Delete class (admin only)"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only admins can delete classes")
        
        supabase = get_supabase_client()
        
        existing = supabase.table("classes").select("*").eq("id", class_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Class not found")
        
        supabase.table("classes").delete().eq("id", class_id).execute()
        
        await log_audit(
            user_id=current_user["id"],
            user_email=current_user["email"],
            action="DELETE",
            entity_type="class",
            entity_id=class_id,
            changes={"deleted": existing.data[0]},
            request=request
        )
        
        return {"success": True, "message": "Class deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{class_id}/bookings")
async def get_class_bookings(
    class_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get bookings for a specific class"""
    try:
        supabase = get_supabase_client()
        response = supabase.table("class_bookings")\
            .select("*, members(*)")\
            .eq("class_id", class_id)\
            .order("booking_date", desc=True)\
            .execute()
        
        return {"success": True, "data": response.data}
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
        print(f"Audit log error: {e}")
