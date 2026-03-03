import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '../context/GameStateContext';

// ═══ CONSTANTS ═══
const CLUE_DATA = [
    {
        id: 'secure_net_props',
        name: 'SBI_SecureNet Properties',
        description: 'BSSID prefix E4:FA proves it\'s a mobile hotspot, not a commercial router. Banks don\'t host open Wi-Fi.',
        points: 25
    },
    {
        id: 'wifi_card',
        name: 'Brew & Bond Credentials',
        description: 'BrewConnect_Guest is the only authorized network. The password confirms encryption is active.',
        points: 15
    },
    {
        id: 'hacker_corner',
        name: 'The Honeypot Hacker',
        description: 'A malicious operator using portable radio equipment and a packet-sniffing terminal to hijack traffic.',
        points: 30
    },
    {
        id: 'customer_screen',
        name: 'MITM Intercept Demo',
        description: 'Connecting to open Wi-Fi allows hackers to "strip" SSL security, capturing plaintext banking data.',
        points: 20
    },
    {
        id: 'mobile_data',
        name: '4G Data Security',
        description: 'Direct tower-to-device encryption. Mobile data is thousands of times safer for finance than public Wi-Fi.',
        points: 15
    },
    {
        id: 'vpn_clue',
        name: 'The VPN Shield',
        description: 'A Virtual Private Network creates a military-grade encrypted tunnel over any untrusted connection.',
        points: 15
    }
];

