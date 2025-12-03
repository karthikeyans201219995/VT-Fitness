"""
Payments management routes
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
import logging
from models import PaymentCreate, PaymentUpdate, PaymentResponse
from supabase_client import get_supabase
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("", response_model=PaymentResponse)
async def create_payment(payment: PaymentCreate):
    """Create a new payment"""
    supabase = get_supabase()
    
    try:
        # Get member info
        member_response = supabase.table("members").select("full_name").eq("id", payment.member_id).execute()
        if not member_response.data:
            raise HTTPException(status_code=404, detail="Member not found")
        
        member_name = member_response.data[0]["full_name"]
        
        # Get plan info if provided
        plan_name = None
        if payment.plan_id:
            plan_response = supabase.table("plans").select("name").eq("id", payment.plan_id).execute()
            if plan_response.data:
                plan_name = plan_response.data[0]["name"]
        
        # Create payment
        payment_data = payment.model_dump()
        payment_data["payment_date"] = payment.payment_date.isoformat()
        payment_data["created_at"] = datetime.utcnow().isoformat()
        
        response = supabase.table("payments").insert(payment_data).execute()
        
        result = response.data[0]
        result["member_name"] = member_name
        result["plan_name"] = plan_name
        
        return PaymentResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create payment error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[PaymentResponse])
async def get_payments(member_id: Optional[str] = None, status: Optional[str] = None):
    """Get all payments"""
    supabase = get_supabase()
    
    try:
        query = supabase.table("payments").select("*, members(full_name), plans(name)")
        
        if member_id:
            query = query.eq("member_id", member_id)
        
        if status:
            query = query.eq("status", status)
        
        response = query.order("payment_date", desc=True).execute()
        
        # Format response
        payments = []
        for payment in response.data:
            payment_dict = {**payment}
            payment_dict["member_name"] = payment.get("members", {}).get("full_name", "") if payment.get("members") else ""
            payment_dict["plan_name"] = payment.get("plans", {}).get("name") if payment.get("plans") else None
            if "members" in payment_dict:
                del payment_dict["members"]
            if "plans" in payment_dict:
                del payment_dict["plans"]
            payments.append(PaymentResponse(**payment_dict))
        
        return payments
        
    except Exception as e:
        logger.error(f"Get payments error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(payment_id: str):
    """Get payment by ID"""
    supabase = get_supabase()
    
    try:
        response = supabase.table("payments").select("*, members(full_name), plans(name)").eq("id", payment_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        payment = response.data[0]
        payment["member_name"] = payment.get("members", {}).get("full_name", "") if payment.get("members") else ""
        payment["plan_name"] = payment.get("plans", {}).get("name") if payment.get("plans") else None
        if "members" in payment:
            del payment["members"]
        if "plans" in payment:
            del payment["plans"]
        
        return PaymentResponse(**payment)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get payment error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{payment_id}", response_model=PaymentResponse)
async def update_payment(payment_id: str, payment_update: PaymentUpdate):
    """Update payment"""
    supabase = get_supabase()
    
    try:
        # Check if payment exists
        existing = supabase.table("payments").select("*").eq("id", payment_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Update payment
        update_data = payment_update.model_dump(exclude_unset=True)
        if "payment_date" in update_data and update_data["payment_date"]:
            update_data["payment_date"] = update_data["payment_date"].isoformat()
        
        response = supabase.table("payments").update(update_data).eq("id", payment_id).execute()
        
        # Get member and plan names
        member_response = supabase.table("members").select("full_name").eq("id", response.data[0]["member_id"]).execute()
        member_name = member_response.data[0]["full_name"] if member_response.data else ""
        
        plan_name = None
        if response.data[0].get("plan_id"):
            plan_response = supabase.table("plans").select("name").eq("id", response.data[0]["plan_id"]).execute()
            if plan_response.data:
                plan_name = plan_response.data[0]["name"]
        
        result = response.data[0]
        result["member_name"] = member_name
        result["plan_name"] = plan_name
        
        return PaymentResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update payment error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{payment_id}")
async def delete_payment(payment_id: str):
    """Delete payment"""
    supabase = get_supabase()
    
    try:
        # Check if payment exists
        existing = supabase.table("payments").select("id").eq("id", payment_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        # Delete payment
        supabase.table("payments").delete().eq("id", payment_id).execute()
        
        return {"message": "Payment deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete payment error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
