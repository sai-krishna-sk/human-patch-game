import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- GAME CONSTANTS & CONFIG ---
const WEAPONS = {
    PISTOL: { id: 'PISTOL', name: 'Basic Blaster', cost: 0, fireRate: 0.3, spread: 0.05, speed: 600, dmg: 15, pierce: 1, count: 1, auto: false, color: '#0ea5e9' },
    MACHINE_GUN: { id: 'MACHINE_GUN', name: 'Chain-Gun', cost: 150, fireRate: 0.1, spread: 0.15, speed: 800, dmg: 12, pierce: 1, count: 1, auto: true, color: '#f59e0b' },
    SHOTGUN: { id: 'SHOTGUN', name: 'Spread Gun', cost: 250, fireRate: 0.6, spread: 0.4, speed: 500, dmg: 18, pierce: 2, count: 5, auto: false, color: '#f97316' },
    LASER: { id: 'LASER', name: 'Railgun', cost: 600, fireRate: 0.75, spread: 0, speed: 1800, dmg: 80, pierce: 99, count: 1, auto: false, color: '#8b5cf6' }
};

const ENEMY_TYPES = {
    TCP_FLOOD: { type: 'TCP_FLOOD', hp: 15, speed: 120, color: '#ef4444', size: 16, reward: 2 },
    SYN_STORM: { type: 'SYN_STORM', hp: 40, speed: 85, color: '#f97316', size: 22, reward: 5 },
    UDP_BOMB: { type: 'UDP_BOMB', hp: 120, speed: 55, color: '#e11d48', size: 30, reward: 15 },
    ZERO_DAY: { type: 'ZERO_DAY', hp: 300, speed: 70, color: '#8b5cf6', size: 40, reward: 50 }
};

// --- AUDIO HELPERS ---
const audioCtxRef = { current: null };
function getAudioCtx() {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtxRef.current;
}
function playTone(freq, duration, type = 'square', vol = 0.05, endFreq = null) {
    try {
        const ctx = getAudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + duration);
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duration);
    } catch (e) { }
}
function playNoise(duration, vol = 0.05, lowPass = null) {
    try {
        const ctx = getAudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        let lastNode = noise;
        if (lowPass) {
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(lowPass, ctx.currentTime);
            lastNode.connect(filter);
            lastNode = filter;
        }
        lastNode.connect(gain);
        gain.connect(ctx.destination);
        noise.start();
    } catch (e) { }
}

// Specialized SFX
const sfx = {
    shoot: (key, volScale = 1) => {
        if (key === 'PISTOL') playTone(800, 0.05, 'sine', 0.02 * volScale, 200);
        else if (key === 'MACHINE_GUN') playTone(400, 0.08, 'square', 0.01 * volScale, 100);
        else if (key === 'SHOTGUN') {
            playTone(200, 0.1, 'sawtooth', 0.02 * volScale, 50);
            playNoise(0.05, 0.01 * volScale, 1000);
        }
        else if (key === 'LASER') playTone(100, 0.3, 'sine', 0.02 * volScale, 1200);
    },
    hit: () => playNoise(0.1, 0.06, 400),
    kill: () => {
        playTone(300, 0.1, 'sawtooth', 0.03, 50);
        playNoise(0.05, 0.02, 2000);
    },
    buy: () => {
        playTone(440, 0.1, 'sine', 0.05, 880);
        setTimeout(() => playTone(880, 0.15, 'sine', 0.05, 1200), 100);
    },
    deny: () => playTone(150, 0.2, 'square', 0.05, 100),
    explode: () => {
        playNoise(0.6, 0.15, 500);
        playTone(60, 0.5, 'sine', 0.1, 20);
    },
    beep: (f = 800) => playTone(f, 0.05, 'sine', 0.04)
};
// Map old style for backward compatibility if needed or just replace all
function sfxBuy() { sfx.buy(); }
function sfxExplode() { sfx.explode(); }
function sfxKill() { sfx.kill(); }
function sfxHit() { sfx.hit(); }
function sfxShoot(key = 'PISTOL', volScale = 1) { sfx.shoot(key, volScale); }

// --- DRAWING HELPERS ---
const drawHexagon = (ctx, x, y, r) => {
    if (!r || r < 0) return;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const px = x + r * Math.cos(angle);
        const py = y + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
};

const drawCyberSentinel = (ctx, p, time, health) => {
    const { x, y, size, angle, tiltX = 0, tiltY = 0 } = p;
    ctx.save();
    ctx.translate(x, y);
    
    // Smooth tilting based on movement
    ctx.rotate(tiltX * 0.15);
    
    // 1. Shadow / Ground Glow
    const glow = 0.5 + Math.sin(time * 0.005) * 0.2;
    const coreColor = health > 30 ? '#0ea5e9' : '#ef4444';
    ctx.shadowBlur = 15 * glow;
    ctx.shadowColor = coreColor;
    
    // 2. Main Hull (Metallic Gradient)
    const hullGrad = ctx.createLinearGradient(-size/2, -size/2, size/2, size/2);
    hullGrad.addColorStop(0, '#f8fafc');
    hullGrad.addColorStop(0.5, '#cbd5e1');
    hullGrad.addColorStop(1, '#94a3b8');
    
    // Body Hexagon
    drawHexagon(ctx, 0, 0, size / 2);
    ctx.fillStyle = hullGrad;
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Tactical Wings (Tilt with movement)
    ctx.shadowBlur = 0;
    const wingY = Math.sin(time * 0.008) * 2;
    
    // Left Wing
    ctx.save();
    ctx.translate(-size/2 - 2, wingY);
    ctx.rotate(-0.2 + tiltY * 0.1);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-8, - size/4, 8, size/2);
    ctx.strokeStyle = coreColor;
    ctx.strokeRect(-8, - size/4, 8, size/2);
    ctx.restore();

    // Right Wing
    ctx.save();
    ctx.translate(size/2 + 2, -wingY);
    ctx.rotate(0.2 - tiltY * 0.1);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, - size/4, 8, size/2);
    ctx.strokeStyle = coreColor;
    ctx.strokeRect(0, - size/4, 8, size/2);
    ctx.restore();

    // 4. Glowing Core
    ctx.shadowBlur = 12 + Math.sin(time * 0.02) * 5;
    ctx.shadowColor = coreColor;
    ctx.beginPath();
    ctx.arc(0, 0, size / 4, 0, Math.PI * 2);
    ctx.fillStyle = coreColor;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 5. Orbital Ring (Dashed)
    ctx.rotate(angle);
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, size / 2 + 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
};

