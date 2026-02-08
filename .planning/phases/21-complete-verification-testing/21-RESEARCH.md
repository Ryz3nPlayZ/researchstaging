# Phase 21: Complete Verification Testing - Research

**Researched:** 2026-02-08
**Domain:** Manual verification testing (backend API + frontend browser workflows + responsive design)
**Confidence:** HIGH

## Summary

Phase 21 is a **testing-only phase** — no bug fixes, only verification and documentation. The goal is to systematically test all 10 backend flows and 10 frontend user workflows, documenting results with pass/fail status and detailed observations. Manual browser testing (TEST-04) already completed, revealing 22 documented bugs. This phase completes the remaining verification work with structured documentation.

**Primary recommendation:** Use a **parallel testing approach** where backend API testing (via curl/pytest) and frontend browser testing happen simultaneously, with results consolidated into a single markdown test results document. Backend tests verify server-side operations independently; frontend tests verify client-side user experience. Even though there's overlap (e.g., authentication), each of the 20 tests gets executed separately as specified in CONTEXT.md.

**Key insight:** This is about **documentation, not discovery**. The bugs are already known. The value here is creating a clear baseline of what works and what doesn't before Phase 22 bug fixes begin.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Format:** Markdown report (`.planning/phases/21/21-TEST-RESULTS.md`)
- **Detail level:** Detailed steps — step-by-step walkthrough with specific actions and observations
- **Screenshots:** No — text only. Bugs documented with descriptions in REQUIREMENTS.md
- **Pass/fail format:** Pass/Fail + brief note — each flow gets clear status with one-sentence explanation

### Claude's Discretion
- Exact structure and organization of the markdown test results document
- Specific wording and formatting for pass/fail notes
- How to summarize the 22 known bugs in the test results document
- Level of detail in step-by-step walkthroughs (balance between thoroughness and verbosity)

### Deferred Ideas (OUT OF SCOPE)
- **Mobile and Tablet Responsive Testing:** Testing at 375px (mobile) and 768px (tablet) breakpoints is deferred to future phase. This is a desktop-first research web app. Mobile/tablet support is a future enhancement, not v1.2 MVP scope.
- **Comprehensive Responsive Testing:** Testing all 10 flows at all 3 breakpoints (30 total tests) is out of scope. Desktop is the primary use case for researchers.

## Standard Stack

### Backend Testing Tools

| Tool | Version/Source | Purpose | Why Standard |
|------|----------------|---------|--------------|
| **curl** | System utility | Manual API endpoint testing | Universally available, HTTP method agnostic, scriptable |
| **pytest** | Existing in `backend/tests/test_api.py` | Automated test verification | Already integrated, follows FastAPI best practices |
| **requests** | Python library | Programmatic HTTP calls | Used by existing test suite, clean API |
| **psql** | PostgreSQL client | Direct database verification | Check data persistence independently of API |

### Frontend Testing Tools

| Tool | Version/Source | Purpose | Why Standard |
|------|----------------|---------|--------------|
| **Browser DevTools** | Chrome/Firefox/Safari | Inspect state, network, console | Standard browser debugging, no setup needed |
| **Responsive Design Mode** | DevTools feature | Test desktop viewport (1280px+) | Built-in browser capability |
| **React DevTools** | Browser extension | Inspect component state/hierarchy | Standard React debugging |
| **WebSocket Inspector** | DevTools WS tab | Verify real-time connection | Check WebSocket events, connection status |

### Supporting Tools

| Tool | Purpose | When to Use |
|---------|---------|-------------|
| **http://localhost:8000/docs** | Swagger UI API documentation | Visual API exploration, manual testing |
| **Postman** (optional) | Alternative to curl for API testing | If tester prefers GUI over CLI |
| **Screen recording** (optional) | Document test execution for review | Helpful for reproducing bugs, not required |

**Installation:**
```bash
# Backend testing tools (should already be installed)
curl --version                    # Verify curl available
pytest --version                  # Verify pytest available
psql --version                    # Verify PostgreSQL client available

# Frontend testing tools (browser-based)
# No installation needed - use browser DevTools
# React DevTools extension (optional but helpful):
# Chrome/Edge: https://chrome.google.com/webstore/detail/react-developer-tools/
# Firefox: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/
```

## Architecture Patterns

### Backend API Structure

The backend uses **FastAPI with modular routers** — each feature area has its own API file:

