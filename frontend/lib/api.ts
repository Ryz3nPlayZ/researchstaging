// API client for Research UI — adapted from frontend3/lib/api.ts
// Uses Next.js rewrite proxy: /api/* → http://localhost:8000/api/*

import type {
  Project,
  Document,
  DocumentListItem,
  DocumentUpdateRequest,
  FileItem,
  Paper,
  ChatResponse,
  OnboardingChatResponse,
  SendMessageResponse,
  AnalysisResult,
  StatsResponse,
  TaskResponse,
  ArtifactResponse,
  Claim,
  ExecutionLogEntry,
  ProjectProvenance,
  ClaimCitationUsage,
  ClaimRelationship,
} from "./types";
import { getToken } from "./auth";

const API_BASE = "/api";

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface ExecutePlanResponse {
  goal: string;
  results: Array<Record<string, unknown>>;
  total_steps: number;
  completed_steps: number;
}

/** Generic fetch wrapper with auth token injection */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const token = getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
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
      error: error instanceof Error ? error.message : "Unknown error",
      status: 0,
    };
  }
}

// ============== Project APIs ==============

export const projectApi = {
  list: () => apiRequest<Project[]>("/projects"),

  get: (id: string) => apiRequest<Project>(`/projects/${id}`),

  create: (data: {
    research_goal: string;
    output_type: string;
    audience?: string;
    additional_context?: string;
  }) =>
    apiRequest<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<{ message: string }>(`/projects/${id}`, { method: "DELETE" }),

  execute: (id: string) =>
    apiRequest<{ message: string; tasks_queued: number }>(
      `/projects/${id}/execute`,
      {
        method: "POST",
      },
    ),
};

// ============== Document APIs ==============

export const documentApi = {
  list: (projectId: string) =>
    apiRequest<DocumentListItem[]>(`/projects/${projectId}/documents`),

  create: (projectId: string, title: string = "Untitled Document") =>
    apiRequest<Document>(`/projects/${projectId}/documents`, {
      method: "POST",
      body: JSON.stringify({ title, citation_style: "apa" }),
    }),

  get: (documentId: string) => apiRequest<Document>(`/documents/${documentId}`),

  update: (documentId: string, request: DocumentUpdateRequest) =>
    apiRequest<Document>(`/documents/${documentId}`, {
      method: "PUT",
      body: JSON.stringify(request),
    }),

  delete: (documentId: string) =>
    apiRequest<{ message: string }>(`/documents/${documentId}`, {
      method: "DELETE",
    }),
};

// ============== File APIs ==============

export const fileApi = {
  list: (projectId: string) =>
    apiRequest<FileItem[]>(`/files/projects/${projectId}/files`),

  upload: async (file: File, projectId: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("project_id", projectId);

    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(
      `${API_BASE}/files/projects/${projectId}/files/upload`,
      {
        method: "POST",
        body: formData,
        headers,
      },
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Upload failed" }));
      throw new Error(error.detail || "Upload failed");
    }

    return response.json();
  },

  download: async (fileId: string, fileName: string) => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(
      `${API_BASE}/files/${fileId}/download?disposition=attachment`,
      { headers },
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ detail: "Download failed" }));
      throw new Error(error.detail || "Download failed");
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      const data = await response.json();
      const a = document.createElement("a");
      a.href = data.download_url;
      a.download = data.filename || fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  },

  getContent: (fileId: string, projectId: string) =>
    apiRequest<{
      file_id: string;
      content?: string;
      extension: string;
      format: string;
    }>(`/files/${fileId}/content?project_id=${encodeURIComponent(projectId)}`),

  getBlobUrl: async (fileId: string) => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(
      `${API_BASE}/files/${fileId}/download?disposition=inline`,
      { headers },
    );

    if (!response.ok) {
      throw new Error("Preview failed");
    }

    const blob = await response.blob();
    return window.URL.createObjectURL(blob);
  },
};

// ============== Task APIs ==============

export const taskApi = {
  list: (projectId: string) =>
    apiRequest<TaskResponse[]>(`/projects/${projectId}/tasks`),

  get: (taskId: string) => apiRequest<TaskResponse>(`/tasks/${taskId}`),

  retry: (taskId: string) =>
    apiRequest<{ message: string }>(`/tasks/${taskId}/retry`, {
      method: "POST",
    }),
};

