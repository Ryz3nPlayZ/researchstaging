# Project Research Summary

**Project:** Research Workspace (All-in-One Research Tool)
**Domain:** AI-powered research workspace with rich text editing, data analysis, and stateful AI memory
**Researched:** 2025-02-03
**Confidence:** HIGH

## Executive Summary

Research Workspace is a **stateful AI collaboration platform**, not just a document editor or research tool. The research reveals that successful products in this space (Notion, Cursor, Windsurf Wave) treat the document as the source of truth with AI as a read/write participant, not an external tool. The architecture shifts from pipeline-based execution (current Research Pilot) to persistent, collaborative environments where AI has total recall of all project artifacts.

**Recommended approach:** Build incrementally starting with rich text editor → auto-save → AI chat sidebar → file management → data analysis. This ordering reflects technical dependencies (editor enables everything else), user value progression (writing → AI assistance → organization → analysis), and risk mitigation (validate editor quality before adding AI complexity).

**Key risks:** (1) Editor performance degradation on large documents (>10k words causes typing lag), (2) AI context retrieval latency at scale (slow memory kills the "total recall" value prop), (3) Code execution sandbox escapes (Docker isolation is not perfect), (4) Feature creep in editor UI (bloat makes product feel janky). Mitigation: Profile editor performance early (<16ms per keystroke), use artifact-first indexing with vector search, implement defensive resource limits, and ruthlessly scope editor features.

**Biggest insight:** The differentiator is not AI chat or code execution—those are commodities. The differentiator is **artifact-first memory**: AI accessing all project context without manual context loading. This requires building the information graph backend early, even if visualization UI is post-MVP.

## Key Findings

### Recommended Stack

**Summary from STACK.md:**

Research Workspace should maximize reuse of existing Research Pilot backend (FastAPI, PostgreSQL, Redis, orchestration engine) and add new capabilities with minimal infrastructure complexity. The 2025 stack prioritizes production-ready libraries over experimental options.

**Core technologies:**

- **TipTap 3.x** (already installed) — Rich text editor with best-in-class performance, MIT-licensed, tree-shakable extensions. Battle-tested via ProseMirror foundation with better DX than Slate.js. Google Docs-class editing without the bloat.

- **Custom React + Vercel AI SDK patterns** — Streaming chat interface via existing WebSocket infrastructure. No heavy chat SDKs (Stream Chat, Chatbot kits) which are overkill for AI assistant. Use `useChat` patterns for token-level streaming, not await-all responses.

- **Modal** (cloud execution) or **Docker containers** — For Python/R code execution. Modal is better for AI/ML workloads (GPU support, pre-built environments), Docker for simple sandboxes. Start with Docker for MVP (lower complexity), migrate to Modal if needed for scale.

