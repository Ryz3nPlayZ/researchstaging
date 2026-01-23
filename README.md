# AI-Native Research Execution System

An autonomous research execution system that takes high-level research intent and produces structured, defensible research outputs with full provenance and observable task execution.

## ⚠️ Important Notice

**This project is governed by [MASTER_SOURCE_OF_TRUTH.md](./MASTER_SOURCE_OF_TRUTH.md)**.

All product decisions, architecture choices, and implementation behaviors derive from that document. Any AI coding agents working on this system **must** treat the master document as authoritative and binding.

## Quick Overview

### What It Is
- An execution system (not a chat tool)
- Takes natural language research goals → produces literature reviews and research papers
- Stateful, auditable, reproducible research pipeline
- IDE-like interface for visibility and control

### What It's Not
- Not a conversational AI assistant
- Not a research "chatbot"
- Not a vague prompt chaining system
- Not stateless or opaque

### Core Differentiator
Every artifact (papers found, summaries generated, drafts written) is tied to an explicit task graph and can be inspected, reused, or audited.

## Planned Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend API | FastAPI |
| Task Execution | Celery / Dramatiq |
| Database | PostgreSQL |
| Object Storage | S3 or filesystem |
| Frontend | Next.js |
| Real-time Updates | WebSockets / SSE |

## MVP Scope

**Output Types:**
- Literature reviews
- Research papers

**Literature Sources:**
- Semantic Scholar
- arXiv

**Core Capabilities:**
- Natural language research goal input
- Automated literature discovery
- PDF acquisition and parsing
- Reference extraction and normalization
- Thematic synthesis
- Draft generation with proper citations
- Full provenance tracking

## Development Status

🚧 Project initialization phase

See [MASTER_SOURCE_OF_TRUTH.md](./MASTER_SOURCE_OF_TRUTH.md) for complete specifications.

## License

TBD
