/**
 * AdminAuthContext.js
 * Manages admin authentication state — token stored in localStorage.
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { adminAuthApi, TOKEN_KEY, USER_KEY } from "../../services/adminApi";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      const token = localStorage.getItem(TOKEN_KEY);
      if (stored && token) setAdmin(JSON.parse(stored));
    } catch (_) {}
    setLoading(false);
  }, []);

  const login = useCallback(async (identifier, password) => {
    const { token, admin: adminData } = await adminAuthApi.login(
      identifier,
      password,
    );
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(adminData));
    setAdmin(adminData);
    return adminData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setAdmin(null);
  }, []);

  const updateAdmin = useCallback(
    (updates) => {
      const updated = { ...admin, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      setAdmin(updated);
    },
    [admin],
  );

  return (
    <AdminAuthContext.Provider
      value={{ admin, loading, login, logout, updateAdmin }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx)
    throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}
