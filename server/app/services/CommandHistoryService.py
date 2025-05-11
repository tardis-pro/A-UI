from fastapi import Depends
from sqlalchemy.orm import Session
from ..dependencies import get_db
from ..models.command_history import CommandHistory
from typing import List

class CommandHistoryService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db

    def log_command(self, command: str, user_id: int) -> CommandHistory:
        """Logs a command to the command history."""
        db_command = CommandHistory(command=command, user_id=user_id)
        self.db.add(db_command)
        self.db.commit()
        self.db.refresh(db_command)
        return db_command

    def get_command_history(self, user_id: int, skip: int = 0, limit: int = 100):
        """Retrieves command history for a user."""
        return self.db.query(CommandHistory).filter(CommandHistory.user_id == user_id).offset(skip).limit(limit).all()

    def delete_command_history(self, user_id: int):
        """Deletes command history for a user."""
        self.db.query(CommandHistory).filter(CommandHistory.user_id == user_id).delete()
        self.db.commit()

    def get_command(self, command_id: int) -> CommandHistory:
        """Retrieves a command by ID."""
        return self.db.query(CommandHistory).filter(CommandHistory.id == command_id).first()

    def get_shared_commands(self) -> List[CommandHistory]:
        """Retrieves all shared commands."""
        return self.db.query(CommandHistory).filter(CommandHistory.is_shared == True).all()