import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, Paper, Chip, IconButton, TextField, InputAdornment } from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import CodeIcon from '@mui/icons-material/Code';
import ArchitectureIcon from '@mui/icons-material/Architecture';
import BugReportIcon from '@mui/icons-material/BugReport';
import BuildIcon from '@mui/icons-material/Build';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const KnowledgeCard = styled(Paper)(({ theme }) => ({
  background: '#313244',
  borderRadius: '12px',
  padding: theme.spacing(3),
  border: '1px solid rgba(205, 214, 244, 0.1)',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    background: '#45475A',
    borderColor: '#89B4FA',
  },
}));

const SearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#181825',
    borderRadius: '12px',
    '& fieldset': {
      borderColor: '#313244',
    },
    '&:hover fieldset': {
      borderColor: '#89B4FA',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#89B4FA',
    },
  },
  '& .MuiOutlinedInput-input': {
    color: '#CDD6F4',
  },
}));

const FilterChip = styled(Chip)(({ theme }) => ({
  backgroundColor: '#181825',
  color: '#CDD6F4',
  border: '1px solid #313244',
  '&.active': {
    backgroundColor: '#89B4FA',
    color: '#1E1E2E',
    borderColor: '#89B4FA',
  },
  '&:hover': {
    backgroundColor: '#45475A',
  },
}));

const knowledgeItems = [
  {
    title: 'Authentication Flow Design',
    description: 'Comprehensive guide to our JWT-based authentication system with refresh token rotation.',
    type: 'Architecture',
    icon: <ArchitectureIcon />,
    tags: ['security', 'auth', 'jwt'],
    lastUpdated: '2 hours ago',
    color: '#89B4FA',
  },
  {
    title: 'API Rate Limiting Implementation',
    description: 'How we implemented rate limiting using Redis with sliding window algorithm.',
    type: 'Code',
    icon: <CodeIcon />,
    tags: ['api', 'performance', 'redis'],
    lastUpdated: '1 day ago',
    color: '#F9E2AF',
  },
  {
    title: 'Memory Leak Investigation Guide',
    description: 'Step-by-step process to identify and fix memory leaks in Node.js applications.',
    type: 'Debug',
    icon: <BugReportIcon />,
    tags: ['debugging', 'performance', 'node'],
    lastUpdated: '3 days ago',
    color: '#F38BA8',
  },
  {
    title: 'CI/CD Pipeline Setup',
    description: 'Documentation for our automated testing and deployment pipeline using GitHub Actions.',
    type: 'DevOps',
    icon: <BuildIcon />,
    tags: ['ci-cd', 'github-actions', 'automation'],
    lastUpdated: '1 week ago',
    color: '#A6E3A1',
  },
];

const filters = ['All', 'Architecture', 'Code', 'Debug', 'DevOps'];

const KnowledgeBase: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchValue, setSearchValue] = useState('');

  const filteredItems = knowledgeItems.filter(item => 
    (activeFilter === 'All' || item.type === activeFilter) &&
    (searchValue === '' || 
      item.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.description.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchValue.toLowerCase())))
  );

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ color: '#CDD6F4', mb: 4, fontWeight: 600 }}>
        Knowledge Base
      </Typography>

      <Box sx={{ mb: 4 }}>
        <SearchField
          fullWidth
          placeholder="Search knowledge base..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#7F849C' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ mb: 4, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {filters.map((filter) => (
          <FilterChip
            key={filter}
            label={filter}
            onClick={() => setActiveFilter(filter)}
            className={activeFilter === filter ? 'active' : ''}
          />
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
        {filteredItems.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <KnowledgeCard>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ color: item.color }}>{item.icon}</Box>
                  <Typography sx={{ color: item.color, fontWeight: 500 }}>
                    {item.type}
                  </Typography>
                </Box>
                <IconButton size="small" sx={{ color: '#7F849C' }}>
                  <BookmarkIcon />
                </IconButton>
              </Box>

              <Typography variant="h6" sx={{ color: '#CDD6F4', mb: 1, fontWeight: 600 }}>
                {item.title}
              </Typography>

              <Typography sx={{ color: '#BAC2DE', mb: 2, fontSize: '0.9rem' }}>
                {item.description}
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {item.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(137, 180, 250, 0.1)',
                      color: '#89B4FA',
                      borderRadius: '4px',
                    }}
                  />
                ))}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#7F849C', fontSize: '0.8rem' }}>
                <AccessTimeIcon sx={{ fontSize: '0.9rem' }} />
                <Typography variant="caption">
                  Updated {item.lastUpdated}
                </Typography>
              </Box>
            </KnowledgeCard>
          </motion.div>
        ))}
      </Box>
    </Box>
  );
};

export default KnowledgeBase; 