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
const TABLE_LEFT_AREA = { x: 610, y: 560, w: 90, h: 120 }; // Left side of table (return)
const TABLE_PHOTO_AREA = { x: 935, y: 465, w: 60, h: 60 }; // Behind Grandpa frame on table (moved right)
const BOOK_AREA = { x: 40, y: 60, w: 160, h: 380 }; // Left Bookshelf (Higher up)
const BOOK_RIGHT_AREA = { x: 1400, y: 60, w: 160, h: 380 }; // Right Bookshelf (Higher up)
const PLANT_AREA = { x: 50, y: 850, w: 200, h: 200 }; // Left Flower Pot (At the bottom)
const PLANT_RIGHT_AREA = { x: 1350, y: 850, w: 200, h: 200 }; // Right Flower Pot (At the bottom)

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
        hint: "Check the left side of your desk."
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
        hint: "Inspect the photo frame on your table."
    },
    'rule_patterns': {
        title: "Rule #4: No Straight Paths",
        desc: "'A straight path is easily followed.' Avoid keyboard patterns like 'qwerty' or '123456'.",
        icon: "🗺️",
        hint: "Check the flower pot near the corner."
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

const SecurityTerminal = ({ onComplete, onFail, rulesFound, playSynthSound }) => {
    const [password, setPassword] = useState('');
    const inputRef = useRef(null);
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

    useEffect(() => {
        const timer = setTimeout(() => {
            if (inputRef.current) inputRef.current.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

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
        <div className="fixed inset-0 z-[3000] bg-zinc-950/90 backdrop-blur-2xl flex items-center justify-center p-4 text-white">
            <div className="w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-2xl shadow-[0_0_80px_rgba(0,0,0,0.8)] relative overflow-hidden animate-in scale-in-95 duration-500">
                
                {/* Header Bar */}
                <div className="px-8 py-5 bg-gradient-to-r from-zinc-800/80 to-zinc-900 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-black uppercase tracking-wider text-white">Secure Your Account</h2>
                            <p className="text-cyan-500 font-mono text-[9px] uppercase tracking-[0.3em] font-black">Authentication Shield v2.0</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${entropy > 85 ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : entropy > 40 ? 'bg-amber-400' : 'bg-red-400'} animate-pulse`}></div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{entropy > 85 ? 'Strong' : entropy > 40 ? 'Moderate' : 'Weak'}</span>
                    </div>
                </div>

                {/* Main Content */}
                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Input + Rules */}
                        <div className="space-y-6">
                            {/* Password Input */}
                            <div>
                                <label className="block text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-3">Set New Passphrase</label>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        playSynthSound('keyboard_click');
                                    }}
                                    className="w-full bg-black border-2 border-white/10 rounded-xl px-6 py-4 text-xl font-black text-white focus:border-cyan-500 outline-none transition-all placeholder:text-zinc-800"
                                    placeholder="Enter passphrase..."
                                />
                            </div>

                            {/* Rules Compact List */}
                            <div className="bg-white/[0.02] border border-white/5 p-5 rounded-xl">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.3em]">Grandfather's Rules</span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400">{rulesFound}/4 Found</span>
                                </div>
                                <div className="space-y-3">
                                    {['rule_symbols', 'rule_length', 'rule_pii', 'rule_patterns'].map((r, i) => (
                                        <div key={r} className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${rulesFound > i ? 'bg-emerald-500/[0.04] border-emerald-500/15' : 'bg-black/20 border-white/[0.03] opacity-50'}`}>
                                            <div className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[8px] font-black ${rulesFound > i ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-600'}`}>
                                                {rulesFound > i ? '✓' : i + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className={`text-[10px] font-black tracking-wider uppercase block truncate ${rulesFound > i ? 'text-white' : 'text-zinc-600'}`}>
                                                    {rulesFound > i ? CLUE_INFO[r].title : 'Rule Undiscovered'}
                                                </span>
                                                {rulesFound > i && (
                                                    <p className="text-[9px] text-zinc-500 truncate italic">{CLUE_INFO[r].desc.substring(0, 60)}...</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Metrics + Button */}
                        <div className="flex flex-col gap-6">
                            {/* Breach Resilience Display */}
                            <div className="flex-1 bg-zinc-950 border border-white/5 rounded-2xl p-8 relative overflow-hidden group text-center flex flex-col items-center justify-center">
                                <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
                                <span className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.5em] block mb-4">Breach Resilience</span>
                                <div className={`text-4xl font-black transition-all duration-700 ${entropy > 85 ? 'text-emerald-400' : entropy > 40 ? 'text-amber-400' : 'text-white'}`}>
                                    {crackTime}
                                </div>
                                <div className="mt-8 w-full">
                                    <div className="flex justify-between text-[9px] font-black uppercase text-zinc-500 mb-2 tracking-widest">
                                        <span>Entropy Level</span>
                                        <span className={`${entropy > 85 ? 'text-emerald-400' : entropy > 40 ? 'text-amber-400' : 'text-red-400'}`}>{entropy}%</span>
                                    </div>
                                    <div className="h-2.5 bg-zinc-900 rounded-full overflow-hidden">
                                        <div className={`h-full transition-all duration-700 rounded-full ${entropy > 85 ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : entropy > 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${entropy}%` }} />
                                    </div>
                                </div>
                                
                                {/* Strength Indicator Dots */}
                                <div className="mt-5 flex gap-2 justify-center">
                                    {[20, 40, 60, 80, 100].map((threshold) => (
                                        <div key={threshold} className={`w-2 h-2 rounded-full transition-all duration-500 ${entropy >= threshold ? (entropy > 85 ? 'bg-emerald-400' : entropy > 40 ? 'bg-amber-400' : 'bg-red-400') : 'bg-zinc-800'}`}></div>
                                    ))}
                                </div>
                            </div>

                            {/* Update Credentials Button */}
                            <button
                                onClick={handleConfirm}
                                className="w-full py-5 rounded-xl font-black uppercase tracking-[0.3em] text-[11px] transition-all active:scale-[0.98] shadow-xl group relative overflow-hidden"
                                style={{ background: 'linear-gradient(135deg, #06b6d4, #0e7490)' }}
                            >
                                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all"></div>
                                <span className="relative z-10 text-white drop-shadow-sm flex items-center justify-center gap-3">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                    Update Credentials
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BookshelfSearch = ({ onComplete, hasClue, discoveredClues, discoverClue }) => {
    // 4 Shelves - Compact verticality to fit 680px height safely
    const shelfRows = [
        { id: 'row1', y: 40 },
        { id: 'row2', y: 175 },
        { id: 'row3', y: 310 },
        { id: 'row4', y: 445 }
    ];

    const luxuryWood = {
        main: '#f5e6d3', // White Oak/Birch
        grain: 'rgba(139, 94, 60, 0.05)',
        edge: '#e8d5c4',
        inner: '#1a1815'
    };

    // Interactive books - now focal objects with 3D depth
    const interactiveBooks = React.useMemo(() => [
        { id: 'i1', row: 'row1', x: 220, title: 'Lost Archive', color: '#1e3a8a', foil: 'gold', isClue: false, h: 125, tilt: -1 },
        { id: 'i2', row: 'row3', x: 480, title: 'Grandpas Notes', color: '#7f1d1d', foil: 'silver', isClue: true, h: 130, tilt: 2 },
        { id: 'i3', row: 'row2', x: 650, title: 'Digital Age', color: '#064e3b', foil: 'gold', isClue: false, h: 122, tilt: 0 },
        { id: 'i4', row: 'row4', x: 340, title: 'Old Recipes', color: '#7c2d12', foil: 'bronze', isClue: false, h: 128, tilt: -2 },
    ], []);

    // High-Fidelity Filler Generation: Cluster-based with varied tilts
    const stabilizedFillers = React.useMemo(() => {
        const fillersByRow = {};
        const bookPool = ['#334155', '#475569', '#1e293b', '#3f3f46', '#27272a', '#18181b'];

        shelfRows.forEach(row => {
            const rowFillers = [];
            const clusters = 1 + Math.floor(Math.random() * 2);
            for (let c = 0; c < clusters; c++) {
                let startX = 120 + Math.random() * 550;
                const size = 1 + Math.floor(Math.random() * 3);
                for (let i = 0; i < size; i++) {
                    const x = startX + (i * 26);
                    const ibook = interactiveBooks.find(ib => ib.row === row.id && Math.abs(ib.x - x) < 60);
                    if (!ibook) {
                        rowFillers.push({
                            id: `f-${row.id}-${c}-${i}`,
                            x,
                            w: 24 + Math.random() * 8,
                            h: 95 + Math.random() * 30,
                            tilt: Math.random() > 0.8 ? (Math.random() * 6 - 3) : 0,
                            color: bookPool[Math.floor(Math.random() * bookPool.length)]
                        });
                    }
                }
            }
            fillersByRow[row.id] = rowFillers;
        });
        return fillersByRow;
    }, [interactiveBooks]);

    const [selectedBook, setSelectedBook] = useState(null);
    const [isOpening, setIsOpening] = useState(false);
    const [found, setFound] = useState(false);

    const handleBookClick = (book) => {
        if (selectedBook) {
            setSelectedBook(null);
            setIsOpening(false);
        } else {
            setSelectedBook(book);
            setTimeout(() => setIsOpening(true), 100);
        }
    };

    const handleClueClick = (e) => {
        if (e) e.stopPropagation();
        setFound(true);
        setTimeout(() => discoverClue('rule_length'), 800);
    };

    const getFoilStyle = (type) => {
        if (type === 'gold') return 'linear-gradient(135deg, #fbbf24 0%, #d97706 50%, #fbbf24 100%)';
        if (type === 'silver') return 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 50%, #e2e8f0 100%)';
        return 'linear-gradient(135deg, #f97316 0%, #9a3412 50%, #f97316 100%)';
    };

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 overflow-hidden">
            {/* Main Interaction Container - Strictly capped at 680px */}
            <div className="relative w-full max-w-5xl h-[680px] bg-[#0c0c0b] rounded-[3rem] border border-white/5 shadow-[0_0_120px_rgba(0,0,0,0.8)] flex flex-col items-center overflow-hidden">

                {/* Minimal Header */}
                <div className="mt-8 mb-6 flex flex-col items-center select-none opacity-60">
                    <span className="text-[10px] font-black uppercase tracking-[1em] text-zinc-500 mb-2 pl-[1em]">Restricted</span>
                    <h2 className="text-2xl font-extralight text-zinc-300 tracking-[0.5em] uppercase">Archive</h2>
                </div>

                {/* Close Button */}
                <button
                    onClick={selectedBook ? () => { setSelectedBook(null); setIsOpening(false); } : onComplete}
                    className="absolute top-8 right-12 w-10 h-10 rounded-full bg-red-950/20 hover:bg-red-500/20 flex items-center justify-center text-red-500/70 hover:text-red-400 transition-all z-[1000] border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                >✕</button>

                {/* Designer Bookshelf Frame */}
                <div
                    className="relative w-[840px] h-[520px] bg-[#141211] rounded-sm shadow-2xl overflow-hidden"
                    style={{ border: `1px solid rgba(255,255,255,0.05)` }}
                >
                    {/* Main Wood Structure */}
                    <div className="absolute inset-0 border-[8px] pointer-events-none z-50" style={{ borderColor: luxuryWood.main }}>
                        <div className="absolute inset-0 opacity-10 mix-blend-multiply" style={{ background: 'repeating-linear-gradient(90deg, transparent, transparent 35px, rgba(0,0,0,0.1) 35px, rgba(0,0,0,0.1) 36px)' }}></div>
                    </div>

                    {/* Shelf Rows */}
                    {shelfRows.map(row => (
                        <div key={row.id} className="absolute inset-x-[8px] h-[120px]" style={{ top: row.y }}>
                            {/* Realistic Shelf Board */}
                            <div className="absolute bottom-0 inset-x-0 h-[4px] shadow-lg" style={{ backgroundColor: luxuryWood.main }}>
                                <div className="absolute inset-0 bg-black/10"></div>
                            </div>

                            {/* Inner Depth Shadows */}
                            <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-black/50 to-transparent"></div>

                            <div className="absolute bottom-[4px] inset-x-0 flex items-end px-10 h-full">
                                {/* Ambient Occlusion Floor */}
                                <div className="absolute bottom-0 inset-x-10 h-[3px] bg-black/80 blur-sm"></div>

                                {/* Filler Books (Tangible Style) */}
                                {(stabilizedFillers[row.id] || []).map(f => (
                                    <div
                                        key={f.id}
                                        className="absolute bottom-0 opacity-50 grayscale-[0.3]"
                                        style={{
                                            left: f.x,
                                            width: f.w,
                                            height: f.h,
                                            backgroundColor: f.color,
                                            transform: `rotate(${f.tilt}deg)`,
                                            boxShadow: 'inset -3px 0 10px rgba(0,0,0,0.4), 1px 0 5px rgba(0,0,0,0.2)',
                                            borderRadius: '2px 2px 0 0'
                                        }}
                                    >
                                        <div className="absolute top-3 inset-x-1.5 h-0.5 bg-white/5"></div>
                                    </div>
                                ))}

                                {/* Interactive Book Objects (High-Fidelity) */}
                                {interactiveBooks.filter(ib => ib.row === row.id).map(ib => (
                                    <div
                                        key={ib.id}
                                        onClick={() => handleBookClick(ib)}
                                        className={`absolute bottom-0 z-10 transition-all duration-700 cursor-pointer group origin-bottom
                                            ${selectedBook?.id === ib.id ? 'opacity-0 scale-75 translate-y-20' : 'hover:-translate-y-4 hover:brightness-110'}
                                        `}
                                        style={{
                                            left: ib.x,
                                            width: 46,
                                            height: ib.h,
                                            backgroundColor: ib.color,
                                            transform: `rotate(${ib.tilt}deg)`,
                                            boxShadow: '0 10px 40px rgba(0,0,0,0.7), inset -4px 0 15px rgba(0,0,0,0.5)',
                                            borderRadius: '3px 3px 1px 1px'
                                        }}
                                    >
                                        {/* Spine Depth Overlay (Vertical Banding) */}
                                        <div className="absolute inset-y-0 right-0 w-[4px] bg-black/20"></div>
                                        <div className="absolute top-4 inset-x-4 h-0.5 bg-white/10 rounded-full"></div>

                                        {/* Embossed Label */}
                                        <div className="absolute inset-0 flex items-center justify-center p-4">
                                            <span
                                                className="text-[11px] font-black uppercase tracking-tighter select-none rotate-180 transition-all duration-500 group-hover:tracking-normal"
                                                style={{
                                                    writingMode: 'vertical-rl',
                                                    background: getFoilStyle(ib.foil),
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent',
                                                    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.4))'
                                                }}
                                            >
                                                {ib.title}
                                            </span>
                                        </div>

                                        {/* Bottom Binding Lines */}
                                        <div className="absolute bottom-8 inset-x-4 h-12 border-x border-white/10 opacity-20"></div>

                                        {/* Top Lighting Catch */}
                                        <div className="absolute top-0 inset-x-0 h-1 bg-white/10 blur-[1px]"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Gallery Spotlight Overlay */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/40"></div>
                </div>

                {/* Inspect Overlay */}
                {selectedBook && (
                    <div className="absolute inset-0 z-[500] flex items-center justify-center animate-in fade-in duration-700 backdrop-blur-2xl">
                        <div className="absolute inset-0 bg-black/85" onClick={() => { setSelectedBook(null); setIsOpening(false); }}></div>

                        <div className={`relative transition-all duration-700
                            ${isOpening ? 'scale-100' : 'scale-50 opacity-0'}
                        `}>
                            <div className="relative flex perspective-[1500px]">
                                {/* Cover (Realistic Boards) */}
                                <div
                                    className="w-[240px] h-[340px] rounded-l-2xl transition-transform duration-1000 origin-right z-30 shadow-[20px_40px_80px_rgba(0,0,0,0.8)]"
                                    style={{
                                        backgroundColor: selectedBook.color,
                                        transform: isOpening ? 'rotateY(-155deg)' : 'rotateY(0deg)',
                                        borderLeft: '2px solid rgba(255,255,255,0.05)',
                                        pointerEvents: isOpening ? 'none' : 'auto'
                                    }}
                                >
                                    <div className="absolute inset-4 border border-white/5 rounded-xl opacity-20"></div>
                                </div>

                                {/* Pages (Subtle Texture) */}
                                <div className="absolute inset-y-1 inset-x-3 bg-[#fdfcf5] rounded-sm flex flex-col p-12 overflow-hidden border-l-[12px] border-zinc-200 z-40">
                                    <div className="space-y-4 opacity-20 mt-4">
                                        {[...Array(11)].map((_, i) => (
                                            <div key={i} className={`h-px bg-zinc-400 ${i % 3 === 0 ? 'w-full' : 'w-[85%]'}`}></div>
                                        ))}
                                    </div>

                                    {hasClue && selectedBook.isClue && !discoveredClues.includes('rule_length') && (
                                        <div
                                            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-700
                                                ${found ? 'scale-[4] opacity-0' : 'hover:scale-110 active:scale-90'}
                                            `}
                                            onClick={(e) => handleClueClick(e)}
                                        >
                                            <span className="text-8xl drop-shadow-2xl">📜</span>
                                        </div>
                                    )}
                                </div>

                                {/* Back Cover */}
                                <div className="w-[240px] h-[340px] rounded-r-2xl shadow-xl flex items-center justify-center overflow-hidden" style={{ backgroundColor: selectedBook.color }}>
                                    <div className="text-white/5 text-[10px] font-black uppercase tracking-[1em] rotate-180" style={{ writingMode: 'vertical-rl' }}>{selectedBook.title}</div>
                                    <div className="absolute inset-0 bg-gradient-to-l from-black/20 to-transparent"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Interaction */}
                <div className="mt-auto mb-10 flex flex-col items-center">
                    {!found ? (
                        <div className="flex items-center gap-4 opacity-40">
                            <span className="w-8 h-px bg-zinc-700"></span>
                            <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.8em] pl-[0.8em]">Inspect Records</span>
                            <span className="w-8 h-px bg-zinc-700"></span>
                        </div>
                    ) : (
                        <button
                            onClick={onComplete}
                            className="px-24 py-5 bg-white text-black font-black text-xs uppercase tracking-[0.4em] rounded-full transition-all hover:scale-105 active:scale-95 shadow-2xl"
                        >
                            Return
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const PhotoFrameSearch = ({ onComplete, discoverClue, discoveredClues }) => {
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isLetterOpen, setIsLetterOpen] = useState(false);
    const [clueCollected, setClueCollected] = useState(discoveredClues.includes('rule_pii'));
    const frameRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!isDragging || isLetterOpen) return;
        setRotation(prev => ({
            x: prev.x - e.movementY * 0.5,
            y: prev.y + e.movementX * 0.5
        }));
    };

    const handleLetterClick = (e) => {
        e.stopPropagation();
        if (!isLetterOpen && !clueCollected) {
            setIsLetterOpen(true);
            // Auto-discover clue and update archive when letter is opened
            setTimeout(() => {
                discoverClue('rule_pii');
                setClueCollected(true);
            }, 800);
        }
    };

    const handleCloseLetterOverlay = () => {
        setIsLetterOpen(false);
    };

    return (
        <div 
            className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/95 backdrop-blur-3xl overflow-hidden select-none cursor-grab active:cursor-grabbing"
            onMouseMove={handleMouseMove}
            onMouseDown={() => !isLetterOpen && setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
        >
            {/* Left-side instructions */}
            <div className="absolute left-12 top-1/2 -translate-y-1/2 flex flex-col items-start gap-3 pointer-events-none z-10">
                <span className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-500">Inspection Mode</span>
                <h2 className="text-3xl font-light text-zinc-300 tracking-wider">Family Photo<br/>Frame</h2>
                <div className="h-px w-12 bg-zinc-700 mt-2"></div>
                <p className="text-[10px] text-zinc-500 mt-2 uppercase tracking-[0.2em] leading-relaxed">Click and drag<br/>to rotate the frame</p>
                <div className="mt-6 flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-sm bg-[#3d2b1f] border border-zinc-600"></div>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Front — Photo</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-sm bg-[#f5e6d0] border border-zinc-600"></div>
                        <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Back — Letter</span>
                    </div>
                </div>
            </div>

            <div style={{ perspective: '2000px' }} className="w-full h-full flex items-center justify-center">
                <div 
                    ref={frameRef}
                    className="relative w-[400px] h-[500px] transition-transform duration-100 ease-out"
                    style={{ 
                        transformStyle: 'preserve-3d',
                        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`
                    }}
                >
                    {/* Front Face: The Photo */}
                    <div 
                        className="absolute inset-0 bg-[#3d2b1f] border-[20px] border-[#2c1d18] shadow-2xl rounded-sm"
                        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                    >
                        <div className="w-full h-full bg-zinc-800 relative overflow-hidden flex items-center justify-center">
                             <div className="absolute inset-4 border border-white/10 opacity-20"></div>
                             <img 
                                src="/assets/udk.jpeg" 
                                alt="Grandpa" 
                                className="w-full h-full object-cover opacity-80"
                             />
                             <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-white/5 opacity-30"></div>
                        </div>
                    </div>

                    {/* Back Face: Sealed Letter */}
                    <div 
                        className="absolute inset-0 bg-[#2c1d18] border-[12px] border-[#1a110e] rounded-sm flex flex-col items-center justify-center shadow-2xl overflow-hidden"
                        style={{ transform: 'rotateY(180deg)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                    >
                        {/* Wood Grain Texture */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,0,0,0.2) 20px, rgba(0,0,0,0.2) 21px)' }}></div>
                        
                        {/* Decorative wires/brackets on back */}
                        <div className="absolute inset-x-6 top-[30%] h-px bg-zinc-500/30 shadow-sm pointer-events-none"></div>
                        <div className="absolute inset-x-6 bottom-[30%] h-px bg-zinc-500/30 shadow-sm pointer-events-none"></div>
                        
                        <div className="w-full h-full flex items-center justify-center p-10 relative">
                            {/* Sealed Letter (clickable) */}
                            <div 
                                onClick={handleLetterClick}
                                className={`relative w-[280px] h-[200px] transform -rotate-3 transition-all duration-500
                                    ${clueCollected 
                                        ? 'opacity-50 cursor-default' 
                                        : 'cursor-pointer hover:scale-110 hover:-rotate-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.8)] active:scale-95'}
                                `}
                            >
                                {/* Envelope body */}
                                <div className="absolute inset-0 bg-[#f5e6d0] rounded-sm shadow-[0_8px_30px_rgba(0,0,0,0.5)] border border-[#d4c4a8]">
                                    {/* Paper texture */}
                                    <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/natural-paper.png')" }}></div>
                                    
                                    {/* Envelope flap (triangular top) */}
                                    <div className="absolute -top-[1px] inset-x-0 h-[80px] overflow-hidden">
                                        <div className="w-full h-full bg-[#e8d5bc] border-b border-[#c4a882]" 
                                             style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}>
                                        </div>
                                    </div>

                                    {/* Wax seal */}
                                    <div className="absolute top-[55px] left-1/2 -translate-x-1/2 z-10">
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#8b1a1a] via-[#c0392b] to-[#6b1010] shadow-[0_4px_15px_rgba(139,26,26,0.6),inset_0_2px_4px_rgba(255,255,255,0.2)] flex items-center justify-center border-2 border-[#5a0f0f]">
                                            <span className="text-[#ffd700] text-lg font-serif font-black drop-shadow-sm">G</span>
                                        </div>
                                    </div>

                                    {/* Center text on envelope */}
                                    <div className="absolute bottom-8 inset-x-0 flex flex-col items-center gap-2">
                                        <div className="text-[9px] font-black uppercase tracking-[0.4em] text-[#8b7355]">Confidential</div>
                                        <div className="w-16 h-px bg-[#c4a882]"></div>
                                        <div className="text-[11px] font-serif italic text-[#6b5a47]">Grandpa's Secret</div>
                                    </div>
                                </div>

                                {/* Glow hint when not collected */}
                                {!clueCollected && (
                                    <div className="absolute -inset-4 rounded-lg bg-amber-500/10 blur-xl animate-pulse pointer-events-none"></div>
                                )}
                            </div>

                            {/* Instruction text */}
                            {!clueCollected && (
                                <div className="absolute bottom-6 inset-x-0 flex flex-col items-center gap-2 pointer-events-none">
                                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400/60 animate-bounce">
                                        ✉ Click the letter to read
                                    </div>
                                </div>
                            )}
                            {clueCollected && (
                                <div className="absolute bottom-6 inset-x-0 flex flex-col items-center gap-2 pointer-events-none">
                                    <div className="text-emerald-500/60 text-[10px] font-black uppercase tracking-widest">
                                        ✓ Already Collected
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Side Edges for volume */}
                    <div className="absolute top-0 bottom-0 left-0 w-[20px] bg-[#1a110e] origin-left" style={{ transform: 'rotateY(-90deg)' }}></div>
                    <div className="absolute top-0 bottom-0 right-0 w-[20px] bg-[#1a110e] origin-right" style={{ transform: 'rotateY(90deg)' }}></div>
                    <div className="absolute top-0 left-0 right-0 h-[20px] bg-[#1a110e] origin-top" style={{ transform: 'rotateX(90deg)' }}></div>
                    <div className="absolute bottom-0 left-0 right-0 h-[20px] bg-[#1a110e] origin-bottom" style={{ transform: 'rotateX(-90deg)' }}></div>
                </div>
            </div>

            {/* ═══════ LETTER CLUE REVEAL OVERLAY ═══════ */}
            {isLetterOpen && (
                <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/90 backdrop-blur-2xl"
                     style={{ animation: 'fadeIn 0.5s ease-out forwards' }}
                >
                    {/* Background click to close */}
                    <div className="absolute inset-0" onClick={handleCloseLetterOverlay}></div>

                    {/* Letter Content Card */}
                    <div className="relative w-[520px] max-h-[85vh] flex flex-col"
                         style={{ animation: 'zoomIn 0.6s cubic-bezier(0.16,1,0.3,1) forwards' }}
                    >
                        {/* Opened Letter / Parchment */}
                        <div className="relative bg-[#fffef0] shadow-[0_30px_80px_rgba(0,0,0,0.7)] overflow-hidden">
                            {/* Paper texture overlay */}
                            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/natural-paper.png')" }}></div>
                            
                            {/* Torn top edge effect */}
                            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-b from-[#e8d5bc] to-[#fffef0]"></div>

                            {/* Content */}
                            <div className="p-12 pt-10">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-8">
                                    <div className="flex flex-col gap-1 opacity-40">
                                        <div className="w-14 h-1 bg-zinc-900"></div>
                                        <div className="w-9 h-1 bg-zinc-900"></div>
                                    </div>
                                    <div className="text-[9px] font-black tracking-[0.4em] uppercase text-zinc-400">Secret Records</div>
                                </div>

                                {/* Rule icon and title */}
                                <div className="flex flex-col items-center text-center mb-8">
                                    <div className="w-16 h-16 bg-red-900/5 rounded-full flex items-center justify-center mb-5 text-3xl border border-red-900/10">
                                        🖼️
                                    </div>
                                    <h3 className="text-zinc-900 font-serif font-black text-2xl tracking-tight mb-2"
                                        style={{ animation: 'fadeIn 0.8s ease-out 0.3s both' }}
                                    >
                                        Grandpa's Legacy: Rule #3
                                    </h3>
                                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-700/70 mb-4">Family Secrets</div>
                                    <div className="h-px w-20 bg-zinc-300"></div>
                                </div>

                                {/* The actual clue text */}
                                <div className="bg-zinc-50/80 border border-zinc-200/60 rounded-xl p-8 mb-8"
                                     style={{ animation: 'fadeIn 1s ease-out 0.6s both' }}
                                >
                                    <p className="text-zinc-800 font-serif italic text-lg leading-relaxed text-center">
                                        "Never share our names with the digital winds."
                                    </p>
                                    <div className="h-px w-12 bg-zinc-300 mx-auto my-5"></div>
                                    <p className="text-zinc-600 text-sm leading-relaxed text-center">
                                        Avoid using <strong>PII</strong> (Personal Identifiable Information) like our family <strong>names</strong>, <strong>birthdays</strong>, or <strong>locations</strong> in passwords. Attackers can easily find and guess these.
                                    </p>
                                </div>

                                {/* Collection confirmation */}
                                <div className="flex flex-col items-center gap-4"
                                     style={{ animation: 'fadeIn 1s ease-out 1s both' }}
                                >
                                    <div className="flex items-center gap-3 px-6 py-3 bg-emerald-50 rounded-full border border-emerald-200">
                                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <span className="text-emerald-700 text-[11px] font-black uppercase tracking-widest">Clue Added to Archive</span>
                                    </div>
                                </div>

                                {/* Grandpa's signature */}
                                <div className="mt-8 flex justify-end opacity-30">
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="text-zinc-600 font-serif italic text-sm">— Grandpa</div>
                                        <div className="w-20 h-px bg-zinc-400"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={handleCloseLetterOverlay}
                            className="mt-6 mx-auto px-16 py-4 bg-white text-black font-black uppercase tracking-[0.3em] text-[11px] rounded-full transition-all hover:scale-105 active:scale-95 shadow-2xl"
                        >
                            Close Letter
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={onComplete}
                className="absolute bottom-12 px-12 py-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-black uppercase tracking-[0.4em] text-[10px] rounded-full transition-all z-10"
            >
                {clueCollected ? 'Return to Room' : 'Finish Inspection'}
            </button>
        </div>
    );
};

const DrawerSearch = ({ onComplete, hasClue, discoveredClues, discoverClue }) => {
    const [isOpened, setIsOpened] = useState(false);
    const [selectedLetter, setSelectedLetter] = useState(null);
    const [found, setFound] = useState(false);

    const letters = [
        { id: 'l1', title: 'Utility Bill', content: 'Your electricity bill for March is due. Total: ₹2,450.', isCorrect: false, color: '#fef3c7', rotate: -2 },
        { id: 'l2', title: 'Grandpa\'s Note', content: 'Rule #1: Mix Your Tools. A strong lock is built from different materials. Always use special characters (!@#$) and numbers.', isCorrect: true, color: '#fff', rotate: 1 },
        { id: 'l3', title: 'Advertisement', content: 'Win a free vacation! Click here to claim your prize!', isCorrect: false, color: '#ebf8ff', rotate: 3 },
        { id: 'l4', title: 'Bank Statement', content: 'Account summary for 4521-XXXX. Balance: ₹1,45,000.', isCorrect: false, color: '#f7fafc', rotate: -1 },
    ];

    useEffect(() => {
        const timer = setTimeout(() => setIsOpened(true), 300);
        return () => clearTimeout(timer);
    }, []);

    const handleLetterClick = (letter) => {
        setSelectedLetter(letter);
        if (letter.isCorrect && !found) {
            setFound(true);
            setTimeout(() => discoverClue('rule_symbols'), 1500);
        }
    };

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 overflow-hidden">
            <div className="relative w-full max-w-4xl h-[700px] flex flex-col items-center">
                
                {/* Drawer Frame (Static) */}
                <div className="absolute top-20 w-[600px] h-[400px] bg-[#1a110e] rounded-t-lg border-x-8 border-t-8 border-[#2c1d18] shadow-2xl z-0">
                    <div className="absolute inset-0 bg-black/40 blur-sm"></div>
                </div>

                {/* Animated Drawer Box */}
                <div 
                    className={`relative w-[580px] h-[450px] bg-[#3d2b1f] rounded-lg border-4 border-[#2c1d18] shadow-2xl transition-all duration-1000 ease-out z-10 flex flex-col items-center p-8
                        ${isOpened ? 'translate-y-40' : '-translate-y-10'}
                    `}
                    style={{
                        boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5), 0 20px 50px rgba(0,0,0,0.8)'
                    }}
                >
                    {/* Drawer Handle */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-4 bg-[#b45309] rounded-full shadow-inner border border-white/10"></div>
                    
                    {/* Top Surface of Drawer Contents */}
                    <div className="w-full h-full bg-[#1a110e]/50 rounded p-6 relative overflow-hidden">
                        <div className="text-[10px] text-[#b45309]/30 font-black uppercase tracking-[1em] mb-4 text-center">Internal Storage</div>
                        
                        <div className="grid grid-cols-2 gap-6 mt-4">
                            {letters.map((lib) => (
                                <div
                                    key={lib.id}
                                    onClick={() => handleLetterClick(lib)}
                                    className={`relative h-40 bg-white shadow-xl cursor-pointer transition-all hover:scale-105 hover:-translate-y-2 active:scale-95
                                        ${selectedLetter?.id === lib.id ? 'ring-4 ring-emerald-500' : ''}
                                    `}
                                    style={{
                                        backgroundColor: lib.color,
                                        transform: `rotate(${lib.rotate}deg)`,
                                        boxShadow: '2px 5px 15px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    <div className="absolute inset-2 border border-black/5"></div>
                                    <div className="p-4 flex flex-col justify-between h-full">
                                        <div className="w-8 h-8 bg-black/5 rounded-full flex items-center justify-center text-[10px]">✉️</div>
                                        <div className="text-[10px] font-bold text-zinc-900 uppercase tracking-tighter">{lib.title}</div>
                                    </div>
                                    {lib.isCorrect && found && (
                                        <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                            <span className="text-4xl">✓</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Inspection Overlay for Letter */}
                {selectedLetter && (
                    <div className="absolute inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-300">
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedLetter(null)}></div>
                        <div className="relative w-[500px] bg-white rounded-sm shadow-[0_30px_100px_rgba(0,0,0,0.5)] p-12 flex flex-col animate-in zoom-in duration-500">
                            <div className="absolute top-4 right-4 text-xs font-bold text-zinc-300 pointer-events-none">OFFICIAL RECORD</div>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center text-2xl">📜</div>
                                <div>
                                    <h3 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase">{selectedLetter.title}</h3>
                                    <div className="h-1 w-12 bg-[#b45309]"></div>
                                </div>
                            </div>
                            <p className="text-lg font-serif text-zinc-800 leading-relaxed italic mb-10">
                                "{selectedLetter.content}"
                            </p>
                            <button 
                                onClick={() => setSelectedLetter(null)}
                                className="mt-auto py-4 bg-zinc-900 text-white font-black uppercase tracking-widest text-xs hover:bg-zinc-800 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {/* Back Button */}
                {!found ? (
                    <button
                        onClick={onComplete}
                        className="absolute bottom-10 px-12 py-4 bg-red-900/20 border border-red-500/20 text-red-500 font-black uppercase tracking-[0.3em] text-[10px] rounded-full hover:bg-red-500/10 transition-all z-[60]"
                    >
                        Cancel Search
                    </button>
                ) : (
                    <button
                        onClick={onComplete}
                        className="absolute bottom-10 px-12 py-4 bg-white text-black font-black uppercase tracking-[0.4em] text-[10px] rounded-full hover:scale-105 active:scale-95 shadow-2xl transition-all z-[60] animate-in slide-in-from-bottom duration-1000"
                    >
                        Return to Room
                    </button>
                )}
            </div>
        </div>
    );
};

const PlantSearch = ({ onComplete, hasClue, discoveredClues, discoverClue }) => {
    // Hand-crafted organic data: Elegant blade shapes, clustered origin
    const [leaves, setLeaves] = React.useState([
        // Background layer (clustered)
        { id: 1, rot: -25, r: 0, scale: 0.85, x: 0, h: 220, color: '#064e3b', z: 10, curve: -15 },
        { id: 2, rot: 25, r: 0, scale: 0.80, x: 0, h: 200, color: '#064e3b', z: 10, curve: 15 },
        { id: 3, rot: -5, r: 0, scale: 0.95, x: 0, h: 240, color: '#065f46', z: 15, curve: -5 },
        // Mid-ground layer
        { id: 4, rot: -45, r: 0, scale: 0.90, x: 0, h: 180, color: '#047857', z: 20, curve: -30 },
        { id: 5, rot: 45, r: 0, scale: 0.90, x: 0, h: 180, color: '#047857', z: 20, curve: 30 },
        { id: 6, rot: -15, r: 0, scale: 1.05, x: 0, h: 260, color: '#065f46', z: 20, curve: -10 },
        { id: 7, rot: 15, r: 0, scale: 1.05, x: 0, h: 260, color: '#065f46', z: 20, curve: 10 },
        // Foreground layer
        { id: 8, rot: -8, r: 0, scale: 1.15, x: 0, h: 230, color: '#059669', z: 30, curve: -3 },
        { id: 9, rot: 8, r: 0, scale: 1.15, x: 0, h: 230, color: '#059669', z: 30, curve: 3 },
        { id: 10, rot: -35, r: 0, scale: 1.0, x: 0, h: 210, color: '#10b981', z: 30, curve: -20 },
        { id: 11, rot: 35, r: 0, scale: 1.0, x: 0, h: 210, color: '#10b981', z: 30, curve: 20 },
    ]);
    const [found, setFound] = React.useState(false);

    const toggleLeaf = (id) => {
        setLeaves(prev => prev.map(leaf =>
            leaf.id === id
                ? { ...leaf, r: leaf.r === 0 ? (leaf.rot < 0 ? -45 : 45) : 0 }
                : leaf
        ));
    };

    return (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-[#0a0a08]/98 backdrop-blur-2xl">
            {/* Soft Ambient Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/10 via-transparent to-zinc-900/20"></div>

            <div className="relative w-[750px] h-[750px] bg-[#141412] rounded-[5rem] border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)] flex flex-col items-center justify-center overflow-hidden">
                {/* Visual Header */}
                <div className="absolute top-16 flex flex-col items-center gap-1 z-[100] pointer-events-none">
                    <div className="flex gap-2 mb-2">
                        <div className="w-1 h-1 rounded-full bg-emerald-500/40"></div>
                        <div className="w-1 h-1 rounded-full bg-emerald-500/20"></div>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.5em] text-emerald-500/50">Biological Inspection</span>
                    <h2 className="text-3xl font-light text-zinc-300 tracking-wider">Sansevieria Trifasciata</h2>
                </div>

                {/* Interaction Arena */}
                <div className="relative mt-20 scale-[1.25] flex flex-col items-center">

                    {/* Shadow Grounding */}
                    <div className="absolute top-[85%] left-1/2 -translate-x-1/2 w-48 h-12 bg-black/60 blur-[30px] rounded-full"></div>

                    {/* The Plant Clump */}
                    <div className="relative mb-[-30px]">

                        {/* Hidden Clue */}
                        {hasClue && !discoveredClues.includes('rule_patterns') && (
                            <div
                                className={`absolute left-1/2 bottom-16 -translate-x-1/2 cursor-pointer transition-all duration-[1.2s] ease-out ${found ? 'scale-[2.5] opacity-0 -translate-y-48' : 'z-25 hover:brightness-125'}`}
                                onClick={() => {
                                    setFound(true);
                                    setTimeout(() => discoverClue('rule_patterns'), 800);
                                }}
                            >
                                <div className="relative w-10 h-14 bg-[#fffef5] rounded-sm shadow-2xl flex items-center justify-center border-b-[3px] border-zinc-200">
                                    <span className="text-xl drop-shadow-sm">📜</span>
                                    <div className="absolute inset-0 bg-gradient-to-tr from-black/[0.04] to-transparent"></div>
                                </div>
                            </div>
                        )}

                        {/* Fanned Leaves (Clustered Origin) */}
                        <div className="relative h-[280px] flex items-end justify-center">
                            {leaves.map((leaf) => (
                                <div
                                    key={leaf.id}
                                    className="absolute origin-bottom transition-all duration-[1s] ease-[cubic-bezier(0.2,0.8,0.2,1)] cursor-pointer"
                                    style={{
                                        transform: `rotate(${leaf.rot + (leaf.r || 0)}deg) scale(${leaf.scale * 0.9})`,
                                        zIndex: leaf.z + Math.floor(Math.abs(leaf.rot) / 5)
                                    }}
                                    onClick={() => toggleLeaf(leaf.id)}
                                >
                                    <svg width="70" height={leaf.h} viewBox="0 0 60 200" className="drop-shadow-2xl overflow-visible group">
                                        <defs>
                                            <linearGradient id={`leafG-${leaf.id}`} x1="0%" y1="100%" x2="40%" y2="0%">
                                                <stop offset="0%" stopColor="#022c22" />
                                                <stop offset="50%" stopColor={leaf.color} />
                                                <stop offset="100%" stopColor="#10b981" />
                                            </linearGradient>
                                        </defs>
                                        {/* Organic Sword Shape */}
                                        <path
                                            d={`M30,200 C15,180 -5,140 10,60 C20,10 30,0 30,0 C30,0 40,10 50,60 C65,140 45,180 30,200`}
                                            fill={`url(#leafG-${leaf.id})`}
                                            className="group-hover:brightness-110 transition-all duration-500"
                                        />
                                        {/* Midrib and Veins */}
                                        <path d="M30,200 Q30,100 30,10" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeLinecap="round" />
                                        {[40, 80, 120, 160].map(y => (
                                            <React.Fragment key={y}>
                                                <path d={`M30,${y} Q20,${y - 10} 15,${y - 20}`} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" />
                                                <path d={`M30,${y} Q40,${y - 10} 45,${y - 20}`} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" />
                                            </React.Fragment>
                                        ))}
                                    </svg>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Terracotta Container (Refined Scale) */}
                    <div className="relative z-50 mt-[-5px]">
                        {/* Soil Depths */}
                        <div className="w-40 h-10 bg-[#1a110e] rounded-full mx-auto -mb-5 border-[3px] border-[#2c1d18] shadow-[inset_0_10px_20px_rgba(0,0,0,0.9)] overflow-hidden relative">
                            <div className="absolute inset-x-0 top-0 h-4 bg-black/60 blur-[3px]"></div>
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
                        </div>

                        {/* Pot Rim */}
                        <div className="relative w-48 h-12 bg-gradient-to-r from-[#7a3b2b] via-[#a34a34] to-[#7a3b2b] rounded-[1rem] border-b-[5px] border-[#662e21] shadow-xl flex items-center justify-center">
                            <div className="absolute inset-0 bg-white/5 opacity-10"></div>
                            <div className="w-full h-px bg-white/10 shadow-[0_1px_0_rgba(0,0,0,0.3)]"></div>
                        </div>

                        {/* Pot Body (Graceful & Smaller) */}
                        <div className="w-40 h-36 bg-gradient-to-b from-[#a34a34] to-[#662e21] mx-auto -mt-5 rounded-b-[3.5rem] border-x-[12px] border-b-[15px] border-[#7a3b2b] shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 group-hover:opacity-80 transition-opacity duration-1000"></div>
                            <div className="absolute top-0 inset-x-0 h-6 bg-black/40 blur-[2px]"></div>
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/exclusive-paper.png')]"></div>
                        </div>
                    </div>
                </div>

                {/* Interaction Prompt */}
                <div className="absolute bottom-20 z-[200] flex flex-col items-center gap-6">
                    {!found && (
                        <div className="px-10 py-4 bg-white/[0.03] border border-white/10 rounded-full backdrop-blur-xl flex items-center gap-4 transition-all hover:bg-white/[0.05]">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse"></div>
                            <span className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.3em] leading-none">Move foliage to uncover clue</span>
                        </div>
                    )}

                    {found && (
                        <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-6 duration-[1s]">
                            <div className="px-12 py-4 bg-emerald-500/10 border border-emerald-500/30 rounded-full backdrop-blur-2xl flex items-center gap-4">
                                <span className="text-emerald-400 text-xs font-black uppercase tracking-[0.4em] drop-shadow-lg">Investigation Success • Clue Found</span>
                            </div>
                            <button
                                onClick={onComplete}
                                className="px-16 py-4 bg-zinc-100 hover:bg-white text-black font-black text-[11px] uppercase tracking-[0.25em] rounded-full transition-all shadow-[0_20px_50px_rgba(255,255,255,0.1)] active:scale-95 group"
                            >
                                <span className="group-hover:tracking-[0.35em] transition-all">Collect Document</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Close Button */}
                <button
                    onClick={onComplete}
                    className="absolute top-12 right-12 w-14 h-14 rounded-full bg-red-950/20 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-500/70 hover:text-red-400 transition-all group z-[1000] shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                >
                    <span className="text-xl group-hover:scale-125 transition-transform">✕</span>
                </button>
            </div>
        </div>
    );
};

const Level2 = () => {
    const { assets, completeLevel, adjustAssets, playTitleCardSound } = useGameState();
    // STATE MACHINE: pov_intro -> room_intro -> living_room -> room (active) -> alert -> terminal -> outcome
    const [gameState, setGameState] = useState('pov_intro');
    const [playerPos, setPlayerPos] = useState({ x: 800, y: 700 });
    const [keys, setKeys] = useState({});

    // STORY STATE
    const [isChairExited, setIsChairExited] = useState(false);
    const [livingRoomPlayerPos, setLivingRoomPlayerPos] = useState({ x: 800, y: 160 });
    const [hasTriggeredPhone, setHasTriggeredPhone] = useState(false);
    const [isPhoneOpen, setIsPhoneOpen] = useState(false);
    const [notificationStep, setNotificationStep] = useState(0); // 0: none, 1: dialogue 1, 2: dialogue 2, 3: interact
    const [outroStep, setOutroStep] = useState(0);


    // Existing Game Logic State
    const [interactionTarget, setInteractionTarget] = useState(null);
    const [cluesFound, setCluesFound] = useState([]);
    const [isDetectiveModeOpen, setIsDetectiveModeOpen] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState(null);
    const [hackerProgress, setHackerProgress] = useState(0);

    // CINEMATIC STATES
    const [isTransitioning, setIsTransitioning] = useState(true);

    const [screenShake, setScreenShake] = useState(0);

    const triggerTransition = (newState, newPos = null, newLivingPos = null) => {
        playSynthSound('transition_whoosh');
        setIsTransitioning(true);
        // Step 1: Wait for fade to black (500ms)
        setTimeout(() => {
            // Step 2: Swap state while fully black
            if (newState) setGameState(newState);
            if (newPos) setPlayerPos(newPos);
            if (newLivingPos) setLivingRoomPlayerPos(newLivingPos);

            // Step 3: Hold for stability (200ms)
            setTimeout(() => {
                setIsTransitioning(false);
            }, 200);
        }, 500);
    };

    // Initial Level Fade-In
    useEffect(() => {
        // Allow components to mount before starting fade out
        const timer = setTimeout(() => setIsTransitioning(false), 500);
        return () => clearTimeout(timer);
    }, []);




    useEffect(() => {
        if (gameState === 'living_room' && !hasTriggeredPhone) {
            const timer = setTimeout(() => {
                setHasTriggeredPhone(true);
                setNotificationStep(1); // Start Cutscene
                playSynthSound('noti_buzz');
                playSynthSound('noti_vibration');
            }, 2500); // 2.5 seconds after entrance

            return () => clearTimeout(timer);
        }
    }, [gameState, hasTriggeredPhone]);

    useEffect(() => {
        if (gameState === 'title_card') {
            playTitleCardSound();
            const timer = setTimeout(() => {
                triggerTransition('room', { x: 800, y: 920 });
            }, 3500);
            return () => clearTimeout(timer);
        }
    }, [gameState]);

    useEffect(() => {
        if (screenShake > 0) {

            const timer = setTimeout(() => setScreenShake(0), 1000);
            return () => clearTimeout(timer);
        }
    }, [screenShake]);

    // PROCEDURAL AUDIO SYNTHESIZER (Reused from Level 1)
    const audioCtxRef = useRef(null);
    const ambienceNodesRef = useRef(null);

    const getAudioContext = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtxRef.current;
    };

    // Ambience Management
    useEffect(() => {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') {
            const resumeHandler = () => {
                ctx.resume();
                window.removeEventListener('click', resumeHandler);
            };
            window.addEventListener('click', resumeHandler);
        }

        // Cleanup function for transition
        const stopAmbience = (ref) => {
            if (ref.current) {
                const { nodes, gain } = ref.current;
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
                setTimeout(() => {
                    nodes.forEach(n => { try { n.stop(); } catch (e) { } });
                }, 1000);
                ref.current = null;
            }
        };

        stopAmbience(ambienceNodesRef);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.012, ctx.currentTime + 2); // Subtle volume
        gain.connect(ctx.destination);

        let nodes = [];

        if (gameState === 'living_room' || gameState === 'return_to_room') {
            // Living room "Quiet House" wind/white noise
            const bufferSize = 2 * ctx.sampleRate;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }
            const noiseSource = ctx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            noiseSource.loop = true;

            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, ctx.currentTime);

            noiseSource.connect(filter);
            filter.connect(gain);
            noiseSource.start();
            nodes.push(noiseSource);
        } else if (gameState === 'room' || gameState === 'title_card' || gameState === 'terminal') {
            // Study "Server Room" Low G sines (Level 1 style)
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(55, ctx.currentTime);
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(110, ctx.currentTime);

            osc1.connect(gain);
            osc2.connect(gain);
            osc1.start();
            osc2.start();
            nodes.push(osc1, osc2);
        }

        if (nodes.length > 0) {
            ambienceNodesRef.current = { nodes, gain };
        }

        return () => stopAmbience(ambienceNodesRef);
    }, [gameState]);

    const playSynthSound = (type) => {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        switch (type) {
            case 'wood_tap': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(100, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
                break;
            }
            case 'noti_buzz': {
                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                const gain = ctx.createGain();
                osc1.frequency.setValueAtTime(880, ctx.currentTime);
                osc2.frequency.setValueAtTime(1320, ctx.currentTime);
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(ctx.destination);
                osc1.start();
                osc2.start();
                osc1.stop(ctx.currentTime + 0.5);
                osc2.stop(ctx.currentTime + 0.5);
                break;
            }
            case 'noti_vibration': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const mod = ctx.createOscillator();
                const modGain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(80, ctx.currentTime);
                mod.type = 'square';
                mod.frequency.setValueAtTime(10, ctx.currentTime);
                modGain.gain.setValueAtTime(0.5, ctx.currentTime);
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
                gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.25);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
                mod.connect(modGain);
                modGain.connect(osc.frequency);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                mod.start();
                osc.stop(ctx.currentTime + 0.45);
                mod.stop(ctx.currentTime + 0.45);
                break;
            }
            case 'cinematic_surge': {
                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                const gain = ctx.createGain();
                const filter = ctx.createBiquadFilter();

                osc1.type = 'sawtooth';
                osc1.frequency.setValueAtTime(40, ctx.currentTime);
                osc1.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 2.5);

                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(200, ctx.currentTime);
                osc2.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 3);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(100, ctx.currentTime);
                filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 2.5);

                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.5);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 3);

                osc1.connect(filter);
                osc2.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);

                osc1.start();
                osc2.start();
                osc1.stop(ctx.currentTime + 3);
                osc2.stop(ctx.currentTime + 3);
                break;
            }
            case 'keyboard_click': {
                const bufferSize = ctx.sampleRate * 0.02;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

                const noise = ctx.createBufferSource();
                noise.buffer = buffer;

                const filter = ctx.createBiquadFilter();
                filter.type = 'highpass';
                filter.frequency.setValueAtTime(1200, ctx.currentTime);

                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0.04, ctx.currentTime); // Subtle
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);
                noise.start();
                break;
            }
            case 'transition_whoosh': {
                const bufferSize = ctx.sampleRate * 0.6;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

                const noise = ctx.createBufferSource();
                noise.buffer = buffer;

                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(200, ctx.currentTime);
                filter.frequency.exponentialRampToValueAtTime(2500, ctx.currentTime + 0.3);
                filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.6);
                filter.Q.setValueAtTime(4, ctx.currentTime);

                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.3);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);
                noise.start();
                break;
            }
        }
    };

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
                    else if (testArea(TABLE_LEFT_AREA)) target = 'rule_symbols';
                    else if (testArea(TABLE_PHOTO_AREA)) target = 'rule_pii';
                    else if (testArea(BOOK_AREA)) target = 'rule_length';
                    else if (testArea(BOOK_RIGHT_AREA)) target = 'empty_book';
                    else if (testArea(PLANT_AREA)) target = 'rule_patterns';
                    else if (testArea(PLANT_RIGHT_AREA)) target = 'empty_plant';

                    setInteractionTarget(target);
                    return { x: nx, y: ny };
                });
                setHackerProgress(prev => Math.min(100, prev + 0.01));
            } else if (gameState === 'room_intro' && isChairExited) {
                setPlayerPos(p => {
                    let nx = p.x, ny = p.y;
                    if (keys['w'] || keys['arrowup']) ny -= SPEED;
                    if (keys['s'] || keys['arrowdown']) ny += SPEED;
                    if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                    if (keys['d'] || keys['arrowright']) nx += SPEED;

                    DESK_PARTS.forEach(part => {
                        if (checkCollision(nx, ny, part)) {
                            if (p.x + PLAYER_SIZE <= part.x || p.x >= part.x + part.w) nx = p.x;
                            if (p.y + PLAYER_SIZE <= part.y || p.y >= part.y + part.h) ny = p.y;
                        }
                    });

                    nx = Math.max(50, Math.min(nx, ROOM_WIDTH - PLAYER_SIZE));
                    ny = Math.max(50, Math.min(ny, ROOM_HEIGHT - PLAYER_SIZE));

                    // Interaction with door (Bottom Center-ish)
                    let target = null;
                    if (Math.abs(nx - 800) < 150 && ny > 950) target = 'room_door';
                    setInteractionTarget(target);

                    return { x: nx, y: ny };
                });
            } else if ((gameState === 'living_room' || gameState === 'return_to_room') && notificationStep === 0) {

                setLivingRoomPlayerPos(p => {
                    let nx = p.x, ny = p.y;
                    if (keys['w'] || keys['arrowup']) ny -= SPEED;
                    if (keys['s'] || keys['arrowdown']) ny += SPEED;
                    if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                    if (keys['d'] || keys['arrowright']) nx += SPEED;

                    // Boundaries for CSS Room
                    nx = Math.max(120, Math.min(nx, ROOM_WIDTH - 120));
                    ny = Math.max(120, Math.min(ny, ROOM_HEIGHT - 120));

                    // Interaction detection
                    let target = null;
                    if (nx >= 1400 && Math.abs(ny - 550) < 150 && (hasTriggeredPhone || gameState === 'return_to_room')) target = 'return_to_study';
                    setInteractionTarget(target);

                    return { x: nx, y: ny };
                });
            }

            rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('keydown', handleKD);
            window.removeEventListener('keyup', handleKU);
            cancelAnimationFrame(rafId);
        };
    }, [gameState, keys, isChairExited, hasTriggeredPhone, notificationStep]);

    // Action Handler
    useEffect(() => {
        const handleE = (e) => {
            if (e.key.toLowerCase() === 'e') {
                if (gameState === 'pov_intro') {
                    playSynthSound('wood_tap');
                    setIsChairExited(true);
                    triggerTransition('room_intro', { x: 800, y: 600 });
                } else if (gameState === 'room_intro') {
                    if (interactionTarget === 'room_door') {
                        triggerTransition('living_room', null, { x: 1480, y: 550 });
                    }
                } else if (gameState === 'living_room' || gameState === 'return_to_room') {
                    if (notificationStep === 1) {
                        setNotificationStep(2);
                        playSynthSound('wood_tap');
                    } else if (notificationStep === 2) {
                        setNotificationStep(3);
                        playSynthSound('wood_tap');
                    } else if (notificationStep === 3) {
                        setNotificationStep(0);
                        setIsPhoneOpen(true);
                        playSynthSound('wood_tap');
                    } else if (interactionTarget === 'return_to_study') {
                        setGameState('title_card');
                    } else if (interactionTarget === 'exit_house') {
                        showFeedback("I should check my mail first... it felt like an important notification.");
                    } else if (hasTriggeredPhone && !isPhoneOpen) {
                        setIsPhoneOpen(true);
                        playSynthSound('wood_tap');
                    }
                } else if (gameState === 'room' && interactionTarget) {
                    if (interactionTarget === 'laptop') {
                        if (!cluesFound.includes('alert_received')) {
                            setGameState('alert');
                            setInteractionTarget(null);
                            playSynthSound('success_bell');
                            discoverClue('alert_received');
                        } else if (cluesFound.length < Object.keys(CLUE_INFO).length) {
                            showFeedback("I need to discover my grandfather's legacy rules before I can properly secure this account.");
                        } else {
                            setGameState('terminal');
                            setInteractionTarget(null);
                        }
                    } else if (interactionTarget === 'rule_symbols') {
                        setGameState('drawer_search');
                        setInteractionTarget(null);
                    } else if (interactionTarget === 'rule_pii') {
                        setGameState('photo_frame_search');
                        setInteractionTarget(null);
                    } else if (interactionTarget === 'rule_patterns') {
                        setGameState('plant_search_left');
                        setInteractionTarget(null);
                    } else if (interactionTarget === 'empty_plant') {
                        setGameState('plant_search_right');
                        setInteractionTarget(null);
                    } else if (interactionTarget === 'rule_length') {
                        setGameState('bookshelf_search_left');
                        setInteractionTarget(null);
                    } else if (interactionTarget === 'empty_book') {
                        setGameState('bookshelf_search_right');
                        setInteractionTarget(null);
                    } else if (interactionTarget.startsWith('empty_')) {
                        showFeedback("Nothing here...");
                    } else {
                        discoverClue(interactionTarget);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleE);
        return () => window.removeEventListener('keydown', handleE);
    }, [interactionTarget, cluesFound, gameState, isChairExited, hasTriggeredPhone, isPhoneOpen, notificationStep]);

    const rulesFoundCount = cluesFound.filter(c => c.startsWith('rule_')).length;

    const cameraX = Math.max(0, Math.min(playerPos.x - VIEWPORT_WIDTH / 2, ROOM_WIDTH - VIEWPORT_WIDTH));
    const cameraY = Math.max(0, Math.min(playerPos.y - VIEWPORT_HEIGHT / 2, ROOM_HEIGHT - VIEWPORT_HEIGHT));

    const shakeStyle = screenShake > 0 ? {
        transform: `translate(${(Math.random() - 0.5) * screenShake}px, ${(Math.random() - 0.5) * screenShake}px)`
    } : {};

    return (
        <div className="w-screen h-screen bg-zinc-950 overflow-hidden relative">
            {/* SCREEN TRANSITION OVERLAY - DEFINED DIRECTLY AS JSX TO PREVENT REMOUNT LAG */}
            <div
                className={`fixed inset-0 z-[9999] bg-black transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* COMPLETION SCREENS - MOVED TO TOP AND MADE ROBUST */}
            {gameState === 'outcome' && (
                <div className="fixed inset-0 z-[9500] bg-zinc-950 overflow-hidden" style={{ animation: 'fadeIn 1s ease-out forwards' }}>
                    {/* Ambient background effects */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[150px]" style={{ animation: 'fadeIn 2s ease-out forwards' }}></div>
                        <div className="absolute top-0 inset-x-0 h-1/3 bg-gradient-to-b from-emerald-900/10 to-transparent"></div>
                        <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent"></div>
                        {/* Floating particles */}
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="absolute w-1 h-1 bg-emerald-400/30 rounded-full"
                                style={{
                                    left: `${15 + (i * 7) % 85}%`,
                                    top: `${10 + (i * 13) % 80}%`,
                                    animation: `fadeIn ${1 + i * 0.3}s ease-out ${i * 0.15}s both, surge ${3 + i % 3}s ease-in-out infinite`
                                }}
                            ></div>
                        ))}
                    </div>

                    <div className="w-full h-full flex flex-col items-center justify-center p-8 relative z-10">
                        {/* Shield Icon with animated rings */}
                        <div className="relative mb-10" style={{ animation: 'zoomIn 0.8s cubic-bezier(0.16,1,0.3,1) forwards' }}>
                            {/* Pulsing rings */}
                            <div className="absolute inset-0 scale-[2.5] rounded-full border border-emerald-500/10" style={{ animation: 'surge 3s ease-in-out infinite' }}></div>
                            <div className="absolute inset-0 scale-[2] rounded-full border border-emerald-500/15" style={{ animation: 'surge 3s ease-in-out 0.5s infinite' }}></div>
                            <div className="absolute inset-0 scale-[1.5] rounded-full border border-emerald-500/20" style={{ animation: 'surge 3s ease-in-out 1s infinite' }}></div>
                            
                            {/* Shield shape */}
                            <div className="relative w-28 h-28 flex items-center justify-center">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl rotate-45 shadow-[0_0_60px_rgba(16,185,129,0.4)]"></div>
                                <svg className="w-14 h-14 text-white relative z-10 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                        </div>

                        {/* Title */}
                        <div style={{ animation: 'fadeIn 1s ease-out 0.3s both' }}>
                            <div className="text-[10px] font-black uppercase tracking-[1em] text-emerald-500/60 mb-4 text-center pl-[1em]">Security Protocol</div>
                            <h1 className="text-6xl font-black text-white mb-3 uppercase tracking-[0.15em] text-center" style={{ textShadow: '0 0 40px rgba(16,185,129,0.3)' }}>Account Secured</h1>
                            <div className="h-1 w-24 bg-gradient-to-r from-transparent via-emerald-500 to-transparent mx-auto mb-6"></div>
                            <p className="text-zinc-400 max-w-lg mx-auto text-center font-medium tracking-wide leading-relaxed text-sm">
                                Grandpa's legacy is safe. You've applied all four rules and <br/>successfully blocked the credential breach.
                            </p>
                        </div>

                        {/* Rules Recap Dashboard */}
                        <div className="mt-10 w-full max-w-2xl" style={{ animation: 'fadeIn 1s ease-out 0.8s both' }}>
                            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 backdrop-blur-sm">
                                <div className="flex items-center justify-between mb-5">
                                    <span className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-500">Rules Applied</span>
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400">4/4 Verified</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { icon: '⚙️', title: 'Mix Your Tools', desc: 'Special chars & numbers', delay: '1s' },
                                        { icon: '🧱', title: 'The Great Wall', desc: '15+ character length', delay: '1.15s' },
                                        { icon: '🖼️', title: 'Family Secrets', desc: 'No personal info', delay: '1.3s' },
                                        { icon: '🗺️', title: 'No Straight Paths', desc: 'No keyboard patterns', delay: '1.45s' }
                                    ].map((rule, i) => (
                                        <div key={i} className="flex items-center gap-4 bg-emerald-500/[0.04] border border-emerald-500/10 rounded-xl px-5 py-4"
                                             style={{ animation: `fadeIn 0.6s ease-out ${rule.delay} both` }}
                                        >
                                            <div className="text-xl shrink-0">{rule.icon}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 truncate">{rule.title}</div>
                                                <div className="text-[10px] text-zinc-500 truncate">{rule.desc}</div>
                                            </div>
                                            <div className="w-5 h-5 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                                                <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>


                        {/* CTA Button */}
                        <button
                            onClick={() => {
                                setGameState('cinematic_outro');
                                setOutroStep(1);
                                playSynthSound('wood_tap');
                                setTimeout(() => {
                                    setOutroStep(2);
                                    setTimeout(() => {
                                        completeLevel(true, 100, 0);
                                    }, 4000);
                                }, 2000);
                            }}
                            className="mt-10 group relative px-20 py-5 rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(16,185,129,0.2)]"
                            style={{ animation: 'fadeIn 1s ease-out 2.2s both' }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"></div>
                            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-full transition-all"></div>
                            <span className="relative z-10 text-black font-black text-xs uppercase tracking-[0.4em] flex items-center gap-3">Next Level <span className="text-lg">→</span></span>
                        </button>

                        {/* Bottom metadata line */}
                        <div className="mt-8 flex items-center gap-4 opacity-30" style={{ animation: 'fadeIn 1s ease-out 2.5s both' }}>
                            <div className="h-px w-12 bg-zinc-700"></div>
                            <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.5em]">Session // Breach Neutralized</span>
                            <div className="h-px w-12 bg-zinc-700"></div>
                        </div>
                    </div>
                </div>
            )}

            {gameState === 'cinematic_outro' && (
                <div className="fixed inset-0 z-[9500] bg-black animate-fadeIn overflow-hidden">
                    <div className="w-full h-full flex flex-col items-center justify-center relative">
                        {/* Scanning line effects */}
                        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%]" />
                        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-red-500/5 to-transparent animate-scanLine pointer-events-none" />

                        <div className="relative text-center">
                            <div className="absolute -inset-20 bg-red-500/5 blur-[100px] rounded-full scale-150" />
                            <h2 className="text-white text-6xl font-black tracking-[0.5em] uppercase mb-12 relative z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                Level 2: The Credential Breach
                                {outroStep >= 2 && (
                                    <div className="absolute top-1/2 left-[-10%] w-[120%] h-3 bg-red-600/90 -translate-y-1/2 animate-strikeThrough shadow-[0_0_30px_rgba(220,38,38,1)] z-20 skew-y-[-1deg]" />
                                )}
                            </h2>

                            {outroStep >= 2 && (
                                <div className="mt-12 text-8xl font-black italic tracking-[0.2em] uppercase animate-surge relative text-emerald-500">
                                    <span className="relative z-10">COMPLETED</span>
                                    {/* Chromatic aberration for text */}
                                    <span className="absolute inset-0 text-cyan-400 opacity-40 translate-x-1 animate-aberration">COMPLETED</span>
                                    <span className="absolute inset-0 text-emerald-300 opacity-40 -translate-x-1 animate-aberration-alt">COMPLETED</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-24 flex flex-col items-center gap-4 opacity-50">
                            <div className="h-px w-64 bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
                            <div className="text-[10px] font-mono text-zinc-500 tracking-[0.8em] uppercase animate-pulse">
                                Digital Defense Session // STATUS_CLEARED
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CINEMATIC NOISE - DEFINED DIRECTLY AS JSX */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.03] z-[9000] mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEWFhYWDg4N3dy95eTl6enq7u7u+vr6/v7+8vLy9vb29vb3BwcHBwcHCwsLCwsLBwcG9vb26urq5ubm4uLi3t7e2tra1tbW0tLS0tLS0tLS0tLS0tLS0tLS0tLSU9p9zAAAAAnRSTlP/AOW3MEoAAAAnSURBVHgB7cHBAAAAAMOg+VPf4glrAAAAAAAAAAAAAAAAAAAAAD4A738AnTNV9kAAAAAASUVORK5CYII=")`,
                    backgroundRepeat: 'repeat',
                    pointerEvents: 'none'
                }}
            />

            <div className="w-full h-full flex items-center justify-center px-8 relative">
                {/* POV INTRO PHASE (Level 1 Style) */}
                {gameState === 'pov_intro' && (
                    <div className="w-full h-full bg-black flex items-center justify-center overflow-hidden relative animate-fadeIn">
                        <div
                            className="w-full h-full transition-all duration-1000"
                            style={{
                                backgroundImage: `url("/assets/temppho.png")`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        />
                        <div className="absolute inset-0 bg-black/40" />

                        <div className="absolute bottom-32 w-full text-center pointer-events-none z-50">
                            <p className="text-white/95 text-3xl font-serif italic tracking-wider drop-shadow-[0_4px_12px_rgba(0,0,0,1)] px-12 animate-slideUp">
                                "I really need a coffee after all that..."
                            </p>
                            <div className="mt-6 w-16 h-[2px] bg-white/40 mx-auto animate-drawWidth" />
                        </div>

                        {/* Ultra-Minimalist Cinematic Prompt */}
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 animate-fadeIn">
                            <div className="h-[2px] w-12 bg-white/30 mb-3" />
                            <div className="text-white/80 font-mono text-[11px] uppercase tracking-[0.4em] drop-shadow-md">
                                Press E to get up from the chair
                            </div>
                        </div>



                    </div>
                )}

                {/* LIVING ROOM PHASE (Full CSS Environment Synced with Level 9) */}
                {(gameState === 'living_room' || gameState === 'return_to_room') && (
                    <div className="w-full h-full flex items-center justify-center bg-[#0f172a] px-8 animate-in fade-in duration-1000 font-sans">
                        <div
                            className="relative border-8 border-slate-900 shadow-2xl overflow-hidden bg-slate-900"
                            style={{
                                width: VIEWPORT_WIDTH,
                                height: VIEWPORT_HEIGHT,
                                ...shakeStyle,
                                willChange: 'transform'
                            }}
                        >
                            {/* World Container (Camera) */}
                            <div
                                className="absolute inset-0"
                                style={{
                                    width: ROOM_WIDTH,
                                    height: ROOM_HEIGHT,
                                    transform: `translate(${-(Math.max(0, Math.min(livingRoomPlayerPos.x - VIEWPORT_WIDTH / 2, ROOM_WIDTH - VIEWPORT_WIDTH)))}px, ${-(Math.max(0, Math.min(livingRoomPlayerPos.y - VIEWPORT_HEIGHT / 2, ROOM_HEIGHT - VIEWPORT_HEIGHT)))}px)`,
                                    backgroundColor: '#2c3e50',
                                    willChange: 'transform'
                                }}
                            >

                                {/* Wood Floor */}
                                <div className="absolute inset-0 opacity-80" style={{
                                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(0,0,0,0.2) 38px, rgba(0,0,0,0.2) 40px)'
                                }}></div>

                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 pointer-events-none z-10"></div>


                                {/* DOORS AND OPENINGS */}
                                {/* Top Double Door (Main Exit) */}
                                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[240px] h-[80px] bg-[#8a5a44] border-4 border-black border-t-0 flex z-10 ${Math.abs(livingRoomPlayerPos.x - 800) < 120 && livingRoomPlayerPos.y < 150 ? 'opacity-100 scale-105' : 'opacity-80'} transition-all`}>
                                    <div className="flex-1 border-r-2 border-black p-2 flex items-center justify-center text-[10px] text-white font-bold uppercase tracking-widest bg-emerald-900/20">EXIT</div>
                                    <div className="flex-1 border-l-2 border-black p-2 flex items-center justify-center">
                                        <div className="w-[80px] h-[50px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                                    </div>
                                    <div className="absolute top-[40px] left-[110px] w-4 h-1 bg-black"></div>
                                    <div className="absolute top-[40px] right-[110px] w-4 h-1 bg-black"></div>
                                </div>

                                {/* Right Single Door (Return to Study) */}
                                <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-[60px] h-[180px] bg-[#8a5a44] border-4 border-black border-r-0 p-3 flex flex-col items-center justify-center z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] ${interactionTarget === 'return_to_study' ? 'scale-105' : ''} transition-all`}>
                                    <div className="text-[9px] text-white/60 font-black rotate-90 mb-8 tracking-[0.3em]">STUDY</div>
                                    <div className="w-[30px] h-[80px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                                    <div className="absolute left-2 bottom-6 w-1 h-6 bg-black"></div>
                                </div>



                                {/* RUGS FROM LEVEL 9 */}
                                {/* HORIZONTAL RED RUG */}
                                <div className="absolute left-[180px] right-[120px] top-1/2 -translate-y-1/2 h-[260px] bg-[#cb3234] border-y-2 border-black z-0">
                                    <div className="flex flex-col justify-between h-full -ml-2 absolute left-0 py-2">
                                        {[...Array(18)].map((_, i) => <div key={i} className="w-2 h-1 bg-black"></div>)}
                                    </div>
                                    <div className="flex flex-col justify-between h-full -mr-2 absolute right-0 py-2">
                                        {[...Array(18)].map((_, i) => <div key={i} className="w-2 h-1 bg-black"></div>)}
                                    </div>
                                </div>

                                {/* VERTICAL RED RUG */}
                                <div className="absolute top-[80px] bottom-[80px] left-1/2 -translate-x-1/2 w-[260px] bg-[#cb3234] border-x-2 border-black z-0">
                                    <div className="flex justify-between w-full -mt-2 absolute top-0 px-2">
                                        {[...Array(18)].map((_, i) => <div key={i} className="w-1 h-2 bg-black"></div>)}
                                    </div>
                                    <div className="flex justify-between w-full -mb-2 absolute bottom-0 px-2">
                                        {[...Array(18)].map((_, i) => <div key={i} className="w-1 h-2 bg-black"></div>)}
                                    </div>
                                </div>

                                {/* FURNITURE FROM LEVEL 9 */}
                                {/* SOFA */}
                                <div className="absolute right-[480px] top-1/2 -translate-y-1/2 w-[140px] h-[320px] bg-[#445265] border-4 border-black flex flex-row items-center justify-start z-20 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
                                    <div className="w-[80px] h-full flex flex-col justify-center items-start pl-2 gap-4">
                                        <div className="w-[60px] h-[100px] bg-[#364253] border-2 border-black ml-2 mt-2 shadow-inner"></div>
                                        <div className="w-[60px] h-[100px] bg-[#364253] border-2 border-black ml-2 mb-2 shadow-inner"></div>
                                    </div>
                                    <div className="absolute right-0 top-0 bottom-0 w-[40px] bg-[#4a586e] border-l-[3px] border-black shadow-inner"></div>
                                    <div className="absolute top-0 left-0 w-[100px] h-[30px] bg-[#4a586e] border-b-[3px] border-black shadow-inner"></div>
                                    <div className="absolute bottom-0 left-0 w-[100px] h-[30px] bg-[#4a586e] border-t-[3px] border-black shadow-inner"></div>
                                    {/* Sofa Shadow */}
                                    <div className="absolute -bottom-8 left-4 right-4 h-8 bg-black/40 blur-xl rounded-full -z-10"></div>
                                </div>

                                {/* COFFEE TABLE (Interaction Target) */}
                                <div className="absolute left-[740px] top-1/2 -translate-y-1/2 w-[100px] h-[180px] bg-[#383a48]/90 backdrop-blur-md border-4 border-[#222938] z-20 shadow-2xl flex items-center justify-center">
                                    <div className="w-[80px] h-[160px] border border-white/10"></div>
                                    {/* Shadow */}
                                    <div className="absolute top-full left-2 right-2 h-6 bg-black/40 blur-xl rounded-full -z-10"></div>
                                </div>

                                {/* LAMPS FROM LEVEL 9 */}
                                <div className="absolute right-[410px] top-[330px] w-[50px] h-[50px] bg-[#383a48] border-2 border-black flex items-center justify-center z-10 shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                                    <div className="w-6 h-6 bg-[#d98536] rounded-full border-2 border-[#ffb969] shadow-[0_0_20px_#ffeb3b,inset_0_0_10px_#fff] animate-pulse"></div>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-yellow-500/10 blur-2xl rounded-full -z-10 animate-pulse"></div>
                                </div>
                                <div className="absolute right-[410px] bottom-[330px] w-[50px] h-[50px] bg-[#383a48] border-2 border-black flex items-center justify-center z-10 shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                                    <div className="w-6 h-6 bg-[#d98536] rounded-full border-2 border-[#ffb969] shadow-[0_0_20px_#ffeb3b,inset_0_0_10px_#fff] animate-pulse"></div>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-yellow-500/10 blur-2xl rounded-full -z-10 animate-pulse"></div>
                                </div>

                                {/* TV UNIT FROM LEVEL 9 */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[180px] h-[340px] bg-[#222938] border-4 border-l-0 border-black flex items-center z-20 shadow-[20px_0_40px_rgba(0,0,0,0.6)]">
                                    <div className="w-[120px] h-[260px] bg-[#1e4868] border-4 border-[#122336] ml-4 relative overflow-hidden shadow-inner">
                                        <div className="w-[180px] h-[40px] bg-white/10 -rotate-45 absolute top-4 -left-8"></div>
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-blue-500/20 blur-lg animate-pulse"></div>
                                        <div className="absolute top-1/2 left-full -translate-y-1/2 w-40 h-56 bg-blue-500/5 blur-2xl rounded-full -z-10 animate-pulse"></div>
                                    </div>
                                </div>



                                {/* CORNER PLANTS FROM LEVEL 9 */}
                                <div className="absolute left-[30px] top-[140px] w-[60px] h-[60px] bg-[#1d273a] rounded-full border-[3px] border-black flex items-center justify-center shadow-lg">
                                    <div className="w-[44px] h-[44px] rounded-full bg-[#1b2f4f] flex items-center justify-center relative overflow-hidden">
                                        <div className="w-[60px] h-[10px] bg-[#3a6b57] rotate-45 absolute"></div>
                                        <div className="w-[60px] h-[10px] bg-[#3a6b57] -rotate-45 absolute"></div>
                                    </div>
                                </div>
                                <div className="absolute right-[30px] top-[140px] w-[60px] h-[60px] bg-[#1d273a] rounded-full border-[3px] border-black flex items-center justify-center shadow-lg">
                                    <div className="w-[44px] h-[44px] rounded-full bg-[#1b2f4f] flex items-center justify-center relative overflow-hidden">
                                        <div className="w-[60px] h-[10px] bg-[#22c55e] rotate-45 absolute shadow-[0_0_10px_#22c55e]"></div>
                                        <div className="w-[60px] h-[10px] bg-[#22c55e] -rotate-45 absolute"></div>
                                    </div>
                                </div>

                                {/* Player in Living Room */}
                                <div className="absolute z-40" style={{ transform: `translate(${livingRoomPlayerPos.x}px, ${livingRoomPlayerPos.y}px) translate(-50%, -50%)`, willChange: 'transform' }}>
                                    <Player />
                                </div>

                            </div>

                            {/* Narrative Overlay */}
                            {gameState === 'living_room' && !hasTriggeredPhone && (
                                <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                                    <div className="bg-slate-950/80 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 shadow-2xl flex items-center gap-4">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                        <span className="text-white font-black tracking-[0.3em] uppercase text-[10px]">Head to the Bath...</span>
                                    </div>
                                </div>
                            )}
                            {gameState === 'return_to_room' && (
                                <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in duration-500">
                                    <div className="bg-slate-950/80 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 shadow-2xl flex items-center gap-4">
                                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                        <span className="text-white font-black tracking-[0.3em] uppercase text-[10px]">Go near the laptop and inspect the Photo Frame</span>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                )}

                {/* PHONE EMAIL UI */}
                {isPhoneOpen && (
                    <div className="fixed inset-0 z-[6000] flex items-center justify-center bg-black/80 backdrop-blur-xl animate-zoomIn">
                        <div className="w-[360px] h-[720px] bg-[#0a0a0a] border-[8px] border-[#1a1a1a] rounded-[3.5rem] shadow-2xl relative overflow-hidden flex flex-col">
                            <div className="w-24 h-6 bg-black mx-auto rounded-b-2xl mb-4" />
                            <div className="bg-white p-6 pt-10">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white font-black text-xl">G</div>
                                    <div>
                                        <h4 className="font-bold text-zinc-900">Google Security</h4>
                                        <span className="text-xs text-zinc-500">no-reply@accounts.google.com</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-zinc-50 flex-1 p-8 text-center flex flex-col items-center">
                                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-600 text-4xl mb-6 border-2 border-red-100">⚠️</div>
                                <h2 className="text-2xl font-black text-zinc-900 mb-4 tracking-tight">Security Alert</h2>
                                <p className="text-sm text-zinc-600 leading-relaxed mb-8">
                                    A new sign-in was detected on your account from a device in <b>Moscow, Russia</b>.
                                    <br /><br />
                                    If this wasn't you, please secure your account by changing your password immediately.
                                </p>
                                <button
                                    onClick={() => {
                                        setIsPhoneOpen(false);
                                        setGameState('return_to_room');
                                    }}
                                    className="w-full py-5 bg-[#1a73e8] hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl uppercase tracking-widest text-xs"
                                >
                                    Not Me? Change Password
                                </button>
                            </div>
                            <div className="h-2 w-32 bg-zinc-800 mx-auto mb-4 rounded-full opacity-50" />
                        </div>
                    </div>
                )}

                {/* MAIN ROOM VIEWPORT (Original Level 2) */}
                {(gameState === 'room' || gameState === 'room_intro' || gameState === 'alert' || gameState === 'terminal' || gameState.includes('search')) && (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-950 px-8">
                        {gameState === 'alert' && <GmailAlert onProceed={() => setGameState('room')} />}
                        {gameState === 'terminal' && <SecurityTerminal onComplete={() => setGameState('outcome')} onFail={showFeedback} rulesFound={rulesFoundCount} playSynthSound={playSynthSound} />}
                        {gameState === 'drawer_search' && <DrawerSearch hasClue={true} discoveredClues={cluesFound} discoverClue={discoverClue} onComplete={() => setGameState('room')} />}
                        {gameState === 'photo_frame_search' && <PhotoFrameSearch discoveredClues={cluesFound} discoverClue={discoverClue} onComplete={() => setGameState('room')} />}
                        {gameState === 'plant_search_left' && <PlantSearch hasClue={true} discoveredClues={cluesFound} discoverClue={discoverClue} onComplete={() => setGameState('room')} />}
                        {gameState === 'plant_search_right' && <PlantSearch hasClue={false} discoveredClues={cluesFound} discoverClue={() => { }} onComplete={() => setGameState('room')} />}
                        {gameState === 'bookshelf_search_left' && <BookshelfSearch hasClue={true} discoveredClues={cluesFound} discoverClue={discoverClue} onComplete={() => setGameState('room')} />}
                        {gameState === 'bookshelf_search_right' && <BookshelfSearch hasClue={false} discoveredClues={cluesFound} discoverClue={() => { }} onComplete={() => setGameState('room')} />}



                        <div
                            className={`relative border-8 border-slate-900 shadow-2xl overflow-hidden bg-zinc-900 ${hackerProgress > 70 ? 'shadow-[0_0_100px_rgba(220,38,38,0.3)]' : ''}`}
                            style={{
                                width: VIEWPORT_WIDTH,
                                height: VIEWPORT_HEIGHT,
                                ...shakeStyle,
                                willChange: 'transform'
                            }}
                        >
                            {/* Narrative Overlay for Start */}
                            {gameState === 'room_intro' && (
                                <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
                                    <div className="bg-slate-950/80 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 shadow-2xl flex items-center gap-4">
                                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                        <span className="text-white font-black tracking-[0.3em] uppercase text-[10px]">Go out of the room</span>
                                    </div>
                                </div>
                            )}



                            <div
                                className="absolute inset-0"
                                style={{
                                    width: ROOM_WIDTH,
                                    height: ROOM_HEIGHT,
                                    transform: `translate(${-cameraX}px, ${-cameraY}px)`,
                                    willChange: 'transform'
                                }}
                            >

                                <div className="absolute inset-0 bg-[#2c3e50] overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/30 pointer-events-none z-20" />
                                    <div
                                        className="absolute inset-0 z-0"
                                        style={{
                                            backgroundImage: "url('/assets/study.png')",
                                            backgroundSize: '100% 100%',
                                            backgroundPosition: 'left top'
                                        }}
                                    />
                                    <Player x={playerPos.x} y={playerPos.y} />

                                    {/* EXIT TO HALL - bulky UI removed in favor of minimalist floating prompt */}

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
                                <div className="absolute inset-y-12 right-12 w-[420px] z-[1000] bg-[#0c0c0c] border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)] rounded-3xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-500 backdrop-blur-3xl font-sans">
                                    <div className="p-10 pb-6 flex justify-between items-center bg-gradient-to-b from-white/[0.02] to-transparent">
                                        <div>
                                            <h3 className="text-white font-black uppercase tracking-[0.4em] text-xs">Security Log</h3>
                                            <div className="h-0.5 w-8 bg-cyan-500 mt-2"></div>
                                        </div>
                                        <button 
                                            onClick={() => setIsDetectiveModeOpen(false)} 
                                            className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
                                        >✕</button>
                                    </div>
                                    
                                    <div className="flex-1 p-8 space-y-6 overflow-y-auto custom-scrollbar">
                                        {Object.keys(CLUE_INFO).map(cid => {
                                            const found = cluesFound.includes(cid);
                                            return (
                                                <div 
                                                    key={cid} 
                                                    className={`group relative p-8 rounded-[2rem] border transition-all duration-500 
                                                        ${found 
                                                            ? 'bg-[#1a1a1a] border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)]' 
                                                            : 'bg-black/40 border-white/[0.03] opacity-60'}`}
                                                >
                                                    <div className="flex gap-6 items-start">
                                                        <div className={`text-4xl transition-transform duration-500 ${found ? 'scale-110' : 'opacity-40 grayscale'}`}>
                                                            {found ? CLUE_INFO[cid].icon : '🔒'}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className={`text-[11px] font-black uppercase tracking-[0.2em] mb-3 
                                                                ${found ? (cid === 'alert_received' ? 'text-cyan-400' : 'text-emerald-400') : 'text-zinc-600'}`}>
                                                                {found ? CLUE_INFO[cid].title : 'UNKNOWN'}
                                                            </div>
                                                            <p className={`text-[11px] leading-relaxed font-medium 
                                                                ${found ? 'text-zinc-300' : 'text-zinc-600 italic'}`}>
                                                                {found ? CLUE_INFO[cid].desc : `Search near: ${CLUE_INFO[cid].hint}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Subtle divider decoration */}
                                                    {found && (
                                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 w-0.5 h-12 bg-cyan-500/30 rounded-full blur-[1px]"></div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    <div className="p-8 bg-black/60 border-t border-white/5">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                            <span>Progress</span>
                                            <span>{cluesFound.length} / 5 Found</span>
                                        </div>
                                        <div className="mt-3 h-1 bg-zinc-900 rounded-full overflow-hidden">
                                            <div className="h-full bg-cyan-500 transition-all duration-1000" style={{ width: `${(cluesFound.length / 5) * 100}%` }}></div>
                                        </div>
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

                            <div className="absolute inset-0 pointer-events-none transition-opacity duration-1000 z-[2000]"
                                style={{
                                    opacity: hackerProgress > 60 ? (hackerProgress - 60) / 40 : 0,
                                    background: 'radial-gradient(circle at center, transparent 40%, rgba(220,38,38,0.3) 100%)'
                                }}>
                            </div>
                        </div>
                    </div>
                )}

                {/* Global Dim Overlay during Notification Cutscene */}
                {notificationStep > 0 && (
                    <div className="absolute inset-0 bg-black/70 z-[4000] pointer-events-none animate-in fade-in duration-1000"></div>
                )}

                {/* Global Ultra-Minimalist Cinematic Prompt & Cutscene Dialogue */}
                {(notificationStep > 0 || (interactionTarget && notificationStep === 0 && ['room', 'room_intro', 'living_room', 'return_to_room'].includes(gameState))) && (
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-[8000] animate-in fade-in duration-500">
                        <div className="h-[2px] w-12 bg-white/30 mb-3" />
                        <div className="text-white font-mono text-[11px] uppercase tracking-[0.4em] drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] text-center max-w-[400px]">
                            {notificationStep === 1 && "What was that notification?"}
                            {notificationStep === 2 && "Let's check the phone."}
                            {notificationStep === 3 && "Press E to check the phone"}
                            {notificationStep === 0 && interactionTarget && `Press E to ${(() => {
                                switch (interactionTarget) {
                                    case 'laptop': return cluesFound.includes('alert_received') ? "Terminal" : "Check Alert";
                                    case 'rule_symbols': return "Search Draws";
                                    case 'rule_pii': return "Check Frame";
                                    case 'rule_length':
                                    case 'empty_book': return "Bookshelf";
                                    case 'rule_patterns':
                                    case 'empty_plant': return "Flower Pot";
                                    case 'room_door': return "Exit Room";
                                    case 'return_to_study': return "Study";
                                    case 'exit_house': return "Front Door";
                                    default: return "Inspect";
                                }
                            })()}`}
                        </div>
                        {(notificationStep === 1 || notificationStep === 2) && (
                            <div className="text-white/50 font-mono text-[9px] uppercase tracking-widest mt-4 animate-pulse">
                                Press E for next
                            </div>
                        )}
                    </div>
                )}


                {/* CINEMATIC TITLE CARD PHASE */}
                {gameState === 'title_card' && (
                    <div className="absolute inset-0 bg-black z-[9000] flex flex-col items-center justify-center animate-cinematic-sequence overflow-hidden">
                        <div className="flex flex-col items-center relative">
                            {/* Dramatic pulse rings */}
                            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-3xl animate-ping scale-[2.5] opacity-50" />

                            <div className="h-px w-32 bg-gradient-to-r from-transparent via-red-500 to-transparent mb-8 animate-width" />

                            <h2 className="text-white text-6xl font-black tracking-[0.4em] uppercase mb-4 relative opacity-0" style={{ animation: 'fadeIn 1s forwards, surge 3.5s infinite' }}>
                                <span className="relative z-10">Level 2</span>
                                {/* Chromatic aberration layers */}
                                <span className="absolute inset-0 text-red-500 opacity-60 translate-x-1 -z-10 animate-aberration">Level 2</span>
                                <span className="absolute inset-0 text-cyan-400 opacity-60 -translate-x-1 -z-10 animate-aberration-alt">Level 2</span>
                            </h2>

                            <h3 className="text-red-500 text-lg font-mono tracking-[0.8em] uppercase opacity-0 font-bold" style={{ animation: 'fadeIn 1s forwards 1.2s' }}>
                                The Credential Breach
                            </h3>

                            <div className="h-px w-32 bg-gradient-to-r from-transparent via-red-500 to-transparent mt-12 animate-width" />

                            {/* Tension metadata */}
                            <div className="mt-8 text-[8px] font-mono text-zinc-800 tracking-widest uppercase animate-pulse">
                                RE-INITIALISING SECURITY SESSION... [33%] [66%] [99%]
                            </div>
                        </div>
                    </div>
                )}

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

                @keyframes wiggle { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
                @keyframes dropdown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeInDelay { 0%, 50% { opacity: 0; } 100% { opacity: 1; } }
                @keyframes zoomIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes width { from { width: 0; opacity: 0; } to { width: 12rem; opacity: 0.8; } }
                @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes scanLine { from { transform: translateY(-100%); } to { transform: translateY(200%); } }
                @keyframes fieldZoom { from { transform: scale(1); } to { transform: scale(1.1); } }
                @keyframes shimmerWidth { from { width: 0; } to { width: 8rem; } }
                @keyframes strikeThrough { from { width: 0; } to { width: 120%; } }
                @keyframes surge {
                    0%, 100% { transform: scale(1); filter: brightness(1); }
                    50% { transform: scale(1.08); filter: brightness(1.3); drop-shadow: 0 0 40px rgba(255,255,255,0.4); }
                }
                @keyframes fadeInSlow { from { opacity: 0; } 30% { opacity: 1; } to { opacity: 1; } }
                @keyframes pin-bounce {
                    0% { transform: scale(0.5) translateY(-20px); opacity: 0; }
                    60% { transform: scale(1.1) translateY(5px); opacity: 1; }
                    100% { transform: scale(1) translateY(0); opacity: 1; }
                }
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
                @keyframes drawWidth {
                    from { width: 0; opacity: 0; }
                    to { width: 4rem; opacity: 1; }
                }
            ` }} />

            </div>
        </div>
    );
};

export default Level2;
