---
phase: 16-memory-api-fixes
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend3/lib/api.ts
  - frontend3/pages/MemoryView.tsx
autonomous: true

must_haves:
  truths:
    - "Memory API calls include projectId parameter"
    - "API routes match backend pattern: /memory/projects/{projectId}/claims/search"
    - "MemoryView passes currentProjectId from context"
    - "Memory search returns results without 404 errors"
  artifacts:
    - path: "frontend3/lib/api.ts"
      provides: "Memory API client with project-scoped routes"
      exports: ["memoryApi"]
      contains: "memoryApi.search(projectId, query, limit)"
    - path: "frontend3/pages/MemoryView.tsx"
      provides: "Memory search UI with project context integration"
      imports: ["useProjectContext"]
      contains: "useProjectContext()"
  key_links:
    - from: "frontend3/pages/MemoryView.tsx"
      to: "frontend3/lib/context.tsx"
      via: "useProjectContext hook"
      pattern: "useProjectContext"
    - from: "frontend3/pages/MemoryView.tsx"
      to: "/api/memory/projects/{projectId}/claims/search"
      via: "memoryApi.search call"
      pattern: "memoryApi\\.search\\(currentProjectId"
---

<objective>
Fix Memory API routes to match backend implementation by adding projectId parameter and updating to project-scoped endpoints.

**Purpose:** The frontend Memory API client uses incorrect routes that don't match the backend's project-scoped pattern, causing 404 errors when searching the information graph.

**Output:** Working memory search functionality that queries backend at `/memory/projects/{projectId}/claims/search` and returns claims for the current project.
</objective>

<execution_context>
@/home/zemul/.claude/get-shit-done/workflows/execute-plan.md
@/home/zemul/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/16-memory-api-fixes/16-RESEARCH.md

# Current state reference
@/home/zemul/Programming/research/backend/memory_api.py
@/home/zemul/Programming/research/frontend3/lib/api.ts
@/home/zemul/Programming/research/frontend3/pages/MemoryView.tsx
@/home/zemul/Programming/research/frontend3/lib/context.tsx
</context>

<tasks>

<task type="auto">
  <name>Update memoryApi client with project-scoped routes</name>
  <files>frontend3/lib/api.ts</files>
  <action>
    Update the memoryApi object in frontend3/lib/api.ts to match backend routes:

    1. Update `search` function signature:
       - Change from: `search: async (query: string, limit: number = 20)`
       - Change to: `search: async (projectId: string, query: string, limit: number = 20)`
       - Update route from: `/memory/search?q=${encodeURIComponent(query)}&limit=${limit}`
       - Update route to: `/memory/projects/${projectId}/claims/search?q=${encodeURIComponent(query)}&limit=${limit}`
       - Change return type from: `MemorySearchResult` to: `Claim[]` (backend returns Claim[], not compound object)

    2. Update `claims` function:
       - Change from: `claims: async (paperId?: string, limit: number = 50)`
       - Change to: `claims: async (projectId: string, paperId?: string, limit: number = 50)`
       - Update route from: `/memory/claims?${params}`
       - Update route to: `/memory/projects/${projectId}/claims?${params}`

    3. Update `findings` function:
       - Change from: `findings: async (claimIds?: string[], limit: number = 20)`
       - Change to: `findings: async (projectId: string, claimIds?: string[], limit: number = 20)`
       - Update route from: `/memory/findings?${params}`
       - Update route to: `/memory/projects/${projectId}/findings?${params}`

    4. Remove or update `relationships` function:
       - Backend route is per-claim: `/memory/projects/{projectId}/claims/{claimId}/relationships`
       - Either remove the function (not used in current UI) or update to match backend pattern
       - For this phase, remove the function to avoid confusion

    Do NOT modify other API objects (projectApi, fileApi, etc.) - only memoryApi changes.
  </action>
  <verify>
    grep -n "memoryApi" frontend3/lib/api.ts | head -20
  </verify>
  <done>
    memoryApi.search accepts (projectId, query, limit) parameters and calls /memory/projects/{projectId}/claims/search
    memoryApi.claims accepts (projectId, paperId, limit) parameters and calls /memory/projects/{projectId}/claims
    memoryApi.findings accepts (projectId, claimIds, limit) parameters and calls /memory/projects/{projectId}/findings
    memoryApi.relationships function removed (no backend equivalent for global relationships query)
  </done>
