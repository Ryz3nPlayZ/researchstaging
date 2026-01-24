import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import {
  AlertTriangle,
  RefreshCw,
  XCircle,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  Bug,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';

export const TaskErrorRecovery = ({ tasks, projectId, onRetrySuccess }) => {
  const [retrying, setRetrying] = useState({});
  const [expanded, setExpanded] = useState({});

  const failedTasks = tasks?.filter(t => t.state === 'failed') || [];

  const handleRetry = async (taskId, taskName) => {
    setRetrying(prev => ({ ...prev, [taskId]: true }));
    
    try {
      const API_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${API_URL}/api/tasks/${taskId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Retry failed');
      }
      
      toast.success(`Retrying task: ${taskName}`);
      onRetrySuccess?.();
    } catch (error) {
      toast.error(`Failed to retry: ${error.message}`);
    } finally {
      setRetrying(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const handleRetryAll = async () => {
    for (const task of failedTasks) {
      await handleRetry(task.id, task.name);
    }
  };

  if (failedTasks.length === 0) {
    return null;
  }

  return (
    <Card className="border-red-500/30 bg-red-500/5" data-testid="error-recovery-panel">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-base">Failed Tasks ({failedTasks.length})</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetryAll}
            disabled={Object.values(retrying).some(Boolean)}
            className="border-red-500/30 text-red-600 hover:bg-red-500/10"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry All
          </Button>
        </div>
        <CardDescription className="text-xs">
          Some tasks failed during execution. Review errors and retry.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-2">
            {failedTasks.map(task => (
              <Collapsible
                key={task.id}
                open={expanded[task.id]}
                onOpenChange={(open) => setExpanded(prev => ({ ...prev, [task.id]: open }))}
              >
                <div className="border border-red-500/20 rounded-lg overflow-hidden bg-background">
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center justify-between p-3 hover:bg-red-500/5 transition-colors">
                      <div className="flex items-center gap-2">
                        {expanded[task.id] ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium">{task.name}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {task.task_type?.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {task.retry_count > 0 && (
                          <Badge variant="secondary" className="text-[10px]">
                            {task.retry_count}/{task.max_retries} retries
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRetry(task.id, task.name);
                          }}
                          disabled={retrying[task.id]}
                          className="h-7 px-2"
                        >
                          {retrying[task.id] ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-3 pb-3 pt-0 border-t border-red-500/20">
                      {/* Error Message */}
                      {task.error_message && (
                        <div className="mt-2">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Bug className="h-3 w-3 text-red-500" />
                            <span className="text-[10px] text-red-500 uppercase tracking-wider font-medium">
                              Error Message
                            </span>
                          </div>
                          <div className="bg-red-500/10 border border-red-500/20 rounded p-2">
                            <code className="text-xs text-red-400 font-mono whitespace-pre-wrap break-all">
                              {task.error_message}
                            </code>
                          </div>
                        </div>
                      )}
                      
                      {/* Task Info */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Phase:</span>
                          <span className="ml-1 font-mono">{task.phase_index}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Sequence:</span>
                          <span className="ml-1 font-mono">{task.sequence_index}</span>
                        </div>
                        {task.started_at && (
                          <div className="col-span-2 flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Started: {new Date(task.started_at).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Description */}
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-2 italic">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TaskErrorRecovery;
