# Balance Tracking System Setup

## Overview
This system tracks member payment balances, partial payments, and plan changes.

## Database Setup

1. **Run the SQL migration** in your Supabase SQL Editor:
   ```bash
   # Execute the file: backend/add_payment_tracking.sql
   ```

This adds:
- `total_amount_due`, `amount_paid`, `balance_due` columns to members table
- `previous_plan_id`, `plan_changed_at` columns for plan change tracking
- `is_partial`, `remaining_balance`, `payment_type` columns to payments table
- Automatic balance update trigger
- View for members with outstanding balances

## Features

### For Admins:
1. **Balance Management Page** (`/balance`)
   - View all members with outstanding balances
   - See total due, paid, and balance amounts
   - Collection rate percentage
   - Record partial payments
   - Track payment history

2. **Payment Types**:
   - `initial` - First payment when joining
   - `renewal` - Plan renewal payment
   - `upgrade` - Plan upgrade payment
   - `partial` - Partial payment towards balance
   - `balance_clearance` - Final payment clearing balance

### For Members:
1. **Balance Display** (on Plans page)
   - Total amount due
   - Amount paid so far
   - Outstanding balance
   - Warning if balance is due

2. **Plan Upgrade Tracking**:
   - Previous plan is saved
   - New plan cost is added to balance
   - Plan change timestamp recorded
   - Payment history shows upgrade details

## How It Works

### When a Member Upgrades Plan:
1. Old plan ID is saved in `previous_plan_id`
2. New plan cost is added to `total_amount_due`
3. Balance is updated: `balance_due = total_amount_due - amount_paid`
4. Payment record created with type `upgrade`
5. Plan change timestamp recorded

### When Admin Records Partial Payment:
1. Payment amount is added to `amount_paid`
2. Balance is recalculated automatically
3. Payment marked as `partial` if balance remains
4. Payment marked as `balance_clearance` if fully paid

### Automatic Balance Updates:
- Database trigger automatically updates member balance when payment is inserted
- No manual calculation needed

## API Endpoints

### Balance Management:
- `GET /api/balance/members-with-balance` - Get all members with outstanding balance
- `GET /api/balance/member/{member_id}` - Get specific member's balance
- `POST /api/balance/record-partial-payment` - Record a partial payment
- `GET /api/balance/summary` - Get overall balance summary

## Usage Examples

### Admin Records Partial Payment:
```javascript
await balanceAPI.recordPartialPayment({
  member_id: "member-uuid",
  amount: 1000,
  payment_method: "cash",
  payment_date: "2025-12-06",
  description: "Partial payment",
  status: "completed",
  payment_type: "partial",
  is_partial: true
});
```

### Member Upgrades Plan:
```javascript
await membersAPI.update(memberId, {
  previous_plan_id: currentPlanId,
  plan_id: newPlanId,
  plan_changed_at: new Date().toISOString(),
  total_amount_due: currentDue + newPlanPrice,
  balance_due: currentBalance + newPlanPrice
});
```

## Benefits

1. **Complete Payment Tracking** - Never lose track of who owes what
2. **Partial Payment Support** - Members can pay in installments
3. **Plan Change History** - Know what plan member had before
4. **Automated Calculations** - Database handles balance updates
5. **Admin Dashboard** - Quick overview of all outstanding balances
6. **Member Transparency** - Members see their balance clearly

## Notes

- Balance is automatically calculated when payments are made
- Members cannot make payments themselves (admin only)
- Plan upgrades add to existing balance (not replace)
- All monetary values stored as DECIMAL(10,2) for precision
