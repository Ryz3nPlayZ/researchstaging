"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import type { Paper } from "@/lib/types";
import { projectApi, papersApi, literatureV2Api } from "@/lib/api";
import type { Project } from "@/lib/types";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  Cpu,
  ExternalLink,
  FileText,
  Filter,
  History,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  X,
  Zap,
  ArrowUpDown,
  AlertCircle,
  Layers,
  Database,
  CheckCircle2,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
interface RelevanceBreakdownV2 {
  semantic_alignment?: number;
  attribute_alignment?: number;
  methodological_match?: number;
  dataset_match?: number;
  citation_signal?: number;
  recency_score?: number;
  source_diversity_score?: number;
  feedback_boost?: number;
  final_score?: number;
}

interface PaperV2 extends Paper {
  relevance_breakdown?: RelevanceBreakdownV2;
  v2_enhanced?: boolean;
}

interface TimingBreakdown {
  intent_ms: number;
  search_ms: number;
  dedup_ms: number;
  rank_ms: number;
  enrich_ms: number;
  total_ms: number;
}

interface SearchV2Response {
  query: string;
  papers: PaperV2[];
  intent: Record<string, unknown>;
  total_found: number;
  from_cache: boolean;
  sources: string[];
  timing: TimingBreakdown;
}

// ── History helpers ──────────────────────────────────────────────────────────
const HISTORY_KEY = "research-lit-v2-history";
const MAX_HISTORY = 12;

interface HistoryEntry {
  query: string;
  timestamp: number;
  count: number;
}

function loadHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveHistory(h: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
}
function pushHistory(query: string, count: number) {
  const all = loadHistory().filter(
    (e) => e.query.toLowerCase() !== query.toLowerCase(),
  );
  all.unshift({ query, timestamp: Date.now(), count });
  saveHistory(all.slice(0, MAX_HISTORY));
}

// ── Source badge with diversity indicator ────────────────────────────────────
const SOURCE_STYLES: Record<string, { label: string; cls: string }> = {
  semantic_scholar: {
    label: "S2",
    cls: "bg-blue-50 text-blue-600 border-blue-100",
  },
  openalex: {
    label: "OA",
    cls: "bg-emerald-50 text-emerald-600 border-emerald-100",
  },
  arxiv: {
    label: "arXiv",
    cls: "bg-orange-50 text-orange-600 border-orange-100",
  },
  core: {
    label: "CORE",
    cls: "bg-violet-50 text-violet-600 border-violet-100",
  },
  springer: {
    label: "Springer",
    cls: "bg-rose-50 text-rose-600 border-rose-100",
  },
  google_scholar: {
    label: "Scholar",
    cls: "bg-purple-50 text-purple-600 border-purple-100",
  },
  crossref: {
    label: "Crossref",
    cls: "bg-cyan-50 text-cyan-600 border-cyan-100",
  },
};

