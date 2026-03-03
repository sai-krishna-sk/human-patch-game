import React, { useState, useEffect, useRef } from 'react';
import Player from '../components/Player';
import { useGameState } from '../context/GameStateContext';

const dialogues = [
    {
        speaker: 'PLAYER',
        text: "Hello Grandpa?",
        portrait: '/assets/protagonist.png',
    },
    {
        speaker: 'GRANDPA',
        text: "Hello? ... Is this you? ... My son, it's me. My time has come. Listen carefully, for I won't have long...",
        portrait: '/assets/grandpa.jpg',
    },
    {
        speaker: 'GRANDPA',
        text: "There is... something you must know. The secrets I've kept... they are yours now. Use them well, for the world is full of shadows.",
        portrait: '/assets/grandpa.jpg',
    },
    {
        speaker: 'PLAYER',
        text: "Grandfather? What's happening? Where are you? Please, stay with me!",
        portrait: '/assets/protagonist.png',
    },
    {
        speaker: 'GRANDPA',
        text: "...Find the truth... The shadows... they are moving...",
        portrait: '/assets/grandpa.jpg',
    }
];

const Prologue = () => {
    const { enterLevel } = useGameState();
    const [phase, setPhase] = useState('video'); // 'video' | 'office' | 'dialogue' | 'outside' | 'travel'
    const [dialogueIndex, setDialogueIndex] = useState(0);
    const [showInteractionPrompt, setShowInteractionPrompt] = useState(false);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Outside Phase State
    const [playerPos, setPlayerPos] = useState({ x: 10, y: 82 }); // Percentages
    const [isNearCar, setIsNearCar] = useState(false);
    const [isEnteringCar, setIsEnteringCar] = useState(false);
    const [showMovementHint, setShowMovementHint] = useState(true);

    const videoRef = useRef(null);
    const keysPressed = useRef({});

    // Stable phase/isNearCar refs for use in event listeners without re-attaching
    const phaseRef = useRef(phase);
    const isNearCarRef = useRef(isNearCar);

    useEffect(() => { phaseRef.current = phase; }, [phase]);
    useEffect(() => { isNearCarRef.current = isNearCar; }, [isNearCar]);

    // Handle Video Phase
    const handleVideoEnd = () => setPhase('office');

    // Handle Office Phase Prompt
    useEffect(() => {
        if (phase === 'office') {
            const timer = setTimeout(() => setShowInteractionPrompt(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [phase]);

    // OPTIMIZED: Clean Keyboard Tracking (No re-renders or listener cycling)
    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            keysPressed.current[key] = true;

            // Handle instantaneous interactions
            if (phaseRef.current === 'office' && key === 'e') {
                setPhase('dialogue');
            }
            if (phaseRef.current === 'outside' && key === 'e' && isNearCarRef.current) {
                setIsEnteringCar(true);
                setTimeout(() => setPhase('travel'), 1500);
            }
        };
        const handleKeyUp = (e) => { keysPressed.current[e.key.toLowerCase()] = false; };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // OPTIMIZED: Movement Loop
    useEffect(() => {
        if (phase !== 'outside' || isEnteringCar) return;

        let lastTime = performance.now();
        let frameId;

        const update = (time) => {
            const dt = Math.min(0.1, (time - lastTime) / 1000); // Cap dt to prevent huge jumps
            lastTime = time;

            const keys = keysPressed.current;
            let moveX = 0;
            if (keys['a'] || keys['arrowleft']) moveX -= 1;
            if (keys['d'] || keys['arrowright']) moveX += 1;

            if (moveX !== 0) {
                setShowMovementHint(false);
                setPlayerPos(prev => {
                    const newX = Math.max(5, Math.min(95, prev.x + moveX * 45 * dt));

                    // Check car proximity (car is at 80% X)
                    const distToCar = Math.abs(newX - 80);
                    const near = distToCar < 8;
                    if (near !== isNearCarRef.current) setIsNearCar(near);

                    return { ...prev, x: newX };
                });
            }

            frameId = requestAnimationFrame(update);
        };

        frameId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(frameId);
    }, [phase, isEnteringCar]);

    // Dialogue Typing Effect
    useEffect(() => {
        if (phase !== 'dialogue') return;

        let isMounted = true;
        setDisplayedText('');
        setIsTyping(true);

        const currentText = dialogues[dialogueIndex].text;
        let i = 0;

        const typeChar = () => {
            if (!isMounted) return;
            if (i < currentText.length) {
                setDisplayedText(currentText.substring(0, i + 1));
                i++;
                setTimeout(typeChar, 35);
            } else {
                setIsTyping(false);
            }
        };

        const timer = setTimeout(typeChar, 35);
        return () => { isMounted = false; clearTimeout(timer); };
    }, [phase, dialogueIndex]);

    const handleDialogueInteraction = () => {
        if (isTyping) {
            setDisplayedText(dialogues[dialogueIndex].text);
            setIsTyping(false);
        } else {
            if (dialogueIndex < dialogues.length - 1) {
                setDialogueIndex(prev => prev + 1);
            } else {
                setPhase('outside');
            }
        }
    };

    // World Map Transition
    useEffect(() => {
        if (phase === 'travel') {
            const timer = setTimeout(() => enterLevel(0), 4000);
            return () => clearTimeout(timer);
        }
    }, [phase, enterLevel]);

    // ═══ RENDER ═══

    if (phase === 'video') {
        return (
            <div className="w-screen h-screen bg-black flex items-center justify-center relative overflow-hidden">
                <video ref={videoRef} autoPlay className="w-full h-full object-cover" onEnded={handleVideoEnd}>
                    <source src="/assets/zoom_in.mp4" type="video/mp4" />
                </video>
                <button onClick={handleVideoEnd} className="absolute bottom-8 right-8 px-4 py-2 bg-white/10 hover:bg-white/20 text-white/50 hover:text-white rounded text-xs font-mono uppercase tracking-widest backdrop-blur-sm transition-all z-10">
                    Skip Intro
                </button>
            </div>
        );
    }

    if (phase === 'office') {
        return (
            <div className="w-screen h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden animate-fade-in text-white/90">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url("/assets/office_inside.jpeg")' }} />
                <Player x="49%" y="63%" />
                <div className="absolute top-[52%] left-[40%] animate-phone-vibrate pointer-events-none z-40" style={{ filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.4))' }}>
                    <div className="w-4 h-7 bg-slate-800 rounded-sm border border-slate-700 relative flex flex-col items-center justify-center">
                        <div className="w-full h-full bg-blue-500/20 absolute inset-0 animate-pulse rounded-sm" />
                    </div>
                </div>
                {showInteractionPrompt && (
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-subtle-fade-in z-20">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-950/40 backdrop-blur-sm border border-white/10 rounded-full shadow-2xl">
                            <span className="flex items-center justify-center w-6 h-6 bg-white/10 border border-white/20 rounded text-[10px] font-bold text-white shadow-inner">E</span>
                            <span className="text-white/70 text-sm font-mono tracking-widest uppercase">Answer Incoming Call</span>
                        </div>
                        <div className="w-px h-8 bg-gradient-to-t from-indigo-500/50 to-transparent animate-pulse" />
                    </div>
                )}
            </div>
        );
    }

    if (phase === 'dialogue') {
        const currentDialogue = dialogues[dialogueIndex];
        return (
            <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-end p-8 pb-12 relative overflow-hidden cursor-pointer" onClick={handleDialogueInteraction}>
                <div className="absolute inset-0 bg-cover bg-center blur-md opacity-30 scale-110 grayscale-[0.3]" style={{ backgroundImage: 'url("/assets/office_inside.jpeg")' }} />
                <div className="absolute inset-x-0 top-0 bottom-48 flex items-end justify-between px-24 pointer-events-none">
                    <div className={`transition-all duration-500 transform ${currentDialogue.speaker === 'PLAYER' ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95'}`}>
                        <img src="/assets/protagonist.png" alt="Player" className="h-[500px] object-contain drop-shadow-[0_20px_50px_rgba(79,70,229,0.3)]" />
                    </div>
                    <div className={`transition-all duration-500 transform ${currentDialogue.speaker === 'GRANDPA' ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-100 scale-95 blur-[2px] contrast-75 brightness-75'}`}>
                        <img src="/assets/grandpa.jpg" alt="Grandpa" className="h-[500px] object-contain drop-shadow-[0_20px_50px_rgba(239,68,68,0.3)] scale-x-[-1]" />
                    </div>
                </div>
                <div className="relative z-20 w-full max-w-5xl animate-slide-up">
                    <div className="bg-slate-900/90 backdrop-blur-xl border-4 border-slate-700/50 p-8 rounded-2xl shadow-2xl relative min-h-[160px]">
                        <div className={`absolute -top-6 left-8 px-6 py-2 rounded-t-xl text-xs font-black tracking-[0.2em] uppercase border-x-4 border-t-4 ${currentDialogue.speaker === 'PLAYER' ? 'bg-indigo-600 border-slate-700/50 text-white' : 'bg-red-800 border-slate-700/50 text-red-100'}`}>
                            {currentDialogue.speaker === 'PLAYER' ? 'You' : 'Grandfather'}
                        </div>
                        <div className="text-slate-100 text-xl font-medium leading-relaxed font-mono">
                            <span className="opacity-40 mr-2">"</span>
                            {displayedText}
                            {!isTyping && <span className="animate-pulse ml-1 text-indigo-400">▼</span>}
                            <span className="opacity-40 ml-2">"</span>
                        </div>
                        <div className="absolute bottom-4 right-6 text-[10px] text-slate-500 font-mono uppercase tracking-widest hidden sm:block font-bold">Click to continue</div>
                    </div>
                </div>
            </div>
        );
    }

    if (phase === 'outside') {
        return (
            <div className="w-screen h-screen bg-slate-900 relative overflow-hidden animate-fade-in">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url("/assets/Office_down.jpeg")' }} />
                <div className={`absolute inset-0 bg-black transition-opacity duration-1000 z-50 pointer-events-none ${isEnteringCar ? 'opacity-100' : 'opacity-0'}`} />
                <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                {!isEnteringCar && <Player x={`${playerPos.x}%`} y={`${playerPos.y}%`} />}
                {showMovementHint && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 bg-black/60 backdrop-blur-md p-8 rounded-3xl border border-white/10 animate-pulse">
                        <div className="flex gap-2">
                            {['W', 'A', 'S', 'D'].map(k => <div key={k} className="w-10 h-10 border-2 border-white/30 rounded flex items-center justify-center font-bold text-white">{k}</div>)}
                        </div>
                        <span className="text-white/60 font-mono text-sm tracking-widest uppercase">Walk to the car</span>
                    </div>
                )}
                {isNearCar && !isEnteringCar && (
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-subtle-fade-in z-20">
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-950/40 backdrop-blur-sm border border-white/10 rounded-full shadow-2xl">
                            <span className="flex items-center justify-center w-6 h-6 bg-white/10 border border-white/20 rounded text-[10px] font-bold text-white shadow-inner">E</span>
                            <span className="text-white/70 text-sm font-mono tracking-widest uppercase">Get in Car</span>
                        </div>
                        <div className="w-px h-8 bg-gradient-to-t from-indigo-500/50 to-transparent animate-pulse" />
                    </div>
                )}
            </div>
        );
    }

    if (phase === 'travel') {
        return (
            <div className="w-screen h-screen bg-black flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-cover bg-center animate-zoom-slow" style={{ backgroundImage: 'url("/assets/on the way.png")' }} />
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-transparent to-black/60" />
                <div className="absolute inset-0 bg-indigo-500/5 mix-blend-overlay animate-pulse-slow" />
                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="h-px w-32 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
                    <span className="text-white font-mono text-xs tracking-[0.5em] uppercase opacity-70 animate-tracking-in">Departing for Estate...</span>
                    <div className="h-px w-32 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
                </div>
                <style jsx>{`
                    @keyframes zoom-slow { 0% { transform: scale(1); } 100% { transform: scale(1.1); } }
                    @keyframes tracking-in { 0% { letter-spacing: -0.5em; opacity: 0; } 40% { opacity: 0.6; } 100% { opacity: 0.7; } }
                    .animate-zoom-slow { animation: zoom-slow 10s ease-out forwards; }
                    .animate-tracking-in { animation: tracking-in 3s ease-out forwards; }
                `}</style>
            </div>
        );
    }

    return null;
};

export default Prologue;
