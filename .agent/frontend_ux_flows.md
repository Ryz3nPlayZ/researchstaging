# Frontend UI/UX Flow Design
## Research Platform - Complete User Journey Map

---

## 1. Pre-Authentication Flow

### 1.1 Waitlist Landing Page (Pre-Launch)
**Route:** `/`

**Visual Design:**
- **Hero Section:**
  - Full-width background: Serene landscape with helicopter taking off (symbolizing research journey)
  - Overlay: Subtle gradient (dark at bottom, transparent at top)
  - Center-aligned content with generous whitespace

**Content Hierarchy:**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│         [Landscape + Helicopter Visual]         │
│                                                 │
│     One powerful sentence about the product     │
│     "Your AI-powered research companion that    │
│      turns ideas into peer-reviewed insights"   │
│                                                 │
│         ┌───────────────────────────┐          │
│         │  email@example.com    [→] │          │
│         └───────────────────────────┘          │
│                                                 │
│            "Join the waitlist"                  │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Interactions:**
- Email input with inline validation (debounced)
- Submit on Enter or arrow button click
- Success: Smooth transition to "You're on the list!" message
- Error: Gentle shake animation + inline error message

**States:**
- Default: Empty input, subtle pulse on arrow button
- Typing: Input focused, arrow button solid
- Submitting: Loading spinner replaces arrow
- Success: Checkmark animation, input fades to confirmation message
- Error: Red border, error text below input

---

## 2. Authentication Flow (Post-Launch)

### 2.1 Login Page
**Route:** `/login`

**Visual Design:**
- Same calm background as waitlist
- Single centered card with glass morphism effect

**Layout:**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│              [Same Hero Visual]                 │
│                                                 │
│         ┌───────────────────────┐              │
│         │                       │              │
│         │   [Product Logo]      │              │
│         │                       │              │
│         │  ┌─────────────────┐ │              │
│         │  │  [G] Continue   │ │              │
│         │  │  with Google    │ │              │
│         │  └─────────────────┘ │              │
│         │                       │              │
│         └───────────────────────┘              │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Interactions:**
- Single Google OAuth button
- Click → OAuth popup → Auto-redirect on success
- No manual forms, no password fields

**States:**
- Default: Button with Google colors
- Hover: Subtle lift animation
- Clicking: Button scales down slightly
- Loading: Spinner inside button
- Error: Toast notification at top of screen

---

## 3. Project Home Screen

### 3.1 Project Dashboard
**Route:** `/projects`

**First-time User (Empty State):**
```
┌─────────────────────────────────────────────────┐
│  [Logo]                    [User Avatar ▾]      │
├─────────────────────────────────────────────────┤
│                                                 │
│                                                 │
│              [Friendly Illustration]            │
│                                                 │
│           "Ready to start researching?"         │
│                                                 │
│         ┌─────────────────────────┐            │
│         │  + Create New Project   │            │
│         └─────────────────────────┘            │
│                                                 │
│              ┌─────────────┐                   │
│              │ Import Files │                   │
│              └─────────────┘                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Returning User (With Projects):**
```
┌─────────────────────────────────────────────────┐
│  [Logo]  Projects              [User Avatar ▾]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  + Create New Project                   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Recent Projects                                │
│  ┌─────────────────────────────────────────┐   │
│  │ 📊 Superconductivity Research           │   │
│  │ Last edited: 2 hours ago                │   │
│  │ 12 documents • 45 papers                │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 🧬 Protein Folding Analysis             │   │
│  │ Last edited: Yesterday                  │   │
│  │ 5 documents • 23 papers                 │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  All Projects (8)                               │
│  [Grid of project cards...]                     │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Interactions:**
- **Create New Project:**
  - Click → Inline input appears in place of button
  - Type name → Press Enter → Immediately navigate to project workspace
  - No modal, no multi-step form
  
- **Import Project:**
  - Click → File picker OR
  - Drag & drop zone appears with visual feedback
  - Accepts: .zip, folders, multiple files
  - Shows upload progress
  - Auto-creates project from imported structure

- **Project Cards:**
  - Click anywhere → Navigate to project workspace
  - Hover → Subtle lift + shadow
  - Right-click or three-dot menu → Rename, Duplicate, Archive, Delete

