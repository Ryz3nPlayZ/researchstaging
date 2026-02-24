'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Paper } from '@/lib/types';
import type { LiteratureV2Response } from '@/lib/api';
import {
    Search, Loader2, Plus, CheckCircle, ExternalLink, FileText,
    Sparkles, BookOpen, ChevronDown, ChevronRight,
    Clock, Cpu, X, History, Database,
    ArrowUpDown, Filter, Zap
} from 'lucide-react';
import { SynthesisWizard } from '@/components/literature/synthesis-wizard';

// ── Local history ──────────────────────────────────────────────────────────── //
const HISTORY_KEY = 'research-lit-history';
const MAX_HISTORY = 12;

interface HistoryEntry { query: string; timestamp: number; count: number }

function loadHistory(): HistoryEntry[] {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
    catch { return []; }
}
function saveHistory(entries: HistoryEntry[]) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}
function pushHistory(query: string, count: number) {
    const all = loadHistory().filter(e => e.query.toLowerCase() !== query.toLowerCase());
    all.unshift({ query, timestamp: Date.now(), count });
    saveHistory(all.slice(0, MAX_HISTORY));
}

// ── Mini score row ─────────────────────────────────────────────────────────── //
const SCORE_FIELDS: { key: keyof NonNullable<Paper['relevance_breakdown']>; label: string; color: string }[] = [
    { key: 'semantic_alignment', label: 'Topic', color: 'bg-blue-500' },
    { key: 'citation_signal', label: 'Cites', color: 'bg-emerald-500' },
    { key: 'recency_score', label: 'Recency', color: 'bg-amber-500' },
    { key: 'attribute_alignment', label: 'Attrs', color: 'bg-violet-500' },
    { key: 'dataset_match', label: 'Keywords', color: 'bg-sky-500' },
    { key: 'methodological_match', label: 'Semantic', color: 'bg-rose-400' },
];

