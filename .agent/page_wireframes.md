# Page Wireframes - Text Description
## Research Platform - All Pages

---

## 1. Waitlist Landing Page
**Route:** `/`

```
┌────────────────────────────────────────────────────────────┐
│                    FULL SCREEN HEIGHT                      │
│                                                            │
│        Background: Landscape + Helicopter Image            │
│              (Gradient overlay: dark → transparent)        │
│                                                            │
│                                                            │
│                    [Product Logo]                          │
│                                                            │
│                                                            │
│         Your AI-powered research companion that            │
│         turns ideas into peer-reviewed insights            │
│                                                            │
│                                                            │
│              ┌──────────────────────────┐                 │
│              │ email@example.com    [→] │                 │
│              └──────────────────────────┘                 │
│                                                            │
│                   Join the waitlist                        │
│                                                            │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘

Elements:
- Background image covers entire viewport
- Logo centered at top (20% from top)
- Tagline: Single sentence, large font, white text
- Email input: 400px wide, centered, white background
- Arrow button: Circular, attached to right of input
- "Join the waitlist" text below input (small, subtle)
```

---

## 2. Login Page
**Route:** `/login`

```
┌────────────────────────────────────────────────────────────┐
│                    FULL SCREEN HEIGHT                      │
│                                                            │
│        Background: Same Landscape + Helicopter             │
│                                                            │
│                                                            │
│                                                            │
│              ┌────────────────────────┐                   │
│              │                        │                   │
│              │   [Product Logo]       │                   │
│              │                        │                   │
│              │                        │                   │
│              │  ┌──────────────────┐  │                   │
│              │  │                  │  │                   │
│              │  │  [G] Continue    │  │                   │
│              │  │  with Google     │  │                   │
│              │  │                  │  │                   │
│              │  └──────────────────┘  │                   │
│              │                        │                   │
│              └────────────────────────┘                   │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘

Elements:
- Same background as waitlist
- Card: 400px wide, centered, glass morphism effect
- Logo inside card at top
- Google button: Full width within card, Google colors
- Card has subtle shadow and blur backdrop
```

---

## 3. Project Home (Empty State)
**Route:** `/projects`

```
┌────────────────────────────────────────────────────────────┐
│  [Logo]                                   [User Avatar ▾]  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                                                            │
│                                                            │
│                  [Friendly Illustration]                   │
│                   (Empty state graphic)                    │
│                                                            │
│                                                            │
│                 Ready to start researching?                │
│                                                            │
│                                                            │
│                  ┌──────────────────────┐                 │
│                  │  + Create New Project │                 │
│                  └──────────────────────┘                 │
│                                                            │
│                     ┌──────────────┐                      │
│                     │ Import Files │                      │
│                     └──────────────┘                      │
│                                                            │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘

Elements:
- Header: 60px height, logo left, user menu right
- Content centered vertically and horizontally
- Illustration: 200px x 200px
- Heading: Large, friendly text
- Create button: Primary style, prominent
- Import button: Secondary style, smaller
```

---

## 4. Project Home (With Projects)
**Route:** `/projects`

```
┌────────────────────────────────────────────────────────────┐
│  [Logo]  Projects                         [User Avatar ▾]  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              + Create New Project                    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Recent Projects                                           │
│  ┌────────────────────┐  ┌────────────────────┐          │
│  │ 📊 Superconductivity│  │ 🧬 Protein Folding │          │
│  │                    │  │                    │          │
│  │ Last edited:       │  │ Last edited:       │          │
│  │ 2 hours ago        │  │ Yesterday          │          │
│  │                    │  │                    │          │
│  │ 12 docs • 45 papers│  │ 5 docs • 23 papers │          │
│  │                    │  │                    │          │
│  │              [⋮]   │  │              [⋮]   │          │
│  └────────────────────┘  └────────────────────┘          │
│                                                            │
│  All Projects (8)                                          │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐            │
│  │Project │ │Project │ │Project │ │Project │            │
│  │   3    │ │   4    │ │   5    │ │   6    │            │
│  └────────┘ └────────┘ └────────┘ └────────┘            │
│  ┌────────┐ ┌────────┐                                   │
│  │Project │ │Project │                                   │
│  │   7    │ │   8    │                                   │
│  └────────┘ └────────┘                                   │
│                                                            │
└────────────────────────────────────────────────────────────┘

Elements:
- Header: Logo + "Projects" title + User menu
- Create button: Full width, dashed border, subtle
- Recent Projects: 2-column grid, larger cards
- All Projects: 4-column grid, smaller cards
- Each card: Emoji icon, title, metadata, three-dot menu
- Cards have hover effect (lift + shadow)
```

