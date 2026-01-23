# Testing Patterns

**Analysis Date:** 2025-01-23

## Test Framework

**Backend Python:**
- Runner: pytest (`pytest==9.0.2`)
- Config: Not detected (uses pytest defaults)
- Assertion library: pytest built-in assertions
- HTTP testing: `requests` library for API tests

**Frontend:**
- Runner: Create React App test runner (via `react-scripts`)
- Config: Built into CRA, no custom config detected
- Test command: `yarn test` (uses `craco test`)
- Framework: Not clearly configured (Jest is CRA default)

**Run Commands:**

```bash
# Backend tests
cd /home/zemul/Programming/research/research/backend
pytest                           # Run all tests
pytest -v                        # Verbose output
pytest tests/test_api.py         # Run specific file
pytest --tb=short               # Shorter tracebacks

# Frontend tests
cd /home/zemul/Programming/research/research/frontend
yarn test                       # Run tests in watch mode
yarn test --coverage            # Run with coverage
```

## Test File Organization

**Location:**
- Backend: Co-located in `research/backend/tests/` directory
- Frontend: Not detected (no test files found)
- Root level: `research/backend_test.py` (legacy/integration test)

**Naming:**
- Backend: `test_*.py` pattern (pytest convention)
- Example: `tests/test_api.py`
- Main test file: `backend_test.py` (at backend root)

**Structure:**
```
research/
├── backend/
│   ├── tests/
│   │   └── test_api.py          # API endpoint tests
│   └── backend_test.py          # Integration test suite
└── frontend/
    └── [no test files detected]
```

## Test Structure

**Suite Organization:**

Backend uses class-based test organization with descriptive class names:

```python
# Pattern from research/backend/tests/test_api.py
class TestHealthCheck:
    """Health check endpoint tests"""

    def test_health_check_returns_200(self):
        """Test API health check endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200


class TestProjectsCRUD:
    """Projects CRUD endpoint tests"""

    def test_list_projects(self):
        """Test listing all projects"""
        response = requests.get(f"{BASE_URL}/api/projects")
        assert response.status_code == 200
```

**Patterns:**

**Setup:**
- Base URL from environment variable: `os.environ.get('REACT_APP_BACKEND_URL')`
- Hardcoded test project ID: `TEST_PROJECT_ID = "e3567bdc-794c-468f-90af-c443644bf258"`
- No pytest fixtures detected for setup/teardown
- Tests create their own data and clean up (delete created projects)

**Teardown:**
- Manual cleanup in test methods
- Example: Delete project after testing (`requests.delete(f"{BASE_URL}/api/projects/{project_id}")`)
- No automatic cleanup fixtures

**Assertion pattern:**
- Use `assert response.status_code == 200` for status checks
- Use `assert key in response.json()` for structure validation
- Use `assert isinstance(data, list)` for type validation

```python
# Pattern from research/backend/tests/test_api.py
data = response.json()
assert "status" in data
assert data["status"] == "healthy"
assert isinstance(data["list"]), list)
```

## Mocking

**Framework:** None detected (tests use real backend)

**Patterns:**
- Tests run against live/remote backend (not mocked)
- `BASE_URL` defaults to remote preview deployment
- No pytest fixtures for mocking detected
- No `unittest.mock` usage found

**What to Mock:**
- Not applicable in current test approach
- External API calls should be mocked in unit tests (currently not done)

**What NOT to Mock:**
- Database operations in integration tests (use test database instead)
- HTTP client in integration tests (use test server)

## Fixtures and Factories

**Test Data:**
- Created inline in test methods
- No dedicated factory functions or fixtures
- Test data hardcoded in test methods

```python
# Pattern from research/backend/tests/test_api.py
payload = {
    "research_goal": "TEST_Impact of quantum computing on cryptography",
    "output_type": "literature_review",
    "audience": "Academic researchers"
}
response = requests.post(f"{BASE_URL}/api/projects", json=payload)
```

**Location:**
- No fixtures directory detected
- Test data defined within test methods
- No shared test data files

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
# Backend coverage
pytest --cov=. --cov-report=html
pytest --cov=backend --cov-report=term-missing
```

**Coverage tools installed:**
- No coverage tool detected in requirements.txt
- Consider adding `pytest-cov` for coverage reports

## Test Types

**Unit Tests:**
- Not detected (all tests are integration/API tests)
- Service layer methods are not tested in isolation
- No unit tests for utility functions

**Integration Tests:**
- Primary testing approach
- `test_api.py` tests all CRUD endpoints
- `backend_test.py` provides full API test suite
- Tests run against real backend (possibly staging/preview)

**Test categories in test_api.py:**
- Health checks
- Project CRUD operations
- Task listing and retrieval
- Task graph visualization
- Agent graph visualization
- Artifact endpoints
- Paper endpoints
- Project execution endpoints
- Export formats
- Global statistics

**E2E Tests:**
- Not used
- Frontend has no automated tests
- Consider Playwright or Cypress for frontend E2E

## Common Patterns

**Async Testing:**
- Backend uses pytest-async (implicit, tests are synchronous but call async APIs)
- Frontend async testing patterns not detected

```python
# Async test pattern (calling async backend from sync test)
def test_create_project(self):
    response = requests.post(f"{BASE_URL}/api/projects", json=payload)
    assert response.status_code == 200
    # Test waits for response (async operation handled by backend)
```

**Error Testing:**
- Test 404 responses for non-existent resources
- Test validation errors with invalid payloads

```python
# Pattern from research/backend/tests/test_api.py
def test_get_nonexistent_project_returns_404(self):
    response = requests.get(f"{BASE_URL}/api/projects/nonexistent-id-12345")
    assert response.status_code == 404
    print("✓ Non-existent project returns 404")
```

**Data cleanup pattern:**
- Store created resource IDs on class for cleanup
- Use `getattr(self.__class__, 'created_project_id', None)` pattern
- Skip dependent tests if creation failed

```python
def test_create_project(self):
    # ... create project ...
    self.__class__.created_project_id = data["id"]

def test_delete_project(self):
    project_id = getattr(self.__class__, 'created_project_id', None)
    if not project_id:
        pytest.skip("No project to delete - create test may have failed")
```

**Test discovery:**
- pytest automatically discovers `test_*.py` files
- Tests organized by endpoint/resource (projects, tasks, artifacts, papers)
- Class-based grouping for related tests

---

*Testing analysis: 2025-01-23*
