import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Play, Copy, Trash2, Code, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { analysisApi } from '../../lib/api';
import AnalysisResults from './AnalysisResults';

export const CodeEditor = ({
  code = '',
  language = 'python',
  onChange,
  onExecute,
  readOnly = false,
  height = '400px',
  projectId = null
}) => {
  const [editorCode, setEditorCode] = useState(code);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [showResults, setShowResults] = useState(false);
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

    if (!projectId) {
      toast.error('Project ID required for execution');
      return;
    }

    setIsExecuting(true);
    try {
      // Use the analysis API to execute code
      const response = await analysisApi.executeCode(
        projectId,
        editorCode,
        language,
        true // save to memory
      );

      const result = {
        success: response.data.success,
        output: response.data.output,
        error: response.data.error,
        execution_time: response.data.execution_time,
        finding_id: response.data.finding_id,
      };

      setExecutionResult(result);
      setShowResults(true);

      if (result.success) {
        toast.success(`Code executed in ${result.execution_time.toFixed(2)}s`);
      } else {
        toast.error('Execution completed with errors');
      }

      // Call parent onExecute callback if provided
      if (onExecute) {
        await onExecute(editorCode, language, result);
      }
    } catch (error) {
      console.error('Execution error:', error);
      toast.error('Execution failed: ' + (error.response?.data?.detail || error.message || 'Unknown error'));

      setExecutionResult({
        success: false,
        output: '',
        error: error.response?.data?.detail || error.message,
        execution_time: 0,
      });
      setShowResults(true);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCloseResults = () => {
    setShowResults(false);
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

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Enter or Cmd+Enter to execute
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!readOnly && editorCode.trim()) {
          handleRun();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editorCode, readOnly, isExecuting]);

  // Get execution status badge
  const getExecutionStatus = () => {
    if (isExecuting) {
      return { label: 'Running...', color: 'bg-yellow-100 text-yellow-800' };
    }
    if (executionResult) {
      return executionResult.success
        ? { label: 'Completed', color: 'bg-green-100 text-green-800' }
        : { label: 'Error', color: 'bg-red-100 text-red-800' };
    }
    return { label: 'Ready', color: 'bg-gray-100 text-gray-800' };
  };

  return (
    <Card className="overflow-hidden border">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {language === 'python' ? 'Python' : 'R'} Code
            </span>
          </div>

          {/* Language badge */}
          <div className={`px-2 py-0.5 rounded text-xs font-medium ${
            language === 'python'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              : 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
          }`}>
            {language.toUpperCase()}
          </div>

          {/* Execution status */}
          {executionResult && (
            <div className={`px-2 py-0.5 rounded text-xs font-medium ${getExecutionStatus().color}`}>
              {getExecutionStatus().label}
              {executionResult.execution_time && (
                <span className="ml-1">
                  ({executionResult.execution_time < 1
                    ? `${Math.round(executionResult.execution_time * 1000)}ms`
                    : `${executionResult.execution_time.toFixed(2)}s`
                  })
                </span>
              )}
            </div>
          )}
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
                title="Run code (Ctrl+Enter)"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Running...
                  </>
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

      {/* Results Modal */}
      {showResults && executionResult && (
        <AnalysisResults
          result={executionResult}
          onClose={handleCloseResults}
        />
      )}
    </Card>
  );
};

export default CodeEditor;
