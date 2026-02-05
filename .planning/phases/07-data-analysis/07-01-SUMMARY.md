---
# Frontmatter

phase: 07-data-analysis
plan: 01
type: execute
wave: 1

# One-liner (substantive)
AI-powered Python/R code generation service with Monaco Editor integration

# Tech tracking
tech-stack:
  added:
    - "@monaco-editor/react": Code editor with syntax highlighting
  patterns:
    - Multi-agent system with specialized AnalysisAgent
    - RESTful API with FastAPI router pattern
    - React component composition with Shadcn UI
    - Async/await throughout backend

# File tracking
key-files:
  created:
    - backend/analysis_api.py
    - frontend/src/components/analysis/CodeEditor.jsx
  modified:
    - backend/agent_service.py
    - backend/server.py
    - frontend/src/lib/api.js
    - frontend/src/components/ai/AISidebar.jsx
    - frontend/package.json

# Decisions
decisions:
  - "Monaco Editor over CodeMirror": More modern React integration, better TypeScript support
  - "AnalysisAgent in agent_service.py": Follows existing agent pattern, maintains consistency
  - "Separate analysis_api.py router": Keeps analysis endpoints organized, follows established pattern
  - "Dialog for code generation UI": Provides focused UX, non-blocking workflow
  - "Placeholder execute handler": Defers execution implementation to Plan 07-02

# Metrics
metrics:
  duration: 4 minutes
  completed: 2026-02-05
  commits: 3

# Dependency graph
dependency-graph:
  requires:
    - "06-ai-agent": Multi-agent orchestration system
    - "04-document-editor": Monaco-style editor patterns
  provides:
    - "Code generation API": AI-powered Python/R code generation
    - "CodeEditor component": Syntax-highlighted code editor with run/copy/clear
    - "AnalysisAgent": Specialized agent for data analysis queries
  affects:
    - "07-02": Code execution will consume generated code
    - "07-03": Visualization will use code generation foundation
---

# Phase 07 Plan 01: AI-Powered Code Generation Summary

## Overview

Implemented AI-powered code generation for data analysis with user-editable code interface. Users can now request Python or R code for analysis tasks, view the generated code in a Monaco Editor with syntax highlighting, and modify it before execution.

## What Was Built

### 1. AnalysisAgent (`backend/agent_service.py`)

Added a new specialized agent to the multi-agent system:

- **Keyword Detection**: Identifies data analysis queries (analyze, statistics, regression, plot, chart, correlation, etc.)
- **Code Generation Method**: `generate_code()` generates Python/R code with explanations
- **Language-Specific Prompts**: Different system prompts for Python (pandas, matplotlib, seaborn) vs R (tidyverse, ggplot2)
- **Response Parsing**: Extracts code and explanation from LLM responses
- **Integrated with AgentRouter**: AnalysisAgent is now part of the agent routing system

### 2. Code Generation API (`backend/analysis_api.py`)

Created a new FastAPI router for analysis operations:

- **POST `/api/analysis/projects/{project_id}/generate-code`**: Main code generation endpoint
- **Request Validation**: Ensures language is either "python" or "r"
- **Structured Responses**: Returns `{code, language, explanation}` using Pydantic models
- **Error Handling**: Proper HTTP status codes for invalid requests
- **Health Check**: `/api/analysis/health` endpoint for monitoring
- **Registered in Server**: Router included in main FastAPI app

### 3. CodeEditor Component (`frontend/src/components/analysis/CodeEditor.jsx`)

Built a full-featured code editor component:

- **Monaco Editor Integration**: Used `@monaco-editor/react` for professional editing experience
- **Python/R Syntax Highlighting**: Language-aware syntax highlighting for both languages
- **Toolbar Actions**: Run, Copy, Clear buttons with appropriate disabled states
- **Responsive Design**: Configurable height, word wrap enabled, line numbers
- **Dark Theme**: Matches app design with `vs-dark` Monaco theme
- **Props Interface**: `{code, language, onChange, onExecute, readOnly, height}`
- **State Management**: Local state for code content with controlled/uncontrolled modes

### 4. AI Sidebar Integration (`frontend/src/components/ai/AISidebar.jsx`)

Extended the AI Assistant sidebar with code generation:

