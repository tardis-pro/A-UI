from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from .base import Base


class CommandTemplate(Base):
    """Model for command templates"""

    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    command = Column(Text, nullable=False)
    command_history = relationship("CommandHistory", back_populates="command_template")
    command_pattern_id = Column(Integer, ForeignKey("commandpattern.id"))
    command_pattern = relationship("CommandPattern", back_populates="command_templates")

    def __repr__(self):
        return f"<CommandTemplate(id={self.id}, name='{self.name}')>"