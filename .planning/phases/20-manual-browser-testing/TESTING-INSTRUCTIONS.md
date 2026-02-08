# Manual Browser Testing Instructions

## Current Status

**Phase:** 20-manual-browser-testing
**Plan:** 01 - Execute Manual Browser Testing
**Date:** 2026-02-08

### Services Running

- ✅ **Backend Server:** Running on http://localhost:8000
  - API Version: 3.0.0
  - Status: Healthy
  - Features: PostgreSQL, Redis, WebSocket, Orchestration

- ✅ **Frontend Server:** Running on http://localhost:3000
  - Dev Server: Vite
  - Status: Running (PID: 119153)

## Testing Checklist

### Task 1: Verify Test Environment ✅

- [x] Backend server starts on port 8000
- [x] Frontend server starts on port 3000
- [x] API health check returns healthy
- [ ] Application loads in browser (YOUR ACTION REQUIRED)

### Task 2: Execute Test Flows 1-5 (Core Workflows)

**Open your browser to:** http://localhost:3000

For each flow, follow the test steps and record results in `20-01-RESULTS.md`:

#### Flow 1: Create New Project
1. Look for "New Project" button on dashboard
2. Click it and verify modal/form appears
3. Enter a research goal (min 10 characters)
4. Select output type from dropdown
5. Submit form
6. Verify new project appears in dashboard

**Record results:** Mark [X] for PASS, leave [ ] for FAIL in `20-01-RESULTS.md`

#### Flow 2: Upload Files
1. Navigate to Files view (click Files in sidebar)
2. Upload a PDF file
3. Upload a DOCX file
4. Upload a CSV file
5. Try uploading a file > 50MB (should show error)
6. Test drag-drop file upload

**Record results:** Update Flow 2 section in `20-01-RESULTS.md`

#### Flow 3: Write and Format Text in TipTap Editor
1. Navigate to Editor view
2. Type plain text
3. Test Bold, Italic, Underline buttons
4. Test Link, Quote, Bullet List buttons
5. Change font size from dropdown

**Record results:** Update Flow 3 section in `20-01-RESULTS.md`

#### Flow 4: Insert Citations and Generate Bibliography
1. In Editor, click "Insert Citation" button
2. Search for papers (try "machine learning")
3. Click on a paper result to insert citation
4. Verify citation appears in document
5. Check bibliography section below editor
6. Change citation format (APA → MLA → Chicago)

**Record results:** Update Flow 4 section in `20-01-RESULTS.md`

#### Flow 5: Search Literature and Import Papers
1. Navigate to Library view
2. Search for "climate change"
3. Verify paper details (title, authors, year, abstract)
4. Check source badges (arXiv = orange, Semantic Scholar = blue)
5. Click PDF button on a paper with PDF
6. Try a search that returns no results

**Record results:** Update Flow 5 section in `20-01-RESULTS.md`

### Task 3: Execute Test Flows 6-10 (Advanced Features)

#### Flow 6: Execute Data Analysis and View Results
1. Navigate to Analysis view
2. Enter Python code: `print("Hello, World!")`
3. Click "Execute" button
4. Verify output appears
5. Try code with error to see error handling
6. Check download buttons (CSV, PNG, TXT)

**Record results:** Update Flow 6 section in `20-01-RESULTS.md`

#### Flow 7: Export Documents to PDF and DOCX
1. In Editor, create/add some content
2. Click Export dropdown
3. Select "Export as PDF"
4. Verify PDF downloads and contains content
5. Select "Export as DOCX"
6. Verify DOCX downloads and contains content

**Record results:** Update Flow 7 section in `20-01-RESULTS.md`

#### Flow 8: Chat with AI Assistant (All Agent Types)
1. In Editor, locate AI chat sidebar on the right
2. Test Document agent: "Summarize my document"
3. Test Literature agent: "Find papers on AI"
4. Test Memory agent: "What have I researched?"
5. Test General agent: "Hello"
6. Verify chat history persists

