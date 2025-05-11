import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';


interface ChatInputProps {
    onSendMessage: (message: string) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
    const [message, setMessage] = useState('');

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(event.target.value);
    };

    const handleSendMessage = () => {
        if (message.trim() !== '') {
            onSendMessage(message);
            setMessage('');
        }
    };

    return (
        <Box sx={{ display: 'flex', gap: 1, p: 1, borderTop: '1px solid #ccc' }}>
            <TextField
                fullWidth
                placeholder="Type your message..."
                variant="outlined"
                value={message}
                onChange={handleInputChange}
            />
            <Button variant="contained" endIcon={<SendIcon />} onClick={handleSendMessage}>
                Send
            </Button>
        </Box>
    );
};

export default ChatInput;