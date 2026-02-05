# Phase 4 Context: Rich Text Document Editor

**Status:** Context gathered
**Created:** 2026-02-04
**Phase:** 04 - Rich Text Document Editor

## Overview

**Goal:** Users can write research papers with citations, formatting, and version history

**Dependencies:**
- Phase 3 (Memory & Information Graph Backend) - provides claim/paper storage for citation management
- Existing LLM service (from backend/llm_service.py) - for AI-assisted writing

## Vision

### Core Experience
**Academic-focused document editor** integrated into the Research Workspace, optimized for academic writing with:
- Google Docs-style rich text editing in the Workspace panel
- Citation management linked to Phase 3 memory backend (papers, claims)
- Full version history with audit trail
- Auto-save with debouncing
- AI-assisted writing (rewrite, grammar check) using existing LLM service

### User Answers Summary

**Question 1: How do you imagine the document editor working in the research workflow?**
- **Answer:** Academic-focused - Google Docs-style editor integrated into Workspace panel, optimized for academic writing with citation management from the memory backend (claims, papers we already have)

**Question 2: How should users insert citations into documents?**
- **Answer:** Both options - Support both memory-based citations (from Phase 3) and manual entry for maximum flexibility

**Question 3: What matters most for version history?**
- **Answer:** Full audit trail - Track every significant change with timestamps, diff view between versions, branching support

**Question 4: Where should the document editor live in the UI?**
- **Answer:** Documents should go in the File Explorer (user noted: "right now, we have both a navigator and file manager, with the file manager appearing in 2 ways, and the UI for it is really clunky. we eventually need to unify everything.")

**Question 5: Is real-time collaboration needed in v1?**
- **Answer:** Single user - Single-user only for v1 (simpler, no websocket conflicts), real-time collaboration can be v2 feature

**Question 6: When should AI-assisted writing features be added?**
- **Answer:** Basic AI now - Build basic AI text assistance (rewrite, grammar check) in this phase using existing LLM service, Phase 6 adds sidebar chat UI

**Question 7: What format should documents be stored in?**
- **Answer:** JSON is the main - JSON (TipTap default), option to export as markdown, markdown is easier for LLMs to process in some cases. JSON for now though.

**Question 8: How should auto-save work?**
- **Answer:** Debounced (3-5s) - Debounced auto-save: save 3-5 seconds after last keystroke (reduces server load while preventing data loss)

**Question 9: What's the target for typing response time?**
- **Answer:** Target <16ms (optimal) - Optimize for <16ms (60fps) with advanced techniques like virtualization, shadow DOM

## Key Decisions

### Document Editor
- **Framework:** TipTap editor (ProseMirror-based, React-friendly, extensible)
- **Location:** Integrated into File Explorer - documents are files that open in Workspace panel
- **Scope:** Single-user only for v1 (real-time collaboration deferred to v2)
- **Storage:** TipTap JSON format for editing, MD export option for LLM processing

### Citation Management
- **Dual-mode:** Support both (1) citations from stored papers/claims (Phase 3) and (2) manual entry
- **Formats:** APA, MLA, Chicago (EDIT-08, EDIT-09, EDIT-10)
- **Bibliography:** Auto-generate from document citations (EDIT-11)

### Version History
- **Full audit trail:** Every significant change tracked with timestamp
- **Diff view:** Show changes between versions
- **Branching:** Support version branching (full-featured, not just snapshots)

### Auto-save
- **Strategy:** Debounced auto-save (3-5 seconds after last keystroke)
- **Backup:** Browser localStorage as immediate backup
- **Conflict:** Single-user only v1 (no collaboration conflicts)

### Performance
- **Target:** <16ms typing response time (60fps target - very ambitious)
- **Techniques:** Incremental updates, local-first architecture, virtualization, shadow DOM

### AI Features
- **Implemented now:** Basic AI text assistance (rewrite, grammar check) using existing LLM service
- **Deferred to Phase 6:** Sidebar chat UI for AI interaction
- **Integration:** AI has read access to document content for context-aware suggestions

## Technical Approach

### Editor Framework
**TipTap** (recommended):
- ProseMirror-based, well-maintained
- React-friendly components
- Extensible architecture (custom nodes, marks, extensions)
- Built-in collaboration support (can enable in v2)
- Good TypeScript support
- Active community and documentation

Alternatives considered:
- Slate.js (more flexible, but more complex)
- Quill (simpler, but less extensible)
- Draft.js (older, less maintained)

### Storage Architecture
```
documents table:
  - id (UUID, PK)
  - project_id (FK -> projects.id)
  - title (string)
  - content (JSONB) - TipTap document JSON
  - content_hash (string) - for change detection
  - citation_style (enum: APA, MLA, Chicago)
  - created_at (timestamp)
  - updated_at (timestamp)
  - created_by (FK -> users.id)

document_versions table:
  - id (UUID, PK)
  - document_id (FK -> documents.id)
  - content (JSONB) - TipTap document JSON snapshot
  - change_description (text, optional)
  - created_at (timestamp)
  - created_by (FK -> users.id)
  - parent_version_id (FK -> document_versions.id, nullable) - for branching
```

