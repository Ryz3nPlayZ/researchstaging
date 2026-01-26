# UI/UX Specification - Research Orchestration Platform

## Design Principles

- **Notion-style**: Clean, minimal, typography-driven
- **Professional light mode**: Enterprise SaaS aesthetic
- **No extra icons**: Only what's necessary
- **IDE-like complexity**: Powerful features, thoughtfully organized
- **Deep premium navy**: Primary brand color (slightly muted)
- **Functional colors in workspace**: Colors indicate meaning (status, state)
- **Desktop-first**: Optimized for desktop productivity

---

## Screen-by-Screen Flow

### 1. Sign In / Sign Up

**Purpose**: Authentication

**Elements**:
- Centered card, clean form
- Email/password or OAuth (Google, GitHub)
- Minimal branding
- "Already have an account? Sign in" toggle

**Transitions**: → Onboarding (first time) or Home Dashboard (returning user)

---

### 2. Onboarding (First-Time User)

**Purpose**: Smooth introduction, not forced

**Approach**: Skip-able, contextual hints

**Flow**:

**2.1 Welcome Screen**
- Large friendly greeting
- 3-card value prop overview:
  - "Describe your research goal"
  - "AI orchestrates the entire workflow"
  - "Get structured, citeable outputs"
- "Get Started" button
- "Skip tour" link (subtle)

**2.2 Guided Tour (Optional)**
- Modal overlay with tooltips
- 3-4 key screens max:
  - Dashboard (how to start new research)
  - Project workspace (graph visualization)
  - Artifacts and outputs
- "Next" / "Skip tour" buttons

**2.3 Initial Credits Grant**
- "You've been granted X free credits to explore"
- Brief explanation of credit system
- "Start researching" button

**Transitions**: → Home Dashboard

---

### 3. Home Dashboard

**Purpose**: Launchpad for research work

**Layout**: Claude/Perplexity-inspired

**Global Sidebar** (left, collapsible):
- User avatar/profile (top)
- Credits remaining (prominent display)
- "New Project" button (prominent, top of sidebar)
- Section: "Recent Projects" (last 5)
- Section: "All Projects" (expandable list)
- Section: "Templates" (if we have templates)
- Bottom: Settings, Help, Sign out

**Main Area** (center):
- Large greeting: "Good morning, [Name]" or "Welcome back"
- Centered input box:
  - Rounded corners (pill or rounded rectangle)
  - Placeholder: "Describe your research goal..."
  - Submit button on right
- Below input: "Start a new project or continue from the sidebar"

**Transitions**:
- Type in input box → Conversational Planning Flow
- Click project in sidebar → Project Workspace
- Click "New Project" → Conversational Planning Flow
- Click Settings → Settings

---

### 4. Conversational Planning Flow

**Purpose**: Router Agent gathers context through iterative clarification

**Layout**: Chat interface

**Global Sidebar**: Hidden or minimized (focus on conversation)

**Main Chat Area**:
- **Header**: "New Research Project" with back button
- **Conversation Container**:
  - User messages: Right-aligned, blue bubble
  - Router Agent messages: Left-aligned, clean typography
  - Clarifying questions appear as structured agent messages
- **Input Area** (bottom):
  - Text input (auto-expanding)
  - Send button
  - Optional: Attach files (if we support that)

**Router Agent Behavior**:
- Starts with user's initial goal from dashboard input
- Asks 2-5 clarifying questions focused on:
  - Output type (paper, report, brief, analysis)
  - Audience (academic, professional, policy, general)
  - Domain boundaries
  - Scope (focused, standard, comprehensive)
- Does NOT ask about datasets, methods, variables (determined from literature)

**Plan Generation Phase**:
- After sufficient context, Agent says "Generating your research plan..."
- Loading indicator (subtle, not blocking)
- Plan appears as a structured message card:
  - Research goal
  - Phases
  - Key tasks per phase
  - Expected outputs
  - Estimated complexity/time

**Plan Review & Approval**:
- Plan displayed in rich card format
- Action buttons:
  - "Approve & Start" (primary)
  - "Regenerate" (secondary - with explanation prompt)
  - "Edit Plan" (opens editor)
- If "Edit Plan":
  - Plan opens in editable text area
  - Sections are structured (not free-form)
  - "Save & Approve" button

