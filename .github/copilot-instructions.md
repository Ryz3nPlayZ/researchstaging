# Copilot Instructions - Research Pilot

## 🎯 Project Vision
Research Pilot is an **AI-native research execution engine**, not a chatbot. It treats research as a structural pipeline of state-driven tasks.
- **Authority**: [MASTER_SOURCE_OF_TRUTH.md](MASTER_SOURCE_OF_TRUTH.md) is the binding source of truth for all decisions.
- **Philosophy**: Minimal, front-loaded user input. Avoid asking for hypotheses or methods upfront; derive them from literature.

## 🏗️ Architecture & Stack
- **Backend**: FastAPI (Python 3.10+), SQLAlchemy (Async), PostgreSQL, Redis.
- **Frontend**: React, Tailwind CSS, Shadcn UI.
- **Orchestration**: Custom state-driven engine in [backend/orchestration/engine.py](backend/orchestration/engine.py).
- **Communication**: WebSockets for real-time project/task updates.

## 💻 Developer Workflows
### Core Commands
- **Start All (Background)**: `./start-all.sh --background`
- **Backend + Redis**: `./start-backend.sh` (Auto-starts Redis on port 6379, FastAPI on 8000).
- **Frontend V2**: `./start-frontend-v2.sh` (Runs on port 3001).
- **Stop All**: `pkill -f 'uvicorn server:app'`, `pkill -f 'react-scripts'`, `redis-cli shutdown`.

### Testing
- **API Tests**: Run [backend/tests/test_api.py](backend/tests/test_api.py). Note: Tests currently expect a running server environment.

## 📏 Standards & Patterns
### Backend (Python)
- **Async First**: Always use `async`/`await` for DB operations (SQLAlchemy `AsyncSession`) and service calls.
- **Models**: Business logic should revolve around `TaskState` transitions (PENDING → READY → RUNNING → COMPLETED/FAILED).
- **Services**: Encapsulate external logic (LLM, Literature, Export) in `backend/services/`.
- **LLM Usage**: Use `llm_service.py`. It supports provider fallback (OpenAI, Gemini, Mistral, Groq). Gemini is the primary provider.

### Frontend (React)
- **Layout**: Follow the Navigator / Workspace / Inspector 3-panel layout defined in [frontend/src/App.js](frontend/src/App.js).
- **State**: Use `ProjectContext.js` and `ThemeContext.js` for global state.
- **Real-time**: Utilize `createWebSocketConnection` from [frontend/src/lib/api.js](frontend/src/lib/api.js) for live updates.

### Prohibited Patterns
- **❌ No Conversational AI**: Do not implement chat-based research exploration features. Interaction flows must be task-oriented.
- **❌ No Manual State Overrides**: Never update task status directly in models without going through the `OrchestrationEngine`.
- **❌ No SSE**: Server-Sent Events are deprecated; always use WebSockets for real-time data.

## 🔗 Key Files
- [MASTER_SOURCE_OF_TRUTH.md](MASTER_SOURCE_OF_TRUTH.md): Authoritative product/arch spec.
- [backend/database/models.py](backend/database/models.py): Core data structures (Projects, Plans, Tasks, Artifacts).
- [backend/orchestration/engine.py](backend/orchestration/engine.py): Task graph and state machine logic.
- [frontend/src/lib/api.js](frontend/src/lib/api.js): API clients and WebSocket management.
