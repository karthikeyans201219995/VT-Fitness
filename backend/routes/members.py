"""
Members management routes
"""
from fastapi import APIRouter, HTTPException, Header
from typing import List, Optional
import logging
from models import MemberCreate, MemberUpdate, MemberResponse
from supabase_client import get_supabase, get_supabase_service, check_supabase_configured
from datetime import datetime
from password_manager import decrypt_password

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
    """Create a new member with payment"""
    # Use service client for admin operations
    supabase = get_supabase_service()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase service not configured")
    
    try:
        # Validate payment information is provided
        if not member.payment_amount or not member.payment_method or not member.payment_date:
            raise HTTPException(
                status_code=400, 
                detail="Payment information is required. Please provide payment amount, method, and date."
            )
        
        if member.payment_amount <= 0:
            raise HTTPException(status_code=400, detail="Payment amount must be greater than 0")
        
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
        
        # Remove payment fields from member_data as they're not part of members table
        member_data.pop("payment_amount", None)
        member_data.pop("payment_method", None)
        member_data.pop("payment_date", None)
        
        # Create user account for member using service client
        user_id = None
        try:
            # Generate a default password if not provided
            import secrets
            import string
            password = member.password
            if not password:
                # Generate random 12-character password
                alphabet = string.ascii_letters + string.digits + "!@#$%"
                password = ''.join(secrets.choice(alphabet) for i in range(12))
            
            auth_response = supabase.auth.admin.create_user({
                "email": member.email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": member.full_name,
                    "phone": member.phone,
                    "role": "member"
                }
            })
            user_id = auth_response.user.id
            
            # Create entry in users table
            user_data = {
                "id": user_id,
                "email": member.email,
                "full_name": member.full_name,
                "phone": member.phone,
                "role": "member"
            }
            supabase.table("users").insert(user_data).execute()
            
            member_data["user_id"] = user_id
        except Exception as auth_error:
            # If auth creation fails, log the error and create without user_id
            logger.warning(f"Failed to create auth user: {str(auth_error)}")
            member_data["user_id"] = None
        
        response = supabase.table("members").insert(member_data).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=500, detail="Failed to create member - no data returned")
        
        result = response.data[0]
        member_id = result["id"]
        result["plan_name"] = plan_name
        
        # Ensure all required fields are present
        if not result.get("user_id"):
            result["user_id"] = None
        
        # Create payment record
        try:
            payment_data = {
                "member_id": member_id,
                "amount": member.payment_amount,
                "payment_method": member.payment_method.value,
                "payment_date": member.payment_date.isoformat(),
                "plan_id": member.plan_id,
                "description": f"Initial payment for {member.full_name}",
                "status": "completed",
                "created_at": datetime.utcnow().isoformat()
            }
            payment_response = supabase.table("payments").insert(payment_data).execute()
            logger.info(f"Payment record created for member {member_id}")
        except Exception as payment_error:
            # If payment creation fails, delete the member and raise error
            logger.error(f"Failed to create payment record: {str(payment_error)}")
            supabase.table("members").delete().eq("id", member_id).execute()
            if user_id:
                # Also delete the auth user if created
                try:
                    supabase.auth.admin.delete_user(user_id)
                    supabase.table("users").delete().eq("id", user_id).execute()
                except:
                    pass
            raise HTTPException(
                status_code=400, 
                detail=f"Failed to create payment record. Member creation rolled back: {str(payment_error)}"
            )
        
        return MemberResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"Create member error: {str(e)}\n{error_details}")
        raise HTTPException(status_code=400, detail=f"Failed to create member: {str(e)}")


@router.get("", response_model=List[MemberResponse])
async def get_members(status: Optional[str] = None):
    """Get all members"""
    supabase = get_supabase_service()
    
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
    supabase = get_supabase_service()  # Use service client to bypass RLS
    
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


@router.get("/{member_id}/password")
async def get_member_password(member_id: str):
    """Get member's stored password (admin only)"""
    supabase = get_supabase_service()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase service not configured")
    
    try:
        # Get encrypted password from database
        response = supabase.table("member_passwords").select("*").eq("member_id", member_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Password not found. Member may have been created before password storage was enabled.")
        
        password_record = response.data[0]
        encrypted_password = password_record.get("encrypted_password")
        
        if not encrypted_password:
            raise HTTPException(status_code=404, detail="No password stored for this member")
        
        # Decrypt password
        decrypted_password = decrypt_password(encrypted_password)
        
        if not decrypted_password:
            raise HTTPException(status_code=500, detail="Failed to decrypt password")
        
        # Get member info
        member_response = supabase.table("members").select("full_name, email").eq("id", member_id).execute()
        member_info = member_response.data[0] if member_response.data else {}
        
        return {
            "member_id": member_id,
            "email": password_record.get("email"),
            "full_name": member_info.get("full_name", ""),
            "password": decrypted_password,
            "created_at": password_record.get("created_at")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get member password error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{member_id}")
async def delete_member(member_id: str):
    """Delete member and associated records"""
    supabase = get_supabase_service()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase service not configured")
    
    try:
        # Check if member exists and get user_id
        existing = supabase.table("members").select("id, user_id, email").eq("id", member_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Member not found")
        
        member = existing.data[0]
        user_id = member.get("user_id")
        
        # Delete associated records first (due to foreign key constraints)
        # Delete stored password
        try:
            supabase.table("member_passwords").delete().eq("member_id", member_id).execute()
            logger.info(f"Deleted stored password for member {member_id}")
        except Exception as e:
            logger.warning(f"Error deleting stored password: {str(e)}")
        
        # Delete payments
        try:
            supabase.table("payments").delete().eq("member_id", member_id).execute()
            logger.info(f"Deleted payments for member {member_id}")
        except Exception as e:
            logger.warning(f"Error deleting payments: {str(e)}")
        
        # Delete attendance records
        try:
            supabase.table("attendance").delete().eq("member_id", member_id).execute()
            logger.info(f"Deleted attendance for member {member_id}")
        except Exception as e:
            logger.warning(f"Error deleting attendance: {str(e)}")
        
        # Delete member
        supabase.table("members").delete().eq("id", member_id).execute()
        logger.info(f"Deleted member {member_id}")
        
        # Delete auth user if exists
        if user_id:
            try:
                supabase.auth.admin.delete_user(user_id)
                logger.info(f"Deleted auth user {user_id}")
            except Exception as auth_error:
                logger.warning(f"Error deleting auth user: {str(auth_error)}")
            
            # Delete from users table
            try:
                supabase.table("users").delete().eq("id", user_id).execute()
                logger.info(f"Deleted user record {user_id}")
            except Exception as user_error:
                logger.warning(f"Error deleting user record: {str(user_error)}")
        
        return {"message": "Member deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete member error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
