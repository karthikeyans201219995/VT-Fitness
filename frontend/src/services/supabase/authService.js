import { supabase } from '../../lib/supabaseClient';

/**
 * Authentication Service
 * Handles all authentication operations using Supabase Auth
 */

export const authService = {
  /**
   * Sign up a new user
   */
  signUp: async ({ email, password, fullName, role = 'member', phone }) => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
            phone
          }
        }
      });

      if (authError) throw authError;

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email,
          full_name: fullName,
          role,
          phone
        }]);

      if (profileError) throw profileError;

      return { user: authData.user, session: authData.session };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  /**
   * Sign in with email and password
   */
  signIn: async ({ email, password }) => {
    console.log('AuthService: Starting sign in for', email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('AuthService: Sign in response', { data: !!data, error });

      if (error) throw error;

      // Create profile from auth metadata (skip database query to avoid hanging)
      const profile = {
        id: data.user.id,
        email: data.user.email,
        full_name: data.user.user_metadata?.full_name || email.split('@')[0],
        role: data.user.user_metadata?.role || 'admin',
        phone: data.user.user_metadata?.phone
      };

      console.log('AuthService: Login successful', profile);

      return { 
        user: data.user, 
        session: data.session,
        profile 
      };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  /**
   * Sign out current user
   */
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  /**
   * Get current user
   */
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;

      if (!user) return null;

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      return { user, profile };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  /**
   * Change password
   */
  changePassword: async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },

  /**
   * Reset password (send email)
   */
  resetPassword: async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};
