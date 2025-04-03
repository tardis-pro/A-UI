import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import RightSidebar from './components/RightSidebar';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#89B4FA',
    },
    secondary: {
      main: '#F38BA8',
    },
    background: {
      default: '#1E1E2E',
      paper: '#313244',
    },
    text: {
      primary: '#CDD6F4',
      secondary: '#7F849C',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});

const AppContainer = styled(Box)({
  display: 'flex',
  minHeight: '100vh',
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContainer>
        <Sidebar />
        <MainContent />
        <RightSidebar />
      </AppContainer>
    </ThemeProvider>
  );
};

export default App; 