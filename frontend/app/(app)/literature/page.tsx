'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { literatureApi, papersApi, projectApi, type LiteratureV2Response } from '@/lib/api';
import type { Paper, Project } from '@/lib/types';
import {
    BookOpen, ChevronDown, ChevronRight, Clock, Cpu,
    ExternalLink, FileDown, FileText, Filter, History,
    Loader2, Plus, RefreshCw, Search, Sparkles, TrendingUp,
    X, Zap, ArrowUpDown, AlertCircle,
} from 'lucide-react';

// ── History helpers ────────────────────────────────────────────────────────── //
const HISTORY_KEY = 'research-lit-history';
const MAX_HISTORY = 12;
interface HistoryEntry { query: string; timestamp: number; count: number }
function loadHistory(): HistoryEntry[] {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
    catch { return []; }
}
function saveHistory(h: HistoryEntry[]) { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); }
function pushHistory(query: string, count: number) {
    const all = loadHistory().filter(e => e.query.toLowerCase() !== query.toLowerCase());
    all.unshift({ query, timestamp: Date.now(), count });
    saveHistory(all.slice(0, MAX_HISTORY));
}

// ── Score bars ─────────────────────────────────────────────────────────────── //
const SCORE_FIELDS = [
    { key: 'semantic_alignment',   label: 'Topic',    color: 'bg-blue-500' },
    { key: 'citation_signal',      label: 'Cites',    color: 'bg-emerald-500' },
    { key: 'recency_score',        label: 'Recency',  color: 'bg-amber-500' },
    { key: 'attribute_alignment',  label: 'Attrs',    color: 'bg-violet-500' },
    { key: 'dataset_match',        label: 'Keywords', color: 'bg-sky-500' },
    { key: 'methodological_match', label: 'Semantic', color: 'bg-rose-400' },
] as const;

type RBKey = typeof SCORE_FIELDS[number]['key'];

function MiniScoreRow({ rb }: { rb: Paper['relevance_breakdown'] }) {
    if (!rb) return null;
    const visible = SCORE_FIELDS.filter(f => rb[f.key as RBKey] != null);
    if (!visible.length) return null;
    return (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
            {visible.map(({ key, label, color }) => {
                const pct = Math.round((rb[key as RBKey] as number) * 100);
                return (
                    <div key={key} className="flex items-center gap-1" title={`${label}: ${pct}%`}>
                        <span className="text-[9px] text-gray-400 w-[40px] shrink-0">{label}</span>
                        <div className="w-[36px] h-1 rounded-full bg-gray-100 overflow-hidden">
                            <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[9px] text-gray-500 w-[22px] text-right">{pct}%</span>
                    </div>
                );
            })}
        </div>
    );
}

// ── Source badge ───────────────────────────────────────────────────────────── //
const SOURCE_STYLES: Record<string, { label: string; cls: string }> = {
    semantic_scholar: { label: 'S2',       cls: 'bg-blue-50 text-blue-600' },
    openalex:         { label: 'OA',       cls: 'bg-emerald-50 text-emerald-600' },
    arxiv:            { label: 'arXiv',    cls: 'bg-orange-50 text-orange-600' },
    core:             { label: 'CORE',     cls: 'bg-violet-50 text-violet-600' },
    springer:         { label: 'Springer', cls: 'bg-rose-50 text-rose-600' },
};
function SourceBadge({ source }: { source: string }) {
    const s = SOURCE_STYLES[source] ?? { label: source, cls: 'bg-gray-50 text-gray-500' };
    return <span className={`inline-flex items-center px-1.5 py-px rounded text-[10px] font-semibold ${s.cls}`}>{s.label}</span>;
}

