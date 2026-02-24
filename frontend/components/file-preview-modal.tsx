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
                const lowerType = fileType.toLowerCase();
                const lowerName = fileName.toLowerCase();
                const isImage = lowerType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
                const isPdf = lowerType === 'application/pdf' || lowerName.endsWith('.pdf');
                const isText = lowerType.startsWith('text/') || /\.(txt|md|csv|json|py|js|ts|tsx|css|html|r|yaml|yml|tex|bib|log|sh|toml|cfg|ini)$/i.test(fileName);
                const isDocx = lowerName.endsWith('.docx') || lowerType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

                if (isImage || isPdf) {
                    // Binary preview via blob URL
                    const url = await fileApi.getBlobUrl(fileId);
                    setBlobUrl(url);
                } else if (isDocx) {
                    // DOCX: try content API for tiptap extraction, fallback to download
                    try {
                        const res = await fileApi.getContent(fileId, projectId);
                        const data = res.data as Record<string, unknown> | undefined;
                        if (data?.tiptap) {
                            // Extract text from tiptap JSON for preview
                            const text = extractTiptapText(data.tiptap as Record<string, unknown>);
                            setContent(text || '(Empty document)');
                        } else if (data?.content && typeof data.content === 'string') {
                            setContent(data.content);
                        } else {
                            setError('DOCX preview not available. Use download instead.');
                        }
                    } catch {
                        setError('DOCX preview not available. Use download instead.');
                    }
                } else if (isText) {
                    // Text file: try content API, fallback to blob
                    try {
                        const res = await fileApi.getContent(fileId, projectId);
                        const data = res.data as Record<string, unknown> | undefined;
                        if (data?.content && typeof data.content === 'string') {
                            setContent(data.content);
                        } else if (data?.tiptap) {
                            const text = extractTiptapText(data.tiptap as Record<string, unknown>);
                            setContent(text || '(Empty file)');
                        } else {
                            // Fallback: try blob
                            const url = await fileApi.getBlobUrl(fileId);
                            const resp = await fetch(url);
                            const text = await resp.text();
                            setContent(text || '(Empty file)');
                            window.URL.revokeObjectURL(url);
                        }
                    } catch {
                        // Final fallback: try blob URL as text
                        try {
                            const url = await fileApi.getBlobUrl(fileId);
                            const resp = await fetch(url);
                            const text = await resp.text();
                            setContent(text || '(Empty file)');
                            window.URL.revokeObjectURL(url);
                        } catch {
                            setError('Failed to load file content.');
                        }
                    }
                } else {
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

        return () => {
            if (blobUrl) window.URL.revokeObjectURL(blobUrl);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, fileId, projectId, fileType, fileName]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <FileText size={18} className="text-[var(--color-accent-500)]" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">{fileName}</h3>
                            <p className="text-[11px] text-gray-500">{fileType}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => fileApi.download(fileId, fileName)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                        >
                            <Download size={14} /> Download
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 bg-gray-100 overflow-hidden relative flex items-center justify-center">
                    {loading && (
                        <div className="flex flex-col items-center gap-3 text-gray-500">
                            <Loader2 size={28} className="animate-spin text-[var(--color-accent-500)]" />
                            <span className="text-sm font-medium">Loading preview...</span>
                        </div>
                    )}

                    {!loading && error && (
                        <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200 max-w-sm">
                            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <AlertCircle size={20} className="text-red-500" />
                            </div>
                            <h4 className="text-gray-900 font-medium text-sm mb-1">Preview Unavailable</h4>
                            <p className="text-xs text-gray-500 mb-3">{error}</p>
                            <button
                                onClick={() => fileApi.download(fileId, fileName)}
                                className="inline-flex items-center justify-center gap-2 bg-[var(--color-accent-500)] hover:bg-[var(--color-accent-600)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full"
                            >
                                <Download size={14} /> Download File
                            </button>
                        </div>
                    )}

                    {!loading && !error && blobUrl && (
                        <>
                            {(fileType.toLowerCase().startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName)) && (
                                <img
                                    src={blobUrl}
                                    alt={fileName}
                                    className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
                                />
                            )}
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

/** Extract plaintext from a TipTap JSON structure */
function extractTiptapText(node: Record<string, unknown>): string {
    if (!node) return '';
    if (typeof node.text === 'string') return node.text;
    if (Array.isArray(node.content)) {
        return (node.content as Record<string, unknown>[])
            .map(extractTiptapText)
            .join(node.type === 'paragraph' ? '\n' : '');
    }
    return '';
}
