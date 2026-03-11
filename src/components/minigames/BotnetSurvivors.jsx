import React, { useState, useEffect, useCallback, useRef } from 'react';

const TIPS = [
    { title: "Firewall Pulse", text: "Firewalls use deep packet inspection to block malicious traffic at the edge. A pulsed approach minimizes performance overhead while maintaining high security." },
    { title: "Encryption Shield", text: "Encryption ensures that even if a packet reaches the server, it cannot easily compromise sensitive internal processes. It's a key layer of Defense in Depth." },
    { title: "Auto-Patch Drone", text: "Continuous automated patching remediates known vulnerabilities in real-time. This 'self-healing' infrastructure is critical against automated botnet swarms." },
    { title: "Bandwidth Optimization", text: "Higher bandwidth capacity allows the server to shift resources and maneuver traffic more effectively, increasing overall responsiveness." },
    { title: "Processor Overclock", text: "Increasing clock speeds allows the server to process and mitigate malicious packets at a higher frequency, neutralizing threats before they accumulate." },
    { title: "Protocol Shredder", text: "Manual combat allows for tactical neutralization of incoming threats. Shredding packets directly ensures critical protocol integrity during peak volumetric surges." },
    { title: "Defense in Depth", text: "No single security measure is 100% effective. Layering firewalls, encryption, and patching creates multiple hurdles for an attacker." }
];

const ENEMY_TYPES = {
    TCP_FLOOD: { type: 'tcp', hp: 20, speed: 1.3, color: '#ef4444', size: 12, xp: 10, name: 'TCP Flood' },
    SYN_STORM: { type: 'syn', hp: 50, speed: 0.9, color: '#f97316', size: 18, xp: 25, name: 'SYN Storm' },
    UDP_BOMB: { type: 'udp', hp: 150, speed: 0.5, color: '#f87171', size: 28, xp: 60, name: 'UDP Payload' },
    ZERO_DAY: { type: 'zero', hp: 400, speed: 0.8, color: '#a855f7', size: 36, xp: 200, name: 'Zero-Day Worm' }
};

const UPGRADES = [
    {
        id: 'firewall',
        name: 'Firewall Pulse',
        description: 'Expand a ring of fire that damages enemies.',
        icon: '🔥',
        color: 'text-orange-500',
        maxLevel: 5
    },
    {
        id: 'encryption',
        name: 'Encryption Shield',
        description: 'Reduce all damage taken by 20%.',
        icon: '🛡️',
        color: 'text-cyan-500',
        maxLevel: 5
    },
    {
        id: 'patch',
        name: 'Auto-Patch Drone',
        description: 'A drone that heals 2 HP every 5 seconds.',
        icon: '🤖',
        color: 'text-emerald-500',
        maxLevel: 5
    },
    {
        id: 'speed',
        name: 'Bandwidth [Speed]',
        description: 'Increase movement speed by 20%.',
        icon: '⚡',
        color: 'text-yellow-400',
        maxLevel: 5
    },
    {
        id: 'clock',
        name: 'Processor [Fire Rate]',
        description: 'Increase auto-mitigation frequency.',
        icon: '⏩',
        color: 'text-red-400',
        maxLevel: 5
    },
    {
        id: 'shotgun',
        name: 'Protocol Shredder',
        description: 'Manual combat: Aim with mouse and click to fire shards.',
        icon: '💥',
        color: 'text-cyan-400',
        maxLevel: 5
    }
];

// --- SVG COMPONENTS ---

const ServerSVG = ({ healthPercent, shieldLevel }) => (
    <div className="w-full h-full relative">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
            {/* Server Rack Body */}
            <rect x="25" y="10" width="50" height="80" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="2" />

            {/* Front Panel Grid */}
            <rect x="30" y="15" width="40" height="70" rx="2" fill="#0f172a" />

            {/* Blinking LEDs */}
            {[...Array(6)].map((_, i) => (
                <circle
                    key={i}
                    cx="35"
                    cy={25 + i * 10}
                    r="2"
                    fill={healthPercent > 30 ? "#10b981" : "#ef4444"}
                    className="animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                />
            ))}

            {/* Data Slots */}
            {[...Array(6)].map((_, i) => (
                <rect key={`slot-${i}`} x="42" y={23 + i * 10} width="24" height="4" rx="1" fill="#334155" />
            ))}

            {/* Integrity Glow */}
            <rect
                x="30" y={15 + (70 * (1 - healthPercent / 100))}
                width="40" height={70 * (healthPercent / 100)}
                rx="2" fill="#22d3ee" opacity="0.1"
            />
        </svg>

        {/* Encryption Shield Visual */}
        {shieldLevel > 0 && (
            <div
                className="absolute inset-[-10%] rounded-full border-2 border-cyan-400/50 animate-[spin_10s_linear_infinite]"
                style={{
                    boxShadow: `inset 0 0 20px rgba(34,211,238,${0.2 + shieldLevel * 0.1})`,
                    opacity: 0.3 + (shieldLevel * 0.1)
                }}
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-cyan-400 rounded-full blur-sm"></div>
            </div>
        )}
    </div>
);

