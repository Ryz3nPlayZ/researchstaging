import { useEffect, useState } from 'react';
import { Activity as ActivityIcon, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, Loading } from '@/components/common';
import { projectApi } from '@/api/client';
import { useProjectStore } from '@/store';
import { formatRelativeTime, cn } from '@/utils';
import type { ExecutionLog, Project } from '@/types';

interface LogWithProject extends ExecutionLog {
  project?: Project;
}

export function Activity() {
  const { projects } = useProjectStore();
  const [logs, setLogs] = useState<LogWithProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivity();
  }, []);

  const loadActivity = async () => {
    setIsLoading(true);
    const allLogs: LogWithProject[] = [];

    for (const project of projects.slice(0, 5)) {
      const result = await projectApi.getLogs(project.id, 20);
      if (result.data) {
        allLogs.push(...result.data.map(log => ({ ...log, project })));
      }
    }

    // Sort by timestamp desc
    allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setLogs(allLogs.slice(0, 50));
    setIsLoading(false);
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'task_completed':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'task_failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'execution_started':
        return <ActivityIcon className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="Activity" subtitle="Recent activity across all projects" />

      <div className="p-6 max-w-4xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loading text="Loading activity..." />
          </div>
        ) : (
          <Card>
            <CardHeader title="Recent Activity" />
            <div className="space-y-1">
              {logs.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No activity yet</p>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-kimidark-700/50 transition-colors"
                  >
                    <div className="mt-0.5">{getEventIcon(log.event_type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200">{log.message}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        {log.project && (
                          <span className="text-kimipurple-400">{log.project.research_goal.substring(0, 50)}...</span>
                        )}
                        <span>•</span>
                        <span>{formatRelativeTime(log.timestamp)}</span>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'text-xs uppercase px-2 py-1 rounded',
                        log.level === 'error' && 'bg-red-500/10 text-red-400',
                        log.level === 'warning' && 'bg-yellow-500/10 text-yellow-400',
                        log.level === 'info' && 'bg-blue-500/10 text-blue-400',
                        log.level === 'debug' && 'bg-gray-500/10 text-gray-400'
                      )}
                    >
                      {log.level}
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
