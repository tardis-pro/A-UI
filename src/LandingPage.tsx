import React from 'react';
import { motion } from 'framer-motion';
import { Box, Container, Typography, Button, Grid, useTheme, Chip } from '@mui/material';
import { styled } from '@mui/material/styles';
import DemoSection from './DemoSection';

// Styled components
const HeroSection = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  background: 'linear-gradient(135deg, #1E1E2E 0%, #181825 100%)',
  overflow: 'hidden',
  position: 'relative',
}));

const GlowingOrb = styled(motion.div)({
  position: 'absolute',
  borderRadius: '50%',
  filter: 'blur(80px)',
  zIndex: 0,
});

const FeatureCard = styled(motion.div)(({ theme }) => ({
  background: 'rgba(49, 50, 68, 0.6)',
  borderRadius: '16px',
  padding: theme.spacing(4),
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(205, 214, 244, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    background: 'rgba(49, 50, 68, 0.8)',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
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

const RoadmapCard = styled(motion.div)(({ theme }) => ({
  background: 'rgba(49, 50, 68, 0.4)',
  borderRadius: '16px',
  padding: theme.spacing(3),
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(205, 214, 244, 0.1)',
  height: '100%',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    background: 'rgba(49, 50, 68, 0.6)',
  },
}));

interface StatusChipProps {
  color?: string;
}

const StatusChip = styled(Chip)<StatusChipProps>(({ color = '#89B4FA' }) => ({
  backgroundColor: `${color}20`,
  color: color,
  borderRadius: '8px',
  height: '24px',
  '& .MuiChip-label': {
    fontSize: '0.75rem',
    fontWeight: 600,
  },
}));

const features = [
  {
    title: 'Privacy-First Development',
    description: 'Process sensitive code and data locally with optional external LLM escalation.',
    color: '#89B4FA',
  },
  {
    title: 'Intelligent Code Assistant',
    description: 'AI-powered code search, bug diagnosis, and feature planning with local LLM support.',
    color: '#F9E2AF',
  },
  {
    title: 'Knowledge Management',
    description: 'Capture and retrieve both explicit and tacit knowledge with semantic understanding.',
    color: '#F38BA8',
  },
  {
    title: 'CI/CD Integration',
    description: 'Real-time monitoring of builds, tests, and deployments across your services.',
    color: '#A6E3A1',
  },
  {
    title: 'Command History Analysis',
    description: 'Learn from your CLI patterns to suggest and automate common sequences.',
    color: '#FAB387',
  },
  {
    title: 'Seamless Integration',
    description: 'Works with GitHub, Jira, SonarCloud, and your existing development tools.',
    color: '#CBA6F7',
  },
];

const roadmapPhases = [
  {
    title: "Core Foundation",
    status: "In Progress",
    statusColor: "#F9E2AF",
    features: [
      "Modern Theme System",
      "Responsive Layout Components",
      "Intuitive Navigation",
      "State Management",
      "API Integration Layer"
    ],
    timeline: "Q1 2024"
  },
  {
    title: "AI Integration",
    status: "Coming Soon",
    statusColor: "#89B4FA",
    features: [
      "Code Assistant with Local LLM",
      "Knowledge Base Engine",
      "Command History Analysis",
      "Context-Aware Suggestions",
      "Multi-Model Support"
    ],
    timeline: "Q2 2024"
  },
  {
    title: "Developer Experience",
    status: "Planned",
    statusColor: "#F38BA8",
    features: [
      "CI/CD Pipeline Monitor",
      "Semantic Code Search",
      "Smart File Explorer",
      "Customizable Settings",
      "Team Collaboration"
    ],
    timeline: "Q3 2024"
  },
  {
    title: "Advanced Features",
    status: "Future",
    statusColor: "#A6E3A1",
    features: [
      "Auto-Documentation",
      "Code Review Assistant",
      "Performance Analytics",
      "Security Scanning",
      "Cross-Project Insights"
    ],
    timeline: "Q4 2024"
  }
];

const LandingPage: React.FC = () => {
  const theme = useTheme();

  return (
    <Box>
      <HeroSection>
        {/* Animated background orbs */}
        <GlowingOrb
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          style={{
            width: '400px',
            height: '400px',
            background: 'rgba(137, 180, 250, 0.15)',
            top: '10%',
            left: '60%',
          }}
        />
        <GlowingOrb
          animate={{
            x: [0, -70, 0],
            y: [0, 100, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          style={{
            width: '300px',
            height: '300px',
            background: 'rgba(166, 227, 161, 0.15)',
            bottom: '20%',
            right: '50%',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={8} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '2.5rem', md: '4rem' },
                    fontWeight: 700,
                    color: '#CDD6F4',
                    mb: 2,
                  }}
                >
                  AUTONOMOUS
                  <br />
                  ULTRA INSTINCT
                </Typography>
                <Typography
                  variant="h2"
                  sx={{
                    fontSize: { xs: '1.2rem', md: '1.5rem' },
                    color: '#89B4FA',
                    mb: 4,
                    fontWeight: 500,
                  }}
                >
                  Your AI-powered development companion
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#BAC2DE',
                    mb: 4,
                    fontSize: { xs: '1rem', md: '1.1rem' },
                    lineHeight: 1.6,
                  }}
                >
                  Experience 2× productivity boost with privacy-first, local-first AI assistance.
                  Streamline your development workflow with intelligent code search, automated tasks,
                  and seamless knowledge management.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <StyledButton variant="contained">
                    Get Started
                  </StyledButton>
                  <StyledButton
                    variant="outlined"
                    sx={{
                      background: 'transparent',
                      border: '2px solid #89B4FA',
                      color: '#89B4FA',
                      '&:hover': {
                        background: 'rgba(137, 180, 250, 0.1)',
                        border: '2px solid #A6E3A1',
                        color: '#A6E3A1',
                      },
                    }}
                  >
                    View Demo
                  </StyledButton>
                </Box>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {/* Add hero image or animation here */}
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </HeroSection>

      {/* Features Section */}
      <Box sx={{ py: 12, background: '#181825' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            align="center"
            sx={{
              color: '#CDD6F4',
              mb: 8,
              fontWeight: 600,
            }}
          >
            Supercharge Your Development
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <FeatureCard>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        background: `${feature.color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '6px',
                          background: feature.color,
                        }}
                      />
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{
                        color: '#CDD6F4',
                        mb: 2,
                        fontWeight: 600,
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{
                        color: '#BAC2DE',
                        lineHeight: 1.6,
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </FeatureCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Demo Section */}
      <DemoSection />

      {/* Roadmap Section */}
      <Box sx={{ py: 12, background: '#1E1E2E' }}>
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
              Journey to Excellence
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
              Our ambitious roadmap to revolutionize developer productivity through AI-powered assistance
            </Typography>
          </motion.div>

          <Grid container spacing={4}>
            {roadmapPhases.map((phase, index) => (
              <Grid item xs={12} md={6} lg={3} key={index}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <RoadmapCard>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#CDD6F4',
                          fontWeight: 600,
                        }}
                      >
                        {phase.title}
                      </Typography>
                      <StatusChip
                        label={phase.status}
                        sx={{ color: phase.statusColor, backgroundColor: `${phase.statusColor}20` }}
                      />
                    </Box>
                    <Box sx={{ mb: 3 }}>
                      {phase.features.map((feature, featureIndex) => (
                        <Typography
                          key={featureIndex}
                          variant="body2"
                          sx={{
                            color: '#BAC2DE',
                            mb: 1,
                            display: 'flex',
                            alignItems: 'center',
                            '&:before': {
                              content: '""',
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: phase.statusColor,
                              marginRight: '8px',
                            },
                          }}
                        >
                          {feature}
                        </Typography>
                      ))}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: phase.statusColor,
                        fontWeight: 500,
                      }}
                    >
                      {phase.timeline}
                    </Typography>
                  </RoadmapCard>
                </motion.div>
              </Grid>
            ))}
          </Grid>

          {/* Vision Statement */}
          <Box sx={{ mt: 12, textAlign: 'center' }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Typography
                variant="h4"
                sx={{
                  color: '#CDD6F4',
                  mb: 3,
                  fontWeight: 600,
                }}
              >
                Beyond the Roadmap
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#BAC2DE',
                  maxWidth: '800px',
                  mx: 'auto',
                  lineHeight: 1.8,
                }}
              >
                Our vision extends beyond these milestones. We're building towards a future where AI seamlessly augments developer creativity, where knowledge flows effortlessly across teams, and where complex development workflows feel natural and intuitive. Join us in shaping the future of software development.
              </Typography>
              <Button
                variant="outlined"
                sx={{
                  mt: 4,
                  borderColor: '#89B4FA',
                  color: '#89B4FA',
                  '&:hover': {
                    borderColor: '#A6E3A1',
                    color: '#A6E3A1',
                    background: 'rgba(166, 227, 161, 0.1)',
                  },
                }}
              >
                Join Our Beta Program
              </Button>
            </motion.div>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage; 