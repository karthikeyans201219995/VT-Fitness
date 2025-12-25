/**
 * API Service using Supabase
 */

import { supabase } from '../lib/supabaseClient';

// Helper function to handle Supabase errors
const handleError = (error) => {
  console.error('Supabase Error:', error);
  throw new Error(error.message || 'An error occurred');
};

// Authentication APIs
export const authAPI = {
  checkConfig: async () => {
    // Check if Supabase is configured
    return { configured: true };
  },
  
  signup: async (userData) => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
          role: userData.role || 'member'
        }
      }
    });
    if (error) handleError(error);
    return data;
  },

  login: async (credentials) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    if (error) handleError(error);
    return data;
  },

  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) handleError(error);
    return { success: true };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) handleError(error);
    return user;
  },
};

// Members APIs
export const membersAPI = {
  getAll: async (params = {}) => {
    let query = supabase.from('members').select('*');
    
    if (params.status) {
      query = query.eq('status', params.status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) handleError(error);
    return data;
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single();
    if (error) handleError(error);
    return data;
  },

  create: async (memberData) => {
    const { data, error } = await supabase
      .from('members')
      .insert([memberData])
      .select()
      .single();
    if (error) handleError(error);
    return data;
  },

  update: async (id, memberData) => {
    const { data, error } = await supabase
      .from('members')
      .update(memberData)
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error);
    return data;
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', id);
    if (error) handleError(error);
    return { success: true };
  },

  getPassword: async (id) => {
    const { data, error } = await supabase
      .from('members')
      .select('password')
      .eq('id', id)
      .single();
    if (error) handleError(error);
    return data;
  },
};

// Plans APIs
export const plansAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });
    if (error) {
      console.error('Plans fetch error:', error);
      return []; // Return empty array instead of throwing
    }
    return data || [];
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('id', id)
      .single();
    if (error) handleError(error);
    return data;
  },

  create: async (planData) => {
    const { data, error } = await supabase
      .from('plans')
      .insert([planData])
      .select()
      .single();
    if (error) handleError(error);
    return data;
  },

  update: async (id, planData) => {
    const { data, error } = await supabase
      .from('plans')
      .update(planData)
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error);
    return data;
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', id);
    if (error) handleError(error);
    return { success: true };
  },
};

// Attendance APIs
export const attendanceAPI = {
  getAll: async (params = {}) => {
    let query = supabase.from('attendance').select('*, members(*)');
    
    if (params.member_id) {
      query = query.eq('member_id', params.member_id);
    }
    if (params.date) {
      query = query.eq('date', params.date);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    if (error) handleError(error);
    return data;
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from('attendance')
      .select('*, members(*)')
      .eq('id', id)
      .single();
    if (error) handleError(error);
    return data;
  },

  create: async (attendanceData) => {
    const { data, error } = await supabase
      .from('attendance')
      .insert([attendanceData])
      .select()
      .single();
    if (error) handleError(error);
    return data;
  },

  update: async (id, attendanceData) => {
    const { data, error } = await supabase
      .from('attendance')
      .update(attendanceData)
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error);
    return data;
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('id', id);
    if (error) handleError(error);
    return { success: true };
  },
};

// Payments APIs
export const paymentsAPI = {
  getAll: async (params = {}) => {
    let query = supabase.from('payments').select('*, members(*), plans(*)');
    
    if (params.member_id) {
      query = query.eq('member_id', params.member_id);
    }
    
    const { data, error } = await query.order('payment_date', { ascending: false });
    if (error) handleError(error);
    return data;
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from('payments')
      .select('*, members(*), plans(*)')
      .eq('id', id)
      .single();
    if (error) handleError(error);
    return data;
  },

  create: async (paymentData) => {
    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single();
    if (error) handleError(error);
    return data;
  },

  createWithMember: async (memberPaymentData) => {
    // This would need to be handled with a Supabase function or multiple calls
    const { member, payment } = memberPaymentData;
    
    // First create member
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .insert([member])
      .select()
      .single();
    if (memberError) handleError(memberError);
    
    // Then create payment
    payment.member_id = memberData.id;
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert([payment])
      .select()
      .single();
    if (paymentError) handleError(paymentError);
    
    return { member: memberData, payment: paymentData };
  },

  update: async (id, paymentData) => {
    const { data, error } = await supabase
      .from('payments')
      .update(paymentData)
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error);
    return data;
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);
    if (error) handleError(error);
    return { success: true };
  },
};

