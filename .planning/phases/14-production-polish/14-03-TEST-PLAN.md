# Test Plan: Research Pilot v1.1 Manual Browser Testing

**Plan:** 14-03 - Manual Browser Testing for All User Flows
**Created:** 2026-02-07
**Tester:** [To be filled during testing]
**Test Environment:** Local development (localhost)

## Test Environment Setup

### Prerequisites
1. Backend server running on port 8000
2. Frontend dev server running on port 3000
3. PostgreSQL and Redis services running
4. At least one LLM API key configured (OpenAI, Gemini, Mistral, or Groq)

### Setup Steps

| Step | Command | Expected Result | Status |
|------|---------|-----------------|--------|
| 1 | `cd backend && source venv/bin/activate && python server.py` | Server starts on http://localhost:8000 | [ ] |
| 2 | `cd frontend3 && npm run dev` | Dev server starts on http://localhost:3000 | [ ] |
| 3 | `curl http://localhost:8000/api/` | Returns: `{"message":"Research Pilot API","status":"healthy"}` | [ ] |
| 4 | Open browser to http://localhost:3000 | Application loads, shows login screen then dashboard | [ ] |

---

## Test Flows

### Flow 1: Create New Project

**Purpose:** Verify user can create a new research project

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|--------|
| 1.1 | Click "New Project" button | Project creation modal/form appears | | [ ] |
| 1.2 | Enter research goal (min 10 chars) | Input accepts text | | [ ] |
| 1.3 | Select output type (dropdown) | Options: literature_review, research_paper, etc. | | [ ] |
| 1.4 | (Optional) Add audience | Input accepts text | | [ ] |
| 1.5 | Submit form | Success message, new project appears in dashboard | | [ ] |
| 1.6 | Verify project in database | Project visible in dashboard list | | [ ] |

**Overall Status:** [ ] PASS / [ ] FAIL

**Notes:**
-

---

### Flow 2: Upload Files

**Purpose:** Verify file upload functionality for supported formats

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|--------|
| 2.1 | Navigate to Files view | Files page loads, shows existing files (if any) | | [ ] |
| 2.2 | Click "Upload Files" button | File picker dialog opens | | [ ] |
| 2.3 | Select a PDF file | File uploads, progress indicator shows | | [ ] |
| 2.4 | Verify file appears in list | PDF shows with name, size, upload date, type badge | | [ ] |
| 2.5 | Upload a DOCX file | File uploads successfully | | [ ] |
| 2.6 | Upload a CSV file | File uploads successfully | | [ ] |
| 2.7 | Try uploading file > 50MB | Error message about file size limit | | [ ] |
| 2.8 | Drag-drop a file to upload | File uploads with visual feedback | | [ ] |

**Overall Status:** [ ] PASS / [ ] FAIL

**Notes:**
-

---

### Flow 3: Write and Format Text in TipTap Editor

**Purpose:** Verify rich text editing capabilities

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|--------|
| 3.1 | Click "New Document" or navigate to Editor view | Editor loads with empty document | | [ ] |
| 3.2 | Type plain text | Text appears in editor | | [ ] |
| 3.3 | Select text and click "Bold" | Text becomes bold | | [ ] |
| 3.4 | Select text and click "Italic" | Text becomes italic | | [ ] |
| 3.5 | Select text and click "Underline" | Text becomes underlined | | [ ] |
| 3.6 | Click "Link" button and enter URL | Link is created on selected text | | [ ] |
| 3.7 | Click "Quote" button | Selected text becomes blockquote | | [ ] |
| 3.8 | Click "Bullet List" button | Bulleted list is created | | [ ] |
| 3.9 | Change font size (dropdown) | Text size changes (sm/base/lg/xl) | | [ ] |

**Overall Status:** [ ] PASS / [ ] FAIL

**Notes:**
-

---

### Flow 4: Insert Citations and Generate Bibliography

**Purpose:** Verify citation insertion and bibliography generation

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|--------|
| 4.1 | In Editor, click "Insert Citation" button | Citation search modal opens | | [ ] |
| 4.2 | Enter search query (e.g., "machine learning") | Search results appear with loading state | | [ ] |
| 4.3 | Click on a paper result | Citation inserts at cursor position | | [ ] |
| 4.4 | Verify citation format | Citation appears in selected format (APA default) | | [ ] |
| 4.5 | Insert multiple citations | All citations appear in document | | [ ] |
| 4.6 | Scroll to bibliography section | Bibliography appears below editor | | [ ] |
| 4.7 | Change citation format (MLA, Chicago) | Bibliography updates to new format | | [ ] |

**Overall Status:** [ ] PASS / [ ] FAIL

**Notes:**
-

---

### Flow 5: Search Literature and Import Papers

**Purpose:** Verify literature search functionality

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|--------|
| 5.1 | Navigate to Library view | Library page loads with search input | | [ ] |
| 5.2 | Enter search query (e.g., "climate change") | Loading indicator appears | | [ ] |
| 5.3 | Press Enter or click search button | Results appear with paper details | | [ ] |
| 5.4 | Verify paper information displayed | Title, authors, year, abstract shown | | [ ] |
| 5.5 | Check source badges | arXiv (orange) or Semantic Scholar (blue) badges | | [ ] |
| 5.6 | Click "PDF" button on a paper with PDF | PDF opens or downloads | | [ ] |
| 5.7 | Search with no results | "No results found" empty state shows | | [ ] |

**Overall Status:** [ ] PASS / [ ] FAIL

**Notes:**
-

---

