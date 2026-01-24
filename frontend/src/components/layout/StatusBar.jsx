import { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useProject } from '../../context/ProjectContext';
import { statsApi } from '../../lib/api';
import { Button } from '../ui/button';
import { Sun, Moon, Activity, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';

export const StatusBar = ({ onLogoClick }) => {
  const { theme, toggleTheme } = useTheme();
  const { selectedProject, refreshTrigger } = useProject();
  const [stats, setStats] = useState({
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (selectedProject) {
          setStats(selectedProject.task_counts || {
            pending: 0,
            running: 0,
            completed: 0,
            failed: 0,
          });
        } else {
          const response = await statsApi.getGlobal();
          setStats(response.data.task_breakdown || {
            pending: 0,
            running: 0,
            completed: 0,
            failed: 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedProject, refreshTrigger]);

  return (
    <header 
      className="h-12 flex-none z-50 flex items-center justify-between px-4 bg-background/80 backdrop-blur-md border-b border-border"
      data-testid="status-bar"
    >
      <div className="flex items-center gap-4">
        <button 
          onClick={onLogoClick}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          data-testid="logo-btn"
        >
          <Activity className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm tracking-tight font-['IBM_Plex_Sans']">
            Research Pilot
          </span>
        </button>
        
        {selectedProject && (
          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
            {selectedProject.research_goal}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-6">
        {/* Task Status Indicators */}
        <div className="flex items-center gap-4 text-xs" data-testid="task-status-indicators">
          <div 
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"
            data-testid="pending-count"
          >
            <Clock className="h-3.5 w-3.5" />
            <span className="font-mono">{loading ? '-' : (stats.pending || 0)}</span>
            <span className="hidden sm:inline">pending</span>
          </div>
          
          <div 
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20"
            data-testid="running-count"
          >
            <Loader2 className={`h-3.5 w-3.5 ${stats.running > 0 ? 'animate-spin' : ''}`} />
            <span className="font-mono">{loading ? '-' : (stats.running || 0)}</span>
            <span className="hidden sm:inline">running</span>
          </div>
          
          <div 
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-500/10 text-green-500 border border-green-500/20"
            data-testid="completed-count"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            <span className="font-mono">{loading ? '-' : (stats.completed || 0)}</span>
            <span className="hidden sm:inline">done</span>
          </div>
          
          <div 
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 text-red-500 border border-red-500/20"
            data-testid="failed-count"
          >
            <XCircle className="h-3.5 w-3.5" />
            <span className="font-mono">{loading ? '-' : (stats.failed || 0)}</span>
            <span className="hidden sm:inline">failed</span>
          </div>
        </div>
        
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="h-8 w-8 p-0"
          data-testid="theme-toggle"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  );
};
