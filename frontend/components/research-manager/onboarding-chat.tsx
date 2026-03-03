'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { chatApi, projectApi } from '@/lib/api';
import type { OnboardingAction } from '@/lib/types';
import {
    ArrowUp,
    BookOpen,
    FileText,
    Loader2,
    Paperclip,
    RotateCcw,
    SearchIcon,
    Upload,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// ============== Types ==============

interface ChatMsg {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

// ============== Suggestions ==============

const SUGGESTIONS = [
    {
        label: 'Literature Review',
        description: 'Survey a topic across academic databases',
        icon: BookOpen,
        prompt: 'I want to write a literature review on ',
    },
    {
        label: 'Research Paper',
        description: 'Original research with data and analysis',
        icon: FileText,
        prompt: 'I want to write a research paper about ',
    },
    {
        label: 'Systematic Review',
        description: 'Rigorous evidence synthesis with PRISMA',
        icon: SearchIcon,
        prompt: 'I need a systematic review of ',
    },
    {
        label: 'Import & Continue',
        description: 'Upload existing papers, notes, or drafts',
        icon: Upload,
        prompt: 'I have existing research materials I want to build on. The topic is ',
    },
];

const QUICK_TOPICS = [
    'Effect of AI on student learning outcomes',
    'Climate change impact on global crop yields',
    'Remote work and employee productivity',
    'Social media effects on adolescent mental health',
];

// ============== Component ==============

export function OnboardingChat({ fullPage = false }: { fullPage?: boolean }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    // Core state
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [lastFailedInput, setLastFailedInput] = useState<string | null>(null);
    const [sessionId] = useState(() => crypto.randomUUID());
    const [historyLoaded, setHistoryLoaded] = useState(false);

    const inputRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const sentInitial = useRef(false);
    const handleSendRef = useRef<((overrideText?: string) => Promise<void> | void) | null>(null);

    const genId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const hasMessages = messages.length > 0;

    // --------------- Scroll and load ---------------

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        setHistoryLoaded(true);
    }, []);

    useEffect(() => {
        if (initialQuery && historyLoaded && messages.length === 0 && !sentInitial.current) {
            sentInitial.current = true;
            void handleSendRef.current?.(initialQuery);
        }
    }, [initialQuery, historyLoaded, messages.length]);

    // Auto-resize textarea
    useEffect(() => {
        const textarea = inputRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
        }
    }, [input]);

    // --------------- Messaging ---------------

    const addAssistantMessage = (content: string) => {
        setMessages(prev => [...prev, { id: genId(), role: 'assistant' as const, content }]);
    };

    const sendWithRetry = async (session: string, message: string) => {
        return chatApi.onboarding(session, message, { timeoutMs: 45000, retries: 1 });
    };

    const handleSend = async (overrideText?: string) => {
        const text = (overrideText || input).trim();
        if (!text || loading || creating) return;

        const userMsg: ChatMsg = { id: genId(), role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        if (!overrideText) setInput('');
        setLastFailedInput(null);
        setLoading(true);

        try {
            const res = await sendWithRetry(sessionId, text);

            if (!res.data) {
                addAssistantMessage('Something went wrong \u2014 try sending that again.');
                setLastFailedInput(text);
                return;
            }

            const { response, action } = res.data;
            addAssistantMessage(response);

            if (action?.type === 'create_project') {
                await createProject(action);
            }
        } catch (err) {
            console.error('Onboarding chat error:', err);
            addAssistantMessage('Something went wrong \u2014 try sending that again.');
            setLastFailedInput(text);
        } finally {
            setLoading(false);
        }
    };

    const createProject = async (action: OnboardingAction) => {
        setCreating(true);
        try {
            const createRes = await projectApi.create({
                research_goal: action.research_goal,
                output_type: action.output_type,
                audience: action.audience,
                additional_context: action.additional_context || undefined,
            });
            if (createRes.data?.id) {
                addAssistantMessage('Project created. Redirecting you to the workspace\u2026');
                setTimeout(() => router.push(`/projects/${createRes.data!.id}`), 900);
            } else {
                addAssistantMessage('Something went wrong creating the project. Please try again.');
            }
        } catch (err) {
            console.error('Failed to create project:', err);
            addAssistantMessage('Failed to create project. Please try once more.');
        } finally {
            setCreating(false);
        }
    };

    handleSendRef.current = handleSend;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSuggestionClick = (prompt: string) => {
        setInput(prompt);
        setTimeout(() => {
            const textarea = inputRef.current;
            if (textarea) {
                textarea.focus();
                textarea.selectionStart = textarea.selectionEnd = prompt.length;
            }
        }, 0);
    };

    // --------------- Render ---------------

    return (
        <div className={`flex flex-col bg-background min-h-0 ${fullPage
            ? 'w-full h-full overflow-hidden'
            : 'h-[600px] w-full max-w-2xl rounded-2xl border border-border shadow-lg overflow-hidden'
        }`}>

            {/* Messages area */}
            {hasMessages && (
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
                    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-7 h-7 rounded-lg border border-border bg-muted flex items-center justify-center mr-3 mt-0.5 shrink-0">
                                        <span className="text-[10px] font-semibold text-foreground">RP</span>
                                    </div>
                                )}
                                <div className={`max-w-[80%] ${
                                    msg.role === 'user'
                                        ? 'bg-foreground text-background px-4 py-2.5 rounded-2xl rounded-br-md'
                                        : 'text-foreground px-4 py-2.5 rounded-2xl rounded-bl-md border border-border bg-card'
                                }`}>
                                    {msg.role === 'assistant' ? (
                                        <div className="prose prose-sm max-w-none prose-p:my-1 prose-p:leading-relaxed text-foreground">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <span className="text-sm leading-relaxed">{msg.content}</span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="w-7 h-7 rounded-lg border border-border bg-muted flex items-center justify-center mr-3 shrink-0">
                                    <span className="text-[10px] font-semibold text-foreground">RP</span>
                                </div>
                                <div className="flex gap-1.5 items-center pt-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-base-400 animate-bounce" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-base-400 animate-bounce [animation-delay:0.15s]" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-base-400 animate-bounce [animation-delay:0.3s]" />
                                </div>
                            </div>
                        )}

                        {creating && (
                            <div className="flex justify-start">
                                <div className="w-7 h-7 rounded-lg border border-border bg-muted flex items-center justify-center mr-3 shrink-0">
                                    <span className="text-[10px] font-semibold text-foreground">RP</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                                    <Loader2 size={14} className="animate-spin" />
                                    Setting up your project&hellip;
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>
            )}

            {/* Hero area — visible before conversation starts */}
            {!hasMessages && (
                <div className="flex-1 flex flex-col items-center justify-center px-4">
                    <div className="mb-8 flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl border border-border bg-card flex items-center justify-center mb-5 shadow-sm">
                            <span className="text-sm font-semibold text-foreground">RP</span>
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">
                            What do you want to research?
                        </h1>
                        <p className="text-sm text-muted-foreground max-w-md text-center leading-relaxed">
                            Describe your topic and I&apos;ll set up a research project &mdash; from literature discovery to a finished document.
                        </p>
                    </div>

                    {/* Suggestion cards */}
                    <div className="grid grid-cols-2 gap-2.5 w-full max-w-lg mb-8">
                        {SUGGESTIONS.map((s) => {
                            const Icon = s.icon;
                            return (
                                <button
                                    key={s.label}
                                    onClick={() => handleSuggestionClick(s.prompt)}
                                    className="group flex items-start gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-all hover:bg-muted hover:shadow-sm"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 transition-colors border border-border">
                                        <Icon size={15} className="text-muted-foreground transition-colors" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground">{s.label}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.description}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Quick topic pills */}
                    <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                        {QUICK_TOPICS.map((topic) => (
                            <button
                                key={topic}
                                onClick={() => {
                                    setInput(topic);
                                    void handleSendRef.current?.(topic);
                                }}
                                className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                            >
                                {topic}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input area — always at bottom */}
            <div className={`shrink-0 sticky bottom-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 px-4 pb-5 ${hasMessages ? 'pt-3 border-t border-border' : 'pt-6'}`}>
                <div className="max-w-2xl mx-auto space-y-2">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="relative flex items-end gap-2 bg-card rounded-2xl border border-border shadow-sm px-3 py-2.5 focus-within:shadow-md transition-all"
                    >
                        <button
                            type="button"
                            className="w-8 h-8 rounded-xl border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                            aria-label="Attach files"
                        >
                            <Paperclip size={14} className="mx-auto" />
                        </button>
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                creating
                                    ? 'Setting up your project\u2026'
                                    : hasMessages
                                        ? 'Reply\u2026'
                                        : 'Describe your research topic or question\u2026'
                            }
                            disabled={creating || loading}
                            rows={1}
                            className="flex-1 bg-transparent border-0 text-sm text-foreground resize-none focus:outline-none placeholder:text-muted-foreground disabled:opacity-50 leading-relaxed min-h-[24px] max-h-[160px]"
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || creating || loading}
                            className="w-8 h-8 rounded-xl bg-foreground hover:bg-foreground/90 text-background flex items-center justify-center transition-colors disabled:opacity-25 disabled:hover:bg-foreground shrink-0"
                        >
                            {creating ? (
                                <Loader2 size={14} className="animate-spin" />
                            ) : (
                                <ArrowUp size={15} strokeWidth={2.5} />
                            )}
                        </button>
                    </form>

                    {lastFailedInput && !loading && !creating && (
                        <button
                            type="button"
                            onClick={() => { void handleSend(lastFailedInput); }}
                            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <RotateCcw size={12} />
                            Retry last message
                        </button>
                    )}

                    {!hasMessages && (
                        <p className="text-center text-xs text-muted-foreground mt-3">
                            Research Pilot searches Semantic Scholar, arXiv, OpenAlex, CORE &amp; Springer Nature
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