---

## 5. Project Workspace - Documents View
**Route:** `/project/:id/documents`

```
┌────────────────────────────────────────────────────────────┐
│  [Logo] Project Name                      [User Avatar ▾]  │
├──────────┬──────────────────────────────┬─────────────────┤
│          │                              │                 │
│ 📄 Docs  │  Documents                   │  AI Assistant   │
│          │                              │                 │
│ 📁 Files │  ┌────────────────────────┐  │  ┌───────────┐  │
│          │  │  + New Document        │  │  │ User: ... │  │
│ 📚 Lit   │  └────────────────────────┘  │  └───────────┘  │
│          │                              │                 │
│ 📊 Anal  │  ┌────────────────────────┐  │  ┌───────────┐  │
│          │  │ 📄 Introduction        │  │  │ AI: ...   │  │
│ 🕸️ Graph │  │ Last edited 5 min ago  │  │  └───────────┘  │
│          │  └────────────────────────┘  │                 │
│ ⚙️ Set   │                              │  ┌───────────┐  │
│          │  ┌────────────────────────┐  │  │ Type msg  │  │
│          │  │ 📄 Literature Review   │  │  └───────────┘  │
│          │  │ Last edited 2 hrs ago  │  │                 │
│          │  └────────────────────────┘  │  [Collapse →]   │
│          │                              │                 │
│          │  ┌────────────────────────┐  │                 │
│          │  │ 📄 Methodology         │  │                 │
│          │  │ Last edited Yesterday  │  │                 │
│          │  └────────────────────────┘  │                 │
│          │                              │                 │
└──────────┴──────────────────────────────┴─────────────────┘

Layout:
- Left sidebar: 200px wide, fixed
- Main canvas: Flexible width, scrollable
- Right AI panel: 350px wide, fixed, collapsible
- Header: 60px height, spans all columns

Sidebar:
- Navigation items stacked vertically
- Active item highlighted with background + left border
- Icons 20px, labels always visible

Main Canvas:
- "Documents" heading at top
- "+ New Document" button full width
- Document cards stacked vertically
- Each card: Icon, title, timestamp, hover effect

AI Panel:
- Header with title and collapse button
- Chat messages scrollable area
- Input at bottom, always visible
```

---

## 6. Project Workspace - Document Editor
**Route:** `/project/:id/document/:docId`

```
┌────────────────────────────────────────────────────────────┐
│  [Logo] Project Name                      [User Avatar ▾]  │
├──────────┬──────────────────────────────┬─────────────────┤
│          │                              │                 │
│ 📄 Docs  │  [← Back] Document Title     │  AI Assistant   │
│          │                              │                 │
│ 📁 Files │  [B][I][U][Link][Cite][H▾]   │  Context:       │
│          │                              │  "Introduction" │
│ 📚 Lit   │  ┌────────────────────────┐  │                 │
│          │  │                        │  │  ┌───────────┐  │
│ 📊 Anal  │  │ # Introduction         │  │  │ User:     │  │
│          │  │                        │  │  │ Help me   │  │
│ 🕸️ Graph │  │ This research explores │  │  │ rewrite   │  │
│          │  │ the relationship       │  │  │ this para │  │
│ ⚙️ Set   │  │ between temperature    │  │  └───────────┘  │
│          │  │ and superconductivity  │  │                 │
│          │  │ in hydride materials   │  │  ┌───────────┐  │
│          │  │ [1].                   │  │  │ AI: Here  │  │
│          │  │                        │  │  │ are 3     │  │
│          │  │ Recent studies have... │  │  │ options:  │  │
│          │  │                        │  │  │ 1. ...    │  │
│          │  │                        │  │  │ 2. ...    │  │
│          │  │                        │  │  │ 3. ...    │  │
│          │  │                        │  │  └───────────┘  │
│          │  │                        │  │                 │
│          │  └────────────────────────┘  │  ┌───────────┐  │
│          │                              │  │ Type...   │  │
│          │  ─────────────────────────   │  └───────────┘  │
│          │  References                  │                 │
│          │  [1] Smith et al. (2023).    │                 │
│          │      "Room-temperature..."   │                 │
│          │                              │                 │
└──────────┴──────────────────────────────┴─────────────────┘

Editor Area:
- Back button + editable title at top
- Formatting toolbar below title
- Main editor: WYSIWYG, Google Docs style
- Auto-save indicator in top right (not shown)
- Bibliography section at bottom, auto-generated

Toolbar:
- Bold, Italic, Underline buttons
- Link insertion
- Citation insertion
- Heading dropdown
- All buttons with icons

AI Panel:
- Shows current document context
- Suggestions specific to editing
- Can rewrite, suggest sources, improve text
```

