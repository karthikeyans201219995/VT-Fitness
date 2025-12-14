"""
API routes for installment plans and payments
"""
from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime, date, timedelta
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models_phase1 import (
    InstallmentPlan,
    InstallmentPlanCreate,
    InstallmentPlanUpdate,
    InstallmentPayment,
    InstallmentPaymentCreate,
    InstallmentPaymentUpdate,
    InstallmentFrequency,
    InstallmentStatus,
    PaymentStatus
)
from supabase_client import get_supabase

router = APIRouter(prefix="/installments", tags=["installments"])


@router.post("/plans", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_installment_plan(plan: InstallmentPlanCreate):
    """Create a new installment plan for a member"""
    try:
        supabase = get_supabase()
        
        # Calculate next due date based on start date
        next_due_date = plan.start_date
        
        # Create installment plan
        plan_data = {
            "member_id": plan.member_id,
            "plan_id": plan.plan_id,
            "total_amount": plan.total_amount,
            "installment_amount": plan.installment_amount,
            "installment_count": plan.installment_count,
            "frequency": plan.frequency.value,
            "start_date": plan.start_date.isoformat(),
            "next_due_date": next_due_date.isoformat(),
            "auto_debit": plan.auto_debit,
            "status": "active"
        }
        
        result = supabase.table("installment_plans").insert(plan_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to create installment plan")
        
        created_plan = result.data[0]
        
        # Auto-generate installment payment entries
        installment_payments = []
        current_date = plan.start_date
        
        for i in range(1, plan.installment_count + 1):
            installment_payments.append({
                "installment_plan_id": created_plan["id"],
                "installment_number": i,
                "amount": plan.installment_amount,
                "due_date": current_date.isoformat(),
                "status": "pending"
            })
            
            # Calculate next due date
            if plan.frequency == InstallmentFrequency.WEEKLY:
                current_date += timedelta(weeks=1)
            elif plan.frequency == InstallmentFrequency.MONTHLY:
                # Add 30 days for simplicity
                current_date += timedelta(days=30)
            elif plan.frequency == InstallmentFrequency.QUARTERLY:
                current_date += timedelta(days=90)
        
        # Insert all installment payments
        supabase.table("installment_payments").insert(installment_payments).execute()
        
        return {
            "message": "Installment plan created successfully",
            "data": created_plan
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating installment plan: {str(e)}")


@router.get("/plans", response_model=dict)
async def get_installment_plans(
    member_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Get all installment plans with optional filters"""
    try:
        supabase = get_supabase()
        
        query = supabase.table("installment_plans").select("*")
        
        if member_id:
            query = query.eq("member_id", member_id)
        
        if status:
            query = query.eq("status", status)
        
        result = query.order("created_at", desc=True).range(skip, skip + limit - 1).execute()
        
        return {
            "data": result.data,
            "count": len(result.data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching installment plans: {str(e)}")


@router.get("/plans/{plan_id}", response_model=dict)
async def get_installment_plan(plan_id: str):
    """Get a specific installment plan by ID"""
    try:
        supabase = get_supabase()
        
        result = supabase.table("installment_plans").select("*").eq("id", plan_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Installment plan not found")
        
        plan = result.data[0]
        
        # Get associated payments
        payments_result = supabase.table("installment_payments").select("*").eq("installment_plan_id", plan_id).order("installment_number").execute()
        
        plan["payments"] = payments_result.data
        
        return {"data": plan}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching installment plan: {str(e)}")


@router.patch("/plans/{plan_id}", response_model=dict)
async def update_installment_plan(plan_id: str, update: InstallmentPlanUpdate):
    """Update an installment plan"""
    try:
        supabase = get_supabase()
        
        update_data = update.model_dump(exclude_unset=True)
        
        # Convert enums to strings
        if 'frequency' in update_data:
            update_data['frequency'] = update_data['frequency'].value
        if 'status' in update_data:
            update_data['status'] = update_data['status'].value
        if 'next_due_date' in update_data:
            update_data['next_due_date'] = update_data['next_due_date'].isoformat()
        
        update_data['updated_at'] = datetime.utcnow().isoformat()
        
        result = supabase.table("installment_plans").update(update_data).eq("id", plan_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Installment plan not found")
        
        return {
            "message": "Installment plan updated successfully",
            "data": result.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating installment plan: {str(e)}")


@router.delete("/plans/{plan_id}", response_model=dict)
async def cancel_installment_plan(plan_id: str):
    """Cancel an installment plan (soft delete)"""
    try:
        supabase = get_supabase()
        
        result = supabase.table("installment_plans").update({
            "status": "cancelled",
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", plan_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Installment plan not found")
        
        return {"message": "Installment plan cancelled successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error cancelling installment plan: {str(e)}")


# =======================================
# INSTALLMENT PAYMENTS
# =======================================

@router.get("/payments", response_model=dict)
async def get_installment_payments(
    plan_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Get installment payments with optional filters"""
    try:
        supabase = get_supabase()
        
        query = supabase.table("installment_payments").select("*")
        
        if plan_id:
            query = query.eq("installment_plan_id", plan_id)
        
        if status:
            query = query.eq("status", status)
        
        result = query.order("due_date").range(skip, skip + limit - 1).execute()
        
        return {
            "data": result.data,
            "count": len(result.data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching installment payments: {str(e)}")


@router.get("/payments/due", response_model=dict)
async def get_due_payments(days: int = 7):
    """Get payments due in the next N days"""
    try:
        supabase = get_supabase()
        
        today = date.today()
        future_date = today + timedelta(days=days)
        
        result = supabase.table("installment_payments").select("*, installment_plans!inner(member_id)").eq("status", "pending").gte("due_date", today.isoformat()).lte("due_date", future_date.isoformat()).execute()
        
        return {
            "data": result.data,
            "count": len(result.data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching due payments: {str(e)}")


@router.get("/payments/overdue", response_model=dict)
async def get_overdue_payments():
    """Get overdue payments"""
    try:
        supabase = get_supabase()
        
        today = date.today()
        
        result = supabase.table("installment_payments").select("*, installment_plans!inner(member_id)").eq("status", "pending").lt("due_date", today.isoformat()).execute()
        
        # Update status to overdue
        if result.data:
            overdue_ids = [payment["id"] for payment in result.data]
            supabase.table("installment_payments").update({"status": "overdue"}).in_("id", overdue_ids).execute()
        
        return {
            "data": result.data,
            "count": len(result.data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching overdue payments: {str(e)}")


@router.post("/payments/{payment_id}/pay", response_model=dict)
async def mark_payment_paid(payment_id: str, payment_update: InstallmentPaymentUpdate):
    """Mark an installment payment as paid"""
    try:
        supabase = get_supabase()
        
        # Get the payment
        payment_result = supabase.table("installment_payments").select("*").eq("id", payment_id).execute()
        
        if not payment_result.data:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Update payment status
        update_data = {
            "status": "paid",
            "paid_date": datetime.utcnow().isoformat(),
            "payment_method": payment_update.payment_method,
            "transaction_id": payment_update.transaction_id,
            "notes": payment_update.notes
        }
        
        result = supabase.table("installment_payments").update(update_data).eq("id", payment_id).execute()
        
        return {
            "message": "Payment marked as paid successfully",
            "data": result.data[0]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating payment: {str(e)}")


@router.get("/revenue-forecast", response_model=dict)
async def get_revenue_forecast(days: int = 30):
    """Get revenue forecast based on installment schedules"""
    try:
        supabase = get_supabase()
        
        today = date.today()
        future_date = today + timedelta(days=days)
        
        # Get all scheduled payments in the period
        result = supabase.table("installment_payments").select("amount, status, due_date").gte("due_date", today.isoformat()).lte("due_date", future_date.isoformat()).execute()
        
        confirmed_revenue = 0
        potential_revenue = 0
        
        for payment in result.data:
            if payment["status"] == "paid":
                confirmed_revenue += payment["amount"]
            else:
                potential_revenue += payment["amount"]
        
        return {
            "period": f"next_{days}_days",
            "start_date": today.isoformat(),
            "end_date": future_date.isoformat(),
            "confirmed_revenue": confirmed_revenue,
            "potential_revenue": potential_revenue,
            "total_predicted": confirmed_revenue + potential_revenue,
            "payment_count": len(result.data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error calculating revenue forecast: {str(e)}")


@router.get("/analytics", response_model=dict)
async def get_installment_analytics():
    """Get analytics for installment plans"""
    try:
        supabase = get_supabase()
        
        # Active plans
        active_plans = supabase.table("installment_plans").select("*", count="exact").eq("status", "active").execute()
        
        # Completed plans
        completed_plans = supabase.table("installment_plans").select("*", count="exact").eq("status", "completed").execute()
        
        # Total revenue from installments
        all_payments = supabase.table("installment_payments").select("amount, status").execute()
        
        total_collected = sum(p["amount"] for p in all_payments.data if p["status"] == "paid")
        total_pending = sum(p["amount"] for p in all_payments.data if p["status"] in ["pending", "overdue"])
        
        # Overdue payments
        today = date.today()
        overdue_payments = supabase.table("installment_payments").select("*", count="exact").eq("status", "overdue").execute()
        
        return {
            "active_plans": active_plans.count,
            "completed_plans": completed_plans.count,
            "total_revenue_collected": total_collected,
            "total_pending": total_pending,
            "overdue_count": overdue_payments.count,
            "collection_rate": (total_collected / (total_collected + total_pending) * 100) if (total_collected + total_pending) > 0 else 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching analytics: {str(e)}")
