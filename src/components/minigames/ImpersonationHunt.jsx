import React, { useState, useEffect, useCallback, useRef } from 'react';

const PROFILES = [
    {
        id: 1,
        username: "apple",
        displayName: "Apple",
        isVerified: true,
        followers: "32.4M",
        following: "0",
        posts: "1,042",
        bio: "Everyone has a story to tell. Tag #ShotOniPhone for a chance to be featured. \napple.com",
        isFake: false,
        explanation: "This is the official Apple account with a legacy verification badge and millions of followers.",
        brandColor: "#000000",
        pfpText: ""
    },
    {
        id: 2,
        username: "apple_support_official_usa",
        displayName: "Apple Support (Official)",
        isVerified: false,
        followers: "1,240",
        following: "450",
        posts: "12",
        bio: "Providing official Apple Support to all customers in the US. DM for device recovery. 🍎 \nbit.ly/apple-secure-fix",
        isFake: true,
        explanation: "Fake account: Apple does not provide support via DM. The bit.ly link and low follower count are red flags.",
        brandColor: "#555555",
        pfpText: "🍎"
    },
    {
        id: 3,
        username: "cristiano",
        displayName: "Cristiano Ronaldo",
        isVerified: true,
        followers: "624M",
        following: "560",
        posts: "3,650",
        bio: "Professional Footballer. Al Nassr FC. Portugal. 🇵🇹 \nwww.cr7.com",
        isFake: false,
        explanation: "Authentic account of the world's most followed person. Verified and massive following.",
        brandColor: "#EAB308",
        pfpText: "CR7"
    },
    {
        id: 4,
        username: "cristiano_ronald0__official",
        displayName: "Cristiano Ronaldo (Official)",
        isVerified: false,
        followers: "24.5K",
        following: "1,200",
        posts: "45",
        bio: "Special Giveaway! Win signed jerseys and $10k. Click the link below to participate 👇 \ncr7-giveaway.net/claim",
        isFake: true,
        explanation: "Impersonator: Check the username carefully ('ronald0'). Offering cash/signed items via a suspicious link.",
        brandColor: "#991B1B",
        pfpText: "CR"
    },
    {
        id: 5,
        username: "nike",
        displayName: "Nike",
        isVerified: true,
        followers: "306M",
        following: "148",
        posts: "1,025",
        bio: "Spotlight on athletes, teams, and products that move the world forward. \nnike.com",
        isFake: false,
        explanation: "Official Nike account. Verified with massive following.",
        brandColor: "#000000",
        pfpText: "✔️"
    },
    {
        id: 6,
        username: "nike_drops_sale",
        displayName: "Nike Drops & Sales",
        isVerified: false,
        followers: "4,500",
        following: "2,000",
        posts: "8",
        bio: "Exclusive 90% OFF clearance sale for the next 24 hours. Get your Jordans now! 🔥 \nshop-nike-deals.store",
        isFake: true,
        explanation: "Scam account: Using high-pressure sales tactics ('24 hours') and a non-official '.store' domain.",
        brandColor: "#ef4444",
        pfpText: "👟"
    },
    {
        id: 7,
        username: "bankofamerica",
        displayName: "Bank of America",
        isVerified: true,
        followers: "640K",
        following: "125",
        posts: "850",
        bio: "Helping make financial lives better. \nbankofamerica.com",
        isFake: false,
        explanation: "Authentic Bank of America account. Verified and consistent branding.",
        brandColor: "#0038A8",
        pfpText: "BA"
    },
    {
        id: 8,
        username: "bank_of_america_verify",
        displayName: "BofA Security Center",
        isVerified: false,
        followers: "840",
        following: "12",
        posts: "3",
        bio: "Fraud alert detected on your account. Please log in to our secure portal to verify your identity. \nbofa-resolution.info/auth",
        isFake: true,
        explanation: "Phishing account: Banks will never ask you to 'verify your identity' via a suspicious link in an Instagram bio.",
        brandColor: "#dc2626",
        pfpText: "⚠️"
    }
];

