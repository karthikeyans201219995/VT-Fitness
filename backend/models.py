"""
Pydantic models for the Gym Management System
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum


# Enums
class UserRole(str, Enum):
    admin = "admin"
    trainer = "trainer"
    member = "member"


class MembershipStatus(str, Enum):
    active = "active"
    inactive = "inactive"
    expired = "expired"


class PaymentStatus(str, Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"


class PaymentMethod(str, Enum):
    cash = "cash"
    card = "card"
    upi = "upi"
    bank_transfer = "bank_transfer"


class PaymentType(str, Enum):
    initial = "initial"
    renewal = "renewal"
    upgrade = "upgrade"
    partial = "partial"
    balance_clearance = "balance_clearance"


# User/Auth Models
class UserSignup(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role: UserRole = UserRole.member


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone: Optional[str] = None
    role: str
    created_at: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# Member Models
class MemberCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: Optional[str] = None
    phone: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    blood_group: Optional[str] = None
    # Payment fields (required for member creation)
    payment_amount: Optional[float] = None
    payment_method: Optional[PaymentMethod] = None
    payment_date: Optional[date] = None
    medical_conditions: Optional[str] = None
    plan_id: Optional[str] = None
    start_date: date
    end_date: date
    status: MembershipStatus = MembershipStatus.active


class MemberUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    blood_group: Optional[str] = None
    medical_conditions: Optional[str] = None
    plan_id: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[MembershipStatus] = None


class MemberResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    member_id: Optional[str] = None
    full_name: str
    email: str
    phone: str
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    blood_group: Optional[str] = None
    medical_conditions: Optional[str] = None
    plan_id: Optional[str] = None
    plan_name: Optional[str] = None
    previous_plan_id: Optional[str] = None
    plan_changed_at: Optional[str] = None
    start_date: str
    end_date: str
    status: str
    total_amount_due: Optional[float] = 0
    amount_paid: Optional[float] = 0
    balance_due: Optional[float] = 0
    qr_code: Optional[str] = None
    created_at: str


# Plan Models
class PlanCreate(BaseModel):
    name: str
    description: Optional[str] = None
    duration_months: int
    price: float
    features: Optional[List[str]] = []
    is_active: bool = True


class PlanUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_months: Optional[int] = None
    price: Optional[float] = None
    features: Optional[List[str]] = None
    is_active: Optional[bool] = None


class PlanResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    duration_months: int
    price: float
    features: Optional[List[str]] = []
    is_active: bool
    created_at: str


# Attendance Models
class AttendanceCreate(BaseModel):
    member_id: str
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    notes: Optional[str] = None


class AttendanceUpdate(BaseModel):
    check_out_time: Optional[datetime] = None
    notes: Optional[str] = None


class AttendanceResponse(BaseModel):
    id: str
    member_id: str
    member_name: str
    check_in_time: str
    check_out_time: Optional[str] = None
    notes: Optional[str] = None
    date: str
    created_at: str


# QR Code Models
class QRScanRequest(BaseModel):
    qr_code: str
    notes: Optional[str] = None


class QRScanResponse(BaseModel):
    success: bool
    action: str  # "check_in" or "check_out"
    member_name: str
    member_id: str
    timestamp: str
    message: str
    attendance_id: Optional[str] = None


# Payment Models
class PaymentCreate(BaseModel):
    member_id: str
    amount: float
    payment_method: PaymentMethod
    payment_date: date
    plan_id: Optional[str] = None
    description: Optional[str] = None
    status: PaymentStatus = PaymentStatus.completed
    payment_type: Optional[PaymentType] = PaymentType.initial
    is_partial: Optional[bool] = False
    remaining_balance: Optional[float] = 0


class MemberWithPaymentCreate(BaseModel):
    # Member fields
    full_name: str
    email: EmailStr
    password: Optional[str] = None
    phone: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    blood_group: Optional[str] = None
    medical_conditions: Optional[str] = None
    plan_id: Optional[str] = None
    start_date: date
    end_date: date
    status: MembershipStatus = MembershipStatus.active
    # Payment fields
    amount: float
    payment_method: PaymentMethod
    payment_date: date
    payment_status: PaymentStatus = PaymentStatus.completed
    invoice_number: Optional[str] = None
    notes: Optional[str] = None


class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    payment_method: Optional[PaymentMethod] = None
    payment_date: Optional[date] = None
    plan_id: Optional[str] = None
    description: Optional[str] = None
    status: Optional[PaymentStatus] = None


class PaymentResponse(BaseModel):
    id: str
    member_id: str
    member_name: str
    amount: float
    payment_method: str
    payment_date: str
    plan_id: Optional[str] = None
    plan_name: Optional[str] = None
    description: Optional[str] = None
    status: str
    payment_type: Optional[str] = "initial"
    is_partial: Optional[bool] = False
    remaining_balance: Optional[float] = 0
    created_at: str


class BalanceSummary(BaseModel):
    member_id: str
    member_name: str
    email: str
    phone: str
    plan_name: Optional[str] = None
    total_amount_due: float
    amount_paid: float
    balance_due: float
    status: str
    end_date: str


# Settings Models
class GymSettingsUpdate(BaseModel):
    gym_name: Optional[str] = None
    gym_email: Optional[str] = None
    gym_phone: Optional[str] = None
    gym_address: Optional[str] = None
    gym_logo: Optional[str] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None


class GymSettingsResponse(BaseModel):
    id: str
    gym_name: str
    gym_email: Optional[str] = None
    gym_phone: Optional[str] = None
    gym_address: Optional[str] = None
    gym_logo: Optional[str] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    currency: str = "USD"
    timezone: str = "UTC"
    updated_at: str
