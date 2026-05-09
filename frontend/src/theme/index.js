import { createTheme } from "@mui/material/styles";
import { COLOR, GRADIENT, RADIUS, FONT, SHADOW } from "./tokens";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: COLOR.primary,
      light: COLOR.primaryLight,
      dark: COLOR.primaryDark,
      contrastText: COLOR.textOnPrimary,
    },
    secondary: {
      main: COLOR.accent,
      light: COLOR.accentLight,
      contrastText: COLOR.textOnPrimary,
    },
    background: {
      default: COLOR.bgPage,
      paper: COLOR.bgCard,
      elevated: COLOR.bgCard,
      chatPanel: COLOR.bgChatPanel,
    },
    text: {
      primary: COLOR.textPrimary,
      secondary: COLOR.textSecondary,
      disabled: COLOR.textDisabled,
    },
    divider: COLOR.border,
    success: { main: COLOR.success },
    error: { main: COLOR.error },
    warning: { main: COLOR.warning },
    info: { main: COLOR.info },
    action: {
      hover: COLOR.bgHover,
      selected: COLOR.bgSelected,
      active: COLOR.primary,
    },
  },
  typography: {
    fontFamily: FONT.family,
    h1: { fontWeight: FONT.weight.bold, letterSpacing: "-0.02em" },
    h2: { fontWeight: FONT.weight.bold, letterSpacing: "-0.02em" },
    h3: { fontWeight: FONT.weight.semibold, letterSpacing: "-0.01em" },
    h4: { fontWeight: FONT.weight.semibold },
    h5: { fontWeight: FONT.weight.semibold },
    h6: { fontWeight: FONT.weight.semibold },
    body1: { fontSize: FONT.size.base, lineHeight: 1.55 },
    body2: { fontSize: FONT.size.sm, lineHeight: 1.45 },
    caption: { fontSize: FONT.size.xs },
    button: {
      fontWeight: FONT.weight.semibold,
      letterSpacing: "0.01em",
      textTransform: "none",
    },
  },
  shape: { borderRadius: RADIUS.md },
  shadows: [
    "none",
    "0 1px 3px rgba(0,0,0,0.06)",
    SHADOW.card,
    "0 2px 8px rgba(0,0,0,0.08)",
    SHADOW.elevated,
    "0 8px 24px rgba(0,0,0,0.12)",
    ...Array(19).fill("0 16px 48px rgba(0,0,0,0.14)"),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body {
          background: ${COLOR.bgPage};
          color: ${COLOR.textPrimary};
          margin: 0; padding: 0;
          -webkit-font-smoothing: antialiased;
        }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.22); }
      `,
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: RADIUS.full,
          fontWeight: FONT.weight.semibold,
          padding: "10px 24px",
          transition: "all 0.2s",
        },
        containedPrimary: {
          background: COLOR.primary,
          boxShadow: SHADOW.button,
          "&:hover": {
            background: COLOR.primaryDark,
            transform: "translateY(-1px)",
            boxShadow: "0 4px 16px rgba(0,168,132,0.35)",
          },
          "&:active": { transform: "translateY(0)" },
          "&.Mui-disabled": {
            background: "#e5e7eb",
            color: "#9ca3af",
            boxShadow: "none",
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: "outlined", size: "small" },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: RADIUS.full,
            backgroundColor: COLOR.bgInput,
            "& fieldset": { borderColor: COLOR.border },
            "&:hover fieldset": { borderColor: "#c4c9d4" },
            "&.Mui-focused fieldset": {
              borderColor: COLOR.borderFocus,
              borderWidth: 1.5,
            },
          },
          "& .MuiInputBase-input": { color: COLOR.textPrimary },
          "& .MuiInputLabel-root": { color: COLOR.textSecondary },
          "& .MuiInputLabel-root.Mui-focused": { color: COLOR.primary },
        },
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: "none" } } },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: "50%",
          transition: "all 0.15s",
          "&:hover": { backgroundColor: "rgba(0,0,0,0.06)" },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: { fontWeight: FONT.weight.semibold, fontSize: FONT.size.sm },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          transition: "background-color 0.12s",
          "&:hover": { backgroundColor: "#f5f6f6" },
          "&.Mui-selected": {
            backgroundColor: COLOR.bgSelected,
            "&:hover": { backgroundColor: "#eaeaea" },
          },
        },
      },
    },
    MuiDivider: { styleOverrides: { root: { borderColor: COLOR.border } } },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: RADIUS.lg,
          border: `1px solid ${COLOR.border}`,
          boxShadow: SHADOW.elevated,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: RADIUS.full,
          fontWeight: FONT.weight.medium,
          fontSize: FONT.size.xs,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: COLOR.textPrimary,
          color: "#fff",
          fontSize: FONT.size.xs,
          borderRadius: RADIUS.xs + 2,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: RADIUS.md,
          border: `1px solid ${COLOR.border}`,
          boxShadow: SHADOW.elevated,
          backgroundColor: COLOR.bgCard,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: FONT.size.sm,
          borderRadius: RADIUS.xs,
          margin: "2px 6px",
          "&:hover": { backgroundColor: COLOR.bgHover },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: { width: 48, height: 28, padding: 0 },
        switchBase: {
          padding: 4,
          "&.Mui-checked": {
            color: "#fff",
            "& + .MuiSwitch-track": {
              backgroundColor: COLOR.primary,
              opacity: 1,
            },
          },
        },
        thumb: { width: 20, height: 20 },
        track: { borderRadius: 14, backgroundColor: "#cbd5e1", opacity: 1 },
      },
    },
  },
});

export default theme;
