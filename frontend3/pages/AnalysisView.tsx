import React, { useState } from 'react';
import { analysisApi } from '../lib/api';
import MonacoEditor from '../components/MonacoEditor';
import LoadingSpinner from '../components/LoadingSpinner';

export const AnalysisView: React.FC = () => {
  const [code, setCode] = useState('# Write your Python or R code here\nprint("Hello, World!")');
  const [language, setLanguage] = useState<'python' | 'r'>('python');
  const [results, setResults] = useState<{ success: boolean; output: string; error: string; execution_time: number; finding_id?: string } | null>(null);
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectId] = useState('default-project'); // TODO: Get from route/context

  const handleExecute = async () => {
    if (!code.trim()) return;

    setExecuting(true);
    setError(null);
    setResults(null);

    try {
      const response = await analysisApi.execute(code, language, projectId);

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
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-200">Data Analysis</h1>

      {/* Language selector and execute button */}
      <div className="flex items-center gap-4 mb-4">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as 'python' | 'r')}
          className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
        >
          <option value="python">Python</option>
          <option value="r">R</option>
        </select>

        <button
          onClick={handleExecute}
          disabled={executing || !code.trim()}
          className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
        >
          {executing ? 'Running...' : 'Run Code'}
        </button>
      </div>

      {/* Code editor */}
      <div className="relative">
        <MonacoEditor
          language={language}
          value={code}
          onChange={setCode}
          height="400px"
        />
        {/* Loading overlay during execution */}
        {executing && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
            <LoadingSpinner text="Running code..." />
          </div>
        )}
      </div>

      {/* Results display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
        </div>
      )}

      {results && (
        <div className="mt-4">
          <h2 className="text-lg font-bold mb-2 text-slate-800 dark:text-slate-200">Results</h2>

          {/* Text output */}
          {results.output && (
            <div className="mb-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <pre className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono">
                {results.output}
              </pre>
            </div>
          )}

          {/* Error output */}
          {results.error && results.error !== '' && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 font-mono whitespace-pre-wrap">
                {results.error}
              </p>
            </div>
          )}

          {/* Execution info */}
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Exit code: {results.success ? '0 (success)' : '1 (failed)'} • Execution time: {results.execution_time.toFixed(3)}s
            {results.finding_id && ` • Saved to memory: ${results.finding_id}`}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisView;
