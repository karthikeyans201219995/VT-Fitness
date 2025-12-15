"""
QR Code based attendance tracking routes
"""
from fastapi import APIRouter, HTTPException
from typing import Optional
import logging
from models import QRScanRequest, QRScanResponse
from supabase_client import get_supabase, get_supabase_service
from datetime import datetime, date
from qr_service import generate_qr_code, generate_qr_image

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/qr-attendance", tags=["QR Attendance"])


@router.post("/generate/{member_id}")
async def generate_member_qr(member_id: str):
    """Generate QR code for a member"""
    supabase = get_supabase_service()
    
    try:
        # Check if member exists
        member_response = supabase.table("members").select("id, full_name, qr_code").eq("id", member_id).execute()
        if not member_response.data:
            raise HTTPException(status_code=404, detail="Member not found")
        
        member = member_response.data[0]
        
        # Generate new QR code if not exists
        if not member.get("qr_code"):
            qr_code_data = generate_qr_code(member_id)
            
            # Update member with QR code
            supabase.table("members").update({"qr_code": qr_code_data}).eq("id", member_id).execute()
        else:
            qr_code_data = member["qr_code"]
        
        # Generate QR image
        qr_image = generate_qr_image(qr_code_data)
        
        return {
            "member_id": member_id,
            "member_name": member["full_name"],
            "qr_code": qr_code_data,
            "qr_image": qr_image
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generate QR error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/scan", response_model=QRScanResponse)
async def scan_qr_code(scan_request: QRScanRequest):
    """
    Scan QR code for attendance
    - If no active check-in exists: creates check-in
    - If active check-in exists: creates check-out
    """
    supabase = get_supabase_service()
    
    try:
        logger.info(f"Scanning QR code: {scan_request.qr_code}")
        
        # Find member by QR code
        member_response = supabase.table("members").select("id, full_name, status").eq("qr_code", scan_request.qr_code).execute()
        
        logger.info(f"Member search result: {member_response.data}")
        
        if not member_response.data:
            # Log all members with QR codes for debugging
            all_members = supabase.table("members").select("id, full_name, qr_code").limit(5).execute()
            logger.info(f"Sample members with QR codes: {all_members.data}")
            raise HTTPException(status_code=404, detail=f"Invalid QR code or member not found. Scanned: {scan_request.qr_code}")
        
        member = member_response.data[0]
        member_id = member["id"]
        member_name = member["full_name"]
        
        # Check member status
        if member["status"] != "active":
            raise HTTPException(status_code=403, detail=f"Member status is {member['status']}. Only active members can check in.")
        
        # Check for existing check-in today without check-out
        today = date.today().isoformat()
        attendance_response = supabase.table("attendance")\
            .select("*")\
            .eq("member_id", member_id)\
            .eq("date", today)\
            .is_("check_out_time", "null")\
            .order("check_in_time", desc=True)\
            .limit(1)\
            .execute()
        
        current_time = datetime.utcnow()
        
        if attendance_response.data:
            # Member has active check-in, perform check-out
            attendance_record = attendance_response.data[0]
            attendance_id = attendance_record["id"]
            
            # Update with check-out time
            update_data = {
                "check_out_time": current_time.isoformat()
            }
            if scan_request.notes:
                update_data["notes"] = scan_request.notes
            
            supabase.table("attendance").update(update_data).eq("id", attendance_id).execute()
            
            return QRScanResponse(
                success=True,
                action="check_out",
                member_name=member_name,
                member_id=member_id,
                timestamp=current_time.isoformat(),
                message=f"{member_name} checked out successfully",
                attendance_id=attendance_id
            )
        else:
            # No active check-in, perform check-in
            attendance_data = {
                "member_id": member_id,
                "check_in_time": current_time.isoformat(),
                "date": today,
                "notes": scan_request.notes,
                "created_at": current_time.isoformat()
            }
            
            response = supabase.table("attendance").insert(attendance_data).execute()
            attendance_id = response.data[0]["id"]
            
            return QRScanResponse(
                success=True,
                action="check_in",
                member_name=member_name,
                member_id=member_id,
                timestamp=current_time.isoformat(),
                message=f"{member_name} checked in successfully",
                attendance_id=attendance_id
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"QR scan error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/status/{member_id}")
async def get_member_attendance_status(member_id: str):
    """Get current attendance status for a member"""
    supabase = get_supabase_service()
    
    try:
        # Get member info
        member_response = supabase.table("members").select("id, full_name, status").eq("id", member_id).execute()
        if not member_response.data:
            raise HTTPException(status_code=404, detail="Member not found")
        
        member = member_response.data[0]
        
        # Check for active check-in today
        today = date.today().isoformat()
        attendance_response = supabase.table("attendance")\
            .select("*")\
            .eq("member_id", member_id)\
            .eq("date", today)\
            .is_("check_out_time", "null")\
            .order("check_in_time", desc=True)\
            .limit(1)\
            .execute()
        
        if attendance_response.data:
            attendance = attendance_response.data[0]
            return {
                "member_id": member_id,
                "member_name": member["full_name"],
                "is_checked_in": True,
                "check_in_time": attendance["check_in_time"],
                "attendance_id": attendance["id"]
            }
        else:
            return {
                "member_id": member_id,
                "member_name": member["full_name"],
                "is_checked_in": False,
                "check_in_time": None,
                "attendance_id": None
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get status error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/regenerate/{member_id}")
async def regenerate_member_qr(member_id: str):
    """Regenerate QR code for a member (in case of lost/stolen QR)"""
    supabase = get_supabase_service()
    
    try:
        # Check if member exists
        member_response = supabase.table("members").select("id, full_name").eq("id", member_id).execute()
        if not member_response.data:
            raise HTTPException(status_code=404, detail="Member not found")
        
        member = member_response.data[0]
        
        # Generate new QR code
        qr_code_data = generate_qr_code(member_id)
        
        # Update member with new QR code
        supabase.table("members").update({"qr_code": qr_code_data}).eq("id", member_id).execute()
        
        # Generate QR image
        qr_image = generate_qr_image(qr_code_data)
        
        return {
            "member_id": member_id,
            "member_name": member["full_name"],
            "qr_code": qr_code_data,
            "qr_image": qr_image,
            "message": "QR code regenerated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Regenerate QR error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
