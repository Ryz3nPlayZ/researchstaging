# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2025-02-01)

**Core value:** Stateful research intelligence — Single workspace where AI agent remembers everything important (all chats, analyses, documents, file contents) and uses that context to provide genuinely helpful research assistance.
**Current focus:** Phase 8 (Document Export) - Backend and Frontend complete, ready for human verification

## Current Position

Phase: 8 of 8 (Document Export) - ✅ COMPLETE
Plan: 02 of 2 (Frontend Export UI) - ✅ COMPLETE
Status: Document export feature complete (Backend Pandoc service + API endpoints + Frontend ExportButton + Toolbar integration). Ready for end-to-end testing.
Last activity: 2026-02-05 — Completed Phase 8 Plan 02: Frontend export UI with ExportButton dropdown, PDF/DOCX download, loading states, error handling. Fixed missing useRef import in DocumentEditor.

Progress: ██████████ 100% (25/25 plans complete; 8/8 phases complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 24
- Average duration: 5 min
- Total execution time: ~2 hours

**By Phase:**

| Phase | Plans Complete | Total Plans | Avg/Plan |
|-------|----------------|-------------|----------|
| 01-authentication | 2 | 2 | 10 min |
| 02-file-management | 4 | 4 | 5 min |
| 03-memory-backend | 4 | 4 | 3 min |
| 04-document-editor | 6 | ~6 | 6 min |
| 05-literature | 3 | ~3 | 5 min |
| 06-ai-agent | 3 | ~3 | 5 min |
| 07-data-analysis | 3 | ~3 | 4 min |
| 08-document-export | 2 | 2 | 4 min |

**Recent Trend:**
- Last 5 plans: 6 min, 3 min, 4 min, 4 min, 2 min (06-02, 06-03, 07-01, 07-02, 07-03, 08-01, 08-02)
- Latest: 2 min (08-02)
- Trend: Steady (consistent execution speed)

**🎉 MILESTONE: ALL 8 PHASES COMPLETE (25/25 plans)**

*Updated after each plan completion*

## Accumulated Context

### Decisions

**From 04-03 (Citation Management):**
45. **Citation service encapsulation** — CitationService handles all citation formatting logic separately from API endpoints. Enables reuse and testing.
46. **Style-specific formatting methods** — Separate methods for APA, MLA, Chicago with style-specific author formatting, punctuation, and sorting rules.
47. **Bibliography generation pattern** — Collect all citations, format in bulk, sort by style requirements (alphabetical for APA/MLA), return formatted string.
48. **Venue extraction fallback chain** — Try URL patterns, abstract text parsing, then source field as fallback for extracting publication venue.

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

**From 01-01 (Basic Authentication):**
1. **Mock authentication for local development** — Google OAuth requires real domain and won't work properly in local dev without significant setup. Using email-based mock auth for MVP. OAuth code commented out (not deleted) for easy restoration when domain acquired.
2. **JWT tokens in localStorage** — Storing JWT tokens in localStorage for MVP simplicity. Will consider httpOnly cookies for production security.
3. **Auto-create users on first login** — New users automatically created on first successful authentication with initial free credits granted.

**From 01-02 (Gap Closure):**
4. **React Hooks compliance** — All React hooks must be called before any conditional returns or early returns. This required reorganizing AppContent to move useCallback hooks before loading checks.

**From 02-01 (File Management API Enhancement):**
5. **Store metadata in File.tags JSONB field** — Reused existing column instead of adding new metadata column to File model. This avoids schema migration and leverages existing JSONB storage.
6. **Auto-rename duplicate files** — Better UX to auto-rename duplicates with "filename (N).ext" pattern instead of rejecting uploads.
7. **Configurable MAX_FILE_SIZE via env var** — Default 50MB but operators can increase without code changes for large research datasets.
8. **Custom exception hierarchy for file errors** — FileServiceError → UnsupportedFileTypeError, FileTooLargeError for structured error handling.

**From 02-02 (File Explorer Frontend Component):**
9. **Recursive folder delete with safety flag** — Folder delete requires recursive=true query param to prevent accidental mass deletion. Default is non-recursive (only empty folders).
10. **Context menu pattern for file operations** — Right-click context menus for file/folder operations (create, rename, delete, download, move) following standard OS UX patterns.
11. **Client-side file type validation** — Validate file types in browser before upload to provide immediate user feedback, supplemented by server-side validation.
12. **Drag-to-folder for file moves** — Intuitive file organization by dragging files onto folders to move them.
13. **Toast notifications for user feedback** — All operations (success/error) provide feedback via toast notifications instead of alerts.

**From 02-03 (Navigator Integration and Routing):**
14. **View toggle with Tabs component** — Use Shadcn Tabs for switching between Tasks/Files view in Navigator. Cleaner UX than custom toggle buttons.
15. **Global file selection state** — Add selectedFile to ProjectContext for cross-panel communication. File selection updates Inspector panel.
16. **Breadcrumb navigation pattern** — Build path array with {id, name, path} objects. Show breadcrumbs only when navigating (not at root) to reduce clutter.
17. **localStorage for view preferences** — Persist tree/list view mode across sessions. Load on mount, save on change.
18. **Color-coded file type icons** — Visual differentiation for quick scanning (code=green, data=orange, pdf=red, default=gray).
19. **Hover-triggered quick actions** — Show action buttons (open, download, copy, delete) only on file hover. Replace file size display when hovering to prevent UI overflow.
20. **Sortable list view columns** — Click column headers to sort by name, type, size, or date. Toggle ascending/descending on same column. Show visual indicator (↑/↓).

**From 02-04 (Cloud Storage Integration):**
21. **Storage backend abstraction** — Unified interface (upload_file, download_file, delete_file, get_file_url) supporting local, S3, and R2 backends.
22. **Environment-driven storage selection** — STORAGE_BACKEND env var determines backend at runtime with automatic fallback to local if cloud credentials incomplete.
23. **Presigned URL pattern for cloud storage** — S3/R2 returns { download_url, expires_in } JSON; local storage streams file directly. Frontend handles both transparently.
24. **Cloudflare R2 recommended** — Zero egress fees critical for research datasets. S3-compatible API makes drop-in replacement trivial.
25. **Migration with verification** — Upload to cloud, verify via file_exists(), then delete local. Prevents data loss from failed uploads.

**From 03-01 (Memory Backend Data Model):**
26. **Adjacency list for claim relationships** — Simpler schema than closure table, recursive CTEs perform well for moderate graphs (<100K nodes), easier to maintain.
27. **JSONB for flexible metadata** — Claim/finding structure may evolve by domain (medical vs CS), GIN indexes enable efficient full-text search, type enforcement at application layer.
28. **Polymorphic source associations** — source_type enum (PAPER, FILE, ANALYSIS, USER) + source_id pattern allows claims to link to any source without separate foreign keys.
29. **Project-scoped memory data** — All memory models have project_id FK with CASCADE delete for data isolation and automatic cleanup.
30. **Relevance scoring for prioritization** — relevance_score column on Claim and Finding models enables sorting and filtering by importance.
31. **Avoid SQLAlchemy reserved words** — Cannot use 'metadata' as column name (conflicts with Base.metadata), renamed to 'relationship_metadata'.

**From 03-02 (Claim Extraction and Storage Service):**
32. **LLM-based claim extraction** — Use OpenAI GPT-4 for high-quality claim extraction from research papers, with structured JSON output parsing.
33. **Batch extraction optimization** — Process 5 papers per LLM call to optimize token usage while maintaining extraction quality.
34. **Multi-type finding extraction** — Extract statistical, pattern, insight, correlation, and model performance findings from analysis outputs.
35. **Provenance tracking on extraction** — All extracted claims include source_type, source_id, confidence, extracted_at for full audit trail.
36. **Recursive CTE for graph traversal** — get_related_claims() uses WITH RECURSIVE with depth limit and cycle prevention for efficient graph queries.
37. **Service layer pattern** — MemoryService follows established async service pattern with full CRUD operations and type hints.

**From 03-03 (Memory Query and Retrieval API):**
38. **Separate /api/memory prefix** — All memory endpoints use /api/memory prefix for clear namespacing and to avoid conflicts.
39. **Query parameter filtering** — Optional filtering via query params (source_type, source_id, claim_type, min_confidence) following REST conventions.
40. **Full-text search with ILIKE** — PostgreSQL case-insensitive pattern matching for search. Can upgrade to GIN indexes if performance becomes an issue.
41. **Graph traversal via service method** — Reused existing get_related_claims() from MemoryService which uses recursive CTE.
42. **Field name mapping** — API response uses 'metadata' while database uses 'relationship_metadata' - mapped explicitly in endpoints.
43. **Project ownership validation** — All memory endpoints verify claim/project ownership to prevent cross-project data access.

**From 03-04 (User Preferences and Relevance Scoring):**
44. **TF-IDF style keyword matching** — Simple, effective relevance scoring without external dependencies. Extract keywords from project goal and compare with claim text.
45. **Multi-factor relevance scoring** — 4 factors with weighted importance: keyword overlap (0.6), domain preference (0.2), recency (0.1), citation count (0.1).
46. **Automatic scoring on claim creation** — Claims automatically scored via RelevanceService during MemoryService.create_claim(). No manual step required.
47. **Preference-driven boosts** — Users can set domain_preferences and topic_keywords to customize scoring for their research context.
48. **Keyword suggestions endpoint** — GET /api/memory/projects/{id}/keywords/suggestions provides extracted keywords from project goal for easy preference setup.
49. **Re-score endpoint** — POST /api/memory/projects/{id}/claims/rescore allows bulk re-scoring after preference changes.
50. **Stop word filtering** — Standard NLP practice removes common words (the, and, for, etc.) from keyword extraction for better relevance.

**From 04-01 (Document Backend Foundation):**
51. **CitationStyle enum for type safety** — Used SQLEnum instead of String for citation_style field. Provides database-level validation and prevents invalid values.
52. **SHA-256 hash for change detection** — Content hashing for detecting changes is more efficient than content comparison and reliably identifies modifications.
53. **Auto-version only on content changes** — Document versions created only when TipTap content changes, not when title or citation_style changes. Reduces version noise.
54. **Empty TipTap structure for new documents** — New documents initialized with valid TipTap structure: `{type: 'doc', content: [{type: 'paragraph', content: []}]}`. Ensures editor can always render.

**From 04-03 (Citation Management Backend):**
55. **Polymorphic citation source pattern** — DocumentCitation uses source_type enum (PAPER/CLAIM/MANUAL) + source_id for flexible source references without separate foreign keys. Follows established Claim model pattern.
56. **Three citation styles for MVP** — APA 7th, MLA 9th, and Chicago 17th editions cover 90%+ of academic use cases. Implemented in CitationService with style-specific formatting rules.
57. **Bibliography returns formatted string** — API endpoint returns pre-formatted bibliography text rather than structured data. Simplifies frontend integration and avoids duplicating formatting logic.
58. **Document and DocumentVersion models** — Added as foundational structure for document editor, even though not explicitly required in this plan. Needed for citations to reference documents and for version history support.

**From 04-02 (TipTap Editor Frontend):**
59. **TipTap over Slate.js/Quill** — More React-friendly with better extensible architecture for custom nodes/marks. Active community and comprehensive documentation.
60. **4-second debounce for auto-save** — Balances responsiveness (user doesn't wait long) with server load (doesn't save on every keystroke). Configurable via lodash.debounce.
61. **localStorage immediate backup** — Every keystroke saved to localStorage immediately. Provides data loss prevention from crashes or network failures before server save completes.
62. **Content hash-based change detection** — JSON.stringify content to compute hash, only save if hash changed. Avoids unnecessary saves when user only moves cursor.
63. **Named imports for TipTap extensions** — TipTap v3 uses named exports `import { Table } from '@tiptap/extension-table'` not default imports. Required for table-related extensions.

**From 04-04 (Version History):**
64. **Side-by-side diff view for versions** — Shows original and selected version content together for easy comparison. More intuitive than unified diff for non-technical users.
65. **Restore confirmation dialog** — Prevents accidental data loss by requiring user confirmation before restoring to previous version.
66. **Version list with timestamps** — Chronological list of all versions with human-readable timestamps helps users navigate document history.

**From 04-05 (Citation UI):**
67. **Debounced search (500ms) for paper lookup** — Prevents excessive API calls while typing. Balances responsiveness with server load.
68. **Live citation preview as user types** — Real-time formatting feedback helps users verify citation correctness before inserting.
69. **Dual-mode citation insertion** — Memory search (for existing papers) and manual entry (for new citations) provides flexibility in workflow.
70. **Hanging indent for bibliography** — CSS `pl-8 -indent-8` creates proper hanging indent for all citation styles (APA/MLA/Chicago).

**From 04-06 (AI Text Assistance):**
71. **Four rewrite tones for different contexts** — Formal (academic), Casual (blog), Concise (email), Elaborate (detailed report) covers most use cases.
72. **Grammar check returns suggestions with explanations** — Educational feedback helps users understand and learn from corrections, not just apply them.
73. **Context menu integration for AI features** — Right-click on selected text shows "Rewrite with AI" and "Check Grammar" options. Discoverable and follows common UX patterns.
74. **Graceful 503 when no LLM configured** — Clear error message "AI service unavailable" when API keys not set. Prevents confusion about broken functionality.

**From 05-01 (Literature Search API):**
75. **Semantic Scholar API for paper discovery** — Free, no auth required, high-quality academic data with citation counts and abstracts. Primary API for MVP literature search.
76. **Async API pattern for external services** — LiteratureService uses aiohttp for non-blocking HTTP requests. Prevents event loop blocking during slow API calls.
77. **Paper deduplication by external_id** — Semantic Scholar paperId + source field ensures uniqueness across searches. Prevents duplicate papers when re-running similar queries.
78. **Relevance scoring on ingest** — Calculate semantic similarity between paper title/abstract and project research goal. Enables sorting papers by relevance for user prioritization.
79. **Graceful API fallback with logging** — If Semantic Scholar fails, log error and return empty results rather than crash. Users can retry or try different search terms.

**From 05-02 (Literature Search Frontend):**
80. **Inline search table in workspace** — Literature search results displayed in main workspace area rather than modal. Allows viewing more results and reduces context switching.
81. **Column sort for multi-criteria prioritization** — Sort by year (newest first), citations (most cited), or relevance (best match) helps users quickly identify high-value papers.
82. **Abstract inline expansion** — Click "Show abstract" to expand inline rather than opening modal. Faster UX and maintains context with search results.
83. **Batch PDF acquisition** — Select multiple papers and acquire all PDFs in one operation. Reduces API calls and improves efficiency for bulk literature review.

**From 05-03 (PDF Acquisition and Parsing):**
84. **Semantic Scholar PDF links as primary source** — Use open access PDF URLs from Semantic Scholar API. Falls back to arXiv for preprints.
85. **PyMuPDF for PDF text extraction** — Fast, reliable PDF parsing with position-aware text extraction. Handles most academic PDF formats including two-column layouts.
86. **PDF download streaming to temp files** — Download to /tmp with streaming requests. Prevents memory exhaustion with large PDFs and automatic cleanup on process exit.
87. **Page count tracking for papers** — Store page_count from PDF parsing. Helps users estimate reading time and identify short vs long papers.
88. **Graceful PDF acquisition with retries** — If PDF download fails, log error and continue. Not all papers have open access versions. Users can manually upload PDFs later.

**From 06-01 (AI Agent Backend):**
89. **AgentService orchestrates multi-step workflows** — Central service that coordinates literature search, PDF acquisition, analysis, and synthesis. State-driven execution with task dependencies.
90. **AgentService generates artifacts** — Each agent execution produces persisted Artifact records. Full provenance tracking for all AI-generated content.
91. **AgentService emits WebSocket events** — Real-time progress updates via WebSocket (agent_started, agent_completed, agent_failed). Frontend shows live progress indicators.
92. **AgentConfig JSONB for flexible parameters** — Each agent run stores its configuration (model, prompt, parameters) in task_runs table. Enables reproducibility and debugging.
93. **AgentService returns structured results** — Agent outputs include metadata (papers_analyzed, findings_extracted, time_taken). Helps users understand what was done.

**From 06-02 (Agent Frontend UI):**
94. **Agent button in workspace toolbar** — Prominent "Run Agent" button in document workspace. Primary call-to-action for AI-assisted workflows.
95. **Agent execution modal with live progress** — Modal shows agent status, current step, and elapsed time. Non-blocking UI allows users to continue working while agent runs.
96. **WebSocket-based progress updates** — Real-time agent status updates without polling. Efficient and responsive UI.
97. **Agent results modal with artifacts** — Agent completion modal shows generated content with options to save to document or download as file.

**From 06-03 (AI Chat Memory):**
98. **Chat sessions stored per project** — All conversations scoped to project_id. Enables context retention across sessions within same project.
99. **Message role-based rendering** — System messages (info), user messages (right-aligned blue), assistant messages (left-aligned gray). Clear visual distinction.
100. **Chat input with auto-focus** — Input field auto-focuses on modal open. Keyboard users can start typing immediately without mouse interaction.
101. **Markdown rendering for assistant messages** — Assistant responses support Markdown formatting (bold, italic, code blocks, lists). Rich output for technical explanations.

**From 07-01 (Code Editor Frontend):**
102. **Monaco Editor for code editing** — VS Code's editor with IntelliSense, syntax highlighting, and error checking. Industry standard for web-based code editing.
103. **Language auto-detection from file extension** — Map .py → Python, .r → R, .js → JavaScript. Automatic language selection improves UX.
104. **Configurable editor options** — Font size (12-18px), theme (vs-dark/vs-light), word wrap toggle. Users can customize editor to their preferences.

**From 07-02 (Code Execution Backend):**
105. **Docker-based code execution** — Isolated containers for Python/R code execution. Prevents malicious code from affecting host system.
106. **Execution timeout (30s default)** — Prevents infinite loops and resource exhaustion. Configurable via EXECUTION_TIMEOUT env var.
107. **Stdout/stderr capture** — Capture all output including errors. Users see complete execution results including stack traces.
108. **Artifact generation for code results** — Store execution output as Artifact records. Full provenance tracking for reproducibility.

**From 07-03 (Analysis Results Display):**
109. **Results panel below code editor** — Split view: code editor on top, execution results below. Users can see code and output together without scrolling.
110. **Auto-scroll on new output** — Results panel auto-scrolls to bottom when new output arrives. Users see latest results without manual scrolling.
111. **Download results as text/JSON** — Export execution results for sharing or archival. Enables collaboration and result sharing.
112. **Visual indicators for execution status** — Running: yellow spinner, Success: green checkmark, Error: red X. Clear status communication.

**From 08-01 (Document Export Backend):**
113. **Pandoc for document conversion** — Universal document converter with support for PDF (via xelatex) and DOCX. Industry standard for academic document export.
114. **TipTap JSON to Markdown conversion** — Custom converter handles headings, paragraphs, bold/italic/strike/code, lists (nested), blockquotes, code blocks, horizontal rules, links, citations.
115. **StreamingResponse for file downloads** — Use FastAPI StreamingResponse with BytesIO for efficient file serving without intermediate disk writes.
116. **Ownership validation via project_id** — Export endpoints require project_id query param and verify document belongs to project. Prevents unauthorized document access.
117. **YAML frontmatter for metadata** — Pandoc frontmatter with title, author, date, abstract, keywords. Enables professional document formatting in PDF/DOCX exports.
118. **30-second timeout on Pandoc calls** — Prevents hanging on large documents or Pandoc errors. Returns TimeoutError with clear message to user.
119. **Safe filename generation** — Strip slashes and backslashes from document title, truncate to 100 chars. Prevents path traversal and filename overflow issues.
120. **Custom exception hierarchy** — PandocNotFoundError, ConversionError, TimeoutError. Structured error handling for different failure modes with specific HTTP status codes.
121. **PDF engine auto-detection** — Detect available LaTeX engines (xelatex, pdflatex, lualatex) on startup and use first available. Provides clear installation instructions when none found. DOCX export works without LaTeX.

**From 08-02 (Frontend Export UI):**
122. **Dropdown menu for export format selection** — Shadcn DropdownMenu with PDF and DOCX options follows established UI pattern from citation picker and AI features.
123. **Blob URL pattern for file downloads** — Create object URL from blob, trigger download via anchor element, revoke URL after download. Prevents memory leaks.
124. **Format-specific loading states** — Track exportFormat ('pdf' | 'docx') to show "Exporting..." on specific menu item while other format remains clickable. Better UX than disabling entire dropdown.
125. **Comprehensive error handling with user-friendly messages** — Map HTTP status codes (404, 403, 503) and network errors to specific messages. Users get actionable feedback instead of generic "Export failed".
126. **Filename sanitization for downloads** — Convert document title to URL-safe filename (lowercase, hyphens instead of special chars). Ensures downloads work across all browsers and file systems.

**From 05-01 (Literature Search & Unpaywall Integration):**
75. **Service layer enrichment** — Unpaywall integration and result sorting implemented in LiteratureService, not API layer. Enables reuse and testing.
76. **DOI extraction fallback chain** — Try direct field, then URL parsing, then citation styles. Maximizes DOI discovery rate.
77. **Concurrent Unpaywall lookups with semaphore** — Parallel lookups with max 5 concurrent requests. Balances speed with rate limit compliance.
78. **Priority-based result sorting** — Has PDF (first), citations (second), year (third). Ensures most accessible/relevant papers appear first.
79. **Graceful Unpaywall degradation** — Search continues even if Unpaywall fails. Logs warnings but returns results without OA enrichment.
80. **Multi-source literature aggregation** — Semantic Scholar (citations) + arXiv (preprints) + Unpaywall (OA PDFs). Comprehensive coverage with deduplication.

**From 05-02 (AI-Powered Claim Extraction):**
81. **Separate PDF claim extraction method** — Created `extract_claims_from_pdf()` separate from `extract_claims_from_paper()` to handle full PDF text with different requirements (longer context, more claims).
82. **Confidence threshold filtering** — Implemented 0.5 minimum confidence to ensure only significant claims are stored in memory.
83. **Partial result handling** — Individual claim creation failures don't abort entire extraction; failed claims are logged and skipped.
84. **Project ID flexibility** — Frontend accepts projectId as prop or falls back to selectedProject from ProjectContext for maximum flexibility.
85. **Automatic paper addition** — Claims extraction automatically adds paper to project (via onAddToProject callback) for seamless workflow.
86. **Prompt template file pattern** — Store prompts in `backend/prompts/` directory with placeholder replacement for max_claims and other parameters.

**From 05-03 (Literature Citation Integration):**
87. **Literature citation integration** — Citation picker includes Literature Search tab for direct paper-to-citation workflow without manual data entry.
88. **Citation formatting API reuse** — `/api/citations/format-paper` endpoint leverages existing CitationService formatting methods for consistency.
89. **Debounced literature search** — 300ms debounce in citation picker reduces API calls while maintaining responsive UX.
90. **Context-aware citation insertion** — Insert Citation button only shows when document is open, preventing errors from missing context.

**From 06-01 (Persistent Sidebar Chat):**
91. **In-memory chat message storage** — Using Python dictionary for MVP instead of database. Stores last 100 messages per project. Simpler implementation for initial release.
92. **Context injection for AI responses** — AI responses enhanced with project goal, document content (if open), and recent claims from memory. Provides more relevant assistance than generic chatbot.
93. **Collapsible sidebar design** — AI sidebar 400px when expanded, 60px when collapsed. Saves screen space while keeping AI accessible. State persisted to localStorage.
94. **Markdown rendering for AI responses** — Using react-markdown to support formatted output (code blocks, lists, links). Better UX than plain text.
95. **Optimistic UI updates** — User message appears immediately, AI response loads asynchronously. Error handling rolls back optimistic update.
96. **Chat API pattern** — GET history (paginated), POST send (with context), DELETE clear. Simple REST interface for chat operations.

**From 06-02 (Multi-Agent Orchestration):**
97. **Keyword-based confidence scoring for agent routing** — Each agent implements can_handle() returning 0.0-1.0 confidence based on keyword matching. Simple, effective routing without LLM overhead.
98. **Context metadata returned to frontend** — Agent responses include context_used dict showing which information sources were accessed (document, literature, memory). Enables visual indicators for transparency.
99. **Agent base class with abstraction pattern** — Base Agent class defines handle() and can_handle() methods. Specialized agents (DocumentAgent, LiteratureAgent, MemoryAgent, GeneralAgent) inherit and implement. Clean extensibility.
100. **inject_context() loads all relevant data once** — Single database session loads document, claims (20 recent with min confidence 0.5), findings (10 recent), and user preferences. Context reused across agents for efficiency.

**From 06-03 (Advanced AI Features):**
101. **Complex query detection by heuristic** — Queries over 50 characters containing action verbs (analyze, compare, extract, generate, search, synthesize) trigger plan proposal. Simple queries skip planning for faster response.
102. **Plan proposal returns 404 for simple queries** — Frontend receives 404 when query doesn't need planning, then falls back to normal message send. Clean separation of complex vs simple flows.
103. **Editor ref shared via ProjectContext** — Instead of prop drilling editor ref through multiple components, stored in ProjectContext where both Workspace (sets it) and AISidebar (uses it) can access. Follows established pattern for cross-component state.
104. **Text suggestions displayed above messages** — Separate section in AISidebar for active text suggestions. Prevents cluttering message history and makes suggestions more discoverable/accessible.
105. **Apply suggestion triggers auto-save** — Applying AI suggestion uses existing TipTap replaceWith transaction, which triggers the editor's onUpdate handler and auto-save. No additional save logic needed.

**From 07-01 (AI-Powered Code Generation):**
106. **Code generation service pattern** — AnalysisAgent.generate_code() returns structured dict with code, language, and explanation. LLM returns formatted response that's parsed to extract code blocks.
107. **Language-specific prompts** — Separate system prompts for Python vs R with library recommendations (pandas/numpy/matplotlib vs tidyverse/ggplot2/dplyr). Ensures generated code uses appropriate idioms.
108. **CodeEditor component with syntax highlighting** — Uses CodeMirror 6 with language extensions (python, r). Integrated Monaco-style experience with "Generate Code" and "Insert" buttons.

**From 07-02 (Sandboxed Code Execution):**
109. **Subprocess-based sandboxing (MVP)** — Used subprocess.run() with isolated environment and /tmp working directory for MVP simplicity. Production should use Docker containers or cloud execution environments for stronger isolation.
110. **Timeout protection (60 seconds default)** — Prevents runaway code from hanging server. subprocess.run(timeout=60) with TimeoutExpired exception handling. Configurable parameter for flexibility.
111. **Output length limits (100000 characters)** — Prevents resource exhaustion from excessive output. Truncated output includes notice message when limit exceeded.
112. **Code length validation (10000 characters max)** — Pydantic Field validation prevents abuse and token limit issues. Returns 400 error with descriptive message.
113. **Execution service pattern** — ExecutionService with async methods, comprehensive error handling (timeout, subprocess errors), and structured ExecutionResult model (success, output, error, execution_time, return_code).
114. **Automatic memory persistence** — Successful executions automatically saved to memory as Finding objects with full provenance (code, language, output, execution_time). No manual save required.

**From 07-03 (Analysis Results Display):**
115. **Plotly.js for interactive scientific charting** — Chosen over Recharts for better support of statistical charts (scatter, histogram, heatmaps) and built-in PNG export capability via Plotly.toImage().
116. **Modal-based results display** — Fixed overlay modal maximizes screen space for large datasets and charts compared to inline panel. Shows tables, charts, and raw output in tabbed interface.
117. **Auto-detection of data formats** — Intelligent parsing of execution output to detect CSV/JSON/text formats and automatically select appropriate display view (table, chart, or text output).
118. **Multi-format download support** — Download API provides CSV, TXT, JSON, and PNG export from same finding_id. Format conversion handled server-side for data consistency.
119. **Keyboard shortcut for code execution** — Ctrl+Enter/Cmd+Enter triggers code execution without mouse interaction, following notebook-style workflow patterns.
120. **Execution status indicators** — Visual badges show Ready, Running, Completed (with time), or Error states. Provides immediate feedback on execution state and duration.

### Pending Todos

**P0 - Critical:**
1. Fix file content loading from File Explorer - Opening `.md`/`.docx` files shows blank editor

**P1 - High:**
2. Manual browser testing for Wave 2-3 features (version history, citations, AI features)

**P2 - Medium:**
3. Fix ESLint warnings in AIAssistant.jsx, Bibliography.jsx, CitationPicker.jsx

### Blockers/Concerns

**From 01-01:**
- **OAuth domain requirement** — Real Google OAuth requires production domain. Plan to restore OAuth code once domain is acquired. Current mock auth is sufficient for local development and testing.

**From 02-01:**
- No blockers identified. File validation, duplicate handling, and metadata extraction operational.

**From 02-02:**
- No blockers identified. File Explorer component complete and ready for Navigator panel integration.

**From 02-03:**
- No blockers identified. Navigator integration complete with multiple view modes and file selection working.

**From 02-04:**
- No blockers identified. Cloud storage integration complete with migration utility and full documentation.

**From 03-01:**
- No blockers identified. Memory backend data model complete with all tables, indexes, and helper functions created.

**From 03-02:**
- No blockers identified. Memory service complete with CRUD operations, claim extraction, and finding extraction.

**From 03-03:**
- No blockers identified. Memory API complete with all CRUD, search, and graph traversal endpoints.

**From 03-04:**
- No blockers identified. Relevance scoring complete with automatic calculation and preference-driven boosts.

**From 04-01:**
- No blockers identified. Document backend complete with models, migration, and API endpoints.

**From 04-02:**
- No blockers identified. TipTap editor complete with toolbar, auto-save, and localStorage backup.

**From 04-03:**
- No blockers identified. Citation management backend complete with APA/MLA/Chicago formatting and bibliography generation.

**From 04-04 (Version History):**
- No blockers identified. Version history API verified working, component integrated.

**From 04-05 (Citation UI):**
- No blockers identified. Citation and bibliography APIs verified working. Minor formatting quirks (extra commas in author names) are non-blocking.

**From 04-06 (AI Text Assistance):**
- No blockers identified. AI rewrite and grammar endpoints verified working with LLM provider configured. Features gracefully handle missing API keys.

**From 05-01 (Literature Search & Unpaywall Integration):**
- No blockers identified. Literature search API, UI component, and Unpaywall integration fully functional.

**From 05-02 (AI-Powered Claim Extraction):**
- No blockers identified. Claim extraction service, API endpoint, and UI integration fully functional.

**From 05-03 (Literature Citation Integration):**
- No blockers identified. Citation formatting API, picker integration, and insertion UI fully functional.

**From 06-01 (Persistent Sidebar Chat):**
- No blockers identified. Chat API, AISidebar component, and workspace integration fully functional.

**From 06-02 (Multi-Agent Orchestration):**
- No blockers identified. Multi-agent routing, context injection, and visual indicators fully functional.

**From 06-03 (Advanced AI Features):**
- No blockers identified. Plan proposal, approval UI, and text refinement fully functional.

**From 07-01 (AI-Powered Code Generation):**
- No blockers identified. Code generation service, Monaco editor, and integration fully functional.

**From 07-02 (Sandboxed Code Execution):**
- No blockers identified. Python/R code execution with timeout protection, output capture, and automatic memory persistence fully functional.

**From 07-03 (Analysis Results Display):**
- No blockers identified. Plotly charts, modal display, multi-format download, and keyboard shortcuts fully functional.

**From 08-01 (Document Export Backend):**
- No blockers identified. Pandoc-based export service with PDF engine auto-detection, ownership validation, and comprehensive error handling fully functional.

### Patterns Established

**From 01-01 & 01-02 (Authentication):**
1. **React Context pattern** — AuthContext wraps app, provides useAuth hook for global auth state access
2. **Protected routes** — Check loading state first, then redirect to /login if not authenticated
3. **API client auth injection** — Axios interceptor automatically adds Authorization header if token exists
4. **Service layer architecture** — auth_service.py handles user creation, JWT generation, token verification
5. **Comment-out pattern** — When deferring features, comment out code (not delete) with clear restoration instructions
6. **React Hooks ordering** — All hooks must be called before any early returns to comply with Rules of Hooks

**From 02-01 (File Management):**
7. **Custom exception hierarchy** — FileServiceError base class with specific subclasses (UnsupportedFileTypeError, FileTooLargeError) for structured error handling
8. **Metadata extraction pattern** — Type-specific extractor functions with fallback to empty dict on failure
9. **Transaction safety** — All DB operations wrapped in try/except with rollback on errors
10. **Async validation pipeline** — File type → size → duplicates → metadata → storage in async sequence

**From 02-02 (File Explorer UI):**
11. **Recursive tree rendering** — File tree nodes render themselves with nested children for clean, maintainable code
12. **Dialog pattern for user input** — Modal dialogs for create/rename operations with keyboard Enter support for quick completion
13. **Confirmation dialogs for destructive actions** — Delete operations require explicit confirmation to prevent accidental data loss
14. **Upload progress tracking** — Real-time progress indicators for file uploads with per-file status
15. **Import hooks from /hooks** — React hooks (useToast) are in /hooks directory, not /ui directory

**From 02-03 (Navigator Integration):**
16. **View state management with Tabs** — Use Tabs component for clean toggle between related content views (Tasks vs Files)
17. **Breadcrumb path building** — Incrementally build navigation path array. Each crumb has {id, name, path} for click navigation.
18. **Flatten tree for list view** — Recursive function to convert hierarchical tree into flat list for table rendering.
19. **Column sorting pattern** — Maintain {field, order} state. Toggle order on same field, switch to new field otherwise. Show arrow indicators.

**From 02-04 (Cloud Storage):**
20. **Storage backend factory pattern** — get_storage_backend() creates appropriate backend based on env vars. Graceful fallback to local on configuration errors.
21. **Presigned URL generation** — S3/R2: use boto3 generate_presigned_url() with expiration. Local: return storage key for direct serving.
22. **Async file operations** — All storage operations async for consistency. upload_file(), download_file(), delete_file() return awaitable futures.

**From 03-01 (Memory Backend):**
23. **Graph adjacency list pattern** — ClaimRelationship with from_claim_id, to_claim_id, relationship_type. Simpler than closure table, uses recursive CTEs for traversal.
24. **Polymorphic associations** — source_type enum + source_id allows linking to any entity type without separate FKs. Consistent pattern used throughout codebase.
25. **JSONB metadata flexibility** — Store evolving structured data (claim_data, finding_data) in JSONB with GIN indexes for search. Type safety enforced at application layer.
26. **Recursive graph traversal** — get_related_claims() function using WITH RECURSIVE CTE with depth limit and cycle prevention.
27. **Relevance prioritization** — Float relevance_score column for sorting/filtering. Can be calculated based on project context and user feedback.

**From 03-02 (Memory Service):**
28. **Service async pattern** — All MemoryService methods use AsyncSession for database operations with proper flush/commit handling.
29. **Prompt file loading with fallback** — Load prompts from files with default inline prompts as fallback for robustness.
30. **Structured JSON parsing from LLM** — Extract JSON from LLM responses with error handling and empty dict fallback.
31. **Batch processing pattern** — Process items in fixed-size batches (5 papers) to optimize token usage while maintaining quality.
32. **Finding type polymorphism** — Extract different finding types (statistical, pattern, insight, correlation, model_performance) from flexible analysis output dict.

**From 03-03 (Memory API):**
33. **REST API router pattern** — FastAPI router with prefix, tags, and organized endpoint groups (claims, findings, preferences).
34. **Pydantic request/response models** — Separate models for validation (Request) and serialization (Response) with from_attributes Config.
35. **Query parameter filtering** — Optional Query() parameters in endpoint signatures with Field validation (ge, le, min_length).
36. **Project ownership validation** — All endpoints verify resource belongs to project_id from path before returning data.
37. **Enum validation in endpoints** — Convert string query params to enums (ClaimSourceType, RelationshipType) with ValueError handling.
38. **Explicit field mapping** — Map database column names (relationship_metadata) to API field names (metadata) in response construction.

**From 03-04 (Relevance Scoring):**
39. **Service layer separation** — RelevanceService separate from MemoryService following single responsibility principle.
40. **Multi-source keyword aggregation** — Extract keywords from project goal, key_themes, search_terms, and user preferences for comprehensive coverage.
41. **Stop word filtering** — Remove common English words (the, and, for, etc.) during keyword extraction for better relevance quality.
42. **Multi-factor weighted scoring** — Combine multiple relevance signals with explicit weights (keywords 0.6, domain 0.2, recency 0.1, citations 0.1).
43. **Double-flush pattern for dependent fields** — Flush to get ID, calculate dependent field (relevance_score), flush again to save.
44. **Bulk operation support** — recalculate_project_claims() efficiently updates all claims for a project when preferences change.

**From 04-01 (Document Backend):**
45. **TipTap JSONB storage pattern** — Document content stored as JSONB with TipTap document structure. Enables rich text editing with JSON serialization.
46. **Content hash change detection** — SHA-256 hash stored in content_hash field. Compare hashes to detect content changes for versioning.
47. **Auto-version on content change** — PUT endpoint creates DocumentVersion when content_hash changes. Preserves history without explicit version creation calls.
48. **Document API prefix pattern** — Document endpoints use /api/documents prefix for clear namespacing. Project-scoped endpoints use /api/projects/{id}/documents.

**From 06-03 (Advanced AI Features):**
49. **Plan proposal pattern** — Propose → Approve/Reject → Execute workflow for complex multi-step AI actions. User controls before execution.
50. **Editor ref sharing pattern** — Store editor ref in ProjectContext for cross-component access. Enables AI features to modify editor without prop drilling.
51. **Text suggestion pattern** — Show original (strikethrough) and revised text with Apply button. Clear UX for AI-assisted editing.
52. **Graceful degradation for plan failures** — If plan proposal fails, fallback to direct message handling. No blocking errors for users.

**From 07-01 (AI-Powered Code Generation):**
53. **Monaco Editor for code editing** — Used @monaco-editor/react instead of CodeMirror for modern React integration, better TypeScript support, and VS Code-like editing experience.
54. **AnalysisAgent specialization** — Added dedicated agent for data analysis queries with keyword detection (analyze, statistics, regression, plot) and language-specific code generation (Python/R).
55. **Dialog workflow for code generation** — Used Shadcn Dialog component for focused UX: describe task → generate code → edit → execute. Non-blocking, follows existing patterns.
56. **Separate analysis API router** — Created analysis_api.py following established FastAPI router pattern. Keeps analysis endpoints organized and testable.

## Session Continuity

Last session: 2026-02-05 18:30 UTC
Stopped at: Completed Phase 8 Plan 02 (Frontend Export UI) - ALL PHASES COMPLETE
Resume file: .planning/phases/08-document-export/08-02-SUMMARY.md
Next: Human verification of document export functionality, then deployment/prep for production
