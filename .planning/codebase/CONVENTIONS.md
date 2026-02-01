# Coding Conventions

**Analysis Date:** 2026-01-31

## Naming Patterns

**Files:**
- Python: `snake_case.py` (e.g., `llm_service.py`, `task_worker.py`, `database/connection.py`)
- JavaScript/JSX: `PascalCase.jsx` for components, `camelCase.js` for utilities (e.g., `Dashboard.jsx`, `use-toast.js`, `App.js`)
- Directories: `snake_case` (e.g., `database/`, `workers/`, `components/`)

**Functions:**
- Python: `snake_case` (e.g., `generate_research_plan`, `get_db_session`, `_execute_literature_search`)
- JavaScript: `camelCase` (e.g., `useProject`, `setSelectedProject`, `handleCreateProject`)

**Variables:**
- Python: `snake_case` (e.g., `project_id`, `research_goal`, `task_data`)
- JavaScript: `camelCase` (e.g., `selectedProject`, `refreshTrigger`, `navWidth`)

**Types/Classes:**
- Python: `PascalCase` (e.g., `LLMService`, `TaskWorker`, `ProjectCreate`, `TaskStatus`)
- JavaScript: `PascalCase` for components and types (e.g., `ProjectProvider`, `ThemeProvider`, `Button`)

**Constants:**
- Python: `UPPER_SNAKE_CASE` (e.g., `MODELS`, `PROVIDER_ORDER`, `TEST_PROJECT_ID`)
- JavaScript: `UPPER_SNAKE_CASE` or `PascalCase` (e.g., `VIEW_STATES`, `Button`)

## Code Style

**Formatting:**
- Python: No formal formatter configured (manual formatting observed)
- JavaScript: ESLint with `plugin:react-hooks/recommended` rules configured via craco
  - Located in: `/home/zemul/Programming/research/frontend/craco.config.js`
- Tailwind CSS for styling (utility-first CSS classes)

**Linting:**
- JavaScript: ESLint 9.23.0 with React Hooks rules
  - `react-hooks/rules-of-hooks`: error
  - `react-hooks/exhaustive-deps`: warn
- No Python linting configuration detected (no `.pylintrc`, `ruff.toml`, or `black` config found)

**Import Organization:**

Python (order observed in `backend/server.py`, `backend/llm_service.py`):
1. Standard library imports
2. Third-party imports (fastapi, sqlalchemy, dotenv, etc.)
3. Local application imports (database, orchestration, workers, services)
4. Blank lines between groups

```python
# Standard library
import os
import logging
from typing import List, Optional, Dict, Any

# Third-party
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv

# Local
from database import get_db, init_db
from llm_service import llm_service
```

JavaScript (order observed in `frontend/src/App.js`):
1. React imports
2. Third-party npm package imports (lucide-react, class-variance-authority, etc.)
3. Absolute imports using `@/` alias
4. Relative imports
5. CSS imports last

```javascript
import { useState, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { StatusBar } from './components/layout/StatusBar';
import { Toaster } from './components/ui/sonner';
import './App.css';
```

**Path Aliases:**
- Frontend: `@/` maps to `src/` directory (configured in `/home/zemul/Programming/research/frontend/craco.config.js`)

## Error Handling

**Python Patterns:**
- FastAPI endpoints: Use `HTTPException` for API errors
  ```python
  if not project:
      raise HTTPException(status_code=404, detail="Project not found")
  ```
- Service layer: Log errors with `logger.error()` and raise `ValueError` or custom exceptions
  ```python
  if not self.available_providers:
      logger.warning("No LLM providers configured")
      raise ValueError("No LLM providers configured")
  ```
- Database transactions: Use try/except with rollback
  ```python
  try:
      await db.commit()
  except Exception as e:
      logger.error(f"Failed: {e}", exc_info=True)
      await db.rollback()
      raise HTTPException(status_code=500, detail=str(e))
  ```
