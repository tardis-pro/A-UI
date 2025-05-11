import os
import platform
import psutil
import time
from datetime import datetime
from typing import Dict, Any, List

from fastapi import APIRouter, status

router = APIRouter(prefix="/api", tags=["api"])


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    """
    Extended health check endpoint with system metrics
    """
    return {
        "status": "ok",
        "service": "A-UI API",
        "timestamp": datetime.utcnow().isoformat(),
        "uptime": time.time() - psutil.boot_time(),
    }


@router.get("/system")
async def system_info() -> Dict[str, Any]:
    """
    Get system information
    """
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    return {
        "cpu": {
            "percent": cpu_percent,
            "cores": psutil.cpu_count(logical=True),
            "physical_cores": psutil.cpu_count(logical=False),
        },
        "memory": {
            "total": memory.total,
            "available": memory.available,
            "percent": memory.percent,
        },
        "disk": {
            "total": disk.total,
            "free": disk.free,
            "percent": disk.percent,
        },
        "platform": {
            "system": platform.system(),
            "release": platform.release(),
            "version": platform.version(),
            "python": platform.python_version(),
        }
    }


@router.get("/routes")
async def list_routes() -> List[Dict[str, Any]]:
    """
    List all available API routes
    """
    routes = [
        {"path": "/api/health", "methods": ["GET"], "description": "Health check endpoint"},
        {"path": "/api/system", "methods": ["GET"], "description": "System information"},
        {"path": "/api/routes", "methods": ["GET"], "description": "List of available routes"},
        {"path": "/progress", "methods": ["GET"], "description": "List all progress tasks"},
        {"path": "/progress/{task_id}", "methods": ["GET", "PUT"], "description": "Get or update task progress"},
        {"path": "/ws/{channel_id}", "methods": ["WEBSOCKET"], "description": "WebSocket connection for real-time communication"},
        {"path": "/events/{channel_id}", "methods": ["GET"], "description": "SSE endpoint for status notifications"},
        {"path": "/docs", "methods": ["GET"], "description": "Swagger UI documentation"},
        {"path": "/redoc", "methods": ["GET"], "description": "ReDoc documentation"},
        {"path": "/metrics", "methods": ["GET"], "description": "Prometheus metrics endpoint"},
        {"path": "/api/command_history", "methods": ["GET"], "description": "Get recent command history entries"},
        # Knowledge routes
        {"path": "/knowledge/items", "methods": ["POST"], "description": "Create a new knowledge item"},
        {"path": "/knowledge/items/{item_id}", "methods": ["GET"], "description": "Get a knowledge item by ID"},
        {"path": "/knowledge/search", "methods": ["POST"], "description": "Search for knowledge items"},
        {"path": "/knowledge/relations", "methods": ["POST"], "description": "Create a relationship between knowledge items"},
        {"path": "/knowledge/entity-links", "methods": ["POST"], "description": "Link an entity to a knowledge item"},
        {"path": "/knowledge/entity/{entity_id}", "methods": ["GET"], "description": "Get knowledge items linked to an entity"},
        {"path": "/knowledge/extract/text", "methods": ["POST"], "description": "Extract knowledge from text content"},
        {"path": "/knowledge/extract/conversation", "methods": ["POST"], "description": "Extract knowledge from conversation content"},
    ]

    routes.append({
           "path": "/command_history/search",
           "methods": ["POST"],
           "description": "Search command history"
       })
    routes.append({
           "path": "/command_history/execute",
           "methods": ["POST"],
           "description": "Execute a command from history"
       })
    return routes


from ..services.agent_orchestrator import CommandHistoryAnalyzer

@router.get("/command_history")
async def get_command_history(limit: int = 10) -> List[str]:
    """
    Get recent command history entries
    """
    history = CommandHistoryAnalyzer.get_history(limit)
    return history


from fastapi import Depends
from ..services.knowledge import KnowledgeService
from ..models.knowledge import KnowledgeSearchRequest, KnowledgeSearchResponse, KnowledgeItem
from sqlalchemy.orm import Session
from ..dependencies import get_db, get_vector_store
from ..services.vector_store import VectorStoreService

@router.post("/command_history/search", response_model=KnowledgeSearchResponse)
async def search_command_history(
    search_request: KnowledgeSearchRequest,
    db: Session = Depends(get_db),
    vector_store: VectorStoreService = Depends(get_vector_store)
) -> KnowledgeSearchResponse:
    """
    Search command history
    """
    knowledge_service = KnowledgeService(db, vector_store)
    search_request.types = ["command_history"]
    results = await knowledge_service.search_knowledge(
        query=search_request.query,
        types=search_request.types,
        subtypes=search_request.subtypes,
        tags=search_request.tags,
        source_types=search_request.source_types,
        min_confidence=search_request.min_confidence,
        limit=search_request.limit,
        include_relations=search_request.include_relations
    )
    
    # Convert KnowledgeItem objects to KnowledgeItemModel
    knowledge_items = [KnowledgeItem.from_orm(item) for item in results]

    return KnowledgeSearchResponse(results=knowledge_items, count=len(results))

@router.post("/command_history/execute")
async def execute_command_history(
    item_id: int,
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """
    Execute command history
    """
    knowledge_service = KnowledgeService(db, None)
    item = await knowledge_service.get_knowledge_item(item_id)
    if not item:
        return {"error": "Item not found"}

    # Execute the command
    import subprocess
    try:
        process = subprocess.Popen(item.content, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = process.communicate()
        return {"result": stdout.decode(), "error": stderr.decode()}
    except Exception as e:
        return {"error": str(e)}