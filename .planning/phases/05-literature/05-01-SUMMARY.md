# Phase 05 Plan 01: Literature Search & Unpaywall Integration

**Status:** ✓ Complete
**Duration:** 6 minutes
**Date:** 2026-02-05

## One-Liner
Multi-source literature search API with Semantic Scholar, arXiv, and Unpaywall integration, prioritizing open-access PDFs with React UI component.

## Tasks Completed

### Task 1: Create Literature Search API endpoints
**Commit:** 1f4d952 - `feat(05-01): create literature search API endpoints`

Created `backend/literature_api.py` (340+ lines):
- GET /api/literature/search - Multi-source paper search
  - Semantic Scholar integration (academic papers with citations)
  - arXiv integration (preprints and technical reports)
  - Unpaywall integration (open-access PDF lookup)
  - Results prioritized by: PDF availability, citation count, year
- GET /api/literature/papers/{paper_id} - Paper details (placeholder for future)
- POST /api/literature/papers/{paper_id}/download - PDF download endpoint
  - Saves to backend/storage/pdfs/{paper_id}.pdf
  - Returns file path and metadata
- Integrated literature router into backend/server.py
- Created storage directory for downloaded PDFs

### Task 2: Create Literature Search UI component
**Commit:** 45e37a9 - `feat(05-01): create literature search UI component`

Created `frontend/src/components/literature/LiteratureSearch.jsx` (420+ lines):
- Search input with 500ms debouncing for efficient API usage
- Search button and Enter key support
- Results table with key information:
  - Title (clickable, opens details modal)
  - Authors (truncated to 3 with "et al." indicator)
  - Year badge
  - Citation count with book icon
  - Source badge (Semantic Scholar/arXiv with color coding)
  - Open access indicator (green PDF badge)
  - "Add to Project" button (placeholder for Phase 5-02)
- Loading spinner during search
- Error messages with toast notifications
- Empty state illustration when no search
- "No results" state with helpful hints
- Paper details modal with:
  - Full title and authors
  - Abstract (if available)
  - Metadata badges (source, year, citations, OA status)
  - External links to paper sources
  - PDF download links (both direct and open access)
  - DOI display

Added to `frontend/src/lib/api.js`:
- literatureApi.search(query, limit)
- literatureApi.getPaper(paperId)
- literatureApi.downloadPaper(paperId, pdfUrl)
- literatureApi.health()

### Task 3: Enhance Unpaywall integration and PDF prioritization
**Commit:** a213e13 - `feat(05-01): enhance Unpaywall integration and PDF prioritization`

Enhanced `backend/literature_service.py`:
- Added _extract_doi method to SemanticScholarClient
  - Tries direct DOI field from API
  - Extracts from URL if contains doi.org
  - Parses citation styles for DOI
- Added enrich_with_open_access method to LiteratureService
  - Parallel Unpaywall lookups with concurrency limit (5 concurrent)
  - Rate limiting with 100ms delay between requests
  - Graceful error handling for Unpaywall failures (429, timeouts)
  - Enriches papers with open_access_pdf_url field
- Added _sort_papers_by_priority method to LiteratureService
  - Sorts by: PDF availability (first), citation count (second), year (third)
  - Prioritizes open-access PDFs over paywalled versions
- Moved enrichment logic from API layer to service layer
- Enhanced error handling for HTTP status errors
- Cleaned up unused imports

## Deviations from Plan

**None** - Plan executed exactly as written.

## Verification

✓ Backend API endpoints respond correctly (tested with curl)
✓ Frontend search UI displays results with all required columns
✓ Open-access papers are prioritized in results (verified sorting)
✓ PDF download endpoint saves files successfully
✓ Error handling works for rate limiting and API failures
✓ Integration test complete: search → results → prioritize → download

## Success Criteria Met

✓ All tasks completed (3/3)
✓ Literature search API functional with Semantic Scholar and arXiv
✓ Unpaywall integration successfully finds open-access PDFs
✓ Search results prioritized by PDF availability
✓ Frontend UI allows searching and viewing results
✓ PDF download endpoint saves papers to storage

## Tech Stack

**Added:**
- None (used existing dependencies: httpx, fastapi, react, lucide-react, shadcn/ui)

**Patterns Used:**
- Service layer architecture (LiteratureService)
- REST API endpoints with FastAPI
- React functional components with hooks
- Debounced search for performance
- Concurrent API calls with asyncio.gather
- Semaphore-based rate limiting
- Graceful degradation (search works even if Unpaywall fails)

## Key Files Created

**Backend:**
- `backend/literature_api.py` (340 lines) - REST API endpoints
- `backend/literature_service.py` (enhanced) - DOI extraction, Unpaywall enrichment, result sorting
- `backend/server.py` (modified) - Added literature router

**Frontend:**
- `frontend/src/components/literature/LiteratureSearch.jsx` (420 lines) - Search UI component
- `frontend/src/components/literature/index.js` (4 lines) - Export index
- `frontend/src/lib/api.js` (modified) - Added literatureApi client

**Storage:**
- `backend/storage/pdfs/` - Directory for downloaded PDFs

## Next Phase Readiness

**For Phase 05-02 (Paper Management):**
- Literature search API fully functional
- UI component ready for integration with paper management
- "Add to Project" button placeholder ready for implementation
- PDF download endpoint available for acquiring papers

**Decisions Made:**

**76. Service layer enrichment** - Unpaywall integration and result sorting implemented in LiteratureService, not API layer. Enables reuse and testing.

**77. DOI extraction fallback chain** — Try direct field, then URL parsing, then citation styles. Maximizes DOI discovery rate.

**78. Concurrent Unpaywall lookups with semaphore** — Parallel lookups with max 5 concurrent requests. Balances speed with rate limit compliance.

**79. Priority-based result sorting** — Has PDF (first), citations (second), year (third). Ensures most accessible/relevant papers appear first.

**80. Graceful Unpaywall degradation** — Search continues even if Unpaywall fails. Logs warnings but returns results without OA enrichment.

## Performance Metrics

- Search response time: ~3-5 seconds (including Unpaywall enrichment)
- API rate limiting: 1 second between Semantic Scholar requests
- Unpaywall rate limiting: 100ms between requests, max 5 concurrent
- Debounce delay: 500ms (frontend)
- Results limit: 20 per source (configurable)

## Testing Performed

1. Backend health check: `/api/literature/health` ✓
2. Search endpoint: `/api/literature/search?query=machine+learning&limit=3` ✓
3. Result verification: Papers returned with PDF URLs prioritized ✓
4. DOI extraction: Tested with Semantic Scholar papers ✓
5. Unpaywall integration: Parallel lookups working ✓
6. Rate limiting: 429 errors handled gracefully ✓

## Authentication Gates

None encountered.

## Known Issues

None. All functionality working as expected.
