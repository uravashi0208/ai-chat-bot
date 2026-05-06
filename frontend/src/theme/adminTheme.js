/**
 * adminTheme.js
 * Exports buildAdminTheme(mode) factory supporting 'dark' | 'light'.
 * Also exports legacy default (dark) for backward compat with App.js.
 *
 * Design:
 *  Dark  — "Control room": deep navy-black / electric indigo. Vercel / Linear.
 *  Light — "Clean desk":   crisp white / indigo accent. Notion / Linear light.
 */
import { createTheme, alpha } from "@mui/material/styles";

const BASE = {
  primary: "#6366f1",
  primaryDk: "#4f46e5",
  primaryLt: "#818cf8",
  accent: "#06b6d4",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
};

const DARK = {
  ...BASE,
  bg: "#0c0e14",
  surface: "#12151e",
  surface2: "#181c29",
  surface3: "#1e2334",
  border: "rgba(99,102,241,0.15)",
  borderSub: "rgba(255,255,255,0.06)",
  textPri: "#f0f2ff",
  textSec: "#8b92b8",
  textMuted: "#4e5470",
};

const LIGHT = {
  ...BASE,
  bg: "#f4f5fb",
  surface: "#ffffff",
  surface2: "#f0f1f8",
  surface3: "#e8eaf5",
  border: "rgba(99,102,241,0.18)",
  borderSub: "rgba(0,0,0,0.08)",
  textPri: "#111827",
  textSec: "#4b5563",
  textMuted: "#9ca3af",
};

