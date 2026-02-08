import React, { useState } from 'react';
import { analysisApi } from '../lib/api';
import { useProjectContext } from '../lib/context';
import MonacoEditor from '../components/MonacoEditor';
import LoadingSpinner from '../components/LoadingSpinner';

export const AnalysisView: React.FC = () => {
  const { currentProjectId } = useProjectContext();
  const [code, setCode] = useState('# Write your Python or R code here\nprint("Hello, World!")');
  const [language, setLanguage] = useState<'python' | 'r'>('python');
  const [results, setResults] = useState<{ success: boolean; output: string; error: string; execution_time: number; finding_id?: string } | null>(null);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!code.trim()) return;

    // Check if project is selected
    if (!currentProjectId) {
      setError('No project selected. Please select a project first.');
      return;
    }

    setExecuting(true);
    setError(null);
    setResults(null);

    try {
      const response = await analysisApi.execute(code, language, currentProjectId);

      if (response.error || !response.data) {
        throw new Error(response.error || 'Execution failed');
      }

      setResults(response.data);
    } catch (err) {
      console.error('Execution error:', err);
      setError(err instanceof Error ? err.message : 'Execution failed');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Data Analysis</h1>
        <div className="flex items-center gap-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'python' | 'r')}
            className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm"
          >
            <option value="python">Python</option>
            <option value="r">R</option>
          </select>
          <button
            onClick={handleExecute}
            disabled={executing || !code.trim()}
            className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg font-semibold transition-colors text-sm"
          >
            {executing ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </div>

      {/* Main content: IDE-style split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Code editor */}
        <div className="w-3/5 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-[#1e1e1e]">
          <div className="flex-1 relative">
            <MonacoEditor
              language={language}
              value={code}
              onChange={setCode}
            />
            {/* Loading overlay during execution */}
            {executing && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                <LoadingSpinner text="Running code..." />
              </div>
            )}
          </div>
        </div>

        {/* Right: Results panel */}
        <div className="w-2/5 flex flex-col bg-white dark:bg-slate-950 overflow-hidden">
          {/* Results header */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300">Output</h2>
          </div>

          {/* Results content */}
          <div className="flex-1 overflow-y-auto p-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}

            {!error && !results && !executing && (
              <div className="text-center py-8 text-slate-400 dark:text-slate-600">
                <p className="text-sm">Run code to see output here</p>
              </div>
            )}

            {results && (
              <div className="space-y-3">
                {/* Text output */}
                {results.output && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">STDOUT</h3>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
                      <pre className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono">{results.output}</pre>
                    </div>
                  </div>
                )}

                {/* Error output */}
                {results.error && results.error !== '' && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">STDERR</h3>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                      <pre className="text-sm text-red-600 dark:text-red-400 whitespace-pre-wrap font-mono">{results.error}</pre>
                    </div>
                  </div>
                )}

                {/* Execution info */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <div>Exit code: <span className={results.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>{results.success ? '0 (success)' : '1 (failed)'}</span></div>
                    <div>Execution time: {results.execution_time.toFixed(3)}s</div>
                    {results.finding_id && <div className="text-primary">✓ Saved to memory</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
