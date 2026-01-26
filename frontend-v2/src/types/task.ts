/**
 * Task type definitions
 */

/**
 * State of a task in the execution lifecycle
 */
export enum TaskState {
  PENDING = 'pending',
  READY = 'ready',
  BLOCKED = 'blocked',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
}

/**
 * Type of task based on its function in the research workflow
 */
export enum TaskType {
  RESEARCH = 'research',
  ANALYSIS = 'analysis',
  WRITING = 'writing',
  REVIEW = 'review',
  CITATION = 'citation',
  PLANNING = 'planning',
}

/**
 * Task dependency specification
 */
export interface TaskDependency {
  task_id: string;
  type: 'hard' | 'soft';
}

/**
 * Core task entity
 */
export interface Task {
  id: string;
  project_id: string;
  type: TaskType;
  state: TaskState;
  phase: string;
  sequence_index: number;
  title: string;
  description: string;
  dependencies: TaskDependency[];
  agent_id?: string;
  artifact_ids: string[];
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
}

/**
 * Task graph node for ReactFlow visualization
 */
export interface TaskGraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    status: TaskState;
    taskType: TaskType;
    title: string;
    phase: string;
    sequence_index: number;
  };
}

/**
 * Task graph edge for ReactFlow visualization
 */
export interface TaskGraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'smoothstep' | 'straight';
  animated: boolean;
  label?: string;
}