**Transitions**:
- Approve → Project Workspace (project created)
- Back button → Home Dashboard

---

### 5. Project Workspace

**Purpose**: Command center for active research project

**Layout**: Three-pane

**Project Sidebar** (left, 240px):
- Back to Home (top)
- Project title (editable)
- Project status badge
- Credits consumed by this project
- Navigation sections:
  - **Overview** (default)
  - **Task Graph**
  - **Agent Graph**
  - **Papers**
  - **Artifacts**
  - **Execution Log**
  - **Settings** (project-specific settings?)
- Collapse button (hides sidebar)

**Main Content Area** (center, flexible):
- Changes based on sidebar selection
- Default: Overview with embedded task graph

**Details Panel** (right, 400px, collapsible):
- Opens when you click a task, artifact, or paper
- Shows details of selected item
- Close button

**Status Bar** (bottom of main area, thin):
- Real-time project status
- "Currently working: [Task name]" (if running)
- Progress indicator: "7/12 tasks completed"
- Quick actions: Pause, Resume, Cancel

---

### 5.1 Overview (Default Project View)

**Purpose**: At-a-glance project status + primary visualization

**Layout**:

**Top Section** (30% height):
- Project metadata:
  - Research goal (large text)
  - Status: Executing/Completed/Paused
  - Progress: "7/12 tasks (58%)"
  - Started/Updated timestamps
  - Quick actions: Edit Plan, Pause, Cancel

**Middle Section** (70% height):
- **Task Graph Visualization** (ReactFlow)
  - Tasks as nodes
  - Dependencies as edges
  - Color coding:
    - 🟢 Green: Completed
    - 🔵 Blue: Ready to run (dependencies met)
    - ⚪ Grey: Blocked (dependencies not met)
    - 🟡 Yellow: Requires attention
    - 🔴 Red: Failed
  - Interactions:
    - Hover: Task tooltip (type, status, duration)
    - Click: Opens task in Details Panel
    - Zoom/pan controls
  - Live updates: Nodes pulse when running

**Legend**: Small key showing color meanings

---

### 5.2 Task Graph (Full Page)

**Purpose**: Dedicated task DAG visualization

**Same as Overview's task graph but:**
- Full height
- Additional controls:
  - Filter by status
  - Filter by phase
  - Layout options (hierarchical, force-directed)
  - Export graph as image
- Mini-map for large graphs
- Task count summary by status

---

### 5.3 Agent Graph

**Purpose**: Visualize agent orchestration framework

**Layout**: Similar to Task Graph

**Nodes**:
- Router Agent
- Search Agent
- PDF Agent
- Reference Agent
- Summary Agent
- Synthesis Agent
- Drafting Agent
- Evaluator Agent

**Edges**: Communication/dependencies between agents

**Visualization Options**:
- **Static Architecture** (default): Shows all agents and relationships
- **Live Execution**: Highlights active agents in real-time
- **Historical**: Shows which agents were used, with execution counts

**Interactions**:
- Click agent: See agent details in panel
  - Agent type
  - Tasks executed
  - Total duration
  - Tokens consumed
  - Model used

---

### 5.4 Papers

**Purpose**: Browse and manage research papers

**Layout**:

**Filters Bar** (top):
- Search: "Search papers..."
- Filter by: Source (Semantic Scholar, arXiv), Year range, Citation count
- Sort by: Relevance, Date, Citations

**Papers Grid** (main area):
- Cards or table view (toggle)
- Each paper shows:
  - Title
  - Authors (first 3 + "et al")
  - Year
  - Citation count
  - Source badge
  - Relevance score (if available)
  - Abstract preview
- Click paper → Opens in Details Panel

**Details Panel Content**:
- Full metadata
- Abstract (full)
- Full text (if extracted)
- Associated artifacts (summary, references extracted)
- Actions: View PDF, Export citation, Find related

**Bulk Actions**:
- Select multiple papers
- Export all citations
- Add to collection (if we have collections)

---

### 5.5 Artifacts

**Purpose**: Browse all project outputs

**Layout**:

**Filters Bar** (top):
- Filter by type: All, Search Results, PDFs, References, Summaries, Synthesis, Drafts
- Filter by status: Final, Intermediate
- Search: "Search artifacts..."

**Artifacts List** (main area):
- Grouped by type or chronological
- Each artifact shows:
  - Type icon
  - Title/name
  - Created date
  - Associated task
  - Status (final/draft)
  - Size/word count