const ImpersonationHunt = ({ onBack }) => {
    const [gameState, setGameState] = useState('intro');
    const [shuffledProfiles, setShuffledProfiles] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [feedback, setFeedback] = useState(null);
    const [history, setHistory] = useState([]);
    const [expandedResult, setExpandedResult] = useState(null);
    const timerRef = useRef(null);

    const handleVerdict = useCallback((isFakeChoice) => {
        if (feedback) return;

        const currentProfile = shuffledProfiles[currentIndex];
        const correct = isFakeChoice === currentProfile.isFake;

        if (correct) {
            const comboMultiplier = combo + 1;
            setScore(prev => prev + (200 * comboMultiplier));
            setCombo(prev => {
                const next = prev + 1;
                setMaxCombo(mc => Math.max(mc, next));
                return next;
            });
            setFeedback('correct');
        } else {
            setCombo(0);
            setFeedback('wrong');
        }

        setHistory(prev => [...prev, { ...currentProfile, userCorrect: correct, userChoice: isFakeChoice }]);

        setTimeout(() => {
            setFeedback(null);
            if (currentIndex < shuffledProfiles.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                clearInterval(timerRef.current);
                setGameState('result');
            }
        }, 2000);
    }, [currentIndex, combo, feedback, shuffledProfiles]);

    const startGame = () => {
        const shuffled = [...PROFILES].sort(() => Math.random() - 0.5);
        setShuffledProfiles(shuffled);
        setGameState('playing');
        setElapsed(0);
        setExpandedResult(null);
        timerRef.current = setInterval(() => {
            setElapsed(prev => prev + 1);
        }, 1000);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const renderIntro = () => (
        <div className="flex flex-col items-center justify-center p-12 text-center max-w-2xl animate-fade-in h-[75vh]">
            <div className="w-24 h-24 bg-purple-500/10 rounded-3xl flex items-center justify-center mb-8 border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                <span className="text-5xl">🕵️</span>
            </div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-6">Impersonation Hunt</h2>
            <p className="text-slate-400 leading-relaxed mb-10 text-lg">
                The social sphere is full of shadows. Analyze the Instagram profiles presented.
                <br /><br />
                Use the buttons to classify:
                <br />
                <span className="text-emerald-400 font-bold uppercase">Left</span> for Authentic | <span className="text-purple-400 font-bold uppercase">Right</span> for Impersonator
            </p>
            <div className="flex gap-4">
                <button
                    onClick={onBack}
                    className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all uppercase tracking-widest text-xs"
                >
                    Return
                </button>
                <button
                    onClick={startGame}
                    className="px-12 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-lg shadow-lg shadow-purple-900/20 transition-all uppercase tracking-widest text-sm"
                >
                    Start Investigation
                </button>
            </div>
        </div>
    );

    const renderPlaying = () => {
        const profile = shuffledProfiles[currentIndex];

        return (
            <div className="w-full h-full flex items-center justify-center px-4 select-none outline-none">
                {/* Left Button */}
                <div className="hidden lg:flex flex-col items-center gap-6 pr-12 animate-slide-in-left">
                    <button
                        onClick={() => handleVerdict(false)}
                        disabled={!!feedback}
                        className={`group w-40 h-40 rounded-3xl border-4 flex flex-col items-center justify-center transition-all ${!!feedback ? 'opacity-20 grayscale' : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500 hover:scale-105 shadow-lg shadow-emerald-500/10'
                            }`}
                    >
                        <span className="text-4xl mb-2">✅</span>
                        <span className="text-[12px] font-black uppercase tracking-widest">Authenticate</span>
                    </button>
                    <div className="text-emerald-500/40 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                        <span>SECURE ACCESS</span>
                    </div>
                </div>

                {/* Mobile Framework Wrapper */}
                <div className="relative animate-fade-in group">
                    {/* Phone Case/Frame */}
                    <div className="relative w-[360px] h-[720px] bg-[#1a1a1a] rounded-[4rem] p-[10px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9),inset_0_0_20px_rgba(255,255,255,0.05)] border-[1px] border-white/10 overflow-hidden ring-1 ring-white/5">
                        {/* Side Buttons (CSS Art) */}
                        <div className="absolute top-32 -left-[2px] w-[3px] h-10 bg-gradient-to-b from-slate-700 to-slate-900 rounded-r-sm border-r border-white/10" />
                        <div className="absolute top-48 -left-[2px] w-[3px] h-16 bg-gradient-to-b from-slate-700 to-slate-900 rounded-r-sm border-r border-white/10" />
                        <div className="absolute top-72 -left-[2px] w-[3px] h-16 bg-gradient-to-b from-slate-700 to-slate-900 rounded-r-sm border-r border-white/10" />
                        <div className="absolute top-60 -right-[2px] w-[3px] h-24 bg-gradient-to-b from-slate-700 to-slate-900 rounded-l-sm border-l border-white/10" />

                        {/* Inner Screen Border */}
                        <div className="w-full h-full bg-black rounded-[3.2rem] overflow-hidden relative border-[4px] border-[#0a0a0a]">
                            {/* Status Bar */}
                            <div className="absolute top-0 left-0 right-0 h-12 px-10 flex items-center justify-between text-[11px] font-bold z-[60] mix-blend-difference">
                                <span className="text-white/90">{new Date().getHours()}:{new Date().getMinutes().toString().padStart(2, '0')}</span>
                                <div className="flex gap-2 items-center text-white/90">
                                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 21l-12-18h24z" /></svg>
                                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M2.5 7h19v10h-19z M21.5 10h1v4h-1z" /></svg>
                                </div>
                            </div>

                            {/* Dynamic Island / Notch */}
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full z-[70] shadow-inner border border-white/5 flex items-center justify-end px-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#1c1c1e] border border-blue-500/10 shadow-[inset_0_0_2px_rgba(0,0,0,1)]" />
                            </div>

                            {/* App Body */}
                            <div className="h-full pt-12 flex flex-col bg-black">
                                {/* IG Header */}
                                <div className="flex items-center justify-between px-4 h-14 border-b border-white/[0.08]">
                                    <div className="flex items-center gap-6">
                                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-white font-bold text-sm tracking-tight">{profile.username}</span>
                                                {profile.isVerified && (
                                                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#0095f6]" fill="currentColor"><path d="M12.001 2.002c-5.522 0-9.999 4.477-9.999 9.999s4.477 9.999 9.999 9.999 9.999-4.477 9.999-9.999-4.477-9.999-9.999-9.999zm4.594 8.197l-5.59 5.59a.807.807 0 01-1.144 0L7.408 13.34c-.314-.314-.314-.827 0-1.141.314-.313.827-.313 1.141 0l2.353 2.353 5.019-5.019c.314-.314.827-.314 1.141 0 .314.314.314.827 0 1.15z" /></svg>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-white/50 font-medium font-sans">Official Account</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                        <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-y-auto scrollbar-hide py-4 px-1">
                                    {/* Profile Summary */}
                                    <div className="px-5 py-6 flex flex-col gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="relative flex-shrink-0">
                                                <div className="w-20 h-20 rounded-full p-[2.5px] bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]">
                                                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden border-[2.5px] border-black">
                                                        <div className="w-full h-full rounded-full flex items-center justify-center text-3xl font-black text-white" style={{ backgroundColor: profile.brandColor }}>
                                                            {profile.pfpText}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-0 right-0 w-6 h-6 bg-[#0095f6] rounded-full border-[3px] border-black flex items-center justify-center text-sm font-bold text-white shadow-lg">
                                                    +
                                                </div>
                                            </div>

                                            <div className="flex-1 flex justify-between text-center px-1">
                                                <div className="flex flex-col items-center">
                                                    <div className="font-black text-[14px] text-white tracking-tight">{profile.posts}</div>
                                                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Posts</div>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <div className="font-black text-[14px] text-white tracking-tight">{profile.followers}</div>
                                                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Followers</div>
                                                </div>
                                                <div className="flex flex-col items-center">
                                                    <div className="font-black text-[14px] text-white tracking-tight">{profile.following}</div>
                                                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Following</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Identity */}
                                        <div className="px-4 mb-6">
                                            <h2 className="font-black text-[13px] text-white leading-tight mb-0.5">{profile.displayName}</h2>
                                            <p className="text-[13px] text-slate-200 leading-snug whitespace-pre-line font-medium mb-3 pr-2">
                                                {profile.bio}
                                            </p>

                                            {/* Action Buttons Realistic */}
                                            <div className="flex gap-2">
                                                <button className="flex-1 bg-white text-black font-black h-8 rounded-lg text-xs hover:bg-slate-200 transition-colors">Follow</button>
                                                <button className="flex-1 bg-white/10 text-white font-black h-8 rounded-lg text-xs hover:bg-white/20 transition-colors">Message</button>
                                                <button className="w-8 bg-white/10 text-white font-black h-8 rounded-lg text-xs flex items-center justify-center hover:bg-white/20 transition-colors">👤</button>
                                            </div>
                                        </div>

                                        {/* Grid View */}
                                        <div className="grid grid-cols-3 gap-[1px] border-t border-white/10 pt-[1px]">
                                            {[...Array(15)].map((_, i) => (
                                                <div key={i} className="aspect-square bg-[#1c1c1e] flex items-center justify-center relative group overflow-hidden">
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                    <span className="text-xl opacity-20 filter grayscale">📸</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom Nav */}
                                <div className="h-14 border-t border-white/[0.08] flex items-center justify-around px-4 bg-black pb-2">
                                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth="2" fill="currentColor"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white/40" stroke="currentColor" strokeWidth="2"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    <div className="w-6 h-6 border-2 border-white/40 rounded-md flex items-center justify-center text-[18px] text-white/40 leading-none pb-0.5">+</div>
                                    <svg viewBox="0 0 24 24" className="w-6 h-6 text-white/40" stroke="currentColor" strokeWidth="2"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <div className="w-6 h-6 rounded-full bg-white/20 border border-white/40" />
                                </div>
                            </div>
                        </div>

                        {/* Result Overlay */}
                        {feedback && (
                            <div className={`absolute inset-[10px] rounded-[3.2rem] flex items-center justify-center z-[110] backdrop-blur-2xl transition-all duration-500 ${feedback === 'correct' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                <div className="text-center p-8 bg-[#0a0a0a]/95 rounded-[3rem] border border-white/10 shadow-3xl transform animate-pop-in max-w-[280px]">
                                    <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl shadow-2xl ${feedback === 'correct' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                        {feedback === 'correct' ? '🛡️' : '🚨'}
                                    </div>
                                    <h3 className={`text-3xl font-black uppercase tracking-tighter mb-4 ${feedback === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {feedback === 'correct' ? 'SECURED' : 'BREACHED'}
                                    </h3>
                                    <div className="w-12 h-1 bg-white/10 mx-auto mb-6 rounded-full" />
                                    <p className="text-[12px] text-white font-medium leading-[1.6] italic">
                                        {profile.explanation}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Button */}
                <div className="hidden lg:flex flex-col items-center gap-6 pl-12 animate-slide-in-right">
                    <button
                        onClick={() => handleVerdict(true)}
                        disabled={!!feedback}
                        className={`group w-40 h-40 rounded-3xl border-4 flex flex-col items-center justify-center transition-all ${!!feedback ? 'opacity-20 grayscale' : 'border-purple-500/30 bg-purple-500/5 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500 hover:scale-105 shadow-lg shadow-purple-500/10'
                            }`}
                    >
                        <span className="text-4xl mb-2">🕵️</span>
                        <span className="text-[12px] font-black uppercase tracking-widest text-center leading-tight">Non-Authenticate</span>
                    </button>
                    <div className="text-purple-500/40 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                        <span>FLAG ENTITY</span>
                    </div>
                </div>

                {/* Mobile Side Controls */}
                <div className="lg:hidden fixed bottom-12 left-0 right-0 flex justify-center gap-4 px-6 pointer-events-none z-[120]">
                    <button onClick={() => handleVerdict(false)} className="pointer-events-auto flex-1 bg-black/95 border-2 border-emerald-500/40 p-5 rounded-2xl text-emerald-400 font-black uppercase tracking-widest text-xs shadow-2xl backdrop-blur-xl">Authenticate</button>
                    <button onClick={() => handleVerdict(true)} className="pointer-events-auto flex-1 bg-black/95 border-2 border-purple-500/40 p-5 rounded-2xl text-purple-400 font-black uppercase tracking-widest text-xs shadow-2xl backdrop-blur-xl">Non-Authenticate</button>
                </div>

                <style>{`
                    .scrollbar-hide::-webkit-scrollbar { display: none; }
                    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
                    @keyframes pop-in {
                        from { transform: scale(0.6); opacity: 0; }
                        to { transform: scale(1); opacity: 1; }
                    }
                    .animate-pop-in { animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                `}</style>
            </div>
        );
    };

    const renderResult = () => {
        const correctCount = history.filter(h => h.userCorrect).length;
        const accuracy = Math.round((correctCount / shuffledProfiles.length) * 100);

        const getGrade = () => {
            if (accuracy >= 100) return { grade: 'S', color: '#a855f7', label: 'GHOST OPERATIVE' };
            if (accuracy >= 80) return { grade: 'A', color: '#ec4899', label: 'ELITE HUNTER' };
            if (accuracy >= 60) return { grade: 'B', color: '#6366f1', label: 'ANALYST' };
            if (accuracy >= 40) return { grade: 'C', color: '#94a3b8', label: 'RECRUIT' };
            return { grade: 'F', color: '#ef4444', label: 'CIVILIAN' };
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
                    <p className="text-slate-500 font-mono text-xs mt-2 uppercase tracking-widest">Case Closed — Forensic Intelligence Summary</p>
                </div>

                <div className="grid grid-cols-4 gap-4 w-full max-w-2xl mb-10">
                    {[
                        { label: 'Credibility', value: score.toLocaleString(), color: 'text-purple-400' },
                        { label: 'Accuracy', value: `${accuracy}%`, color: accuracy >= 70 ? 'text-emerald-400' : 'text-rose-400' },
                        { label: 'Time Spent', value: formatTime(elapsed), color: 'text-amber-400' },
                        { label: 'Max Combo', value: `×${maxCombo}`, color: 'text-indigo-400' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                            <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest block mb-1">{stat.label}</span>
                            <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                        </div>
                    ))}
                </div>

                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 self-start">Evidence Locker</h3>
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
                                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-800 text-white text-xs font-black shrink-0" style={{ color: item.brandColor }}>
                                    {item.pfpText}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-bold text-white truncate">@{item.username}</span>
                                        <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded ${item.isFake ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                            {item.isFake ? 'FAKE' : 'REAL'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-500 truncate block font-mono">Verdict: {item.userChoice ? 'SHADOW' : 'AUTHENTIC'}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`text-sm font-bold ${item.userCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {item.userCorrect ? '✓' : '✗'}
                                    </span>
                                    <span className="text-slate-600 text-xs">{expandedResult === idx ? '▲' : '▼'}</span>
                                </div>
                            </div>

                            {expandedResult === idx && (
                                <div className="border-t border-slate-800 bg-slate-950/50 px-5 py-4 space-y-2 animate-fade-in">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Forensic Breakdown</span>
                                    <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-purple-500 pl-4 py-1">
                                        "{item.explanation}"
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        <div>
                                            <span className="text-[9px] text-slate-600 uppercase font-black block">Followers</span>
                                            <span className="text-xs text-slate-300 font-mono">{item.followers}</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] text-slate-600 uppercase font-black block">Status</span>
                                            <span className="text-xs text-slate-300 font-mono">{item.isVerified ? 'Verified Account' : 'Unverified'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button onClick={startGame} className="px-12 py-4 bg-purple-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all hover:text-purple-600 shadow-lg text-sm">
                        RE-OPEN CASE
                    </button>
                    <button onClick={onBack} className="px-8 py-4 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all font-bold text-sm">
                        BACK TO HUB
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

export default ImpersonationHunt;
