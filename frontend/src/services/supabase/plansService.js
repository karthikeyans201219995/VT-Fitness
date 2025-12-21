import { supabase } from '../../lib/supabaseClient';

/**
 * Plans Service
 * Handles all membership plan operations
 */

export const plansService = {
  /**
   * Get all plans
   */
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get plans error:', error);
      throw error;
    }
  },

  /**
   * Get active plans only
   */
  getActive: async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get active plans error:', error);
      throw error;
    }
  },

  /**
   * Get plan by ID
   */
  getById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get plan error:', error);
      throw error;
    }
  },

  /**
   * Create new plan
   */
  create: async (planData) => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .insert([planData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create plan error:', error);
      throw error;
    }
  },

  /**
   * Update plan
   */
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update plan error:', error);
      throw error;
    }
  },

  /**
   * Delete plan
   */
  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Delete plan error:', error);
      throw error;
    }
  }
};
