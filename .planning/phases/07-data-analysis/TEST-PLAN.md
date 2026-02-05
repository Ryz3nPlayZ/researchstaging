# Phase 7: Data Analysis - Test Plan

**Created:** 2026-02-05
**Status:** Deferred - To be tested after Phase 8 implementation
**Requirements:** ANA-01 through ANA-09

---

## Prerequisites

Before testing Phase 7 features, ensure:
1. Backend server is running (`python backend/server.py`)
2. Frontend is running (`cd frontend && yarn start`)
3. At least one LLM provider API key is configured in `backend/.env`
4. Python interpreter available on system (for code execution tests)
5. R interpreter available on system (optional, for R code tests)

---

## Test Cases

### 1. Code Generation UI

#### Test 1.1: Generate Code Button Visible
**Priority:** P0
**Requirement:** ANA-01, ANA-02

**Steps:**
1. Open the application in a browser
2. Navigate to the AI sidebar (right panel)
3. Look for "Generate Code" button in the sidebar header

**Expected Result:**
- "Generate Code" button is visible in AI sidebar header
- Button is clickable and prominent

**Actual Result:** _[To be filled during testing]_

**Status:** ☐ Pass | ☐ Fail | ☐ Skip

---

#### Test 1.2: Code Generation Dialog
**Priority:** P0
**Requirement:** ANA-08

**Steps:**
1. Click "Generate Code" button in AI sidebar
2. Observe the dialog that appears

**Expected Result:**
- Dialog opens with:
  - Task description textarea (labeled "Describe your analysis task")
  - Language selector dropdown (Python/R)
  - "Generate" button
  - "Cancel" button

**Actual Result:** _[To be filled during testing]_

**Status:** ☐ Pass | ☐ Fail | ☐ Skip

---

#### Test 1.3: Python Code Generation
**Priority:** P0
**Requirement:** ANA-02

**Steps:**
1. Open code generation dialog
2. Enter task: "Calculate mean and standard deviation of a dataset"
3. Select "Python" from language dropdown
4. Click "Generate" button
5. Wait for AI response

**Expected Result:**
- Monaco Editor opens showing generated Python code
- Code uses pandas/numpy appropriately
- Code is syntax-highlighted for Python
- Code is editable (not read-only)

**Actual Result:** _[To be filled during testing]_

**Status:** ☐ Pass | ☐ Fail | ☐ Skip

---

#### Test 1.4: R Code Generation
**Priority:** P1
**Requirement:** ANA-01

**Steps:**
1. Open code generation dialog
2. Enter task: "Create a scatter plot with regression line"
3. Select "R" from language dropdown
4. Click "Generate" button
5. Wait for AI response

**Expected Result:**
- Monaco Editor opens showing generated R code
- Code uses tidyverse/ggplot2 appropriately
- Code is syntax-highlighted for R
- Code is editable

**Actual Result:** _[To be filled during testing]_

**Status:** ☐ Pass | ☐ Fail | ☐ Skip

---

### 2. Code Editor Features

#### Test 2.1: Code Editor Toolbar
**Priority:** P0
**Requirement:** ANA-08

**Steps:**
1. Generate or open any code in CodeEditor
2. Observe the toolbar below the editor

**Expected Result:**
- Toolbar contains:
  - "Run" button (play icon)
  - "Copy" button
  - "Clear" button
- All buttons are clickable

**Actual Result:** _[To be filled during testing]_

**Status:** ☐ Pass | ☐ Fail | ☐ Skip

---

#### Test 2.2: Code Editing
**Priority:** P0
**Requirement:** ANA-08

**Steps:**
1. Generate Python code
2. Click inside the Monaco Editor
3. Modify the code (e.g., change a variable name)
4. Add a new line of code

**Expected Result:**
- Code is fully editable
- Syntax highlighting updates in real-time as you type
- Line numbers are visible
- No restrictions on editing

**Actual Result:** _[To be filled during testing]_

**Status:** ☐ Pass | ☐ Fail | ☐ Skip

---

#### Test 2.3: Keyboard Shortcut
**Priority:** P1
**Requirement:** ANA-08

**Steps:**
1. Generate or open code in CodeEditor
2. Press Ctrl+Enter (Windows/Linux) or Cmd+Enter (Mac)

**Expected Result:**
- Code executes (same as clicking Run button)
- Execution status shows "Running" then "Completed" or "Error"

