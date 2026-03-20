import React, { useState, useEffect, useCallback, useRef } from 'react';
import Player from '../components/Player';
import { useGameState } from '../context/GameStateContext';
import InteractionPrompt from '../components/InteractionPrompt';

const ROOM_WIDTH = 1200;
const ROOM_HEIGHT = 800;
const LIVING_ROOM_WIDTH = 1600;
const LIVING_ROOM_HEIGHT = 1100;
const SPEED = 9;
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

const Level4 = () => {
    const { completeLevel, adjustAssets, adjustLives, playTitleCardSound } = useGameState();
    const [playerPos, setPlayerPos] = useState({ x: 500, y: 350 }); // Spawn slightly next to the desk
    const [livingRoomPlayerPos, setLivingRoomPlayerPos] = useState({ x: 1450, y: 550 }); // Spawns near RIGHT door (from study)
    const [bedroomPlayerPos, setBedroomPlayerPos] = useState({ x: 600, y: 700 }); // Starts at bottom door in bedroom
    const [keys, setKeys] = useState({});

    // NEW SEQUENCE STATES: study_pov -> study_walk -> living_room -> bedroom_walk -> sleep_pov -> title_card -> sms_ui -> ...
    const [gameState, setGameState] = useState('study_pov');
    const [canInteract, setCanInteract] = useState(false);
    const [interactionTarget, setInteractionTarget] = useState(null);
    const [feedbackMsg, setFeedbackMsg] = useState(null);
    const [cluesFound, setCluesFound] = useState([]);
    const [isDetectiveModeOpen, setIsDetectiveModeOpen] = useState(true);
    const [permissionStep, setPermissionStep] = useState(0);
    const [clickedSmsLink, setClickedSmsLink] = useState(false);
    const [reportReason, setReportReason] = useState(null);

    // CINEMATIC TRANSITION STATE
    const [isTransitioning, setIsTransitioning] = useState(true);
    const [titleCardStep, setTitleCardStep] = useState(0);
    const [phonePickupStep, setPhonePickupStep] = useState(0);
    const [outroSuccess, setOutroSuccess] = useState(false);
    const [outroStep, setOutroStep] = useState(0);

    // PORTAL STATE
    const [portalStep, setPortalStep] = useState(0);
    const [portalAttached, setPortalAttached] = useState(false);
    const [isPortalSubmitting, setIsPortalSubmitting] = useState(false);

    // MINI GAME STATE
    const [miniGameOver, setMiniGameOver] = useState(false);
    const [miniGameMsg, setMiniGameMsg] = useState('');
    const [unassignedApps, setUnassignedApps] = useState(MINI_GAME_APPS);
    const [safeBucket, setSafeBucket] = useState([]);
    const [maliciousBucket, setMaliciousBucket] = useState([]);

    const handleDragStart = (e, app) => {
        e.dataTransfer.setData('appId', app.id);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, type) => {
        const appId = e.dataTransfer.getData('appId');
        const app = unassignedApps.find(a => a.id === parseInt(appId));
        if (!app) return;

        setUnassignedApps(prev => prev.filter(a => a.id !== app.id));
        if (type === 'safe') setSafeBucket(prev => [...prev, app]);
        else setMaliciousBucket(prev => [...prev, app]);
    };

    const checkMiniGame = () => {
        const wrongSafe = safeBucket.some(a => !a.safe);
        const wrongMalicious = maliciousBucket.some(a => a.safe);

        if (wrongSafe || wrongMalicious) {
            setMiniGameMsg('Some apps were sorted incorrectly. Be more careful!');
        } else {
            setMiniGameMsg('Perfect sorting! You clearly know how to spot fakes!');
        }
        setMiniGameOver(true);
    };

    const triggerTransition = (newState, delay = 500) => {
        setIsTransitioning(true);
        setTimeout(() => {
            if (newState) setGameState(newState);
            setTimeout(() => setIsTransitioning(false), 200);
        }, delay);
    };

    useEffect(() => {
        const timer = setTimeout(() => setIsTransitioning(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const usedClueBoard = cluesFound.length >= 3;

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
            if (e.key.toLowerCase() === 'e') {
                if (gameState === 'study_pov') triggerTransition('study_walk');
                else if (gameState === 'study_walk' && interactionTarget === 'exit') {
                    playDoorSound();
                    triggerTransition('living_room');
                } else if (gameState === 'living_room' && interactionTarget === 'bedroom') {
                    playDoorSound();
                    triggerTransition('bedroom_walk');
                } else if (gameState === 'bedroom_walk' && interactionTarget === 'sleep') {
                    triggerTransition('sleep_pov');
                } else if (gameState === 'phone_pickup_pov' && phonePickupStep >= 4) triggerTransition('sms_ui');
                else if (gameState === 'outro_pov_1') triggerTransition('outro_pov_2');
                else if (gameState === 'walk' && canInteract) setGameState('sms_ui'); // Legacy check
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [gameState, interactionTarget, canInteract, phonePickupStep]);

    const footstepAudioRef = useRef(null);

    useEffect(() => {
        const audio = new Audio('/audio/foot.m4a');
        audio.loop = true;
        audio.volume = 0.5;
        footstepAudioRef.current = audio;
        return () => {
            audio.pause();
            audio.src = '';
        };
    }, []);

    useEffect(() => {
        const isWalkingState = ['walk', 'study_walk', 'living_room', 'bedroom_walk'].includes(gameState);
        const isMoving = keys['w'] || keys['s'] || keys['a'] || keys['d'] || 
                         keys['arrowup'] || keys['arrowdown'] || keys['arrowleft'] || keys['arrowright'];
        
        if (isWalkingState && isMoving) {
            if (footstepAudioRef.current && footstepAudioRef.current.paused) {
                footstepAudioRef.current.play().catch(e => console.log('Audio play failed:', e));
            }
        } else {
            if (footstepAudioRef.current && !footstepAudioRef.current.paused) {
                footstepAudioRef.current.pause();
            }
        }
    }, [keys, gameState]);

    // PROCEDURAL AUDIO SYNTHESIZER
    const audioCtxRef = useRef(null);

    const getAudioContext = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtxRef.current;
    };

    const playSynthSound = (type) => {
        try {
            const ctx = getAudioContext();
            if (ctx.state === 'suspended') ctx.resume();

            switch (type) {
                case 'noti_buzz': {
                    const osc1 = ctx.createOscillator();
                    const osc2 = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc1.frequency.setValueAtTime(880, ctx.currentTime);
                    osc2.frequency.setValueAtTime(1320, ctx.currentTime);
                    gain.gain.setValueAtTime(0, ctx.currentTime);
                    gain.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 0.05);
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
                    // Double pulse pattern
                    gain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.05);
                    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
                    gain.gain.linearRampToValueAtTime(1.0, ctx.currentTime + 0.25);
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
            }
        } catch(e) { console.error('Synth sound failed', e); }
    };

    const playDoorSound = () => {
        try {
            const audio = new Audio('/audio/home door.mp3');
            audio.volume = 0.6;
            audio.play().catch(e => console.log('Door sound failed:', e));
        } catch(e) {}
    };

    useEffect(() => {
        if (!['walk', 'study_walk', 'living_room', 'bedroom_walk'].includes(gameState)) return;
        let frameId;
        const loop = () => {
            if (gameState === 'walk' || gameState === 'study_walk') {
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

                    let target = null;
                    if (Math.abs(nx - 600) < 150 && ny > ROOM_HEIGHT - 100) target = 'exit';
                    setInteractionTarget(target);
                    setCanInteract(checkCollision(nx, ny, { x: DESK_ZONE.x - 30, y: DESK_ZONE.y - 30, w: DESK_ZONE.w + 60, h: DESK_ZONE.h + 60 }));
                    return { x: nx, y: ny };
                });
            } else if (gameState === 'living_room') {
                setLivingRoomPlayerPos(p => {
                    let nx = p.x, ny = p.y;
                    if (keys['w'] || keys['arrowup']) ny -= SPEED;
                    if (keys['s'] || keys['arrowdown']) ny += SPEED;
                    if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                    if (keys['d'] || keys['arrowright']) nx += SPEED;

                    nx = Math.max(120, Math.min(nx, LIVING_ROOM_WIDTH - 120));
                    ny = Math.max(120, Math.min(ny, LIVING_ROOM_HEIGHT - 120));

                    let target = null;
                    if (Math.abs(nx - 800) < 150 && ny > LIVING_ROOM_HEIGHT - 150) target = 'bedroom'; // bottom exit
                    setInteractionTarget(target);

                    return { x: nx, y: ny };
                });
            } else if (gameState === 'bedroom_walk') {
                setBedroomPlayerPos(p => {
                    let nx = p.x, ny = p.y;
                    if (keys['w'] || keys['arrowup']) ny -= SPEED;
                    if (keys['s'] || keys['arrowdown']) ny += SPEED;
                    if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                    if (keys['d'] || keys['arrowright']) nx += SPEED;
                    nx = Math.max(0, Math.min(nx, ROOM_WIDTH - PLAYER_SIZE));
                    ny = Math.max(120, Math.min(ny, ROOM_HEIGHT - PLAYER_SIZE));

                    let target = null;
                    if (Math.abs(nx - 600) < 150 && ny < 400) target = 'sleep';
                    setInteractionTarget(target);

                    return { x: nx, y: ny };
                });
            }
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

    // ─── FEEDBACK TOAST ───
    const FeedbackToast = () => feedbackMsg ? (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] bg-amber-500 text-black font-bold px-8 py-3 rounded-full shadow-2xl animate-bounce text-lg">
            {feedbackMsg}
        </div>
    ) : null;

    const [showText, setShowText] = useState(false);
    const [dimScreen, setDimScreen] = useState(false);
    useEffect(() => {
        if (gameState === 'sleep_pov') {
            const t1 = setTimeout(() => setShowText(true), 2000);
            const t2 = setTimeout(() => setDimScreen(true), 4500);
            // Fallback transition
            const t3 = setTimeout(() => {
                if (gameState === 'sleep_pov') triggerTransition('title_card');
            }, 8000);
            return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
        }
        if (gameState === 'title_card') {
            playTitleCardSound();
            const t3 = setTimeout(() => {
                triggerTransition('phone_pickup_pov', 500);
            }, 4000);
            return () => clearTimeout(t3);
        }
        if (gameState === 'phone_pickup_pov') {
            const t1 = setTimeout(() => {
                playSynthSound('noti_buzz');
                playSynthSound('noti_vibration');
                setPhonePickupStep(1);
            }, 1000);
            const t2 = setTimeout(() => setPhonePickupStep(2), 3000);
            const t3 = setTimeout(() => setPhonePickupStep(3), 5000);
            const t4 = setTimeout(() => setPhonePickupStep(4), 7000);
            return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
        }
        if (gameState === 'outro_pov_2') {
            const t1 = setTimeout(() => setOutroStep(1), 1000);
            const t2 = setTimeout(() => setOutroStep(2), 5000);
            const t3 = setTimeout(() => triggerTransition('end_card'), 9000);
            return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
        }
        if (gameState === 'end_card') {
            const t1 = setTimeout(() => setOutroStep(3), 100);
            const t2 = setTimeout(() => setOutroStep(4), 4000);
            const t3 = setTimeout(() => setOutroStep(5), 5500);
            const t4 = setTimeout(() => {
                const pts = !outroSuccess ? 0 : 10 + (!clickedSmsLink ? 10 : 0) + (usedClueBoard ? 5 : 0);
                completeLevel(outroSuccess, pts, 0);
            }, 9000);
            return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
        }
    }, [gameState, outroSuccess, clickedSmsLink, usedClueBoard, completeLevel]);

    // ═══════════════════════════════════════════
    // NEW INTRO SEQUENCE STATES
    // ═══════════════════════════════════════════

    const renderContent = () => {
        if (gameState === 'study_pov') {
        return (
            <div className="absolute inset-0 z-[2000] overflow-hidden bg-black animate-fadeIn">
                {/* GLOBAL TRANSITION FADE */}
                <div className={`absolute inset-0 bg-black z-[9999] transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
                <div className="w-full h-full bg-cover bg-center animate-fieldZoom relative" style={{ backgroundImage: 'url("/assets/temppho.png")' }}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none" />

                    {/* Ultra-Minimalist Cinematic Prompt */}
                    <InteractionPrompt text="Press E to get down from the chair" />
                </div>
            </div>
        );
    }

    if (gameState === 'study_walk' || gameState === 'walk') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950 px-8">
                {/* GLOBAL TRANSITION FADE */}
                <div className={`absolute inset-0 bg-black z-[9999] transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
                <FeedbackToast />
                <div className="relative bg-zinc-800 border-8 border-zinc-900 shadow-2xl overflow-hidden" style={{ width: ROOM_WIDTH, height: ROOM_HEIGHT }}>
                    <div className="absolute inset-0 z-0" style={{ backgroundImage: "url('/assets/study.png')", backgroundSize: 'cover', backgroundPosition: 'center' }} />

                    {!interactionTarget && (
                        <InteractionPrompt showKey={false} text="Go to the living room" />
                    )}

                    <Player x={playerPos.x} y={playerPos.y} />

                    {interactionTarget === 'exit' && (
                        <InteractionPrompt text="Press E to exit the room" />
                    )}

                    <div className="absolute top-4 left-4 z-30 bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-700/50">
                        <p className="text-amber-400 font-bold text-xs tracking-widest uppercase">DAY 4 — NIGHT</p>
                        <p className="text-slate-400 text-[10px] font-mono">THATHA'S STUDY</p>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'living_room') {
        const VIEWPORT_WIDTH = 1200;
        const VIEWPORT_HEIGHT = 800;
        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950 px-8 animate-in fade-in duration-1000 font-sans relative overflow-hidden">
                {/* GLOBAL TRANSITION FADE */}
                <div className={`absolute inset-0 bg-black z-[9999] transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
                <div className="relative border-8 border-slate-900 shadow-2xl overflow-hidden bg-zinc-900" style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}>
                    <div className="absolute inset-0" style={{ width: LIVING_ROOM_WIDTH, height: LIVING_ROOM_HEIGHT, transform: `translate(${-(Math.max(0, Math.min(livingRoomPlayerPos.x - VIEWPORT_WIDTH / 2, LIVING_ROOM_WIDTH - VIEWPORT_WIDTH)))}px, ${-(Math.max(0, Math.min(livingRoomPlayerPos.y - VIEWPORT_HEIGHT / 2, LIVING_ROOM_HEIGHT - VIEWPORT_HEIGHT)))}px)`, backgroundColor: '#2c3e50', willChange: 'transform' }}>
                        {/* Wood Floor */}
                        <div className="absolute inset-0 opacity-80" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(0,0,0,0.2) 38px, rgba(0,0,0,0.2) 40px)' }}></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 pointer-events-none z-10"></div>

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
                        <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-[60px] h-[180px] bg-[#8a5a44] border-4 border-black border-r-0 p-3 flex flex-col items-center justify-center z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] opacity-80 transition-all`}>
                            <div className="text-[9px] text-white/60 font-black rotate-90 mb-8 tracking-[0.3em]">STUDY</div>
                            <div className="w-[30px] h-[80px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                            <div className="absolute left-2 bottom-6 w-1 h-6 bg-black"></div>
                        </div>

                        {/* Bottom Double Door (Bedroom Exit) */}
                        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[240px] h-[80px] bg-[#8a5a44] border-4 border-black border-b-0 flex z-10 ${interactionTarget === 'bedroom' ? 'opacity-100 scale-105' : 'opacity-80'} transition-all`}>
                            <div className="flex-1 border-r-2 border-black p-2 flex items-center justify-center text-[10px] text-white font-bold uppercase tracking-widest bg-emerald-900/20">BEDROOM</div>
                            <div className="flex-1 border-l-2 border-black p-2 flex items-center justify-center">
                                <div className="w-[80px] h-[50px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                            </div>
                            <div className="absolute top-[40px] left-[110px] w-4 h-1 bg-black"></div>
                            <div className="absolute top-[40px] right-[110px] w-4 h-1 bg-black"></div>
                        </div>

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

                        {/* SOFA */}
                        <div className="absolute right-[480px] top-1/2 -translate-y-1/2 w-[140px] h-[320px] bg-[#445265] border-4 border-black flex flex-row items-center justify-start z-20 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
                            <div className="w-[80px] h-full flex flex-col justify-center items-start pl-2 gap-4">
                                <div className="w-[60px] h-[100px] bg-[#364253] border-2 border-black ml-2 mt-2 shadow-inner"></div>
                                <div className="w-[60px] h-[100px] bg-[#364253] border-2 border-black ml-2 mb-2 shadow-inner"></div>
                            </div>
                            <div className="absolute right-0 top-0 bottom-0 w-[40px] bg-[#4a586e] border-l-[3px] border-black shadow-inner"></div>
                            <div className="absolute top-0 left-0 w-[100px] h-[30px] bg-[#4a586e] border-b-[3px] border-black shadow-inner"></div>
                            <div className="absolute bottom-0 left-0 w-[100px] h-[30px] bg-[#4a586e] border-t-[3px] border-black shadow-inner"></div>
                            <div className="absolute -bottom-8 left-4 right-4 h-8 bg-black/40 blur-xl rounded-full -z-10"></div>
                        </div>

                        {/* COFFEE TABLE */}
                        <div className="absolute left-[740px] top-1/2 -translate-y-1/2 w-[100px] h-[180px] bg-[#383a48]/90 backdrop-blur-md border-4 border-[#222938] z-20 shadow-2xl flex items-center justify-center">
                            <div className="w-[80px] h-[160px] border border-white/10"></div>
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

                        <Player x={livingRoomPlayerPos.x} y={livingRoomPlayerPos.y} />
                    </div>

                    {!interactionTarget && (
                        <InteractionPrompt showKey={false} text="Go to the bedroom" />
                    )}

                    {interactionTarget === 'bedroom' && (
                        <InteractionPrompt text="Press E to enter bedroom" />
                    )}
                </div>
            </div>
        );
    }

    if (gameState === 'bedroom_walk') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950 px-8 relative overflow-hidden">
                {/* GLOBAL TRANSITION FADE */}
                <div className={`absolute inset-0 bg-black z-[9999] transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
                <div className="relative border-8 border-slate-900 shadow-2xl overflow-hidden bg-zinc-900" style={{ width: ROOM_WIDTH, height: ROOM_HEIGHT }}>
                    <div className="absolute inset-0 z-0" style={{ backgroundImage: "url('/assets/bedplain.png')", backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.8)' }} />
                    <div className="absolute inset-0 bg-blue-900/10 pointer-events-none mix-blend-multiply z-10"></div>

                    <Player x={bedroomPlayerPos.x} y={bedroomPlayerPos.y} />

                    {interactionTarget === 'sleep' && (
                        <InteractionPrompt text="Press E to lay down" />
                    )}

                    <div className="absolute top-4 left-4 z-30 bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-700/50">
                        <p className="text-amber-400 font-bold text-xs tracking-widest uppercase">DAY 4 — NIGHT</p>
                        <p className="text-slate-400 text-[10px] font-mono">YOUR BEDROOM</p>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'sleep_pov') {
        return (
            <div className="absolute inset-0 z-[2000] overflow-hidden bg-black animate-fadeIn">
                {/* GLOBAL TRANSITION FADE */}
                <div className={`absolute inset-0 bg-black z-[9999] transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />

                <div className="w-full h-full bg-cover bg-center animate-fieldZoom relative" style={{ backgroundImage: 'url("/assets/bed.png")' }}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none z-10" />

                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-[3000ms] ${showText ? 'opacity-100' : 'opacity-0'} z-30`}>
                        <p className="text-white text-3xl font-light italic tracking-widest px-8 max-w-2xl text-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                            "It feels different without you, Grandpa..."
                        </p>
                    </div>

                    <div
                        className={`absolute inset-0 z-50 bg-black transition-opacity duration-[3000ms] ease-in-out ${dimScreen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        onTransitionEnd={(e) => {
                            if (dimScreen && e.propertyName === 'opacity') {
                                triggerTransition('title_card');
                            }
                        }}
                    ></div>
                </div>
            </div>
        );
    }

    if (gameState === 'title_card') {
        return (
            <div className="absolute inset-0 z-[1000] bg-black flex flex-col justify-center items-center animate-cinematic-sequence">
                {/* GLOBAL TRANSITION FADE */}
                <div className={`absolute inset-0 bg-black z-[9999] transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
                <div className="relative group text-center animate-fadeInSlow">
                    <div className="absolute -inset-10 bg-white/5 blur-3xl rounded-full" />
                    <div className="h-px w-32 bg-gradient-to-r from-transparent via-red-500 to-transparent mb-8 mx-auto animate-[width_1.5s_ease-in-out]" />
                    <h2 className="text-white text-6xl font-black tracking-[0.4em] uppercase mb-4 relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-pulse">
                        Level 4
                    </h2>
                    <div className="text-red-500 text-lg font-mono tracking-[0.8em] uppercase drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                        The Malicious Link
                    </div>
                    <div className="h-px w-32 bg-gradient-to-r from-transparent via-red-500 to-transparent mt-8 mx-auto animate-[width_1.5s_ease-in-out]" />
                </div>
            </div>
        );
    }

    if (gameState === 'phone_pickup_pov') {
        return (
            <div className="absolute inset-0 z-[2000] overflow-hidden bg-black animate-fadeIn flex flex-col items-center justify-center">
                {/* GLOBAL TRANSITION FADE */}
                <div className={`absolute inset-0 bg-black z-[9999] transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />

                <div className="flex flex-col gap-8 text-center max-w-xl px-8 z-20">
                    {phonePickupStep >= 1 && (
                        <p className="text-white/60 text-xl font-serif italic tracking-wide animate-slideUp">
                            "What was that?"
                        </p>
                    )}
                    {phonePickupStep >= 2 && (
                        <p className="text-white/80 text-2xl font-serif italic tracking-wider animate-slideUp">
                            "My phone?"
                        </p>
                    )}
                    {phonePickupStep >= 3 && (
                        <p className="text-white text-3xl font-light italic tracking-widest animate-slideUp drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                            "Who is it at this hour..."
                        </p>
                    )}
                </div>

                {phonePickupStep >= 4 && (
                    <InteractionPrompt text="Press E to pick up the phone" />
                )}
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // SMS UI — Single message, report option
    // ═══════════════════════════════════════════
    if (gameState === 'sms_ui') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
                {/* GLOBAL TRANSITION FADE */}
                <div className={`absolute inset-0 bg-black z-[9999] transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
                <div className="absolute inset-0 z-0" style={{ backgroundImage: "url('/assets/bed.png')", backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3)' }} />

                <FeedbackToast />
                <div className="z-10 w-[380px] h-[750px] bg-zinc-900 border-x-[12px] border-t-[12px] border-b-[24px] border-black rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.9)] relative overflow-hidden flex flex-col items-center">
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
                    </div>

                    {/* App Cards */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        <h2 className="text-white text-lg font-black mb-5 uppercase tracking-widest">Search: "SBI YONO"</h2>

                        <div className="grid grid-cols-2 gap-5">
                            {/* App A — Official */}
                            <div className="bg-white rounded-2xl p-5 shadow-xl flex flex-col">
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
                                <p className="text-slate-600 text-xs mb-4 flex-1">Official banking app by State Bank of India. Manage accounts, transfers, and investments securely.</p>
                                <button className={`w-full font-bold py-3 rounded-xl transition-all shadow-lg ${cluesFound.length < 5 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                                    onClick={() => { if (cluesFound.length >= 5) setGameState('report_ui'); }}>
                                    {cluesFound.length < 5 ? '🔒 INSTALL OFFICIAL' : '✅ INSTALL OFFICIAL'}
                                </button>
                            </div>

                            {/* App B — Fake (clickable elements, NO visual hints) */}
                            <div className="bg-white rounded-2xl p-5 shadow-xl relative flex flex-col">
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
                                <Circleable clueId={3} className="text-slate-500 text-[11px] block mb-3 flex-1">
                                    Permissions: READ_SMS, READ_CONTACTS, RECORD_AUDIO, ACCESS_FINE_LOCATION, BIND_DEVICE_ADMIN
                                </Circleable>

                                <button className={`w-full font-bold py-3 rounded-xl transition-all shadow-lg ${cluesFound.length < 5 ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                                    onClick={() => { if (cluesFound.length >= 5) setGameState('permission_cascade'); }}>
                                    {cluesFound.length < 5 ? '🔒 INSTALL PRO VERSION' : '📥 INSTALL PRO VERSION'}
                                </button>
                            </div>
                        </div>

                        {/* Instruction Prompt below cards */}
                        <div className="mt-12 mb-8 flex flex-col items-center justify-center py-8 border-t border-slate-800/50">
                            {cluesFound.length < 5 ? (
                                <div className="text-white font-mono text-sm animate-pulse tracking-[0.2em] uppercase bg-slate-800/60 px-10 py-4 rounded-full border border-slate-700 shadow-[0_0_20px_rgba(255,255,255,0.05)] flex items-center gap-3">
                                    <span className="text-amber-400">🔍</span>
                                    <span>Click on suspicious elements to circle them ({cluesFound.length}/5 FOUND)</span>
                                </div>
                            ) : (
                                <div className="text-white font-mono text-sm animate-[bounce_2s_infinite] tracking-[0.2em] uppercase bg-emerald-900/40 px-10 py-4 rounded-full border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)] flex items-center gap-3">
                                    <span className="text-emerald-400">✅</span>
                                    <span>All clues found! Now install the correct version</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-800 px-6 py-3 flex items-center justify-between border-t border-slate-700">
                        <button className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                            onClick={() => setGameState('sms_ui')}>
                            ← Back
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
            <div className="w-full h-full bg-cover bg-center p-8 flex flex-col items-center justify-center text-white relative" style={{ backgroundImage: "url('/assets/bed.png')" }}>
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] z-0" />
                <div className="bg-slate-800/90 p-10 rounded-2xl shadow-2xl max-w-md text-center border border-slate-700 relative z-10 backdrop-blur-md">
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
    // REPORT FINAL — Mobile Cyber Cell Portal
    // ═══════════════════════════════════════════
    if (gameState === 'report_ui_final') {
        const handlePortalSubmit = () => {
            setIsPortalSubmitting(true);
            setTimeout(() => {
                setIsPortalSubmitting(false);
                setOutroSuccess(true);
                triggerTransition('outro_pov_1');
            }, 2000);
        };

        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
                {/* GLOBAL TRANSITION FADE */}
                <div className={`absolute inset-0 bg-black z-[9999] transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
                <div className="absolute inset-0 z-0" style={{ backgroundImage: "url('/assets/bed.png')", backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3)' }} />

                <div className="z-10 w-[380px] h-[750px] bg-zinc-900 border-x-[12px] border-t-[12px] border-b-[24px] border-black rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.9)] relative overflow-hidden flex flex-col">
                    {/* Status bar */}
                    <div className="w-full flex justify-between items-center px-8 pt-3 pb-1 text-[10px] text-slate-400 font-mono bg-white">
                        <span className="text-black">9:45 AM</span>
                        <span className="text-black">●●●● 5G 🔋</span>
                    </div>

                    {/* Browser Address Bar */}
                    <div className="w-full bg-slate-100 border-b border-slate-300 px-4 py-2 flex items-center gap-2">
                        <div className="bg-white border border-slate-300 rounded-full flex-1 px-3 py-1 flex items-center gap-2 text-[10px] text-slate-600">
                            <span>🔒</span>
                            <span className="truncate">cybercrime.gov.in/report</span>
                        </div>
                        <span className="text-slate-400 text-sm">⋮</span>
                    </div>

                    {/* Portal Header */}
                    <div className="bg-[#0b1f52] p-4 text-white flex items-center gap-3 border-b-2 border-amber-500 shrink-0">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-serif text-xl font-bold text-[#0b1f52] shrink-0">In</div>
                        <div>
                            <h1 className="text-[10px] font-black uppercase tracking-wider font-serif leading-tight">National Cyber Crime Reporting Portal</h1>
                            <p className="text-cyan-200 text-[7px] italic font-medium">Ministry of Home Affairs, Govt. of India</p>
                        </div>
                    </div>

                    {/* Portal Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col custom-scrollbar">
                        {portalStep === 0 && (
                            <div className="p-5 animate-fadeIn">
                                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm mb-4">
                                    <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                        <span className="text-lg">📢</span> IMPORTANT
                                    </h2>
                                    <p className="text-[11px] text-slate-600 leading-relaxed mb-4">
                                        Report any cybercrime including online financial fraud, phishing, or malicious applications. Your report helps protect others.
                                    </p>
                                    <button
                                        className="w-full bg-[#0b1f52] text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest shadow-md hover:bg-blue-900 transition-colors"
                                        onClick={() => setPortalStep(1)}
                                    >
                                        File a Complaint
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white p-3 rounded-lg border border-slate-100 text-center">
                                        <div className="text-xl mb-1">📞</div>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase">Helpline</p>
                                        <p className="text-xs font-black text-blue-900">1930</p>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-slate-100 text-center">
                                        <div className="text-xl mb-1">🕒</div>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase">Status</p>
                                        <p className="text-xs font-black text-blue-900">Track</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {portalStep === 1 && (
                            <div className="p-5 animate-fadeIn">
                                <h2 className="text-xs font-black text-slate-800 mb-4 uppercase flex items-center gap-2">
                                    <span className="text-blue-900">Step 1:</span> Incident Details
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Incident Category</label>
                                        <div className="bg-slate-100 border border-slate-200 rounded p-2 text-[11px] text-slate-700 font-medium">
                                            Phishing / Malicious App
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Suspect Sender (SMS)</label>
                                        <div className="bg-slate-100 border border-slate-200 rounded p-2 text-[11px] text-slate-700 font-mono">
                                            VM-SBINFO
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Malicious Link</label>
                                        <div className="bg-red-50 border border-red-100 rounded p-2 text-[9px] text-red-600 font-mono break-all leading-tight">
                                            https://sbi-kyc-update24.app/download
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Incident Description</label>
                                        <textarea
                                            className="w-full bg-white border border-slate-200 rounded p-2 text-[10px] text-slate-700 resize-none h-20"
                                            readOnly
                                            value="Received suspicious SMS impersonating SBI bank. Link leads to a fake app store page distributed via malicious APK. Attempted to harvest banking credentials and device permissions."
                                        />
                                    </div>
                                    <button
                                        className="w-full bg-[#0b1f52] text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest"
                                        onClick={() => setPortalStep(2)}
                                    >
                                        Next: Evidence
                                    </button>
                                </div>
                            </div>
                        )}

                        {portalStep === 2 && (
                            <div className="p-5 animate-fadeIn flex-1 flex flex-col">
                                <h2 className="text-xs font-black text-slate-800 mb-4 uppercase flex items-center gap-2">
                                    <span className="text-blue-900">Step 2:</span> Evidence Upload
                                </h2>

                                <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center mb-6">
                                    {!portalAttached ? (
                                        <>
                                            <div className="text-3xl mb-2">📎</div>
                                            <p className="text-[10px] text-slate-500 font-medium mb-4">Attach investigation clues found during Play Store inspection</p>
                                            <button
                                                className="bg-amber-100 text-amber-800 border border-amber-300 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider"
                                                onClick={() => setPortalAttached(true)}
                                            >
                                                Attach Digital Evidence ({cluesFound.length}/5)
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="text-3xl mb-2">✅</div>
                                            <p className="text-[10px] text-emerald-600 font-black mb-1">Evidence.zip Attached</p>
                                            <p className="text-[8px] text-slate-400 font-mono">{cluesFound.length} items collected</p>
                                        </>
                                    )}
                                </div>

                                <div className="mt-auto space-y-3">
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-2">
                                        <span className="text-sm">💡</span>
                                        <p className="text-[9px] text-blue-800 leading-tight">Evidence helps authorities identify and take down malicious infrastructure used by scammers.</p>
                                    </div>
                                    <button
                                        disabled={!portalAttached || isPortalSubmitting}
                                        className={`w-full py-4 rounded-lg text-xs font-black uppercase tracking-[0.2em] shadow-lg transition-all ${!portalAttached ? 'bg-slate-300 text-slate-500' : isPortalSubmitting ? 'bg-emerald-600 text-white animate-pulse' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
                                        onClick={handlePortalSubmit}
                                    >
                                        {isPortalSubmitting ? 'Submitting...' : 'Submit Final Report'}
                                    </button>
                                    <button className="w-full py-2 text-[9px] font-bold text-slate-400 uppercase" onClick={() => setPortalStep(1)}>← Back</button>
                                </div>
                            </div>
                        )}
                    </div>
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
                        onClick={() => { adjustAssets(-650000); adjustLives(-1); setOutroSuccess(false); triggerTransition('outro_pov_1'); }}>
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
                        onClick={() => { setOutroSuccess(true); triggerTransition('outro_pov_1'); }}>
                        Continue to Overworld
                    </button>
                </div>
            </div>
        );
    }

    if (gameState === 'outro_pov_1') {
        return (
            <div className="absolute inset-0 z-[2000] overflow-hidden bg-black animate-fadeIn">
                {/* GLOBAL TRANSITION FADE */}
                <div className={`absolute inset-0 bg-black z-[9999] transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
                <div className="w-full h-full bg-cover bg-center animate-fieldZoom relative" style={{ backgroundImage: 'url("/assets/bed.png")', filter: 'brightness(0.5)' }}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none" />

                    <InteractionPrompt text="Press E to keep phone aside and sleep" />
                </div>
            </div>
        );
    }

    if (gameState === 'outro_pov_2') {
        return (
            <div className="absolute inset-0 z-[2000] overflow-hidden bg-black animate-fadeIn">
                {/* GLOBAL TRANSITION FADE */}
                <div className={`absolute inset-0 bg-black z-[9999] transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
                <div className="w-full h-full bg-cover bg-center animate-fieldZoom relative" style={{ backgroundImage: 'url("/assets/bed.png")' }}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none z-10" />

                    <div className="absolute inset-0 flex flex-col items-center justify-center z-30 space-y-8">
                        {outroStep >= 1 && (
                            <p className="text-white text-3xl font-light italic tracking-widest px-8 max-w-2xl text-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] animate-fadeIn">
                                "It's been a long day..."
                            </p>
                        )}
                        {outroStep >= 2 && (
                            <p className="text-white/80 text-2xl font-light italic tracking-widest px-8 max-w-2xl text-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] animate-fadeIn">
                                "Is this what you've been going through daily, Grandpa?"
                            </p>
                        )}
                    </div>

                    <div className={`absolute inset-0 bg-black transition-opacity duration-[3000ms] pointer-events-none z-50 ${outroStep >= 2 ? 'opacity-100' : 'opacity-0'}`} />
                </div>
            </div>
        );
    }

    if (gameState === 'end_card') {
        return (
            <div className="w-full h-full bg-stone-950 flex flex-col items-center justify-center animate-fadeIn relative overflow-hidden z-[3000]">
                {/* GLOBAL TRANSITION FADE */}
                <div className={`absolute inset-0 bg-black z-[9999] transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />

                {/* Scanning line effects */}
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%]" />
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-cyan-500/5 to-transparent animate-[scanLine_4s_linear_infinite] pointer-events-none" />

                <div className="relative group text-center">
                    <div className="absolute -inset-10 bg-white/5 blur-3xl rounded-full" />
                    <h2 className="text-white text-6xl font-black tracking-[0.5em] uppercase mb-12 relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                        Level 4: The Malicious Link
                        {outroStep >= 4 && (
                            <div className="absolute top-1/2 left-[-10%] w-[120%] h-3 bg-red-600/90 -translate-y-1/2 animate-[strikeThrough_0.5s_forwards] shadow-[0_0_25px_rgba(220,38,38,1)] z-20 skew-y-[-1deg]" />
                        )}
                    </h2>

                    {outroStep >= 4 && (
                        <div className={`mt-12 text-8xl font-black italic tracking-[0.2em] uppercase animate-surge relative ${outroSuccess ? 'text-emerald-500' : 'text-red-500'}`}>
                            <span className="relative z-10">{outroSuccess ? 'COMPLETED' : 'FAILED'}</span>
                            {/* Chromatic aberration for text */}
                            <span className={`absolute inset-0 opacity-40 translate-x-1 animate-[aberration_3s_infinite] ${outroSuccess ? 'text-cyan-400' : 'text-red-400'}`}>{outroSuccess ? 'COMPLETED' : 'FAILED'}</span>
                            <span className={`absolute inset-0 opacity-40 -translate-x-1 animate-[aberration-alt_3s_infinite] ${outroSuccess ? 'text-emerald-300' : 'text-orange-600'}`}>{outroSuccess ? 'COMPLETED' : 'FAILED'}</span>
                        </div>
                    )}
                </div>

                <div className="mt-20 flex flex-col items-center gap-4">
                    <div className="h-px w-80 bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
                    <div className="text-[11px] font-mono text-zinc-500 tracking-[0.8em] uppercase opacity-60 animate-pulse">
                        Digital Incident Forensics // STATUS_RECORDED
                    </div>
                </div>
            </div>
        );
    }

    return null;
    }; // end of renderContent

    return (
        <React.Fragment>
            {/* GLOBAL TRANSITION FADE - Hoisted to root to prevent remount flash */}
            <div className={`fixed inset-0 bg-black z-[9999] transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
            {renderContent()}
        </React.Fragment>
    );
};

export default Level4;