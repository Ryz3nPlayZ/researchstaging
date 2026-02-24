'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { projectApi } from '@/lib/api';
import type { Project } from '@/lib/types';
import { relativeTime, truncate, mapProjectStatus } from '@/lib/types';
import {
    ArrowRight,
    FileText,
    BarChart3,
    ArrowUpRight
} from 'lucide-react';

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

function StatusPill({ status }: { status: string }) {
    const uiStatus = mapProjectStatus(status);
    if (uiStatus === 'active') {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                In Progress
            </span>
        );
    }
    if (uiStatus === 'planning') {
        return (
            <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-500">
                Planning
            </span>
        );
    }
    return (
        <span className="inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-full bg-slate-100 text-slate-400">
            Archived
        </span>
    );
}

export default function DashboardPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [promptInput, setPromptInput] = useState('');

    const loadData = async () => {
        setLoading(true);
        const projectsRes = await projectApi.list();
        const projectList = projectsRes.data || [];
        setProjects(projectList);
        setLoading(false);
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadData();
    }, []);

    const firstName = user?.name?.split(' ')[0] || 'Researcher';
    const recentProjects = projects.slice(0, 4);

    const handlePromptSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!promptInput.trim()) return;
        router.push(`/new?q=${encodeURIComponent(promptInput)}`);
    };

    return (
        <div className="flex flex-col items-center min-h-[calc(100vh-56px)] overflow-auto pb-28">

            {/* Center Stage */}
            <div className="flex flex-col items-center justify-center w-full max-w-3xl flex-1 px-4 -mt-4">

                {/* Greeting */}
                <h1 className="font-ui text-[38px] leading-tight font-bold text-slate-800 tracking-tight text-center mb-2">
                    {getGreeting()}, {firstName}.
                </h1>

                <p className="text-[16px] text-slate-500 mb-10 text-center max-w-xl">
                    What unexplored topic should we dive into today?
                </p>

                {/* Prompt Input */}
                <form
                    onSubmit={handlePromptSubmit}
                    className="w-full relative shadow-[0_4px_24px_rgba(0,0,0,0.06)] bg-white rounded-2xl border border-black/[0.06] p-2 flex items-center transition-all focus-within:shadow-[0_4px_32px_rgba(0,0,0,0.09)] focus-within:border-black/[0.1]"
                >
                    <input
                        type="text"
                        value={promptInput}
                        onChange={(e) => setPromptInput(e.target.value)}
                        placeholder="Ask me to research anything..."
                        className="flex-1 bg-transparent px-3 py-3.5 text-[16px] outline-none placeholder:text-slate-400 text-slate-800"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!promptInput.trim()}
                        className="w-12 h-12 rounded-xl bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed ml-2 shrink-0"
                    >
                        <ArrowRight size={20} strokeWidth={2} />
                    </button>
                </form>

                <div className="mt-6 flex items-center gap-2.5 text-sm text-slate-500">
                    <span className="font-medium text-slate-400 text-[13px]">Try:</span>
                    <button onClick={() => setPromptInput("Synthesize the latest 5 papers on quantum computing")} className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-[12px] transition-all hover:-translate-y-[1px]">
                        &quot;Synthesize recent papers on...&quot;
                    </button>
                    <button onClick={() => setPromptInput("Draft a lit review on automated code generation")} className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-[12px] transition-all hover:-translate-y-[1px] hidden sm:block">
                        &quot;Draft a lit review on...&quot;
                    </button>
                </div>
            </div>

            {/* Recent Projects */}
            <div className="w-full max-w-5xl mt-auto pt-6 pb-4 px-4">
                <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-[12px] font-bold text-slate-900 uppercase tracking-widest">Recent Projects</h2>
                    <Link href="/projects" className="text-[12px] font-medium text-slate-400 hover:text-slate-900 transition-colors">
                        View all
                    </Link>
                </div>

                {loading ? (
                    <div className="flex gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex-1 h-28 rounded-xl bg-white/50 border border-black/[0.04] animate-pulse" />
                        ))}
                    </div>
                ) : recentProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {recentProjects.slice(0, 3).map((project) => (
                            <Link
                                key={project.id}
                                href={`/projects/${project.id}`}
                                className="group block bg-white rounded-xl border border-black/[0.06] p-4 hover:border-black/[0.1] hover:shadow-md hover:-translate-y-[1px] transition-all duration-200"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <StatusPill status={project.status} />
                                    <ArrowUpRight size={16} className="text-slate-300 group-hover:text-slate-600 transition-colors" />
                                </div>
                                <h3 className="text-[14px] font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                                    {truncate(project.research_goal, 80)}
                                </h3>
                                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex items-center gap-1">
                                            <FileText size={12} />
                                            <span>{project.task_counts?.completed ?? 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <BarChart3 size={12} />
                                            <span>{project.task_counts?.failed ?? 0}</span>
                                        </div>
                                    </div>
                                    <span>{relativeTime(project.updated_at)}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <p className="text-slate-500 text-[13px]">No active research projects yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
