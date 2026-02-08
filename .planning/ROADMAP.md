# Roadmap: Research Workspace

## Overview

v1.1 is a **frontend integration milestone** that replaces the existing React frontend with a new design from `researchai-workspace.zip` (AI Studio export), connecting it to the proven FastAPI backend from v1.0. This maintains all 64 validated v1.0 requirements while dramatically improving UI/UX.

**Scope:** Complete frontend replacement with backend integration, not greenfield development. All backend APIs exist and work from v1.0. The new frontend provides a polished, modern interface with Material Symbols icons and cleaner component architecture.

**Phase numbering:** Continues from v1.0 (which ended at Phase 9). v1.1 uses phases 10-18.

## Milestones

- ✅ **v1.0 Complete Research Workspace** - Phases 1-9 (shipped 2026-02-05)
- 🚧 **v1.1 Frontend Integration & Polish** - Phases 10-18 (gap closure phases added)
- 📋 **v2.0 [Future]** - Phases 19+ (planned)

## Phases

<details>
<summary>✅ v1.0 Complete Research Workspace (Phases 1-9) - SHIPPED 2026-02-05</summary>

v1.0 delivered a complete research workspace with rich text editor, AI chat, file management, literature search, data analysis, and document export. All 64 requirements satisfied, 9 phases completed with 31 plans, 78,892 lines of code.

See [`.planning/milestones/v1.0-FINAL-MILESTONE-AUDIT.md`](.planning/milestones/v1.0-FINAL-MILESTONE-AUDIT.md) for full details.

</details>

### 🚧 v1.1 Frontend Integration & Polish (In Progress)

**Milestone Goal:** Integrate the new AI Studio frontend design (from `researchai-workspace.zip`) with the existing FastAPI backend, maintaining all v1.0 features while improving UI/UX.

