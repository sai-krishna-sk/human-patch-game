import React from 'react';
import { useGameState } from '../context/GameStateContext';

const levelNames = {
    1: 'The OTP Trap',
    2: 'Phishing Net',
    3: 'The Fake App',
    4: 'QR Code Scam',
    5: 'Ghost Profile',
    6: 'SIM Swap',
    7: 'The Open Network',
    8: 'The Ghost Store',
    9: 'The Invisible Hook',
    10: 'The Voice That Wasn\'t',
    11: 'The Password Paradox',
    12: 'Zero Day',
    13: 'APT Attack',
    14: 'Final Boss'
};

const levelDifficulty = {
    1: 'EASY', 2: 'EASY', 3: 'MEDIUM', 4: 'MEDIUM', 5: 'MEDIUM',
    6: 'HARD', 7: 'EXPERT', 8: 'HARD', 9: 'EXPERT', 10: 'EXPERT',
    11: 'EXPERT', 12: 'EXTREME', 13: 'EXTREME', 14: 'EXTREME'
};

const difficultyColor = {
    'EASY': 'text-emerald-400',
    'MEDIUM': 'text-amber-400',
    'HARD': 'text-orange-500',
    'EXPERT': 'text-red-500',
    'EXTREME': 'text-fuchsia-500'
};

const LevelSelector = () => {
    const { enterLevel } = useGameState();

    return (
        <div className="absolute inset-0 z-[1000] bg-slate-950 flex flex-col items-center justify-center">

            {/* Background grid */}
            <div className="absolute inset-0 z-0 opacity-10" style={{
                backgroundImage: `
                    linear-gradient(rgba(34,211,238,0.15) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(34,211,238,0.15) 1px, transparent 1px)
                `,
                backgroundSize: '80px 80px',
                backgroundPosition: 'center'
            }}></div>

            {/* Main Panel */}
            <div className="w-[1200px] h-[750px] bg-slate-900/95 border border-cyan-500/30 flex flex-col p-8 relative overflow-hidden z-10 rounded-lg"
                style={{ boxShadow: '0 0 60px rgba(34,211,238,0.1), inset 0 0 60px rgba(0,0,0,0.3)' }}>

                {/* Scanlines */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 3px)' }}></div>

                {/* Header */}
                <div className="flex justify-between items-end mb-8 border-b border-slate-700/50 pb-5 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-3 h-3 bg-cyan-500 rounded-sm" style={{ boxShadow: '0 0 8px rgba(34,211,238,0.6)' }}></div>
                            <h2 className="text-4xl font-black tracking-[0.15em] text-cyan-400" style={{ textShadow: '0 0 12px rgba(34,211,238,0.4)' }}>
                                MISSION SELECT
                            </h2>
                        </div>
                        <p className="text-slate-500 font-mono text-sm mt-1 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                            Choose a case file to investigate
                        </p>
                    </div>
                    <button
                        onClick={() => enterLevel(-2)}
                        className="px-6 py-2.5 bg-slate-950 hover:bg-slate-800 text-red-400 font-bold border border-red-900/60 hover:border-red-500 transition-colors uppercase tracking-widest font-mono text-sm rounded-sm"
                    >
                        ✕ Abort
                    </button>
                </div>

                {/* Levels Grid */}
                <div className="flex-1 overflow-y-auto grid grid-cols-5 gap-5 pr-2 relative z-10 custom-scrollbar">
                    {[...Array(14)].map((_, i) => {
                        const levelNum = i + 1;
                        const isUnlocked = levelNum <= 11;
                        const difficulty = levelDifficulty[levelNum];

                        return (
                            <div
                                key={levelNum}
                                onClick={() => isUnlocked && enterLevel(levelNum)}
                                className={`
                                    h-44 rounded-md border flex flex-col justify-center items-center p-5 transition-all relative overflow-hidden
                                    ${isUnlocked
                                        ? 'bg-gradient-to-b from-cyan-900/20 to-slate-900 border-cyan-500/50 cursor-pointer hover:border-cyan-400 hover:bg-cyan-900/30 group'
                                        : 'bg-slate-900/60 border-slate-800/50 cursor-not-allowed opacity-40'}
                                `}
                                style={isUnlocked ? { boxShadow: 'inset 0 0 20px rgba(34,211,238,0.05)' } : {}}
                            >
                                {/* Case number */}
                                <div className={`text-5xl font-black mb-2 ${isUnlocked ? 'text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-400' : 'text-slate-700'}`}>
                                    {levelNum.toString().padStart(2, '0')}
                                </div>

                                {/* Case name */}
                                <div className={`text-center font-mono text-xs uppercase font-bold tracking-wider ${isUnlocked ? 'text-cyan-200' : 'text-slate-600'}`}>
                                    {levelNames[levelNum] || 'CLASSIFIED'}
                                </div>

                                {/* Difficulty */}
                                <div className={`text-[9px] font-mono mt-2 tracking-widest ${isUnlocked ? difficultyColor[difficulty] : 'text-slate-700'}`}>
                                    {difficulty}
                                </div>

                                {/* Lock */}
                                {!isUnlocked && (
                                    <div className="mt-3 text-slate-700">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                )}

                                {/* Hover glow line */}
                                {isUnlocked && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Edge glow */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
        </div>
    );
};

export default LevelSelector;
