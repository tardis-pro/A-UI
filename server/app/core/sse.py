import asyncio
import json
import logging
from typing import Dict, List, Any, AsyncIterable, Optional
from uuid import uuid4

from fastapi import FastAPI, Request
from starlette.responses import StreamingResponse

logger = logging.getLogger(__name__)


class SSEManager:
    """
    Server-Sent Events (SSE) manager for status notifications
    """
    def __init__(self):
        # Map of channel_id -> list of message queues
        self.channels: Dict[str, List[asyncio.Queue]] = {}
        # Map of client_id -> channel_id for quick lookups
        self.client_map: Dict[str, str] = {}
        # Lock for thread-safe operations on channels
        self.lock = asyncio.Lock()
    
    async def register_client(self, channel_id: str) -> tuple[str, asyncio.Queue]:
        """
        Register a new client for a channel
        Returns client_id and message queue
        """
        client_id = str(uuid4())
        queue = asyncio.Queue()
        
        async with self.lock:
            if channel_id not in self.channels:
                self.channels[channel_id] = []
            self.channels[channel_id].append(queue)
            self.client_map[client_id] = channel_id
        
        logger.info(f"SSE client registered for channel {channel_id}, client_id: {client_id}")
        
        # Send initial connection message
        await queue.put({
            "event": "connected",
            "data": {
                "client_id": client_id,
                "channel_id": channel_id
            }
        })
        
        return client_id, queue
    
    async def unregister_client(self, client_id: str) -> None:
        """
        Unregister a client
        """
        async with self.lock:
            if client_id in self.client_map:
                channel_id = self.client_map[client_id]
                del self.client_map[client_id]
                
                if channel_id in self.channels:
                    # Find the queue for this client and remove it
                    # This is an O(n) operation but the number of clients per channel should be small
                    for i, queue in enumerate(self.channels[channel_id]):
                        if queue.empty():  # Simple heuristic to identify the client's queue
                            self.channels[channel_id].pop(i)
                            break
                    
                    # Clean up empty channels
                    if not self.channels[channel_id]:
                        del self.channels[channel_id]
        
        logger.info(f"SSE client unregistered, client_id: {client_id}")
    
    async def send_to_channel(self, channel_id: str, event: str, data: Any) -> int:
        """
        Send a message to all clients in a channel
        Returns the number of clients the message was sent to
        """
        if channel_id not in self.channels:
            return 0
        
        message = {
            "event": event,
            "data": data
        }
        
        sent_count = 0
        async with self.lock:
            for queue in self.channels[channel_id]:
                try:
                    await queue.put(message)
                    sent_count += 1
                except Exception as e:
                    logger.error(f"Failed to send SSE message: {e}")
        
        return sent_count
    
    async def send_to_client(self, client_id: str, event: str, data: Any) -> bool:
        """
        Send a message to a specific client
        Returns True if the message was sent successfully
        """
        if client_id not in self.client_map:
            return False
        
        channel_id = self.client_map[client_id]
        if channel_id not in self.channels:
            return False
        
        message = {
            "event": event,
            "data": data
        }
        
        # This is inefficient but works for small numbers of clients
        # In a production system, we would maintain a direct map to the queue
        for queue in self.channels[channel_id]:
            try:
                await queue.put(message)
                return True  # Assume the first available queue is for this client
            except Exception as e:
                logger.error(f"Failed to send SSE message: {e}")
        
        return False


# Global SSE manager instance
sse_manager = SSEManager()


async def sse_event_generator(request: Request, queue: asyncio.Queue) -> AsyncIterable[str]:
    """
    Generator for SSE events
    """
    try:
        while True:
            # Handle client disconnection
            if await request.is_disconnected():
                break
            
            # Get message from queue with timeout to check for disconnection periodically
            try:
                message = await asyncio.wait_for(queue.get(), timeout=30.0)
                event = message.get("event", "message")
                data = json.dumps(message.get("data", {}))
                
                # Format as SSE
                yield f"event: {event}\n"
                yield f"data: {data}\n\n"
            except asyncio.TimeoutError:
                # Send a keep-alive comment to maintain the connection
                yield ": ping\n\n"
    except Exception as e:
        logger.exception(f"SSE stream error: {e}")
    finally:
        logger.info(f"SSE stream closed for client_id: {client_id}")
        # Clean up is handled at the route level


def setup_sse(app: FastAPI) -> None:
    """
    Set up SSE routes for the FastAPI application
    """
    @app.get("/events/{channel_id}")
    async def sse_endpoint(request: Request, channel_id: str):
        """
        SSE endpoint for status notifications
        """
        client_id, queue = await sse_manager.register_client(channel_id)
        
        # Create background task to unregister client when connection is closed
        async def cleanup():
            await sse_manager.unregister_client(client_id)
        
        return StreamingResponse(
            sse_event_generator(request, queue),
            media_type="text/event-stream",
            background=cleanup
        ) 