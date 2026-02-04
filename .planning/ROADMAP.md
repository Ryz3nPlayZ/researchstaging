# Roadmap: Research Workspace

## Overview

The Research Workspace delivers stateful research intelligence — a single workspace where an AI agent remembers everything important and provides genuinely helpful research assistance. The roadmap progresses from foundational authentication through file management, memory infrastructure, document editing, literature capabilities, AI interaction, data analysis, and finally export functionality.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Authentication & User Management** - Secure access via mock authentication (Google OAuth code preserved for production)
- [x] **Phase 2: File & Project Management** - Upload and organize research files
- [ ] **Phase 3: Memory & Information Graph Backend** - Store research information and relationships
- [ ] **Phase 4: Rich Text Document Editor** - Write papers with citations and version history
- [ ] **Phase 5: Literature Search & Review** - AI-powered paper discovery and analysis
- [ ] **Phase 6: AI Agent & Sidebar Chat** - Interactive AI research assistant
- [ ] **Phase 7: Data Analysis** - Execute R/Python analyses in cloud sandbox
- [ ] **Phase 8: Document Export** - Export papers to PDF and DOCX

## Phase Details

### Phase 1: Authentication & User Management

**Goal**: Users can securely access the workspace via Google OAuth

**Depends on**: Nothing (first phase)

**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04

**Success Criteria** (what must be TRUE):
  1. User can sign in with Google OAuth
  2. User account is automatically created on first login
  3. User session persists across browser refresh
  4. User can sign out from any page

**Research**: Likely (Google OAuth integration)
**Research topics**: Google OAuth 2.0 flow, session token strategy, FastAPI OAuth patterns

**Completed**: 2025-02-01

**Plans**:
- [x] 01-01: Mock authentication system with FastAPI routes and React context
- [x] 01-02: Fix AppContent AuthContext integration (gap closure)

### Phase 2: File & Project Management

**Goal**: Users can upload and organize research files in cloud workspace

**Depends on**: Phase 1 (requires authenticated user context)

**Requirements**: FILE-01, FILE-02, FILE-03, FILE-04, FILE-05, FILE-06, FILE-07, FILE-08, FILE-09, FILE-10, FILE-11

**Success Criteria** (what must be TRUE):
  1. User can upload files via drag-and-drop
  2. User can create nested folder structure
  3. Files are stored in cloud-based project workspace
  4. All file types supported (PDF, DOCX, MD, .py, .r, .js, CSV, Excel)

**Research**: Unlikely (leverage existing Research Pilot file upload/storage patterns)

**Completed**: 2025-02-03

**Plans**:
- [x] 02-01: File Management API Enhancement — Validate file types, handle duplicates, extract metadata, improve error handling
- [x] 02-02: File Explorer Frontend Component — Tree view, drag-drop upload, folder operations, file operations, API client
- [x] 02-03: Navigator Integration and Routing — Integrate FileExplorer, add view switching, file selection updates Inspector, breadcrumb navigation
- [x] 02-04: Cloud Storage Integration — S3/R2 storage with local fallback, presigned URLs, migration utility

### Phase 3: Memory & Information Graph Backend

**Goal**: System stores and tracks research information with relationship graph

**Depends on**: Phase 2 (requires file/project context)

**Requirements**: MEM-01, MEM-02, MEM-03, MEM-04, MEM-05, MEM-06

**Success Criteria** (what must be TRUE):
  1. Claims extracted from literature are stored
  2. Findings from data analyses are stored
  3. User preferences are stored
  4. Claim relationships are tracked (association, correlation, causality, prerequisite)
  5. Backend provides graph data model for papers, data sources, and information

**Research**: Likely (graph data model design, PostgreSQL graph patterns)
**Research topics**: PostgreSQL graph extensions, claim relationship schema design, relevance prioritization algorithms

**Plans**: TBD

Plans:
- [ ] 03-01: [Brief description]

### Phase 4: Rich Text Document Editor

**Goal**: Users can write research papers with citations, formatting, and version history

**Depends on**: Phase 3 (requires memory backend for citations)

**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06, EDIT-07, EDIT-08, EDIT-09, EDIT-10, EDIT-11, EDIT-12, EDIT-13, EDIT-14, EDIT-15

**Success Criteria** (what must be TRUE):
  1. User can write and format text with bold, italic, underline
  2. User can create headings, lists, block quotes, tables
  3. User can insert and edit citations in-text
  4. System auto-formats citations in APA, MLA, or Chicago style
  5. System auto-generates bibliography from document citations
  6. User can view and restore previous document versions
  7. System auto-saves document content every 2-5 seconds during typing
  8. Editor typing response time is <100ms for keystrokes

