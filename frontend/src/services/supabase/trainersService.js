import { supabase } from '../../lib/supabaseClient';

/**
 * Trainers Service
 * Handles trainer operations
 */

export const trainersService = {
  /**
   * Get all trainers
   */
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'trainer')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get trainers error:', error);
      throw error;
    }
  },

  /**
   * Get trainer by ID
   */
  getById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .eq('role', 'trainer')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get trainer error:', error);
      throw error;
    }
  },

  /**
   * Create trainer
   */
  create: async (trainerData) => {
    try {
      // Create auth user first (handled by authService.signUp)
      const { data, error } = await supabase
        .from('users')
        .insert([{ ...trainerData, role: 'trainer' }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create trainer error:', error);
      throw error;
    }
  },

  /**
   * Update trainer
   */
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .eq('role', 'trainer')
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update trainer error:', error);
      throw error;
    }
  },

  /**
   * Delete trainer
   */
  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)
        .eq('role', 'trainer');

      if (error) throw error;
    } catch (error) {
      console.error('Delete trainer error:', error);
      throw error;
    }
  }
};
