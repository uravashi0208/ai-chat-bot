import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00a884',
      light: '#00cf9e',
      dark: '#007a60',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8b5cf6',
      light: '#a78bfa',
      dark: '#6d28d9',
    },
    background: {
      default: '#0a0f14',
      paper: '#111b21',
      elevated: '#1e2a33',
      sidebar: '#111b21',
      chatPanel: '#0d1418',
      bubble: {
        own: '#005c4b',
        other: '#1e2a33',
      },
    },
    text: {
      primary: '#e9edef',
      secondary: '#8696a0',
      disabled: '#555a72',
    },
    divider: 'rgba(134,150,160,0.15)',
    success: { main: '#00a884' },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    info: { main: '#3b82f6' },
    action: {
      hover: 'rgba(134,150,160,0.08)',
      selected: 'rgba(0,168,132,0.15)',
      active: '#00a884',
    },
  },
  typography: {
    fontFamily: '"DM Sans", "Segoe UI", system-ui, sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.02em' },
    h3: { fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 500, fontSize: '0.8rem' },
    body1: { fontSize: '0.9375rem', lineHeight: 1.5 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.4 },
    caption: { fontSize: '0.75rem', color: 'inherit' },
    button: { fontWeight: 600, letterSpacing: '0.01em', textTransform: 'none' },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0 1px 3px rgba(0,0,0,0.4)',
    '0 2px 6px rgba(0,0,0,0.4)',
    '0 4px 12px rgba(0,0,0,0.4)',
    '0 6px 20px rgba(0,0,0,0.45)',
    '0 8px 28px rgba(0,0,0,0.5)',
    ...Array(19).fill('0 16px 48px rgba(0,0,0,0.55)'),
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body {
          background-color: #0a0f14;
          color: #e9edef;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: rgba(134,150,160,0.25);
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover { background: rgba(134,150,160,0.4); }
      `,
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          fontSize: '0.9rem',
          padding: '10px 20px',
          transition: 'all 0.2s',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #00a884, #00cf9e)',
          '&:hover': {
            background: 'linear-gradient(135deg, #008f71, #00b589)',
            transform: 'translateY(-1px)',
            boxShadow: '0 6px 20px rgba(0,168,132,0.35)',
          },
          '&:active': { transform: 'translateY(0)' },
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: 'rgba(134,150,160,0.06)',
            '& fieldset': { borderColor: 'rgba(134,150,160,0.2)' },
            '&:hover fieldset': { borderColor: 'rgba(134,150,160,0.4)' },
            '&.Mui-focused fieldset': { borderColor: '#00a884', borderWidth: 1.5 },
          },
          '& .MuiInputBase-input': { color: '#e9edef' },
          '& .MuiInputLabel-root': { color: '#8696a0' },
          '& .MuiInputLabel-root.Mui-focused': { color: '#00a884' },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.15s',
          '&:hover': { backgroundColor: 'rgba(134,150,160,0.1)' },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.9rem',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          transition: 'background-color 0.15s',
          '&:hover': { backgroundColor: 'rgba(134,150,160,0.07)' },
          '&.Mui-selected': {
            backgroundColor: 'rgba(0,168,132,0.12)',
            '&:hover': { backgroundColor: 'rgba(0,168,132,0.18)' },
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: 'rgba(134,150,160,0.12)' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1e2a33',
          borderRadius: 16,
          border: '1px solid rgba(134,150,160,0.15)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1e2a33',
          color: '#e9edef',
          fontSize: '0.75rem',
          border: '1px solid rgba(134,150,160,0.2)',
          borderRadius: 8,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#233138',
          border: '1px solid rgba(134,150,160,0.15)',
          borderRadius: 12,
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          borderRadius: 6,
          margin: '2px 6px',
          '&:hover': { backgroundColor: 'rgba(134,150,160,0.1)' },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: { width: 48, height: 28, padding: 0 },
        switchBase: {
          padding: 4,
          '&.Mui-checked': {
            color: '#fff',
            '& + .MuiSwitch-track': { backgroundColor: '#00a884', opacity: 1 },
          },
        },
        thumb: { width: 20, height: 20 },
        track: {
          borderRadius: 14,
          backgroundColor: 'rgba(134,150,160,0.3)',
          opacity: 1,
        },
      },
    },
  },
});

export default theme;
