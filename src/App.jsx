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

import LevelLivingRoom from './levels/LevelLivingRoom';
import LevelBedroom from './levels/LevelBedroom';
import LevelSelector from './components/LevelSelector';
import MainMenu from './components/MainMenu';
import PauseMenu from './components/PauseMenu';
import Prologue from './levels/Prologue';
import CyberDefenseLab from './components/CyberDefenseLab';
import Conclusion from './levels/Conclusion';
import { GameStateProvider, useGameState } from './context/GameStateContext';

function GameRunner() {
    const { currentLevel, assets, rank, safetyScore, lives, isPaused, setIsPaused } = useGameState();

    React.useEffect(() => {
        const handleKeyDown = (e) => {
            const isStoryLevel = (typeof currentLevel === 'number' && (currentLevel > 0 || currentLevel === -3)) || 
                                ['living-room', 'bedroom'].includes(currentLevel);
            if (e.key === 'Escape' && isStoryLevel) {
                setIsPaused(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentLevel, setIsPaused]);

    return (
        <div className="w-screen h-screen bg-slate-900 overflow-hidden font-sans relative">



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
            {currentLevel === 11 && <Conclusion />}
            {currentLevel === 'living-room' && <LevelLivingRoom />}
            {currentLevel === 'bedroom' && <LevelBedroom />}

            {/* Pause Menu Overlay */}
            {isPaused && <PauseMenu />}

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
