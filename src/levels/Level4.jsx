import React, { useState, useEffect, useMemo } from 'react';
import Player from '../components/Player';
import { useGameState } from '../context/GameStateContext';

const ROOM_WIDTH = 2000;
const ROOM_HEIGHT = 800;
const SPEED = 15;
const PLAYER_SIZE = 40;
const SELVI_ZONE = { x: 800, y: 250, w: 300, h: 300 }; // Raised center-left stall area

// No external assets - using pure 2D CSS art

const checkCollision = (px, py, rect) => (
    px < rect.x + rect.w && px + PLAYER_SIZE > rect.x &&
    py < rect.y + rect.h && py + PLAYER_SIZE > rect.y
);

const CLUE_DATA = [
    { id: 1, title: 'COLLECT vs PAY', desc: "In UPI, there are only two transaction types. A legitimate vendor creates a QR for a PAYMENT. A fraudster creates a QR for a COLLECT REQUEST (money TO them). Both require PIN.", noteColor: '#fff9c4' },
    { id: 2, title: 'Tampered QR', desc: "Scammers paste fake printed stickers over real QR codes. The only way to detect is looking for edges or asking the vendor for their UPI ID verbally.", noteColor: '#e1f5fe' },
    { id: 3, title: 'The ₹1 Trap', desc: "The fraudulent QR shows 'Collect ₹1'. Many think 'It's just one rupee.' Once you enter your PIN, you prove it works. Within seconds, they send requests for thousands.", noteColor: '#fce4ec' },
    { id: 4, title: 'Unknown UPI ID', desc: "Selvi's son registered her ID (e.g., selvi.veg). The fraudulent QR has a random string: '9944XXXXX@paytm'. If the name doesn't match the seller, STOP.", noteColor: '#e8f5e9' },
    { id: 5, title: 'Missing Name', desc: "Legitimate merchant QR shows: Merchant Name, Category. The fraudulent QR shows no merchant name—only a phone number handle. It is a personal collect request.", noteColor: '#fff3e0' },
    { id: 6, title: 'Vendor as Victim', desc: "Selvi did not create this fraud. Thousands of vendors are targeted this way. Alerting Selvi protects her and saves future customers.", noteColor: '#f3e5f5' },
];

const MINI_GAME_QRS = [
    { id: 'A', title: 'Pharmacy Payment', desc: 'Pay ₹500 to PharmacyBazar@oksbi', safe: true },
    { id: 'B', title: 'Cashback Request', desc: 'Collect ₹5 from your account to receive cashback', safe: false },
    { id: 'C', title: 'Jewelry Purchase', desc: 'Pay ₹1200 to GoldJewels_Ravi@ybl', safe: true },
    { id: 'D', title: 'Activation Fee', desc: 'Collect ₹1 activation fee for cashback offer', safe: false },
];

const MARKET_BKG = "data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7z' fill='%2364748b' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E";

