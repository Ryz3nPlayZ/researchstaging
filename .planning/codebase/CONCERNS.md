# Codebase Concerns

**Analysis Date:** 2025-01-23

## Tech Debt

**Error Handling Pattern:**
- Issue: Widespread use of bare `except Exception:` clauses that silently swallow errors
- Files: `/home/zemul/Programming/research/research/backend/pdf_service.py:178`, `/home/zemul/Programming/research/research/backend/database/connection.py:39`, `/home/zemul/Programming/research/research/backend/export_service.py:78`
- Impact: Errors are logged but not properly propagated, making debugging difficult
- Fix approach: Replace with specific exception types and ensure proper error handling or re-raising

**Return Value Silencing:**
- Issue: Extensive use of `return None`, `return []`, and `return {}` on error paths without distinction between error and empty result
- Files: `/home/zemul/Programming/research/research/backend/pdf_service.py` (lines 30, 40, 48, 155, 164), `/home/zemul/Programming/research/research/backend/export_service.py` (lines 53, 73, 130, 137, 157, 164, 191, 198)
- Impact: Callers cannot distinguish between "no results" and "operation failed"
- Fix approach: Use Result types (success/error) or raise exceptions instead of returning None

**Duplicate Task Execution Logic:**
- Issue: Two separate task executors exist with overlapping responsibilities
- Files: `/home/zemul/Programming/research/research/backend/task_executor.py` (MongoDB-based) and `/home/zemul/Programming/research/research/backend/workers/task_worker.py` (PostgreSQL-based)
- Impact: Confusion about which executor is used, potential for divergence, maintenance burden
- Fix approach: Consolidate to single executor using PostgreSQL models, remove MongoDB implementation

**Hardcoded Processing Limits:**
- Issue: Magic numbers scattered throughout code for limiting batch sizes
- Files: `/home/zemul/Programming/research/research/backend/workers/task_worker.py:245` (30 papers), `:329` (20 papers), `/home/zemul/Programming/research/research/backend/task_executor.py:140` (50 papers), `:259` (30 papers)
- Impact: No centralized configuration, difficult to tune for performance
- Fix approach: Extract to configuration file with environment-specific overrides

**Incomplete Exception Handling in Worker Loop:**
- Issue: Worker catches all exceptions in main loop but continues running
- Files: `/home/zemul/Programming/research/research/backend/workers/task_worker.py:491-493`
- Impact: Persistent errors cause repeated failures without backoff or escalation
- Fix approach: Add circuit breaker pattern, exponential backoff, and max consecutive failure threshold

## Known Bugs

**Task Run Creation Edge Case:**
- Symptoms: Line 171 in task_worker.py references `run.id` when `run` may not be defined on exception
- Files: `/home/zemul/Programming/research/research/backend/workers/task_worker.py:171`
- Trigger: Exception occurring before task run creation completes
- Workaround: None exists, will crash on task failure before run creation
- Fix approach: Check if run variable exists before using it in exception handler

**WebSocket Memory Leak:**
- Symptoms: Active connections dictionary accumulates dead WebSocket connections
- Files: `/home/zemul/Programming/research/research/backend/realtime/websocket.py:27`
- Trigger: Client disconnects without proper close, network issues
- Workaround: Manual cleanup only
- Fix approach: Implement periodic connection health check with automatic cleanup

**PDF Content Truncation:**
- Symptoms: Full text truncated to 50000 characters without warning
- Files: `/home/zemul/Programming/research/research/backend/workers/task_worker.py:249`, `/home/zemul/Programming/research/research/backend/task_executor.py:158`
- Trigger: Papers with longer content
- Workaround: None, data silently lost
- Fix approach: Store in chunks or use TEXT field with proper size limits, add logging when truncated

**JSON Parsing in LLM Responses:**
- Symptoms: Research plan generation fails silently if LLM returns non-JSON
- Files: `/home/zemul/Programming/research/research/backend/llm_service.py:188-197`, `/home/zemul/Programming/research/research/backend/planning_service.py:191-196`
- Trigger: LLM returns conversational text before/after JSON block
- Workaround: Falls back to raw response but loses structured plan
- Fix approach: Add retry with refined prompt, better JSON extraction regex

## Security Considerations

**Database Credentials in URL:**
- Risk: Hardcoded credentials in default DATABASE_URL
- Files: `/home/zemul/Programming/research/research/backend/database/connection.py:12`
- Current mitigation: None documented, uses default credentials
- Recommendations: Require DATABASE_URL from environment, fail fast if not set

**CORS Configuration:**
- Risk: Default CORS allows all origins (`*`) if not configured
- Files: `/home/zemul/Programming/research/research/backend/server.py:1020`
- Current mitigation: Relies on CORS_ORIGINS env var
- Recommendations: Set strict default, document required env var, validate origins format

**No Rate Limiting:**
- Risk: No rate limits on API endpoints
- Files: `/home/zemul/Programming/research/research/backend/server.py` (endpoints lack rate limiting)
- Current mitigation: None
- Recommendations: Add rate limiting middleware, especially for LLM endpoints and project creation

