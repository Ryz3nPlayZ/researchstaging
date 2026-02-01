# Testing Patterns

**Analysis Date:** 2026-01-31

## Test Framework

**Python Backend:**
- Framework: `pytest` (inferred from test file structure and imports)
- Config: No explicit `pytest.ini` detected - using defaults
- Test files location:
  - `/home/zemul/Programming/research/backend/tests/test_api.py` - Main API test suite
  - `/home/zemul/Programming/research/backend_test.py` - Standalone integration test runner

**JavaScript Frontend:**
- Framework: Create React App with `react-scripts` (includes Jest)
- Test script: `npm test` or `yarn test` (configured in `/home/zemul/Programming/research/frontend/package.json`)
- Note: No test files found in frontend source code during exploration

**Assertion Library:**
- Python: Standard `assert` statements
- JavaScript: Jest built-in assertions (not observed in code)

**Run Commands:**
```bash
# Backend - pytest
cd /home/zemul/Programming/research/backend
pytest tests/test_api.py -v

# Backend - standalone test runner
cd /home/zemul/Programming/research
python3 backend_test.py

# Frontend - Jest (CRA)
cd /home/zemul/Programming/research/frontend
npm test              # Run all tests
npm test -- --watch   # Watch mode
npm test -- --coverage # Coverage
```

## Test File Organization

**Backend Python:**
- Location: `backend/tests/` directory
- Naming: `test_*.py` pattern (e.g., `test_api.py`)
- Structure:
```
backend/
├── tests/
│   └── test_api.py          # API endpoint tests
├── backend_test.py          # Root-level integration tests
├── server.py                # Main application
└── *_service.py             # Services to test
```

**Frontend JavaScript:**
- Location: Test files should be co-located with components or in `__tests__` directories (CRA convention)
- Naming: `*.test.js` or `*.test.jsx` pattern
- Note: No test files currently exist in the frontend

**TUI (Python):**
- Location: No test files found in `/home/zemul/Programming/research/research_tui/`

## Test Structure

**Backend API Test Pattern (from `/home/zemul/Programming/research/backend/tests/test_api.py`):**

```python
class TestHealthCheck:
    """Health check endpoint tests"""

    def test_health_check_returns_200(self):
        """Test API health check endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "healthy"
        assert data["version"] == "3.0.0"
        assert "postgresql" in data["features"]
        print("✓ Health check passed - API is healthy with PostgreSQL/Redis/WebSocket")
```

**Class-based organization:**
- Group related tests in classes (e.g., `TestHealthCheck`, `TestProjectsCRUD`, `TestTasksEndpoints`)
- Use descriptive test method names: `test_<verb>_<noun>_<expected_outcome>`
- Docstrings explain what each test does

**Setup pattern:**
- Test class-level setup uses `self.__class__` attributes for sharing data between tests
```python
def test_create_project(self):
    # ... create project ...
    self.__class__.created_project_id = data["id"]

def test_delete_project(self):
    project_id = getattr(self.__class__, 'created_project_id', None)
    if not project_id:
        pytest.skip("No project to delete")
```

**Teardown pattern:**
- Manual cleanup in test methods (delete created resources)
- No automatic teardown fixtures detected

**Assertion pattern:**
- Use `assert` for status codes
- Use `assert` with dictionary access for response validation
- Print success messages for visibility

**Standalone Test Runner Pattern (from `/home/zemul/Programming/research/backend_test.py`):**

```python
class ResearchPilotAPITester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, ...):
        """Run a single API test"""
        # ... execute request ...
        success = response.status_code == expected_status
        if success:
            self.tests_passed += 1
            print(f"✅ Passed - Status: {response.status_code}")
        else:
            print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
        return success, response_data
```

- Uses custom test runner class
- Accumulates test statistics
- Emojis for visual feedback
- Returns tuple of (success, data)

## Mocking

**Framework:** No explicit mocking framework detected

