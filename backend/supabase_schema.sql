-- Supabase SQL Schema for Gym Management System
-- Run this in your Supabase SQL Editor after creating your project
-- This will create all necessary tables for the gym management system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (stores additional user info beyond Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'trainer', 'member')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Plans table
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    duration_months INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    features TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Plans policies (anyone authenticated can view, only admins can modify)
CREATE POLICY "Anyone can view active plans" ON plans
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert plans" ON plans
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update plans" ON plans
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can delete plans" ON plans
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Members table
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    address TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    blood_group TEXT,
    medical_conditions TEXT,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- Members policies
CREATE POLICY "Members can view own profile" ON members
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins and trainers can view all members" ON members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'trainer')
        )
    );

CREATE POLICY "Admins can manage members" ON members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    check_out_time TIMESTAMPTZ,
    notes TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Attendance policies
CREATE POLICY "Members can view own attendance" ON attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM members WHERE members.id = attendance.member_id AND members.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins and trainers can view all attendance" ON attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'trainer')
        )
    );

CREATE POLICY "Admins and trainers can manage attendance" ON attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'trainer')
        )
    );

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'upi', 'bank_transfer')),
    payment_date DATE NOT NULL,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Payments policies
CREATE POLICY "Members can view own payments" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM members WHERE members.id = payments.member_id AND members.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all payments" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage payments" ON payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gym_name TEXT NOT NULL,
    gym_email TEXT,
    gym_phone TEXT,
    gym_address TEXT,
    gym_logo TEXT,
    opening_time TEXT,
    closing_time TEXT,
    currency TEXT DEFAULT 'USD',
    timezone TEXT DEFAULT 'UTC',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Settings policies
CREATE POLICY "Anyone can view settings" ON settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can update settings" ON settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Insert default settings
INSERT INTO settings (gym_name, currency, timezone)
VALUES ('My Gym', 'USD', 'UTC')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_members_plan_id ON members(plan_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Create a function to automatically update member status based on end_date
CREATE OR REPLACE FUNCTION update_member_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_date < CURRENT_DATE AND NEW.status = 'active' THEN
        NEW.status := 'expired';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_member_status
BEFORE INSERT OR UPDATE ON members
FOR EACH ROW
EXECUTE FUNCTION update_member_status();
