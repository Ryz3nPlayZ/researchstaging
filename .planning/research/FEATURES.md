# Feature Research

**Domain:** Research Workspace Tools (Document Editors, AI Analysis, Research Platforms, AI Chat)
**Researched:** 2026-02-03
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Rich Text Formatting** | Basic text styling (bold, italic, headers, lists) is non-negotiable | LOW | TipTap provides this out of the box |
| **Auto-Save** | Users expect work to be saved automatically; losing work is unforgivable | MEDIUM | Requires debounced saves + conflict resolution |
| **Export Options** | Users need to get content out (PDF, Markdown, DOCX) | MEDIUM | Pandoc integration for format conversion |
| **Undo/Redo** | Standard editor behavior; users panic without it | LOW | TipTap includes history management |
| **Document Organization** | Folders or collections to organize multiple documents | LOW | Basic database queries + filtering |
| **Search Within Documents** | Finding content across files is essential | MEDIUM | Full-text search (PostgreSQL tsvector or external) |
| **File Upload** | Users need to bring their own files (PDFs, data, images) | MEDIUM | Multipart form handling + storage |
| **Basic Collaboration** | At minimum, share links to view/edit | HIGH | Real-time sync is complex; start with async sharing |
| **Version History** | Users need to revert mistakes or see changes | MEDIUM | Document versioning + diff view |
| **Citation Support** | For research work, inserting citations is fundamental | MEDIUM | @-mention style citations linking to sources |
| **Responsive UI** | Must work on different screen sizes | LOW | Tailwind responsive utilities |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Artifact-First AI Memory** | AI accesses all project artifacts (papers, analysis, drafts) without manual context loading | HIGH | Requires vector database + semantic search across artifacts |
| **Proposal-Based Interactions** | AI suggests actions (user approves) instead of executing blindly; builds trust | MEDIUM | Action proposal UI + approval workflow |
| **Hybrid Folder+Graph Organization** | Combines familiar folder structure with knowledge graph connections | HIGH | Database relationships + graph visualization |
| **End-to-End Data Analysis** | Upload dataset → AI writes Python/R → executes → shows results (all in one flow) | HIGH | Sandboxed code execution + result caching |
| **Provenance Inspector** | Click any output to see exactly what sources/produced it | MEDIUM | Artifact → task → input artifact tracing |
| **Research-Native Chat** | Chat sidebar that remembers all project context, not just conversation history | HIGH | Cross-session memory + entity extraction |
| **Reference Graph Visualization** | See how papers cite each other; discover connections | MEDIUM | D3.js or Cytoscape.js + citation data |
| **Live Preview Execution** | Watch analysis tasks run in real-time with progress indicators | MEDIUM | WebSocket updates + task status UI |
| **Multi-Format Artifact Support** | Not just documents: datasets, notebooks, visualizations, code | MEDIUM | Polymorphic artifact storage + preview |
| **Semantic Literature Search** | Find papers by meaning, not just keywords | MEDIUM | Embeddings + vector similarity search |
| **Citation Autocomplete** | Type "@" and search across all imported papers | LOW | Simple search + @-mention in TipTap |
| **Research Pipeline Templates** | Reusable research workflows (e.g., "systematic review") | MEDIUM | Task graph templates + parameterization |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Real-Time Multi-User Editing** | "Like Google Docs" | Extreme complexity (OT/CRDT); conflicts with research-as-pipeline model; out of scope for MVP | Async sharing + commenting; add real-time sync post-validation |
| **Conversational AI Mode** | "ChatGPT for research" | Violates core philosophy (execution > conversation); encourages aimless exploration; hard to trace | Proposal-based sidebar chat; structured AI interactions |
| **Full Git Integration** | "Version control for documents" | Git is not user-friendly for non-technical users; merge conflicts on text are messy | Custom version history with diff view; hide implementation details |
| **Mobile App** | "Research on the go" | High complexity; research work requires desktop anyway; low ROI | Responsive web UI suffices; native app post-PMF |
| **Social Features** | "Community of researchers" | Network effects require massive scale; distraction from core value | Focus on single-user productivity first |
| **Exotic AI Features** | "AI that writes for you" | Users mistrust fully autonomous writing; hallucinations; lack of control | AI proposes edits, user approves; transparent provenance |
| **Task Management Integration** | "Like Jira for research" | Bloat; most users have existing task tools | Research tasks are internal; don't expose full task management UI |
| **Video/Audio Analysis** | "Analyze lectures and talks" | Expensive (transcription APIs); niche use case | Focus on text/PDF analysis; add media later if validated |
| **Real-Time Web Browsing** | "Like Perplexity" | Flaky; costs money; not core to research execution | Static literature APIs (Semantic Scholar, arXiv) are more reliable |

