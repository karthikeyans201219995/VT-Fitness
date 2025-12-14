# Payment Balance Tracking & Invoice System Setup

This guide explains the new payment balance tracking, automatic status updates, invoice downloads, and email notifications.

## Features Implemented

### 1. **Automatic Balance Tracking**
- When a member registers with payment, the system automatically:
  - Calculates `total_amount_due` (based on selected plan)
  - Records `amount_paid` (the payment made)
  - Calculates `balance_due` (remaining balance)
  - Updates member status based on payment:
    - **Active**: Full payment received (balance = 0)
    - **Inactive**: Partial payment (balance > 0)

### 2. **Partial Payment Support**
- Members can make partial payments
- System tracks:
  - `is_partial`: Boolean flag for partial payments
  - `remaining_balance`: Amount still owed
  - `payment_type`: initial, partial, renewal, upgrade, balance_clearance
- Balance automatically updates with each payment

### 3. **Invoice Download**
- Click "Download" button on any payment to get PDF invoice
- Invoice includes:
  - GST calculation (CGST/SGST or IGST)
  - Itemized breakdown
  - Member and gym details
  - Professional formatting

### 4. **Email Notifications**
- New members receive welcome email with:
  - Login credentials (email + password)
  - Direct link to member portal
  - Membership details (plan, dates, amount)
  - Balance due warning (if partial payment)
  - Professional HTML formatting

## Setup Instructions

### Step 1: Apply Database Changes

Run the SQL script in your Supabase SQL Editor:

```bash
# The SQL file is located at: backend/add_payment_tracking.sql
```

**Or manually run this SQL:**

```sql
-- Add balance tracking columns
ALTER TABLE members ADD COLUMN IF NOT EXISTS total_amount_due DECIMAL(10,2) DEFAULT 0;
ALTER TABLE members ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2) DEFAULT 0;
ALTER TABLE members ADD COLUMN IF NOT EXISTS balance_due DECIMAL(10,2) DEFAULT 0;

-- Add payment tracking columns
ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_partial BOOLEAN DEFAULT false;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS remaining_balance DECIMAL(10,2) DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'initial';

-- Add constraint for payment_type
ALTER TABLE payments ADD CONSTRAINT payments_payment_type_check 
    CHECK (payment_type IN ('initial', 'renewal', 'upgrade', 'partial', 'balance_clearance'));

-- Create trigger to auto-update balance
CREATE OR REPLACE FUNCTION update_member_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE members
    SET 
        amount_paid = amount_paid + NEW.amount,
        balance_due = total_amount_due - (amount_paid + NEW.amount)
    WHERE id = NEW.member_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS payment_balance_update ON payments;
CREATE TRIGGER payment_balance_update
    AFTER INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_member_balance();
```

### Step 2: Configure Email Service

Add these environment variables to `backend/.env`:

```env
# Email Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
GYM_NAME=Your Gym Name

# Member Portal URL (for email links)
MEMBER_PORTAL_URL=http://localhost:3000/login

# Optional: Invoice Details
GYM_ADDRESS=Your Gym Address
GYM_CITY=Your City
GYM_STATE=Your State
GYM_PINCODE=123456
GYM_PHONE=+1234567890
GYM_EMAIL=info@yourgym.com
GYM_GSTIN=22AAAAA0000A1Z5
```

**For Gmail:**
1. Enable 2-Factor Authentication
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the app password in `SMTP_PASSWORD`

### Step 3: Restart Backend

```bash
cd backend
python server.py
```

### Step 4: Test the System

1. **Add a New Member with Payment:**
   - Go to Payments page
   - Click "Add Payment"
   - Fill in member details
   - Select a plan (amount auto-fills)
   - Enter payment amount (can be less than plan price for partial payment)
   - Submit

2. **Check Balance Tracking:**
   - If payment < plan price: Status = "Inactive", Balance shown
   - If payment >= plan price: Status = "Active", Balance = 0

3. **Download Invoice:**
   - Click download button on any payment
   - PDF invoice downloads automatically

4. **Check Email:**
   - New member receives welcome email
   - Contains login credentials
   - Shows balance if partial payment
   - Includes link to member portal

## How It Works

### Registration Flow