**User Avatar Dropdown:**
- Settings
- Help & Documentation
- Sign Out

---

## 4. Project Workspace

### 4.1 Main Layout Structure
**Route:** `/project/:projectId`

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] Project Name                      [User Avatar ▾]   │
├──────────┬──────────────────────────────┬──────────────────┤
│          │                              │                  │
│  LEFT    │      MAIN CANVAS             │   RIGHT PANEL    │
│ SIDEBAR  │                              │   (AI Assistant) │
│          │                              │                  │
│  Nav     │   Content Area               │   Chat          │
│  Items   │   (Documents, Files, etc)    │   Interface     │
│          │                              │                  │
│          │                              │   [Collapse →]   │
│          │                              │                  │
└──────────┴──────────────────────────────┴──────────────────┘
```

**Responsive Behavior:**
- Desktop: Three-column layout (200px | flex | 350px)
- Tablet: Collapsible sidebar, AI panel overlays
- Mobile: Stack vertically, hamburger menu for nav

---

### 4.2 Left Sidebar Navigation

**Structure:**
```
┌──────────────┐
│              │
│ 📄 Documents │  ← Active
│              │
│ 📁 Files     │
│              │
│ 📚 Literature│
│              │
│ 📊 Analyses  │
│              │
│ 🕸️  Graph    │
│              │
│ ⚙️  Settings │
│              │
└──────────────┘
```

**Interactions:**
- Click item → Main canvas updates to show that section
- Active item: Highlighted background, left border accent
- Hover: Subtle background color change
- Icons: Consistent, minimal, recognizable
- Labels: Always visible (no icon-only mode in v1)

**States:**
- Default: Gray text, outlined icon
- Hover: Darker text, filled icon
- Active: Brand color, filled icon, background highlight
- Badge notifications: Small number badge for new items (e.g., "3 new papers")

---

### 4.3 Main Canvas - Documents View

**Route:** `/project/:projectId/documents`

**Empty State:**
```
┌────────────────────────────────────────┐
│                                        │
│         [Document Icon]                │
│                                        │
│      "No documents yet"                │
│                                        │
│   ┌──────────────────────┐            │
│   │ + Create Document    │            │
│   └──────────────────────┘            │
│                                        │
└────────────────────────────────────────┘
```

**With Documents:**
```
┌────────────────────────────────────────┐
│  Documents                             │
│  ┌──────────────────────┐             │
│  │ + New Document       │             │
│  └──────────────────────┘             │
│                                        │
│  ┌────────────────────────────────┐   │
│  │ 📄 Introduction                │   │
│  │    Last edited 5 min ago       │   │
│  └────────────────────────────────┘   │
│                                        │
│  ┌────────────────────────────────┐   │
│  │ 📄 Literature Review           │   │
│  │    Last edited 2 hours ago     │   │
│  └────────────────────────────────┘   │
│                                        │
│  ┌────────────────────────────────┐   │
│  │ 📄 Methodology                 │   │
│  │    Last edited Yesterday       │   │
│  └────────────────────────────────┘   │
│                                        │
└────────────────────────────────────────┘
```

**Interactions:**
- **New Document:**
  - Click → Immediately opens blank editor in canvas
  - Auto-saves with generated title "Untitled Document"
  - Title becomes editable on first click
  
- **Document Card:**
  - Click → Opens in editor
  - Hover → Shows preview tooltip
  - Three-dot menu → Rename, Duplicate, Move to Trash

---

### 4.4 Document Editor

**Route:** `/project/:projectId/document/:documentId`

**Layout:**
```
┌────────────────────────────────────────────────┐
│  [← Back to Documents]    [Document Title]     │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ [B] [I] [U] [Link] [Citation] [Heading▾]│ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │                                          │ │
│  │  # Introduction                          │ │
│  │                                          │ │
│  │  This research explores the relationship │ │
│  │  between temperature and superconductivity│ │
│  │  in hydride materials [1].               │ │
│  │                                          │ │
│  │  Recent studies have shown...            │ │
│  │                                          │ │
│  │                                          │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ───────────────────────────────────────────  │
│  References                                    │
│  [1] Smith et al. (2023). "Room-temperature   │
│      superconductivity in hydrides"...        │
│                                                │
└────────────────────────────────────────────────┘
```

**Editor Features:**
- **WYSIWYG editing** (Google Docs style)
- **Formatting toolbar:**
  - Bold, Italic, Underline
  - Headings (H1, H2, H3)
  - Bulleted/Numbered lists
  - Insert Link
  - Insert Citation (opens citation picker)
  
- **Citation Insertion:**
  - Click [Citation] button
  - Search modal appears with papers from Literature
  - Select paper → Citation inserted inline as [1]
  - Bibliography auto-updates at bottom

- **Auto-save:**
  - Saves every 2 seconds while typing
  - Visual indicator: "Saving..." → "Saved" in top-right
  - No manual save button

- **Collaboration (Future):**
  - Cursor positions of other users
  - Real-time updates

**Interactions:**
- Title: Click to edit inline
- Text: Click to place cursor, type naturally
- Citations: Hover to see full reference, click to jump to bibliography
- Bibliography: Auto-generated, read-only in v1

---

### 4.5 Main Canvas - Files View

**Route:** `/project/:projectId/files`

**Layout:**
```
┌────────────────────────────────────────────────┐
│  Files                                         │
│  ┌──────────────────────┐                     │
│  │ 📤 Upload Files      │                     │
│  └──────────────────────┘                     │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │ Drag and drop files here                │  │
│  │ or click to browse                      │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  Recent Uploads                                │
│  ┌──────────────────────────────────────┐     │
│  │ 📄 dataset.csv          2.3 MB       │     │
│  │ Uploaded 10 min ago                  │     │
│  └──────────────────────────────────────┘     │
│                                                │
│  ┌──────────────────────────────────────┐     │
│  │ 📊 results.xlsx         1.1 MB       │     │
│  │ Uploaded 1 hour ago                  │     │
│  └──────────────────────────────────────┘     │
│                                                │
│  ┌──────────────────────────────────────┐     │
│  │ 📑 paper.pdf            4.5 MB       │     │
│  │ Uploaded Yesterday                   │     │
│  └──────────────────────────────────────┘     │
│                                                │
└────────────────────────────────────────────────┘
```

**Interactions:**
- **Upload:**
  - Click upload button → File picker
  - Drag & drop → Visual feedback (border highlight, background change)
  - Multiple files supported
  - Progress bar for each file
  
- **File Cards:**
  - Click → Opens preview/viewer based on type
  - PDF: In-app PDF viewer
  - CSV/Excel: Data table preview
  - Images: Image viewer
  - Other: Download prompt
  
- **File Actions (Three-dot menu):**
  - Preview
  - Download
  - Link to Document
  - Link to Analysis
  - Delete

**File Preview Modal:**
```
┌────────────────────────────────────────────────┐
│  [← Back]  paper.pdf                    [✕]   │
├────────────────────────────────────────────────┤
│                                                │
│         [PDF Viewer with scroll]               │
│                                                │
│  Page 1 of 24              [Zoom controls]     │
│                                                │
└────────────────────────────────────────────────┘
```

---

### 4.6 Main Canvas - Literature View

**Route:** `/project/:projectId/literature`

**Layout:**
```
┌────────────────────────────────────────────────┐
│  Literature                                    │
│  ┌──────────────────────┐                     │
│  │ 🔍 Find Papers       │                     │
│  └──────────────────────┘                     │
│                                                │
│  45 papers in your library                     │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │ Room-temperature superconductivity in   │  │
│  │ carbonaceous sulfur hydrides            │  │
│  │                                         │  │
│  │ Smith, J. et al. (2023)                 │  │
│  │ Nature • DOI: 10.1038/...               │  │
│  │                                         │  │
│  │ Key Claims:                             │  │
│  │ • "Achieved 287K superconductivity"     │  │
│  │   Used in: Introduction, Results        │  │
│  │ • "Pressure of 267 GPa required"        │  │
│  │   Used in: Methodology                  │  │
│  │                                         │  │
│  │ [View Full Paper] [Cite in Document]    │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │ [Next paper card...]                    │  │
│  └─────────────────────────────────────────┘  │
│                                                │
└────────────────────────────────────────────────┘
```

**Interactions:**
- **Find Papers:**
  - Click → Opens AI-powered search dialog
  - User types research question or keywords
  - AI suggests relevant papers
  - User selects papers to add to library
  
- **Paper Cards:**
  - Expandable: Click to show/hide key claims
  - Key Claims: Click claim → Shows which documents use it
  - View Full Paper: Opens PDF viewer or external link
  - Cite in Document: Opens document picker → Inserts citation
  
- **Filtering & Sorting:**
  - Filter by: Used/Unused, Year, Journal
  - Sort by: Relevance, Date, Citations
  - Search within library

**Claim Usage Modal:**
```
┌────────────────────────────────────────────────┐
│  "Achieved 287K superconductivity"      [✕]   │
├────────────────────────────────────────────────┤
│                                                │
│  This claim is used in 2 documents:            │
│                                                │
│  ┌──────────────────────────────────────┐     │
│  │ 📄 Introduction                      │     │
│  │ "...recent breakthrough achieved     │     │
│  │  287K superconductivity [1]..."      │     │
│  │ [Jump to Document]                   │     │
│  └──────────────────────────────────────┘     │
│                                                │
│  ┌──────────────────────────────────────┐     │
│  │ 📄 Results                           │     │
│  │ "...our findings align with the      │     │
│  │  287K threshold [1]..."              │     │
│  │ [Jump to Document]                   │     │
│  └──────────────────────────────────────┘     │
│                                                │
└────────────────────────────────────────────────┘
```

---

### 4.7 Main Canvas - Analyses View

**Route:** `/project/:projectId/analyses`

**Layout:**
```
┌────────────────────────────────────────────────┐
│  Analyses                                      │
│  ┌──────────────────────┐                     │
│  │ + New Analysis       │                     │
│  └──────────────────────┘                     │
│                                                │
│  Recent Analyses                               │
│  ┌─────────────────────────────────────────┐  │
│  │ 📊 Temperature vs Conductivity          │  │
│  │ Linear Regression • 2 hours ago         │  │
│  │                                         │  │
│  │ [Chart Preview Thumbnail]               │  │
│  │                                         │  │
│  │ R² = 0.87 • 150 data points             │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │ 📈 Pressure Distribution Analysis       │  │
│  │ Histogram • Yesterday                   │  │
│  │                                         │  │
│  │ [Chart Preview Thumbnail]               │  │
│  │                                         │  │
│  │ Mean: 267 GPa • σ: 12.3 GPa             │  │
│  └─────────────────────────────────────────┘  │
│                                                │
└────────────────────────────────────────────────┘
```

**Analysis Detail View:**
**Route:** `/project/:projectId/analysis/:analysisId`

```
┌────────────────────────────────────────────────┐
│  [← Back]  Temperature vs Conductivity         │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │                                          │ │
│  │        [Full-size Chart/Graph]           │ │
│  │                                          │ │
│  │  Interactive visualization with          │ │
│  │  zoom, pan, hover tooltips               │ │
│  │                                          │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Results Summary                               │
│  ┌──────────────────────────────────────────┐ │
│  │ R² Score: 0.87                           │ │
│  │ P-value: < 0.001                         │ │
│  │ Slope: 2.34 ± 0.12                       │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ▼ Code (Python)                               │
│  ┌──────────────────────────────────────────┐ │
│  │ import pandas as pd                      │ │
│  │ import matplotlib.pyplot as plt          │ │
│  │ ...                                      │ │
│  │ [Collapsible code block]                 │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  [Rerun Analysis] [Modify Parameters]          │
│                                                │
└────────────────────────────────────────────────┘
```

**Interactions:**
- **New Analysis:**
  - Click → AI dialog: "What would you like to analyze?"
  - User describes analysis in natural language
  - AI proposes analysis plan
  - User approves → Analysis runs → Results appear
  
- **Analysis Cards:**
  - Click → Opens detail view
  - Hover → Animated preview
  
- **Detail View:**
  - Results shown first (charts, tables)
  - Code collapsed by default
  - Click "Code" → Expands to show full code
  - Rerun: Executes analysis again with current data
  - Modify: Opens parameter editor → Reruns with new params

---

### 4.8 Main Canvas - Graph View

**Route:** `/project/:projectId/graph`

**Layout:**
```
┌────────────────────────────────────────────────┐
│  Knowledge Graph                               │
│  [Zoom In] [Zoom Out] [Fit to Screen]          │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │                                          │ │
│  │    📄 ─────── 📚 ─────── 📊             │ │
│  │   Doc1      Paper1     Analysis1         │ │
│  │     │          │           │             │ │
│  │     └────── 💡 ──────────┘             │ │
│  │           Claim1                         │ │
│  │              │                           │ │
│  │           📄                             │ │
│  │          Doc2                            │ │
│  │                                          │ │
│  │  [Interactive force-directed graph]      │ │
│  │                                          │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Legend:                                       │
│  📄 Documents  📚 Papers  💡 Claims  📊 Analyses│
│                                                │
└────────────────────────────────────────────────┘
```

**Interactions:**
- **Navigation:**
  - Drag to pan
  - Scroll to zoom
  - Click node → Highlights connected nodes
  - Double-click node → Opens that item
  
- **Visual Encoding:**
  - Node size: Importance/usage frequency
  - Edge thickness: Strength of connection
  - Colors: Type of entity (documents, papers, claims, analyses)
  
- **Read-only in v1:**
  - No editing connections
  - No adding/removing nodes
  - Purpose: Transparency and exploration

**Node Detail Popover:**
```
┌────────────────────────────┐
│ 📄 Introduction            │
│                            │
│ Connected to:              │
│ • 3 papers                 │
│ • 5 claims                 │
│ • 1 analysis               │
│                            │
│ [Open Document]            │
└────────────────────────────┘
```

---

### 4.9 Right Panel - AI Assistant

**Always visible, context-aware**

**Layout:**
```
┌──────────────────────┐
│  AI Assistant        │
│                      │
│  ┌────────────────┐  │
│  │ User: Help me  │  │
│  │ rewrite this   │  │
│  │ paragraph      │  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │ AI: I can help │  │
│  │ with that. Here│  │
│  │ are 3 options: │  │
│  │                │  │
│  │ 1. [Option 1]  │  │
│  │ 2. [Option 2]  │  │
│  │ 3. [Option 3]  │  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │ Type message...│  │
│  └────────────────┘  │
│                      │
│  [Collapse →]        │
└──────────────────────┘
```

**Context Awareness:**
- **In Document Editor:**
  - "Help me rewrite this paragraph"
  - "Find sources for this claim"
  - "Suggest a better transition"
  
- **In Files:**
  - "Analyze this dataset"
  - "Extract key findings from this PDF"
  
- **In Literature:**
  - "Find papers about X"
  - "Summarize this paper"
  
- **In Analyses:**
  - "Create a scatter plot of X vs Y"
  - "Run a regression analysis"

**Confirmation Pattern (for big actions):**
```
┌────────────────────────────────┐
│ AI: I'll create a new analysis │
│ that:                          │
│                                │
│ • Loads dataset.csv            │
│ • Performs linear regression   │
│ • Generates visualization      │
│ • Adds results to Analyses     │
│                                │
│ This will take ~30 seconds.    │
│                                │
│ [Approve] [Cancel] [Modify]    │
└────────────────────────────────┘
```

**Interactions:**
- Text input at bottom
- Send on Enter, Shift+Enter for new line
- AI responses stream in real-time
- Code blocks syntax-highlighted
- Clickable actions (e.g., "Open Document")
- Collapse button to maximize canvas space

---

## 5. Settings View

**Route:** `/project/:projectId/settings`

**Layout:**
```
┌────────────────────────────────────────────────┐
│  Project Settings                              │
│                                                │
│  General                                       │
│  ┌──────────────────────────────────────────┐ │
│  │ Project Name                             │ │
│  │ [Superconductivity Research        ]     │ │
│  │                                          │ │
│  │ Description                              │ │
│  │ [Research on room-temp supercon... ]     │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  AI Preferences                                │
│  ┌──────────────────────────────────────────┐ │
│  │ Citation Style                           │ │
│  │ [APA ▾]                                  │ │
│  │                                          │ │
│  │ ☑ Auto-suggest citations                │ │
│  │ ☑ Auto-update bibliography              │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Danger Zone                                   │
│  ┌──────────────────────────────────────────┐ │
│  │ [Archive Project]                        │ │
│  │ [Delete Project]                         │ │
│  └──────────────────────────────────────────┘ │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 6. Special Interactions & Patterns

