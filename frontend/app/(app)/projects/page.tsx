'use client';

import { useEffect, useState } from 'react';
import { projectApi } from '@/lib/api';
import type { Project } from '@/lib/types';
import { mapProjectStatus } from '@/lib/types';
import { ProjectCard } from './_components/project-card';
import { ProjectFilters } from './_components/project-filters';
import { OnboardingChat } from '@/components/research-manager/onboarding-chat';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<string>('All');
    const [search, setSearch] = useState('');
    const [showNewProject, setShowNewProject] = useState(false);

    const loadProjects = async () => {
        setLoading(true);
        const res = await projectApi.list();
        if (res.data) setProjects(res.data);
        setLoading(false);
    };

    useEffect(() => {
        // Initial data fetch on mount - valid pattern for page loading
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void loadProjects();
    }, []);

    const filtered = projects.filter((p) => {
        // Status filter
        if (activeFilter !== 'All') {
            const uiStatus = mapProjectStatus(p.status);
            if (activeFilter.toLowerCase() !== uiStatus) return false;
        }
        // Search filter
        if (search) {
            const q = search.toLowerCase();
            if (!p.research_goal.toLowerCase().includes(q)) return false;
        }
        return true;
    });

    return (
        <div className="max-w-[1200px] mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-base-800 font-ui tracking-tight">Projects</h1>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9A8A]">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.3-4.3" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9 w-60 rounded-full border border-black/[0.04] bg-[#F5F5F7] pl-9 pr-3 text-sm text-[#4A5D4A] placeholder:text-[#8A9A8A] focus:outline-none focus:border-[#73E2A7] focus:ring-1 focus:ring-[#73E2A7] transition-all font-ui"
                        />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6">
                <ProjectFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-2xl p-6 h-48 animate-pulse border border-gray-200">
                            <div className="h-2 bg-gray-200 rounded w-16 mb-4" />
                            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            ) : filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((project) => (
                        <ProjectCard key={project.id} project={project} />
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-2xl p-16 text-center border border-gray-200">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No projects found</h3>
                    <p className="text-sm text-gray-500 font-medium">
                        {search || activeFilter !== 'All'
                            ? 'Try adjusting your filters or search terms.'
                            : 'Get started by creating your first research project.'}
                    </p>
                </div>
            )}

            {/* Onboarding Dialog */}
            <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
                <DialogContent className="sm:max-w-2xl p-0 bg-transparent border-none shadow-none text-base-900">
                    <DialogTitle className="sr-only">New Project</DialogTitle>
                    <OnboardingChat />
                </DialogContent>
            </Dialog>
        </div>
    );
}
