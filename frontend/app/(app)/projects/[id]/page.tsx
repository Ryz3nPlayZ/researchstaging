'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProject } from './_context/project-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OverviewTab } from './_components/overview-tab';
import { DocumentsTab } from './_components/documents-tab';
import { FilesTab } from './_components/files-tab';
import { LiteratureTab } from './_components/literature-tab';
import { AnalysisTab } from './_components/analysis-tab';
import { ProvenanceTab } from './_components/provenance-tab';
import { mapProjectStatus, relativeTime, truncate } from '@/lib/types';
import {
    Play, Trash2, AlertCircle, Loader2, ArrowLeft,
    BookOpen, FileText, FolderOpen, FlaskConical, Shield,
    LayoutDashboard,
} from 'lucide-react';

function WorkspaceContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tab = searchParams.get('tab') || 'overview';

    const {
        project, loading, projectId,
        documents, files, papers, provenance,
        executeProject, deleteProject, isExecuting,
    } = useProject();

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [executing, setExecuting] = useState(false);

    const setTab = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', value);
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    const handleExecute = async () => {
        setExecuting(true);
        await executeProject();
        setExecuting(false);
    };

    const handleDelete = async () => {
        setDeleting(true);
        await deleteProject();
    };

    if (loading) {
        return (
            <div className="p-6 space-y-4">
                <div className="h-7 bg-zinc-100 rounded w-72 animate-pulse" />
                <div className="h-4 bg-zinc-50 rounded w-96 animate-pulse" />
                <div className="h-10 bg-zinc-50 rounded w-full animate-pulse mt-6" />
                <div className="grid grid-cols-3 gap-4 mt-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-32 bg-zinc-50 rounded-lg animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <AlertCircle className="h-8 w-8 text-zinc-400 mb-3" />
                <p className="text-zinc-500 font-medium mb-2">Project not found</p>
                <Link href="/projects" className="text-sm text-zinc-600 hover:text-zinc-900 underline">
                    Back to projects
                </Link>
            </div>
        );
    }

    const uiStatus = mapProjectStatus(project.status);

    const TAB_META = [
        { value: 'overview', label: 'Overview', icon: LayoutDashboard },
        { value: 'documents', label: 'Documents', icon: FileText, count: documents.length },
        { value: 'literature', label: 'Literature', icon: BookOpen, count: papers.length },
        { value: 'files', label: 'Files', icon: FolderOpen, count: files.length },
        { value: 'analysis', label: 'Analysis', icon: FlaskConical },
        { value: 'provenance', label: 'Provenance', icon: Shield, count: provenance?.summary.total_claims ?? undefined },
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Compact header */}
            <div className="shrink-0 border-b border-zinc-200 bg-white px-5 py-3">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
                            <Link href="/projects" className="hover:text-zinc-900 transition-colors flex items-center gap-1">
                                <ArrowLeft size={12} /> Projects
                            </Link>
                            <span>/</span>
                            <span className="text-zinc-400 truncate max-w-[200px]">
                                {truncate(project.research_goal, 40)}
                            </span>
                        </div>
                        <h1 className="text-base font-semibold text-zinc-900 leading-tight truncate">
                            {project.research_goal}
                        </h1>
                        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                            <span className="flex items-center gap-1.5">
                                <span className={`h-1.5 w-1.5 rounded-full ${uiStatus === 'active' ? 'bg-zinc-900' :
                                        uiStatus === 'planning' ? 'bg-zinc-400' : 'bg-zinc-300'
                                    }`} />
                                {uiStatus}
                            </span>
                            <span>{project.output_type.replace(/_/g, ' ')}</span>
                            <span>{relativeTime(project.updated_at)}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {(uiStatus === 'planning' || uiStatus === 'active') && (
                            <button
                                onClick={handleExecute}
                                disabled={executing || isExecuting}
                                className="inline-flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all"
                            >
                                {executing || isExecuting ? (
                                    <Loader2 size={13} className="animate-spin" />
                                ) : (
                                    <Play size={13} />
                                )}
                                {isExecuting ? 'Running\u2026' : 'Run'}
                            </button>
                        )}
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete Project"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
                <TabsList variant="line" className="shrink-0 w-full justify-start border-b border-zinc-200 bg-white px-5 h-10">
                    {TAB_META.map((t) => (
                        <TabsTrigger key={t.value} value={t.value} className="text-xs gap-1.5">
                            <t.icon size={13} />
                            {t.label}
                            {t.count != null && t.count > 0 && (
                                <span className="ml-1 text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-full">
                                    {t.count}
                                </span>
                            )}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="flex-1 overflow-y-auto">
                    <TabsContent value="overview" className="mt-0 p-5"><OverviewTab /></TabsContent>
                    <TabsContent value="documents" className="mt-0 p-5"><DocumentsTab /></TabsContent>
                    <TabsContent value="literature" className="mt-0 p-5"><LiteratureTab /></TabsContent>
                    <TabsContent value="files" className="mt-0 p-5"><FilesTab /></TabsContent>
                    <TabsContent value="analysis" className="mt-0 p-5"><AnalysisTab /></TabsContent>
                    <TabsContent value="provenance" className="mt-0 p-5"><ProvenanceTab /></TabsContent>
                </div>
            </Tabs>

            {/* Delete confirmation dialog */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl border border-zinc-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                                <AlertCircle size={20} className="text-zinc-600" />
                            </div>
                            <h3 className="text-base font-semibold text-zinc-900">Delete Project?</h3>
                        </div>
                        <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
                            This will permanently delete the project and all associated data. This cannot be undone.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                                {deleting ? 'Deleting\u2026' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ProjectWorkspacePage() {
    return (
        <Suspense fallback={
            <div className="p-6 space-y-4">
                <div className="h-7 bg-zinc-100 rounded w-72 animate-pulse" />
                <div className="h-4 bg-zinc-50 rounded w-96 animate-pulse" />
            </div>
        }>
            <WorkspaceContent />
        </Suspense>
    );
}