- Worker tasks: Log error, update task state to FAILED, continue processing
  ```python
  except Exception as e:
      logger.error(f"Task {task_id} failed: {e}")
      await orchestration_engine.fail_task_run(session, run.id, error_message=str(e))
      return None
  ```

**JavaScript Patterns:**
- Context hooks: Throw error if used outside provider
  ```javascript
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  ```
- Async operations: Try/catch with console logging (observed pattern)
- No global error boundary detected in frontend

## Logging

**Python Framework:** Standard library `logging` module

**Configuration (from `backend/server.py`):**
```python
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
```

**Patterns:**
- Use module-level loggers: `logger = logging.getLogger(__name__)`
- Log levels: INFO for normal operations, WARNING for degraded conditions, ERROR for failures
- Include context in messages: `logger.info(f"Created project {project.id}")`
- Use `exc_info=True` for exception stack traces: `logger.error(f"Failed: {e}", exc_info=True)`

**JavaScript:** No formal logging framework (uses `console.log` implicitly)

## Comments

**When to Comment:**
- Module docstrings for all Python files (triple-quoted strings at top)
- Class docstrings explaining purpose and behavior
- Function docstrings for complex operations (especially service layer)
- Section comment blocks in large files (e.g., `# ============== Project Endpoints ==============`)

**Docstring Style (Python):**
- Google-style docstrings observed in `backend/llm_service.py`
```python
async def generate(
    self,
    prompt: str,
    system_message: str = "You are a helpful research assistant.",
    provider: Optional[str] = None,
) -> str:
    """
    Generate text using specified or auto-selected LLM provider.

    Args:
        prompt: The user prompt
        system_message: System message for context
        provider: Specific provider to use (openai, gemini, mistral, groq, openrouter)

    Returns:
        Generated text response
    """
```

**JSDoc:** Not commonly used in observed codebase

**Inline Comments:** Minimal, used for complex logic only

## Function Design

**Size:**
- Python service functions: 50-150 lines typical (e.g., `generate_research_plan` in `llm_service.py`)
- FastAPI endpoints: 20-80 lines typical (e.g., `create_project` in `server.py`)
- JavaScript components: 100-200 lines typical (e.g., `App.js`)

**Parameters:**
- Python: Use type hints for all parameters
  - Required positional params first
  - Optional params with defaults last
  - Use `*` to separate keyword-only params when needed
- JavaScript: Destructured props for components
  ```javascript
  const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  ```

**Return Values:**
- Python: Always specify return type in type hints
  - Return Pydantic models from API endpoints
  - Return domain objects or primitive types from services
  - Use `Optional[T]` for nullable returns
- JavaScript: Implicit return types (no TypeScript detected in main frontend codebase)

## Module Design

**Exports:**
- Python services: Export singleton instances at module bottom
  ```python
  llm_service = LLMService()
  ```
- FastAPI: Use `APIRouter` for endpoint grouping
- JavaScript components: Named exports preferred
  ```javascript
  export { Button, buttonVariants }
  export const useProject = () => { ... }
  ```

**Barrel Files:**
- Python: `database/__init__.py` exports common models and functions
- JavaScript: No barrel files observed

**State Management:**
- Backend: Database-centric (PostgreSQL as source of truth, Redis for queue/pubsub)
- Frontend: React Context API for global state (see `/home/zemul/Programming/research/frontend/src/context/ProjectContext.js`)

## React-Specific Conventions

**Component Structure:**
- Functional components with hooks (no class components observed)
- Custom hooks in `hooks/` directory (e.g., `use-toast.js`)
- Context providers for global state

**Hook Usage:**
- `useCallback` for event handlers to prevent re-renders
- `useState` for local component state
- Custom hooks follow `use*` naming convention

**Styling:**
- Tailwind CSS utility classes exclusively
- Use `cn()` utility from `lib/utils.js` for conditional class merging
  ```javascript
  import { cn } from "@/lib/utils"
  className={cn(buttonVariants({ variant, size }), className)}
  ```

**Component Props:**
- Destructure props in function signature
- Use `...props` spread for forwarding attributes to underlying elements

---

*Convention analysis: 2026-01-31*
