# Agent Team Collaboration Guide

**Purpose:** Coordinate multiple AI agents working on the Research Workspace project

## Overview

This project uses AI agents (Claude Code instances) for task execution. Each agent operates independently but coordinates through this document.

## Agent Roles

### 1. Orchestrator (Main Session)
- **Responsibility:** Overall project coordination, planning, and delegation
- **Tools Available:** All tools (Bash, Read, Write, Edit, Task, etc.)
- **Activities:**
  - Create and execute phase plans
  - Spawn sub-agents for parallel work
  - Review and approve completed work
  - Manage git commits and state tracking
  - Coordinate verification and gap closure

### 2. Executor Agents (gsd-executor)
- **Responsibility:** Execute PLAN.md files with specific tasks
- **Tools Available:** Execution tools (Bash, Read, Write, Edit, Task)
- **Activities:**
  - Read plan objectives and context
  - Execute tasks atomically (one task = one git commit)
  - Create SUMMARY.md upon completion
  - Update STATE.md with decisions
  - Handle checkpoints by returning to orchestrator

### 3. Verifier Agents (gsd-verifier)
- **Responsibility:** Verify phase goals against actual codebase
- **Tools Available:** Inspection tools (Read, Grep, Glob, Bash)
- **Activities:**
  - Check must_haves from PLAN.md frontmatter
  - Verify artifacts exist and aren't stubs
  - Trace key_links between components
  - Create VERIFICATION.md with pass/fail status
  - Identify gaps for /gsd:plan-phase --gaps

### 4. Specialist Agents (on-demand)
- **Mapper (gsd-codebase-mapper):** Explore and document codebase structure
- **Researcher (gsd-research-phase):** Research unknown domains before planning
- **Debugger (systematic-debugging):** Investigate bugs and failures

## Collaboration Protocol

### Task Delegation

**When Orchestrator delegates work:**

1. **Identify independent tasks** that can run in parallel
2. **Create Task calls** with specific prompts:
   ```
   Task(prompt="Execute plan at {plan_path}

   Plan: @{plan_path}
   Project state: @.planning/STATE.md
   Commit each task atomically. Create SUMMARY.md.",
          subagent_type="gsd-executor")
   ```

3. **Wait for completion** - Task tool blocks until agent finishes
4. **Review SUMMARY.md** - Check what was accomplished
5. **Verify and integrate** - Review commits, update state if needed

### Example: Parallel Execution

**Scenario:** Phase has 3 independent plans

```
# Orchestrator spawns 3 agents in parallel:
Task(prompt="Execute plan 01-01", subagent_type="gsd-executor")
Task(prompt="Execute plan 01-02", subagent_type="gsd-executor")
Task(prompt="Execute plan 01-03", subagent_type="gsd-executor")

# All 3 run in parallel
# Orchestrator waits for all to complete
# Reviews 3 SUMMARY.md files
# Continues to next wave
```

### Agent Communication

**Through Files:**
- **PLAN.md:** Orchestrator → Executor (task specification)
- **SUMMARY.md:** Executor → Orchestrator (task completion report)
- **VERIFICATION.md:** Verifier → Orchestrator (gap findings)
- **STATE.md:** All agents → Orchestrator (decisions, context)

**Direct Agent Interaction:** Rare - typically through orchestrator, not agent-to-agent

### Work Marking Convention

**To mark work as done in agentteam.md:**

When an agent completes work, update this file:

```markdown
## Work Completed

### [Date YYYY-MM-DD]

**Agent:** Executor (01-01)
**Plan:** 01-01 Mock Authentication
**Status:** ✓ Complete
**Commit:** 6931ffc, 800e0ea, etc.
**Summary:** .planning/phases/01-authentication/01-01-SUMMARY.md

---

**Agent:** Verifier (01-01)
**Plan:** Phase 1 verification
**Status:** ✓ Complete
**Commit:** (verification committed by orchestrator)
**Summary:** .planning/phases/01-authentication/01-authentication-VERIFICATION.md
```

## Task Assignment Patterns

### Pattern 1: Sequential Plans

```
Phase with 3 sequential plans:
- Plan 01 (autonomous) → Spawns executor, wait for SUMMARY
- Plan 02 (depends on 01) → Spawn executor after 01 complete
- Plan 03 (depends on 02, has checkpoint) → Spawn executor, handle checkpoint, resume
```

### Pattern 2: Parallel Wave

```
Wave 1 (3 autonomous plans):
- Spawn 3 executors in parallel
- Wait for all 3
- Review all SUMMARYs
- Proceed to Wave 2
```

### Pattern 3: Gap Closure

```
Verification found gaps:
1. Spawn verifier to check must_haves
2. VERIFICATION.md shows gaps
3. Orchestrator creates gap closure plan (01-02)
4. Spawn executor to fix gaps
5. Spawn verifier to re-check
6. Loop until passed
```

## Agent Independence

Each executor agent:
- Gets fresh 200k context window
- Loads plan and context independently
- Works autonomously on its tasks
- Creates SUMMARY.md for orchestrator to review
- Returns to orchestrator when complete (or checkpoint)

