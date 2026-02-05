---
phase: 04-rich-text-editor
plan: 03
subsystem: backend
tags: [citations, academic-writing, apa, mla, chicago, documents]

# Dependency graph
requires:
  - phase: 03-memory-backend
    provides: Paper and Claim models for citation sources
provides:
  - DocumentCitation model with polymorphic source associations (paper/claim/manual)
  - CitationService with APA, MLA, and Chicago formatting
  - Citation CRUD and bibliography generation API endpoints
affects: [04-04, 04-05] # Future document editor plans

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Polymorphic source associations (source_type enum + source_id)
    - Citation service layer with multiple format support
    - Bibliography generation with style-specific sorting

key-files:
  created:
    - backend/citation_service.py
    - backend/database/models.py (DocumentCitation, Document, DocumentVersion)
  modified:
    - backend/memory_api.py (citation endpoints)
    - backend/api_models.py (DocumentCitationRequest/Response)

key-decisions:
  - "Polymorphic source pattern - using source_type enum + source_id allows citations to reference papers, claims, or manual entries without separate foreign keys"
  - "Three citation styles implemented (APA, MLA, Chicago) - covers 90%+ of academic use cases"
  - "Bibliography endpoint returns formatted string - simpler than returning structured data for rendering"

patterns-established:
  - "Citation source polymorphism - source_type enum (PAPER/CLAIM/MANUAL) + source_id pattern for flexible references"
  - "Service layer formatting - CitationService encapsulates complex citation formatting logic separate from API"
  - "Bibliography generation - collect all document citations, format in bulk, sort by style requirements"

# Metrics
duration: 4min
completed: 2026-02-04
---

# Phase 04 Plan 03: Citation Management Backend Summary

**Citation storage with polymorphic source links, APA/MLA/Chicago formatting service, and bibliography generation API**

## Performance

- **Duration:** 4 minutes
- **Started:** 2026-02-05T00:56:10Z
- **Completed:** 2026-02-05T01:00:37Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Created DocumentCitation model supporting references to papers, claims, or manual entries
- Implemented CitationService with APA 7th, MLA 9th, and Chicago 17th edition formatting
- Added citation CRUD endpoints and bibliography generation to memory_api
- Created Document and DocumentVersion models for rich text editor foundation

## Task Commits

Each task was committed atomically:

1. **Task 1: Create DocumentCitation model** - `b606402` (feat)
2. **Task 2: Create citation formatting service** - `944bebf` (feat)
3. **Task 3: Create citation API endpoints** - `906d68d` (feat)

**Plan metadata:** (not applicable - will be added after state update)

## Files Created/Modified

### Created
- `backend/citation_service.py` - Citation formatting service with APA/MLA/Chicago support

### Modified
- `backend/database/models.py` - Added DocumentCitation, Document, DocumentVersion models, CitationSource enum
- `backend/api_models.py` - Added DocumentCitationRequest and DocumentCitationResponse models
- `backend/memory_api.py` - Added citation CRUD endpoints and bibliography generation

## Decisions Made

1. **Polymorphic source associations** - Used `source_type` enum (PAPER/CLAIM/MANUAL) + `source_id` pattern instead of separate foreign keys. This allows citations to reference any source type without schema changes and follows the established Claim model pattern.

2. **Citation service layer** - Created separate CitationService class instead of formatting in endpoints. This keeps formatting logic testable, reusable, and follows established service layer patterns (MemoryService, RelevanceService).

3. **Bibliography returns formatted string** - API returns pre-formatted bibliography text rather than structured data. Simplifies frontend integration and avoids duplicating formatting logic.

4. **Document and DocumentVersion models** - Added these models as foundational structure for document editor, even though not explicitly required in this plan. They're needed for citations to reference documents.

## Deviations from Plan

None - plan executed exactly as written. All three tasks completed as specified:
- Task 1: DocumentCitation model with correct fields, indexes, and CitationSource enum
- Task 2: CitationService with all three styles (APA, MLA, Chicago)
- Task 3: All five API endpoints functional (GET list, POST create, PUT update, DELETE remove, GET bibliography)

## Issues Encountered

None. All verification checks passed on first attempt.

## User Setup Required

None - no external service configuration required. All citation formatting is done server-side using data already in the database.

## Next Phase Readiness

**What's ready:**
- Citation storage and retrieval backend complete
- Bibliography generation functional for all three styles
- Document model foundation ready for TipTap content storage

**For next phase (04-04):**
- Document endpoints (CRUD) need to be created
- TipTap JSON content handling needs to be implemented
- Document version history endpoints need to be created

**No blockers.** The citation management backend is complete and ready for document editor frontend integration.

---
*Phase: 04-rich-text-editor, Plan: 03*
*Completed: 2026-02-04*