- Click artifact → Opens in Details Panel

**Details Panel Content**:
- **Header**: Artifact title, type, created date
- **View Mode** (default):
  - Read-only display
  - Formatted for the artifact type:
    - Search results: Cards with paper summaries
    - PDF: PDF viewer or extracted text
    - References: Structured list with DOIs
    - Summary: Clean reading view
    - Synthesis: Structured sections
    - Draft: Rich text document
- **Edit Mode** (toggle button):
  - Enables rich text editor for text artifacts
  - "Save" / "Cancel" buttons
  - NOT available for: Logs, PDF content
- **Actions**:
  - Export (PDF, DOCX, Markdown)
  - Copy to clipboard
  - Version history
  - AI Actions: Rewrite, Expand, Summarize, Add Citations

---

### 5.6 Execution Log

**Purpose**: Debugging and observability

**Layout**:

**Filters Bar** (top):
- Filter by event type: Task started, Task completed, Task failed, Agent action
- Filter by task
- Search logs
- Auto-scroll toggle

**Log Stream** (main area):
- Chronological feed
- Each entry:
  - Timestamp
  - Event type (with color coding)
  - Task/Agent name
  - Message
  - Expandable: Click for details (stack traces, prompt hashes, token counts)
- Live update: New entries appear at bottom
- Auto-scroll to latest

**Export Logs** button

---

### 5.7 Project Settings

**Purpose**: Project-specific configuration

**Options**:
- Edit research goal
- Regenerate plan
- Delete project
- Export all data
- Share/collaborate (if multi-user)
- Notification preferences

---

### 6. Task Detail View

**Trigger**: Click a task in Task Graph or from list

**Display**: Opens in Details Panel (right)

**Content**:

**Header**:
- Task name
- Task type badge (literature_search, pdf_acquisition, etc.)
- Status badge (with color)
- Duration / Elapsed time

**Progress Section** (if running or ready):
- Progress bar
- "Started: [timestamp]"
- "Agent: [Agent type]"

**Inputs Section**:
- "Consumes:"
- List of input artifacts/papers
- Click to view artifact

**Outputs Section**:
- "Produces:"
- Output artifact (if completed)
- Click to view artifact

**Agent Section**:
- "Executed by:"
- Agent type
- Model used
- Tokens consumed
- Retry count (if retried)

**Execution Logs**:
- Relevant log entries for this task
- Expandable for details

**Actions**:
- If failed: "Retry" button
- If completed: "Rerun" button
- If pending: "Cancel" button
- "View in graph" button

**Error Recovery Flow** (if failed):
- Error message displayed
- Router Agent explanation (via LLM)
- Suggested fixes (bulleted list)
- Two action buttons:
  - "Accept & Rerun" (uses credits)
  - "Manual Intervention" (opens manual fix options)
- If manual:
  - Edit inputs
  - Modify parameters
  - "Run with changes" button

---

### 7. Artifact Detail View

**Trigger**: Click an artifact

**Display**: Opens in Details Panel (right)

**Content** (varies by artifact type):

**Common Header**:
- Artifact title
- Type badge
- Created date
- Associated task
- Version (if versioned)

**View Mode** (default):
- Read-only display appropriate for type
- Clean, readable formatting

**Edit Mode** (toggle):
- Rich text editor for editable artifacts
- Toolbar: Bold, italic, headings, lists, links, etc.
- "Save" / "Discard" buttons
- Creates new version on save

**Actions**:
- Export (PDF, DOCX, Markdown, HTML)
- Copy content
- Version history
- AI Actions:
  - Rewrite
  - Expand
  - Summarize
  - Add Citations
  - Change Tone

---

### 8. Settings (Global)

**Purpose**: Account and application configuration

**Sections**:

**Profile**:
- Name, email
- Avatar upload
- Change password

**Billing & Credits**:
- Credits remaining
- Usage history (chart)
- Purchase credits button
- Billing info (if applicable)

**API Keys** (if we allow BYOK option):
- LLM provider keys
- Or explanation: "We provide AI credits, no API keys needed"

**Preferences**:
- Theme (Light/Dark - if we implement dark mode)
- Notification preferences
- Default export format
- Auto-save settings

**Integrations** (if any):
- Connected tools