---

## 7. Project Workspace - Files View
**Route:** `/project/:id/files`

```
┌────────────────────────────────────────────────────────────┐
│  [Logo] Project Name                      [User Avatar ▾]  │
├──────────┬──────────────────────────────┬─────────────────┤
│          │                              │                 │
│ 📄 Docs  │  Files                       │  AI Assistant   │
│          │  ┌────────────────────────┐  │                 │
│ 📁 Files │  │  📤 Upload Files       │  │  ┌───────────┐  │
│          │  └────────────────────────┘  │  │ User:     │  │
│ 📚 Lit   │                              │  │ Analyze   │  │
│          │  ┌────────────────────────┐  │  │ this CSV  │  │
│ 📊 Anal  │  │                        │  │  └───────────┘  │
│          │  │  Drag and drop files   │  │                 │
│ 🕸️ Graph │  │  here or click to      │  │  ┌───────────┐  │
│          │  │  browse                │  │  │ AI: I'll  │  │
│ ⚙️ Set   │  │                        │  │  │ create a  │  │
│          │  └────────────────────────┘  │  │ summary   │  │
│          │                              │  │ and...    │  │
│          │  Recent Uploads              │  └───────────┘  │
│          │                              │                 │
│          │  ┌────────────────────────┐  │  ┌───────────┐  │
│          │  │ 📄 dataset.csv         │  │  │ Type...   │  │
│          │  │ 2.3 MB                 │  │  └───────────┘  │
│          │  │ Uploaded 10 min ago    │  │                 │
│          │  │                  [⋮]   │  │                 │
│          │  └────────────────────────┘  │                 │
│          │                              │                 │
│          │  ┌────────────────────────┐  │                 │
│          │  │ 📊 results.xlsx        │  │                 │
│          │  │ 1.1 MB                 │  │                 │
│          │  │ Uploaded 1 hour ago    │  │                 │
│          │  │                  [⋮]   │  │                 │
│          │  └────────────────────────┘  │                 │
│          │                              │                 │
│          │  ┌────────────────────────┐  │                 │
│          │  │ 📑 paper.pdf           │  │                 │
│          │  │ 4.5 MB                 │  │                 │
│          │  │ Uploaded Yesterday     │  │                 │
│          │  │                  [⋮]   │  │                 │
│          │  └────────────────────────┘  │                 │
│          │                              │                 │
└──────────┴──────────────────────────────┴─────────────────┘

Files Area:
- Upload button at top
- Drag & drop zone with dashed border
- File cards stacked vertically
- Each card: Icon (by type), name, size, timestamp, menu
- Click card to preview/open
- Three-dot menu: Preview, Download, Link, Delete
```

---

## 8. Project Workspace - Literature View
**Route:** `/project/:id/literature`

