import React, { useState } from 'react';
import { useGameState } from '../context/GameStateContext';
import SpotThePhish from './minigames/SpotThePhish';
import URLAssassin from './minigames/URLAssassin';

const CyberDefenseLab = () => {
    const { enterLevel } = useGameState();
    const [view, setView] = useState('hub'); // 'hub', 'minigames', 'quiz', 'playing'
    const [activeGame, setActiveGame] = useState(null);

    const cardStyle = "group relative p-8 bg-slate-900 border border-slate-800 rounded-2xl hover:border-cyan-500/50 transition-all duration-500 overflow-hidden cursor-pointer";

    const renderHub = () => (
        <div className="flex flex-col items-center justify-center gap-12 animate-fade-in">
            <div className="text-center">
                <h1 className="text-5xl font-black text-white uppercase tracking-[0.2em] mb-4">
                    Cyber <span className="text-cyan-400">Defense</span> Lab
                </h1>
                <p className="text-slate-500 font-mono text-sm tracking-widest">ADVANCED SECURITY CALIBRATION & TRAINING</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-6">
                {/* Mini Games Option */}
                <div
                    onClick={() => setView('minigames')}
                    className={cardStyle}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                        <span className="text-8xl">🎮</span>
                    </div>
                    <div className="relative z-10">
                        <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2 block">Interactive Drills</span>
                        <h2 className="text-3xl font-black text-white uppercase mb-4">Mini Games</h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            Rapid-fire challenges designed to sharpen your reflexes against modern cyber threats.
                        </p>
                        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-widest">
                            Initialize Sequence <span className="group-hover:translate-x-2 transition-transform">→</span>
                        </div>
                    </div>
                </div>

                {/* Quiz Mode Option */}
                <div
                    onClick={() => setView('quiz')}
                    className={cardStyle}
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-30 transition-opacity">
                        <span className="text-8xl">🧪</span>
                    </div>
                    <div className="relative z-10">
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 block">Theoretical Assessment</span>
                        <h2 className="text-3xl font-black text-white uppercase mb-4">Quiz Mode</h2>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">
                            Test your foundational knowledge across multiple domains of cybersecurity defense.
                        </p>
                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-widest">
                            Start Assessment <span className="group-hover:translate-x-2 transition-transform">→</span>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={() => enterLevel(-2)} // Back to Main Menu
                className="px-12 py-3 bg-transparent hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white font-bold uppercase tracking-widest border border-slate-800 transition-all font-mono text-xs"
            >
                [ RETURN_TO_COMMAND_CENTER ]
            </button>
        </div>
    );

    const renderGameSelection = () => (
        <div className="flex flex-col items-center w-full max-w-6xl px-6 animate-fade-in h-full py-12">
            <div className="flex justify-between items-center w-full mb-12">
                <div>
                    <h2 className="text-3xl font-black text-white uppercase tracking-tight">Mini Game Selector</h2>
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">10 Active Training Modules</p>
                </div>
                <button
                    onClick={() => setView('hub')}
                    className="px-6 py-2 border border-slate-700 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-mono text-xs"
                >
                    BACK
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {/* 1. Spot the Phish */}
                <div
                    onClick={() => { setActiveGame('SpotThePhish'); setView('playing'); }}
                    className="group bg-slate-900/50 border border-slate-800 p-6 rounded-xl hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all cursor-pointer"
                >
                    <div className="flex items-start justify-between mb-4">
                        <span className="text-3xl">📧</span>
                        <span className="text-[10px] font-mono text-slate-600 bg-slate-950 px-2 py-1 rounded">LEVEL_01</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Spot THE Phish</h3>
                    <p className="text-slate-400 text-sm mb-4">Precision-based reaction challenge. Identify fraud vs legit emails in a realistic laptop interface.</p>
                    <div className="w-full h-1 bg-slate-800 rounded overflow-hidden">
                        <div className="h-full bg-emerald-500 w-1/3"></div>
                    </div>
                </div>

                {/* 2. URL Assassin */}
                <div
                    onClick={() => { setActiveGame('URLAssassin'); setView('playing'); }}
                    className="group bg-slate-900/50 border border-slate-800 p-6 rounded-xl hover:border-red-500/30 hover:bg-red-500/5 transition-all cursor-pointer"
                >
                    <div className="flex items-start justify-between mb-4">
                        <span className="text-3xl">🎯</span>
                        <span className="text-[10px] font-mono text-slate-600 bg-slate-950 px-2 py-1 rounded">LEVEL_02</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">URL Assassin</h3>
                    <p className="text-slate-400 text-sm mb-4">Identify malicious patterns in browser address bars. Neutralize punycode and homograph traps.</p>
                    <div className="w-full h-1 bg-slate-800 rounded overflow-hidden">
                        <div className="h-full bg-red-500 w-2/3"></div>
                    </div>
                </div>

                {/* Placeholders for others */}
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-slate-900/20 border border-slate-800/50 p-6 rounded-xl relative grayscale opacity-40 group overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center rotate-12">
                            <span className="text-slate-700 font-black text-4xl opacity-10">LOCKED</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-500 mb-2 italic">Module_{i + 3}</h3>
                        <p className="text-slate-600 text-sm">Calibration required...</p>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderQuizPlaceholder = () => (
        <div className="flex flex-col items-center justify-center gap-8 animate-fade-in border border-indigo-500/20 bg-indigo-500/5 p-16 rounded-3xl">
            <span className="text-6xl animate-bounce">🧪</span>
            <div className="text-center">
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-2">Quiz Module</h2>
                <p className="text-slate-400 font-mono text-sm uppercase">Integrating legacy quiz protocols...</p>
            </div>
            <button
                onClick={() => setView('hub')}
                className="mt-8 px-8 py-3 bg-indigo-600/20 border border-indigo-500/50 rounded-lg text-indigo-400 font-bold uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
            >
                REINITIALIZE HUB
            </button>
        </div>
    );

    return (
        <div className="relative w-screen h-screen overflow-x-hidden overflow-y-auto bg-slate-950 flex flex-col items-center justify-center font-mono text-slate-300">
            {/* Background elements */}
            <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(34,211,238,0.15)_0%,transparent_70%)]" />
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            {/* View Switching */}
            <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center">
                {view === 'hub' && renderHub()}
                {view === 'minigames' && renderGameSelection()}
                {view === 'quiz' && renderQuizPlaceholder()}
                {view === 'playing' && activeGame === 'SpotThePhish' && (
                    <SpotThePhish onBack={() => { setView('minigames'); setActiveGame(null); }} />
                )}
                {view === 'playing' && activeGame === 'URLAssassin' && (
                    <URLAssassin onBack={() => { setView('minigames'); setActiveGame(null); }} />
                )}
            </div>

            {/* Scanning Line Effect */}
            <div className="fixed top-0 left-0 w-full h-[2px] bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)] animate-scan pointer-events-none z-[100]" />
            <style jsx>{`
                @keyframes scan {
                    0% { top: 0%; opacity: 0; }
                    5% { opacity: 1; }
                    95% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan {
                    animation: scan 8s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default CyberDefenseLab;