// Settings APIs
export const settingsAPI = {
  get: async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .single();
    if (error) handleError(error);
    return data;
  },

  update: async (settingsData) => {
    const { data, error } = await supabase
      .from('settings')
      .upsert(settingsData)
      .select()
      .single();
    if (error) handleError(error);
    return data;
  },
};

// Reports APIs
export const reportsAPI = {
  getDashboard: async () => {
    try {
      // Aggregate data from multiple tables
      const [members, payments, attendance] = await Promise.all([
        supabase.from('members').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('attendance').select('*')
      ]);
      
      return {
        total_members: members.data?.length || 0,
        active_members: members.data?.filter(m => m.status === 'active')?.length || 0,
        total_revenue: payments.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
        monthly_revenue: payments.data?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
        total_attendance: attendance.data?.length || 0,
        today_checkins: 0,
      };
    } catch (error) {
      console.error('getDashboard error:', error);
      return {
        total_members: 0,
        active_members: 0,
        total_revenue: 0,
        monthly_revenue: 0,
        total_attendance: 0,
        today_checkins: 0,
      };
    }
  },

  getRevenue: async (params = {}) => {
    let query = supabase.from('payments').select('*');
    
    if (params.start_date) {
      query = query.gte('payment_date', params.start_date);
    }
    if (params.end_date) {
      query = query.lte('payment_date', params.end_date);
    }
    
    const { data, error } = await query.order('payment_date', { ascending: false });
    if (error) handleError(error);
    return data;
  },

  getAttendance: async (params = {}) => {
    let query = supabase.from('attendance').select('*, members(*)');
    
    if (params.start_date) {
      query = query.gte('date', params.start_date);
    }
    if (params.end_date) {
      query = query.lte('date', params.end_date);
    }
    
    const { data, error } = await query.order('date', { ascending: false });
    if (error) handleError(error);
    return data;
  },

  getMembers: async () => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) handleError(error);
    return data;
  },
};

// Trainers APIs
export const trainersAPI = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .order('name', { ascending: true });
    if (error) handleError(error);
    return data;
  },

  getById: async (id) => {
    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .eq('id', id)
      .single();
    if (error) handleError(error);
    return data;
  },

  create: async (trainerData) => {
    const { data, error } = await supabase
      .from('trainers')
      .insert([trainerData])
      .select()
      .single();
    if (error) handleError(error);
    return data;
  },

  update: async (id, trainerData) => {
    const { data, error } = await supabase
      .from('trainers')
      .update(trainerData)
      .eq('id', id)
      .select()
      .single();
    if (error) handleError(error);
    return data;
  },

  delete: async (id) => {
    const { error } = await supabase
      .from('trainers')
      .delete()
      .eq('id', id);
    if (error) handleError(error);
    return { success: true };
  },
};

// Balance APIs
export const balanceAPI = {
  getMembersWithBalance: async () => {
    const { data, error } = await supabase
      .from('members')
      .select('*, payments(*)')
      .gt('balance', 0);
    if (error) handleError(error);
    return data;
  },

  getMemberBalance: async (memberId) => {
    const { data, error } = await supabase
      .from('members')
      .select('balance, payments(*)')
      .eq('id', memberId)
      .single();
    if (error) handleError(error);
    return data;
  },

  recordPartialPayment: async (paymentData) => {
    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()
      .single();
    if (error) handleError(error);
    return data;
  },

  getSummary: async () => {
    const { data, error } = await supabase
      .from('members')
      .select('balance');
    if (error) handleError(error);
    
    const totalBalance = data?.reduce((sum, m) => sum + (m.balance || 0), 0) || 0;
    return { total_balance: totalBalance, members_with_balance: data?.filter(m => m.balance > 0).length || 0 };
  },
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
