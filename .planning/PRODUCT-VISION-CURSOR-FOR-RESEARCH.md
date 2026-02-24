# Product Vision: Cursor for Research

**Date:** 2026-02-21

---

## One-Liner

**Cursor for Research** — An AI-native research environment where AI knows your entire project and assists across every workflow, but you stay in control.

---

## What "Cursor for Research" Means

### What Cursor Does (for code)
- Deep understanding of your entire codebase
- AI writes code but you approve before it applies
- Context-aware: knows what you're working on
- Everything in one place — editor + AI + terminal
- Persistent state across sessions

### What This Product Does (for research)
- Deep understanding of your entire research project
- AI writes content but you stay in control
- Context-aware: knows your papers, findings, what you've tried
- Everything in one place — files + literature + writing + analysis
- Persistent memory across sessions

---

## The Core Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR RESEARCH PROJECT                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │  PDFs   │ │  Data   │ │  Notes  │ │ Papers  ││Findings │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      AI KNOWS EVERYTHING                     │
│  • Which papers discuss which topics                         │
│  • What findings you've extracted                            │
│  • What analyses you've run                                  │
│  • What you're currently writing about                       │
│  • Your citation style, preferences, research context        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      YOU WORK IN THE ENVIRONMENT             │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Editor (writing your paper)                         │    │
│  │                                                      │    │
│  │  "Add citation for this claim"                       │    │
│  │  → AI finds relevant papers from YOUR library        │    │
│  │                                                      │    │
│  │  "Summarize findings on adolescent depression"       │    │
│  │  → AI searches YOUR extracted findings               │    │
│  │                                                      │    │
│  │  "Write the methods section"                         │    │
│  │  → AI writes, pulls from YOUR uploaded papers        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Literature (your uploaded papers)                   │    │
│  │  → AI extracts claims, links to your writing         │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Analysis (your datasets, code, results)             │    │
│  │  → AI analyzes, creates visualizations              │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Files (everything in one place)                     │    │
│  │  → PDFs, data, code, notes, outputs                  │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## What Makes It Different

| vs ChatGPT | vs Notion | vs Zotero | vs Jenni AI |
|------------|-----------|-----------|------------|
| Remembers your project | Just a database | Just citations | Just generation |
| Real citations | No AI integration | No writing | No project memory |
| Everything integrated | No literature | No files | No analysis |
| You control output | Manual work | Manual work | Takes over |

**All four differentiators:**
- ✅ Real citations (linked to actual papers you uploaded)
- ✅ Persistent memory (AI knows your entire project)
- ✅ All-in-one (no tool switching)
- ✅ Simplicity (one environment, not 5 tools duct-taped)

---

## User Experience

### Starting a Project
```
You: "New project: adolescent mental health disparities"
System: Creates project
You: Upload 15 PDFs, 2 datasets, 5 notes
System: (extracts claims, indexes content, builds knowledge graph)
```

### Writing a Paper
```
You: (open editor, start writing introduction)
You: "find papers on this topic"
→ AI: shows 3 papers from YOUR library with relevant quotes
You: insert citation (automatically formatted)

You: "write the methods section based on my notes"
→ AI: drafts section, pulls from YOUR uploaded notes/papers
You: review and edit

You: "analyze this dataset for correlations"
→ AI: writes Python code, executes, shows results
You: save findings to project memory
```

### Asking Questions
```
You: "What have I written about social determinants?"
→ AI: summarizes YOUR writing + YOUR extracted findings

You: "Which papers support this claim?"
→ AI: shows YOUR papers with relevant quotes

You: "Generate a literature review on this topic"
→ AI: searches YOUR library + real literature API
→ writes review with real citations
→ you edit and export
```

---

## The AI Assistant

**Always available, never in the way:**
- Sidebar panel (expand/collapse)
- Context-aware suggestions
- Can take action OR just answer

**AI capabilities:**
| Capability | How It Works |
|------------|--------------|
| **Find papers** | Searches your library + Semantic Scholar API |
| **Extract findings** | Reads YOUR uploaded PDFs, pulls claims |
| **Write sections** | Generates content from YOUR sources |
| **Format citations** | APA/MLA/Chicago, linked to YOUR papers |
| **Analyze data** | Runs code on YOUR datasets, saves results |
| **Answer questions** | About YOUR project (papers, findings, writing) |

