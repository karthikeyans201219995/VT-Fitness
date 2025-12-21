import { supabase } from '../../lib/supabaseClient';

/**
 * Equipment Service
 * Handles gym equipment management
 */

export const equipmentService = {
  /**
   * Get all equipment
   */
  getAll: async (filters = {}) => {
    try {
      let query = supabase
        .from('equipment')
        .select('*');

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get equipment error:', error);
      throw error;
    }
  },

  /**
   * Get equipment by ID
   */
  getById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get equipment error:', error);
      throw error;
    }
  },

  /**
   * Create equipment
   */
  create: async (equipmentData) => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .insert([equipmentData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create equipment error:', error);
      throw error;
    }
  },

  /**
   * Update equipment
   */
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update equipment error:', error);
      throw error;
    }
  },

  /**
   * Delete equipment
   */
  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Delete equipment error:', error);
      throw error;
    }
  },

  /**
   * Get equipment needing maintenance
   */
  getNeedingMaintenance: async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .lte('next_maintenance_date', today)
        .eq('status', 'working')
        .order('next_maintenance_date', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get equipment needing maintenance error:', error);
      throw error;
    }
  }
};
