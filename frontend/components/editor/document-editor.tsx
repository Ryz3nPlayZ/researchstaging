'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Save, Download, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DocumentEditor({
    initialContent = '',
    documentName = 'Untitled Document'
}: {
    initialContent?: string;
    documentName?: string;
}) {
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date>(new Date());

    // Fake save function
    const handleSave = async () => {
        setIsSaving(true);
        await new Promise(r => setTimeout(r, 600));
        setLastSaved(new Date());
        setIsSaving(false);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-180px)] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm font-ui">
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                        <FileText size={16} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-800">{documentName}</h3>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            {isSaving ? (
                                'Saving...'
                            ) : (
                                <>
                                    <CheckCircle2 size={10} className="text-emerald-500" />
                                    Saved at {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-medium"
                    >
                        <Download size={14} className="mr-1.5" />
                        Export PDF
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="h-8 text-xs font-medium bg-slate-900 hover:bg-slate-800"
                    >
                        <Save size={14} className="mr-1.5" />
                        {isSaving ? 'Saving' : 'Save'}
                    </Button>
                </div>
            </div>

            {/* Editor Workspace */}
            <div className="flex flex-1 overflow-hidden">
                {/* Markdown / LaTeX Input */}
                <div className="w-1/2 border-r border-slate-200 bg-slate-50">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Start writing... Use $$ for block math and $ for inline math."
                        className="w-full h-full p-6 bg-transparent outline-none resize-none font-mono text-[13px] leading-relaxed text-slate-700 custom-scrollbar"
                        spellCheck={false}
                    />
                </div>

                {/* Live Preview */}
                <div className="w-1/2 bg-white overflow-y-auto custom-scrollbar p-8">
                    <div className="prose prose-slate prose-sm max-w-none">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                        >
                            {content || '*Preview will appear here...*'}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        </div>
    );
}
