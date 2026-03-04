import React, { useState, useEffect, useRef } from 'react';
import Player from './Player';
import Enemy from './Enemy';
import { Building, StreetLight, Billboard, CyberCrate, TrashCan, UtilityBox } from './Environment';
import { useGameState } from '../context/GameStateContext';

const WORLD_WIDTH = 2800;
const WORLD_HEIGHT = 2400;
const SPEED = 40;
const PLAYER_SIZE = 40;

const L1_TRIGGER = { x: 1272, y: 580, w: 256, h: 50 };

const checkCollision = (px, py, rect) => (
    px < rect.x + rect.w &&
    px + PLAYER_SIZE > rect.x &&
    py < rect.y + rect.h &&
    py + PLAYER_SIZE > rect.y
);

const enemies = [
    { id: 1, x: 600, y: 1400, type: 'Phisher' },
    { id: 2, x: 2100, y: 2100, type: 'OTP Scammer' },
    { id: 3, x: 500, y: 2000, type: 'Data Broker' },
    { id: 4, x: 2200, y: 1500, type: 'Ransomware Bot' },
    { id: 5, x: 1800, y: 1800, type: 'Phisher' },
    { id: 6, x: 900, y: 800, type: 'Data Broker' },
];

const generateEnvironment = () => {
    const buildings = [];
    const lights = [];
    const billboards = [];
    const props = [];

    // ═══ LEFT DISTRICT ═══
    const leftBuildings = [
        { x: 60, y: 200, w: 200, h: 380, n: 'bg-cyan-400' },
        { x: 100, y: 620, w: 180, h: 322, n: 'bg-fuchsia-500' },
        { x: 50, y: 980, w: 220, h: 400, n: 'bg-emerald-400' },
        { x: 120, y: 1400, w: 180, h: 350, n: 'bg-cyan-400' },
        { x: 60, y: 1780, w: 200, h: 380, n: 'bg-fuchsia-500' },
        { x: 100, y: 2150, w: 220, h: 300, n: 'bg-emerald-400' },
        { x: 300, y: 100, w: 160, h: 300, n: 'bg-fuchsia-500' },
        { x: 320, y: 470, w: 180, h: 360, n: 'bg-cyan-400' },
    ];
    leftBuildings.forEach((b, i) => buildings.push({ id: `bl${i}`, x: b.x, y: b.y, width: b.w, height: b.h, neon: b.n, zIndexOffset: -50 }));

    // ═══ RIGHT DISTRICT ═══
    const rightBuildings = [
        { x: 2300, y: 150, w: 220, h: 420, n: 'bg-cyan-400' },
        { x: 2350, y: 620, w: 180, h: 350, n: 'bg-emerald-400' },
        { x: 2280, y: 1020, w: 200, h: 380, n: 'bg-fuchsia-500' },
        { x: 2340, y: 1440, w: 190, h: 340, n: 'bg-cyan-400' },
        { x: 2300, y: 1820, w: 210, h: 370, n: 'bg-emerald-400' },
    ];
    rightBuildings.forEach((b, i) => buildings.push({ id: `br${i}`, x: b.x, y: b.y, width: b.w, height: b.h, neon: b.n, zIndexOffset: -50 }));

    // ═══ FAR SKYLINE ═══
    for (let i = 0; i < 14; i++) {
        buildings.push({
            id: `bg${i}`, x: i * 200, y: -80,
            width: 170 + (i % 4) * 30, height: 500 + (i % 5) * 50,
            neon: 'bg-cyan-400', color: 'bg-slate-950', zIndexOffset: -120
        });
    }

    // ═══ STREETLIGHTS ═══
    for (let i = 0; i < 12; i++) {
        lights.push({ id: `mll${i}`, x: 680, y: 500 + i * 180, isLeft: true });
        lights.push({ id: `mlr${i}`, x: 1900, y: 500 + i * 180, isLeft: false });
    }

    // ═══ BILLBOARDS ═══
    billboards.push({ id: 'bb1', x: 550, y: 700, text: 'OBEY', color: 'text-red-500' });
    billboards.push({ id: 'bb2', x: 2000, y: 900, text: 'PATCH', color: 'text-cyan-400' });

    // ═══ DETAILED PROPS ═══
    props.push({ type: 'crate', x: 740, y: 1100, variant: 'blue' });
    props.push({ type: 'trash', x: 750, y: 1180 });
    props.push({ type: 'utility', x: 1980, y: 1600 });
    props.push({ type: 'trash', x: 1950, y: 1650 });
    props.push({ type: 'crate', x: 800, y: 1800, variant: 'red' });

    return { buildings, lights, billboards, props };
};

