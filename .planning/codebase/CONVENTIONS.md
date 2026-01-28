# Coding Conventions

**Analysis Date:** 2026-01-27

## Naming Patterns

**Files:**
- **Python:** `snake_case.py` - Backend service files use descriptive names (`llm_service.py`, `auth_service.py`, `planning_service.py`)
- **TypeScript:** `PascalCase.ts` for types, `PascalCase.tsx` for components, `camelCase.ts` for utilities/services
- **Components:** `PascalCase.tsx` - React components match their export names (`ChatInterface.tsx`, `Button.tsx`)
- **Tests:** `test_*.py` for Python test files, colocated with backend code in `/tests` directory

**Functions:**
- **Python:** `snake_case` for all functions and methods (`generate_research_plan`, `exchange_code_for_tokens`, `get_google_user_info`)
- **TypeScript:** `camelCase` for functions (`getAuthHeader`, `handleResponse`, `setActiveProject`)

**Variables:**
- **Python:** `snake_case` for local variables (`project_id`, `research_goal`, `access_token`)
- **TypeScript:** `camelCase` for all variables (`messagesEndRef`, `textareaRef`, `isLoading`)

**Types/Classes:**
- **Python:** `PascalCase` for classes (`LLMService`, `AuthService`, `ProjectCreate`)
- **TypeScript:** `PascalCase` for interfaces, types, and enums (`Project`, `TaskCounts`, `ProjectStatus`, `ButtonVariant`)

**Constants:**
- **Python:** `UPPER_SNAKE_CASE` for module-level constants (`GOOGLE_CLIENT_ID`, `JWT_SECRET_KEY`, `PROVIDER_ORDER`)
- **TypeScript:** `UPPER_SNAKE_CASE` for constants (`API_BASE_URL`)

## Code Style

**Formatting:**
- **Python:** Black (specified in requirements.txt `black>=23.0.0,<25.0.0`)
- **TypeScript:** No explicit formatter configured, but code follows consistent patterns
- **Python tooling:** isort for imports (`isort>=5.12.0,<6.0.0`)

**Linting:**
- **Python:** flake8 (`flake8>=6.0.0,<9.0.0`), mypy (`mypy>=1.5.0,<2.0.0`)
- **TypeScript:** ESLint configured in `package.json` - extends `react-app` and `react-app/jest`

**Key Settings:**
- **Python:** Line length not explicitly configured (Black default 88)
- **TypeScript:** Strict mode enabled in `tsconfig.json`
- **TypeScript:** Consistent type casing enforced (`forceConsistentCasingInFileNames: true`)

## Import Organization

**Python Order:**
1. Standard library imports
2. Third-party imports
3. Local/application imports
4. Blank line between each group

```python
# From server.py
import os
import logging
from pathlib import Path
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import json

from database import get_db, init_db, close_db
from orchestration import orchestration_engine
from llm_service import llm_service
```

**TypeScript Order:**
1. React imports
2. Third-party library imports
3. Type imports
4. Local component imports
5. Relative imports (types, services, etc.)

```typescript
// From ChatInterface.tsx
import React, { useState, useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';

export interface ChatMessage { ... }
interface ChatInterfaceProps { ... }
```

**Path Aliases:**
- No TypeScript path aliases configured in `tsconfig.json`
- Uses relative imports: `import type { Project } from '../types/project'`

## Error Handling

**Patterns:**
- **Python:** Try-except with logging, raise `ValueError` or `HTTPException` for API errors
- **Python API endpoints:** Wrap operations in try-except, rollback transactions on error, raise `HTTPException` with status codes
- **TypeScript:** Custom `ApiRequestError` class, throw with status codes, catch in components

**Python Example:**
```python
# From server.py
try:
    logger.info(f"Creating project: {project_input.research_goal}")
    project = Project(...)
    db.add(project)
    await db.commit()
except Exception as e:
    logger.error(f"Failed to create project: {e}", exc_info=True)
    await db.rollback()
    raise HTTPException(
        status_code=500,
        detail=f"Failed to create project: {str(e)}"
    )
```

