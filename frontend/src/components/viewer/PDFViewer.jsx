import { useState, useEffect } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  FileText, 
  Download, 
  ExternalLink, 
  BookOpen,
  Brain,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Copy,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

export const PDFViewer = ({ paper, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [fullPaper, setFullPaper] = useState(null);
  const [activeTab, setActiveTab] = useState('abstract');
  const [copied, setCopied] = useState(false);
  const [fontSize, setFontSize] = useState(14);

  useEffect(() => {
    if (!paper?.id) return;
    
    const fetchFullPaper = async () => {
      setLoading(true);
      try {
        const API_URL = process.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${API_URL}/api/papers/${paper.id}`);
        if (response.ok) {
          const data = await response.json();
          setFullPaper(data);
          // Auto-switch to full text if available
          if (data.full_text) {
            setActiveTab('fulltext');
          }
        }
      } catch (error) {
        console.error('Failed to fetch paper:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFullPaper();
  }, [paper?.id]);

  const handleCopyText = async () => {
    const text = fullPaper?.full_text || paper?.abstract || '';
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Text copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenExternal = () => {
    if (paper?.url) {
      window.open(paper.url, '_blank');
    }
  };

  const handleDownloadPDF = () => {
    if (paper?.pdf_url) {
      window.open(paper.pdf_url, '_blank');
    }
  };

  if (!paper) {
    return null;
  }

  const displayPaper = fullPaper || paper;

  return (
    <div className="h-full flex flex-col bg-background" data-testid="pdf-viewer">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-border">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
            <Badge variant="outline" className="text-[10px] capitalize">
              {paper.source?.replace('_', ' ')}
            </Badge>
            {paper.year && (
              <Badge variant="secondary" className="text-[10px]">{paper.year}</Badge>
            )}
          </div>
          <h2 className="font-semibold text-sm leading-tight line-clamp-2">
            {paper.title}
          </h2>
          {paper.authors?.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {paper.authors.slice(0, 5).join(', ')}
              {paper.authors.length > 5 && ` +${paper.authors.length - 5} more`}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyText}
            className="h-8"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-green-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </Button>
          
          {paper.url && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenExternal}
              className="h-8"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          )}
          
          {paper.pdf_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              className="h-8"
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              PDF
            </Button>
          )}
        </div>
      </div>

      {/* Citation Info */}
      {paper.citation_count !== null && paper.citation_count !== undefined && (
        <div className="px-4 py-2 bg-muted/30 border-b border-border flex items-center gap-4 text-xs">
          <span className="text-muted-foreground">
            <strong className="text-foreground">{paper.citation_count.toLocaleString()}</strong> citations
          </span>
          {displayPaper.page_count && (
            <span className="text-muted-foreground">
              <strong className="text-foreground">{displayPaper.page_count}</strong> pages
            </span>
          )}
          {displayPaper.full_text && (
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px]">
              Full Text Available
            </Badge>
          )}
        </div>
      )}

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border">
          <TabsList className="h-8">
            <TabsTrigger value="abstract" className="text-xs h-7">Abstract</TabsTrigger>
            {displayPaper.summary && (
              <TabsTrigger value="summary" className="text-xs h-7">
                <Brain className="h-3 w-3 mr-1" />
                AI Summary
              </TabsTrigger>
            )}
            {displayPaper.full_text && (
              <TabsTrigger value="fulltext" className="text-xs h-7">
                <FileText className="h-3 w-3 mr-1" />
                Full Text
              </TabsTrigger>
            )}
          </TabsList>
          
          {/* Font size controls for full text */}
          {activeTab === 'fulltext' && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setFontSize(Math.max(10, fontSize - 2))}
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground w-8 text-center">{fontSize}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setFontSize(Math.min(24, fontSize + 2))}
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        <TabsContent value="abstract" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 max-w-3xl">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <h3 className="text-sm font-medium mb-3">Abstract</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {paper.abstract || 'No abstract available'}
                  </p>
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {displayPaper.summary && (
          <TabsContent value="summary" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 max-w-3xl">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-medium">AI-Generated Summary</h3>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {displayPaper.summary}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        )}

        {displayPaper.full_text && (
          <TabsContent value="fulltext" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6">
                <div 
                  className="whitespace-pre-wrap font-mono leading-relaxed text-muted-foreground max-w-4xl"
                  style={{ fontSize: `${fontSize}px` }}
                >
                  {displayPaper.full_text}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default PDFViewer;
