# Code Conventions

**Analysis Date:** 2026-02-11

## Backend Conventions

### Language & Style
- **Language**: Python 3.14+
- **Style Guide**: PEP 8 with Black formatting
- **Line Length**: 88 characters (Black default)
- **Indentation**: 4 spaces

### Naming
**Files:** `snake_case.py` (e.g., `llm_service.py`, `literature_service.py`)
**Classes:** `PascalCase` (e.g., `OrchestrationEngine`, `ProjectService`)
**Functions:** `snake_case` (e.g., `get_project`, `create_task`)
**Constants:** `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)

### Type Hints
**Status:** Partially implemented
**Issues:**
- Inconsistent type annotations across services
- Many functions lack return type hints
- `Optional` used inconsistently

```python
# Good
async def get_project(project_id: str) -> Optional[Project]:
    return await db.get(Project, project_id)

# Bad (no return type)
async def get_project(project_id: str):
    return await db.get(Project, project_id)
```

### Async Patterns
**Convention:** All database operations must be async
```python
async def create_project(data: ProjectCreate) -> Project:
    async with AsyncSessionLocal() as session:
        project = Project(**data.dict())
        session.add(project)
        await session.commit()
        await session.refresh(project)
        return project
```

### Error Handling
**Pattern:** Mixed - inconsistent across codebase
**Issues:**
- Some services raise custom exceptions
- Others return None or empty results
- No standardized error response format

## Frontend Conventions

### Language & Style
- **Language:** JavaScript (moving toward TypeScript)
- **Style:** ESLint with React rules
- **Formatting:** Prettier (inferred from config)

### Naming
**Files:** `PascalCase.jsx` for components, `camelCase.js` for utilities
**Components:** `PascalCase` (e.g., `DashboardView`, `EditorView`)
**Functions:** `camelCase` (e.g., `useEffect`, `handleClick`)
**Constants:** `UPPER_SNAKE_CASE`

### Type Safety
**Status:** Poor - extensive use of `any` and `unknown`
**Issue:** TypeScript provides no actual safety when types aren't defined

```typescript
// Bad: any types defeat type safety
const data: any = await response.json();

// Better: proper interface
interface Paper {
  id: string;
  title: string;
  authors: string[];
}
const data: Paper[] = await response.json();
```

### Component Patterns
**Hooks:** Functional components with hooks
**State:** React Context for global, useState for local
**Effects:** useEffect for side effects

```javascript
// Good pattern
function DashboardView() {
  const { projects, fetchProjects } = useProjectContext();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  return <div>...</div>;
}
```

## Import Conventions

### Backend
```python
# Standard library first
import os
from typing import Optional

# Third-party imports
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

# Local imports
from database.models import Project
from services.project_service import ProjectService
```

### Frontend
```javascript
// External libraries first
import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

// Local imports
import { useProjectContext } from '../context/ProjectContext';
import { Button } from './ui/button';
```

## Inconsistencies

### Type Safety
- **Issue:** Heavy use of `any` in TypeScript
- **Files Affected:**
  - `frontend3/types.ts`: 30+ instances of `any`
  - `frontend3/lib/api.ts`: Missing return types
  - Most components use `unknown` for props

### Error Handling
- **Issue:** No standard pattern
- **Backend:** Mix of try/except, error propagation, silent failures
- **Frontend:** Mix of error boundaries, try/catch, silent failures

### Async Patterns
- **Issue:** Inconsistent await usage
- **Backend:** Generally good async/await usage
- **Frontend:** Missing await in some Promise chains

### TODO Comments
**Count:** 5+ TODO comments in code
**Examples:**
- `// TODO: Implement delete` (DashboardView.tsx)
- `// TODO: Add proper error handling` (multiple files)
- `// TODO: Rename functionality` (server.py)

### Large Functions
**Issue:** Functions violating single responsibility
**Examples:**
- `backend/server.py`: 1000+ lines in main file
- `frontend3/pages/EditorView.tsx`: 500+ lines
- `frontend3/lib/api.ts`: Large mixed API client

## Code Quality Issues

### Magic Numbers
```javascript
// Bad: unexplained constants
setTimeout(() => {}, 5000);

// Good: named constants
const STATUS_CHECK_INTERVAL = 5000;
setTimeout(() => {}, STATUS_CHECK_INTERVAL);
```

### Duplicated Code
- API client code duplicated across frontend versions
- Error handling repeated in multiple files
- Component patterns repeated without abstraction

### Inconsistent State Management
- Some components use Context
- Others use local state
- No clear pattern for when to use which

## Formatting

### Backend
- **Tool:** Black
- **Config:** Default (88 character line length)
- **Status:** Applied inconsistently

### Frontend
- **Tool:** ESLint + Prettier
- **Config:** `frontend3/eslint.config.js`
- **Status:** Config exists, enforcement unclear

---

*Conventions analysis: 2026-02-11*
