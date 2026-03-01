import React, { useState, useEffect, useMemo } from 'react';
import Player from './Player';
import Enemy from './Enemy';
import { Building, StreetLight, Billboard } from './Environment';
import { useGameState } from '../context/GameStateContext';

const WORLD_WIDTH = 2800;
const WORLD_HEIGHT = 2400;
const SPEED = 16;
const PLAYER_SIZE = 40;

const L1_TRIGGER = { x: 1272, y: 580, w: 256, h: 50 };

const checkCollision = (px, py, rect) => (
    px < rect.x + rect.w &&
    px + PLAYER_SIZE > rect.x &&
    py < rect.y + rect.h &&
    py + PLAYER_SIZE > rect.y
);

const WorldMap = () => {
    const { enterLevel } = useGameState();
    const [playerPos, setPlayerPos] = useState({ x: 1400, y: 2100 });
    const [keys, setKeys] = useState({});

    useEffect(() => {
        const down = (e) => setKeys(k => ({ ...k, [e.key.toLowerCase()]: true }));
        const up = (e) => setKeys(k => ({ ...k, [e.key.toLowerCase()]: false }));
        window.addEventListener('keydown', down);
        window.addEventListener('keyup', up);
        return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
    }, []);

    useEffect(() => {
        let raf;
        const loop = () => {
            setPlayerPos(prev => {
                let nx = prev.x, ny = prev.y;
                if (keys['w'] || keys['arrowup']) ny -= SPEED;
                if (keys['s'] || keys['arrowdown']) ny += SPEED;
                if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                if (keys['d'] || keys['arrowright']) nx += SPEED;
                nx = Math.max(0, Math.min(nx, WORLD_WIDTH - PLAYER_SIZE));
                ny = Math.max(0, Math.min(ny, WORLD_HEIGHT - PLAYER_SIZE));
                if (checkCollision(nx, ny, L1_TRIGGER)) {
                    enterLevel(-1);
                    return { x: prev.x, y: prev.y + 50 };
                }
                return { x: nx, y: ny };
            });
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, [keys, enterLevel]);

    const vx = window.innerWidth / 2 - playerPos.x - PLAYER_SIZE / 2;
    const vy = window.innerHeight / 2 - playerPos.y - PLAYER_SIZE / 2;

    const enemies = [
        { id: 1, x: 600, y: 1400, type: 'Phisher' },
        { id: 2, x: 2100, y: 2100, type: 'OTP Scammer' },
        { id: 3, x: 500, y: 2000, type: 'Data Broker' },
        { id: 4, x: 2200, y: 1500, type: 'Ransomware Bot' },
        { id: 5, x: 1800, y: 1800, type: 'Phisher' },
        { id: 6, x: 900, y: 800, type: 'Data Broker' },
    ];

    const env = useMemo(() => {
        const buildings = [];
        const lights = [];
        const billboards = [];

        // ═══ LEFT DISTRICT — Commercial Zone ═══
        const leftBuildings = [
            { x: 60, y: 200, w: 200, h: 380, n: 'bg-cyan-400' },
            { x: 100, y: 620, w: 180, h: 320, n: 'bg-fuchsia-500' },
            { x: 50, y: 980, w: 220, h: 400, n: 'bg-emerald-400' },
            { x: 120, y: 1400, w: 180, h: 350, n: 'bg-cyan-400' },
            { x: 60, y: 1780, w: 200, h: 380, n: 'bg-fuchsia-500' },
            { x: 100, y: 2150, w: 220, h: 300, n: 'bg-emerald-400' },
            // Second row
            { x: 300, y: 100, w: 160, h: 300, n: 'bg-fuchsia-500' },
            { x: 320, y: 470, w: 180, h: 360, n: 'bg-cyan-400' },
            { x: 280, y: 880, w: 200, h: 340, n: 'bg-emerald-400' },
            { x: 310, y: 1280, w: 170, h: 380, n: 'bg-fuchsia-500' },
            { x: 290, y: 1700, w: 190, h: 320, n: 'bg-cyan-400' },
            { x: 300, y: 2080, w: 180, h: 350, n: 'bg-emerald-400' },
        ];
        leftBuildings.forEach((b, i) => buildings.push({ id: `bl${i}`, x: b.x, y: b.y, width: b.w, height: b.h, neon: b.n, zIndexOffset: -50 }));

        // ═══ RIGHT DISTRICT — Tech Zone ═══
        const rightBuildings = [
            { x: 2300, y: 150, w: 220, h: 420, n: 'bg-cyan-400' },
            { x: 2350, y: 620, w: 180, h: 350, n: 'bg-emerald-400' },
            { x: 2280, y: 1020, w: 200, h: 380, n: 'bg-fuchsia-500' },
            { x: 2340, y: 1440, w: 190, h: 340, n: 'bg-cyan-400' },
            { x: 2300, y: 1820, w: 210, h: 370, n: 'bg-emerald-400' },
            { x: 2350, y: 2200, w: 180, h: 300, n: 'bg-fuchsia-500' },
            // Inner row
            { x: 2100, y: 250, w: 170, h: 320, n: 'bg-emerald-400' },
            { x: 2120, y: 640, w: 160, h: 350, n: 'bg-fuchsia-500' },
            { x: 2080, y: 1050, w: 190, h: 300, n: 'bg-cyan-400' },
            { x: 2130, y: 1400, w: 170, h: 360, n: 'bg-emerald-400' },
            { x: 2100, y: 1800, w: 180, h: 340, n: 'bg-fuchsia-500' },
            { x: 2120, y: 2150, w: 160, h: 300, n: 'bg-cyan-400' },
        ];
        rightBuildings.forEach((b, i) => buildings.push({ id: `br${i}`, x: b.x, y: b.y, width: b.w, height: b.h, neon: b.n, zIndexOffset: -50 }));

        // ═══ FAR BACKGROUND SKYLINE ═══
        for (let i = 0; i < 14; i++) {
            buildings.push({
                id: `bg${i}`, x: i * 200, y: -80 - (i % 5) * 30,
                width: 170 + (i % 4) * 30, height: 500 + (i % 5) * 50,
                neon: 'bg-cyan-400', color: 'bg-slate-950', zIndexOffset: -120
            });
        }

        // ═══ STREETLIGHTS — Main avenue + cross streets ═══
        for (let i = 0; i < 12; i++) {
            lights.push({ id: `mll${i}`, x: 680, y: 500 + i * 180, isLeft: true });
            lights.push({ id: `mlr${i}`, x: 1900, y: 500 + i * 180, isLeft: false });
        }
        // Cross street lights — only outside the main avenue
        for (let i = 0; i < 3; i++) {
            lights.push({ id: `clt${i}`, x: 550 + i * 100, y: 1190, isLeft: true });
            lights.push({ id: `clb${i}`, x: 550 + i * 100, y: 1810, isLeft: false });
            lights.push({ id: `crt${i}`, x: 1950 + i * 100, y: 1190, isLeft: false });
            lights.push({ id: `crb${i}`, x: 1950 + i * 100, y: 1810, isLeft: true });
        }

        // ═══ BILLBOARDS ═══
        billboards.push({ id: 'bb1', x: 550, y: 700, text: 'OBEY', color: 'text-red-500', glow: 'shadow-[0_0_25px_rgba(239,68,68,0.2)]' });
        billboards.push({ id: 'bb2', x: 2000, y: 900, text: 'PATCH', color: 'text-cyan-400', glow: 'shadow-[0_0_25px_rgba(34,211,238,0.2)]' });
        billboards.push({ id: 'bb3', x: 550, y: 1600, text: 'UPDATE', color: 'text-fuchsia-500', glow: 'shadow-[0_0_25px_rgba(217,70,239,0.2)]' });
        billboards.push({ id: 'bb4', x: 2000, y: 1700, text: 'SECURE', color: 'text-emerald-400', glow: 'shadow-[0_0_25px_rgba(16,185,129,0.2)]' });
        billboards.push({ id: 'bb5', x: 1100, y: 2200, text: 'VERIFY', color: 'text-amber-400', glow: 'shadow-[0_0_25px_rgba(245,158,11,0.2)]' });
        billboards.push({ id: 'bb6', x: 1600, y: 2200, text: 'ENCRYPT', color: 'text-indigo-400', glow: 'shadow-[0_0_25px_rgba(99,102,241,0.2)]' });

        return { buildings, lights, billboards };
    }, []);

    return (
        <div className="relative w-full h-full overflow-hidden bg-slate-950">

            {/* ═══ HUD ═══ */}
            <div className="absolute top-4 left-4 z-[900] bg-slate-900/95 p-4 border border-slate-700/50 rounded-lg" style={{ boxShadow: '0 0 20px rgba(0,0,0,0.4)' }}>
                <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full" style={{ boxShadow: '0 0 6px rgba(239,68,68,0.6)' }}></div>
                    <h1 className="text-lg font-black tracking-[0.15em] text-cyan-400 uppercase" style={{ textShadow: '0 0 8px rgba(34,211,238,0.3)' }}>
                        SECTOR 04 — DOWNTOWN
                    </h1>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mb-3 uppercase tracking-widest border-b border-slate-800 pb-2">
                    Navigate north to AEGIS HQ
                </p>
                <div className="flex gap-1.5 text-[10px] font-mono text-cyan-600">
                    {['W', 'A', 'S', 'D'].map(k => (
                        <span key={k} className="bg-slate-950 px-1.5 py-0.5 border border-cyan-900/50 rounded-sm text-center min-w-[22px]">{k}</span>
                    ))}
                    <span className="ml-2 text-slate-600 self-center text-[9px]">Movement</span>
                </div>
            </div>

            {/* Mini-map indicator */}
            <div className="absolute bottom-4 left-4 z-[900] bg-slate-900/95 border border-slate-700/50 rounded-md p-2 flex flex-col items-center gap-1">
                <div className="w-20 h-20 bg-slate-950 border border-slate-800 rounded-sm relative overflow-hidden">
                    {/* Mini world */}
                    <div className="absolute inset-0 opacity-30" style={{
                        backgroundImage: 'linear-gradient(rgba(34,211,238,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.2) 1px, transparent 1px)',
                        backgroundSize: '10px 10px'
                    }}></div>
                    {/* Main road */}
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-3 bg-slate-700"></div>
                    {/* Cross roads */}
                    <div className="absolute left-0 right-0 h-0.5 bg-slate-700" style={{ top: '40%' }}></div>
                    <div className="absolute left-0 right-0 h-0.5 bg-slate-700" style={{ top: '60%' }}></div>
                    {/* HQ marker */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-sm"></div>
                    {/* Player dot */}
                    <div className="absolute w-1.5 h-1.5 bg-green-400 rounded-full" style={{
                        left: `${(playerPos.x / WORLD_WIDTH) * 100}%`,
                        top: `${(playerPos.y / WORLD_HEIGHT) * 100}%`,
                        boxShadow: '0 0 4px rgba(74,222,128,0.8)'
                    }}></div>
                </div>
                <span className="text-[8px] text-slate-600 font-mono uppercase">MINI-MAP</span>
            </div>

            {/* ═══ WORLD CONTAINER ═══ */}
            <div className="absolute will-change-transform" style={{ width: WORLD_WIDTH, height: WORLD_HEIGHT, transform: `translate(${vx}px, ${vy}px)` }}>

                {/* Ground — Grid */}
                <div className="absolute inset-0 z-0 bg-slate-950" style={{
                    backgroundImage: `
                        linear-gradient(rgba(34,211,238,0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(34,211,238,0.03) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px'
                }}></div>

                {/* ═══ MAIN AVENUE — North-South ═══ */}
                <div className="absolute top-[500px] bottom-0 left-1/2 -translate-x-1/2 w-[700px] bg-slate-900/80 z-0" style={{ boxShadow: 'inset 0 0 40px rgba(0,0,0,0.3)' }}>
                    {/* Center dashed line */}
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1" style={{
                        backgroundImage: 'repeating-linear-gradient(to bottom, #f59e0b33 0px, #f59e0b33 20px, transparent 20px, transparent 40px)'
                    }}></div>
                    {/* Lane dividers */}
                    <div className="absolute top-0 bottom-0 left-[30%] w-px bg-slate-700/30"></div>
                    <div className="absolute top-0 bottom-0 right-[30%] w-px bg-slate-700/30"></div>
                    {/* Edge stripes */}
                    <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-r from-cyan-500/10 to-transparent"></div>
                    <div className="absolute top-0 bottom-0 right-0 w-1.5 bg-gradient-to-l from-fuchsia-500/10 to-transparent"></div>
                </div>

                {/* ═══ SIDEWALKS — Main Avenue ═══ */}
                <div className="absolute top-[500px] bottom-0 z-0" style={{ left: 'calc(50% - 410px)', width: 60 }}>
                    <div className="w-full h-full bg-slate-800/40 border-r border-slate-700/20" style={{
                        backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 30px, rgba(100,116,139,0.1) 30px, rgba(100,116,139,0.1) 31px)'
                    }}></div>
                </div>
                <div className="absolute top-[500px] bottom-0 z-0" style={{ left: 'calc(50% + 350px)', width: 60 }}>
                    <div className="w-full h-full bg-slate-800/40 border-l border-slate-700/20" style={{
                        backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 30px, rgba(100,116,139,0.1) 30px, rgba(100,116,139,0.1) 31px)'
                    }}></div>
                </div>

                {/* ═══ CROSS STREET 1 — East-West (top) ═══ */}
                <div className="absolute left-0 right-0 h-[80px] bg-slate-900/60 z-0" style={{ top: 1200 }}>
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px" style={{
                        backgroundImage: 'repeating-linear-gradient(to right, #f59e0b33 0px, #f59e0b33 20px, transparent 20px, transparent 40px)'
                    }}></div>
                </div>

                {/* ═══ CROSS STREET 2 — East-West (bottom) ═══ */}
                <div className="absolute left-0 right-0 h-[80px] bg-slate-900/60 z-0" style={{ top: 1800 }}>
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px" style={{
                        backgroundImage: 'repeating-linear-gradient(to right, #f59e0b33 0px, #f59e0b33 20px, transparent 20px, transparent 40px)'
                    }}></div>
                </div>

                {/* ═══ CROSSWALKS at intersections ═══ */}
                {[1200, 1800].map(cy => (
                    <React.Fragment key={cy}>
                        <div className="absolute z-1 opacity-20" style={{ left: 'calc(50% - 350px)', top: cy, width: 700, height: 80 }}>
                            <div className="w-full h-full" style={{
                                backgroundImage: 'repeating-linear-gradient(90deg, white 0px, white 30px, transparent 30px, transparent 60px)',
                                backgroundSize: '60px 100%'
                            }}></div>
                        </div>
                    </React.Fragment>
                ))}

                {/* ══ CROSSWALK at HQ entrance ═══ */}
                <div className="absolute z-1 opacity-25" style={{ left: 'calc(50% - 300px)', top: 600, width: 600, height: 50 }}>
                    <div className="w-full h-full" style={{
                        backgroundImage: 'repeating-linear-gradient(90deg, white 0px, white 30px, transparent 30px, transparent 60px)',
                    }}></div>
                </div>

                {/* ═══ PARK / PLAZA ZONE — between cross streets ═══ */}
                {/* Left Park */}
                <div className="absolute z-1" style={{ left: 530, top: 1320, width: 400, height: 420 }}>
                    {/* Grass ground */}
                    <div className="w-full h-full bg-emerald-950/40 rounded-lg border border-emerald-900/30" style={{ boxShadow: 'inset 0 0 30px rgba(16,185,129,0.05)' }}>
                        {/* Grass texture */}
                        <div className="w-full h-full opacity-20" style={{
                            backgroundImage: 'radial-gradient(circle 1px, #10b98133 0%, transparent 2px)',
                            backgroundSize: '8px 8px'
                        }}></div>
                    </div>
                    {/* Trees */}
                    {[{ x: 40, y: 60 }, { x: 160, y: 40 }, { x: 300, y: 80 }, { x: 100, y: 280 }, { x: 260, y: 300 }, { x: 340, y: 180 }].map((t, i) => (
                        <div key={`lt${i}`} className="absolute flex flex-col items-center" style={{ left: t.x, top: t.y, zIndex: Math.floor(1320 + t.y) }}>
                            <div className="w-16 h-14 bg-emerald-800 rounded-full" style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.4)' }}></div>
                            <div className="w-12 h-10 bg-emerald-700 rounded-full -mt-4"></div>
                            <div className="w-2 h-4 bg-amber-800 -mt-2"></div>
                            <div className="w-8 h-2 bg-black/20 rounded-full mt-0.5 blur-[2px]"></div>
                        </div>
                    ))}
                    {/* Benches */}
                    {[{ x: 80, y: 180 }, { x: 220, y: 200 }].map((b, i) => (
                        <div key={`lb${i}`} className="absolute" style={{ left: b.x, top: b.y, zIndex: Math.floor(1320 + b.y) }}>
                            <div className="w-20 h-4 bg-amber-800 rounded-sm border-t border-amber-700" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
                                <div className="flex justify-between px-1 pt-1">
                                    <div className="w-1 h-3 bg-amber-900"></div>
                                    <div className="w-1 h-3 bg-amber-900"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {/* Park label */}
                    <div className="absolute top-2 left-2 text-[8px] text-emerald-600/60 font-mono uppercase tracking-widest">SECTOR PARK</div>
                </div>

                {/* Right Park */}
                <div className="absolute z-1" style={{ left: 1870, top: 1320, width: 350, height: 420 }}>
                    <div className="w-full h-full bg-emerald-950/40 rounded-lg border border-emerald-900/30" style={{ boxShadow: 'inset 0 0 30px rgba(16,185,129,0.05)' }}>
                        <div className="w-full h-full opacity-20" style={{
                            backgroundImage: 'radial-gradient(circle 1px, #10b98133 0%, transparent 2px)',
                            backgroundSize: '8px 8px'
                        }}></div>
                    </div>
                    {[{ x: 50, y: 50 }, { x: 200, y: 70 }, { x: 130, y: 250 }, { x: 280, y: 300 }, { x: 60, y: 330 }].map((t, i) => (
                        <div key={`rt${i}`} className="absolute flex flex-col items-center" style={{ left: t.x, top: t.y, zIndex: Math.floor(1320 + t.y) }}>
                            <div className="w-14 h-12 bg-emerald-800 rounded-full" style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.4)' }}></div>
                            <div className="w-10 h-8 bg-emerald-700 rounded-full -mt-3"></div>
                            <div className="w-2 h-3 bg-amber-800 -mt-1.5"></div>
                            <div className="w-6 h-1.5 bg-black/20 rounded-full mt-0.5 blur-[1px]"></div>
                        </div>
                    ))}
                    <div className="absolute top-2 left-2 text-[8px] text-emerald-600/60 font-mono uppercase tracking-widest">TECH GARDEN</div>
                </div>

                {/* ═══ GROUND DETAILS — Manholes, grates, puddles ═══ */}
                {[
                    { x: 1350, y: 900, type: 'manhole' },
                    { x: 1450, y: 1500, type: 'manhole' },
                    { x: 1350, y: 2000, type: 'manhole' },
                    { x: 1250, y: 1200, type: 'grate' },
                    { x: 1550, y: 1800, type: 'grate' },
                ].map((d, i) => (
                    <div key={`gd${i}`} className="absolute z-1" style={{ left: d.x, top: d.y }}>
                        {d.type === 'manhole' ? (
                            <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-700" style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)' }}>
                                <div className="w-4 h-0.5 bg-slate-600 absolute top-3.5 left-2 rounded-full"></div>
                                <div className="w-0.5 h-4 bg-slate-600 absolute top-2 left-3.5 rounded-full"></div>
                            </div>
                        ) : (
                            <div className="w-10 h-6 bg-slate-800 border border-slate-700 rounded-sm" style={{
                                backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 2px, rgba(100,116,139,0.3) 2px, rgba(100,116,139,0.3) 3px)',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                            }}></div>
                        )}
                    </div>
                ))}

                {/* ═══ AMBIENT OBJECTS — Vending machines, ATMs, trash cans ═══ */}
                {/* Vending machines */}
                {[{ x: 530, y: 900 }, { x: 2070, y: 1100 }].map((vm, i) => (
                    <div key={`vm${i}`} className="absolute z-10" style={{ left: vm.x, top: vm.y, zIndex: Math.floor(vm.y) }}>
                        <div className="w-10 h-16 bg-slate-800 border border-slate-700 rounded-sm overflow-hidden" style={{ boxShadow: '4px 4px 8px rgba(0,0,0,0.5)' }}>
                            <div className="w-full h-3 bg-red-600 flex items-center justify-center">
                                <span className="text-[4px] text-white font-bold">DRINK</span>
                            </div>
                            <div className="grid grid-cols-3 gap-px p-0.5 mt-0.5">
                                {[...'🟡🔴🟢🟡🔵🟠'].map((c, j) => <div key={j} className="w-2 h-2 bg-slate-700 rounded-sm"></div>)}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Trash cans */}
                {[{ x: 680, y: 1050 }, { x: 1920, y: 1050 }, { x: 680, y: 1650 }, { x: 1920, y: 1650 }].map((tc, i) => (
                    <div key={`tc${i}`} className="absolute z-10" style={{ left: tc.x, top: tc.y, zIndex: Math.floor(tc.y) }}>
                        <div className="w-6 h-8 bg-slate-600 rounded-t-sm rounded-b-md border border-slate-500" style={{ boxShadow: '2px 2px 4px rgba(0,0,0,0.4)' }}>
                            <div className="w-7 h-1.5 bg-slate-500 rounded-sm -ml-0.5 -mt-0.5"></div>
                        </div>
                    </div>
                ))}

                {/* ATM */}
                <div className="absolute z-10" style={{ left: 530, y: 1100, top: 1100, zIndex: 1100 }}>
                    <div className="w-12 h-14 bg-slate-700 border border-slate-600 rounded-sm" style={{ boxShadow: '4px 4px 8px rgba(0,0,0,0.5)' }}>
                        <div className="w-8 h-4 bg-cyan-900 mx-auto mt-1 rounded-sm border border-cyan-700">
                            <div className="w-6 h-2 bg-cyan-500/30 mx-auto mt-0.5 rounded-sm"></div>
                        </div>
                        <div className="text-[4px] text-center text-slate-400 mt-0.5 font-mono">ATM</div>
                        <div className="w-4 h-1 bg-emerald-500/50 mx-auto mt-1 rounded-full" style={{ boxShadow: '0 0 4px rgba(16,185,129,0.3)' }}></div>
                    </div>
                </div>

                {/* ═══ ENVIRONMENT RENDERING ═══ */}
                {env.buildings.map(bl => <Building key={bl.id} {...bl} />)}
                {env.lights.map(lt => <StreetLight key={lt.id} {...lt} />)}
                {env.billboards.map(bb => <Billboard key={bb.id} {...bb} />)}

                {/* ═══ AEGIS HEADQUARTERS ═══ */}
                <div className="absolute left-1/2 -translate-x-1/2 w-[1000px] h-[550px]" style={{ top: 80, zIndex: 600 }}>

                    {/* HQ Main Building — wider, more impressive */}
                    <div className="w-[800px] h-[220px] bg-slate-950 absolute top-[80px] left-1/2 -translate-x-1/2 z-20 flex flex-col justify-center items-center overflow-hidden border-y-4 border-slate-700"
                        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(34,211,238,0.08)' }}>
                        {/* HQ Name */}
                        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-200 via-cyan-400 to-cyan-700 tracking-[0.3em] z-10"
                            style={{ filter: 'drop-shadow(0 0 15px rgba(34,211,238,0.5))' }}>
                            A E G I S
                        </div>
                        <div className="text-cyan-500/70 tracking-[0.6em] text-[10px] mt-1 font-mono uppercase">SECURE SOLUTIONS HQ</div>
                        <div className="flex gap-4 mt-3">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full" style={{ boxShadow: '0 0 6px rgba(34,211,238,0.6)' }}></div>
                            <div className="w-2 h-2 bg-emerald-400 rounded-full" style={{ boxShadow: '0 0 6px rgba(16,185,129,0.6)' }}></div>
                            <div className="w-2 h-2 bg-cyan-400 rounded-full" style={{ boxShadow: '0 0 6px rgba(34,211,238,0.6)' }}></div>
                        </div>
                        {/* Subtle pattern */}
                        <div className="absolute inset-0 opacity-[0.03]" style={{
                            backgroundImage: 'radial-gradient(circle, #22d3ee 1px, transparent 1px)',
                            backgroundSize: '16px 16px'
                        }}></div>
                    </div>

                    {/* Server Tower — Left */}
                    <div className="absolute bottom-0 left-0 w-32 h-[450px] bg-slate-900 border-2 border-slate-700 rounded-t-sm flex flex-col items-center pt-4 gap-2"
                        style={{ boxShadow: '0 0 25px rgba(34,211,238,0.08)' }}>
                        <div className="text-[7px] text-cyan-600/60 font-mono mb-1 tracking-widest">NODE-A</div>
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="w-22 h-5 bg-slate-950 border border-slate-800 flex items-center px-1.5 gap-1" style={{ width: 88 }}>
                                <div className={`w-1.5 h-1.5 rounded-full ${['bg-cyan-500', 'bg-emerald-500', 'bg-fuchsia-500'][i % 3]}`}
                                    style={{ boxShadow: `0 0 3px currentColor` }}></div>
                                <div className="flex-1 h-0.5 bg-slate-800"></div>
                                <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                            </div>
                        ))}
                    </div>

                    {/* Server Tower — Right */}
                    <div className="absolute bottom-0 right-0 w-32 h-[450px] bg-slate-900 border-2 border-slate-700 rounded-t-sm flex flex-col items-center pt-4 gap-2"
                        style={{ boxShadow: '0 0 25px rgba(34,211,238,0.08)' }}>
                        <div className="text-[7px] text-cyan-600/60 font-mono mb-1 tracking-widest">NODE-B</div>
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="w-22 h-5 bg-slate-950 border border-slate-800 flex items-center px-1.5 gap-1" style={{ width: 88 }}>
                                <div className={`w-1.5 h-1.5 rounded-full ${['bg-fuchsia-500', 'bg-cyan-500', 'bg-emerald-500'][i % 3]}`}
                                    style={{ boxShadow: `0 0 3px currentColor` }}></div>
                                <div className="flex-1 h-0.5 bg-slate-800"></div>
                                <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                            </div>
                        ))}
                    </div>

                    {/* Security Fence around HQ */}
                    <div className="absolute -left-4 -right-4 -bottom-4 h-[6px] bg-slate-700 z-30" style={{
                        backgroundImage: 'repeating-linear-gradient(90deg, #475569 0px, #475569 2px, #1e293b 2px, #1e293b 8px)'
                    }}></div>

                    {/* Gate Entrance — Forcefield */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center justify-end group cursor-pointer"
                        style={{ width: L1_TRIGGER.w, height: L1_TRIGGER.h + 30 }}>

                        {/* Forcefield arch */}
                        <div className="absolute bottom-0 w-64 h-52 bg-cyan-900/12 border-t-4 border-x-4 border-cyan-500/70 rounded-t-3xl flex flex-col justify-center items-center overflow-hidden group-hover:bg-cyan-500/20 transition-colors"
                            style={{ boxShadow: '0 0 40px rgba(34,211,238,0.2)' }}>
                            {/* Scanlines */}
                            <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 5px, #22d3ee15 5px, #22d3ee15 7px)' }}></div>
                            {/* Lock */}
                            <div className="w-10 h-8 bg-slate-900 border-2 border-cyan-400 mt-8 rounded flex justify-center z-10 relative group-hover:border-green-400 transition-colors"
                                style={{ boxShadow: '0 0 10px rgba(34,211,238,0.6)' }}>
                                <div className="w-5 h-5 border-[3px] border-cyan-400 rounded-full absolute -top-4 group-hover:border-green-400 transition-colors"></div>
                                <div className="w-1.5 h-2.5 bg-cyan-400 mt-1.5 group-hover:bg-green-400 transition-colors"></div>
                            </div>
                        </div>

                        {/* Hover hologram */}
                        <div className="absolute -top-24 bg-black/90 px-8 py-4 border border-cyan-500/30 rounded group-hover:-translate-y-2 group-hover:scale-105 transition-transform opacity-70 group-hover:opacity-100 z-40"
                            style={{ boxShadow: '0 0 20px rgba(34,211,238,0.15)' }}>
                            <p className="text-cyan-500 font-mono text-[10px] tracking-[0.3em] text-center uppercase">SYSTEM ACCESS</p>
                            <p className="text-white text-2xl font-black mt-1 text-center tracking-[0.2em]" style={{ textShadow: '0 0 8px rgba(34,211,238,0.4)' }}>CASE #01</p>
                            <p className="text-emerald-400 font-mono text-[10px] mt-2 text-center border-t border-slate-700 pt-2">Mission: The OTP Trap</p>
                            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[20px] border-r-[20px] border-t-[25px] border-l-transparent border-r-transparent border-t-cyan-500/10"></div>
                        </div>
                    </div>
                </div>

                {/* ═══ ZONE LABELS on ground ═══ */}
                <div className="absolute text-[10px] text-slate-700/40 font-mono uppercase tracking-[0.5em] pointer-events-none" style={{ left: 160, top: 500, transform: 'rotate(-90deg)', transformOrigin: 'left top' }}>
                    COMMERCIAL DISTRICT
                </div>
                <div className="absolute text-[10px] text-slate-700/40 font-mono uppercase tracking-[0.5em] pointer-events-none" style={{ left: 2550, top: 500, transform: 'rotate(90deg)', transformOrigin: 'left top' }}>
                    TECH DISTRICT
                </div>
                <div className="absolute text-[10px] text-slate-700/40 font-mono uppercase tracking-[0.5em] pointer-events-none text-center" style={{ left: '50%', top: 2300, transform: 'translateX(-50%)' }}>
                    DOWNTOWN SECTOR 04
                </div>

                {/* ═══ ENEMIES ═══ */}
                {enemies.map(e => <Enemy key={e.id} x={e.x} y={e.y} type={e.type} />)}

                {/* ═══ PLAYER ═══ */}
                <Player x={playerPos.x} y={playerPos.y} />

            </div>
        </div>
    );
};

export default WorldMap;
