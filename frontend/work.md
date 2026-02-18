# Research UI — Parallel Build Plan

> **Base branch:** `master` (commit `d452451`)
> **Project root:** `/home/zemul/Programming/UI/research-ui`

---

## How Git Worktrees Work (Quick Guide)

A worktree lets you check out the same repo into multiple folders simultaneously, each on its own branch. This means separate agents can edit different files without conflicts.

### Setup (run once from the main repo)

```bash
cd /home/zemul/Programming/UI/research-ui

# Create branches for each agent
git branch agent/settings
git branch agent/projects
git branch agent/workspace
git branch agent/auth

# Create worktree folders (each is a full working copy)
git worktree add ../research-ui-settings agent/settings
git worktree add ../research-ui-projects agent/projects
git worktree add ../research-ui-workspace agent/workspace
git worktree add ../research-ui-auth agent/auth
```

After this, you'll have:
```
~/Programming/UI/
├── research-ui/               ← main repo (master branch, dashboard)
├── research-ui-settings/      ← worktree for settings agent
├── research-ui-projects/      ← worktree for projects agent
├── research-ui-workspace/     ← worktree for workspace agent
└── research-ui-auth/          ← worktree for auth agent
```

Each agent works ONLY inside its own worktree folder.

### Merging Back (after agents finish)

```bash
cd /home/zemul/Programming/UI/research-ui

# Merge one at a time (these shouldn't conflict since files don't overlap)
git merge agent/settings --no-ff -m "feat: settings page"
git merge agent/projects --no-ff -m "feat: projects page"
git merge agent/workspace --no-ff -m "feat: workspace + editor + analysis pages"
git merge agent/auth --no-ff -m "feat: auth flow"

# Clean up worktrees
git worktree remove ../research-ui-settings
git worktree remove ../research-ui-projects
git worktree remove ../research-ui-workspace
git worktree remove ../research-ui-auth
```

### If a merge conflicts

```bash
# See what conflicted
git diff --name-only --diff-filter=U

# Fix the files manually, then
git add .
git merge --continue
```

---

## Shared Design Rules (ALL agents must follow)

### 🚫 DO NOT MODIFY

These files are shared infrastructure. No agent may edit them:

| File | Reason |
|------|--------|
| `app/globals.css` | Shared design tokens & utilities |
| `app/layout.tsx` | Root layout with fonts |
| `app/(app)/layout.tsx` | App shell (TopBar + bg-silver) |
| `components/layout/top-bar.tsx` | Shared navigation |
| `components/ui/*` | Shared shadcn components |
| `lib/utils.ts` | Shared utility (cn) |
| `package.json` | Only modify if installing a NEW dependency |

### ✅ CSS Utilities Available

Use these classes — do NOT invent new glassmorphism or card-depth classes:

- `.glass` — frosted white glass card (opacity 0.72, blur, border, shadow)
- `.glass-subtle` — lighter glass (opacity 0.5)
- `.card-elevated` — white card with strong shadow depth (no backdrop blur)
- `.card-feature` — subtle emerald-tinted card (for hero/CTA sections)
- `.grainient-emerald` — emerald gradient with grain texture (buttons)
- `.bg-silver` — fixed mesh gradient background (already on app layout)

### ✅ Color Tokens Available

```
Primary:    accent-50 → accent-900  (emerald, hue 155)
Secondary:  warm-50 → warm-700      (amber/gold, hue 85)
Neutrals:   base-0 → base-900       (cool/warm greys)
Semantic:   success, warning, error, info
```

### ✅ Typography

- Headings: `font-ui` (Mona Sans), `font-semibold`, `tracking-tight`
- Body: `font-body` (Hubot Sans), default
- Utilities: `.text-display`, `.text-heading`, `.text-body`, `.text-label`

### ✅ Design Principles

1. **16px gaps** — `gap-4` between cards. Never `gap-3` or smaller.
2. **No icons inside cards** — icons only in nav/buttons, never decorative.
3. **No badges for status** — use small colored dots (`.h-2 .w-2 .rounded-full`).
4. **Amber/gold for trends** — `warm-*` tokens for ↑/↓ indicators.
5. **Rounded-2xl** on all cards. `rounded-xl` for inner elements.
6. **Hover transitions** — `hover:shadow-lg transition-shadow duration-300` on cards.
7. **No dark backgrounds** in light mode. Depth = shadows only.
8. **`'use client'`** only when using hooks, recharts, or event handlers.

### ✅ Shared Components Available

