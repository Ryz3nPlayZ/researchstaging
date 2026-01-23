# MASTER SOURCE OF TRUTH

**Status**: AUTHORITATIVE
**Last Updated**: 2025-01-23
**Purpose**: This document is the single source of truth for the AI-native Research Execution System. All product decisions, architecture choices, and implementation details derive from this document.

---

⚠️ **CRITICAL INSTRUCTION FOR AI CODING AGENTS** ⚠️

This document is the source of truth. Any AI coding agent working on this system **must**:
1. Treat this document as **authoritative** and **binding**
2. Implement **exactly** what is described below
3. **Avoid inventing** new product behavior or abstractions unless explicitly instructed
4. Reference this document by name in commit messages and implementation notes
5. When in doubt, defer to this document rather than assumptions or general best practices

---

# Product Specification: AI-Native Research Execution System

## Product Vision

This product is an AI-native research execution system designed to take a high-level research intent from a user and autonomously produce structured, defensible research outputs (initially literature reviews and research papers) with full provenance, observable task execution, and state persistence.

The goal is **not** to "chat about research" but to **execute research as a pipeline**, where planning, literature discovery, synthesis, and drafting are treated as first-class computational processes rather than conversational steps.

## Target User

The primary user is a serious researcher, analyst, or organization that values:
- **Speed** over novelty or conversational flair
- **Traceability** and auditability
- **Completeness** over convenience
- **Defensible outputs** with provenance

## Core Differentiation

This system does not rely on vague prompt chaining or unstructured agent behavior. Instead, it operates as a **stateful research engine** where:
- Every artifact (papers found, summaries generated, drafts written) is tied to an explicit task graph
- All artifacts can be inspected, reused, or audited
- The system never pretends to "know" research gaps or analysis choices upfront
- Decisions are explicitly deferred until prerequisite stages (e.g., literature collection) are complete

This approach **prevents premature or invalid questioning** and dramatically improves output quality.

---

# User Experience Design

## Philosophy: Minimal, Front-Loaded Input

The user flow is intentionally minimal and front-loaded **only with information that is truly knowable at the start**.

### User Input Phase

The user begins by providing a **research goal expressed in natural language** (e.g., "regional disparities in adolescent mental health").

The system **may ask at most a small number of constrained, high-signal questions** strictly limited to:
- **Output type**: Research paper vs literature review
- **Intended audience**: Academic, industry, policy, general public

### What the System Must NOT Ask

The system **must not ask** about the following at the initial stage, because these are **unknowable prior to literature review**:
- ❌ Datasets to use
- ❌ Specific methods or methodologies
- ❌ Variables to analyze
- ❌ Research gaps
- ❌ Hypotheses
- ❌ Analytical approaches

### User Flow

1. **Input**: User provides research goal in natural language
2. **Clarification** (optional): System asks 1-2 constrained questions about output type and audience
3. **Planning**: System generates a research plan internally
4. **Review**: System presents the plan for user review
5. **Execution**: System transitions into execution **without further interrogation**

## User Interface Design

The UX emphasizes **visibility rather than control**. It should feel closer to an **IDE or research cockpit** than a chat app.

### Core UI Components

1. **Global Status Bar**
   - Shows: pending, running, failed, and completed task counts
   - Real-time updates via WebSockets or SSE
   - Always visible, reinforces "production system" feel

2. **Navigator Panel**
   - Projects view
   - Tasks view (with status indicators)
   - Documents view (generated outputs)
   - Literature artifacts view (papers, summaries, references)
   - Tree or hierarchical structure

3. **Central Workspace**
   - Displays documents as they are produced
   - Supports draft viewing, editing, and annotation
   - Shows literature collections and reference lists
   - Clean, minimal design

4. **Inspector Panel**
   - Shows metadata and provenance for any selected item
   - For a paragraph: "what produced this?"
   - For a section: "which sources informed this?"
   - For a paper: download source, extraction method, quality score

### Design Principles

- ✅ IDE-like, structured, professional
- ✅ Status and progress always visible
- ✅ All artifacts inspectable
- ❌ No chat-centric interface
- ❌ No conversational filler
- ❌ No "appearing smart" behaviors

