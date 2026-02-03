# STACK.md: Research Workspace Technology Stack

**Project:** Research Workspace (Research Pilot Evolution)
**Researched:** 2025-02-03
**Confidence:** HIGH
**Focus:** Production-ready 2025 technologies for transforming literature review system into all-in-one research workspace

---

## Executive Summary

This document prescribes the **2025 production stack** for evolving Research Pilot from a literature review system into a comprehensive research workspace. The stack supports: rich text document editing, AI chat with proposal-based interactions, cloud code execution for data analysis, file management, and information graph backends.

**Key Principle:** Maximize reuse of existing backend (FastAPI, PostgreSQL, Redis, orchestration engine). Add new capabilities with minimal infrastructure complexity. Prioritize polished, production-ready libraries over experimental options.

**Primary Recommendations:**
1. **Rich Text Editor:** TipTap 3.x (already installed, production-ready, excellent ecosystem)
2. **AI Chat:** Custom React implementation with streaming (no heavy chat SDKs)
3. **Code Execution:** Modal for AI/ML workloads, Docker containers for simple Python/R
4. **File Storage:** S3-compatible object storage (AWS S3 or Cloudflare R2) + PostgreSQL metadata
5. **Information Graph:** PostgreSQL with adjacency list tables (no separate graph DB for MVP)

---

## 1. Rich Text Document Editor

### Recommendation: **TipTap 3.x** (already installed)

**Version:** `@tiptap/react` ^3.17.0
**Confidence:** HIGH
**Status:** ✅ Already installed in frontend/package.json

**Why TipTap Wins (2025):**