const Level7 = () => {
    const { completeLevel, adjustAssets, adjustLives } = useGameState();

    // ═══ STATE ═══
    const [gameState, setGameState] = useState('cafe'); // cafe, radar, outcome
    const [cluesFound, setCluesFound] = useState([]);
    const [feedbackMsg, setFeedbackMsg] = useState(null);
    const [showDetectiveBoard, setShowDetectiveBoard] = useState(false);
    const [activeNetwork, setActiveNetwork] = useState(null);
    const [outcomeType, setOutcomeType] = useState(null); // 'victory' or 'scam'
    const [hoveredClue, setHoveredClue] = useState(null);
    const [hackerPanelOpen, setHackerPanelOpen] = useState(false);

    // ═══ HELPERS ═══
    const showFeedback = (msg, color = 'cyan') => {
        setFeedbackMsg({ text: msg, color });
        setTimeout(() => setFeedbackMsg(null), 3500);
    };

    const handleClueClick = (clueId) => {
        if (cluesFound.includes(clueId)) return;
        const clue = CLUE_DATA.find(c => c.id === clueId);
        setCluesFound(prev => [...prev, clueId]);
        showFeedback(`ANALYZED CLUE: ${clue.name} (+${clue.points} pts)`, 'emerald');
    };

    const handleFinalChoice = (choice) => {
        if (choice === 'sbi_secure') {
            setOutcomeType('scam');
            setGameState('outcome');
        } else {
            if (cluesFound.length >= 3) {
                setOutcomeType('victory');
                setGameState('outcome');
            } else {
                showFeedback("I need more evidence before trusting any connection...", "orange");
            }
        }
    };

    // ═══ RENDER COMPONENTS ═══

    const RadarBubble = ({ id, name, signal, locked, x, y, size = 140 }) => (
        <div
            className="absolute flex flex-col items-center justify-center cursor-pointer group transition-all duration-500 hover:scale-110 active:scale-90 z-20"
            style={{ left: x, top: y, width: size, height: size }}
            onClick={() => {
                setActiveNetwork(id);
                if (id === 'sbi_secure') handleClueClick('secure_net_props');
            }}
        >
            <div className={`w-full h-full rounded-full border-2 flex items-center justify-center relative transition-all duration-700 ${activeNetwork === id
                    ? 'border-cyan-400 bg-cyan-400/20 shadow-[0_0_40px_rgba(34,211,238,0.4)]'
                    : 'border-slate-800 bg-slate-900/10 group-hover:border-slate-500 group-hover:bg-slate-800/20'
                }`}>
                {/* Sonar Pulse */}
                <div className="absolute inset-0 rounded-full border border-cyan-400/30 animate-ping" />
                <div className="absolute inset-10 rounded-full border border-cyan-400/15 animate-[ping_4s_infinite]" />

                <div className={`text-4xl transition-all duration-500 ${activeNetwork === id ? 'scale-125' : 'group-hover:grayscale-0 grayscale opacity-40 group-hover:opacity-100'}`}>
                    {locked ? '🔒' : '🔓'}
                </div>

                <div className={`absolute -bottom-12 px-5 py-2 rounded-xl border-2 backdrop-blur-md transition-all duration-500 ${activeNetwork === id
                        ? 'bg-cyan-600 border-cyan-400 shadow-xl text-white'
                        : 'bg-slate-900/80 border-slate-700 text-slate-500 group-hover:text-slate-200'
                    }`}>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">{name}</span>
                </div>
            </div>

            <div className="mt-16 flex gap-1.5 h-4 items-end">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-1.5 rounded-full transition-all duration-500 ${i < signal ? (id === 'sbi_secure' ? 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]') : 'bg-slate-800'}`}
                        style={{ height: `${(i + 1) * 25}%` }}
                    />
                ))}
            </div>
        </div>
    );

    const RadarMap = () => (
        <div className="absolute inset-0 bg-[#040712] overflow-hidden flex items-center justify-center font-sans animate-in fade-in zoom-in-110 duration-1000">
            {/* ═══ PREMIUM SONAR ENGINE ═══ */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full border-t border-cyan-500/5 border-l border-cyan-500/5"
                        style={{ width: (i + 1) * 200, height: (i + 1) * 200, opacity: 1 - (i * 0.1) }}
                    />
                ))}
                {/* Moving Sonar Beam */}
                <div className="absolute w-[1000px] h-[1000px] bg-conic-gradient from-cyan-500/10 via-transparent to-transparent animate-[spin_4s_linear_infinite]" />

                {/* Data Grid Overlay */}
                <div className="absolute inset-0 opacity-[0.02] mix-blend-screen" style={{
                    backgroundImage: 'linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            {/* Scanning Centerpiece */}
            <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-600 to-indigo-900 rounded-[35%] flex items-center justify-center shadow-[0_0_100px_rgba(34,211,238,0.4)] border-4 border-white animate-[pulse_3s_infinite] rotate-12">
                    <span className="text-4xl -rotate-12">📱</span>
                </div>
                <div className="mt-6 px-6 py-2 bg-cyan-950/80 backdrop-blur-md border border-cyan-400/30 rounded-full shadow-2xl">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.5em] animate-pulse">Scanning Bio-Session</span>
                </div>
            </div>

            <RadarBubble id="brew_connect" name="BrewConnect_Guest_Enc" signal={4} locked={true} x="65%" y="15%" />
            <RadarBubble id="sbi_secure" name="SBI_ATM_GUEST" signal={4} locked={false} x="10%" y="30%" size={180} />
            <RadarBubble id="android_hotspot" name="OPPO_F21_Pro" signal={1} locked={true} x="80%" y="70%" />
            <RadarBubble id="bsnl_fiber" name="BSNL_HighSpeed_92" signal={2} locked={true} x="12%" y="75%" />

            {/* NETWORK INSPECTOR PANEL */}
            {activeNetwork && (
                <div className="absolute top-10 bottom-10 right-10 w-[400px] bg-slate-900/90 backdrop-blur-3xl border-l border-white/10 p-12 rounded-[50px] shadow-[0_0_150px_rgba(0,0,0,1)] flex flex-col animate-in slide-in-from-right-20 duration-700">
                    <div className="flex justify-between items-center mb-12">
                        <div className="flex flex-col">
                            <span className="text-cyan-400 font-black tracking-[0.3em] text-[10px] uppercase mb-1">Packet Intel</span>
                            <h3 className="text-white font-black text-2xl uppercase tracking-tighter">Session Audit</h3>
                        </div>
                        <button onClick={() => setActiveNetwork(null)} className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
                            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    <div className="flex-1 space-y-10">
                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5 shadow-inner">
                            <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block tracking-widest">Network SSID</label>
                            <div className="text-xl text-white font-black font-mono tracking-tight">
                                {activeNetwork === 'sbi_secure' ? 'SBI_ATM_GUEST' : activeNetwork === 'brew_connect' ? 'BrewConnect_Guest' : 'PRIVATE_NODE'}
                            </div>
                        </div>

                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5 shadow-inner">
                            <label className="text-[10px] text-slate-500 uppercase font-black mb-2 block tracking-widest">Protocol Type</label>
                            <div className={`text-sm font-black tracking-widest uppercase flex items-center gap-3 ${activeNetwork === 'sbi_secure' ? 'text-red-500' : 'text-emerald-500'
                                }`}>
                                {activeNetwork === 'sbi_secure' ? '⚠️ OPEN / UNENCRYPTED' : '🛡️ WPA2 AES-256'}
                            </div>
                        </div>

                        {activeNetwork === 'sbi_secure' && (
                            <div className="bg-red-500/10 border-2 border-red-500/20 p-8 rounded-[40px] space-y-4 animate-pulse">
                                <span className="text-red-500 text-[10px] font-black uppercase tracking-[0.3em] block">Technical Anomaly</span>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[11px] font-mono text-slate-300">
                                        <span>BSSID PREFIX:</span>
                                        <span className="text-red-400 font-black">E4:FA:C4 (Mobile)</span>
                                    </div>
                                    <div className="flex justify-between text-[11px] font-mono text-slate-300">
                                        <span>CHANNEL:</span>
                                        <span className="text-red-400 font-black">Adaptive 2.4GHz</span>
                                    </div>
                                </div>
                                <p className="text-[11px] text-red-100/60 italic leading-relaxed font-medium">
                                    "Confirmed: Signal behavior mirrors a mobile device personal hotspot. High probability of rogue actor interception."
                                </p>
                            </div>
                        )}

                        <div className="mt-auto pt-10">
                            <button
                                onClick={() => handleFinalChoice(activeNetwork)}
                                className={`w-full py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-xs shadow-3xl transition-all active:scale-95 ${activeNetwork === 'sbi_secure'
                                        ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/40'
                                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/40'
                                    }`}
                            >
                                {activeNetwork === 'sbi_secure' ? 'Force Security Login' : 'Tunnel Through Network'}
                            </button>
                            <p className="mt-5 text-center text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] opacity-40 italic">
                                Encryption Handshake Required: {activeNetwork === 'sbi_secure' ? 'DISABLED' : 'READY'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={() => setGameState('cafe')}
                className="absolute top-12 left-12 bg-white/5 backdrop-blur-3xl border border-white/10 px-10 py-4 rounded-[30px] text-[11px] font-black tracking-[0.3em] text-white hover:bg-white/15 transition-all flex items-center gap-4 group shadow-2xl"
            >
                <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center group-hover:-translate-x-1 transition-transform">←</div>
                EXIT SCANNER
            </button>
        </div>
    );

    const CafeScene = () => (
        <div className="absolute inset-0 bg-[#2d1b10] overflow-hidden animate-in fade-in duration-[1500ms]">

            {/* ═══ VOLUMETRIC GOD RAYS (Premium Lighting) ═══ */}
            <div className="absolute inset-x-0 top-0 h-full z-[5] pointer-events-none overflow-hidden opacity-30">
                <div className="absolute -top-[100px] left-[15%] w-[300px] h-[1200px] bg-gradient-to-b from-amber-400/40 to-transparent skew-x-[-25deg] blur-[80px]" />
                <div className="absolute -top-[100px] left-[55%] w-[400px] h-[1200px] bg-gradient-to-b from-amber-400/30 to-transparent skew-x-[-25deg] blur-[120px]" />
            </div>

            {/* Ceiling Vitality: Fan Component */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 w-80 h-40 flex flex-col items-center">
                <div className="w-2 h-20 bg-zinc-900 border-x border-zinc-950" />
                <div className="relative w-96 h-96 -translate-y-1/2 animate-[spin_10s_linear_infinite]">
                    {[0, 120, 240].map(deg => (
                        <div key={deg} className="absolute top-1/2 left-1/2 w-48 h-10 bg-zinc-900/90 border-r-8 border-black origin-left rounded-r-3xl" style={{ transform: `rotate(${deg}deg) translateY(-50%)` }} />
                    ))}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-zinc-800 rounded-full border-4 border-zinc-950 shadow-2xl" />
                </div>
            </div>

            {/* Environment Art Base */}
            <div className="absolute inset-x-0 bottom-0 h-[45%] bg-[#120a06]" style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 45px, rgba(255,200,100,0.01) 45px, rgba(255,200,100,0.01) 46px)'
            }} />

            <div className="absolute inset-0 z-0 opacity-20" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 38px, #000 38px, #000 40px), repeating-linear-gradient(90deg, transparent, transparent 78px, #000 78px, #000 80px)',
                backgroundSize: '80px 40px'
            }} />

            {/* Panoramic Windows with outside street blur */}
            <div className="absolute left-[8%] top-0 bottom-[45%] w-[38%] bg-blue-950/20 border-x-[20px] border-b-[20px] border-[#1a100a] shadow-[inset_0_0_120px_rgba(0,0,0,1)] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/5 to-black/40" />
                <div className="absolute bottom-10 left-12 w-48 h-32 bg-yellow-400/10 blur-[60px] animate-pulse" />
                {/* Indoor Plant Silhouette */}
                <div className="absolute bottom-0 left-0 w-32 h-64 bg-zinc-950/40 rounded-t-[50%] blur-sm animate-[bounce_10s_infinite]" />
            </div>
            <div className="absolute right-[8%] top-0 bottom-[45%] w-[38%] bg-blue-950/20 border-x-[20px] border-b-[20px] border-[#1a100a] shadow-[inset_0_0_120px_rgba(0,0,0,1)]" />

            {/* Counter Section with Barista */}
            <div className="absolute bottom-0 right-0 w-[44%] h-1/2 bg-gradient-to-t from-[#121214] to-[#2d1b10] border-l-[16px] border-t-[16px] border-[#1a100a] shadow-[-30px_0_150px_rgba(0,0,0,1)] flex flex-col items-center">
                <div className="absolute -top-36 left-16 w-48 h-80 flex flex-col items-center animate-[pulse_4s_infinite]">
                    <div className="w-20 h-20 bg-zinc-950 rounded-full border-4 border-white/5 shadow-2xl" />
                    <div className="w-36 h-52 bg-gradient-to-t from-black via-zinc-900 to-zinc-950 mt-2 rounded-t-[60px] shadow-2xl relative">
                        {/* Barista Apron Detail */}
                        <div className="absolute top-0 inset-x-8 bottom-0 bg-emerald-950/40 border-x-2 border-black/20" />
                    </div>
                </div>
                {/* Premium Pastry Case */}
                <div className="w-[85%] h-56 bg-white/5 backdrop-blur-xl border-2 border-white/10 m-8 rounded-[40px] relative overflow-hidden flex flex-col justify-end p-8">
                    <div className="flex gap-8 items-end">
                        <div className="w-24 h-16 bg-amber-800/40 rounded-xl shadow-2xl border border-amber-500/10" />
                        <div className="w-16 h-16 bg-orange-400/30 rounded-full shadow-2xl border border-white/5" />
                        <div className="w-28 h-12 bg-white/20 rounded-xl shadow-2xl flex items-center justify-center text-[10px] font-black text-white/40 italic">FRESH_BAKE</div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
                </div>
            </div>

            {/* ═══ THE HACKER (Deep Redesign: ROGUE UNIT) ═══ */}
            <div
                className="absolute left-[6%] bottom-[15%] w-72 h-[450px] cursor-pointer group z-10"
                onClick={() => { handleClueClick('hacker_corner'); setHackerPanelOpen(true); }}
                onMouseEnter={() => setHoveredClue('Threat Vector: Unauthorized Radio Unit')}
                onMouseLeave={() => setHoveredClue(null)}
            >
                {/* Rogue Signal Aura (Threat Aura) */}
                <div className="absolute inset-0 bg-red-600/5 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 animate-pulse" />

                {/* Character Silhouette with detailed gear */}
                <div className="absolute bottom-4 left-16 w-56 h-[400px] flex flex-col items-center group-hover:translate-y-[-10px] transition-transform duration-700">
                    {/* Head shadow with glowing mask reflection */}
                    <div className="w-20 h-20 bg-zinc-950 rounded-full animate-[pulse_5s_infinite] flex items-center justify-center">
                        <div className="w-12 h-1 bg-cyan-400/20 shadow-[0_0_15px_rgba(34,211,238,0.5)] rounded-full blur-[1px] transform rotate-12" />
                    </div>
                    {/* Torso & Hoodie Art */}
                    <div className="w-52 h-full bg-gradient-to-t from-black via-zinc-900 to-zinc-950 rounded-t-[100px] shadow-3xl relative overflow-hidden">
                        {/* Backpack Router (The Clue) */}
                        <div className="absolute bottom-6 left-0 right-0 h-40 bg-zinc-950 p-6 flex flex-col gap-3">
                            <div className="flex justify-between">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-red-600 rounded-full shadow-[0_0_8px_red] animate-pulse" />
                                    <div className="w-2 h-2 bg-emerald-600 rounded-full opacity-30" />
                                </div>
                                <div className="text-[6px] text-cyan-400 font-mono tracking-widest opacity-40">RF_SNIFFER_v4</div>
                            </div>
                            <div className="w-full h-1 bg-zinc-800 rounded-full" />
                            <div className="w-full h-1 bg-zinc-800 rounded-full" />
                            <div className="w-3/4 h-1 bg-zinc-800 rounded-full" />
                        </div>
                    </div>
                </div>

                {/* Floating "Hacker HUD" Preview on Hover */}
                <div className="absolute top-20 right-[-100px] w-60 bg-black/90 backdrop-blur-2xl border-2 border-red-500/20 p-5 rounded-[30px] shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 scale-90 group-hover:scale-100 pointer-events-none">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-red-500 font-black text-[9px] tracking-widest uppercase">Encryption Override</span>
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
                    </div>
                    <div className="font-mono text-[8px] space-y-1 text-slate-400">
                        <p className="text-emerald-400/60"># mac_changer --random...</p>
                        <p># airodump-ng capture --bssid...</p>
                        <p className="text-red-400">CRACKING HANDSHAKE... 88%</p>
                        <div className="w-full h-1.5 bg-zinc-900 rounded-full mt-2">
                            <div className="w-[88%] h-full bg-red-600 rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            {/* THE VICTIM: Dynamic Screen Detail */}
            <div
                className="absolute right-[46%] bottom-[12%] w-64 h-80 cursor-pointer group z-10"
                onClick={() => handleClueClick('customer_screen')}
                onMouseEnter={() => setHoveredClue('Victim Session: Monitoring Intercept')}
                onMouseLeave={() => setHoveredClue(null)}
            >
                <div className="absolute bottom-0 w-48 h-72 bg-gradient-to-t from-black to-[#1a100a] rounded-t-[70px] shadow-3xl" />

                {/* Advanced Laptop Asset */}
                <div className="absolute bottom-36 -right-20 w-64 h-48 group-hover:scale-105 transition-transform duration-1000 origin-bottom-left z-20">
                    <div className="absolute inset-x-0 bottom-[-10px] h-[10px] bg-zinc-900 rounded-full shadow-2xl" />
                    <div className="absolute inset-0 bg-[#0c0c0e] border-[10px] border-zinc-900 rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">
                        <div className="h-10 bg-zinc-950 flex justify-between items-center px-6">
                            <div className="text-[10px] text-red-500 font-black flex items-center gap-2 tracking-widest animate-pulse">
                                <span className="w-2 h-2 bg-red-500 rounded-full" />
                                INSECURE SESSION
                            </div>
                            <span className="text-[9px] text-zinc-500 font-mono">bank.sbi_yono.com</span>
                        </div>
                        <div className="flex-1 bg-white p-6 space-y-6">
                            <div className="flex gap-4 items-center border-b border-slate-50 pb-4">
                                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">🏦</div>
                                <div className="space-y-2">
                                    <div className="w-24 h-4 bg-slate-100 rounded-full" />
                                    <div className="w-16 h-3 bg-slate-50 rounded-full" />
                                </div>
                            </div>
                            <div className="w-full h-16 bg-indigo-500/10 border-2 border-indigo-500/50 rounded-2xl flex items-center justify-center animate-[pulse_2s_infinite]">
                                <span className="text-indigo-600 font-black text-xs uppercase tracking-widest italic blur-[0.2px]">Sending OTP...</span>
                            </div>
                        </div>
                        {/* Data Hijack Animation */}
                        <div className="absolute inset-0 bg-red-600/0 group-hover:bg-red-600/15 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-1000 flex flex-col items-center justify-center p-8 select-none">
                            <div className="w-full h-px bg-red-500 animate-bounce" />
                            <span className="text-[12px] font-black text-red-700 bg-white shadow-2xl px-6 py-4 border-2 border-red-100 rounded-2xl rotate-2">PACKET LEAKED</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══ ULTIMATE PREMIUM SMARTPHONE (The Phone) ═══ */}
            <div className="absolute bottom-0 left-[20%] right-[32%] h-[40%] bg-gradient-to-b from-[#e08e50] to-[#b86b35] border-t-[30px] border-[#a55a2a] shadow-[0_-80px_200px_rgba(0,0,0,0.95)] rounded-t-[60px] z-40 overflow-hidden">
                {/* Surface texture */}
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 15px, #000 15px, #000 16px)' }} />

                {/* Mug & Coffee Detail */}
                <div className="absolute left-[30%] -top-24 w-28 h-32 bg-[#faf9f6] rounded-b-[45px] border-x-[10px] border-stone-200 shadow-3xl flex flex-col items-center">
                    <div className="absolute -top-4 inset-x-0 h-10 bg-amber-950/90 rounded-full blur-[2px] border-b-2 border-amber-950 shadow-inner" />
                    <div className="absolute -top-24 flex gap-4">
                        <div className="w-3 h-16 bg-white/20 blur-lg rounded-full animate-[bounce_3s_infinite]" />
                        <div className="w-5 h-24 bg-white/10 blur-2xl rounded-full animate-[bounce_5s_infinite_1s]" />
                    </div>
                </div>

                {/* THE PHONE UNIT: Hyper-realistic Mobile UI */}
                <div
                    className="absolute left-[50%] -top-12 flex flex-col items-center cursor-pointer group z-50 transform hover:translate-y-[-10px] transition-all duration-700"
                    onClick={() => setGameState('radar')}
                >
                    {/* Device Case (iPhone Style) */}
                    <div className="w-[190px] h-[360px] bg-[#0a0f1d] border-[12px] border-[#1e293b] rounded-[70px] shadow-[0_80px_160px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col group-hover:shadow-cyan-950/40">
                        {/* Notch Area */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-[#1e293b] rounded-b-[30px] z-30 shadow-2xl" />

                        {/* Status Bar */}
                        <div className="pt-14 px-8 flex justify-between items-center z-20">
                            <span className="text-[15px] text-white font-black tracking-tighter">11:45</span>
                            <div className="flex gap-2.5 items-center">
                                {/* Clue: Mobile Data (Encrypted tower) */}
                                <div
                                    className="flex gap-1 items-end h-[18px] group/data"
                                    onClick={(e) => { e.stopPropagation(); handleClueClick('mobile_data'); }}
                                >
                                    {[...Array(4)].map((_, i) => <div key={i} className="w-[3px] bg-white rounded-full group-hover/data:bg-cyan-400 transition-colors" style={{ height: `${(i + 1) * 25}%`, opacity: cluesFound.includes('mobile_data') ? 1 : 0.4 }} />)}
                                    <span className="text-[10px] text-white font-black tracking-tighter italic ml-0.5">4G</span>
                                </div>
                                <div className="w-10 h-[18px] border-2 border-white/20 rounded-[4px] relative p-0.5">
                                    <div className="h-full bg-emerald-500 rounded-[2px]" style={{ width: '85%' }} />
                                    <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-1.5 h-2 bg-white/20 rounded-r-sm" />
                                </div>
                            </div>
                        </div>

                        {/* OS Desktop Content */}
                        <div className="flex-1 bg-gradient-to-br from-[#1e1e3e] via-[#0a0f1d] to-black p-8 flex flex-col gap-8">
                            {/* Urgent Notification */}
                            <div className="bg-white/10 backdrop-blur-3xl p-6 rounded-[35px] border border-white/10 shadow-2xl animate-in zoom-in-90 duration-1000 relative">
                                <div className="w-11 h-11 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-xl shadow-indigo-950/40 mb-4">🏦</div>
                                <h4 className="text-[14px] text-white font-black tracking-tight leading-none uppercase">SBI Security</h4>
                                <p className="text-[11px] text-white/50 mt-2 font-bold leading-tight">Verify recent ₹12,000 charge immediately.</p>
                                <div className="absolute top-4 right-6 w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_red]" />
                            </div>

                            {/* Dock/Primary Launchers */}
                            <div className="mt-auto grid grid-cols-2 gap-4">
                                <div className="bg-white/5 backdrop-blur-3xl aspect-square rounded-[30px] flex items-center justify-center border border-white/5 text-2xl group-hover:scale-110 transition-all duration-500">
                                    <div
                                        className="animate-[pulse_2s_infinite]"
                                        onClick={(e) => { e.stopPropagation(); setGameState('radar'); }}
                                    >📡</div>
                                </div>
                                <div className="bg-white/5 backdrop-blur-3xl aspect-square rounded-[30px] flex items-center justify-center border border-white/5 text-2xl opacity-40">
                                    🌐
                                </div>
                            </div>

                            {/* Main CTA */}
                            <button className="w-full bg-gradient-to-r from-cyan-600 to-indigo-700 text-white font-black py-6 rounded-[35px] text-[11px] uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(0,0,0,0.4)] animate-[pulse_3s_infinite] border border-white/20">
                                Find Networks
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* THE VPN ARMOR ICON (Clue: Encrypted Tunnel) */}
            <div
                className="absolute left-[10%] bottom-[12%] w-28 h-28 bg-[#0a0a0c]/80 backdrop-blur-3xl border-2 border-slate-700/50 rounded-[40px] flex flex-col items-center justify-center cursor-pointer hover:border-cyan-500 hover:shadow-[0_0_60px_rgba(34,211,238,0.2)] transition-all duration-700 group z-[60]"
                onClick={() => handleClueClick('vpn_clue')}
                onMouseEnter={() => setHoveredClue('Threat Mitigation: VPN Armor Plugin')}
                onMouseLeave={() => setHoveredClue(null)}
            >
                <div className="text-5xl group-hover:scale-110 transition-transform duration-700">🛡️</div>
                <div className="text-[10px] font-black text-slate-500 uppercase mt-2 tracking-widest group-hover:text-cyan-400">VPN_OFF</div>
            </div>

            {/* TABLE DECORATIONS */}
            <div className="absolute right-[14%] bottom-[42%] w-36 h-28 bg-white shadow-2xl p-6 rounded-[4px] border-t-[12px] border-emerald-500 cursor-pointer hover:translate-y-[-10px] transition-all origin-bottom"
                onClick={() => handleClueClick('wifi_card')}
            >
                <div className="text-[9px] font-black text-stone-900 border-b-2 border-slate-50 pb-3 mb-3 flex justify-between italic uppercase">
                    <span>Brew & Bond</span>
                    <span>v2.4</span>
                </div>
                <div className="space-y-2 opacity-60">
                    <p className="text-[11px] font-black leading-none">BrewConnect</p>
                    <p className="text-[11px] font-mono leading-none tracking-tighter">pass: coffee2024</p>
                </div>
            </div>

            {/* HACKER INTEL OVERLAY */}
            {hackerPanelOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/95 backdrop-blur-2xl animate-in fade-in duration-500">
                    <div className="max-w-xl w-full bg-slate-900 border-2 border-red-500/30 p-16 rounded-[60px] shadow-[0_0_200px_rgba(239,68,68,0.1)]">
                        <div className="text-center mb-12">
                            <span className="text-red-500 text-[11px] font-black uppercase tracking-[0.6em] mb-4 block">Intelligence Insight</span>
                            <h2 className="text-white text-5xl font-black mb-8 tracking-tighter italic uppercase">ROGUE_NODE_DETECTED</h2>
                            <p className="text-slate-400 text-lg leading-relaxed italic font-medium">
                                "This individual is operating a <span className="text-white underline decoration-red-500 underline-offset-8 decoration-4">Honeypot Attack</span>. He is currently waiting for unencrypted ARP handshakes to hijack financial sessions."
                            </p>
                        </div>

                        <div className="space-y-6 mb-12 bg-black/40 p-8 rounded-[40px] border border-white/5">
                            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-4">
                                <span className="text-slate-500 font-bold uppercase tracking-widest">Intercept Hardware</span>
                                <span className="text-red-400 font-black italic tracking-widest uppercase">RADIO_SNIFFER_X2</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-white/5 pb-4">
                                <span className="text-slate-500 font-bold uppercase tracking-widest">Network Blueprint</span>
                                <span className="text-red-400 font-black italic tracking-widest uppercase">Hotspot MAC Found</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 font-bold uppercase tracking-widest">Session Vulnerability</span>
                                <span className="text-red-400 font-black italic tracking-widest uppercase animate-pulse">SSL_EXFIL_READY</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setHackerPanelOpen(false)}
                            className="w-full bg-white text-black font-black py-8 rounded-[35px] uppercase tracking-[0.4em] text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-2xl"
                        >
                            Log Threat Intelligence
                        </button>
                    </div>
                </div>
            )}

            {/* GLOBAL HOVER TOOLTIP */}
            {hoveredClue && !hackerPanelOpen && (
                <div className="fixed bottom-16 left-1/2 -translate-x-1/2 bg-slate-950/90 border border-cyan-500/50 px-12 py-5 rounded-full text-cyan-400 font-black tracking-[0.4em] text-[12px] uppercase shadow-[0_40px_100px_rgba(0,0,0,1)] z-[70] animate-in slide-in-from-bottom-5 duration-700 backdrop-blur-3xl">
                    <span className="text-2xl mr-5 italic">🔍</span> {hoveredClue}
                </div>
            )}
        </div>
    );

    const OutcomeUI = () => (
        <div className="absolute inset-0 z-[200] bg-black flex flex-col items-center justify-center p-12">
            {outcomeType === 'victory' ? (
                <div className="max-w-5xl animate-in zoom-in-90 duration-1000 text-center font-sans tracking-tight">
                    <div className="w-40 h-40 bg-emerald-500 rounded-[55px] flex items-center justify-center text-8xl mx-auto mb-16 shadow-[0_0_120px_rgba(16,185,129,0.4)] animate-bounce italic">🛡️</div>
                    <h1 className="text-[100px] font-black text-white mb-12 tracking-tighter uppercase italic leading-none">THREAT_CLEARED</h1>
                    <p className="text-4xl text-slate-300 leading-relaxed max-w-4xl mx-auto mb-20 italic font-medium opacity-80">
                        "Your bank doesn't host open Wi-Fi in cafes. I refused the hotspot trap and secured the biometric session."
                    </p>

                    <div className="grid grid-cols-3 gap-12 mb-20 px-20">
                        <div className="bg-slate-900 border border-emerald-500/30 p-12 rounded-[60px] shadow-3xl">
                            <span className="text-slate-500 text-[12px] font-black uppercase tracking-[0.4em] block mb-4 italic">Intel Score</span>
                            <span className="text-6xl font-black text-emerald-400 tracking-tighter shadow-emerald-500/20 shadow-glow">+150</span>
                        </div>
                        <div className="bg-slate-900 border border-indigo-500/30 p-12 rounded-[60px] shadow-3xl">
                            <span className="text-slate-500 text-[12px] font-black uppercase tracking-[0.4em] block mb-4 italic">Medal Unlocked</span>
                            <span className="text-2xl font-black text-indigo-400 uppercase tracking-tighter italic">Shield Master</span>
                        </div>
                        <div className="bg-slate-900 border border-cyan-500/30 p-12 rounded-[60px] shadow-3xl">
                            <span className="text-slate-500 text-[12px] font-black uppercase tracking-[0.4em] block mb-4 italic">Network Status</span>
                            <span className="text-4xl font-black text-cyan-400 uppercase tracking-tighter">VETTED_SAFE</span>
                        </div>
                    </div>

                    <button
                        onClick={() => completeLevel(true, 150, 0)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-24 py-10 rounded-[50px] text-3xl tracking-[0.2em] transition-all shadow-[0_30px_60px_rgba(16,185,129,0.3)] active:scale-95 uppercase italic"
                    >
                        CLOSE CASE FILE 07
                    </button>

                    <p className="mt-16 text-slate-700 font-mono text-sm uppercase font-black opacity-30">ENCRYPTION_LINK_ESTABLISHED | DATA_INTEGRITY: 100% | THREAT_VECTOR: NEUTRALIZED</p>
                </div>
            ) : (
                <div className="max-w-4xl animate-in zoom-in-95 duration-1000 text-center font-sans tracking-tight">
                    <div className="w-32 h-32 bg-red-600 rounded-full flex items-center justify-center text-7xl mx-auto mb-12 shadow-[0_0_120px_rgba(220,38,38,0.5)] animate-pulse">💸</div>
                    <h1 className="text-8xl font-black text-white mb-10 tracking-tighter uppercase leading-none">TOTAL ASSET LOSS</h1>
                    <p className="text-3xl text-slate-300 mb-16 max-w-3xl mx-auto font-medium leading-relaxed italic">
                        By trusting <span className="text-red-500 font-black">SBI_ATM_GUEST</span>, you broadcasted your credentials into the attacker's receiver.
                        ₹1,20,000 was liquidated in 48 seconds.
                    </p>

                    <div className="bg-red-950/10 border-4 border-red-900/30 p-14 rounded-[70px] mb-20 shadow-3xl text-left max-w-3xl mx-auto backdrop-blur-3xl">
                        <h3 className="text-red-500 font-black uppercase tracking-[0.4em] text-[13px] mb-10 border-b border-red-900/40 pb-6 italic">Forensics: Rogue Packet Audit</h3>
                        <div className="space-y-8">
                            <div className="flex justify-between items-center text-lg">
                                <span className="text-slate-500 font-black tracking-widest uppercase italic">Session Tokens</span>
                                <span className="text-red-500 font-black tracking-[0.1em]">HIJACKED</span>
                            </div>
                            <div className="flex justify-between items-center text-lg">
                                <span className="text-slate-500 font-black tracking-widest uppercase italic">Bank_ID_Credential</span>
                                <span className="text-red-500 font-black tracking-[0.1em]">EXFILTRATED</span>
                            </div>
                            <div className="h-px bg-red-900/40 my-10" />
                            <div className="flex justify-between items-center">
                                <span className="text-white font-black text-3xl tracking-tighter italic">FINANCIAL DAMAGE:</span>
                                <span className="text-7xl font-black text-red-600 tracking-tighter">₹1,20,000</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            adjustAssets(-120000);
                            adjustLives(-1);
                            setGameState('cafe');
                            setCluesFound([]);
                            setActiveNetwork(null);
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-black px-24 py-10 rounded-[50px] text-2xl tracking-[0.2em] transition-all border-4 border-slate-800 shadow-3xl active:scale-95 uppercase italic"
                    >
                        REWIND INVESTIGATION
                    </button>
                </div>
            )}
        </div>
    );

    const DetectiveBoard = () => {
        if (!showDetectiveBoard) return null;

        return (
            <div
                className="absolute inset-y-10 right-10 w-[720px] bg-amber-100 rounded-[60px] shadow-[-60px_0_150px_rgba(0,0,0,1)] z-[300] p-20 flex flex-col border-[30px] border-[#311f12] animate-[slideLeft_0.5s_ease-out] overflow-hidden"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23a)' opacity='.22'/%3E%3C/svg%3E")`,
                    backgroundColor: '#e6c280'
                }}
            >
                <div className="absolute top-0 left-0 right-0 h-8 bg-[#1a100a] opacity-30" />

                <div className="flex justify-between items-center mb-16 z-10 bg-white p-6 rounded-sm shadow-3xl transform -rotate-1 border border-stone-400 self-start">
                    <h2 className="text-5xl font-black text-stone-900 uppercase tracking-[0.1em] font-mono italic">
                        🕵️ EVIDENCE_ROOM
                    </h2>
                    <button className="text-red-700 hover:text-black font-black text-5xl ml-16 transition-all" onClick={() => setShowDetectiveBoard(false)}>✖</button>
                </div>

                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    {cluesFound.map((clueId, idx) => {
                        if (idx > 0) {
                            const getPos = (i) => {
                                const grid = [{ x: 220, y: 300 }, { x: 520, y: 340 }, { x: 240, y: 520 }, { x: 540, y: 560 }, { x: 400, y: 720 }, { x: 320, y: 400 }];
                                return grid[i % grid.length];
                            };
                            const p1 = getPos(idx - 1);
                            const p2 = getPos(idx);
                            return (
                                <g key={idx}>
                                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#c00000" strokeWidth="6" strokeOpacity="0.9" style={{ filter: 'drop-shadow(5px 5px 4px rgba(0,0,0,0.4))' }} />
                                    <circle cx={p1.x} cy={p1.y} r="6" fill="#600000" />
                                </g>
                            );
                        }
                        return null;
                    })}
                </svg>

                {cluesFound.map((clueId, idx) => {
                    const clue = CLUE_DATA.find(c => c.id === clueId);
                    const getPos = (i) => {
                        const grid = [{ x: 220, y: 300 }, { x: 520, y: 340 }, { x: 240, y: 520 }, { x: 540, y: 560 }, { x: 400, y: 720 }, { x: 320, y: 400 }];
                        return grid[i % grid.length];
                    };
                    const pos = getPos(idx);

                    return (
                        <div
                            key={clueId}
                            className="absolute bg-white p-6 shadow-[0_30px_60px_rgba(0,0,0,0.5)] w-64 border border-stone-200 z-10 transform flex flex-col items-center animate-in zoom-in-50 duration-700"
                            style={{
                                left: pos.x - 128,
                                top: pos.y - 64,
                                transform: `rotate(${(idx % 2 === 0 ? -1 : 1) * ((idx * 5) % 15 + 3)}deg)`
                            }}
                        >
                            <div className="absolute -top-6 w-10 h-10 rounded-full bg-red-700 shadow-[0_10px_20px_rgba(0,0,0,0.5)] border-4 border-[#311f12] flex items-center justify-center">
                                <div className="w-3 h-3 bg-white/40 rounded-full mb-1 ml-1" />
                            </div>
                            <h4 className="font-black text-red-950 text-[11px] uppercase border-b-2 border-red-50 mb-4 tracking-widest text-center w-full pb-4 italic">{clue.name}</h4>
                            <p className="text-[12px] text-stone-800 leading-tight italic font-black text-center opacity-90">{clue.description}</p>
                            <span className="text-[10px] text-emerald-700 font-black mt-6 uppercase tracking-[0.2em] italic">Vetted_Signal</span>
                        </div>
                    );
                })}

                <div className="absolute bottom-16 left-16 right-16 bg-[#1a100a] p-10 rounded-[50px] border-[6px] border-[#3a2516] shadow-3xl">
                    <div className="flex justify-between items-center text-[12px] font-black uppercase tracking-[0.5em] text-stone-500 mb-6 italic">
                        <span className="flex items-center gap-4">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                            Session Audit In_Progress
                        </span>
                        <span className={cluesFound.length >= 3 ? 'text-emerald-400' : 'text-amber-500'}>
                            {cluesFound.length} / 6 DISCOVERED
                        </span>
                    </div>
                    <div className="h-8 bg-black/60 rounded-full overflow-hidden p-2 shadow-inner">
                        <div
                            className={`h-full rounded-full transition-all duration-[2000ms] ${cluesFound.length >= 3 ? 'bg-gradient-to-r from-emerald-600 via-emerald-400 to-emerald-600 shadow-glow shadow-emerald-500/40' : 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-glow shadow-amber-500/40'}`}
                            style={{ width: `${(cluesFound.length / 6) * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex items-center justify-center bg-black font-sans selection:bg-cyan-500/30 overflow-hidden relative">
            <div className="relative w-full h-full max-w-[1920px] max-h-[1080px] bg-[#02040a] shadow-[0_0_300px_rgba(0,0,0,1)]">
                {gameState === 'cafe' && <CafeScene />}
                {gameState === 'radar' && <RadarMap />}
                {gameState === 'outcome' && <OutcomeUI />}

                {/* ═══ GLOBAL UI ELEMENTS ═══ */}
                <DetectiveBoard />

                {gameState !== 'outcome' && (
                    <button
                        onClick={() => setShowDetectiveBoard(!showDetectiveBoard)}
                        className="fixed bottom-16 left-16 bg-[#1a100a]/98 backdrop-blur-3xl border-[6px] border-[#311f12] hover:border-amber-500 text-amber-500 rounded-[45px] w-28 h-28 flex items-center justify-center text-6xl shadow-3xl z-[350] transition-all hover:scale-110 active:scale-90 group"
                    >
                        🔍
                        {cluesFound.length > 0 && !showDetectiveBoard && (
                            <div className="absolute -top-5 -right-5 bg-red-600 text-white text-[15px] font-black w-12 h-12 rounded-full flex items-center justify-center animate-bounce shadow-3xl border-[6px] border-[#1a100a]">
                                {cluesFound.length}
                            </div>
                        )}
                        <span className="absolute -bottom-14 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black uppercase tracking-[0.4em] text-amber-500 whitespace-nowrap bg-[#1a100a] px-6 py-3 rounded-full border border-[#311f12] shadow-[0_30px_60px_rgba(0,0,0,1)] italic">Forensic Board</span>
                    </button>
                )}

                {/* Toast Feedback */}
                {feedbackMsg && (
                    <div className={`fixed top-16 left-1/2 -translate-x-1/2 py-8 px-20 rounded-[50px] shadow-[0_50px_100px_rgba(0,0,0,1)] z-[600] transition-all duration-700 animate-in slide-in-from-top-20 font-black tracking-[0.5em] text-[12px] uppercase flex items-center gap-6 border-[3px] backdrop-blur-3xl ${feedbackMsg.color === 'red' ? 'bg-red-950/98 border-red-500 text-red-100 shadow-red-900/30' :
                            feedbackMsg.color === 'emerald' ? 'bg-emerald-950/98 border-emerald-500 text-emerald-100 shadow-emerald-900/40' :
                                'bg-cyan-950/98 border-cyan-500 text-cyan-100 shadow-cyan-900/40'
                        }`}>
                        <div className={`w-4 h-4 rounded-full animate-pulse shadow-[0_0_20px_currentColor] ${feedbackMsg.color === 'red' ? 'bg-red-500' :
                                feedbackMsg.color === 'emerald' ? 'bg-emerald-500' :
                                    'bg-cyan-500'
                            }`} />
                        {feedbackMsg.text}
                    </div>
                )}
            </div>

            {/* Global Vignette/Dust */}
            <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_350px_rgba(0,0,0,0.95)] z-[1000] mix-blend-multiply" />
        </div>
    );
};

export default Level7;
