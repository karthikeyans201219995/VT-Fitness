-- =====================================================
-- PHASE 1 ENHANCEMENTS - Database Schema
-- Payment Enhancements, Notifications, Marketing
-- =====================================================

-- =====================================================
-- 1. PAYMENT ENHANCEMENTS
-- =====================================================

-- Installment Plans Table
CREATE TABLE IF NOT EXISTS installment_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    installment_amount DECIMAL(10, 2) NOT NULL,
    installment_count INTEGER NOT NULL,
    paid_installments INTEGER DEFAULT 0,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly')),
    start_date DATE NOT NULL,
    next_due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'overdue')),
    auto_debit BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Installment Payments Table (track individual installment payments)
CREATE TABLE IF NOT EXISTS installment_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    installment_plan_id UUID REFERENCES installment_plans(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices Table (GST Invoice Support)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    installment_payment_id UUID REFERENCES installment_payments(id) ON DELETE SET NULL,
    
    -- Invoice Details
    invoice_date DATE NOT NULL,
    due_date DATE,
    
    -- Amounts
    subtotal DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    tax_rate DECIMAL(5, 2) DEFAULT 18.00, -- GST rate
    tax_amount DECIMAL(10, 2) DEFAULT 0,
    total_amount DECIMAL(10, 2) NOT NULL,
    
    -- GST Details
    gstin VARCHAR(15), -- Business GSTIN
    cgst DECIMAL(10, 2) DEFAULT 0,
    sgst DECIMAL(10, 2) DEFAULT 0,
    igst DECIMAL(10, 2) DEFAULT 0,
    
    -- Invoice Items (JSON array)
    items JSONB NOT NULL, -- [{name, description, quantity, rate, amount}]
    
    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
    
    -- Additional Info
    notes TEXT,
    terms TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. NOTIFICATION SYSTEM
-- =====================================================

-- Notification Templates Table
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'payment_due_7days', 'birthday_wish'
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('email', 'sms', 'whatsapp', 'push')),
    variables JSONB, -- Available variables like {member_name}, {due_date}, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    template_id UUID REFERENCES notification_templates(id) ON DELETE SET NULL,
    
    -- Notification Details
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('email', 'sms', 'whatsapp', 'push', 'in_app')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    
    -- Content
    subject VARCHAR(500),
    message TEXT NOT NULL,
    
    -- Delivery
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'scheduled')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    error_message TEXT,
    metadata JSONB, -- Additional data
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheduled Notifications Table
CREATE TABLE IF NOT EXISTS notification_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    template_id UUID REFERENCES notification_templates(id) ON DELETE CASCADE,
    
    -- Schedule Configuration
    schedule_type VARCHAR(50) NOT NULL CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'one_time', 'custom')),
    trigger_event VARCHAR(100), -- e.g., 'payment_due', 'membership_expiry', 'birthday'
    trigger_days_before INTEGER, -- Days before event to trigger
    
    -- Time Configuration
    execution_time TIME, -- Time of day to send
    next_execution TIMESTAMP WITH TIME ZONE,
    
    -- Target
    target_type VARCHAR(50) CHECK (target_type IN ('all_members', 'active_members', 'specific_members', 'custom_filter')),
    target_filter JSONB, -- Filter criteria for members
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    last_executed TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. MARKETING FEATURES
-- =====================================================