**TypeScript Example:**
```typescript
// From api.ts
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiErrorResponse = await response.json().catch(() => ({
      error: 'UnknownError',
      message: 'An unknown error occurred',
      status: response.status,
    }));
    throw new ApiRequestError(error.message || error.error, error.status, error);
  }
  // ...
}
```

**Error Logging:**
- Python: Use `logger.error()` with `exc_info=True` for exceptions
- Python: Use `logger.warning()` for non-critical failures
- TypeScript: No explicit logging framework detected

## Logging

**Framework:** Python standard `logging` module

**Patterns:**
- **Python:** Configure at module level: `logger = logging.getLogger(__name__)`
- **Python:** Log levels: `logger.info()` for operations, `logger.warning()` for failures, `logger.error()` for exceptions
- **Python:** Include context in log messages (IDs, status, key data)

**When to Log:**
- API endpoint entry/exit: `logger.info(f"Creating project: {research_goal}")`
- Failed operations with context: `logger.warning(f"Failed to generate with {prov}: {e}")`
- Exceptions with stack traces: `logger.error(f"Failed to create project: {e}", exc_info=True)`

## Comments

**When to Comment:**
- Module-level docstrings explain purpose and responsibilities
- Function docstrings follow Google style (Args, Returns, Raises)
- Inline comments for "why" not "what"
- TODO comments for incomplete implementations

**Python Docstrings:**
```python
# From auth_service.py
def get_google_auth_url(self, state: Optional[str] = None) -> str:
    """
    Generate Google OAuth authorization URL.

    Args:
        state: Optional state parameter for CSRF protection

    Returns:
        Authorization URL
    """
```

**TypeScript JSDoc:**
```typescript
/**
 * ChatInterface Component
 *
 * Reusable chat UI with message list and input area.
 * Handles message display, auto-scroll, and user input.
 */
export const ChatInterface: React.FC<ChatInterfaceProps> = ({ ... }) => {
```

**TODO Pattern:**
- TypeScript: `// TODO: [description]` - Found in `useCreditStore.ts`, `useAuthStore.ts`, `ConversationalPlanning.tsx`, `planning.ts`

## Function Design

**Size:**
- Python: Functions typically 10-50 lines, focused on single responsibility
- Largest Python file: `server.py` (1072 lines) - monolithic API endpoints, should be split by feature
- TypeScript: Components typically 50-200 lines, utility functions shorter

**Parameters:**
- **Python:** Use type hints for all parameters, `Optional[T]` for nullable parameters
- **Python:** Pydantic models for request/response validation in API endpoints
- **TypeScript:** Interface definitions for props, use `React.FC<Props>` pattern

**Return Values:**
- **Python:** Explicit return types using `-> Type:` annotation
- **Python:** Return typed Pydantic models from API endpoints
- **TypeScript:** Generic functions with `<T>` type parameter for API responses

## Module Design

**Exports:**
- **Python:** Singleton instances exported at module level (`llm_service = LLMService()`, `auth_service = AuthService()`)
- **TypeScript:** Named exports for components/types, default exports rare

**Barrel Files:**
- **TypeScript:** Index files in feature directories (`components/index.ts`, `services/index.ts`)
- Pattern: Export all components/types from directory's `index.ts`

**Python Modules:**
- Services: Class-based with singleton instance export
- Database: SQLAlchemy models and session management
- API routes: Single large `server.py` with all endpoints (anti-pattern to refactor)

## Type Safety

**Python:**
- **Required:** Type hints on all function parameters and returns
- **Required:** Pydantic models for API request/response
- **Tooling:** mypy configured (`mypy>=1.5.0,<2.0.0`)

**TypeScript:**
- **Required:** `strict: true` in `tsconfig.json`
- **Required:** Interface definitions for all data structures
- **Required:** Type imports: `import type { Project } from '../types/project'`

## Async Patterns

**Python:**
- Use `async def` for all I/O operations (database, HTTP calls)
- Use `AsyncSession` for database operations
- Use `httpx.AsyncClient()` for HTTP requests
- Background tasks via FastAPI's `BackgroundTasks`

**TypeScript:**
- Use `async/await` for all API calls
- Wrap fetch calls in Promise-returning functions
- Use `try/catch` for error handling in async operations

---

*Convention analysis: 2026-01-27*
