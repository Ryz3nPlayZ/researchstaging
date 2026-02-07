# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-06)

**Core value:** Stateful research intelligence — Single workspace where AI agent remembers everything important (all chats, analyses, documents, file contents) and uses that context to provide genuinely helpful research assistance.

**Current focus:** Phase 13 — Real-Time Features & UI Polish

## Current Position

**Milestone:** v1.1 Frontend Integration & Polish - IN PROGRESS

Phase: 13 of 14 (Real-Time Features)
Plan: 2 of 2 (Real-Time Features)
Status: In progress

Last activity: 2026-02-07 — Completed Phase 13-02: Auto-Save Enhancements with type-safe DocumentUpdateRequest, improved error handling, and WebSocket connection status indicator.

Progress: ████████░░ 83% (v1.0 complete: 9 phases, 31 plans. v1.1: 16/17 plans complete)

## Accumulated Context

### v1.0 Decisions (Summary)

**From Phase 1 (Authentication):**
1. Mock authentication for local development - Google OAuth preserved for production
2. JWT tokens in localStorage for MVP simplicity
3. Auto-create users on first login with initial free credits
4. React Hooks compliance - all hooks before conditional returns

**From Phase 2 (File Management):**
5. Store metadata in File.tags JSONB field (reuse existing column)
6. Auto-rename duplicate files with "filename (N).ext" pattern
7. Configurable MAX_FILE_SIZE via env var (default 50MB)
8. Custom exception hierarchy for file errors
9. Recursive folder delete with safety flag (recursive=true required)
10. Context menu pattern for file operations
11. Client-side file type validation before upload
12. Drag-to-folder for file moves
13. Toast notifications for user feedback

**From Phase 3 (Memory Backend):**
14. Adjacency list pattern for graph relationships
15. TF-IDF keyword matching with 4-factor relevance scoring
16. Provenance tracking for all claims (source, confidence, extracted_at)

**From Phase 4 (Document Editor):**
17. TipTap JSONB storage for flexible document structure
18. SHA-256 hashing for version content deduplication
19. 4-second auto-save debounce with localStorage backup
20. Service layer pattern: CitationService, DocumentService separated

**From Phase 5 (Literature):**
21. Concurrent Unpaywall lookups with semaphore (max 5)
22. Priority sorting: PDF access first, then citations, then year
23. LLM claim extraction with 0.5 confidence threshold

**From Phase 6 (AI Agent):**
24. In-memory chat storage for MVP (100 message limit)
25. Multi-agent orchestration with keyword-based confidence scoring
26. Plan proposal workflow for complex actions

**From Phase 7 (Data Analysis):**
27. Subprocess-based code execution with timeout protection
28. Monaco Editor for code editing with syntax highlighting
29. Plotly.js for interactive scientific charting

**From Phase 8 (Document Export):**
30. Pandoc for PDF/DOCX export with TipTap → Markdown conversion
31. PDF engine auto-detection (xelatex, pdflatex, lualatex)

**From Phase 9 (File Content Loading):**
32. Markdown to TipTap parser with regex-based parsing
33. DOCX to TipTap parser using python-docx library
34. File-document association via tags.metadata

**Full decision log:** See PROJECT.md Key Decisions table

### v1.1 Decisions

