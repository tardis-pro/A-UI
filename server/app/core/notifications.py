import asyncio
import logging
from enum import Enum
from typing import Dict, Any, Optional, List, Union
from uuid import uuid4

from .sse import sse_manager
from .websocket import connection_manager

logger = logging.getLogger(__name__)


class ProgressStatus(str, Enum):
    """Status enum for progress notifications"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELED = "canceled"


class ProgressManager:
    """
    Progress manager for tracking and notifying about long-running operations
    """
    def __init__(self):
        # Map of task_id -> progress state
        self.tasks: Dict[str, Dict[str, Any]] = {}
        # Lock for thread-safe operations on tasks
        self.lock = asyncio.Lock()
    
    async def create_task(
        self, 
        operation_type: str, 
        channel_id: str, 
        total_steps: int = 100,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Create a new task and return its ID
        """
        task_id = str(uuid4())
        task_data = {
            "task_id": task_id,
            "operation_type": operation_type,
            "channel_id": channel_id,
            "status": ProgressStatus.PENDING,
            "progress": 0,
            "total_steps": total_steps,
            "message": f"Task {operation_type} created",
            "metadata": metadata or {},
            "created_at": asyncio.get_event_loop().time(),
            "updated_at": asyncio.get_event_loop().time(),
        }
        
        async with self.lock:
            self.tasks[task_id] = task_data
        
        # Notify about task creation
        await self._notify_progress(task_id, task_data)
        
        logger.info(f"Created task {task_id} of type {operation_type}")
        return task_id
    
    async def update_progress(
        self, 
        task_id: str, 
        progress: Optional[int] = None,
        increment: Optional[int] = None,
        status: Optional[ProgressStatus] = None,
        message: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Update task progress and notify subscribers
        Returns True if the task was found and updated
        """
        if task_id not in self.tasks:
            logger.warning(f"Attempted to update non-existent task: {task_id}")
            return False
        
        async with self.lock:
            task_data = self.tasks[task_id]
            
            # Update progress
            if progress is not None:
                task_data["progress"] = min(max(progress, 0), task_data["total_steps"])
            elif increment is not None:
                task_data["progress"] = min(
                    max(task_data["progress"] + increment, 0), 
                    task_data["total_steps"]
                )
            
            # Update status
            if status is not None:
                task_data["status"] = status
                
                # Automatically set progress to 100% for completed tasks
                if status == ProgressStatus.COMPLETED:
                    task_data["progress"] = task_data["total_steps"]
            
            # Update message
            if message is not None:
                task_data["message"] = message
            
            # Update metadata
            if metadata is not None:
                task_data["metadata"].update(metadata)
            
            # Update timestamp
            task_data["updated_at"] = asyncio.get_event_loop().time()
        
        # Notify about progress update
        await self._notify_progress(task_id, task_data)
        
        return True
    
    async def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        Get task data by ID
        """
        return self.tasks.get(task_id)
    
    async def list_tasks(
        self, 
        channel_id: Optional[str] = None,
        status: Optional[Union[ProgressStatus, List[ProgressStatus]]] = None
    ) -> List[Dict[str, Any]]:
        """
        List tasks, optionally filtered by channel and status
        """
        result = []
        
        # Convert single status to list for consistent handling
        status_list = [status] if isinstance(status, ProgressStatus) else status
        
        for task_data in self.tasks.values():
            # Filter by channel if specified
            if channel_id and task_data["channel_id"] != channel_id:
                continue
            
            # Filter by status if specified
            if status_list and task_data["status"] not in status_list:
                continue
            
            result.append(task_data)
        
        return result
    
    async def clean_completed_tasks(self, max_age: float = 3600) -> int:
        """
        Remove completed/failed/canceled tasks older than max_age seconds
        Returns the number of tasks removed
        """
        current_time = asyncio.get_event_loop().time()
        to_remove = []
        
        completed_statuses = [
            ProgressStatus.COMPLETED,
            ProgressStatus.FAILED,
            ProgressStatus.CANCELED
        ]
        
        async with self.lock:
            for task_id, task_data in self.tasks.items():
                if (
                    task_data["status"] in completed_statuses and
                    current_time - task_data["updated_at"] > max_age
                ):
                    to_remove.append(task_id)
            
            for task_id in to_remove:
                del self.tasks[task_id]
        
        return len(to_remove)
    
    async def _notify_progress(self, task_id: str, task_data: Dict[str, Any]) -> None:
        """
        Notify subscribers about task progress via WebSocket and SSE
        """
        channel_id = task_data["channel_id"]
        event_data = {
            "task_id": task_id,
            "operation_type": task_data["operation_type"],
            "status": task_data["status"],
            "progress": task_data["progress"],
            "total_steps": task_data["total_steps"],
            "message": task_data["message"],
            "metadata": task_data["metadata"]
        }
        
        # Notify via WebSocket
        try:
            await connection_manager.send_to_channel(channel_id, {
                "type": "progress_update",
                "data": event_data
            })
        except Exception as e:
            logger.error(f"Failed to send WebSocket progress notification: {e}")
        
        # Notify via SSE
        try:
            await sse_manager.send_to_channel(channel_id, "progress_update", event_data)
        except Exception as e:
            logger.error(f"Failed to send SSE progress notification: {e}")


# Global progress manager instance
progress_manager = ProgressManager() 
from typing import Any, Dict, List, Optional

from fastapi import WebSocket
from loguru import logger
from sse_starlette.sse import EventSourceResponse

from server.app.core.websocket import connection_manager, sse_manager
from server.app.models.notification import Notification
from server.app.db.session import get_db
from server.app.models.user import User  # Import the User model
from server.app.core.auth import get_current_active_user # Import the get_current_active_user function

async def create_notification(user_id: int, message: str):
    """Creates a new notification and sends it to the user via WebSocket."""
    try:
        db = await get_db()
        notification = Notification(user_id=user_id, message=message)
        db.add(notification)
        await db.commit()
        await db.refresh(notification)

        # Send the notification to the user via WebSocket
        await connection_manager.send_to_channel(str(user_id), {"type": "notification", "payload": {"message": notification.message, "timestamp": notification.timestamp}})
    except Exception as e:
        logger.error(f"Error creating notification: {e}")