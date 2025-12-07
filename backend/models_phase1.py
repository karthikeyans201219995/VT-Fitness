"""
Pydantic models for Phase 1 enhancements
Payment Enhancements, Notifications, Marketing
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum


# =====================================================
# ENUMS
# =====================================================

class InstallmentFrequency(str, Enum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"


class InstallmentStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    OVERDUE = "overdue"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"


class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    PAID = "paid"
    CANCELLED = "cancelled"


class NotificationType(str, Enum):
    EMAIL = "email"
    SMS = "sms"
    WHATSAPP = "whatsapp"
    PUSH = "push"
    IN_APP = "in_app"


class NotificationPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class NotificationStatus(str, Enum):
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    SCHEDULED = "scheduled"


class ScheduleType(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    ONE_TIME = "one_time"
    CUSTOM = "custom"


class TargetType(str, Enum):
    ALL_MEMBERS = "all_members"
    ACTIVE_MEMBERS = "active_members"
    SPECIFIC_MEMBERS = "specific_members"
    CUSTOM_FILTER = "custom_filter"


class RewardType(str, Enum):
    DISCOUNT = "discount"
    CASHBACK = "cashback"
    FREE_DAYS = "free_days"
    CUSTOM = "custom"


class RewardStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REDEEMED = "redeemed"
    EXPIRED = "expired"


class ConversionStatus(str, Enum):
    REGISTERED = "registered"
    ACTIVE_MEMBER = "active_member"
    PAID = "paid"
    CANCELLED = "cancelled"


class DiscountType(str, Enum):
    PERCENTAGE = "percentage"
    FIXED_AMOUNT = "fixed_amount"
    FREE_DAYS = "free_days"
    BUY_X_GET_Y = "buy_x_get_y"


class MemberType(str, Enum):
    NEW = "new"
    EXISTING = "existing"
    ALL = "all"


class LeadStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    INTERESTED = "interested"
    NOT_INTERESTED = "not_interested"
    CONVERTED = "converted"
    LOST = "lost"


class OfferType(str, Enum):
    SEASONAL = "seasonal"
    FESTIVAL = "festival"
    LIMITED_TIME = "limited_time"
    MEMBERSHIP = "membership"
    REFERRAL = "referral"


# =====================================================
# INSTALLMENT PLANS
# =====================================================

class InstallmentPlanBase(BaseModel):
    member_id: str
    plan_id: Optional[str] = None
    total_amount: float
    installment_amount: float
    installment_count: int
    frequency: InstallmentFrequency
    start_date: date
    auto_debit: bool = False


class InstallmentPlanCreate(InstallmentPlanBase):
    pass


class InstallmentPlanUpdate(BaseModel):
    installment_amount: Optional[float] = None
    frequency: Optional[InstallmentFrequency] = None
    next_due_date: Optional[date] = None
    status: Optional[InstallmentStatus] = None
    auto_debit: Optional[bool] = None


class InstallmentPlan(InstallmentPlanBase):
    id: str
    paid_installments: int = 0
    next_due_date: date
    status: InstallmentStatus = InstallmentStatus.ACTIVE
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =====================================================
# INSTALLMENT PAYMENTS
# =====================================================

class InstallmentPaymentBase(BaseModel):
    installment_plan_id: str
    installment_number: int
    amount: float
    due_date: date


class InstallmentPaymentCreate(InstallmentPaymentBase):
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    notes: Optional[str] = None


class InstallmentPaymentUpdate(BaseModel):
    status: Optional[PaymentStatus] = None
    paid_date: Optional[datetime] = None
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    notes: Optional[str] = None


class InstallmentPayment(InstallmentPaymentBase):
    id: str
    paid_date: Optional[datetime] = None
    status: PaymentStatus = PaymentStatus.PENDING
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# =====================================================
# INVOICES
# =====================================================

class InvoiceItem(BaseModel):
    name: str
    description: Optional[str] = None
    quantity: int = 1
    rate: float
    amount: float


class InvoiceBase(BaseModel):
    member_id: str
    invoice_date: date
    due_date: Optional[date] = None
    subtotal: float
    discount_amount: float = 0
    tax_rate: float = 18.0  # GST rate
    items: List[InvoiceItem]
    notes: Optional[str] = None
    terms: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    payment_id: Optional[str] = None
    installment_payment_id: Optional[str] = None
    gstin: Optional[str] = None


class InvoiceUpdate(BaseModel):
    status: Optional[InvoiceStatus] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None


class Invoice(InvoiceBase):
    id: str
    invoice_number: str
    payment_id: Optional[str] = None
    installment_payment_id: Optional[str] = None
    tax_amount: float = 0
    total_amount: float
    gstin: Optional[str] = None
    cgst: float = 0
    sgst: float = 0
    igst: float = 0
    status: InvoiceStatus = InvoiceStatus.DRAFT
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =====================================================
# NOTIFICATIONS
# =====================================================

class NotificationTemplateBase(BaseModel):
    name: str
    code: str
    subject: str
    body: str
    template_type: NotificationType
    variables: Optional[Dict[str, Any]] = None
    is_active: bool = True


class NotificationTemplateCreate(NotificationTemplateBase):
    pass


class NotificationTemplateUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None
    is_active: Optional[bool] = None


class NotificationTemplate(NotificationTemplateBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class NotificationBase(BaseModel):
    member_id: str
    notification_type: NotificationType
    message: str
    priority: NotificationPriority = NotificationPriority.NORMAL
    subject: Optional[str] = None
    recipient_email: Optional[EmailStr] = None
    recipient_phone: Optional[str] = None


class NotificationCreate(NotificationBase):
    template_id: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


class NotificationUpdate(BaseModel):
    status: Optional[NotificationStatus] = None
    sent_at: Optional[datetime] = None
    error_message: Optional[str] = None


class Notification(NotificationBase):
    id: str
    template_id: Optional[str] = None
    status: NotificationStatus = NotificationStatus.PENDING
    scheduled_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    error_message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationScheduleBase(BaseModel):
    name: str
    template_id: str
    schedule_type: ScheduleType
    trigger_event: Optional[str] = None
    trigger_days_before: Optional[int] = None
    execution_time: Optional[str] = None
    target_type: TargetType = TargetType.ALL_MEMBERS
    target_filter: Optional[Dict[str, Any]] = None
    is_active: bool = True


class NotificationScheduleCreate(NotificationScheduleBase):
    pass


class NotificationScheduleUpdate(BaseModel):
    is_active: Optional[bool] = None
    execution_time: Optional[str] = None
    target_type: Optional[TargetType] = None
    target_filter: Optional[Dict[str, Any]] = None


class NotificationSchedule(NotificationScheduleBase):
    id: str
    next_execution: Optional[datetime] = None
    last_executed: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =====================================================
# REFERRALS
# =====================================================

class ReferralBase(BaseModel):
    referrer_id: str
    referred_id: str
    referral_code: str
    reward_type: RewardType = RewardType.DISCOUNT
    reward_value: Optional[float] = None


class ReferralCreate(ReferralBase):
    reward_expiry_date: Optional[date] = None


class ReferralUpdate(BaseModel):
    reward_status: Optional[RewardStatus] = None
    conversion_status: Optional[ConversionStatus] = None
    reward_claimed_date: Optional[datetime] = None


class Referral(ReferralBase):
    id: str
    reward_status: RewardStatus = RewardStatus.PENDING
    referred_date: datetime
    reward_claimed_date: Optional[datetime] = None
    reward_expiry_date: Optional[date] = None
    conversion_status: ConversionStatus = ConversionStatus.REGISTERED
    created_at: datetime

    class Config:
        from_attributes = True


# =====================================================
# COUPONS
# =====================================================

class CouponBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    discount_type: DiscountType
    discount_value: float
    max_discount_amount: Optional[float] = None
    usage_limit: Optional[int] = None
    usage_per_member: int = 1
    valid_from: date
    valid_until: date
    applicable_plans: Optional[List[str]] = None
    min_purchase_amount: Optional[float] = None
    member_type: MemberType = MemberType.ALL
    is_active: bool = True


class CouponCreate(CouponBase):
    pass


class CouponUpdate(BaseModel):
    is_active: Optional[bool] = None
    valid_until: Optional[date] = None
    usage_limit: Optional[int] = None


class Coupon(CouponBase):
    id: str
    current_usage: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CouponValidation(BaseModel):
    is_valid: bool
    discount_amount: float = 0
    message: str


class ApplyCouponRequest(BaseModel):
    coupon_code: str
    member_id: str
    plan_id: Optional[str] = None
    amount: float


# =====================================================
# LEADS
# =====================================================

class LeadBase(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone: str
    interested_plan: Optional[str] = None
    preferred_contact: Optional[str] = None
    source: Optional[str] = None
    source_details: Optional[str] = None


class LeadCreate(LeadBase):
    notes: Optional[str] = None
    tags: Optional[List[str]] = None


class LeadUpdate(BaseModel):
    status: Optional[LeadStatus] = None
    assigned_to: Optional[str] = None
    last_contacted: Optional[datetime] = None
    next_follow_up: Optional[date] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    converted_to_member_id: Optional[str] = None
    converted_at: Optional[datetime] = None


class Lead(LeadBase):
    id: str
    status: LeadStatus = LeadStatus.NEW
    assigned_to: Optional[str] = None
    last_contacted: Optional[datetime] = None
    next_follow_up: Optional[date] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    converted_to_member_id: Optional[str] = None
    converted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =====================================================
# OFFERS
# =====================================================

class OfferBase(BaseModel):
    title: str
    description: Optional[str] = None
    offer_type: OfferType
    discount_type: DiscountType
    discount_value: float
    valid_from: date
    valid_until: date
    target_audience: Optional[str] = None
    applicable_plans: Optional[List[str]] = None
    banner_image: Optional[str] = None
    is_featured: bool = False
    display_order: int = 0
    is_active: bool = True


class OfferCreate(OfferBase):
    auto_generate_coupon: bool = False
    coupon_prefix: Optional[str] = None


class OfferUpdate(BaseModel):
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    valid_until: Optional[date] = None


class Offer(OfferBase):
    id: str
    auto_generate_coupon: bool = False
    coupon_prefix: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =====================================================
# REVENUE FORECASTING
# =====================================================

class RevenueForecast(BaseModel):
    period: str  # 'next_30_days', 'next_60_days', 'next_90_days'
    predicted_revenue: float
    confirmed_revenue: float  # From scheduled payments
    potential_revenue: float  # From expiring memberships likely to renew
    breakdown: Dict[str, Any]


# =====================================================
# ANALYTICS
# =====================================================

class PaymentAnalytics(BaseModel):
    total_revenue: float
    total_pending: float
    total_overdue: float
    installment_revenue: float
    one_time_revenue: float
    avg_payment_value: float
    payment_success_rate: float


class MarketingAnalytics(BaseModel):
    total_referrals: int
    successful_conversions: int
    total_leads: int
    conversion_rate: float
    active_coupons: int
    coupon_redemption_rate: float
    top_performing_offers: List[Dict[str, Any]]


class MemberEnhanced(BaseModel):
    """Enhanced member model with referral and balance info"""
    id: str
    full_name: str
    email: str
    referral_code: Optional[str] = None
    referred_by: Optional[str] = None
    date_of_birth: Optional[date] = None
    payment_balance: float = 0
    total_referrals: int = 0
