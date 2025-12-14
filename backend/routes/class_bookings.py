"""
Class Bookings API Routes
Handles member class reservations and cancellations
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional
from pydantic import BaseModel
from datetime import date, datetime
from supabase_client import get_supabase
from routes.auth import get_current_user

router = APIRouter(prefix="/api/class-bookings", tags=["class_bookings"])


class BookingCreate(BaseModel):
    class_id: str
    member_id: str
    booking_date: date


class BookingUpdate(BaseModel):
    status: str
    cancellation_reason: Optional[str] = None


@router.get("/")
async def get_bookings(
    member_id: Optional[str] = None,
    class_id: Optional[str] = None,
    booking_date: Optional[date] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all bookings"""
    try:
        supabase = get_supabase()
        query = supabase.table("class_bookings").select("*, classes(*), members(*)")
        
        # Members can only see their own bookings
        if current_user["role"] == "member":
            query = query.eq("member_id", current_user["id"])
        elif member_id:
            query = query.eq("member_id", member_id)
        
        if class_id:
            query = query.eq("class_id", class_id)
        if booking_date:
            query = query.eq("booking_date", str(booking_date))
        if status:
            query = query.eq("status", status)
        
        query = query.order("booking_date", desc=True)
        response = query.execute()
        
        return {"success": True, "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{booking_id}")
async def get_booking(
    booking_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific booking"""
    try:
        supabase = get_supabase()
        response = supabase.table("class_bookings")\
            .select("*, classes(*), members(*)")\
            .eq("id", booking_id)\
            .execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        booking = response.data[0]
        
        # Check access
        if current_user["role"] == "member" and booking["member_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return {"success": True, "data": booking}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def create_booking(
    booking: BookingCreate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Create a new class booking"""
    try:
        supabase = get_supabase()
        
        # Members can only book for themselves
        if current_user["role"] == "member" and booking.member_id != current_user["id"]:
            raise HTTPException(status_code=403, detail="You can only book classes for yourself")
        
        # Check if class exists and is active
        class_response = supabase.table("classes").select("*").eq("id", booking.class_id).execute()
        if not class_response.data:
            raise HTTPException(status_code=404, detail="Class not found")
        
        class_data = class_response.data[0]
        if class_data["status"] != "active":
            raise HTTPException(status_code=400, detail="Class is not active")
        
        # Check capacity
        existing_bookings = supabase.table("class_bookings")\
            .select("*")\
            .eq("class_id", booking.class_id)\
            .eq("booking_date", str(booking.booking_date))\
            .eq("status", "confirmed")\
            .execute()
        
        if len(existing_bookings.data) >= class_data["max_capacity"]:
            raise HTTPException(status_code=400, detail="Class is full")
        
        # Check for duplicate booking
        duplicate = supabase.table("class_bookings")\
            .select("*")\
            .eq("class_id", booking.class_id)\
            .eq("member_id", booking.member_id)\
            .eq("booking_date", str(booking.booking_date))\
            .eq("status", "confirmed")\
            .execute()
        
        if duplicate.data:
            raise HTTPException(status_code=400, detail="You already have a booking for this class")
        
        # Create booking
        booking_data = {
            "class_id": booking.class_id,
            "member_id": booking.member_id,
            "booking_date": str(booking.booking_date),
            "status": "confirmed"
        }
        
        response = supabase.table("class_bookings").insert(booking_data).execute()
        
        # Log audit
        await log_audit(
            user_id=current_user["id"],
            user_email=current_user["email"],
            action="CREATE",
            entity_type="class_booking",
            entity_id=response.data[0]["id"],
            request=request
        )
        
        return {"success": True, "data": response.data[0], "message": "Class booked successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{booking_id}")
async def update_booking(
    booking_id: str,
    booking: BookingUpdate,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Update booking status (e.g., cancel booking)"""
    try:
        supabase = get_supabase()
        
        # Get existing booking
        existing = supabase.table("class_bookings").select("*").eq("id", booking_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        existing_booking = existing.data[0]
        
        # Check access - members can only cancel their own bookings
        if current_user["role"] == "member" and existing_booking["member_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        update_data = {"status": booking.status}
        
        if booking.status == "cancelled":
            update_data["cancelled_at"] = datetime.utcnow().isoformat()
            if booking.cancellation_reason:
                update_data["cancellation_reason"] = booking.cancellation_reason
        
        response = supabase.table("class_bookings").update(update_data).eq("id", booking_id).execute()
        
        # Log audit
        await log_audit(
            user_id=current_user["id"],
            user_email=current_user["email"],
            action="UPDATE",
            entity_type="class_booking",
            entity_id=booking_id,
            changes={"before": existing_booking, "after": response.data[0]},
            request=request
        )
        
        return {"success": True, "data": response.data[0], "message": "Booking updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{booking_id}")
async def delete_booking(
    booking_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Delete a booking (admin only)"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only admins can delete bookings")
        
        supabase = get_supabase()
        
        existing = supabase.table("class_bookings").select("*").eq("id", booking_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Booking not found")
        
        supabase.table("class_bookings").delete().eq("id", booking_id).execute()
        
        # Log audit
        await log_audit(
            user_id=current_user["id"],
            user_email=current_user["email"],
            action="DELETE",
            entity_type="class_booking",
            entity_id=booking_id,
            changes={"deleted": existing.data[0]},
            request=request
        )
        
        return {"success": True, "message": "Booking deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/member/{member_id}/upcoming")
async def get_member_upcoming_bookings(
    member_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get upcoming bookings for a member"""
    try:
        # Check access
        if current_user["role"] == "member" and current_user["id"] != member_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        supabase = get_supabase()
        today = date.today().isoformat()
        
        response = supabase.table("class_bookings")\
            .select("*, classes(*)")\
            .eq("member_id", member_id)\
            .eq("status", "confirmed")\
            .gte("booking_date", today)\
            .order("booking_date")\
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
        supabase = get_supabase()
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
