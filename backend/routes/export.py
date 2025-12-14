"""
Export API Routes
Handles data export to CSV/Excel format
"""
from fastapi import APIRouter, HTTPException, Depends, Response
from typing import Optional
from datetime import date, datetime
import csv
import io
import pandas as pd
from supabase_client import get_supabase_client
from routes.auth import get_current_user

router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("/members")
async def export_members(
    format: str = "csv",
    current_user: dict = Depends(get_current_user)
):
    """Export members data to CSV/Excel"""
    try:
        if current_user["role"] not in ["admin", "trainer"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        supabase = get_supabase_client()
        response = supabase.table("members").select("*").order("created_at", desc=True).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="No data to export")
        
        # Convert to DataFrame
        df = pd.DataFrame(response.data)
        
        # Remove sensitive fields
        sensitive_fields = ["password_hash", "two_factor_secret", "phone_verified"]
        for field in sensitive_fields:
            if field in df.columns:
                df = df.drop(columns=[field])
        
        if format.lower() == "excel":
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Members')
            output.seek(0)
            
            return Response(
                content=output.getvalue(),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename=members_{datetime.now().strftime('%Y%m%d')}.xlsx"}
            )
        else:
            # CSV format
            output = io.StringIO()
            df.to_csv(output, index=False)
            
            return Response(
                content=output.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=members_{datetime.now().strftime('%Y%m%d')}.csv"}
            )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/payments")
async def export_payments(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    format: str = "csv",
    current_user: dict = Depends(get_current_user)
):
    """Export payments data to CSV/Excel"""
    try:
        if current_user["role"] not in ["admin"]:
            raise HTTPException(status_code=403, detail="Only admins can export payments")
        
        supabase = get_supabase_client()
        query = supabase.table("payments").select("*")
        
        if start_date:
            query = query.gte("payment_date", start_date.isoformat())
        if end_date:
            query = query.lte("payment_date", end_date.isoformat())
        
        response = query.order("payment_date", desc=True).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="No data to export")
        
        df = pd.DataFrame(response.data)
        
        if format.lower() == "excel":
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Payments')
            output.seek(0)
            
            return Response(
                content=output.getvalue(),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename=payments_{datetime.now().strftime('%Y%m%d')}.xlsx"}
            )
        else:
            output = io.StringIO()
            df.to_csv(output, index=False)
            
            return Response(
                content=output.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=payments_{datetime.now().strftime('%Y%m%d')}.csv"}
            )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/attendance")
async def export_attendance(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    format: str = "csv",
    current_user: dict = Depends(get_current_user)
):
    """Export attendance data to CSV/Excel"""
    try:
        if current_user["role"] not in ["admin", "trainer"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        supabase = get_supabase_client()
        query = supabase.table("attendance").select("*")
        
        if start_date:
            query = query.gte("check_in_time", start_date.isoformat())
        if end_date:
            query = query.lte("check_in_time", end_date.isoformat())
        
        response = query.order("check_in_time", desc=True).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="No data to export")
        
        df = pd.DataFrame(response.data)
        
        if format.lower() == "excel":
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Attendance')
            output.seek(0)
            
            return Response(
                content=output.getvalue(),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename=attendance_{datetime.now().strftime('%Y%m%d')}.xlsx"}
            )
        else:
            output = io.StringIO()
            df.to_csv(output, index=False)
            
            return Response(
                content=output.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=attendance_{datetime.now().strftime('%Y%m%d')}.csv"}
            )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/classes")
async def export_classes(
    format: str = "csv",
    current_user: dict = Depends(get_current_user)
):
    """Export classes schedule to CSV/Excel"""
    try:
        if current_user["role"] not in ["admin", "trainer"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        supabase = get_supabase_client()
        response = supabase.table("classes").select("*").order("schedule_day").order("schedule_time").execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="No data to export")
        
        df = pd.DataFrame(response.data)
        
        if format.lower() == "excel":
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Classes')
            output.seek(0)
            
            return Response(
                content=output.getvalue(),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename=classes_{datetime.now().strftime('%Y%m%d')}.xlsx"}
            )
        else:
            output = io.StringIO()
            df.to_csv(output, index=False)
            
            return Response(
                content=output.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=classes_{datetime.now().strftime('%Y%m%d')}.csv"}
            )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/equipment")
async def export_equipment(
    format: str = "csv",
    current_user: dict = Depends(get_current_user)
):
    """Export equipment inventory to CSV/Excel"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Only admins can export equipment")
        
        supabase = get_supabase_client()
        response = supabase.table("equipment").select("*").order("name").execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="No data to export")
        
        df = pd.DataFrame(response.data)
        
        if format.lower() == "excel":
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Equipment')
            output.seek(0)
            
            return Response(
                content=output.getvalue(),
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename=equipment_{datetime.now().strftime('%Y%m%d')}.xlsx"}
            )
        else:
            output = io.StringIO()
            df.to_csv(output, index=False)
            
            return Response(
                content=output.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=equipment_{datetime.now().strftime('%Y%m%d')}.csv"}
            )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
