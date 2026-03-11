import React, { useState, useEffect, useCallback, useRef } from 'react';

const URLS = [
    {
        id: 1,
        fullUrl: "https://secure-login.paypaI.com/auth",
        displayUrl: "paypaI.com/auth",
        isPhish: true,
        brand: "PayPal",
        traps: [5], // index 5 is 'I'
        explanation: "Homograph attack: Uses uppercase 'I' instead of lowercase 'l'.",
        difficulty: "easy"
    },
    {
        id: 2,
        fullUrl: "https://www.amazon.co.jp/orders",
        displayUrl: "amazon.co.jp/orders",
        isPhish: false,
        brand: "Amazon",
        traps: [],
        explanation: "Legitimate Japanese Amazon domain.",
        difficulty: "easy"
    },
    {
        id: 3,
        fullUrl: "https://bank-of-india.secure-verify.net/login",
        displayUrl: "bank-of-india.secure-verify.net",
        isPhish: true,
        brand: "Bank of India",
        traps: [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25], // secure-verify.net
        explanation: "Subdomain trick: The real domain is 'secure-verify.net', not 'bank-of-india'.",
        difficulty: "medium"
    },
    {
        id: 4,
        fullUrl: "https://accounts.google.com/ServiceLogin",
        displayUrl: "accounts.google.com",
        isPhish: false,
        brand: "Google",
        traps: [],
        explanation: "Official Google accounts login page.",
        difficulty: "easy"
    },
    {
        id: 5,
        fullUrl: "https://faceboook.com/login",
        displayUrl: "faceboook.com/login",
        isPhish: true,
        brand: "Facebook",
        traps: [7], // extra 'o'
        explanation: "Typosquatting: 'facebook' is spelled with an extra 'o'.",
        difficulty: "easy"
    },
    {
        id: 6,
        fullUrl: "https://microsoft-support-global-help.com",
        displayUrl: "microsoft-support-global-help.com",
        isPhish: true,
        brand: "Microsoft",
        traps: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
        explanation: "Generic hyphenated domain name not associated with official Microsoft web properties.",
        difficulty: "medium"
    },
    {
        id: 7,
        fullUrl: "https://www.netflix.com/browse",
        displayUrl: "netflix.com/browse",
        isPhish: false,
        brand: "Netflix",
        traps: [],
        explanation: "Official Netflix browsing page.",
        difficulty: "easy"
    },
    {
        id: 8,
        fullUrl: "https://apple-id.verification-panel.me",
        displayUrl: "apple-id.verification-panel.me",
        isPhish: true,
        brand: "Apple",
        traps: [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27],
        explanation: "Suspicious TLD (.me) and unofficial domain structure.",
        difficulty: "medium"
    },
    {
        id: 9,
        fullUrl: "https://xn--pypal-4ve.com/secure",
        displayUrl: "xn--pypal-4ve.com",
        isPhish: true,
        brand: "PayPal",
        traps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        explanation: "Punycode attack: This resolves to 'pàyal.com', used to trick users into thinking it's the real PayPal.",
        difficulty: "hard"
    },
    {
        id: 10,
        fullUrl: "https://login.microsoftonline.com/",
        displayUrl: "login.microsoftonline.com",
        isPhish: false,
        brand: "Microsoft",
        traps: [],
        explanation: "Official Microsoft login portal.",
        difficulty: "medium"
    }
];