---

# Architecture

## Design Philosophy

**Persistent, event-driven execution model**

The system is explicitly **not stateless**. Every project, task, run, and artifact is persisted so that execution can be resumed, inspected, or partially re-run without loss of context.

**LLMs are tools, not the architecture**

LLMs are treated as callable tools inside this architecture, not as the architecture itself.

## System Components

### 1. Backend API Layer
- **Technology**: FastAPI or similar
- **Responsibilities**:
  - Project management
  - Task orchestration
  - Artifact storage and retrieval
  - API endpoints for frontend

### 2. Task Management System (TMS)
- **Responsibilities**:
  - Schedule and execute work asynchronously
  - Resolve task dependencies
  - Dispatch tasks to worker agents when prerequisites are satisfied
  - Track task status and retries
- **Implementation Options**:
  - Celery
  - Dramatiq
  - Lightweight in-house scheduler

### 3. Worker Agents
- **Design Principle**: Narrow and dumb by design
- **Characteristics**:
  - Do not decide what to do next
  - Simply execute assigned task
  - Produce artifacts
  - Emit events

**Types of Worker Agents**:
- Literature search agent (Semantic Scholar, arXiv APIs)
- PDF acquisition and parsing agent
- Reference extraction and normalization agent
- Thematic clustering agent
- Synthesis agent
- Drafting agent

### 4. Planner Component
- **Input**: User's research goal + selected output type
- **Output**: Task graph
- **Process**:
  - Converts high-level intent into structured execution plan
  - Generates tasks with clear input contracts
  - Defines output artifact types
  - Specifies dependency relationships

### 5. Evaluator Component (Optional for MVP)
- **Responsibility**: Score outputs and decide whether retries are necessary
- **Constraint**: Operates strictly within **predefined rules** rather than open-ended judgment

### 6. Database (Single Source of Truth)
- **Technology**: PostgreSQL
- **Purpose**: Persist all state for projects, tasks, runs, artifacts, and events

### 7. Object Storage
- **Purpose**: Store PDFs and large artifacts
- **Technology**: S3-compatible storage or local filesystem

## Technology Stack (MVP)

| Component | Technology | Notes |
|-----------|-----------|-------|
| Backend API | FastAPI | Python, async support |
| Task Execution | Celery/Dramatiq or in-house | Async scheduling |
| Database | PostgreSQL | Relational, ACID compliant |
| Object Storage | S3 or filesystem | For PDFs and large artifacts |
| Frontend | Next.js | Clean, minimal design |
| Real-time Updates | WebSockets or SSE | For task progress |
| Agent Orchestration | LangChain (optional) | As internal utility only |

⚠️ **Important**: LangChain (or similar) may be used as an internal utility, but it **must not dictate product behavior or UX**.

---

# Data Model

## Core Entities

### 1. Projects
- **Definition**: Top-level research efforts
- **Fields**:
  - `id`: Unique identifier
  - `user_id`: Owner
  - `research_goal`: Natural language description
  - `output_type`: research_paper, literature_review, etc.
  - `audience`: academic, industry, policy, general
  - `status`: planning, running, completed, failed
  - `created_at`, `updated_at`

### 2. Tasks
- **Definition**: Units of work with status and dependencies
- **Fields**:
  - `id`: Unique identifier
  - `project_id`: Parent project
  - `name`: Human-readable task name
  - `description`: What this task does
  - `input_contract`: Expected input artifacts/types
  - `output_artifact_type`: What this task produces
  - `dependencies`: List of task IDs that must complete first
  - `status`: pending, running, completed, failed, skipped
  - `max_retries`: Maximum retry attempts
  - `created_at`, `started_at`, `completed_at`

### 3. Artifacts
- **Definition**: Outputs of the research process
- **Types**: Papers, summaries, drafts, reference lists, etc.
- **Fields**:
  - `id`: Unique identifier
  - `project_id`: Parent project
  - `task_id`: Task that produced this artifact
  - `run_id`: Specific execution run that produced this
  - `artifact_type`: paper, summary, draft, reference_list, etc.
  - `content`: The actual content (or reference to storage)
  - `metadata`: Additional properties (source URL, quality score, etc.)
  - `created_at`

