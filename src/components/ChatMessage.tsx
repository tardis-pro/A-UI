import React from 'react';

interface ChatMessageProps {
    message: string;
    role: 'user' | 'assistant';
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, role }) => {
    return (
        <div className={`chat-message ${role === 'user' ? 'user' : 'assistant'}`}>
            <p>{message}</p>
        </div>
    );
};

export default ChatMessage;