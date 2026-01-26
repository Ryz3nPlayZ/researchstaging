---
phase: 01-frontend-foundation
plan: 02
title: "Project Structure and State Setup"
one-liner: "TypeScript types, Zustand stores, and API service foundation"
subsystem: "core-infrastructure"
tags: ["typescript", "zustand", "state-management", "api-layer", "project-structure"]
status: complete
completed: "2026-01-26"
---

# Phase 01, Plan 02: Project Structure and State Setup Summary

## One-Liner

Established complete TypeScript type system, Zustand state management stores, and base API service layer for the Research Orchestration Platform frontend.

## Deliverables

### 1. Folder Structure
Created complete directory structure matching FRONTEND_ARCHITECTURE.md:

```
frontend-v2/src/
├── components/
│   ├── ui/              # shadcn/ui components (future)
│   ├── graphs/          # Graph visualizations
│   ├── editor/          # Tiptap editor
│   ├── layout/          # Layout components
│   ├── artifacts/       # Artifact viewers
│   ├── tasks/           # Task components
│   ├── chat/            # Chat interface
│   └── common/          # Shared components
├── pages/               # Page components
├── stores/              # Zustand stores ✅
├── hooks/               # Custom React hooks
├── services/            # API services ✅
├── types/               # TypeScript types ✅
├── utils/               # Utility functions
└── styles/              # Global styles (from 01-01)
```

Each directory includes an `index.ts` barrel file for clean imports.

### 2. TypeScript Type Definitions

**File:** `src/types/project.ts` (66 lines)
- `ProjectStatus` enum (6 states: initializing, planning, executing, completed, failed, paused)
- `TaskCounts` interface (total, pending, running, completed, failed, blocked)
- `Project` interface (core project entity)
- `CreateProjectRequest` interface
- `CreateProjectResponse` interface

**File:** `src/types/task.ts` (97 lines)
- `TaskState` enum (7 states: pending, ready, blocked, running, completed, failed, skipped)
- `TaskType` enum (6 types: research, analysis, writing, review, citation, planning)
- `TaskDependency` interface
- `Task` interface (core task entity with all metadata)
- `TaskGraphNode` interface (for ReactFlow visualization)
- `TaskGraphEdge` interface (for ReactFlow visualization)

**File:** `src/types/artifact.ts` (57 lines)
- `ArtifactType` enum (6 types: draft, search_results, pdf, reference_list, citation_network, image)
- `Artifact` interface (core artifact entity)
- `Paper` interface (research paper metadata)
- `Citation` interface (citation relationships)
- `SearchResults` interface (search result data)

**File:** `src/types/api.ts` (78 lines)
- `ApiResponse<T>` generic wrapper
- `ApiError` interface (server error response)
- `PaginationParams` interface
- `PaginatedResponse<T>` generic wrapper
- `LoginCredentials` interface
- `User` interface
- `AuthResponse` interface
- `CreditBalance` interface

**File:** `src/types/index.ts` (10 lines)
- Barrel file exporting all types for clean imports

### 3. Zustand State Management Stores

**File:** `src/stores/useProjectStore.ts` (84 lines)
- Manages active project state
- Task graph nodes and edges for ReactFlow
- Real-time task status tracking with Map
- Actions: `setActiveProject`, `updateTaskNode`, `setTaskGraph`, `updateTaskStatus`, `getTaskStatus`, `reset`

**File:** `src/stores/useCreditStore.ts` (63 lines)
- Credit balance tracking (remaining, used, purchased)
- Actions: `refreshCredits` (TODO for API), `decrementCredits`, `addCredits`, `reset`
- Default starting balance: 1000 credits

**File:** `src/stores/useUIStore.ts` (85 lines)
- Sidebar collapse state management
- Details panel state (open/closed, content type, selected item)
- Active view type (overview, task-graph, agent-graph, papers, artifacts, logs)
- Actions: `toggleSidebar`, `setSidebarCollapsed`, `openDetailsPanel`, `closeDetailsPanel`, `setActiveView`, `reset`

**File:** `src/stores/useAuthStore.ts` (68 lines)
- User authentication state
- Token storage in localStorage
- Actions: `login` (TODO for API), `logout`, `setUser`, `setToken`, `reset`

