import { useEffect, useState, useCallback } from 'react';
import { useProject } from '../../context/ProjectContext';
import { projectsApi, tasksApi, artifactsApi, papersApi } from '../../lib/api';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  ListTodo,
  FileText,
  BookOpen,
  Plus,
  RefreshCw,
  Files
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { FileExplorer } from '../files/FileExplorer';

const NavSection = ({ title, icon: Icon, children, defaultOpen = true, count = 0 }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-2">
      <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
        <div className="flex items-center gap-2">
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <Icon className="h-3.5 w-3.5" />
          <span className="uppercase tracking-wider">{title}</span>
        </div>
        {count > 0 && (
          <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{count}</span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-1 ml-4 space-y-0.5">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

const NavItem = ({ children, active, onClick, className }) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors",
      "hover:bg-accent hover:text-accent-foreground",
      active && "bg-primary/10 text-primary",
      className
    )}
  >
    {children}
  </button>
);

export const Navigator = ({ onCreateProject, onSelectProject, collapsed = false }) => {
  const {
    selectedProject,
    setSelectedProject,
    selectedTask,
    setSelectedTask,
    selectedArtifact,
    setSelectedArtifact,
    selectedPaper,
    setSelectedPaper,
    selectedFile,
    setSelectedFile,
    refreshTrigger,
    triggerRefresh
  } = useProject();
  
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [navigatorView, setNavigatorView] = useState('tasks'); // 'tasks' or 'files'

  const fetchProjects = useCallback(async () => {
    try {
      const response = await projectsApi.list();
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  }, []);

  const fetchProjectData = useCallback(async (projectId) => {
    try {
      const [tasksRes, artifactsRes, papersRes] = await Promise.all([
        tasksApi.listByProject(projectId),
        artifactsApi.listByProject(projectId),
        papersApi.listByProject(projectId),
      ]);
      setTasks(tasksRes.data);
      setArtifacts(artifactsRes.data);
      setPapers(papersRes.data);
    } catch (error) {
      console.error('Failed to fetch project data:', error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchProjects();
      setLoading(false);
    };
    init();
  }, [fetchProjects, refreshTrigger]);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectData(selectedProject.id);
    } else {
      setTasks([]);
      setArtifacts([]);
      setPapers([]);
    }
  }, [selectedProject, fetchProjectData, refreshTrigger]);

  const handleRefresh = () => {
    triggerRefresh();
  };

  const handleSelectProject = async (project) => {
    setSelectedProject(project);
    setSelectedTask(null);
    setSelectedArtifact(null);
    setSelectedPaper(null);
    setSelectedFile(null);
    onSelectProject?.(project);
  };

  const handleFileSelect = (file) => {
    setSelectedFile(file);
    setSelectedTask(null);
    setSelectedArtifact(null);
    setSelectedPaper(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-500';
      case 'ready': return 'text-yellow-500';
      case 'running': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div 
      className="h-full w-full overflow-hidden flex flex-col"
      data-testid="navigator"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border flex-shrink-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Navigator</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleRefresh}
            data-testid="refresh-nav-btn"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={onCreateProject}
            data-testid="new-project-btn"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* View Toggle - Only show when project is selected */}
      {selectedProject && (
        <div className="px-2 py-1 border-b border-border flex-shrink-0">
          <Tabs
            value={navigatorView}
            onValueChange={setNavigatorView}
            className="w-full"
          >
            <TabsList className="w-full h-7 grid grid-cols-2">
              <TabsTrigger value="tasks" className="text-xs h-6">
                <ListTodo className="h-3 w-3 mr-1" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="files" className="text-xs h-6">
                <Files className="h-3 w-3 mr-1" />
                Files
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}
      
      <ScrollArea className="flex-1">
        {/* No project selected - show projects list */}
        {!selectedProject && (
          <div className="p-2">
            <NavSection title="Projects" icon={FolderOpen} count={projects.length}>
              {loading ? (
                <div className="text-xs text-muted-foreground px-2 py-1">Loading...</div>
              ) : projects.length === 0 ? (
                <div className="text-xs text-muted-foreground px-2 py-1">No projects yet</div>
              ) : (
                projects.map(project => (
                  <NavItem
                    key={project.id}
                    active={selectedProject?.id === project.id}
                    onClick={() => handleSelectProject(project)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate text-xs">{project.research_goal.slice(0, 30)}...</span>
                      <span className={cn("text-[10px]", getStatusColor(project.status))}>
                        {project.status}
                      </span>
                    </div>
                  </NavItem>
                ))
              )}
            </NavSection>
          </div>
        )}

        {/* Project selected - show either tasks or files view */}
        {selectedProject && navigatorView === 'tasks' && (
          <div className="p-2">
            {/* Tasks Section */}
            <NavSection title="Tasks" icon={ListTodo} count={tasks.length}>
              {tasks.length === 0 ? (
                <div className="text-xs text-muted-foreground px-2 py-1">No tasks</div>
              ) : (
                tasks.map(task => (
                  <NavItem
                    key={task.id}
                    active={selectedTask?.id === task.id}
                    onClick={() => {
                      setSelectedTask(task);
                      setSelectedArtifact(null);
                      setSelectedPaper(null);
                      setSelectedFile(null);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate text-xs">{task.name}</span>
                      <span className={cn("text-[10px] capitalize", getStatusColor(task.state || task.status))}>
                        {task.state || task.status}
                      </span>
                    </div>
                  </NavItem>
                ))
              )}
            </NavSection>

            {/* Documents Section */}
            <NavSection title="Documents" icon={FileText} count={artifacts.length}>
              {artifacts.length === 0 ? (
                <div className="text-xs text-muted-foreground px-2 py-1">No documents yet</div>
              ) : (
                artifacts.map(artifact => (
                  <NavItem
                    key={artifact.id}
                    active={selectedArtifact?.id === artifact.id}
                    onClick={() => {
                      setSelectedArtifact(artifact);
                      setSelectedTask(null);
                      setSelectedPaper(null);
                      setSelectedFile(null);
                    }}
                  >
                    <span className="truncate text-xs">{artifact.title}</span>
                  </NavItem>
                ))
              )}
            </NavSection>

            {/* Literature Section */}
            <NavSection title="Literature" icon={BookOpen} count={papers.length}>
              {papers.length === 0 ? (
                <div className="text-xs text-muted-foreground px-2 py-1">No papers yet</div>
              ) : (
                papers.slice(0, 20).map(paper => (
                  <NavItem
                    key={paper.id}
                    active={selectedPaper?.id === paper.id}
                    onClick={() => {
                      setSelectedPaper(paper);
                      setSelectedTask(null);
                      setSelectedArtifact(null);
                      setSelectedFile(null);
                    }}
                  >
                    <span className="truncate text-xs">{paper.title.slice(0, 35)}...</span>
                  </NavItem>
                ))
              )}
              {papers.length > 20 && (
                <div className="text-[10px] text-muted-foreground px-2 py-1">
                  +{papers.length - 20} more papers
                </div>
              )}
            </NavSection>
          </div>
        )}

        {/* Files view - show FileExplorer */}
        {selectedProject && navigatorView === 'files' && (
          <FileExplorer onFileSelect={handleFileSelect} selectedFile={selectedFile} />
        )}
      </ScrollArea>
    </div>
  );
};
