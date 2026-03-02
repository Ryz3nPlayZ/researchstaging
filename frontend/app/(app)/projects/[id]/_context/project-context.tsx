'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
    projectApi,
    documentApi,
    fileApi,
    taskApi,
    executionLogApi,
    artifactApi,
    papersApi,
    memoryApi,
} from '@/lib/api';
import type { LiteratureV2Response } from '@/lib/api';
import type {
    Project,
    DocumentListItem,
    FileItem,
    TaskResponse,
    ExecutionLogEntry,
    ArtifactResponse,
    Paper,
    ProjectProvenance,
} from '@/lib/types';
import { createProjectWebSocket, type WSEvent } from '@/lib/ws';

// ─── Inspector types ──────────────────────────────────────────────

export type InspectorContentType = 'paper' | 'task' | 'claim' | 'artifact';

export interface InspectorContent {
    type: InspectorContentType;
    id: string;
    data: Record<string, unknown>;
}

// ─── Phase summary helper ──────────────────────────────────────────

export interface PhaseSummary {
    name: string;
    index: number;
    tasks: TaskResponse[];
    completed: number;
    total: number;
}

function buildPhaseSummary(tasks: TaskResponse[]): PhaseSummary[] {
    const phaseMap = new Map<number, TaskResponse[]>();
    for (const t of tasks) {
        const list = phaseMap.get(t.phase_index) ?? [];
        list.push(t);
        phaseMap.set(t.phase_index, list);
    }

    const PHASE_NAMES = ['Discovery', 'Analysis', 'Synthesis', 'Output'];
    return Array.from(phaseMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([index, phaseTasks]) => ({
            name: PHASE_NAMES[index] ?? `Phase ${index + 1}`,
            index,
            tasks: phaseTasks.sort((a, b) => a.sequence_index - b.sequence_index),
            completed: phaseTasks.filter((t) => t.state === 'completed').length,
            total: phaseTasks.length,
        }));
}

// ─── Context value type ────────────────────────────────────────────

interface ProjectContextValue {
    // Core data
    projectId: string;
    project: Project | null;
    tasks: TaskResponse[];
    documents: DocumentListItem[];
    files: FileItem[];
    executionLogs: ExecutionLogEntry[];
    artifacts: ArtifactResponse[];
    papers: Paper[];
    provenance: ProjectProvenance | null;

    // Derived
    isExecuting: boolean;
    phases: PhaseSummary[];
    completedTaskCount: number;
    failedTaskCount: number;
    totalTaskCount: number;

    // Loading states
    loading: boolean;
    provenanceLoading: boolean;
    wsConnected: boolean;

    // Actions
    refreshAll: () => Promise<void>;
    refreshTasks: () => Promise<void>;
    refreshPapers: () => Promise<void>;
    loadProvenance: () => Promise<void>;
    executeProject: () => Promise<boolean>;
    deleteProject: () => Promise<boolean>;
    createDocument: () => Promise<string | null>;
    uploadFile: (file: File) => Promise<boolean>;