const URLAssassin = ({ onBack }) => {
    const [gameState, setGameState] = useState('intro');
    const [shuffledUrls, setShuffledUrls] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [feedback, setFeedback] = useState(null);
    const [history, setHistory] = useState([]);
    const [expandedResult, setExpandedResult] = useState(null);
    const timerRef = useRef(null);

    // Shuffle URLs on start
    const startGame = () => {
        const shuffled = [...URLS].sort(() => Math.random() - 0.5);
        setShuffledUrls(shuffled);
        setGameState('playing');
        setElapsed(0);
        setExpandedResult(null);
        timerRef.current = setInterval(() => {
            setElapsed(prev => prev + 1);
        }, 1000);
    };

    const handleVerdict = useCallback((isPhishChoice, trapIndex = null) => {
        if (feedback) return;

        const currentUrl = shuffledUrls[currentIndex];

        let correct = false;
        if (currentUrl.isPhish) {
            // If they said it's a phish AND clicked a valid trap index
            if (isPhishChoice && trapIndex !== null && currentUrl.traps.includes(trapIndex)) {
                correct = true;
            }
        } else {
            // For legit URLs, they just need to click the "Safe" button (isPhishChoice = false)
            if (!isPhishChoice) {
                correct = true;
            }
        }

        if (correct) {
            const comboMultiplier = combo + 1;
            const difficultyBonus = currentUrl.difficulty === 'hard' ? 3 : currentUrl.difficulty === 'medium' ? 2 : 1;
            setScore(prev => prev + (150 * comboMultiplier * difficultyBonus));
            setCombo(prev => {
                const next = prev + 1;
                setMaxCombo(mc => Math.max(mc, next));
                return next;
            });
            setFeedback({ status: 'correct', clickedIndex: trapIndex });
        } else {
            setCombo(0);
            setFeedback({ status: 'wrong', clickedIndex: trapIndex });
        }

        setHistory(prev => [...prev, { ...currentUrl, userCorrect: correct, clickedIndex: trapIndex }]);

        setTimeout(() => {
            setFeedback(null);
            if (currentIndex < shuffledUrls.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                clearInterval(timerRef.current);
                setGameState('result');
            }
        }, 1500);
    }, [currentIndex, combo, feedback, shuffledUrls]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const renderIntro = () => (
        <div className="flex flex-col items-center justify-center p-12 text-center max-w-2xl animate-fade-in h-[70vh]">
            <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center mb-8 border border-red-400/40 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                <span className="text-5xl">🎯</span>
            </div>
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-6">URL Assassin</h2>
            <p className="text-slate-500 leading-relaxed mb-10 text-lg">
                Identify malicious patterns in the browser's address bar.
                <br /><br />
                - If the URL is <span className="text-red-400 font-bold uppercase">Phishing</span>, click the suspicious character or part.
                <br />
                - If the URL is <span className="text-emerald-400 font-bold uppercase">Safe</span>, click the <span className="text-emerald-400">[MARK SECURE]</span> button.
            </p>
            <div className="flex gap-4">
                <button
                    onClick={onBack}
                    className="px-8 py-3 bg-slate-600 hover:bg-slate-700 text-slate-900 font-bold rounded-lg transition-all uppercase tracking-widest text-xs"
                >
                    Cancel
                </button>
                <button
                    onClick={startGame}
                    className="px-12 py-3 bg-red-600 hover:bg-red-500 text-slate-900 font-bold rounded-lg shadow-lg shadow-red-900/20 transition-all uppercase tracking-widest text-sm"
                >
                    Start Training
                </button>
            </div>
        </div>
    );

    const renderPlaying = () => {
        const urlObj = shuffledUrls[currentIndex];
        const chars = urlObj.displayUrl.split('');

        return (
            <div className="w-full flex flex-col items-center animate-fade-in relative pt-12">
                {/* Stats Header */}
                <div className="flex items-center gap-12 mb-16 bg-white/90 backdrop-blur-md border border-blue-200/60 px-8 py-4 rounded-2xl">
                    <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Target</span>
                        <span className="text-xl font-bold text-slate-900">{currentIndex + 1} <span className="text-slate-400">/ {shuffledUrls.length}</span></span>
                    </div>
                    <div className="w-px h-8 bg-slate-200" />
                    <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Score</span>
                        <span className="text-xl font-bold text-cyan-400 tracking-tight">{score.toLocaleString()}</span>
                    </div>
                    <div className="w-px h-8 bg-slate-200" />
                    <div>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">Combo</span>
                        <span className="text-xl font-black text-amber-400 uppercase tracking-wider">×{combo}</span>
                    </div>
                </div>

                {/* Laptop Browser Interface */}
                <div className="w-full max-w-4xl bg-[#e8ebee] rounded-xl overflow-hidden shadow-2xl border-4 border-[#ced4da]">
                    {/* Browser Chrome */}
                    <div className="bg-[#f1f3f4] px-4 py-2 flex items-center gap-4 border-b border-[#ced4da]">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                        </div>
                        <div className="flex gap-3 text-slate-500 ml-4 font-bold">
                            <span className="cursor-not-allowed">◀</span>
                            <span className="cursor-not-allowed">▶</span>
                            <span className="cursor-default">↻</span>
                        </div>
                        {/* Address Bar */}
                        <div className="flex-1 bg-white h-14 rounded-full px-6 flex items-center gap-4 border shadow-inner">
                            <span className="text-emerald-500 text-lg">🔒</span>
                            <div className="flex-1 flex overflow-hidden font-sans text-[22px] text-slate-500 tracking-tight lg:tracking-normal select-none">
                                {chars.map((char, idx) => (
                                    <span
                                        key={idx}
                                        onClick={() => handleVerdict(true, idx)}
                                        className={`transition-all inline-block min-w-[12px] text-center px-[1px] ${feedback ? 'cursor-default' : 'cursor-crosshair hover:bg-red-500/30 hover:text-red-800 rounded-md'}`}
                                        style={{
                                            backgroundColor: feedback?.clickedIndex === idx
                                                ? (feedback.status === 'correct' ? '#10b98166' : '#ef444466')
                                                : (feedback && urlObj.traps.includes(idx) ? '#10b98133' : 'transparent')
                                        }}
                                    >
                                        {char}
                                    </span>
                                ))}
                            </div>
                            <span className="text-slate-400 text-sm">☆</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-xs font-bold text-slate-900 uppercase">User</div>
                    </div>

                    {/* Page Content Placeholder */}
                    <div className="h-[280px] bg-white flex flex-col items-center justify-center p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl mb-6 shadow-sm flex items-center justify-center text-slate-900 text-3xl font-bold" style={{ backgroundColor: urlObj.isPhish ? '#cbd5e1' : '#10b981' }}>
                            {urlObj.brand[0]}
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">{urlObj.brand} Authentication</h3>
                        <p className="text-slate-500 text-sm max-w-sm">Secure login portal for {urlObj.brand} global users. System state: <span className="text-emerald-500 font-bold uppercase tracking-widest text-[10px]">Verification_Required</span></p>

                        {/* Feedback Overlay Message */}
                        {feedback && (
                            <div className={`mt-6 font-bold uppercase tracking-[0.2em] text-sm py-2 px-6 rounded-lg ${feedback.status === 'correct' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-gradient-to-br from-red-400 to-rose-500 text-red-500'}`}>
                                {feedback.status === 'correct' ? 'TARGET NEUTRALIZED' : 'ASSASSINATION FAILED'}
                            </div>
                        )}

                        {feedback && (
                            <div className="mt-4 text-xs text-slate-500 font-medium px-8 italic">
                                {urlObj.explanation}
                            </div>
                        )}
                    </div>
                </div>

                {/* Verdict Controls (Only when not clicking a character for phish) */}
                <div className="mt-12 flex gap-6">
                    <button
                        onClick={() => handleVerdict(false)}
                        disabled={!!feedback}
                        className={`group flex items-center gap-4 px-12 py-6 rounded-2xl border-2 transition-all font-black uppercase tracking-[0.2em] text-base overflow-hidden relative ${!!feedback ? 'opacity-30 grayscale cursor-not-allowed' : 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/15 hover:border-emerald-500 shadow-xl shadow-emerald-500/10'
                            }`}
                    >
                        <span className="relative z-10">Mark as Secure</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>

                {/* Task hint */}
                <div className="mt-12 text-slate-500 text-center font-mono text-[10px] uppercase tracking-widest max-w-md bg-blue-50/80 p-3 rounded-lg border border-blue-200/40">
                    Click the <span className="text-red-400 font-bold">suspicious character</span> in the URL bar if you suspect a PHISH. <br />If the URL is authentic, click <span className="text-emerald-400 font-bold">MARK AS SECURE</span>.
                </div>
            </div>
        );
    };

    const renderResult = () => {
        const correctCount = history.filter(h => h.userCorrect).length;
        const accuracy = Math.round((correctCount / shuffledUrls.length) * 100);

        const getGrade = () => {
            if (accuracy >= 100) return { grade: 'S', color: '#ef4444', label: 'ELITE ASSASSIN' };
            if (accuracy >= 80) return { grade: 'A', color: '#f97316', label: 'SHARPSHOOTER' };
            if (accuracy >= 60) return { grade: 'B', color: '#eab308', label: 'OPERATIVE' };
            if (accuracy >= 40) return { grade: 'C', color: '#8b5cf6', label: 'RECRUIT' };
            return { grade: 'F', color: '#64748b', label: 'NEUTRALIZED' };
        };

        const resultGrade = getGrade();

        return (
            <div className="w-full max-w-5xl px-6 py-8 flex flex-col items-center animate-fade-in overflow-y-auto" style={{ maxHeight: '92vh' }}>
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 mb-4 shadow-lg"
                        style={{ borderColor: resultGrade.color, boxShadow: `0 0 50px ${resultGrade.color}33` }}>
                        <span className="text-5xl font-black" style={{ color: resultGrade.color }}>{resultGrade.grade}</span>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tighter">{resultGrade.label}</h2>
                    <p className="text-slate-500 font-mono text-xs mt-2 uppercase tracking-widest">Training Complete — Target Engagement Report</p>
                </div>

                <div className="grid grid-cols-4 gap-4 w-full max-w-2xl mb-10">
                    {[
                        { label: 'Score', value: score.toLocaleString(), color: 'text-red-400' },
                        { label: 'Accuracy', value: `${accuracy}%`, color: accuracy >= 70 ? 'text-emerald-400' : 'text-red-400' },
                        { label: 'Time Taken', value: formatTime(elapsed), color: 'text-amber-400' },
                        { label: 'Max Combo', value: `×${maxCombo}`, color: 'text-indigo-400' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-gradient-to-br from-slate-50 to-blue-50 border border-blue-200/50 rounded-xl p-4 text-center shadow-sm">
                            <span className="text-[9px] text-slate-400 uppercase font-black tracking-widest block mb-1">{stat.label}</span>
                            <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                        </div>
                    ))}
                </div>

                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 self-start">Kill Ledger</h3>
                <div className="w-full space-y-3 mb-10">
                    {history.map((item, idx) => (
                        <div
                            key={idx}
                            className={`rounded-xl border overflow-hidden transition-all cursor-pointer ${item.userCorrect
                                ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                                : 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                                }`}
                            onClick={() => setExpandedResult(expandedResult === idx ? null : idx)}
                        >
                            <div className="flex items-center gap-4 px-5 py-4">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-200 text-slate-900 text-xs font-black shrink-0">
                                    {item.brand[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-bold text-slate-900 truncate">{item.brand} Engagement</span>
                                        <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded ${item.isPhish ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                            {item.isPhish ? 'PHISH' : 'LEGIT'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-500 truncate block font-mono">{item.displayUrl}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`text-sm font-bold ${item.userCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {item.userCorrect ? '✓' : '✗'}
                                    </span>
                                    <span className="text-slate-400 text-xs">{expandedResult === idx ? '▲' : '▼'}</span>
                                </div>
                            </div>

                            {expandedResult === idx && (
                                <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 space-y-2 animate-fade-in">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Ballistics Report</span>
                                    <p className="text-xs text-slate-500 leading-relaxed italic border-l-2 border-red-500 pl-4 py-1">
                                        "{item.explanation}"
                                    </p>
                                    <div className="flex items-start gap-2 text-xs text-red-400/80 mt-3 font-mono">
                                        <span className="text-red-500 font-bold">Full URL:</span>
                                        <span className="break-all">{item.fullUrl}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button onClick={startGame} className="px-12 py-4 bg-red-600 text-slate-900 font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all hover:text-red-600 shadow-lg text-sm">
                        RE-RUN SIM
                    </button>
                    <button onClick={onBack} className="px-8 py-4 bg-slate-600 hover:bg-slate-700 rounded-xl text-white transition-all font-bold text-sm shadow-md">
                        BACK TO LAB
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex items-center justify-center font-mono overflow-hidden">
            {gameState === 'intro' && renderIntro()}
            {gameState === 'playing' && renderPlaying()}
            {gameState === 'result' && renderResult()}
        </div>
    );
};

export default URLAssassin;
