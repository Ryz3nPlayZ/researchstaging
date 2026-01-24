"""
WebSocket handler for real-time updates.

Provides realtime execution updates using WebSockets.
Updates are emitted when tasks change state or produce artifacts.
"""
import asyncio
import json
import logging
from typing import Dict, Set
from datetime import datetime, timezone
import redis.asyncio as redis
from fastapi import WebSocket, WebSocketDisconnect
import os

logger = logging.getLogger(__name__)

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")


class ConnectionManager:
    """
    Manages WebSocket connections and Redis pub/sub for real-time updates.
    """
    
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}  # project_id -> set of websockets
        self.redis: redis.Redis = None
        self._pubsub_task: asyncio.Task = None
    
    async def connect_redis(self):
        """Connect to Redis for pub/sub."""
        if not self.redis:
            self.redis = redis.from_url(REDIS_URL, decode_responses=True)
    
    async def connect(self, websocket: WebSocket, project_id: str):
        """Accept a WebSocket connection and subscribe to project updates."""
        await websocket.accept()
        
        if project_id not in self.active_connections:
            self.active_connections[project_id] = set()
        
        self.active_connections[project_id].add(websocket)
        logger.info(f"WebSocket connected for project {project_id}")
        
        # Start Redis listener if not already running
        if not self._pubsub_task or self._pubsub_task.done():
            self._pubsub_task = asyncio.create_task(self._redis_listener())
    
    def disconnect(self, websocket: WebSocket, project_id: str):
        """Remove a WebSocket connection."""
        if project_id in self.active_connections:
            self.active_connections[project_id].discard(websocket)
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]
        logger.info(f"WebSocket disconnected for project {project_id}")
    
    async def send_to_project(self, project_id: str, message: dict):
        """Send message to all connections for a project."""
        if project_id in self.active_connections:
            dead_connections = set()
            
            for websocket in self.active_connections[project_id]:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.warning(f"Failed to send to websocket: {e}")
                    dead_connections.add(websocket)
            
            # Clean up dead connections
            for ws in dead_connections:
                self.active_connections[project_id].discard(ws)
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients."""
        for project_id in list(self.active_connections.keys()):
            await self.send_to_project(project_id, message)
    
    async def _redis_listener(self):
        """Listen to Redis pub/sub and forward to WebSocket clients."""
        await self.connect_redis()
        pubsub = self.redis.pubsub()
        
        # Subscribe to all project channels
        await pubsub.psubscribe("project:*")
        
        logger.info("Redis pub/sub listener started")
        
        try:
            async for message in pubsub.listen():
                if message["type"] == "pmessage":
                    channel = message["channel"]
                    project_id = channel.split(":")[-1]
                    
                    try:
                        data = json.loads(message["data"])
                        await self.send_to_project(project_id, data)
                    except json.JSONDecodeError:
                        logger.warning(f"Invalid JSON in Redis message: {message['data']}")
        except asyncio.CancelledError:
            await pubsub.punsubscribe("project:*")
            await pubsub.close()
    
    async def publish_event(self, project_id: str, event_type: str, data: dict):
        """Publish an event via Redis (for workers to call)."""
        await self.connect_redis()
        
        event = {
            "type": event_type,
            "project_id": project_id,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        await self.redis.publish(f"project:{project_id}", json.dumps(event))
    
    async def close(self):
        """Close all connections and cleanup."""
        if self._pubsub_task:
            self._pubsub_task.cancel()
            try:
                await self._pubsub_task
            except asyncio.CancelledError:
                pass
        
        if self.redis:
            await self.redis.close()


# Singleton instance
connection_manager = ConnectionManager()


async def websocket_endpoint(websocket: WebSocket, project_id: str):
    """
    WebSocket endpoint for project updates.
    
    Clients subscribe by connecting to /ws/{project_id}.
    Updates are pushed in real-time as tasks change state.
    """
    await connection_manager.connect(websocket, project_id)
    
    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connected",
            "project_id": project_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Receive messages from client (for ping/pong, etc.)
                data = await websocket.receive_text()
                
                if data == "ping":
                    await websocket.send_text("pong")
                    
            except WebSocketDisconnect:
                break
                
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        connection_manager.disconnect(websocket, project_id)
