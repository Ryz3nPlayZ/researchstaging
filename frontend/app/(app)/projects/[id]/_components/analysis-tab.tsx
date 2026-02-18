import { ArtifactResponse, relativeTime } from '@/lib/types';
import { Loader2, Play } from 'lucide-react';

interface AnalysisTabProps {
    language: 'python' | 'r';
    setLanguage: (lang: 'python' | 'r') => void;
    code: string;
    setCode: (code: string) => void;
    analysisRunning: boolean;
    handleRunAnalysis: () => void;
    analysisOutput: string | null;
    analysisError: string | null;
    artifacts: ArtifactResponse[];
}

export function AnalysisTab({
    language,
    setLanguage,
    code,
    setCode,
    analysisRunning,
    handleRunAnalysis,
    analysisOutput,
    analysisError,
    artifacts
}: AnalysisTabProps) {
    return (
        <div className="space-y-6">
            {/* Code Editor */}
            <div className="glass rounded-2xl border border-white/20 overflow-hidden shadow-sm">
                {/* Editor Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as 'python' | 'r')}
                            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 outline-none focus:border-[#1C7C54] focus:ring-1 focus:ring-[#1C7C54]"
                        >
                            <option value="python">Python</option>
                            <option value="r">R</option>
                        </select>
                        <span className="text-xs text-gray-400 font-medium hidden sm:inline">Ctrl+Enter to run</span>
                    </div>
                    <button
                        onClick={handleRunAnalysis}
                        disabled={analysisRunning || !code.trim()}
                        className="inline-flex items-center gap-2 bg-[#1C7C54] hover:bg-[#1B512D] disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm transition-all"
                    >
                        {analysisRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                        Run Analysis
                    </button>
                </div>

                {/* Code Area */}
                <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            handleRunAnalysis();
                        }
                    }}
                    placeholder={language === 'python'
                        ? '# Write your Python analysis code here\nimport pandas as pd\n\n# Your code...'
                        : '# Write your R analysis code here\nlibrary(ggplot2)\n\n# Your code...'
                    }
                    className="w-full min-h-[300px] px-6 py-5 font-mono text-sm text-gray-800 bg-white/50 border-none outline-none resize-y placeholder:text-gray-300 leading-relaxed"
                    spellCheck={false}
                />
            </div>

            {/* Output */}
            {(analysisOutput || analysisError) && (
                <div className="glass rounded-2xl border border-white/20 overflow-hidden shadow-sm">
                    <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Console Output</h3>
                    </div>
                    <div className="p-6 bg-gray-900">
                        {analysisOutput && (
                            <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap max-h-[400px] overflow-auto custom-scrollbar">
                                {analysisOutput}
                            </pre>
                        )}
                        {analysisError && (
                            <pre className="text-sm text-red-400 font-mono whitespace-pre-wrap mt-4 max-h-[200px] overflow-auto custom-scrollbar border-l-2 border-red-500 pl-4">
                                {analysisError}
                            </pre>
                        )}
                    </div>
                </div>
            )}

            {/* Artifacts */}
            {artifacts.length > 0 && (
                <div className="glass rounded-2xl p-6 border border-white/20">
                    <h3 className="text-sm font-bold text-[#1B512D] mb-4">Generated Artifacts</h3>
                    <div className="space-y-0 divide-y divide-gray-100">
                        {artifacts.map((art) => (
                            <div key={art.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-900">{art.title}</h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {art.artifact_type} · v{art.version} · {relativeTime(art.created_at)}
                                    </p>
                                </div>
                                <button className="text-xs font-medium text-[#1C7C54] hover:text-[#1B512D] hover:underline">
                                    View
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
