import Link from 'next/link';
import { DocumentListItem, relativeTime } from '@/lib/types';
import { Plus, FileText, ChevronRight } from 'lucide-react';

interface DocumentsTabProps {
    documents: DocumentListItem[];
    projectId: string;
    creatingDoc: boolean;
    onCreateDocument: () => void;
}

export function DocumentsTab({ documents, projectId, creatingDoc, onCreateDocument }: DocumentsTabProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-500 font-medium">{documents.length} document{documents.length !== 1 ? 's' : ''}</p>
                <button
                    onClick={onCreateDocument}
                    disabled={creatingDoc}
                    className="inline-flex items-center gap-2 bg-[#1C7C54] hover:bg-[#1B512D] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                    <Plus size={16} />
                    {creatingDoc ? 'Creating...' : 'New Document'}
                </button>
            </div>

            {documents.length > 0 ? (
                <div className="space-y-3">
                    {documents.map((doc) => (
                        <Link key={doc.id} href={`/projects/${projectId}/doc/${doc.id}`} className="block group">
                            <div className="glass rounded-xl px-6 py-4 border border-white/20 flex items-center justify-between hover:shadow-md transition-all hover:bg-white/80">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-[#DEF4C6] transition-colors">
                                        <FileText size={20} className="text-gray-400 group-hover:text-[#1C7C54]" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-900 group-hover:text-[#1C7C54] transition-colors">{doc.title}</h4>
                                        <p className="text-xs text-gray-500 mt-1 font-medium">
                                            {doc.citation_style?.toUpperCase()} · Updated {relativeTime(doc.updated_at)}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-1 rounded-full text-gray-300 group-hover:text-[#1C7C54] group-hover:bg-[#DEF4C6] transition-all">
                                    <ChevronRight size={18} />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="glass rounded-2xl p-12 text-center border border-white/20">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText size={32} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h3>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">Create your first document to start drafting your research paper or literature review.</p>
                    <button
                        onClick={onCreateDocument}
                        disabled={creatingDoc}
                        className="inline-flex items-center gap-2 bg-[#1C7C54] hover:bg-[#1B512D] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                    >
                        <Plus size={16} />
                        Create Document
                    </button>
                </div>
            )}
        </div>
    );
}
