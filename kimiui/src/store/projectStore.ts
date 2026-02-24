import { create } from 'zustand';
import type { Project, Task, Artifact, Paper, ExecutionLog } from '@/types';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  tasks: Task[];
  artifacts: Artifact[];
  papers: Paper[];
  logs: ExecutionLog[];
  isLoadingProjects: boolean;
  isLoadingProject: boolean;
  isLoadingTasks: boolean;
  isLoadingArtifacts: boolean;
  isLoadingPapers: boolean;
  isLoadingLogs: boolean;
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  setTasks: (tasks: Task[]) => void;
  setArtifacts: (artifacts: Artifact[]) => void;
  setPapers: (papers: Paper[]) => void;
  setLogs: (logs: ExecutionLog[]) => void;
  setLoadingProjects: (loading: boolean) => void;
  setLoadingProject: (loading: boolean) => void;
  setLoadingTasks: (loading: boolean) => void;
  setLoadingArtifacts: (loading: boolean) => void;
  setLoadingPapers: (loading: boolean) => void;
  setLoadingLogs: (loading: boolean) => void;
  updateProjectInList: (project: Project) => void;
  updateTask: (task: Task) => void;
  addLog: (log: ExecutionLog) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  tasks: [],
  artifacts: [],
  papers: [],
  logs: [],
  isLoadingProjects: false,
  isLoadingProject: false,
  isLoadingTasks: false,
  isLoadingArtifacts: false,
  isLoadingPapers: false,
  isLoadingLogs: false,
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (project) => set({ currentProject: project }),
  setTasks: (tasks) => set({ tasks }),
  setArtifacts: (artifacts) => set({ artifacts }),
  setPapers: (papers) => set({ papers }),
  setLogs: (logs) => set({ logs }),
  setLoadingProjects: (isLoadingProjects) => set({ isLoadingProjects }),
  setLoadingProject: (isLoadingProject) => set({ isLoadingProject }),
  setLoadingTasks: (isLoadingTasks) => set({ isLoadingTasks }),
  setLoadingArtifacts: (isLoadingArtifacts) => set({ isLoadingArtifacts }),
  setLoadingPapers: (isLoadingPapers) => set({ isLoadingPapers }),
  setLoadingLogs: (isLoadingLogs) => set({ isLoadingLogs }),
  updateProjectInList: (project) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === project.id ? project : p
      ),
    })),
  updateTask: (task) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === task.id ? task : t
      ),
    })),
  addLog: (log) =>
    set((state) => ({
      logs: [log, ...state.logs].slice(0, 100),
    })),
}));
