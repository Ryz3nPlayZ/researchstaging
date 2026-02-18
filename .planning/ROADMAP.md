# Roadmap: Research Platform - Research-Native AI Execution System

## Overview

**Product Vision:** Research-native AI execution system — maintains structured research state, coordinates specialized agents, enforces provenance and evaluation before integrating outputs. Turn AI from chat interface into controlled research collaborator embedded in persistent project environment.

**The Core Differentiator:**
| Most AI Tools | This Product |
|---------------|--------------|
| Generate answers | Maintain research state |
| Stateless | Project-based |
| Output-oriented | Process-oriented |
| Trust first output | Verify before integration |
| Session-based | Persistent memory |

**Current Milestone (v1.2):** Ship AI-Native Research Workspace MVP with Hellycopter UX. Complete UX redesign (~80% done), finish remaining pages, verify production readiness. This is Phase 1 of 4-phase vision.

**Long-Term Vision:**
| Phase | Name | Focus |
|-------|------|-------|
| 1 (v1.2-1.3) | AI-Native Workspace | Persistent memory + multi-agent orchestration |
| 2 (v1.4-1.5) | Epistemic Infrastructure | Claim graph + confidence scoring + provenance |
| 3 (v2.0+) | Research Integrity Engine | Auto verification + reproducibility scoring |
| 4 (v3.0+) | Platform Layer | API/SDK for research tool ecosystem |

**Defensible Moat:** Not UI — coordinated stateful reasoning + provenance layer + accumulated project graph data. Over time: better context compression, better evaluation heuristics, better hallucination detection.

**Phase numbering:** v1.0-v1.1 built foundation (phases 1-20). v1.2 ships AI-native workspace MVP (phases 21-24). v1.3+ builds epistemic infrastructure (phases 25+).

## Milestones

- ✅ **v1.0 Research Workspace Foundation** - Phases 1-9 (shipped 2026-02-05)
- ✅ **v1.1 Frontend Integration & Polish** - Phases 10-20 (shipped 2026-02-08)
- 🚧 **v1.2 AI-Native Workspace MVP** - Phases 21-24 (in progress)
- 📋 **v1.3 Epistemic Infrastructure** - Phases 25-35 (planned)
- 📋 **v2.0 Research Integrity Engine** - Phases 36-50 (planned)
- 📋 **v3.0 Platform Layer** - Phases 51+ (vision)

## Phases

<details>
<summary>✅ v1.0 Research Workspace Foundation (Phases 1-9) - SHIPPED 2026-02-05</summary>

v1.0 delivered the foundational infrastructure: rich text editor (TipTap), AI chat sidebar, file management, literature search integration, data analysis execution, and document export. Established the backend architecture (FastAPI, PostgreSQL, Redis) and multi-agent coordination patterns. All 64 requirements satisfied, 9 phases completed with 31 plans, 78,892 lines of code.

See [`.planning/milestones/v1.0-FINAL-MILESTONE-AUDIT.md`](.planning/milestones/v1.0-FINAL-MILESTONE-AUDIT.md) for full details.

</details>

<details>
<summary>✅ v1.1 Frontend Integration (Phases 10-20) - SHIPPED 2026-02-08</summary>

v1.1 delivered frontend integration with React 19 + TypeScript + Vite, connecting all views to backend APIs. Implemented WebSocket real-time updates, auto-save with debouncing, and production polish (ESLint zero warnings, error boundaries, loading states). Fixed all P0/P1/P2 bugs from testing. 11 phases completed with 27 plans.

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

### 🚧 v1.2 AI-Native Workspace MVP - In Progress

**Milestone Goal:** Complete UX redesign with Hellycopter dashboard, finish all pages, verify production readiness, and SHIP the AI-native research workspace.

**What This Delivers:**
- Persistent project memory (documents, claims, datasets, analyses, task history)
- Multi-agent orchestration (Router, Planner, Context Manager, Work Agents, Evaluator, Integrator)
- Tool execution (write into documents, run code, execute analyses)
- Provenance tracking (every output linked to sources)
- Research-native structure (understands paper sections, dataset-result links, claim-evidence ties)

**Ship Strategy:** The workspace is ~80% complete in `research-ui/` — built with Next.js 15, Hellycopter v2 design system (bento-grid, pistachio/mint palette), and all core components (dashboard, projects, auth, literature, editor). Remaining work: visual tweaks, complete remaining pages, QA.

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

#### Phase 22: Fix All Bugs & UX Redesign
**Goal**: Fix all 22 bugs discovered during manual testing AND redesign the entire UX based on user feedback
**Depends on**: Phase 21
**Requirements**: BUG-01 through BUG-21, UX-01 through UX-10
**Success Criteria** (what must be TRUE):
  1. All 6 P0 blocker bugs fixed (literature search API, analysis execution API, project navigation, file download, bibliography API, citation search)
  2. All 12 P1 major bugs fixed (dashboard filter/view toggle, 3-dot menu, create project UX, document creation, editor connection, analysis pane size, settings routing, recent files, library menu buttons)
  3. All 5 P2 minor bugs fixed (double logo, dead UI elements, editor toolbar padding, library sidebar context)
  4. **UX redesigned** - complete overhaul of user experience based on Hellycopter PRD and user feedback
  5. Regression testing complete - all 20 test flows still pass after bug fixes and UX redesign
**Plans**: 7 plans