const Level4 = () => {
    const { completeLevel, adjustAssets, adjustLives } = useGameState();
    const [playerPos, setPlayerPos] = useState({ x: 200, y: 600 });
    const [keys, setKeys] = useState({});
    const [gameState, setGameState] = useState('market_walk');
    const [canInteract, setCanInteract] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState(null);
    const [cluesFound, setCluesFound] = useState([]);
    const [pinInput, setPinInput] = useState('');
    const [stickerPeeled, setStickerPeeled] = useState(false);
    const [inspectedZones, setInspectedZones] = useState([]);
    const [scamReported, setScamReported] = useState(false);

    // Mini-game state
    const [safeBucket, setSafeBucket] = useState([]);
    const [scamBucket, setScamBucket] = useState([]);
    const [draggedQR, setDraggedQR] = useState(null);
    const [miniGameOver, setMiniGameOver] = useState(false);

    // Stable QR pattern (avoid Math.random in render)
    const qrPattern = useMemo(() => {
        return Array.from({ length: 12 }, () =>
            Array.from({ length: 12 }, () => Math.random() > 0.4)
        );
    }, []);

    useEffect(() => {
        const dk = (e) => setKeys(k => ({ ...k, [e.key.toLowerCase()]: true }));
        const uk = (e) => setKeys(k => ({ ...k, [e.key.toLowerCase()]: false }));
        window.addEventListener('keydown', dk);
        window.addEventListener('keyup', uk);
        return () => { window.removeEventListener('keydown', dk); window.removeEventListener('keyup', uk); };
    }, []);

    // E key to interact
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key.toLowerCase() === 'e' && canInteract && gameState === 'market_walk') {
                setGameState('dialogue');
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [canInteract, gameState]);

    useEffect(() => {
        if (gameState !== 'market_walk') return;
        let frameId;
        const loop = () => {
            const currentRoomWidth = Math.max(ROOM_WIDTH, window.innerWidth);
            setPlayerPos(p => {
                let nx = p.x, ny = p.y;
                if (keys['w'] || keys['arrowup']) ny -= SPEED;
                if (keys['s'] || keys['arrowdown']) ny += SPEED;
                if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                if (keys['d'] || keys['arrowright']) nx += SPEED;
                nx = Math.max(0, Math.min(nx, currentRoomWidth - PLAYER_SIZE));
                ny = Math.max(250, Math.min(ny, ROOM_HEIGHT - PLAYER_SIZE));

                // (Removed legacy CSS-box stall blocks so user can roam up to Selvi in the image)

                return { x: nx, y: ny };
            });
            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [keys, gameState]);

    // Check interaction zone outside of state updater
    useEffect(() => {
        const near = checkCollision(playerPos.x, playerPos.y, {
            x: SELVI_ZONE.x - 80, y: SELVI_ZONE.y - 80,
            w: SELVI_ZONE.w + 160, h: SELVI_ZONE.h + 160
        });
        setCanInteract(near);
    }, [playerPos]);

    const showFeedback = (msg) => { setFeedbackMsg(msg); setTimeout(() => setFeedbackMsg(null), 2500); };

    // Mini-game handlers
    const handleDragStart = (e, qr) => { setDraggedQR(qr); e.dataTransfer.effectAllowed = 'move'; };
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e, bucket) => {
        e.preventDefault();
        if (!draggedQR) return;
        if (bucket === 'safe') setSafeBucket(prev => [...prev, draggedQR]);
        else setScamBucket(prev => [...prev, draggedQR]);
        setDraggedQR(null);
    };

    const FeedbackToast = () => feedbackMsg ? (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[500] bg-amber-500 text-black font-black px-10 py-4 rounded-full shadow-[0_0_30px_rgba(245,158,11,0.5)] animate-bounce text-xl border-4 border-black">
            {feedbackMsg}
        </div>
    ) : null;

    // MARKET WALK STATE
    // ═══════════════════════════════════════════
    if (gameState === 'market_walk') {
        const currentRoomWidth = Math.max(ROOM_WIDTH, window.innerWidth);
        const cameraX = Math.max(0, Math.min(playerPos.x - window.innerWidth / 2, currentRoomWidth - window.innerWidth));
        return (
            <div className="w-full h-full flex flex-col bg-[#7fc2ed] overflow-hidden relative font-sans">
                <FeedbackToast />

                <div className="relative flex-1" style={{ width: currentRoomWidth, transform: `translateX(${-cameraX}px)`, transition: 'transform 0.1s linear' }}>

                    {/* The Full Reference Background Image */}
                    <div className="absolute top-0 left-0 w-full h-full z-0">
                        <img src="/assets/market_bg.png" alt="Kailash Market" className="w-full h-full object-[100%_100%]" style={{ objectFit: 'fill' }} />
                    </div>

                    {/* Talk Bubble floating over the left-center vendor in the image (raised higher) */}
                    <div className="absolute z-20" style={{ left: 900, bottom: 420 }}>
                        <div className="absolute -top-12 -right-28 bg-white text-black font-black text-[12px] px-3 py-2 rounded-[20px] border-2 border-slate-700 shadow-md z-50 whitespace-nowrap animate-[bounce_2.5s_infinite]">
                            "Fresh veggies! Come here!"
                            <div className="absolute bottom-[-6px] left-6 w-3 h-3 bg-white border-b-2 border-r-2 border-slate-700 transform rotate-45"></div>
                        </div>
                    </div>

                    {/* Interactive Overlay Zones on top of image (Optional / if needed for clicks) */}
                    {/* (Seafood stall area based on image) */}
                    <div className="absolute w-[400px] h-[300px] right-[100px] bottom-[100px] z-10 group cursor-pointer">
                        <div className="absolute -top-12 left-12 bg-white text-black font-black text-[12px] px-3 py-2 rounded-[20px] border-2 border-slate-700 shadow-md z-50 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            "Fresh catch! Scan QR here!"
                            <div className="absolute bottom-[-6px] left-6 w-3 h-3 bg-white border-b-2 border-r-2 border-slate-700 transform rotate-45"></div>
                        </div>
                    </div>

                    {/* Adjusted Player Position with scale trick for pseudo-3D depth */}
                    <div className="absolute z-30" style={{
                        left: playerPos.x,
                        top: playerPos.y,
                        transform: `scale(${0.6 + (playerPos.y / ROOM_HEIGHT) * 0.4})`,
                        transformOrigin: 'bottom center',
                        transition: 'scale 0.1s linear'
                    }}>
                        <Player x={0} y={0} />
                    </div>

                    {/* Premium Interaction UI - Triggered when near Selvi */}
                    {canInteract && (
                        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
                            <button className="bg-white border-2 border-slate-800 text-slate-800 pl-4 pr-10 py-3 rounded-full font-black shadow-[0_5px_0_#1e293b] flex items-center gap-6 group hover:translate-y-1 hover:shadow-[0_2px_0_#1e293b] transition-all" onClick={() => setGameState('dialogue')}>
                                <div className="bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-inner border-2 border-slate-800 group-hover:scale-110 transition-transform">E</div>
                                <span className="text-xl uppercase tracking-widest font-mono">Talk to Selvi</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Clean HUD Overlay */}
                <div className="absolute top-8 left-8 z-50 bg-white/95 p-4 rounded-3xl border-2 border-slate-800 shadow-[0_4px_0_#1e293b] flex items-center gap-4">
                    <div className="w-10 h-10 bg-sky-100 rounded-lg border-2 border-slate-800 flex items-center justify-center text-xl shadow-inner">🏪</div>
                    <div>
                        <h3 className="text-slate-900 font-black text-lg uppercase tracking-wide">Level 4: QR Scams</h3>
                        <p className="text-slate-500 text-[10px] font-bold font-mono">KAILASH ROAD MARKET</p>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // DIALOGUE WITH SELVI
    // ═══════════════════════════════════════════
    if (gameState === 'dialogue') {
        return (
            <div className="w-full h-full flex items-center justify-center p-12 relative overflow-hidden">
                {/* Background Blur */}
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-0"></div>

                <div className="z-10 w-full max-w-6xl flex gap-12 items-end animate-in slide-in-from-bottom-20 duration-500">
                    {/* Portrait Character */}
                    <div className="w-[500px] h-[700px] flex-shrink-0 relative flex items-center justify-center">
                        <img src="/assets/selvi_portrait.png" alt="Selvi" className="w-[80%] h-auto object-contain drop-shadow-2xl" />
                        {/* Name Tag */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-4 py-2 rounded-full font-black text-sm border-2 border-black">
                            SELVI AKKA
                        </div>
                    </div>

                    {/* Dialogue Box */}
                    <div className="flex-1 bg-white/5 backdrop-blur-2xl border-4 border-white/10 rounded-[3rem] p-12 shadow-3xl mb-12 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <h2 className="text-amber-500 font-black text-4xl uppercase italic tracking-tighter">Selvi</h2>
                                <span className="bg-amber-500/10 text-amber-500 px-4 py-1 rounded-full text-sm font-black uppercase tracking-widest border border-amber-500/20">Market Vendor</span>
                            </div>
                            <p className="text-white text-3xl leading-snug font-serif italic text-slate-100">
                                "Rajan sir's grandson ah? Good boy you are. He always paid on time, very honest man. Please scan here sir — new digital payment. My son set it up last week. Very easy, no cash needed!"
                            </p>
                        </div>
                        <div className="flex justify-end gap-6 mt-12">
                            <button className="bg-white/10 hover:bg-white/20 text-white/60 px-10 py-5 rounded-2xl font-black text-xl transition-all" onClick={() => setGameState('market_walk')}>MAYBE LATER</button>
                            <button className="bg-amber-500 hover:bg-amber-400 text-black px-16 py-5 rounded-2xl font-black text-2xl shadow-[0_15px_40px_rgba(245,158,11,0.4)] transition-transform hover:scale-105 active:scale-95" onClick={() => setGameState('qr_scan')}>
                                OK, SCAN QR 📱
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // SCANNER & SCAN RESULT
    // ═══════════════════════════════════════════
    // ═══════════════════════════════════════════
    // SCANNER CAMERA (Initial focus)
    // ═══════════════════════════════════════════
    if (gameState === 'qr_scan') {
        return (
            <div className="w-full h-full bg-[#1a1c1e] flex items-center justify-center p-8">
                <FeedbackToast />
                {/* Background market elements */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url("${MARKET_BKG}")`, backgroundSize: 'cover' }}></div>

                {/* iPhone Shape Container */}
                <div className="w-[420px] h-[860px] bg-black rounded-[4rem] p-4 relative shadow-[0_50px_100px_rgba(0,0,0,0.8)] border-[8px] border-zinc-800">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-black rounded-b-3xl z-50"></div>

                    {/* Phone Screen */}
                    <div className="w-full h-full bg-zinc-900 rounded-[3rem] overflow-hidden flex flex-col relative">
                        <div className="flex-1 bg-slate-900 flex flex-col">
                            <div className="p-8 pt-12 flex justify-between text-white/40 text-xs font-black">
                                <span>8:15 AM</span>
                                <div className="flex gap-2 font-mono"><span>5G</span><span>🔋 88%</span></div>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center p-12">
                                <div className="w-full aspect-square border-4 border-white/20 rounded-3xl relative overflow-hidden group cursor-pointer" onClick={() => setGameState('scan_result')}>
                                    <div className="absolute inset-0 flex flex-col gap-1 p-4 bg-white">
                                        {qrPattern.map((row, i) => (
                                            <div key={i} className="flex gap-1 flex-1">
                                                {row.map((filled, j) => (
                                                    <div key={j} className={`flex-1 ${filled ? 'bg-black' : 'bg-transparent'}`}></div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="absolute inset-0 bg-blue-500/20 group-hover:bg-blue-500/0 transition-colors"></div>
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan"></div>
                                </div>
                                <p className="text-white font-black text-center mt-8 uppercase tracking-widest text-sm opacity-60">Focus on the QR code</p>
                            </div>
                            <button className="absolute bottom-12 left-1/2 -translate-x-1/2 w-20 h-20 bg-white/20 border-4 border-white/40 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform" onClick={() => setGameState('scan_result')}>
                                <div className="w-16 h-16 bg-white rounded-full"></div>
                            </button>
                        </div>
                    </div>
                </div>

                <style>{`
                    @keyframes scan { 0% { top: 0; } 100% { top: 100%; } }
                    .animate-scan { animation: scan 3s infinite linear; }
                `}</style>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // SCAN RESULT & EVIDENCE BOARD (Unified)
    // ═══════════════════════════════════════════
    if (gameState === 'scan_result') {
        // Red circle markup for found clues
        const RedCircle = () => (
            <svg className="absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)] pointer-events-none drop-shadow-md z-50 animate-in zoom-in duration-300" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M50 5C20 8 5 30 10 60C15 90 40 95 70 90C95 85 95 40 80 15C65 -5 30 5 50 15" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
                    style={{ strokeDasharray: 300, strokeDashoffset: 0, animation: 'dash 0.5s ease-out forwards' }} />
            </svg>
        );

        const foundDeviceClues = cluesFound.filter(id => id !== 2 && id !== 6);
        const allCluesCollected = foundDeviceClues.length >= 4;

        return (
            <div className="w-full h-full bg-[#1a1c1e] flex items-center justify-center p-8 gap-12 overflow-hidden relative font-sans">
                <FeedbackToast />

                {/* Background market elements */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url("${MARKET_BKG}")`, backgroundSize: 'cover' }}></div>

                {/* 
                 * ==========================================
                 * LEFT SIDE: THE PHONE / SCANNED QR CONTEXT
                 * (Scaled down significantly to be less intrusive)
                 * ==========================================
                 */}
                <div className="w-[336px] h-[688px] relative flex-shrink-0 animate-in slide-in-from-left duration-500">
                    <div className="w-[420px] h-[860px] bg-black rounded-[4rem] p-4 relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-[8px] border-zinc-800 origin-top-left scale-[0.8]">
                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-black rounded-b-3xl z-50"></div>

                        {/* Screen */}
                        <div className="w-full h-full bg-slate-50 rounded-[3rem] overflow-hidden flex flex-col relative pt-8">

                            {/* Status Bar */}
                            <div className="px-8 pb-4 flex justify-between text-slate-400 text-xs font-black">
                                <span>8:15 AM</span>
                                <div className="flex gap-2 font-mono"><span>5G</span><span>🔋 88%</span></div>
                            </div>

                            {/* UPI App Header */}
                            <div className="bg-[#1c2128] p-8 pt-6 flex flex-col gap-4">
                                <div className="flex justify-between items-center">
                                    <div className="bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs">UPI</div>
                                    <button className="text-white/40 font-black text-sm hover:text-white" onClick={() => setGameState('market_walk')}>CANCEL</button>
                                </div>
                                <div>
                                    <h4 className="text-white/60 font-black text-[10px] uppercase tracking-widest">Transaction Status</h4>
                                    <h3 className="text-white text-xl font-black">APPROVAL REQUIRED</h3>
                                </div>
                            </div>

                            {/* Main Interaction Area */}
                            <div className="flex-1 p-6 flex flex-col gap-6 relative">
                                {/* Clue 1: COLLECT REQUEST warning */}
                                <div onClick={() => { if (!cluesFound.includes(1)) { setCluesFound(p => [...p, 1]); showFeedback("🔍 Collect Request Found!") } }}
                                    className="relative group cursor-pointer transition-transform hover:scale-[1.02]">
                                    <div className="bg-red-500 text-white p-5 rounded-3xl shadow-lg border-b-4 border-red-700">
                                        <h5 className="font-black text-[10px] uppercase tracking-widest opacity-80 decoration-white/20 underline underline-offset-4">Alert!</h5>
                                        <p className="text-xl font-bold mt-1">COLLECT REQUEST</p>
                                        <p className="text-[10px] font-medium opacity-80 mt-1 italic">Authorized money will be DEBITED from your account</p>
                                    </div>
                                    {cluesFound.includes(1) && <RedCircle />}
                                </div>

                                <div className="space-y-4">
                                    {/* Clue 4: Unknown UPI ID */}
                                    <div onClick={() => { if (!cluesFound.includes(4)) { setCluesFound(p => [...p, 4]); showFeedback("🔍 Unknown UPI ID!") } }}
                                        className="relative p-4 rounded-2xl border-2 bg-white border-slate-100 hover:border-slate-300 cursor-pointer transition-transform hover:scale-[1.02] group">
                                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Requested From</p>
                                        <p className="text-slate-900 font-mono font-bold">9944XXXXX@paytm</p>
                                        {cluesFound.includes(4) && <RedCircle />}
                                    </div>

                                    {/* Clue 5: Missing Name / Suspicious Merchant details */}
                                    <div onClick={() => { if (!cluesFound.includes(5)) { setCluesFound(p => [...p, 5]); showFeedback("🔍 Suspicious Merchant!") } }}
                                        className="relative p-4 rounded-2xl border-2 bg-white border-slate-100 hover:border-slate-300 cursor-pointer transition-transform hover:scale-[1.02] group">
                                        <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Merchant Details</p>
                                        <p className="text-slate-900 font-mono font-bold">unknown_collector@oksbi</p>
                                        {cluesFound.includes(5) && <RedCircle />}
                                    </div>
                                </div>

                                {/* Clue 3: The ₹1 Trap (Amount) */}
                                <div className="flex-1 flex flex-col items-center justify-center border-y-2 border-dashed border-slate-200 py-6 relative">
                                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Amount Request</p>
                                    <div onClick={() => { if (!cluesFound.includes(3)) { setCluesFound(p => [...p, 3]); showFeedback("🔍 The ₹1 Trap Spotted!") } }}
                                        className="relative cursor-pointer transition-transform hover:scale-110 group p-2">
                                        <div className="text-6xl font-black text-slate-900 font-mono">
                                            ₹1.00
                                        </div>
                                        {cluesFound.includes(3) && <RedCircle />}
                                    </div>
                                </div>

                                {/* Safe/Danger Actions (Shown only after clues found) */}
                                {allCluesCollected ? (
                                    <div className="space-y-3 pt-4 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-black py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95 text-xl" onClick={() => setGameState('correct_path')}>
                                            DECLINE PAYMENT (SAFE)
                                        </button>
                                        <button className="w-full bg-[#1c2128] hover:bg-black text-white py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95" onClick={() => setGameState('pin_entry')}>
                                            APPROVE & ENTER PIN
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3 pt-4 relative z-10 flex flex-col">
                                        <div className="w-full border-2 border-dashed border-slate-400 text-slate-400 py-4 rounded-2xl font-black text-center text-sm animate-pulse bg-slate-100">
                                            COLLECT ALL 4 CLUES ON SCREEN TO DECIDE
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 
                 * ==========================================
                 * RIGHT SIDE: THE CASE EVIDENCE BOARD
                 * (Scaled down significantly)
                 * ==========================================
                 */}
                <div className="flex-1 max-w-4xl h-[700px] bg-[#2d1810] rounded-[2rem] border-8 border-[#5d4037] p-8 flex flex-col relative overflow-hidden shadow-2xl animate-in slide-in-from-right duration-700">
                    {/* Board Texture */}
                    <div className="absolute inset-0 z-0 opacity-30 mix-blend-overlay pointer-events-none" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23a)' opacity='.2'/%3E%3C/svg%3E")`,
                        backgroundColor: '#8d6e63'
                    }}></div>

                    {/* Header */}
                    <div className="relative z-10 flex justify-between items-center bg-black/40 p-5 rounded-2xl backdrop-blur-md border border-white/10 mb-6">
                        <div>
                            <h2 className="text-amber-400 font-black text-3xl uppercase italic tracking-tighter drop-shadow-md">
                                🔍 INVESTIGATION BOARD
                            </h2>
                            <p className="text-amber-200/60 font-black tracking-widest uppercase text-xs mt-1">Tap suspicious details on the phone to uncover evidence</p>
                        </div>
                        <div className="text-right">
                            <div className="text-amber-500 font-black text-2xl">{foundDeviceClues.length} / {CLUE_DATA.length - 2}</div>
                            <div className="text-white/50 text-[9px] uppercase tracking-widest">Clues Found</div>
                        </div>
                    </div>

                    {/* Evidence Grid Layout */}
                    <div className="relative z-10 flex-1 grid grid-cols-2 gap-4 overflow-y-auto custom-scrollbar pr-2 pb-4">
                        {/* We filter out clues 2 and 6 as they relate to physical QR inspection in the NEXT stage */}
                        {CLUE_DATA.filter(c => c.id !== 2 && c.id !== 6).map((clue, idx) => {
                            const found = cluesFound.includes(clue.id);
                            // Slight random rotations for polaroid/note effect
                            const rotation = (idx % 2 === 0 ? 1 : -1) * (1 + (idx % 3));

                            return (
                                <div key={clue.id}
                                    className={`relative p-5 rounded-xl transition-all duration-700 ${found ? 'scale-100 opacity-100' : 'scale-95 opacity-50 grayscale blur-[1px]'}`}
                                    style={{
                                        backgroundColor: found ? clue.noteColor : '#d6d3d1',
                                        transform: found ? `rotate(${rotation}deg)` : 'rotate(0deg)',
                                        boxShadow: found ? '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)' : 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
                                        border: found ? '1px solid rgba(0,0,0,0.1)' : '2px dashed #a8a29e'
                                    }}>

                                    {/* Tape / Pin */}
                                    {found && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-5 bg-white/50 backdrop-blur-sm shadow-sm rotate-[-2deg] border border-white/60"></div>
                                    )}

                                    <h4 className={`font-black text-sm mb-2 pb-1 border-b ${found ? 'text-slate-900 border-slate-900/20' : 'text-slate-500 border-slate-400'}`}>
                                        {found ? clue.title : `LOCKED FILE #${idx + 1}`}
                                    </h4>
                                    <p className={`text-xs leading-relaxed font-serif ${found ? 'text-slate-800' : 'text-slate-500 italic'}`}>
                                        {found ? clue.desc : "Tap the corresponding suspicious element on the phone screen to unlock this evidence."}
                                    </p>

                                    {found && (
                                        <div className="mt-4 flex items-center justify-between opacity-50">
                                            <div className="text-[8px] font-black font-mono uppercase tracking-widest">EVID-REF:{clue.id}00</div>
                                            <div className="w-2 h-2 bg-red-600 rounded-full shadow-[0_0_5px_rgba(220,38,38,0.8)]"></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <style>{`
                    @keyframes dash { to { stroke-dashoffset: 0; } }
                    .animate-in svg path { stroke-dashoffset: 300; animation: dash 0.6s ease-out forwards; }
                `}</style>
            </div>
        );
    }

    // // ═══════════════════════════════════════════
    // PIN ENTRY (Scam path)
    // ═══════════════════════════════════════════
    if (gameState === 'pin_entry') {
        const handlePinDigit = (digit) => {
            const next = pinInput + digit;
            setPinInput(next);
            if (next.length >= 4) {
                setTimeout(() => {
                    setPinInput('');
                    setGameState('scam_sequence');
                }, 400);
            }
        };
        return (
            <div className="w-full h-full bg-[#1a1c1e] flex items-center justify-center p-8">
                <div className="w-[336px] h-[688px] relative flex-shrink-0">
                    <div className="w-[420px] h-[860px] bg-black rounded-[4rem] p-4 relative shadow-[0_50px_100px_rgba(0,0,0,0.8)] border-[8px] border-zinc-800 origin-top-left scale-[0.8]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-black rounded-b-3xl z-50"></div>
                        <div className="w-full h-full bg-zinc-900 rounded-[3rem] overflow-hidden flex flex-col relative">
                            <div className="bg-[#1c2128] p-8 pt-14 text-center">
                                <h3 className="text-white text-2xl font-black uppercase">Enter UPI PIN</h3>
                                <p className="text-white/40 text-xs mt-2 font-mono">Authorize collect request of ₹1.00</p>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center gap-10 p-8">
                                <div className="flex gap-4">
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={i} className={`w-16 h-16 rounded-2xl border-4 flex items-center justify-center text-3xl font-black transition-all ${i < pinInput.length ? 'bg-white border-white text-black' : 'bg-transparent border-white/20 text-transparent'
                                            }`}>
                                            {i < pinInput.length ? '•' : ''}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-3 gap-4 w-full max-w-[300px]">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((d, i) => (
                                        d === '' ? <div key={i}></div> :
                                            d === '⌫' ? (
                                                <button key={i} className="h-16 bg-white/5 rounded-2xl text-white/40 font-black text-xl hover:bg-white/10 transition-all active:scale-90"
                                                    onClick={() => setPinInput(p => p.slice(0, -1))}>{d}</button>
                                            ) : (
                                                <button key={i} className="h-16 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-black text-2xl transition-all active:scale-90 shadow-lg"
                                                    onClick={() => handlePinDigit(String(d))}>{d}</button>
                                            )
                                    ))}
                                </div>
                            </div>
                            <button className="mx-8 mb-8 bg-white/5 text-white/30 py-4 rounded-2xl font-black transition-all hover:bg-white/10" onClick={() => setGameState('scan_result')}>CANCEL</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // SCAM SEQUENCE (If Player Enters PIN)
    // ═══════════════════════════════════════════


    // ═══════════════════════════════════════════
    // CORRECT PATH (Alerting Selvie)
    // ═══════════════════════════════════════════
    if (gameState === 'correct_path') {
        const hasVerifiedBoard = inspectedZones.includes(20);

        return (
            <div className="w-full h-full bg-[#0a0c10] flex items-center justify-center p-10 overflow-hidden relative">
                <FeedbackToast />
                {/* Background market elements */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url("${MARKET_BKG}")`, backgroundSize: 'cover' }}></div>

                <div className="w-full max-w-6xl bg-white/5 backdrop-blur-3xl rounded-[3rem] border-4 border-emerald-500/30 shadow-3xl overflow-hidden flex flex-col p-12 pb-8 animate-in zoom-in-95 duration-500 h-[720px]">
                    <div className="flex items-center gap-6 mb-8 flex-shrink-0">
                        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-4xl shadow-[0_0_50px_rgba(16,185,129,0.4)] border-4 border-black/20">🛡️</div>
                        <div>
                            <h2 className="text-emerald-400 font-black text-5xl uppercase italic tracking-tighter drop-shadow-lg">Fraud Prevented</h2>
                            <p className="text-slate-400 font-black text-lg uppercase tracking-widest mt-1">
                                {hasVerifiedBoard ? "STOLEN IDENTITY EXPOSED" : "YOU CANCELLED THE COLLECT REQUEST!"}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-12 overflow-y-auto pr-4 custom-scrollbar">
                        {/* Action Steps */}
                        <div className="space-y-6">
                            {/* Step 1: Cancel */}
                            <div className="p-6 rounded-[2rem] bg-emerald-900/20 border-2 border-emerald-500/50">
                                <h4 className="font-black text-xl mb-2 uppercase tracking-tighter text-emerald-400">✓ Step 1: Cancel & Question</h4>
                                <p className="text-slate-300 leading-relaxed text-sm">
                                    You tapped CANCEL on the collect request. You asked Selvi for her registered UPI ID: 'selvi.vegetables@oksbi'. The scanned ID was a random number.
                                </p>
                            </div>

                            {/* Step 2: Physical Inspection */}
                            <div className={`p-6 rounded-[2rem] transition-all border-4 ${hasVerifiedBoard ? 'bg-emerald-500 text-black border-transparent shadow-[0_10px_30px_rgba(16,185,129,0.3)]' : 'bg-white/5 border-white/10'}`}>
                                <h4 className="font-black text-xl mb-2 uppercase tracking-tighter">
                                    {hasVerifiedBoard ? '✓ Step 2: Sticker Removed' : 'Step 2: Inspect Physical QR'}
                                </h4>
                                <p className={`text-sm leading-relaxed ${hasVerifiedBoard ? 'text-black/80' : 'text-slate-400'}`}>
                                    Look for tampered stickers on Selvi's payment board to prove the scam to her.
                                </p>
                                {!hasVerifiedBoard && (
                                    <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl mt-4 text-sm shadow-xl transition-all active:scale-95"
                                        onClick={() => {
                                            setInspectedZones(prev => [...prev, 20]);
                                            setCluesFound(prev => [...new Set([...prev, 2, 6])]);
                                            showFeedback("🔍 Fake Sticker Found & Removed!")
                                        }}>
                                        PHYSICALLY EXAMINE SELVI'S BOARD 🔍
                                    </button>
                                )}
                            </div>

                            {/* Step 3: Correct Payment */}
                            <div className={`p-6 rounded-[2rem] transition-all border-4 ${hasVerifiedBoard && stickerPeeled ? 'bg-blue-500 text-white border-transparent shadow-[0_10px_30px_rgba(59,130,246,0.3)]' : 'bg-white/5 border-white/10 opacity-50'}`}>
                                <h4 className="font-black text-xl mb-2 uppercase tracking-tighter">
                                    {stickerPeeled ? '✓ Step 3: Payment Sent' : 'Step 3: Pay Correctly'}
                                </h4>
                                <p className={`text-sm leading-relaxed ${stickerPeeled ? 'text-white/80' : 'text-slate-400'}`}>
                                    Open BHIM app manually, type 'selvi.vegetables@oksbi', enter ₹150, confirm with PIN.
                                </p>
                                {hasVerifiedBoard && !stickerPeeled && (
                                    <button className="w-full bg-blue-500 hover:bg-blue-400 text-white font-black py-4 rounded-xl mt-4 text-sm shadow-xl transition-all active:scale-95"
                                        onClick={() => {
                                            setStickerPeeled(true);
                                            showFeedback("💸 ₹150 Sent Safely!")
                                        }}>
                                        MANUALLY PAY IN BHIM APP ✨
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Dialogue/Scene Overlay */}
                        <div className="bg-black/40 border-4 border-white/5 rounded-[2.5rem] p-8 relative flex flex-col justify-between overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
                            <div className="space-y-6 relative z-10 w-full">
                                <p className="text-white/30 font-black text-[10px] uppercase tracking-[0.4em] mb-2 border-b border-white/10 pb-2">Dialogue Log</p>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0 animate-pulse"></div>
                                        <p className="text-slate-300 text-lg font-serif italic">"Selvi akka, your QR code is asking me to COLLECT money. This is a scam! What is the UPI ID your son gave you?"</p>
                                    </div>
                                    <div className="flex gap-4 animate-in slide-in-from-left duration-500 delay-200">
                                        <div className="w-10 h-10 border-2 border-amber-500/50 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-amber-900/30">
                                            <img src="/assets/selvi_portrait.png" className="w-full h-full object-cover opacity-80" alt="Selvi" />
                                        </div>
                                        <p className="text-amber-500 text-lg font-serif italic font-bold">"He said it is 'selvi.vegetables@oksbi'. Why? What happened sir?"</p>
                                    </div>

                                    {hasVerifiedBoard && (
                                        <div className="flex gap-4 animate-in slide-in-from-right duration-500">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0"></div>
                                            <p className="text-emerald-400/90 text-lg font-serif italic">"Look, someone pasted a fake sticker over yours. The scanner was reading '9944XXXXX@paytm'."</p>
                                        </div>
                                    )}

                                    {stickerPeeled && (
                                        <div className="flex gap-4 animate-in slide-in-from-left duration-500">
                                            <div className="w-10 h-10 border-2 border-amber-500/50 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-amber-900/30">
                                                <img src="/assets/selvi_portrait.png" className="w-full h-full object-cover opacity-80" alt="Selvi" />
                                            </div>
                                            <p className="text-amber-500 text-lg font-serif italic font-bold">"Aiyo! Thank you, grandson! I will share a photo of this fake sticker on the market WhatsApp group immediately to warn others!"</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {stickerPeeled && (
                                <div className="mt-8 animate-in fade-in duration-500">
                                    <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 mb-4 text-center">
                                        <p className="text-emerald-400 font-black text-sm uppercase tracking-widest">🎖️ Cyber Safety Score: +30</p>
                                        <p className="text-emerald-200 text-xs mt-1">Market Sentinel Achievement Unlocked</p>
                                    </div>
                                    <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-xl shadow-[0_10px_30px_rgba(16,185,129,0.4)] animate-pulse"
                                        onClick={() => completeLevel(4, 30)}>
                                        COMPLETE LEVEL ➔
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // MINI GAME (QR SORTING Overhaul)
    if (gameState === 'mini_game') {
        const unassignedQRs = MINI_GAME_QRS.filter(q => !safeBucket.find(s => s.id === q.id) && !scamBucket.find(s => s.id === q.id));
        const isComplete = unassignedQRs.length === 0;

        const checkMiniGame = () => {
            const safeOk = safeBucket.every(q => q.safe);
            const scamOk = scamBucket.every(q => !q.safe);
            if (safeOk && scamOk) setMiniGameOver(true);
            else {
                showFeedback("❌ Misplaced transactions! Try again.");
                setSafeBucket([]);
                setScamBucket([]);
            }
        };

        return (
            <div className="w-full h-full bg-[#0a0c10] flex flex-col items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.2)_0%,transparent_70%)]"></div>

                <div className="z-10 w-full max-w-7xl bg-white/5 backdrop-blur-3xl p-16 rounded-[4rem] border-4 border-white/10 shadow-3xl">
                    <div className="text-center mb-16">
                        <h2 className="text-white font-black text-6xl uppercase tracking-[0.2em] mb-4 italic drop-shadow-lg">SENTINEL TRAINING</h2>
                        <p className="text-slate-400 text-2xl font-black uppercase tracking-widest opacity-60">Sort transactions into correct security buckets</p>
                    </div>

                    {!miniGameOver ? (
                        <>
                            <div className="flex flex-wrap gap-8 justify-center mb-20 min-h-[220px]">
                                {unassignedQRs.map(qr => (
                                    <div key={qr.id} draggable onDragStart={(e) => handleDragStart(e, qr)}
                                        className="w-64 bg-white/90 p-8 rounded-[2.5rem] shadow-3xl cursor-grab active:cursor-grabbing hover:scale-110 transition-all hover:rotate-2 group">
                                        <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center font-black text-2xl mb-6 shadow-inner">QR {qr.id}</div>
                                        <h4 className="text-slate-900 font-black text-lg uppercase tracking-tight mb-2 group-hover:text-indigo-600 transition-colors">{qr.title}</h4>
                                        <p className="text-slate-500 text-sm font-bold leading-relaxed">{qr.desc}</p>
                                    </div>
                                ))}
                                {isComplete && <div className="text-emerald-400 font-black text-4xl animate-pulse uppercase tracking-widest drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]">All Validated! Verify results.</div>}
                            </div>

                            <div className="flex justify-center gap-16 w-full px-12">
                                <div className="flex-1 border-[6px] border-dashed border-emerald-500/20 bg-emerald-500/5 rounded-[3.5rem] p-12 min-h-[350px] flex flex-col items-center group transition-colors hover:border-emerald-500/40"
                                    onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'safe')}>
                                    <h3 className="text-emerald-500 font-black uppercase text-2xl mb-8 tracking-[0.3em] flex items-center gap-4">
                                        <span className="w-4 h-4 bg-emerald-500 rounded-full animate-ping"></span>
                                        LEGIT PAYMENTS
                                    </h3>
                                    <div className="w-full space-y-4">
                                        {safeBucket.map(q => (
                                            <div key={q.id} className="bg-emerald-500 text-white p-6 rounded-3xl font-black text-lg shadow-2xl animate-in zoom-in duration-300 border-b-4 border-emerald-700">{q.title}</div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-1 border-[6px] border-dashed border-red-500/20 bg-red-500/5 rounded-[3.5rem] p-12 min-h-[350px] flex flex-col items-center group transition-colors hover:border-red-500/40"
                                    onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'scam')}>
                                    <h3 className="text-red-500 font-black uppercase text-2xl mb-8 tracking-[0.3em] flex items-center gap-4">
                                        <span className="w-4 h-4 bg-red-500 rounded-full animate-ping"></span>
                                        SCAN SCAMS
                                    </h3>
                                    <div className="w-full space-y-4">
                                        {scamBucket.map(q => (
                                            <div key={q.id} className="bg-red-500 text-white p-6 rounded-3xl font-black text-lg shadow-2xl animate-in zoom-in duration-300 border-b-4 border-red-700">{q.title}</div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {isComplete && (
                                <button className="mt-20 bg-white text-black font-black px-24 py-8 rounded-[2.5rem] text-3xl shadow-[0_20px_80px_rgba(255,255,255,0.2)] transition-all hover:scale-110 active:scale-95 uppercase tracking-[0.2em]" onClick={checkMiniGame}>
                                    Validate Security →
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-24 animate-in zoom-in duration-700">
                            <div className="text-[10rem] mb-12 drop-shadow-[0_0_50px_rgba(245,158,11,0.5)]">🏅</div>
                            <h2 className="text-4xl font-black text-white/40 uppercase tracking-[0.4em] mb-4 italic">Achievement Unlocked</h2>
                            <h3 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-500 to-amber-800 uppercase tracking-[0.1em] mb-16 leading-tight">MARKET SENTINEL</h3>
                            <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-24 py-8 rounded-[2.5rem] text-4xl shadow-[0_30px_100px_rgba(16,185,129,0.4)] border-4 border-white/20 transition-all hover:-translate-y-2 active:scale-95"
                                onClick={() => completeLevel(true, 30 + (stickerPeeled ? 15 : 0), 0)}>
                                FINISH MISSION ➔
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // SCAM LOG (Premium Overhaul)
    // ═══════════════════════════════════════════
    if (gameState === 'scam_sequence') {
        const stolenAmount = 300000;
        return (
            <div className="w-full h-full bg-black flex flex-col items-center justify-center p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-red-600/5 animate-pulse"></div>

                <div className="z-10 w-full max-w-4xl bg-[#0a0c10] border-t-8 border-red-600 rounded-[3rem] p-16 shadow-[0_0_150px_rgba(220,38,38,0.4)] animate-in slide-in-from-bottom duration-500">
                    <div className="flex items-center gap-10 mb-12 pb-12 border-b border-white/5">
                        <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center text-6xl font-black shrink-0 shadow-[0_0_50px_rgba(220,38,38,0.8)] animate-bounce italic">!</div>
                        <div>
                            <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-2 underline decoration-red-600 decoration-8">CRITICAL BREACH</h1>
                            <p className="text-red-500 font-black font-mono text-lg uppercase tracking-[0.3em]">OUTGOING FINANCIAL FLOW DETECTED</p>
                        </div>
                    </div>

                    <div className="space-y-6 font-mono">
                        {[
                            { t: '08:17:23 AM', msg: 'Collect Approved: ₹1.00', status: 'PIN_CONFIRMED', color: 'text-slate-500' },
                            { t: '08:17:25 AM', msg: 'Auto-Processed: ₹1,50,000.00', status: 'DEBIT_SUCCESS', color: 'text-red-500' },
                            { t: '08:17:26 AM', msg: 'Auto-Processed: ₹1,50,000.00', status: 'DEBIT_SUCCESS', color: 'text-red-500' },
                            { t: '08:17:27 AM', msg: 'Insufficient Balance Rejection', status: 'DECLINED', color: 'text-slate-600' }
                        ].map((log, i) => (
                            <div key={i} className={`p-6 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center animate-in fade-in slide-in-from-right duration-500`} style={{ animationDelay: `${i * 200}ms` }}>
                                <div className="flex flex-col">
                                    <span className="text-white/20 text-xs font-black mb-1">{log.t}</span>
                                    <span className={`text-2xl font-black ${log.color}`}>{log.msg}</span>
                                </div>
                                <span className={`px-4 py-1 rounded-full text-[10px] font-black border uppercase tracking-widest ${log.color === 'text-red-500' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-white/5 border-white/10 text-white/40'}`}>
                                    {log.status}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 p-10 bg-red-600/10 rounded-[2.5rem] border-4 border-red-600/20 text-center shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #dc2626 25%, transparent 25%, transparent 50%, #dc2626 50%, #dc2626 75%, transparent 75%, transparent 100%)', backgroundSize: '10px 10px' }}></div>
                        <h2 className="text-red-500 text-2xl font-black mb-2 uppercase tracking-[0.5em]">LIVES AT RISK</h2>
                        <span className="text-8xl font-black text-white font-mono drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">-₹{stolenAmount.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="mt-12 grid grid-cols-2 gap-8">
                        <button className="bg-white/5 hover:bg-white/10 text-white/40 font-black py-6 rounded-2xl text-xl uppercase tracking-widest transition-all"
                            onClick={() => { adjustAssets(-stolenAmount); adjustLives(-1); setGameState('market_walk'); }}>
                            Accept Defeat
                        </button>
                        <button className="bg-red-600 hover:bg-red-500 text-white font-black py-6 rounded-2xl text-2xl shadow-[0_20px_60px_rgba(220,38,38,0.5)] uppercase tracking-widest animate-pulse border-4 border-white/10 transition-transform active:scale-95"
                            onClick={() => setGameState('recovery_screen')}>
                            🚨 CALL 1930 Helpline
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // RECOVERY SCREEN (Premium Overhaul)
    // ═══════════════════════════════════════════
    if (gameState === 'recovery_screen') {
        return (
            <div className="w-full h-full bg-[#0a0c10] flex items-center justify-center p-12 overflow-hidden relative">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_70%)]"></div>

                <div className="z-10 w-full max-w-4xl bg-white rounded-[4rem] p-16 shadow-[0_50px_100px_rgba(0,0,0,0.5)] text-center animate-in zoom-in duration-500">
                    <div className="w-32 h-32 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-6xl mx-auto mb-10 shadow-inner">⚡</div>
                    <h2 className="text-slate-900 font-black text-5xl uppercase tracking-tighter mb-4 italic">GOLDEN HOUR RECOVERY</h2>
                    <p className="text-slate-600 text-xl font-serif italic leading-relaxed mb-12 px-12 opacity-80">
                        "The 1930 Cyber Helpline initiated the 'Financial Fraud Reverse' protocol. Since you called within the first 30 minutes, there's a chance to freeze the funds in mule accounts."
                    </p>
                    <div className="bg-emerald-50 border-4 border-emerald-500/20 p-10 rounded-[3rem] mb-12 flex justify-between items-center shadow-inner">
                        <div className="text-left">
                            <h4 className="text-emerald-900 font-black uppercase text-sm tracking-widest mb-1">Recovery Protocol Success</h4>
                            <p className="text-emerald-600 text-5xl font-black font-mono mt-1">+₹1,50,000</p>
                        </div>
                        <div className="text-slate-300 w-px h-20 bg-emerald-500/20 mx-8"></div>
                        <div className="text-right">
                            <h4 className="text-slate-400 font-black uppercase text-sm tracking-widest mb-1">Remaining Loss</h4>
                            <p className="text-red-500 text-5xl font-black font-mono mt-1">-₹1,50,000</p>
                        </div>
                    </div>
                    <button className="w-full bg-slate-950 hover:bg-black text-white font-black py-8 rounded-[2.5rem] text-3xl shadow-3xl transition-all hover:scale-105 active:scale-95 uppercase tracking-widest"
                        onClick={() => { adjustAssets(150000); completeLevel(false, 0, 0); }}>
                        Accept & Continue →
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default Level4;
