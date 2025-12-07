-- Create table to store encrypted member passwords
-- WARNING: This is a security risk. Only use if absolutely necessary.

CREATE TABLE IF NOT EXISTS member_passwords (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    encrypted_password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(member_id)
);

-- Enable Row Level Security
ALTER TABLE member_passwords ENABLE ROW LEVEL SECURITY;

-- Only admins can view passwords
CREATE POLICY "Admins can view member passwords" ON member_passwords
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can manage passwords
CREATE POLICY "Admins can manage member passwords" ON member_passwords
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_member_passwords_member_id ON member_passwords(member_id);
CREATE INDEX IF NOT EXISTS idx_member_passwords_email ON member_passwords(email);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_member_passwords_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_member_passwords_updated_at
BEFORE UPDATE ON member_passwords
FOR EACH ROW
EXECUTE FUNCTION update_member_passwords_updated_at();
