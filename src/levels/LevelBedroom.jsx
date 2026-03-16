import React, { useState, useEffect, useRef } from 'react';
import Player from '../components/Player';
import { useGameState } from '../context/GameStateContext';

const dialogues = [
    {
        speaker: 'GRANDPA',
        text: "Come closer... my child. My eyes... they grow dim, but my heart is full seeing you here.",
        portrait: '/assets/grandpa.jpg',
    },
    {
        speaker: 'PLAYER',
        text: "Grandfather! I'm here. Don't worry, you'll be alright.",
        portrait: '/assets/protagonist.png',
    },
    {
        speaker: 'GRANDPA',
        text: "No... do not weep. My time has come to join the ancestors. But before I go, there is something you must have.",
        portrait: '/assets/grandpa.jpg',
    },
    {
        speaker: 'GRANDPA',
        text: "I have lived a long life, and I have saved... something for your future. Use it to build, to protect, and to find the truth.",
        portrait: '/assets/grandpa.jpg',
    },
    {
        speaker: 'GRANDPA',
        text: "I am transferring the family trust to you. 42 Lakhs... it is a heavy burden, but I know you are ready.",
        portrait: '/assets/grandpa.jpg',
    },
    {
        speaker: 'PLAYER',
        text: "Grandfather... I don't know what to say. I'll make you proud.",
        portrait: '/assets/protagonist.png',
    },
    {
        speaker: 'GRANDPA',
        text: "You already have. Now... let me rest. The shadows... they are finally at peace.",
        portrait: '/assets/grandpa.jpg',
    }
];

