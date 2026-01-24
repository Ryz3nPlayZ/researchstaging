import { useCallback, useState } from 'react';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import {
  Bold,
  Italic,
  Wand2,
  RefreshCw,
  Expand,
  FileText,
  Quote as CiteIcon,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import api from '../../lib/api';
import { toast } from 'sonner';

export const RichTextEditor = ({ 
  content, 
  onChange, 
  placeholder = 'Start writing...',
  editable = true 
}) => {
  const [aiLoading, setAiLoading] = useState(false);
  const [localContent, setLocalContent] = useState(content || '');
  const [selection, setSelection] = useState('');

  const handleContentChange = useCallback((e) => {
    const newContent = e.target.innerHTML;
    setLocalContent(newContent);
    onChange?.(newContent);
  }, [onChange]);

  const handleSelectionChange = useCallback(() => {
    const selected = window.getSelection()?.toString() || '';
    setSelection(selected);
  }, []);

  const handleAIAction = useCallback(async (action) => {
    const selectedText = window.getSelection()?.toString();
    
    if (!selectedText) {
      toast.error('Please select some text first');
      return;
    }

    setAiLoading(true);
    try {
      const response = await api.post('/ai/action', {
        action,
        content: selectedText
      });
      
      if (response.data.result) {
        // Replace selected text
        document.execCommand('insertText', false, response.data.result);
        toast.success(`${action.charAt(0).toUpperCase() + action.slice(1)} applied`);
      }
    } catch (error) {
      console.error('AI action failed:', error);
      toast.error('AI action failed');
    } finally {
      setAiLoading(false);
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/30">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => document.execCommand('bold')}
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => document.execCommand('italic')}
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-2" />

        {/* AI Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5" disabled={aiLoading}>
              {aiLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              <span className="text-xs">AI Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => handleAIAction('rewrite')}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Rewrite Selection
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAIAction('expand')}>
              <Expand className="h-4 w-4 mr-2" />
              Expand Selection
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAIAction('summarize')}>
              <FileText className="h-4 w-4 mr-2" />
              Summarize Selection
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAIAction('cite')}>
              <CiteIcon className="h-4 w-4 mr-2" />
              Add Citations
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Editor Content */}
      <ScrollArea className="flex-1">
        <div
          contentEditable={editable}
          suppressContentEditableWarning={true}
          className="prose prose-sm dark:prose-invert max-w-none p-6 min-h-full focus:outline-none"
          onInput={handleContentChange}
          onMouseUp={handleSelectionChange}
          dangerouslySetInnerHTML={{ __html: localContent }}
        />
      </ScrollArea>
    </div>
  );
};
