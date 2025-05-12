import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Paper, Chip, IconButton, LinearProgress, TextField, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { getCommandHistory } from '../services/api';
import AutomationIcon from '@mui/icons-material/AutoFixHigh';
import TerminalIcon from '@mui/icons-material/Terminal';
import TimerIcon from '@mui/icons-material/Timer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface KnowledgeItemModel {
  id: string;
  content: string;
}

const CommandCard = styled(Paper)(({ theme }) => ({
  background: '#313244',
  borderRadius: '12px',
  padding: theme.spacing(3),
  border: '1px solid rgba(205, 214, 244, 0.1)',
}));

const TerminalWindow = styled(Paper)(({ theme }) => ({
  background: '#181825',
  borderRadius: '8px',
  padding: theme.spacing(2),
  fontFamily: 'monospace',
  color: '#CDD6F4',
  marginTop: theme.spacing(2),
}));

const commandData = [
  { name: 'git', count: 156, time: '2.3s' },
  { name: 'npm', count: 89, time: '5.1s' },
  { name: 'docker', count: 45, time: '3.8s' },
  { name: 'kubectl', count: 34, time: '1.2s' },
  { name: 'yarn', count: 67, time: '4.5s' },
  { name: 'node', count: 78, time: '0.9s' },
];

const automationPatterns = [
  {
    name: 'Git Flow Automation',
    commands: ['git checkout -b feature/', 'git add .', 'git commit -m', 'git push origin'],
    frequency: 85,
    timesSaved: 156,
    timeSaved: '5.2 hours',
  },
  {
    name: 'Docker Dev Environment',
    commands: ['docker-compose up -d', 'docker exec -it', 'docker logs -f'],
    frequency: 65,
    timesSaved: 89,
    timeSaved: '3.8 hours',
  },
  {
    name: 'NPM Package Management',
    commands: ['npm install', 'npm run build', 'npm run test', 'npm run lint'],
    frequency: 45,
    timesSaved: 67,
    timeSaved: '2.1 hours',
  },
];

const CommandHistory: React.FC = () => {
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [selectedPattern, setSelectedPattern] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeItemModel[]>([]);

  useEffect(() => {
    const fetchCommandHistory = async () => {
      try {
        const history = await getCommandHistory();
        setCommandHistory(history);
      } catch (error) {
        console.error('Error fetching command history:', error);
      }
    };

    fetchCommandHistory();
  }, []);

  const handleSearch = async () => {
    try {
      const response = await fetch('/api/command_history/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await response.json();
      setSearchResults(data.results);
    } catch (error) {
      console.error('Error searching command history:', error);
    }
  };

  const handleReplayCommand = async (itemId: string) => {
    try {
      const response = await fetch('/api/command_history/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId: itemId }),
      });
      const data = await response.json();
      console.log('Command execution result:', data);
      // Handle the result (e.g., display a message)
    } catch (error) {
      console.error('Error re-executing command:', error);
      // Handle the error (e.g., display an error message)
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ color: '#CDD6F4', mb: 2, fontWeight: 600 }}>
        Command History
      </Typography>

      {/* Search Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <TextField
          label="Search Commands"
          variant="outlined"
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ background: '#313244', borderRadius: '8px', input: { color: '#CDD6F4' } }}
        />
        <Button variant="contained" color="primary" onClick={handleSearch}>
          Search
        </Button>
      </Box>

      {/* Search Results */}
      <Box>
        {searchResults.map((result: KnowledgeItemModel) => (
          <Paper key={result.id} sx={{ p: 2, mb: 1, background: '#313244', borderRadius: '8px' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ color: '#CDD6F4', fontWeight: 500 }}>
                {result.content}
              </Typography>
              <IconButton
                size="small"
                sx={{
                  color: '#A6E3A1',
                  backgroundColor: 'rgba(166, 227, 161, 0.1)',
                  '&:hover': {
                    backgroundColor: 'rgba(166, 227, 161, 0.2)',
                  },
                }}
                onClick={() => handleReplayCommand(result.id)}
              >
                <PlayArrowIcon />
              </IconButton>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Command History List */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" sx={{ color: '#CDD6F4', mb: 2, fontWeight: 600 }}>
          Recent Commands
        </Typography>
        <Paper sx={{ p: 2, background: '#313244', borderRadius: '8px' }}>
          {commandHistory.map((command, index) => (
            <Typography key={index} sx={{ color: '#CDD6F4', mb: 1 }}>
              {command}
            </Typography>
          ))}
        </Paper>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {/* Command Analytics */}
        <CommandCard>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <TerminalIcon sx={{ color: '#89B4FA' }} />
            <Typography sx={{ color: '#CDD6F4', fontWeight: 600 }}>
              Command Analytics
            </Typography>
          </Box>

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
                <Bar dataKey="count" fill="#89B4FA" />
              </BarChart>
            </ResponsiveContainer>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Box>
              <Typography sx={{ color: '#7F849C', fontSize: '0.9rem' }}>
                Total Commands
              </Typography>
              <Typography sx={{ color: '#CDD6F4', fontSize: '1.5rem', fontWeight: 600 }}>
                469
              </Typography>
            </Box>
            <Box>
              <Typography sx={{ color: '#7F849C', fontSize: '0.9rem' }}>
                Avg. Time Saved
              </Typography>
              <Typography sx={{ color: '#A6E3A1', fontSize: '1.5rem', fontWeight: 600 }}>
                11.1 hours
              </Typography>
            </Box>
          </Box>
        </CommandCard>

        {/* Automation Patterns */}
        <CommandCard>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <AutomationIcon sx={{ color: '#F9E2AF' }} />
            <Typography sx={{ color: '#CDD6F4', fontWeight: 600 }}>
              Automation Patterns
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {automationPatterns.map((pattern, index) => (
              <Paper
                key={index}
                sx={{
                  p: 2,
                  background: index === selectedPattern ? '#45475A' : '#313244',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: '#45475A',
                  },
                }}
                onClick={() => setSelectedPattern(index)}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography sx={{ color: '#CDD6F4', fontWeight: 500 }}>
                    {pattern.name}
                  </Typography>
                  <IconButton
                    size="small"
                    sx={{
                      color: '#A6E3A1',
                      backgroundColor: 'rgba(166, 227, 161, 0.1)',
                      '&:hover': {
                        backgroundColor: 'rgba(166, 227, 161, 0.2)',
                      },
                    }}
                  >
                    <PlayArrowIcon />
                  </IconButton>
                </Box>

                <TerminalWindow>
                  {pattern.commands.map((cmd, i) => (
                    <Typography key={i} sx={{ fontSize: '0.9rem', mb: 0.5 }}>
                      $ {cmd}
                    </Typography>
                  ))}
                </TerminalWindow>

                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Chip
                    icon={<TimerIcon sx={{ fontSize: '1rem' }} />}
                    label={`${pattern.timesSaved}x used`}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(137, 180, 250, 0.1)',
                      color: '#89B4FA',
                    }}
                  />
                  <Chip
                    icon={<TrendingUpIcon sx={{ fontSize: '1rem' }} />}
                    label={pattern.timeSaved}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(166, 227, 161, 0.1)',
                      color: '#A6E3A1',
                    }}
                  />
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ color: '#7F849C', fontSize: '0.8rem', mb: 1 }}>
                    Pattern Confidence
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={pattern.frequency}
                    sx={{
                      backgroundColor: '#45475A',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: '#F9E2AF',
                      },
                    }}
                  />
                </Box>
              </Paper>
            ))}
          </Box>
        </CommandCard>
      </Box>
    </Box>
  );
};

export default CommandHistory;