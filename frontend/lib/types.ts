// TypeScript interfaces matching backend Pydantic models

export interface Project {
    id: string;
    research_goal: string;
    output_type: string;
    audience?: string;
    status: string;
    task_counts?: Record<string, number>;
    created_at: string;
    updated_at: string;
    started_at?: string;
    completed_at?: string;
}

export interface FileItem {
    id: string;
    name: string;
    file_type: string;
    size_bytes: number;
    created_at: string;
    path?: string;
    description?: string;
    mime_type?: string;
    metadata?: Record<string, unknown>;
}

export interface Paper {
    id?: string;
    external_id?: string;
    source: string;
    title: string;
    authors: string[];
    abstract?: string;
    year?: number;
    citation_count?: number;
    url?: string;
    pdf_url?: string;
    summary?: string;
}

// TipTap JSON content type
export interface TipTapContent {
    type?: string;
    content?: TipTapContent[];
    attrs?: Record<string, unknown>;
    text?: string;
    marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

export interface Document {
    id: string;
    project_id: string;
    title: string;
    content: TipTapContent;
    citation_style: string;
    created_at: string;
    updated_at: string;
}

export interface DocumentListItem {
    id: string;
    project_id: string;
    title: string;
    citation_style: string;
    created_at: string;
    updated_at: string;
}

export interface DocumentUpdateRequest {
    content?: TipTapContent;
    title?: string;
    citation_style?: string;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    context?: Record<string, unknown>;
}

export interface ChatHistoryResponse {
    messages: ChatMessage[];
    total: number;
}

export interface ChatResponse {
    response: string;
    agent_type: string;
    sources?: string[];
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    context?: Record<string, unknown>;
}

export interface SendMessageResponse {
    user_message: ChatMessage;
    ai_response: ChatMessage;
}

export interface AnalysisResult {
    success: boolean;
    output: string;
    error: string;
    execution_time: number;
    finding_id?: string;
}

export interface Claim {
    id: string;
    project_id: string;
    claim_text: string;
    claim_type?: string;
    source_type: string;
    source_id: string;
    confidence: number;
    extracted_at: string;
}

export interface StatsResponse {
    projects: number;
    tasks: number;
    artifacts: number;
    papers: number;
    task_breakdown: Record<string, number>;
}

export interface UserResponse {
    id: string;
    email: string;
    name?: string;
    picture_url?: string;
    credits_remaining: number;
}

export interface TaskResponse {
    id: string;
    project_id: string;
    name: string;
    description?: string;
    task_type: string;
    state: string;
    phase_index: number;
    sequence_index: number;
    retry_count: number;
    max_retries: number;
    error_message?: string;
    created_at: string;
    updated_at: string;
    started_at?: string;
    completed_at?: string;
    output_artifact_id?: string;
}

export interface ArtifactResponse {
    id: string;
    project_id: string;
    task_id?: string;
    artifact_type: string;
    title: string;
    content?: string;
    metadata: Record<string, unknown>;
    version: number;
    created_at: string;
}


// --- UI helpers ---

export type ProjectUIStatus = 'active' | 'planning' | 'archived';

/** Map backend project status to UI status */
export function mapProjectStatus(backendStatus: string): ProjectUIStatus {
    switch (backendStatus) {
        case 'executing':
            return 'active';
        case 'created':
        case 'planned':
            return 'planning';
        case 'completed':
        case 'failed':
            return 'archived';
        default:
            return 'planning';
    }
}

/** Calculate project progress percentage from task counts */
export function calcProjectProgress(taskCounts?: Record<string, number>): number {
    if (!taskCounts) return 0;
    const total = Object.values(taskCounts).reduce((a, b) => a + b, 0);
    if (total === 0) return 0;
    const completed = taskCounts['completed'] || 0;
    return Math.round((completed / total) * 100);
}

/** Format a date string to relative time (e.g. "2 hours ago") */
export function relativeTime(dateStr: string): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths}mo ago`;
}

/** Truncate string with ellipsis */
export function truncate(str: string, maxLen: number): string {
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen).trimEnd() + '…';
}
