import { supabase } from '../../lib/supabaseClient';

/**
 * Classes Service
 * Handles gym class operations
 */

export const classesService = {
  /**
   * Get all classes
   */
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('schedule_time', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get classes error:', error);
      throw error;
    }
  },

  /**
   * Get class by ID
   */
  getById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get class error:', error);
      throw error;
    }
  },

  /**
   * Create class
   */
  create: async (classData) => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .insert([classData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create class error:', error);
      throw error;
    }
  },

  /**
   * Update class
   */
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update class error:', error);
      throw error;
    }
  },

  /**
   * Delete class
   */
  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Delete class error:', error);
      throw error;
    }
  },

  /**
   * Get classes by day
   */
  getByDay: async (day) => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('schedule_day', day)
        .eq('status', 'active')
        .order('schedule_time', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get classes by day error:', error);
      throw error;
    }
  }
};

/**
 * Class Bookings Service
 * Handles class booking operations
 */
export const classBookingsService = {
  /**
   * Get all bookings
   */
  getAll: async (filters = {}) => {
    try {
      let query = supabase
        .from('class_bookings')
        .select(`
          *,
          class:classes(*),
          member:members(*)
        `);

      if (filters.classId) {
        query = query.eq('class_id', filters.classId);
      }

      if (filters.memberId) {
        query = query.eq('member_id', filters.memberId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('booking_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get bookings error:', error);
      throw error;
    }
  },

  /**
   * Create booking
   */
  create: async (bookingData) => {
    try {
      const { data, error } = await supabase
        .from('class_bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create booking error:', error);
      throw error;
    }
  },

  /**
   * Cancel booking
   */
  cancel: async (id, reason) => {
    try {
      const { data, error } = await supabase
        .from('class_bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Cancel booking error:', error);
      throw error;
    }
  }
};
