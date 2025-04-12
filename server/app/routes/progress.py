from fastapi import APIRouter, Depends, Path, Query, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, Field

from app.core.notifications import progress_manager, ProgressStatus

router = APIRouter(prefix="/progress", tags=["progress"])


class ProgressUpdateRequest(BaseModel):
    """Progress update request model"""
    progress: Optional[int] = None
    increment: Optional[int] = None
    status: Optional[ProgressStatus] = None
    message: Optional[str] = None
    metadata: Optional[dict] = None


class ProgressResponse(BaseModel):
    """Progress response model"""
    task_id: str
    operation_type: str
    channel_id: str
    status: ProgressStatus
    progress: int
    total_steps: int
    message: str
    metadata: dict = Field(default_factory=dict)


@router.get("/{task_id}", response_model=ProgressResponse)
async def get_task_progress(
    task_id: str = Path(..., description="ID of the task to retrieve")
):
    """
    Get the current progress of a task
    """
    task = await progress_manager.get_task(task_id)
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found"
        )
    return task


@router.put("/{task_id}", response_model=ProgressResponse)
async def update_task_progress(
    update: ProgressUpdateRequest,
    task_id: str = Path(..., description="ID of the task to update")
):
    """
    Update the progress of a task
    """
    # Validate that either progress or increment is provided, but not both
    if update.progress is not None and update.increment is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot provide both progress and increment"
        )
    
    success = await progress_manager.update_progress(
        task_id=task_id,
        progress=update.progress,
        increment=update.increment,
        status=update.status,
        message=update.message,
        metadata=update.metadata
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task with ID {task_id} not found"
        )
    
    task = await progress_manager.get_task(task_id)
    return task


@router.get("/", response_model=List[ProgressResponse])
async def list_tasks(
    channel_id: Optional[str] = Query(None, description="Filter tasks by channel ID"),
    status: Optional[ProgressStatus] = Query(None, description="Filter tasks by status")
):
    """
    List tasks, optionally filtered by channel and status
    """
    tasks = await progress_manager.list_tasks(channel_id=channel_id, status=status)
    return tasks 