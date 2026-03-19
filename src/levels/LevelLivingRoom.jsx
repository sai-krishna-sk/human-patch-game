import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '../context/GameStateContext';
import Player from '../components/Player';
import InteractionPrompt from '../components/InteractionPrompt';

const dialogues = [
    {
        speaker: 'GRANDPA',
        text: "You're finally here! Good. I don't have much time, my taxi to the airport arrives in ten minutes.",
        portrait: '/assets/grandstudy.jpg',
    },
    {
        speaker: 'PLAYER',
        text: "You really are going, aren't you? Hawaii... that's halfway across the world!",
        portrait: '/assets/protagonist.png',
    },
    {
        speaker: 'GRANDPA',
        text: "It's a long overdue vacation, my boy. But I can't leave my affairs in just anyone's hands.",
        portrait: '/assets/grandstudy.jpg',
    },
    {
        speaker: 'GRANDPA',
        text: "I've left 42 Lakhs in your care. This is a test. The digital world is full of vultures waiting to pick you clean.",
        portrait: '/assets/grandstudy.jpg',
    },
    {
        speaker: 'GRANDPA',
        text: "Protect this money. Show me you have the discipline and the wisdom to survive. If you can keep this safe until I return, my entire empire will be yours.",
        portrait: '/assets/grandstudy.jpg',
    },
    {
        speaker: 'PLAYER',
        text: "I won't let you down, Grandfather! I'll be vigilant. Enjoy your trip!",
        portrait: '/assets/protagonist.png',
    },
    {
        speaker: 'GRANDPA',
        text: "That's my son. Now, I must go. Remember—don't trust anyone who calls you out of the blue. The world is changing...",
        portrait: '/assets/grandstudy.jpg',
    }
];