```
┌────────────────────────────────────────────────────────────┐
│  [Logo] Project Name                      [User Avatar ▾]  │
├──────────┬──────────────────────────────┬─────────────────┤
│          │                              │                 │
│ 📄 Docs  │  Literature                  │  AI Assistant   │
│          │  ┌────────────────────────┐  │                 │
│ 📁 Files │  │  🔍 Find Papers        │  │  ┌───────────┐  │
│          │  └────────────────────────┘  │  │ User:     │  │
│ 📚 Lit   │                              │  │ Find      │  │
│          │  45 papers in your library   │  │ papers on │  │
│ 📊 Anal  │                              │  │ hydrides  │  │
│          │  [Filter ▾] [Sort ▾] [Search]│  └───────────┘  │
│ 🕸️ Graph │                              │                 │
│          │  ┌────────────────────────┐  │  ┌───────────┐  │
│ ⚙️ Set   │  │ Room-temperature       │  │  │ AI: Found │  │
│          │  │ superconductivity in   │  │  │ 12 papers │  │
│          │  │ carbonaceous sulfur... │  │  │ ...       │  │
│          │  │                        │  │  └───────────┘  │
│          │  │ Smith, J. et al. (2023)│  │                 │
│          │  │ Nature • DOI: 10.1038..│  │  ┌───────────┐  │
│          │  │                        │  │  │ Type...   │  │
│          │  │ ▼ Key Claims:          │  │  └───────────┘  │
│          │  │ • "Achieved 287K..."   │  │                 │
│          │  │   Used in: Intro, Res  │  │                 │
│          │  │ • "Pressure of 267..." │  │                 │
│          │  │   Used in: Methodology │  │                 │
│          │  │                        │  │                 │
│          │  │ [View Paper] [Cite]    │  │                 │
│          │  └────────────────────────┘  │                 │
│          │                              │                 │
│          │  ┌────────────────────────┐  │                 │
│          │  │ [Next paper...]        │  │                 │
│          │  └────────────────────────┘  │                 │
│          │                              │                 │
└──────────┴──────────────────────────────┴─────────────────┘

Literature Area:
- Find Papers button at top
- Paper count displayed
- Filter bar: Filter dropdown, Sort dropdown, Search input
- Paper cards: Expandable/collapsible
- Collapsed: Title, authors, journal, year
- Expanded: + Key claims with usage, action buttons
- Claims are clickable to see where used
```

---

## 9. Project Workspace - Analyses View
**Route:** `/project/:id/analyses`

```
┌────────────────────────────────────────────────────────────┐
│  [Logo] Project Name                      [User Avatar ▾]  │
├──────────┬──────────────────────────────┬─────────────────┤
│          │                              │                 │
│ 📄 Docs  │  Analyses                    │  AI Assistant   │
│          │  ┌────────────────────────┐  │                 │
│ 📁 Files │  │  + New Analysis        │  │  ┌───────────┐  │
│          │  └────────────────────────┘  │  │ User:     │  │
│ 📚 Lit   │                              │  │ Create a  │  │
│          │  Recent Analyses             │  │ scatter   │  │
│ 📊 Anal  │                              │  │ plot of   │  │
│          │  ┌────────────────────────┐  │  │ temp vs   │  │
│ 🕸️ Graph │  │ 📊 Temperature vs      │  │  │ conduct   │  │
│          │  │    Conductivity        │  │  └───────────┘  │
│ ⚙️ Set   │  │                        │  │                 │
│          │  │ Linear Regression      │  │  ┌───────────┐  │
│          │  │ 2 hours ago            │  │  │ AI: I'll  │  │
│          │  │                        │  │  │ analyze   │  │
│          │  │ [Chart Thumbnail]      │  │  │ dataset   │  │
│          │  │                        │  │  │ and...    │  │
│          │  │ R² = 0.87              │  │  └───────────┘  │
│          │  │ 150 data points        │  │                 │
│          │  └────────────────────────┘  │  ┌───────────┐  │
│          │                              │  │ Type...   │  │
│          │  ┌────────────────────────┐  │  └───────────┘  │
│          │  │ 📈 Pressure Distrib.   │  │                 │
│          │  │                        │  │                 │
│          │  │ Histogram              │  │                 │
│          │  │ Yesterday              │  │                 │
│          │  │                        │  │                 │
│          │  │ [Chart Thumbnail]      │  │                 │
│          │  │                        │  │                 │
│          │  │ Mean: 267 GPa          │  │                 │
│          │  │ σ: 12.3 GPa            │  │                 │
│          │  └────────────────────────┘  │                 │
│          │                              │                 │
└──────────┴──────────────────────────────┴─────────────────┘

Analyses Area:
- New Analysis button at top
- Analysis cards stacked vertically
- Each card: Icon, title, type, timestamp
- Chart thumbnail preview
- Key statistics below chart
- Click card to open full analysis view
```