</task>

<task type="auto">
  <name>Integrate ProjectContext into MemoryView component</name>
  <files>frontend3/pages/MemoryView.tsx</files>
  <action>
    Update MemoryView.tsx to use ProjectContext and pass projectId to API calls:

    1. Add import for useProjectContext:
       - Add: `import { useProjectContext } from '../lib/context';`

    2. Add currentProjectId to component state:
       - Inside MemoryView component, after existing useState declarations, add:
         `const { currentProjectId } = useProjectContext();`

    3. Add null check before search:
       - At start of handleSearch function, add:
         ```typescript
         if (!currentProjectId) {
           setError('No project selected');
           return;
         }
         ```

    4. Update memoryApi.search call:
       - Change from: `const response = await memoryApi.search(searchQuery, 20);`
       - Change to: `const response = await memoryApi.search(currentProjectId, searchQuery, 20);`

    5. Update results state type:
       - Change from: `{ claims: Claim[]; findings: Finding[]; relationships: Relationship[] } | null`
       - Change to: `{ claims: Claim[] } | null` (backend only returns claims)

    6. Update setResults call:
       - Change from: `setResults({ claims: response.data?.claims || [], findings: response.data?.findings || [], relationships: response.data?.relationships || [] });`
       - Change to: `setResults({ claims: response.data || [] });`

    7. Update results display:
       - Update results.claims.length check (still works)
       - Remove findings and relationships tabs since backend search only returns claims
       - Keep only claims tab in the UI

    Preserve all existing styling, error handling, and loading states. Only modify project integration.
  </action>
  <verify>
    grep -n "useProjectContext\|currentProjectId" frontend3/pages/MemoryView.tsx
  </verify>
  <done>
    MemoryView imports and uses useProjectContext hook
    handleSearch checks currentProjectId exists before API call
    memoryApi.search called with currentProjectId as first parameter
    Results state simplified to { claims: Claim[] } matching backend response
    UI shows only claims tab (findings/relationships tabs removed)
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Complete Memory API integration fix with project-scoped routes</what-built>
  <how-to-verify>
    1. Start backend: cd backend && source venv/bin/activate && python server.py (expect server on port 8000)
    2. Start frontend: cd frontend3 && npm run dev (expect server on port 3000)
    3. Visit http://localhost:3000 and navigate to Memory view (click "Memory" in sidebar)
    4. Verify page loads without console errors (check browser DevTools Console)
    5. Enter a search query (e.g., "machine learning") and click Search
    6. Verify:
       - No 404 error in Network tab
       - API call goes to /api/memory/projects/{projectId}/claims/search
       - Results display in claims list or "No claims found" message
    7. Check browser console for no errors related to memoryApi or MemoryView
  </how-to-verify>
  <resume-signal>Type "approved" if memory search works without 404 errors, or describe issues</resume-signal>
</task>

</tasks>

<verification>
After checkpoint approval, verify:

1. Backend routes match frontend calls:
   - GET /memory/projects/{project_id}/claims/search exists in backend/memory_api.py
   - Frontend calls this route with projectId from context

2. TypeScript compilation succeeds:
   - cd frontend3 && npm run build completes without errors
   - No TypeScript errors related to memoryApi or MemoryView

3. API response type matches backend:
   - Backend returns List[ClaimResponse]
   - Frontend expects Claim[] from search

4. ProjectContext integration verified:
   - MemoryView uses useProjectContext hook
   - currentProjectId passed to all memoryApi calls
   - Null check prevents API calls without projectId
</verification>

<success_criteria>
1. Memory search executes without 404 errors
2. API calls use correct project-scoped route pattern
3. TypeScript types match backend Pydantic models
4. MemoryView displays search results or appropriate empty state
5. Browser console shows no errors related to Memory API
</success_criteria>

<output>
After completion, create `.planning/phases/16-memory-api-fixes/16-01-SUMMARY.md` with:
- Routes updated (before/after mapping)
- TypeScript type changes made
- ProjectContext integration verified
- Any additional findings during implementation
</output>
