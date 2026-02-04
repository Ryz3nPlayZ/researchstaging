import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  FileText,
  Image,
  Code,
  Database,
  Upload,
  X,
  FolderPlus,
  MoreVertical,
  Download,
  Trash2,
  Edit2,
  Copy,
  Move,
  Home,
  ArrowUp,
  List,
  LayoutList,
  ExternalLink,
  Info
} from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger
} from '../ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { useToast } from '../../hooks/use-toast';
import { filesApi } from '../../lib/api';
import { useProject } from '../../context/ProjectContext';

const getFileIcon = (fileName, fileType) => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (fileType === 'folder') return Folder;

  switch (ext) {
    case 'pdf': return FileText;
    case 'md': return FileText;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp': return Image;
    case 'py':
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'html':
    case 'css': return Code;
    case 'csv':
    case 'json':
    case 'xlsx': return Database;
    default: return File;
  }
};

const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

export const FileExplorer = ({ onFileSelect, selectedFile }) => {
  const { selectedProject } = useProject();
  const { toast } = useToast();

  const [fileTree, setFileTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root']));
  const [dragOver, setDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState([{ id: null, name: 'Project Files', path: '' }]);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'list'
  const [listSort, setListSort] = useState({ field: 'name', order: 'asc' }); // for list view sorting
  const [hoveredFile, setHoveredFile] = useState(null);

  // Dialog states
  const [newFolderDialog, setNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParent, setNewFolderParent] = useState(null);
  const [renameDialog, setRenameDialog] = useState(false);
  const [renameItem, setRenameItem] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);

  const fileInputRef = useRef(null);

  // Fetch file tree
  const fetchFileTree = useCallback(async () => {
    if (!selectedProject) {
      setFileTree([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await filesApi.getFileTree(selectedProject.id);
      // Handle both array and single root node responses
      const tree = Array.isArray(response.data) ? response.data : (response.data?.children || []);
      setFileTree(tree);
    } catch (error) {
      console.error('Failed to fetch file tree:', error);
      toast({
        variant: 'destructive',
        title: 'Error loading files',
        description: error.response?.data?.detail || 'Failed to load file tree'
      });
      setFileTree([]);
    } finally {
      setLoading(false);
    }
  }, [selectedProject, toast]);

  useEffect(() => {
    fetchFileTree();
  }, [fetchFileTree]);

  const toggleFolder = (path) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  // Helper function to build breadcrumb path from folder
  const buildBreadcrumbPath = (folder) => {
    if (!folder) {
      return [{ id: null, name: 'Project Files', path: '' }];
    }
    // Split path and build breadcrumb
    const pathParts = folder.path.split('/').filter(Boolean);
    const breadcrumbs = [{ id: null, name: 'Project Files', path: '' }];

    // For now, we'll build a simplified path
    // In a full implementation, we'd traverse the tree to build accurate breadcrumbs
    pathParts.forEach((part, index) => {
      const subPath = pathParts.slice(0, index + 1).join('/');
      breadcrumbs.push({
        id: folder.id,
        name: part,
        path: subPath
      });
    });

    return breadcrumbs;
  };

  const handleFolderClick = (folder) => {
    setSelectedFolder(folder);
    setBreadcrumbPath(buildBreadcrumbPath(folder));
    toggleFolder(folder.path);
  };

  const handleBreadcrumbClick = (index) => {
    const targetBreadcrumb = breadcrumbPath[index];
    if (index === 0) {
      // Navigate to root
      setSelectedFolder(null);
      setBreadcrumbPath([{ id: null, name: 'Project Files', path: '' }]);
    } else {
      // Navigate to folder
      setSelectedFolder(targetBreadcrumb);
      setBreadcrumbPath(breadcrumbPath.slice(0, index + 1));
    }
  };

  const handleNavigateUp = () => {
    if (breadcrumbPath.length > 1) {
      const newPath = breadcrumbPath.slice(0, -1);
      setBreadcrumbPath(newPath);
      if (newPath.length === 1) {
        setSelectedFolder(null);
      } else {
        setSelectedFolder(newPath[newPath.length - 1]);
      }
    }
  };

  // Flatten file tree for list view
  const flattenFileTree = (nodes, result = []) => {
    nodes.forEach(node => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        flattenFileTree(node.children, result);
      }
    });
    return result;
  };

  // Sort files for list view
  const sortFiles = (files) => {
    return [...files].sort((a, b) => {
      const aValue = a[listSort.field];
      const bValue = b[listSort.field];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return listSort.order === 'asc' ? comparison : -comparison;
    });
  };

  const handleSort = (field) => {
    if (listSort.field === field) {
      setListSort({ field, order: listSort.order === 'asc' ? 'desc' : 'asc' });
    } else {
      setListSort({ field, order: 'asc' });
    }
  };

  // Load view mode preference from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('fileExplorerViewMode');
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  // Save view mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('fileExplorerViewMode', viewMode);
  }, [viewMode]);

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Validate file types
    const validExtensions = ['.pdf', '.docx', '.md', '.py', '.r', '.js', '.csv', '.xlsx', '.json'];
    const validFiles = files.filter(file => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      return validExtensions.includes(ext);
    });

    if (validFiles.length < files.length) {
      toast({
        variant: 'destructive',
        title: 'Some files not supported',
        description: `${files.length - validFiles.length} file(s) skipped. Supported: PDF, DOCX, MD, PY, R, JS, CSV, XLSX, JSON`
      });
    }

    if (validFiles.length === 0) return;

    // Upload files
    await uploadFiles(validFiles);
  };

  const uploadFiles = async (files) => {
    if (!selectedProject) return;

    const uploadPromises = files.map(async (file) => {
      try {
        setUploadingFiles(prev => [...prev, file.name]);

        await filesApi.uploadFile(
          selectedProject.id,
          file,
          selectedFolder?.id || null
        );

        toast({
          title: 'Upload successful',
          description: `${file.name} uploaded`
        });
      } catch (error) {
        console.error('Upload failed:', error);
        toast({
          variant: 'destructive',
          title: 'Upload failed',
          description: error.response?.data?.detail || `${file.name} failed to upload`
        });
      } finally {
        setUploadingFiles(prev => prev.filter(name => name !== file.name));
      }
    });

    await Promise.all(uploadPromises);
    fetchFileTree(); // Refresh tree
  };

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      uploadFiles(files);
    }
    e.target.value = ''; // Reset input
  };

  // Folder operations
  const handleCreateFolder = async () => {
    if (!selectedProject || !newFolderName.trim()) return;

    try {
      await filesApi.createFolder(selectedProject.id, {
        name: newFolderName.trim(),
        parent_folder_id: newFolderParent
      });

      toast({
        title: 'Folder created',
        description: `Folder "${newFolderName}" created`
      });

      setNewFolderDialog(false);
      setNewFolderName('');
      setNewFolderParent(null);
      fetchFileTree();
    } catch (error) {
      console.error('Create folder failed:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to create folder',
        description: error.response?.data?.detail || 'Could not create folder'
      });
    }
  };

  const handleRename = async () => {
    if (!renameItem || !renameValue.trim()) return;

    try {
      if (renameItem.type === 'folder') {
        await filesApi.renameFolder(renameItem.id, renameValue.trim());
      } else {
        // Files can't be renamed in current backend, show message
        toast({
          variant: 'destructive',
          title: 'Not supported',
          description: 'File renaming is not yet supported'
        });
        return;
      }

      toast({
        title: 'Renamed',
        description: `${renameItem.name} renamed to ${renameValue}`
      });

      setRenameDialog(false);
      setRenameItem(null);
      setRenameValue('');
      fetchFileTree();
    } catch (error) {
      console.error('Rename failed:', error);
      toast({
        variant: 'destructive',
        title: 'Rename failed',
        description: error.response?.data?.detail || 'Could not rename'
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      if (deleteItem.type === 'folder') {
        await filesApi.deleteFolder(deleteItem.id);
      } else {
        await filesApi.deleteFile(deleteItem.id);
      }

      toast({
        title: 'Deleted',
        description: `${deleteItem.name} deleted`
      });

      setDeleteDialog(false);
      setDeleteItem(null);
      fetchFileTree();
    } catch (error) {
      console.error('Delete failed:', error);
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: error.response?.data?.detail || 'Could not delete'
      });
    }
  };

  const handleDownload = (file) => {
    const downloadUrl = filesApi.downloadFile(file.id);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyPath = (file) => {
    navigator.clipboard.writeText(file.path);
    toast({
      title: 'Copied',
      description: 'Path copied to clipboard'
    });
  };

  const openRenameDialog = (item, e) => {
    e?.stopPropagation();
    setRenameItem(item);
    setRenameValue(item.name);
    setRenameDialog(true);
  };

  const openDeleteDialog = (item, e) => {
    e?.stopPropagation();
    setDeleteItem(item);
    setDeleteDialog(true);
  };

  // File/folder move
  const handleMoveToFolder = async (file, targetFolderId) => {
    try {
      await filesApi.moveFile(file.id, targetFolderId);
      toast({
        title: 'Moved',
        description: `${file.name} moved`
      });
      fetchFileTree();
    } catch (error) {
      console.error('Move failed:', error);
      toast({
        variant: 'destructive',
        title: 'Move failed',
        description: error.response?.data?.detail || 'Could not move file'
      });
    }
  };

  // Render list view (flat table)
  const renderListView = () => {
    const flatFiles = flattenFileTree(fileTree);
    const sortedFiles = sortFiles(flatFiles);

    return (
      <div className="px-2">
        {/* Table header */}
        <div className="flex items-center gap-2 px-2 py-1 border-b border-border text-xs font-medium text-muted-foreground sticky top-0 bg-background">
          <button
            onClick={() => handleSort('name')}
            className="flex items-center gap-1 hover:text-foreground flex-1 text-left"
          >
            Name
            {listSort.field === 'name' && (
              <span className="text-[10px]">{listSort.order === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
          <button
            onClick={() => handleSort('type')}
            className="flex items-center gap-1 hover:text-foreground w-20 text-left"
          >
            Type
            {listSort.field === 'type' && (
              <span className="text-[10px]">{listSort.order === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
          <button
            onClick={() => handleSort('size_bytes')}
            className="flex items-center gap-1 hover:text-foreground w-16 text-right"
          >
            Size
            {listSort.field === 'size_bytes' && (
              <span className="text-[10px]">{listSort.order === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
          <button
            onClick={() => handleSort('created_at')}
            className="flex items-center gap-1 hover:text-foreground w-20 text-right"
          >
            Date
            {listSort.field === 'created_at' && (
              <span className="text-[10px]">{listSort.order === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
        </div>

        {/* Table rows */}
        {sortedFiles.map(node => {
          const Icon = getFileIcon(node.name, node.type);
          const isSelected = selectedFile?.id === node.id;
          const canOpenInEditor = /\.(md|py|r|js|jsx|ts|tsx|html|css|json|csv)$/.test(node.name);

          return (
            <div
              key={node.path}
              className={`flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded cursor-pointer text-xs group ${
                isSelected ? 'bg-accent' : ''
              }`}
              onClick={() => node.type !== 'folder' && onFileSelect && onFileSelect(node)}
            >
              <Icon className={`h-4 w-4 flex-shrink-0 ${node.type === 'folder' ? 'text-blue-500' : 'text-muted-foreground'}`} />
              <span className="flex-1 truncate">{node.name}</span>
              <span className="w-20 text-muted-foreground truncate">{node.mime_type || 'folder'}</span>
              <span className="w-16 text-right text-muted-foreground">
                {node.size_bytes ? formatFileSize(node.size_bytes) : '-'}
              </span>
              <span className="w-20 text-right text-muted-foreground">
                {formatDate(node.created_at)}
              </span>

              {/* Quick actions on hover */}
              {node.type !== 'folder' && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canOpenInEditor && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileSelect(node);
                      }}
                      title="Open in Workspace"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(node);
                    }}
                    title="Download"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyPath(node);
                    }}
                    title="Copy Path"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
    const flatFiles = flattenFileTree(fileTree);
    const sortedFiles = sortFiles(flatFiles);

    return (
      <div className="px-2">
        {/* Table header */}
        <div className="flex items-center gap-2 px-2 py-1 border-b border-border text-xs font-medium text-muted-foreground sticky top-0 bg-background">
          <button
            onClick={() => handleSort('name')}
            className="flex items-center gap-1 hover:text-foreground flex-1 text-left"
          >
            Name
            {listSort.field === 'name' && (
              <span className="text-[10px]">{listSort.order === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
          <button
            onClick={() => handleSort('type')}
            className="flex items-center gap-1 hover:text-foreground w-20 text-left"
          >
            Type
            {listSort.field === 'type' && (
              <span className="text-[10px]">{listSort.order === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
          <button
            onClick={() => handleSort('size_bytes')}
            className="flex items-center gap-1 hover:text-foreground w-16 text-right"
          >
            Size
            {listSort.field === 'size_bytes' && (
              <span className="text-[10px]">{listSort.order === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
          <button
            onClick={() => handleSort('created_at')}
            className="flex items-center gap-1 hover:text-foreground w-20 text-right"
          >
            Date
            {listSort.field === 'created_at' && (
              <span className="text-[10px]">{listSort.order === 'asc' ? '↑' : '↓'}</span>
            )}
          </button>
        </div>

        {/* Table rows */}
        {sortedFiles.map(node => {
          const Icon = getFileIcon(node.name, node.type);
          const isSelected = selectedFile?.id === node.id;

          return (
            <div
              key={node.path}
              className={`flex items-center gap-2 px-2 py-1.5 hover:bg-muted rounded cursor-pointer text-xs ${
                isSelected ? 'bg-accent' : ''
              }`}
              onClick={() => node.type !== 'folder' && onFileSelect && onFileSelect(node)}
            >
              <Icon className={`h-4 w-4 flex-shrink-0 ${node.type === 'folder' ? 'text-blue-500' : 'text-muted-foreground'}`} />
              <span className="flex-1 truncate">{node.name}</span>
              <span className="w-20 text-muted-foreground truncate">{node.mime_type || 'folder'}</span>
              <span className="w-16 text-right text-muted-foreground">
                {node.size_bytes ? formatFileSize(node.size_bytes) : '-'}
              </span>
              <span className="w-20 text-right text-muted-foreground">
                {formatDate(node.created_at)}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Render file tree node
  const renderFileNode = (node, level = 0) => {
    const isExpanded = expandedFolders.has(node.path);
    const Icon = getFileIcon(node.name, node.type);
    const isSelected = selectedFile?.id === node.id;

    if (node.type === 'folder') {
      return (
        <ContextMenu key={node.path}>
          <ContextMenuTrigger>
            <div
              className={`flex items-center gap-2 py-1.5 px-2 hover:bg-muted rounded cursor-pointer select-none ${
                level > 0 ? '' : ''
              } ${selectedFolder?.id === node.id ? 'bg-accent' : ''}`}
              onClick={() => handleFolderClick(node)}
              onContextMenu={(e) => {
                e.preventDefault();
                handleFolderClick(node);
              }}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <Icon className="h-4 w-4 text-blue-500 flex-shrink-0" />
              <span className="text-sm truncate flex-1">{node.name}</span>
              {node.children && (
                <Badge variant="outline" className="ml-auto text-[10px] flex-shrink-0">
                  {node.children.length}
                </Badge>
              )}
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => {
              setNewFolderParent(node.id);
              setNewFolderDialog(true);
            }}>
              <FolderPlus className="h-4 w-4 mr-2" />
              New Subfolder
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={(e) => openRenameDialog(node, e)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Rename
            </ContextMenuItem>
            <ContextMenuItem onClick={(e) => openDeleteDialog(node, e)} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      );
    }

    // File node
    const canOpenInEditor = /\.(md|py|r|js|jsx|ts|tsx|html|css|json|csv)$/.test(node.name);

    return (
      <ContextMenu key={node.path}>
        <ContextMenuTrigger>
          <div
            className={`flex items-center gap-2 py-1.5 px-2 hover:bg-muted rounded cursor-pointer group ${
              isSelected ? 'bg-accent' : ''
            }`}
            onClick={() => onFileSelect && onFileSelect(node)}
            onMouseEnter={() => setHoveredFile(node.id)}
            onMouseLeave={() => setHoveredFile(null)}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('fileId', node.id);
              e.dataTransfer.setData('fileType', 'file');
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const draggedId = e.dataTransfer.getData('fileId');
              const draggedType = e.dataTransfer.getData('fileType');
              if (draggedType === 'file' && draggedId !== node.id) {
                // Can't move file into file
                return;
              }
            }}
            style={{ paddingLeft: `${level * 16 + 24}px` }}
            title={`Size: ${formatFileSize(node.size_bytes)}\nType: ${node.mime_type || 'Unknown'}\nModified: ${formatDate(node.created_at)}`}
          >
            <Icon className={`h-4 w-4 flex-shrink-0 ${
              node.type === 'folder' ? 'text-blue-500' :
              /\.(md|py|r|js|jsx|ts|tsx)$/.test(node.name) ? 'text-green-500' :
              /\.(csv|json)$/.test(node.name) ? 'text-orange-500' :
              /\.(pdf)$/.test(node.name) ? 'text-red-500' :
              'text-muted-foreground'
            }`} />
            <span className="text-sm truncate flex-1">{node.name}</span>
            {node.size_bytes && hoveredFile !== node.id && (
              <span className="text-[10px] text-muted-foreground flex-shrink-0">
                {formatFileSize(node.size_bytes)}
              </span>
            )}

            {/* Quick actions on hover */}
            {hoveredFile === node.id && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {canOpenInEditor && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileSelect(node);
                    }}
                    title="Open in Workspace"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(node);
                  }}
                  title="Download"
                >
                  <Download className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyPath(node);
                  }}
                  title="Copy Path"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    openDeleteDialog(node, e);
                  }}
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          {canOpenInEditor && (
            <ContextMenuItem onClick={() => onFileSelect(node)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in Workspace
            </ContextMenuItem>
          )}
          <ContextMenuItem onClick={() => handleDownload(node)}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleCopyPath(node)}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Path
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={(e) => openDeleteDialog(node, e)} className="text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  // Empty state
  if (!loading && fileTree.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {/* Drop zone header */}
        <div
          className={`p-4 border-b border-border transition-colors ${
            dragOver ? 'bg-blue-50 dark:bg-blue-950' : ''
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Files</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => setViewMode(viewMode === 'tree' ? 'list' : 'tree')}
                title={viewMode === 'tree' ? 'Switch to list view' : 'Switch to tree view'}
              >
                {viewMode === 'tree' ? <LayoutList className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => {
                  setNewFolderParent(null);
                  setNewFolderDialog(true);
                }}
              >
                <FolderPlus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={handleFileInputClick}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
              dragOver
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {dragOver ? 'Drop files to upload' : 'Drag & drop files or click to upload'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, DOCX, MD, PY, R, JS, CSV, XLSX, JSON
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
            accept=".pdf,.docx,.md,.py,.r,.js,.csv,.xlsx,.json"
          />
        </div>

        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center p-4">
            <File className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No files yet</p>
            <p className="text-xs mt-1">Upload files to get started</p>
          </div>
        </div>

        {/* Upload progress */}
        {uploadingFiles.length > 0 && (
          <div className="border-t border-border p-2">
            <div className="text-xs text-muted-foreground mb-1">
              Uploading {uploadingFiles.length} file{uploadingFiles.length > 1 ? 's' : ''}...
            </div>
            {uploadingFiles.map(name => (
              <div key={name} className="text-xs flex items-center gap-2 py-1">
                <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
                <span className="truncate flex-1">{name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Drop zone header */}
      <div
        className={`p-4 border-b border-border transition-colors ${
          dragOver ? 'bg-blue-50 dark:bg-blue-950' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Files</span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => setViewMode(viewMode === 'tree' ? 'list' : 'tree')}
              title={viewMode === 'tree' ? 'Switch to list view' : 'Switch to tree view'}
            >
              {viewMode === 'tree' ? <LayoutList className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={() => {
                setNewFolderParent(null);
                setNewFolderDialog(true);
              }}
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={handleFileInputClick}
            >
              <Upload className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-3 text-center transition-colors ${
            dragOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
        >
          <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            {dragOver ? 'Drop files to upload' : 'Drop files here to upload'}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          accept=".pdf,.docx,.md,.py,.r,.js,.csv,.xlsx,.json"
        />
      </div>

      {/* Breadcrumb Navigation */}
      {breadcrumbPath.length > 1 && (
        <div className="px-4 py-2 border-b border-border flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1"
            onClick={handleNavigateUp}
            disabled={breadcrumbPath.length <= 1}
            title="Navigate up"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
          <div className="flex items-center gap-1 text-xs overflow-hidden">
            {breadcrumbPath.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <ChevronRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                )}
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`hover:text-foreground transition-colors flex items-center gap-1 ${
                    index === breadcrumbPath.length - 1
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground'
                  }`}
                >
                  {index === 0 && <Home className="h-3 w-3 flex-shrink-0" />}
                  <span className="truncate max-w-[100px]">{crumb.name}</span>
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* File tree or list view */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Loading files...
          </div>
        ) : viewMode === 'tree' ? (
          <div className="p-2">
            {fileTree.map(node => renderFileNode(node))}
          </div>
        ) : (
          renderListView()
        )}
      </ScrollArea>

      {/* Upload progress */}
      {uploadingFiles.length > 0 && (
        <div className="border-t border-border p-2">
          <div className="text-xs text-muted-foreground mb-1">
            Uploading {uploadingFiles.length} file{uploadingFiles.length > 1 ? 's' : ''}...
          </div>
          {uploadingFiles.map(name => (
            <div key={name} className="text-xs flex items-center gap-2 py-1">
              <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
              <span className="truncate flex-1">{name}</span>
            </div>
          ))}
        </div>
      )}

      {/* New Folder Dialog */}
      <Dialog open={newFolderDialog} onOpenChange={setNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for the new folder
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setNewFolderDialog(false);
              setNewFolderName('');
              setNewFolderParent(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialog} onOpenChange={setRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
            <DialogDescription>
              Enter a new name for {renameItem?.type === 'folder' ? 'folder' : 'file'}
            </DialogDescription>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="New name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename();
            }}
            autoFocus
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => {
              setRenameDialog(false);
              setRenameItem(null);
              setRenameValue('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!renameValue.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteItem?.type === 'folder' ? 'Folder' : 'File'}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteItem?.name}"?
              {deleteItem?.type === 'folder' && (
                <> This will also delete all contents inside this folder.</>
              )}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialog(false);
              setDeleteItem(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
