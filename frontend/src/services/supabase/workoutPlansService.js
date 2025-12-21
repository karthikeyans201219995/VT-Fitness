import { supabase } from '../../lib/supabaseClient';

/**
 * Workout Plans Service
 * Handles workout plan operations
 */

export const workoutPlansService = {
  /**
   * Get all workout plans
   */
  getAll: async (filters = {}) => {
    try {
      let query = supabase
        .from('workout_plans')
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
      console.error('Get workout plans error:', error);
      throw error;
    }
  },

  /**
   * Get workout plan by ID
   */
  getById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .select(`
          *,
          member:members(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get workout plan error:', error);
      throw error;
    }
  },

  /**
   * Create workout plan
   */
  create: async (planData) => {
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .insert([planData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create workout plan error:', error);
      throw error;
    }
  },

  /**
   * Update workout plan
   */
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update workout plan error:', error);
      throw error;
    }
  },

  /**
   * Delete workout plan
   */
  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('workout_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Delete workout plan error:', error);
      throw error;
    }
  }
};
