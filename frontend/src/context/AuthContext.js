import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('wa_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('wa_token');
    if (token && user) {
      initSocket(token);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (identifier, password) => {
    const { user, token } = await authApi.login({ identifier, password });
    localStorage.setItem('wa_token', token);
    localStorage.setItem('wa_user', JSON.stringify(user));
    setUser(user);
    initSocket(token);
    return user;
  }, []);

  const register = useCallback(async (data) => {
    const { user, token } = await authApi.register(data);
    localStorage.setItem('wa_token', token);
    localStorage.setItem('wa_user', JSON.stringify(user));
    setUser(user);
    initSocket(token);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch {}
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
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
