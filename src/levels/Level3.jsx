import React, { useState, useEffect } from 'react';
import { useGameState } from '../context/GameStateContext';

const Level3 = () => {
    const { assets, completeLevel, adjustAssets, adjustLives, playTitleCardSound } = useGameState();

    // STATE MACHINE: intro_pov → laptop_ui → inbox → email_view → mini_game → final_decision → scam_outcome / victory_outcome
    const [gameState, setGameState] = useState('intro_pov');
    const [feedbackMsg, setFeedbackMsg] = useState(null);

    // POV INTERACTION STATE
    const [isHoveringLaptop, setIsHoveringLaptop] = useState(false);

    // CINEMATIC TRANSITION STATE
    const [isTransitioning, setIsTransitioning] = useState(true);

    const triggerTransition = (newState, delay = 500) => {
        setIsTransitioning(true);
        setTimeout(() => {
            if (newState) setGameState(newState);
            setTimeout(() => {
                setIsTransitioning(false);
            }, 200);
        }, delay);
    };

    useEffect(() => {
        const timer = setTimeout(() => setIsTransitioning(false), 500);
        return () => clearTimeout(timer);
    }, []);

    // CLUE BOARD & SCAM LOGIC
    const [clues, setClues] = useState([]);
    const [isDetectiveModeOpen, setIsDetectiveModeOpen] = useState(false);
    const [isClueButtonVisible, setIsClueButtonVisible] = useState(false);
    const [usedClueBoard, setUsedClueBoard] = useState(false);
    const [introCinematicState, setIntroCinematicState] = useState(false);
    const [outroStep, setOutroStep] = useState(0);

    // INITIAL EMAILS
    const TRANSFER_EMAIL = {
        id: 'transfer',
        sender: 'HDFC Bank Alerts',
        subject: 'Confirmed: Electronic Funds Transfer',
        time: 'Yesterday',
        senderInitial: 'H',
        content: `Ref No: 9182743650
Date: March 7, 2026

Dear Customer,

This is to confirm an outward fund transfer of ₹15,000.00 from your account ending in XX90.
Beneficiary: Rent (ICICI Bank)

If you did not initiate this transaction, please visit our nearest branch immediately.

Standard Bank Ltd (HDFC Group)`
    };

    const ALERT_EMAIL = {
        id: 'alert',
        sender: 'Google Security',
        subject: 'Security alert: New login on Windows',
        time: 'Yesterday',
        senderInitial: 'G',
        content: `A new login was detected on your account (user@securemail.com) from a Windows device in Bengaluru, Karnataka.

Device: Chrome on Windows 11
Location: Bengaluru, India
Time: March 7, 20:14 IST

If this was you, you can disregard this message. If not, please review your account activity.

Google Account Security Team`
    };

    const PWD_EMAIL = {
        id: 'pwd',
        sender: 'SecureMail Admin',
        subject: 'Account Notification: Password changed successfully',
        time: '09:15',
        senderInitial: 'A',
        content: `Hello,

This is an automated confirmation that the password for your SecureMail account was successfully changed at 09:15 IST today.

Location: Mumbai (Your current location)
IP Address: 192.168.1.45 (Local)

Security Tip: Change your passwords every 90 days to stay secure.

SecureMail Support Team`,
        isUnread: true
    };

    const SCAM_EMAIL = {
        id: 'scam',
        sender: 'SBI Security Alert',
        subject: '⚠️ ACTION REQUIRED: Update Your Account Information',
        time: '08:42',
        isScam: true,
        isUnread: true
    };

    const [inboxEmails, setInboxEmails] = useState([PWD_EMAIL, ALERT_EMAIL, TRANSFER_EMAIL]);
    const [activeEmailId, setActiveEmailId] = useState(null);
    const [scamEmailArrived, setScamEmailArrived] = useState(false);

    // EMAIL BROWSER STATE
    const [hoveredLink, setHoveredLink] = useState(null);
    const [showLockInfo, setShowLockInfo] = useState(false);
    const [hasClickedFakeLink, setHasClickedFakeLink] = useState(false);

    // Timed arrival logic
    useEffect(() => {
        if (gameState === 'email_view' && activeEmailId === 'pwd') {
            // mark pwd as read
            setInboxEmails(prev => prev.map(em => em.id === 'pwd' ? { ...em, isUnread: false } : em));

            if (!scamEmailArrived) {
                const timer = setTimeout(() => {
                    setInboxEmails(prev => [SCAM_EMAIL, ...prev]);
                    setScamEmailArrived(true);

                    // visual/audio pop
                    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    if (audioCtx.state === 'suspended') audioCtx.resume();
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
                    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.1);

                    setFeedbackMsg("🔔 New Email Arrived!");
                    setTimeout(() => setFeedbackMsg(null), 2000);
                }, 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [gameState, activeEmailId, scamEmailArrived]);

    // MINI-GAME STATE
    const [urls, setUrls] = useState([
        { id: 'u1', text: 'https://www.sbi.co.in/login', isSafe: true, status: 'unassigned' },
        { id: 'u2', text: 'http://sbi-secure.verify247.com', isSafe: false, status: 'unassigned' },
        { id: 'u3', text: 'https://amazon-support.free-gifts.in', isSafe: false, status: 'unassigned' },
        { id: 'u4', text: 'https://accounts.google.com/signin', isSafe: true, status: 'unassigned' }
    ]);
    const [draggedUrlId, setDraggedUrlId] = useState(null);
    const [miniGameOver, setMiniGameOver] = useState(false);

    const unlockClue = (clueId, clueData) => {
        if (!clues.find(c => c.id === clueId)) {
            const gridPositions = [
                { x: 140, y: 160 }, { x: 420, y: 180 }, { x: 700, y: 160 },
                { x: 180, y: 380 }, { x: 460, y: 400 }, { x: 260, y: 550 },
                { x: 540, y: 560 }
            ];
            const pos = gridPositions[clues.length % gridPositions.length];
            const x = pos.x + (Math.random() * 40 - 20);
            const y = pos.y + (Math.random() * 40 - 20);
            setClues(prev => [...prev, { id: clueId, ...clueData, x, y }]);
            setFeedbackMsg("🔍 Clue Discovered!");
            setTimeout(() => setFeedbackMsg(null), 2000);
        }
    };

    useEffect(() => {
        if (gameState === 'intro_cinematic') {
            playTitleCardSound();
            const t1 = setTimeout(() => {
                triggerTransition('email_view', 500);
                setIntroCinematicState(true);
            }, 4000);
            return () => clearTimeout(t1);
        }
    }, [gameState, playTitleCardSound]);

    useEffect(() => {
        if (gameState === 'outro_pov') {
            const t1 = setTimeout(() => setOutroStep(1), 100);
            const t2 = setTimeout(() => setOutroStep(2), 4000);
            const t3 = setTimeout(() => setOutroStep(3), 5500);
            const t4 = setTimeout(() => completeLevel(true, usedClueBoard ? 10 : 5, 0), 9000);
            return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
        }
    }, [gameState, usedClueBoard, completeLevel]);

    // --- RENDERERS ---

    if (gameState === 'intro_pov') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950 overflow-hidden relative animate-cinematic-sequence">
                {/* GLOBAL TRANSITION FADE */}
                <div className={`absolute inset-0 bg-black z-[9999] transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, #000 40px, #000 80px)' }}></div>
                <div className="text-white font-mono text-[10px] absolute top-8 left-8 opacity-40 uppercase tracking-[0.5em] pointer-events-none">POV_SESSION_03 // LEVEL 3</div>

                <div className="w-full h-full bg-black flex items-center justify-center overflow-hidden relative">
                    <div
                        className="w-full h-full transition-all duration-300"
                        style={{
                            backgroundImage: 'url("/assets/temppho.png")',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    />

                    {/* Hint */}
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 animate-fadeIn fade-in">
                        <div className="h-[2px] w-12 bg-white/30 mb-3" />
                        <div className="text-white/80 font-mono text-[11px] uppercase tracking-[0.4em] drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                            Inspect the computer
                        </div>
                    </div>

                    {/* Interactive Monitor Hitbox */}
                    <button
                        onMouseEnter={() => setIsHoveringLaptop(true)}
                        onMouseLeave={() => setIsHoveringLaptop(false)}
                        onClick={() => triggerTransition('laptop_ui')}
                        className="absolute left-[36%] top-[39%] w-[27%] h-[27%] bg-transparent cursor-pointer group z-40 outline-none"
                        title="Check Computer"
                        aria-label="Check Computer"
                    >
                        {/* Hover Overlay Outline matching the monitor screen loosely */}
                        <div className={`absolute inset-0 border-2 rounded-sm transition-all duration-300 ${isHoveringLaptop ? 'border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.3)] bg-cyan-400/5' : 'border-transparent'}`}></div>
                    </button>

                    {/* Soft pulse on hit zone when not hovered to draw attention passively */}
                    {!isHoveringLaptop && (
                        <div className="absolute left-[36%] top-[39%] w-[27%] h-[27%] border-2 border-cyan-400/20 rounded-sm animate-pulse pointer-events-none"></div>
                    )}
                </div>
            </div>
        );
    }

    if (gameState === 'intro_cinematic') {
        return (
            <div className="absolute inset-0 z-[1000] bg-black flex flex-col justify-center items-center animate-cinematic-sequence">
                {/* GLOBAL TRANSITION FADE */}
                <div className={`absolute inset-0 bg-black z-[9999] transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
                <div className="relative group text-center animate-fadeInSlow">
                    <div className="absolute -inset-10 bg-white/5 blur-3xl rounded-full" />
                    <div className="h-px w-32 bg-gradient-to-r from-transparent via-red-500 to-transparent mb-8 mx-auto animate-[width_1.5s_ease-in-out]" />
                    <h2 className="text-white text-6xl font-black tracking-[0.4em] uppercase mb-4 relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-pulse">
                        Level 3
                        {/* Chromatic aberration layers */}
                        <span className="absolute inset-0 text-red-500 opacity-60 translate-x-1 -z-10 animate-[aberration_3s_infinite]">Level 3</span>
                        <span className="absolute inset-0 text-cyan-400 opacity-60 -translate-x-1 -z-10 animate-[aberration-alt_3s_infinite]">Level 3</span>
                    </h2>
                    <h3 className="text-red-500 text-lg font-mono tracking-[0.8em] uppercase opacity-80 font-bold drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                        The Phishing Net
                    </h3>
                </div>
                <div className="mt-12 w-32 h-px bg-gradient-to-r from-transparent via-red-500/50 to-transparent animate-[width_1.5s_ease-in-out]" />
            </div>
        );
    }

    if (['laptop_ui', 'email_view', 'browser_view'].includes(gameState)) {
        return (
            <div className="w-full h-full bg-[#1A1C1E] p-4 flex flex-col relative overflow-hidden">
                {/* GLOBAL TRANSITION FADE */}
                <div className={`absolute inset-0 bg-black z-[9999] transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
                {/* Feedback Toast */}
                {feedbackMsg && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-[0_15px_30px_rgba(37,99,235,0.4)] z-[1000] font-bold text-center animate-bounce border border-blue-400">
                        {feedbackMsg}
                    </div>
                )}

                <div className="flex-1 flex overflow-hidden gap-6 p-2 relative">
                    {/* BROWSER CONTAINER */}
                    <div className={`bg-white rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] border-[12px] border-[#1a1c1e] flex flex-col overflow-hidden relative transition-all duration-500 ease-in-out ${isDetectiveModeOpen ? 'flex-1 shrink' : 'flex-1 max-w-6xl mx-auto shadow-[0_20px_50px_rgba(0,0,0,0.3)]'}`}>
                        {/* BROWSER CHROME */}
                        <div className="bg-[#f1f3f4] border-b border-[#dee1e6] px-6 py-4 flex items-center gap-6 select-none shrink-0">
                            <div className="flex gap-2.5 mr-2">
                                <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
                                <div className="w-3.5 h-3.5 rounded-full bg-[#ffbc2e] border border-[#d89f1b]" />
                                <div className="w-3.5 h-3.5 rounded-full bg-[#28c840] border border-[#1aab29]" />
                            </div>

                            <div className="flex items-center gap-4 mr-4">
                                <button
                                    onClick={() => { if (gameState === 'browser_view') triggerTransition('email_view'); }}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${gameState === 'browser_view' ? 'hover:bg-gray-200 text-gray-700 active:scale-90' : 'text-gray-300 cursor-default'}`}
                                    title="Back to Inbox"
                                >
                                    <span className="text-xl font-bold">←</span>
                                </button>
                                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 cursor-default">
                                    <span className="text-xl font-bold">→</span>
                                </button>
                                <button
                                    onClick={() => { setFeedbackMsg("Refreshed"); setTimeout(() => setFeedbackMsg(null), 1000); }}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-200 active:rotate-180 transition-all duration-500"
                                >
                                    <span className="text-xl font-bold">↻</span>
                                </button>
                            </div>

                            <div className="flex-1 bg-white border border-[#dadce0] rounded-full px-6 py-2.5 flex items-center gap-3 text-[14px] text-[#202124] shadow-sm transform transition-all group hover:border-[#bdc1c6]">
                                <span className={`${gameState === 'browser_view' ? 'text-red-500' : 'text-gray-400'} transition-colors`}>{gameState === 'browser_view' ? '⚠️' : '🔒'}</span>
                                <span className="truncate flex-1 font-medium font-sans">
                                    {gameState === 'browser_view' ? (
                                        <span draggable onDragStart={(e) => { e.dataTransfer.setData('application/json', JSON.stringify({ id: 'fake_url', title: 'Suspicious URL', desc: 'The address "sbi-secure-login.verify247.in" is a domain known for phishing.' })); setIsDetectiveModeOpen(true); }} className="cursor-grab border-b-2 border-dashed border-red-300 hover:bg-red-50">https://sbi-secure-login.verify247.in/login</span>
                                    ) : (
                                        'https://mail.google.com/inbox'
                                    )}
                                </span>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[#0b57d0] flex items-center justify-center text-white text-sm font-black shadow-lg">J</div>
                        </div>

                        {/* CONTENT AREA */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* SIDEBAR */}
                            {gameState !== 'browser_view' ? (
                                <div className="w-[260px] bg-white border-r border-[#F1F3F4] flex flex-col shrink-0">
                                    <div className="p-4 flex flex-col gap-5">
                                        <button className="bg-[#C2E7FF] hover:bg-[#B3D7EF] transition-all py-4 px-6 rounded-2xl flex items-center gap-4 text-[14px] font-bold text-[#001D35] shadow-md active:scale-95">
                                            <span className="text-xl">✎</span> Compose
                                        </button>
                                        <div className="flex flex-col gap-0.5 px-1">
                                            <div className="bg-[#D3E3FD] text-[#001D35] px-4 py-2 rounded-full text-[14px] font-bold flex justify-between items-center transition-colors">
                                                <div className="flex items-center gap-4 border-l-4 border-[#0B57D0] pl-1"><span>📥</span> Inbox</div>
                                                <span>{inboxEmails.filter(e => e.isUnread).length}</span>
                                            </div>
                                            <div className="text-[#444746] hover:bg-[#F3F4ED] px-4 py-2 rounded-full text-[14px] font-medium flex items-center gap-4 cursor-pointer transition-colors pl-6"><span>⭐</span> Starred</div>
                                            <div className="text-[#444746] hover:bg-[#F3F4ED] px-4 py-2 rounded-full text-[14px] font-medium flex items-center gap-4 cursor-pointer transition-colors pl-6"><span>📤</span> Sent</div>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto flex flex-col border-t border-[#F1F3F4] custom-scrollbar">
                                        {inboxEmails.map((em) => (
                                            <div
                                                key={em.id}
                                                className={`px-6 py-4 border-b border-[#F7F8F9] cursor-pointer transition-all duration-200 border-l-4 ${activeEmailId === em.id ? 'bg-[#F2F6FC] border-[#0B57D0]' : 'bg-white border-transparent hover:bg-[#F7F8F9]'}`}
                                                onClick={() => {
                                                    setActiveEmailId(em.id);
                                                    if (em.isScam) {
                                                        setIsClueButtonVisible(true);
                                                        if (!introCinematicState && gameState !== 'intro_cinematic') {
                                                            triggerTransition('intro_cinematic');
                                                        } else {
                                                            if (gameState !== 'email_view') triggerTransition('email_view');
                                                        }
                                                    } else {
                                                        setIsClueButtonVisible(false);
                                                        if (gameState !== 'email_view') triggerTransition('email_view');
                                                    }
                                                }}
                                            >
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <span className={`text-[13px] truncate ${em.isUnread ? 'font-bold text-[#1F1F1F]' : 'font-medium text-[#444746]'}`}>{em.sender}</span>
                                                    <span className={`text-[11px] font-medium ${em.isUnread ? 'text-[#0B57D0]' : 'text-[#747775]'}`}>{em.time}</span>
                                                </div>
                                                <div className={`text-[12px] truncate ${em.isUnread ? 'font-bold text-[#1F1F1F]' : 'text-[#444746]'}`}>{em.subject}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="w-[80px] bg-[#f8f9fa] border-r border-[#dee1e6] flex flex-col items-center py-6 gap-8 shrink-0">
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl cursor-not-allowed">🏠</div>
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl cursor-not-allowed opacity-50">👤</div>
                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-xl cursor-not-allowed opacity-50">⚙️</div>
                                </div>
                            )}

                            {/* READING PANE / BROWSER CONTENT */}
                            <div className="flex-1 bg-white relative flex flex-col overflow-hidden">
                                {gameState === 'browser_view' ? (
                                    <div className="flex-1 bg-white transition-all duration-500 animate-fadeIn overflow-y-auto custom-scrollbar">
                                        <div className="bg-[#003366] text-white p-6 flex justify-between items-center shadow-md">
                                            <div className="flex items-center gap-4">
                                                <img src="https://upload.wikimedia.org/wikipedia/en/thumb/5/58/State_Bank_of_India_logo.svg/300px-State_Bank_of_India_logo.svg.png" className="h-10 brightness-0 invert" alt="SBI" />
                                                <span className="text-2xl font-black tracking-tighter">SBI PERSONAL BANKING</span>
                                            </div>
                                            <div className="flex gap-6 text-sm font-bold opacity-80 uppercase tracking-widest">
                                                <span>Services</span>
                                                <span>Security</span>
                                                <span>Support</span>
                                            </div>
                                        </div>

                                        <div className="max-w-md mx-auto mt-16 p-10 bg-white border border-gray-200 rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.05)]">
                                            <h2 className="text-2xl font-black text-[#003366] mb-8 text-center uppercase tracking-tight">Login Credentials Required</h2>
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Username</label>
                                                    <input type="text" className="w-full bg-[#f8f9fa] border-2 border-gray-100 rounded-xl px-5 py-4 focus:border-[#0B57D0] focus:bg-white outline-none transition-all font-mono" placeholder="Ex: GrandPa123" disabled />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Password</label>
                                                    <input type="password" value="********" className="w-full bg-[#f8f9fa] border-2 border-gray-100 rounded-xl px-5 py-4 focus:border-[#0B57D0] focus:bg-white outline-none transition-all font-mono" disabled />
                                                </div>
                                                <button
                                                    onClick={() => triggerTransition('final_decision')}
                                                    className="w-full bg-gradient-to-r from-[#003366] to-[#004d99] text-white py-5 rounded-xl font-black shadow-xl hover:shadow-2xl transition-all scale-100 active:scale-95 uppercase tracking-widest"
                                                >
                                                    Sign In & Sync
                                                </button>
                                            </div>
                                            <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col gap-4 text-center">
                                                <span className="text-[12px] text-gray-400 font-medium py-2">© 2026 SBI Secure Connect. All rights reserved.</span>
                                                <button
                                                    onClick={() => triggerTransition('email_view')}
                                                    className="text-[#003366] font-black text-[12px] uppercase tracking-widest hover:underline mt-2"
                                                >
                                                    ← Return to Mail
                                                </button>
                                            </div>
                                        </div>

                                        <div className="fixed bottom-0 left-0 right-0 bg-[#f8f9fa] border-t border-gray-100 p-4 text-[10px] text-gray-400 flex justify-center gap-10">
                                            <span>Privacy Policy</span>
                                            <span>Terms of Service</span>
                                            <span>Customer Service</span>
                                        </div>
                                    </div>
                                ) : !activeEmailId ? (
                                    <div className="flex-1 flex flex-col items-center justify-center bg-[#F8F9FA]">
                                        <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100 mb-6 font-bold text-6xl opacity-10">📥</div>
                                        <h2 className="text-xl font-black text-[#BDC1C6] uppercase tracking-[0.2em]">Select an email</h2>
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-y-auto p-12 relative flex flex-col animate-fadeIn bg-white custom-scrollbar">
                                        {activeEmailId === 'scam' && (
                                            <div className="absolute top-6 right-10 bg-[#FEF7E0] text-[#785C00] px-5 py-2.5 rounded-2xl text-[12px] font-black z-20 border border-[#FAD242] shadow-sm animate-bounce">
                                                🔍 DRAG SUSPICIOUS TEXT TO BOARD →
                                            </div>
                                        )}

                                        <div className="max-w-3xl mx-auto w-full">
                                            <h2 className="text-[28px] font-extrabold text-[#1F1F1F] mb-8">
                                                {inboxEmails.find(e => e.id === activeEmailId)?.subject}
                                            </h2>
                                            <div className="flex items-center gap-4 mb-10 pb-8 border-b border-[#F1F3F4]">
                                                <div className="w-14 h-14 bg-[#0B57D0] text-white rounded-full flex items-center justify-center font-bold text-xl">{inboxEmails.find(e => e.id === activeEmailId)?.senderInitial}</div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[#1F1F1F]">
                                                        {inboxEmails.find(e => e.id === activeEmailId)?.sender}
                                                    </span>
                                                    <span
                                                        draggable={activeEmailId === 'scam'}
                                                        onDragStart={(e) => {
                                                            if (activeEmailId === 'scam') {
                                                                e.dataTransfer.setData('application/json', JSON.stringify({ id: 1, title: 'Suspicious Domain', desc: 'The email domain "sbiindia-verify.com" is not legitimate.' }));
                                                                setIsDetectiveModeOpen(true);
                                                            }
                                                        }}
                                                        className={`text-[13px] ${activeEmailId === 'scam' ? 'cursor-grab border-b-2 border-dashed border-red-400 text-red-600' : 'text-gray-500'}`}
                                                    >
                                                        {activeEmailId === 'scam' ? '<security-alert@sbiindia-verify.com>' : '<support@official.com>'}
                                                    </span>
                                                </div>
                                            </div>

                                            {activeEmailId === 'scam' ? (
                                                <div className="text-[#1F1F1F] text-[16px] leading-[1.8] font-sans">
                                                    <img
                                                        src="https://upload.wikimedia.org/wikipedia/en/thumb/5/58/State_Bank_of_India_logo.svg/300px-State_Bank_of_India_logo.svg.png"
                                                        alt="SBI Logo"
                                                        draggable
                                                        onDragStart={(e) => { e.dataTransfer.setData('application/json', JSON.stringify({ id: 7, title: 'Copied Logo', desc: 'Anyone can copy a bank logo and paste it into a fake email.' })); setIsDetectiveModeOpen(true); }}
                                                        className="h-10 w-auto mb-8 cursor-grab border-b-2 border-dashed border-red-400 hover:bg-red-50 p-1"
                                                    />
                                                    <p className="mb-6 font-bold">
                                                        <span draggable onDragStart={(e) => { e.dataTransfer.setData('application/json', JSON.stringify({ id: 8, title: 'Generic Greeting', desc: 'Banks usually address you by name. "Dear Customer" is a sign of a mass phishing mail.' })); setIsDetectiveModeOpen(true); }} className="cursor-grab border-b-2 border-dashed border-red-400 hover:bg-red-50">Dear Customer,</span>
                                                    </p>
                                                    <p className="mb-6">Our security systems have detected <span draggable onDragStart={(e) => { e.dataTransfer.setData('application/json', JSON.stringify({ id: 'ip', title: 'Suspicious IP', desc: 'The IP address listed is from a restricted region.' })); setIsDetectiveModeOpen(true); }} className="cursor-grab border-b-2 border-dashed border-red-400 font-bold bg-red-50 px-1">suspicious login attempts (IP: 45.12.88.94)</span>.</p>
                                                    <p className="mb-10">To <span draggable onDragStart={(e) => { e.dataTransfer.setData('application/json', JSON.stringify({ id: 'login', title: 'Urgent Pressure', desc: 'Demanding immediate re-verification is a common tactic to bypass your critical thinking.' })); setIsDetectiveModeOpen(true); }} className="cursor-grab border-b-2 border-dashed border-red-400 font-bold bg-red-50 px-1">re-verify your identity</span>, please visit our secure portal.</p>
                                                    <div className="flex justify-center">
                                                        <button
                                                            className="bg-[#D93025] hover:bg-[#B9281E] text-white px-12 py-5 rounded-2xl font-black shadow-xl transition-all"
                                                            draggable
                                                            onDragStart={(e) => { e.dataTransfer.setData('application/json', JSON.stringify({ id: 'url', title: 'Fake Portal Link', desc: 'Link leads to verify247.in instead of sbi.co.in.' })); setIsDetectiveModeOpen(true); }}
                                                            onClick={() => { setFeedbackMsg("⚠️ Caution: Investigating..."); setTimeout(() => setGameState('browser_view'), 1000); }}
                                                        >
                                                            Secure Login Portal
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-[#1F1F1F] text-[16px] leading-[1.8] whitespace-pre-wrap">
                                                    {inboxEmails.find(e => e.id === activeEmailId)?.content}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* BROWSER STATUS BAR */}
                        <div className="bg-[#F1F3F4] border-t border-gray-200 px-6 py-2.5 flex justify-between items-center text-[12px] font-sans font-bold text-gray-500">
                            <span className={hoveredLink ? 'text-blue-600' : ''}>{hoveredLink ? `🔗 ${hoveredLink}` : 'Ready'}</span>
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500" /> Secure Connection</span>
                            </div>
                        </div>
                    </div>

                    {/* INVESTIGATION BOARD PANEL */}
                    {isDetectiveModeOpen && (
                        <div className="w-[500px] bg-[#dcc6a0] rounded-[2.5rem] border-[16px] border-[#4a2e1a] shadow-2xl flex flex-col overflow-hidden animate-slideInRight shrink-0 relative">
                            <div className="flex justify-between items-center z-10 bg-white/90 backdrop-blur-sm p-4 border-b-4 border-stone-400 self-stretch shrink-0">
                                <h2 className="text-lg font-black text-stone-800 uppercase tracking-[0.2em] font-mono">� Digital Evidence Wall</h2>
                                <button className="text-red-600 hover:text-red-700 font-black text-2xl transition-colors" onClick={() => setIsDetectiveModeOpen(false)}>✖</button>
                            </div>

                            <div className="flex-1 p-6 grid grid-cols-2 auto-rows-[140px] gap-6 overflow-y-auto custom-scrollbar bg-amber-50/20" onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
                                e.preventDefault();
                                try {
                                    const data = JSON.parse(e.dataTransfer.getData('application/json'));
                                    if (data && !clues.find(c => c.id === data.id)) {
                                        setClues(prev => [...prev, data]);
                                        setUsedClueBoard(true); // SYNC STATE FOR NO-PENALTY
                                        setFeedbackMsg('📌 Evidence Pinned!');
                                        setTimeout(() => setFeedbackMsg(null), 2000);
                                    }
                                } catch (err) { }
                            }}>
                                {[0, 1, 2, 3, 4, 5].map(idx => {
                                    const clue = clues[idx];
                                    return (
                                        <div key={idx} className="relative border-4 border-dashed border-stone-400/30 rounded-xl bg-stone-300/20 shadow-inner flex flex-col items-center justify-center group overflow-hidden transition-all hover:bg-stone-300/40">
                                            {!clue ? (
                                                <div className="text-stone-400 font-mono text-[10px] uppercase tracking-widest animate-pulse font-bold">
                                                    Slot 0{idx + 1} Empty
                                                </div>
                                            ) : (
                                                <div className="w-full h-full p-4 bg-white/95 shadow-xl border-l-4 border-red-600 flex flex-col animate-pin-bounce">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                                                        <h3 className="text-[12px] font-black uppercase text-red-700 leading-tight truncate">{clue.title}</h3>
                                                    </div>
                                                    <p className="text-[10px] text-stone-700 leading-relaxed font-medium mb-3 italic line-clamp-3">"{clue.desc}"</p>

                                                    {/* Decorative string connection effects */}
                                                    <div className="mt-auto pt-2 border-t border-stone-100 flex justify-between items-center">
                                                        <span className="text-[8px] text-stone-400 font-mono uppercase tracking-tighter">Verified Clue</span>
                                                        <div className="flex gap-0.5">
                                                            <div className="w-1 h-1 rounded-full bg-amber-500" />
                                                            <div className="w-3 h-1 rounded-full bg-amber-500/20" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Decorative Corner Tabs */}
                                            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-stone-400/50" />
                                            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-stone-400/50" />
                                            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-stone-400/50" />
                                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-stone-400/50" />
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="p-4 bg-white/95 border-t-8 border-[#4a2e1a]">
                                <div className="flex justify-between text-[11px] font-black mb-2 text-stone-500 uppercase">
                                    <span>Analysis Accuracy</span>
                                    <span>{clues.length}/6 Required</span>
                                </div>
                                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden mb-4">
                                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${Math.min(100, (clues.length / 6) * 100)}%`, backgroundColor: clues.length >= 6 ? '#10b981' : '#f59e0b' }} />
                                </div>
                                {clues.length >= 6 && (
                                    <button onClick={() => setGameState('final_decision')} className="w-full bg-[#D93025] hover:bg-[#B9281E] text-white py-3 rounded-2xl font-black shadow-lg uppercase tracking-widest text-[12px] animate-pulse">Reach Verdict</button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* FLOATING ACTION BUTTONS */}
                {isClueButtonVisible && (
                    <div className="absolute bottom-6 left-6 z-[600]">
                        <button onClick={() => setIsDetectiveModeOpen(!isDetectiveModeOpen)} className={`w-14 h-14 bg-amber-500 rounded-full flex items-center justify-center shadow-lg border-2 border-amber-300 transition-all text-2xl ${!usedClueBoard ? 'animate-bounce' : 'hover:scale-110 active:scale-90'}`}>
                            🔍
                            {clues.length > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-amber-500">{clues.length}</span>}
                        </button>
                    </div>
                )}
            </div>
        );
    }


    if (gameState === 'final_decision') {
        return (
            <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center relative p-8 overflow-hidden">
                {/* GLOBAL TRANSITION FADE */}
                <div className={`absolute inset-0 bg-black z-[9999] transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
                {/* Background FX */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-900/20 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-900/20 rounded-full blur-[100px]"></div>
                </div>

                <div className="w-full max-w-4xl bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] p-12 select-none z-10">
                    <div className="flex flex-col items-center mb-12">
                        <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                            <span className="text-3xl">⚖️</span>
                        </div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-[0.2em] text-center mb-4">Critical Decision</h2>
                        <p className="text-slate-400 text-xl text-center leading-relaxed max-w-2xl font-light">
                            You have reviewed the email from 'SBI Security Team'.<br />
                            <span className="text-amber-400 font-medium inline-block mt-2">Do you trust it with your grandfather's life savings?</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        {/* Wrong Choice */}
                        <button
                            className="bg-slate-950/50 hover:bg-slate-800 border-2 border-slate-700/50 hover:border-red-500/80 p-10 rounded-2xl transition-all duration-300 group flex flex-col items-center text-center relative overflow-hidden"
                            onClick={() => {
                                triggerTransition('scam_outcome');
                                const basePenalty = 550000;
                                const finalPenalty = usedClueBoard ? basePenalty : basePenalty * 1.1; // 10% penalty for no board
                                adjustAssets(-finalPenalty);
                                if (!usedClueBoard) adjustLives(-1);
                            }}
                        >
                            <div className="absolute inset-0 bg-red-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                            <span className="text-5xl mb-6 group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] transition-all relative z-10">🔗</span>
                            <h3 className="text-2xl font-black text-white mb-3 tracking-wide relative z-10">Click Link & Login</h3>
                            <p className="text-slate-400 leading-relaxed relative z-10 font-medium">Verify your details immediately to prevent the 24-hour permanent suspension.</p>
                        </button>

                        <button
                            className={`bg-slate-950/50 hover:bg-slate-800 border-2 border-slate-700/50 hover:border-emerald-500/80 p-10 rounded-2xl transition-all duration-300 flex flex-col items-center text-center group relative overflow-hidden ${usedClueBoard ? 'border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.15)] bg-emerald-950/10' : ''}`}
                            onClick={() => {
                                triggerTransition('outro_pov');
                            }}
                        >
                            <div className="absolute inset-0 bg-emerald-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                            <span className="text-5xl mb-6 group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all relative z-10">🛡️</span>
                            <h3 className="text-2xl font-black text-white mb-3 tracking-wide relative z-10">Delete & Report</h3>
                            <p className="text-slate-400 leading-relaxed relative z-10 font-medium">Mark as phishing and forward to report.phishing@sbi.co.in. Do not click.</p>
                            {usedClueBoard && (
                                <span className="absolute top-4 right-4 text-[10px] bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-3 py-1.5 rounded-full font-bold uppercase tracking-widest animate-pulse backdrop-blur-sm shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                                    Confirmed by Evidence
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'outro_pov') {
        return (
            <div className="absolute inset-0 z-[2000] overflow-hidden bg-black animate-cinematic-sequence">
                {/* GLOBAL TRANSITION FADE */}
                <div className={`absolute inset-0 bg-black z-[9999] transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
                {outroStep === 1 && (
                    <div className="w-full h-full bg-cover bg-center animate-fieldZoom relative" style={{ backgroundImage: 'url("/assets/temppho.png")' }}>
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90" />
                        <div className="absolute bottom-28 w-full text-center animate-fadeInSlow">
                            <p className="text-white text-4xl font-serif italic tracking-wide drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] px-16 leading-relaxed">
                                "It's been too much in a single day... I should probably go to sleep."
                            </p>
                            <div className="mt-8 w-32 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent mx-auto animate-[shimmerWidth_2s_infinite]" />
                        </div>
                    </div>
                )}

                {(outroStep === 2 || outroStep === 3) && (
                    <div className="w-full h-full bg-stone-950 flex flex-col items-center justify-center animate-fadeIn relative overflow-hidden">
                        {/* Scanning line effects */}
                        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%]" />
                        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-cyan-500/5 to-transparent animate-[scanLine_4s_linear_infinite] pointer-events-none" />

                        <div className="relative group text-center">
                            <div className="absolute -inset-10 bg-white/5 blur-3xl rounded-full" />
                            <h2 className="text-white text-6xl font-black tracking-[0.5em] uppercase mb-12 relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                Level 3: The Phishing Net
                                {outroStep === 3 && (
                                    <div className="absolute top-1/2 left-[-10%] w-[120%] h-3 bg-red-600/90 -translate-y-1/2 animate-[strikeThrough_0.5s_forwards] shadow-[0_0_25px_rgba(220,38,38,1)] z-20 skew-y-[-1deg]" />
                                )}
                            </h2>

                            {outroStep === 3 && (
                                <div className={`mt-12 text-8xl font-black italic tracking-[0.2em] uppercase animate-surge relative text-emerald-500`}>
                                    <span className="relative z-10">COMPLETED</span>
                                    {/* Chromatic aberration for text */}
                                    <span className={`absolute inset-0 opacity-40 translate-x-1 animate-[aberration_3s_infinite] text-cyan-400`}>COMPLETED</span>
                                    <span className={`absolute inset-0 opacity-40 -translate-x-1 animate-[aberration-alt_3s_infinite] text-emerald-300`}>COMPLETED</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-20 flex flex-col items-center gap-4">
                            <div className="h-px w-80 bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
                            <div className="text-[11px] font-mono text-zinc-500 tracking-[0.8em] uppercase opacity-60 animate-pulse">
                                Digital Forensics Session // STATUS_CLEARED
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (gameState === 'scam_outcome') {
        return (
            <div className="w-full h-full bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden animate-cinematic-sequence">
                {/* GLOBAL TRANSITION FADE */}
                <div className={`absolute inset-0 bg-black z-[9999] transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
                <div className="absolute inset-0 bg-red-950/40 z-0"></div>
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none"></div>
                <div className="w-[800px] h-[800px] absolute bg-red-600/10 rounded-full blur-[150px] z-0 animate-pulse"></div>

                <div className="z-10 text-center max-w-3xl transform transition-all translate-y-0 scale-100">
                    <span className="text-8xl mb-6 inline-block drop-shadow-[0_0_30px_rgba(239,68,68,0.8)] animate-bounce">💸</span>
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-400 to-red-700 uppercase tracking-[0.2em] mb-4 drop-shadow-lg">ASSETS STOLEN</h1>

                    <div className="bg-slate-900/60 p-10 rounded-3xl border border-red-500/30 mb-10 backdrop-blur-xl text-left shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                        <p className="text-red-100 text-xl mb-4 font-light leading-relaxed">
                            You clicked the fake link and entered your internet banking credentials on <strong className="font-mono text-red-400 font-bold bg-red-950/50 px-2 py-0.5 rounded">sbi-secure-login.verify247.in</strong>.
                        </p>
                        <p className="text-red-200/80 text-lg mb-6 leading-relaxed">
                            The attacker instantly captured your username and password, logged into your real SBI account, and transferred funds to a mule account via RTGS.
                        </p>
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-red-500/50 to-transparent my-8"></div>
                        <div className="flex justify-between items-center text-2xl font-mono text-red-400 bg-red-950/40 p-5 rounded-xl border border-red-500/20 shadow-inner">
                            <span className="uppercase tracking-widest font-bold">FUNDS LOST:</span>
                            <span className="font-black text-3xl">-₹{usedClueBoard ? '5,50,000' : '6,05,000'}</span>
                        </div>
                        {!usedClueBoard && (
                            <div className="flex justify-between items-center text-sm font-mono text-amber-500 mt-4 px-2">
                                <span className="uppercase tracking-wider">No-Investigation Penalty Included (10%):</span>
                                <span>-₹55,000</span>
                            </div>
                        )}
                        {!usedClueBoard && (
                            <div className="flex justify-between items-center text-lg font-black text-red-500 mt-4 animate-pulse uppercase tracking-widest bg-red-950 p-3 rounded border border-red-800">
                                <span>LIVES LOST:</span>
                                <span>-1 LIFE</span>
                            </div>
                        )}
                        {usedClueBoard && (
                            <div className="mt-6 p-5 bg-gradient-to-r from-amber-900/40 to-transparent border-l-4 border-amber-500 rounded text-amber-200 text-sm leading-relaxed shadow-lg">
                                <strong className="uppercase tracking-widest block mb-1">System Note:</strong> You investigated the evidence... but still chose to trust the email. Trusting your instincts matters as much as gathering data. No lives were lost because you investigated, but the money is gone.
                            </div>
                        )}
                    </div>

                    <button
                        className="bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white px-12 py-5 rounded-xl font-bold tracking-[0.3em] uppercase transition-all border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_50px_rgba(239,68,68,0.6)] hover:-translate-y-1"
                        onClick={() => completeLevel(false, 0, 0)}
                    >
                        Accept Consequences
                    </button>
                </div>
            </div>
        );
    }

    if (gameState === 'victory_outcome') {
        return (
            <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden animate-cinematic-sequence">
                {/* GLOBAL TRANSITION FADE */}
                <div className={`absolute inset-0 bg-black z-[9999] transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
                <div className="absolute inset-0 bg-emerald-950/30 z-0"></div>
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none"></div>
                <div className="w-[800px] h-[800px] absolute bg-emerald-600/10 rounded-full blur-[150px] z-0 animate-pulse"></div>

                <div className="z-10 text-center max-w-3xl transform transition-all translate-y-0 scale-100">
                    <span className="text-8xl mb-6 inline-block drop-shadow-[0_0_30px_rgba(16,185,129,0.8)] animate-bounce">🛡️</span>
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 to-emerald-600 uppercase tracking-[0.2em] mb-4 drop-shadow-lg">THREAT NEUTRALIZED</h1>

                    <div className="bg-slate-900/60 p-10 rounded-3xl border border-emerald-500/30 mb-10 backdrop-blur-xl text-left shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="bg-emerald-500/20 text-emerald-400 p-2 rounded-lg">💡</span>
                            <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-xl">Cyber Tip: The Phishing Net</h3>
                        </div>
                        <p className="text-emerald-50 text-xl mb-4 leading-relaxed font-light">
                            Always verify the sender's actual email domain — not just the display name. Hover over links <strong className="text-emerald-300 font-bold">BEFORE</strong> clicking to see the real URL.
                        </p>
                        <p className="text-emerald-100/70 text-lg leading-relaxed mb-8">
                            Banks <strong>NEVER</strong> ask for passwords via email. Look for HTTPS and a valid padlock. A convincing logo means nothing without a verified domain. When in doubt, delete the email and call your bank directly using the official number on their website.
                        </p>

                        <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent my-8"></div>

                        <div className="flex justify-between items-center text-2xl font-mono text-emerald-400 bg-emerald-950/40 p-5 rounded-xl border border-emerald-500/20 shadow-inner">
                            <span className="uppercase tracking-widest font-bold text-lg">CYBER SCORE EARNED:</span>
                            <span className="font-black text-3xl">+{usedClueBoard ? '10' : '5'} PTS</span>
                        </div>
                        {!usedClueBoard && (
                            <div className="text-sm font-medium text-amber-500/80 mt-3 text-right flex items-center justify-end gap-2">
                                <span>⚠️</span>
                                Score halved for not fully investigating the Evidence Board
                            </div>
                        )}
                        {usedClueBoard && (
                            <div className="text-sm font-bold text-emerald-400 mt-3 text-right flex items-center justify-end gap-2 uppercase tracking-wider animate-pulse">
                                <span>⭐</span>
                                Flawless Investigation Bonus Applied
                            </div>
                        )}
                    </div>

                    <button
                        className="bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white px-12 py-5 rounded-xl font-bold tracking-[0.3em] uppercase transition-all border border-emerald-400/50 shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_50px_rgba(16,185,129,0.6)] hover:-translate-y-1"
                        onClick={() => completeLevel(true, 0, 0)}
                    >
                        Continue to Next Day
                    </button>
                </div>
            </div>
        );
    }

    return (
        <style dangerouslySetInnerHTML={{
            __html: `
        .animate-strikeThrough { animation: strikeThrough 1s forwards; }
        .animate-scanLine { animation: scanLine 2s linear infinite; }
        .animate-surge { animation: surge 2s infinite; }
        .animate-fadeIn { animation: fadeIn 0.5s forwards; }
        .animate-width { animation: width 1.5s ease-in-out forwards; }
        .animate-cinematic-sequence { animation: cinematic-sequence 3.5s forwards; }
        .animate-aberration { animation: aberration 1.5s infinite; }
        .animate-aberration-alt { animation: aberration-alt 1.5s infinite; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes width { from { width: 0; opacity: 0; } to { width: 12rem; opacity: 0.8; } }
        @keyframes scanLine { from { transform: translateY(-100%); } to { transform: translateY(200%); } }
        @keyframes fieldZoom { from { transform: scale(1); } to { transform: scale(1.1); } }
        @keyframes shimmerWidth { from { width: 0; } to { width: 8rem; } }
        @keyframes strikeThrough { from { width: 0; } to { width: 120%; } }
        @keyframes surge {
            0%, 100% { transform: scale(1); filter: brightness(1); }
            50% { transform: scale(1.08); filter: brightness(1.3); drop-shadow: 0 0 40px rgba(255,255,255,0.4); }
        }
        @keyframes fadeInSlow { from { opacity: 0; } 30% { opacity: 1; } to { opacity: 1; } }
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
        @keyframes cinematic-sequence {
            0% { opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { opacity: 0; }
        }
    ` }} />
    );
};

export default Level3;
