import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Loader2, Wand2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const TONES = [
  { value: 'formal', label: 'Formal', description: 'Academic/professional language' },
  { value: 'casual', label: 'Casual', description: 'Conversational and accessible' },
  { value: 'concise', label: 'Concise', description: 'Brief and direct' },
  { value: 'elaborate', label: 'Elaborate', description: 'Detailed and nuanced' },
];

export const RewriteDialog = ({ isOpen, onClose, documentId, selection, onReplace }) => {
  const { toast } = useToast();
  const [selectedTone, setSelectedTone] = useState('formal');
  const [isProcessing, setIsProcessing] = useState(false);
  const [rewrittenText, setRewrittenText] = useState('');
  const [hasResult, setHasResult] = useState(false);

  const handleRewrite = useCallback(async () => {
    if (!selection || !documentId) return;

    setIsProcessing(true);
    setHasResult(false);

    try {
      const response = await fetch(`/api/documents/${documentId}/ai/rewrite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selection,
          tone: selectedTone,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to rewrite text');
      }

      const data = await response.json();
      setRewrittenText(data.rewritten);
      setHasResult(true);
    } catch (error) {
      console.error('Rewrite error:', error);
      toast({
        variant: 'destructive',
        title: 'Rewrite failed',
        description: error.message || 'Failed to rewrite text. Please check your API key.',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [documentId, selection, selectedTone, toast]);

  const handleReplace = useCallback(() => {
    if (rewrittenText) {
      onReplace(rewrittenText);
      handleClose();
    }
  }, [rewrittenText, onReplace]);

  const handleClose = useCallback(() => {
    setRewrittenText('');
    setHasResult(false);
    setSelectedTone('formal');
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Rewrite with AI</DialogTitle>
          <DialogDescription>
            Transform your text to a different style while preserving the meaning
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Original text */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Original text</label>
            <div className="p-3 bg-muted rounded-md text-sm">
              {selection}
            </div>
          </div>

          {/* Tone selection */}
          {!hasResult && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select tone</label>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map((tone) => (
                  <button
                    key={tone.value}
                    onClick={() => setSelectedTone(tone.value)}
                    className={`p-3 text-left rounded-md border transition-colors ${
                      selectedTone === tone.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <div className="font-medium text-sm">{tone.label}</div>
                    <div className="text-xs text-muted-foreground">{tone.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          {hasResult && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Rewritten text</label>
              <ScrollArea className="h-32 w-full rounded-md border p-3">
                <div className="text-sm">{rewrittenText}</div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          {!hasResult ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handleRewrite} disabled={isProcessing || !selection}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rewriting...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Rewrite
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleRewrite} disabled={isProcessing}>
                Try again
              </Button>
              <Button onClick={handleReplace}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Replace
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const GrammarDialog = ({ isOpen, onClose, documentId, text, onReplace }) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [correctedText, setCorrectedText] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [hasResult, setHasResult] = useState(false);

  const handleCheck = useCallback(async () => {
    if (!text || !documentId) return;

    setIsProcessing(true);
    setHasResult(false);

    try {
      const response = await fetch(`/api/documents/${documentId}/ai/grammar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to check grammar');
      }

      const data = await response.json();
      setCorrectedText(data.corrected);
      setSuggestions(data.suggestions || []);
      setHasResult(true);
    } catch (error) {
      console.error('Grammar check error:', error);
      toast({
        variant: 'destructive',
        title: 'Grammar check failed',
        description: error.message || 'Failed to check grammar. Please check your API key.',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [documentId, text, toast]);

  const handleApplyAll = useCallback(() => {
    if (correctedText) {
      onReplace(correctedText);
      handleClose();
    }
  }, [correctedText, onReplace]);

  const handleClose = useCallback(() => {
    setCorrectedText('');
    setSuggestions([]);
    setHasResult(false);
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Check Grammar</DialogTitle>
          <DialogDescription>
            Identify and correct grammar, spelling, and style issues
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Original text */}
          {!hasResult && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Text to check</label>
              <ScrollArea className="h-32 w-full rounded-md border p-3">
                <div className="text-sm">{text}</div>
              </ScrollArea>
            </div>
          )}

          {/* Results */}
          {hasResult && (
            <>
              {/* Corrected text */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Corrected text</label>
                <ScrollArea className="h-32 w-full rounded-md border p-3">
                  <div className="text-sm">{correctedText}</div>
                </ScrollArea>
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Suggestions ({suggestions.length})
                  </label>
                  <ScrollArea className="h-48 w-full rounded-md border">
                    <div className="p-3 space-y-3">
                      {suggestions.map((suggestion, index) => (
                        <div key={index} className="space-y-2 pb-3 border-b last:border-0">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 space-y-1">
                              <div className="text-sm">
                                <span className="line-through text-muted-foreground">
                                  {suggestion.original}
                                </span>
                                {' → '}
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  {suggestion.correction}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {suggestion.explanation}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {suggestions.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-4">
                  No issues found! Your text looks good.
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          {!hasResult ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button onClick={handleCheck} disabled={isProcessing || !text}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Check Grammar
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleCheck} disabled={isProcessing}>
                Check again
              </Button>
              <Button onClick={handleApplyAll} disabled={isProcessing}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Apply All
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