```
backend/
├── server.py                    # Main FastAPI app, includes routers
├── file_api.py                 # 13 routes - file upload, download, CRUD
├── document_api.py             # 10 routes - document CRUD, auto-save
├── literature_api.py           # 4 routes - search, import papers
├── chat_api.py                 # 6 routes - AI chat (4 agent types)
├── analysis_api.py             # 5 routes - code execution, results
├── export_api.py               # 3 routes - PDF/DOCX export
├── memory_api.py               # 23 routes - claims, findings, relationships
├── citation_api.py             # 2 routes - citation search, bibliography
└── tests/
    ├── test_api.py             # Existing pytest tests
    └── test_agent_service.py   # Agent service tests
```

**Base URL:** `http://localhost:8000/api/`

**Total Routes:** 66 routes across 9 API files (plus 3 in server.py)

### Frontend View Structure

The frontend uses **React 19 with component-based views**:

```
frontend/src/
├── components/
│   ├── pages/
│   │   ├── Dashboard.jsx       # Project list, create new project
│   │   └── PlanningFlow.jsx    # Planning workflow
│   ├── editor/
│   │   ├── RichTextEditor.jsx  # TipTap editor instance
│   │   └── DocumentEditor.jsx  # Document view with auto-save
│   ├── analysis/
│   │   ├── CodeEditor.jsx      # Monaco editor for Python/R
│   │   └── AnalysisResults.jsx # Display tables, charts, output
│   ├── files/                  # File management views
│   ├── literature/             # Literature search, import
│   ├── chat/                   # AI sidebar panel
│   └── memory/                 # Claims, findings, relationships views
└── context/
    └── ProjectContext.js       # Global state management
```

### Pattern 1: Backend Flow Testing (Server-Side Verification)

**What:** Test each backend flow by directly calling API endpoints via curl/requests, verifying response codes, data persistence, and side effects.

**When to use:** All 10 backend flows (TEST-01)

**Example: Authentication Flow**
```bash
# Step 1: Test mock login endpoint
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}'

# Expected: 200 OK with JWT token
# Verification: Check response body contains "access_token"

# Step 2: Test protected endpoint with token
curl http://localhost:8000/api/projects \
  -H "Authorization: Bearer <TOKEN_FROM_STEP_1>"

# Expected: 200 OK with projects list
# Verification: Session persists across requests

# Step 3: Verify database record
psql -U research_user -d research_pilot -c \
  "SELECT id, email, created_at FROM users WHERE email = 'test@example.com';"

# Expected: User record exists in database
# Verification: Data persisted correctly
```

### Pattern 2: Frontend Workflow Testing (Client-Side User Experience)

**What:** Test each user workflow by manually interacting with the browser UI, verifying user-facing behavior, navigation, state updates, and visual feedback.

**When to use:** All 10 frontend workflows (TEST-02)

**Example: Create Project Workflow**
```markdown
**TEST-02-01: Create Project Workflow**

**Steps:**
1. Open browser to http://localhost:5173
2. Observe dashboard loads with project tiles
3. Click "New Project" button (first tile in grid)
4. Fill in project form:
   - Research goal: "Test project for verification"
   - Output type: Literature Review
   - Audience: Academic
5. Click "Create Project" button
6. Observe navigation to project view
7. Verify project appears in dashboard

**Expected Results:**
- Step 3: Click triggers create project modal or form
- Step 5: Project creation success indicator (toast/notification)
- Step 6: Auto-navigation to newly created project view
- Step 7: Project tile visible in dashboard grid/list

**Actual Results:**
- [Document what happens - may differ from expected due to bugs]

**Pass/Fail:** PASS or FAIL + brief note
```

### Pattern 3: Responsive Design Testing (Desktop-First)

**What:** Verify layout and functionality work correctly at desktop viewport (1280px+). No mobile/tablet testing in this phase.

**When to use:** TEST-03 (desktop only)

**Approach:**
```markdown
**TEST-03: Responsive Design - Desktop (1280px+)**

**Setup:**
1. Open browser DevTools (F12)
2. Toggle Responsive Design Mode (Ctrl+Shift+M)
3. Set viewport to 1280x720 (desktop resolution)
4. Refresh page

**Verification Points:**
- Layout: 3-panel structure visible (Navigator, Workspace, Inspector)
- Navigation: All menu items accessible, no horizontal scroll
- Editor: TipTap toolbar and editing area fully visible
- Sidebar: AI chat panel expandable/collapsible
- Buttons: All interactive elements clickable, no overlap

**Test Results:**
- [Document observations for each flow at 1280px+]

**Deferred Testing:**
- Mobile (375px): Deferred to future phase
- Tablet (768px): Deferred to future phase
```

### Anti-Patterns to Avoid

