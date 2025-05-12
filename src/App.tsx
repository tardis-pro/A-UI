import React, { useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, IconButton, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import {
  Brightness4,
  Brightness7,
  Notifications,
  CheckCircle,
  Error
} from '@mui/icons-material';
import {
  Layout,
  LayoutProvider,
  Sidebar,
} from './components/layout';
import CodeSearch from './components/CodeSearch/CodeSearch';
import { createAppTheme } from './theme/index';
import {
  NavigationProvider,
  NavigationShortcuts
} from './navigation';
import { useTheme, useLayout } from './state';
import { useAppDispatch } from './state/hooks/core';
import ErrorBoundary from './components/ErrorBoundary';
import ApiStatusIndicator from './components/ApiStatusIndicator';
import { wsService } from './services/websocket';

const ThemeToggle = () => {
  const { mode } = useTheme();
  const dispatch = useAppDispatch();

  return (
    <IconButton
      onClick={() => dispatch({ type: 'theme/toggleThemeMode' })}
      color="inherit"
      sx={{ position: 'absolute', right: 2, top: 2 }}
    >
      {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
    </IconButton>
  );
};

const RightSidebar = () => (
  <Sidebar
    position="right"
    title="Details"
  >
    <Sidebar.Section title="Status">
      <ListItem>
        <ListItemIcon>
          <ApiStatusIndicator />
        </ListItemIcon>
        <ListItemText
          primary="API Status"
          secondary={<ApiStatusIndicator showDetails />}
        />
      </ListItem>
      <ListItem>
        <ListItemIcon>
          <Notifications color="info" />
        </ListItemIcon>
        <ListItemText
          primary="Notifications"
          secondary="3 unread messages"
        />
      </ListItem>
      <ListItem>
        <ListItemIcon>
          <Error color="warning" />
        </ListItemIcon>
        <ListItemText
          primary="Warnings"
          secondary="2 minor issues"
        />
      </ListItem>
    </Sidebar.Section>
  </Sidebar>
);

const App: React.FC = () => {
  const { mode } = useTheme();
  const theme = React.useMemo(() => createAppTheme(mode), [mode]);

  // Initialize WebSocket connection
  useEffect(() => {
    wsService.connect();

    return () => {
      wsService.disconnect();
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <NavigationProvider>
            <LayoutProvider>
              <Layout>
                <NavigationShortcuts />
                <ThemeToggle />
                <CodeSearch />
                <RightSidebar />
              </Layout>
            </LayoutProvider>
          </NavigationProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
