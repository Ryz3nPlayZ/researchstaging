# Plan 04-03: Citation Management Backend

**Status:** ✓ Complete
**Duration:** 4 minutes
**Date:** 2026-02-04

## Tasks Completed

### Task 1: Create DocumentCitation Model
**Commits:**
- b606402 - `feat(04-03): add DocumentCitation, Document, and DocumentVersion models`

Added to `backend/database/models.py`:
- DocumentCitation model with:
  - id, document_id (FK CASCADE), citation_position (JSONB)
  - source_type enum (PAPER, CLAIM, MANUAL)
  - source_id (polymorphic reference to papers.id or claims.id)
  - citation_data (JSONB with formatted citation)
  - created_at timestamp
- Indexes on document_id and (source_type, source_id)

### Task 2: Create Citation Formatting Service
**Commit:** 944bebf - `feat(04-03): add CitationService for academic citation formatting`

Created `backend/citation_service.py` (100+ lines):
- format_citation(source_type, source_data, style) - Formats individual citations
- Three style methods:
  - format_apa() - "{Author}. ({Year}). {Title}. {Venue}."
  - format_mla() - "{Author}. \"{Title}.\" {Venue}, {Year}."
  - format_chicago() - "{Author}. {Year}. \"{Title}.\" {Venue}."
- format_bibliography(citations, style) - Formats and sorts bibliography
- Author formatting: handles single, multiple, et al.
- Venue extraction with fallback chain

### Task 3: Create Citation API Endpoints
**Commit:** 906d68d - `feat(04-03): add citation API endpoints`

Added to `backend/memory_api.py`:
- GET /api/documents/{id}/citations - List all citations for document
- POST /api/documents/{id}/citations - Create citation
- PUT /api/documents/{id}/citations/{citation_id} - Update citation
- DELETE /api/documents/citations/{citation_id} - Delete citation
- GET /api/documents/{id}/bibliography?style={style} - Generate bibliography

All endpoints follow async patterns with Pydantic validation.

## Deviations

None. All tasks completed as specified.

## Verification

✓ DocumentCitation model created with correct fields and enum  
✓ CitationService formats citations in APA, MLA, Chicago styles  
✓ API endpoints created and functional  
✓ Bibliography generation works  
✓ Polymorphic source associations work (paper/claim/manual)  
✓ All 3 citation styles supported (APA 7th, MLA 9th, Chicago 17th)

## Next Steps

Citation backend is complete with model, formatting service, and API endpoints. Supports dual-mode citations (memory backend + manual entry) and all three academic styles (APA, MLA, Chicago). Ready for Citation UI integration (Phase 04-05) and document editor integration.

## Design Decisions

1. **CitationService encapsulation** - Separate service for all citation formatting logic
2. **Style-specific formatting** - Separate methods for APA, MLA, Chicago with proper rules
3. **Bibliography as formatted string** - API returns pre-formatted text (not structured data) to avoid duplicating formatting logic
4. **Polymorphic source pattern** - source_type + source_id for flexible references without separate FKs
