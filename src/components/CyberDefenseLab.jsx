import React, { useState } from 'react';
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
    const { enterLevel } = useGameState();
    const [view, setView] = useState('hub'); // 'hub', 'minigames', 'arcade', 'playing'
    const [activeGame, setActiveGame] = useState(null);

    const renderHub = () => (
        <div className="flex flex-col items-center justify-center gap-12 animate-fade-in">
            <div className="text-center">
                <h1 className="text-5xl font-black text-slate-800 uppercase tracking-[0.2em] mb-4">
                    Cyber <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">Defense</span> Lab
                </h1>
                <p className="text-slate-500 font-mono text-sm tracking-widest">ADVANCED SECURITY CALIBRATION & TRAINING</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-6xl px-6">
                {/* Mini Games Option */}
                <div
                    onClick={() => setView('minigames')}
                    className="group relative p-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-500 overflow-hidden cursor-pointer shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-1"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                        <span className="text-8xl">🎮</span>
                    </div>
                    <div className="relative z-10">
                        <span className="text-xs font-bold text-blue-100 uppercase tracking-widest mb-2 block">Interactive Drills</span>
                        <h2 className="text-3xl font-black text-white uppercase mb-4">Mini Games</h2>
                        <p className="text-blue-100 text-sm leading-relaxed mb-6">
                            Rapid-fire challenges designed to sharpen your reflexes against modern cyber threats.
                        </p>
                        <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-widest">
                            Initialize Sequence <span className="group-hover:translate-x-2 transition-transform">→</span>
                        </div>
                    </div>
                </div>

                {/* Cyber Arcade Option */}
                <div
                    onClick={() => setView('arcade')}
                    className="group relative p-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl hover:from-emerald-600 hover:to-teal-700 transition-all duration-500 overflow-hidden cursor-pointer shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-1"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                        <span className="text-8xl">🕹️</span>
                    </div>
                    <div className="relative z-10">
                        <span className="text-xs font-bold text-emerald-100 uppercase tracking-widest mb-2 block">Themed Missions</span>
                        <h2 className="text-3xl font-black text-white uppercase mb-4">Cyber Arcade</h2>
                        <p className="text-emerald-100 text-sm leading-relaxed mb-6">
                            Direct, action-oriented games that combine classic arcade mechanics with security concepts.
                        </p>
                        <div className="flex items-center gap-2 text-white font-bold text-xs uppercase tracking-widest">
                            Enter Arcade <span className="group-hover:translate-x-2 transition-transform">→</span>
                        </div>
                    </div>
                </div>
            </div>

            <button
                onClick={() => enterLevel(-2)} // Back to Main Menu
                className="px-12 py-3 bg-slate-700 hover:bg-slate-800 rounded-lg text-white font-bold uppercase tracking-widest border border-slate-600 transition-all font-mono text-xs shadow-md"
            >
                [ RETURN_TO_COMMAND_CENTER ]
            </button>
        </div>
    );

    const MINIGAME_CARDS = [
        { key: 'SpotThePhish', emoji: '📧', tag: 'LEVEL_01', title: 'Spot THE Phish', desc: 'Precision-based reaction challenge. Identify fraud vs legit emails in a realistic laptop interface.', color: 'from-emerald-400 to-green-500', shadow: 'shadow-emerald-400/30', tagBg: 'bg-emerald-600', progress: 'w-1/3', progressColor: 'bg-white/70' },
        { key: 'URLAssassin', emoji: '🎯', tag: 'LEVEL_02', title: 'URL Assassin', desc: 'Identify malicious patterns in browser address bars. Neutralize punycode and homograph traps.', color: 'from-red-400 to-rose-500', shadow: 'shadow-red-400/30', tagBg: 'bg-red-600', progress: 'w-2/3', progressColor: 'bg-white/70' },
        { key: 'ImpersonationHunt', emoji: '🕵️', tag: 'LEVEL_03', title: 'Impersonation Hunt', desc: 'Detect fake social media profiles. Analyze verification, followers, and bio links.', color: 'from-violet-400 to-purple-500', shadow: 'shadow-violet-400/30', tagBg: 'bg-violet-600', progress: 'w-full', progressColor: 'bg-white/70' },
        { key: 'AppArmor', emoji: '🛡️', tag: 'LEVEL_04', title: 'App Armor', desc: 'Analyze Play Store listings. Detect clones, permission abuse, and malware red flags.', color: 'from-cyan-400 to-blue-500', shadow: 'shadow-cyan-400/30', tagBg: 'bg-cyan-600', progress: 'w-full', progressColor: 'bg-white/70' },
        { key: 'CareerGuard', emoji: '👔', tag: 'LEVEL_05', title: 'Career Guard', desc: 'Identify fraudulent job offers. Scan for unofficial domains, payment requests, and social engineering.', color: 'from-indigo-400 to-blue-600', shadow: 'shadow-indigo-400/30', tagBg: 'bg-indigo-600', progress: 'w-full', progressColor: 'bg-white/70' },
        { key: 'FileFortress', emoji: '📁', tag: 'LEVEL_06', title: 'File Fortress', desc: 'Evaluate email attachments for malware. Scan and shred suspicious payloads.', color: 'from-orange-400 to-red-500', shadow: 'shadow-orange-400/30', tagBg: 'bg-orange-600', progress: 'w-full', progressColor: 'bg-white/70' },
        { key: 'WiFiSentry', emoji: '📡', tag: 'LEVEL_07', title: 'WiFi Sentry', desc: 'Analyze available Wi-Fi networks. Detect Evil Twins, certificate issues, and insecure hotspots.', color: 'from-teal-400 to-cyan-500', shadow: 'shadow-teal-400/30', tagBg: 'bg-teal-600', progress: 'w-full', progressColor: 'bg-white/70' },
        { key: 'BrowserSentry', emoji: '🌐', tag: 'LEVEL_08', title: 'Browser Sentry', desc: 'Evaluate browser page safety. Inspect URLs, SSL status, and suspicious forms in high-fidelity mockups.', color: 'from-blue-400 to-indigo-500', shadow: 'shadow-blue-400/30', tagBg: 'bg-blue-600', progress: 'w-full', progressColor: 'bg-white/70' },
    ];

    const ARCADE_CARDS = [
        { key: 'CryptoChase', emoji: '🏃', tag: 'ARCADE_01', title: 'Crypto Chase', desc: 'Evade the ransomware encryption worm! Jump over encrypted blocks and collect defense shields.', color: 'from-emerald-400 to-green-600', shadow: 'shadow-emerald-400/30', tagBg: 'bg-emerald-600' },
        { key: 'DDOSDefense', emoji: '🛡️', tag: 'ARCADE_02', title: 'DDoS Defense', desc: 'Protect the core from malicious traffic floods! Build firewalls and rate limiters to filter packets.', color: 'from-cyan-400 to-blue-600', shadow: 'shadow-cyan-400/30', tagBg: 'bg-cyan-600' },
        { key: 'BotnetSurvivors', emoji: '🎛️', tag: 'ARCADE_03', title: 'Botnet Survivors', desc: 'Maneuver the core server through a global DDoS swarm. Level up and deploy layered defenses!', color: 'from-purple-400 to-violet-600', shadow: 'shadow-purple-400/30', tagBg: 'bg-purple-600' },
    ];

    const renderGameSelection = () => (
        <div className="flex flex-col items-center w-full max-w-6xl px-6 animate-fade-in h-full py-12">
            <div className="flex justify-between items-center w-full mb-12">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Mini Game Selector</h2>
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">8 Active Training Modules</p>
                </div>
                <button
                    onClick={() => setView('hub')}
                    className="px-6 py-2 bg-slate-700 hover:bg-slate-800 rounded-lg text-white transition-all font-mono text-xs shadow-md"
                >
                    ← BACK
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {MINIGAME_CARDS.map((card) => (
                    <div
                        key={card.key}
                        onClick={() => { setActiveGame(card.key); setView('playing'); }}
                        className={`group bg-gradient-to-br ${card.color} p-6 rounded-xl transition-all cursor-pointer shadow-lg ${card.shadow} hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] duration-300 relative overflow-hidden`}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 group-hover:scale-150 transition-transform duration-500" />
                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                                <span className="text-3xl drop-shadow-md">{card.emoji}</span>
                                <span className={`text-[10px] font-mono text-white/90 ${card.tagBg} px-2 py-1 rounded-md`}>{card.tag}</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 drop-shadow-sm">{card.title}</h3>
                            <p className="text-white/80 text-sm mb-4">{card.desc}</p>
                            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <div className={`h-full ${card.progressColor} ${card.progress} rounded-full`}></div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Placeholder locked module */}
                {[...Array(1)].map((_, i) => (
                    <div key={i} className="bg-slate-200 border-2 border-dashed border-slate-300 p-6 rounded-xl relative grayscale opacity-50 group overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center rotate-12">
                            <span className="text-slate-400 font-black text-4xl opacity-20">LOCKED</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-400 mb-2 italic">Module_{i + 9}</h3>
                        <p className="text-slate-400 text-sm">Calibration required...</p>
                    </div>
                ))}
            </div>
        </div>
    );


    const renderArcadeSelection = () => (
        <div className="flex flex-col items-center w-full max-w-6xl px-6 animate-fade-in h-full py-12">
            <div className="flex justify-between items-center w-full mb-12">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Cyber Arcade</h2>
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Direct Mission Protocols</p>
                </div>
                <button
                    onClick={() => setView('hub')}
                    className="px-6 py-2 bg-slate-700 hover:bg-slate-800 rounded-lg text-white transition-all font-mono text-xs shadow-md"
                >
                    ← BACK
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {ARCADE_CARDS.map((card) => (
                    <div
                        key={card.key}
                        onClick={() => { setActiveGame(card.key); setView('playing'); }}
                        className={`group bg-gradient-to-br ${card.color} p-6 rounded-xl transition-all cursor-pointer shadow-lg ${card.shadow} hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] duration-300 relative overflow-hidden`}
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 group-hover:scale-150 transition-transform duration-500" />
                        <div className="relative z-10">
                            <div className="flex items-start justify-between mb-4">
                                <span className="text-3xl drop-shadow-md">{card.emoji}</span>
                                <span className={`text-[10px] font-mono text-white/90 ${card.tagBg} px-2 py-1 rounded-md`}>{card.tag}</span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter drop-shadow-sm">{card.title}</h3>
                            <p className="text-white/80 text-sm mb-4">{card.desc}</p>
                            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                                <div className="h-full bg-white/70 w-full rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="relative w-screen h-screen overflow-x-hidden overflow-y-auto bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-50 flex flex-col items-center justify-center font-mono text-slate-600">
            {/* Background elements */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.08)_0%,transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.06)_0%,transparent_50%)]" />
                <div className="absolute inset-0 opacity-[0.04]" style={{
                    backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            {/* View Switching */}
            <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center">
                {view === 'hub' && renderHub()}
                {view === 'minigames' && renderGameSelection()}
                {view === 'arcade' && renderArcadeSelection()}

                {view === 'playing' && activeGame === 'SpotThePhish' && (
                    <SpotThePhish onBack={() => { setView('minigames'); setActiveGame(null); }} />
                )}
                {view === 'playing' && activeGame === 'URLAssassin' && (
                    <URLAssassin onBack={() => { setView('minigames'); setActiveGame(null); }} />
                )}
                {view === 'playing' && activeGame === 'ImpersonationHunt' && (
                    <ImpersonationHunt onBack={() => { setView('minigames'); setActiveGame(null); }} />
                )}
                {view === 'playing' && activeGame === 'AppArmor' && (
                    <AppArmor onBack={() => { setView('minigames'); setActiveGame(null); }} />
                )}
                {view === 'playing' && activeGame === 'CareerGuard' && (
                    <CareerGuard onBack={() => { setView('minigames'); setActiveGame(null); }} />
                )}
                {view === 'playing' && activeGame === 'FileFortress' && (
                    <FileFortress onBack={() => { setView('minigames'); setActiveGame(null); }} />
                )}
                {view === 'playing' && activeGame === 'WiFiSentry' && (
                    <WiFiSentry onBack={() => { setView('minigames'); setActiveGame(null); }} />
                )}
                {view === 'playing' && activeGame === 'BrowserSentry' && (
                    <BrowserSentry onBack={() => { setView('minigames'); setActiveGame(null); }} />
                )}
                {view === 'playing' && activeGame === 'CryptoChase' && (
                    <CryptoChase onBack={() => { setView('arcade'); setActiveGame(null); }} />
                )}
                {view === 'playing' && activeGame === 'DDOSDefense' && (
                    <DDOSDefense onBack={() => { setView('arcade'); setActiveGame(null); }} />
                )}
                {view === 'playing' && activeGame === 'BotnetSurvivors' && (
                    <BotnetSurvivors onBack={() => { setView('arcade'); setActiveGame(null); }} />
                )}
            </div>

        </div>
    );
};

export default CyberDefenseLab;