**Patterns:**
- Tests use real HTTP requests to `localhost:8000`
- Environment variable for base URL: `REACT_APP_BACKEND_URL` (defaults to `http://localhost:8000`)
- No mocking of external services detected - tests hit real API
- Test data uses hardcoded project ID: `TEST_PROJECT_ID = "e3567bdc-794c-468f-90af-c443644bf258"`

**What to Mock:**
- Not currently practiced - integration tests hit real backend
- Should consider mocking: External LLM API calls (OpenAI, Gemini, etc.)

**What NOT to Mock:**
- Database operations (integration tests use real PostgreSQL)
- Redis operations (integration tests use real Redis)

## Fixtures and Factories

**Test Data:**
- Hardcoded test data inline in test methods
```python
payload = {
    "research_goal": "TEST_Impact of quantum computing on cryptography",
    "output_type": "literature_review",
    "audience": "Academic researchers"
}
```

**Location:**
- No fixtures directory detected
- No factory pattern for test data
- Each test creates its own data

**Recommendation:** Consider pytest fixtures for common test data

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
# Python (requires pytest-cov)
pytest --cov=. --cov-report=html

# JavaScript (Jest built-in)
npm test -- --coverage
```

**Current State:**
- No coverage configuration detected
- No coverage reports generated during standard test runs

## Test Types

**Unit Tests:**
- Not detected in codebase
- Tests are integration-level (API endpoints with real database)

**Integration Tests:**
- Primary test type in `/home/zemul/Programming/research/backend/tests/test_api.py`
- Scope: Full API stack from HTTP endpoint to database
- Approach: Make real HTTP requests to running backend server
- Requires: Backend server running on `localhost:8000`

**E2E Tests:**
- Not used for frontend
- Backend integration tests could be considered E2E for backend services

**API Testing Coverage (from test_api.py):**
- Health check endpoint
- Projects CRUD (create, read, list, delete)
- Tasks endpoints (list, task graph, agent graph)
- Artifacts endpoints (list)
- Papers endpoints (list)
- Execution endpoints (execute-all)
- Export formats endpoint

## Common Patterns

**Async Testing:**
- Backend is async (FastAPI, SQLAlchemy async)
- Tests use synchronous `requests` library (not async)
- LLM service tests would need async test client if added

**Error Testing:**
```python
def test_get_nonexistent_project_returns_404(self):
    """Test getting a non-existent project returns 404"""
    response = requests.get(f"{BASE_URL}/api/projects/nonexistent-id-12345")
    assert response.status_code == 404
    print("✓ Non-existent project returns 404")
```

**Skipping Tests:**
```python
def test_delete_project(self):
    project_id = getattr(self.__class__, 'created_project_id', None)
    if not project_id:
        pytest.skip("No project to delete - create test may have failed")
```

**Timeout Pattern:**
```python
response = requests.get(url, headers=headers, timeout=timeout)
# 30 second default timeout in standalone test runner
```

## Test Configuration

**Environment Variables:**
- `REACT_APP_BACKEND_URL`: API base URL (default: `http://localhost:8000`)

**Prerequisites for Running Tests:**
- PostgreSQL database running
- Redis server running
- Backend server running on port 8000

**Test Data Setup:**
- Tests assume database has existing test data
- Hardcoded `TEST_PROJECT_ID` used for read operations

## Testing Gaps

**Untested Areas:**
- Frontend components: No React component tests
- Frontend hooks: No custom hook tests
- Frontend utilities: No unit tests for helper functions
- TUI (research_tui): No tests detected
- Service layer unit tests: Tests skip service logic, test only API endpoints
- Worker logic: No direct tests of `/home/zemul/Programming/research/backend/workers/task_worker.py`
- Database models: No ORM validation tests

**Risk:**
- Frontend changes could break without detection
- Service layer bugs may not surface in API tests
- Worker queue processing edge cases untested

**Priority:**
- High: Add React component tests for critical UI flows
- Medium: Add service layer unit tests (LLM, PDF, reference extraction)
- Low: Add TUI tests

---

*Testing analysis: 2026-01-31*
