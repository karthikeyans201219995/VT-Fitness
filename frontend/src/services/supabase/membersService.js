import { supabase } from '../../lib/supabaseClient';

/**
 * Members Service
 * Handles all member-related operations
 */

export const membersService = {
  /**
   * Get all members
   */
  getAll: async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          plan:plans(*),
          user:users(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get members error:', error);
      throw error;
    }
  },

  /**
   * Get member by ID
   */
  getById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          plan:plans(*),
          user:users(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get member error:', error);
      throw error;
    }
  },

  /**
   * Create new member
   */
  create: async (memberData) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .insert([memberData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create member error:', error);
      throw error;
    }
  },

  /**
   * Update member
   */
  update: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update member error:', error);
      throw error;
    }
  },

  /**
   * Delete member
   */
  delete: async (id) => {
    try {
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Delete member error:', error);
      throw error;
    }
  },

  /**
   * Search members
   */
  search: async (query) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          plan:plans(*),
          user:users(*)
        `)
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Search members error:', error);
      throw error;
    }
  },

  /**
   * Get members by status
   */
  getByStatus: async (status) => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          plan:plans(*),
          user:users(*)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get members by status error:', error);
      throw error;
    }
  },

  /**
   * Get expiring memberships
   */
  getExpiring: async (days = 7) => {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          plan:plans(*),
          user:users(*)
        `)
        .eq('status', 'active')
        .lte('end_date', futureDate.toISOString().split('T')[0])
        .order('end_date', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get expiring members error:', error);
      throw error;
    }
  }
};
