// API Client for Kimi UI
// Connects to the backend at localhost:8000

import type { 
  User, Project, Task, Artifact, Paper, ExecutionLog, Stats,
  CreateProjectRequest, ApiResponse 
} from '@/types';

const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('kimi_token');
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      return {
        error: body.detail || `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
      };
    }

    const data = await response.json();
    return { data, status: response.status };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 0,
    };
  }
}

// Auth APIs
export const authApi = {
  login: (email: string, name?: string) =>
    apiRequest<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    }),

  me: () => apiRequest<User>('/auth/me'),

  logout: () => apiRequest<{ message: string }>('/auth/logout', { method: 'POST' }),
};

// Project APIs
export const projectApi = {
  list: () => apiRequest<Project[]>('/projects'),

  get: (id: string) => apiRequest<Project>(`/projects/${id}`),

  create: (data: CreateProjectRequest) =>
    apiRequest<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/projects/${id}`, { method: 'DELETE' }),

  execute: (id: string) =>
    apiRequest<{ message: string; tasks_queued: number }>(`/projects/${id}/execute`, {
      method: 'POST',
    }),

  getTasks: (id: string) => apiRequest<Task[]>(`/projects/${id}/tasks`),

  getArtifacts: (id: string) => apiRequest<Artifact[]>(`/projects/${id}/artifacts`),

  getPapers: (id: string) => apiRequest<Paper[]>(`/projects/${id}/papers`),

  getLogs: (id: string, limit = 50) =>
    apiRequest<ExecutionLog[]>(`/projects/${id}/execution-logs?limit=${limit}`),

  getTaskGraph: (id: string) =>
    apiRequest<{ nodes: unknown[]; edges: unknown[] }>(`/projects/${id}/task-graph`),

  getAgentGraph: (id: string) =>
    apiRequest<{ nodes: unknown[]; edges: unknown[] }>(`/projects/${id}/agent-graph`),

  getCitationNetwork: (id: string) =>
    apiRequest<{ nodes: unknown[]; edges: unknown[]; stats: unknown }>(
      `/projects/${id}/citation-network`
    ),
};

// Task APIs
export const taskApi = {
  get: (id: string) => apiRequest<Task>(`/tasks/${id}`),

  retry: (id: string) =>
    apiRequest<{ message: string }>(`/tasks/${id}/retry`, { method: 'POST' }),
};

// Artifact APIs
export const artifactApi = {
  get: (id: string) => apiRequest<Artifact>(`/artifacts/${id}`),

  updateContent: (id: string, content: string) =>
    apiRequest<{ message: string; artifact_id: string; version: number }>(
      `/artifacts/${id}/content`,
      {
        method: 'PUT',
        body: JSON.stringify({ content }),
      }
    ),

  export: (id: string, format: string, title?: string, author?: string) =>
    apiRequest<Blob>(`/artifacts/${id}/export`, {
      method: 'POST',
      body: JSON.stringify({ format, title, author }),
    }),
};

// Stats APIs
export const statsApi = {
  global: () => apiRequest<Stats>('/stats'),
};

// Planning APIs
export const planningApi = {
  generatePlan: (answers: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>('/planning/generate-plan', {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  approve: (answers: Record<string, unknown>, plan: Record<string, unknown>) =>
    apiRequest<{ project_id: string; plan_id: string; message: string }>(
      '/planning/approve',
      {
        method: 'POST',
        body: JSON.stringify({ answers, plan }),
      }
    ),
};

// WebSocket connection
export function createWebSocket(projectId: string): WebSocket {
  const token = getToken();
  const wsUrl = `ws://localhost:8000/ws/${projectId}${token ? `?token=${token}` : ''}`;
  return new WebSocket(wsUrl);
}