const drawTechnoDrone = (ctx, e, time, pPos) => {
    const { x, y, size, type, hp, maxHp, angle } = e;
    const cfg = ENEMY_TYPES[type];
    const color = cfg.color;
    
    ctx.save();
    ctx.translate(x, y);

    const pulse = 0.8 + Math.sin(time * 0.01 + x) * 0.2;
    
    if (type === 'TCP_FLOOD') {
        // Sleek Angular Scout
        if (pPos) ctx.rotate(Math.atan2(pPos.y - y, pPos.x - x));
        ctx.beginPath();
        ctx.moveTo(size/2, 0);
        ctx.lineTo(-size/2, -size/3);
        ctx.lineTo(-size/4, 0);
        ctx.lineTo(-size/2, size/3);
        ctx.closePath();
        
        const grad = ctx.createLinearGradient(-size/2, 0, size/2, 0);
        grad.addColorStop(0, '#1e293b');
        grad.addColorStop(1, '#334155');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Glowing Eye
        ctx.shadowBlur = 8 * pulse;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(size/4, 0, 3, 0, Math.PI * 2); ctx.fill();
    } 
    else if (type === 'SYN_STORM') {
        // Industrial Pod
        ctx.rotate(time * 0.002);
        drawHexagon(ctx, 0, 0, size/2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Rotating Shields
        for(let i=0; i<3; i++) {
            ctx.rotate(Math.PI * 2 / 3);
            ctx.fillStyle = '#334155';
            ctx.fillRect(size/2 - 2, -4, 6, 8);
            ctx.strokeStyle = '#ffffff';
            ctx.strokeRect(size/2 - 2, -4, 6, 8);
        }

        // Center Pulse
        ctx.shadowBlur = 12 * pulse;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(0, 0, size/5, 0, Math.PI * 2); ctx.fill();
    }
    else if (type === 'UDP_BOMB') {
        // Heavy Octagon Pod
        const sides = 8;
        ctx.beginPath();
        for(let i=0; i<sides; i++) {
            const a = (Math.PI * 2 / sides) * i;
            ctx.lineTo(Math.cos(a) * size/2, Math.sin(a) * size/2);
        }
        ctx.closePath();
        ctx.fillStyle = '#1e293b';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Inner Plates
        ctx.beginPath();
        for(let i=0; i<sides; i++) {
            const a = (Math.PI * 2 / sides) * i;
            ctx.lineTo(Math.cos(a) * size/3, Math.sin(a) * size/3);
        }
        ctx.closePath();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.stroke();

        // Pulsing Danger Core
        ctx.shadowBlur = 15 * pulse;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(0, 0, size/6, 0, Math.PI * 2); ctx.fill();
    }
    else if (type === 'ZERO_DAY') {
        // Boss: Ransomware Core
        const rot = time * 0.001;
        
        // Multiple Outer Rings
        ctx.shadowBlur = 0;
        for(let i=0; i<3; i++) {
            ctx.save();
            ctx.rotate(rot * (i+1) * 0.5);
            ctx.beginPath();
            ctx.arc(0, 0, size/2 + i*8, 0, Math.PI * 1.5);
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }

        // Main Geometric Core
        ctx.rotate(-rot);
        drawHexagon(ctx, 0, 0, size/2.5);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Internal "Gears"
        ctx.rotate(rot * 2);
        for(let i=0; i<6; i++) {
            ctx.rotate(Math.PI/3);
            ctx.fillStyle = color;
            ctx.fillRect(size/8, -2, size/6, 4);
        }
        
        ctx.shadowBlur = 20 * pulse;
        ctx.shadowColor = color;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(0, 0, size/10, 0, Math.PI * 2); ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();

    // Modern Healthbar
    if (hp < maxHp) {
        const barWidth = size + 4;
        ctx.fillStyle = 'rgba(226, 232, 240, 0.5)';
        ctx.beginPath(); 
        if (ctx.roundRect) ctx.roundRect(x - barWidth / 2, y - size / 2 - 12, barWidth, 4, 2); 
        else ctx.rect(x - barWidth / 2, y - size / 2 - 12, barWidth, 4);
        ctx.fill();
        
        ctx.fillStyle = color;
        ctx.beginPath(); 
        if (ctx.roundRect) ctx.roundRect(x - barWidth / 2, y - size / 2 - 12, barWidth * (hp / maxHp), 4, 2);
        else ctx.rect(x - barWidth / 2, y - size / 2 - 12, barWidth * (hp / maxHp), 4);
        ctx.fill();
    }
};

const drawRoundedRect = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
};

// --- MAIN COMPONENT ---
export default function BotnetSurvivors({ onBack }) {
    // UI State
    const [gameState, setGameState] = useState('start');
    const [health, setHealth] = useState(100);
    const [money, setMoney] = useState(0);
    const [wave, setWave] = useState(1);
    const [weaponId, setWeaponId] = useState('PISTOL');
    const [unlockedWeapons, setUnlockedWeapons] = useState(['PISTOL']);
    const [unlockedTurrets, setUnlockedTurrets] = useState(0);
    const [remainingEnemies, setRemainingEnemies] = useState(0);
    const [weaponLevels, setWeaponLevels] = useState({ PISTOL: 1, MACHINE_GUN: 1, SHOTGUN: 1, LASER: 1 });
    const [turretLevel, setTurretLevel] = useState(1);
    const [landmines, setLandmines] = useState(0);

    // Canvas & Game Loop Refs
    const canvasRef = useRef(null);
    const requestRef = useRef();
    const lastTimeRef = useRef(0);
    const containerRef = useRef(null);
    const bgmRef = useRef(null);
    const [canvasSize, setCanvasSize] = useState({ w: 900, h: 600 });

    // Game Entities
    const playerRef = useRef({ x: 450, y: 300, size: 28, speed: 240, angle: 0, tiltX: 0, tiltY: 0, vx: 0, vy: 0 });
    const enemiesRef = useRef([]);
    const projectilesRef = useRef([]);
    const particlesRef = useRef([]);

    // Environment
    const obstaclesRef = useRef([]);
    const turretsRef = useRef([]);
    const honeypotsRef = useRef([]);

    // Input & Wave Management
    const keysRef = useRef({});
    const mousePosRef = useRef({ x: 0, y: 0 });
    const isMouseDownRef = useRef(false);
    const shootTimerRef = useRef(0);
    const screenShakeRef = useRef(0);

    const waveEnemyQueueRef = useRef([]);
    const spawnTimerRef = useRef(0);
    const moneyRef = useRef(0);
    const healthRef = useRef(100);

    const updateMoney = (amt) => { moneyRef.current += amt; setMoney(moneyRef.current); };
    const updateHealth = (amt) => {
        healthRef.current = Math.max(0, Math.min(100, healthRef.current + amt));
        setHealth(healthRef.current);
        if (healthRef.current <= 0) {
            setGameState('over');
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }
    };

    // --- RESPONSIVE CANVAS ---
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setCanvasSize({ w: Math.floor(rect.width), h: Math.floor(rect.height) });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        
        // Initialize Background Music
        if (!bgmRef.current) {
            bgmRef.current = new Audio('/audio/Cyber-Command Network.mp3');
            bgmRef.current.loop = true;
            bgmRef.current.volume = 0.15;
        }

        return () => {
            window.removeEventListener('resize', updateSize);
            if (bgmRef.current) {
                bgmRef.current.pause();
                bgmRef.current = null;
            }
        };
    }, []);

    // Higher-level BGM Control
    useEffect(() => {
        if (!bgmRef.current) return;

        const targetVolume = gameState === 'playing' ? 0.15 : 0;
        const fadeStep = 0.002; // Slower fade
        const fadeInterval = 20;

        if (gameState === 'playing' && bgmRef.current.paused) {
            bgmRef.current.play().catch(() => {});
        }

        const interval = setInterval(() => {
            if (!bgmRef.current) return;
            const currentVol = bgmRef.current.volume;
            if (Math.abs(currentVol - targetVolume) < fadeStep) {
                bgmRef.current.volume = targetVolume;
                if (targetVolume === 0 && !bgmRef.current.paused) {
                    bgmRef.current.pause();
                }
                clearInterval(interval);
            } else {
                bgmRef.current.volume = Math.max(0, Math.min(1, bgmRef.current.volume + (targetVolume > currentVol ? fadeStep : -fadeStep)));
            }
        }, fadeInterval);

        return () => clearInterval(interval);
    }, [gameState]);

    // Transition cleared to shop
    useEffect(() => {
        if (gameState === 'cleared') {
            const timer = setTimeout(() => {
                setGameState('shop');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [gameState]);

    const startBgm = () => {
        if (bgmRef.current && bgmRef.current.paused && gameState === 'playing') {
            bgmRef.current.play().catch(e => console.log("Audio play blocked", e));
        }
    };

    // --- INPUT LISTENERS ---
    useEffect(() => {
        const cycleWeapon = (dir) => {
            setUnlockedWeapons(prev => {
                const currentIdx = prev.indexOf(weaponId);
                const nextIdx = (currentIdx + dir + prev.length) % prev.length;
                setWeaponId(prev[nextIdx]);
                return prev;
            });
        };

        const kd = (e) => { 
            keysRef.current[e.key.toLowerCase()] = true; 
            if (e.key.toLowerCase() === 'q') cycleWeapon(-1);
            if (e.key.toLowerCase() === 'e') cycleWeapon(1);
            if (e.key === 'Shift') cycleWeapon(1);
            if (e.key === 'Escape' && (gameState === 'playing' || gameState === 'paused')) {
                setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
                if (gameState === 'paused') lastTimeRef.current = performance.now(); // Reset lastTime to avoid jump
            }
            if (e.key.toLowerCase() === 'f' && gameState === 'playing' && landmines > 0) {
                setLandmines(prev => prev - 1);
                const p = playerRef.current;
                honeypotsRef.current.push({ x: p.x, y: p.y, r: 30, active: true, timer: 5, maxTimer: 5, angle: 0 });
                sfxBuy(); // reuse buy sfx for placement feedback
            }
        };
        const ku = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
        window.addEventListener('keydown', kd);
        window.addEventListener('keyup', ku);
        return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); };
    }, [weaponId, unlockedWeapons, gameState, landmines]);

    // --- PROCEDURAL GENERATION ---
    const generateEnvironment = useCallback((W, H) => {
        obstaclesRef.current = []; turretsRef.current = []; honeypotsRef.current = [];
        const padding = 120;
        const playerSafeRadius = 150;
        const centerX = W / 2;
        const centerY = H / 2;

        const isPlayerTooClose = (x, y, w, h) => {
            const testX = Math.max(x, Math.min(centerX, x + w));
            const testY = Math.max(y, Math.min(centerY, y + h));
            const dist = Math.sqrt((centerX - testX) ** 2 + (centerY - testY) ** 2);
            return dist < playerSafeRadius;
        };

        // 1. Maintain 4 Fixed Turret Positions (Rectangle Ratio)
        const tw = W * 0.55;
        const th = H * 0.55;
        const turretPos = [
            { x: centerX - tw / 2, y: centerY - th / 2 },
            { x: centerX + tw / 2, y: centerY - th / 2 },
            { x: centerX - tw / 2, y: centerY + th / 2 },
            { x: centerX + tw / 2, y: centerY + th / 2 }
        ];
        turretPos.forEach((pos, i) => {
            turretsRef.current.push({ ...pos, id: i, size: 24, angle: 0, shootTimer: 0 });
        });

        // 2. Obstacles (Firewalls) - COMPLETELY REMOVED
        obstaclesRef.current = [];

        // 3. Honeypots (Land Mines) - Procedural Spawning REPLACED by player placement
        honeypotsRef.current = [];
    }, []);

    const generateWave = useCallback((waveNum) => {
        const budget = 20 + (waveNum * 15);
        let currentBudget = budget;
        const queue = [];

        while (currentBudget > 0) {
            let options = ['TCP_FLOOD'];
            if (waveNum >= 2) options.push('SYN_STORM');
            if (waveNum >= 4) options.push('UDP_BOMB');
            if (waveNum >= 7) options.push('ZERO_DAY');

            const type = options[Math.floor(Math.random() * options.length)];
            const cost = ENEMY_TYPES[type].reward;

            if (currentBudget >= cost) {
                queue.push(type);
                currentBudget -= cost;
            } else {
                queue.push('TCP_FLOOD');
                currentBudget -= 2;
            }
        }
        queue.sort(() => Math.random() - 0.5);
        waveEnemyQueueRef.current = queue;
    }, []);

    // --- GAME CONTROL ---
    const startGame = useCallback(() => {
        startBgm();
        getAudioCtx().resume();
        healthRef.current = 100; setHealth(100);
        moneyRef.current = 0; setMoney(0);
        setWave(1); setWeaponId('PISTOL');
        setUnlockedWeapons(['PISTOL']);
        setUnlockedTurrets(0);
        setWeaponLevels({ PISTOL: 1, MACHINE_GUN: 1, SHOTGUN: 1, LASER: 1 });
        setTurretLevel(1);
        setLandmines(0);

        playerRef.current = { x: canvasSize.w / 2, y: canvasSize.h / 2, size: 28, speed: 240, angle: 0, tiltX: 0, tiltY: 0, vx: 0, vy: 0 };
        enemiesRef.current = []; projectilesRef.current = []; particlesRef.current = [];

        generateEnvironment(canvasSize.w, canvasSize.h);
        generateWave(1);
        setGameState('playing');
        lastTimeRef.current = performance.now();
    }, [canvasSize, generateEnvironment, generateWave]);

    const nextWave = useCallback(() => {
        const nextW = wave + 1;
        setWave(nextW);
        generateEnvironment(canvasSize.w, canvasSize.h);
        generateWave(nextW);

        playerRef.current.x = canvasSize.w / 2;
        playerRef.current.y = canvasSize.h / 2;
        projectilesRef.current = [];

        setGameState('playing');
        lastTimeRef.current = performance.now();
    }, [wave, canvasSize, generateEnvironment, generateWave]);

    // --- PHYSICS HELPERS ---
    const AABBvsCircle = (rect, cx, cy, cr) => {
        const testX = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
        const testY = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
        const dist = Math.sqrt((cx - testX) ** 2 + (cy - testY) ** 2);
        return dist <= cr;
    };

    const getZoneSpeedModifier = (x, y) => {
        return 1;
    };

    const moveWithCollision = (entity, dx, dy) => {
        entity.x += dx;
        entity.y += dy;
    };

    const triggerShake = (amt) => { screenShakeRef.current = Math.max(screenShakeRef.current, amt); };

    // --- GAME LOOP ---
    const gameLoop = useCallback((time) => {
        if (gameState !== 'playing') return;

        const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
        lastTimeRef.current = time;
        const W = canvasSize.w;
        const H = canvasSize.h;

        const p = playerRef.current;
        const weapon = WEAPONS[weaponId];

        // Spin player outer ring
        p.angle += 2 * dt;

        // 1. Player Movement
        let moveX = 0, moveY = 0;
        if (keysRef.current['w'] || keysRef.current['arrowup']) moveY -= 1;
        if (keysRef.current['s'] || keysRef.current['arrowdown']) moveY += 1;
        if (keysRef.current['a'] || keysRef.current['arrowleft']) moveX -= 1;
        if (keysRef.current['d'] || keysRef.current['arrowright']) moveX += 1;

        if (moveX !== 0 || moveY !== 0) {
            const mag = Math.sqrt(moveX * moveX + moveY * moveY);
            const speedMod = getZoneSpeedModifier(p.x, p.y);
            const targetVx = (moveX / mag) * p.speed * speedMod;
            const targetVy = (moveY / mag) * p.speed * speedMod;
            
            p.vx += (targetVx - p.vx) * 0.1; // Lerp velocity for tilt
            p.vy += (targetVy - p.vy) * 0.1;
            
            moveWithCollision(p, p.vx * dt, p.vy * dt);
            p.x = Math.max(p.size, Math.min(W - p.size, p.x));
            p.y = Math.max(p.size, Math.min(H - p.size, p.y));
            
            // Set tilt targets
            p.tiltX = p.vx / p.speed;
            p.tiltY = p.vy / p.speed;
        } else {
            p.vx *= 0.8;
            p.vy *= 0.8;
            p.tiltX *= 0.8;
            p.tiltY *= 0.8;
        }

        // 2. Shooting (Auto-Fire Only)
        if (shootTimerRef.current > 0) shootTimerRef.current -= dt;
        
        let targetAngle = null;
        if (enemiesRef.current.length > 0) {
            // Find closest enemy
            let closestDist = Infinity;
            let closestEnemy = null;
            enemiesRef.current.forEach(e => {
                const dist = Math.sqrt((e.x - p.x) ** 2 + (e.y - p.y) ** 2);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestEnemy = e;
                }
            });
            if (closestEnemy) {
                targetAngle = Math.atan2(closestEnemy.y - p.y, closestEnemy.x - p.x);
            }
        }

        if (targetAngle !== null && shootTimerRef.current <= 0) {
            const level = weaponLevels[weaponId] || 1;
            const dmg = weapon.dmg * (1 + (level - 1) * 0.3);
            const fireRate = weapon.fireRate * Math.pow(0.85, level - 1);
            const pCount = weapon.count + (weapon.id === 'SHOTGUN' ? (level - 1) : 0);

            for (let i = 0; i < pCount; i++) {
                const spread = (Math.random() - 0.5) * (weapon.spread * (1 / level));
                projectilesRef.current.push({
                    x: p.x, y: p.y,
                    vx: Math.cos(targetAngle + spread) * weapon.speed,
                    vy: Math.sin(targetAngle + spread) * weapon.speed,
                    dmg: dmg, pierce: weapon.pierce,
                    color: weapon.color, life: 1.5
                });
            }
            shootTimerRef.current = fireRate;
            sfxShoot(weaponId);
        }

        // 2.5 Turret Logic
        turretsRef.current.forEach((t, i) => {
            if (i >= unlockedTurrets) return; // Only active if unlocked
            
            if (t.shootTimer > 0) t.shootTimer -= dt;
            
            if (enemiesRef.current.length > 0) {
                // Find closest enemy for this turret
                let closestDist = Infinity;
                let closestEnemy = null;
                enemiesRef.current.forEach(e => {
                    const dist = Math.sqrt((e.x - t.x) ** 2 + (e.y - t.y) ** 2);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestEnemy = e;
                    }
                });

                if (closestEnemy) {
                    const angle = Math.atan2(closestEnemy.y - t.y, closestEnemy.x - t.x);
                    t.angle = angle;
                    
                    if (t.shootTimer <= 0) {
                        const tDmg = 10 * (1 + (turretLevel - 1) * 0.5);
                        const tFireRate = 0.5 * Math.pow(0.8, turretLevel - 1);

                        projectilesRef.current.push({
                            x: t.x, y: t.y,
                            vx: Math.cos(angle) * 500,
                            vy: Math.sin(angle) * 500,
                            dmg: tDmg, pierce: 1, color: '#f59e0b', life: 1.5
                        });
                        t.shootTimer = tFireRate;
                        sfxShoot('MACHINE_GUN', 0.4); // Turrets are even quieter (0.4x)
                    }
                }
            }
        });

        // Screen Shake Decay
        if (screenShakeRef.current > 0) screenShakeRef.current -= dt * 40;

        // 3. Spawning
        if (waveEnemyQueueRef.current.length > 0) {
            spawnTimerRef.current += dt;
            if (spawnTimerRef.current > 0.8) {
                spawnTimerRef.current = 0;
                const type = waveEnemyQueueRef.current.shift();
                const cfg = ENEMY_TYPES[type];

                let ex, ey;
                if (Math.random() > 0.5) { ex = Math.random() > 0.5 ? -40 : W + 40; ey = Math.random() * H; }
                else { ex = Math.random() * W; ey = Math.random() > 0.5 ? -40 : H + 40; }

                const hpScale = 1 + (wave * 0.15);
                enemiesRef.current.push({
                    id: Math.random(), type, x: ex, y: ey,
                    hp: cfg.hp * hpScale, maxHp: cfg.hp * hpScale,
                    speed: cfg.speed, size: cfg.size, reward: cfg.reward, angle: 0
                });
            }
        }

        // 4. Honeypots
        let activeHoneypot = null;
        honeypotsRef.current.forEach(hp => {
            hp.angle += 1 * dt; // spin animation
            if (!hp.active) {
                if (Math.sqrt((p.x - hp.x) ** 2 + (p.y - hp.y) ** 2) < p.size / 2 + hp.r) hp.active = true;
            } else {
                hp.timer -= dt;
                hp.angle += 3 * dt; // spin faster
                activeHoneypot = hp;

                // Landmine Beep Logic
                if (!hp.lastBeepSec) hp.lastBeepSec = 6;
                const currentSec = Math.ceil(hp.timer);
                if (currentSec < hp.lastBeepSec) {
                    sfx.beep(400 + (5 - currentSec) * 100);
                    hp.lastBeepSec = currentSec;
                }

                if (hp.timer <= 0) {
                    sfxExplode();
                    enemiesRef.current.forEach(e => {
                        if (Math.sqrt((e.x - hp.x) ** 2 + (e.y - hp.y) ** 2) < 180) e.hp -= 200;
                    });
                    for (let i = 0; i < 40; i++) {
                        particlesRef.current.push({
                            x: hp.x, y: hp.y,
                            vx: (Math.random() - 0.5) * 12, vy: (Math.random() - 0.5) * 12,
                            life: 1.2, color: '#f59e0b', size: Math.random() * 6 + 2
                        });
                    }
                    hp.dead = true;
                }
            }
        });
        honeypotsRef.current = honeypotsRef.current.filter(hp => !hp.dead);

        // 5. Enemies
        let damageTaken = 0;
        enemiesRef.current.forEach(e => {
            const targetX = activeHoneypot ? activeHoneypot.x : p.x;
            const targetY = activeHoneypot ? activeHoneypot.y : p.y;
            const dx = targetX - e.x;
            const dy = targetY - e.y;
            const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));

            const speedMod = getZoneSpeedModifier(e.x, e.y);
            moveWithCollision(e, (dx / dist) * e.speed * speedMod * dt, (dy / dist) * e.speed * speedMod * dt);

            // Safety check: If enemy is way off-screen or stuck, bring them back or kill them
            const offScreenThreshold = 200;
            if (e.x < -offScreenThreshold || e.x > W + offScreenThreshold || e.y < -offScreenThreshold || e.y > H + offScreenThreshold) {
                // If they are far enough, just kill them to clear wave
                e.hp = 0;
            }

            if (!activeHoneypot && dist < (p.size / 2 + e.size / 2)) {
                damageTaken += 20 * dt;
            }
        });
            if (damageTaken > 0) { 
            updateHealth(-damageTaken); 
            sfxHit(); 
            triggerShake(8);
        }

        // 6. Projectiles
        projectilesRef.current.forEach(proj => {
            proj.x += proj.vx * dt;
            proj.y += proj.vy * dt;
            proj.life -= dt;

            obstaclesRef.current.forEach(obs => {
                // Obstacles removed
            });

            honeypotsRef.current.forEach(hp => {
                if (!hp.active && Math.sqrt((proj.x - hp.x) ** 2 + (proj.y - hp.y) ** 2) < hp.r) {
                    hp.active = true; proj.life = 0;
                }
            });

            if (proj.life > 0) {
                for (let i = 0; i < enemiesRef.current.length; i++) {
                    const e = enemiesRef.current[i];
                    if (e.hp > 0 && Math.sqrt((proj.x - e.x) ** 2 + (proj.y - e.y) ** 2) < e.size / 2 + 4) {
                        e.hp -= proj.dmg;
                        proj.pierce--;
                        if (proj.pierce <= 0) proj.life = 0;

                        for (let j = 0; j < 4; j++) {
                            particlesRef.current.push({
                                x: e.x, y: e.y,
                                vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6,
                                life: 0.6, color: proj.color, size: 3
                            });
                        }
                        break;
                    }
                }
            }
        });
        projectilesRef.current = projectilesRef.current.filter(p => p.life > 0);

        // 7. Cleanup & Particles
        enemiesRef.current = enemiesRef.current.filter(e => {
            if (e.hp <= 0) {
                updateMoney(e.reward);
                sfxKill();
                triggerShake(Math.min(15, e.reward / 2));
                for (let i = 0; i < 15; i++) {
                    particlesRef.current.push({
                        x: e.x, y: e.y,
                        vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10,
                        life: 1.0, color: ENEMY_TYPES[e.type].color, size: Math.random() * 5 + 3
                    });
                }
                return false;
            }
            return true;
        });

        particlesRef.current.forEach(pt => {
            pt.x += pt.vx; pt.y += pt.vy;
            pt.life -= dt * 1.5;
            pt.size = Math.max(0, pt.size - dt * 2);
        });
        particlesRef.current = particlesRef.current.filter(pt => pt.life > 0);

        // 8. Wave Clear Condition & Stats Update
        const currentEnemyTotal = enemiesRef.current.length + waveEnemyQueueRef.current.length;
        setRemainingEnemies(currentEnemyTotal);

        if (currentEnemyTotal === 0 && gameState === 'playing') {
            setGameState('cleared');
        }

        // --- RENDER ---
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');

            // Apply Screen Shake
            ctx.save();
            if (screenShakeRef.current > 0) {
                const shake = screenShakeRef.current;
                ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
            }

            // --- RENDER LAYERS ---

            // 1. Digital Background (Modern & Premium)
            ctx.fillStyle = '#f8fafc'; // base
            ctx.fillRect(0, 0, W, H);

            // Subtle scrolling grid
            const gridScroll = (time * 0.02) % 40;
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 1;
            for (let x = -gridScroll; x < W + 40; x += 40) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
            }
            for (let y = -gridScroll; y < H + 40; y += 40) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
            }

            // Digital "Binary" Rain/Columns (Subtle)
            ctx.font = '10px monospace';
            ctx.fillStyle = 'rgba(203, 213, 225, 0.4)';
            for (let x = 20; x < W; x += 60) {
                const colSeed = Math.sin(x + time * 0.001);
                const colY = (time * 0.05 + x * 2) % (H + 200) - 100;
                for (let j = 0; j < 5; j++) {
                    const char = Math.random() > 0.5 ? '1' : '0';
                    ctx.fillText(char, x, colY + j * 12);
                }
            }

            // 2. Turrets (Sleek Black Aesthetic)
            turretsRef.current.forEach((t, i) => {
                const unlocked = i < unlockedTurrets;
                ctx.save();
                ctx.translate(t.x, t.y);
                
                // Outer Ring / Base Shadow
                ctx.beginPath();
                drawHexagon(ctx, 0, 0, t.size / 2 + 3);
                ctx.fillStyle = unlocked ? 'rgba(0, 0, 0, 0.4)' : 'rgba(203, 213, 225, 0.2)';
                ctx.fill();

                // Main Hex Body (Matte Black / Gunmetal)
                ctx.beginPath();
                drawHexagon(ctx, 0, 0, t.size / 2);
                ctx.fillStyle = unlocked ? '#0f172a' : '#f1f5f9';
                ctx.fill();
                ctx.strokeStyle = unlocked ? '#334155' : '#cbd5e1';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Turret Head / Glowing Accents
                if (unlocked) {
                    ctx.rotate(t.angle);
                    
                    // Cannon (Gunmetal Black)
                    ctx.fillStyle = '#1e293b';
                    ctx.fillRect(2, -4, 16, 8);
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(2, -4, 16, 8);
                    
                    // Center Cap
                    ctx.beginPath();
                    ctx.arc(0, 0, 8, 0, Math.PI * 2);
                    ctx.fillStyle = '#0f172a';
                    ctx.fill();
                    ctx.strokeStyle = '#38bdf8';
                    ctx.stroke();

                    // Neon Pulse Core
                    const pulse = 0.5 + Math.sin(time * 0.01) * 0.3;
                    ctx.shadowBlur = 10 * pulse;
                    ctx.shadowColor = '#0ea5e9';
                    ctx.fillStyle = '#0ea5e9';
                    ctx.beginPath();
                    ctx.arc(0, 0, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
                ctx.restore();
            });

            // Draw Honeypots
            honeypotsRef.current.forEach(hp => {
                ctx.save();
                ctx.translate(hp.x, hp.y);
                ctx.rotate(hp.angle);

                drawHexagon(ctx, 0, 0, hp.r);
                ctx.fillStyle = hp.active ? `rgba(245, 158, 11, ${(hp.timer / hp.maxTimer)})` : '#ffffff';
                ctx.fill();
                ctx.lineWidth = hp.active ? 4 : 2;
                ctx.strokeStyle = '#f59e0b';

                if (hp.active) ctx.setLineDash([6, 4]);
                ctx.stroke();
                ctx.restore();

                // Inner static detail
                drawHexagon(ctx, hp.x, hp.y, hp.r * 0.5);
                ctx.strokeStyle = hp.active ? '#ffffff' : '#f59e0b';
                ctx.lineWidth = 2;
                ctx.stroke();

                if (hp.active) {
                    ctx.fillStyle = '#1e293b';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(Math.ceil(hp.timer), hp.x, hp.y + 4);
                }
            });

            // Draw Projectiles
            projectilesRef.current.forEach(proj => {
                ctx.beginPath();
                // Draw line for trail
                ctx.moveTo(proj.x, proj.y);
                const trailLen = 12;
                const mag = Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy);
                ctx.lineTo(proj.x - (proj.vx / mag) * trailLen, proj.y - (proj.vy / mag) * trailLen);

                ctx.strokeStyle = proj.color;
                ctx.lineWidth = 4;
                ctx.lineCap = 'round';
                ctx.stroke();
            });

            // Draw Particles
            particlesRef.current.forEach(pt => {
                ctx.globalAlpha = Math.max(0, pt.life);
                ctx.fillStyle = pt.color;
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;

            // Draw Enemies
            enemiesRef.current.forEach(e => {
                drawTechnoDrone(ctx, e, time, p);
            });

            // Draw Cyber-Sentinel (Player)
            drawCyberSentinel(ctx, p, time, healthRef.current);

            ctx.restore(); // End Screen Shake

            // Optional: Vignette Overlay (Slightly darkens edges for focus)
            const grad = ctx.createRadialGradient(W / 2, H / 2, W * 0.3, W / 2, H / 2, W * 0.8);
            grad.addColorStop(0, 'rgba(255,255,255,0)');
            grad.addColorStop(1, 'rgba(15, 23, 42, 0.05)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            // 6. Draw Crosshair (Improved)
            const mx = mousePosRef.current.x, my = mousePosRef.current.y;
            ctx.strokeStyle = '#0ea5e9';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(mx, my, 10, 0, Math.PI * 2); ctx.stroke();
            ctx.beginPath(); ctx.arc(mx, my, 2, 0, Math.PI * 2); ctx.fill();
            // Compass-like crosshair
            [0, Math.PI/2, Math.PI, Math.PI*1.5].forEach(a => {
                ctx.beginPath();
                ctx.moveTo(mx + Math.cos(a) * 14, my + Math.sin(a) * 14);
                ctx.lineTo(mx + Math.cos(a) * 18, my + Math.sin(a) * 18);
                ctx.stroke();
            });
        }

        if (gameState === 'playing') {
            requestRef.current = requestAnimationFrame(gameLoop);
        }
    }, [gameState, canvasSize, weaponId, unlockedTurrets, unlockedWeapons, weaponLevels, turretLevel, wave]);

    // Start/Stop Loop
    useEffect(() => {
        if (gameState === 'playing') requestRef.current = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(requestRef.current);
    }, [gameState, gameLoop]);


    // --- RENDERING UI ---
    return (
        <div className="w-full h-full flex flex-col relative select-none font-sans" style={{ minHeight: '100vh', background: '#f8fafc', color: '#1e293b' }}>

            {/* HUD */}
            <div className="flex justify-between items-center px-8 py-4 z-20 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', borderBottom: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div className="flex gap-8 items-center">
                    <h2 className="text-2xl font-black tracking-tight" style={{ color: '#0f172a' }}>
                        <span style={{ color: '#0ea5e9' }}>CORE</span> SURVIVOR
                    </h2>
                    <div className="flex flex-col border-l border-slate-200 pl-6">
                        <span className="font-bold uppercase tracking-widest" style={{ fontSize: '10px', color: '#64748b' }}>Wave</span>
                        <span className="text-2xl font-black leading-none" style={{ color: '#0f172a' }}>{wave} <span style={{ color: '#94a3b8', fontSize: '14px', fontWeight: 'bold' }}>{remainingEnemies > 0 ? `(${remainingEnemies})` : '(CLR)'}</span></span>
                    </div>
                </div>
                <div className="flex gap-10 items-center">
                    <div className="flex flex-col items-center bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
                        <span className="font-bold uppercase tracking-widest leading-none mb-1" style={{ fontSize: '9px', color: '#94a3b8' }}>Loadout [Q/E]</span>
                        <div className="flex items-center gap-2">
                            {unlockedWeapons.map(id => (
                                <div key={id} className={`w-2 h-2 rounded-full ${weaponId === id ? 'bg-sky-500 scale-125' : 'bg-slate-300'}`} style={{ transition: 'all 0.2s' }} />
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col items-end border-r border-slate-200 pr-6">
                        <span className="font-bold uppercase tracking-widest" style={{ fontSize: '10px', color: '#64748b' }}>Funds</span>
                        <span className="text-2xl font-black leading-none" style={{ color: '#10b981' }}>${money}</span>
                    </div>

                    <div className="flex flex-col items-center border-r border-slate-200 pr-6">
                        <span className="font-bold uppercase tracking-widest" style={{ fontSize: '10px', color: '#64748b' }}>Mines [F]</span>
                        <div className="flex gap-1 mt-1">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`w-3 h-3 rounded-sm ${landmines >= i ? 'bg-amber-500' : 'bg-slate-200'}`} />
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col w-64">
                        <div className="flex justify-between mb-1">
                            <span className="font-bold uppercase tracking-widest" style={{ fontSize: '10px', color: '#64748b' }}>System Integrity</span>
                            <span className="font-bold uppercase tracking-widest" style={{ fontSize: '10px', color: health > 30 ? '#0ea5e9' : '#ef4444' }}>{Math.ceil(health)}%</span>
                        </div>
                        <div className="h-3 rounded-full overflow-hidden" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
                            <div className="h-full transition-all duration-300" style={{ width: `${health}%`, background: health > 30 ? 'linear-gradient(90deg, #0ea5e9, #38bdf8)' : '#ef4444' }} />
                        </div>
                    </div>

                    {['playing', 'paused', 'shop'].includes(gameState) && (
                        <button 
                            onClick={() => {
                                if (gameState === 'playing' || gameState === 'paused') {
                                    setGameState(prev => prev === 'playing' ? 'paused' : 'playing');
                                    if (gameState === 'paused') lastTimeRef.current = performance.now();
                                }
                            }} 
                            className="px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all hover:scale-105 active:scale-95" 
                            style={{ 
                                background: '#0ea5e9', 
                                color: '#ffffff', 
                                boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.2)',
                                border: 'none'
                            }}
                        >
                            {gameState === 'paused' ? 'Resume' : 'Pause'}
                        </button>
                    )}
                    {gameState === 'start' && onBack && (
                        <button onClick={onBack} className="px-6 py-2 rounded-lg text-xs font-bold uppercase transition-all hover:bg-slate-50 border border-slate-200 text-slate-500">Exit</button>
                    )}
                </div>
            </div>

            {/* GAME AREA */}
            <div
                ref={containerRef} className="flex-1 relative overflow-hidden"
                style={{ cursor: gameState === 'playing' ? 'none' : 'default' }}
                onMouseMove={(e) => {
                    if (!containerRef.current) return;
                    const rect = containerRef.current.getBoundingClientRect();
                    mousePosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                }}
                onMouseDown={() => isMouseDownRef.current = true}
                onMouseUp={() => isMouseDownRef.current = false}
                onMouseLeave={() => isMouseDownRef.current = false}
            >
                <canvas ref={canvasRef} width={canvasSize.w} height={canvasSize.h} className="absolute inset-0" />

                {/* OVERLAYS */}

                {/* 0. PAUSE SCREEN */}
                {gameState === 'paused' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-[100] transition-all" style={{ background: 'rgba(248,250,252,0.6)', backdropFilter: 'blur(20px)' }}>
                        <div className="w-16 h-16 rounded-2xl bg-sky-100 flex items-center justify-center text-3xl mb-6 text-sky-600 animate-pulse">⏸️</div>
                        <h3 className="text-5xl font-black uppercase tracking-tighter mb-2" style={{ color: '#0f172a' }}>System Paused</h3>
                        <p className="font-mono text-sm mb-12 tracking-widest font-bold" style={{ color: '#64748b' }}>DEFENSE_STANDBY_MODE</p>
                        
                        <div className="flex flex-col gap-4 w-64">
                            <button 
                                onClick={() => {
                                    setGameState('playing');
                                    lastTimeRef.current = performance.now();
                                }} 
                                className="w-full py-4 font-black rounded-xl uppercase tracking-widest transition-all hover:-translate-y-1 hover:shadow-lg" 
                                style={{ background: '#0ea5e9', color: '#ffffff', boxShadow: '0 10px 15px -3px rgba(14, 165, 233, 0.3)' }}
                            >
                                Resume Game
                            </button>
                            
                            <button 
                                onClick={() => onBack?.()} 
                                className="w-full py-4 font-black rounded-xl uppercase tracking-widest transition-all hover:bg-slate-100 border-2 border-slate-200" 
                                style={{ background: '#ffffff', color: '#475569' }}
                            >
                                Abandon Mission
                            </button>
                        </div>
                        
                        <div className="mt-12 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#94a3b8' }}>
                            Press <span className="px-2 py-1 rounded bg-slate-200 text-slate-600">ESC</span> to toggle
                        </div>
                    </div>
                )}

                {/* 1. START SCREEN */}
                {gameState === 'start' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center z-50 transition-all" style={{ background: 'rgba(248,250,252,0.85)', backdropFilter: 'blur(12px)' }}>
                        <h3 className="text-6xl font-black uppercase tracking-tighter mb-2" style={{ color: '#0f172a' }}>Core Survivor</h3>
                        <p className="font-mono text-sm mb-10 tracking-widest font-bold" style={{ color: '#0ea5e9' }}>INFINITE_WAVE_MODE</p>

                        <div className="max-w-lg text-left p-8 rounded-2xl mb-10" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)' }}>
                            <h4 className="font-black uppercase text-xs tracking-widest pb-3 mb-4" style={{ color: '#94a3b8', borderBottom: '1px solid #f1f5f9' }}>Mission Intel</h4>
                            <div className="space-y-4">
                                <p className="text-sm font-medium" style={{ color: '#475569' }}><span className="font-bold px-2 py-1 rounded bg-slate-100 mr-2" style={{ color: '#0f172a' }}>WASD</span> Move around the grid.</p>
                                <p className="text-sm font-medium" style={{ color: '#475569' }}><span className="font-bold px-2 py-1 rounded bg-slate-100 mr-2" style={{ color: '#0f172a' }}>CLICK</span> Hold to fire weapons.</p>
                                <p className="text-sm font-medium flex items-center" style={{ color: '#475569' }}><span className="w-3 h-3 rounded-sm bg-red-500 mr-3"></span> Firewalls block movement & shots.</p>
                                <p className="text-sm font-medium flex items-center" style={{ color: '#475569' }}><span className="w-3 h-3 rounded-sm bg-sky-500 mr-3"></span> Fiber Zones grant +50% speed.</p>
                                <p className="text-sm font-medium flex items-center" style={{ color: '#475569' }}><span className="w-3 h-3 rounded-sm bg-orange-500 mr-3"></span> Throttled Zones cause -50% speed.</p>
                                <p className="text-sm font-medium flex items-center" style={{ color: '#475569' }}><span className="w-3 h-3 rounded-full bg-amber-500 mr-3"></span> Honeypots draw aggro, then detonate.</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => {
                                startBgm();
                                startGame();
                            }} 
                            className="px-14 py-5 font-black text-xl rounded-xl uppercase tracking-widest hover:-translate-y-1 transition-transform" 
                            style={{ background: '#0ea5e9', color: '#ffffff', boxShadow: '0 10px 25px -5px rgba(14, 165, 233, 0.4)' }}
                        >
                            Initialize Defense
                        </button>
                    </div>
                )}

                {/* 2. WAVE CLEARED INTERSTITIAL */}
                {gameState === 'cleared' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-[100] pointer-events-none">
                        <style>{`
                            @keyframes fadeInOut {
                                0% { opacity: 0; transform: translateY(10px); }
                                20% { opacity: 1; transform: translateY(0); }
                                80% { opacity: 1; transform: translateY(0); }
                                100% { opacity: 0; transform: translateY(-10px); }
                            }
                            .animate-fade-io { animation: fadeInOut 2s ease-in-out forwards; }
                        `}</style>
                        <div className="animate-fade-io">
                            <h2 className="text-7xl font-black uppercase tracking-tighter mb-2" style={{ color: '#0f172a' }}>
                                Wave {wave}
                            </h2>
                            <h3 className="text-5xl font-black uppercase tracking-widest" style={{ color: '#0ea5e9' }}>
                                Cleared
                            </h3>
                        </div>
                    </div>
                )}

                {/* 3. SHOP (Between Waves) */}
                {gameState === 'shop' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-start p-12 z-50 overflow-y-auto" style={{ background: 'rgba(248,250,252,0.95)', backdropFilter: 'blur(16px)' }}>
                        <div className="font-mono mb-2 font-bold tracking-widest text-emerald-600">MISSION_SUCCESS // WAVE {wave} CLR</div>
                        <h3 className="text-6xl font-black uppercase tracking-tighter mb-8" style={{ color: '#0f172a' }}>Black Market</h3>
                        
                        <div className="text-xl font-bold mb-12 px-10 py-4 rounded-3xl" style={{ color: '#ffffff', background: '#0f172a', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
                            Available Funds: <span style={{ color: '#10b981' }}>${money}</span>
                        </div>
                        
                        <div className="flex flex-wrap justify-center gap-6 max-w-[1200px] pb-12">
                            {/* Turret Unlock / Upgrade */}
                            <div className="w-56 rounded-2xl p-6 flex flex-col items-center text-center transition-all bg-white hover:shadow-2xl hover:scale-105 border border-slate-200" style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)' }}>
                                <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center text-3xl mb-4 border border-sky-100">🛡️</div>
                                <h4 className="font-black uppercase text-base mb-1" style={{ color: '#1e293b' }}>{unlockedTurrets < 4 ? 'Defensive Turret' : 'Turret Mastery'}</h4>
                                <div className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#94a3b8' }}>{unlockedTurrets < 4 ? `Unit ${unlockedTurrets + 1}` : `Level ${turretLevel}`}</div>
                                <p className="text-xs font-medium mb-6 leading-relaxed" style={{ color: '#64748b' }}>
                                    {unlockedTurrets < 4 ? `Deploy static defense. Unlocks one of 4 turrets (${unlockedTurrets}/4).` : 'Increase fire rate and damage of all turrets.'}
                                </p>
                                <button
                                    disabled={(unlockedTurrets < 4 && money < 1000) || (unlockedTurrets === 4 && money < (2000 * turretLevel))}
                                    onClick={() => { 
                                        const cost = unlockedTurrets < 4 ? 1000 : (2000 * turretLevel);
                                        if (money < cost) { sfx.deny(); return; }
                                        if (unlockedTurrets < 4) {
                                            updateMoney(-1000); 
                                            setUnlockedTurrets(prev => prev + 1);
                                        } else {
                                            updateMoney(-cost);
                                            setTurretLevel(prev => prev + 1);
                                        }
                                        sfxBuy(); 
                                    }}
                                    className="mt-auto w-full py-3 rounded-xl font-bold text-sm transition-all"
                                    style={{
                                        background: ((unlockedTurrets < 4 && money >= 1000) || (unlockedTurrets === 4 && money >= (2000 * turretLevel))) ? '#0ea5e9' : '#f1f5f9',
                                        color: ((unlockedTurrets < 4 && money >= 1000) || (unlockedTurrets === 4 && money >= (2000 * turretLevel))) ? '#ffffff' : '#94a3b8',
                                        boxShadow: ((unlockedTurrets < 4 && money >= 1000) || (unlockedTurrets === 4 && money >= (2000 * turretLevel))) ? '0 10px 15px -3px rgba(14, 165, 233, 0.3)' : 'none'
                                    }}
                                >
                                    {unlockedTurrets < 4 ? '$1000' : `$${2000 * turretLevel}`}
                                </button>
                            </div>

                            {/* Health Pack */}
                            <div className="w-56 rounded-2xl p-6 flex flex-col items-center text-center transition-all bg-white hover:shadow-2xl hover:scale-105 border border-slate-200" style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)' }}>
                                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-3xl mb-4 border border-emerald-100">❤️</div>
                                <h4 className="font-black uppercase text-base mb-2" style={{ color: '#1e293b' }}>Repatch Core</h4>
                                <p className="text-xs font-medium mb-6 leading-relaxed" style={{ color: '#64748b' }}>Critical system repair. Restores +50% Integrity.</p>
                                <button
                                    disabled={money < 50 || health >= 100}
                                    onClick={() => { 
                                        if (money < 50 || health >= 100) { sfx.deny(); return; }
                                        updateMoney(-50); updateHealth(50); sfxBuy(); 
                                    }}
                                    className="mt-auto w-full py-3 rounded-xl font-bold text-sm transition-all"
                                    style={{
                                        background: money >= 50 && health < 100 ? '#10b981' : '#f1f5f9',
                                        color: money >= 50 && health < 100 ? '#ffffff' : '#94a3b8',
                                        boxShadow: money >= 50 && health < 100 ? '0 10px 15px -3px rgba(16, 185, 129, 0.3)' : 'none'
                                    }}
                                >
                                    {'$50'}
                                </button>
                            </div>

                            {/* Landmines */}
                            <div className="w-56 rounded-2xl p-6 flex flex-col items-center text-center transition-all bg-white hover:shadow-2xl hover:scale-105 border border-slate-200" style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)' }}>
                                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-3xl mb-4 border border-amber-100">💣</div>
                                <h4 className="font-black uppercase text-base mb-2" style={{ color: '#1e293b' }}>Landmine</h4>
                                <p className="text-xs font-medium mb-6 leading-relaxed" style={{ color: '#64748b' }}>Deploy with [F]. Explodes after 5s countdown.</p>
                                <button
                                    disabled={landmines >= 3 || money < (50 * (landmines + 1))}
                                    onClick={() => { 
                                        const cost = 50 * (landmines + 1);
                                        if (landmines >= 3 || money < cost) { sfx.deny(); return; }
                                        updateMoney(-cost); 
                                        setLandmines(prev => prev + 1); 
                                        sfxBuy(); 
                                    }}
                                    className="mt-auto w-full py-3 rounded-xl font-bold text-sm transition-all"
                                    style={{
                                        background: landmines < 3 && money >= (50 * (landmines + 1)) ? '#f59e0b' : '#f1f5f9',
                                        color: landmines < 3 && money >= (50 * (landmines + 1)) ? '#ffffff' : '#94a3b8',
                                        boxShadow: landmines < 3 && money >= (50 * (landmines + 1)) ? '0 10px 15px -3px rgba(245, 158, 11, 0.3)' : 'none'
                                    }}
                                >
                                    {landmines >= 3 ? 'FULL' : `$${50 * (landmines + 1)}`}
                                </button>
                            </div>

                            {/* Weapons */}
                            {['PISTOL', 'MACHINE_GUN', 'SHOTGUN', 'LASER'].map(key => {
                                const w = WEAPONS[key];
                                const owned = unlockedWeapons.includes(key);
                                const level = weaponLevels[key] || 1;
                                const equiped = weaponId === key;
                                const upgradeCost = (key === 'PISTOL' ? 300 : 500) * level;
                                const canAffordUnlock = money >= w.cost;
                                const canAffordUpgrade = money >= upgradeCost;

                                return (
                                    <div key={key} className="w-56 rounded-2xl p-6 flex flex-col items-center text-center transition-all bg-white hover:shadow-2xl hover:scale-105" style={{ border: equiped ? '2px solid #0ea5e9' : '1px solid #e2e8f0', boxShadow: equiped ? '0 20px 25px -5px rgba(14, 165, 233, 0.2)' : '0 20px 25px -5px rgba(0, 0, 0, 0.05)' }}>
                                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 border" style={{ background: `${w.color}10`, borderColor: `${w.color}30`, color: w.color }}>🔫</div>
                                        <h4 className="font-black uppercase text-base mb-1" style={{ color: '#1e293b' }}>{w.name}</h4>
                                        <div className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: '#94a3b8' }}>{owned ? `Level ${level}` : 'Advanced Module'}</div>
                                        <div className="text-xs font-medium space-y-1 mb-6 w-full" style={{ color: '#64748b' }}>
                                            <div className="flex justify-between border-b border-slate-50 pb-1"><span>DMG</span><span className="font-bold text-slate-700">{Math.floor(w.dmg * (1 + (level - 1) * 0.3))}</span></div>
                                            <div className="flex justify-between border-b border-slate-50 pb-1"><span>FIRE</span><span className="font-bold text-slate-700">{(w.fireRate * Math.pow(0.85, level - 1)).toFixed(2)}s</span></div>
                                            <div className="pt-2 text-sky-600 font-bold">{w.count + (key === 'SHOTGUN' ? (level - 1) : 0)}x Projectiles</div>
                                        </div>
                                        
                                        <div className="flex flex-col gap-2 w-full mt-auto">
                                            {owned ? (
                                                <>
                                                    <button
                                                        disabled={!canAffordUpgrade}
                                                        onClick={() => { 
                                                            if (!canAffordUpgrade) { sfx.deny(); return; }
                                                            updateMoney(-upgradeCost);
                                                            setWeaponLevels(prev => ({ ...prev, [key]: (prev[key] || 1) + 1 }));
                                                            sfxBuy(); 
                                                        }}
                                                        className="w-full py-2 rounded-lg font-bold text-xs transition-all"
                                                        style={{
                                                            background: canAffordUpgrade ? '#10b981' : '#f1f5f9',
                                                            color: canAffordUpgrade ? '#ffffff' : '#94a3b8'
                                                        }}
                                                    >
                                                        UPGRADE (${upgradeCost})
                                                    </button>
                                                    {!equiped && (
                                                        <button
                                                            onClick={() => { setWeaponId(key); sfxBuy(); }}
                                                            className="w-full py-2 rounded-lg font-bold text-xs transition-all border-2 border-sky-100 text-sky-600 hover:bg-sky-50"
                                                        >
                                                            EQUIP
                                                        </button>
                                                    )}
                                                    {equiped && (
                                                        <div className="text-[10px] font-black text-sky-500 uppercase tracking-widest py-1">Equipped</div>
                                                    )}
                                                </>
                                            ) : (
                                                <button
                                                    disabled={!canAffordUnlock}
                                                    onClick={() => { 
                                                        if (!canAffordUnlock) { sfx.deny(); return; }
                                                        updateMoney(-w.cost); 
                                                        setUnlockedWeapons(prev => [...prev, key]);
                                                        setWeaponId(key); 
                                                        sfxBuy(); 
                                                    }}
                                                    className="w-full py-3 rounded-lg font-bold text-xs transition-all"
                                                    style={{
                                                        background: canAffordUnlock ? '#0ea5e9' : '#f1f5f9',
                                                        color: canAffordUnlock ? '#ffffff' : '#94a3b8'
                                                    }}
                                                >
                                                    UNLOCK (${w.cost})
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        <button onClick={nextWave} className="px-12 py-4 font-black rounded-xl uppercase tracking-widest transition-all hover:bg-slate-800" style={{ background: '#0f172a', color: '#ffffff', boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.3)' }}>
                            Proceed to Wave {wave + 1}
                        </button>
                    </div>
                )}

                {/* 3. GAME OVER */}
                {gameState === 'over' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-50" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(12px)' }}>
                        <span className="text-8xl mb-6">💀</span>
                        <h3 className="text-5xl font-black uppercase tracking-tight mb-3" style={{ color: '#e11d48' }}>Core Breached</h3>
                        <p className="font-mono text-base font-bold tracking-widest mb-10" style={{ color: '#f43f5e' }}>CRITICAL_SYSTEM_FAILURE</p>

                        <div className="flex gap-6 mb-10">
                            <div className="p-6 rounded-2xl w-48" style={{ background: '#ffffff', border: '1px solid #fecdd3', boxShadow: '0 10px 15px -3px rgba(225, 29, 72, 0.1)' }}>
                                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#fb7185' }}>Waves Survived</div>
                                <div className="text-4xl font-black" style={{ color: '#be123c' }}>{wave - 1}</div>
                            </div>
                            <div className="p-6 rounded-2xl w-48" style={{ background: '#ffffff', border: '1px solid #e0f2fe', boxShadow: '0 10px 15px -3px rgba(14, 165, 233, 0.1)' }}>
                                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#7dd3fc' }}>Final Loadout</div>
                                <div className="text-xl font-black mt-2" style={{ color: '#0284c7' }}>{WEAPONS[weaponId].name}</div>
                            </div>
                        </div>

                        <button onClick={startGame} className="px-12 py-4 font-black text-lg rounded-xl uppercase tracking-widest transition-transform hover:-translate-y-1" style={{ background: '#e11d48', color: '#ffffff', boxShadow: '0 10px 25px -5px rgba(225, 29, 72, 0.4)' }}>
                            Reboot System
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}