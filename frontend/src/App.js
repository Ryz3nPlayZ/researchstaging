import { useState, useCallback, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider, useProject } from './context/ProjectContext';
import { StatusBar } from './components/layout/StatusBar';
import { Navigator } from './components/layout/Navigator';
import { Workspace } from './components/layout/Workspace';
import { Inspector } from './components/layout/Inspector';
import { Dashboard } from './components/pages/Dashboard';
import { PlanningFlow } from './components/pages/PlanningFlow';
import { LoginPage } from './pages/LoginPage';
import { OAuthCallback } from './pages/OAuthCallback';
import { Toaster } from './components/ui/sonner';
import './App.css';

const VIEW_STATES = {
  DASHBOARD: 'dashboard',
  PLANNING: 'planning',
  WORKSPACE: 'workspace',
  LOGIN: 'login',
  CALLBACK: 'callback',
};

function AppContent() {
  const { selectedProject, setSelectedProject } = useProject();
  const [viewState, setViewState] = useState(VIEW_STATES.DASHBOARD);
  const [navWidth, setNavWidth] = useState(260);
  const [inspectorWidth, setInspectorWidth] = useState(300);
  const [isResizingNav, setIsResizingNav] = useState(false);
  const [isResizingInspector, setIsResizingInspector] = useState(false);

  const handleCreateProject = useCallback(() => {
    setViewState(VIEW_STATES.PLANNING);
  }, []);

  const handleSelectProject = useCallback((project) => {
    setSelectedProject(project);
    setViewState(VIEW_STATES.WORKSPACE);
  }, [setSelectedProject]);

  const handlePlanningComplete = useCallback((project) => {
    setSelectedProject(project);
    setViewState(VIEW_STATES.WORKSPACE);
  }, [setSelectedProject]);

  const handlePlanningCancel = useCallback(() => {
    setViewState(VIEW_STATES.DASHBOARD);
  }, []);

  const handleBackToDashboard = useCallback(() => {
    setSelectedProject(null);
    setViewState(VIEW_STATES.DASHBOARD);
  }, [setSelectedProject]);

  const handleLogout = useCallback(async () => {
    await logout();
    setViewState(VIEW_STATES.LOGIN);
    setSelectedProject(null);
  }, [logout, setSelectedProject]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // OAuth callback route
  if (viewState === VIEW_STATES.CALLBACK) {
    return <OAuthCallback />;
  }

  // Login route
  if (viewState === VIEW_STATES.LOGIN) {
    return (
      <div className="h-screen w-screen">
        <LoginPage />
      </div>
    );
  }

  // Resize handlers
  const startResizeNav = useCallback((e) => {
    e.preventDefault();
    setIsResizingNav(true);
    
    const handleMouseMove = (e) => {
      const newWidth = Math.max(200, Math.min(400, e.clientX));
      setNavWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizingNav(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  const startResizeInspector = useCallback((e) => {
    e.preventDefault();
    setIsResizingInspector(true);
    
    const handleMouseMove = (e) => {
      const newWidth = Math.max(250, Math.min(450, window.innerWidth - e.clientX));
      setInspectorWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizingInspector(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  // Planning flow - full screen without sidebars
  if (viewState === VIEW_STATES.PLANNING) {
    return (
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground">
        <StatusBar onLogoClick={handleBackToDashboard} user={user} onLogout={handleLogout} />
        <PlanningFlow 
          onComplete={handlePlanningComplete}
          onCancel={handlePlanningCancel}
        />
        <Toaster position="bottom-right" />
      </div>
    );
  }

  // Dashboard view
  if (viewState === VIEW_STATES.DASHBOARD) {
    return (
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground">
        <StatusBar onLogoClick={handleBackToDashboard} user={user} onLogout={handleLogout} />
        <div className="flex-1 flex overflow-hidden">
          {/* Navigator - narrower on dashboard */}
          <aside 
            className="hidden md:flex flex-col bg-muted/30 border-r border-border"
            style={{ width: 220 }}
          >
            <Navigator 
              onCreateProject={handleCreateProject} 
              onSelectProject={handleSelectProject}
            />
          </aside>
          <Dashboard 
            onCreateProject={handleCreateProject}
            onSelectProject={handleSelectProject}
          />
        </div>
        <Toaster position="bottom-right" />
      </div>
    );
  }

  // Workspace view - full 3-panel layout with drag-to-resize
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background text-foreground">
      <StatusBar onLogoClick={handleBackToDashboard} />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Navigator Panel */}
        <aside 
          className="hidden md:flex flex-col bg-muted/30 border-r border-border flex-shrink-0"
          style={{ width: navWidth }}
        >
          <Navigator 
            onCreateProject={handleCreateProject} 
            onSelectProject={handleSelectProject}
          />
        </aside>
        
        {/* Nav Resize Handle */}
        <div
          className={`hidden md:flex w-1 cursor-col-resize hover:bg-primary/50 transition-colors flex-shrink-0 ${isResizingNav ? 'bg-primary/50' : 'bg-transparent'}`}
          onMouseDown={startResizeNav}
        />
        
        {/* Workspace Panel */}
        <main className="flex-1 overflow-hidden flex flex-col min-w-0">
          <Workspace />
        </main>
        
        {/* Inspector Resize Handle */}
        <div
          className={`hidden lg:flex w-1 cursor-col-resize hover:bg-primary/50 transition-colors flex-shrink-0 ${isResizingInspector ? 'bg-primary/50' : 'bg-transparent'}`}
          onMouseDown={startResizeInspector}
        />
        
        {/* Inspector Panel */}
        <aside 
          className="hidden lg:flex flex-col bg-muted/30 border-l border-border flex-shrink-0"
          style={{ width: inspectorWidth }}
        >
          <Inspector />
        </aside>
      </div>
      
      <Toaster position="bottom-right" />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ProjectProvider>
          <AppContent />
        </ProjectProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