export const executionLogApi = {
  list: (projectId: string, limit: number = 50) =>
    apiRequest<ExecutionLogEntry[]>(
      `/projects/${projectId}/execution-logs?limit=${limit}`,
    ),
};

// ============== Artifact APIs ==============

export const artifactApi = {
  list: (projectId: string) =>
    apiRequest<ArtifactResponse[]>(`/projects/${projectId}/artifacts`),

  get: (artifactId: string) =>
    apiRequest<ArtifactResponse>(`/artifacts/${artifactId}`),
};

// ============== Chat APIs ==============

export const chatApi = {
  send: (message: string, agentType: string = "general", context?: string) =>
    apiRequest<ChatResponse>("/chat/chat", {
      method: "POST",
      body: JSON.stringify({ message, agent_type: agentType, context }),
    }),

  onboarding: (sessionId: string, message: string) =>
    apiRequest<OnboardingChatResponse>("/chat/onboarding", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, message }),
    }),

  sendProject: (
    projectId: string,
    message: string,
    context?: Record<string, unknown>,
  ) =>
    apiRequest<SendMessageResponse>(`/chat/projects/${projectId}/send`, {
      method: "POST",
      body: JSON.stringify({ message, context }),
    }),

  history: (projectId: string, limit: number = 50) =>
    apiRequest<{
      messages: Array<{
        id: string;
        role: string;
        content: string;
        timestamp: string;
      }>;
      total: number;
    }>(`/chat/${projectId}/messages?limit=${limit}`),

  proposePlan: (
    projectId: string,
    query: string,
    context?: Record<string, unknown>,
  ) =>
    apiRequest<Record<string, unknown>>(
      `/chat/projects/${projectId}/propose-plan`,
      {
        method: "POST",
        body: JSON.stringify({ query, context }),
      },
    ),

  executePlan: (
    projectId: string,
    plan: Record<string, unknown>,
    context?: Record<string, unknown>,
  ) =>
    apiRequest<ExecutePlanResponse>(
      `/chat/projects/${projectId}/execute-plan`,
      {
        method: "POST",
        body: JSON.stringify({ plan, context: context || {} }),
      },
    ),
};

// ============== Literature APIs ==============

export interface LiteratureV2Response {
  query: string;
  phase: number;
  candidate_pool_size: number;
  returned_count: number;
  intent: Record<string, unknown>;
  timing: {
    intent_ms: number;
    retrieval_ms: number;
    scoring_ms: number;
    total_ms: number;
  };
  degrade: {
    skipped_citation_expansion: boolean;
    reduced_candidate_pool: boolean;
    cross_encoder_top_k_only: boolean;
  };
  filter_drops: Record<string, number>;
  papers: Paper[];
}

export const literatureApi = {
  search: (query: string, limit: number = 20) =>
    apiRequest<Paper[]>(
      `/literature/search?query=${encodeURIComponent(query)}&limit=${limit}`,
    ),

  searchV2: (query: string) =>
    apiRequest<LiteratureV2Response>(
      `/literature/search/v2?query=${encodeURIComponent(query)}`,
    ),

  refineV2: (query: string) =>
    apiRequest<LiteratureV2Response>(
      `/literature/search/v2/refine?query=${encodeURIComponent(query)}`,
    ),
};

// V2 Enhanced Literature API
export interface RelevanceBreakdownV2 {
  semantic_alignment?: number;
  attribute_alignment?: number;
  methodological_match?: number;
  dataset_match?: number;
  citation_signal?: number;
  recency_score?: number;
  source_diversity_score?: number;
  feedback_boost?: number;
  final_score?: number;
}

export interface PaperV2 extends Paper {
  relevance_breakdown?: RelevanceBreakdownV2;
  v2_enhanced?: boolean;
}

export interface LiteratureSearchV2Response {
  query: string;
  papers: PaperV2[];
  intent: Record<string, unknown>;
  total_found: number;
  from_cache: boolean;
  sources: string[];
  timing: {
    intent_ms: number;
    search_ms: number;
    dedup_ms: number;
    rank_ms: number;
    enrich_ms: number;
    total_ms: number;
  };
}

