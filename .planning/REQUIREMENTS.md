# Requirements: Research Workspace v1.2

**Defined:** 2026-02-08
**Milestone:** v1.2 Ship MVP
**Core Value:** Stateful research intelligence — Single workspace where AI agent remembers everything important (all chats, analyses, documents, file contents) and uses that context to provide genuinely helpful research assistance.

## v1.2 Requirements

Requirements for v1.2 Ship MVP milestone. Goal: Complete all manual testing, fix any bugs discovered, verify production readiness, and SHIP the MVP.

**MUST HAPPEN:** All core backend and frontend flows must work. Everything must work. No matter what.

### Manual Browser Testing

- [ ] **TEST-01**: Test all 10 core backend flows manually
  - Authentication: Mock login works, session persists across refresh
  - File Management: Upload 8 file types (PDF, DOCX, MD, CSV, Excel, Python, R, JS), delete, organize
  - Document CRUD: Create, edit, auto-save, delete documents
  - Literature Search: Semantic Scholar API returns papers, Unpaywall finds PDFs
  - Citations: @-mention citations search literature, bibliography generates (APA, MLA, Chicago)
  - AI Chat: All 4 agent types (Document, Literature, Memory, General) respond correctly
  - Analysis Execution: Python/R code executes, results display (tables, charts, text)
  - Document Export: PDF export works, DOCX export works
  - Memory/Graph: Claims storage works, findings save, relationships query
  - WebSocket: Real-time updates propagate, auto-save triggers, connection status shows

- [ ] **TEST-02**: Test all 10 core user workflows end-to-end
  1. User can create new project
  2. User can upload files via drag-drop
  3. User can write and format text in TipTap editor (bold, italic, headings, lists)
  4. User can insert citations and generate bibliography
  5. User can search literature and import papers
  6. User can execute data analysis and view results
  7. User can export document to PDF
  8. User can export document to DOCX
  9. User can chat with AI agent (all 4 agent types)
  10. User can view memory/graph (claims, findings, relationships)

- [ ] **TEST-03**: Verify responsive design at 3 viewport breakpoints
  - Mobile (375px): Layout usable, hamburger menu works, no horizontal scroll
  - Tablet (768px): Sidebar collapsible, AI panel works, content readable
  - Desktop (1280px+): Full layout with all panels (Navigator, Workspace, AI chat)

- [x] **TEST-04**: Document all test results with pass/fail status
  - ✅ **COMPLETE**: Manual testing completed via user testing session
  - ✅ Documented 20 bugs: 6 P0 blockers, 10 P1 major issues, 4 P2 minor issues
  - ✅ All bugs categorized with severity and impact analysis
  - Results documented in REQUIREMENTS.md BUG-01 through BUG-21

### Bug Fixes

**P0 Blockers (Discovered via manual testing - 6 issues):**
- [ ] **BUG-01**: Fix Literature Search API 422 error
  - Endpoint: `/api/literature/search?q={query}&limit=20`
  - Error: "HTTP 422: Unprocessable Content"
  - Impact: Cannot search literature, citation search broken
  - Fix: Verify backend endpoint exists and handles query parameters correctly

- [ ] **BUG-02**: Fix Analysis Execution API 404 error
  - Endpoint: `/api/analysis/projects/{projectId}/execute`
  - Error: "HTTP 404: Not Found"
  - Impact: Cannot execute Python/R code analysis
  - Fix: Verify backend endpoint exists and route is registered

- [ ] **BUG-03**: Fix Project Navigation - click project to enter
  - Issue: Clicking on project tiles does nothing
  - Impact: Cannot access existing projects
  - Fix: Implement onClick handler to navigate to project view

- [ ] **BUG-04**: Fix File Download 404 error
  - Issue: Uploaded files return "not found" when downloading
  - Impact: Cannot retrieve uploaded files
  - Fix: Verify file storage backend integration and download endpoint

- [ ] **BUG-05**: Fix Bibliography API 404 error
  - Endpoint: `/api/documents/{documentId}/bibliography?style={apa|mla|chicago}`
  - Error: "HTTP 404: Not Found"
  - Impact: Cannot generate bibliography
  - Fix: Implement backend bibliography endpoint

- [ ] **BUG-06**: Fix Citation Search API 422 error
  - Endpoint: `/api/literature/search` (from editor citation modal)
  - Error: "HTTP 422: Unprocessable Content"
  - Impact: Cannot insert citations in documents
  - Fix: Verify literature search backend handles citation queries

**P1 Major Issues (Discovered via manual testing - 9 issues):**
- [ ] **BUG-07**: Fix Dashboard - Filter button functionality
  - Issue: Filter button does nothing when clicked
  - Impact: Cannot filter projects
  - Fix: Implement filter logic (recent/all, search, etc.)

- [ ] **BUG-08**: Fix Dashboard - Grid/List view toggle
  - Issue: Grid/List switch does nothing
  - Impact: Cannot change project display mode
  - Fix: Implement toggle state and view rendering

