# Plan 08-01: Backend Export Service and API

**Status:** ✓ Complete
**Duration:** 5 minutes
**Date:** 2026-02-05

## One-Liner
Pandoc-based export service with TipTap JSON to Markdown conversion for PDF/DOCX document export via REST API.

## Tasks Completed

### Task 1: Create Pandoc-based Export Service
**Commit:** e5699ff - `feat(08-01): create Pandoc-based export service with TipTap to Markdown conversion`

Created/updated `backend/export_service.py`:
- ExportService.export_to_pdf() - Convert TipTap JSON to PDF via Pandoc xelatex
- ExportService.export_to_docx() - Convert TipTap JSON to DOCX via Pandoc
- ExportService.tiptap_to_markdown() - TipTap JSON to Markdown conversion
- Custom exceptions: PandocNotFoundError, ConversionError, TimeoutError
- 30-second timeout on Pandoc subprocess calls
- YAML frontmatter generation (title, author, date, abstract, keywords)
- Automatic temp file cleanup with unique timestamps
- Comprehensive logging

**TipTap to Markdown support:**
- Headings (h1-h6)
- Paragraphs with inline formatting (bold, italic, strike, code)
- Ordered and unordered lists (including nested)
- Blockquotes
- Code blocks with language specification
- Horizontal rules
- Links
- Citations (placeholder format)

### Task 2: Create Export API Endpoints
**Commit:** bc357db - `feat(08-01): create export API endpoints for PDF/DOCX document export`

Created `backend/export_api.py` with 3 endpoints:
1. GET /api/documents/{document_id}/export/pdf - Export document to PDF
2. GET /api/documents/{document_id}/export/docx - Export document to DOCX
3. GET /api/export/formats - List available export formats

**Features:**
- Ownership validation via project_id query param (returns 403 if unauthorized)
- Optional author and metadata (abstract, keywords) query params
- StreamingResponse for file downloads with proper MIME types
- Safe filename generation from document title
- Error handling: 404 (not found), 403 (unauthorized), 503 (Pandoc unavailable), 500 (conversion errors)
- Registered export_router in `backend/server.py`

## Deviations from Plan

None - plan executed exactly as written.

## Verification

✓ ExportService created with TipTap to Pandoc conversion
✓ Pandoc execution tested with sample TipTap documents (markdown output verified)
✓ Export API endpoints registered (3 routes)
✓ Server loads successfully with export router
✓ Ownership validation enforced
✓ Clear error messages when Pandoc unavailable

## Next Phase Readiness

Backend export functionality complete. Frontend integration (Phase 08-02) can add export buttons to document editor UI that call these endpoints.

**Files modified:**
- backend/export_service.py (rewritten with TipTap JSON support)
- backend/export_api.py (created)
- backend/server.py (registered export_router)
