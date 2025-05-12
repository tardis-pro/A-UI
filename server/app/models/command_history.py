from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .base import Base


class CommandHistory(Base):
    """Model for command history"""

    command_template_id = Column(Integer, ForeignKey("commandtemplate.id"))
    command_template = relationship("CommandTemplate", back_populates="command_history")

    execution_time = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")  # pending, running, completed, failed
    output = Column(Text, nullable=True)
    error = Column(Text, nullable=True)
    is_template = Column(Boolean, default=False)
    command_string = Column(Text, nullable=True)
    is_shared = Column(Boolean, default=False)
    
    def __repr__(self):
        return f"<CommandHistory(id={self.id}, command_template_id={self.command_template_id}, execution_time={self.execution_time}, status={self.status}, is_shared={self.is_shared})>"