/**
 * admin/context/ToastContext.js
 *
 * Global toast notification system for the admin panel.
 * Provides success / error / info / warning toasts that auto-close.
 *
 * Usage in any admin page:
 *   const toast = useToast();
 *   toast.success("Emoji created!");
 *   toast.error("Something went wrong.");
 *   toast.info("No changes made.");
 *   toast.warning("Check your input.");
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { Box, Typography, IconButton, Stack } from "@mui/material";
import {
  CheckCircle as SuccessIcon,
  ErrorOutline as ErrorIcon,
  InfoOutlined as InfoIcon,
  WarningAmberOutlined as WarningIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext(null);

// ─── Config ───────────────────────────────────────────────────────────────────

const VARIANTS = {
  success: {
    bg: "#f0fdf4",
    border: "#86efac",
    color: "#15803d",
    Icon: SuccessIcon,
    iconColor: "#22c55e",
  },
  error: {
    bg: "#fef2f2",
    border: "#fca5a5",
    color: "#b91c1c",
    Icon: ErrorIcon,
    iconColor: "#ef4444",
  },
  info: {
    bg: "#eff6ff",
    border: "#93c5fd",
    color: "#1d4ed8",
    Icon: InfoIcon,
    iconColor: "#3b82f6",
  },
  warning: {
    bg: "#fffbeb",
    border: "#fcd34d",
    color: "#92400e",
    Icon: WarningIcon,
    iconColor: "#f59e0b",
  },
};

const AUTO_CLOSE_MS = 3500;
let nextId = 1;

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    // animate out: mark as exiting first, remove after animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 280);
  }, []);

  const show = useCallback(
    (message, type = "info", duration = AUTO_CLOSE_MS) => {
      const id = nextId++;
      setToasts((prev) => [...prev, { id, message, type, exiting: false }]);
      timers.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss],
  );

  const toast = {
    success: (msg, dur) => show(msg, "success", dur),
    error: (msg, dur) => show(msg, "error", dur ?? 5000),
    info: (msg, dur) => show(msg, "info", dur),
    warning: (msg, dur) => show(msg, "warning", dur),
    dismiss,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

// ─── ToastContainer ───────────────────────────────────────────────────────────

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;
  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </Box>
  );
}

// ─── ToastItem ────────────────────────────────────────────────────────────────

function ToastItem({ toast: t, onDismiss }) {
  const v = VARIANTS[t.type] ?? VARIANTS.info;
  const { Icon } = v;

  return (
    <Box
      sx={{
        pointerEvents: "all",
        minWidth: 300,
        maxWidth: 420,
        display: "flex",
        alignItems: "flex-start",
        gap: 1.25,
        px: 1.75,
        py: 1.25,
        borderRadius: "12px",
        border: `1px solid ${v.border}`,
        bgcolor: v.bg,
        boxShadow: "0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)",
        // slide-in from right, slide-out on exit
        animation: t.exiting
          ? "toastSlideOut 0.28s ease forwards"
          : "toastSlideIn 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "@keyframes toastSlideIn": {
          from: { opacity: 0, transform: "translateX(40px) scale(0.95)" },
          to: { opacity: 1, transform: "translateX(0) scale(1)" },
        },
        "@keyframes toastSlideOut": {
          from: { opacity: 1, transform: "translateX(0) scale(1)" },
          to: { opacity: 0, transform: "translateX(48px) scale(0.93)" },
        },
      }}
    >
      {/* Icon */}
      <Box sx={{ flexShrink: 0, mt: 0.1 }}>
        <Icon sx={{ fontSize: 20, color: v.iconColor }} />
      </Box>

      {/* Message */}
      <Typography
        variant="body2"
        sx={{
          flex: 1,
          color: v.color,
          fontWeight: 600,
          fontSize: "0.875rem",
          lineHeight: 1.5,
          wordBreak: "break-word",
        }}
      >
        {t.message}
      </Typography>

      {/* Close button */}
      <IconButton
        size="small"
        onClick={() => onDismiss(t.id)}
        sx={{
          p: 0.25,
          mt: -0.25,
          mr: -0.5,
          color: v.color,
          opacity: 0.6,
          flexShrink: 0,
          "&:hover": { opacity: 1, bgcolor: "rgba(0,0,0,0.06)" },
        }}
      >
        <CloseIcon sx={{ fontSize: 15 }} />
      </IconButton>
    </Box>
  );
}
