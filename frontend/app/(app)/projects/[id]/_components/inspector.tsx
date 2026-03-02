'use client';

import type { InspectorContent } from '../_context/project-context';
import { useProject } from '../_context/project-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    X,
    BookOpen,
    ExternalLink,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    Loader2,
    AlertTriangle,
    Layers,
    Quote,
} from 'lucide-react';
import { relativeTime } from '@/lib/types';
import ReactMarkdown from 'react-markdown';

// ─── Paper Inspector ─────────────────────────────────────────────

function PaperInspector({ data }: { data: Record<string, unknown> }) {
    const paper = data as {
        title?: string;
        authors?: string[];
        abstract?: string;
        year?: number;
        citation_count?: number;
        url?: string;
        pdf_url?: string;
        doi?: string;
        source?: string;
        summary?: string;
        final_score?: number;
        relevance_breakdown?: Record<string, number>;
    };

    return (
        <div className="space-y-4">
            {/* Title & meta */}
            <div>
                <h3 className="text-sm font-semibold text-foreground leading-snug">
                    {paper.title ?? 'Untitled'}
                </h3>
                {paper.authors && paper.authors.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                        {paper.authors.slice(0, 5).join(', ')}
                        {paper.authors.length > 5 && ` +${paper.authors.length - 5}`}
                    </p>
                )}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {paper.year && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {paper.year}
                        </Badge>
                    )}
                    {paper.citation_count !== undefined && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {paper.citation_count} cited
                        </Badge>
                    )}
                    {paper.source && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {paper.source}
                        </Badge>
                    )}
                    {paper.final_score !== undefined && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Score: {(paper.final_score * 100).toFixed(0)}%
                        </Badge>
                    )}
                </div>
            </div>

            <Separator />

            {/* Abstract */}
            {paper.abstract && (
                <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Abstract
                    </h4>
                    <p className="text-xs text-foreground/80 leading-relaxed">
                        {paper.abstract}
                    </p>
                </div>
            )}

            {/* Summary */}
            {paper.summary && (
                <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        AI Summary
                    </h4>
                    <div className="text-xs text-foreground/80 leading-relaxed prose prose-sm max-w-none">
                        <ReactMarkdown>{paper.summary}</ReactMarkdown>
                    </div>
                </div>
            )}

            {/* Relevance breakdown */}
            {paper.relevance_breakdown && Object.keys(paper.relevance_breakdown).length > 0 && (
                <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                        Relevance Scores
                    </h4>
                    <div className="space-y-1">
                        {Object.entries(paper.relevance_breakdown).map(([key, val]) => (
                            <div key={key} className="flex items-center justify-between text-[11px]">
                                <span className="text-muted-foreground capitalize">
                                    {key.replace(/_/g, ' ')}
                                </span>
                                <span className="font-mono tabular-nums text-foreground/80">
                                    {typeof val === 'number' ? (val * 100).toFixed(0) + '%' : String(val)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Links */}
            <div className="flex flex-col gap-1.5">
                {paper.url && (
                    <a
                        href={paper.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        <ExternalLink size={11} /> View paper
                    </a>
                )}
                {paper.pdf_url && (
                    <a
                        href={paper.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        <FileText size={11} /> Download PDF
                    </a>
                )}
                {paper.doi && (
                    <a
                        href={`https://doi.org/${paper.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        <ExternalLink size={11} /> DOI: {paper.doi}
                    </a>
                )}
            </div>
        </div>
    );
}

// ─── Task Inspector ──────────────────────────────────────────────

function TaskInspector({ data }: { data: Record<string, unknown> }) {
    const task = data as {
        id?: string;
        name?: string;
        description?: string;
        task_type?: string;
        state?: string;
        phase_index?: number;
        retry_count?: number;
        max_retries?: number;
        error_message?: string;
        created_at?: string;
        started_at?: string;
        completed_at?: string;
        output_artifact_id?: string;
    };

    const { openInspector, artifacts } = useProject();

    const stateColor: Record<string, string> = {
        completed: 'text-emerald-500',
        failed: 'text-red-500',
        running: 'text-blue-500',
        ready: 'text-amber-500',
        pending: 'text-muted-foreground',
    };

    const StateIcon = task.state === 'completed' ? CheckCircle2
        : task.state === 'failed' ? XCircle
            : task.state === 'running' ? Loader2
                : Clock;

    // Find the output artifact for this task
    const outputArtifact = task.output_artifact_id
        ? artifacts.find((a) => a.id === task.output_artifact_id)
        : undefined;

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-semibold text-foreground">
                    {task.name ?? 'Task'}
                </h3>
                {task.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                )}
            </div>

            <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 text-xs font-medium ${stateColor[task.state ?? ''] ?? ''}`}>
                    <StateIcon size={13} className={task.state === 'running' ? 'animate-spin' : ''} />
                    <span className="capitalize">{task.state}</span>
                </div>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {task.task_type?.replace(/_/g, ' ')}
                </Badge>
            </div>

            <Separator />

            {/* Metadata */}
            <div className="space-y-1.5 text-[11px]">
                {task.created_at && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Created</span>
                        <span className="text-foreground/80">{relativeTime(task.created_at)}</span>
                    </div>
                )}
                {task.started_at && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Started</span>
                        <span className="text-foreground/80">{relativeTime(task.started_at)}</span>
                    </div>
                )}
                {task.completed_at && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Completed</span>
                        <span className="text-foreground/80">{relativeTime(task.completed_at)}</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Retries</span>
                    <span className="text-foreground/80 font-mono tabular-nums">
                        {task.retry_count ?? 0}/{task.max_retries ?? 3}
                    </span>
                </div>
            </div>

            {/* Error */}
            {task.error_message && (
                <div className="bg-red-500/5 border border-red-500/20 rounded-md p-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                        <AlertTriangle size={12} /> Error
                    </div>
                    <p className="text-[11px] text-red-700 dark:text-red-300 font-mono leading-relaxed break-all">
                        {task.error_message}
                    </p>
                </div>
            )}

            {/* Output artifact */}
            {outputArtifact && (
                <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Output Artifact
                    </h4>
                    <button
                        onClick={() =>
                            openInspector('artifact', outputArtifact.id, outputArtifact as unknown as Record<string, unknown>)
                        }
                        className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        <Layers size={11} /> {outputArtifact.title}
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Artifact Inspector ──────────────────────────────────────────

function ArtifactInspector({ data }: { data: Record<string, unknown> }) {
    const artifact = data as {
        id?: string;
        title?: string;
        artifact_type?: string;
        content?: string;
        version?: number;
        created_at?: string;
        metadata?: Record<string, unknown>;
    };

    return (
        <div className="space-y-4">
            <div>
                <h3 className="text-sm font-semibold text-foreground">
                    {artifact.title ?? 'Artifact'}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {artifact.artifact_type?.replace(/_/g, ' ')}
                    </Badge>
                    {artifact.version !== undefined && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                            v{artifact.version}
                        </span>
                    )}
                </div>
            </div>

            <Separator />

            {/* Content */}
            {artifact.content && (
                <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Content
                    </h4>
                    <div className="bg-muted/50 rounded-md p-3 text-xs leading-relaxed max-h-[50vh] overflow-y-auto prose prose-sm max-w-none">
                        <ReactMarkdown>{artifact.content}</ReactMarkdown>
                    </div>
                </div>
            )}

            {/* Metadata */}
            {artifact.metadata && Object.keys(artifact.metadata).length > 0 && (
                <div>
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                        Metadata
                    </h4>
                    <pre className="bg-muted/50 rounded-md p-2 text-[10px] font-mono text-foreground/70 overflow-x-auto">
                        {JSON.stringify(artifact.metadata, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}

// ─── Claim Inspector ─────────────────────────────────────────────

function ClaimInspector({ data }: { data: Record<string, unknown> }) {
    const claim = data as {
        id?: string;
        claim_text?: string;
        claim_type?: string;
        source_type?: string;
        source_id?: string;
        confidence?: number;
        source_label?: string;
        source_url?: string;
        relationship_count?: number;
        cited_in_documents?: number;
    };

    return (
        <div className="space-y-4">
            <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                    <Quote size={13} className="text-muted-foreground" />
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Claim
                    </h4>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                    {claim.claim_text}
                </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
                {claim.claim_type && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {claim.claim_type}
                    </Badge>
                )}
                {claim.confidence !== undefined && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        {(claim.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                )}
            </div>

            <Separator />

            {/* Source */}
            <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Source type</span>
                    <span className="text-foreground/80 capitalize">{claim.source_type}</span>
                </div>
                {claim.source_label && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Source</span>
                        {claim.source_url ? (
                            <a
                                href={claim.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[60%]"
                            >
                                {claim.source_label}
                            </a>
                        ) : (
                            <span className="text-foreground/80 truncate max-w-[60%]">
                                {claim.source_label}
                            </span>
                        )}
                    </div>
                )}
                {claim.relationship_count !== undefined && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Relationships</span>
                        <span className="text-foreground/80 font-mono tabular-nums">
                            {claim.relationship_count}
                        </span>
                    </div>
                )}
                {claim.cited_in_documents !== undefined && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Cited in documents</span>
                        <span className="text-foreground/80 font-mono tabular-nums">
                            {claim.cited_in_documents}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Inspector Shell ────────────────────────────────────────

const LABELS: Record<string, { title: string; icon: typeof BookOpen }> = {
    paper: { title: 'Paper', icon: BookOpen },
    task: { title: 'Task', icon: Layers },
    artifact: { title: 'Artifact', icon: FileText },
    claim: { title: 'Claim', icon: Quote },
};

export function Inspector({
    content,
    onClose,
}: {
    content: InspectorContent;
    onClose: () => void;
}) {
    const { title, icon: Icon } = LABELS[content.type] ?? LABELS.task;

    return (
        <div className="h-full bg-card border-l border-border flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border shrink-0">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <Icon size={12} />
                    {title}
                </div>
                <button
                    onClick={onClose}
                    className="w-6 h-6 rounded-md hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X size={13} />
                </button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
                <div className="p-3">
                    {content.type === 'paper' && <PaperInspector data={content.data} />}
                    {content.type === 'task' && <TaskInspector data={content.data} />}
                    {content.type === 'artifact' && <ArtifactInspector data={content.data} />}
                    {content.type === 'claim' && <ClaimInspector data={content.data} />}
                </div>
            </ScrollArea>
        </div>
    );
}
