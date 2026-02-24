import { useState, useRef, useEffect, useCallback } from 'react';
import { ArtifactResponse, relativeTime } from '@/lib/types';
import { Loader2, Play, Wand2, Bug, HelpCircle, ChevronDown } from 'lucide-react';
import { chatApi } from '@/lib/api';
import { useParams } from 'next/navigation';

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
    const params = useParams();
    const projectId = params?.id as string;
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const lineNumberRef = useRef<HTMLDivElement>(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [terminalHeight, setTerminalHeight] = useState(200);

    // Sync line number scroll with textarea
    const handleScroll = useCallback(() => {
        if (textareaRef.current && lineNumberRef.current) {
            lineNumberRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    }, []);

    const lineCount = Math.max((code || '').split('\n').length, 20);

    // AI code actions
    const aiAction = async (action: 'generate' | 'fix' | 'explain') => {
        if (aiLoading) return;
        setAiLoading(true);

        const prompts: Record<string, string> = {
            generate: `Generate ${language} code for analyzing the project's research data. The user's current code (if any) is:\n\n${code || '(empty)'}\n\nWrite complete, runnable ${language} code. Output ONLY the code, no explanation.`,
            fix: `Fix the errors in this ${language} code. The error output was: ${analysisError || '(no error)'}\n\nCode:\n${code}\n\nOutput ONLY the fixed code, no explanation.`,
            explain: `Explain what this ${language} code does in 2-3 sentences:\n\n${code}`,
        };

        try {
            if (projectId) {
                const res = await chatApi.sendProject(projectId, prompts[action], {});
                const aiText = res.data?.ai_response?.content || '';
                if (action === 'explain') {
                    // Show explanation in alert for now
                    alert(aiText);
                } else {
                    // Extract code from markdown fenced block if present
                    const codeMatch = aiText.match(/```(?:python|r)?\s*\n([\s\S]*?)```/);
                    setCode(codeMatch ? codeMatch[1].trim() : aiText.trim());
                }
            }
        } catch (e) {
            console.error('AI action failed:', e);
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-0 rounded-xl overflow-hidden border border-black/[0.08] bg-[#1e1e2e]">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#181825] border-b border-white/[0.06]">
                <div className="flex items-center gap-1">
                    {/* Language Tabs */}
                    <button
                        onClick={() => setLanguage('python')}
                        className={`px-3 py-1 rounded-md text-[12px] font-medium transition-all ${language === 'python'
                                ? 'bg-white/10 text-white'
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        Python
                    </button>
                    <button
                        onClick={() => setLanguage('r')}
                        className={`px-3 py-1 rounded-md text-[12px] font-medium transition-all ${language === 'r'
                                ? 'bg-white/10 text-white'
                                : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        R
                    </button>

                    <div className="w-px h-4 bg-white/10 mx-1.5" />

                    {/* AI Actions */}
                    <button
                        onClick={() => aiAction('generate')}
                        disabled={aiLoading}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-purple-400 hover:bg-purple-500/10 transition-all disabled:opacity-40"
                        title="AI: Generate code"
                    >
                        <Wand2 size={11} /> Generate
                    </button>
                    <button
                        onClick={() => aiAction('fix')}
                        disabled={aiLoading || !analysisError}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-amber-400 hover:bg-amber-500/10 transition-all disabled:opacity-40"
                        title="AI: Fix errors"
                    >
                        <Bug size={11} /> Fix
                    </button>
                    <button
                        onClick={() => aiAction('explain')}
                        disabled={aiLoading || !code.trim()}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-blue-400 hover:bg-blue-500/10 transition-all disabled:opacity-40"
                        title="AI: Explain code"
                    >
                        <HelpCircle size={11} /> Explain
                    </button>

                    {aiLoading && <Loader2 size={12} className="text-purple-400 animate-spin ml-1" />}
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-mono hidden sm:inline">Ctrl+Enter</span>
                    <button
                        onClick={handleRunAnalysis}
                        disabled={analysisRunning || !code.trim()}
                        className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white px-3 py-1 rounded-md text-[12px] font-semibold transition-all"
                    >
                        {analysisRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                        Run
                    </button>
                </div>
            </div>

            {/* Editor Area with Line Numbers */}
            <div className="flex min-h-[320px] max-h-[500px] relative">
                {/* Line Numbers */}
                <div
                    ref={lineNumberRef}
                    className="w-12 bg-[#1e1e2e] py-4 pr-2 text-right select-none overflow-hidden shrink-0 border-r border-white/[0.04]"
                >
                    {Array.from({ length: lineCount }, (_, i) => (
                        <div key={i} className="text-[12px] leading-[1.65] font-mono text-gray-600">
                            {i + 1}
                        </div>
                    ))}
                </div>

                {/* Code Textarea */}
                <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onScroll={handleScroll}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                            e.preventDefault();
                            handleRunAnalysis();
                        }
                        // Tab key inserts spaces
                        if (e.key === 'Tab') {
                            e.preventDefault();
                            const start = e.currentTarget.selectionStart;
                            const end = e.currentTarget.selectionEnd;
                            const newCode = code.substring(0, start) + '    ' + code.substring(end);
                            setCode(newCode);
                            setTimeout(() => {
                                e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 4;
                            }, 0);
                        }
                    }}
                    placeholder={language === 'python'
                        ? '# Write your Python analysis code here\nimport pandas as pd\n\n# Your code...'
                        : '# Write your R analysis code here\nlibrary(ggplot2)\n\n# Your code...'
                    }
                    className="flex-1 px-4 py-4 font-mono text-[13px] text-gray-200 bg-transparent border-none outline-none resize-none placeholder:text-gray-600 leading-[1.65] custom-scrollbar"
                    spellCheck={false}
                />
            </div>

            {/* Terminal / Output */}
            {(analysisOutput || analysisError) && (
                <div className="border-t border-white/[0.06]" style={{ height: terminalHeight }}>
                    <div className="flex items-center justify-between px-3 py-1.5 bg-[#181825]">
                        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">Terminal</span>
                        <button
                            onClick={() => setTerminalHeight(h => h === 200 ? 80 : 200)}
                            className="text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            <ChevronDown size={12} className={terminalHeight === 80 ? 'rotate-180' : ''} />
                        </button>
                    </div>
                    <div className="px-4 py-2 overflow-auto custom-scrollbar" style={{ height: terminalHeight - 30 }}>
                        {analysisOutput && (
                            <pre className="text-[12px] text-emerald-400 font-mono whitespace-pre-wrap leading-relaxed">
                                {analysisOutput}
                            </pre>
                        )}
                        {analysisError && (
                            <pre className="text-[12px] text-red-400 font-mono whitespace-pre-wrap mt-1 border-l-2 border-red-500/40 pl-3 leading-relaxed">
                                {analysisError}
                            </pre>
                        )}
                    </div>
                </div>
            )}

            {/* Artifacts */}
            {artifacts.length > 0 && (
                <div className="border-t border-white/[0.06] p-3 bg-[#181825]">
                    <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Artifacts ({artifacts.length})</h3>
                    <div className="space-y-1">
                        {artifacts.map((art) => (
                            <div key={art.id} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-white/[0.03] transition-colors">
                                <div>
                                    <span className="text-[12px] font-medium text-gray-300">{art.title}</span>
                                    <span className="text-[10px] text-gray-600 ml-2">{art.artifact_type} · {relativeTime(art.created_at)}</span>
                                </div>
                                <button className="text-[10px] font-medium text-emerald-400 hover:text-emerald-300">
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
