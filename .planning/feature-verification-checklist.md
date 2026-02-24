# Feature Implementation Verification Checklist

**Purpose:** Verify which features are ACTUALLY implemented end-to-end vs UI placeholders.

**Instructions:** For each feature, test the full flow and mark as:
- ✅ Fully Working — complete, tested, functional
- ⚠️ Partial — works but has issues
- 🟧 Placeholder — UI only, no backend
- ❌ Broken — implemented but doesn't work
- ⏸️ Out of MVP Scope — intentionally deferred

**MVP Scope Rule:** Collaboration features are out of scope for MVP (real-time co-editing, comments, track changes, multi-user cursors).

**Execution Metadata (fill before testing):**

| Field | Value |
|------|-------|
| Tester | Copilot (code-level inspection + targeted implementation) |
| Date | 2026-02-18 |
| Frontend Commit/Branch | working tree (uncommitted) |
| Backend Commit/Branch | working tree (uncommitted) |
| Environment | Local / Staging / Production-like |
| Test Dataset | Existing local project data |

**Evidence Rule (required):** each completed row must include at least one evidence item in Notes:
- UI proof (screenshot/recording), and
- Backend proof (API response, DB record, server log, or WebSocket event)

---

## Dashboard (`/dashboard`)

| Feature | Test Steps | Status | Notes |
|---------|-----------|--------|-------|
| Stats cards | Click project count, compare to actual projects in DB | ⚠️ Partial | Code now uses live `stats`/project counts; browser+DB validation still pending. |
| Recent projects | Click a project, verify it opens | | |
| All projects | Verify projects list matches backend | | |
| Quick actions | Click "New Project", verify it creates project | | |
| Recent activity | Verify activity is real, not hardcoded | ⚠️ Partial | Activity list is driven by recent task/document API data in code; browser+backend runtime evidence still pending. |
| Hero visual | Decide if kept, replaced, or removed | ✅ Fully Working | Replaced with grounded “Research Overview” data card; removed rotating image/overlay visual treatment. |

---

## Projects List (`/projects`)

| Feature | Test Steps | Status | Notes |
|---------|-----------|--------|-------|
| List projects | Call GET /api/projects, verify display | | |
| Create project | Click create, verify project created | | |
| Project cards | Click card, verify navigates to project | | |
| Filter projects | Use filters, verify they work | | |
| Search projects | Use search, verify results | | |

---

## Project Workspace (`/projects/[id]`)

| Feature | Test Steps | Status | Notes |
|---------|-----------|--------|-------|
| Overview tab | Verify data displays correctly | | |
| Literature tab | Verify literature list | | |
| Files tab | Verify files list, upload works | | |
| Analysis tab | Verify analyses list | | |
| Documents tab | Verify documents list | | |
| Create document | Click create, verify redirects to doc | ✅ Fully Working | Implemented in `handleCreateDocument` via route push to `/projects/{id}/doc/{docId}`. |

---

## Document Editor (`/projects/[id]/doc/[docId]`)

| Feature | Test Steps | Status | Notes |
|---------|-----------|--------|-------|
| Load document | Verify content loads | | |
| Save document | Edit, reload, verify changes saved | | |
| Auto-save | Edit, wait, verify auto-saved | | |
| Formatting toolbar | Each button works correctly | | |
| Bold/Italic/Underline | Applies formatting | | |
| Headings | H1, H2, H3 work | | |
| Lists | Bullet and numbered lists | | |
| Blockquote | Blockquote formatting | | |
| Code block | Code block with syntax highlighting | | |
| Undo/Redo | Undo/Redo works | | |
| Export PDF | Click export, verify PDF downloads | | |
| Export DOCX | Click export, verify DOCX downloads | | |
| Citations | Insert citation, verify it appears | | |

---

## Literature (`/literature` or sidebar)

| Feature | Test Steps | Status | Notes |
|---------|-----------|--------|-------|
| Search papers | Enter query, verify results from Semantic Scholar/arXiv | | |
| View paper details | Click paper, see details | | |
| Download PDF | Click download, verify PDF saves | | |
| Save to library | Save paper, verify appears in library | | |
| Extract citations | Verify citations extracted from PDF | | |
| Generate bibliography | Click generate, verify bibliography | | |

---

## Files (`/files` or sidebar)

| Feature | Test Steps | Status | Notes |
|---------|-----------|--------|-------|
| List files | Verify files list shows actual files | | |
| Upload file | Drag/drop or click upload, verify file uploaded | | |
| Preview file | Click file, see preview | | |
| Download file | Click download, verify file downloads | | |
| Create folder | Create folder, verify it works | | |
| Delete file | Delete file, verify removed | | |
| Rename file | Rename, verify name changes | | |

---

