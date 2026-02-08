# Phase 17: WebSocket Connection Fixes - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix WebSocket connection to use correct backend port. The WebSocket currently connects to `ws://localhost:3000/api/ws/{projectId}` (frontend port) but should connect to `ws://localhost:8000/ws/{projectId}` (backend port). Vite proxy doesn't handle WebSocket upgrades correctly.

**This is an infrastructure fix** - we're fixing broken connectivity, not adding new capabilities. Real-time features (task updates, document collaboration) already exist from v1.0 but don't work due to connection issues.

</domain>

<decisions>
## Implementation Decisions

### Connection approach
- Use direct WebSocket URL to backend (`ws://localhost:8000/ws/{projectId}`), NOT through Vite proxy
- Proxy approach is problematic: requires complex proxy configuration, doesn't work well with WebSocket upgrades
- Direct connection is simpler and more reliable
- In production, the backend URL would come from environment variable (already have `VITE_API_URL` pattern)

### URL construction
- Build WebSocket URL from `VITE_API_URL` environment variable
- Replace `http://` → `ws://` and `https://` → `wss://`
- Add `/ws/{projectId}` path
- This works for both local development and production

### Error handling
- Keep existing auto-reconnect with 3-second delay (already implemented)
- Show connection status indicator (already exists: Live/Connecting/Offline)
- Don't spam console with errors during reconnection attempts
- If connection fails after ~5 attempts, show user-friendly message but don't block app functionality

### Connection lifecycle
- Connect when `currentProjectId` becomes available (already implemented via ProjectContext)
- Disconnect when component unmounts (already implemented)
- Reconnect when project switches (already implemented)
- Keep existing 30-second ping/pong heartbeat (already implemented)

### Claude's Discretion
- Exact retry limit before showing user message
- Console log formatting (reduce noise during reconnection)
- Whether to add a manual "reconnect" button in offline state

</decisions>

<specifics>
## Specific Ideas

- Use the same `VITE_API_URL` pattern that other API calls use for consistency
- WebSocket URL construction: `const wsUrl = API_BASE.replace('http://', 'ws://').replace('https://', 'wss://')`
- Reuse existing `useProjectContext` to get `currentProjectId` for connection

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 17-websocket-fixes*
*Context gathered: 2026-02-07*