- [ ] **BUG-09**: Fix Dashboard - 3-dot menu on projects
  - Issue: 3-dot menu does nothing when clicked
  - Impact: Cannot access project actions (delete, rename, etc.)
  - Fix: Implement dropdown menu with project actions

- [ ] **BUG-10**: Fix Create Project UX - auto-navigate to project
  - Issue: Creating project doesn't navigate into it
  - Impact: Confusing UX, user doesn't know where project was created
  - Fix: Add navigation to newly created project after creation

- [ ] **BUG-11**: Fix "New Project" tile position
  - Issue: "New project" tile at end of list instead of beginning
  - Impact: Confusing UX, user expects it first
  - Fix: Move "New project" tile to beginning of grid/list

- [ ] **BUG-12**: Fix Document Creation - accessible from project view
  - Issue: Only way to create document is top bar button (unclear)
  - Impact: UX confusion, unclear where document is being created
  - Fix: Add "New Document" button in project view, clarify context

- [ ] **BUG-13**: Fix Document Placeholder Text
  - Issue: Document shows "start writing your document..." that must be deleted
  - Impact: Annoying UX, forced manual deletion
  - Fix: Remove placeholder text, start with blank document

- [ ] **BUG-14**: Fix Editor Connection Status
  - Issue: Editor toolbar shows "offline" instead of live connection
  - Impact: User thinks connection failed, no confidence in auto-save
  - Fix: Verify WebSocket connection and update status indicator

- [ ] **BUG-15**: Fix Analysis Code Pane Size
  - Issue: Code pane too small (~2.5" x 4.5"), doesn't fill panel
  - Impact: Poor UX, hard to write code in small area
  - Fix: Set code pane to fill available space (100% width/height)

- [ ] **BUG-16**: Fix Settings View Routing
  - Issue: Clicking settings shows dashboard instead of settings
  - Impact: Cannot access settings
  - Fix: Implement settings route and view component

- [ ] **BUG-17**: Fix Recent Files Display
  - Issue: Previously uploaded files don't show in "Recent Files"
  - Impact: Files seem lost, confusing
  - Fix: Verify database connection and file query logic

**P2 Minor Issues (Discovered via manual testing - 3 issues):**
- [ ] **BUG-18**: Fix Double Logo in UI
  - Issue: Two logos visible (sidebar "Research AI workspace" + top bar "ResearchHub book logo")
  - Impact: Visual clutter, unprofessional appearance
  - Fix: Remove one logo or consolidate branding

- [ ] **BUG-19**: Fix Dead UI Elements (top bar)
  - Issue: Search bar, notification icon, profile pictures do nothing when clicked
  - Impact: Confusing UX, users expect these to work
  - Fix: Either implement functionality or remove/disable elements

- [ ] **BUG-20**: Fix Editor Toolbar Padding
  - Issue: Top utility bar has extra padding on bottom ("chin")
  - Impact: Visual inconsistency
  - Fix: Adjust CSS padding to match other views

**Regression Testing:**
- [ ] **BUG-21**: Verify all bug fixes don't break other flows
  - After fixing each bug, test related flows
  - Ensure fixing one bug doesn't break another
  - All 20 test flows still pass after all bug fixes

### Production Readiness

- [ ] **PROD-01**: Verify code quality metrics
  - ESLint: Zero warnings across all frontend3 source files
  - TypeScript: Compilation passes with no errors
  - Frontend build: Production build succeeds (`npm run build`)
  - Backend health: All API endpoints respond correctly

- [ ] **PROD-02**: Verify deployment configuration
  - Environment variables documented (`.env.template` up to date)
  - CORS configuration correct for production domain
  - WebSocket URL configured for production (`VITE_API_URL`)
  - Database migrations documented
  - Cloud storage credentials ready (if using S3/R2)

- [ ] **PROD-03**: Verify performance characteristics
  - Page load time < 3 seconds on reasonable connection
  - TipTap editor responsive (no typing lag)
  - File upload progress displays correctly
  - Analysis execution timeout handling works (60 seconds)

- [ ] **PROD-04**: Security verification
  - No hardcoded credentials in code
  - API keys loaded from environment variables
  - User input validation on all endpoints
  - File upload size limits enforced (50MB default)
  - Subprocess execution sandboxed (Python/R analysis)

### Ship Decision

- [ ] **SHIP-01**: Zero P0/P1 bugs remaining
  - All blockers resolved
  - All major issues resolved

- [ ] **SHIP-02**: All 20 test flows passing (TEST-01 + TEST-02 + TEST-03)
  - 10 backend flows: PASS
  - 10 user workflows: PASS
  - 3 viewport breakpoints: PASS

- [ ] **SHIP-03**: Production readiness checklist complete (PROD-01 through PROD-04)
  - Code quality verified
  - Deployment configuration ready
  - Performance acceptable
  - Security verified

