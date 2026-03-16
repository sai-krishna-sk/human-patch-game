import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGameState } from '../context/GameStateContext';
import Player from '../components/Player';

const ROOM_WIDTH = 1600;
const ROOM_HEIGHT = 1100;
const VIEWPORT_WIDTH = 1200;
const VIEWPORT_HEIGHT = 800;
const PLAYER_SIZE = 40;
const SPEED = 15;

const LAPTOP_AREA = { x: 300, y: 350, w: 150, h: 150 }; // Placed in bedroom


const checkCollision = (px, py, rect) => (
    px < rect.x + rect.w && px + PLAYER_SIZE > rect.x &&
    py < rect.y + rect.h && py + PLAYER_SIZE > rect.y
);

const CLUE_INFO = {
    'voice_glitch': {
        title: "Robotic Artifact",
        desc: "The voice has a strange metallic echo. Deepfakes often have such artifacts.",
        hint: "Listen closely to the audio quality...",
        icon: "🤖"
    },
    'nickname_fail': {
        title: "Formal Distance",
        desc: "He's using generic emotional bait instead of the specific personal bond you shared.",
        hint: "Are they using your real name too formally?",
        icon: "🏷️"
    },
    'forgetfulness': {
        title: "Memory Gap",
        desc: "The caller avoided a direct question about a recent shared personal event.",
        hint: "Try asking about your plans for today.",
        icon: "🧠"
    },
    'wrong_detail': {
        title: "Identity Error",
        desc: "Arjun knows you don't have a sister. The AI is hallucinating or using generic scripts.",
        hint: "Ask about his family members.",
        icon: "❌"
    },
    'real_call_confirmed': {
        title: "The Truth",
        desc: "Your real friend confirmed they never called you. This was a deepfake voice scam.",
        hint: "Check your contacts for the real number.",
        icon: "📞"
    }
};

