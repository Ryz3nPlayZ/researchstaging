import { CheckCircle2, Circle, Clock, AlertCircle, Play, RotateCcw } from 'lucide-react';
import { cn, formatRelativeTime } from '@/utils';
import { Button } from '@/components/common';
import type { Task } from '@/types';

interface TaskListProps {
  tasks: Task[];
  onRetry?: (taskId: string) => void;
}

const statusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  failed: <AlertCircle className="w-4 h-4 text-red-500" />,
  running: <Play className="w-4 h-4 text-yellow-500" />,
  pending: <Circle className="w-4 h-4 text-gray-500" />,
  ready: <Clock className="w-4 h-4 text-blue-500" />,
  waiting: <Clock className="w-4 h-4 text-orange-500" />,
};

export function TaskList({ tasks, onRetry }: TaskListProps) {
  // Group tasks by phase
  const tasksByPhase = tasks.reduce((acc, task) => {
    const phase = task.phase_index;
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(task);
    return acc;
  }, {} as Record<number, Task[]>);

  return (
    <div className="space-y-6">
      {Object.entries(tasksByPhase).map(([phase, phaseTasks]) => (
        <div key={phase}>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
            Phase {parseInt(phase) + 1}
          </h4>
          <div className="space-y-2">
            {phaseTasks
              .sort((a, b) => a.sequence_index - b.sequence_index)
              .map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                    task.state === 'running'
                      ? 'bg-yellow-500/5 border-yellow-500/20'
                      : task.state === 'completed'
                      ? 'bg-green-500/5 border-green-500/10'
                      : task.state === 'failed'
                      ? 'bg-red-500/5 border-red-500/10'
                      : 'bg-kimidark-700/50 border-kimidark-600'
                  )}
                >
                  <div className="flex-shrink-0">
                    {statusIcons[task.state] || statusIcons.pending}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">
                        {task.name}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">
                        {task.task_type.replace('_', ' ')}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-xs text-gray-400 truncate">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {task.retry_count > 0 && (
                      <span className="text-xs text-gray-500">
                        Retry {task.retry_count}/{task.max_retries}
                      </span>
                    )}
                    
                    {task.state === 'failed' && onRetry && (
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<RotateCcw className="w-3 h-3" />}
                        onClick={() => onRetry(task.id)}
                      >
                        Retry
                      </Button>
                    )}

                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(task.updated_at)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
