import React from 'react';
import { useGameState } from '../context/GameStateContext';

const MainMenu = () => {
    const { enterLevel } = useGameState();
    const [menuView, setMenuView] = React.useState('main'); // 'main' or 'story'

    const menuButtonStyle = "group relative px-8 py-4 bg-slate-900/40 hover:bg-indigo-600/20 border border-slate-700/50 hover:border-indigo-500/50 rounded-lg transition-all duration-300 backdrop-blur-md overflow-hidden w-72 text-left";

    return (
        <div className="relative w-screen h-screen overflow-hidden flex flex-col justify-end items-end p-16 animate-fade-in font-mono">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-[10s] hover:scale-105"
                style={{
                    backgroundImage: 'url("/assets/Title.png")',
                    backgroundColor: '#0f172a'
                }}
            />

            {/* Dark Overlay for better button visibility */}
            <div className="absolute inset-0 z-[1] bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

            {/* Menu Content */}
            <div className="relative z-10 flex flex-col gap-6 items-end">
                <div className="mb-12" />

                {menuView === 'main' ? (
                    <>
                        {/* ═══ INITIAL SELECTION ═══ */}
                        <button
                            onClick={() => setMenuView('story')}
                            className={menuButtonStyle}
                        >
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <span className="block text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1">Investigation</span>
                                    <span className="block text-2xl font-black text-white uppercase tracking-tight">Story Mode</span>
                                </div>
                                <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">🕵️‍♂️</span>
                            </div>
                            <div className="absolute bottom-0 left-0 h-1 bg-cyan-500 w-0 group-hover:w-full transition-all duration-500" />
                        </button>

                        <button
                            onClick={() => enterLevel(-4)} // Quiz Mode
                            className={menuButtonStyle}
                        >
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <span className="block text-xs font-mono text-indigo-400 uppercase tracking-widest mb-1">Defense Training</span>
                                    <span className="block text-2xl font-black text-white uppercase tracking-tight">Cyber Defense Lab</span>
                                </div>
                                <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">🧪</span>
                            </div>
                            <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 w-0 group-hover:w-full transition-all duration-500" />
                        </button>
                    </>
                ) : (
                    <>
                        {/* ═══ STORY SUB-MENU ═══ */}
                        <button
                            onClick={() => enterLevel(-3)} // New Game (Prologue)
                            className={menuButtonStyle}
                        >
                            <div className="relative z-10">
                                <span className="block text-xs font-mono text-emerald-400 uppercase tracking-widest mb-1">Establish Record</span>
                                <span className="block text-2xl font-black text-white uppercase tracking-tight">New Game</span>
                            </div>
                            <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 w-0 group-hover:w-full transition-all duration-500" />
                        </button>

                        <button
                            onClick={() => enterLevel(-1)} // Continue (Selector/Overworld)
                            className={menuButtonStyle}
                        >
                            <div className="relative z-10">
                                <span className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1">Resume Protocol</span>
                                <span className="block text-2xl font-black text-white uppercase tracking-tight">Continue</span>
                            </div>
                            <div className="absolute bottom-0 left-0 h-1 bg-slate-500 w-0 group-hover:w-full transition-all duration-500" />
                        </button>

                        <button
                            onClick={() => setMenuView('main')}
                            className="mt-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] hover:text-white transition-colors flex items-center gap-2 pr-4"
                        >
                            <span className="text-lg">←</span> Back to Main
                        </button>
                    </>
                )}
            </div>

            {/* Build Version */}
            <div className="absolute bottom-4 left-6 z-10">
                <span className="text-slate-600 font-mono text-[10px] uppercase tracking-tighter">Build v0.4.2-PROLOGUE</span>
            </div>
        </div>
    );
};

export default MainMenu;
