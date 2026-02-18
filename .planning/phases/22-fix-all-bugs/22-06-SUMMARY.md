---
phase: 22-fix-all-bugs
plan: 06
type: ux-redesign
started: 2026-02-12
status: in-progress
completion: ~80%

# Phase 22 Plan 06: UX Redesign - Hellycopter Design System

**One-liner:** Complete UX redesign using Hellycopter v2 design system — modern bento-grid layout with pistachio/mint palette, built in Next.js 15 with Shadcn UI.

## What Was Done

### Design System: Hellycopter v2

**Location:** `kimi_dashboard_design/design-v2.md` and `tech-spec.md`

**Visual Identity:**
- **Palette**: Pistachio/Mint/Evergreen green tones
- **Background**: Light gray (#F5F5F7) with white cards
- **Typography**: Inter font (clean, modern sans-serif)
- **Layout**: Bento-grid with 4-column system
- **Radius**: 8px-24px border radius hierarchy
- **Shadows**: Subtle elevation with hover effects

**Key Design Tokens:**
```css
--pistachio: #DEF4C6  /* Soft accents, badges */
--mint: #73E2A7        /* Primary CTA, active states */
--jade: #1C7C54        /* Icons, secondary text */
--evergreen: #1B512D   /* Logo, headings */
```

### Implementation: research-ui/

**Location:** `/home/zemul/Programming/research/research-ui/`

**Tech Stack:**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS v4
- Shadcn UI components
- Framer Motion (animations)
- Lucide React (icons)

### Pages Completed

| Route | Page | Status |
|-------|------|--------|
| `/` | Redirect to dashboard | ✅ Complete |
| `/dashboard` | Main dashboard with bento-grid | ✅ Complete |
| `/projects` | Projects list with filters | ✅ Complete |
| `/projects/[id]` | Project workspace with tabs | ✅ Complete |
| `/projects/[id]/doc/[docId]` | Document editor view | ✅ Complete |
| `/login` | Authentication page | ✅ Complete |
| `/signup` | Registration page | ✅ Complete |
| `/onboarding` | New user onboarding flow | ✅ Complete |
| `/settings` | Settings page (profile, team, preferences) | ✅ Complete |
| `/test` | Development test page | ✅ Complete |

### Components Built

**Layout Components:**
- `layout/top-bar.tsx` — Main navigation bar

**Dashboard Components:**
- Bento-grid layout with stats, recent projects, quick actions
- Hero section with visual banner
- Project cards with progress indicators

**Project Workspace:**
- `workspace-tabs.tsx` — Tab navigation (Overview, Literature, Files, Analysis, Documents)
- `overview-tab.tsx` — Project overview and stats
- `literature-tab.tsx` — Literature management
- `files-tab.tsx` — File browser and management
- `analysis-tab.tsx` — Data analysis execution
- `documents-tab.tsx` — Document list and creation

**Editor Components:**
- `rich-text-editor.tsx` — TipTap-based editor with formatting
- `editor/` directory with editor-specific components

**Literature Components:**
- `synthesis-wizard.tsx` — Literature synthesis workflow

**File Management:**
- `file-preview-modal.tsx` — File preview dialog

**Project Components:**
- `project-card.tsx` — Individual project card
- `project-filters.tsx` — Filter and sort controls

**UI Components (Shadcn):**
- Button, Dropdown Menu, Badge, Dialog, Input, Skeleton, Avatar, Card

**New Project:**
- `new-project-dialog.tsx` — Project creation modal

**Research Manager:**
- `onboarding-chat.tsx` — AI-powered onboarding chat
- `chat-bubble.tsx` — Chat message component

### Project Structure

```
research-ui/
├── app/
│   ├── (app)/              # Main app routes
│   │   ├── dashboard/      # Dashboard page
│   │   ├── projects/       # Project routes
│   │   │   ├── [id]/       # Project workspace
│   │   │   │   ├── doc/[docId]/  # Document editor
│   │   │   │   └── _components/  # Tab components
│   │   │   └── _components/      # Project list components
│   │   └── settings/       # Settings page
│   ├── (auth)/             # Authentication routes
│   ├── (onboarding)/       # Onboarding flow
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Global styles
├── components/
│   ├── editor/             # Editor components
│   ├── layout/             # Layout components
│   ├── literature/         # Literature components
│   ├── research-manager/   # AI assistant components
│   ├── ui/                 # Shadcn UI components
│   └── *.tsx               # Other shared components
├── lib/                    # Utilities
└── public/                 # Static assets
```

### Architecture Decisions

1. **Next.js App Router**: Chosen for superior performance, SEO, and file-based routing
2. **Shadcn UI**: Provides accessible, customizable components without overhead
3. **Bento-grid layout**: Modern, flexible grid system for dashboard organization
4. **Inter font**: Clean, highly readable sans-serif for professional appearance
5. **Green palette**: Differentiates from typical SaaS blues, suggests growth/knowledge

### Integration Status

**Backend Connection:**
- Location: `/home/zemul/Programming/research/backend/`
- Framework: FastAPI
- Status: Existing backend, needs integration testing with new frontend

**API Endpoints to Connect:**
- `/api/projects` — Project CRUD
- `/api/documents` — Document management
- `/api/literature` — Literature search and storage
- `/api/files` — File upload/download
- `/api/analysis` — Data analysis execution
- `/api/chat` — AI assistant
- `/ws/{project_id}` — WebSocket for real-time updates

## Remaining Work (Phase 22-07)

### Visual Tweaks
- [ ] Fine-tune spacing and padding throughout
- [ ] Verify color contrast ratios
- [ ] Add micro-animations for polish
- [ ] Test hover states across all components

### Pages to Complete
- [ ] Memory view — information graph visualization
- [ ] Enhanced analysis view with code execution display
- [ ] Enhanced literature view with PDF preview
- [ ] Settings page — complete all sections

### Responsive Design
- [ ] Test at 375px (mobile)
- [ ] Test at 768px (tablet)
- [ ] Test at 1280px+ (desktop)
- [ ] Adjust breakpoints as needed

### Backend Integration
- [ ] Connect all API calls to FastAPI backend
- [ ] Implement WebSocket for real-time updates
- [ ] Add error handling and loading states
- [ ] Test end-to-end workflows

### QA Testing
- [ ] All 10 core user flows
- [ ] Cross-browser compatibility
- [ ] Performance testing
- [ ] Accessibility audit

## Deviations from Original Plan

**Original Plan (22-06):** Redesign entire UX based on Hellycopter PRD

**Actual Execution:**
- Created entirely new Next.js project in `research-ui/` instead of modifying `frontend3/`
- Built comprehensive component library with Shadcn UI
- Implemented more pages than originally scoped
- Design evolved through iterative refinement

**Rationale:**
- Clean slate approach allowed for better architecture
- Next.js App Router provides superior foundation vs. Vite SPA
- Shadcn UI components reduce custom code maintenance
- Parallel development kept existing frontend functional

## Metrics

**Files Created:** 30+ TypeScript/TSX files
**Lines of Code:** ~5,000+ (est.)
**Design Components:** 20+ custom components
**Pages:** 9+ routes
**Duration:** 6 days (Feb 12 → Feb 18, 2026)

## Self-Check

✅ UX redesign with Hellycopter v2 design system
✅ Modern bento-grid layout implemented
✅ Pistachio/mint palette applied
✅ All major page templates created
✅ Component library established (Shadcn UI)
⏳ Backend integration pending (Phase 22-07)
⏳ Visual polish and refinement pending (Phase 22-07)
⏳ Responsive design verification pending (Phase 22-07)

**Status:** ~80% complete — ready for Phase 22-07 (finish pages and validate)
