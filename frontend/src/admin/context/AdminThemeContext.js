/**
 * AdminThemeContext.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides light / dark theme toggling for the admin panel.
 * Persists choice to localStorage so it survives refreshes.
 *
 * Usage:
 *   const { mode, toggleMode } = useAdminTheme();
 */
import React, { createContext, useContext, useState, useMemo } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { buildAdminTheme } from "../../theme/adminTheme";

const STORAGE_KEY = "admin_theme_mode";

const AdminThemeContext = createContext({
  mode: "light",
  toggleMode: () => {},
});

export function AdminThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === "dark" ? "dark" : "light";
    } catch {
      return "dark";
    }
  });

  const toggleMode = () =>
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {}
      return next;
    });

  const theme = useMemo(() => buildAdminTheme(mode), [mode]);

  return (
    <AdminThemeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}
