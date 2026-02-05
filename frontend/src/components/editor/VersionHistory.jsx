import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, History, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { documentsApi } from '../../lib/api';
import { useToast } from '../../hooks/use-toast';

/**
 * VersionHistory component - Display document version history with diff and restore.
 *
 * @param {Object} props
 * @param {string} props.documentId - Document ID to fetch versions for
 * @param {Function} props.onVersionRestored - Callback when version is restored (documentId, newContent)
 * @param {Function} props.onClose - Callback to close the version history panel
 */
export const VersionHistory = ({ documentId, onVersionRestored, onClose }) => {
  const { toast } = useToast();
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [selectedVersionContent, setSelectedVersionContent] = useState(null);
  const [currentContent, setCurrentContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [diff, setDiff] = useState(null);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Load versions
  const loadVersions = useCallback(async () => {
    if (!documentId) return;

    setLoading(true);
    try {
      // Load current document
      const docResponse = await documentsApi.loadDocument(documentId);
      setCurrentContent(docResponse.data.content);

      // Load versions
      const versionsResponse = await documentsApi.listVersions(documentId);
      setVersions(versionsResponse.data);
    } catch (error) {
      console.error('Failed to load versions:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to load versions',
        description: error.message || 'Could not load version history'
      });
    } finally {
      setLoading(false);
    }
  }, [documentId, toast]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  // Load selected version content
  const loadVersionContent = useCallback(async (versionId) => {
    try {
      const response = await documentsApi.getVersion(versionId);
      setSelectedVersionContent(response.data.content);
    } catch (error) {
      console.error('Failed to load version content:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to load version',
        description: error.message || 'Could not load version content'
      });
    }
  }, [toast]);

  // Compute diff between current content and selected version
  const computeDiff = useCallback(() => {
    if (!currentContent || !selectedVersionContent) return null;

    // Simple JSON diff for TipTap content
    const currentJson = JSON.stringify(currentContent, null, 2);
    const versionJson = JSON.stringify(selectedVersionContent, null, 2);

    // For MVP, we'll show a basic comparison
    // In a full implementation, you'd use a proper diff library like diff-match-patch
    return {
      current: currentJson,
      version: versionJson,
      hasChanges: currentJson !== versionJson
    };
  }, [currentContent, selectedVersionContent]);

  useEffect(() => {
    if (selectedVersionContent) {
      setDiff(computeDiff());
    }
  }, [selectedVersionContent, computeDiff]);

  // Handle version selection
  const handleVersionClick = useCallback((version) => {
    setSelectedVersion(version);
    loadVersionContent(version.id);
  }, [loadVersionContent]);

  // Handle restore
  const handleRestore = useCallback(async () => {
    if (!selectedVersion) return;

    setRestoring(true);
    try {
      const response = await documentsApi.restoreVersion(documentId, selectedVersion.id);

      toast({
        title: 'Version restored',
        description: 'Document has been restored to the selected version'
      });

      // Reload versions to show the new audit trail entries
      await loadVersions();

      // Notify parent component to update editor
      if (onVersionRestored) {
        onVersionRestored(documentId, response.data.content);
      }

      setRestoreDialogOpen(false);
    } catch (error) {
      console.error('Failed to restore version:', error);
      toast({
        variant: 'destructive',
        title: 'Restore failed',
        description: error.message || 'Could not restore version'
      });
    } finally {
      setRestoring(false);
    }
  }, [documentId, selectedVersion, onVersionRestored, loadVersions, toast]);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  }, []);

  // Render diff content
  const renderDiff = useMemo(() => {
    if (!diff) return null;

    if (!diff.hasChanges) {
      return (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            No changes - this version is identical to the current version
          </AlertDescription>
        </Alert>
      );
    }

    // Simple side-by-side comparison for MVP
    return (
      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
        <div className="space-y-2">
          <div className="font-semibold text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Current Version
          </div>
          <ScrollArea className="h-[400px] w-full rounded border border-border bg-destructive/10 p-4">
            <pre className="whitespace-pre-wrap break-words">{diff.current}</pre>
          </ScrollArea>
        </div>
        <div className="space-y-2">
          <div className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Selected Version
          </div>
          <ScrollArea className="h-[400px] w-full rounded border border-border bg-green-500/10 p-4">
            <pre className="whitespace-pre-wrap break-words">{diff.version}</pre>
          </ScrollArea>
        </div>
      </div>
    );
  }, [diff]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading version history...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Version History</h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Version List */}
        <div className="w-80 border-r border-border">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-2">
              {versions.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No versions yet. Make some edits to see version history.
                </div>
              ) : (
                versions.map((version, index) => (
                  <Card
                    key={version.id}
                    className={`cursor-pointer transition-colors hover:bg-accent ${
                      selectedVersion?.id === version.id ? 'bg-accent border-primary' : ''
                    }`}
                    onClick={() => handleVersionClick(version)}
                  >
                    <CardHeader className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm font-medium truncate">
                            {version.change_description || `Version ${index + 1}`}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {formatTimestamp(version.created_at)}
                          </CardDescription>
                        </div>
                        {index === 0 && (
                          <div className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Current
                          </div>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Diff View */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedVersion ? (
            <>
              {/* Selected Version Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">
                      {selectedVersion.change_description || 'Version'}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Created: {formatTimestamp(selectedVersion.created_at)}
                    </p>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setRestoreDialogOpen(true)}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Restore This Version
                  </Button>
                </div>
              </div>

              {/* Diff Content */}
              <ScrollArea className="flex-1 p-4">
                {renderDiff || (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading diff...
                  </div>
                )}
              </ScrollArea>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a version to see changes</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Version?</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore the document to this version?
              The current version will be saved in the version history before restoring.
            </DialogDescription>
          </DialogHeader>

          {selectedVersion && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Restoring to: {selectedVersion.change_description || `Version from ${formatTimestamp(selectedVersion.created_at)}`}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRestoreDialogOpen(false)}
              disabled={restoring}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleRestore}
              disabled={restoring}
            >
              {restoring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Restoring...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restore Version
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VersionHistory;