```
1. Admin adds member with payment
   ↓
2. System calculates:
   - total_amount_due = plan.price
   - amount_paid = payment.amount
   - balance_due = total_amount_due - amount_paid
   ↓
3. Status determined:
   - balance_due > 0 → status = "inactive"
   - balance_due <= 0 → status = "active"
   ↓
4. Payment record created with:
   - is_partial = (balance_due > 0)
   - remaining_balance = balance_due
   - payment_type = "partial" or "initial"
   ↓
5. Email sent to member with:
   - Login credentials
   - Membership details
   - Balance warning (if applicable)
   - Portal link
```

### Subsequent Payments

When a member makes additional payments:

```
1. New payment added
   ↓
2. Trigger automatically updates:
   - amount_paid += new_payment.amount
   - balance_due = total_amount_due - amount_paid
   ↓
3. Status auto-updates:
   - balance_due > 0 → remains "inactive"
   - balance_due <= 0 → changes to "active"
```

### Invoice Generation

```
1. Click download on payment
   ↓
2. System checks for existing invoice
   ↓
3. If not found, generates on-the-fly:
   - Creates invoice data
   - Calculates GST (18%)
   - Splits into CGST/SGST (9% each)
   ↓
4. Generates PDF with:
   - Professional layout
   - GST compliance
   - Member & gym details
   - Itemized breakdown
   ↓
5. Downloads to browser
```

## UI Features

### Payment Form
- **Auto-calculation**: Select plan → amount auto-fills
- **Balance preview**: Shows total due, paying now, and balance
- **Visual indicators**: 
  - Yellow warning for partial payments
  - Green confirmation for full payments
- **Status info**: Explains status will be inactive until full payment

### Payment List
- **Balance badges**: Yellow badge shows remaining balance for partial payments
- **Member names**: Shows member name instead of just ID
- **Download button**: One-click invoice download
- **Status colors**: 
  - Green = Paid
  - Yellow = Pending
  - Red = Failed

### Member Credentials Dialog
- Shows after successful registration
- Displays:
  - Member name
  - Email (username)
  - Password (with copy button)
- Copy buttons for easy sharing
- Warning to save credentials

## Troubleshooting

### Emails Not Sending
1. Check SMTP credentials in `.env`
2. For Gmail, use App Password, not regular password
3. Check backend logs for email errors
4. Test with: `python backend/email_service.py`

### Invoice Not Downloading
1. Check browser console for errors
2. Verify backend is running on port 8000
3. Check if reportlab is installed: `pip install reportlab`
4. Check backend logs for PDF generation errors

### Balance Not Updating
1. Verify SQL trigger was created
2. Check database logs
3. Manually run: `SELECT * FROM members WHERE balance_due > 0;`
4. Check if columns exist: `\d members` in psql

### Status Not Changing
1. Check trigger function is active
2. Verify status update logic in backend
3. Check member record: `SELECT status, balance_due FROM members WHERE id = 'member-id';`

## API Endpoints

### Create Member with Payment
```
POST /payments/with-member
Body: {
  full_name, email, phone, plan_id, start_date, end_date,
  amount, payment_method, payment_date, ...
}
Response: Payment record with member details
```

### Download Invoice
```
GET /api/invoices/payment/{payment_id}/download
Response: PDF file (application/pdf)
```

### Get Payments
```
GET /payments
Response: List of payments with balance info
```

## Database Schema

### Members Table (New Columns)
```sql
total_amount_due DECIMAL(10,2)  -- Total amount for plan
amount_paid DECIMAL(10,2)       -- Total paid so far
balance_due DECIMAL(10,2)       -- Remaining balance
```

### Payments Table (New Columns)
```sql
is_partial BOOLEAN              -- Is this a partial payment?
remaining_balance DECIMAL(10,2) -- Balance after this payment
payment_type TEXT               -- initial, partial, renewal, etc.
```

## Next Steps

1. **Test with real data**: Create test members with various payment scenarios
2. **Customize emails**: Edit `backend/email_service.py` to match your branding
3. **Configure invoice**: Update gym details in `.env` for invoices
4. **Add payment reminders**: Set up cron job to email members with balance due
5. **Create payment portal**: Allow members to make payments online

## Support

For issues or questions:
1. Check backend logs: `backend/server.py` output
2. Check browser console: F12 → Console tab
3. Review this guide
4. Check Supabase dashboard for data

---

**Last Updated**: December 2025