**External API Keys:**
- Risk: LLM API key loaded from environment but no validation on startup
- Files: `/home/zemul/Programming/research/research/backend/llm_service.py:29-31`
- Current mitigation: Warning logged but service continues
- Recommendations: Fail fast if EMERGENT_LLM_KEY not set, validate key format

**Subprocess Command Injection:**
- Risk: Export service uses subprocess.run with Pandoc
- Files: `/home/zemul/Programming/research/research/backend/export_service.py:116-125`, `143-152`, `172-181`
- Current mitigation: Arguments are hardcoded lists, not user input
- Recommendations: Document security assumption, add validation if format/params become user-controlled

## Performance Bottlenecks

**Synchronous PDF Processing:**
- Problem: PDFs processed sequentially in task execution
- Files: `/home/zemul/Programming/research/research/backend/workers/task_worker.py:245-254`
- Cause: Loop awaits each PDF processing call individually
- Improvement path: Process PDFs concurrently with asyncio.gather and semaphore for rate limiting

**N+1 Query in Task List:**
- Problem: Listing project tasks may trigger separate queries for dependencies
- Files: `/home/zemul/Programming/research/research/backend/server.py:496-500`
- Cause: SQLAlchemy relationship loading not optimized
- Improvement path: Use selectinload() or joinedload() for dependencies in initial query

**No Connection Pooling for External APIs:**
- Problem: New httpx client created for each service instance
- Files: `/home/zemul/Programming/research/research/backend/literature_service.py:191-192`
- Cause: Client instantiation in __init__
- Improvement path: Use singleton httpx client with connection pooling at module level

**Full Text Search Not Indexed:**
- Problem: No full-text search indexes on Paper.title or abstract
- Files: `/home/zemul/Programming/research/research/backend/database/models.py:382-385`
- Cause: Only basic indexes defined
- Improvement path: Add PostgreSQL GIN indexes for full-text search capability

**Citation Network Graph Computation:**
- Problem: Graph layout computed on every request
- Files: `/home/zemul/Programming/research/research/backend/server.py:924-943`
- Cause: Layout algorithm runs server-side for each request
- Improvement path: Cache layout positions, compute incrementally, or delegate to frontend

## Fragile Areas

**Orchestration State Machine:**
- Files: `/home/zemul/Programming/research/research/backend/orchestration/engine.py:254-312`
- Why fragile: State transitions manually validated, complex dependency resolution
- Safe modification: Add state transition logging, write comprehensive integration tests
- Test coverage: No automated tests for state transition validation visible

**Reference Extraction Regex:**
- Files: `/home/zemul/Programming/research/research/backend/reference_service.py:28-49`
- Why fragile: Relies on regex patterns for citation parsing, many edge cases
- Safe modification: Add test corpus of diverse citation formats, gradual pattern refinement
- Test coverage: Confidence scoring exists but no tests for accuracy visible

**DAG Validation Algorithm:**
- Files: `/home/zemul/Programming/research/research/backend/orchestration/engine.py:118-162`
- Why fragile: Custom cycle detection, no tests for malformed graphs
- Safe modification: Add test cases for various DAG structures, validate performance with large graphs
- Test coverage: No test fixtures for complex dependency graphs visible

**WebSocket Connection Management:**
- Files: `/home/zemul/Programming/research/research/backend/realtime/websocket.py:21-128`
- Why fragile: Manual connection tracking, no heartbeat validation, memory leak risk
- Safe modification: Add connection TTL monitoring, implement graceful shutdown
- Test coverage: No tests for connection lifecycle or reconnection scenarios

**LLM Plan Generation:**
- Files: `/home/zemul/Programming/research/research/backend/llm_service.py:145-198`, `/home/zemul/Programming/research/research/backend/planning_service.py:139-211`
- Why fragile: Depends on unstructured LLM output, JSON parsing fragile
- Safe modification: Add schema validation with pydantic, implement retry with fallback
- Test coverage: No tests for malformed LLM responses visible

## Scaling Limits

**Single Worker Process:**
- Current capacity: One worker loop processes all tasks sequentially
- Limit: Cannot process multiple tasks concurrently, single point of failure
- Scaling path: Deploy multiple worker instances with Redis queue, add worker health monitoring

**Database Connection Pool:**
- Current capacity: pool_size=10, max_overflow=20 (30 connections max)
- Files: `/home/zemul/Programming/research/research/backend/database/connection.py:15-21`
- Limit: 30 concurrent database connections
- Scaling path: Configure based on deployment, add connection metrics, implement pgbouncer for high concurrency

**Redis Single Point of Failure:**
- Current capacity: Single Redis instance for queue and pub/sub
- Files: `/home/zemul/Programming/research/research/backend/realtime/websocket.py:18`, `/home/zemul/Programming/research/research/backend/workers/task_worker.py:39-42`
- Limit: Redis failure breaks task queue and WebSocket updates
- Scaling path: Add Redis Sentinel or Cluster, implement queue backup mechanism

