import { FileItem, relativeTime } from '@/lib/types';
import { Upload, FileText, Download, Eye } from 'lucide-react';
import { fileApi } from '@/lib/api';

interface FilesTabProps {
    files: FileItem[];
    onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPreviewFile: (file: FileItem) => void;
}

export function FilesTab({ files, onUploadFile, onPreviewFile }: FilesTabProps) {
    return (
        <div className="flex flex-col h-full bg-white rounded-xl border border-black/5 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <h3 className="text-[12px] font-semibold text-gray-700">Datasets & Files</h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-600">
                        {files.length}
                    </span>
                </div>
                <label className="inline-flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors shadow-sm cursor-pointer hover:-translate-y-[1px]">
                    <Upload size={12} />
                    Upload File
                    <input type="file" className="hidden" onChange={onUploadFile} />
                </label>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {files.length > 0 ? (
                    <div className="space-y-1">
                        {files.map((file) => (
                            <div key={file.id}
                                className="p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-black/5 transition-colors flex items-center justify-between group cursor-pointer"
                                onClick={() => onPreviewFile(file)}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors shrink-0">
                                        <FileText size={14} className="text-gray-500" />
                                    </div>
                                    <div className="min-w-0 pr-4">
                                        <h4 className="text-[13px] font-medium text-gray-900 group-hover:text-emerald-600 transition-colors truncate mb-0.5">{file.name}</h4>
                                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                                            <span className="uppercase tracking-wide">{file.file_type || 'Unknown'}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                            <span>{(file.size_bytes / 1024).toFixed(1)} KB</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300" />
                                            <span>{relativeTime(file.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onPreviewFile(file);
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-white rounded border border-transparent hover:border-black/5 hover:shadow-sm transition-all"
                                        title="Preview"
                                    >
                                        <Eye size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            fileApi.download(file.id, file.name);
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-white rounded border border-transparent hover:border-black/5 hover:shadow-sm transition-all"
                                        title="Download"
                                    >
                                        <Download size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                        <Upload size={24} className="text-gray-300 mb-3" />
                        <h3 className="text-[13px] font-medium text-gray-900 mb-1">No files yet</h3>
                        <p className="text-[12px] text-gray-500 max-w-sm mb-4">Upload PDFs, datasets, or other research materials to reference in your work.</p>
                        <label className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors shadow-sm cursor-pointer hover:-translate-y-[1px]">
                            <Upload size={12} />
                            Upload File
                            <input type="file" className="hidden" onChange={onUploadFile} />
                        </label>
                    </div>
                )}
            </div>
        </div>
    );
}
