# Phase 16: Memory API Integration Fixes - Research

**Researched:** 2026-02-07
**Domain:** Frontend-Backend API Integration (TypeScript + Python/FastAPI)
**Confidence:** HIGH

## Summary

Phase 16 is a targeted integration fix to align the frontend Memory API calls with the backend implementation. The research reveals a straightforward route mapping issue: the frontend uses incorrect endpoints that don't match the backend's project-scoped Memory API routes.

**Key findings:**
1. **Backend routes are project-scoped** with pattern `/memory/projects/{project_id}/*` — this is the authoritative pattern
2. **Frontend API client uses incorrect routes** — search endpoint doesn't exist, claims/findings/relationships endpoints missing project_id
3. **ProjectContext provides currentProjectId** — the hook exists and is used by other views (FilesView, EditorView)
4. **MemoryView doesn't use ProjectContext** — currently stands alone without project scoping
5. **TypeScript types need updating** — API response types don't match backend Pydantic models

**Primary recommendation:** Update frontend3/lib/api.ts memoryApi functions to include projectId parameter and use correct route patterns. Import useProjectContext in MemoryView.tsx and pass currentProjectId to API calls. Update TypeScript interfaces to match backend ClaimResponse, FindingResponse models.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vite | 6.2.0 | Build tool with proxy | Project's existing dev server with /api proxy to localhost:8000 |
| React | 19.2.4 | UI framework | Project's existing React version |
| TypeScript | 5.8.2 | Type safety | Project's existing TypeScript version |

### Backend (for reference)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| FastAPI | Latest | REST API | Backend framework with async/await, Pydantic models |
| SQLAlchemy | Latest | ORM | AsyncSession for database operations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Direct route fix | Create abstraction layer | Unnecessary — this is a simple route fix, not architecture change |

**Installation:**
No new dependencies required. Using existing stack.

## Architecture Patterns

### Recommended Project Structure
```
frontend3/
├── lib/
│   ├── api.ts              # Update memoryApi functions with projectId
│   └── context.tsx         # Already provides useProjectContext hook
└── pages/
    └── MemoryView.tsx      # Import and use useProjectContext
```

### Pattern 1: Project-Scoped API Calls
**What:** All Memory API calls must include projectId parameter for proper data isolation
**When to use:** Every memoryApi function call
**Example:**
```typescript
// Current (WRONG):
export const memoryApi = {
  search: async (query: string, limit: number = 20) =>
    apiRequest<MemorySearchResult>(`/memory/search?q=${encodeURIComponent(query)}&limit=${limit}`),
  // ...
};

// Fixed (CORRECT):
export const memoryApi = {
  search: async (projectId: string, query: string, limit: number = 20) =>
    apiRequest<Claim[]>(`/memory/projects/${projectId}/claims/search?q=${encodeURIComponent(query)}&limit=${limit}`),
  // ...
};
```

### Pattern 2: Using ProjectContext in Components
**What:** Import useProjectContext hook to access currentProjectId
**When to use:** Any component that needs project-scoped API calls
**Example:**
```typescript
// Source: frontend3/pages/FilesView.tsx (existing pattern)
import { useProjectContext } from '../lib/context';

const FilesView: React.FC = () => {
  const { currentProjectId } = useProjectContext();

  const handleSearch = async () => {
    if (!currentProjectId) {
      setError('No project selected');
      return;
    }
    const response = await fileApi.list(currentProjectId);
    // ...
  };
  // ...
};
```

### Anti-Patterns to Avoid
- **Bypassing ProjectContext:** Don't hardcode project IDs or fetch project list manually
- **Mixed route patterns:** Don't keep old routes alongside fixed routes — replace completely
- **Missing null checks:** Always check if currentProjectId exists before making API calls

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API client patterns | Custom fetch wrapper | Existing apiRequest function | Already handles error states, typing, JSON parsing |
| Project state management | Redux/Zustand for single value | Existing ProjectContext | Already provides currentProjectId, used by other views |

**Key insight:** The infrastructure exists. This is purely a route fix and context integration.

## Common Pitfalls

### Pitfall 1: Forgetting to Update TypeScript Types
**What goes wrong:** API calls succeed but TypeScript errors appear, or runtime type mismatches
**Why it happens:** Updating routes but not the TypeScript interfaces that define responses
**How to avoid:** Update TypeScript interfaces to match backend Pydantic models exactly
**Warning signs:** TypeScript errors in api.ts, type mismatches in components

### Pitfall 2: Missing Null Check on currentProjectId
**What goes wrong:** API call fails with "undefined" in URL, or route concatenation error
**Why it happens:** ProjectContext may return null during initial load or if no projects exist
**How to avoid:** Always check `if (!currentProjectId) return;` before API calls
**Warning signs:** URL looks like `/memory/projects/undefined/claims/search`

