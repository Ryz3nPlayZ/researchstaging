import { useState, useEffect } from 'react';
import { Loader2, FileText, AlertCircle, Download } from 'lucide-react';
import { filesApi } from '../../lib/api';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

export const FileViewer = ({ file }) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      if (!file) {
        setContent(null);
        setError(null);
        return;
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      // Binary formats that can't be previewed as text
      const binaryFormats = ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'zip', 'exe', 'dll'];

      // PDF and images get inline URLs (use full backend URL to avoid iframe routing issues)
      if (ext === 'pdf') {
        setContent({ type: 'pdf', url: `${BACKEND_URL}/api/files/files/${file.id}/download?disposition=inline` });
        setLoading(false);
        return;
      } else if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext)) {
        setContent({ type: 'image', url: `${BACKEND_URL}/api/files/files/${file.id}/download?disposition=inline` });
        setLoading(false);
        return;
      } else if (binaryFormats.includes(ext)) {
        // Binary formats can't be previewed
        setContent({ type: 'unsupported', ext });
        setLoading(false);
        return;
      }

      // Text files - fetch content
      setLoading(true);
      setError(null);

      try {
        const result = await filesApi.downloadFile(file.id);
        const response = await fetch(result.download_url);

        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.statusText}`);
        }

        const text = await response.text();
        setContent({ type: 'text', content: text });
      } catch (err) {
        console.error('Error fetching file content:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [file]);

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center border-2 border-dashed border-border rounded-lg">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Select a file to preview</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading file...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <p className="text-sm text-red-500">Failed to load file</p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <a
            href={`/api/files/files/${file.id}/download`}
            download={file.name}
            className="text-xs text-blue-500 hover:underline flex items-center gap-1"
          >
            <Download className="h-3 w-3" />
            Download instead
          </a>
        </div>
      </div>
    );
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold truncate">{file.name}</h3>
          <p className="text-xs text-muted-foreground truncate">{file.path}</p>
        </div>
        <a
          href={`${BACKEND_URL}/api/files/files/${file.id}/download`}
          download={file.name}
          className="text-sm text-blue-500 hover:underline flex items-center gap-1 flex-shrink-0 ml-2"
        >
          <Download className="h-4 w-4" />
          Download
        </a>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {!content && (
          <div className="h-full flex items-center justify-center border-2 border-dashed border-border rounded-lg m-4">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Preview not available for this file type</p>
              <p className="text-xs text-muted-foreground mt-1">.{ext}</p>
            </div>
          </div>
        )}

        {content?.type === 'unsupported' && (
          <div className="h-full flex items-center justify-center border-2 border-dashed border-border rounded-lg m-4">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Preview not available for this file type</p>
              <p className="text-xs text-muted-foreground mt-1">.{content.ext} files cannot be previewed in browser</p>
              <a
                href={`${BACKEND_URL}/api/files/files/${file.id}/download`}
                download={file.name}
                className="text-sm text-blue-500 hover:underline flex items-center gap-1 mt-2"
              >
                <Download className="h-4 w-4" />
                Download to view
              </a>
            </div>
          </div>
        )}

        {content?.type === 'pdf' && (
          <div className="h-full w-full">
            <iframe
              src={content.url}
              className="w-full h-full border-0"
              title={file.name}
            />
          </div>
        )}

        {content?.type === 'image' && (
          <div className="h-full flex items-center justify-center bg-muted/30">
            <img
              src={content.url}
              alt={file.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

        {content?.type === 'text' && (
          <div className="h-full w-full overflow-auto bg-background">
            <pre className="text-sm font-mono whitespace-pre-wrap p-4">{content.content}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