const PacketSVG = ({ type }) => {
    const config = ENEMY_TYPES[type] || ENEMY_TYPES.TCP_FLOOD;
    return (
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
            <defs>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Outer shell */}
            <path
                d="M 50 10 L 90 30 L 90 70 L 50 90 L 10 70 L 10 30 Z"
                fill={config.color}
                opacity="0.2"
                stroke={config.color}
                strokeWidth="2"
            />

            {/* Core */}
            <circle cx="50" cy="50" r="25" fill="#0f172a" stroke={config.color} strokeWidth="4" filter="url(#glow)" />

            {/* Content symbols based on type */}
            {type === 'TCP_FLOOD' && <path d="M 40 40 L 60 60 M 60 40 L 40 60" stroke="#fff" strokeWidth="8" strokeLinecap="round" />}
            {type === 'SYN_STORM' && <circle cx="50" cy="50" r="10" fill="#fff" className="animate-pulse" />}
            {type === 'UDP_BOMB' && <rect x="35" y="35" width="30" height="30" fill="#fff" rx="4" />}
            {type === 'ZERO_DAY' && (
                <g className="animate-spin" style={{ transformOrigin: 'center' }}>
                    <path d="M 50 20 L 70 50 L 50 80 L 30 50 Z" fill="#fff" />
                </g>
            )}
        </svg>
    );
};

// --- GAME COMPONENT ---

