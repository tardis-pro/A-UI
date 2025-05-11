import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Container, Typography, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import FeatureSections from './components/FeatureSections';

const DemoContainer = styled(Box)(({ theme }) => ({
  background: '#1E1E2E',
  borderRadius: '16px',
  overflow: 'hidden',
  border: '1px solid #313244',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  height: '700px',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
}));

const DemoOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'linear-gradient(180deg, rgba(30, 30, 46, 0) 0%, rgba(30, 30, 46, 0.9) 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 1,
  transition: 'opacity 0.3s ease',
  zIndex: 10,
}));

const DemoButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #89B4FA 30%, #89B4FA 90%)',
  borderRadius: '8px',
  border: 0,
  color: '#1E1E2E',
  height: 48,
  padding: '0 30px',
  boxShadow: '0 3px 5px 2px rgba(137, 180, 250, .3)',
  textTransform: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  '&:hover': {
    background: 'linear-gradient(45deg, #A6E3A1 30%, #A6E3A1 90%)',
  },
}));

const DemoSection: React.FC = () => {
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);

  return (
    <Box sx={{ py: 12, background: '#181825' }}>
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Typography
            variant="h3"
            align="center"
            sx={{
              color: '#CDD6F4',
              mb: 2,
              fontWeight: 600,
            }}
          >
            Experience the Future
          </Typography>
          <Typography
            variant="h6"
            align="center"
            sx={{
              color: '#BAC2DE',
              mb: 8,
              maxWidth: '800px',
              mx: 'auto',
            }}
          >
            Take a hands-on tour of how AUI transforms your development workflow with its powerful features
          </Typography>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <DemoContainer>
            <AnimatePresence>
              {isOverlayVisible ? (
                <DemoOverlay>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography
                      variant="h4"
                      sx={{
                        color: '#CDD6F4',
                        mb: 3,
                        fontWeight: 600,
                      }}
                    >
                      Ready to explore?
                    </Typography>
                    <DemoButton onClick={() => setIsOverlayVisible(false)}>
                      Launch Interactive Demo
                    </DemoButton>
                  </Box>
                </DemoOverlay>
              ) : null}
            </AnimatePresence>
            <FeatureSections />
          </DemoContainer>
        </motion.div>

        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography
            variant="body1"
            sx={{
              color: '#BAC2DE',
              mb: 3,
            }}
          >
            This is just a glimpse of what AUI can do. The actual product includes:
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 4,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {[
              'Real-time code analysis',
              'Local LLM processing',
              'Semantic search',
              'Knowledge capture',
              'CI/CD integration',
              'Team collaboration'
            ].map((feature, index) => (
              <Box
                key={index}
                sx={{
                  color: '#89B4FA',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  '&:before': {
                    content: '""',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: '#89B4FA',
                    marginRight: 1,
                  },
                }}
              >
                {feature}
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default DemoSection; 