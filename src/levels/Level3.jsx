import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '../context/GameStateContext';
import Player from '../components/Player';

const ROOM_WIDTH = 1600;
const ROOM_HEIGHT = 1100;
const VIEWPORT_WIDTH = 1200;
const VIEWPORT_HEIGHT = 800;
const PLAYER_SIZE = 40;
const SPEED = 12;

// Interactive Area Constants (Relative to Room)
const DESK_PARTS = [
    { x: 600, y: 400, w: 400, h: 140 }, // Top
    { x: 600, y: 540, w: 140, h: 210 }  // Left Return
];
const LAPTOP_AREA = { x: 740, y: 420, w: 140, h: 100 };
const STICKY_NOTE_AREA = { x: 650, y: 560, w: 70, h: 70 };
const PHOTO_AREA = { x: 770, y: 10, w: 140, h: 160 };
const BOOK_AREA = { x: 60, y: 350, w: 150, h: 450 }; // Left Bookshelf
const POSTER_AREA = { x: 1250, y: 50, w: 250, h: 180 };

const CLUE_INFO = {
    'alert_received': {
        title: "Critical Security Alert",
        desc: "Someone just used your password to try to sign in to your account from Moscow.",
        icon: "🚨",
        hint: "Check the red alert on your laptop."
    },
    'rule_symbols': {
        title: "Rule #1: Mix Your Tools",
        desc: "'A strong lock is built from different materials.' Always use special characters (!@#$) and numbers.",
        icon: "⚙️",
        hint: "Check the sticky note on your desk."
    },
    'rule_length': {
        title: "Rule #2: The Great Wall",
        desc: "'A long wall is harder to climb than a thick one.' Length is your best defense—use at least 15 characters.",
        icon: "🧱",
        hint: "Look at the books in the shelf."
    },
    'rule_pii': {
        title: "Rule #3: Family Secrets",
        desc: "'Never share our names with the digital winds.' Avoid PII like our names, birthdays, or locations.",
        icon: "🖼️",
        hint: "Inspect the family photo on the wall."
    },
    'rule_patterns': {
        title: "Rule #4: No Straight Paths",
        desc: "'A straight path is easily followed.' Avoid keyboard patterns like 'qwerty' or '123456'.",
        icon: "🗺️",
        hint: "Look at the map/poster above the desk."
    }
};

const GmailAlert = ({ onProceed }) => (
    <div className="fixed inset-0 z-[3000] bg-zinc-950/80 backdrop-blur-xl flex items-center justify-center p-6 font-sans">
        <div className="max-w-xl w-full bg-white shadow-2xl rounded-xl border border-zinc-200 overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-[#f8f9fa] px-6 py-5 flex items-center gap-4 border-b border-zinc-200">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner">G</div>
                <div>
                    <span className="text-sm font-bold text-zinc-900 block">Google Account</span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">Security Notification</span>
                </div>
            </div>
            <div className="p-10">
                <div className="flex items-start gap-8 mb-10">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600 text-4xl shrink-0 border-2 border-red-100 animate-pulse">⚠️</div>
                    <div>
                        <h1 className="text-2xl font-bold text-zinc-900 leading-tight mb-3">Critical Security Alert</h1>
                        <p className="text-sm text-zinc-600 leading-relaxed">Someone just used your password to try to sign in to your account. Google blocked them, but you should check what happened and secure your account.</p>
                    </div>
                </div>

                <div className="bg-zinc-50 rounded-2xl p-8 mb-10 border border-zinc-200 shadow-inner">
                    <table className="w-full text-sm border-separate border-spacing-y-3">
                        <tbody>
                            <tr>
                                <td className="text-zinc-500 font-medium">Activity</td>
                                <td className="text-zinc-900 font-bold text-right">Unauthorized sign-in</td>
                            </tr>
                            <tr>
                                <td className="text-zinc-500 font-medium">Location</td>
                                <td className="text-red-600 font-bold text-right">Moscow, Russia</td>
                            </tr>
                            <tr>
                                <td className="text-zinc-500 font-medium">Device</td>
                                <td className="text-zinc-900 font-bold text-right">Linux x86_64 (Chrome)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <button
                    onClick={onProceed}
                    className="w-full py-4 bg-[#1a73e8] hover:bg-blue-700 text-white font-black rounded-xl transition-all shadow-xl uppercase tracking-[0.2em] text-xs"
                >
                    Secure Account & Change Password
                </button>
            </div>
        </div>
    </div>
);

