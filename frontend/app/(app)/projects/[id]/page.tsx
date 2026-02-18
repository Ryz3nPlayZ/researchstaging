'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { projectApi, documentApi, fileApi, taskApi, literatureApi, papersApi, analysisApi, artifactApi } from '@/lib/api';
import type { Project, DocumentListItem, FileItem, TaskResponse, Paper, ArtifactResponse } from '@/lib/types';
import { mapProjectStatus, relativeTime, truncate } from '@/lib/types';
import { Play, Trash2, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import { WorkspaceTabs, Tab } from './_components/workspace-tabs';
import { OverviewTab } from './_components/overview-tab';
import { DocumentsTab } from './_components/documents-tab';
import { FilesTab } from './_components/files-tab';
import { LiteratureTab } from './_components/literature-tab';
import { AnalysisTab } from './_components/analysis-tab';
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
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [loading, setLoading] = useState(true);
    const [creatingDoc, setCreatingDoc] = useState(false);

    // Execute / Delete state
    const [executing, setExecuting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Literature state
    const [litQuery, setLitQuery] = useState('');
    const [litSearching, setLitSearching] = useState(false);
    const [litResults, setLitResults] = useState<Paper[]>([]);
    const [projectPapers, setProjectPapers] = useState<Paper[]>([]);
    const [synthesisOpen, setSynthesisOpen] = useState(false);

    // Analysis state
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState<'python' | 'r'>('python');
    const [analysisRunning, setAnalysisRunning] = useState(false);
    const [analysisOutput, setAnalysisOutput] = useState<string | null>(null);
    const [analysisError, setAnalysisError] = useState<string | null>(null);
    const [artifacts, setArtifacts] = useState<ArtifactResponse[]>([]);

    const loadData = useCallback(async () => {
        setLoading(true);
        const [projRes, docsRes, filesRes, tasksRes] = await Promise.all([
            projectApi.get(projectId),
            documentApi.list(projectId),
            fileApi.list(projectId),
            taskApi.list(projectId),
        ]);
        if (projRes.data) setProject(projRes.data);
        if (docsRes.data) setDocuments(docsRes.data);
        if (filesRes.data) setFiles(filesRes.data);
        if (tasksRes.data) setTasks(tasksRes.data);
        setLoading(false);
    }, [projectId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Load literature/analysis data when tabs are activated
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
    }, [activeTab, projectId]);

    // Auto-refresh tasks while executing
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
        setCreatingDoc(true);
        const res = await documentApi.create(projectId);
        if (res.data) {
            setDocuments((prev) => [{ ...res.data!, content: undefined } as unknown as DocumentListItem, ...prev]);
        }
        setCreatingDoc(false);
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
            // Refresh project to see updated status
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
        const res = await literatureApi.search(litQuery);
        if (res.data) setLitResults(res.data);
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
        // Refresh artifacts
        const artRes = await artifactApi.list(projectId);
        if (artRes.data) setArtifacts(artRes.data);
    };

    if (loading) {
        return (
            <div className="max-w-[1200px] mx-auto">
                <div className="h-8 bg-gray-200 rounded w-64 mb-4 animate-pulse" />
                <div className="h-4 bg-gray-100 rounded w-96 mb-8 animate-pulse" />
                <div className="grid grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="glass rounded-2xl p-6 h-40 animate-pulse border border-white/20" />
                    ))}
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="max-w-[1200px] mx-auto text-center py-20">
                <p className="text-gray-500 font-medium">Project not found.</p>
                <Link href="/projects" className="text-[#1C7C54] text-sm mt-2 inline-block hover:underline">
                    ← Back to projects
                </Link>
            </div>
        );
    }

    const uiStatus = mapProjectStatus(project.status);
    const statusColors: Record<string, string> = {
        active: 'bg-[#1C7C54]',
        planning: 'bg-amber-400',
        archived: 'bg-gray-400',
    };

    return (
        <div className="max-w-[1200px] mx-auto">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium mb-4">
                <Link href="/projects" className="hover:text-gray-600 transition-colors">Projects</Link>
                <ChevronRight size={12} />
                <span className="text-gray-900">{truncate(project.research_goal, 50)}</span>
            </div>

            {/* Project Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${statusColors[uiStatus]} ${uiStatus === 'active' ? 'animate-pulse' : ''}`} />
                        <h1 className="text-2xl font-bold text-[#1B512D] tracking-tight font-ui">
                            {truncate(project.research_goal, 80)}
                        </h1>
                    </div>
                    <p className="text-sm text-gray-500 font-medium">
                        {project.output_type.replace(/_/g, ' ')}
                        {project.audience ? ` · ${project.audience}` : ''}
                        {' · '}
                        Updated {relativeTime(project.updated_at)}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    {(uiStatus === 'planning' || uiStatus === 'active') && (
                        <button
                            onClick={handleExecute}
                            disabled={executing || project.status === 'executing'}
                            className="inline-flex items-center gap-2 bg-[#1C7C54] hover:bg-[#1B512D] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
                        >
                            {executing ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Play size={16} />
                            )}
                            {project.status === 'executing' ? 'Running...' : 'Run Research'}
                        </button>
                    )}

                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-lg border border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                                <AlertCircle size={20} className="text-red-500" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Delete Project?</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                            This will permanently delete the project, all documents, files, tasks, and artifacts. This cannot be undone.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <WorkspaceTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                counts={{
                    documents: documents.length,
                    files: files.length,
                    literature: projectPapers.length
                }}
            />

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                    <OverviewTab
                        project={project}
                        tasks={tasks}
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

                {/* File Preview Modal */}
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
            </div>
        </div>
    );
}
