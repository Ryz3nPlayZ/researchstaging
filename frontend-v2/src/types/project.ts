/**
 * Project type definitions
 */

/**
 * Status of a project in the research workflow
 */
export enum ProjectStatus {
  INITIALIZING = 'initializing',
  PLANNING = 'planning',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PAUSED = 'paused',
}

/**
 * Count of tasks in various states
 */
export interface TaskCounts {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  blocked: number;
}

/**
 * Core project entity
 */
export interface Project {
  id: string;
  research_goal: string;
  output_type: string;
  audience: string;
  status: ProjectStatus;
  task_counts: TaskCounts;
  created_at: string;
  updated_at: string;
}

/**
 * Request payload for creating a new project
 */
export interface CreateProjectRequest {
  research_goal: string;
  output_type: 'blog_post' | 'research_paper' | 'technical_report' | 'presentation';
  audience: string;
}

/**
 * Response payload after project creation
 */
export interface CreateProjectResponse {
  project_id: string;
  status: ProjectStatus;
  message: string;
}
