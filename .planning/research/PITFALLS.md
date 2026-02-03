# Pitfalls Analysis: Research Workspace Features

**Domain:** Research tools (rich text editors, AI chat, data analysis, file management, information graphs)
**Researched:** 2025-02-03
**Overall Confidence:** HIGH

## Executive Summary

Research tools commonly fail in five critical areas when adding workspace features: (1) rich text editors that become janky and bloated, (2) AI chat that produces generic output and hits retrieval latency issues, (3) code execution sandboxes that escape or exhaust resources, (4) file management that hits upload limits and scalability walls, and (5) information graphs with slow queries and ambiguous relationships. These pitfalls are well-documented in current production systems and have specific, actionable prevention strategies.

**Primary warning:** The most common failure pattern is underestimating performance complexity (typing lag, memory leaks, slow queries) and overestimating isolation guarantees (Docker sandboxes, AI memory systems). Success requires proactive testing at scale, defensive architecture, and ruthless feature scoping.

---

## 1. Rich Text Editor Pitfalls

### 1.1 Performance Degradation

**What goes wrong:**
- Large documents (>10,000 words) cause severe typing lag and slowdowns
- React re-rendering issues dominate performance problems
- Memory leaks from uncleaned event listeners and circular references
- Chrome spellcheck feature adds significant overhead on large documents

**Why it happens:**
- TipTap's `findElementNextToCoords` method in DragHandlePlugin causes O(n²) behavior
- Custom React node views trigger full re-renders on every keystroke
- `getHTML()` function calls become expensive with deeply nested formatting
- Document state syncs on every keystroke without debouncing

**How to avoid:**
- Use TipTap 2.5+ with React performance optimizations (backwards compatible)
- Implement debounced state updates (300-500ms) during typing
- Lazy load heavy extensions (collaboration, comments) only when needed
- Disable Chrome spellcheck (`spellcheck="false"`) for large documents
- Profile with React DevTools Profiler before launch; target <16ms per keystroke
- Set `immediatelyRender: false` in Next.js/SSR environments
- Never store binary data (base64 images) in document; use URLs

**Warning signs:**
- Typing feels "heavy" or delayed (input lag >100ms)
- Memory usage grows monotonically during editing session
- Chrome DevTools Performance profile shows long tasks (>50ms)
- Cursor jumping or re-rendering visible on screen during typing

**Phase responsibility:** Phase 1 (Editor)

---

### 1.2 Collaboration Complexity

**What goes wrong:**
- Real-time conflicts cause data loss or corruption
- CRDT synchronization silently fails without error messages
- Schema changes between versions break existing documents
- Multiple editors on same page overwrite each other's changes

**Why it happens:**
- TipTap uses Yjs for synchronization; improper setup causes race conditions
- Content validation disabled by default (`enableContentCheck: false`)
- Using `content` instead of `initialContent` duplicates text on every load
- Missing `field` option causes multiple editors to share same Yjs document

**How to avoid:**
- Always enable content validation: `enableContentCheck: true`
- Implement `onContentError` handler to detect schema mismatches
- Use `initialContent` (not `content`) for default text
- Use `field` option with unique IDs for multiple editors per page
- Disable Tiptap's built-in `history` extension when using Liveblocks/Yjs
- Test collaboration with 3+ simultaneous users before launch

**Warning signs:**
- Text disappears or duplicates when multiple users edit
- Console shows Yjs synchronization errors without user notification
- Document becomes read-only unexpectedly
- Different users see different versions of same content

**Phase responsibility:** Phase 1 (Editor) - foundational collaboration infrastructure

---

### 1.3 Feature Creep & Bloat

**What goes wrong:**
- Interface cluttered with too many formatting options
- Launch time increases from <1s to >5s
- Users spend more time navigating features than writing
- Codebase becomes unmaintainable; security surface expands

**Why it happens:**
- Pressure to compete with Google Docs/Notion feature parity
- Each update adds "just one more" formatting option
- No disciplined pruning of unused features
- Marketing-driven feature additions over user needs

