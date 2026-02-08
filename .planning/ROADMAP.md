# Roadmap: Research Workspace

## Overview

v1.2 is a **completion milestone** — we've built all features (writer + chat + analysis + literature), now we must verify quality, fix bugs, and ship the MVP. The journey from v1.1 to v1.2: manual browser testing revealed 22 bugs (6 P0 blockers, 12 P1 major issues, 6 P2 minor), all must be fixed before production deployment. This milestone is about quality assurance, not feature development.

**Scope:** Complete manual testing, fix all discovered bugs, verify production readiness, authorize ship decision. No new features.

**Phase numbering:** Continues from v1.1 (which ended at Phase 20). v1.2 uses phases 21-24.

## Milestones

- ✅ **v1.0 Complete Research Workspace** - Phases 1-9 (shipped 2026-02-05)
- ✅ **v1.1 Frontend Integration & Polish** - Phases 10-20 (shipped 2026-02-08)
- 🚧 **v1.2 Ship MVP** - Phases 21-24 (in progress)

## Phases

<details>
<summary>✅ v1.0 Complete Research Workspace (Phases 1-9) - SHIPPED 2026-02-05</summary>

v1.0 delivered a complete research workspace with rich text editor, AI chat, file management, literature search, data analysis, and document export. All 64 requirements satisfied, 9 phases completed with 31 plans, 78,892 lines of code.

See [`.planning/milestones/v1.0-FINAL-MILESTONE-AUDIT.md`](.planning/milestones/v1.0-FINAL-MILESTONE-AUDIT.md) for full details.

</details>

<details>
<summary>✅ v1.1 Frontend Integration & Polish (Phases 10-20) - SHIPPED 2026-02-08</summary>

v1.1 delivered complete frontend integration with new React 19 + TypeScript + Vite design, all views connected to backend APIs, WebSocket real-time updates, auto-save with debouncing, and production polish (ESLint zero warnings, error boundaries, loading states). 11 phases completed with 27 plans.

### Phase 10: Frontend Foundation & Setup
**Goal**: Establish the new frontend project structure and development environment
**Plans**: 3 plans

### Phase 11: View Integration
**Goal**: Connect all main views to backend APIs
**Plans**: 4 plans

### Phase 12: Backend Feature Integration
**Goal**: Integrate backend features for full v1.0 feature parity
**Plans**: 4 plans

### Phase 13: Real-Time Features
**Goal**: Implement WebSocket connection and auto-save functionality
**Plans**: 2 plans

### Phase 14: Production Polish
**Goal**: Resolve code quality issues and complete manual testing
**Plans**: 4 plans (completed in Phase 18)

### Phase 15: Startup Script & Navigation Fixes
**Goal**: Fix critical configuration issues and complete navigation for all views
**Plans**: 2 plans

### Phase 16: Memory API Integration Fixes
**Goal**: Fix Memory API routes to match backend implementation
**Plans**: 1 plan

### Phase 17: WebSocket Connection Fixes
**Goal**: Fix WebSocket connection to use correct backend port
**Plans**: 1 plan

### Phase 18: Complete Phase 14 Production Polish
**Goal**: Complete manual browser testing and responsive design fixes
**Plans**: 2 plans

### Phase 19: Fix AnalysisView ProjectContext Integration
**Goal**: Fix hardcoded projectId bug in AnalysisView and resolve type mismatches
**Plans**: 3 plans

### Phase 20: Manual Browser Testing
**Goal**: Execute all 10 test flows and verify responsive design at actual viewports
**Plans**: 1 plan

</details>

### 🚧 v1.2 Ship MVP (In Progress)

**Milestone Goal:** Complete all manual testing, fix all discovered bugs, verify production readiness, and SHIP the MVP.

#### Phase 21: Complete Verification Testing
**Goal**: Finish remaining test verification after manual browser testing
**Depends on**: Phase 20
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04
**Success Criteria** (what must be TRUE):
  1. All 10 core backend flows tested and verified working (auth, files, documents, literature, citations, AI chat, analysis, export, memory, WebSocket)
  2. All 10 core user workflows tested end-to-end with pass/fail results documented
  3. Responsive design verified at 3 viewport breakpoints (375px mobile, 768px tablet, 1280px+ desktop)
  4. Manual browser testing results complete (TEST-04 already done - 22 bugs documented)
**Plans**: 1 plan

Plans:
- [ ] 21-01: Complete verification testing for all backend flows and user workflows

