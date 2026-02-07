"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectsApi, tasksApi, createWebSocketConnection } from '@/lib/api';

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
    const [projects, setProjects] = useState([]);
    const [currentProject, setCurrentProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [artifacts, setArtifacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const refreshProjects = useCallback(async () => {
        try {
            setLoading(true);
            const response = await projectsApi.list();
            setProjects(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load projects');
            setLoading(false);
        }
    }, []);

    const selectProject = useCallback(async (projectId) => {
        try {
            setLoading(true);
            const response = await projectsApi.get(projectId);
            setCurrentProject(response.data);

            const tasksResponse = await tasksApi.listByProject(projectId);
            setTasks(tasksResponse.data);

            setLoading(false);
        } catch (err) {
            setError('Failed to select project');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshProjects();
    }, [refreshProjects]);

    // WebSocket for real-time updates
    useEffect(() => {
        if (!currentProject) return;

        const connection = createWebSocketConnection(
            currentProject.id,
            (event) => {
                console.log('WS Event:', event);
                if (event.type === 'task_updated' || event.type === 'task_completed') {
                    // Update tasks list
                    setTasks(prev => prev.map(t =>
                        t.id === event.data.task_id ? { ...t, state: event.data.state } : t
                    ));
                }
                // Refresh project if status changed
                if (event.type === 'project_updated') {
                    setCurrentProject(prev => ({ ...prev, status: event.data.status }));
                }
            }
        );

        return () => connection.close();
    }, [currentProject]);

    return (
        <ProjectContext.Provider value={{
            projects,
            currentProject,
            tasks,
            artifacts,
            loading,
            error,
            refreshProjects,
            selectProject,
            setTasks,
            setArtifacts
        }}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProject() {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
}
