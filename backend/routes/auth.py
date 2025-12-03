"""
Authentication routes using Supabase Auth
"""
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
import logging
from models import UserSignup, UserLogin, TokenResponse, UserResponse
from supabase_client import get_supabase, check_supabase_configured

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


def verify_supabase_configured():
    """Dependency to check if Supabase is configured"""
    if not check_supabase_configured():
        raise HTTPException(
            status_code=503,
            detail="Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in the backend .env file."
        )


@router.post("/signup", response_model=TokenResponse)
async def signup(user_data: UserSignup, _: None = Depends(verify_supabase_configured)):
    """Register a new user"""
    supabase = get_supabase()
    
    try:
        # Sign up user with Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": user_data.email,
            "password": user_data.password,
            "options": {
                "data": {
                    "full_name": user_data.full_name,
                    "phone": user_data.phone,
                    "role": user_data.role.value
                }
            }
        })
        
        if not auth_response.user:
            raise HTTPException(status_code=400, detail="Failed to create user")
        
        # Create user profile in database
        user_profile = {
            "id": auth_response.user.id,
            "email": user_data.email,
            "full_name": user_data.full_name,
            "phone": user_data.phone,
            "role": user_data.role.value,
            "created_at": auth_response.user.created_at
        }
        
        supabase.table("users").insert(user_profile).execute()
        
        return TokenResponse(
            access_token=auth_response.session.access_token,
            user=UserResponse(**user_profile)
        )
        
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, _: None = Depends(verify_supabase_configured)):
    """Login user"""
    supabase = get_supabase()
    
    try:
        # Sign in with Supabase Auth
        auth_response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        
        if not auth_response.user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Get user profile from database
        user_response = supabase.table("users").select("*").eq("id", auth_response.user.id).execute()
        
        if not user_response.data:
            # Create profile if it doesn't exist
            user_profile = {
                "id": auth_response.user.id,
                "email": auth_response.user.email,
                "full_name": auth_response.user.user_metadata.get("full_name", ""),
                "phone": auth_response.user.user_metadata.get("phone"),
                "role": auth_response.user.user_metadata.get("role", "member"),
                "created_at": auth_response.user.created_at
            }
            supabase.table("users").insert(user_profile).execute()
        else:
            user_profile = user_response.data[0]
        
        return TokenResponse(
            access_token=auth_response.session.access_token,
            user=UserResponse(**user_profile)
        )
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid email or password")


@router.post("/logout")
async def logout(authorization: Optional[str] = Header(None), _: None = Depends(verify_supabase_configured)):
    """Logout user"""
    supabase = get_supabase()
    
    try:
        if authorization and authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
            supabase.auth.sign_out()
        
        return {"message": "Logged out successfully"}
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me", response_model=UserResponse)
async def get_current_user(authorization: str = Header(...), _: None = Depends(verify_supabase_configured)):
    """Get current user profile"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    supabase = get_supabase()
    
    try:
        # Get user from token
        user_response = supabase.auth.get_user(token)
        
        if not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Get user profile
        profile_response = supabase.table("users").select("*").eq("id", user_response.user.id).execute()
        
        if not profile_response.data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        return UserResponse(**profile_response.data[0])
        
    except Exception as e:
        logger.error(f"Get user error: {str(e)}")
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.get("/check-config")
async def check_configuration():
    """Check if Supabase is properly configured"""
    is_configured = check_supabase_configured()
    
    return {
        "configured": is_configured,
        "message": "Supabase is configured and ready" if is_configured else "Supabase credentials need to be set in backend .env file"
    }
