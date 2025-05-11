from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base


class AuditLog(Base):
    """Model for audit logs"""

    user_id = Column(Integer, ForeignKey("user.id"))
    username = Column(String, nullable=False)
    command = Column(Text, nullable=False)
    execution_time = Column(DateTime, default=datetime.utcnow)
    status = Column(String, nullable=False)  # success, failure
    output = Column(Text, nullable=True)
    error = Column(Text, nullable=True)

    def __repr__(self):
        return f"<AuditLog(id={self.id}, user_id={self.user_id}, command='{self.command}', execution_time={self.execution_time}, status='{self.status}')>"