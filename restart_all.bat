@echo off
echo ============================================================
echo Restarting Frontend and Backend
echo ============================================================
echo.

echo This will:
echo 1. Stop any running processes
echo 2. Clear frontend cache
echo 3. Start backend on port 8000
echo 4. Start frontend on port 3000
echo.
echo Press Ctrl+C to cancel, or
pause

echo.
echo Step 1: Clearing frontend cache...
cd frontend
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo ✓ Cache cleared
) else (
    echo ✓ No cache to clear
)

echo.
echo Step 2: Starting backend on port 8000...
cd ..\backend
start "Backend Server" cmd /k "python -m uvicorn server:app --reload --port 8000"
timeout /t 3 /nobreak >nul
echo ✓ Backend started

echo.
echo Step 3: Starting frontend on port 3000...
cd ..\frontend
start "Frontend Server" cmd /k "npm start"
echo ✓ Frontend starting...

echo.
echo ============================================================
echo Servers Starting!
echo ============================================================
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000 (will open automatically)
echo.
echo Two new windows will open:
echo - Backend Server (Python)
echo - Frontend Server (React)
echo.
echo Close those windows to stop the servers.
echo.
pause