function MiniScoreRow({ rb }: { rb: Paper['relevance_breakdown'] }) {
    if (!rb) return null;
    const hasAny = SCORE_FIELDS.some(f => rb[f.key] != null);
    if (!hasAny) return null;
    return (
        <div className="flex items-center gap-2 flex-wrap">
            {SCORE_FIELDS.map(({ key, label, color }) => {
                const v = rb[key];
                if (v == null) return null;
                const pct = Math.round((v as number) * 100);
                return (
                    <div key={key} className="flex items-center gap-1" title={`${label}: ${pct}%`}>
                        <span className="text-[9px] text-gray-400 font-medium w-[40px] shrink-0">{label}</span>
                        <div className="w-[40px] h-1 rounded-full bg-gray-100 overflow-hidden">
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
    semantic_scholar: { label: 'S2', cls: 'bg-blue-50 text-blue-600' },
    openalex: { label: 'OA', cls: 'bg-emerald-50 text-emerald-600' },
    arxiv: { label: 'arXiv', cls: 'bg-orange-50 text-orange-600' },
    core: { label: 'CORE', cls: 'bg-violet-50 text-violet-600' },
    springer: { label: 'Springer', cls: 'bg-rose-50 text-rose-600' },
};
function SourceBadge({ source }: { source: string }) {
    const s = SOURCE_STYLES[source] ?? { label: source, cls: 'bg-gray-50 text-gray-500' };
    return <span className={`inline-flex items-center px-1.5 py-px rounded text-[10px] font-semibold ${s.cls}`}>{s.label}</span>;
}

// ── Paper row (dense list) ─────────────────────────────────────────────────── //
function PaperRow({ paper, isAdded, onAdd, rank }: { paper: Paper; isAdded: boolean; onAdd: () => void; rank: number }) {
    const [expanded, setExpanded] = useState(false);
    const rb = paper.relevance_breakdown;
    const pdfUrl = paper.open_access_pdf_url ?? paper.pdf_url;
    const score = rb?.final_score ?? paper.final_score;
    const pct = score != null ? Math.round(score * 100) : null;
    const scoreCls = pct == null ? 'text-gray-400 bg-gray-50' : pct >= 60
        ? 'text-emerald-700 bg-emerald-50'
        : pct >= 45 ? 'text-blue-700 bg-blue-50'
            : 'text-gray-500 bg-gray-50';

    return (
        <div className={`group border-b border-gray-50 last:border-0 transition-colors ${expanded ? 'bg-gray-50/60' : 'hover:bg-gray-50/40'}`}>
            <div className="flex items-start gap-3 px-4 py-3">
                {/* Rank + score */}
                <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0 w-[36px]">
                    <span className="text-[10px] text-gray-300 font-mono leading-none">#{rank}</span>
                    {pct != null && (
                        <span className={`text-[10px] font-bold rounded px-1 py-px leading-none ${scoreCls}`}>{pct}%</span>
                    )}
                </div>
                {/* Main content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <SourceBadge source={paper.source} />
                        {paper.year && <span className="text-[10px] text-gray-400">{paper.year}</span>}
                        {paper.citation_count != null && paper.citation_count > 0 && (
                            <span className="text-[10px] text-gray-400">{paper.citation_count.toLocaleString()} cites</span>
                        )}
                    </div>
                    <button onClick={() => setExpanded(!expanded)} className="text-left w-full group/title">
                        <h4 className="text-[13px] font-medium text-gray-900 leading-snug group-hover/title:text-blue-700 transition-colors line-clamp-2">
                            {paper.title}
                        </h4>
                    </button>
                    {paper.authors && paper.authors.length > 0 && (
                        <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                            {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 ? ` +${paper.authors.length - 3}` : ''}
                        </p>
                    )}
                    {rb && <div className="mt-1.5"><MiniScoreRow rb={rb} /></div>}
                    {expanded && (
                        <div className="mt-2 space-y-2">
                            {paper.abstract && (
                                <p className="text-[12px] text-gray-600 leading-relaxed">{paper.abstract}</p>
                            )}
                            <div className="flex items-center gap-3">
                                {paper.url && (
                                    <a href={paper.url} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
                                        <ExternalLink size={10} /> Source
                                    </a>
                                )}
                                {pdfUrl && (
                                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors">
                                        <FileText size={10} /> PDF
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                {/* Add button */}
                <button onClick={onAdd} disabled={isAdded} className="shrink-0 self-start mt-0.5">
                    {isAdded
                        ? <CheckCircle size={15} className="text-emerald-500" />
                        : <Plus size={15} className="text-gray-300 group-hover:text-gray-700 transition-colors" />
                    }
                </button>
            </div>
        </div>
    );
}

// ── Intent strip ───────────────────────────────────────────────────────────── //
function IntentStrip({ response }: { response: LiteratureV2Response }) {
    const [showKeywords, setShowKeywords] = useState(false);
    const intent = response.intent as Record<string, unknown>;
    const terms = (intent.expanded_query_terms as string[] | null) ?? [];
    const coreTopic = intent.core_topic as string | undefined;
    const yearMin = intent.year_min as number | undefined;
    const { total_ms, retrieval_ms, scoring_ms } = response.timing;
    const hasDegrades = response.degrade.cross_encoder_top_k_only
        || response.degrade.reduced_candidate_pool
        || response.degrade.skipped_citation_expansion;
    const filterDropTotal = Object.values(response.filter_drops).reduce((a, b) => a + b, 0);

    return (
        <div className="border-b border-gray-100 px-4 py-2 bg-gray-50/60">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                    <Cpu size={11} className="text-gray-400 shrink-0" />
                    <span className="text-[11px] text-gray-600 truncate">
                        {coreTopic
                            ? <><span className="text-gray-400">Interpreted as </span><b className="text-gray-800">{coreTopic}</b></>
                            : <b className="text-gray-700">{response.query}</b>
                        }
                    </span>
                    {yearMin && (
                        <span className="text-[10px] px-1.5 py-px bg-amber-50 text-amber-600 rounded font-medium border border-amber-100">
                            {yearMin}+
                        </span>
                    )}
                    {hasDegrades && (
                        <span className="text-[10px] px-1.5 py-px bg-orange-50 text-orange-600 rounded font-medium border border-orange-100"
                            title="Some quality features were degraded for performance">degraded</span>
                    )}
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[10px] text-gray-400">
                    <span title="Total time"><Clock size={9} className="inline mb-px" /> {(total_ms / 1000).toFixed(2)}s</span>
                    <span title="Retrieve / Score">{retrieval_ms}ms · {scoring_ms}ms</span>
                    {filterDropTotal > 0 && (
                        <span title="Papers filtered out"><Filter size={9} className="inline mb-px" /> {filterDropTotal} filtered</span>
                    )}
                    {terms.length > 0 && (
                        <button onClick={() => setShowKeywords(!showKeywords)}
                            className="inline-flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-700 font-medium transition-colors border border-blue-100 bg-blue-50 rounded px-1.5 py-px">
                            <Zap size={9} /> {terms.length} AI keywords {showKeywords ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
                        </button>
                    )}
                </div>
            </div>
            {showKeywords && terms.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                    {terms.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-blue-100 text-[10px] text-blue-700 font-medium hover:bg-blue-50 transition-colors">
                            {t}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Sort control ───────────────────────────────────────────────────────────── //
type SortKey = 'rank' | 'year' | 'citations' | 'recency';
function SortControl({ value, onChange }: { value: SortKey; onChange: (k: SortKey) => void }) {
    const opts: { k: SortKey; label: string }[] = [
        { k: 'rank', label: 'Relevance' },
        { k: 'year', label: 'Newest first' },
        { k: 'citations', label: 'Most cited' },
        { k: 'recency', label: 'Recency score' },
    ];
    return (
        <div className="flex items-center gap-1">
            <ArrowUpDown size={10} className="text-gray-400" />
            <select value={value} onChange={e => onChange(e.target.value as SortKey)}
                className="text-[11px] text-gray-600 bg-transparent border-0 focus:outline-none cursor-pointer font-medium appearance-none pr-1">
                {opts.map(o => <option key={o.k} value={o.k}>{o.label}</option>)}
            </select>
        </div>
    );
}

// ── Main component ─────────────────────────────────────────────────────────── //
interface LiteratureTabProps {
    litQuery: string;
    setLitQuery: (query: string) => void;
    litSearching: boolean;
    handleLitSearch: () => void;
    litResults: Paper[];
    litV2Response: LiteratureV2Response | null;
    projectPapers: Paper[];
    onAddPaper: (paper: Paper) => void;
    synthesisOpen: boolean;
    setSynthesisOpen: (open: boolean) => void;
    projectId: string;
}

type TabId = 'results' | 'library';

export function LiteratureTab({
    litQuery, setLitQuery, litSearching, handleLitSearch,
    litResults, litV2Response,
    projectPapers, onAddPaper, synthesisOpen, setSynthesisOpen, projectId,
}: LiteratureTabProps) {
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [activeTab, setActiveTab] = useState<TabId>('results');
    const [showHistory, setShowHistory] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>('rank');

    useEffect(() => { setHistory(loadHistory()); }, []);

    useEffect(() => {
        if (litV2Response?.query && litV2Response.returned_count > 0) {
            pushHistory(litV2Response.query, litV2Response.returned_count);
            setHistory(loadHistory());
            setActiveTab('results');
        }
    }, [litV2Response]);

    const sortedResults = useMemo(() => {
        if (!litResults.length) return litResults;
        const copy = [...litResults];
        switch (sortKey) {
            case 'year': return copy.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
            case 'citations': return copy.sort((a, b) => (b.citation_count ?? 0) - (a.citation_count ?? 0));
            case 'recency': return copy.sort((a, b) =>
                ((b.relevance_breakdown?.recency_score ?? 0) as number) -
                ((a.relevance_breakdown?.recency_score ?? 0) as number));
            default: return copy;
        }
    }, [litResults, sortKey]);

    const onHistoryClick = useCallback((q: string) => {
        setLitQuery(q);
        setShowHistory(false);
    }, [setLitQuery]);

    const tabs: { id: TabId; label: string; count?: number }[] = [
        { id: 'results', label: 'Results', count: litResults.length > 0 ? litResults.length : undefined },
        { id: 'library', label: 'Library', count: projectPapers.length },
    ];

    return (
        <div className="flex flex-col rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">

            {/* ── Search bar ── */}
            <div className="px-4 pt-3 pb-2 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 focus-within:border-blue-200 focus-within:bg-white transition-colors">
                        <Search size={13} className="text-gray-400 shrink-0" />
                        <input
                            type="text"
                            value={litQuery}
                            onChange={e => setLitQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && !litSearching && litQuery.trim() && handleLitSearch()}
                            placeholder="Describe your research topic — AI expands into ranked keywords"
                            className="flex-1 bg-transparent text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none min-w-0"
                        />
                        {litQuery && (
                            <button onClick={() => setLitQuery('')} className="text-gray-300 hover:text-gray-500 transition-colors">
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
                    <button onClick={handleLitSearch} disabled={litSearching || !litQuery.trim()}
                        className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-[12px] font-medium transition-colors shrink-0">
                        {litSearching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
                        Search
                    </button>
                </div>

                {showHistory && history.length > 0 && (
                    <div className="mt-2 rounded-lg border border-gray-100 bg-white shadow-md overflow-hidden z-10 relative">
                        <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-50 bg-gray-50/60">
                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Search history</span>
                            <button onClick={() => { saveHistory([]); setHistory([]); setShowHistory(false); }}
                                className="text-[10px] text-gray-400 hover:text-red-500 transition-colors">Clear</button>
                        </div>
                        {history.map((h, i) => (
                            <button key={i} onClick={() => onHistoryClick(h.query)}
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

            {/* ── Tab bar ── */}
            <div className="flex items-center gap-0 border-b border-gray-100 bg-gray-50/40 px-2">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 transition-colors ${activeTab === tab.id
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-400 hover:text-gray-700'
                            }`}>
                        {tab.label}
                        {tab.count != null && (
                            <span className={`px-1.5 py-px rounded-md text-[10px] font-semibold ${activeTab === tab.id ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-500'
                                }`}>{tab.count}</span>
                        )}
                    </button>
                ))}
                <div className="ml-auto flex items-center gap-2 pr-1">
                    {activeTab === 'results' && litResults.length > 0 && (
                        <SortControl value={sortKey} onChange={setSortKey} />
                    )}
                    {activeTab === 'library' && projectPapers.length > 0 && (
                        <button onClick={() => setSynthesisOpen(true)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-md transition-colors border border-purple-100">
                            <Sparkles size={11} /> Synthesize
                        </button>
                    )}
                </div>
            </div>

            {/* ── Results tab ── */}
            {activeTab === 'results' && (
                <>
                    {litSearching && (
                        <div className="p-2 space-y-px">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex items-start gap-3 px-4 py-3 animate-pulse">
                                    <div className="w-8 space-y-1"><div className="h-3 w-5 bg-gray-100 rounded" /><div className="h-4 w-7 bg-gray-100 rounded" /></div>
                                    <div className="flex-1 space-y-1.5">
                                        <div className="h-3 w-1/4 bg-gray-100 rounded" />
                                        <div className="h-4 w-3/4 bg-gray-200 rounded" />
                                        <div className="h-3 w-1/2 bg-gray-100 rounded" />
                                        <div className="flex gap-2 pt-1">{[1, 2, 3, 4, 5, 6].map(j => <div key={j} className="h-1 w-[103px] bg-gray-100 rounded" />)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {!litSearching && litV2Response && (
                        <>
                            <IntentStrip response={litV2Response} />
                            {sortedResults.length > 0 ? (
                                <div className="max-h-[calc(100vh-340px)] overflow-y-auto">
                                    {sortedResults.map((paper, idx) => (
                                        <PaperRow
                                            key={paper.external_id ?? paper.id ?? idx}
                                            paper={paper}
                                            rank={idx + 1}
                                            isAdded={projectPapers.some(p => p.title === paper.title)}
                                            onAdd={() => onAddPaper(paper)}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <Search size={20} className="text-gray-200 mx-auto mb-3" />
                                    <p className="text-[13px] font-medium text-gray-600">No results found</p>
                                    <p className="text-[12px] text-gray-400 mt-1">Try broadening your query</p>
                                </div>
                            )}
                        </>
                    )}
                    {!litSearching && !litV2Response && (
                        <div className="p-12 text-center">
                            <BookOpen size={24} className="text-gray-200 mx-auto mb-3" />
                            <p className="text-[13px] font-medium text-gray-600">Search academic literature</p>
                            <p className="text-[12px] text-gray-400 mt-1 max-w-xs mx-auto">
                                AI expands your topic into targeted keywords and ranks results by relevance
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* ── Library tab ── */}
            {activeTab === 'library' && (
                <>
                    {projectPapers.length > 0 ? (
                        <div className="divide-y divide-gray-50 max-h-[calc(100vh-340px)] overflow-y-auto">
                            {projectPapers.map((paper, idx) => (
                                <div key={paper.id || idx} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/40 transition-colors group">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 shrink-0 mt-0.5">
                                        <span className="text-[9px] font-bold text-gray-500">{idx + 1}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[12px] font-medium text-gray-900 leading-snug line-clamp-2">{paper.title}</h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <SourceBadge source={paper.source} />
                                            {paper.authors?.[0] && (
                                                <span className="text-[11px] text-gray-400 truncate max-w-[140px]">{paper.authors[0]}</span>
                                            )}
                                            {paper.year && <span className="text-[11px] text-gray-400">· {paper.year}</span>}
                                        </div>
                                    </div>
                                    {paper.url && (
                                        <a href={paper.url} target="_blank" rel="noopener noreferrer"
                                            className="p-1 text-gray-200 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-all rounded mt-0.5">
                                            <ExternalLink size={12} />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <Database size={20} className="text-gray-200 mx-auto mb-3" />
                            <p className="text-[13px] font-medium text-gray-600">Library is empty</p>
                            <p className="text-[12px] text-gray-400 mt-1">Search and click + to add papers</p>
                        </div>
                    )}
                </>
            )}

            <SynthesisWizard isOpen={synthesisOpen} onClose={() => setSynthesisOpen(false)} projectId={projectId} papers={projectPapers} />
        </div>
    );
}
