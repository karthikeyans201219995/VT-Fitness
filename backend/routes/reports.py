"""
Reports and analytics routes
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any
import logging
from supabase_client import get_supabase, get_supabase_service
from datetime import datetime, timedelta, date

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/dashboard")
async def get_dashboard_stats() -> Dict[str, Any]:
    """Get dashboard statistics"""
    supabase = get_supabase_service()
    
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
    supabase = get_supabase_service()
    
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
    supabase = get_supabase_service()
    
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
    supabase = get_supabase_service()
    
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



@router.get("/charts/revenue-trend")
async def get_revenue_trend(days: int = 30) -> Dict[str, Any]:
    """Get revenue trend data for charts (day-by-day)"""
    supabase = get_supabase_service()
    
    try:
        start_date = (date.today() - timedelta(days=days))
        
        payments_response = supabase.table("payments")\
            .select("amount, payment_date")\
            .gte("payment_date", start_date.isoformat())\
            .eq("status", "completed")\
            .execute()
        
        # Group by date
        revenue_by_date = {}
        for i in range(days + 1):
            current_date = (start_date + timedelta(days=i)).isoformat()
            revenue_by_date[current_date] = 0
        
        for payment in payments_response.data:
            payment_date = payment.get("payment_date")
            if payment_date in revenue_by_date:
                revenue_by_date[payment_date] += payment.get("amount", 0)
        
        # Format for charts
        chart_data = [
            {"date": date_str, "revenue": amount}
            for date_str, amount in sorted(revenue_by_date.items())
        ]
        
        return {
            "success": True,
            "data": chart_data,
            "total": sum(revenue_by_date.values())
        }
        
    except Exception as e:
        logger.error(f"Revenue trend error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/charts/attendance-trend")
async def get_attendance_trend(days: int = 30) -> Dict[str, Any]:
    """Get attendance trend data for charts"""
    supabase = get_supabase_service()
    
    try:
        start_date = (date.today() - timedelta(days=days))
        
        attendance_response = supabase.table("attendance")\
            .select("date")\
            .gte("date", start_date.isoformat())\
            .execute()
        
        # Group by date
        attendance_by_date = {}
        for i in range(days + 1):
            current_date = (start_date + timedelta(days=i)).isoformat()
            attendance_by_date[current_date] = 0
        
        for record in attendance_response.data:
            record_date = record.get("date")
            if record_date in attendance_by_date:
                attendance_by_date[record_date] += 1
        
        # Format for charts
        chart_data = [
            {"date": date_str, "attendance": count}
            for date_str, count in sorted(attendance_by_date.items())
        ]
        
        return {
            "success": True,
            "data": chart_data,
            "total": sum(attendance_by_date.values()),
            "average": round(sum(attendance_by_date.values()) / len(attendance_by_date), 2)
        }
        
    except Exception as e:
        logger.error(f"Attendance trend error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/charts/member-growth")
async def get_member_growth(months: int = 12) -> Dict[str, Any]:
    """Get member growth over time"""
    supabase = get_supabase_service()
    
    try:
        members_response = supabase.table("members")\
            .select("created_at, status")\
            .execute()
        
        # Group by month
        member_growth = {}
        
        for i in range(months):
            month_date = date.today().replace(day=1) - timedelta(days=i * 30)
            month_key = month_date.strftime("%Y-%m")
            member_growth[month_key] = {"new": 0, "total": 0, "active": 0}
        
        for member in members_response.data:
            created_at = member.get("created_at")
            if created_at:
                # Parse date (handle both formats)
                if "T" in created_at:
                    member_date = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
                else:
                    member_date = datetime.fromisoformat(created_at)
                month_key = member_date.strftime("%Y-%m")
                
                if month_key in member_growth:
                    member_growth[month_key]["new"] += 1
        
        # Calculate cumulative total
        sorted_months = sorted(member_growth.keys())
        cumulative = 0
        for month in sorted_months:
            cumulative += member_growth[month]["new"]
            member_growth[month]["total"] = cumulative
        
        # Format for charts
        chart_data = [
            {"month": month, "new": data["new"], "total": data["total"]}
            for month, data in sorted(member_growth.items())
        ]
        
        return {
            "success": True,
            "data": chart_data
        }
        
    except Exception as e:
        logger.error(f"Member growth error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/charts/class-popularity")
async def get_class_popularity() -> Dict[str, Any]:
    """Get class booking statistics"""
    supabase = get_supabase_service()
    
    try:
        # Get all classes with booking counts
        classes_response = supabase.table("classes").select("id, name, category").execute()
        bookings_response = supabase.table("class_bookings")\
            .select("class_id")\
            .eq("status", "confirmed")\
            .execute()
        
        # Count bookings per class
        booking_counts = {}
        for booking in bookings_response.data:
            class_id = booking.get("class_id")
            booking_counts[class_id] = booking_counts.get(class_id, 0) + 1
        
        # Format for charts
        chart_data = []
        for cls in classes_response.data:
            class_id = cls.get("id")
            chart_data.append({
                "name": cls.get("name"),
                "category": cls.get("category"),
                "bookings": booking_counts.get(class_id, 0)
            })
        
        # Sort by popularity
        chart_data.sort(key=lambda x: x["bookings"], reverse=True)
        
        return {
            "success": True,
            "data": chart_data[:10]  # Top 10 classes
        }
        
    except Exception as e:
        logger.error(f"Class popularity error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/charts/payment-methods")
async def get_payment_methods_distribution() -> Dict[str, Any]:
    """Get payment methods distribution"""
    supabase = get_supabase_service()
    
    try:
        payments_response = supabase.table("payments")\
            .select("payment_method, amount")\
            .eq("status", "completed")\
            .execute()
        
        # Group by payment method
        method_stats = {}
        for payment in payments_response.data:
            method = payment.get("payment_method", "unknown")
            if method not in method_stats:
                method_stats[method] = {"count": 0, "total": 0}
            method_stats[method]["count"] += 1
            method_stats[method]["total"] += payment.get("amount", 0)
        
        # Format for charts
        chart_data = [
            {
                "method": method,
                "count": stats["count"],
                "total": stats["total"]
            }
            for method, stats in method_stats.items()
        ]
        
        return {
            "success": True,
            "data": chart_data
        }
        
    except Exception as e:
        logger.error(f"Payment methods error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
