'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { literatureApi, type LiteratureV2Response } from '@/lib/api';
import type { Paper } from '@/lib/types';
import {
    BookOpen, ChevronDown, ChevronRight, Clock, Cpu,
    ExternalLink, FileDown, FileText, Filter, History,
    Loader2, Plus, Search, Sparkles, TrendingUp,
    X, Zap, ArrowUpDown,
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
function PaperRow({ paper, rank, compareActive, onToggleCompare }: {
    paper: Paper; rank: number; compareActive: boolean; onToggleCompare: () => void;
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
                {/* compare toggle */}
                <button onClick={onToggleCompare}
                    className={`shrink-0 self-start mt-0.5 px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
                        compareActive
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-800'
                    }`}>
                    {compareActive ? '✓' : <Plus size={10} />}
                </button>
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
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => { setHistory(loadHistory()); }, []);

    const getPaperId = (p: Paper, i: number) => p.id || p.external_id || `${p.source}-${i}`;

    const sorted = useMemo(() => {
        const copy = [...results];
        switch (sortKey) {
            case 'citations': return copy.sort((a, b) => (b.citation_count ?? 0) - (a.citation_count ?? 0));
            case 'year':      return copy.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
            case 'recency':   return copy.sort((a, b) =>
                ((b.relevance_breakdown?.recency_score ?? 0) as number) -
                ((a.relevance_breakdown?.recency_score ?? 0) as number));
            default:          return copy;
        }
    }, [results, sortKey]);

    const comparePapers = useMemo(() =>
        sorted.filter((p, i) => compareIds.has(getPaperId(p, i))),
        [sorted, compareIds]
    );

    const handleSearch = useCallback(async (q?: string) => {
        const query_ = (q ?? query).trim();
        if (!query_ || searching) return;
        if (q) { setQuery(q); setShowHistory(false); }
        setSearching(true); setError(null); setCompareIds(new Set()); setTrace(null);
        try {
            const res = await literatureApi.searchV2(query_);
            if (res.data) {
                setTrace(res.data);
                setResults(res.data.papers || []);
                pushHistory(query_, res.data.returned_count);
                setHistory(loadHistory());
            }
        } catch { setError('Search failed. Please try again.'); setResults([]); }
        finally { setSearching(false); }
    }, [query, searching]);

    const handleRefine = useCallback(async () => {
        const q = query.trim();
        if (!q || searching) return;
        setSearching(true); setError(null);
        try {
            const res = await literatureApi.refineV2(q);
            if (res.data) { setTrace(res.data); setResults(res.data.papers || []); }
        } catch { setError('Refine failed. Please try again.'); }
        finally { setSearching(false); }
    }, [query, searching]);

    const toggleCompare = (id: string) =>
        setCompareIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) { next.delete(id); }
            else if (next.size < 3) next.add(id);
            return next;
        });

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

                    <div className="px-4 py-3 space-y-2">
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
                            {history.length > 0 && (
                                <button onClick={() => setShowHistory(!showHistory)}
                                    className={`p-2 rounded-lg border transition-colors ${showHistory ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-gray-100 bg-gray-50 text-gray-400 hover:text-gray-700'}`}
                                    title="Search history">
                                    <History size={13} />
                                </button>
                            )}
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

                        {/* History dropdown */}
                        {showHistory && history.length > 0 && (
                            <div className="rounded-lg border border-gray-100 bg-white shadow-md overflow-hidden">
                                <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-50 bg-gray-50/60">
                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Recent searches</span>
                                    <button onClick={() => { saveHistory([]); setHistory([]); setShowHistory(false); }}
                                        className="text-[10px] text-gray-400 hover:text-red-500 transition-colors">Clear</button>
                                </div>
                                {history.map((h, i) => (
                                    <button key={i} onClick={() => handleSearch(h.query)}
                                        className="w-full flex items-center justify-between gap-3 px-3 py-2 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Clock size={10} className="text-gray-300 shrink-0" />
                                            <span className="text-[12px] text-gray-700 truncate">{h.query}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400 shrink-0">{h.count} results</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Error ── */}
                {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-700">{error}</div>
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