### 6.1 Global Search
**Trigger:** Cmd/Ctrl + K

**Modal:**
```
┌────────────────────────────────────────────────┐
│  🔍 Search everywhere...                       │
│  ┌──────────────────────────────────────────┐ │
│  │ temperature superconductivity            │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Documents (3)                                 │
│  📄 Introduction - "...temperature effects..." │
│  📄 Results - "...superconductivity at 287K..." │
│                                                │
│  Papers (5)                                    │
│  📚 Smith et al. - "Room-temperature..."       │
│                                                │
│  Analyses (1)                                  │
│  📊 Temperature vs Conductivity                │
│                                                │
└────────────────────────────────────────────────┘
```

### 6.2 AI "What's Going On?" Feature
**Trigger:** Ask AI "What's going on in my project?"

**Response:**
```
┌────────────────────────────────────────────────┐
│ AI: Here's your project overview:              │
│                                                │
│ 📊 Project Status                              │
│ • 12 documents (3 edited today)                │
│ • 45 papers in literature                      │
│ • 8 analyses completed                         │
│                                                │
│ 🔬 Recent Activity                             │
│ • You've been focusing on the Introduction     │
│ • Added 5 new citations from recent papers     │
│ • Ran temperature analysis 2 hours ago         │
│                                                │
│ 💡 Suggestions                                 │
│ • Your Methodology section needs citations     │
│ • Consider analyzing pressure distribution     │
│ • 3 new papers match your research topic       │
│                                                │
└────────────────────────────────────────────────┘
```

