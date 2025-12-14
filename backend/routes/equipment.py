"""
Equipment Management API Routes
Handles gym equipment inventory and maintenance tracking
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional
from pydantic import BaseModel
from datetime import date
from supabase_client import get_supabase_client
from routes.auth import get_current_user

router = APIRouter(prefix="/api/equipment", tags=["equipment"])


class EquipmentCreate(BaseModel):
    name: str
    category: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_price: Optional[float] = None
    warranty_expiry: Optional[date] = None
    status: str = "working"
    last_maintenance_date: Optional[date] = None
    next_maintenance_date: Optional[date] = None
    location: Optional[str] = None
    quantity: int = 1
    notes: Optional[str] = None


class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    model: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_price: Optional[float] = None
    warranty_expiry: Optional[date] = None
    status: Optional[str] = None
    last_maintenance_date: Optional[date] = None
    next_maintenance_date: Optional[date] = None
    location: Optional[str] = None
    quantity: Optional[int] = None
    notes: Optional[str] = None


@router.get("/")
async def get_equipment(
    category: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all equipment"""
    try:
        supabase = get_supabase_client()
        query = supabase.table("equipment").select("*")
        
        if category:
            query = query.eq("category", category)
        if status:
            query = query.eq("status", status)
        
        query = query.order("name")
        response = query.execute()
        
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{equipment_id}")
async def get_equipment_by_id(
    equipment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific equipment"""
    try:
        supabase = get_supabase_client()
        response = supabase.table("equipment").select("*").eq("id", equipment_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Equipment not found")
        
        return {"success": True, "data": response.data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_equipment(
    equipment: EquipmentCreate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Create new equipment (admin only)"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only admins can add equipment")
        
        supabase = get_supabase_client()
        
        equipment_data = equipment.dict()
        # Convert date objects to strings
        if equipment_data.get("purchase_date"):
            equipment_data["purchase_date"] = str(equipment_data["purchase_date"])
        if equipment_data.get("warranty_expiry"):
            equipment_data["warranty_expiry"] = str(equipment_data["warranty_expiry"])
        if equipment_data.get("last_maintenance_date"):
            equipment_data["last_maintenance_date"] = str(equipment_data["last_maintenance_date"])
        if equipment_data.get("next_maintenance_date"):
            equipment_data["next_maintenance_date"] = str(equipment_data["next_maintenance_date"])
        
        response = supabase.table("equipment").insert(equipment_data).execute()
        
        # Log audit
        await log_audit(
            user_id=current_user["id"],
            user_email=current_user["email"],
            action="CREATE",
            entity_type="equipment",
            entity_id=response.data[0]["id"],
            request=request
        )
        
        return {"success": True, "data": response.data[0], "message": "Equipment added successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{equipment_id}")
async def update_equipment(
    equipment_id: str,
    equipment: EquipmentUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Update equipment (admin only)"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only admins can update equipment")
        
        supabase = get_supabase_client()
        
        existing = supabase.table("equipment").select("*").eq("id", equipment_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Equipment not found")
        
        update_data = {k: v for k, v in equipment.dict(exclude_unset=True).items() if v is not None}
        
        # Convert dates
        for date_field in ["purchase_date", "warranty_expiry", "last_maintenance_date", "next_maintenance_date"]:
            if date_field in update_data and update_data[date_field]:
                update_data[date_field] = str(update_data[date_field])
        
        response = supabase.table("equipment").update(update_data).eq("id", equipment_id).execute()
        
        await log_audit(
            user_id=current_user["id"],
            user_email=current_user["email"],
            action="UPDATE",
            entity_type="equipment",
            entity_id=equipment_id,
            changes={"before": existing.data[0], "after": response.data[0]},
            request=request
        )
        
        return {"success": True, "data": response.data[0], "message": "Equipment updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{equipment_id}")
async def delete_equipment(
    equipment_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Delete equipment (admin only)"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only admins can delete equipment")
        
        supabase = get_supabase_client()
        
        existing = supabase.table("equipment").select("*").eq("id", equipment_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Equipment not found")
        
        supabase.table("equipment").delete().eq("id", equipment_id).execute()
        
        await log_audit(
            user_id=current_user["id"],
            user_email=current_user["email"],
            action="DELETE",
            entity_type="equipment",
            entity_id=equipment_id,
            changes={"deleted": existing.data[0]},
            request=request
        )
        
        return {"success": True, "message": "Equipment deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats/summary")
async def get_equipment_stats(current_user: dict = Depends(get_current_user)):
    """Get equipment statistics"""
    try:
        supabase = get_supabase_client()
        
        all_equipment = supabase.table("equipment").select("*").execute()
        
        total = len(all_equipment.data)
        working = len([e for e in all_equipment.data if e["status"] == "working"])
        maintenance = len([e for e in all_equipment.data if e["status"] == "maintenance"])
        broken = len([e for e in all_equipment.data if e["status"] == "broken"])
        
        return {
            "success": True,
            "data": {
                "total": total,
                "working": working,
                "maintenance": maintenance,
                "broken": broken
            }
        }
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
