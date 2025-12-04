import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          const userData = await authAPI.getCurrentUser();
          setUser(userData);
        } catch (err) {
          console.error('Failed to fetch user:', err);
          localStorage.removeItem('authToken');
          localStorage.removeItem('gymUser');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login({ email, password });
      
      if (response.access_token) {
        localStorage.setItem('authToken', response.access_token);
        
        // Fetch user data
        const userData = await authAPI.getCurrentUser();
        setUser(userData);
        localStorage.setItem('gymUser', JSON.stringify(userData));
        
        return { success: true, user: userData };
      }
      
      return { success: false, message: 'Login failed' };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  const signup = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.signup(userData);
      
      if (response.access_token) {
        localStorage.setItem('authToken', response.access_token);
        
        // Fetch user data
        const newUserData = await authAPI.getCurrentUser();
        setUser(newUserData);
        localStorage.setItem('gymUser', JSON.stringify(newUserData));
        
        return { success: true, user: newUserData };
      }
      
      return { success: false, message: 'Signup failed' };
    } catch (err) {
      setError(err.message);
      return { success: false, message: err.message };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('gymUser');
    }
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isTrainer: user?.role === 'trainer',
    isMember: user?.role === 'member'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