**File:** `src/stores/index.ts` (7 lines)
- Barrel file exporting all stores and ViewType, PanelType types

### 4. Base API Service

**File:** `src/services/api.ts` (156 lines)
- `ApiRequestError` class for structured error handling
- `handleResponse<T>()` function for response parsing
- `get<T>()` - GET requests with query parameters
- `post<T>()` - POST requests with JSON body
- `put<T>()` - PUT requests with JSON body
- `patch<T>()` - PATCH requests with JSON body
- `del<T>()` - DELETE requests
- `api` object with all HTTP methods
- Authentication header support (Bearer token from localStorage)
- Configurable `API_BASE_URL` via `REACT_APP_API_URL` environment variable
- Full TypeScript typing with generics

## Tech Stack Tracking

### Tech Stack Added
- **Zustand**: State management library (already installed)
- **TypeScript**: Type-safe development (already configured)

### Patterns Established
1. **Type-First Development**: All entities have TypeScript interfaces
2. **Enum-Based State**: ProjectStatus, TaskState, TaskType use enums for type safety
3. **Store Pattern**: Zustand stores with state and actions in single interface
4. **Reset Actions**: All stores include `reset()` for state cleanup
5. **Generic API Client**: TypeScript generics for type-safe API calls
6. **Error Class Pattern**: ApiRequestError extends Error for structured error handling

## File Tracking

### Key Files Created
- `src/types/project.ts` - Project type definitions
- `src/types/task.ts` - Task type definitions
- `src/types/artifact.ts` - Artifact type definitions
- `src/types/api.ts` - API type definitions
- `src/types/index.ts` - Type exports barrel
- `src/stores/useProjectStore.ts` - Project state management
- `src/stores/useCreditStore.ts` - Credit balance management
- `src/stores/useUIStore.ts` - UI state management
- `src/stores/useAuthStore.ts` - Authentication state
- `src/stores/index.ts` - Store exports barrel
- `src/services/api.ts` - Base API service

### Key Files Modified
None (this is foundational work)

### Directories Created
- `src/components/` + 8 subdirectories (ui, graphs, editor, layout, artifacts, tasks, chat, common)
- `src/pages/`
- `src/stores/`
- `src/hooks/`
- `src/services/`
- `src/types/`
- `src/utils/`

## Decisions Made

### 1. Zustand over Redux
**Decision:** Use Zustand for state management

**Rationale:**
- Simpler API than Redux (no actions, reducers, or providers needed)
- Built-in TypeScript support
- Smaller bundle size
- Easier to learn and maintain
- Sufficient for our state management needs

**Alternatives Considered:**
- Redux Toolkit: More boilerplate, overkill for our needs
- Context API: No built-in devtools, re-renders entire context
- Jotai/Recoil: More complex atomic model

### 2. Enum-Based State Types
**Decision:** Use TypeScript enums for ProjectStatus, TaskState, TaskType, ArtifactType

**Rationale:**
- Compile-time type safety
- Better IDE autocomplete
- Prevents invalid state values
- Self-documenting code

**Constraints:**
- Must sync enum values with backend API responses
- Consider string enums if backend sends string values

### 3. Generic API Client
**Decision:** Use TypeScript generics for type-safe API calls

**Rationale:**
- `api.get<Project>('/projects/123')` returns typed Project
- Catches type errors at compile time
- No need for manual type casting
- Better developer experience

### 4. ApiRequestError vs ApiError Interface
**Decision:** Create separate ApiRequestError class (extends Error) and ApiError interface

**Rationale:**
- `ApiError` interface in types/api.ts describes server error response shape
- `ApiRequestError` class in services/api.ts is for throwing in client code
- Avoids naming conflict
- Separation of concerns: response shape vs error handling

### 5. Barrel Files with `export {}`
**Decision:** Add empty `export {}` to all barrel files

**Rationale:**
- TypeScript's `--isolatedModules` flag requires files to be modules
- Without exports, files are treated as scripts and can't be imported
- `export {}` makes file an ES module without exporting anything

## Deviations from Plan

### Deviation 1: Removed services/index.ts Barrel File
- **Found during:** Build compilation
- **Issue:** services/index.ts caused TypeScript compilation errors with ApiRequestError
- **Fix:** Removed services/index.ts entirely
- **Impact:** Import from `src/services/api` directly, not via barrel
- **Files modified:** Removed services/index.ts
- **Commit:** 78c3426

