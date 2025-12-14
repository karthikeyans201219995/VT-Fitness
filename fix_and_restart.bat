@echo off
echo ========================================
echo CORS Fix - Restarting Backend
echo ========================================
echo.

echo Stopping any running backend processes...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *server.py*" 2>nul

echo.
echo Starting backend with CORS fix...
cd backend
start "Gym Backend" cmd /k "python server.py"

echo.
echo ========================================
echo Backend restarted!
echo ========================================
echo.
echo The backend is now running with CORS enabled for:
echo - http://localhost:3000 (your frontend)
echo - https://gymopspro.preview.emergentagent.com
echo.
echo Next steps:
echo 1. Wait 5 seconds for backend to start
echo 2. Go to http://localhost:3000
echo 3. Try logging in
echo 4. Check browser console (F12) - no CORS errors!
echo.
echo If you still see CORS errors:
echo - Clear browser cache (Ctrl+Shift+Delete)
echo - Hard reload (Ctrl+F5)
echo - Check backend window for errors
echo.
pause