**AI behavior:**
- Shows you what it will do before doing it (for impactful actions)
- Cites sources for every claim
- Never hallucinates citations (links to real papers)
- Remembers everything across sessions

---

## Technical Core

### What Makes This Possible

1. **Vector database** — Your papers indexed and searchable
2. **Claim extraction** — Findings extracted from PDFs with provenance
3. **Knowledge graph** — Papers linked to findings linked to your writing
4. **LLM orchestration** — AI that can search, write, analyze, but always with context
5. **File storage** — Everything in one project space

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  • React editor (TipTap)                                     │
│  • Sidebar AI chat                                          │
│  • File explorer (drag-drop upload)                         │
│  • Literature view (your papers with extracted claims)      │
│  • Analysis view (code execution, results)                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      Project State Layer                     │
│  • Documents (what you're writing)                          │
│  • Memory (findings, claims, relationships)                 │
│  • Files (PDFs, data, code, notes)                          │
│  • Literature (indexed papers, extracted claims)            │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                         AI Services                          │
│  • LLM caller (multi-provider)                               │
│  • Vector search (semantic search your papers)              │
│  • Literature API (Semantic Scholar for new papers)         │
│  • Code execution (Python/R sandbox)                        │
│  • Citation formatter (APA/MLA/Chicago)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## What It Is NOT

- ❌ Not a chatbot — chat is one interface, not the product
- ❌ Not "AI writes your paper" — AI assists, you control
- ❌ Not just a wrapper around ChatGPT — deep project integration
- ❌ Not trying to replace you — it's a force multiplier
- ❌ Not another tool to integrate — it replaces your tool stack

---

## Why This Wins

| The Problem | The Solution |
|-------------|--------------|
| 5+ tools for research workflow | One environment |
| ChatGPT hallucinates citations | Real citations from your library |
| No continuity across sessions | Persistent project memory |
| AI doesn't know your context | AI knows everything |
| Switching tools kills flow | Everything in one place |

---

## Version 1: Ship This

**Core loop must work:**
1. Create project
2. Upload files (PDFs, data, docs)
3. Write paper with AI assistance
4. Search your library
5. Export properly formatted document

**AI capabilities (v1):**
- Chat with your papers
- Find relevant papers for what you're writing
- Draft sections based on your sources
- Format citations correctly
- Answer questions about your project

**Later (v2+):**
- Analysis execution
- Deeper knowledge graph
- Collaboration
- More advanced AI workflows

---

## Success Metrics

| Metric | Target | Why |
|--------|--------|-----|
| Time to first citation | < 2 min | Upload → find paper → insert |
| AI satisfaction | > 4/5 | AI output is genuinely useful |
| Weekly active usage | > 60% | Becomes primary research tool |
| Export rate | > 50% | Users finish and ship papers |

---

## The Pitch

**Headline:** Cursor for Research — AI-Native Research Environment

**Subhead:** Upload your research. AI knows your entire project and assists across every workflow. Export properly cited papers.

**For:** PhD students, postdocs, researchers who want to write faster with AI they can trust.

**Why:** Because research today means juggling 5+ tools. This brings everything into one AI-native environment.

---

## Next Questions

1. **Does "Cursor for Research" capture what you want to build?**
2. **Is the AI behavior right?** (shows before doing, cites sources, never hallucinates)
3. **What's the v1 scope?** (Can we ship without analysis execution?)
4. **What's the wedge?** (Literature review? General academic writing? Both?)

---

## Sources

- [2026 AI论文写作工具终极测评](https://post.m.smzdm.com/p/ax6qdmx9/)
- [Literature Review AI Tools - LSE](https://www.lse.ac.uk/DSI/AI/AI-Research/Literature-Review)
- [Jenni AI vs Paperpal Comparison](https://m.php.cn/faq/1964430.html)
- [Zotero-MDNotes Workflow](https://m.blog.csdn.net/gitblog_01189/article/details/15737378)
- [Elicit Research Capabilities](https://github.com/mijz73/ai-academic-writing-tools)
- [ResearchSphere End-to-End Workflow](https://www.cnblogs.com/lightsong/p/18896997)
