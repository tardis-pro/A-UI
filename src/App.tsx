import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, IconButton, ListItem, ListItemIcon, ListItemText } from '@mui/material';
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
import { createAppTheme } from './theme/index';
import {
  RouterProvider,
  NavigationProvider,
  NavigationShortcuts
} from './navigation';
import { useTheme, useAppDispatch, useLayout } from './state';

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
          <CheckCircle color="success" />
        </ListItemIcon>
        <ListItemText
          primary="System Status"
          secondary="All systems operational"
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

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NavigationProvider>
        <LayoutProvider>
          <RouterProvider />
          <NavigationShortcuts />
          <ThemeToggle />
        </LayoutProvider>
      </NavigationProvider>
    </ThemeProvider>
  );
};

export default App;
