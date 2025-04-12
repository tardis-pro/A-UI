from datetime import datetime
from typing import List, Optional
from sqlalchemy import Column, String, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
import enum

from .base import Base
from .user import User

class AgentRole(str, enum.Enum):
    """Enum for agent roles in discussions"""
    MODERATOR = "moderator"
    PARTICIPANT = "participant"
    OBSERVER = "observer"

class DiscussionStatus(str, enum.Enum):
    """Enum for discussion status"""
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"

class Agent(Base):
    """Agent model for AI participants in discussions"""
    
    name = Column(String(255), nullable=False)
    description = Column(String(1000))
    model_config = Column(JSON)  # Store model configuration
    capabilities = Column(JSON)  # Store agent capabilities
    owner_id = Column(ForeignKey("user.id"), nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="agents")
    participations = relationship("AgentParticipation", back_populates="agent")

class Discussion(Base):
    """Discussion model for multi-agent conversations"""
    
    title = Column(String(255), nullable=False)
    description = Column(String(1000))
    status = Column(Enum(DiscussionStatus), default=DiscussionStatus.ACTIVE)
    context = Column(JSON)  # Store discussion context and parameters
    owner_id = Column(ForeignKey("user.id"), nullable=False)
    
    # Relationships
    owner = relationship("User", back_populates="discussions")
    participations = relationship("AgentParticipation", back_populates="discussion")
    messages = relationship("Message", back_populates="discussion")

class AgentParticipation(Base):
    """Model for agent participation in discussions"""
    
    agent_id = Column(ForeignKey("agent.id"), nullable=False)
    discussion_id = Column(ForeignKey("discussion.id"), nullable=False)
    role = Column(Enum(AgentRole), default=AgentRole.PARTICIPANT)
    
    # Relationships
    agent = relationship("Agent", back_populates="participations")
    discussion = relationship("Discussion", back_populates="participations")

class Message(Base):
    """Model for messages in discussions"""
    
    content = Column(String(4000), nullable=False)
    agent_id = Column(ForeignKey("agent.id"), nullable=False)
    discussion_id = Column(ForeignKey("discussion.id"), nullable=False)
    parent_id = Column(ForeignKey("message.id"), nullable=True)  # For threaded discussions
    metadata = Column(JSON)  # Store additional message metadata
    
    # Relationships
    agent = relationship("Agent")
    discussion = relationship("Discussion", back_populates="messages")
    parent = relationship("Message", remote_side=[id])  # Self-referential relationship
    replies = relationship("Message", back_populates="parent") 