- `Button` — `@/components/ui/button`
- `Badge` — `@/components/ui/badge` (use sparingly)
- `Card` — `@/components/ui/card`
- `Avatar` — `@/components/ui/avatar`
- `Dialog` — `@/components/ui/dialog`
- `DropdownMenu` — `@/components/ui/dropdown-menu`
- `Input` — `@/components/ui/input`
- `Skeleton` — `@/components/ui/skeleton`
- `recharts` — installed, use for any charts

### ✅ If You Need a New Shared Component

Create it in your page folder first (e.g., `app/(app)/settings/_components/tabs.tsx`). We'll promote to `components/ui/` during merge if reusable.

---

## Agent 1: Settings Page

**Branch:** `agent/settings`
**Worktree:** `~/Programming/UI/research-ui-settings`
**Estimated time:** ~15 min

### Files to Create

```
app/(app)/settings/
├── page.tsx              ← Main settings page
└── _components/
    ├── profile-section.tsx
    ├── preferences-section.tsx
    └── team-section.tsx
```

### Scope

Build a settings page at `/settings` with three sections:

1. **Profile** — name, email, avatar upload, bio textarea
2. **Preferences** — theme toggle (light/dark), notification toggles, language select
3. **Team** — list of team members (name, email, role), invite button

### Requirements

- Use `glass` cards for each section, with section headers
- Use `Input` component for text fields
- Form layout: labels on top, inputs below, max-width ~600px, centered
- Save button at bottom of each section using `grainient-emerald` style
- Use vertical layout, sections separated by thin `border-b border-base-200` dividers
- Page title: "Settings" as `text-2xl font-bold`
- Make it server component (no `'use client'`) — forms are display-only for now

### NOT in scope

- Actual form submission or API calls
- Dark mode toggle functionality
- File upload functionality

---

## Agent 2: Projects Index

**Branch:** `agent/projects`
**Worktree:** `~/Programming/UI/research-ui-projects`
**Estimated time:** ~15 min

### Files to Create

```
app/(app)/projects/
├── page.tsx              ← Projects index
└── _components/
    ├── project-card.tsx
    └── project-filters.tsx
```

### Scope

Build a projects listing page at `/projects`:

1. **Header** — "Projects" title + "New Project" button (grainient-emerald) + search input
2. **Filters bar** — tabs or pills: All / Active / Planning / Archived
3. **Project grid** — 3-column grid of project cards

### Project Card Requirements

- Use `glass` class, `rounded-2xl`, `p-6`
- Show: project name (font-semibold), description (1-2 lines, text-base-500), document count, last updated date
- Status dot (green=active, amber=planning, grey=archived) — NOT a badge
- Progress bar if active (same style as dashboard)
- Hover: `hover:shadow-xl transition-all duration-300` + slight scale `hover:scale-[1.01]`
- Link to `/projects/[id]` (use `<Link>` wrapping the card)

### Mock Data

```typescript
const projects = [
  { id: '1', name: 'Market Research 2026', description: 'Comprehensive market analysis...', docs: 24, status: 'active', progress: 67, updated: '2h ago' },
  { id: '2', name: 'Customer Feedback', description: 'User interviews and survey results...', docs: 8, status: 'active', progress: 45, updated: '1d ago' },
  { id: '3', name: 'Competitor Analysis', description: 'Deep dive into competitor strategies...', docs: 12, status: 'active', progress: 82, updated: '3h ago' },
  { id: '4', name: 'Product Roadmap', description: 'Q2 product planning and feature...', docs: 6, status: 'planning', progress: 20, updated: '2d ago' },
  { id: '5', name: 'User Interviews Q4', description: 'Qualitative research from Q4...', docs: 15, status: 'archived', progress: 100, updated: '2w ago' },
  { id: '6', name: 'Brand Guidelines', description: 'Updated brand identity and design...', docs: 3, status: 'planning', progress: 10, updated: '5d ago' },
];
```

### NOT in scope

- Search functionality (just render the input)
- Filter functionality (just render the pills, show all projects)
- New Project dialog

---

## Agent 3: Project Workspace + Document Editor + Analysis

**Branch:** `agent/workspace`
**Worktree:** `~/Programming/UI/research-ui-workspace`
**Estimated time:** ~30 min

### Files to Create

```
app/(app)/projects/[id]/
├── page.tsx              ← Workspace overview (tabs)
├── layout.tsx            ← Workspace-level layout (sidebar or tab bar)
├── _components/
│   ├── workspace-tabs.tsx
│   ├── overview-tab.tsx
│   ├── documents-list.tsx
│   └── analysis-view.tsx
├── doc/
│   └── [docId]/
│       └── page.tsx      ← Document editor
└── files/
    └── page.tsx          ← File viewer
```

