
import React, { useState, useEffect } from 'react';
import { projectApi, Project } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';

const DashboardView: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await projectApi.list();
        if (response.error) {
          setError(response.error);
          console.error('Failed to fetch projects:', response.error);
        } else if (response.data) {
          setProjects(response.data);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Handle create project
  const handleCreateProject = async () => {
    try {
      const response = await projectApi.create({
        research_goal: 'New Research Project',
        output_type: 'research_paper'
      });
      if (response.error) {
        setError(response.error);
        console.error('Failed to create project:', response.error);
      } else if (response.data) {
        setProjects([response.data, ...projects]);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      console.error('Error creating project:', err);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return `${Math.floor(seconds / 604800)} weeks ago`;
  };

  // Get icon for output type
  const getProjectIcon = (outputType: string): string => {
    const icons: Record<string, string> = {
      'research_paper': '📄',
      'literature_review': '📚',
      'research_brief': '📝',
      'analysis': '📊',
      'presentation': '📽️',
      'report': '📝'
    };
    return icons[outputType] || '📄';
  };

  // Get color class for project
  const getProjectColor = (index: number): string => {
    const colors = [
      'bg-primary/40',
      'bg-emerald-400/40',
      'bg-amber-400/40',
      'bg-rose-400/40',
      'bg-indigo-400/40'
    ];
    return colors[index % colors.length];
  };

  // Get background class for recent projects
  const getRecentProjectBg = (index: number): string => {
    const bgs = [
      'bg-blue-50 dark:bg-blue-900/30',
      'bg-purple-50 dark:bg-purple-900/30',
      'bg-amber-50 dark:bg-amber-900/30'
    ];
    return bgs[index % bgs.length];
  };

  // Split projects into recent (first 3) and all projects
  const recentProjectsData = projects.slice(0, 3);
  const allProjectsData = projects;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-10">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Projects</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your research library and ongoing studies.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined text-[20px]">filter_list</span>
              Filter
            </button>
            <button
              onClick={handleCreateProject}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              Create Project
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-20">
            <LoadingSpinner text="Loading projects..." />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-red-500">error</span>
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-200">Failed to load projects</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Projects Section */}
        {!loading && !error && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">schedule</span>
                Recent Projects
              </h2>
              <button className="text-sm font-semibold text-primary hover:underline">View all</button>
            </div>
            {recentProjectsData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentProjectsData.map((project, i) => (
                  <div key={project.id} className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`size-12 rounded-lg flex items-center justify-center text-2xl ${getRecentProjectBg(i)}`}>
                        {getProjectIcon(project.output_type)}
                      </div>
                      <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </div>
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-2">
                      {project.research_goal}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                      {project.audience || `Research on ${project.output_type}`}
                    </p>
                    <div className="mt-6 flex items-center gap-4 text-xs font-medium text-slate-400 dark:text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">description</span>
                        {project.task_counts?.total || 0} tasks
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {formatRelativeTime(project.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-slate-500 dark:text-slate-400">No recent projects found</p>
              </div>
            )}
          </section>
        )}

        {/* All Projects Section */}
        {!loading && !error && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">grid_view</span>
                All Projects
              </h2>
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                <button className="px-3 py-1 bg-white dark:bg-slate-800 shadow-sm rounded-md text-xs font-bold">Grid</button>
                <button className="px-3 py-1 text-slate-500 text-xs font-bold hover:text-slate-700">List</button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {allProjectsData.map((project, i) => (
                <div key={project.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  <div className={`h-1.5 w-full ${getProjectColor(i)}`}></div>
                  <div className="p-5">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xl">{getProjectIcon(project.output_type)}</span>
                      <span className="material-symbols-outlined text-slate-400">more_vert</span>
                    </div>
                    <h4 className="font-bold text-base mb-1 truncate">{project.research_goal}</h4>
                    <p className="text-xs text-slate-400 mb-4">Edited {formatRelativeTime(project.updated_at)}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-500">{project.task_counts?.total || 0} tasks</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-500 uppercase">
                        {project.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div
                onClick={handleCreateProject}
                className="border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center p-5 group hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer min-h-[160px]"
              >
                <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-primary">add</span>
                </div>
                <span className="text-sm font-semibold text-slate-500 group-hover:text-primary">New Project</span>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default DashboardView;
