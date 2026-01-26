# Project State - Research Orchestration Platform (frontend-v2)

**Last Updated:** 2026-01-26

## Current Position

**Phase:** 1 of 1 (Frontend Foundation)
**Plan:** 2 of 2 (Project Structure and State Setup)
**Status:** In progress
**Last Activity:** 2026-01-26 - Completed 01-02-PLAN.md (Project Structure and State Setup)

**Progress:** ██████████░░░░░░░░░░░ 66% (2/3 plans completed)

## Session Continuity

**Last Session:** 2026-01-26 15:11 UTC
**Stopped At:** Completed 01-02-PLAN.md (Project Structure and State Setup)
**Resume File:** None

## Accumulated Decisions

### 1. Tailwind CSS Version (Plan 01-01)

**Decision:** Use Tailwind CSS v3.4.0 instead of v4

**Context:**
- Tailwind v4 has breaking changes in PostCSS plugin architecture
- Create React App is incompatible with `@tailwindcss/postcss`
- v4 requires different build setup (Vite or Next.js recommended)

**Resolution:**
- Use Tailwind v3.4.0 for CRA compatibility
- All design token features work identically
- Can migrate to v4 if replacing CRA with Vite/Next.js

**Constraints:**
- Must use Tailwind v3.x while using Create React App
- PostCSS config must use standard `tailwindcss` plugin (not `@tailwindcss/postcss`)

### 2. Design Token Architecture (Plan 01-01)

**Decision:** Organize tokens into semantic categories using CSS custom properties

**Categories:**
- Color System (primary, secondary, functional, neutral, semantic)
- Typography (families, sizes, weights, line heights)
- Spacing Scale (xs through 3xl)
- Border Radius (sm through full)
- Shadows (sm through xl)
- Z-Index Scale (base through tooltip)
- Component-Specific Tokens (buttons, inputs, nodes, panels)
- Animation (durations, easing)
- Transitions, Breakpoints, Opacity

**Constraints:**
- All tokens use `--token-name` syntax
- Organized in `/home/zemul/Programming/research/frontend-v2/src/styles/design-tokens.css`
- Tokens are imported in `index.css` before Tailwind directives
- Reference: `/home/zemul/Programming/research/.planning/DESIGN_TOKENS.md`

### 3. Tailwind Integration Strategy (Plan 01-01)

**Decision:** Extend Tailwind theme with design token values

**Benefits:**
- Developers can use Tailwind utilities OR CSS custom properties
- Consistent values across both systems
- Semantic color names (success, ready, blocked, warning, error, info)
- Comprehensive spacing, radius, shadow, z-index utilities

**Constraints:**
- Use semantic Tailwind classes where possible
- Use `var(--token-name)` for component-specific custom styling
- All Tailwind extensions must align with design token values

### 4. Zustand State Management (Plan 01-02)

**Decision:** Use Zustand for global state management

**Rationale:**
- Simpler API than Redux (no actions, reducers, providers)
- Built-in TypeScript support
- Smaller bundle size
- Easier to learn and maintain
- Sufficient for our state management needs

**Stores Implemented:**
- useProjectStore: Active project, task graph, task status tracking
- useCreditStore: Credit balance (remaining, used, purchased)
- useUIStore: Sidebar, details panel, active view
- useAuthStore: User authentication, token management

**Constraints:**
- All stores must include reset() action for cleanup
- TODOs mark where backend API integration will happen

### 5. TypeScript Type System (Plan 01-02)

**Decision:** Comprehensive TypeScript types for all core entities

**Rationale:**
- Compile-time type safety prevents bugs
- Better IDE autocomplete and refactoring
- Self-documenting code
- Catches type errors early

**Types Defined:**
- Project: Project, ProjectStatus (enum), TaskCounts, CreateProjectRequest
- Task: Task, TaskState (enum), TaskType (enum), TaskDependency, TaskGraphNode, TaskGraphEdge
- Artifact: Artifact, ArtifactType (enum), Paper, Citation, SearchResults
- API: ApiResponse, ApiError, PaginationParams, PaginatedResponse, User, AuthResponse, CreditBalance

**Constraints:**
- Must sync enum values with backend API responses
- Use TypeScript generics for type-safe API calls

### 6. Base API Service Architecture (Plan 01-02)

**Decision:** Custom fetch wrapper with TypeScript generics

**Rationale:**
- Full control over error handling
- Lightweight (no Axios dependency)
- TypeScript generics for type safety
- Automatic authentication header injection

**Implementation:**
- ApiRequestError class extends Error for structured error handling
- get/post/put/patch/delete methods with generic typing
- Authentication via Bearer token from localStorage
- Configurable API base URL via environment variable

**Constraints:**
- Backend must return consistent error response format
- Token must be stored in localStorage as 'auth_token'

## Blockers & Concerns

### Current Blockers

None

### Known Concerns

1. **Create React App Maintenance**
   - CRA is in maintenance mode (limited updates)
   - Consider migration to Vite or Next.js for:
     - Better Tailwind v4 support
     - Faster build times
     - Modern React features
   - **Timeline:** Address after Phase 1 (Frontend Foundation)

2. **Font Loading**
   - Inter and JetBrains Mono fonts referenced but not loaded
   - Need to add Google Fonts or self-host
   - **Impact:** Typography won't display as designed until fonts load
   - **Priority:** Medium (can be addressed in upcoming plans)

### Technical Debt

None identified

## Completed Work

### Phase 01: Frontend Foundation

#### Plan 01-01: Design System Foundation ✅

**Commits:**
- e541c3c: Create comprehensive design-tokens.css
- d9a1a42: Enhance Tailwind configuration with design token integration
- ded07b7: Verify design token implementation and fix Tailwind compatibility