**How to avoid:**
- Start with minimal formatting: Bold, Italic, Headings, Lists, Links, Code blocks
- Hide advanced options behind slash commands (e.g., `/table`, `/quote`)
- Implement usage analytics; remove features with <5% adoption after 6 months
- Follow TipTap's headless philosophy: no default UI, build only what's needed
- Limit toolbar to <10 visible options; group others in menus
- Conduct quarterly "feature audits" to deprecate low-value options

**Warning signs:**
- Toolbar spans multiple rows or requires scrolling
- User onboarding takes >2 minutes to explain formatting
- Users complain about "too many buttons" in feedback
- New features take >2 weeks to implement due to complexity

**Phase responsibility:** Phase 1 (Editor) - design minimal feature set upfront

---

### 1.4 Mobile/Responsive Issues

**What goes wrong:**
- Typing lag on mobile devices (iOS/Android)
- Keyboard covers editor input area
- Touch gestures interfere with text selection
- Performance degrades severely on phones vs desktop

**Why it happens:**
- Mobile browsers have less memory and slower CPUs
- iOS keyboard autocorrect causes re-renders on every character
- Touch event handling conflicts with editor event listeners
- Heavy extensions (collaboration, AI) load even on mobile

**How to avoid:**
- Detect mobile devices; disable heavy extensions (collaboration, AI suggestions)
- Use `viewport-fit=cover` meta tag for iOS notch handling
- Test on physical devices (iPhone 12+, Pixel 6+), not just browser emulators
- Implement mobile-specific toolbar with fewer options
- Disable spellcheck on iOS (`spellcheck="false"`)
- Add 200-300px padding to bottom of editor for keyboard space
- Profile mobile performance; target 60fps during typing

**Warning signs:**
- Typing on phone feels "sluggish" or misses characters
- Keyboard hides text cursor; can't see what you're typing
- Text selection UI fights with native mobile selection
- Mobile browser shows "page unresponsive" warnings

**Phase responsibility:** Phase 1 (Editor) - test on mobile from day one

---

## 2. AI Chat with Memory Pitfalls

### 2.1 Generic Output Problem

**What goes wrong:**
- AI produces fluff instead of structured research content
- Writing style is conversational, not academic/formal
- Lacks empirical citations and specific references
- Hallucinates facts or references

**Why it happens:**
- Generic model fine-tuning, not research-specific
- Missing "audience" parameter (academic vs general public)
- No citation requirements enforced in system prompt
- Temperature too high (>0.3) for factual writing

**How to avoid:**
- Use system prompts tailored to research output: "Write in formal academic style with empirical citations"
- Set temperature ≤0.3 for factual content; allow higher only for synthesis
- Enforce citation format: "Source: [Author, Year]" or inline citations
- Implement RAG (Retrieval-Augmented Generation) to ground responses in actual sources
- Validate output contains structured elements: Introduction, Methods, Results, Discussion
- Use OpenAI's latest models (o1/GPT-4) with improved hallucination prevention
- Add post-processing: flag sentences without citations for user review

**Warning signs:**
- Users complain AI sounds "like ChatGPT, not a researcher"
- Output lacks section structure or citations
- Fact-checking reveals >10% hallucinated references
- Writing style varies wildly between sessions

**Phase responsibility:** Phase 2 (AI Chat)

---

### 2.2 Context Window & Retrieval Latency

**What goes wrong:**
- AI "forgets" earlier conversation after 10-20 messages
- Memory retrieval takes >5 seconds, breaking conversation flow
- Context window fills with irrelevant historical data
- Vector search returns stale or outdated information

**Why it happens:**
- RAG retrieves too many chunks (20+) causing bloat
- No context compression or summarization of old messages
- Vector database queries unoptimized; missing indexes
- Cache invalidation not triggered when documents update

