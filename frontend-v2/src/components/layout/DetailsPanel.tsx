/**
 * DetailsPanel Component
 *
 * Slide-in panel for displaying contextual information.
 * Integrates with useUIStore for open/close state management.
 */

import React from 'react';
import { useUIStore } from '../../stores/useUIStore';

interface DetailsPanelProps {
  title?: string;
  children: React.ReactNode;
}

/**
 * DetailsPanel component with slide-in animation
 */
export const DetailsPanel: React.FC<DetailsPanelProps> = ({ title = 'Details', children }) => {
  const { detailsPanelOpen, closeDetailsPanel } = useUIStore();

  if (!detailsPanelOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="
          fixed inset-0 bg-black/50
          z-[var(--z-index-modal-backdrop)]
          transition-opacity duration-300
        "
        onClick={closeDetailsPanel}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="
          fixed right-0 top-0 bottom-12
          w-full md:w-96
          bg-[var(--color-surface)]
          shadow-[var(--shadow-xl)]
          z-[var(--z-index-modal)]
          transform transition-transform duration-300 ease-in-out
          translate-x-0
          flex flex-col
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title}</h2>
          <button
            onClick={closeDetailsPanel}
            className="
              p-1 rounded-md
              text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
              hover:bg-[var(--color-neutral-100)]
              transition-colors duration-150
            "
            aria-label="Close details panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  );
};
