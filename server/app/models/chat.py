from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field

class Message(BaseModel):
    """Message model for chat requests and responses."""
    content: str = Field(..., description="The content of the message")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Timestamp of the message")
    role: str = Field(..., description="Role of the message sender (user or assistant)")

class ChatRequest(BaseModel):
    """Request model for chat messages."""
    message: str = Field(..., min_length=1, description="User's message content")

class ChatResponse(BaseModel):
    """Response model for chat messages."""
    response: Message = Field(..., description="Assistant's response message")
    conversation_id: str = Field(..., description="Unique identifier for the conversation")

class Conversation(BaseModel):
    """Model for storing conversation history."""
    id: str = Field(..., description="Unique identifier for the conversation")
    messages: List[Message] = Field(default_factory=list, description="List of messages in the conversation")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")

class ConversationResponse(BaseModel):
    """Response model for conversation retrieval."""
    conversation: Optional[Conversation] = Field(None, description="Current active conversation or None if no active conversation")