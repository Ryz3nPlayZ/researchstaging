'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { documentApi, chatApi, exportApi } from '@/lib/api';
import type { Document, TipTapContent } from '@/lib/types';
import { relativeTime, truncate } from '@/lib/types';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import { Bot, FileText, Download, MoreHorizontal, ArrowLeft, Save } from 'lucide-react';

interface ChatMsg {
    role: 'user' | 'assistant';
    content: string;
}

export default function DocumentEditorPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;
    const docId = params.docId as string;

    const [doc, setDoc] = useState<Document | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState<TipTapContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    // AI Chat
    const [chatOpen, setChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Save timer
    const saveTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        async function load() {
            setLoading(true);
            const res = await documentApi.get(docId);
            if (res.data) {
                setDoc(res.data);
                setTitle(res.data.title);
                // Use the JSON content directly, or default to empty doc if null
                setContent(res.data.content || { type: 'doc', content: [] });
            }
            setLoading(false);
        }
        load();
    }, [docId]);

    // Extract plaintext from TipTap JSON content for AI context
    function extractText(node: TipTapContent): string {
        if (!node) return '';
        if (node.text) return node.text;
        if (node.content) {
            return node.content.map(extractText).join(node.type === 'paragraph' ? '\n' : '');
        }
        return '';
    }

    const saveDocument = useCallback(async (newTitle?: string, newContent?: TipTapContent) => {
        setSaving(true);
        const updateData: Record<string, unknown> = {};
        if (newTitle !== undefined) updateData.title = newTitle;
        if (newContent !== undefined) updateData.content = newContent;

        const res = await documentApi.update(docId, updateData);
        if (res.data) {
            setLastSaved(new Date().toISOString());
        }
        setSaving(false);
    }, [docId]);

    const handleContentChange = (newContent: TipTapContent) => {
        setContent(newContent);
        // Debounced auto-save
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => saveDocument(undefined, newContent), 2000);
    };

    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle);
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => saveDocument(newTitle, undefined), 2000);
    };

    const handleChatSend = async () => {
        if (!chatInput.trim() || !content) return;
        const userMsg = chatInput.trim();
        setChatInput('');
        setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
        setChatLoading(true);

        try {
            // Ensure backend has latest content
            await saveDocument(undefined, content);

            const res = await chatApi.sendProject(projectId, userMsg, { document_id: docId });

            if (res.data) {
                setChatMessages((prev) => [...prev, {
                    role: 'assistant',
                    content: res.data!.ai_response.content
                }]);
            } else {
                setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I couldn\'t process that request.' }]);
            }
        } catch (err) {
            console.error('Chat failed:', err);
            setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Error connecting to AI service.' }]);
        } finally {
            setChatLoading(false);
        }
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleExportPdf = async () => {
        try {
            await exportApi.pdf(docId, projectId);
        } catch (e) {
            console.error('PDF export failed:', e);
            alert('PDF export failed. Make sure LaTeX is installed on the backend.');
        }
    };

    const handleExportDocx = async () => {
        try {
            await exportApi.docx(docId, projectId);
        } catch (e) {
            console.error('DOCX export failed:', e);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this document?')) return;
        await documentApi.delete(docId);
        router.push(`/projects/${projectId}`);
    };

    if (loading) {
        return (
            <div className="max-w-[1000px] mx-auto px-8 py-8">
                <div className="h-8 bg-gray-200 rounded-lg w-1/3 mb-8 animate-pulse" />
                <div className="space-y-4">
                    <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded w-5/6 animate-pulse" />
                    <div className="h-4 bg-gray-100 rounded w-4/6 animate-pulse" />
                </div>
            </div>
        );
    }

    if (!doc) {
        return (
            <div className="max-w-[1200px] mx-auto text-center py-20">
                <p className="text-gray-500 font-medium">Document not found.</p>
                <Link href={`/projects/${projectId}`} className="text-[#1C7C54] text-sm mt-2 inline-block hover:underline">
                    ← Back to project
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-[1200px] mx-auto flex gap-6 h-[calc(100vh-80px)]">
            {/* Main Editor */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ${chatOpen ? 'mr-[360px]' : ''}`}>
                {/* Header / Breadcrumb */}
                <div className="flex items-center gap-2 mb-6">
                    <Link
                        href={`/projects/${projectId}`}
                        className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
                    >
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>Projects</span>
                            <span>/</span>
                            <span>{truncate(projectId, 8)}</span>
                        </div>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            placeholder="Untitled Document"
                            className="text-xl font-bold text-gray-900 bg-transparent border-none outline-none placeholder:text-gray-300 font-ui p-0 focus:ring-0"
                        />
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-medium mr-2 flex items-center gap-1.5">
                            {saving ? <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> : <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                            {saving ? 'Saving...' : lastSaved ? 'Saved' : 'Ready'}
                        </span>

                        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-100">
                            <button
                                onClick={handleExportPdf}
                                title="Export PDF"
                                className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white rounded-md transition-all shadow-sm"
                            >
                                <Download size={16} />
                            </button>
                            <button
                                onClick={() => setChatOpen(!chatOpen)}
                                title="AI Assistant"
                                className={`p-1.5 transition-all rounded-md shadow-sm ${chatOpen
                                    ? 'bg-[#DEF4C6] text-[#1C7C54]'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-white'
                                    }`}
                            >
                                <Bot size={16} />
                            </button>
                            <button
                                onClick={handleDelete}
                                title="Delete Document"
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-white rounded-md transition-all shadow-sm"
                            >
                                <MoreHorizontal size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Editor Surface */}
                <div className="flex-1 bg-white rounded-2xl border border-black/[0.04] shadow-sm overflow-hidden flex flex-col">
                    <div className="flex-1 overflow-y-auto px-12 py-10">
                        {content && (
                            <RichTextEditor
                                content={content}
                                onChange={handleContentChange}
                                className="min-h-[600px]"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* AI Chat Sidebar */}
            {chatOpen && (
                <div className="fixed right-6 top-24 bottom-6 w-[360px] bg-white rounded-2xl border border-black/[0.06] shadow-xl flex flex-col z-40 overflow-hidden animate-in slide-in-from-right-10 duration-300">
                    {/* Chat Header */}
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <Bot size={18} className="text-[#1C7C54]" />
                            <h3 className="text-sm font-bold text-gray-800">Research Assistant</h3>
                        </div>
                        <button
                            onClick={() => setChatOpen(false)}
                            className="w-6 h-6 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 transition-colors"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30">
                        {chatMessages.length === 0 && (
                            <div className="text-center py-10">
                                <div className="w-12 h-12 rounded-2xl bg-[#DEF4C6] flex items-center justify-center mx-auto mb-3">
                                    <Bot size={24} className="text-[#1C7C54]" />
                                </div>
                                <p className="text-sm font-medium text-gray-800">How can I help?</p>
                                <p className="text-xs text-gray-500 mt-1 max-w-[200px] mx-auto">
                                    I can help you write, edit, summarize, or critique your document.
                                </p>
                            </div>
                        )}
                        {chatMessages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-[#1C7C54] text-white rounded-br-sm'
                                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex gap-2 items-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1C7C54] animate-bounce" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1C7C54] animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#1C7C54] animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 bg-white border-t border-gray-100">
                        <div className="relative">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                                placeholder="Ask about your document..."
                                className="w-full h-11 pl-4 pr-12 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#1C7C54] focus:ring-2 focus:ring-[#1C7C54]/10 transition-all"
                            />
                            <button
                                onClick={handleChatSend}
                                disabled={chatLoading || !chatInput.trim()}
                                className="absolute right-1 top-1 bottom-1 aspect-square rounded-lg bg-[#1C7C54] hover:bg-[#156343] text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ArrowLeft size={16} className="rotate-90" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