- **Skipping backend verification:** Don't rely solely on frontend tests — backend APIs may work even if frontend UI broken
- **Assuming overlap coverage:** Even though authentication is tested in both backend and frontend, execute both tests separately as specified
- **Testing mobile/tablet:** This is desktop-first — don't waste time on 375px/768px testing now
- **Fixing bugs during testing:** This is testing-only phase — document issues, don't fix them (that's Phase 22)
- **Vague pass/fail notes:** "Works" is not helpful — "PASS: Creates project and navigates correctly" is clear

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| **Manual API testing scripts** | Custom bash/python test scripts | curl + existing pytest suite | Existing test_api.py already has patterns — follow them |
| **Test result documentation** | Custom formatting/structure | Markdown template (provided below) | Standard format ensures consistency and readability |
| **Responsive testing framework** | Custom viewport testing scripts | Browser DevTools Responsive Mode | Built-in, accurate, no setup needed |
| **Bug tracking during testing** | New bug tracking system | REQUIREMENTS.md BUG-XX references | Bugs already documented — reference them |
| **WebSocket connection testing** | Custom WebSocket clients | Browser DevTools WS tab + curl for HTTP endpoints | DevTools shows WebSocket frames, connection state |

**Key insight:** The testing infrastructure already exists. Leverage existing tools (pytest, curl, DevTools) rather than building custom test frameworks. The value is in systematic execution and documentation, not tooling.

## Common Pitfalls

### Pitfall 1: Confusing Backend vs Frontend Testing Scope

**What goes wrong:** Testing frontend workflows and calling it "backend testing" or vice versa.

**Why it happens:** Backend and frontend tests overlap (e.g., both test authentication, both test file upload). The line between "server operation" and "user experience" can blur.

**How to avoid:**
- **Backend tests (TEST-01):** Focus on API endpoints, database operations, file system, external APIs, WebSocket connections. Use curl/pytest directly against `http://localhost:8000/api/*`. Verify server responses, data persistence, error handling.
- **Frontend tests (TEST-02):** Focus on UI interactions, navigation, state management, visual feedback, user workflow. Use browser at `http://localhost:5173`. Verify buttons work, pages load correctly, state updates reflect in UI.
- **Overlap is intentional:** Test both even if they cover similar functionality — backend verifies server correctness, frontend verifies user experience.

**Warning signs:** Frontend test checklist mentions "clicking buttons" but backend test checklist does the same. Re-read test definitions: backend = server-side verification, frontend = client-side user experience.

### Pitfall 2: Fixing Bugs Instead of Documenting Them

**What goes wrong:** Tester encounters a bug, instinctively switches to "fix mode" and starts debugging/coding instead of documenting.

**Why it happens:** Developers are problem-solvers. Seeing broken functionality triggers "fix it" reflex.

**How to avoid:**
- **Testing mindset:** This phase is about observation and documentation, not correction.
- **Quick fix exception:** If a trivial one-line fix is obvious (e.g., typo in button handler), fix it and note it. Anything requiring investigation → document only.
- **Reference existing bugs:** Before documenting new issues, check REQUIREMENTS.md to see if it's already BUG-XX.
- **Document current + expected:** For failures, note what actually happens AND what should happen. This clarifies the fix for Phase 22.

**Warning signs:** Test execution takes 4 hours instead of 2 because tester keeps stopping to fix bugs. Phase 22 will be much longer because tester "already fixed some stuff" but didn't track it properly.

### Pitfall 3: Insufficient Detail in Test Results

**What goes wrong:** Test results say "PASS: Works" or "FAIL: Broken" with no specifics.

**Why it happens:** Tester assumes context is obvious, or wants to finish quickly.

**How to avoid:**
- **Step-by-step walkthroughs:** Document specific actions taken ("Click 'New Project' button", "Enter 'test query' in search box", etc.).
- **Pass notes:** Explain what worked ("PASS: Uploads PDF file, shows progress bar, file appears in list after upload completes").
- **Fail notes:** Reference bug ID if applicable ("FAIL: Returns 422 error - see BUG-01") or describe deviation ("FAIL: Button does nothing when clicked, should open create project modal").
- **Structure:** Use consistent format (see template below) so each test has same level of detail.

**Warning signs:** Test results document is 5 pages instead of 15, or planner can't understand what "FAIL: Doesn't work" means without opening browser.

### Pitfall 4: Testing Mobile/Tablet When Out of Scope

**What goes wrong:** Tester sees "responsive design" and instinctively checks 375px (mobile) and 768px (tablet) viewports.

**Why it happens:** Responsive design testing usually means "test all breakpoints". Old habits die hard.

