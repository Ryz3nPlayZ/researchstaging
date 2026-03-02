/**
 * WebSocket client for real-time project updates.
 *
 * Connects to the backend WebSocket endpoint at /ws/{projectId}.
 * Next.js rewrites proxy this to the FastAPI backend.
 *
 * Event envelope from backend:
 *   { type: string, project_id: string, data: Record<string, unknown>, timestamp: string }
 */

import { getToken } from './auth';

export type WSEventType =
    | 'connected'
    | 'task_started'
    | 'task_completed'
    | 'task_failed'
    | 'execution_started'
    | 'project_updated';

export interface WSEvent {
    type: WSEventType;
    project_id: string;
    data: Record<string, unknown>;
    timestamp: string;
}

export type WSEventHandler = (event: WSEvent) => void;

interface ProjectWSOptions {
    /** Called for every event received */
    onEvent: WSEventHandler;
    /** Called when the connection opens */
    onOpen?: () => void;
    /** Called when the connection closes (including before a reconnect) */
    onClose?: () => void;
    /** Called on errors */
    onError?: (error: Event) => void;
}

const INITIAL_RETRY_MS = 1000;
const MAX_RETRY_MS = 30000;
const PING_INTERVAL_MS = 25000;

/**
 * Create a WebSocket connection to a project's real-time channel.
 * Returns a cleanup function to close the connection.
 */
export function createProjectWebSocket(
    projectId: string,
    options: ProjectWSOptions
): () => void {
    let ws: WebSocket | null = null;
    let retryMs = INITIAL_RETRY_MS;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let pingInterval: ReturnType<typeof setInterval> | null = null;
    let disposed = false;

    function getWsUrl(): string {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${window.location.host}/ws/${projectId}`;
    }

    function clearTimers() {
        if (retryTimeout) {
            clearTimeout(retryTimeout);
            retryTimeout = null;
        }
        if (pingInterval) {
            clearInterval(pingInterval);
            pingInterval = null;
        }
    }

    function connect() {
        if (disposed) return;

        try {
            ws = new WebSocket(getWsUrl());
        } catch {
            scheduleRetry();
            return;
        }

        ws.onopen = () => {
            retryMs = INITIAL_RETRY_MS; // reset backoff on successful connect
            options.onOpen?.();

            // Start ping keepalive
            pingInterval = setInterval(() => {
                if (ws?.readyState === WebSocket.OPEN) {
                    ws.send('ping');
                }
            }, PING_INTERVAL_MS);
        };

        ws.onmessage = (event) => {
            if (event.data === 'pong') return; // keepalive response, ignore

            try {
                const parsed = JSON.parse(event.data) as WSEvent;
                options.onEvent(parsed);
            } catch {
                // Ignore unparseable messages
            }
        };

        ws.onclose = () => {
            clearTimers();
            options.onClose?.();
            scheduleRetry();
        };

        ws.onerror = (err) => {
            options.onError?.(err);
            // onclose will fire after onerror, so retry is handled there
        };
    }

    function scheduleRetry() {
        if (disposed) return;
        retryTimeout = setTimeout(() => {
            connect();
        }, retryMs);
        // Exponential backoff, capped
        retryMs = Math.min(retryMs * 2, MAX_RETRY_MS);
    }

    // Start the connection
    connect();

    // Return cleanup function
    return () => {
        disposed = true;
        clearTimers();
        if (ws) {
            ws.onclose = null; // prevent reconnect on intentional close
            ws.close();
            ws = null;
        }
    };
}
