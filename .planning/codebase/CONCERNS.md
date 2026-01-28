# CONCERNS

**Generated:** 2026-01-27
**Scope:** Technical debt, known issues, and areas of concern

---

## High Priority Issues

### Frontend V2 Visual Design Mismatch

**Location:** `frontend-v2/src/pages/`

**Issue:** All 5 frontend screens (GreetingHome, ActiveChat, ProjectWorkspace, TaskGraphView, AgentGraphView) don't match the pencil-halo.pen design specifications visually.

**User Feedback:** "horrendous" - despite compiling successfully, screens don't match design expectations.

**Root Causes:**
- Using inline SVGs instead of Lucide icon fonts (as specified in pencil design)
- Spacing/padding values don't match design specs (e.g., main content should be 64px, not 16px)
- Typography sizes and weights incorrect
- Components not extracted from reusable design system components
- Some hardcoded colors instead of design tokens

**Plan:** `.planning/phases/01-frontend-foundation/02-Fix-Screens-to-Pencil-Design-PLAN.md` created to address this.

**Impact:** Blocks all frontend visual work until fixed.

---

### Missing API Integration

**Location:** `frontend-v2/src/services/planning.ts`

**Issue:** Multiple TODO comments indicating mock data instead of real API calls:

```typescript
// TODO: Replace with actual API call when backend is ready
// TODO: Implement API call to fetch current credits
// TODO: Implement API call to authenticate
```

**Impact:** Frontend works with mock data but can't connect to backend. Needs:
- Project creation API
- Credit balance API
- Authentication API
- Project details API

**Severity:** Medium - frontend works with mocks but integration incomplete.

---

## Medium Priority Issues

### No Authentication Implementation

**Location:** `backend/`, `frontend-v2/src/stores/useAuthStore.ts`

**Issue:** Auth service structure exists (`backend/auth_service.py`, 302 lines) but:
- No actual authentication logic implemented
- Frontend auth store has TODO for API integration
- No user/session management
- Credits system depends on auth but neither work

**Impact:** Can't track users, enforce credit limits, or provide personalized experience.

---

### Incomplete Task Graph Visualization

**Location:** `frontend-v2/src/pages/TaskGraphView.tsx`, `frontend-v2/src/pages/AgentGraphView.tsx`

**Issue:** Task and Agent graph views use ReactFlow but:
- Graphs don't update in real-time
- No interactive features (click to view details, drag to rearrange)
- Static mock data
- No error handling for malformed graph data

**Impact:** Users can't monitor execution progress visually.

---

## Low Priority Issues

### Inconsistent Design Token Usage

**Location:** `frontend-v2/src/index.css`, various components

**Issue:** Design tokens defined in index.css but:
- Some components use hardcoded colors (e.g., Button.tsx uses `--color-primary` instead of `--primary`)
- Token naming inconsistent (`--color-*` vs `--*`)
- Navy color #0f172a mentioned in verification but should be #5749F4 (purple)

**Impact:** Maintenance burden, color inconsistencies.

---

### Missing Error Boundaries

**Location:** `frontend-v2/src/`

**Issue:** No React error boundaries to catch and handle component errors gracefully.

**Impact:** Application crashes show full error stack to users instead of friendly error UI.

---

### No Loading States

**Location:** All frontend pages

**Issue:** No skeleton screens or loading indicators while data fetches.

**Impact:** Poor user experience during data loading.

---

## Backend Concerns

### Large Server File

**Location:** `backend/server.py` (1,072 lines)

**Issue:** Monolithic server file contains all route handlers. Should be split into:
- `routes/projects.py`
- `routes/auth.py`
- `routes/credits.py`
- etc.

**Impact:** Hard to navigate, violates separation of concerns.

---

### No Database Migrations

**Location:** `backend/database/models.py`

**Issue:** SQLAlchemy models defined but:
- No Alembic migrations set up
- Schema changes require manual database manipulation
- No version control for database schema

**Impact:** Difficult to evolve database schema safely.

---

## Testing Gaps

### No Frontend Tests

**Location:** `frontend-v2/`

**Issue:** No test files found. No:
- Unit tests for components
- Integration tests for pages
- E2E tests with Playwright/Cypress

**Impact:** High risk of regressions during refactoring.

---

### Limited Backend Tests

**Location:** `backend/`

**Issue:** Testing tools installed (pytest) but no test files found.

**Impact:** Backend reliability unknown.

---

## Security Considerations

### No Rate Limiting

**Location:** `backend/server.py`

**Issue:** FastAPI routes have no rate limiting. Vulnerable to:
- API abuse
- DDoS attacks
- Credit exhaustion attacks

**Severity:** High - needs mitigation before production.

---

### No Input Validation

**Location:** `backend/` various endpoints

**Issue:** Pydantic models exist but may not validate all user inputs thoroughly.

**Impact:** Potential injection attacks or malformed data.

---

### Hardcoded Secrets Risk

**Location:** Not checked yet

**Issue:** Need to verify no API keys or secrets hardcoded in source code.

**Recommendation:** Run `grep -r "sk-\|api_key\|secret\|password" backend/ frontend-v2/`

---

## Performance Concerns

### No Caching Layer

**Location:** `backend/`

**Issue:** Redis installed (`redis[hiredis]>=5.0.0`) but no caching implementation.

**Impact:** Repeated expensive operations (LLM calls, database queries) not cached.

---

### Large Bundle Size

**Location:** `frontend-v2/`

**Issue:** No bundle analysis performed. May be shipping unnecessary code.

**Recommendation:** Run `npm run build -- --analyze` to check bundle size.

---

## Documentation Gaps

### No API Documentation

**Location:** `backend/`

**Issue:** FastAPI has `/docs` endpoint but no separate API documentation for frontend team.

**Impact:** Frontend-backend integration requires reading backend source code.

---

### Missing README

**Location:** Root directory

**Issue:** No project README explaining:
- How to start the application
- Architecture overview
- Development workflow
- Deployment process

**Impact:** Difficult onboarding for new developers.

---

## Technical Debt Summary

| Category | Count | Severity |
|----------|-------|----------|
| Visual Design Issues | 1 | High |
| Missing Features | 5 | Medium |
| Code Quality | 4 | Low |
| Testing | 2 | Medium |
| Security | 3 | High |
| Performance | 2 | Medium |
| Documentation | 2 | Low |

**Total:** 19 identified concerns

---

## Recommended Actions

**Immediate (this sprint):**
1. Fix frontend screens to match pencil design (plan already created)
2. Implement rate limiting on backend API
3. Add error boundaries to frontend

**Short-term (next 2 sprints):**
4. Complete authentication implementation
5. Add real API integration (replace mocks)
6. Set up database migrations
7. Split monolithic server.py into route modules

**Long-term:**
8. Add comprehensive testing (frontend and backend)
9. Implement caching layer
10. Improve documentation (API docs, README)
