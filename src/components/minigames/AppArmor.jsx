import React, { useState, useEffect, useCallback, useRef } from 'react';

const APPS = [
    {
        id: 1,
        name: "Flashlight Ultra",
        developer: "BrightApps Co.",
        downloads: "50,000+",
        rating: 4.8,
        ratingCount: "1.2k",
        icon: "🔦",
        category: "Tools",
        description: "The brightest and fastest flashlight app for your phone. Simple one-tap interface to light up your world. Works even when screen is off.",
        isMalicious: true,
        redFlags: [
            "Requests SMS and Location permissions (not needed for a flashlight).",
            "Relatively low download count for a high-rated utility app.",
            "Generic developer name."
        ],
        permissions: [
            { name: "Camera", desc: "Required to use the flash", status: "ok" },
            { name: "Location", desc: "Used for 'localized lighting'", status: "danger" },
            { name: "SMS", desc: "Required for 'emergency backup'", status: "danger" },
            { name: "Contacts", desc: "To share the app with friends", status: "danger" }
        ],
        reviews: [
            { user: "CoolGamer99", rating: 5, text: "Best app ever!!! Must download now!!!!!" },
            { user: "User12345", rating: 5, text: "Works great, very bright. Easy to use." },
            { user: "SecureMind", rating: 1, text: "Why does it need my texts? Stay away!" }
        ]
    },
    {
        id: 2,
        name: "WhatsApp Messenger",
        developer: "WhatsApp LLC",
        downloads: "5B+",
        rating: 4.3,
        ratingCount: "172M",
        icon: "💬",
        category: "Communication",
        description: "Simple. Reliable. Private. Messaging and calling for free, available all over the world.",
        isMalicious: false,
        redFlags: [],
        permissions: [
            { name: "Contacts", desc: "To connect with your friends", status: "ok" },
            { name: "Microphone", desc: "For voice messages and calls", status: "ok" },
            { name: "Camera", desc: "For photos and video calls", status: "ok" },
            { name: "Storage", desc: "To save media files", status: "ok" }
        ],
        reviews: [
            { user: "Sarah J.", rating: 5, text: "Essential app. Best way to stay in touch." },
            { user: "Mike R.", rating: 4, text: "Solid, but dark mode could be better." },
            { user: "Elena", rating: 5, text: "Everything I need in one place." }
        ]
    },
    {
        id: 3,
        name: "G-Pay Rewards & Cashback",
        developer: "Google Rewards Inc.",
        downloads: "5,000+",
        rating: 4.9,
        ratingCount: "432",
        icon: "💰",
        category: "Finance",
        description: "Official rewards portal for G-Pay users. Get instant cashback and premium vouchers for every transaction you make. Limited time offer!",
        isMalicious: true,
        redFlags: [
            "Copycat developer name ('Google Rewards Inc.' instead of 'Google LLC').",
            "Extremely low download count for a supposed 'official' financial app.",
            "Requests dangerous Accessibility and SMS permissions to intercept OTPs."
        ],
        permissions: [
            { name: "SMS", desc: "To verify your UPI linkage", status: "danger" },
            { name: "Accessibility", desc: "Required for 'seamless cashback' processing", status: "danger" },
            { name: "Phone", desc: "To verify your identity", status: "ok" }
        ],
        reviews: [
            { user: "WinnerBig", rating: 5, text: "I just got ₹500 cashback!!! AWESOME!!" },
            { user: "FreeMoney", rating: 5, text: "Legit app, everyone should try." },
            { user: "CyberCop", rating: 1, text: "THIS IS A SCAM. WATCH YOUR PERMISSIONS." }
        ]
    },
    {
        id: 4,
        name: "Instagram",
        developer: "Instagram",
        downloads: "1B+",
        rating: 4.0,
        ratingCount: "145M",
        icon: "📸",
        category: "Social",
        description: "Bringing you closer to the people and things you love.",
        isMalicious: false,
        redFlags: [],
        permissions: [
            { name: "Camera", desc: "To take photos and videos", status: "ok" },
            { name: "Microphone", desc: "For reels and stories", status: "ok" },
            { name: "Location", desc: "To add locations to posts", status: "ok" },
            { name: "Storage", desc: "To upload media from gallery", status: "ok" }
        ],
        reviews: [
            { user: "InspoDaily", rating: 5, text: "Love the new reels features!" },
            { user: "PhotographyLover", rating: 4, text: "Great community for sharing shots." }
        ]
    },
    {
        id: 5,
        name: "Antivirus Master Pro 2024",
        developer: "Security Labs Free",
        downloads: "100,000+",
        rating: 4.7,
        ratingCount: "8k",
        icon: "🛡️",
        category: "Security",
        description: "Number #1 antivirus for mobile protection. One-click scan, virus removal, and system optimization. Keep your phone healthy and fast.",
        isMalicious: true,
        redFlags: [
            "Requests 'Query All Packages' and 'Install Packages' (classic spyware behavior).",
            "Antivirus apps from unknown developers are often malware themselves.",
            "Promotes 'One-click cleaning' which usually just shows ads."
        ],
        permissions: [
            { name: "Query All Packages", desc: "To scan all apps for viruses", status: "danger" },
            { name: "Install Packages", desc: "To update security signatures", status: "danger" },
            { name: "Storage", desc: "To scan local files", status: "ok" },
            { name: "Accessibility", desc: "To stop malicious processes", status: "danger" }
        ],
        reviews: [
            { user: "SafeUser", rating: 5, text: "Cleared all my lags. Best utility!" },
            { user: "TechGeek", rating: 2, text: "Warning: Extremely high battery drain and weird ads." },
            { user: "Bot404", rating: 5, text: "Very good antivirus. Very safe." }
        ]
    }
];

