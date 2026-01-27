/**
 * Statusbar Component
 *
 * Fixed bottom status bar displaying connection status, active project, and user info.
 * Integrates with useProjectStore and useAuthStore.
 */

import React from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { useAuthStore } from '../../stores/useAuthStore';

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected';

/**
 * Statusbar component
 */
export const Statusbar: React.FC = () => {
  const { activeProject } = useProjectStore();
  const { user } = useAuthStore();

  // For now, simulate connection status
  // In production, this would come from a WebSocket or API connection store
  const [connectionStatus] = React.useState<ConnectionStatus>('connected');

  const statusColors = {
    connected: 'bg-[var(--color-success)]',
    connecting: 'bg-[var(--color-warning)]',
    disconnected: 'bg-[var(--color-error)]',
  };

  const statusLabels = {
    connected: 'Connected',
    connecting: 'Connecting...',
    disconnected: 'Disconnected',
  };

  return (
    <footer
      className="
        fixed bottom-0 left-0 right-0
        h-12
        bg-[var(--color-surface)]
        border-t border-[var(--color-border)]
        flex items-center justify-between
        px-4
        z-[var(--z-index-statusbar)]
      "
    >
      {/* Left: Connection Status */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${statusColors[connectionStatus]}`}
            aria-hidden="true"
          />
          <span className="text-sm text-[var(--color-text-secondary)]">
            {statusLabels[connectionStatus]}
          </span>
        </div>

        <div className="h-4 w-px bg-[var(--color-border)]" />

        {/* Active Project */}
        {activeProject && (
          <div className="text-sm">
            <span className="text-[var(--color-text-secondary)]">Project: </span>
            <span className="font-medium text-[var(--color-text-primary)]">
              {activeProject.research_goal}
            </span>
          </div>
        )}
      </div>

      {/* Right: User Info */}
      <div className="flex items-center space-x-3">
        {/* User Email */}
        {user && (
          <div className="text-sm text-[var(--color-text-secondary)]">
            {user.email}
          </div>
        )}
      </div>
    </footer>
  );
};