const BotnetSurvivors = ({ onBack }) => {
    // Game State
    const [gameState, setGameState] = useState('start'); // start, playing, levelup, over, won
    const [health, setHealth] = useState(100);
    const [level, setLevel] = useState(1);
    const [xp, setXp] = useState(0);
    const [time, setTime] = useState(0);
    const [upgrades, setUpgrades] = useState({ firewall: 0, encryption: 0, patch: 0, speed: 0, clock: 0, shotgun: 1 });
    const [upgradeChoices, setUpgradeChoices] = useState([]);

    // Constants
    const GAME_W = 900;
    const GAME_H = 600;
    const XP_NEEDED = (lvl) => 100 + (lvl - 1) * 150;
    const MAX_TIME = 180; // 3 minutes

    // Refs for simulation
    const playerRef = useRef({ x: GAME_W / 2, y: GAME_H / 2, size: 32 });
    const enemiesRef = useRef([]);
    const xpRef = useRef([]);
    const projectilesRef = useRef([]);
    const particlesRef = useRef([]);
    const firewallPulseRef = useRef({ active: false, radius: 0, lastFired: 0 });
    const shotgunTimerRef = useRef(0);
    const patchTimerRef = useRef(0);
    const keysRef = useRef({});
    const requestRef = useRef();
    const frameCountRef = useRef(0);
    const lastTimeRef = useRef(Date.now());
    const mousePosRef = useRef({ x: 0, y: 0 });
    const [renderTrigger, setRenderTrigger] = useState(0);

    // Handle Input
    useEffect(() => {
        const handleDown = (e) => keysRef.current[e.key.toLowerCase()] = true;
        const handleUp = (e) => keysRef.current[e.key.toLowerCase()] = false;
        // Removed handleMouseMove and handleClick from window listener as they are now on the game canvas div
        // const handleMouseMove = (e) => {
        //     const rect = e.currentTarget.getBoundingClientRect();
        //     setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        // };
        // const handleClick = () => {
        //     if (gameState === 'playing' && upgrades.shotgun > 0 && shotgunTimerRef.current <= 0) {
        //         fireShotgun();
        //     }
        // };

        window.addEventListener('keydown', handleDown);
        window.addEventListener('keyup', handleUp);
        return () => {
            window.removeEventListener('keydown', handleDown);
            window.removeEventListener('keyup', handleUp);
        };
    }, []); // Removed gameState, upgrades.shotgun from dependency array as click is now on div

    const spawnEnemy = useCallback(() => {
        const typeKeys = Object.keys(ENEMY_TYPES);
        let typeKey = typeKeys[0];

        // Difficulty scaling based on time
        if (time > 120) typeKey = typeKeys[Math.floor(Math.random() * 4)];
        else if (time > 60) typeKey = typeKeys[Math.floor(Math.random() * 3)];
        else if (time > 30) typeKey = typeKeys[Math.floor(Math.random() * 2)];

        const config = ENEMY_TYPES[typeKey];

        // Spawn from edges
        let x, y;
        const side = Math.floor(Math.random() * 4);
        const margin = 50;
        if (side === 0) { x = Math.random() * GAME_W; y = -margin; }
        else if (side === 1) { x = GAME_W + margin; y = Math.random() * GAME_H; }
        else if (side === 2) { x = Math.random() * GAME_W; y = GAME_H + margin; }
        else { x = -margin; y = Math.random() * GAME_H; }

        enemiesRef.current.push({
            id: Math.random(),
            x, y,
            type: typeKey,
            hp: config.hp,
            maxHp: config.hp,
            speed: config.speed + (time / 60) * 0.3,
            size: config.size
        });
    }, [time]);

    const handleLevelUp = useCallback(() => {
        setGameState('levelup');
        // Pick 4 random upgrades that are not at max level
        const available = UPGRADES.filter(u => upgrades[u.id] < u.maxLevel);
        const shuffled = [...available].sort(() => 0.5 - Math.random());
        setUpgradeChoices(shuffled.slice(0, 4));
    }, [upgrades]);

    const gameLoop = useCallback(() => {
        const now = Date.now();
        const dt = (now - lastTimeRef.current) / 1000;
        lastTimeRef.current = now;

        if (gameState !== 'playing') {
            requestRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        const p = playerRef.current; // Define p here for consistent use

        if (p.x === GAME_W / 2 && p.y === GAME_H / 2 && frameCountRef.current === 0) {
            // Initial state check
        }

        // Increment frame count
        frameCountRef.current++;

        // --- MANUAL COMBAT TIMER ---
        if (shotgunTimerRef.current > 0) shotgunTimerRef.current -= dt;

        // --- TIMER ---
        if (frameCountRef.current % 60 === 0) {
            setTime(t => {
                if (t >= MAX_TIME) setGameState('won');
                return t + 1;
            });
        }

        // --- PLAYER MOVEMENT ---
        const baseSpeed = 180;
        const speedMultiplier = 1 + (upgrades.speed * 0.2);
        const speed = baseSpeed * speedMultiplier * dt;
        if (keysRef.current['w'] || keysRef.current['arrowup']) p.y -= speed;
        if (keysRef.current['s'] || keysRef.current['arrowdown']) p.y += speed;
        if (keysRef.current['a'] || keysRef.current['arrowleft']) p.x -= speed;
        if (keysRef.current['d'] || keysRef.current['arrowright']) p.x += speed;

        // Constraint
        p.x = Math.max(16, Math.min(GAME_W - 16, p.x));
        p.y = Math.max(16, Math.min(GAME_H - 16, p.y));

        // --- ENEMIES ---
        if (frameCountRef.current % Math.max(10, 60 - Math.floor(time / 2)) === 0) {
            spawnEnemy();
        }

        enemiesRef.current.forEach(enemy => {
            const dx = p.x - enemy.x;
            const dy = p.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Move toward player
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;

            // Collision with player
            if (dist < (p.size / 2 + enemy.size / 2)) {
                // Apply damage
                let dmg = 5;
                if (upgrades.encryption > 0) dmg *= (1 - upgrades.encryption * 0.15); // Layered defense

                setHealth(h => {
                    const next = h - dmg * dt * 4; // Constant drip of damage
                    if (next <= 0) setGameState('over');
                    return Math.max(0, next);
                });

                // Spawn hit particles
                if (frameCountRef.current % 10 === 0) {
                    particlesRef.current.push({
                        id: Math.random(),
                        x: enemy.x, y: enemy.y,
                        vx: (Math.random() - 0.5) * 4,
                        vy: (Math.random() - 0.5) * 4,
                        life: 1,
                        color: '#ef4444'
                    });
                }
            }
        });

        // --- AUTO ATTACK (Base) ---
        const fireFreq = Math.max(10, 90 - (upgrades.clock * 15));
        if (frameCountRef.current % fireFreq === 0 && enemiesRef.current.length > 0) {
            // Find nearest
            let nearest = null;
            let minDist = Infinity;
            enemiesRef.current.forEach(e => {
                const d = Math.sqrt((p.x - e.x) ** 2 + (p.y - e.y) ** 2);
                if (d < minDist) { minDist = d; nearest = e; }
            });

            if (nearest && minDist < 250) {
                nearest.hp -= 25;
                particlesRef.current.push({
                    id: Math.random(),
                    x: nearest.x, y: nearest.y,
                    vx: 0, vy: 0, life: 0.5, color: '#22d3ee', size: nearest.size * 1.5, type: 'hit'
                });
            }
        }

        // --- FIREWALL PULSE ---
        if (upgrades.firewall > 0) {
            const config = {
                1: { radius: 100, dmg: 2, freq: 180 },
                2: { radius: 140, dmg: 3, freq: 160 },
                3: { radius: 180, dmg: 4, freq: 140 },
                4: { radius: 220, dmg: 5, freq: 120 },
                5: { radius: 260, dmg: 6, freq: 100 },
            }[upgrades.firewall];

            if (frameCountRef.current % config.freq === 0) {
                firewallPulseRef.current = { active: true, radius: 20, maxRadius: config.radius, dmg: config.dmg };
            }

            if (firewallPulseRef.current.active) {
                firewallPulseRef.current.radius += 5;
                if (firewallPulseRef.current.radius > firewallPulseRef.current.maxRadius) {
                    firewallPulseRef.current.active = false;
                } else {
                    // Check collision with pulse
                    enemiesRef.current.forEach(e => {
                        const d = Math.sqrt((p.x - e.x) ** 2 + (p.y - e.y) ** 2);
                        if (Math.abs(d - firewallPulseRef.current.radius) < 20) {
                            e.hp -= firewallPulseRef.current.dmg;
                        }
                    });
                }
            }
        }

        // --- PATCH DRONE ---
        if (upgrades.patch > 0) {
            const healAmt = upgrades.patch * 0.2;
            patchTimerRef.current += dt;
            if (patchTimerRef.current >= 2) {
                setHealth(h => Math.min(100, h + healAmt * 5));
                patchTimerRef.current = 0;
            }
        }

        // --- CLEANUP ENEMIES & XP ---
        const killed = [];
        enemiesRef.current = enemiesRef.current.filter(e => {
            if (e.hp <= 0) {
                killed.push(e);
                return false;
            }
            return true;
        });

        killed.forEach(e => {
            const config = ENEMY_TYPES[e.type];
            xpRef.current.push({
                id: Math.random(),
                x: e.x, y: e.y,
                amt: config.xp,
                size: 8
            });
            // Explosion
            for (let i = 0; i < 5; i++) {
                particlesRef.current.push({
                    id: Math.random(),
                    x: e.x, y: e.y,
                    vx: (Math.random() - 0.5) * 10,
                    vy: (Math.random() - 0.5) * 10,
                    life: 1, color: config.color
                });
            }
        });

        // XP Collection
        xpRef.current = xpRef.current.filter(gem => {
            const dx = p.x - gem.x;
            const dy = p.y - gem.y;
            const d = Math.sqrt(dx * dx + dy * dy);

            if (d < 150) { // Vacuum range
                gem.x += (dx / d) * 10;
                gem.y += (dy / d) * 10;
            }

            if (d < 25) {
                setXp(pxp => {
                    const next = pxp + gem.amt;
                    if (next >= XP_NEEDED(level)) {
                        setXp(0);
                        setLevel(l => l + 1);
                        handleLevelUp();
                    }
                    return next;
                });
                return false;
            }
            return true;
        });

        // --- PROJECTILES ---
        projectilesRef.current.forEach(proj => {
            proj.x += proj.vx * dt;
            proj.y += proj.vy * dt;
            proj.life -= dt;

            // Collision with enemies
            enemiesRef.current.forEach(e => {
                const dx = proj.x - e.x;
                const dy = proj.y - e.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < proj.size + e.size / 2) {
                    e.hp -= proj.dmg;
                    proj.life = 0; // Destroy projectile
                    particlesRef.current.push({
                        id: Math.random(),
                        x: proj.x, y: proj.y,
                        vx: 0, vy: 0, life: 0.3, color: '#22d3ee', size: 10, type: 'hit'
                    });
                }
            });
        });
        projectilesRef.current = projectilesRef.current.filter(p => p.life > 0);

        // --- PARTICLES ---
        particlesRef.current.forEach(part => {
            part.x += (part.vx || 0);
            part.y += (part.vy || 0);
            part.life -= 0.02;
        });
        particlesRef.current = particlesRef.current.filter(p => p.life > 0);

        setRenderTrigger(prev => prev + 1);
        requestRef.current = requestAnimationFrame(gameLoop);
    }, [gameState, time, spawnEnemy, level, upgrades, handleLevelUp]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(requestRef.current);
    }, [gameLoop]);

    const startGame = () => {
        setGameState('playing');
        setHealth(100);
        setLevel(1);
        setXp(0);
        setTime(0);
        setUpgrades({ firewall: 0, encryption: 0, patch: 0, speed: 0, clock: 0, shotgun: 1 });
        playerRef.current = { x: GAME_W / 2, y: GAME_H / 2, size: 32 };
        enemiesRef.current = [];
        projectilesRef.current = [];
        xpRef.current = [];
        particlesRef.current = [];
        firewallPulseRef.current = { active: false, radius: 0 };
        shotgunTimerRef.current = 0;
        lastTimeRef.current = Date.now();
        frameCountRef.current = 0;
    };

    const fireShotgun = () => {
        const p = playerRef.current;
        const mp = mousePosRef.current;
        const dx = mp.x - p.x;
        const dy = mp.y - p.y;
        const angle = Math.atan2(dy, dx);

        const count = 4 + upgrades.shotgun * 2;
        const spread = 0.5; // radians
        const speed = 400;
        const cooldown = Math.max(0.2, 0.8 - upgrades.shotgun * 0.1);

        for (let i = 0; i < count; i++) {
            const randomOffset = (Math.random() - 0.5) * spread;
            const finalAngle = angle + randomOffset;
            projectilesRef.current.push({
                id: Math.random(),
                x: p.x,
                y: p.y,
                vx: Math.cos(finalAngle) * speed,
                vy: Math.sin(finalAngle) * speed,
                dmg: 40 + upgrades.shotgun * 10,
                size: 4,
                life: 0.8
            });
        }

        shotgunTimerRef.current = cooldown;

        // Muzzle flash particles
        for (let i = 0; i < 10; i++) {
            particlesRef.current.push({
                id: Math.random(),
                x: p.x + Math.cos(angle) * 20,
                y: p.y + Math.sin(angle) * 20,
                vx: Math.cos(angle + (Math.random() - 0.5)) * 5,
                vy: Math.sin(angle + (Math.random() - 0.5)) * 5,
                life: 0.5,
                color: '#22d3ee'
            });
        }
    };

    const pickUpgrade = (id) => {
        setUpgrades(prev => ({ ...prev, [id]: prev[id] + 1 }));
        setGameState('playing');
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/50 to-cyan-50/30 p-6 animate-fade-in relative">
            {/* HUD Top */}
            <div className="w-full max-w-[900px] flex justify-between items-center mb-4 z-10">
                <div className="flex flex-col">
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <span className="text-cyan-400">CORE SERVER</span>
                        <span className="text-slate-400 text-xs px-2 py-0.5 border border-slate-200 rounded">v{level}.0</span>
                    </h2>
                    <div className="w-48 h-2 bg-white rounded-full mt-2 overflow-hidden border border-slate-200">
                        <div
                            className="h-full bg-cyan-400 transition-all duration-300 shadow-[0_0_10px_#22d3ee]"
                            style={{ width: `${(xp / XP_NEEDED(level)) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <div className="text-slate-900 font-mono text-3xl font-black tracking-tighter">
                        {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest">Digital Storm Duration</div>
                </div>

                <div className="flex gap-4">
                    <div className="text-right">
                        <div className="text-slate-500 text-[10px] uppercase tracking-widest italic">System Integrity</div>
                        <div className="text-2xl font-black text-emerald-400 tabular-nums">{Math.ceil(health)}%</div>
                    </div>
                    <button onClick={onBack} className="px-4 py-2 border border-slate-200 text-slate-500 hover:text-slate-900 rounded text-xs transition-colors">BACK</button>
                </div>
            </div>

            {/* Game Canvas */}
            <div
                className="relative bg-slate-50 border border-slate-900 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/5 cursor-crosshair"
                style={{ width: GAME_W, height: GAME_H }}
                onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    mousePosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                }}
                onClick={() => {
                    if (gameState === 'playing' && upgrades.shotgun > 0 && shotgunTimerRef.current <= 0) {
                        fireShotgun();
                    }
                }}
            >
                {/* Visual Grid */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }} />

                {/* Game Elements */}
                {gameState !== 'start' && (
                    <>
                        {/* XP Gems */}
                        {xpRef.current.map(gem => (
                            <div
                                key={gem.id}
                                className="absolute bg-indigo-500 rounded-sm rotate-45 shadow-[0_0_8px_#6366f1]"
                                style={{ left: gem.x, top: gem.y, width: gem.size, height: gem.size }}
                            />
                        ))}

                        {/* Projectiles */}
                        {projectilesRef.current.map(proj => (
                            <div
                                key={proj.id}
                                className="absolute bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"
                                style={{
                                    left: proj.x, top: proj.y,
                                    width: proj.size * 2, height: proj.size * 2,
                                    transform: 'translate(-50%, -50%)'
                                }}
                            />
                        ))}

                        {/* Particles */}
                        {particlesRef.current.map(p => (
                            <div
                                key={p.id}
                                className="absolute rounded-full pointer-events-none"
                                style={{
                                    left: p.x, top: p.y,
                                    width: p.type === 'hit' ? p.size : 4,
                                    height: p.type === 'hit' ? p.size : 4,
                                    backgroundColor: p.color,
                                    opacity: p.life,
                                    transform: `translate(-50%, -50%) scale(${p.type === 'hit' ? 0.5 + p.life : p.life})`,
                                    boxShadow: `0 0 10px ${p.color}`
                                }}
                            />
                        ))}

                        {/* Firewall Pulse */}
                        {firewallPulseRef.current.active && (
                            <div
                                className="absolute rounded-full border-4 border-orange-500/30 bg-orange-500/5 pointer-events-none"
                                style={{
                                    left: playerRef.current.x,
                                    top: playerRef.current.y,
                                    width: firewallPulseRef.current.radius * 2,
                                    height: firewallPulseRef.current.radius * 2,
                                    transform: 'translate(-50%, -50%)',
                                    boxShadow: '0 0 30px rgba(249,115,22,0.2)'
                                }}
                            />
                        )}

                        {/* Drone (Visual Helper) */}
                        {upgrades.patch > 0 && (
                            <div
                                className="absolute w-4 h-4 rounded-full bg-emerald-400 shadow-[0_0_15px_#10b981] animate-pulse pointer-events-none"
                                style={{
                                    left: playerRef.current.x + Math.sin(frameCountRef.current * 0.1) * 60,
                                    top: playerRef.current.y + Math.cos(frameCountRef.current * 0.1) * 60,
                                    transform: 'translate(-50%, -50%)'
                                }}
                            />
                        )}

                        {/* Enemies */}
                        {enemiesRef.current.map(e => (
                            <div
                                key={e.id}
                                className="absolute transition-transform duration-100"
                                style={{
                                    left: e.x, top: e.y,
                                    width: e.size, height: e.size,
                                    transform: 'translate(-50%, -50%)'
                                }}
                            >
                                <PacketSVG type={e.type} />
                                {/* Enemy HP Bar */}
                                {e.hp < e.maxHp && (
                                    <div className="absolute top-[-10px] left-0 w-full h-1 bg-white rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500" style={{ width: `${(e.hp / e.maxHp) * 100}%` }} />
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Player */}
                        <div
                            className="absolute"
                            style={{
                                left: playerRef.current.x, top: playerRef.current.y,
                                width: playerRef.current.size, height: playerRef.current.size,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            <ServerSVG healthPercent={health} shieldLevel={upgrades.encryption} />
                        </div>

                        {/* Aim Reticle */}
                        {upgrades.shotgun > 0 && (
                            <div
                                className="absolute pointer-events-none"
                                style={{
                                    left: mousePosRef.current.x, top: mousePosRef.current.y,
                                    transform: 'translate(-50%, -50%)'
                                }}
                            >
                                <svg width="30" height="30" viewBox="0 0 30 30">
                                    <circle cx="15" cy="15" r="10" fill="none" stroke="#22d3ee" strokeWidth="1" strokeDasharray="2 2" />
                                    <line x1="15" y1="5" x2="15" y2="10" stroke="#22d3ee" strokeWidth="2" />
                                    <line x1="15" y1="20" x2="15" y2="25" stroke="#22d3ee" strokeWidth="2" />
                                    <line x1="5" y1="15" x2="10" y2="15" stroke="#22d3ee" strokeWidth="2" />
                                    <line x1="20" y1="15" x2="25" y2="15" stroke="#22d3ee" strokeWidth="2" />
                                    <circle cx="15" cy="15" r="1" fill="#22d3ee" />
                                </svg>
                            </div>
                        )}
                    </>
                )}

                {/* Overlays */}
                {gameState === 'start' && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center p-12 text-center animate-fade-in">
                        <div className="w-24 h-24 mb-6">
                            <ServerSVG healthPercent={100} shieldLevel={0} />
                        </div>
                        <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4">Botnet Survivors</h3>
                        <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
                            You are the core server under a global DDoS attack. Thousands of malicious packets are swarming your endpoint. Use <span className="text-cyan-400 font-bold">WASD</span> to maneuver. Survive the 3-minute storm through layered defense.
                        </p>
                        <button
                            onClick={startGame}
                            className="px-12 py-4 bg-cyan-600 hover:bg-cyan-500 text-slate-900 font-black text-xl rounded-xl uppercase tracking-widest transition-all shadow-[0_0_30px_rgba(8,145,178,0.4)]"
                        >
                            Deploy Infrastructure
                        </button>
                    </div>
                )}

                {gameState === 'levelup' && (
                    <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-fade-in">
                        <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase italic">Level Up</h3>
                        <p className="text-cyan-400 text-xs font-mono mb-10 tracking-[0.3em] uppercase">Choose Security Protocol Enhancement</p>

                        <div className="flex gap-4">
                            {upgradeChoices.map(u => (
                                <div
                                    key={u.id}
                                    onClick={() => pickUpgrade(u.id)}
                                    className="w-[200px] p-5 bg-white border border-slate-200 rounded-2xl hover:border-cyan-500/50 hover:bg-slate-200 transition-all group cursor-pointer text-center relative overflow-hidden"
                                >
                                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{u.icon}</div>
                                    <h4 className={`font-black uppercase tracking-tight mb-2 ${u.color}`}>{u.name}</h4>
                                    <p className="text-slate-500 text-xs mb-4 leading-relaxed">{u.description}</p>
                                    <div className="flex justify-center gap-1">
                                        {[...Array(u.maxLevel)].map((_, i) => (
                                            <div key={i} className={`w-3 h-1.5 rounded-sm ${i < upgrades[u.id] ? 'bg-cyan-400' : 'bg-slate-300'}`} />
                                        ))}
                                    </div>
                                    <div className="mt-4 text-[10px] font-mono text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase">Initialize →</div>
                                </div>
                            ))}
                            {upgradeChoices.length === 0 && (
                                <div className="text-slate-500 font-mono italic">All systems fully optimized.</div>
                            )}
                        </div>
                    </div>
                )}

                {gameState === 'over' && (
                    <div className="absolute inset-0 bg-red-950/95 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center animate-fade-in">
                        <span className="text-7xl mb-6 grayscale opacity-50">💀</span>
                        <h3 className="text-5xl font-black text-red-500 uppercase tracking-tighter mb-2">Endpoint Compromised</h3>
                        <p className="text-red-400 font-mono text-sm mb-10">CORE_FILE_SERVER_IS_OFFLINE</p>
                        <div className="grid grid-cols-2 gap-8 mb-10 bg-black/30 p-6 rounded-2xl border border-red-400/40">
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-slate-500">Duration</div>
                                <div className="text-2xl font-black text-slate-900">{Math.floor(time / 60)}:{(time % 60).toString().padStart(2, '0')}</div>
                            </div>
                            <div>
                                <div className="text-[10px] uppercase tracking-widest text-slate-500">Rank</div>
                                <div className="text-2xl font-black text-slate-900">{level}</div>
                            </div>
                        </div>
                        <button
                            onClick={startGame}
                            className="px-10 py-3 bg-red-900 text-slate-900 border border-red-500 rounded-lg hover:bg-red-800 transition-all font-black"
                        >
                            REBOOT INFRASTRUCTURE
                        </button>

                        <div className="mt-8 w-full max-w-lg bg-slate-100/80 border border-red-400/40 rounded-xl p-4 text-left">
                            <h4 className="text-red-400 font-bold uppercase text-[10px] tracking-widest mb-3">Defensive Posture Analysis</h4>
                            <div className="space-y-3 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
                                {Object.entries(upgrades).filter(([id, lvl]) => lvl > 0).map(([id, lvl]) => {
                                    const tip = TIPS.find(t =>
                                        t.title.toLowerCase().includes(id) ||
                                        (id === 'speed' && t.title.includes('Bandwidth')) ||
                                        (id === 'clock' && t.title.includes('Processor')) ||
                                        (id === 'shotgun' && t.title.includes('Shredder'))
                                    );
                                    if (!tip) return null;
                                    return (
                                        <div key={id} className="border-l-2 border-red-500/30 pl-3">
                                            <div className="text-slate-900 font-bold text-[11px] uppercase">{tip.title}</div>
                                            <div className="text-slate-500 text-[10px] leading-relaxed mt-0.5">{tip.text}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {gameState === 'won' && (
                    <div className="absolute inset-0 bg-emerald-950/95 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center animate-fade-in">
                        <div className="w-32 h-32 mb-8 animate-bounce">
                            <ServerSVG healthPercent={100} shieldLevel={1} />
                        </div>
                        <h3 className="text-5xl font-black text-emerald-400 uppercase tracking-tighter mb-4">Threat Neutralized</h3>
                        <p className="text-slate-900 text-xl font-medium leading-relaxed max-w-lg mb-10">
                            You successfully defended the core server against the botnet swarm using a <span className="text-cyan-400">Defense in Depth</span> strategy.
                        </p>
                        <button
                            onClick={onBack}
                            className="px-12 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xl rounded-xl uppercase tracking-widest transition-all"
                        >
                            RETRIEVE MISSION LOGS
                        </button>

                        <div className="mt-8 w-full max-w-lg bg-slate-100/80 border border-emerald-400/40 rounded-xl p-4 text-left">
                            <h4 className="text-emerald-400 font-bold uppercase text-[10px] tracking-widest mb-3">Success Criteria: Layered Defense Summary</h4>
                            <div className="space-y-3 overflow-y-auto max-h-[200px] pr-2 custom-scrollbar">
                                {Object.entries(upgrades).filter(([id, lvl]) => lvl > 0).map(([id, lvl]) => {
                                    const tip = TIPS.find(t =>
                                        t.title.toLowerCase().includes(id) ||
                                        (id === 'speed' && t.title.includes('Bandwidth')) ||
                                        (id === 'clock' && t.title.includes('Processor')) ||
                                        (id === 'shotgun' && t.title.includes('Shredder'))
                                    );
                                    if (!tip) return null;
                                    return (
                                        <div key={id} className="border-l-2 border-emerald-500/30 pl-3">
                                            <div className="text-slate-900 font-bold text-[11px] uppercase">{tip.title}</div>
                                            <div className="text-slate-500 text-[10px] leading-relaxed mt-0.5">{tip.text}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls Info */}
            <div className="mt-8 flex gap-12 text-slate-500 font-mono text-[10px] uppercase tracking-[0.2em]">
                <div className="flex items-center gap-3">
                    <span className="bg-white px-3 py-1 border border-slate-200 rounded text-cyan-400 font-bold">WASD / ARROWS</span>
                    <span>Navigate Endpoint</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-white px-3 py-1 border border-slate-200 rounded text-emerald-400 font-bold">AUTO</span>
                    <span>Deep Packet Mitigation</span>
                </div>
                <div className="flex items-center gap-3 text-cyan-400">
                    <span className="bg-white px-3 py-1 border border-slate-200 rounded font-bold uppercase">Mouse Left</span>
                    <span>Manual Combat (Shredder)</span>
                </div>
            </div>
        </div>
    );
};

export default BotnetSurvivors;
