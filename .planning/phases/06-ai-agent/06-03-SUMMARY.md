---
phase: 06-ai-agent
plan: 03
subsystem: [ai, ui, api]
tags: [plan-proposal, approval-ui, text-refinement, editor-integration, llm]

# Dependency graph
requires:
  - phase: 06-ai-agent
    plan: 02
    provides: [AgentRouter, specialized agents, context injection]
  - phase: 04-document-editor
    plan: 02
    provides: [TipTap editor, DocumentEditor component]
provides:
  - Plan proposal system for complex multi-step AI actions
  - Plan approval UI with approve/reject workflow
  - Plan execution engine with step-by-step processing
  - Text refinement integration applying AI suggestions to editor
  - ProjectContext integration for editor access across components
affects: [future ai features, user-controlled automation, document editing]

# Tech tracking
tech-stack:
  added: [ProposedPlan, PlanStep, PlanExecutor, PlanProposalCard, TextSuggestionCard]
  patterns: [plan-proposal-approval, text-suggestion-apply, editor-ref-sharing, context-callback]

key-files:
  created: []
  modified:
    - backend/agent_service.py
    - backend/chat_api.py
    - frontend/src/components/ai/AISidebar.jsx
    - frontend/src/components/editor/DocumentEditor.jsx
    - frontend/src/components/layout/Workspace.jsx
    - frontend/src/context/ProjectContext.js

key-decisions:
  - "Complex query detection by length and action verbs - Simple heuristic avoids unnecessary LLM calls"
  - "Plan proposal returns 404 for simple queries - Frontend falls back to direct message handling"
  - "Editor ref shared via ProjectContext - Enables AI sidebar to modify editor without prop drilling"
  - "Text suggestions displayed in separate section above messages - Clearer UX than inline suggestions"
  - "Apply suggestion updates editor and triggers auto-save - Seamless integration with existing save flow"

patterns-established:
  - "Plan proposal pattern: Propose → Approve/Reject → Execute"
  - "Editor ref sharing pattern: Store in context, access from any component"
  - "Text suggestion pattern: Show original (strikethrough) and revised with Apply button"
  - "Graceful degradation for plan failures - Continue with direct handling on error"

# Metrics
duration: 4min
completed: 2026-02-05
---

# Phase 6 Plan 3: Advanced AI Features Summary

**Plan proposal system with user approval workflow and direct text refinement integration with document editor**

## Performance

- **Duration:** 4 minutes
- **Started:** 2026-02-05T17:19:51Z
- **Completed:** 2026-02-05T17:23:41Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments

- **Plan proposal system** - AI generates structured multi-step plans for complex queries with action types, durations, and confidence scores
- **Plan approval UI** - PlanProposalCard component displays proposed plans with Approve/Reject buttons and step-by-step breakdown
- **Plan execution engine** - Step-by-step plan execution with status tracking and error handling
- **Text refinement integration** - AI suggestions can be applied directly to document editor with one click
- **Editor ref sharing** - ProjectContext provides editor ref access across components for AI modification

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement plan proposal system** - `f0bb694` (feat)
2. **Task 2: Add plan approval UI to AISidebar** - `cfe9b14` (feat)
3. **Task 3: Integrate text refinement with editor** - `10b897d` (feat)

**Plan metadata:** TBD (docs: complete plan)

## Files Created/Modified

### Modified
- `backend/agent_service.py` - Added PlanStep, ProposedPlan models, propose_plan(), execute_step(), execute_plan() methods, _is_simple_query() helper
- `backend/chat_api.py` - Added POST /propose-plan and POST /execute-plan endpoints, imported ProposedPlan model
- `frontend/src/components/ai/AISidebar.jsx` - Added PlanProposalCard and TextSuggestionCard components, plan proposal state, plan approval/rejection handlers, text suggestion handlers, integrated with message flow
- `frontend/src/components/editor/DocumentEditor.jsx` - Added applySuggestion method, editorRef prop support, expose editor instance via ref
- `frontend/src/components/layout/Workspace.jsx` - Pass editorRef to DocumentEditor from ProjectContext
- `frontend/src/context/ProjectContext.js` - Added editorRef and applyAISuggestion for cross-component editor access

## Decisions Made

1. **Complex query detection by heuristic** - Queries over 50 chars with action verbs (analyze, compare, extract, generate, search, synthesize) trigger plan proposal. Simple queries skip planning for faster response.

2. **Plan proposal returns 404 for simple queries** - Frontend receives 404 when query doesn't need planning, then falls back to normal message send. Clean separation of complex vs simple flows.

3. **Editor ref shared via ProjectContext** - Instead of prop drilling editor ref through multiple components, stored in ProjectContext where both Workspace (sets it) and AISidebar (uses it) can access. Follows established pattern for cross-component state.

4. **Text suggestions displayed above messages** - Separate section in AISidebar for active text suggestions. Prevents cluttering message history and makes suggestions more discoverable/accessible.

5. **Apply suggestion triggers auto-save** - Applying AI suggestion uses existing TipTap replaceWith transaction, which triggers the editor's onUpdate handler and auto-save. No additional save logic needed.

## Deviations from Plan

### Auto-fixed Issues

None - plan executed exactly as written. All three tasks completed without deviations or unexpected issues.

---

**Total deviations:** 0 auto-fixed
**Impact on plan:** None. All functionality implemented as specified.

## Issues Encountered

1. **Duplicate handleSend function** - After adding plan proposal logic, the original handleSend remained in AISidebar. Fixed by removing old implementation and using only handleSendWithPlanCheck.

**Resolution:** Removed duplicate code during Task 2 commit. Plan check now correctly intercepts all message sends.

## User Setup Required

None - no external service configuration required beyond existing LLM provider setup.

**Note:** Plan proposal requires LLM provider to be configured (OpenAI, Gemini, etc.). If no LLM is configured, plan proposal fails gracefully and falls back to direct message handling.

## Next Phase Readiness

- Plan proposal system ready for more complex action types (file operations, data analysis)
- Text refinement pattern ready for expansion (grammar checking, style improvements, citation insertion)
- Editor ref sharing pattern enables future AI features (auto-formatting, content generation, citation suggestions)
- Approval workflow pattern ready for other user-controlled operations (bulk edits, file deletions)

**Blockers/Concerns:**
- None

## Verification Checklist

- [x] Plan proposal system generates structured plans with steps
- [x] Plan approval UI displays correctly with approve/reject buttons
- [x] Plan execution works step-by-step
- [x] Text refinement applies suggestions to editor
- [x] User can approve/reject plans
- [x] Integration test: Complex query triggers plan proposal → approval → execution → results display
- [x] Simple queries bypass plan proposal (404 handling)
- [x] Editor ref accessible from AISidebar via ProjectContext
- [x] Apply suggestion updates document content and triggers auto-save

---
*Phase: 06-ai-agent*
*Plan: 03*
*Completed: 2026-02-05*
