# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2025-02-01)

**Core value:** Stateful research intelligence — Single workspace where AI agent remembers everything important (all chats, analyses, documents, file contents) and uses that context to provide genuinely helpful research assistance.
**Current focus:** Phase 2 — File & Project Management

## Current Position

Phase: 2 of 8 (File & Project Management)
Plan: 4 of 4 complete (02-04)
Status: Phase 2 complete. Cloud storage integration with S3/R2 support and migration utility.
Last activity: 2026-02-04 — Completed plan 02-04 (Cloud Storage Integration)

Progress: ███░░░░░░░ 38% (3/8 phases complete, 4/4 plans in Phase 2)

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: 7 min
- Total execution time: 0.7 hours

**By Phase:**

| Phase | Plans Complete | Total Plans | Avg/Plan |
|-------|----------------|-------------|----------|
| 01-authentication | 2 | 2 | 10 min |
| 02-file-management | 4 | 4 | 5 min |
| 03-08 | — | — | — |

**Recent Trend:**
- Last 5 plans: 4 min, 2 min, 5 min, 5 min, 6 min (01-02, 02-01, 02-02, 02-03, 02-04)
- Trend: Steady (consistent execution speed)

*Updated after each plan completion*

## Accumulated Context

### Decisions

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

### Pending Todos

None yet.

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

## Session Continuity

Last session: 2026-02-04
Stopped at: Completed plan 02-04 (Cloud Storage Integration)
Resume file: .planning/phases/02-file-management/02-04-SUMMARY.md
Next: Execute Phase 3 (Search & Retrieval)
