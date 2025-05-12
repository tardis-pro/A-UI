from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from server.app.models.base import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)  # Add user_id to associate with a user
    message = Column(String, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"Notification(id={self.id}, user_id={self.user_id}, message='{self.message}', timestamp='{self.timestamp}')"