### 6.3 Drag & Drop Everywhere
- **Files to Documents:** Drag file → Inserts reference/embed
- **Papers to Documents:** Drag paper → Inserts citation
- **Claims to Documents:** Drag claim → Inserts citation with claim
- **Files to Analyses:** Drag dataset → Prompts analysis creation

### 6.4 Keyboard Shortcuts
- `Cmd/Ctrl + K`: Global search
- `Cmd/Ctrl + N`: New document (when in Documents)
- `Cmd/Ctrl + /`: Focus AI chat
- `Cmd/Ctrl + B`: Toggle left sidebar
- `Cmd/Ctrl + .`: Toggle right AI panel
- `Esc`: Close modals/dialogs

---

## 7. Onboarding Flow (To Be Implemented Later)

### 7.1 First-Time User Journey
**After first login:**

**Step 1: Welcome**
```
┌────────────────────────────────────────────────┐
│                                                │
│         Welcome to [Product Name]!             │
│                                                │
│    Your AI-powered research companion          │
│                                                │
│         [Let's get started →]                  │
│                                                │
└────────────────────────────────────────────────┘
```

**Step 2: Create First Project (Interactive)**
```
┌────────────────────────────────────────────────┐
│                                                │
│    Let's create your first project             │
│                                                │
│    What are you researching?                   │
│    ┌────────────────────────────────────────┐ │
│    │ e.g., "Room-temperature superconductors"│ │
│    └────────────────────────────────────────┘ │
│                                                │
│              [Continue →]                      │
│                                                │
└────────────────────────────────────────────────┘
```

