import { supabase } from '../../lib/supabaseClient';

/**
 * Diet Plans Service
 * Handles diet plan operations
 */

export const dietPlansService = {
  /**
   * Get all diet plans
   */
  getAll: async (filters = {}) => {
    try {
      let query = supabase
        .from('diet_plans')
        .select(`
          *,
          member:members(*)
        `);

      if (filters.memberId) {
        query = query.eq('member_id', filters.memberId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get diet plans error:', error);
      throw error;
    }
  },

  /**
   * Get diet plan by ID
   */
  getById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('diet_plans')
        .select(`
          *,
          member:members(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get diet plan error:', error);
      throw error;
    }
  },

  /**
   * Create diet plan
   */
  create: async (planData) => {
    try {
      const { data, error } = await supabase
        .from('diet_plans')
        .insert([planData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create diet plan error:', error);
      throw error;
    }
  },

  /**
   * Update diet plan
   */
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('diet_plans')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update diet plan error:', error);
      throw error;
    }
  },

  /**
   * Delete diet plan
   */
  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('diet_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Delete diet plan error:', error);
      throw error;
    }
  }
};
