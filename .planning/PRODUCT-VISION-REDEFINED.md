# Product Vision (Redefined)

**Date:** 2026-02-21

---

## One-Line Pitch

**A research writing tool where you choose: AI writes it, or you write it with AI help.**

---

## What It Is

A browser-based research paper generator with two modes:

| Mode | Who Drives? | User Inputs | Output |
|------|-------------|-------------|--------|
| **AI-First** | AI | Topic, output type, audience | Complete paper with citations |
| **Human-First** | You | Write in editor, ask AI for help | Your paper, AI-assisted |

**Both modes share:**
- Your research files (PDFs, data, code, docs)
- Literature search
- Citation management
- Project memory

---

## Why This Exists

**The problem:** Researchers today use 5+ disconnected tools:
- Google Docs (writing)
- ChatGPT (brainstorming)
- Zotero (citations)
- Semantic Scholar (literature)
- Jupyter/Colab (analysis)

**The solution:** One tool that handles all of it, with AI available however you want to use it.

---

## What It Does

### 1. Import Your Research
- Upload PDFs, datasets, code, notes
- Organize into projects
- Everything stays in one place

### 2. Choose Your Mode

**AI-First Mode:**
```
You: "I need a literature review on adolescent mental health disparities in the US"
System: (asks clarifying questions)
You: "Academic audience, APA style, ~3000 words"
System: (searches literature, reads papers, extracts claims, writes review)
You: Review, edit, export
```

**Human-First Mode:**
```
You: (opens editor, starts writing)
You: "Find papers on this topic" → AI finds them
You: "Cite these papers in APA" → AI formats citations
You: "Analyze this dataset" → AI writes code, runs it, shows results
You: (export finished paper)
```

### 3. Export
- Download as PDF, DOCX, or LaTeX
- Citations formatted correctly (APA, MLA, Chicago)

---

## What It Is NOT

- ❌ Not a chatbot (chat is a tool, not the product)
- ❌ Not "another AI wrapper" — this has persistent project memory, file management, literature search
- ❌ Not just for writing — handles analysis, citations, literature too
- ❌ Not trying to replace researchers — it's a force multiplier

---

## Target Users

| Who | Problem | Solution |
|-----|---------|----------|
| **PhD students** | Overwhelmed by literature review | AI-first mode gets them 80% there |
| **Postdocs** | Need to write many papers | Human-first mode speeds up drafting |
| **Lab researchers** | Managing many projects | Project-based organization keeps things tidy |

---

## Competitive Positioning

| Product | What It Does | This Product |
|---------|--------------|--------------|
| **ChatGPT** | Chat, generates text | + project memory, + literature search, + citation management |
| **Notion** | Docs, databases | + AI paper generation, + literature integration |
| **Overleaf** | LaTeX writing | + AI assistance, + simpler interface |
| **Scrivener** | Long-form writing | + AI generation, + research integration |

**The wedge:** Combine paper generation WITH project management. Most tools do one or the other.

---

## Moat

If you're just "AI that writes papers" → ChatGPT will eat you.

**Defensible advantages:**

1. **Project-centric memory** — AI remembers everything across sessions (papers, findings, what you tried)
2. **Literature integration** — Real Semantic Scholar API, not web search garbage
3. **Citation correctness** — Proper formatting, not hallucinated references
4. **Analysis execution** — Actually runs code, shows results
5. **Workflow integration** — Upload → search → write → cite → analyze → export in one place

**The long-term moat:** Data network effects. The more research projects stored, the better the system gets at:
- Suggesting related papers
- Reusing analysis patterns
- Finding relevant prior work

---

## Vision Phases

### v1: The Wedge (What to ship now)
- AI-first paper generation (topic → literature review)
- Human-first editor with AI chat
- File upload and management
- Basic citation formatting
- Export to PDF/DOCX

### v2: Research Integration
- Deeper literature integration (claim extraction, synthesis)
- Analysis execution (run Python/R on uploaded data)
- Better project memory (findings, claims graph)

### v3: Collaboration
- Team workspaces
- Shared AI agents
- Peer review tools

---

## Simpler Description (For Landing Page)

**Headline:** AI That Writes Research Papers — Or Helps You Write Yours

**Subhead:** Upload your research. Choose AI-first or human-first mode. Export a finished paper.

**How it works:**
1. Upload your PDFs, data, and notes
2. Tell AI what you're writing (or just start writing)
3. Get a complete paper — or write one with AI help
4. Export formatted, cited, ready to submit

**For:** PhD students, postdocs, researchers who need to write more, faster.

---

## Key Metrics for Success

| Metric | Target | Why |
|--------|--------|-----|
| **Time to first draft** | < 10 min | If AI-first mode takes longer, it's broken |
| **Export rate** | > 60% | Most users should finish and export papers |
| **Return usage** | > 40% | Users should come back for next paper |
| **AI satisfaction** | > 4/5 | AI output should be genuinely useful |

---

## What This Means for Development

**Priorities for v1:**
1. AI-first mode actually works (topic → paper with real citations)
2. Editor is good enough to write in (not janky)
3. Export produces clean, properly formatted documents

**Defer to later:**
- Claim graphs
- Provenance tracking
- Complex agent orchestration
- Multi-user collaboration

**Philosophy:** Build the core loop end-to-end before adding complexity.

---

## Questions to Validate

Before committing to this vision:

1. **Is "AI writes papers" actually valuable?** Or do researchers want AI to help, not replace?
2. **Is the two-mode model confusing?** Should we pick ONE mode and own it?
3. **Is the wedge (generation + project management) strong enough?** Or are these separate problems?
4. **Will researchers trust AI-generated citations?** Hallucinated references would kill the product

---

## Next Step

User should review and answer:
- Does this capture what you want to build?
- What's missing?
- What's wrong?
- What should change?

Then we can update PROJECT.md and ROADMAP.md accordingly.