**Step 3: Quick Tour (Tooltips)**
- Highlights each sidebar item with explanation
- Shows AI panel: "Ask me anything about your research"
- Shows document editor: "Write naturally, we'll handle citations"
- Dismissible, can skip

**Step 4: First Action Prompt**
```
┌────────────────────────────────────────────────┐
│  What would you like to do first?              │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ 📝 Start writing a document              │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ 📚 Find relevant papers                  │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │ 📤 Upload my existing files              │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  [I'll explore on my own]                      │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 8. Error States & Edge Cases

### 8.1 Network Errors
```
┌────────────────────────────────────────────────┐
│  ⚠️  Connection lost                           │
│                                                │
│  Your work is saved locally. We'll sync when   │
│  you're back online.                           │
│                                                │
│  [Retry Connection]                            │
└────────────────────────────────────────────────┘
```

### 8.2 AI Errors
```
┌────────────────────────────────────────────────┐
│  AI: I'm having trouble processing that        │
│  request. Could you try:                       │
│                                                │
│  • Rephrasing your question                    │
│  • Breaking it into smaller steps              │
│  • Checking if the file is accessible          │
│                                                │
│  [Contact Support]                             │
└────────────────────────────────────────────────┘
```

### 8.3 File Upload Errors
```
┌────────────────────────────────────────────────┐
│  ❌ Upload failed: file.pdf                    │
│                                                │
│  File is too large (max 50MB)                  │
│                                                │
│  [Try Again] [Choose Different File]           │
└────────────────────────────────────────────────┘
```

---

## 9. Visual Design Principles

### 9.1 Color Palette
- **Primary:** Calm blue (#4A90E2) - Trust, intelligence
- **Secondary:** Warm coral (#FF6B6B) - Energy, creativity
- **Success:** Green (#51CF66)
- **Warning:** Amber (#FFA94D)
- **Error:** Red (#FF6B6B)
- **Neutral:** Grays (#F8F9FA → #212529)

### 9.2 Typography
- **Headings:** Inter, 600 weight
- **Body:** Inter, 400 weight
- **Code:** JetBrains Mono, 400 weight
- **Scale:** 14px base, 1.25 ratio

### 9.3 Spacing
- **Base unit:** 8px
- **Component padding:** 16px
- **Section spacing:** 24px
- **Page margins:** 32px

### 9.4 Animations
- **Transitions:** 200ms ease-in-out
- **Hover effects:** Scale 1.02, lift shadow
- **Loading states:** Skeleton screens, not spinners
- **Page transitions:** Fade + slide (300ms)

### 9.5 Accessibility
- **Contrast:** WCAG AA minimum (4.5:1)
- **Focus states:** Visible outline on all interactive elements
- **Keyboard navigation:** Full support
- **Screen readers:** Semantic HTML, ARIA labels
- **Reduced motion:** Respect prefers-reduced-motion

---

## 10. Mobile Considerations (Future)

### 10.1 Responsive Breakpoints
- **Desktop:** > 1024px (three-column layout)
- **Tablet:** 768px - 1024px (collapsible sidebar)
- **Mobile:** < 768px (stacked, hamburger menu)

### 10.2 Mobile-Specific Patterns
- Bottom navigation bar for main sections
- Swipe gestures for navigation
- Simplified editor toolbar
- Voice input for AI chat
- Offline mode with sync

---

## 11. Performance Targets

- **Initial Load:** < 2s
- **Route Transitions:** < 300ms
- **AI Response Start:** < 500ms
- **Document Auto-save:** < 100ms (debounced)
- **File Upload:** Progress feedback every 100ms

---

## 12. Technical Implementation Notes

### 12.1 State Management
- **Global State:** User, current project, AI context
- **Local State:** UI toggles, form inputs
- **Server State:** Documents, files, literature (cached)

### 12.2 Real-time Features
- **Document editing:** Operational Transform or CRDT
- **AI responses:** Server-Sent Events or WebSocket
- **Auto-save:** Debounced API calls

### 12.3 Data Fetching
- **Optimistic updates:** Immediate UI feedback
- **Background sync:** Periodic refresh of literature
- **Pagination:** Infinite scroll for long lists

---

## Summary of Key UX Principles

1. **Zero Friction:** No unnecessary steps, modals, or forms
2. **Context Awareness:** AI always knows what you're working on
3. **Transparency:** Graph view shows "why" AI makes connections
4. **Forgiveness:** Auto-save, undo, gentle error messages
5. **Progressive Disclosure:** Advanced features hidden until needed
6. **Calm Design:** No aggressive notifications, peaceful visuals
7. **Speed:** Every interaction feels instant
8. **Clarity:** Always clear what's happening and what to do next

---

This design prioritizes **ease of use** and **trust** while maintaining the power needed for serious research work. The interface gets out of the way and lets the user focus on their research, with AI assistance always available but never intrusive.
