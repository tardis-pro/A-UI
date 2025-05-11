from fastapi import Depends
from sqlalchemy.orm import Session
from ..dependencies import get_db
from ..models.command_template import CommandTemplate

class CommandTemplateService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db

    def create_template(self, name: str, template: str, user_id: int) -> CommandTemplate:
        """Creates a new command template."""
        db_template = CommandTemplate(name=name, template=template, user_id=user_id)
        self.db.add(db_template)
        self.db.commit()
        self.db.refresh(db_template)
        return db_template

    def get_template(self, template_id: int, user_id: int):
        """Retrieves a command template by ID."""
        return self.db.query(CommandTemplate).filter(CommandTemplate.id == template_id, CommandTemplate.user_id == user_id).first()

    def get_templates(self, user_id: int, skip: int = 0, limit: int = 100):
        """Retrieves all command templates for a user."""
        return self.db.query(CommandTemplate).filter(CommandTemplate.user_id == user_id).offset(skip).limit(limit).all()

    def update_template(self, template_id: int, name: str, template: str, user_id: int) -> CommandTemplate:
        """Updates an existing command template."""
        db_template = self.get_template(template_id, user_id)
        if db_template is None:
            return None
        db_template.name = name
        db_template.template = template
        self.db.commit()
        self.db.refresh(db_template)
        return db_template

    def delete_template(self, template_id: int, user_id: int):
        """Deletes a command template."""
        db_template = self.get_template(template_id, user_id)
        if db_template is None:
            return None
        self.db.delete(db_template)
        self.db.commit()