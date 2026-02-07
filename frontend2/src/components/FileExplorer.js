"use client";

import React from 'react';
import { useProject } from '@/lib/ProjectContext';
import { FileText, Database, BookOpen, Quote, Download, Trash2, ExternalLink } from 'lucide-react';

export default function FileExplorer() {
    const { artifacts, tasks, currentProject } = useProject();

    // Group artifacts by type for a folder-like view
    const artifactGroups = artifacts.reduce((acc, artifact) => {
        const type = artifact.artifact_type;
        if (!acc[type]) acc[type] = [];
        acc[type].push(artifact);
        return acc;
    }, {});

    return (
        <div className="py-4">
            <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-4 mb-4">Generated Artifacts</div>

            {Object.keys(artifactGroups).map(type => (
                <div key={type} className="mb-6">
                    <div className="flex items-center px-4 py-1 text-[10px] text-zinc-400 uppercase font-bold tracking-tighter opacity-60">
                        <span className="mr-2 opacity-50">📂</span>
                        {type.replace('_', ' ')}
                    </div>
                    <div className="mt-1">
                        {artifactGroups[type].map(artifact => (
                            <div
                                key={artifact.id}
                                className="group flex items-center px-4 py-2 text-xs text-zinc-500 hover:bg-white/5 hover:text-zinc-300 cursor-pointer transition-colors"
                            >
                                <FileText size={14} className="mr-2 text-zinc-600" />
                                <span className="truncate flex-1">{artifact.title || 'Untitled Artifact'}</span>
                                <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-2">
                                    <Download size={12} className="hover:text-blue-400" />
                                    <ExternalLink size={12} className="hover:text-blue-400" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {Object.keys(artifactGroups).length === 0 && (
                <div className="px-4 py-8 text-center border border-dashed border-white/5 mx-4 rounded-lg">
                    <Database size={24} className="mx-auto text-zinc-800 mb-2" />
                    <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">Storage Empty</div>
                </div>
            )}

            {/* References Section */}
            <div className="mt-10 border-t border-white/5 pt-6">
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-4 mb-4">Citation Library</div>
                <div className="px-4 py-2 flex items-center text-xs text-zinc-500 italic">
                    <BookOpen size={14} className="mr-2 opacity-30" />
                    <span>Reference graph indexing...</span>
                </div>
            </div>
        </div>
    );
}
