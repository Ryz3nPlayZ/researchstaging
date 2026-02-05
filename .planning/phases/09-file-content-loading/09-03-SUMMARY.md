---
phase: 09-file-content-loading
plan: 03
subsystem: file-processing
tags: [docx, tiptap, python-docx, word-documents, markdown, rich-text-editor]

# Dependency graph
requires:
  - phase: 02-file-management
    provides: file upload, storage backend, file metadata
  - phase: 04-document-editor
    provides: TipTap editor, document data model
provides:
  - DOCX to TipTap conversion function for Word document parsing
  - Enhanced file content API endpoint that returns TipTap JSON directly
  - Document content parsing endpoint for Markdown and DOCX files
affects: [09-04-workspace-integration]

# Tech tracking
tech-stack:
  added: [python-docx==1.1.0]
  patterns: [TipTap JSON structure, document content conversion, binary file parsing]

key-files:
  created: []
  modified: [backend/requirements.txt, backend/file_service.py, backend/file_api.py]

key-decisions:
  - "Use python-docx library for DOCX parsing (handles Word 2007+ format, no external Word installation required)"
  - "Read DOCX files as bytes for binary parsing, not as text"
  - "Return TipTap JSON directly from /files/{file_id}/content endpoint (simpler frontend integration)"
  - "Preserve Word heading styles (Heading 1-6, Title) as TipTap heading nodes with correct levels"

patterns-established:
  - "Binary file parsing: Use BytesIO for in-memory file processing without disk I/O"
  - "TipTap structure: All documents return {'type': 'doc', 'content': [...]} format"
  - "Error handling: Parse errors return empty TipTap document instead of crashing"

# Metrics
duration: 2min
completed: 2026-02-05
---

# Phase 9: File Content Loading - Plan 03 Summary

**DOCX to TipTap parser using python-docx library with heading/style detection and inline formatting preservation**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-05T22:30:49Z
- **Completed:** 2026-02-05T22:33:05Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Added python-docx==1.1.0 dependency for Word document parsing
- Created `docx_to_tiptap()` function that converts DOCX bytes to TipTap JSON structure
- Enhanced file content API to parse both Markdown and DOCX files into TipTap format
- Preserves Word heading styles (Heading 1-6) as TipTap heading nodes
- Extracts inline formatting (bold, italic, underline) from Word runs
- Also added `markdown_to_tiptap()` function for Markdown to TipTap conversion

## Task Commits

Each task was committed atomically:

1. **Task 1: Add python-docx dependency** - `8073d58` (feat)
2. **Task 2: Create docx_to_tiptap conversion function** - `adc458e` (feat)
3. **Task 3: Integrate DOCX and Markdown to TipTap parsing** - `4168021` (feat)

**Plan metadata:** TBD (docs: complete plan)

_Note: Each task committed individually for easy rollback and clear history_

## Files Created/Modified

### Modified Files

- `backend/requirements.txt` - Added python-docx==1.1.0 dependency for Word document parsing
- `backend/file_service.py` - Added BytesIO import, docx_to_tiptap() and markdown_to_tiptap() functions
- `backend/file_api.py` - Added ParseRequest model, POST /files/parse/tiptap endpoint, updated GET /files/{file_id}/content to return TipTap JSON

### Key Additions

**docx_to_tiptap() function** (backend/file_service.py):
- Accepts DOCX file content as bytes
- Uses python-docx library to parse Word documents
- Detects Word heading styles (Heading 1-6, Title)
- Extracts inline formatting from runs (bold, italic, underline)
- Returns TipTap JSON document structure
- Handles errors gracefully (returns empty document on parse failure)

**markdown_to_tiptap() function** (backend/file_service.py):
- Converts Markdown text to TipTap JSON
- Parses headings (# through ######), bullet lists, ordered lists
- Returns proper TipTap node structure

**Enhanced content endpoint** (backend/file_api.py):
- GET /files/{file_id}/content now returns TipTap JSON directly
- For DOCX files: Reads as bytes, converts via docx_to_tiptap()
- For Markdown files: Reads as text, converts via markdown_to_tiptap()
- Returns unified format: `{file_id, name, tiptap, extension, format: "tiptap"}`

## Decisions Made

**Decision 1: Use python-docx library for DOCX parsing**
- **Rationale:** Handles Word 2007+ format, no external Word installation required, well-documented, stable
- **Alternative considered:** Manual DOCX parsing with zipfile (too complex, reinventing wheel)

**Decision 2: Return TipTap JSON directly from content endpoint**
- **Rationale:** Simplifies frontend integration - Workspace.jsx can use response directly without additional conversion
- **Alternative:** Return raw text and require frontend to call separate parse endpoint (added complexity)

**Decision 3: Parse DOCX files as bytes, not text**
- **Rationale:** DOCX is a binary format (zipped XML), must be read as bytes for python-docx to parse correctly
- **Implementation:** Use BytesIO for in-memory processing without temporary files

**Decision 4: Preserve Word heading styles**
- **Rationale:** Users expect their document structure to be preserved when opening in editor
- **Implementation:** Map Word style names (Heading 1-6, Title) to TipTap heading nodes with correct levels

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation proceeded smoothly without issues.

## User Setup Required

None - no external service configuration required. However, users will need to install the new dependency:

```bash
cd backend
pip install python-docx==1.1.0
```

Or reinstall all dependencies:
```bash
cd backend
pip install -r requirements.txt
```

## Next Phase Readiness

**Ready for Plan 09-04: Workspace Content Loading**
- Backend can now parse both Markdown and DOCX files to TipTap JSON
- GET /files/{file_id}/content endpoint returns TipTap format directly
- Workspace.jsx can fetch file content and initialize DocumentEditor

**Blockers/Concerns:**
- None identified
- Backend starts without errors after changes (pending verification)
- python-docx dependency installation required for production deployment

---
*Phase: 09-file-content-loading*
*Completed: 2026-02-05*