**Actual Result:** _[To be filled during testing]_

**Status:** ☐ Pass | ☐ Fail | ☐ Skip

---

### 3. Code Execution

#### Test 3.1: Python Code Execution
**Priority:** P0
**Requirement:** ANA-03

**Steps:**
1. Generate or enter Python code:
   ```python
   import pandas as pd
   data = {'A': [1, 2, 3, 4, 5], 'B': [10, 20, 30, 40, 50]}
   df = pd.DataFrame(data)
   print(df)
   print(df.describe())
   ```
2. Click "Run" button
3. Wait for execution

**Expected Result:**
- Execution status shows "Running" during execution
- Execution completes with status "Completed"
- Execution time is displayed (e.g., "Completed in 0.45s")
- Results modal opens with output

**Actual Result:** _[To be filled during testing]_

**Status:** ☐ Pass | ☐ Fail | ☐ Skip

---

#### Test 3.2: R Code Execution (Optional)
**Priority:** P2
**Requirement:** ANA-03

**Steps:**
1. Generate or enter R code:
   ```r
   data <- data.frame(A = c(1,2,3,4,5), B = c(10,20,30,40,50))
   print(data)
   summary(data)
   ```
2. Click "Run" button
3. Wait for execution

**Expected Result:**
- R code executes successfully
- Output appears in results modal
- Execution time displayed

**Actual Result:** _[To be filled during testing]_

**Status:** ☐ Pass | ☐ Fail | ☐ Skip

---

#### Test 3.3: Execution Timeout
**Priority:** P2
**Requirement:** ANA-03

**Steps:**
1. Enter code with infinite loop or long-running operation:
   ```python
   import time
   while True:
       time.sleep(1)
   ```
2. Click "Run" button
3. Wait 60+ seconds

**Expected Result:**
- Execution times out after 60 seconds
- Error message indicates timeout
- Server remains responsive (not hung)

**Actual Result:** _[To be filled during testing]_

**Status:** ☐ Pass | ☐ Fail | ☐ Skip

---

#### Test 3.4: Error Handling
**Priority:** P0
**Requirement:** ANA-03

**Steps:**
1. Enter invalid Python code:
   ```python
   print(undefined_variable)
   ```
2. Click "Run" button

**Expected Result:**
- Execution completes with status "Error"
- Error message displayed in results
- Error message is informative (stack trace or error description)
- Application does not crash

**Actual Result:** _[To be filled during testing]_

**Status:** ☐ Pass | ☐ Fail | ☐ Skip

---

### 4. Results Display

#### Test 4.1: Table View
**Priority:** P0
**Requirement:** ANA-04

**Steps:**
1. Execute code that outputs CSV data:
   ```python
   print("A,B,C\\n1,10,100\\n2,20,200\\n3,30,300")
   ```
2. In results modal, click "Table" tab

**Expected Result:**
- Data is displayed in table format
- Columns are sortable (click column headers)
- Table is readable with proper formatting
- Row/column counts are reasonable

**Actual Result:** _[To be filled during testing]_

**Status:** ☐ Pass | ☐ Fail | ☐ Skip

---

#### Test 4.2: Chart View - Line Chart
**Priority:** P0
**Requirement:** ANA-05

**Steps:**
1. Execute code that generates line chart data:
   ```python
   import matplotlib.pyplot as plt
   plt.plot([1,2,3,4], [10,20,15,25])
   plt.show()
   ```
2. In results modal, click "Chart" tab

**Expected Result:**
- Interactive line chart is displayed
- Hovering over points shows values
- Chart is responsive (resizes with modal)
- Zoom/pan controls available (Plotly feature)

**Actual Result:** _[To be filled during testing]_

**Status:** ☐ Pass | ☐ Fail | ☐ Skip

---

#### Test 4.3: Chart View - Bar Chart
**Priority:** P1
**Requirement:** ANA-05

**Steps:**
1. Execute code that generates bar chart data
2. In results modal, click "Chart" tab

**Expected Result:**
- Bar chart displayed correctly
- Interactive tooltips on hover
- Proper axis labels

**Actual Result:** _[To be filled during testing]_

**Status:** ☐ Pass | ☐ Fail | ☐ Skip

---

#### Test 4.4: Chart View - Scatter Plot
**Priority:** P1
**Requirement:** ANA-06

