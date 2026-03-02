import React, { useState, useEffect, useCallback } from 'react';
import Player from '../components/Player';
import { useGameState } from '../context/GameStateContext';

const ROOM_WIDTH = 1200;
const ROOM_HEIGHT = 800;
const SPEED = 16;
const PLAYER_SIZE = 40;
const DESK_ZONE = { x: 500, y: 280, w: 200, h: 100 };

const checkCollision = (px, py, rect) => (
    px < rect.x + rect.w && px + PLAYER_SIZE > rect.x &&
    py < rect.y + rect.h && py + PLAYER_SIZE > rect.y
);

const CLUE_DATA = [
    { id: 1, title: 'Developer Identity', desc: "Developer is 'Digital Finance Solutions Pvt Ltd' — not 'State Bank of India'." },
    { id: 2, title: 'Download Count', desc: 'Only 4,200 downloads for a supposed major bank update? Official has 100M+.' },
    { id: 3, title: 'Dangerous Permissions', desc: 'Requests SMS, Contacts, Microphone, Location, and Device Admin rights.' },
    { id: 4, title: 'Update Gap', desc: 'App has not been updated in 11 months. Official app updates monthly.' },
    { id: 5, title: 'Fabricated Ratings', desc: '5.0 stars from only 47 reviews — all generic praise, no real feedback.' },
];

const MINI_GAME_APPS = [
    { id: 1, name: 'SBI YONO', dev: 'State Bank of India', safe: true },
    { id: 2, name: 'YONO 2024 Pro', dev: 'Digital Finance Solutions', safe: false },
    { id: 3, name: 'BHIM UPI', dev: 'NPCI', safe: true },
    { id: 4, name: 'QuickLoan SBI', dev: 'FastCash Digital', safe: false },
    { id: 5, name: 'Google Pay', dev: 'Google LLC', safe: true },
    { id: 6, name: 'SBI SecureOTP', dev: 'AppTech India', safe: false },
];

