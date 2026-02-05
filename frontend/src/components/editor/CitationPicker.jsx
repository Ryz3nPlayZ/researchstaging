import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Search, Loader2, BookOpen, FileText } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

/**
 * CitationPicker - Dialog for inserting citations into documents
 *
 * Props:
 * - documentId: ID of the document being edited
 * - projectId: ID of the current project
 * - onInsert: Callback when citation is inserted { citationData, position }
 * - onClose: Callback to close dialog
 * - editor: TipTap editor instance
 */
export const CitationPicker = ({ documentId, projectId, onInsert, onClose, editor }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('literature');
  const [citationStyle, setCitationStyle] = useState('APA');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Literature search state
  const [literaturePapers, setLiteraturePapers] = useState([]);
  const [literatureQuery, setLiteratureQuery] = useState('');
  const [isSearchingLiterature, setIsSearchingLiterature] = useState(false);

  // Manual citation form state
  const [manualCitation, setManualCitation] = useState({
    authors: '',
    title: '',
    year: '',
    venue: '',
    url: '',
  });

  // Preview state
  const [previewCitation, setPreviewCitation] = useState('');

  /**
   * Format citation preview based on style and data
   */
  const formatPreview = React.useCallback((data, style) => {
    const { authors, title, year, venue } = data;

    if (!authors && !title) {
      return 'Enter citation details to preview';
    }

    switch (style) {
      case 'APA':
        return authors && year
          ? `${authors} (${year}). ${title}${venue ? `. ${venue}` : ''}.`
          : `${title}${year ? ` (${year})` : ''}${venue ? `. ${venue}` : ''}.`;

      case 'MLA':
        return authors
          ? `${authors}. "${title}."${venue ? ` ${venue},` : ''}${year ? ` ${year}` : ''}.`
          : `"${title}."${venue ? ` ${venue},` : ''}${year ? ` ${year}` : ''}.`;

      case 'Chicago':
        return authors
          ? `${authors}. ${title}${year ? ` (${year})` : ''}${venue ? `. ${venue}` : ''}.`
          : `${title}${year ? ` (${year})` : ''}${venue ? `. ${venue}` : ''}.`;

      default:
        return `${authors ? authors + '. ' : ''}${title}${year ? ` (${year})` : ''}${venue ? `. ${venue}` : ''}.`;
    }
  }, []);

  /**
   * Update preview when manual citation changes
   */
  useEffect(() => {
    setPreviewCitation(formatPreview(manualCitation, citationStyle));
  }, [manualCitation, citationStyle, formatPreview]);

  /**
   * Search for papers in memory backend
   */
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Search papers via API
      const apiUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(
        `${apiUrl}/api/projects/${projectId}/papers?search=${encodeURIComponent(searchQuery)}&limit=20`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to search papers');
      }

      const data = await response.json();
      setSearchResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        variant: 'destructive',
        title: 'Search failed',
        description: error.message,
      });
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, searchQuery, toast]);

  /**
   * Search literature databases (Semantic Scholar + arXiv)
   */
  const handleLiteratureSearch = useCallback(async () => {
    if (!literatureQuery.trim()) {
      setLiteraturePapers([]);
      return;
    }

    setIsSearchingLiterature(true);
    try {
      const { literatureApi } = await import('../../lib/api');
      const response = await literatureApi.search(literatureQuery, 20);
      setLiteraturePapers(response.data || []);
    } catch (error) {
      console.error('Literature search error:', error);
      toast({
        variant: 'destructive',
        title: 'Literature search failed',
        description: error.response?.data?.detail || error.message || 'Failed to search literature databases',
      });
      setLiteraturePapers([]);
    } finally {
      setIsSearchingLiterature(false);
    }
  }, [literatureQuery, toast]);

  /**
   * Debounced search
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'memory' && searchQuery.trim()) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab, handleSearch]);

  /**
   * Debounced literature search
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'literature' && literatureQuery.trim()) {
        handleLiteratureSearch();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [literatureQuery, activeTab, handleLiteratureSearch]);

  /**
   * Insert citation from search result
   */
  const handleInsertFromMemory = (paper) => {
    const citationData = {
      source_type: 'paper',
      source_id: paper.id,
      citation_data: {
        authors: paper.authors || [],
        title: paper.title,
        year: paper.year,
        venue: paper.venue || paper.source || '',
        url: paper.url || '',
        doi: paper.doi || '',
      },
    };

    insertCitation(citationData);
  };

  /**
   * Insert citation from literature search
   */
  const handleInsertFromLiterature = async (paper) => {
    try {
      // Format citation using backend API
      const apiUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/citations/format-paper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          paper: {
            title: paper.title,
            authors: paper.authors || [],
            year: paper.year,
            venue: paper.venue || '',
            doi: paper.doi || '',
            url: paper.url || '',
            source: paper.source,
          },
          styles: [citationStyle.toLowerCase()],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to format citation');
      }

      const data = await response.json();

      // Get formatted citation for current style
      const formattedCitation = data[citationStyle.toLowerCase()];

      if (!formattedCitation) {
        throw new Error(`Citation not formatted for ${citationStyle} style`);
      }

      // Create citation data structure
      const citationData = {
        source_type: 'literature',
        source_id: paper.external_id || paper.doi || paper.url,
        citation_data: {
          authors: paper.authors || [],
          title: paper.title,
          year: paper.year,
          venue: paper.venue || '',
          url: paper.url || '',
          doi: paper.doi || '',
          formatted_text: formattedCitation,
        },
      };

      insertCitation(citationData);
    } catch (error) {
      console.error('Insert literature citation error:', error);
      toast({
        variant: 'destructive',
        title: 'Insert failed',
        description: error.message || 'Failed to insert citation',
      });
    }
  };

  /**
   * Insert manual citation
   */
  const handleInsertManual = () => {
    if (!manualCitation.title) {
      toast({
        variant: 'destructive',
        title: 'Title required',
        description: 'Please enter at least a title for the citation.',
      });
      return;
    }

    const citationData = {
      source_type: 'manual',
      source_id: null,
      citation_data: {
        ...manualCitation,
        authors: manualCitation.authors ? manualCitation.authors.split(',').map(a => a.trim()) : [],
      },
    };

    insertCitation(citationData);
  };

  /**
   * Insert citation into document
   */
  const insertCitation = async (citationData) => {
    if (!editor) {
      toast({
        variant: 'destructive',
        title: 'Editor not ready',
        description: 'Please wait for the editor to load.',
      });
      return;
    }

    try {
      // Get cursor position before insertion
      const { from } = editor.state.selection;

      // Format in-text citation based on style
      const authors = citationData.citation_data.authors || [];
      const year = citationData.citation_data.year;
      let inTextCitation = '';

      if (authors.length > 0 && year) {
        const firstAuthor = authors[0];
        if (authors.length === 1) {
          inTextCitation = `(${firstAuthor}, ${year})`;
        } else if (authors.length === 2) {
          inTextCitation = `(${firstAuthor} & ${authors[1]}, ${year})`;
        } else {
          inTextCitation = `(${firstAuthor} et al., ${year})`;
        }
      } else if (citationData.citation_data.title) {
        // Fallback to title if no authors
        const title = citationData.citation_data.title;
        inTextCitation = `("${title.substring(0, 30)}${title.length > 30 ? '...' : ''}"${year ? `, ${year}` : ''})`;
      }

      // Insert citation mark at cursor position
      editor.chain().focus().insertContent(inTextCitation).run();

      // Call backend to save citation
      const apiUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
      await fetch(`${apiUrl}/api/memory/documents/${documentId}/citations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          source_type: citationData.source_type,
          source_id: citationData.source_id,
          citation_data: citationData.citation_data,
          citation_position: { from },
        }),
      });

      toast({
        title: 'Citation inserted',
        description: 'Citation has been added to your document.',
      });

      onClose();
      onInsert?.(citationData);
    } catch (error) {
      console.error('Insert error:', error);
      toast({
        variant: 'destructive',
        title: 'Insert failed',
        description: error.message || 'Failed to insert citation',
      });
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Insert Citation</DialogTitle>
          <DialogDescription>
            Search your memory or enter citation details manually
          </DialogDescription>
        </DialogHeader>

        {/* Citation Style Selector */}
        <div className="flex items-center gap-4 pb-4 border-b">
          <Label htmlFor="citation-style">Style:</Label>
          <Select value={citationStyle} onValueChange={setCitationStyle}>
            <SelectTrigger id="citation-style" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="APA">APA 7th</SelectItem>
              <SelectItem value="MLA">MLA 9th</SelectItem>
              <SelectItem value="Chicago">Chicago 17th</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="literature" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Literature Search
            </TabsTrigger>
            <TabsTrigger value="memory" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              From Memory
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Manual Entry
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Literature Search */}
          <TabsContent value="literature" className="flex-1 overflow-hidden flex flex-col mt-2">
            <div className="flex items-center gap-2 pb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Semantic Scholar & arXiv..."
                  value={literatureQuery}
                  onChange={(e) => setLiteratureQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              {isSearchingLiterature && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>

            <ScrollArea className="flex-1 border rounded-md">
              {literaturePapers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {literatureQuery.trim() ? (
                    <>
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No papers found. Try a different search term.</p>
                    </>
                  ) : (
                    <>
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Search academic literature databases to find papers.</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {literaturePapers.map((paper, index) => (
                    <div
                      key={`${paper.source}-${paper.external_id || index}`}
                      className="p-3 border rounded-md hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm mb-1 line-clamp-2">{paper.title}</div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {paper.authors && paper.authors.length > 0
                              ? paper.authors.slice(0, 3).join(', ') +
                                (paper.authors.length > 3 ? ' et al.' : '')
                              : 'Unknown authors'}
                            {paper.year && ` • ${paper.year}`}
                          </div>
                          {(paper.pdf_url || paper.open_access_pdf_url) && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 hover:bg-green-200">
                              <BadgeCheck className="h-3 w-3 mr-1" />
                              PDF Available
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-xs"
                          onClick={() => handleInsertFromLiterature(paper)}
                        >
                          Insert
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Tab 2: Search from Memory */}
          <TabsContent value="memory" className="flex-1 overflow-hidden flex flex-col mt-2">
            <div className="flex items-center gap-2 pb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search papers by title, author, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>

            <ScrollArea className="flex-1 border rounded-md">
              {searchResults.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {searchQuery.trim() ? (
                    <>
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No papers found. Try a different search term.</p>
                    </>
                  ) : (
                    <>
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Search for papers in your memory to cite them.</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {searchResults.map((paper) => (
                    <div
                      key={paper.id}
                      className="p-3 border rounded-md hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => handleInsertFromMemory(paper)}
                    >
                      <div className="font-medium text-sm mb-1">{paper.title}</div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {paper.authors && paper.authors.length > 0
                          ? paper.authors.slice(0, 3).join(', ') +
                            (paper.authors.length > 3 ? ' et al.' : '')
                          : 'Unknown authors'}
                        {paper.year && ` • ${paper.year}`}
                      </div>
                      {paper.venue && (
                        <Badge variant="secondary" className="text-xs">
                          {paper.venue}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* Tab 2: Manual Entry */}
          <TabsContent value="manual" className="flex-1 overflow-hidden flex flex-col mt-2">
            <ScrollArea className="flex-1 px-1">
              <div className="space-y-4 pr-4">
                <div className="space-y-2">
                  <Label htmlFor="authors">
                    Authors <span className="text-muted-foreground">(comma-separated)</span>
                  </Label>
                  <Input
                    id="authors"
                    placeholder="Smith, John, Doe, Jane"
                    value={manualCitation.authors}
                    onChange={(e) =>
                      setManualCitation({ ...manualCitation, authors: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Paper or article title"
                    value={manualCitation.title}
                    onChange={(e) =>
                      setManualCitation({ ...manualCitation, title: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Input
                      id="year"
                      placeholder="2024"
                      value={manualCitation.year}
                      onChange={(e) =>
                        setManualCitation({ ...manualCitation, year: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="venue">Venue/Journal</Label>
                    <Input
                      id="venue"
                      placeholder="Nature, ACM, etc."
                      value={manualCitation.venue}
                      onChange={(e) =>
                        setManualCitation({ ...manualCitation, venue: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">URL (optional)</Label>
                  <Input
                    id="url"
                    placeholder="https://..."
                    value={manualCitation.url}
                    onChange={(e) =>
                      setManualCitation({ ...manualCitation, url: e.target.value })
                    }
                  />
                </div>

                {/* Preview */}
                <div className="border rounded-md p-3 bg-muted/30">
                  <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
                  <p className="text-sm italic">{previewCitation}</p>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {activeTab === 'manual' && (
            <Button onClick={handleInsertManual} disabled={!manualCitation.title}>
              Insert Citation
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CitationPicker;