**From Phase 10 (Frontend Foundation):**
35. Frontend3 build system verified: Vite 6.4.1 + React 19 + TypeScript 5.8 confirmed working
36. No modifications to existing frontend3 config files from researchai-workspace.zip
37. Development server on port 3000, production build verified (145 packages, 0 vulnerabilities)
38. Tailwind CSS CDN configuration verified with custom theme (primary #4a8fe3, darkMode 'class')
39. Material Symbols icons integrated (46 instances across 6 component files)
40. Vite proxy configured to forward /api requests to backend (port 8000)
41. TypeScript API client utility created (frontend3/lib/api.ts with typed endpoints)
42. Environment template created (.env.template with VITE_API_URL documentation)
43. Backend CORS includes localhost:3000 in allowed origins

**From Phase 11 (View Integration):**
44. API client extended with typed Project and File interfaces
45. React useState/useEffect pattern for API data fetching established
46. ApiResponse<T> wrapper for error handling implemented
47. Relative time formatting for dates implemented
48. Loading spinners and error banners pattern standardized
49. DashboardView displays live projects from /api/projects endpoint
50. FilesView displays live files from /api/files endpoint
51. Literature search API client with Paper interface (semantic_scholar/arxiv sources)
52. Search input with Enter key support and loading button in LibraryView
53. Source badges with color coding (arXiv=orange, Semantic Scholar=blue)
54. Loading skeleton with pulse animation for search results
55. Error banner pattern with red styling for user-friendly error messages
56. Empty state pattern with centered messaging when no results found
57. PDF access buttons when pdf_url or open_access_pdf_url available from backend
58. TipTap v3.19.0 rich text editor integrated in EditorView
59. useEditor hook pattern for TipTap initialization with extensions array
60. editor.chain().focus().toggleCommand().run() pattern for formatting commands
61. editor.isActive('format') for button active state highlighting
62. Tailwind prose classes for editor typography (prose-sm, prose-base, prose-lg, prose-xl)
63. Placeholder extension for empty editor state messaging
64. Toolbar buttons wired to TipTap: bold, italic, underline, link, quote, bullet list
65. Chat API client with TypeScript types (ChatMessage, ChatRequest, ChatResponse)
66. Agent selection button group UI with 4 agent types (Document, Literature, Memory, General)
67. Backend /api/chat endpoint (no project_id required for MVP)
68. Multi-agent routing via backend with agent_type parameter
69. Document context passing from TipTap editor to backend (HTML content)
70. geminiService.ts deprecated in favor of backend chat API

**From Phase 12 (Backend Feature Integration):**
71. Mock authentication for local development (test user auto-login)
72. Session persistence via localStorage for MVP simplicity
73. useSession React hook provides session, loading, login, logout
74. Auto-login on app mount with loading spinner display
75. File upload API client with FormData handling (no Content-Type header)
76. Drag-drop file upload UI in FilesView with visual feedback
77. Upload progress display with disabled states during upload
78. Textarea fallback for Monaco Editor to avoid npm install complexity for MVP
79. Export API uses GET requests with query params (backend design decision, not POST as planned)
80. Analysis execution API client integrated with backend `/api/analysis/projects/{projectId}/execute`
81. Export API client with blob download handling for PDF and DOCX
82. Code execution pattern: API call → loading state → results display with error handling
83. Blob download pattern: fetch → blob → URL.createObjectURL → anchor click → revokeObjectURL
84. Document CRUD API client with TypeScript types (Document, Citation, BibliographyEntry)
85. TipTap editor backend integration with 4-second auto-save debounce
86. Document state management (documentId, title, savingStatus: saved/saving/unsaved)
87. Project auto-loading (first project) for seamless document creation
88. Citation search modal with literature database integration (simplified button-based approach)
89. Bibliography component with format selection (APA, MLA, Chicago)
90. Bibliography positioned below editor content for visibility during writing
91. Modal pattern for search with Enter key support and loading states

**From Phase 12-04 (Memory API Client):**
92. Memory/graph API client with TypeScript types (Claim, Finding, Relationship, MemorySearchResult)
93. MemoryView search interface with three-tab navigation (Claims/Findings/Relationships)
94. Color-coded relationship type badges (supports=green, contradicts=red, extends=blue)
95. Provenance display pattern: confidence percentages, source IDs, extraction dates
96. Tab-based results navigation pattern for organized multi-type results
97. Graph visualization deferred to v2.0 (D3.js/Cytoscape.js out of MVP scope)

**From Phase 13-01 (WebSocket Infrastructure):**
98. WebSocket manager singleton with auto-reconnect (3-second delay)
99. Connection status tracking: connecting, connected, disconnected, error
100. Ping/pong heartbeat every 30 seconds to keep connection alive
101. Event-based pub/sub pattern for real-time updates
102. useWebSocket React hook for status tracking and event subscriptions

**From Phase 13-02 (Auto-Save Enhancements):**
103. Type-safe DocumentUpdateRequest interface with optional fields for partial updates
104. Enhanced auto-save with user-facing error alerts via browser alert()
105. WebSocket connection status indicator in editor toolbar (Live/Connecting/Offline)
106. Color-coded status: green (connected), amber (connecting), red (offline)
107. Fixed context.ts → context.tsx for JSX support (build bug)
108. Fixed exportApi calls to use currentProjectId instead of undefined projectId

### Technical Debt (From v1.0)

**P1 - High Priority:**
- Manual browser testing (deferred per user request)

**P2 - Medium Priority:**
- ESLint warnings in 4 frontend files
- Minor citation formatting quirks
- Duplicate markdown_to_tiptap function (shadowed)

**P3 - Low Priority:**
- In-memory chat storage (migration path documented)
- Citation placeholders ([@id] format in exports)

### Blockers Resolved

- ✅ P0 bug: File content loading broken (API path mismatch fixed)
- ✅ All cross-phase integration issues resolved
- ✅ All E2E flows working (4/6 verified, 2 need manual test)

## Session Continuity

Last session: 2026-02-07T12:58:36Z
Stopped at: Completed Phase 13-02 - Auto-Save Enhancements
Resume file: None (plan complete, ready for Phase 14)

---

*Last updated: 2026-02-07 after Phase 13-02 completion (Auto-Save Enhancements)*
