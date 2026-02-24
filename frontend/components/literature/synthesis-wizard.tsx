"use client";

import { useState } from "react";
import { chatApi } from "@/lib/api";
import { Paper } from "@/lib/types";
import {
    X,
    Sparkles,
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Bot,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface SynthesisWizardProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    papers: Paper[]; // All available papers
    preSelectedPapers?: Paper[]; // Papers selected before opening wizard
}

export function SynthesisWizard({
    isOpen,
    onClose,
    projectId,
    papers,
    preSelectedPapers = [],
}: SynthesisWizardProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedPaperIds, setSelectedPaperIds] = useState<Set<string>>(
        new Set(preSelectedPapers.map((p) => p.id || p.title))
    );
    const [synthesisType, setSynthesisType] = useState<
        "summarize" | "compare" | "gaps" | "methodology"
    >("summarize");
    const [format, setFormat] = useState<"bullet" | "paragraph" | "table">("bullet");
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<string | null>(null);

    if (!isOpen) return null;

    const selectedPapers = papers.filter((p) =>
        selectedPaperIds.has(p.id || p.title)
    );

    const togglePaper = (id: string) => {
        const next = new Set(selectedPaperIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedPaperIds(next);
    };

    const handleGenerate = async () => {
        if (selectedPapers.length === 0) return;
        setGenerating(true);
        setStep(3);

        const prompt = `
Please perform a literature synthesis on the following papers:
${selectedPapers
                .map(
                    (p, i) =>
                        `${i + 1}. "${p.title}" by ${p.authors?.join(", ")} (${p.year})\n   Abstract: ${p.abstract || "No abstract available"}\n   Summary: ${p.summary || "No summary available"}`
                )
                .join("\n")}

Goal: ${synthesisType === "summarize"
                ? "Summarize the key findings of each paper."
                : synthesisType === "compare"
                    ? "Compare and contrast the findings, methodologies, and conclusions."
                    : synthesisType === "gaps"
                        ? "Identify research gaps and unanswered questions across these papers."
                        : "Analyze the methodologies used in these papers."
            }

Format: ${format === "bullet"
                ? "Bullet points"
                : format === "table"
                    ? "Markdown table"
                    : "Coherent paragraphs"
            }
        `.trim();

        try {
            const res = await chatApi.sendProject(projectId, prompt, {
                literature_synthesis: true,
                paper_count: selectedPapers.length,
            });

            if (res.data) {
                setResult(res.data.ai_response.content);
            } else {
                setResult("Failed to generate synthesis. Please try again.");
            }
        } catch (err) {
            console.error("Synthesis failed:", err);
            setResult("An error occurred while communicating with the AI.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                            <Sparkles size={20} className="text-[#1C7C54]" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-gray-900">
                                Literature Synthesis
                            </h3>
                            <p className="text-xs text-gray-500">
                                AI-powered analysis of multiple papers
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1 bg-gray-100">
                    <div
                        className="h-full bg-[#1C7C54] transition-all duration-300 ease-out"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {step === 1 && (
                        <div className="space-y-4">
                            <h4 className="text-lg font-medium text-gray-900">
                                1. Select Papers to Analyze
                            </h4>
                            <p className="text-sm text-gray-500">
                                Choose the papers you want to synthesize. The AI will read and
                                compare these documents.
                            </p>
                            <div className="grid grid-cols-1 gap-2 mt-4">
                                {papers.length === 0 ? (
                                    <div className="text-center py-8 text-gray-400">
                                        No papers found in this project. Add literature first.
                                    </div>
                                ) : (
                                    papers.map((paper) => (
                                        <div
                                            key={paper.id || paper.title}
                                            onClick={() => togglePaper(paper.id || paper.title)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-4 ${selectedPaperIds.has(paper.id || paper.title)
                                                ? "border-[#1C7C54] bg-[#DEF4C6]/20 shadow-sm"
                                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                                }`}
                                        >
                                            <div
                                                className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedPaperIds.has(paper.id || paper.title)
                                                    ? "bg-[#1C7C54] border-[#1C7C54]"
                                                    : "border-gray-300 bg-white"
                                                    }`}
                                            >
                                                {selectedPaperIds.has(paper.id || paper.title) && (
                                                    <CheckCircle2 size={14} className="text-white" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h5 className="text-sm font-medium text-gray-900 leading-snug">
                                                    {paper.title}
                                                </h5>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {paper.authors?.slice(0, 3).join(", ")} · {paper.year}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <h4 className="text-lg font-medium text-gray-900">
                                2. Configure Synthesis
                            </h4>
                            <p className="text-sm text-gray-500">
                                How should the AI analyze these {selectedPapers.length} papers?
                            </p>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-2">
                                        Goal
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            {
                                                id: "summarize",
                                                label: "Summarize",
                                                desc: "Key findings of each paper",
                                            },
                                            {
                                                id: "compare",
                                                label: "Compare",
                                                desc: "Contrast findings & methods",
                                            },
                                            {
                                                id: "gaps",
                                                label: "Find Gaps",
                                                desc: "Identify missing research",
                                            },
                                            {
                                                id: "methodology",
                                                label: "Methodology",
                                                desc: "Analyze research methods",
                                            },
                                        ].map((opt) => (
                                            <div
                                                key={opt.id}
                                                onClick={() => setSynthesisType(opt.id as typeof synthesisType)}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all ${synthesisType === opt.id
                                                    ? "border-[#1C7C54] bg-[#DEF4C6]/20 shadow-sm"
                                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                                    }`}
                                            >
                                                <div className="font-medium text-sm text-gray-900">
                                                    {opt.label}
                                                </div>
                                                <div className="text-xs text-gray-500">{opt.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-gray-700 block mb-2">
                                        Output Format
                                    </label>
                                    <div className="flex gap-3">
                                        {[
                                            { id: "bullet", label: "Bullet Points" },
                                            { id: "paragraph", label: "Paragraphs" },
                                            { id: "table", label: "Comparison Table" },
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setFormat(opt.id as typeof format)}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${format === opt.id
                                                    ? "border-[#1C7C54] bg-[#1C7C54] text-white"
                                                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                                    }`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="h-full flex flex-col">
                            {generating ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full border-4 border-[#DEF4C6] animate-[spin_3s_linear_infinite]" />
                                        <div className="w-16 h-16 rounded-full border-4 border-t-[#1C7C54] animate-spin absolute top-0 left-0" />
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                            <Bot size={24} className="text-[#1C7C54]" />
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-medium text-gray-900 mt-6">
                                        Synthesizing Literature...
                                    </h4>
                                    <p className="text-sm text-gray-500 mt-2 max-w-sm">
                                        The AI is reading {selectedPapers.length} papers and generating your {synthesisType} report. This may take a moment.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-[#1C7C54]">
                                        <CheckCircle2 size={20} />
                                        <h4 className="text-lg font-medium">Analysis Complete</h4>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 overflow-auto max-h-[50vh] prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700">
                                        <ReactMarkdown>{result || ""}</ReactMarkdown>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                    {step > 1 && !generating && (
                        <button
                            onClick={() => setStep((s) => (s - 1) as 1 | 2)}
                            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                    )}
                    <div className="flex-1" />
                    {step < 3 && (
                        <button
                            onClick={() => (step === 1 ? setStep(2) : handleGenerate())}
                            disabled={step === 1 && selectedPapers.length === 0}
                            className="flex items-center gap-2 bg-[#1C7C54] hover:bg-[#1B512D] disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-all hover:shadow-md"
                        >
                            {step === 1 ? "Next: Configure" : "Generate Analysis"}{" "}
                            <ArrowRight size={16} />
                        </button>
                    )}
                    {step === 3 && !generating && (
                        <button
                            onClick={onClose}
                            className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium shadow-sm transition-all"
                        >
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

