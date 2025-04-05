import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Box, Typography, TextField, Paper, Avatar } from '@mui/material';
import { styled } from '@mui/material/styles';
import CodeIcon from '@mui/icons-material/Code';

const CodeWindow = styled(Paper)(({ theme }) => ({
  background: '#1E1E2E',
  borderRadius: '8px',
  overflow: 'hidden',
  border: '1px solid #313244',
  height: '500px',
  display: 'flex',
  flexDirection: 'column',
}));

const CodeHeader = styled(Box)(({ theme }) => ({
  background: '#313244',
  padding: theme.spacing(1.5),
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const ChatContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2),
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

const Message = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  maxWidth: '80%',
}));

const CodeBlock = styled(Box)(({ theme }) => ({
  background: '#181825',
  padding: theme.spacing(2),
  borderRadius: '8px',
  fontFamily: 'monospace',
  fontSize: '14px',
  color: '#CDD6F4',
  marginTop: theme.spacing(1),
  position: 'relative',
  '&:before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '3px',
    background: '#89B4FA',
    borderRadius: '3px 0 0 3px',
  },
}));

const InputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: '1px solid #313244',
}));

const StyledInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: '#181825',
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

const demoConversation = [
  {
    type: 'user',
    message: 'Can you help me optimize this authentication middleware?',
    code: `const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};`
  },
  {
    type: 'assistant',
    message: "I've analyzed your middleware and here are some suggested improvements:",
    code: `const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        details: 'No token provided'
      });
    }

    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    
    // Check token expiration with buffer time
    const bufferTime = 5 * 60; // 5 minutes
    if (decoded.exp - bufferTime < Date.now() / 1000) {
      return res.status(401).json({
        error: 'Token expired or expiring soon',
        shouldRefresh: true
      });
    }

    // Cache user data
    req.user = await getUserFromCache(decoded.userId) || decoded;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        details: err.message 
      });
    }
    next(err);
  }
};`
  },
  {
    type: 'user',
    message: 'Great! What improvements did you make?',
  },
  {
    type: 'assistant',
    message: 'Here are the key improvements:',
    bulletPoints: [
      'Added proper Bearer token extraction',
      'Implemented token expiration buffer time',
      'Added user data caching for performance',
      'Improved error handling with detailed messages',
      'Made the function async for better performance',
      'Added TypeScript-ready error handling'
    ]
  }
];

const CodeAssistant: React.FC = () => {
  const [messages, setMessages] = useState(demoConversation.slice(0, 1));
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (messages.length < demoConversation.length) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setMessages(prev => [...prev, demoConversation[prev.length]]);
        setIsTyping(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ color: '#CDD6F4', mb: 4, fontWeight: 600 }}>
        Code Assistant
      </Typography>
      <CodeWindow elevation={3}>
        <CodeHeader>
          <CodeIcon sx={{ color: '#89B4FA' }} />
          <Typography sx={{ color: '#CDD6F4', fontWeight: 500 }}>
            AI Code Review
          </Typography>
        </CodeHeader>
        <ChatContainer>
          {messages.map((msg, index) => (
            <Message
              key={index}
              sx={{
                alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start',
                flexDirection: msg.type === 'user' ? 'row-reverse' : 'row',
              }}
            >
              <Avatar
                sx={{
                  bgcolor: msg.type === 'user' ? '#89B4FA' : '#A6E3A1',
                  width: 32,
                  height: 32,
                }}
              >
                {msg.type === 'user' ? 'U' : 'AI'}
              </Avatar>
              <Box>
                <Paper
                  sx={{
                    p: 2,
                    background: msg.type === 'user' ? '#313244' : '#45475A',
                    color: '#CDD6F4',
                    borderRadius: 2,
                  }}
                >
                  <Typography>{msg.message}</Typography>
                  {msg.code && (
                    <CodeBlock>
                      <pre style={{ margin: 0 }}>{msg.code}</pre>
                    </CodeBlock>
                  )}
                  {msg.bulletPoints && (
                    <Box sx={{ mt: 1 }}>
                      {msg.bulletPoints.map((point, i) => (
                        <Typography
                          key={i}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            '&:before': {
                              content: '""',
                              width: 4,
                              height: 4,
                              borderRadius: '50%',
                              backgroundColor: '#89B4FA',
                            },
                          }}
                        >
                          {point}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Paper>
              </Box>
            </Message>
          ))}
          {isTyping && (
            <Message>
              <Avatar
                sx={{
                  bgcolor: '#A6E3A1',
                  width: 32,
                  height: 32,
                }}
              >
                AI
              </Avatar>
              <Paper
                sx={{
                  p: 2,
                  background: '#45475A',
                  color: '#CDD6F4',
                  borderRadius: 2,
                }}
              >
                <Typography>Typing...</Typography>
              </Paper>
            </Message>
          )}
        </ChatContainer>
        <InputContainer>
          <StyledInput
            fullWidth
            placeholder="Ask about your code..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            variant="outlined"
            size="small"
          />
        </InputContainer>
      </CodeWindow>
    </Box>
  );
};

export default CodeAssistant; 