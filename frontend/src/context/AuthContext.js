import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

/**
 * AuthProvider
 *
 * Manages authenticated user state and persists token + user to localStorage.
 * Exposes: user, loading, loginWithPhone, logout, updateUser
 */
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem('wa_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  // Re-hydrate socket on mount if already logged in
  useEffect(() => {
    const token = localStorage.getItem('wa_token');
    if (token && user) initSocket(token);
    setLoading(false);
  }, []); // eslint-disable-line

  /**
   * Called after OTP verification completes.
   * Works for both existing users (from phoneCheck) and new users (from phoneRegister).
   */
  const loginWithPhone = useCallback((userData, token) => {
    localStorage.setItem('wa_token', token);
    localStorage.setItem('wa_user', JSON.stringify(userData));
    setUser(userData);
    initSocket(token);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    disconnectSocket();
    localStorage.removeItem('wa_token');
    localStorage.removeItem('wa_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    const updated = { ...user, ...updates };
    localStorage.setItem('wa_user', JSON.stringify(updated));
    setUser(updated);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, loginWithPhone, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// AuthContext is internal — use useAuth() hook
