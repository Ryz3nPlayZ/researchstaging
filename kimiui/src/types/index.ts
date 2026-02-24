// Kimi UI Types - Alternative interface types

export interface User {
  id: string;
  email: string;
  name: string | null;
  picture_url: string | null;
  credits_remaining: number;
}

export interface Project {
  id: string;
  research_goal: string;
  output_type: string;
  audience: string | null;
  status: 'created' | 'planned' | 'executing' | 'completed' | 'failed';
  task_counts: {
    total?: number;
    completed?: number;
    failed?: number;
    running?: number;
    pending?: number;
  };
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface Task {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  task_type: string;
  state: 'pending' | 'ready' | 'running' | 'completed' | 'failed' | 'waiting';
  phase_index: number;
  sequence_index: number;
  retry_count: number;
  max_retries: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  output_artifact_id: string | null;
}

export interface Artifact {
  id: string;
  project_id: string;
  task_id: string | null;
  run_id: string | null;
  artifact_type: string;
  title: string;
  content: string | null;
  metadata: Record<string, unknown>;
  version: number;
  created_at: string;
}

export interface Paper {
  id: string;
  project_id: string;
  source: string;
  title: string;
  authors: string[];
  abstract: string | null;
  year: number | null;
  citation_count: number | null;
  url: string | null;
  pdf_url: string | null;
  summary: string | null;
  created_at: string;
}

export interface ExecutionLog {
  id: string;
  project_id: string;
  task_id: string | null;
  run_id: string | null;
  event_type: string;
  level: string;
  message: string;
  data: Record<string, unknown> | null;
  timestamp: string;
}

export interface Stats {
  projects: number;
  tasks: number;
  artifacts: number;
  papers: number;
  task_breakdown: Record<string, number>;
}

export interface CreateProjectRequest {
  research_goal: string;
  output_type: string;
  audience?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}
