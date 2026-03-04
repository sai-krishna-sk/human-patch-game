import React, { useState, useEffect } from 'react';
import { useGameState } from '../context/GameStateContext';

// ═══ CLUE DATA ═══
const CLUE_DATA = [
    { id: 'secure_net_props', name: 'SBI_SecureNet Properties', desc: 'BSSID prefix E4:FA:C4 — identified as a mobile phone hotspot, NOT a commercial router. Banks never host open Wi-Fi in public spaces.', points: 25, icon: '📡' },
    { id: 'wifi_card', name: 'Brew & Bond Wi-Fi Card', desc: 'The café\'s only official network is BrewConnect_Guest with WPA2 encryption. Password: coffee2024.', points: 15, icon: '📋' },
    { id: 'hacker_corner', name: 'Suspicious Customer (Hacker)', desc: 'Laptop running network monitoring tools. A portable router hidden in his backpack is broadcasting SBI_SecureNet.', points: 30, icon: '🕵️' },
    { id: 'customer_screen', name: 'Victim\'s Screen (MITM Demo)', desc: 'Her banking URL shows http:// instead of https://. The hacker is silently capturing her login credentials.', points: 20, icon: '💻' },
    { id: 'mobile_data', name: '4G Mobile Data Safety', desc: 'Mobile data uses direct tower-to-device encryption. It is the safest option for banking in public places.', points: 10, icon: '📶' },
    { id: 'vpn_clue', name: 'VPN Protection', desc: 'A VPN encrypts all traffic even on public Wi-Fi. If you must use public Wi-Fi, always enable VPN first.', points: 10, icon: '🛡️' },
];

const NETWORKS = [
    { id: 'brew_connect', name: 'BrewConnect_Guest', signal: 3, locked: true, security: 'WPA2-PSK (AES-256)', mac: '00:1A:2B:3C:4D:5E', created: 'Router — Active 2+ years', desc: 'Official café network. Password protected with WPA2 encryption.', safe: true },
    { id: 'sbi_secure', name: 'SBI_SecureNet', signal: 4, locked: false, security: 'NONE (Open Network)', mac: 'E4:FA:C4:29:11:AB — Mobile Hotspot', created: 'Today, 09:47 AM (2 hours ago)', desc: 'Banks do NOT set up Wi-Fi networks in public spaces. This is a honeypot trap.', safe: false },
    { id: 'android_hotspot', name: 'AndroidHotspot_7291', signal: 1, locked: true, security: 'WPA2-PSK', mac: 'A0:B1:C2:D3:E4:F5', created: 'Personal device', desc: 'A customer\'s personal mobile hotspot. Low signal.', safe: true },
    { id: 'bsnl_fiber', name: 'BSNL_Fiber_Home42', signal: 1, locked: true, security: 'WPA2-PSK', mac: '00:FF:AA:BB:CC:DD', created: 'Router — Residential', desc: 'A home router from the building above. Very faint signal.', safe: true },
];

