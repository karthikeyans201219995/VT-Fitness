import { supabase } from '../../lib/supabaseClient';

/**
 * Reports Service
 * Handles all reporting and analytics operations
 */

export const reportsService = {
  /**
   * Get dashboard statistics
   */
  getDashboardStats: async () => {
    try {
      // Get total members
      const { count: totalMembers } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true });

      // Get active members
      const { count: activeMembers } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get today's attendance
      const today = new Date().toISOString().split('T')[0];
      const { count: todayAttendance } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('date', today);

      // Get this month's revenue
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const { data: monthlyPayments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed')
        .gte('payment_date', startOfMonth.toISOString().split('T')[0]);

      const monthlyRevenue = monthlyPayments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

      // Get expiring memberships (next 7 days)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const { count: expiringCount } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .lte('end_date', futureDate.toISOString().split('T')[0]);

      return {
        totalMembers: totalMembers || 0,
        activeMembers: activeMembers || 0,
        todayAttendance: todayAttendance || 0,
        monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
        expiringMemberships: expiringCount || 0
      };
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      throw error;
    }
  },

  /**
   * Get revenue report
   */
  getRevenueReport: async (startDate, endDate) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('amount, payment_date, payment_method')
        .eq('status', 'completed')
        .gte('payment_date', startDate)
        .lte('payment_date', endDate)
        .order('payment_date', { ascending: true });

      if (error) throw error;

      // Group by date
      const dailyRevenue = data.reduce((acc, payment) => {
        const date = payment.payment_date;
        acc[date] = (acc[date] || 0) + parseFloat(payment.amount);
        return acc;
      }, {});

      // Group by payment method
      const byMethod = data.reduce((acc, payment) => {
        const method = payment.payment_method;
        acc[method] = (acc[method] || 0) + parseFloat(payment.amount);
        return acc;
      }, {});

      const totalRevenue = data.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      return {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        dailyRevenue,
        byMethod,
        totalTransactions: data.length
      };
    } catch (error) {
      console.error('Get revenue report error:', error);
      throw error;
    }
  },

  /**
   * Get attendance report
   */
  getAttendanceReport: async (startDate, endDate) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('date, member_id')
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      // Group by date
      const dailyAttendance = data.reduce((acc, record) => {
        const date = record.date;
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const totalVisits = data.length;
      const uniqueMembers = new Set(data.map(a => a.member_id)).size;
      const days = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1;
      const averageDaily = totalVisits / days;

      return {
        totalVisits,
        uniqueMembers,
        averageDaily: Math.round(averageDaily * 10) / 10,
        dailyAttendance
      };
    } catch (error) {
      console.error('Get attendance report error:', error);
      throw error;
    }
  },

  /**
   * Get member growth report
   */
  getMemberGrowthReport: async (startDate, endDate) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('created_at, status')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) throw error;

      // Group by date
      const dailySignups = data.reduce((acc, member) => {
        const date = member.created_at.split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      const totalSignups = data.length;
      const activeCount = data.filter(m => m.status === 'active').length;

      return {
        totalSignups,
        activeCount,
        dailySignups
      };
    } catch (error) {
      console.error('Get member growth report error:', error);
      throw error;
    }
  }
};
