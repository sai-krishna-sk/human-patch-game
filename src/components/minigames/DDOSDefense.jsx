import React, { useState, useEffect, useCallback, useRef } from 'react';

const GRID_W = 20;
const GRID_H = 12;
const CELL_SIZE = 40; // 800 x 480 game board

// Path nodes (in grid coordinates)
const PATH_NODES = [
    { x: -1, y: 2 },
    { x: 4, y: 2 },
    { x: 4, y: 9 },
    { x: 10, y: 9 },
    { x: 10, y: 3 },
    { x: 16, y: 3 },
    { x: 16, y: 7 },
    { x: 20, y: 7 }
];

const TOWER_TYPES = {
    FIREWALL: { id: 'FIREWALL', name: 'Firewall', cost: 50, range: 120, damage: 20, cooldown: 15, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500', icon: '🧱' },
    RATELIMITER: { id: 'RATELIMITER', name: 'Rate Limiter', cost: 100, range: 100, damage: 10, cooldown: 8, slowFactor: 0.5, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500', icon: '⏱️' },
    WAF: { id: 'WAF', name: 'WAF', cost: 150, range: 160, damage: 50, cooldown: 45, splash: 60, color: 'text-indigo-400', bg: 'bg-indigo-500/20', border: 'border-indigo-500', icon: '🛡️' }
};

const ENEMY_TYPES = {
    BOTNET: { id: 'BOTNET', hp: 50, speed: 2.5, reward: 5, color: '#ef4444', name: 'Botnet Ping', size: 16 },
    VOLUMETRIC: { id: 'VOLUMETRIC', hp: 200, speed: 1.5, reward: 15, color: '#f97316', name: 'DDoS Flood', size: 24 },
    ZERODAY: { id: 'ZERODAY', hp: 50, speed: 4.0, reward: 10, color: '#a855f7', name: '0-Day Exploit', size: 12 },
    BOSS: { id: 'BOSS', hp: 1500, speed: 0.6, reward: 100, color: '#dc2626', name: 'Ransomware Core', size: 36 },
    HEAL: { id: 'HEAL', hp: 99999, speed: 1.5, reward: 0, color: '#22c55e', name: 'Security Patch', size: 16 } // Towers ignore this
};

const INITIAL_BANDWIDTH = 100;
const INITIAL_INTEGRITY = 100;

// Helper to get exact pixel coords for path
const getPathPixels = () => PATH_NODES.map(n => ({ x: n.x * CELL_SIZE + CELL_SIZE / 2, y: n.y * CELL_SIZE + CELL_SIZE / 2 }));
const PATH_PIXELS = getPathPixels();

const DDOSDefense = ({ onBack }) => {
    const [gameState, setGameState] = useState('start'); // start, playing, paused, won, over
    const [bandwidth, setBandwidth] = useState(INITIAL_BANDWIDTH);
    const [integrity, setIntegrity] = useState(INITIAL_INTEGRITY);
    const [wave, setWave] = useState(1);
    const [selectedTower, setSelectedTower] = useState(null);
    const [hoverCell, setHoverCell] = useState(null);
    const [gameSpeed, setGameSpeed] = useState(1); // 0.5x, 1x, 2x, 4x

    const requestRef = useRef();
    const [renderTrigger, setRenderTrigger] = useState(0);

    // Game state refs (mutated in loops)
    const enemiesRef = useRef([]);
    const towersRef = useRef([]);
    const projectilesRef = useRef([]);
    const particlesRef = useRef([]);
    const frameCountRef = useRef(0);
    const waveStateRef = useRef({
        active: false,
        spawnsRemaining: [],
        spawnTimer: 0
    });

    const isPathCell = (gx, gy) => {
        for (let i = 0; i < PATH_NODES.length - 1; i++) {
            const p1 = PATH_NODES[i];
            const p2 = PATH_NODES[i + 1];
            const minX = Math.min(p1.x, p2.x);
            const maxX = Math.max(p1.x, p2.x);
            const minY = Math.min(p1.y, p2.y);
            const maxY = Math.max(p1.y, p2.y);
            if (gx >= minX && gx <= maxX && gy >= minY && gy <= maxY) return true;
        }
        return false;
    };

    const handleGridClick = (gx, gy) => {
        if (gameState !== 'playing' || !selectedTower) return;
        if (isPathCell(gx, gy)) return;

        // Check if tower already exists
        const exists = towersRef.current.find(t => t.gx === gx && t.gy === gy);
        if (exists) return;

        const towerDef = TOWER_TYPES[selectedTower];
        if (bandwidth >= towerDef.cost) {
            setBandwidth(b => b - towerDef.cost);
            towersRef.current.push({
                ...towerDef,
                id: Math.random().toString(),
                gx, gy,
                x: gx * CELL_SIZE + CELL_SIZE / 2,
                y: gy * CELL_SIZE + CELL_SIZE / 2,
                cooldownTimer: 0,
                targetAngle: 0
            });
            setSelectedTower(null);
            spawnParticles(gx * CELL_SIZE + CELL_SIZE / 2, gy * CELL_SIZE + CELL_SIZE / 2, '#22d3ee', 15);
        }
    };

    const spawnParticles = (x, y, color, count = 10) => {
        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                id: Math.random(),
                x, y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1,
                color
            });
        }
    };

    const startNextWave = () => {
        if (waveStateRef.current.active) return;

        let spawns = [];
        // Boss wave every 5 levels
        const isBossWave = wave % 5 === 0;

        // After wave 5, enemy count explodes
        let numEnemies = wave > 5 ? Math.floor(5 + (wave * 4) + Math.pow(wave - 4, 1.8)) : 5 + Math.floor(wave * 4);

        if (isBossWave) {
            numEnemies = Math.floor(numEnemies / 3); // drastically reduce small enemies
            spawns.push(ENEMY_TYPES.BOSS); // Add the boss first
        }

        for (let i = 0; i < numEnemies; i++) {
            let type = ENEMY_TYPES.BOTNET;
            if (wave > 2 && Math.random() < Math.min(0.6, 0.15 + (wave * 0.05))) type = ENEMY_TYPES.VOLUMETRIC;
            if (wave > 4 && Math.random() < Math.min(0.5, 0.1 + (wave * 0.05))) type = ENEMY_TYPES.ZERODAY;
            spawns.push(type);
        }

        // Add 1-2 green heal packets randomly after wave 10
        if (wave > 10) {
            const numHeals = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < numHeals; i++) {
                spawns.splice(Math.floor(Math.random() * spawns.length), 0, ENEMY_TYPES.HEAL);
            }
        }

        waveStateRef.current = {
            active: true,
            spawnsRemaining: spawns,
            spawnTimer: 60
        };
        setWave(w => w + 1);
    };

    const handleDamage = (amt) => {
        setIntegrity(prev => {
            const next = prev - amt;
            if (next <= 0) setGameState('over');
            return next;
        });
    };

    const gameLoop = useCallback(() => {
        if (gameState !== 'playing') {
            requestRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        // Apply game speed: run the inner simulation multiple times if speed > 1
        // If speed < 1, skip frames

        let iters = 1;
        let skipFrame = false;

        if (gameSpeed === 0.5) {
            if (renderTrigger % 2 === 0) skipFrame = true;
        } else {
            iters = gameSpeed;
        }

        if (!skipFrame) {
            for (let i = 0; i < iters; i++) {
                frameCountRef.current++;

                // Spawn logic
                if (waveStateRef.current.active) {
                    if (waveStateRef.current.spawnTimer <= 0 && waveStateRef.current.spawnsRemaining.length > 0) {
                        // Determine how many enemies to spawn this tick (burst spawning)
                        // Wave 1-2: 1 enemy. Wave 3+: 1-2 enemies. Wave 5+: 1-3 enemies.
                        let spawnCount = 1;
                        if (wave > 2 && Math.random() < 0.3) spawnCount = 2;
                        if (wave > 4 && Math.random() < 0.4) spawnCount = Math.floor(Math.random() * 3) + 1; // 1 to 3

                        // Spawn the calculated number of enemies
                        for (let i = 0; i < spawnCount; i++) {
                            if (waveStateRef.current.spawnsRemaining.length === 0) break;

                            const type = waveStateRef.current.spawnsRemaining.shift();

                            // Scale health exponentially after wave 5
                            let healthMultiplier = 1 + ((wave - 1) * 0.15);
                            if (wave > 5) {
                                healthMultiplier = 1 + ((wave - 1) * 0.15) + Math.pow(wave - 4, 1.5) * 0.4;
                            }

                            // Add slight offset so they don't perfectly overlap visually if spawning instantly
                            const offset = (Math.random() - 0.5) * 10;

                            enemiesRef.current.push({
                                ...type,
                                id: Math.random().toString(),
                                pathIndex: 0,
                                x: PATH_PIXELS[0].x + offset,
                                y: PATH_PIXELS[0].y + offset,
                                slowTimer: 0,
                                maxHp: type.hp * healthMultiplier,
                                hp: type.hp * healthMultiplier
                            });
                        }

                        // Spawns get extremely rapid after wave 5
                        const minSpawnRate = wave > 5 ? Math.max(5, 15 - (wave - 5) * 2) : 15;
                        waveStateRef.current.spawnTimer = Math.max(minSpawnRate, 40 + Math.random() * 40 - (wave * 3)); // gets faster and cap speed
                    }
                    if (waveStateRef.current.spawnTimer > 0) {
                        waveStateRef.current.spawnTimer--;
                    }
                    if (waveStateRef.current.spawnsRemaining.length === 0 && enemiesRef.current.length === 0) {
                        waveStateRef.current.active = false; // Wave cleared
                    }
                }

                // Move enemies
                for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
                    const e = enemiesRef.current[i];
                    const target = PATH_PIXELS[e.pathIndex + 1];
                    if (!target) {
                        // Reached end
                        enemiesRef.current.splice(i, 1);

                        if (e.id === 'HEAL') {
                            // Heal the server
                            setIntegrity(prev => Math.min(100, prev + 15));
                            spawnParticles(PATH_PIXELS[PATH_PIXELS.length - 1].x, PATH_PIXELS[PATH_PIXELS.length - 1].y, '#22c55e', 20);
                        } else {
                            handleDamage(e.maxHp / 10); // Deduct integrity based on enemy size
                        }

                        continue;
                    }

                    const dx = target.x - e.x;
                    const dy = target.y - e.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    let currentSpeed = e.speed;
                    if (e.slowTimer > 0) {
                        currentSpeed *= 0.5;
                        e.slowTimer--;
                    }

                    if (dist < currentSpeed) {
                        e.x = target.x;
                        e.y = target.y;
                        e.pathIndex++;
                    } else {
                        e.x += (dx / dist) * currentSpeed;
                        e.y += (dy / dist) * currentSpeed;
                    }
                }

                // Towers acquire targets & shoot
                towersRef.current.forEach(tower => {
                    if (tower.cooldownTimer > 0) tower.cooldownTimer--;

                    // Find closest non-heal enemy in range
                    let target = null;
                    let minDist = tower.range;
                    enemiesRef.current.forEach(e => {
                        if (e.id === 'HEAL') return; // Do not shoot the heal packets

                        const dist = Math.sqrt(Math.pow(e.x - tower.x, 2) + Math.pow(e.y - tower.y, 2));
                        if (dist < minDist) {
                            minDist = dist;
                            target = e;
                        }
                    });

                    if (target) {
                        // Face target
                        tower.targetAngle = Math.atan2(target.y - tower.y, target.x - tower.x) * (180 / Math.PI);

                        if (tower.cooldownTimer <= 0) {
                            tower.cooldownTimer = tower.cooldown;
                            // Shoot projectile
                            projectilesRef.current.push({
                                id: Math.random(),
                                x: tower.x, y: tower.y,
                                targetId: target.id,
                                targetX: target.x, targetY: target.y,
                                damage: tower.damage,
                                slowFactor: tower.slowFactor,
                                splash: tower.splash,
                                color: tower.color.includes('cyan') ? '#22d3ee' : tower.color.includes('indigo') ? '#818cf8' : '#34d399',
                                speed: 18 // Faster projectiles
                            });
                        }
                    }
                });

                // Update projectiles
                for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
                    const p = projectilesRef.current[i];
                    const target = enemiesRef.current.find(e => e.id === p.targetId);
                    const tx = target ? target.x : p.targetX;
                    const ty = target ? target.y : p.targetY;

                    const dx = tx - p.x;
                    const dy = ty - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < p.speed) {
                        // Hit
                        projectilesRef.current.splice(i, 1);

                        // Apply damage
                        const appliesDamage = (enemy, dmg) => {
                            enemy.hp -= dmg;
                            if (p.slowFactor) enemy.slowTimer = 60;
                            if (enemy.hp <= 0) {
                                spawnParticles(enemy.x, enemy.y, enemy.color, 15);
                                setBandwidth(b => b + enemy.reward);
                                return true; // killed
                            }
                            return false;
                        };

                        if (target) {
                            if (p.splash) {
                                spawnParticles(tx, ty, p.color, 20); // big explosion
                                enemiesRef.current.forEach(e => {
                                    if (Math.sqrt(Math.pow(e.x - tx, 2) + Math.pow(e.y - ty, 2)) <= p.splash) {
                                        appliesDamage(e, p.damage);
                                    }
                                });
                            } else {
                                appliesDamage(target, p.damage);
                            }
                        }
                    } else {
                        p.x += (dx / dist) * p.speed;
                        p.y += (dy / dist) * p.speed;
                    }
                }

                // Clean up dead enemies
                enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0);

                // Update particles
                particlesRef.current.forEach(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.life -= 0.04;
                });
                particlesRef.current = particlesRef.current.filter(p => p.life > 0);
            }
        }

        setRenderTrigger(prev => prev + 1);
        requestRef.current = requestAnimationFrame(gameLoop);
    }, [gameState, wave, gameSpeed, renderTrigger]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(requestRef.current);
    }, [gameLoop]);

    const startGame = () => {
        setGameState('playing');
        setBandwidth(INITIAL_BANDWIDTH);
        setIntegrity(INITIAL_INTEGRITY);
        setWave(1);
        enemiesRef.current = [];
        towersRef.current = [];
        projectilesRef.current = [];
        particlesRef.current = [];
        waveStateRef.current = { active: false, spawnsRemaining: [], spawnTimer: 0 };
        setRenderTrigger(0);
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 p-6 animate-fade-in relative z-0">
            {/* Header / HUD */}
            <div className="w-full max-w-5xl flex justify-between items-center mb-6 z-10">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                        <span className="text-3xl animate-pulse text-red-500">🛡️</span>
                        DDoS Defense
                    </h2>
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-widest mt-1">Fortify Core Infrastructure</p>
                </div>

                <div className="flex items-center gap-6 bg-slate-900/80 backdrop-blur-md px-6 py-2 rounded-full border border-slate-700 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-mono uppercase">Wave</span>
                        <span className="text-indigo-400 font-black text-xl tabular-nums leading-none tracking-wider">{wave}</span>
                    </div>
                    <div className="h-8 w-px bg-slate-700 mx-2"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-mono uppercase">Bandwidth</span>
                        <span className="text-emerald-400 font-mono font-bold text-xl tabular-nums leading-none flex items-center gap-1">
                            <span className="text-emerald-600 text-sm">₹</span>{bandwidth}
                        </span>
                    </div>
                    <div className="h-8 w-px bg-slate-700 mx-2"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-mono uppercase">System Integrity</span>
                        <div className="flex items-center gap-2">
                            <span className={`font-mono font-bold text-xl tabular-nums leading-none ${integrity < 30 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                                {Math.max(0, Math.floor(integrity))}%
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onBack}
                    className="px-6 py-2 border border-slate-700 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-mono text-xs uppercase shadow-sm"
                >
                    Abandon Link
                </button>
            </div>

            {/* Main Game Area */}
            <div className="flex gap-6 w-full max-w-5xl relative">

                {/* Tower Selection Menu */}
                <div className="w-64 flex flex-col gap-4">
                    <div className="bg-slate-900/80 border border-slate-700 rounded-xl p-4 shadow-lg backdrop-blur-md">
                        <h3 className="text-slate-400 font-mono text-sm uppercase tracking-widest border-b border-slate-800 pb-2 mb-4">Defense Arsenal</h3>
                        <div className="flex flex-col gap-3">
                            {Object.values(TOWER_TYPES).map(tower => {
                                const canAfford = bandwidth >= tower.cost;
                                const isSelected = selectedTower === tower.id;
                                return (
                                    <div
                                        key={tower.id}
                                        onClick={() => canAfford && setSelectedTower(isSelected ? null : tower.id)}
                                        className={`p-3 rounded-lg border-2 transition-all cursor-pointer flex flex-col gap-2 ${isSelected ? `border-white ${tower.bg}` : canAfford ? `border-slate-700 hover:border-slate-500 bg-slate-800/50` : 'border-slate-800 bg-slate-900/50 opacity-50 cursor-not-allowed'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-200 flex items-center gap-2">
                                                <span>{tower.icon}</span> {tower.name}
                                            </span>
                                            <span className={`text-xs font-mono font-bold ${canAfford ? 'text-emerald-400' : 'text-red-500'}`}>${tower.cost}</span>
                                        </div>
                                        <div className="flex gap-2 text-[10px] uppercase font-mono text-slate-500">
                                            <span>DMG: {tower.damage}</span>
                                            <span>RNG: {tower.range}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex-1 bg-slate-900/50 border border-slate-800 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center backdrop-blur-sm relative">
                        {!waveStateRef.current.active ? (
                            <button
                                onClick={startNextWave}
                                className="w-full py-4 bg-indigo-500 text-white rounded-lg font-black uppercase tracking-widest hover:bg-indigo-400 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]"
                            >
                                Send Next Wave
                            </button>
                        ) : (
                            <div className="text-slate-400 font-mono text-sm uppercase animate-pulse mb-8">
                                Wave {wave - 1} Active...<br />
                                <span className="text-xs text-slate-600 mt-2 block">Monitoring Traffic</span>
                            </div>
                        )}

                        {/* Speed Controls */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4">
                            {[0.5, 1, 2, 4].map(speed => (
                                <button
                                    key={speed}
                                    onClick={() => setGameSpeed(speed)}
                                    className={`flex-1 py-1 rounded border border-slate-700 text-xs font-mono font-bold transition-all ${gameSpeed === speed ? 'bg-indigo-500/30 text-indigo-300 border-indigo-500' : 'bg-slate-800/50 text-slate-500 hover:text-white'}`}
                                >
                                    {speed}x
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Game Board */}
                <div
                    className="relative bg-slate-950 border-2 border-slate-800 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]"
                    style={{ width: GRID_W * CELL_SIZE, height: GRID_H * CELL_SIZE }}
                    onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const gx = Math.floor((e.clientX - rect.left) / CELL_SIZE);
                        const gy = Math.floor((e.clientY - rect.top) / CELL_SIZE);
                        setHoverCell({ x: gx, y: gy });
                    }}
                    onMouseLeave={() => setHoverCell(null)}
                    onClick={(e) => {
                        if (hoverCell) handleGridClick(hoverCell.x, hoverCell.y);
                    }}
                >
                    {/* Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)]" style={{ backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px` }}></div>

                    {/* Path Visuals */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <polyline
                            points={PATH_PIXELS.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="#0f172a"
                            strokeWidth={CELL_SIZE - 4}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <polyline
                            points={PATH_PIXELS.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="#1e293b"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="10 10"
                            className="animate-[dash_20s_linear_infinite]"
                        />
                    </svg>

                    {/* Server Goal / Core */}
                    <div className="absolute z-10 flex flex-col items-center justify-center animate-pulse"
                        style={{ left: PATH_PIXELS[PATH_PIXELS.length - 1].x - 30, top: PATH_PIXELS[PATH_PIXELS.length - 1].y - 30, width: 60, height: 60 }}>
                        <div className="w-full h-full bg-cyan-500/20 rounded-full absolute blur-md"></div>
                        <div className="text-4xl">🖧</div>
                    </div>

                    {/* Hover indicator */}
                    {hoverCell && selectedTower && (
                        <div
                            className={`absolute flex items-center justify-center border-2 border-dashed z-20 transition-colors ${isPathCell(hoverCell.x, hoverCell.y) || towersRef.current.some(t => t.gx === hoverCell.x && t.gy === hoverCell.y) ? 'bg-red-500/20 border-red-500' : 'bg-emerald-500/20 border-emerald-500'}`}
                            style={{ left: hoverCell.x * CELL_SIZE, top: hoverCell.y * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}
                        >
                            <div
                                className="absolute rounded-full border border-white/20 bg-white/5 pointer-events-none"
                                style={{
                                    width: TOWER_TYPES[selectedTower].range * 2,
                                    height: TOWER_TYPES[selectedTower].range * 2,
                                    transform: 'translate(-50%, -50%)',
                                    left: '50%', top: '50%'
                                }}
                            ></div>
                        </div>
                    )}

                    {/* rendering from refs */}
                    {gameState !== 'start' && (
                        <div className="absolute inset-0 pointer-events-none z-30">

                            {/* Towers */}
                            {towersRef.current.map(tower => (
                                <div key={tower.id} className="absolute flex items-center justify-center" style={{ left: tower.gx * CELL_SIZE, top: tower.gy * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}>
                                    <div className={`w-3/4 h-3/4 ${tower.bg} border ${tower.border} rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
                                        <div
                                            className="text-lg transition-transform"
                                            style={{ transform: `rotate(${tower.targetAngle}deg)` }}
                                        >
                                            {tower.icon}
                                        </div>
                                    </div>
                                    {/* firing animation */}
                                    {tower.cooldownTimer === tower.cooldown - 1 && (
                                        <div className="absolute inset-0 border-2 border-white rounded-lg animate-ping opacity-50"></div>
                                    )}
                                </div>
                            ))}

                            {/* Enemies */}
                            {enemiesRef.current.map(enemy => (
                                <div key={enemy.id} className="absolute flex items-center justify-center" style={{ left: enemy.x - CELL_SIZE / 2, top: enemy.y - CELL_SIZE / 2, width: CELL_SIZE, height: CELL_SIZE }}>
                                    <div
                                        className="rounded shadow-[0_0_10px_currentColor]"
                                        style={{
                                            width: enemy.size, height: enemy.size,
                                            backgroundColor: enemy.slowTimer > 0 ? '#67e8f9' : enemy.color,
                                            color: enemy.color
                                        }}
                                    ></div>
                                    {/* HP Bar */}
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-slate-800 rounded overflow-hidden">
                                        <div className="h-full bg-red-500" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}></div>
                                    </div>
                                </div>
                            ))}

                            {/* Projectiles */}
                            {projectilesRef.current.map(p => (
                                <div key={p.id} className="absolute rounded-full" style={{ left: p.x - 3, top: p.y - 3, width: 6, height: 6, backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}` }}></div>
                            ))}

                            {/* Particles */}
                            {particlesRef.current.map(p => (
                                <div key={p.id} className="absolute rounded-sm" style={{ left: p.x, top: p.y, width: 4, height: 4, backgroundColor: p.color, opacity: p.life, transform: `scale(${p.life})`, boxShadow: `0 0 5px ${p.color}` }}></div>
                            ))}

                        </div>
                    )}
                </div>

            </div>

            {/* Overlays */}
            {gameState === 'start' && (
                <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center z-50 backdrop-blur-md">
                    <div className="bg-slate-900 border-2 border-cyan-500/30 p-10 rounded-3xl flex flex-col items-center text-center max-w-lg shadow-[0_0_50px_rgba(34,211,238,0.2)]">
                        <div className="text-6xl mb-6">🌐</div>
                        <h3 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">DDoS Defense Array</h3>
                        <p className="text-slate-400 mb-8">
                            Malicious traffic is attempting to overwhelm the core server. Build defenses on the grid to filter and drop malicious packets before they reach the core.
                        </p>
                        <button
                            onClick={startGame}
                            className="px-10 py-4 bg-cyan-600 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                        >
                            Initialize Defenses
                        </button>
                    </div>
                </div>
            )}

            {gameState === 'over' && (
                <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center z-50 backdrop-blur-md">
                    <div className="bg-red-900/40 border border-red-500/50 p-8 rounded-2xl flex flex-col items-center text-center max-w-sm">
                        <span className="text-5xl mb-4 animate-bounce text-red-500">💥</span>
                        <h3 className="text-3xl font-black text-white mb-2 uppercase">Server Down</h3>
                        <p className="text-red-200 mb-6">The core infrastructure was overwhelmed by traffic.</p>
                        <p className="text-slate-300 font-mono text-xs mb-8">Waves survived: {wave - 1}</p>
                        <button
                            onClick={startGame}
                            className="px-8 py-3 bg-red-600 text-white rounded hover:bg-red-500 transition-all uppercase tracking-widest font-bold font-mono text-sm shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                        >
                            Reboot Array
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DDOSDefense;
