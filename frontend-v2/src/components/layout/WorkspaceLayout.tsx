/**
 * WorkspaceLayout Component
 *
 * Main layout component composing Sidebar, DetailsPanel, Statusbar, and page content.
 * Provides the application shell with proper spacing and z-index layering.
 */

import React from 'react';
import { useUIStore } from '../../stores/useUIStore';
import { Sidebar } from './Sidebar';
import { DetailsPanel } from './DetailsPanel';
import { Statusbar } from './Statusbar';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
}

/**
 * WorkspaceLayout component - main application shell
 */
export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({ children }) => {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="h-screen overflow-hidden bg-[var(--color-background)]">
      <div className="flex h-full">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <main
          className={`
            flex-1
            ml-[${sidebarCollapsed ? '4rem' : '16rem'}]
            transition-all duration-300
            overflow-auto
          `}
          style={{
            marginLeft: sidebarCollapsed ? '4rem' : '16rem',
          }}
        >
          {/* Page Content */}
          <div className="p-6 pb-20">
            {children}
          </div>
        </main>

        {/* Details Panel (conditionally rendered) */}
      </div>

      {/* Details Panel */}
      <DetailsPanel />

      {/* Statusbar */}
      <Statusbar />
    </div>
  );
};