## Feature Dependencies

```
[File Upload System]
    └──requires──> [Storage Backend]
                       └──requires──> [File Metadata Database]

[AI Chat Sidebar]
    └──requires──> [Artifact Memory System]
                       └──requires──> [Vector Embeddings + Search]
                          └──enhances──> [Data Analysis]

[Data Analysis]
    └──requires──> [Code Execution Environment]
                       └──requires──> [Sandboxed Runtime]
    └──requires──> [Dataset Upload]
                       └──requires──> [File Upload System]

[Document Editor]
    └──enhances──> [Citation Management]
                       └──requires──> [Literature Database]

[Reference Graph Visualization]
    └──requires──> [Citation Extraction]
                       └──requires──> [PDF Parsing + Reference List]

[Version History]
    └──requires──> [Document Storage with Versioning]
                       └──requires──> [Diff Algorithm]

[Real-Time Progress Updates]
    └──requires──> [WebSocket Server]
                       └──enhances──> [All Task-Based Features]
```

### Dependency Notes

- **File Upload System requires Storage Backend**: Cannot upload files without somewhere to put them (S3, local filesystem, or database BLOBs)
- **AI Chat Sidebar requires Artifact Memory System**: Without memory, chat is just another stateless ChatGPT clone; memory is the differentiator
- **Data Analysis requires Code Execution Environment**: Python/R code needs a runtime; Jupyter kernels or similar
- **Data Analysis requires Dataset Upload**: Can't analyze data that isn't uploaded
- **Document Editor enhances Citation Management**: Editor isn't useful for research without ability to cite sources
- **Reference Graph Visualization requires Citation Extraction**: Can't visualize citation graph without extracting citations from papers first
- **Version History requires Document Storage with Versioning**: Need to store multiple versions of documents
- **Real-Time Progress Updates requires WebSocket Server**: Cannot show live task progress without real-time communication
- **Artifact Memory System enhances Data Analysis**: AI that "remembers" previous analysis is much more effective
- **Multi-User Real-Time Collaboration conflicts with MVP Philosophy**: Real-time sync is complex and violates "research as pipeline" model; defer to post-MVP

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

#### Core Three (Writer + Chat + Analysis)

- [ ] **Writer (TipTap Editor)**
  - Rich text formatting (bold, italic, headers, lists)
  - Auto-save every 30 seconds
  - Export to Markdown and PDF
  - Citation autocomplete (@-mention papers)
  - Undo/redo history
  - Basic version history (save on every major edit)
  - Why essential: Users must write and edit research documents; editor quality is judged against Google Docs

- [ ] **Chat Sidebar (AI Agent)**
  - Fixed sidebar panel (not centered like ChatGPT)
  - Cross-session memory (remembers all project context)
  - Proposal-based interactions (AI suggests, user approves)
  - Access to all project artifacts (papers, analysis, drafts)
  - Citation-aware responses (can reference specific sources)
  - Why essential: AI assistance without losing provenance; differentiator from "just another ChatGPT wrapper"

- [ ] **Data Analysis (End-to-End)**
  - File upload for datasets (CSV, JSON, Excel)
  - AI writes Python/R code based on natural language request
  - Sandboxed code execution
  - Result visualization (tables, plots)
  - Save analysis outputs as artifacts
  - Why essential: Completes the research loop; validates "AI-native research execution" vision

#### Supporting Features

- [ ] **File Management**
  - Drag-drop file upload
  - Folder organization
  - Basic file preview (PDFs, images, code)
  - Storage limits per user
  - Why essential: Users need to bring their own materials

- [ ] **Literature Integration**
  - Import papers from Semantic Scholar/arXiv
  - Store PDFs and metadata
  - Extract citations automatically
  - Searchable paper library
  - Why essential: Research requires literature; otherwise just a document editor

- [ ] **Progress Visibility**
  - Task list with status (pending/running/completed/failed)
  - Real-time updates via WebSockets
  - Artifact browser (see all generated outputs)
  - Why essential: Reinforces "research execution system" positioning; builds trust

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **Reference Graph Visualization** — Trigger: Users request "see how papers connect"
  - D3.js or Cytoscape.js interactive graph
  - Filter by citation count, theme, or date
  - Click to navigate to papers

- [ ] **Advanced Export Formats** — Trigger: Users request "export to Word/LaTeX"
  - DOCX export via Pandoc
  - LaTeX export with BibTeX
  - HTML export with styling

- [ ] **Collaboration Features** — Trigger: Users ask "can I share this?"
  - Share links with view/edit permissions
  - Comments on documents
  - Activity feed