---

## 10. Analysis Detail View
**Route:** `/project/:id/analysis/:analysisId`

```
┌────────────────────────────────────────────────────────────┐
│  [Logo] Project Name                      [User Avatar ▾]  │
├──────────┬──────────────────────────────┬─────────────────┤
│          │                              │                 │
│ 📄 Docs  │  [← Back] Temperature vs     │  AI Assistant   │
│          │           Conductivity       │                 │
│ 📁 Files │                              │  ┌───────────┐  │
│          │  ┌────────────────────────┐  │  │ User:     │  │
│ 📚 Lit   │  │                        │  │  │ Explain   │  │
│          │  │                        │  │  │ this      │  │
│ 📊 Anal  │  │   [Full-size Chart]    │  │  │ result    │  │
│          │  │                        │  │  └───────────┘  │
│ 🕸️ Graph │  │   Interactive with     │  │                 │
│          │  │   zoom, pan, hover     │  │  ┌───────────┐  │
│ ⚙️ Set   │  │                        │  │  │ AI: The   │  │
│          │  │                        │  │  │ R² of 0.87│  │
│          │  │                        │  │  │ indicates │  │
│          │  └────────────────────────┘  │  │ ...       │  │
│          │                              │  └───────────┘  │
│          │  Results Summary             │                 │
│          │  ┌────────────────────────┐  │  ┌───────────┐  │
│          │  │ R² Score: 0.87         │  │  │ Type...   │  │
│          │  │ P-value: < 0.001       │  │  └───────────┘  │
│          │  │ Slope: 2.34 ± 0.12     │  │                 │
│          │  └────────────────────────┘  │                 │
│          │                              │                 │
│          │  ▼ Code (Python)             │                 │
│          │  ┌────────────────────────┐  │                 │
│          │  │ import pandas as pd    │  │                 │
│          │  │ import matplotlib...   │  │                 │
│          │  │ ...                    │  │                 │
│          │  └────────────────────────┘  │                 │
│          │                              │                 │
│          │  [Rerun] [Modify Params]     │                 │
│          │                              │                 │
└──────────┴──────────────────────────────┴─────────────────┘

Analysis Detail:
- Back button + analysis title
- Large interactive chart at top
- Results summary box with key metrics
- Code section: Collapsed by default, expandable
- Action buttons at bottom: Rerun, Modify
```

---

## 11. Project Workspace - Graph View
**Route:** `/project/:id/graph`

```
┌────────────────────────────────────────────────────────────┐
│  [Logo] Project Name                      [User Avatar ▾]  │
├──────────┬──────────────────────────────┬─────────────────┤
│          │                              │                 │
│ 📄 Docs  │  Knowledge Graph             │  AI Assistant   │
│          │  [Zoom+][Zoom-][Fit Screen]  │                 │
│ 📁 Files │                              │  ┌───────────┐  │
│          │  ┌────────────────────────┐  │  │ User:     │  │
│ 📚 Lit   │  │                        │  │  │ Why is    │  │
│          │  │    📄 ─── 📚 ─── 📊    │  │  │ this      │  │
│ 📊 Anal  │  │   Doc1   Paper1  Anal1 │  │  │ connected │  │
│          │  │     │      │       │   │  │  └───────────┘  │
│ 🕸️ Graph │  │     └──── 💡 ──────┘   │  │                 │
│          │  │         Claim1         │  │  ┌───────────┐  │
│ ⚙️ Set   │  │            │           │  │  │ AI: This  │  │
│          │  │         📄             │  │  │ claim is  │  │
│          │  │        Doc2            │  │  │ cited in  │  │
│          │  │                        │  │  │ both...   │  │
│          │  │  Force-directed graph  │  │  └───────────┘  │
│          │  │  with nodes & edges    │  │                 │
│          │  │                        │  │  ┌───────────┐  │
│          │  │  Drag to pan           │  │  │ Type...   │  │
│          │  │  Scroll to zoom        │  │  └───────────┘  │
│          │  │  Click node for info   │  │                 │
│          │  │                        │  │                 │
│          │  └────────────────────────┘  │                 │
│          │                              │                 │
│          │  Legend:                     │                 │
│          │  📄 Documents  📚 Papers     │                 │
│          │  💡 Claims     📊 Analyses   │                 │
│          │                              │                 │
└──────────┴──────────────────────────────┴─────────────────┘

Graph View:
- Controls at top: Zoom in, Zoom out, Fit to screen
- Interactive graph canvas
- Nodes: Different icons for different entity types
- Edges: Lines connecting related entities
- Node size varies by importance
- Click node: Highlights connections + shows popover
- Double-click: Opens that entity
- Legend at bottom
- Read-only (no editing in v1)
```