Plans:
- [x] 22-01: Fix all 6 P0 blocker bugs (literature search, analysis execution, project navigation, file download, bibliography, citation search)
- [x] 22-02: Fix all 12 P1 major bugs (dashboard UX, project creation, document creation, editor features, analysis UX, settings, file/library views)
- [x] 22-03: Fix all 5 P2 minor bugs (UI polish, dead elements, visual consistency)
- [x] 22-04: Complete regression testing - verify all bug fixes don't break other flows
- [x] 22-05: Gap closure - fix 7 remaining issues from regression testing (literature search, AI chat, bibliography, navigation, project creation, analysis pane, 3-dot menu)
- [🔄] 22-06: Complete UX redesign - redesign entire user experience based on Hellycopter PRD (in progress - ~80% complete)
- [ ] 22-07: Finish remaining pages and validate complete UX (analysis, memory, settings views; visual polish; responsive verification)

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

</details>

### 📋 Phase 2: Epistemic Infrastructure (v1.3+) - Planned

**Milestone Goal:** Make the research state visible and queryable. Claim graph visualization, confidence scoring, provenance browsing.

**What This Delivers:**
- Visible claim graph with evidence links
- Confidence scoring on all AI-generated content
- Provenance browser (trace any output to source)
- Evaluation metrics (citation density, logical consistency)
- Research integrity dashboard

**Leveraged Infrastructure:** All backend from v1.2
- ✅ Task orchestration engine with state machine
- ✅ Artifact-first memory system (claims, findings, evidence)
- ✅ Multi-provider LLM service
- ✅ Literature service (Semantic Scholar, arXiv, Unpaywall)

**New Components Required:**
- Claim graph visualization UI (D3.js or similar)
- Confidence scoring algorithms
- Provenance tracing system
- Evaluation metrics engine
- Interactive evidence browser

**Estimated Phases:** 25-35 (10-12 phases)

---

### 📋 Phase 3: Research Integrity Engine (v2.0+) - Planned

**Milestone Goal:** Automatic verification of research claims. Reproducibility scoring, cross-project reasoning, claim-evidence mapping.

**What This Delivers:**
- Automatic claim-evidence mapping
- Reproducibility scoring for analyses
- Cross-project reasoning (insights from past projects)
- Integrity alerts (contradictions, weak support)
- Peer review emulation

**Key Features:**
- "Show your work" for every claim
- Reproducibility reports for data analyses
- Contradiction detection across documents
- Confidence-based highlighting
- Automated peer review suggestions

**Estimated Phases:** 36-50 (15+ phases)

---

### 📋 Phase 4: Platform Layer (v3.0+) - Vision

**Milestone Goal:** Expose orchestration + provenance as API. Become the infra layer for other research tools.

**What This Delivers:**
- API for agent orchestration
- API for provenance queries
- SDK for building research tools
- Integrations with other platforms
- Developer marketplace for research agents

**Key Features:**
- `POST /api/agents/plan` — Generate research plan
- `POST /api/agents/execute` — Run coordinated workflow
- `GET /api/provenance/{artifact_id}` — Trace any output
- Webhooks for research events
- Agent marketplace

**Estimated Phases:** 51+ (future phases)

---

## Long-Term Vision Summary

| Phase | Focus | Outcome |
|-------|-------|---------|
| 1 (v1.2-v1.3) | AI-Native Workspace | Persistent project memory with multi-agent orchestration |
| 2 (v1.4-v1.5) | Epistemic Infrastructure | Visible claim graph, confidence scoring, provenance |
| 3 (v2.0+) | Research Integrity Engine | Auto verification, reproducibility, cross-project reasoning |
| 4 (v3.0+) | Platform Layer | API/SDK for research tool ecosystem |

**The moat accumulates:**
- Phase 1: User data + project graphs
- Phase 2: Evaluation heuristics + provenance data
- Phase 3: Research integrity models
- Phase 4: Platform lock-in + network effects

**Phase 1 Success Criteria:**
- Persistent project memory (state persists across sessions)
- Multi-agent tasks can be planned, executed, verified, integrated
- All outputs have provenance (traceable to source documents, tools, reasoning)
- Research-native structure (paper sections, datasets linked to results, claims tied to evidence)
- Evaluation before integration (outputs checked before becoming part of project state)

## Progress

**Execution Order:**
Phases execute in numeric order: 22 → 23 → 24

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-9 | v1.0 Foundation | 31/31 | Complete | 2026-02-05 |
| 10-20 | v1.1 Frontend Integration | 27/27 | Complete | 2026-02-08 |
| 21. Verification Testing | v1.2 | 1/1 | Complete | 2026-02-08 |
| 22. UX Redesign & Bug Fixes | v1.2 | 5/7 | 🔄 In Progress | 2026-02-18 |
| 23. Production Readiness | v1.2 | 0/1 | Not started | - |
| 24. Ship Decision | v1.2 | 0/1 | Not started | - |

**Overall Progress:** 64/69 plans complete (92.8%)

**Phase 22 Status:**
- 22-01 through 22-05: ✅ Complete (all bugs fixed, gap closure done)
- 22-06: 🔄 In Progress (~80% - UX redesign with Hellycopter in `research-ui/`)
- 22-07: ⏳ Pending (finish remaining pages, validate complete UX)

---

*Roadmap created: 2026-02-06*
*Last updated: 2026-02-18 - Core product vision clarified: research-native AI execution system. 4-phase vision: AI-native workspace → epistemic infrastructure → research integrity engine → platform layer. v1.2 shipping with Hellycopter UX.*