- [ ] **Semantic Search** — Trigger: Users find keyword search insufficient
  - Vector embeddings for papers and notes
  - Search by meaning ("find papers about adolescent depression")
  - Hybrid keyword + semantic search

- [ ] **Research Templates** — Trigger: Users repeat same workflows
  - Pre-built task graph templates
  - "Systematic Review" template
  - "Meta-Analysis" template
  - Custom template creation

- [ ] **Note-Taking System** — Trigger: Users want "scratchpad" within tool
  - Markdown notes linked to papers
  - Highlight and annotate PDFs
  - Notes connect to knowledge graph

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Real-Time Multi-User Editing** — Defer: Extreme complexity; low demand initially
  - Operational Transformation or CRDTs
  - User presence indicators
  - Conflict resolution UI

- [ ] **Native Mobile Apps** — Defer: Research is desktop-first; mobile is nice-to-have
  - iOS and Android apps
  - Offline viewing
  - Mobile-optimized editor

- [ ] **Advanced Collaboration** — Defer: Requires team usage patterns
  - Real-time cursors
  - Voice/video chat
  - Team workspaces

- [ ] **Marketplace/Integrations** — Defer: Requires large user base
  - Third-party integrations (Zotero, Mendeley)
  - Custom plugins
  - API for extensions

- [ ] **AI Training on User Data** — Defer: Privacy concerns; unclear value prop
  - Fine-tune models on user's writing style
  - Custom citation patterns
  - Personalized research recommendations

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Rich Text Editor (TipTap) | HIGH | LOW | P1 |
| Auto-Save | HIGH | MEDIUM | P1 |
| Export (PDF/MD) | HIGH | MEDIUM | P1 |
| Citation Management | HIGH | MEDIUM | P1 |
| File Upload | HIGH | MEDIUM | P1 |
| AI Chat with Memory | HIGH | HIGH | P1 |
| Data Analysis (code execution) | HIGH | HIGH | P1 |
| Version History | MEDIUM | MEDIUM | P1 |
| Search Within Documents | MEDIUM | MEDIUM | P2 |
| Progress Visibility (WebSocket) | MEDIUM | MEDIUM | P1 |
| Reference Graph Visualization | MEDIUM | HIGH | P2 |
| Semantic Search | MEDIUM | HIGH | P2 |
| Collaboration (sharing/comments) | MEDIUM | HIGH | P2 |
| Research Templates | LOW | MEDIUM | P2 |
| Note-Taking System | LOW | MEDIUM | P3 |
| Real-Time Multi-User Editing | MEDIUM | VERY HIGH | P3 |
| Native Mobile Apps | LOW | VERY HIGH | P3 |
| Marketplace/Integrations | LOW | VERY HIGH | P3 |

**Priority key:**
- **P1**: Must have for launch (blocks value validation)
- **P2**: Should have, add when possible (enhances value)
- **P3**: Nice to have, future consideration (post-PMF)

## Competitor Feature Analysis

| Feature | Google Docs | Notion | Obsidian | Overleaf | Cursor IDE | Replit | Jupyter | Our Approach |
|---------|-------------|--------|----------|----------|------------|--------|---------|--------------|
| **Rich Text Editing** | WYSIWYG editor | Block-based editor | Markdown | LaTeX editor | Code editor | Code editor | Notebook cells | TipTap (WYSIWYG + Markdown) |
| **Auto-Save** | Continuous | Continuous | Manual (plugins) | Continuous | Manual | Continuous | Manual | Debounced (30s) |
| **Export** | PDF, DOCX, HTML | PDF, HTML, MD | PDF, HTML | PDF | N/A | N/A | PDF, HTML | PDF, MD via Pandoc |
| **Version History** | Named versions | Page history | Git-based | History | Git | Git | Manual | Custom versioning with diff |
| **Collaboration** | Real-time multi-user | Real-time multi-user | Real-time (plugins) | Real-time | None | Real-time | Async (sharing) | Async sharing first; real-time post-MVP |
| **AI Integration** | Gemini AI | Notion AI | None (plugins) | None | Native AI chat | Replit AI | Jupyter AI | Proposal-based sidebar with memory |
| **Citation Management** | Manual | Manual | Manual (plugins) | Integrated | N/A | N/A | N/A | @-mention citations linked to literature DB |
| **Data Analysis** | None | None | None | None | N/A | Yes | Yes | End-to-end: upload → AI writes code → execute → visualize |
| **Code Execution** | None | None | Plugins | None | Yes | Yes | Yes | Sandboxed Python/R kernels |
| **Literature Integration** | None | None | Manual | Manual | N/A | N/A | N/A | Semantic Scholar, arXiv APIs + PDF storage |
| **Reference Graph** | None | None | Graph plugins | None | N/A | N/A | N/A | Built-in citation extraction + visualization |
| **Provenance Tracking** | None | None | None | None | N/A | N/A | N/A | Artifact → task → input artifact tracing (core differentiator) |
| **Memory System** | None | None | None | None | Context window | Context window | Context window | Cross-session artifact memory (total recall) |

