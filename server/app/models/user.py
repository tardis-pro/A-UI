from sqlalchemy import Boolean, Column, String
from sqlalchemy.orm import relationship
from .base import Base

class User(Base):
    """User model for authentication and authorization"""
    
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    # Relationships
    discussions = relationship("Discussion", back_populates="owner", cascade="all, delete-orphan")
    agents = relationship("Agent", back_populates="owner", cascade="all, delete-orphan")
    
    # Add relationships here as needed
    # discussions = relationship("Discussion", back_populates="user")
    # agents = relationship("Agent", back_populates="user") 