
import React, { useState, useEffect } from 'react';
import { projectApi, Project } from '../lib/api';
import { View } from '../types';
import { useProjectContext } from '../lib/context';
import LoadingSpinner from '../components/LoadingSpinner';

const DashboardView: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setCurrentProject } = useProjectContext();
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

  // Click outside handler for menus
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
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
        // Set project context but stay on dashboard (workspace view)
        setCurrentProject(response.data);
        // Show success notification
        console.log(`Project '${response.data.research_goal}' created successfully`);
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

  // Handle project tile click
  const handleProjectClick = (project: Project) => {
    setCurrentProject(project);
    // Dispatch custom event to notify App to switch view
    const event = new CustomEvent('navigate-to-project', { detail: { projectId: project.id } });
    window.dispatchEvent(event);
  };

  // Filter projects by status
  const filteredProjects = projects.filter(project => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return project.status === 'in_progress' || project.status === 'pending';
    if (filterStatus === 'completed') return project.status === 'completed';
    return true;
  });

  // Split projects into recent (first 3) and all projects
  const recentProjectsData = filteredProjects.slice(0, 3);
  const allProjectsData = filteredProjects;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-10">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Projects</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your research library and ongoing studies.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
                Filter
              </button>
              {filterOpen && (
                <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-50 min-w-[150px]">
                  <button
                    onClick={() => { setFilterStatus('all'); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm ${filterStatus === 'all' ? 'bg-primary/10 text-primary' : 'text-slate-700 dark:text-slate-200'} hover:bg-slate-100 dark:hover:bg-slate-800`}
                  >
                    All Projects
                  </button>
                  <button
                    onClick={() => { setFilterStatus('active'); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm ${filterStatus === 'active' ? 'bg-primary/10 text-primary' : 'text-slate-700 dark:text-slate-200'} hover:bg-slate-100 dark:hover:bg-slate-800`}
                  >
                    Active
                  </button>
                  <button
                    onClick={() => { setFilterStatus('completed'); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm ${filterStatus === 'completed' ? 'bg-primary/10 text-primary' : 'text-slate-700 dark:text-slate-200'} hover:bg-slate-100 dark:hover:bg-slate-800`}
                  >
                    Completed
                  </button>
                </div>
              )}
            </div>
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
                  <div key={project.id} onClick={() => handleProjectClick(project)} className="relative group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`size-12 rounded-lg flex items-center justify-center text-2xl ${getRecentProjectBg(i)}`}>
                        {getProjectIcon(project.output_type)}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === project.id ? null : project.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
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
                    {openMenuId === project.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-12 right-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-50 min-w-[160px] py-1"
                      >
                        <button
                          onClick={() => {
                            // TODO: Implement rename
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                          Rename
                        </button>
                        <button
                          onClick={async () => {
                            // TODO: Implement delete with confirmation
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                          Delete
                        </button>
                      </div>
                    )}
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
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1 ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500'} rounded-md text-xs font-bold`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow-sm' : 'text-slate-500'} rounded-md text-xs font-bold`}
                  >
                    List
                  </button>
                </div>
              </div>
            </div>

            {/* List View */}
            {viewMode === 'list' && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Tasks</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {allProjectsData.map((project) => (
                      <tr key={project.id} onClick={() => handleProjectClick(project)} className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{getProjectIcon(project.output_type)}</span>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">{project.research_goal}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{project.output_type}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${project.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                              project.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                                'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                            {project.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {project.task_counts?.total || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                          {formatRelativeTime(project.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* New Project Card - First */}
                <div
                  onClick={handleCreateProject}
                  className="group bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 hover:border-primary hover:bg-primary/5 cursor-pointer flex flex-col items-center justify-center min-h-[200px] transition-all"
                >
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl mb-3 group-hover:bg-primary group-hover:text-white transition-all">
                    <span className="material-symbols-outlined">add</span>
                  </div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">Create New Project</p>
                </div>

                {/* Existing Projects */}
                {allProjectsData.map((project, i) => (
                  <div
                    key={project.id}
                    onClick={() => handleProjectClick(project)}
                    className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className={`h-1.5 w-full ${getProjectColor(i)}`}></div>
                    <div className="p-5">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xl">{getProjectIcon(project.output_type)}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === project.id ? null : project.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
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
                    {openMenuId === project.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-12 right-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg z-50 min-w-[160px] py-1"
                      >
                        <button
                          onClick={() => {
                            // TODO: Implement rename
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                          Rename
                        </button>
                        <button
                          onClick={async () => {
                            // TODO: Implement delete with confirmation
                            setOpenMenuId(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default DashboardView;