### 4. Runs
- **Definition**: Individual executions of tasks (including retries)
- **Fields**:
  - `id`: Unique identifier
  - `task_id`: Task being executed
  - `status`: pending, running, completed, failed
  - `input_artifacts`: IDs of artifacts used as input
  - `output_artifact_id`: ID of produced artifact
  - `error_message`: If failed
  - `retry_count`: Which retry attempt this is
  - `started_at`, `completed_at`

### 5. Events
- **Definition**: Immutable logs of what happened and when
- **Fields**:
  - `id`: Unique identifier
  - `project_id`: Related project
  - `task_id`: Related task (if applicable)
  - `run_id`: Related run (if applicable)
  - `event_type`: task_created, task_started, task_completed, artifact_created, error, etc.
  - `event_data`: JSON payload with event details
  - `timestamp`: When the event occurred

## Provenance Queries

The data model must support queries like:
- "What produced this paragraph?" → Follow artifact → task → run → input artifacts
- "Which sources informed this section?" → Follow artifact → references → source artifacts

This **explicit linkage** is a key differentiator: it enables trust, auditability, and incremental improvement.

---

# Research Pipeline

## Task Graph Structure

When a project is created, the planner converts the user's research goal into a task graph. A typical task graph includes:

### 1. Literature Discovery
- **Input**: Research goal
- **Actions**:
  - Query APIs (Semantic Scholar, arXiv, PubMed, etc.)
  - Retrieve relevant papers
- **Output**: Artifact of type `paper_list` with metadata

### 2. PDF Acquisition and Parsing
- **Input**: Paper list from discovery
- **Actions**:
  - Download PDFs
  - Parse text and metadata
  - Extract references
- **Output**: Artifacts of type `pdf_content` and `reference_list`

### 3. Reference Extraction and Normalization
- **Input**: Parsed PDFs
- **Actions**:
  - Extract references from papers
  - Normalize citation formats
  - Build citation graph
- **Output**: Artifact of type `normalized_references`

### 4. Thematic Clustering / Synthesis
- **Input**: Paper contents and references
- **Actions**:
  - Cluster papers by theme
  - Identify common patterns
  - Extract key findings
- **Output**: Artifacts of type `thematic_clusters`, `key_findings`

### 5. Drafting
- **Input**: All previous artifacts
- **Actions**:
  - Generate structured draft
  - Integrate citations properly
  - Ensure coherence and flow
- **Output**: Artifact of type `draft`

### 6. Quality Evaluation (Optional for MVP)
- **Input**: Draft
- **Actions**:
  - Check completeness
  - Validate citations
  - Score quality
- **Output**: Artifact of type `quality_report`

## Task Dependencies

Tasks are executed in dependency order:
- Literature Discovery → PDF Acquisition → Reference Extraction → Synthesis → Drafting → Evaluation

Each task records:
- Clear input contract (what it needs)
- Output artifact type (what it produces)
- Dependency list (what must complete first)

---

# Constraints and Rules

## Planning and Questioning Discipline

**Critical Rule**: The planner must **never ask the user for information that logically depends on later stages of the research process**.

### Forbidden Questions (Before Literature Review)
- ❌ "What specific variables do you want to analyze?"
- ❌ "What datasets should we use?"
- ❌ "What methodology do you prefer?"
- ❌ "What are the key research gaps you're interested in?"
- ❌ "What hypotheses should we test?"

### Allowed Questions (Initial Phase Only)
- ✅ "What type of output do you need?" (research paper, literature review, etc.)
- ✅ "Who is the intended audience?" (academic, industry, policy, general)

### Rationale

Questions about methods, variables, gaps, or datasets are **unknowable** before the literature review is complete. Asking them prematurely:
- Leads to invalid or biased answers
- Forces users to speculate without evidence
- Reduces output quality
- Violates the research process

