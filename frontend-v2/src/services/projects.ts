/**
 * Projects API Service
 *
 * Provides methods for interacting with project-related API endpoints.
 * Handles project listing, creation, and retrieval operations.
 */

import { api } from './api';
import type {
  Project,
  CreateProjectRequest,
  CreateProjectResponse,
} from '../types/project';

/**
 * Get all projects for the authenticated user
 *
 * @returns Promise resolving to array of projects
 * @throws ApiRequestError on API errors
 */
export async function getProjects(): Promise<Project[]> {
  return api.get<Project[]>('/projects');
}

/**
 * Create a new project
 *
 * @param request - Project creation request with research_goal, output_type, audience
 * @returns Promise resolving to creation response with project_id, status, message
 * @throws ApiRequestError on API errors
 */
export async function createProject(
  request: CreateProjectRequest
): Promise<CreateProjectResponse> {
  return api.post<CreateProjectResponse>('/projects', request);
}

/**
 * Get a specific project by ID
 *
 * @param projectId - Unique identifier of the project
 * @returns Promise resolving to full project details with tasks
 * @throws ApiRequestError on API errors
 */
export async function getProject(projectId: string): Promise<Project> {
  return api.get<Project>(`/projects/${projectId}`);
}
