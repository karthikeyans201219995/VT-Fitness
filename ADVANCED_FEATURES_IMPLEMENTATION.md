# Advanced Features Implementation Guide

## ✅ Completed Backend Implementation

### 1. Database Schema ✓
**File**: `/app/backend/advanced_features_schema.sql`

- **workout_plans** table - Store member workout plans
- **diet_plans** table - Store member nutrition plans  
- **equipment** table - Gym equipment inventory management
- **classes** table - Fitness class scheduling
- **class_bookings** table - Member class reservations
- **audit_logs** table - System activity tracking
- **2FA fields** added to members table

**To Apply**: Run this SQL script in your Supabase SQL Editor

### 2. Backend API Routes ✓

#### Workout Plans API (`/api/workout-plans`)
- `GET /` - List all workout plans (filtered by member/trainer/admin role)
- `GET /{plan_id}` - Get specific workout plan
- `POST /` - Create workout plan (trainer/admin only)
- `PUT /{plan_id}` - Update workout plan
- `DELETE /{plan_id}` - Delete workout plan (admin only)
- `GET /member/{member_id}/active` - Get active plans for member

#### Diet Plans API (`/api/diet-plans`)
- `GET /` - List all diet plans
- `GET /{plan_id}` - Get specific diet plan
- `POST /` - Create diet plan (trainer/admin only)
- `PUT /{plan_id}` - Update diet plan
- `DELETE /{plan_id}` - Delete diet plan (admin only)
- `GET /member/{member_id}/active` - Get active diet plans for member

#### Equipment API (`/api/equipment`)
- `GET /` - List all equipment
- `GET /{equipment_id}` - Get specific equipment
- `POST /` - Add equipment (admin only)
- `PUT /{equipment_id}` - Update equipment (admin only)
- `DELETE /{equipment_id}` - Delete equipment (admin only)
- `GET /stats/summary` - Equipment statistics

#### Classes API (`/api/classes`)
- `GET /` - List all classes
- `GET /{class_id}` - Get specific class
- `POST /` - Create class (admin/trainer)
- `PUT /{class_id}` - Update class
- `DELETE /{class_id}` - Delete class (admin only)
- `GET /{class_id}/bookings` - Get class bookings

#### Class Bookings API (`/api/class-bookings`)
- `GET /` - List all bookings
- `GET /{booking_id}` - Get specific booking
- `POST /` - Create booking (book a class)
- `PUT /{booking_id}` - Update booking (cancel, etc.)
- `DELETE /{booking_id}` - Delete booking (admin only)
- `GET /member/{member_id}/upcoming` - Get upcoming bookings

#### Audit Logs API (`/api/audit-logs`)
- `GET /` - Get audit logs (admin only)
- `GET /stats` - Get audit statistics
- `GET /entity/{entity_type}/{entity_id}` - Get entity history

#### Export API (`/api/export`)
- `GET /members?format=csv|excel` - Export members
- `GET /payments?format=csv|excel` - Export payments
- `GET /attendance?format=csv|excel` - Export attendance
- `GET /classes?format=csv|excel` - Export classes
- `GET /equipment?format=csv|excel` - Export equipment

#### 2FA API (`/api/2fa`)
- `POST /send-otp` - Send OTP to phone
- `POST /verify-otp` - Verify OTP code
- `POST /enable` - Enable 2FA
- `POST /disable` - Disable 2FA
- `GET /status` - Get 2FA status

#### Enhanced Charts API (`/api/reports/charts/`)
- `GET /revenue-trend?days=30` - Revenue trend data
- `GET /attendance-trend?days=30` - Attendance trend data
- `GET /member-growth?months=12` - Member growth over time
- `GET /class-popularity` - Most popular classes
- `GET /payment-methods` - Payment methods distribution

### 3. Audit Logging ✓
All CRUD operations automatically log to `audit_logs` table with:
- User information
- Action type (CREATE, UPDATE, DELETE)
- Entity type and ID
- Before/after changes
- IP address and user agent
- Timestamp

### 4. Export Functionality ✓
Supports CSV and Excel export for:
- Members data
- Payment records
- Attendance logs
- Class schedules
- Equipment inventory

**Dependencies Added**: `openpyxl`, `pandas`

---

## 🔧 Frontend Implementation TODO

### Phase 1: Charts & Visualizations
**Location**: `/app/frontend/src/components/`

**Library**: `recharts` (already installed ✓)

