import React, { useState, useEffect, useRef } from 'react';

const JOB_OFFERS = [
    {
        id: 1,
        sender: "Priya Sharma",
        role: "Recruitment Lead at GlobalTech",
        avatar: "👩‍💼",
        subject: "Urgent: Remote Data Entry Role",
        message: "Hello! We saw your profile and are impressed. We have an immediate opening for a Data Entry specialist. ₹50,000 per week, 2 hours a day. No experience needed! Just pay a ₹500 security deposit for the laptop and start TODAY!",
        isScam: true,
        redFlags: [
            "Requests a 'security deposit' or registration fee.",
            "Salary is unrealistically high for the effort (₹50k for 2 hrs/day).",
            "Generic recruitment message with 'Immediate' urgency."
        ],
        details: {
            email: "priya.recruiter@gmail.com",
            website: "none",
            company: "GlobalTech (Claimed)",
            mutual: 12,
            isHiring: true,
            isTopVoice: false
        }
    },
    {
        id: 2,
        sender: "Hindustan Unilever Ltd",
        role: "Official HR Portal",
        avatar: "🏢",
        subject: "Management Trainee Program 2024",
        message: "Dear Candidate, thank you for applying to our Management Trainee Program. We would like to invite you for the first round of technical interviews. Please find the attached JD and company policy. Note: We never ask for any payment during the hiring process.",
        isScam: false,
        redFlags: [],
        details: {
            email: "careers@hul.com",
            website: "hul.co.in",
            company: "Hindustan Unilever Ltd",
            mutual: 45,
            isHiring: true,
            isTopVoice: true
        }
    },
    {
        id: 3,
        sender: "Amazon Career",
        role: "Executive Placement",
        avatar: "📦",
        subject: "Part-time job opportunity at Amazon!",
        message: "Conngratulations! YOu are selected for Amazon Part-time job. Work from home and earn 5000-10000 daily. WhatsApp us at +91-9988776655 to claim your offer and start work. Limited slots availabel!!",
        isScam: true,
        redFlags: [
            "Poor grammar and spelling ('Conngratulations', 'availabel').",
            "Directs the user to an unofficial channel (WhatsApp).",
            "Urges immediate action with 'Limited slots'."
        ],
        details: {
            email: "amazonjobs-india@outlook.com",
            website: "none",
            company: "Amazon (Impersonated)",
            mutual: 3,
            isHiring: false,
            isTopVoice: false
        }
    },
    {
        id: 4,
        sender: "Google India",
        role: "University Graduate Recruiter",
        avatar: "🎓",
        subject: "Application Update: Software Engineer (L3)",
        message: "Hello, we've reviewed your application for the Software Engineer role in Bangalore. We'd like to schedule a 45-minute Google Hangouts interview to discuss your background. Please select a slot from the portal link below.",
        isScam: false,
        redFlags: [],
        details: {
            email: "recruiting@google.com",
            website: "google.com/about/careers",
            company: "Google India",
            mutual: 89,
            isHiring: true,
            isTopVoice: true
        }
    },
    {
        id: 5,
        sender: "Freelance Hub",
        role: "Content Manager",
        avatar: "✍️",
        subject: "Write Articles & Earn! 🚀",
        message: "Hi there! I am a Content Manager for a top US blog. We need writers. We pay $100 per article. To verify your identity and PayPal account, please send $5 to our verification handle. It will be refunded with your first pay!",
        isScam: true,
        redFlags: [
            "Asking for a small 'verification fee' to prove identity.",
            "Generic 'Content Manager' role without a specific company name.",
            "Refund promise is a common tactic to lower guard."
        ],
        details: {
            email: "manager.freelance@yahoo.com",
            website: "none",
            company: "Freelance Hub",
            mutual: 0,
            isHiring: false,
            isTopVoice: false
        }
    }
];

