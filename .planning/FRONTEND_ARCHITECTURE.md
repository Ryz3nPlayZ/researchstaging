# Frontend Architecture Plan

## Technology Stack

### Core
- **React 19** (with compatibility fixes for ReactFlow)
- **TypeScript** for type safety
- **Vite** for build tooling

### UI Components
- **shadcn/ui** - Base component library (already in use)
- **ReactFlow 11.11.4** - Graph visualization (task graph, agent graph, citation network)
- **Tiptap** - Rich text editor for artifact editing
- **TailwindCSS** - Styling (already configured)

### State Management
- **Zustand** - Global state (recommended over Redux for simplicity)
  - Projects store
  - Credits store
  - UI store (sidebar state, panel states)
- **React Query (TanStack Query)** - Server state management
  - API caching
  - Automatic refetching
  - Optimistic updates

### Routing
- **React Router v7** - Client-side routing
  - / (home dashboard)
  - /project/:id (project workspace)
  - /project/:id/task/:taskId (task detail - optional, can be panel)
  - /settings (settings)

### Real-time
- **WebSocket API** - Native WebSocket with custom hooks
  - useProjectWebSocket hook
  - Event listeners for task state changes

### Forms
- **React Hook Form** - Form validation and management
- **Zod** - Schema validation

### HTTP Client
- **Fetch API** with custom wrappers (no Axios needed)

### PDF Handling
- **PDF.js** - PDF rendering in-browser

---

## Folder Structure

```
frontend/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── graphs/          # Graph visualizations
│   │   │   ├── TaskGraph.jsx
│   │   │   ├── AgentGraph.jsx
│   │   │   ├── CitationNetwork.jsx
│   │   │   └── graph-utils.ts
│   │   ├── editor/          # Tiptap rich text editor
│   │   │   ├── TiptapEditor.jsx
│   │   │   └── extensions.ts
│   │   ├── layout/          # Layout components
│   │   │   ├── Sidebar.jsx
│   │   │   ├── DetailsPanel.jsx
│   │   │   ├── Statusbar.jsx
│   │   │   └── Workspace.jsx
│   │   ├── artifacts/       # Artifact viewers
│   │   │   ├── ArtifactViewer.jsx
│   │   │   ├── PdfViewer.jsx
│   │   │   ├── SearchResultsViewer.jsx
│   │   │   ├── DraftViewer.jsx
│   │   │   └── ReferenceListViewer.jsx
│   │   ├── tasks/           # Task components
│   │   │   ├── TaskCard.jsx
│   │   │   ├── TaskDetail.jsx
│   │   │   └── TaskStatusBadge.jsx
│   │   ├── chat/            # Conversational planning
│   │   │   ├── ChatInterface.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   └── PlanReviewCard.jsx
│   │   └── common/          # Shared components
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Card.jsx
│   │       ├── Avatar.jsx
│   │       └── CreditsDisplay.jsx
│   ├── pages/               # Page components
│   │   ├── HomeDashboard.jsx
│   │   ├── Onboarding.jsx
│   │   ├── ProjectWorkspace.jsx
│   │   ├── Settings.jsx
│   │   └── Auth.jsx
│   ├── stores/              # Zustand stores
│   │   ├── useProjectStore.ts
│   │   ├── useCreditStore.ts
│   │   ├── useUIStore.ts
│   │   └── useAuthStore.ts
│   ├── hooks/               # Custom React hooks
│   │   ├── useProjectWebSocket.ts
│   │   ├── useTaskGraph.ts
│   │   ├── useArtifacts.ts
│   │   ├── useCredits.ts
│   │   └── useBreakpoint.ts
│   ├── services/            # API services
│   │   ├── api.ts           # Base API client
│   │   ├── projects.ts
│   │   ├── tasks.ts
│   │   ├── artifacts.ts
│   │   ├── papers.ts
│   │   ├── planning.ts
│   │   ├── credits.ts
│   │   └── websocket.ts
│   ├── types/               # TypeScript types
│   │   ├── project.ts
│   │   ├── task.ts
│   │   ├── artifact.ts
│   │   ├── paper.ts
│   │   └── api.ts
│   ├── utils/               # Utility functions
│   │   ├── format.ts        # Date, number formatting
│   │   ├── validation.ts    # Zod schemas
│   │   └── constants.ts     # App constants
│   ├── styles/              # Global styles
│   │   ├── globals.css      # Tailwind + custom CSS
│   │   └── design-tokens.css # CSS variables
│   ├── App.jsx              # Root component
│   ├── main.jsx             # Entry point
│   └── router.jsx           # Route configuration
├── package.json
├── vite.config.js
├── tailwind.config.js
└── tsconfig.json
```

