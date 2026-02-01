import React, { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, FileText, Image, Code, Database } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';

const getFileIcon = (fileName, fileType) => {
  const ext = fileName.split('.').pop().toLowerCase();

  if (fileType === 'folder') return Folder;

  switch (ext) {
    case 'pdf': return FileText;
    case 'md': return FileText;
    case 'png':
    case 'jpg':
    case 'jpeg': return Image;
    case 'py':
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx': return Code;
    case 'csv':
    case 'json': return Database;
    default: return File;
  }
};

export const FileExplorer = ({ files = [], onFileSelect, selectedFile }) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root']));

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFileNode = (node, level = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const Icon = getFileIcon(node.name, node.type);
    const isSelected = selectedFile?.path === node.path;

    if (node.type === 'folder') {
      return (
        <div key={node.path} className="select-none">
          <div
            className={`flex items-center gap-2 py-1.5 px-2 hover:bg-muted rounded cursor-pointer ${
              level > 0 ? 'ml-4' : ''
            }`}
            onClick={() => toggleFolder(node.path)}
            style={{ paddingLeft: `${level * 16 + 8}px` }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <Icon className="h-4 w-4 text-blue-500" />
            <span className="text-sm">{node.name}</span>
            {node.children && (
              <Badge variant="outline" className="ml-auto text-[10px]">
                {node.children.length}
              </Badge>
            )}
          </div>
          {isExpanded && node.children && (
            <div>
              {node.children.map(child => renderFileNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        className={`flex items-center gap-2 py-1.5 px-2 hover:bg-muted rounded cursor-pointer ${
          isSelected ? 'bg-accent' : ''
        }`}
        onClick={() => onFileSelect && onFileSelect(node)}
        style={{ paddingLeft: `${level * 16 + 24}px` }}
      >
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm flex-1">{node.name}</span>
      </div>
    );
  };

  if (!files || files.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        <div className="text-center">
          <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No files yet</p>
          <p className="text-xs">Upload files to get started</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2">
        {files.map(node => renderFileNode(node))}
      </div>
    </ScrollArea>
  );
};

// Mock file data for testing
export const mockFileTree = [
  {
    id: 'root',
    name: 'Project Files',
    type: 'folder',
    path: 'root',
    children: [
      {
        id: 'papers',
        name: 'Literature',
        type: 'folder',
        path: 'root/papers',
        children: [
          { id: 'paper1', name: 'research_paper.pdf', type: 'file', fileType: 'pdf', path: 'root/papers/research_paper.pdf' },
          { id: 'paper2', name: 'systematic_review.pdf', type: 'file', fileType: 'pdf', path: 'root/papers/systematic_review.pdf' },
        ]
      },
      {
        id: 'data',
        name: 'Data',
        type: 'folder',
        path: 'root/data',
        children: [
          { id: 'dataset', name: 'dataset.csv', type: 'file', fileType: 'csv', path: 'root/data/dataset.csv' },
          { id: 'metadata', name: 'metadata.json', type: 'file', fileType: 'json', path: 'root/data/metadata.json' },
        ]
      },
      {
        id: 'outputs',
        name: 'Outputs',
        type: 'folder',
        path: 'root/outputs',
        children: [
          { id: 'draft', name: 'draft.md', type: 'file', fileType: 'md', path: 'root/outputs/draft.md' },
          { id: 'bibliography', name: 'bibliography.json', type: 'file', fileType: 'json', path: 'root/outputs/bibliography.json' },
        ]
      },
      { id: 'readme', name: 'README.md', type: 'file', fileType: 'md', path: 'root/README.md' }
    ]
  }
];
