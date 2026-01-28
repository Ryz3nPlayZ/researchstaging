# Testing Patterns

**Analysis Date:** 2026-01-27

## Test Framework

**Backend (Python):**
- **Runner:** pytest (`pytest>=7.4.0,<9.0.0`)
- **Async support:** pytest-asyncio (`pytest-asyncio>=0.21.0,<1.0.0`)
- **Config:** No pytest config file detected, using default pytest discovery
- **Run command:** `pytest` (default), or `pytest tests/test_api.py -v --tb=short`

**Frontend (TypeScript):**
- **Runner:** React Testing Library (via `react-scripts test`)
- **Config:** Jest configured by create-react-app (`@testing-library/react`, `@testing-library/jest-dom`)
- **Run commands:**
  ```bash
  npm test                # Run all tests in watch mode
  npm test -- --coverage # Run with coverage
  npm test -- --watchAll=false # Run once without watch
  ```
- **Note:** No test files found in frontend-v2/src during exploration

## Test File Organization

**Backend Location:**
- Tests colocated in `/backend/tests/` directory (not with source files)
- Test file naming: `test_*.py` pattern (e.g., `test_api.py`)
- Only one test file found: `/backend/tests/test_api.py`

**Frontend Location:**
- Pattern from create-react-app: `src/__tests__/` or `*.test.tsx` / `*.spec.tsx`
- No test files currently exist in frontend-v2

**Structure:**
```
backend/
├── tests/
│   └── test_api.py           # API endpoint integration tests
├── server.py                 # Main API file
├── llm_service.py            # Service under test
└── auth_service.py           # Service under test

frontend-v2/
├── src/                      # No test files detected
└── setupTests.ts             # Test setup (create-react-app default)
```

## Test Structure

**Backend Suite Organization:**
```python
# From test_api.py
class TestHealthCheck:
    """Health check endpoint tests"""

    def test_health_check_returns_200(self):
        """Test API health check endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        # ...

class TestProjectsCRUD:
    """Projects CRUD endpoint tests"""

    def test_list_projects(self):
        """Test listing all projects"""
        # ...

    def test_create_project(self):
        """Test creating a new project"""
        # Creates data, asserts response, verifies persistence
        # Stores ID for cleanup: self.__class__.created_project_id
```

**Patterns:**
- **Test classes:** Group related tests in classes (`TestHealthCheck`, `TestProjectsCRUD`, `TestTasksEndpoints`)
- **Test methods:** `test_<descriptive_name>` pattern
- **Docstrings:** Each test has a docstring describing what it tests
- **Setup/Teardown:** Manual cleanup using `self.__class__` to share state between tests
- **No fixtures detected:** Tests use direct API calls rather than pytest fixtures

**Assertions:**
- Use standard `assert` statements
- Assert status codes: `assert response.status_code == 200`
- Assert JSON structure: `assert "projects" in data`
- Assert data types: `assert isinstance(data, list)`
- Print statements for debugging: `print("✓ Health check passed")`

## Mocking

**Framework:** No mocking framework detected in backend

**Patterns:**
- **No mocks used:** Current integration tests make real HTTP requests to live backend
- **Test project ID:** Hardcoded `TEST_PROJECT_ID = "e3567bdc-794c-468f-90af-c443644bf258"`
- **Cleanup:** Tests create/delete real projects for isolation

**What to Mock:**
- **Not currently mocked:** HTTP calls to backend (tests are integration tests)
- **Should mock:** External API calls (LLM providers, Google OAuth, Semantic Scholar)
- **Should mock:** Database operations for unit tests

**What NOT to Mock:**
- **Integration tests:** Keep real database calls for end-to-end verification
- **Pydantic models:** Don't mock validation logic

## Fixtures and Factories

**Test Data:**
```python
# Manual test data creation in test methods
payload = {
    "research_goal": "TEST_Impact of quantum computing on cryptography",
    "output_type": "literature_review",
    "audience": "Academic researchers"
}
response = requests.post(f"{BASE_URL}/api/projects", json=payload)
```

**Location:**
- Test data created inline in test methods
- No fixture files or factory functions detected
- No test database seeding scripts

