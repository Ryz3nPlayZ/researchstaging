# Research Workspace - All-in-One Research Tool

**Last updated:** 2026-02-05 after v1.0 milestone completion

## What This Is

A web-based research workspace that consolidates literature review, data analysis, and academic writing into one coherent, state-persistent environment. Users can import existing research projects (PDFs, code, datasets, documents), organize files in a hybrid folder/graph structure, write papers with a rich text editor comparable to Google Docs, and collaborate with an AI agent that has total recall of all project artifacts. The AI agent can propose and execute analyses (writing Python/R code, running it in a cloud sandbox, displaying results), assist with research writing, and manage the entire research workflow through a sidebar chat interface with proposal-based interactions.

**Differentiation:** Unlike Google Docs + ChatGPT, Overleaf, or Manubot, this workspace provides artifact-first memory (everything important stored: literature, analyses, findings, documents), information graph tracking claims/data/relationships, and true all-in-one integration (writer + analysis + literature in coherent workspace) with state-persistent AI that remembers context across the entire project.

**Critical Design Principle:** The workspace must function standalone as a Google Docs replacement - AI is powerful augmentation, not a requirement. Users should be able to write, organize files, and manage research without AI.

## Core Value

**Stateful research intelligence:** Single workspace where AI agent remembers everything important (all chats, analyses, documents, file contents) and uses that context to provide genuinely helpful research assistance - writing usable academic content, planning/executing data analyses, and managing the entire research workflow through proposal-based interactions.

## Requirements

### Validated

**Infrastructure Reuse (from existing Research Pilot codebase):**
- ✓ FastAPI backend with PostgreSQL + Redis — v1.0
- ✓ Task orchestration engine with state machine — v1.0
- ✓ WebSocket real-time updates — v1.0
- ✓ LLM service with multi-provider support (OpenAI, Gemini, Mistral, Groq) — v1.0
- ✓ Credit system for API usage tracking — v1.0
- ✓ Project/workspace data model — v1.0
- ✓ React frontend shell with context providers — v1.0

**MVP Core Features (Writer + Chat + Analysis):**
- ✓ **Rich Text Document Editor** — v1.0
  - TipTap-based editor with formatting (bold, italic, underline, headings, lists, tables, blockquotes)
  - Workspace-centric: documents live in project alongside data/files
  - Autoformatting: citations (APA, MLA, Chicago), bibliography auto-generation
  - Auto-save with 4-second debounce + localStorage backup
  - Version history with side-by-side diff view and restore
  - Works standalone (no AI required for basic writing)

- ✓ **Sidebar AI Agent Panel** — v1.0
  - Persistent sidebar (400px expanded, 60px collapsed) for agent interaction
  - Chat-driven interaction: AI proposes actions, user approves
  - Agent has total recall: artifact-first memory (literature, analyses, findings, documents)
  - AI produces formal, structured research content via multi-agent orchestration
  - Multi-agent system: DocumentAgent, LiteratureAgent, MemoryAgent, GeneralAgent
  - Plan proposal workflow for complex actions with user approval

- ✓ **Project Import & File Management** — v1.0
  - Drag-and-drop file upload (8 types: PDF, DOCX, MD, CSV, Excel, Python, R, JavaScript)
  - File type validation, size limits (50MB configurable), duplicate auto-renaming
  - Folder operations (create, rename, delete with recursive flag)
  - File metadata extraction (PDF pages, CSV rows, Excel sheets, code lines)
  - Cloud storage abstraction (local, S3, R2) with presigned URLs
  - FileExplorer component with tree/list views, Navigator integration

- ✓ **Literature Search & Review** — v1.0
  - Semantic Scholar API integration for paper discovery
  - Unpaywall integration for open-access PDF finding with prioritization
  - PDF parsing and LLM-powered claim extraction (5-20 claims per paper with confidence scores)
  - Citation formatting (APA, MLA, Chicago) with literature search integration
  - Claim storage to memory with full provenance (paper ID, authors, year, section, quote)

