# UX/UI Issues & Improvement Plan

**Date:** 2026-02-18
**Status:** Documentation & Planning — Not for execution
**Focus:** Remove "vibecoded" look, make it feel grounded and professional, complete missing features

**MVP Scope Guardrails:**
- Collaboration features are out of scope for MVP (no multi-user cursors, comments, track changes, live co-editing).
- Prioritize provenance, auditability, and execution reliability over feature breadth.
- Every implemented item must be verifiable with evidence (UI proof + API/DB/log proof).

---

## Dashboard Issues

### 1. "Vibecoded" Appearance
**Problem:** Dashboard looks AI-generated and lacks professional polish.

**Guidance from anti-vibecoded principles:**
- Ditch emojis for professional icons (Phosphor or Lucide)
- Master color theory — avoid bright clashing colors
- Design thoughtful information architecture — consolidate sidebars
- Enhance user profiles — replace generic gradient circles
- Streamline settings — consolidate into organized popovers
- Use modals for sparse forms
- Collapse advanced options in forms
- Remove redundant/KPI cards that lack functionality

**Current Issues:**
- Hero visual feels "soapy/slippery" — not grounded for research
- Color palette not well implemented
- Light green on white background uncomfortable to look at
- Overall lacks professional research aesthetic

**Fix Needed:**
- Reconsider hero visual — something grounded, academic
- Implement Hellycopter v2 color palette correctly (pistachio/mint/evergreen as accents, not dominant)
- Use proper spacing, shadows, and borders
- Remove "AI-generated" feel through intentional design choices

### 2. Too Much Hardcoded Content
**Problem:** Dashboard has mock/hardcoded data instead of real backend integration.

**Fix Needed:**
- Connect all components to actual backend APIs
- Show real project counts, document counts
- Display real recent activity
- Remove placeholder content

---

## Project Workspace Issues

### 3. Create Document Navigation
**Problem:** Creating a new document doesn't automatically navigate to the document.

**Expected Behavior:**
- User clicks "New Document" → Document is created → User is redirected to edit the new document
- Same flow as Google Docs/Notion

**Fix Needed:**
- Add router.push() call after document creation
- Handle loading states during creation

### 4. Text Editor Quality
**Problem:** Editor is far from Google Docs/Word quality.

**Required MVP Features:**
- Proper formatting toolbar (not just basic buttons)
- Better cursor and selection behavior
- Proper keyboard shortcuts
- Page/word count
- Find/replace

**Deferred (Post-MVP):**
- Comments/annotations
- Track changes
- Real-time collaboration indicators

**Current Gap:**
- Editor is functional but minimal
- Missing professional polish
- Doesn't feel like a serious writing tool

---

## AI Assistant Issues

### 5. No Agentic Abilities
**Problem:** AI assistant lacks agentic capabilities as defined in product vision.

**Product Vision Requirements:**
- Multi-agent orchestration (Router, Planner, Context Manager, Work Agents, Evaluator, Integrator)
- Tool execution (write into documents, run code, execute analyses)
- Multi-step evaluation (citation verification, logical consistency, confidence scoring)
- Provenance tracking on all outputs
- Background autonomous tasks (literature monitoring, data refreshes)

**Current State:**
- Likely just a basic chat interface
- No visible agent coordination
- No tool execution visible to user
- No provenance on outputs
- No evaluation/verification loop

**Fix Needed:**
- Implement actual multi-agent backend coordination
- Show user what agents are doing (task visibility)
- Enable tool execution from chat
- Show provenance on AI-generated content
- Add background task capabilities

### 6. Provenance & Auditability Gaps
**Problem:** Outputs are hard to trust if users cannot inspect where claims came from and what actions were performed.

**MVP Requirements:**
- Every AI output includes source references and confidence metadata where available.
- Tool actions are logged with timestamp, actor (user/system/agent), and result.
- Research artifact lineage is visible: input sources → intermediate tasks → final output.
- Task transitions remain orchestration-driven and auditable.

**Acceptance Evidence (required):**
- UI screenshot showing source/provenance panel.
- API response showing provenance fields for generated output.
- DB/log proof of execution trace for at least one end-to-end task.

---

## Implementation Verification

### 7. Feature Completeness Check
**Need to verify which features are ACTUALLY implemented vs just UI placeholders:**

**Dashboard:**
- [ ] Real project counts (not hardcoded)
- [ ] Real recent projects
- [ ] Real recent activity
- [ ] Working quick actions
- [ ] Functional stats

**Projects View:**
- [ ] Create project works end-to-end
- [ ] Project cards show real data
- [ ] Filter/sort actually works
- [ ] Navigation to project works

**Document Editor:**
- [ ] Save/load documents
- [ ] Auto-save functional
- [ ] Formatting actually works
- [ ] Export (PDF/DOCX) works
- [ ] Citations functional

**Literature:**
- [ ] Search actually calls Semantic Scholar/arXiv
- [ ] Results display correctly
- [ ] PDF download works
- [ ] Citation extraction works
- [ ] Save to library works

**Files:**
- [ ] Upload works
- [ ] File preview works
- [ ] File organization works
- [ ] Download works