No agent "manages" another agent directly. All coordination happens through:
1. Plan files (orchestrator → executor)
2. Summary files (executor → orchestrator)
3. State updates (all → orchestrator)

## Error Handling

### Executor Fails Mid-Task

**If executor crashes/errors:**
1. SUMMARY.md won't exist or is incomplete
2. Orchestrator detects missing SUMMARY
3. Orchestrator reviews git commits to see what was done
4. Decides: retry with fix instructions, or spawn debugger agent
5. Updates STATE.md with blocker if needed

### Verification Finds Gaps

**If verifier finds gaps:**
1. VERIFICATION.md created with `gaps: [...]`
2. Orchestrator presents gaps to user
3. Offers: `/gsd:plan-phase {phase} --gaps`
4. Gap closure plan created
5. Executor fixes gaps
6. Re-verify → loop until passed

## Current Project Context

**Project:** Research Workspace
**Current Phase:** 2 (File & Project Management)
**Last Completed:** Phase 1 (Authentication & User Management)

### Recent Agent Activity

**2025-02-01:**
- **Executor (01-01):** Completed mock authentication system (16 min)
- **Executor (01-02):** Fixed AppContent integration (4 min)
- **Verifier (01-01):** Verified phase goals (4/4 passed)

### Work Queue

**Ready to start:**
- Phase 2 planning (/gsd:plan-phase 2)
- Phase 2 execution (/gsd:execute-phase 2)

**Blocked:** None

## Communication Summary

**Total agents spawned:** 4 (3 executors, 1 verifier)
**Successful parallel waves:** 1
**Gap closure cycles:** 1 (found and fixed 2 gaps)
**Average plan duration:** 10 minutes

---

## Notes

- Agents don't "talk" to each other - they communicate through files
- Orchestrator is always in main session, never delegates overall control
- Executor agents are temporary - spawned for a plan, terminated after
- Verifier agents are temporary - spawned for verification, terminated after
- No "agent manager" - the STATE.md file serves this purpose

---

# Phase 4 Delegation Plan

**Date:** 2026-02-04
**Phase:** 04 - Rich Text Document Editor
**Status:** Wave 1 Complete, Waves 2-3 Code Complete Need Verification

## Executive Summary

Phase 4 has 3 waves of implementation. Wave 1 (Plans 01-03) is complete. Waves 2-3 (Plans 04-06) have code complete but need verification. **Critical bug:** File content loading broken - MD/DOCX files open blank instead of showing content.

**Orchestrator:** Claude (Sonnet 4.5) - nearing usage limits, delegating to specialist agents

## Progress Summary

### Completed (Wave 1)
| Plan | Name | Status | Summary |
|------|------|--------|---------|
| 04-01 | Document Backend | ✅ COMPLETE | Document/DocumentVersion models, CRUD API, migration |
| 04-02 | TipTap Editor | ✅ COMPLETE | DocumentEditor component, toolbar, auto-save |
| 04-03 | Citation Backend | ✅ COMPLETE | DocumentCitation model, CitationService, API endpoints |

### Code Complete, Needs Verification (Waves 2-3)
| Plan | Name | Status | Issues |
|------|------|--------|--------|
| 04-04 | Version History | ⏸️ VERIFY | Code complete, needs testing |
| 04-05 | Citation UI | ⏸️ VERIFY | Code complete, bibliography path fixed, needs testing |
| 04-06 | AI Text Assistance | ⏸️ VERIFY | Code complete, needs LLM API key + testing |

### Bugs Fixed
- ✅ Router prefix (duplicate /api removed)
- ✅ Citation style case (APA → apa)
- ✅ Duplicate History extension
- ✅ Bibliography API path (/memory prefix added)

### Known Critical Issues
- ❌ **File content loading broken** - MD/DOCX files create blank document
- ⚠️ ESLint warnings in AIAssistant.jsx, Bibliography.jsx, CitationPicker.jsx

## Delegated Tasks

### Task 1: Fix File Content Loading (P0 - CRITICAL)

**Agent:** Antigravity or Jules
**Priority:** BLOCKING basic functionality
**Files:**
- `frontend/src/components/layout/Workspace.jsx` (lines 194-247)
- `frontend/src/lib/api.js` (documentsApi section)
- May need new endpoint in `backend/file_api.py`

**Problem:** Opening `.md` or `.docx` files creates empty Document instead of loading file content

**Steps:**
1. Add backend endpoint: `GET /api/files/files/{id}/content`
2. Convert content to TipTap JSON:
   - Markdown: Parse → TipTap JSON format
   - DOCX: Extract → TipTap JSON format
3. Update Workspace.jsx to load file content when creating document

**TipTap JSON Format:**
```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [{"type": "text", "text": "Hello from file content!"}]
    }
  ]
}
```

**Success:** Opening MD/DOCX files shows file content in editor

---

### Task 2: Test Citation System (P1)

**Agent:** Copilot or Jules
**Files:** CitationPicker.jsx, Bibliography.jsx, memory_api.py, citation_service.py

**Test Plan:**
1. Insert citation from memory search
2. Insert manual citation
3. Switch citation styles (APA/MLA/Chicago)
4. Verify bibliography generates and updates
5. Test copy to clipboard

