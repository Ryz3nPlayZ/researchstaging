# Phase 10: Frontend Foundation & Setup - Context

**Phase:** 10 - Frontend Foundation & Setup
**Milestone:** v1.1 Frontend Integration & Polish
**Created:** 2026-02-06
**Discovery Level:** Level 1 (Light Discovery - 5-10 focused searches)

## Purpose

Integrate the new React 19 + TypeScript + Vite frontend (extracted from `researchai-workspace.zip`) with the existing FastAPI backend. This phase establishes the build system, verifies UI configuration, and sets up the development environment proxy.

## Discovery Summary

### frontend3/ Structure Analysis

**Project Configuration:**
- **Framework:** React 19.2.4 + TypeScript 5.8.2 + Vite 6.2.0
- **Build Tool:** Vite (not Create React App)
- **Port:** 3000 (configured in vite.config.ts)
- **Path Alias:** `@/*` → project root

**Dependencies (from package.json):**
```json
{
  "dependencies": {
    "@google/genai": "^1.40.0",  // Direct Gemini API - will be replaced
    "react": "^19.2.4",
    "react-dom": "^19.2.4"
  },
  "devDependencies": {
    "@types/node": "^22.14.0",
    "@vitejs/plugin-react": "^5.0.0",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}
```

**File Structure:**
```
frontend3/
├── App.tsx                    # Main app with state-based routing
├── index.tsx                  # React DOM entry point
├── index.html                 # HTML with Tailwind CDN + importmap
├── types.ts                   # TypeScript interfaces (View, FileData, Paper, ChatMessage)
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies and scripts
├── components/
│   └── Sidebar.tsx            # Navigation sidebar with Material Symbols
└── pages/
    ├── DashboardView.tsx      # Dashboard view (mock data)
    ├── FilesView.tsx          # File explorer (mock data)
    ├── LibraryView.tsx        # Literature search (mock data)
    └── EditorView.tsx         # Document editor with contentEditable (not TipTap)
```

**Total TSX Files:** 7 files (minimal, focused structure)

### UI Configuration

**Tailwind CSS:**
- **Loading Method:** CDN (not npm-installed)
- **CDN URL:** `https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio`
- **Configuration:** Inline `tailwind.config` object in index.html
- **Primary Color:** `#4a8fe3` (blue)
- **Background Colors:** Light `#f6f7f8`, Dark `#121820`
- **Font Family:** Inter (Google Fonts)
- **Dark Mode:** Enabled via `darkMode: 'class'`

**Material Symbols Icons:**
- **Font:** Material Symbols Outlined (Google Fonts)
- **Loading:** CDN link in index.html
- **Variants:**Outlined (FILL 0), Filled (FILL 1)
- **Usage:** `<span class="material-symbols-outlined">icon_name</span>`

**Custom Styling:**
- Custom scrollbar styling (6px width, rounded thumb)
- Antialiasing enabled
- Slate color palette for text and borders

### Backend Integration Points

**Backend API Structure (from server.py):**
```
/api
├── auth/          # Authentication endpoints
├── projects/      # Project CRUD
├── files/         # File management (file_api.py)
├── documents/     # Document CRUD (document_api.py)
├── literature/    # Literature search (literature_api.py)
├── citations/     # Citation formatting (citation_api.py)
├── chat/          # Multi-agent chat (chat_api.py)
├── analysis/      # Data analysis execution (analysis_api.py)
├── export/        # PDF/DOCX export (export_api.py)
└── memory/        # Information graph queries (memory_api.py)
```

**Backend Configuration:**
- **Port:** 8000
- **CORS:** Configured via `CORS_ORIGINS` environment variable
- **Existing Frontend:** Uses port 5173 (CRA with craco)
- **Frontend3:** Uses port 3000 (Vite)

**Environment Variables:**
```
backend/.env:
- CORS_ORIGINS=http://localhost:5173,http://localhost:3000
- DATABASE_URL, REDIS_URL, LLM provider keys

frontend/.env (existing):
- REACT_APP_BACKEND_URL=http://localhost:8000

frontend3/.env (to be created):
- VITE_API_URL=http://localhost:8000
```

### Current Data Flow (Mock)

**Frontend3 currently:**
- Uses hardcoded mock data in all views
- Direct Gemini API calls via `@google/genai` package
- No backend API integration
- State-based routing (activeView state in App.tsx)

**What needs to change (in later phases):**
- Replace mock data with real API calls to `/api/*` endpoints
- Remove `@google/genai` dependency, use `/api/chat` instead
- Replace `contentEditable` with TipTap editor in EditorView
- Add authentication flow
- Add file upload functionality
- Add WebSocket connection for real-time updates

### Key Differences: frontend/ vs frontend3/

