# Research Orchestration Platform - Frontend-v2

## Vision

Build a modern, enterprise SaaS frontend for AI-powered research orchestration. The new frontend (frontend-v2) features a navy theme (#0f172a), clean typography, and a streamlined user experience completely separate from the existing frontend.

## Objectives

1. **Completely separate from old frontend** - frontend-v2/ directory with independent build
2. **Modern design system** - Navy theme, Inter typography, consistent spacing
3. **Enterprise SaaS UX** - Clean, professional, workflow-oriented
4. **State management** - Zustand for global state, React Query for server state
5. **Rich text editing** - Tiptap for artifact content editing
6. **Graph visualization** - ReactFlow for task and agent graphs
7. **Real-time updates** - WebSocket integration for live task execution

## Tech Stack

- **Framework:** React 19.2.9 with TypeScript
- **Build:** Create React App (considering Vite migration)
- **Styling:** Tailwind CSS 3.4.0 with custom design tokens
- **State:** Zustand 5.0.10, TanStack Query 5.90.20
- **Routing:** React Router DOM
- **Rich Text:** Tiptap 3.17.1
- **Graphs:** ReactFlow 11.11.4
- **Icons:** Lucide React
- **Utilities:** clsx

## Design Principles

1. **Navy first** - Primary color #0f172a, professional and trustworthy
2. **Typography-driven** - Inter for UI, JetBrains Mono for code
3. **Spacing system** - 4px base unit, consistent scale
4. **Component tokens** - All styling uses CSS custom properties
5. **Desktop-first** - Minimum viewport 1280px, responsive down to mobile

## Key Differentiators from Old Frontend

1. **Separate codebase** - No risk to existing functionality
2. **Modern stack** - Latest React, TypeScript, tooling
3. **Design tokens** - Consistent theming via CSS variables
4. **Better state management** - Zustand instead of old solution
5. **Rich text editing** - Tiptap for professional document editing
6. **Clean architecture** - Component library pattern, proper separation of concerns

## Success Criteria

- All core screens functional (Dashboard, Workspace, Graph)
- Task creation and execution workflow works
- Artifact viewing and editing works
- Real-time updates via WebSocket
- Responsive design works at all breakpoints
- Accessibility features (keyboard nav, ARIA, semantic HTML)
- Build compiles successfully with no errors