### Citation Storage
```
document_citations table:
  - id (UUID, PK)
  - document_id (FK -> documents.id)
  - citation_position (JSONB) - TipTap position in document
  - source_type (enum: paper, claim, manual)
  - source_id (string, nullable) - links to papers.id or claims.id
  - citation_data (JSONB) - formatted citation data
```

### Auto-save Implementation
```javascript
// Frontend debounced auto-save
const debouncedSave = debounce((content) => {
  // Save to server
  api.saveDocument(documentId, content);
  // Update localStorage backup
  localStorage.setItem(`doc-${documentId}`, JSON.stringify(content));
}, 4000); // 4 second debounce

// On every keystroke
editor.on('update', ({ editor }) => {
  const content = editor.getJSON();
  localStorage.setItem(`doc-${id}-draft`, JSON.stringify(content)); // Immediate backup
  debouncedSave(content); // Server save after debounce
});
```

### Performance Optimization
Target: <16ms typing response time

**Techniques:**
1. **Incremental updates:** Only send changed content to server, not full document
2. **Local-first:** Optimistic UI updates, sync to server in background
3. **Virtualization:** For very long documents, only render visible portion
4. **Shadow DOM:** Isolate editor rendering from main React tree
5. **Web Workers:** Offload heavy processing (diff, spell-check) to worker threads
6. **Debouncing:** Batch updates and auto-save
7. **Content Hash:** Only save if content actually changed (ignore cursor moves)

### AI Integration
Using existing `backend/llm_service.py`:

```python
# AI text assistance endpoints
POST /api/documents/{id}/ai/rewrite
- Request: { selection: string, tone: string }
- Response: { rewritten: string }

POST /api/documents/{id}/ai/grammar
- Request: { text: string }
- Response: { corrected: string, suggestions: [] }
```

**Implementation:**
- Text selection in editor → right-click → "Rewrite with AI"
- Modal with tone options (formal, casual, concise, elaborate)
- LLM service processes using GPT-4 or similar
- Replace selection with AI-generated text

## Open Questions / Assumptions

### Assumptions
1. **TipTap is the right choice** - Well-suited for academic writing, extensible
2. **<16ms target is achievable** - Requires advanced optimization techniques
3. **File Explorer UI will be improved** - User noted it's clunky, needs unification work
4. **Single-user mode is sufficient for v1** - Collaboration can wait for v2
5. **Basic AI features don't need Phase 6** - Can implement rewrite/grammar now using existing LLM service

### Questions to Resolve
1. **Citation insertion UI:** How does user select APA/MLA/Chicago? Global setting or per-document?
2. **Citation browser:** How to search/insert from stored papers? Autocomplete dropdown? Modal search?
3. **Version diff viewer:** Use existing library (diff-match-patch) or build custom?
4. **Branching UI:** How to create/merge branches in version history?
5. **AI feature scope:** Just rewrite/grammar, or also summarize/expand/translate?
6. **Document templates:** Should we provide academic paper templates (title, abstract, sections)?
7. **Export formats:** PDF/DOCX export planned for Phase 8, but is MD export needed in Phase 4?

## Requirements Coverage

From REQUIREMENTS.md EDIT-01 through EDIT-15:

- [x] **EDIT-01**: Bold, italic, underline formatting (TipTap built-in marks)
- [x] **EDIT-02**: Headings (TipTap built-in nodes)
- [x] **EDIT-03**: Lists (TipTap built-in nodes)
- [x] **EDIT-04**: Block quotes (TipTap built-in nodes)
- [x] **EDIT-05**: Tables (TipTap table extension)
- [ ] **EDIT-06**: Insert citations in-text (custom extension needed)
- [ ] **EDIT-07**: Edit citation details (custom UI needed)
- [ ] **EDIT-08**: APA format (citation formatting library)
- [ ] **EDIT-09**: MLA format (citation formatting library)
- [ ] **EDIT-10**: Chicago format (citation formatting library)
- [ ] **EDIT-11**: Auto-generate bibliography (scan document for citations)
- [ ] **EDIT-12**: View previous versions (version UI)
- [ ] **EDIT-13**: Restore to previous version (version UI)
- [ ] **EDIT-14**: Auto-save every 2-5 seconds (debounced auto-save)
- [ ] **EDIT-15**: <100ms response time (targeting <16ms)

## Next Steps

**Immediate:** `/gsd:research-phase 4` - Research technical implementation details
**Then:** `/gsd:plan-phase 4` - Create detailed execution plans

**Research topics:**
- TipTap editor setup and extensions
- Citation management libraries (citation.js, citeproc)
- Document versioning strategies
- Performance optimization for rich text editors
- AI text integration patterns

---

**Context gathered by:** Claude (gsd:discuss-phase workflow)
**Date:** 2026-02-04
