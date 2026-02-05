---
phase: 05-literature
plan: 03
subsystem: Citation Integration
tags: [citations, literature, editor, frontend, backend]
completion_date: 2026-02-05

# Dependency Graph
requires:
  - phase: "05-literature"
    plan: "01"
    description: "Literature Search & Unpaywall Integration"
    reason: "Requires literature search API and paper metadata structure"
provides:
  - component: "Literature search citation integration"
    description: "Users can search literature and insert formatted citations directly into documents"
  - component: "Citation formatting API"
    description: "Backend endpoint for formatting literature search papers in APA/MLA/Chicago"
affects:
  - phase: "05-literature"
    plans: ["05-02"]
    reason: "Citation picker integration needed for paper management workflows"

# Tech Stack
tech-stack:
  added: []
  patterns:
    - "Citation formatting service reuse"
    - "Multi-style citation generation"
    - "Debounced search UX pattern"
    - "Loading state management for async operations"

# Key Files
key-files:
  created:
    - path: "backend/citation_api.py"
      description: "Citation formatting endpoints for literature papers"
      lines: 133
  modified:
    - path: "backend/server.py"
      description: "Registered citation router"
      changes: "Added citation_router import and include_router call"
    - path: "frontend/src/components/editor/CitationPicker.jsx"
      description: "Added Literature Search tab for direct citation insertion"
      changes: "New tab with search, results list, and insert functionality"
    - path: "frontend/src/components/literature/LiteratureSearch.jsx"
      description: "Added Insert Citation button for documents"
      changes: "New button, handleInsertCitation function, loading states"

# Objective
Integrate literature search with document editor for automatic citation formatting and insertion.

# Summary
Built seamless integration between literature search results and document citations. Users can now search academic papers from Semantic Scholar and arXiv, then insert properly formatted citations directly into their documents without manual data entry.

## Implementation Details

### Task 1: Literature Search Tab in Citation Picker
Added third tab "Literature Search" to CitationPicker component:
- Real-time search of Semantic Scholar and arXiv databases
- 300ms debounced search to reduce API calls
- Results show title, authors, year, PDF availability
- Insert button formats citation in current document style
- Reordered tabs to prioritize Literature Search

### Task 2: Citation Formatting API Endpoint
Created `/api/citations/format-paper` endpoint in `backend/citation_api.py`:
- Accepts paper metadata (title, authors, year, venue, DOI, URL, source)
- Returns formatted citations in APA, MLA, and Chicago styles
- Validates required fields (title, authors)
- Handles arXiv preprints specially (adds "arXiv preprint" as venue)
- Reuses existing CitationService formatting methods

### Task 3: Insert Citation Button in LiteratureSearch
Added "Insert Citation" button to literature search results:
- Only shows when document is open in workspace
- Formats citation using backend API
- Displays loading state while formatting
- Shows success toast after insertion
- Validates document context before attempting insertion

## Deviations from Plan

### None
Plan executed exactly as written. No bugs, missing functionality, or blocking issues encountered.

## Verification

All verification criteria met:
- [x] Citation picker shows Literature Search tab with results
- [x] Literature search papers can be inserted as citations
- [x] Citations format correctly in APA, MLA, and Chicago styles
- [x] Insert Citation button in LiteratureSearch works
- [x] Integration flow: search paper → insert citation → formatted in document

## Success Criteria
- [x] All tasks completed (3/3)
- [x] Literature search integrates seamlessly with citation system
- [x] Citations auto-format in all three styles (APA, MLA, Chicago)
- [x] Users can insert papers from search into documents
- [x] Bibliography includes literature search citations correctly (via existing system)

## Next Phase Readiness
This plan completes the citation integration for literature search. The system is ready for:
- Paper management workflows (Plan 05-02)
- Enhanced citation features
- Bibliography generation improvements

No blockers or concerns identified.
