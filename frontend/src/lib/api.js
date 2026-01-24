import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Projects API
export const projectsApi = {
  list: () => api.get('/projects'),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  executeAll: (id) => api.post(`/projects/${id}/execute-all`),
  getHistory: (id, limit = 50) => api.get(`/projects/${id}/history`, { params: { limit } }),
};

// Tasks API
export const tasksApi = {
  listByProject: (projectId) => api.get(`/projects/${projectId}/tasks`),
  get: (id) => api.get(`/tasks/${id}`),
  execute: (id) => api.post(`/tasks/${id}/execute`),
};

// Artifacts API
export const artifactsApi = {
  listByProject: (projectId) => api.get(`/projects/${projectId}/artifacts`),
  get: (id) => api.get(`/artifacts/${id}`),
};

// Papers API
export const papersApi = {
  listByProject: (projectId) => api.get(`/projects/${projectId}/papers`),
  get: (id) => api.get(`/papers/${id}`),
};

// Stats API
export const statsApi = {
  getGlobal: () => api.get('/stats'),
};

// WebSocket connection for real-time updates
export const createWebSocketConnection = (projectId, onEvent, onError) => {
  const wsUrl = BACKEND_URL.replace('http', 'ws').replace('https', 'wss');
  const ws = new WebSocket(`${wsUrl}/ws/${projectId}`);
  
  ws.onopen = () => {
    console.log('WebSocket connected for project:', projectId);
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onEvent(data);
    } catch (error) {
      console.error('WebSocket parse error:', error);
    }
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (onError) onError(error);
  };
  
  ws.onclose = () => {
    console.log('WebSocket closed for project:', projectId);
  };
  
  // Ping to keep connection alive
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send('ping');
    }
  }, 30000);
  
  // Return close function
  return {
    close: () => {
      clearInterval(pingInterval);
      ws.close();
    },
    send: (data) => ws.send(JSON.stringify(data))
  };
};

// Legacy SSE support (deprecated)
export const createSSEConnection = (projectId, onEvent) => {
  console.warn('SSE is deprecated. Use createWebSocketConnection instead.');
  return createWebSocketConnection(projectId, onEvent);
};

export default api;
