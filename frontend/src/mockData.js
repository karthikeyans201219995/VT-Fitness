// Mock data for Gym Management Application

export const mockUsers = [
  {
    id: '1',
    email: 'admin@gymfit.com',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User',
    phone: '+1234567890'
  },
  {
    id: '2',
    email: 'trainer@gymfit.com',
    password: 'trainer123',
    role: 'trainer',
    name: 'John Trainer',
    phone: '+1234567891'
  },
  {
    id: '3',
    email: 'member@gymfit.com',
    password: 'member123',
    role: 'member',
    name: 'Sarah Member',
    phone: '+1234567892',
    memberId: 'GYM001',
    plan: 'Monthly Premium',
    validUntil: '2025-12-31',
    bloodGroup: 'O+',
    emergencyContact: '+1234567893'
  }
];

export const mockMembers = [
  {
    id: 'M001',
    memberId: 'GYM001',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    phone: '+1234567892',
    joinDate: '2024-01-15',
    plan: 'Monthly Premium',
    status: 'active',
    validUntil: '2025-12-31',
    bloodGroup: 'O+',
    emergencyContact: '+1234567893',
    address: '123 Fitness St, New York',
    age: 28,
    gender: 'Female',
    lastCheckIn: '2025-01-10'
  },
  {
    id: 'M002',
    memberId: 'GYM002',
    name: 'Michael Chen',
    email: 'michael@example.com',
    phone: '+1234567894',
    joinDate: '2024-03-20',
    plan: 'Quarterly Basic',
    status: 'active',
    validUntil: '2025-06-20',
    bloodGroup: 'A+',
    emergencyContact: '+1234567895',
    address: '456 Health Ave, Los Angeles',
    age: 35,
    gender: 'Male',
    lastCheckIn: '2025-01-12'
  },
  {
    id: 'M003',
    memberId: 'GYM003',
    name: 'Emma Wilson',
    email: 'emma@example.com',
    phone: '+1234567896',
    joinDate: '2023-11-10',
    plan: 'Annual Elite',
    status: 'active',
    validUntil: '2025-11-10',
    bloodGroup: 'B+',
    emergencyContact: '+1234567897',
    address: '789 Workout Blvd, Chicago',
    age: 24,
    gender: 'Female',
    lastCheckIn: '2025-01-11'
  },
  {
    id: 'M004',
    memberId: 'GYM004',
    name: 'David Martinez',
    email: 'david@example.com',
    phone: '+1234567898',
    joinDate: '2024-06-05',
    plan: 'Monthly Basic',
    status: 'expired',
    validUntil: '2024-12-05',
    bloodGroup: 'AB+',
    emergencyContact: '+1234567899',
    address: '321 Gym Lane, Houston',
    age: 42,
    gender: 'Male',
    lastCheckIn: '2024-12-01'
  }
];

export const mockPlans = [
  {
    id: 'P001',
    name: 'Monthly Basic',
    duration: '1 Month',
    price: 49,
    features: [
      'Access to gym equipment',
      'Locker facility',
      'Basic fitness assessment',
      'Mobile app access'
    ],
    popular: false
  },
  {
    id: 'P002',
    name: 'Monthly Premium',
    duration: '1 Month',
    price: 79,
    features: [
      'All Basic features',
      'Personal trainer sessions (2/month)',
      'Group classes',
      'Nutrition consultation',
      'Steam & Sauna access'
    ],
    popular: true
  },
  {
    id: 'P003',
    name: 'Quarterly Basic',
    duration: '3 Months',
    price: 129,
    features: [
      'Access to gym equipment',
      'Locker facility',
      'Basic fitness assessment',
      'Mobile app access',
      'Save 12% vs Monthly'
    ],
    popular: false
  },
  {
    id: 'P004',
    name: 'Quarterly Premium',
    duration: '3 Months',
    price: 209,
    features: [
      'All Premium features',
      'Personal trainer sessions (8/quarter)',
      'Advanced body composition analysis',
      'Guest passes (4/quarter)',
      'Save 15% vs Monthly'
    ],
    popular: false
  },
  {
    id: 'P005',
    name: 'Annual Basic',
    duration: '12 Months',
    price: 449,
    features: [
      'Access to gym equipment',
      'Locker facility',
      'Quarterly fitness assessment',
      'Mobile app access',
      'Save 25% vs Monthly'
    ],
    popular: false
  },
  {
    id: 'P006',
    name: 'Annual Elite',
    duration: '12 Months',
    price: 799,
    features: [
      'All Premium features',
      'Unlimited personal trainer sessions',
      'VIP locker',
      'Priority class booking',
      'Spa & massage (monthly)',
      'Guest passes (12/year)',
      'Save 30% vs Monthly'
    ],
    popular: true
  }
];

