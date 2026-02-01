# Codebase Concerns

**Analysis Date:** 2025-01-31

## Security Considerations

**Hardcoded credentials in default values:**
- Risk: Database and Redis connection strings contain default credentials
- Files: `/home/zemul/Programming/research/backend/database/connection.py`, `/home/zemul/Programming/research/backend/realtime/websocket.py`, `/home/zemul/Programming/research/backend/workers/task_worker.py`
- Current mitigation: Environment variable override available
- Recommendations:
  - Remove hardcoded credentials entirely (require explicit env vars)
  - Fail fast on missing credentials
  - Add credential validation at startup

**JWT secret key:**
- Risk: Default JWT secret is a placeholder value
- Files: `/home/zemul/Programming/research/backend/auth_service.py`
- Current mitigation: Documented in SECURITY.md
- Recommendations:
  - Generate strong secret at setup time
  - Validate secret is not default value at startup

**CORS configuration:**
- Risk: Default CORS allows all origins (`*`)
- Files: `/home/zemul/Programming/research/backend/server.py`
- Current mitigation: Can be overridden via `CORS_ORIGINS` env var
- Recommendations:
  - Change default to strict whitelist
  - Document required origins for deployment

**Frontend token storage:**
- Risk: JWT tokens stored in localStorage vulnerable to XSS
- Files: `/home/zemul/Programming/research/frontend/src/lib/api.js`
- Current mitigation: None identified
- Recommendations:
  - Implement httpOnly cookie-based auth
  - Add CSRF protection
  - Implement token refresh mechanism

**API key exposure risk:**
- Risk: Multiple LLM API keys read from environment
- Files: `/home/zemul/Programming/research/backend/llm_service.py`
- Current mitigation: Uses os.environ.get()
- Recommendations:
  - Validate all keys are present before enabling providers
  - Add key rotation mechanism
  - Consider secrets management service (AWS Secrets Manager, etc.)

## Tech Debt

**Monolithic server file:**
- Issue: Server file contains 1072 lines with mixed concerns
- Files: `/home/zemul/Programming/research/backend/server.py`
- Impact: Difficult to navigate, test, and maintain
- Fix approach: Split into domain-based routers (projects.py, tasks.py, artifacts.py, papers.py)

**Exception handling swallows errors:**
- Issue: Multiple bare exception handlers and generic catches
- Files: `/home/zemul/Programming/research/backend/pdf_service.py`, `/home/zemul/Programming/research/backend/export_service.py`
- Impact: Errors are logged but not propagated, making debugging difficult
- Fix approach: Add structured error types and proper error propagation

**Database session management:**
- Issue: Context manager in connection.py may not close sessions on all error paths
- Files: `/home/zemul/Programming/research/backend/database/connection.py`
- Impact: Potential connection leaks under error conditions
- Fix approach: Add explicit session cleanup logging and monitoring

**Orchestration complexity:**
- Issue: 590-line orchestration engine with complex dependency logic
- Files: `/home/zemul/Programming/research/backend/orchestration/engine.py`
- Impact: Difficult to test and modify task scheduling logic
- Fix approach: Extract dependency resolution into separate module

**Frontend uses JavaScript instead of TypeScript:**
- Issue: Frontend codebase uses .jsx/.js without type safety
- Files: `/home/zemul/Programming/research/frontend/src/**/*.jsx`
- Impact: Runtime type errors, reduced IDE support
- Fix approach: Migrate to TypeScript gradually

## Known Bugs

**No identified bugs**
- No TODO, FIXME, or BUG comments found in codebase
- Error handling appears comprehensive but may mask issues

## Performance Bottlenecks

**Synchronous PDF processing in async context:**
- Problem: PDF extraction functions are synchronous but called in async handlers
- Files: `/home/zemul/Programming/research/backend/pdf_service.py` (extract_text_pymupdf, extract_text_pdfplumber)
- Cause: PyMuPDF and pdfplumber don't support async
- Improvement path:
  - Run PDF processing in thread pool executor
  - Implement parallel PDF processing for multiple papers
  - Add caching for already-extracted PDFs

**Rate limiting delays:**
- Problem: Synchronous sleep for rate limiting blocks event loop
- Files: `/home/zemul/Programming/research/backend/literature_service.py` (lines 34, 71)
- Cause: `await asyncio.sleep()` in critical path
- Improvement path:
  - Implement token bucket algorithm
  - Use separate worker for API calls
  - Batch requests where possible

