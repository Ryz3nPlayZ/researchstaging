
import React, { useState } from 'react';
import { Paper } from '../types';
import { literatureApi } from '../lib/api';

const LibraryView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await literatureApi.search(searchQuery, 20);

      if (response.error) {
        throw new Error(response.error);
      }

      setPapers(response.data || []);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setPapers([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 md:p-10">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">Literature</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and analyze your academic resources with AI distillation.</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 mb-8">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <span className="material-symbols-outlined text-slate-400">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search papers by title, author, keywords..."
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/50"
              />
              <button
                onClick={handleSearch}
                disabled={!searchQuery.trim() || isLoading}
                className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Year', 'Subject', 'Citations'].map(filter => (
                <button key={filter} className="flex items-center gap-2 rounded-lg bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary transition-colors">
                  <span>{filter}</span>
                  <span className="material-symbols-outlined text-xs">expand_more</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button className="px-3 py-1 text-xs font-medium rounded-md bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white">Sort by</button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Error state */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl h-32"></div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {papers.length === 0 && !isLoading && !error && (
              <div className="text-center py-12 text-slate-500">
                <p className="text-lg font-medium mb-2">No papers found</p>
                <p className="text-sm">Try searching for a different topic</p>
              </div>
            )}

            {/* Paper results */}
            {papers.map((paper, idx) => {
              const pdfUrl = paper.pdf_url || paper.open_access_pdf_url;
              return (
                <div
                  key={paper.id || paper.external_id || idx}
                  className="group flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md cursor-pointer overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2 transition-colors text-slate-700 dark:text-slate-300 group-hover:text-primary">
                          {paper.title}
                        </h3>
                        <p className="text-sm font-medium mb-1 text-slate-500">{Array.isArray(paper.authors) ? paper.authors.join(', ') : paper.authors}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            paper.source === 'arxiv'
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                              : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          }`}>
                            {paper.source === 'arxiv' ? 'arXiv' : 'Semantic Scholar'}
                          </span>
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">menu_book</span> {paper.journal || paper.source}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">calendar_today</span> {paper.year}</span>
                          {paper.citation_count !== undefined && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">format_quote</span> {paper.citation_count.toLocaleString()} Citations</span>
                            </>
                          )}
                        </div>
                        {paper.abstract && (
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-3">
                            {paper.abstract}
                          </p>
                        )}
                        {pdfUrl && (
                          <button
                            onClick={() => window.open(pdfUrl, '_blank')}
                            className="flex items-center gap-1 text-primary text-sm font-semibold mt-3"
                          >
                            <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                            View PDF
                          </button>
                        )}
                      </div>
                      <span className="material-symbols-outlined text-slate-300">
                        expand_more
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="hidden lg:flex w-80 flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-y-auto">
        <div className="p-6 sticky top-0">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl bg-white dark:bg-slate-950">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Citations Tracker</h3>
              <span className="material-symbols-outlined text-sm text-primary">insights</span>
            </div>
            <p className="text-xs text-slate-500 mb-6">Tracking sources for: <span className="italic">"Transformer Architectures in Healthcare NLP"</span></p>
            <div className="space-y-4">
              <div className="relative pl-4 border-l-2 border-primary py-1">
                <p className="text-xs font-bold line-clamp-1">Attention Is All You Need</p>
                <p className="text-[10px] text-slate-400">Vaswani et al. (2017)</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider">Main Architecture</span>
                </div>
              </div>
              <div className="relative pl-4 border-l-2 border-slate-200 dark:border-slate-800 py-1">
                <p className="text-xs font-bold line-clamp-1 text-slate-600 dark:text-slate-300">Zero-Shot Reasoners</p>
                <p className="text-[10px] text-slate-400">Kojima et al. (2022)</p>
              </div>
            </div>
            <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Citations count</span>
                <span className="font-bold text-primary">02</span>
              </div>
              <button className="w-full rounded-lg bg-slate-900 dark:bg-slate-800 py-2.5 text-xs font-bold text-white hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                Generate Bibliography
              </button>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20 p-6 text-center">
            <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-4xl mb-3">smart_toy</span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">AI Research Assistant</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-2">Drop a PDF here to automatically extract key claims and citations.</p>
            <button className="mt-4 text-xs font-bold text-primary hover:underline underline-offset-4">Learn more</button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default LibraryView;