const SecurityTerminal = ({ onComplete, onFail, rulesFound }) => {
    const [password, setPassword] = useState('');
    const [entropy, setEntropy] = useState(0);
    const [crackTime, setCrackTime] = useState('Seconds');

    const PII_KEYWORDS = ['rajan', 'vkram', 'grandfather', 'india'];

    useEffect(() => {
        let e = 0;
        if (password.length > 0) e += password.length * 4;
        if (/[A-Z]/.test(password)) e += 10;
        if (/[0-9]/.test(password)) e += 10;
        if (/[^A-Za-z0-9]/.test(password)) e += 15;

        PII_KEYWORDS.forEach(word => {
            if (password.toLowerCase().includes(word)) e -= 40;
        });

        const finalE = Math.min(100, Math.max(0, e));
        setEntropy(finalE);

        if (password.length === 0) setCrackTime('Seconds');
        else if (finalE < 20) setCrackTime('< 1 Second');
        else if (finalE < 40) setCrackTime('< 10 Seconds');
        else if (finalE < 60) setCrackTime('5 Minutes');
        else if (finalE < 80) setCrackTime('10 Years');
        else setCrackTime('20,000+ Centuries');
    }, [password]);

    const handleConfirm = () => {
        const hasSymbols = /[^A-Za-z0-9]/.test(password) || /[0-9]/.test(password);
        const isLong = password.length >= 15;
        const hasPII = PII_KEYWORDS.some(word => password.toLowerCase().includes(word));
        const isPattern = /(123|abc|qwerty|asdf)/i.test(password);

        if (isLong && hasSymbols && !hasPII && !isPattern && entropy > 85) {
            onComplete();
        } else {
            let error = "Password does not meet the safety requirements.";
            if (!isLong) error = "Rule #2: Too short. Remember the Great Wall (15+ chars).";
            else if (!hasSymbols) error = "Rule #1: Missing 'metals' (Special characters or numbers).";
            else if (hasPII) error = "Rule #3: Personal details detected! Keep names out of it.";
            else if (isPattern) error = "Rule #4: Do not follow a straight path (No patterns).";
            onFail(error);
        }
    };

    return (
        <div className="fixed inset-0 z-[3000] bg-zinc-950/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-white overflow-hidden">
            <div className="w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-3xl p-12 shadow-2xl relative overflow-hidden animate-in scale-in-95 duration-500">
                <div className="flex justify-between items-start mb-12">
                    <div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-white mb-2 italic">Secure Your Account</h2>
                        <p className="text-cyan-500 font-mono text-[10px] uppercase tracking-[0.3em] font-black">Authentication Shield v2.0</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-10">
                        <div>
                            <label className="block text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-4">Set New Passphrase:</label>
                            <input
                                type="text"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black border-2 border-white/10 rounded-2xl px-8 py-6 text-3xl font-black text-white focus:border-cyan-500 outline-none transition-all placeholder:text-zinc-800"
                                placeholder="........"
                                autoFocus
                            />
                        </div>

                        <div className="bg-white/5 border border-white/5 p-8 rounded-3xl backdrop-blur-md">
                            <h3 className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.3em] mb-6 flex justify-between">
                                <span>Grandfather's Rules</span>
                                <span className="text-cyan-400">{rulesFound}/4 FOUND</span>
                            </h3>
                            <div className="space-y-6">
                                {['rule_symbols', 'rule_length', 'rule_pii', 'rule_patterns'].map((r, i) => (
                                    <div key={r} className={`flex gap-4 ${rulesFound > i ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                        <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-black border mt-1 ${rulesFound > i ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-black/40 border-white/5'}`}>
                                            {rulesFound > i ? '✓' : i + 1}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-[11px] font-black tracking-widest uppercase ${rulesFound > i ? 'text-white' : ''}`}>
                                                {rulesFound > i ? CLUE_INFO[r].title : 'RULE UNDISCOVERED'}
                                            </span>
                                            {rulesFound > i && (
                                                <p className="text-[10px] text-zinc-400 leading-relaxed italic">
                                                    {CLUE_INFO[r].desc}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between">
                        <div className="text-center bg-zinc-950 border border-white/5 rounded-[3rem] p-12 relative overflow-hidden group shadow-2xl">
                            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                            <span className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.5em] block mb-6">Breach Resilience</span>
                            <div className="text-5xl font-black text-white group-hover:scale-110 transition-transform duration-700">
                                {crackTime}
                            </div>
                            <div className="mt-12">
                                <div className="flex justify-between text-[10px] font-black uppercase text-zinc-500 mb-3 tracking-widest">
                                    <span>Entropy Level</span>
                                    <span className="text-cyan-400">{entropy}%</span>
                                </div>
                                <div className="h-3 bg-zinc-900 rounded-full overflow-hidden p-0.5">
                                    <div className="h-full bg-cyan-500 transition-all duration-700 rounded-full" style={{ width: `${entropy}%` }} />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleConfirm}
                            className="w-full py-6 bg-white text-black font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-cyan-400 transition-all active:scale-95 shadow-xl text-sm"
                        >
                            Update Credentials
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Level3 = () => {
    const { completeLevel, setSafetyScore } = useGameState();
    const [gameState, setGameState] = useState('room');
    const [playerPos, setPlayerPos] = useState({ x: 800, y: 700 });
    const [keys, setKeys] = useState({});

    // State
    const [interactionTarget, setInteractionTarget] = useState(null);
    const [cluesFound, setCluesFound] = useState([]);
    const [isDetectiveModeOpen, setIsDetectiveModeOpen] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState(null);
    const [hackerProgress, setHackerProgress] = useState(0);

    const showFeedback = (msg) => {
        setFeedbackMsg(msg);
        setTimeout(() => setFeedbackMsg(null), 3500);
    };

    const discoverClue = (id) => {
        if (!cluesFound.includes(id)) {
            setCluesFound(prev => [...prev, id]);
            showFeedback(`🔍 RULE UNLOCKED: ${CLUE_INFO[id]?.title}`);
        }
    };

    const checkCollision = (px, py, rect) => (
        px < rect.x + rect.w && px + PLAYER_SIZE > rect.x &&
        py < rect.y + rect.h && py + PLAYER_SIZE > rect.y
    );

    // Movement Loop
    useEffect(() => {
        const handleKD = (e) => setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: true }));
        const handleKU = (e) => setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: false }));
        window.addEventListener('keydown', handleKD);
        window.addEventListener('keyup', handleKU);

        let rafId;
        const loop = () => {
            if (gameState === 'room') {
                setPlayerPos(p => {
                    let nx = p.x, ny = p.y;
                    if (keys['w'] || keys['arrowup']) ny -= SPEED;
                    if (keys['s'] || keys['arrowdown']) ny += SPEED;
                    if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                    if (keys['d'] || keys['arrowright']) nx += SPEED;

                    // Obstacle check: DESK (L-Shape)
                    DESK_PARTS.forEach(part => {
                        if (checkCollision(nx, ny, part)) {
                            if (p.x + PLAYER_SIZE <= part.x || p.x >= part.x + part.w) nx = p.x;
                            if (p.y + PLAYER_SIZE <= part.y || p.y >= part.y + part.h) ny = p.y;
                        }
                    });

                    nx = Math.max(0, Math.min(nx, ROOM_WIDTH - PLAYER_SIZE));
                    ny = Math.max(0, Math.min(ny, ROOM_HEIGHT - PLAYER_SIZE));

                    // Check interaction triggers
                    const range = 60;
                    let target = null;

                    const testArea = (area) => checkCollision(nx, ny, {
                        x: area.x - range, y: area.y - range,
                        w: area.w + range * 2, h: area.h + range * 2
                    });

                    if (testArea(LAPTOP_AREA)) target = 'laptop';
                    else if (testArea(STICKY_NOTE_AREA)) target = 'rule_symbols';
                    else if (testArea(PHOTO_AREA)) target = 'rule_pii';
                    else if (testArea(BOOK_AREA)) target = 'rule_length';
                    else if (testArea(POSTER_AREA)) target = 'rule_patterns';

                    setInteractionTarget(target);
                    return { x: nx, y: ny };
                });

                setHackerProgress(prev => Math.min(100, prev + 0.01));
            }
            rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('keydown', handleKD);
            window.removeEventListener('keyup', handleKU);
            cancelAnimationFrame(rafId);
        };
    }, [gameState, keys]);

    // Action Handler
    useEffect(() => {
        const handleE = (e) => {
            if (e.key.toLowerCase() === 'e' && gameState === 'room' && interactionTarget) {
                if (interactionTarget === 'laptop') {
                    if (!cluesFound.includes('alert_received')) {
                        setGameState('alert');
                        discoverClue('alert_received');
                    } else if (cluesFound.length < Object.keys(CLUE_INFO).length) {
                        showFeedback("I need to find all of my late grandfather's rules before updating my password.");
                    } else {
                        setGameState('terminal');
                    }
                } else {
                    discoverClue(interactionTarget);
                }
            }
        };
        window.addEventListener('keydown', handleE);
        return () => window.removeEventListener('keydown', handleE);
    }, [interactionTarget, cluesFound, gameState]);

    const rulesFoundCount = cluesFound.filter(c => c.startsWith('rule_')).length;

    // Assets Rendering (Ported from Level 1)
    const renderPlant = (x, y) => (
        <div className="absolute z-20" style={{ left: x, top: y }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60px] h-[60px] bg-[#c05a3c] rounded-full border-[8px] border-[#9c452e] shadow-xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140px] h-[140px] pointer-events-none">
                {[0, 45, 90, 135].map(deg => (
                    <div key={deg} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140px] h-[30px] bg-[#3e8549] rounded-full flex items-center`} style={{ transform: `translate(-50%, -50%) rotate(${deg}deg)`, boxShadow: '0 5px 15px rgba(0,0,0,0.4)', zIndex: deg }}>
                        <div className="w-full h-[2px] bg-[#2d6335]"></div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderBookshelf = (x, y) => (
        <div className="absolute z-10 bg-[#e08e50] border-[12px] border-[#b86b35] shadow-2xl flex flex-col justify-evenly p-2" style={{ left: x, top: y, width: 150, height: 450 }}>
            <div className="w-full h-[10px] bg-[#9c5525] shadow-sm"></div>
            <div className={`flex items-end h-[60px] px-2 gap-1 ${interactionTarget === 'rule_length' ? 'scale-110' : ''}`}>
                <div className={`w-5 h-12 ${interactionTarget === 'rule_length' ? 'bg-cyan-400 ring-4 ring-cyan-500/50' : 'bg-red-600'}`}></div>
                <div className="w-4 h-14 bg-yellow-500 shadow-sm border-l border-white/20"></div>
                <div className="w-4 h-10 bg-blue-600 shadow-sm border-l border-white/20"></div>
            </div>
            <div className="w-full h-[10px] bg-[#9c5525] shadow-sm"></div>
            <div className="flex items-end h-[60px] px-2 gap-1 justify-end">
                <div className="w-6 h-12 bg-emerald-600"></div><div className="w-4 h-9 bg-purple-600"></div>
            </div>
            <div className="w-full h-[10px] bg-[#9c5525] shadow-sm"></div>
            <div className="flex items-end h-[60px] px-2 gap-1">
                <div className="w-5 h-14 bg-cyan-600"></div><div className="w-4 h-12 bg-red-500"></div>
            </div>
            <div className="w-full h-[10px] bg-[#9c5525] shadow-sm"></div>
        </div>
    );

    const renderWindow = (x, y) => (
        <div className="absolute z-5 bg-[#1e293b] border-x-[16px] border-t-[16px] border-[#8da5b2] shadow-xl overflow-hidden" style={{ left: x, top: y, width: 450, height: 180 }}>
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] to-[#1e3a8a]"></div>
            <div className="absolute bottom-0 left-0 right-0 h-[80px] flex items-end gap-[1px]">
                {[40, 60, 30, 80, 50, 45, 70, 35, 90, 40, 65, 55].map((h, i) => (
                    <div key={i} className="flex-1 bg-[#090e1a]" style={{ height: h }}></div>
                ))}
            </div>
            <div className="absolute top-0 bottom-0 left-1/2 w-[16px] bg-[#8da5b2] -translate-x-1/2 shadow-xl"></div>
        </div>
    );

    const cameraX = Math.max(0, Math.min(playerPos.x - VIEWPORT_WIDTH / 2, ROOM_WIDTH - VIEWPORT_WIDTH));
    const cameraY = Math.max(0, Math.min(playerPos.y - VIEWPORT_HEIGHT / 2, ROOM_HEIGHT - VIEWPORT_HEIGHT));

    return (
        <div className="w-full h-full flex items-center justify-center bg-zinc-950 px-8">
            {gameState === 'alert' && <GmailAlert onProceed={() => setGameState('room')} />}
            {gameState === 'terminal' && <SecurityTerminal onComplete={() => setGameState('outcome')} onFail={showFeedback} rulesFound={rulesFoundCount} />}

            {gameState === 'outcome' && (
                <div className="fixed inset-0 z-[4000] bg-zinc-950 flex flex-col items-center justify-center p-12 text-white">
                    <h1 className="text-6xl font-black text-emerald-400 mb-8 uppercase tracking-widest">Account Secured</h1>
                    <p className="text-xl max-w-2xl text-center mb-12">By applying your grandfather's legacy rules, you've made your digital identity impenetrable.</p>
                    <button onClick={() => completeLevel(true, 100, 0)} className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full transition-all shadow-xl uppercase tracking-widest">Next Case</button>
                </div>
            )}

            <div className={`relative border-8 border-slate-900 shadow-2xl overflow-hidden bg-zinc-900 transition-all duration-1000 ${hackerProgress > 70 ? 'shadow-[0_0_100px_rgba(220,38,38,0.3)]' : ''}`} style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}>

                <div className="absolute inset-0 transition-transform duration-100 ease-out" style={{ width: ROOM_WIDTH, height: ROOM_HEIGHT, transform: `translate(${-cameraX}px, ${-cameraY}px)` }}>

                    <div className="absolute inset-0 bg-[#2c3e50] overflow-hidden">
                        {/* Wood Floor */}
                        <div className="absolute inset-0 opacity-80" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(0,0,0,0.2) 38px, rgba(0,0,0,0.2) 40px)' }}></div>

                        {/* Top Wall */}
                        <div className="absolute top-0 left-0 right-0 h-[180px] bg-[#233547] z-0 border-b-[12px] border-slate-800 shadow-xl"></div>

                        {/* Windows */}
                        {renderWindow(320, 0)}
                        {renderWindow(930, 0)}

                        {/* Photo (Between Windows) */}
                        <div className={`absolute z-10 transition-all cursor-pointer ${interactionTarget === 'rule_pii' ? 'scale-110 ring-4 ring-cyan-400' : ''}`} style={{ left: PHOTO_AREA.x, top: PHOTO_AREA.y, width: PHOTO_AREA.w, height: PHOTO_AREA.h }}>
                            <div className="w-full h-full bg-[#3d2a25] border-[12px] border-[#b86b35] shadow-xl p-4 flex flex-col items-center justify-center">
                                <div className="w-full h-full bg-black/40 border border-white/10 flex items-center justify-center grayscale text-4xl">🖼️</div>
                                <div className="text-[10px] text-white/40 mt-2 font-bold uppercase tracking-widest">FAMILY</div>
                            </div>
                        </div>

                        {/* Poster (Right Wall) */}
                        <div className={`absolute z-10 transition-all cursor-pointer ${interactionTarget === 'rule_patterns' ? 'scale-110 ring-4 ring-cyan-400' : ''}`} style={{ left: POSTER_AREA.x, top: POSTER_AREA.y, width: POSTER_AREA.w, height: POSTER_AREA.h }}>
                            <div className="w-full h-full bg-[#0d101d] border-8 border-[#1e2a47] shadow-xl p-4 flex items-center justify-center text-cyan-400/40 text-xs font-bold text-center italic">
                                VOYAGE MAP:<br />NO STRAIGHT PATHS
                            </div>
                        </div>

                        {/* Bookshelves */}
                        {renderBookshelf(60, 350)}
                        {renderBookshelf(1400, 350)}

                        {/* Potted Plants */}
                        {renderPlant(180, 850)}
                        {renderPlant(1420, 850)}

                        {/* The Desk */}
                        <div className="absolute z-10" style={{ left: 600, top: 400, width: 400, height: 350 }}>
                            <div className="absolute right-0 top-0 w-full h-[140px] bg-[#e08e50] shadow-2xl rounded-sm" style={{ borderBottom: '16px solid #b86b35', borderRight: '12px solid #b86b35', borderLeft: '12px solid #b86b35' }}></div>
                            <div className="absolute left-0 top-[140px] w-[140px] h-[210px] bg-[#e08e50] shadow-2xl rounded-b-sm" style={{ borderBottom: '16px solid #b86b35', borderLeft: '12px solid #b86b35', borderRight: '12px solid #b86b35' }}></div>

                            {/* Laptop (Upgraded Visuals) */}
                            <div className={`absolute transition-all cursor-pointer ${interactionTarget === 'laptop' ? 'scale-110' : ''}`} style={{ left: 160, top: 20, width: 140, height: 100 }}>
                                {/* Screen Part */}
                                <div className={`w-full h-[85px] bg-slate-900 border-[6px] ${interactionTarget === 'laptop' ? 'border-cyan-400 ring-8 ring-cyan-500/30 shadow-[0_0_30px_#22d3ee]' : 'border-zinc-800'} rounded-t-xl shadow-2xl flex flex-col items-center justify-center p-3 relative overflow-hidden transition-all duration-300`}>
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                                    <div className={`w-full h-1.5 mb-2 rounded-full ${cluesFound.includes('alert_received') ? 'bg-cyan-500 animate-pulse shadow-[0_0_10px_#22d3ee]' : 'bg-red-500 animate-bounce shadow-[0_0_10px_#ef4444]'}`}></div>
                                    <span className={`text-[9px] font-black uppercase tracking-tighter ${cluesFound.includes('alert_received') ? 'text-cyan-400' : 'text-red-500'}`}>
                                        {cluesFound.includes('alert_received') ? "TERMINAL ACTIVE" : "SECURITY ALERT"}
                                    </span>
                                    {/* Scanline effect */}
                                    <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 4px)', backgroundSize: '100% 4px' }}></div>
                                </div>
                                {/* Base Part */}
                                <div className="w-[160px] h-[15px] bg-zinc-800 rounded-lg absolute -bottom-4 left-1/2 -translate-x-1/2 border-t-2 border-zinc-700 shadow-xl flex justify-center">
                                    <div className="w-12 h-1 bg-zinc-900 mt-1 rounded-full opacity-50"></div>
                                </div>
                            </div>

                            {/* Sticky Note */}
                            <div className={`absolute transition-all cursor-pointer ${interactionTarget === 'rule_symbols' ? 'scale-150 rotate-0 ring-4 ring-yellow-400 shadow-2xl' : '-rotate-12'}`} style={{ left: 60, top: 180, width: 60, height: 60 }}>
                                <div className="w-full h-full bg-yellow-300 p-2 shadow-xl flex flex-col justify-end border-b-4 border-yellow-500 rounded-sm">
                                    <div className="w-full h-[1px] bg-black/10 mb-1"></div>
                                    <div className="w-2/3 h-[1px] bg-black/10 mb-2"></div>
                                    <div className="text-[7px] font-black text-black/60 uppercase text-center tracking-widest truncate">RULE #1</div>
                                </div>
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-red-600 shadow-lg border border-red-800"></div>
                            </div>
                        </div>

                        {/* Chair */}
                        <div className="absolute w-[100px] h-[100px] z-10 flex flex-col items-center drop-shadow-2xl" style={{ left: 750, top: 600 }}>
                            <div className="w-[70px] h-[45px] bg-[#3a4f6d] rounded-t-2xl border-x-[6px] border-t-[6px] border-[#2c3e50] absolute -top-4"></div>
                            <div className="w-[85px] h-[55px] bg-[#4a6285] rounded-b-[40px] border-b-[8px] border-[#2c3e50] relative shadow-xl"></div>
                        </div>

                        <Player x={playerPos.x} y={playerPos.y} />
                    </div>
                </div>

                {/* HUD Overlay */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-[400]">
                    <div className="bg-black/80 p-4 rounded-xl border border-white/10 backdrop-blur-md min-w-[250px]">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-1">Status</span>
                        <h2 className="text-white text-sm font-bold">
                            {!cluesFound.includes('alert_received') ? "Investigate the laptop alert." :
                                rulesFoundCount < 4 ? `Find the Rules (${rulesFoundCount}/4)` :
                                    "Secure account at the laptop."}
                        </h2>
                    </div>

                    <div className="bg-black/80 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Hacking Progress</span>
                            <span className="text-red-500 text-[10px] font-bold">{Math.floor(hackerProgress)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-500 ${hackerProgress > 70 ? 'bg-red-500' : 'bg-cyan-500'}`} style={{ width: `${hackerProgress}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Interaction Prompt Overlay */}
                {interactionTarget && (
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-[500] animate-bounce">
                        <div className="bg-white text-black font-black px-8 py-4 rounded-full shadow-2xl flex items-center gap-4">
                            <span className="bg-black text-white px-2 py-1 rounded text-sm">E</span>
                            <span className="uppercase tracking-widest text-xs">
                                {interactionTarget === 'laptop' ? (cluesFound.includes('alert_received') ? "Open Terminal" : "Check Alert") : "Recall Rule"}
                            </span>
                        </div>
                    </div>
                )}

                {/* Journal Trigger */}
                <div className="absolute bottom-6 right-6 z-[500]">
                    <button
                        onClick={() => setIsDetectiveModeOpen(!isDetectiveModeOpen)}
                        className="w-16 h-16 bg-zinc-900 border-2 border-white/10 rounded-2xl flex items-center justify-center text-4xl shadow-2xl hover:bg-emerald-600 transition-all hover:scale-110"
                    >
                        📓
                    </button>
                    {cluesFound.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-4 border-zinc-900 animate-in zoom-in">
                            {cluesFound.length}
                        </span>
                    )}
                </div>

                {/* Journal Overlay */}
                {isDetectiveModeOpen && (
                    <div className="absolute inset-y-12 right-12 w-[400px] z-[1000] bg-zinc-950/95 border-2 border-white/10 shadow-2xl rounded-3xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-500 backdrop-blur-xl">
                        <div className="p-8 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-white font-bold uppercase tracking-widest">Grandfather's Archive</h3>
                            <button onClick={() => setIsDetectiveModeOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
                        </div>
                        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                            {Object.keys(CLUE_INFO).map(cid => {
                                const found = cluesFound.includes(cid);
                                return (
                                    <div key={cid} className={`p-6 rounded-2xl border transition-all ${found ? 'bg-white/5 border-white/10' : 'bg-transparent border-white/5 opacity-50 filter grayscale'}`}>
                                        <div className="flex gap-4 items-start">
                                            <div className="text-3xl">{found ? CLUE_INFO[cid].icon : '🔒'}</div>
                                            <div>
                                                <div className="text-[10px] font-bold text-cyan-400 uppercase mb-2">{found ? CLUE_INFO[cid].title : 'UNKNOWN'}</div>
                                                <p className="text-xs text-zinc-400 italic">
                                                    {found ? <span>"{CLUE_INFO[cid].desc}"</span> : <span>Search near: {CLUE_INFO[cid].hint}</span>}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Feedback */}
                {feedbackMsg && (
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[4000] animate-in slide-in-from-top duration-500">
                        <div className="bg-red-600 text-white px-8 py-4 rounded-xl shadow-2xl font-bold text-xs uppercase tracking-widest border border-red-400">
                            {feedbackMsg}
                        </div>
                    </div>
                )}

                {/* Progress Overlay */}
                <div className="absolute inset-0 pointer-events-none transition-opacity duration-1000 z-[2000]"
                    style={{
                        opacity: hackerProgress > 60 ? (hackerProgress - 60) / 40 : 0,
                        background: 'radial-gradient(circle at center, transparent 40%, rgba(220,38,38,0.3) 100%)'
                    }}>
                </div>
            </div>
        </div>
    );
};

export default Level3;
