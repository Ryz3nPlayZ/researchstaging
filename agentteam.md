# AI Agent Team Collaboration

**Project:** Research Pilot (https://github.com/Ryz3nPlayZ/research)
**Orchestrator:** Claude Code (GSD-powered)
**Team Members:** Claude Code, Google Antigravity, GitHub Copilot, Google Jules
**Last Updated:** 2026-02-04

---

## Team Overview

We are a multi-AI team working on the Research Pilot project. Each AI agent operates independently with unique capabilities, coordinating through this document and the GitHub repository.

### Agent Roles

#### 1. Claude Code (Orchestrator) - ME
- **Capabilities:** GSD workflows, planning, execution coordination, full codebase access
- **Location:** This session, `agentteam.md` owner
- **Responsibilities:**
  - Overall project planning and roadmap management
  - Breaking down phases into executable plans
  - Coordinating task delegation to external agents
  - Managing git commits and repository state
  - Verification and gap analysis
  - Creating/maintaining planning files (PLAN.md, SUMMARY.md)

#### 2. Google Antigravity
- **Capabilities:** Powerful coding + **vision** + **browser automation**
- **Location:** External (Google's infrastructure)
- **Strengths:**
  - Can see and interact with UI like a human user
  - Can run browser tests and verify functionality
  - Can take screenshots and analyze visual issues
  - Strong coding capabilities for frontend/backend
- **Best For:**
  - UI testing and verification
  - Visual regression testing
  - End-to-end testing with browser automation
  - Screenshot-based bug analysis
  - Frontend styling and layout fixes

#### 3. GitHub Copilot
- **Capabilities:** Advanced coding models, GitHub integration
- **Location:** GitHub Code Suggestions/Chat
- **Strengths:**
  - Strong code completion and generation
  - Good at refactoring and code improvements
  - Familiar with many codebases and patterns
  - Can suggest fixes for common issues
- **Best For:**
  - Code refactoring and optimization
  - Bug fixes and patches
  - Implementing standard patterns
  - Code review suggestions
  - Writing boilerplate and tests

#### 4. Google Jules
- **Capabilities:** Autonomous task execution, direct GitHub access
- **Location:** Separate computer (independent "employee")
- **Strengths:**
  - Takes a task, works independently, commits to GitHub
  - Can work on entire features end-to-end
  - Operates autonomously without supervision
  - Direct repository access
- **Best For:**
  - Complete feature implementation
  - Multi-file tasks that need coordination
  - Independent work on isolated features
  - Tasks that need full ownership

---

## Repository Information

**GitHub:** https://github.com/Ryz3nPlayZ/research.git
**Local Path:** /home/zemul/Programming/research
**Remote:** origin

### Setup for External Agents

All agents should:
1. Clone repository: `git clone https://github.com/Ryz3nPlayZ/research.git`
2. Read `agentteam.md` for context
3. Check assigned tasks in "Current Work" section
4. Create branches for their work: `git checkout -b agent/NAME/task-description`
5. Commit with clear messages: `[AGENT NAME] task-description`
6. Push and create pull requests for review

---

## Current Project Status

### Phase: 04 - Rich Text Document Editor

**Status:** Wave 1 COMPLETE, Waves 2-3 Code Complete Need Verification

#### Completed (Wave 1)
- ✅ 04-01: Document Backend (models, API, migration)
- ✅ 04-02: TipTap Editor (component, toolbar, auto-save)
- ✅ 04-03: Citation Backend (model, service, endpoints)

#### Code Complete, Need Testing (Waves 2-3)
- ⏸️ 04-04: Version History (code ready, needs testing)
- ⏸️ 04-05: Citation UI (code ready, needs testing)
- ⏸️ 04-06: AI Text Assistance (code ready, needs testing)

#### Critical Bugs
- ❌ **File content loading broken** - Opening `.md`/`.docx` files shows blank editor instead of file content
- ⚠️ ESLint warnings in AIAssistant.jsx, Bibliography.jsx, CitationPicker.jsx

---

## Current Work - Task Assignments

### Task 1: Fix File Content Loading (P0 - CRITICAL)
**Assigned to:** Google Jules (autonomous feature work)
**Priority:** BLOCKING - Must fix first

**Problem:** When users open `.md` or `.docx` files from File Explorer, the editor opens blank instead of showing file content.

**What needs to be done:**
1. Add backend endpoint to read file content: `GET /api/files/files/{id}/content`
2. Convert file content to TipTap JSON format:
   - For `.md` files: Parse markdown to TipTap JSON
   - For `.docx` files: Extract text and convert to TipTap JSON
3. Update `Workspace.jsx` to load file content when creating documents

**TipTap JSON Format Example:**
```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Hello from file!"}]
    }
  ]
}
```

**Files to modify:**
- `backend/file_api.py` - Add content endpoint
- `frontend/src/components/layout/Workspace.jsx` (lines 194-247) - Load content
- `frontend/src/lib/api.js` - Add client function

**Success criteria:** Opening a `.md` or `.docx` file shows its content in the editor, not a blank page.

**Branch:** `agent/jules/fix-file-content-loading`

---

### Task 2: UI Testing & Verification (P1)
**Assigned to:** Google Antigravity (vision + browser testing)
**Priority:** HIGH - Verify Wave 2-3 features work

**What needs to be tested:**

1. **Version History Testing:**
   - Create a document
   - Make multiple edits (wait for auto-save)
   - Click History icon in toolbar
   - Verify version list displays correctly
   - Click a version to view diff
   - Test restore functionality
   - Take screenshots of each step
   - Report any visual bugs or UX issues

2. **Citation System Testing:**
   - Test "Insert Citation" button
   - Test memory search tab
   - Test manual entry tab
   - Verify citations insert as `[Author, Year]`
   - Test style switching (APA/MLA/Chicago)
   - Verify bibliography generates at bottom
   - Take screenshots showing the flow
   - Report any issues

3. **AI Assistant Testing** (if LLM key configured):
   - Select text, right-click
   - Test "Rewrite with AI" - all tones
   - Test "Check Grammar"
   - Verify suggestions display correctly
   - Report any UX issues

**What Antigravity should do:**
- Use browser automation to test the actual running app
- Take screenshots at key steps
- Write test results in `agentteam.md` under "### Test Results - Antigravity"
- Create GitHub issues for any bugs found
- If comfortable, fix simple UI bugs directly

**Branch:** `agent/antigravity/ui-testing`

---

### Task 3: ESLint Warning Fixes (P2)
**Assigned to:** GitHub Copilot
**Priority:** MEDIUM - Code quality

**ESLint Warnings to Fix:**
```
frontend/src/components/editor/AIAssistant.jsx
  Line 72:6:   React Hook useCallback has missing dependency: 'handleClose'
  Line 219:6:  React Hook useCallback has missing dependency: 'handleClose'

frontend/src/components/editor/Bibliography.jsx
  Line 78:6:  React Hook useEffect has missing dependency: 'fetchBibliography'

frontend/src/components/editor/CitationPicker.jsx
  Line 141:6:  React Hook useEffect has missing dependency: 'handleSearch'
```

**What needs to be done:**
1. Fix each warning by either:
   - Adding missing dependencies to arrays
   - Using `// eslint-disable-next-line react-hooks/exhaustive-deps` with explanation
   - Refactoring to avoid dependency issues

2. Verify fixes: `cd frontend && npm run build` (should complete without warnings)

3. Commit changes with clear message

**Files:**
- `frontend/src/components/editor/AIAssistant.jsx`
- `frontend/src/components/editor/Bibliography.jsx`
- `frontend/src/components/editor/CitationPicker.jsx`

**Branch:** `agent/copilot/eslint-fixes`

---

## Communication Protocol

### How We Coordinate

**Claude Code (Orchestrator):**
- Updates `agentteam.md` with task assignments
- Monitors GitHub for commits/PRs from external agents
- Reviews and merges pull requests
- Plans next phase work
- Maintains planning files

**External Agents (Antigravity, Copilot, Jules):**
1. Read `agentteam.md` for current tasks
2. Create feature branch from `master`
3. Complete assigned work
4. Write results in `agentteam.md` (commit this file too)
5. Push to GitHub, create pull request
6. Add comment to PR describing what was done

### Handoff Protocol

When an agent completes work:
1. Update `agentteam.md` with results under appropriate section
2. Commit changes: `git commit -m "[AGENT] Completed task X"`
3. Push and create PR
4. Claude Code reviews and merges

When Claude Code assigns new work:
1. Update `agentteam.md` with new task
2. Tag relevant agent in commit message or PR description
3. Agent checks `agentteam.md` for instructions

### Conflict Resolution

**If multiple agents work on same files:**
- Coordinate in `agentteam.md` - add "Working on:" notes
- Use separate branches
- Create PRs for review
- Claude Code merges and resolves conflicts

**If agents get stuck:**
- Document blocker in `agentteam.md` with "BLOCKER:" prefix
- Create GitHub issue for visibility
- Claude Code helps unblock or reassigns

---

## File Reference Map

### Planning Files
```
.planning/phases/04-document-editor/
├── CONTEXT.md              # User vision from discuss-phase
├── 04-01-PLAN.md           # Document Backend (COMPLETE)
├── 04-02-PLAN.md           # TipTap Editor (COMPLETE)
├── 04-03-PLAN.md           # Citation Backend (COMPLETE)
├── 04-04-PLAN.md           # Version History (code complete)
├── 04-05-PLAN.md           # Citation UI (code complete)
├── 04-06-PLAN.md           # AI Text Assistance (code complete)
├── 04-01-SUMMARY.md        # Completed
├── 04-02-SUMMARY.md        # Completed
└── 04-03-SUMMARY.md        # Completed
```

### Key Implementation Files
```
backend/
├── document_api.py          # Document CRUD, versions, AI endpoints
├── memory_api.py            # Citations, bibliography endpoints
├── citation_service.py      # APA/MLA/Chicago formatting
├── database/models.py       # Document, DocumentVersion models
└── file_api.py              # File operations (needs content endpoint)

frontend/src/
├── lib/api.js               # API client functions
├── components/editor/
│   ├── DocumentEditor.jsx   # TipTap editor (420+ lines)
│   ├── VersionHistory.jsx   # Version list, diff, restore
│   ├── CitationPicker.jsx   # Insert citations
│   ├── Bibliography.jsx     # Display bibliography
│   └── AIAssistant.jsx      # Rewrite + grammar
└── components/layout/
    └── Workspace.jsx        # File Explorer integration (BROKEN - blank editor)
```

---

## Success Criteria

Phase 4 complete when:
- ✅ File content loading works (P0) - **JULES**
- ✅ UI tested and working (P1) - **ANTIGRAVITY**
- ✅ ESLint clean (P2) - **COPILOT**
- ✅ All 6 plans have SUMMARY.md files - **CLAUDE**
- ✅ User can: create doc, write content, insert citations, view versions
- ✅ All pull requests reviewed and merged

---

## Quick Reference

### Commands
```bash
# Clone repository
git clone https://github.com/Ryz3nPlayZ/research.git
cd research

# Create feature branch
git checkout -b agent/NAME/task-description

# Start development servers
./run-all.sh

# Check ESLint
cd frontend && npm run build

# Commit work
git add .
git commit -m "[AGENT] task description"
git push origin agent/NAME/task-description

# Create pull request
gh pr create --title "[AGENT] Task title" --body "Description of work done"
```

### Resources
- **Agent Instructions:** Always start here (agentteam.md)
- **Planning:** `.planning/phases/04-document-editor/*.md`
- **Project Status:** `.planning/STATE.md`, `.planning/ROADMAP.md`
- **Documentation:** `README.md`, `SETUP.md`

---

## Test Results Section

(External agents add their results here)

### Test Results - Antigravity
*Pending UI testing*

### ESLint Fixes - Copilot
*Pending ESLint fixes*

### File Content Loading - Jules
*Pending implementation*

---

**Last Updated:** 2026-02-04 by Claude Code
**Next Review:** After all P0-P2 tasks complete
**Status:** Awaiting external agent contributions
