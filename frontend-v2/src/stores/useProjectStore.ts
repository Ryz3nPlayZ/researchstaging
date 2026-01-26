/**
 * Project State Management
 *
 * Manages active project state, task graph visualization data,
 * and real-time task status updates.
 */

import { create } from 'zustand';
import type { Project } from '../types/project';
import type { TaskGraphNode, TaskGraphEdge } from '../types/task';
import type { TaskState } from '../types/task';

interface ProjectState {
  // Current active project
  activeProject: Project | null;
  setActiveProject: (project: Project | null) => void;

  // Task graph state for ReactFlow visualization
  taskGraphNodes: TaskGraphNode[];
  taskGraphEdges: TaskGraphEdge[];
  updateTaskNode: (taskId: string, updates: Partial<TaskGraphNode>) => void;
  setTaskGraph: (nodes: TaskGraphNode[], edges: TaskGraphEdge[]) => void;

  // Real-time task status tracking
  taskStatuses: Map<string, TaskState>;
  updateTaskStatus: (taskId: string, status: TaskState) => void;
  getTaskStatus: (taskId: string) => TaskState | undefined;

  // Reset store to initial state
  reset: () => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  // Initial state
  activeProject: null,
  taskGraphNodes: [],
  taskGraphEdges: [],
  taskStatuses: new Map(),

  // Actions
  setActiveProject: (project) => set({ activeProject: project }),

  updateTaskNode: (taskId, updates) =>
    set((state) => ({
      taskGraphNodes: state.taskGraphNodes.map((node) =>
        node.id === taskId ? { ...node, ...updates } : node
      ),
    })),

  setTaskGraph: (nodes, edges) => set({ taskGraphNodes: nodes, taskGraphEdges: edges }),

  updateTaskStatus: (taskId, status) =>
    set((state) => {
      const newStatuses = new Map(state.taskStatuses);
      newStatuses.set(taskId, status);
      return { taskStatuses: newStatuses };
    }),

  getTaskStatus: (taskId) => {
    return get().taskStatuses.get(taskId);
  },

  reset: () =>
    set({
      activeProject: null,
      taskGraphNodes: [],
      taskGraphEdges: [],
      taskStatuses: new Map(),
    }),
}));