| Aspect | frontend/ (v1.0) | frontend3/ (v1.1) |
|--------|-----------------|-------------------|
| Build Tool | Create React App (craco) | Vite |
| Port | 5173 | 3000 |
| Routing | React Router DOM | State-based (activeView) |
| Icons | Lucide React | Material Symbols |
| UI Library | Radix UI (Shadcn) | Custom components |
| Styling | npm Tailwind + plugins | CDN Tailwind |
| Editor | TipTap (fully integrated) | contentEditable div (placeholder) |
| API Integration | ✅ Connected to backend | ❌ Mock data only |
| File Structure | Large (100+ components) | Small (7 TSX files) |
| TypeScript | Partial (JS + some TS) | Full TypeScript |

## Implementation Approach

### Phase 10 Breakdown

**Plan 10-01: Initialize frontend project and configure build system**
- Install dependencies (npm install)
- Verify Vite dev server starts on port 3000
- Verify production build succeeds
- **Why:** Validate that frontend3/ builds successfully in our environment

**Plan 10-02: Configure Tailwind CSS and Material Symbols integration**
- Verify Tailwind CSS configuration (CDN, custom theme)
- Verify Material Symbols font loading
- Create visual test file (TEST_STYLES.html)
- **Why:** Confirm UI infrastructure is properly configured (verification only, no changes)

**Plan 10-03: Set up development environment proxy to FastAPI backend**
- Add Vite proxy configuration to vite.config.ts
- Create frontend3/.env with VITE_API_URL
- Update backend CORS_ORIGINS to include port 3000
- Create API client utility (frontend3/lib/api.ts)
- **Why:** Enable API communication between frontend and backend during development

### Wave Assignment

All 3 plans are **Wave 1** (parallel execution):
- **No dependencies** between plans
- **No file conflicts** (different files: package.json, index.html, vite.config.ts)
- **Autonomous** (no checkpoints)
- Can be executed in parallel by gsd:execute-phase

## Decisions Made

1. **Keep CDN-based Tailwind:** No npm install needed, faster setup, matches researchai-workspace.zip design
2. **Use Vite proxy:** Standard pattern for development, avoids CORS issues
3. **Port 3000 for frontend3:** Avoids conflict with existing frontend/ (5173) and backend (8000)
4. **Material Symbols over Lucide:** Matches new design, better icon variety
5. **State-based routing:** Simpler than React Router for this phase, can add router later if needed

## Technical Debt Notes

**From frontend3/ (not our code):**
- Uses `contentEditable` instead of TipTap (will replace in Phase 11)
- Direct Gemini API calls (will replace in Phase 11)
- Mock data throughout (will replace in Phase 11)
- No error handling or loading states
- No TypeScript strict mode (could enable later)

**From v1.0 (existing frontend/):**
- ESLint warnings in 4 files (to address in Phase 14)
- In-memory chat storage (documented in STATE.md)

## Risks & Mitigations

**Risk 1:** Vite proxy might not work with WebSocket connections
- **Mitigation:** WebSocket configured separately in later phases (Phase 13)

**Risk 2:** CDN-based Tailwind might cause flicker or load issues
- **Mitigation:** TEST_STYLES.html verifies CDN loads correctly; can switch to npm if needed

**Risk 3:** TypeScript configuration might be too loose
- **Mitigation:** Current config works; strict mode can be enabled in Phase 14 if needed

**Risk 4:** Material Symbols might not render consistently
- **Mitigation:** Test file verifies both outlined and filled variants render

## Success Criteria (from ROADMAP.md)

Phase 10 succeeds when:
1. ✅ Development server runs on port 3000 without errors
2. ✅ Frontend displays the new UI (Dashboard, Files, Library, Editor views render)
3. ✅ Material Symbols icons load and display correctly
4. ✅ Tailwind CSS custom theme matches frontend3 design (primary color #4a8fe3)
5. ✅ Vite build completes successfully with TypeScript compilation

## Coverage

**Requirements covered:** FRONT-01, FRONT-02, FRONT-03, FRONT-04, FRONT-05, FRONT-06 (6 requirements)
- FRONT-01: Frontend project initialized ✅ (Plan 10-01)
- FRONT-02: Build system configured ✅ (Plan 10-01)
- FRONT-03: Development environment proxy configured ✅ (Plan 10-03)
- FRONT-04: Material Symbols integrated ✅ (Plan 10-02)
- FRONT-05: Tailwind CSS configured ✅ (Plan 10-02)
- FRONT-06: Development server runs ✅ (Plan 10-01)

**Unmapped requirements:** None - all Phase 10 requirements covered

---

**Discovery completed:** 2026-02-06
**Ready for execution:** Yes (all 3 plans created)
**Next phase:** Phase 11 - View Integration (FRONT-07 through FRONT-11)
