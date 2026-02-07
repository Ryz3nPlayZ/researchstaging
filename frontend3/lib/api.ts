// API client utility for frontend3
// Base URL for backend API (development)
const API_BASE = '/api'; // Use proxy in development

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

// Generic fetch wrapper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      return {
        error: `HTTP ${response.status}: ${response.statusText}`,
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

// TypeScript types for API responses
export interface Project {
  id: string;
  research_goal: string;
  output_type: string;
  audience?: string;
  status: string;
  task_counts?: Record<string, number>;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface File {
  id: string;
  name: string;
  file_type: string;
  size_bytes: number;
  created_at: string;
  path?: string;
  description?: string;
  mime_type?: string;
  metadata?: Record<string, unknown>;
}

// Project APIs
export const projectApi = {
  list: () => apiRequest<Project[]>('/projects'),
  get: (id: string) => apiRequest<Project>(`/projects/${id}`),
  create: (data: { research_goal: string; output_type: string; audience?: string }) =>
    apiRequest<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// File APIs
export const fileApi = {
  list: (projectId?: string) =>
    apiRequest<File[]>(projectId ? `/files/projects/${projectId}/files` : '/files'),
  get: (id: string) => apiRequest<File>(`/files/${id}`),
};

// Document APIs
export const documentApi = {
  list: () => apiRequest('/documents'),
};

// Literature APIs
export const literatureApi = {
  search: (query: string) => apiRequest(`/literature/search?q=${query}`),
};
