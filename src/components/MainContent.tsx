import React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import ActivityFeed from './ActivityFeed';
import NotificationList from './NotificationList';

const MainContainer = styled(Box)({
  flex: 1,
  padding: 20,
  backgroundColor: '#1E1E2E',
  overflowY: 'auto',
});

const ContentSection = styled(Paper)({
  padding: 20,
  marginBottom: 20,
  backgroundColor: '#313244',
  borderRadius: 10,
});

const MetricCard = styled(Paper)({
  padding: 15,
  backgroundColor: '#45475A',
  borderRadius: 8,
  textAlign: 'center',
  height: '100%',
});

const MetricValue = styled(Typography)({
  color: '#89B4FA',
  fontSize: 24,
  fontWeight: 'bold',
  marginTop: 10,
});

const MetricLabel = styled(Typography)({
  color: '#CDD6F4',
  fontSize: 14,
});

const UpdateCard = styled(Paper)({
  padding: 15,
  backgroundColor: '#45475A',
  borderRadius: 8,
  marginBottom: 10,
});

const UpdateTitle = styled(Typography)({
  color: '#F9E2AF',
  fontSize: 14,
  fontWeight: 'bold',
});

const UpdateDescription = styled(Typography)({
  color: '#CDD6F4',
  fontSize: 12,
  marginTop: 5,
});

const UpdateTime = styled(Typography)({
  color: '#7F849C',
  fontSize: 10,
  textAlign: 'right',
});

const metrics = [
  { label: 'Files', value: '324', color: '#89B4FA' },
  { label: 'Open Issues', value: '12', color: '#F38BA8' },
  { label: 'Code Quality', value: 'A+', color: '#A6E3A1' },
];

const updates = [
  {
    title: 'Authentication middleware updated',
    description: 'Switched from JWT to session-based auth',
    time: '2h ago',
  },
  {
    title: 'New API endpoint for user profiles',
    description: 'GET /api/v2/users/:id/profile added',
    time: '4h ago',
  },
  {
    title: 'Database schema update',
    description: 'Added timestamps to transactions table',
    time: '1d ago',
  },
];

const commandData = [
  { name: 'git', value: 10 },
  { name: 'npm', value: 20 },
  { name: 'ls', value: 30 },
  { name: 'cd', value: 40 },
  { name: 'node', value: 50 },
  { name: 'docker', value: 25 },
  { name: 'yarn', value: 15 },
  { name: 'jest', value: 5 },
];

const initialActivities = [
  { id: 1, message: 'User A created a new project', timestamp: '2024-01-01T12:00:00.000Z' },
  { id: 2, message: 'User B commented on a task', timestamp: '2024-01-01T12:30:00.000Z' },
  { id: 3, message: 'User C completed a sprint', timestamp: '2024-01-01T13:00:00.000Z' },
];

const MainContent: React.FC = () => {
  return (
    <MainContainer>
      <ContentSection>
        <Typography variant="h6" sx={{ color: '#CDD6F4', mb: 2 }}>
          Project Overview
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
          {metrics.map((metric) => (
            <MetricCard key={metric.label}>
              <MetricLabel>{metric.label}</MetricLabel>
              <MetricValue sx={{ color: metric.color }}>{metric.value}</MetricValue>
            </MetricCard>
          ))}
        </Box>
      </ContentSection>

      <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 2 }}>
        <ContentSection>
          <Typography variant="h6" sx={{ color: '#CDD6F4', mb: 2 }}>
            Recent Knowledge Updates
          </Typography>
          {updates.map((update, index) => (
            <UpdateCard key={index}>
              <UpdateTitle>{update.title}</UpdateTitle>
              <UpdateDescription>{update.description}</UpdateDescription>
              <UpdateTime>{update.time}</UpdateTime>
            </UpdateCard>
          ))}
        </ContentSection>

        <ContentSection>
          <Typography variant="h6" sx={{ color: '#CDD6F4', mb: 2 }}>
            Deployments
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {['Production', 'Staging', 'Development'].map((env) => (
              <Paper
                key={env}
                sx={{
                  p: 1.5,
                  backgroundColor: '#45475A',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography sx={{ color: '#CDD6F4', fontSize: 14 }}>{env}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: env === 'Production' ? '#A6E3A1' : env === 'Staging' ? '#89B4FA' : '#F38BA8',
                    }}
                  />
                  <Typography sx={{ color: env === 'Production' ? '#A6E3A1' : env === 'Staging' ? '#89B4FA' : '#F38BA8', fontSize: 12 }}>
                    {env === 'Production' ? 'v2.4.1' : env === 'Staging' ? 'v2.5.0' : 'Building'}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </ContentSection>
      </Box>

      <ContentSection>
        <Typography variant="h6" sx={{ color: '#CDD6F4', mb: 2 }}>
          Command History Analytics
        </Typography>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={commandData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#45475A" />
              <XAxis dataKey="name" stroke="#CDD6F4" />
              <YAxis stroke="#CDD6F4" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#313244',
                  border: 'none',
                  borderRadius: 8,
                  color: '#CDD6F4',
                }}
              />
              <Bar dataKey="value" fill="#89B4FA" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </ContentSection>
      <ContentSection>
        <ActivityFeed initialActivities={initialActivities} />
      </ContentSection>
      <ContentSection>
        <NotificationList />
      </ContentSection>
    </MainContainer>
  );
};

export default MainContent;