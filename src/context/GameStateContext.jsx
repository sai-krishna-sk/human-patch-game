import React, { createContext, useContext, useState } from 'react';

const GameStateContext = createContext();

export const useGameState = () => useContext(GameStateContext);

export const GameStateProvider = ({ children }) => {
    const [assets, setAssets] = useState(4200000);
    const [safetyScore, setSafetyScore] = useState(0);
    const [rank, setRank] = useState('Rookie');
    const [lives, setLives] = useState(3);
    const [currentLevel, setCurrentLevel] = useState(0); // 0 = Overworld, 1 = Level 1...

    const enterLevel = (levelId) => {
        setCurrentLevel(levelId);
    };

    const adjustAssets = (amount) => {
        setAssets(prev => Math.max(0, prev + amount)); // Assets never go below 0
    };

    const adjustLives = (amount) => {
        setLives(prev => Math.max(0, prev + amount));
    };

    const completeLevel = (success, pointsAmount, assetChange) => {
        setAssets(prev => prev + assetChange);
        if (success) {
            setSafetyScore(prev => prev + pointsAmount);
            // Logic for rank up might go here based on total score
            if (safetyScore + pointsAmount >= 500) {
                setRank('Junior Detective');
            }
        }
        setCurrentLevel(0); // Return to overworld
    };

    return (
        <GameStateContext.Provider value={{
            assets,
            safetyScore,
            rank,
            lives,
            currentLevel,
            enterLevel,
            completeLevel,
            adjustAssets,
            adjustLives
        }}>
            {children}
        </GameStateContext.Provider>
    );
};
