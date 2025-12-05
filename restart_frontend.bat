@echo off
echo ============================================================
echo Restarting Frontend (Fixing Port Issue)
echo ============================================================
echo.

echo Step 1: Stopping frontend process on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Killing process %%a
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo ✓ Frontend stopped

echo.
echo Step 2: Clearing cache...
cd frontend
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo ✓ Cache cleared
) else (
    echo ✓ No cache found
)

echo.
echo Step 3: Starting frontend with new configuration...
echo.
echo The frontend will start in a new window.
echo It will now connect to port 8000 (not 8001)
echo.
start "Frontend - Port 8000" cmd /k "npm start"

echo.
echo ============================================================
echo Frontend Restarting!
echo ============================================================
echo.
echo A new window opened with the frontend server.
echo Wait for it to compile, then refresh your browser.
echo.
echo The login should now work!
echo.
pause