**About**:
- Version
- Documentation link
- Support contact

---

## Navigation Patterns

### Global Navigation

**Always Available** (when not in specific focused flows):
- Global Sidebar (left)
- Credits indicator (top-right or sidebar)
- User menu (top-right)

### Breadcrumbs

**When deep in hierarchy**:
- Home > Project > [Project Name] > Task > [Task Name]
- Clickable to navigate up

### Back Buttons

**Prominent back buttons** in:
- Conversational Planning Flow → Home
- Project Workspace → Home
- Task/Artifact Detail → Project Overview

---

## Responsive Design

**Desktop-first**:
- Primary breakpoints:
  - 1920px+ (large desktop)
  - 1440px (standard desktop)
  - 1280px (small desktop/laptop)
- Minimum: 1280px

**Tablet** (future consideration):
- Collapse sidebars by default
- Stack panels vertically
- Touch-optimized controls

**Mobile** (not supported initially):
- Consider progressive web app later

---

## Color System

### Brand Colors

**Primary Navy**:
- Deep premium navy (slightly muted)
- Use: Headers, primary buttons, key navigation elements
- Hex: TBD

**Secondary Navy**:
- Lighter variant for backgrounds, subtle states
- Use: Section backgrounds, hover states

### Functional Colors (Workspace)

**Status Colors**:
- 🟢 Green: Completed, success
- 🔵 Blue: Ready, active, info
- ⚪ Grey: Blocked, inactive, pending
- 🟡 Yellow: Warning, attention required
- 🔴 Red: Failed, error, critical

**Semantic Colors**:
- Text: Dark grey (nearly black) for primary, medium grey for secondary
- Borders: Light grey
- Backgrounds: White, off-white, light grey
- Links: Navy (primary)

---

## Typography

**Font Family**: Inter or similar (clean, professional)

**Scale**:
- Display: 48px (research goal, greeting)
- H1: 32px (page titles)
- H2: 24px (section headers)
- H3: 18px (card titles)
- Body: 16px (default text)
- Small: 14px (metadata, captions)
- X-Small: 12px (fine print)

---

## Interactive Elements

### Buttons

**Primary Buttons**:
- Navy background
- White text
- Rounded corners (8px)
- Hover: Slightly darker navy

**Secondary Buttons**:
- Light grey background
- Navy text
- Rounded corners (8px)
- Hover: Medium grey background

**Icon Buttons**:
- Minimal icons only
- 32px touch target
- Hover: Light grey background

### Inputs

**Text Inputs**:
- Border: Light grey
- Rounded corners (8px)
- Focus: Navy border
- Placeholder: Medium grey

**Search Inputs**:
- Pill-shaped or rounded rectangle
- Search icon prefix

### Cards

**Elevation**: Subtle shadows on hover
**Border**: Light grey, rounded corners (12px)
**Padding**: Comfortable spacing (16-24px)

---

## Loading States

**Skeleton Screens**: For content loading
**Spinners**: Minimal, centered
**Progress Bars**: For task execution progress
**Pulse Animations**: For live task graph nodes

---

## Empty States

**No Projects Yet**:
- Friendly illustration or icon
- "Start your first research project"
- "New Project" button

**No Tasks Yet**:
- "Project is being planned"
- Loading state

**No Papers Yet**:
- "Papers will appear here after literature search"
- Icon

**No Artifacts Yet**:
- "Artifacts will be generated as tasks complete"
- Icon

---

## Micro-interactions

**Hover States**: Subtle color changes, slight elevation
**Transitions**: Smooth, 200-300ms ease
**Feedback**: Toast notifications for actions
**Success Confirms**: Checkmark animations

---

## Accessibility

**Keyboard Navigation**: Full keyboard support
**Focus Indicators**: Clear focus rings
**ARIA Labels**: On interactive elements
**Color Contrast**: WCAG AA compliant
**Screen Reader**: Semantic HTML

---

## Open Questions for Implementation

1. **Exact shade of navy** - Need design tokens
2. **Rich text editor** - Which library? (Tiptap, Slate, etc.)
3. **PDF viewing** - Native PDF.js or embedded?
4. **Real-time graph updates** - Performance optimization strategy?
5. **Credit system backend** - How to track and display usage?
6. **System prompts** - Router Agent prompts for planning phase
7. **Agent architecture visualization** - Static or live execution traces?
