import { useState, useEffect, useCallback } from 'react';
import { useProject } from '../../context/ProjectContext';
import { projectsApi, statsApi } from '../../lib/api';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { 
  Plus, 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  FolderOpen,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const Dashboard = ({ onCreateProject, onSelectProject }) => {
  const { triggerRefresh, refreshTrigger } = useProject();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [projectsRes, statsRes] = await Promise.all([
        projectsApi.list(),
        statsApi.getGlobal()
      ]);
      setProjects(projectsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'running':
        return { icon: Loader2, className: 'bg-blue-500/10 text-blue-500 border-blue-500/20', animate: true };
      case 'completed':
        return { icon: CheckCircle, className: 'bg-green-500/10 text-green-500 border-green-500/20' };
      case 'failed':
        return { icon: XCircle, className: 'bg-red-500/10 text-red-500 border-red-500/20' };
      default:
        return { icon: Clock, className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' };
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col" data-testid="dashboard">
      <ScrollArea className="flex-1">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight font-['IBM_Plex_Sans'] mb-3">
              Welcome to Research Pilot
            </h1>
            <p className="text-muted-foreground text-base max-w-lg mx-auto mb-8">
              Your AI-powered research execution system. Create a project to start discovering, 
              synthesizing, and drafting research automatically.
            </p>
            
            <Button 
              size="lg" 
              onClick={onCreateProject}
              className="h-12 px-8 text-base"
              data-testid="create-project-cta"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create New Project
            </Button>
          </div>

          {/* Stats Summary */}
          {stats && (stats.projects > 0 || stats.tasks > 0) && (
            <div className="grid grid-cols-4 gap-4 mb-10">
              <Card className="bg-muted/30">
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="text-2xl font-semibold font-mono">{stats.projects || 0}</div>
                  <div className="text-xs text-muted-foreground">Projects</div>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="text-2xl font-semibold font-mono">{stats.papers || 0}</div>
                  <div className="text-xs text-muted-foreground">Papers Found</div>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="text-2xl font-semibold font-mono">{stats.artifacts || 0}</div>
                  <div className="text-xs text-muted-foreground">Documents</div>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="text-2xl font-semibold font-mono">
                    {stats.task_breakdown?.completed || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Tasks Done</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Projects */}
          {projects.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold tracking-tight font-['IBM_Plex_Sans'] mb-4 flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                Recent Projects
              </h2>
              
              <div className="space-y-3">
                {projects.slice(0, 5).map((project) => {
                  const statusConfig = getStatusConfig(project.status);
                  const StatusIcon = statusConfig.icon;
                  
                  return (
                    <Card 
                      key={project.id}
                      className="cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => onSelectProject(project)}
                      data-testid={`project-card-${project.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate mb-1">
                              {project.research_goal}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="capitalize">{project.output_type?.replace('_', ' ')}</span>
                              <span>•</span>
                              <span>{formatDate(project.updated_at)}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {/* Task Progress */}
                            {project.task_counts && (
                              <div className="flex items-center gap-1.5 text-xs font-mono">
                                <span className="text-green-500">{project.task_counts.completed || 0}</span>
                                <span className="text-muted-foreground">/</span>
                                <span className="text-muted-foreground">
                                  {(project.task_counts.pending || 0) + 
                                   (project.task_counts.running || 0) + 
                                   (project.task_counts.completed || 0) + 
                                   (project.task_counts.failed || 0)}
                                </span>
                              </div>
                            )}
                            
                            <Badge 
                              variant="outline" 
                              className={`${statusConfig.className} gap-1`}
                            >
                              <StatusIcon className={`h-3 w-3 ${statusConfig.animate ? 'animate-spin' : ''}`} />
                              <span className="capitalize">{project.status}</span>
                            </Badge>
                            
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {projects.length > 5 && (
                <p className="text-xs text-muted-foreground text-center mt-4">
                  +{projects.length - 5} more projects in navigator
                </p>
              )}
            </div>
          )}

          {/* Empty State */}
          {projects.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Activity className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="font-medium mb-1">No projects yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first research project to get started.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
