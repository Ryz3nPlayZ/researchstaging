# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-06)

**Core value:** Stateful research intelligence — Single workspace where AI agent remembers everything important (all chats, analyses, documents, file contents) and uses that context to provide genuinely helpful research assistance.

**Current focus:** Phase 11 — View Integration

## Current Position

**Milestone:** v1.1 Frontend Integration & Polish - STARTED 2026-02-06

Phase: 11 of 14 (View Integration)
Plan: 2 of 3 (View Integration)
Status: In progress

Last activity: 2026-02-07 — Plan 11-02 complete: Literature search UI connected to backend with real-time search, PDF access, and source badges. Paper interface added to API client. Loading/error/empty states implemented. 3/3 tasks executed successfully.

Progress: ████████░░ 83% (v1.0 complete: 9 phases, 31 plans. v1.1: 5/17 plans started)

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

Last session: 2026-02-07T00:50:28Z
Stopped at: Completed Phase 11, Plan 02 - Literature search UI with backend integration
Resume file: None (plan complete, no checkpoint)

---

*Last updated: 2026-02-07 after Plan 11-02 completion (View Integration)*
