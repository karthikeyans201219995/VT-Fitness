# Supabase Setup Instructions for Gym Management System

This document provides step-by-step instructions for setting up Supabase as the backend for your Gym Management System.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Access to your backend `.env` file

---

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in the project details:
   - **Project Name**: Choose any name (e.g., "GymManagementSystem")
   - **Database Password**: Create a strong password (save it securely)
   - **Region**: Choose the region closest to your users
4. Click "Create new project"
5. Wait for the project to be created (this may take 1-2 minutes)

---

## Step 2: Get Your Supabase Credentials

Once your project is created:

1. Go to **Project Settings** (gear icon in the sidebar)
2. Navigate to **API** section
3. You'll find the following credentials:

   ### Project URL
   - Look for "Project URL"
   - Example: `https://abcdefghijklmnop.supabase.co`
   - Copy this value

   ### API Keys
   - **anon/public key**: Look for "Project API keys" → "anon public"
     - This is safe to use in your frontend
   - **service_role key**: Look for "Project API keys" → "service_role"
     - ⚠️ This key has admin privileges - keep it secret!

   ### JWT Secret
   - Look for "JWT Settings" → "JWT Secret"
   - Copy this value

---

## Step 3: Update Backend Environment Variables

1. Open the file: `/app/backend/.env`

2. Replace the placeholder values with your actual Supabase credentials:

```env
# Supabase Configuration
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_KEY="your-service-role-key-here"
SUPABASE_JWT_SECRET="your-jwt-secret-here"
```

3. Save the file

---

## Step 4: Create Database Tables

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `/app/backend/supabase_schema.sql` file
5. Paste it into the SQL Editor
6. Click **Run** to execute the SQL script

This will create:
- ✅ All necessary tables (users, members, plans, attendance, payments, settings)
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance
- ✅ Triggers for automatic status updates
- ✅ Default settings record

---

## Step 5: Configure Authentication

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Under **Auth Providers**, ensure **Email** is enabled
3. Configure email settings:
   - **Enable Email Confirmations**: You can disable this for testing
   - **Secure Email Change**: Recommended to keep enabled

---

## Step 6: Restart Backend Server

After updating the environment variables:

1. Restart the backend server:
   ```bash
   sudo supervisorctl restart backend
   ```

2. Check if Supabase is configured correctly:
   ```bash
   curl http://localhost:8001/api/auth/check-config
   ```

   You should see:
   ```json
   {
     "configured": true,
     "message": "Supabase is configured and ready"
   }
   ```

---

## Step 7: Verify Setup

### Test Authentication Endpoints

1. **Signup a new user**:
   ```bash
   curl -X POST http://localhost:8001/api/auth/signup \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@gym.com",
       "password": "SecurePassword123!",
       "full_name": "Admin User",
       "phone": "1234567890",
       "role": "admin"
     }'
   ```

2. **Login**:
   ```bash
   curl -X POST http://localhost:8001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@gym.com",
       "password": "SecurePassword123!"
     }'
   ```

   Save the `access_token` from the response for subsequent requests.

---

## Database Tables Created

The following tables will be created in your Supabase database:

| Table | Description |
|-------|-------------|
| `users` | User profiles (linked to Supabase Auth) |
| `plans` | Membership plans |
| `members` | Gym members information |
| `attendance` | Member check-in/check-out records |
| `payments` | Payment transactions |
| `settings` | Gym settings and configuration |

---

## Security Features

✅ **Row Level Security (RLS)**: All tables have RLS policies
- Members can only view their own data
- Admins can view and manage all data
- Trainers can view members and attendance

✅ **JWT Authentication**: Secure token-based authentication

✅ **Role-Based Access Control**: Three roles (admin, trainer, member)

---

## API Endpoints Available

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user profile
- `GET /api/auth/check-config` - Check Supabase configuration

### Members
- `POST /api/members` - Create new member
- `GET /api/members` - Get all members
- `GET /api/members/{id}` - Get member by ID
- `PUT /api/members/{id}` - Update member
- `DELETE /api/members/{id}` - Delete member

### Plans
- `POST /api/plans` - Create new plan
- `GET /api/plans` - Get all plans
- `GET /api/plans/{id}` - Get plan by ID
- `PUT /api/plans/{id}` - Update plan
- `DELETE /api/plans/{id}` - Delete plan

### Attendance
- `POST /api/attendance` - Create attendance record
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/{id}` - Get attendance by ID
- `PUT /api/attendance/{id}` - Update attendance (check-out)
- `DELETE /api/attendance/{id}` - Delete attendance

### Payments
- `POST /api/payments` - Create new payment
- `GET /api/payments` - Get all payments
- `GET /api/payments/{id}` - Get payment by ID
- `PUT /api/payments/{id}` - Update payment
- `DELETE /api/payments/{id}` - Delete payment

### Settings
- `GET /api/settings` - Get gym settings
- `PUT /api/settings` - Update gym settings

### Reports
- `GET /api/reports/dashboard` - Get dashboard statistics
- `GET /api/reports/revenue` - Get revenue report
- `GET /api/reports/attendance` - Get attendance report
- `GET /api/reports/members` - Get members statistics

---

## Troubleshooting

### Issue: "Supabase not configured" error

**Solution**: 
- Verify that you've updated the `.env` file with actual credentials (not placeholders)
- Restart the backend server: `sudo supervisorctl restart backend`
- Check backend logs: `tail -f /var/log/supervisor/backend.err.log`

### Issue: Authentication errors

**Solution**:
- Verify that the database tables were created successfully
- Check that RLS policies are enabled in Supabase
- Ensure JWT Secret matches in `.env` file

### Issue: "relation does not exist" errors

**Solution**:
- Run the SQL schema script again in Supabase SQL Editor
- Verify all tables were created in the correct schema (public)

---

## Next Steps

After setting up Supabase:

1. ✅ Backend is ready with all API endpoints
2. 🔄 Frontend needs to be updated to use real API calls (instead of mock data)
3. 🧪 Test all functionality with the testing agent
4. 🚀 Deploy the application

---

## Support

If you encounter any issues during setup:
1. Check the backend logs: `tail -f /var/log/supervisor/backend.err.log`
2. Verify Supabase project is active in the dashboard
3. Ensure all credentials are correctly copied (no extra spaces)

---

## Security Best Practices

⚠️ **Important Security Notes**:

1. **Never commit** the `.env` file to version control
2. **Keep service_role key secret** - it has admin privileges
3. **Use environment variables** for all sensitive data
4. **Enable email confirmations** in production
5. **Configure CORS** properly in production
6. **Use HTTPS** in production (Supabase handles this automatically)

---

**Congratulations!** 🎉 Your Supabase backend is now ready to use!