-- Referrals Table
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES members(id) ON DELETE CASCADE, -- Who referred
    referred_id UUID REFERENCES members(id) ON DELETE CASCADE, -- Who was referred
    referral_code VARCHAR(50) NOT NULL,
    
    -- Reward Details
    reward_type VARCHAR(50) CHECK (reward_type IN ('discount', 'cashback', 'free_days', 'custom')),
    reward_value DECIMAL(10, 2),
    reward_status VARCHAR(20) DEFAULT 'pending' CHECK (reward_status IN ('pending', 'approved', 'redeemed', 'expired')),
    
    -- Dates
    referred_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reward_claimed_date TIMESTAMP WITH TIME ZONE,
    reward_expiry_date DATE,
    
    -- Tracking
    conversion_status VARCHAR(20) DEFAULT 'registered' CHECK (conversion_status IN ('registered', 'active_member', 'paid', 'cancelled')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Discount Configuration
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_days')),
    discount_value DECIMAL(10, 2) NOT NULL,
    max_discount_amount DECIMAL(10, 2), -- For percentage discounts
    
    -- Usage Limits
    usage_limit INTEGER, -- Total number of times can be used
    usage_per_member INTEGER DEFAULT 1, -- Times each member can use
    current_usage INTEGER DEFAULT 0,
    
    -- Validity
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    
    -- Applicable Plans (NULL means all plans)
    applicable_plans JSONB, -- Array of plan IDs
    
    -- Conditions
    min_purchase_amount DECIMAL(10, 2),
    member_type VARCHAR(50), -- 'new', 'existing', 'all'
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coupon Usage Table
CREATE TABLE IF NOT EXISTS coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    
    discount_amount DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads Table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Contact Information
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    
    -- Interest
    interested_plan VARCHAR(255),
    preferred_contact VARCHAR(20) CHECK (preferred_contact IN ('email', 'phone', 'whatsapp')),
    
    -- Source
    source VARCHAR(100), -- 'website', 'referral', 'social_media', 'walk_in', etc.
    source_details TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'not_interested', 'converted', 'lost')),
    
    -- Follow-up
    assigned_to UUID, -- Staff member assigned
    last_contacted TIMESTAMP WITH TIME ZONE,
    next_follow_up DATE,
    
    -- Notes
    notes TEXT,
    tags JSONB, -- Array of tags
    
    -- Conversion
    converted_to_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    converted_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Offers Table
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Offer Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    offer_type VARCHAR(50) CHECK (offer_type IN ('seasonal', 'festival', 'limited_time', 'membership', 'referral')),
    
    -- Discount Configuration (similar to coupons but more flexible)
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_days', 'buy_x_get_y')),
    discount_value DECIMAL(10, 2) NOT NULL,
    
    -- Validity
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    
    -- Targeting
    target_audience VARCHAR(50) CHECK (target_audience IN ('all', 'new_members', 'existing_members', 'expired_members')),
    applicable_plans JSONB, -- Array of plan IDs
    
    -- Display
    banner_image VARCHAR(500), -- URL to banner image
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Auto Coupon Generation
    auto_generate_coupon BOOLEAN DEFAULT false,
    coupon_prefix VARCHAR(20), -- If auto-generating, use this prefix
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. ENHANCED MEMBER FIELDS
-- =====================================================

-- Add columns to existing members table
-- (Run these only if columns don't exist)

ALTER TABLE members ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50) UNIQUE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS referred_by VARCHAR(50); -- Referral code used
ALTER TABLE members ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS payment_balance DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE members ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Installment Plans
CREATE INDEX IF NOT EXISTS idx_installment_plans_member ON installment_plans(member_id);
CREATE INDEX IF NOT EXISTS idx_installment_plans_status ON installment_plans(status);
CREATE INDEX IF NOT EXISTS idx_installment_plans_next_due ON installment_plans(next_due_date);

-- Installment Payments
CREATE INDEX IF NOT EXISTS idx_installment_payments_plan ON installment_payments(installment_plan_id);
CREATE INDEX IF NOT EXISTS idx_installment_payments_status ON installment_payments(status);
CREATE INDEX IF NOT EXISTS idx_installment_payments_due_date ON installment_payments(due_date);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_member ON invoices(member_id);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_member ON notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_at);

-- Notification Schedules
CREATE INDEX IF NOT EXISTS idx_notification_schedules_active ON notification_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_schedules_next_exec ON notification_schedules(next_execution);

-- Referrals
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- Coupons
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_validity ON coupons(valid_from, valid_until);

