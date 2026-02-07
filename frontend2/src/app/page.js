"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Workspace from '@/components/Workspace';
import Inspector from '@/components/Inspector';
import GuidedPlanning from '@/components/GuidedPlanning';
import { useProject } from '@/lib/ProjectContext';
import { authApi } from '@/lib/api';
import { BrainCircuit } from 'lucide-react';

export default function App() {
    const { currentProject, selectProject, refreshProjects } = useProject();
    const [user, setUser] = useState(null);
    const [loggingIn, setLoggingIn] = useState(false);
    const [showPlanning, setShowPlanning] = useState(false);

    // Auto-login for dev
    useEffect(() => {
        const doLogin = async () => {
            try {
                setLoggingIn(true);
                const res = await authApi.login('researcher@example.com', 'Lead Investigator');
                setUser(res.user);
            } catch (err) {
                console.error('Login failed:', err);
            } finally {
                setLoggingIn(false);
            }
        };
        doLogin();
    }, []);

    const handlePlanCreated = (projectId) => {
        setShowPlanning(false);
        refreshProjects();
        selectProject(projectId);
    };

    if (loggingIn || !user) {
        return (
            <div className="h-screen w-screen bg-[#0a0a0b] flex flex-col items-center justify-center p-6 font-mono">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-8 animate-pulse">
                    <BrainCircuit size={32} className="text-blue-500" />
                </div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-[0.5em] animate-pulse">
                    INITIALIZING SECURE SESSION...
                </div>
            </div>
        );
    }

    return (
        <main className="workbench">
            <Sidebar />

            {!currentProject && !showPlanning ? (
                <section className="panel flex-1 justify-center items-center bg-[#0a0a0b]">
                    <div className="text-center p-12 border border-white/5 bg-white/[0.01] rounded-[2rem] max-w-lg backdrop-blur-sm">
                        <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto mb-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                            <BrainCircuit size={40} className="text-blue-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Welcome, {user.name}</h2>
                        <p className="text-zinc-500 text-sm mb-10 leading-relaxed">
                            Ready to accelerate your research? Initialize a new execution pipeline or select an existing project from the navigator.
                        </p>
                        <button
                            onClick={() => setShowPlanning(true)}
                            className="w-full py-4 bg-white text-black text-sm font-bold rounded-xl hover:bg-zinc-200 transition-all shadow-xl shadow-white/5"
                        >
                            START NEW RESEARCH SESSION
                        </button>
                    </div>
                </section>
            ) : showPlanning ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="h-14 border-b border-white/5 flex items-center px-6 bg-zinc-900/40">
                        <button
                            onClick={() => setShowPlanning(false)}
                            className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase tracking-widest flex items-center"
                        >
                            ← Cancel Planning
                        </button>
                    </div>
                    <GuidedPlanning onPlanCreated={handlePlanCreated} />
                </div>
            ) : (
                <Workspace />
            )}

            <Inspector />
        </main>
    );
}
