import { useNavigate } from 'react-router-dom';
import { Play, Trash2, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/common';
import { StatusIndicator } from '@/components/common';
import { formatRelativeTime, truncate } from '@/utils';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/projects/${project.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(project.id);
  };

  const completedTasks = project.task_counts?.completed || 0;
  const totalTasks = project.task_counts?.total || 0;
  const failedTasks = project.task_counts?.failed || 0;

  return (
    <Card hover className="group cursor-pointer relative overflow-hidden" padding="md">
      <div onClick={handleClick} className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <StatusIndicator status={project.status} showLabel size="sm" />
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <h3 className="text-base font-semibold text-white mb-2 line-clamp-2">
          {truncate(project.research_goal, 100)}
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          {project.output_type.replace('_', ' ')}
        </p>

        {/* Stats */}
        <div className="mt-auto pt-4 border-t border-kimidark-600">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-gray-400">
                <FileText className="w-4 h-4" />
                <span>{totalTasks}</span>
              </div>
              <div className="flex items-center gap-1.5 text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>{completedTasks}</span>
              </div>
              {failedTasks > 0 && (
                <div className="flex items-center gap-1.5 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>{failedTasks}</span>
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {formatRelativeTime(project.updated_at)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