### Key Insights from Competitor Analysis

1. **Document Editors (Google Docs, Notion, Obsidian, Overleaf)**
   - Strength: Excellent editing experiences
   - Gap: No native research workflows; citations are manual; no AI memory
   - Our opportunity: Research-native editor with integrated citations + AI memory

2. **AI Coding Tools (Cursor, Replit)**
   - Strength: Deep AI integration with codebase context
   - Gap: Not designed for research writing; no citation management
   - Our opportunity: Apply Cursor-style context awareness to research artifacts

3. **Data Analysis (Jupyter, Replit)**
   - Strength: Code execution + visualization
   - Gap: Steep learning curve; no AI assistance; manual coding required
   - Our opportunity: AI writes analysis code; users just describe what they want

4. **Research Platforms (Overleaf, Zotero, Authorea)**
   - Strength: Academic workflows; citation management
   - Gap: No AI; clunky interfaces; not "AI-native"
   - Our opportunity: Modern AI-native research execution with full provenance

5. **AI Chat Tools (ChatGPT, Claude, Perplexity)**
   - Strength: Powerful conversational AI
   - Gap: Stateless; no persistent artifacts; no provenance
   - Our opportunity: Artifact-first memory; everything is traceable

## Sources

### Primary (HIGH confidence)
- [Cursor Features Page](https://cursor.sh/features) - Verified AI code editor capabilities (Tab, Chat, Ctrl K, codebase context)
- [Notion Help Center](https://www.notion.so/help) - Verified Notion's feature set (databases, blocks, collaboration)
- [Obsidian Documentation](https://help.obsidian.md/obsidian) - Verified Obsidian's markdown and plugin architecture

### Secondary (MEDIUM confidence)
- [Obsidian vs Notion: The Ultimate Comparison Guide for 2025](https://photes.io/blog/posts/obsidian-vs-notion) - Feature comparison verified with official docs
- [Notion vs Obsidian – All Features Compared (2026)](https://productive.io/blog/notion-vs-obsidian/) - Confirmed collaboration and database features
- [Google Docs Features 2025](https://www.google.com/docs/about/) - Collaboration, version control, formatting (from search results)
- [Overleaf Collaboration Features](https://www.overleaf.com/blog/tagged/collaboration) - Real-time LaTeX editing
- [Zotero vs Authorea comparison](https://www.techrxiv.org/users/3/articles/168475-zotero-vs-authorea) - Reference management vs collaborative writing
- [Manubot Open Collaborative Writing](https://journals.plos.org/ploscompbiol/article/file?id=10.1371/journal.pcbi.1007128&type=printable) - Markdown + Git workflow for research

### Tertiary (LOW confidence - marked for validation)
- [ChatGPT Memory Features 2025](https://www.robertodiasduarte.com.br/en/guia-completo-2025-para-dominar-o-gerenciamento-de-memoria-no-chatgpt/) - Memory rollout timeline (verify with OpenAI docs)
- [Claude Context Window 2025](https://sparkco.ai/blog/mastering-claudes-context-window-a-2025-deep-dive) - Context window size claims (verify with Anthropic docs)
- [Perplexity Memory Features](https://www.perplexity.ai/help-center/en/articles/10968016-memory) - Beta feature; needs validation
- [Research Workspace Tools Survey](https://www.linkedin.com/pulse/ultimate-research-productivity-tools-list-2025-nandyala-phd-c9kwf) - General overview; cross-verify with specific tool docs

## Metadata

**Confidence breakdown:**
- Table stakes: HIGH - Direct observations from competitor products and official documentation
- Differentiators: HIGH - Grounded in MASTER_SOURCE_OF_TRUTH.md vision + validated against what competitors lack
- Anti-features: HIGH - Based on explicit MVP scoping in MASTER_SOURCE_OF_TRUTH.md + common startup failure patterns
- Feature dependencies: HIGH - Technical dependencies are well-understood
- MVP definition: HIGH - Directly derived from MASTER_SOURCE_OF_TRUTH.md MVP scope + milestone_context

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - research tools evolve moderately fast)

---

*Feature research for: AI-Native Research Workspace*
*Researched: 2026-02-03*
