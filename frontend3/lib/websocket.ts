import React, { useCallback } from 'react';

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
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private isEnabled: boolean = true; // Master switch for WebSocket

  connect(projectId: string) {
    // Master switch - if disabled, don't connect
    if (!this.isEnabled) {
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      return;
    }

    // If already connected to the same project, do nothing
    if (this.ws?.readyState === WebSocket.OPEN && this.projectId === projectId) {
      return;
    }

    // Clean up existing connection before creating a new one
    this.disconnect();

    this.isConnecting = true;
    this.projectId = projectId;
    this.notifyStatus('connecting');

    try {
      // Construct WebSocket URL from VITE_API_URL environment variable
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const wsUrl = apiUrl.replace('http://', 'ws://').replace('https://', 'wss://');
      const ws = new WebSocket(`${wsUrl}/ws/${projectId}`);

      ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
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
        } catch {
          // Suppress parse errors for non-JSON messages
        }
      };

      ws.onerror = (event) => {
        this.isConnecting = false;
        // Only log first error to reduce spam
        if (this.reconnectAttempts === 0) {
          console.warn('WebSocket connection failed for project:', projectId);
        }
        this.notifyStatus('error');
      };

      ws.onclose = (event) => {
        this.isConnecting = false;
        this.notifyStatus('disconnected');
        this.cleanup();

        // Auto-reconnect with exponential backoff, up to max attempts
        if (this.reconnectAttempts < this.maxReconnectAttempts && this.isEnabled) {
          this.reconnectAttempts++;
          // Exponential backoff: 3s, 6s, 12s, 24s, 30s max
          const backoffDelay = Math.min(3000 * Math.pow(2, this.reconnectAttempts - 1), 30000);

          this.reconnectTimeout = setTimeout(() => {
            // Only reconnect if still for the same project
            if (this.projectId === projectId && this.isEnabled) {
              this.connect(projectId);
            }
          }, backoffDelay);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.warn('WebSocket max reconnect attempts reached for project:', projectId);
          this.projectId = null;
          this.reconnectAttempts = 0;
        }
      };

      this.ws = ws;
      this.startPing();
    } catch (error) {
      this.isConnecting = false;
      console.error('Failed to create WebSocket connection:', error);
      this.notifyStatus('error');
    }
  }

  disconnect() {
    this.isConnecting = false;
    this.reconnectAttempts = 0;
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

  // Enable/disable WebSocket entirely
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.disconnect();
    }
  }

  // Reset reconnect attempts
  resetReconnectAttempts() {
    this.reconnectAttempts = 0;
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

  // Use useCallback to memoize functions and prevent infinite re-renders
  const connect = useCallback((projectId: string) => {
    manager.connect(projectId);
  }, []);

  const disconnect = useCallback(() => {
    manager.disconnect();
  }, []);

  const on = useCallback((eventType: string, callback: (event: WebSocketEvent) => void) => {
    manager.on(eventType, callback);
    // Return cleanup function
    return () => manager.off(eventType, callback);
  }, []);

  const off = useCallback((eventType: string, callback: (event: WebSocketEvent) => void) => {
    manager.off(eventType, callback);
  }, []);

  const resetReconnectAttempts = useCallback(() => {
    manager.resetReconnectAttempts();
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    manager.setEnabled(enabled);
  }, []);

  return {
    status,
    connect,
    disconnect,
    on,
    off,
    resetReconnectAttempts,
    setEnabled,
  };
}
