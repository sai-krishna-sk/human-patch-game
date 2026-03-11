import React, { useState, useEffect, useCallback, useRef } from 'react';

const TIPS = [
    { title: "Offline Backup", text: "Maintain regular, encrypted backups that are disconnected from your main network. If ransomware strikes, you can restore your data without paying." },
    { title: "Disconnect", text: "If you suspect a ransomware infection, immediately disconnect the device from the network (unplug the ethernet cable, turn off Wi-Fi) to stop it from spreading." },
    { title: "Don't Pay", text: "Paying the ransom does not guarantee you'll get your data back, and it funds future criminal activities." },
    { title: "Updates", text: "Keep your operating system and software updated. Many ransomware strains exploit known vulnerabilities that have already been patched." },
    { title: "Verify Links", text: "Never click on suspicious links or download unexpected attachments in emails. This is a primary vector for ransomware delivery." }
];

// Redesigned level layout for achievable jumps
const INITIAL_PLATFORMS = [
    { x: 0, y: 550, w: 800, h: 60, type: 'ground' }, // Floor
    { x: 100, y: 430, w: 160, h: 20 },
    { x: 400, y: 350, w: 160, h: 20 },
    { x: 200, y: 230, w: 160, h: 20 },
    { x: 500, y: 110, w: 160, h: 20, vx: 2, minX: 350, maxX: 600 }, // Moving platform
    { x: 200, y: -10, w: 160, h: 20 },
    { x: 450, y: -130, w: 250, h: 20 },     // Checkpoint 1

    { x: 150, y: -250, w: 160, h: 20 },
    { x: 300, y: -370, w: 120, h: 20, vx: -2.5, minX: 100, maxX: 450 }, // Moving platform
    { x: 600, y: -490, w: 160, h: 20 },
    { x: 250, y: -610, w: 160, h: 20 },
    { x: 500, y: -730, w: 250, h: 20 },    // Checkpoint 2

    { x: 200, y: -850, w: 120, h: 20, vx: 3, minX: 100, maxX: 400 }, // Fast moving
    { x: 550, y: -970, w: 120, h: 20 },
    { x: 250, y: -1090, w: 300, h: 20 },    // Checkpoint 3

    { x: 100, y: -1210, w: 120, h: 20 },
    { x: 400, y: -1330, w: 120, h: 20, vx: -3, minX: 250, maxX: 650 },
    { x: 650, y: -1450, w: 120, h: 20 },
    { x: 300, y: -1570, w: 350, h: 20 },   // Checkpoint 4

    { x: 150, y: -1690, w: 120, h: 20 },
    { x: 350, y: -1810, w: 400, h: 20 },   // Top Goal
];

const INITIAL_OBSTACLES = [
    { id: 1, x: 450, y: 310, w: 40, h: 40, type: 'ransomware', active: true },
    { id: 2, x: 250, y: 190, w: 40, h: 40, type: 'ransomware', active: true },
    { id: 3, x: 650, y: -530, w: 40, h: 40, type: 'phishing', active: true },
    { id: 4, x: 300, y: -650, w: 40, h: 40, type: 'ransomware', active: true },
    { id: 5, x: 580, y: -1010, w: 40, h: 40, type: 'ransomware', active: true },
    { id: 6, x: 680, y: -1490, w: 40, h: 40, type: 'phishing', active: true },
    { id: 7, x: 180, y: -1730, w: 40, h: 40, type: 'ransomware', active: true },
];

const INITIAL_SHIELDS = [
    { id: 1, x: 550, y: -180, w: 40, h: 40, collected: false }, // Checkpoint 1
    { id: 2, x: 600, y: -780, w: 40, h: 40, collected: false }, // Checkpoint 2
    { id: 3, x: 400, y: -1140, w: 40, h: 40, collected: false }, // Checkpoint 3
    { id: 4, x: 450, y: -1620, w: 40, h: 40, collected: false }, // Checkpoint 4
    { id: 5, x: 500, y: -1860, w: 40, h: 40, collected: false }, // Final shield
];

const SERVER_TOWERS = [
    { x: 20, w: 180, color: 'from-cyan-900/40' },
    { x: 250, w: 80, color: 'from-indigo-900/30' },
    { x: 380, w: 140, color: 'from-emerald-900/30' },
    { x: 600, w: 180, color: 'from-blue-900/40' },
];


