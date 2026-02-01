# Workspace UI Rework - Implementation Plan

## Goal
Rework the workspace UI with 3 phases:
1. Fix Task Graph (clean DAG visualization)
2. Build Agent Graph (multi-agent orchestration architecture)
3. Build File Explorer (VS Code-like hierarchical structure)

## Current Issues
- Task Graph: "source handle id: undefined" errors
- Agent Graph: Not showing proper architecture
- File Explorer: Doesn't exist

## 15 Iteration Plan

### Phase 1: Fix Task Graph (Iterations 1-5)
**Iteration 1**: Examine current implementation, identify root cause
**Iteration 2**: Fix node/edge data mapping
**Iteration 3**: Simplify graph layout algorithm
**Iteration 4**: Improve visual design and status indicators
**Iteration 5**: Test with real project data

### Phase 2: Build Agent Graph (Iterations 6-10)
**Iteration 6**: Design agent hierarchy structure
**Iteration 7**: Create AgentGraph component
**Iteration 8**: Implement orchestration visualization
**Iteration 9**: Add real-time updates via WebSocket
**Iteration 10**: Polish and test

### Phase 3: Build File Explorer (Iterations 11-15)
**Iteration 11**: Design file tree data structure
**Iteration 12**: Create FileExplorer component
**Iteration 13**: Implement expand/collapse functionality
**Iteration 14**: Add file preview panel
**Iteration 15**: Integrate and test end-to-end

## Progress

### Iteration 1 ✅ COMPLETE
**Issue Identified**: TaskNode and AgentNode components don't have React Flow `Handle` components, causing "source handle id: undefined" errors.

**Root Cause**:
- Nodes are rendered without Handles (connection points)
- Edges try to connect but can't find valid handles
- Backend data is correct (27 edges, 18 nodes, all IDs valid)

**Solution**: Add Handle components to TaskNode and AgentNode

### Iteration 2 ✅ COMPLETE
**Changes Made**:
- Added `Handle` import from reactflow
- Added target Handle (Position.Left for TaskNode, Position.Top for AgentNode)
- Added source Handle (Position.Right for TaskNode, Position.Bottom for AgentNode)
- Styled handles with proper visibility (bg-gray-400, border-2, border-white)
- Added 'ready' status config for better task state visualization

**Result**: Frontend compiles successfully, no more "source handle id: undefined" errors expected

### Iteration 3 ✅ SKIPPED
Waiting for user to refresh browser and verify

### Iteration 4 ✅ COMPLETE
**Changes Made** (Backend):
- Implemented phase-based hierarchical layout algorithm
- Tasks grouped by phase and centered vertically
- Dynamic edge coloring based on task status:
  - Green: completed tasks
  - Blue: running tasks
  - Red: failed tasks
  - Slate: default
- Animate edges when data flows (running → ready)
- Increased spacing: 350px horizontal, 150px vertical

**Result**: Better DAG visualization with clearer hierarchy

- [x] Iteration 1: Examine current state ✅
- [x] Iteration 2: Add Handles to nodes ✅
- [x] Iteration 3: Test with real data ⏭️ Skipped (pending user verification)
- [x] Iteration 4: Improve graph layout ✅
- [ ] Iteration 5: Final polish and testing
- [ ] Iteration 6-15: Remaining
