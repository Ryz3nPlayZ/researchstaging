import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Trash2, Play } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button, Card, Loading, EmptyState } from '@/components/common';
import { ProjectCard } from '@/components/project';
import { projectApi } from '@/api/client';
import { useProjectStore } from '@/store';
import { cn } from '@/utils';
import type { Project } from '@/types';

const filters = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

export function ProjectList() {
  const navigate = useNavigate();
  const { projects, isLoadingProjects, setProjects, setLoadingProjects } = useProjectStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoadingProjects(true);
    const result = await projectApi.list();
    if (result.data) {
      setProjects(result.data);
    }
    setLoadingProjects(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    setIsDeleting(id);
    const result = await projectApi.delete(id);
    if (!result.error) {
      setProjects(projects.filter(p => p.id !== id));
    }
    setIsDeleting(null);
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.research_goal.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'all' || 
      (activeFilter === 'active' && (project.status === 'executing' || project.status === 'planned')) ||
      (activeFilter === 'completed' && project.status === 'completed') ||
      (activeFilter === 'failed' && project.status === 'failed');
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen">
      <Header title="Projects" subtitle="Manage your research projects">
        <Button 
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/projects/new')}
        >
          New Project
        </Button>
      </Header>

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 bg-kimidark-800 border border-kimidark-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-kimipurple-500/50"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="flex gap-1">
              {filters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    activeFilter === filter.value
                      ? 'bg-kimipurple-500/20 text-kimipurple-400 border border-kimipurple-500/30'
                      : 'text-gray-400 hover:text-white hover:bg-kimidark-700'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {isLoadingProjects ? (
          <div className="flex items-center justify-center py-16">
            <Loading text="Loading projects..." />
          </div>
        ) : filteredProjects.length === 0 ? (
          <Card>
            <EmptyState
              title={searchQuery ? 'No matching projects' : 'No projects yet'}
              description={
                searchQuery 
                  ? 'Try adjusting your search query.' 
                  : 'Create your first research project to get started.'
              }
              action={
                !searchQuery && {
                  label: 'Create Project',
                  onClick: () => navigate('/projects/new'),
                }
              }
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
