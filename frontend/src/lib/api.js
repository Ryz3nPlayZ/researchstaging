import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API_BASE = `${BACKEND_URL}/api`;

// Store auth token in memory (initialize from localStorage)
let authToken = localStorage.getItem('auth_token');

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
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
    // Ignore ping/pong messages
    if (event.data === 'ping' || event.data === 'pong') {
      return;
    }

    try {
      const data = JSON.parse(event.data);
      onEvent(data);
    } catch (error) {
      console.error('WebSocket parse error:', error, 'Data:', event.data);
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

// Auth API
export const authApi = {
  login: async (code) => {
    const response = await api.post('/auth/login', { code });
    return response.data;
  },

  mockLogin: async (email, name) => {
    const response = await api.post('/auth/login', { email, name });
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getMe: async (token) => {
    const response = await axios.get(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  },

  getGoogleUrl: async () => {
    const response = await api.get('/auth/google-url');
    return response.data.auth_url;
  },
};

// Token management helpers
export const setAuthToken = (token) => {
  authToken = token;
};

export const clearAuthToken = () => {
  authToken = null;
};

export const getAuthToken = () => {
  return authToken;
};

// Convenience functions for use in components
export const login = async (code) => {
  const data = await authApi.login(code);
  setAuthToken(data.token);
  return data;
};

export const mockLogin = async (email, name) => {
  const data = await authApi.mockLogin(email, name);
  setAuthToken(data.token);
  return data;
};

export const logout = async () => {
  await authApi.logout();
  clearAuthToken();
};

export const getMe = async (token) => {
  return await authApi.getMe(token);
};

export default api;
