import React, { useState, useEffect } from 'react';
import Player from '../components/Player';
import { useGameState } from '../context/GameStateContext';

const ROOM_WIDTH = 1200;
const ROOM_HEIGHT = 800;
const LIVING_ROOM_WIDTH = 1600;
const LIVING_ROOM_HEIGHT = 1100;
const SPEED = 9;
const PLAYER_SIZE = 40;

const checkCollision = (px, py, rect) => (
    px < rect.x + rect.w && px + PLAYER_SIZE > rect.x &&
    py < rect.y + rect.h && py + PLAYER_SIZE > rect.y
);

const CLUE_DATA = [
    { id: 1, title: 'Account Age vs. Relationship Age', desc: "Your friendship with Nithya is 6 years old. Her real profile is 6 years old. This account was created 4 days ago. A person cannot have two accounts on the same platform without deactivating the older one.", hint: "Hint: Compare the creation date with how long you've known her.", noteColor: '#fef3c7' },
    { id: 2, title: 'The Stock Photo Profile Picture', desc: "Reverse image search reveals the profile photo is from stock libraries. Real Nithya has 847 personal photos. Scammers use stock photos when they can't access real personal photos.", hint: "Hint: Try a reverse image search on that profile picture.", noteColor: '#dbeafe' },
    { id: 3, title: 'The Emotional Softening Technique', desc: "The message follows a 3-stage manipulation: warm-up &rarr; self-deprecation &rarr; crisis. This pattern appears in 94% of social engineering fraud cases to bypass rational thinking.", hint: "Hint: Look for emotional triggers in the message text.", noteColor: '#fce7f3' },
    { id: 4, title: 'Coimbatore + Hospital + No Family Contact', desc: "The scenario prevents verification: different city, hospital urgency, stolen phone (no voice), family unavailable. Every element blocks logical verification paths.", hint: "Hint: Notice how many reasons exist to prevent you from calling her family.", noteColor: '#dcfce7' },
    { id: 5, title: 'Bank Transfer vs. UPI', desc: "Bank transfers don't show recipient names like UPI does. Scammers use bank transfers to avoid identity exposure - you're sending to an account number, not a verified name.", hint: "Hint: Why is she asking for a bank transfer instead of UPI?", noteColor: '#fed7aa' },
    { id: 6, title: 'The 12 Mutual Friends Were Added As Bait', desc: "The fake account added 12 mutual friends 3-4 days ago. None interacted with the posts. These were algorithmically added to create social validation.", hint: "Hint: Look at the mutual friends list and their interaction history.", noteColor: '#e9d5ff' },
];

const StatusBar = ({ dark = false }) => (
    <div className={`flex justify-between items-center px-8 py-3 w-full absolute top-0 z-50 ${dark ? 'text-white' : 'text-slate-900'}`}>
        <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold">9:42</span>
            <span className="text-[10px] font-medium opacity-70">PM</span>
        </div>
        <div className="flex gap-1.5 items-center">
            <div className="flex items-center gap-0.5">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M2 17h20v2H2zm1.15-4.05L4 11.47l.85 1.48 1.3-.75-.85-1.48H7v-1.5H5.3l.85-1.48L4.85 7.47 4 8.95l-.85-1.48L2.3 7.47l.85 1.48H1v1.5h2.15l-.85 1.48 1.3.75.85-1.48 1.3.75-.85 1.48z" />
                </svg>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M1 9l2-2v8h18V7l2 2V5c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v4z" />
                </svg>
            </div>
            <div className="w-6 h-3 border border-current rounded-sm flex items-center p-0.5 relative">
                <div className="bg-current h-full w-[85%] rounded-sm"></div>
                <div className="absolute -right-1.5 w-1 h-1.5 bg-current rounded-r-sm"></div>
            </div>
        </div>
    </div>
);

const SOCIAL_MEDIA_BKG = "data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7z' fill='%2364748b' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E";

