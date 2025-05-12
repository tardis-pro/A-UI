import React, { useRef, useEffect, useState } from 'react';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import { Box } from '@mui/material';
import { useWebSocket } from '../services/websocket';


interface ChatContainerProps {
    messages: { message: string; role: 'user' | 'assistant'; timestamp: string }[];
    onSendMessage: (message: string) => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ messages: initialMessages, onSendMessage }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [messages, setMessages] = useState(initialMessages);
    const { registerHandler } = useWebSocket();

    useEffect(() => {
        registerHandler("chat_message", (data: any) => {
            setMessages((prevMessages) => [...prevMessages, data]);
        });

        // Cleanup function to unregister the handler when the component unmounts
        return () => {
            //unregisterHandler("chat_message"); //TODO: Implement unregisterHandler
        };
    }, [registerHandler]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '500px',
                border: '1px solid #ccc',
                borderRadius: '5px',
                overflow: 'hidden',
            }}
        >
            <Box sx={{ flex: 1, p: 2, overflowY: 'scroll' }}>
                {messages && messages.map((message, index) => (
                    <ChatMessage key={index} message={message.message} role={message.role} timestamp={message.timestamp} />
                ))}
                <div ref={messagesEndRef} />
            </Box>
            <ChatInput onSendMessage={onSendMessage} />
        </Box>
    );
};

export default ChatContainer;