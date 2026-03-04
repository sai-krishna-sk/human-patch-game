import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGameState } from '../context/GameStateContext';
import Player from '../components/Player';

// ═══ CONSTANTS ═══
const CLUE_DATA = [
    {
        id: 'domain_lookup',
        name: 'WHOIS Domain Record',
        description: 'Domain registered 19 days ago via offshore privacy proxy. Amazon.in is from 2010. 19-day-old domains selling discounted phones are scams.',
        points: 20
    },

    {
        id: 'contact_forensics',
        name: 'Business Identity Check',
        description: 'Free @gmail.com address, no landline, unverifiable address, and crucially: NO GSTIN number. Not a registered business.',
        points: 20
    },
    {
        id: 'fake_reviews',
        name: 'Review Pattern Analysis',
        description: 'Same day posting, identical sentence structure, default gray avatars, and generic names. 94% text similarity indicates bulk-generation.',
        points: 15
    },
    {
        id: 'payment_trap',
        name: 'Transaction Channel Risk',
        description: 'Direct UPI/NEFT to a personal "ybl" (PhonePe) account. No COD, no cards. Zero consumer protection or chargeback rights.',
        points: 25
    },
    {
        id: 'vague_policy',
        name: 'Return Policy Red Flag',
        description: '"45-60 working days" refund period is designed to stall consumers until the bank dispute window expires.',
        points: 15
    },

    {
        id: 'pressure_chat',
        name: 'Social Engineering Audit',
        description: 'Agent pushes artificial urgency ("Only 12 left!") and deflects questions about GST or card payments.',
        points: 20
    }
];

