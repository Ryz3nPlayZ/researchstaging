
import React, { useState } from 'react';
import { memoryApi } from '../lib/api';
import type { Claim } from '../lib/api';
import { useProjectContext } from '../lib/context';
import LoadingSpinner from '../components/LoadingSpinner';

const MemoryView: React.FC = () => {
  const { currentProjectId } = useProjectContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<{ claims: Claim[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    if (!currentProjectId) {
      setError('No project selected');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await memoryApi.search(currentProjectId, searchQuery, 20);
      if (response.error) throw new Error(response.error);

      setResults({
        claims: response.data || [],
      });
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto px-8 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Information Graph</h2>
          <p className="text-slate-500 mt-1">Search claims, findings, and relationships extracted from literature.</p>
        </div>

        {/* Search input */}
        <div className="mb-6">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 shadow-sm">
            <span className="material-symbols-outlined text-slate-400 text-[24px]">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search claims, findings, relationships..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
            />
            <button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || loading}
              className="px-5 py-2 bg-primary hover:bg-primary/90 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg font-semibold text-sm transition-all shadow-md shadow-primary/20"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-red-500">error</span>
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-200">Search failed</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mb-12 py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <LoadingSpinner text="Searching information graph..." />
          </div>
        )}

        {/* Results display */}
        {results && !loading && (
          <div className="space-y-4">
            {results.claims.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-lg font-medium text-slate-500 mb-2">No claims found</p>
                <p className="text-sm text-slate-400">Try a different search query</p>
              </div>
            ) : (
              results.claims.map((claim) => (
                <div key={claim.id} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <p className="text-slate-800 dark:text-slate-200 text-base mb-3">{claim.claim_text}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded font-medium">
                      Confidence: {(claim.confidence * 100).toFixed(0)}%
                    </span>
                    <span>•</span>
                    <span>Source: {claim.source_id}</span>
                    <span>•</span>
                    <span>Extracted: {new Date(claim.extracted_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Empty state (initial) */}
        {!results && !loading && !error && (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="size-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[32px] text-slate-400">graph</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Search the Information Graph</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Enter keywords to search claims, findings, and relationships extracted from your research literature.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryView;