### Flow 6: Execute Data Analysis and View Results

**Purpose:** Verify code execution and results display

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|--------|
| 6.1 | Navigate to Analysis view | Analysis page loads with code editor | | [ ] |
| 6.2 | Enter Python code: `print("Hello, World!")` | Code appears in editor | | [ ] |
| 6.3 | Click "Execute" button | Loading state appears, then results | | [ ] |
| 6.4 | Verify output appears | "Hello, World!" displayed in results area | | [ ] |
| 6.5 | Try plotting code: `import matplotlib.pyplot as plt; plt.plot([1,2,3]); plt.show()` | Plot/chart displays (if matplotlib available) | | [ ] |
| 6.6 | Try code with error | Error message displayed clearly | | [ ] |
| 6.7 | Check download buttons (CSV, PNG, TXT) | Buttons are present | | [ ] |

**Overall Status:** [ ] PASS / [ ] FAIL

**Notes:**
-

---

### Flow 7: Export Documents to PDF and DOCX

**Purpose:** Verify document export functionality

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|--------|
| 7.1 | In Editor, create/add some content | Document has text to export | | [ ] |
| 7.2 | Click Export dropdown | Options: PDF, DOCX | | [ ] |
| 7.3 | Select "Export as PDF" | PDF file downloads | | [ ] |
| 7.4 | Open downloaded PDF | PDF contains document content with formatting | | [ ] |
| 7.5 | Select "Export as DOCX" | DOCX file downloads | | [ ] |
| 7.6 | Open downloaded DOCX | DOCX contains document content | | [ ] |

**Overall Status:** [ ] PASS / [ ] FAIL

**Notes:**
-

---

### Flow 8: Chat with AI Assistant (All Agent Types)

**Purpose:** Verify multi-agent chat functionality

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|--------|
| 8.1 | In Editor, locate AI chat sidebar | Chat panel visible on right | | [ ] |
| 8.2 | Select "Document" agent | Agent button shows active state | | [ ] |
| 8.3 | Send message: "Summarize my document" | AI response appears | | [ ] |
| 8.4 | Select "Literature" agent | Agent button shows active state | | [ ] |
| 8.5 | Send message: "Find papers on AI" | AI response with paper suggestions | | [ ] |
| 8.6 | Select "Memory" agent | Agent button shows active state | | [ ] |
| 8.7 | Send message: "What have I researched?" | AI response with context from memory | | [ ] |
| 8.8 | Select "General" agent | Agent button shows active state | | [ ] |
| 8.9 | Send message: "Hello" | AI response with greeting | | [ ] |
| 8.10 | Check chat history | Previous messages visible | | [ ] |

**Overall Status:** [ ] PASS / [ ] FAIL

**Notes:**
-

---

### Flow 9: Verify WebSocket Connection Status Indicator

**Purpose:** Verify real-time connection status display

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|--------|
| 9.1 | Look at editor toolbar for connection status | Status indicator visible (Live/Connecting/Offline) | | [ ] |
| 9.2 | Verify status when backend running | Shows "Live" (green indicator) | | [ ] |
| 9.3 | Stop backend server | Status changes to "Offline" (red) after timeout | | [ ] |
| 9.4 | Restart backend server | Status changes to "Live" (green) after reconnection | | [ ] |
| 9.5 | Check browser console for WebSocket logs | Connection/disconnection events logged | | [ ] |

**Overall Status:** [ ] PASS / [ ] FAIL

**Notes:**
-

---

### Flow 10: Test Auto-Save Functionality

**Purpose:** Verify document auto-saves with proper status indicators

| Step | Action | Expected Result | Actual Result | Status |
|------|--------|-----------------|---------------|--------|
| 10.1 | Open a document in Editor | Document loads | | [ ] |
| 10.2 | Check initial save status | Shows "Saved" or similar | | [ ] |
| 10.3 | Type text in editor | Status changes to "Unsaved" or similar | | [ ] |
| 10.4 | Wait 4+ seconds | Status changes to "Saving..." | | [ ] |
| 10.5 | Wait for save to complete | Status changes to "Saved" | | [ ] |
| 10.6 | Refresh browser page | Document content persists (was saved) | | [ ] |
| 10.7 | Type more text, then quickly close tab | Warning about unsaved changes (if implemented) | | [ ] |

**Overall Status:** [ ] PASS / [ ] FAIL

**Notes:**
-

---

## Test Summary

### Results Overview

| Flow | Name | Status | Issues Found |
|------|------|--------|--------------|
| 1 | Create New Project | [ ] | |
| 2 | Upload Files | [ ] | |
| 3 | Write and Format Text | [ ] | |
| 4 | Citations and Bibliography | [ ] | |
| 5 | Literature Search | [ ] | |
| 6 | Data Analysis | [ ] | |
| 7 | Export Documents | [ ] | |
| 8 | AI Chat | [ ] | |
| 9 | WebSocket Status | [ ] | |
| 10 | Auto-Save | [ ] | |

### Pass/Fail Counts

- **Total Flows:** 10
- **Passed:** 0
- **Failed:** 0
- **Pass Rate:** 0%

### Bugs Found

**ID | Flow | Severity | Description | Steps to Reproduce**
----|------|----------|-------------|--------------------
None documented yet

### Recommendations

**Go/No-Go Decision for Phase 14 Completion:**
[ ] GO - All critical flows working, minor issues acceptable
[ ] NO-GO - Critical bugs blocking release

**Additional Notes:**
-

---

*Test Plan created: 2026-02-07*
*Last updated: [To be filled after testing]*
