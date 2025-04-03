import React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CodeIcon from '@mui/icons-material/Code';
import BookIcon from '@mui/icons-material/Book';
import HistoryIcon from '@mui/icons-material/History';
import BuildIcon from '@mui/icons-material/Build';
import SettingsIcon from '@mui/icons-material/Settings';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

const SidebarContainer = styled(Box)({
  width: 220,
  backgroundColor: '#181825',
  borderRight: '1px solid #313244',
  display: 'flex',
  flexDirection: 'column',
});

const Logo = styled(Box)({
  height: 60,
  backgroundColor: '#313244',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#CDD6F4',
  fontSize: 20,
  fontWeight: 'bold',
});

const MenuItem = styled(ListItem)(({ theme }) => ({
  margin: '8px 15px',
  borderRadius: 8,
  '&.active': {
    backgroundColor: '#45475A',
  },
  '&:hover': {
    backgroundColor: '#45475A',
  },
}));

const StatusIndicator = styled(FiberManualRecordIcon)(({ color }: { color: 'success' | 'warning' | 'error' }) => ({
  color: color === 'success' ? '#A6E3A1' : color === 'warning' ? '#FAB387' : '#F38BA8',
  fontSize: 12,
  marginRight: 8,
}));

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, active: true },
  { text: 'Code Assistant', icon: <CodeIcon /> },
  { text: 'Knowledge Base', icon: <BookIcon /> },
  { text: 'Command History', icon: <HistoryIcon /> },
  { text: 'CI/CD Monitor', icon: <BuildIcon /> },
  { text: 'Settings', icon: <SettingsIcon /> },
];

const Sidebar: React.FC = () => {
  return (
    <SidebarContainer>
      <Logo>AUI</Logo>
      <List sx={{ flex: 1 }}>
        {menuItems.map((item) => (
          <MenuItem key={item.text} className={item.active ? 'active' : ''}>
            <ListItemIcon sx={{ color: '#CDD6F4' }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </MenuItem>
        ))}
      </List>
      <Box sx={{ p: 2, backgroundColor: '#313244', m: 2, borderRadius: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <StatusIndicator color="success" />
          <Box component="span" sx={{ color: '#CDD6F4', fontSize: 12 }}>
            Local LLM: Mistral 7B
          </Box>
        </Box>
      </Box>
    </SidebarContainer>
  );
};

export default Sidebar; 