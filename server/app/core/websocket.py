import asyncio
import json
import logging
from typing import Dict, List, Any, Optional, Callable
from uuid import uuid4

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from starlette.websockets import WebSocketState

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    WebSocket connection manager to handle multiple client connections
    """
    def __init__(self):
        # Map of channel_id -> list of connected WebSockets
        self.connections: Dict[str, List[WebSocket]] = {}
        # Map of connection_id -> channel_id for quick lookups
        self.connection_map: Dict[str, str] = {}
        # Lock for thread-safe operations on connections
        self.lock = asyncio.Lock()
    
    async def connect(self, websocket: WebSocket, channel_id: str) -> str:
        """
        Connect a WebSocket to a specific channel
        """
        await websocket.accept()
        connection_id = str(uuid4())
        
        async with self.lock:
            if channel_id not in self.connections:
                self.connections[channel_id] = []
            self.connections[channel_id].append(websocket)
            self.connection_map[connection_id] = channel_id
        
        logger.info(f"Client connected to channel {channel_id}, connection_id: {connection_id}")
        return connection_id
    
    async def disconnect(self, websocket: WebSocket, connection_id: str) -> None:
        """
        Disconnect a WebSocket from its channel
        """
        async with self.lock:
            if connection_id in self.connection_map:
                channel_id = self.connection_map[connection_id]
                if channel_id in self.connections:
                    try:
                        self.connections[channel_id].remove(websocket)
                        if not self.connections[channel_id]:
                            del self.connections[channel_id]
                    except ValueError:
                        # WebSocket not in the list
                        pass
                del self.connection_map[connection_id]
        logger.info(f"Client disconnected from channel, connection_id: {connection_id}")
    
    async def send_to_channel(self, channel_id: str, message: Dict[str, Any]) -> int:
        """
        Send a message to all connections in a channel
        Returns the number of clients the message was sent to
        """
        if channel_id not in self.connections:
            return 0
        
        disconnected = []
        sent_count = 0
        
        async with self.lock:
            for i, websocket in enumerate(self.connections[channel_id]):
                try:
                    if websocket.client_state == WebSocketState.CONNECTED:
                        await websocket.send_json(message)
                        sent_count += 1
                except Exception as e:
                    logger.error(f"Failed to send message to client: {e}")
                    disconnected.append(i)
            
            # Remove disconnected clients (in reverse order to not mess up indices)
            for i in sorted(disconnected, reverse=True):
                del self.connections[channel_id][i]
            
            # Remove the channel if no clients left
            if not self.connections[channel_id]:
                del self.connections[channel_id]
        
        return sent_count
    
    async def send_to_connection(self, connection_id: str, message: Dict[str, Any]) -> bool:
        """
        Send a message to a specific connection
        Returns True if the message was sent successfully
        """
        if connection_id not in self.connection_map:
            return False
        
        channel_id = self.connection_map[connection_id]
        if channel_id not in self.connections:
            return False
        
        for websocket in self.connections[channel_id]:
            if websocket.client_state == WebSocketState.CONNECTED:
                try:
                    await websocket.send_json(message)
                    return True
                except Exception as e:
                    logger.error(f"Failed to send message to client: {e}")
        
        return False


# Global connection manager instance
connection_manager = ConnectionManager()


async def handle_websocket_connection(
    websocket: WebSocket,
    channel_id: str,
    message_handler: Optional[Callable] = None
) -> None:
    """
    Handle a WebSocket connection and its messages
    """
    connection_id = await connection_manager.connect(websocket, channel_id)
    
    try:
        # Send connection acknowledgment
        await websocket.send_json({
            "type": "connection_established",
            "connection_id": connection_id,
            "channel_id": channel_id
        })
        
        # Listen for messages
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Process message with custom handler if provided
            if message_handler:
                await message_handler(connection_id, channel_id, message, websocket)
            else:
                # Default echo behavior
                await websocket.send_json({
                    "type": "echo",
                    "data": message
                })
    
    except WebSocketDisconnect:
        logger.info(f"Client disconnected normally: {connection_id}")
    except Exception as e:
        logger.exception(f"WebSocket error: {e}")
    finally:
        await connection_manager.disconnect(websocket, connection_id)


def setup_websocket(app: FastAPI) -> None:
    """
    Set up WebSocket routes for the FastAPI application
    """
    @app.websocket("/ws/{channel_id}")
    async def websocket_endpoint(websocket: WebSocket, channel_id: str):
        """
        WebSocket endpoint for real-time communication
        """
        await handle_websocket_connection(websocket, channel_id) 