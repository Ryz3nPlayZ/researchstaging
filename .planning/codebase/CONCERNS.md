# Codebase Concerns

**Analysis Date:** 2026-01-26

## Tech Debt

**Incomplete API Integration:**
- Issue: Store methods have TODO comments instead of actual API implementations
- Files: `/home/zemul/Programming/research/frontend-v2/src/stores/useCreditStore.ts:43`, `/home/zemul/Programming/research/frontend-v2/src/stores/useAuthStore.ts:50`
- Impact: Authentication and credit management are non-functional stubs
- Fix approach: Implement API calls to backend endpoints for login/logout and credit fetching

**TypeScript Type Safety Issues:**
- Issue: Use of `any` type in multiple locations bypasses type checking
- Files: `/home/zemul/Programming/research/frontend-v2/src/services/api.ts:22`, `/home/zemul/Programming/research/frontend-v2/src/pages/ConversationalPlanning.tsx:141`
- Impact: Loss of type safety increases runtime error risk
- Fix approach: Define proper types for API responses and plan output types

**Mock Test File:**
- Issue: Test file contains default create-react-app placeholder test
- Files: `/home/zemul/Programming/research/frontend-v2/src/App.test.tsx`
- Impact: No actual test coverage, gives false sense of testing
- Fix approach: Write real tests for App component routing and layout

**Excessive Console Logging:**
- Issue: Debug console.log statements throughout production code
- Files: `/home/zemul/Programming/research/frontend-v2/src/stores/useCreditStore.ts:43`, `/home/zemul/Programming/research/frontend-v2/src/stores/useAuthStore.ts:50`, `/home/zemul/Programming/research/frontend-v2/src/pages/ConversationalPlanning.tsx:64,109,170`, `/home/zemul/Programming/research/frontend-v2/src/pages/HomeDashboard.tsx:91,116`
- Impact: Clutters console, potential performance impact, information leakage in production
- Fix approach: Replace with proper logging library or remove entirely

**Empty Error Catch Blocks:**
- Issue: Try-catch blocks with empty catch clauses in MessageBubble
- Files: `/home/zemul/Programming/research/frontend-v2/src/components/chat/MessageBubble.tsx:32`
- Impact: Timestamp parsing errors silently swallowed
- Fix approach: Add error logging or fallback behavior

**Component Size:**
- Issue: Large component files with 300+ lines
- Files: `/home/zemul/Programming/research/frontend-v2/src/pages/HomeDashboard.tsx:330`, `/home/zemul/Programming/research/frontend-v2/src/pages/ConversationalPlanning.tsx:247`
- Impact: Reduced maintainability, harder to test, violates single responsibility
- Fix approach: Extract child components and custom hooks

## Known Bugs

**No Known Bugs:**
- Status: No specific bugs identified in current frontend-v2 codebase
- Note: Code is relatively new and under active development

## Security Considerations

**API Keys in Environment Files:**
- Risk: Real API keys stored in backend/.env file
- Files: `/home/zemul/Programming/research/backend/.env` contains OPENAI_API_KEY, GEMINI_API_KEY, MISTRAL_API_KEY, GROQ_API_KEY, OPENROUTER_API_KEY
- Current mitigation: File exists in repository (should be gitignored)
- Recommendations: Ensure .env is in .gitignore, rotate all exposed API keys, use .env.template only

**Weak JWT Secret:**
- Risk: Default JWT_SECRET_KEY is weak developer key
- Files: `/home/zemul/Programming/research/backend/.env:JWT_SECRET_KEY=dev-secret-key-change-in-production-12345678`
- Current mitigation: Documented as needing change in production
- Recommendations: Generate strong random secret, require from environment, fail fast if not set

**localStorage for Auth Tokens:**
- Risk: Authentication tokens stored in localStorage (XSS vulnerable)
- Files: `/home/zemul/Programming/research/frontend-v2/src/services/api.ts:54`, `/home/zemul/Programming/research/frontend-v2/src/stores/useAuthStore.ts:54,65`
- Current mitigation: None
- Recommendations: Use httpOnly cookies or implement secure token storage with CSRF protection

**No Token Expiration Handling:**
- Risk: No refresh token logic or expiration checking visible
- Files: `/home/zemul/Programming/research/frontend-v2/src/services/api.ts` (getAuthHeader function)
- Current mitigation: None
- Recommendations: Implement token refresh mechanism, handle 401 responses with re-authentication