- ✓ **Data Analysis Execution** — v1.0
  - AI code generation for Python and R
  - Monaco Editor integration with syntax highlighting and keyboard shortcuts
  - Sandboxed code execution via subprocess with 60-second timeout protection
  - Analysis results display (tables, charts via Plotly.js, text output)
  - Multi-format download (CSV, PNG, TXT)
  - Memory integration (findings auto-saved on execution)

- ✓ **Information Graph Backend (Foundation)** — v1.0
  - Claim storage with provenance tracking (source, confidence, extracted_at)
  - Finding storage from data analyses with metadata
  - User preferences storage and retrieval
  - Claim relationship tracking (8 relationship types: association, correlation, causality, prerequisite, contradiction, support, refines, expands_on)
  - Graph traversal via recursive CTEs
  - Relevance scoring with TF-IDF keyword matching (4-factor algorithm)

- ✓ **Document Export** — v1.0
  - Pandoc-based export service with TipTap JSON → Markdown conversion
  - PDF export with LaTeX engine auto-detection (xelatex, pdflatex, lualatex)
  - DOCX export (works without LaTeX)
  - ExportButton component with dropdown menu, blob download handling
  - Ownership validation and error handling

- ✓ **File Content Loading** — v1.0 (gap closure)
  - Markdown to TipTap parser (headings, bold, italic, lists, code blocks, links)
  - DOCX to TipTap parser using python-docx (Word heading detection, formatting preservation)
  - Workspace integration (file opening workflow complete)
  - File-document association via tags metadata

**Post-MVP Features (v2 candidates):**
- [ ] Literature review integration enhancements (AI-assisted search, summarization improvements)
- [ ] Information graph visualization UI (interactive claim/data relationship browser)
- [ ] Peer review emulation agent (evaluates paper against literature)
- [ ] Additional export formats (LaTeX, HTML, Markdown)
- [ ] Database-backed chat storage (currently in-memory for MVP)

### Active

**v1.1 Frontend Integration & Polish:**

<!-- Frontend Architecture & Setup -->
- [ ] **FRONT-01**: Frontend project initialized with new design from researchai-workspace.zip
- [ ] **FRONT-02**: Build system configured (Vite + React 19 + TypeScript)
- [ ] **FRONT-03**: Development environment connected to existing FastAPI backend
- [ ] **FRONT-04**: UI component library integrated (Material Symbols, Tailwind CSS)

<!-- View Integration -->
- [ ] **FRONT-05**: Dashboard view connected to backend projects API
- [ ] **FRONT-06**: Files view connected to file management API (upload, delete, organize)
- [ ] **FRONT-07**: Library view connected to literature search API (Semantic Scholar, Unpaywall)
- [ ] **FRONT-08**: Editor view with TipTap integration (rich text editing, auto-save, version history)
- [ ] **FRONT-09**: AI sidebar chat connected to multi-agent backend (Document, Literature, Memory, General)

<!-- Backend API Integration -->
- [ ] **FRONT-10**: Authentication flow (mock for local dev, Google OAuth for production)
- [ ] **FRONT-11**: File upload with drag-drop, progress tracking, validation
- [ ] **FRONT-12**: Document CRUD operations (create, read, update, delete)
- [ ] **FRONT-13**: Citation formatting (APA, MLA, Chicago) with bibliography generation
- [ ] **FRONT-14**: Data analysis execution (Monaco editor, Python/R sandbox, results display)
- [ ] **FRONT-15**: Document export (PDF/DOCX via Pandoc backend)
- [ ] **FRONT-16**: Information graph queries (claims, findings, relationships)

<!-- Production Polish -->
- [ ] **FRONT-17**: All ESLint warnings resolved
- [ ] **FRONT-18**: Component architecture follows React best practices
- [ ] **FRONT-19**: Manual browser testing complete for all user flows
- [ ] **FRONT-20**: Responsive design works across screen sizes