// ── Paper row ──────────────────────────────────────────────────────────────── //
function PaperRow({ paper, rank, compareActive, onToggleCompare, onAddToProject, isAdding, isAdded, addDisabled }: {
    paper: Paper;
    rank: number;
    compareActive: boolean;
    onToggleCompare: () => void;
    onAddToProject: () => void;
    isAdding: boolean;
    isAdded: boolean;
    addDisabled: boolean;
}) {
    const [expanded, setExpanded] = useState(false);
    const rb = paper.relevance_breakdown;
    const pdfUrl = paper.open_access_pdf_url ?? paper.pdf_url;
    const score = rb?.final_score ?? paper.final_score;
    const pct = score != null ? Math.round(score * 100) : null;
    const scoreCls = pct == null ? 'text-gray-400 bg-gray-50'
        : pct >= 60 ? 'text-emerald-700 bg-emerald-50'
        : pct >= 45 ? 'text-blue-700 bg-blue-50'
        : 'text-gray-500 bg-gray-50';

    return (
        <div className={`group border-b border-gray-50 last:border-0 transition-colors ${expanded ? 'bg-gray-50/60' : 'hover:bg-gray-50/40'}`}>
            <div className="flex items-start gap-3 px-4 py-3">
                {/* rank + score */}
                <div className="flex flex-col items-center gap-0.5 pt-0.5 shrink-0 w-9">
                    <span className="text-[10px] text-gray-300 font-mono leading-none">#{rank}</span>
                    {pct != null && (
                        <span className={`text-[10px] font-bold rounded px-1 py-px leading-none ${scoreCls}`}>{pct}%</span>
                    )}
                </div>
                {/* body */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <SourceBadge source={paper.source} />
                        {paper.year && <span className="text-[10px] text-gray-400">{paper.year}</span>}
                        {paper.citation_count != null && paper.citation_count > 0 && (
                            <span className="text-[10px] text-gray-400">{paper.citation_count.toLocaleString()} cites</span>
                        )}
                    </div>
                    <button onClick={() => setExpanded(!expanded)} className="text-left w-full group/t">
                        <h3 className="text-[13px] font-medium text-gray-900 leading-snug group-hover/t:text-blue-700 transition-colors line-clamp-2">
                            {paper.title}
                        </h3>
                    </button>
                    {paper.authors && paper.authors.length > 0 && (
                        <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                            {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ` +${paper.authors.length - 3}` : ''}
                        </p>
                    )}
                    <MiniScoreRow rb={rb} />
                    {expanded && (
                        <div className="mt-2 space-y-2">
                            {paper.abstract && (
                                <p className="text-[12px] text-gray-600 leading-relaxed">{paper.abstract}</p>
                            )}
                            <div className="flex items-center gap-3">
                                {paper.url && (
                                    <a href={paper.url} target="_blank" rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
                                        <ExternalLink size={10} /> Source
                                    </a>
                                )}
                                {pdfUrl && (
                                    <a href={pdfUrl} target="_blank" rel="noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
                                        <FileText size={10} /> PDF
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="shrink-0 self-start mt-0.5 flex flex-col gap-1.5">
                    <button onClick={onToggleCompare}
                        className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                            compareActive
                                ? 'bg-gray-900 text-white border-gray-900'
                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-800'
                        }`}>
                        {compareActive ? '✓' : <Plus size={10} />}
                    </button>
                    <button
                        onClick={onAddToProject}
                        disabled={addDisabled || isAdding || isAdded}
                        className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                            isAdded
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900 disabled:opacity-40'
                        }`}
                    >
                        {isAdding ? 'Adding...' : isAdded ? 'Added' : 'Add'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Intent strip ───────────────────────────────────────────────────────────── //
function IntentStrip({ trace }: { trace: LiteratureV2Response }) {
    const [showKw, setShowKw] = useState(false);
    const intent = trace.intent as Record<string, unknown>;
    const terms = (intent.expanded_query_terms as string[] | null) ?? [];
    const coreTopic = intent.core_topic as string | undefined;
    const yearMin = intent.year_min as number | undefined;
    const { total_ms, retrieval_ms, scoring_ms } = trace.timing;
    const filterTotal = Object.values(trace.filter_drops).reduce((a, b) => a + b, 0);
    const hasDeg = trace.degrade.cross_encoder_top_k_only || trace.degrade.reduced_candidate_pool || trace.degrade.skipped_citation_expansion;

    return (
        <div className="border-b border-gray-100 px-4 py-2 bg-gray-50/60">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                    <Cpu size={11} className="text-gray-400 shrink-0" />
                    <span className="text-[11px] text-gray-600 truncate">
                        {coreTopic
                            ? <><span className="text-gray-400">Interpreted as </span><b className="text-gray-800">{coreTopic}</b></>
                            : <b className="text-gray-700">{trace.query}</b>
                        }
                    </span>
                    {yearMin && (
                        <span className="text-[10px] px-1.5 py-px bg-amber-50 text-amber-600 rounded font-medium border border-amber-100">{yearMin}+</span>
                    )}
                    {hasDeg && (
                        <span className="text-[10px] px-1.5 py-px bg-orange-50 text-orange-600 rounded font-medium border border-orange-100" title="Quality degraded for speed">degraded</span>
                    )}
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[10px] text-gray-400">
                    <span><Clock size={9} className="inline mb-px" /> {(total_ms / 1000).toFixed(2)}s</span>
                    <span>{retrieval_ms}ms · {scoring_ms}ms</span>
                    <span><TrendingUp size={9} className="inline mb-px" /> {trace.returned_count}/{trace.candidate_pool_size}</span>
                    {filterTotal > 0 && <span><Filter size={9} className="inline mb-px" /> {filterTotal} filtered</span>}
                    {terms.length > 0 && (
                        <button onClick={() => setShowKw(!showKw)}
                            className="inline-flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700 font-medium border border-blue-100 bg-blue-50 rounded px-1.5 py-px transition-colors">
                            <Zap size={9} /> {terms.length} AI keywords {showKw ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
                        </button>
                    )}
                </div>
            </div>
            {showKw && terms.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {terms.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-blue-100 text-[10px] text-blue-700 font-medium">{t}</span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Compare panel ──────────────────────────────────────────────────────────── //
function ComparePanel({ papers, query, onRemove }: { papers: Paper[]; query: string; onRemove: (i: number) => void }) {
    if (papers.length === 0) return null;

    const exportMd = () => {
        const body = papers.map((p, i) => {
            const score = p.final_score ?? p.relevance_breakdown?.final_score ?? 0;
            return [`## ${i + 1}. ${p.title}`,
                `- Authors: ${p.authors?.join(', ') || 'n/a'}`,
                `- Year: ${p.year || 'n/a'} · Citations: ${p.citation_count ?? 0}`,
                `- Relevance: ${(score * 100).toFixed(1)}%`,
                `- URL: ${p.url || 'n/a'}`, ''].join('\n');
        }).join('\n');
        const blob = new Blob([`# Literature Comparison\n\nQuery: ${query}\n\n${body}`], { type: 'text/markdown' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'comparison.md';
        a.click();
    };

    return (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/40">
                <span className="text-[12px] font-semibold text-gray-700">Comparing {papers.length}/3</span>
                <button onClick={exportMd}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-2.5 py-1 rounded-md transition-colors">
                    <FileDown size={11} /> Export .md
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-gray-50">
                {papers.map((p, i) => {
                    const score = (p.final_score ?? p.relevance_breakdown?.final_score ?? 0) * 100;
                    return (
                        <div key={i} className="p-3 relative group">
                            <button onClick={() => onRemove(i)}
                                className="absolute top-2 right-2 text-gray-200 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all">
                                <X size={12} />
                            </button>
                            <div className="flex items-center gap-1.5 mb-1">
                                <SourceBadge source={p.source} />
                                {p.year && <span className="text-[10px] text-gray-400">{p.year}</span>}
                                <span className="text-[10px] font-bold text-blue-700">{score.toFixed(0)}%</span>
                            </div>
                            <p className="text-[12px] font-medium text-gray-900 line-clamp-2 leading-snug">{p.title}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{p.citation_count ?? 0} cites</p>
                            <MiniScoreRow rb={p.relevance_breakdown} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ── Page ───────────────────────────────────────────────────────────────────── //
type SortKey = 'relevance' | 'citations' | 'year' | 'recency';

export default function LiteratureSearchPage() {
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [trace, setTrace] = useState<LiteratureV2Response | null>(null);
    const [results, setResults] = useState<Paper[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [sortKey, setSortKey] = useState<SortKey>('relevance');
    const [compareIds, setCompareIds] = useState<Set<string>>(() => new Set());
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [targetProjectId, setTargetProjectId] = useState('');
    const [addingPaperIds, setAddingPaperIds] = useState<Set<string>>(() => new Set());
    const [addedPaperIds, setAddedPaperIds] = useState<Set<string>>(() => new Set());

    // Filter state
    const [showFilters, setShowFilters] = useState(false);
    const [yearMin, setYearMin] = useState<number>(2018);
    const [yearMax, setYearMax] = useState<number>(2024);
    const [minCitations, setMinCitations] = useState<number>(0);
    const [selectedSources, setSelectedSources] = useState<Set<string>>(() => new Set(['semantic_scholar', 'arxiv']));
    const [openAccessOnly, setOpenAccessOnly] = useState(false);

    useEffect(() => { setHistory(loadHistory()); }, []);
    useEffect(() => {
        projectApi.list().then((res) => {
            if (!res.data) return;
            setProjects(res.data);
            if (!targetProjectId && res.data.length > 0) {
                setTargetProjectId(res.data[0].id);
            }
        });
    }, [targetProjectId]);

    const getPaperId = (p: Paper, i: number) => p.id || p.external_id || `${p.source}-${i}`;

    const sorted = useMemo(() => {
        // Apply filters first
        let filtered = results.filter(paper => {
            // Year filter
            if (paper.year && (paper.year < yearMin || paper.year > yearMax)) {
                return false;
            }
            // Citation count filter
            if (minCitations > 0 && (paper.citation_count ?? 0) < minCitations) {
                return false;
            }
            // Source filter
            if (selectedSources.size > 0 && !selectedSources.has(paper.source)) {
                return false;
            }
            // Open access filter
            if (openAccessOnly && !paper.open_access_pdf_url && !paper.pdf_url) {
                return false;
            }
            return true;
        });

        // Then sort
        const copy = [...filtered];
        switch (sortKey) {
            case 'citations': return copy.sort((a, b) => (b.citation_count ?? 0) - (a.citation_count ?? 0));
            case 'year':      return copy.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
            case 'recency':   return copy.sort((a, b) =>
                ((b.relevance_breakdown?.recency_score ?? 0) as number) -
                ((a.relevance_breakdown?.recency_score ?? 0) as number));
            default:          return copy;
        }
    }, [results, sortKey, yearMin, yearMax, minCitations, selectedSources, openAccessOnly]);

    const comparePapers = useMemo(() =>
        sorted.filter((p, i) => compareIds.has(getPaperId(p, i))),
        [sorted, compareIds]
    );

    const handleSearch = useCallback(async (q?: string) => {
        const query_ = (q ?? query).trim();
        if (!query_ || searching) return;
        if (q) { setQuery(q); }
        setSearching(true); setError(null); setCompareIds(new Set()); setTrace(null);
        try {
            const res = await literatureApi.searchV2(query_);
            if (res.data) {
                setTrace(res.data);
                setResults(res.data.papers || []);
                // Save to history and update state immediately
                pushHistory(query_, res.data.returned_count);
                const updated = loadHistory();
                setHistory(updated);
                console.log('History saved:', updated); // Debug log
            }
        } catch (err) {
            // Enhanced error handling with specific messages
            const errorMessage = (err as any)?.response?.data?.detail || (err as any)?.message || '';
            if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
                setError('Rate limit exceeded. Please wait a moment and try again.');
            } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                setError('Network error. Please check your connection and retry.');
            } else if (errorMessage.includes('timeout')) {
                setError('Request timed out. The search is taking longer than expected. Try again.');
            } else {
                setError('Search failed. Please try again.');
            }
            setResults([]);
        } finally { setSearching(false); }
    }, [query, searching]);

    const handleRefine = useCallback(async () => {
        const q = query.trim();
        if (!q || searching) return;
        setSearching(true); setError(null);
        try {
            const res = await literatureApi.refineV2(q);
            if (res.data) { setTrace(res.data); setResults(res.data.papers || []); }
        } catch (err) {
            // Enhanced error handling for refine
            const errorMessage = (err as any)?.response?.data?.detail || (err as any)?.message || '';
            if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
                setError('Rate limit exceeded. Please wait a moment and try again.');
            } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                setError('Network error. Please check your connection and retry.');
            } else if (errorMessage.includes('timeout')) {
                setError('Request timed out. The refine search is taking longer than expected. Try again.');
            } else {
                setError('Refine failed. Please try again.');
            }
        } finally { setSearching(false); }
    }, [query, searching]);

    const toggleCompare = (id: string) =>
        setCompareIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) { next.delete(id); }
            else if (next.size < 3) next.add(id);
            return next;
        });

    const addPaperToProject = async (paper: Paper, id: string) => {
        if (!targetProjectId) {
            setError('Select a project first.');
            return;
        }
        setAddingPaperIds((prev) => new Set(prev).add(id));
        try {
            const res = await papersApi.add(targetProjectId, paper);
            if (res.data) {
                setAddedPaperIds((prev) => new Set(prev).add(id));
            }
        } catch {
            setError('Failed to add paper to project.');
        } finally {
            setAddingPaperIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    return (
        <div className="w-full min-h-[calc(100vh-80px)] px-4 pb-12 bg-gray-50">
            <div className="mx-auto max-w-4xl pt-6 space-y-3">

                {/* ── Search card ── */}
                <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
                        <BookOpen size={14} className="text-gray-500" />
                        <span className="text-[13px] font-semibold text-gray-800">Literature Explorer</span>
                        <Link href="/projects" className="ml-auto text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
                            My projects →
                        </Link>
                    </div>

                    <div className="px-4 py-3 space-y-3">
                        <div className="flex items-center gap-2">
                            <label className="text-[11px] text-gray-500 font-medium">Add papers to</label>
                            <select
                                value={targetProjectId}
                                onChange={(e) => setTargetProjectId(e.target.value)}
                                className="text-[12px] border border-gray-200 rounded-md px-2 py-1 bg-white min-w-[220px]"
                            >
                                {projects.length === 0 && <option value="">No projects</option>}
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.research_goal}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 focus-within:border-blue-200 focus-within:bg-white transition-colors">
                                <Search size={13} className="text-gray-400 shrink-0" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    placeholder="Describe your research topic — AI expands into ranked keywords"
                                    className="flex-1 bg-transparent text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none min-w-0"
                                />
                                {query && (
                                    <button onClick={() => setQuery('')} className="text-gray-300 hover:text-gray-500 transition-colors">
                                        <X size={11} />
                                    </button>
                                )}
                            </div>
                            <button onClick={() => setShowFilters(!showFilters)}
                                className={`p-2 rounded-lg border transition-colors ${showFilters ? 'border-violet-200 bg-violet-50 text-violet-600' : 'border-gray-100 bg-gray-50 text-gray-400 hover:text-gray-700'}`}
                                title="Filters">
                                <Filter size={13} />
                            </button>
                            <button onClick={() => handleSearch()} disabled={searching || !query.trim()}
                                className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-[12px] font-medium transition-colors shrink-0">
                                {searching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                                Search
                            </button>
                            <button onClick={handleRefine} disabled={searching || !query.trim() || results.length === 0}
                                className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 disabled:opacity-40 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg text-[12px] font-medium transition-colors shrink-0">
                                <Sparkles size={12} />
                                Refine
                            </button>
                        </div>

                        {/* Recent searches - always visible when available */}
                        {history.length > 0 && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Clock size={9} />
                                        Recent searches ({history.length})
                                    </span>
                                    <button onClick={() => { saveHistory([]); setHistory([]); }}
                                        className="text-[10px] text-gray-400 hover:text-red-500 transition-colors">Clear all</button>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {history.map((h, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSearch(h.query)}
                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg text-[11px] text-gray-600 hover:text-blue-700 transition-all group"
                                        >
                                            <span className="max-w-[200px] truncate font-medium">{h.query}</span>
                                            <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 rounded-full group-hover:bg-blue-100 group-hover:text-blue-600">{h.count}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Filters panel */}
                        {showFilters && (
                            <div className="rounded-lg border border-gray-100 bg-white shadow-md overflow-hidden">
                                <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-50 bg-gray-50/60">
                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Filters</span>
                                    <button onClick={() => {
                                        setShowFilters(false);
                                        setYearMin(2018);
                                        setYearMax(2024);
                                        setMinCitations(0);
                                        setSelectedSources(new Set(['semantic_scholar', 'arxiv']));
                                        setOpenAccessOnly(false);
                                    }}
                                        className="text-[10px] text-gray-400 hover:text-red-500 transition-colors">Reset all</button>
                                </div>
                                <div className="p-3 space-y-3">
                                    {/* Year range */}
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-gray-600">Publication year</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={yearMin}
                                                onChange={e => setYearMin(parseInt(e.target.value) || 2000)}
                                                className="w-20 text-[11px] border border-gray-200 rounded px-2 py-1"
                                                min="1900"
                                                max={yearMax}
                                            />
                                            <span className="text-[11px] text-gray-400">to</span>
                                            <input
                                                type="number"
                                                value={yearMax}
                                                onChange={e => setYearMax(parseInt(e.target.value) || 2024)}
                                                className="w-20 text-[11px] border border-gray-200 rounded px-2 py-1"
                                                min={yearMin}
                                                max="2030"
                                            />
                                        </div>
                                    </div>

                                    {/* Citations */}
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-gray-600">Minimum citations</label>
                                        <input
                                            type="number"
                                            value={minCitations}
                                            onChange={e => setMinCitations(parseInt(e.target.value) || 0)}
                                            className="w-full text-[11px] border border-gray-200 rounded px-2 py-1"
                                            min="0"
                                        />
                                    </div>

                                    {/* Sources */}
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-medium text-gray-600">Sources</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['semantic_scholar', 'arxiv', 'core', 'springer', 'openalex'].map(source => (
                                                <label key={source} className="inline-flex items-center gap-1.5 text-[11px] cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSources.has(source)}
                                                        onChange={e => {
                                                            const next = new Set(selectedSources);
                                                            if (e.target.checked) next.add(source);
                                                            else next.delete(source);
                                                            setSelectedSources(next);
                                                        }}
                                                        className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                                    />
                                                    <span className="capitalize">{source.replace('_', ' ')}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Open access toggle */}
                                    <label className="inline-flex items-center gap-2 text-[11px] cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={openAccessOnly}
                                            onChange={e => setOpenAccessOnly(e.target.checked)}
                                            className="rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                                        />
                                        <span className="font-medium text-gray-600">Open access only</span>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Error ── */}
                {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                        <div className="flex items-start gap-3">
                            <AlertCircle size={14} className="text-rose-500 shrink-0 mt-px" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] text-rose-700">{error}</p>
                                <button
                                    onClick={() => void handleSearch()}
                                    className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-medium text-rose-600 hover:text-rose-800 transition-colors"
                                >
                                    <RefreshCw size={10} /> Retry search
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Compare panel ── */}
                {comparePapers.length > 0 && (
                    <ComparePanel papers={comparePapers} query={query}
                        onRemove={(i) => {
                            const id = getPaperId(comparePapers[i], i);
                            toggleCompare(id);
                        }} />
                )}

                {/* ── Results card ── */}
                {(searching || results.length > 0 || trace) && (
                    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                        {/* Toolbar */}
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 bg-gray-50/40">
                            <span className="text-[12px] font-semibold text-gray-700">
                                {searching ? 'Searching…' : `${sorted.length} results`}
                            </span>
                            {sorted.length > 0 && (
                                <div className="flex items-center gap-1">
                                    <ArrowUpDown size={10} className="text-gray-400" />
                                    <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
                                        className="text-[11px] text-gray-600 bg-transparent border-0 focus:outline-none cursor-pointer font-medium appearance-none">
                                        <option value="relevance">Relevance</option>
                                        <option value="citations">Most cited</option>
                                        <option value="year">Newest</option>
                                        <option value="recency">Recency score</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Intent strip */}
                        {trace && !searching && <IntentStrip trace={trace} />}

                        {/* Loading skeletons */}
                        {searching && (
                            <div className="p-2">
                                {[1,2,3,4,5].map(i => (
                                    <div key={i} className="flex gap-3 px-4 py-3 animate-pulse border-b border-gray-50 last:border-0">
                                        <div className="w-9 space-y-1"><div className="h-3 w-5 bg-gray-100 rounded" /><div className="h-4 w-7 bg-gray-100 rounded" /></div>
                                        <div className="flex-1 space-y-1.5">
                                            <div className="h-3 w-1/4 bg-gray-100 rounded" />
                                            <div className="h-4 w-3/4 bg-gray-200 rounded" />
                                            <div className="h-3 w-1/2 bg-gray-100 rounded" />
                                            <div className="flex gap-2 pt-0.5">{[1,2,3,4,5,6].map(j=><div key={j} className="h-1 w-[103px] bg-gray-100 rounded"/>)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Results list */}
                        {!searching && sorted.length > 0 && (
                            <div>
                                {sorted.map((paper, idx) => {
                                    const id = getPaperId(paper, idx);
                                    return (
                                        <PaperRow
                                            key={id}
                                            paper={paper}
                                            rank={idx + 1}
                                            compareActive={compareIds.has(id)}
                                            onToggleCompare={() => toggleCompare(id)}
                                            onAddToProject={() => void addPaperToProject(paper, id)}
                                            isAdding={addingPaperIds.has(id)}
                                            isAdded={addedPaperIds.has(id)}
                                            addDisabled={!targetProjectId}
                                        />
                                    );
                                })}
                            </div>
                        )}

                        {!searching && trace && sorted.length === 0 && (
                            <div className="p-12 text-center">
                                <Search size={20} className="text-gray-200 mx-auto mb-3" />
                                <p className="text-[13px] font-medium text-gray-600">No results found</p>
                                <p className="text-[12px] text-gray-400 mt-1">Try a broader or different query</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Empty state ── */}
                {!searching && results.length === 0 && !trace && !error && (
                    <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-12 text-center">
                        <BookOpen size={28} className="text-gray-200 mx-auto mb-3" />
                        <p className="text-[14px] font-semibold text-gray-700">Search academic literature</p>
                        <p className="text-[12px] text-gray-400 mt-1.5 max-w-sm mx-auto">
                            AI expands your research topic into targeted keywords across Semantic Scholar, arXiv, OpenAlex, CORE, and Springer
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