**Hardcoded Backend URL:**
- Risk: API_BASE_URL falls back to localhost without validation
- Files: `/home/zemul/Programming/research/frontend-v2/src/services/api.ts:13`
- Current mitigation: Uses REACT_APP_API_URL env var if set
- Recommendations: Validate URL on startup, provide clear error if not configured

**Email in Environment:**
- Risk: Email address exposed in .env.template
- Files: `/home/zemul/Programming/research/backend/.env.template:60` (UNPAYWALL_EMAIL)
- Current mitigation: None documented
- Recommendations: Document that this should be replaced, is acceptable for API registration

## Performance Bottlenecks

**No Optimistic UI Updates:**
- Problem: All API calls block UI until response
- Files: `/home/zemul/Programming/research/frontend-v2/src/pages/ConversationalPlanning.tsx:75-122`
- Cause: No immediate state updates before API calls
- Improvement path: Implement optimistic updates with rollback on error

**Uncontrolled Re-renders:**
- Problem: Components may re-render unnecessarily on store changes
- Files: `/home/zemul/Programming/research/frontend-v2/src/pages/HomeDashboard.tsx` (useProjectStore without selectors)
- Cause: Zustand stores accessed without selectors, triggers render on any state change
- Improvement path: Use selectors to subscribe only to needed state slices

**No Request Debouncing:**
- Problem: Auto-save in Workspace not debounced
- Files: `/home/zemul/Programming/research/frontend/src/components/layout/Workspace.jsx:179-190`
- Cause: Direct API call on every content change
- Improvement path: Implement debounce with 500-1000ms delay

**No Code Splitting:**
- Problem: All components loaded in initial bundle
- Files: `/home/zemul/Programming/research/frontend-v2/src/App.tsx` (no React.lazy visible)
- Cause: No lazy loading routes or heavy components
- Improvement path: Implement React.lazy for pages, especially ConversationalPlanning and HomeDashboard

**Missing React.memo:**
- Problem: Child components re-render when parent updates
- Files: Chat components, layout components
- Cause: No memoization of expensive component renders
- Improvement path: Add React.memo to MessageBubble, PlanReviewCard, and other frequent-render components

## Fragile Areas

**Planning Flow State Machine:**
- Files: `/home/zemul/Programming/research/frontend-v2/src/pages/ConversationalPlanning.tsx:38-72`
- Why fragile: Complex useEffect initialization with error handling, multiple interdependent states (messages, sessionId, planSummary, isLoading)
- Safe modification: Extract initialization to custom hook, add comprehensive error boundaries
- Test coverage: No tests for initialization failure, missing research goal, or API error scenarios

**Navigation State Passing:**
- Files: `/home/zemul/Programming/research/frontend-v2/src/pages/ConversationalPlanning.tsx:36`, `/home/zemul/Programming/research/frontend-v2/src/pages/HomeDashboard.tsx:97-116`
- Why fragile: Relies on useLocation state which is lost on page refresh
- Safe modification: Store research_goal in sessionStorage or URL query params
- Test coverage: No tests for direct navigation to /plan route, refresh scenarios

**API Error Handling:**
- Files: `/home/zemul/Programming/research/frontend-v2/src/services/api.ts:32-48`
- Why fragile: Generic error handling, may not catch all edge cases (non-JSON responses, network failures)
- Safe modification: Add specific handling for network errors, timeout errors, parse errors
- Test coverage: No tests for various API failure scenarios

**Type Safety Gaps:**
- Files: Multiple files using `any` type or loose typing
- Why fragile: Type errors only caught at runtime, bypasses TypeScript benefits
- Safe modification: Create comprehensive type definitions for all API contracts
- Test coverage: No TypeScript strict mode enabled

**WebSocket Integration (Frontend):**
- Files: `/home/zemul/Programming/research/frontend/src/lib/api.js:48-96`
- Why fragile: No reconnection logic, manual ping interval, error handling may not cover all cases
- Safe modification: Add automatic reconnection with exponential backoff, connection health monitoring
- Test coverage: No tests for WebSocket lifecycle, connection failure scenarios

## Scaling Limits

**Single Frontend Instance:**
- Current capacity: Single React application instance
- Limit: Cannot scale frontend horizontally without session management
- Scaling path: Ensure stateless design, implement distributed session storage

**No Request Caching:**
- Current capacity: No caching layer for API responses
- Files: `/home/zemul/Programming/research/frontend-v2/src/services/api.ts` (no caching logic)
- Limit: Repeated requests to backend for same data
- Scaling path: Implement React Query caching with proper cache invalidation

