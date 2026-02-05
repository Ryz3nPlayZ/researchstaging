import { useState, useEffect, useCallback } from 'react';
import { useProject } from '../../context/ProjectContext';
import { projectsApi, tasksApi, artifactsApi, filesApi, documentsApi, createWebSocketConnection } from '../../lib/api';
import api from '../../lib/api';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { RichTextEditor } from '../editor/RichTextEditor';
import { DocumentEditor } from '../editor/DocumentEditor';
import { TaskGraph, AgentGraph } from '../graphs/TaskGraph';
import { FileExplorer } from '../explorer/FileExplorer';
import { TaskErrorRecovery } from '../tasks/TaskErrorRecovery';
import { FileViewer } from '../files/FileViewer';
import {
  Play,
  FileText,
  BookOpen,
  Activity,
  Loader2,
  CheckCircle,
  AlertCircle,
  Download,
  GitBranch,
  Bot,
  LayoutGrid,
  Network,
  AlertTriangle,
  Save
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

export const Workspace = () => {
  const {
    selectedProject,
    selectedTask,
    selectedArtifact,
    selectedPaper,
    setSelectedArtifact,
    selectedFile,
    setSelectedFile,
    setSelectedDocument,
    triggerRefresh,
    editorRef
  } = useProject();
  
  const [executing, setExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [taskGraph, setTaskGraph] = useState(null);
  const [agentGraph, setAgentGraph] = useState(null);
  const [editedContent, setEditedContent] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [fileTree, setFileTree] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState(null);
  const [documentData, setDocumentData] = useState(null);
  const [loadingDocument, setLoadingDocument] = useState(false);

  const fetchGraphs = useCallback(async () => {
    if (!selectedProject) return;
    try {
      const [taskRes, agentRes] = await Promise.all([
        api.get(`/projects/${selectedProject.id}/task-graph`),
        api.get(`/projects/${selectedProject.id}/agent-graph`)
      ]);
      setTaskGraph(taskRes.data);
      setAgentGraph(agentRes.data);
    } catch (error) {
      console.error('Failed to fetch graphs:', error);
    }
  }, [selectedProject]);

  const fetchTasks = useCallback(async () => {
    if (!selectedProject) return;
    try {
      const response = await tasksApi.listByProject(selectedProject.id);
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  }, [selectedProject]);

  const fetchFileTree = useCallback(async () => {
    if (!selectedProject) return;
    try {
      const response = await filesApi.getFileTree(selectedProject.id);
      setFileTree(response.data);
    } catch (error) {
      console.error('Failed to fetch file tree:', error);
      // Set empty tree if error
      setFileTree({
        id: 'root',
        name: 'Project Files',
        type: 'folder',
        path: `project_${selectedProject.id}`,
        children: []
      });
    }
  }, [selectedProject]);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedProject) return;

    setUploadingFile(true);
    try {
      await filesApi.uploadFile(selectedProject.id, file);
      toast.success('File uploaded successfully');
      fetchFileTree(); // Refresh file tree
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  // Fetch task graph and tasks
  useEffect(() => {
    fetchGraphs();
    fetchTasks();
    fetchFileTree();
  }, [fetchGraphs, fetchTasks, fetchFileTree]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!selectedProject) return;

    const ws = createWebSocketConnection(selectedProject.id, (event) => {
      console.log('WebSocket Event:', event);
      
      switch (event.type) {
        case 'connected':
          console.log('Connected to project updates');
          break;
        case 'task_started':
          toast.info(`Task started: ${event.data.task_name}`);
          fetchTasks();
          break;
        case 'task_completed':
          toast.success(`Task completed: ${event.data.task_name}`);
          triggerRefresh();
          fetchGraphs();
          fetchTasks();
          break;
        case 'task_failed':
          toast.error(`Task failed: ${event.data.task_name}`);
          triggerRefresh();
          fetchTasks();
          break;
        case 'execution_started':
          toast.info(`Pipeline started: ${event.data.tasks_queued} tasks queued`);
          fetchTasks();
          break;
        case 'pipeline_completed':
          setExecuting(false);
          if (event.data.status === 'completed') {
            toast.success('Research pipeline completed successfully!');
          } else {
            toast.error('Research pipeline failed');
          }
          triggerRefresh();
          fetchTasks();
          break;
        default:
          break;
      }
    }, (error) => {
      console.error('WebSocket error:', error);
    });

    return () => {
      ws.close();
    };
  }, [selectedProject, triggerRefresh, fetchGraphs, fetchTasks]);

  // Switch to files tab when a file is selected in Navigator
  useEffect(() => {
    if (selectedFile && activeTab !== 'files') {
      setActiveTab('files');
    }
  }, [selectedFile, activeTab]);

  // Load document when .md or .docx file is selected
  useEffect(() => {
    const loadDocumentForFile = async () => {
      if (!selectedFile || !selectedProject) {
        setDocumentData(null);
        setSelectedDocument(null);
        return;
      }

      const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';

      // Only process .md and .docx files
      if (!['md', 'docx'].includes(ext)) {
        setDocumentData(null);
        setSelectedDocument(null);
        return;
      }

      setLoadingDocument(true);
      try {
        // Try to load existing document by file ID (using file's document_id if available)
        // For now, we'll create a simple content structure from the file
        // In a full implementation, you'd check if a document exists for this file

        // Check if file has associated document_id in tags
        const tags = selectedFile.tags || {};
        const documentId = tags.document_id;

        if (documentId) {
          // Load existing document
          const response = await documentsApi.loadDocument(documentId);
          const doc = {
            id: response.data.id,
            content: response.data.content,
            title: response.data.title,
          };
          setDocumentData(doc);
          setSelectedDocument(doc);
        } else {
          // Get file content first
          let fileContent = '';
          try {
            const contentResponse = await filesApi.getFileContent(selectedFile.id);
            fileContent = contentResponse.data.content || '';
          } catch (contentError) {
            console.warn('Could not load file content, creating empty document:', contentError);
            fileContent = '';
          }

          // Convert file content to TipTap JSON format
          // For markdown, we'll create simple paragraph structure
          // Each line becomes a paragraph
          const paragraphs = fileContent.split('\n\n').filter(p => p.trim());
          const tipTapContent = {
            type: 'doc',
            content: paragraphs.length > 0
              ? paragraphs.map(para => ({
                  type: 'paragraph',
                  content: [{ type: 'text', text: para.trim() }]
                }))
              : [{ type: 'paragraph', content: [] }] // Empty document
          };

          // Create new document for this file with content
          const response = await documentsApi.createDocument(
            selectedProject.id,
            selectedFile.name.replace(/\.(md|docx)$/, ''),
            'apa'
          );

          // Update document with file content
          await documentsApi.updateDocument(response.data.id, tipTapContent);

          const doc = {
            id: response.data.id,
            content: tipTapContent,
            title: response.data.title,
          };
          setDocumentData(doc);
          setSelectedDocument(doc);
          // Note: In a full implementation, you'd update the file's tags with document_id
        }
      } catch (error) {
        console.error('Failed to load/create document:', error);
        toast.error('Failed to open document editor');
        setDocumentData(null);
        setSelectedDocument(null);
      } finally {
        setLoadingDocument(false);
      }
    };

    loadDocumentForFile();
  }, [selectedFile, selectedProject, setSelectedDocument]);

  const handleExecuteAll = useCallback(async () => {
    if (!selectedProject) return;
    
    setExecuting(true);
    try {
      await projectsApi.executeAll(selectedProject.id);
      toast.info('Research pipeline started');
    } catch (error) {
      console.error('Failed to execute pipeline:', error);
      toast.error('Failed to start pipeline');
      setExecuting(false);
    }
  }, [selectedProject]);

  const handleExport = useCallback(async (format) => {
    if (!selectedArtifact) return;
    
    setExporting(true);
    try {
      const response = await api.post(`/artifacts/${selectedArtifact.id}/export`, {
        format,
        title: selectedArtifact.title
      }, { responseType: 'blob' });
      
      // Download file
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedArtifact.title}.${format === 'markdown' ? 'md' : format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  }, [selectedArtifact]);

  // Determine what content to show (must be before callbacks that use it)
  const content = selectedPaper || selectedArtifact || selectedTask;
  const contentType = selectedPaper ? 'paper' : selectedArtifact ? 'artifact' : selectedTask ? 'task' : null;

  const saveContent = useCallback(async (content) => {
    if (!selectedArtifact) return;

    setSaving(true);
    try {
      await api.put(`/artifacts/${selectedArtifact.id}/content`, { content });
      setHasUnsavedChanges(false);
      toast.success('Saved successfully');
    } catch (error) {
      console.error('Failed to save content:', error);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }, [selectedArtifact]);

  const handleContentChange = useCallback((newContent) => {
    setEditedContent(newContent);
    setHasUnsavedChanges(true);

    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set new timeout for auto-save (2 seconds)
    const timeout = setTimeout(() => {
      saveContent(newContent);
    }, 2000);

    setSaveTimeout(timeout);
  }, [saveTimeout, saveContent]);

  const handleManualSave = useCallback(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveContent(editedContent || content?.content || '');
  }, [saveTimeout, saveContent, editedContent, content]);

  // Handle document save from DocumentEditor
  const handleDocumentSave = useCallback(async (content) => {
    if (!documentData) return;

    try {
      await documentsApi.saveDocument(documentData.id, content);
      // Update local document data
      setDocumentData(prev => ({ ...prev, content }));
    } catch (error) {
      console.error('Failed to save document:', error);
      throw error;
    }
  }, [documentData]);

  // Empty state - no project selected
  if (!selectedProject) {
    return (
      <main 
        className="flex-1 overflow-hidden flex flex-col items-center justify-center bg-background p-8"
        data-testid="workspace"
      >
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Activity className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight font-['IBM_Plex_Sans'] mb-2">
            Select a Project
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose a project from the navigator or create a new one to get started.
          </p>
        </div>
      </main>
    );
  }

  // Project selected but no specific item - show project overview
  if (!content) {
    return (
      <main 
        className="flex-1 overflow-hidden flex flex-col bg-background"
        data-testid="workspace"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div>
            <h2 className="font-semibold text-sm tracking-tight font-['IBM_Plex_Sans']">
              {selectedProject.research_goal}
            </h2>
            <p className="text-xs text-muted-foreground capitalize">
              {selectedProject.output_type?.replace('_', ' ')} • {selectedProject.status}
            </p>
          </div>
          <Button
            onClick={handleExecuteAll}
            disabled={executing || selectedProject.status === 'completed'}
            size="sm"
            data-testid="execute-pipeline-btn"
          >
            {executing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : selectedProject.status === 'completed' ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Completed
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Execute Pipeline
              </>
            )}
          </Button>
        </div>
        
        {/* Error Recovery Panel - show if there are failed tasks */}
        {tasks.some(t => t.state === 'failed') && (
          <div className="px-4 py-2 border-b border-border">
            <TaskErrorRecovery 
              tasks={tasks} 
              projectId={selectedProject.id}
              onRetrySuccess={() => {
                fetchTasks();
                fetchGraphs();
                triggerRefresh();
              }}
            />
          </div>
        )}
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-2 w-fit">
            <TabsTrigger value="content" className="text-xs gap-1.5">
              <LayoutGrid className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="files" className="text-xs gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Files
            </TabsTrigger>
            <TabsTrigger value="tasks" className="text-xs gap-1.5">
              <GitBranch className="h-3.5 w-3.5" />
              Task Graph
            </TabsTrigger>
            <TabsTrigger value="agents" className="text-xs gap-1.5">
              <Bot className="h-3.5 w-3.5" />
              Agent Graph
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="flex-1 m-0 p-0">
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight font-['IBM_Plex_Sans'] mb-2">
                  Ready to Execute
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Click &quot;Execute Pipeline&quot; to start the research process. Select documents from the navigator to view results.
                </p>
                {selectedProject.status === 'completed' && (
                  <p className="text-xs text-green-500">
                    Pipeline completed! Select documents from the navigator to view results.
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="files" className="flex-1 m-0 p-0 data-[state=active]:flex data-[state=active]:flex-col overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
              {/* File Explorer - Left Sidebar */}
              <div className="w-64 border-r border-border bg-muted/30">
                <div className="p-3 border-b border-border flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-semibold">Files</h3>
                    <p className="text-xs text-muted-foreground">Project files and outputs</p>
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                    />
                    <Upload className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </label>
                </div>
                {fileTree ? (
                  <FileExplorer
                    files={[fileTree]}
                    onFileSelect={setSelectedFile}
                    selectedFile={selectedFile}
                  />
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    {uploadingFile ? 'Uploading...' : 'Loading files...'}
                  </div>
                )}
              </div>

              {/* File Preview - Main Area */}
              <div className="flex-1 min-h-0 overflow-hidden">
                {(() => {
                  const ext = selectedFile?.name.split('.').pop()?.toLowerCase() || '';

                  // Show DocumentEditor for .md and .docx files
                  if (['md', 'docx'].includes(ext)) {
                    if (loadingDocument) {
                      return (
                        <div className="h-full flex items-center justify-center">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="text-sm">Loading document...</span>
                          </div>
                        </div>
                      );
                    }

                    if (documentData) {
                      return (
                        <DocumentEditor
                          documentId={documentData.id}
                          initialContent={documentData.content}
                          onSave={handleDocumentSave}
                          editorRef={editorRef}
                        />
                      );
                    }

                    return (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center">
                          <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Unable to load document</p>
                        </div>
                      </div>
                    );
                  }

                  // Show FileViewer for other file types
                  return <FileViewer file={selectedFile} />;
                })()}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="flex-1 m-0 p-0 data-[state=active]:flex data-[state=active]:flex-col">
            <div className="w-full h-full p-4">
              {taskGraph ? (
                <TaskGraph nodes={taskGraph.nodes} edges={taskGraph.edges} type="task" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Loading task graph...</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="agents" className="flex-1 m-0 p-0 data-[state=active]:flex data-[state=active]:flex-col">
            <div className="w-full h-full p-4">
              {agentGraph ? (
                <AgentGraph nodes={agentGraph.nodes} edges={agentGraph.edges} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Loading agent graph...</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    );
  }

  // Render content based on type
  return (
    <main 
      className="flex-1 overflow-hidden flex flex-col bg-background"
      data-testid="workspace"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          {contentType === 'paper' && <BookOpen className="h-4 w-4 text-muted-foreground" />}
          {contentType === 'artifact' && <FileText className="h-4 w-4 text-muted-foreground" />}
          {contentType === 'task' && <Activity className="h-4 w-4 text-muted-foreground" />}
          <div>
            <h2 className="font-semibold text-sm tracking-tight font-['IBM_Plex_Sans']">
              {contentType === 'paper' ? content.title?.slice(0, 60) : 
               contentType === 'artifact' ? content.title :
               content.name}
            </h2>
            <p className="text-xs text-muted-foreground capitalize">
              {contentType} • {content.status || content.artifact_type || content.source}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {contentType === 'artifact' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={exporting}>
                  {exporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('markdown')}>
                  Markdown (.md)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('html')}>
                  HTML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('docx')}>
                  Word (.docx)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Badge variant="secondary" className="capitalize">{contentType}</Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 w-fit">
          <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="flex-1 m-0 p-0 overflow-hidden">
          {contentType === 'artifact' && content.artifact_type === 'draft' ? (
            <div className="flex flex-col h-full">
              {/* Save button toolbar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Editing: {content.title}
                  </span>
                  {hasUnsavedChanges && (
                    <Badge variant="outline" className="text-xs">Unsaved changes</Badge>
                  )}
                </div>
                <Button
                  onClick={handleManualSave}
                  disabled={saving || !hasUnsavedChanges}
                  size="sm"
                  className="gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </div>
              <div className="flex-1">
                <RichTextEditor
                  content={editedContent || content.content || ''}
                  onChange={handleContentChange}
                  editable={true}
                />
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-6 max-w-4xl">
                {contentType === 'artifact' && (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap font-['Inter'] text-sm leading-relaxed">
                      {content.content || 'No content available'}
                    </div>
                  </div>
                )}

                {contentType === 'task' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium mb-1">Description</h3>
                      <p className="text-sm text-muted-foreground">{content.description || 'No description'}</p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium mb-1">Status</h3>
                      <Badge 
                        variant="outline" 
                        className={
                          (content.state || content.status) === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                          (content.state || content.status) === 'running' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                          (content.state || content.status) === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }
                      >
                        {(content.state || content.status) === 'running' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                        {(content.state || content.status) === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {(content.state || content.status) === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {content.state || content.status}
                      </Badge>
                    </div>

                    {content.error_message && (
                      <div>
                        <h3 className="text-sm font-medium mb-1 text-red-500">Error</h3>
                        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
                          <p className="text-xs font-mono text-red-400">{content.error_message}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 border-red-500/30 text-red-600 hover:bg-red-500/10"
                          onClick={() => {
                            const API_URL = process.env.REACT_APP_BACKEND_URL;
                            fetch(`${API_URL}/api/tasks/${content.id}/retry`, { method: 'POST' })
                              .then(res => {
                                if (res.ok) {
                                  toast.success('Task retry started');
                                  fetchTasks();
                                  triggerRefresh();
                                }
                              });
                          }}
                        >
                          <Play className="h-3.5 w-3.5 mr-1.5" />
                          Retry Task
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
};
