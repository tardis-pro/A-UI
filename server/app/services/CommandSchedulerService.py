from fastapi import Depends
from sqlalchemy.orm import Session
from ..dependencies import get_db
from ..models.command_schedule import CommandSchedule

class CommandSchedulerService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db

    def create_schedule(self, command: str, schedule: str, user_id: int) -> CommandSchedule:
        """Creates a new command schedule."""
        db_schedule = CommandSchedule(command=command, schedule=schedule, user_id=user_id)
        self.db.add(db_schedule)
        self.db.commit()
        self.db.refresh(db_schedule)
        return db_schedule

    def get_schedule(self, schedule_id: int, user_id: int):
        """Retrieves a command schedule by ID."""
        return self.db.query(CommandSchedule).filter(CommandSchedule.id == schedule_id, CommandSchedule.user_id == user_id).first()

    def get_schedules(self, user_id: int, skip: int = 0, limit: int = 100):
        """Retrieves all command schedules for a user."""
        return self.db.query(CommandSchedule).filter(CommandSchedule.user_id == user_id).offset(skip).limit(limit).all()

    def update_schedule(self, schedule_id: int, command: str, schedule: str, user_id: int) -> CommandSchedule:
        """Updates an existing command schedule."""
        db_schedule = self.get_schedule(schedule_id, user_id)
        if db_schedule is None:
            return None
        db_schedule.command = command
        db_schedule.schedule = schedule
        self.db.commit()
        self.db.refresh(db_schedule)
        return db_schedule

    def delete_schedule(self, schedule_id: int, user_id: int):
        """Deletes a command schedule."""
        db_schedule = self.get_schedule(schedule_id, user_id)
        if db_schedule is None:
            return None
        self.db.delete(db_schedule)
        self.db.commit()