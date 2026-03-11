import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '../context/GameStateContext';
import SpotThePhish from './minigames/SpotThePhish';
import URLAssassin from './minigames/URLAssassin';
import ImpersonationHunt from './minigames/ImpersonationHunt';
import AppArmor from './minigames/AppArmor';
import CareerGuard from './minigames/CareerGuard';
import FileFortress from './minigames/FileFortress';
import WiFiSentry from './minigames/WiFiSentry';
import BrowserSentry from './minigames/BrowserSentry';
import CryptoChase from './minigames/CryptoChase';
import DDOSDefense from './minigames/DDOSDefense';
import BotnetSurvivors from './minigames/BotnetSurvivors';

const CyberDefenseLab = () => {
    const containerRef = useRef(null);
    const { enterLevel } = useGameState();
    const [view, setView] = useState('hub');
    const [activeGame, setActiveGame] = useState(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!containerRef.current) return;
            const x = e.clientX;
            const y = e.clientY;
            const px = (x / window.innerWidth - 0.5) * 10;
            const py = (y / window.innerHeight - 0.5) * 10;
            
            containerRef.current.style.setProperty('--m-x', `${x}px`);
            containerRef.current.style.setProperty('--m-y', `${y}px`);
            containerRef.current.style.setProperty('--m-px', `${px}`);
            containerRef.current.style.setProperty('--m-py', `${py}`);
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const TechnicalIcon = ({ type, color = "stroke-cyan-500" }) => {
        const icons = {
            shield: (
                <svg viewBox="0 0 24 24" fill="none" className={`w-12 h-12 ${color}`} strokeWidth="1.5">
                    <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            ),
            terminal: (
                <svg viewBox="0 0 24 24" fill="none" className={`w-12 h-12 ${color}`} strokeWidth="1.5">
                    <path d="M4 17L10 11L4 5M12 19H20" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            ),
            target: (
                <svg viewBox="0 0 24 24" fill="none" className={`w-12 h-12 ${color}`} strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                </svg>
            ),
            network: (
                <svg viewBox="0 0 24 24" fill="none" className={`w-12 h-12 ${color}`} strokeWidth="1.5">
                    <rect x="2" y="16" width="6" height="6" rx="1" />
                    <rect x="16" y="16" width="6" height="6" rx="1" />
                    <rect x="9" y="2" width="6" height="6" rx="1" />
                    <path d="M12 8V12M12 12H5V16M12 12H19V16" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            ),
            globe: (
                <svg viewBox="0 0 24 24" fill="none" className={`w-12 h-12 ${color}`} strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12H22" />
                    <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z" />
                </svg>
            ),
            database: (
                <svg viewBox="0 0 24 24" fill="none" className={`w-12 h-12 ${color}`} strokeWidth="1.5">
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M3 5V19C3 20.6569 7.02944 22 12 22C16.9706 22 21 20.6569 21 19V5" />
                    <path d="M3 12C3 13.6569 7.02944 15 12 15C16.9706 15 21 13.6569 21 12" />
                </svg>
            ),
            user: (
                <svg viewBox="0 0 24 24" fill="none" className={`w-12 h-12 ${color}`} strokeWidth="1.5">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            )
        };
        return icons[type] || icons.shield;
    };

    const renderBackground = () => (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-slate-50">
            {/* Soft SOC Mesh Gradient */}
            <div className="absolute inset-0 opacity-40">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-100 blur-[120px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-100 blur-[120px] animate-pulse animation-delay-2000" />
            </div>
            
            {/* Tactical Grid (Flattened Light) */}
            <div 
                className="absolute inset-0 opacity-[0.15]"
                style={{ 
                    backgroundImage: `linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                    transform: `translate(calc(var(--m-px, 0) * -1px), calc(var(--m-py, 0) * -1px))`,
                }}
            />

            {/* Retro Scanline Overlay (Light Mode) */}
            <div className="absolute inset-0 z-50 pointer-events-none opacity-[0.03] bg-scanlines mix-blend-multiply" />
            
            {/* CRT Flicker & Vignette (Light Mode) */}
            <div className="absolute inset-0 z-50 pointer-events-none bg-crt-vignette-light opacity-20 animate-flicker" />

            {/* UI Frames */}
            <div className="absolute inset-0 border-[2px] border-slate-200 m-4 pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/40" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-500/40" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-500/40" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/40" />
            </div>
        </div>
    );

    const LiveDataHUD = () => (
        <div className="fixed inset-0 z-20 pointer-events-none overflow-hidden font-mono text-[9px] uppercase font-bold text-slate-500/50 p-8">
            <div className="absolute top-8 left-8 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-slate-700">NODE_STATUS: STABLE</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-24 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-600/40 animate-[loading_4s_linear_infinite]" style={{ width: '60%' }} />
                    </div>
                    <span className="text-cyan-700/60 tracking-widest">ENCRYPTION_LAYER_v4.2</span>
                </div>
            </div>

            <div className="absolute top-8 right-8 text-right flex flex-col items-end">
                <div className="px-2 py-1 bg-white/70 border border-slate-200 rounded text-cyan-700 mb-1 flex items-center gap-2 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    SIGNAL_LATENCY: 12ms
                </div>
                <div className="text-[8px] text-slate-400 font-mono font-bold">
                    SEC_LEVEL: ALPHA_7 // {new Date().toLocaleDateString()}
                </div>
            </div>

            <div className="absolute bottom-8 left-8 flex flex-col gap-1 opacity-70">
                <span className="text-cyan-600/60 mb-1">{" [ DATA_STREAM_v0.9 ]"}</span>
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-4">
                        <span className="text-slate-400">[{Math.random().toString(16).slice(2, 8).toUpperCase()}]</span>
                        <span className="text-cyan-800/40">BUFFER_ALLOCATION_0x{i}F4</span>
                    </div>
                ))}
            </div>

            <div className="absolute bottom-8 right-8 flex items-end gap-1 h-6">
                {[...Array(12)].map((_, i) => (
                    <div 
                        key={i}
                        className="w-1 bg-slate-300 rounded-t"
                        style={{ 
                            height: `${40 + Math.sin(i * 0.5) * 40}%`,
                            animation: `soundwave 1s ease-in-out infinite alternate`,
                            animationDelay: `${i * 0.05}s`
                        }}
                    />
                ))}
            </div>
        </div>
    );

    const ParallaxCard = ({ children, onClick, className, colorShadow, glowColor = "cyan" }) => {
        const cardRef = useRef(null);

        const handleMouseMove = (e) => {
            if (!cardRef.current) return;
            const rect = cardRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            
            // Snappy 2D Tactile Offsets
            cardRef.current.style.setProperty('--t-x', `${x * 12}px`);
            cardRef.current.style.setProperty('--t-y', `${y * 12}px`);
            cardRef.current.style.setProperty('--scan-y', `${(y + 0.5) * 100}%`);
        };

        const handleMouseLeave = () => {
            if (!cardRef.current) return;
            cardRef.current.style.setProperty('--t-x', `0px`);
            cardRef.current.style.setProperty('--t-y', `0px`);
        };

        const colors = {
            cyan: "group-hover:shadow-[0_10px_30px_rgba(6,182,212,0.1)] group-hover:border-cyan-500/40",
            indigo: "group-hover:shadow-[0_10px_30px_rgba(99,102,241,0.1)] group-hover:border-indigo-500/40",
            emerald: "group-hover:shadow-[0_10px_30px_rgba(16,185,129,0.1)] group-hover:border-emerald-500/40",
            rose: "group-hover:shadow-[0_10px_30px_rgba(244,63,94,0.1)] group-hover:border-rose-500/40",
            amber: "group-hover:shadow-[0_10px_30px_rgba(245,158,11,0.1)] group-hover:border-amber-500/40",
            violet: "group-hover:shadow-[0_10px_30px_rgba(139,92,246,0.1)] group-hover:border-violet-500/40",
            sky: "group-hover:shadow-[0_10px_30px_rgba(14,165,233,0.1)] group-hover:border-sky-500/40",
            orange: "group-hover:shadow-[0_10px_30px_rgba(249,115,22,0.1)] group-hover:border-orange-500/40",
            teal: "group-hover:shadow-[0_10px_30px_rgba(20,184,166,0.1)] group-hover:border-teal-500/40",
            blue: "group-hover:shadow-[0_10px_30px_rgba(59,130,246,0.1)] group-hover:border-blue-500/40",
        };

        return (
            <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={onClick}
                className={`group relative cursor-pointer bg-white/90 backdrop-blur-md border border-slate-200 rounded-lg overflow-hidden transition-all duration-300 ease-out shadow-sm hover:shadow-xl ${colors[glowColor] || colors.cyan} ${className}`}
                style={{
                    transform: `translate(var(--t-x, 0px), var(--t-y, 0px))`,
                    willChange: 'transform'
                }}
            >
                {/* 2D Scanning Bar */}
                <div 
                    className={`absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-${glowColor}-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}
                    style={{ top: 'var(--scan-y, 0%)' }}
                />
                
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-200 group-hover:border-cyan-400 transition-colors" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-slate-200 group-hover:border-cyan-400 transition-colors" />

                <div className="relative z-10 flex flex-col h-full p-1">
                    {children}
                </div>
            </div>
        );
    };

    const renderHub = () => (
        <div className="relative z-10 flex flex-col items-center justify-center gap-12 w-full max-w-7xl px-8 animate-fade-in">
            <LiveDataHUD />
            <div className="text-center relative">
                <div className="mb-6 flex items-center justify-center gap-3">
                    <div className="h-[1px] w-8 bg-slate-300" />
                    <span className="text-slate-400 font-mono text-[9px] tracking-[0.4em] uppercase font-bold">Terminal_Session: ACTIVE</span>
                    <div className="h-[1px] w-8 bg-slate-300" />
                </div>
                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 uppercase tracking-tight mb-4 leading-none flex flex-wrap justify-center items-center drop-shadow-[0_5px_15px_rgba(0,0,0,0.05)]">
                    <span className="inline-block animate-glitch-text">Cyber</span>
                    <span className="inline-block text-cyan-600 px-4 animate-flicker">
                        /
                    </span>
                    <span className="inline-block bg-gradient-to-r from-cyan-600 to-indigo-600 bg-clip-text text-transparent">
                        Defense
                    </span>
                    <span className="inline-block ml-4 animate-glitch-text animation-delay-500">Lab</span>
                </h1>
                <div className="flex items-center justify-center gap-8 mt-10">
                    <div className="flex gap-1.5">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className={`w-1 h-3 bg-slate-200 rounded-sm ${i === 2 ? 'bg-cyan-500 animate-pulse' : ''}`} />
                        ))}
                    </div>
                    <p className="text-slate-500 font-mono text-[9px] tracking-[0.6em] uppercase font-black">
                        PROTOCOL_v4.5 // SYSTEM_HUB
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full mt-8 max-w-4xl">
                <ParallaxCard
                    onClick={() => setView('minigames')}
                    className="p-10 min-h-[300px]"
                    glowColor="cyan"
                >
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                            <TechnicalIcon type="terminal" color="stroke-cyan-600" />
                        </div>
                        <div>
                            <span className="text-cyan-600 text-[10px] font-black tracking-widest uppercase block mb-1">Module_Set_01</span>
                            <h2 className="text-3xl font-black text-slate-800 leading-none tracking-wider">TRAINING</h2>
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed mb-10 max-w-xs font-semibold">
                        Calibration drills focusing on credential integrity and behavioral analysis.
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                        <span className="text-slate-400 text-[9px] font-black tracking-widest uppercase">8_Modules_Available</span>
                        <div className="flex items-center gap-4 group/btn">
                            <span className="text-slate-900 font-bold text-xs uppercase tracking-widest">Execute</span>
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white group-hover:bg-cyan-600 transition-all">
                                <span>→</span>
                            </div>
                        </div>
                    </div>
                </ParallaxCard>

                <ParallaxCard
                    onClick={() => setView('arcade')}
                    className="p-10 min-h-[300px]"
                    glowColor="indigo"
                >
                    <div className="flex items-center gap-4 mb-10">
                        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                            <TechnicalIcon type="network" color="stroke-indigo-600" />
                        </div>
                        <div>
                            <span className="text-indigo-600 text-[10px] font-black tracking-widest uppercase block mb-1">Simulation_Set_02</span>
                            <h2 className="text-3xl font-black text-slate-800 leading-none tracking-wider">OPERATIONS</h2>
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed mb-10 max-w-xs font-semibold">
                        Actionable threat mitigation sims for high-latency combat environments.
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                        <span className="text-slate-400 text-[9px] font-black tracking-widest uppercase">3_Sims_Active</span>
                        <div className="flex items-center gap-4 group/btn">
                            <span className="text-slate-900 font-bold text-xs uppercase tracking-widest">Connect</span>
                            <div className="w-10 h-10 rounded bg-slate-900 flex items-center justify-center text-white group-hover:bg-cyan-600 group-hover:shadow-[0_5px_15px_rgba(8,145,178,0.3)] transition-all">
                                <span>→</span>
                            </div>
                        </div>
                    </div>
                </ParallaxCard>
            </div>

            <button
                onClick={() => enterLevel(-2)}
                className="mt-12 group flex items-center gap-4 px-10 py-4 bg-white border border-slate-200 rounded hover:border-slate-300 hover:bg-slate-50 transition-all duration-300 shadow-sm hover:shadow-md"
            >
                <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-rose-500 animate-pulse transition-colors" />
                <span className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em]">[ DEACTIVATE_SESSION ]</span>
            </button>
        </div>
    );

    const MINIGAME_CARDS = [
        { key: 'SpotThePhish', icon: 'terminal', tag: 'MOD_01', title: 'Phish Hunter', desc: 'Identify credential harvesters in email streams.', color: 'emerald', iconColor: 'stroke-emerald-600' },
        { key: 'URLAssassin', icon: 'target', tag: 'MOD_02', title: 'URL Assassin', desc: 'Neutralize homograph and punycode exploits.', color: 'rose', iconColor: 'stroke-rose-600' },
        { key: 'ImpersonationHunt', icon: 'user', tag: 'MOD_03', title: 'Social Sentry', desc: 'Detect forensic anomalies in verification data.', color: 'violet', iconColor: 'stroke-violet-600' },
        { key: 'AppArmor', icon: 'shield', tag: 'MOD_04', title: 'App Armor', desc: 'Sanitize packages for permission escalation.', color: 'cyan', iconColor: 'stroke-cyan-600' },
        { key: 'CareerGuard', icon: 'user', tag: 'MOD_05', title: 'Career Guard', desc: 'Filter social engineering traps in recruitment.', color: 'blue', iconColor: 'stroke-blue-600' },
        { key: 'FileFortress', icon: 'database', tag: 'MOD_06', title: 'File Fortress', desc: 'Deconstruct attachments for hidden payloads.', color: 'amber', iconColor: 'stroke-amber-600' },
        { key: 'WiFiSentry', icon: 'network', tag: 'MOD_07', title: 'WiFi Sentry', desc: 'Identify rogue access points and evil twins.', color: 'teal', iconColor: 'stroke-teal-600' },
        { key: 'BrowserSentry', icon: 'globe', tag: 'MOD_08', title: 'Net Sentry', desc: 'Enforce SSL integrity and DOM validation.', color: 'sky', iconColor: 'stroke-sky-600' },
    ];

    const ARCADE_CARDS = [
        { key: 'CryptoChase', icon: 'database', tag: 'SIM_01', title: 'Encrypter Chase', desc: 'Outrun the worm before it locks the root.', color: 'cyan' },
        { key: 'DDOSDefense', icon: 'shield', tag: 'SIM_02', title: 'Flood Barrier', desc: 'Deploy rate-limiters against volumetric floods.', color: 'indigo' },
        { key: 'BotnetSurvivors', icon: 'network', tag: 'SIM_03', title: 'Core Survivor', desc: 'Maneuver server nodes through botnet swarms.', color: 'orange' },
    ];

    const renderGameGrid = (cards, type) => (
        <div className="relative z-10 w-full max-w-7xl px-8 animate-fade-in py-16">
            <LiveDataHUD />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16 border-l-4 border-cyan-600 pl-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-pulse" />
                        <span className="text-slate-400 font-mono text-[9px] font-black uppercase tracking-widest">Access_Authorized</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 uppercase tracking-tight leading-none drop-shadow-sm">
                        {type === 'minigames' ? 'TRAINING.LOG' : 'OPERATIONS_ROOM'}
                    </h2>
                </div>
                <button
                    onClick={() => setView('hub')}
                    className="px-8 py-3 bg-white text-slate-900 border border-slate-200 rounded font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all duration-300 shadow-sm"
                >
                    ← Terminate_View
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card) => (
                    <ParallaxCard
                        key={card.key}
                        onClick={() => { setActiveGame(card.key); setView('playing'); }}
                        className="p-8 min-h-[260px]"
                        glowColor={card.color}
                    >
                        <div className="flex justify-between items-start mb-10 translate-z-20">
                            <div className={`p-2.5 bg-${card.color}-50 border border-${card.color}-200 rounded-lg group-hover:bg-white transition-colors`}>
                                <TechnicalIcon type={card.icon} color={card.iconColor || `stroke-${card.color}-600`} />
                            </div>
                            <span className="text-[9px] font-black font-mono text-slate-300 tracking-tighter">[{card.tag}]</span>
                        </div>
                        
                        <h3 className={`text-xl font-black text-slate-800 mb-3 leading-tight group-hover:text-${card.color}-700 transition-colors translate-z-20`}>{card.title}</h3>
                        <p className="text-slate-500 text-xs leading-relaxed font-bold mb-8 translate-z-10">
                            {card.desc}
                        </p>

                        <div className="mt-auto flex items-center justify-between translate-z-20">
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 transition-colors">
                                [ Launch ]
                            </div>
                            <div className={`w-8 h-8 rounded bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white group-hover:scale-110 transition-all shadow-sm`}>
                                <span className="text-lg">→</span>
                            </div>
                        </div>
                    </ParallaxCard>
                ))}
            </div>

            <style jsx>{`
                .preserve-3d { transform-style: preserve-3d; }
                .translate-z-10 { transform: translateZ(10px); }
                .translate-z-20 { transform: translateZ(20px); }
                
                @keyframes loading {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
                @keyframes soundwave {
                    from { transform: scaleY(0.4); }
                    to { transform: scaleY(1); }
                }
                @keyframes flicker {
                    0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100% { opacity: 0.99; }
                    20%, 21.999%, 63%, 63.999%, 65%, 69.999% { opacity: 0.4; }
                }
                .animate-flicker { animation: flicker 0.15s infinite; }
                @keyframes glitch-text {
                    0% { transform: translate(0); text-shadow: none; }
                    20% { transform: translate(-2px, 2px); text-shadow: 2px 0 #0ff, -2px 0 #f0f; }
                    40% { transform: translate(2px, -2px); text-shadow: -2px 0 #0ff, 2px 0 #f0f; }
                    60% { transform: translate(-2px, -2px); text-shadow: 2px 0 #0ff, -2px 0 #f0f; }
                    80% { transform: translate(2px, 2px); text-shadow: -2px 0 #0ff, 2px 0 #f0f; }
                    100% { transform: translate(0); text-shadow: none; }
                }
                .animate-glitch-text { animation: glitch-text 4s linear infinite; }
                .bg-scanlines {
                    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%),
                                linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));
                    background-size: 100% 3px, 3px 100%;
                }
                .bg-crt-vignette-light {
                    background: radial-gradient(circle, transparent 70%, rgba(203, 213, 225, 0.4) 150%);
                }
                .selection\:bg-cyan-100 selection\:text-cyan-900 ::selection { background: #cffafe; color: #164e63; }
            `}</style>
        </div>
    );

    return (
        <div 
            ref={containerRef}
            className="relative w-screen h-screen overflow-x-hidden overflow-y-auto flex flex-col items-center justify-center font-sans selection:bg-cyan-100 selection:text-cyan-900"
        >
            {renderBackground()}

            <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center">
                {view === 'hub' && renderHub()}
                {view === 'minigames' && renderGameGrid(MINIGAME_CARDS, 'minigames')}
                {view === 'arcade' && renderGameGrid(ARCADE_CARDS, 'arcade')}

                {view === 'playing' && (
                    <div className="fixed inset-0 z-[100] bg-white animate-fade-in overflow-auto">
                        {activeGame === 'SpotThePhish' && <SpotThePhish onBack={() => { setView('minigames'); setActiveGame(null); }} />}
                        {activeGame === 'URLAssassin' && <URLAssassin onBack={() => { setView('minigames'); setActiveGame(null); }} />}
                        {activeGame === 'ImpersonationHunt' && <ImpersonationHunt onBack={() => { setView('minigames'); setActiveGame(null); }} />}
                        {activeGame === 'AppArmor' && <AppArmor onBack={() => { setView('minigames'); setActiveGame(null); }} />}
                        {activeGame === 'CareerGuard' && <CareerGuard onBack={() => { setView('minigames'); setActiveGame(null); }} />}
                        {activeGame === 'FileFortress' && <FileFortress onBack={() => { setView('minigames'); setActiveGame(null); }} />}
                        {activeGame === 'WiFiSentry' && <WiFiSentry onBack={() => { setView('minigames'); setActiveGame(null); }} />}
                        {activeGame === 'BrowserSentry' && <BrowserSentry onBack={() => { setView('minigames'); setActiveGame(null); }} />}
                        {activeGame === 'CryptoChase' && <CryptoChase onBack={() => { setView('arcade'); setActiveGame(null); }} />}
                        {activeGame === 'DDOSDefense' && <DDOSDefense onBack={() => { setView('arcade'); setActiveGame(null); }} />}
                        {activeGame === 'BotnetSurvivors' && <BotnetSurvivors onBack={() => { setView('arcade'); setActiveGame(null); }} />}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CyberDefenseLab;
