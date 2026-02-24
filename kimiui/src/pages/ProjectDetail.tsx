import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  ArrowLeft,
  FileText,
  ScrollText,
  BookOpen,
  Terminal,
  Activity
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button, Card, CardHeader, Loading, Badge } from '@/components/common';
import { TaskList, ArtifactList, PaperList, LogViewer } from '@/components/project';
import { projectApi, taskApi, createWebSocket } from '@/api/client';
import { useProjectStore } from '@/store';
import { formatDateTime, cn } from '@/utils';
import type { Project, Task, Artifact, Paper, ExecutionLog } from '@/types';

type Tab = 'overview' | 'tasks' | 'artifacts' | 'papers' | 'logs';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const wsRef = useRef<WebSocket | null>(null);
  
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const { 
    currentProject, 
    tasks, 
    artifacts, 
    papers, 
    logs,
    setCurrentProject, 
    setTasks, 
    setArtifacts, 
    setPapers, 
    setLogs 
  } = useProjectStore();

  useEffect(() => {
    if (id) {
      loadProject(id);
      loadProjectData(id);
      setupWebSocket(id);
    }
    
    return () => {
      wsRef.current?.close();
    };
  }, [id]);

  const loadProject = async (projectId: string) => {
    const result = await projectApi.get(projectId);
    if (result.data) {
      setCurrentProject(result.data);
    }
  };

  const loadProjectData = async (projectId: string) => {
    setIsLoading(true);
    
    const [tasksRes, artifactsRes, papersRes, logsRes] = await Promise.all([
      projectApi.getTasks(projectId),
      projectApi.getArtifacts(projectId),
      projectApi.getPapers(projectId),
      projectApi.getLogs(projectId),
    ]);

    if (tasksRes.data) setTasks(tasksRes.data);
    if (artifactsRes.data) setArtifacts(artifactsRes.data);
    if (papersRes.data) setPapers(papersRes.data);
    if (logsRes.data) setLogs(logsRes.data);
    
    setIsLoading(false);
  };

  const setupWebSocket = (projectId: string) => {
    const ws = createWebSocket(projectId);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('WebSocket message:', data);
      
      // Refresh data on relevant events
      if (data.event_type === 'task_state_changed' || 
          data.event_type === 'execution_started' ||
          data.event_type === 'execution_completed') {
        loadProject(projectId);
        loadProjectData(projectId);
      }
      
      // Add to logs if it's a log event
      if (data.event_type === 'log') {
        setLogs([data.payload, ...logs].slice(0, 100));
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    wsRef.current = ws;
  };

  const handleExecute = async () => {
    if (!id) return;
    setIsExecuting(true);
    const result = await projectApi.execute(id);
    if (result.data) {
      loadProject(id);
    }
    setIsExecuting(false);
  };

  const handleRetryTask = async (taskId: string) => {
    const result = await taskApi.retry(taskId);
    if (!result.error && id) {
      loadProjectData(id);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Are you sure you want to delete this project?')) return;
    
    const result = await projectApi.delete(id);
    if (!result.error) {
      navigate('/projects');
    }
  };

  const tabs: { value: Tab; label: string; icon: typeof FileText; count?: number }[] = [
    { value: 'overview', label: 'Overview', icon: Activity },
    { value: 'tasks', label: 'Tasks', icon: FileText, count: tasks.length },
    { value: 'artifacts', label: 'Artifacts', icon: ScrollText, count: artifacts.length },
    { value: 'papers', label: 'Papers', icon: BookOpen, count: papers.length },
    { value: 'logs', label: 'Logs', icon: Terminal, count: logs.length },
  ];

  const runningTasks = tasks.filter(t => t.state === 'running').length;
  const completedTasks = tasks.filter(t => t.state === 'completed').length;
  const failedTasks = tasks.filter(t => t.state === 'failed').length;

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header title="Loading..." />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loading text="Loading project..." />
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen">
        <Header title="Project Not Found" />
        <div className="p-6">
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">Project not found or has been deleted.</p>
              <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header 
        title={currentProject.research_goal.substring(0, 60) + (currentProject.research_goal.length > 60 ? '...' : '')}
        subtitle={`${currentProject.output_type.replace('_', ' ')} • Created ${formatDateTime(currentProject.created_at)}`}
      >
        <div className="flex items-center gap-2">
          {currentProject.status === 'executing' ? (
            <Button variant="secondary" leftIcon={<Pause className="w-4 h-4" />} disabled>
              Running...
            </Button>
          ) : (
            <Button 
              leftIcon={<Play className="w-4 h-4" />}
              onClick={handleExecute}
              isLoading={isExecuting}
            >
              Execute
            </Button>
          )}
          <Button 
            variant="ghost" 
            leftIcon={<Trash2 className="w-4 h-4" />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </Header>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card padding="sm" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{runningTasks}</p>
              <p className="text-xs text-gray-400">Running</p>
            </div>
          </Card>
          <Card padding="sm" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{completedTasks}</p>
              <p className="text-xs text-gray-400">Completed</p>
            </div>
          </Card>
          <Card padding="sm" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{failedTasks}</p>
              <p className="text-xs text-gray-400">Failed</p>
            </div>
          </Card>
          <Card padding="sm" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-white">{papers.length}</p>
              <p className="text-xs text-gray-400">Papers</p>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="border-b border-kimidark-600">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                    activeTab === tab.value
                      ? 'text-kimipurple-400 border-kimipurple-500'
                      : 'text-gray-400 border-transparent hover:text-white hover:border-kimidark-500'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-kimidark-700 rounded-full">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader title="Tasks" action={
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('tasks')}>View All</Button>
                } />
                <TaskList tasks={tasks.slice(0, 5)} onRetry={handleRetryTask} />
              </Card>
              <Card>
                <CardHeader title="Recent Artifacts" action={
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('artifacts')}>View All</Button>
                } />
                <ArtifactList artifacts={artifacts.slice(0, 5)} />
              </Card>
            </div>
          )}

          {activeTab === 'tasks' && (
            <Card>
              <CardHeader title="All Tasks" />
              <TaskList tasks={tasks} onRetry={handleRetryTask} />
            </Card>
          )}

          {activeTab === 'artifacts' && (
            <Card>
              <CardHeader title="Artifacts" />
              <ArtifactList artifacts={artifacts} />
            </Card>
          )}

          {activeTab === 'papers' && (
            <Card>
              <CardHeader title="Papers" />
              <PaperList papers={papers} />
            </Card>
          )}

          {activeTab === 'logs' && (
            <Card>
              <CardHeader title="Execution Logs" />
              <LogViewer logs={logs} maxHeight="600px" />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
