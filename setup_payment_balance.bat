@echo off
echo ========================================
echo Payment Balance Tracking Setup
echo ========================================
echo.

echo Step 1: Installing Python dependencies...
cd backend
pip install reportlab
echo.

echo Step 2: Database Setup Required
echo ========================================
echo IMPORTANT: You need to run SQL manually in Supabase
echo.
echo 1. Open your Supabase Dashboard
echo 2. Go to SQL Editor
echo 3. Copy contents from: backend\add_payment_tracking.sql
echo 4. Paste and Run in SQL Editor
echo.
echo Press any key after you've completed the SQL setup...
pause > nul
echo.

echo Step 3: Email Configuration
echo ========================================
echo Please update backend\.env with your email settings:
echo.
echo SMTP_SERVER=smtp.gmail.com
echo SMTP_PORT=587
echo SMTP_USERNAME=your-email@gmail.com
echo SMTP_PASSWORD=your-app-password
echo FROM_EMAIL=your-email@gmail.com
echo GYM_NAME=Your Gym Name
echo MEMBER_PORTAL_URL=http://localhost:3000/login
echo.
echo For Gmail App Password: https://myaccount.google.com/apppasswords
echo.
echo Press any key after you've updated .env...
pause > nul
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start backend: cd backend ^&^& python server.py
echo 2. Start frontend: cd frontend ^&^& npm start
echo 3. Test by adding a new member with payment
echo.
echo For detailed instructions, see: PAYMENT_BALANCE_SETUP.md
echo.
pause
