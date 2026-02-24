'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { projectApi, documentApi, fileApi, taskApi, literatureApi, papersApi, analysisApi, artifactApi, executionLogApi, memoryApi } from '@/lib/api';
import type { LiteratureV2Response } from '@/lib/api';
import type { Project, DocumentListItem, FileItem, TaskResponse, Paper, ArtifactResponse, ExecutionLogEntry, ProjectProvenance } from '@/lib/types';
import { mapProjectStatus, relativeTime, truncate } from '@/lib/types';
import { Play, Trash2, AlertCircle, Loader2, ArrowLeft, Plus, Upload, FileText, BarChart3, Settings, ChevronDown, GripVertical } from 'lucide-react';
import { OverviewTab } from './_components/overview-tab';
import { DocumentsTab } from './_components/documents-tab';
import { FilesTab } from './_components/files-tab';
import { LiteratureTab } from './_components/literature-tab';
import { AnalysisTab } from './_components/analysis-tab';
import { ProvenanceTab } from './_components/provenance-tab';
import { FilePreviewModal } from '@/components/file-preview-modal';

export default function ProjectWorkspacePage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [documents, setDocuments] = useState<DocumentListItem[]>([]);
    const [files, setFiles] = useState<FileItem[]>([]);
    const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
    const [tasks, setTasks] = useState<TaskResponse[]>([]);
    const [executionLogs, setExecutionLogs] = useState<ExecutionLogEntry[]>([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [creatingDoc, setCreatingDoc] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [litQuery, setLitQuery] = useState('');
    const [litSearching, setLitSearching] = useState(false);
    const [litResults, setLitResults] = useState<Paper[]>([]);
    const [litV2Response, setLitV2Response] = useState<LiteratureV2Response | null>(null);
    const [projectPapers, setProjectPapers] = useState<Paper[]>([]);
    const [synthesisOpen, setSynthesisOpen] = useState(false);
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState<'python' | 'r'>('python');
    const [analysisRunning, setAnalysisRunning] = useState(false);
    const [analysisOutput, setAnalysisOutput] = useState<string | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [artifacts, setArtifacts] = useState<ArtifactResponse[]>([]);
    const [provenance, setProvenance] = useState<ProjectProvenance | null>(null);
    const [provenanceLoading, setProvenanceLoading] = useState(false);

    const tabs = [
        { id: 'overview', label: 'Overview', count: null },
        { id: 'documents', label: 'Documents', count: documents.length },
        { id: 'literature', label: 'Literature', count: projectPapers.length },
        { id: 'files', label: 'Files', count: files.length },
        { id: 'analysis', label: 'Analysis', count: null },
        { id: 'provenance', label: 'Provenance', count: provenance?.summary.total_claims ?? null },
    ];

    const loadProvenance = useCallback(async () => {
        setProvenanceLoading(true);
        const res = await memoryApi.getProvenance(projectId, 80, 60);
        if (res.data) setProvenance(res.data);
        setProvenanceLoading(false);
    }, [projectId]);

    const loadData = useCallback(async () => {
        setLoading(true);
        const [projRes, docsRes, filesRes, tasksRes, logsRes] = await Promise.all([
            projectApi.get(projectId),
            documentApi.list(projectId),
            fileApi.list(projectId),
            taskApi.list(projectId),
            executionLogApi.list(projectId, 20),
        ]);
        if (projRes.data) setProject(projRes.data);
        if (docsRes.data) setDocuments(docsRes.data);
        if (filesRes.data) setFiles(filesRes.data);
        if (tasksRes.data) setTasks(tasksRes.data);
        if (logsRes.data) setExecutionLogs(logsRes.data);
        setLoading(false);
    }, [projectId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (activeTab === 'literature') {
            papersApi.list(projectId).then((res) => {
                if (res.data) setProjectPapers(res.data);
            });
        }
        if (activeTab === 'analysis') {
            artifactApi.list(projectId).then((res) => {
                if (res.data) setArtifacts(res.data);
            });
        }
        if (activeTab === 'provenance' && !provenance) {
            void loadProvenance();
        }
    }, [activeTab, projectId, provenance, loadProvenance]);

    useEffect(() => {
        if (project?.status !== 'executing') return;
        const id = setInterval(async () => {
            const [projRes, tasksRes] = await Promise.all([
                projectApi.get(projectId),
                taskApi.list(projectId),
            ]);
            if (projRes.data) setProject(projRes.data);
            if (tasksRes.data) setTasks(tasksRes.data);
        }, 5000);
        return () => clearInterval(id);
    }, [project?.status, projectId]);

    const handleCreateDocument = async () => {
        try {
            setCreatingDoc(true);
            const res = await documentApi.create(projectId);
            if (res.data) {
                setDocuments((prev) => [{ ...res.data!, content: undefined } as unknown as DocumentListItem, ...prev]);
                router.push(`/projects/${projectId}/doc/${res.data.id}`);
            }
        } finally {
            setCreatingDoc(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            await fileApi.upload(file, projectId);
            const res = await fileApi.list(projectId);
            if (res.data) setFiles(res.data);
        } catch (err) {
            console.error('Upload failed:', err);
        }
    };

    const handleExecute = async () => {
        setExecuting(true);
        const res = await projectApi.execute(projectId);
        if (res.data) {
            const projRes = await projectApi.get(projectId);
            if (projRes.data) setProject(projRes.data);
            const tasksRes = await taskApi.list(projectId);
            if (tasksRes.data) setTasks(tasksRes.data);
        }
        setExecuting(false);
    };

    const handleDelete = async () => {
        setDeleting(true);
        await projectApi.delete(projectId);
        router.push('/projects');
    };

    const handleLitSearch = async () => {
        if (!litQuery.trim()) return;
        setLitSearching(true);
        setLitResults([]);
        setLitV2Response(null);
        const res = await literatureApi.searchV2(litQuery);
        if (res.data) {
            setLitV2Response(res.data);
            setLitResults(res.data.papers);
        }
        setLitSearching(false);
    };

    const handleAddPaper = async (paper: Paper) => {
        try {
            const res = await papersApi.add(projectId, paper);
            if (res.data) {
                setProjectPapers((prev) => [res.data!, ...prev]);
            }
        } catch (err) {
            console.error('Failed to add paper:', err);
        }
    };

    const handleRunAnalysis = async () => {
        if (!code.trim()) return;
        setAnalysisRunning(true);
        setAnalysisOutput(null);
        setAnalysisError(null);
        const res = await analysisApi.execute(code, language, projectId);
        if (res.data) {
            setAnalysisOutput(res.data.output || '(no output)');
            if (res.data.error) setAnalysisError(res.data.error);
        } else if (res.error) {
            setAnalysisError(res.error);
        }
        setAnalysisRunning(false);
        const artRes = await artifactApi.list(projectId);
        if (artRes.data) setArtifacts(artRes.data);
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="h-8 bg-gray-200 rounded w-64 mb-6 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-96 mb-10 animate-pulse" />
                <div className="grid grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-xl p-6 h-40 animate-pulse border border-gray-200" />
                    ))}
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="max-w-6xl mx-auto text-center py-20">
                <p className="text-gray-500 font-medium">Project not found.</p>
                <Link href="/projects" className="text-gray-700 text-sm mt-2 inline-block hover:underline">
                    ← Back to projects
                </Link>
            </div>
        );
    }

    const uiStatus = mapProjectStatus(project.status);

    return (
        <div className="max-w-6xl mx-auto px-6 py-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Link href="/projects" className="hover:text-gray-900 transition-colors flex items-center gap-1">
                        <ArrowLeft size={14} /> Projects
                    </Link>
                    <span>/</span>
                    <span className="text-gray-400 truncate max-w-[300px]">{truncate(project.research_goal, 60)}</span>
                </div>

                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-xl font-semibold text-gray-900 leading-tight mb-2">
                            {project.research_goal}
                        </h1>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${uiStatus === 'active' ? 'bg-gray-900' : uiStatus === 'planning' ? 'bg-gray-400' : 'bg-gray-300'}`} />
                                {uiStatus}
                            </span>
                            <span>{project.output_type.replace(/_/g, ' ')}</span>
                            <span>Updated {relativeTime(project.updated_at)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {(uiStatus === 'planning' || uiStatus === 'active') && (
                            <button
                                onClick={handleExecute}
                                disabled={executing || project.status === 'executing'}
                                className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                            >
                                {executing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                                {project.status === 'executing' ? 'Running...' : 'Run'}
                            </button>
                        )}
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete Project"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Horizontal Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <div className="flex items-center gap-1">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${activeTab === tab.id
                                    ? 'text-gray-900'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                            {tab.count !== null && tab.count > 0 && (
                                <span className={`ml-1.5 text-xs py-0.5 px-1.5 rounded-full ${activeTab === tab.id ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                            {activeTab === tab.id && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                    <OverviewTab
                        project={project}
                        tasks={tasks}
                        executionLogs={executionLogs}
                        onCreateDocument={handleCreateDocument}
                        onUploadFile={handleFileUpload}
                        creatingDoc={creatingDoc}
                    />
                )}
                {activeTab === 'documents' && (
                    <DocumentsTab
                        documents={documents}
                        projectId={projectId}
                        creatingDoc={creatingDoc}
                        onCreateDocument={handleCreateDocument}
                    />
                )}
                {activeTab === 'files' && (
                    <FilesTab
                        files={files}
                        onUploadFile={handleFileUpload}
                        onPreviewFile={setPreviewFile}
                    />
                )}
                {activeTab === 'literature' && (
                    <LiteratureTab
                        litQuery={litQuery}
                        setLitQuery={setLitQuery}
                        litSearching={litSearching}
                        handleLitSearch={handleLitSearch}
                        litResults={litResults}
                        litV2Response={litV2Response}
                        projectPapers={projectPapers}
                        onAddPaper={handleAddPaper}
                        synthesisOpen={synthesisOpen}
                        setSynthesisOpen={setSynthesisOpen}
                        projectId={projectId}
                    />
                )}
                {activeTab === 'analysis' && (
                    <AnalysisTab
                        language={language}
                        setLanguage={setLanguage}
                        code={code}
                        setCode={setCode}
                        analysisRunning={analysisRunning}
                        handleRunAnalysis={handleRunAnalysis}
                        analysisOutput={analysisOutput}
                        analysisError={analysisError}
                        artifacts={artifacts}
                    />
                )}
                {activeTab === 'provenance' && (
                    <ProvenanceTab
                        projectId={projectId}
                        provenance={provenance}
                        loading={provenanceLoading}
                        onRefresh={loadProvenance}
                    />
                )}
            </div>

            {/* Modals */}
            {previewFile && (
                <FilePreviewModal
                    isOpen={!!previewFile}
                    onClose={() => setPreviewFile(null)}
                    fileId={previewFile.id}
                    projectId={projectId}
                    fileName={previewFile.name}
                    fileType={previewFile.mime_type || previewFile.file_type}
                />
            )}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl border border-gray-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                                <AlertCircle size={20} className="text-gray-600" />
                            </div>
                            <h3 className="text-base font-semibold text-gray-900">Delete Project?</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            This will permanently delete the project and all associated data. This cannot be undone.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gray-900 hover:bg-gray-800 disabled:opacity-50 transition-colors"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
