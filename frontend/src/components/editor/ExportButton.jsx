import React, { useState } from 'react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Download, Loader2 } from 'lucide-react';
import { documentsApi } from '../../lib/api';
import { useToast } from '../../hooks/use-toast';

export const ExportButton = ({ documentId, projectId, documentTitle = 'document', disabled = false }) => {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState(null);

  // Sanitize filename for download
  const sanitizeFilename = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Download blob as file
  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Handle export
  const handleExport = async (format) => {
    if (!documentId || !projectId) {
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: 'Missing document or project ID',
      });
      return;
    }

    setExporting(true);
    setExportFormat(format);

    try {
      let blob;
      const sanitizedTitle = sanitizeFilename(documentTitle);

      if (format === 'pdf') {
        blob = await documentsApi.exportDocumentPdf(documentId, projectId);
        downloadBlob(blob, `${sanitizedTitle}.pdf`);
      } else if (format === 'docx') {
        blob = await documentsApi.exportDocumentDocx(documentId, projectId);
        downloadBlob(blob, `${sanitizedTitle}.docx`);
      }

      toast({
        title: 'Export successful',
        description: `Document exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);

      let errorMessage = 'Export failed. Please try again.';

      if (error.message.includes('not found')) {
        errorMessage = 'Document not found';
      } else if (error.message.includes('permission')) {
        errorMessage = 'You do not have permission to export this document';
      } else if (error.message.includes('service unavailable')) {
        errorMessage = 'Export service unavailable. Please contact support.';
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Connection error. Check your internet connection.';
      }

      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: errorMessage,
      });
    } finally {
      setExporting(false);
      setExportFormat(null);
    }
  };

  const isExporting = exporting && exportFormat !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          disabled={disabled || isExporting}
          title="Export"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleExport('pdf')}
          disabled={isExporting}
        >
          {isExporting && exportFormat === 'pdf' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export as PDF
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('docx')}
          disabled={isExporting}
        >
          {isExporting && exportFormat === 'docx' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export as DOCX
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButton;
