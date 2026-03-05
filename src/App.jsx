import React from 'react';
import WorldMap from './components/WorldMap';
import Level1 from './levels/Level1';
import Level2 from './levels/Level2';
import Level3 from './levels/Level3';
import Level4 from './levels/Level4';
import Level5 from './levels/Level5';
import Level6 from './levels/Level6';
import Level7 from './levels/Level7';
import Level8 from './levels/Level8';
import Level9 from './levels/Level9';
import Level10 from './levels/Level10';
import Level11 from './levels/Level11';
import LevelLivingRoom from './levels/LevelLivingRoom';
import LevelBedroom from './levels/LevelBedroom';
import LevelSelector from './components/LevelSelector';
import MainMenu from './components/MainMenu';
import Prologue from './levels/Prologue';
import CyberDefenseLab from './components/CyberDefenseLab';
import { GameStateProvider, useGameState } from './context/GameStateContext';

function GameRunner() {
    const { currentLevel, assets, rank, safetyScore, lives } = useGameState();

    return (
        <div className="w-screen h-screen bg-slate-900 overflow-hidden font-sans relative">

            {/* Global HUD — Assets & Status - Only visible in levels 1-5 */}
            {currentLevel > 0 && (
                <div className="absolute top-4 right-4 z-[100] bg-slate-900/95 border border-slate-700/60 p-4 rounded-lg flex flex-col gap-3 min-w-[220px]"
                    style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>

                    {/* Assets */}
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-mono text-xs uppercase tracking-wider">Assets</span>
                        <span className="text-emerald-400 font-bold text-lg font-mono">
                            ₹{assets.toLocaleString('en-IN')}
                        </span>
                    </div>

                    <div className="h-px bg-slate-800"></div>

                    {/* Lives */}
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-mono text-xs uppercase tracking-wider">Lives</span>
                        <span className="text-red-400 font-bold text-sm font-mono flex gap-1">
                            {[...Array(3)].map((_, i) => (
                                <span key={i} className={i < lives ? 'text-red-500' : 'text-slate-700 opacity-50'}>❤️</span>
                            ))}
                        </span>
                    </div>

                    <div className="h-px bg-slate-800"></div>

                    {/* Safety Score */}
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-mono text-xs uppercase tracking-wider">Score</span>
                        <span className="text-cyan-400 font-bold text-sm font-mono">
                            {safetyScore} PTS
                        </span>
                    </div>

                    {/* Rank */}
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 font-mono text-xs uppercase tracking-wider">Rank</span>
                        <span className="text-indigo-400 font-bold text-xs tracking-widest uppercase bg-indigo-500/10 px-2 py-0.5 rounded-sm border border-indigo-500/20">
                            {rank}
                        </span>
                    </div>
                </div>
            )}

            {currentLevel === -3 && <Prologue />}
            {currentLevel === -2 && <MainMenu />}
            {currentLevel === -4 && <CyberDefenseLab />}
            {currentLevel === 0 && <WorldMap />}
            {currentLevel === -1 && <LevelSelector />}
            {currentLevel === 1 && <Level1 />}
            {currentLevel === 2 && <Level2 />}
            {currentLevel === 3 && <Level3 />}
            {currentLevel === 4 && <Level4 />}
            {currentLevel === 5 && <Level5 />}
            {currentLevel === 6 && <Level6 />}
            {currentLevel === 7 && <Level7 />}
            {currentLevel === 8 && <Level8 />}
            {currentLevel === 9 && <Level9 />}
            {currentLevel === 10 && <Level10 />}
            {currentLevel === 11 && <Level11 />}
            {currentLevel === 'living-room' && <LevelLivingRoom />}
            {currentLevel === 'bedroom' && <LevelBedroom />}

        </div>
    );
}

function App() {
    return (
        <GameStateProvider>
            <GameRunner />
        </GameStateProvider>
    );
}

export default App;