const Level8 = () => {
    const { completeLevel, adjustAssets, adjustLives } = useGameState();

    // ═══ STATE ═══
    const [gameState, setGameState] = useState('living-room'); // living-room, whatsapp, website, trust-score, outcome
    const [cluesFound, setCluesFound] = useState([]);
    const [showWhatsApp, setShowWhatsApp] = useState(false);
    const [activeClue, setActiveClue] = useState(null);
    const [feedbackMsg, setFeedbackMsg] = useState(null);
    const [showDetectiveBoard, setShowDetectiveBoard] = useState(false);
    const [isPhoneVibrating, setIsPhoneVibrating] = useState(false);
    const [scamProgress, setScamProgress] = useState(0); // For trust score meter
    const [outcomeType, setOutcomeType] = useState(null); // 'victory', 'scam'
    const [showChat, setShowChat] = useState(false);
    const [chatStep, setChatStep] = useState(0);
    const [trustScoreLogs, setTrustScoreLogs] = useState([]);

    // Movement State
    const [playerPos, setPlayerPos] = useState({ x: 750, y: 430 });
    const [keys, setKeys] = useState({});
    const [interactionActive, setInteractionActive] = useState(false);

    // ═══ HELPERS ═══
    const showFeedback = (msg, color = 'cyan') => {
        setFeedbackMsg({ text: msg, color });
        setTimeout(() => setFeedbackMsg(null), 3500);
    };

    const handleClueDiscovery = useCallback((clueId) => {
        if (cluesFound.some(c => c.id === clueId)) return;
        const clueDef = CLUE_DATA.find(c => c.id === clueId);

        // Calculate grid-based position to prevent stacking
        const gridPositions = [
            { x: 140, y: 160 },
            { x: 380, y: 200 },
            { x: 150, y: 380 },
            { x: 380, y: 400 },
            { x: 260, y: 550 },
            { x: 200, y: 280 },
            { x: 150, y: 500 },
            { x: 380, y: 500 }
        ];
        const pos = gridPositions[cluesFound.length % gridPositions.length];
        const x = pos.x + (Math.random() * 40 - 20);
        const y = pos.y + (Math.random() * 40 - 20);

        const newClue = {
            id: clueDef.id,
            title: clueDef.name,
            desc: clueDef.description,
            points: clueDef.points,
            x,
            y
        };

        setCluesFound(prev => [...prev, newClue]);
        setActiveClue(clueDef);
        setShowDetectiveBoard(true);
        showFeedback(`New Evidence: ${clueDef.name}`, 'emerald');
    }, [cluesFound]);

    useEffect(() => {
        // Initial phone vibration after 2 seconds
        const timer = setTimeout(() => {
            setIsPhoneVibrating(true);
            showFeedback("WhatsApp Notification from Aunty Priya", "indigo");
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

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
        if (gameState !== 'living-room' || showWhatsApp) return;

        let animationFrameId;
        const speed = 7;
        const ROOM_WIDTH = 1600;
        const ROOM_HEIGHT = 1100;

        const gameLoop = () => {
            setPlayerPos(prev => {
                let newX = prev.x;
                let newY = prev.y;

                if (keys['w'] || keys['arrowup']) newY -= speed;
                if (keys['s'] || keys['arrowdown']) newY += speed;
                if (keys['a'] || keys['arrowleft']) newX -= speed;
                if (keys['d'] || keys['arrowright']) newX += speed;

                // Simple boundaries matching the room walls
                newX = Math.max(120, Math.min(newX, ROOM_WIDTH - 120));
                newY = Math.max(120, Math.min(newY, ROOM_HEIGHT - 120));

                // Interaction zone for the phone on the central rug/sofa area
                const nearPhone = Math.abs(newX - 740) < 150 && Math.abs(newY - 550) < 150;
                setInteractionActive(nearPhone);

                return { x: newX, y: newY };
            });
            animationFrameId = requestAnimationFrame(gameLoop);
        };
        animationFrameId = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [keys, gameState, showWhatsApp]);

    // Handle Interaction Key 'E'
    useEffect(() => {
        if (keys['e'] && interactionActive && !showWhatsApp) {
            setIsPhoneVibrating(false);
            setShowWhatsApp(true);
            setKeys(k => ({ ...k, 'e': false }));
        }
    }, [keys, interactionActive, showWhatsApp]);

    // ═══ COMPONENTS ═══

    const LivingRoom = () => {
        const VIEWPORT_WIDTH = 1200;
        const VIEWPORT_HEIGHT = 800;
        const ROOM_WIDTH = 1600;
        const ROOM_HEIGHT = 1100;

        const cameraX = Math.max(0, Math.min(playerPos.x - VIEWPORT_WIDTH / 2, ROOM_WIDTH - VIEWPORT_WIDTH));
        const cameraY = Math.max(0, Math.min(playerPos.y - VIEWPORT_HEIGHT / 2, ROOM_HEIGHT - VIEWPORT_HEIGHT));

        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950 px-8 animate-in fade-in duration-1000">
                {/* Viewport Container */}
                <div
                    className="relative border-8 border-slate-900 shadow-2xl overflow-hidden font-sans bg-zinc-900"
                    style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}
                >
                    {/* World Container (Camera) */}
                    <div
                        className="absolute inset-0 transition-transform duration-100 ease-out"
                        style={{
                            width: ROOM_WIDTH,
                            height: ROOM_HEIGHT,
                            transform: `translate(${-cameraX}px, ${-cameraY}px)`,
                            backgroundColor: '#2c3e50'
                        }}
                    >

                        {/* Wood Floor (from Level 1) */}
                        <div className="absolute inset-0 opacity-80" style={{
                            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(0,0,0,0.2) 38px, rgba(0,0,0,0.2) 40px)'
                        }}></div>

                        {/* DOORS AND OPENINGS */}
                        {/* Top Double Door (Solid, no glass) */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[240px] h-[80px] bg-[#8a5a44] border-4 border-black border-t-0 flex z-10">
                            <div className="flex-1 border-r-2 border-black p-2 flex items-center justify-center">
                                <div className="w-[80px] h-[50px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                            </div>
                            <div className="flex-1 border-l-2 border-black p-2 flex items-center justify-center">
                                <div className="w-[80px] h-[50px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                            </div>
                            {/* Handles */}
                            <div className="absolute top-[40px] left-[110px] w-4 h-1 bg-black"></div>
                            <div className="absolute top-[40px] right-[110px] w-4 h-1 bg-black"></div>
                        </div>

                        {/* Bottom Door (Solid, no glass) */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[240px] h-[80px] bg-[#8a5a44] border-4 border-black border-b-0 flex z-10">
                            <div className="flex-1 border-r-2 border-black p-2 flex items-center justify-center">
                                <div className="w-[80px] h-[50px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                            </div>
                            <div className="flex-1 border-l-2 border-black p-2 flex items-center justify-center">
                                <div className="w-[80px] h-[50px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                            </div>
                            {/* Handles */}
                            <div className="absolute bottom-[40px] left-[110px] w-4 h-1 bg-black"></div>
                            <div className="absolute bottom-[40px] right-[110px] w-4 h-1 bg-black"></div>
                        </div>

                        {/* Right Single Door */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[60px] h-[180px] bg-[#8a5a44] border-4 border-black border-r-0 p-3 flex items-center z-10">
                            <div className="w-[30px] h-[140px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                            {/* Handle */}
                            <div className="absolute left-2 bottom-6 w-1 h-6 bg-black"></div>
                        </div>

                        {/* HORIZONTAL RED RUG (Left to Right) */}
                        <div className="absolute left-[180px] right-[120px] top-1/2 -translate-y-1/2 h-[260px] bg-[#cb3234] border-y-2 border-black flex justify-between items-center px-0 z-0">
                            {/* Left Fringes */}
                            <div className="flex flex-col justify-between h-[240px] -ml-2">
                                {[...Array(18)].map((_, i) => <div key={i} className="w-2 h-1 bg-black"></div>)}
                            </div>
                            {/* Right Fringes */}
                            <div className="flex flex-col justify-between h-[240px] -mr-2">
                                {[...Array(18)].map((_, i) => <div key={i} className="w-2 h-1 bg-black"></div>)}
                            </div>
                        </div>

                        {/* VERTICAL RED RUG (Top to Bottom) */}
                        <div className="absolute top-[80px] bottom-[80px] left-1/2 -translate-x-1/2 w-[260px] bg-[#cb3234] border-x-2 border-black flex flex-col justify-between items-center py-0 z-0">
                            {/* Top Fringes */}
                            <div className="flex justify-between w-[240px] -mt-2">
                                {[...Array(18)].map((_, i) => <div key={i} className="w-1 h-2 bg-black"></div>)}
                            </div>
                            {/* Bottom Fringes */}
                            <div className="flex justify-between w-[240px] -mb-2">
                                {[...Array(18)].map((_, i) => <div key={i} className="w-1 h-2 bg-black"></div>)}
                            </div>
                        </div>

                        {/* SINGLE SOFA (Right side, facing left towards TV) */}
                        <div className="absolute right-[480px] top-1/2 -translate-y-1/2 w-[140px] h-[320px] bg-[#445265] border-4 border-black flex flex-row items-center justify-start pr-4 pb-0 z-20 shadow-[0_20px_40px_rgba(0,0,0,0.6)]">
                            {/* Seating surface (left side of the component) */}
                            <div className="w-[80px] h-full flex flex-col justify-center items-start pl-2 gap-4">
                                <div className="w-[60px] h-[100px] bg-[#364253] border-2 border-black ml-2 mt-2"></div>
                                <div className="w-[60px] h-[100px] bg-[#364253] border-2 border-black ml-2 mb-2"></div>
                            </div>
                            {/* Backrest (right side of the component) */}
                            <div className="absolute right-0 top-0 bottom-0 w-[40px] bg-[#4a586e] border-l-[3px] border-black"></div>

                            {/* Armrests (top and bottom of the component) */}
                            <div className="absolute top-0 left-0 w-[100px] h-[30px] bg-[#4a586e] border-b-[3px] border-black"></div>
                            <div className="absolute bottom-0 left-0 w-[100px] h-[30px] bg-[#4a586e] border-t-[3px] border-black"></div>
                        </div>

                        {/* COFFEE TABLE */}
                        <div className="absolute left-[740px] top-1/2 -translate-y-1/2 w-[100px] h-[180px] bg-[#383a48]/90 backdrop-blur-md border-4 border-[#222938] z-20 shadow-xl flex items-center justify-center">
                            <div className="w-[80px] h-[160px] border border-white/10"></div>
                        </div>

                        {/* WARM LAMPS WITH TABLES */}
                        {/* Top/Right Lamp Table */}
                        <div className="absolute right-[410px] top-[330px] w-[50px] h-[50px] bg-[#383a48] border-2 border-black flex items-center justify-center z-10 shadow-[0_20px_30px_rgba(0,0,0,0.5)]">
                            <div className="w-6 h-6 bg-[#d98536] rounded-full border-2 border-[#ffb969] shadow-[0_0_20px_#ffeb3b,inset_0_0_10px_#fff] animate-pulse"></div>
                        </div>
                        {/* Bottom/Right Lamp Table */}
                        <div className="absolute right-[410px] bottom-[330px] w-[50px] h-[50px] bg-[#383a48] border-2 border-black flex items-center justify-center z-10 shadow-[0_20px_30px_rgba(0,0,0,0.5)]">
                            <div className="w-6 h-6 bg-[#d98536] rounded-full border-2 border-[#ffb969] shadow-[0_0_20px_#ffeb3b,inset_0_0_10px_#fff] animate-pulse"></div>
                        </div>

                        {/* LEFT WALL TV UNIT */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[180px] h-[340px] bg-[#222938] border-4 border-l-0 border-black flex items-center z-20 shadow-[20px_0_40px_rgba(0,0,0,0.6)]">
                            <div className="w-[120px] h-[260px] bg-[#1e4868] border-4 border-[#122336] ml-4 flex flex-col items-center justify-center relative overflow-hidden shadow-black">
                                {/* Glint on TV */}
                                <div className="w-[180px] h-[40px] bg-white/10 -rotate-45 absolute top-4 -left-8"></div>
                                <div className="w-[180px] h-[20px] bg-white/10 -rotate-45 absolute bottom-12 -left-8"></div>
                                {/* TV Screen Glow */}
                                <div className="absolute inset-x-0 bottom-0 h-[50%] bg-blue-500/20 blur-xl animate-pulse"></div>
                            </div>
                        </div>



                        {/* CORNER PLANTS */}
                        {/* Top Left */}
                        <div className="absolute left-[30px] top-[140px] w-[60px] h-[60px] bg-[#1d273a] rounded-full border-[3px] border-black flex items-center justify-center shadow-lg">
                            <div className="w-[44px] h-[44px] rounded-full bg-[#1b2f4f] flex items-center justify-center">
                                <div className="w-[60px] h-[10px] bg-[#3a6b57] rotate-45 absolute"></div>
                                <div className="w-[60px] h-[10px] bg-[#3a6b57] -rotate-45 absolute"></div>
                            </div>
                        </div>
                        {/* Top Right */}
                        <div className="absolute right-[30px] top-[140px] w-[60px] h-[60px] bg-[#1d273a] rounded-full border-[3px] border-black flex items-center justify-center shadow-lg">
                            <div className="w-[44px] h-[44px] rounded-full bg-[#1b2f4f] flex items-center justify-center">
                                <div className="w-[60px] h-[10px] bg-[#22c55e] rotate-45 absolute shadow-[0_0_10px_#22c55e]"></div>
                                <div className="w-[60px] h-[10px] bg-[#22c55e] border border-[#14532d] -rotate-45 absolute"></div>
                                <div className="w-[10px] h-[60px] bg-[#22c55e] absolute shadow-[0_0_10px_#22c55e]"></div>
                            </div>
                        </div>
                        {/* Bottom Left */}
                        <div className="absolute left-[30px] bottom-[140px] w-[60px] h-[60px] bg-[#1d273a] rounded-full border-[3px] border-black flex items-center justify-center shadow-lg">
                            <div className="w-[44px] h-[44px] rounded-full bg-[#1b2f4f] flex items-center justify-center">
                                <div className="w-[60px] h-[10px] bg-[#3a6b57] rotate-45 absolute"></div>
                                <div className="w-[60px] h-[10px] bg-[#3a6b57] -rotate-45 absolute"></div>
                                <div className="w-[10px] h-[60px] bg-[#3a6b57] absolute"></div>
                            </div>
                        </div>

                        {/* PHONE (Interacable area on the coffee table) */}
                        <div
                            className="absolute z-30"
                            style={{ left: 740, top: 550, transform: 'translate(-50%, -50%)' }}
                        >
                            <div
                                className={`w-[40px] h-[75px] bg-[#0f172a] rounded-[8px] border-[2px] border-slate-600 shadow-2xl cursor-pointer hover:scale-110 flex flex-col items-center justify-center transition-all ${isPhoneVibrating ? 'animate-[shake_0.5s_infinite] ring-2 ring-emerald-500' : 'hover:ring-2 hover:ring-cyan-500'}`}
                                onClick={() => {
                                    setIsPhoneVibrating(false);
                                    setShowWhatsApp(true);
                                }}
                            >
                                <div className="w-[12px] h-[2px] bg-slate-700 rounded-full absolute top-[3px]"></div>
                                <div className="flex-1 w-[32px] bg-slate-900 mt-2 mb-1 border border-slate-700 mx-[2px] flex items-center justify-center">
                                    {isPhoneVibrating ? (
                                        <div className="text-[12px] animate-pulse shadow-[0_0_10px_#22c55e] rounded-full">💬</div>
                                    ) : (
                                        <span className="text-white/40 text-[7px] font-black">19:29</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* INTERACTION HINT UI */}
                        {interactionActive && gameState === 'living-room' && !showWhatsApp && isPhoneVibrating && (
                            <div className="absolute z-30 pointer-events-none" style={{ left: playerPos.x, top: playerPos.y - 60 }}>
                                <div className="bg-white text-slate-900 px-3 py-1 rounded shadow-xl border-2 border-emerald-500 font-bold animate-bounce text-sm whitespace-nowrap">
                                    Press [E] to read message
                                </div>
                            </div>
                        )}
                        {interactionActive && gameState === 'living-room' && !showWhatsApp && !isPhoneVibrating && (
                            <div className="absolute z-30 pointer-events-none" style={{ left: playerPos.x, top: playerPos.y - 60 }}>
                                <div className="bg-white text-slate-900 px-3 py-1 rounded shadow-xl border-2 border-slate-500 font-bold text-sm whitespace-nowrap">
                                    Press [E] to check phone
                                </div>
                            </div>
                        )}

                        {/* THE PLAYER AVATAR */}
                        {gameState === 'living-room' && (
                            <div className="absolute z-40 transition-all duration-[50ms]" style={{ left: playerPos.x, top: playerPos.y, transform: 'translate(-50%, -50%)' }}>
                                <Player x={0} y={0} isFixed={true} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const WhatsAppThread = () => (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
            <div className="w-[450px] bg-[#075e54] rounded-[45px] shadow-[0_60px_150px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-10 py-10 flex items-center gap-6 bg-[#075e54]">
                    <button onClick={() => setShowWhatsApp(false)} className="text-white text-2xl hover:bg-white/10 w-10 h-10 rounded-full flex items-center justify-center transition-all">←</button>
                    <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/10">
                        <span className="text-3xl">👩‍🍳</span>
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-white font-black text-xl">Aunty Priya 💛</h3>
                        <span className="text-white/60 text-xs font-medium">Online</span>
                    </div>
                </div>

                {/* Chat Background */}
                <div className="flex-1 bg-[#e5ddd5] p-8 space-y-6 overflow-y-auto" style={{
                    backgroundImage: 'url("https://user-images.githubusercontent.com/1507727/101833400-33499000-3b4d-11eb-8283-bc7b9d6d23f3.png")',
                    backgroundSize: '400px'
                }}>
                    <div className="flex flex-col gap-4">
                        <div className="self-start max-w-[85%] bg-white p-4 rounded-r-2xl rounded-bl-2xl shadow-sm relative">
                            <div className="flex items-center gap-2 mb-2 text-[10px] text-slate-400 border-b border-slate-100 pb-1">
                                <span className="font-bold">Forwarded many times</span>
                            </div>
                            <p className="text-sm font-medium leading-relaxed">
                                AMAZING SALE!!! 🤯🔥 Buy Samsung S24 for only ₹4,999!!! Limited stock!! Only 47 left!!!
                                My neighbour bought two yesterday! I just ordered one for Karthik’s birthday!
                            </p>
                            <div
                                className="mt-4 p-4 bg-slate-50 border rounded-xl flex items-start gap-4 cursor-pointer hover:bg-slate-100 transition-all group"
                                onClick={() => {
                                    setGameState('website');
                                    setShowWhatsApp(false);
                                }}
                            >
                                <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center text-4xl">📱</div>
                                <div className="flex-1">
                                    <div className="text-[10px] text-blue-600 font-black uppercase tracking-widest mb-1">techdeals-india.shop</div>
                                    <div className="text-xs font-bold text-slate-800 group-hover:underline">Samsung Galaxy S24 Ultra - Flash Sale Live!</div>
                                    <div className="text-[10px] text-slate-400 mt-1 italic">Click now for 94% off...</div>
                                </div>
                            </div>
                            <div className="text-[10px] text-slate-400 text-right mt-2 font-bold">19:29 ✓✓</div>
                        </div>

                        <div className="self-start max-w-[85%] bg-white p-4 rounded-r-2xl rounded-bl-2xl shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-[#075e54]/20 rounded-full flex items-center justify-center">▶️</div>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div className="w-1/2 h-full bg-blue-500" />
                                </div>
                                <span className="text-[10px] text-slate-400 font-bold">0:12</span>
                            </div>
                            <p className="text-[10px] text-slate-400 italic mt-3">"Dei, this is real da, my neighbour actually got the phone already, share with everyone!"</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-[#f0f2f5] flex items-center gap-4">
                    <div className="w-10 h-10 text-xl flex items-center justify-center">😊</div>
                    <div className="flex-1 bg-white h-12 rounded-full px-6 flex items-center text-slate-400 text-sm">Type a message...</div>
                    <div className="w-10 h-10 text-xl flex items-center justify-center">🎙️</div>
                </div>
            </div>
        </div>
    );

    const GhostStore = () => (
        <div className={`absolute top-0 bottom-0 left-0 bg-[#f4f4f4] flex flex-col font-sans animate-in slide-in-from-bottom-20 duration-1000 overflow-y-auto transition-all ${showDetectiveBoard ? 'w-[65%]' : 'w-full'}`}>
            {/* Browser Header */}
            <div className="sticky top-0 z-[100] bg-white border-b border-gray-200 p-3 flex flex-col gap-2 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex gap-2 ml-2">
                        <div className="w-3 h-3 rounded-full bg-red-400" />
                        <div className="w-3 h-3 rounded-full bg-amber-400" />
                        <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    </div>
                    <div
                        className="flex-1 max-w-3xl bg-gray-100/80 hover:bg-gray-100 border border-transparent rounded-full h-9 flex items-center px-4 gap-3 cursor-pointer transition-colors group mx-auto relative"
                        onClick={() => handleClueDiscovery('domain_lookup')}
                    >
                        <span className="text-gray-500 text-sm">🔒</span>
                        <span className="text-sm font-medium text-gray-500">https://www.<span className="text-gray-800">techdeals-india.shop</span>/sale24</span>
                        <div className="absolute inset-0 rounded-full border border-blue-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-[0_0_8px_rgba(96,165,250,0.5)]"></div>
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] uppercase tracking-widest px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">Click to Inspect URL</div>
                    </div>
                    <div className="text-xl text-gray-500 pr-2">⋮</div>
                </div>
            </div>

            {/* Website Content */}
            <div className="w-full bg-white flex-1 flex flex-col">
                {/* Top Promo Bar */}
                <div className="bg-black text-white text-[11px] text-center py-2 font-medium tracking-wide">
                    SAMSUNG FESTIVAL SALE • UP TO 97% OFF ON GALAXY S24 ULTRA • FREE DELIVERY IN 24 HOURS
                </div>

                {/* Main Nav Banner */}
                <header className="py-5 px-12 flex justify-between items-center border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="text-blue-600 font-extrabold text-3xl tracking-tighter" style={{ fontFamily: 'Arial, sans-serif' }}>SAMSUNG</div>
                        <div className="h-6 w-px bg-gray-300 mx-2"></div>
                        <div className="text-gray-800 font-bold text-lg tracking-tight hover:text-blue-600 transition-colors">TechDeals Official Partner</div>
                    </div>

                    <div className="flex items-center gap-6">
                    </div>
                </header>

                {/* Primary Sale Section */}
                <section className="max-w-[1400px] mx-auto w-full p-12 grid grid-cols-2 gap-16">
                    {/* Visuals Column */}
                    <div className="space-y-6">
                        <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 rounded-[2rem] flex items-center justify-center p-12 shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden group">
                            {/* Realistic Phone Mock View */}
                            <div className="w-[45%] h-[85%] bg-black rounded-[2.5rem] shadow-[-20px_10px_40px_rgba(0,0,0,0.3)] border-4 border-[#5E5E5E] relative transform rotate-[-5deg] group-hover:rotate-0 transition-transform duration-500 flex items-center justify-center overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 border-[8px] border-black rounded-[2.2rem]">
                                    {/* Mock Screen UI */}
                                    <div className="w-full h-full relative overflow-hidden backdrop-blur-xl">
                                        <div className="absolute top-4 right-4 text-white/50 text-xs">10:42</div>
                                        <div className="absolute inset-x-8 top-1/3 h-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl rounded-full"></div>
                                        <div className="absolute bottom-16 inset-x-4 flex justify-between px-4">
                                            <div className="w-10 h-10 rounded-full bg-white/10 blur-sm"></div>
                                            <div className="w-10 h-10 rounded-full bg-white/10 blur-sm"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute right-0 top-1/4 h-16 w-1 bg-[#4A4A4A] rounded-l-md"></div>
                            </div>

                            <div className="absolute top-6 left-6 bg-red-600 text-white font-black px-4 py-2 rounded shadow-lg text-sm tracking-widest animate-pulse z-10">FLASH SALE: 97% OFF</div>
                        </div>
                        {/* Thumbnail Gallery (pure visual detail) */}
                        <div className="flex gap-4 justify-center">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className={`w-20 h-20 rounded-2xl border-2 hover:border-blue-500 cursor-pointer transition-colors flex items-center justify-center ${i === 1 ? 'border-blue-500 bg-gray-50' : 'border-gray-200 bg-white'}`}>
                                    <div className="w-8 h-12 bg-gray-300 rounded border border-gray-400"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Details Column */}
                    <div className="space-y-8 flex flex-col justify-center">
                        <div className="space-y-4">
                            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 leading-tight" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>
                                Galaxy S24 Ultra, 256GB, Titanium Gray
                            </h1>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center text-[#ff9900] text-lg">
                                    ★★★★★ <span className="text-gray-500 text-sm font-medium ml-2 hover:underline cursor-pointer">(114 Verified Reviews)</span>
                                </div>
                                <div className="w-px h-4 bg-gray-300"></div>
                                <div className="text-sm font-bold text-green-600">In Stock</div>
                            </div>
                        </div>

                        {/* Pricing Box highly manicured */}
                        <div className="bg-[#f9f9fb] p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-baseline gap-4">
                                    <span className="text-[14px] text-gray-500 font-bold mb-1 align-top">₹</span>
                                    <span className="text-[52px] font-black text-gray-900 tracking-tighter leading-none" style={{ fontFamily: 'Helvetica Neue, Arial, sans-serif' }}>2,499</span>
                                    <span className="text-[14px] text-gray-500 font-bold align-top">.00</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="text-gray-500 line-through font-medium tracking-wide">M.R.P.: ₹1,29,999.00</span>
                                    <span className="text-red-600 font-bold">You Save: ₹1,25,000 (97%)</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">Inclusive of all taxes. Free shipping on this item.</p>
                            </div>

                            <hr className="border-gray-200" />

                            <div className="flex items-center gap-3 bg-red-50 text-red-700 px-5 py-3 rounded-xl border border-red-100 shadow-inner">
                                <span className="text-lg">⏱️</span>
                                <span className="font-bold text-sm">Sale Ends In: <span className="font-black tabular-nums">02 : 14 : 33</span></span>
                            </div>

                            {/* Payment Options (Clue 5) Designed as a Checkout Selection */}
                            <div
                                className="mt-4 border border-[#e2e8f0] bg-white rounded-2xl overflow-hidden shadow-[0_4px_10px_rgba(0,0,0,0.03)] hover:border-red-300 hover:shadow-red-500/10 cursor-pointer transition-all group"
                                onClick={() => handleClueDiscovery('payment_trap')}
                            >
                                <div className="bg-gray-50 px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                                    <span className="font-bold text-gray-800 text-sm">Payment Method</span>
                                    <span className="text-xs text-gray-500 font-medium">Select to proceed</span>
                                </div>
                                <div className="p-5 flex flex-col gap-4">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <div className="mt-1 w-4 h-4 rounded-full border-4 border-blue-600 bg-white flex-shrink-0"></div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">Direct UPI Transfer <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded ml-2 font-bold uppercase tracking-wider">Fastest</span></span>
                                            <span className="text-xs text-gray-500 mt-1">Pay to: <span className="font-medium">techdeals2024@ybl</span></span>
                                        </div>
                                    </label>
                                    <div className="w-full h-px bg-gray-100"></div>
                                    <label className="flex items-start gap-3 opacity-50">
                                        <div className="mt-1 w-4 h-4 rounded-full border border-gray-300 bg-gray-100 flex-shrink-0"></div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">Credit / Debit Card</span>
                                            <span className="text-xs text-red-500 mt-1 font-medium">Temporarily unavailable for flash sales</span>
                                        </div>
                                    </label>
                                    <div className="w-full h-px bg-gray-100"></div>
                                    <label className="flex items-start gap-3 opacity-50">
                                        <div className="mt-1 w-4 h-4 rounded-full border border-gray-300 bg-gray-100 flex-shrink-0"></div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">Cash on Delivery</span>
                                            <span className="text-xs text-red-500 mt-1 font-medium">Not allowed on heavily discounted items</span>
                                        </div>
                                    </label>
                                </div>
                                <div className="p-4 bg-gray-50 border-t border-gray-100">
                                    <button
                                        className="w-full bg-[#FFDF00] hover:bg-[#F2D300] text-gray-900 font-bold py-3.5 rounded-full text-sm shadow-sm transition-colors border border-[#DEBD00]"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOutcomeType('scam');
                                            setGameState('outcome');
                                        }}
                                    >
                                        Proceed to Pay ₹2,499
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Artificial Urgency Details */}
                        <div className="flex items-center gap-4 text-sm font-medium text-gray-600 bg-red-50/50 p-4 rounded-xl border border-red-100">
                            <span className="text-2xl animate-pulse">🔥</span>
                            <span>High Demand! <span className="font-bold text-gray-900">12 units left</span> at this price. 412 sold in last 12 hours.</span>
                        </div>
                    </div>
                </section>

                <hr className="w-full border-gray-200" />

                {/* Customer Reviews Section (Clue 4) */}
                <section className="max-w-[1200px] mx-auto w-full p-12">
                    <div
                        className="flex flex-col mb-10 cursor-pointer group hover:bg-gray-50 p-4 -ml-4 rounded-2xl transition-colors"
                        onClick={() => handleClueDiscovery('fake_reviews')}
                    >
                        <h3 className="text-2xl font-bold text-gray-900">Customer Reviews</h3>
                        <div className="flex items-center gap-4 mt-2">
                            <div className="flex text-[#ff9900] text-xl">★★★★★</div>
                            <span className="text-gray-600 text-sm font-medium">4.9 out of 5 stars</span>
                            <span className="text-blue-600 text-sm font-medium group-hover:underline">114 global ratings</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-8">
                        {[
                            { name: 'Rakesh Kumar', title: 'Amazing deal!' },
                            { name: 'Sunita M.', title: 'Best purchase ever!' },
                            { name: 'Suresh K.', title: 'Highly recommended!' }
                        ].map((review, i) => (
                            <div key={i} className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 text-xs">👤</div>
                                    <span className="font-medium text-gray-800 text-sm">{review.name}</span>
                                </div>
                                <div className="flex text-[#ff9900] text-sm">★★★★★</div>
                                <span className="font-bold text-gray-900 text-sm">{review.title}</span>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    "I received the phone in 2 days. The packaging was perfect and the phone works flawlessly. TechDeals is truly the best shopping site in India. I am very happy."
                                </p>
                                <div className="text-xs text-gray-400">Reviewed in India on 3 Days Ago</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Footer Section (Contact/Policy) */}
                <footer className="bg-[#232F3E] text-white p-16 pb-32">
                    <div className="max-w-[1200px] mx-auto grid grid-cols-4 gap-12">
                        <div className="space-y-4">
                            <h4 className="font-bold text-[15px] mb-4">Get to Know Us</h4>
                            <p className="text-sm text-gray-300 leading-relaxed font-medium">
                                TechDeals India is the fastest growing electronics retailer. Partnering with major brands to bring flash sales directly to consumers at warehouse prices.
                            </p>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-bold text-[15px] mb-4">Make Money with Us</h4>
                            <ul className="space-y-3 text-sm text-gray-300 font-medium">
                                <li className="hover:underline cursor-pointer">Sell on TechDeals</li>
                                <li className="hover:underline cursor-pointer">Protect and Build Your Brand</li>
                                <li className="hover:underline cursor-pointer">Become an Affiliate</li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-bold text-[15px] mb-4">Let Us Help You</h4>
                            <ul className="space-y-3 text-sm text-gray-300 font-medium">
                                <li className="hover:text-white hover:underline cursor-pointer group" onClick={() => handleClueDiscovery('vague_policy')}>
                                    Returns & Replacements
                                    <span className="hidden group-hover:block bg-red-900/80 text-white text-xs p-2 mt-2 rounded border border-red-500 italic shadow-lg">Note: Returns processed within 45-60 working days post management approval. No returns or chargebacks on flash sale items.</span>
                                </li>
                                <li className="hover:underline cursor-pointer">Shipping Rates & Policies</li>
                                <li className="hover:underline cursor-pointer">TechDeals App Download</li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="font-bold text-[15px] mb-4 flex items-center gap-2">Contact Customer Service </h4>
                            <div
                                className="space-y-3 text-sm text-gray-300 font-medium cursor-pointer overflow-hidden relative p-3 -ml-3 rounded transition-colors hover:bg-white/5 group border border-transparent hover:border-red-500/30"
                                onClick={() => handleClueDiscovery('contact_forensics')}
                            >
                                <div className="flex gap-3 items-center group-hover:text-white"><span className="opacity-70 group-hover:opacity-100">📱</span> +91 89XXXXXXXX (WhatsApp Only)</div>
                                <div className="flex gap-3 items-center group-hover:text-white"><span className="opacity-70 group-hover:opacity-100">✉️</span> techdeals.india2024@gmail.com</div>
                                <div className="flex gap-3 items-center group-hover:text-white"><span className="opacity-70 group-hover:opacity-100">🏢</span> Shop 14, Commercial Complex, Delhi</div>
                                <div className="text-red-400 font-bold mt-3 text-xs uppercase tracking-wider group-hover:opacity-100 opacity-0 transition-opacity">
                                    ⚠️ GSTIN / REGISTERED ENTITY NO. NOT PROVIDED
                                </div>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Floating Chat Clue */}
            <div
                className="fixed bottom-8 right-8 w-[250px] bg-white rounded-t-xl rounded-bl-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] flex flex-col cursor-pointer border border-gray-200 overflow-hidden hover:shadow-[0_15px_50px_rgba(0,0,0,0.3)] transition-all z-[200] group"
                onClick={() => {
                    handleClueDiscovery('pressure_chat');
                    setShowChat(true);
                }}
            >
                <div className="bg-[#007185] text-white p-3 font-bold text-sm flex items-center justify-between">
                    <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Chat Support</div>
                    <span>−</span>
                </div>
                <div className="p-4 bg-gray-50 flex flex-col gap-2">
                    <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-xs text-gray-700 font-medium self-start inline-block">
                        Hello! Only 12 units left in Flash Sale. Need help checking out with UPI?
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 pl-1">Agent 'Riya' is typing...</div>
                </div>
            </div>

            {/* DETECTIVE POPUP (Clue details) */}
            {activeClue && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center p-8 bg-black/80 backdrop-blur-md animate-in zoom-in duration-500">
                    <div className="max-w-xl w-full bg-slate-900 border-2 border-cyan-500/30 p-16 rounded-[60px] shadow-2xl text-center">
                        <div className="w-24 h-24 bg-cyan-600/20 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-cyan-500">
                            <span className="text-5xl">🔍</span>
                        </div>
                        <h2 className="text-white text-4xl font-black mb-6 tracking-tighter uppercase italic">{activeClue.name}</h2>
                        <div className="bg-black/50 p-8 rounded-[40px] mb-10 border border-white/5">
                            <p className="text-slate-300 text-lg leading-relaxed italic font-medium">"{activeClue.description}"</p>
                        </div>
                        <button
                            onClick={() => setActiveClue(null)}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white font-black px-16 py-6 rounded-3xl text-sm uppercase tracking-[0.4em] transition-all hover:scale-105 active:scale-95"
                        >
                            Log Intelligence
                        </button>
                    </div>
                </div>
            )}

            {/* DETECTIVE MODE HUD BUTTON */}
            <div className="fixed bottom-10 left-10 z-[150] flex flex-col items-center">
                <button
                    className="w-16 h-16 bg-amber-500 hover:bg-amber-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.6)] border-4 border-amber-300 text-3xl transition-transform hover:scale-110 active:scale-95 relative"
                    onClick={() => setShowDetectiveBoard(!showDetectiveBoard)}
                >
                    🔍
                    {cluesFound.length > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-7 h-7 rounded-full flex justify-center items-center shadow-lg border-2 border-red-800 animate-bounce">{cluesFound.length}</span>}
                </button>
                <div className="mt-4 font-black text-[10px] text-white uppercase tracking-widest whitespace-nowrap bg-black/50 px-3 py-1 rounded-full border border-white/10 backdrop-blur-md">Evidence Board</div>
            </div>
        </div>
    );

    const EvidenceBoard = () => (
        <div
            className="absolute top-0 bottom-0 right-0 w-[35%] bg-amber-100 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] z-[200] p-8 flex flex-col border-l-[16px] border-[#5c3a21] animate-in slide-in-from-right duration-300 overflow-hidden"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23a)' opacity='.2'/%3E%3C/svg%3E")`,
                backgroundColor: '#e6c280'
            }}
        >
            {/* Draw Red Strings Between Clues */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {cluesFound.map((clue, idx) => {
                    if (idx > 0) {
                        const prev = cluesFound[idx - 1];
                        return <line key={`line-${idx}`} x1={prev.x} y1={prev.y} x2={clue.x} y2={clue.y} stroke="rgba(220,38,38,0.8)" strokeWidth="3" style={{ filter: 'drop-shadow(2px 4px 2px rgba(0,0,0,0.5))' }} />
                    }
                    return null;
                })}
            </svg>

            {/* Header Label */}
            <div className="flex justify-between items-center mb-6 z-10 bg-white p-3 rounded-sm shadow-md transform -rotate-2 border border-stone-300 self-start">
                <h2 className="text-2xl font-black text-stone-800 uppercase tracking-widest font-mono">
                    📌 INVESTIGATION BOARD
                </h2>
                <button className="text-red-600 hover:text-red-800 font-black text-2xl ml-6" onClick={() => setShowDetectiveBoard(false)}>✖</button>
            </div>

            {/* Clue Polaroids */}
            {cluesFound.map((clue, idx) => (
                <div
                    key={idx}
                    className="absolute bg-yellow-50 p-4 shadow-xl w-48 border border-yellow-200 z-10 flex flex-col"
                    style={{
                        left: clue.x - 96 > 50 ? clue.x - 96 : 50,
                        top: clue.y - 48 > 100 ? clue.y - 48 : 100,
                        transform: `rotate(${(idx % 2 === 0 ? -1 : 1) * (Math.random() * 6 + 2)}deg)`
                    }}
                >
                    {/* Red Pin Head */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-red-600 shadow-[2px_4px_4px_rgba(0,0,0,0.5)] border border-red-800 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white/40 absolute top-0.5 right-1"></div>
                    </div>
                    {/* Pin connection circle for SVG line visually */}
                    <div className="absolute top-0 left-1/2 w-2 h-2 rounded-full bg-black/20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                    <h4 className="font-bold text-red-800 tracking-wider mb-2 text-sm leading-tight border-b-2 border-red-800/20 pb-2 uppercase">{clue.title}</h4>
                    <p className="text-[10px] text-stone-700 font-mono leading-tight">{clue.desc}</p>
                </div>
            ))}

            {cluesFound.length === 0 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] flex flex-col gap-4 z-0 pointer-events-none">
                    <div className="text-stone-700/60 text-center font-mono font-bold text-xl rotate-[-2deg] border-4 border-dashed border-stone-700/30 p-6 rounded-xl bg-amber-100/50">
                        CLICK SUSPICIOUS ELEMENTS<br />ON THE WEBSITE TO PIN CLUES.
                    </div>

                    <div className="bg-white/60 p-6 rounded-xl border border-stone-400/50 shadow-md rotate-[1deg]">
                        <h4 className="font-black text-red-800 uppercase tracking-widest text-sm mb-3 border-b flex items-center gap-2">
                            <span>🕵️</span> Investigation Hints
                        </h4>
                        <ul className="text-xs text-stone-800 font-mono space-y-2 font-medium list-disc pl-4">
                            <li>Check the <strong>URL domain</strong> closely.</li>
                            <li>Investigate the <strong>padlock</strong> icon.</li>
                            <li>Analyze the <strong>customer reviews</strong>.</li>
                            <li>Does the <strong>contact address</strong> seem real?</li>
                            <li>Read the exact <strong>return policy</strong>.</li>
                            <li>Check the available <strong>payment options</strong>.</li>
                            <li>Look at the <strong>authorized badges</strong>.</li>
                            <li>A real agent answers questions in the <strong>chat</strong>.</li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Footer Suspicion Meter */}
            <div className="absolute bottom-6 left-6 right-6 bg-zinc-900 rounded-xl p-4 shadow-[0_10px_20px_rgba(0,0,0,0.8)] z-10 border-2 border-zinc-700 flex flex-col gap-4">
                <div>
                    <h3 className="text-xs text-zinc-400 uppercase font-mono mb-2 flex justify-between">
                        <span>Threat Intelligence Meter</span>
                        <span style={{ color: cluesFound.length > 2 ? '#ef4444' : cluesFound.length > 1 ? '#eab308' : '#22c55e' }}>{cluesFound.length}/6 CLUES</span>
                    </h3>
                    <div className="w-full h-4 bg-zinc-950 rounded-full overflow-hidden shadow-inner">
                        <div
                            className="h-full transition-all duration-500"
                            style={{
                                width: `${(cluesFound.length / 6) * 100}%`,
                                backgroundColor: cluesFound.length > 2 ? '#ef4444' : cluesFound.length > 1 ? '#eab308' : '#22c55e'
                            }}
                        ></div>
                    </div>
                </div>
                {cluesFound.length >= 3 && (
                    <button
                        className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-lg uppercase tracking-widest text-sm transition-all shadow-lg animate-pulse"
                        onClick={() => {
                            setShowDetectiveBoard(false);
                            setGameState('outcome-pre');
                        }}
                    >
                        🚨 CONFRONT AUNTY PRIYA
                    </button>
                )}
            </div>
        </div>
    );

    const OutcomeDecision = () => (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-12 text-center">
            <div className="max-w-4xl space-y-16">
                <div className="w-40 h-40 bg-indigo-600 rounded-[55px] flex items-center justify-center text-8xl mx-auto shadow-2xl animate-pulse italic">👵</div>
                <div className="space-y-6">
                    <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase">Call Aunty Priya?</h2>
                    <p className="text-2xl text-slate-400 font-medium leading-relaxed italic opacity-80">
                        "Dei, I already ordered one for Karthik's birthday. The website looked so professional, I just paid immediately. Tell me what to do!"
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-10">
                    <button
                        className="bg-red-600 hover:bg-red-500 text-white font-black py-12 px-12 rounded-[50px] shadow-3xl text-xl uppercase tracking-widest transition-all hover:scale-105"
                        onClick={() => {
                            setOutcomeType('scam');
                            setGameState('outcome');
                        }}
                    >
                        Try to Buy One Anyway
                    </button>
                    <button
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-12 px-12 rounded-[50px] shadow-3xl text-xl uppercase tracking-widest transition-all hover:scale-105"
                        onClick={() => {
                            setOutcomeType('victory');
                            setGameState('outcome');
                        }}
                    >
                        Warn Aunty Priya & Report
                    </button>
                </div>
            </div>
        </div>
    );

    const OutcomeFinal = () => (
        <div className="absolute inset-0 z-[1000] bg-black flex items-center justify-center p-12 animate-in fade-in duration-1000">
            {outcomeType === 'victory' ? (
                <div className="max-w-5xl text-center space-y-20">
                    <div className="w-48 h-48 bg-emerald-500 rounded-[65px] flex items-center justify-center text-[100px] mx-auto shadow-[0_0_150px_rgba(16,185,129,0.3)] italic animate-bounce">🛡️</div>
                    <div className="space-y-10">
                        <h1 className="text-[120px] font-black text-white italic tracking-tighter leading-none">FAMILY_SHIELD</h1>
                        <p className="text-4xl text-slate-300 leading-relaxed max-w-4xl mx-auto italic font-medium">
                            "You stopped Aunty Priya from losing everything. By checking the domain age and GST logs, you dismantled the 'Ghost Store' illusion."
                        </p>
                    </div>

                    <div className="grid grid-cols-3 gap-12 px-20">
                        <div className="bg-slate-900/50 p-12 rounded-[60px] border-2 border-emerald-500/30">
                            <span className="text-slate-500 text-xs font-black uppercase tracking-[0.5em] block mb-4">Investigator</span>
                            <span className="text-5xl font-black text-emerald-400 tracking-tighter">+150 PTS</span>
                        </div>
                        <div className="bg-slate-900/50 p-12 rounded-[60px] border-2 border-indigo-500/30">
                            <span className="text-slate-500 text-xs font-black uppercase tracking-[0.5em] block mb-4">Medal</span>
                            <span className="text-2xl font-black text-indigo-400 uppercase italic">Aunty's Savior</span>
                        </div>
                        <div className="bg-slate-900/50 p-12 rounded-[60px] border-2 border-cyan-500/30">
                            <span className="text-slate-500 text-xs font-black uppercase tracking-[0.5em] block mb-4">Level Status</span>
                            <span className="text-4xl font-black text-cyan-400">SR. DETECTIVE</span>
                        </div>
                    </div>

                    <button
                        onClick={() => completeLevel(true, 150, 0)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-24 py-10 rounded-[55px] text-3xl tracking-[0.25em] transition-all shadow-glow shadow-emerald-500/30 italic uppercase"
                    >
                        Advance to Level 9
                    </button>
                </div>
            ) : (
                <div className="max-w-4xl text-center space-y-16 animate-in zoom-in duration-700">
                    <div className="w-32 h-32 bg-red-600 rounded-full flex items-center justify-center text-7xl mx-auto shadow-[0_0_120px_rgba(220,38,38,0.5)]">💸</div>
                    <h1 className="text-9xl font-black text-white leading-none tracking-tighter uppercase italic">GHOSTED</h1>
                    <p className="text-4xl text-slate-300 font-medium italic leading-relaxed">
                        "The ₹2,499 transfer was final. No delivery, no refund, and TechDeals.shop vanished 48 hours later."
                    </p>
                    <div className="bg-red-950/20 border-4 border-red-900/40 p-16 rounded-[70px] space-y-10">
                        <div className="flex justify-between items-center text-3xl">
                            <span className="text-white font-black italic">LIQUIDATED:</span>
                            <span className="text-7xl font-black text-red-600 tracking-tighter">₹2,499</span>
                        </div>
                        <p className="text-slate-500 text-sm font-black uppercase tracking-widest italic">Personal Data logged for Phishing list</p>
                    </div>
                    <button
                        onClick={() => {
                            adjustAssets(-2499);
                            adjustLives(-1);
                            setGameState('living-room');
                            setCluesFound([]);
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-black px-24 py-10 rounded-[55px] text-2xl tracking-widest transition-all border-4 border-slate-700 shadow-3xl uppercase italic"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <div className="w-full h-full bg-black relative selection:bg-cyan-500/30 overflow-hidden font-sans">
            {gameState === 'living-room' && <LivingRoom />}
            {gameState === 'website' && <GhostStore />}
            {gameState === 'outcome-pre' && <OutcomeDecision />}
            {gameState === 'outcome' && <OutcomeFinal />}

            {showWhatsApp && <WhatsAppThread />}

            {showDetectiveBoard && <EvidenceBoard />}



            {/* Toast Feedback */}
            {feedbackMsg && (
                <div className={`fixed top-12 right-12 py-6 px-12 rounded-[35px] shadow-3xl z-[1000] animate-in slide-in-from-right-20 font-black tracking-widest text-[10px] uppercase flex items-center gap-5 border-2 ${feedbackMsg.color === 'emerald' ? 'bg-emerald-950/95 border-emerald-500 text-emerald-100 shadow-emerald-900/30' :
                    'bg-slate-900/95 border-cyan-500 text-cyan-100 shadow-cyan-900/30'
                    }`}>
                    <div className={`w-3 h-3 rounded-full animate-pulse ${feedbackMsg.color === 'emerald' ? 'bg-emerald-500 shadow-[0_0_10px_emerald]' : 'bg-cyan-500 shadow-[0_0_10px_cyan]'}`} />
                    {feedbackMsg.text}
                </div>
            )}
        </div>
    );
};

export default Level8;
