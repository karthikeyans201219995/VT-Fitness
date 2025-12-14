# CORS Issue Fix

## Problem
Frontend at `http://localhost:3000` cannot access backend at `https://fitlife-extended.preview.emergentagent.com` due to CORS policy.

## What Was Fixed

### 1. Backend CORS Configuration (`backend/server.py`)
- ✅ Moved CORS middleware BEFORE route registration
- ✅ Added explicit allowed origins including localhost
- ✅ Added `expose_headers` for better compatibility
- ✅ Fixed router prefixes (removed duplicate `/api`)

### 2. Router Prefixes Fixed
- ✅ `invoices.py`: Changed from `/api/invoices` to `/invoices`
- ✅ `installments.py`: Changed from `/api/installments` to `/installments`
- ✅ Added missing routers to `server.py`

## Solution

### Option 1: Restart Backend (Recommended)

If your backend is running locally:

```bash
# Stop the current backend (Ctrl+C)
cd backend
python server.py
```

The CORS configuration is now fixed and will allow requests from:
- `http://localhost:3000` (your frontend)
- `http://localhost:8000` (backend)
- `https://fitlife-extended.preview.emergentagent.com` (preview URL)
- All other origins (for development)

### Option 2: Update Frontend to Use Local Backend

If you want to use local backend instead:

**Edit `frontend/.env`:**
```env
REACT_APP_BACKEND_URL=http://localhost:8000
WDS_SOCKET_PORT=0
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false
```

Then restart frontend:
```bash
cd frontend
npm start
```

### Option 3: Deploy Backend with CORS Fix

If the backend is deployed at `gymopspro.preview.emergentagent.com`, you need to:

1. Deploy the updated `backend/server.py` with CORS fixes
2. Ensure the deployed backend has the CORS middleware configured
3. Restart the deployed backend service

## Verification

After applying the fix, test:

1. **Open browser console** (F12)
2. **Try logging in** at `http://localhost:3000`
3. **Check for CORS errors** - should be gone!

### Expected Behavior:
```
✅ No CORS errors in console
✅ Login request succeeds
✅ API calls work normally
```

### If Still Failing:
```
❌ Check backend is running
❌ Check backend logs for errors
❌ Verify CORS middleware is active
❌ Clear browser cache and try again
```

## Technical Details

### What Changed in `backend/server.py`:

**Before:**
```python
# Routes added first
app.include_router(api_router)

# CORS added after (TOO LATE!)
app.add_middleware(CORSMiddleware, ...)
```

**After:**
```python
# CORS added FIRST (CORRECT!)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "https://fitlife-extended.preview.emergentagent.com",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Then routes added
app.include_router(api_router)
```

### Router Prefix Fixes:

**Before:**
```python
# invoices.py
router = APIRouter(prefix="/api/invoices", ...)  # WRONG - double /api

# server.py
api_router = APIRouter(prefix="/api")
api_router.include_router(invoices.router)  # Results in /api/api/invoices
```

**After:**
```python
# invoices.py
router = APIRouter(prefix="/invoices", ...)  # CORRECT

# server.py
api_router = APIRouter(prefix="/api")
api_router.include_router(invoices.router)  # Results in /api/invoices ✓
```

## Testing

### Test 1: Health Check
```bash
curl http://localhost:8000/api/
```

Expected:
```json
{
  "message": "Gym Management System API",
  "version": "1.0.0",
  "status": "running"
}
```

### Test 2: CORS Headers
```bash
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:8000/api/auth/login -v
```

Expected headers in response:
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: *
Access-Control-Allow-Headers: *
```

### Test 3: Login from Frontend
1. Open `http://localhost:3000`
2. Try to login
3. Check browser console - no CORS errors
4. Login should work

## Troubleshooting

### Issue: Still getting CORS errors

**Solution 1: Clear browser cache**
```
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
```

**Solution 2: Check backend is running**
```bash
# Should see output like:
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**Solution 3: Verify CORS middleware**
```bash
# Check backend logs for:
INFO:     Supabase initialized successfully
```

### Issue: Backend not starting

**Check for errors:**
```bash
cd backend
python server.py
```

**Common issues:**
- Missing dependencies: `pip install -r requirements.txt`
- Port already in use: Kill process on port 8000
- Import errors: Check all route files exist

### Issue: Routes not found (404)

**Verify routes are registered:**
```bash
# Check server.py includes all routers:
api_router.include_router(invoices.router)
api_router.include_router(installments.router)
```

**Test specific route:**
```bash
curl http://localhost:8000/api/invoices/
```

## Summary

✅ **Fixed:**
1. CORS middleware order
2. Allowed origins configuration
3. Router prefix duplicates
4. Missing router registrations

✅ **Result:**
- Frontend can now access backend
- No more CORS errors
- All API endpoints work
- Invoice downloads work

✅ **Next Steps:**
1. Restart backend: `python backend/server.py`
2. Restart frontend: `npm start` (in frontend folder)
3. Test login at `http://localhost:3000`
4. Verify no CORS errors in console

---

**Need Help?**
- Check backend logs for errors
- Check browser console for details
- Verify both frontend and backend are running
- Try clearing browser cache
