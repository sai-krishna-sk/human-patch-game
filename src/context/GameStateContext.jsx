import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const GameStateContext = createContext();

export const useGameState = () => useContext(GameStateContext);

export const GameStateProvider = ({ children }) => {
    // ═══ PERSISTENT STATE ═══
    const [assets, setAssets] = useState(() => {
        const saved = localStorage.getItem('hpg_assets');
        return saved !== null ? Number(saved) : 0;
    });
    const [safetyScore, setSafetyScore] = useState(() => {
        const saved = localStorage.getItem('hpg_safetyScore');
        return saved !== null ? Number(saved) : 0;
    });
    const [rank, setRank] = useState(() => {
        return localStorage.getItem('hpg_rank') || 'Rookie';
    });
    const [lives, setLives] = useState(() => {
        const saved = localStorage.getItem('hpg_lives');
        return saved !== null ? Number(saved) : 3;
    });
    const [currentLevel, setCurrentLevel] = useState(-2); // -2 = Main Menu

    useEffect(() => { localStorage.setItem('hpg_assets', assets); }, [assets]);
    useEffect(() => { localStorage.setItem('hpg_safetyScore', safetyScore); }, [safetyScore]);
    useEffect(() => { localStorage.setItem('hpg_rank', rank); }, [rank]);
    useEffect(() => { localStorage.setItem('hpg_lives', lives); }, [lives]);

    const resetProgress = () => {
        localStorage.removeItem('hpg_assets');
        localStorage.removeItem('hpg_safetyScore');
        localStorage.removeItem('hpg_rank');
        localStorage.removeItem('hpg_lives');
        setAssets(0);
        setSafetyScore(0);
        setRank('Rookie');
        setLives(3);
        setCurrentLevel(-2);
    };

    const audioCtxRef = useRef(null);

    const getAudioContext = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtxRef.current;
    };

    const playTitleCardSound = () => {
        try {
            const ctx = getAudioContext();
            if (ctx.state === 'suspended') ctx.resume();

            // Cinematic Surge
            const osc1 = ctx.createOscillator(); 
            const osc2 = ctx.createOscillator(); 
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(40, ctx.currentTime);
            osc1.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 2.5);

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(200, ctx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 3);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(100, ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 2.5);

            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.5);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 3);

            osc1.connect(filter);
            osc2.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            osc1.start();
            osc2.start();
            osc1.stop(ctx.currentTime + 3);
            osc2.stop(ctx.currentTime + 3);

            // Subtle Glitch
            const bufferSize = ctx.sampleRate * 0.11;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const noiseGain = ctx.createGain();
            const noiseFilter = ctx.createBiquadFilter();

            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.setValueAtTime(2000 + Math.random() * 3000, ctx.currentTime);

            noiseGain.gain.setValueAtTime(0.1, ctx.currentTime);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(ctx.destination);
            noise.start();
        } catch(e) { console.error('Audio failed', e) }
    };

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
        setAssets(prev => Math.max(0, prev + assetChange));
        if (success) {
            setSafetyScore(prev => prev + pointsAmount);
            // Logic for rank up might go here based on total score
            if (safetyScore + pointsAmount >= 500) {
                setRank('Junior Detective');
            }
        }
        setCurrentLevel(-1); // Return to level selector
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
            adjustLives,
            playTitleCardSound,
            resetProgress
        }}>
            {children}
        </GameStateContext.Provider>
    );
};