According to [Liveblocks' comprehensive 2025 comparison](https://liveblocks.io/blog/which-rich-text-editor-framework-should-you-choose-in-2025), **TipTap is the most well-rounded choice** because:

- "Strikes a balance between being feature-rich without being overly opinionated"
- Built on ProseMirror (battle-tested foundation) but with better developer experience
- **MIT licensed** (no restrictions)
- **Tree-shakable extensions** keep bundle size smaller than Quill, Slate, and Lexical
- Framework-agnostic (Vanilla, React, Vue, Svelte)
- Excellent real-time collaboration support via Yjs
- Strong community momentum with active development

**Alternatives Considered:**

| Option | Why NOT for Research Workspace |
|--------|-------------------------------|
| **Lexical** (Meta) | No 1.0 release yet; lacks pure decorations (makes collaborative cursors harder); Liveblocks found it "needs more time to mature" |
| **Slate.js** | "The Builder's Kit" - requires more custom work; slightly heavier bundle than TipTap |
| **BlockNote** | React-only; heavier bundle; better for Notion-like block editors but overkill for research papers |
| **Editor.js** | **No real-time collaboration support** (critical blocker); larger bundle size |
| **CKEditor/TinyMCE** | GPL-2 license issues; many features behind paywall; proprietary cloud lock-in |

**TipTap Extensions for Research Workspace:**

Already installed (from package.json):
- `@tiptap/starter-kit` - Basic formatting
- `@tiptap/extension-highlight` - Text highlighting
- `@tiptap/extension-link` - Link support
- `@tiptap/extension-placeholder` - Placeholder text
- `@tiptap/extension-text-align` - Text alignment
- `@tiptap/extension-typography` - Smart typography
- `@tiptap/extension-underline` - Underline support

**Recommended Additional Extensions:**
```bash
# Citations and references
yarn add @tiptap/extension-placeholder
yarn add @tiptap/extension-task-list
yarn add @tiptap/extension-table

# Collaboration (future)
yarn add @tiptap/extension-collaboration
yarn add @tiptap/extension-collaboration-cursor
```

**Implementation Pattern:**
```typescript
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

const editor = useEditor({
  extensions: [
    StarterKit,
    // Add research-specific extensions
    CitationExtension,  // Custom: [@cite(key)]
    FigureExtension,    // Custom: Figure captions
  ],
  content: '<p>Start writing...</p>',
})
```

**Key Insight:** TipTap is **Google Docs-class** editing. Avoid building custom editor or using heavyweight alternatives. TipTap 3.0 is production-ready as of July 2025.

---

## 2. AI Chat Interface (Sidebar, Proposal-Based)

### Recommendation: **Custom React with Streaming + Vercel AI SDK Patterns**

**Version:** Current
**Confidence:** MEDIUM (verified via Grapestech 2026 guide)
**Pattern:** Streaming responses via WebSockets (already have infrastructure)

**Why Custom Implementation Wins:**

According to [How to Build React AI Chatbot Interfaces (2026 Guide)](https://www.grapestechsolutions.com/blog/build-react-ai-chatbot-interface/), modern AI chat interfaces need:

1. **Streaming responses** (token-level, not await-all)
2. **Optimistic UI updates** (show user message immediately)
3. **Auto-scrolling** to latest message
4. **Loading states** with typing indicators
5. **Clean separation**: Header, Message Container, Input Area

**Recommended Stack:**

```bash
# Frontend streaming hooks (optional - can implement manually)
yarn add ai  # Vercel AI SDK (use patterns, not mandatory)

# Icons and UI
yarn add lucide-react  # Already installed
```

**Alternative: Vercel AI SDK**

From [Vercel AI SDK documentation](https://www.9.agency/blog/streaming-ai-responses-vercel-ai-sdk):

- **`useChat` hook** handles streaming automatically
- Token-level streaming for "typewriter" effect
- React Server Components support (if using Next.js)
- Built-in error handling and retry logic

**Why NOT Full-Featured Chat SDKs:**

| Option | Why NOT for Research Workspace |
|--------|-------------------------------|
| **Stream Chat** | Overkill for AI assistant; heavy UI library; designed for human-to-human chat |
| **Chatbot UI kits** | Often conversational-focused; Research Workspace is IDE-like, not chat-centric |
| **Claude/GPT UI clones** | Not production-ready; often abandonware |

**Recommended Implementation Pattern:**

```typescript
// Simple streaming chat component
function AISidebar() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (content: string) => {
    // Optimistic update
    setMessages(prev => [...prev, { role: 'user', content }])

    // Stream response via existing WebSocket
    setIsLoading(true)
    for await (const chunk of streamAIResponse(content)) {
      setMessages(prev => {
        const last = prev[prev.length - 1]
        if (last.role === 'assistant') {
          return [...prev.slice(0, -1), { ...last, content: last.content + chunk }]
        }
        return [...prev, { role: 'assistant', content: chunk }]
      })
    }
    setIsLoading(false)
  }

  return (
    <div className="flex flex-col h-full">
      <Header />
      <MessageArea messages={messages} />
      <InputArea onSend={sendMessage} disabled={isLoading} />
    </div>
  )
}
```

**Proposal-Based Interactions (Cursor-Style):**

From [Cursor AI research](https://generativeaitools.substack.com/p/use-of-cursor-ai-in-2025-a-deep-dive):

- **"Agent Mode"**: AI proposes changes, user accepts/rejects
- **Diff view**: Show before/after for proposed edits
- **Apply/Discard**: One-click actions on proposals

**Implementation Pattern:**
```typescript
type Proposal = {
  id: string
  type: 'text-insert' | 'text-replace' | 'citation-add'
  content: string
  location: { path: string; offset: number }
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  return (
    <div className="border rounded p-4">
      <diff_view proposed={proposal.content} current={getCurrentContent(proposal.location)} />
      <div className="flex gap-2">
        <Button onClick={() => applyProposal(proposal)}>Apply</Button>
        <Button onClick={() => discardProposal(proposal)} variant="ghost">Discard</Button>
      </div>
    </div>
  )
}
```

**Key Insight:** Reuse existing WebSocket infrastructure (`realtime/websocket.py`). No new chat backend needed. Streaming is standard pattern in 2025.

---

## 3. Cloud Code Execution (Data Analysis)

### Recommendation: **Modal for AI/ML Workloads + Docker Containers for Simple Cases**

**Version:** Modal (current), Docker (current)
**Confidence:** HIGH (verified via Modal blog, Docker blog)
**Use Case:** AI writes Python/R code → executes in cloud → displays results

**Comparison: Modal vs Alternatives**

| Platform | Best For | Why Choose / Avoid | 2025 Status |
|----------|----------|-------------------|-------------|
| **Modal** | AI/ML workloads, GPU tasks, batch processing | ✅ **Recommended**: Python-first, GPU support, cheaper than Lambda for compute-intensive | Production-ready; active development |
| **AWS Lambda** | Event-driven apps, lightweight tasks | ⚠️ **Avoid**: 15-min timeout; no GPU; expensive for heavy compute; cold starts | Mature but wrong fit |
| **Replit** | Prototyping, learning | ❌ **Avoid**: Not production-scale; limited GPU; designed for dev, not execution | Great for prototypes |
| **E2B** | AI agent sandboxes | ✅ **Alternative**: Open-source; Firecracker microVMs; 150ms startup; Jupyter built-in | Emerging; good option |
| **Docker** | General-purpose, full control | ✅ **Recommended**: Max control; can run anything; self-hosted option | Industry standard |

**Why Modal for Primary Choice:**

From [Modal's cloud notebook comparison](https://modal.com/blog/top-cloud-notebook-products):

- **Specialized for AI/ML**: GPU support (multi-GPU training available)
- **Memory snapshotting**: Fast loading of large models into GPU memory
- **Python-first**: Designed for data science workloads
- **Significantly cheaper** than AWS Lambda for comparable workloads
- **Sandbox isolation**: gVisor for secure code execution

**Why E2B as Strong Alternative:**

From [E2B research](https://github.com/e2b-dev/e2b):

- **Open-source infrastructure** for AI-generated code execution
- **Firecracker microVMs**: ~150ms startup time
- **Jupyter server built-in**: LLMs can use notebooks directly
- **Multi-language**: Python & JavaScript/TypeScript SDKs
- **Secure isolation**: Designed for untrusted AI-generated code

**Recommended Implementation Pattern:**

```python
# backend/services/code_execution_service.py

import modal

# Modal backend for AI/ML workloads
stub = modal.Stub("research-workspace")

@modal.function(
    image=modal.Image.debian_slim().pip_install(["pandas", "scikit-learn"]),
    memory=2048,
    timeout=300,
)
def execute_analysis(code: str, dataset_path: str) -> dict:
    """
    Execute user's data analysis code in Modal sandbox.
    Returns: { stdout, stderr, plots, error }
    """
    import io
    import sys
    from contextlib import redirect_stdout, redirect_stderr

    # Capture output
    stdout_capture = io.StringIO()
    stderr_capture = io.StringIO()

    try:
        with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
            # Execute in isolated namespace
            exec_globals = {"__name__": "__main__"}
            exec(code, exec_globals)

        return {
            "status": "success",
            "stdout": stdout_capture.getvalue(),
            "stderr": stderr_capture.getvalue(),
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "stderr": stderr_capture.getvalue(),
        }
```

**Alternative: Docker Containers (for Self-Hosted):**

From [Docker Sandboxes blog](https://www.docker.com/blog/docker-sandboxes-run-claude-code-and-other-coding-agents-unsupervised-but-safely/):

```python
# backend/services/docker_execution_service.py

import docker
import tempfile

class DockerExecutionService:
    def execute_python(self, code: str, files: dict[str, bytes]) -> ExecutionResult:
        """
        Execute Python code in isolated Docker container.
        """
        client = docker.from_env()

        # Mount files as volume
        with tempfile.TemporaryDirectory() as tmpdir:
            for filename, content in files.items():
                with open(f"{tmpdir}/{filename}", "wb") as f:
                    f.write(content)

            # Run container with limits
            result = client.containers.run(
                "python:3.11-slim",
                command=["python", "-c", code],
                volumes={tmpdir: {"bind": "/data", "mode": "ro"}},
                mem_limit="512m",
                cpu_period=100000,
                cpu_quota=50000,  # 0.5 CPU
                network_disabled=True,  # No network access
                remove=True,
            )

        return ExecutionResult(stdout=result, error=None)
```

**Why NOT AWS Lambda:**

- **15-minute timeout**: Data analysis can run longer
- **No GPU support**: Can't run ML workloads
- **Expensive**: Higher costs for compute-intensive tasks
- **Cold starts**: Slow initial execution

**Key Insight:** Start with Modal for production simplicity. Use Docker containers if self-hosting or needing full control. E2B is strong open-source alternative.

---

## 4. File Upload/Storage System

### Recommendation: **S3-Compatible Object Storage + PostgreSQL Metadata**

**Version:** Current AWS SDK / boto3
**Confidence:** HIGH (industry standard)
**Options:** AWS S3, Cloudflare R2, or MinIO (self-hosted)

**Architecture:**

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Frontend       │──────▶│  Backend API     │──────▶│  S3 Storage     │
│  (Upload UI)    │      │  (FastAPI)       │      │  (Files)        │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                │
                                ▼
                        ┌──────────────────┐
                        │  PostgreSQL      │
                        │  (Metadata)      │
                        └──────────────────┘
```

**Storage Options:**

| Provider | Why Choose / Avoid | Pricing (2025) | Best For |
|----------|-------------------|----------------|----------|
| **AWS S3** | ✅ Industry standard; mature ecosystem | $0.023/GB storage; $0.09/GB egress | Production, enterprise |
| **Cloudflare R2** | ✅ **Zero egress fees**; S3-compatible | Storage similar to S3; **FREE egress | Cost optimization, high-traffic |
| **MinIO** | ✅ Self-hosted; S3-compatible | Free software, your infra | On-premise, full control |
| **Supabase Storage** | ⚠️ Newer; questions about reliability | Pay-as-you-go | Quick prototyping |

**Why Cloudflare R2 (Cost Optimization):**

From [R2 vs S3 comparisons](https://www.puppygraph.com/blog/postgresql-graph-database):

- **Eliminates egress fees entirely**: S3 charges $0.09/GB for data transfer out
- **S3-compatible API**: Drop-in replacement for boto3 code
- **Super Slurper**: Free migration tool from S3
- **Production-ready**: Used at scale in 2025

**Backend Implementation (FastAPI):**

```python
# backend/services/storage_service.py

import boto3
from fastapi import UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

class StorageService:
    def __init__(self, bucket: str, region: str = "auto"):
        # Use R2 or S3 (compatible APIs)
        self.s3 = boto3.client(
            's3',
            endpoint_url='https://<accountid>.r2.cloudflarestorage.com',  # For R2
            aws_access_key_id=os.getenv('R2_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('R2_SECRET_ACCESS_KEY'),
        )
        self.bucket = bucket

    async def upload_file(
        self,
        file: UploadFile,
        project_id: int,
        db: AsyncSession,
    ) -> FileMetadata:
        """Upload file to S3/R2 and store metadata in PostgreSQL."""

        # 1. Upload to object storage
        filename = f"{project_id}/{file.filename}"
        self.s3.upload_fileobj(
            file.file,
            self.bucket,
            filename,
            ExtraArgs={'ContentType': file.content_type}
        )

        # 2. Store metadata in PostgreSQL
        metadata = FileMetadata(
            project_id=project_id,
            filename=file.filename,
            storage_path=filename,
            content_type=file.content_type,
            size_bytes=file.size,
        )
        db.add(metadata)
        await db.commit()

        return metadata

    def get_presigned_url(self, storage_path: str, expires_in: int = 3600) -> str:
        """Generate temporary download URL."""
        return self.s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': self.bucket, 'Key': storage_path},
            ExpiresIn=expires_in,
        )
```

**PostgreSQL Schema (Metadata Only):**

```sql
CREATE TABLE files (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,  -- S3/R2 key
    content_type VARCHAR(100),
    size_bytes BIGINT,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB,  -- Extracted PDF metadata, etc.
);

-- Index for project file listing
CREATE INDEX idx_files_project ON files(project_id);
```

**Frontend Upload Component:**

```typescript
// components/FileUpload.tsx

import { useDropzone } from 'react-dropzone'

function FileUpload({ projectId }: { projectId: number }) {
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: true,
    onDrop: async (files) => {
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))

      await api.post(`/projects/${projectId}/files`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
  })

  return (
    <div {...getRootProps()} className="border-dashed border-2 p-8">
      <input {...getInputProps()} />
      <p>Drop research files here (PDFs, datasets, documents)</p>
    </div>
  )
}
```

**Key Insight:** Store **metadata in PostgreSQL, blobs in object storage**. Never store large files directly in PostgreSQL (performance killer). Use presigned URLs for secure downloads.

---

## 5. Information Graph Backend

### Recommendation: **PostgreSQL with Adjacency List (No Separate Graph DB for MVP)**

**Version:** PostgreSQL 14+ (already installed)
**Confidence:** HIGH (verified via PuppyGraph, Ackee blog)
**Pattern:** Relational tables + recursive CTEs for graph queries

**Why NOT Neo4j/ArangoDB (for MVP):**

From [PostgreSQL Graph Database guide](https://www.puppygraph.com/blog/postgresql-graph-database):

- **PostgreSQL handles graph structures well** with proper indexing
- **Single database**: No second infrastructure component
- **ACID compliance**: Graph transactions are reliable
- **Mature tooling**: pgAdmin, existing backup/restore

**When to Consider Graph DB (Post-MVP):**

- **Graph traversals are core bottleneck** (profiling shows this)
- **Billions of relationships** (PostgreSQL query performance degrades)
- **Native graph algorithms needed** (PageRank, community detection)

**Schema Design: Adjacency List Pattern**

```sql
-- Claims/assertions from research
CREATE TABLE claims (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    claim_text TEXT NOT NULL,
    claim_type VARCHAR(50),  -- 'hypothesis', 'finding', 'conclusion'
    artifact_id INTEGER REFERENCES artifacts(id),  -- Source document
    confidence_score DECIMAL(3, 2),  -- 0.00 to 1.00
    created_at TIMESTAMP DEFAULT NOW(),
);

-- Relationships between claims
CREATE TABLE claim_relationships (
    id SERIAL PRIMARY KEY,
    from_claim_id INTEGER NOT NULL REFERENCES claims(id),
    to_claim_id INTEGER NOT NULL REFERENCES claims(id),
    relationship_type VARCHAR(50) NOT NULL,  -- 'supports', 'contradicts', 'cites'
    metadata JSONB,  -- Additional context
    created_at TIMESTAMP DEFAULT NOW(),

    -- Prevent duplicate relationships
    UNIQUE(from_claim_id, to_claim_id, relationship_type)
);

-- Indexes for graph traversal performance
CREATE INDEX idx_claim_relationships_from ON claim_relationships(from_claim_id);
CREATE INDEX idx_claim_relationships_to ON claim_relationships(to_claim_id);
CREATE INDEX idx_claims_project ON claims(project_id);

-- Graph queries: Find all claims supporting a given claim
WITH RECURSIVE support_graph AS (
    -- Base case: direct supports
    SELECT c.*, 1 as depth
    FROM claims c
    JOIN claim_relationships r ON c.id = r.from_claim_id
    WHERE r.to_claim_id = :target_claim_id AND r.relationship_type = 'supports'

    UNION ALL

    -- Recursive case: transitive supports
    SELECT c.*, sg.depth + 1
    FROM claims c
    JOIN claim_relationships r ON c.id = r.from_claim_id
    JOIN support_graph sg ON r.to_claim_id = sg.id
    WHERE r.relationship_type = 'supports' AND sg.depth < 5
)
SELECT * FROM support_graph;
```

**Frontend Visualization: React Flow (Already Installed)**

From [React Flow 12.4.2 release notes](https://reactflow.dev/whats-new/2025-01-21):

- **Latest version**: 12.4.2 (January 2025)
- **Package**: `@xyflow/react` (note: name change in v12)
- **Production-ready**: Battle-tested, SSR support, dark mode
- **Already installed**: `reactflow` ^11.11.4 (update to v12 recommended)

```typescript
import ReactFlow, { Node, Edge } from 'reactflow'

function ClaimGraph({ claims, relationships }: GraphData) {
  const nodes: Node[] = claims.map(claim => ({
    id: claim.id.toString(),
    data: { label: claim.claim_text },
    position: { x: 0, y: 0 },  // Auto-layout
  }))

  const edges: Edge[] = relationships.map(rel => ({
    id: rel.id.toString(),
    source: rel.from_claim_id.toString(),
    target: rel.to_claim_id.toString(),
    label: rel.relationship_type,
    animated: rel.relationship_type === 'contradicts',
  }))

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
    />
  )
}
```

**Alternative Graph DBs (Post-MVP Consideration):**

| Database | When to Consider | Tradeoffs |
|----------|-----------------|-----------|
| **Neo4j** | Graph queries are bottleneck; billions of edges | Native graph performance; extra infrastructure |
| **ArangoDB** | Need graph + document in one DB | Multi-model but less mature than PostgreSQL |
| **Amazon Neptune** | AWS-native; fully managed graph | Cloud vendor lock-in; higher cost |

**Key Insight:** **PostgreSQL + adjacency list** handles research workspace graph needs for MVP. Add dedicated graph DB only if profiling shows bottleneck. Avoid premature graph DB adoption.

---

## Summary: Recommended Stack

| Component | Technology | Version | Confidence | Rationale |
|-----------|-----------|---------|------------|-----------|
| **Rich Text Editor** | TipTap | 3.17+ | HIGH | Production-ready; Google Docs-class; already installed |
| **AI Chat Interface** | Custom React + streaming patterns | Current | MEDIUM | Reuse WebSocket infrastructure; no heavy SDKs needed |
| **Code Execution** | Modal + Docker | Current | HIGH | Modal for AI/ML; Docker for general use; both production-ready |
| **File Storage** | S3/R2 + PostgreSQL metadata | Current | HIGH | Industry standard; PostgreSQL for metadata only |
| **Information Graph** | PostgreSQL adjacency list | 14+ | HIGH | Single DB; no graph DB needed for MVP; React Flow for UI |

### Installation Commands

```bash
# Frontend (already mostly installed)
cd frontend
yarn add @tiptap/react @tiptap/starter-kit @tiptap/extension-table
yarn add @tiptap/extension-task-list @tiptap/extension-collaboration
yarn add react-dropzone  # For file uploads
yarn add ai  # Vercel AI SDK (optional, for streaming patterns)

# Backend
cd backend
pip install modal  # For code execution
pip install boto3  # For S3/R2 storage
# Redis, PostgreSQL already installed
```

---

## Open Questions

1. **Code Execution Cost Model**
   - What we know: Modal is cheaper than Lambda for compute-intensive workloads
   - What's unclear: Per-execution costs for typical research analyses
   - Recommendation: Implement cost monitoring; set per-user quotas

2. **Graph Query Performance**
   - What we know: PostgreSQL handles adjacency lists well
   - What's unclear: At what scale (millions of claims?) performance degrades
   - Recommendation: Profile with synthetic data; add Neo4j if needed

3. **Real-time Collaboration for Editor**
   - What we know: TipTap supports Yjs for collaboration
   - What's unclear: Is collaboration required for MVP or post-MVP?
   - Recommendation: Defer collaboration features; focus on single-user UX first

---

## Sources

### Primary (HIGH Confidence)

**Rich Text Editors:**
- [Liveblocks: Which rich text editor framework should you choose in 2025?](https://liveblocks.io/blog/which-rich-text-editor-framework-should-you-choose-in-2025) - Feb 2025
- [TipTap 3.0 Stable Release](https://tiptap.dev/blog/release-notes/tiptap-3-0-is-stable) - July 2025

**AI Chat Interfaces:**
- [GrapesTech: How to Build React AI Chatbot Interfaces (2026 Guide)](https://www.grapestechsolutions.com/blog/build-react-ai-chatbot-interface/) - Dec 2025
- [9.agency: Streaming AI Responses with Vercel AI SDK](https://www.9.agency/blog/streaming-ai-responses-vercel-ai-sdk) - Jan 2026

**Code Execution:**
- [Modal: Top Cloud Notebook Products](https://modal.com/blog/top-cloud-notebook-products) - 2025
- [Docker Blog: Docker Sandboxes for Claude Code](https://www.docker.com/blog/docker-sandboxes-run-claude-code-and-other-coding-agents-unsupervised-but-safely/) - 2025
- [E2B GitHub Repository](https://github.com/e2b-dev/e2b) - Active 2025

**Graph & Database:**
- [PuppyGraph: PostgreSQL Graph Database](https://www.puppygraph.com/blog/postgresql-graph-database) - March 2025
- [Ackee: Hierarchical Models in PostgreSQL](https://www.ackee.agency/blog/hierarchical-models-in-postgresql) - Feb 2024

**React Flow:**
- [React Flow 12.4.2 Release Notes](https://reactflow.dev/whats-new/2025-01-21) - Jan 2025

### Secondary (MEDIUM Confidence)

**Storage:**
- WebSearch verified comparisons: AWS S3 vs Cloudflare R2 (multiple sources agree on R2's egress advantage)

### Tertiary (LOW Confidence - Needs Validation)

**Claude Artifacts Pattern:**
- Multiple community implementations found; no official Anthropic documentation
- Treat as inspiration, not specification

---

## Metadata

**Confidence Breakdown:**
- Rich text editor: **HIGH** - TipTap 3.0 production-ready; comprehensive 2025 comparison
- AI chat interface: **MEDIUM** - Patterns verified; specific implementation custom
- Code execution: **HIGH** - Modal, E2B, Docker all production-ready with clear use cases
- File storage: **HIGH** - S3/R2 industry standard; PostgreSQL metadata pattern proven
- Information graph: **HIGH** - PostgreSQL adjacency list well-documented; React Flow production-ready

**Research Date:** 2025-02-03
**Valid Until:** 2025-03-03 (30 days for stable tech; re-verify if project start delays)

**Next Steps:**
1. Review STACK.md with team
2. Validate any LOW confidence items before implementation
3. Create detailed implementation phases in roadmap
4. Set up Modal/E2B account for code execution testing
5. Configure S3/R2 for file storage testing
