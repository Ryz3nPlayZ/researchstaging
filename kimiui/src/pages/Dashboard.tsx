import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban, FileText, CheckCircle2, Activity } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button, Card, CardHeader, Loading, EmptyState } from '@/components/common';
import { ProjectCard } from '@/components/project';
import { projectApi, statsApi } from '@/api/client';
import { useProjectStore } from '@/store';
import { formatRelativeTime } from '@/utils';

export function Dashboard() {
  const navigate = useNavigate();
  const { projects, isLoadingProjects, setProjects, setLoadingProjects } = useProjectStore();

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

  const recentProjects = projects.slice(0, 6);

  const stats = [
    { label: 'Total Projects', value: projects.length, icon: FolderKanban, color: 'text-kimipurple-400' },
    { label: 'Completed', value: projects.filter(p => p.status === 'completed').length, icon: CheckCircle2, color: 'text-green-400' },
    { label: 'Active', value: projects.filter(p => p.status === 'executing').length, icon: Activity, color: 'text-yellow-400' },
    { label: 'Papers', value: '-', icon: FileText, color: 'text-kimiblue-400' },
  ];

  return (
    <div className="min-h-screen">
      <Header 
        title="Dashboard" 
        subtitle="Overview of your research projects"
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="flex items-center gap-4" padding="md">
                <div className="w-12 h-12 rounded-xl bg-kimidark-700 flex items-center justify-center">
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader 
            title="Quick Start" 
            subtitle="Create a new research project or view existing ones"
          />
          <div className="flex gap-3">
            <Button 
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => navigate('/projects/new')}
            >
              New Project
            </Button>
            <Button 
              variant="secondary" 
              onClick={() => navigate('/projects')}
            >
              View All Projects
            </Button>
          </div>
        </Card>

        {/* Recent Projects */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Projects</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/projects')}
            >
              View All
            </Button>
          </div>

          {isLoadingProjects ? (
            <div className="flex items-center justify-center py-16">
              <Loading text="Loading projects..." />
            </div>
          ) : recentProjects.length === 0 ? (
            <Card>
              <EmptyState
                title="No projects yet"
                description="Create your first research project to get started with automated research."
                action={{
                  label: 'Create Project',
                  onClick: () => navigate('/projects/new'),
                }}
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentProjects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project}
                  onDelete={() => loadProjects()}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