**Deliverables:**
- ✅ 119 CSS custom properties defined in design-tokens.css
- ✅ Navy theme (#0f172a) established as primary brand color
- ✅ Tailwind v3.4.0 configured and integrated
- ✅ Design token verification component created
- ✅ Build system working correctly
- ✅ Complete design system foundation

**Summary:** `.planning/phases/01-frontend-foundation/01-01-SUMMARY.md`

#### Plan 01-02: Project Structure and State Setup ✅

**Commits:**
- b3d5759: Create folder structure per FRONTEND_ARCHITECTURE.md
- bbc451a: Create TypeScript types for core entities
- 5958959: Implement Zustand stores for state management
- 7962a24: Create base API service with fetch wrapper
- a6faadb: Fix isolatedModules compatibility
- a1cc23f: Fix barrel files with proper export {} statements
- 6cba692: Fix ApiError export conflict
- 907c15a: Rename ApiError to ApiRequestError
- 78c3426: Remove duplicate ApiRequestError export

**Deliverables:**
- ✅ Complete folder structure (components/, pages/, stores/, hooks/, services/, types/, utils/)
- ✅ TypeScript types for Project, Task, Artifact entities (5 files, 308 lines)
- ✅ Four Zustand stores with TypeScript (useProjectStore, useCreditStore, useUIStore, useAuthStore)
- ✅ Base API service with typed fetch wrappers (156 lines)
- ✅ Barrel files for clean imports
- ✅ Build compiles successfully (61.74 kB gzipped)

**Summary:** `.planning/phases/01-frontend-foundation/01-02-SUMMARY.md`

## Upcoming Work

### Phase 01: Frontend Foundation (Continued)

Estimated remaining plans: 0-1

Potential next plans:
- Layout components (Sidebar, DetailsPanel, Statusbar, WorkspaceLayout)
- Basic UI components (Button, Input, Card)
- Or proceed directly to Phase 02 (Core Functionality) if component library will be built as-needed

### Next Steps Options:

**Option A:** Complete Layout Components
- Create Sidebar, DetailsPanel, Statusbar, WorkspaceLayout
- Integrate with Zustand stores (useUIStore, useCreditStore, useAuthStore)
- Use design tokens for styling
- Estimated: 1 plan

**Option B:** Proceed to Core Functionality
- Build layout components as needed during page development
- Start with HomeDashboard and ProjectWorkspace pages
- Integrates state management and API layer immediately

**Recommendation:** Option A - Complete layout components first to establish consistent UI patterns.

### Phase 02: Core Functionality (Not Started)

### Phase 03: Advanced Features (Not Started)

## Technology Stack

**Frontend Framework:** React 19.2.9 with TypeScript
**Build Tool:** Create React App (considering Vite migration)
**CSS Framework:** Tailwind CSS 3.4.0
**State Management:** Zustand
**Data Fetching:** TanStack Query (React Query) 5.90.20
**Rich Text Editor:** Tiptap 3.17.1
**Graph Visualization:** ReactFlow
**Utilities:** clsx

**Design Tokens:** Custom CSS variables (119 properties)

## Architecture Notes

### Design System

- **Tokens:** All in `/home/zemul/Programming/research/frontend-v2/src/styles/design-tokens.css`
- **Theme:** Navy (#0f172a) primary with comprehensive functional colors
- **Typography:** Inter (UI) and JetBrains Mono (code)
- **Spacing:** Consistent scale from 4px to 64px

### Component Patterns

- Use semantic Tailwind classes for common patterns
- Use `var(--token-name)` for component-specific styling
- Component tokens available for: buttons, inputs, nodes, panels

### File Structure

```
frontend-v2/
├── src/
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components (future)
│   │   ├── graphs/              # Graph visualizations
│   │   ├── editor/              # Tiptap editor
│   │   ├── layout/              # Layout components (future)
│   │   ├── artifacts/           # Artifact viewers
│   │   ├── tasks/               # Task components
│   │   ├── chat/                # Chat interface
│   │   └── common/              # Shared components
│   ├── pages/                   # Page components (future)
│   ├── stores/                  # Zustand stores ✅
│   │   ├── useProjectStore.ts   # Project state
│   │   ├── useCreditStore.ts    # Credit balance
│   │   ├── useUIStore.ts        # UI state
│   │   └── useAuthStore.ts      # Authentication
│   ├── hooks/                   # Custom hooks (future)
│   ├── services/
│   │   └── api.ts               # Base API client ✅
│   ├── types/                   # TypeScript types ✅
│   │   ├── project.ts           # Project types
│   │   ├── task.ts              # Task types
│   │   ├── artifact.ts          # Artifact types
│   │   └── api.ts               # API types
│   ├── utils/                   # Utility functions (future)
│   ├── styles/
│   │   └── design-tokens.css    # All CSS custom properties
│   ├── index.css                # Global styles with design token import
│   └── App.tsx                  # Design token verification
├── .planning/                   # Planning artifacts
└── tailwind.config.js           # Tailwind with token integration
```

## Quality Metrics

**Build Status:** ✅ Passing
**Test Coverage:** Not measured yet
**TypeScript Coverage:** 100% (strict mode enabled)
**Linting:** Not configured yet
**Bundle Size:** 61.74 kB (gzipped) - baseline measurement

## External References

- **Design Tokens Spec:** `/home/zemul/Programming/research/.planning/DESIGN_TOKENS.md`
- **Frontend Architecture:** `/home/zemul/Programming/research/.planning/FRONTEND_ARCHITECTURE.md`
- **UI/UX Specification:** `/home/zemul/Programming/research/.planning/UI_UX_SPECIFICATION.md`