**Record results:** Update Flow 8 section in `20-01-RESULTS.md`

#### Flow 9: Verify WebSocket Connection Status Indicator
1. Look at editor toolbar for connection status (should show "Live" in green)
2. Open browser console (F12) and check for WebSocket logs
3. Stop backend server (Ctrl+C in backend terminal)
4. Verify status changes to "Offline" (red)
5. Restart backend server
6. Verify status returns to "Live" (green)

**Record results:** Update Flow 9 section in `20-01-RESULTS.md`

#### Flow 10: Test Auto-Save Functionality
1. Open a document in Editor
2. Check initial save status (should show "Saved")
3. Type text in editor
4. Wait for status to change (should show "Unsaved" then "Saving...")
5. Wait 4+ seconds for auto-save to complete
6. Verify status returns to "Saved"
7. Refresh browser page and verify content persists

**Record results:** Update Flow 10 section in `20-01-RESULTS.md`

### Task 4: Verify Responsive Design Across Viewports

**Open Browser DevTools:** Press F12, then click Device Toolbar icon (or Ctrl+Shift+M)

#### Desktop (1280px+)
1. Set viewport to 1280x720
2. Verify: Full sidebar + main content + AI chat panel all visible
3. Verify: No horizontal scroll
4. Verify: Sidebar navigation shows icons + text
5. Verify: AI sidebar visible on right

**Record results:** Update Desktop section in `20-01-RESULTS.md`

#### Tablet (768px - 1279px)
1. Set viewport to 1024x768
2. Verify: Sidebar collapses to icons-only
3. Verify: Main content + AI chat still visible
4. Verify: No horizontal scroll
5. Click sidebar to verify expand/collapse works

**Record results:** Update Tablet section in `20-01-RESULTS.md`

#### Mobile (< 768px)
1. Set viewport to 375x667 (iPhone SE)
2. Verify: Hamburger menu appears in top-left
3. Click hamburger and verify drawer slides in from left
4. Verify: AI chat is hidden on mobile
5. Verify: Content stacks vertically
6. Verify: No horizontal scroll
7. Test all main views: Dashboard, Files, Library, Editor, Analysis, Memory

**Record results:** Update Mobile section in `20-01-RESULTS.md`

## How to Record Results

1. Open `20-01-RESULTS.md` in your editor
2. For each step that works, change `[ ]` to `[X]` in the Status column
3. For each step that fails, leave `[ ]` and add notes in the Notes column
4. At the end, update the Pass/Fail Summary counts
5. Add any bugs found to the Bugs Found section
6. Provide Go/No-Go recommendation

## Bug Severity Levels

- **P0** - Critical: Blocks core functionality, must fix before release
- **P1** - High: Major functionality broken, should fix before release
- **P2** - Medium: Workaround available, fix desirable
- **P3** - Low: Minor issue, cosmetic or edge case

## Completion Criteria

Phase 20 is complete when:
- [ ] All 10 test flows executed with documented results
- [ ] Responsive design verified at 3 viewports
- [ ] All checkboxes in test plan filled
- [ ] Pass/fail counts calculated
- [ ] Go/no-go recommendation provided
- [ ] If NO-GO: bugs documented with P0/P1/P2/P3 severity

## After Testing

Once you've completed all manual testing:

1. Update `20-01-RESULTS.md` with your findings
2. Commit the results: `git add 20-01-RESULTS.md && git commit -m "docs(20-01): complete test execution results"`
3. Let me know the results, and I'll create the SUMMARY.md

## Next Steps

- **If GO:** Proceed to production deployment
- **If NO-GO:** Create gap closure plans for critical bugs

---

**Need Help?**
- Check the test plan: `.planning/phases/14-production-polish/14-03-TEST-PLAN.md`
- Reference the implementation: `frontend3/src/views/`
- Backend API docs: http://localhost:8000/docs

**Estimated Time:** 2-4 hours for complete testing
