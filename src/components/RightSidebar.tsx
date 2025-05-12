import React from 'react';
import ActivityFeed from './ActivityFeed';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import LinearProgress from '@mui/material/LinearProgress';

const RightSidebarContainer = styled(Box)({
  width: 260,
  backgroundColor: '#181825',
  borderLeft: '1px solid #313244',
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
});

const SearchField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#313244',
    '& fieldset': {
      borderColor: '#45475A',
    },
    '&:hover fieldset': {
      borderColor: '#89B4FA',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#89B4FA',
    },
    '& input': {
      color: '#CDD6F4',
    },
  },
});

const QuickAccessButton = styled(Paper)({
  padding: 12,
  backgroundColor: '#45475A',
  borderRadius: 8,
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: '#313244',
  },
});

const ActivityCard = styled(Paper)({
  padding: 12,
  backgroundColor: '#313244',
  borderRadius: 8,
  marginBottom: 8,
});

const ActivityTitle = styled(Typography)({
  color: '#CDD6F4',
  fontSize: 12,
  marginBottom: 4,
});

const ActivityFile = styled(Typography)({
  color: '#7F849C',
  fontSize: 10,
});

const StatusIndicator = styled(FiberManualRecordIcon)(({ color }: { color: 'success' | 'warning' | 'error' }) => ({
  color: color === 'success' ? '#A6E3A1' : color === 'warning' ? '#FAB387' : '#F38BA8',
  fontSize: 12,
  marginRight: 8,
}));

const quickAccessItems = [
  'Open AI Assistant',
  'Recent Files',
  'Active Issues',
];

const recentActivities = [
  {
    title: 'Updated user authentication',
    file: 'auth/middleware.js',
  },
  {
    title: 'Fixed API pagination bug',
    file: 'api/controllers/users.js',
  },
  {
    title: 'Added new test cases',
    file: 'tests/integration/auth.test.js',
  },
];

const aiModels = [
  { name: 'Mistral-7B (Local)', status: '#A6E3A1' },
  { name: 'Qwen-1.5 (Local)', status: '#F9E2AF' },
  { name: 'Claude 3.5 (Available)', status: '#89B4FA' },
];

const RightSidebar: React.FC = () => {
  return (
    <RightSidebarContainer>
      <SearchField
        fullWidth
        placeholder="Search code..."
        variant="outlined"
        size="small"
      />

      <Box>
        <Typography variant="h6" sx={{ color: '#CDD6F4', mb: 2 }}>
          Quick Access
        </Typography>
        {quickAccessItems.map((item) => (
          <QuickAccessButton key={item}>
            <Typography sx={{ color: '#CDD6F4', fontSize: 14 }}>
              {item}
            </Typography>
          </QuickAccessButton>
        ))}
      </Box>

      <Box>
        <Typography variant="h6" sx={{ color: '#CDD6F4', mb: 2 }}>
          Recent Activity
        </Typography>
        {recentActivities.map((activity, index) => (
          <ActivityCard key={index}>
            <ActivityTitle>{activity.title}</ActivityTitle>
            <ActivityFile>{activity.file}</ActivityFile>
          </ActivityCard>
        ))}
      </Box>

      <Box>
        <Typography variant="h6" sx={{ color: '#CDD6F4', mb: 2 }}>
          AI Status
        </Typography>
        <Paper sx={{ p: 2, backgroundColor: '#313244', borderRadius: 1 }}>
          <Typography sx={{ color: '#CDD6F4', fontSize: 12, mb: 1 }}>
            Active Models:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <StatusIndicator color="success" />
            <Box component="span" sx={{ color: '#CDD6F4', fontSize: 12 }}>
              Local LLM: Mistral 7B
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <StatusIndicator color="warning" />
            <Box component="span" sx={{ color: '#CDD6F4', fontSize: 12 }}>
              Remote LLM: GPT-4
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <StatusIndicator color="error" />
            <Box component="span" sx={{ color: '#CDD6F4', fontSize: 12 }}>
              Code Assistant: Offline
            </Box>
          </Box>

          <Typography sx={{ color: '#CDD6F4', fontSize: 12, mt: 2, mb: 1 }}>
            Context Size:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ flex: 1 }}>
              <LinearProgress
                variant="determinate"
                value={60}
                sx={{
                  backgroundColor: '#45475A',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#89B4FA',
                  },
                }}
              />
            </Box>
            <Typography sx={{ color: '#CDD6F4', fontSize: 10 }}>
              60%
            </Typography>
          </Box>
        </Paper>
      </Box>
      <Box>
        <Typography variant="h6" sx={{ color: '#CDD6F4', mb: 2 }}>
          Activity Feed
        </Typography>
        <ActivityFeed initialActivities={[]} />
      </Box>
    </RightSidebarContainer>
  );
};

export default RightSidebar; 