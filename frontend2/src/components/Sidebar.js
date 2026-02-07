"use client";

import React from 'react';
import { useProject } from '@/lib/ProjectContext';
import { Folder, Plus, Search, Archive, Settings, Activity } from 'lucide-react';

export default function Sidebar() {
    const { projects, currentProject, selectProject, refreshProjects } = useProject();

    return (
        <aside className="panel">
            <div className="header flex justify-between">
                <span>Projects</span>
                <button onClick={refreshProjects} className="p-1 hover:bg-white/10 rounded">
                    <Plus size={14} className="text-zinc-400" />
                </button>
            </div>

            <div className="p-3">
                <div className="relative mb-6">
                    <Search size={14} className="absolute left-3 top-2.5 text-zinc-600" />
                    <input
                        type="text"
                        placeholder="Search projects..."
                        className="w-full bg-black/40 border border-white/5 rounded-md py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-white/20 transition-colors"
                    />
                </div>

                <div className="mb-8 overflow-hidden rounded-md border border-white/5 bg-white/5 p-3">
                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center">
                        <Activity size={10} className="mr-1" /> Active Session
                    </div>
                    <div className="text-sm font-medium text-white truncate">
                        {currentProject ? currentProject.research_goal : 'None Selected'}
                    </div>
                    {currentProject && (
                        <div className="text-[10px] text-zinc-500 mt-1 uppercase">
                            Status: {currentProject.status}
                        </div>
                    )}
                </div>

                <nav className="space-y-1">
                    <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 px-2">Recently Modified</div>
                    {projects.map(project => (
                        <div
                            key={project.id}
                            onClick={() => selectProject(project.id)}
                            className={`group flex items-center px-2 py-2 text-xs rounded-md cursor-pointer transition-colors ${currentProject?.id === project.id ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}`}
                        >
                            <Folder size={14} className={`mr-2 ${currentProject?.id === project.id ? 'text-blue-400' : 'opacity-50'}`} />
                            <div className="truncate flex-1">{project.research_goal}</div>
                            {project.status === 'executing' && (
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse ml-2" />
                            )}
                        </div>
                    ))}
                    {projects.length === 0 && (
                        <div className="px-2 py-4 text-center text-[10px] text-zinc-600 border border-dashed border-white/5 rounded-md">
                            No projects found
                        </div>
                    )}
                </nav>
            </div>

            <div className="mt-auto p-3 border-t border-white/5 flex items-center justify-around">
                <button className="p-2 text-zinc-600 hover:text-white transition-colors">
                    <Archive size={16} />
                </button>
                <button className="p-2 text-zinc-600 hover:text-white transition-colors">
                    <Settings size={16} />
                </button>
            </div>
        </aside>
    );
}
