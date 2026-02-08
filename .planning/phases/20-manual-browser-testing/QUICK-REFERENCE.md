# Quick Reference: Manual Browser Testing

## 🚀 Quick Start

**Servers are running:**
- Backend: http://localhost:8000 ✅
- Frontend: http://localhost:3000 ✅

**Open browser →** http://localhost:3000

---

## 📋 Test Flows (Quick Checklist)

### Core Workflows (1-5)

- [ ] **Flow 1:** Create New Project
  - Click "New Project" → Enter goal → Select type → Submit
  - Verify: Project appears in dashboard

- [ ] **Flow 2:** Upload Files
  - Go to Files → Upload PDF, DOCX, CSV
  - Test: Drag-drop, large file (>50MB) error

- [ ] **Flow 3:** Write and Format Text
  - Go to Editor → Type text
  - Test: Bold, Italic, Underline, Link, Quote, List, Font size

- [ ] **Flow 4:** Citations and Bibliography
  - In Editor → Click "Insert Citation" → Search → Insert
  - Verify: Bibliography appears below, format changes work

- [ ] **Flow 5:** Search Literature
  - Go to Library → Search "climate change"
  - Verify: Paper details, source badges, PDF button, empty state

### Advanced Features (6-10)

- [ ] **Flow 6:** Data Analysis
  - Go to Analysis → Enter `print("Hello, World!")` → Execute
  - Verify: Output appears, download buttons work

- [ ] **Flow 7:** Export Documents
  - In Editor → Add content → Export PDF → Export DOCX
  - Verify: Files download and contain content

- [ ] **Flow 8:** AI Chat
  - In Editor → Test all 4 agents
  - Verify: Responses appear, history persists

- [ ] **Flow 9:** WebSocket Status
  - Look at editor toolbar → Should show "Live" (green)
  - Stop backend → Should show "Offline" (red)
  - Restart backend → Should return to "Live" (green)

- [ ] **Flow 10:** Auto-Save
  - Open document → Type text → Wait 4+ seconds
  - Verify: Status changes (Saved → Unsaved → Saving → Saved)
  - Refresh page → Verify content persists

---

## 📱 Responsive Testing (DevTools: F12 → Ctrl+Shift+M)

### Desktop (1280px+)
- [ ] Full sidebar + main content + AI chat visible
- [ ] No horizontal scroll
- [ ] Sidebar shows icons + text
- [ ] AI chat on right

### Tablet (768-1279px)
- [ ] Set to 1024x768
- [ ] Sidebar collapses to icons-only
- [ ] No horizontal scroll
- [ ] Sidebar expand/collapse works

### Mobile (<768px)
- [ ] Set to 375x667 (iPhone SE)
- [ ] Hamburger menu appears
- [ ] Drawer slides in from left
- [ ] AI chat hidden
- [ ] No horizontal scroll
- [ ] All views work: Dashboard, Files, Library, Editor, Analysis, Memory

---

## 📝 Recording Results

**File:** `.planning/phases/20-manual-browser-testing/20-01-RESULTS.md`

**For each step:**
- ✅ PASS: Change `[ ]` to `[X]`
- ❌ FAIL: Leave `[ ]` and add notes

**At the end:**
1. Count passed/failed flows
2. Calculate pass rate
3. List bugs with severity (P0/P1/P2/P3)
4. Provide Go/No-Go recommendation

---

## 🐛 Bug Severity

- **P0** - Critical: Blocks release, must fix
- **P1** - High: Major broken, should fix
- **P2** - Medium: Workaround exists
- **P3** - Low: Minor/cosmetic

---

## 📁 Files Reference

- **Results:** `.planning/phases/20-manual-browser-testing/20-01-RESULTS.md`
- **Instructions:** `.planning/phases/20-manual-browser-testing/TESTING-INSTRUCTIONS.md`
- **Test Plan:** `.planning/phases/14-production-polish/14-03-TEST-PLAN.md`
- **Status:** `.planning/phases/20-manual-browser-testing/README.md`

---

## ⏱️ Time Estimate

- **Quick test:** 1-2 hours (critical flows only)
- **Full test:** 2-4 hours (all flows + responsive)
- **Per flow:** 10-15 minutes average

---

## ✅ Completion Criteria

- [ ] All 10 flows tested
- [ ] Responsive verified at 3 viewports
- [ ] Results recorded in 20-01-RESULTS.md
- [ ] Pass/fail counts calculated
- [ ] Go/no-go recommendation provided

---

## 🎯 Focus Areas (If Time-Constrained)

**Priority 1 (Must Test):**
1. Flow 1: Create Project
2. Flow 3: Editor formatting
3. Flow 4: Citations
4. Flow 8: AI chat
5. Responsive mobile

**Priority 2 (Should Test):**
6. Flow 2: File upload
7. Flow 5: Literature search
8. Flow 10: Auto-save

**Priority 3 (Nice to Have):**
9. Flow 6: Analysis
10. Flow 7: Export
11. Flow 9: WebSocket
12. Responsive tablet/desktop

---

**Ready to test? Open http://localhost:3000 and follow the checklist!**
