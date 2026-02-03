# Architecture Research: Stateful AI Workspace

**Domain:** Collaborative AI workspace architecture
**Researched:** 2026-02-03
**Confidence:** MEDIUM

## Executive Summary

Stateful AI workspaces represent a fundamental architectural shift from pipeline-based execution to persistent, collaborative environments. Research indicates these systems require **five core subsystems**:

1. **Rich Text Editor Backend** → Real-time sync, auto-save, version history
2. **AI Chat Orchestration** → Proposal system, context retrieval, agent dispatch
3. **File Management** → Upload, metadata extraction, semantic indexing
4. **Data Analysis Execution** → Sandboxed code execution, result streaming
5. **Artifact Memory** → Information graph, vector search, context management

**Primary recommendation:** Build incrementally starting with the editor → auto-save → AI chat → file management → analysis execution. This ordering reflects both technical dependencies and user value progression.

**Key architectural insight:** Modern AI workspaces (Notion, Windsurf Wave, Cursor) treat **the document as the source of truth**, with AI agents operating as read/write participants in a collaborative editing model rather than external tools.

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                                │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   TipTap Editor  │  │   Sidebar Chat   │  │  File Explorer   │  │
│  │   (Main Panel)   │  │   (AI Agent)     │  │  (Resources)     │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
│           │                     │                     │              │
└───────────┼─────────────────────┼─────────────────────┼──────────────┘
            │ WebSocket           │ WebSocket           │ HTTP REST
            │ (document sync)     │ (AI proposals)      │ (file ops)
            ↓                     ↓                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        API Gateway Layer                             │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │              FastAPI with WebSocket Manager                  │   │
│  │  - Request routing & authentication                          │   │
│  │  - WebSocket connection multiplexing (doc + chat)            │   │
│  │  - Rate limiting & request validation                        │   │
│  └─────────────────────────────────────────────────────────────┘   │
└───────────┬─────────────────────┬─────────────────────┬──────────────┘
            │                     │                     │
            ↓                     ↓                     ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        Service Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Document     │  │ Orchestration│  │ File         │              │
│  │ Service      │  │ Service      │  │ Service      │              │
│  │ - Auto-save  │  │ - Proposals  │  │ - Upload     │              │
│  │ - Versioning │  │ - Agents     │  │ - Metadata   │              │
│  │ - Sync       │  │ - Context    │  │ - Indexing   │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                      │
│         └─────────────────┴─────────────────┘                      │
│                           ↓                                         │
│  ┌─────────────────────────────────────────────────────┐          │
│  │              Artifact Memory Service                 │          │
│  │  - Information graph (relationships)                 │          │
│  │  - Vector search (semantic similarity)               │          │
│  │  - Context assembly for AI agents                    │          │
│  └─────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        Execution Layer                               │
│  ┌─────────────────────────────────────────────────────┐          │
│  │          Docker Sandboxed Code Executor              │          │
│  │  - Python/R kernel management                        │          │
│  │  - Resource limits (CPU, memory, timeout)            │          │
│  │  - Result streaming (stdout, plots, dataframes)      │          │
│  └─────────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        Data Storage Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ PostgreSQL   │  │ Redis        │  │ File Storage │              │
│  │ - Documents  │  │ - Pub/Sub    │  │ - User files │              │
│  │ - Artifacts  │  │ - Cache      │  │ - Code cells │              │
│  │ - Graph DB   │  │ - Sessions   │  │ - Outputs    │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐                                                │
│  │ Vector Store │  (Optional: pgvector extension or separate DB)   │
│  │ - Embeddings │                                                │
│  └──────────────┘                                                │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **TipTap Editor** | Rich text editing, collaborative cursors, AI insertion points | TipTap + Yjs for CRDT-based sync |
| **Document Service** | Auto-save with debouncing, version history, document state persistence | REST API + WebSocket for real-time updates |
| **Orchestration Service** | AI proposal generation, agent dispatch, context retrieval & assembly | Multi-agent supervisor-worker pattern |
| **File Service** | File upload, metadata extraction (ML-based), semantic indexing | Async upload pipeline + background indexing |
| **Artifact Memory** | Information graph (doc relationships), vector search, context window management | PostgreSQL + pgvector or Neo4j |
| **Code Executor** | Sandboxed Python/R execution, result streaming, resource isolation | Docker containers + Jupyter kernels |
| **API Gateway** | Request routing, WebSocket multiplexing, auth/rate limiting | FastAPI with WebSocket support |

---

## Recommended Project Structure

### Frontend (React)

