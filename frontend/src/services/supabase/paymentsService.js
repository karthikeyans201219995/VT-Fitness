import { supabase } from '../../lib/supabaseClient';

/**
 * Payments Service
 * Handles all payment operations
 */

export const paymentsService = {
  /**
   * Get all payments
   */
  getAll: async (filters = {}) => {
    try {
      let query = supabase
        .from('payments')
        .select(`
          *,
          member:members(
            id,
            full_name,
            email,
            phone
          ),
          plan:plans(
            id,
            name,
            price
          )
        `);

      if (filters.memberId) {
        query = query.eq('member_id', filters.memberId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.startDate && filters.endDate) {
        query = query.gte('payment_date', filters.startDate).lte('payment_date', filters.endDate);
      }

      const { data, error } = await query.order('payment_date', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get payments error:', error);
      throw error;
    }
  },

  /**
   * Get payment by ID
   */
  getById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          member:members(
            id,
            full_name,
            email,
            phone
          ),
          plan:plans(
            id,
            name,
            price
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get payment error:', error);
      throw error;
    }
  },

  /**
   * Create new payment
   */
  create: async (paymentData) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([paymentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create payment error:', error);
      throw error;
    }
  },

  /**
   * Update payment
   */
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update payment error:', error);
      throw error;
    }
  },

  /**
   * Delete payment
   */
  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Delete payment error:', error);
      throw error;
    }
  },

  /**
   * Get payment statistics
   */
  getStats: async (startDate, endDate) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('amount, payment_method, status')
        .gte('payment_date', startDate)
        .lte('payment_date', endDate);

      if (error) throw error;

      // Calculate stats
      const totalRevenue = data
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const byMethod = data.reduce((acc, p) => {
        acc[p.payment_method] = (acc[p.payment_method] || 0) + parseFloat(p.amount);
        return acc;
      }, {});

      return {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalPayments: data.length,
        byMethod
      };
    } catch (error) {
      console.error('Get payment stats error:', error);
      throw error;
    }
  }
};