---

## State Management Architecture

### Zustand Stores

#### 1. useProjectStore
```typescript
interface ProjectState {
  // Current active project
  activeProject: Project | null;
  setActiveProject: (project: Project) => void;

  // Task graph state
  taskGraphNodes: Node[];
  taskGraphEdges: Edge[];
  updateTaskNode: (taskId: string, updates: Partial<Node>) => void;

  // Real-time updates
  taskStatuses: Map<string, TaskStatus>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
}
```

#### 2. useCreditStore
```typescript
interface CreditState {
  creditsRemaining: number;
  creditsUsed: number;
  refreshCredits: () => Promise<void>;
  decrementCredits: (amount: number) => void;
}
```

#### 3. useUIStore
```typescript
interface UIState {
  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Details panel
  detailsPanelOpen: boolean;
  detailsPanelContent: 'task' | 'artifact' | 'paper' | null;
  selectedItemId: string | null;
  openDetailsPanel: (type: string, id: string) => void;
  closeDetailsPanel: () => void;

  // Active project view
  activeView: 'overview' | 'task-graph' | 'agent-graph' | 'papers' | 'artifacts' | 'logs';
  setActiveView: (view: string) => void;
}
```

#### 4. useAuthStore
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}
```

### React Query for Server State

```typescript
// Projects
const { data: projects } = useQuery({
  queryKey: ['projects'],
  queryFn: projectService.getAllProjects
});

// Single project
const { data: project } = useQuery({
  queryKey: ['project', projectId],
  queryFn: () => projectService.getProject(projectId)
});

// Task graph (with real-time updates via WebSocket)
const { data: taskGraph } = useQuery({
  queryKey: ['task-graph', projectId],
  queryFn: () => taskService.getTaskGraph(projectId)
});

// Artifacts
const { data: artifacts } = useQuery({
  queryKey: ['artifacts', projectId],
  queryFn: () => artifactService.getArtifacts(projectId)
});
```

---

## Component Architecture

### Component Hierarchy

```
App
├── AuthProvider
├── QueryClientProvider
├── Router
    ├── HomeDashboard
    │   ├── GlobalSidebar
    │   ├── Greeting
    │   └── NewProjectInput
    ├── Onboarding
    ├── ConversationalPlanning
    │   └── ChatInterface
    ├── ProjectWorkspace
    │   ├── ProjectSidebar
    │   ├── WorkspaceContent
    │   │   ├── Overview (with TaskGraph)
    │   │   ├── TaskGraph (full page)
    │   │   ├── AgentGraph
    │   │   ├── Papers
    │   │   ├── Artifacts
    │   │   ├── ExecutionLog
    │   │   └── ProjectSettings
    │   ├── DetailsPanel
    │   └── Statusbar
    └── Settings
```

### Component Design Principles

1. **Presentational vs Container Components**
   - Presentational: Pure UI, receive props, emit events
   - Container: Connect to stores/API, pass data to presentational

2. **Composition over Inheritance**
   - Build complex UIs from simple, composable components

3. **Controlled Components**
   - All form inputs are controlled components

4. **Error Boundaries**
   - Wrap major sections in error boundaries

---

## Data Flow Patterns

### 1. Project Selection Flow

```
User clicks project in sidebar
  → useUIStore.openProject(projectId)
  → Router navigates to /project/:id
  → ProjectWorkspace loads
  → useQuery fetches project data
  → WebSocket connection established
  → Real-time updates begin
```

### 2. Task Graph Updates Flow

```
WebSocket receives task_completed event
  → useProjectWebSocket handler
  → useProjectStore.updateTaskStatus(taskId, 'completed')
  → ReactFlow re-renders with updated node
  → Node color changes to green
```

### 3. Task Detail Flow

```
User clicks task in graph
  → onNodeClick(task)
  → useUIStore.openDetailsPanel('task', taskId)
  → DetailsPanel opens
  → useQuery fetches task details
  → Display task info, agents, artifacts, logs
