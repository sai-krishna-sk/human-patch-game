import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '../context/GameStateContext';
import Player from '../components/Player';

const LevelLivingRoom = () => {
    const { enterLevel } = useGameState();

    // ═══ STATE ═══
    const [playerPos, setPlayerPos] = useState({ x: 800, y: 150 });
    const keysRef = useRef({}); // Renamed to keysPressed in the instruction, but keeping keysRef as it's used consistently below
    const playerDOMRef = useRef(null);
    const playerCompRef = useRef(null);
    const posRef = useRef({ x: 800, y: 150 });
    const [interactionActive, setInteractionActive] = useState(false);

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
        const speed = 12; // Matched exactly to Level 2
        const ROOM_WIDTH = 1600;
        const ROOM_HEIGHT = 1100;

        const gameLoop = () => {
            const keys = keysRef.current;
            const prev = posRef.current;
            let newX = prev.x;
            let newY = prev.y;

            if (keys['w'] || keys['arrowup']) newY -= speed;
            if (keys['s'] || keys['arrowdown']) newY += speed;
            if (keys['a'] || keys['arrowleft']) newX -= speed;
            if (keys['d'] || keys['arrowright']) newX += speed;

            // Simple boundaries matching the room walls
            newX = Math.max(120, Math.min(newX, ROOM_WIDTH - 120));
            newY = Math.max(120, Math.min(newY, ROOM_HEIGHT - 120));

            if (newX !== prev.x || newY !== prev.y) {
                posRef.current = { x: newX, y: newY };
                setPlayerPos({ x: newX, y: newY }); // Update state for camera

                if (playerDOMRef.current) {
                    playerDOMRef.current.style.left = `${newX}px`;
                    playerDOMRef.current.style.top = `${newY}px`;
                }

                if (playerCompRef.current) {
                    playerCompRef.current.setMoving(true);
                    if (newX !== prev.x) playerCompRef.current.setFacing(newX > prev.x ? 'right' : 'left');
                }
            } else {
                if (playerCompRef.current) playerCompRef.current.setMoving(false);
            }

            // Bed Door Interaction (Bottom Door area) - Moved outside movement conditional
            const currentX = posRef.current.x;
            const currentY = posRef.current.y;
            const nearBottomDoor = Math.abs(currentX - 800) < 150 && currentY > 940;
            setInteractionActive(nearBottomDoor);

            if (nearBottomDoor && keys['e']) {
                enterLevel('bedroom');
            }

            animationFrameId = requestAnimationFrame(gameLoop);
        };
        animationFrameId = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [enterLevel]);

    // ═══ RENDER ═══
    const VIEWPORT_WIDTH = 1200;
    const VIEWPORT_HEIGHT = 800;
    const ROOM_WIDTH = 1600;
    const ROOM_HEIGHT = 1100;

    const cameraX = Math.max(0, Math.min(playerPos.x - VIEWPORT_WIDTH / 2, ROOM_WIDTH - VIEWPORT_WIDTH));
    const cameraY = Math.max(0, Math.min(playerPos.y - VIEWPORT_HEIGHT / 2, ROOM_HEIGHT - VIEWPORT_HEIGHT));

    return (
        <div className="w-full h-full flex items-center justify-center bg-zinc-950 px-8 animate-in fade-in duration-1000 font-mono">
            {/* Viewport Container */}
            <div
                className="relative border-8 border-slate-900 shadow-2xl overflow-hidden bg-zinc-900"
                style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}
            >
                {/* World Container (Camera) */}
                <div
                    className="absolute inset-0 transition-transform duration-100 ease-out"
                    style={{
                        width: ROOM_WIDTH,
                        height: ROOM_HEIGHT,
                        transform: `translate(${-cameraX}px, ${-cameraY}px)`,
                        backgroundColor: '#2c3e50'
                    }}
                >
                    {/* Wood Floor */}
                    <div className="absolute inset-0 opacity-80" style={{
                        backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(0,0,0,0.2) 38px, rgba(0,0,0,0.2) 40px)'
                    }}></div>

                    {/* DOORS AND OPENINGS */}
                    {/* Top Double Door */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[240px] h-[80px] bg-[#8a5a44] border-4 border-black border-t-0 flex z-10">
                        <div className="flex-1 border-r-2 border-black p-2 flex items-center justify-center">
                            <div className="w-[80px] h-[50px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                        </div>
                        <div className="flex-1 border-l-2 border-black p-2 flex items-center justify-center">
                            <div className="w-[80px] h-[50px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                        </div>
                    </div>

                    {/* Bottom Door */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[240px] h-[80px] bg-[#8a5a44] border-4 border-black border-b-0 flex z-10">
                        <div className="flex-1 border-r-2 border-black p-2 flex items-center justify-center">
                            <div className="w-[80px] h-[50px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                        </div>
                        <div className="flex-1 border-l-2 border-black p-2 flex items-center justify-center">
                            <div className="w-[80px] h-[50px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                        </div>
                        {/* Interactive Sparkle for the door */}
                        {interactionActive && (
                            <div className="absolute inset-0 bg-cyan-400/20 animate-pulse pointer-events-none"></div>
                        )}
                    </div>

                    {/* Right Single Door */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[60px] h-[180px] bg-[#8a5a44] border-4 border-black border-r-0 p-3 flex items-center z-10">
                        <div className="w-[30px] h-[140px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
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

                    {/* LAMPS */}
                    <div className="absolute right-[410px] top-[330px] w-[50px] h-[50px] bg-[#383a48] border-2 border-black flex items-center justify-center z-10">
                        <div className="w-6 h-6 bg-[#d98536] rounded-full animate-pulse shadow-[0_0_20px_#ffeb3b]"></div>
                    </div>
                    <div className="absolute right-[410px] bottom-[330px] w-[50px] h-[50px] bg-[#383a48] border-2 border-black flex items-center justify-center z-10">
                        <div className="w-6 h-6 bg-[#d98536] rounded-full animate-pulse shadow-[0_0_20px_#ffeb3b]"></div>
                    </div>

                    {/* TV UNIT */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[180px] h-[340px] bg-[#222938] border-4 border-l-0 border-black z-20 flex items-center">
                        <div className="w-[120px] h-[260px] bg-[#1e4868] border-4 border-[#122336] ml-4 relative overflow-hidden">
                            <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
                        </div>
                    </div>

                    {/* PLANTS */}
                    <div className="absolute left-[30px] top-[140px] w-[60px] h-[60px] bg-[#1d273a] rounded-full border-[3px] border-black flex items-center justify-center">
                        <div className="w-[44px] h-[44px] rounded-full bg-[#1b2f4f]"></div>
                    </div>
                    <div className="absolute right-[30px] top-[140px] w-[60px] h-[60px] bg-[#1d273a] rounded-full border-[3px] border-black flex items-center justify-center">
                        <div className="w-[44px] h-[44px] rounded-full bg-[#1b2f4f]"></div>
                    </div>

                    {/* INTERACTION HINT */}
                    {interactionActive && (
                        <div className="absolute z-50 pointer-events-none" style={{ left: playerPos.x, top: playerPos.y - 60 }}>
                            <div className="bg-white text-slate-900 px-4 py-2 rounded-full shadow-2xl border-2 border-cyan-500 font-black text-xs tracking-widest uppercase whitespace-nowrap animate-bounce flex items-center gap-2">
                                <span className="w-5 h-5 flex items-center justify-center bg-slate-900 text-white rounded text-[10px]">E</span>
                                Enter Master Bedroom
                            </div>
                        </div>
                    )}

                    {/* General Mission Hint */}
                    {!interactionActive && (
                        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                            <div className="bg-slate-950/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl flex items-center gap-4">
                                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                                <span className="text-white/70 text-[10px] font-black tracking-[0.3em] uppercase">Objective: Go to your grandfather</span>
                            </div>
                        </div>
                    )}

                    {/* PLAYER */}
                    <div ref={playerDOMRef} className="absolute z-40" style={{ left: 800, top: 150, transform: 'translate(-50%, -50%)' }}>
                        <Player ref={playerCompRef} x={0} y={0} isFixed={true} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LevelLivingRoom;