### Workspace Overview (`/projects/[id]`)

A tabbed workspace with three tabs: **Overview** / **Documents** / **Files**

- **Tab bar**: horizontal pills at the top, active tab uses `bg-accent-100 text-accent-700`
- **Overview tab**: project title, description, progress, team members, recent activity (similar style to dashboard cards)
- **Documents tab**: list of documents (name, last edited, word count) — each row clickable linking to `/projects/[id]/doc/[docId]`
- **Files tab**: grid of file cards with type icon (PDF, image, etc as text labels — no icons), filename, size, upload date

### Document Editor (`/projects/[id]/doc/[docId]`)

A split-pane editor layout:

- **Left pane (65%)**: document title (editable `<input>`), content area styled as a writing surface (white bg, max-width ~720px, centered, generous line-height)
  - Use a `<textarea>` styled to look like a rich text editor
  - Lorem ipsum placeholder content (~3 paragraphs)
- **Right pane (35%)**: AI assistant panel
  - `card-elevated` background
  - Header: "AI Assistant"
  - Chat-like interface: 2-3 mock messages (user question + AI response)
  - Input bar at bottom with send button
- Back button linking to workspace

### File Viewer (`/projects/[id]/files`)

Simple grid of file cards:
- `glass` cards, 3-col grid
- File name, type label (PDF, DOCX, PNG), size, uploaded date
- No actual file preview

### Requirements

- Workspace layout should NOT override the app-level `(app)/layout.tsx`
- Use `'use client'` for the workspace page (tab switching needs state)
- Tab state via `useState`, not URL routing
- Use recharts for any charts in the overview tab

### NOT in scope

- Actual text editing functionality
- AI assistant responses
- File upload
- Real data fetching

---

## Agent 4: Auth Flow + Onboarding

**Branch:** `agent/auth`
**Worktree:** `~/Programming/UI/research-ui-auth`
**Estimated time:** ~15 min

### Files to Create

```
app/(auth)/
├── layout.tsx            ← Auth layout (NO TopBar, centered card)
├── login/
│   └── page.tsx
└── signup/
    └── page.tsx
app/(onboarding)/
├── layout.tsx            ← Onboarding layout
└── onboarding/
    └── page.tsx
```

### Auth Layout (`app/(auth)/layout.tsx`)

- Full-screen centered layout
- `bg-silver` background (same mesh gradient)
- NO TopBar — auth pages are standalone
- Single centered card, max-width 420px

### Login Page (`/login`)

- `glass` card, `rounded-2xl`, centered
- Logo at top ("R" emerald square + "Research" text — replicate from TopBar)
- "Welcome back" heading
- Email input + Password input (use `Input` component)
- "Sign in" button (`grainient-emerald`, full-width)
- "Don't have an account? Sign up" link to `/signup`
- Divider: "or continue with"
- Two social buttons (Google, GitHub — just text labels, no icons)

### Signup Page (`/signup`)

- Same layout as login
- "Create your account" heading
- Name + Email + Password + Confirm Password inputs
- "Create account" button
- "Already have an account? Sign in" link to `/login`

### Onboarding Page (`/onboarding`)

- Step wizard (3 steps):
  1. **Welcome** — "Welcome to Research" + name input
  2. **Setup** — role selection (Researcher, Student, Team Lead) as 3 selectable cards
  3. **Done** — "You're all set!" + "Go to Dashboard" button
- Progress dots at top showing current step
- Use `useState` for step navigation
- `'use client'` required

### Requirements

- Auth layout uses `(auth)` route group — completely separate from `(app)`
- Onboarding uses `(onboarding)` route group
- No actual auth logic — display only
- Use `bg-silver` on auth layout for the mesh gradient background

### NOT in scope

- Form validation
- Auth providers
- Session management
- Redirects

---

## Merge Order

After all agents finish, merge in this order (least to most complex):

1. `agent/auth` — standalone route groups, zero overlap
2. `agent/settings` — new page in existing `(app)` group
3. `agent/projects` — new page, but workspace depends on its routes
4. `agent/workspace` — largest change, nested under projects

If merge conflicts occur in `package.json` (multiple agents installed deps), manually combine the `dependencies` objects.

---

## Pre-Flight Checklist (per agent)

Before considering work done, each agent must:

- [ ] Verify `npm run build` passes in their worktree
- [ ] Verify all pages render without errors at their routes
- [ ] Verify `glass`, `card-elevated`, `card-feature` render correctly
- [ ] Confirm no modifications to protected files listed above
- [ ] Confirm 16px gaps, rounded-2xl cards, no icons inside cards
- [ ] Take a screenshot for review