```

### 4. Artifact Editing Flow

```
User views artifact (read-only)
  → User clicks "Edit Mode"
  → Switch to TiptapEditor component
  → User makes changes
  → User clicks "Save"
  → artifactService.updateContent(artifactId, newContent)
  → Optimistic update (update local state)
  → Server updates artifact version
  → Switch back to read-only view
```

---

## WebSocket Integration

### useProjectWebSocket Hook

```typescript
function useProjectWebSocket(projectId: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const updateTaskStatus = useProjectStore(state => state.updateTaskStatus);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${projectId}`);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'task_started':
          updateTaskStatus(message.task_id, 'running');
          break;
        case 'task_completed':
          updateTaskStatus(message.task_id, 'completed');
          break;
        case 'task_failed':
          updateTaskStatus(message.task_id, 'failed');
          break;
        // ... other events
      }
    };

    setSocket(ws);

    return () => ws.close();
  }, [projectId]);

  return { socket };
}
```

---

## Credit System Frontend Integration

### Credit Tracking

1. **Display credits in sidebar** - Always visible
2. **Fetch on app load** - useCreditStore.refreshCredits()
3. **Update after LLM calls** - Decrement local, sync with server
4. **Low credit warnings** - Toast notification when < 100 credits

### Purchase Flow (Future)

- Settings → Billing → Purchase Credits
- Stripe integration (backend handles payment)
- Update credit store on successful purchase

---

## Performance Optimizations

### 1. ReactFlow Incremental Updates

```typescript
// Only update changed nodes, not entire graph
const onNodesChange = useCallback((changes) => {
  setNodes((nds) => applyNodeChanges(changes, nds));
}, []);
```

### 2. React Query Caching

- Cache projects for 5 minutes
- Cache artifacts for 10 minutes
- Refetch on window focus
- Stale-time for optimal UX

### 3. Code Splitting

```typescript
const ProjectWorkspace = lazy(() => import('./pages/ProjectWorkspace'));
const Settings = lazy(() => import('./pages/Settings'));
```

### 4. Virtual Scrolling

- For long artifact lists
- For execution logs (react-window or react-virtuoso)

---

## Type Safety

### TypeScript Types

Key types to define:

```typescript
// Project
interface Project {
  id: string;
  research_goal: string;
  output_type: string;
  audience: string;
  status: ProjectStatus;
  task_counts: TaskCounts;
  created_at: string;
  updated_at: string;
}

// Task
interface Task {
  id: string;
  project_id: string;
  type: TaskType;
  status: TaskStatus;
  phase: string;
  sequence_index: number;
  dependencies: TaskDependency[];
  created_at: string;
  updated_at: string;
}

// Artifact
interface Artifact {
  id: string;
  project_id: string;
  task_id: string;
  type: ArtifactType;
  title: string;
  content: string;
  version: number;
  parent_artifact_id: string | null;
  created_at: string;
}

// Graph nodes/edges
interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    status: TaskStatus;
    taskType: TaskType;
    // ... other task data
  };
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: 'smoothstep' | 'straight';
  animated: boolean;
}
```

---

## Implementation Order

### Phase 1: Foundation
1. Set up design tokens (CSS variables)
2. Configure Tailwind with custom colors
3. Set up folder structure
4. Install dependencies (Tiptap, Zustand, React Query)
5. Create base layout components (Sidebar, DetailsPanel)

### Phase 2: Core Screens
6. Home Dashboard
7. Conversational Planning Flow
8. Project Workspace (layout)
9. Task Graph visualization
10. Task Detail view

### Phase 3: Artifact Management
11. Artifact viewers (PDF, drafts, search results)
12. Tiptap editor integration
13. Edit mode toggle
14. AI actions sidebar

### Phase 4: Advanced Features
15. Agent Graph visualization
16. Execution Log
17. Real-time WebSocket updates
18. Error recovery UI

### Phase 5: Polish
19. Onboarding flow
20. Settings pages
21. Credits display and tracking
22. Animations and micro-interactions
23. Responsive design refinements

---

## Open Questions for Implementation

1. **Authentication** - How are users authenticating? (JWT, sessions, OAuth?)
2. **API base URL** - Environment variables for dev/prod?
3. **WebSocket reconnection** - Handle connection drops gracefully?
4. **Offline support** - Any need for offline capabilities?
5. **File uploads** - Can users upload PDFs or other files?
6. **Export formats** - Default format preference?
7. **Notification preferences** - Email notifications or just in-app?
