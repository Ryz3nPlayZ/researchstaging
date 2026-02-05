# Agent Team Delegation Plan
**Project:** Research Pilot - Phase 4: Rich Text Document Editor
**Date:** 2026-02-04
**Status:** Phase 4 Partially Complete, Delegating for Completion

---

## Executive Summary

Phase 4 (Rich Text Document Editor) has 3 waves of implementation. Wave 1 is complete. Waves 2-3 have code complete but need verification and fixes. **Critical issue:** File content loading doesn't work - MD/DOCX files open blank editor instead of showing file content.

**Claude (Sonnet 4.5)** is nearing usage limits and delegating remaining work to: **Copilot, Antigravity, Jules**

---

## Current Progress

### Completed (Wave 1)
| Plan | Name | Status | Summary |
|------|------|--------|---------|
| 04-01 | Document Backend | ✅ COMPLETE | Document/DocumentVersion models, CRUD API, migration |
| 04-02 | TipTap Editor | ✅ COMPLETE | DocumentEditor component, toolbar, auto-save |
| 04-03 | Citation Backend | ✅ COMPLETE | DocumentCitation model, CitationService, API endpoints |

### Code Complete, Needs Verification (Waves 2-3)
| Plan | Name | Status | Issues Found |
|------|------|--------|--------------|
| 04-04 | Version History | ⏸️ VERIFY | Code complete, needs testing |
| 04-05 | Citation UI | ⏸️ VERIFY | Code complete, bibliography path fixed, needs testing |
| 04-06 | AI Text Assistance | ⏸️ VERIFY | Code complete, needs LLM API key + testing |

### Bugs Fixed So Far
- ✅ Router prefix issue (duplicate `/api` prefix)
- ✅ Citation style case issue (APA → apa)
- ✅ Duplicate History extension (removed from TipTap config)
- ✅ Bibliography API path (added `/memory` prefix)

### Known Critical Issues
- ❌ **File content loading broken**: Opening `.md` or `.docx` files creates blank document instead of loading file content
- ⚠️ ESLint warnings in AIAssistant.jsx, Bibliography.jsx, CitationPicker.jsx (React Hook dependencies)

---

## Task Delegations

### Task 1: Fix File Content Loading (CRITICAL - BLOCKING)

**Assigned to:** Antigravity or Jules
**Priority:** P0 - Blocking basic functionality

**Problem:** Opening `.md` or `.docx` files creates blank document instead of loading file content

**Files:**
- `frontend/src/components/layout/Workspace.jsx` (line 194-247)
- `frontend/src/lib/api.js` (documentsApi section)
- May need new backend endpoint in `backend/file_api.py`

**Steps:**
1. Add endpoint to read file content: `GET /api/files/files/{id}/content`
2. Convert content to TipTap JSON (Markdown → TipTap, DOCX → TipTap)
3. Update Workspace.jsx to load file content when creating document

**TipTap JSON Format:**
```json
{
  "type": "doc",
  "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Hello"}]}]
}
```

---

### Task 2: Test Citation System (P1)

**Assigned to:** Copilot or Jules
**Files:** CitationPicker.jsx, Bibliography.jsx, memory_api.py, citation_service.py

**Test:**
1. Insert citation from memory search
2. Insert manual citation
3. Switch styles (APA/MLA/Chicago)
4. Verify bibliography generates

---

### Task 3: Test Version History (P1)

**Assigned to:** Copilot or Antigravity
**Files:** VersionHistory.jsx, document_api.py

**Test:**
1. Create multiple versions
2. View version list
3. View diff between versions
4. Restore to previous version
5. Verify audit trail

---

### Task 4: Test AI Text Assistance (P2)

**Assigned to:** Any agent
**Prerequisite:** LLM API key in backend/.env
**Files:** AIAssistant.jsx, document_api.py

**Test:**
1. Rewrite text in different tones
2. Check grammar
3. Verify suggestions display

---

### Task 5: Fix ESLint Warnings (P2)

**Assigned to:** Any agent
**Files:** AIAssistant.jsx, Bibliography.jsx, CitationPicker.jsx

**Fix React Hook dependency warnings:**
- AIAssistant.jsx:72 - missing 'handleClose'
- AIAssistant.jsx:219 - missing 'handleClose'
- Bibliography.jsx:78 - missing 'fetchBibliography'
- CitationPicker.jsx:141 - missing 'handleSearch'

---

## Instructions

1. **Read:** agentteam.md + relevant PLAN.md files
2. **Work:** Complete assigned tasks in priority order (P0 → P1 → P2)
3. **Document:** Write results in agentteam.md
4. **Commit:** Use clear commit messages
5. **Handoff:** Update agentteam.md if passing to another agent

---

## Success Criteria

Phase 4 complete when:
- ✅ File content loading works (P0)
- ✅ Citation system tested (P1)
- ✅ Version history tested (P1)
- ✅ ESLint build clean (P2)
- ✅ All 6 plans have SUMMARY.md files

---

**Last updated:** 2026-02-04 by Claude (Sonnet 4.5)
**Status:** File content loading is critical blocker - delegate to Antigravity or Jules first