This rule **must be encoded directly into system instructions** and reinforced by examples.

## Agent Behavior Rules

### Worker Agents
- **DO**:
  - Execute assigned task
  - Produce specified artifacts
  - Emit events on completion
  - Handle errors gracefully

- **DO NOT**:
  - Decide what to do next
  - Ask users questions
  - Make high-level research decisions
  - Deviate from task contract

### Planner
- **DO**:
  - Generate task graphs from research goals
  - Respect dependencies
  - Present plans for review

- **DO NOT**:
  - Ask about unknowable information
  - Claim to identify gaps without evidence
  - Speculate about methods or datasets

---

# MVP Scope

## Deliberately Narrow Initial Release

### Supported Output Types (MVP)
1. Literature Review
2. Research Paper (basic structure)

### Supported Literature Sources (MVP)
1. Semantic Scholar API
2. arXiv

### Core Capabilities (MVP)
- ✅ Natural language research goal input
- ✅ Automated literature discovery
- ✅ PDF acquisition and parsing
- ✅ Reference extraction
- ✅ Basic thematic synthesis
- ✅ Draft generation with citations
- ✅ Full provenance tracking
- ✅ Task progress visibility
- ✅ Artifact inspection

### Deferred Features (Post-MVP)
- Collections and tagging
- Collaboration features
- Advanced analytics
- Custom integrations
- Multi-format exports
- Version control for drafts

---

# Go-to-Market Strategy

## Monetization Readiness

Monetization **can begin as soon as** users can reliably generate high-quality drafts faster than manual workflows, even if advanced features are deferred.

### Value Proposition
- Generate research drafts **10x faster** than manual workflows
- Full provenance and auditability
- Reproducible research process
- Defensible outputs with traceable sources

### Revenue Trigger
Users will pay when:
1. The system produces **coherent, well-cited drafts**
2. The process is **visible and inspectable**
3. The output quality is **consistent and reliable**

---

# Development Principles

## Speed to MVP Over Novelty

The stack prioritizes **reliability and speed** over architectural novelty.

### Guidelines
- ✅ Use established, well-documented technologies
- ✅ Avoid premature optimization
- ✅ Build for the happy path first
- ✅ Add error handling based on real usage
- ❌ Avoid over-engineering
- ❌ Avoid speculative features
- ❌ Avoid framework dogmatism

## Iteration Philosophy

**Generate revenue, then iterate based on real usage rather than speculative architecture.**

The system should be:
1. Functional for the core use case
2. Reliable enough for real research workflows
3. Sufficient for users to see immediate value
4. Ready for improvement based on actual usage patterns

---

# Implementation Instructions for AI Agents

## When Working on This System

1. **Read this document first** before making any product decisions
2. **Implement exactly what is described** - do not add features "that would be nice"
3. **When you encounter ambiguity**, choose the simplest solution that satisfies the specification
4. **Reference this document** in commit messages: "Implemented per MASTER_SOURCE_OF_TRUTH.md section X.Y"
5. **Do not invent** new user flows or data models without explicit user instruction
6. **When you need to make a technical choice**, prefer established tools over novel ones
7. **Focus on the MVP scope** - defer everything else

## Red Flags to Avoid

🚩 **Adding chat-centric features** - This is not a chat app
🚩 **Adding research questions before literature review** - Violates core discipline
🚩 **Making agents "smart" or conversational** - Agents should be narrow and dumb
🚩 **Skipping provenance tracking** - This is a key differentiator
🚩 **Building speculative features** - Stay within MVP scope
🚩 **Over-engineering the data model** - Keep it simple and functional

---

# Summary

This is an **execution system**, not a conversation tool.

The value comes from:
1. **Autonomous research pipeline execution**
2. **Full provenance and auditability**
3. **Observable task progress**
4. **Structured, defensible outputs**

The system behaves like a **competent research assistant** that executes rather than an overeager conversationalist that pretends to know.

**Everything in this system is oriented toward getting to MVP quickly, generating revenue, and then iterating based on real usage.**

---

**END OF MASTER SOURCE OF TRUTH**