-- Leads
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON leads(phone);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Offers
CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(is_active);
CREATE INDEX IF NOT EXISTS idx_offers_validity ON offers(valid_from, valid_until);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE installment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE installment_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "Admin full access - installment_plans" ON installment_plans FOR ALL USING (true);
CREATE POLICY "Admin full access - installment_payments" ON installment_payments FOR ALL USING (true);
CREATE POLICY "Admin full access - invoices" ON invoices FOR ALL USING (true);
CREATE POLICY "Admin full access - notification_templates" ON notification_templates FOR ALL USING (true);
CREATE POLICY "Admin full access - notifications" ON notifications FOR ALL USING (true);
CREATE POLICY "Admin full access - notification_schedules" ON notification_schedules FOR ALL USING (true);
CREATE POLICY "Admin full access - referrals" ON referrals FOR ALL USING (true);
CREATE POLICY "Admin full access - coupons" ON coupons FOR ALL USING (true);
CREATE POLICY "Admin full access - coupon_usage" ON coupon_usage FOR ALL USING (true);
CREATE POLICY "Admin full access - leads" ON leads FOR ALL USING (true);
CREATE POLICY "Admin full access - offers" ON offers FOR ALL USING (true);

-- Members can view their own data
CREATE POLICY "Members view own installment_plans" ON installment_plans FOR SELECT USING (auth.uid() = member_id);
CREATE POLICY "Members view own installment_payments" ON installment_payments FOR SELECT USING (
    installment_plan_id IN (SELECT id FROM installment_plans WHERE member_id = auth.uid())
);
CREATE POLICY "Members view own invoices" ON invoices FOR SELECT USING (auth.uid() = member_id);
CREATE POLICY "Members view own notifications" ON notifications FOR SELECT USING (auth.uid() = member_id);
CREATE POLICY "Members view own referrals" ON referrals FOR SELECT USING (auth.uid() IN (referrer_id, referred_id));
CREATE POLICY "Members view active coupons" ON coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Members view active offers" ON offers FOR SELECT USING (is_active = true);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update installment plan status
CREATE OR REPLACE FUNCTION update_installment_plan_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update paid installments count
    UPDATE installment_plans
    SET paid_installments = (
        SELECT COUNT(*) FROM installment_payments 
        WHERE installment_plan_id = NEW.installment_plan_id AND status = 'paid'
    )
    WHERE id = NEW.installment_plan_id;
    
    -- Check if plan is completed
    UPDATE installment_plans
    SET status = 'completed'
    WHERE id = NEW.installment_plan_id 
    AND paid_installments >= installment_count;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_installment_status
AFTER INSERT OR UPDATE ON installment_payments
FOR EACH ROW
EXECUTE FUNCTION update_installment_plan_status();

-- Function to update next due date for installment plans
CREATE OR REPLACE FUNCTION update_next_due_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'paid' AND OLD.status != 'paid' THEN
        -- Update next due date based on frequency
        UPDATE installment_plans
        SET next_due_date = CASE frequency
            WHEN 'weekly' THEN next_due_date + INTERVAL '1 week'
            WHEN 'monthly' THEN next_due_date + INTERVAL '1 month'
            WHEN 'quarterly' THEN next_due_date + INTERVAL '3 months'
        END
        WHERE id = NEW.installment_plan_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_next_due
AFTER UPDATE ON installment_payments
FOR EACH ROW
EXECUTE FUNCTION update_next_due_date();

-- Function to increment coupon usage
CREATE OR REPLACE FUNCTION increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE coupons
    SET current_usage = current_usage + 1
    WHERE id = NEW.coupon_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_increment_coupon_usage
AFTER INSERT ON coupon_usage
FOR EACH ROW
EXECUTE FUNCTION increment_coupon_usage();

-- Function to update referral count
CREATE OR REPLACE FUNCTION update_referral_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE members
    SET total_referrals = total_referrals + 1
    WHERE id = NEW.referrer_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_referral_count
