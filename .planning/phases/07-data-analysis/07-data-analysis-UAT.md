---
status: deferred
phase: 07-data-analysis
source: 07-01-SUMMARY.md, 07-02-SUMMARY.md, 07-03-SUMMARY.md
started: 2026-02-05T18:00:00Z
updated: 2026-02-05T18:05:00Z
note: Testing deferred per user request. Will test after Phase 8 implementation. See TEST-PLAN.md for complete test cases.
---

## Current Test

[testing deferred - will resume after Phase 8]

## Tests

### 1. Generate Code Button Visible
expected: In the AI sidebar header, there's a "Generate Code" button. Clicking it opens a dialog with task description field and language selector (Python/R dropdown).
result: pending

### 2. Python Code Generation
expected: In the code generation dialog, enter a task like "calculate mean and standard deviation" and select Python. AI should generate Python code using pandas/numpy. The generated code appears in a Monaco Editor with Python syntax highlighting.
result: pending

### 3. R Code Generation
expected: In the code generation dialog, enter a task like "create a scatter plot" and select R. AI should generate R code using tidyverse/ggplot2. The generated code appears in Monaco Editor with R syntax highlighting.
result: pending

### 4. Code Editor Features
expected: The Monaco Editor should have toolbar buttons: Run (play icon), Copy, Clear. You should be able to edit the generated code before execution. Syntax highlighting should match the language (Python or R).
result: pending

### 5. Code Execution
expected: Click Run button in CodeEditor. Code should execute (if Python/R interpreters are available). Execution status shows "Running" then "Completed" (or "Error" if issues). Execution time displays after completion.
result: pending

### 6. Results Display - Table View
expected: After executing code that outputs CSV/JSON data (e.g., dataframe.print()), results modal opens. "Table" tab shows parsed data in sortable table format.
result: pending

### 7. Results Display - Chart View
expected: If code generates chart-like output, "Chart" tab shows interactive Plotly.js visualization. Supports line, bar, scatter, histogram charts. You can hover over data points to see values.
result: pending

### 8. Results Display - Text View
expected: "Text" tab shows raw output as formatted code block with syntax highlighting. Copy button available.
result: pending

### 9. Download Results as CSV
expected: In AnalysisResults modal, "Download CSV" button exports table data as CSV file. Browser downloads the file with .csv extension.
result: pending

### 10. Download Chart as PNG
expected: In Chart view, "Download PNG" button exports the chart as PNG image. Browser downloads the file with .png extension.
result: pending

## Summary

total: 10
passed: 0
issues: 0
pending: 10
skipped: 10
note: All tests deferred. See TEST-PLAN.md for comprehensive test cases to be executed later.

## Gaps

[none - testing not yet performed]