**Steps:**
1. Execute code that generates scatter plot data
2. In results modal, click "Chart" tab

**Expected Result:**
- Scatter plot displayed with data points
- Interactive on hover
- Properly scaled axes

**Actual Result:** _[To be filled during testing]_

**Status:** ☐ Pass | ☐ Fail | ☐ Skip

---

#### Test 4.5: Text View
**Priority:** P0
**Requirement:** ANA-04

**Steps:**
1. Execute any code
2. In results modal, click "Text" tab

**Expected Result:**
- Raw output displayed in formatted code block
- Syntax highlighting for code output
- Copy button available
- Text is monospaced and readable

**Actual Result:** _[To be filled during testing]_

**Status:** ☐ Pass | ☐ Fail | ☐ Skip

---

### 5. Download Functionality

#### Test 5.1: Download CSV
**Priority:** P0
**Requirement:** ANA-07

**Steps:**
1. Execute code that outputs table data
2. In results modal, click "Download CSV" button

**Expected Result:**
- Browser downloads file with .csv extension
- CSV file opens correctly in Excel/Numbers/Google Sheets
- Data matches what was displayed in table view
- File has proper headers (if applicable)

**Actual Result:** _[To be filled during testing]_

**Status:** ☐ Pass | ☐ Fail | ☐ Skip

---

#### Test 5.2: Download PNG (Chart)
**Priority:** P0
**Requirement:** ANA-07

**Steps:**
1. Execute code that generates a chart
2. In results modal, go to "Chart" tab
3. Click "Download PNG" button

**Expected Result:**
- Browser downloads file with .png extension
- PNG image opens in image viewer
- Image is high resolution and readable
- Chart matches what was displayed

**Actual Result:** _[To be filled during testing]_

**Status:** ☐ Pass | ☐ Fail | ☐ Skip

---

#### Test 5.3: Download TXT
**Priority:** P1
**Requirement:** ANA-07

**Steps:**
1. Execute any code
2. In results modal, go to "Text" tab
3. Click "Download TXT" button

**Expected Result:**
- Browser downloads file with .txt extension
- Text file opens in text editor
- Content matches raw output

**Actual Result:** _[To be filled during testing]_

**Status:** ☐ Pass | ☐ Fail | ☐ Skip

---

### 6. Memory Integration

#### Test 6.1: Results Saved to Memory
**Priority:** P1
**Requirement:** ANA-09

**Steps:**
1. Execute a simple analysis with output
2. Note the execution completion
3. Navigate to Memory section (if available in UI)
4. Look for the analysis result

**Expected Result:**
- Analysis result is saved as a "Finding" in memory
- Finding contains: code used, language, output, execution time
- Finding is tagged/associated with current project
- Finding can be retrieved later

**Actual Result:** _[To be filled during testing]_

**Status:** ☐ Pass | ☐ Fail | ☐ Skip

---

## Test Summary

**Total Tests:** 21
**Completed:** 0
**Passed:** 0
**Failed:** 0
**Skipped:** 0

### Results by Category

| Category | Total | Passed | Failed | Skipped |
|----------|-------|--------|--------|---------|
| Code Generation UI | 4 | 0 | 0 | 0 |
| Code Editor Features | 3 | 0 | 0 | 0 |
| Code Execution | 4 | 0 | 0 | 0 |
| Results Display | 5 | 0 | 0 | 0 |
| Download Functionality | 3 | 0 | 0 | 0 |
| Memory Integration | 1 | 0 | 0 | 0 |
| **TOTAL** | **21** | **0** | **0** | **0** |

---

## Issues Found

*No issues recorded yet*

---

## Notes

- Tests require working LLM API key for code generation
- Python execution tests require Python 3.x installed
- R execution tests are optional (P2 priority)
- Some tests may require manual verification of downloaded files
- Timeout test (Test 3.3) takes 60+ seconds to complete

---

## Testing Checklist

Before starting testing:
- [ ] Backend server running on port 8000
- [ ] Frontend running on port 5173
- [ ] LLM API key configured
- [ ] Python 3.x available in PATH
- [ ] At least one project created
- [ ] Browser console open for error monitoring

After testing:
- [ ] All test results filled in
- [ ] Screenshots captured for failures
- [ ] Issues documented with reproduction steps
- [ ] Results summary updated

---

**Test Plan Version:** 1.0
**Last Updated:** 2026-02-05
