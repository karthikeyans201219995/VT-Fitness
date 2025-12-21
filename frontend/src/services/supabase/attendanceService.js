import { supabase } from '../../lib/supabaseClient';

/**
 * Attendance Service
 * Handles all attendance tracking operations
 */

export const attendanceService = {
  /**
   * Check in a member
   */
  checkIn: async (memberId, notes = null) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .insert([{
          member_id: memberId,
          check_in_time: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
          notes
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Check in error:', error);
      throw error;
    }
  },

  /**
   * Check out a member
   */
  checkOut: async (attendanceId) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .update({ check_out_time: new Date().toISOString() })
        .eq('id', attendanceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Check out error:', error);
      throw error;
    }
  },

  /**
   * Get attendance records
   */
  getAll: async (filters = {}) => {
    try {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          member:members(
            id,
            full_name,
            email,
            phone
          )
        `);

      if (filters.memberId) {
        query = query.eq('member_id', filters.memberId);
      }

      if (filters.date) {
        query = query.eq('date', filters.date);
      }

      if (filters.startDate && filters.endDate) {
        query = query.gte('date', filters.startDate).lte('date', filters.endDate);
      }

      const { data, error } = await query.order('check_in_time', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get attendance error:', error);
      throw error;
    }
  },

  /**
   * Get today's attendance
   */
  getToday: async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          member:members(
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('date', today)
        .order('check_in_time', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get today attendance error:', error);
      throw error;
    }
  },

  /**
   * Get member's last check-in
   */
  getLastCheckIn: async (memberId) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('member_id', memberId)
        .eq('date', today)
        .is('check_out_time', null)
        .order('check_in_time', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Get last check-in error:', error);
      return null;
    }
  },

  /**
   * Get attendance statistics
   */
  getStats: async (startDate, endDate) => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('date, member_id')
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      // Calculate stats
      const totalVisits = data.length;
      const uniqueMembers = new Set(data.map(a => a.member_id)).size;
      const dailyAverage = totalVisits / ((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1);

      return {
        totalVisits,
        uniqueMembers,
        dailyAverage: Math.round(dailyAverage * 10) / 10
      };
    } catch (error) {
      console.error('Get attendance stats error:', error);
      throw error;
    }
  }
};
