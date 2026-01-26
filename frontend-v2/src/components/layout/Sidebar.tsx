/**
 * Sidebar Component
 *
 * Main navigation sidebar with project navigation and credits display.
 * Integrates with useUIStore for state management and useCreditStore for credits.
 */

import React from 'react';
import { useUIStore } from '../../stores/useUIStore';
import { useCreditStore } from '../../stores/useCreditStore';
import type { ViewType } from '../../stores/useUIStore';

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ReactNode;
}

const navigationItems: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'task-graph',
    label: 'Task Graph',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: 'papers',
    label: 'Papers',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'artifacts',
    label: 'Artifacts',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    id: 'logs',
    label: 'Logs',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

/**
 * Sidebar component
 */
export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, activeView, toggleSidebar, setActiveView } = useUIStore();
  const { creditsRemaining, creditsUsed } = useCreditStore();

  const handleNavClick = (viewId: ViewType) => {
    setActiveView(viewId);
  };

  const sidebarWidth = sidebarCollapsed ? 'w-16' : 'w-64';

  return (
    <aside
      className={`
        ${sidebarWidth}
        bg-[var(--color-surface)]
        border-r border-[var(--color-border)]
        flex flex-col
        transition-all duration-300
        fixed left-0 top-0 bottom-12
        z-[var(--z-index-sidebar)]
        overflow-hidden
      `}
    >
      {/* Logo/Title */}
      <div className="p-4 border-b border-[var(--color-border)]">
        {sidebarCollapsed ? (
          <div className="w-8 h-8 bg-[var(--color-primary)] rounded flex items-center justify-center">
            <span className="text-white font-bold text-lg">R</span>
          </div>
        ) : (
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">ResearchOS</h1>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navigationItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center px-3 py-2 rounded-md
                    transition-colors duration-150
                    ${isActive
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-neutral-100)]'
                    }
                  `}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!sidebarCollapsed && (
                    <span className="ml-3 font-medium">{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Credits Display */}
      {!sidebarCollapsed && (
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-neutral-50)]">
          <div className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">
            Credits
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Remaining:</span>
              <span className="font-medium text-[var(--color-success)]">{creditsRemaining}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Used:</span>
              <span className="font-medium">{creditsUsed}</span>
            </div>
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={toggleSidebar}
        className="
          p-4 border-t border-[var(--color-border)]
          text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
          transition-colors duration-150
        "
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? (
          <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        )}
      </button>
    </aside>
  );
};
