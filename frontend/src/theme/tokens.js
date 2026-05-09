/**
 * Design Tokens — WhatsApp-style redesign
 */

export const COLOR = {
  primary: "#00a884",
  primaryLight: "#25d366",
  primaryDark: "#008069",
  accent: "#25d366",
  accentLight: "#4ae07a",
  bgPage: "#f0f2f5",
  bgCard: "#ffffff",
  bgSidebar: "#ffffff",
  bgInput: "#f0f2f5",
  bgHover: "rgba(0,0,0,0.035)",
  bgSelected: "#f0f2f5",
  bgChatPanel: "#efeae2",
  bubbleOwn: "#d9fdd3",
  bubbleOther: "#ffffff",
  bubbleShadow: "rgba(0,0,0,0.07)",
  textPrimary: "#111b21",
  textSecondary: "#54656f",
  textDisabled: "#8696a0",
  textOnPrimary: "#ffffff",
  border: "#e9edef",
  borderFocus: "#00a884",
  success: "#25d366",
  error: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
  overlay: "rgba(0,0,0,0.35)",
  headerBg: "#f0f2f5",
};

export const GRADIENT = {
  brand: "linear-gradient(135deg, #00a884 0%, #25d366 100%)",
  brandBtn: "linear-gradient(135deg, #00a884 0%, #25d366 100%)",
  brandSoft:
    "linear-gradient(135deg, rgba(0,168,132,0.10) 0%, rgba(37,211,102,0.06) 100%)",
  hero: "linear-gradient(160deg, #e8fff7 0%, #f0f8f5 100%)",
};

export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOW = {
  card: "0 1px 3px rgba(0,0,0,0.08)",
  elevated: "0 4px 20px rgba(0,0,0,0.12)",
  button: "0 2px 8px rgba(37,211,102,0.30)",
  bubble: "0 1px 2px rgba(0,0,0,0.10)",
};

export const FONT = {
  family: '"DM Sans", "Segoe UI", system-ui, sans-serif',
  size: {
    xs: "0.70rem",
    sm: "0.80rem",
    base: "0.9375rem",
    md: "1.00rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
  },
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
};
