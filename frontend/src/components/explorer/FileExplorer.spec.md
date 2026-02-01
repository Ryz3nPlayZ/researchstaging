# File Explorer Component - Iteration 11-15

## Design
VS Code-like file tree with hierarchical structure

## Data Structure
```typescript
interface FileNode {
  id: string;
  name: string;
  type: 'folder' | 'file';
  path: string;
  children?: FileNode[];
  fileType?: 'pdf' | 'md' | 'py' | 'json' | 'csv' | 'txt';
}
```

## Component Structure
```
FileExplorer
  ├── FileTree (recursive)
  │   ├── FileNode (folder)
  │   └── FileNode (file)
  └── FilePreview
```

## Implementation Plan
1. Create FileExplorer component with tree view
2. Add expand/collapse for folders
3. Add file type icons
4. Connect to project data
5. Add click handlers for file selection
6. Integrate into Workspace tabs