```
frontend/
├── src/
│   ├── components/
│   │   ├── editor/
│   │   │   ├── TipTapEditor.jsx        # Main editor component
│   │   │   ├── EditorToolbar.jsx       # Formatting, AI actions
│   │   │   ├── collaborative-cursors/  # Multi-user cursors
│   │   │   └── ai-suggestions/         # AI insertion UI
│   │   ├── chat/
│   │   │   ├── ChatPanel.jsx           # Sidebar AI chat
│   │   │   ├── ProposalList.jsx        # AI action proposals
│   │   │   └── MessageThread.jsx       # Chat history
│   │   ├── files/
│   │   │   ├── FileExplorer.jsx        # File browser
│   │   │   ├── UploadZone.jsx          # Drag-drop upload
│   │   │   └── FileMetadata.jsx        # Extracted metadata display
│   │   └── analysis/
│   │       ├── CodeExecutor.jsx        # Code input + run button
│   │       ├── ResultViewer.jsx        # Output, plots, tables
│   │       └── ExecutionStatus.jsx     # Running/complete/error
│   ├── services/
│   │   ├── api.js                      # REST API client
│   │   ├── websocket.js                # WebSocket manager (doc + chat)
│   │   ├── documentSync.js             # Yjs CRDT synchronization
│   │   └── orchestration.js            # AI proposal/execution client
│   ├── context/
│   │   ├── WorkspaceContext.jsx        # Current doc, files, selection
│   │   └── AuthContext.jsx             # User session
│   └── lib/
│       ├── autosave.js                 # Debounced save logic
│       └── contextAssembly.js          # Prepare context for AI
```

### Backend (Python/FastAPI)

```
backend/
├── app/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── documents.py           # Document CRUD, auto-save
│   │   │   ├── chat.py                # AI chat endpoints
│   │   │   ├── files.py               # File upload, metadata
│   │   │   ├── analysis.py            # Code execution
│   │   │   └── artifacts.py           # Artifact/memory queries
│   │   └── websockets/
│   │       ├── document_ws.py         # Real-time document sync
│   │       ├── chat_ws.py             # AI chat streaming
│   │       └── manager.py             # WebSocket connection multiplexing
│   ├── services/
│   │   ├── document_service.py        # Auto-save, versioning
│   │   ├── orchestration_service.py   # Multi-agent coordination
│   │   ├── file_service.py            # Upload, metadata extraction
│   │   ├── artifact_memory_service.py # Graph + vector search
│   │   └── executor_service.py        # Code sandbox management
│   ├── agents/
│   │   ├── base_agent.py              # Agent interface
│   │   ├── editor_agent.py            # Text manipulation
│   │   ├── analyst_agent.py           # Data analysis
│   │   └── supervisor_agent.py        # Orchestration
│   ├── memory/
│   │   ├── graph_store.py             # Information graph (PostgreSQL)
│   │   ├── vector_store.py            # Semantic search (pgvector)
│   │   └── context_builder.py         # Assemble context for agents
│   ├── execution/
│   │   ├── docker_manager.py          # Container lifecycle
│   │   ├── kernel_manager.py          # Jupyter kernel interface
│   │   └── result_streamer.py         # Stream execution results
│   └── database/
│       ├── models.py                  # SQLAlchemy models
│       ├── graph_models.py            # Graph relationship models
│       └── repositories.py            # Data access layer
```

### Structure Rationale

- **`components/`**: Split by functional area (editor, chat, files, analysis) → clear ownership boundaries
- **`services/`**: Backend services align with frontend components → one service per UI area
- **`agents/`**: Isolated agent logic → easy to add new agents without touching orchestration
- **`memory/`**: Unified artifact memory subsystem → context management is cross-cutting concern
- **`execution/`**: Sandboxed execution isolated from main API → security boundary

---

## Architectural Patterns

### Pattern 1: CRDT-Based Document Synchronization

**What:** Use Conflict-free Replicated Data Types (Yjs) for real-time collaborative editing with automatic conflict resolution.

**When to use:** Multiple users editing the same document simultaneously; need offline editing support.

**Trade-offs:**
- ✅ Automatic conflict resolution without data loss
- ✅ Works offline, syncs when reconnected
- ❌ Complex debugging when conflicts occur
- ❌ Memory overhead for tracking edit history

**Example:**
```javascript
// Frontend: Yjs integration with TipTap
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'

const doc = new Y.Doc()
const provider = new WebrtcProvider('document-room-id', doc, {
  signaling: ['wss://your-backend.com/signaling']
})

// TipTap consumes Yjs document
const editor = new Editor({
  document: doc,
  onUpdate: ({ editor }) => {
    // Auto-save trigger (debounced)
    debouncedSave(editor.getJSON())
  }
})
```

**Backend integration:**
```python
# Backend: Receive Yjs updates via WebSocket
@app.websocket("/ws/document/{doc_id}")
async def document_sync(websocket: WebSocket, doc_id: str):
    await websocket.accept()
    ydoc_bytes = await websocket.receive_bytes()
    # Apply Yjs update to database document
    await document_service.apply_update(doc_id, ydoc_bytes)
```