const LevelLivingRoom = () => {
    const { enterLevel, adjustAssets } = useGameState();

    const VIEWPORT_WIDTH = 1200;
    const VIEWPORT_HEIGHT = 800;
    const ROOM_WIDTH = 1600;
    const ROOM_HEIGHT = 1100;

    // ═══ STATE ═══
    const [phase, setPhase] = useState('walking_living'); // 'walking_living' | 'walking_study' | 'dialogue' | 'reward'
    const [dialogueIndex, setDialogueIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [playerPos, setPlayerPos] = useState({ x: 800, y: 150 });
    const keysRef = useRef({});
    const playerCompRef = useRef(null);
    const [interactionTarget, setInteractionTarget] = useState(null);
    const [feedbackMsg, setFeedbackMsg] = useState(null);

    const showMessage = (msg) => {
        setFeedbackMsg(msg);
        setTimeout(() => setFeedbackMsg(null), 3000);
    };

    // ═══ MOVEMENT LOGIC ═══
    useEffect(() => {
        const handleKeyDown = (e) => { keysRef.current[e.key.toLowerCase()] = true; };
        const handleKeyUp = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useEffect(() => {
        let animationFrameId;
        const SPEED = 12;

        const gameLoop = () => {
            if (phase !== 'walking_living' && phase !== 'walking_study') {
                if (playerCompRef.current) playerCompRef.current.setMoving(false);
                return;
            }

            const keys = keysRef.current;
            
            setPlayerPos(prev => {
                let newX = prev.x;
                let newY = prev.y;

                if (keys['w'] || keys['arrowup']) newY -= SPEED;
                if (keys['s'] || keys['arrowdown']) newY += SPEED;
                if (keys['a'] || keys['arrowleft']) newX -= SPEED;
                if (keys['d'] || keys['arrowright']) newX += SPEED;

                // Boundaries
                const margin = 120;
                newX = Math.max(margin, Math.min(newX, ROOM_WIDTH - margin));
                
                // Special boundary for study room bottom door
                if (phase === 'walking_study') {
                   newY = Math.max(margin, Math.min(newY, ROOM_HEIGHT - 50)); 
                } else {
                   newY = Math.max(margin, Math.min(newY, ROOM_HEIGHT - margin));
                }

                const moved = newX !== prev.x || newY !== prev.y;
                
                if (playerCompRef.current) {
                    playerCompRef.current.setMoving(moved);
                    if (newX !== prev.x) playerCompRef.current.setFacing(newX > prev.x ? 'right' : 'left');
                }

                // Interaction Checks
                if (phase === 'walking_living') {
                    const isNearRightDoor = newX > ROOM_WIDTH - 200 && Math.abs(newY - ROOM_HEIGHT / 2) < 150;
                    setInteractionTarget(isNearRightDoor ? 'room_door' : null);
                    if (isNearRightDoor && keys['e']) {
                        setPhase('walking_study');
                        return { x: 800, y: 950 };
                    }
                } else if (phase === 'walking_study') {
                    const nearGrandpa = Math.abs(newX - 800) < 120 && Math.abs(newY - 600) < 120;

                    setInteractionTarget(nearGrandpa ? 'grandpa' : null);

                    if (keys['e'] && nearGrandpa) {
                        setPhase('dialogue');
                    }
                }

                return { x: newX, y: newY };
            });

            animationFrameId = requestAnimationFrame(gameLoop);
        };
        animationFrameId = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animationFrameId);
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

    const handleDialogueInteraction = () => {
        if (isTyping) {
            setDisplayedText(dialogues[dialogueIndex].text);
            setIsTyping(false);
        } else {
            if (dialogueIndex < dialogues.length - 1) {
                setDialogueIndex(prev => prev + 1);
            } else {
                setPhase('reward');
                adjustAssets(4200000);
                setTimeout(() => {
                    enterLevel(1);
                }, 5000);
            }
        }
    };

    // ═══ RENDER ═══

    const cameraX = (phase === 'walking_living' || phase === 'walking_study' || phase === 'dialogue')
        ? Math.max(0, Math.min(playerPos.x - VIEWPORT_WIDTH / 2, ROOM_WIDTH - VIEWPORT_WIDTH))
        : 0;
    const cameraY = (phase === 'walking_living' || phase === 'walking_study' || phase === 'dialogue')
        ? Math.max(0, Math.min(playerPos.y - VIEWPORT_HEIGHT / 2, ROOM_HEIGHT - VIEWPORT_HEIGHT))
        : 0;

    return (
        <div className="w-full h-full flex items-center justify-center bg-[#0f172a] px-8 animate-in fade-in duration-1000 font-mono">
            {/* Viewport Container */}
            <div
                className="relative border-8 border-zinc-800 shadow-2xl overflow-hidden bg-slate-900"
                style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}
            >
                {/* World Container (Camera) */}
                <div
                    className="absolute inset-0 transition-transform duration-100 ease-out"
                    style={{
                        width: ROOM_WIDTH, // Always ROOM_WIDTH for scrolling
                        height: ROOM_HEIGHT, // Always ROOM_HEIGHT for scrolling
                        transform: `translate(${-cameraX}px, ${-cameraY}px)`,
                        // backgroundColor: '#2c3e50' // Removed, handled by Background Container
                    }}
                >
                    {/* Background Container */}
                    <div 
                        className="absolute inset-0 transition-opacity duration-1000"
                        style={{
                            width: ROOM_WIDTH,
                            height: ROOM_HEIGHT,
                            backgroundImage: phase === 'walking_living' ? "none" : "url('/assets/roomwithgrandpa.png')",
                            backgroundSize: phase === 'walking_study' ? 'cover' : '100% 100%',
                            backgroundPosition: 'center',
                            backgroundColor: phase === 'walking_living' ? '#2c3e50' : '#1a1a1a',
                        }}
                    >
                        {/* Cinematic Lighting Vignette (Level 2 Style) */}
                        {phase === 'walking_study' && (
                            <div className="absolute inset-0 pointer-events-none z-50 bg-radial-vignette opacity-60"></div>
                        )}

                        {/* Living Room CSS Art (Only if in living room) */}
                        {phase === 'walking_living' && (
                            <>
                                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                                <div className="absolute bottom-60 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-slate-800/30 rounded-[50%] blur-3xl -z-10" />
                            </>
                        )}
                    </div>

                    {phase === 'walking_living' && ( // Only render living room elements if in living room phase
                        <>
                            {/* Wood Floor */}
                            <div className="absolute inset-0 opacity-80" style={{
                                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(0,0,0,0.2) 38px, rgba(0,0,0,0.2) 40px)'
                            }}></div>

                            {/* DOORS AND OPENINGS */}
                            {/* Top Double Door (Entrance from Garden) */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[240px] h-[80px] bg-[#8a5a44] border-4 border-black border-t-0 flex z-10">
                                <div className="flex-1 border-r-2 border-black p-2 flex items-center justify-center">
                                    <div className="w-[80px] h-[50px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                                </div>
                                <div className="flex-1 border-l-2 border-black p-2 flex items-center justify-center">
                                    <div className="w-[80px] h-[50px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                                </div>
                            </div>

                            {/* Bottom Door (Grounded/Inactive for now) */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[240px] h-[80px] bg-[#8a5a44] border-4 border-black border-b-0 flex z-10 opacity-50">
                                <div className="flex-1 border-r-2 border-black p-2 flex items-center justify-center">
                                    <div className="w-[80px] h-[50px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                                </div>
                            </div>

                            {/* Right Single Door (Interactive - Entrance to Study) */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[60px] h-[180px] bg-[#8a5a44] border-4 border-black border-r-0 p-3 flex items-center z-10">
                                <div className="w-[30px] h-[140px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                                {interactionTarget === 'room_door' && ( // Changed interactionActive to interactionTarget
                                    <div className="absolute inset-0 bg-cyan-400/20 animate-pulse pointer-events-none"></div>
                                )}
                            </div>

                            {/* RUGS */}
                            <div className="absolute left-[180px] right-[120px] top-1/2 -translate-y-1/2 h-[260px] bg-[#cb3234] border-y-2 border-black z-0"></div>
                            <div className="absolute top-[80px] bottom-[80px] left-1/2 -translate-x-1/2 w-[260px] bg-[#cb3234] border-x-2 border-black z-0"></div>

                            {/* SOFA */}
                            <div className="absolute right-[480px] top-1/2 -translate-y-1/2 w-[140px] h-[320px] bg-[#445265] border-4 border-black z-20 shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
                                <div className="absolute right-0 top-0 bottom-0 w-[40px] bg-[#4a586e] border-l-[3px] border-black"></div>
                                <div className="absolute top-0 left-0 w-[100px] h-[30px] bg-[#4a586e] border-b-[3px] border-black"></div>
                                <div className="absolute bottom-0 left-0 w-[100px] h-[30px] bg-[#4a586e] border-t-[3px] border-black"></div>
                            </div>

                            {/* COFFEE TABLE */}
                            <div className="absolute left-[740px] top-1/2 -translate-y-1/2 w-[100px] h-[180px] bg-[#383a48]/90 backdrop-blur-md border-4 border-[#222938] z-20 shadow-xl"></div>

                            {/* TV UNIT */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[180px] h-[340px] bg-[#222938] border-4 border-l-0 border-black z-20 flex items-center">
                                <div className="w-[120px] h-[260px] bg-[#1e4868] border-4 border-[#122336] ml-4 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
                                </div>
                            </div>

                            {/* MISSION HINT */}
                            {interactionTarget !== 'room_door' && (
                                <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                                    <div className="bg-slate-950/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl flex items-center gap-4">
                                        <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                                        <span className="text-white/70 text-[10px] font-black tracking-[0.3em] uppercase">Objective: Find Grandpa in the Study</span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}



                    {/* PLAYER */}
                    <div className="absolute z-40" style={{ left: playerPos.x, top: playerPos.y, transform: 'translate(-50%, -50%)', willChange: 'transform' }}>
                        <Player ref={playerCompRef} x={0} y={0} isFixed={true} />
                    </div>
                </div>

                {/* --- HUD LAYER (Fixed relative to viewport) --- */}

                {/* Interaction Prompts (Outside camera, inside viewport) */}
                {phase === 'walking_living' && interactionTarget === 'room_door' && (
                    <InteractionPrompt text="Press E to Enter Study Room" />
                )}
                {phase === 'walking_study' && interactionTarget === 'grandpa' && (
                    <InteractionPrompt text="Press E to Talk to Grandfather" />
                )}

                {/* Feedback Overlay (Level 2 Style) */}
                {feedbackMsg && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[4000] animate-in slide-in-from-top duration-500">
                        <div className="bg-slate-900/90 text-white px-8 py-4 rounded-xl shadow-2xl font-bold text-xs uppercase tracking-widest border border-white/10 backdrop-blur-md">
                            {feedbackMsg}
                        </div>
                    </div>
                )}

                {/* Dialogue UI */}
                {phase === 'dialogue' && (
                    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-end p-8 pb-12 cursor-pointer bg-black/40 backdrop-blur-sm" onClick={handleDialogueInteraction}>
                        {/* Portrait Container - Ensures characters are grounded and fully visible */}
                        <div className="absolute inset-x-0 bottom-0 top-0 flex items-end justify-between px-12 pb-48 pointer-events-none overflow-visible">
                            <div className={`transition-all duration-700 transform ${dialogues[dialogueIndex].speaker === 'PLAYER' ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0'}`} style={{ width: '40%' }}>
                                <img src="/assets/protagonist.png" alt="Player" className="w-full h-auto max-h-[550px] object-contain drop-shadow-[0_20px_50px_rgba(79,70,229,0.4)]" />
                            </div>
                            <div className={`transition-all duration-700 transform ${dialogues[dialogueIndex].speaker === 'GRANDPA' ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0'}`} style={{ width: '40%' }}>
                                <img src="/assets/grandstudy.jpg" alt="Grandpa" className="w-full h-auto max-h-[550px] object-contain drop-shadow-[0_20px_50px_rgba(239,68,68,0.4)] scale-x-[-1]" />
                            </div>
                        </div>

                        {/* Dialogue Box */}
                        <div className="relative w-full max-w-4xl animate-in fade-in slide-in-from-bottom-5 duration-500 z-10">
                            <div className="bg-slate-900/95 border-4 border-slate-700 px-8 py-6 rounded-2xl shadow-2xl">
                                <div className={`absolute -top-4 left-6 px-4 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase border-2 ${dialogues[dialogueIndex].speaker === 'PLAYER' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-red-800 border-red-700 text-red-100'}`}>
                                    {dialogues[dialogueIndex].speaker === 'PLAYER' ? 'You' : 'Grandfather'}
                                </div>
                                <div className="text-slate-100 text-lg font-medium leading-relaxed italic">
                                    "{displayedText}"
                                    {!isTyping && <span className="animate-pulse ml-2 text-cyan-400 font-black">▼</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reward Notification */}
                {phase === 'reward' && (
                    <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/95 animate-in fade-in duration-1000">
                        <div className="flex flex-col items-center gap-8 text-center animate-in zoom-in duration-700">
                            <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.5)] border-4 border-emerald-300">
                                <span className="text-6xl text-white font-black">42L</span>
                            </div>
                            <div className="flex flex-col gap-2">
                                <h2 className="text-emerald-400 text-5xl font-black tracking-tighter uppercase italic">Assets Entrusted</h2>
                                <p className="text-white/60 text-xl font-mono">Mission: Protect the 42 Lakhs</p>
                            </div>
                            <div className="h-px w-64 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
                            <p className="text-white/40 text-[10px] font-black tracking-[0.5em] uppercase animate-pulse">Grandpa is heading to the airport...</p>
                        </div>
                    </div>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .bg-radial-vignette {
                    background: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 100%);
                }
            ` }} />
        </div>
    );
};

export default LevelLivingRoom;