export const literatureV2Api = {
  search: (
    query: string,
    opts?: { includeScholar?: boolean; includeCrossref?: boolean },
  ) => {
    const params = new URLSearchParams({ query });
    if (opts?.includeScholar !== undefined)
      params.set("include_scholar", String(opts.includeScholar));
    if (opts?.includeCrossref !== undefined)
      params.set("include_crossref", String(opts.includeCrossref));
    return apiRequest<LiteratureSearchV2Response>(
      `/literature-v2/search?${params}`,
    );
  },

  submitFeedback: (paperId: string, query: string, relevant: boolean) =>
    apiRequest<{ success: boolean; message: string }>(
      "/literature-v2/feedback",
      {
        method: "POST",
        body: JSON.stringify({ paper_id: paperId, query, relevant }),
      },
    ),

  getSimilar: (paperId: string, limit?: number) => {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));
    return apiRequest<{ source_paper_id: string; papers: PaperV2[] }>(
      `/literature-v2/similar/${encodeURIComponent(paperId)}?${params}`,
    );
  },
};

// ============== Papers APIs ==============

export const papersApi = {
  list: (projectId: string, search?: string, limit: number = 100) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (search) params.append("search", search);
    return apiRequest<Paper[]>(`/projects/${projectId}/papers?${params}`);
  },

  get: (paperId: string) => apiRequest<Paper>(`/papers/${paperId}`),

  add: (projectId: string, paper: Partial<Paper>) =>
    apiRequest<Paper>(`/projects/${projectId}/papers`, {
      method: "POST",
      body: JSON.stringify(paper),
    }),
};

// ============== Analysis APIs ==============

export const analysisApi = {
  execute: (
    code: string,
    language: "python" | "r",
    projectId: string,
    saveToMemory = true,
  ) =>
    apiRequest<AnalysisResult>(`/analysis/projects/${projectId}/execute`, {
      method: "POST",
      body: JSON.stringify({ code, language, save_to_memory: saveToMemory }),
    }),
};

// ============== Stats APIs ==============

export const statsApi = {
  global: () => apiRequest<StatsResponse>("/stats"),
};

// ============== Planning APIs ==============

export const planningApi = {
  generatePlan: (answers: Record<string, unknown>) =>
    apiRequest<Record<string, unknown>>("/planning/generate-plan", {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),

  approve: (answers: Record<string, unknown>, plan: Record<string, unknown>) =>
    apiRequest<{ project_id: string; plan_id: string; message: string }>(
      "/planning/approve",
      {
        method: "POST",
        body: JSON.stringify({ answers, plan }),
      },
    ),
};

// ============== Export APIs ==============

export const exportApi = {
  pdf: async (documentId: string, projectId: string, author?: string) => {
    const params = new URLSearchParams({ project_id: projectId });
    if (author) params.append("author", author);

    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(
      `${API_BASE}/documents/${documentId}/export/pdf?${params}`,
      { headers },
    );
    if (!response.ok) throw new Error("Export failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `document-${documentId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  docx: async (documentId: string, projectId: string, author?: string) => {
    const params = new URLSearchParams({ project_id: projectId });
    if (author) params.append("author", author);

    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(
      `${API_BASE}/documents/${documentId}/export/docx?${params}`,
      { headers },
    );
    if (!response.ok) throw new Error("Export failed");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `document-${documentId}.docx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};

// ============== Memory APIs ==============

export const memoryApi = {
  searchClaims: (projectId: string, query: string, limit: number = 20) =>
    apiRequest<Claim[]>(
      `/memory/projects/${projectId}/claims/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    ),

  listClaims: (projectId: string, limit: number = 50) =>
    apiRequest<Claim[]>(`/memory/projects/${projectId}/claims?limit=${limit}`),

  getProvenance: (
    projectId: string,
    claimLimit: number = 50,
    artifactLimit: number = 50,
  ) =>
    apiRequest<ProjectProvenance>(
      `/memory/projects/${projectId}/provenance?claim_limit=${claimLimit}&artifact_limit=${artifactLimit}`,
    ),

  getRelatedClaims: (
    projectId: string,
    claimId: string,
    maxDepth: number = 3,
  ) =>
    apiRequest<Claim[]>(
      `/memory/projects/${projectId}/claims/${claimId}/related?max_depth=${maxDepth}`,
    ),

  getClaimRelationships: (projectId: string, claimId: string) =>
    apiRequest<ClaimRelationship[]>(
      `/memory/projects/${projectId}/claims/${claimId}/relationships`,
    ),

  getClaimCitations: (projectId: string, claimId: string) =>
    apiRequest<ClaimCitationUsage[]>(
      `/memory/projects/${projectId}/claims/${claimId}/citations`,
    ),
};
