# Research Workspace - All-in-One Research Tool

**Last updated:** 2025-01-31 after initialization

## What This Is

A web-based research workspace that consolidates literature review, data analysis, and academic writing into one coherent, state-persistent environment. Users can import existing research projects (PDFs, code, datasets, documents), organize files in a hybrid folder/graph structure, write papers with a rich text editor comparable to Google Docs, and collaborate with an AI agent that has total recall of all project artifacts. The AI agent can propose and execute analyses (writing Python/R code, running it in a cloud sandbox, displaying results), assist with research writing, and manage the entire research workflow through a sidebar chat interface with proposal-based interactions.

**Differentiation:** Unlike Google Docs + ChatGPT, Overleaf, or Manubot, this workspace provides artifact-first memory (everything important stored: literature, analyses, findings, documents), information graph tracking claims/data/relationships, and true all-in-one integration (writer + analysis + literature in coherent workspace) with state-persistent AI that remembers context across the entire project.

**Critical Design Principle:** The workspace must function standalone as a Google Docs replacement - AI is powerful augmentation, not a requirement. Users should be able to write, organize files, and manage research without AI.

## Core Value

**Stateful research intelligence:** Single workspace where AI agent remembers everything important (all chats, analyses, documents, file contents) and uses that context to provide genuinely helpful research assistance - writing usable academic content, planning/executing data analyses, and managing the entire research workflow through proposal-based interactions.

## Requirements

### Validated

**Infrastructure Reuse (from existing Research Pilot codebase):**
- ✓ FastAPI backend with PostgreSQL + Redis - existing
- ✓ Task orchestration engine with state machine - existing
- ✓ WebSocket real-time updates - existing
- ✓ LLM service with multi-provider support (OpenAI, Gemini, Mistral, Groq) - existing
- ✓ Credit system for API usage tracking - existing
- ✓ Project/workspace data model - existing
- ✓ React frontend shell with context providers - existing

### Active

**MVP Core Features (Writer + Chat + Analysis):**

- [ ] **Rich Text Document Editor**
  - TipTap-based editor with formatting comparable to Google Docs/MS Word
  - Workspace-centric: documents live in project alongside data/files
  - Autoformatting features (citations, references, headings)
  - Feels polished, not janky, low resource usage
  - Works standalone (no AI required for basic writing)
  - Must validate: Editor feels as good as Google Docs/Word

- [ ] **Sidebar AI Agent Panel**
  - Persistent sidebar (similar to Cursor AI) for agent interaction
  - Chat-driven interaction: AI proposes actions, user approves
  - Agent has total recall: artifact-first memory of everything important (literature, analyses, findings, working artifacts)
  - AI produces formal, structured, research-appropriate writing (objective/empirical statements, good flow)
  - Multi-agent orchestration: router, planner, evaluator, peer-review emulation, work agents, writing agents (MVP-lite)
  - Must validate: AI writes usable research content (not generic fluff)

- [ ] **Project Import & File Management**
  - Drag-and-drop file upload: PDFs, DOCX, MD, Excel, Python scripts, R scripts, standard research formats
  - Hybrid organization: conventional folder structure + graph-based linking
  - Files organized within project workspace
  - Cloud-based storage for datasets and artifacts

- [ ] **Data Analysis Execution**
  - User uploads dataset or AI retrieves/acquires dataset
  - Chat-driven analysis: user talks to AI about what to analyze
  - AI writes Python/R code as file in cloud server
  - AI executes code in sandboxed cloud environment
  - Results displayed as tables or visualizations in frontend
  - Must validate: End-to-end analysis works (upload → chat → code → results)

- [ ] **Information Graph Backend (Foundation)**
  - Tracks references, claims, data analyses, relationships
  - Supports visualizing associations, causality, dependencies
  - Ensures claim consistency and prevents contradictions
  - Foundation for future UI visualization (not in MVP)

**Post-MVP Features:**
- [ ] Literature review integration (AI-assisted search, summarization, direct integration)
- [ ] Information graph visualization UI (interactive claim/data relationship browser)
- [ ] Peer review emulation agent (evaluates paper against literature)
- [ ] Custom agent builder (user-defined research workflows)

### Out of Scope

- **Literature search pipeline (from Research Pilot)** - not MVP focus, defer to post-MVP
- **Reference extraction/citation graph (from Research Pilot)** - not MVP focus, defer to post-MVP
- **"Research goal → plan → execute" flow (from Research Pilot)** - wrong UX pattern, replace with workspace-centric interaction
- **Navigator/Workspace/Inspector layout (from Research Pilot)** - wrong for writing-focused app, replace with editor + sidebar layout
- **Terminal UI (TUI)** - not needed for web-based research workspace
- **Complex custom agents** - MVP-lite orchestration only (router, planner, evaluator, work agents, writing agents)
- **Production hosting/deployment** - MVP is local/development usage only
- **Multi-user collaboration** - single-user MVP
- **Version control for documents** - manual saves only in MVP
- **Advanced citation management** - basic integration only in MVP

