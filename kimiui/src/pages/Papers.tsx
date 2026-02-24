import { useEffect, useState } from 'react';
import { Search, BookOpen, ExternalLink } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card, CardHeader, Loading, EmptyState } from '@/components/common';
import { projectApi } from '@/api/client';
import { useProjectStore } from '@/store';
import type { Paper } from '@/types';

export function Papers() {
  const { projects } = useProjectStore();
  const [allPapers, setAllPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAllPapers();
  }, []);

  const loadAllPapers = async () => {
    setIsLoading(true);
    const papers: Paper[] = [];
    
    // Load papers from all projects
    for (const project of projects.slice(0, 5)) {
      const result = await projectApi.getPapers(project.id);
      if (result.data) {
        papers.push(...result.data);
      }
    }
    
    setAllPapers(papers);
    setIsLoading(false);
  };

  const filteredPapers = allPapers.filter(paper =>
    paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.abstract?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    paper.authors?.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen">
      <Header title="Papers" subtitle="All discovered papers across your projects" />

      <div className="p-6 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search papers by title, author, or content..."
            className="w-full pl-12 pr-4 py-3 bg-kimidark-800 border border-kimidark-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-kimipurple-500/50"
          />
        </div>

        {/* Papers List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loading text="Loading papers..." />
          </div>
        ) : filteredPapers.length === 0 ? (
          <Card>
            <EmptyState
              title={searchQuery ? 'No matching papers' : 'No papers yet'}
              description={
                searchQuery
                  ? 'Try adjusting your search query.'
                  : 'Papers will appear here when your projects discover them.'
              }
              icon={<BookOpen className="w-8 h-8" />}
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredPapers.map((paper) => (
              <Card key={paper.id} className="hover:border-kimidark-500 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-kimidark-700 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-blue-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-medium text-white mb-1">{paper.title}</h3>
                    
                    {paper.authors && paper.authors.length > 0 && (
                      <p className="text-sm text-gray-400 mb-2">
                        {paper.authors.slice(0, 5).join(', ')}
                        {paper.authors.length > 5 && ` +${paper.authors.length - 5} more`}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                      {paper.year && <span>{paper.year}</span>}
                      {paper.citation_count !== null && (
                        <span>{paper.citation_count} citations</span>
                      )}
                      <span className="capitalize">{paper.source}</span>
                    </div>

                    {paper.abstract && (
                      <p className="text-sm text-gray-400 line-clamp-2">{paper.abstract}</p>
                    )}
                  </div>

                  {(paper.url || paper.pdf_url) && (
                    <a
                      href={paper.pdf_url || paper.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-gray-400 hover:text-white hover:bg-kimidark-700 rounded-lg transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
