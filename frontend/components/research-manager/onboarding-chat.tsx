'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { chatApi, literatureApi, projectApi } from '@/lib/api';
import { RESEARCH_ONBOARDING_PROMPT, parseOnboardingAction } from '@/lib/research-onboarding-prompt';
import type { Paper } from '@/lib/types';
import {
    ArrowLeft,
    ArrowUp,
    BookOpen,
    Check,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    FileDown,
    Filter,
    Loader2,
    Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface ChatMsg {
    id: string;
    role: 'user' | 'assistant';
    content: string;
}

type PendingIntent = {
    kind: 'literature' | 'project';
    query: string;
};

type LoadingStage = 'idle' | 'understanding' | 'retrieving' | 'reranking' | 'synthesizing';

interface SavedCollection {
    id: string;
    name: string;
    query: string;
    paperIds: string[];
    createdAt: string;
}

export function OnboardingChat({ fullPage = false }: { fullPage?: boolean }) {
    const STORAGE_KEY = 'research-chat-history-v2';
    const COLLECTIONS_KEY = 'research-chat-saved-collections-v1';
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const [loadingStage, setLoadingStage] = useState<LoadingStage>('idle');
    const [onboardingMode, setOnboardingMode] = useState(false);
    const [pendingIntent, setPendingIntent] = useState<PendingIntent | null>(null);
    const [papers, setPapers] = useState<Paper[]>([]);
    const [activeQuery, setActiveQuery] = useState('');
    const [expandedPaperId, setExpandedPaperId] = useState<string | null>(null);
    const [compareIds, setCompareIds] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<'relevance' | 'citations' | 'year'>('relevance');
    const [minRelevance, setMinRelevance] = useState(0);
    const [minYear, setMinYear] = useState(2015);
    const [minCitations, setMinCitations] = useState(0);
    const [savedCollections, setSavedCollections] = useState<SavedCollection[]>([]);
    const [lowConfidence, setLowConfidence] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const sentInitial = useRef(false);
    const handleSendRef = useRef<(overrideText?: string) => Promise<void> | void>(null);

    const genId = () => `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const stripJsonBlocks = (text: string) => text.replace(/```json[\s\S]*?```/g, '').trim();

    const isApproval = (text: string) => /^(yes|y|yeah|yep|sure|ok|okay|go ahead|do it|please do|proceed)\b/i.test(text.trim());
    const isDisapproval = (text: string) => /^(no|n|nope|nah|not now|don'?t|do not)\b/i.test(text.trim());

    const getPaperId = (paper: Paper, index: number) => paper.id || paper.external_id || `${paper.source}-${index}`;

    const detectIntent = (text: string): 'literature' | 'project' | 'general' => {
        const normalized = text.toLowerCase();
        if (/(literature|papers?|related work|systematic review|survey|citations?|find studies|academic sources?)/.test(normalized)) {
            return 'literature';
        }
        if (/(create|start|setup|set up|onboard).*(project|research plan)|new project|plan this research/.test(normalized)) {
            return 'project';
        }
        return 'general';
    };

    const stageText: Record<LoadingStage, string> = {
        idle: '',
        understanding: 'Understanding your request…',
        retrieving: 'Retrieving candidate papers…',
        reranking: 'Re-ranking by relevance and quality signals…',
        synthesizing: 'Synthesizing findings and gaps…',
    };

    const formatLiteratureResults = (query: string, foundPapers: Paper[]) => {
        if (!foundPapers.length) {
            return `I couldn't find strong matches for **${query}**. Try broadening the topic or using fewer constraints.`;
        }

        const top = foundPapers.slice(0, 10);
        const lines = top.map((paper, idx) => {
            const authorText = paper.authors && paper.authors.length > 0
                ? paper.authors.slice(0, 3).join(', ') + (paper.authors.length > 3 ? ', et al.' : '')
                : 'Unknown authors';
            const score = paper.final_score ?? paper.relevance_breakdown?.final_score;
            const scoreText = typeof score === 'number' ? ` · score ${score.toFixed(3)}` : '';
            const yearText = paper.year ? ` (${paper.year})` : '';
            if (paper.url) {
                return `${idx + 1}. [${paper.title}](${paper.url}) — ${authorText}${yearText}${scoreText}`;
            }
            return `${idx + 1}. **${paper.title}** — ${authorText}${yearText}${scoreText}`;
        });

        return [
            `### Literature review results`,
            `Query: **${query}**`,
            '',
            ...lines,
        ].join('\n');
    };

    const filteredPapers = useMemo(() => {
        const filtered = papers.filter((paper) => {
            const relevance = (paper.final_score ?? paper.relevance_breakdown?.final_score ?? 0) * 100;
            const year = paper.year ?? 0;
            const citations = paper.citation_count ?? 0;
            return relevance >= minRelevance && year >= minYear && citations >= minCitations;
        });

        return filtered.sort((a, b) => {
            if (sortBy === 'citations') return (b.citation_count ?? 0) - (a.citation_count ?? 0);
            if (sortBy === 'year') return (b.year ?? 0) - (a.year ?? 0);
            const aScore = a.final_score ?? a.relevance_breakdown?.final_score ?? 0;
            const bScore = b.final_score ?? b.relevance_breakdown?.final_score ?? 0;
            return bScore - aScore;
        });
    }, [papers, minRelevance, minYear, minCitations, sortBy]);

    const comparePapers = useMemo(() => {
        const selected = new Set(compareIds);
        return filteredPapers.filter((paper, index) => selected.has(getPaperId(paper, index)));
    }, [filteredPapers, compareIds]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loading]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as ChatMsg[];
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setMessages(parsed);
                }
            }

            const collectionsRaw = localStorage.getItem(COLLECTIONS_KEY);
            if (collectionsRaw) {
                const parsedCollections = JSON.parse(collectionsRaw) as SavedCollection[];
                if (Array.isArray(parsedCollections)) {
                    setSavedCollections(parsedCollections);
                }
            }
        } catch (err) {
            console.warn('Failed to load research chat history:', err);
        } finally {
            setHistoryLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (!historyLoaded) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
            localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(savedCollections));
        } catch (err) {
            console.warn('Failed to save research chat state:', err);
        }
    }, [messages, historyLoaded, savedCollections]);

    // Send the initial query from URL if present
    useEffect(() => {
        if (initialQuery && historyLoaded && messages.length === 0 && !sentInitial.current) {
            sentInitial.current = true;
            void handleSendRef.current?.(initialQuery);
        }
    }, [initialQuery, historyLoaded, messages.length]);

    const addAssistantMessage = (content: string) => {
        setMessages(prev => [...prev, { id: genId(), role: 'assistant', content }]);
    };

    const runOnboardingStep = async (text: string, userMsg: ChatMsg) => {
        const history = [...messages, userMsg]
            .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
            .join('\n');

        const fullPrompt = `${RESEARCH_ONBOARDING_PROMPT}\n\n## CONVERSATION SO FAR\n${history}\n\nRespond as the Research Planning Agent:`;
        const res = await chatApi.send(fullPrompt, 'general');
        const aiText = res.data?.response || 'I had trouble processing that. Could you rephrase?';
        const parsedAction = parseOnboardingAction(aiText);
        const displayText = stripJsonBlocks(aiText);
        addAssistantMessage(displayText);

        if (parsedAction?.action === 'create_project') {
            setCreating(true);
            try {
                const createRes = await projectApi.create({
                    research_goal: parsedAction.research_goal,
                    output_type: parsedAction.output_type,
                    audience: parsedAction.audience,
                });
                if (createRes.data?.id) {
                    addAssistantMessage('Project created. Redirecting you to the workspace…');
                    localStorage.removeItem(STORAGE_KEY);
                    setTimeout(() => router.push(`/projects/${createRes.data!.id}`), 900);
                }
            } catch (err) {
                console.error('Failed to create project:', err);
                addAssistantMessage('Something went wrong while creating the project. Please try once more.');
            } finally {
                setCreating(false);
            }
        }
    };

    const runLiteratureReview = async (query: string) => {
        setLoading(true);
        setLoadingStage('understanding');
        setActiveQuery(query);
        setPapers([]);
        setCompareIds([]);
        setLowConfidence(false);

        try {
            setLoadingStage('retrieving');
            const litRes = await literatureApi.search(query, 40);
            const foundPapers = litRes.data || [];

            setLoadingStage('reranking');
            setPapers(foundPapers);

            const topScore = foundPapers[0]?.final_score ?? foundPapers[0]?.relevance_breakdown?.final_score ?? 0;
            setLowConfidence(topScore < 0.5);

            setLoadingStage('synthesizing');
            const resultsMarkdown = formatLiteratureResults(query, foundPapers);

            let synthesis = '';
            if (foundPapers.length > 0) {
                const compact = foundPapers.slice(0, 12).map((paper, index) => {
                    const authors = (paper.authors || []).slice(0, 4).join(', ');
                    return `${index + 1}. ${paper.title} | ${authors} | ${paper.year || 'n/a'} | ${paper.abstract || 'No abstract'}`;
                }).join('\n');

                const synthesisPrompt = [
                    'Provide a concise literature review synthesis in 4 short paragraphs with headings:',
                    '1) Core themes',
                    '2) Methods and evidence patterns',
                    '3) Gaps and disagreements',
                    '4) Practical takeaways',
                    '',
                    `Topic: ${query}`,
                    'Use only the papers below and do not invent citations.',
                    compact,
                ].join('\n');

                const synthesisRes = await chatApi.send(synthesisPrompt, 'literature');
                synthesis = synthesisRes.data?.response || '';
            }

            addAssistantMessage(
                synthesis
                    ? `${synthesis}\n\n---\n\n${resultsMarkdown}`
                    : resultsMarkdown
            );
        } catch (err) {
            console.error('Literature review flow failed:', err);
            addAssistantMessage('I hit an error while running the literature review. Please try again in a moment.');
        } finally {
            setLoading(false);
            setLoadingStage('idle');
        }
    };

    const saveCurrentCollection = () => {
        if (!activeQuery || compareIds.length === 0) return;
        const collection: SavedCollection = {
            id: `col-${Date.now()}`,
            name: activeQuery.slice(0, 60),
            query: activeQuery,
            paperIds: compareIds,
            createdAt: new Date().toISOString(),
        };
        setSavedCollections(prev => [collection, ...prev].slice(0, 15));
    };

    const exportComparisonMarkdown = () => {
        if (comparePapers.length === 0) return;
        const body = comparePapers.map((paper, index) => {
            const authors = paper.authors?.join(', ') || 'Unknown authors';
            const score = paper.final_score ?? paper.relevance_breakdown?.final_score ?? 0;
            return [
                `## ${index + 1}. ${paper.title}`,
                `- Authors: ${authors}`,
                `- Year: ${paper.year || 'n/a'}`,
                `- Citations: ${paper.citation_count ?? 0}`,
                `- Relevance: ${(score * 100).toFixed(1)}%`,
                `- URL: ${paper.url || 'n/a'}`,
                '',
                paper.abstract ? `### Abstract\n${paper.abstract}` : '### Abstract\nNot available',
                '',
            ].join('\n');
        }).join('\n');

        const blob = new Blob([`# Literature comparison\n\nQuery: ${activeQuery}\n\n${body}`], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'literature-comparison.md';
        document.body.appendChild(anchor);
        anchor.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(anchor);
    };

    const toggleCompare = (id: string) => {
        setCompareIds(prev => {
            if (prev.includes(id)) return prev.filter(existing => existing !== id);
            if (prev.length >= 3) return prev;
            return [...prev, id];
        });
    };

    const handleSend = async (overrideText?: string) => {
        const text = (overrideText || input).trim();
        if (!text || loading) return;

        const userMsg: ChatMsg = { id: genId(), role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        if (!overrideText) setInput('');

        if (pendingIntent) {
            const approved = isApproval(text);
            const disapproved = isDisapproval(text);

            if (approved) {
                if (pendingIntent.kind === 'literature') {
                    addAssistantMessage(`Perfect — I’ll run a focused literature review for **${pendingIntent.query}**.`);
                    setPendingIntent(null);
                    await runLiteratureReview(pendingIntent.query);
                    return;
                }

                setPendingIntent(null);
                setOnboardingMode(true);
                addAssistantMessage('Great — let\'s set up a project. Start by telling me the exact research goal in one sentence.');
                return;
            }

            if (disapproved) {
                setPendingIntent(null);
                addAssistantMessage('Understood. I won\'t run that action. Continue with your next instruction.');
                return;
            }

            addAssistantMessage('Please reply with **yes** or **no** so I can proceed correctly.');
            return;
        }

        setLoading(true);

        try {
            if (onboardingMode) {
                await runOnboardingStep(text, userMsg);
                return;
            }

            const intent = detectIntent(text);
            if (intent === 'literature') {
                setPendingIntent({ kind: 'literature', query: text });
                addAssistantMessage(`I can run a literature-only review for **${text}** and return ranked papers with explainable scoring. Proceed? (yes/no)`);
                return;
            }

            if (intent === 'project') {
                setPendingIntent({ kind: 'project', query: text });
                addAssistantMessage('I can switch into project onboarding mode and ask only minimal setup questions (goal, output type, audience). Proceed? (yes/no)');
                return;
            }

            const res = await chatApi.send(text, 'general');
            const aiText = res.data?.response || 'Sorry, I had trouble processing that. Could you rephrase?';
            addAssistantMessage(aiText);
        } catch (err) {
            console.error('AI chat error:', err);
            addAssistantMessage('Error connecting to AI service.');
        } finally {
            setLoading(false);
            setLoadingStage('idle');
        }
    };

    handleSendRef.current = handleSend;

    return (
        <div className={`mx-auto overflow-hidden ${fullPage
            ? 'w-full h-full max-w-7xl bg-white rounded-3xl shadow-xl border border-slate-200'
            : 'h-[520px] w-full max-w-3xl bg-white rounded-2xl border border-black/[0.06] shadow-lg'
            }`}>
            <div className="grid h-full grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] overflow-hidden">
                <div className="flex min-h-0 flex-col border-r border-slate-200">
                    <div className="flex items-center justify-between gap-3 px-4 py-3 shrink-0 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/dashboard"
                                className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-all"
                            >
                                <ArrowLeft size={15} />
                            </Link>
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                    <Sparkles size={12} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-[13px] font-semibold text-slate-800">Research Assistant</p>
                                    <p className="text-[11px] text-slate-500">
                                        {onboardingMode ? 'Project setup mode' : 'General + literature mode'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] text-slate-600 bg-slate-50">
                            {loading ? <Loader2 size={12} className="animate-spin" /> : <BookOpen size={12} />}
                            {loading ? stageText[loadingStage] : 'Model ready'}
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
                        {messages.length === 0 && !initialQuery && (
                            <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mb-3">
                                    <Sparkles size={18} className="text-white" />
                                </div>
                                <h2 className="text-[15px] font-semibold text-gray-800 mb-1">What do you want to do?</h2>
                                <p className="text-[12px] text-gray-400 max-w-[360px]">
                                    Ask anything, run a literature review with approval, or explicitly start project onboarding.
                                </p>
                            </div>
                        )}

                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] px-3 py-2 text-[13px] leading-relaxed ${msg.role === 'user'
                                    ? 'bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-[14px] rounded-br-[4px]'
                                    : 'bg-gray-100/80 text-gray-800 rounded-[14px] rounded-bl-[4px]'
                                    }`}>
                                    {msg.role === 'assistant' ? (
                                        <div className="prose prose-sm max-w-none prose-slate prose-p:my-0.5">
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        </div>
                                    ) : msg.content}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100/80 px-3 py-2.5 rounded-[14px] rounded-bl-[4px] flex gap-1.5 items-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0.15s]" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce [animation-delay:0.3s]" />
                                    <span className="ml-1 text-[11px] text-slate-500">{stageText[loadingStage]}</span>
                                </div>
                            </div>
                        )}

                        {creating && (
                            <div className="flex justify-start">
                                <div className="bg-emerald-50 border border-emerald-200 px-3 py-2.5 rounded-[14px] text-[13px] text-emerald-700 flex items-center gap-2">
                                    <Loader2 size={13} className="animate-spin" />
                                    Setting up your project...
                                </div>
                            </div>
                        )}

                        {lowConfidence && papers.length > 0 && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
                                Top matches have lower confidence. Consider broadening your query, relaxing constraints, or reviewing adjacent keywords.
                            </div>
                        )}

                        {filteredPapers.length > 0 && (
                            <div className="space-y-2 pt-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[13px] font-semibold text-slate-700">Ranked literature ({filteredPapers.length})</h3>
                                    <div className="text-[11px] text-slate-500">Query: {activeQuery}</div>
                                </div>

                                {filteredPapers.map((paper, index) => {
                                    const score = (paper.final_score ?? paper.relevance_breakdown?.final_score ?? 0) * 100;
                                    const id = getPaperId(paper, index);
                                    const expanded = expandedPaperId === id;
                                    const inCompare = compareIds.includes(id);

                                    return (
                                        <div key={id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                                                            Relevance {score.toFixed(1)}%
                                                        </span>
                                                        <span className="text-[11px] text-slate-500">{paper.citation_count ?? 0} citations</span>
                                                        <span className="text-[11px] text-slate-500">{paper.year || 'n/a'}</span>
                                                    </div>
                                                    <h4 className="text-[14px] font-semibold text-slate-900 mt-1">{paper.title}</h4>
                                                    <p className="text-[12px] text-slate-600 mt-0.5 line-clamp-2">
                                                        {(paper.authors || []).slice(0, 5).join(', ') || 'Unknown authors'}
                                                    </p>
                                                </div>

                                                <button
                                                    onClick={() => toggleCompare(id)}
                                                    className={`text-[11px] rounded-md px-2 py-1 border ${inCompare
                                                        ? 'bg-slate-900 text-white border-slate-900'
                                                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {inCompare ? 'Comparing' : 'Compare'}
                                                </button>
                                            </div>

                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {paper.url && (
                                                    <a
                                                        href={paper.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[11px] inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-50"
                                                    >
                                                        Source <ExternalLink size={11} />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => setExpandedPaperId(expanded ? null : id)}
                                                    className="text-[11px] inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-50"
                                                >
                                                    Why this rank {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                                </button>
                                            </div>

                                            {expanded && (
                                                <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[12px] text-slate-700 space-y-1">
                                                    {Object.entries(paper.relevance_breakdown || {}).map(([key, value]) => (
                                                        <div key={key} className="flex items-center justify-between">
                                                            <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                                                            <span>{typeof value === 'number' ? value.toFixed(3) : String(value)}</span>
                                                        </div>
                                                    ))}
                                                    <div className="pt-1 text-slate-600">
                                                        {paper.abstract || 'No abstract available for this source.'}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {pendingIntent && (
                            <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-[12px] text-sky-900">
                                <p className="mb-2">
                                    Confirm action: {pendingIntent.kind === 'literature'
                                        ? `run literature review for "${pendingIntent.query}"`
                                        : 'switch to project onboarding mode'}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { setInput('yes'); void handleSendRef.current?.('yes'); }}
                                        className="rounded-md bg-sky-700 px-2.5 py-1 text-white"
                                    >
                                        Yes
                                    </button>
                                    <button
                                        onClick={() => { setInput('no'); void handleSendRef.current?.('no'); }}
                                        className="rounded-md border border-sky-300 px-2.5 py-1 text-sky-900"
                                    >
                                        No
                                    </button>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <div className="px-3 pb-3 pt-1 shrink-0 border-t border-slate-200 bg-white">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex items-center gap-2 bg-gray-50 rounded-xl border border-black/[0.06] pl-4 pr-1.5 py-1.5 focus-within:border-gray-300 focus-within:shadow-sm transition-all"
                        >
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={creating ? 'Setting up your project...' : 'Ask anything, or request a literature review...'}
                                disabled={creating || loading}
                                className="flex-1 bg-transparent border-0 text-[13px] text-gray-800 focus:outline-none placeholder:text-gray-400 disabled:opacity-50"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || creating || loading}
                                className="w-7 h-7 rounded-lg bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center transition-all disabled:opacity-20 shrink-0"
                            >
                                {creating ? <Loader2 size={12} className="animate-spin" /> : <ArrowUp size={14} />}
                            </button>
                        </form>
                    </div>
                </div>

                <aside className="hidden lg:flex min-h-0 flex-col overflow-hidden bg-slate-50">
                    <div className="p-3 border-b border-slate-200">
                        <h3 className="text-[13px] font-semibold text-slate-800 flex items-center gap-1.5">
                            <Filter size={13} /> Controls
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Transparent ranking and compare workspace</p>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 text-[12px]">
                        <div className="space-y-1.5 rounded-lg border border-slate-200 bg-white p-2.5">
                            <label className="block text-slate-600">Sort</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'relevance' | 'citations' | 'year')}
                                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1"
                            >
                                <option value="relevance">Relevance</option>
                                <option value="citations">Citations</option>
                                <option value="year">Year</option>
                            </select>

                            <label className="block text-slate-600 mt-2">Min relevance: {minRelevance}%</label>
                            <input
                                type="range"
                                min={0}
                                max={100}
                                value={minRelevance}
                                onChange={(e) => setMinRelevance(Number(e.target.value))}
                                className="w-full"
                            />

                            <label className="block text-slate-600 mt-2">Min year</label>
                            <input
                                type="number"
                                value={minYear}
                                min={1990}
                                max={new Date().getFullYear()}
                                onChange={(e) => setMinYear(Number(e.target.value) || 1990)}
                                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1"
                            />

                            <label className="block text-slate-600 mt-2">Min citations</label>
                            <input
                                type="number"
                                value={minCitations}
                                min={0}
                                onChange={(e) => setMinCitations(Math.max(0, Number(e.target.value) || 0))}
                                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1"
                            />
                        </div>

                        <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-2.5">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-700">Compare ({comparePapers.length}/3)</span>
                                <button
                                    onClick={exportComparisonMarkdown}
                                    disabled={comparePapers.length === 0}
                                    className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 disabled:opacity-40"
                                >
                                    <FileDown size={11} /> Export
                                </button>
                            </div>

                            {comparePapers.length === 0 ? (
                                <p className="text-slate-500">Pick up to 3 papers from cards to compare.</p>
                            ) : (
                                <div className="space-y-2">
                                    {comparePapers.map((paper, index) => (
                                        <div key={getPaperId(paper, index)} className="rounded-md border border-slate-200 p-2">
                                            <p className="font-medium text-slate-800 line-clamp-2">{paper.title}</p>
                                            <p className="text-slate-500 mt-0.5">{paper.year || 'n/a'} · {paper.citation_count ?? 0} citations</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={saveCurrentCollection}
                                disabled={compareIds.length === 0}
                                className="w-full inline-flex justify-center items-center gap-1 rounded-md bg-slate-900 px-2 py-1 text-white disabled:opacity-40"
                            >
                                <Check size={11} /> Save selection
                            </button>
                        </div>

                        <div className="space-y-1.5 rounded-lg border border-slate-200 bg-white p-2.5">
                            <span className="font-medium text-slate-700">Saved selections</span>
                            {savedCollections.length === 0 ? (
                                <p className="text-slate-500">No saved collections yet.</p>
                            ) : (
                                <div className="space-y-1.5">
                                    {savedCollections.slice(0, 6).map((collection) => (
                                        <div key={collection.id} className="rounded-md border border-slate-200 p-2 text-slate-700">
                                            <p className="font-medium line-clamp-1">{collection.name}</p>
                                            <p className="text-slate-500">{collection.paperIds.length} papers</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}
