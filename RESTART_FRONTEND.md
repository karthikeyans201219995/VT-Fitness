# Frontend Restart Required

## Issue Fixed
Changed backend port from 8001 to 8000 in:
- `frontend/.env`
- `frontend/src/services/api.js`

## Restart Frontend

### Option 1: If frontend is running in a terminal
1. Press `Ctrl+C` to stop it
2. Run: `npm start` or `yarn start`

### Option 2: Start fresh
```bash
cd frontend
npm start
```

The frontend will now connect to the correct backend port (8000).

## Verify Connection
After restart, you should be able to:
- ✅ Login successfully
- ✅ See dashboard
- ✅ Access all features
- ✅ Use QR attendance scanner

## Backend Status
✅ Backend is running on: http://localhost:8000
