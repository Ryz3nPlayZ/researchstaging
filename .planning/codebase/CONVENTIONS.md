# Coding Conventions

**Analysis Date:** 2025-01-23

## Naming Patterns

**Python Backend (`research/backend/`):**
- snake_case for files: `llm_service.py`, `task_executor.py`, `planning_service.py`
- snake_case for functions and variables: `async def execute_task()`, `research_goal`, `task_counts`
- PascalCase for classes: `LLMService`, `TaskExecutor`, `OrchestrationEngine`
- UPPER_CASE for constants: `MODELS`, `DEFAULT_MODEL`
- snake_case for module/directory names: `database/`, `orchestration/`, `realtime/`

**JavaScript/React Frontend (`research/frontend/src/`):**
- PascalCase for component files: `Dashboard.jsx`, `PlanningFlow.jsx`, `StatusBar.jsx`
- PascalCase for React components: `export const Dashboard = () => {}`
- camelCase for hooks: `useProject`, `useTheme`, `use-toast.js`
- camelCase for utility functions: `createWebSocketConnection()`, `formatDate()`
- kebab-case for directories with single-purpose files: `context/`, `hooks/`, `lib/`
- PascalCase for UI component directories (container for multiple files): `ui/`

**Database Models (`research/backend/database/models.py`):**
- PascalCase for model classes: `Project`, `Task`, `Artifact`, `Paper`
- UPPER_SNAKE_CASE for enums: `ProjectStatus`, `TaskState`, `TaskType`, `ArtifactType`
- Enum values are UPPER_SNAKE_CASE: `LITERATURE_SEARCH`, `COMPLETED`, `FAILED`

## Code Style

**Python:**
- Formatter: Black (`black==25.12.0`)
- Linter: Flake8 (`flake8==7.3.0`)
- Type checker: mypy (`mypy==1.19.1`)
- Import sorter: isort (`isort==7.0.0`)

**Key Python patterns:**
- Max line length: 88 characters (Black default)
- Use double quotes for strings
- Trailing comma in multi-line function calls and list/dict definitions
- 4 spaces for indentation

**JavaScript/React:**
- Linter: ESLint (`eslint==9.23.0`)
- Config: `@eslint/js`, `eslint-plugin-react`, `eslint-plugin-react-hooks`
- Style: Tailwind CSS utility-first approach
- No dedicated formatter detected (uses ESLint for formatting)

**Key frontend patterns:**
- Use `cn()` utility for conditional className merging (from `tailwind-merge`)
- Class Variance Authority (CVA) for component variants
- Lucide React for icons
- Radix UI primitives for accessible components

## Import Organization

**Python imports order:**
1. Standard library imports
2. Third-party imports
3. Local application imports
4. Blank line between each group

```python
# Standard library
import os
import logging
from typing import Optional, Dict, Any
from datetime import datetime, timezone

# Third-party
from fastapi import FastAPI, HTTPException
from sqlalchemy import select, update
from dotenv import load_dotenv

# Local
from database.models import Project, Task, TaskState
from llm_service import llm_service
```

**JavaScript imports order:**
1. React hooks and core imports
2. Third-party libraries
3. Local components (absolute paths with `@/` alias)
4. Relative imports
5. CSS files

```javascript
import { useState, useEffect, useCallback } from 'react';
import { useProject } from '../../context/ProjectContext';
import { projectsApi, statsApi } from '../../lib/api';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import './App.css';
```

**Path Aliases (Frontend):**
- `@/` maps to `src/` directory (configured in `craco.config.js`)

## Error Handling

**Backend Python:**
- Use `try/except` blocks for async operations
- Raise `HTTPException` for API errors with status codes
- Use `ValueError` for validation errors
- Log errors with `logger.error()` before re-raising
- Return `None` for expected failures in worker methods

```python
# Pattern from research/backend/server.py
if not project:
    raise HTTPException(status_code=404, detail="Project not found")

# Pattern from research/backend/llm_service.py
except Exception as e:
    logger.error(f"LLM generation error: {e}")
    raise
```

**Frontend JavaScript:**
- Use `try/catch` for async operations
- Check for `response.status` when using axios
- Console error logging for debugging
- Display user-friendly error messages via toast/notifications

```javascript
// Pattern from research/frontend/src/lib/api.js
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  if (onError) onError(error);
};
```

## Logging

**Backend:**
- Framework: Python `logging` module
- Configure with `logging.basicConfig()` in `server.py`
- Level: `INFO` by default, `ERROR` for exceptions
- Format: `'%(asctime)s - %(name)s - %(levelname)s - %(message)s'`
- Use module-level loggers: `logger = logging.getLogger(__name__)`

**Frontend:**
- Framework: `console` object
- Use `console.error()` for exceptions
- Use `console.log()` for WebSocket connection events
- Use `console.warn()` for deprecation notices

**Patterns:**
- Log task lifecycle events: started, completed, failed
- Log external API call errors
- Include context in error messages (task_id, project_id)

## Comments

**When to Comment:**
- Docstrings for all classes and public methods
- Inline comments for complex business logic
- Section separators for large files
- No comments for self-evident code

**Docstring style:**
- Triple double quotes (`"""`) for docstrings
- Describe purpose, parameters, and return values
- One-line summary for simple functions

```python
# Pattern from research/backend/database/models.py
class Project(Base):
    """
    Top-level unit of execution and persistence.
    All execution state, tasks, artifacts, and logs are scoped to a Project.
    """
```

**JSDoc/TSDoc:**
- Not used in this codebase
- Component props are documented inline when complex

## Function Design

**Size:**
- Backend functions: ~50-150 lines for task execution methods
- Frontend components: ~150-250 lines for page components
- UI components: ~30-80 lines (keep small and composable)
- No hard limit, but prefer extraction when complexity grows

**Parameters:**
- Use type hints for Python function parameters
- Destructure props in React components
- Use `**kwargs` sparingly; prefer explicit parameters
- Optional parameters have default values

**Python parameter pattern:**
```python
async def generate(
    self,
    prompt: str,
    system_message: str = "You are a helpful research assistant.",
    model_name: str = DEFAULT_MODEL,
    session_id: Optional[str] = None
) -> str:
```

**React props pattern:**
```javascript
export const Dashboard = ({ onCreateProject, onSelectProject }) => {
```

**Return Values:**
- Python functions use explicit return type hints
- Async functions return awaited results, not promises
- Return `None` for functions with side effects only
- Frontend components return JSX

## Module Design

**Exports:**
- Python: Use `__all__` for public API (not consistently used)
- JavaScript: Named exports for components, default export for main component
- Singleton instances exported directly: `llm_service = LLMService()`, `task_worker = TaskWorker()`

**Barrel Files:**
- `research/backend/database/__init__.py` exports models and utilities
- `research/backend/orchestration/__init__.py` exports orchestration engine
- Frontend does not use barrel files; imports are direct

**Service pattern:**
- Backend services are singleton instances
- Import service instances directly: `from llm_service import llm_service`
- Services are initialized at module load time

---

*Convention analysis: 2025-01-23*