**N+1 query potential:**
- Problem: Task and artifact queries may trigger N+1 queries when loading relationships
- Files: `/home/zemul/Programming/research/backend/server.py` (line 575), `/home/zemul/Programming/research/backend/orchestration/engine.py`
- Cause: Individual selects without eager loading
- Improvement path:
  - Audit all endpoints for N+1 patterns
  - Add selectinload/joinedload where appropriate
  - Add query count monitoring

**Large file processing:**
- Problem: PDF files downloaded and processed synchronously
- Files: `/home/zemul/Programming/research/backend/pdf_service.py`
- Cause: No streaming or chunked processing
- Improvement path:
  - Implement streaming download
  - Add max file size limits
  - Process PDFs in background workers

## Fragile Areas

**Credit deduction logic:**
- Files: `/home/zemul/Programming/research/backend/credit_service.py`, `/home/zemul/Programming/research/backend/database/credit_models.py`
- Why fragile: Race condition possible between credit check and deduction
- Safe modification:
  - Implement row-level locking for credit operations
  - Use database transactions with proper isolation level
  - Add idempotency keys for credit transactions
- Test coverage: Not visible from analysis, likely needs coverage for concurrent operations

**WebSocket connection management:**
- Files: `/home/zemul/Programming/research/backend/realtime/websocket.py`
- Why fragile: Manual connection cleanup, potential memory leaks
- Safe modification:
  - Add connection timeout handling
  - Implement heartbeat/ping-pong mechanism
  - Add monitoring for connection count
- Test coverage: Needs testing for disconnect/reconnect scenarios

**Task worker state management:**
- Files: `/home/zemul/Programming/research/backend/workers/task_worker.py` (529 lines)
- Why fragile: Complex state transitions, Redis queue management
- Safe modification:
  - Add state transition validation
  - Implement task timeout handling
  - Add dead letter queue for failed tasks
- Test coverage: Critical for task execution reliability

**Orchestration dependency resolution:**
- Files: `/home/zemul/Programming/research/backend/orchestration/engine.py` (lines 85-160)
- Why fragile: Complex fuzzy matching logic, phase dependencies
- Safe modification:
  - Extract dependency matching to separate module
  - Add validation for circular dependencies
  - Unit test dependency graph construction
- Test coverage: Needs comprehensive dependency graph test cases

**Literature search API integration:**
- Files: `/home/zemul/Programming/research/backend/literature_service.py`
- Why fragile: External API dependencies (Semantic Scholar, arXiv, Unpaywall)
- Safe modification:
  - Add circuit breaker pattern for API calls
  - Implement exponential backoff
  - Add fallback to cached results
- Test coverage: Needs testing for API failures and rate limits

## Scaling Limits

**Single worker process:**
- Current capacity: One task worker instance
- Limit: Constrained by single process event loop
- Scaling path:
  - Deploy multiple worker instances
  - Implement consistent hashing for task assignment
  - Add worker health monitoring

**PostgreSQL connection pool:**
- Current capacity: pool_size=10, max_overflow=20 (30 total connections)
- Files: `/home/zemul/Programming/research/backend/database/connection.py`
- Limit: 30 concurrent database connections
- Scaling path:
  - Implement connection pooling middleware (PgBouncer)
  - Add connection monitoring
  - Scale based on load metrics

**Redis pub/sub:**
- Current capacity: Single Redis instance
- Files: `/home/zemul/Programming/research/backend/realtime/websocket.py`
- Limit: Single point of failure, no scaling
- Scaling path:
  - Implement Redis Cluster
  - Add Redis Sentinel for high availability
  - Consider message queue alternative (RabbitMQ, Kafka)

**Task queue in Redis list:**
- Current capacity: In-memory queue only
- Files: `/home/zemul/Programming/research/backend/workers/task_worker.py`
- Limit: Queue lost if Redis restarts
- Scaling path:
  - Implement persistent queue (Redis Streams, RabbitMQ)
  - Add queue monitoring and alerting
  - Implement priority queue

## Dependencies at Risk