const LevelBedroom = () => {
    const { enterLevel, adjustAssets } = useGameState();
    const [phase, setPhase] = useState('walking'); // 'walking' | 'dialogue' | 'reward'
    const [dialogueIndex, setDialogueIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Movement State
    const [playerPos, setPlayerPos] = useState({ x: 50, y: 80 }); // Percentages
    const [keys, setKeys] = useState({});
    const [interactionActive, setInteractionActive] = useState(false);

    const keysPressed = useRef({});
    const playerDOMRef = useRef(null);
    const playerCompRef = useRef(null);
    const playerPosRef = useRef({ x: 50, y: 80 });

    // Handle Keyboard
    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            keysPressed.current[key] = true;
            setKeys(prev => ({ ...prev, [key]: true }));
        };
        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase();
            keysPressed.current[key] = false;
            setKeys(prev => ({ ...prev, [key]: false }));
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Movement Loop
    useEffect(() => {
        if (phase !== 'walking') return;

        let lastTime = performance.now();
        let frameId;

        const update = (time) => {
            const dt = Math.min(0.1, (time - lastTime) / 1000);
            lastTime = time;

            const speed = 65;
            let moveX = 0;
            let moveY = 0;
            const keys = keysPressed.current;

            if (keys['w'] || keys['arrowup']) moveY -= 1;
            if (keys['s'] || keys['arrowdown']) moveY += 1;
            if (keys['a'] || keys['arrowleft']) moveX -= 1;
            if (keys['d'] || keys['arrowright']) moveX += 1;

            if (moveX !== 0 || moveY !== 0) {
                const prev = playerPosRef.current;
                const newX = Math.max(10, Math.min(90, prev.x + moveX * speed * dt));
                const newY = Math.max(20, Math.min(90, prev.y + moveY * speed * dt));
                playerPosRef.current = { x: newX, y: newY };

                if (playerDOMRef.current) {
                    playerDOMRef.current.style.left = `${newX}%`;
                    playerDOMRef.current.style.top = `${newY}%`;
                }

                if (playerCompRef.current) {
                    playerCompRef.current.setMoving(true);
                    if (moveX !== 0) playerCompRef.current.setFacing(moveX > 0 ? 'right' : 'left');
                }
            } else {
                if (playerCompRef.current) playerCompRef.current.setMoving(false);
            }

            // Proximity check - Moved outside movement conditional
            const nx = playerPosRef.current.x;
            const ny = playerPosRef.current.y;
            const distToBed = Math.sqrt(Math.pow(nx - 50, 2) + Math.pow(ny - 55, 2));
            const near = distToBed < 15;
            setInteractionActive(near);

            if (near && keysPressed.current['e']) {
                setPhase('dialogue');
            }

            frameId = requestAnimationFrame(update);
        };

        frameId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(frameId);
    }, [phase]);

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

    // Key-based interaction for dialogue advancement
    useEffect(() => {
        if (phase !== 'dialogue') return;
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            if (key === 'e' || key === ' ' || key === 'enter') {
                handleDialogueInteraction();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [phase, dialogueIndex, isTyping]);

    const handleDialogueInteraction = () => {
        if (isTyping) {
            setDisplayedText(dialogues[dialogueIndex].text);
            setIsTyping(false);
        } else {
            if (dialogueIndex < dialogues.length - 1) {
                setDialogueIndex(prev => prev + 1);
            } else {
                setPhase('reward');
                // Give 42L
                adjustAssets(4200000);
                setTimeout(() => {
                    enterLevel(1); // To Level 1
                }, 5000);
            }
        }
    };

    // ═══ RENDER ═══
    return (
        <div className="w-screen h-screen bg-black flex items-center justify-center relative overflow-hidden font-mono">
            {/* Background Image */}
            <div
                className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ${phase === 'dialogue' ? 'scale-110 blur-sm opacity-50' : 'scale-100 opacity-100'}`}
                style={{ backgroundImage: 'url("/assets/bedroom.png")' }}
            />

            {/* Vignette Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]"></div>

            {/* Player Rendering */}
            {phase === 'walking' && (
                <div
                    ref={playerDOMRef}
                    className="absolute transition-all duration-75 ease-out z-20"
                    style={{ left: '50%', top: '80%', transform: 'translate(-50%, -50%)' }}
                >
                    <Player ref={playerCompRef} x={0} y={0} isFixed={true} />
                </div>
            )}

            {/* Interaction Prompt */}
            {phase === 'walking' && interactionActive && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full flex items-center gap-3 animate-bounce shadow-2xl">
                        <span className="w-6 h-6 bg-white text-black rounded flex items-center justify-center font-black text-xs">E</span>
                        <span className="text-white text-xs font-black tracking-widest uppercase text-shadow-glow">Talk to Grandfather</span>
                    </div>
                </div>
            )}

            {/* Objective Hint */}
            {phase === 'walking' && !interactionActive && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30">
                    <div className="bg-slate-950/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl flex items-center gap-4">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-white/70 text-[10px] font-black tracking-[0.3em] uppercase">Approach the Bed</span>
                    </div>
                </div>
            )}

            {/* Dialogue UI */}
            {phase === 'dialogue' && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-end p-12 pb-24 cursor-pointer" onClick={handleDialogueInteraction}>
                    <div className="absolute inset-x-0 top-0 bottom-64 flex items-end justify-between px-32 pointer-events-none">
                        <div className={`transition-all duration-700 transform ${dialogues[dialogueIndex].speaker === 'PLAYER' ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95'}`}>
                            <img src="/assets/protagonist.png" alt="Player" className="h-[600px] object-contain drop-shadow-[0_20px_50px_rgba(79,70,229,0.4)]" />
                        </div>
                        <div className={`transition-all duration-700 transform ${dialogues[dialogueIndex].speaker === 'GRANDPA' ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95'}`}>
                            <img src="/assets/grandpa.jpg" alt="Grandpa" className="h-[600px] object-contain drop-shadow-[0_20px_50px_rgba(239,68,68,0.4)] scale-x-[-1]" />
                        </div>
                    </div>

                    <div className="relative w-full max-w-5xl animate-fade-in-up">
                        <div className="bg-slate-900/90 backdrop-blur-2xl border-4 border-slate-700/50 p-10 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
                            <div className={`absolute -top-6 left-10 px-8 py-2 rounded-xl text-xs font-black tracking-[0.3em] uppercase border-4 ${dialogues[dialogueIndex].speaker === 'PLAYER' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-red-800 border-red-700 text-red-100'}`}>
                                {dialogues[dialogueIndex].speaker === 'PLAYER' ? 'Successor' : 'Old Man'}
                            </div>
                            <div className="text-slate-100 text-2xl font-medium leading-relaxed italic">
                                "{displayedText}"
                                {!isTyping && <span className="animate-pulse ml-2 text-cyan-400 font-black">▼</span>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Reward Notification */}
            {phase === 'reward' && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 animate-fade-in">
                    <div className="flex flex-col items-center gap-8 text-center animate-zoom-in">
                        <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.5)] border-4 border-emerald-300">
                            <span className="text-6xl text-white">₹</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <h2 className="text-emerald-400 text-5xl font-black tracking-tighter uppercase italic">Legacy Transferred</h2>
                            <p className="text-white/60 text-xl font-mono">Family Trust: ₹4,200,000</p>
                        </div>
                        <div className="h-px w-64 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
                        <p className="text-white/40 text-xs font-black tracking-[0.5em] uppercase animate-pulse">Returning to Sector_04...</p>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.5s ease-out forwards; }
                .animate-zoom-in { animation: zoom-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
                @keyframes zoom-in { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
            ` }} />
        </div>
    );
};

export default LevelBedroom;
