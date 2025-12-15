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
        # Get all members with their plans
        members_response = supabase.table("members").select(
            "id, full_name, email, phone, plan_id, plans(name, price), status, end_date"
        ).execute()
        
        # Get all payments
        payments_response = supabase.table("payments").select("member_id, amount, status").execute()
        
        # Calculate balances for each member
        balances = []
        for member in members_response.data:
            plan = member.get("plans")
            plan_price = float(plan.get("price", 0)) if plan else 0
            
            # Calculate total paid by this member
            member_payments = [p for p in payments_response.data if p["member_id"] == member["id"]]
            total_paid = sum(float(p["amount"]) for p in member_payments if p.get("status") in ["completed", "paid"])
            
            # Calculate balance
            total_due = plan_price
            balance_due = max(0, total_due - total_paid)
            
            # Only include members with outstanding balance
            if balance_due > 0:
                balance_data = {
                    "member_id": member["id"],
                    "member_name": member["full_name"],
                    "email": member["email"],
                    "phone": member["phone"],
                    "plan_name": plan.get("name") if plan else None,
                    "total_amount_due": total_due,
                    "amount_paid": total_paid,
                    "balance_due": balance_due,
                    "status": member["status"],
                    "end_date": member["end_date"]
                }
                balances.append(BalanceSummary(**balance_data))
        
        # Sort by balance due (highest first)
        balances.sort(key=lambda x: x.balance_due, reverse=True)
        
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
        # Get member with plan
        response = supabase.table("members").select(
            "id, full_name, email, phone, plan_id, plans(name, price), status, end_date"
        ).eq("id", member_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Member not found")
        
        member = response.data[0]
        plan = member.get("plans")
        plan_price = float(plan.get("price", 0)) if plan else 0
        
        # Get member's payments
        payments_response = supabase.table("payments").select("amount, status").eq("member_id", member_id).execute()
        
        # Calculate total paid
        total_paid = sum(float(p["amount"]) for p in payments_response.data if p.get("status") in ["completed", "paid"])
        
        # Calculate balance
        total_due = plan_price
        balance_due = max(0, total_due - total_paid)
        
        balance_data = {
            "member_id": member["id"],
            "member_name": member["full_name"],
            "email": member["email"],
            "phone": member["phone"],
            "plan_name": plan.get("name") if plan else None,
            "total_amount_due": total_due,
            "amount_paid": total_paid,
            "balance_due": balance_due,
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
        # Get member info with plan
        member_response = supabase.table("members").select(
            "id, full_name, plan_id, plans(name, price)"
        ).eq("id", payment.member_id).execute()
        
        if not member_response.data:
            raise HTTPException(status_code=404, detail="Member not found")
        
        member = member_response.data[0]
        member_name = member["full_name"]
        
        # Get current payments to calculate balance
        payments_response = supabase.table("payments").select("amount, status").eq("member_id", payment.member_id).execute()
        total_paid = sum(float(p["amount"]) for p in payments_response.data if p.get("status") in ["completed", "paid"])
        
        plan = member.get("plans")
        plan_price = float(plan.get("price", 0)) if plan else 0
        current_balance = max(0, plan_price - total_paid)
        
        # Calculate new balance after this payment
        new_balance = current_balance - payment.amount
        is_partial = new_balance > 0
        
        # Get plan info if provided
        plan_name = None
        if payment.plan_id:
            plan_response = supabase.table("plans").select("name").eq("id", payment.plan_id).execute()
            if plan_response.data:
                plan_name = plan_response.data[0]["name"]
        
        # Create payment record (only use fields that exist in the database)
        payment_data = {
            "member_id": payment.member_id,
            "amount": payment.amount,
            "payment_method": payment.payment_method.value,
            "payment_date": payment.payment_date.isoformat(),
            "plan_id": payment.plan_id,
            "description": payment.description or f"Partial payment - Balance: ${new_balance:.2f}",
            "status": payment.status.value,
            "created_at": datetime.utcnow().isoformat()
        }
        
        payment_response = supabase.table("payments").insert(payment_data).execute()
        
        # Note: Balance is calculated on-the-fly from payments, no need to update member table
        
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
        # Get all members with plans
        members_response = supabase.table("members").select(
            "id, plan_id, plans(price), status"
        ).execute()
        
        # Get all payments
        payments_response = supabase.table("payments").select("member_id, amount, status").execute()
        
        total_due = 0
        total_paid = 0
        total_balance = 0
        members_with_balance = 0
        
        for member in members_response.data:
            plan = member.get("plans")
            plan_price = float(plan.get("price", 0)) if plan else 0
            
            # Calculate total paid by this member
            member_payments = [p for p in payments_response.data if p["member_id"] == member["id"]]
            member_paid = sum(float(p["amount"]) for p in member_payments if p.get("status") in ["completed", "paid"])
            
            # Calculate balance
            member_balance = max(0, plan_price - member_paid)
            
            total_due += plan_price
            total_paid += member_paid
            total_balance += member_balance
            
            if member_balance > 0:
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
