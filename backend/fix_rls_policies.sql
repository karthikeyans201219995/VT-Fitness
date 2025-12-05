-- Fix for infinite recursion in users table RLS policies
-- Run this in your Supabase SQL Editor

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

-- Recreate policies without recursion
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Allow admins to view all users (using auth metadata instead of users table)
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'admin' 
        OR 
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

-- Allow service role to insert users (for signup)
CREATE POLICY "Service role can insert users" ON users
    FOR INSERT WITH CHECK (true);