#### Components to Create:
1. **Dashboard Charts** (`Dashboard/DashboardCharts.jsx`)
   - Revenue trend line chart
   - Attendance trend bar chart
   - Member growth area chart
   - Quick stats cards

2. **Reports Page** (`Reports/ReportsPage.jsx`)
   - Interactive chart filters
   - Multiple chart types
   - Export functionality
   - Date range selectors

3. **Analytics Dashboard** (`Analytics/`)
   - Class popularity pie chart
   - Payment methods distribution
   - Equipment status overview

### Phase 2: Member Portal
**Location**: `/app/frontend/src/components/MemberPortal/`

#### Components to Create:
1. **MemberDashboard.jsx** - Simplified dashboard for members
2. **MyMembership.jsx** - View membership status & payment history
3. **MyClasses.jsx** - Book and view class schedule
4. **MyFitness.jsx** - View assigned workout/diet plans
5. **Profile2FA.jsx** - Setup 2FA authentication

### Phase 3: Admin Features
**Location**: Various component directories

#### Components to Create:
1. **WorkoutPlans/** 
   - `WorkoutPlansList.jsx`
   - `CreateWorkoutPlan.jsx`
   - `WorkoutPlanDetails.jsx`

2. **DietPlans/**
   - `DietPlansList.jsx`
   - `CreateDietPlan.jsx`
   - `DietPlanDetails.jsx`

3. **Equipment/**
   - `EquipmentList.jsx`
   - `AddEquipment.jsx`
   - `EquipmentDetails.jsx`

4. **Classes/**
   - `ClassSchedule.jsx`
   - `CreateClass.jsx`
   - `ClassBookings.jsx`

5. **AuditLogs/**
   - `AuditLogViewer.jsx`
   - `AuditLogFilters.jsx`

### Phase 4: Enhanced Member Details
**Location**: `/app/frontend/src/components/Members/`

#### Updates Needed:
- Add "Assign Workout Plan" button in MemberDetails
- Add "Assign Diet Plan" button in MemberDetails
- Show active plans in member profile
- Link to full plan details

---

## 📧 Supabase Edge Functions Setup

### Email Notification Function
**File**: `supabase/functions/send-email/index.ts`

**Purpose**: Send email notifications via SendGrid

**Use Cases**:
- Membership expiry reminders
- Payment confirmations
- Class booking confirmations
- General announcements

### SMS Notification Function
**File**: `supabase/functions/send-sms/index.ts`

**Purpose**: Send SMS notifications via Twilio (for 2FA OTP)

**Use Cases**:
- 2FA OTP codes
- Class reminders
- Payment reminders
- Urgent notifications

**Setup Guide**: See `/app/backend/supabase_edge_functions_setup.md`

### Required Environment Variables:
```bash
# For SendGrid Email
SENDGRID_API_KEY=your_key_here
FROM_EMAIL=noreply@yourdomain.com

# For Twilio SMS
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 🔐 2FA Authentication Flow

### Setup Process:
1. User enters phone number
2. System sends OTP via SMS (Supabase Edge Function)
3. User verifies OTP
4. Phone number marked as verified
5. User enables 2FA

### Login with 2FA:
1. User enters email/password
2. System sends OTP to verified phone
3. User enters OTP
4. Access granted

**Note**: Currently using in-memory storage for OTPs (development). For production, use Redis or database.

---

## 📊 Export Functionality

### Supported Formats:
- CSV (text/csv)
- Excel (.xlsx via openpyxl)

### Export Endpoints:
```javascript
// Export members
GET /api/export/members?format=csv
GET /api/export/members?format=excel

// Export payments (with date range)
GET /api/export/payments?start_date=2024-01-01&end_date=2024-12-31&format=excel

// Export attendance
GET /api/export/attendance?start_date=2024-01-01&format=csv

// Export classes
GET /api/export/classes?format=excel

// Export equipment
GET /api/export/equipment?format=csv
```

### Frontend Implementation:
```javascript
const exportData = async (type, format) => {
  const response = await api.get(`/api/export/${type}?format=${format}`, {
    responseType: 'blob'
  });
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${type}_${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
```

---

## 🎨 Chart Implementation Examples

### Revenue Trend Chart (using Recharts):
```javascript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const RevenueTrendChart = () => {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      const response = await api.get('/api/reports/charts/revenue-trend?days=30');
      setData(response.data.data);
    };
    fetchData();
  }, []);
  
  return (
    <LineChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
    </LineChart>
  );
};
```

### Attendance Trend Chart:
```javascript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const AttendanceTrendChart = () => {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      const response = await api.get('/api/reports/charts/attendance-trend?days=30');
      setData(response.data.data);
    };
    fetchData();
  }, []);
  
  return (
    <BarChart width={600} height={300} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="attendance" fill="#82ca9d" />
    </BarChart>
  );
};
```

### Class Popularity Pie Chart:
```javascript
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const ClassPopularityChart = () => {
  const [data, setData] = useState([]);
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  useEffect(() => {
    const fetchData = async () => {
      const response = await api.get('/api/reports/charts/class-popularity');
      setData(response.data.data);
    };
    fetchData();
  }, []);
  
  return (
    <PieChart width={400} height={400}>
      <Pie
        data={data}
        dataKey="bookings"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={100}
        label
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  );
};
```

---

## 🚀 Next Steps

### Immediate:
1. ✅ Run the SQL schema in Supabase
2. ✅ Backend APIs tested and working
3. 🔄 Create frontend components for new features
4. 🔄 Setup Supabase Edge Functions
5. 🔄 Test complete flows

### Frontend Priority Order:
1. **Charts & Visualizations** - Enhance existing dashboard
2. **Member Portal** - Create self-service interface
3. **Workout/Diet Plans** - Trainer features
4. **Equipment Management** - Admin features
5. **Class Scheduling** - Member booking system
6. **2FA Setup** - Security feature
7. **Export Buttons** - Add to all list views
8. **Audit Log Viewer** - Admin monitoring

---

## 📝 Testing Checklist

### Backend Testing:
- [ ] Create workout plan
- [ ] Create diet plan
- [ ] Add equipment
- [ ] Create class
- [ ] Book class (as member)
- [ ] Export data (CSV/Excel)
- [ ] Send/verify 2FA OTP
- [ ] View audit logs
- [ ] Fetch chart data

### Frontend Testing (Once Built):
- [ ] Dashboard charts display correctly
- [ ] Member can book classes
- [ ] Member can view their plans
- [ ] Export functionality works
- [ ] 2FA setup flow works
- [ ] Charts update with real data
- [ ] Mobile responsiveness

---

## 🔒 Security Considerations

1. **RLS Policies**: All tables have Row Level Security enabled
2. **Role-Based Access**: APIs check user roles (admin, trainer, member)
3. **2FA**: SMS OTP for additional security
4. **Audit Logs**: Track all system changes
5. **Sensitive Data**: Excluded from exports (passwords, secrets)

---

## 📦 Dependencies Added

### Backend:
- `openpyxl>=3.1.0` - Excel file generation

### Frontend:
- `recharts` (already installed) - Chart library

---

## 🎯 Feature Status

| Feature | Backend | Frontend | Status |
|---------|---------|----------|--------|
| Workout Plans | ✅ | ⏳ | Backend Complete |
| Diet Plans | ✅ | ⏳ | Backend Complete |
| Equipment | ✅ | ⏳ | Backend Complete |
| Class Scheduling | ✅ | ⏳ | Backend Complete |
| Class Bookings | ✅ | ⏳ | Backend Complete |
| Audit Logs | ✅ | ⏳ | Backend Complete |
| Export CSV/Excel | ✅ | ⏳ | Backend Complete |
| 2FA (SMS OTP) | ✅ | ⏳ | Backend Complete |
| Charts/Graphs | ✅ | ⏳ | Data APIs Ready |
| Member Portal | ⏳ | ⏳ | Not Started |
| Email Notifications | 📝 | N/A | Needs Edge Function |
| SMS Notifications | 📝 | N/A | Needs Edge Function |

**Legend**: ✅ Complete | ⏳ In Progress | 📝 Documented | ❌ Not Started

---

## 💡 Tips

1. **Database First**: Always run the SQL schema before using the APIs
2. **Test with Postman**: Test each endpoint before building UI
3. **Edge Functions**: Deploy separately to Supabase
4. **Environment Variables**: Don't forget to set SMS/Email credentials
5. **RLS Policies**: Ensure proper authentication headers in requests

---

## 📞 Support

For issues or questions:
1. Check Supabase logs for edge function errors
2. Check browser console for frontend errors
3. Check backend logs at `/var/log/supervisor/backend.*.log`
4. Verify environment variables are set correctly
5. Ensure database schema is applied

---

**Last Updated**: December 2024
**Version**: 1.0.0
