'use client';

import { useProject, type PhaseSummary } from '../_context/project-context';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
} from '@/components/ui/tooltip';
import {
    ChevronRight,
    Circle,
    CheckCircle2,
    XCircle,
    Loader2,
    Clock,
    FileText,
    BookOpen,
    FolderOpen,
    Layers,
    Wifi,
    WifiOff,
} from 'lucide-react';
import { useState } from 'react';
import { truncate } from '@/lib/types';

// ─── Status icon for tasks ──────────────────────────────────────

function TaskStateIcon({ state }: { state: string }) {
    switch (state) {
        case 'completed':
            return <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />;
        case 'failed':
            return <XCircle size={13} className="text-red-500 shrink-0" />;
        case 'running':
            return <Loader2 size={13} className="text-blue-500 animate-spin shrink-0" />;
        case 'ready':
            return <Clock size={13} className="text-amber-500 shrink-0" />;
        default:
            return <Circle size={13} className="text-muted-foreground/40 shrink-0" />;
    }
}

// ─── Project status badge ────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const variants: Record<string, string> = {
        created: 'bg-muted text-muted-foreground',
        planned: 'bg-muted text-muted-foreground',
        executing: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        completed: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        failed: 'bg-red-500/10 text-red-600 dark:text-red-400',
        paused: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    };

    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${variants[status] ?? variants.created}`}>
            {status}
        </span>
    );
}

// ─── Collapsible section ─────────────────────────────────────────

function NavSection({
    title,
    icon: Icon,
    count,
    defaultOpen = true,
    children,
}: {
    title: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    count?: number;
    defaultOpen?: boolean;
    children: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors group">
                <div className="flex items-center gap-1.5">
                    <ChevronRight
                        size={12}
                        className={`transition-transform ${open ? 'rotate-90' : ''}`}
                    />
                    <Icon size={12} />
                    <span>{title}</span>
                </div>
                {count !== undefined && count > 0 && (
                    <span className="text-[10px] tabular-nums font-mono text-muted-foreground/60">
                        {count}
                    </span>
                )}
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="pb-1">{children}</div>
            </CollapsibleContent>
        </Collapsible>
    );
}

// ─── Phase group in pipeline ─────────────────────────────────────

function PhaseGroup({ phase }: { phase: PhaseSummary }) {
    const { openInspector } = useProject();
    const progress = phase.total > 0 ? (phase.completed / phase.total) * 100 : 0;

    return (
        <div className="px-3 mb-2">
            <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-foreground/80">
                    {phase.name}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                    {phase.completed}/{phase.total}
                </span>
            </div>
            <Progress value={progress} className="h-1 mb-1.5" />
            <div className="space-y-0.5">
                {phase.tasks.map((task) => (
                    <button
                        key={task.id}
                        onClick={() =>
                            openInspector('task', task.id, task as unknown as Record<string, unknown>)
                        }
                        className="flex items-center gap-1.5 w-full text-left px-1.5 py-1 rounded-sm text-[11px] text-foreground/70 hover:bg-accent hover:text-foreground transition-colors"
                    >
                        <TaskStateIcon state={task.state} />
                        <span className="truncate">{task.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Navigator Component ─────────────────────────────────────────

export function Navigator() {
    const {
        project,
        phases,
        documents,
        papers,
        files,
        totalTaskCount,
        wsConnected,
        openInspector,
    } = useProject();

    if (!project) {
        return (
            <div className="h-full bg-card border-r border-border flex items-center justify-center">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="h-full bg-card border-r border-border flex flex-col">
            {/* Project header */}
            <div className="px-3 py-3 border-b border-border shrink-0">
                <div className="flex items-center justify-between mb-1.5">
                    <StatusBadge status={project.status} />
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center">
                                {wsConnected ? (
                                    <Wifi size={11} className="text-emerald-500" />
                                ) : (
                                    <WifiOff size={11} className="text-muted-foreground/40" />
                                )}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                            {wsConnected ? 'Live updates active' : 'Reconnecting…'}
                        </TooltipContent>
                    </Tooltip>
                </div>
                <p className="text-xs font-medium text-foreground leading-snug line-clamp-3">
                    {project.research_goal}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                    <Badge variant="outline" className="text-[10px] px-1 py-0 font-normal">
                        {project.output_type?.replace(/_/g, ' ')}
                    </Badge>
                    {project.audience && (
                        <Badge variant="outline" className="text-[10px] px-1 py-0 font-normal">
                            {project.audience}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Scrollable sections */}
            <ScrollArea className="flex-1">
                <div className="py-2 space-y-1">
                    {/* Pipeline */}
                    <NavSection title="Pipeline" icon={Layers} count={totalTaskCount}>
                        {phases.length > 0 ? (
                            phases.map((phase) => (
                                <PhaseGroup key={phase.index} phase={phase} />
                            ))
                        ) : (
                            <p className="px-3 text-[11px] text-muted-foreground">
                                No tasks yet
                            </p>
                        )}
                    </NavSection>

                    {/* Documents */}
                    <NavSection title="Documents" icon={FileText} count={documents.length}>
                        {documents.length > 0 ? (
                            <div className="px-3 space-y-0.5">
                                {documents.map((doc) => (
                                    <a
                                        key={doc.id}
                                        href={`/projects/${doc.project_id}/doc/${doc.id}`}
                                        className="flex items-center gap-1.5 px-1.5 py-1 rounded-sm text-[11px] text-foreground/70 hover:bg-accent hover:text-foreground transition-colors"
                                    >
                                        <FileText size={12} className="shrink-0 text-muted-foreground" />
                                        <span className="truncate">
                                            {truncate(doc.title || 'Untitled', 28)}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <p className="px-3 text-[11px] text-muted-foreground">
                                No documents
                            </p>
                        )}
                    </NavSection>

                    {/* Literature */}
                    <NavSection title="Literature" icon={BookOpen} count={papers.length}>
                        {papers.length > 0 ? (
                            <div className="px-3 space-y-0.5">
                                {papers.slice(0, 20).map((paper, i) => (
                                    <button
                                        key={paper.id ?? `p-${i}`}
                                        onClick={() =>
                                            openInspector(
                                                'paper',
                                                paper.id ?? `p-${i}`,
                                                paper as unknown as Record<string, unknown>
                                            )
                                        }
                                        className="flex items-center gap-1.5 w-full text-left px-1.5 py-1 rounded-sm text-[11px] text-foreground/70 hover:bg-accent hover:text-foreground transition-colors"
                                    >
                                        <BookOpen size={12} className="shrink-0 text-muted-foreground" />
                                        <span className="truncate">
                                            {truncate(paper.title, 28)}
                                        </span>
                                    </button>
                                ))}
                                {papers.length > 20 && (
                                    <p className="px-1.5 text-[10px] text-muted-foreground">
                                        +{papers.length - 20} more
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="px-3 text-[11px] text-muted-foreground">
                                No papers yet
                            </p>
                        )}
                    </NavSection>

                    {/* Files */}
                    <NavSection title="Files" icon={FolderOpen} count={files.length} defaultOpen={false}>
                        {files.length > 0 ? (
                            <div className="px-3 space-y-0.5">
                                {files.map((file) => (
                                    <div
                                        key={file.id}
                                        className="flex items-center gap-1.5 px-1.5 py-1 rounded-sm text-[11px] text-foreground/70"
                                    >
                                        <FolderOpen size={12} className="shrink-0 text-muted-foreground" />
                                        <span className="truncate">
                                            {truncate(file.name, 28)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="px-3 text-[11px] text-muted-foreground">
                                No files uploaded
                            </p>
                        )}
                    </NavSection>
                </div>
            </ScrollArea>
        </div>
    );
}
