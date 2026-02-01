# Remaining Iterations Plan (4-15)

## Phase 1: Complete Task Graph (Iterations 4-5)

### Iteration 4: Improve Graph Layout
**Current Issue**: Simple grid layout may not show DAG structure clearly
**Solution**: Implement hierarchical layout algorithm
**Benefits**:
- Better visualization of task dependencies
- Reduce edge crossings
- Clearer flow from left to right

### Iteration 5: Polish Task Graph
- Add edge labels for dependency types
- Improve node styling
- Add zoom/pan controls
- Test with various project sizes

## Phase 2: Build Agent Graph (Iterations 6-10)

### Iteration 6: Design Agent Architecture
- Define agent hierarchy structure
- Map agent types and relationships
- Design static architecture diagram

### Iteration 7: Create AgentGraph Component
- Build separate component from TaskGraph
- Implement hierarchical node layout
- Add agent-specific visual design

### Iteration 8: Implement Orchestration Visualization
- Show active agents vs idle agents
- Display agent communication flow
- Add real-time status updates

### Iteration 9: Connect to Backend
- Fetch agent state from backend
- Implement WebSocket updates
- Handle agent lifecycle events

### Iteration 10: Test and Polish
- Verify with real projects
- Add animations
- Improve UX

## Phase 3: Build File Explorer (Iterations 11-15)

### Iteration 11: Design File Data Structure
- Define file/folder schema
- Connect to backend file storage
- Design tree component structure

### Iteration 12: Create FileExplorer Component
- Build recursive tree component
- Implement expand/collapse
- Add file icons

### Iteration 13: Implement File Operations
- Create folder
- Upload file
- Delete file
- Rename file

### Iteration 14: Add File Preview Panel
- Display file content
- Support multiple file types (PDF, MD, etc.)
- Implement syntax highlighting for code

### Iteration 15: Integration and Testing
- Integrate FileExplorer into Workspace
- Connect file selection to viewer
- End-to-end testing
