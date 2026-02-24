'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { ArrowUp, Loader2, MessageSquare, Minus, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

import { chatApi, documentApi } from '@/lib/api';

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

const STORAGE_PREFIX = 'ai-chatbar-history';

function extractTextFromTipTap(node: unknown): string {
    if (!node || typeof node !== 'object') return '';
    const dict = node as { text?: string; content?: unknown[]; type?: string };
    if (dict.text) return dict.text;
    if (!dict.content || !Array.isArray(dict.content)) return '';
    return dict.content
        .map((child) => extractTextFromTipTap(child))
        .join(dict.type === 'paragraph' ? '\n' : '');
}

export function AIChatbar() {
    const params = useParams();
    const pathname = usePathname();

    const projectId = useMemo(() => (params?.id as string) || '', [params]);
    const docIdFromParams = useMemo(() => (params?.docId as string) || '', [params]);
    const hideForOnboarding = pathname === '/new' || pathname?.startsWith('/new?') || false;

    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const endRef = useRef<HTMLDivElement>(null);

    const currentDocumentId = useMemo(() => {
        if (docIdFromParams) return docIdFromParams;
        if (!pathname) return '';
        const parts = pathname.split('/');
        const idx = parts.indexOf('doc');
        if (idx !== -1 && idx + 1 < parts.length) return parts[idx + 1];
        return '';
    }, [docIdFromParams, pathname]);

    const storageKey = useMemo(() => `${STORAGE_PREFIX}:${projectId || 'global'}`, [projectId]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (!raw) {
                setMessages([]);
                return;
            }
            const parsed = JSON.parse(raw) as ChatMessage[];
            setMessages(Array.isArray(parsed) ? parsed : []);
        } catch {
            setMessages([]);
        }
    }, [storageKey]);

    useEffect(() => {
        try {
            localStorage.setItem(storageKey, JSON.stringify(messages.slice(-100)));
        } catch {
            // ignore storage errors
        }
    }, [messages, storageKey]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const genId = useCallback(
        () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        []
    );

    const buildContext = useCallback(async () => {
        const context: Record<string, unknown> = {};
        if (currentDocumentId) {
            context.document_id = currentDocumentId;
            try {
                const doc = await documentApi.get(currentDocumentId);
                if (doc.data) {
                    const source = (doc.data.content_latex && doc.data.content_latex.trim().length > 0)
                        ? doc.data.content_latex
                        : extractTextFromTipTap(doc.data.content);
                    if (source) {
                        context.document_source = source.slice(0, 8000);
                    }
                }
            } catch {
                // ignore doc context errors
            }
        }
        return context;
    }, [currentDocumentId]);

    const send = useCallback(async () => {
        const text = input.trim();
        if (!text || loading) return;

        const userMessage: ChatMessage = { id: genId(), role: 'user', content: text };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            if (projectId) {
                const context = await buildContext();
                const res = await chatApi.sendProject(projectId, text, context);
                const reply = res.data?.ai_response?.content || 'I could not generate a response.';
                setMessages((prev) => [...prev, { id: genId(), role: 'assistant', content: reply }]);
            } else {
                const res = await chatApi.send(text, 'general');
                const reply = res.data?.response || 'I could not generate a response.';
                setMessages((prev) => [...prev, { id: genId(), role: 'assistant', content: reply }]);
            }
        } catch {
            setMessages((prev) => [...prev, { id: genId(), role: 'assistant', content: 'Connection error while contacting AI.' }]);
        } finally {
            setLoading(false);
        }
    }, [buildContext, genId, input, loading, projectId]);

    if (hideForOnboarding) {
        return null;
    }

    return (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[min(760px,92vw)]">
            <div className="bg-white border border-black/10 shadow-lg rounded-2xl overflow-hidden">
                {isOpen && (
                    <div className="h-[360px] flex flex-col border-b border-gray-100">
                        <div className="h-10 px-3 flex items-center justify-between bg-gray-50/80 border-b border-gray-100">
                            <div className="flex items-center gap-2 text-sm text-gray-700 font-medium">
                                <Sparkles size={14} className="text-gray-500" />
                                Research Assistant
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-7 h-7 rounded-md hover:bg-gray-100 text-gray-500 flex items-center justify-center"
                                aria-label="Collapse chat"
                            >
                                <Minus size={14} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {messages.length === 0 && (
                                <div className="h-full flex items-center justify-center text-xs text-gray-400 text-center px-8">
                                    Ask for writing help, literature guidance, or project actions.
                                </div>
                            )}
                            {messages.map((m) => (
                                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[88%] px-3 py-2 rounded-xl text-sm ${m.role === 'user'
                                                ? 'bg-gray-900 text-white rounded-br-sm'
                                                : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                                            }`}
                                    >
                                        {m.role === 'assistant' ? (
                                            <div className="prose prose-sm max-w-none prose-p:my-1">
                                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                    {m.content}
                                                </ReactMarkdown>
                                            </div>
                                        ) : (
                                            m.content
                                        )}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="px-3 py-2 rounded-xl bg-gray-100 text-gray-500 text-xs flex items-center gap-2">
                                        <Loader2 size={12} className="animate-spin" />
                                        Thinking...
                                    </div>
                                </div>
                            )}
                            <div ref={endRef} />
                        </div>
                    </div>
                )}

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        void send();
                    }}
                    className="p-2"
                >
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isOpen ? 'bg-gray-50 border border-gray-200' : 'bg-white'}`}>
                        {!isOpen && <MessageSquare size={15} className="text-gray-500" />}
                        <input
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onFocus={() => setIsOpen(true)}
                            placeholder="Ask AI..."
                            className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="w-8 h-8 rounded-full bg-gray-900 text-white disabled:opacity-40 flex items-center justify-center"
                            aria-label="Send"
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={14} />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
