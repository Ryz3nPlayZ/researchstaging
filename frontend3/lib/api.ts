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

export interface Paper {
  id?: string;
  external_id?: string;
  source: string; // 'semantic_scholar' | 'arxiv'
  title: string;
  authors: string[];
  abstract?: string;
  year?: number;
  citation_count?: number;
  url?: string;
  pdf_url?: string;
  open_access_pdf_url?: string;
  doi?: string;
  journal?: string;
}

// TipTap JSON content type (simplified - full TipTap schema is complex)
export interface TipTapContent {
  type?: string;
  content?: TipTapContent[];
  attrs?: Record<string, unknown>;
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

export interface Document {
  id: string;
  project_id: string;
  title: string;
  content: TipTapContent;
  citation_style: string;
  created_at: string;
  updated_at: string;
}

// Document update request type for type-safe updates
export interface DocumentUpdateRequest {
  content?: TipTapContent;
  title?: string;
  citation_style?: string;
}

export interface Citation {
  id: string;
  paper_id: string;
  document_id: string;
  position: number;
  citation_text: string;
  formatted_citation: string;
}

export interface BibliographyEntry {
  id: string;
  authors: string;
  year: number;
  title: string;
  journal?: string;
  doi?: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  agent_type?: string;
}

export interface ChatRequest {
  message: string;
  agent_type: 'document' | 'literature' | 'memory' | 'general';
  context?: string;
}

export interface ChatResponse {
  response: string;
  agent_type: string;
  sources?: string[];
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Analysis types
export interface AnalysisRequest {
  code: string;
  language: 'python' | 'r';
  save_to_memory?: boolean;
}

export interface AnalysisResult {
  success: boolean;
  output: string;
  error: string;
  execution_time: number;
  finding_id?: string;
}

// Memory/Graph types
export interface Claim {
  id: string;
  source_id: string;
  claim_text: string;
  confidence: number;
  extracted_at: string;
  paper_id?: string;
}

export interface Finding {
  id: string;
  claim_ids: string[];
  synthesis: string;
  confidence: number;
  created_at: string;
}

export interface Relationship {
  id: string;
  from_claim_id: string;
  to_claim_id: string;
  relationship_type: 'supports' | 'contradicts' | 'extends';
  confidence: number;
}

export interface MemorySearchResult {
  claims: Claim[];
  findings: Finding[];
  relationships: Relationship[];
  total: number;
}

// Export types
export interface ExportRequest {
  document_id: string;
  project_id: string;
  author?: string;
  abstract?: string;
  keywords?: string[];
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
  upload: async (file: File, projectId: string) => {
    const formData = new FormData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData.append('file', file as any);
    formData.append('project_id', projectId);

    const response = await fetch(`${API_BASE}/files/projects/${projectId}/files/upload`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type for FormData (browser sets it with boundary)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Upload failed');
    }

    return response.json();
  },
};

// Document APIs
export const documentApi = {
  create: async (projectId: string, title: string = 'Untitled Document') =>
    apiRequest<Document>(`/projects/${projectId}/documents`, {
      method: 'POST',
      body: JSON.stringify({ title, citation_style: 'apa', content: {} }),
    }),

  get: (documentId: string) =>
    apiRequest<Document>(`/documents/${documentId}`),

  update: async (documentId: string, request: DocumentUpdateRequest) =>
    apiRequest<Document>(`/documents/${documentId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    }),

  delete: async (documentId: string) =>
    apiRequest(`/documents/${documentId}`, {
      method: 'DELETE',
    }),
};

// Citation APIs
export const citationApi = {
  search: async (query: string, limit: number = 10) =>
    apiRequest<Paper[]>(`/literature/search?q=${encodeURIComponent(query)}&limit=${limit}`),

  generate: async (documentId: string, format: 'apa' | 'mla' | 'chicago' = 'apa') =>
    apiRequest<{ bibliography: string; count: number; style: string }>(
      `/documents/${documentId}/bibliography?style=${format}`
    ),
};

// Literature APIs
export const literatureApi = {
  search: (query: string, limit: number = 20) =>
    apiRequest<Paper[]>(`/literature/search?q=${encodeURIComponent(query)}&limit=${limit}`),
};

// Chat APIs
export const chatApi = {
  send: (message: string, agentType: string = 'general', context?: string) =>
    apiRequest<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        agent_type: agentType,
        context,
      }),
    }),
};

// Analysis APIs
export const analysisApi = {
  execute: async (code: string, language: 'python' | 'r', projectId: string, saveToMemory = true) =>
    apiRequest<AnalysisResult>(`/analysis/projects/${projectId}/execute`, {
      method: 'POST',
      body: JSON.stringify({
        code,
        language,
        save_to_memory: saveToMemory,
      }),
    }),
};

// Export APIs
export const exportApi = {
  pdf: async (documentId: string, projectId: string, author?: string) => {
    const params = new URLSearchParams({ project_id: projectId });
    if (author) params.append('author', author);

    const response = await fetch(`${API_BASE}/documents/${documentId}/export/pdf?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Export failed' }));
      throw new Error(error.detail || 'Export failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${documentId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  docx: async (documentId: string, projectId: string, author?: string) => {
    const params = new URLSearchParams({ project_id: projectId });
    if (author) params.append('author', author);

    const response = await fetch(`${API_BASE}/documents/${documentId}/export/docx?${params.toString()}`);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Export failed' }));
      throw new Error(error.detail || 'Export failed');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `document-${documentId}.docx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

// Memory/Information Graph APIs
export const memoryApi = {
  search: async (query: string, limit: number = 20) =>
    apiRequest<MemorySearchResult>(`/memory/search?q=${encodeURIComponent(query)}&limit=${limit}`),

  claims: async (paperId?: string, limit: number = 50) => {
    const params = new URLSearchParams();
    if (paperId) params.append('paper_id', paperId);
    params.append('limit', limit.toString());
    return apiRequest<Claim[]>(`/memory/claims?${params}`);
  },

  findings: async (claimIds?: string[], limit: number = 20) => {
    const params = new URLSearchParams();
    if (claimIds && claimIds.length > 0) {
      claimIds.forEach(id => params.append('claim_ids', id));
    }
    params.append('limit', limit.toString());
    return apiRequest<Finding[]>(`/memory/findings?${params}`);
  },

  relationships: async (claimId?: string, limit: number = 50) => {
    const params = new URLSearchParams();
    if (claimId) params.append('claim_id', claimId);
    params.append('limit', limit.toString());
    return apiRequest<Relationship[]>(`/memory/relationships?${params}`);
  },
};
