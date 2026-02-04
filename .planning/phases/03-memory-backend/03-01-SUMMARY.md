---
phase: 03-memory-backend
plan: 01
subsystem: database
tags: [postgresql, sqlalchemy, jsonb, graph, recursive-cte, gin-index]

# Dependency graph
requires:
  - phase: 02-file-management
    plan: all
    provides: Complete file management system with cloud storage
provides:
  - Database models for Claims, Findings, Preferences, ClaimRelationship
  - Migration script to add memory tables with indexes
  - Recursive CTE helper function for graph traversal
  - GIN indexes for full-text search on claim and finding text
affects: [03-memory-backend-02, 03-memory-backend-03]

# Tech tracking
tech-stack:
  added: [pg_trgm extension, PostgreSQL recursive CTEs, GIN indexes, JSONB polymorphic associations]
  patterns:
    - Adjacency list for relationship graphs (ClaimRelationship with from_claim_id, to_claim_id)
    - Polymorphic source associations (source_type + source_id pattern)
    - JSONB for flexible metadata (claim_data, finding_data, preference_data, relationship_metadata)
    - Project-scoped data isolation (all models have project_id FK)
    - Relevance scoring for prioritization (relevance_score on claims and findings)

key-files:
  created:
    - backend/database/models.py (Claim, Finding, Preference, ClaimRelationship models)
    - backend/scripts/migrate_add_memory_tables.py (migration script)
  modified:
    - backend/database/__init__.py (exports for new models and enums)

key-decisions:
  - "Use adjacency list for relationships (simpler updates, recursive CTEs for reads)"
  - "JSONB for claim/finding metadata (flexible schema, GIN indexes for search)"
  - "Polymorphic source references (source_type enum + source_id for linking to papers/files/analyses)"
  - "Project-scoped claims (all memory data linked to project_id with CASCADE delete)"
  - "Relevance score stored on claims and findings for prioritization"
  - "Renamed ClaimRelationship.metadata to relationship_metadata (SQLAlchemy reserved word)"

patterns-established:
  - "Graph model: Claim nodes with ClaimRelationship edges (adjacency list)"
  - "Polymorphic associations: source_type enum + source_id for linking to any source"
  - "Metadata flexibility: JSONB columns for evolving claim/finding structures"
  - "Relevance prioritization: relevance_score float column for sorting and filtering"
  - "Recursive graph traversal: get_related_claims() function with depth limit and cycle prevention"

# Metrics
duration: 7min
completed: 2026-02-04
---

# Phase 3 Plan 1: Memory Backend Data Model Summary

**Adjacency list graph model with polymorphic source associations, JSONB metadata, and GIN-indexed full-text search**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-04T22:57:45Z
- **Completed:** 2026-02-04T23:04:00Z
- **Tasks:** 5 (4 model implementations + 1 migration)
- **Files modified:** 2

## Accomplishments

- Implemented Claim model with provenance tracking (source_type, source_id, confidence, extracted_at)
- Implemented Finding model for analysis results with significance metrics
- Implemented Preference model for user settings with flexible JSONB values
- Implemented ClaimRelationship model using adjacency list pattern for graph traversal
- Created migration script enabling pg_trgm extension and recursive CTE helper function
- Created 14 indexes including GIN indexes for full-text search on claim_text and finding_text

## Task Commits

Each task was committed atomically:

1. **Task 1-4: Add Claim, Finding, Preference, ClaimRelationship models** - `f5d8b95` (feat)
2. **Task 5: Create migration script for memory tables** - `08c6ca5` (feat)
3. **Fix: Rename ClaimRelationship.metadata to relationship_metadata** - `253ffb4` (fix)

**Plan metadata:** No separate metadata commit (included in task commits)

_Note: Tasks 1-4 were combined into a single commit as they all modified the same file (models.py)_

## Files Created/Modified

- `backend/database/models.py` - Added Claim, Finding, Preference, ClaimRelationship models with enums (ClaimSourceType, RelationshipType)
- `backend/scripts/migrate_add_memory_tables.py` - Migration script enabling pg_trgm, creating tables, indexes, and get_related_claims() function
- `backend/database/__init__.py` - Exported new models and enums for use in API layer

## Decisions Made

**1. Adjacency list for claim relationships**
- Simpler schema than closure table, easier to maintain
- Recursive CTEs perform well for moderate-sized graphs (<100K nodes)
- Can migrate to closure table later if performance issues arise

**2. JSONB for flexible metadata**
- Claim structure may evolve based on literature domain (medical vs CS vs social sciences)
- GIN indexes enable efficient full-text search
- Type enforcement can be added at application layer

**3. Polymorphic source associations**
- source_type enum (PAPER, FILE, ANALYSIS, USER) + source_id pattern
- Allows claims to link to any source without separate foreign keys
- Consistent with existing codebase patterns

**4. Project-scoped data isolation**
- All memory models have project_id foreign key with CASCADE delete
- Ensures data isolation between research projects
- Automatic cleanup when project is deleted

**5. Relevance scoring for prioritization**
- relevance_score column on Claim and Finding models
- Enables sorting and filtering by importance
- Can be calculated based on project context and user feedback

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Renamed ClaimRelationship.metadata to relationship_metadata**
- **Found during:** Task 5 (migration script execution)
- **Issue:** SQLAlchemy reserves `metadata` as Base.metadata attribute, causing InvalidRequestError
- **Fix:** Renamed column to `relationship_metadata` to avoid naming conflict
- **Files modified:** backend/database/models.py
- **Verification:** Migration script runs successfully, models import without errors
- **Committed in:** `253ffb4` (separate fix commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Fix was necessary for correct operation. No scope creep.

## Issues Encountered

**1. Module import error during migration script execution**
- **Issue:** Initial run failed with "ModuleNotFoundError: No module named 'sqlalchemy'"
- **Resolution:** Needed to activate Python virtual environment before running migration script
- **Impact:** None - expected development environment requirement

**2. SQLAlchemy reserved word conflict**
- **Issue:** Using `metadata` as column name conflicted with SQLAlchemy's Base.metadata
- **Resolution:** Renamed to `relationship_metadata` for clarity
- **Impact:** Minimal - single line change, no functional difference

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for next phase:**
- All memory models are available for import and use
- Migration script successfully creates tables and indexes
- get_related_claims() function available for graph traversal queries
- Models exported from database/__init__.py for easy importing

**No blockers or concerns.**

The memory backend data model is complete and ready for:
- Plan 03-02: Claim extraction and storage service
- Plan 03-03: Memory query API with relationship traversal

---
*Phase: 03-memory-backend*
*Plan: 01*
*Completed: 2026-02-04*
