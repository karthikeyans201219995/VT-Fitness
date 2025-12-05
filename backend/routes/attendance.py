"""
Attendance tracking routes
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
import logging
from models import AttendanceCreate, AttendanceUpdate, AttendanceResponse
from supabase_client import get_supabase, get_supabase_service
from datetime import datetime, date

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("", response_model=AttendanceResponse)
async def create_attendance(attendance: AttendanceCreate):
    """Create attendance record (check-in)"""
    supabase = get_supabase()
    
    try:
        # Get member info
        member_response = supabase.table("members").select("full_name").eq("id", attendance.member_id).execute()
        if not member_response.data:
            raise HTTPException(status_code=404, detail="Member not found")
        
        member_name = member_response.data[0]["full_name"]
        
        # Create attendance record
        attendance_data = attendance.model_dump()
        attendance_data["check_in_time"] = (attendance.check_in_time or datetime.utcnow()).isoformat()
        if attendance.check_out_time:
            attendance_data["check_out_time"] = attendance.check_out_time.isoformat()
        attendance_data["date"] = date.today().isoformat()
        attendance_data["created_at"] = datetime.utcnow().isoformat()
        
        response = supabase.table("attendance").insert(attendance_data).execute()
        
        result = response.data[0]
        result["member_name"] = member_name
        
        return AttendanceResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create attendance error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[AttendanceResponse])
async def get_attendance(member_id: Optional[str] = None, date_from: Optional[str] = None, date_to: Optional[str] = None):
    """Get attendance records"""
    supabase = get_supabase_service()
    
    try:
        query = supabase.table("attendance").select("*, members(full_name)")
        
        if member_id:
            query = query.eq("member_id", member_id)
        
        if date_from:
            query = query.gte("date", date_from)
        
        if date_to:
            query = query.lte("date", date_to)
        
        response = query.order("check_in_time", desc=True).execute()
        
        # Format response
        records = []
        for record in response.data:
            record_dict = {**record}
            record_dict["member_name"] = record.get("members", {}).get("full_name", "") if record.get("members") else ""
            if "members" in record_dict:
                del record_dict["members"]
            records.append(AttendanceResponse(**record_dict))
        
        return records
        
    except Exception as e:
        logger.error(f"Get attendance error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{attendance_id}", response_model=AttendanceResponse)
async def get_attendance_record(attendance_id: str):
    """Get attendance record by ID"""
    supabase = get_supabase()
    
    try:
        response = supabase.table("attendance").select("*, members(full_name)").eq("id", attendance_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Attendance record not found")
        
        record = response.data[0]
        record["member_name"] = record.get("members", {}).get("full_name", "") if record.get("members") else ""
        if "members" in record:
            del record["members"]
        
        return AttendanceResponse(**record)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get attendance record error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{attendance_id}", response_model=AttendanceResponse)
async def update_attendance(attendance_id: str, attendance_update: AttendanceUpdate):
    """Update attendance record (check-out)"""
    supabase = get_supabase()
    
    try:
        # Check if record exists
        existing = supabase.table("attendance").select("*").eq("id", attendance_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Attendance record not found")
        
        # Update record
        update_data = attendance_update.model_dump(exclude_unset=True)
        if "check_out_time" in update_data and update_data["check_out_time"]:
            update_data["check_out_time"] = update_data["check_out_time"].isoformat()
        
        response = supabase.table("attendance").update(update_data).eq("id", attendance_id).execute()
        
        # Get member name
        member_response = supabase.table("members").select("full_name").eq("id", response.data[0]["member_id"]).execute()
        member_name = member_response.data[0]["full_name"] if member_response.data else ""
        
        result = response.data[0]
        result["member_name"] = member_name
        
        return AttendanceResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update attendance error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{attendance_id}")
async def delete_attendance(attendance_id: str):
    """Delete attendance record"""
    supabase = get_supabase()
    
    try:
        # Check if record exists
        existing = supabase.table("attendance").select("id").eq("id", attendance_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Attendance record not found")
        
        # Delete record
        supabase.table("attendance").delete().eq("id", attendance_id).execute()
        
        return {"message": "Attendance record deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete attendance error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
