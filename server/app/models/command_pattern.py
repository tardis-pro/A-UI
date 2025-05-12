from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship

from .base import Base


class CommandPattern(Base):
    """Model for command patterns"""

    name = Column(String, nullable=False)
    pattern = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    command_templates = relationship("CommandTemplate", back_populates="command_pattern")

    def __repr__(self):
        return f"<CommandPattern(id={self.id}, name='{self.name}')>"