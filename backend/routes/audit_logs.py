"""
Audit Logs API Routes
Handles viewing system audit logs (admin only)
"""
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import date, datetime, timedelta
from supabase_client import get_supabase
from routes.auth import get_current_user

router = APIRouter(prefix="/api/audit-logs", tags=["audit_logs"])


@router.get("/")
async def get_audit_logs(
    user_id: Optional[str] = None,
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    """Get audit logs (admin only)"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only admins can view audit logs")
        
        supabase = get_supabase()
        query = supabase.table("audit_logs").select("*")
        
        if user_id:
            query = query.eq("user_id", user_id)
        if entity_type:
            query = query.eq("entity_type", entity_type)
        if action:
            query = query.eq("action", action)
        if start_date:
            query = query.gte("timestamp", start_date.isoformat())
        if end_date:
            end_datetime = datetime.combine(end_date, datetime.max.time())
            query = query.lte("timestamp", end_datetime.isoformat())
        
        query = query.order("timestamp", desc=True).limit(limit)
        response = query.execute()
        
        return {"success": True, "data": response.data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_audit_stats(
    days: int = 30,
    current_user: dict = Depends(get_current_user)
):
    """Get audit statistics for the last N days"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only admins can view audit logs")
        
        supabase = get_supabase()
        start_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        response = supabase.table("audit_logs")\
            .select("*")\
            .gte("timestamp", start_date)\
            .execute()
        
        logs = response.data
        
        # Calculate statistics
        total_actions = len(logs)
        actions_by_type = {}
        actions_by_entity = {}
        actions_by_user = {}
        
        for log in logs:
            # Count by action type
            action = log.get("action", "UNKNOWN")
            actions_by_type[action] = actions_by_type.get(action, 0) + 1
            
            # Count by entity type
            entity = log.get("entity_type", "UNKNOWN")
            actions_by_entity[entity] = actions_by_entity.get(entity, 0) + 1
            
            # Count by user
            user_email = log.get("user_email", "UNKNOWN")
            actions_by_user[user_email] = actions_by_user.get(user_email, 0) + 1
        
        return {
            "success": True,
            "data": {
                "total_actions": total_actions,
                "days_analyzed": days,
                "actions_by_type": actions_by_type,
                "actions_by_entity": actions_by_entity,
                "top_users": dict(sorted(actions_by_user.items(), key=lambda x: x[1], reverse=True)[:10])
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/entity/{entity_type}/{entity_id}")
async def get_entity_audit_history(
    entity_type: str,
    entity_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get audit history for a specific entity"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only admins can view audit logs")
        
        supabase = get_supabase()
        response = supabase.table("audit_logs")\
            .select("*")\
            .eq("entity_type", entity_type)\
            .eq("entity_id", entity_id)\
            .order("timestamp", desc=True)\
            .execute()
        
        return {"success": True, "data": response.data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
