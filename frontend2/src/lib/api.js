import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_BASE = `${BACKEND_URL}/api`;

// Store auth token in memory (initialize from localStorage)
let authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
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
    execute: (id) => api.post(`/projects/${id}/execute`),
    getTaskGraph: (id) => api.get(`/projects/${id}/task-graph`),
    getAgentGraph: (id) => api.get(`/projects/${id}/agent-graph`),
};

// Tasks API
export const tasksApi = {
    listByProject: (projectId) => api.get(`/projects/${projectId}/tasks`),
    get: (id) => api.get(`/tasks/${id}`),
    retry: (id) => api.post(`/tasks/${id}/retry`),
};

// Artifacts API
export const artifactsApi = {
    listByProject: (projectId) => api.get(`/projects/${projectId}/artifacts`),
    get: (id) => api.get(`/artifacts/${id}`),
};

// Planning API
export const planningApi = {
    generatePlan: (data) => api.post('/planning/generate-plan', data),
    approve: (data) => api.post('/planning/approve', data),
};

// Auth API
export const authApi = {
    login: async (email, name) => {
        const response = await api.post('/auth/login', { email, name });
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', response.data.token);
        }
        authToken = response.data.token;
        return response.data;
    },
    getMe: () => api.get('/auth/me'),
    logout: () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
        }
        authToken = null;
        return api.post('/auth/logout');
    },
};

// WebSocket connection for real-time updates
export const createWebSocketConnection = (projectId, onEvent, onError) => {
    const wsUrl = BACKEND_URL.replace('http', 'ws').replace('https', 'wss');
    const ws = new WebSocket(`${wsUrl}/ws/${projectId}`);

    ws.onopen = () => {
        console.log('WebSocket connected for project:', projectId);
    };

    ws.onmessage = (event) => {
        if (event.data === 'ping') {
            ws.send('pong');
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

    return {
        close: () => ws.close(),
        send: (data) => ws.send(JSON.stringify(data))
    };
};

export default api;