- [ ] **SHIP-04**: Final ship decision authorized
  - Stakeholder approval obtained
  - MVP ready for production deployment
  - Deployment plan documented

## v1.0/v1.1 Validated Requirements (Reference)

These features shipped in v1.0 and v1.1 and must remain functional in v1.2:

### Infrastructure (v1.0)
- ✓ FastAPI backend with PostgreSQL + Redis
- ✓ Task orchestration engine with state machine
- ✓ WebSocket real-time updates
- ✓ LLM service with multi-provider support
- ✓ Credit system for API usage tracking
- ✓ React frontend shell with context providers

### Core Features (v1.0)
- ✓ Rich Text Document Editor (TipTap-based, auto-save, version history, citations)
- ✓ Sidebar AI Agent Panel (multi-agent orchestration, total recall memory)
- ✓ Project Import & File Management (drag-drop, 8 file types, cloud storage)
- ✓ Literature Search & Review (Semantic Scholar, Unpaywall, PDF parsing, claim extraction)
- ✓ Data Analysis Execution (Monaco editor, Python/R sandbox, Plotly results)
- ✓ Information Graph Backend (claim storage, relationship tracking, relevance scoring)
- ✓ Document Export (Pandoc-based PDF/DOCX export)
- ✓ File Content Loading (Markdown/DOCX to TipTap parsing)

### Frontend Integration (v1.1)
- ✓ New React 19 + TypeScript + Vite frontend integrated
- ✓ All views connected to backend APIs (Dashboard, Files, Library, Editor, Analysis, Memory)
- ✓ Authentication flow (mock for local, Google OAuth for production)
- ✓ File upload with drag-drop, progress tracking, validation
- ✓ Document CRUD operations with TipTap editor
- ✓ Citation formatting (APA, MLA, Chicago) with bibliography
- ✓ Data analysis execution with Monaco editor
- ✓ Document export (PDF/DOCX)
- ✓ Information graph queries
- ✓ WebSocket real-time updates with auto-save
- ✓ Production polish (ESLint zero warnings, error boundaries, loading states)

## v2.0 Requirements (Deferred)

Features explicitly deferred to post-v1.2:

### Information Graph Visualization UI
- **GRAPH-01**: Interactive D3.js or Cytoscape.js graph visualization
- **GRAPH-02**: Filter by citation count, theme, or date
- **GRAPH-03**: Click nodes to navigate to related artifacts

### Additional Export Formats
- **EXPORT-01**: LaTeX export with BibTeX
- **EXPORT-02**: HTML export with styling
- **EXPORT-03**: Markdown export

### Enhanced Literature Features
- **LIT-01**: AI-assisted literature search and summarization
- **LIT-02**: Semantic search with vector embeddings

### Chat Storage
- **CHAT-01**: Database-backed chat storage (currently in-memory for MVP)

## Out of Scope

Explicitly excluded from v1.2:

| Feature | Reason |
|---------|--------|
| New features beyond bug fixes | This is completion/quality milestone, not feature development |
| Performance optimization beyond basic verification | Performance acceptable for MVP, optimization for v1.2.1 |
| Refactoring for elegance | Code works, refactor later if needed |
| Comprehensive edge case handling | Handle happy path + obvious errors, exotic edge cases defer |
| Mobile app | Research requires desktop, responsive web sufficient |

## Traceability

Which phases cover which requirements. Updated by roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TEST-01, TEST-02, TEST-03 | Phase 21 | Pending |
| TEST-04 | Phase 21 | ✅ Complete (manual testing done, bugs documented) |
| BUG-01 through BUG-06 (P0 blockers) | Phase 22 | Pending |
| BUG-07 through BUG-17 (P1 major) | Phase 22 | Pending |
| BUG-18 through BUG-20 (P2 minor) | Phase 22 | Pending |
| BUG-21 (regression testing) | Phase 22 | Pending |
| PROD-01, PROD-02, PROD-03, PROD-04 | Phase 23 | Pending |
| SHIP-01, SHIP-02, SHIP-03, SHIP-04 | Phase 24 | Pending |

**Coverage:**
- v1.2 requirements: 33 total (16 original + 17 bug fixes)
- Mapped to phases: 33
- Unmapped: 0 ✓

**Bug Breakdown:**
- P0 Blockers: 6 (BUG-01 through BUG-06) - Core functionality completely broken
- P1 Major: 11 (BUG-07 through BUG-17) - Severe UX degradation
- P2 Minor: 4 (BUG-18 through BUG-21) - Cosmetic issues

**Note:** TEST-01 through TEST-03 are pending (automated/backend verification). TEST-04 is complete (manual browser testing revealed 20 bugs). BUG-01 through BUG-21 must all be fixed before ship decision.

---

*Requirements defined: 2026-02-08*
*Last updated: 2026-02-08 after v1.2 requirements definition*
