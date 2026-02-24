import { FileText, ExternalLink, Users } from 'lucide-react';
import { truncate } from '@/utils';
import type { Paper } from '@/types';

interface PaperListProps {
  papers: Paper[];
  onView?: (paper: Paper) => void;
}

export function PaperList({ papers, onView }: PaperListProps) {
  if (papers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No papers found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {papers.map((paper) => (
        <div
          key={paper.id}
          onClick={() => onView?.(paper)}
          className="p-4 rounded-lg bg-kimidark-700/50 border border-kimidark-600 hover:border-kimidark-500 hover:bg-kimidark-700 transition-colors cursor-pointer group"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-kimidark-600 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white mb-1">
                {paper.title}
              </h4>

              {paper.authors && paper.authors.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                  <Users className="w-3 h-3" />
                  <span className="truncate">
                    {truncate(paper.authors.slice(0, 3).join(', '), 80)}
                    {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-gray-500">
                {paper.year && <span>{paper.year}</span>}
                {paper.citation_count !== null && paper.citation_count !== undefined && (
                  <span>{paper.citation_count} citations</span>
                )}
                <span className="capitalize">{paper.source}</span>
              </div>

              {paper.abstract && (
                <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                  {truncate(paper.abstract, 200)}
                </p>
              )}
            </div>

            {(paper.url || paper.pdf_url) && (
              <a
                href={paper.pdf_url || paper.url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-2 text-gray-400 hover:text-white hover:bg-kimidark-600 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
