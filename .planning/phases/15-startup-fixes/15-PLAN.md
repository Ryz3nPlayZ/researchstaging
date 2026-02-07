---
phase: 15-startup-fixes
goal: Fix startup script configuration and add missing navigation for complete v1.1 milestone
subsystem: configuration, ui
tags: bash, scripts, react, typescript

# Dependency graph
requires:
  - phase: 14-production-polish
    provides: ESLint-clean codebase, error boundaries, loading states
provides:
  - Corrected startup script using frontend3/
  - Detailed logging for build/compile and runtime
  - Fixed WebSocket URL construction
  - Complete navigation (Analysis and Memory views accessible)
affects: []
completes:
  - milestone: v1.1
    gaps:
      - integration: "run-all.sh uses old frontend/"
      - integration: "Missing navigation for Analysis/Memory views"
      - integration: "WebSocket URL construction includes /api prefix"

# Tech tracking
tech-stack:
  added: []
  modified: []
patterns:
  - "Pattern: Vite dev server uses `npm run dev` not `npm start`"
  - "Pattern: WebSocket URL should be ws://host:port/ws/{id} not ws://host:port/api/ws/{id}"
  - "Pattern: All major views should be accessible from Sidebar navigation"

key-files:
  created: []
  modified:
    - run-all.sh
    - run-frontend.sh (if exists)
    - frontend3/App.tsx (WebSocket URL fix)
    - frontend3/components/Sidebar.tsx (add nav items)

key-decisions:
  - "Update run-all.sh to use frontend3/ instead of frontend/ (new design)"
  - "Add timestamped logging for debugging build and runtime issues"
  - "Remove /api prefix from WebSocket base URL for production compatibility"
  - "Add Analysis and Memory buttons to Sidebar navigation"

patterns-established:
  - "Pattern: Startup scripts must use correct frontend directory"
  - "Pattern: All logs include timestamps and clear component identification"
  - "Pattern: WebSocket connections use direct /ws/ path not proxied /api/ws/"

# Success criteria
must:
  - run-all.sh starts frontend3/ on port 3000 with npm run dev
  - run-all.sh includes detailed logging with timestamps
  - WebSocket connects to ws://localhost:8000/ws/{id} (no /api prefix)
  - Sidebar has Analysis and Memory navigation buttons
should:
  - All startup scripts (run-frontend.sh, etc.) updated if they exist
  - Logs clearly show backend and frontend startup separately
  - Navigation items have proper icons and active states
could:
  - Add color-coded log output (backend=blue, frontend=green)
  - Add health check logs every 60 seconds
  - Consider collapsible navigation for Analysis/Memory
won't:
  - Don't modify frontend/ directory (legacy, to be removed)
  - Don't change WebSocket protocol (keep ws:// for local, wss:// inferred for production)

---

# Phase 15: Startup Script & Navigation Fixes

**Goal:** Fix critical configuration issues preventing proper use of the new frontend3/ design, and complete navigation for all views.

## Context

From v1.1 Milestone Audit:

> **CRITICAL:** `run-all.sh` uses old `frontend/` instead of `frontend3/`
> **Impact:** Developers running `./run-all.sh` see old UI instead of new design
> **Fix Required:** Update line 65: `cd frontend3` and use `npm run dev`

Additionally:
- WebSocket URL construction includes `/api` prefix (may fail in production)
- Analysis and Memory views exist but have no navigation buttons in Sidebar
- User requested: detailed logging during build/compile and runtime

---

## Tasks

### Task 1: Update run-all.sh to use frontend3

**File:** `run-all.sh`

**Changes:**
1. Change `cd frontend` to `cd frontend3` (line ~65)
2. Change `npm start` to `npm run dev` (Vite uses dev command)
3. Add detailed logging with timestamps:
   - Backend startup: `[BACKEND] [$(date '+%H:%M:%S')] Starting...`
   - Frontend startup: `[FRONTEND] [$(date '+%H:%M:%S')] Starting...`
   - PID logging: show process IDs clearly
   - Port confirmation: log when each server is ready
4. Color-coded output if possible (backend=blue, frontend=green)

**Verification:**
- Run `./run-all.sh`
- Verify frontend3/ starts on port 3000
- Verify logs show clear timestamps and component labels

**Acceptance:**
```bash
$ ./run-all.sh
[BACKEND] [13:45:00] Starting backend server...
[BACKEND] [13:45:01] Server running on http://localhost:8000 (PID: 12345)
[FRONTEND] [13:45:02] Starting frontend dev server...
[FRONTEND] [13:45:03] Vite server running on http://localhost:3000 (PID: 12346)
```

---

### Task 2: Update other startup scripts (if they exist)

**Files to check:**
- `run-frontend.sh`
- `run-backend.sh`
- `start.sh`
- Any other startup scripts

