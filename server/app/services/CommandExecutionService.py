import subprocess

import subprocess
import subprocess
import subprocess
from fastapi import Depends, HTTPException
from ..core.auth import get_current_active_user, TokenData
import time
import logging
from .CommandHistoryService import CommandHistoryService
from sqlalchemy.orm import Session
from ..dependencies import get_db
from ..models.audit_log import AuditLog

# Configure logging
logging.basicConfig(filename="command_history.log", level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')

class CommandExecutionService:
    RATE_LIMIT_SECONDS = 5

    def __init__(self):
        pass
        #self._user_last_executed = {}  # In-memory rate limiting (not persistent)

    def __init__(self):
        self._user_last_executed = {}  # In-memory rate limiting (not persistent)

    def _validate_command(self, command: str) -> bool:
        """
        Validates the command against a set of rules.
        """
        if "rm -rf /" in command or "sudo" in command:
            return False
        return True

    def _check_permission(self, command: str, user: TokenData) -> bool:
        """
        Checks if the user has permission to execute the command.
        """
        if user.username != "admin" and "docker" in command:
            return False
        return True

    def execute_command(self, command: str, user: TokenData = Depends(get_current_active_user), command_history_service: CommandHistoryService = Depends(), db: Session = Depends(get_db)) -> str:
        """
        Executes a shell command and returns the output.
        """
        if not self._validate_command(command):
            logging.warning(f"Command validation failed for user {user.username}: {command}")
            return "Error: Command validation failed."

        if not self._check_permission(command, user):
            logging.warning(f"Permission denied for user {user.username} to execute: {command}")
            return "Error: Permission denied."

        current_time = time.time()
        #if user.username in self._user_last_executed and \
        #   current_time - self._user_last_executed[user.username] < self.RATE_LIMIT_SECONDS:
        #    logging.warning(f"Rate limit exceeded for user {user.username}")
        #    raise HTTPException(status_code=429, detail="Rate limit exceeded")

        #self._user_last_executed[user.username] = current_time

        # Rate limiting
        last_executed = db.query(CommandHistory).filter(CommandHistory.user_id == user.id).order_by(CommandHistory.execution_time.desc()).first()
        if last_executed and time.time() - last_executed.execution_time.timestamp() < self.RATE_LIMIT_SECONDS:
            logging.warning(f"Rate limit exceeded for user {user.username}")
            raise HTTPException(status_code=429, detail="Rate limit exceeded")

        try:
            process = subprocess.Popen(command, shell=True,
                                    stdout=subprocess.PIPE,
                                    stderr=subprocess.PIPE,
                                    universal_newlines=True)
            stdout, stderr = process.communicate()
            if stderr:
                logging.error(f"Error executing command for user {user.username}: {command} - {stderr}")
                db_audit_log = AuditLog(user_id=user.id, username=user.username, command=command, status="failure", output=stderr, error=str(e))
                db.add(db_audit_log)
                db.commit()
                return f"Error: {stderr}"
            logging.info(f"Command executed successfully by user {user.username}: {command} - {stdout}")
            db_audit_log = AuditLog(user_id=user.id, username=user.username, command=command, status="success", output=stdout)
            db.add(db_audit_log)
            db.commit()
            command_history_service.log_command(command=command, user_id=user.id)
            return stdout
        except Exception as e:
            logging.exception(f"Exception executing command for user {user.username}: {command} - {e}")
            db_audit_log = AuditLog(user_id=user.id, username=user.username, command=command, status="exception", error=str(e))
            db.add(db_audit_log)
            db.commit()
            return str(e)