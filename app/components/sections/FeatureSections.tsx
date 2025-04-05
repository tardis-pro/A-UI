import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import CodeAssistant from './CodeAssistant';
import KnowledgeBase from './KnowledgeBase';
import CommandHistory from './CommandHistory';
import CICDMonitor from './CICDMonitor';

const StyledTabs = styled(Tabs)(({ theme }) => ({
  borderBottom: '1px solid #313244',
  '& .MuiTabs-indicator': {
    backgroundColor: '#89B4FA',
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  color: '#7F849C',
  '&.Mui-selected': {
    color: '#89B4FA',
  },
  '&:hover': {
    color: '#CDD6F4',
  },
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`feature-tabpanel-${index}`}
      aria-labelledby={`feature-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
};

const FeatureSections: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ background: '#1E1E2E', minHeight: '100vh' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <StyledTabs
          value={value}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ px: 4 }}
        >
          <StyledTab label="Code Assistant" />
          <StyledTab label="Knowledge Base" />
          <StyledTab label="Command History" />
          <StyledTab label="CI/CD Monitor" />
        </StyledTabs>
      </Box>
      
      <TabPanel value={value} index={0}>
        <CodeAssistant />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <KnowledgeBase />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <CommandHistory />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <CICDMonitor />
      </TabPanel>
    </Box>
  );
};

export default FeatureSections; 