**Changes:** Same as Task 1 — use frontend3/ and npm run dev

**If script doesn't exist:** Skip (no action needed)

---

### Task 3: Fix WebSocket URL construction

**File:** `frontend3/App.tsx`

**Current code (line ~23):**
```typescript
connect(currentProjectId, window.location.origin + '/api');
```

**Issue:** This creates URL like `ws://localhost:3000/api/ws/{id}` but backend route is `/ws/{id}`

**Fix to:**
```typescript
connect(currentProjectId, window.location.origin);
```

**Why:** The Vite proxy forwards `/api` to `http://localhost:8000`, but WebSocket routes don't use the `/api` prefix. The websocket.ts file correctly constructs the URL as `${baseUrl}/ws/${projectId}`, so we shouldn't add `/api` to the base.

**Verification:**
1. Start backend and frontend
2. Open browser DevTools → Network → WS
3. Check WebSocket connection URL
4. Should be: `ws://localhost:8000/ws/{project_id}` or `ws://localhost:3000/ws/{project_id}` (proxied)

**Acceptance:** WebSocket connects successfully without URL errors

---

### Task 4: Add Analysis navigation to Sidebar

**File:** `frontend3/components/Sidebar.tsx`

**Current navItems array (around line 15):**
```typescript
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'library', label: 'Library', icon: 'book' },
  { id: 'files', label: 'Files', icon: 'folder' },
  // ... existing items
];
```

**Add Analysis item:**
```typescript
{ id: 'analysis', label: 'Analysis', icon: 'code' },
```

**Location:** Add after 'files' item (maintains logical flow)

---

### Task 5: Add Memory navigation to Sidebar

**File:** `frontend3/components/Sidebar.tsx`

**Add Memory item:**
```typescript
{ id: 'memory', label: 'Memory', icon: 'psychology' },
```

**Location:** Add after 'analysis' item

**Icon notes:** Material Symbols Outlined has `psychology` icon for memory/brain

---

### Task 6: Add View enum entries for new nav items

**File:** `frontend3/types.ts` (or where View enum is defined)

**Current View enum:**
```typescript
enum View {
  DASHBOARD = 'dashboard',
  FILES = 'files',
  LIBRARY = 'library',
  EDITOR = 'editor',
  // ...
}
```

**Add:**
```typescript
ANALYSIS = 'analysis',
MEMORY = 'memory',
```

---

### Task 7: Wire Analysis and Memory views in App.tsx

**File:** `frontend3/App.tsx`

**Current imports (around line 5-7):**
```typescript
import Sidebar from './components/Sidebar';
import DashboardView from './pages/DashboardView';
// ... other view imports
```

**Add imports:**
```typescript
import AnalysisView from './pages/AnalysisView';
import MemoryView from './pages/MemoryView';
```

**Add to renderView switch (around line 40-60):**
```typescript
case 'analysis':
  return <AnalysisView />;
case 'memory':
  return <MemoryView />;
```

---

## Success Metrics

| Metric | Before | After | Status |
|--------|--------|-------|--------|
| run-all.sh uses frontend3 | ❌ Uses frontend/ | ✅ Uses frontend3/ | |
| npm command for frontend | ❌ npm start | ✅ npm run dev | |
| Logs have timestamps | ❌ No timestamps | ✅ [HH:MM:SS] format | |
| WebSocket URL | ⚠️ /api/ws/{id} | ✅ /ws/{id} | |
| Analysis in Sidebar | ❌ Not visible | ✅ Nav button present | |
| Memory in Sidebar | ❌ Not visible | ✅ Nav button present | |

---

## Deviations from Plan

If any deviations occur during execution, document them here:

| Expected | Actual | Reason |
|----------|--------|--------|
| | | |

---

## Duration Estimate

| Task | Estimate |
|------|----------|
| Task 1: Update run-all.sh | 15 min |
| Task 2: Update other scripts | 10 min |
| Task 3: Fix WebSocket URL | 5 min |
| Task 4-5: Add nav items | 10 min |
| Task 6: Update View enum | 5 min |
| Task 7: Wire views in App.tsx | 10 min |

**Total:** ~55 minutes

---

## Dependencies

- Requires Phase 14 completion (ESLint clean, error boundaries working)
- Requires AnalysisView.tsx and MemoryView.tsx to exist (✅ they do, from Phase 12)

---

## User Notes

**User request from audit:**
> "I also want you to set up the run all script so that we can have detailed logging during build/compiling, and during running, on both frontend and backend."

This phase addresses that request by adding:
- Timestamps on all log messages
- Clear component labels ([BACKEND], [FRONTEND])
- PID tracking for both processes
- Port confirmation messages
- Color-coded output (if implemented)

---

**Phase: 15-startup-fixes**
**Created:** 2026-02-07
**Status:** Ready for planning (/gsd:plan-phase 15)
