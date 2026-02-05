import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Play, Copy, Trash2, Code } from 'lucide-react';
import { toast } from 'sonner';

export const CodeEditor = ({
  code = '',
  language = 'python',
  onChange,
  onExecute,
  readOnly = false,
  height = '400px'
}) => {
  const [editorCode, setEditorCode] = useState(code);
  const [isExecuting, setIsExecuting] = useState(false);
  const editorRef = useRef(null);

  // Update editor code when prop changes
  useEffect(() => {
    setEditorCode(code);
  }, [code]);

  const handleEditorChange = (value) => {
    const newCode = value || '';
    setEditorCode(newCode);
    if (onChange) {
      onChange(newCode, language);
    }
  };

  const handleEditorMount = (editor) => {
    editorRef.current = editor;

    // Set editor options
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      wordWrap: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 4,
      readOnly: readOnly
    });
  };

  const handleRun = async () => {
    if (!editorCode.trim()) {
      toast.error('No code to run');
      return;
    }

    setIsExecuting(true);
    try {
      if (onExecute) {
        await onExecute(editorCode, language);
      }
    } catch (error) {
      console.error('Execution error:', error);
      toast.error('Execution failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editorCode);
    toast.success('Code copied to clipboard');
  };

  const handleClear = () => {
    setEditorCode('');
    if (onChange) {
      onChange('', language);
    }
    toast.success('Code cleared');
  };

  // Map language to Monaco editor language
  const getMonacoLanguage = (lang) => {
    const langLower = lang.toLowerCase();
    if (langLower === 'r') {
      return 'r';  // Monaco supports R
    }
    return 'python';  // Default to python
  };

  return (
    <Card className="overflow-hidden border">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {language === 'python' ? 'Python' : 'R'} Code
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={isExecuting || !editorCode.trim()}
                title="Clear code"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                disabled={!editorCode.trim()}
                title="Copy code"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleRun}
                disabled={isExecuting || !editorCode.trim()}
                title="Run code"
              >
                {isExecuting ? (
                  <>Running...</>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Run
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Monaco Editor */}
      <div style={{ height }}>
        <Editor
          height="100%"
          language={getMonacoLanguage(language)}
          value={editorCode}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            readOnly: readOnly
          }}
        />
      </div>
    </Card>
  );
};

export default CodeEditor;