// --- SVG COMPONENTS FOR PREMIUM GRAPHICS ---

const PlayerDroneSVG = ({ isGrounded, vx }) => (
    <div className={`w-full h-full relative transition-transform ${vx < 0 ? 'scale-x-[-1]' : ''}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(52,211,153,0.8)] overflow-visible">
            {/* Drone Hull */}
            <path d="M 20 30 L 80 30 L 90 50 L 80 70 L 20 70 L 10 50 Z" fill="#064e3b" stroke="#34d399" strokeWidth="3" />
            <path d="M 25 35 L 75 35 L 82 50 L 75 65 L 25 65 L 18 50 Z" fill="#0f172a" />

            {/* Engine Glow */}
            <rect x="35" y="45" width="30" height="10" rx="5" fill="#a7f3d0" className="animate-pulse" />

            {/* Wings / Stabilizers */}
            <path d="M 20 30 L 10 15 L 30 30 Z" fill="#047857" />
            <path d="M 80 30 L 90 15 L 70 30 Z" fill="#047857" />
            <path d="M 20 70 L 10 85 L 30 70 Z" fill="#047857" />
            <path d="M 80 70 L 90 85 L 70 70 Z" fill="#047857" />

            {/* Front Eye / Sensor */}
            <circle cx="85" cy="50" r="4" fill="#6ee7b7" className="animate-pulse" />

            {/* Thruster Flames (only when jumping or falling fast) */}
            {!isGrounded && (
                <g className="animate-pulse">
                    <polygon points="25,70 15,95 35,70" fill="#34d399" opacity="0.8" />
                    <polygon points="75,70 65,95 85,70" fill="#34d399" opacity="0.8" />
                    <polygon points="25,70 25,105 30,70" fill="#a7f3d0" />
                    <polygon points="75,70 75,105 80,70" fill="#a7f3d0" />
                </g>
            )}
        </svg>
    </div>
);

const RansomwareIconSVG = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(239,68,68,0.9)] overflow-visible">
        {/* Shackle */}
        <path d="M 30 40 V 20 C 30 5, 70 5, 70 20 V 40" fill="none" stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" />

        {/* Main Block */}
        <rect x="15" y="35" width="70" height="55" rx="8" fill="#450a0a" stroke="#ef4444" strokeWidth="4" />

        {/* Skull / Warning pattern */}
        <circle cx="35" cy="55" r="6" fill="#fca5a5" className="animate-pulse" />
        <circle cx="65" cy="55" r="6" fill="#fca5a5" className="animate-pulse" />
        <path d="M 40 75 H 60 M 45 70 V 80 M 50 70 V 80 M 55 70 V 80" stroke="#fca5a5" strokeWidth="3" strokeLinecap="round" />

        {/* Spikes */}
        <polygon points="10,45 0,55 10,65" fill="#ef4444" />
        <polygon points="90,45 100,55 90,65" fill="#ef4444" />
        <polygon points="45,90 50,100 55,90" fill="#ef4444" />
    </svg>
);

const PhishingIconSVG = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(249,115,22,0.9)] overflow-visible">
        {/* Fishing Line */}
        <line x1="50" y1="0" x2="50" y2="40" stroke="#fdba74" strokeWidth="3" strokeDasharray="6,4" className="animate-pulse" />

        {/* Hook */}
        <path d="M 50 40 V 80 C 50 95, 20 95, 20 80 L 15 85" fill="none" stroke="#ea580c" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <polygon points="15,85 28,82 18,72" fill="#ea580c" />

        {/* Bait (Glowing Data Packet) */}
        <g stroke="#f97316" strokeWidth="2" fill="#fff7ed" className="animate-bounce" style={{ transformOrigin: '50px 65px' }}>
            <rect x="35" y="55" width="30" height="20" rx="3" />
            <text x="50" y="70" fill="#ea580c" fontSize="14" fontWeight="900" textAnchor="middle" stroke="none">$</text>
        </g>
    </svg>
);

const ShieldIconSVG = () => (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_25px_rgba(34,211,238,1)] overflow-visible">
        {/* Outer Glow Ring */}
        <circle cx="50" cy="50" r="45" fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="10 5" className="animate-[spin_4s_linear_infinite]" />

        {/* Main Shield Body */}
        <path d="M 50 15 C 80 15, 85 35, 85 55 C 85 80, 50 95, 50 95 C 50 95, 15 80, 15 55 C 15 35, 20 15, 50 15 Z" fill="#083344" stroke="#22d3ee" strokeWidth="4" />

        {/* Circuitry Lines */}
        <path d="M 50 20 V 90 M 25 50 H 75" stroke="#06b6d4" strokeWidth="2" opacity="0.4" />
        <path d="M 35 35 L 65 65 M 35 65 L 65 35" stroke="#06b6d4" strokeWidth="2" opacity="0.4" />

        {/* Core Jewel */}
        <polygon points="50,35 60,50 50,65 40,50" fill="#cffafe" className="animate-pulse" />
    </svg>
);


const CryptoChase = ({ onBack }) => {
    const [gameState, setGameState] = useState('start'); // start, playing, paused, won, over
    const [lives, setLives] = useState(3);
    const [shieldsCollected, setShieldsCollected] = useState(0);
    const [currentTip, setCurrentTip] = useState(null);

    // Physics constants - TWEAKED FOR MORE FORGIVING JUMPS AND NEW SIZES
    const GRAVITY = 0.35;
    const JUMP_STRENGTH = -11;
    const MOVE_SPEED = 5;
    const AIR_ACCEL = 1.0;
    const MAX_FALL_SPEED = 10;
    const PLAYER_WIDTH = 32; // Increased size slightly to fit the drone 
    const PLAYER_HEIGHT = 32;
    const GAME_WIDTH = 800;
    const GAME_HEIGHT = 500;

    // Mutable game state
    const playerRef = useRef({ x: 50, y: 500, vx: 0, vy: 0, isGrounded: false, platformVx: 0 });
    const keysRef = useRef({ w: false, a: false, s: false, d: false, space: false });
    const cameraYRef = useRef(0);

    const obstaclesRef = useRef(JSON.parse(JSON.stringify(INITIAL_OBSTACLES)));
    const shieldsRef = useRef(JSON.parse(JSON.stringify(INITIAL_SHIELDS)));
    const platformsRef = useRef(JSON.parse(JSON.stringify(INITIAL_PLATFORMS)));
    const particlesRef = useRef([]);

    const requestRef = useRef();
    const [renderTrigger, setRenderTrigger] = useState(0);
    const gameStateRef = useRef('start');

    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    // Input handling
    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowleft', 'arrowright', 'arrowdown'].includes(key)) {
                if (key === ' ' || key === 'arrowup') {
                    e.preventDefault();
                    keysRef.current.w = true;
                } else if (key === 'arrowleft') keysRef.current.a = true;
                else if (key === 'arrowright') keysRef.current.d = true;
                else if (key === 'arrowdown') keysRef.current.s = true;
                else {
                    keysRef.current[key] = true;
                }
            }
        };

        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase();
            if (['w', 'a', 's', 'd', ' ', 'arrowup', 'arrowleft', 'arrowright', 'arrowdown'].includes(key)) {
                if (key === ' ' || key === 'arrowup') keysRef.current.w = false;
                else if (key === 'arrowleft') keysRef.current.a = false;
                else if (key === 'arrowright') keysRef.current.d = false;
                else if (key === 'arrowdown') keysRef.current.s = false;
                else keysRef.current[key] = false;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const spawnParticles = (x, y, color, count = 10) => {
        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                id: Math.random(),
                x, y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10 - 2,
                life: 1,
                color
            });
        }
    };

    const handleCollision = (obsX, obsY) => {
        setLives(prev => {
            const next = prev - 1;
            if (next <= 0) {
                setGameState('over');
            } else {
                // Knockback
                playerRef.current.vy = -6;
                playerRef.current.vx = playerRef.current.vx > 0 ? -12 : 12;
                spawnParticles(obsX, obsY, '#ef4444', 20); // Red particles
            }
            return next;
        });
    };

    const handleShieldCollection = (shX, shY) => {
        spawnParticles(shX, shY, '#22d3ee', 25); // Cyan particles
        setShieldsCollected(prev => {
            const next = prev + 1;
            const tip = TIPS[(next - 1) % TIPS.length];
            setCurrentTip(tip);
            setGameState('paused');

            // Clear keys so they don't keep running while paused
            keysRef.current = { w: false, a: false, s: false, d: false, space: false };

            return next;
        });
    };

    const checkAABB = (r1, r2) => {
        return r1.x < r2.x + r2.w &&
            r1.x + r1.w > r2.x &&
            r1.y < r2.y + r2.h &&
            r1.y + r1.h > r2.y;
    };

    const gameLoop = useCallback(() => {
        if (gameStateRef.current !== 'playing') {
            requestRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        const p = playerRef.current;
        const keys = keysRef.current;

        // --- PLATFORM MOVEMENT ---
        platformsRef.current.forEach(plat => {
            if (plat.vx) {
                plat.x += plat.vx;
                if (plat.x <= plat.minX || plat.x + plat.w >= plat.maxX) {
                    plat.vx *= -1; // Reverse direction
                }
            }
        });

        // --- PLAYER MOVEMENT ---
        // Horizontal
        const accel = p.isGrounded ? MOVE_SPEED : AIR_ACCEL;
        if (keys.a) {
            p.vx = p.isGrounded ? -MOVE_SPEED : Math.max(p.vx - accel, -MOVE_SPEED);
        } else if (keys.d) {
            p.vx = p.isGrounded ? MOVE_SPEED : Math.min(p.vx + accel, MOVE_SPEED);
        } else {
            p.vx *= p.isGrounded ? 0.6 : 0.85; // Faster stop (more friction) for tighter controls
            if (Math.abs(p.vx) < 0.1) p.vx = 0;
        }

        // Jumping
        // Added "coyote time" leniency for slightly late jumps (not literally but looser feel)
        if (keys.w && p.isGrounded) {
            p.vy = JUMP_STRENGTH;
            p.isGrounded = false;
            p.platformVx = 0;
            // Spawn some thrust particles
            spawnParticles(p.x + PLAYER_WIDTH / 2, p.y + PLAYER_HEIGHT, '#34d399', 8);
        }

        // Apply Gravity
        p.vy += GRAVITY;
        if (p.vy > MAX_FALL_SPEED) p.vy = MAX_FALL_SPEED;

        // Next position
        let nextX = p.x + p.vx + p.platformVx;
        let nextY = p.y + p.vy;

        p.isGrounded = false;
        p.platformVx = 0;

        // --- STRICT PLATFORM COLLISION ---
        for (const plat of platformsRef.current) {
            if (p.vy >= 0) {
                const wasAbove = p.y + PLAYER_HEIGHT <= plat.y + 1;
                const willCross = nextY + PLAYER_HEIGHT >= plat.y;
                // Check X bounds (including platform movement prediction)
                // Expanded hitbox slightly by 15px so edge jumps feel *very* forgiving
                const withinX = nextX + PLAYER_WIDTH >= plat.x - 15 && nextX <= plat.x + plat.w + 15;

                if (wasAbove && willCross && withinX) {
                    p.y = plat.y - PLAYER_HEIGHT;
                    p.vy = 0;
                    p.isGrounded = true;
                    if (plat.vx) p.platformVx = plat.vx;
                    nextY = p.y;
                }
            }
        }

        if (!p.isGrounded) p.y = nextY;
        p.x = nextX;

        // Map bounds
        if (p.x < 0) p.x = 0;
        if (p.x + PLAYER_WIDTH > GAME_WIDTH) p.x = GAME_WIDTH - PLAYER_WIDTH;

        // Falling off screen
        if (p.y > cameraYRef.current + GAME_HEIGHT + 50) {
            p.vy = 0; p.vx = 0; p.platformVx = 0;
            handleCollision(p.x, p.y);

            const validPlats = platformsRef.current.filter(plat => plat.y < cameraYRef.current + GAME_HEIGHT - 50);
            const target = validPlats[validPlats.length - 1];
            if (target) {
                p.y = target.y - PLAYER_HEIGHT - 5;
                p.x = target.x + target.w / 2 - PLAYER_WIDTH / 2;
            }
        }

        // --- CAMERA UPDATE ---
        const targetCameraY = p.y - GAME_HEIGHT / 2;
        if (targetCameraY < cameraYRef.current) {
            cameraYRef.current = cameraYRef.current + (targetCameraY - cameraYRef.current) * 0.1;
        } else if (p.y > cameraYRef.current + GAME_HEIGHT - 150) {
            cameraYRef.current = cameraYRef.current + (p.y - (cameraYRef.current + GAME_HEIGHT - 150)) * 0.1;
        }

        const playerRect = { x: p.x, y: p.y, w: PLAYER_WIDTH, h: PLAYER_HEIGHT };

        // --- PARTICLES UPDATE ---
        // Engine exhaust trail when airborne
        if (!p.isGrounded && frameCountRef.current % 4 === 0) {
            particlesRef.current.push({
                id: Math.random(),
                x: p.x + PLAYER_WIDTH / 2 + (Math.random() * 10 - 5),
                y: p.y + PLAYER_HEIGHT,
                vx: 0,
                vy: 2 + Math.random(), // particles fire downwards slightly
                life: 0.6,
                color: '#6ee7b7'
            });
        }
        frameCountRef.current++;

        particlesRef.current.forEach(part => {
            part.x += part.vx;
            part.y += part.vy;
            if (part.vy !== 0 && part.color === '#ef4444') part.vy += 0.2; // Gravity for explosion
            part.life -= 0.05;
        });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);

        // --- OBSTACLES COLLISION ---
        obstaclesRef.current.forEach(obs => {
            if (obs.active) {
                if (checkAABB(playerRect, obs)) {
                    obs.active = false;
                    handleCollision(obs.x + obs.w / 2, obs.y + obs.h / 2);
                }
            }
        });

        // --- SHIELDS COLLISION ---
        shieldsRef.current.forEach(sh => {
            if (!sh.collected) {
                const shHitbox = { x: sh.x - 5, y: sh.y - 5, w: sh.w + 10, h: sh.h + 10 };
                if (checkAABB(playerRect, shHitbox)) {
                    sh.collected = true;
                    handleShieldCollection(sh.x + sh.w / 2, sh.y + sh.h / 2);
                }
            }
        });

        setRenderTrigger(prev => prev + 1);
        requestRef.current = requestAnimationFrame(gameLoop);
    }, []);

    const frameCountRef = useRef(0);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(requestRef.current);
    }, [gameLoop]);

    const startGame = () => {
        setGameState('playing');
        setLives(3);
        setShieldsCollected(0);

        playerRef.current = { x: 50, y: 500, vx: 0, vy: 0, isGrounded: false, platformVx: 0 };
        keysRef.current = { w: false, a: false, s: false, d: false, space: false };
        cameraYRef.current = 100;

        obstaclesRef.current = JSON.parse(JSON.stringify(INITIAL_OBSTACLES));
        shieldsRef.current = JSON.parse(JSON.stringify(INITIAL_SHIELDS));
        platformsRef.current = JSON.parse(JSON.stringify(INITIAL_PLATFORMS));
        particlesRef.current = [];
        frameCountRef.current = 0;

        setRenderTrigger(0);
    };

    const resumeGame = () => {
        if (shieldsCollected >= 5) {
            setGameState('won');
        } else {
            setGameState('playing');
        }
        setCurrentTip(null);
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/50 to-cyan-50/30 p-6 animate-fade-in relative z-0">
            {/* Header / HUD */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-6 z-10">
                <div>
                    <h2 className="text-2xl font-black text-emerald-400 uppercase tracking-widest flex items-center gap-3">
                        <div className="w-6 h-6"><PlayerDroneSVG isGrounded={true} vx={0} /></div>
                        Crypto Chase
                    </h2>
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-widest mt-1">Ascend & Evade</p>
                </div>

                <div className="flex items-center gap-6 bg-white/90 backdrop-blur-md border-slate-200 px-6 py-2 rounded-full border border-slate-300 shadow-[0_0_20px_rgba(34,211,238,0.08)]">
                    <div className="text-emerald-400 font-mono text-xl w-24 text-right tabular-nums tracking-wider">
                        {Math.floor(Math.max(0, -playerRef.current.y + 550))}m
                    </div>
                    <div className="h-6 w-px bg-slate-300 mx-2"></div>
                    <div className="flex gap-2 text-red-500 text-xl">
                        {[...Array(3)].map((_, i) => (
                            <span key={i} className={`transition-all duration-300 ${i < lives ? 'opacity-100 scale-100 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'opacity-20 scale-75 grayscale'}`}>❤️</span>
                        ))}
                    </div>
                    <div className="h-6 w-px bg-slate-300 mx-2"></div>
                    <div className="flex gap-2 text-cyan-400 text-xl items-center">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className={`w-5 h-5 transition-all duration-500 ${i < shieldsCollected ? 'opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(34,211,238,1)]' : 'opacity-20 scale-90 grayscale saturate-0'}`}>
                                <ShieldIconSVG />
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={onBack}
                    className="px-6 py-2 bg-slate-600 hover:bg-slate-700 rounded text-white transition-all font-mono text-xs uppercase shadow-sm"
                >
                    Abandon Link
                </button>
            </div>

            {/* Game Area Container */}
            <div className="w-full max-w-[800px] h-[500px] bg-white border border-blue-200/50 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.08)] ring-2 ring-emerald-500/20">

                {/* Visual Background (Cyber Grid parallax & Server Towers) */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none"></div>

                <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                        backgroundImage: `
                            linear-gradient(to right, #475569 1px, transparent 1px), 
                            linear-gradient(to bottom, #475569 1px, transparent 1px)
                        `,
                        backgroundSize: '120px 120px',
                        backgroundPosition: `0 ${-cameraYRef.current * 0.1}px`
                    }}
                />

                {/* Parallax Server Towers */}
                {SERVER_TOWERS.map((tower, i) => (
                    <div
                        key={i}
                        className={`absolute bottom-0 h-[200%] w-[${tower.w}px] bg-gradient-to-t ${tower.color} pointer-events-none mix-blend-screen opacity-50`}
                        style={{
                            left: `${tower.x}px`,
                            width: `${tower.w}px`,
                            transform: `translateY(${(cameraYRef.current * 0.15) % 1000}px)`
                        }}
                    >
                        <div className="w-full h-full opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, #a7f3d0 20px, #a7f3d0 22px)' }}></div>
                        {/* Fake Server rack lights */}
                        <div className="absolute top-0 right-2 w-1 h-full opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjIwIj48cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMzRkMzk5Ii8+PHJlY3QgeT0iOCIgd2lkdGg9IjQiIGhlaWdodD0iNCIgZmlsbD0iIzM0ZDM5OSIvPjwvc3ZnPg==')]"></div>
                    </div>
                ))}

                {/* GAME WORLD (Moves based on cameraY) */}
                {gameState !== 'start' && (
                    <div
                        className="absolute w-full h-full pointer-events-none"
                        style={{ transform: `translateY(${-cameraYRef.current}px)` }}
                    >
                        {/* Particles */}
                        {particlesRef.current.map(p => (
                            <div
                                key={p.id}
                                className="absolute rounded-full"
                                style={{
                                    left: `${p.x}px`, top: `${p.y}px`,
                                    width: p.vy === 0 ? '5px' : '8px',
                                    height: p.vy === 0 ? '5px' : '8px',
                                    backgroundColor: p.color,
                                    opacity: p.life,
                                    transform: `scale(${p.life})`,
                                    boxShadow: `0 0 10px ${p.color}`
                                }}
                            />
                        ))}

                        {/* Player */}
                        <div
                            className="absolute z-30"
                            style={{
                                left: `${playerRef.current.x}px`,
                                top: `${playerRef.current.y}px`,
                                width: `${PLAYER_WIDTH}px`,
                                height: `${PLAYER_HEIGHT}px`,
                            }}
                        >
                            <PlayerDroneSVG isGrounded={playerRef.current.isGrounded} vx={playerRef.current.vx} />
                        </div>

                        {/* Platforms (Server Racks) */}
                        {platformsRef.current.map((plat, i) => (
                            <div
                                key={`plat-${i}`}
                                className={`absolute overflow-hidden ${plat.type === 'ground' ? 'bg-white border-t-4 border-slate-300' : 'bg-slate-200/80 border-t-[3px] border-emerald-400 shadow-[0_15px_30px_rgba(0,0,0,0.8)] backdrop-blur-md rounded-b-md'}`}
                                style={{
                                    left: `${plat.x}px`,
                                    top: `${plat.y}px`,
                                    width: `${plat.w}px`,
                                    height: `${plat.h}px`,
                                }}
                            >
                                {/* Platform internal tech details */}
                                {plat.type !== 'ground' && (
                                    <div className="relative w-full h-full opacity-60">
                                        <div className="absolute top-0 w-full h-1 bg-emerald-400/30"></div>
                                        {/* Rack lines */}
                                        <div className="absolute top-1 left-2 w-[calc(100%-16px)] h-full border-x border-slate-300 flex justify-between px-1 bg-slate-100/80">
                                            {/* Blinking datalights */}
                                            {[...Array(Math.floor(plat.w / 30))].map((_, j) => (
                                                <div key={j} className="h-2 w-2 mt-1 rounded-sm bg-emerald-500 animate-pulse" style={{ animationDelay: `${j * 0.2}s`, animationDuration: '0.8s' }}></div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Obstacles */}
                        {obstaclesRef.current.map(obs => (
                            obs.active && (
                                <div
                                    key={`obs-${obs.id}`}
                                    className={`absolute flex items-center justify-center z-20 ${obs.type === 'ransomware' ? 'animate-[bounce_2s_infinite]' : 'animate-[bounce_3s_infinite]'}`}
                                    style={{
                                        left: `${obs.x}px`,
                                        top: `${obs.y}px`,
                                        width: `${obs.w}px`,
                                        height: `${obs.h}px`,
                                    }}
                                >
                                    {obs.type === 'ransomware' ? <RansomwareIconSVG /> : <PhishingIconSVG />}
                                </div>
                            )
                        ))}

                        {/* Shields */}
                        {shieldsRef.current.map(sh => (
                            !sh.collected && (
                                <div
                                    key={`sh-${sh.id}`}
                                    className="absolute flex items-center justify-center z-20 animate-[bounce_1.5s_infinite]"
                                    style={{
                                        left: `${sh.x}px`,
                                        top: `${sh.y}px`,
                                        width: `${sh.w}px`,
                                        height: `${sh.h}px`,
                                    }}
                                >
                                    <ShieldIconSVG />
                                    {/* Light beam from shield */}
                                    <div className="absolute bottom-full w-1 h-32 bg-gradient-to-t from-cyan-400 to-transparent opacity-50 blur-sm pointer-events-none"></div>
                                </div>
                            )
                        ))}

                    </div>
                )}


                {/* Overlays (Fixed to screen) */}
                {gameState === 'start' && (
                    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-40 backdrop-blur-md">
                        <div className="bg-white/90 border-2 border-emerald-500/30 p-10 rounded-3xl flex flex-col items-center text-center shadow-[0_0_100px_rgba(16,185,129,0.2)] max-w-lg relative overflow-hidden">
                            <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-400 to-emerald-500/0"></div>

                            <div className="w-24 h-24 mb-6">
                                <PlayerDroneSVG isGrounded={false} vx={0} />
                            </div>

                            <h3 className="text-4xl font-black text-slate-900 mb-3 uppercase tracking-tight">Ascend the Data Tower</h3>
                            <p className="text-slate-400 mb-8 leading-relaxed text-lg">
                                The lower servers have been infected. Pilot your Data Node using <span className="text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/40">W A S D</span>. Jump between platforms, evade the malware, and recover all 5 <span className="text-cyan-400 font-bold">Defense Protocols 🛡️</span>.
                            </p>
                            <button
                                onClick={startGame}
                                className="px-12 py-4 bg-emerald-500 text-slate-950 rounded-xl font-black text-xl uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:shadow-[0_0_50px_rgba(16,185,129,0.8)] hover:scale-105 hover:bg-emerald-400 active:scale-95"
                            >
                                Initiate Link
                            </button>
                        </div>
                    </div>
                )}

                {gameState === 'paused' && currentTip && (
                    <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-50 p-4 backdrop-blur-md">
                        <div className="bg-white border-2 border-cyan-500/50 p-6 rounded-2xl max-w-xl shadow-[0_0_100px_rgba(34,211,238,0.3)] animate-fade-in relative overflow-y-auto max-h-[90%] w-full">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 via-indigo-500 to-cyan-400 bg-[length:200%_auto] animate-gradient-x"></div>

                            <div className="flex flex-col items-center mb-6">
                                <div className="w-20 h-20 mb-4 animate-[bounce_2s_infinite]">
                                    <ShieldIconSVG />
                                </div>
                                <h3 className="text-sm font-bold text-cyan-400 mb-1 tracking-widest uppercase">Protocol Acquired</h3>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{currentTip.title}</h2>
                            </div>

                            <p className="text-slate-600 mb-8 leading-relaxed text-lg border-l-4 border-cyan-500 pl-6 bg-cyan-500/15 p-5 rounded-r-lg font-medium">
                                {currentTip.text}
                            </p>

                            <div className="flex justify-center flex-shrink-0">
                                <button
                                    onClick={resumeGame}
                                    className="px-10 py-3 bg-cyan-500 text-slate-950 font-black text-lg uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all shadow-[0_0_25px_rgba(34,211,238,0.5)] hover:shadow-[0_0_40px_rgba(34,211,238,0.8)] hover:-translate-y-1 active:translate-y-0"
                                >
                                    Acknowledge
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {gameState === 'over' && (
                    <div className="absolute inset-0 bg-red-950/95 flex flex-col items-center justify-center z-50 backdrop-blur-md">
                        <div className="flex flex-col items-center text-center p-8 bg-red-900/20 border border-red-500/30 rounded-3xl backdrop-blur-sm max-w-xl">
                            <div className="w-32 h-32 mb-6 animate-pulse">
                                <RansomwareIconSVG />
                            </div>
                            <h3 className="text-6xl font-black text-red-500 mb-6 uppercase tracking-tighter mix-blend-screen drop-shadow-md">System Compromised</h3>
                            <p className="text-red-700 mb-10 font-mono text-xl bg-red-950/80 p-5 w-full border-l-4 border-red-500 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] text-left rounded-r">
                                {'>'} CRITICAL_ERR_0XF<br />{'>'} Malware payload executed.<br />{'>'} Drone chassis destroyed.
                            </p>
                            <button
                                onClick={startGame}
                                className="px-12 py-4 bg-red-950 text-red-400 hover:bg-red-500 hover:text-slate-900 border-2 border-red-500 rounded-xl font-black text-lg uppercase tracking-widest transition-all hover:shadow-[0_0_40px_rgba(239,68,68,0.6)]"
                            >
                                Re-Deploy Node
                            </button>
                        </div>
                    </div>
                )}

                {gameState === 'won' && (
                    <div className="absolute inset-0 bg-emerald-950/95 flex flex-col items-center justify-center z-50 backdrop-blur-md">
                        <div className="flex flex-col items-center text-center bg-emerald-900/20 border border-emerald-400/40 p-10 rounded-3xl max-w-xl">
                            <div className="w-32 h-32 mb-6 animate-bounce">
                                <ShieldIconSVG />
                            </div>
                            <h3 className="text-6xl font-black text-emerald-400 mb-6 uppercase tracking-tighter drop-shadow-lg">Tower Secured</h3>
                            <p className="text-emerald-700 mb-10 text-xl font-medium leading-relaxed bg-emerald-900/50 p-6 rounded-xl border border-emerald-400/40 shadow-inner">
                                Excellent routing execution. You have reached the summit and successfully recovered all active defense protocols.
                            </p>
                            <button
                                onClick={onBack}
                                className="px-12 py-4 bg-emerald-500 text-slate-950 hover:bg-emerald-400 rounded-xl font-black text-xl uppercase tracking-widest transition-all shadow-[0_0_40px_rgba(52,211,153,0.5)] hover:shadow-[0_0_60px_rgba(52,211,153,0.8)] hover:-translate-y-1"
                            >
                                Return to Command Hub
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-6 text-slate-500 font-mono text-sm text-center flex gap-6">
                <p className="flex items-center gap-2"><span className="text-emerald-400 font-bold px-2 py-1 bg-white rounded border border-slate-300 block shadow-inner">W A S D</span> Sub-routine: Move</p>
                <p className="flex items-center gap-2"><span className="text-emerald-400 font-bold px-2 py-1 bg-white rounded border border-slate-300 block shadow-inner">ARROWS</span> Sub-routine: Alt Move</p>
            </div>
        </div>
    );
};

export default CryptoChase;
