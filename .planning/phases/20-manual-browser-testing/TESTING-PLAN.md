# Phase 20-01: Systematic Testing Plan

**Status:** In Progress
**Date:** 2026-02-08

---

## Backend Endpoints Confirmed ✅

All necessary backend endpoints exist:
- ✅ `/api/projects` - Projects CRUD
- ✅ `/api/files/projects/{project_id}/files/upload` - File upload
- ✅ `/api/files/{file_id}/download` - File download
- ✅ `/api/files/{file_id}/content` - File content
- ✅ `/api/documents/{document_id}` - Document CRUD
- ✅ `/api/literature/search` - Literature search
- ✅ `/api/chat` - AI Chat
- ✅ `/api/analysis/projects/{project_id}/execute` - Code execution
- ✅ `/api/documents/{document_id}/export/pdf` - PDF export
- ✅ `/api/documents/{document_id}/export/docx` - DOCX export
- ✅ `/api/documents/{document_id}/bibliography` - Bibliography generation
- ✅ `/api/memory/projects/{project_id}/claims/search` - Memory search

---

## Test Flows to Complete

### Flow 1: Create New Project ✅ FIXED
- [x] Create project with output_type 'research_paper'
- [x] Verify project appears in dashboard
- **Status:** FIXED (commit 69370eb)

### Flow 2: File Upload/Download ⏳ IN PROGRESS
- [ ] Test file upload (PDF, DOCX, etc.)
- [ ] Test file download (just added)
- [ ] Verify files appear in list
- **Backend:** `/api/files/projects/{project_id}/files/upload`, `/api/files/{file_id}/download`
- **Frontend:** `FilesView.tsx`, `fileApi.upload()`, `fileApi.download()`

### Flow 3: Write and Format Text (TipTap Editor)
- [ ] Create/open document in Editor
- [ ] Test formatting (bold, italic, underline, link, blockquote, list)
- [ ] Test auto-save (4-second debounce)
- **Backend:** `/api/documents/{document_id}`
- **Frontend:** `EditorView.tsx`

### Flow 4: Insert Citations & Generate Bibliography
- [ ] Test citation search modal
- [ ] Insert citation into document
- [ ] Generate bibliography (APA, MLA, Chicago)
- **Backend:** `/api/literature/search`, `/api/documents/{document_id}/bibliography`
- **Frontend:** `EditorView.tsx`, `Bibliography.tsx`

### Flow 5: Search Literature & Import Papers
- [ ] Search for papers
- [ ] View paper details
- [ ] Open PDF (if available)
- **Backend:** `/api/literature/search`
- **Frontend:** `LibraryView.tsx`

### Flow 6: Execute Data Analysis & View Results
- [ ] Select project (required for analysis)
- [ ] Write Python/R code
- [ ] Execute code
- [ ] View results (stdout, stderr, execution time)
- **Backend:** `/api/analysis/projects/{project_id}/execute`
- **Frontend:** `AnalysisView.tsx`

### Flow 7: Export Documents to PDF and DOCX
- [ ] Create document with content
- [ ] Export to PDF
- [ ] Export to DOCX
- **Backend:** `/api/documents/{document_id}/export/pdf`, `/api/documents/{document_id}/export/docx`
- **Frontend:** `EditorView.tsx`

### Flow 8: Chat with AI Assistant (All Agent Types)
- [ ] Test 'document' agent
- [ ] Test 'literature' agent
- [ ] Test 'memory' agent
- [ ] Test 'general' agent
- **Backend:** `/api/chat`
- **Frontend:** `EditorView.tsx`

### Flow 9: WebSocket Status ⚠️ DISABLED
- [x] WebSocket disabled due to connection issues
- **Status:** Disabled in App.tsx (setEnabled(false))
- **Future work:** Fix backend WebSocket endpoint

### Flow 10: Auto-Save Functionality
- [ ] Create document
- [ ] Make changes
- [ ] Verify auto-save indicator changes
- [ ] Verify content persists after refresh
- **Backend:** `/api/documents/{document_id}`
- **Frontend:** `EditorView.tsx` (4-second debounce)

---

## Known Issues

### P0 - Critical
1. **WebSocket disabled** - Real-time features not functional
   - File: `frontend3/App.tsx`
   - Impact: No live status updates, no task progress
   - Fix needed: Backend WebSocket endpoint

### P1 - High
1. **Auto-save not tested** - Need to verify it works
2. **Export functionality not tested** - Need to verify Pandoc is working

### P2 - Medium
1. **Project creation UX** - Doesn't navigate to editor after creation
2. **Monaco Editor** - Need to verify component loads correctly

---

## Testing Order

1. **Flow 2** - File Upload/Download (currently working on)
2. **Flow 3** - Write and Format Text (basic editor)
3. **Flow 10** - Auto-Save (depends on Flow 3)
4. **Flow 4** - Insert Citations (depends on editor)
5. **Flow 5** - Search Literature (independent)
6. **Flow 8** - AI Chat (independent)
7. **Flow 6** - Data Analysis (independent)
8. **Flow 7** - Export Documents (depends on editor)

---

## Instructions for Each Flow

For each flow:
1. Navigate to the view
2. Perform the action
3. Check browser console for errors
4. Verify the expected result
5. Report any issues found

**Console check:** Open DevTools (F12) → Console tab → Look for red errors

**Network check:** Open DevTools → Network tab → Look for failed requests (red)
