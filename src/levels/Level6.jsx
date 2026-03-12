import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '../context/GameStateContext';

const Level6 = () => {
    const { completeLevel, playTitleCardSound } = useGameState();

    // ═══ FLOW STEP — strict linear progression ═══
    // 0: briefing (click PC)
    // 1: full_pc_view (laggy PC + dialogues)
    // 2: desk_explore (prompt: use phone)
    // 3: phone_search (prompt: click Google)
    // 4: dialer_ready (prompt: click Call)
    // 5: call_active (conversation with Vikram)
    // 6: link_offered (Accept Support Link visible)
    // 7: anydesk_running (prompt: check notebook)
    // 8: reading_notebook (browsing clue pages)
    // 9: number_pinned (prompt: check phone to compare)
    // 10: number_verified (prompt: hang up)
    // 11: hung_up (prompt: abort from PC)
    // 12: outcome
    const [step, setStep] = useState(0);
    const [gameState, setGameState] = useState('playing'); // 'playing' or 'title_card'
    const [anydeskProgress, setAnydeskProgress] = useState(15);
    const [outroStep, setOutroStep] = useState(0); // 0: none, 1: pc_aborted, 2: temppho_dialogue, 3: end_card
    const [outroDialogueIdx, setOutroDialogueIdx] = useState(0);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [timeLeft, setTimeLeft] = useState(90);
    const [feedbackMsg, setFeedbackMsg] = useState(null);
    const [outcomeType, setOutcomeType] = useState(null);
    const [activeZoom, setActiveZoom] = useState(null);
    const [isPhoneOpen, setIsPhoneOpen] = useState(false);
    const [activePhoneApp, setActivePhoneApp] = useState('home');
    const [callLog, setCallLog] = useState([]);
    const [pinnedNumber, setPinnedNumber] = useState(null);
    const [notebookPage, setNotebookPage] = useState(0);

    // PC Intro
    const [pcDialogueIndex, setPcDialogueIndex] = useState(-1);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [laggedCursorPos, setLaggedCursorPos] = useState({ x: 0, y: 0 });
    const pcDialogues = [
        "What is wrong with pc...",
        "why is it lagging after update...",
        "I should contact support maybe."
    ];

    // Prompt messages for each step
    const [prompt, setPrompt] = useState(null);

    const timerRef = useRef(null);

    // Notebook clue pages
    const notebookPages = [
        {
            title: 'Common Scam Tactics',
            icon: '🚩',
            content: 'Scammers often pose as tech support from big companies like Microsoft, Apple, or your bank. They create urgency to rush you into giving remote access.',
            hint: 'Remember: Real support will NEVER cold-call you or ask for remote access.'
        },
        {
            title: 'How to Spot Fake URLs',
            icon: '🔗',
            content: 'Fake websites use domains like ".ml", ".tk", or ".xyz" instead of official ".com" or ".microsoft.com". Always check the URL carefully before trusting a website.',
            hint: 'The caller\'s website was "microsoft-patch-fix.ml" — that is NOT microsoft.com!'
        },
        {
            title: 'Verified Helplines',
            icon: '📞',
            isFinalClue: true,
            content: 'Always verify phone numbers with official records. Below are verified helplines:',
            numbers: [
                { label: 'Microsoft Support', number: '1800-425-3800', pinnable: true },
                { label: 'SBI Official Care', number: '1800-11-2211', pinnable: false }
            ]
        }
    ];

    // ═══ LOGIC ═══

    const showFeedback = (msg, color = 'cyan') => {
        setFeedbackMsg({ text: msg, color });
        setTimeout(() => setFeedbackMsg(null), 4000);
    };

    const showPrompt = (msg) => {
        setPrompt(msg);
        setTimeout(() => setPrompt(null), 5000);
    };

    const handlePinNumber = (num) => {
        setPinnedNumber(num);
        setStep(9);
        showPrompt("📌 Number pinned! Now open your phone and compare it with the caller's number.");
    };

    const startCall = () => {
        setGameState('title_card');
        playTitleCardSound();

        // Wait for title card animation (3.5s) before connecting
        setTimeout(() => {
            setGameState('playing');
            setStep(5);
            setActivePhoneApp('call');
            setCallLog([{ sender: 'system', text: 'Calling 1800-000-2233...' }]);

            setTimeout(() => {
                setCallLog(prev => [...prev, { sender: 'system', text: 'Call connected.' }]);
            }, 1500);

            setTimeout(() => {
                setCallLog(prev => [...prev, { sender: 'vikram', text: "Hello sir, thank you for calling Microsoft Windows Support. My name is Vikram, Senior Support Engineer." }]);
            }, 3000);

            setTimeout(() => {
                setCallLog(prev => [...prev, { sender: 'vikram', text: "I can see your recent Windows Update caused a critical kernel slowdown. This is a known issue." }]);
            }, 6000);

            setTimeout(() => {
                setCallLog(prev => [...prev, { sender: 'vikram', text: "To fix this remotely, I need you to accept the AnyDesk connection link. Please click 'Accept Support Link' below." }]);
                setStep(6);
            }, 9000);
        }, 3500);
    };

    const handleAcceptLink = () => {
        setStep(7);
        setIsPhoneOpen(false);
        showPrompt("⚠️ AnyDesk is running! Something feels wrong... Check the Records notebook on the desk.");
    };

    const handleAbortSession = () => {
        clearInterval(timerRef.current);
        setOutroStep(1);
    };

    const handleHangUp = () => {
        if (step >= 7 && step < 11) {
            // During anydesk, hanging up should only work at step 10
            if (step === 10) {
                setStep(11);
                setIsPhoneOpen(false);
                setActivePhoneApp('home');
                showPrompt("Good! Now quickly open the PC System Status and ABORT the connection!");
            } else {
                showFeedback("You should investigate first before hanging up!", "orange");
            }
        } else {
            setIsPhoneOpen(false);
            setActivePhoneApp('home');
        }
    };

    const handlePhoneClick = () => {
        if (step < 2) {
            showFeedback("Check your PC first — there's an update notification.", "orange");
            return;
        }
        setIsPhoneOpen(true);
        if (step === 2) {
            setStep(3);
            showPrompt("Search Google for 'Windows Update Support' help.");
        }
        if (step === 9) {
            showPrompt("Compare the pinned number with the caller's number on the phone!");
        }
    };

    const handleGoogleClick = () => {
        setActivePhoneApp('search');
        if (step === 3) {
            showPrompt("Click the search result link to call support.");
        }
    };

    const handleSearchResultClick = () => {
        setActivePhoneApp('dialer');
        if (step === 3) setStep(4);
        showPrompt("Press the green call button to connect.");
    };

    const handleNotebookClick = () => {
        if (step < 7) {
            showFeedback("Nothing to check here yet.", "orange");
            return;
        }
        setActiveZoom('notebook');
        setNotebookPage(0);
        if (step === 7) {
            setStep(8);
        }
    };

    const handleMonitorClick = () => {
        if (step === 0) {
            setStep(1);
            return;
        }
        if (step === 11) {
            setActiveZoom('laptop-left');
            return;
        }
        if (step >= 7) {
            setActiveZoom('laptop-left');
            return;
        }
        if (step >= 2) {
            showFeedback("Nothing to do on the PC right now. Use your phone!", "orange");
        }
    };

    // ═══ EFFECTS ═══

    useEffect(() => {
        const handleMouseMove = (e) => setCursorPos({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        if (step === 1) {
            const interval = setInterval(() => {
                setLaggedCursorPos(prev => ({
                    x: prev.x + (cursorPos.x - prev.x) * 0.05,
                    y: prev.y + (cursorPos.y - prev.y) * 0.05
                }));
            }, 16);
            return () => clearInterval(interval);
        } else {
            setLaggedCursorPos(cursorPos);
        }
    }, [cursorPos, step]);

    useEffect(() => {
        if (step === 1) {
            let s = 0;
            const seqInterval = setInterval(() => {
                if (s < pcDialogues.length) {
                    setPcDialogueIndex(s);
                    s++;
                } else clearInterval(seqInterval);
            }, 3000);
            return () => clearInterval(seqInterval);
        } else {
            setPcDialogueIndex(-1);
        }
    }, [step]);

    useEffect(() => {
        if (step >= 7 && step < 12) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setOutcomeType('scam');
                        setStep(12);
                        return 0;
                    }
                    return prev - 1;
                });
                setAnydeskProgress(prev => Math.min(100, prev + 1.1));
            }, 1000);
        } else if (step < 7) {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [step]);

    // ═══ OUTRO LOGIC ═══
    useEffect(() => {
        let timer1, timer2;
        if (outroStep === 1) {
            timer1 = setTimeout(() => {
                setIsFadingOut(true);
                timer2 = setTimeout(() => {
                    setOutroStep(2);
                    setIsFadingOut(false);
                }, 1000);
            }, 2500);
        } else if (outroStep === 2) {
            const linesLength = 4;
            if (outroDialogueIdx < linesLength) {
                timer1 = setTimeout(() => {
                    if (outroDialogueIdx === linesLength - 1) {
                        setIsFadingOut(true);
                        timer2 = setTimeout(() => {
                            setOutroStep(3);
                            setIsFadingOut(false);
                        }, 1000);
                    } else {
                        setOutroDialogueIdx(prev => prev + 1);
                    }
                }, 3800);
            }
        }
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [outroStep, outroDialogueIdx]);

    // Step 9 → auto prompt to check phone
    useEffect(() => {
        if (step === 10) {
            showPrompt("The numbers don't match! This is a scam! Hang up the call now!");
        }
    }, [step]);

    // ═══ SUB-COMPONENTS ═══

    const PhoneUI = () => (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden" onClick={() => setIsPhoneOpen(false)}>
            <div className="w-[340px] h-[640px] bg-slate-900 rounded-[3rem] border-[10px] border-slate-800 relative shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-20" />

                {/* CALL SCREEN */}
                {activePhoneApp === 'call' && step >= 5 ? (
                    <div className="flex-1 flex flex-col p-4 pt-10 w-full bg-slate-50">
                        <div className="flex items-center gap-3 mb-4 rounded-xl bg-white p-3 shadow-sm border border-slate-200">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">V</div>
                            <div>
                                <h2 className="text-slate-800 font-bold text-sm">Vikram (Support)</h2>
                                <p className="text-[10px] text-slate-500">1800-000-2233</p>
                                <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest animate-pulse">Active Call</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 mb-4 flex flex-col rounded-xl p-2 bg-slate-100/50">
                            {callLog.map((log, i) => (
                                <div key={i} className={`flex ${log.sender === 'vikram' ? 'justify-start' : 'justify-center'} w-full`}>
                                    <div className={`p-3 rounded-2xl max-w-[85%] text-xs shadow-sm ${log.sender === 'vikram' ? 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm' :
                                        'bg-slate-200/50 text-slate-500 text-[10px] italic py-1 px-4 rounded-full border border-slate-300'
                                        }`}>
                                        {log.text}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pinned number comparison */}
                        {pinnedNumber && step >= 9 && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3">
                                <p className="text-[9px] uppercase text-red-500 font-bold mb-1">📌 Number Check</p>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-red-600 font-mono font-bold">Caller: 1800-000-2233</span>
                                    <span className="text-slate-400">≠</span>
                                    <span className="text-emerald-600 font-mono font-bold">Official: {pinnedNumber}</span>
                                </div>
                                {step === 9 && (
                                    <button
                                        onClick={() => setStep(10)}
                                        className="w-full mt-2 bg-red-500 text-white text-[10px] font-bold py-2 rounded-lg uppercase"
                                    >
                                        Numbers Don't Match!
                                    </button>
                                )}
                            </div>
                        )}

                        <div className="w-full space-y-3 shrink-0">
                            {step === 6 && (
                                <button
                                    onClick={handleAcceptLink}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-3 rounded-xl shadow-md transition-all active:scale-95 text-xs text-center"
                                >
                                    Accept Support Link
                                </button>
                            )}
                            <button
                                onClick={handleHangUp}
                                className="w-full bg-red-500 hover:bg-red-400 text-white font-black py-3 rounded-xl shadow-md transition-all active:scale-95 text-xs text-center"
                            >
                                End Call
                            </button>
                        </div>
                    </div>

                ) : activePhoneApp === 'dialer' ? (
                    <div className="flex-1 w-full bg-slate-50 flex flex-col items-center justify-between p-6 font-sans h-full overflow-hidden pt-12">
                        <div className="w-full text-center mt-6">
                            <h2 className="text-3xl font-light text-slate-800 tracking-widest mb-2 font-mono">1800-000-2233</h2>
                            <p className="text-blue-500 text-xs font-medium">Windows Update Support</p>
                        </div>
                        <div className="w-full grid grid-cols-3 gap-y-4 gap-x-4 mb-4 text-xl font-light text-slate-700">
                            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map(key => (
                                <div key={key} className="flex justify-center">
                                    <div className="w-14 h-14 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors shadow-sm cursor-default">{key}</div>
                                </div>
                            ))}
                        </div>
                        <div className="w-full flex justify-center mb-4">
                            <button onClick={startCall} className="p-5 bg-green-500 hover:bg-green-400 text-white rounded-full flex items-center justify-center text-3xl shadow-lg transition-transform hover:scale-105 active:scale-95">📞</button>
                        </div>
                    </div>

                ) : activePhoneApp === 'search' ? (
                    <div className="flex-1 w-full bg-white text-black flex flex-col font-sans h-full overflow-hidden rounded-[2rem] mt-6">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3">
                            <button onClick={() => setActivePhoneApp('home')} className="text-slate-500">←</button>
                            <div className="flex-1 bg-white border border-slate-300 rounded-full px-4 py-2 text-xs text-slate-700 shadow-inner overflow-hidden whitespace-nowrap text-ellipsis">Windows Update Support</div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 pb-10">
                            <div className="space-y-6">
                                <div className="group border-b border-slate-100 pb-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[9px] bg-slate-800 text-white px-2 py-0.5 font-black rounded">Ad</span>
                                        <span className="text-[10px] text-slate-500 px-1 rounded">www.microsoft-patch-fix.ml</span>
                                    </div>
                                    <h3
                                        onClick={handleSearchResultClick}
                                        className="text-lg text-blue-700 font-medium mb-1 cursor-pointer hover:underline leading-tight"
                                    >
                                        Fix Windows 11 Slow Update: 1800-000-2233
                                    </h3>
                                    <p className="text-xs text-slate-600 leading-snug">Official Microsoft Update Patch Engineers. Fix Kernel lag and system slowdown instantly.</p>
                                </div>
                                <div className="opacity-40 pointer-events-none">
                                    <p className="text-[10px] text-slate-500 mb-1">support.microsoft.com</p>
                                    <h3 className="text-base text-blue-700 font-medium leading-tight">Official Windows Support</h3>
                                    <p className="text-[10px] text-slate-600 mt-1">"Slow PC? Restart your device..."</p>
                                </div>
                            </div>
                        </div>
                    </div>

                ) : (
                    <div className="flex-1 w-full flex flex-col items-center justify-center p-8 gap-8 mt-10">
                        <div className="grid grid-cols-4 gap-6 w-full px-4">
                            <div onClick={handleGoogleClick} className="flex flex-col items-center gap-2 cursor-pointer group">
                                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                                    <span className="font-bold"><span className="text-blue-500 text-base">G</span><span className="text-red-500 text-base">o</span><span className="text-yellow-500 text-base">o</span><span className="text-blue-500 text-base">g</span><span className="text-green-500 text-base">l</span><span className="text-red-500 text-base">e</span></span>
                                </div>
                                <span className="text-[10px] text-white font-medium">Search</span>
                            </div>
                            <div onClick={handleGoogleClick} className="flex flex-col items-center gap-2 cursor-pointer group">
                                <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-3xl text-white shadow-sm group-hover:scale-110 transition-transform">📞</div>
                                <span className="text-[10px] text-white font-medium">Phone</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/20 rounded-full" />
            </div>
        </div>
    );

    const NotebookUI = () => {
        const page = notebookPages[notebookPage];
        return (
            <div className="absolute inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-300">
                <div className="relative w-[800px] h-[550px] bg-[#fdfaf1] rounded-3xl shadow-2xl border-[16px] border-[#5c3a21] overflow-hidden flex transform -rotate-1">
                    <div className="absolute left-1/2 top-0 bottom-0 w-8 bg-black/5 -translate-x-1/2 z-10" />

                    {/* Left Page */}
                    <div className="flex-1 p-10 border-r border-black/5 flex flex-col">
                        <h3 className="font-mono text-stone-300 text-[10px] uppercase font-black mb-4">Page {notebookPage + 1} of {notebookPages.length}</h3>
                        <div className="text-center mb-6">
                            <span className="text-5xl">{page.icon}</span>
                        </div>
                        <h4 className="font-serif font-black text-stone-800 text-xl mb-4">{page.title}</h4>
                        <p className="font-serif text-sm text-stone-600 leading-relaxed mb-6">{page.content}</p>

                        {page.numbers && (
                            <div className="space-y-3 mt-2">
                                {page.numbers.map((n, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <p className="font-serif text-[10px] uppercase text-stone-500 font-bold w-32">{n.label}:</p>
                                        {n.pinnable ? (
                                            <p
                                                onClick={() => handlePinNumber(n.number)}
                                                className={`font-serif text-xl font-black tracking-tight cursor-pointer transition-colors p-2 rounded-md ${pinnedNumber === n.number ? 'text-emerald-700 bg-emerald-100' : 'text-stone-900 hover:bg-amber-100 hover:text-amber-800'}`}
                                            >
                                                {n.number}
                                            </p>
                                        ) : (
                                            <p className="font-serif text-xl font-black text-stone-900 tracking-tight">{n.number}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {page.hint && (
                            <div className="mt-auto p-3 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-amber-700 text-xs italic">💡 {page.hint}</p>
                            </div>
                        )}
                    </div>

                    {/* Right Page — Navigation */}
                    <div className="flex-1 p-10 flex flex-col items-center justify-center text-center">
                        {pinnedNumber ? (
                            <div className="animate-in zoom-in duration-500">
                                <div className="bg-emerald-50 p-6 border-t-8 border-emerald-600 shadow-xl transform rotate-2">
                                    <h4 className="text-emerald-700 font-black uppercase text-xs mb-3">📌 Number Pinned</h4>
                                    <p className="text-stone-700 text-sm font-serif leading-relaxed mb-4">
                                        Official number <span className="font-black text-emerald-800">{pinnedNumber}</span> pinned!
                                    </p>
                                    <p className="text-stone-500 text-xs">Close the notebook and open your phone to compare numbers.</p>
                                </div>
                            </div>
                        ) : notebookPage < notebookPages.length - 1 ? (
                            <div
                                onClick={() => setNotebookPage(prev => prev + 1)}
                                className="w-full h-full bg-amber-50 rounded-xl border-2 border-dashed border-amber-200 flex flex-col items-center justify-center cursor-pointer hover:bg-amber-100 transition-all group"
                            >
                                <span className="text-5xl mb-4 group-hover:translate-x-2 transition-transform">→</span>
                                <p className="text-stone-400 font-black uppercase tracking-tighter text-[10px]">Next Page</p>
                                <p className="text-stone-500 text-xs italic mt-2">Click to turn the page</p>
                            </div>
                        ) : (
                            <div className="w-full h-full bg-amber-50 rounded-xl border-2 border-dashed border-amber-200 flex flex-col items-center justify-center">
                                <span className="text-5xl mb-4">📌</span>
                                <p className="text-stone-400 font-black uppercase tracking-tighter text-[10px]">Pin a number</p>
                                <p className="text-stone-500 text-xs italic mt-2 w-3/4">Click a helpline number on the left to pin it for verification.</p>
                            </div>
                        )}
                    </div>

                    <button onClick={() => setActiveZoom(null)} className="absolute top-6 right-8 text-stone-400 hover:text-stone-900 text-2xl font-light">×</button>
                </div>
            </div>
        );
    };

    const renderOutcomeUI = () => (
        <div className="absolute inset-0 z-[2000] bg-slate-950 flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500">
            {outcomeType === 'scam' ? (
                <div className="max-w-xl">
                    <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-8 animate-pulse">💸</div>
                    <h1 className="text-5xl font-black text-white mb-6 uppercase">Total Loss</h1>
                    <p className="text-slate-400 text-lg leading-relaxed mb-10">
                        By granting AnyDesk access, Vikram took control. Your savings were drained in minutes. Never share remote access with strangers!
                    </p>
                    <button onClick={() => window.location.reload()} className="bg-slate-800 hover:bg-slate-700 text-white font-black px-12 py-4 rounded-xl text-xs uppercase tracking-[0.3em] transition-all border border-slate-700">Try Again</button>
                </div>
            ) : (
                <div className="max-w-2xl">
                    <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-xl">🛡️</div>
                    <h1 className="text-5xl font-black text-white mb-4 uppercase">Success!</h1>
                    <p className="text-emerald-400 font-bold mb-6 italic">"You stopped Vikram's scam in time!"</p>
                    <p className="text-slate-400 text-lg leading-relaxed mb-12">
                        You verified the fraudulent number against official records and aborted the AnyDesk connection. Your account balance of <span className="text-emerald-400 font-black">₹4,20,000</span> is safe!
                    </p>
                    <button
                        onClick={() => completeLevel(true, 100, 0)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-16 py-5 rounded-2xl text-lg uppercase tracking-widest transition-all shadow-2xl active:scale-95"
                    >
                        Finish Level
                    </button>
                </div>
            )}
        </div>
    );

    // ═══ MAIN RENDER ═══
    return (
        <div className="w-full h-full flex items-center justify-center bg-zinc-950 font-sans overflow-hidden select-none relative">
            <div className="w-full h-full relative overflow-hidden">
                {/* BACKGROUND */}
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
                    style={{
                        backgroundImage: "url('/assets/temppho.png')",
                        transform: activeZoom ? 'scale(1.1) translateY(5%)' : 'scale(1)'
                    }}
                />

                {/* UPDATE INSTALLED NOTIFICATION */}
                {step === 0 && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-12 z-20 animate-bounce">
                        <div className="bg-blue-600 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 border border-blue-400">
                            <span className="text-sm">🔄</span> Update Installed. Click to view.
                        </div>
                        <div className="w-3 h-3 bg-blue-600 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-blue-400"></div>
                    </div>
                )}

                {/* Laggy Cursor */}
                {step === 1 && (
                    <div
                        className="pointer-events-none fixed z-[3000] w-6 h-6 flex items-center justify-center animate-spin"
                        style={{ left: laggedCursorPos.x - 12, top: laggedCursorPos.y - 12, transition: 'none' }}
                    >
                        <div className="w-6 h-6 border-[6px] border-blue-500 border-t-transparent rounded-full shadow-lg" />
                    </div>
                )}

                {/* FULL PC VIEW */}
                {step === 1 && (
                    <div className="absolute inset-0 z-[100] bg-black animate-in fade-in duration-500 overflow-hidden flex flex-col select-none cursor-none">
                        <div className="absolute inset-0 flex flex-col">
                            <div className="flex-1 bg-gradient-to-br from-blue-600 to-indigo-900 border-b border-slate-700 p-4">
                                <div className="space-y-6">
                                    <div className="flex flex-col items-center w-20 gap-1 opacity-50">
                                        <div className="w-10 h-10 bg-white/20 rounded shadow-sm"></div>
                                        <div className="text-white text-[10px] text-center drop-shadow-md">Recycle Bin</div>
                                    </div>
                                    <div className="flex flex-col items-center w-20 gap-1 opacity-50">
                                        <div className="w-10 h-10 bg-blue-400/20 rounded shadow-sm"></div>
                                        <div className="text-white text-[10px] text-center drop-shadow-md">Browser</div>
                                    </div>
                                </div>
                            </div>
                            <div className="h-12 bg-slate-950 flex items-center px-4 justify-between border-t border-slate-800">
                                <div className="flex gap-2 items-center">
                                    <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center font-black text-blue-400 text-lg">⊞</div>
                                    <div className="w-48 h-8 bg-slate-900 rounded-md border border-slate-800 flex items-center px-3 text-slate-500 text-xs text-opacity-50">Search</div>
                                </div>
                                <div className="flex gap-4 items-center text-slate-400 text-xs">
                                    <span>ENG</span>
                                    <span>10:45 AM</span>
                                </div>
                            </div>
                        </div>

                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                            {pcDialogues.map((text, idx) => (
                                <div
                                    key={idx}
                                    className={`text-3xl font-serif italic text-white font-bold drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] transition-all duration-1000 my-4 transform ${idx <= pcDialogueIndex ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                                >
                                    "{text}"
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => { setStep(2); showPrompt("Use your smartphone on the desk to search for help."); }}
                            className={`absolute bottom-20 left-1/2 -translate-x-1/2 z-30 bg-red-600 hover:bg-red-500 text-white font-black px-8 py-4 rounded-xl shadow-2xl transition-all uppercase tracking-widest text-sm cursor-auto ${pcDialogueIndex >= pcDialogues.length - 1 ? 'opacity-100 animate-bounce' : 'opacity-0 pointer-events-none'}`}
                        >
                            Quit PC Screen
                        </button>
                    </div>
                )}

                {/* HOTSPOTS */}
                {!activeZoom && step !== 12 && step !== 1 && (
                    <div className="absolute inset-0 z-10">
                        {/* Monitor */}
                        <div
                            onClick={handleMonitorClick}
                            className={`absolute left-[45%] top-[30%] w-[18%] h-[25%] cursor-pointer group transition-colors rounded-md ${step === 11 ? 'border-2 border-red-500 animate-pulse bg-red-500/10' : step >= 7 ? 'border-2 border-cyan-500/30 hover:bg-cyan-500/10' : 'border-2 border-transparent hover:border-cyan-500/30 hover:bg-cyan-500/10'}`}
                        >
                            {step === 11 ? (
                                <span className="absolute inset-0 flex items-center justify-center text-white font-black text-sm uppercase tracking-widest bg-red-500/30 backdrop-blur-sm animate-pulse">🛑 Click to Abort</span>
                            ) : step >= 2 ? (
                                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-white font-black text-lg uppercase tracking-widest bg-cyan-500/20 backdrop-blur-sm">System Status</span>
                            ) : null}
                        </div>

                        {/* Phone */}
                        <div
                            onClick={handlePhoneClick}
                            className={`absolute left-[20%] top-[75%] w-[10%] h-[18%] cursor-pointer group rounded-xl ${step === 2 || step === 9 ? 'border-2 border-emerald-400 animate-pulse' : ''}`}
                        >
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="bg-white text-black text-[10px] font-black px-2 py-1 rounded shadow-lg uppercase tracking-widest">Smartphone</span>
                            </div>
                        </div>

                        {/* Notebook */}
                        <div
                            onClick={handleNotebookClick}
                            className={`absolute right-[15%] top-[60%] w-[12%] h-[20%] cursor-pointer group rounded-sm ${step === 7 ? 'border-2 border-amber-400 animate-pulse' : ''}`}
                        >
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg uppercase tracking-widest">Records</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* SYSTEM STATUS ZOOM */}
                {activeZoom === 'laptop-left' && (
                    <div className="absolute inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-20 animate-in zoom-in-95 duration-300">
                        <div className="w-[650px] bg-slate-900 border-[10px] border-slate-800 rounded-3xl shadow-2xl flex flex-col p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-cyan-400 font-black uppercase text-sm tracking-widest">System Monitor</h2>
                                <button onClick={() => setActiveZoom(null)} className="text-slate-500 hover:text-white text-3xl">×</button>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-black/40 p-5 border border-white/5 rounded-2xl">
                                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 mb-3">
                                        <span>Connection: AnyDesk</span>
                                        <span className={step >= 7 && step < 12 ? 'text-red-500 animate-pulse' : 'text-slate-600'}>
                                            {step >= 7 && step < 12 ? 'Active Transfer' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="h-4 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                        <div className="h-full bg-red-600 transition-all duration-1000" style={{ width: `${anydeskProgress}%` }} />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-3 font-mono">Target: {step >= 7 && step < 12 ? 'anydesk-fix.ml' : 'None'}</p>
                                </div>

                                {step >= 7 && step < 12 && (
                                    <div className="space-y-4">
                                        {step >= 11 && pinnedNumber ? (
                                            <>
                                                <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                                                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-3">Number Verification</p>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex-1 text-center p-3 bg-red-950/50 rounded-xl border border-red-500/30">
                                                            <p className="text-[9px] uppercase text-red-400 font-bold mb-1">Caller's Number</p>
                                                            <p className="text-red-400 font-mono font-black text-lg">1800-000-2233</p>
                                                        </div>
                                                        <span className="text-2xl text-slate-600">≠</span>
                                                        <div className="flex-1 text-center p-3 bg-emerald-950/50 rounded-xl border border-emerald-500/30">
                                                            <p className="text-[9px] uppercase text-emerald-400 font-bold mb-1">Official Record</p>
                                                            <p className="text-emerald-400 font-mono font-black text-lg">{pinnedNumber}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-red-400 text-[10px] font-bold uppercase mt-3 text-center animate-pulse">⚠️ SCAM CONFIRMED</p>
                                                </div>
                                                <button
                                                    onClick={handleAbortSession}
                                                    className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-sm"
                                                    disabled={outroStep > 0}
                                                >
                                                    {outroStep >= 1 ? "🛑 SESSION ABORTED" : "🛑 Force Abort Connection"}
                                                </button>
                                                {outroStep === 1 && (
                                                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-red-600/90 text-white p-6 z-[60] animate-in zoom-in-95 duration-300 backdrop-blur-md shadow-[0_0_100px_rgba(220,38,38,0.5)]">
                                                        <h3 className="text-3xl font-black text-center tracking-[0.2em] uppercase italic">CONNECTION ABORTED</h3>
                                                        <p className="text-center font-mono text-xs mt-2 font-bold tracking-widest">THREAT NEUTRALIZED - REMOTE ACCESS TERMINATED</p>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="bg-amber-950/30 p-5 rounded-2xl border border-amber-500/20 text-center">
                                                <p className="text-amber-400 font-black text-xs uppercase tracking-widest mb-2">🔒 Verification Required</p>
                                                <p className="text-slate-400 text-xs leading-relaxed">
                                                    {step < 9
                                                        ? <>Check the <span className="text-amber-300 font-bold">Records notebook</span> on the desk and find the official number.</>
                                                        : step < 11
                                                            ? <>Verify the number on your <span className="text-amber-300 font-bold">phone</span> first, then hang up the call.</>
                                                            : <>Complete verification before aborting.</>
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* NOTEBOOK */}
                {activeZoom === 'notebook' && <NotebookUI />}

                {/* UI OVERLAYS */}
                {isPhoneOpen && <PhoneUI />}
                {step === 12 && renderOutcomeUI()}

                {/* HUD */}
                <div className="absolute top-8 left-8 z-20 flex gap-4">
                    {pinnedNumber && (
                        <div className="bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-4">
                            <span className="font-black text-xs uppercase tracking-widest">📌 Pinned</span>
                            <span className="font-mono text-xl font-black tracking-tight">{pinnedNumber}</span>
                        </div>
                    )}
                    {step >= 7 && step < 12 && (
                        <div className="bg-slate-900 border-2 border-red-500 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-4">
                            <span className="text-red-500 font-black text-xs uppercase tracking-widest animate-pulse">AnyDesk</span>
                            <span className="text-white font-mono text-xl font-black">00:{timeLeft.toString().padStart(2, '0')}</span>
                        </div>
                    )}
                </div>

                {/* PROMPT TOAST */}
                {prompt && (
                    <div className="absolute inset-x-0 bottom-12 flex justify-center z-[1500] pointer-events-none animate-in slide-in-from-bottom duration-500">
                        <div className="bg-slate-900/95 border border-slate-700 text-white px-8 py-4 rounded-2xl shadow-2xl max-w-xl text-center">
                            <p className="text-sm font-medium leading-relaxed">{prompt}</p>
                        </div>
                    </div>
                )}

                {/* FEEDBACK */}
                {feedbackMsg && (
                    <div className="absolute inset-x-0 top-32 flex justify-center z-[1000] pointer-events-none">
                        <div className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl animate-in slide-in-from-top duration-300 border-b-4 ${feedbackMsg.color === 'red' ? 'bg-red-600 border-red-800' : feedbackMsg.color === 'orange' ? 'bg-orange-500 border-orange-700' : feedbackMsg.color === 'emerald' ? 'bg-emerald-600 border-emerald-800' : 'bg-cyan-600 border-cyan-800'} text-white`}>
                            {feedbackMsg.text}
                        </div>
                    </div>
                )}

                {/* CINEMATIC OUTRO OVERLAY */}
                {outroStep >= 2 && (
                    <div className={`absolute inset-0 z-[10000] bg-black flex flex-col items-center justify-center transition-opacity duration-1000 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
                        {outroStep === 2 && (
                            <div className="w-full h-full relative flex items-center justify-center">
                                {/* Background Image dimmed */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center brightness-[0.2]"
                                    style={{ backgroundImage: "url('/assets/temppho.png')" }}
                                />

                                <div className="relative z-20 text-center px-12 max-w-5xl">
                                    <div className="relative h-32 flex items-center justify-center">
                                        {[
                                            "There are scams everywhere... invisible hooks in every corner of the web. Be careful.",
                                            "I should just restart my PC, maybe that will fix the lag.",
                                            "Also, I'm hungry.",
                                            "I should go out for some snacks or something."
                                        ].map((line, idx) => (
                                            <div
                                                key={idx}
                                                className={`absolute inset-0 flex items-center justify-center text-4xl font-serif italic text-white font-bold drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] transition-all duration-1000 text-center ${idx === outroDialogueIdx ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}`}
                                            >
                                                "{line}"
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {outroStep === 3 && (
                            <div className="w-full h-full bg-stone-950 flex flex-col items-center justify-center animate-fadeIn relative overflow-hidden text-center p-8">
                                {/* Scanning line effects */}
                                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%]" />
                                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-cyan-500/10 to-transparent animate-scanLine pointer-events-none" />

                                <div className="flex flex-col items-center relative z-10">
                                    <div className="absolute -inset-20 bg-cyan-500/5 blur-[100px] rounded-full animate-pulse" />

                                    <div className="relative mb-12">
                                        <h2 className="text-white text-5xl md:text-6xl font-black tracking-[0.4em] uppercase relative z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                            Level 6: Tech Support Fraud
                                        </h2>
                                        <div className="absolute top-1/2 left-[-10%] w-[120%] h-2 md:h-3 bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.8)] z-20 skew-y-[-1deg] animate-strikeThrough origin-left" />
                                    </div>

                                    <div className="text-7xl md:text-9xl font-black italic tracking-[0.15em] uppercase relative">
                                        <div className="bg-clip-text text-transparent bg-gradient-to-b from-emerald-300 via-emerald-500 to-emerald-700 animate-surge relative z-10">
                                            COMPLETED
                                        </div>
                                        {/* Chromatic layers */}
                                        <div className="absolute inset-0 text-cyan-400 opacity-40 translate-x-1 -z-10 animate-aberration">COMPLETED</div>
                                        <div className="absolute inset-0 text-red-500 opacity-40 -translate-x-1 -z-10 animate-aberration-alt">COMPLETED</div>
                                    </div>

                                    <div className="mt-16 flex flex-col items-center gap-6">
                                        <div className="h-px w-64 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                                        <div className="text-[10px] font-mono text-zinc-500 tracking-[1em] uppercase opacity-70 animate-pulse">
                                            Forensics Deep Scan // Status: 100% Verified
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => completeLevel(true, 100, 0)}
                                        className="mt-20 group relative overflow-hidden bg-white/5 hover:bg-white/10 text-white font-black px-12 py-5 rounded-2xl text-xs uppercase tracking-[0.3em] transition-all border border-white/10 hover:border-white/20 hover:scale-105 active:scale-95 shadow-2xl"
                                    >
                                        <span className="relative z-10">Proceed to Next Mission</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Global Fade Overlay */}
                <div className={`fixed inset-0 z-[20000] bg-black pointer-events-none transition-opacity duration-1000 ${isFadingOut ? 'opacity-100' : 'opacity-0'}`} />

                {/* CINEMATIC TITLE CARD PHASE */}
                {gameState === 'title_card' && (
                    <div className="absolute inset-0 bg-black z-[9000] flex flex-col items-center justify-center animate-cinematic-sequence overflow-hidden">
                        <div className="flex flex-col items-center relative">
                            {/* Dramatic pulse rings */}
                            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-3xl animate-ping scale-[2.5] opacity-50" />

                            <div className="h-px w-32 bg-gradient-to-r from-transparent via-red-500 to-transparent mb-8 animate-width" />

                            <h2 className="text-white text-6xl font-black tracking-[0.4em] uppercase mb-4 relative opacity-0" style={{ animation: 'fadeIn 1s forwards, surge 3.5s infinite' }}>
                                <span className="relative z-10">Level 6</span>
                                {/* Chromatic aberration layers */}
                                <span className="absolute inset-0 text-red-500 opacity-60 translate-x-1 -z-10 animate-aberration">Level 6</span>
                                <span className="absolute inset-0 text-cyan-400 opacity-60 -translate-x-1 -z-10 animate-aberration-alt">Level 6</span>
                            </h2>

                            <h3 className="text-red-500 text-lg font-mono tracking-[0.8em] uppercase opacity-0 font-bold" style={{ animation: 'fadeIn 1s forwards 1.2s' }}>
                                Tech Support Fraud
                            </h3>

                            <div className="h-px w-32 bg-gradient-to-r from-transparent via-red-500 to-transparent mt-12 animate-width" />

                            {/* Tension metadata */}
                            <div className="mt-8 text-[8px] font-mono text-zinc-800 tracking-widest uppercase animate-pulse">
                                INITIALISING REMOTE ACCESS... [33%] [66%] [99%]
                            </div>
                        </div>
                    </div>
                )}

                <style dangerouslySetInnerHTML={{
                    __html: `
                .animate-cinematic-sequence { animation: cinematic-sequence 3.5s forwards; }
                .animate-width { animation: width 1.5s ease-in-out forwards; }
                .animate-aberration { animation: aberration 1.5s infinite; }
                .animate-aberration-alt { animation: aberration-alt 1.5s infinite; }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes width { from { width: 0; opacity: 0; } to { width: 12rem; opacity: 0.8; } }
                @keyframes surge {
                    0%, 100% { transform: scale(1); filter: brightness(1); }
                    50% { transform: scale(1.08); filter: brightness(1.3); drop-shadow: 0 0 40px rgba(255,255,255,0.4); }
                }
                @keyframes cinematic-sequence {
                    0% { opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { opacity: 0; }
                }
                @keyframes scanLine { from { transform: translateY(-100%); } to { transform: translateY(200%); } }
                @keyframes strikeThrough { from { width: 0; } to { width: 120%; } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes aberration {
                    0%, 100% { transform: translate(0, 0); opacity: 0.6; }
                    25% { transform: translate(-4px, 2px); opacity: 0.8; }
                    50% { transform: translate(4px, -2px); opacity: 0.6; }
                    75% { transform: translate(-2px, -4px); opacity: 0.8; }
                }
                @keyframes aberration-alt {
                    0%, 100% { transform: translate(0, 0); opacity: 0.6; }
                    25% { transform: translate(4px, -2px); opacity: 0.8; }
                    50% { transform: translate(-4px, 2px); opacity: 0.6; }
                    75% { transform: translate(2px, 4px); opacity: 0.8; }
                }
            ` }} />
            </div>
        </div>
    );
};

export default Level6;
