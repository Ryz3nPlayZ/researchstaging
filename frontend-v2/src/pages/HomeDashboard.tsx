/**
 * HomeDashboard Page
 *
 * Main landing screen with research goal input, project list,
 * and credits display. Entry point for starting new research
 * projects or continuing existing ones.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { useProjectStore } from '../stores/useProjectStore';
import { WorkspaceLayout } from '../components/layout/WorkspaceLayout';
import { Button } from '../components/common/Button';
import { CreditsDisplay } from '../components/common/CreditsDisplay';
import { getProjects } from '../services/projects';
import type { Project } from '../types/project';
import { ProjectStatus } from '../types/project';

/**
 * Get time-based greeting message
 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Get user's display name from email
 */
function getDisplayName(email: string | null): string {
  if (!email) return 'Welcome back';
  const name = email.split('@')[0];
  // Capitalize first letter
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * Get status badge color based on project status
 */
function getStatusBadgeColor(status: ProjectStatus): string {
  switch (status) {
    case ProjectStatus.COMPLETED:
      return 'var(--color-success)';
    case ProjectStatus.EXECUTING:
      return 'var(--color-ready)';
    case ProjectStatus.PLANNING:
      return 'var(--color-info)';
    case ProjectStatus.PAUSED:
      return 'var(--color-warning)';
    case ProjectStatus.FAILED:
      return 'var(--color-error)';
    case ProjectStatus.INITIALIZING:
    default:
      return 'var(--color-text-tertiary)';
  }
}

/**
 * HomeDashboard component
 */
export const HomeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setActiveProject } = useProjectStore();

  // Form state
  const [researchGoal, setResearchGoal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // Fetch projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoadingProjects(true);
        setProjectsError(null);
        const fetchedProjects = await getProjects();
        // Sort by updated_at descending, take last 5
        const sorted = fetchedProjects
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 5);
        setProjects(sorted);
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        setProjectsError('Failed to load projects');
      } finally {
        setIsLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!researchGoal.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Navigate to planning flow with research goal
      // Note: Project creation will happen in ConversationalPlanning page
      navigate('/plan', { state: { research_goal: researchGoal.trim() } });
    } catch (error) {
      console.error('Failed to navigate:', error);
      setIsSubmitting(false);
    }
  };

  // Handle project card click
  const handleProjectClick = (project: Project) => {
    setActiveProject(project);
    navigate(`/project/${project.id}`);
  };

  return (
    <WorkspaceLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header with greeting and credits */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1
              className="text-3xl font-bold mb-2"
              style={{
                color: 'var(--color-primary)',
                fontFamily: 'var(--font-family)',
                fontWeight: 'var(--font-weight-bold)',
                fontSize: 'var(--font-size-h1)',
                lineHeight: 'var(--line-height-tight)',
              }}
            >
              {getGreeting()}, {getDisplayName(user?.email || null)}
            </h1>
            <p
              className="text-base"
              style={{
                color: 'var(--color-text-secondary)',
                fontFamily: 'var(--font-family)',
                fontSize: 'var(--font-size-body)',
              }}
            >
              What would you like to research today?
            </p>
          </div>

          <CreditsDisplay showUsed={false} align="right" />
        </div>

        {/* Centered Input Section */}
        <form onSubmit={handleSubmit} className="mb-12">
          <div
            className="flex items-center gap-3 p-2 rounded-full"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <input
              type="text"
              value={researchGoal}
              onChange={(e) => setResearchGoal(e.target.value)}
              placeholder="Describe your research goal..."
              disabled={isSubmitting}
              className="flex-1 bg-transparent px-4 py-3 text-base outline-none"
              style={{
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-family)',
                fontSize: 'var(--font-size-body)',
              }}
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!researchGoal.trim() || isSubmitting}
            >
              {isSubmitting ? 'Starting...' : 'Start'}
            </Button>
          </div>
        </form>

        {/* Alternative: New Project Button */}
        <div className="mb-12">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/plan')}
            className="w-full max-w-md mx-auto block"
          >
            New Project
          </Button>
        </div>

        {/* Recent Projects Section */}
        <div>
          <h2
            className="text-xl font-semibold mb-6"
            style={{
              color: 'var(--color-primary)',
              fontFamily: 'var(--font-family)',
              fontWeight: 'var(--font-weight-semibold)',
              fontSize: 'var(--font-size-h2)',
            }}
          >
            Recent Projects
          </h2>

          {isLoadingProjects ? (
            <div
              className="text-center py-8"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Loading projects...
            </div>
          ) : projectsError ? (
            <div
              className="text-center py-8"
              style={{ color: 'var(--color-error)' }}
            >
              {projectsError}
            </div>
          ) : projects.length === 0 ? (
            <div
              className="text-center py-8"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <p className="mb-2">No projects yet</p>
              <p style={{ fontSize: 'var(--font-size-small)' }}>
                Start your first research project above
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => handleProjectClick(project)}
                  className="p-4 rounded-lg cursor-pointer transition-all hover:shadow-lg"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                  }}
                >
                  {/* Research Goal */}
                  <h3
                    className="font-medium mb-3 line-clamp-2"
                    style={{
                      color: 'var(--color-text-primary)',
                      fontFamily: 'var(--font-family)',
                      fontWeight: 'var(--font-weight-medium)',
                      fontSize: 'var(--font-size-body)',
                      lineHeight: 'var(--line-height-normal)',
                    }}
                  >
                    {project.research_goal}
                  </h3>

                  {/* Status Badge and Date */}
                  <div className="flex items-center justify-between">
                    <div
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${getStatusBadgeColor(project.status)}20`,
                        color: getStatusBadgeColor(project.status),
                        fontFamily: 'var(--font-family)',
                        fontWeight: 'var(--font-weight-medium)',
                        fontSize: 'var(--font-size-x-small)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {project.status}
                    </div>

                    <div
                      className="text-xs"
                      style={{
                        color: 'var(--color-text-tertiary)',
                        fontFamily: 'var(--font-family)',
                        fontSize: 'var(--font-size-x-small)',
                      }}
                    >
                      {new Date(project.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Task Counts */}
                  <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="flex gap-4 text-xs" style={{ fontSize: 'var(--font-size-x-small)' }}>
                      <div style={{ color: 'var(--color-text-secondary)' }}>
                        <span className="font-medium">{project.task_counts.completed}</span>
                        {' '}completed
                      </div>
                      <div style={{ color: 'var(--color-text-secondary)' }}>
                        <span className="font-medium">{project.task_counts.pending}</span>
                        {' '}pending
                      </div>
                      <div style={{ color: 'var(--color-text-secondary)' }}>
                        <span className="font-medium">{project.task_counts.running}</span>
                        {' '}running
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </WorkspaceLayout>
  );
};
