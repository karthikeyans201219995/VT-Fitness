# Quick Start: Payment Balance System

## 🚀 3-Step Setup

### Step 1: Database (2 minutes)
1. Open Supabase Dashboard → SQL Editor
2. Copy all content from `backend/add_payment_tracking.sql`
3. Paste and click "Run"
4. ✅ Done!

### Step 2: Email Config (1 minute)
Add to `backend/.env`:
```env
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
MEMBER_PORTAL_URL=http://localhost:3000/login
GYM_NAME=Your Gym Name
```

**Gmail App Password**: https://myaccount.google.com/apppasswords

### Step 3: Install & Run
```bash
# Install dependency
cd backend
pip install reportlab

# Start backend
python server.py

# Start frontend (new terminal)
cd frontend
npm start
```

## ✨ What's New

### 1. Automatic Balance Tracking
- **Total Due**: Auto-filled from plan price
- **Amount Paid**: What member pays now
- **Balance**: Automatically calculated
- **Status**: Auto-updates based on balance

### 2. Partial Payments
- Pay less than full amount
- Status = "Inactive" until fully paid
- Balance shown in yellow badge
- Can make multiple payments

### 3. Invoice Download
- Click download button → Get PDF
- Includes GST breakdown
- Professional formatting
- Auto-generated if not exists

### 4. Email Notifications
- Welcome email with credentials
- Direct link to member portal
- Shows balance if partial payment
- Professional HTML design

## 📝 How to Use

### Add Member with Payment:
1. Go to **Payments** page
2. Click **"Add Payment"**
3. Fill member details
4. Select plan (amount auto-fills)
5. Enter payment amount
   - Full amount → Status: Active ✅
   - Partial → Status: Inactive ⚠️
6. Click **"Add Member & Record Payment"**
7. ✅ Member created, email sent!

### Download Invoice:
1. Find payment in list
2. Click **download icon** 📥
3. PDF downloads automatically

### Check Balance:
- Payment form shows live balance preview
- Payment list shows balance badges
- Member profile shows total/paid/balance

## 🎯 Testing

### Test Case 1: Full Payment
```
Plan: Basic ($50)
Payment: $50
Result: Status = Active, Balance = $0
```

### Test Case 2: Partial Payment
```
Plan: Premium ($100)
Payment: $60
Result: Status = Inactive, Balance = $40
```

### Test Case 3: Additional Payment
```
Previous Balance: $40
New Payment: $40
Result: Status → Active, Balance = $0
```

## 🔧 Troubleshooting

### Email Not Sending?
- Check SMTP credentials in `.env`
- Use Gmail App Password (not regular password)
- Check backend logs for errors

### Invoice Not Downloading?
- Check browser console (F12)
- Verify backend is running
- Check if reportlab installed

### Balance Not Updating?
- Verify SQL trigger was created
- Check Supabase logs
- Restart backend

## 📊 UI Features

### Payment Form:
- ✅ Auto-calculate end date from plan
- ✅ Auto-fill amount from plan price
- ✅ Live balance preview
- ✅ Color-coded warnings
- ✅ Status explanation

### Payment List:
- ✅ Member names (not just IDs)
- ✅ Balance badges for partial payments
- ✅ One-click invoice download
- ✅ Payment type indicators

### Credentials Dialog:
- ✅ Shows after registration
- ✅ Copy buttons for email/password
- ✅ Warning to save credentials

## 📚 Documentation

- **Full Guide**: `PAYMENT_BALANCE_SETUP.md`
- **Changes**: `PAYMENT_SYSTEM_CHANGES.md`
- **SQL**: `backend/add_payment_tracking.sql`

## 🆘 Need Help?

1. Check backend logs
2. Check browser console (F12)
3. Review `PAYMENT_BALANCE_SETUP.md`
4. Check Supabase dashboard

## ✅ Checklist

- [ ] SQL applied in Supabase
- [ ] Email configured in `.env`
- [ ] reportlab installed
- [ ] Backend running
- [ ] Frontend running
- [ ] Test member created
- [ ] Email received
- [ ] Invoice downloaded

---

**Ready to go!** 🎉

Start by running: `setup_payment_balance.bat`
