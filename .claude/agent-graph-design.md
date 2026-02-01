# Agent Graph Design - Iteration 6/15

## Purpose
Visualize the multi-agent orchestration architecture showing how different agents coordinate.

## Agent Types (from agentteam.md)

### 1. Orchestrator (Main Session)
- **Role**: Overall project coordination, planning, delegation
- **Color**: Purple
- **Position**: Top of hierarchy

### 2. Executor Agents (gsd-executor)
- **Role**: Execute PLAN.md files with specific tasks
- **Color**: Blue
- **Position**: Middle layer

### 3. Verifier Agents (gsd-verifier)
- **Role**: Verify phase goals against actual codebase
- **Color**: Orange
- **Position**: Middle layer

### 4. Specialist Agents (on-demand)
- **Mapper (gsd-codebase-mapper)**: Explore and document codebase
- **Researcher (gsd-research-phase)**: Research unknown domains
- **Debugger (systematic-debugging)**: Investigate bugs
- **Color**: Green
- **Position**: Bottom layer

## Proposed Layout

```
        ┌─────────────┐
        │ Orchestrator│
        └──────┬──────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼──────┐  ┌────▼─────┐
│   Executor   │  │ Verifier │
│  (multiple)  │  │(multiple)│
└──────┬───────┘  └────┬─────┘
       │               │
       └───────┬───────┘
               │
      ┌────────▼────────┐
      │  Specialist     │
      │  (multiple)     │
      └─────────────────┘
```

## Implementation Plan
1. Create static agent hierarchy nodes
2. Show active agents (currently running)
3. Display agent communication flow
4. Add real-time updates via WebSocket

## Data Structure
```json
{
  "nodes": [
    {
      "id": "orchestrator",
      "type": "agentNode",
      "position": {"x": 400, "y": 50},
      "data": {
        "label": "Orchestrator",
        "type": "orchestrator",
        "status": "running",
        "description": "Coordinates all agents"
      }
    },
    // ... more nodes
  ],
  "edges": [
    {
      "source": "orchestrator",
      "target": "executor",
      "label": "delegates"
    },
    // ... more edges
  ]
}
```
