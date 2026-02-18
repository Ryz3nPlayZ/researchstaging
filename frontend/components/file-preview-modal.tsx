'use client';

import { useEffect, useState } from 'react';
import { fileApi } from '@/lib/api';
import { Loader2, X, Download, FileText, AlertCircle } from 'lucide-react';

interface FilePreviewModalProps {
    fileId: string;
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
    fileName: string;
    fileType: string; // MIME type or extension
}

export function FilePreviewModal({ fileId, projectId, isOpen, onClose, fileName, fileType }: FilePreviewModalProps) {
    const [loading, setLoading] = useState(true);
    const [content, setContent] = useState<string | null>(null);
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setContent(null);
            setBlobUrl(null);
            setError(null);
            return;
        }

        const loadPreview = async () => {
            setLoading(true);
            setError(null);
            try {
                // Determine preview strategy based on file type
                const lowerType = fileType.toLowerCase();
                const isImage = lowerType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
                const isPdf = lowerType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
                const isText = lowerType.startsWith('text/') || /\.(txt|md|csv|json|py|js|ts|tsx|css|html|r|yaml|yml)$/i.test(fileName);

                if (isImage || isPdf) {
                    const url = await fileApi.getBlobUrl(fileId);
                    setBlobUrl(url);
                } else if (isText) {
                    const res = await fileApi.getContent(fileId, projectId);
                    if (res.data && res.data.content) {
                        setContent(res.data.content);
                    } else {
                        throw new Error('No content returned');
                    }
                } else {
                    // Fallback for unsupported types
                    setError('Preview not available for this file type.');
                }
            } catch (err) {
                console.error('Preview failed:', err);
                setError('Failed to load preview.');
            } finally {
                setLoading(false);
            }
        };

        loadPreview();

        // Cleanup blob URL on unmount or close
        return () => {
            if (blobUrl) window.URL.revokeObjectURL(blobUrl);
        };
    }, [isOpen, fileId, projectId, fileType, fileName]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <FileText size={20} className="text-[#1C7C54]" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">{fileName}</h3>
                            <p className="text-xs text-gray-500">{fileType}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => fileApi.download(fileId, fileName)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <Download size={16} /> Download
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-gray-100 overflow-hidden relative flex items-center justify-center">
                    {loading && (
                        <div className="flex flex-col items-center gap-3 text-gray-500">
                            <Loader2 size={32} className="animate-spin text-[#1C7C54]" />
                            <span className="text-sm font-medium">Loading preview...</span>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-gray-200 max-w-md">
                            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle size={24} className="text-red-500" />
                            </div>
                            <h4 className="text-gray-900 font-medium mb-1">Preview Unavailable</h4>
                            <p className="text-sm text-gray-500 mb-4">{error}</p>
                            <button
                                onClick={() => fileApi.download(fileId, fileName)}
                                className="inline-flex items-center justify-center gap-2 bg-[#1C7C54] hover:bg-[#156343] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors w-full"
                            >
                                <Download size={16} /> Download File
                            </button>
                        </div>
                    )}

                    {!loading && !error && blobUrl && (
                        <>
                            {/* Image Preview */}
                            {(fileType.toLowerCase().startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName)) && (
                                <img
                                    src={blobUrl}
                                    alt={fileName}
                                    className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
                                />
                            )}

                            {/* PDF Preview */}
                            {(fileType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf')) && (
                                <iframe
                                    src={blobUrl}
                                    className="w-full h-full border-none bg-white"
                                    title="PDF Preview"
                                />
                            )}
                        </>
                    )}

                    {!loading && !error && content && (
                        <div className="w-full h-full overflow-auto bg-white p-6">
                            <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap leading-relaxed">
                                {content}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
