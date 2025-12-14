-- ============================================================================
-- ADVANCED FEATURES DATABASE SCHEMA
-- ============================================================================
-- Run this in your Supabase SQL Editor to add advanced features
-- ============================================================================

-- 1. WORKOUT PLANS TABLE
CREATE TABLE IF NOT EXISTS workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL,
    trainer_id UUID,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    goal VARCHAR(100), -- e.g., "Weight Loss", "Muscle Gain", "Endurance"
    duration_weeks INTEGER,
    exercises JSONB, -- Array of exercises with sets, reps, rest time
    frequency VARCHAR(100), -- e.g., "3 days per week"
    notes TEXT,
    status VARCHAR(50) DEFAULT 'active', -- active, completed, paused
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(100),
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- 2. DIET PLANS TABLE
CREATE TABLE IF NOT EXISTS diet_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL,
    trainer_id UUID,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    goal VARCHAR(100), -- e.g., "Weight Loss", "Muscle Gain", "Maintenance"
    duration_weeks INTEGER,
    daily_calories INTEGER,
    macros JSONB, -- {"protein": 150, "carbs": 200, "fat": 50}
    meals JSONB, -- Array of meals with timing and food items
    supplements JSONB, -- Array of supplements
    restrictions TEXT, -- Dietary restrictions
    notes TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(100),
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- 3. EQUIPMENT TABLE
CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100), -- e.g., "Cardio", "Strength", "Free Weights"
    brand VARCHAR(100),
    model VARCHAR(100),
    purchase_date DATE,
    purchase_price DECIMAL(10, 2),
    warranty_expiry DATE,
    status VARCHAR(50) DEFAULT 'working', -- working, maintenance, broken, retired
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    location VARCHAR(100), -- Area in gym
    quantity INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CLASSES TABLE
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    trainer_id UUID,
    category VARCHAR(100), -- e.g., "Yoga", "HIIT", "Spin", "Strength"
    duration_minutes INTEGER NOT NULL,
    max_capacity INTEGER NOT NULL,
    schedule_day VARCHAR(20), -- e.g., "Monday", "Tuesday"
    schedule_time TIME NOT NULL,
    room VARCHAR(100),
    equipment_needed TEXT,
    difficulty_level VARCHAR(50), -- beginner, intermediate, advanced
    is_recurring BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'active', -- active, cancelled, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CLASS BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS class_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL,
    member_id UUID NOT NULL,
    booking_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmed', -- confirmed, cancelled, attended, no-show
    booked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    UNIQUE(class_id, member_id, booking_date) -- Prevent duplicate bookings
);

-- 6. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL, -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT
    entity_type VARCHAR(100) NOT NULL, -- member, payment, class, etc.
    entity_id VARCHAR(100),
    changes JSONB, -- Before and after values
    ip_address VARCHAR(50),
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. ADD 2FA COLUMNS TO MEMBERS TABLE
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(100);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_workout_plans_member ON workout_plans(member_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_status ON workout_plans(status);
CREATE INDEX IF NOT EXISTS idx_diet_plans_member ON diet_plans(member_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_status ON diet_plans(status);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category);
CREATE INDEX IF NOT EXISTS idx_classes_schedule ON classes(schedule_day, schedule_time);
CREATE INDEX IF NOT EXISTS idx_classes_trainer ON classes(trainer_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_member ON class_bookings(member_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_class ON class_bookings(class_id);
CREATE INDEX IF NOT EXISTS idx_class_bookings_date ON class_bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Workout Plans Policies
CREATE POLICY "Users can view their own workout plans"
    ON workout_plans FOR SELECT
    USING (auth.uid()::text = member_id::text);

CREATE POLICY "Admins and trainers can view all workout plans"
    ON workout_plans FOR SELECT
    USING (auth.jwt() ->> 'role' IN ('admin', 'trainer'));

CREATE POLICY "Admins and trainers can create workout plans"
    ON workout_plans FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'trainer'));

CREATE POLICY "Admins and trainers can update workout plans"
    ON workout_plans FOR UPDATE
    USING (auth.jwt() ->> 'role' IN ('admin', 'trainer'));

CREATE POLICY "Admins can delete workout plans"
    ON workout_plans FOR DELETE
    USING (auth.jwt() ->> 'role' = 'admin');

-- Diet Plans Policies
CREATE POLICY "Users can view their own diet plans"
    ON diet_plans FOR SELECT
    USING (auth.uid()::text = member_id::text);

CREATE POLICY "Admins and trainers can view all diet plans"
    ON diet_plans FOR SELECT
    USING (auth.jwt() ->> 'role' IN ('admin', 'trainer'));

CREATE POLICY "Admins and trainers can create diet plans"
    ON diet_plans FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'trainer'));

