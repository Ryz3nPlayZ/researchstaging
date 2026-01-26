/**
 * UI State Management
 *
 * Manages UI state including sidebar collapse, details panel,
 * and active view within project workspace.
 */

import { create } from 'zustand';

/**
 * Available view types in project workspace
 */
export type ViewType =
  | 'overview'
  | 'task-graph'
  | 'agent-graph'
  | 'papers'
  | 'artifacts'
  | 'logs';

/**
 * Content types that can be displayed in details panel
 */
export type PanelType = 'task' | 'artifact' | 'paper' | null;

interface UIState {
  // Sidebar state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Details panel state
  detailsPanelOpen: boolean;
  detailsPanelContent: PanelType;
  selectedItemId: string | null;
  openDetailsPanel: (type: PanelType, id: string) => void;
  closeDetailsPanel: () => void;

  // Active project view
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;

  // Reset store to initial state
  reset: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  // Initial state
  sidebarCollapsed: false,
  detailsPanelOpen: false,
  detailsPanelContent: null,
  selectedItemId: null,
  activeView: 'overview',

  // Actions
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  openDetailsPanel: (type, id) =>
    set({
      detailsPanelOpen: true,
      detailsPanelContent: type,
      selectedItemId: id,
    }),

  closeDetailsPanel: () =>
    set({
      detailsPanelOpen: false,
      detailsPanelContent: null,
      selectedItemId: null,
    }),

  setActiveView: (view) => set({ activeView: view }),

  reset: () =>
    set({
      sidebarCollapsed: false,
      detailsPanelOpen: false,
      detailsPanelContent: null,
      selectedItemId: null,
      activeView: 'overview',
    }),
}));
