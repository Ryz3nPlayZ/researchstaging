"use client";

import React from 'react';
import { useProject } from '@/lib/ProjectContext';
import { Info, BarChart3, ShieldCheck, History, Database, Network } from 'lucide-react';

export default function Inspector() {
    const { currentProject, tasks } = useProject();

    const completedCount = tasks.filter(t => t.state === 'completed').length;
    const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

    return (
        <aside className="panel panel-last w-[340px]">
            <div className="header flex items-center">
                <Info size={14} className="mr-2" />
                <span>Inspector</span>
            </div>

            <div className="scroll-area space-y-6">
                {/* Project Metadata */}
                <div>
                    <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3 flex items-center">
                        <Database size={10} className="mr-2" /> Project Metadata
                    </div>
                    <div className="space-y-4">
                        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                            <div className="text-[10px] text-zinc-500 uppercase mb-1">Target Audience</div>
                            <div className="text-xs text-white capitalize">{currentProject?.audience || 'Not specified'}</div>
                        </div>
                        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                            <div className="text-[10px] text-zinc-500 uppercase mb-1">Output Format</div>
                            <div className="text-xs text-white capitalize">{currentProject?.output_type?.replace('_', ' ') || 'None'}</div>
                        </div>
                        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                            <div className="text-[10px] text-zinc-500 uppercase mb-1">Created At</div>
                            <div className="text-xs text-white">
                                {currentProject?.created_at ? new Date(currentProject.created_at).toLocaleString() : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Real-time Status */}
                <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Process Vitality</span>
                        </div>
                        <span className="text-[10px] font-mono text-blue-400">{Math.round(progress)}%</span>
                    </div>

                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-4">
                        <div
                            className="h-full bg-blue-500 transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="text-center p-2 rounded bg-black/20 border border-white/5">
                            <div className="text-lg font-bold text-white leading-tight">{tasks.length}</div>
                            <div className="text-[8px] text-zinc-600 uppercase">Total Tasks</div>
                        </div>
                        <div className="text-center p-2 rounded bg-black/20 border border-white/5">
                            <div className="text-lg font-bold text-green-500 leading-tight">{completedCount}</div>
                            <div className="text-[8px] text-zinc-600 uppercase">Confirmed</div>
                        </div>
                    </div>
                </div>

                {/* Provenance Checklist */}
                <div className="space-y-3">
                    <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center">
                        <ShieldCheck size={10} className="mr-2" /> Provenance Records
                    </div>

                    {[
                        { label: 'Source Verification', status: 'verified', icon: <CheckCircle2 size={12} /> },
                        { label: 'Task Traceability', status: 'verified', icon: <CheckCircle2 size={12} /> },
                        { label: 'Artifact Versioning', status: 'active', icon: <Network size={12} /> },
                        { label: 'Execution Audit', status: 'pending', icon: <History size={12} /> },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-2.5 rounded-md border border-white/[0.02] hover:bg-white/[0.02] transition-colors group">
                            <div className="flex items-center text-xs text-zinc-400">
                                <span className="mr-2 text-zinc-600 group-hover:text-blue-500 transition-colors">{item.icon}</span>
                                {item.label}
                            </div>
                            <div className={`text-[8px] font-bold uppercase tracking-widest ${item.status === 'verified' ? 'text-green-500/60' :
                                    item.status === 'active' ? 'text-blue-500/60' : 'text-zinc-600'
                                }`}>
                                {item.status}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Analytics Hook */}
                <div className="mt-6 pt-6 border-t border-white/5">
                    <button className="w-full flex items-center justify-center space-x-2 py-3 bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-lg text-zinc-400 transition-all text-[10px] uppercase font-bold tracking-widest group">
                        <BarChart3 size={14} className="group-hover:scale-110 transition-transform" />
                        <span>Download Analysis Report</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}

function CheckCircle2({ size }) {
    return <Network size={size} />;
}