**Recommendations:**
- Create pytest fixtures for common test data (projects, tasks, artifacts)
- Use factory pattern for creating complex test objects
- Separate test database to avoid polluting development data

## Coverage

**Requirements:** No coverage target enforced in requirements.txt

**View Coverage:**
```bash
# Run pytest with coverage (need to install pytest-cov first)
pytest --cov=. --cov-report=html
```

**Current State:**
- Only one test file (`test_api.py`)
- Tests cover API endpoints but not services, models, or utilities
- No coverage for `llm_service.py`, `auth_service.py`, `credit_service.py`, etc.
- No frontend tests

## Test Types

**Unit Tests:**
- **Not detected:** No unit tests for individual functions or classes
- **Missing:** Tests for service methods, model validation, utility functions
- **Should test:** LLM service method logic, auth token generation/verification

**Integration Tests:**
- **Backend:** Present in `test_api.py` - tests full HTTP request/response cycle
- **Scope:** API endpoints for projects, tasks, artifacts, papers, execution
- **Approach:** Make real HTTP requests using `requests` library
- **Example:** Create project via API, fetch it back, assert persistence

**E2E Tests:**
- **Not detected:** No end-to-end UI tests
- **Could use:** Playwright, Cypress, or Testing Library for React components

## Common Patterns

**Async Testing:**
```python
# pytest-asyncio for async functions (not currently used)
@pytest.mark.asyncio
async def test_async_operation():
    result = await some_async_function()
    assert result is not None
```

**Error Testing:**
```python
# From test_api.py
def test_get_nonexistent_project_returns_404(self):
    """Test getting a non-existent project returns 404"""
    response = requests.get(f"{BASE_URL}/api/projects/nonexistent-id-12345")
    assert response.status_code == 404
    print("✓ Non-existent project returns 404")
```

**State Sharing Between Tests:**
```python
# Anti-pattern: using class-level state
def test_create_project(self):
    # ...
    self.__class__.created_project_id = data["id"]

def test_delete_project(self):
    project_id = getattr(self.__class__, 'created_project_id', None)
    if not project_id:
        pytest.skip("No project to delete - create test may have failed")
```

**Better Pattern:** Use pytest fixtures
```python
@pytest.fixture
async def test_project(db):
    project = await create_test_project(db)
    yield project
    await cleanup_test_project(db, project.id)

async def test_delete_project(test_project):
    # Use test_project fixture
    pass
```

## Testing Gaps

**Untested Areas:**
- **Backend Services:** No unit tests for `llm_service.py`, `auth_service.py`, `credit_service.py`, `planning_service.py`, `literature_service.py`, `reference_service.py`, `pdf_service.py`, `export_service.py`
- **Database Models:** No tests for model validation, relationships, constraints
- **Orchestration:** No tests for task graph logic, state transitions, dependency resolution
- **WebSocket:** No tests for real-time updates
- **Frontend:** No component tests, no hook tests, no integration tests

**Critical Missing Tests:**
- LLM service fallback logic (multiple providers)
- JWT token generation/verification
- Credit transaction logic
- Task state machine transitions
- React component rendering and user interactions

**Priority Areas for Testing:**
1. **High:** Auth service (JWT, OAuth flow)
2. **High:** Credit service (financial transactions)
3. **High:** Task orchestration (state machine, dependencies)
4. **Medium:** LLM service (provider fallback, JSON parsing)
5. **Medium:** Frontend components (critical user flows)
6. **Low:** Utility functions

## Test Data Management

**Current Approach:**
- Tests use hardcoded test project ID: `TEST_PROJECT_ID = "e3567bdc-794c-468f-90af-c443644bf258"`
- Creates new test projects that need cleanup
- No test database isolation

**Recommended Improvements:**
1. **Test database:** Separate PostgreSQL database for testing
2. **Fixtures:** Create pytest fixtures for common test data
3. **Cleanup:** Automatic cleanup using pytest fixtures (yield pattern)
4. **Isolation:** Each test should create/clean its own data
5. **Seeding:** Script to populate test database with known state

---

*Testing analysis: 2026-01-27*
