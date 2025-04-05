import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Paper, Chip, IconButton, LinearProgress, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const PipelineCard = styled(Paper)(({ theme }) => ({
  background: '#313244',
  borderRadius: '12px',
  padding: theme.spacing(3),
  border: '1px solid rgba(205, 214, 244, 0.1)',
}));

const StageChip = styled(Chip)(({ status }: { status: 'success' | 'running' | 'pending' | 'failed' }) => {
  const colors = {
    success: '#A6E3A1',
    running: '#89B4FA',
    pending: '#F9E2AF',
    failed: '#F38BA8',
  };
  return {
    backgroundColor: `${colors[status]}20`,
    color: colors[status],
    borderRadius: '8px',
    '& .MuiChip-icon': {
      color: 'inherit',
    },
  };
});

const pipelines = [
  {
    name: 'Auth Service',
    branch: 'main',
    commit: 'feat: implement refresh token rotation',
    stages: [
      { name: 'Build', status: 'success', duration: '1m 23s' },
      { name: 'Test', status: 'success', duration: '2m 45s' },
      { name: 'Lint', status: 'success', duration: '42s' },
      { name: 'Security', status: 'success', duration: '1m 12s' },
      { name: 'Deploy', status: 'running', duration: '1m 30s' },
    ],
    author: 'Sarah Chen',
    startedAt: '3 minutes ago',
  },
  {
    name: 'API Gateway',
    branch: 'feature/rate-limiting',
    commit: 'feat: implement redis-based rate limiting',
    stages: [
      { name: 'Build', status: 'success', duration: '1m 12s' },
      { name: 'Test', status: 'failed', duration: '1m 45s' },
      { name: 'Lint', status: 'pending', duration: '-' },
      { name: 'Security', status: 'pending', duration: '-' },
      { name: 'Deploy', status: 'pending', duration: '-' },
    ],
    author: 'Mike Johnson',
    startedAt: '5 minutes ago',
  },
  {
    name: 'Frontend App',
    branch: 'main',
    commit: 'fix: resolve memory leak in useEffect',
    stages: [
      { name: 'Build', status: 'success', duration: '45s' },
      { name: 'Test', status: 'success', duration: '1m 30s' },
      { name: 'Lint', status: 'success', duration: '35s' },
      { name: 'Security', status: 'success', duration: '55s' },
      { name: 'Deploy', status: 'success', duration: '2m 10s' },
    ],
    author: 'Alex Wong',
    startedAt: '12 minutes ago',
  },
];

const deployments = [
  {
    environment: 'Production',
    status: 'success',
    version: 'v2.4.1',
    health: 100,
    lastDeployed: '2 hours ago',
  },
  {
    environment: 'Staging',
    status: 'running',
    version: 'v2.5.0-rc.1',
    health: 95,
    lastDeployed: '15 minutes ago',
  },
  {
    environment: 'Development',
    status: 'failed',
    version: 'v2.5.0-dev',
    health: 65,
    lastDeployed: '5 minutes ago',
  },
];

const CICDMonitor: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon fontSize="small" />;
      case 'running':
        return <BuildIcon fontSize="small" />;
      case 'failed':
        return <ErrorIcon fontSize="small" />;
      default:
        return <PendingIcon fontSize="small" />;
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ color: '#CDD6F4', fontWeight: 600 }}>
          CI/CD Monitor
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            sx={{
              backgroundColor: '#A6E3A1',
              color: '#1E1E2E',
              '&:hover': {
                backgroundColor: '#94E2BA',
              },
            }}
          >
            New Build
          </Button>
          <IconButton
            onClick={handleRefresh}
            sx={{
              color: '#89B4FA',
              backgroundColor: 'rgba(137, 180, 250, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(137, 180, 250, 0.2)',
              },
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 4 }}>
        {/* Pipelines */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {pipelines.map((pipeline, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <PipelineCard>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Box>
                    <Typography sx={{ color: '#CDD6F4', fontWeight: 600, mb: 1 }}>
                      {pipeline.name}
                    </Typography>
                    <Typography sx={{ color: '#7F849C', fontSize: '0.9rem' }}>
                      {pipeline.branch} • {pipeline.commit}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{ color: '#7F849C', fontSize: '0.8rem' }}>
                        {pipeline.author}
                      </Typography>
                      <Typography sx={{ color: '#7F849C', fontSize: '0.8rem' }}>
                        {pipeline.startedAt}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  {pipeline.stages.map((stage, i) => (
                    <StageChip
                      key={i}
                      label={stage.duration}
                      status={stage.status as any}
                      icon={getStatusIcon(stage.status)}
                    />
                  ))}
                </Box>
              </PipelineCard>
            </motion.div>
          ))}
        </Box>

        {/* Deployments */}
        <PipelineCard>
          <Typography sx={{ color: '#CDD6F4', fontWeight: 600, mb: 3 }}>
            Deployments
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {deployments.map((deployment, index) => (
              <Paper
                key={index}
                sx={{
                  p: 2,
                  background: '#45475A',
                  borderRadius: '8px',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography sx={{ color: '#CDD6F4', fontWeight: 500 }}>
                    {deployment.environment}
                  </Typography>
                  <StageChip
                    label={deployment.version}
                    status={deployment.status as any}
                    size="small"
                  />
                </Box>

                <Box sx={{ mb: 1 }}>
                  <Typography sx={{ color: '#7F849C', fontSize: '0.8rem', mb: 0.5 }}>
                    Health
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={deployment.health}
                    sx={{
                      backgroundColor: '#313244',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: deployment.health > 90 ? '#A6E3A1' : 
                                       deployment.health > 70 ? '#F9E2AF' : '#F38BA8',
                      },
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#7F849C', fontSize: '0.8rem' }}>
                  <AccessTimeIcon sx={{ fontSize: '0.9rem' }} />
                  <Typography variant="caption">
                    Last deployed {deployment.lastDeployed}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </PipelineCard>
      </Box>
    </Box>
  );
};

export default CICDMonitor; 