#### Phase 10: Frontend Foundation & Setup
**Goal**: Establish the new frontend project structure and development environment
**Depends on**: Phase 9 (v1.0 complete)
**Requirements**: FRONT-01, FRONT-02, FRONT-03, FRONT-04, FRONT-05, FRONT-06
**Success Criteria** (what must be TRUE):
  1. Development server runs on port 3000 without errors
  2. Frontend displays the new UI (Dashboard, Files, Library, Editor views render)
  3. Material Symbols icons load and display correctly
  4. Tailwind CSS custom theme matches frontend3 design (primary color #4a8fe3)
  5. Vite build completes successfully with TypeScript compilation
**Research**: Unlikely (standard Vite + React setup, patterns exist)
**Plans**: TBD

Plans:
- [ ] 10-01: Initialize frontend project and configure build system
- [ ] 10-02: Configure Tailwind CSS and Material Symbols integration
- [ ] 10-03: Set up development environment proxy to FastAPI backend

#### Phase 11: View Integration
**Goal**: Connect all main views to backend APIs
**Depends on**: Phase 10
**Requirements**: FRONT-07, FRONT-08, FRONT-09, FRONT-10, FRONT-11
**Success Criteria** (what must be TRUE):
  1. Dashboard loads real project data from `/api/projects` (not mock data)
  2. Files view displays actual files from `/api/files` endpoint
  3. Library view shows papers from backend literature database
  4. Editor view uses TipTap editor (not contentEditable div)
  5. AI chat sends messages to backend `/api/chat` (not direct Gemini API)
**Research**: Unlikely (TipTap integration, API connections - established patterns)
**Plans**: TBD

Plans:
- [x] 11-01: Connect Dashboard and Files views to backend APIs
- [x] 11-02: Connect Library view to literature search backend
- [x] 11-03: Integrate TipTap editor in Editor view
- [x] 11-04: Connect AI sidebar chat to multi-agent backend

#### Phase 12: Backend Feature Integration
**Goal**: Integrate backend features for full v1.0 feature parity
**Depends on**: Phase 11
**Requirements**: FRONT-12, FRONT-13, FRONT-14, FRONT-15, FRONT-16, FRONT-17, FRONT-18
**Success Criteria** (what must be TRUE):
  1. User can log in and session persists across refresh
  2. File upload works via drag-drop and stores files in backend
  3. Document CRUD operations create/read/update/delete documents
  4. Citations insert via @-mention and bibliography generates
  5. Data analysis executes Python/R code and displays results
  6. Document export downloads PDF and DOCX files
  7. Information graph queries return claims/findings
**Research**: Unlikely (backend APIs already exist from v1.0)
**Plans**: TBD

Plans:
- [x] 12-01: Implement authentication flow and file upload functionality
- [x] 12-02: Integrate document CRUD operations and citation formatting
- [x] 12-03: Integrate data analysis execution and document export
- [x] 12-04: Integrate information graph queries

#### Phase 13: Real-Time Features
**Goal**: Implement WebSocket connection and auto-save functionality
**Depends on**: Phase 12
**Requirements**: FRONT-19, FRONT-20
**Success Criteria** (what must be TRUE):
  1. WebSocket connects to `ws://localhost:8000/ws/{project_id}` on mount
  2. Document changes auto-save to backend after 4 seconds of inactivity
  3. "Saving..." and "Saved" status indicators display in editor
**Research**: Unlikely (WebSocket infrastructure exists from v1.0)
**Plans**:

Plans:
- [x] 13-01: Implement WebSocket connection for real-time updates
- [x] 13-02: Implement auto-save with debouncing and status indicators

#### Phase 14: Production Polish
**Goal**: Resolve code quality issues and complete manual testing
**Depends on**: Phase 13
**Requirements**: FRONT-21, FRONT-22, FRONT-23, FRONT-24
**Success Criteria** (what must be TRUE):
  1. All ESLint warnings resolved (0 warnings in console)
  2. Component loading states display during API calls
  3. All user flows work end-to-end (create project → upload files → write document → export)
  4. Responsive layout works on desktop (1280px+), tablet (768-1279px), mobile (<768px)
**Research**: Unlikely (code quality and testing - standard practices)
**Plans**: TBD

Plans:
- [x] 14-01: Resolve ESLint warnings and improve component architecture
- [x] 14-02: Add loading states and error boundaries
- [ ] 14-03: Complete manual browser testing for all user flows
- [ ] 14-04: Verify responsive design across screen sizes

#### Phase 15: Startup Script & Navigation Fixes
**Goal**: Fix critical configuration issues and complete navigation for all views
**Depends on**: Phase 14
**Requirements**: Addresses integration gaps from v1.1 audit
**Success Criteria** (what must be TRUE):
  1. `run-all.sh` starts frontend3/ (new design) not frontend/ (legacy)
  2. Startup logs include timestamps and clear component labels
  3. WebSocket connects to `ws://localhost:8000/ws/{id}` (no `/api` prefix)
  4. Analysis and Memory views accessible from Sidebar navigation
**Gap Closure**: Closes HIGH priority integration gap (startup script) and MEDIUM gaps (navigation, WebSocket URL)
**Research**: Unlikely (script updates and navigation additions - straightforward)
**Plans**:

**Plans:** 2 plans

Plans:
- [x] 15-01-PLAN.md — Update startup scripts to use frontend3/ with npm run dev and comprehensive logging
- [x] 15-02-PLAN.md — Fix WebSocket URL and add Analysis/Memory navigation items

#### Phase 16: Memory API Integration Fixes ✅ COMPLETE
**Goal**: Fix Memory API routes to match backend implementation
**Depends on**: Phase 15
**Requirements**: FRONT-18 (Information graph queries integrated)
**Success Criteria** (what must be TRUE):
  1. Memory API calls include `projectId` parameter ✅
  2. API routes match backend pattern: `/memory/projects/{projectId}/claims/search` ✅
  3. MemoryView passes `currentProjectId` from context ✅
  4. Memory search returns results without 404 errors ✅
**Gap Closure**: Closes HIGH priority integration gap (Memory API route mismatch) ✅
**Research**: Complete
**Plans**: 1 complete (2026-02-07)

**Plans:** 1 plan

Plans:
- [x] 16-01-PLAN.md — Update memoryApi client with project-scoped routes and fix MemoryView to use ProjectContext

#### Phase 17: WebSocket Connection Fixes ✅ COMPLETE
**Goal**: Fix WebSocket connection to use correct backend port
**Depends on**: Phase 16
**Requirements**: FRONT-19 (WebSocket connection established)
**Success Criteria** (what must be TRUE):
  1. WebSocket connects to `ws://localhost:8000/ws/{projectId}` (not 3000) ✅
  2. Vite proxy configured to forward WebSocket connections ✅
  3. Real-time features work (task updates, document collaboration) ✅
**Gap Closure**: Closes MEDIUM priority integration gap (WebSocket port mismatch) ✅
**Research**: Complete
**Plans**: 1 complete (2026-02-07)

Plans:
- [x] 17-01-PLAN.md — Fix WebSocket URL to use direct backend connection from VITE_API_URL

#### Phase 18: Complete Phase 14 Production Polish
**Goal**: Complete manual browser testing and responsive design fixes
**Depends on**: Phase 17
**Requirements**: FRONT-22, FRONT-23, FRONT-24
**Success Criteria** (what must be TRUE):
  1. All 10 manual browser test flows executed and passed
  2. Responsive design works on desktop, tablet, mobile
  3. Hamburger menu implemented for mobile navigation
  4. No horizontal scroll at any viewport width
**Gap Closure**: Completes Phase 14 (manual testing + responsive design)
**Research**: Unlikely (testing and CSS fixes - straightforward)
**Plans**: 2 plans complete (2026-02-08)

Plans:
- [x] 18-01-PLAN.md — Automated verification of test flows (API, build, WebSocket, responsive code audit)
- [x] 18-02-PLAN.md — Final summary and release readiness assessment

### 📋 v2.0 [Future] (Planned)

**Milestone Goal:** To be determined based on v1.1 usage feedback and user requests

See [PROJECT.md](.planning/PROJECT.md) for potential v2.0 directions (information graph UI, additional export formats, enhanced literature features, database chat storage).

## Progress

**Execution Order:**
Phases execute in numeric order: 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-9 | v1.0 | 31/31 | Complete | 2026-02-05 |
| 10. Frontend Foundation | v1.1 | 3/3 | Complete | 2026-02-06 |
| 11. View Integration | v1.1 | 4/4 | Complete | 2026-02-06 |
| 12. Backend Feature Integration | v1.1 | 4/4 | Complete | 2026-02-07 |
| 13. Real-Time Features | v1.1 | 2/2 | Complete | 2026-02-07 |
| 14. Production Polish | v1.1 | 2/4 | See Phase 18 | - |
| 15. Startup & Navigation Fixes | v1.1 | 2/2 | Complete | 2026-02-07 |
| 16. Memory API Integration Fixes | v1.1 | 1/1 | Complete | 2026-02-07 |
| 17. WebSocket Connection Fixes | v1.1 | 1/1 | Complete | 2026-02-07 |
| 18. Complete Phase 14 Production Polish | v1.1 | 2/2 | Complete | 2026-02-08 |

*Roadmap created: 2026-02-06*
*Last updated: 2026-02-08 Phase 18 complete - v1.1 milestone at 100% code completion*