## Context

**Existing Codebase (Research Pilot):**
- Brownfield evolution from existing Research Pilot codebase
- Current system: AI-native research execution engine for literature reviews and research papers
- Strong foundation: state-driven orchestration, multi-LLM support, task workers, WebSocket updates
- Architecture documented in `.planning/codebase/` (7 documents, 1,617 lines)

**Evolution Strategy:**

**KEEP (Solid Foundation):**
- Backend infrastructure (FastAPI, PostgreSQL, Redis, orchestration engine)
- Task orchestration system (perfect for multi-agent workflows)
- WebSocket real-time updates
- LLM service with multi-provider support
- File upload/storage patterns
- Credit system (already tracks API usage)
- Project/workspace data model
- React frontend shell with context providers

**DESTROY & REPLACE (Wrong Product):**
- Literature search/summarization pipeline (not MVP focus)
- Reference extraction/citation graph (not MVP focus)
- "Research goal → plan → execute" flow (wrong UX pattern)
- Navigator/Workspace/Inspector layout (wrong for writing-focused app)
- TUI (terminal interface not needed)

**BUILD FRESH (New Features):**
- Rich text document editor (TipTap-based, Google Docs-style)
- File management system (drag-drop upload, organize files)
- Sidebar AI chat panel (always-visible agent interaction)
- Dataset upload/storage (cloud-based)
- Data analysis execution (Python/R sandboxed execution)
- Visualization rendering (charts, tables from analysis)
- Information graph backend (claim/data tracking - prep for post-MVP)

**Product Vision Evolution:**
- Original Research Pilot: Research execution system (literature → paper)
- New Research Workspace: All-in-one research tool (writer + chat + analysis + literature)
- Key insight: Shift from "pipeline execution" to "workspace collaboration" model

**User Workflow:**
1. User creates/imports research project by uploading files (drag-drop PDFs, code, data, docs)
2. Files organized in project workspace (hybrid folder + graph structure)
3. User opens rich text editor to write paper (works standalone, no AI required)
4. User engages AI agent in sidebar for assistance:
   - "Help me write the methods section" → AI writes formal content
   - "Analyze this dataset for correlations" → AI proposes analysis → user approves → AI writes code → executes → shows results
   - "Find papers on topic X" → AI searches literature → summarizes
5. AI agent remembers everything (artifact-first memory) and provides context-aware assistance
6. Information graph tracks all claims, data, analyses, relationships (backend ready, UI post-MVP)

**Technical Approach:**
- Leverage existing orchestration engine for multi-agent workflows
- Extend task system to support document editing, analysis execution
- Build new frontend: editor-focused layout (main editor + sidebar panel)
- TipTap for rich text editing (React-based, extensible)
- Cloud execution sandbox for Python/R (Docker containers per project)
- Information graph as PostgreSQL extension (nodes: claims, data, analyses; edges: relationships)

## Constraints

- **Type** - **MVP Scope** - Ship Writer + Chat + Analysis only, defer literature/graph UI to post-MVP
- **Type** - **Performance** - Rich text editor must be polished, not janky, low resource usage
- **Type** - **Dependencies** - Maximize reuse of existing Research Pilot codebase (backend infrastructure, orchestration, LLM service)
- **Type** - **AI Quality** - AI writing must be usable research content (formal, structured, empirical) - not generic fluff
- **Type** - **Analysis** - End-to-end data analysis must work (upload → chat → code → results)
- **Type** - **Standalone** - Workspace must function without AI (Google Docs replacement baseline)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| MVP scope: Writer + Chat + Analysis only | Ship quick, validate core value before building literature/graph features | — Pending |
| Workspace-centric document model | Documents live in project alongside data/files, Notion-style over Google Docs-style | — Pending |
| Chat-driven analysis with proposals | AI suggests actions, user approves - more control than autonomous execution | — Pending |
| Artifact-first memory system | AI remembers everything important (literature, analyses, findings, documents) - enables true context awareness | — Pending |
| TipTap for rich text editor | React-based, extensible, proven in research writing tools | — Pending |
| Hybrid file organization (folder + graph) | Conventional folders for familiarity, graph for relationships | — Pending |
| Python/R cloud execution | Sandboxed per-project Docker containers for security and isolation | — Pending |
| Evolution from Research Pilot | Maximize reuse of existing backend infrastructure (orchestration, LLM, WebSocket) | — Pending |
| Information graph backend in MVP | Build data model and tracking now, UI visualization post-MVP | — Pending |
| Must work standalone without AI | Workspace is Google Docs replacement baseline, AI is augmentation not requirement | — Pending |

---

*Last updated: 2025-01-31 after initialization*