- **"Generate Code" Button**: Prominent button in sidebar header opens code generation dialog
- **Dialog Interface**: Task description textarea + language selector (Python/R buttons)
- **Generated Code Display**: Shows explanation + CodeEditor with generated code
- **Edit Before Execute**: Users can modify generated code before running
- **Execute Placeholder**: "Run Code" button shows placeholder for Plan 07-02 execution
- **Loading States**: Proper feedback during code generation

### 5. API Client Update (`frontend/src/lib/api.js`)

Added analysis API client methods:

- **`analysisApi.generateCode(projectId, task, language, dataContext)`**: Typed method for code generation
- **Error Handling**: Consistent with existing API patterns
- **Import Integration**: Added to sidebar imports alongside existing APIs

## Technical Decisions

### Monaco Editor vs CodeMirror
**Decision**: Used `@monaco-editor/react` instead of CodeMirror or alternatives.

**Rationale**:
- Modern React hooks integration
- Better TypeScript support (if we migrate)
- VS Code editing experience (familiar to users)
- Excellent Python and R language support

### AnalysisAgent Placement
**Decision**: Added `AnalysisAgent` to existing `agent_service.py` rather than separate file.

**Rationale**:
- Consistent with existing agent pattern (DocumentAgent, LiteratureAgent, MemoryAgent)
- Shared imports and utilities (llm_service, logger)
- Single source of truth for agent routing

### Dialog Workflow
**Decision**: Used dialog/popup for code generation instead of inline or separate page.

**Rationale**:
- Focused UX without leaving current context
- Non-blocking (sidebar remains usable)
- Natural progression: describe → generate → edit → execute
- Follows existing Shadcn UI patterns

### Placeholder Execution Handler
**Decision**: Implemented `handleExecuteCode` as placeholder showing toast message.

**Rationale**:
- Plan 07-02 will implement actual execution
- UI flow complete and testable now
- No blocking dependencies between plans

## Files Modified

### Backend

| File | Changes |
|------|---------|
| `backend/agent_service.py` | Added `AnalysisAgent` class with `can_handle()` and `generate_code()` methods; updated `AgentRouter` to include AnalysisAgent |
| `backend/analysis_api.py` | Created new FastAPI router with code generation endpoint, Pydantic models, health check |
| `backend/server.py` | Imported and registered analysis router |

### Frontend

| File | Changes |
|------|---------|
| `frontend/package.json` | Added `@monaco-editor/react` dependency |
| `frontend/src/components/analysis/CodeEditor.jsx` | Created new component with Monaco Editor, toolbar, Python/R support |
| `frontend/src/lib/api.js` | Added `analysisApi.generateCode()` method |
| `frontend/src/components/ai/AISidebar.jsx` | Added "Generate Code" button, dialog, state management, handlers |

## Deviations from Plan

### Auto-fixed Issues

None. Plan executed exactly as written.

## Authentication Gates

None encountered during this execution.

## Testing & Verification

All verification criteria passed:

- [x] `npm install @monaco-editor/react` succeeded
- [x] `AnalysisAgent.can_handle()` detects analysis queries with confidence scoring
- [x] `POST /api/analysis/generate-code` returns generated Python/R code
- [x] CodeEditor component renders Monaco Editor with syntax highlighting
- [x] AI sidebar "Generate Code" button opens dialog and generates code
- [x] User can edit generated code in CodeEditor before execution

## Next Phase Readiness

### Ready for Plan 07-02 (Code Execution)
- CodeEditor has `onExecute` callback infrastructure
- Generated code available in correct format
- UI flow complete, execution endpoint ready to be wired

### Integration Points
- **Plan 07-02**: Will implement `/api/analysis/execute` endpoint consumed by CodeEditor's `onExecute`
- **Plan 07-03**: Visualization can reuse code generation patterns for plotting code

## Performance

- **Duration**: 4 minutes
- **Velocity**: Consistent with recent plans (avg 5 min)
- **Commits**: 3 atomic commits (backend API, frontend component, integration)

## Commits

1. `feat(07-01): add AnalysisAgent and code generation API` (6158786)
   - AnalysisAgent class with generate_code() method
   - analysis_api.py router with generate-code endpoint
   - AgentRouter integration

2. `feat(07-01): add CodeEditor component with Monaco Editor` (2ed2c20)
   - @monaco-editor/react dependency
   - CodeEditor component with toolbar
   - Python/R syntax highlighting

3. `feat(07-01): integrate code generation with AI sidebar` (2de00c5)
   - analysisApi in API client
   - Generate Code button and dialog in AISidebar
   - Execute placeholder for Plan 07-02