---

## 12. Project Workspace - Settings
**Route:** `/project/:id/settings`

```
┌────────────────────────────────────────────────────────────┐
│  [Logo] Project Name                      [User Avatar ▾]  │
├──────────┬──────────────────────────────┬─────────────────┤
│          │                              │                 │
│ 📄 Docs  │  Project Settings            │  AI Assistant   │
│          │                              │                 │
│ 📁 Files │  General                     │  ┌───────────┐  │
│          │  ┌────────────────────────┐  │  │ User:     │  │
│ 📚 Lit   │  │ Project Name           │  │  │ Change    │  │
│          │  │ [Superconductivity...] │  │  │ citation  │  │
│ 📊 Anal  │  │                        │  │  │ style     │  │
│          │  │ Description            │  │  └───────────┘  │
│ 🕸️ Graph │  │ [Research on room-temp]│  │                 │
│          │  │ [superconductivity...] │  │  ┌───────────┐  │
│ ⚙️ Set   │  └────────────────────────┘  │  │ AI: I'll  │  │
│          │                              │  │ update to │  │
│          │  AI Preferences              │  │ Chicago   │  │
│          │  ┌────────────────────────┐  │  │ style     │  │
│          │  │ Citation Style         │  │  └───────────┘  │
│          │  │ [APA ▾]                │  │                 │
│          │  │                        │  │  ┌───────────┐  │
│          │  │ ☑ Auto-suggest cites   │  │  │ Type...   │  │
│          │  │ ☑ Auto-update biblio   │  │  └───────────┘  │
│          │  └────────────────────────┘  │                 │
│          │                              │                 │
│          │  Danger Zone                 │                 │
│          │  ┌────────────────────────┐  │                 │
│          │  │ [Archive Project]      │  │                 │
│          │  │                        │  │                 │
│          │  │ [Delete Project]       │  │                 │
│          │  └────────────────────────┘  │                 │
│          │                              │                 │
└──────────┴──────────────────────────────┴─────────────────┘

Settings:
- Sections: General, AI Preferences, Danger Zone
- General: Text inputs for name and description
- AI Preferences: Dropdown for citation style, checkboxes
- Danger Zone: Destructive actions (archive, delete)
- All changes auto-save
```

---

## 13. Modal - Citation Picker
**Triggered from:** Document Editor

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                                                            │
│      ┌──────────────────────────────────────────┐         │
│      │  Insert Citation                    [✕]  │         │
│      ├──────────────────────────────────────────┤         │
│      │                                          │         │
│      │  ┌────────────────────────────────────┐  │         │
│      │  │ Search papers...                  │  │         │
│      │  └────────────────────────────────────┘  │         │
│      │                                          │         │
│      │  From your library (45 papers)           │         │
│      │                                          │         │
│      │  ┌────────────────────────────────────┐  │         │
│      │  │ ○ Smith et al. (2023)              │  │         │
│      │  │   "Room-temperature supercond..."  │  │         │
│      │  │   Nature                           │  │         │
│      │  └────────────────────────────────────┘  │         │
│      │                                          │         │
│      │  ┌────────────────────────────────────┐  │         │
│      │  │ ○ Jones et al. (2022)              │  │         │
│      │  │   "Hydride materials under..."     │  │         │
│      │  │   Science                          │  │         │
│      │  └────────────────────────────────────┘  │         │
│      │                                          │         │
│      │  ┌────────────────────────────────────┐  │         │
│      │  │ ○ Lee et al. (2021)                │  │         │
│      │  │   "Pressure effects on..."         │  │         │
│      │  │   Physical Review B                │  │         │
│      │  └────────────────────────────────────┘  │         │
│      │                                          │         │
│      │                    [Cancel] [Insert]     │         │
│      │                                          │         │
│      └──────────────────────────────────────────┘         │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘

