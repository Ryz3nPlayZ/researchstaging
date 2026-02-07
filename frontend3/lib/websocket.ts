import React from 'react';

// WebSocket event types
export interface WebSocketEvent {
  type: string;
  project_id: string;
  data?: unknown;
  timestamp: string;
}

// Connection status
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// WebSocket manager
class WebSocketManager {
  private ws: WebSocket | null = null;
  private projectId: string | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private listeners: Map<string, Set<(event: WebSocketEvent) => void>> = new Map();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();

  connect(projectId: string, baseUrl: string = '/api') {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    this.projectId = projectId;
    this.notifyStatus('connecting');

    // Convert HTTP base URL to WebSocket URL
    const wsUrl = baseUrl.replace('http', 'ws').replace('https', 'wss');
    const ws = new WebSocket(`${wsUrl}/ws/${projectId}`);

    ws.onopen = () => {
      console.log('WebSocket connected for project:', projectId);
      this.notifyStatus('connected');
    };

    ws.onmessage = (event) => {
      // Ignore ping/pong messages
      if (event.data === 'ping' || event.data === 'pong') {
        return;
      }

      try {
        const data = JSON.parse(event.data) as WebSocketEvent;
        this.emit(data.type, data);
      } catch (error) {
        console.error('WebSocket parse error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.notifyStatus('error');
    };

    ws.onclose = () => {
      console.log('WebSocket closed for project:', projectId);
      this.notifyStatus('disconnected');
      this.cleanup();

      // Auto-reconnect after 3 seconds
      this.reconnectTimeout = setTimeout(() => {
        if (this.projectId) {
          this.connect(this.projectId, baseUrl);
        }
      }, 3000);
    };

    this.ws = ws;
    this.startPing();
  }

  disconnect() {
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.projectId = null;
  }

  private cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private startPing() {
    // Send ping every 30 seconds to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 30000);
  }

  on(eventType: string, callback: (event: WebSocketEvent) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
  }

  off(eventType: string, callback: (event: WebSocketEvent) => void) {
    this.listeners.get(eventType)?.delete(callback);
  }

  private emit(eventType: string, event: WebSocketEvent) {
    this.listeners.get(eventType)?.forEach(callback => callback(event));
  }

  onStatusChange(callback: (status: ConnectionStatus) => void) {
    this.statusListeners.add(callback);
  }

  offStatusChange(callback: (status: ConnectionStatus) => void) {
    this.statusListeners.delete(callback);
  }

  private notifyStatus(status: ConnectionStatus) {
    this.statusListeners.forEach(callback => callback(status));
  }
}

// Singleton instance
const manager = new WebSocketManager();

// React hook for WebSocket
export function useWebSocket() {
  const [status, setStatus] = React.useState<ConnectionStatus>('disconnected');

  React.useEffect(() => {
    const handleStatusChange = (newStatus: ConnectionStatus) => {
      setStatus(newStatus);
    };

    manager.onStatusChange(handleStatusChange);

    return () => {
      manager.offStatusChange(handleStatusChange);
    };
  }, []);

  return {
    status,
    connect: (projectId: string, baseUrl?: string) => manager.connect(projectId, baseUrl),
    disconnect: () => manager.disconnect(),
    on: (eventType: string, callback: (event: WebSocketEvent) => void) => manager.on(eventType, callback),
    off: (eventType: string, callback: (event: WebSocketEvent) => void) => manager.off(eventType, callback),
  };
}
