from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from .base import Base


class CommandSchedule(Base):
    """Model for command schedules"""

    command_template_id = Column(Integer, ForeignKey("commandtemplate.id"))
    command_template = relationship("CommandTemplate")

    schedule_time = Column(DateTime, nullable=False)
    last_run = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)

    def __repr__(self):
        return f"<CommandSchedule(id={self.id}, command_template_id={self.command_template_id}, schedule_time={self.schedule_time}, is_active={self.is_active})>"