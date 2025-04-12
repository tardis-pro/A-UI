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
    
    return routes 