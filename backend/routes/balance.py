"""
Balance and payment tracking routes
"""
from fastapi import APIRouter, HTTPException
from typing import List
import logging
from models import BalanceSummary, PaymentCreate, PaymentResponse
from supabase_client import get_supabase_service
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/balance", tags=["Balance"])


@router.get("/members-with-balance", response_model=List[BalanceSummary])
async def get_members_with_balance():
    """Get all members who have outstanding balance"""
    supabase = get_supabase_service()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase service not configured")
    
    try:
        # Get members with balance > 0
        response = supabase.table("members").select(
            "id, full_name, email, phone, plan_id, plans(name), "
            "total_amount_due, amount_paid, balance_due, status, end_date"
        ).gt("balance_due", 0).order("balance_due", desc=True).execute()
        
        balances = []
        for member in response.data:
            balance_data = {
                "member_id": member["id"],  # Use id as member_id
                "member_name": member["full_name"],
                "email": member["email"],
                "phone": member["phone"],
                "plan_name": member.get("plans", {}).get("name") if member.get("plans") else None,
                "total_amount_due": float(member.get("total_amount_due", 0)),
                "amount_paid": float(member.get("amount_paid", 0)),
                "balance_due": float(member.get("balance_due", 0)),
                "status": member["status"],
                "end_date": member["end_date"]
            }
            balances.append(BalanceSummary(**balance_data))
        
        return balances
        
    except Exception as e:
        logger.error(f"Get members with balance error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/member/{member_id}", response_model=BalanceSummary)
async def get_member_balance(member_id: str):
    """Get balance details for a specific member"""
    supabase = get_supabase_service()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase service not configured")
    
    try:
        response = supabase.table("members").select(
            "id, full_name, email, phone, plan_id, plans(name), "
            "total_amount_due, amount_paid, balance_due, status, end_date"
        ).eq("id", member_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Member not found")
        
        member = response.data[0]
        balance_data = {
            "member_id": member["id"],  # Use id as member_id
            "member_name": member["full_name"],
            "email": member["email"],
            "phone": member["phone"],
            "plan_name": member.get("plans", {}).get("name") if member.get("plans") else None,
            "total_amount_due": float(member.get("total_amount_due", 0)),
            "amount_paid": float(member.get("amount_paid", 0)),
            "balance_due": float(member.get("balance_due", 0)),
            "status": member["status"],
            "end_date": member["end_date"]
        }
        
        return BalanceSummary(**balance_data)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get member balance error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/record-partial-payment", response_model=PaymentResponse)
async def record_partial_payment(payment: PaymentCreate):
    """Record a partial payment and update member balance"""
    supabase = get_supabase_service()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase service not configured")
    
    try:
        # Get member info
        member_response = supabase.table("members").select(
            "id, full_name, total_amount_due, amount_paid, balance_due"
        ).eq("id", payment.member_id).execute()
        
        if not member_response.data:
            raise HTTPException(status_code=404, detail="Member not found")
        
        member = member_response.data[0]
        member_name = member["full_name"]
        current_balance = float(member.get("balance_due", 0))
        
        # Calculate new balance
        new_balance = current_balance - payment.amount
        is_partial = new_balance > 0
        
        # Get plan info if provided
        plan_name = None
        if payment.plan_id:
            plan_response = supabase.table("plans").select("name").eq("id", payment.plan_id).execute()
            if plan_response.data:
                plan_name = plan_response.data[0]["name"]
        
        # Create payment record
        payment_data = {
            "member_id": payment.member_id,
            "amount": payment.amount,
            "payment_method": payment.payment_method.value,
            "payment_date": payment.payment_date.isoformat(),
            "plan_id": payment.plan_id,
            "description": payment.description or f"Partial payment - Balance: ${new_balance:.2f}",
            "status": payment.status.value,
            "payment_type": payment.payment_type.value if payment.payment_type else "partial",
            "is_partial": is_partial,
            "remaining_balance": max(0, new_balance),
            "created_at": datetime.utcnow().isoformat()
        }
        
        payment_response = supabase.table("payments").insert(payment_data).execute()
        
        # Update member balance
        new_amount_paid = float(member.get("amount_paid", 0)) + payment.amount
        supabase.table("members").update({
            "amount_paid": new_amount_paid,
            "balance_due": max(0, new_balance)
        }).eq("id", payment.member_id).execute()
        
        result = payment_response.data[0]
        result["member_name"] = member_name
        result["plan_name"] = plan_name
        
        return PaymentResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Record partial payment error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/summary")
async def get_balance_summary():
    """Get overall balance summary for admin dashboard"""
    supabase = get_supabase_service()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase service not configured")
    
    try:
        # Get all members
        response = supabase.table("members").select(
            "total_amount_due, amount_paid, balance_due, status"
        ).execute()
        
        total_due = 0
        total_paid = 0
        total_balance = 0
        members_with_balance = 0
        
        for member in response.data:
            total_due += float(member.get("total_amount_due", 0))
            total_paid += float(member.get("amount_paid", 0))
            balance = float(member.get("balance_due", 0))
            total_balance += balance
            if balance > 0:
                members_with_balance += 1
        
        return {
            "total_amount_due": total_due,
            "total_amount_paid": total_paid,
            "total_balance_due": total_balance,
            "members_with_balance": members_with_balance,
            "collection_rate": (total_paid / total_due * 100) if total_due > 0 else 0
        }
        
    except Exception as e:
        logger.error(f"Get balance summary error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
