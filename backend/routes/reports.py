"""
Reports and analytics routes
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import logging
from supabase_client import get_supabase
from datetime import datetime, timedelta, date

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/dashboard")
async def get_dashboard_stats() -> Dict[str, Any]:
    """Get dashboard statistics"""
    supabase = get_supabase()
    
    try:
        # Total members
        members_response = supabase.table("members").select("id, status").execute()
        total_members = len(members_response.data)
        active_members = len([m for m in members_response.data if m.get("status") == "active"])
        
        # Today's attendance
        today = date.today().isoformat()
        attendance_response = supabase.table("attendance").select("id").eq("date", today).execute()
        today_attendance = len(attendance_response.data)
        
        # This month's revenue
        first_day = date.today().replace(day=1).isoformat()
        payments_response = supabase.table("payments").select("amount").gte("payment_date", first_day).eq("status", "completed").execute()
        monthly_revenue = sum(p.get("amount", 0) for p in payments_response.data)
        
        # Total plans
        plans_response = supabase.table("plans").select("id").eq("is_active", True).execute()
        total_plans = len(plans_response.data)
        
        return {
            "total_members": total_members,
            "active_members": active_members,
            "today_attendance": today_attendance,
            "monthly_revenue": monthly_revenue,
            "total_plans": total_plans
        }
        
    except Exception as e:
        logger.error(f"Dashboard stats error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/revenue")
async def get_revenue_report(days: int = 30) -> Dict[str, Any]:
    """Get revenue report for specified days"""
    supabase = get_supabase()
    
    try:
        start_date = (date.today() - timedelta(days=days)).isoformat()
        
        payments_response = supabase.table("payments").select("amount, payment_date, payment_method").gte("payment_date", start_date).eq("status", "completed").execute()
        
        total_revenue = sum(p.get("amount", 0) for p in payments_response.data)
        total_transactions = len(payments_response.data)
        
        # Revenue by payment method
        revenue_by_method = {}
        for payment in payments_response.data:
            method = payment.get("payment_method", "unknown")
            revenue_by_method[method] = revenue_by_method.get(method, 0) + payment.get("amount", 0)
        
        return {
            "period_days": days,
            "start_date": start_date,
            "end_date": date.today().isoformat(),
            "total_revenue": total_revenue,
            "total_transactions": total_transactions,
            "revenue_by_method": revenue_by_method,
            "daily_data": payments_response.data
        }
        
    except Exception as e:
        logger.error(f"Revenue report error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/attendance")
async def get_attendance_report(days: int = 30) -> Dict[str, Any]:
    """Get attendance report for specified days"""
    supabase = get_supabase()
    
    try:
        start_date = (date.today() - timedelta(days=days)).isoformat()
        
        attendance_response = supabase.table("attendance").select("date, member_id").gte("date", start_date).execute()
        
        # Group by date
        attendance_by_date = {}
        for record in attendance_response.data:
            record_date = record.get("date")
            attendance_by_date[record_date] = attendance_by_date.get(record_date, 0) + 1
        
        total_visits = len(attendance_response.data)
        avg_daily = total_visits / days if days > 0 else 0
        
        return {
            "period_days": days,
            "start_date": start_date,
            "end_date": date.today().isoformat(),
            "total_visits": total_visits,
            "average_daily_visits": round(avg_daily, 2),
            "attendance_by_date": attendance_by_date
        }
        
    except Exception as e:
        logger.error(f"Attendance report error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/members")
async def get_members_report() -> Dict[str, Any]:
    """Get members statistics report"""
    supabase = get_supabase()
    
    try:
        members_response = supabase.table("members").select("status, gender, end_date").execute()
        
        # Count by status
        status_counts = {}
        for member in members_response.data:
            status = member.get("status", "unknown")
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Count by gender
        gender_counts = {}
        for member in members_response.data:
            gender = member.get("gender") or "not_specified"
            gender_counts[gender] = gender_counts.get(gender, 0) + 1
        
        # Expiring soon (within 30 days)
        expiring_soon_date = (date.today() + timedelta(days=30)).isoformat()
        expiring_soon = len([m for m in members_response.data if m.get("end_date") and m.get("end_date") <= expiring_soon_date and m.get("end_date") >= date.today().isoformat()])
        
        return {
            "total_members": len(members_response.data),
            "by_status": status_counts,
            "by_gender": gender_counts,
            "expiring_soon": expiring_soon
        }
        
    except Exception as e:
        logger.error(f"Members report error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
