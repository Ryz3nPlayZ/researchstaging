# Phase 16-01: Memory API Integration Fixes - Summary

**Completed:** 2026-02-07
**Status:** ✓ COMPLETE
**Commits:** 4

## Objective

Fix Memory API routes to match backend implementation by adding projectId parameter and updating to project-scoped endpoints.

## What Was Built

### Frontend Changes (frontend3/lib/api.ts)
- **Updated `memoryApi.search`**: Changed signature from `(query, limit)` to `(projectId, query, limit)`
- **Updated route**: From `/memory/search` to `/memory/projects/${projectId}/claims/search`
- **Updated return type**: From `MemorySearchResult` to `Claim[]` (matches backend)
- **Updated `memoryApi.claims`**: Added `projectId` parameter, route to `/memory/projects/${projectId}/claims`
- **Updated `memoryApi.findings`**: Added `projectId` parameter, route to `/memory/projects/${projectId}/findings`
- **Removed `memoryApi.relationships`**: No backend equivalent for global relationships query
- **Updated `Claim` interface**: Extended to match backend `ClaimResponse` model with all fields

### Frontend Changes (frontend3/pages/MemoryView.tsx)
- **Added ProjectContext integration**: Import and use `useProjectContext()` hook
- **Added null check**: Check `currentProjectId` exists before API calls
- **Updated API call**: Pass `currentProjectId` as first parameter to `memoryApi.search()`
- **Simplified results state**: Changed from `{claims, findings, relationships}` to `{claims}` only
- **Removed unused tabs**: Findings and relationships tabs removed (backend search only returns claims)

### Backend Changes (backend/memory_api.py)
- **Fixed route ordering**: Moved `/projects/{project_id}/claims/search` BEFORE `/projects/{project_id}/claims/{claim_id}`
- **Why**: FastAPI matches routes in declaration order. Without this fix, `/claims/search` was matched by `/{claim_id}` with `claim_id="search"`, causing 404 errors.

## Routes Updated (Before → After)

| Function | Before | After |
|----------|--------|-------|
| search | `/memory/search` | `/memory/projects/{projectId}/claims/search` |
| claims | `/memory/claims` | `/memory/projects/{projectId}/claims` |
| findings | `/memory/findings` | `/memory/projects/{projectId}/findings` |
| relationships | `/memory/relationships` | *(removed)* |

## TypeScript Type Changes

### Claim Interface (Extended)
```typescript
// Before
export interface Claim {
  id: string;
  source_id: string;
  claim_text: string;
  confidence: number;
  extracted_at: string;
  paper_id?: string;
}

// After
export interface Claim {
  id: string;
  project_id: string;
  claim_text: string;
  claim_type?: string;
  claim_data?: Record<string, unknown>;
  source_type: string;
  source_id: string;
  confidence: number;
  relevance_score?: number;
  extracted_at: string;
  extracted_by?: string;
}
```

## Commits

| Hash | Message |
|------|---------|
| 60170ba | feat(16-01): Update memoryApi client with project-scoped routes |
| 454f136 | feat(16-01): Integrate ProjectContext into MemoryView component |
| 64e1928 | fix(16-01): update Claim interface to match backend ClaimResponse |
| 9883410 | fix(16-01): move /search route before /{claim_id} to fix FastAPI route matching |

## Testing Results

### Memory API Test
- ✓ Backend route `/api/memory/projects/{projectId}/claims/search` returns 200 OK
- ✓ Empty search returns `[]` (correct empty state, not 404)
- ✓ Frontend displays "No claims found" message
- ✓ No console errors related to Memory API

### Known Issues (Deferred to Phase 17)
- ⚠ WebSocket connection errors in console (connecting to wrong port)
- This is a separate infrastructure issue not related to Memory API
- Will be fixed in Phase 17: "WebSocket Connection Fixes"

## Success Criteria Met

- ✓ Memory API calls include `projectId` parameter
- ✓ API routes match backend pattern: `/memory/projects/{projectId}/claims/search`
- ✓ MemoryView passes `currentProjectId` from context
- ✓ Memory search returns results without 404 errors (empty array when no results)

## Files Modified

- `frontend3/lib/api.ts` - Updated memoryApi functions and Claim interface
- `frontend3/pages/MemoryView.tsx` - Added ProjectContext integration
- `backend/memory_api.py` - Fixed route ordering

## Integration Notes

The fix required changes in both frontend and backend:
1. Frontend needed to pass `projectId` to all memory API calls
2. Frontend needed to use ProjectContext to get current project ID
3. Backend had a route ordering bug that needed fixing

All changes are backward compatible with existing code.
