
import React, { useState, useEffect } from 'react';
import { fileApi, File } from '../lib/api';

const FilesView: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(undefined);

  // Fetch files on component mount
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fileApi.list(currentProjectId);
        if (response.error) {
          setError(response.error);
          console.error('Failed to fetch files:', response.error);
        } else if (response.data) {
          setFiles(response.data);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Error fetching files:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [currentProjectId]);

  // Format file size to human-readable
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format relative time
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return `${Math.floor(seconds / 604800)} weeks ago`;
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf': return { icon: 'description', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' };
      case 'docx': return { icon: 'article', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' };
      case 'csv': return { icon: 'table_chart', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
      case 'xlsx': return { icon: 'table_chart', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' };
      case 'md': return { icon: 'draft', color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/20' };
      case 'py': return { icon: 'code', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' };
      case 'r': return { icon: 'code', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' };
      default: return { icon: 'draft', color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/20' };
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Files Management</h2>
            <p className="text-slate-500 mt-1">Organize and process your research documents.</p>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold text-sm transition-all shadow-md shadow-primary/20">
            <span className="material-symbols-outlined text-[20px]">upload</span>
            Upload Files
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mb-12">
            <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-slate-500 dark:text-slate-400">Loading files...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-red-500">error</span>
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-200">Failed to load files</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Zone (show when not loading) */}
        {!loading && (
          <div className="mb-12">
            <div className="group relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary dark:hover:border-primary bg-white dark:bg-slate-900 rounded-xl p-12 transition-all flex flex-col items-center justify-center text-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[32px]">cloud_upload</span>
              </div>
              <h3 className="text-lg font-semibold mb-1">Drag and drop files here</h3>
              <p className="text-slate-500 text-sm max-w-sm mb-6">
                Enhance your research by uploading PDFs, documents, or data sets. We support PDF, DOCX, TXT and CSV up to 50MB.
              </p>
              <button className="px-6 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold transition-colors">
                Browse files
              </button>
            </div>
          </div>
        )}

        {/* Files List */}
        {!loading && !error && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Recent Uploads</h3>
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">grid_view</span>
                </button>
                <button className="p-2 text-primary bg-primary/10 rounded transition-colors">
                  <span className="material-symbols-outlined text-[20px]">list</span>
                </button>
              </div>
            </div>

            {files.length > 0 ? (
              <div className="space-y-3">
                {files.map((file) => {
                  const { icon, color, bg } = getFileIcon(file.file_type);
                  return (
                    <div key={file.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className={`size-12 rounded-lg ${bg} flex items-center justify-center ${color}`}>
                          <span className="material-symbols-outlined text-[28px]">{icon}</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{file.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Uploaded {formatRelativeTime(file.created_at)} • {formatFileSize(file.size_bytes)} •
                            <span className="ml-1 font-medium text-primary">
                              Ready
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-[20px]">preview</span>
                        </button>
                        <button className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-slate-500 dark:text-slate-400">No files uploaded yet</p>
              </div>
            )}

            {files.length > 0 && (
              <div className="mt-8 flex items-center justify-center">
                <button className="text-sm font-semibold text-slate-500 hover:text-primary transition-colors flex items-center gap-2 group">
                  View All Workspace Files
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FilesView;