Modal:
- Centered on screen, 600px wide
- Semi-transparent backdrop
- Search input at top
- List of papers from library
- Radio buttons for selection
- Cancel and Insert buttons at bottom
- Click backdrop or X to close
```

---

## 14. Modal - AI Confirmation
**Triggered from:** AI Panel (for big actions)

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                                                            │
│      ┌──────────────────────────────────────────┐         │
│      │  Confirm Action                     [✕]  │         │
│      ├──────────────────────────────────────────┤         │
│      │                                          │         │
│      │  I'll create a new analysis that:        │         │
│      │                                          │         │
│      │  • Loads dataset.csv                     │         │
│      │  • Performs linear regression            │         │
│      │  • Generates scatter plot visualization  │         │
│      │  • Adds results to Analyses section      │         │
│      │                                          │         │
│      │  This will take approximately 30 seconds.│         │
│      │                                          │         │
│      │                                          │         │
│      │          [Approve] [Cancel] [Modify]     │         │
│      │                                          │         │
│      └──────────────────────────────────────────┘         │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘

Confirmation Modal:
- Centered, 500px wide
- Plain language explanation of action
- Bulleted list of steps
- Time estimate
- Three buttons: Approve (primary), Cancel, Modify
```

---

## 15. Toast Notification
**Triggered by:** Various actions (save, upload, error)

```
┌────────────────────────────────────────────────────────────┐
│                                          ┌───────────────┐ │
│                                          │ ✓ Document    │ │
│                                          │   saved!  [✕] │ │
│                                          └───────────────┘ │
│                                                            │
│                                                            │
│                                                            │
│                                                            │
│                                                            │
│                                                            │
│                                                            │
│                                                            │
│                                                            │
│                                                            │
│                                                            │
│                                                            │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘

Toast:
- Top-right corner
- 320px wide
- Icon on left (checkmark, error, info)
- Message text
- Close button on right
- Auto-dismisses after 5 seconds
- Slides in from right
- Multiple toasts stack vertically
```

---

## Layout Dimensions Summary

### Desktop (> 1024px)
```
Workspace Layout:
├─ Header: 60px height (full width)
├─ Left Sidebar: 200px width (fixed)
├─ Main Canvas: Flexible width (scrollable)
└─ AI Panel: 350px width (fixed, collapsible)

Containers:
- Max width: 1280px
- Padding: 32px horizontal
```

### Tablet (768px - 1024px)
```
Workspace Layout:
├─ Header: 60px height (full width)
├─ Left Sidebar: Overlay (triggered by hamburger)
├─ Main Canvas: Full width
└─ AI Panel: Overlay from right
```

### Mobile (< 768px)
```
Stacked Layout:
├─ Header: 60px height
├─ Bottom Nav: 60px height (fixed)
└─ Content: Full width, scrollable

AI Panel: Full-screen overlay
```

---

## Common UI Patterns

### Card Hover Effect
```
Default: 
- Background: white
- Border: 1px solid gray-200
- Shadow: none

Hover:
- Transform: translateY(-2px)
- Shadow: 0 4px 12px rgba(0,0,0,0.1)
- Transition: 200ms ease-in-out
```

### Button States
```
Default: Solid color, no shadow
Hover: Darker shade, scale(1.02), shadow
Active: Scale(0.98)
Disabled: Gray, cursor not-allowed
Loading: Spinner, disabled interaction
```

### Input Focus
```
Default: Border gray-300
Focus: Border primary-color, shadow ring
Error: Border error-color, red text below
```

### Empty States
```
- Centered illustration (200x200px)
- Heading below illustration
- Subtext (optional)
- Primary action button
- Secondary action (optional)
```

---

This wireframe document provides a complete text-based visual reference for every page and interaction in the application.