**How to avoid:**
- **Read CONTEXT.md:** Explicitly defers mobile/tablet to future phase.
- **Desktop-first philosophy:** This is a research tool for desktop computers. Researchers don't write papers on phones.
- **Document deferred section:** Create "Deferred Testing" section in results explaining why mobile/tablet not tested.
- **Focus time on desktop:** Thoroughly test all 20 flows at 1280px+ instead of shallowly testing at 3 breakpoints.

**Warning signs:** Test results include screenshots of mobile layout or notes about "hamburger menu broken on iPhone".

### Pitfall 5: Not Verifying Data Persistence Independently

**What goes wrong:** Relying solely on API response to verify database operations.

**Why it happens:** curl shows 200 OK, tester assumes "it worked" without checking database.

**How to avoid:**
- **Direct database verification:** For critical operations (create, update, delete), use psql to verify data in database.
- **File system verification:** For file uploads, check actual file exists in storage directory.
- **Redis verification:** For WebSocket/caching, check Redis has expected keys.
- **Independence principle:** Don't trust API's word — verify side effects directly.

**Warning signs:** Backend tests all pass but file downloads return 404 (files not actually stored), or database has orphaned records (delete didn't work but API said 200 OK).

## Code Examples

### Backend Testing with curl

**Authentication Flow (Backend TEST-01-01):**
```bash
# Source: FastAPI backend testing best practices
# Context: Testing mock login and session persistence

# Step 1: Test login endpoint
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}' \
  -w "\nHTTP Status: %{http_code}\n"

# Expected output:
# {
#   "access_token": "eyJ...",
#   "token_type": "bearer",
#   "user": {...}
# }
# HTTP Status: 200

# Step 2: Extract token and test protected endpoint
TOKEN="eyJ..."  # From step 1 response
curl http://localhost:8000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"

# Expected: Array of project objects
# HTTP Status: 200

# Step 3: Verify session persistence
# Wait 5 seconds, make another request with same token
sleep 5
curl http://localhost:8000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"

# Expected: Still 200 OK (token not expired)
# HTTP Status: 200
```

**File Management Flow (Backend TEST-01-02):**
```bash
# Source: File API testing patterns
# Context: Testing file upload, metadata extraction, download

# Step 1: Upload test PDF file
curl -X POST http://localhost:8000/api/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test_document.pdf" \
  -F "project_id=test-project-123" \
  -w "\nHTTP Status: %{http_code}\n"

# Expected output:
# {
#   "id": "file-abc-123",
#   "filename": "test_document.pdf",
#   "file_type": "pdf",
#   "size": 12345,
#   "metadata": {
#     "pages": 15,
#     "title": "Test Document",
#     ...
#   }
# }
# HTTP Status: 200

# Step 2: List files in project
curl "http://localhost:8000/api/files?project_id=test-project-123" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"

# Expected: Array containing uploaded file
# HTTP Status: 200

# Step 3: Download file by ID
curl http://localhost:8000/api/files/file-abc-123/download \
  -H "Authorization: Bearer $TOKEN" \
  -o downloaded_test.pdf \
  -w "\nHTTP Status: %{http_code}\n"

# Expected: Binary PDF content saved to downloaded_test.pdf
# HTTP Status: 200

# Step 4: Verify file exists in storage
ls -lh backend/storage/uploads/test-project-123/

# Expected: test_document.pdf present in directory
```

**Literature Search Flow (Backend TEST-01-04):**
```bash
# Source: Literature API testing patterns
# Context: Testing Semantic Scholar integration, PDF finding

# Step 1: Search for papers
curl "http://localhost:8000/api/literature/search?q=quantum+computing&limit=5" \
  -H "Authorization: Bearer $TOKEN" \
  -w "\nHTTP Status: %{http_code}\n"

# Expected output (if BUG-01 fixed):
# {
#   "papers": [
#     {
#       "id": "doi:10.1234...",
#       "title": "Quantum Computing Advances",
#       "authors": ["Author 1", "Author 2"],
#       "year": 2024,
#       "citation_count": 42,
#       "abstract": "...",
#       "openaccess_pdf": {...}
#     },
#     ...
#   ],
#   "total": 1234
# }
# HTTP Status: 200

# Actual output (BUG-01 present):
# {"detail": [{"type": "missing", "loc": ["query", "limit"], "msg": "Field required"}]}
# HTTP Status: 422

# Step 2: Import specific paper by ID
curl -X POST http://localhost:8000/api/literature/import \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paper_id": "doi:10.1234...", "project_id": "test-project-123"}' \
  -w "\nHTTP Status: %{http_code}\n"

# Expected: Paper record created in database
# HTTP Status: 200

# Step 3: Verify paper in database
psql -U research_user -d research_pilot -c \
  "SELECT id, title, year FROM papers WHERE id = 'doi:10.1234...';"

# Expected: Paper row exists with metadata
```

### Frontend Testing with Browser Workflows

**Create Project Workflow (Frontend TEST-02-01):**
```markdown
**Frontend TEST-02-01: Create Project User Workflow**

**Preconditions:**
- Browser open to http://localhost:5173
- User logged in (mock authentication)
- Dashboard visible

**Steps:**
1. **Locate "New Project" tile**
   - Action: Look for first tile in project grid/list
   - Expected: "New Project" tile visible at top of grid (BUG-11: currently at end)
   - Actual: [Describe what you see]

2. **Click "New Project" button**
   - Action: Click on "New Project" tile/button
   - Expected: Create project modal/form opens or inline form appears
   - Actual: [Describe what happens]

3. **Fill project details**
   - Action: Enter research goal, select output type, select audience
   - Expected: Form accepts input, validation works
   - Actual: [Describe form behavior]

4. **Submit project creation**
   - Action: Click "Create Project" / "Save" button
   - Expected: Loading indicator, then success notification
   - Actual: [Describe loading/success behavior]

5. **Verify navigation**
   - Action: Wait for redirect/navigation
   - Expected: Auto-navigation to newly created project view (BUG-10: doesn't navigate)
   - Actual: [Describe navigation behavior]

6. **Verify project in dashboard**
   - Action: Navigate back to dashboard (if auto-navigation didn't happen)
   - Expected: New project tile visible in grid/list
   - Actual: [Describe project visibility]

**Test Result:**
- **Status:** PASS / FAIL
- **Note:** [One-sentence summary, e.g., "FAIL: Creates project but doesn't navigate - see BUG-10"]
```

**TipTap Editor Workflow (Frontend TEST-02-03):**
```markdown
**Frontend TEST-02-03: Write and Format Text in TipTap Editor**

**Preconditions:**
- Project exists
- Document created and open in editor
- TipTap editor loaded

**Steps:**
1. **Enter text content**
   - Action: Type "This is a test document for verification testing."
   - Expected: Text appears in editor, no lag, cursor visible
   - Actual: [Describe typing experience]

2. **Format text as bold**
   - Action: Select text, click "B" (bold) button in toolbar
   - Expected: Selected text becomes bold, toolbar button shows active state
   - Actual: [Describe bold formatting]

3. **Format text as italic**
   - Action: Select different text, click "I" (italic) button
   - Expected: Selected text becomes italic
   - Actual: [Describe italic formatting]

4. **Create heading**
   - Action: Place cursor at new line, select "Heading 1" from dropdown
   - Expected: Line becomes large heading, dropdown shows "Heading 1"
   - Actual: [Describe heading creation]

5. **Create bulleted list**
   - Action: Click bullet list button, type list items, press Enter
   - Expected: Each new line is bulleted, press Enter twice to exit list
   - Actual: [Describe list behavior]

6. **Verify auto-save**
   - Action: Wait 4 seconds (auto-save debounce), check DevTools Network tab
   - Expected: POST request to `/api/documents/{id}/save` with document content
   - Actual: [Describe auto-save behavior - check DevTools Network tab]

7. **Verify connection status**
   - Action: Look at editor toolbar for connection indicator
   - Expected: "Connected" or "Live" indicator (BUG-14: shows "offline")
   - Actual: [Describe connection status display]

**Test Result:**
- **Status:** PASS / FAIL
- **Note:** [One-sentence summary, e.g., "FAIL: Editor shows 'offline' status - see BUG-14"]
```

### Test Results Document Template

```markdown
# Phase 21: Complete Verification Testing - Test Results

**Testing Date:** 2026-02-08
**Tester:** [Name]
**Environment:** Development (localhost:8000 backend, localhost:5173 frontend)
**Scope:** 10 backend flows + 10 frontend workflows + desktop responsive design

## Executive Summary

- **Backend Tests:** X/10 PASS (Y FAIL)
- **Frontend Tests:** X/10 PASS (Y FAIL)
- **Responsive Tests:** PASS/FAIL (desktop 1280px+)
- **Known Bugs Referenced:** 22 bugs (6 P0, 12 P1, 6 P2) from REQUIREMENTS.md

### Quick Reference

| Test ID | Test Name | Status | Bug Reference |
|---------|-----------|--------|---------------|
| TEST-01-01 | Authentication Flow | PASS/FAIL | BUG-XX (if applicable) |
| TEST-01-02 | File Management Flow | PASS/FAIL | BUG-XX (if applicable) |
... (continue for all 20 tests)

## Known Bugs Summary

**Total Bugs:** 22 documented in REQUIREMENTS.md

**P0 Blockers (6):**
- BUG-01: Literature Search API 422 error
- BUG-02: Analysis Execution API 404 error
- BUG-03: Project Navigation - click project to enter
- BUG-04: File Download 404 error
- BUG-05: Bibliography API 404 error
- BUG-06: Citation Search API 422 error

**P1 Major Issues (12):**
- BUG-07 through BUG-17A: [List briefly]

**P2 Minor Issues (6):**
- BUG-18 through BUG-21: [List briefly]

**Full details:** See REQUIREMENTS.md sections BUG-01 through BUG-21

---

## TEST-01: Backend Flows (Server-Side Operations)

### TEST-01-01: Authentication Flow

**Purpose:** Verify mock login works, session persists across refresh

**Preconditions:**
- Backend server running on http://localhost:8000
- PostgreSQL database running
- Mock authentication configured in backend/.env

**Test Steps:**

1. **Test login endpoint**
   ```bash
   curl -X POST http://localhost:8000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "password": "test123"}'
   ```
   - **Expected:** HTTP 200, response contains `access_token` and `user` object
   - **Actual:** [Document response code and body]
   - **Status:** ✅ PASS / ❌ FAIL

2. **Test protected endpoint with token**
   ```bash
   curl http://localhost:8000/api/projects \
     -H "Authorization: Bearer <TOKEN_FROM_STEP_1>"
   ```
   - **Expected:** HTTP 200, returns array of projects
   - **Actual:** [Document response]
   - **Status:** ✅ PASS / ❌ FAIL

3. **Test session persistence**
   - Wait 10 seconds, repeat step 2 with same token
   - **Expected:** Still returns HTTP 200 (token not expired)
   - **Actual:** [Document response]
   - **Status:** ✅ PASS / ❌ FAIL

4. **Verify database record**
   ```bash
   psql -U research_user -d research_pilot -c \
     "SELECT id, email, created_at FROM users WHERE email = 'test@example.com';"
   ```
   - **Expected:** User row exists in `users` table
   - **Actual:** [Document query result or "N/A - table doesn't exist"]
   - **Status:** ✅ PASS / ❌ FAIL / ⚠️ N/A (mock auth may not persist users)

**Test Result:**
- **Overall Status:** ✅ PASS / ❌ FAIL
- **Note:** [One-sentence summary, e.g., "PASS: Login works, tokens persist, no database verification needed for mock auth"]
- **Bug References:** [List any BUG-XX IDs encountered]

---

### TEST-01-02: File Management Flow

**Purpose:** Verify upload 8 file types, delete, organize files

**Preconditions:**
- Backend server running
- Valid auth token (from TEST-01-01)
- Test project ID available

**Test Steps:**

1. **Upload PDF file**
   ```bash
   curl -X POST http://localhost:8000/api/files/upload \
     -H "Authorization: Bearer $TOKEN" \
     -F "file=@test.pdf" \
     -F "project_id=$PROJECT_ID"
   ```
   - **Expected:** HTTP 200, returns file ID and metadata (pages, title)
   - **Actual:** [Document response - may be 404 due to BUG-04]
   - **Status:** ✅ PASS / ❌ FAIL

2. **Upload DOCX file**
   - Repeat with .docx file
   - **Expected:** HTTP 200, extracts document metadata
   - **Actual:** [Document response]
   - **Status:** ✅ PASS / ❌ FAIL

3. **List files in project**
   ```bash
   curl "http://localhost:8000/api/files?project_id=$PROJECT_ID" \
     -H "Authorization: Bearer $TOKEN"
   ```
   - **Expected:** HTTP 200, returns array with uploaded files
   - **Actual:** [Document response - check BUG-17: Recent Files Display]
   - **Status:** ✅ PASS / ❌ FAIL

4. **Download uploaded file**
   ```bash
   curl http://localhost:8000/api/files/$FILE_ID/download \
     -H "Authorization: Bearer $TOKEN" \
     -o downloaded.pdf
   ```
   - **Expected:** HTTP 200, binary file content, file saved to disk
   - **Actual:** [Document response - may be 404 due to BUG-04]
   - **Status:** ✅ PASS / ❌ FAIL

5. **Delete file**
   ```bash
   curl -X DELETE http://localhost:8000/api/files/$FILE_ID \
     -H "Authorization: Bearer $TOKEN"
   ```
   - **Expected:** HTTP 200, file removed from storage
   - **Actual:** [Document response]
   - **Status:** ✅ PASS / ❌ FAIL

**Test Result:**
- **Overall Status:** ✅ PASS / ❌ FAIL
- **Note:** [One-sentence summary, e.g., "FAIL: Upload works but download returns 404 - see BUG-04"]
- **Bug References:** BUG-04 (File Download 404), BUG-17 (Recent Files Display)

---

[Continue for TEST-01-03 through TEST-01-10 following same pattern]

---

## TEST-02: Frontend Workflows (Client-Side User Experience)

### Frontend TEST-02-01: Create Project Workflow

[Use detailed step-by-step format shown in "Code Examples" section above]

**Test Result:**
- **Overall Status:** ✅ PASS / ❌ FAIL
- **Note:** [One-sentence summary]
- **Bug References:** BUG-03 (Project Navigation), BUG-10 (Auto-navigate), BUG-11 (New Project tile position)

---

[Continue for TEST-02-02 through TEST-02-10 following same pattern]

---

## TEST-03: Responsive Design (Desktop Only)

### TEST-03: Desktop Viewport (1280px+)

**Purpose:** Verify layout and functionality work correctly at desktop viewport

**Scope:** Desktop testing only (1280px+). Mobile (375px) and tablet (768px) deferred to future phase.

**Setup:**
1. Open browser to http://localhost:5173
2. Open DevTools (F12)
3. Toggle Responsive Design Mode (Ctrl+Shift+M)
4. Set viewport to 1280x720

**Test Checklist:**

- **Layout Structure**
  - [ ] 3-panel layout visible (Navigator, Workspace, Inspector)
  - [ ] No horizontal scrollbar
  - [ ] All panels sized appropriately (not too narrow/cramped)

- **Navigation**
  - [ ] All menu items clickable
  - [ ] Dropdown menus work correctly
  - [ ] Project tiles in dashboard display correctly

- **Editor View**
  - [ ] TipTap toolbar fully visible
  - [ ] Editing area has sufficient space
  - [ ] Formatting buttons accessible

- **Sidebar Panels**
  - [ ] File explorer usable
  - [ ] AI chat panel expandable/collapsible
  - [ ] Analysis code pane fills available space (BUG-15: too small)

- **Interactive Elements**
  - [ ] Buttons not overlapping
  - [ ] Inputs have sufficient width
  - [ ] Modals display correctly
  - [ ] Toasts/notifications visible

**Test Result:**
- **Overall Status:** ✅ PASS / ❌ FAIL
- **Note:** [One-sentence summary]
- **Bug References:** BUG-15 (Analysis Code Pane Size)

### Deferred Testing

**Mobile (375px):** Deferred to future phase
**Tablet (768px):** Deferred to future phase

**Rationale:** This is a desktop-first research web application. Researchers use desktop computers for writing papers, analyzing data, and managing literature. Mobile and tablet support are future enhancements, not v1.2 MVP scope.

---

## Testing Notes and Observations

### General Observations
- [Document any patterns noticed across multiple tests]
- [Note any systemic issues not captured by individual bug IDs]
- [Record any workarounds discovered during testing]

### New Bugs Discovered
- [If any new bugs found during testing (not in REQUIREMENTS.md), document here]
- [Include: Brief description, severity assessment, which test revealed it]

### Testing Environment
- **Backend Version:** 3.0.0 (from server.py)
- **Frontend:** React 19 + Vite
- **Browser:** [Browser name and version used for testing]
- **Database:** PostgreSQL [version]
- **Redis:** [version]

### Time Tracking
- **Backend Testing:** [Hours spent]
- **Frontend Testing:** [Hours spent]
- **Documentation:** [Hours spent]
- **Total:** [Hours spent]

---

## Sign-Off

**Tester:** [Name]
**Date:** 2026-02-08
**Status:** COMPLETE / INCOMPLETE

**Ready for Phase 22 (Bug Fixes):** YES / NO

**Comments:** [Any additional context for next phase]
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual testing without documentation | Structured test results with pass/fail tracking | Ongoing (Phase 21) | Creates clear baseline before bug fixes |
| Ad-hoc bug discovery | Systematic flow verification | Ongoing (Phase 21) | Ensures all core functionality tested |
| Mixed frontend/backend testing | Separated server vs client testing | Phase 21 (current) | Clarifies where bugs occur (server vs UI) |

**Current Best Practices (2026):**
- **Backend testing:** Use curl for manual API verification, pytest for automated tests, direct database queries for persistence verification
- **Frontend testing:** Browser DevTools for state/network inspection, manual user workflow verification, React DevTools for component debugging
- **Responsive testing:** Use browser DevTools Responsive Mode, test desktop-first for research tools
- **Test documentation:** Markdown format with step-by-step walkthroughs, clear pass/fail status, bug references

**Deprecated/outdated:**
- **Monolithic test scripts:** Modern approach uses modular API routers (file_api.py, document_api.py, etc.) — test each module independently
- **Screenshot-heavy documentation:** Text-only results preferred (as per CONTEXT.md) — screenshots add noise and can't be searched
- **Waterfall testing (backend then frontend):** Parallel testing approach is more efficient — backend and frontend can be tested simultaneously

## Open Questions

### Resolved During Research

**Q1: Should backend and frontend testing happen sequentially or in parallel?**
**Answer:** Parallel. CONTEXT.md explicitly states "Parallel testing — backend API tests and frontend browser testing happen in parallel, results documented together." This is more efficient and allows server-side and client-side issues to be identified independently.

**Q2: How to handle overlap between backend and frontend tests (e.g., authentication)?**
**Answer:** Test both separately. Backend verifies API endpoints work correctly (HTTP status codes, response format, database persistence). Frontend verifies UI works correctly (buttons, navigation, state updates, user experience). Even though both test "authentication," they test different aspects.

**Q3: Should mobile/tablet testing be done now or deferred?**
**Answer:** Deferred. CONTEXT.md explicitly defers 375px (mobile) and 768px (tablet) testing to future phase. This is desktop-first research web app. Create "Deferred Testing" section in results document explaining why.

### Unresolved (Low Priority)

**Q4: Should we use existing pytest tests (test_api.py) or write new curl-based tests?**
**Answer:** Use both. Existing pytest tests provide automated verification. curl tests provide manual verification and help understand API behavior. For Phase 21, manual curl testing is more aligned with "detailed steps and observations" requirement. pytest tests can be referenced but not relied upon exclusively.

**Q5: How detailed should "step-by-step walkthrough" be?**
**Answer:** Balance thoroughness with verbosity. Each step should have:
- Action taken (specific command or UI interaction)
- Expected result (what should happen)
- Actual result (what actually happened)
- Status (PASS/FAIL for that step)

Avoid excessive detail like "move mouse to coordinates (x,y)" unless relevant. Focus on user-visible actions and observable outcomes.

## Sources

### Primary (HIGH confidence)
- **Existing codebase:** backend/server.py, backend/*_api.py files (9 API routers with 66 routes)
- **Existing test suite:** backend/tests/test_api.py (pytest patterns for FastAPI testing)
- **CONTEXT.md:** Phase 21 decisions and constraints
- **REQUIREMENTS.md:** Bug list (BUG-01 through BUG-21) with descriptions and expected behavior

### Secondary (MEDIUM confidence)
- [Comprehensive Guide On Mastering FastAPI](https://technostacks.com/blog/mastering-fastapi-a-comprehensive-guide-and-best-practices/) - FastAPI testing best practices, pytest integration (February 19, 2024)
- [How to Build POST Endpoints in FastAPI: A Complete Guide](https://www.browserstack.com/guide/fastapi-post) - POST endpoint testing with curl and Pydantic models (September 17, 2025)
- [Checklist for Manual Testing of React Components](https://www.uxpin.com/studio/blog/checklist-for-manual-testing-of-react-components/) - Frontend testing checklist (November 3, 2025)
- [React Testing Tutorial: How to Test React Apps](https://www.testmuai.com/blog/react-testing-tutorial/) - Current 2026 React testing methods (January 12, 2026)

### Tertiary (LOW confidence)
- [Best Python API Development Tools 2026](https://medium.com/@inprogrammer/best-python-api-development-tools-2026-complete-developer-guide-a50a5e8de185) - Python API tooling (2026)
- [New Front-End Development Tools in 2026](https://www.refontelearning.com/blog/new-front-end-development-tools-in-2026-a-comprehensive-guide) - Frontend tooling trends (February 7, 2026)

**Note:** WebSearch reached monthly usage limit during research. Additional verification via official documentation was not possible for some queries. However, codebase inspection and existing test patterns provided sufficient high-confidence guidance.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Based on existing codebase (backend/tests/test_api.py, 9 API routers)
- Architecture: HIGH - Inspected actual code structure (server.py, * _api.py files, frontend components)
- Pitfalls: MEDIUM - Based on testing best practices and CONTEXT.md decisions, some common sense extrapolation
- Code examples: HIGH - Adapted from existing test_api.py patterns and CONTEXT.md requirements

**Research date:** 2026-02-08
**Valid until:** 14 days (testing methodologies are stable, but codebase may change rapidly during Phase 22 bug fixes)

**Next steps:** Planner should use this research to create executable test plans for TEST-01 (backend flows), TEST-02 (frontend workflows), and TEST-03 (responsive design). Focus on practical, actionable guidance for manual testing with detailed documentation.