---

## Current State

**Shipped Version:** v1.0 Complete Research Workspace (2026-02-05)

**Implementation:**
- 9 phases completed with 31 plans
- 281 files created/modified
- 78,892 lines of code (Python backend, React frontend)
- 13 days development timeline (Jan 23 → Feb 5, 2026)

**Tech Stack:**
- Backend: FastAPI, PostgreSQL, Redis, SQLAlchemy, TipTap, Pandoc, python-docx, Plotly
- Frontend: React 19, TipTap Editor, Shadcn UI, Tailwind CSS, Monaco Editor, Plotly.js
- Infrastructure: Docker (PostgreSQL + Redis), cloud storage abstraction (local/S3/R2)

**Quality Status:**
- All 64 v1 requirements satisfied
- All P0 bugs resolved
- 8/8 cross-phase integrations verified working
- Code complete, manual browser testing deferred per user request

**Known Technical Debt (Non-Blocking):**
- P1: Manual browser testing required before production release
- P2: ESLint warnings in 4 frontend files (missing useCallback dependencies)
- P2: Minor citation formatting quirks (extra commas in author names)
- P2: Duplicate markdown_to_tiptap function in file_service.py (shadowed at line 395)
- P3: In-memory chat storage (100 message limit - migration path documented)

**Documentation:**
- Roadmap archive: `.planning/milestones/v1.0-ROADMAP.md`
- Requirements archive: `.planning/milestones/v1.0-REQUIREMENTS.md`
- Milestone audit: `.planning/milestones/v1.0-FINAL-MILESTONE-AUDIT.md`

---

## Current Milestone: v1.1 Frontend Integration & Polish

**Goal:** Integrate the new AI Studio frontend design (from researchai-workspace.zip) with the existing FastAPI backend, maintaining all v1.0 features while improving UI/UX.

**Started:** 2026-02-06

**Target features:**
- **Frontend Replacement:** Integrate new React 19 + TypeScript + Vite frontend design
- **UI/UX Improvements:** Modern, polished interface with Material Symbols icons
- **Backend Integration:** Connect all views (Dashboard, Files, Library, Editor) to existing FastAPI APIs
- **Feature Parity:** Ensure all v1.0 capabilities work with new UI:
  - Authentication (mock for local, Google OAuth for production)
  - Document editor (TipTap-based rich text editing)
  - File management (drag-drop upload, cloud storage)
  - Literature search (Semantic Scholar + Unpaywall)
  - AI sidebar chat (multi-agent orchestration)
  - Data analysis execution (Python/R sandbox)
  - Document export (PDF/DOCX)
  - Information graph backend integration
- **Production Polish:** Fix ESLint warnings, improve code quality, manual testing

**Integration approach:**
- Use new frontend as foundation (better design, cleaner architecture)
- Replace current React Vite frontend completely
- Migrate all backend API integrations to new frontend
- Implement missing features (TipTap editor, file upload handlers)
- Maintain all v1.0 validated requirements

---

## v1.0 Milestone (Completed)

**Shipped:** 2026-02-05

All v1.0 features delivered. See [milestones archive](.planning/milestones/v1.0-FINAL-MILESTONE-AUDIT.md) for details.

---

**Existing Codebase (Research Pilot):**
- Brownfield evolution from existing Research Pilot codebase
- Current system: AI-native research execution engine for literature reviews and research papers
- Strong foundation: state-driven orchestration, multi-LLM support, task workers, WebSocket updates
- Architecture documented in `.planning/codebase/` (7 documents, 1,617 lines)

**Evolution Strategy:**

**KEEP (Solid Foundation):**
- Backend infrastructure (FastAPI, PostgreSQL, Redis, orchestration engine)
- Task orchestration system (perfect for multi-agent workflows)
- WebSocket real-time updates
- LLM service with multi-provider support
- File upload/storage patterns
- Credit system (already tracks API usage)
- Project/workspace data model
- React frontend shell with context providers

