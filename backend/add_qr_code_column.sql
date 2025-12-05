-- Add QR code column to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE;

-- Create index for faster QR code lookups
CREATE INDEX IF NOT EXISTS idx_members_qr_code ON members(qr_code);
