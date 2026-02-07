import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Project } from './api';

interface ProjectContextValue {
  currentProject: Project | null;
  currentProjectId: string | null;
  setCurrentProject: (project: Project) => void;
  loading: boolean;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
}

export function ProjectProvider({ children }: ProjectProviderProps) {
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Load first project on mount (for MVP)
  useEffect(() => {
    const loadProject = async () => {
      try {
        const { projectApi } = await import('./api');
        const response = await projectApi.list();

        if (response.data && response.data.length > 0) {
          setCurrentProjectState(response.data[0]);
        }
      } catch (err) {
        console.error('Failed to load project:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, []);

  const setCurrentProject = (project: Project) => {
    setCurrentProjectState(project);
  };

  const value: ProjectContextValue = {
    currentProject,
    currentProjectId: currentProject?.id || null,
    setCurrentProject,
    loading,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const context = useContext(ProjectContext);

  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }

  return context;
}