const Level7 = () => {
    const { completeLevel, adjustAssets, adjustLives } = useGameState();

    const [gameState, setGameState] = useState('cafe');
    const [cluesFound, setCluesFound] = useState([]);
    const [feedbackMsg, setFeedbackMsg] = useState(null);
    const [activeNetwork, setActiveNetwork] = useState(null);
    const [outcomeType, setOutcomeType] = useState(null);
    const [activeCluePanel, setActiveCluePanel] = useState(null);
    const [showCluesSidebar, setShowCluesSidebar] = useState(false);

    const showFeedback = (msg, color = 'cyan') => {
        setFeedbackMsg({ text: msg, color });
        setTimeout(() => setFeedbackMsg(null), 3500);
    };

    const handleClueClick = (clueId) => {
        if (cluesFound.includes(clueId)) {
            setActiveCluePanel(clueId);
            return;
        }
        const clue = CLUE_DATA.find(c => c.id === clueId);
        setCluesFound(prev => [...prev, clueId]);
        setActiveCluePanel(clueId);
        showFeedback(`🔍 CLUE FOUND: ${clue.name} (+${clue.points} pts)`, 'emerald');
    };

    const handleFinalChoice = (choice) => {
        if (choice === 'sbi_secure') {
            setOutcomeType('scam');
            setGameState('outcome');
        } else if (choice === 'safe') {
            if (cluesFound.length >= 3) {
                setOutcomeType('victory');
                setGameState('outcome');
            } else {
                showFeedback("Collect at least 3 clues before making your decision!", 'orange');
            }
        }
    };

    // ═══════════════════════════════════════
    // FEEDBACK TOAST
    // ═══════════════════════════════════════
    const FeedbackToast = () => feedbackMsg && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 py-4 px-8 rounded-2xl shadow-2xl z-[600] animate-in slide-in-from-top duration-500 font-black tracking-wider text-sm flex items-center gap-3 border backdrop-blur-xl ${feedbackMsg.color === 'emerald' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' :
            feedbackMsg.color === 'orange' ? 'bg-amber-950/90 border-amber-500/50 text-amber-200' :
                'bg-cyan-950/90 border-cyan-500/50 text-cyan-200'
            }`}>
            <div className={`w-3 h-3 rounded-full animate-pulse ${feedbackMsg.color === 'emerald' ? 'bg-emerald-400' :
                feedbackMsg.color === 'orange' ? 'bg-amber-400' : 'bg-cyan-400'
                }`} />
            {feedbackMsg.text}
        </div>
    );

    // ═══════════════════════════════════════
    // CLUES SIDEBAR (compact)
    // ═══════════════════════════════════════
    const CluesSidebar = () => (
        <div className={`fixed right-0 top-0 bottom-0 w-[340px] bg-slate-950/95 backdrop-blur-xl border-l border-white/10 z-[400] transform transition-transform duration-500 flex flex-col ${showCluesSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <div>
                    <h3 className="text-white font-black text-lg uppercase tracking-wider">Evidence Found</h3>
                    <p className="text-slate-500 text-xs font-bold mt-1">{cluesFound.length} / {CLUE_DATA.length} clues</p>
                </div>
                <button onClick={() => setShowCluesSidebar(false)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-all">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {CLUE_DATA.map(clue => {
                    const found = cluesFound.includes(clue.id);
                    return (
                        <div key={clue.id} className={`p-4 rounded-xl border transition-all ${found ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5 opacity-40'}`}>
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{found ? clue.icon : '❓'}</span>
                                <div>
                                    <h4 className={`text-sm font-black ${found ? 'text-emerald-300' : 'text-slate-500'}`}>{found ? clue.name : 'Undiscovered'}</h4>
                                    {found && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{clue.desc}</p>}
                                </div>
                            </div>
                            {found && <div className="mt-2 text-right"><span className="text-emerald-400 text-xs font-black">+{clue.points} pts</span></div>}
                        </div>
                    );
                })}
            </div>
            <div className="p-4 border-t border-white/10">
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${cluesFound.length >= 3 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${(cluesFound.length / CLUE_DATA.length) * 100}%` }} />
                </div>
                <p className="text-center text-xs text-slate-500 mt-2 font-bold">{cluesFound.length >= 3 ? '✓ Ready to make your choice' : `Find ${3 - cluesFound.length} more clues`}</p>
            </div>
        </div>
    );

    // ═══════════════════════════════════════
    // CLUE DETAIL PANEL (modal overlay)
    // ═══════════════════════════════════════
    const ClueDetailPanel = () => {
        if (!activeCluePanel) return null;
        const clue = CLUE_DATA.find(c => c.id === activeCluePanel);
        if (!clue) return null;

        const details = {
            secure_net_props: {
                title: 'Network Analysis', items: [
                    { label: 'Network Name (SSID)', value: 'SBI_SecureNet' },
                    { label: 'Security', value: 'NONE (Open — No Encryption)', danger: true },
                    { label: 'MAC Address', value: 'E4:FA:C4:29:11:AB — Mobile Phone Hotspot', danger: true },
                    { label: 'Network Created', value: 'Today, 09:47 AM (2 hours ago)', danger: true },
                ], warning: 'Banks do NOT set up Wi-Fi networks in public spaces. Any network named after a bank should be treated as a scam.'
            },
            wifi_card: {
                title: 'Official Wi-Fi Credentials', items: [
                    { label: 'Network', value: 'BrewConnect_Guest' },
                    { label: 'Password', value: 'coffee2024' },
                    { label: 'Security', value: 'WPA2 Encrypted ✓' },
                ], warning: 'A password-protected Wi-Fi with WPA2 encryption is safer than an open network. The password creates a basic encryption layer.'
            },
            hacker_corner: {
                title: 'Suspicious Individual Report', items: [
                    { label: 'Equipment', value: 'Laptop + Portable Router in Backpack', danger: true },
                    { label: 'Software', value: 'Network monitoring & packet sniffing tools', danger: true },
                    { label: 'Broadcasting', value: 'SBI_SecureNet (the fake network)', danger: true },
                    { label: 'Connected Devices', value: '6 victims currently connected', danger: true },
                ], warning: 'This person has set up a HONEYPOT. He is intercepting all data from devices connected to SBI_SecureNet.'
            },
            customer_screen: {
                title: 'Man-in-the-Middle Attack Demo', items: [
                    { label: 'Victim', value: 'College student checking bank balance' },
                    { label: 'Connection', value: 'SBI_SecureNet (the fake network)' },
                    { label: 'URL Displayed', value: 'http:// (NOT https://)', danger: true },
                    { label: 'Data Captured', value: 'Login credentials, session tokens', danger: true },
                ], warning: 'A MITM attack captures data silently. The victim never knows. The attacker can read passwords, OTPs, account numbers.'
            },
            mobile_data: {
                title: 'Mobile Data vs Public Wi-Fi', items: [
                    { label: 'Public Wi-Fi (Open)', value: 'No encryption, hackable, MITM risk HIGH', danger: true },
                    { label: 'Mobile Data (4G/5G)', value: 'Tower-encrypted, personal, MITM risk VERY LOW' },
                ], warning: 'Mobile data costs just a few paise per MB for banking. It is the SAFEST option for financial transactions in public.'
            },
            vpn_clue: {
                title: 'VPN Protection', items: [
                    { label: 'Status', value: 'Currently OFF (Not Protected)', danger: true },
                    { label: 'Function', value: 'Encrypts ALL internet traffic end-to-end' },
                ], warning: 'A VPN makes MITM attacks ineffective. If you MUST use public Wi-Fi for banking, always turn on a trusted VPN first.'
            },
        };

        const d = details[activeCluePanel] || { title: clue.name, items: [], warning: clue.desc };

        return (
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setActiveCluePanel(null)}>
                <div className="max-w-lg w-full bg-slate-900 border-2 border-white/10 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-3xl border border-emerald-500/30">{clue.icon}</div>
                        <div>
                            <h3 className="text-white font-black text-xl">{d.title}</h3>
                            <p className="text-emerald-400 text-xs font-bold mt-1 uppercase tracking-wider">+{clue.points} Detective Points</p>
                        </div>
                    </div>

                    <div className="space-y-3 mb-6">
                        {d.items.map((item, i) => (
                            <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">{item.label}</span>
                                <span className={`text-sm font-black ${item.danger ? 'text-red-400' : 'text-white'}`}>{item.value}</span>
                            </div>
                        ))}
                    </div>

                    {d.warning && (
                        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl mb-6">
                            <p className="text-amber-200 text-sm leading-relaxed">⚠️ {d.warning}</p>
                        </div>
                    )}

                    <button onClick={() => setActiveCluePanel(null)} className="w-full bg-white/10 hover:bg-white/15 text-white font-black py-4 rounded-xl transition-all">
                        Close
                    </button>
                </div>
            </div>
        );
    };

    // ═══════════════════════════════════════
    // CAFÉ SCENE
    // ═══════════════════════════════════════
    if (gameState === 'cafe') {
        return (
            <div className="w-full h-full bg-[#1a0e08] relative overflow-hidden">
                <FeedbackToast />
                <CluesSidebar />
                <ClueDetailPanel />

                {/* Warm café background */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #2d1810 0%, #1a0e08 60%, #0d0705 100%)' }} />

                {/* Brick wall texture */}
                <div className="absolute inset-x-0 top-0 h-[55%] opacity-20" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(139,90,43,0.3) 18px, rgba(139,90,43,0.3) 20px), repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(139,90,43,0.2) 38px, rgba(139,90,43,0.2) 40px)',
                    backgroundSize: '40px 20px'
                }} />

                {/* Warm light rays from windows */}
                <div className="absolute top-0 left-[10%] w-[250px] h-[600px] bg-gradient-to-b from-amber-400/15 to-transparent skew-x-[-15deg] blur-[40px] pointer-events-none" />
                <div className="absolute top-0 left-[50%] w-[200px] h-[500px] bg-gradient-to-b from-amber-300/10 to-transparent skew-x-[-10deg] blur-[60px] pointer-events-none" />

                {/* Window (left) */}
                <div className="absolute left-[5%] top-[5%] w-[30%] h-[45%] bg-gradient-to-b from-indigo-950/40 to-slate-950/60 border-[12px] border-[#3d2415] rounded-t-lg overflow-hidden">
                    <div className="absolute bottom-4 left-4 w-20 h-10 bg-amber-400/10 rounded blur-lg animate-pulse" />
                    <div className="absolute bottom-8 right-8 w-12 h-8 bg-white/5 rounded blur-sm" />
                    <div className="absolute top-4 right-4 text-xs text-white/20 font-mono">STREET VIEW</div>
                </div>

                {/* Window (right) */}
                <div className="absolute right-[5%] top-[5%] w-[25%] h-[40%] bg-gradient-to-b from-indigo-950/30 to-slate-950/50 border-[12px] border-[#3d2415] rounded-t-lg" />

                {/* Floor */}
                <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-[#0a0604] to-[#1a0e08]" style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(100,60,20,0.05) 60px, rgba(100,60,20,0.05) 62px)',
                }} />

                {/* Edison bulbs */}
                {[15, 35, 55, 75].map((left, i) => (
                    <div key={i} className="absolute z-10 pointer-events-none" style={{ left: `${left}%`, top: 0 }}>
                        <div className="w-px h-16 bg-amber-900/60 mx-auto" />
                        <div className="w-4 h-6 bg-amber-400/60 rounded-full mx-auto shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse" style={{ animationDelay: `${i * 0.7}s` }} />
                    </div>
                ))}

                {/* ═══ INTERACTIVE HOTSPOTS ═══ */}

                {/* 1. Wi-Fi Card on table */}
                <div className="absolute bottom-[38%] right-[25%] cursor-pointer group z-20" onClick={() => handleClueClick('wifi_card')}>
                    <div className={`w-32 h-20 bg-white rounded-lg p-3 shadow-xl transform rotate-[-3deg] transition-all group-hover:rotate-0 group-hover:scale-110 ${cluesFound.includes('wifi_card') ? 'ring-2 ring-emerald-400' : ''}`}>
                        <div className="text-[7px] font-black text-stone-800 border-b border-stone-200 pb-1 mb-1">☕ Brew & Bond</div>
                        <div className="text-[8px] font-bold text-stone-600">WiFi: BrewConnect_Guest</div>
                        <div className="text-[8px] font-mono text-stone-500">Pass: coffee2024</div>
                    </div>

                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[9px] text-amber-300 font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">Click to inspect</div>
                </div>

                {/* 2. Hacker in corner */}
                <div className="absolute left-[3%] bottom-[10%] w-48 h-72 cursor-pointer group z-20" onClick={() => handleClueClick('hacker_corner')}>
                    <div className={`relative w-full h-full transition-all group-hover:scale-105 ${cluesFound.includes('hacker_corner') ? 'ring-2 ring-red-400 rounded-xl' : ''}`}>
                        {/* Person silhouette */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 flex flex-col items-center">
                            <div className="w-14 h-14 bg-zinc-900 rounded-full border-2 border-zinc-800 flex items-center justify-center">
                                <div className="w-8 h-1 bg-cyan-400/30 rounded blur-[1px]" />
                            </div>
                            <div className="w-28 h-40 bg-gradient-to-b from-zinc-900 to-black rounded-t-[40px] mt-1 relative overflow-hidden">
                                <div className="absolute top-2 inset-x-6 h-full bg-zinc-800/30" />
                            </div>
                        </div>
                        {/* Laptop on table */}
                        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-36 h-24 bg-zinc-950 border-4 border-zinc-800 rounded-lg overflow-hidden">
                            <div className="w-full h-4 bg-zinc-900 flex items-center px-2 gap-1">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                <div className="w-1.5 h-1.5 bg-green-500/30 rounded-full" />
                            </div>
                            <div className="p-1 space-y-0.5">
                                <div className="text-[5px] font-mono text-green-400/60">$ airodump-ng wlan0</div>
                                <div className="text-[5px] font-mono text-red-400/80">CAPTURING: 6 devices...</div>
                            </div>
                        </div>
                        {/* Backpack with blinking router */}
                        <div className="absolute bottom-0 right-0 w-16 h-20 bg-zinc-900 rounded-lg border border-zinc-800">
                            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_8px_red] animate-pulse" />
                        </div>
                    </div>

                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-amber-300 font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">Suspicious customer</div>
                </div>

                {/* 3. Victim customer */}
                <div className="absolute left-[35%] bottom-[30%] w-44 h-56 cursor-pointer group z-20" onClick={() => handleClueClick('customer_screen')}>
                    <div className={`relative w-full h-full transition-all group-hover:scale-105 ${cluesFound.includes('customer_screen') ? 'ring-2 ring-amber-400 rounded-xl' : ''}`}>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 flex flex-col items-center">
                            <div className="w-12 h-12 bg-amber-900/40 rounded-full" />
                            <div className="w-20 h-32 bg-gradient-to-b from-rose-900/30 to-zinc-900/50 rounded-t-[30px] mt-1" />
                        </div>
                        {/* Her laptop */}
                        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-32 h-20 bg-white border-4 border-zinc-300 rounded-lg overflow-hidden">
                            <div className="w-full h-3 bg-slate-100 flex items-center px-2">
                                <div className="text-[4px] font-mono text-red-500">⚠ http://bank.sbi</div>
                            </div>
                            <div className="p-2 flex items-center gap-2">
                                <div className="w-6 h-6 bg-indigo-500 rounded text-white text-[6px] flex items-center justify-center font-bold">SBI</div>
                                <div className="space-y-1">
                                    <div className="w-12 h-1.5 bg-slate-200 rounded" />
                                    <div className="w-8 h-1.5 bg-slate-100 rounded" />
                                </div>
                            </div>
                        </div>
                        {/* Data leak animation on hover */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-red-500/90 text-white text-[8px] font-black px-2 py-1 rounded animate-bounce">DATA BEING CAPTURED</div>
                        </div>
                    </div>

                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-amber-300 font-bold opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">Another customer's laptop</div>
                </div>

                {/* 4. THE PHONE (center table) with VPN + 4G clues */}
                <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 z-30">
                    {/* Table surface */}
                    <div className="w-[400px] h-[200px] bg-gradient-to-b from-[#8B5A2C] to-[#6B4423] rounded-t-xl border-t-4 border-[#A0724A] relative shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                        {/* Coffee mug */}
                        <div className="absolute left-8 top-4 w-14 h-16 bg-white rounded-b-[20px] border-2 border-stone-200 shadow-lg">
                            <div className="absolute -top-1 inset-x-0 h-4 bg-amber-900/80 rounded-full" />
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-2">
                                <div className="w-1 h-6 bg-white/20 rounded-full blur animate-bounce" style={{ animationDelay: '0s' }} />
                                <div className="w-1 h-8 bg-white/15 rounded-full blur animate-bounce" style={{ animationDelay: '0.5s' }} />
                            </div>
                        </div>

                        {/* Phone on table */}
                        <div className="absolute right-12 top-2 w-[140px] h-[260px] bg-black rounded-[24px] border-4 border-zinc-800 shadow-xl overflow-hidden cursor-pointer group" onClick={() => setGameState('radar')}>
                            {/* Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-b-xl z-10" />
                            {/* Status bar */}
                            <div className="pt-7 px-3 flex justify-between items-center">
                                <span className="text-[8px] text-white font-bold">11:45</span>
                                <div className="flex items-center gap-1">
                                    {/* 4G icon - clickable */}
                                    <div className="flex items-end gap-[1px] h-3 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleClueClick('mobile_data'); }}>
                                        {[...Array(4)].map((_, i) => <div key={i} className="w-[2px] bg-white rounded-full" style={{ height: `${(i + 1) * 25}%` }} />)}
                                        <span className="text-[6px] text-white font-bold ml-[2px]">4G</span>
                                    </div>
                                    <div className="w-5 h-[8px] border border-white/40 rounded-sm p-[1px]">
                                        <div className="h-full bg-green-400 rounded-sm" style={{ width: '80%' }} />
                                    </div>
                                </div>
                            </div>
                            {/* Screen content */}
                            <div className="p-3 flex flex-col gap-2 flex-1">
                                {/* Bank notification */}
                                <div className="bg-white/10 p-2 rounded-lg border border-white/10 animate-pulse">
                                    <div className="flex items-center gap-2">
                                        <div className="w-5 h-5 bg-indigo-500 rounded-md text-[6px] text-white flex items-center justify-center font-bold">SBI</div>
                                        <div>
                                            <div className="text-[7px] text-white font-bold">Bank Alert</div>
                                            <div className="text-[6px] text-white/50">Review ₹12,000 charge</div>
                                        </div>
                                    </div>
                                </div>
                                {/* VPN app */}
                                <div className="cursor-pointer hover:scale-105 transition-all bg-white/5 p-2 rounded-lg border border-white/5" onClick={(e) => { e.stopPropagation(); handleClueClick('vpn_clue'); }}>
                                    <div className="flex items-center gap-2">
                                        <div className="text-lg">🛡️</div>
                                        <div>
                                            <div className="text-[7px] text-white font-bold">VPN App</div>
                                            <div className="text-[6px] text-red-400">OFF — Not Protected</div>
                                        </div>
                                    </div>

                                </div>
                                {/* Scan networks button */}
                                <div className="mt-auto">
                                    <div className="bg-gradient-to-r from-cyan-600 to-indigo-600 text-white text-[8px] font-black py-2 rounded-lg text-center uppercase tracking-wider shadow-lg group-hover:shadow-cyan-500/30">
                                        📡 Scan Wi-Fi Networks
                                    </div>
                                </div>
                            </div>
                            {/* Home bar */}
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-16 h-1 bg-white/30 rounded-full" />
                        </div>

                        {/* Croissant */}
                        <div className="absolute left-28 top-8 w-12 h-8 bg-amber-400/60 rounded-[50%] rotate-12 border border-amber-600/30 shadow-md" />
                    </div>
                </div>

                {/* Counter / Barista area */}
                <div className="absolute right-0 bottom-0 w-[35%] h-[55%] bg-gradient-to-t from-[#0a0604] to-[#2d1810] border-l-[10px] border-[#3d2415]">
                    {/* Barista */}
                    <div className="absolute -top-20 left-12 flex flex-col items-center">
                        <div className="w-12 h-12 bg-amber-900/40 rounded-full" />
                        <div className="w-24 h-32 bg-gradient-to-b from-emerald-900/40 to-black rounded-t-[30px] mt-1 relative">
                            <div className="absolute top-0 inset-x-4 h-full bg-emerald-800/20 border-x border-emerald-700/10" />
                        </div>
                    </div>
                    {/* Menu board */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[80%] h-24 bg-zinc-900 rounded-lg border-4 border-[#3d2415] p-3">
                        <div className="text-[8px] text-amber-400 font-black text-center mb-1">☕ MENU</div>
                        <div className="text-[6px] text-stone-400 space-y-0.5 text-center font-mono">
                            <p>Filter Coffee ₹80 | Latte ₹150</p>
                            <p>Croissant ₹120 | Sandwich ₹200</p>
                        </div>
                    </div>
                </div>

                {/* ═══ BOTTOM HUD ═══ */}
                <div className="absolute bottom-4 left-4 flex gap-3 z-40">
                    <button onClick={() => setShowCluesSidebar(!showCluesSidebar)} className="bg-slate-900/90 backdrop-blur border border-white/10 hover:border-amber-500 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg">
                        🔍 Evidence ({cluesFound.length}/{CLUE_DATA.length})
                        {cluesFound.length > 0 && !showCluesSidebar && <span className="w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center animate-bounce">{cluesFound.length}</span>}
                    </button>
                </div>

                {/* Top instruction bar */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur border border-white/10 px-6 py-3 rounded-xl z-40">
                    <p className="text-white/80 text-xs font-bold text-center">
                        {cluesFound.length < 3
                            ? "☕ Explore the café. Click on suspicious items to gather clues."
                            : "✓ You have enough clues! Click the phone to scan Wi-Fi networks and make your choice."}
                    </p>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════
    // NETWORK RADAR
    // ═══════════════════════════════════════
    if (gameState === 'radar') {
        return (
            <div className="w-full h-full bg-[#040810] relative overflow-hidden">
                <FeedbackToast />
                <CluesSidebar />

                {/* Sonar rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="absolute rounded-full border border-cyan-500/10" style={{ width: (i + 1) * 180, height: (i + 1) * 180 }} />
                    ))}
                    {/* Sweep line */}
                    <div className="absolute w-[600px] h-[600px] animate-[spin_6s_linear_infinite] pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 w-1/2 h-px bg-gradient-to-r from-cyan-400/40 to-transparent" />
                    </div>
                </div>

                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }} />

                {/* Center device */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 pointer-events-none">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-indigo-800 rounded-2xl flex items-center justify-center shadow-[0_0_60px_rgba(34,211,238,0.3)] border-2 border-white/20">
                        <span className="text-2xl">📱</span>
                    </div>
                    <div className="mt-3 px-4 py-1.5 bg-cyan-950/80 border border-cyan-500/30 rounded-full">
                        <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Your Device</span>
                    </div>
                </div>

                {/* Network bubbles */}
                {NETWORKS.map((net, idx) => {
                    const positions = [
                        { x: '65%', y: '20%' },
                        { x: '15%', y: '25%' },
                        { x: '75%', y: '70%' },
                        { x: '20%', y: '72%' },
                    ];
                    const pos = positions[idx];
                    const isActive = activeNetwork === net.id;
                    const isSelected = activeNetwork === net.id;

                    return (
                        <div key={net.id} className="absolute z-20 cursor-pointer group" style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
                            onClick={() => { setActiveNetwork(net.id); if (net.id === 'sbi_secure') handleClueClick('secure_net_props'); }}>
                            {/* Pulse ring */}
                            <div className={`absolute inset-[-10px] rounded-full border animate-ping ${!net.safe ? 'border-red-500/20' : 'border-cyan-500/10'}`} />
                            {/* Bubble */}
                            <div className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-500 border-2 ${isActive ? (!net.safe ? 'border-red-400 bg-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.3)]' : 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_40px_rgba(34,211,238,0.3)]')
                                : 'border-slate-700 bg-slate-900/50 group-hover:border-slate-500'
                                }`}>
                                <span className="text-2xl mb-1">{net.locked ? '🔒' : '🔓'}</span>
                                {/* Signal bars */}
                                <div className="flex gap-1 items-end h-3">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className={`w-1 rounded-full transition-all ${i < net.signal ? (!net.safe ? 'bg-red-400' : 'bg-cyan-400') : 'bg-slate-700'
                                            }`} style={{ height: `${(i + 1) * 25}%` }} />
                                    ))}
                                </div>
                            </div>
                            {/* Name label */}
                            <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${isActive ? (!net.safe ? 'bg-red-600 border-red-400 text-white' : 'bg-cyan-600 border-cyan-400 text-white')
                                : 'bg-slate-900/80 border-slate-700 text-slate-400 group-hover:text-white'
                                }`}>
                                {net.name}
                            </div>
                        </div>
                    );
                })}

                {/* Network Inspector Panel (right side) */}
                {activeNetwork && (() => {
                    const net = NETWORKS.find(n => n.id === activeNetwork);
                    return (
                        <div className="absolute top-6 bottom-6 right-6 w-[360px] bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 z-30 flex flex-col animate-in slide-in-from-right duration-500 shadow-2xl overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-white font-black text-lg">Network Details</h3>
                                <button onClick={() => setActiveNetwork(null)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 text-sm">✕</button>
                            </div>

                            <div className="space-y-4 flex-1">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">SSID</span>
                                    <span className="text-white font-black text-lg">{net.name}</span>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Security</span>
                                    <span className={`font-black text-sm ${net.safe ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {net.safe ? '🛡️' : '⚠️'} {net.security}
                                    </span>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">MAC Address</span>
                                    <span className={`font-mono text-xs ${!net.safe ? 'text-red-400' : 'text-slate-300'}`}>{net.mac}</span>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Origin</span>
                                    <span className={`text-sm font-bold ${!net.safe ? 'text-red-400' : 'text-slate-300'}`}>{net.created}</span>
                                </div>

                                {!net.safe && (
                                    <div className="bg-red-500/10 border-2 border-red-500/30 p-4 rounded-xl animate-pulse">
                                        <p className="text-red-300 text-sm font-bold leading-relaxed">⚠️ {net.desc}</p>
                                    </div>
                                )}
                                {net.safe && net.id === 'brew_connect' && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl">
                                        <p className="text-emerald-300 text-sm font-bold leading-relaxed">✓ {net.desc}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 space-y-3">
                                {net.id === 'sbi_secure' && (
                                    <button onClick={() => handleFinalChoice('sbi_secure')} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-black text-sm transition-all border border-white/10">
                                        Connect to {net.name}
                                    </button>
                                )}
                                {net.id === 'brew_connect' && (
                                    <button onClick={() => handleFinalChoice('safe')} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-black text-sm transition-all border border-white/10">
                                        Connect to {net.name}
                                    </button>
                                )}
                                {(net.id === 'android_hotspot' || net.id === 'bsnl_fiber') && (
                                    <div className="text-center text-slate-500 text-xs font-bold py-4">Signal too weak to connect</div>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* Use Mobile Data button */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-30">
                    <button onClick={() => setGameState('cafe')} className="bg-slate-800/90 backdrop-blur border border-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-700 transition-all">
                        ← Back to Café
                    </button>
                    <button onClick={() => handleFinalChoice('safe')} className="bg-slate-800/90 backdrop-blur border border-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-700 transition-all">
                        📶 Use Mobile Data Instead
                    </button>
                    <button onClick={() => setShowCluesSidebar(!showCluesSidebar)} className="bg-slate-800/90 backdrop-blur border border-white/10 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-slate-700 transition-all">
                        🔍 Evidence ({cluesFound.length})
                    </button>
                </div>

                {/* Top info */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur border border-white/10 px-6 py-3 rounded-xl z-30">
                    <p className="text-white/80 text-xs font-bold text-center">📡 Click a network bubble to inspect it. Choose wisely before connecting.</p>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════
    // OUTCOME
    // ═══════════════════════════════════════
    if (gameState === 'outcome') {
        const totalPoints = cluesFound.reduce((sum, id) => sum + (CLUE_DATA.find(c => c.id === id)?.points || 0), 0);

        if (outcomeType === 'victory') {
            return (
                <div className="w-full h-full bg-[#040810] flex items-center justify-center p-8 overflow-y-auto">
                    <div className="max-w-3xl w-full text-center animate-in zoom-in-95 duration-500">
                        <div className="w-28 h-28 bg-emerald-500 rounded-3xl flex items-center justify-center text-6xl mx-auto mb-8 shadow-[0_0_80px_rgba(16,185,129,0.4)] animate-bounce">🛡️</div>
                        <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-4">THREAT NEUTRALIZED</h1>
                        <p className="text-slate-400 text-lg italic mb-10 max-w-xl mx-auto leading-relaxed">
                            You refused the honeypot trap, used safe mobile data, and alerted the café staff. The hacker packed up and left. Six other customers were saved.
                        </p>

                        <div className="grid grid-cols-3 gap-6 mb-10">
                            <div className="bg-slate-900 border border-emerald-500/30 p-6 rounded-2xl">
                                <span className="text-emerald-400 text-3xl font-black">+{totalPoints}</span>
                                <p className="text-slate-500 text-xs font-bold mt-2 uppercase tracking-wider">Detective Points</p>
                            </div>
                            <div className="bg-slate-900 border border-indigo-500/30 p-6 rounded-2xl">
                                <span className="text-indigo-400 text-lg font-black">Community Guardian</span>
                                <p className="text-slate-500 text-xs font-bold mt-2 uppercase tracking-wider">Badge Unlocked</p>
                            </div>
                            <div className="bg-slate-900 border border-cyan-500/30 p-6 rounded-2xl">
                                <span className="text-cyan-400 text-lg font-black">₹0 Lost</span>
                                <p className="text-slate-500 text-xs font-bold mt-2 uppercase tracking-wider">Assets Protected</p>
                            </div>
                        </div>

                        <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl mb-8 text-left">
                            <h3 className="text-emerald-400 font-black text-sm uppercase tracking-wider mb-3">🔐 Cyber Tip — Level 7</h3>
                            <ul className="text-slate-300 text-sm space-y-2 leading-relaxed">
                                <li>• <strong>NEVER</strong> do banking on public/open Wi-Fi</li>
                                <li>• A <strong>Honeypot</strong> is a fake Wi-Fi that looks legitimate</li>
                                <li>• <strong>Mobile data (4G/5G)</strong> is always safest for banking</li>
                                <li>• If you must use public Wi-Fi, enable a <strong>trusted VPN</strong></li>
                                <li>• <strong>MITM attacks</strong> are silent — the victim never knows</li>
                            </ul>
                        </div>

                        <button onClick={() => completeLevel(true, totalPoints, 0)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-12 py-5 rounded-2xl text-xl transition-all shadow-xl active:scale-95 uppercase tracking-wider">
                            Complete Mission →
                        </button>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="w-full h-full bg-black flex items-center justify-center p-8 overflow-y-auto">
                    <div className="max-w-3xl w-full text-center animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-[0_0_80px_rgba(220,38,38,0.5)] animate-bounce">!</div>
                        <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-4">CREDENTIALS COMPROMISED</h1>
                        <p className="text-slate-400 text-lg italic mb-8 max-w-xl mx-auto leading-relaxed">
                            By connecting to <span className="text-red-400 font-bold">SBI_SecureNet</span>, your banking credentials were captured by the hacker's MITM attack. ₹1,20,000 was transferred to a mule account.
                        </p>

                        <div className="space-y-3 mb-8 font-mono text-left max-w-md mx-auto">
                            {[
                                { t: '11:46 AM', msg: 'Connected to SBI_SecureNet', status: 'CONNECTED', color: 'text-slate-500' },
                                { t: '11:47 AM', msg: 'YONO login credentials captured', status: 'INTERCEPTED', color: 'text-red-500' },
                                { t: '11:48 AM', msg: 'Session token cloned', status: 'HIJACKED', color: 'text-red-500' },
                                { t: '11:49 AM', msg: 'UPI transfer: ₹1,20,000', status: 'DEBIT', color: 'text-red-500' },
                                { t: '11:50 AM', msg: 'User called 1930 Helpline', status: 'REPORTED', color: 'text-amber-500' },
                                { t: '11:51 AM', msg: 'Bank account freeze requested', status: 'BLOCKED', color: 'text-cyan-400' },
                            ].map((log, i) => (
                                <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center animate-in fade-in duration-500" style={{ animationDelay: `${i * 150}ms` }}>
                                    <div>
                                        <span className="text-white/20 text-[10px] block">{log.t}</span>
                                        <span className={`text-sm font-black ${log.color}`}>{log.msg}</span>
                                    </div>
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${log.color === 'text-red-500' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                        log.color === 'text-amber-500' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                            log.color === 'text-cyan-400' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' :
                                                'bg-white/5 border-white/10 text-white/40'
                                        }`}>{log.status}</span>
                                </div>
                            ))}
                        </div>

                        <div className="bg-red-600/10 border-2 border-red-600/30 p-6 rounded-2xl mb-8">
                            <h2 className="text-red-500 text-lg font-black uppercase tracking-wider mb-2">Total Lost to Hacker</h2>
                            <span className="text-4xl font-black text-white font-mono">-₹1,20,000</span>
                        </div>

                        <div className="flex gap-4 justify-center">
                            <button onClick={() => { adjustAssets(-120000); adjustLives(-1); setGameState('cafe'); setCluesFound([]); setActiveNetwork(null); setOutcomeType(null); }}
                                className="bg-slate-800 hover:bg-slate-700 text-white font-black px-8 py-4 rounded-xl text-sm transition-all border border-white/10">
                                Try Again
                            </button>
                            <button onClick={() => { adjustAssets(-120000); adjustLives(-1); completeLevel(false, 0, 0); }}
                                className="bg-red-600 hover:bg-red-500 text-white font-black px-8 py-4 rounded-xl text-sm transition-all">
                                Accept Loss & Continue
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
    }

    return null;
};

export default Level7;
