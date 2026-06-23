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
import Level12 from './levels/Level12';
import Level13 from './levels/Level13';

import LevelLivingRoom from './levels/LevelLivingRoom';
import LevelBedroom from './levels/LevelBedroom';
import LevelSelector from './components/LevelSelector';
import MainMenu from './components/MainMenu';
import PauseMenu from './components/PauseMenu';
import Prologue from './levels/Prologue';
import CyberDefenseLab from './components/CyberDefenseLab';
import { GameStateProvider, useGameState } from './context/GameStateContext';
import ColorBlindFilters from './components/ColorBlindFilters';
import MobileViewportScaler from './components/MobileViewportScaler';
import MobileControls from './components/MobileControls';

function GameRunner() {
    const { currentLevel, assets, rank, safetyScore, lives, isPaused, setIsPaused, colorBlindFilter, visualProfile } = useGameState();

    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !e.defaultPrevented) {
                setIsPaused(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setIsPaused]);

    const renderScreen = () => {
        switch (currentLevel) {
            case -3: return <Prologue />;
            case -2: return <MainMenu />;
            case -4: return <CyberDefenseLab />;
            case 0: return <WorldMap />;
            case -1: return <LevelSelector />;
            case 1: return <Level1 />;
            case 2: return <Level2 />;
            case 3: return <Level3 />;
            case 4: return <Level4 />;
            case 5: return <Level5 />;
            case 6: return <Level6 />;
            case 7: return <Level7 />;
            case 8: return <Level8 />;
            case 9: return <Level9 />;
            case 10: return <Level10 />;
            case 11: return <Level11 />;
            case 12: return <Level12 />;
            case 13: return <Level13 />;
            case 'living-room': return <LevelLivingRoom />;
            case 'bedroom': return <LevelBedroom />;
            default: return null;
        }
    };

    return (
        <div 
            className={`w-full h-full bg-black overflow-hidden font-sans relative ${visualProfile && visualProfile !== 'none' ? `profile-${visualProfile}` : ''}`}
            style={{ filter: colorBlindFilter && colorBlindFilter !== 'normal' ? `url(#${colorBlindFilter})` : 'none' }}
        >
            <ColorBlindFilters />

            <MobileViewportScaler active={true}>
                {renderScreen()}
                
                {/* Mobile virtual gamepad controller */}
                <MobileControls />

                {/* Pause Menu Overlay */}
                {isPaused && <PauseMenu />}
            </MobileViewportScaler>

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
