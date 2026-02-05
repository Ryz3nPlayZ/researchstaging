# Requirements: Research Workspace

**Defined:** 2025-02-01
**Core Value:** Stateful research intelligence — Single workspace where AI agent remembers everything important (all chats, analyses, documents, file contents) and uses that context to provide genuinely helpful research assistance.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & User Management

- [ ] **AUTH-01**: User can sign in with Google OAuth
- [ ] **AUTH-02**: User account is automatically created on first OAuth login
- [ ] **AUTH-03**: User can sign out
- [ ] **AUTH-04**: User session persists across browser refresh

### Document Editor

- [ ] **EDIT-01**: User can write and format text with bold, italic, underline
- [ ] **EDIT-02**: User can create headings (multiple levels)
- [ ] **EDIT-03**: User can create lists (bulleted and numbered)
- [ ] **EDIT-04**: User can create block quotes
- [ ] **EDIT-05**: User can create and edit tables
- [ ] **EDIT-06**: User can insert citations in-text
- [ ] **EDIT-07**: User can edit citation details
- [ ] **EDIT-08**: System auto-formats citations in APA style
- [ ] **EDIT-09**: System auto-formats citations in MLA style
- [ ] **EDIT-10**: System auto-formats citations in Chicago style
- [ ] **EDIT-11**: System auto-generates bibliography from document citations
- [ ] **EDIT-12**: User can view previous versions of document
- [ ] **EDIT-13**: User can restore document to previous version
- [ ] **EDIT-14**: System auto-saves document content every 2-5 seconds during typing with debouncing to reduce server load
- [ ] **EDIT-15**: Editor typing response time is <100ms for keystrokes (performance optimized to target <16ms for optimal user experience)

### AI Agent & Sidebar Chat

- [x] **AI-01**: User sees persistent sidebar panel for AI interaction
- [x] **AI-02**: User can send chat messages to AI agent
- [x] **AI-03**: AI agent has read access to current document content
- [x] **AI-04**: AI agent has read access to analysis results
- [x] **AI-05**: AI agent has read access to stored claims and findings
- [x] **AI-06**: AI agent has read access to user preferences
- [x] **AI-07**: AI agent can refine text directly (simple changes like "make this sentence more formal")
- [x] **AI-08**: AI agent presents plan for complex actions before execution
- [x] **AI-09**: User can approve or reject AI-proposed plans
- [x] **AI-10**: AI agent executes plan only after user approval

### Memory & Information Graph

- [x] **MEM-01**: System stores claims extracted from literature
- [x] **MEM-02**: System stores findings from data analyses
- [x] **MEM-03**: System stores user preferences
- [x] **MEM-04**: System prioritizes storage of claims relevant to user's research project
- [x] **MEM-05**: System tracks relationships between claims (association, correlation, causality, prerequisite)
- [x] **MEM-06**: Backend provides graph data model for papers, data sources, and information

### Literature Review & Search

- [x] **LIT-01**: AI agent can search for papers via Semantic Scholar API
- [x] **LIT-02**: AI agent uses Unpaywall to find open-access PDFs
- [x] **LIT-03**: System prioritizes papers with full PDF access in search results
- [x] **LIT-04**: AI agent extracts key claims and statements from papers
- [x] **LIT-05**: AI agent saves extracted claims to memory
- [x] **LIT-06**: System auto-formats citations during literature review
- [x] **LIT-07**: User can upload PDF files to project

### Data Analysis

- [ ] **ANA-01**: AI agent can generate R code for data analysis
- [ ] **ANA-02**: AI agent can generate Python code for data analysis
- [ ] **ANA-03**: System executes code in sandboxed cloud environment
- [ ] **ANA-04**: System displays analysis results as tables
- [ ] **ANA-05**: System displays analysis results as charts
- [ ] **ANA-06**: System displays analysis results as visualizations
- [ ] **ANA-07**: User can download analysis results
- [ ] **ANA-08**: User can view and edit AI-generated code before execution
- [ ] **ANA-09**: System saves analysis results to memory for future access

### File & Project Management

- [ ] **FILE-01**: User can upload files via drag-and-drop
- [ ] **FILE-02**: User can create nested folder structure
- [ ] **FILE-03**: System supports PDF file uploads
- [ ] **FILE-04**: System supports DOCX file uploads
- [ ] **FILE-05**: System supports Markdown file uploads
- [ ] **FILE-06**: System supports Python file uploads
- [ ] **FILE-07**: System supports R file uploads
- [ ] **FILE-08**: System supports JavaScript file uploads
- [ ] **FILE-09**: System supports CSV file uploads
- [ ] **FILE-10**: System supports Excel file uploads
- [ ] **FILE-11**: Files are stored in cloud-based project workspace

### Document Export

- [ ] **EXP-01**: User can export document as PDF
- [ ] **EXP-02**: User can export document as DOCX

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Information Graph UI

