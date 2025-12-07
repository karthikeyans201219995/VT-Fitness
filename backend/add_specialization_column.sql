-- Add specialization column to users table for trainers
-- Run this in your Supabase SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS specialization TEXT;

-- Add comment
COMMENT ON COLUMN users.specialization IS 'Trainer specialization (e.g., Strength Training, Yoga, Cardio)';
