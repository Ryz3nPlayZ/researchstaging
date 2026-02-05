import React, { useCallback, useEffect, useMemo, memo, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Blockquote from '@tiptap/extension-blockquote';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import TextAlign from '@tiptap/extension-text-align';
import History from '@tiptap/extension-history';
import debounce from 'lodash.debounce';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Save,
  Loader2,
  History as HistoryIcon,
  Quote as QuoteIcon
} from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { CitationPicker } from './CitationPicker';
import { Bibliography } from './Bibliography';
import { RewriteDialog, GrammarDialog } from './AIAssistant';

const MenuBar = memo(({ editor, canUndo, canRedo, isSaving, onShowVersionHistory, onInsertCitation }) => {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/30 flex-wrap">
      {/* History */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!canUndo}
        title="Undo"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!canRedo}
        title="Redo"
      >
        <Redo className="h-4 w-4" />
      </Button>
      {onShowVersionHistory && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onShowVersionHistory}
          title="Version History"
        >
          <HistoryIcon className="h-4 w-4" />
        </Button>
      )}

      <Separator orientation="vertical" className="h-6 mx-2" />

      {/* Text Formatting */}
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-accent' : ''}`}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-accent' : ''}`}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-8 p-0 ${editor.isActive('underline') ? 'bg-accent' : ''}`}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-2" />

      {/* Headings */}
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-2" />

      {/* Lists */}
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-accent' : ''}`}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-accent' : ''}`}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-2" />

      {/* Blockquote */}
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-8 p-0 ${editor.isActive('blockquote') ? 'bg-accent' : ''}`}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Blockquote"
      >
        <Quote className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-2" />

      {/* Text Alignment */}
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'left' }) ? 'bg-accent' : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        title="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'center' }) ? 'bg-accent' : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        title="Align Center"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`h-8 w-8 p-0 ${editor.isActive({ textAlign: 'right' }) ? 'bg-accent' : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        title="Align Right"
      >
        <AlignRight className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-2" />

      {/* Table */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Insert Table"
      >
        <TableIcon className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6 mx-2" />

      {/* Insert Citation */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={onInsertCitation}
        title="Insert Citation"
      >
        <QuoteIcon className="h-4 w-4" />
      </Button>

      <div className="flex-1" />

      {/* Save indicator */}
      {isSaving && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving...
        </div>
      )}
    </div>
  );
});

MenuBar.displayName = 'MenuBar';

