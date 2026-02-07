import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Loader2, RefreshCw, Copy, BookOpen, FileText } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

/**
 * Bibliography - Display formatted bibliography from document citations
 *
 * Props:
 * - documentId: ID of the document
 * - style: Current citation style (apa, mla, chicago)
 * - onStyleChange: Callback when style is changed
 * - citations: Optional array of citations (if fetched by parent)
 */
export const Bibliography = ({ documentId, style = 'APA', onStyleChange, citations: propCitations }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [citations, setCitations] = useState(propCitations || []);
  const [bibliography, setBibliography] = useState('');
  const [count, setCount] = useState(0);
  const [currentStyle, setCurrentStyle] = useState(style);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Fetch bibliography from backend
   */
  const fetchBibliography = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const apiUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(
        `${apiUrl}/api/memory/documents/${documentId}/bibliography?style=${currentStyle.toLowerCase()}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load bibliography');
      }

      const data = await response.json();
      setBibliography(data.bibliography || '');
      setCount(data.count || 0);
      setCitations([]); // Backend returns formatted string, not individual citations
    } catch (error) {
      console.error('Bibliography error:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to load bibliography',
        description: error.message,
      });
      setBibliography('');
      setCount(0);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [documentId, currentStyle, toast]);

  /**
   * Fetch on mount and when style changes
   */
  useEffect(() => {
    fetchBibliography();
  }, [documentId, currentStyle, fetchBibliography]);

  /**
   * Update when prop citations change
   */
  useEffect(() => {
    if (propCitations) {
      setCitations(propCitations);
    }
  }, [propCitations]);

  /**
   * Handle style change
   */
  const handleStyleChange = (newStyle) => {
    setCurrentStyle(newStyle);
    onStyleChange?.(newStyle);
  };

  /**
   * Handle manual refresh
   */
  const handleRefresh = () => {
    fetchBibliography(true);
  };

  /**
   * Copy bibliography to clipboard
   */
  const handleCopy = async () => {
    if (!bibliography) {
      toast({
        variant: 'destructive',
        title: 'Nothing to copy',
        description: 'Bibliography is empty.',
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(bibliography);
      toast({
        title: 'Copied to clipboard',
        description: 'Bibliography has been copied.',
      });
    } catch (error) {
      console.error('Copy error:', error);
      toast({
        variant: 'destructive',
        title: 'Copy failed',
        description: error.message,
      });
    }
  };

  /**
   * Get heading based on style
   */
  const getHeading = () => {
    switch (currentStyle.toUpperCase()) {
      case 'APA':
      case 'MLA':
        return 'References';
      case 'CHICAGO':
        return 'Bibliography';
      default:
        return 'References';
    }
  };

  return (
    <div className="border-t border-border bg-muted/30">
      {/* Header */}
      <div className="px-6 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">{getHeading()}</h3>
          <Badge variant="secondary" className="text-xs">
            {count} {count === 1 ? 'citation' : 'citations'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Style Selector */}
          <Select value={currentStyle} onValueChange={handleStyleChange}>
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="APA">APA 7th</SelectItem>
              <SelectItem value="MLA">MLA 9th</SelectItem>
              <SelectItem value="Chicago">Chicago 17th</SelectItem>
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6" />

          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh bibliography"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>

          {/* Copy Button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleCopy}
            disabled={!bibliography}
            title="Copy to clipboard"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bibliography Content */}
      <div className="px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading bibliography...
          </div>
        ) : !bibliography ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">No citations in document yet.</p>
            <p className="text-xs mt-1">
              Insert citations using the quote icon in the toolbar.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{
                __html: bibliography.split('\n').map(line => {
                  // Add hanging indent for all but first line of each entry
                  if (line.trim()) {
                    return `<p class="pl-8 -indent-8">${line}</p>`;
                  }
                  return '';
                }).join('')
              }}
            />
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default Bibliography;