**Analysis:**
- [ ] Code execution actually works
- [ ] Results display correctly
- [ ] Output downloadable
- [ ] Python/R sandbox functional

**AI Chat:**
- [ ] Actually calls LLM
- [ ] Has context from project
- [ ] Can perform tasks
- [ ] Shows sources/reasoning

**Provenance & Auditability:**
- [ ] Each generated claim links to at least one source
- [ ] Tool execution log records action + status + timestamp
- [ ] Artifact lineage view exists and is understandable
- [ ] Failed task has inspectable reason and retry trace

---

## Priority Order

### P0 (Blocking Professional Feel)
1. Remove vibecoded appearance — redesign dashboard to look professional
2. Fix color palette implementation
3. Remove hardcoded data, connect to real backend
4. Fix create document navigation
5. Add baseline provenance and audit trail visibility for generated outputs

### P1 (Core Functionality)
6. Verify and complete all features (ensure they actually work)
7. Add staged agentic abilities to AI assistant (task execution + visibility first)
8. Improve editor to serious writing-tool quality (MVP subset only)

### P2 (Polish)
9. Add more professional interactions and animations
10. Improve responsiveness
11. Expand advanced AI orchestration depth and non-MVP editor features

---

## Execution Tracker (Mandatory)

| Item | Priority | Owner | Target Date | Status | Evidence Link | Notes |
|------|----------|-------|-------------|--------|---------------|-------|
| Dashboard visual grounding | P0 | Copilot | 2026-02-18 | ✅ Implemented | frontend/app/(app)/dashboard/page.tsx | Replaced image carousel/soapy hero with grounded data-first overview card and simplified current-project presentation. |
| Palette correction (accent-only green) | P0 | Copilot | 2026-02-18 | ⚠️ Partial | frontend/app/(app)/dashboard/page.tsx | Kept green as accents in key widgets, but full palette audit still pending. |
| Remove hardcoded dashboard content | P0 | Copilot | 2026-02-18 | ✅ Implemented (code pass) | frontend/app/(app)/dashboard/page.tsx | Removed hardcoded trend/fallback metrics and decorative mock collaboration cues; dashboard values now sourced from API state in code. |
| Create document navigation fix | P0 | Copilot | 2026-02-18 | ✅ Implemented | frontend/app/(app)/projects/[id]/page.tsx | `handleCreateDocument` now redirects to `/projects/{id}/doc/{docId}` after creation. |
| Provenance panel + source links | P0 | Copilot | 2026-02-18 | ✅ Implemented (code pass) | backend/memory_api.py; frontend/app/(app)/projects/[id]/_components/provenance-tab.tsx | Added dedicated Provenance tab with source-resolved claims, relationship/citation drill-down, and artifact lineage plus new provenance/citation endpoints. |
| Feature completeness pass | P1 | Copilot | 2026-02-19 | 🚧 In progress | .planning/feature-verification-checklist.md | Initial code-level baseline recorded; runtime QA pass still required. |
| Agentic abilities (staged) | P1 | Copilot | 2026-02-20 | ⚠️ Partial | backend/workers/task_worker.py; backend/server.py | Task worker + orchestration exist; UI still lacks full transparent multi-agent traces. |
| Editor MVP quality pass | P1 | Copilot | 2026-02-20 | ⚠️ Partial | frontend/app/(app)/projects/[id]/doc/[docId]/page.tsx | Functional editor exists; advanced quality gaps remain (find/replace, stronger writing UX). |

---

## Exit Criteria by Priority

### P0 Exit Criteria
- All five P0 items marked complete with evidence links.
- No dashboard hardcoded KPI/activity content remains in primary views.
- Green palette usage validated as accent-only in key dashboard surfaces.
- At least one end-to-end generated output shows provenance + audit trail.

### P1 Exit Criteria
- Verification checklist has no critical ❌ Broken items in core user flows.
- AI assistant can execute at least one multi-step task with visible action trace.
- Editor supports stable writing, formatting, save/load, export, and citation insertion.

### P2 Exit Criteria
- Polishing items are complete without regressing P0/P1 behavior.
- Browser/responsive/performance targets are met for baseline environments.

---

## Design Direction Reference

**Hellycopter v2 Color Palette (from kimi_dashboard_design/design-v2.md):**

```
Background:
- Page BG: #F5F5F7 (light gray)
- Card BG: #FFFFFF (pure white)
- Card BG Secondary: #FAFAFA (off-white)

Primary Brand Colors (USE SPARINGLY):
- Soft Pistachio: #DEF4C6 — subtle accents, badges
- Mint Bloom: #73E2A7 — primary CTA, active states
- Forest Jade: #1C7C54 — icons, secondary text
- Deep Evergreen: #1B512D — logo, headings

Text Colors:
- Primary: #1B512D — headings
- Secondary: #4A5D4A — body text
- Tertiary: #8A9A8A — labels
- Muted: #B8C4B8 — disabled, hints

Usage: Green is for ACCENTS only, not large backgrounds. White cards on light gray background.
```

**Key Principle:** Research platform should feel GROUNDED, not slippery. Use:
- Proper whitespace
- Subtle shadows
- Clear visual hierarchy
- Professional typography
- Muted color accents