**Sources:**
- Django Stars collaborative editing guide (MEDIUM confidence) — [System Design & Development of Collaborative Editing Tool](https://djangostars.com/blog/collaborative-editing-system-development/)

---

### Pattern 2: Supervisor-Worker Multi-Agent Orchestration

**What:** Central supervisor agent decomposes user requests into tasks, assigns to specialized workers, synthesizes results.

**When to use:** Complex multi-step AI operations (e.g., "Analyze this dataset and write a summary"); need quality control.

**Trade-offs:**
- ✅ Clear separation of concerns (planning vs execution)
- ✅ Supervisor can retry/verify worker outputs
- ❌ Supervisor becomes bottleneck; additional latency
- ❌ Supervisor errors affect everything

**Example:**
```python
# Backend: Supervisor-worker orchestration
class SupervisorOrchestrator:
    def __init__(self, supervisor_llm, workers: dict):
        self.supervisor = supervisor_llm
        self.workers = workers  # {'analyst': AnalystAgent(), 'writer': WriterAgent()}

    async def execute(self, task: str, context: dict):
        # Supervisor creates plan
        plan = await self.supervisor.complete(
            f"Create a plan to accomplish: {task}\n"
            f"Available workers: {list(self.workers.keys())}\n"
            f"Context: {context}\n"
            f"Return JSON plan with steps and assigned workers."
        )

        steps = json.loads(plan)['steps']
        results = {}

        # Execute each step
        for step in steps:
            worker = self.workers[step['worker']]
            result = await worker.execute(step['task'], context)
            results[step['id']] = result

            # Supervisor reviews progress
            review = await self.supervisor.complete(
                f"Review result for step {step['id']}: {result}\n"
                f"Should I retry? (yes/no)"
            )
            if "retry" in review.lower():
                result = await worker.execute(step['task'], context)

        # Supervisor synthesizes final result
        return await self.supervisor.complete(
            f"Synthesize final answer from: {results}"
        )
```

**Frontend proposal system:**
```javascript
// Frontend: Display AI proposals as actionable cards
function ChatPanel({ proposals }) {
  return (
    <div>
      {proposals.map(proposal => (
        <ProposalCard
          key={proposal.id}
          title={proposal.title}
          description={proposal.description}
          onApprove={() => executeProposal(proposal)}
          onReject={() => dismissProposal(proposal)}
        />
      ))}
    </div>
  )
}
```

**Sources:**
- Learn Prompting 2026 guide (HIGH confidence) — [Multi-Agent Orchestration: Architectures and Patterns for 2026](https://learn-prompting.fr/blog/multi-agent-orchestration)

---

### Pattern 3: Debounced Auto-Save with Optimistic UI

**What:** Save document changes after user inactivity period (2 seconds), show "saving..." indicator, optimistically update UI.

**When to use:** Any document editor; need to prevent data loss while avoiding excessive API calls.

**Trade-offs:**
- ✅ Reduces server load by up to 5x (batching changes)
- ✅ Better UX (no lag on every keystroke)
- ❌ Risk of data loss if browser closes before debounce
- ❌ Complex merge conflicts if multiple saves in flight

**Example:**
```javascript
// Frontend: Debounced auto-save
import { debounce } from 'lodash-es'

const saveDocument = async (docId, content) => {
  // Optimistic UI update
  setSaveStatus('saving')

  try {
    await api.put(`/documents/${docId}`, { content })
    setSaveStatus('saved')
  } catch (error) {
    setSaveStatus('error')
    // Handle conflict (merge dialog)
  }
}

// Debounce save to 2 seconds of inactivity
const debouncedSave = debounce(saveDocument, 2000)

// TipTap update handler
const handleUpdate = ({ editor }) => {
  const content = editor.getJSON()
  debouncedSave(docId, content)
}
```

**Backend:**
```python
# Backend: Auto-save endpoint with version checking
@app.put("/documents/{doc_id}")
async def auto_save(doc_id: str, content: dict, version: int):
    doc = await database.get_document(doc_id)

    # Conflict detection
    if doc.version != version:
        raise ConflictException(
            "Document was modified. Please refresh and merge."
        )

    # Update document
    doc.content = content
    doc.version += 1
    await database.save(doc)

    return {"status": "saved", "version": doc.version}
```

**Sources:**
- TanStack Pacer blog (MEDIUM confidence) — [TanStack Pacer: Solving Debounce, Throttle, and Batching the Right Way](https://shaxadd.medium.com/tanstack-pacer-solving-debounce-throttle-and-batching-the-right-way-94d699befc8a)
- Froala blog (MEDIUM confidence) — [State Management Patterns for Editor Components in React-based LMS Platforms](https://froala.com/blog/editor/state-management-patterns-for-editor-components-in-react-based-lms-platforms/)

---

### Pattern 4: Information Graph + Vector Search for Context

**What:** Store documents as nodes in a graph database (relationships), use vector embeddings for semantic search, combine both for AI context retrieval.

**When to use:** Need to maintain "working memory" across many documents; semantic search + relationships both matter.

**Trade-offs:**
- ✅ Rich context understanding (semantic + structural)
- ✅ Handles multi-hop reasoning (A → B → C)
- ❌ Complex data model (graph + vectors)
- ❌ Requires PostgreSQL extensions or separate graph DB

**Example:**
```python
# Backend: Information graph + vector search
class ArtifactMemoryService:
    def __init__(self, db: AsyncSession, vector_store):
        self.db = db
        self.vector_store = vector_store

    async def index_document(self, doc_id: str, content: str, metadata: dict):
        # 1. Create graph node
        node = GraphNode(
            id=doc_id,
            type='document',
            metadata=metadata
        )
        self.db.add(node)

        # 2. Create vector embedding
        embedding = await self.embed(content)
        self.vector_store.add(doc_id, embedding, metadata)

        # 3. Extract relationships (citations, references)
        relationships = await self.extract_relationships(content)
        for rel in relationships:
            self.db.add(GraphEdge(
                from_node=doc_id,
                to_node=rel.target,
                type=rel.type
            ))

    async def retrieve_context(self, query: str, limit: int = 10):
        # 1. Semantic search (vector)
        semantic_results = await self.vector_store.search(query, limit=limit)

        # 2. Graph traversal (expand via relationships)
        context_nodes = set(semantic_results)
        for node_id in semantic_results:
            neighbors = await self.graph.get_neighbors(node_id, depth=2)
            context_nodes.update(neighbors)

        # 3. Return ranked context
        return await self.rank_context(query, context_nodes)
```

**Database schema (PostgreSQL + pgvector):**
```sql
-- Graph nodes (artifacts)
CREATE TABLE artifacts (
    id UUID PRIMARY KEY,
    type TEXT NOT NULL, -- 'document', 'file', 'code_cell', 'analysis'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB
);

-- Graph edges (relationships)
CREATE TABLE artifact_relationships (
    from_id UUID REFERENCES artifacts(id),
    to_id UUID REFERENCES artifacts(id),
    type TEXT NOT NULL, -- 'cites', 'references', 'derived_from'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (from_id, to_id, type)
);

-- Vector embeddings (pgvector extension)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE artifact_embeddings (
    artifact_id UUID PRIMARY KEY REFERENCES artifacts(id),
    embedding vector(1536) -- OpenAI embedding dimension
);

-- Vector similarity search
CREATE INDEX ON artifact_embeddings
USING ivfflat (embedding vector_cosine_ops);

-- Query: Semantic search + graph expansion
WITH semantic_matches AS (
    SELECT artifact_id, embedding <=> $1 AS distance
    FROM artifact_embeddings
    ORDER BY distance
    LIMIT 10
),
graph_expansion AS (
    SELECT DISTINCT to_id AS artifact_id
    FROM artifact_relationships
    WHERE from_id IN (SELECT artifact_id FROM semantic_matches)
)
SELECT artifact_id, metadata
FROM artifacts
WHERE id IN (SELECT artifact_id FROM semantic_matches)
   OR id IN (SELECT artifact_id FROM graph_expansion);
```

**Sources:**
- Medium article (LOW confidence, needs verification) — [Building an AI-Powered Semantic Memory System with Graph Databases and Vector Embeddings](https://nikhil-datasolutions.medium.com/building-an-ai-powered-semantic-memory-system-with-graph-databases-and-vector-embeddings-adba193f916d)
- NVIDIA Developer blog (MEDIUM confidence) — [Boosting Q&A Accuracy with GraphRAG Using PyG and Graph Databases](https://developer.nvidia.com/blog/boosting-qa-accuracy-with-graphrag-using-pyg-and-graph-databases/)
- Neo4j blog (MEDIUM confidence) — [How to Improve Multi-Hop Reasoning With Knowledge Graphs](https://neo4j.com/blog/genai/knowledge-graph-llm-multi-hop-reasoning/)

---

### Pattern 5: Docker Sandboxed Code Execution with Result Streaming

**What:** Spin up ephemeral Docker containers for code execution, stream results back via WebSocket, enforce resource limits.

**When to use:** Execute untrusted code (user scripts, AI-generated code); need isolation + security.

**Trade-offs:**
- ✅ Strong isolation (can't escape container)
- ✅ Resource limits prevent abuse (CPU, memory, timeout)
- ❌ Container startup overhead (~100ms)
- ❌ Complex to manage container lifecycle

**Example:**
```python
# Backend: Docker-based executor
import docker
import asyncio

class CodeExecutor:
    def __init__(self):
        self.client = docker.from_env()
        self.containers = {}  # session_id -> container

    async def execute_code(
        self,
        session_id: str,
        code: str,
        language: str = 'python',
        timeout: int = 30
    ):
        # Reuse or create container
        if session_id not in self.containers:
            container = self.client.containers.run(
                f"python:3.11-slim",
                detach=True,
                cpu_quota=100000,  # 0.1 CPU
                mem_limit='512m',
                network_disabled=True,
                runtime='runsc'  # gVisor for stronger isolation
            )
            self.containers[session_id] = container

        container = self.containers[session_id]

        # Execute code with timeout
        try:
            result = await asyncio.wait_for(
                self._run_in_container(container, code),
                timeout=timeout
            )
            return {"status": "success", "output": result}
        except asyncio.TimeoutError:
            return {"status": "error", "output": "Execution timeout"}
        except Exception as e:
            return {"status": "error", "output": str(e)}

    async def _run_in_container(self, container, code: str):
        # Write code to temp file
        container.put_archive('/tmp', self._create_tar(code))

        # Execute and stream output
        exec_id = container.client.api.exec_create(
            container.id,
            f"python /tmp/script.py",
        )

        # Stream output
        output = []
        for line in container.client.api.exec_exec(exec_id):
            output.append(line.decode('utf-8'))

        return ''.join(output)
```

**Frontend: Result streaming via WebSocket**
```javascript
// Frontend: Stream execution results
function CodeExecutor({ code }) {
  const [output, setOutput] = useState([])
  const ws = useRef(null)

  const executeCode = () => {
    ws.current = new WebSocket(`ws://localhost:8000/ws/analysis/${sessionId}`)

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setOutput(prev => [...prev, data])
    }

    // Send code for execution
    ws.current.send(JSON.stringify({ code, language: 'python' }))
  }

  return (
    <div>
      <button onClick={executeCode}>Run</button>
      <pre>{output.map(line => line.text).join('\n')}</pre>
    </div>
  )
}
```

**Sources:**
- ResearchGate paper (MEDIUM confidence) — [Lightweight Docker Based Secure Sandbox for Running Python Code](https://www.researchgate.net/publication/392082686_Lightweight_Docker_Based_Secure_Sandbox_for_Running_Python_Code)
- Daytona (MEDIUM confidence) — [Secure Infrastructure for Running AI-Generated Code](https://www.daytona.io/)
- Dev.to blog (LOW confidence) — [4 Ways to Sandbox Untrusted Code in 2026](https://dev.to/mohameddiallo/4-ways-to-sandbox-untrusted-code-in-2026-1ffb)

---

## Data Flow

### Request Flow: User Edits Document → AI Suggests Improvement

```
[User types in TipTap editor]
    ↓
[TipTap onChange event]
    ↓
[1. Debounced auto-save (2 sec)]
    ↓
[PUT /documents/{id} → Document Service]
    ↓
[PostgreSQL: Update document version]
    ↓
[WebSocket: Broadcast update to other clients]
    ↓
[2. Context assembly (for AI)]
    ↓
[Artifact Memory: Retrieve related docs, embeddings]
    ↓
[3. AI proposal generation]
    ↓
[Orchestration Service: Supervisor → Editor Agent]
    ↓
[LLM Call: "Suggest improvements for this section"]
    ↓
[4. Proposal returned to client]
    ↓
[WebSocket: Send proposal to client]
    ↓
[UI: Show "Improve writing" proposal card]
    ↓
[User clicks "Accept"]
    ↓
[WebSocket: Execute proposal]
    ↓
[Document Service: Apply AI changes]
    ↓
[TipTap: Update editor content]
```

### Request Flow: User Uploads File → Semantic Indexing

```
[User drags file to UploadZone]
    ↓
[Frontend: Chunk file upload]
    ↓
[POST /files/upload → File Service]
    ↓
[1. Save to storage (S3 / local filesystem)]
    ↓
[2. Extract metadata (async)]
    ↓
[Background task: Run metadata extraction ML]
    - PDF: Extract text, authors, title
    - Image: Run vision model (caption, tags)
    - Code: Parse language, dependencies
    ↓
[3. Create artifact node]
    ↓
[PostgreSQL: INSERT INTO artifacts (type, metadata)]
    ↓
[4. Generate vector embedding]
    ↓
[Embedding Service: Get text embeddings]
    ↓
[PostgreSQL: INSERT INTO artifact_embeddings (artifact_id, embedding)]
    ↓
[5. Extract relationships]
    ↓
[Graph Service: Find related artifacts]
    - Citations in text → link to cited docs
    - Similar embeddings → link to similar content
    ↓
[PostgreSQL: INSERT INTO artifact_relationships]
    ↓
[6. Notify client]
    ↓
[WebSocket: File indexed, ready for search]
```

### Request Flow: User Runs Analysis → Results Stream

```
[User types Python code in CodeExecutor]
    ↓
[Click "Run" button]
    ↓
[WebSocket connection: /ws/analysis/{session_id}]
    ↓
[POST /analysis/execute → Executor Service]
    ↓
[1. Get or create Docker container for session]
    ↓
[Docker: Start Python kernel (Jupyter)]
    ↓
[2. Execute code in container]
    ↓
[3. Stream output via WebSocket]
    ↓
[Client receives events:]
    - {"type": "stdout", "data": "Loading data..."}
    - {"type": "plot", "data": "base64:image/png"}
    - {"type": "dataframe", "data": {...}}
    - {"type": "complete", "status": "success"}
    ↓
[UI: Render outputs in ResultViewer]
    - Text output in <pre>
    - Plots as <img> src="data:image/png;base64,..."
    - DataFrames as interactive tables
    ↓
[4. Create artifact node for analysis]
    ↓
[PostgreSQL: Save code, output, metadata]
    ↓
[5. Link analysis to current document]
    ↓
[PostgreSQL: INSERT INTO artifact_relationships]
    ↓
[Analysis available in artifact memory for future AI context]
```

### Key Data Flows

1. **Document sync flow:** TipTap → Yjs CRDT → WebSocket → PostgreSQL → Broadcast to all clients
2. **AI proposal flow:** Context retrieval → Orchestration → LLM → WebSocket proposal → User approval → Apply changes
3. **File indexing flow:** Upload → Storage → Metadata extraction → Embedding → Graph indexing
4. **Analysis execution flow:** Code submit → Docker container → Stream results → Save artifact → Link to document

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-1k users** | Single FastAPI server, PostgreSQL on same machine, Redis for cache/pub-sub |
| **1k-100k users** | Separate API servers (load balanced), PostgreSQL read replicas, Redis Cluster, CDN for file storage |
| **100k+ users** | Microservices split (document service, orchestration service, file service), separate vector database (Qdrant/Pinecone), Kubernetes for Docker executor scaling |

### Scaling Priorities

1. **First bottleneck: Database writes**
   - Auto-save on every keystroke would hammer PostgreSQL
   - **Fix:** Debounced auto-save (2-5 seconds) + Redis write-behind cache
   - Batch document updates in memory, flush to DB periodically

2. **Second bottleneck: WebSocket connections**
   - Each user holds 2+ WebSocket connections (document + chat)
   - **Fix:** WebSocket connection multiplexing (single connection, multiple channels)
   - Use Redis pub-sub for horizontal scaling across multiple API servers

3. **Third bottleneck: Code execution resources**
   - Each analysis run spins up Docker container
   - **Fix:** Container pool (pre-warmed containers), session reuse, queue with workers
   - Limit concurrent executions per user

### Not Yet Optimized (Premature Optimization)

- **Vector search performance** — Not needed until >100k artifacts
- **Graph database sharding** — Single PostgreSQL instance sufficient for early scale
- **Multi-region deployment** — optimize for single region first

---

## Anti-Patterns

### Anti-Pattern 1: Saving Every Keystroke to Database

**What people do:** PUT request to server on every TipTap `onChange` event.

**Why it's wrong:**
- Thousands of database writes per minute
- Database connection pool exhaustion
- Unnecessary version conflicts (save race conditions)

**Do this instead:**
- Debounce saves to 2+ seconds of user inactivity
- Use Yjs CRDT for peer-to-peer sync without server round-trip
- Flush to database on debounced interval or page unload

**Sources:**
- TanStack Pacer blog (MEDIUM confidence) — Debouncing "reduces server calls by up to 5x"

---

### Anti-Pattern 2: Asking AI to "Remember Everything"

**What people do:** Pass entire conversation history to LLM on every request.

**Why it's wrong:**
- Context window limits (even 1M tokens has cost)
- Increased latency (processing irrelevant history)
- Higher LLM costs (paying for unused context)

**Do this instead:**
- Implement retrieval-augmented generation (RAG)
- Use vector search to find relevant historical context
- Maintain information graph for structured relationships
- Only include semantically relevant artifacts in context

**Sources:**
- Learn Prompting 2026 guide (HIGH confidence) — Multi-agent systems use "distributed contexts" not single large context

---

### Anti-Pattern 3: Blocking Code Execution

**What people do:** HTTP POST request to run code, wait 30 seconds for response.

**Why it's wrong:**
- Browser timeout (HTTP requests timeout after 30-60s)
- No feedback during execution (is it stuck?)
- Can't cancel long-running jobs

**Do this instead:**
- WebSocket-based result streaming
- Async execution with task queue (Celery/Redis)
- Return execution ID immediately, stream results separately
- Support cancellation via WebSocket message

**Sources:**
- ResearchGate paper (MEDIUM confidence) — Docker-based sandbox with timeout handling

---

### Anti-Pattern 4: Manual File Metadata Entry

**What people do:** Ask users to tag files, enter metadata manually.

**Why it's wrong:**
- Users won't do it (friction)
- Inconsistent tags ("ml", "ML", "machine learning")
- Outdated metadata as documents evolve

**Do this instead:**
- Automatic metadata extraction on upload (ML-based)
- Semantic indexing via embeddings (search by meaning, not tags)
- Inferred relationships from content (citations, references)

**Sources:**
- Docupile (LOW confidence) — [Upload & Auto Metadata Extraction](https://www.docupile.com/upload-auto-metadata-extraction/)
- Generic research (LOW confidence) — AI systems can achieve 99% accuracy in document classification

---

### Anti-Pattern 5: Building Custom Collaboration Protocol

**What people do:** Roll your own WebSocket message format for document sync.

**Why it's wrong:**
- Re-inventing conflict resolution (hard to get right)
- Debugging desync issues (users lose work)
- Edge cases (offline editing, concurrent edits)

**Do this instead:**
- Use proven CRDT library (Yjs)
- Leverage existing collaborative editing infrastructure (Hocuspocus for TipTap)
- Focus on product features, not infrastructure

**Sources:**
- Django Stars (MEDIUM confidence) — CRDTs and Yjs are "excellent options for custom development"

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **OpenAI / Anthropic** | Async HTTP client with retry | Use existing `llm_service.py`; add streaming support |
| **Hocuspocus** (TipTap backend) | WebSocket server | Optional: Use instead of building custom sync |
| **Docker API** | Python docker SDK | For code execution sandboxing |
| **S3 / CloudFlare R2** | Async file upload | Store user files, code outputs |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Editor ↔ Document Service** | WebSocket (Yjs sync) + REST (auto-save) | Yjs for real-time, REST for persistence |
| **Chat ↔ Orchestration Service** | WebSocket (bidirectional streaming) | Stream LLM responses, send proposals |
| **File Service ↔ Artifact Memory** | Async task queue (Redis) | Metadata extraction is background job |
| **Orchestration ↔ Agents** | Direct function calls (same process) | Keep agents in-memory for low latency |
| **Executor Service ↔ Docker** | Docker SDK (HTTP) | Container management API |

---

## Build Order & Dependencies

### Phase 1: Editor + Auto-Save (Foundation)

**Components:**
- TipTap editor integration
- Debounced auto-save (2 seconds)
- Document CRUD API
- PostgreSQL schema for documents
- Basic version history

**Blocks:** Nothing — this is the foundation

**Value:** Users can create and edit documents with persistent storage

**Estimated effort:** 2-3 weeks

---

### Phase 2: AI Chat + Proposals (Orchestration)

**Components:**
- Sidebar chat UI
- WebSocket chat API
- Supervisor-worker orchestration
- Basic agent (text manipulation)
- Proposal system (suggest → approve → execute)

**Dependencies:** Phase 1 (need documents to operate on)

**Blocks:** Phase 3 (file management needs AI for metadata extraction)

**Value:** Users can ask AI to help with writing, see proposals

**Estimated effort:** 3-4 weeks

---

### Phase 3: File Management + Indexing (Context)

**Components:**
- File upload (drag-drop)
- Metadata extraction (async background jobs)
- Vector embeddings (OpenAI / local)
- Basic semantic search

**Dependencies:** Phase 2 (use AI agents for metadata extraction)

**Blocks:** Phase 4 (analysis needs file context)

**Value:** Users can upload files, search by meaning

**Estimated effort:** 2-3 weeks

---

### Phase 4: Code Execution (Analysis)

**Components:**
- Docker executor service
- Code input UI
- Result streaming (WebSocket)
- Artifact creation for analyses

**Dependencies:** Phase 3 (files are input for analysis)

**Blocks:** Nothing (optional feature)

**Value:** Users can run Python/R code on data

**Estimated effort:** 3-4 weeks

---

### Phase 5: Information Graph (Memory)

**Components:**
- Graph database schema (PostgreSQL or Neo4j)
- Relationship extraction
- Multi-hop context retrieval
- Graph visualization UI

**Dependencies:** Phase 1-3 (need artifacts to graph)

**Blocks:** Nothing (continuous improvement)

**Value:** AI can reason across documents, find indirect relationships

**Estimated effort:** 4-5 weeks

---

### Parallelization Opportunities

- **Phases 1 & 2:** Can start Phase 2 infrastructure (orchestration service) while Phase 1 UI is being built
- **Phases 3 & 4:** File management and code execution are independent — can build in parallel after Phase 2
- **Phase 5:** Information graph can be built incrementally alongside Phases 3-4 (index each new artifact)

---

## Integration with Existing Research Pilot Backend

### Reuse (Keep)

- **FastAPI application structure** — Add new routes for documents, chat, files, analysis
- **PostgreSQL + SQLAlchemy** — Extend schema with new tables (documents, artifacts, relationships)
- **Redis pub/sub** — Use for WebSocket broadcasting, task queue
- **WebSocket infrastructure** — Extend `realtime/websocket.py` for document + chat multiplexing
- **LLM service (`llm_service.py`)** — Already multi-provider, add streaming support
- **Credit system** — Track AI usage (proposals, chat, code execution)
- **Orchestration engine** — Extend for multi-agent workflows (supervisor-worker)

### Destroy (Remove)

- **Literature pipeline** — `literature_service.py`, `papers` table (specific to research execution)
- **Reference extraction** — `reference_service.py` (not needed for workspace)
- **Plan generation** — `planning_service.py` (workspace is ad-hoc, not plan-driven)
- **Task DAG** — `tasks`, `task_dependencies` tables (workspace is document-centric, not task-centric)
- **Navigator/Workspace/Inspector UI** — Replace with Editor + Sidebar layout

### Build Fresh

- **TipTap editor** — New React component, Yjs integration
- **Document service** — Auto-save, versioning, sync
- **File service** — Upload, metadata extraction
- **Artifact memory service** — Graph + vector search
- **Code executor service** — Docker sandbox, result streaming
- **Frontend layout** — Editor-focused (main panel + sidebar)

---

## Sources

### Primary (HIGH confidence)

- [Multi-Agent Orchestration: Architectures and Patterns for 2026](https://learn-prompting.fr/blog/multi-agent-orchestration) — Verified patterns for supervisor-worker, communication protocols, failure handling

### Secondary (MEDIUM confidence)

- [System Design & Development of Collaborative Editing Tool](https://djangostars.com/blog/collaborative-editing-system-development/) — CRDT-based collaboration, component architecture
- [Boosting Q&A Accuracy with GraphRAG Using PyG and Graph Databases](https://developer.nvidia.com/blog/boosting-qa-accuracy-with-graphrag-using-pyg-and-graph-databases/) — Graph + vector search patterns
- [How to Improve Multi-Hop Reasoning With Knowledge Graphs](https://neo4j.com/blog/genai/knowledge-graph-llm-multi-hop-reasoning/) — Knowledge graph integration with LLMs
- [TanStack Pacer: Solving Debounce, Throttle, and Batching the Right Way](https://shaxadd.medium.com/tanstack-pacer-solving-debounce-throttle-and-batching-the-right-way-94d699befc8a) — Debounced auto-save pattern
- [Lightweight Docker Based Secure Sandbox for Running Python Code](https://www.researchgate.net/publication/392082686_Lightweight_Docker_Based_Secure_Sandbox_for_Running_Python_Code) — Docker sandbox architecture
- [Daytona - Secure Infrastructure for Running AI-Generated Code](https://www.daytona.io/) — Production code execution infrastructure
- [Building and Scaling Notion's Data Lake](https://www.notion.com/blog/building-and-scaling-notions-data-lake) — Scale considerations for document storage
- [The Data Model Behind Notion's Flexibility](https://www.notion.com/blog/data-model-behind-notion) - Graph-like data model for flexible documents

### Tertiary (LOW confidence — needs validation)

- [Building an AI-Powered Semantic Memory System with Graph Databases and Vector Embeddings](https://nikhil-datasolutions.medium.com/building-an-ai-powered-semantic-memory-system-with-graph-databases-and-vector-embeddings-adba193f916d) — Specific implementation details unverified
- AI metadata extraction claims (99% accuracy) — Source not authoritative, requires testing
- [4 Ways to Sandbox Untrusted Code in 2026](https://dev.to/mohameddiallo/4-ways-to-sandbox-untrusted-code-in-2026-1ffb) — Community blog post, not official documentation

### Open Questions

1. **Graph database choice:** Should we use PostgreSQL + pgvector or separate graph DB (Neo4j)? Recommendation: Start with PostgreSQL extensions, migrate if performance issues.
2. **Real-time sync:** Use Hocuspocus (TipTap official backend) or build custom WebSocket sync? Recommendation: Build custom first for control, consider Hocuspocus if collaboration requirements grow.
3. **Vector database:** Use pgvector extension or separate vector DB (Qdrant/Pinecone)? Recommendation: pgvector for simplicity, migrate if search latency becomes issue.

---

*Architecture research for: Stateful AI Workspace (Research Workspace evolution)*
*Researched: 2026-02-03*
*Confidence: MEDIUM — Key patterns verified with official sources, some implementation details need validation*
