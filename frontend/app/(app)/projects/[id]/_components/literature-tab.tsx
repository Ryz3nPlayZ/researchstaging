import { Paper } from '@/lib/types';
import { Search, Loader2, Plus, CheckCircle, ExternalLink, FileText, Sparkles } from 'lucide-react';
import { SynthesisWizard } from '@/components/literature/synthesis-wizard';

interface LiteratureTabProps {
    litQuery: string;
    setLitQuery: (query: string) => void;
    litSearching: boolean;
    handleLitSearch: () => void;
    litResults: Paper[];
    projectPapers: Paper[];
    onAddPaper: (paper: Paper) => void;
    synthesisOpen: boolean;
    setSynthesisOpen: (open: boolean) => void;
    projectId: string;
}

export function LiteratureTab({
    litQuery,
    setLitQuery,
    litSearching,
    handleLitSearch,
    litResults,
    projectPapers,
    onAddPaper,
    synthesisOpen,
    setSynthesisOpen,
    projectId
}: LiteratureTabProps) {
    return (
        <div className="space-y-6">
            {/* Search */}
            <div className="glass rounded-2xl p-6 border border-white/20">
                <h3 className="text-sm font-bold text-[#1B512D] mb-4">Search Academic Papers</h3>
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={litQuery}
                            onChange={(e) => setLitQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLitSearch()}
                            placeholder="Search by topic, title, or author..."
                            className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-100 bg-gray-50/50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#1C7C54] focus:ring-2 focus:ring-[#1C7C54]/20 transition-all focus:bg-white"
                        />
                    </div>
                    <button
                        onClick={handleLitSearch}
                        disabled={litSearching || !litQuery.trim()}
                        className="inline-flex items-center gap-2 bg-[#1C7C54] hover:bg-[#1B512D] disabled:opacity-50 text-white px-6 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all"
                    >
                        {litSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                        Search
                    </button>
                </div>

                {/* Search Results */}
                {litResults.length > 0 && (
                    <div className="mt-6 space-y-4">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{litResults.length} results found</p>
                        {litResults.map((paper, idx) => (
                            <div key={paper.id || idx} className="p-5 rounded-xl bg-gray-50/50 border border-gray-100">
                                <h4 className="text-base font-semibold text-[#1B512D] leading-tight mb-2">{paper.title}</h4>
                                <p className="text-xs text-gray-600 mb-3 font-medium">
                                    {paper.authors?.slice(0, 3).join(', ')}
                                    {(paper.authors?.length || 0) > 3 ? ' et al.' : ''}
                                    {paper.year ? ` · ${paper.year}` : ''}
                                    {paper.citation_count ? ` · ${paper.citation_count} citations` : ''}
                                </p>
                                {paper.abstract && (
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{paper.abstract}</p>
                                )}
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => onAddPaper(paper)}
                                        disabled={projectPapers.some(p => p.title === paper.title)}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C7C54] hover:text-[#1B512D] disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm"
                                    >
                                        {projectPapers.some(p => p.title === paper.title) ? (
                                            <><CheckCircle size={14} /> Added</>
                                        ) : (
                                            <><Plus size={14} /> Add to Project</>
                                        )}
                                    </button>
                                    {paper.url && (
                                        <a href={paper.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#1B512D] transition-colors">
                                            <ExternalLink size={14} /> View
                                        </a>
                                    )}
                                    {paper.pdf_url && (
                                        <a href={paper.pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#1B512D] transition-colors">
                                            <FileText size={14} /> PDF
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Project Papers */}
            <div className="glass rounded-2xl p-6 border border-white/20">
                <h3 className="text-sm font-bold text-[#1B512D] mb-4 flex items-center justify-between">
                    <span>
                        Discovered Papers
                        {projectPapers.length > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-600 font-medium">{projectPapers.length}</span>}
                    </span>
                    {projectPapers.length > 0 && (
                        <button
                            onClick={() => setSynthesisOpen(true)}
                            className="inline-flex items-center gap-2 text-xs font-semibold text-[#1C7C54] hover:text-[#1B512D] bg-[#DEF4C6] hover:bg-[#C5EB9E] px-4 py-2 rounded-xl transition-all shadow-sm"
                        >
                            <Sparkles size={14} /> Synthesize with AI
                        </button>
                    )}
                </h3>
                {projectPapers.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                        {projectPapers.map((paper, idx) => (
                            <div key={paper.id || idx} className="flex items-start justify-between py-4 first:pt-0 last:pb-0">
                                <div className="min-w-0 flex-1 pr-4">
                                    <h4 className="text-sm font-semibold text-[#1B512D] line-clamp-1 mb-1">{paper.title}</h4>
                                    <p className="text-xs text-gray-500">
                                        {paper.authors?.slice(0, 2).join(', ')}
                                        {paper.year ? ` · ${paper.year}` : ''}
                                    </p>
                                </div>
                                {paper.url && (
                                    <a href={paper.url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-[#1C7C54] hover:bg-gray-50 rounded-lg transition-colors">
                                        <ExternalLink size={16} />
                                    </a>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-sm text-gray-500">No papers discovered yet. Use the search above to find and add verified academic papers.</p>
                    </div>
                )}
            </div>

            {/* Synthesis Wizard */}
            <SynthesisWizard
                isOpen={synthesisOpen}
                onClose={() => setSynthesisOpen(false)}
                projectId={projectId}
                papers={projectPapers}
            />
        </div>
    );
}
