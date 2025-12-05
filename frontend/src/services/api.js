/**
 * API Service for communicating with backend
 */

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

// Helper function to get auth token
const getAuthToken = () => {
  const token = localStorage.getItem('authToken');
  return token;
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
      throw new Error(errorData.detail || errorData.message || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Authentication APIs
export const authAPI = {
  checkConfig: () => apiRequest('/api/auth/check-config'),
  
  signup: (userData) =>
    apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  login: (credentials) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  logout: () =>
    apiRequest('/api/auth/logout', {
      method: 'POST',
    }),

  getCurrentUser: () => apiRequest('/api/auth/me'),
};

// Members APIs
export const membersAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/members${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id) => apiRequest(`/api/members/${id}`),

  create: (memberData) =>
    apiRequest('/api/members', {
      method: 'POST',
      body: JSON.stringify(memberData),
    }),

  update: (id, memberData) =>
    apiRequest(`/api/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(memberData),
    }),

  delete: (id) =>
    apiRequest(`/api/members/${id}`, {
      method: 'DELETE',
    }),

  getPassword: (id) => apiRequest(`/api/members/${id}/password`),
};

// Plans APIs
export const plansAPI = {
  getAll: () => apiRequest('/api/plans'),

  getById: (id) => apiRequest(`/api/plans/${id}`),

  create: (planData) =>
    apiRequest('/api/plans', {
      method: 'POST',
      body: JSON.stringify(planData),
    }),

  update: (id, planData) =>
    apiRequest(`/api/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(planData),
    }),

  delete: (id) =>
    apiRequest(`/api/plans/${id}`, {
      method: 'DELETE',
    }),
};

// Attendance APIs
export const attendanceAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/attendance${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id) => apiRequest(`/api/attendance/${id}`),

  create: (attendanceData) =>
    apiRequest('/api/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    }),

  update: (id, attendanceData) =>
    apiRequest(`/api/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(attendanceData),
    }),

  delete: (id) =>
    apiRequest(`/api/attendance/${id}`, {
      method: 'DELETE',
    }),
};

// Payments APIs
export const paymentsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/payments${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id) => apiRequest(`/api/payments/${id}`),

  create: (paymentData) =>
    apiRequest('/api/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),

  createWithMember: (memberPaymentData) =>
    apiRequest('/api/payments/with-member', {
      method: 'POST',
      body: JSON.stringify(memberPaymentData),
    }),

  update: (id, paymentData) =>
    apiRequest(`/api/payments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(paymentData),
    }),

  delete: (id) =>
    apiRequest(`/api/payments/${id}`, {
      method: 'DELETE',
    }),
};

// Settings APIs
export const settingsAPI = {
  get: () => apiRequest('/api/settings'),

  update: (settingsData) =>
    apiRequest('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsData),
    }),
};

// Reports APIs
export const reportsAPI = {
  getDashboard: () => apiRequest('/api/reports/dashboard'),

  getRevenue: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/reports/revenue${queryString ? `?${queryString}` : ''}`);
  },

  getAttendance: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/reports/attendance${queryString ? `?${queryString}` : ''}`);
  },

  getMembers: () => apiRequest('/api/reports/members'),
};

// Trainers APIs
export const trainersAPI = {
  getAll: () => apiRequest('/api/trainers'),

  getById: (id) => apiRequest(`/api/trainers/${id}`),

  create: (trainerData) =>
    apiRequest('/api/trainers', {
      method: 'POST',
      body: JSON.stringify(trainerData),
    }),

  update: (id, trainerData) =>
    apiRequest(`/api/trainers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(trainerData),
    }),

  delete: (id) =>
    apiRequest(`/api/trainers/${id}`, {
      method: 'DELETE',
    }),
};

// Balance APIs
export const balanceAPI = {
  getMembersWithBalance: () => apiRequest('/api/balance/members-with-balance'),

  getMemberBalance: (memberId) => apiRequest(`/api/balance/member/${memberId}`),

  recordPartialPayment: (paymentData) =>
    apiRequest('/api/balance/record-partial-payment', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    }),

  getSummary: () => apiRequest('/api/balance/summary'),
};

export default {
  auth: authAPI,
  members: membersAPI,
  plans: plansAPI,
  attendance: attendanceAPI,
  payments: paymentsAPI,
  settings: settingsAPI,
  reports: reportsAPI,
  trainers: trainersAPI,
  balance: balanceAPI,
};
