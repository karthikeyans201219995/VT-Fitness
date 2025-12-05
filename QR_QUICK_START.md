# QR Attendance System - Quick Start Guide

## ✅ What's Been Done

1. ✓ Backend QR attendance API created
2. ✓ Frontend QR scanner integrated
3. ✓ Python dependencies installed (qrcode, pillow)
4. ✓ Backend server restarted on port 8000

## 🚀 Quick Setup (3 Steps)

### Step 1: Run Database Migration

Copy and run this SQL in your Supabase SQL Editor:
👉 https://app.supabase.com/project/aovfhvpzixctghtixchl/sql

```sql
-- Add QR code column to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE;

-- Create index for faster QR code lookups
CREATE INDEX IF NOT EXISTS idx_members_qr_code ON members(qr_code);
```

### Step 2: Generate QR Codes for Members

```bash
cd backend
python generate_member_qr_codes.py
```

This will:
- Generate unique QR codes for all members
- Save QR code images to `backend/qr_codes/` folder
- Print QR codes for distribution

### Step 3: Test the System

```bash
cd backend
python test_qr_system.py
```

This will test:
- QR code generation
- Check-in functionality
- Check-out functionality
- Status checking

## 📱 Using the System

### For Staff (At Gym Entrance):

1. Open frontend: http://localhost:3000
2. Go to **Attendance** page
3. Click **"Scan QR Code"** button
4. Choose scanning method:
   - **Camera Scan**: Use device camera
   - **Manual Entry**: Use barcode scanner (recommended)

### For Barcode Scanner Setup:

1. Connect USB barcode scanner
2. Configure scanner to add "Enter" after scan
3. Open Manual Entry tab
4. Focus on the input field
5. Scan member QR codes

### Member Check-in/Check-out Flow:

```
First Scan → Check In  ✓
Second Scan (same day) → Check Out ✓
```

## 🖨️ Printing QR Codes

QR code images are saved in: `backend/qr_codes/`

**Options:**
1. **Member Cards**: Print on plastic cards
2. **Key Tags**: Print on key chain tags
3. **Stickers**: Print on adhesive labels
4. **Mobile**: Send QR image to member's phone

**Recommended Size**: 2x2 inches (5x5 cm)

## 🔧 API Endpoints

### Generate QR Code
```bash
POST http://localhost:8000/api/qr-attendance/generate/{member_id}
```

### Scan QR Code (Check In/Out)
```bash
POST http://localhost:8000/api/qr-attendance/scan
Body: {"qr_code": "GYM-xxx-xxx"}
```

### Check Member Status
```bash
GET http://localhost:8000/api/qr-attendance/status/{member_id}
```

### Regenerate QR Code
```bash
POST http://localhost:8000/api/qr-attendance/regenerate/{member_id}
```

## 🧪 Testing with Manual Entry

1. Generate QR code for a member
2. Copy the QR code value (e.g., `GYM-123-abc`)
3. Paste into Manual Entry field
4. Click "Scan QR Code"
5. Verify check-in is recorded
6. Scan again to test check-out

## 📊 Viewing Attendance

- Go to **Attendance** page
- See real-time check-ins
- Filter by member name
- View who's currently in the gym
- See check-in/check-out times

## ⚠️ Troubleshooting

### "Invalid QR code or member not found"
- Run Step 2 to generate QR codes
- Verify member exists in database
- Check member status is "active"

### "Member status is inactive"
- Only active members can check in
- Update member status to "active"

### Backend not responding
- Check backend is running: http://localhost:8000/api/
- Restart: `cd backend && python -m uvicorn server:app --reload --port 8000`

### QR codes not generating
- Verify Supabase connection
- Check .env file has correct credentials
- Run database migration (Step 1)

## 🎯 Next Steps

1. ✅ Run database migration
2. ✅ Generate QR codes for all members
3. ✅ Test with one member
4. 🖨️ Print QR codes
5. 📱 Distribute to members
6. 🚀 Start using at gym entrance!

## 📞 Support

If you encounter issues:
1. Check backend logs
2. Check browser console
3. Verify Supabase connection
4. Run test script: `python test_qr_system.py`

---

**System Status:**
- ✅ Backend: Running on port 8000
- ✅ Dependencies: Installed
- ⏳ Database: Needs migration (Step 1)
- ⏳ QR Codes: Need generation (Step 2)
