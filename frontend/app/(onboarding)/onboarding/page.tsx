"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    CheckCircle2,
    ArrowRight,
    User,
    GraduationCap,
    Users,
    Sparkles
} from "lucide-react";

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [name, setName] = useState("");
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleComplete = async () => {
        setLoading(true);
        // Simulate API call or setting user preferences
        await new Promise(resolve => setTimeout(resolve, 800));
        router.push("/dashboard");
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Header / Progress */}
            <div className="bg-gray-50 border-b border-gray-100 px-8 py-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#1C7C54] rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        R
                    </div>
                    <span className="font-semibold text-gray-900 tracking-tight">Research Pilot</span>
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3].map((s) => (
                        <div
                            key={s}
                            className={`w-2 h-2 rounded-full transition-colors ${step >= s ? "bg-[#1C7C54]" : "bg-gray-200"
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="p-8 md:p-10 min-h-[400px] flex flex-col">
                {step === 1 && (
                    <div className="flex-1 flex flex-col justify-center animate-in slide-in-from-right-4 fade-in duration-300">
                        <div className="mb-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1C7C54]/10 text-[#1C7C54] text-xs font-medium mb-4">
                                <Sparkles size={12} /> Welcome aboard
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">First, what should we call you?</h2>
                            <p className="text-gray-500">This will be displayed on your profile and workspace.</p>
                        </div>

                        <div className="space-y-4 max-w-sm">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Alex Chen"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#1C7C54] focus:ring-2 focus:ring-[#1C7C54]/20 outline-none transition-all placeholder:text-gray-300"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={() => setStep(2)}
                                disabled={!name.trim()}
                                className="inline-flex items-center gap-2 bg-[#1C7C54] hover:bg-[#1B512D] text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg disabled:shadow-none"
                            >
                                Continue <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="flex-1 flex flex-col justify-center animate-in slide-in-from-right-4 fade-in duration-300">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">What best describes your role?</h2>
                            <p className="text-gray-500">We'll customize your workspace based on your needs.</p>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <button
                                onClick={() => setRole("researcher")}
                                className={`group p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${role === "researcher"
                                        ? "border-[#1C7C54] bg-[#DEF4C6]/20"
                                        : "border-gray-100 hover:border-gray-200 bg-white"
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg ${role === "researcher" ? "bg-[#1C7C54] text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                                        }`}>
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <h3 className={`font-semibold ${role === "researcher" ? "text-[#1B512D]" : "text-gray-900"}`}>Academic Researcher</h3>
                                        <p className="text-sm text-gray-500 mt-1">Conducting literature reviews and writing papers.</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setRole("student")}
                                className={`group p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${role === "student"
                                        ? "border-[#1C7C54] bg-[#DEF4C6]/20"
                                        : "border-gray-100 hover:border-gray-200 bg-white"
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg ${role === "student" ? "bg-[#1C7C54] text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                                        }`}>
                                        <GraduationCap size={20} />
                                    </div>
                                    <div>
                                        <h3 className={`font-semibold ${role === "student" ? "text-[#1B512D]" : "text-gray-900"}`}>PhD Student</h3>
                                        <p className="text-sm text-gray-500 mt-1">Managing citations and drafting thesis chapters.</p>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => setRole("team_lead")}
                                className={`group p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${role === "team_lead"
                                        ? "border-[#1C7C54] bg-[#DEF4C6]/20"
                                        : "border-gray-100 hover:border-gray-200 bg-white"
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-lg ${role === "team_lead" ? "bg-[#1C7C54] text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                                        }`}>
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <h3 className={`font-semibold ${role === "team_lead" ? "text-[#1B512D]" : "text-gray-900"}`}>R&D Team Lead</h3>
                                        <p className="text-sm text-gray-500 mt-1">Overseeing projects and synthesizing findings.</p>
                                    </div>
                                </div>
                            </button>
                        </div>

                        <div className="mt-8 flex justify-between items-center">
                            <button
                                onClick={() => setStep(1)}
                                className="text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={!role}
                                className="inline-flex items-center gap-2 bg-[#1C7C54] hover:bg-[#1B512D] text-white px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg disabled:shadow-none"
                            >
                                Continue <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center animate-in slide-in-from-right-4 fade-in duration-300">
                        <div className="w-20 h-20 bg-[#DEF4C6] rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500 delay-100">
                            <CheckCircle2 size={40} className="text-[#1C7C54]" />
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set, {name}!</h2>
                        <p className="text-gray-500 max-w-xs mx-auto mb-8">
                            Your workspace is ready. Let's start your first research project.
                        </p>

                        <button
                            onClick={handleComplete}
                            disabled={loading}
                            className="inline-flex items-center gap-2 bg-[#1C7C54] hover:bg-[#1B512D] text-white px-8 py-3 rounded-xl font-medium text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                        >
                            {loading ? "Setting up..." : "Go to Dashboard"} <ArrowRight size={20} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