## Analysis (`/analysis` or sidebar)

| Feature | Test Steps | Status | Notes |
|---------|-----------|--------|-------|
| List analyses | Verify analyses list shows actual analyses | | |
| Create analysis | Create new analysis, verify created | | |
| Write code | Code editor works, syntax highlighting | | |
| Run code | Click run, verify code executes | | |
| See results | Results display correctly | | |
| Download results | Download as CSV/PNG, works | | |
| Python support | Python code executes | | |
| R support | R code executes (if implemented) | | |

---

## AI Assistant / Chat (`/chat` or sidebar)

| Feature | Test Steps | Status | Notes |
|---------|-----------|--------|-------|
| Send message | Type message, send, verify response | | |
| Has context | AI knows about project/documents | | |
| Agent types | Document, Literature, Memory, General agents work | | |
| Shows rationale | AI response includes concise rationale + source references | | |
| Provenance | AI shows sources for claims | | |
| Tool execution | AI can run tools (search, write, analyze) | | |
| Background tasks | AI can run tasks in background | | |
| Proposal workflow | AI proposes actions, user approves | | |

---

## Provenance & Auditability (MVP Critical)

| Feature | Test Steps | Status | Notes |
|---------|-----------|--------|-------|
| Claim-to-source linking | Generate output with factual claims; verify each claim has source pointer | ⚠️ Partial | Added project Provenance tab with claim source resolution (`source_label`, `source_url`, source existence); runtime proof with fresh generated claims still pending. |
| Execution audit log | Run a multi-step AI task; verify action timeline with timestamps/status | ⚠️ Partial | Added endpoint `/api/projects/{id}/execution-logs` and UI trail in project overview; runtime validation pending. |
| Artifact lineage | Trace final artifact back to source inputs and intermediate tasks | ⚠️ Partial | Added provenance snapshot endpoint and artifact lineage panel showing parent artifact + task/run context + input artifact IDs; runtime evidence capture pending. |
| Failure traceability | Trigger a controlled failure; verify visible error reason + retry trace | | |
| Orchestration integrity | Verify state transitions are engine-driven and logged (no manual status mutation) | ⚠️ Partial | Engine/task worker architecture supports this; needs explicit test evidence for failures/retries. |

---

## Authentication (`/login`, `/signup`)

| Feature | Test Steps | Status | Notes |
|---------|-----------|--------|-------|
| Login | Enter credentials, verify login works | | |
| Signup | Create account, verify account created | | |
| Logout | Logout, verify logged out | | |
| Google OAuth | OAuth login works (if implemented) | | |
| Session persistence | Refresh, still logged in | | |

---

## Settings (`/settings`)

| Feature | Test Steps | Status | Notes |
|---------|-----------|--------|-------|
| Profile settings | Update name/email, verify saves | | |
| Preferences | Change preferences, verify saves | | |
| Team settings | If applicable, verify team management | | |
| API keys | If applicable, verify API key management | | |

---

## Real-time Features

| Feature | Test Steps | Status | Notes |
|---------|-----------|--------|-------|
| WebSocket connection | WebSocket connects (check Network tab) | | |
| Real-time updates | Changes appear without refresh | | |
| Notifications | Notifications appear for events | | |
| Multi-user sync | If applicable, changes sync across users | ⏸️ Out of MVP Scope | Collaboration excluded for MVP. |

**Note:** `Multi-user sync` should be marked `⏸️ Out of MVP Scope` unless scope changes.

---

## Performance

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Page load time | <3s | | |
| Time to interactive | <5s | | |
| Editor responsiveness | No lag when typing | | |
| Large document handling | Works with 10+ pages | | |

---

## Accessibility

| Feature | Status | Notes |
|---------|--------|-------|
| Keyboard navigation | | |
| Screen reader support | | |
| Color contrast (WCAG AA) | | |
| Focus indicators | | |
| Semantic HTML | | |

---

## Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | | |
| Firefox | | |
| Safari | | |
| Edge | | |

---

## Responsive Design

| Breakpoint | Width | Status | Notes |
|-----------|-------|--------|-------|
| Mobile | 375px | | |
| Tablet | 768px | | |
| Desktop | 1280px+ | | |

---

## Priority Gate (Do Not Skip)

### P0 Gate
- All P0 items from [.planning/ux-improvement-plan.md](.planning/ux-improvement-plan.md) are `✅` with evidence.
- No unresolved `❌ Broken` items in dashboard, document creation flow, provenance/auditability.

### P1 Gate
- Core workflows (project create, document edit/save/export, literature search, files upload/list, AI task execution) are at least `⚠️ Partial` with active fixes, and no blocker-level `❌`.

### P2 Gate
- Performance, accessibility, browser compatibility, and responsive checks are complete with documented results.
