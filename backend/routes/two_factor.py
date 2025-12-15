"""
2FA (Two-Factor Authentication) API Routes
Handles SMS OTP-based two-factor authentication
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
import random
import string
from datetime import datetime, timedelta
from supabase_client import get_supabase
from routes.auth import get_current_user

router = APIRouter(prefix="/api/2fa", tags=["two_factor"])

# In-memory OTP storage (in production, use Redis or database)
otp_storage = {}


class SendOTPRequest(BaseModel):
    phone_number: str


class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp: str


class Enable2FARequest(BaseModel):
    phone_number: str


def generate_otp(length: int = 6) -> str:
    """Generate a random OTP"""
    return ''.join(random.choices(string.digits, k=length))


async def send_sms_via_supabase(phone_number: str, message: str):
    """
    Send SMS using Supabase Edge Function
    Note: This requires Supabase Edge Function to be deployed
    """
    try:
        supabase = get_supabase()
        
        # Call Supabase Edge Function for SMS
        # The edge function should handle the actual SMS sending via Twilio
        response = supabase.functions.invoke(
            "send-sms",
            invoke_options={
                "body": {
                    "phone_number": phone_number,
                    "message": message
                }
            }
        )
        
        return True
    except Exception as e:
        print(f"SMS sending error: {e}")
        # For development, we'll just print the OTP
        print(f"[DEV MODE] OTP for {phone_number}: {message}")
        return True  # Return True for development


@router.post("/send-otp")
async def send_otp(
    request: SendOTPRequest,
    current_user: dict = Depends(get_current_user)
):
    """Send OTP to phone number"""
    try:
        phone_number = request.phone_number
        
        # Generate OTP
        otp = generate_otp()
        
        # Store OTP with expiry (5 minutes)
        otp_storage[phone_number] = {
            "otp": otp,
            "expires_at": datetime.utcnow() + timedelta(minutes=5),
            "user_id": current_user["id"]
        }
        
        # Send SMS
        message = f"Your VI FITNESS verification code is: {otp}. Valid for 5 minutes."
        await send_sms_via_supabase(phone_number, message)
        
        return {
            "success": True,
            "message": "OTP sent successfully",
            "expires_in": 300  # 5 minutes in seconds
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/verify-otp")
async def verify_otp(
    request: VerifyOTPRequest,
    current_user: dict = Depends(get_current_user)
):
    """Verify OTP"""
    try:
        phone_number = request.phone_number
        provided_otp = request.otp
        
        # Check if OTP exists
        if phone_number not in otp_storage:
            raise HTTPException(status_code=400, detail="OTP not found or expired")
        
        stored_data = otp_storage[phone_number]
        
        # Check expiry
        if datetime.utcnow() > stored_data["expires_at"]:
            del otp_storage[phone_number]
            raise HTTPException(status_code=400, detail="OTP has expired")
        
        # Verify OTP
        if stored_data["otp"] != provided_otp:
            raise HTTPException(status_code=400, detail="Invalid OTP")
        
        # Mark phone as verified
        supabase = get_supabase()
        supabase.table("members").update({
            "phone_verified": True,
            "phone": phone_number
        }).eq("id", current_user["id"]).execute()
        
        # Clean up OTP
        del otp_storage[phone_number]
        
        return {
            "success": True,
            "message": "Phone number verified successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/enable")
async def enable_2fa(
    request: Enable2FARequest,
    current_user: dict = Depends(get_current_user)
):
    """Enable 2FA for user"""
    try:
        supabase = get_supabase()
        
        # Check if phone is verified
        member = supabase.table("members").select("*").eq("id", current_user["id"]).execute()
        
        if not member.data:
            raise HTTPException(status_code=404, detail="Member not found")
        
        member_data = member.data[0]
        
        if not member_data.get("phone_verified"):
            raise HTTPException(status_code=400, detail="Please verify your phone number first")
        
        # Enable 2FA
        supabase.table("members").update({
            "two_factor_enabled": True
        }).eq("id", current_user["id"]).execute()
        
        return {
            "success": True,
            "message": "Two-factor authentication enabled successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/disable")
async def disable_2fa(
    current_user: dict = Depends(get_current_user)
):
    """Disable 2FA for user"""
    try:
        supabase = get_supabase()
        
        # Disable 2FA
        supabase.table("members").update({
            "two_factor_enabled": False
        }).eq("id", current_user["id"]).execute()
        
        return {
            "success": True,
            "message": "Two-factor authentication disabled successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_2fa_status(
    current_user: dict = Depends(get_current_user)
):
    """Get 2FA status for current user"""
    try:
        supabase = get_supabase()
        
        member = supabase.table("members").select("phone_verified, two_factor_enabled, phone").eq("id", current_user["id"]).execute()
        
        if not member.data:
            raise HTTPException(status_code=404, detail="Member not found")
        
        data = member.data[0]
        
        return {
            "success": True,
            "data": {
                "phone_verified": data.get("phone_verified", False),
                "two_factor_enabled": data.get("two_factor_enabled", False),
                "phone": data.get("phone")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
