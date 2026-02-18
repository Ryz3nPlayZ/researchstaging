import { FileItem, relativeTime } from '@/lib/types';
import { Upload, FileText, Download, Eye, Trash2 } from 'lucide-react';
import { fileApi } from '@/lib/api';

interface FilesTabProps {
    files: FileItem[];
    onUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onPreviewFile: (file: FileItem) => void;
}

export function FilesTab({ files, onUploadFile, onPreviewFile }: FilesTabProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-500 font-medium">{files.length} file{files.length !== 1 ? 's' : ''}</p>
                <label className="inline-flex items-center gap-2 bg-[#1C7C54] hover:bg-[#1B512D] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer">
                    <Upload size={16} />
                    Upload File
                    <input type="file" className="hidden" onChange={onUploadFile} />
                </label>
            </div>

            {files.length > 0 ? (
                <div className="space-y-3">
                    {files.map((file) => (
                        <div key={file.id}
                            className="glass rounded-xl px-6 py-4 border border-white/20 flex items-center justify-between group hover:shadow-md transition-all hover:bg-white/80 cursor-pointer"
                            onClick={() => onPreviewFile(file)}
                        >
                            <div className="flex items-center gap-4 flex-1">
                                <div className="p-2 bg-gray-50 rounded-lg text-gray-400 group-hover:text-[#1C7C54] group-hover:bg-[#DEF4C6] transition-colors">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-[#1C7C54] transition-colors">{file.name}</h4>
                                    <p className="text-xs text-gray-500 mt-1 font-medium">
                                        {file.file_type} · {(file.size_bytes / 1024).toFixed(1)} KB · {relativeTime(file.created_at)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onPreviewFile(file);
                                    }}
                                    className="p-2 rounded-lg text-gray-400 hover:text-[#1C7C54] hover:bg-[#DEF4C6] transition-colors"
                                    title="Preview"
                                >
                                    <Eye size={16} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fileApi.download(file.id, file.name);
                                    }}
                                    className="p-2 rounded-lg text-gray-400 hover:text-[#1C7C54] hover:bg-[#DEF4C6] transition-colors"
                                    title="Download"
                                >
                                    <Download size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="glass rounded-2xl p-12 text-center border border-white/20">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload size={32} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No files yet</h3>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">Upload PDFs, datasets, or other research materials to reference in your work.</p>
                    <label className="inline-flex items-center gap-2 bg-[#1C7C54] hover:bg-[#1B512D] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-all cursor-pointer">
                        <Upload size={16} />
                        Upload File
                        <input type="file" className="hidden" onChange={onUploadFile} />
                    </label>
                </div>
            )}
        </div>
    );
}
