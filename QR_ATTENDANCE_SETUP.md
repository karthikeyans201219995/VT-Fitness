# QR Code Attendance System Setup Guide

## Overview
The QR code attendance system allows members to check in and check out by scanning their unique QR codes. Each member gets a unique QR code that can be scanned using a barcode scanner or camera.

## Backend Setup

### 1. Install Required Dependencies
```bash
cd backend
pip install -r requirements.txt
```

The following packages are required:
- `qrcode>=7.4.2` - For QR code generation
- `pillow>=10.0.0` - For image processing

### 2. Update Database Schema
Run the SQL migration to add QR code support:

```sql
-- Run this in your Supabase SQL Editor
ALTER TABLE members ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_members_qr_code ON members(qr_code);
```

Or use the provided migration file:
```bash
# Execute the SQL file in Supabase
cat backend/add_qr_code_column.sql
```

### 3. Start the Backend Server
```bash
cd backend
python server.py
```

The server will run on `http://localhost:8000`

## API Endpoints

### Generate QR Code for Member
```
POST /api/qr-attendance/generate/{member_id}
```
Generates a unique QR code for a member and returns both the code and image.

**Response:**
```json
{
  "member_id": "uuid",
  "member_name": "John Doe",
  "qr_code": "GYM-uuid-random",
  "qr_image": "data:image/png;base64,..."
}
```

### Scan QR Code (Check In/Out)
```
POST /api/qr-attendance/scan
```

**Request Body:**
```json
{
  "qr_code": "GYM-uuid-random",
  "notes": "Optional notes"
}
```

**Response:**
```json
{
  "success": true,
  "action": "check_in",  // or "check_out"
  "member_name": "John Doe",
  "member_id": "uuid",
  "timestamp": "2024-01-01T10:00:00",
  "message": "John Doe checked in successfully",
  "attendance_id": "attendance-uuid"
}
```

### Get Member Attendance Status
```
GET /api/qr-attendance/status/{member_id}
```
Returns whether the member is currently checked in.

### Regenerate QR Code
```
POST /api/qr-attendance/regenerate/{member_id}
```
Generates a new QR code for a member (useful if QR code is lost or stolen).

## Frontend Setup

### 1. Install Dependencies
The frontend already has the required dependencies installed.

### 2. QR Scanner Component
The QR scanner is integrated into the Attendance Tracker page with two modes:

1. **Camera Scan**: Use device camera to scan QR codes
2. **Manual Entry**: Use a barcode scanner or paste QR code

### 3. Access the Scanner
Navigate to the Attendance page and click "Scan QR Code" button.

## How It Works

### For Administrators:

1. **Generate QR Codes**:
   - Go to Members page
   - Click on a member
   - Generate their QR code
   - Print or send the QR code to the member

2. **Set Up Scanner Station**:
   - Open the Attendance page
   - Click "Scan QR Code"
   - Use the Manual Entry tab for barcode scanners
   - Keep the page open at the gym entrance

### For Members:

1. **Check In**:
   - Scan your QR code at the entrance
   - System records check-in time
   - You'll see a success message

2. **Check Out**:
   - Scan the same QR code when leaving
   - System records check-out time
   - You'll see a checkout confirmation

### Business Logic:

- **First scan of the day**: Creates a check-in record
- **Second scan (same day)**: Updates the record with check-out time
- **Only active members** can check in
- **One active check-in** per member per day
- **Automatic validation** of member status

## Hardware Recommendations

### Barcode Scanners:
- USB barcode scanners work best (plug and play)
- Configure scanner to add "Enter" after scan
- Scanner acts as keyboard input
- Recommended: 2D scanners for better QR code reading

### Tablets/Devices:
- Any device with a camera can scan QR codes
- Tablets work well for entrance stations
- Mount at comfortable scanning height

## QR Code Format

QR codes follow this format:
```
GYM-{member_id}-{random_suffix}
```

Example: `GYM-123e4567-e89b-12d3-a456-426614174000-a1b2c3d4`

## Security Features

- **Unique codes**: Each member has a unique QR code
- **Regeneration**: Codes can be regenerated if compromised
- **Status validation**: Only active members can check in
- **Audit trail**: All scans are logged with timestamps

## Troubleshooting

### QR Code Not Scanning:
- Ensure QR code is generated for the member
- Check member status is "active"
- Verify backend server is running
- Check network connectivity

### Camera Not Working:
- Allow camera permissions in browser
- Use HTTPS or localhost
- Try manual entry mode instead

### Member Can't Check In:
- Verify member status is "active"
- Check membership hasn't expired
- Ensure QR code is valid

## Testing

### Test the System:
1. Generate QR code for a test member
2. Copy the QR code value
3. Paste into manual entry field
4. Verify check-in is recorded
5. Scan again to test check-out

### API Testing:
```bash
# Generate QR code
curl -X POST http://localhost:8000/api/qr-attendance/generate/{member_id}

# Scan QR code
curl -X POST http://localhost:8000/api/qr-attendance/scan \
  -H "Content-Type: application/json" \
  -d '{"qr_code": "GYM-uuid-random"}'
```

## Next Steps

1. Run the database migration
2. Install Python dependencies
3. Start the backend server
4. Generate QR codes for existing members
5. Print QR codes or add to member cards
6. Set up scanner station at gym entrance
7. Train staff on the system

## Support

For issues or questions:
- Check the backend logs for errors
- Verify Supabase connection
- Ensure all dependencies are installed
- Check browser console for frontend errors
