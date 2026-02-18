'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { documentApi, projectApi, statsApi, taskApi } from '@/lib/api';
import type { DocumentListItem, Project, StatsResponse, TaskResponse } from '@/lib/types';
import { calcProjectProgress, mapProjectStatus, relativeTime, truncate } from '@/lib/types';
import { NewProjectDialog } from '@/components/new-project-dialog';
import {
    FolderOpen,
    FileText,
    Sparkles,
    BarChart3,
    Upload,
    Wand2,
    UserPlus,
    ArrowRight,
    MoreHorizontal,
    TrendingUp,
    FileSpreadsheet,
    FileImage,
    FileCode,
    Zap
} from 'lucide-react';

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

// Sparkline chart component
function Sparkline({ trend = 'up' }: { trend?: 'up' | 'down' | 'neutral' }) {
    const color = trend === 'up' ? '#1C7C54' : trend === 'down' ? '#E57373' : '#8A9A8A';
    return (
        <svg width="48" height="24" viewBox="0 0 48 24" fill="none" className="opacity-60">
            <path
                d="M2 18 C 8 14, 16 20, 24 12 S 40 6, 46 4"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
            />
            <circle cx="46" cy="4" r="2" fill={color} />
        </svg>
    );
}

function StatCard({
    label,
    value,
    trend,
    icon: Icon,
    color,
}: {
    label: string;
    value: string | number;
    trend: string;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <div className="flex items-start gap-3">
            <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${color}`}>
                        <Icon size={16} className="text-[#1C7C54]" />
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-medium text-[#1C7C54]">
                        <TrendingUp size={12} />
                        {trend}
                    </div>
                </div>
                <p className="text-[28px] font-bold text-[#1B512D] leading-none">{value}</p>
                <p className="text-xs text-[#8A9A8A] mt-1">{label}</p>
            </div>
            <div className="pt-1">
                <Sparkline trend="up" />
            </div>
        </div>
    );
}

function MiniStatusPill({ status }: { status: string }) {
    const uiStatus = mapProjectStatus(status);
    if (uiStatus === 'active') {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-white/20 text-white backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#73E2A7]" />
                In Progress
            </span>
        );
    }
    if (uiStatus === 'planning') {
        return (
            <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-white/20 text-white backdrop-blur-sm">
                Planning
            </span>
        );
    }
    return (
        <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-white/20 text-white/80 backdrop-blur-sm">
            Archived
        </span>
    );
}

function QuickAction({
    icon: Icon,
    label,
    description,
    href,
    color,
}: {
    icon: React.ElementType;
    label: string;
    description: string;
    href: string;
    color: string;
}) {
    return (
        <Link href={href} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-[#F5F5F7] transition-colors group">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                <Icon size={20} className="text-[#1C7C54]" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1B512D] group-hover:text-[#1C7C54] transition-colors">
                    {label}
                </p>
                <p className="text-xs text-[#8A9A8A]">{description}</p>
            </div>
        </Link>
    );
}

function FileIcon({ type }: { type: string }) {
    const colors: Record<string, string> = {
        pdf: 'bg-rose-100 text-rose-600',
        xlsx: 'bg-emerald-100 text-emerald-600',
        docx: 'bg-blue-100 text-blue-600',
        png: 'bg-purple-100 text-purple-600',
        jpg: 'bg-purple-100 text-purple-600',
        default: 'bg-gray-100 text-gray-600',
    };
    const color = colors[type.toLowerCase()] || colors.default;

    if (type.toLowerCase() === 'pdf') {
        return (
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
                <FileText size={22} />
            </div>
        );
    }
    if (type.toLowerCase() === 'xlsx') {
        return (
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
                <FileSpreadsheet size={22} />
            </div>
        );
    }
    if (type.toLowerCase() === 'docx') {
        return (
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
                <FileText size={22} />
            </div>
        );
    }
    if (type.toLowerCase() === 'png' || type.toLowerCase() === 'jpg') {
        return (
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
                <FileImage size={22} />
            </div>
        );
    }
    return (
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
            <FileCode size={22} />
        </div>
    );
}

function getFileType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['xlsx', 'xls', 'csv'].includes(ext)) return 'xlsx';
    if (['docx', 'doc'].includes(ext)) return 'docx';
    if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return 'png';
    return 'default';
}

function formatFileSize(bytes?: number): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [projects, setProjects] = useState<Project[]>([]);
    const [stats, setStats] = useState<StatsResponse | null>(null);
    const [recentTasks, setRecentTasks] = useState<(TaskResponse & { projectGoal?: string })[]>([]);
    const [recentDocuments, setRecentDocuments] = useState<Array<DocumentListItem & { projectId: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [showNewProject, setShowNewProject] = useState(false);
    const [heroIndex, setHeroIndex] = useState(0);

    const loadData = async () => {
        setLoading(true);
        const [projectsRes, statsRes] = await Promise.all([
            projectApi.list(),
            statsApi.global(),
        ]);
        const projectList = projectsRes.data || [];
        setProjects(projectList);
        if (statsRes.data) setStats(statsRes.data);

        const taskPromises = projectList.slice(0, 6).map(async (p) => {
            const res = await taskApi.list(p.id);
            return (res.data || []).map((t) => ({ ...t, projectGoal: p.research_goal }));
        });
        const allTasks = (await Promise.all(taskPromises)).flat();
        allTasks.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        setRecentTasks(allTasks.slice(0, 6));

        const documentPromises = projectList.slice(0, 5).map(async (project) => {
            const res = await documentApi.list(project.id);
            return (res.data || []).map((doc) => ({ ...doc, projectId: project.id }));
        });
        const docs = (await Promise.all(documentPromises)).flat();
        docs.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        setRecentDocuments(docs.slice(0, 6));

        setLoading(false);
    };

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        const id = setInterval(() => {
            setHeroIndex((prev) => (prev + 1) % 3);
        }, 5000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        const refreshId = setInterval(() => {
            loadData();
        }, 30000);
        return () => clearInterval(refreshId);
    }, []);

    const firstName = user?.name?.split(' ')[0] || 'Researcher';
    const activeProject = projects.find((p) => p.status === 'executing') || projects[0];
    const coverSrc = ['/covers/cover-1.jpg', '/covers/cover-2.jpg', '/covers/cover-3.jpg'][heroIndex];

    const statCards = [
        { label: 'Active Projects', value: projects.filter((p) => mapProjectStatus(p.status) === 'active').length, trend: '+3', icon: FolderOpen, color: 'bg-[#DEF4C6]' },
        { label: 'Documents', value: stats?.artifacts ?? 0, trend: '+28', icon: FileText, color: 'bg-blue-50' },
        { label: 'AI Queries', value: stats?.tasks ?? 0, trend: '+156', icon: Sparkles, color: 'bg-amber-50' },
        { label: 'Results', value: stats?.papers ?? 0, trend: '+12', icon: BarChart3, color: 'bg-purple-50' },
    ];

    const taskTypeLabels: Record<string, string> = {
        summarize: 'SUMMARY',
        analyze: 'ANALYSIS',
        visualize: 'VISUALIZATION',
        search: 'SEARCH',
        extract: 'EXTRACTION',
        default: 'DOCUMENT',
    };

    return (
        <>
            <div className="space-y-5">
                {/* Hero Row */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                    {/* Hero Image with Floating Pills */}
                    <div className="lg:col-span-3 relative rounded-[28px] overflow-hidden min-h-[280px] shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
                        <Image
                            src={coverSrc}
                            alt="Research hero"
                            fill
                            priority
                            className="object-cover transition-opacity duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#1B512D]/30 via-transparent to-transparent" />

                        {/* Productivity Pill */}
                        <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#DEF4C6] flex items-center justify-center">
                                    <TrendingUp size={18} className="text-[#1C7C54]" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8A9A8A]">Productivity</p>
                                    <p className="text-sm font-bold text-[#1B512D]">+24% this week</p>
                                </div>
                            </div>
                        </div>

                        {/* Active Users Pill */}
                        <div className="absolute top-5 right-5 bg-white/95 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg">
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    {['SP', 'M', 'L'].map((initials, i) => (
                                        <div
                                            key={i}
                                            className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold"
                                            style={{
                                                backgroundColor: i === 0 ? '#DEF4C6' : i === 1 ? '#73E2A7' : '#1C7C54',
                                                color: i === 0 ? '#1C7C54' : '#fff'
                                            }}
                                        >
                                            {initials}
                                        </div>
                                    ))}
                                </div>
                                <span className="text-xs font-medium text-[#4A5D4A]">+3 active</span>
                            </div>
                        </div>

                        {/* Cover Dots */}
                        <div className="absolute bottom-5 right-5 flex items-center gap-1.5">
                            {[0, 1, 2].map((idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setHeroIndex(idx)}
                                    className={`h-2 rounded-full transition-all ${heroIndex === idx ? 'w-5 bg-white' : 'w-2 bg-white/50'}`}
                                    aria-label={`Show hero cover ${idx + 1}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Greeting Card */}
                    <div className="lg:col-span-2 relative rounded-[28px] bg-white p-7 shadow-[0_2px_12px_rgba(0,0,0,0.05)] border border-black/[0.04] min-h-[280px] flex flex-col overflow-hidden">
                        {/* Organic Background Shape */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#DEF4C6]/40 rounded-bl-[100px] -mr-8 -mt-8 blur-xl pointer-events-none" />

                        <div className="relative z-10">
                            <h1 className="text-[32px] leading-tight font-bold text-[#1B512D] flex items-center gap-2">
                                {getGreeting()}, {firstName} <span className="text-2xl">👋</span>
                            </h1>
                            <p className="mt-2 text-[15px] text-[#4A5D4A]">
                                Ready to accelerate your research today?
                            </p>
                        </div>

                        <div className="relative z-10 mt-6 flex flex-wrap gap-3">
                            <button
                                onClick={() => setShowNewProject(true)}
                                className="inline-flex items-center gap-2 rounded-full bg-[#1B512D] hover:bg-[#145C3B] text-white px-5 py-2.5 text-sm font-semibold transition-colors"
                            >
                                <span className="text-lg leading-none">+</span> New Project
                            </button>
                            <button className="inline-flex items-center gap-2 rounded-full bg-[#F5F5F7] hover:bg-[#EAEAEA] text-[#1B512D] border border-black/[0.06] px-4 py-2.5 text-sm font-medium transition-colors">
                                <Zap size={16} className="text-[#73E2A7]" />
                                AI Assist
                            </button>
                        </div>

                        {activeProject && (
                            <Link
                                href={`/projects/${activeProject.id}`}
                                className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#1C7C54] hover:text-[#1B512D] transition-colors"
                            >
                                Continue research <ArrowRight size={16} />
                            </Link>
                        )}
                    </div>
                </div>

                {/* Stats Row */}
                <section className="rounded-[28px] bg-white p-6 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {statCards.map((item) => (
                            <StatCard
                                key={item.label}
                                label={item.label}
                                value={loading ? '—' : item.value}
                                trend={item.trend}
                                icon={item.icon}
                                color={item.color}
                            />
                        ))}
                    </div>
                </section>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Active Project Card */}
                    <section className="rounded-[28px] bg-white border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col">
                        {/* Gradient Header */}
                        <div className="relative h-36 bg-gradient-to-br from-[#73E2A7] via-[#1C7C54] to-[#1B512D]">
                            <div className="absolute inset-0 opacity-30">
                                <Image src={coverSrc} alt="" fill className="object-cover mix-blend-overlay" />
                            </div>
                            <div className="absolute top-4 left-4">
                                <MiniStatusPill status={activeProject?.status || 'idle'} />
                            </div>
                            <div className="absolute top-4 right-4">
                                <button className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-white/30 transition-colors">
                                    <MoreHorizontal size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 flex-1 flex flex-col">
                            {activeProject ? (
                                <>
                                    <h3 className="text-lg font-bold text-[#1B512D] line-clamp-2">
                                        {truncate(activeProject.research_goal, 60)}
                                    </h3>
                                    <p className="text-sm text-[#8A9A8A] mt-1">
                                        Analyzing research data using AI models
                                    </p>

                                    <div className="flex items-center gap-4 mt-4">
                                        <div className="flex items-center gap-1.5 text-xs text-[#4A5D4A]">
                                            <div className="w-6 h-6 rounded-lg bg-[#F5F5F7] flex items-center justify-center">
                                                <FileText size={12} className="text-[#8A9A8A]" />
                                            </div>
                                            <span className="font-medium">{activeProject.task_counts?.completed ?? 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-[#4A5D4A]">
                                            <div className="w-6 h-6 rounded-lg bg-[#DEF4C6] flex items-center justify-center">
                                                <Sparkles size={12} className="text-[#1C7C54]" />
                                            </div>
                                            <span className="font-medium">{stats?.tasks ?? 156}</span>
                                        </div>
                                    </div>

                                    <div className="mt-5 space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-[#4A5D4A]">Progress</span>
                                            <span className="font-bold text-[#1C7C54]">{calcProjectProgress(activeProject.task_counts)}%</span>
                                        </div>
                                        <div className="h-2 bg-[#F5F5F7] rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{
                                                    width: `${calcProjectProgress(activeProject.task_counts)}%`,
                                                    background: 'linear-gradient(90deg, #73E2A7, #1C7C54)',
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4 flex items-center gap-2 text-xs text-[#8A9A8A]">
                                        <div className="w-5 h-5 rounded bg-[#DEF4C6] flex items-center justify-center">
                                            <Zap size={10} className="text-[#1C7C54]" />
                                        </div>
                                        AI summary {relativeTime(activeProject.updated_at)}
                                    </div>

                                    <div className="mt-auto pt-5 flex items-center justify-between">
                                        <div className="flex -space-x-2">
                                            {['SP', 'M', 'LW'].map((initials, i) => (
                                                <div
                                                    key={i}
                                                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold"
                                                    style={{
                                                        backgroundColor: i === 0 ? '#DEF4C6' : i === 1 ? '#73E2A7' : '#1C7C54',
                                                        color: i === 0 ? '#1C7C54' : '#fff'
                                                    }}
                                                >
                                                    {initials}
                                                </div>
                                            ))}
                                        </div>
                                        <Link
                                            href={`/projects/${activeProject.id}`}
                                            className="inline-flex items-center gap-1 text-sm font-semibold text-[#1C7C54] hover:text-[#1B512D] transition-colors"
                                        >
                                            Open <ArrowRight size={16} />
                                        </Link>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-center">
                                    <p className="text-sm text-[#8A9A8A]">No active project yet.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Right Column */}
                    <div className="lg:col-span-2 space-y-5">
                        {/* Quick Actions & AI Activity Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Quick Actions */}
                            <section className="rounded-[28px] bg-white p-6 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                                <h2 className="text-base font-bold text-[#1B512D]">Quick Actions</h2>
                                <div className="mt-4 space-y-1">
                                    <QuickAction
                                        icon={Upload}
                                        label="Upload Document"
                                        description="Add files"
                                        href="/projects"
                                        color="bg-[#DEF4C6]"
                                    />
                                    <QuickAction
                                        icon={Wand2}
                                        label="Run AI Analysis"
                                        description="Process data"
                                        href={activeProject ? `/projects/${activeProject.id}` : '/projects'}
                                        color="bg-rose-50"
                                    />
                                    <QuickAction
                                        icon={UserPlus}
                                        label="Invite Member"
                                        description="Collaborate"
                                        href="/settings"
                                        color="bg-blue-50"
                                    />
                                </div>
                            </section>

                            {/* AI Activity */}
                            <section className="rounded-[28px] bg-white p-6 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Zap size={18} className="text-[#73E2A7]" />
                                        <h2 className="text-base font-bold text-[#1B512D]">AI Activity</h2>
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-[#DEF4C6] text-[#1C7C54] text-xs font-medium">
                                        Today
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {loading ? (
                                        <p className="text-sm text-[#8A9A8A]">Loading activity...</p>
                                    ) : recentTasks.length > 0 ? (
                                        recentTasks.slice(0, 3).map((task, idx) => (
                                            <Link key={task.id} href={`/projects/${task.project_id}`} className="block">
                                                <div className="flex items-start gap-3 p-2 -mx-2 rounded-xl hover:bg-[#F5F5F7] transition-colors">
                                                    <div className="w-9 h-9 rounded-xl bg-[#F5F5F7] flex items-center justify-center shrink-0">
                                                        {idx === 0 ? <BarChart3 size={16} className="text-[#8A9A8A]" /> :
                                                            idx === 1 ? <Sparkles size={16} className="text-[#8A9A8A]" /> :
                                                                <FileText size={16} className="text-[#8A9A8A]" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-[#1B512D] line-clamp-1">{task.name}</p>
                                                        <p className="text-[11px] text-[#8A9A8A] mt-0.5">
                                                            {taskTypeLabels[task.task_type] || taskTypeLabels.default} · {relativeTime(task.updated_at)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        <p className="text-sm text-[#8A9A8A]">No AI actions yet.</p>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Recent Documents */}
                        <section className="rounded-[28px] bg-white p-6 border border-black/[0.04] shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-base font-bold text-[#1B512D]">Recent Documents</h2>
                                <Link href="/projects" className="text-sm font-medium text-[#1C7C54] hover:text-[#1B512D]">
                                    View all
                                </Link>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {loading ? (
                                    [...Array.from({ length: 4 })].map((_, idx) => (
                                        <div key={idx} className="h-28 rounded-2xl bg-[#F5F5F7] animate-pulse" />
                                    ))
                                ) : recentDocuments.length > 0 ? (
                                    recentDocuments.slice(0, 4).map((doc) => {
                                        const fileType = getFileType(doc.title);
                                        return (
                                            <Link key={doc.id} href={`/projects/${doc.projectId}/doc/${doc.id}`} className="block group">
                                                <div className="flex flex-col items-center text-center p-4 rounded-2xl hover:bg-[#F5F5F7] transition-colors">
                                                    <FileIcon type={fileType} />
                                                    <p className="mt-3 text-sm font-medium text-[#1B512D] line-clamp-1 group-hover:text-[#1C7C54] transition-colors">
                                                        {doc.title}
                                                    </p>
                                                    <p className="text-[11px] text-[#8A9A8A] mt-1">
                                                        {relativeTime(doc.updated_at)}
                                                    </p>
                                                </div>
                                            </Link>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-[#8A9A8A] col-span-4 text-center py-8">No documents yet.</p>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <NewProjectDialog
                open={showNewProject}
                onOpenChange={setShowNewProject}
                onCreated={() => {
                    loadData();
                    setShowNewProject(false);
                }}
            />
        </>
    );
}
