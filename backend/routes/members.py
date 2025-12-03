"""
Members management routes
"""
from fastapi import APIRouter, HTTPException, Header
from typing import List, Optional
import logging
from models import MemberCreate, MemberUpdate, MemberResponse
from supabase_client import get_supabase, check_supabase_configured
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/members", tags=["Members"])


def verify_token(authorization: str = Header(...)):
    """Verify user token"""
    if not check_supabase_configured():
        raise HTTPException(status_code=503, detail="Supabase not configured")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    supabase = get_supabase()
    
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Unauthorized")
        return user_response.user
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.post("", response_model=MemberResponse)
async def create_member(member: MemberCreate, user = None):
    """Create a new member"""
    # Verify token first
    from fastapi import Depends
    
    supabase = get_supabase()
    
    try:
        # Check if email already exists
        existing = supabase.table("members").select("id").eq("email", member.email).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Member with this email already exists")
        
        # Get plan name if plan_id provided
        plan_name = None
        if member.plan_id:
            plan_response = supabase.table("plans").select("name").eq("id", member.plan_id).execute()
            if plan_response.data:
                plan_name = plan_response.data[0]["name"]
        
        # Create member
        member_data = member.model_dump()
        member_data["start_date"] = member.start_date.isoformat()
        member_data["end_date"] = member.end_date.isoformat()
        member_data["date_of_birth"] = member.date_of_birth.isoformat() if member.date_of_birth else None
        member_data["created_at"] = datetime.utcnow().isoformat()
        
        # Create user account for member
        try:
            auth_response = supabase.auth.admin.create_user({
                "email": member.email,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": member.full_name,
                    "phone": member.phone,
                    "role": "member"
                }
            })
            member_data["user_id"] = auth_response.user.id
        except:
            # If auth creation fails, create without user_id
            member_data["user_id"] = None
        
        response = supabase.table("members").insert(member_data).execute()
        
        result = response.data[0]
        result["plan_name"] = plan_name
        
        return MemberResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create member error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[MemberResponse])
async def get_members(status: Optional[str] = None):
    """Get all members"""
    supabase = get_supabase()
    
    try:
        query = supabase.table("members").select("*, plans(name)")
        
        if status:
            query = query.eq("status", status)
        
        response = query.execute()
        
        # Format response
        members = []
        for member in response.data:
            member_dict = {**member}
            member_dict["plan_name"] = member.get("plans", {}).get("name") if member.get("plans") else None
            if "plans" in member_dict:
                del member_dict["plans"]
            members.append(MemberResponse(**member_dict))
        
        return members
        
    except Exception as e:
        logger.error(f"Get members error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{member_id}", response_model=MemberResponse)
async def get_member(member_id: str):
    """Get member by ID"""
    supabase = get_supabase()
    
    try:
        response = supabase.table("members").select("*, plans(name)").eq("id", member_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Member not found")
        
        member = response.data[0]
        member["plan_name"] = member.get("plans", {}).get("name") if member.get("plans") else None
        if "plans" in member:
            del member["plans"]
        
        return MemberResponse(**member)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get member error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{member_id}", response_model=MemberResponse)
async def update_member(member_id: str, member_update: MemberUpdate):
    """Update member"""
    supabase = get_supabase()
    
    try:
        # Get existing member
        existing = supabase.table("members").select("*").eq("id", member_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Member not found")
        
        # Prepare update data
        update_data = member_update.model_dump(exclude_unset=True)
        if "start_date" in update_data and update_data["start_date"]:
            update_data["start_date"] = update_data["start_date"].isoformat()
        if "end_date" in update_data and update_data["end_date"]:
            update_data["end_date"] = update_data["end_date"].isoformat()
        if "date_of_birth" in update_data and update_data["date_of_birth"]:
            update_data["date_of_birth"] = update_data["date_of_birth"].isoformat()
        
        # Update member
        response = supabase.table("members").update(update_data).eq("id", member_id).execute()
        
        # Get plan name if needed
        plan_name = None
        if response.data[0].get("plan_id"):
            plan_response = supabase.table("plans").select("name").eq("id", response.data[0]["plan_id"]).execute()
            if plan_response.data:
                plan_name = plan_response.data[0]["name"]
        
        result = response.data[0]
        result["plan_name"] = plan_name
        
        return MemberResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update member error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{member_id}")
async def delete_member(member_id: str):
    """Delete member"""
    supabase = get_supabase()
    
    try:
        # Check if member exists
        existing = supabase.table("members").select("id").eq("id", member_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Member not found")
        
        # Delete member
        supabase.table("members").delete().eq("id", member_id).execute()
        
        return {"message": "Member deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete member error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
