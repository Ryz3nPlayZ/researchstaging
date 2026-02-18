# Project Guidelines

## Code Style
- Treat [MASTER_SOURCE_OF_TRUTH.md](MASTER_SOURCE_OF_TRUTH.md) as binding for behavior and scope.
- Backend is async-first: keep FastAPI handlers, DB access, and orchestration paths async (`AsyncSession`, `await`) as shown in [backend/server.py](backend/server.py) and [backend/orchestration/engine.py](backend/orchestration/engine.py).
- Keep request/response contracts in typed API models (see [backend/server.py](backend/server.py) and [backend/api_models.py](backend/api_models.py)).
- Centralize enums/status in data models (e.g., `TaskState`, `ProjectStatus`) in [backend/database/models.py](backend/database/models.py).
- Frontend API calls should go through shared clients/utilities; reuse WebSocket helpers in [frontend/src/lib/api.js](frontend/src/lib/api.js).

## Architecture
- This is a research execution engine, not a chat app: workflow is task/DAG/state driven, centered on [backend/orchestration/engine.py](backend/orchestration/engine.py).
- Backend API composition lives in [backend/server.py](backend/server.py) with routers mounted under `/api`.
- Persisted entities (`projects`, `plans`, `tasks`, `task_dependencies`, `artifacts`, `task_runs`) are defined in [backend/database/models.py](backend/database/models.py).
- Real-time project updates use Redis pub/sub + WebSockets via [backend/realtime/websocket.py](backend/realtime/websocket.py); do not introduce SSE.
- Primary active frontend in scripts is `research-ui` (Next.js), while legacy frontends remain in the repo.

## Build and Test
- Start full stack: `./run-all.sh`
- Start backend only: `./run-backend.sh`
- Start frontend only (research-ui): `./run-frontend.sh`
- Backend local dev direct: `cd backend && python server.py`
- Backend tests: `cd backend && pytest` (configured by [backend/pytest.ini](backend/pytest.ini)); API integration tests may require running services.
- Frontend checks (legacy React app): `cd frontend && yarn lint`

## Project Conventions
- Never add conversational research UX; keep interactions task-oriented and execution-first.
- Do not ask for methods/datasets/hypotheses before literature review; only minimal initial inputs (goal, output type, audience).
- Never mutate task status directly in CRUD/business code; route state changes through orchestration engine transition methods.
- Prefer narrow services for external integrations (`llm_service`, `literature_service`, `pdf_service`, `reference_service`) under `backend/`.
- Keep frontend real-time sync via `createWebSocketConnection` rather than polling.

## Integration Points
- LLM providers with fallback are managed in [backend/llm_service.py](backend/llm_service.py) (Gemini/OpenAI/Mistral/Groq).
- Literature discovery integrates Semantic Scholar + arXiv (+ optional Unpaywall enrichment) in [backend/literature_service.py](backend/literature_service.py).
- Auth-aware HTTP + WS client behavior is implemented in [frontend/src/lib/api.js](frontend/src/lib/api.js).
- Runtime orchestration publishes project events over Redis channels consumed by WebSocket clients.

## Security
- Use environment variables for all secrets and provider keys; never hardcode credentials.
- Review CORS/auth changes carefully in [backend/server.py](backend/server.py) (credentials + allowed origins).
- Treat bearer-token handling in frontend API clients as sensitive; avoid logging tokens.
- Keep OAuth/JWT flows in [backend/auth_service.py](backend/auth_service.py) consistent with backend route protections.