export const mockAttendance = [
  {
    id: 'A001',
    memberId: 'GYM001',
    memberName: 'Sarah Johnson',
    checkInTime: '2025-01-12T08:30:00',
    checkOutTime: '2025-01-12T10:15:00'
  },
  {
    id: 'A002',
    memberId: 'GYM002',
    memberName: 'Michael Chen',
    checkInTime: '2025-01-12T18:00:00',
    checkOutTime: '2025-01-12T19:45:00'
  },
  {
    id: 'A003',
    memberId: 'GYM003',
    memberName: 'Emma Wilson',
    checkInTime: '2025-01-12T06:00:00',
    checkOutTime: '2025-01-12T07:30:00'
  },
  {
    id: 'A004',
    memberId: 'GYM001',
    memberName: 'Sarah Johnson',
    checkInTime: '2025-01-11T08:00:00',
    checkOutTime: '2025-01-11T09:45:00'
  },
  {
    id: 'A005',
    memberId: 'GYM002',
    memberName: 'Michael Chen',
    checkInTime: '2025-01-11T17:30:00',
    checkOutTime: '2025-01-11T19:00:00'
  }
];

export const mockPayments = [
  {
    id: 'PAY001',
    memberId: 'GYM001',
    memberName: 'Sarah Johnson',
    amount: 79,
    plan: 'Monthly Premium',
    status: 'paid',
    paymentMethod: 'Credit Card',
    date: '2025-01-01',
    invoiceNo: 'INV-2025-001'
  },
  {
    id: 'PAY002',
    memberId: 'GYM002',
    memberName: 'Michael Chen',
    amount: 129,
    plan: 'Quarterly Basic',
    status: 'paid',
    paymentMethod: 'Debit Card',
    date: '2025-01-05',
    invoiceNo: 'INV-2025-002'
  },
  {
    id: 'PAY003',
    memberId: 'GYM003',
    memberName: 'Emma Wilson',
    amount: 799,
    plan: 'Annual Elite',
    status: 'paid',
    paymentMethod: 'Bank Transfer',
    date: '2024-11-10',
    invoiceNo: 'INV-2024-089'
  },
  {
    id: 'PAY004',
    memberId: 'GYM004',
    memberName: 'David Martinez',
    amount: 49,
    plan: 'Monthly Basic',
    status: 'pending',
    paymentMethod: 'Cash',
    date: '2025-01-10',
    invoiceNo: 'INV-2025-003'
  }
];

export const mockDashboardStats = {
  totalMembers: 156,
  activeMembers: 142,
  newMembersThisMonth: 12,
  totalRevenue: 12450,
  monthlyRevenue: 8930,
  todayCheckIns: 45,
  expiringThisWeek: 8,
  pendingPayments: 3
};

export const mockAttendanceChart = [
  { day: 'Mon', count: 45 },
  { day: 'Tue', count: 52 },
  { day: 'Wed', count: 48 },
  { day: 'Thu', count: 61 },
  { day: 'Fri', count: 55 },
  { day: 'Sat', count: 70 },
  { day: 'Sun', count: 38 }
];

export const mockRevenueChart = [
  { month: 'Jul', revenue: 8900 },
  { month: 'Aug', revenue: 9200 },
  { month: 'Sep', revenue: 9800 },
  { month: 'Oct', revenue: 10500 },
  { month: 'Nov', revenue: 11200 },
  { month: 'Dec', revenue: 11800 },
  { month: 'Jan', revenue: 12450 }
];

export const mockGymSettings = {
  gymName: 'FitLife Gym',
  email: 'contact@fitlifegym.com',
  phone: '+1-555-GYM-LIFE',
  address: '123 Fitness Boulevard, New York, NY 10001',
  openingTime: '05:00',
  closingTime: '23:00',
  logo: 'https://via.placeholder.com/150/007BFF/FFFFFF?text=FitLife'
};

export const mockTrainers = [
  {
    id: 'T001',
    name: 'John Trainer',
    email: 'john@fitlifegym.com',
    phone: '+1234567891',
    specialization: 'Strength Training',
    status: 'active'
  },
  {
    id: 'T002',
    name: 'Lisa Martinez',
    email: 'lisa@fitlifegym.com',
    phone: '+1234567810',
    specialization: 'Yoga & Flexibility',
    status: 'active'
  },
  {
    id: 'T003',
    name: 'Mike Johnson',
    email: 'mike@fitlifegym.com',
    phone: '+1234567811',
    specialization: 'Cardio & HIIT',
    status: 'active'
  }
];
