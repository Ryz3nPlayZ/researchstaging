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

// Project APIs
export const projectApi = {
  list: () => apiRequest('/projects'),
  get: (id: string) => apiRequest(`/projects/${id}`),
  create: (data: unknown) => apiRequest('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

// File APIs
export const fileApi = {
  list: () => apiRequest('/files'),
};

// Document APIs
export const documentApi = {
  list: () => apiRequest('/documents'),
};

// Literature APIs
export const literatureApi = {
  search: (query: string) => apiRequest(`/literature/search?q=${query}`),
};
