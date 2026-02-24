'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import { chatApi, documentApi, exportApi } from '@/lib/api';
import type { Document, TipTapContent } from '@/lib/types';

function extractTextFromTipTap(node: TipTapContent | null | undefined): string {
    if (!node) return '';
    if (node.text) return node.text;
    if (!node.content || !Array.isArray(node.content)) return '';
    return node.content.map((child) => extractTextFromTipTap(child)).join(node.type === 'paragraph' ? '\n' : '');
}

function sourceToTipTap(source: string): TipTapContent {
    return {
        type: 'doc',
        content: [
            {
                type: 'paragraph',
                content: source ? [{ type: 'text', text: source }] : [],
            },
        ],
    };
}

export default function DocumentEditorPage() {
    const params = useParams();
    const router = useRouter();

    const projectId = params.id as string;
    const docId = params.docId as string;

    const [doc, setDoc] = useState<Document | null>(null);
    const [title, setTitle] = useState('');
    const [source, setSource] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState<string>('');
    const [aiBusy, setAiBusy] = useState(false);

    const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const saveLabel = useMemo(() => {
        if (saving) return 'Saving...';
        if (!lastSavedAt) return 'Ready';
        return 'Saved';
    }, [saving, lastSavedAt]);

    const loadDocument = useCallback(async () => {
        setLoading(true);
        const res = await documentApi.get(docId);
        if (!res.data) {
            setDoc(null);
            setLoading(false);
            return;
        }

        const loaded = res.data;
        const loadedSource = loaded.content_latex && loaded.content_latex.trim().length > 0
            ? loaded.content_latex
            : extractTextFromTipTap(loaded.content);

        setDoc(loaded);
        setTitle(loaded.title || 'Untitled Document');
        setSource(loadedSource);
        setLoading(false);
    }, [docId]);

    useEffect(() => {
        void loadDocument();

        const onReload = () => {
            void loadDocument();
        };
        window.addEventListener('reloadDocument', onReload);

        return () => {
            window.removeEventListener('reloadDocument', onReload);
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [loadDocument]);

    const persist = useCallback(
        async (next: { title?: string; source?: string }) => {
            const update: Record<string, unknown> = {};

            if (next.title !== undefined) update.title = next.title;
            if (next.source !== undefined) {
                update.content_latex = next.source;
                update.content = sourceToTipTap(next.source);
            }

            if (Object.keys(update).length === 0) return;

            setSaving(true);
            const res = await documentApi.update(docId, update);
            if (res.data) {
                setDoc(res.data);
                if (res.data.title !== undefined) setTitle(res.data.title);
                if (res.data.content_latex != null) setSource(res.data.content_latex);
                setLastSavedAt(new Date().toISOString());
            }
            setSaving(false);
        },
        [docId]
    );

    const schedulePersist = useCallback(
        (next: { title?: string; source?: string }) => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(() => {
                void persist(next);
            }, 1200);
        },
        [persist]
    );

    const onTitleChange = (value: string) => {
        setTitle(value);
        schedulePersist({ title: value });
    };

    const onSourceChange = (value: string) => {
        setSource(value);
        schedulePersist({ source: value });
    };

    const runAiAction = async (kind: 'continue' | 'improve' | 'cite') => {
        if (!source.trim()) return;
        setAiBusy(true);
        await persist({ source, title });

        const promptByKind: Record<typeof kind, string> = {
            continue: `Continue this academic Markdown/LaTeX draft. Return ONLY the continuation text.\n\n${source}`,
            improve: `Improve clarity, flow, and academic tone of this draft. Return the FULL revised text only.\n\n${source}`,
            cite: `Add citation placeholders in LaTeX style (e.g., \\cite{key}) where needed. Return the FULL updated text only.\n\n${source}`,
        };

        try {
            const res = await chatApi.sendProject(projectId, promptByKind[kind], { document_id: docId });
            const aiText = (res.data?.ai_response?.content || '').trim();
            if (!aiText) return;

            if (kind === 'continue') {
                const insertion = `\n\n${aiText}`;
                const textarea = textareaRef.current;
                if (!textarea) {
                    onSourceChange(source + insertion);
                } else {
                    const pos = textarea.selectionStart ?? source.length;
                    const next = source.slice(0, pos) + insertion + source.slice(pos);
                    onSourceChange(next);
                }
            } else {
                onSourceChange(aiText);
            }
        } finally {
            setAiBusy(false);
        }
    };

    const handleExportPdf = async () => {
        try {
            await persist({ source, title });
            await exportApi.pdf(docId, projectId);
        } catch {
            alert('PDF export failed. Verify backend export dependencies.');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this document?')) return;
        await documentApi.delete(docId);
        router.push(`/projects/${projectId}`);
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="h-7 w-52 bg-gray-200 rounded animate-pulse mb-4" />
                <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />
            </div>
        );
    }

    if (!doc) {
        return (
            <div className="max-w-6xl mx-auto px-6 py-12 text-center">
                <p className="text-gray-500">Document not found.</p>
                <Link href={`/projects/${projectId}`} className="text-sm text-gray-700 hover:underline mt-2 inline-block">
                    ← Back to project
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3 min-w-0">
                    <Link
                        href={`/projects/${projectId}`}
                        className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"
                    >
                        <ArrowLeft size={16} />
                    </Link>
                    <div className="min-w-0">
                        <input
                            value={title}
                            onChange={(e) => onTitleChange(e.target.value)}
                            placeholder="Untitled Document"
                            className="w-full text-lg font-semibold bg-transparent outline-none text-gray-900"
                        />
                        <p className="text-xs text-gray-400">{saveLabel}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => void runAiAction('continue')}
                        disabled={aiBusy}
                        className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Continue
                    </button>
                    <button
                        onClick={() => void runAiAction('improve')}
                        disabled={aiBusy}
                        className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Improve
                    </button>
                    <button
                        onClick={() => void runAiAction('cite')}
                        disabled={aiBusy}
                        className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                        Add Citations
                    </button>
                    <button
                        onClick={handleExportPdf}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
                    >
                        <Download size={14} />
                        Export PDF
                    </button>
                    <button
                        onClick={handleDelete}
                        className="px-3 py-1.5 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    >
                        Delete
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <Sparkles size={12} />
                Markdown + LaTeX math editor ($...$ and $$...$$)
                {aiBusy && (
                    <span className="inline-flex items-center gap-1 ml-2">
                        <Loader2 size={11} className="animate-spin" />
                        AI writing...
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-220px)] min-h-[520px]">
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-slate-50/60 flex flex-col min-h-0">
                    <div className="px-3 py-2 border-b border-gray-100 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                        Source
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={source}
                        onChange={(e) => onSourceChange(e.target.value)}
                        className="flex-1 p-4 resize-none bg-transparent outline-none font-mono text-sm leading-relaxed text-gray-800"
                        spellCheck={false}
                        placeholder="Write your draft in Markdown + LaTeX math..."
                    />
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white flex flex-col min-h-0">
                    <div className="px-3 py-2 border-b border-gray-100 text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                        Preview
                    </div>
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="prose prose-sm prose-slate max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {source || '*Preview will appear here...*'}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
