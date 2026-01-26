# Orchestration Architecture

## System Overview

The system is organized around a central, persistent orchestration loop whose purpose is to transform an initially vague user research goal into a fully executed, inspectable research project composed of structured tasks, artifacts, and provenance-linked outputs.

## Core Components

### Router Agent
The **Router Agent** acts as the system's cognitive controller and long-horizon planner.

**Planning Phase:**
- Does not immediately decompose queries into execution tasks
- Enters iterative planning phase governed by specialized planning prompt
- Reasons about what information is knowable vs premature/unknown without literature review
- Generates minimal, constrained clarifying questions to disambiguate:
  - Output type
  - Audience
  - High-level domain boundaries
- Explicitly avoids questions about datasets, methods, variables, analyses, or gaps that cannot be known prior to literature ingestion
- Repeats until research intent is sufficiently specified
- Finalizes Research Plan object and persists to database as root state

**Execution Orchestration Phase:**
- Transitions from planning mode to execution orchestration
- Constructs task graph representing work required to fulfill the plan
- Task graph is a DAG with nodes for atomic executable tasks:
  - Literature search
  - PDF retrieval
  - PDF parsing
  - Synthesis
  - Drafting
  - Citation compilation
  - Evaluation
- Each task node includes:
  - Explicit inputs
  - Expected outputs
  - Dependencies
  - Success criteria
  - Retry policies
- Writes task graph to database
- Registers with Task Management System (TMS)

**Decision Making:**
- Authorizes task execution when TMS determines tasks are ready
- Assigns tasks to appropriate Work Agents
- Receives state changes, completion events, failure events from TMS
- Makes authoritative decisions about:
  - What to run next
  - Whether to retry failed work
  - Whether to replan
- Updates internal view of project progress
- Determines which downstream tasks are unblocked

### Task Management System (TMS)
The **TMS** functions as the system's project manager and scheduler.

**Responsibilities:**
- Tracks task states
- Enforces dependency ordering
- Manages parallel execution where possible
- Emits state transitions (pending → running → completed/failed)
- Determines when tasks are ready for execution
- Requests execution authorization from Router Agent
- Reports task state changes back to Router Agent

**Constraints:**
- Does not perform reasoning or task decomposition
- Purely a coordination and state management system
- Relies on database for state recovery and consistency

### Work Agents
**Work Agents** are specialized execution systems responsible for carrying out concrete actions using tools.

**Examples:**
- Literature Search Agent
- PDF Retrieval Agent
- PDF Parsing Agent
- Synthesis Agent
- Writing Agent
- Citation Agent

**Implementation:**
- Potentially implemented using framework like LangChain
- Constrained, task-scoped systems
- Receive task specification
- Execute using approved tools and models
- Produce structured output artifacts (not free-form text)

**Tool Access:**
- Semantic Scholar APIs
- arXiv APIs
- Web fetchers
- PDF parsers
- LLMs

**Behavior:**
- All tool calls and intermediate results recorded as events
- Persisted to database for observability and provenance
- Do not make decisions about retries or scope changes
- Only attempt to complete assigned task per Router Agent specification

### Evaluator Subsystem
The **Evaluator** is responsible for validating task outputs against success criteria.

**Evaluation Checks:**
- Completeness
- Relevance
- Internal consistency
- Citation presence
- Formatting requirements
- Alignment with research plan

**Output:**
- Structured evaluation result
- Pass or fail decision
- On failure: explicit feedback describing what was insufficient/incorrect

**Failure Handling:**
- Failure feedback sent to Router Agent (not directly to Work Agent)
- Router Agent reasons about failure nature and decides:
  - Retry as-is
  - Retry with modified instructions
  - Reassign to different Work Agent
  - Trigger partial replan of task graph
- On retry: Router Agent updates task specification with evaluator feedback, increments retry metadata, re-registers with TMS
- On deeper issues: Router Agent may generate new tasks, remove existing tasks, or adjust dependencies

### Database
The **database** functions as the single source of truth for project state.

**Stored Data:**
- Research plan
- Task graph
- Task states
- Artifacts
- Evaluator results
- Agent events
- Provenance links between outputs and sources

**Role:**
- Router Agent reads/writes continuously
- Maintains persistent, resumable understanding of project
- TMS relies on database for state recovery and consistency
- Supports parallel executions

## System Characteristics

### Closed-Loop Architecture
- Planning, execution, evaluation, and iteration are explicitly separated but tightly integrated
- Router Agent = brain
- TMS = project manager
- Work Agents = skilled executors
- Evaluator = quality control
- Database = memory

### Deterministic Progression
- Progresses from vague intent to concrete research artifacts
- Remains inspectable and debuggable
- Capable of adaptive replanning
- Not a one-shot black box

### State Persistence
- All state persisted to database
- System can resume after interruption
- Full provenance tracking
- Complete audit trail of decisions and outputs
