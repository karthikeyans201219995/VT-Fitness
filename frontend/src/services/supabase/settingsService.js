import { supabase } from '../../lib/supabaseClient';

/**
 * Settings Service
 * Handles gym settings operations
 */

export const settingsService = {
  /**
   * Get gym settings
   */
  get: async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Get settings error:', error);
      throw error;
    }
  },

  /**
   * Update gym settings
   */
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update settings error:', error);
      throw error;
    }
  },

  /**
   * Create initial settings (if not exists)
   */
  create: async (settingsData) => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .insert([settingsData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create settings error:', error);
      throw error;
    }
  }
};