**How to avoid:**
- Implement Anthropic's Contextual Retrieval (prepend document context to chunks before embedding)
- Use retrieval with reranking: fetch 150 chunks, rerank to top 20
- Set context window limit: keep last 10 messages + retrieved chunks
- Implement prompt caching (Claude/Anthropic) to reduce latency by >2x
- Use vector database with HNSW indexes (pgvector, Pinecone, Weaviate)
- Cache frequently accessed chunks (user profile, project context)
- Add loading indicators for retrieval operations >500ms
- Set strict 5-second timeout on memory retrieval; fail gracefully if exceeded

**Warning signs:**
- AI asks "Wait, what were we discussing?" after 15 messages
- Chat interface shows spinner for >3 seconds before each response
- Same question gets different answers in same conversation
- Retrieved citations reference outdated document versions

**Phase responsibility:** Phase 2 (AI Chat)

---

### 2.3 Privacy & Data Storage

**What goes wrong:**
- User research data stored indefinitely without consent
- Sensitive topics exposed in logs or monitoring
- No distinction between ephemeral chat and persistent artifacts
- Export/delete functionality missing or broken

**Why it happens:**
- Chat logs stored for "analytics" without user awareness
- No data retention policy implemented
- Conversations treated same as research artifacts
- Rushed MVP without privacy controls

**How to avoid:**
- Implement artifact-first memory: only save content explicitly added to workspace
- Provide ephemeral mode: messages discarded after session (toggle in UI)
- Add "Clear chat history" button with confirmation
- Auto-delete chat logs after 90 days by default (configurable)
- Store chat separately from research artifacts in database schema
- Allow users to export all data (GDPR compliance)
- Never log chat content in error tracking or analytics

**Warning signs:**
- No clear data retention policy in privacy policy
- Chat history shows months-old conversations without delete option
- User can't distinguish between temporary chat and saved research
- Error monitoring services暴露 sensitive research topics in public dashboards

**Phase responsibility:** Phase 2 (AI Chat)

---

## 3. Data Analysis Execution Pitfalls

### 3.1 Sandbox Escape Vulnerabilities

**What goes wrong:**
- User code executes commands on host system
- Docker container breakout via privileged flags
- Malicious code accesses network or filesystem
- WebAssembly sandboxes bypassed (CVE-2025-68668 in n8n)

**Why it happens:**
- Docker alone is insufficient for true sandboxing
- Containers run as root or with excessive capabilities
- No network isolation or resource limits
- Missing security audits of container configuration

