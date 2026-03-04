import React, { useState, useEffect, useRef, useCallback } from 'react';
import Player from '../components/Player';
import { useGameState } from '../context/GameStateContext';

// ═══ CONSTANTS ═══
const ROOM_WIDTH = 1200;
const ROOM_HEIGHT = 800;
const DESK_ZONE = { x: 300, y: 450, w: 400, h: 350 };

const CLUE_DATA = [
    {
        id: 'ad_badge',
        name: 'Sponsored Ad Badge',
        description: 'The tiny "Ad" label indicates this is a paid result, which scammers often buy to appear first.',
        points: 15
    },
    {
        id: 'fake_domain',
        name: 'Inconsistent Domain',
        description: 'sbi-help-service.in is not the official sbi.co.in. Banks use strictly verified domains.',
        points: 15
    },
    {
        id: 'anydesk_source',
        name: 'Untrusted Installer',
        description: 'The source "anydesk-sbi-fix.net" is not the official AnyDesk site. Banks never ask for remote access.',
        points: 20
    },
    {
        id: 'notebook',
        name: 'Credentials Exposure',
        description: 'Writing passwords in a notebook near your webcam allows remote attackers to see them.',
        points: 10
    },
    {
        id: 'thatha_note',
        name: "Thatha's Official List",
        description: 'The verified SBI number (1800-425-3800) contradicts the number from the Google Ad.',
        points: 25
    }
];

