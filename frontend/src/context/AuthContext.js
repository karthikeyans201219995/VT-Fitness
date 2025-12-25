import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/supabase';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    // Failsafe timeout - stop loading after 5 seconds no matter what
    const timeout = setTimeout(() => {
      if (isMounted && loading) {
        console.warn('Auth check timed out, setting loading to false');
        setLoading(false);
      }
    }, 5000);

    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        console.log('AuthContext: Checking session...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('AuthContext: Session result', !!session);
        
        if (session?.user && isMounted) {
          // Use auth metadata directly (skip database query)
          const userProfile = {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
            role: session.user.user_metadata?.role || 'admin',
            phone: session.user.user_metadata?.phone
          };
          
          setUser(session.user);
          setProfile(userProfile);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
      if (isMounted) {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('AuthContext: Auth state changed', event);
      if (session?.user && isMounted) {
        const userProfile = {
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          role: session.user.user_metadata?.role || 'admin',
          phone: session.user.user_metadata?.phone
        };
        
        setUser(session.user);
        setProfile(userProfile);
      } else if (isMounted) {
        setUser(null);
        setProfile(null);
      }
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authService.signIn({ email, password });
      
      setUser(response.user);
      setProfile(response.profile);
      
      return { success: true, user: response.profile };
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  const signup = async (userData) => {
    try {
      setError(null);
      const response = await authService.signUp({
        email: userData.email,
        password: userData.password,
        fullName: userData.full_name || userData.fullName,
        role: userData.role || 'member',
        phone: userData.phone
      });
      
      if (response.user) {
        setUser(response.user);
        // Profile will be set by the auth state change listener
        return { success: true, user: response.user };
      }
      
      return { success: false, message: 'Signup failed' };
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  const logout = async () => {
    try {
      await authService.signOut();
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Logout error:', err);
      throw err;
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      const updatedProfile = await authService.updateProfile(user.id, updates);
      setProfile(updatedProfile);
      return { success: true, profile: updatedProfile };
    } catch (err) {
      console.error('Update profile error:', err);
      return { success: false, message: err.message };
    }
  };

  const value = {
    user,
    profile,
    login,
    signup,
    logout,
    updateProfile,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
    isTrainer: profile?.role === 'trainer',
    isMember: profile?.role === 'member'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
