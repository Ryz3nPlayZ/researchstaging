# Phase 17: WebSocket Connection Fixes - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

## Phase Boundary

Fix WebSocket connection to use correct backend port. The WebSocket currently connects to `ws://localhost:3000/api/ws/{projectId}` (frontend port) but should connect to `ws://localhost:8000/ws/{projectId}` (backend port). Vite proxy doesn't handle WebSocket upgrades correctly.

**This is an infrastructure fix** - we're fixing broken connectivity, not adding new capabilities.

---

## Decisions

### Connection approach
**Direct to backend (not through Vite proxy)**

- Use direct WebSocket URL: `ws://localhost:8000/ws/{projectId}`
- Derive URL from `VITE_API_URL` environment variable
- URL construction: `VITE_API_URL.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws/' + projectId`
- This matches the pattern used by other API calls

### Error handling
**Reduce noise, keep auto-reconnect**

- Keep retrying indefinitely (WebSocket should persist connection)
- Only log when connection state changes (not every retry attempt)
- Rely on existing status indicator (Live/Connecting/Offline dot)
- No "Reconnected!" toast - status indicator is sufficient
- No user-facing error messages for connection failures

### Fallback behavior
**App works offline, real-time features disabled**

- App continues working when WebSocket fails
- Status indicator shows offline state
- Real-time features (task updates, document collaboration) won't update
- No blocking errors or warnings
- No manual reconnect button (auto-reconnect is sufficient)

### Connection lifecycle
**Keep existing behavior, just fix the URL**

- Connect immediately when `currentProjectId` is available
- On project switch: disconnect old connection, then connect new one
- Keep connection alive when app is in background (standard behavior)
- No manual toggle or disconnect button

---

## Implementation Notes

### What to change
1. In `lib/websocket.ts`, change the URL construction to use direct backend URL
2. Reduce console logging for reconnection attempts
3. Test that connection status indicator works correctly

### What to keep
- Existing auto-reconnect logic (3-second delay)
- Existing ping/pong heartbeat (30-second interval)
- Existing status indicator (Live/Connecting/Offline dot)
- Existing ProjectContext integration

---

*Phase: 17-websocket-fixes*
*Context gathered: 2026-02-07*