**DESTROY & REPLACE (Wrong Product):**
- Literature search/summarization pipeline (not MVP focus)
- Reference extraction/citation graph (not MVP focus)
- "Research goal → plan → execute" flow (wrong UX pattern)
- Navigator/Workspace/Inspector layout (wrong for writing-focused app)
- TUI (terminal interface not needed)

**BUILD FRESH (New Features):**
- Rich text document editor (TipTap-based, Google Docs-style)
- File management system (drag-drop upload, organize files)
- Sidebar AI chat panel (always-visible agent interaction)
- Dataset upload/storage (cloud-based)
- Data analysis execution (Python/R sandboxed execution)
- Visualization rendering (charts, tables from analysis)
- Information graph backend (claim/data tracking - prep for post-MVP)

**Product Vision Evolution:**
- Original Research Pilot: Research execution system (literature → paper)
- New Research Workspace: All-in-one research tool (writer + chat + analysis + literature)
- Key insight: Shift from "pipeline execution" to "workspace collaboration" model

**User Workflow:**
1. User creates/imports research project by uploading files (drag-drop PDFs, code, data, docs)
2. Files organized in project workspace (hybrid folder + graph structure)
3. User opens rich text editor to write paper (works standalone, no AI required)
4. User engages AI agent in sidebar for assistance:
   - "Help me write the methods section" → AI writes formal content
   - "Analyze this dataset for correlations" → AI proposes analysis → user approves → AI writes code → executes → shows results
   - "Find papers on topic X" → AI searches literature → summarizes
5. AI agent remembers everything (artifact-first memory) and provides context-aware assistance
6. Information graph tracks all claims, data, analyses, relationships (backend ready, UI post-MVP)

**Technical Approach:**
- Leverage existing orchestration engine for multi-agent workflows
- Extend task system to support document editing, analysis execution
- Build new frontend: editor-focused layout (main editor + sidebar panel)
- TipTap for rich text editing (React-based, extensible)
- Cloud execution sandbox for Python/R (Docker containers per project)
- Information graph as PostgreSQL extension (nodes: claims, data, analyses; edges: relationships)

## Constraints

- **Type** - **MVP Scope** - Ship Writer + Chat + Analysis only, defer literature/graph UI to post-MVP
- **Type** - **Performance** - Rich text editor must be polished, not janky, low resource usage
- **Type** - **Dependencies** - Maximize reuse of existing Research Pilot codebase (backend infrastructure, orchestration, LLM service)
- **Type** - **AI Quality** - AI writing must be usable research content (formal, structured, empirical) - not generic fluff
- **Type** - **Analysis** - End-to-end data analysis must work (upload → chat → code → results)
- **Type** - **Standalone** - Workspace must function without AI (Google Docs replacement baseline)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| MVP scope: Writer + Chat + Analysis only | Ship quick, validate core value before building literature/graph features | — Pending |
| Workspace-centric document model | Documents live in project alongside data/files, Notion-style over Google Docs-style | — Pending |
| Chat-driven analysis with proposals | AI suggests actions, user approves - more control than autonomous execution | — Pending |
| Artifact-first memory system | AI remembers everything important (literature, analyses, findings, documents) - enables true context awareness | — Pending |
| TipTap for rich text editor | React-based, extensible, proven in research writing tools | — Pending |
| Hybrid file organization (folder + graph) | Conventional folders for familiarity, graph for relationships | — Pending |
| Python/R cloud execution | Sandboxed per-project Docker containers for security and isolation | — Pending |
| Evolution from Research Pilot | Maximize reuse of existing backend infrastructure (orchestration, LLM, WebSocket) | — Pending |
| Information graph backend in MVP | Build data model and tracking now, UI visualization post-MVP | — Pending |
| Must work standalone without AI | Workspace is Google Docs replacement baseline, AI is augmentation not requirement | — Pending |

---

*Last updated: 2026-02-06 after v1.1 milestone initialization*
