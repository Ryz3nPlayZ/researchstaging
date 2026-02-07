"use client";

import React, { useState } from 'react';
import { planningApi } from '@/lib/api';
import { Sparkles, ArrowRight, Brain, Target, Users, BookOpen } from 'lucide-react';
import { useProject } from '@/lib/ProjectContext';

export default function GuidedPlanning({ onPlanCreated }) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        research_goal: '',
        output_type: 'literature_review',
        audience: 'academic'
    });
    const [generatedPlan, setGeneratedPlan] = useState(null);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const response = await planningApi.generatePlan({ answers: formData });
            setGeneratedPlan(response.data);
            setStep(2);
        } catch (err) {
            console.error('Failed to generate plan:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        setLoading(true);
        try {
            const response = await planningApi.approve({
                answers: formData,
                plan: generatedPlan
            });
            if (onPlanCreated) onPlanCreated(response.data.project_id);
        } catch (err) {
            console.error('Failed to approve plan:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#0a0a0b]">
            <div className="w-full max-w-2xl bg-[#121214] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                <div className="p-8">
                    {step === 1 ? (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-2 flex items-center">
                                    <Sparkles size={24} className="text-blue-400 mr-3" />
                                    Define Your Research Objective
                                </h2>
                                <p className="text-zinc-500 text-sm">
                                    What would you like the Antigravity engine to investigate?
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 flex items-center">
                                        <Target size={12} className="mr-2" /> Research Goal
                                    </label>
                                    <textarea
                                        value={formData.research_goal}
                                        onChange={(e) => setFormData({ ...formData, research_goal: e.target.value })}
                                        placeholder="e.g., The impact of room-temperature superconductors on fusion energy economics..."
                                        className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-sm text-white placeholder-zinc-800 focus:outline-none focus:border-blue-500/30 min-h-[120px] transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 flex items-center">
                                            <BookOpen size={12} className="mr-2" /> Output Type
                                        </label>
                                        <select
                                            value={formData.output_type}
                                            onChange={(e) => setFormData({ ...formData, output_type: e.target.value })}
                                            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm text-zinc-300 focus:outline-none appearance-none"
                                        >
                                            <option value="literature_review">Literature Review</option>
                                            <option value="research_paper">Research Paper</option>
                                            <option value="brief">Research Brief</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2 flex items-center">
                                            <Users size={12} className="mr-2" /> Target Audience
                                        </label>
                                        <select
                                            value={formData.audience}
                                            onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                                            className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm text-zinc-300 focus:outline-none appearance-none"
                                        >
                                            <option value="academic">Academic</option>
                                            <option value="industry">Industry / Stakeholders</option>
                                            <option value="policy">Policy Makers</option>
                                            <option value="general">General Public</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading || formData.research_goal.length < 10}
                                    className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            INITIALIZE PLANNER
                                            <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em] mb-2">Plan Generated</div>
                                <h2 className="text-xl font-bold text-white mb-2">{generatedPlan?.title}</h2>
                                <p className="text-zinc-500 text-sm leading-relaxed">{generatedPlan?.summary}</p>
                            </div>

                            <div className="border-t border-white/5 pt-6 space-y-4">
                                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center">
                                    <Brain size={12} className="mr-2" /> Sequence Strategy
                                </div>
                                {generatedPlan?.phases?.map((phase, i) => (
                                    <div key={i} className="flex items-start space-x-4 p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                                        <div className="w-6 h-6 rounded-full bg-zinc-800 text-[10px] font-bold flex items-center justify-center text-zinc-500 flex-shrink-0">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-white uppercase">{phase.name}</div>
                                            <div className="text-[10px] text-zinc-500 mt-0.5">
                                                {phase.tasks?.length} steps defined
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex space-x-4 pt-6">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-4 bg-zinc-900 text-zinc-400 font-bold rounded-xl border border-white/5 hover:bg-zinc-800 transition-all"
                                >
                                    RECONFIGURE
                                </button>
                                <button
                                    onClick={handleApprove}
                                    className="flex-[2] py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                                    ) : (
                                        "COMMIT & EXECUTE"
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 text-[10px] font-mono text-zinc-700 uppercase tracking-[0.5em]">
                RESEARCH PILOT v3.0 // STATE: IDLE
            </div>
        </div>
    );
}