#### Phase 22: Fix All Bugs
**Goal**: Fix all 22 bugs discovered during manual testing (6 P0, 12 P1, 6 P2)
**Depends on**: Phase 21
**Requirements**: BUG-01 through BUG-21
**Success Criteria** (what must be TRUE):
  1. All 6 P0 blocker bugs fixed (literature search API, analysis execution API, project navigation, file download, bibliography API, citation search)
  2. All 12 P1 major bugs fixed (dashboard filter/view toggle, 3-dot menu, create project UX, document creation, editor connection, analysis pane size, settings routing, recent files, library menu buttons)
  3. All 5 P2 minor bugs fixed (double logo, dead UI elements, editor toolbar padding, library sidebar context)
  4. Regression testing complete - all 20 test flows still pass after bug fixes
**Plans**: 4 plans

Plans:
- [x] 22-01: Fix all 6 P0 blocker bugs (literature search, analysis execution, project navigation, file download, bibliography, citation search)
- [x] 22-02: Fix all 12 P1 major bugs (dashboard UX, project creation, document creation, editor features, analysis UX, settings, file/library views)
- [x] 22-03: Fix all 5 P2 minor bugs (UI polish, dead elements, visual consistency)
- [x] 22-04: Complete regression testing - verify all bug fixes don't break other flows

#### Phase 23: Production Readiness
**Goal**: Verify code quality, deployment configuration, performance, security
**Depends on**: Phase 22
**Requirements**: PROD-01, PROD-02, PROD-03, PROD-04
**Success Criteria** (what must be TRUE):
  1. Code quality verified - ESLint zero warnings, TypeScript compilation passes, frontend production build succeeds, all API endpoints respond
  2. Deployment configuration ready - environment variables documented, CORS configured, WebSocket URL set, database migrations documented, cloud storage credentials ready
  3. Performance characteristics acceptable - page load <3s, TipTap editor responsive, file upload progress displays, analysis timeout handling works
  4. Security verified - no hardcoded credentials, API keys from env, input validation on all endpoints, file upload size limits enforced, subprocess execution sandboxed
**Plans**: 1 plan

Plans:
- [ ] 23-01: Verify production readiness (code quality, deployment config, performance, security)

#### Phase 24: Ship Decision
**Goal**: Final ship checks and authorization to deploy MVP to production
**Depends on**: Phase 23
**Requirements**: SHIP-01, SHIP-02, SHIP-03, SHIP-04
**Success Criteria** (what must be TRUE):
  1. Zero P0/P1 bugs remaining - all blockers and major issues resolved
  2. All 20 test flows passing (10 backend flows, 10 user workflows, 3 viewport breakpoints)
  3. Production readiness checklist complete (code quality, deployment config, performance, security)
  4. Final ship decision authorized - stakeholder approval obtained, MVP ready for production deployment, deployment plan documented
**Plans**: 1 plan

Plans:
- [ ] 24-01: Complete final ship checks and authorize MVP production deployment

## Progress

**Execution Order:**
Phases execute in numeric order: 21 → 22 → 23 → 24

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-9 | v1.0 | 31/31 | Complete | 2026-02-05 |
| 10. Frontend Foundation | v1.1 | 3/3 | Complete | 2026-02-06 |
| 11. View Integration | v1.1 | 4/4 | Complete | 2026-02-06 |
| 12. Backend Feature Integration | v1.1 | 4/4 | Complete | 2026-02-07 |
| 13. Real-Time Features | v1.1 | 2/2 | Complete | 2026-02-07 |
| 14. Production Polish | v1.1 | 4/4 | Complete | 2026-02-08 |
| 15. Startup & Navigation Fixes | v1.1 | 2/2 | Complete | 2026-02-07 |
| 16. Memory API Integration Fixes | v1.1 | 1/1 | Complete | 2026-02-07 |
| 17. WebSocket Connection Fixes | v1.1 | 1/1 | Complete | 2026-02-07 |
| 18. Complete Phase 14 Production Polish | v1.1 | 2/2 | Complete | 2026-02-08 |
| 19. Fix AnalysisView ProjectContext | v1.1 | 3/3 | Complete | 2026-02-08 |
| 20. Manual Browser Testing | v1.1 | 1/1 | Complete | 2026-02-08 |
| 21. Complete Verification Testing | v1.2 | 0/1 | Not started | - |
| 22. Fix All Bugs | v1.2 | 0/4 | Not started | - |
| 23. Production Readiness | v1.2 | 0/1 | Not started | - |
| 24. Ship Decision | v1.2 | 0/1 | Not started | - |

**Overall Progress:** 58/66 plans complete (87.9%)

---

*Roadmap created: 2026-02-06*
*Last updated: 2026-02-08 - v1.2 Ship MVP roadmap created with 4 phases (21-24)*