- **S3-compatible object storage** (AWS S3 or Cloudflare R2) — File storage for datasets, PDFs, documents. PostgreSQL for metadata only (don't store BLOBs in DB). R2 has zero egress fees, better for research datasets.

- **PostgreSQL with adjacency list tables** — Information graph backend. No separate graph DB (Neo4j, ArangoDB) for MVP—adds complexity without sufficient benefit for MVP scale. Use `pgvector` extension for vector search if needed.

- **Pandoc** (already in backend) — Document export (PDF, DOCX, Markdown). Leverage existing `export_service.py`.

**What NOT to use:**

- **Lexical** (Meta) — No 1.0 release yet, lacks pure decorations for collaborative cursors
- **Editor.js** — No real-time collaboration support (critical blocker)
- **CKEditor/TinyMCE** — GPL license issues, paywall for features
- **Neo4j** — Overkill for MVP graph, adds operational complexity
- **Stream Chat** — Designed for human-to-human chat, overkill for AI assistant

### Expected Features

**Summary from FEATURES.md:**

**Table stakes (must have or users leave):**
- Rich text formatting (bold, italic, headers, lists) — TipTap provides out of box
- Auto-save with debouncing — Losing work is unforgivable
- Export options (PDF, Markdown, DOCX) — Pandoc integration
- Undo/Redo — Standard editor behavior
- Document organization (folders/collections) — Basic database queries
- File upload (PDFs, data, images) — Multipart form handling
- Version history — Revert mistakes, see changes
- Citation support — @-mention style citations for research

**Differentiators (competitive advantage):**
- **Artifact-first AI memory** — AI accesses all project artifacts without manual context loading (HIGH complexity, this is THE differentiator)
- **Proposal-based interactions** — AI suggests actions, user approves (builds trust vs autonomous execution)
- **End-to-end data analysis** — Upload dataset → AI writes Python/R → executes → shows results (all in one flow)
- **Hybrid folder+graph organization** — Folders for familiarity, graph for relationships
- **Provenance inspector** — Click any output to see what sources/produced it

**Defer (v2+ or out of scope):**
- Real-time multi-user editing — Extreme complexity (OT/CRDT), conflicts with research-as-pipeline model. Use async sharing + commenting for MVP.
- Mobile app — Research work requires desktop, low ROI. Responsive web suffices.
- Social features — Network effects require scale, distraction from core value. Single-user productivity first.
- Real-time web browsing — Flaky, costs money. Use static literature APIs (Semantic Scholar, arXiv).

### Architecture Approach

**Summary from ARCHITECTURE.md:**

Stateful AI workspaces require **five core subsystems**:

1. **Rich Text Editor Backend** — Real-time sync via WebSocket, auto-save with debouncing (300-500ms), version history with diff algorithm
2. **AI Chat Orchestration** — Proposal system (AI suggests → user approves → executes), context retrieval (assemble relevant artifacts), agent dispatch (router → planner → worker agents)
3. **File Management** — Upload (multipart forms), metadata extraction (file type, size, semantic content), semantic indexing (embeddings for search)
4. **Data Analysis Execution** — Sandboxed code execution (Docker per project), result streaming (stdout, plots, dataframes via WebSocket), resource limits (CPU, memory, timeout)
5. **Artifact Memory** — Information graph (PostgreSQL adjacency list: nodes=artifacts, edges=relationships), vector search (pgvector for semantic similarity), context assembly (RAG for AI prompts)

**Major components:**

| Component | Responsibility |
|-----------|----------------|
| **TipTap Editor** (Frontend) | Rich text editing, AI insertion points, collaborative cursors (future) |
| **Document Service** (Backend) | Auto-save debouncing, version history, document state persistence, WebSocket sync |
| **Orchestration Service** (Backend) | Proposal workflow, agent dispatch, context retrieval, task execution |
| **File Service** (Backend) | Upload handling, metadata extraction, storage (S3), semantic indexing |
| **Execution Service** (Backend) | Docker container management, Python/R kernel execution, result streaming |
| **Artifact Memory Service** (Backend) | Information graph CRUD, vector embeddings, semantic search, context assembly |
| **AI Chat Sidebar** (Frontend) | Streaming messages, proposal UI (approve/reject), auto-scrolling, typing indicators |

**Data flow:**
1. User types in TipTap editor → debounced auto-save to Document Service (300ms)
2. Document Service persists to PostgreSQL, emits WebSocket event
3. User asks AI in sidebar: "Analyze this dataset" → Orchestration Service receives request
4. Orchestration assembles context: retrieves document content + dataset metadata from File Service + related analyses from Artifact Memory
5. Orchestration creates proposal: "I'll write Python code to perform correlation analysis on [dataset], execute it, and show results" → displays in sidebar
6. User approves → Orchestration dispatches to Execution Service
7. Execution Service spins up Docker container, writes Python code, executes, streams results via WebSocket
8. Results displayed in editor (insertion at cursor) or sidebar (table/chart)
9. Artifact Memory stores analysis: links to dataset, code, results, document context (for future retrieval)

**Suggested build order:**
1. **Editor foundation** (TipTap setup, basic formatting) — Everything depends on this
2. **Auto-save + Versioning** (Document Service, WebSocket) — Required before AI insertion
3. **AI Chat Sidebar** (streaming, proposal UI) — Core differentiator
4. **File Management** (upload, storage, metadata) — Enables dataset upload
5. **Artifact Memory Backend** (graph, vector search) — Enables context-aware AI
6. **Data Analysis Execution** (Docker, code execution) — Completes Writer + Chat + Analysis MVP

### Critical Pitfalls

**Top 5 from PITFALLS.md:**

1. **Editor performance on large documents** — Typing lag >100ms makes product unusable. **How to avoid:** Debounced state updates (300-500ms), lazy load heavy extensions, disable Chrome spellcheck for large docs, profile with React DevTools (<16ms per keystroke target), never store base64 images in document (use URLs). **Phase:** 1 (Editor)

2. **AI context retrieval latency** — Slow memory kills "total recall" value prop. **How to avoid:** Artifact-first indexing (embeddings on upload), vector search with pgvector, cache frequently accessed artifacts, paginate context assembly, monitor retrieval time (<500ms target). **Phase:** 3 (Artifact Memory)

3. **Code execution sandbox escapes** — Docker isolation is not perfect. **How to avoid:** Resource limits (CPU: 1 core, memory: 2GB, timeout: 60s), network isolation (disable outbound except package install), read-only filesystem except `/workspace`, scan code for obvious exploits (`eval`, `exec`, `os.system`), run as non-root user. **Phase:** 4 (Analysis Execution)

4. **Feature creep in editor UI** — Bloat makes product feel janky. **How to avoid:** Start with minimal formatting (Bold, Italic, Headings, Lists, Links, Code blocks), hide advanced options behind slash commands (`/table`, `/quote`), usage analytics to remove unused features (<5% adoption after 6 months), follow TipTap headless philosophy (no default UI). **Phase:** 1 (Editor) - ongoing discipline

5. **Information graph query performance** — Graph traversal slow at scale. **How to avoid:** Use PostgreSQL adjacency lists (not recursive CTEs for deep queries), materialized aggregations for common queries, limit traversal depth (max 3 hops), index heavily (`artifact_id`, `relationship_type`, `created_at`), avoid graph visualization for >100 nodes (too overwhelming). **Phase:** 3 (Artifact Memory Backend) - optimize early

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Rich Text Editor Foundation

**Rationale:** Editor is the foundation for everything else. Users must be able to write standalone (Google Docs replacement baseline) before AI augmentation adds value. Research shows performance issues kill these products—validate editor quality early.

**Delivers:** TipTap editor with basic formatting, auto-save with debouncing, version history, undo/redo, export (PDF/DOCX/MD)

**Addresses:** Table stakes features from FEATURES.md (rich text formatting, auto-save, export, undo/redo, version history)

**Avoids:** Performance pitfalls from PITFALLS.md (debounced updates, <16ms per keystroke, Chrome spellcheck disabled for large docs, no base64 images in document)

**Uses:** TipTap 3.x (STACK.md) with minimal extensions (StarterKit, TaskList, Table)

### Phase 2: AI Chat Sidebar with Proposal System

**Rationale:** AI chat is the primary differentiator (artifact-first memory, proposal-based interactions). Build after editor validated so AI can insert content into documents. Order prevents building AI that can't actually help with writing.

**Delivers:** Streaming chat interface, proposal UI (approve/reject actions), artifact memory backend (PostgreSQL graph + pgvector), context retrieval for AI prompts

**Addresses:** Differentiators from FEATURES.md (artifact-first AI memory, proposal-based interactions, research-native chat)

**Avoids:** Latency pitfalls from PITFALLS.md (artifact-first indexing, vector search, caching, <500ms retrieval target)

**Uses:** Custom React + Vercel AI SDK patterns (STACK.md), WebSocket streaming (existing infrastructure), PostgreSQL adjacency lists for graph

**Implements:** AI Chat Orchestration + Artifact Memory Service from ARCHITECTURE.md

### Phase 3: File Management System

**Rationale:** File upload enables dataset upload (required for analysis). Build after AI chat so AI can help organize and index files. Order ensures AI memory system exists to semantically index uploaded files.

**Delivers:** Drag-and-drop file upload, S3-compatible storage (Cloudflare R2 for zero egress fees), metadata extraction, semantic indexing (embeddings), folder organization

**Addresses:** Table stakes features from FEATURES.md (file upload, document organization, search within documents)

**Avoids:** Scalability pitfalls from PITFALLS.md (S3 for storage not PostgreSQL BLOBs, metadata extraction in background jobs, file size limits)

**Uses:** S3-compatible object storage (STACK.md), PostgreSQL metadata only, embedding model for semantic indexing

**Implements:** File Service from ARCHITECTURE.md

### Phase 4: Data Analysis Execution

**Rationale:** Completes Writer + Chat + Analysis MVP. Build last because it depends on file upload (datasets) and AI chat (proposal system for analysis). Order ensures all prerequisites exist.

**Delivers:** Sandboxed Python/R code execution (Docker containers per project), result streaming (tables, plots via WebSocket), AI proposal → approval → execution flow, visualization rendering

**Addresses:** Differentiators from FEATURES.md (end-to-end data analysis, live preview execution)

**Avoids:** Security pitfalls from PITFALLS.md (Docker resource limits, network isolation, read-only filesystem, code scanning, non-root user)

**Uses:** Docker for sandboxes (STACK.md), WebSocket result streaming, existing orchestration engine for task management

**Implements:** Execution Service from ARCHITECTURE.md

### Phase 5: Post-MVP Features (Literature + Graph UI)

**Rationale:** Validate MVP core first (Writer + Chat + Analysis). Literature review and graph visualization are nice-to-have but not required for MVP validation.

**Delivers:** Literature search integration (Semantic Scholar, arXiv), reference graph visualization UI (D3.js or Cytoscape.js), peer review emulation agent

**Addresses:** Post-MVP features from FEATURES.md

**Note:** These were explicitly scoped out of MVP in PROJECT.md

### Phase Ordering Rationale

- **Why Editor → AI Chat → Files → Analysis:** This order reflects technical dependencies (editor enables AI insertion, files enable analysis) and user value progression (writing → AI assistance → organization → analysis). Each phase validates a core capability before adding complexity.
- **Why this grouping:** Phase 1-2 establish the core differentiator (stateful AI workspace), Phase 3-4 add data capabilities. Grouping prevents building features in isolation (e.g., file upload without semantic indexing is just Dropbox).
- **How this avoids pitfalls:** Phase 1 validates editor performance early (prevents "janky" reputation), Phase 2 builds artifact memory before it's needed (prevents slow retrieval later), Phase 4 adds sandboxing only after other features work (prevents over-engineering execution system before validating demand).

### Research Flags

**Phases likely needing deeper research during planning:**

- **Phase 2 (AI Chat):** Vector search implementation (pgvector vs separate vector DB), embedding model selection (OpenAI text-embedding-3 vs open source), RAG prompt engineering for context assembly. These are complex topics with sparse production documentation.

- **Phase 4 (Analysis Execution):** Docker container lifecycle management (spawn vs pool, resource allocation), result streaming format (stdout parsing, plot image capture, dataframe serialization), error handling (kernel crashes, syntax errors). These have niche patterns—standard web dev resources don't cover them.

**Phases with standard patterns (skip research-phase):**

- **Phase 1 (Editor):** TipTap is well-documented with official examples. Auto-save and versioning are standard web dev patterns (debouncing, WebSocket updates). No research needed—just implementation.

- **Phase 3 (File Management):** File upload (multipart forms), S3 storage (boto3 documentation), metadata extraction (standard Python libraries like `python-magic`, `PyPDF2`) are all well-documented. No research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified with 2025 sources (Liveblocks comparison, Grapestech guide, official docs). TipTap already installed and validated. |
| Features | HIGH | Cross-referenced multiple products (Google Docs, Overleaf, Notion, Jupyter, Cursor). Table stakes vs differentiators clearly categorized. |
| Architecture | MEDIUM | Standard patterns documented (Notion, Cursor), but artifact memory system is novel (few production examples). Information graph backend needs validation during implementation. |
| Pitfalls | HIGH | Well-documented in current production systems (TipTap performance issues, Docker security, S3 scalability). Specific warning signs and prevention strategies provided. |

**Overall confidence:** HIGH

Stack and features are firmly grounded in current production examples. Architecture is sound but artifact memory system needs implementation validation (few precedents). Pitfalls are well-documented with actionable prevention strategies.

### Gaps to Address

- **Vector search implementation:** pgvector extension vs separate vector DB (Pinecone, Weaviate). Research pgvector performance at scale during Phase 2 planning. If pgvector is insufficient, consider migration path to dedicated vector DB.
- **Embedding model selection:** OpenAI text-embedding-3 vs open source (sentence-transformers). Tradeoff: cost/quality vs privacy/hosting cost. Validate during Phase 2 planning with benchmark on research document corpus.
- **Docker container lifecycle:** Spawn vs pool, resource allocation, result caching. No clear best practices for research workloads. Will need to experiment during Phase 4 implementation (start with spawn-per-execution, optimize if performance issues).
- **Information graph schema design:** How to represent "claims" vs "analyses" vs "documents"? Relationship types? Granularity? Will need to iterate during Phase 2 implementation (start with simple artifact → artifact relationships, refine as usage patterns emerge).

## Sources

### Primary (HIGH confidence)
- [Liveblocks - Which Rich Text Editor in 2025?](https://liveblocks.io/blog/which-rich-text-editor-framework-should-you-choose-in-2025) — TipTap vs alternatives comparison, verified Jan 2025
- [Grapestech - Build React AI Chatbot (2026 Guide)](https://www.grapestechsolutions.com/blog/build-react-ai-chatbot-interface) — Streaming chat patterns, verified Jan 2026
- [TipTap Official Documentation](https://tiptap.dev/) — Extensions, API reference, collaboration guide
- [Vercel AI SDK Documentation](https://sdk.vercel.ai/docs) — `useChat` hook, streaming patterns
- [Modal Documentation](https://modal.com/docs) — Cloud execution for Python/R, GPU support
- [Pandoc Documentation](https://pandoc.org/) — Document format conversion

### Secondary (MEDIUM confidence)
- [Notion Architecture Blog Posts](https://www.notion.so/blog) — Block-based editor, real-time sync patterns
- [Cursor Blog](https://cursor.sh/blog) — AI code generation, proposal-based interactions
- [PostgreSQL pgvector Documentation](https://github.com/pgvector/pgvector) — Vector search extension
- [Docker Security Best Practices](https://docs.docker.com/engine/security/) — Sandboxing, resource limits, user isolation
- [S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/optimizing-performance.html) — Storage scalability, cost optimization

### Tertiary (LOW confidence)
- [Windsurf Wave Architecture](https://codeium.com/blog/windsurf-wave) — AI-first IDE architecture (limited public docs)
- [JupyterLab Architecture](https://jupyterlab.readthedocs.io/) — Notebook execution patterns (different use case: exploratory vs production)
- Community discussions on Reddit/HackerNews about AI memory systems — Anecdotal, needs validation

---
*Research completed: 2025-02-03*
*Ready for roadmap: yes*