export const DocumentEditor = ({ documentId, projectId, initialContent, onSave, onShowVersionHistory, citationStyle = 'APA' }) => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedHash, setLastSavedHash] = useState('');
  const [showCitationPicker, setShowCitationPicker] = useState(false);
  const [bibliographyKey, setBibliographyKey] = useState(0);
  const [currentCitationStyle, setCurrentCitationStyle] = useState(citationStyle);

  // AI Assistant state
  const [showRewriteDialog, setShowRewriteDialog] = useState(false);
  const [showGrammarDialog, setShowGrammarDialog] = useState(false);
  const [selectedText, setSelectedText] = useState('');

  // Compute content hash for change detection
  const computeContentHash = useCallback((content) => {
    return JSON.stringify(content);
  }, []);

  // Save to localStorage immediately
  const saveToLocalStorage = useCallback((content) => {
    try {
      localStorage.setItem(`doc-${documentId}-draft`, JSON.stringify(content));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [documentId]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(`doc-${documentId}-draft`);
      if (savedDraft) {
        // We'll let the editor initialize with initialContent first
        // Then we can check if user wants to restore from draft
        console.log('Found draft in localStorage');
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }, [documentId]);

  // Create debounced save function
  const debouncedSave = useMemo(
    () => debounce(async (content) => {
      const contentHash = computeContentHash(content);

      // Only save if content actually changed
      if (contentHash === lastSavedHash) {
        return;
      }

      setIsSaving(true);
      try {
        await onSave?.(content);
        setLastSavedHash(contentHash);
      } catch (error) {
        console.error('Failed to save document:', error);
        toast({
          variant: 'destructive',
          title: 'Save failed',
          description: error.message || 'Failed to save document'
        });
      } finally {
        setIsSaving(false);
      }
    }, 4000),
    [onSave, computeContentHash, lastSavedHash, toast]
  );

  // Initialize TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // We use our own heading extension
        bulletList: false, // We use our own bullet list extension
        orderedList: false, // We use our own ordered list extension
        blockquote: false, // We use our own blockquote extension
      }),
      Underline,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      BulletList,
      OrderedList,
      Blockquote,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      History,
    ],
    content: initialContent || '<p>Start writing your document...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[600px] p-6',
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getJSON();

      // Immediate backup to localStorage
      saveToLocalStorage(content);

      // Debounced server save
      debouncedSave(content);
    },
  }, [initialContent, saveToLocalStorage, debouncedSave]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  // Manual save function
  const handleManualSave = useCallback(async () => {
    if (!editor) return;

    const content = editor.getJSON();
    const contentHash = computeContentHash(content);

    if (contentHash === lastSavedHash) {
      toast({
        title: 'Already saved',
        description: 'No changes to save'
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave?.(content);
      setLastSavedHash(contentHash);
      toast({
        title: 'Saved',
        description: 'Document saved successfully'
      });
    } catch (error) {
      console.error('Failed to save document:', error);
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: error.message || 'Failed to save document'
      });
    } finally {
      setIsSaving(false);
    }
  }, [editor, onSave, computeContentHash, lastSavedHash, toast]);

  // Handle citation insertion
  const handleCitationInsert = useCallback(() => {
    setShowCitationPicker(true);
  }, []);

  // Handle citation picker close
  const handleCitationPickerClose = useCallback(() => {
    setShowCitationPicker(false);
  }, []);

  // Handle citation inserted
  const handleCitationInserted = useCallback(() => {
    // Trigger bibliography refresh
    setBibliographyKey(prev => prev + 1);
  }, []);

  // Handle citation style change
  const handleCitationStyleChange = useCallback((newStyle) => {
    setCurrentCitationStyle(newStyle);
    // Optionally save the new style to the document
    setBibliographyKey(prev => prev + 1);
  }, []);

  // Handle context menu for AI assistance
  useEffect(() => {
    if (!editor) return;

    const handleContextMenu = (event) => {
      // Check if text is selected
      const { from, to, empty } = editor.state.selection;
      if (!empty) {
        // Get selected text
        const { state } = editor;
        const text = state.doc.textBetween(from, to, ' ');

        if (text.trim().length > 0) {
          event.preventDefault();

          // Create custom context menu
          const menu = document.createElement('div');
          menu.className = 'fixed bg-popover border border-border rounded-md shadow-lg z-50 py-1 min-w-[200px]';
          menu.style.left = `${event.clientX}px`;
          menu.style.top = `${event.clientY}px`;

          const rewriteBtn = document.createElement('button');
          rewriteBtn.className = 'w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2';
          rewriteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg> Rewrite with AI';
          rewriteBtn.onclick = () => {
            setSelectedText(text);
            setShowRewriteDialog(true);
            menu.remove();
          };

          const grammarBtn = document.createElement('button');
          grammarBtn.className = 'w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2';
          grammarBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg> Check Grammar';
          grammarBtn.onclick = () => {
            setSelectedText(text);
            setShowGrammarDialog(true);
            menu.remove();
          };

          menu.appendChild(rewriteBtn);
          menu.appendChild(grammarBtn);
          document.body.appendChild(menu);

          // Remove menu on click outside
          const removeMenu = () => {
            menu.remove();
            document.removeEventListener('click', removeMenu);
          };
          setTimeout(() => {
            document.addEventListener('click', removeMenu);
          }, 0);
        }
      }
    };

    // Add context menu listener to editor element
    const editorElement = editor.options.element;
    if (editorElement) {
      editorElement.addEventListener('contextmenu', handleContextMenu);
    }

    return () => {
      if (editorElement) {
        editorElement.removeEventListener('contextmenu', handleContextMenu);
      }
    };
  }, [editor]);

  // Handle AI text replacement
  const handleAIReplace = useCallback((newText) => {
    if (!editor) return;

    // Insert the new text at current selection
    editor.chain().focus().insertContent(newText).run();

    toast({
      title: 'Text replaced',
      description: 'AI-generated text has been inserted',
    });
  }, [editor, toast]);

  // Handle rewrite dialog close
  const handleRewriteClose = useCallback(() => {
    setShowRewriteDialog(false);
    setSelectedText('');
  }, []);

  // Handle grammar dialog close
  const handleGrammarClose = useCallback(() => {
    setShowGrammarDialog(false);
    setSelectedText('');
  }, []);

  if (!editor) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        Loading editor...
      </div>
    );
  }

  const canUndo = editor.can().undo();
  const canRedo = editor.can().redo();

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <MenuBar
        editor={editor}
        canUndo={canUndo}
        canRedo={canRedo}
        isSaving={isSaving}
        onShowVersionHistory={onShowVersionHistory}
        onInsertCitation={handleCitationInsert}
      />

      {/* Editor Content */}
      <ScrollArea className="flex-1">
        <EditorContent editor={editor} />
      </ScrollArea>

      {/* Bibliography */}
      <Bibliography
        key={bibliographyKey}
        documentId={documentId}
        style={currentCitationStyle}
        onStyleChange={handleCitationStyleChange}
      />

      {/* Save indicator */}
      <div className="px-3 py-2 border-t border-border bg-muted/30 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Auto-saves every 4 seconds
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5"
          onClick={handleManualSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-3 w-3" />
              Save Now
            </>
          )}
        </Button>
      </div>

      {/* Citation Picker Dialog */}
      {showCitationPicker && (
        <CitationPicker
          documentId={documentId}
          projectId={projectId}
          editor={editor}
          onInsert={handleCitationInserted}
          onClose={handleCitationPickerClose}
        />
      )}

      {/* AI Assistant Dialogs */}
      <RewriteDialog
        isOpen={showRewriteDialog}
        onClose={handleRewriteClose}
        documentId={documentId}
        selection={selectedText}
        onReplace={handleAIReplace}
      />

      <GrammarDialog
        isOpen={showGrammarDialog}
        onClose={handleGrammarClose}
        documentId={documentId}
        text={selectedText}
        onReplace={handleAIReplace}
      />
    </div>
  );
};

export default DocumentEditor;
