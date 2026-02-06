# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-06)

**Core value:** Stateful research intelligence — Single workspace where AI agent remembers everything important (all chats, analyses, documents, file contents) and uses that context to provide genuinely helpful research assistance.

**Current focus:** Phase 11 — View Integration

## Current Position

**Milestone:** v1.1 Frontend Integration & Polish - STARTED 2026-02-06

Phase: 11 of 14 (View Integration)
Plan: Not started
Status: Phase 10 complete

Last activity: 2026-02-06 — Phase 10 complete: Frontend foundation established with verified build system, Tailwind CSS + Material Symbols integration, and development environment proxy to backend API. 3/3 plans executed successfully, 12/12 must-haves verified.

Progress: ████████░░ 82% (v1.0 complete: 9 phases, 31 plans. v1.1: 3/17 plans started)

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

---

*Last updated: 2026-02-06 after Phase 10 completion (Frontend Foundation & Setup)*
