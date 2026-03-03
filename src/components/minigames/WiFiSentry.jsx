import React, { useState, useEffect, useCallback, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════
// NETWORK DATA
// ═══════════════════════════════════════════════════════════════
const NETWORKS = [
    {
        id: 1,
        ssid: "Airport Official WiFi",
        signal: 3, // 0-3
        isSecure: true,
        securityType: "WPA3",
        hasCertIssue: false,
        correctAction: "connect",
        explanation: "Official, encrypted airport network is safe for passengers.",
        clue: "Lock icon and official name match the airport credentials."
    },
    {
        id: 2,
        ssid: "Airport_Free_WiFi",
        signal: 3,
        isSecure: false,
        securityType: "Open",
        hasCertIssue: false,
        correctAction: "vpn",
        explanation: "Public open Wi-Fi lacks encryption. Always use a VPN.",
        clue: "Open network (no lock icon) is a risk for packet sniffing."
    },
    {
        id: 3,
        ssid: "Free_Public_123",
        signal: 2,
        isSecure: false,
        securityType: "Open",
        hasCertIssue: true,
        certWarning: "The certificate for this server is invalid or expired.",
        correctAction: "avoid",
        explanation: "Certificate warnings often indicate a Man-in-the-Middle attack.",
        clue: "SSL/TLS certificate warnings are a critical red flag."
    },
    {
        id: 4,
        ssid: "Staff_Only",
        signal: 1,
        isSecure: true,
        securityType: "WPA2 Enterprise",
        hasCertIssue: false,
        correctAction: "avoid",
        explanation: "Restricted staff-only zones are not for public use and can be traps.",
        clue: "Explicitly restricts access to authorized personnel."
    },
    {
        id: 5,
        ssid: "A1rport_Official_WiFi",
        signal: 3,
        isSecure: false,
        securityType: "Open",
        hasCertIssue: false,
        correctAction: "avoid",
        explanation: "Evil Twin Attack: Uses typosquatting (1 instead of i) to trick you.",
        clue: "Check the spelling: 'A1rport' uses a digit instead of a letter."
    },
    {
        id: 6,
        ssid: "CoffeeShop_Guest",
        signal: 2,
        isSecure: false,
        securityType: "Open",
        hasCertIssue: false,
        correctAction: "vpn",
        explanation: "Guest networks are convenient but insecure without a VPN.",
        clue: "Open guest networks require a VPN tunnel for security."
    }
];

const WiFiSentry = ({ onBack }) => {
    const [gameState, setGameState] = useState('intro');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [history, setHistory] = useState([]);
    const [feedback, setFeedback] = useState(null);
    const [expandedResult, setExpandedResult] = useState(null);
    const timerRef = useRef(null);

    const currentNetwork = NETWORKS[currentIndex];

    const startGame = useCallback(() => {
        setGameState('playing');
        setElapsed(0);
        setExpandedResult(null);
        timerRef.current = setInterval(() => {
            setElapsed(prev => prev + 1);
        }, 1000);
    }, []);

    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const handleAction = (action) => {
        if (feedback) return;

        const isCorrect = currentNetwork.correctAction === action;

        if (isCorrect) {
            setScore(prev => prev + 1000);
            setFeedback('correct');
        } else {
            setFeedback('wrong');
        }

        setHistory(prev => [...prev, { network: currentNetwork, action, isCorrect }]);

        setTimeout(() => {
            setFeedback(null);
            if (currentIndex < NETWORKS.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                if (timerRef.current) clearInterval(timerRef.current);
                setGameState('result');
            }
        }, 1500);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const renderSignal = (level, isLight) => (
        <div className="flex items-end gap-[2px] h-3.5">
            {[1, 2, 3].map(i => (
                <div
                    key={i}
                    className={`w-[2.5px] rounded-full transition-all ${i <= level ? (isLight ? 'bg-cyan-600' : 'bg-cyan-400') : (isLight ? 'bg-gray-200' : 'bg-slate-700')}`}
                    style={{ height: `${(i / 3) * 100}%` }}
                />
            ))}
        </div>
    );

    const renderIntro = () => (
        <div className="flex flex-col items-center justify-center p-12 text-center max-w-2xl animate-fade-in h-[75vh]">
            <div className="w-24 h-24 bg-cyan-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
                <span className="text-5xl">📡</span>
            </div>
            <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-6 underline decoration-cyan-500 underline-offset-8 italic">WiFi Sentry</h2>
            <p className="text-slate-400 leading-relaxed mb-10 text-lg font-mono">
                [ AEGIS_NETWORK_VERIFIER_V1.0 ]
                <br /><br />
                Analyze available infrastructure.
                Determine the threat level and secure the connection.
            </p>
            <div className="flex gap-4">
                <button onClick={onBack} className="px-10 py-4 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-black rounded-2xl transition-all uppercase tracking-[0.2em] text-xs border border-slate-800 active:scale-95">
                    ABORT
                </button>
                <button onClick={startGame} className="px-14 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all uppercase tracking-[0.2em] text-xs border border-cyan-400 active:scale-95">
                    START SCAN
                </button>
            </div>
        </div>
    );

    const renderPlaying = () => (
        <div className="w-full h-full flex flex-col animate-fade-in font-sans">
            {/* Top Stats Bar */}
            <div className="shrink-0 w-full bg-slate-900 border-b border-slate-800 px-8 py-3 flex items-center justify-between z-50">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">NETWORKS</span>
                        <span className="text-sm font-bold text-white">{currentIndex + 1} / {NETWORKS.length}</span>
                    </div>
                    <div className="w-px h-6 bg-slate-800" />
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">TIME</span>
                        <span className="text-sm font-bold text-cyan-400 font-mono tracking-tighter">{formatTime(elapsed)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-0.5">SCORE</span>
                        <span className="text-lg font-black text-white italic tracking-tighter">{score.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex bg-slate-950 overflow-hidden relative">

                {/* Main View: Central Phone Mockup (Black Theme Frame, White Theme Content) */}
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="w-[320px] h-[600px] bg-black rounded-[3rem] border-[10px] border-[#1a1a1a] shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden relative flex flex-col scale-[1.1]">

                        {/* Status Bar */}
                        <div className="h-6 w-full flex justify-between items-center px-8 pt-3 pb-1">
                            <span className="text-[9px] font-bold text-slate-500 font-mono">10:42</span>
                            <div className="flex items-center gap-1 opacity-20">
                                <div className="w-1 h-1 rounded-full bg-white" />
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                <div className="w-3 h-1.5 border border-white rounded-[1px]" />
                            </div>
                        </div>

                        {/* Wi-Fi Settings UI (White Content) */}
                        <div className="flex-1 flex flex-col p-5 bg-white m-1 rounded-[2.5rem] overflow-hidden">
                            <div className="flex-1 flex flex-col overflow-y-auto">
                                <div className="flex items-center justify-between mb-6 px-1 mt-4">
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">Wi-Fi</h3>
                                    <div className="w-10 h-5 bg-emerald-500 rounded-full relative">
                                        <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                                    </div>
                                </div>

                                <p className="text-[9px] uppercase font-black tracking-widest text-slate-400 mb-4 px-1">Available Networks</p>

                                <div className="space-y-3">
                                    {NETWORKS.map((net, idx) => (
                                        <div
                                            key={net.id}
                                            className={`transition-all duration-500 ${idx > currentIndex ? 'opacity-0 translate-y-2' : 'opacity-100'}`}
                                        >
                                            <div
                                                className={`w-full p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between
                                                    ${currentIndex === idx
                                                        ? 'bg-blue-50 border-blue-200 ring-2 ring-blue-500/10 shadow-sm'
                                                        : 'bg-white border-gray-100 opacity-40'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center
                                                        ${currentIndex === idx ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                                        <span className="text-sm">📡</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`text-xs font-bold ${currentIndex === idx ? 'text-slate-900' : 'text-slate-400'}`}>
                                                            {net.ssid}
                                                        </span>
                                                        <span className="text-[8px] text-gray-400 uppercase font-black tracking-tight">{net.securityType}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {net.isSecure && <span className="text-[10px] text-gray-400">🔒</span>}
                                                    {renderSignal(net.signal, true)}
                                                </div>
                                            </div>

                                            {/* Certificate warning on the current active item */}
                                            {currentIndex === idx && net.hasCertIssue && (
                                                <div className="mt-2 mx-1 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2 animate-bounce-subtle">
                                                    <span className="text-sm">⚠️</span>
                                                    <div className="flex flex-col">
                                                        <span className="text-[8px] font-black text-red-600 uppercase tracking-widest mb-0.5">Certificate Warning</span>
                                                        <p className="text-[9px] text-slate-500 leading-tight">{net.certWarning}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Selection Hint */}
                            <div className="p-4 border-t border-gray-100 bg-gray-50/50 -mx-5 -mb-5">
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 italic">
                                    <span>👆</span> Select a network to proceed
                                </div>
                            </div>
                        </div>

                        {/* Feedback Overlay */}
                        {feedback && (
                            <div className={`absolute inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-sm transition-all duration-300 ${feedback === 'correct' ? 'bg-emerald-500/5' : 'bg-rose-500/5'}`}>
                                <div className="p-8 rounded-[2.5rem] bg-white border border-gray-100 shadow-2xl flex flex-col items-center text-center scale-110">
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 text-3xl border ${feedback === 'correct' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                                        {feedback === 'correct' ? '✅' : '❌'}
                                    </div>
                                    <h4 className={`text-2xl font-black uppercase tracking-tighter ${feedback === 'correct' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {feedback === 'correct' ? 'SECURE' : 'HACKED'}
                                    </h4>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Verdict Sidebar (Similar to FileFortress) */}
                <div className="shrink-0 w-80 bg-black border-l border-slate-900 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-40">

                    {/* Verdict Controls */}
                    <div className="flex-1 flex flex-col p-8 justify-center gap-4 border-b border-slate-900">
                        <div className="text-center mb-4">
                            <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest block mb-2 underline decoration-cyan-500">Verdict Panel</span>
                            <h3 className="text-white font-bold text-xs tracking-tight leading-relaxed">Evaluation Protocol</h3>
                        </div>

                        <button
                            onClick={() => handleAction('connect')}
                            disabled={!!feedback}
                            className="w-full py-6 bg-emerald-600/10 border-2 border-emerald-500/20 rounded-2xl group hover:bg-emerald-600 hover:border-emerald-400 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-20 active:scale-95"
                        >
                            <span className="text-2xl group-hover:scale-110 transition-transform">✓</span>
                            <span className="font-black text-emerald-500 group-hover:text-white uppercase tracking-widest text-[10px]">Connect</span>
                        </button>

                        <button
                            onClick={() => handleAction('vpn')}
                            disabled={!!feedback}
                            className="w-full py-6 bg-amber-600/10 border-2 border-amber-500/20 rounded-2xl group hover:bg-amber-600 hover:border-amber-400 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-20 active:scale-95"
                        >
                            <span className="text-2xl group-hover:scale-110 transition-transform">🛡️</span>
                            <span className="font-black text-amber-500 group-hover:text-white uppercase tracking-widest text-[10px]">Use VPN</span>
                        </button>

                        <button
                            onClick={() => handleAction('avoid')}
                            disabled={!!feedback}
                            className="w-full py-6 bg-rose-600/10 border-2 border-rose-500/20 rounded-2xl group hover:bg-rose-600 hover:border-rose-400 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-20 active:scale-95"
                        >
                            <span className="text-2xl group-hover:scale-110 transition-transform">✕</span>
                            <span className="font-black text-rose-500 group-hover:text-white uppercase tracking-widest text-[10px]">Avoid</span>
                        </button>
                    </div>

                    {/* Smaller Tactical Analysis */}
                    <div className="p-6 bg-[#050505]">
                        <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-6">Analyzing Available Infrastructure</h4>

                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <span className="text-lg grayscale group-hover:grayscale-0">🔍</span>
                                <div>
                                    <h5 className="text-slate-400 font-black text-[9px] uppercase tracking-wider mb-1">Metadata Scan</h5>
                                    <p className="text-slate-600 text-[8px] leading-relaxed">Each SSID reveals intent. Look for typos, missing encryption (locks), or restricted labels.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-lg grayscale">📑</span>
                                <div>
                                    <h5 className="text-slate-400 font-black text-[9px] uppercase tracking-wider mb-1">Certificate Chain</h5>
                                    <p className="text-slate-600 text-[8px] leading-relaxed">Invalid certificates on infrastructure usually indicate a Man-in-the-Middle configuration.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="text-lg grayscale">🌐</span>
                                <div>
                                    <h5 className="text-slate-400 font-black text-[9px] uppercase tracking-wider mb-1">VPN Tunnelling</h5>
                                    <p className="text-slate-600 text-[8px] leading-relaxed">Public hotspots are vulnerabilities. Encapsulating traffic via VPN provides security.</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-900">
                            <div className="p-4 bg-[#0a0a0a] rounded-xl border border-slate-900 text-center">
                                <span className="text-[8px] text-slate-600 font-black uppercase tracking-widest block mb-1">Aegis Guidance</span>
                                <p className="text-[8px] text-slate-500 italic leading-snug">"Infrastructure is only as secure as the user connecting to it."</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
                .animate-bounce-subtle { animation: bounceSubtle 2s infinite ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes bounceSubtle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
            `}</style>
        </div>
    );

    const renderResult = () => {
        const correctCount = history.filter(h => h.isCorrect).length;
        const accuracy = Math.round((correctCount / NETWORKS.length) * 100);

        const getGrade = () => {
            if (accuracy >= 100) return { grade: 'S', color: '#06b6d4', label: 'FORTRESS KEEPER' };
            if (accuracy >= 80) return { grade: 'A', color: '#10b981', label: 'WATCHMAN' };
            if (accuracy >= 60) return { grade: 'B', color: '#3b82f6', label: 'SENTRY' };
            if (accuracy >= 40) return { grade: 'C', color: '#f59e0b', label: 'GUARD' };
            return { grade: 'F', color: '#ef4444', label: 'VULNERABLE' };
        };

        const resultGrade = getGrade();

        return (
            <div className="w-full max-w-5xl px-6 py-8 flex flex-col items-center animate-fade-in overflow-y-auto" style={{ maxHeight: '92vh' }}>
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 mb-4 shadow-lg"
                        style={{ borderColor: resultGrade.color, boxShadow: `0 0 50px ${resultGrade.color}33` }}>
                        <span className="text-5xl font-black" style={{ color: resultGrade.color }}>{resultGrade.grade}</span>
                    </div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter">{resultGrade.label}</h2>
                    <p className="text-slate-500 font-mono text-xs mt-2 uppercase tracking-widest">Protocol Complete — Infrastructure Audit</p>
                </div>

                <div className="grid grid-cols-4 gap-4 w-full max-w-2xl mb-10">
                    {[
                        { label: 'Score', value: score.toLocaleString(), color: 'text-cyan-400' },
                        { label: 'Accuracy', value: `${accuracy}%`, color: accuracy >= 70 ? 'text-emerald-400' : 'text-red-400' },
                        { label: 'Time Taken', value: formatTime(elapsed), color: 'text-amber-400' },
                        { label: 'Inspected', value: `${correctCount}/${NETWORKS.length}`, color: 'text-indigo-400' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                            <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest block mb-1">{stat.label}</span>
                            <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                        </div>
                    ))}
                </div>

                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 self-start">Network Logs</h3>
                <div className="w-full space-y-3 mb-10">
                    {history.map((item, idx) => (
                        <div
                            key={idx}
                            className={`rounded-xl border overflow-hidden transition-all cursor-pointer ${item.isCorrect
                                ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                                : 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                                }`}
                            onClick={() => setExpandedResult(expandedResult === idx ? null : idx)}
                        >
                            <div className="flex items-center gap-4 px-5 py-4">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-800 text-white text-xs font-black shrink-0">
                                    {item.network.ssid[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-bold text-white truncate">{item.network.ssid}</span>
                                        <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded ${item.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {item.network.securityType}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-500 truncate block font-mono">Action: {item.action.toUpperCase()}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`text-sm font-bold ${item.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {item.isCorrect ? '✓' : '✗'}
                                    </span>
                                    <span className="text-slate-600 text-xs">{expandedResult === idx ? '▲' : '▼'}</span>
                                </div>
                            </div>

                            {expandedResult === idx && (
                                <div className="border-t border-slate-800 bg-slate-950/50 px-5 py-4 space-y-2 animate-fade-in">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Network Analysis</span>
                                    <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-cyan-500 pl-4 py-1">
                                        "{item.network.explanation}"
                                    </p>
                                    <div className="flex items-start gap-2 text-xs text-cyan-400/80 mt-3 font-mono">
                                        <span className="text-cyan-500 font-bold">Signal:</span>
                                        <span>{['Weak', 'Moderate', 'Strong'][item.network.signal - 1] || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-start gap-2 text-xs text-cyan-400/80 font-mono">
                                        <span className="text-cyan-500 font-bold">Indicator:</span>
                                        <span>{item.network.clue}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button onClick={startGame} className="px-12 py-4 bg-cyan-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-indigo-50 transition-all hover:text-cyan-600 shadow-lg text-sm">
                        RETRY SCAN
                    </button>
                    <button onClick={onBack} className="px-8 py-4 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all font-bold text-sm">
                        BACK TO LAB
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center font-sans overflow-hidden bg-transparent">
            {gameState === 'intro' && renderIntro()}
            {gameState === 'playing' && renderPlaying()}
            {gameState === 'result' && renderResult()}
        </div>
    );
};

export default WiFiSentry;