### Deviation 2: ApiRequestError Renamed from ApiError
- **Found during:** Build compilation
- **Issue:** ApiError class conflicted with ApiError interface in types/api.ts
- **Fix:** Renamed class to ApiRequestError
- **Impact:** Use ApiRequestError when catching thrown errors, use ApiError interface for response typing
- **Files modified:** services/api.ts
- **Commit:** 907c15a

### Deviation 3: Removed Duplicate Export Statement
- **Found during:** Build compilation
- **Issue:** ApiRequestError was exported twice (inline class + export statement)
- **Fix:** Removed inline `export` keyword, kept only the export statement at end of file
- **Impact:** Single export point for ApiRequestError class
- **Files modified:** services/api.ts
- **Commit:** 78c3426

**Summary:** All deviations were Rule 1 (Bug) fixes for TypeScript compilation errors. No user permission needed - these were blocking the build.

## Metrics

### Duration
- **Start:** 2026-01-26T15:03:56Z
- **End:** 2026-01-26T15:11:00Z
- **Total Time:** ~7 minutes

### Code Statistics
- **Total Lines:** 769 lines (types + stores + services)
- **Type Definitions:** 308 lines across 5 files
- **Store Logic:** 307 lines across 5 files
- **API Service:** 156 lines
- **Build Output:** 61.74 kB (gzipped) baseline

### Commits
1. `b3d5759`: Create folder structure per FRONTEND_ARCHITECTURE.md
2. `bbc451a`: Create TypeScript types for core entities
3. `5958959`: Implement Zustand stores for state management
4. `7962a24`: Create base API service with fetch wrapper
5. `a6faadb`: Fix isolatedModules compatibility (add export statements)
6. `a1cc23f`: Fix barrel files with proper export {} statements
7. `6cba692`: Fix ApiError export conflict
8. `907c15a`: Rename ApiError to ApiRequestError
9. `78c3426`: Remove duplicate ApiRequestError export and services/index.ts

## Dependency Graph

### Requires
- Plan 01-01 (Design System Foundation) - provides design tokens and Tailwind config

### Provides
- Complete TypeScript type system for frontend
- State management foundation with Zustand
- API client infrastructure

### Affects
- All future frontend plans will use these types
- Component development will use Zustand stores
- API integration will use the base api service

## Next Phase Readiness

### Prerequisites Met
✅ TypeScript types for all core entities (Project, Task, Artifact)
✅ State management stores created and typed
✅ Base API service with authentication support
✅ Folder structure established
✅ Build compiles successfully

### TODOs for Future Plans
- `useCreditStore.refreshCredits()`: Implement API call to fetch credits
- `useAuthStore.login()`: Implement API call to authenticate
- Create project-specific API services (projects.ts, tasks.ts, artifacts.ts)
- Create custom React hooks (useProjectWebSocket, useTaskGraph, etc.)
- Implement layout components (Sidebar, DetailsPanel, Statusbar)

### Blockers
None. Foundation is complete and ready for component development.

## Verification

### Success Criteria Checklist
- [x] Complete folder structure created
- [x] TypeScript types for Project, Task, Artifact entities
- [x] Four Zustand stores with proper TypeScript typing
- [x] Base API service with typed fetch wrappers
- [x] Authentication header support
- [x] Zero TypeScript compilation errors
- [x] Clean exports via barrel files
- [x] All stores have reset() actions
- [x] Build compiles successfully (61.74 kB gzipped)

### Build Status
✅ **PASS** - `npm run build` completes successfully with no errors

### Type Coverage
✅ **100%** - All core entities have TypeScript interfaces

## Anti-Patterns Found

### Expected TODOs (Not Anti-Patterns)
- `useCreditStore.ts:42`: TODO for API call to fetch credits (will be implemented in backend integration phase)
- `useAuthStore.ts:34`: TODO for API call to authenticate (will be implemented in backend integration phase)

These TODOs are appropriate - they mark where backend integration will happen in later phases. The foundation is correctly laid.

---

**Completed:** 2026-01-26
**Executed by:** Claude (gsd-executor)
**Plan file:** `.planning/phases/01-frontend-foundation/01-02-PLAN.md`