**Research**: Likely (TipTap editor setup, citation management patterns)
**Research topics**: TipTap editor with React, citation management architecture, document versioning strategy

**Plans**: TBD

Plans:
- [ ] 04-01: [Brief description]

### Phase 5: Literature Search & Review

**Goal**: AI can discover, acquire, and analyze research papers

**Depends on**: Phase 3 (requires memory backend to store claims)

**Requirements**: LIT-01, LIT-02, LIT-03, LIT-04, LIT-05, LIT-06, LIT-07

**Success Criteria** (what must be TRUE):
  1. AI agent can search for papers via Semantic Scholar API
  2. AI agent uses Unpaywall to find open-access PDFs
  3. System prioritizes papers with full PDF access in search results
  4. AI agent extracts key claims and statements from papers
  5. AI agent saves extracted claims to memory
  6. System auto-formats citations during literature review

**Research**: Likely (Semantic Scholar API, Unpaywall API, PDF parsing)
**Research topics**: Semantic Scholar API endpoints, Unpaywall integration, PDF text extraction patterns, claim extraction algorithms

**Plans**: TBD

Plans:
- [ ] 05-01: [Brief description]

### Phase 6: AI Agent & Sidebar Chat

**Goal**: Users interact with AI for research assistance via persistent sidebar

**Depends on**: Phase 4 (editor context) and Phase 5 (literature context)

**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, AI-07, AI-08, AI-09, AI-10

**Success Criteria** (what must be TRUE):
  1. User sees persistent sidebar panel for AI interaction
  2. User can send chat messages to AI agent
  3. AI agent has read access to current document content
  4. AI agent has read access to analysis results
  5. AI agent has read access to stored claims and findings
  6. AI agent has read access to user preferences
  7. AI agent can refine text directly (simple changes)
  8. AI agent presents plan for complex actions before execution
  9. User can approve or reject AI-proposed plans
  10. AI agent executes plan only after user approval

**Research**: Likely (multi-agent orchestration, proposal-based interaction)
**Research topics**: Multi-agent orchestration patterns, proposal-based UX, router/planner/evaluator agent architecture

**Plans**: TBD

Plans:
- [ ] 06-01: [Brief description]

### Phase 7: Data Analysis

**Goal**: Users can analyze datasets through AI-generated code execution

**Depends on**: Phase 3 (memory backend to store results) and Phase 6 (AI agent)

**Requirements**: ANA-01, ANA-02, ANA-03, ANA-04, ANA-05, ANA-06, ANA-07, ANA-08, ANA-09

**Success Criteria** (what must be TRUE):
  1. AI agent can generate R code for data analysis
  2. AI agent can generate Python code for data analysis
  3. System executes code in sandboxed cloud environment
  4. System displays analysis results as tables
  5. System displays analysis results as charts
  6. System displays analysis results as visualizations
  7. User can download analysis results
  8. User can view and edit AI-generated code before execution
  9. System saves analysis results to memory for future access

**Research**: Likely (cloud sandbox execution, code generation safety)
**Research topics**: Docker container per-project isolation, R/Python execution patterns, code generation safety, visualization libraries

**Plans**: TBD

Plans:
- [ ] 07-01: [Brief description]

### Phase 8: Document Export

**Goal**: Users can export finished papers in standard formats

**Depends on**: Phase 4 (document editor)

**Requirements**: EXP-01, EXP-02

**Success Criteria** (what must be TRUE):
  1. User can export document as PDF
  2. User can export document as DOCX

**Research**: Likely (Pandoc integration or TipTap export)
**Research topics**: TipTap export to PDF/DOCX, Pandoc integration, format fidelity

**Plans**: TBD

Plans:
- [ ] 08-01: [Brief description]

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Authentication & User Management | 2/2 | ✓ Complete | 2025-02-01 |
| 2. File & Project Management | 0/0 | Not started | - |
| 3. Memory & Information Graph Backend | 0/0 | Not started | - |
| 4. Rich Text Document Editor | 0/0 | Not started | - |
| 5. Literature Search & Review | 0/0 | Not started | - |
| 6. AI Agent & Sidebar Chat | 0/0 | Not started | - |
| 7. Data Analysis | 0/0 | Not started | - |
| 8. Document Export | 0/0 | Not started | - |