const StatusBar = ({ dark = false }) => (
    <div className={`flex justify-between items-center px-8 py-3 w-full absolute top-0 z-[100] ${dark ? 'text-white' : 'text-slate-900'}`}>
        <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold">10:42</span>
            <span className="text-[10px] font-medium opacity-70">AM</span>
        </div>
        <div className="flex gap-1.5 items-center">
            <div className="flex items-center gap-0.5">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M2 22h20V2z" />
                </svg>
            </div>
            <div className="w-6 h-3 border border-current rounded-sm flex items-center p-0.5 relative">
                <div className="bg-current h-full w-[85%] rounded-sm"></div>
                <div className="absolute -right-1.5 w-1 h-1.5 bg-current rounded-r-sm"></div>
            </div>
        </div>
    </div>
);

const AppArmor = ({ onBack }) => {
    const [gameState, setGameState] = useState('intro');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('about'); // 'about', 'permissions', 'reviews'
    const [feedback, setFeedback] = useState(null); // { status: 'correct' | 'wrong' }
    const [expandedResult, setExpandedResult] = useState(null);
    const [elapsed, setElapsed] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
        if (gameState === 'playing') {
            timerRef.current = setInterval(() => {
                setElapsed(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [gameState]);

    const currentApp = APPS[currentIndex];

    const handleDecision = (decision) => {
        if (feedback) return;

        const isCorrect = (decision === 'install' && !currentApp.isMalicious) ||
            (decision === 'avoid' && currentApp.isMalicious);

        if (isCorrect) {
            setScore(prev => prev + (decision === 'avoid' ? 1000 : 500));
        } else {
            setLives(prev => Math.max(0, prev - 1));
        }

        setFeedback({ status: isCorrect ? 'correct' : 'wrong' });

        // Store detailed metadata in history for the results screen
        setHistory(prev => [...prev, {
            app: currentApp,
            decision,
            isCorrect
        }]);

        // Reduced delay to 1.2s for faster flow
        setTimeout(() => {
            setFeedback(null);
            setActiveTab('about');
            if (currentIndex < APPS.length - 1 && lives > 0) {
                setCurrentIndex(prev => prev + 1);
            } else {
                setGameState('result');
            }
        }, 1200);
    };

    const renderIntro = () => (
        <div className="flex flex-col items-center justify-center p-12 text-center max-w-2xl animate-fade-in h-[75vh]">
            <div className="w-24 h-24 bg-cyan-500/10 rounded-full flex items-center justify-center mb-8 border border-cyan-500/20 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                <span className="text-5xl">🛡️</span>
            </div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-6 underline decoration-cyan-500 underline-offset-8">App Armor</h2>
            <p className="text-slate-400 leading-relaxed mb-10 text-lg font-mono">
                [ ANALYSIS_REQUIRED ]
                <br /><br />
                The Play Store sector is infested with data-stealing clones.
                Your task is to scan the metadata, permissions, and user validation reports.
                <br /><br />
                <span className="text-emerald-400 font-bold uppercase tracking-widest">[ INSTALL ]</span> or <span className="text-red-400 font-bold uppercase tracking-widest">[ AVOID ]</span>.
            </p>
            <div className="flex gap-4">
                <button onClick={onBack} className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all uppercase tracking-widest text-xs border border-slate-700">
                    Abort
                </button>
                <button onClick={() => setGameState('playing')} className="px-12 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-lg shadow-[0_0_20px_rgba(8,145,178,0.3)] transition-all uppercase tracking-widest text-sm border border-cyan-400">
                    Initialize Scan
                </button>
            </div>
        </div>
    );

    const renderPlaying = () => (
        <div className="w-full flex items-center justify-center animate-fade-in relative py-4 h-full">

            {/* Phone Container */}
            <div className="w-[380px] h-[780px] bg-zinc-900 border-x-[12px] border-t-[12px] border-b-[24px] border-black rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] relative overflow-hidden flex flex-col pointer-events-auto">
                <StatusBar />

                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-zinc-800 rounded-b-2xl z-[150] flex items-center justify-center">
                    <div className="w-12 h-1 bg-zinc-900 rounded-full opacity-40"></div>
                </div>

                <div className="w-full h-full bg-white overflow-hidden flex flex-col relative pt-12">
                    {/* App Listing Details */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar-light p-6 font-sans">
                        <div className="flex gap-5 mb-8">
                            <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center text-5xl shadow-inner border border-gray-100 flex-shrink-0">
                                {currentApp.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-[22px] font-bold text-gray-900 leading-tight mb-0.5 truncate">{currentApp.name}</h3>
                                <p className="text-emerald-600 font-bold text-[14px] mb-4 truncate">{currentApp.developer}</p>
                                <div className="flex items-center justify-between text-center max-w-[220px]">
                                    <div>
                                        <p className="text-gray-900 font-black text-[15px] flex items-center justify-center gap-0.5">
                                            {currentApp.rating} <span>★</span>
                                        </p>
                                        <p className="text-gray-500 text-[10px] font-medium">{currentApp.ratingCount}</p>
                                    </div>
                                    <div className="w-px h-6 bg-gray-200" />
                                    <div>
                                        <p className="text-gray-900 font-black text-[15px]">{currentApp.downloads}</p>
                                        <p className="text-gray-500 text-[10px] font-medium">Downloads</p>
                                    </div>
                                    <div className="w-px h-6 bg-gray-200" />
                                    <div>
                                        <p className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[10px] font-black inline-block">E</p>
                                        <p className="text-gray-500 text-[10px] font-medium mt-0.5">Everyone</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-8 border-b border-gray-100 mb-6 font-sans">
                            {['about', 'permissions', 'reviews'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`pb-3 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-emerald-700' : 'text-gray-400'
                                        }`}
                                >
                                    {tab}
                                    {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="min-h-[200px] pb-12 font-sans">
                            {activeTab === 'about' && (
                                <div className="animate-fade-in">
                                    <p className="text-gray-600 text-[14px] leading-relaxed mb-6 font-medium">{currentApp.description}</p>
                                    <div className="flex gap-2">
                                        <span className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-[11px] font-bold border border-gray-200/50">#{currentApp.category}</span>
                                        <span className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-[11px] font-bold border border-emerald-100">Editor's Choice</span>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'permissions' && (
                                <div className="animate-fade-in space-y-4">
                                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-2">Capabilities Request</p>
                                    {currentApp.permissions.map((p, i) => (
                                        <div key={i} className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${p.status === 'danger' ? 'bg-red-50 border-red-200 shadow-sm' : 'bg-gray-50 border-gray-100'
                                            }`}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm ${p.status === 'danger' ? 'bg-red-500 text-white' : 'bg-gray-400 text-white'
                                                }`}>
                                                {p.status === 'danger' ? '⚠️' : '✓'}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-black text-[13px] ${p.status === 'danger' ? 'text-red-700' : 'text-gray-800'}`}>{p.name}</p>
                                                <p className="text-[11px] text-gray-500 font-medium">{p.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="animate-fade-in space-y-4">
                                    <div className="flex items-baseline gap-2 mb-4">
                                        <span className="text-4xl font-black text-gray-900">{currentApp.rating}</span>
                                        <span className="text-gray-400 font-bold text-sm">/ 5.0</span>
                                    </div>
                                    {currentApp.reviews.map((r, i) => (
                                        <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm font-sans">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[12px] font-black text-gray-800">{r.user}</span>
                                                <span className="text-amber-400 text-[10px] tracking-tight">{'★'.repeat(r.rating)}</span>
                                            </div>
                                            <p className="text-[13px] text-gray-600 font-medium leading-relaxed italic">"{r.text}"</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="p-6 bg-white border-t border-gray-100 flex gap-4 pt-4 shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                        <button
                            onClick={() => handleDecision('avoid')}
                            disabled={!!feedback}
                            className="flex-1 bg-white border-2 border-red-500 text-red-600 font-black py-4 rounded-2xl hover:bg-red-50 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale uppercase tracking-widest text-xs shadow-sm"
                        >
                            AVOID
                        </button>
                        <button
                            onClick={() => handleDecision('install')}
                            disabled={!!feedback}
                            className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-[0_10px_20px_rgba(16,185,129,0.3)] active:scale-95 disabled:opacity-30 disabled:grayscale uppercase tracking-widest text-xs"
                        >
                            INSTALL
                        </button>
                    </div>

                    {/* Simple Mid-game Feedback Overlay */}
                    {feedback && (
                        <div className={`absolute inset-0 z-[200] flex items-center justify-center backdrop-blur-md animate-fade-in`}>
                            <div className={`p-10 rounded-full w-48 h-48 flex flex-col items-center justify-center shadow-2xl border-4 ${feedback.status === 'correct' ? 'bg-emerald-600 border-emerald-400' : 'bg-red-600 border-red-400'
                                }`}>
                                <div className="text-6xl mb-2">
                                    {feedback.status === 'correct' ? '✅' : '❌'}
                                </div>
                                <span className="text-white font-black uppercase tracking-widest text-sm">
                                    {feedback.status === 'correct' ? 'CORRECT' : 'WRONG'}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar Stats */}
            <div className="ml-12 w-80 flex flex-col gap-6 font-mono pointer-events-auto">
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl relative">
                    <span className="text-[10px] text-cyan-500 font-black uppercase tracking-[0.3em] block mb-2">Agent Progress</span>
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <div className="flex gap-2">
                                {[...Array(3)].map((_, i) => (
                                    <span key={i} className={`text-xl transition-all ${i < lives ? 'opacity-100' : 'opacity-20 grayscale'}`}>❤️</span>
                                ))}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-black text-white">{currentIndex + 1}<span className="text-slate-700 text-lg">/{APPS.length}</span></p>
                        </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 transition-all duration-700"
                            style={{ width: `${((currentIndex + 1) / APPS.length) * 100}%` }} />
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl text-center">
                    <span className="text-[10px] text-cyan-500/50 uppercase tracking-[0.3em] block mb-2 font-black">Score</span>
                    <div className="text-5xl font-black text-cyan-400 tracking-tighter">{score.toLocaleString()}</div>
                </div>

                <div className="bg-indigo-950/20 border border-indigo-500/20 p-8 rounded-3xl border-dashed">
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic">
                        The full forensic breakdown will be available in the session report after all evaluations are complete.
                    </p>
                </div>
            </div>
        </div>
    );

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const renderResult = () => {
        const correctCount = history.filter(h => h.isCorrect).length;
        const accuracy = Math.round((correctCount / APPS.length) * 100);

        const getGrade = () => {
            if (accuracy >= 100) return { grade: 'S', color: '#10b981', label: 'ARMOR ELITE' };
            if (accuracy >= 80) return { grade: 'A', color: '#3b82f6', label: 'GUARDIAN' };
            if (accuracy >= 60) return { grade: 'B', color: '#6366f1', label: 'DEFENDER' };
            if (accuracy >= 40) return { grade: 'C', color: '#f59e0b', label: 'RECRUIT' };
            return { grade: 'F', color: '#ef4444', label: 'COMPROMISED' };
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
                    <p className="text-slate-500 font-mono text-xs mt-2 uppercase tracking-widest">Audit Complete — Security Evaluation Report</p>
                </div>

                <div className="grid grid-cols-4 gap-4 w-full max-w-2xl mb-10">
                    {[
                        { label: 'Score', value: score.toLocaleString(), color: 'text-cyan-400' },
                        { label: 'Accuracy', value: `${accuracy}%`, color: accuracy >= 70 ? 'text-emerald-400' : 'text-red-400' },
                        { label: 'Time', value: formatTime(elapsed), color: 'text-amber-400' },
                        { label: 'Lives Left', value: lives, color: lives > 0 ? 'text-indigo-400' : 'text-rose-400' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                            <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest block mb-1">{stat.label}</span>
                            <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                        </div>
                    ))}
                </div>

                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 self-start">Audit History</h3>
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
                                    {item.app.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-bold text-white truncate">{item.app.name}</span>
                                        <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded ${item.app.isMalicious ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                            {item.app.isMalicious ? 'THREAT' : 'SAFE'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-500 truncate block font-mono">Action: {item.decision.toUpperCase()}</span>
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
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Forensic Logic</span>
                                    {item.app.isMalicious ? (
                                        <ul className="space-y-1 mt-2">
                                            {item.app.redFlags.map((flag, fi) => (
                                                <li key={fi} className="text-xs text-slate-400 flex items-start gap-2">
                                                    <span className="text-red-500">•</span>
                                                    <span>{flag}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">Verified developer and standard permission set.</p>
                                    )}
                                    <div className="text-[10px] text-slate-600 mt-2 font-mono">
                                        Developer: <span className="text-slate-400">{item.app.developer}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button onClick={() => {
                        setGameState('intro');
                        setCurrentIndex(0);
                        setScore(0);
                        setLives(3);
                        setHistory([]);
                        setElapsed(0);
                        setExpandedResult(null);
                    }} className="px-12 py-4 bg-emerald-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all hover:text-emerald-600 shadow-lg text-sm">
                        RETRY AUDIT
                    </button>
                    <button onClick={onBack} className="px-8 py-4 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all font-bold text-sm">
                        BACK TO LAB
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex items-center justify-center font-sans overflow-hidden">
            <style>{`
                .custom-scrollbar-light::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar-light::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                
                .custom-scrollbar-cyber::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar-cyber::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
                .custom-scrollbar-cyber::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; border: 1px solid #334155; }
                
                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
            {gameState === 'intro' && renderIntro()}
            {gameState === 'playing' && renderPlaying()}
            {gameState === 'result' && renderResult()}
        </div>
    );
};

export default AppArmor;