const ENV_DATA = generateEnvironment();

const WorldMap = () => {
    const { enterLevel, assets, rank, safetyScore } = useGameState();

    // Performance Refs (Bypass React State for movement)
    const playerPosRef = useRef({ x: 1400, y: 2100 });
    const keysRef = useRef({});
    const worldRef = useRef(null);
    const playerDOMRef = useRef(null);
    const radarPlayerRef = useRef(null);
    const lastTimeRef = useRef(0);

    useEffect(() => {
        const down = (e) => { keysRef.current[e.key.toLowerCase()] = true; };
        const up = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
    }, []);

    useEffect(() => {
        let raf;
        const loop = (time) => {
            const keys = keysRef.current;
            const p = playerPosRef.current;

            let nx = p.x;
            let ny = p.y;

            if (keys['w'] || keys['arrowup']) ny -= SPEED;
            if (keys['s'] || keys['arrowdown']) ny += SPEED;
            if (keys['a'] || keys['arrowleft']) nx -= SPEED;
            if (keys['d'] || keys['arrowright']) nx += SPEED;

            nx = Math.max(0, Math.min(nx, WORLD_WIDTH - PLAYER_SIZE));
            ny = Math.max(0, Math.min(ny, WORLD_HEIGHT - PLAYER_SIZE));

            // Trigger Check
            const triggerRect = L1_TRIGGER;
            if (nx < triggerRect.x + triggerRect.w && nx + PLAYER_SIZE > triggerRect.x &&
                ny < triggerRect.y + triggerRect.h && ny + PLAYER_SIZE > triggerRect.y) {
                enterLevel('living-room');
                ny += 50;
            }

            // Update Refs
            playerPosRef.current = { x: nx, y: ny };

            // DIRECT DOM UPDATE (Extreme Performance)
            if (worldRef.current && playerDOMRef.current) {
                // Snap to pixels to prevent shimmer
                const snappedX = Math.round(nx);
                const snappedY = Math.round(ny);

                const vx = Math.round(window.innerWidth / 2 - snappedX - PLAYER_SIZE / 2);
                const vy = Math.round(window.innerHeight / 2 - snappedY - PLAYER_SIZE / 2);

                worldRef.current.style.transform = `translate(${vx}px, ${vy}px)`;
                playerDOMRef.current.style.left = `${snappedX}px`;
                playerDOMRef.current.style.top = `${snappedY}px`;
            }

            // Update Radar (Optional optimization)
            if (radarPlayerRef.current) {
                radarPlayerRef.current.style.left = `${(nx / WORLD_WIDTH) * 100}%`;
                radarPlayerRef.current.style.top = `${(ny / WORLD_HEIGHT) * 100}%`;
            }

            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [enterLevel]);

    return (
        <div className="relative w-full h-full overflow-hidden bg-slate-950 animate-fade-in font-mono text-slate-300">
            {/* ═══ GLOBAL ATMOSPHERIC OVERLAYS ═══ */}
            <div className="absolute inset-0 pointer-events-none z-[1000] opacity-[0.05] overflow-hidden">
                <div className="w-full h-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
            </div>
            <div className="absolute inset-0 pointer-events-none z-[999] shadow-[inset_0_0_250px_rgba(0,0,0,0.9)] mix-blend-multiply opacity-80" />

            {/* ═══ MINIMALIST TECH HUD ═══ */}
            <div className="absolute top-8 left-8 z-[900] select-none pointer-events-none">
                <div className="flex flex-col gap-0.5 border-l-2 border-cyan-500/50 pl-4 py-1">
                    <span className="text-[10px] text-cyan-500/60 font-black tracking-[0.3em] uppercase">Investigator Hub</span>
                    <span className="text-xl font-black text-white tracking-widest uppercase">Sector_04</span>
                </div>
                <div className="mt-4 flex gap-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/50 rounded-sm border border-slate-800">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Sys_Active
                    </div>
                </div>
            </div>

            <div className="absolute top-8 right-8 z-[900] flex flex-col items-end gap-3 select-none pointer-events-none">
                <div className="flex gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] text-slate-500 font-black tracking-widest uppercase">Assets</span>
                        <span className="text-xl font-black text-emerald-400">₹{assets ? assets.toLocaleString('en-IN') : '0'}</span>
                    </div>
                    <div className="w-px h-8 bg-slate-800" />
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] text-slate-500 font-black tracking-widest uppercase">Rank</span>
                        <span className="text-xl font-black text-indigo-400 capitalize">{rank}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-slate-900/60 border border-slate-800 px-4 py-2 rounded-sm shadow-xl">
                    <span className="text-[9px] text-slate-500 font-black tracking-widest uppercase">Safety</span>
                    <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]" style={{ width: `${Math.min(100, (safetyScore || 0) / 10)}%` }} />
                    </div>
                    <span className="text-xs font-black text-cyan-400">{safetyScore || 0}</span>
                </div>
            </div>

            {/* ═══ WORLD CONTAINER ═══ */}
            <div
                ref={worldRef}
                className="absolute will-change-transform"
                style={{
                    width: WORLD_WIDTH,
                    height: WORLD_HEIGHT,
                    transform: `translate(${window.innerWidth / 2 - playerPosRef.current.x}px, ${window.innerHeight / 2 - playerPosRef.current.y}px)`,
                    transition: 'none'
                }}
            >
                {/* ═══ GROUND: ASPHALT & GRID ═══ */}
                <div className="absolute inset-0 z-0 bg-slate-950">
                    <div className="absolute inset-0 opacity-[0.05]" style={{
                        backgroundImage: 'radial-gradient(circle, #fff 1.5px, transparent 1.5px)',
                        backgroundSize: '40px 40px'
                    }} />
                    {/* Asphalt Grain */}
                    <div className="absolute inset-0 opacity-[0.03]" style={{
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
                    }} />
                </div>

                {/* ═══ MAIN ROAD ═══ */}
                <div className="absolute top-[500px] bottom-0 left-1/2 -translate-x-1/2 w-[700px] bg-slate-900/30 overflow-hidden">
                    {/* Broken Yellow Markings */}
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[4px] opacity-10" style={{
                        backgroundImage: 'repeating-linear-gradient(to bottom, #eab308 0, #eab308 60px, transparent 60px, transparent 120px)'
                    }} />
                    {/* Puddles with Neon Reflections */}
                    {[800, 1400, 2000].map((y, i) => (
                        <div key={i} className="absolute w-40 h-24 rounded-full blur-xl opacity-20 pointer-events-none" style={{
                            top: y,
                            left: i % 2 === 0 ? '10%' : '60%',
                            background: 'radial-gradient(circle, rgba(34,211,238,0.4) 0%, transparent 70%)'
                        }} />
                    ))}
                </div>

                {/* ═══ PARALLAX SKYLINE LAYER ═══ */}
                <div className="absolute top-0 left-0 w-full h-[500px] pointer-events-none z-0 opacity-20">
                    <div className="absolute bottom-0 w-full h-full bg-gradient-to-t from-slate-950 to-transparent" />
                </div>

                {/* ═══ ENVIRONMENT RENDERING ═══ */}
                {ENV_DATA.buildings.map(bl => <Building key={bl.id} {...bl} />)}
                {ENV_DATA.lights.map(lt => <StreetLight key={lt.id} {...lt} />)}
                {ENV_DATA.billboards.map(bb => <Billboard key={bb.id} {...bb} />)}
                {ENV_DATA.props.map((p, i) => {
                    if (p.type === 'crate') return <CyberCrate key={i} {...p} />;
                    if (p.type === 'trash') return <TrashCan key={i} {...p} />;
                    if (p.type === 'utility') return <UtilityBox key={i} {...p} />;
                    return null;
                })}

                {/* ═══ AEGIS HEADQUARTERS ═══ */}
                <div className="absolute left-1/2 -translate-x-1/2 w-[1000px] h-[500px]" style={{ top: 50, zIndex: 600 }}>
                    <div className="w-full h-full bg-slate-950/90 border-y border-slate-700/50 flex flex-col items-center justify-center relative shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                        <div className="text-7xl font-black text-white tracking-[0.5em] opacity-80 decoration-cyan-500 underline underline-offset-[20px] decoration-4">AEGIS</div>
                        <div className="mt-12 flex gap-12 text-[9px] font-black text-cyan-500/50 uppercase tracking-[1em]">
                            <span>Status_Optimal</span>
                            <span>Grid_Locked</span>
                        </div>
                        {/* HQ Entrance Trigger Info */}
                        <div className="absolute bottom-10 px-8 py-3 border border-cyan-500/20 bg-cyan-500/5 rounded-sm">
                            <span className="text-[10px] text-cyan-400 font-black tracking-widest uppercase">Proceed to Main Gate — Terminal Identification Required</span>
                        </div>
                    </div>
                </div>

                {/* ═══ ATMOSPHERIC FOG LAYERS ═══ */}
                <div className="absolute inset-0 pointer-events-none z-[800]">
                    <div className="absolute top-[10%] left-[-10%] w-[120%] h-[30%] bg-cyan-900/10 blur-[40px] rounded-full animate-fog-drift" />
                    <div className="absolute top-[60%] left-[20%] w-[100%] h-[20%] bg-fuchsia-900/5 blur-[40px] rounded-full animate-fog-drift [animation-delay:-10s]" />
                </div>

                {/* ═══ ENEMIES & PLAYER ═══ */}
                {enemies.map(e => <Enemy key={e.id} x={e.x} y={e.y} type={e.type} />)}
                <div ref={playerDOMRef} className="absolute z-30" style={{ left: playerPosRef.current.x, top: playerPosRef.current.y }}>
                    <Player />
                </div>
            </div>

            {/* ═══ CIRCULAR HOLOGRAPHIC RADAR ═══ */}
            <div className="absolute bottom-8 left-8 z-[900] pointer-events-none">
                <div className="w-44 h-44 rounded-full border border-cyan-500/30 bg-slate-950/80 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                    <div className="absolute inset-0 opacity-[0.1]" style={{
                        backgroundImage: 'radial-gradient(circle 1px, #22d3ee 1px, transparent 1px)',
                        backgroundSize: '15px 15px'
                    }} />
                    <div className="absolute inset-0 border border-cyan-400/10 rounded-full m-4" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-cyan-400/20 blur-sm animate-radar-sweep" />

                    {/* Radar Content */}
                    <div className="absolute inset-0 p-4">
                        {/* Player Point */}
                        <div
                            ref={radarPlayerRef}
                            className="absolute w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#fff]"
                            style={{
                                left: `${(playerPosRef.current.x / WORLD_WIDTH) * 100}%`,
                                top: `${(playerPosRef.current.y / WORLD_HEIGHT) * 100}%`
                            }}
                        />
                        {/* Enemy Points */}
                        {React.useMemo(() => enemies.map(e => (
                            <div key={e.id} className="absolute w-1 h-1 bg-red-500 rounded-full opacity-60" style={{
                                left: `${(e.x / WORLD_WIDTH) * 100}%`,
                                top: `${(e.y / WORLD_HEIGHT) * 100}%`
                            }} />
                        )), [])}
                    </div>
                </div>
                <div className="mt-4 flex flex-col items-center gap-1">
                    <span className="text-[9px] text-cyan-500/60 font-black tracking-widest uppercase">Radar Active</span>
                    <div className="flex gap-1">
                        {[...Array(4)].map((_, i) => <div key={i} className="w-1 h-1 bg-cyan-500/40 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />)}
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fog-drift {
                    0%, 100% { transform: translateX(0) scale(1); }
                    50% { transform: translateX(100px) scale(1.1); }
                }
                @keyframes radar-sweep {
                    0% { transform: translate(-50%, -50%) rotate(0deg) translateY(-100px); }
                    100% { transform: translate(-50%, -50%) rotate(360deg) translateY(-100px); }
                }
                .animate-fog-drift { animation: fog-drift 20s infinite ease-in-out; }
                .animate-radar-sweep { 
                    transform-origin: 50% 50%;
                    animation: radar-sweep 4s linear infinite; 
                }
            ` }} />
        </div>
    );

};

export default WorldMap;