- **GRAPH-01**: User can visualize information graph with nodes and edges
- **GRAPH-02**: User can see claim relationships visually (association, correlation, causality, prerequisite)
- **GRAPH-03**: User can click nodes to view related claims and sources

### Advanced Literature Analysis

- **LIT-V2-01**: AI agent detects contradictions across papers
- **LIT-V2-02**: AI agent identifies patterns across literature (e.g., temporal trends, geographic variations)
- **LIT-V2-03**: AI agent performs advanced literature pattern analysis

### Enhanced AI Transparency

- **AI-V2-01**: User can see which agent is handling each task
- **AI-V2-02**: User can view agent orchestration workflow

### Enhanced File Organization

- **FILE-V2-01**: User can link files via graph relationships
- **FILE-V2-02**: User can navigate file connections visually

### Additional Export Formats

- **EXP-V2-01**: User can export document as LaTeX
- **EXP-V2-02**: User can export document as HTML
- **EXP-V2-03**: User can export document as Markdown

### Peer Review Emulation

- **PEER-01**: AI agent evaluates paper against literature
- **PEER-02**: AI agent identifies potential weaknesses in arguments
- **PEER-03**: AI agent suggests missing citations or references

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Multi-user collaboration | Single-user MVP, defer to v2+ |
| Real-time co-editing | Single-user MVP, defer to v2+ |
| Advanced permissions | Single-user MVP, defer to v2+ |
| Custom agent builders | MVP-lite orchestration only |
| Full DAG/agent graph visualization UI | Backend only in v1, UI deferred to v2 |
| Heavy infrastructure cost items | Defer until validated user willingness to pay |

## Traceability

Which phases cover which requirements. Updated by create-roadmap.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| FILE-01 | Phase 2 | Complete |
| FILE-02 | Phase 2 | Complete |
| FILE-03 | Phase 2 | Complete |
| FILE-04 | Phase 2 | Complete |
| FILE-05 | Phase 2 | Complete |
| FILE-06 | Phase 2 | Complete |
| FILE-07 | Phase 2 | Complete |
| FILE-08 | Phase 2 | Complete |
| FILE-09 | Phase 2 | Complete |
| FILE-10 | Phase 2 | Complete |
| FILE-11 | Phase 2 | Complete |
| MEM-01 | Phase 3 | Pending |
| MEM-02 | Phase 3 | Pending |
| MEM-03 | Phase 3 | Pending |
| MEM-04 | Phase 3 | Pending |
| MEM-05 | Phase 3 | Pending |
| MEM-06 | Phase 3 | Pending |
| EDIT-01 | Phase 4 | Pending |
| EDIT-02 | Phase 4 | Pending |
| EDIT-03 | Phase 4 | Pending |
| EDIT-04 | Phase 4 | Pending |
| EDIT-05 | Phase 4 | Pending |
| EDIT-06 | Phase 4 | Pending |
| EDIT-07 | Phase 4 | Pending |
| EDIT-08 | Phase 4 | Pending |
| EDIT-09 | Phase 4 | Pending |
| EDIT-10 | Phase 4 | Pending |
| EDIT-11 | Phase 4 | Pending |
| EDIT-12 | Phase 4 | Pending |
| EDIT-13 | Phase 4 | Pending |
| EDIT-14 | Phase 4 | Pending |
| EDIT-15 | Phase 4 | Pending |
| LIT-01 | Phase 5 | Complete |
| LIT-02 | Phase 5 | Complete |
| LIT-03 | Phase 5 | Complete |
| LIT-04 | Phase 5 | Complete |
| LIT-05 | Phase 5 | Complete |
| LIT-06 | Phase 5 | Complete |
| LIT-07 | Phase 5 | Complete |
| AI-01 | Phase 6 | Complete |
| AI-02 | Phase 6 | Complete |
| AI-03 | Phase 6 | Complete |
| AI-04 | Phase 6 | Complete |
| AI-05 | Phase 6 | Complete |
| AI-06 | Phase 6 | Complete |
| AI-07 | Phase 6 | Complete |
| AI-08 | Phase 6 | Complete |
| AI-09 | Phase 6 | Complete |
| AI-10 | Phase 6 | Complete |
| ANA-01 | Phase 7 | Pending |
| ANA-02 | Phase 7 | Pending |
| ANA-03 | Phase 7 | Pending |
| ANA-04 | Phase 7 | Pending |
| ANA-05 | Phase 7 | Pending |
| ANA-06 | Phase 7 | Pending |
| ANA-07 | Phase 7 | Pending |
| ANA-08 | Phase 7 | Pending |
| ANA-09 | Phase 7 | Pending |
| EXP-01 | Phase 8 | Pending |
| EXP-02 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 64 total
- Mapped to phases: 64
- Unmapped: 0 ✓

---
*Requirements defined: 2025-02-01*
*Last updated: 2025-02-01 after roadmap creation*
