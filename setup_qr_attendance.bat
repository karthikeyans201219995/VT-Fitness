@echo off
echo ============================================================
echo QR Attendance System Setup
echo ============================================================
echo.

echo Step 1: Installing Python dependencies...
cd backend
python -m pip install qrcode pillow
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

echo Step 2: Database Migration
echo ============================================================
echo Please run the following SQL in your Supabase SQL Editor:
echo https://app.supabase.com/project/aovfhvpzixctghtixchl/sql
echo.
type add_qr_code_column.sql
echo ============================================================
echo.
echo Press any key after you've run the SQL migration...
pause >nul
echo.

echo Step 3: Generating QR codes for existing members...
python generate_member_qr_codes.py
if %errorlevel% neq 0 (
    echo ERROR: Failed to generate QR codes
    pause
    exit /b 1
)
echo.

echo Step 4: Testing the system...
python test_qr_system.py
echo.

echo ============================================================
echo Setup Complete!
echo ============================================================
echo.
echo QR code images are saved in: backend\qr_codes\
echo.
echo Next steps:
echo 1. Print the QR codes for your members
echo 2. Open the frontend attendance page
echo 3. Click "Scan QR Code" button
echo 4. Use Manual Entry tab for barcode scanner
echo 5. Scan member QR codes to check in/out
echo.
echo Backend is running on: http://localhost:8000
echo Frontend should be on: http://localhost:3000
echo.
pause
