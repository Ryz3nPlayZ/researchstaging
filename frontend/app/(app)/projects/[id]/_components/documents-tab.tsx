'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProject } from '../_context/project-context';
import { relativeTime } from '@/lib/types';
import { Plus, FileText, ChevronRight } from 'lucide-react';

export function DocumentsTab() {
    const router = useRouter();
    const { documents, projectId, createDocument } = useProject();
    const [creatingDoc, setCreatingDoc] = useState(false);

    const handleCreateDocument = async () => {
        setCreatingDoc(true);
        const docId = await createDocument();
        if (docId) router.push(`/projects/${projectId}/doc/${docId}`);
        setCreatingDoc(false);
    };
    return (
        <div className="flex flex-col h-full bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <h3 className="text-[12px] font-semibold text-gray-700">Documents</h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-600">
                        {documents.length}
                    </span>
                </div>
                <button
                    onClick={handleCreateDocument}
                    disabled={creatingDoc}
                    className="inline-flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors shadow-sm"
                >
                    <Plus size={12} />
                    {creatingDoc ? 'Creating...' : 'New Document'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {documents.length > 0 ? (
                    <div className="space-y-1">
                        {documents.map((doc) => (
                            <Link key={doc.id} href={`/projects/${projectId}/doc/${doc.id}`} className="block group">
                                <div className="p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-black/5 transition-colors flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors shrink-0">
                                            <FileText size={14} className="text-gray-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-[13px] font-medium text-gray-900 group-hover:text-gray-700 transition-colors truncate mb-0.5">{doc.title}</h4>
                                            <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                                <span className="uppercase tracking-wide">{doc.citation_style || 'N/A'}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                                <span>Updated {relativeTime(doc.updated_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-1 rounded text-gray-300 opacity-0 group-hover:opacity-100 group-hover:text-gray-900 group-hover:bg-gray-200 transition-all shrink-0">
                                        <ChevronRight size={14} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                        <FileText size={24} className="text-gray-300 mb-3" />
                        <h3 className="text-[13px] font-medium text-gray-900 mb-1">No documents yet</h3>
                        <p className="text-[12px] text-gray-500 max-w-sm mb-4">Create your first document to start drafting your research paper or literature review.</p>
                        <button
                            onClick={handleCreateDocument}
                            disabled={creatingDoc}
                            className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors shadow-sm"
                        >
                            <Plus size={12} />
                            Create Document
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