**LLM provider APIs:**
- Risk: API changes, rate limits, service deprecation
- Files: `/home/zemul/Programming/research/backend/llm_service.py`
- Impact: LLM calls fail, research tasks incomplete
- Migration plan:
  - Implement abstraction layer for LLM providers
  - Add automatic fallback to alternative providers
  - Monitor API status and deprecation notices

**PDF parsing libraries:**
- Risk: PyMuPDF, pdfplumber maintenance status
- Files: `/home/zemul/Programming/research/backend/requirements.txt` (lines 28-30)
- Impact: PDF extraction fails or produces incorrect results
- Migration plan:
  - Test alternative PDF libraries (pdfminer.six already included)
  - Implement graceful degradation
  - Add PDF format validation

**Frontend build tooling:**
- Risk: Create React App (CRA) deprecated
- Files: `/home/zemul/Programming/research/frontend/package.json` (react-scripts, craco)
- Impact: Build failures, security vulnerabilities
- Migration plan:
  - Migrate to Vite or Next.js
  - Update to webpack 5 configuration
  - Remove dependency on CRA ecosystem

## Missing Critical Features

**Rate limiting:**
- Problem: No rate limiting on API endpoints
- Blocks: Production deployment, DoS prevention
- Files: All API endpoints in `/home/zemul/Programming/research/backend/server.py`
- Implementation: Add slowapi or similar rate limiting middleware

**Input validation and sanitization:**
- Problem: Limited validation on user inputs
- Blocks: Security hardening, production readiness
- Files: Pydantic models in server.py
- Implementation: Add comprehensive validation rules, length limits, content sanitization

**Monitoring and observability:**
- Problem: No metrics collection, distributed tracing, or alerting
- Blocks: Production operations, debugging
- Implementation:
  - Add Prometheus metrics
  - Implement structured logging (JSON format)
  - Add OpenTelemetry tracing

**Database migrations:**
- Problem: No formal migration system (manual scripts only)
- Blocks: Schema evolution, safe deployments
- Files: `/home/zemul/Programming/research/backend/scripts/migrate_add_credits.py`
- Implementation: Add Alembic or similar migration tool

**Background job processing:**
- Problem: No dedicated job queue for long-running tasks
- Blocks: Scaling async operations (PDF processing, literature search)
- Implementation: Add Celery or RQ for background jobs

## Test Coverage Gaps

**Untested areas:**

**Concurrent operations:**
- What's not tested: Race conditions in credit deduction, task state changes
- Files: `/home/zemul/Programming/research/backend/credit_service.py`, `/home/zemul/Programming/research/backend/workers/task_worker.py`
- Risk: Data corruption under load
- Priority: High

**WebSocket reconnection:**
- What's not tested: Connection drops, reconnection logic, pub/sub failures
- Files: `/home/zemul/Programming/research/backend/realtime/websocket.py`
- Risk: Users lose real-time updates
- Priority: Medium

**Orchestration edge cases:**
- What's not tested: Circular dependencies, missing dependencies, phase transitions
- Files: `/home/zemul/Programming/research/backend/orchestration/engine.py`
- Risk: Tasks get stuck, projects stall
- Priority: High

**PDF extraction failures:**
- What's not tested: Corrupted PDFs, password-protected PDFs, malformed files
- Files: `/home/zemul/Programming/research/backend/pdf_service.py`
- Risk: Worker crashes, papers not processed
- Priority: Medium

**External API failures:**
- What's not tested: Semantic Scholar rate limits, arXiv failures, Unpaywall errors
- Files: `/home/zemul/Programming/research/backend/literature_service.py`
- Risk: Literature search fails completely
- Priority: Medium

**Frontend error handling:**
- What's not tested: No test files found in frontend
- Files: All `/home/zemul/Programming/research/frontend/src` files
- Risk: UI bugs, poor UX
- Priority: Low

**Authentication flows:**
- What's not tested: OAuth flow, token validation, expired tokens
- Files: `/home/zemul/Programming/research/backend/auth_service.py`
- Risk: Users cannot authenticate
- Priority: High

**Credit system edge cases:**
- What's not tested: Zero credits, negative balance, concurrent deductions
- Files: `/home/zemul/Programming/research/backend/credit_service.py`
- Risk: Accounting errors, billing disputes
- Priority: High

---

*Concerns audit: 2025-01-31*