**No Horizontal Scaling Support:**
- Current capacity: Single server instance only
- Limit: Cannot scale API servers horizontally
- Scaling path: Add distributed session storage, remove any in-memory state, document stateless requirements

**Task Throughput:**
- Current capacity: Limited by LLM API rate limits and sequential processing
- Limit: No batching for LLM calls, rate limiting handled client-side
- Scaling path: Implement request batching, add priority queues, cache LLM responses

## Dependencies at Risk

**emergentintegrations:**
- Risk: Custom/unknown package for LLM integration (version 0.1.0)
- Files: `/home/zemul/Programming/research/research/backend/requirements.txt:38`
- Impact: Breaks all LLM functionality if package becomes unavailable
- Migration plan: Abstract LLM interface, implement fallback to direct OpenAI/Gemini APIs

**PyMuPDF (fitz):**
- Risk: Used for PDF parsing, complex dependency
- Files: `/home/zemul/Programming/research/research/backend/requirements.txt:96`
- Impact: PDF processing fails if package breaks
- Migration plan: pdfplumber already available as fallback, ensure both paths tested

**pypandoc:**
- Risk: System dependency on Pandoc binary
- Files: `/home/zemul/Programming/research/research/backend/requirements.txt:102`
- Impact: Export to PDF/DOCX fails if Pandoc not installed
- Migration plan: Add startup validation, provide pure-Python alternatives for basic formats

**redis.asyncio:**
- Risk: Async Redis dependency, less mature than synchronous client
- Files: `/home/zemul/Programming/research/research/backend/requirements.txt` (implied by aioredis)
- Impact: WebSocket and task queue functionality
- Migration plan: Consider using synchronous Redis with thread pool, or Celery for task queue

**motor (MongoDB async):**
- Risk: MongoDB async driver, but PostgreSQL is primary database
- Files: `/home/zemul/Programming/research/research/backend/requirements.txt:68`
- Impact: Unused if task_executor.py is legacy code
- Migration plan: Remove if MongoDB code path is deprecated, update requirements.txt

## Missing Critical Features

**No Authentication/Authorization:**
- Problem: No user authentication or project ownership checks
- Files: `/home/zemul/Programming/research/research/backend/server.py` (endpoints lack auth decorators)
- Blocks: Multi-tenant deployment, access control, audit trails

**No Input Validation:**
- Problem: Minimal validation on research_goal length, malicious input possible
- Files: `/home/zemul/Programming/research/research/backend/server.py:68-72` (ProjectCreate model)
- Blocks: Production deployment with untrusted users

**No Task Cancellation:**
- Problem: Cannot cancel running tasks, only pause project execution
- Files: Task executor has CANCELLED state but no implementation
- Blocks: User control over long-running operations, cost management

**No Progress Reporting:**
- Problem: Long-running tasks provide no progress updates during execution
- Files: Task state only updates at completion
- Blocks: User experience for operations like PDF processing on large paper sets

**No Retry Configuration:**
- Problem: Max retries hardcoded to 3, no exponential backoff
- Files: `/home/zemul/Programming/research/research/backend/database/models.py:194`
- Blocks: Fine-tuning for different task types, cost optimization

## Test Coverage Gaps

**Untested area: Orchestration State Machine**
- What's not tested: State transitions, DAG validation, dependency resolution
- Files: `/home/zemul/Programming/research/research/backend/orchestration/engine.py`
- Risk: Invalid states, circular dependencies breaking execution
- Priority: High

**Untested area: WebSocket Lifecycle**
- What's not tested: Connection, reconnection, pub/sub message delivery
- Files: `/home/zemul/Programming/research/research/backend/realtime/websocket.py`
- Risk: Real-time updates failing silently, connection leaks
- Priority: High

**Untested area: Error Recovery**
- What's not tested: Worker behavior on task failure, retry logic, partial completion
- Files: `/home/zemul/Programming/research/research/backend/workers/task_worker.py`
- Risk: Projects stuck in failed state, no recovery path
- Priority: High

**Untested area: PDF Processing Edge Cases**
- What's not tested: Corrupted PDFs, password-protected files, malformed documents
- Files: `/home/zemul/Programming/research/research/backend/pdf_service.py`
- Risk: Batch failures on problematic PDFs
- Priority: Medium

**Untested area: LLM Error Handling**
- What's not tested: API timeout, rate limit responses, malformed JSON
- Files: `/home/zemul/Programming/research/research/backend/llm_service.py`
- Risk: Cascading failures on LLM issues
- Priority: Medium

**Untested area: Reference Extraction Accuracy**
- What's not tested: Citation parsing on diverse formats, confidence score calibration
- Files: `/home/zemul/Programming/research/research/backend/reference_service.py`
- Risk: Low-quality reference data, broken citation networks
- Priority: Low

---

*Concerns audit: 2025-01-23*