### Pitfall 3: Breaking Other Views with API Changes
**What goes wrong:** FilesView, EditorView break if signature changes aren't backward compatible
**Why it happens:** Other views use different APIs (fileApi, documentApi) — memoryApi changes shouldn't affect them
**How to avoid:** Only modify memoryApi functions. Other APIs are separate.
**Warning signs:** Component errors in views unrelated to MemoryView

### Pitfall 4: Wrong Search Response Type
**What goes wrong:** MemoryView tries to access `response.data?.findings` but backend returns `Claim[]` array
**Why it happens:** Frontend expects compound response (claims + findings + relationships), backend search only returns claims
**How to avoid:** Update search return type to `Claim[]` and component to handle only claims
**Warning signs:** Property access errors on response.data

## Code Examples

Verified patterns from codebase:

### Existing ProjectContext Usage (FilesView.tsx)
```typescript
// Source: frontend3/pages/FilesView.tsx lines 7-27
import { useProjectContext } from '../lib/context';

const FilesView: React.FC = () => {
  const { currentProjectId } = useProjectContext();
  // ...
  const loadFiles = useCallback(async () => {
    if (!currentProjectId) {
      setError(new Error('No project selected'));
      return;
    }
    const response = await fileApi.list(currentProjectId);
    // ...
  }, [currentProjectId]);
```

### Backend Search Route (memory_api.py)
```python
# Source: backend/memory_api.py lines 224-243
@router.get("/projects/{project_id}/claims/search", response_model=List[ClaimResponse])
async def search_claims(
    project_id: str,
    q: str = Query(..., min_length=2, description="Search query"),
    limit: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
):
    """Full-text search on claim_text field."""
    service = MemoryService(session)
    claims = await service.search_claims(
        project_id=project_id,
        query=q,
        limit=limit,
    )
    return [ClaimResponse.model_validate(c) for c in claims]
```

### Backend Claim List Route (memory_api.py)
```python
# Source: backend/memory_api.py lines 29-63
@router.get("/projects/{project_id}/claims", response_model=List[ClaimResponse])
async def get_claims(
    project_id: str,
    source_type: Optional[str] = Query(None, description="Filter by source type"),
    # ... other query params
    session: AsyncSession = Depends(get_db),
):
    """List claims for a project with optional filters."""
    # ...
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Global memory endpoints | Project-scoped memory endpoints | Backend implemented | All memory data now isolated by project |

**Current state:**
- Backend: Complete project-scoped Memory API implemented
- Frontend: API client still using old global routes, not integrated

**What needs to change:**
Frontend must match backend's project-scoped pattern.

## Open Questions

1. **Search response structure mismatch**
   - What we know: Frontend expects `{claims, findings, relationships}` compound object
   - What's unclear: Should we create separate API calls for findings/relationships, or add a unified search endpoint?
   - Recommendation: For this phase, fix search to return `Claim[]` only (matching backend). Findings/relationships can be fetched via dedicated endpoints if needed.

2. **Relationships endpoint location**
   - What we know: Frontend has `/memory/relationships` but backend has `/memory/projects/{project_id}/claims/{claim_id}/relationships`
   - What's unclear: Are relationships meant to be searched globally or per-claim?
   - Recommendation: Backend pattern is per-claim relationships. Frontend should either remove relationships tab or implement claim-specific relationship fetching.

## Sources

### Primary (HIGH confidence)
- `/home/zemul/Programming/research/backend/memory_api.py` — Complete backend Memory API route definitions
- `/home/zemul/Programming/research/backend/api_models.py` — Pydantic request/response models
- `/home/zemul/Programming/research/backend/memory_service.py` — Service layer implementation
- `/home/zemul/Programming/research/frontend3/lib/api.ts` — Current frontend API client (incorrect routes)
- `/home/zemul/Programming/research/frontend3/lib/context.tsx` — ProjectContext with useProjectContext hook
- `/home/zemul/Programming/research/frontend3/pages/MemoryView.tsx` — Current MemoryView implementation
- `/home/zemul/Programming/research/frontend3/pages/FilesView.tsx` — Example of correct ProjectContext usage

### Secondary (MEDIUM confidence)
- Vite proxy configuration verified in `/home/zemul/Programming/research/frontend3/vite.config.ts`
- Package versions from `/home/zemul/Programming/research/frontend3/package.json`

### Tertiary (LOW confidence)
- None — all findings verified from codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified from package.json, vite.config.ts
- Architecture: HIGH - Verified from existing codebase patterns (FilesView, EditorView)
- Pitfalls: HIGH - Identified from direct code inspection (current broken state)

**Research date:** 2026-02-07
**Valid until:** 30 days (stable integration fix, no rapidly changing dependencies)
