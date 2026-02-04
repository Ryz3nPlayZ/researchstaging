import { useProject } from '../../context/ProjectContext';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import {
  Info,
  Calendar,
  Hash,
  FileType,
  Link2,
  Users,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  HardDrive,
  Eye,
  Download
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { filesApi } from '../../lib/api';
import { useState, useEffect } from 'react';

const MetadataItem = ({ icon: Icon, label, value, mono = false }) => (
  <div className="flex items-start gap-2 py-1.5">
    <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">{label}</span>
      <span className={`text-xs ${mono ? 'font-mono' : ''} break-words`}>{value || '-'}</span>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const config = {
    pending: { icon: Clock, className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    ready: { icon: Clock, className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    running: { icon: Loader2, className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    executing: { icon: Loader2, className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    completed: { icon: CheckCircle, className: 'bg-green-500/10 text-green-500 border-green-500/20' },
    failed: { icon: XCircle, className: 'bg-red-500/10 text-red-500 border-red-500/20' },
    planned: { icon: Clock, className: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    created: { icon: Clock, className: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
  };
  
  const { icon: Icon, className } = config[status] || config.pending;
  
  return (
    <Badge variant="outline" className={`${className} gap-1`}>
      <Icon className={`h-3 w-3 ${status === 'running' || status === 'executing' ? 'animate-spin' : ''}`} />
      <span className="capitalize">{status}</span>
    </Badge>
  );
};

export const Inspector = () => {
  const {
    selectedProject,
    selectedTask,
    selectedArtifact,
    selectedPaper,
    selectedFile
  } = useProject();

  // File preview state
  const [fileContent, setFileContent] = useState(null);
  const [fileContentLoading, setFileContentLoading] = useState(false);
  const [fileContentError, setFileContentError] = useState(null);

  // Fetch file content when a file is selected
  useEffect(() => {
    const fetchFileContent = async () => {
      if (!selectedFile) {
        setFileContent(null);
        setFileContentError(null);
        return;
      }

      // Only fetch content for text-based files
      const textExtensions = ['.md', '.py', '.r', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.csv', '.txt'];
      const isTextFile = textExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));

      if (!isTextFile) {
        setFileContent(null);
        setFileContentError(null);
        return;
      }

      setFileContentLoading(true);
      setFileContentError(null);

      try {
        const result = await filesApi.downloadFile(selectedFile.id);

        // Fetch the actual file content from the download URL
        const response = await fetch(result.download_url);

        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        const content = await response.text();
        setFileContent(content);
      } catch (error) {
        console.error('Error fetching file content:', error);
        setFileContentError(error.message);
      } finally {
        setFileContentLoading(false);
      }
    };

    fetchFileContent();
  }, [selectedFile]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return dateStr;
    }
  };

  // Determine what to show
  const item = selectedFile || selectedPaper || selectedArtifact || selectedTask || selectedProject;
  const itemType = selectedFile ? 'file' : selectedPaper ? 'paper' : selectedArtifact ? 'artifact' : selectedTask ? 'task' : selectedProject ? 'project' : null;

  if (!item) {
    return (
      <div 
        className="h-full w-full overflow-hidden flex flex-col"
        data-testid="inspector"
      >
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border flex-shrink-0">
          <Info className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inspector</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-xs text-muted-foreground text-center">
            Select an item to view its details and provenance
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-full w-full overflow-hidden flex flex-col"
      data-testid="inspector"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border flex-shrink-0">
        <Info className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inspector</span>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Header */}
          <div>
            <Badge variant="secondary" className="text-[10px] mb-2 capitalize">{itemType}</Badge>
            <h3 className="font-semibold text-sm tracking-tight font-['IBM_Plex_Sans'] leading-tight">
              {itemType === 'file' ? item.name :
               itemType === 'paper' ? item.title :
               itemType === 'artifact' ? item.title :
               itemType === 'task' ? item.name :
               itemType === 'project' ? item.research_goal?.slice(0, 60) : 'Unknown'}
            </h3>
          </div>

          <Separator />

          {/* Status */}
          {(item.status || item.state) && (
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Status</span>
              <StatusBadge status={item.status || item.state} />
            </div>
          )}

          {/* Common Metadata */}
          <div className="space-y-0.5">
            <MetadataItem icon={Hash} label="ID" value={item.id?.slice(0, 8)} mono />
            <MetadataItem icon={Calendar} label="Created" value={formatDate(item.created_at)} />
            {item.updated_at && (
              <MetadataItem icon={Clock} label="Updated" value={formatDate(item.updated_at)} />
            )}
          </div>

          <Separator />

          {/* Type-specific Metadata */}
          {itemType === 'file' && (() => {
            const textExtensions = ['.md', '.py', '.r', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.csv', '.txt'];
            const isTextFile = textExtensions.some(ext => item.name?.toLowerCase().endsWith(ext));

            return (
              <div className="space-y-0.5">
                <MetadataItem icon={FileType} label="File Type" value={item.mime_type || 'Unknown'} />
                <MetadataItem icon={HardDrive} label="Size" value={item.size_bytes ? `${(item.size_bytes / 1024).toFixed(1)} KB` : 'Unknown'} />
                {item.path && (
                  <MetadataItem icon={Hash} label="Path" value={item.path} mono />
                )}
                {item.tags && Object.keys(item.tags).length > 0 && (
                  <div className="mt-2 p-2 bg-muted/50 rounded-md">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Metadata</span>
                    <pre className="text-[10px] font-mono overflow-x-auto">
                      {JSON.stringify(item.tags, null, 2)}
                    </pre>
                  </div>
                )}
                {item.mime_type?.includes('pdf') && item.tags?.page_count && (
                  <MetadataItem icon={FileText} label="Pages" value={item.tags.page_count} />
                )}

                {/* File preview for text files */}
                {isTextFile && (
                  <div className="py-1.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Preview</span>

                    {/* File content preview */}
                    <div className="bg-muted/50 p-2 rounded max-h-64 overflow-y-auto">
                      {fileContentLoading && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-xs">Loading preview...</span>
                        </div>
                      )}

                      {fileContentError && (
                        <div className="text-xs text-red-400">
                          <Eye className="h-3 w-3 inline mr-1" />
                          Failed to load preview: {fileContentError}
                        </div>
                      )}

                      {!fileContentLoading && !fileContentError && fileContent && (
                        <pre className="text-[10px] font-mono whitespace-pre-wrap break-words">
                          {fileContent}
                        </pre>
                      )}

                      {!fileContentLoading && !fileContentError && !fileContent && (
                        <div className="text-xs text-muted-foreground">
                          <Eye className="h-3 w-3 inline mr-1" />
                          Preview not available for this file type
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Download button for all file types */}
                <div className="py-1.5">
                  <a
                    href={`/api/files/files/${item.id}/download`}
                    download={item.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Download {item.name}
                  </a>
                </div>
              </div>
            );
          })()}

          {itemType === 'project' && (
            <div className="space-y-0.5">
              <MetadataItem icon={FileType} label="Output Type" value={item.output_type?.replace('_', ' ')} />
              <MetadataItem icon={Users} label="Audience" value={item.audience} />
              {item.task_counts && (
                <div className="mt-2 p-2 bg-muted/50 rounded-md">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Task Counts</span>
                  <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                    <span className="text-yellow-500">Pending: {item.task_counts.pending || 0}</span>
                    <span className="text-blue-500">Running: {item.task_counts.running || 0}</span>
                    <span className="text-green-500">Done: {item.task_counts.completed || 0}</span>
                    <span className="text-red-500">Failed: {item.task_counts.failed || 0}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {itemType === 'task' && (
            <div className="space-y-0.5">
              <MetadataItem icon={FileType} label="Task Type" value={item.task_type?.replace('_', ' ')} />
              {item.description && (
                <div className="py-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Description</span>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              )}
              {item.error_message && (
                <div className="py-1.5">
                  <span className="text-[10px] text-red-500 uppercase tracking-wider block mb-1">Error</span>
                  <p className="text-xs text-red-400 font-mono bg-red-500/10 p-2 rounded">{item.error_message}</p>
                </div>
              )}
              {item.output_artifact_id && (
                <MetadataItem icon={FileType} label="Output Artifact" value={item.output_artifact_id?.slice(0, 8)} mono />
              )}
            </div>
          )}

          {itemType === 'artifact' && (
            <div className="space-y-0.5">
              <MetadataItem icon={FileType} label="Artifact Type" value={item.artifact_type?.replace('_', ' ')} />
              <MetadataItem icon={Hash} label="Task ID" value={item.task_id?.slice(0, 8)} mono />
              <MetadataItem icon={Hash} label="Run ID" value={item.run_id?.slice(0, 8)} mono />
              {item.metadata && (
                <div className="mt-2 p-2 bg-muted/50 rounded-md">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Metadata</span>
                  <pre className="text-[10px] font-mono overflow-x-auto">
                    {JSON.stringify(item.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {itemType === 'paper' && (
            <div className="space-y-0.5">
              <MetadataItem icon={BookOpen} label="Source" value={item.source?.replace('_', ' ')} />
              <MetadataItem icon={Calendar} label="Year" value={item.year} />
              {item.authors?.length > 0 && (
                <div className="py-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Authors</span>
                  <p className="text-xs">{item.authors.slice(0, 3).join(', ')}{item.authors.length > 3 ? ` +${item.authors.length - 3} more` : ''}</p>
                </div>
              )}
              {item.citation_count !== null && item.citation_count !== undefined && (
                <MetadataItem icon={Hash} label="Citations" value={item.citation_count} />
              )}
              {item.url && (
                <div className="py-1.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">URL</span>
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                  >
                    <Link2 className="h-3 w-3" />
                    View Paper
                  </a>
                </div>
              )}
              {item.pdf_url && (
                <div className="py-1.5">
                  <a 
                    href={item.pdf_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                  >
                    <FileType className="h-3 w-3" />
                    Download PDF
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
