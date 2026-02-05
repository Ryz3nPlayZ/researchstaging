import React, { useState, useCallback, useEffect } from 'react';
import {
  Search,
  FileText,
  ExternalLink,
  BookOpen,
  BadgeCheck,
  Loader2,
  AlertCircle,
  Plus,
  Quote
} from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { literatureApi, memoryApi } from '../../lib/api';
import { useToast } from '../../hooks/use-toast';
import { useProject } from '../../context/ProjectContext';
import PropTypes from 'prop-types';

export const LiteratureSearch = ({ onAddToProject, onInsertCitation, currentStyle, documentId, projectId }) => {
  const { toast } = useToast();
  const { selectedProject } = useProject();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Details modal state
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Paper processing state
  const [processingPaperIds, setProcessingPaperIds] = useState(new Set());
  const [extractedClaimCounts, setExtractedClaimCounts] = useState({});

  // Citation insertion state
  const [insertingPaperIds, setInsertingPaperIds] = useState(new Set());

  // Get projectId from prop or context
  const currentProjectId = projectId || selectedProject?.id;

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
      } else if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        setHasSearched(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const performSearch = async (query) => {
    try {
      setIsSearching(true);
      setHasSearched(true);

      const response = await literatureApi.search(query, 20);
      setSearchResults(response.data || []);

    } catch (error) {
      console.error('Literature search failed:', error);
      toast({
        variant: 'destructive',
        title: 'Search failed',
        description: error.response?.data?.detail || 'Failed to search literature. Please try again.',
      });
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchClick = () => {
    if (searchQuery.trim().length >= 2) {
      performSearch(searchQuery);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  const handlePaperClick = (paper) => {
    setSelectedPaper(paper);
    setShowDetailsModal(true);
  };

  const handleAddToProject = (paper, e) => {
    e.stopPropagation(); // Prevent opening modal

    if (onAddToProject) {
      onAddToProject(paper);
      toast({
        title: 'Paper added',
        description: `"${paper.title.substring(0, 50)}..." has been added to your project.`,
      });
    }
  };

  /**
   * Handle citation insertion
   */
  const handleInsertCitation = async (paper, e) => {
    e.stopPropagation(); // Prevent opening modal

    // Check if document is open
    if (!documentId) {
      toast({
        variant: 'destructive',
        title: 'No document open',
        description: 'Please open a document in the workspace to insert citations.',
      });
      return;
    }

    // Check if callback provided
    if (!onInsertCitation) {
      toast({
        variant: 'destructive',
        title: 'Citation insertion not available',
        description: 'This feature is not available in the current context.',
      });
      return;
    }

    // Add to processing set
    const paperKey = paper.external_id || paper.doi || paper.url || JSON.stringify(paper);
    setInsertingPaperIds(prev => new Set([...prev, paperKey]));

    try {
      // Format citation in current style using backend API
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
          styles: [currentStyle?.toLowerCase() || 'apa'],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to format citation');
      }

      const data = await response.json();

      // Get formatted citation for current style
      const style = currentStyle?.toLowerCase() || 'apa';
      const formattedCitation = data[style];

      if (!formattedCitation) {
        throw new Error(`Citation not formatted for ${style} style`);
      }

      // Call parent callback with citation data
      onInsertCitation({
        text: formattedCitation,
        source_type: 'literature',
        source_id: paper.external_id || paper.doi || paper.url,
        metadata: {
          title: paper.title,
          authors: paper.authors,
          year: paper.year,
          venue: paper.venue,
          doi: paper.doi,
          url: paper.url,
          source: paper.source,
        },
      });

      toast({
        title: 'Citation inserted',
        description: `"${paper.title.substring(0, 50)}..." has been cited in your document.`,
      });

    } catch (error) {
      console.error('Insert citation error:', error);
      toast({
        variant: 'destructive',
        title: 'Insert failed',
        description: error.response?.data?.detail || error.message || 'Failed to insert citation',
      });
    } finally {
      // Remove from processing set
      setInsertingPaperIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(paperKey);
        return newSet;
      });
    }
  };

  const handleExtractClaims = async (paper, e) => {
    e.stopPropagation(); // Prevent opening modal

    // Check if paper has PDF URL
    const pdfUrl = paper.open_access_pdf_url || paper.pdf_url;
    if (!pdfUrl) {
      toast({
        variant: 'destructive',
        title: 'No PDF available',
        description: 'This paper does not have a PDF available for claim extraction.',
      });
      return;
    }

    // Check if project is selected
    if (!currentProjectId) {
      toast({
        variant: 'destructive',
        title: 'No project selected',
        description: 'Please select a project before extracting claims.',
      });
      return;
    }

    // Add to processing set
    setProcessingPaperIds(prev => new Set([...prev, paper.external_id]));

    try {
      // Call API to extract claims
      const result = await memoryApi.extractClaims(currentProjectId, {
        paper_id: paper.external_id,
        pdf_url: pdfUrl,
        paper_metadata: {
          title: paper.title,
          authors: paper.authors,
          year: paper.year,
          abstract: paper.abstract,
        },
        max_claims: 20,
      });

      // Update extracted claim counts
      setExtractedClaimCounts(prev => ({
        ...prev,
        [paper.external_id]: result.data.length,
      }));

      toast({
        title: 'Claims extracted',
        description: `Successfully extracted ${result.data.length} claims from "${paper.title.substring(0, 40)}..."`,
      });

      // Also add to project if callback exists
      if (onAddToProject) {
        onAddToProject(paper);
      }
    } catch (error) {
      console.error('Claim extraction failed:', error);
      toast({
        variant: 'destructive',
        title: 'Extraction failed',
        description: error.response?.data?.detail || 'Failed to extract claims from paper. Please try again.',
      });
    } finally {
      // Remove from processing set
      setProcessingPaperIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(paper.external_id);
        return newSet;
      });
    }
  };

  const getSourceBadgeColor = (source) => {
    switch (source) {
      case 'semantic_scholar':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'arxiv':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const formatAuthors = (authors) => {
    if (!authors || authors.length === 0) return 'Unknown';

    if (authors.length <= 3) {
      return authors.join(', ');
    }

    return `${authors.slice(0, 3).join(', ')} et al.`;
  };

  // Empty state illustration
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Search className="w-12 h-12 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">Search Literature</h3>
      <p className="text-sm text-slate-500 max-w-md">
        Search for academic papers from Semantic Scholar and arXiv.
        Results are prioritized by open-access availability.
      </p>
    </div>
  );

  // No results state
  const NoResultsState = () => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-24 h-24 rounded-full bg-amber-50 flex items-center justify-center mb-4">
        <AlertCircle className="w-12 h-12 text-amber-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">No Results Found</h3>
      <p className="text-sm text-slate-500 max-w-md">
        Try different keywords or check your spelling for more accurate results.
      </p>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search Header */}
      <div className="border-b bg-white p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search for papers (e.g., 'machine learning', 'quantum computing')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-9"
              disabled={isSearching}
            />
          </div>
          <Button
            onClick={handleSearchClick}
            disabled={isSearching || searchQuery.trim().length < 2}
            size="sm"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Search
              </>
            )}
          </Button>
        </div>

        {/* Search hints */}
        {!hasSearched && (
          <div className="text-xs text-slate-500">
            <p className="font-medium mb-1">Search tips:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>Use specific keywords for better results</li>
              <li>Open-access papers are shown first</li>
              <li>Results from Semantic Scholar and arXiv</li>
            </ul>
          </div>
        )}
      </div>

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {!hasSearched ? (
            <EmptyState />
          ) : isSearching ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
              <p className="text-sm text-slate-500">Searching literature databases...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <NoResultsState />
          ) : (
            <div className="space-y-3">
              {searchResults.map((paper, index) => (
                <div
                  key={`${paper.source}-${paper.external_id || index}`}
                  className="group border rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer bg-white"
                  onClick={() => handlePaperClick(paper)}
                >
                  {/* Title and badges */}
                  <div className="flex items-start gap-2 mb-2">
                    <h4 className="font-semibold text-sm text-slate-800 flex-1 line-clamp-2 group-hover:text-blue-600">
                      {paper.title}
                    </h4>

                    {/* Source badge */}
                    <Badge
                      variant="secondary"
                      className={`text-xs ${getSourceBadgeColor(paper.source)}`}
                    >
                      {paper.source === 'semantic_scholar' ? 'Semantic Scholar' : 'arXiv'}
                    </Badge>

                    {/* Open access badge */}
                    {(paper.pdf_url || paper.open_access_pdf_url) && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 hover:bg-green-200">
                        <BadgeCheck className="w-3 h-3 mr-1" />
                        PDF
                      </Badge>
                    )}
                  </div>

                  {/* Authors */}
                  <div className="text-xs text-slate-600 mb-2">
                    <span className="font-medium">{formatAuthors(paper.authors)}</span>
                    {paper.year && <span className="ml-2 text-slate-400">({paper.year})</span>}
                  </div>

                  {/* Abstract preview */}
                  {paper.abstract && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                      {paper.abstract}
                    </p>
                  )}

                  {/* Footer: citations and actions */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-slate-400">
                      {paper.citation_count !== null && paper.citation_count !== undefined && (
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          <span>{paper.citation_count} citations</span>
                        </div>
                      )}
                      {extractedClaimCounts[paper.external_id] && (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Quote className="w-3 h-3" />
                          <span>{extractedClaimCounts[paper.external_id]} claims extracted</span>
                        </div>
                      )}
                      {paper.url && (
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View</span>
                        </a>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {/* Extract claims button */}
                      {(paper.pdf_url || paper.open_access_pdf_url) && currentProjectId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs hover:bg-green-50 hover:text-green-600"
                          onClick={(e) => handleExtractClaims(paper, e)}
                          disabled={processingPaperIds.has(paper.external_id)}
                        >
                          {processingPaperIds.has(paper.external_id) ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Extracting...
                            </>
                          ) : (
                            <>
                              <Quote className="w-3 h-3 mr-1" />
                              Extract Claims
                            </>
                          )}
                        </Button>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {/* Insert citation button */}
                        {onInsertCitation && documentId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs hover:bg-green-50 hover:text-green-600"
                            onClick={(e) => handleInsertCitation(paper, e)}
                            disabled={insertingPaperIds.has(paper.external_id || paper.doi || paper.url || JSON.stringify(paper))}
                          >
                            {insertingPaperIds.has(paper.external_id || paper.doi || paper.url || JSON.stringify(paper)) ? (
                              <>
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                Inserting...
                              </>
                            ) : (
                              <>
                                <Quote className="w-3 h-3 mr-1" />
                                Insert Citation
                              </>
                            )}
                          </Button>
                        )}

                        {/* Add to project button */}
                        {onAddToProject && !extractedClaimCounts[paper.external_id] && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs hover:bg-blue-50 hover:text-blue-600"
                            onClick={(e) => handleAddToProject(paper, e)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add to Project
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Paper Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-lg">{selectedPaper?.title}</DialogTitle>
            <DialogDescription>
              {formatAuthors(selectedPaper?.authors)}
              {selectedPaper?.year && ` (${selectedPaper.year})`}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] px-1">
            {selectedPaper && (
              <div className="space-y-4">
                {/* Metadata */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={getSourceBadgeColor(selectedPaper.source)}>
                    {selectedPaper.source === 'semantic_scholar' ? 'Semantic Scholar' : 'arXiv'}
                  </Badge>

                  {selectedPaper.year && (
                    <Badge variant="outline">{selectedPaper.year}</Badge>
                  )}

                  {selectedPaper.citation_count !== null && selectedPaper.citation_count !== undefined && (
                    <Badge variant="outline">
                      <BookOpen className="w-3 h-3 mr-1" />
                      {selectedPaper.citation_count} citations
                    </Badge>
                  )}

                  {(selectedPaper.pdf_url || selectedPaper.open_access_pdf_url) && (
                    <Badge className="bg-green-100 text-green-800">
                      <BadgeCheck className="w-3 h-3 mr-1" />
                      Open Access
                    </Badge>
                  )}
                </div>

                {/* Abstract */}
                {selectedPaper.abstract && (
                  <div>
                    <h5 className="font-semibold text-sm mb-2">Abstract</h5>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {selectedPaper.abstract}
                    </p>
                  </div>
                )}

                {/* Links */}
                <div className="space-y-2">
                  <h5 className="font-semibold text-sm">Links</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedPaper.url && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={selectedPaper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View on {selectedPaper.source === 'semantic_scholar' ? 'Semantic Scholar' : 'arXiv'}
                        </a>
                      </Button>
                    )}

                    {selectedPaper.pdf_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={selectedPaper.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Download PDF
                        </a>
                      </Button>
                    )}

                    {selectedPaper.open_access_pdf_url && selectedPaper.open_access_pdf_url !== selectedPaper.pdf_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={selectedPaper.open_access_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-green-600 hover:text-green-700"
                        >
                          <BadgeCheck className="w-4 h-4" />
                          Open Access PDF
                        </a>
                      </Button>
                    )}
                  </div>
                </div>

                {/* DOI */}
                {selectedPaper.doi && (
                  <div>
                    <h5 className="font-semibold text-sm mb-1">DOI</h5>
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                      {selectedPaper.doi}
                    </code>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

LiteratureSearch.propTypes = {
  onAddToProject: PropTypes.func,
  onInsertCitation: PropTypes.func,
  currentStyle: PropTypes.string,
  documentId: PropTypes.string,
  projectId: PropTypes.string,
};

LiteratureSearch.defaultProps = {
  onAddToProject: null,
  onInsertCitation: null,
  currentStyle: 'apa',
  documentId: null,
  projectId: null,
};
