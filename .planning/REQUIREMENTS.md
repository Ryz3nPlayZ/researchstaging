# Requirements: Research Workspace v1.1

**Defined:** 2026-02-06
**Milestone:** v1.1 Frontend Integration & Polish
**Core Value:** Stateful research intelligence — Single workspace where AI agent remembers everything important (all chats, analyses, documents, file contents) and uses that context to provide genuinely helpful research assistance.

## v1.1 Requirements

Requirements for v1.1 frontend integration milestone. Goal: Integrate new React 19 + TypeScript + Vite frontend (from researchai-workspace.zip) with existing FastAPI backend, maintaining all v1.0 validated features while improving UI/UX.

### Frontend Architecture & Setup

- [x] **FRONT-01**: Frontend project initialized with new design from researchai-workspace.zip
- [x] **FRONT-02**: Build system configured with Vite + React 19 + TypeScript
- [x] **FRONT-03**: Development environment proxy configured to existing FastAPI backend (http://localhost:8000)
- [x] **FRONT-04**: Material Symbols icons integrated with proper loading
- [x] **FRONT-05**: Tailwind CSS configured with custom theme matching researchai-workspace.zip design
- [x] **FRONT-06**: Development server runs without errors (`npm run dev` serves frontend)

### View Integration

- [x] **FRONT-07**: Dashboard view connects to `/api/projects` backend endpoint
  - Replace mock project data with real API calls
  - Display projects from backend database
  - "Create Project" button triggers backend project creation
- [x] **FRONT-08**: Files view connects to `/api/files` backend endpoints
  - Replace mock file data with real API calls
  - File list loads from backend (documents, PDFs, datasets, code)
  - File metadata displays correctly (name, type, size, uploaded date, status)
- [x] **FRONT-09**: Library view connects to `/api/literature` backend endpoints
  - Replace mock paper data with real API calls
  - Literature search form submits to Semantic Scholar API via backend
  - Paper display includes title, authors, journal, year, abstract, PDF access
- [x] **FRONT-10**: Editor view integrates TipTap editor component
  - Replace `contentEditable` div with actual TipTap editor
  - Toolbar buttons (bold, italic, link, quote, list) trigger TipTap commands
  - Document content loads from backend via `/api/documents/{id}`
  - Editor state persists to backend on changes
- [x] **FRONT-11**: AI sidebar chat connects to multi-agent backend system
  - Replace `geminiService.ts` with backend API calls to `/api/chat`
  - Chat messages route through backend orchestration service
  - Multi-agent selection (Document, Literature, Memory, General) works
  - Proposal workflow displays: AI suggests actions, user approves, then executes

### Backend API Integration

- [x] **FRONT-12**: Authentication flow integrated
  - Mock authentication for local development (auto-login as test user)
  - Google OAuth preserved for production backend integration
  - User session persists in localStorage
  - Protected routes redirect to login if not authenticated
- [x] **FRONT-13**: File upload functionality implemented
  - Drag-drop upload zone calls `/api/files/upload` multipart endpoint
  - Upload progress bar displays (if supported by backend)
  - File type validation matches backend (PDF, DOCX, MD, CSV, Excel, Python, R, JS)
  - File size limits enforced (50MB default)
  - Duplicate file auto-renaming works (filename (N).ext pattern)
- [x] **FRONT-14**: Document CRUD operations functional
  - Create document: "New Document" button calls `/api/documents` POST endpoint
  - Read document: Load document content from `/api/documents/{id}` GET endpoint
  - Update document: TipTap changes debounce to `/api/documents/{id}` PUT endpoint (4-second debounce)
  - Delete document: Delete option calls `/api/documents/{id}` DELETE endpoint
- [x] **FRONT-15**: Citation formatting integrated
  - @-mention citations search literature database via backend
  - Citation autocomplete dropdown displays matching papers
  - Selected citation inserts in proper format (APA, MLA, Chicago)
  - Bibliography auto-generates from document citations via backend `/api/citations`
- [x] **FRONT-16**: Data analysis execution integrated
  - Monaco editor component loads for Python/R code editing
  - Code submission sends to `/api/analysis/execute` backend endpoint
  - Analysis results display (tables via backend HTML, charts via Plotly.js, text output)
  - Result download buttons work (CSV, PNG, TXT formats)
- [x] **FRONT-17**: Document export functionality integrated
  - Export dropdown in toolbar offers PDF and DOCX formats
  - PDF export calls `/api/export/pdf` with document content
  - DOCX export calls `/api/export/docx` with document content
  - Exported file downloads to browser via blob handling
- [x] **FRONT-18**: Information graph queries integrated
  - Claims, findings, relationships display from backend `/api/memory` queries
  - Search queries submit to backend relevance scoring endpoint
  - Graph visualization optional (defer to v1.2 if not in scope)

### Real-Time Features & State Management

- [x] **FRONT-19**: WebSocket connection established for real-time updates
  - WebSocket connects to `ws://localhost:8000/ws/{project_id}` on mount
  - Real-time events: document changes, analysis progress, chat responses
  - Connection error handling with reconnection logic
  - WebSocket closes cleanly on component unmount
- [x] **FRONT-20**: Auto-save with debouncing implemented
  - TipTap editor changes debounce for 4 seconds
  - Auto-save sends to backend `/api/documents/{id}` endpoint
  - localStorage backup saves immediately as fallback
  - "Saving..." and "Saved" status indicators display

### Production Polish

- [x] **FRONT-21**: All ESLint warnings resolved
  - Fix missing useCallback dependencies in current frontend
  - Fix duplicate markdown_to_tiptap function shadowing warning
  - No console errors or warnings in browser dev tools
- [x] **FRONT-22**: Component architecture follows React best practices
  - All hooks declared before conditional returns
  - No prop drilling (use React Context where appropriate)
  - Proper error boundaries for route-level error handling
  - Component loading states (skeletons, spinners) during API calls
- [ ] **FRONT-23**: Manual browser testing complete for all user flows
  - Create new project and add documents
  - Upload files (PDF, DOCX, CSV) and verify display
  - Write and format text in TipTap editor
  - Insert citations and generate bibliography
  - Search literature and import papers
  - Execute data analysis and view results
  - Export documents to PDF and DOCX
  - Chat with AI assistant across all agent types
- [ ] **FRONT-24**: Responsive design works across screen sizes
  - Desktop layout (1280px+): Full sidebar + main content + AI chat panel
  - Tablet layout (768px-1279px): Collapsible sidebar, main content + AI chat
  - Mobile layout (<768px): Stacked layout, hamburger menu for sidebar
  - No horizontal scrolling at any viewport width

## v1.0 Validated Requirements (Reference)

These features shipped in v1.0 and must remain functional in v1.1:

### Authentication & User Management
- ✓ **AUTH-01**: User can sign in with Google OAuth
- ✓ **AUTH-02**: User account automatically created on first OAuth login
- ✓ **AUTH-03**: User can sign out
- ✓ **AUTH-04**: User session persists across browser refresh

### Document Editor
- ✓ **EDIT-01** through **EDIT-15**: Rich text editing, auto-save, version history, citations, export

### AI Agent & Sidebar Chat
- ✓ **AI-01** through **AI-10**: Multi-agent orchestration, proposal workflow, total recall memory

### File Management
- ✓ File upload, cloud storage, folder operations, metadata extraction

### Literature Search & Review
- ✓ Semantic Scholar integration, Unpaywall PDF finding, claim extraction

### Data Analysis Execution
- ✓ Python/R code generation, Monaco editor, sandboxed execution, results display

### Information Graph Backend
- ✓ Claim storage, relationship tracking, relevance scoring

### Document Export
- ✓ PDF/DOCX export via Pandoc

### File Content Loading
- ✓ Markdown/DOCX to TipTap parsing

## v2 Requirements (Deferred)

Features explicitly deferred to post-v1.1:

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

Explicitly excluded from v1.1:

| Feature | Reason |
|---------|--------|
| Real-time multi-user editing | Extreme complexity (OT/CRDT), conflicts with research workflow model. Async sharing sufficient for v1.1. |
| Mobile app | Research work requires desktop; responsive web UI meets mobile needs. |
| Social features (sharing, comments) | Network effects require scale; single-user productivity is the focus. |
| Native desktop app | Web-based deployment prioritized for cross-platform access. |
| Video/audio analysis | Expensive transcription APIs; focus on text/PDF analysis. |
| Real-time web browsing | Flaky and costly; static literature APIs more reliable. |

## Traceability

Which phases cover which requirements. Updated by create-roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FRONT-01, FRONT-02, FRONT-03, FRONT-04, FRONT-05, FRONT-06 | Phase 10 | Complete |
| FRONT-07, FRONT-08, FRONT-09, FRONT-10, FRONT-11 | Phase 11 | Complete |
| FRONT-12, FRONT-13, FRONT-14, FRONT-15, FRONT-16, FRONT-17 | Phase 12 | Complete |
| FRONT-18 | Phase 16 | Complete |
| FRONT-19, FRONT-20 | Phase 13 | Complete |
| FRONT-21, FRONT-22 | Phase 14/18 | Complete (automated verification) |
| FRONT-23, FRONT-24 | Phase 14/18 | Pending (manual testing recommended) |

**Coverage:**
- v1.1 requirements: 24 total
- Complete: 22 (FRONT-01 through FRONT-22)
- Pending: 2 (FRONT-23, FRONT-24 - manual browser testing and viewport testing)
- Mapped to phases: 24
- Unmapped: 0 ✓

**Note:** FRONT-23 and FRONT-24 (manual browser testing and responsive design testing) have test plans created but manual execution not performed. Code verification completed for responsive design implementation.

---

*Requirements defined: 2026-02-06*
*Last updated: 2026-02-08 after Phase 18 completion*
