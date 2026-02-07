
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DashboardView from './pages/DashboardView';
import FilesView from './pages/FilesView';
import EditorView from './pages/EditorView';
import LibraryView from './pages/LibraryView';
import { View } from './types';
import { useSession } from './lib/auth';
import { ProjectProvider } from './lib/context';
import { useWebSocket } from './lib/websocket';
import { useProjectContext } from './lib/context';
import ErrorBoundary from './components/ErrorBoundary';

// WebSocket wrapper component
function WebSocketWrapper({ children }: { children: React.ReactNode }) {
  const { currentProjectId } = useProjectContext();
  const { connect, disconnect, status } = useWebSocket();

  useEffect(() => {
    if (currentProjectId) {
      // Connect to WebSocket when project is loaded
      connect(currentProjectId, window.location.origin + '/api');
    }

    return () => {
      // Disconnect on unmount
      disconnect();
    };
  }, [currentProjectId, connect, disconnect]);

  // Log connection status for debugging
  useEffect(() => {
    console.log('WebSocket status:', status);
  }, [status]);

  return <>{children}</>;
}

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.DASHBOARD);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { session, loading, login } = useSession();

  // Auto-login for local development if no session
  useEffect(() => {
    if (!loading && !session) {
      login();
    }
  }, [loading, session, login]);

  // Show loading state while checking session
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderView = () => {
    switch (activeView) {
      case View.DASHBOARD: return <DashboardView />;
      case View.FILES: return <FilesView />;
      case View.LIBRARY: return <LibraryView />;
      case View.EDITOR: return <EditorView />;
      case View.CITATIONS: return <LibraryView />; // Using Library as a fallback for citations view
      default: return <DashboardView />;
    }
  };

  return (
    <ErrorBoundary>
      <ProjectProvider>
        <WebSocketWrapper>
          <div className="flex h-screen overflow-hidden text-slate-900 dark:text-slate-100 font-sans">
            <Sidebar
              activeView={activeView}
              onViewChange={setActiveView}
              isOpen={mobileMenuOpen}
              onClose={() => setMobileMenuOpen(false)}
            />

            <div className="flex-1 flex flex-col min-w-0">
              {/* Top Header Bar */}
              <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 md:px-8 z-30 shrink-0">
                <div className="flex items-center gap-4 md:gap-6">
                  {/* Hamburger menu button - mobile only */}
                  <button
                    className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    onClick={() => setMobileMenuOpen(true)}
                    aria-label="Open menu"
                  >
                    <span className="material-symbols-outlined">menu</span>
                  </button>
                  <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveView(View.DASHBOARD)}>
                    <span className="material-symbols-outlined text-primary text-2xl">auto_stories</span>
                    <span className="font-bold text-lg hidden sm:block">Research Hub</span>
                  </div>

                  <div className="hidden md:flex items-center w-80 relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                    <input
                      className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/50 transition-all placeholder-slate-400"
                      placeholder="Search papers, projects, notes..."
                      type="text"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveView(View.EDITOR)}
                    className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm"
                  >
                    <span className="material-symbols-outlined text-xl">add</span>
                    <span>New Document</span>
                  </button>
                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2 hidden sm:block"></div>
                  <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="absolute top-2 right-2 size-2 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                  </button>
                  <div className="size-9 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-white dark:border-slate-900 overflow-hidden cursor-pointer">
                    <img
                      className="w-full h-full object-cover"
                      alt="User Profile"
                      src="https://picsum.photos/seed/user/100"
                    />
                  </div>
                </div>
              </header>

              {/* View Content */}
              {renderView()}
            </div>
          </div>
        </WebSocketWrapper>
      </ProjectProvider>
    </ErrorBoundary>
  );
};

export default App;