const StatusBar = () => (
    <div className="flex justify-between items-center px-8 py-3 w-full absolute top-0 z-[100] text-slate-900 font-sans pointer-events-none">
        <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold">11:02</span>
            <span className="text-[10px] font-medium opacity-70">PM</span>
        </div>
        <div className="flex gap-1.5 items-center">
            <div className="flex items-center gap-1 mr-1">
                <div className="w-4 h-4 rounded-full bg-slate-900/10 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-pulse"></div>
                </div>
                <div className="w-3 h-3 flex items-end gap-[1px]">
                    <div className="w-[2px] h-1 bg-slate-900 rounded-full"></div>
                    <div className="w-[2px] h-2 bg-slate-900 rounded-full"></div>
                    <div className="w-[2px] h-3 bg-slate-900 rounded-full"></div>
                </div>
            </div>
            <div className="w-6 h-3 border border-current rounded-sm flex items-center p-0.5 relative">
                <div className="bg-current h-full w-[90%] rounded-sm"></div>
                <div className="absolute -right-1.5 w-1 h-1.5 bg-current rounded-r-sm"></div>
            </div>
        </div>
    </div>
);

const CareerGuard = ({ onBack }) => {
    const [gameState, setGameState] = useState('intro');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [history, setHistory] = useState([]);
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

    const currentOffer = JOB_OFFERS[currentIndex];

    const handleDecision = (decision) => {
        if (feedback) return;

        const isScamDecision = decision === 'scam';
        const isCorrect = (isScamDecision && currentOffer.isScam) || (!isScamDecision && !currentOffer.isScam);

        if (isCorrect) {
            setScore(prev => prev + (isScamDecision ? 1000 : 500));
        } else {
            setLives(prev => Math.max(0, prev - 1));
        }

        setFeedback({ status: isCorrect ? 'correct' : 'wrong' });
        setHistory(prev => [...prev, { offer: currentOffer, decision, isCorrect }]);

        setTimeout(() => {
            setFeedback(null);
            if (currentIndex < JOB_OFFERS.length - 1 && (lives > (isCorrect ? 0 : 1))) {
                setCurrentIndex(prev => prev + 1);
            } else {
                setGameState('result');
            }
        }, 1200);
    };

    const renderIntro = () => (
        <div className="flex flex-col items-center justify-center p-12 text-center max-w-2xl animate-fade-in h-[75vh]">
            <div className="w-24 h-24 bg-indigo-500/10 rounded-full flex items-center justify-center mb-8 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)] relative group">
                <div className="absolute inset-0 bg-indigo-500/5 rounded-full animate-ping opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="text-5xl">👔</span>
            </div>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-6 underline decoration-indigo-500 underline-offset-8">Career Guard</h2>
            <p className="text-slate-400 leading-relaxed mb-10 text-lg font-mono">
                [ SCANNING_COMMUNICATIONS ]
                <br /><br />
                LinkedIn is the new hunting ground for data harvesters.
                Identify fraudulent recruitment markers before sharing your profile.
                <br /><br />
                <span className="text-emerald-400 font-bold uppercase tracking-widest">[ OPPORTUNITY ]</span> or <span className="text-red-400 font-bold uppercase tracking-widest">[ SCAM ]</span>.
            </p>
            <div className="flex gap-4 font-sans">
                <button onClick={onBack} className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all uppercase tracking-widest text-xs border border-slate-700 active:scale-95">
                    Abort
                </button>
                <button onClick={() => setGameState('playing')} className="px-12 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-lg shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all uppercase tracking-widest text-sm border border-indigo-400 active:scale-95">
                    Initialize Hub
                </button>
            </div>
        </div>
    );

    const renderPlaying = () => (
        <div className="w-full h-full flex items-center justify-center animate-fade-in relative py-4">

            {/* Phone Container */}
            <div className="w-[380px] h-[780px] bg-zinc-900 border-x-[12px] border-t-[12px] border-b-[24px] border-black rounded-[3.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] relative overflow-hidden flex flex-col pointer-events-auto">
                <StatusBar />

                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-zinc-800 rounded-b-2xl z-[150] flex items-center justify-center">
                    <div className="w-12 h-1 bg-zinc-900 rounded-full opacity-40"></div>
                </div>

                <div className="w-full h-full bg-slate-50 overflow-hidden flex flex-col relative pt-12">
                    {/* Messaging Header - Refined LinkedIn Style */}
                    <div className="bg-white border-b border-gray-200 p-4 pt-6 flex items-center gap-4 text-gray-800 shadow-sm z-50">
                        <div className="flex items-center gap-3">
                            <span className="text-gray-400 text-sm">❮</span>
                            <div className="w-9 h-9 rounded-full bg-[#0a66c2] flex items-center justify-center italic text-white font-black text-xl shadow-inner">
                                in
                            </div>
                        </div>
                        <div className="flex-1">
                            <div className="bg-slate-100 h-9 rounded-lg flex items-center px-3 gap-2 text-gray-400 text-xs font-medium border border-gray-100/50">
                                <span>🔍</span>
                                <span>Search</span>
                            </div>
                        </div>
                        <div className="flex gap-5 text-gray-400">
                            <span className="text-lg">💬</span>
                            <span className="text-lg font-black tracking-tighter tabular-nums opacity-60">⋮</span>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar-light font-sans bg-white pb-32">
                        {/* Profile Section */}
                        <div className="p-5 border-b border-gray-100 bg-white relative">
                            {currentOffer.details.isHiring && (
                                <div className="absolute top-5 right-5 flex flex-col items-center">
                                    <div className="bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-emerald-200 shadow-sm mb-1">Hiring</div>
                                    {currentOffer.details.isTopVoice && (
                                        <div className="bg-amber-50 text-amber-700 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-amber-200 shadow-sm">Top Voice</div>
                                    )}
                                </div>
                            )}
                            <div className="flex items-center gap-4 mb-5">
                                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center text-4xl shadow-sm border border-white overflow-hidden relative group/avatar">
                                    <div className="absolute inset-0 bg-black/5"></div>
                                    <span className="relative z-10 transition-transform group-hover/avatar:scale-110 duration-500">{currentOffer.avatar}</span>
                                    {currentOffer.details.isHiring && <div className="absolute bottom-0 left-0 right-0 h-4 bg-purple-600/90 text-[8px] text-white font-black uppercase flex items-center justify-center">Member</div>}
                                </div>
                                <div className="flex-1 min-w-0 pr-10">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        <h3 className="text-gray-900 font-black text-[17px] leading-none truncate">{currentOffer.sender}</h3>
                                        <span className="text-gray-400 text-[11px] font-bold shrink-0 bg-gray-50 px-1 rounded leading-none py-0.5 border border-gray-100">· 2nd</span>
                                    </div>
                                    <p className="text-gray-600 text-[11px] font-medium leading-tight mt-1 line-clamp-2 pr-2">{currentOffer.role}</p>
                                    <div className="mt-2 flex items-center gap-1.5">
                                        <div className="flex -space-x-1.5">
                                            <div className="w-3.5 h-3.5 rounded-full bg-blue-100 border border-white"></div>
                                            <div className="w-3.5 h-3.5 rounded-full bg-indigo-100 border border-white"></div>
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-bold whitespace-nowrap overflow-hidden text-ellipsis">
                                            {currentOffer.details.mutual > 0 ? `${currentOffer.details.mutual} mutual connections` : 'Connected recently'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex-1 bg-[#0a66c2] text-white py-1.5 rounded-lg text-xs font-black shadow-sm active:scale-95 transition-all hover:bg-[#004182] border-b-2 border-transparent active:border-b-0">Connect</button>
                                <button className="flex-1 border border-[#0a66c2] text-[#0a66c2] py-1.5 rounded-lg text-xs font-black active:scale-95 transition-all hover:bg-blue-50">Message</button>
                            </div>
                        </div>

                        {/* InMail Banner - Authentic Refinement */}
                        <div className="bg-[#f3f6f8] px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase text-amber-700 tracking-[0.1em] bg-amber-100/50 px-2 py-0.5 rounded">Premium InMail</span>
                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                <span className="text-[10px] text-gray-500 font-black">Recruiter Spotlight</span>
                            </div>
                            <span className="text-gray-400 text-xs">ℹ️</span>
                        </div>

                        {/* Subject */}
                        <div className="px-5 mt-6 mb-3">
                            <h4 className="text-gray-900 font-black text-xl leading-snug tracking-tight">{currentOffer.subject}</h4>
                        </div>

                        {/* Message Content Bubble - Modern Chat Bubble Style */}
                        <div className="px-5 mb-8">
                            <div className="bg-slate-50 border border-slate-100 rounded-[1.2rem] rounded-tl-none p-5 relative shadow-sm">
                                <p className="text-gray-700 text-[13.5px] leading-relaxed font-sans font-medium">
                                    {currentOffer.message}
                                </p>
                                <div className="mt-4 flex items-center justify-between border-t border-slate-200/50 pt-3">
                                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest tabular-nums italic">Received 10:42 PM</p>
                                    <div className="flex gap-2">
                                        <span className="text-[10px] grayscale opacity-50">👍</span>
                                        <span className="text-[10px] grayscale opacity-50">👋</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Details Card - Forensic Focus */}
                        <div className="px-5 mb-10 pb-4">
                            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                                <div className="bg-[#f3f6f8] px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                                        <span className="text-xs opacity-60">🔍</span> Recruiter Scan
                                    </p>
                                    <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-black">AI_VERIFIED</span>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="flex items-start gap-3 group/meta">
                                        <div className="mt-1 text-gray-400 text-xs opacity-60 group-hover/meta:opacity-100 transition-opacity">📧</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Recuitment Handle</p>
                                            <p className={`font-mono text-[12px] truncate ${currentOffer.details.email.includes('gmail') || currentOffer.details.email.includes('outlook') || currentOffer.details.email.includes('yahoo')
                                                ? 'text-red-600 font-bold underline decoration-red-200 decoration-wavy underline-offset-4'
                                                : 'text-gray-800 font-black'
                                                }`}>
                                                {currentOffer.details.email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 group/meta">
                                        <div className="mt-1 text-gray-400 text-xs opacity-60 group-hover/meta:opacity-100 transition-opacity">🌐</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mb-0.5">Verified Network</p>
                                            <p className={`font-mono text-[12px] truncate font-black ${currentOffer.details.website === 'none' ? 'text-gray-400' : 'text-emerald-700'}`}>
                                                {currentOffer.details.website || 'External Link Unavailable'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Navigation Bar - Refined Authentication */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex items-center justify-between pb-6 z-[60] shadow-[0_-5px_15px_rgba(0,0,0,0.02)]">
                        <div className="flex flex-col items-center gap-1 opacity-100 group">
                            <span className="text-lg opacity-100">🏠</span>
                            <span className="text-[8px] font-black text-[#0a66c2] uppercase">Home</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 opacity-40">
                            <span className="text-lg">👥</span>
                            <span className="text-[8px] font-black uppercase">Network</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 opacity-40">
                            <span className="text-lg">➕</span>
                            <span className="text-[8px] font-black uppercase">Post</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 opacity-40">
                            <span className="text-lg">🔔</span>
                            <span className="text-[8px] font-black uppercase">Alerts</span>
                        </div>
                        <div className="flex flex-col items-center gap-1 opacity-40">
                            <span className="text-lg">💼</span>
                            <span className="text-[8px] font-black uppercase">Jobs</span>
                        </div>
                    </div>

                    {/* Footer Decision Buttons - Hovering above nav */}
                    <div className="absolute bottom-16 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-gray-100 flex gap-3 z-[70] shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
                        <button
                            onClick={() => handleDecision('scam')}
                            disabled={!!feedback}
                            className="flex-1 bg-white border-2 border-red-500 text-red-600 font-black py-3.5 rounded-xl hover:bg-red-50 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale uppercase tracking-[0.15em] text-[10px] font-sans shadow-sm"
                        >
                            SCAM_FLAG
                        </button>
                        <button
                            onClick={() => handleDecision('legit')}
                            disabled={!!feedback}
                            className="flex-1 bg-[#0a66c2] text-white font-black py-3.5 rounded-xl hover:bg-[#004182] transition-all shadow-[0_8px_20px_rgba(10,102,194,0.3)] active:scale-95 disabled:opacity-30 disabled:grayscale uppercase tracking-[0.15em] text-[10px] font-sans border border-[#004182]"
                        >
                            LEGIT_OFFER
                        </button>
                    </div>

                    {/* Feedback Overlay */}
                    {feedback && (
                        <div className={`absolute inset-0 z-[200] flex items-center justify-center backdrop-blur-xl animate-fade-in`}>
                            <div className={`p-8 rounded-[2.5rem] shadow-[0_25px_60px_rgba(0,0,0,0.5)] border-4 flex flex-col items-center justify-center relative overflow-hidden ${feedback.status === 'correct' ? 'bg-emerald-600 border-emerald-400' : 'bg-red-600 border-red-400'
                                }`}>
                                <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                                <div className="text-7xl mb-4 drop-shadow-2xl relative z-10 transition-transform animate-float">
                                    {feedback.status === 'correct' ? '🛡️' : '🚨'}
                                </div>
                                <span className="text-white font-black uppercase tracking-[0.25em] text-xl leading-none mb-1 relative z-10">
                                    {feedback.status === 'correct' ? 'SECURED' : 'BREACH'}
                                </span>
                                <p className="text-white/80 text-[10px] uppercase font-black tracking-[0.3em] relative z-10 opacity-70">Forensics_Validated</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar Stats - Clean Professional Theme */}
            <div className="ml-12 w-80 flex flex-col gap-6 font-mono pointer-events-auto">
                <div className="bg-[#0f172a] border border-[#1e293b] p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none"></div>
                    <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] block mb-2 opacity-60">Protocol: JOBSCAN_PRO_v2</span>
                    <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
                        AGENT_04 <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                    </h3>
                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-2">Integrity_Link</p>
                                <div className="flex gap-2.5">
                                    {[...Array(3)].map((_, i) => (
                                        <div key={i} className={`w-3.5 h-3.5 rounded-sm rotate-45 transition-all duration-700 ${i < lives ? 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)]' : 'bg-slate-800'}`}></div>
                                    ))}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Queue</p>
                                <div className="text-3xl font-black text-white leading-none tabular-nums">
                                    {currentIndex + 1}<span className="text-slate-700 text-lg">/{JOB_OFFERS.length}</span>
                                </div>
                            </div>
                        </div>
                        <div className="w-full h-1 bg-slate-800/50 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                                style={{ width: `${((currentIndex + 1) / JOB_OFFERS.length) * 100}%` }} />
                        </div>
                    </div>
                </div>

                <div className="bg-[#0f172a] border border-[#1e293b] p-8 rounded-[2rem] shadow-2xl text-center relative overflow-hidden group">
                    <div className="absolute -left-10 -top-10 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full"></div>
                    <span className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.3em] block mb-3 opacity-60">Session_Credits</span>
                    <div className="text-6xl font-black text-white tracking-tighter group-hover:text-indigo-400 transition-all duration-500 tabular-nums">
                        {score.toLocaleString()}
                    </div>
                    <div className="mt-4 flex justify-center border-t border-slate-800 pt-3">
                        <div className="flex gap-1.5">
                            <div className="w-1 h-3 bg-indigo-500/20 rounded-full"></div>
                            <div className="w-1 h-3 bg-indigo-500/40 rounded-full"></div>
                            <div className="w-1 h-3 bg-indigo-500/60 rounded-full"></div>
                        </div>
                    </div>
                </div>

                <div className="bg-emerald-950/10 border border-emerald-500/10 p-8 rounded-[2rem] relative border-dashed group transition-colors hover:bg-emerald-500/5">
                    <p className="text-[11px] text-slate-400 font-bold leading-relaxed italic pr-4">
                        "Real hiring managers often reference common connections or specific portfolio pieces. <span className="text-indigo-400 uppercase">Generic</span> praise is a warning sign."
                    </p>
                    <div className="absolute bottom-4 right-4 text-[10px] font-black text-emerald-500 uppercase opacity-20 tracking-tighter">SEC_TIP_#14</div>
                </div>

                <button onClick={onBack} className="mt-auto px-8 py-5 bg-transparent hover:bg-slate-800 text-slate-500 hover:text-white font-black rounded-2xl transition-all border border-slate-800/50 hover:border-slate-700 uppercase tracking-[0.3em] text-[9px] flex items-center justify-center gap-3 active:scale-95 group">
                    <span className="text-lg opacity-40 group-hover:rotate-90 transition-transform">✕</span> Finalize Session
                </button>
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
        const accuracy = Math.round((correctCount / JOB_OFFERS.length) * 100);

        const getGrade = () => {
            if (accuracy >= 100) return { grade: 'S', color: '#6366f1', label: 'JOB MASTER' };
            if (accuracy >= 80) return { grade: 'A', color: '#10b981', label: 'SENTINEL' };
            if (accuracy >= 60) return { grade: 'B', color: '#3b82f6', label: 'RECRUITER' };
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
                    <p className="text-slate-500 font-mono text-xs mt-2 uppercase tracking-widest">Assessment Complete — Professional Integrity Report</p>
                </div>

                <div className="grid grid-cols-4 gap-4 w-full max-w-2xl mb-10">
                    {[
                        { label: 'Score', value: score.toLocaleString(), color: 'text-indigo-400' },
                        { label: 'Accuracy', value: `${accuracy}%`, color: accuracy >= 70 ? 'text-emerald-400' : 'text-rose-400' },
                        { label: 'Time', value: formatTime(elapsed), color: 'text-amber-400' },
                        { label: 'Lives', value: lives, color: lives > 0 ? 'text-cyan-400' : 'text-red-400' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                            <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest block mb-1">{stat.label}</span>
                            <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                        </div>
                    ))}
                </div>

                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 self-start">Engagement Log</h3>
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
                                    {item.offer.avatar}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-bold text-white truncate">{item.offer.sender}</span>
                                        <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded ${item.offer.isScam ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                            {item.offer.isScam ? 'SCAM' : 'LEGIT'}
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
                                    {item.offer.isScam ? (
                                        <ul className="space-y-1 mt-2">
                                            {item.offer.redFlags.map((flag, fi) => (
                                                <li key={fi} className="text-xs text-slate-400 flex items-start gap-2">
                                                    <span className="text-red-500">•</span>
                                                    <span>{flag}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-xs text-slate-400 italic">Legitimate recruitment pattern from a verified domain.</p>
                                    )}
                                    <div className="text-[10px] text-slate-600 mt-2 font-mono">
                                        Role: <span className="text-slate-400">{item.offer.role}</span>
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
                    }} className="px-12 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all hover:text-indigo-600 shadow-lg text-sm">
                        RETRY EVAL
                    </button>
                    <button onClick={onBack} className="px-8 py-4 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all font-bold text-sm">
                        BACK TO HUB
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex items-center justify-center font-sans overflow-hidden bg-transparent">
            <style>{`
                .custom-scrollbar-cyber::-webkit-scrollbar { width: 10px; }
                .custom-scrollbar-cyber::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
                .custom-scrollbar-cyber::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 20px; border: 3px solid #070b14; }
                
                .custom-scrollbar-light::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar-light::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar-light::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }

                .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.98) translateY(30px); } to { opacity: 1; transform: scale(1) translateY(0); } }
                
                .animate-float { animation: float 3s ease-in-out infinite; }
                @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
            `}</style>
            {gameState === 'intro' && renderIntro()}
            {gameState === 'playing' && renderPlaying()}
            {gameState === 'result' && renderResult()}
        </div>
    );
};

export default CareerGuard;