    // Inspector
    inspectorContent: InspectorContent | null;
    openInspector: (type: InspectorContentType, id: string, data: Record<string, unknown>) => void;
    closeInspector: () => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

// ─── Hook ──────────────────────────────────────────────────────────

export function useProject(): ProjectContextValue {
    const ctx = useContext(ProjectContext);
    if (!ctx) throw new Error('useProject must be used within a ProjectProvider');
    return ctx;
}

// ─── Provider ──────────────────────────────────────────────────────

export function ProjectProvider({
    projectId,
    children,
}: {
    projectId: string;
    children: React.ReactNode;
}) {
    // Core state
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<TaskResponse[]>([]);
    const [documents, setDocuments] = useState<DocumentListItem[]>([]);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [executionLogs, setExecutionLogs] = useState<ExecutionLogEntry[]>([]);
    const [artifacts, setArtifacts] = useState<ArtifactResponse[]>([]);
    const [papers, setPapers] = useState<Paper[]>([]);
    const [provenance, setProvenance] = useState<ProjectProvenance | null>(null);

    // UI state
    const [loading, setLoading] = useState(true);
    const [provenanceLoading, setProvenanceLoading] = useState(false);
    const [wsConnected, setWsConnected] = useState(false);
    const [inspectorContent, setInspectorContent] = useState<InspectorContent | null>(null);

    const router = useRouter();

    // ─── Data loading ────────────────────────────────────────────

    const refreshAll = useCallback(async () => {
        const [projRes, docsRes, filesRes, tasksRes, logsRes, papersRes, artifactsRes] =
            await Promise.all([
                projectApi.get(projectId),
                documentApi.list(projectId),
                fileApi.list(projectId),
                taskApi.list(projectId),
                executionLogApi.list(projectId, 20),
                papersApi.list(projectId),
                artifactApi.list(projectId),
            ]);

        if (projRes.data) setProject(projRes.data);
        if (docsRes.data) setDocuments(docsRes.data);
        if (filesRes.data) setFiles(filesRes.data);
        if (tasksRes.data) setTasks(tasksRes.data);
        if (logsRes.data) setExecutionLogs(logsRes.data);
        if (papersRes.data) setPapers(papersRes.data);
        if (artifactsRes.data) setArtifacts(artifactsRes.data);
    }, [projectId]);

    const refreshTasks = useCallback(async () => {
        const [projRes, tasksRes, logsRes] = await Promise.all([
            projectApi.get(projectId),
            taskApi.list(projectId),
            executionLogApi.list(projectId, 20),
        ]);
        if (projRes.data) setProject(projRes.data);
        if (tasksRes.data) setTasks(tasksRes.data);
        if (logsRes.data) setExecutionLogs(logsRes.data);
    }, [projectId]);

    const refreshPapers = useCallback(async () => {
        const res = await papersApi.list(projectId);
        if (res.data) setPapers(res.data);
    }, [projectId]);

    const loadProvenance = useCallback(async () => {
        setProvenanceLoading(true);
        const res = await memoryApi.getProvenance(projectId, 80, 60);
        if (res.data) setProvenance(res.data);
        setProvenanceLoading(false);
    }, [projectId]);

    // Initial load
    useEffect(() => {
        setLoading(true);
        refreshAll().finally(() => setLoading(false));
    }, [refreshAll]);

    // ─── WebSocket ───────────────────────────────────────────────

    useEffect(() => {
        const cleanup = createProjectWebSocket(projectId, {
            onEvent: (event: WSEvent) => {
                switch (event.type) {
                    case 'connected':
                        setWsConnected(true);
                        break;
                    case 'task_started':
                    case 'task_completed':
                    case 'task_failed':
                        // Refresh tasks + project status on any task state change
                        void refreshTasks();
                        // If a literature search completed, also refresh papers
                        if (
                            event.type === 'task_completed' &&
                            event.data?.task_type === 'literature_search'
                        ) {
                            void refreshPapers();
                        }
                        break;
                    case 'execution_started':
                        void refreshTasks();
                        break;
                    case 'project_updated':
                        void refreshAll();
                        break;
                }
            },
            onOpen: () => setWsConnected(true),
            onClose: () => setWsConnected(false),
        });

        return cleanup;
    }, [projectId, refreshTasks, refreshPapers, refreshAll]);

    // ─── Actions ─────────────────────────────────────────────────

    const executeProject = useCallback(async (): Promise<boolean> => {
        const res = await projectApi.execute(projectId);
        if (res.data) {
            await refreshTasks();
            return true;
        }
        return false;
    }, [projectId, refreshTasks]);

    const deleteProject = useCallback(async (): Promise<boolean> => {
        const res = await projectApi.delete(projectId);
        if (!res.error) {
            router.push('/projects');
            return true;
        }
        return false;
    }, [projectId, router]);

    const createDocument = useCallback(async (): Promise<string | null> => {
        const res = await documentApi.create(projectId);
        if (res.data) {
            setDocuments((prev) => [...prev, {
                id: res.data!.id,
                project_id: res.data!.project_id,
                title: res.data!.title,
                citation_style: res.data!.citation_style,
                created_at: res.data!.created_at,
                updated_at: res.data!.updated_at,
            }]);
            return res.data.id;
        }
        return null;
    }, [projectId]);

    const uploadFile = useCallback(async (file: File): Promise<boolean> => {
        try {
            await fileApi.upload(file, projectId);
            const res = await fileApi.list(projectId);
            if (res.data) setFiles(res.data);
            return true;
        } catch {
            return false;
        }
    }, [projectId]);

    // ─── Inspector ───────────────────────────────────────────────

    const openInspector = useCallback(
        (type: InspectorContentType, id: string, data: Record<string, unknown>) => {
            setInspectorContent({ type, id, data });
        },
        []
    );

    const closeInspector = useCallback(() => {
        setInspectorContent(null);
    }, []);

    // ─── Derived values ──────────────────────────────────────────

    const isExecuting = project?.status === 'executing';
    const phases = useMemo(() => buildPhaseSummary(tasks), [tasks]);
    const completedTaskCount = tasks.filter((t) => t.state === 'completed').length;
    const failedTaskCount = tasks.filter((t) => t.state === 'failed').length;
    const totalTaskCount = tasks.length;

    // ─── Context value ───────────────────────────────────────────

    const value = useMemo<ProjectContextValue>(
        () => ({
            projectId,
            project,
            tasks,
            documents,
            files,
            executionLogs,
            artifacts,
            papers,
            provenance,
            isExecuting,
            phases,
            completedTaskCount,
            failedTaskCount,
            totalTaskCount,
            loading,
            provenanceLoading,
            wsConnected,
            refreshAll,
            refreshTasks,
            refreshPapers,
            loadProvenance,
            executeProject,
            deleteProject,
            createDocument,
            uploadFile,
            inspectorContent,
            openInspector,
            closeInspector,
        }),
        [
            projectId, project, tasks, documents, files, executionLogs,
            artifacts, papers, provenance, isExecuting, phases,
            completedTaskCount, failedTaskCount, totalTaskCount,
            loading, provenanceLoading, wsConnected,
            refreshAll, refreshTasks, refreshPapers, loadProvenance,
            executeProject, deleteProject, createDocument, uploadFile,
            inspectorContent, openInspector, closeInspector,
        ]
    );

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
}
