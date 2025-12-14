"""
Payments management routes
"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
import logging
import os
from models import PaymentCreate, PaymentUpdate, PaymentResponse, MemberWithPaymentCreate
from supabase_client import get_supabase, get_supabase_service
from datetime import datetime
from email_service import send_welcome_email, send_payment_receipt
from password_manager import encrypt_password, decrypt_password

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/with-member", response_model=PaymentResponse)
async def create_member_with_payment(data: MemberWithPaymentCreate):
    """Create a new member with payment in single transaction"""
    supabase = get_supabase_service()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase service not configured")
    
    try:
        # Check if email already exists
        existing = supabase.table("members").select("id").eq("email", data.email).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Member with this email already exists")
        
        # Get plan details if plan_id provided
        plan_name = None
        plan_price = 0
        if data.plan_id:
            plan_response = supabase.table("plans").select("name, price").eq("id", data.plan_id).execute()
            if plan_response.data:
                plan_name = plan_response.data[0]["name"]
                plan_price = float(plan_response.data[0]["price"])
        
        # Create user account for member
        user_id = None
        generated_password = None
        try:
            import secrets
            import string
            password = data.password
            if not password:
                alphabet = string.ascii_letters + string.digits + "!@#$%"
                password = ''.join(secrets.choice(alphabet) for i in range(12))
                generated_password = password  # Store for email
            else:
                generated_password = password  # Use provided password for email
            
            auth_response = supabase.auth.admin.create_user({
                "email": data.email,
                "password": password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": data.full_name,
                    "phone": data.phone,
                    "role": "member"
                }
            })
            user_id = auth_response.user.id
            
            # Create entry in users table
            user_data = {
                "id": user_id,
                "email": data.email,
                "full_name": data.full_name,
                "phone": data.phone,
                "role": "member"
            }
            supabase.table("users").insert(user_data).execute()
        except Exception as auth_error:
            logger.warning(f"Failed to create auth user: {str(auth_error)}")
            user_id = None
        
        # Calculate balance tracking
        total_amount_due = plan_price if plan_price > 0 else data.amount
        amount_paid = data.amount
        balance_due = total_amount_due - amount_paid
        
        # Determine membership status based on payment
        membership_status = data.status.value
        if balance_due > 0:
            # If there's a balance, set status to inactive until fully paid
            membership_status = "inactive"
        elif balance_due <= 0:
            # Fully paid, set to active
            membership_status = "active"
        
        # Create member with balance tracking
        member_data = {
            "user_id": user_id,
            "full_name": data.full_name,
            "email": data.email,
            "phone": data.phone,
            "date_of_birth": data.date_of_birth.isoformat() if data.date_of_birth else None,
            "gender": data.gender,
            "address": data.address,
            "emergency_contact": data.emergency_contact,
            "emergency_phone": data.emergency_phone,
            "blood_group": data.blood_group,
            "medical_conditions": data.medical_conditions,
            "plan_id": data.plan_id,
            "start_date": data.start_date.isoformat(),
            "end_date": data.end_date.isoformat(),
            "status": membership_status,
            "total_amount_due": total_amount_due,
            "amount_paid": amount_paid,
            "balance_due": balance_due,
            "created_at": datetime.utcnow().isoformat()
        }
        
        member_response = supabase.table("members").insert(member_data).execute()
        
        if not member_response.data or len(member_response.data) == 0:
            raise HTTPException(status_code=500, detail="Failed to create member")
        
        member_id = member_response.data[0]["id"]
        
        # Store encrypted password for admin retrieval
        if generated_password:
            try:
                encrypted_pwd = encrypt_password(generated_password)
                if encrypted_pwd:
                    password_data = {
                        "member_id": member_id,
                        "email": data.email,
                        "encrypted_password": encrypted_pwd,
                        "created_at": datetime.utcnow().isoformat()
                    }
                    supabase.table("member_passwords").insert(password_data).execute()
                    logger.info(f"Encrypted password stored for member {member_id}")
            except Exception as pwd_error:
                logger.warning(f"Failed to store encrypted password: {str(pwd_error)}")
                # Don't fail the whole operation if password storage fails
        
        # Create payment record with balance tracking
        try:
            is_partial = balance_due > 0
            payment_type = "partial" if is_partial else "initial"
            
            payment_data = {
                "member_id": member_id,
                "amount": data.amount,
                "payment_method": data.payment_method.value,
                "payment_date": data.payment_date.isoformat(),
                "plan_id": data.plan_id,
                "description": data.notes or f"Initial payment for {data.full_name}",
                "status": data.payment_status.value,
                "payment_type": payment_type,
                "is_partial": is_partial,
                "remaining_balance": balance_due,
                "created_at": datetime.utcnow().isoformat()
            }
            payment_response = supabase.table("payments").insert(payment_data).execute()
            
            result = payment_response.data[0]
            result["member_name"] = data.full_name
            result["plan_name"] = plan_name
            
            # Send welcome email with login credentials and membership link
            if generated_password:
                try:
                    # Get the member portal URL from environment or use default
                    member_portal_url = os.environ.get('MEMBER_PORTAL_URL', 'http://localhost:3000/login')
                    
                    email_sent = send_welcome_email(
                        to_email=data.email,
                        member_name=data.full_name,
                        password=generated_password,
                        plan_name=plan_name,
                        start_date=data.start_date.strftime('%B %d, %Y'),
                        end_date=data.end_date.strftime('%B %d, %Y'),
                        amount=data.amount,
                        balance_due=balance_due,
                        member_portal_url=member_portal_url
                    )
                    if email_sent:
                        logger.info(f"Welcome email sent to {data.email}")
                    else:
                        logger.warning(f"Failed to send welcome email to {data.email}")
                except Exception as email_error:
                    logger.error(f"Error sending welcome email: {str(email_error)}")
                    # Don't fail the whole operation if email fails
            
            logger.info(f"Member and payment created successfully for {data.full_name}")
            return PaymentResponse(**result)
            
        except Exception as payment_error:
            # If payment creation fails, delete the member and raise error
            logger.error(f"Failed to create payment record: {str(payment_error)}")
            supabase.table("members").delete().eq("id", member_id).execute()
            if user_id:
                try:
                    supabase.auth.admin.delete_user(user_id)
                    supabase.table("users").delete().eq("id", user_id).execute()
                except:
                    pass
            raise HTTPException(
                status_code=400,
                detail=f"Failed to create payment record. Member creation rolled back: {str(payment_error)}"
            )
        
    except HTTPException as http_exc:
        logger.error(f"HTTP Exception in create member with payment: {http_exc.detail}")
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        logger.error(f"Create member with payment error: {str(e)}\n{error_details}")
        raise HTTPException(status_code=500, detail=f"Failed to create member with payment: {str(e)}")


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
    supabase = get_supabase_service()
    
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
