// src/context/AuthContext.jsx
// Global authentication state — wraps the entire app
// Provides user info + login/logout functions to all components
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // true while checking token on mount

  // ── On app load: restore user from localStorage token ─────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token is still valid by hitting /api/auth/me
      api.get('/auth/me')
        .then(res => setUser(res.data))
        .catch(() => {
          // Token expired or invalid — clear it
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ── Login: store token + set user ─────────────────────────
  const login = (userData) => {
    localStorage.setItem('token', userData.token);
    setUser(userData);
  };

  // ── Logout: clear token + user ────────────────────────────
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // ── Refresh user data from server (after profile update) ──
  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(prev => ({ ...prev, ...res.data }));
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy consumption
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
