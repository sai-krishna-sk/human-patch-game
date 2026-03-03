import React from 'react';
import { useGameState } from '../context/GameStateContext';

const Quiz = () => {
    const { enterLevel } = useGameState();

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-slate-950 flex flex-col items-center justify-center font-mono text-slate-300">
            {/* Atmospheric Background */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.1)_0%,transparent_70%)]" />
                <div className="absolute inset-0 opacity-[0.05]" style={{
                    backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }} />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-2xl w-full p-12 border border-slate-800 bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mb-8 border border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                    <span className="text-4xl">🧪</span>
                </div>

                <h1 className="text-4xl font-black text-white tracking-widest uppercase mb-4 decoration-cyan-500 underline underline-offset-[12px] decoration-4">
                    Quiz Mode
                </h1>

                <p className="text-slate-400 text-sm leading-relaxed mb-12 max-w-md">
                    The advanced diagnostic assessment module is currently undergoing initialization.
                    System engineers are calibrating the cognitive evaluation protocols.
                </p>

                <div className="flex flex-col gap-4 w-full max-w-xs">
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <button
                            disabled
                            className="relative w-full px-8 py-4 bg-slate-900 rounded-lg text-slate-500 font-bold uppercase tracking-widest border border-slate-800"
                        >
                            Initializing...
                        </button>
                    </div>

                    <button
                        onClick={() => enterLevel(-2)} // Back to Main Menu
                        className="w-full px-8 py-3 bg-transparent hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white font-bold uppercase tracking-widest border border-slate-800 transition-all"
                    >
                        Return to Hub
                    </button>
                </div>

                {/* Footer status */}
                <div className="mt-12 flex items-center gap-3">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                    <span className="text-[10px] text-slate-600 font-black tracking-widest uppercase italic">
                        Node_Status: Awaiting_Data_Streams
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Quiz;
