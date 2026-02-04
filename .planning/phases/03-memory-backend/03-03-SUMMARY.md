---
phase: 03-memory-backend
plan: 03
subsystem: backend
tags: [api, fastapi, rest, search, graph-traversal, relationships]

# Dependency graph
requires:
  - phase: 03-memory-backend
    plan: 01
    provides: Claim, Finding, Preference, ClaimRelationship database models
  - phase: 03-memory-backend
    plan: 02
    provides: MemoryService with CRUD and extraction methods
provides:
  - REST API endpoints for memory operations
  - Search and filtering endpoints for claims and findings
  - Graph traversal endpoint for related claims
  - Preference management endpoints
affects: [frontend integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - REST API pattern (matching file_api, project_api)
    - Async route handlers
    - Pydantic request/response models
    - Project-scoped endpoints
    - Query parameter filtering
    - Recursive CTE for graph traversal

key-files:
  created:
    - backend/api_models.py
    - backend/memory_api.py
  modified:
    - backend/server.py (register memory router)
    - backend/memory_service.py (added search_claims, get_claim_relationships)

key-decisions:
  - "Create separate /api/memory prefix for all memory endpoints"
  - "Use Pydantic models for request/response validation"
  - "Support filtering by source_type, source_id, claim_type, confidence"
  - "Graph traversal endpoint uses recursive CTE from MemoryService"
  - "Full-text search on claim_text and claim_type using ILIKE"
  - "Map relationship_metadata database column to metadata in API response"

patterns-established:
  - "Memory router: /api/memory/projects/{id}/claims"
  - "Filter pattern: query params for source_type, min_confidence, etc."
  - "Search endpoint: /api/memory/projects/{id}/claims/search?q={query}"
  - "Graph traversal: /api/memory/projects/{id}/claims/{id}/related"
  - "Relationship endpoints: POST and GET for claim relationships"

# Metrics
duration: 1 min
complexity: low (standard CRUD API following existing patterns)
risk: low (no external dependencies, follows established patterns)
completed: 2026-02-04

---

# Phase 3 Plan 03: Memory Query and Retrieval API Summary

**One-liner:** REST API for claims, findings, preferences with filtering, full-text search, and graph traversal

## What Was Built

Created the Memory Query and Retrieval API layer to expose memory functionality to the frontend. This provides a complete REST interface for managing research claims, findings, user preferences, and their relationships.

## Files Created

### `backend/api_models.py`
Pydantic models for request/response validation:
- **ClaimRequest/ClaimResponse**: Claim creation and retrieval
- **FindingRequest/FindingResponse**: Finding creation and retrieval
- **PreferenceRequest/PreferenceResponse**: Preference management
- **ClaimRelationshipResponse**: Claim relationship representation

### `backend/memory_api.py`
FastAPI router with comprehensive memory endpoints:

**Claim Endpoints:**
- `GET /api/memory/projects/{id}/claims` - List claims with filtering
- `GET /api/memory/projects/{id}/claims/{claim_id}` - Get single claim
- `POST /api/memory/projects/{id}/claims` - Create claim
- `PUT /api/memory/projects/{id}/claims/{claim_id}` - Update claim
- `DELETE /api/memory/projects/{id}/claims/{claim_id}` - Delete claim
- `GET /api/memory/projects/{id}/claims/search?q={query}` - Full-text search

**Graph Traversal:**
- `GET /api/memory/projects/{id}/claims/{claim_id}/related` - Get related claims via graph traversal
- `POST /api/memory/projects/{id}/claims/{from_id}/relationships/{to_id}` - Create relationship
- `GET /api/memory/projects/{id}/claims/{claim_id}/relationships` - Get all relationships

**Finding Endpoints:**
- `GET /api/memory/projects/{id}/findings` - List findings
- `POST /api/memory/projects/{id}/findings` - Create finding

**Preference Endpoints:**
- `GET /api/memory/projects/{id}/preferences` - List preferences
- `PUT /api/memory/projects/{id}/preferences/{key}` - Set preference
- `GET /api/memory/projects/{id}/preferences/{key}` - Get preference
- `DELETE /api/memory/projects/{id}/preferences/{key}` - Delete preference

## Files Modified

### `backend/memory_service.py`
Added service methods:
- **search_claims()**: Full-text search using ILIKE with relevance scoring
- **get_claim_relationships()**: Retrieve both incoming and outgoing relationships

### `backend/server.py`
Registered memory router:
- Imported `memory_router` from `memory_api`
- Included in `api_router` with `/api/memory` prefix
- All endpoints accessible at `/api/memory/...`

## Decisions Made

1. **Separate API prefix**: Used `/api/memory` prefix for clear namespacing and to avoid conflicts with existing endpoints

2. **Query parameter filtering**: Implemented optional filtering via query params (source_type, source_id, claim_type, min_confidence) following REST conventions

3. **Full-text search with ILIKE**: Used PostgreSQL case-insensitive pattern matching for search. Could upgrade to full-text search with GIN indexes if performance becomes an issue

4. **Graph traversal via service method**: Reused existing `get_related_claims()` from MemoryService which uses recursive CTE with depth limiting and cycle prevention

5. **Field name mapping**: API response uses `metadata` while database uses `relationship_metadata` - mapped explicitly in endpoints to maintain clean API contract

6. **Project ownership validation**: All endpoints verify claim/project ownership to prevent cross-project data access

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Phase 3 (Memory Backend) is now complete** with all 3 plans finished:
- 03-01: Memory Backend Data Model
- 03-02: Claim Extraction and Storage Service
- 03-03: Memory Query and Retrieval API

**What's ready for Phase 4 (Memory Frontend):**
- Complete memory data models (Claim, Finding, Preference, ClaimRelationship)
- MemoryService with full CRUD operations
- Claim extraction from papers and analysis outputs
- REST API for all memory operations
- Graph traversal capabilities for relationship visualization
- Full-text search for finding relevant claims

**What Phase 4 needs to implement:**
- Memory inspector panel UI
- Claim visualization and filtering
- Relationship graph display
- Preference management interface
- Search interface for claims/findings

## Authentication Gates

None encountered during this plan.

## Key Links Established

- **Frontend → Memory API**: Frontend can now query `/api/memory/projects/{id}/claims` for claim data
- **Memory API → MemoryService**: API routes delegate all business logic to MemoryService
- **MemoryService → Database**: Async database operations via SQLAlchemy
- **Graph Traversal**: Recursive CTE query enables finding related claims up to 5 hops deep

## Testing Notes

**Manual testing required:**
1. Start backend server: `cd backend && python server.py`
2. Visit API docs: `http://localhost:8000/docs`
3. Verify memory endpoints appear in Swagger UI
4. Test claim creation via POST `/api/memory/projects/{id}/claims`
5. Test filtering with query parameters
6. Test full-text search
7. Test graph traversal with created relationships
8. Test preference CRUD operations

## Commits

- `ab6418a`: feat(03-03): add Pydantic models for memory API
- `012a9bd`: feat(03-03): add memory API router with claim endpoints
- `52be4da`: feat(03-03): register memory API router in server