**No Pagination:**
- Current capacity: Lists load all items at once
- Files: Project lists in HomeDashboard, no pagination parameters visible
- Limit: UI breaks with large datasets (>100 items)
- Scaling path: Implement pagination, infinite scroll, or virtual lists

**No Lazy Loading for Images:**
- Current capacity: All images loaded immediately
- Limit: Poor performance with many images
- Scaling path: Implement lazy loading for paper thumbnails, profile images

**WebSocket Connection Limit:**
- Current capacity: One WebSocket per project
- Files: `/home/zemul/Programming/research/frontend/src/lib/api.js:49`
- Limit: Browser connection limits (~6 per domain), memory issues with many projects
- Scaling path: Implement multiplexing over single connection, close unused connections

## Dependencies at Risk

**React 19.2.3:**
- Risk: Very recent React version, may have bugs or breaking changes
- Files: `/home/zemul/Programming/research/frontend-v2/package.json:26-27`
- Impact: Potential stability issues, ecosystem incompatibility
- Migration plan: Monitor React issues, consider pinning to 19.0.x stable release

**TypeScript 4.9.5:**
- Risk: Outdated TypeScript version (current is 5.x)
- Files: `/home/zemul/Programming/research/frontend-v2/package.json:32`
- Impact: Missing newer type features, potential bug fixes
- Migration plan: Upgrade to TypeScript 5.x, test thoroughly for breaking changes

**React Router DOM 7.13.0:**
- Risk: Major version 7 with potential breaking changes from v6
- Files: `/home/zemul/Programming/research/frontend-v2/package.json:28`
- Impact: Routing behavior may change, migration needed from v6 patterns
- Migration plan: Review v7 migration guide, test all navigation flows

**react-scripts 5.0.1:**
- Risk: Aging build tool with webpack 4 under the hood
- Files: `/home/zemul/Programming/research/frontend-v2/package.json:29`
- Impact: Slower builds, missing optimizations, security vulnerabilities
- Migration plan: Migrate to Vite for faster builds and better developer experience

**No ESLint Configuration:**
- Risk: No linting to catch code quality issues
- Files: No .eslintrc or eslint.config.* found in frontend-v2
- Impact: Code quality degrades over time, inconsistent style, potential bugs
- Migration plan: Add ESLint with TypeScript, React, and accessibility rules

## Missing Critical Features

**No Error Boundaries:**
- Problem: No React error boundaries to catch component errors
- Files: App.tsx lacks ErrorBoundary components
- Blocks: Graceful error handling, crashes show white screen of death

**No Loading States:**
- Problem: No global loading state or skeleton screens
- Files: Pages have local isLoading but no coordinated loading UX
- Blocks: Poor user experience during data fetching, no indication of activity

**No Form Validation:**
- Problem: Research goal input lacks validation
- Files: HomeDashboard.tsx input for research goal
- Blocks: Empty or invalid submissions, poor UX feedback

**No Toast Notifications:**
- Problem: No notification system for user feedback
- Files: No toast/alert implementation in frontend-v2
- Blocks: User feedback for actions (save, error, success)

**No Offline Support:**
- Problem: No service worker or offline capabilities
- Files: No service worker registration
- Blocks: Usage without internet, poor PWA experience

**No Accessibility Testing:**
- Problem: No a11y tests or axe-core integration
- Files: No accessibility test files
- Blocks: Compliance with accessibility standards, exclusion of users with disabilities

## Test Coverage Gaps

**No Frontend Tests:**
- What's not tested: All frontend-v2 components, pages, hooks, services
- Files: Only `/home/zemul/Programming/research/frontend-v2/src/App.test.tsx` exists (placeholder)
- Risk: Regressions go undetected, refactoring is dangerous
- Priority: High

**No Integration Tests:**
- What's not tested: API service integration, store interactions, navigation flows
- Files: No test files for services or stores
- Risk: Broken API contracts, state management bugs
- Priority: High

**No E2E Tests:**
- What's not tested: Critical user flows (create project, execute pipeline, view results)
- Files: No Playwright or Cypress configuration
- Risk: Broken user journeys, integration failures
- Priority: Medium

**No Type Testing:**
- What's not tested: TypeScript type assertions, API contract types
- Files: No type testing or validation
- Risk: Type mismatches caught only at runtime
- Priority: Medium

**No Visual Regression Tests:**
- What's not tested: UI appearance, responsive design, design token application
- Files: No screenshot or visual testing tools
- Risk: Unexpected UI changes, broken layouts
- Priority: Low

---

*Concerns audit: 2026-01-26*
