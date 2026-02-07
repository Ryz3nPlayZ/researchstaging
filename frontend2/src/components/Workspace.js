"use client";

import React, { useState } from 'react';
import { useProject } from '@/lib/ProjectContext';
import { Play, FileText, LayoutGrid, Terminal, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { projectsApi } from '@/lib/api';

export default function Workspace() {
    const { currentProject, tasks, selectProject, setTasks } = useProject();
    const [activeTab, setActiveTab] = useState('tasks');

    const handleExecute = async () => {
        if (!currentProject) return;
        try {
            await projectsApi.execute(currentProject.id);
            // Wait a bit then refresh to see the status change (WS will also handle this)
            setTimeout(() => selectProject(currentProject.id), 500);
        } catch (err) {
            console.error('Execution failed:', err);
        }
    };

    if (!currentProject) {
        return (
            <section className="panel flex-1 justify-center items-center bg-[#0a0a0b]">
                <div className="text-center p-8 border border-white/5 bg-white/[0.02] rounded-xl max-w-md">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <LayoutGrid size={32} className="text-blue-500" />
                    </div>
                    <h2 className="text-xl font-medium text-white mb-2">No Project Selected</h2>
                    <p className="text-zinc-500 text-sm mb-6">
                        Select a project from the left navigator or create a new research session to begin.
                    </p>
                    <button className="btn btn-primary px-8">CREATE NEW PROJECT</button>
                </div>
            </section>
        );
    }

    return (
        <section className="panel flex-1 bg-[#0a0a0b]">
            <div className="header flex justify-between items-center group">
                <div className="flex items-center space-x-6">
                    <div
                        onClick={() => setActiveTab('tasks')}
                        className={`cursor-pointer pb-px border-b-2 transition-all ${activeTab === 'tasks' ? 'border-blue-500 text-white' : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}
                    >
                        TASKS
                    </div>
                    <div
                        onClick={() => setActiveTab('artifacts')}
                        className={`cursor-pointer pb-px border-b-2 transition-all ${activeTab === 'artifacts' ? 'border-blue-500 text-white' : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}
                    >
                        ARTIFACTS
                    </div>
                    <div
                        onClick={() => setActiveTab('editor')}
                        className={`cursor-pointer pb-px border-b-2 transition-all ${activeTab === 'editor' ? 'border-blue-500 text-white' : 'border-transparent text-zinc-600 hover:text-zinc-400'}`}
                    >
                        EDITOR
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 mr-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">API Connected</span>
                    </div>
                    <button
                        onClick={handleExecute}
                        disabled={currentProject.status === 'executing'}
                        className={`btn ${currentProject.status === 'executing' ? 'btn-ghost opacity-50 cursor-not-allowed' : 'btn-primary'} !py-1 flex items-center shadow-lg shadow-blue-500/10`}
                    >
                        <Play size={12} className="mr-2 fill-current" />
                        {currentProject.status === 'executing' ? 'EXECUTING...' : 'RUN PIPELINE'}
                    </button>
                </div>
            </div>

            <div className="scroll-area !p-0 flex-1 overflow-hidden flex flex-col">
                {activeTab === 'tasks' && (
                    <div className="p-6 space-y-4 overflow-y-auto flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tasks.map((task, idx) => (
                                <div key={task.id} className="group relative">
                                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                    <div className="relative card !m-0 flex items-start space-x-4 bg-[#121214] border-white/5">
                                        <div className={`mt-0.5 p-1.5 rounded-md ${task.state === 'completed' ? 'bg-green-500/10 text-green-500' :
                                                task.state === 'executing' ? 'bg-blue-500/10 text-blue-500' :
                                                    task.state === 'failed' ? 'bg-red-500/10 text-red-500' :
                                                        'bg-zinc-800 text-zinc-500'
                                            }`}>
                                            {task.state === 'completed' && <CheckCircle2 size={16} />}
                                            {task.state === 'executing' && <Clock size={16} className="animate-spin" />}
                                            {task.state === 'failed' && <AlertCircle size={16} />}
                                            {(task.state === 'pending' || task.state === 'ready') && <div className="w-4 h-4 border-2 border-current rounded-full border-dotted" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-white mb-0.5 uppercase tracking-tighter flex justify-between">
                                                <span>PHASE {task.phase_index + 1}</span>
                                                <span className={`${task.state === 'completed' ? 'text-green-500/60' :
                                                        task.state === 'executing' ? 'text-blue-500/60' :
                                                            'text-zinc-600'
                                                    }`}>{task.state}</span>
                                            </div>
                                            <h3 className="text-sm font-medium text-zinc-300 truncate">{task.name}</h3>
                                            <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {tasks.length === 0 && (
                                <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-xl">
                                    <div className="text-zinc-600 text-sm italic font-mono uppercase tracking-widest">Initialising Task DAG...</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'artifacts' && (
                    <div className="p-8 flex flex-col items-center justify-center text-center h-full">
                        <FileText size={48} className="text-zinc-800 mb-6" />
                        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">No Artifacts Generated Yet</p>
                    </div>
                )}

                {activeTab === 'editor' && (
                    <div className="flex-1 p-10 font-mono text-zinc-400 overflow-y-auto leading-relaxed">
                        <div className="max-w-3xl mx-auto border-l border-white/5 pl-8 py-4">
                            <div className="text-blue-400 mb-4 opacity-50">// GENERATED OUTPUT PREVIEW</div>
                            <h1 className="text-2xl text-white font-sans font-bold mb-8">{currentProject.research_goal}</h1>
                            <p className="mb-6 italic text-zinc-500">
                                Draft content will appear here as synthesis tasks complete...
                            </p>
                            {/* Simulated code block */}
                            <div className="bg-black/40 rounded-lg p-4 border border-white/5 mt-10">
                                <div className="flex space-x-2 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                                    <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
                                </div>
                                <div className="text-xs font-mono text-zinc-500 leading-6">
                                    <span className="text-purple-400"># Initializing analysis...</span><br />
                                    <span className="text-blue-400">const</span> researcher = <span className="text-yellow-200">new</span> Pilot(<span className="text-green-400">'research_pilot_v3'</span>);<br />
                                    <br />
                                    <span className="text-zinc-600">// Project Goal defined by user</span><br />
                                    researcher.<span className="text-yellow-200">execute</span>({'{'}<br />
                                    &nbsp;&nbsp;goal: <span className="text-green-400">"{currentProject.research_goal}"</span>,<br />
                                    &nbsp;&nbsp;audience: <span className="text-green-400">"{currentProject.audience || 'academic'}"</span><br />
                                    {'}'});
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Console / Log area */}
                <div className="h-40 border-t border-white/10 bg-black/60 p-4 font-mono text-[10px] overflow-y-auto cursor-default">
                    <div className="flex items-center text-zinc-700 mb-3 font-bold letter-spacing-2">
                        <Terminal size={10} className="mr-2" />
                        <span className="tracking-[0.2em] uppercase">System Trace Console</span>
                        <div className="h-px flex-1 bg-white/5 ml-4"></div>
                    </div>
                    <div className="space-y-1">
                        <div className="text-zinc-500 flex items-start">
                            <span className="w-20 opacity-30">[{new Date().toLocaleTimeString()}]</span>
                            <span className="text-blue-500/80 mr-2">SYS:</span>
                            <span>Orchestration engine initialized.</span>
                        </div>
                        <div className="text-zinc-500 flex items-start">
                            <span className="w-20 opacity-30">[{new Date().toLocaleTimeString()}]</span>
                            <span className="text-blue-500/80 mr-2">SYS:</span>
                            <span>Connected to PostgreSQL at 5432.</span>
                        </div>
                        {currentProject.started_at && (
                            <div className="text-zinc-400 flex items-start">
                                <span className="w-20 opacity-30">[{new Date(currentProject.started_at).toLocaleTimeString()}]</span>
                                <span className="text-yellow-500/80 mr-2">EXEC:</span>
                                <span>Started execution of {currentProject.research_goal}</span>
                            </div>
                        )}
                        <div className="text-green-500 animate-pulse flex items-start">
                            <span className="w-20 opacity-0">[{new Date().toLocaleTimeString()}]</span>
                            <span className="mr-2 opacity-50">$</span>
                            <span>_</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