**Write results to:** agentteam.md under "### Test Results - Citations"

---

### Task 3: Test Version History (P1)

**Agent:** Copilot or Antigravity
**Files:** VersionHistory.jsx, document_api.py

**Test Plan:**
1. Create document, make multiple edits (wait 4s for auto-save)
2. Open version history (History icon in toolbar)
3. View version list (verify timestamps)
4. Click version to view diff (side-by-side JSON)
5. Test restore (verify confirmation dialog)
6. Verify audit trail (pre-restore saved as new version)

**Write results to:** agentteam.md under "### Test Results - Version History"

---

### Task 4: Test AI Text Assistance (P2)

**Agent:** Any agent
**Prerequisite:** LLM API key in backend/.env
**Files:** AIAssistant.jsx, document_api.py

**Test Plan:**
1. Verify LLM provider configured (check backend/.env)
2. Select text, right-click → "Rewrite with AI"
3. Test all tones (formal, casual, concise, elaborate)
4. Select text → "Check Grammar"
5. Verify suggestions display with explanations
6. Test "Apply All" button

**If no LLM key:** Document in agentteam.md, skip testing

**Write results to:** agentteam.md under "### Test Results - AI Assistant"

---

### Task 5: Fix ESLint Warnings (P2)

**Agent:** Any agent
**Files:** AIAssistant.jsx, Bibliography.jsx, CitationPicker.jsx

**Warnings to fix:**
- AIAssistant.jsx:72 - useCallback missing 'handleClose'
- AIAssistant.jsx:219 - useCallback missing 'handleClose'
- Bibliography.jsx:78 - useEffect missing 'fetchBibliography'
- CitationPicker.jsx:141 - useEffect missing 'handleSearch'

**Fix options:**
1. Add missing dependencies to arrays
2. Use `// eslint-disable-next-line react-hooks/exhaustive-deps` if intentional
3. Refactor to avoid circular dependencies

**Success:** `npm run build` completes without ESLint warnings

**Write results to:** agentteam.md under "### ESLint Fixes Applied"

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
└── 0X-XX-SUMMARY.md        # Create these after testing
```

### Backend Files
```
backend/
├── document_api.py          # Document CRUD, versions, AI endpoints
├── memory_api.py            # Citations, bibliography endpoints
├── citation_service.py      # APA/MLA/Chicago formatting (NEW)
├── database/models.py       # Document, DocumentVersion, DocumentCitation
└── scripts/migrate_add_document_tables.py  # Migration run
```

### Frontend Files
```
frontend/src/
├── lib/api.js               # Document API client functions
├── components/editor/
│   ├── DocumentEditor.jsx   # TipTap editor with toolbar (420+ lines)
│   ├── VersionHistory.jsx   # Version list, diff, restore (364 lines)
│   ├── CitationPicker.jsx   # Insert citations UI
│   ├── Bibliography.jsx     # Display formatted bibliography
│   └── AIAssistant.jsx      # Rewrite + grammar dialogs
└── components/layout/
    └── Workspace.jsx        # File Explorer integration (loads .md/.docx)
```

---

## Agent Instructions

### When Starting Work

1. **Read this file** (agentteam.md) - all context is here
2. **Read relevant PLAN.md** files for detailed task context
3. **Check existing SUMMARY.md** files for completed work
4. **Verify current code state** before making changes

### When Completing Work

1. **Write results in agentteam.md** under appropriate section:
   - Add "### Test Results - [Feature Name]" sections
   - Document bugs found, fixes applied
   - Note any deviations from plans

2. **Create SUMMARY.md** files for completed plans:
   - Follow format from 04-01-SUMMARY.md
   - Include: tasks completed, commits, deviations, next steps

3. **Commit all changes** with clear messages:
   ```
   fix(04-XX): brief description
   ```

4. **Document handoff** if passing to another agent:
   - Update agentteam.md with "Handed off to: [Agent]"
   - Note what's done and what remains

### Communication Protocol

- **Progress updates:** Add comments to agentteam.md
- **Blockers:** Document with "BLOCKER:" prefix
- **Questions:** If orchestrator returns, read agentteam.md for context
- **Completion:** Mark task with "✅ COMPLETE"

---

## Success Criteria

Phase 4 complete when:
- ✅ File content loading works (P0)
- ✅ Citation system tested and working (P1)
- ✅ Version history tested and working (P1)
- ✅ AI assistant tested or documented as blocked (P2)
- ✅ ESLint build clean (P2)
- ✅ All 6 plans have SUMMARY.md files
- ✅ User can: create doc, write content, insert citations, view versions

---

## Quick Commands

```bash
# Start servers
./run-all.sh

# Backend only
cd backend && source venv/bin/activate && python server.py

# Frontend only
cd frontend && yarn start

# Check ESLint
cd frontend && npm run build

# Git status
git status
git log --oneline -10
```

---

**Last updated:** 2026-02-04 by Claude (Sonnet 4.5)
**Status:** Delegated to specialist agents - file content loading is critical blocker (P0)
