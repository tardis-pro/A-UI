import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#89B4FA',
      light: '#BAC2DE',
      dark: '#45475A',
    },
    secondary: {
      main: '#A6E3A1',
      light: '#F9E2AF',
      dark: '#F38BA8',
    },
    background: {
      default: '#1E1E2E',
      paper: '#181825',
    },
    text: {
      primary: '#CDD6F4',
      secondary: '#BAC2DE',
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '1rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          background: 'rgba(49, 50, 68, 0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(205, 214, 244, 0.1)',
        },
      },
    },
  },
});

export default theme; 