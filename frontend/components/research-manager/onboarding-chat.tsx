'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { chatApi, projectApi } from '@/lib/api';
import type { OnboardingAction } from '@/lib/types';
import {
    ArrowLeft,
    ArrowUp,
    BookOpen,
    Loader2,
    Sparkles,
    Target,
    FileText,
    Users,
    Check,
} from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

// ============== Types ==============

interface ChatMsg {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

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
    const [sessionId] = useState(() => crypto.randomUUID());
    const [historyLoaded, setHistoryLoaded] = useState(false);

    // Progress tracking
    const [collectedGoal, setCollectedGoal] = useState(false);
    const [collectedType, setCollectedType] = useState(false);
    const [collectedAudience, setCollectedAudience] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const sentInitial = useRef(false);
    const handleSendRef = useRef<((overrideText?: string) => Promise<void> | void) | null>(null);

    const genId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // --------------- Progress inference from messages ---------------

    const inferProgress = (msgs: ChatMsg[]) => {
        const userMsgCount = msgs.filter(m => m.role === 'user').length;
        const assistantMsgCount = msgs.filter(m => m.role === 'assistant').length;

        setCollectedGoal(userMsgCount >= 1);
        setCollectedType(assistantMsgCount >= 1);
        setCollectedAudience(assistantMsgCount >= 2);
    };

    // --------------- Scroll and load ---------------

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        setHistoryLoaded(true);
    }, []);

    // Send the initial query from URL if present
    useEffect(() => {
        if (initialQuery && historyLoaded && messages.length === 0 && !sentInitial.current) {
            sentInitial.current = true;
            void handleSendRef.current?.(initialQuery);
        }
    }, [initialQuery, historyLoaded, messages.length]);

    // --------------- Messaging ---------------

    const addAssistantMessage = (content: string) => {
        setMessages(prev => {
            const next = [...prev, { id: genId(), role: 'assistant' as const, content }];
            inferProgress(next);
            return next;
        });
    };

    const handleSend = async (overrideText?: string) => {
        const text = (overrideText || input).trim();
        if (!text || loading || creating) return;

        const userMsg: ChatMsg = { id: genId(), role: 'user', content: text };
        setMessages(prev => {
            const next = [...prev, userMsg];
            inferProgress(next);
            return next;
        });
        if (!overrideText) setInput('');
        setLoading(true);

        try {
            const res = await chatApi.onboarding(sessionId, text);

            if (!res.data) {
                addAssistantMessage("Something went wrong \u2014 try sending that again.");
                return;
            }

            const { response, action } = res.data;
            addAssistantMessage(response);

            // Handle create_project action
            if (action?.type === 'create_project') {
                await createProject(action);
            }
        } catch (err) {
            console.error('Onboarding chat error:', err);
            addAssistantMessage("I hit an error connecting to the server. Please try again in a moment.");
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
                setCollectedGoal(true);
                setCollectedType(true);
                setCollectedAudience(true);
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

    // --------------- Progress steps ---------------

    const steps = [
        { label: 'Research goal', icon: Target, done: collectedGoal },
        { label: 'Output type', icon: FileText, done: collectedType },
        { label: 'Audience', icon: Users, done: collectedAudience },
    ];

    // --------------- Render ---------------

    return (
        <div className={`mx-auto overflow-hidden flex flex-col bg-background rounded-xl border border-border shadow-sm ${fullPage
            ? 'w-full h-full max-w-2xl'
            : 'h-[520px] w-full max-w-2xl'
        }`}>
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-3 shrink-0 border-b border-border">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard"
                        className="w-7 h-7 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft size={15} />
                    </Link>
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-foreground flex items-center justify-center">
                            <Sparkles size={13} className="text-background" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold tracking-tight text-foreground">New project</p>
                            <p className="text-xs text-muted-foreground">
                                Describe your research and we&#39;ll set everything up
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-muted-foreground bg-muted/50">
                    {loading ? <Loader2 size={12} className="animate-spin" /> : <BookOpen size={12} />}
                    {loading ? 'Thinking\u2026' : 'Ready'}
                </div>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center gap-2 px-5 py-2.5 shrink-0 border-b border-border bg-muted/30">
                {steps.map((step, i) => {
                    const StepIcon = step.icon;
                    return (
                        <div key={step.label} className="flex items-center gap-1.5">
                            {i > 0 && (
                                <div className={`w-8 h-px ${step.done ? 'bg-foreground' : 'bg-border'}`} />
                            )}
                            <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                                step.done
                                    ? 'text-foreground'
                                    : 'text-muted-foreground'
                            }`}>
                                {step.done ? (
                                    <div className="w-4 h-4 rounded-full bg-foreground flex items-center justify-center">
                                        <Check size={10} className="text-background" />
                                    </div>
                                ) : (
                                    <StepIcon size={13} />
                                )}
                                <span className="hidden sm:inline">{step.label}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3">
                {messages.length === 0 && !initialQuery && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="w-11 h-11 rounded-lg bg-foreground flex items-center justify-center mb-4">
                            <Sparkles size={20} className="text-background" />
                        </div>
                        <h2 className="text-lg font-semibold tracking-tight text-foreground mb-1">
                            What do you want to research?
                        </h2>
                        <p className="text-sm text-muted-foreground max-w-sm">
                            Describe your research topic or question. I&#39;ll figure out the best setup and create your project in seconds.
                        </p>

                        {/* Quick-start suggestions */}
                        <div className="flex flex-wrap gap-2 mt-6 justify-center max-w-md">
                            {[
                                'Effect of AI on student learning outcomes',
                                'Systematic review of remote work productivity',
                                'Climate change impact on crop yields',
                            ].map((suggestion) => (
                                <button
                                    key={suggestion}
                                    onClick={() => {
                                        setInput(suggestion);
                                        void handleSendRef.current?.(suggestion);
                                    }}
                                    className="text-xs px-3 py-1.5 rounded-md border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors text-muted-foreground"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed ${
                            msg.role === 'user'
                                ? 'bg-foreground text-background rounded-2xl rounded-br-sm'
                                : 'bg-card border border-border text-card-foreground rounded-2xl rounded-bl-sm'
                        }`}>
                            {msg.role === 'assistant' ? (
                                <div className="prose prose-sm max-w-none prose-p:my-0.5 prose-p:leading-relaxed">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            ) : msg.content}
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-card border border-border px-3.5 py-2.5 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" />
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.15s]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.3s]" />
                        </div>
                    </div>
                )}

                {creating && (
                    <div className="flex justify-start">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2.5 rounded-2xl text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                            <Loader2 size={13} className="animate-spin" />
                            Setting up your project\u2026
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-2 shrink-0 border-t border-border bg-background">
                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex items-center gap-2 bg-muted/50 rounded-xl border border-input pl-4 pr-1.5 py-1.5 focus-within:border-ring focus-within:shadow-sm transition-all"
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                            creating
                                ? 'Setting up your project\u2026'
                                : messages.length === 0
                                    ? 'Describe your research topic or question\u2026'
                                    : 'Reply\u2026'
                        }
                        disabled={creating || loading}
                        className="flex-1 bg-transparent border-0 text-sm text-foreground focus:outline-none placeholder:text-muted-foreground disabled:opacity-50"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || creating || loading}
                        className="w-7 h-7 rounded-lg bg-foreground hover:bg-foreground/90 text-background flex items-center justify-center transition-colors disabled:opacity-20 shrink-0"
                    >
                        {creating ? <Loader2 size={12} className="animate-spin" /> : <ArrowUp size={14} />}
                    </button>
                </form>
            </div>
        </div>
    );
}