const Level9 = () => {
    const { completeLevel, adjustAssets, adjustLives } = useGameState();
    const [livingRoomPlayerPos, setLivingRoomPlayerPos] = useState({ x: 740, y: 550 });
    const [bedroomPlayerPos, setBedroomPlayerPos] = useState({ x: 600, y: 700 });
    const [keys, setKeys] = useState({});
    const [gameState, setGameState] = useState('living_room');
    const [interactionTarget, setInteractionTarget] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(true);
    const [showText, setShowText] = useState(false);
    const [dimScreen, setDimScreen] = useState(false);
    const [tvDialogueShown, setTvDialogueShown] = useState(false);
    const [showThought, setShowThought] = useState(false);
    const [reverseImageSearched, setReverseImageSearched] = useState(false);
    const [cluesFound, setCluesFound] = useState([]);
    const [isDetectiveModeOpen, setIsDetectiveModeOpen] = useState(false);
    const [messageStep, setMessageStep] = useState(0);
    const [profileInvestigated, setProfileInvestigated] = useState(false);
    const [calledRealNithya, setCalledRealNithya] = useState(false);
    const [scamReported, setScamReported] = useState(false);
    const [communityAlerted, setCommunityAlerted] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [stolenAmount, setStolenAmount] = useState(8000);
    const [escalationStep, setEscalationStep] = useState(0);
    const [innerThought, setInnerThought] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState(null);
    const [canInteract, setCanInteract] = useState(false);
    const [callStep, setCallStep] = useState(0); // 0=ringing, 1=connecting, 2=connected, 3=dialogue
    const [dialogueIndex, setDialogueIndex] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [finalSleepStep, setFinalSleepStep] = useState(0);
    const firstLineSpoken = React.useRef(false);

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

    // Handle Interaction Key (E)
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key.toLowerCase() === 'e') {
                if (gameState === 'living_room' && interactionTarget === 'bedroom') triggerTransition('bedroom_walk');
                else if (gameState === 'bedroom_walk' && interactionTarget === 'sleep') triggerTransition('sleep_pov');
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [gameState, interactionTarget]);

    useEffect(() => {
        const dk = (e) => setKeys(k => ({ ...k, [e.key.toLowerCase()]: true }));
        const uk = (e) => setKeys(k => ({ ...k, [e.key.toLowerCase()]: false }));
        const handleResize = () => setWindowWidth(window.innerWidth);

        window.addEventListener('keydown', dk);
        window.addEventListener('keyup', uk);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('keydown', dk);
            window.removeEventListener('keyup', uk);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Pre-load speech synthesis voices
    useEffect(() => {
        if (window.speechSynthesis) {
            window.speechSynthesis.getVoices();
            window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
        }
        return () => { window.speechSynthesis?.cancel(); };
    }, []);

    useEffect(() => {
        if (!['living_room', 'bedroom_walk'].includes(gameState)) return;
        let frameId;
        const loop = () => {
            if (gameState === 'living_room') {
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

    // Handle initial dialogue in living room
    useEffect(() => {
        if (gameState === 'living_room' && !tvDialogueShown) {
            setTvDialogueShown(true);
            setTimeout(() => {
                showFeedback("It's getting late. I should go to the bedroom and sleep.");
            }, 800);
        }
    }, [gameState, tvDialogueShown]);

    // Handle sleep to social media transition
    useEffect(() => {
        if (gameState === 'sleep_pov') {
            const t1 = setTimeout(() => setShowText(true), 1500);
            const t2 = setTimeout(() => setDimScreen(true), 4000);
            return () => { clearTimeout(t1); clearTimeout(t2); };
        }
        if (gameState === 'title_card') {
            const t3 = setTimeout(() => {
                triggerTransition('social_media_feed', 500);
            }, 5500);
            return () => clearTimeout(t3);
        }
    }, [gameState]);

    // Auto-answer call and handle final sleep timing
    useEffect(() => {
        if (gameState === 'call_real_nithya') {
            const timer = setTimeout(() => {
                setCalledRealNithya(true);
                setCallStep(0);
                setDialogueIndex(0);
                firstLineSpoken.current = false;
                setGameState('call_confirmation');
            }, 2000);
            return () => clearTimeout(timer);
        }
        
        if (gameState === 'final_sleep') {
            const t1 = setTimeout(() => setFinalSleepStep(1), 500);
            const t2 = setTimeout(() => setFinalSleepStep(2), 3500);
            return () => { clearTimeout(t1); clearTimeout(t2); };
        }
    }, [gameState]);

    // Delayed inner thought reveal
    useEffect(() => {
        if (gameState === 'message_received' && messageStep === 9 && !showThought) {
            const timer = setTimeout(() => setShowThought(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [messageStep, gameState, showThought]);

    // Escalation timer for scam sequence
    const escalationMessages = [
        { amount: 8000, message: "Thank you so much! You're a lifesaver. But the doctor just said they need ₹5,000 more for the X-ray and medicines. Please, I'll return everything by tomorrow morning." },
        { amount: 5000, message: "The medicines are stronger than expected. They need ₹12,000 more for specialist consultation and physiotherapy. Please help!" },
        { amount: 12000, message: "I need to travel back to Chennai. They're asking for ₹20,000 more for taxi, tickets, and follow-up appointments. This is the last time, I promise!" },
    ];


    const showFeedback = (msg) => { setFeedbackMsg(msg); setTimeout(() => setFeedbackMsg(null), 2500); };

    const speakLine = (text, isNithya = false) => {
        if (isMuted || typeof window === 'undefined' || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        if (isNithya) {
            // Girl voice — higher pitch, female voice
            const femaleVoice = voices.find(v => v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Google UK English Female') || v.name.toLowerCase().includes('female'));
            if (femaleVoice) utter.voice = femaleVoice;
            utter.pitch = 1.5;
            utter.rate = 1.05;
        } else {
            // Boy voice — lower pitch, male voice
            const maleVoice = voices.find(v => v.name.includes('David') || v.name.includes('Google UK English Male') || v.name.toLowerCase().includes('male'));
            if (maleVoice) utter.voice = maleVoice;
            utter.pitch = 0.7;
            utter.rate = 0.9;
        }
        utter.volume = 0.9;
        window.speechSynthesis.speak(utter);
    };

    const FeedbackToast = () => feedbackMsg ? (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[500] bg-blue-500 text-white font-black px-10 py-4 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.5)] animate-bounce text-xl border-4 border-white">
            {feedbackMsg}
        </div>
    ) : null;

    // ═══════════════════════════════════════════
    // NEW INTRO SEQUENCE STATES
    // ═══════════════════════════════════════════

    if (gameState === 'living_room') {
        const VIEWPORT_WIDTH = 1200;
        const VIEWPORT_HEIGHT = 800;
        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950 px-8 animate-in fade-in duration-1000 font-sans relative overflow-hidden">
                {/* GLOBAL TRANSITION FADE */}
                <div className={`absolute inset-0 bg-black z-[9999] transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
                <FeedbackToast />
                <div className="relative border-8 border-slate-900 shadow-2xl overflow-hidden bg-zinc-900" style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}>
                    <div className="absolute inset-0" style={{ width: LIVING_ROOM_WIDTH, height: LIVING_ROOM_HEIGHT, transform: `translate(${-(Math.max(0, Math.min(livingRoomPlayerPos.x - VIEWPORT_WIDTH / 2, LIVING_ROOM_WIDTH - VIEWPORT_WIDTH)))}px, ${-(Math.max(0, Math.min(livingRoomPlayerPos.y - VIEWPORT_HEIGHT / 2, LIVING_ROOM_HEIGHT - VIEWPORT_HEIGHT)))}px)`, backgroundColor: '#2c3e50' }}>
                        <div className="absolute inset-0 opacity-80" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(0,0,0,0.2) 38px, rgba(0,0,0,0.2) 40px)' }}></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/60 pointer-events-none z-10"></div>

                        {/* Top Return Door */}
                        <div className={`absolute top-0 right-0 w-[60px] h-[180px] bg-[#8a5a44] border-4 border-black border-t-0 flex z-10 opacity-80 transition-all`} />
                        {/* Bottom Double Door (Bedroom Exit) */}
                        <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[240px] h-[80px] bg-[#8a5a44] border-4 border-black border-b-0 flex z-10 ${interactionTarget === 'bedroom' ? 'opacity-100 scale-105' : 'opacity-80'} transition-all`}>
                            <div className="flex-1 border-r-2 border-black p-2 flex items-center justify-center text-[10px] text-white font-bold uppercase tracking-widest bg-emerald-900/20">BEDROOM</div>
                            <div className="flex-1 border-l-2 border-black p-2 flex items-center justify-center">
                                <div className="w-[80px] h-[50px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                            </div>
                        </div>

                        {/* RUGS FROM LEVEL 9 */}
                        <div className="absolute left-[180px] right-[120px] top-1/2 -translate-y-1/2 h-[260px] bg-[#cb3234] border-y-2 border-black z-0"></div>
                        <div className="absolute top-[80px] bottom-[80px] left-1/2 -translate-x-1/2 w-[260px] bg-[#cb3234] border-x-2 border-black z-0"></div>

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

                    {interactionTarget === 'bedroom' && (
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 animate-fadeIn tracking-[0.4em]">
                            <div className="h-[2px] w-12 bg-white/30 mb-3" />
                            <div className="text-white/80 font-mono text-[11px] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                Press E to enter bedroom
                            </div>
                        </div>
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
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 animate-fadeIn tracking-[0.4em]">
                            <div className="h-[2px] w-12 bg-white/30 mb-3" />
                            <div className="text-white/80 font-mono text-[11px] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                                Press E to lay down
                            </div>
                        </div>
                    )}

                    <div className="absolute top-4 left-4 z-30 bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-700/50">
                        <p className="text-amber-400 font-bold text-xs tracking-widest uppercase">NIGHT — 9:35 PM</p>
                        <p className="text-slate-400 text-[10px] font-mono">YOUR BEDROOM</p>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'sleep_pov') {
        return (
            <div className="absolute inset-0 z-[2000] overflow-hidden bg-black animate-cinematic-sequence">
                {/* GLOBAL TRANSITION FADE */}
                <div className={`absolute inset-0 bg-black z-[9999] transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />

                <div className="w-full h-full bg-cover bg-center animate-fieldZoom relative" style={{ backgroundImage: 'url("/assets/bed.png")' }}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none z-10" />

                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-[3000ms] ${showText ? 'opacity-100' : 'opacity-0'} z-30`}>
                        <p className="text-white text-3xl font-light italic tracking-widest px-8 max-w-2xl text-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                            "Let me check Instagram for a bit before sleeping..."
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
                    <div className="h-px w-32 bg-gradient-to-r from-transparent via-purple-500 to-transparent mb-8 mx-auto animate-[width_1.5s_ease-in-out]" />
                    <h2 className="text-white text-6xl font-black tracking-[0.4em] uppercase mb-4 relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-pulse">
                        Level 9
                    </h2>
                    <div className="text-purple-500 text-lg font-mono tracking-[0.8em] uppercase drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] text-center w-full">
                        Profile Impersonation
                    </div>
                    <div className="h-px w-32 bg-gradient-to-r from-transparent via-purple-500 to-transparent mt-8 mx-auto animate-[width_1.5s_ease-in-out]" />
                </div>
            </div>
        );
    }

    // SOCIAL MEDIA FEED STATE
    if (gameState === 'social_media_feed') {
        return (
            <div className="w-full h-full flex items-center justify-center p-8 relative overflow-hidden bg-black">
                {/* Bedroom background */}
                <div className="absolute inset-0 z-0" style={{ backgroundImage: "url('/assets/bedplain.png')", backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3) blur(8px)' }} />
                <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply z-10 pointer-events-none"></div>

                <div className="relative z-20">
                    <FeedbackToast />

                    {/* Phone container */}
                    <div className="w-[380px] max-h-[90vh] h-[750px] bg-zinc-900 border-x-[12px] border-t-[12px] border-b-[24px] border-black rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col">
                        <StatusBar dark />

                        {/* Dynamic Island */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-3xl z-50 flex items-center justify-center">
                            <div className="w-2 h-2 bg-slate-800 rounded-full shadow-[inset_0_0_2px_rgba(255,255,255,0.2)]" />
                        </div>

                        <div className="w-full h-full bg-white overflow-hidden flex flex-col relative pt-8">
                            {/* Instagram-style Header */}
                            <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-between">
                                <h1 className="text-xl font-bold font-serif italic tracking-tighter" style={{ fontFamily: "'Grand Hotel', 'Brush Script MT', cursive", fontSize: '28px' }}>Instagram</h1>
                                <div className="flex gap-4 items-center">
                                    <svg aria-label="Notifications" className="w-6 h-6 outline-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                                    <div className="relative cursor-pointer">
                                        <svg aria-label="Messenger" className="w-6 h-6 outline-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center animate-pulse">
                                            <span className="text-[8px] text-white font-bold leading-none">1</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stories Row */}
                            <div className="w-full flex gap-3 overflow-x-auto px-4 py-2 border-b border-gray-100 no-scrollbar">
                                {[
                                    { name: "Your story", color: "gray-200", add: true },
                                    { name: "zara_xo", color: "pink-500", ring: true },
                                    { name: "rahul99", color: "blue-500", ring: true },
                                    { name: "chennai_foodie", color: "orange-500", ring: true },
                                    { name: "karthik.v", color: "emerald-500", ring: true }
                                ].map((story, i) => (
                                    <div key={i} className="flex flex-col items-center gap-1 min-w-[64px]">
                                        <div className={`relative w-16 h-16 rounded-full p-[2px] ${story.ring ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-fuchsia-600' : 'bg-transparent'}`}>
                                            <div className="w-full h-full rounded-full border-[2px] border-white bg-white overflow-hidden flex items-center justify-center">
                                                <div className={`w-full h-full bg-${story.color}`}></div>
                                            </div>
                                            {story.add && (
                                                <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full border-[2px] border-white flex items-center justify-center text-white text-xs font-bold leading-none pb-[1px]">
                                                    +
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-gray-600 truncate w-full text-center">{story.name}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Feed content */}
                            <div className="flex-1 overflow-y-auto bg-white custom-scrollbar pb-20">
                                {/* Post 1 */}
                                <div className="border-b border-gray-100 pb-2 mb-2">
                                    <div className="flex items-center justify-between px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-fuchsia-600 p-[1.5px]">
                                                <div className="w-full h-full bg-blue-500 rounded-full border border-white flex items-center justify-center text-white text-[10px] font-bold">A</div>
                                            </div>
                                            <div>
                                                <span className="font-semibold text-[13px] text-gray-900">arjun_kumar</span>
                                            </div>
                                        </div>
                                        <div className="text-gray-500 flex justify-center w-6 cursor-pointer">
                                            <svg aria-label="More options" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5"/><circle cx="6" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/></svg>
                                        </div>
                                    </div>
                                    <div className="w-full aspect-[4/5] bg-blue-50 flex items-center justify-center text-7xl">&#127877;</div>
                                    <div className="px-3 py-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex gap-4">
                                                <svg aria-label="Like" className="w-6 h-6 hover:text-gray-500 cursor-pointer" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                                <svg aria-label="Comment" className="w-6 h-6 hover:text-gray-500 cursor-pointer" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                                <svg aria-label="Share" className="w-6 h-6 hover:text-gray-500 cursor-pointer" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path></svg>
                                            </div>
                                            <svg aria-label="Save" className="w-6 h-6 hover:text-gray-500 cursor-pointer" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                                        </div>
                                        <p className="font-semibold text-[13px] mb-1">2,341 likes</p>
                                        <p className="text-[13px] leading-snug"><span className="font-semibold mr-1">arjun_kumar</span>Finally graduated! &#127877; Thanks to everyone who supported me through this journey!</p>
                                        <p className="text-gray-500 text-[11px] uppercase tracking-wide mt-2">2 HOURS AGO</p>
                                    </div>
                                </div>

                                {/* Post 2 */}
                                <div className="border-b border-gray-100 pb-2 mb-2">
                                    <div className="flex items-center justify-between px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-orange-500 border border-gray-200 flex items-center justify-center text-white text-[10px] font-bold">M</div>
                                            <div>
                                                <span className="font-semibold text-[13px] text-gray-900">usha_temple_tour</span>
                                            </div>
                                        </div>
                                        <div className="text-gray-500 flex justify-center w-6 cursor-pointer">
                                            <svg aria-label="More options" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5"/><circle cx="6" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/></svg>
                                        </div>
                                    </div>
                                    <div className="w-full aspect-square bg-orange-50 flex items-center justify-center text-7xl">&#1585;&#1583;&#1575;</div>
                                    <div className="px-3 py-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex gap-4">
                                                <svg aria-label="Like" className="w-6 h-6 hover:text-gray-500 cursor-pointer" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                                <svg aria-label="Comment" className="w-6 h-6 hover:text-gray-500 cursor-pointer" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                                <svg aria-label="Share" className="w-6 h-6 hover:text-gray-500 cursor-pointer" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path></svg>
                                            </div>
                                            <svg aria-label="Save" className="w-6 h-6 hover:text-gray-500 cursor-pointer" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                                        </div>
                                        <p className="font-semibold text-[13px] mb-1">104 likes</p>
                                        <p className="text-[13px] leading-snug"><span className="font-semibold mr-1">usha_temple_tour</span>Beautiful evening at the temple &#128583;</p>
                                        <p className="text-gray-500 text-[11px] uppercase tracking-wide mt-2">4 HOURS AGO</p>
                                    </div>
                                </div>
                            </div>

                            {/* Instagram Bottom Nav Area Content below absolute layer */}
                            <div className="absolute bottom-0 w-full bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center pb-8 z-40">
                                <svg aria-label="Home" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.099l-9 6.8V22h5v-6h8v6h5V8.899l-9-6.8zm-7 8.3l7-5.3 7 5.3V20h-2v-6H9v6H5v-9.6z" opacity="0"></path><path d="M12 2l-10 7.5V22h6v-6h4v6h6V9.5L12 2z"></path></svg>
                                <svg aria-label="Search" className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                <svg aria-label="New post" className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
                                <svg aria-label="Reels" className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <div className="w-6 h-6 rounded-full bg-gray-300 border border-gray-200"></div>
                            </div>

                            {/* Notification appears after 3 seconds */}
                            <div className="absolute top-12 right-2 left-2 animate-in slide-in-from-top-4 fade-in duration-500 z-50">
                                <div className="bg-zinc-900/95 backdrop-blur-md text-white p-3 px-4 rounded-[1.5rem] shadow-[0_10px_30px_rgba(0,0,0,0.5)] cursor-pointer hover:scale-[1.02] transition-transform border border-zinc-800"
                                    onClick={() => setGameState('message_received')}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-11 h-11 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center font-bold text-lg">N</div>
                                                <div className="absolute -bottom-1 -right-1 bg-red-500 w-5 h-5 rounded-full flex items-center justify-center border-2 border-zinc-900">
                                                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-[15px] leading-tight flex items-center gap-1">nithya.k <span className="w-3 h-3 bg-blue-500 text-white rounded-full flex items-center justify-center text-[8px]">✓</span></p>
                                                    <p className="text-[11px] text-gray-400 font-medium">now</p>
                                                </div>
                                                <p className="text-[13px] text-gray-300 truncate w-[220px]">Hey! Oh my god it's been so long!!</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // MESSAGE RECEIVED STATE
    if (gameState === 'message_received') {
        const messages = [
            { sender: 'nithya', text: "Hey! Oh my god it's been so long!! How are you?" },
            { sender: 'nithya', text: "I heard about your grandfather — I'm so sorry. I wanted to message earlier but things have been... it's been a rough week for me too. Actually really rough." },
            { sender: 'nithya', text: "I'm so embarrassed to even ask this. You don't have to if it's too much." },
            { sender: 'you', text: "Hey Nithya! It's okay, don't worry. What happened? You alright?" },
            { sender: 'nithya', text: "I'm at Coimbatore. I came for a cousin's function." },
            { sender: 'nithya', text: "But last night my bag got stolen at the bus stand — phone, wallet, everything. I'm using someone's borrowed phone right now." },
            { sender: 'nithya', text: "I'm at a private hospital — I slipped and sprained my ankle badly while running after the thief and it needs immediate treatment." },
            { sender: 'nithya', text: "They're asking for ₹8,000 cash deposit before treatment. I tried calling home but no one's picking up." },
            { sender: 'nithya', text: "I know we haven't talked in a while and I hate asking but you're literally the only contact I remember by heart. Please, I'll pay you back as soon as I get back to Chennai." },
            { sender: 'nithya', text: "Account number: 789XXXXXXX IFSC: ICIC000XXXX. I'm in so much pain." }
        ];

        return (
            <div className="w-full h-full flex items-center justify-center p-8 relative overflow-hidden bg-black">
                {/* Bedroom background */}
                <div className="absolute inset-0 z-0" style={{ backgroundImage: "url('/assets/bedplain.png')", backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3) blur(8px)' }} />
                <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply z-10 pointer-events-none"></div>

                <div className="relative z-20">
                    <FeedbackToast />

                    <div className="w-[380px] max-h-[90vh] h-[750px] bg-zinc-900 border-x-[12px] border-t-[12px] border-b-[24px] border-black rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col">
                    <StatusBar />

                    {/* Dynamic Island */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-50 flex items-center justify-center">
                        <div className="w-2 h-2 bg-slate-700 rounded-full" />
                    </div>

                    <div className="w-full h-full bg-slate-50 overflow-hidden flex flex-col relative pt-8">
                        {/* Chat header - simplified */}
                        <div className="bg-white border-b border-gray-200 p-4 pt-6 flex items-center gap-3 text-slate-900 shadow-sm">
                            <button className="text-purple-600 hover:text-purple-700 font-bold" onClick={() => setGameState('social_media_feed')}>&larr;</button>
                            <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-black">N</div>
                            <div className="flex-1">
                                <p className="font-black text-sm">Nithya Krishnan</p>
                                <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                    Online
                                </p>
                            </div>
                            <button className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                                </svg>
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f0f2f5] custom-scrollbar">
                            {messages.slice(0, messageStep + 1).map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.sender === 'you' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`max-w-[85%] p-3 px-4 shadow-sm ${msg.sender === 'you'
                                        ? 'bg-purple-600 text-white rounded-2xl rounded-tr-sm'
                                        : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-200'
                                        }`}>
                                        <p className="text-sm leading-relaxed">{msg.text}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Typing indicator */}
                            {messageStep < messages.length - 1 && (
                                <div className="flex justify-start animate-in fade-in duration-300">
                                    <div className="bg-white p-3 px-4 rounded-2xl rounded-tl-sm border border-gray-200 shadow-sm">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                        </div>

                        {/* Inner Thought — appears after delay on last message */}
                        {messageStep === messages.length - 1 && showThought && (
                            <div className="mx-4 my-2 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl animate-in slide-in-from-bottom duration-700 shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl pt-1">💡</span>
                                    <div>
                                        <p className="text-amber-800 font-black text-[10px] uppercase tracking-widest mb-1">Critical Insight</p>
                                        <p className="text-amber-900 text-sm italic leading-relaxed font-medium">
                                            "Something isn't right. If her phone was stolen, how is she on her private account? And why can she memorize a long bank IBAN but not her father's mobile number?"
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
                            {messageStep === messages.length - 1 && showThought ? (
                                <div className="space-y-2.5">
                                    <button className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] border-b-4 border-slate-700 flex items-center justify-center gap-2 group"
                                        onClick={() => setGameState('profile_investigation')}>
                                        <span>🔍 Verify Identity First</span>
                                        <span className="group-hover:translate-x-1 transition-transform">➔</span>
                                    </button>
                                    <button className="w-full bg-white hover:bg-red-50 text-red-600 font-bold py-3 rounded-xl transition-all active:scale-[0.98] text-xs uppercase tracking-widest"
                                        onClick={() => setGameState('scam_sequence')}>
                                        I trust her, Send ₹8,000
                                    </button>
                                </div>
                            ) : messageStep < messages.length - 1 ? (
                                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] border-b-4 border-purple-800 flex items-center justify-center gap-2"
                                    onClick={() => setMessageStep(prev => prev + 1)}>
                                    <span>Read Next Message</span>
                                    <span className="animate-bounce-horizontal">➔</span>
                                </button>
                            ) : (
                                <div className="bg-gray-50 p-4 rounded-xl text-center flex items-center justify-center gap-2 text-gray-400 text-xs font-bold animate-pulse">
                                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                    Analyzing conversation context...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                </div>
            </div>
        );
    }

    // PROFILE INVESTIGATION STATE
    if (gameState === 'profile_investigation') {
        return (
            <div className="w-full h-full flex flex-row items-center justify-center gap-8 p-4 relative overflow-hidden bg-black">
                {/* Bedroom background */}
                <div className="absolute inset-0 z-0" style={{ backgroundImage: "url('/assets/bedplain.png')", backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3) blur(8px)' }} />
                <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply z-10 pointer-events-none"></div>

                <div className="relative z-20 flex flex-row items-center justify-center gap-8 w-full h-full">
                    <FeedbackToast />

                {/* Phone with profile - matching Levels 1-3 style */}
                <div className="w-[380px] max-h-[90vh] h-[750px] bg-zinc-900 border-x-[12px] border-t-[12px] border-b-[24px] border-black rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col flex-shrink-0 transition-transform duration-500 ease-in-out phone-container"
                    style={{ transform: isDetectiveModeOpen ? 'translateX(-150px)' : 'translateX(0)' }}>
                    <StatusBar />

                    {/* Dynamic Island */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-50 flex items-center justify-center">
                        <div className="w-2 h-2 bg-slate-700 rounded-full" />
                    </div>

                    <div className="w-full h-full bg-white overflow-hidden flex flex-col relative pt-8">
                        {/* Profile header - simplified to match Levels 1-3 */}
                        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4 pt-8 flex items-center gap-3 text-white">
                            <button className="text-white/80 hover:text-white" onClick={() => setGameState('message_received')}>&larr;</button>
                            <span className="font-black">Profile</span>
                        </div>

                        {/* Profile content */}
                        <div className="flex-1 overflow-y-auto">
                            {/* Profile photo and basic info - simplified */}
                            <div className="relative">
                                <div className="w-full h-32 bg-gradient-to-r from-purple-400 to-pink-400"></div>
                                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                                    <div className="w-24 h-24 bg-gray-300 rounded-full border-4 border-white shadow-lg cursor-pointer hover:scale-105 transition-transform"
                                        onClick={() => {
                                            if (!reverseImageSearched) {
                                                setReverseImageSearched(true);
                                                setCluesFound(prev => [...prev, 2]);
                                                showFeedback("&#128269; Stock photo detected!");
                                            }
                                        }}>
                                        <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center text-4xl">&#128105;</div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center mt-16 p-4">
                                <h3 className="text-2xl font-black text-gray-900 mb-1">Nithya Krishnan</h3>
                                <p className="text-gray-600 text-sm mb-4">@nithya_krishnan</p>

                                <div className="flex justify-center gap-8 mb-6 text-center">
                                    <div className="cursor-pointer hover:scale-105 transition-transform">
                                        <p className="font-black text-xl text-gray-900">3</p>
                                        <p className="text-xs text-gray-500">Posts</p>
                                    </div>
                                    <div className="cursor-pointer hover:scale-105 transition-transform">
                                        <p className="font-black text-xl text-gray-900">847</p>
                                        <p className="text-xs text-gray-500">Followers</p>
                                    </div>
                                    <div className="cursor-pointer hover:scale-105 transition-transform">
                                        <p className="font-black text-xl text-gray-900">12</p>
                                        <p className="text-xs text-gray-500">Mutual</p>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-3">
                                    <div className="bg-gray-50 p-4 rounded-xl text-left cursor-pointer hover:bg-gray-100 transition-all hover:shadow-md border border-gray-200"
                                        onClick={() => {
                                            if (!cluesFound.includes(1)) {
                                                setCluesFound(prev => [...prev, 1]);
                                                showFeedback("&#128269; Account created 4 days ago!");
                                            }
                                        }}>
                                        <p className="text-xs text-gray-600 mb-1">Account Created</p>
                                        <p className="font-black text-base text-gray-900">4 days ago</p>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-xl text-left cursor-pointer hover:bg-gray-100 transition-all hover:shadow-md border border-gray-200"
                                        onClick={() => {
                                            if (!cluesFound.includes(6)) {
                                                setCluesFound(prev => [...prev, 6]);
                                                showFeedback("&#128269; Mutual friends added recently!");
                                            }
                                        }}>
                                        <p className="text-xs text-gray-600 mb-1">Mutual Friends</p>
                                        <p className="font-black text-base text-gray-900">12 friends (all added 3-4 days ago)</p>
                                    </div>
                                </div>

                                {/* Message Analysis — clickable clues for 3, 4, 5 */}
                                <div className="mt-6">
                                    <p className="text-sm text-gray-700 uppercase tracking-wider font-black mb-4">📋 Review Message</p>

                                    <div className={`bg-gray-50 p-4 rounded-xl text-left cursor-pointer transition-all mb-3 hover:shadow-md border ${cluesFound.includes(3) ? 'ring-2 ring-red-500 bg-red-50 border-red-300' : 'border-gray-200 hover:border-gray-300'}`}
                                        onClick={() => {
                                            if (!cluesFound.includes(3)) {
                                                setCluesFound(prev => [...prev, 3]);
                                                showFeedback("🔴 Emotional manipulation detected!");
                                            }
                                        }}>
                                        <p className="text-xs text-gray-600 mb-1">Message Pattern</p>
                                        <p className="font-black text-base text-gray-900">"warm-up → self-deprecation → crisis"</p>
                                        {cluesFound.includes(3) && <span className="text-red-600 text-xs font-bold block mt-2">⭕ 3-stage social engineering pattern</span>}
                                    </div>

                                    <div className={`bg-gray-50 p-4 rounded-xl text-left cursor-pointer transition-all mb-3 hover:shadow-md border ${cluesFound.includes(4) ? 'ring-2 ring-red-500 bg-red-50 border-red-300' : 'border-gray-200 hover:border-gray-300'}`}
                                        onClick={() => {
                                            if (!cluesFound.includes(4)) {
                                                setCluesFound(prev => [...prev, 4]);
                                                showFeedback("🔴 Every detail blocks verification!");
                                            }
                                        }}>
                                        <p className="text-xs text-gray-600 mb-1">Scenario Details</p>
                                        <p className="font-black text-base text-gray-900">Coimbatore + Hospital + Stolen Phone + No Family</p>
                                        {cluesFound.includes(4) && <span className="text-red-600 text-xs font-bold block mt-2">⭕ All verification paths blocked</span>}
                                    </div>

                                    <div className={`bg-gray-50 p-4 rounded-xl text-left cursor-pointer transition-all hover:shadow-md border ${cluesFound.includes(5) ? 'ring-2 ring-red-500 bg-red-50 border-red-300' : 'border-gray-200 hover:border-gray-300'}`}
                                        onClick={() => {
                                            if (!cluesFound.includes(5)) {
                                                setCluesFound(prev => [...prev, 5]);
                                                showFeedback("🔴 Bank transfer hides identity!");
                                            }
                                        }}>
                                        <p className="text-xs text-gray-600 mb-1">Payment Method</p>
                                        <p className="font-black text-base text-gray-900">Bank Transfer (Account: 789XXXXXXX)</p>
                                        {cluesFound.includes(5) && <span className="text-red-600 text-xs font-bold block mt-2">⭕ No recipient name verification</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Posts */}
                            <div className="p-4">
                                <h4 className="font-black mb-3">Posts</h4>
                                <div className="grid grid-cols-3 gap-1">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="aspect-square bg-gray-200 rounded flex items-center justify-center text-2xl">
                                            &#128241;
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2 text-center">All posts are viral content shares</p>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="p-4 bg-white border-t border-gray-200">
                            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-4 rounded-2xl transition-all shadow-xl active:scale-95"
                                onClick={() => setGameState('call_real_nithya')}>
                                Call Real Nithya &#128222;
                            </button>
                        </div>

                        {/* Detective Mode Button */}
                        <button
                            className="absolute bottom-6 left-6 w-14 h-14 bg-amber-500 hover:bg-amber-400 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.6)] border-2 border-amber-300 z-50 text-2xl"
                            onClick={() => setIsDetectiveModeOpen(!isDetectiveModeOpen)}
                        >
                            🔍
                            {cluesFound.length > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex justify-center items-center">{cluesFound.length}</span>}
                        </button>
                        <div className="absolute bottom-1 left-4 font-mono text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Detective Mode</div>
                    </div>
                </div>

                {/* Detective Board - Cork board style */}
                <div
                    className="relative w-[580px] h-[750px] bg-amber-100 rounded-sm shadow-2xl z-[200] p-6 flex flex-col border-[12px] border-[#4a3728] overflow-hidden"
                    style={{
                        backgroundImage: `
                            url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23a)' opacity='.2'/%3E%3C/svg%3E"),
                            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139,69,19,0.03) 2px, rgba(139,69,19,0.03) 4px),
                            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,69,19,0.03) 2px, rgba(139,69,19,0.03) 4px)
                        `,
                        backgroundColor: '#d4a574',
                        boxShadow: 'inset 0 0 60px rgba(0,0,0,0.2), -10px 0 40px rgba(0,0,0,0.5)'
                    }}
                >
                    {/* Draw Red Strings Between Clues */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                        {cluesFound.map((clueId, idx) => {
                            if (idx > 0) {
                                const gridPositions = [
                                    { x: 110, y: 70 },    // Clue 1 - Account Age (top-left)
                                    { x: 360, y: 70 },    // Clue 2 - Stock Photo (top-right)
                                    { x: 110, y: 260 },   // Clue 3 - Emotional Softening (mid-left)
                                    { x: 360, y: 260 },   // Clue 4 - Coimbatore/Hospital (mid-right)
                                    { x: 110, y: 450 },   // Clue 5 - Bank Transfer (bottom-left)
                                    { x: 360, y: 450 }    // Clue 6 - Mutual Friends (bottom-right)
                                ];
                                const prevPos = gridPositions[idx - 1];
                                const currPos = gridPositions[idx];
                                return <line key={`line-${idx}`} x1={prevPos.x} y1={prevPos.y} x2={currPos.x} y2={currPos.y} stroke="rgba(220,38,38,0.8)" strokeWidth="3" style={{ filter: 'drop-shadow(2px 4px 2px rgba(0,0,0,0.5))' }} />;
                            }
                            return null;
                        })}
                    </svg>

                    {/* Header Label with Meter */}
                    <div className="flex justify-between items-start mb-6 z-10 gap-4">
                        <div className="bg-yellow-50 p-4 rounded-sm shadow-md transform -rotate-1 border border-yellow-200" style={{ boxShadow: '2px 3px 8px rgba(0,0,0,0.15)' }}>
                            <h2 className="text-lg font-black text-stone-800 uppercase tracking-wider font-mono">
                                📌 PROFILE FORENSICS
                            </h2>
                            <p className="text-stone-500 text-[10px] font-mono mt-1">Click profile elements to uncover evidence</p>
                        </div>
                        {/* Threat Intelligence Meter */}
                        <div className="bg-stone-800 rounded-sm p-3 shadow-lg border border-stone-600 w-44">
                            <h3 className="text-[10px] text-stone-300 uppercase font-mono mb-1 flex justify-between">
                                <span>Threat Meter</span>
                                <span style={{ color: cluesFound.length > 3 ? '#ef4444' : cluesFound.length > 1 ? '#eab308' : '#22c55e' }}>{cluesFound.length}/{CLUE_DATA.length}</span>
                            </h3>
                            <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden">
                                <div
                                    className="h-full transition-all duration-500"
                                    style={{
                                        width: `${(cluesFound.length / CLUE_DATA.length) * 100}%`,
                                        backgroundColor: cluesFound.length > 3 ? '#ef4444' : cluesFound.length > 1 ? '#eab308' : '#22c55e'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 flex-1">
                        {/* Clue Polaroids - Fixed Positions with Better Spacing */}
                        {cluesFound.includes(1) && (
                            <div
                                className="absolute bg-yellow-50 p-3 shadow-xl w-40 border border-yellow-300 z-10 flex flex-col animate-in zoom-in-95 duration-500"
                                style={{
                                    left: 40,
                                    top: 40,
                                    transform: 'rotate(-2deg)'
                                }}
                            >
                                {/* Red Pin Head */}
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 shadow-md border border-red-700 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/30 absolute top-0.5 right-0.5"></div>
                                </div>
                                {/* Pin connection circle for SVG line visually */}
                                <div className="absolute top-0 left-1/2 w-1.5 h-1.5 rounded-full bg-black/20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                                <h4 className="font-bold text-red-800 tracking-wider mb-2 text-xs leading-tight border-b border-red-800/20 pb-1 uppercase">Account Age vs. Relationship Age</h4>
                                <p className="text-xs text-stone-700 font-mono leading-tight">Your friendship with Nithya is 6 years old. Her real profile is 6 years old. This account was created 4 days ago.</p>
                            </div>
                        )}

                        {cluesFound.includes(2) && (
                            <div
                                className="absolute bg-yellow-50 p-3 shadow-xl w-40 border border-yellow-300 z-10 flex flex-col animate-in zoom-in-95 duration-500"
                                style={{
                                    left: 290,
                                    top: 40,
                                    transform: 'rotate(2deg)'
                                }}
                            >
                                {/* Red Pin Head */}
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 shadow-md border border-red-700 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/30 absolute top-0.5 right-0.5"></div>
                                </div>
                                {/* Pin connection circle for SVG line visually */}
                                <div className="absolute top-0 left-1/2 w-1.5 h-1.5 rounded-full bg-black/20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                                <h4 className="font-bold text-red-800 tracking-wider mb-2 text-xs leading-tight border-b border-red-800/20 pb-1 uppercase">The Stock Photo Profile Picture</h4>
                                <p className="text-xs text-stone-700 font-mono leading-tight">Reverse image search reveals the profile photo is from stock libraries. Real Nithya has 847 personal photos.</p>
                            </div>
                        )}

                        {cluesFound.includes(3) && (
                            <div
                                className="absolute bg-yellow-50 p-3 shadow-xl w-40 border border-yellow-300 z-10 flex flex-col animate-in zoom-in-95 duration-500"
                                style={{
                                    left: 40,
                                    top: 220,
                                    transform: 'rotate(-1deg)'
                                }}
                            >
                                {/* Red Pin Head */}
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 shadow-md border border-red-700 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/30 absolute top-0.5 right-0.5"></div>
                                </div>
                                {/* Pin connection circle for SVG line visually */}
                                <div className="absolute top-0 left-1/2 w-1.5 h-1.5 rounded-full bg-black/20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                                <h4 className="font-bold text-red-800 tracking-wider mb-2 text-xs leading-tight border-b border-red-800/20 pb-1 uppercase">The Emotional Softening Technique</h4>
                                <p className="text-xs text-stone-700 font-mono leading-tight">The message follows a 3-stage manipulation: warm-up → self-deprecation → crisis.</p>
                            </div>
                        )}

                        {cluesFound.includes(4) && (
                            <div
                                className="absolute bg-yellow-50 p-3 shadow-xl w-40 border border-yellow-300 z-10 flex flex-col animate-in zoom-in-95 duration-500"
                                style={{
                                    left: 290,
                                    top: 220,
                                    transform: 'rotate(3deg)'
                                }}
                            >
                                {/* Red Pin Head */}
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 shadow-md border border-red-700 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/30 absolute top-0.5 right-0.5"></div>
                                </div>
                                {/* Pin connection circle for SVG line visually */}
                                <div className="absolute top-0 left-1/2 w-1.5 h-1.5 rounded-full bg-black/20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                                <h4 className="font-bold text-red-800 tracking-wider mb-2 text-xs leading-tight border-b border-red-800/20 pb-1 uppercase">Coimbatore + Hospital + No Family Contact</h4>
                                <p className="text-xs text-stone-700 font-mono leading-tight">The scenario prevents verification: different city, hospital urgency, stolen phone, family unavailable.</p>
                            </div>
                        )}

                        {cluesFound.includes(5) && (
                            <div
                                className="absolute bg-yellow-50 p-3 shadow-xl w-40 border border-yellow-300 z-10 flex flex-col animate-in zoom-in-95 duration-500"
                                style={{
                                    left: 40,
                                    top: 410,
                                    transform: 'rotate(-2deg)'
                                }}
                            >
                                {/* Red Pin Head */}
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 shadow-md border border-red-700 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/30 absolute top-0.5 right-0.5"></div>
                                </div>
                                {/* Pin connection circle for SVG line visually */}
                                <div className="absolute top-0 left-1/2 w-1.5 h-1.5 rounded-full bg-black/20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                                <h4 className="font-bold text-red-800 tracking-wider mb-2 text-xs leading-tight border-b border-red-800/20 pb-1 uppercase">Bank Transfer vs. UPI</h4>
                                <p className="text-xs text-stone-700 font-mono leading-tight">Bank transfers don't show recipient names like UPI does. Scammers use bank transfers to avoid identity exposure.</p>
                            </div>
                        )}

                        {cluesFound.includes(6) && (
                            <div
                                className="absolute bg-yellow-50 p-3 shadow-xl w-40 border border-yellow-300 z-10 flex flex-col animate-in zoom-in-95 duration-500"
                                style={{
                                    left: 290,
                                    top: 410,
                                    transform: 'rotate(1deg)'
                                }}
                            >
                                {/* Red Pin Head */}
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 shadow-md border border-red-700 flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/30 absolute top-0.5 right-0.5"></div>
                                </div>
                                {/* Pin connection circle for SVG line visually */}
                                <div className="absolute top-0 left-1/2 w-1.5 h-1.5 rounded-full bg-black/20 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

                                <h4 className="font-bold text-red-800 tracking-wider mb-2 text-xs leading-tight border-b border-red-800/20 pb-1 uppercase">The 12 Mutual Friends Were Added As Bait</h4>
                                <p className="text-xs text-stone-700 font-mono leading-tight">The fake account added 12 mutual friends 3-4 days ago. None interacted with the posts.</p>
                            </div>
                        )}

                        {/* Locked Evidence Cards - Fixed Positions with Better Spacing */}
                        {!cluesFound.includes(1) && (
                            <div
                                className="absolute bg-gray-300 p-3 shadow-lg w-40 border-2 border-dashed border-gray-500 z-5 flex flex-col opacity-70"
                                style={{
                                    left: 40,
                                    top: 40,
                                    transform: 'rotate(-1deg)'
                                }}
                            >
                                {/* Lock icon */}
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center shadow-sm">
                                    <span className="text-white text-xs font-black">🔒</span>
                                </div>

                                <h4 className="font-black text-gray-700 tracking-wider mb-2 text-xs leading-tight border-b border-gray-500/30 pb-1 uppercase">LOCKED EVIDENCE #1</h4>
                                <p className="text-xs text-gray-600 italic font-serif leading-tight">Hint: Compare the creation date with how long you've known her.</p>
                            </div>
                        )}

                        {!cluesFound.includes(2) && (
                            <div
                                className="absolute bg-gray-300 p-3 shadow-lg w-40 border-2 border-dashed border-gray-500 z-5 flex flex-col opacity-70"
                                style={{
                                    left: 290,
                                    top: 40,
                                    transform: 'rotate(1deg)'
                                }}
                            >
                                {/* Lock icon */}
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center shadow-sm">
                                    <span className="text-white text-xs font-black">🔒</span>
                                </div>

                                <h4 className="font-black text-gray-700 tracking-wider mb-2 text-xs leading-tight border-b border-gray-500/30 pb-1 uppercase">LOCKED EVIDENCE #2</h4>
                                <p className="text-xs text-gray-600 italic font-serif leading-tight">Hint: Try a reverse image search on that profile picture.</p>
                            </div>
                        )}

                        {!cluesFound.includes(3) && (
                            <div
                                className="absolute bg-gray-300 p-3 shadow-lg w-40 border-2 border-dashed border-gray-500 z-5 flex flex-col opacity-70"
                                style={{
                                    left: 40,
                                    top: 220,
                                    transform: 'rotate(0.5deg)'
                                }}
                            >
                                {/* Lock icon */}
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center shadow-sm">
                                    <span className="text-white text-xs font-black">🔒</span>
                                </div>

                                <h4 className="font-black text-gray-700 tracking-wider mb-2 text-xs leading-tight border-b border-gray-500/30 pb-1 uppercase">LOCKED EVIDENCE #3</h4>
                                <p className="text-xs text-gray-600 italic font-serif leading-tight">Hint: Look for emotional triggers in the message text.</p>
                            </div>
                        )}

                        {!cluesFound.includes(4) && (
                            <div
                                className="absolute bg-gray-300 p-3 shadow-lg w-40 border-2 border-dashed border-gray-500 z-5 flex flex-col opacity-70"
                                style={{
                                    left: 290,
                                    top: 220,
                                    transform: 'rotate(-0.5deg)'
                                }}
                            >
                                {/* Lock icon */}
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center shadow-sm">
                                    <span className="text-white text-xs font-black">🔒</span>
                                </div>

                                <h4 className="font-black text-gray-700 tracking-wider mb-2 text-xs leading-tight border-b border-gray-500/30 pb-1 uppercase">LOCKED EVIDENCE #4</h4>
                                <p className="text-xs text-gray-600 italic font-serif leading-tight">Hint: Notice how many reasons exist to prevent you from calling her family.</p>
                            </div>
                        )}

                        {!cluesFound.includes(5) && (
                            <div
                                className="absolute bg-gray-300 p-3 shadow-lg w-40 border-2 border-dashed border-gray-500 z-5 flex flex-col opacity-70"
                                style={{
                                    left: 40,
                                    top: 410,
                                    transform: 'rotate(0deg)'
                                }}
                            >
                                {/* Lock icon */}
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center shadow-sm">
                                    <span className="text-white text-xs font-black">🔒</span>
                                </div>

                                <h4 className="font-black text-gray-700 tracking-wider mb-2 text-xs leading-tight border-b border-gray-500/30 pb-1 uppercase">LOCKED EVIDENCE #5</h4>
                                <p className="text-xs text-gray-600 italic font-serif leading-tight">Hint: Why is she asking for a bank transfer instead of UPI?</p>
                            </div>
                        )}

                        {!cluesFound.includes(6) && (
                            <div
                                className="absolute bg-gray-300 p-3 shadow-lg w-40 border-2 border-dashed border-gray-500 z-5 flex flex-col opacity-70"
                                style={{
                                    left: 290,
                                    top: 410,
                                    transform: 'rotate(-0.5deg)'
                                }}
                            >
                                {/* Lock icon */}
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center shadow-sm">
                                    <span className="text-white text-xs font-black">🔒</span>
                                </div>

                                <h4 className="font-black text-gray-700 tracking-wider mb-2 text-xs leading-tight border-b border-gray-500/30 pb-1 uppercase">LOCKED EVIDENCE #6</h4>
                                <p className="text-xs text-gray-600 italic font-serif leading-tight">Hint: Look at the mutual friends list and their interaction history.</p>
                            </div>
                        )}

                        {cluesFound.length === 0 && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-stone-600/40 text-center font-mono font-bold text-xl rotate-[-3deg] border-4 border-dashed border-stone-600/20 p-6 rounded-xl z-0 pointer-events-none">
                                CLICK PROFILE ELEMENTS<br />TO UNCOVER EVIDENCE.
                            </div>
                        )}
                    </div>


                </div>
                </div>
            </div>
        );
    }

    // CALL REAL NITHYA STATE — Outgoing Call
    if (gameState === 'call_real_nithya') {
        return (
            <div className="w-full h-full flex items-center justify-center p-8 relative overflow-hidden bg-black">
                {/* Bedroom background */}
                <div className="absolute inset-0 z-0" style={{ backgroundImage: "url('/assets/bedplain.png')", backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3) blur(8px)' }} />
                <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply z-10 pointer-events-none"></div>

                <div className="relative z-20">
                    <FeedbackToast />

                    {/* Single Phone UI (Outgoing Call) */}
                    <div className="w-[380px] max-h-[90vh] h-[750px] bg-zinc-900 border-x-[12px] border-t-[12px] border-b-[24px] border-black rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col items-center justify-center">
                        {/* Dynamic Island */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-50 flex items-center justify-center">
                            <div className="w-2 h-2 bg-slate-700 rounded-full" />
                        </div>

                        <div className="w-full h-full bg-gradient-to-b from-blue-700 via-blue-600 to-indigo-800 flex flex-col items-center text-white relative overflow-hidden pt-20">
                            {/* Ripple effect */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-20">
                                <div className="w-64 h-64 border border-white/10 rounded-full animate-ping" />
                                <div className="absolute w-80 h-80 border border-white/5 rounded-full animate-ping" style={{ animationDelay: '0.8s' }} />
                                <div className="absolute w-96 h-96 border border-white/5 rounded-full animate-ping" style={{ animationDelay: '1.6s' }} />
                            </div>

                            <div className="relative z-10 flex flex-col items-center mt-20 w-full px-8">
                                <p className="text-xs opacity-60 uppercase tracking-[0.3em] font-bold mb-6">Outgoing Call</p>
                                <div className="w-32 h-32 bg-white/15 backdrop-blur-md rounded-full flex items-center justify-center text-6xl mb-8 shadow-2xl border-2 border-white/20">
                                    👩
                                </div>
                                <h2 className="font-black text-3xl mb-2 drop-shadow-lg">Nithya</h2>
                                <p className="text-sm opacity-80 mb-12 flex items-center justify-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                    Ringing...
                                </p>

                                {/* Action Buttons (Disabled/Decorational) */}
                                <div className="grid grid-cols-3 gap-8 mb-16 opacity-50 mt-10 w-full px-4">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-xl">🔇</div>
                                        <span className="text-xs font-medium">Mute</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-xl">⌨️</div>
                                        <span className="text-xs font-medium">Keypad</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-xl">🔊</div>
                                        <span className="text-xs font-medium">Speaker</span>
                                    </div>
                                </div>

                                <button className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-[0_5px_20px_rgba(239,68,68,0.5)] border-4 border-white/20 mx-auto">
                                    <svg className="w-8 h-8 text-white rotate-[135deg]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // CALL CONFIRMATION STATE — Voice Dialogue
    if (gameState === 'call_confirmation') {
        const dialogueLines = [
            { sender: 'you', text: "Nithya, are you in Coimbatore? Are you at a hospital?" },
            { sender: 'nithya', text: "What?! No! I'm at home in Chennai, just finished dinner. Why? Did someone message you pretending to be me??" },
            { sender: 'you', text: "Yes. A fake account in your name asked me to send ₹8,000 for a hospital emergency in Coimbatore. I didn't send anything — I verified first. But the account has 12 of our mutual friends added. We should warn them." },
            { sender: 'nithya', text: "Oh my god. My account was not hacked — they made a COPY. I'm going to report this right now. Can you help me send a warning to our group?" },
        ];

        const showNextLine = () => {
            if (dialogueIndex < dialogueLines.length - 1) {
                const nextIdx = dialogueIndex + 1;
                setDialogueIndex(nextIdx);
                const nextLine = dialogueLines[nextIdx];
                speakLine(nextLine.text, nextLine.sender === 'nithya');
            }
        };

        // Speak first line when entering this state
        if (dialogueIndex === 0 && !firstLineSpoken.current) {
            firstLineSpoken.current = true;
            setTimeout(() => {
                speakLine(dialogueLines[0].text, dialogueLines[0].sender === 'nithya');
            }, 800);
        }

        return (
            <div className="w-full h-full flex items-center justify-center p-8 relative overflow-hidden bg-black">
                {/* Bedroom background */}
                <div className="absolute inset-0 z-0" style={{ backgroundImage: "url('/assets/bedplain.png')", backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3) blur(8px)' }} />
                <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply z-10 pointer-events-none"></div>

                <div className="relative z-20">
                    <FeedbackToast />

                    {/* Single Phone UI (Connected Call) */}
                    <div className="w-[380px] max-h-[90vh] h-[750px] bg-zinc-900 border-x-[12px] border-t-[12px] border-b-[24px] border-black rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col">
                        <StatusBar dark={false} />

                        {/* Dynamic Island */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-50 flex items-center justify-center">
                            <div className="w-2 h-2 bg-slate-700 rounded-full" />
                            <div className="absolute right-3 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_#10b981]" />
                        </div>

                        <div className="w-full h-full bg-[#0a1128] overflow-hidden flex flex-col relative pt-10">
                            {/* Blurred ambient background effect inside phone */}
                            <div className="absolute inset-0 z-0 opacity-40">
                                <div className="absolute top-10 right-10 w-40 h-40 bg-purple-600 rounded-full blur-[80px]"></div>
                                <div className="absolute bottom-40 left-10 w-40 h-40 bg-emerald-600 rounded-full blur-[80px]"></div>
                            </div>

                            {/* Call Header */}
                            <div className="px-6 py-4 flex flex-col items-center border-b border-white/5 bg-black/20 backdrop-blur-md z-10 mt-6">
                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-3xl mb-3 shadow-[0_5px_15px_rgba(0,0,0,0.3)] border-2 border-white/10">
                                    👩
                                </div>
                                <h2 className="text-white font-black text-xl mb-1 drop-shadow-md">Nithya</h2>
                                <div className="flex gap-2 items-center">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]" />
                                    <span className="text-emerald-400 text-[11px] font-mono font-bold tracking-widest uppercase opacity-90">Connected 00:0{dialogueIndex + 2}</span>
                                </div>
                            </div>

                            {/* Live Transcript / Dialogue */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar z-10 pb-32">
                                {/* Visualizer */}
                                <div className="flex justify-center items-end gap-1 h-12 mb-6 opacity-60">
                                    {[3, 5, 2, 8, 4, 3, 6, 2, 7, 4, 5, 2, 4, 3].map((h, i) => (
                                        <div key={i} className="w-1 bg-emerald-400 rounded-full animate-pulse" style={{ height: `${h * 4}px`, animationDelay: `${i * 0.1}s` }} />
                                    ))}
                                </div>

                                {dialogueLines.slice(0, dialogueIndex + 1).map((line, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex flex-col ${line.sender === 'you' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-500`}
                                        style={{ animationDelay: `${idx * 0.1}s` }}
                                    >
                                        <span className={`text-[9px] mb-1 font-bold uppercase tracking-widest ${line.sender === 'you' ? 'text-blue-400/80 mr-1' : 'text-emerald-400/80 ml-1'}`}>
                                            {line.sender === 'you' ? 'You' : 'Nithya (Real)'}
                                        </span>
                                        <div className={`max-w-[85%] p-4 rounded-[1.2rem] shadow-lg text-[13px] leading-relaxed backdrop-blur-md border ${line.sender === 'you'
                                            ? 'bg-blue-600/30 border-blue-500/30 text-blue-50 rounded-tr-sm'
                                            : 'bg-emerald-600/30 border-emerald-500/30 text-emerald-50 rounded-tl-sm'
                                            }`}>
                                            "{line.text}"
                                        </div>
                                    </div>
                                ))}
                                
                                <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
                            </div>

                            {/* Call Controls / Continue Button Overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#050a17] via-[#050a17]/90 to-transparent z-20 pb-10 flex flex-col items-center">
                                {dialogueIndex < dialogueLines.length - 1 ? (
                                    <button
                                        className="w-full bg-white text-black font-black py-4 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 hover:bg-gray-100"
                                        onClick={showNextLine}
                                    >
                                        <span>Continue Conversation</span>
                                        <span className="text-xl">💬</span>
                                    </button>
                                ) : (
                                    <div className="w-full space-y-3">
                                        {!scamReported && (
                                            <button className="w-full bg-red-600/20 border border-red-500/50 hover:bg-red-600/30 text-red-400 font-black py-3.5 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 text-sm backdrop-blur-md"
                                                onClick={() => setGameState('report_fake_account')}>
                                                🚨 Report Fake Account
                                            </button>
                                        )}
                                        {!communityAlerted && (
                                            <button className="w-full bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500/30 text-amber-400 font-black py-3.5 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 text-sm backdrop-blur-md"
                                                onClick={() => setGameState('alert_community')}>
                                                👥 Alert Mutual Friends
                                            </button>
                                        )}
                                        {scamReported && communityAlerted && (
                                            <button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-black py-4 rounded-xl transition-all shadow-xl active:scale-95 animate-pulse flex items-center justify-center gap-2"
                                                onClick={() => {
                                                    window.speechSynthesis?.cancel();
                                                    setGameState('final_sleep');
                                                }}>
                                                ✅ Hang Up & Sleep
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // REPORT FAKE ACCOUNT STATE
    if (gameState === 'report_fake_account') {
        return (
            <div className="w-full h-full flex items-center justify-center p-8 relative overflow-hidden bg-black">
                {/* Bedroom background */}
                <div className="absolute inset-0 z-0" style={{ backgroundImage: "url('/assets/bedplain.png')", backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3) blur(8px)' }} />
                <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply z-10 pointer-events-none"></div>

                <div className="relative z-20">
                    <FeedbackToast />

                <div className="w-[380px] max-h-[90vh] h-[700px] bg-gradient-to-br from-slate-900 to-slate-800 border-[2px] border-slate-700 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col"
                    style={{
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)'
                    }}>
                    <StatusBar />

                    {/* Dynamic Island */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-50 flex items-center justify-center">
                        <div className="w-2 h-2 bg-slate-700 rounded-full" />
                    </div>

                    <div className="w-full h-full bg-white flex flex-col relative pt-10 rounded-[3rem] mt-2 overflow-hidden">
                        {/* Reporting interface header */}
                        <div className="bg-gradient-to-r from-red-600 to-orange-600 px-5 py-3 text-white shadow-lg flex-shrink-0">
                            <h2 className="font-black text-xl">Report Profile</h2>
                            <p className="text-xs opacity-80 mt-0.5">Help keep our community safe</p>
                        </div>

                        <div className="flex-1 p-4 space-y-4 overflow-y-auto hide-scrollbar">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                <p className="font-black mb-2 text-sm text-gray-800">Reporting:</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-lg font-black shadow-md">N</div>
                                    <div>
                                        <p className="font-black text-sm text-gray-900">Nithya Krishnan</p>
                                        <p className="text-xs text-gray-500">@nithya_krishnan</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="font-black text-sm text-gray-800">Reason for report:</p>
                                <label className="flex items-center gap-3 p-3 bg-red-50 border-2 border-red-500 rounded-xl cursor-pointer hover:bg-red-100 transition-all">
                                    <input type="radio" name="report" className="w-4 h-4" defaultChecked />
                                    <span className="font-black text-red-900 text-sm">Impersonation</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-all">
                                    <input type="radio" name="report" className="w-4 h-4" />
                                    <span className="text-gray-700 font-medium text-sm">Spam</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-all">
                                    <input type="radio" name="report" className="w-4 h-4" />
                                    <span className="text-gray-700 font-medium text-sm">Fake Account</span>
                                </label>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200">
                                <p className="font-black text-blue-900 mb-2 text-sm">Additional Details:</p>
                                <p className="text-xs text-gray-700 leading-relaxed">This account is impersonating my real friend Nithya Krishnan to solicit money through fake emergency stories. The profile uses stock photos and was recently created.</p>
                            </div>
                        </div>

                        <div className="p-4 bg-white border-t border-gray-100 space-y-3 flex-shrink-0">
                            <button className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl active:scale-95"
                                onClick={() => {
                                    setScamReported(true);
                                    showFeedback("✅ Fake account reported!");
                                    setGameState('call_confirmation');
                                }}>
                                Submit Report 🚨
                            </button>
                            <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-black py-3 rounded-2xl transition-all text-sm"
                                onClick={() => setGameState('call_confirmation')}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
                </div>
            </div>
        );
    }

    // ALERT COMMUNITY STATE
    if (gameState === 'alert_community') {
        return (
            <div className="w-full h-full flex items-center justify-center p-8 relative overflow-hidden bg-black">
                {/* Bedroom background */}
                <div className="absolute inset-0 z-0" style={{ backgroundImage: "url('/assets/bedplain.png')", backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3) blur(8px)' }} />
                <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply z-10 pointer-events-none"></div>

                <div className="relative z-20">
                    <FeedbackToast />

                <div className="w-[380px] max-h-[90vh] h-[700px] bg-gradient-to-br from-slate-900 to-slate-800 border-[2px] border-slate-700 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col"
                    style={{
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
                        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)'
                    }}>
                    <StatusBar dark />

                    {/* Dynamic Island */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-50 flex items-center justify-center">
                        <div className="w-2 h-2 bg-slate-700 rounded-full" />
                    </div>

                    <div className="w-full h-full bg-white flex flex-col relative pt-10 rounded-[3rem] mt-2 overflow-hidden">
                        {/* Group chat header */}
                        <div className="bg-gradient-to-r from-green-600 to-blue-600 px-5 py-3 text-white shadow-lg flex-shrink-0">
                            <h2 className="font-black text-xl">College Friends Group</h2>
                            <p className="text-xs opacity-80 mt-0.5">12 members</p>
                        </div>

                        <div className="flex-1 p-4 space-y-4 bg-gray-50 overflow-y-auto hide-scrollbar">
                            <div className="bg-yellow-50 border-2 border-yellow-400 p-4 rounded-2xl shadow-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md">!</div>
                                    <p className="font-black text-yellow-900 text-sm">⚠️ SECURITY ALERT</p>
                                </div>
                                <p className="text-xs text-gray-700 leading-relaxed">A fake account impersonating Nithya Krishnan is sending fraud messages asking for money. DO NOT send any money. Report the account immediately. The real Nithya is safe in Chennai.</p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex gap-3 items-start">
                                    <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-black shadow-md flex-shrink-0">A</div>
                                    <div className="bg-white p-3 rounded-2xl flex-1 shadow-sm border border-gray-100">
                                        <p className="font-black text-xs mb-0.5 text-gray-900">Arjun</p>
                                        <p className="text-xs text-gray-700">Thanks for the warning! I almost sent money yesterday</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 items-start">
                                    <div className="w-9 h-9 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-black shadow-md flex-shrink-0">P</div>
                                    <div className="bg-white p-3 rounded-2xl flex-1 shadow-sm border border-gray-100">
                                        <p className="font-black text-xs mb-0.5 text-gray-900">Priya</p>
                                        <p className="text-xs text-gray-700">Just reported the account! Everyone stay safe 🙏</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 items-start">
                                    <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-black shadow-md flex-shrink-0">R</div>
                                    <div className="bg-white p-3 rounded-2xl flex-1 shadow-sm border border-gray-100">
                                        <p className="font-black text-xs mb-0.5 text-gray-900">Rahul</p>
                                        <p className="text-xs text-gray-700">You saved us all! Thank you for being careful 🙏</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-white border-t border-gray-100 flex-shrink-0">
                            <button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                                onClick={() => {
                                    setCommunityAlerted(true);
                                    showFeedback("✅ Community alerted!");
                                    setGameState('call_confirmation');
                                }}>
                                <span className="text-lg">📢</span>
                                <span>Send Alert</span>
                            </button>
                        </div>
                    </div>
                </div>
                </div>
            </div>
        );
    }

    // FINAL BEDTIME SEQUENCE
    if (gameState === 'final_sleep') {
        return (
            <div className="absolute inset-0 z-[2000] overflow-hidden bg-black animate-cinematic-sequence">
                <div className="w-full h-full bg-cover bg-center relative" style={{ backgroundImage: 'url("/assets/bedplain.png")', filter: 'brightness(0.6)' }}>
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none z-10" />

                    <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-[2000ms] ${finalSleepStep >= 1 ? 'opacity-100' : 'opacity-0'} z-30`}>
                        <p className="text-white text-3xl font-light italic tracking-widest px-8 max-w-2xl text-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                            "That's enough phone for today. Time to sleep."
                        </p>
                    </div>

                    <div
                        className={`absolute inset-0 z-[100] bg-black transition-opacity duration-[2000ms] ease-in-out ${finalSleepStep >= 2 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        onTransitionEnd={(e) => {
                            if (finalSleepStep >= 2 && e.propertyName === 'opacity') {
                                setGameState('end_card');
                            }
                        }}
                    ></div>
                </div>
            </div>
        );
    }

    if (gameState === 'end_card') {
        return (
            <div className="absolute inset-0 z-[2000] overflow-hidden bg-black flex flex-col items-center justify-center">
                <div className="text-center animate-in zoom-in duration-1000">
                    <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center text-5xl mx-auto shadow-[0_0_80px_rgba(147,51,234,0.5)] animate-bounce mb-8">
                        🌙
                    </div>
                    <h1 className="text-6xl font-black text-white uppercase tracking-[0.3em] mb-4">Level 9 Completed</h1>
                    <p className="text-purple-400 text-2xl font-light tracking-widest uppercase italic mb-12">Profile Impersonation Defeated</p>
                    
                    <div className="flex gap-6 justify-center mb-16 px-10">
                        <div className="bg-slate-900 border border-slate-700/50 rounded-3xl p-8 w-56 shadow-2xl">
                            <div className="text-5xl text-emerald-400 font-black mb-3">+35</div>
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">Safety Score</div>
                        </div>
                        <div className="bg-slate-900 border border-slate-700/50 rounded-3xl p-8 w-56 shadow-2xl flex flex-col items-center justify-center">
                            <div className="text-2xl text-cyan-400 font-black mb-3 uppercase leading-tight tracking-wider text-center">The Verifier</div>
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">Badge Earned</div>
                        </div>
                    </div>

                    <button 
                        onClick={() => completeLevel(true, 35, 0)}
                        className="bg-purple-600 hover:bg-purple-500 text-white px-12 py-5 rounded-full font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(147,51,234,0.3)] hover:shadow-[0_0_50px_rgba(147,51,234,0.5)] hover:-translate-y-1"
                    >
                        Return to Hub ➔
                    </button>
                </div>
            </div>
        );
    }

    // SCAM SEQUENCE STATE
    if (gameState === 'scam_sequence') {
        const currentMsg = escalationStep < escalationMessages.length ? escalationMessages[escalationStep] : null;

        return (
            <div className="w-full h-full bg-black flex flex-col items-center justify-center p-4 relative overflow-y-auto hide-scrollbar">
                <div className="absolute inset-0 bg-red-600/5 animate-pulse"></div>

                <div className="z-10 w-full max-w-2xl bg-[#0a0c10] border-t-8 border-red-600 rounded-[3rem] p-10 shadow-[0_0_150px_rgba(220,38,38,0.4)] animate-in slide-in-from-bottom duration-500 max-h-[95vh] overflow-y-auto hide-scrollbar">
                    <div className="flex items-center gap-10 mb-12 pb-12 border-b border-white/5">
                        <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center text-6xl font-black shrink-0 shadow-[0_0_50px_rgba(220,38,38,0.8)] animate-bounce italic">!</div>
                        <div>
                            <h1 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-2 underline decoration-red-600 decoration-8">
                                {escalationStep >= escalationMessages.length ? 'CRITICAL BREACH' : 'MONEY SENT'}
                            </h1>
                            <p className="text-red-500 font-black font-mono text-lg uppercase tracking-[0.3em]">SOCIAL ENGINEERING IN PROGRESS</p>
                        </div>
                    </div>

                    <div className="space-y-6 mb-12">
                        {/* Show all previous escalation messages */}
                        {escalationMessages.slice(0, escalationStep).map((msg, i) => (
                            <div key={i} className="bg-white/5 rounded-2xl border border-white/5 p-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-black shrink-0">N</div>
                                    <div className="flex-1">
                                        <p className="text-blue-400 font-black text-sm mb-2">Fake Nithya:</p>
                                        <p className="text-white/60 text-sm leading-relaxed">{msg.message}</p>
                                        <p className="text-red-400 font-black font-mono mt-2 text-sm">Sent: ₹{msg.amount.toLocaleString('en-IN')} ✓</p>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Current escalation message with player choice */}
                        {currentMsg && (
                            <div className="bg-white/10 rounded-2xl border-2 border-red-500/30 p-6 animate-in fade-in slide-in-from-right duration-500">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-black shrink-0">N</div>
                                    <div className="flex-1">
                                        <p className="text-blue-400 font-black text-sm mb-2">Fake Nithya:</p>
                                        <p className="text-white text-lg leading-relaxed">{currentMsg.message}</p>
                                        <p className="text-red-400 font-black font-mono mt-2">Requesting: ₹{currentMsg.amount.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>

                                {/* Player choice */}
                                <div className="mt-6 grid grid-cols-2 gap-4">
                                    <button className="bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl text-sm shadow-xl transition-all active:scale-95 border-2 border-red-400/30"
                                        onClick={() => {
                                            setStolenAmount(prev => prev + currentMsg.amount);
                                            adjustAssets(-currentMsg.amount);
                                            setEscalationStep(prev => prev + 1);
                                        }}>
                                        💸 Send ₹{currentMsg.amount.toLocaleString('en-IN')}
                                    </button>
                                    <button className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl text-sm shadow-xl transition-all active:scale-95 border-2 border-emerald-400/30"
                                        onClick={() => setGameState('profile_investigation')}>
                                        🤔 Wait... Let me check
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Account disappeared after all escalations */}
                        {escalationStep >= escalationMessages.length && (
                            <div className="bg-red-900/40 border-2 border-red-500 rounded-2xl p-6 text-center animate-in fade-in duration-500">
                                <p className="text-red-400 font-black text-lg mb-2">Account Disappeared</p>
                                <p className="text-white/60">The scammer has blocked you and deleted the fake account.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-12 p-10 bg-red-600/10 rounded-[2.5rem] border-4 border-red-600/20 text-center shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #dc2626 25%, transparent 25%, transparent 50%, #dc2626 50%, #dc2626 75%, transparent 75%, transparent 100%)', backgroundSize: '10px 10px' }}></div>
                        <h2 className="text-red-500 text-2xl font-black mb-2 uppercase tracking-[0.5em]">TOTAL LOSS</h2>
                        <span className="text-8xl font-black text-white font-mono drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">-₹{stolenAmount.toLocaleString('en-IN')}</span>
                    </div>

                    {escalationStep >= escalationMessages.length && (
                        <div className="mt-12 grid grid-cols-2 gap-8">
                            <button className="bg-white/5 hover:bg-white/10 text-white/40 font-black py-6 rounded-2xl text-xl uppercase tracking-widest transition-all"
                                onClick={() => {
                                    adjustAssets(-stolenAmount);
                                    adjustLives(-1);
                                    setGameState('room_intro');
                                }}>
                                Accept Defeat
                            </button>
                            <button className="bg-red-600 hover:bg-red-500 text-white font-black py-6 rounded-2xl text-2xl shadow-[0_20px_60px_rgba(220,38,38,0.5)] uppercase tracking-widest animate-pulse border-4 border-red-400 flex items-center justify-center gap-4 transition-transform hover:scale-105 active:scale-95"
                                onClick={() => setGameState('recovery_screen')}>
                                <span className="text-3xl">🚨</span>
                                <span>CALL 1930 HELPLINE</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // RECOVERY SCREEN STATE
    if (gameState === 'recovery_screen') {
        return (
            <div className="w-full h-full bg-[#0a0c10] flex items-center justify-center p-6 md:p-12 overflow-y-auto hide-scrollbar relative">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_70%)] pointer-events-none"></div>

                <div className="z-10 w-full max-w-4xl bg-white rounded-[3rem] md:rounded-[4rem] p-10 md:p-16 shadow-[0_50px_100px_rgba(0,0,0,0.5)] text-center animate-in zoom-in duration-500 my-auto">
                    <div className="w-24 h-24 md:w-32 md:h-32 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-5xl md:text-6xl mx-auto mb-8 md:mb-10 shadow-inner">⚡</div>
                    <h2 className="text-slate-900 font-black text-4xl md:text-5xl uppercase tracking-tighter mb-4 italic">PARTIAL RECOVERY</h2>
                    <p className="text-slate-600 text-lg md:text-xl font-serif italic leading-relaxed mb-10 px-4 md:px-12 opacity-80">
                        "The 1930 Cyber Helpline initiated financial tracking. Since you reported quickly, some funds were frozen in mule accounts, but the scammer had already transferred most of the money."
                    </p>
                    <div className="bg-emerald-50 border-4 border-emerald-500/20 p-10 rounded-[3rem] mb-12 flex justify-between items-center shadow-inner">
                        <div className="text-left">
                            <h4 className="text-emerald-900 font-black uppercase text-sm tracking-widest mb-1">Amount Recovered</h4>
                            <p className="text-emerald-600 text-5xl font-black font-mono mt-1">+₹3,000</p>
                        </div>
                        <div className="text-slate-300 w-px h-20 bg-emerald-500/20 mx-8"></div>
                        <div className="text-right">
                            <h4 className="text-slate-400 font-black uppercase text-sm tracking-widest mb-1">Net Loss</h4>
                            <p className="text-red-500 text-5xl font-black font-mono mt-1">-₹5,000</p>
                        </div>
                    </div>
                    <button className="w-full bg-slate-950 hover:bg-black text-white font-black py-8 rounded-[2.5rem] text-3xl shadow-3xl transition-all hover:scale-105 active:scale-95 uppercase tracking-widest"
                        onClick={() => {
                            adjustAssets(-5000);
                            completeLevel(false, 0, 0);
                        }}>
                        Accept & Continue →
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default Level9;


