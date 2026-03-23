import React from 'react';
import { useGameState } from '../context/GameStateContext';

const PauseMenu = () => {
    const { setIsPaused, enterLevel, currentLevel } = useGameState();

    const handleResume = () => {
        setIsPaused(false);
    };

    const handleQuit = () => {
        setIsPaused(false);
        enterLevel(-2); // Back to Main Menu
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop Blur */}
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300" onClick={handleResume}></div>

            {/* Menu Container */}
            <div className="relative z-10 w-full max-w-md bg-white/10 border border-white/20 backdrop-blur-xl rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase mb-2">Game Paused</h2>
                    <div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full"></div>
                </div>

                <div className="space-y-4">
                    <button 
                        onClick={handleResume}
                        className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-3 group"
                    >
                        <span>Resume</span>
                        <span className="group-hover:translate-x-1 transition-transform">▸</span>
                    </button>

                    <div className="pt-4 h-px bg-white/10 mx-10"></div>

                    <button 
                        onClick={handleQuit}
                        className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-500 font-bold uppercase tracking-[0.2em] rounded-2xl hover:bg-red-500/20 hover:border-red-500/40 transition-all"
                    >
                        Quit to Menu
                    </button>
                </div>

                <div className="mt-10 text-center">
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.3em]">Session active // Level {currentLevel}</p>
                </div>
            </div>
        </div>
    );
};

export default PauseMenu;
