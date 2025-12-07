-- Add payment tracking columns to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS total_amount_due DECIMAL(10,2) DEFAULT 0;
ALTER TABLE members ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0;
ALTER TABLE members ADD COLUMN IF NOT EXISTS balance_due DECIMAL(10,2) DEFAULT 0;

-- Add plan change tracking columns
ALTER TABLE members ADD COLUMN IF NOT EXISTS previous_plan_id UUID REFERENCES plans(id);
ALTER TABLE members ADD COLUMN IF NOT EXISTS plan_changed_at TIMESTAMP WITH TIME ZONE;

-- Update payments table to support partial payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_partial BOOLEAN DEFAULT false;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS remaining_balance DECIMAL(10,2) DEFAULT 0;

-- Add payment_type column as text (since we can't easily add enum to existing table)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'initial';

-- Add constraint for payment_type values
DO $$ BEGIN
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_type_check;
    ALTER TABLE payments ADD CONSTRAINT payments_payment_type_check 
        CHECK (payment_type IN ('initial', 'renewal', 'upgrade', 'partial', 'balance_clearance'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create a view for members with outstanding balances
CREATE OR REPLACE VIEW members_with_balance AS
SELECT 
    m.id,
    m.full_name,
    m.email,
    m.phone,
    m.plan_id,
    p.name as plan_name,
    m.total_amount_due,
    m.amount_paid,
    m.balance_due,
    m.status,
    m.end_date
FROM members m
LEFT JOIN plans p ON m.plan_id = p.id
WHERE m.balance_due > 0
ORDER BY m.balance_due DESC;

-- Create function to update member balance
CREATE OR REPLACE FUNCTION update_member_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the member's payment tracking
    UPDATE members
    SET 
        amount_paid = amount_paid + NEW.amount,
        balance_due = total_amount_due - (amount_paid + NEW.amount)
    WHERE id = NEW.member_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update balance when payment is made
DROP TRIGGER IF EXISTS payment_balance_update ON payments;
CREATE TRIGGER payment_balance_update
    AFTER INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_member_balance();

-- Add comments for documentation
COMMENT ON COLUMN members.total_amount_due IS 'Total amount member needs to pay for current plan';
COMMENT ON COLUMN members.amount_paid IS 'Total amount paid by member so far';
COMMENT ON COLUMN members.balance_due IS 'Remaining balance to be paid';
COMMENT ON COLUMN members.previous_plan_id IS 'Previous plan before upgrade/change';
COMMENT ON COLUMN members.plan_changed_at IS 'Timestamp when plan was last changed';
