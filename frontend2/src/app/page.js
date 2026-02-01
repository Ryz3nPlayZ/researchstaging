"use client";

import React, { useState } from 'react';

export default function Workspace() {
    const [activeFile, setActiveFile] = useState('02-protocol-analysis.py');

    return (
        <main className="workbench">
            {/* 1. Project Navigation */}
            <aside className="panel">
                <div className="header">Workspace / Files</div>
                <div className="scroll-area">
                    <div className="mb-8 overflow-hidden rounded-md border border-white/5 bg-white/5 p-3">
                        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Active Project</div>
                        <div className="text-sm font-medium text-white truncate">Hydride Superconductivity</div>
                    </div>

                    <nav className="space-y-1">
                        {['research_main.md', '02-protocol-analysis.py', 'draft_v1.docx', 'references.bib'].map(file => (
                            <div
                                key={file}
                                onClick={() => setActiveFile(file)}
                                className={`group flex items-center px-2 py-1.5 text-xs rounded cursor-pointer transition-colors ${activeFile === file ? 'bg-white/10 text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}`}
                            >
                                <span className="mr-2 opacity-50">{file.endsWith('.py') ? '🐍' : '📄'}</span>
                                {file}
                            </div>
                        ))}
                    </nav>
                </div>
            </aside>

            {/* 2. Main Workbench */}
            <section className="panel" style={{ background: '#0a0a0b' }}>
                <div className="header flex justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="text-zinc-600">EDITOR /</span>
                        <span className="text-white">{activeFile}</span>
                    </div>
                    <div className="flex space-x-2">
                        <button className="btn btn-ghost text-xs">SAVE</button>
                        <button className="btn btn-primary text-xs !py-1">EXECUTE</button>
                    </div>
                </div>

                <div className="scroll-area !p-0 flex border-t border-white/5">
                    <div className="w-12 border-right border-white/5 bg-black/20 flex flex-col items-center pt-4 text-[10px] font-mono text-zinc-700">
                        {Array.from({ length: 40 }).map((_, i) => <div key={i} className="h-6 leading-6">{i + 1}</div>)}
                    </div>
                    <div className="flex-1 p-8 font-mono text-sm leading-6 text-zinc-400">
                        <div className="text-blue-400">import</div> pandas <div className="text-blue-400 text-inline">as</div> pd<br />
                        <div className="text-blue-400">import</div> matplotlib.pyplot <div className="text-blue-400 text-inline">as</div> plt<br />
                        <br />
                        <div className="text-zinc-600"># Analysis of pressure-dependent superconductivity</div><br />
                        <div className="text-blue-400">def</div> <div className="text-yellow-200 text-inline">analyze_peaks</div>(data_path):<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;df = pd.read_csv(data_path)<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;<div className="text-zinc-600"># Filtering for room-temp samples</div><br />
                        &nbsp;&nbsp;&nbsp;&nbsp;results = df[df[<div className="text-green-800 text-inline">'temp'</div>] &gt; <div className="text-orange-400 text-inline">273.15</div>]<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;<div className="text-blue-400">return</div> results<br />
                        <br />
                        analyze_peaks(<div className="text-green-800 text-inline">'data/raw_signal_082.csv'</div>)
                    </div>
                </div>

                {/* Terminal/Log area */}
                <div className="h-48 border-t border-white/10 bg-black/40 p-4 font-mono text-xs overflow-y-auto">
                    <div className="flex items-center text-zinc-500 mb-2">
                        <span className="mr-2">TERMINAL</span>
                        <div className="h-px flex-1 bg-white/5"></div>
                    </div>
                    <div className="text-green-500">[INFO] Loading data/raw_signal_082.csv...</div>
                    <div className="text-green-500">[INFO] Applied Gaussian filter (sigma=1.2)</div>
                    <div className="text-zinc-300">Peak detected at T=288.5K (P=165GPa)</div>
                    <div className="text-zinc-500 mt-2">$ _</div>
                </div>
            </section>

            {/* 3. AI Agent Context */}
            <aside className="panel panel-last">
                <div className="header">Agent Monitor</div>
                <div className="scroll-area space-y-4">
                    <div className="rounded-lg bg-zinc-900/50 border border-white/5 p-4">
                        <div className="flex items-center space-x-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Hypothesis</span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                            Pressure-lattice misalignment in H3S might explain the 15% discrepancy in critical current density.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Action Queue</div>

                        <div className="card !bg-white/5 !border-blue-500/20 group">
                            <div className="text-[10px] font-bold text-blue-400 mb-1">PROPOSAL [A105]</div>
                            <div className="text-xs text-white mb-3">Verify claim of zero-resistivity transition temperature from ArXiv:2401.082 vs Nature.2023</div>
                            <div className="flex space-x-2">
                                <button className="flex-1 text-[10px] py-1.5 rounded bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors">APPROVE</button>
                                <button className="px-3 text-[10px] py-1.5 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors">REJECT</button>
                            </div>
                        </div>

                        <div className="card opacity-60">
                            <div className="text-[10px] font-bold text-zinc-500 mb-1">TASK [COMPLETED]</div>
                            <div className="text-xs text-zinc-400">Scrape supplementary tables from Dasen et al. (2023)</div>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-white/5 bg-white/5">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Command agent..."
                            className="w-full bg-black/40 border border-white/10 rounded-md py-2 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                        <div className="absolute right-3 top-2.5 text-zinc-600 text-[10px]">⏎</div>
                    </div>
                </div>
            </aside>
        </main>
    );
}
