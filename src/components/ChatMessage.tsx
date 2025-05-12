import React from 'react';
import { Box, Typography } from '@mui/material';


interface ChatMessageProps {
    message: string;
    role: 'user' | 'assistant';
    timestamp: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, role, timestamp }) => {
    return (
        <Box
            sx={{
                p: 1,
                mb: 1,
                borderRadius: '5px',
                bgcolor: role === 'user' ? '#f0f0f0' : '#e0e0e0',
                textAlign: role === 'user' ? 'right' : 'left',
            }}
        >
            <Typography variant="body1">{message}</Typography>
            <Typography variant="caption" sx={{ display: 'block' }}>
                {timestamp}
            </Typography>
        </Box>
    );
};

export default ChatMessage;