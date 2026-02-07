
import React, { useState } from 'react';
import { Paper } from '../types';

const LibraryView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    // Will be implemented in Task 3
    console.log('Search for:', searchQuery);
  };

  const mockPapers: Paper[] = [
    {
      id: '1',
      title: 'Attention Is All You Need',
      authors: 'Vaswani, A., Shazeer, N., Parmar, N., et al.',
      journal: 'Journal of Machine Learning',
      year: 2017,
      citations: '120,432 Citations',
      claims: [
        'Proposes a new simple network architecture, the Transformer, based solely on attention mechanisms.',
        'Dispenses entirely with recurrence and convolutions, allowing for significantly more parallelization.',
        'Achieves state-of-the-art results on translation tasks while requiring substantially less time to train.'
      ]
    },
    {
      id: '2',
      title: 'Large Language Models are Zero-Shot Reasoners',
      authors: 'Kojima, T., Gu, S. S., Reid, M., et al.',
      journal: 'NeurIPS',
      year: 2022,
      citations: '2,150 Citations',
      claims: [],
      recommended: true
    },
    {
      id: '3',
      title: 'Learning to Prompt for Vision-Language Models',
      authors: 'Zhou, K., Yang, J., Loy, C. C., et al.',
      journal: 'IJCV',
      year: 2022,
      citations: '1,890 Citations',
      claims: []
    }
  ];

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
            {papers.map((paper, idx) => (
              <div 
                key={paper.id} 
                className={`group flex flex-col rounded-xl border ${idx === 0 ? 'border-l-4 border-l-primary' : 'border-slate-200 dark:border-slate-800'} bg-white dark:bg-slate-900 shadow-sm transition-all hover:shadow-md cursor-pointer overflow-hidden`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className={`text-xl font-bold mb-2 transition-colors ${idx === 0 ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300 group-hover:text-primary'}`}>
                        {paper.title}
                      </h3>
                      <p className={`text-sm font-medium mb-1 ${idx === 0 ? 'text-primary' : 'text-slate-500'}`}>{paper.authors}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">menu_book</span> {paper.journal}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">calendar_today</span> {paper.year}</span>
                        {paper.citations && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">format_quote</span> {paper.citations}</span>
                          </>
                        )}
                        {paper.recommended && <span className="text-primary font-bold uppercase tracking-tight">AI Recommended</span>}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-slate-300">
                      {idx === 0 ? 'expand_less' : 'expand_more'}
                    </span>
                  </div>

                  {idx === 0 && paper.claims.length > 0 && (
                    <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-primary text-sm">auto_awesome</span>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Key Claims (AI Extracted)</h4>
                      </div>
                      <ul className="space-y-3">
                        {paper.claims.map((claim, cIdx) => (
                          <li key={cIdx} className="flex items-start gap-3">
                            <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40"></div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: claim.replace(/Transformer/g, '<strong class="text-slate-900 dark:text-white">Transformer</strong>') }} />
                          </li>
                        ))}
                      </ul>
                      <div className="mt-8 flex flex-wrap items-center gap-3">
                        <button className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                          <span className="material-symbols-outlined text-sm">format_quote</span>
                          Cite in Document
                        </button>
                        <button className="flex items-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-700 px-5 py-2.5 text-sm font-bold text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
                          <span className="material-symbols-outlined text-sm">description</span>
                          View Full Paper
                        </button>
                        <div className="ml-auto flex items-center gap-2">
                          <button className="p-2 text-slate-400 hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">bookmark</span>
                          </button>
                          <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
