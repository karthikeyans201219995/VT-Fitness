"""
Diet Plans API Routes
Handles CRUD operations for member diet/nutrition plans
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from pydantic import BaseModel
from supabase_client import get_supabase_client
from routes.auth import get_current_user

router = APIRouter(prefix="/api/diet-plans", tags=["diet_plans"])


class Meal(BaseModel):
    name: str
    time: str
    foods: List[str]
    calories: Optional[int] = None
    notes: Optional[str] = None


class Macros(BaseModel):
    protein: int
    carbs: int
    fat: int


class DietPlanCreate(BaseModel):
    member_id: str
    trainer_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    goal: Optional[str] = None
    duration_weeks: Optional[int] = None
    daily_calories: Optional[int] = None
    macros: Optional[Macros] = None
    meals: List[Meal] = []
    supplements: List[str] = []
    restrictions: Optional[str] = None
    notes: Optional[str] = None
    status: str = "active"


class DietPlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    goal: Optional[str] = None
    duration_weeks: Optional[int] = None
    daily_calories: Optional[int] = None
    macros: Optional[Macros] = None
    meals: Optional[List[Meal]] = None
    supplements: Optional[List[str]] = None
    restrictions: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


@router.get("/")
async def get_diet_plans(
    member_id: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all diet plans"""
    try:
        supabase = get_supabase_client()
        query = supabase.table("diet_plans").select("*")
        
        if current_user["role"] == "member":
            query = query.eq("member_id", current_user["id"])
        elif member_id:
            query = query.eq("member_id", member_id)
        
        if status:
            query = query.eq("status", status)
        
        query = query.order("created_at", desc=True)
        response = query.execute()
        
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{plan_id}")
async def get_diet_plan(
    plan_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific diet plan"""
    try:
        supabase = get_supabase_client()
        response = supabase.table("diet_plans").select("*").eq("id", plan_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Diet plan not found")
        
        plan = response.data[0]
        
        if current_user["role"] == "member" and plan["member_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {"success": True, "data": plan}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_diet_plan(
    plan: DietPlanCreate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Create a new diet plan"""
    try:
        if current_user["role"] not in ["admin", "trainer"]:
            raise HTTPException(status_code=403, detail="Only trainers and admins can create diet plans")
        
        supabase = get_supabase_client()
        
        plan_data = {
            "member_id": plan.member_id,
            "trainer_id": plan.trainer_id or current_user["id"],
            "name": plan.name,
            "description": plan.description,
            "goal": plan.goal,
            "duration_weeks": plan.duration_weeks,
            "daily_calories": plan.daily_calories,
            "macros": plan.macros.dict() if plan.macros else None,
            "meals": [meal.dict() for meal in plan.meals],
            "supplements": plan.supplements,
            "restrictions": plan.restrictions,
            "notes": plan.notes,
            "status": plan.status,
            "created_by": current_user["email"]
        }
        
        response = supabase.table("diet_plans").insert(plan_data).execute()
        
        # Log audit
        await log_audit(
            user_id=current_user["id"],
            user_email=current_user["email"],
            action="CREATE",
            entity_type="diet_plan",
            entity_id=response.data[0]["id"],
            request=request
        )
        
        return {"success": True, "data": response.data[0], "message": "Diet plan created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{plan_id}")
async def update_diet_plan(
    plan_id: str,
    plan: DietPlanUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Update a diet plan"""
    try:
        if current_user["role"] not in ["admin", "trainer"]:
            raise HTTPException(status_code=403, detail="Only trainers and admins can update diet plans")
        
        supabase = get_supabase_client()
        
        existing = supabase.table("diet_plans").select("*").eq("id", plan_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Diet plan not found")
        
        update_data = {}
        if plan.name is not None:
            update_data["name"] = plan.name
        if plan.description is not None:
            update_data["description"] = plan.description
        if plan.goal is not None:
            update_data["goal"] = plan.goal
        if plan.duration_weeks is not None:
            update_data["duration_weeks"] = plan.duration_weeks
        if plan.daily_calories is not None:
            update_data["daily_calories"] = plan.daily_calories
        if plan.macros is not None:
            update_data["macros"] = plan.macros.dict()
        if plan.meals is not None:
            update_data["meals"] = [meal.dict() for meal in plan.meals]
        if plan.supplements is not None:
            update_data["supplements"] = plan.supplements
        if plan.restrictions is not None:
            update_data["restrictions"] = plan.restrictions
        if plan.notes is not None:
            update_data["notes"] = plan.notes
        if plan.status is not None:
            update_data["status"] = plan.status
        
        response = supabase.table("diet_plans").update(update_data).eq("id", plan_id).execute()
        
        await log_audit(
            user_id=current_user["id"],
            user_email=current_user["email"],
            action="UPDATE",
            entity_type="diet_plan",
            entity_id=plan_id,
            changes={"before": existing.data[0], "after": response.data[0]},
            request=request
        )
        
        return {"success": True, "data": response.data[0], "message": "Diet plan updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{plan_id}")
async def delete_diet_plan(
    plan_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Delete a diet plan"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only admins can delete diet plans")
        
        supabase = get_supabase_client()
        
        existing = supabase.table("diet_plans").select("*").eq("id", plan_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Diet plan not found")
        
        supabase.table("diet_plans").delete().eq("id", plan_id).execute()
        
        await log_audit(
            user_id=current_user["id"],
            user_email=current_user["email"],
            action="DELETE",
            entity_type="diet_plan",
            entity_id=plan_id,
            changes={"deleted": existing.data[0]},
            request=request
        )
        
        return {"success": True, "message": "Diet plan deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/member/{member_id}/active")
async def get_member_active_diet_plans(
    member_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get active diet plans for a specific member"""
    try:
        if current_user["role"] == "member" and current_user["id"] != member_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        supabase = get_supabase_client()
        response = supabase.table("diet_plans")\
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
        print(f"Audit log error: {e}")