const Level10 = () => {
    const { completeLevel, adjustAssets, assets, setSafetyScore, lives, adjustLives } = useGameState();
    const [gameState, setGameState] = useState('pre_waking_up'); // pre_waking_up, room, phone, laptop, outcome
    const [playerPos, setPlayerPos] = useState({ x: 800, y: 400 });
    const keysRef = useRef({});
    const audioCtxRef = useRef(null);
    const vibeRef = useRef(null);

    const [canInteractPhone, setCanInteractPhone] = useState(false);
    const [canInteractLaptop, setCanInteractLaptop] = useState(false);
    const [phoneApp, setPhoneApp] = useState('home'); // home, call, contacts, pay
    const [cluesFound, setCluesFound] = useState([]);
    const [feedbackMsg, setFeedbackMsg] = useState(null);
    const [isDetectiveModeOpen, setIsDetectiveModeOpen] = useState(false);
    const [dialogueIndex, setDialogueIndex] = useState(0);
    const [chatHistory, setChatHistory] = useState([]);
    const [typingProgress, setTypingProgress] = useState(0);
    const [isTypingDone, setIsTypingDone] = useState(false);
    const [showingOptions, setShowingOptions] = useState(false);
    const [callStatus, setCallStatus] = useState('idle'); // idle, ringing, active, hangup
    const [calledRealFriend, setCalledRealFriend] = useState(false);
    const [friendCallStep, setFriendCallStep] = useState(-1); // -1 = not started
    const [laptopStep, setLaptopStep] = useState('portal'); // portal, reporting, submitted

    const FRIEND_CONVERSATION = [
        { speaker: 'YOU', text: "Hey Arjun, it's me. I just got the weirdest call..." },
        { speaker: 'ARJUN', text: "Heyyy what's up? I was just watching a movie. What call?" },
        { speaker: 'YOU', text: "Someone called me sounding EXACTLY like you. Said you had a bad accident and needed ₹50,000 urgently." },
        { speaker: 'ARJUN', text: "Bro WHAT?! That wasn't me! I'm sitting at home right now. I never called you!" },
        { speaker: 'YOU', text: "I thought so... they mentioned my sister — I don't even have one. And the voice had this weird metallic tone." },
        { speaker: 'ARJUN', text: "Dude that's creepy. Must be one of those AI deepfake scams. Good thing you didn't pay. You should warn your family too and report this!" },
        { speaker: 'SYSTEM', text: "✅ Arjun confirmed he never called you. This was a deepfake voice scam. Drag this to the evidence board!", isDraggable: true, clueId: 'real_call_confirmed' }
    ];

    const showFeedback = (msg) => {
        setFeedbackMsg(msg);
        setTimeout(() => setFeedbackMsg(null), 3000);
    };

    const getAudioContext = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtxRef.current;
    };

    const playSynthSound = (type) => {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        switch (type) {
            case 'call_vibration': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const mod = ctx.createOscillator();
                const gate = ctx.createGain();
                const gateOsc = ctx.createOscillator();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(55, ctx.currentTime);
                mod.type = 'triangle';
                mod.frequency.setValueAtTime(3, ctx.currentTime);
                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gateOsc.type = 'square';
                gateOsc.frequency.setValueAtTime(0.714, ctx.currentTime);

                const gateConst = ctx.createGain();
                gateConst.gain.setValueAtTime(0.5, ctx.currentTime);
                gateOsc.connect(gateConst);
                gate.gain.setValueAtTime(0.5, ctx.currentTime);
                gateConst.connect(gate.gain);

                mod.connect(gain.gain);
                osc.connect(gain);
                gain.connect(gate);
                gate.connect(ctx.destination);

                osc.start();
                mod.start();
                gateOsc.start();
                return { osc, mod, gain, gateOsc };
            }
            case 'acceptance_click': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.05);
                gain.gain.setValueAtTime(0.5, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.05);
                break;
            }
            default: break;
        }
    };


    const discoverClue = (id) => {
        if (!cluesFound.includes(id)) {
            setCluesFound(prev => [...prev, id]);
            showFeedback("🔍 EVIDENCE PINNED TO BOARD");
        }
    };

    const handleClueDrop = (e) => {
        e.preventDefault();
        const cid = e.dataTransfer.getData('clueId');
        if (cid) {
            discoverClue(cid);
        }
    };

    // Dialogue sequence - Coherent and logical
    const dialogueSequence = [
        {
            speaker: 'SCAMMER', parts: [
                { text: "Bro, thank god you picked up! I'm in a total mess. I " },
                { text: "just had a bad accident", isHighlighted: true },
                { text: " near the highway. I'm at the hospital now." }
            ]
        },
        {
            speaker: 'PLAYER', options: [
                {
                    text: "Arjun? Is that you? You sound... different.",
                    isCorrect: true,
                    scammerReply: "It's the hospital network, man! My phone was crushed, I'm using a nurse's phone. Everything is chaotic here."
                },
                {
                    text: "Oh no! Are you okay? Which hospital?",
                    isCorrect: true,
                    scammerReply: "I'm okay, just some cuts. But the other guy is threatening to call the police unless I pay for his repairs right now. ₹50,000."
                }
            ]
        },
        {
            speaker: 'SCAMMER', parts: [
                { text: "Listen, I need around ₹50,000 " },
                { text: "for immediate clearance", isHighlighted: true },
                { text: ". My " },
                { text: "voice might sound a bit off", isDraggable: true, clueId: 'voice_glitch' },
                { text: " because I'm in shock. Please, you're the only one I can call." }
            ]
        },
        {
            speaker: 'PLAYER', options: [
                {
                    text: "Wait, we were supposed to meet at the cafe today. Why are you on the highway?",
                    isCorrect: true,
                    scammerReply: "The cafe? Oh... right. I had to run an errand for my mom last minute. That's when it happened."
                },
                {
                    text: "Arjun, call me by the nickname you gave me in college.",
                    isCorrect: true,
                    scammerReply: "Nickname? Bro, I'm literally bleeding here and you're asking about nicknames? Just help me out!"
                }
            ]
        },
        {
            speaker: 'SCAMMER', parts: [
                { text: "Look, " },
                { text: "I thought we were like brothers", isDraggable: true, clueId: 'nickname_fail' },
                { text: ". Even " },
                { text: "your sister", isDraggable: true, clueId: 'wrong_detail' },
                { text: " would be more helpful than this!" }
            ]
        },
        {
            speaker: 'PLAYER', options: [
                {
                    text: "Wait... did you just say my sister? I don't have a sister.",
                    isCorrect: true,
                    scammerReply: "I... I meant MY sister! She's crying in the corner. I'm losing my mind here, man. Just open the Pay app and send it!"
                },
                {
                    text: "Arjun, you're forgetting our meeting today. Something is definitely wrong.",
                    isCorrect: true,
                    scammerReply: "I'm not forgetting our meeting! I just have a concussion! Are you going to help or what?",
                    replyParts: [
                        { text: "I'm not forgetting " },
                        { text: "our meeting", isDraggable: true, clueId: 'forgetfulness' },
                        { text: "! I just have a concussion! Are you going to help or what?" }
                    ]
                }
            ]
        }
    ];

    // Typing animation
    useEffect(() => {
        const currentMsg = chatHistory[chatHistory.length - 1];
        if (!currentMsg || (currentMsg.type !== 'scammer' && currentMsg.type !== 'friend') || isTypingDone) return;

        const fullText = currentMsg.parts.map(p => p.text).join('');
        const interval = setInterval(() => {
            setTypingProgress(prev => {
                if (prev >= fullText.length) {
                    clearInterval(interval);
                    setIsTypingDone(true);
                    return prev;
                }
                return prev + 1;
            });
        }, 20);
        return () => clearInterval(interval);
    }, [chatHistory, isTypingDone]);

    // FIXED MOVEMENT LOGIC
    useEffect(() => {
        const handleKD = (e) => { keysRef.current[e.key.toLowerCase()] = true; };
        const handleKU = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
        window.addEventListener('keydown', handleKD);
        window.addEventListener('keyup', handleKU);

        let rafId;
        const loop = () => {
            if (gameState === 'room') {
                const keys = keysRef.current;
                setPlayerPos(p => {
                    let nx = p.x, ny = p.y;
                    if (keys['w'] || keys['arrowup']) ny -= SPEED;
                    if (keys['s'] || keys['arrowdown']) ny += SPEED;
                    if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                    if (keys['d'] || keys['arrowright']) nx += SPEED;

                    // Bedroom boundaries
                    nx = Math.max(250, Math.min(nx, 1300));
                    ny = Math.max(300, Math.min(ny, 650));

                    // Interaction collision checks
                    setCanInteractPhone(true); 
                    setCanInteractLaptop(checkCollision(nx, ny, LAPTOP_AREA));


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
    }, [gameState]); // Only depends on gameState

    // Call vibration effect for pre_waking_up and ringing phase
    useEffect(() => {
        const isRinging = gameState === 'pre_waking_up' || (gameState === 'phone' && callStatus === 'ringing');
        if (isRinging) {
            if (!vibeRef.current) {
                vibeRef.current = playSynthSound('call_vibration');
            }
        } else {
            if (vibeRef.current) {
                const { osc, mod, gain, gateOsc } = vibeRef.current;
                const ctx = getAudioContext();
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                setTimeout(() => {
                    if (osc) osc.stop();
                    if (mod) mod.stop();
                    if (gateOsc) gateOsc.stop();
                    vibeRef.current = null;
                }, 500);
            }
        }
    }, [gameState, callStatus]);



    useEffect(() => {
        // Shared interaction listener
        const handleInteractions = (e) => {
            if (e.key.toLowerCase() === 'e') {
                if (gameState === 'pre_waking_up') {
                    playSynthSound('acceptance_click');
                    setGameState('phone');
                    setPhoneApp('call'); // Ensure it shows the call screen (ringing/active)
                    setCallStatus('ringing');
                    setIsDetectiveModeOpen(true);
                }



                if (canInteractPhone && gameState === 'room') {
                    setGameState('phone');
                    setIsDetectiveModeOpen(true);
                    if (callStatus === 'idle') setCallStatus('ringing');
                }
                if (canInteractLaptop && gameState === 'room' && calledRealFriend) setGameState('laptop');
            }
        };

        window.addEventListener('keydown', handleInteractions);
        return () => window.removeEventListener('keydown', handleInteractions);
    }, [canInteractPhone, canInteractLaptop, gameState, calledRealFriend, callStatus]);

    const handleOptionClick = (opt) => {
        setShowingOptions(false);
        setChatHistory(prev => [...prev, { type: 'player', text: opt.text }]);

        setTimeout(() => {
            const parts = opt.replyParts || [{ text: opt.scammerReply }];
            setChatHistory(prev => [...prev, { type: 'scammer', parts }]);
            setTypingProgress(0);
            setIsTypingDone(false);
        }, 500);
    };

    const advanceDialogue = () => {
        const nextIdx = dialogueIndex + 1;
        if (nextIdx >= dialogueSequence.length) {
            setCallStatus('idle');
            setPhoneApp('home');
            return;
        }

        setDialogueIndex(nextIdx);
        const next = dialogueSequence[nextIdx];
        if (next.speaker === 'SCAMMER') {
            setChatHistory(prev => [...prev, { type: 'scammer', parts: next.parts }]);
            setTypingProgress(0);
            setIsTypingDone(false);
        } else {
            setShowingOptions(true);
        }
    };

    const startCall = () => {
        setCallStatus('active');
        setChatHistory([{ type: 'scammer', parts: dialogueSequence[0].parts }]);
        setTypingProgress(0);
        setIsTypingDone(false);
    };

    const callRealFriend = () => {
        setFriendCallStep(0);
        setPhoneApp('friendcall');
    };

    const advanceFriendCall = () => {
        const nextStep = friendCallStep + 1;
        if (nextStep >= FRIEND_CONVERSATION.length) {
            setCalledRealFriend(true);
            showFeedback("⚠️ Arjun confirmed: He never called you!");
            return;
        }
        setFriendCallStep(nextStep);
    };

    // -------------------------------------------------------------------------
    // RENDER HELPERS (FROM LEVEL 1)
    // -------------------------------------------------------------------------
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
        <div className="absolute z-10 bg-[#e08e50] border-[12px] border-[#b86b35] shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col justify-evenly p-2" style={{ left: x, top: y, width: 140, height: 450 }}>
            <div className="w-full h-[10px] bg-[#9c5525] shadow-sm"></div>
            <div className="flex items-end h-[60px] px-2 gap-1">
                <div className="w-4 h-10 bg-red-600 shadow-sm border-l border-white/20"></div><div className="w-5 h-12 bg-blue-600 shadow-sm border-l border-white/20"></div><div className="w-4 h-14 bg-yellow-500 ml-2 shadow-sm border-l border-white/20"></div>
            </div>
            <div className="w-full h-[10px] bg-[#9c5525] shadow-sm"></div>
            <div className="flex items-end h-[60px] px-2 gap-1 justify-end">
                <div className="w-6 h-12 bg-emerald-600 shadow-sm border-l border-white/20"></div><div className="w-4 h-9 bg-purple-600 shadow-sm border-l border-white/20"></div>
            </div>
            <div className="w-full h-[10px] bg-[#9c5525] shadow-sm"></div>
            <div className="flex items-end h-[60px] px-2 gap-1">
                <div className="w-5 h-14 bg-cyan-600 shadow-sm border-l border-white/20"></div><div className="w-4 h-12 bg-red-500 shadow-sm border-l border-white/20"></div><div className="w-6 h-10 bg-slate-600 ml-4 shadow-sm border-l border-white/20"></div>
            </div>
            <div className="w-full h-[10px] bg-[#9c5525] shadow-sm"></div>
        </div>
    );

    const renderWindow = (x, y) => (
        <div className="absolute z-5 bg-[#1e293b] border-x-[16px] border-t-[16px] border-[#8da5b2] shadow-[inset_0_0_50px_rgba(0,0,0,0.8),0_10px_30px_rgba(0,0,0,0.6)] overflow-hidden" style={{ left: x, top: y, width: 450, height: 180 }}>
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] to-[#1e3a8a]"></div>
            <div className="absolute bottom-0 left-0 right-0 h-[80px] flex items-end gap-[1px]">
                {[40, 60, 30, 80, 50, 45, 70, 35, 90, 40, 65, 55].map((h, i) => (
                    <div key={i} className={`flex-1 bg-[#090e1a] flex flex-wrap gap-1 p-1 items-start justify-center`} style={{ height: h }}>
                        {i % 3 === 0 && <div className="w-2 h-2 bg-yellow-100/80 rounded-sm shadow-[0_0_5px_rgba(254,240,138,0.8)]"></div>}
                        {i % 4 === 0 && <div className="w-2 h-2 bg-yellow-100/80 rounded-sm shadow-[0_0_5px_rgba(254,240,138,0.8)]"></div>}
                    </div>
                ))}
            </div>
            <div className="absolute top-0 bottom-0 left-1/2 w-[16px] bg-[#8da5b2] -translate-x-1/2 shadow-xl"></div>
        </div>
    );

    if (gameState === 'room') {
        const cameraX = Math.max(0, Math.min(playerPos.x - VIEWPORT_WIDTH / 2, ROOM_WIDTH - VIEWPORT_WIDTH));
        const cameraY = Math.max(0, Math.min(playerPos.y - VIEWPORT_HEIGHT / 2, ROOM_HEIGHT - VIEWPORT_HEIGHT));

        return (
            <div className="w-full h-full flex items-center justify-center bg-black px-8">
                <div className="relative border-8 border-slate-900 shadow-2xl overflow-hidden font-sans bg-zinc-900" style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}>
                    <div className="absolute inset-0 transition-transform duration-100 ease-out" style={{ width: ROOM_WIDTH, height: ROOM_HEIGHT, transform: `translate(${-cameraX}px, ${-cameraY}px)` }}>
                        <div className="absolute inset-0 bg-[#2c3e50] overflow-hidden">
                            {/* Room Background Image - Updated to Bedroom */}
                            <div
                                className="absolute inset-0 z-0"
                                style={{
                                    backgroundImage: "url('/assets/morning_bed.png')",
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'south'
                                }}
                            />




                            <Player x={playerPos.x} y={playerPos.y} />
                        </div>
                    </div>

                    {/* Interaction Prompts */}
                    {canInteractPhone && (
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white text-black font-bold px-6 py-3 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)] z-[400] flex items-center gap-3 animate-bounce">
                            <span className="bg-black text-white px-2 py-1 rounded shadow-inner">E</span>
                            <span>ANSWER PHONE</span>
                        </div>
                    )}
                    {canInteractLaptop && calledRealFriend && (
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-black font-bold px-6 py-3 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] z-[400] flex items-center gap-3 animate-bounce">
                            <span className="bg-black text-white px-2 py-1 rounded shadow-inner">E</span>
                            <span>REPORT CYBER CRIME</span>
                        </div>
                    )}

                    {/* Instruction HUD */}
                    <div className="absolute top-4 left-4 text-emerald-500 font-mono text-xs z-[400] bg-black/60 p-2 rounded">
                        Objective: Investigate the suspicious call.<br />Controls: W A S D to move.
                    </div>

                    {/* Detective Board Button */}
                    <div className="fixed bottom-10 left-12 z-[500] flex gap-4">
                        <button onClick={() => setIsDetectiveModeOpen(!isDetectiveModeOpen)} className="w-14 h-14 bg-amber-500 hover:bg-amber-400 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.6)] border-2 border-amber-300 text-2xl">
                            🔍
                            {cluesFound.length > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex justify-center items-center">{cluesFound.length}</span>}
                        </button>
                    </div>

                    {isDetectiveModeOpen && (
                        <div
                            onDrop={handleClueDrop}
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-4', 'ring-red-500/50'); }}
                            onDragLeave={(e) => { e.currentTarget.classList.remove('ring-4', 'ring-red-500/50'); }}
                            className="fixed inset-y-8 right-8 w-[600px] z-[600] shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col rounded-xl overflow-hidden"
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.08\'/%3E%3C/svg%3E")', backgroundColor: '#c4956b' }}
                        >
                            {/* Board Header */}
                            <div className="bg-[#2a1810] p-5 flex justify-between items-center border-b-4 border-[#1a0e08] shadow-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-red-700 rounded-full flex items-center justify-center text-sm shadow-inner border-2 border-red-900">🕵️</div>
                                    <div>
                                        <h3 className="text-amber-200 font-black text-sm uppercase tracking-[0.2em]">Investigation Board</h3>
                                        <p className="text-amber-400/60 text-[8px] font-mono tracking-widest">CASE #VOICE-1010 — AI VOICE SCAM</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsDetectiveModeOpen(false)} className="w-8 h-8 bg-red-900/60 hover:bg-red-800 text-white rounded-full flex items-center justify-center text-xs font-bold transition-colors">✕</button>
                            </div>

                            {/* Drop zone indicator */}
                            <div className="mx-5 mt-4 p-3 border-2 border-dashed border-red-800/40 rounded-lg bg-red-900/10 text-center">
                                <span className="text-[9px] text-red-900/70 font-bold uppercase tracking-widest">📌 Drag suspicious clues here to pin them</span>
                            </div>

                            {/* Clue Cards */}
                            <div className="flex-1 grid grid-cols-2 gap-5 p-5 overflow-y-auto custom-scrollbar">
                                {Object.keys(CLUE_INFO).map((cid, idx) => {
                                    const isFound = cluesFound.includes(cid);
                                    const rotations = [-2, 1.5, -1, 2, -1.5];
                                    return (
                                        <div key={cid} className={`relative transition-all duration-700 ${isFound ? 'scale-100 opacity-100' : 'scale-95 opacity-50'}`} style={{ transform: `rotate(${rotations[idx]}deg)` }}>
                                            {/* Red pushpin */}
                                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10">
                                                <div className={`w-5 h-5 rounded-full shadow-lg ${isFound ? 'bg-red-600 border-2 border-red-800' : 'bg-zinc-500 border-2 border-zinc-600'}`}>
                                                    <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white/40 rounded-full"></div>
                                                </div>
                                                <div className={`w-0.5 h-3 mx-auto -mt-0.5 ${isFound ? 'bg-zinc-600' : 'bg-zinc-500'}`}></div>
                                            </div>
                                            {/* Card */}
                                            <div className={`mt-3 p-4 rounded shadow-[2px_4px_12px_rgba(0,0,0,0.3)] border transition-all duration-500 ${isFound ? 'bg-[#fffef5] border-amber-300/60' : 'bg-stone-200/80 border-stone-300'}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-2xl">{isFound ? CLUE_INFO[cid].icon : '❓'}</span>
                                                    {isFound && (
                                                        <span className="px-2 py-0.5 bg-red-600 text-white text-[7px] font-black rounded uppercase tracking-wider">Found</span>
                                                    )}
                                                </div>
                                                <div className={`text-[10px] font-black uppercase tracking-wider mb-1 ${isFound ? 'text-stone-800' : 'text-stone-500'}`}>
                                                    {isFound ? CLUE_INFO[cid].title : 'CLASSIFIED'}
                                                </div>
                                                <div className="w-8 h-0.5 bg-red-500/40 mb-2"></div>
                                                <p className={`text-[9px] leading-relaxed ${isFound ? 'text-stone-700 font-medium' : 'text-stone-400 italic'}`}>
                                                    {isFound ? CLUE_INFO[cid].desc : `💡 ${CLUE_INFO[cid].hint}`}
                                                </p>
                                                {isFound && (
                                                    <div className="mt-2 flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                                        <span className="text-[7px] text-green-700 font-bold uppercase tracking-widest">Verified Evidence</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Progress bar */}
                            <div className="bg-[#2a1810] p-4 border-t-4 border-[#1a0e08]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[9px] text-amber-300 font-black uppercase tracking-widest">Evidence Collected</span>
                                    <span className="text-[11px] text-amber-200 font-black">{cluesFound.length} / {Object.keys(CLUE_INFO).length}</span>
                                </div>
                                <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(239,68,68,0.6)]" style={{ width: `${(cluesFound.length / Object.keys(CLUE_INFO).length) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {feedbackMsg && (
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-4 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.8)] z-[500] font-bold text-center animate-bounce border-2 border-red-300">
                            {feedbackMsg}
                        </div>
                    )}

                    <style dangerouslySetInnerHTML={{
                        __html: `
                        @keyframes wiggle {
                            0%, 100% { transform: rotate(-5deg); }
                            50% { transform: rotate(5deg); }
                        }
                    ` }} />
                </div>
            </div>
        );
    }

    if (gameState === 'pre_waking_up') {
        return (
            <div className="w-full h-full bg-black flex flex-col items-center justify-center font-mono relative overflow-hidden">
                {/* Immersive Background */}
                <div className="absolute inset-0 z-0 scale-110 blur-sm brightness-[0.3]">
                    <img src="/assets/morning_bed.png" className="w-full h-full object-cover" alt="" />
                </div>

                <div className="relative z-10 space-y-8 text-center animate-pulse">
                    <div className="text-white/20 text-[10px] tracking-[1em] uppercase mb-4">Incoming Call Connection...</div>
                    <div className="text-white text-3xl italic tracking-tighter">"how is calling me at this hour"</div>
                    <div className="flex flex-col items-center gap-4 mt-20">
                        <div className="w-12 h-12 bg-white/5 border border-white/20 rounded-full flex items-center justify-center animate-bounce">
                            <span className="text-white text-xs font-black">E</span>
                        </div>
                        <div className="text-white/40 text-[9px] font-black uppercase tracking-[0.4em]">Press E to pick up phone</div>
                    </div>
                </div>
                {/* procedural vibration hum visual */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/5 overflow-hidden z-20">
                    <div className="h-full bg-blue-500/20 w-1/3 animate-ping"></div>
                </div>
            </div>
        );
    }


    if (gameState === 'phone') {

        const renderHomeScreen = () => (
            <div className="flex-1 flex flex-col p-8 bg-gradient-to-br from-indigo-950 via-slate-900 to-zinc-950 ring-inset ring-8 ring-black/20">
                <div className="flex justify-between items-center mb-12 backdrop-blur-md bg-white/10 p-2 rounded-full px-4">
                    <span className="text-[10px] font-black text-white tracking-widest">{String(new Date().getHours()).padStart(2, '0')}:{String(new Date().getMinutes()).padStart(2, '0')}</span>
                    <div className="flex gap-1 items-center">
                        <div className="w-3 h-2 bg-white/20 rounded-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-green-500 w-3/4"></div>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-8">
                    <button onClick={() => setPhoneApp('call')} className="flex flex-col items-center gap-2 group">
                        <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg ring-4 ring-green-500/20 group-hover:scale-110 transition-transform">📞</div>
                        <span className="text-[9px] font-black text-white uppercase tracking-tighter drop-shadow-md">Phone</span>
                    </button>
                    <button onClick={() => setPhoneApp('contacts')} className="flex flex-col items-center gap-2 group">
                        <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-2xl shadow-lg ring-4 ring-blue-500/20 group-hover:scale-110 transition-transform">👤</div>
                        <span className="text-[9px] font-black text-white uppercase tracking-tighter drop-shadow-md">Contacts</span>
                    </button>
                    <button onClick={() => setPhoneApp('pay')} className="flex flex-col items-center gap-2 group">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg ring-4 ring-indigo-600/20 group-hover:scale-110 transition-transform">💸</div>
                        <span className="text-[9px] font-black text-white uppercase tracking-tighter drop-shadow-md">PayUp</span>
                    </button>
                </div>
                {callStatus === 'active' && (
                    <div onClick={() => setPhoneApp('call')} className="mt-auto bg-green-600/40 border border-green-400 p-4 rounded-3xl flex items-center justify-between cursor-pointer animate-pulse mb-10 backdrop-blur-md shadow-xl">
                        <div className="flex items-center gap-3">
                            <div className="text-xl">📞</div>
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-white uppercase tracking-widest">Ongoing Call</span>
                                <span className="text-[10px] text-white font-mono">+91-88-23...</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );

        const renderContactsApp = () => (
            <div className="flex-1 flex flex-col bg-zinc-950">
                <div className="p-6 bg-zinc-900 border-b border-white/5 flex items-center justify-between">
                    <button onClick={() => setPhoneApp('home')} className="text-blue-400 text-xs font-bold">← Back</button>
                    <span className="text-xs font-black text-white uppercase tracking-widest">Contacts</span>
                    <div className="w-8"></div>
                </div>
                <div className="flex-1 p-4 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="p-4 bg-zinc-900 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-zinc-800 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-black">A</div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-white">Arjun</span>
                                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Mobile</span>
                            </div>
                        </div>
                        <button
                            onClick={callRealFriend}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${calledRealFriend ? 'bg-zinc-800 text-zinc-600' : 'bg-green-600 text-white hover:scale-105 shadow-lg shadow-green-500/20'}`}
                            disabled={calledRealFriend}
                        >
                            {calledRealFriend ? 'VERIFIED ✓' : 'CALL'}
                        </button>
                    </div>
                    {['Mom', 'Work (Boss)', 'Sneha'].map(name => (
                        <div key={name} className="p-4 bg-zinc-900/40 rounded-2xl border border-white/5 flex items-center opacity-40 grayscale gap-4">
                            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center font-black text-zinc-600">{name[0]}</div>
                            <span className="text-sm font-bold text-zinc-500">{name}</span>
                        </div>
                    ))}
                </div>
            </div>
        );

        const renderFriendCallApp = () => (
            <div className="flex-1 flex flex-col bg-zinc-950">
                <div className="bg-emerald-900 flex flex-col items-center py-4 rounded-b-3xl shadow-md border-b border-emerald-700">
                    <button onClick={() => setPhoneApp('contacts')} className="absolute left-6 top-10 text-emerald-300 font-bold text-xs hover:text-emerald-200 transition-colors">← Contacts</button>
                    <div className="w-14 h-14 bg-emerald-600 rounded-full flex items-center justify-center text-2xl mb-2 shadow-lg">A</div>
                    <h2 className="text-lg font-bold text-emerald-300 tracking-widest">Arjun</h2>
                    <p className="text-emerald-400 font-mono text-[10px]">+91 98765 XXXXX</p>
                    <span className="text-[8px] text-emerald-200/60 uppercase tracking-widest mt-1">Verified Contact</span>
                </div>
                <div className="flex-1 w-full flex flex-col justify-start p-4 pb-20 gap-3 overflow-y-auto custom-scrollbar">
                    {FRIEND_CONVERSATION.map((msg, idx) => {
                        if (idx > friendCallStep) return null;
                        if (msg.speaker === 'SYSTEM') {
                            return (
                                <div key={idx}
                                    draggable={!!msg.clueId}
                                    onDragStart={(e) => { if (msg.clueId) e.dataTransfer.setData('clueId', msg.clueId); }}
                                    className={`bg-amber-900/30 text-center text-amber-200 p-4 rounded-xl text-[11px] border border-amber-500/30 font-bold ${msg.clueId ? 'cursor-grab border-red-500 bg-red-900/20 text-red-200 animate-pulse border-2' : ''}`}
                                >
                                    {msg.text}
                                </div>
                            );
                        }
                        if (msg.speaker === 'ARJUN') {
                            return (
                                <div key={idx} className="bg-emerald-900/40 text-emerald-100 p-4 rounded-2xl rounded-tl-sm w-5/6 shadow-md border border-emerald-700/50">
                                    <span className="text-[9px] text-emerald-400 font-bold mb-1 block">ARJUN ✓</span>
                                    <span className="text-[11px]">{msg.text}</span>
                                </div>
                            );
                        }
                        return (
                            <div key={idx} className="w-full flex justify-end">
                                <div className="bg-blue-600/80 text-white p-3 rounded-2xl rounded-tr-sm w-5/6 text-left shadow-md border border-blue-500/50 text-[11px]">
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })}
                    {friendCallStep < FRIEND_CONVERSATION.length - 1 ? (
                        <button
                            onClick={advanceFriendCall}
                            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white font-mono text-sm rounded-lg mt-2 shadow-xl transition-colors"
                        >
                            [ Continue... ]
                        </button>
                    ) : (
                        <button
                            onClick={() => { setCalledRealFriend(true); setGameState('room'); showFeedback('💻 I should report this scam on my computer!'); }}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 text-white font-bold text-sm rounded-lg mt-2 shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-colors"
                        >
                            [ End Call ]
                        </button>
                    )}
                    {<div ref={(el) => { el?.scrollIntoView({ behavior: 'smooth' }) }} />}
                </div>
            </div>
        );

        const renderPayApp = () => (
            <div className="flex-1 flex flex-col bg-black">
                <div className="p-6 border-b border-blue-500/20 flex items-center justify-between bg-blue-600/5">
                    <button onClick={() => setPhoneApp('home')} className="text-blue-400 text-xs font-bold">← Home</button>
                    <span className="text-xs font-black text-white uppercase tracking-widest">PayUp Beta</span>
                    <div className="w-8"></div>
                </div>
                <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in duration-700">
                    <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-4xl shadow-2xl ring-8 ring-blue-600/10">💸</div>
                    <div className="space-y-2">
                        <h2 className="text-white font-black text-xl uppercase tracking-tighter leading-none">Confirm Payment</h2>
                        <p className="text-blue-300/40 text-[9px] font-black uppercase tracking-widest">Security ID: PK-88210-9X</p>
                    </div>
                    <div className="w-full bg-slate-900 p-8 rounded-[2rem] border border-white/5 space-y-6 shadow-2xl">
                        <div className="flex flex-col gap-1 items-start text-left">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Receiver</span>
                            <span className="text-white font-bold text-sm">Arjun_Med_Clearance</span>
                        </div>
                        <div className="flex justify-between items-baseline border-t border-white/5 pt-4">
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Total</span>
                            <span className="text-white font-black text-xl tracking-tighter">₹50,000</span>
                        </div>
                        <button
                            onClick={() => {
                                setGameState('scammed');
                            }}
                            className="w-full py-5 bg-blue-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl hover:bg-blue-500 transition-all active:scale-95"
                        >
                            Pay Now
                        </button>
                    </div>
                </div>
            </div>
        );

        return (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center font-sans overflow-hidden">
                {/* Background Context */}
                <div className="absolute inset-0 z-0">
                    <img src="/assets/morning_bed.png" className="w-full h-full object-cover brightness-[0.4]" alt="" />
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
                </div>

                {/* Close phone button */}
                <button onClick={() => setGameState('room')} className="absolute top-8 right-8 z-[1100] px-6 py-3 bg-zinc-800/80 hover:bg-zinc-700 text-white text-xs font-black rounded-full border border-white/10 transition-all backdrop-blur-md">✕ Close Phone</button>

                {/* Feedback toast */}
                {feedbackMsg && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[1100] bg-indigo-600 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest shadow-2xl text-xs animate-in fade-in duration-300">
                        {feedbackMsg}
                    </div>
                )}

                <div className="absolute left-10 inset-y-14 w-[500px] pointer-events-none opacity-40 hover:opacity-100 transition-opacity duration-300">
                    <div
                        onDrop={handleClueDrop}
                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.boxShadow = '0 0 30px rgba(239,68,68,0.4)'; }}
                        onDragLeave={(e) => { e.currentTarget.style.boxShadow = ''; }}
                        className="w-full h-full flex flex-col rounded-xl overflow-hidden pointer-events-auto"
                        style={{ backgroundColor: '#c4956b' }}
                    >
                        <div className="bg-[#2a1810] p-4 flex items-center gap-3 border-b-4 border-[#1a0e08]">
                            <div className="w-6 h-6 bg-red-700 rounded-full flex items-center justify-center text-[10px] border-2 border-red-900">🕵️</div>
                            <div>
                                <h3 className="text-amber-200 font-black text-[10px] uppercase tracking-[0.15em]">Evidence Board</h3>
                                <p className="text-amber-400/50 text-[7px] font-mono">CASE #VOICE-1010</p>
                            </div>
                        </div>
                        <div className="mx-3 mt-3 p-2 border border-dashed border-red-800/30 rounded bg-red-900/10 text-center">
                            <span className="text-[7px] text-red-900/60 font-bold uppercase tracking-wider">📌 Drop clues here</span>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-3 p-3 overflow-y-auto custom-scrollbar">
                            {Object.keys(CLUE_INFO).map((cid, idx) => {
                                const isFound = cluesFound.includes(cid);
                                const rotations = [-1.5, 1, -0.5, 1.5, -1];
                                return (
                                    <div key={cid} className="relative" style={{ transform: `rotate(${rotations[idx]}deg)` }}>
                                        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-10">
                                            <div className={`w-3.5 h-3.5 rounded-full shadow ${isFound ? 'bg-red-600 border border-red-800' : 'bg-zinc-500 border border-zinc-600'}`}></div>
                                        </div>
                                        <div className={`mt-2 p-3 rounded shadow-md border transition-all ${isFound ? 'bg-[#fffef5] border-amber-300/50' : 'bg-stone-200/60 border-stone-300 opacity-50'}`}>
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-lg">{isFound ? CLUE_INFO[cid].icon : '❓'}</span>
                                                {isFound && <span className="px-1.5 py-0.5 bg-red-600 text-white text-[6px] font-black rounded">✓</span>}
                                            </div>
                                            <div className={`text-[8px] font-black uppercase tracking-wider mb-1 ${isFound ? 'text-stone-800' : 'text-stone-500'}`}>
                                                {isFound ? CLUE_INFO[cid].title : 'CLASSIFIED'}
                                            </div>
                                            <p className={`text-[7px] leading-tight ${isFound ? 'text-stone-600' : 'text-stone-400 italic'}`}>
                                                {isFound ? CLUE_INFO[cid].desc : `💡 ${CLUE_INFO[cid].hint}`}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="bg-[#2a1810] p-3 border-t-4 border-[#1a0e08]">
                            <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full transition-all duration-700" style={{ width: `${(cluesFound.length / Object.keys(CLUE_INFO).length) * 100}%` }}></div>
                            </div>
                            <div className="flex justify-between mt-1">
                                <span className="text-[7px] text-amber-300/70 font-bold">{cluesFound.length}/{Object.keys(CLUE_INFO).length} EVIDENCE</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="w-[380px] h-[750px] bg-zinc-950 border-[16px] border-zinc-900 rounded-[4.5rem] shadow-[0_0_120px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-500">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-zinc-900 rounded-b-[2rem] z-[100] flex items-center justify-center gap-4 px-2">
                        <div className="w-12 h-1 bg-zinc-800 rounded-full"></div>
                        <div className="w-3 h-3 bg-zinc-800 rounded-full border border-white/5"></div>
                    </div>

                    <div className="flex-1 flex flex-col relative z-10">
                        {phoneApp === 'home' ? renderHomeScreen() :
                            phoneApp === 'contacts' ? renderContactsApp() :
                                phoneApp === 'friendcall' ? renderFriendCallApp() :
                                    phoneApp === 'pay' ? renderPayApp() :
                                        (
                                            callStatus === 'ringing' ? (
                                                <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-zinc-900/50">
                                                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 animate-pulse shadow-[0_0_80px_rgba(239,68,68,0.1)]">
                                                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-3xl shadow-xl transform hover:scale-110 transition-transform">📞</div>
                                                    </div>
                                                    <h2 className="text-2xl font-black text-white mb-2 tracking-[0.2em] uppercase italic">UNKNOWN</h2>
                                                    <p className="text-zinc-500 font-mono mb-20 text-[10px] tracking-widest opacity-60">+91 88234 XXXXX</p>
                                                    <div className="flex gap-10">
                                                        <button onClick={() => setGameState('room')} className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white shadow-2xl hover:bg-red-500 transition-colors">✕</button>
                                                        <button onClick={startCall} className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white animate-bounce shadow-2xl hover:bg-green-400 transition-colors">✓</button>
                                                    </div>
                                                </div>
                                            ) : callStatus === 'active' ? (
                                                <div className="flex-1 flex flex-col">
                                                    <div className="bg-zinc-900 p-10 flex flex-col items-center border-b border-white/5 relative">
                                                        <button onClick={() => setPhoneApp('home')} className="absolute left-6 top-10 text-blue-400 font-bold text-xs hover:text-blue-300 transition-colors">← App</button>
                                                        <span className="text-[9px] text-green-400 font-black mb-2 tracking-[0.3em] uppercase animate-pulse">INCALL_ACTIVE</span>
                                                        <div className="flex gap-1.5 h-10 items-center mt-2 group">
                                                            {[35, 60, 25, 80, 45, 55, 70, 30, 90, 50, 40, 65, 20, 75, 45].map((h, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="w-1 bg-blue-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                                                                    style={{
                                                                        height: `${h}%`,
                                                                        animationDelay: `${i * 0.08}s`,
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 p-6 overflow-y-auto space-y-5 custom-scrollbar bg-zinc-950/40">
                                                        {chatHistory.map((msg, i) => (
                                                            <div key={i} className={`flex ${msg.type === 'player' ? 'justify-end' : 'justify-start'}`}>
                                                                <div className={`max-w-[90%] p-5 rounded-[2.5rem] text-[11px] font-medium leading-relaxed shadow-2xl ${msg.type === 'player'
                                                                    ? 'bg-indigo-600 text-white rounded-tr-none'
                                                                    : msg.type === 'friend'
                                                                        ? 'bg-emerald-700/60 text-emerald-100 rounded-tl-none border border-emerald-400/20 backdrop-blur-md'
                                                                        : 'bg-zinc-800/60 text-zinc-100 rounded-tl-none border border-white/5 backdrop-blur-md'
                                                                    }`}>
                                                                    {msg.type === 'friend' && <div className="text-[8px] font-black text-emerald-300 uppercase tracking-widest mb-2">✓ Arjun (Verified Contact)</div>}
                                                                    {(msg.type === 'scammer' || msg.type === 'friend') && i === chatHistory.length - 1 && !isTypingDone ? (
                                                                        <span className="opacity-90">{msg.parts.map(p => p.text).join('').slice(0, typingProgress)}<span className="animate-pulse bg-blue-400 w-1.5 h-4 inline-block ml-1 align-middle"></span></span>
                                                                    ) : (
                                                                        (msg.type === 'scammer' || msg.type === 'friend') ? (
                                                                            msg.parts.map((p, pi) => (
                                                                                <span
                                                                                    key={pi}
                                                                                    draggable={!!p.clueId}
                                                                                    onDragStart={(e) => {
                                                                                        if (p.clueId) e.dataTransfer.setData('clueId', p.clueId);
                                                                                    }}
                                                                                    className={p.clueId ? 'border-b-4 border-red-500 bg-red-400/20 cursor-grab px-1 select-none font-black animate-pulse' : p.isHighlighted ? 'text-yellow-400 font-black' : ''}
                                                                                >{p.text}</span>
                                                                            ))
                                                                        ) : msg.text
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        <div ref={el => el?.scrollIntoView({ behavior: 'smooth' })} />
                                                    </div>
                                                    <div className="p-8 bg-black/60 border-t border-white/5 backdrop-blur-xl">
                                                        {showingOptions && (
                                                            <div className="space-y-3">
                                                                {dialogueSequence[dialogueIndex].options.map((opt, i) => (
                                                                    <button key={i} onClick={() => handleOptionClick(opt)} className="w-full text-left p-4 bg-zinc-800/60 hover:bg-indigo-600/40 rounded-3xl text-[10px] font-black text-white border border-white/5 transition-all shadow-xl group flex items-center justify-between">
                                                                        <span>"{opt.text}"</span>
                                                                        <span className="text-white/20 group-hover:text-white transition-colors">▶</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {isTypingDone && !showingOptions && (
                                                            <button onClick={advanceDialogue} className="w-full py-5 bg-indigo-600/10 text-indigo-400 font-black text-[10px] uppercase tracking-[0.4em] rounded-3xl border border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all shadow-lg active:scale-95">Next Segment</button>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col p-12 items-center justify-center text-center space-y-12">
                                                    <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center text-5xl shadow-inner border border-white/5 grayscale opacity-20">☎️</div>
                                                    <div className="space-y-4">
                                                        <h2 className="text-white font-black text-3xl italic tracking-tighter opacity-80">SESSION TERMINATED</h2>
                                                        <p className="text-zinc-600 text-[10px] font-mono tracking-widest uppercase">Encryption Tunnel Closed</p>
                                                    </div>
                                                    <button onClick={() => setPhoneApp('home')} className="w-full py-5 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-[0.3em] rounded-3xl border border-white/5 transition-all text-[9px]">Home Interface</button>
                                                </div>
                                            )
                                        )}

                        {/* Home Bar */}
                        <div onClick={() => setPhoneApp('home')} className="absolute bottom-3 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/10 rounded-full cursor-pointer hover:bg-white/30 transition-all active:scale-x-90"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'laptop') {
        return (
            <div className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center p-10 overflow-hidden">
                <div className="w-full max-w-5xl h-[700px] bg-slate-900 border-[12px] border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden relative font-sans">
                    <div className="bg-slate-950 p-6 border-b border-blue-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white">⚖️</div>
                            <div>
                                <h1 className="text-white font-black italic tracking-tighter text-xl leading-none uppercase">National Cyber Crime Reporting Portal</h1>
                                <p className="text-blue-400 text-[9px] font-mono mt-1 opacity-70 italic tracking-widest">GOVERNMENT OF INDIA • CIVILIAN PORTAL</p>
                            </div>
                        </div>
                        <button onClick={() => setGameState('room')} className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black rounded italic transition-all">CLOSE PORTAL</button>
                    </div>

                    <div className="flex-1 p-12 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-900 to-slate-900">
                        {laptopStep === 'portal' ? (
                            <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in duration-500">
                                <div className="space-y-4">
                                    <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">Protect yourself and others.</h2>
                                    <p className="text-slate-400 text-lg leading-relaxed">Reporting a cyber crime helps authorities track and neutralize scammers using advanced AI tools to clone voices and steal identities.</p>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="p-8 bg-slate-950/50 border border-white/5 rounded-3xl hover:border-blue-500/40 transition-all group">
                                        <h3 className="text-white font-black uppercase text-xs mb-3 flex items-center gap-2"><span>🛡️</span> Identify the Threat</h3>
                                        <p className="text-slate-500 text-xs leading-relaxed">Deepfake voice cloning uses less than 30 seconds of sample audio to mimic anyone's speech patterns.</p>
                                    </div>
                                    <div className="p-8 bg-slate-950/50 border border-white/5 rounded-3xl hover:border-blue-500/40 transition-all group">
                                        <h3 className="text-white font-black uppercase text-xs mb-3 flex items-center gap-2"><span>🔍</span> Document Clues</h3>
                                        <p className="text-slate-500 text-xs leading-relaxed">Submission of artifacts like robotic voice echoes and failed personal authentication is critical.</p>
                                    </div>
                                </div>
                                <button onClick={() => setLaptopStep('reporting')} className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black italic uppercase tracking-[0.2em] rounded-2xl shadow-2xl transition-all animate-pulse">File New Complaint</button>
                            </div>
                        ) : (
                            <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500">
                                <h3 className="text-white font-black text-xs uppercase tracking-widest bg-blue-600/20 px-4 py-2 rounded-full inline-block">Section: AI Fraud Details</h3>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 ml-4">Type of Incident</label>
                                        <select className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none">
                                            <option>AI Voice Cloning / Deepfake Fraud</option>
                                            <option>Identity Impersonation</option>
                                        </select>
                                    </div>
                                    <div className="bg-slate-950 border border-white/10 rounded-2xl p-6">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase mb-4 ml-2">Evidence Detected ({cluesFound.length}/5)</h4>
                                        <div className="space-y-3">
                                            {cluesFound.map(c => (
                                                <div key={c} className="flex items-center gap-3 text-emerald-400 font-bold text-xs bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                                                    <span>✓</span> {CLUE_INFO[c].title}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <button onClick={() => { setGameState('outcome'); }} className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black italic uppercase tracking-[0.2em] rounded-2xl shadow-2xl transition-all">Submit Final Report</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'outcome') {
        return (
            <div className="fixed inset-0 z-[2000] bg-[#0f172a] flex items-center justify-center p-12 overflow-hidden text-center text-white">
                <div className="max-w-4xl space-y-12 animate-in zoom-in-95 duration-1000">
                    <div className="space-y-4">
                        <h1 className="text-[100px] font-black uppercase tracking-tighter italic leading-none">THE_VOICE_IS_GEN</h1>
                        <p className="text-emerald-400 font-mono text-xl tracking-[0.3em] uppercase">Level 10: The Voice That Wasn't Cleared</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-10 rounded-[40px] text-left relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 text-6xl opacity-20 group-hover:scale-110 transition-transform">🤖</div>
                        <h3 className="text-amber-400 font-black italic uppercase text-2xl mb-4 tracking-widest">CYBER_TIP: AI VOICE CLONING</h3>
                        <p className="text-zinc-300 text-lg leading-relaxed font-medium max-w-2xl">
                            Scammers use AI to clone voices of loved ones to create high-pressure emergency scams.
                            Always verify by <span className="text-white font-black underline">asking personal questions</span> or hanging up and <span className="text-white font-black underline">calling from your contacts</span>.
                            Report all such attempts to <span className="text-blue-400 font-black">cybercrime.gov.in</span> or call <span className="text-blue-400 font-black">1930</span>.
                        </p>
                    </div>
                    <button onClick={() => completeLevel(true, 1000, 500)} className="bg-blue-600 hover:bg-blue-500 px-24 py-10 rounded-[60px] text-2xl font-black italic uppercase transition-all shadow-[0_20px_50px_rgba(37,99,235,0.4)]">CONTINUE_TO_END</button>
                </div>
            </div>
        );
    }

    if (gameState === 'scammed') {
        return (
            <div className="fixed inset-0 z-[5000] bg-black flex flex-col items-center justify-center text-center p-12">
                <div className="max-w-3xl space-y-12 animate-in fade-in zoom-in duration-1000">
                    <div className="w-32 h-32 bg-red-600 rounded-full flex items-center justify-center text-6xl mx-auto shadow-[0_0_100px_rgba(239,68,68,0.5)] animate-pulse">💸</div>
                    <div className="space-y-6">
                        <h1 className="text-8xl font-black text-white italic tracking-tighter leading-none">SCAMMED</h1>
                        <p className="text-red-500 font-mono text-xl tracking-[0.2em] uppercase">Level Failed: Victim of AI Voice Fraud</p>
                    </div>
                    <div className="bg-white/5 border border-red-500/20 p-10 rounded-[3rem] text-left">
                        <p className="text-zinc-300 text-lg leading-relaxed font-medium">
                            You transferred <span className="text-white font-black">₹50,000</span> to a scammer using an AI clone of your friend's voice.
                            In the real world, these funds are often unrecoverable within minutes.
                            <br /><br />
                            <span className="text-white font-black uppercase tracking-widest block mb-2 underline decoration-red-500">How to avoid this next time:</span>
                            1. Verify the identity by calling the person <span className="text-red-400">from your contacts</span> directly.<br />
                            2. Ask personal questions that an AI or stranger wouldn't know.<br />
                            3. Never let "emergency" pressure force you into an immediate payment.
                        </p>
                    </div>
                    <button onClick={() => window.location.reload()} className="bg-white text-black px-16 py-6 rounded-full text-xl font-black italic uppercase transition-all hover:scale-105 shadow-2xl">Restart Level</button>
                </div>
            </div>
        );
    }

    return null;
};

export default Level10;