const Level6 = () => {
    const { completeLevel, adjustAssets, adjustLives } = useGameState();

    // ═══ STATE ═══
    const [gameState, setGameState] = useState('walk'); // walk, browser, google, phone_call, anydesk_countdown, mini_challenge, outcome
    const [isPhoneOpen, setIsPhoneOpen] = useState(false);
    const [playerPos, setPlayerPos] = useState({ x: 200, y: 400 });
    const [cluesFound, setCluesFound] = useState([]);
    const [anydeskProgress, setAnydeskProgress] = useState(55);
    const [timeLeft, setTimeLeft] = useState(45);
    const [feedbackMsg, setFeedbackMsg] = useState(null);
    const [showDetectiveBoard, setShowDetectiveBoard] = useState(false);
    const [callerIdChoice, setCallerIdChoice] = useState(null);
    const [outcomeType, setOutcomeType] = useState(null); // 'victory' or 'scam'
    const [interactionActive, setInteractionActive] = useState(false);
    const [showVerifyPanel, setShowVerifyPanel] = useState(false);
    const [keys, setKeys] = useState({});

    const timerRef = useRef(null);
    const speechRef = useRef(null);

    // ═══ MOVEMENT LOGIC ═══
    useEffect(() => {
        const handleKeyDown = (e) => setKeys(k => ({ ...k, [e.key.toLowerCase()]: true }));
        const handleKeyUp = (e) => setKeys(k => ({ ...k, [e.key.toLowerCase()]: false }));
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useEffect(() => {
        if (isPhoneOpen || gameState === 'outcome' || gameState === 'mini_challenge') return;
        let animationFrameId;
        const speed = 10;

        const gameLoop = () => {
            setPlayerPos(prev => {
                let newX = prev.x;
                let newY = prev.y;

                if (keys['w'] || keys['arrowup']) newY -= speed;
                if (keys['s'] || keys['arrowdown']) newY += speed;
                if (keys['a'] || keys['arrowleft']) newX -= speed;
                if (keys['d'] || keys['arrowright']) newX += speed;

                newX = Math.max(20, Math.min(newX, ROOM_WIDTH - 60));
                newY = Math.max(220, Math.min(newY, ROOM_HEIGHT - 100));

                const inDesk = (
                    newX > DESK_ZONE.x && newX < DESK_ZONE.x + DESK_ZONE.w &&
                    newY > DESK_ZONE.y && newY < DESK_ZONE.y + DESK_ZONE.h
                );
                setInteractionActive(inDesk);

                return { x: newX, y: newY };
            });
            animationFrameId = requestAnimationFrame(gameLoop);
        };

        animationFrameId = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [keys, isPhoneOpen, gameState]);

    const handleOpenPhone = () => {
        if (gameState !== 'outcome' && gameState !== 'mini_challenge') {
            if (gameState === 'walk') {
                setGameState('browser_timeout');
            }
            setIsPhoneOpen(true);
        }
    };

    // Handle Interaction Key
    useEffect(() => {
        if (keys['e'] && interactionActive && !isPhoneOpen) {
            handleOpenPhone();
            setKeys(k => ({ ...k, 'e': false })); // prevent multi-fire
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [keys, interactionActive, isPhoneOpen, gameState]);

    // ═══ ANYDESK COUNTDOWN ═══
    useEffect(() => {
        if (gameState === 'anydesk_countdown') {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        handleScamTrigger();
                        return 0;
                    }
                    return prev - 1;
                });
                setAnydeskProgress(prev => Math.min(100, prev + 1.2));
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [gameState]);

    const handleScamTrigger = () => {
        setOutcomeType('scam');
        setGameState('outcome');
    };

    const handleClueClick = (clueId) => {
        if (cluesFound.includes(clueId)) return;
        const clue = CLUE_DATA.find(c => c.id === clueId);
        setCluesFound(prev => [...prev, clueId]);
        showFeedback(`New Clue: ${clue.name} (+${clue.points} pts)`, 'cyan');
    };

    const showFeedback = (msg, color = 'cyan') => {
        setFeedbackMsg({ text: msg, color });
        setTimeout(() => setFeedbackMsg(null), 3000);
    };

    const handleDial = () => {
        setGameState('phone_call');
        // Speak Vikram's dialogue using Web Speech API
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(
                "Hello sir, this is Vikram from SBI Senior Technical Support. I can see your net banking session has an issue. Don't worry sir, I am sending you a secure AnyDesk link to patch your device directly. Please accept the link and share the code with me."
            );
            utterance.rate = 0.9;
            utterance.pitch = 0.8;
            utterance.lang = 'en-IN';
            speechRef.current = utterance;
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleHangUp = () => {
        // Stop Vikram's speech
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        if (cluesFound.length >= 3) {
            setIsPhoneOpen(false);
            setOutcomeType('victory');
            setGameState('outcome');
        } else {
            showFeedback("I need more evidence before I hang up and lose the trail...", "orange");
        }
    };

    const handleAbortSession = () => {
        // Stop Vikram's speech
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        clearInterval(timerRef.current);
        setIsPhoneOpen(false);
        setOutcomeType('abort_victory');
        setGameState('outcome');
    };

    const handleMiniChallenge = (choice) => {
        setCallerIdChoice(choice);
        if (choice === 'B') {
            setTimeLeft(prev => prev + 15);
            showFeedback("Correct! Extra time added.", "emerald");
        } else {
            setTimeLeft(prev => Math.max(0, prev - 10));
            showFeedback("Incorrect. Fake number detected.", "red");
        }
        setTimeout(() => setGameState('anydesk_countdown'), 2000);
    };

    // ═══ RENDER HELPERS ═══

    const PhoneContainer = ({ children }) => (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[9999]">
            <div className="w-[340px] h-[640px] bg-slate-900 rounded-[40px] border-[8px] border-slate-800 relative overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col pointer-events-auto">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-xl z-50 flex justify-center items-end pb-1 gap-2">
                    <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                </div>
                {children}

                {/* Home Indicator */}
                <div
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-300 rounded-full cursor-pointer hover:bg-slate-400 transition-colors z-[100]"
                    onClick={(e) => { e.stopPropagation(); setIsPhoneOpen(false); }}
                ></div>
            </div>
            <button
                className="absolute top-8 right-8 text-white text-4xl hover:scale-110 transition-transform font-light z-[10000]"
                onClick={(e) => { e.stopPropagation(); setIsPhoneOpen(false); }}
            >
                ×
            </button>
        </div>
    );

    const GoogleSearchUI = () => (
        <PhoneContainer>
            <div className="flex-1 bg-white flex flex-col font-sans text-slate-900 overflow-y-auto w-full custom-scrollbar">
                <div className="border-b border-slate-200 p-4 sticky top-0 bg-white z-10 pt-10">
                    <div className="flex flex-col gap-3">
                        <div className="text-2xl font-bold text-center">
                            <span className="text-blue-500">G</span><span className="text-red-500">o</span><span className="text-yellow-500">o</span><span className="text-blue-500">g</span><span className="text-green-500">l</span><span className="text-red-500">e</span>
                        </div>
                        <div className="bg-slate-100 rounded-full px-4 py-2 text-xs flex items-center justify-between border border-slate-300">
                            <span className="truncate flex-1 font-medium text-slate-700">SBI net banking help num</span>
                            <span className="text-blue-500 ml-2">🔍</span>
                        </div>
                    </div>
                </div>

                <div className="py-4 px-4 space-y-6 pb-8">
                    {/* SPONSORED AD */}
                    <div className="group">
                        <div className="flex items-center gap-1 mb-1">
                            <span
                                onClick={() => handleClueClick('ad_badge')}
                                className={`text-[9px] bg-emerald-700 text-white px-1 rounded-sm font-bold cursor-help transition-all ${cluesFound.includes('ad_badge') ? 'ring-1 ring-cyan-400' : 'animate-pulse'}`}
                            >
                                Ad
                            </span>
                            <span
                                onClick={() => handleClueClick('fake_domain')}
                                className={`text-[10px] text-slate-700 cursor-help truncate block ${cluesFound.includes('fake_domain') ? 'text-red-500 font-bold' : ''}`}
                            >
                                www.sbi-help-service.in
                            </span>
                        </div>
                        <h3 onClick={handleDial} className="text-sm text-blue-800 hover:underline cursor-pointer mb-1 font-medium leading-tight">
                            SBI Premium Customer Support | Instant Resolution | 1800-000-2233
                        </h3>
                        <p className="text-[11px] text-slate-600 line-clamp-2">Get same-day resolution for net banking issues. Call our senior advisors now.</p>
                    </div>

                    {/* ORGANIC 1 */}
                    <div>
                        <p className="text-[10px] text-slate-700 mb-1 truncate">sbi.co.in › helpdesk</p>
                        <h3 className="text-sm text-blue-800 mb-1 leading-tight">SBI Online Banking Help Centre</h3>
                        <p className="text-[11px] text-slate-600 line-clamp-2">State Bank of India official helpline for all Internet Banking related queries.</p>
                    </div>

                    {/* ORGANIC 2 */}
                    <div>
                        <p className="text-[10px] text-slate-700 mb-1 truncate">bankbazaar.com › sbi-customer-care</p>
                        <h3 className="text-sm text-blue-800 mb-1 leading-tight">SBI Customer Care: 1800-425-3800</h3>
                        <p className="text-[11px] text-slate-600 line-clamp-2">Find the latest official toll-free numbers for State Bank of India.</p>
                    </div>
                </div>
            </div>
        </PhoneContainer>
    );

    const PhoneCallUI = () => (
        <PhoneContainer>
            <div className="flex-1 bg-[#0a0a0c] w-full h-full flex flex-col items-center p-6 pt-16">
                <div className="w-20 h-20 bg-slate-700 rounded-full mb-3 flex items-center justify-center text-3xl text-white font-bold border-2 border-slate-600 shadow-lg">
                    V
                </div>
                <h2 className="text-white text-xl font-bold mb-1">Vikram</h2>
                <p className="text-slate-400 text-xs mb-6 animate-pulse">Calling from SBI Support...</p>

                <div className="flex-1 w-full flex flex-col justify-center gap-4">
                    <div className="bg-slate-800/50 p-3 rounded-lg border border-white/5 italic text-[11px] text-slate-300 text-center leading-relaxed">
                        "This is Vikram from Senior Tech. I see your session issue. I am sending you a secure AnyDesk link to patch your device directly."
                    </div>

                    {gameState !== 'anydesk_countdown' ? (
                        <button
                            onClick={() => {
                                setGameState('anydesk_countdown');
                                setIsPhoneOpen(false);
                                handleClueClick('anydesk_source');
                                showFeedback("AnyDesk download started. Search the room for evidence!", "orange");
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 text-sm mt-4"
                        >
                            <span>⬇️</span> Accept Link
                        </button>
                    ) : (
                        <div className="bg-orange-900/40 border border-orange-500/50 p-3 rounded-xl flex items-center justify-center gap-2 text-orange-400 font-bold text-sm mt-4">
                            <span>⚠️</span> Remote Session Active
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-3 gap-6 mb-8 w-full px-4">
                    <div className="flex flex-col items-center gap-1 opacity-40">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-lg">🔇</div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-lg">⌨️</div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-lg">🔊</div>
                    </div>
                </div>

                <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-xl cursor-pointer hover:bg-red-500 transition-colors shadow-lg active:scale-90 mb-4"
                    onClick={handleHangUp}>
                    📞
                </div>
            </div>
        </PhoneContainer>
    );

    const renderCountdownUI = () => (
        <div key="countdown-ui" className="fixed top-8 left-8 z-[30000] w-80 animate-in fade-in slide-in-from-left duration-500 pointer-events-auto">
            <div className="bg-slate-900/95 backdrop-blur-md border-2 border-red-500/60 p-6 rounded-2xl shadow-[0_20px_60px_rgba(220,38,38,0.3),inset_0_1px_0_rgba(255,255,255,0.05)]">
                {/* Danger glow pulse */}
                <div className="absolute -inset-1 bg-red-500/10 rounded-2xl blur-xl animate-pulse pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-red-400 text-sm font-black tracking-widest uppercase mb-1 flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                ANYDESK SESSION
                            </h2>
                            <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Active Connection</span>
                        </div>
                        <div className="text-right">
                            <div className={`text-3xl font-mono font-black ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`} style={{ textShadow: timeLeft < 10 ? '0 0 20px rgba(239,68,68,0.6)' : '0 0 15px rgba(34,211,238,0.4)' }}>
                                00:{timeLeft.toString().padStart(2, '0')}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 mb-4">
                        <div>
                            <div className="flex justify-between text-[10px] mb-1.5 font-bold">
                                <span className="text-slate-400 uppercase tracking-wider">Downloading Patches</span>
                                <span className="text-cyan-400 font-mono">{Math.round(anydeskProgress)}%</span>
                            </div>
                            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-red-600 via-red-500 to-orange-400 transition-all duration-1000 relative"
                                    style={{ width: `${anydeskProgress}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-yellow-400 font-bold mb-4 uppercase tracking-widest text-center animate-pulse bg-yellow-500/5 py-2 rounded-lg border border-yellow-500/20">
                        ⚠️ PROMPT: Search room for evidence!
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={(e) => { e.stopPropagation(); setShowVerifyPanel(true); }}
                            className="bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-lg transition-all border border-slate-600 shadow-md hover:shadow-lg hover:border-cyan-500/50 pointer-events-auto"
                        >
                            🔍 Verify Identity
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleAbortSession(); }}
                            className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-[0_4px_15px_rgba(220,38,38,0.4)] active:scale-95 hover:shadow-[0_6px_25px_rgba(220,38,38,0.5)] border border-red-500/50 pointer-events-auto"
                        >
                            🛑 Abort Session
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const VerifyIdentityPanel = () => {
        if (!showVerifyPanel) return null;
        return (
            <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowVerifyPanel(false)}>
                <div className="max-w-lg w-full bg-slate-900 border-2 border-cyan-500/30 p-8 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                    <div className="text-center mb-6">
                        <span className="text-cyan-500 text-xs font-bold uppercase tracking-[0.3em] mb-2 block">Caller Identity Report</span>
                        <h2 className="text-white text-2xl font-black">WHO IS "VIKRAM"?</h2>
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Caller Name</span>
                            <span className="text-white font-black">"Vikram" — SBI Senior Tech Support</span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Call Source</span>
                            <span className="text-red-400 font-black">1800-000-2233 (Google Sponsored Ad)</span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Real SBI Helpline</span>
                            <span className="text-emerald-400 font-black">1800-425-3800 (from sbi.co.in)</span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Requesting</span>
                            <span className="text-red-400 font-black">AnyDesk remote access to your device</span>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Download Source</span>
                            <span className="text-red-400 font-black">anydesk-sbi-fix.net (NOT official anydesk.com)</span>
                        </div>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl mb-6">
                        <p className="text-red-200 text-sm leading-relaxed">⚠️ Banks NEVER ask to remotely access your device. "Vikram" is not a real SBI employee. His number came from a paid Google Ad, not the official SBI website.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => { setShowVerifyPanel(false); handleHangUp(); }} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl text-sm transition-all">
                            🛡️ Hang Up Call
                        </button>
                        <button onClick={() => setShowVerifyPanel(false)} className="bg-slate-800 hover:bg-slate-700 text-white font-black py-3 rounded-xl text-sm transition-all border border-white/10">
                            Back
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const MiniChallengeUI = () => (
        <div className="absolute inset-0 z-[70] bg-slate-950 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-slate-900 border border-cyan-500/30 p-12 rounded-2xl shadow-[0_0_100px_rgba(34,211,238,0.1)]">
                <div className="text-center mb-10">
                    <span className="text-cyan-500 text-xs font-bold uppercase tracking-[0.3em] mb-4 block">Identity Verification Protocol</span>
                    <h2 className="text-white text-4xl font-black mb-4">CALLER ID TEST</h2>
                    <p className="text-slate-400 leading-relaxed">
                        Identify the <span className="text-emerald-400 font-bold underline decoration-2 underline-offset-4">official SBI Helpline</span> from the records below.
                        Incorrect selection will compromise your session speed.
                    </p>
                </div>

                <div className="flex flex-col gap-4">
                    {[
                        { id: 'A', num: '1800-000-2233', source: 'Google Sponsored Ad' },
                        { id: 'B', num: '1800-425-3800', source: 'sbi.co.in / Thatha\'s Note' },
                        { id: 'C', num: '1800-111-1090', source: 'WhatsApp Forward' }
                    ].map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => handleMiniChallenge(opt.id)}
                            className={`w-full p-6 bg-slate-800 border-2 rounded-xl text-left transition-all group ${callerIdChoice === opt.id
                                ? (opt.id === 'B' ? 'border-emerald-500 bg-emerald-900/10' : 'border-red-500 bg-red-900/10')
                                : 'border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/80'
                                }`}
                        >
                            <div className="flex justify-between items-center mb-2">
                                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${callerIdChoice === opt.id ? 'bg-white text-slate-900' : 'bg-slate-700 text-slate-400 group-hover:bg-cyan-500 group-hover:text-white'
                                    }`}>
                                    {opt.id}
                                </span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{opt.source}</span>
                            </div>
                            <div className="text-2xl font-mono font-bold text-white tracking-wider">{opt.num}</div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderOutcomeUI = () => (
        <div key="outcome-ui" className="absolute inset-0 z-[20000] bg-slate-950 flex flex-col items-center justify-start py-12 px-8 overflow-y-auto animate-fade-in pointer-events-auto custom-scrollbar">
            {outcomeType === 'victory' ? (
                <div className="max-w-3xl text-center">
                    <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-[0_0_50px_rgba(16,185,129,0.4)]">🏆</div>
                    <h1 className="text-6xl font-black text-white mb-6 tracking-tight italic">THATHA'S LEGACY</h1>
                    <p className="text-xl text-slate-300 leading-relaxed mb-12">
                        You recognized the signs. By relying on official records rather than sponsored search ads,
                        you prevented a complete remote takeover of your accounts. The call center was traced to Hyderabad
                        and shut down because of your report.
                    </p>
                    <div className="grid grid-cols-3 gap-6 mb-12">
                        <div className="bg-slate-900 p-6 rounded-2xl border border-emerald-500/30">
                            <span className="text-slate-500 text-[10px] font-bold uppercase block mb-1">Safety Bonus</span>
                            <span className="text-3xl font-black text-emerald-400">+100 PTS</span>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-2xl border border-indigo-500/30">
                            <span className="text-slate-500 text-[10px] font-bold uppercase block mb-1">New Rank</span>
                            <span className="text-3xl font-black text-indigo-400">JUNIOR DETECTIVE</span>
                        </div>
                        <div className="bg-slate-900 p-6 rounded-2xl border border-cyan-500/30">
                            <span className="text-slate-500 text-[10px] font-bold uppercase block mb-1">Assets Saved</span>
                            <span className="text-3xl font-black text-cyan-400">₹4,20,000</span>
                        </div>
                    </div>
                    <button
                        onClick={() => completeLevel(true, 100, 0)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-12 py-4 rounded-xl text-lg tracking-widest transition-all shadow-xl shadow-emerald-900/20 active:scale-95 pointer-events-auto"
                    >
                        CONTINUE INVESTIGATION
                    </button>
                </div>
            ) : outcomeType === 'abort_victory' ? (
                <div className="max-w-3xl text-center relative">
                    {/* Background glow */}
                    <div className="absolute -inset-20 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
                    <div className="relative z-10">
                        <div className="w-28 h-28 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center text-6xl mx-auto mb-8 shadow-[0_0_60px_rgba(16,185,129,0.5),0_0_120px_rgba(34,211,238,0.2)] animate-bounce">
                            🛡️
                        </div>
                        <div className="inline-block bg-emerald-500/20 border border-emerald-500/40 px-4 py-1.5 rounded-full mb-6">
                            <span className="text-emerald-400 text-xs font-black uppercase tracking-[0.3em]">Scam Detected & Blocked</span>
                        </div>
                        <h1 className="text-5xl font-black text-white mb-4 tracking-tight uppercase" style={{ textShadow: '0 0 40px rgba(16,185,129,0.3)' }}>
                            YOU SUCCESSFULLY FOUND THAT ANYDESK WAS SCAM!
                        </h1>
                        <p className="text-2xl text-emerald-100 leading-relaxed mb-6 font-black italic">
                            "AnyDesk was a SCAM from Vikram to steal money!"
                        </p>
                        <p className="text-lg text-emerald-300/80 leading-relaxed mb-10 max-w-xl mx-auto">
                            By aborting the session in time, you prevented Vikram from gaining remote access to your device. No bank employee will ever ask for remote access software!
                        </p>

                        <div className="grid grid-cols-3 gap-5 mb-10">
                            <div className="bg-slate-900/80 p-5 rounded-2xl border border-emerald-500/30 shadow-[0_4px_20px_rgba(16,185,129,0.1)]">
                                <span className="text-slate-500 text-[10px] font-bold uppercase block mb-2 tracking-wider">Quick Thinking</span>
                                <span className="text-3xl font-black text-emerald-400">+80 PTS</span>
                            </div>
                            <div className="bg-slate-900/80 p-5 rounded-2xl border border-cyan-500/30 shadow-[0_4px_20px_rgba(34,211,238,0.1)]">
                                <span className="text-slate-500 text-[10px] font-bold uppercase block mb-2 tracking-wider">Threat Blocked</span>
                                <span className="text-3xl font-black text-cyan-400">ANYDESK</span>
                            </div>
                            <div className="bg-slate-900/80 p-5 rounded-2xl border border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.1)]">
                                <span className="text-slate-500 text-[10px] font-bold uppercase block mb-2 tracking-wider">Total Assets Saved</span>
                                <span className="text-3xl font-black text-amber-400">₹4,20,000</span>
                            </div>
                        </div>

                        <div className="bg-emerald-950/30 border border-emerald-500/20 p-5 rounded-xl mb-10 max-w-lg mx-auto">
                            <p className="text-emerald-200 text-sm leading-relaxed">
                                🔒 <span className="font-bold">Summary:</span> Vikram tried to use AnyDesk to take control and steal money. By clicking Abort, you successfully saved your entire account balance of <span className="text-emerald-400 font-bold">₹4,20,000</span> from being stolen!
                            </p>
                        </div>

                        <button
                            onClick={() => { console.log('Continue investigation clicked'); completeLevel(true, 80, 0); }}
                            className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black px-14 py-4 rounded-xl text-lg tracking-widest transition-all shadow-[0_8px_30px_rgba(16,185,129,0.3)] active:scale-95 hover:shadow-[0_12px_40px_rgba(16,185,129,0.4)] pointer-events-auto"
                        >
                            🎯 CONTINUE INVESTIGATION
                        </button>
                    </div>
                </div>
            ) : (
                <div className="max-w-2xl text-center">
                    <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-[0_0_50px_rgba(220,38,38,0.4)] animate-pulse">💸</div>
                    <h1 className="text-6xl font-black text-white mb-6 uppercase tracking-tighter">TOTAL LOSS</h1>
                    <p className="text-xl text-slate-400 leading-relaxed mb-12">
                        By granting AnyDesk access, Vikram took full control of your device.
                        In under 3 minutes, your registered mobile number was changed and your savings
                        were liquidated into untraceable mule accounts.
                    </p>
                    <div className="bg-red-950/20 border border-red-900/50 p-6 rounded-xl mb-12">
                        <p className="text-red-400 font-bold mb-4">Financial Consequences:</p>
                        <div className="flex justify-between text-2xl font-mono text-red-500 mb-2">
                            <span>ASSET LIQUIDATION</span>
                            <span>- ₹4,20,000</span>
                        </div>
                        <div className="h-px bg-red-900/50 my-4" />
                        <div className="flex justify-between text-sm text-red-400/60 uppercase font-black tracking-widest">
                            <span>Lives Remaining</span>
                            <span>Loss of 1 Life</span>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            adjustAssets(-420000);
                            adjustLives(-1);
                            setGameState('walk');
                            setTimeLeft(45);
                            setAnydeskProgress(0);
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-white font-black px-12 py-4 rounded-xl text-lg tracking-widest transition-all border border-slate-700 pointer-events-auto"
                    >
                        TRY AGAIN
                    </button>
                </div>
            )}
        </div>
    );

    const DetectiveBoard = () => {
        if (!showDetectiveBoard) return null;

        // Filter cluesFound to only include clues that exist in CLUE_DATA
        const validCluesFound = cluesFound.filter(id => CLUE_DATA.some(c => c.id === id));
        const clueCount = validCluesFound.length;

        const getPos = (i) => {
            const grid = [
                { x: 140, y: 180 }, { x: 380, y: 180 }, { x: 140, y: 340 }, { x: 380, y: 340 }, { x: 260, y: 480 }
            ];
            return grid[i % grid.length];
        };

        return (
            <div
                className="fixed inset-y-8 right-8 w-[600px] bg-amber-100 rounded-lg shadow-[-20px_0_50px_rgba(0,0,0,0.8)] z-[9998] p-8 flex flex-col border-[16px] border-[#5c3a21] overflow-hidden"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23a)' opacity='.2'/%3E%3C/svg%3E")`,
                    backgroundColor: '#e6c280'
                }}
            >
                {/* Draw Red Strings Between Discovered Clues */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    {validCluesFound.map((clueId, idx) => {
                        if (idx > 0) {
                            const clueIdx = CLUE_DATA.findIndex(c => c.id === clueId);
                            const prevClueIdx = CLUE_DATA.findIndex(c => c.id === validCluesFound[idx - 1]);
                            if (clueIdx === -1 || prevClueIdx === -1) return null;
                            const prev = getPos(prevClueIdx);
                            const curr = getPos(clueIdx);
                            return <line key={`line-${idx}`} x1={prev.x} y1={prev.y} x2={curr.x} y2={curr.y} stroke="rgba(220,38,38,0.8)" strokeWidth="3" style={{ filter: 'drop-shadow(2px 4px 2px rgba(0,0,0,0.5))' }} />;
                        }
                        return null;
                    })}
                </svg>

                {/* Header Label */}
                <div className="flex justify-between items-center mb-4 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-sm shadow-md transform -rotate-2 border border-stone-300 self-start">
                    <h2 className="text-2xl font-black text-stone-800 uppercase tracking-widest font-mono">
                        📌 INVESTIGATION BOARD
                    </h2>
                    <button className="text-red-600 hover:text-red-800 font-black text-2xl ml-6 transition-colors" onClick={() => setShowDetectiveBoard(false)}>✖</button>
                </div>

                {/* Clue Polaroids - scattered on board */}
                {CLUE_DATA.map((clue, idx) => {
                    const found = validCluesFound.includes(clue.id);
                    const pos = getPos(idx);

                    return (
                        <div
                            key={clue.id}
                            className={`absolute bg-yellow-50 p-4 shadow-xl w-44 border z-10 flex flex-col transition-all duration-300 ${found ? 'border-yellow-200 opacity-100 shadow-[0_8px_25px_rgba(0,0,0,0.3)]' : 'border-stone-300 opacity-30 grayscale'}`}
                            style={{
                                left: pos.x - 88,
                                top: pos.y - 48,
                                transform: `rotate(${(idx % 2 === 0 ? -1 : 1) * ((idx * 2) % 6 + 2)}deg)`
                            }}
                        >
                            {/* Red Pin Head */}
                            <div className={`absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full shadow-[2px_4px_4px_rgba(0,0,0,0.5)] border flex items-center justify-center ${found ? 'bg-red-600 border-red-800' : 'bg-stone-400 border-stone-500'}`}>
                                <div className="w-2 h-2 rounded-full bg-white/40 absolute top-0.5 right-1"></div>
                            </div>

                            <h4 className="font-bold text-red-800 tracking-wider mb-2 text-xs leading-tight border-b-2 border-red-800/20 pb-2 uppercase">{clue.name}</h4>
                            {found ? (
                                <>
                                    <p className="text-[10px] text-stone-700 font-mono leading-tight">{clue.description}</p>
                                    <span className="text-[10px] text-emerald-600 font-bold mt-2">+{clue.points} PTS</span>
                                </>
                            ) : (
                                <p className="text-[10px] text-stone-500 italic">???</p>
                            )}
                        </div>
                    );
                })}

                {/* Footer Suspicion Meter */}
                <div className="absolute bottom-6 left-6 right-6 bg-zinc-900/95 backdrop-blur-sm rounded-xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-10 border-2 border-zinc-700">
                    <h3 className="text-xs text-zinc-400 uppercase font-mono mb-2 flex justify-between tracking-wider">
                        <span className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${clueCount >= 3 ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500'}`} />
                            Threat Intelligence Meter
                        </span>
                        <span style={{ color: clueCount >= 3 ? '#22c55e' : '#eab308' }}>{clueCount}/5 CLUES</span>
                    </h3>
                    <div className="w-full h-4 bg-zinc-950 rounded-full overflow-hidden shadow-inner">
                        <div
                            className="h-full transition-all duration-500 rounded-full"
                            style={{
                                width: `${(clueCount / 5) * 100}%`,
                                background: clueCount >= 3
                                    ? 'linear-gradient(90deg, #22c55e, #10b981)'
                                    : 'linear-gradient(90deg, #eab308, #f59e0b)',
                                boxShadow: clueCount >= 3
                                    ? '0 0 12px rgba(34,197,94,0.5)'
                                    : '0 0 8px rgba(234,179,8,0.4)'
                            }}
                        ></div>
                    </div>
                    {clueCount >= 3 && (
                        <p className="text-emerald-400 text-[10px] mt-2 font-bold uppercase tracking-widest text-center animate-pulse">AUTHORIZATION TO HANG UP GRANTED</p>
                    )}
                </div>
            </div>
        );
    };

    const BrowserTimeoutScreen = () => (
        <PhoneContainer>
            <div className="flex-1 bg-slate-100 flex flex-col items-center justify-center p-6 text-center font-sans w-full">
                <div className="text-5xl mb-6">🚫</div>
                <h1 className="text-xl font-bold text-slate-800 mb-2">Connection not private</h1>
                <p className="text-sm text-slate-600 mb-6">
                    Attackers might be trying to steal info from <br /><span className="font-bold">retail.onlinesbi.sbi</span>
                </p>
                <div className="bg-slate-200/50 p-2 rounded mb-6 font-mono text-[10px] text-slate-500 border-l-2 border-slate-400 w-full text-left overflow-hidden text-clip">
                    NET::ERR_SSL_PROTOCOL_ERROR
                </div>
                <button
                    onClick={() => setGameState('google')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg text-sm"
                >
                    Search Google for Help
                </button>
            </div>
        </PhoneContainer>
    );

    return (
        <div className="w-full h-full flex items-center justify-center bg-[#020617] p-4 overflow-hidden relative">
            {/* ═══ WORLD CONTENT (ROOM) ═══ */}
            <div
                className="relative bg-[#0f172a] border-x-[16px] border-t-[16px] border-slate-950 shadow-[0_0_120px_rgba(0,0,0,0.8)] overflow-hidden"
                style={{ width: ROOM_WIDTH, height: ROOM_HEIGHT }}
            >
                {/* ═══ BACKGROUND ART (CSS ONLY) ═══ */}
                <div className="absolute inset-0 z-0">
                    {/* Floor Area - Polished Dark Wood */}
                    <div className="absolute inset-x-0 bottom-0 h-3/4 bg-[#1e1c18]" style={{
                        backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(0,0,0,0.2) 38px, rgba(0,0,0,0.2) 40px)`
                    }} />

                    {/* Wall Area - Industrial Cool Blue */}
                    <div className="absolute inset-x-0 top-0 h-1/4 bg-[#233547] border-b-[12px] border-slate-800 shadow-[0_10px_40px_rgba(0,0,0,0.5)]" />

                    {/* Industrial Window (Left Side) */}
                    <div className="absolute z-5 bg-[#1e293b] border-x-[16px] border-t-[16px] border-[#8da5b2] shadow-[inset_0_0_50px_rgba(0,0,0,0.8),0_10px_30px_rgba(0,0,0,0.6)] overflow-hidden" style={{ left: 60, top: 0, width: 220, height: 180 }}>
                        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] to-[#1e3a8a]"></div>
                        <div className="absolute bottom-0 left-0 right-0 h-[60px] flex items-end gap-[1px]">
                            {[30, 50, 20, 70, 40, 35, 60, 25].map((h, i) => (
                                <div key={i} className={`flex-1 bg-[#090e1a] flex flex-wrap gap-1 p-1 items-start justify-center`} style={{ height: h }}>
                                    {Math.random() > 0.6 && <div className="w-1.5 h-1.5 bg-yellow-100/80 rounded-sm shadow-[0_0_5px_rgba(254,240,138,0.8)]"></div>}
                                </div>
                            ))}
                        </div>
                        <div className="absolute top-0 bottom-0 left-1/2 w-[10px] bg-[#8da5b2] -translate-x-1/2 shadow-xl"></div>
                        {/* Garden hint through blur */}
                        <div className="absolute inset-4 bg-emerald-500/10 blur-xl animate-pulse" />
                    </div>

                    {/* PREMIUM SERVER RACK */}
                    <div className="absolute z-10 bg-[#1e293b] border-[6px] border-[#0f172a] shadow-[0_20px_50px_rgba(0,0,0,0.7)] rounded-t-sm flex flex-col p-2 gap-2" style={{ left: 320, top: 40, width: 100, height: 280 }}>
                        <div className="h-5 bg-black rounded-sm flex items-center px-1.5 gap-1 uppercase tracking-widest text-[5px]">
                            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-slate-400 font-bold">SERVER_01</span>
                        </div>
                        <div className="flex-1 bg-black rounded-sm p-1.5 flex flex-col gap-1.5 overflow-hidden border border-[#0f172a] shadow-inner">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="flex flex-col gap-[2px]">
                                    <div className="flex gap-1 items-center">
                                        <div className={`w-1 h-1 rounded-full ${i % 3 === 0 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                                        <div className="flex-1 h-0.5 bg-slate-800" />
                                    </div>
                                    <div className="flex gap-1 items-center">
                                        <div className={`w-1 h-1 rounded-full ${i % 2 === 0 ? 'bg-cyan-400 animate-pulse' : 'bg-blue-500'}`} />
                                        <div className="flex-1 h-0.5 bg-slate-800" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        {/* Glowing Network Cables in a Tray */}
                        <div className="h-[40px] bg-[#0f172a] rounded-sm mt-1 p-1 flex justify-evenly items-start border border-[#1e293b] relative">
                            <div className="w-1.5 h-full bg-blue-500/80 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                            <div className="w-1 h-full bg-emerald-500/80 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                            <div className="w-1.5 h-full bg-amber-500/80 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                        </div>
                    </div>

                    {/* Bookshelves */}
                    {[800, 950].map((x, idx) => (
                        <div key={idx} className="absolute z-10 bg-[#e08e50] border-[10px] border-[#b86b35] shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col justify-evenly p-2" style={{ left: x, top: 40, width: 120, height: 350 }}>
                            <div className="w-full h-[8px] bg-[#9c5525] shadow-sm"></div>
                            <div className="flex items-end h-[50px] px-1 gap-1">
                                <div className="w-3 h-8 bg-red-600 shadow-sm border-l border-white/20"></div><div className="w-4 h-10 bg-blue-600 shadow-sm border-l border-white/20"></div><div className="w-3 h-12 bg-yellow-500 ml-1 shadow-sm border-l border-white/20"></div>
                            </div>
                            <div className="w-full h-[8px] bg-[#9c5525] shadow-sm"></div>
                            <div className="flex items-end h-[50px] px-1 gap-1 justify-end">
                                <div className="w-5 h-10 bg-emerald-600 shadow-sm border-l border-white/20"></div><div className="w-3 h-8 bg-purple-600 shadow-sm border-l border-white/20"></div>
                            </div>
                            <div className="w-full h-[8px] bg-[#9c5525] shadow-sm"></div>
                            <div className="flex items-end h-[50px] px-1 gap-1">
                                <div className="w-4 h-12 bg-cyan-600 shadow-sm border-l border-white/20"></div><div className="w-3 h-10 bg-red-500 shadow-sm border-l border-white/20"></div><div className="w-5 h-8 bg-slate-600 ml-2 shadow-sm border-l border-white/20"></div>
                            </div>
                            <div className="w-full h-[8px] bg-[#9c5525] shadow-sm"></div>
                        </div>
                    ))}

                    {/* MODEM / ROUTER on top of right bookshelf — decoration only */}
                    <div
                        className="absolute z-20"
                        style={{ left: 960, top: 20, width: 80, height: 30 }}
                    >
                        <div className="w-full h-full bg-zinc-800 rounded border-2 border-zinc-700 flex items-center justify-between px-2 shadow-lg">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-orange-400 rounded-full shadow-[0_0_6px_orange] animate-pulse" />
                                <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_6px_green]" style={{ animationDelay: '0.5s' }} />
                            </div>
                            <div className="text-[5px] text-zinc-400 font-mono font-bold">ROUTER</div>
                        </div>
                    </div>

                    {/* THE PREMIUM L-SHAPED DESK (Veneer Walnut) */}
                    <div className="absolute z-10" style={{ left: 300, top: 450, width: 400, height: 250 }}>
                        {/* Shadow underneath desk */}
                        <div className="absolute -inset-10 top-[140px] bg-black/60 blur-2xl z-[-1] rounded-[100px]"></div>

                        {/* Main Desk Board */}
                        <div className="absolute right-0 top-0 w-full h-[140px] bg-[#e08e50] shadow-[0_40px_80px_rgba(0,0,0,0.9)] rounded-sm border-b-[16px] border-[#b86b35] border-x-[12px]"></div>

                        {/* L-Return (Left side extension) */}
                        <div className="absolute left-0 top-[140px] w-[140px] h-[120px] bg-[#e08e50] shadow-[0_40px_80px_rgba(0,0,0,0.9)] rounded-b-sm border-b-[16px] border-[#b86b35] border-x-[12px]"></div>

                        {/* Smartphone on Desk */}
                        <div className="absolute left-[200px] top-[60px] -translate-x-1/2 z-20 group flex flex-col items-center">
                            <div
                                onClick={(e) => { e.stopPropagation(); handleOpenPhone(); }}
                                className="w-[45px] h-[85px] bg-[#0f172a] border-[3px] border-[#334155] rounded-lg shadow-2xl relative flex flex-col justify-between items-center p-1 rotate-[12deg] transition-all hover:-translate-y-2 cursor-pointer z-40 hover:ring-2 hover:ring-cyan-500"
                            >
                                {/* Notch/Speaker */}
                                <div className="w-4 h-1 bg-black rounded-full mt-1"></div>
                                {/* Screen Glow */}
                                <div className="w-full h-full bg-slate-800/80 mt-1 mb-1 rounded-sm flex flex-col items-center justify-center border border-slate-600 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]">
                                    <span className="text-red-500/80 text-[10px] font-black animate-pulse">!</span>
                                </div>
                                <div className="w-3 h-0.5 bg-slate-600 rounded-full mb-1"></div>
                            </div>

                            {/* Sticky Note - Refined */}
                            <div
                                onClick={(e) => { e.stopPropagation(); handleClueClick('thatha_note'); }}
                                className={`absolute bottom-0 -left-[40px] w-16 h-16 bg-amber-200 shadow-2xl rotate-[12deg] p-2 cursor-help transition-all hover:scale-110 active:scale-95 z-30 pointer-events-auto flex flex-col items-center border-t-[3px] border-amber-300 ${cluesFound.includes('thatha_note') ? 'ring-2 ring-emerald-500' : 'hover:ring-2 ring-white/50 animate-pulse'}`}
                            >
                                <span className="text-[6px] font-black text-slate-800 uppercase tracking-tighter">Support:</span>
                                <span className="text-[8px] text-indigo-700 font-bold mt-1">1800-425-3800</span>
                                <div className="absolute top-1 left-0 right-0 h-px bg-slate-900/10" />
                            </div>
                        </div>

                        {/* Professional Coffee (Moved to top-left of main desk) */}
                        <div className="absolute left-6 top-6 w-8 h-12 bg-white/20 backdrop-blur-sm rounded-b-xl border-x-2 border-white/10 shadow-2xl z-20 pointer-events-none">
                            <div className="absolute -top-1 left-0 right-0 h-2 bg-amber-900/40 rounded-full blur-[1px]" />
                            <div className="absolute inset-x-1.5 bottom-1.5 h-6 bg-gradient-to-t from-amber-900/60 to-transparent rounded-b-lg" />
                        </div>

                        {/* Modern Lamp (Moved to top-right of main desk) */}
                        <div className="absolute right-8 -top-[70px] flex flex-col items-center z-20 pointer-events-none">
                            {/* Spherical Desk Lamp */}
                            <div className="relative flex items-center justify-center">
                                <div className="w-[40px] h-[40px] bg-white rounded-full shadow-[inset_-5px_-5px_10px_rgba(0,0,0,0.2),0_10px_20px_rgba(0,0,0,0.6)] border border-slate-200"></div>
                                <div className="absolute -bottom-8 w-1.5 h-10 bg-slate-400 rounded-full shadow-md z-[-1]"></div>
                                {/* Ambient Lamp Glow */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-amber-400/10 blur-[30px] rounded-full pointer-events-none"></div>
                            </div>
                        </div>

                        {/* Forensic Papers (Moved to the L-return extension) */}
                        <div
                            onClick={(e) => { e.stopPropagation(); handleClueClick('notebook'); }}
                            className={`absolute left-4 top-[150px] w-24 h-32 bg-slate-50 border border-slate-300 shadow-2xl rotate-[5deg] p-3 text-[7px] font-mono text-slate-600 cursor-help transition-all hover:scale-110 active:scale-95 z-30 pointer-events-auto ${cluesFound.includes('notebook') ? 'ring-2 ring-cyan-500 bg-cyan-50' : 'hover:ring-2 ring-white/50 animate-pulse'}`}
                        >
                            <div className="border-b border-slate-400 mb-2 pb-1 text-slate-900 font-black tracking-widest uppercase text-[7px]">Verification</div>
                            <div className="space-y-1 text-[5px]">
                                <p>Bank: SBI Main</p>
                                <p>User: RAJAN_V</p>
                                <p>Token: ***_92</p>
                            </div>
                            <div className="absolute bottom-2 right-2 text-emerald-600 font-black rotate-[-15deg] border border-emerald-600 px-1 rounded-sm opacity-60 text-[5px]">SECURED</div>
                        </div>
                    </div>
                </div>

                <Player x={playerPos.x} y={playerPos.y} />
            </div>

            {/* ═══ UI OVERLAYS (STATE MACHINE) ═══ */}
            {isPhoneOpen && gameState === 'browser_timeout' && <BrowserTimeoutScreen />}
            {isPhoneOpen && gameState === 'google' && <GoogleSearchUI />}
            {isPhoneOpen && (gameState === 'phone_call' || gameState === 'anydesk_countdown') && <PhoneCallUI />}
            {gameState === 'anydesk_countdown' && renderCountdownUI()}
            <VerifyIdentityPanel />
            {gameState === 'mini_challenge' && <MiniChallengeUI />}
            {gameState === 'outcome' && renderOutcomeUI()}

            {/* ═══ DETECTIVE BOARD & TOGGLE ═══ */}
            <DetectiveBoard />

            {gameState !== 'outcome' && (
                <button
                    onClick={() => setShowDetectiveBoard(!showDetectiveBoard)}
                    className="fixed bottom-8 left-8 bg-zinc-900 border-2 border-zinc-700 hover:border-amber-500 text-amber-500 rounded-full w-16 h-16 flex items-center justify-center text-3xl shadow-[0_10px_20px_rgba(0,0,0,0.5)] z-[150] transition-all hover:scale-110 group"
                >
                    🔍
                    {cluesFound.length > 0 && !showDetectiveBoard && (
                        <div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                            {cluesFound.length}
                        </div>
                    )}
                </button>
            )}

            {/* ═══ INTERACTION PROMPTS ═══ */}
            {
                interactionActive && gameState === 'walk' && !isPhoneOpen && (
                    <div className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-cyan-500 p-4 rounded-xl flex items-center gap-4 animate-bounce z-[200] shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                        <span className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center font-black text-white shadow-lg shadow-cyan-500/50">E</span>
                        <span className="text-white font-black tracking-widest text-sm uppercase">Check Smartphone</span>
                    </div>
                )
            }
            {
                gameState !== 'walk' && gameState !== 'outcome' && gameState !== 'mini_challenge' && !isPhoneOpen && (
                    <div
                        onClick={handleOpenPhone}
                        className="fixed bottom-8 right-8 bg-slate-900 border-2 border-slate-600 hover:border-cyan-500 p-4 rounded-2xl flex items-center gap-3 cursor-pointer z-[150] transition-all hover:scale-105 shadow-2xl group"
                    >
                        <span className="text-3xl drop-shadow-lg group-hover:animate-pulse">📱</span>
                        <div className="flex flex-col">
                            <span className="text-cyan-400 font-black tracking-widest text-xs uppercase cursor-pointer">Open Phone</span>
                            <span className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Active Session</span>
                        </div>
                    </div>
                )
            }

            {/* ═══ FEEDBACK TOASTS ═══ */}
            {
                feedbackMsg && (
                    <div className={`fixed top-12 left-1/2 -translate-x-1/2 py-4 px-10 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[300] transition-all duration-500 animate-[slideDown_0.4s_ease-out] font-black tracking-widest text-xs uppercase flex items-center gap-3 border-2 ${feedbackMsg.color === 'red' ? 'bg-red-950/90 border-red-500 text-red-100' :
                        feedbackMsg.color === 'emerald' ? 'bg-emerald-950/90 border-emerald-500 text-emerald-100' :
                            'bg-cyan-950/90 border-cyan-500 text-cyan-100'
                        }`}>
                        <div className={`w-2 h-2 rounded-full animate-pulse ${feedbackMsg.color === 'red' ? 'bg-red-500' : feedbackMsg.color === 'emerald' ? 'bg-emerald-500' : 'bg-cyan-500'}`} />
                        {feedbackMsg.text}
                    </div>
                )
            }
        </div >
    );
};

export default Level6;