AFTER INSERT ON referrals
FOR EACH ROW
EXECUTE FUNCTION update_referral_count();

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL THEN
        NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || 
                              LPAD(NEXTVAL('invoice_number_seq')::TEXT, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE TRIGGER trigger_generate_invoice_number
BEFORE INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION generate_invoice_number();

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        -- Generate code from first name + random 4 digits
        NEW.referral_code := UPPER(SUBSTRING(NEW.full_name FROM 1 FOR 4)) || 
                            LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_referral_code
BEFORE INSERT ON members
FOR EACH ROW
EXECUTE FUNCTION generate_referral_code();

-- =====================================================
-- SEED DATA - Default Notification Templates
-- =====================================================

INSERT INTO notification_templates (name, code, subject, body, template_type, variables) VALUES
('Payment Due - 7 Days', 'payment_due_7days', 
 'Payment Reminder: Due in 7 Days', 
 'Dear {member_name},\n\nThis is a friendly reminder that your payment of {amount} is due on {due_date} (in 7 days).\n\nPlease make the payment at your earliest convenience to avoid any interruption in your membership.\n\nThank you,\n{gym_name} Team',
 'email',
 '["member_name", "amount", "due_date", "gym_name"]'::jsonb),

('Payment Due - 3 Days', 'payment_due_3days', 
 'Payment Reminder: Due in 3 Days', 
 'Dear {member_name},\n\nYour payment of {amount} is due on {due_date} (in 3 days).\n\nPlease ensure timely payment to continue enjoying your membership benefits.\n\nThank you,\n{gym_name} Team',
 'email',
 '["member_name", "amount", "due_date", "gym_name"]'::jsonb),

('Payment Due - Today', 'payment_due_today', 
 'Payment Due Today', 
 'Dear {member_name},\n\nYour payment of {amount} is due TODAY.\n\nPlease make the payment as soon as possible to avoid any service interruption.\n\nThank you,\n{gym_name} Team',
 'email',
 '["member_name", "amount", "due_date", "gym_name"]'::jsonb),

('Payment Overdue', 'payment_overdue', 
 'Payment Overdue - Immediate Action Required', 
 'Dear {member_name},\n\nYour payment of {amount} was due on {due_date} and is now OVERDUE.\n\nPlease make the payment immediately to avoid suspension of your membership.\n\nThank you,\n{gym_name} Team',
 'email',
 '["member_name", "amount", "due_date", "gym_name"]'::jsonb),

('Birthday Wish', 'birthday_wish', 
 'Happy Birthday from {gym_name}!', 
 'Dear {member_name},\n\n🎉 Wishing you a very Happy Birthday! 🎉\n\nThank you for being a valued member of {gym_name}. We hope you have a fantastic day filled with joy and celebration!\n\nAs a birthday gift, enjoy a special discount on your next renewal. Check your member portal for details.\n\nBest wishes,\n{gym_name} Team',
 'email',
 '["member_name", "gym_name"]'::jsonb),

('Membership Renewal Reminder', 'membership_renewal', 
 'Time to Renew Your Membership', 
 'Dear {member_name},\n\nYour membership expires on {expiry_date}. Don''t miss out on your fitness journey!\n\nRenew now and continue enjoying all the benefits of {gym_name}.\n\nContact us or visit the gym to renew.\n\nThank you,\n{gym_name} Team',
 'email',
 '["member_name", "expiry_date", "gym_name"]'::jsonb),

('Payment Receipt', 'payment_receipt', 
 'Payment Receipt - {invoice_number}', 
 'Dear {member_name},\n\nThank you for your payment!\n\nAmount Paid: {amount}\nPayment Method: {payment_method}\nDate: {payment_date}\nInvoice Number: {invoice_number}\n\nYour invoice is attached.\n\nThank you,\n{gym_name} Team',
 'email',
 '["member_name", "amount", "payment_method", "payment_date", "invoice_number", "gym_name"]'::jsonb);

-- =====================================================
-- SEED DATA - Sample Offers
-- =====================================================

INSERT INTO offers (title, description, offer_type, discount_type, discount_value, valid_from, valid_until, target_audience, is_featured) VALUES
('New Year Special', 'Start your fitness journey with 20% off on annual memberships!', 'seasonal', 'percentage', 20.00, '2025-01-01', '2025-01-31', 'all', true),
('Refer a Friend', 'Refer a friend and get 1 month free when they join!', 'referral', 'free_days', 30.00, '2025-01-01', '2025-12-31', 'existing_members', true);

COMMIT;
