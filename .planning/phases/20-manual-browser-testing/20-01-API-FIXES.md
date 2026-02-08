# Phase 20-01: API Integration Issues Found

**Status:** In Progress
**Date:** 2026-02-08

## P0 - Critical API Issues Found

### 1. Literature Search 422 Error ✅ IDENTIFIED
**Error:** `GET /api/literature/search?q=hello&limit=20 422`

**Root Cause:** Frontend uses `q` parameter but backend expects `query`
- Frontend: `frontend3/lib/api.ts:335` uses `?q=${query}`
- Backend: `literature_api.py:75` expects `query: str = Query(..., min_length=2)`

**Fix Required:**
```typescript
// frontend3/lib/api.ts line 335-336
// Change:
apiRequest<Paper[]>(`/literature/search?q=${encodeURIComponent(query)}&limit=${limit}`)
// To:
apiRequest<Paper[]>(`/literature/search?query=${encodeURIComponent(query)}&limit=${limit}`)
```

---

### 2. Analysis Execute 404 Error ✅ IDENTIFIED
**Error:** `POST /api/analysis/projects/{id}/execute 404`

**Root Cause:** Backend router has double `/api` prefix
- Backend: `analysis_api.py:18` has `prefix="/api/analysis"`
- This becomes `/api/api/analysis/...` when included

**Fix Required:**
```python
# backend/analysis_api.py line 18
# Change:
router = APIRouter(prefix="/api/analysis", tags=["analysis"])
# To:
router = APIRouter(prefix="/analysis", tags=["analysis"])
```

---

### 3. Chat API 404 Error ✅ IDENTIFIED (Same Issue)
**Root Cause:** Backend router has double `/api` prefix
- Backend: `chat_api.py:21` has `prefix="/api/chat"`

**Fix Required:**
```python
# backend/chat_api.py line 21
# Change:
router = APIRouter(prefix="/api/chat", tags=["chat"])
# To:
router = APIRouter(prefix="/chat", tags=["chat"])
```

---

### 4. Bibliography 404 Error ✅ IDENTIFIED
**Error:** `GET /api/documents/{id}/bibliography?style=apa 404`

**Root Cause:** Wrong path in frontend
- Frontend: `frontend3/lib/api.ts:328-329` calls `/documents/${documentId}/bibliography`
- Backend: `memory_api.py:655` has `/memory/documents/{document_id}/bibliography`

**Fix Required:**
```typescript
// frontend3/lib/api.ts line 328-329
// Change:
`/documents/${documentId}/bibliography?style=${format}`
// To:
`/memory/documents/${documentId}/bibliography?style=${format}`
```

---

### 5. File Download "not found" ⏳ NEEDS INVESTIGATION
**Error:** Download returns "localhost:3000 says not found"

**Frontend code:** `frontend3/lib/api.ts:254`
```typescript
const response = await fetch(`${API_BASE}/files/${fileId}/download?disposition=attachment`);
```

**Backend endpoint:** `file_api.py` - Need to verify the download endpoint exists and is properly configured.

---

## P1 - High Priority UI/UX Issues

### Dashboard
- Filter button doesn't work
- Create project doesn't navigate to project
- Clicking on project doesn't enter project
- "New project" tile at end instead of beginning (UX)
- Grid/list view switch doesn't work
- 3-dot menu doesn't work

### Library
- Year, subject, citation, sort by buttons don't work
- Sidebar content doesn't make sense

### Analysis
- Code pane is too small (2.5x4.5 inches)

### Files
- Recent files are gone (database connection?)
- 3-dot menu doesn't work

### Editor
- Only accessible via "New Document" button in top bar (UX)
- Document shows placeholder text that needs manual deletion
- Top bar shows "offline" (WebSocket disabled)

### Top Bar
- Duplicate logos (sidebar + top bar)
- Search bar doesn't work
- Notification icon doesn't work
- Profile picture doesn't work

### Settings
- Shows same view as dashboard

---

## Fix Order

1. **Fix backend router prefixes** (analysis_api, chat_api) - Quick fixes
2. **Fix frontend API calls** (literature search, bibliography) - Quick fixes
3. **Investigate file download** - Need more info
4. **Fix project navigation** - Needs routing logic
5. **Fix filter buttons** - Needs implementation
6. **Fix UI sizing** - CSS fixes
