from typing import List, Optional
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base

class ChatMessage(Base):
    """Model for storing chat messages."""
    __tablename__ = "chat_message"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    conversation_id = Column(String, ForeignKey("conversation.id"), nullable=False)

class Conversation(Base):
    """Model for storing conversation history."""
    __tablename__ = "conversation"
    id = Column(String, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)
    messages = relationship("ChatMessage", backref="conversation")

class ConversationResponse(Base):
    """Response model for conversation retrieval."""
    __tablename__ = "conversation_response"
    id = Column(Integer, primary_key=True, index=True)
    conversation = Column(Text, nullable=True)
    