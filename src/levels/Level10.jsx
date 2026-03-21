import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useGameState } from '../context/GameStateContext';
import Player from '../components/Player';
import InteractionPrompt from '../components/InteractionPrompt';

const ROOM_WIDTH = 1600;
const ROOM_HEIGHT = 1100;
const VIEWPORT_WIDTH = 1200;
const VIEWPORT_HEIGHT = 800;
// Level 10 is phone-only
const PLAYER_SIZE = 40;
const SPEED = 15;


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
    const [reportCallStep, setReportCallStep] = useState(-1);

    const FRIEND_CONVERSATION = [
        { speaker: 'YOU', text: "Hey Arjun, it's me. I just got the weirdest call..." },
        { speaker: 'ARJUN', text: "Heyyy what's up? I was just watching a movie. What call?" },
        { speaker: 'YOU', text: "Someone called me sounding EXACTLY like you. Said you had a bad accident and needed ₹50,000 urgently." },
        { speaker: 'ARJUN', text: "Bro WHAT?! That wasn't me! I'm sitting at home right now. I never called you!" },
        { speaker: 'YOU', text: "I thought so... they mentioned my sister — I don't even have one. And the voice had this weird metallic tone." },
        { speaker: 'ARJUN', text: "Dude that's creepy. Must be one of those AI deepfake scams. Good thing you didn't pay. You should warn your family too and report this on 1930!" },
        { speaker: 'SYSTEM', text: "✅ Arjun confirmed he never called you. This was a deepfake voice scam. Drag this to the evidence board!", isDraggable: true, clueId: 'real_call_confirmed' }
    ];

    const OFFICER_CONVERSATION = [
        { speaker: 'OFFICER', text: "National Cyber Crime Helpline 1930. How can we help you?" },
        { speaker: 'YOU', text: "I just got a suspicious call. Someone tried to clone my friend's voice using AI to ask for money." },
        { speaker: 'OFFICER', text: "I see. This is becoming common. Did you identify any specific red flags or artifacts?" },
        { speaker: 'YOU', text: "Yes, I've noted robotic artifacts and identity errors on my investigation board." },
        { speaker: 'OFFICER', text: "Excellent work. We are logging the voice signature now. Your report will help us track this AI fraud network." },
        { speaker: 'SYSTEM', text: `✅ REPORT FILED. Based on the ${cluesFound.length} piece(s) of evidence you provided, authorities can now trace the scam signature.`, isFinal: true }
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

    // NO MOVEMENT NEEDED - PHONE ONLY
    useEffect(() => {
        if (gameState === 'room') setGameState('phone');
    }, [gameState]);

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
            }
        };

        window.addEventListener('keydown', handleInteractions);
        return () => window.removeEventListener('keydown', handleInteractions);
    }, [gameState]);

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
            showFeedback('📞 I should call Arjun from my contacts to verify this!');
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

    const startReportCall = () => {
        setReportCallStep(0);
        setPhoneApp('reportcall');
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

    const advanceReportCall = () => {
        const nextStep = reportCallStep + 1;
        if (nextStep >= OFFICER_CONVERSATION.length) {
            return;
        }
        setReportCallStep(nextStep);
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

    // NO ROOM RENDER NEEDED
    if (gameState === 'room') return null;

    if (gameState === 'pre_waking_up') {
        return (
            <div className="w-full h-full bg-black flex flex-col items-center justify-center font-mono relative overflow-hidden">
                {/* Immersive Background */}
                <div className="absolute inset-0 z-0 scale-110 blur-sm brightness-[0.3]">
                    <img src="/assets/morning_bed.png" className="w-full h-full object-cover" alt="" />
                </div>

                <div className="relative z-10 space-y-8 text-center animate-pulse">
                    <div className="text-white/20 text-[10px] tracking-[1em] uppercase mb-4">Incoming Call Connection...</div>
                    <div className="text-white text-3xl italic tracking-tighter">"who is calling me at this hour"</div>
                </div>
                {/* InteractionPrompt moved to main return */}
                <InteractionPrompt text="Press E to pick up phone" />
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
                    <button onClick={() => setPhoneApp('upi')} className="flex flex-col items-center gap-2 group">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg ring-4 ring-indigo-600/20 group-hover:scale-110 transition-transform text-white">₹</div>
                        <span className="text-[9px] font-black text-white uppercase tracking-tighter drop-shadow-md">UPI Pay</span>
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
                                    onDragStart={(e) => { 
                                        if (msg.clueId) {
                                            e.dataTransfer.setData('clueId', msg.clueId);
                                            showFeedback("Dragging Evidence...");
                                        }
                                    }}
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
                            onClick={() => { setCalledRealFriend(true); setPhoneApp('home'); showFeedback('🚨 I should report this on 1930 now!'); }}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 text-white font-bold text-sm rounded-lg mt-2 shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-colors"
                        >
                            [ End Call ]
                        </button>
                    )}
                    {<div ref={(el) => { el?.scrollIntoView({ behavior: 'smooth' }) }} />}
                </div>
            </div>
        );

        const renderReportCallApp = () => (
            <div className="flex-1 flex flex-col bg-slate-950">
                <div className="bg-red-950 flex flex-col items-center py-4 rounded-b-3xl shadow-md border-b border-red-800">
                    <button onClick={() => setPhoneApp('home')} className="absolute left-6 top-10 text-red-300 font-bold text-xs hover:text-red-200 transition-colors">← Home</button>
                    <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-2xl mb-2 shadow-lg animate-pulse">👮</div>
                    <h2 className="text-lg font-bold text-red-300 tracking-widest leading-none">Cyber Helpline</h2>
                    <p className="text-red-400 font-mono text-[10px] mt-1">DIALING 1930...</p>
                </div>
                <div className="flex-1 w-full flex flex-col justify-start p-4 pb-20 gap-3 overflow-y-auto custom-scrollbar">
                    {OFFICER_CONVERSATION.map((msg, idx) => {
                        if (idx > reportCallStep) return null;
                        if (msg.speaker === 'SYSTEM') {
                            return (
                                <div key={idx} className="bg-emerald-900/30 text-center text-emerald-200 p-4 rounded-xl text-[11px] border border-emerald-500/30 font-bold animate-in fade-in zoom-in duration-500">
                                    {msg.text}
                                </div>
                            );
                        }
                        if (msg.speaker === 'OFFICER') {
                            return (
                                <div key={idx} className="bg-slate-900 text-slate-100 p-4 rounded-2xl rounded-tl-sm w-5/6 shadow-md border border-slate-700">
                                    <span className="text-[9px] text-red-400 font-black mb-1 block uppercase tracking-widest">OFFICER #882</span>
                                    <span className="text-[11px] font-medium">{msg.text}</span>
                                </div>
                            );
                        }
                        return (
                            <div key={idx} className="w-full flex justify-end">
                                <div className="bg-blue-600/80 text-white p-3 rounded-2xl rounded-tr-sm w-5/6 text-left shadow-md border border-blue-500/50 text-[11px] font-medium">
                                    {msg.text}
                                </div>
                            </div>
                        );
                    })}
                    {reportCallStep < OFFICER_CONVERSATION.length - 1 ? (
                        <button
                            onClick={advanceReportCall}
                            className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white font-mono text-sm rounded-xl mt-2 shadow-xl transition-all active:scale-95"
                        >
                            [ Continue Report... ]
                        </button>
                    ) : (
                        <button
                            onClick={() => { setGameState('outcome'); }}
                            className="w-full py-5 bg-red-600 hover:bg-red-500 border border-red-400 text-white font-black text-sm rounded-xl mt-2 shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all animate-bounce uppercase tracking-widest"
                        >
                            [ Finish Investigation ]
                        </button>
                    )}
                    <div ref={(el) => { el?.scrollIntoView({ behavior: 'smooth' }) }} />
                </div>
            </div>
        );

        const renderUPIApp = () => (
            <div className="flex-1 flex flex-col bg-slate-50">
                <div className="p-6 bg-indigo-600 text-white flex items-center gap-4">
                    <button onClick={() => setPhoneApp('home')} className="text-white font-bold">←</button>
                    <span className="font-black uppercase tracking-widest text-[10px]">Secure UPI Pay</span>
                </div>
                <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-3xl shadow-inner text-indigo-600 font-black italic">₹</div>
                    <div>
                        <h3 className="text-slate-900 font-black text-xl italic uppercase tracking-tighter">Pay Arjun</h3>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Ref: Medical Emergency</p>
                    </div>
                    <div className="py-4 px-8 bg-white rounded-3xl border-2 border-slate-100 shadow-sm">
                        <div className="text-4xl font-black text-slate-900 italic tracking-tighter">₹50,000</div>
                    </div>
                    <button 
                        onClick={() => setGameState('scammed')}
                        className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl transition-all transform active:scale-95 text-[10px]"
                    >
                        Confirm & Send
                    </button>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Powered by NPCI • Secure Encryption</p>
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


                {/* Feedback toast */}
                {feedbackMsg && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[1100] bg-indigo-600 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest shadow-2xl text-xs animate-in fade-in duration-300">
                        {feedbackMsg}
                    </div>
                )}

                {/* Missions Panel */}
                <div className="absolute right-10 top-14 z-[300] w-64 bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl animate-in slide-in-from-right duration-700">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-2 h-6 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Active Missions</h3>
                    </div>
                    <ul className="space-y-4">
                        {(() => {
                            const missions = [
                                { id: 'answer', text: 'Answer Unknown Call', completed: chatHistory.length > 0 || callStatus === 'active', unlocked: true },
                                { id: 'evidence', text: 'Pin 2+ Evidence Clues', completed: cluesFound.length >= 2, unlocked: chatHistory.length > 0 || callStatus === 'active' },
                                { id: 'arjun', text: 'Confirm with Arjun', completed: calledRealFriend, unlocked: cluesFound.length >= 2 },
                                { id: 'report', text: 'Dial 1930 to Report', completed: reportCallStep >= 0, unlocked: calledRealFriend }
                            ];
                            return missions.map(m => (
                                <li key={m.id} className={`flex items-start gap-3 group transition-all duration-500 ${m.unlocked ? 'opacity-100' : 'opacity-20 grayscale cursor-not-allowed'}`}>
                                    <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                                        m.completed ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 
                                        m.unlocked ? 'border-white/20 group-hover:border-white/40' : 'border-white/5 bg-white/5'
                                    }`}>
                                        {m.completed ? (
                                            <span className="text-white text-[10px] font-black">✓</span>
                                        ) : !m.unlocked ? (
                                            <span className="text-white/20 text-[8px]">🔒</span>
                                        ) : null}
                                    </div>
                                    <span className={`text-[11px] font-bold tracking-tight transition-colors duration-500 ${
                                        m.completed ? 'text-emerald-400/80 line-through decoration-emerald-500/50' : 
                                        m.unlocked ? 'text-zinc-300 group-hover:text-white' : 'text-zinc-600'
                                    }`}>
                                        {m.text}
                                    </span>
                                </li>
                            ));
                        })()}
                    </ul>
                    <div className="mt-8 pt-6 border-t border-white/5">
                        <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-tighter">Objective: Secure your identity and report the AI fraud.</p>
                    </div>
                </div>

                <div className="absolute left-10 inset-y-14 w-[500px] z-[200] flex flex-col rounded-sm border-[8px] border-[#382315] overflow-hidden shadow-2xl"
                    onDrop={handleClueDrop}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.boxShadow = 'inset 0 0 50px rgba(239,68,68,0.3), 0 0 30px rgba(239,68,68,0.5)'; }}
                    onDragLeave={(e) => { e.currentTarget.style.boxShadow = 'inset 0 0 50px rgba(0,0,0,0.5)'; }}
                    style={{
                        backgroundImage: `
                            url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23a)' opacity='.3'/%3E%3C/svg%3E"),
                            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139,69,19,0.05) 2px, rgba(139,69,19,0.05) 4px),
                            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,69,19,0.05) 2px, rgba(139,69,19,0.05) 4px)
                        `,
                        backgroundColor: '#9A6A45',
                        boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)'
                    }}
                >
                    <div className="bg-[#EED09D] p-2 pl-4 pr-6 rounded-t-sm shadow-lg transform -rotate-1 border-b border-[#D7B77E] w-fit mt-3 ml-3 relative before:absolute before:content-[''] before:top-0 before:right-[-15px] before:w-4 before:h-full before:bg-[#EED09D] before:skew-x-[20deg] before:origin-bottom">
                        <h3 className="text-xs font-black text-[#5C4033] uppercase tracking-[0.1em] font-mono">Case Evidence</h3>
                    </div>

                    <div className="flex-1 w-full h-full p-4 relative overflow-y-auto no-scrollbar pt-6">
                        {Object.keys(CLUE_INFO).map((cid, idx) => {
                            const isFound = cluesFound.includes(cid);
                            const positions = [
                                { left: 10, top: 0, rotate: -1.5 },
                                { left: 240, top: 20, rotate: 2 },
                                { left: 20, top: 140, rotate: -2 },
                                { left: 250, top: 160, rotate: 1 },
                                { left: 130, top: 280, rotate: 0.5 },
                            ];
                            const pos = positions[idx];
                            return (
                                <div
                                    key={cid}
                                    className={`absolute pt-4 px-4 pb-4 shadow-2xl w-[225px] border transition-all duration-500 ${isFound ? 'bg-[#FAFAFA] border-stone-200' : 'bg-stone-300/40 backdrop-blur-[1px] border-dashed border-stone-400 opacity-70'}`}
                                    style={{ left: pos.left - 20, top: pos.top + 10, transform: `rotate(${pos.rotate}deg)` }}
                                >
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20">
                                        <div className={`w-5 h-5 rounded-full shadow-md border flex items-center justify-center relative ${isFound ? 'bg-gradient-to-br from-red-400 to-red-700 border-red-800' : 'bg-stone-400 border-stone-600'}`}>
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/40 absolute top-0.5 right-0.5"></div>
                                        </div>
                                    </div>
                                    <h4 className={`font-bold tracking-tight mb-1.5 text-[11px] leading-tight border-b pb-1.5 uppercase font-mono ${isFound ? 'text-red-900 border-stone-300' : 'text-stone-600 border-stone-400/50'}`}>
                                        {isFound ? CLUE_INFO[cid].title : "PENDING"}
                                    </h4>
                                    <p className={`text-[10px] leading-tight ${isFound ? 'text-stone-700 font-serif' : 'text-stone-500 italic font-serif'}`}>
                                        {isFound ? CLUE_INFO[cid].desc : `💡 ${CLUE_INFO[cid].hint}`}
                                    </p>
                                </div>
                            );
                        })}
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
                                phoneApp === 'upi' ? renderUPIApp() :
                                    phoneApp === 'friendcall' ? renderFriendCallApp() :
                                        phoneApp === 'reportcall' ? renderReportCallApp() :
                                        (
                                            callStatus === 'ringing' ? (
                                                <div className="flex-1 flex flex-col items-center pt-24 pb-20 justify-between bg-zinc-950 relative overflow-hidden animate-in fade-in duration-700">
                                                    {/* Premium Background Effects */}
                                                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-transparent to-black/40"></div>
                                                    <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[40%] bg-blue-500/5 blur-[100px] rounded-full animate-pulse"></div>

                                                    <div className="relative z-10 text-center space-y-4">
                                                        <div className="relative w-32 h-32 mx-auto mb-8">
                                                            {/* Concentric Pulsing Rings */}
                                                            <div className="absolute inset-0 bg-white/5 rounded-full animate-ping [animation-duration:3s]"></div>
                                                            <div className="absolute inset-0 bg-white/5 rounded-full animate-ping [animation-duration:2s] delay-700"></div>
                                                            <div className="absolute inset-0 bg-white/5 rounded-full animate-ping [animation-duration:4s] delay-1000"></div>
                                                            
                                                            <div className="relative w-full h-full bg-zinc-800 rounded-full flex items-center justify-center text-5xl shadow-2xl border border-white/10 ring-8 ring-white/5 z-20">
                                                                <span className="animate-pulse opacity-80">👤</span>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1">
                                                            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-lg">UNKNOWN</h2>
                                                            <p className="text-zinc-500 font-mono text-xs tracking-[0.3em] uppercase opacity-70">+91 88234 XXXXX</p>
                                                            <div className="mt-4 inline-block px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
                                                                <div className="text-red-500 text-[9px] font-black uppercase tracking-[0.2em] italic animate-pulse flex items-center gap-1.5">
                                                                    <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                                                    Potential Scam Alert
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="relative z-10 w-full px-12 pb-10 flex justify-between items-end">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <button 
                                                                onClick={() => showFeedback("Urgent: This call cannot be ignored.")}
                                                                className="w-20 h-20 bg-zinc-800/80 border border-white/5 rounded-full flex items-center justify-center shadow-xl hover:bg-zinc-700 transition-all transform active:scale-95 group opacity-60"
                                                            >
                                                                <div className="text-3xl text-red-500 -rotate-[135deg] group-active:animate-shake">📞</div>
                                                            </button>
                                                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Decline</span>
                                                        </div>

                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="absolute inset-x-0 bottom-24 flex justify-end px-16 pointer-events-none">
                                                                <div className="w-16 h-16 bg-green-500/30 rounded-full animate-ping [animation-duration:1.5s]"></div>
                                                            </div>
                                                            <button 
                                                                onClick={startCall}
                                                                className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(22,163,74,0.4)] hover:bg-green-500 transition-all transform hover:scale-110 active:scale-90 ring-8 ring-green-600/20"
                                                            >
                                                                <div className="text-3xl text-white">📞</div>
                                                            </button>
                                                            <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] animate-pulse">Accept</span>
                                                        </div>
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
                                                                                        if (p.clueId) {
                                                                                            e.dataTransfer.setData('clueId', p.clueId);
                                                                                            showFeedback("Dragging Evidence...");
                                                                                        }
                                                                                    }}
                                                                                    className={p.clueId ? 'border-b-4 border-red-500 bg-red-400/20 cursor-grab px-1 select-none font-black animate-pulse transition-all hover:bg-red-400/40' : p.isHighlighted ? 'text-yellow-400 font-black' : ''}
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
                                                            <button 
                                                                onClick={advanceDialogue} 
                                                                className={`w-full py-5 font-black text-[10px] uppercase tracking-[0.4em] rounded-3xl border transition-all shadow-lg active:scale-95 ${dialogueIndex >= dialogueSequence.length - 1 ? 'bg-red-600/20 text-red-500 border-red-500/30 hover:bg-red-600 hover:text-white' : 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-600 hover:text-white'}`}
                                                            >
                                                                {dialogueIndex >= dialogueSequence.length - 1 ? '[ Hang Up Call ]' : 'Next Segment'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex flex-col bg-zinc-950">
                                                    <div className="p-8 border-b border-white/5">
                                                        <h2 className="text-white font-black text-2xl uppercase tracking-tighter">Recents</h2>
                                                    </div>
                                                    <div className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                                                        {/* Arjun - Verify Call */}
                                                        <div className="p-4 bg-zinc-900/60 rounded-2xl border border-white/5 flex items-center justify-between group">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center font-black">A</div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-white">Arjun</span>
                                                                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Mobile • 2m ago</span>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                onClick={callRealFriend}
                                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20"
                                                            >
                                                                CALL
                                                            </button>
                                                        </div>

                                                        {/* 1930 Helpline - Report */}
                                                        <div className={`p-4 bg-zinc-900/60 rounded-2xl border border-white/5 flex items-center justify-between group transition-opacity ${calledRealFriend ? 'opacity-100' : 'opacity-40'}`}>
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center font-black">🚨</div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-bold text-white">1930 Helpline</span>
                                                                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono">Cyber Crime Help</span>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                onClick={startReportCall}
                                                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-500/20"
                                                                disabled={!calledRealFriend}
                                                            >
                                                                REPORT
                                                            </button>
                                                        </div>

                                                        {/* Unknown - Scammer */}
                                                        <div className="p-4 bg-zinc-900/20 rounded-2xl border border-white/5 flex items-center opacity-40 grayscale gap-4">
                                                            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center font-black text-red-500">?</div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-zinc-500">UNKNOWN</span>
                                                                <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-mono">VOICE SCAM • 10m ago</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="p-6">
                                                        <button onClick={() => setPhoneApp('home')} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-[0.3em] rounded-2xl border border-white/5 transition-all text-[9px]">Exit Phone</button>
                                                    </div>
                                                </div>
                                            )
                                        )}

                        {/* Home Bar */}
                        <div onClick={() => setPhoneApp('home')} className="absolute bottom-3 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/10 rounded-full cursor-pointer hover:bg-white/30 transition-all active:scale-x-90"></div>
                    </div>
                </div>

                {/* Dynamic Interaction Prompt */}
                {(() => {
                    let promptText = null;
                    if (chatHistory.length > 0 && !calledRealFriend) {
                        promptText = "Should I call Arjun from my contacts to verify?";
                    } else if (calledRealFriend && reportCallStep < 0) {
                        promptText = "I should dial 1930 to report this scam!";
                    }
                    return promptText ? <InteractionPrompt text={promptText} /> : null;
                })()}
            </div>
        );
    }

    // No more laptop state
    if (gameState === 'laptop') return null;

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