const Level3 = () => {
    const { completeLevel, adjustAssets, adjustLives } = useGameState();
    const [playerPos, setPlayerPos] = useState({ x: 580, y: 700 });
    const [keys, setKeys] = useState({});
    const [gameState, setGameState] = useState('walk');
    const [canInteract, setCanInteract] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState(null);
    const [cluesFound, setCluesFound] = useState([]);
    const [isDetectiveModeOpen, setIsDetectiveModeOpen] = useState(true);
    const [permissionStep, setPermissionStep] = useState(0);
    const [clickedSmsLink, setClickedSmsLink] = useState(false);
    const [reportReason, setReportReason] = useState(null);

    // Mini-game state
    const [safeBucket, setSafeBucket] = useState([]);
    const [maliciousBucket, setMaliciousBucket] = useState([]);
    const [draggedApp, setDraggedApp] = useState(null);
    const [miniGameOver, setMiniGameOver] = useState(false);
    const [miniGameMsg, setMiniGameMsg] = useState('');

    const usedClueBoard = cluesFound.length >= 3;
    const unassignedApps = MINI_GAME_APPS.filter(a => !safeBucket.find(s => s.id === a.id) && !maliciousBucket.find(m => m.id === a.id));

    useEffect(() => {
        const dk = (e) => setKeys(k => ({ ...k, [e.key.toLowerCase()]: true }));
        const uk = (e) => setKeys(k => ({ ...k, [e.key.toLowerCase()]: false }));
        window.addEventListener('keydown', dk);
        window.addEventListener('keyup', uk);
        return () => { window.removeEventListener('keydown', dk); window.removeEventListener('keyup', uk); };
    }, []);

    // E key interaction
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key.toLowerCase() === 'e' && canInteract && gameState === 'walk') {
                setGameState('sms_ui');
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [canInteract, gameState]);

    useEffect(() => {
        if (gameState !== 'walk') return;
        let frameId;
        const loop = () => {
            setPlayerPos(p => {
                let nx = p.x, ny = p.y;
                if (keys['w'] || keys['arrowup']) ny -= SPEED;
                if (keys['s'] || keys['arrowdown']) ny += SPEED;
                if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                if (keys['d'] || keys['arrowright']) nx += SPEED;
                nx = Math.max(0, Math.min(nx, ROOM_WIDTH - PLAYER_SIZE));
                ny = Math.max(120, Math.min(ny, ROOM_HEIGHT - PLAYER_SIZE));
                if (checkCollision(nx, ny, DESK_ZONE)) {
                    if (p.x + PLAYER_SIZE <= DESK_ZONE.x || p.x >= DESK_ZONE.x + DESK_ZONE.w) nx = p.x;
                    if (p.y + PLAYER_SIZE <= DESK_ZONE.y || p.y >= DESK_ZONE.y + DESK_ZONE.h) ny = p.y;
                }
                setCanInteract(checkCollision(nx, ny, { x: DESK_ZONE.x - 30, y: DESK_ZONE.y - 30, w: DESK_ZONE.w + 60, h: DESK_ZONE.h + 60 }));
                return { x: nx, y: ny };
            });
            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [keys, gameState]);

    const unlockClue = useCallback((id) => {
        if (cluesFound.includes(id)) return;
        setCluesFound(prev => [...prev, id]);
        setFeedbackMsg(`🔍 Clue ${cluesFound.length + 1}/6 Found!`);
        setTimeout(() => setFeedbackMsg(null), 2000);
    }, [cluesFound]);

    const showFeedback = (msg) => { setFeedbackMsg(msg); setTimeout(() => setFeedbackMsg(null), 2500); };

    // Mini-game handlers
    const handleDragStart = (e, app) => { setDraggedApp(app); e.dataTransfer.effectAllowed = 'move'; };
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e, bucket) => {
        e.preventDefault();
        if (!draggedApp) return;
        if (bucket === 'safe') setSafeBucket(prev => [...prev, draggedApp]);
        else setMaliciousBucket(prev => [...prev, draggedApp]);
        setDraggedApp(null);
    };
    const checkMiniGame = () => {
        const safeCorrect = safeBucket.every(a => a.safe);
        const malCorrect = maliciousBucket.every(a => !a.safe);
        if (safeCorrect && malCorrect) {
            setMiniGameMsg('🎉 Perfect! All apps sorted correctly!');
        } else {
            setMiniGameMsg('❌ Some apps were misplaced. Review the clues!');
        }
        setMiniGameOver(true);
    };

    // ─── FEEDBACK TOAST ───
    const FeedbackToast = () => feedbackMsg ? (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] bg-amber-500 text-black font-bold px-8 py-3 rounded-full shadow-2xl animate-bounce text-lg">
            {feedbackMsg}
        </div>
    ) : null;

    // ═══════════════════════════════════════════
    // WALK STATE — Thatha's Study
    // ═══════════════════════════════════════════
    if (gameState === 'walk') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950 px-8">
                <FeedbackToast />
                <div className="relative bg-zinc-800 border-8 border-zinc-900 shadow-2xl overflow-hidden" style={{ width: ROOM_WIDTH, height: ROOM_HEIGHT }}>
                    {/* Wood Floor */}
                    <div className="absolute inset-0 bg-amber-900" style={{
                        backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(0,0,0,0.3) 48px, rgba(0,0,0,0.3) 50px),
                        linear-gradient(90deg, rgba(120,53,15,0.7), rgba(160,75,20,0.7)),
                        repeating-linear-gradient(0deg, transparent, transparent 200px, rgba(0,0,0,0.3) 200px, rgba(0,0,0,0.3) 202px)`
                    }}></div>

                    {/* Top Wall */}
                    <div className="absolute top-0 left-0 right-0 h-[120px] bg-gradient-to-b from-slate-700 to-slate-600 z-0 border-b-4 border-amber-800">
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-slate-500/30"></div>
                        <div className="absolute -bottom-1 left-0 right-0 h-2 bg-amber-900"></div>
                    </div>

                    {/* Window (morning light) */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[300px] h-[100px] bg-slate-950 border-8 border-amber-800 z-[5] rounded-t-lg overflow-hidden" style={{ boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6)' }}>
                        <div className="absolute inset-0 bg-gradient-to-b from-sky-300/60 to-amber-100/40"></div>
                        <div className="absolute bottom-0 left-0 right-0 h-6 flex items-end gap-1 px-2">
                            <div className="w-8 h-4 bg-emerald-800/60 rounded-t-full"></div>
                            <div className="w-6 h-6 bg-emerald-700/60 rounded-t-full"></div>
                            <div className="w-10 h-3 bg-emerald-800/60 rounded-t-full"></div>
                            <div className="w-5 h-5 bg-emerald-700/60 rounded-t-full"></div>
                        </div>
                        <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-amber-800 -translate-x-1/2"></div>
                        <div className="absolute left-0 right-0 top-1/2 h-1 bg-amber-800 -translate-y-1/2"></div>
                    </div>

                    {/* Picture frames */}
                    <div className="absolute top-6 left-[140px] w-16 h-12 bg-zinc-700 border-4 border-amber-700 z-[5] rounded-sm" style={{ boxShadow: '2px 2px 6px rgba(0,0,0,0.4)' }}>
                        <div className="w-full h-full bg-gradient-to-br from-emerald-900/40 to-cyan-900/40"></div>
                    </div>
                    <div className="absolute top-8 right-[140px] w-14 h-10 bg-zinc-700 border-4 border-amber-700 z-[5] rounded-sm" style={{ boxShadow: '2px 2px 6px rgba(0,0,0,0.4)' }}>
                        <div className="w-full h-full bg-gradient-to-br from-amber-900/40 to-red-900/40"></div>
                    </div>

                    {/* Rug */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[600px] h-[400px] bg-red-950 border-[10px] border-red-900/80 rounded-lg z-0 overflow-hidden" style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}>
                        <div className="w-[92%] h-[90%] m-auto mt-[5%] border-2 border-yellow-700/40 flex justify-center items-center">
                            <div className="w-[85%] h-[85%] border-2 border-red-800/60 flex justify-center items-center">
                                <div className="w-28 h-28 bg-yellow-700/20 rotate-45 border border-yellow-800/30"></div>
                            </div>
                        </div>
                    </div>

                    {/* Bookshelf left */}
                    <div className="absolute top-[120px] left-12 w-44 h-20 bg-amber-950 z-10 flex p-2 gap-1 items-end rounded-b-sm" style={{ borderBottom: '6px solid #78350f', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                        <div className="w-3 h-14 bg-red-800 rounded-t-sm"></div>
                        <div className="w-4 h-12 bg-blue-800 rounded-t-sm"></div>
                        <div className="w-3 h-10 bg-green-800 rounded-t-sm -rotate-6"></div>
                        <div className="w-4 h-14 bg-yellow-700 rounded-t-sm ml-2"></div>
                        <div className="w-3 h-13 bg-slate-600 rounded-t-sm"></div>
                        <div className="w-4 h-11 bg-indigo-700 rounded-t-sm"></div>
                        <div className="w-3 h-14 bg-rose-700 rounded-t-sm"></div>
                    </div>

                    {/* Bookshelf right */}
                    <div className="absolute top-[120px] right-12 w-44 h-20 bg-amber-950 z-10 flex p-2 gap-1 items-end justify-end rounded-b-sm" style={{ borderBottom: '6px solid #78350f', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                        <div className="w-3 h-12 bg-indigo-800 rounded-t-sm rotate-6"></div>
                        <div className="w-4 h-14 bg-rose-800 rounded-t-sm"></div>
                        <div className="w-5 h-10 bg-emerald-700 rounded-t-sm ml-2"></div>
                        <div className="w-3 h-14 bg-slate-700 rounded-t-sm"></div>
                        <div className="w-4 h-12 bg-cyan-800 rounded-t-sm"></div>
                        <div className="w-3 h-11 bg-amber-700 rounded-t-sm"></div>
                    </div>

                    {/* Desk */}
                    <div className="absolute bg-amber-800 shadow-2xl rounded-md z-10" style={{ left: DESK_ZONE.x, top: DESK_ZONE.y, width: DESK_ZONE.w, height: DESK_ZONE.h, boxShadow: '0 6px 20px rgba(0,0,0,0.6)' }}>
                        <div className="absolute top-2 left-3 w-6 h-4 bg-amber-100/80 border border-amber-600 rounded-sm"></div>
                        <div className="absolute top-2 left-12 w-8 h-5 bg-slate-800 border border-slate-600 rounded-sm"></div>
                        <div className="absolute top-2 right-3 w-5 h-7 bg-slate-300 border border-slate-400 rounded-sm">
                            <div className="w-3 h-1 bg-blue-500 mx-auto mt-1 rounded-full animate-pulse"></div>
                        </div>
                        <div className="absolute bottom-0 left-4 w-2 h-6 bg-amber-950"></div>
                        <div className="absolute bottom-0 right-4 w-2 h-6 bg-amber-950"></div>
                    </div>

                    {/* Phone notification bubble */}
                    {canInteract && (
                        <div className="absolute z-30 animate-bounce" style={{ left: DESK_ZONE.x + DESK_ZONE.w - 20, top: DESK_ZONE.y - 30 }}>
                            <div className="bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg">1</div>
                        </div>
                    )}

                    {/* Potted Plant left */}
                    <div className="absolute top-[130px] left-4 z-20 flex flex-col items-center">
                        <div className="w-20 relative" style={{ height: 72 }}>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-5 bg-red-800 rounded-b-lg rounded-t-sm border-2 border-red-900"></div>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-1 h-10 bg-green-900"></div>
                            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-14 h-14 bg-green-700 rounded-full opacity-80" style={{ filter: 'blur(2px)' }}></div>
                            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-10 h-10 bg-green-600 rounded-full opacity-70" style={{ filter: 'blur(1px)' }}></div>
                        </div>
                    </div>

                    <Player x={playerPos.x} y={playerPos.y} />

                    {/* Interaction Prompt */}
                    {canInteract && (
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-amber-500/60 text-amber-400 font-bold px-8 py-4 rounded-xl animate-bounce cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)] z-50 select-none"
                            onClick={() => setGameState('sms_ui')}>
                            <span className="text-amber-300 mr-2">[ E ]</span> CHECK PHONE 📱
                        </div>
                    )}

                    {/* Day/Location label */}
                    <div className="absolute top-4 left-4 z-30 bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-700/50">
                        <p className="text-amber-400 font-bold text-xs tracking-widest uppercase">DAY 3 — MORNING</p>
                        <p className="text-slate-400 text-[10px] font-mono">THATHA'S STUDY</p>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // SMS UI — Single message, report option
    // ═══════════════════════════════════════════
    if (gameState === 'sms_ui') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950 p-4">
                <FeedbackToast />
                <div className="w-[380px] h-[750px] bg-zinc-900 border-x-[12px] border-t-[12px] border-b-[24px] border-black rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col items-center">
                    {/* Status bar */}
                    <div className="w-full flex justify-between items-center px-8 pt-3 pb-1 text-[10px] text-slate-400 font-mono">
                        <span>9:41 AM</span>
                        <span>●●●● WiFi 🔋</span>
                    </div>

                    {/* SMS Header with Report */}
                    <div className="w-full bg-slate-800 flex items-center gap-3 px-4 py-3 border-b border-slate-700">
                        <button className="text-slate-400 text-sm" onClick={() => setGameState('walk')}>← Back</button>
                        <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-white text-xs font-bold">!</div>
                        <div className="flex-1">
                            <h3 className="font-bold text-white text-sm">VM-SBINFO</h3>
                            <p className="text-[10px] text-slate-500">SMS</p>
                        </div>
                        <button className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-slate-600"
                            onClick={() => { setClickedSmsLink(false); setGameState('report_sms'); }}>
                            ⚑ Report
                        </button>
                    </div>

                    {/* Single SMS Message */}
                    <div className="flex-1 w-full flex flex-col p-4 gap-3 overflow-y-auto">
                        <p className="text-slate-600 text-[10px] text-center mb-2">Today, 9:38 AM</p>
                        <div className="bg-slate-800 text-slate-100 p-4 rounded-2xl rounded-tl-sm w-5/6 shadow-md border border-slate-700/50 text-sm leading-relaxed">
                            Dear Customer, your SBI YONO app access will expire in 24hrs due to incomplete KYC verification. To avoid account suspension, update your app immediately. Download the latest secure version: <span className="text-blue-400 font-mono text-xs break-all cursor-pointer hover:underline" onClick={() => { setClickedSmsLink(true); setGameState('sms_clicked'); }}>https://sbi-kyc-update24.app/download</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // REPORT SMS — Select reason, then go to comparison
    // ═══════════════════════════════════════════
    if (gameState === 'report_sms') {
        const reasons = [
            'Suspicious link / phishing attempt',
            'Impersonating a bank or company',
            'Unsolicited financial message',
            'Promoting fake app / software',
        ];
        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950 p-4">
                <div className="w-[380px] bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-6">
                        <div className="text-4xl mb-3">⚑</div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-widest">Report SMS</h2>
                        <p className="text-slate-500 text-xs mt-2">Why are you reporting this message?</p>
                    </div>
                    <div className="space-y-3 mb-6">
                        {reasons.map((r, i) => (
                            <button key={i}
                                className={`w-full text-left p-3 rounded-xl text-sm font-medium transition-colors border ${reportReason === i ? 'bg-slate-700 border-slate-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 hover:text-slate-300'}`}
                                onClick={() => setReportReason(i)}>
                                {r}
                            </button>
                        ))}
                    </div>
                    {reportReason !== null && (
                        <div>
                            <div className="bg-emerald-900/30 border border-emerald-700/50 rounded-xl p-4 mb-4 text-center">
                                <p className="text-emerald-400 font-bold text-sm">🎯 +10 BONUS — Smart decision to report!</p>
                            </div>
                            <p className="text-slate-400 text-xs mb-4 text-center italic">Report submitted. You still need the real SBI YONO app for Thatha's accounts — let's search the Play Store.</p>
                            <button className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition-colors"
                                onClick={() => setGameState('comparison_ui')}>
                                🔍 Open Play Store
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // SMS CLICKED — Penalty, then comparison
    // ═══════════════════════════════════════════
    if (gameState === 'sms_clicked') {
        return (
            <div className="w-full h-full bg-slate-950 flex items-center justify-center p-8">
                <div className="max-w-lg bg-slate-900 border border-red-500/30 rounded-3xl p-10 shadow-2xl text-center">
                    <div className="text-6xl mb-6">⚠️</div>
                    <h2 className="text-2xl font-black text-red-400 uppercase tracking-widest mb-4">RISKY CLICK!</h2>
                    <p className="text-slate-300 leading-relaxed mb-3">You clicked on a suspicious link from an unknown SMS. This could have led to malware being installed on your device.</p>
                    <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4 mb-8">
                        <p className="text-red-400 font-bold text-sm">💸 -₹5,000 PENALTY — Data exposure risk</p>
                    </div>
                    <p className="text-slate-400 text-sm mb-6 italic">The link opened an app store page. Be careful which app you install...</p>
                    <button className="bg-slate-700 hover:bg-slate-600 text-white px-10 py-4 rounded-xl font-bold transition-colors"
                        onClick={() => { adjustAssets(-5000); setGameState('comparison_ui'); }}>
                        Continue to App Store
                    </button>
                </div>
            </div>
        );
    }

    if (gameState === 'comparison_ui') {
        const circleClue = (id) => {
            if (!cluesFound.includes(id)) {
                setCluesFound(prev => [...prev, id]);
                setFeedbackMsg(`🔴 Circled! Clue ${cluesFound.length + 1}/5 found`);
                setTimeout(() => setFeedbackMsg(null), 2000);
            }
        };

        // Clickable element — no highlight, shows hand-drawn red circle on click
        const Circleable = ({ clueId, children, className = '' }) => {
            const found = cluesFound.includes(clueId);
            return (
                <span
                    className={`cursor-pointer relative select-none transition-all duration-300 inline-block ${className}`}
                    onClick={() => circleClue(clueId)}
                    style={found ? {
                        outline: '3px dashed #ef4444',
                        outlineOffset: '4px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(239,68,68,0.08)',
                        transform: 'scale(1.03)',
                    } : {}}
                >
                    {children}
                    {found && <span className="absolute -top-2 -right-2 text-red-500 text-lg font-black drop-shadow-md" style={{ lineHeight: 1 }}>⭕</span>}
                </span>
            );
        };

        return (
            <div className="w-full h-full bg-zinc-900 p-4 flex flex-row items-stretch gap-3 relative">
                <FeedbackToast />

                {/* LEFT — App Store Comparison */}
                <div className="flex-1 min-w-0 bg-slate-950 rounded-2xl border-[6px] border-black shadow-2xl flex flex-col overflow-hidden">

                    {/* Store Header */}
                    <div className="bg-slate-800 px-6 py-3 flex items-center justify-between border-b border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-emerald-500 rounded-md shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            <span className="text-white font-bold tracking-wider text-sm">Play Store</span>
                        </div>
                        <div className="text-slate-400 text-[11px] font-mono">Click on suspicious elements to circle them</div>
                    </div>

                    {/* App Cards */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <h2 className="text-white text-lg font-black mb-5 uppercase tracking-widest">Search: "SBI YONO"</h2>

                        <div className="grid grid-cols-2 gap-5">
                            {/* App A — Official */}
                            <div className="bg-white rounded-2xl p-5 shadow-xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-lg">YONO</div>
                                    <div>
                                        <h3 className="font-black text-lg">SBI YONO</h3>
                                        <p className="text-green-700 font-bold text-xs flex items-center gap-1">State Bank of India <span className="bg-green-100 text-green-700 px-1 rounded text-[10px]">✓ Verified</span></p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center mb-4 text-xs">
                                    <div className="bg-slate-100 p-2 rounded"><p className="font-bold text-slate-800">⭐ 4.2</p><p className="text-slate-500">1.2M reviews</p></div>
                                    <div className="bg-slate-100 p-2 rounded"><p className="font-bold text-slate-800">100M+</p><p className="text-slate-500">Downloads</p></div>
                                    <div className="bg-slate-100 p-2 rounded"><p className="font-bold text-slate-800">Mar 2024</p><p className="text-slate-500">Updated</p></div>
                                </div>
                                <p className="text-slate-600 text-xs mb-4">Official banking app by State Bank of India. Manage accounts, transfers, and investments securely.</p>
                                <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg"
                                    onClick={() => setGameState('report_ui')}>
                                    ✅ INSTALL OFFICIAL
                                </button>
                            </div>

                            {/* App B — Fake (clickable elements, NO visual hints) */}
                            <div className="bg-white rounded-2xl p-5 shadow-xl relative">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center text-white font-black text-[10px] shadow-lg leading-tight text-center">YONO<br />PRO</div>
                                    <div>
                                        <h3 className="font-black text-lg">SBI YONO 2024 Pro</h3>
                                        <Circleable clueId={1} className="text-slate-500 font-bold text-xs block">
                                            Digital Finance Solutions Pvt Ltd
                                        </Circleable>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center mb-4 text-xs">
                                    <div className="bg-slate-100 p-2 rounded">
                                        <Circleable clueId={5}><p className="font-bold text-slate-800">⭐ 5.0</p><p className="text-slate-500">47 reviews</p></Circleable>
                                    </div>
                                    <div className="bg-slate-100 p-2 rounded">
                                        <Circleable clueId={2}><p className="font-bold text-slate-800">4,200</p><p className="text-slate-500">Downloads</p></Circleable>
                                    </div>
                                    <div className="bg-slate-100 p-2 rounded">
                                        <Circleable clueId={4}><p className="font-bold text-slate-800">Apr 2023</p><p className="text-slate-500">Updated</p></Circleable>
                                    </div>
                                </div>
                                <Circleable clueId={3} className="text-slate-500 text-[11px] block mb-3">
                                    Permissions: READ_SMS, READ_CONTACTS, RECORD_AUDIO, ACCESS_FINE_LOCATION, BIND_DEVICE_ADMIN
                                </Circleable>

                                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors"
                                    onClick={() => setGameState('permission_cascade')}>
                                    📥 INSTALL PRO VERSION
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="bg-slate-800 px-6 py-3 flex items-center justify-between border-t border-slate-700">
                        <button className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                            onClick={() => setGameState('sms_ui')}>
                            ← Back
                        </button>
                        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-sm border border-indigo-400 transition-transform hover:scale-105"
                            onClick={() => setGameState('mini_game')}>
                            🎓 TRAINING
                        </button>
                    </div>
                </div>

                {/* RIGHT — Evidence Board (always visible) */}
                <div
                    className="flex-shrink-0 flex-grow-0 min-h-0 bg-amber-100 rounded-lg shadow-[-10px_0_40px_rgba(0,0,0,0.6)] flex flex-col border-[12px] border-[#5c3a21] overflow-hidden"
                    style={{
                        width: 380, minWidth: 380, maxWidth: 380,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23a)' opacity='.2'/%3E%3C/svg%3E")`,
                        backgroundColor: '#e6c280'
                    }}
                >
                    {/* Board Header */}
                    <div className="p-3 bg-[#5c3a21] border-b-2 border-amber-900/50">
                        <h2 className="text-sm font-black text-amber-100 uppercase tracking-widest font-mono flex items-center gap-2">
                            📌 INVESTIGATION BOARD
                        </h2>
                        <p className="text-amber-300/60 text-[10px] mt-1">Read the hints. Click suspicious elements on the left.</p>
                    </div>

                    {/* Clue Slots */}
                    <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                        <div className="grid grid-cols-2 gap-3">
                            {CLUE_DATA.map((clue, idx) => {
                                const found = cluesFound.includes(clue.id);
                                return (
                                    <div
                                        key={clue.id}
                                        className={`p-3 rounded-lg shadow-md border-l-4 transition-all relative min-h-[90px] ${found ? 'bg-yellow-50 border-red-600' : 'bg-stone-200/60 border-stone-400/50 border-dashed'}`}
                                        style={{ transform: `rotate(${(idx % 2 === 0 ? -1 : 1) * (0.5 + idx * 0.3)}deg)` }}
                                    >
                                        {found && (
                                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 shadow-md border border-red-800 z-10">
                                                <div className="w-1.5 h-1.5 rounded-full bg-white/40 absolute top-0.5 right-0.5"></div>
                                            </div>
                                        )}
                                        {found ? (
                                            <>
                                                <h4 className="font-bold text-xs text-red-800 mb-1 mt-1">🔴 {clue.title}</h4>
                                                <p className="text-[10px] text-amber-900 font-mono leading-relaxed">{clue.desc}</p>
                                            </>
                                        ) : (
                                            <>
                                                <h4 className="font-bold text-xs text-stone-500 mb-2">🔒 Clue #{clue.id}</h4>
                                                <p className="text-[10px] text-stone-400 italic leading-relaxed">
                                                    {clue.id === 1 && 'Hint: Check who made the app...'}
                                                    {clue.id === 2 && 'Hint: How many people downloaded it?'}
                                                    {clue.id === 3 && 'Hint: What access does it want?'}
                                                    {clue.id === 4 && 'Hint: When was it last updated?'}
                                                    {clue.id === 5 && 'Hint: Are the reviews realistic?'}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {usedClueBoard && (
                            <div className="mt-4 text-center text-emerald-700 font-bold text-sm bg-emerald-100 p-2 rounded border border-emerald-300 animate-pulse">
                                ⭐ Investigation Bonus — {cluesFound.length}/5 clues found!
                            </div>
                        )}
                    </div>

                    {/* Board Footer */}
                    <div className="p-3 bg-[#5c3a21]/30 border-t border-amber-900/30 text-center">
                        <p className="text-[10px] text-stone-600 font-mono">{cluesFound.length}/5 suspicious elements circled</p>
                    </div>
                </div>
            </div>
        );
    }


    // ═══════════════════════════════════════════
    // REPORT UI — Official App Installed
    // ═══════════════════════════════════════════
    if (gameState === 'report_ui') {
        return (
            <div className="w-full h-full bg-slate-900 p-8 flex flex-col items-center justify-center text-white">
                <div className="bg-slate-800 p-10 rounded-2xl shadow-2xl max-w-md text-center border border-slate-700">
                    <div className="text-5xl mb-6">✅</div>
                    <h2 className="text-2xl font-bold mb-4 uppercase tracking-widest">Official App Installed</h2>
                    <p className="text-slate-400 mb-8 text-sm leading-relaxed">You've installed the real SBI YONO app from the Play Store. Now report the scam SMS to protect others.</p>
                    <button className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold shadow-lg transition-colors" onClick={() => setGameState('report_ui_final')}>
                        🚔 REPORT TO CYBER CELL
                    </button>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // REPORT FINAL — Cyber Cell Filing
    // ═══════════════════════════════════════════
    if (gameState === 'report_ui_final') {
        return (
            <div className="w-full h-full bg-slate-950 p-8 flex items-center justify-center">
                <div className="w-[500px] bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="text-5xl mb-4">👮</div>
                        <h2 className="text-xl font-bold text-white uppercase tracking-widest">CYBER CELL REPORT</h2>
                        <p className="text-slate-500 text-xs mt-2">cybercrime.gov.in</p>
                    </div>
                    <div className="space-y-4 mb-8">
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-slate-500 text-xs uppercase mb-1">Incident Type</p><p className="text-white font-mono text-sm">Phishing / Malicious APK Distribution via SMS</p></div>
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-slate-500 text-xs uppercase mb-1">Sender ID</p><p className="text-white font-mono text-sm">VM-SBINFO</p></div>
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-slate-500 text-xs uppercase mb-1">Malicious URL</p><p className="text-red-400 font-mono text-xs">https://sbi-kyc-update24.app/download</p></div>
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700"><p className="text-slate-500 text-xs uppercase mb-1">Evidence Collected</p><p className="text-amber-400 font-mono text-sm">{cluesFound.length} / 6 clues documented</p></div>
                    </div>
                    <button className="w-full bg-emerald-600 py-4 rounded-xl font-bold text-white shadow-lg hover:bg-emerald-500 transition-colors" onClick={() => setGameState('mini_game')}>
                        ✅ SUBMIT COMPLAINT
                    </button>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // MINI GAME — App Authenticity Sort
    // ═══════════════════════════════════════════
    if (gameState === 'mini_game') {
        const isComplete = unassignedApps.length === 0;
        return (
            <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-900/20 rounded-full blur-[100px]"></div>
                </div>

                <div className="z-10 w-full max-w-4xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-wider">App Authenticity Training</h2>
                            <p className="text-slate-400 text-sm mt-1">Drag each app into the correct bucket</p>
                        </div>
                    </div>

                    {!miniGameOver ? (
                        <>
                            {/* App Cards */}
                            <div className="flex flex-wrap gap-3 justify-center mb-8 min-h-[80px]">
                                {unassignedApps.length > 0 ? unassignedApps.map(app => (
                                    <div key={app.id} draggable className="bg-white text-slate-900 px-5 py-3 rounded-lg shadow-lg border-2 border-slate-300 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
                                        onDragStart={(e) => handleDragStart(e, app)}>
                                        <p className="font-bold text-sm">{app.name}</p>
                                        <p className="text-[10px] text-slate-500">{app.dev}</p>
                                    </div>
                                )) : (
                                    <div className="text-xl text-slate-500 italic">All apps sorted!</div>
                                )}
                            </div>

                            {/* Buckets */}
                            <div className="flex justify-center gap-8 w-full">
                                <div className="flex-1 border-4 border-dashed border-emerald-600/50 bg-emerald-900/20 rounded-xl flex flex-col items-center p-4 min-h-[200px] transition-colors hover:bg-emerald-900/40"
                                    onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'safe')}>
                                    <h3 className="text-lg font-bold text-emerald-500 mb-3 bg-emerald-950 px-4 py-2 rounded-full border border-emerald-800">✅ SAFE APPS</h3>
                                    <div className="w-full flex flex-col gap-2">
                                        {safeBucket.map(a => (<div key={a.id} className="bg-emerald-100 text-emerald-900 px-3 py-2 rounded text-sm font-bold border border-emerald-300">{a.name}</div>))}
                                    </div>
                                </div>
                                <div className="flex-1 border-4 border-dashed border-red-600/50 bg-red-900/20 rounded-xl flex flex-col items-center p-4 min-h-[200px] transition-colors hover:bg-red-900/40"
                                    onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'malicious')}>
                                    <h3 className="text-lg font-bold text-red-500 mb-3 bg-red-950 px-4 py-2 rounded-full border border-red-800">🚨 MALICIOUS</h3>
                                    <div className="w-full flex flex-col gap-2">
                                        {maliciousBucket.map(a => (<div key={a.id} className="bg-red-100 text-red-900 px-3 py-2 rounded text-sm font-bold border border-red-300">{a.name}</div>))}
                                    </div>
                                </div>
                            </div>

                            {isComplete && (
                                <div className="mt-8 flex justify-center">
                                    <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xl font-bold px-12 py-3 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] animate-bounce" onClick={checkMiniGame}>
                                        Verify My Sorting
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                            <h2 className="text-5xl mb-6">{miniGameMsg.includes('Perfect') ? '🎉' : '❌'}</h2>
                            <h3 className="text-3xl font-bold text-white mb-8">{miniGameMsg}</h3>
                            <button className="bg-emerald-600 hover:bg-emerald-500 px-10 py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-colors"
                                onClick={() => setGameState('victory_outcome')}>
                                Continue to Results →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // PERMISSION CASCADE (Wrong Path)
    // ═══════════════════════════════════════════
    if (gameState === 'permission_cascade') {
        const permissions = ['📇 Contacts & Call Logs', '💬 SMS Messages', '🎤 Microphone, 📍 Location, 🔐 Device Admin'];
        return (
            <div className="w-full h-full bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-[360px] overflow-hidden">
                    <div className="bg-slate-800 p-4 text-white flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-xs font-bold">YP</div>
                        <span className="font-bold">YONO 2024 Pro</span>
                    </div>
                    <div className="p-6">
                        <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Permission {permissionStep + 1} of 3</p>
                        <p className="text-slate-800 font-bold text-lg mb-6">Allow access to {permissions[permissionStep]}?</p>
                        <div className="flex flex-col gap-3">
                            <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-full transition-colors"
                                onClick={() => { if (permissionStep < 2) setPermissionStep(p => p + 1); else setGameState('scam_outcome'); }}>
                                ALLOW
                            </button>
                            <button className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 rounded-full transition-colors"
                                onClick={() => { setPermissionStep(0); setGameState('comparison_ui'); }}>
                                DENY
                            </button>
                        </div>
                        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                            <p className="text-amber-700 text-[10px] font-mono">⚠️ Legitimate banking apps never require Device Admin or Microphone access.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // SCAM OUTCOME (Wrong Path)
    // ═══════════════════════════════════════════
    if (gameState === 'scam_outcome') {
        return (
            <div className="w-full h-full bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-red-950/40 z-0"></div>
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none"></div>
                <div className="w-[800px] h-[800px] absolute bg-red-600/10 rounded-full blur-[150px] z-0 animate-pulse"></div>

                <div className="z-10 text-center max-w-3xl">
                    <span className="text-8xl mb-6 inline-block drop-shadow-[0_0_30px_rgba(239,68,68,0.8)] animate-bounce">💸</span>
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-400 to-red-700 uppercase tracking-[0.2em] mb-4">DEVICE COMPROMISED</h1>

                    <div className="bg-slate-900/60 p-10 rounded-3xl border border-red-500/30 mb-10 backdrop-blur-xl text-left shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                        <p className="text-red-100 text-xl mb-4 font-light leading-relaxed">You installed a malicious APK and granted it full device access. The malware intercepted your OTPs and initiated unauthorized transactions.</p>
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-red-500/50 to-transparent my-6"></div>
                        <div className="flex justify-between items-center text-2xl font-mono text-red-400 bg-red-950/40 p-5 rounded-xl border border-red-500/20 shadow-inner">
                            <span className="uppercase tracking-widest font-bold">FUNDS LOST:</span>
                            <span className="font-black text-3xl">-₹6,50,000</span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-black text-red-500 mt-4 animate-pulse uppercase tracking-widest bg-red-950 p-3 rounded border border-red-800">
                            <span>LIVES LOST:</span><span>-1 LIFE</span>
                        </div>
                    </div>

                    <button className="bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white px-12 py-5 rounded-xl font-bold tracking-[0.3em] uppercase transition-all border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_50px_rgba(239,68,68,0.6)] hover:-translate-y-1"
                        onClick={() => { adjustAssets(-650000); adjustLives(-1); completeLevel(false, 0, 0); }}>
                        Accept Consequences
                    </button>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // VICTORY OUTCOME
    // ═══════════════════════════════════════════
    if (gameState === 'victory_outcome') {
        return (
            <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-emerald-950/30 z-0"></div>
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)] pointer-events-none"></div>
                <div className="w-[800px] h-[800px] absolute bg-emerald-600/10 rounded-full blur-[150px] z-0 animate-pulse"></div>

                <div className="z-10 text-center max-w-3xl">
                    <span className="text-8xl mb-6 inline-block drop-shadow-[0_0_30px_rgba(16,185,129,0.8)] animate-bounce">🛡️</span>
                    <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 to-emerald-600 uppercase tracking-[0.2em] mb-4">THREAT NEUTRALIZED</h1>

                    <div className="bg-slate-900/60 p-10 rounded-3xl border border-emerald-500/30 mb-10 backdrop-blur-xl text-left shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="bg-emerald-500/20 text-emerald-400 p-2 rounded-lg">💡</span>
                            <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-xl">Cyber Tip: Fake Apps</h3>
                        </div>
                        <p className="text-emerald-50 text-xl mb-4 leading-relaxed font-light">
                            Always download apps from <strong className="text-emerald-300 font-bold">official app stores</strong>. Never install APKs from links received via SMS or messaging apps.
                        </p>
                        <p className="text-emerald-100/70 text-lg leading-relaxed mb-6">
                            Check the developer name, download count, ratings, and permissions <strong>before</strong> installing. When in doubt, visit the bank's official website.
                        </p>
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent my-6"></div>

                        {/* Score breakdown */}
                        <div className="space-y-3 mb-4">
                            <div className="flex justify-between items-center text-sm font-mono text-slate-300 bg-slate-800/50 p-3 rounded-lg">
                                <span>Base Score:</span><span className="text-emerald-400 font-bold">+10 PTS</span>
                            </div>
                            {!clickedSmsLink && (
                                <div className="flex justify-between items-center text-sm font-mono text-slate-300 bg-emerald-900/30 p-3 rounded-lg border border-emerald-700/30">
                                    <span>🛡️ Ignored Scam SMS:</span><span className="text-emerald-400 font-bold">+10 PTS</span>
                                </div>
                            )}
                            {clickedSmsLink && (
                                <div className="flex justify-between items-center text-sm font-mono text-slate-300 bg-red-900/30 p-3 rounded-lg border border-red-700/30">
                                    <span>⚠️ Clicked Scam Link:</span><span className="text-red-400 font-bold">+0 PTS</span>
                                </div>
                            )}
                            {usedClueBoard && (
                                <div className="flex justify-between items-center text-sm font-mono text-slate-300 bg-amber-900/30 p-3 rounded-lg border border-amber-700/30">
                                    <span>⭐ Investigation Bonus:</span><span className="text-amber-400 font-bold">+5 PTS</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center text-2xl font-mono text-emerald-400 bg-emerald-950/40 p-5 rounded-xl border border-emerald-500/20 shadow-inner">
                            <span className="uppercase tracking-widest font-bold text-lg">TOTAL:</span>
                            <span className="font-black text-3xl">+{10 + (!clickedSmsLink ? 10 : 0) + (usedClueBoard ? 5 : 0)} PTS</span>
                        </div>
                    </div>

                    <button className="bg-gradient-to-b from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white px-12 py-5 rounded-xl font-bold tracking-[0.3em] uppercase transition-all border border-emerald-400/50 shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_50px_rgba(16,185,129,0.6)] hover:-translate-y-1"
                        onClick={() => completeLevel(true, 10 + (!clickedSmsLink ? 10 : 0) + (usedClueBoard ? 5 : 0), 0)}>
                        Continue to Overworld
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default Level3;