export function buildAdminTheme(mode = "light") {
  const T = mode === "light" ? LIGHT : DARK;
  const isDark = mode === "light";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: T.primary,
        light: T.primaryLt,
        dark: T.primaryDk,
        contrastText: "#ffffff",
      },
      secondary: { main: T.accent, light: "#67e8f9", dark: "#0891b2" },
      background: { default: T.bg, paper: T.surface },
      success: { main: T.success },
      warning: { main: T.warning },
      error: { main: T.error },
      info: { main: T.accent },
      text: { primary: T.textPri, secondary: T.textSec, disabled: T.textMuted },
      divider: T.borderSub,
      action: {
        hover: alpha(T.primary, 0.08),
        selected: alpha(T.primary, 0.14),
        active: T.primary,
      },
      custom: {
        surface2: T.surface2,
        surface3: T.surface3,
        border: T.border,
        borderSub: T.borderSub,
        brand: T,
      },
    },

    typography: {
      fontFamily: '"Inter", "DM Sans", system-ui, -apple-system, sans-serif',
      h1: { fontWeight: 800, letterSpacing: "-0.03em", fontSize: "2.25rem" },
      h2: { fontWeight: 700, letterSpacing: "-0.025em", fontSize: "1.875rem" },
      h3: { fontWeight: 700, letterSpacing: "-0.02em", fontSize: "1.5rem" },
      h4: { fontWeight: 600, letterSpacing: "-0.015em", fontSize: "1.25rem" },
      h5: { fontWeight: 600, letterSpacing: "-0.01em", fontSize: "1.125rem" },
      h6: { fontWeight: 600, letterSpacing: "-0.005em", fontSize: "1rem" },
      subtitle1: { fontWeight: 500, fontSize: "0.9375rem", lineHeight: 1.5 },
      subtitle2: { fontWeight: 500, fontSize: "0.8125rem", color: T.textSec },
      body1: { fontSize: "0.875rem", lineHeight: 1.6 },
      body2: { fontSize: "0.8125rem", lineHeight: 1.5 },
      caption: {
        fontSize: "0.72rem",
        letterSpacing: "0.03em",
        color: T.textSec,
      },
      overline: {
        fontSize: "0.6875rem",
        letterSpacing: "0.1em",
        fontWeight: 600,
        textTransform: "uppercase",
      },
      button: {
        fontWeight: 600,
        letterSpacing: "0.01em",
        textTransform: "none",
        fontSize: "0.875rem",
      },
    },

    shape: { borderRadius: 10 },

    shadows: isDark
      ? [
          "none",
          `0 1px 3px rgba(0,0,0,0.5)`,
          `0 3px 6px rgba(0,0,0,0.5)`,
          `0 6px 12px rgba(0,0,0,0.5)`,
          `0 10px 20px rgba(0,0,0,0.5)`,
          `0 14px 28px rgba(0,0,0,0.55)`,
          `0 20px 40px rgba(0,0,0,0.6)`,
          `0 24px 48px rgba(99,102,241,0.15)`,
          ...Array(17).fill(`0 32px 64px rgba(99,102,241,0.2)`),
        ]
      : [
          "none",
          `0 1px 3px rgba(0,0,0,0.07)`,
          `0 3px 6px rgba(0,0,0,0.07)`,
          `0 6px 12px rgba(0,0,0,0.07)`,
          `0 10px 20px rgba(0,0,0,0.07)`,
          `0 14px 28px rgba(0,0,0,0.08)`,
          `0 20px 40px rgba(0,0,0,0.09)`,
          `0 24px 48px rgba(99,102,241,0.12)`,
          ...Array(17).fill(`0 32px 64px rgba(99,102,241,0.12)`),
        ],

    components: {
      MuiCssBaseline: {
        styleOverrides: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          *, *::before, *::after { box-sizing: border-box; }
          html { min-height: 100%; }
          body { margin:0; padding:0; min-height:100vh; background-color:${T.bg}; color:${T.textPri}; overflow-x:hidden; }
          ::-webkit-scrollbar { width:5px; height:5px; }
          ::-webkit-scrollbar-track { background:transparent; }
          ::-webkit-scrollbar-thumb { background:${alpha(T.primary, isDark ? 0.25 : 0.2)}; border-radius:3px; }
          ::-webkit-scrollbar-thumb:hover { background:${alpha(T.primary, isDark ? 0.4 : 0.35)}; }
          ::selection { background:${alpha(T.primary, 0.3)}; }
        `,
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: T.surface,
            backgroundImage: "none",
            borderBottom: `1px solid ${T.borderSub}`,
            boxShadow: "none",
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: T.surface,
            backgroundImage: "none",
            borderRight: `1px solid ${T.borderSub}`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 600,
            fontSize: "0.8125rem",
            padding: "7px 16px",
            transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)",
            gap: 6,
          },
          containedPrimary: {
            background: `linear-gradient(135deg, ${T.primary} 0%, ${T.primaryDk} 100%)`,
            "&:hover": {
              background: `linear-gradient(135deg, ${T.primaryLt} 0%, ${T.primary} 100%)`,
              boxShadow: `0 4px 16px ${alpha(T.primary, 0.4)}`,
              transform: "translateY(-1px)",
            },
            "&:active": { transform: "translateY(0)" },
          },
          outlinedPrimary: {
            borderColor: alpha(T.primary, 0.5),
            "&:hover": {
              borderColor: T.primary,
              backgroundColor: alpha(T.primary, 0.08),
            },
          },
          text: { "&:hover": { backgroundColor: alpha(T.primary, 0.08) } },
          sizeSmall: { padding: "4px 12px", fontSize: "0.75rem" },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            transition: "all 0.15s",
            "&:hover": { backgroundColor: alpha(T.primary, 0.1) },
          },
          sizeSmall: { padding: 5 },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: T.surface,
            backgroundImage: "none",
            border: `1px solid ${T.borderSub}`,
            borderRadius: 12,
            boxShadow: "none",
            transition: "border-color 0.2s",
            "&:hover": { borderColor: alpha(T.primary, 0.25) },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: "none", backgroundColor: T.surface },
          elevation1: { border: `1px solid ${T.borderSub}`, boxShadow: "none" },
        },
      },
      MuiTextField: {
        defaultProps: { variant: "outlined", size: "small" },
        styleOverrides: {
          root: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 8,
              backgroundColor: isDark
                ? alpha("#ffffff", 0.03)
                : alpha("#000000", 0.02),
              fontSize: "0.875rem",
              "& fieldset": { borderColor: T.borderSub },
              "&:hover fieldset": { borderColor: alpha(T.primary, 0.4) },
              "&.Mui-focused fieldset": {
                borderColor: T.primary,
                borderWidth: 1.5,
                boxShadow: `0 0 0 3px ${alpha(T.primary, 0.12)}`,
              },
            },
            "& .MuiInputBase-input": { color: T.textPri },
            "& .MuiInputLabel-root": {
              color: T.textSec,
              fontSize: "0.875rem",
              top: "3px",
            },
            "& .MuiInputLabel-root.Mui-focused": {
              color: T.primary,
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: { fontSize: "0.875rem" },
          "& .MuiInputLabel-root": {
            top: "3px",
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            "& .MuiTableCell-root": {
              backgroundColor: T.surface2,
              color: T.textSec,
              fontSize: "0.6875rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              borderBottom: `1px solid ${T.borderSub}`,
              padding: "10px 16px",
              whiteSpace: "nowrap",
            },
          },
        },
      },
      MuiTableBody: {
        styleOverrides: {
          root: {
            "& .MuiTableRow-root": {
              transition: "background 0.12s",
              "&:hover": {
                backgroundColor: alpha(T.primary, isDark ? 0.04 : 0.03),
              },
            },
            "& .MuiTableCell-root": {
              borderBottom: `1px solid ${T.borderSub}`,
              fontSize: "0.8125rem",
              padding: "10px 16px",
              color: T.textPri,
            },
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            border: `1px solid ${T.surface}`,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
            fontSize: "0.72rem",
            height: 22,
          },
          colorSuccess: {
            backgroundColor: alpha(T.success, isDark ? 0.15 : 0.1),
            color: isDark ? T.success : "#059669",
          },
          colorError: {
            backgroundColor: alpha(T.error, isDark ? 0.15 : 0.1),
            color: isDark ? T.error : "#dc2626",
          },
          colorWarning: {
            backgroundColor: alpha(T.warning, isDark ? 0.15 : 0.1),
            color: isDark ? T.warning : "#d97706",
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: "1px 8px",
            padding: "8px 12px",
            transition: "all 0.15s",
            "&:hover": { backgroundColor: alpha(T.primary, 0.08) },
            "&.Mui-selected": {
              backgroundColor: alpha(T.primary, isDark ? 0.14 : 0.1),
              "& .MuiListItemText-primary": {
                color: T.primary,
                fontWeight: 600,
              },
              "& .MuiListItemIcon-root": { color: T.primary },
              "&:hover": {
                backgroundColor: alpha(T.primary, isDark ? 0.2 : 0.15),
              },
            },
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: { root: { minWidth: 36, color: T.textSec } },
      },
      MuiListItemText: {
        styleOverrides: {
          primary: { fontSize: "0.875rem", fontWeight: 500 },
          secondary: { fontSize: "0.75rem", color: T.textMuted },
        },
      },
      MuiDivider: { styleOverrides: { root: { borderColor: T.borderSub } } },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: T.surface2,
            border: `1px solid ${T.borderSub}`,
            borderRadius: 14,
            backgroundImage: "none",
            minWidth: 420,
          },
          backdrop: {
            backdropFilter: "blur(6px)",
            backgroundColor: isDark
              ? alpha("#000000", 0.6)
              : alpha("#000000", 0.3),
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontSize: "1rem",
            fontWeight: 700,
            borderBottom: `1px solid ${T.borderSub}`,
            padding: "16px 20px",
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: { root: { padding: "20px 20px 8px" } },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: "12px 20px 16px",
            borderTop: `1px solid ${T.borderSub}`,
            gap: 8,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: T.surface3,
            color: T.textPri,
            fontSize: "0.72rem",
            fontWeight: 500,
            border: `1px solid ${T.borderSub}`,
            borderRadius: 6,
            boxShadow: isDark
              ? `0 8px 24px rgba(0,0,0,0.5)`
              : `0 4px 16px rgba(0,0,0,0.12)`,
            padding: "5px 10px",
          },
          arrow: { color: T.surface3 },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontSize: "0.8125rem",
            alignItems: "flex-start",
          },
          standardSuccess: {
            backgroundColor: alpha(T.success, 0.1),
            border: `1px solid ${alpha(T.success, 0.3)}`,
            color: isDark ? "#6ee7b7" : "#065f46",
          },
          standardError: {
            backgroundColor: alpha(T.error, 0.1),
            border: `1px solid ${alpha(T.error, 0.3)}`,
            color: isDark ? "#fca5a5" : "#991b1b",
          },
          standardWarning: {
            backgroundColor: alpha(T.warning, 0.1),
            border: `1px solid ${alpha(T.warning, 0.3)}`,
            color: isDark ? "#fcd34d" : "#92400e",
          },
          standardInfo: {
            backgroundColor: alpha(T.accent, 0.1),
            border: `1px solid ${alpha(T.accent, 0.3)}`,
            color: isDark ? "#67e8f9" : "#0e7490",
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: { width: 40, height: 22, padding: 0 },
          switchBase: {
            padding: 2,
            "&.Mui-checked": {
              transform: "translateX(18px)",
              color: "#fff",
              "& + .MuiSwitch-track": {
                backgroundColor: T.primary,
                opacity: 1,
                border: 0,
              },
            },
          },
          thumb: { width: 18, height: 18, boxShadow: "none" },
          track: {
            borderRadius: 11,
            backgroundColor: isDark
              ? alpha("#ffffff", 0.15)
              : alpha("#000000", 0.2),
            opacity: 1,
            transition: "background-color 0.2s",
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: T.surface3,
            border: `1px solid ${T.borderSub}`,
            borderRadius: 10,
            boxShadow: isDark
              ? `0 16px 48px rgba(0,0,0,0.7)`
              : `0 8px 32px rgba(0,0,0,0.12)`,
            minWidth: 160,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: "0.8125rem",
            fontWeight: 500,
            borderRadius: 6,
            margin: "2px 6px",
            padding: "7px 10px",
            gap: 8,
            "&:hover": { backgroundColor: alpha(T.primary, 0.1) },
            "&.Mui-selected": {
              backgroundColor: alpha(T.primary, 0.15),
              "&:hover": { backgroundColor: alpha(T.primary, 0.2) },
            },
          },
        },
      },
      MuiPagination: {
        styleOverrides: {
          root: {
            "& .MuiPaginationItem-root": {
              borderRadius: 6,
              fontSize: "0.8125rem",
            },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            height: 4,
            backgroundColor: alpha(T.primary, 0.15),
          },
          bar: { borderRadius: 4, backgroundColor: T.primary },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            fontWeight: 700,
            fontSize: "0.8125rem",
            backgroundColor: alpha(T.primary, isDark ? 0.25 : 0.15),
            color: isDark ? T.primaryLt : T.primaryDk,
          },
        },
      },
      MuiBadge: {
        styleOverrides: {
          badge: {
            fontSize: "0.65rem",
            fontWeight: 700,
            minWidth: 16,
            height: 16,
            padding: "0 4px",
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontSize: "0.8125rem",
            fontWeight: 500,
            textTransform: "none",
            minHeight: 40,
            padding: "8px 16px",
            "&.Mui-selected": { color: T.primary, fontWeight: 600 },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: { backgroundColor: T.primary, height: 2, borderRadius: 2 },
          root: { borderBottom: `1px solid ${T.borderSub}` },
        },
      },
    },
  });
}

// Backward-compat: App.js imports `adminTheme` as default (dark)
const adminTheme = buildAdminTheme("dark");
export default adminTheme;
export { DARK as BRAND, LIGHT as BRAND_LIGHT };