function SourceBadge({ source }: { source: string }) {
  // Handle combined sources
  const sources = source.includes(" + ") ? source.split(" + ") : [source];
  const primary = sources[0].trim();
  const s = SOURCE_STYLES[primary] ?? {
    label: primary,
    cls: "bg-gray-50 text-gray-500 border-gray-200",
  };
  const multi = sources.length > 1;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-px rounded text-[10px] font-semibold border ${s.cls}`}
    >
      {s.label}
      {multi && (
        <span className="text-[8px] opacity-70">+{sources.length - 1}</span>
      )}
    </span>
  );
}

// ── Score bars (V2 with diversity) ───────────────────────────────────────────
const SCORE_FIELDS = [
  { key: "semantic_alignment", label: "Topic", color: "bg-blue-500" },
  { key: "citation_signal", label: "Cites", color: "bg-emerald-500" },
  { key: "recency_score", label: "Recency", color: "bg-amber-500" },
  { key: "source_diversity_score", label: "Sources", color: "bg-purple-500" },
  { key: "dataset_match", label: "Keywords", color: "bg-sky-500" },
  { key: "methodological_match", label: "Semantic", color: "bg-rose-400" },
] as const;

type RBKey = (typeof SCORE_FIELDS)[number]["key"];

function MiniScoreRow({ rb }: { rb: RelevanceBreakdownV2 | undefined }) {
  if (!rb) return null;
  const visible = SCORE_FIELDS.filter(
    (f) => rb[f.key as RBKey] != null && rb[f.key as RBKey]! > 0,
  );
  if (!visible.length) return null;
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
      {visible.map(({ key, label, color }) => {
        const pct = Math.round((rb[key as RBKey] as number) * 100);
        return (
          <div
            key={key}
            className="flex items-center gap-1"
            title={`${label}: ${pct}%`}
          >
            <span className="text-[9px] text-gray-400 w-[40px] shrink-0">
              {label}
            </span>
            <div className="w-[36px] h-1 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[9px] text-gray-500 w-[22px] text-right">
              {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Paper row with feedback ──────────────────────────────────────────────────
function PaperRow({
  paper,
  rank,
  onFeedback,
  onAddToProject,
  isAdding,
  isAdded,
  addDisabled,
  query,
}: {
  paper: PaperV2;
  rank: number;
  onFeedback: (paperId: string, relevant: boolean) => void;
  onAddToProject: () => void;
  isAdding: boolean;
  isAdded: boolean;
  addDisabled: boolean;
  query: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<"up" | "down" | null>(
    null,
  );
  const rb = paper.relevance_breakdown;
  const pdfUrl = paper.open_access_pdf_url ?? paper.pdf_url;
  const score = rb?.final_score ?? paper.final_score;
  const pct = score != null ? Math.round(score * 100) : null;
  const scoreCls =
    pct == null
      ? "text-gray-400 bg-gray-50"
      : pct >= 70
        ? "text-emerald-700 bg-emerald-50"
        : pct >= 50
          ? "text-blue-700 bg-blue-50"
          : "text-gray-500 bg-gray-50";

  const handleFeedback = (relevant: boolean) => {
    const paperId = paper.external_id || paper.doi || paper.title;
    onFeedback(paperId, relevant);
    setFeedbackGiven(relevant ? "up" : "down");
  };

  return (
    <div
      className={`group border-b border-gray-50 last:border-0 transition-colors ${expanded ? "bg-gray-50/60" : "hover:bg-gray-50/40"}`}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        {/* rank + score */}
        <div className="flex flex-col items-center gap-0.5 pt-0.5 shrink-0 w-9">
          <span className="text-[10px] text-gray-300 font-mono leading-none">
            #{rank}
          </span>
          {pct != null && (
            <span
              className={`text-[10px] font-bold rounded px-1 py-px leading-none ${scoreCls}`}
            >
              {pct}%
            </span>
          )}
        </div>
        {/* body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
            <SourceBadge source={paper.source} />
            {paper.year && (
              <span className="text-[10px] text-gray-400">{paper.year}</span>
            )}
            {paper.citation_count != null && paper.citation_count > 0 && (
              <span className="text-[10px] text-gray-400">
                {paper.citation_count.toLocaleString()} cites
              </span>
            )}
            {paper.v2_enhanced && (
              <span className="text-[9px] px-1 py-px bg-indigo-50 text-indigo-600 rounded border border-indigo-100">
                V2
              </span>
            )}
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-left w-full group/t"
          >
            <h3 className="text-[13px] font-medium text-gray-900 leading-snug group-hover/t:text-blue-700 transition-colors line-clamp-2">
              {paper.title}
            </h3>
          </button>
          {paper.authors && paper.authors.length > 0 && (
            <p className="text-[11px] text-gray-500 mt-0.5 truncate">
              {paper.authors.slice(0, 3).join(", ")}
              {paper.authors.length > 3 ? ` +${paper.authors.length - 3}` : ""}
            </p>
          )}
          <MiniScoreRow rb={rb} />
          {expanded && (
            <div className="mt-2 space-y-2">
              {paper.abstract && (
                <p className="text-[12px] text-gray-600 leading-relaxed">
                  {paper.abstract}
                </p>
              )}
              <div className="flex items-center gap-3">
                {paper.url && (
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <ExternalLink size={10} /> Source
                  </a>
                )}
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    <FileText size={10} /> PDF
                  </a>
                )}
                {paper.doi && (
                  <span className="text-[10px] text-gray-400 font-mono">
                    DOI: {paper.doi.slice(0, 20)}...
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
        {/* actions */}
        <div className="shrink-0 self-start mt-0.5 flex flex-col gap-1.5">
          {/* Feedback buttons */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => handleFeedback(true)}
              disabled={feedbackGiven !== null}
              className={`p-1 rounded transition-colors ${feedbackGiven === "up" ? "text-emerald-600 bg-emerald-50" : "text-gray-300 hover:text-emerald-600 hover:bg-emerald-50"}`}
              title="Relevant result"
            >
              <ThumbsUp size={12} />
            </button>
            <button
              onClick={() => handleFeedback(false)}
              disabled={feedbackGiven !== null}
              className={`p-1 rounded transition-colors ${feedbackGiven === "down" ? "text-rose-600 bg-rose-50" : "text-gray-300 hover:text-rose-600 hover:bg-rose-50"}`}
              title="Not relevant"
            >
              <ThumbsDown size={12} />
            </button>
          </div>
          {/* Add button */}
          <button
            onClick={onAddToProject}
            disabled={addDisabled || isAdding || isAdded}
            className={`px-2 py-1 rounded text-[10px] font-medium border transition-colors ${
              isAdded
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900 disabled:opacity-40"
            }`}
          >
            {isAdding ? "Adding..." : isAdded ? "Added" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Intent strip ─────────────────────────────────────────────────────────────
function IntentStrip({ response }: { response: SearchV2Response }) {
  const [showKw, setShowKw] = useState(false);
  const intent = response.intent as Record<string, unknown>;
  const terms = (intent.expanded_query_terms as string[] | null) ?? [];
  const coreTopic = intent.core_topic as string | undefined;
  const yearMin = intent.year_min as number | undefined;
  const { total_ms, search_ms, rank_ms, dedup_ms } = response.timing;

  return (
    <div className="border-b border-gray-100 px-4 py-2 bg-gradient-to-r from-indigo-50/50 to-purple-50/30">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <Cpu size={11} className="text-indigo-400 shrink-0" />
          <span className="text-[11px] text-gray-600 truncate">
            {coreTopic ? (
              <>
                <span className="text-gray-400">Interpreted as </span>
                <b className="text-gray-800">{coreTopic}</b>
              </>
            ) : (
              <b className="text-gray-700">{response.query}</b>
            )}
          </span>
          {yearMin && (
            <span className="text-[10px] px-1.5 py-px bg-amber-50 text-amber-600 rounded font-medium border border-amber-100">
              {yearMin}+
            </span>
          )}
          {response.from_cache && (
            <span className="text-[10px] px-1.5 py-px bg-green-50 text-green-600 rounded font-medium border border-green-100">
              cached
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[10px] text-gray-400">
          <span>
            <Clock size={9} className="inline mb-px" />{" "}
            {(total_ms / 1000).toFixed(2)}s
          </span>
          <span title="Search / Dedup / Rank">
            {search_ms}ms · {dedup_ms}ms · {rank_ms}ms
          </span>
          <span>
            <Layers size={9} className="inline mb-px" />{" "}
            {response.sources.length} sources
          </span>
          <span>
            <TrendingUp size={9} className="inline mb-px" />{" "}
            {response.papers.length}/{response.total_found}
          </span>
          {terms.length > 0 && (
            <button
              onClick={() => setShowKw(!showKw)}
              className="inline-flex items-center gap-1 text-[10px] text-indigo-500 hover:text-indigo-700 font-medium border border-indigo-100 bg-indigo-50/50 rounded px-1.5 py-px transition-colors"
            >
              <Zap size={9} /> {terms.length} AI terms{" "}
              {showKw ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
            </button>
          )}
        </div>
      </div>
      {showKw && terms.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {terms.map((t, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-md bg-white border border-indigo-100 text-[10px] text-indigo-700 font-medium"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Source filter ────────────────────────────────────────────────────────────
function SourceFilter({
  selected,
  onChange,
  available,
}: {
  selected: Set<string>;
  onChange: (s: Set<string>) => void;
  available: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {available.map((source) => (
        <label
          key={source}
          className="inline-flex items-center gap-1.5 text-[11px] cursor-pointer"
        >
          <input
            type="checkbox"
            checked={selected.has(source)}
            onChange={(e) => {
              const next = new Set(selected);
              if (e.target.checked) next.add(source);
              else next.delete(source);
              onChange(next);
            }}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="capitalize">{source.replace(/_/g, " ")}</span>
        </label>
      ))}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
type SortKey = "relevance" | "citations" | "year" | "recency";

export default function LiteratureV2Page() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<SearchV2Response | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("relevance");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [targetProjectId, setTargetProjectId] = useState("");
  const [addingPaperIds, setAddingPaperIds] = useState<Set<string>>(new Set());
  const [addedPaperIds, setAddedPaperIds] = useState<Set<string>>(new Set());

  // Source filters
  const [includeScholar, setIncludeScholar] = useState(true);
  const [includeCrossref, setIncludeCrossref] = useState(true);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    projectApi.list().then((res) => {
      if (!res.data) return;
      setProjects(res.data);
      if (!targetProjectId && res.data.length > 0) {
        setTargetProjectId(res.data[0].id);
      }
    });
  }, [targetProjectId]);

  const getPaperId = (p: PaperV2, i: number) =>
    p.id || p.external_id || `${p.source}-${i}`;

  const sorted = useMemo(() => {
    if (!result?.papers) return [];
    const copy = [...result.papers];
    switch (sortKey) {
      case "citations":
        return copy.sort(
          (a, b) => (b.citation_count ?? 0) - (a.citation_count ?? 0),
        );
      case "year":
        return copy.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
      case "recency":
        return copy.sort(
          (a, b) =>
            (b.relevance_breakdown?.recency_score ?? 0) -
            (a.relevance_breakdown?.recency_score ?? 0),
        );
      default:
        return copy;
    }
  }, [result, sortKey]);

  const handleSearch = useCallback(
    async (q?: string) => {
      const query_ = (q ?? query).trim();
      if (!query_ || searching) return;
      if (q) setQuery(q);

      setSearching(true);
      setError(null);
      setResult(null);
      setAddedPaperIds(new Set());

      try {
        const res = await literatureV2Api.search(query_, {
          includeScholar,
          includeCrossref,
        });

        if (res.error) {
          throw new Error(res.error);
        }

        if (res.data) {
          setResult(res.data);
          if (res.data.papers.length > 0) {
            pushHistory(query_, res.data.papers.length);
            setHistory(loadHistory());
          }
        }
      } catch (err) {
        setError((err as Error).message || "Search failed");
      } finally {
        setSearching(false);
      }
    },
    [query, searching, includeScholar, includeCrossref],
  );

  const handleFeedback = async (paperId: string, relevant: boolean) => {
    try {
      await literatureV2Api.submitFeedback(
        paperId,
        result?.query || "",
        relevant,
      );
    } catch (e) {
      console.error("Feedback failed:", e);
    }
  };

  const addPaperToProject = async (paper: PaperV2, id: string) => {
    if (!targetProjectId) {
      setError("Select a project first.");
      return;
    }
    setAddingPaperIds((prev) => new Set(prev).add(id));
    try {
      const res = await papersApi.add(targetProjectId, paper);
      if (res.data) {
        setAddedPaperIds((prev) => new Set(prev).add(id));
      }
    } catch {
      setError("Failed to add paper to project.");
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
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Literature Search V2
            </h1>
            <p className="text-xs text-gray-500">
              Enhanced with Google Scholar, Crossref, and user feedback
            </p>
          </div>
          <Link
            href="/literature"
            className="text-[11px] text-gray-500 hover:text-gray-900 underline"
          >
            Back to V1 →
          </Link>
        </div>

        {/* ── Search card ── */}
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50 bg-gradient-to-r from-indigo-50/30 to-purple-50/20">
            <BookOpen size={14} className="text-indigo-500" />
            <span className="text-[13px] font-semibold text-gray-800">
              Literature Explorer V2
            </span>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[10px] text-gray-400">Sources:</span>
              <label className="inline-flex items-center gap-1 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeScholar}
                  onChange={(e) => setIncludeScholar(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600"
                />
                <span>Scholar</span>
              </label>
              <label className="inline-flex items-center gap-1 text-[11px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCrossref}
                  onChange={(e) => setIncludeCrossref(e.target.checked)}
                  className="rounded border-gray-300 text-cyan-600"
                />
                <span>Crossref</span>
              </label>
            </div>
          </div>

          <div className="px-4 py-3 space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-gray-500 font-medium">
                Add papers to
              </label>
              <select
                value={targetProjectId}
                onChange={(e) => setTargetProjectId(e.target.value)}
                className="text-[12px] border border-gray-200 rounded-md px-2 py-1 bg-white min-w-[220px]"
              >
                {projects.length === 0 && <option value="">No projects</option>}
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.research_goal.slice(0, 50)}
                    {p.research_goal.length > 50 ? "..." : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 focus-within:border-indigo-200 focus-within:bg-white transition-colors">
                <Search size={13} className="text-gray-400 shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Describe your research topic — AI expands and searches 7 sources"
                  className="flex-1 bg-transparent text-[13px] text-gray-900 placeholder:text-gray-400 focus:outline-none min-w-0"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="text-gray-300 hover:text-gray-500 transition-colors"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
              <button
                onClick={() => handleSearch()}
                disabled={searching || !query.trim()}
                className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-700 disabled:opacity-40 text-white px-4 py-2 rounded-lg text-[12px] font-medium transition-colors shrink-0"
              >
                {searching ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Search size={12} />
                )}
                Search
              </button>
            </div>

            {/* Recent searches */}
            {history.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock size={9} /> Recent searches ({history.length})
                  </span>
                  <button
                    onClick={() => {
                      saveHistory([]);
                      setHistory([]);
                    }}
                    className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {history.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => handleSearch(h.query)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-lg text-[11px] text-gray-600 hover:text-indigo-700 transition-all group"
                    >
                      <span className="max-w-[200px] truncate font-medium">
                        {h.query}
                      </span>
                      <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 rounded-full group-hover:bg-indigo-100 group-hover:text-indigo-600">
                        {h.count}
                      </span>
                    </button>
                  ))}
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

        {/* ── Results card ── */}
        {(searching || result) && (
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 bg-gray-50/40">
              <span className="text-[12px] font-semibold text-gray-700">
                {searching ? "Searching…" : `${sorted.length} results`}
              </span>
              {result && (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Database size={9} />
                    {result.sources.join(", ")}
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowUpDown size={10} className="text-gray-400" />
                    <select
                      value={sortKey}
                      onChange={(e) => setSortKey(e.target.value as SortKey)}
                      className="text-[11px] text-gray-600 bg-transparent border-0 focus:outline-none cursor-pointer font-medium appearance-none"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="citations">Most cited</option>
                      <option value="year">Newest</option>
                      <option value="recency">Recency score</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Intent strip */}
            {result && !searching && <IntentStrip response={result} />}

            {/* Loading skeletons */}
            {searching && (
              <div className="p-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex gap-3 px-4 py-3 animate-pulse border-b border-gray-50 last:border-0"
                  >
                    <div className="w-9 space-y-1">
                      <div className="h-3 w-5 bg-gray-100 rounded" />
                      <div className="h-4 w-7 bg-gray-100 rounded" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-1/4 bg-gray-100 rounded" />
                      <div className="h-4 w-3/4 bg-gray-200 rounded" />
                      <div className="h-3 w-1/2 bg-gray-100 rounded" />
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
                      query={result?.query || ""}
                      onFeedback={handleFeedback}
                      onAddToProject={() => void addPaperToProject(paper, id)}
                      isAdding={addingPaperIds.has(id)}
                      isAdded={addedPaperIds.has(id)}
                      addDisabled={!targetProjectId}
                    />
                  );
                })}
              </div>
            )}

            {!searching && result && sorted.length === 0 && (
              <div className="p-12 text-center">
                <Search size={20} className="text-gray-200 mx-auto mb-3" />
                <p className="text-[13px] font-medium text-gray-600">
                  No results found
                </p>
                <p className="text-[12px] text-gray-400 mt-1">
                  Try enabling more sources or broadening your query
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Empty state ── */}
        {!searching && !result && !error && (
          <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-12 text-center">
            <BookOpen size={28} className="text-indigo-200 mx-auto mb-3" />
            <p className="text-[14px] font-semibold text-gray-700">
              Search academic literature (V2)
            </p>
            <p className="text-[12px] text-gray-400 mt-1.5 max-w-sm mx-auto">
              Enhanced search across 7 sources including Google Scholar and
              Crossref with user feedback learning
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {[
                "semantic_scholar",
                "arxiv",
                "openalex",
                "google_scholar",
                "crossref",
                "core",
                "springer",
              ].map((s) => (
                <SourceBadge key={s} source={s} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