**How to avoid:**
- Use defense in depth: Docker + gVisor/firecracker + seccomp filters
- Never run containers as root; use non-privileged user
- Drop all capabilities; add only specific ones needed
- Enable user namespace remapping (`--userns-remap`)
- Restrict network with `--network=none` for untrusted code
- Set read-only filesystem (`--read-only`) with tmpfs for `/tmp`
- Implement CPU/memory limits: `--cpus=1`, `--memory=1g`
- Use security scanning (Docker Bench, Trivy) before deployment
- Follow [CVE-2025-68668](https://www.smartkeyss.com/post/cve-2025-68668-breaking-out-of-the-python-sandbox-in-n8n) lessons: validate all inputs to WASM sandboxes

**Warning signs:**
- Containers run with `--privileged` flag
- Docker daemon exposes socket to execution environment
- No resource limits set (`docker inspect` shows no CPU/memory constraints)
- Security audit never performed on container setup

**Phase responsibility:** Phase 3 (Analysis) - critical before production deployment

---

### 3.2 Resource Exhaustion

**What goes wrong:**
- Infinite loop consumes 100% CPU, freezing system
- Memory leak crashes server (OOM killer)
- Disk space exhausted by large datasets or outputs
- Network abuse: crypto mining, spam requests

**Why it happens:**
- No execution timeout or memory limits
- Infinite loops not detected (while True, recursion)
- Large files uploaded without size validation
- No rate limiting on execution requests

**How to avoid:**
- Enforce strict 30-second timeout for user code execution
- Set memory limits: 512MB-1GB per execution
- Kill processes exceeding CPU time (use `timeout` command or cgroups)
- Limit upload size: 100MB for CSV, 500MB for other files
- Implement rate limiting: 10 executions per minute per user
- Use cgroups v2 to isolate resource usage per container
- Monitor resource usage; alert if >80% sustained usage
- Provide progress bars for long-running operations (>5 seconds)

**Warning signs:**
- Server load average spikes during code execution
- Docker stats show containers using >100% CPU (multi-core abuse)
- Memory usage grows monotonically until OOM kill
- No timeout implemented (code runs forever in theory)

**Phase responsibility:** Phase 3 (Analysis)

---

### 3.3 Result Caching & Stale Visualizations

**What goes wrong:**
- Visualizations show outdated data after source updates
- Cache never invalidates; users see wrong charts
- Multiple users see different cached versions
- No indication of data freshness or last-updated time

**Why it happens:**
- Cache keys don't include data version or hash
- No cache invalidation on file upload or edit
- Redis/database cache TTL set too high (24+ hours)
- Frontend caches responses indefinitely

**How to avoid:**
- Include data hash in cache key (MD5 of file contents)
- Invalidate cache on file upload, edit, or delete
- Set cache TTL: 5-15 minutes for analysis results
- Show "Last updated: X minutes ago" timestamp on visualizations
- Implement cache busting: append `?v={hash}` to visualization URLs
- Use ETag headers for HTTP caching
- Provide "Refresh" button to force cache invalidation
- Monitor cache hit rate; alert if <70% (indicates over-aggressive invalidation)

**Warning signs:**
- Uploading new data doesn't change visualization
- Different users see different results for same analysis
- No timestamp visible on charts/tables
- Redis memory grows monotonically (cache never evicted)

**Phase responsibility:** Phase 3 (Analysis)

---

### 3.4 Dependency Hell

**What goes wrong:**
- Python packages conflict (pandas 2.x vs 1.x)
- R packages not available or fail to install
- Environment not reproducible; code works locally but not in production
- Security vulnerabilities in dependencies

**Why it happens:**
- No dependency locking (requirements.txt without versions)
- Global package installation instead of virtual environments
- Mixing Python 3.10 and 3.11 code
- No security scanning of dependencies

**How to avoid:**
- Use UV (ultra-fast package manager) or Poetry for dependency management
- Pin exact versions in requirements.lock or poetry.lock
- Create isolated environment per execution (Docker image baked with dependencies)
- Support Python 3.11 only; avoid supporting multiple versions
- Pre-install common packages (pandas, numpy, matplotlib, scipy) in base image
- Use `pip-audit` or `safety` to scan for vulnerabilities
- Document all available packages with versions in user guide
- Provide template notebooks with working import examples

**Warning signs:**
- `requirements.txt` has unpinned versions (`pandas>=1.0`)
- Code uses `pip install` at runtime instead of pre-installed packages
- Import errors in production but not local environment
- No documentation of available packages

**Phase responsibility:** Phase 3 (Analysis) - finalize environment spec before launch

---

## 4. File Management Pitfalls

### 4.1 Upload Limits & Timeouts

**What goes wrong:**
- Large file uploads (>100MB) fail with timeout errors
- Progress bar shows 100% but file never arrives
- CDN/proxy limits block uploads
- Network interruptions cause partial uploads with no recovery

**Why it happens:**
- Server timeouts too short (10 seconds default)
- Single-upload instead of chunked/multipart upload
- No resumable upload support
- Reverse proxy (nginx, Traefik) limits lower than application

**How to avoid:**
- Implement chunked uploads: split files into 5-10MB chunks
- Allow at least 5-minute timeout for large file uploads
- Provide resumable uploads (track uploaded chunks, resume on failure)
- Bypass CDN for uploads; upload directly to backend/cloud storage
- Use streaming I/O (don't load entire file into memory)
- Configure reverse proxy limits: `client_max_body_size 500M` (nginx)
- Show progress bar with percentage and ETA
- Support upload via URL (import from S3, Google Drive)

**Warning signs:**
- Uploads fail consistently for files >50MB
- No progress indication during upload
- Browser shows "ERR_CONNECTION_RESET" during upload
- Error logs show timeout errors (504 Gateway Timeout)

**Phase responsibility:** Phase 1 (Editor) - for document uploads, Phase 3 (Analysis) - for data files

---

### 4.2 Storage Scalability & Cost

**What goes wrong:**
- Storage costs explode with user growth (S3 bills $1000+/month)
- Backup/restore takes hours with millions of files
- No cold storage strategy; old files cost same as new
- Metadata queries become slow (listing all user files)

**Why it happens:**
- No lifecycle rules (files never moved to cold storage)
- Expensive storage tier used for all files (S3 Standard vs Glacier)
- No file deduplication (duplicate uploads stored separately)
- Database stores file metadata without indexes

**How to avoid:**
- Implement S3 lifecycle rules: move to Glacier after 90 days
- Use cheaper tiers for large files (S3 Intelligent Tiering)
- Deduplicate files by hash (MD5/SHA256); store one copy with references
- Set file size limits: 100MB for user uploads, 500MB for enterprise
- Store metadata in PostgreSQL with indexes on `user_id`, `created_at`
- Monitor storage costs weekly; set budget alerts
- Provide download manager for bulk exports (zip files)
- Archive old projects (>1 year inactive) to cold storage

**Warning signs:**
- No lifecycle rules configured in cloud storage
- Same file uploaded multiple times stored separately
- Database query `SELECT * FROM files WHERE user_id = ?` takes >1 second
- No monitoring of storage costs

**Phase responsibility:** Phase 1 (Editor) - design storage architecture before launch

---

### 4.3 Metadata Extraction Failures

**What goes wrong:**
- PDF metadata (author, title, year) missing or incorrect
- File type mismatches (malicious .exe renamed to .pdf)
- Text extraction fails for scanned PDFs (no OCR)
- Thumbnails not generated for previews

**Why it happens:**
- Relying on filename extension instead of magic bytes
- No OCR for scanned documents
- Metadata parsers fail on malformed PDFs
- No validation of file contents

**How to avoid:**
- Use python-magic or file command to detect real file type
- Implement OCR for PDFs without extractable text (Tesseract OCR)
- Store metadata separately; allow manual editing
- Generate thumbnails for images, PDFs, documents
- Validate file headers match extension (reject mismatches)
- Extract text in background job; show "Processing..." status
- Provide manual metadata editing UI

**Warning signs:**
- All PDFs show "Unknown Author" in metadata
- Scanned PDFs show 0 words extracted
- File upload accepts any extension without validation
- No thumbnails shown in file browser

**Phase responsibility:** Phase 1 (Editor) - for research papers, Phase 3 (Analysis) - for data files

---

## 5. Information Graph Pitfalls

### 5.1 Query Performance

**What goes wrong:**
- Graph traversal queries take >10 seconds
- Recursive queries cause exponential slowdown
- Database CPU spikes during graph operations
- UI freezes while loading graph visualization

**Why it happens:**
- Recursive CTEs not optimized with indexes
- No query result caching
- Graph depth unlimited (traverses entire database)
- PostgreSQL used as graph database without extensions

**How to avoid:**
- Use Apache AGE (PostgreSQL graph extension) for complex graphs
- Add indexes on `entity_id`, `relation_type`, `source_id`, `target_id`
- Limit recursion depth to max 5 levels
- Cache frequent graph queries (Redis with 5-minute TTL)
- Use materialized paths for hierarchical data
- Implement pagination for graph results (limit 1000 nodes)
- Profile queries with `EXPLAIN ANALYZE`; target <500ms for traversals
- Consider dedicated graph database (Neo4j) if >1M relationships

**Warning signs:**
- `EXPLAIN ANALYZE` shows sequential scans on large tables
- Recursive CTE takes >1 second for depth >3
- No indexes on foreign keys used in graph queries
- Graph visualization loads progressively (slow trickle of nodes)

**Phase responsibility:** Phase 3 (Analysis) - if implementing information graph features

---

### 5.2 Relationship Ambiguity

**What goes wrong:**
- Unclear what counts as a "claim" vs "fact" vs "citation"
- Relationships oversimplified (e.g., all papers "cite" each other)
- No distinction between direct and indirect relationships
- Ambiguous edge labels (e.g., "related to" could mean anything)

**Why it happens:**
- No ontology or schema defined for graph relationships
- Automated extraction produces noisy, low-confidence edges
- User confusion about graph semantics
- Missing confidence scores on relationships

**How to avoid:**
- Define clear ontology: Entity types (Paper, Claim, Citation, Author) and relationship types
- Add confidence scores to edges (0-1); allow filtering by threshold
- Use specific relationship types: "cites", "refutes", "extends", "uses_method_from"
- Distinguish between weak and strong evidence (edge weights)
- Provide UI to explain relationship: "Paper A cites Paper B (2021)"
- Validate extracted relationships with user feedback loop
- Document ontology in user guide; show legend in graph UI

**Warning signs:**
- All relationships have same type or label
- No confidence scores visible on edges
- Users confused about graph meaning in usability testing
- Relationship extraction uses heuristics without validation

**Phase responsibility:** Phase 3 (Analysis) - if implementing advanced features

---

### 5.3 UI Complexity & Overwhelming Visualizations

**What goes wrong:**
- Graph shows thousands of nodes, becomes unreadable
- Users can't find relevant information in visual clutter
- Force-directed layouts produce "hairball" visualizations
- No filtering or search functionality

**Why it happens:**
- Attempting to show entire graph at once
- No default view or "starting point" for exploration
- Missing interactive controls (zoom, filter, search)
- Over-ambitious feature set

**How to avoid:**
- Show focused subgraph by default (e.g., current paper + 20 related)
- Implement progressive disclosure: start simple, add detail on demand
- Provide search: highlight nodes matching query
- Add filters: by relationship type, date range, confidence
- Use hierarchical layout for large graphs
- Limit displayed nodes to <100 by default
- Provide "expand" button to add related nodes incrementally
- Show legend explaining node colors, edge types

**Warning signs:**
- Graph visualization takes >5 seconds to render
- Users say "I can't make sense of this" in testing
- No way to filter or search the graph
- Thousands of nodes visible on initial load

**Phase responsibility:** Phase 3 (Analysis) - if implementing information graph features

---

## Cross-Cutting Pitfalls

### Monitoring & Observability

**What goes wrong:**
- No visibility into production issues until users complain
- Can't reproduce performance problems
- No alerting on resource exhaustion or errors
- Logs not structured or searchable

**How to avoid:**
- Implement structured logging (JSON format) from day one
- Add metrics: latency (p50, p95, p99), error rates, resource usage
- Set up alerts: >5% error rate, >1s latency, >80% CPU/memory
- Use application performance monitoring (APM): Sentry, DataDog, New Relic
- Log all user operations with correlation IDs
- Dashboard for key metrics: active users, executions, storage, costs
- Conduct weekly review of errors and performance

**Phase responsibility:** Phase 1 (Editor) - foundational infrastructure

---

### Testing & Quality Assurance

**What goes wrong:**
- Only unit tests, no integration or E2E tests
- No load testing before launch
- Mobile/responsive testing skipped
- Accessibility (a11y) not considered

**How to avoid:**
- Write E2E tests for critical paths: editor typing, file upload, code execution
- Load test with simulated users (100 concurrent) before launch
- Test on physical mobile devices (iPhone, Android) not just emulators
- Run Lighthouse audits; target >90 score on performance, a11y
- Test with screen readers (VoiceOver, NVDA) for accessibility
- Implement automated visual regression tests (Percy, Chromatic)
- Conduct usability testing with 5+ real users before launch

**Phase responsibility:** All phases - test incrementally, not just at end

---

## Confidence Assessment

| Domain | Confidence | Reason |
|--------|------------|--------|
| Rich text editor performance | HIGH | Multiple 2025 sources document TipTap issues; verified with official docs |
| AI chat generic output | HIGH | 2025 research on hallucination prevention; RAG best practices well-established |
| Sandbox security | HIGH | CVEs from 2025 (n8n, Docker); Docker security best practices documented |
| File upload timeouts | HIGH | 2025 industry practices (Box 500GB limit, multipart uploads) |
| Graph query performance | HIGH | PostgreSQL recursive CTE optimization documented 2025 |
| Feature creep (editors) | MEDIUM | Qualitative data from product discussions; less measurable |
| Mobile typing lag | MEDIUM | Limited specific data on rich text mobile performance; inferred from iOS issues |
| Memory retrieval latency | HIGH | Contextual Retrieval (Anthropic 2024) addresses this directly |

---

## Sources

### Primary (HIGH confidence)
- [TipTap Best Practices (Liveblocks)](https://liveblocks.io/docs/guides/tiptap-best-practices-and-tips) - Official collaboration guide
- [Contextual Retrieval (Anthropic, Sep 2024)](https://www.anthropic.com/news/contextual-retrieval) - Memory system optimization
- [CVE-2025-68668: n8n Sandbox Escape](https://www.smartkeyss.com/post/cve-2025-68668-breaking-out-of-the-python-sandbox-in-n8n) - Sandbox security vulnerabilities
- [PostgreSQL Graph Database Guide (PuppyGraph, March 2025)](https://www.puppygraph.com/blog/postgresql-graph-database) - Query performance
- [Handling Large File Uploads (Uploadcare)](https://uploadcare.com/blog/multipart-file-uploads-scaling-large-file-transfers/) - File upload best practices

### Secondary (MEDIUM confidence)
- [Best Rich Text Editor for React 2025 (Dev.to)](https://dev.to/codeideal/best-rich-text-editor-for-react-in-2025-3cdb) - Editor comparison
- [Context Window Management Strategies (Maxim.ai, Nov 2025)](https://www.getmaxim.ai/articles/context-window-management-strategies-for-long-context-ai-agents-and-chatbots/) - AI memory optimization
- [Stale Data: How to Identify, Prevent, and Overcome (QuadraticHQ, Feb 2025)](https://www.quadratichq.com/blog/stale-data-how-to-identify-prevent-and-overcome-data-decay) - Cache invalidation
- [Python Tooling in 2025 (Leah Wasser)](https://www.leahwasser.com/blog/2025/2025-09-15-reproducibility-python-environments/) - Dependency management

### Tertiary (LOW confidence - needs validation)
- Notepad 2025 feature creep discussions (WindowsForum.com, Reddit) - Qualitative user feedback
- Mobile typing lag reports (iPhone keyboard videos) - Anecdotal, not research-specific

---

## Open Questions

1. **Mobile-specific rich text performance:** Limited concrete data on rich text editor mobile optimization. Recommendation: test early on physical devices, not just emulators.

2. **Information graph scalability:** Research Pilot may defer advanced graph features to post-MVP. If implemented, consider dedicated graph database (Neo4j) instead of PostgreSQL for >1M relationships.

3. **AI research writing quality:** Limited metrics for what constitutes "good" research writing. Recommendation: implement user feedback loops and quality scoring.

---

## Implementation Priority by Phase

**Phase 1 (Editor):**
- TipTap performance optimization (debouncing, spellcheck, lazy loading)
- Collaboration infrastructure (content validation, Yjs setup)
- Minimal feature set design (avoid bloat from start)
- Mobile testing and responsive design
- File upload chunking and timeout handling
- Storage architecture (lifecycle rules, deduplication)

**Phase 2 (AI Chat):**
- Research-specific system prompts (academic style, citations)
- RAG implementation with contextual retrieval
- Memory architecture (artifact-first, ephemeral mode)
- Cache invalidation strategy

**Phase 3 (Analysis):**
- Docker sandbox hardening (defense in depth)
- Resource limits and timeouts (CPU, memory, execution time)
- Dependency environment (UV or Poetry, locked packages)
- Result caching with data hash-based invalidation
- Graph query optimization (if implementing)

---

**End of PITFALLS Analysis**