CREATE POLICY "Admins and trainers can update diet plans"
    ON diet_plans FOR UPDATE
    USING (auth.jwt() ->> 'role' IN ('admin', 'trainer'));

CREATE POLICY "Admins can delete diet plans"
    ON diet_plans FOR DELETE
    USING (auth.jwt() ->> 'role' = 'admin');

-- Equipment Policies
CREATE POLICY "Everyone can view equipment"
    ON equipment FOR SELECT
    USING (true);

CREATE POLICY "Only admins can manage equipment"
    ON equipment FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- Classes Policies
CREATE POLICY "Everyone can view active classes"
    ON classes FOR SELECT
    USING (status = 'active');

CREATE POLICY "Admins and trainers can manage classes"
    ON classes FOR ALL
    USING (auth.jwt() ->> 'role' IN ('admin', 'trainer'));

-- Class Bookings Policies
CREATE POLICY "Users can view their own bookings"
    ON class_bookings FOR SELECT
    USING (auth.uid()::text = member_id::text);

CREATE POLICY "Admins and trainers can view all bookings"
    ON class_bookings FOR SELECT
    USING (auth.jwt() ->> 'role' IN ('admin', 'trainer'));

CREATE POLICY "Users can create their own bookings"
    ON class_bookings FOR INSERT
    WITH CHECK (auth.uid()::text = member_id::text);

CREATE POLICY "Users can cancel their own bookings"
    ON class_bookings FOR UPDATE
    USING (auth.uid()::text = member_id::text);

CREATE POLICY "Admins can manage all bookings"
    ON class_bookings FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- Audit Logs Policies
CREATE POLICY "Only admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "System can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workout_plans_updated_at
    BEFORE UPDATE ON workout_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diet_plans_updated_at
    BEFORE UPDATE ON diet_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_equipment_updated_at
    BEFORE UPDATE ON equipment
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
    BEFORE UPDATE ON classes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA (OPTIONAL)
-- ============================================================================

-- Sample Equipment
INSERT INTO equipment (name, category, status, location, quantity) VALUES
('Treadmill', 'Cardio', 'working', 'Cardio Zone', 5),
('Exercise Bike', 'Cardio', 'working', 'Cardio Zone', 8),
('Bench Press', 'Strength', 'working', 'Free Weights Area', 3),
('Dumbbells Set', 'Free Weights', 'working', 'Free Weights Area', 20),
('Yoga Mats', 'Accessories', 'working', 'Yoga Studio', 30),
('Rowing Machine', 'Cardio', 'maintenance', 'Cardio Zone', 2)
ON CONFLICT DO NOTHING;

-- Sample Classes
INSERT INTO classes (name, description, category, duration_minutes, max_capacity, schedule_day, schedule_time, room, difficulty_level) VALUES
('Morning Yoga', 'Gentle yoga to start your day', 'Yoga', 60, 20, 'Monday', '07:00:00', 'Yoga Studio', 'beginner'),
('HIIT Blast', 'High intensity interval training', 'HIIT', 45, 15, 'Monday', '18:00:00', 'Main Floor', 'intermediate'),
('Spin Class', 'Indoor cycling workout', 'Cardio', 45, 12, 'Tuesday', '06:30:00', 'Spin Room', 'intermediate'),
('Strength Training', 'Full body strength workout', 'Strength', 60, 10, 'Wednesday', '19:00:00', 'Weight Room', 'advanced'),
('Zumba Dance', 'Fun dance fitness', 'Dance', 50, 25, 'Thursday', '18:30:00', 'Dance Studio', 'beginner')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Advanced Features Schema Created Successfully!';
    RAISE NOTICE '';
    RAISE NOTICE 'Created Tables:';
    RAISE NOTICE '  - workout_plans (for member fitness plans)';
    RAISE NOTICE '  - diet_plans (for member nutrition plans)';
    RAISE NOTICE '  - equipment (gym equipment management)';
    RAISE NOTICE '  - classes (fitness class scheduling)';
    RAISE NOTICE '  - class_bookings (member class reservations)';
    RAISE NOTICE '  - audit_logs (system activity tracking)';
    RAISE NOTICE '';
    RAISE NOTICE 'Added Features:';
    RAISE NOTICE '  - 2FA columns to members table';
    RAISE NOTICE '  - RLS policies for data security';
    RAISE NOTICE '  - Indexes for performance';
    RAISE NOTICE '  - Sample data for equipment and classes';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Update backend APIs to use these tables';
    RAISE NOTICE '  2. Create Supabase Edge Functions for notifications';
    RAISE NOTICE '  3. Build frontend interfaces';
END $$;
