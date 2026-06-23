import React, { useState, useEffect } from 'react';
import Player from '../components/Player';
import { useGameState } from '../context/GameStateContext';
import InteractionPrompt from '../components/InteractionPrompt';

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
    { id: 1, title: 'Account Age Discrepancy', desc: "This account was created just 4 days ago. Scammers create fresh profiles to impersonate people, while real accounts usually have years of history.", hint: "Hint: Check 'About this account' for the joining date.", noteColor: '#fef3c7' },
    { id: 2, title: 'Stock Photo Profile Picture', desc: "The profile photo is a generic stock image found in several online galleries. Real users typically use personal photos taken by themselves or friends.", hint: "Hint: Examine the profile picture closely; does it look like a real person's snapshot?", noteColor: '#dbeafe' },
    { id: 3, title: 'Suspicious Username History', desc: "This account has changed its username 4 times in the last month. Frequent name changes are a major red flag for compromised or impersonation accounts.", hint: "Hint: Look for 'Former Usernames' in the account details.", noteColor: '#fce7f3' },
    { id: 4, title: 'Inconsistent Account Location', desc: "The account is based in a different region than the person it claims to be. This is a common indicator of offshore social engineering fraud.", hint: "Hint: Check the location data in the 3-dot menu.", noteColor: '#dcfce7' },
    { id: 5, title: 'Post Engagement Discrepancy', desc: "Despite having hundreds of followers, the posts have zero comments and hidden like counts. Scammers often use 'bot' followers to appear legitimate.", hint: "Hint: Look at the posts; why are the comments disabled?", noteColor: '#fed7aa' },
    { id: 6, title: 'Bait Mutual Friends', desc: "The account recently added 12 mutual friends in bulk. This is a tactic used to create 'social proof' and trick you into trusting the profile.", hint: "Hint: Notice when these mutual friends were added.", noteColor: '#e9d5ff' },
];

const StatusBar = ({ dark = false }) => (
    <div className={`flex justify-between items-center px-8 py-3 w-full absolute top-0 z-50 ${dark ? 'text-white bg-black' : 'text-slate-900 bg-white/20'}`}>
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
    const { completeLevel, adjustAssets, adjustLives, playTitleCardSound } = useGameState();
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
    const [alertStep, setAlertStep] = useState(0);
    const [guidanceMsg, setGuidanceMsg] = useState(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);

    const walkingAudio = React.useRef(null);
    const doorAudio = React.useRef(null);

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
                if (gameState === 'living_room' && interactionTarget === 'bedroom') {
                    if (doorAudio.current && !isMuted) {
                        doorAudio.current.currentTime = 0;
                        doorAudio.current.play().catch(() => {});
                    }
                    triggerTransition('bedroom_walk');
                }
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

    useEffect(() => {
        // Initialize walking audio
        walkingAudio.current = new Audio('/audio/foot.m4a');
        walkingAudio.current.loop = true;
        walkingAudio.current.volume = 0.8; // Increased volume

        // Initialize door audio
        doorAudio.current = new Audio('/audio/home door.mp3');
        doorAudio.current.volume = 0.6;

        return () => { 
            if (walkingAudio.current) {
                walkingAudio.current.pause();
                walkingAudio.current = null;
            }
            if (doorAudio.current) {
                doorAudio.current.pause();
                doorAudio.current = null;
            }
        };
    }, []);

    // Handle Walking Sound
    useEffect(() => {
        const isWalking = (keys['w'] || keys['s'] || keys['a'] || keys['d'] || 
                           keys['arrowup'] || keys['arrowdown'] || keys['arrowleft'] || keys['arrowright']) && 
                          (gameState === 'living_room' || gameState === 'bedroom_walk') &&
                          !isMuted;

        if (isWalking) {
            if (walkingAudio.current && walkingAudio.current.paused) {
                walkingAudio.current.play().catch(() => {});
            }
        } else {
            if (walkingAudio.current && !walkingAudio.current.paused) {
                walkingAudio.current.pause();
            }
        }
    }, [keys, gameState, isMuted]);

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
            setGuidanceMsg("It's getting late. I should go to the bedroom and sleep.");
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
            playTitleCardSound();
            const t3 = setTimeout(() => {
                triggerTransition('social_media_feed', 500);
            }, 5500);
            return () => clearTimeout(t3);
        }
    }, [gameState, playTitleCardSound]);

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



    const FeedbackToast = () => feedbackMsg ? (
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-[5000] flex flex-col items-center pb-12">
            {/* Dark gradient backdrop strip matching InteractionPrompt */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
            
            {/* Content */}
            <div className="relative flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Gradient line */}
                <div className="h-[2px] w-32 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                
                {/* Feedback Message */}
                <div className="flex items-center gap-3 whitespace-nowrap px-12">
                    <span className="text-white font-bold text-sm uppercase tracking-[0.25em] drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] text-center">
                        {feedbackMsg}
                    </span>
                </div>
                
                {/* Bottom line */}
                <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-white/20 to-transparent mt-1" />
            </div>
        </div>
    ) : null;

    // LOCAL ANIMATION TO PREVENT FADE-OUT GAP
    const LocalStyles = () => (
        <style>{`
            @keyframes persistent-cinematic {
                0% { opacity: 0; }
                15% { opacity: 1; }
                100% { opacity: 1; }
            }
            .animate-persistent-cinematic { 
                animation: persistent-cinematic 4s ease-in-out forwards; 
            }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
    );

    const BottomNavBar = ({ active = 'home' }) => (
        <div className="absolute bottom-0 w-full bg-black border-t border-white/10 px-6 py-3 flex justify-between items-center z-[60] shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
            <button className={`p-1 ${active === 'home' ? 'text-white' : 'text-zinc-500'}`} onClick={() => setGameState('social_media_feed')}>
                <svg className="w-6 h-6" fill={active === 'home' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z" />
                </svg>
            </button>
            <button className={`p-1 ${active === 'search' ? 'text-white' : 'text-zinc-500'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </button>
            <button className={`p-1 ${active === 'reels' ? 'text-white' : 'text-zinc-500'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10 8l6 4-6 4V8z" fill="currentColor" />
                </svg>
            </button>
            <button className={`p-1 ${active === 'shop' ? 'text-white' : 'text-zinc-500'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            </button>
            <button className={`relative p-1 ${active === 'profile' ? 'text-white' : 'text-zinc-500'}`} onClick={() => setGameState('profile_investigation')}>
                <div className={`w-6 h-6 rounded-full border-2 ${active === 'profile' ? 'border-white' : 'border-zinc-500'} bg-zinc-800 flex items-center justify-center text-[8px] font-bold overflow-hidden`}>
                    👩
                </div>
            </button>
        </div>
    );

    // ═══════════════════════════════════════════
    // NEW INTRO SEQUENCE STATES
    // ═══════════════════════════════════════════

    const renderGameState = () => {
        if (gameState === 'living_room') {
            const VIEWPORT_WIDTH = 1200;
            const VIEWPORT_HEIGHT = 800;
            return (
                <div className="w-full h-full flex items-center justify-center bg-[#0f172a] px-8 animate-in fade-in duration-1000 font-sans relative overflow-hidden">
                    <div className="relative border-8 border-slate-900 shadow-2xl overflow-hidden bg-slate-900" style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}>
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

                    {interactionTarget === 'bedroom' ? (
                        <InteractionPrompt text="Press E to enter bedroom" />
                    ) : (
                        guidanceMsg && (
                            <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-[5000] flex flex-col items-center pb-8 animate-in fade-in duration-500">
                                {/* Dark gradient backdrop strip */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                                
                                <div className="relative flex flex-col items-center gap-3">
                                    <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50" />
                                    <span className="text-white font-bold text-sm uppercase tracking-[0.25em] drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] px-12 text-center">
                                        {guidanceMsg}
                                    </span>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
            );
        }

        if (gameState === 'bedroom_walk') {
            return (
                <div className="w-full h-full flex items-center justify-center bg-black px-8 relative overflow-hidden">
                    <div className="relative border-8 border-slate-900 shadow-2xl overflow-hidden bg-black" style={{ width: ROOM_WIDTH, height: ROOM_HEIGHT }}>
                    <div className="absolute inset-0 z-0" style={{ backgroundImage: "url('/assets/bedplain.png')", backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.8)' }} />
                    <div className="absolute inset-0 bg-blue-900/10 pointer-events-none mix-blend-multiply z-10"></div>

                    <Player x={bedroomPlayerPos.x} y={bedroomPlayerPos.y} />

                    {interactionTarget === 'sleep' && (
                        <InteractionPrompt text="Press E to lay down" />
                    )}

                    <div className="absolute top-4 left-4 z-30 bg-black/80 px-4 py-2 rounded-lg border border-slate-700/50">
                        <p className="text-amber-400 font-bold text-xs tracking-widest uppercase">NIGHT — 9:35 PM</p>
                        <p className="text-slate-400 text-[10px] font-mono">YOUR BEDROOM</p>
                    </div>
                </div>
            </div>
            );
        }

        if (gameState === 'sleep_pov') {
            return (
                <div className="absolute inset-0 overflow-hidden animate-persistent-cinematic">
                    <div className="w-full h-full bg-cover bg-center animate-fieldZoom relative" style={{ backgroundImage: 'url("/assets/bed.png")' }}>
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black pointer-events-none z-10" />

                        <div className={`absolute bottom-0 left-0 right-0 pointer-events-none transition-opacity duration-[3000ms] ${showText ? 'opacity-100' : 'opacity-0'} z-30 flex flex-col items-center pb-20`}>
                             {/* Dark gradient backdrop strip */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                            
                            <div className="relative flex flex-col items-center gap-4">
                                <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                                <p className="text-white text-xl font-bold uppercase tracking-[0.2em] px-12 max-w-3xl text-center drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                                    "Let me check Instagram for a bit before sleeping..."
                                </p>
                                <div className="h-px w-12 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            </div>
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
                <div className="absolute inset-0 flex flex-col justify-center items-center animate-persistent-cinematic">
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

                    {/* Phone container */}
                    <div className="w-[380px] max-h-[90vh] h-[750px] bg-black border-x-[12px] border-t-[12px] border-b-[24px] border-black rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col">
                        <StatusBar dark />

                        {/* Dynamic Island */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-3xl z-50 flex items-center justify-center">
                            <div className="w-2 h-2 bg-slate-800 rounded-full shadow-[inset_0_0_2px_rgba(255,255,255,0.2)]" />
                        </div>

                        <div className="w-full h-full bg-black overflow-hidden flex flex-col relative pt-8">
                            <StatusBar dark={true} />
                            
                            {/* Authentic Instagram Header (Dark Mode) */}
                            <div className="bg-black border-b border-white/10 px-4 py-2 flex items-center justify-between sticky top-0 z-50">
                                <h1 className="text-2xl font-bold tracking-tighter cursor-default text-white" style={{ fontFamily: "'Grand Hotel', cursive", fontSize: '32px' }}>Instagram</h1>
                                <div className="flex gap-5 items-center">
                                    <div className="relative cursor-pointer hover:scale-110 transition-transform text-white">
                                        <svg aria-label="New post" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"></path></svg>
                                    </div>
                                    <div className="relative cursor-pointer hover:scale-110 transition-transform text-white">
                                        <svg aria-label="Notifications" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                    </div>
                                    <div className="relative cursor-pointer hover:scale-110 transition-transform text-white" onClick={() => setGameState('message_received')}>
                                        <svg aria-label="Messenger" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 rounded-full border-2 border-black flex items-center justify-center animate-[pulse_1s_infinite]">
                                            <span className="text-[8px] text-white font-black leading-none pb-[0.5px]">1</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pb-32 bg-black">
                                {/* Stories Row (Dark Mode) */}
                                <div className="w-full flex gap-4 overflow-x-auto px-4 py-4 border-b border-white/10 no-scrollbar bg-black scroll-smooth">
                                    {[
                                        { name: "Your story", color: "bg-zinc-800", add: true, me: true },
                                        { name: "rahul_99", color: "bg-blue-400" },
                                        { name: "zara.v", color: "bg-pink-400" },
                                        { name: "chennai_eats", color: "bg-orange-400" },
                                        { name: "karthik.arc", color: "bg-emerald-400" }
                                    ].map((story, i) => (
                                        <div key={i} className="flex flex-col items-center gap-1.5 min-w-[68px]">
                                            <div className={`relative w-[68px] h-[68px] rounded-full p-[2.5px] ${!story.me ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-fuchsia-600' : 'bg-transparent'}`}>
                                                <div className="w-full h-full rounded-full border-[2.5px] border-black bg-black overflow-hidden flex items-center justify-center">
                                                    <div className={`w-full h-full ${story.color} flex items-center justify-center text-white text-lg font-bold shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]`}>
                                                        {story.name.charAt(0).toUpperCase()}
                                                    </div>
                                                </div>
                                                {story.add && (
                                                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-blue-500 rounded-full border-[3px] border-black flex items-center justify-center text-white text-sm font-black leading-none pb-[1px]">
                                                        +
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-zinc-400 font-medium truncate w-full text-center tracking-tight">{story.name}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Feed Content (Dark Mode) */}
                                <div className="bg-black">
                                    {/* Post 1 */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between px-3 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-fuchsia-600 p-[1.5px]">
                                                    <div className="w-full h-full bg-blue-500 rounded-full border border-black flex items-center justify-center text-white text-[10px] font-black">A</div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-xs text-white flex items-center gap-1">arjun_kumar <span className="w-2.5 h-2.5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[6px]">✓</span></span>
                                                    <span className="text-[10px] text-zinc-500">Chennai, India</span>
                                                </div>
                                            </div>
                                            <div className="text-white p-2 cursor-pointer hover:bg-zinc-800 rounded-full transition-colors">
                                                <svg aria-label="More options" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5"/><circle cx="6" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/></svg>
                                            </div>
                                        </div>
                                        <div className="w-full aspect-square bg-zinc-900/50 flex items-center justify-center text-8xl border-y border-white/5">🎓</div>
                                        <div className="px-3 py-3">
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex gap-4 text-white">
                                                    <svg aria-label="Like" className="w-6 h-6 hover:text-red-500 cursor-pointer transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                                    <svg aria-label="Comment" className="w-6 h-6 hover:text-zinc-400 cursor-pointer transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                                    <svg aria-label="Share" className="w-6 h-6 hover:text-zinc-400 cursor-pointer transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path></svg>
                                                </div>
                                                <svg aria-label="Save" className="w-6 h-6 text-white hover:text-zinc-400 cursor-pointer transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                                            </div>
                                            <p className="font-bold text-xs mb-1 px-1 text-white">2,341 likes</p>
                                            <p className="text-xs leading-relaxed px-1 text-zinc-300"><span className="font-bold mr-1 text-white">arjun_kumar</span>Finally graduated! 🎓 Thanks to everyone who supported me through this journey!</p>
                                            <p className="text-zinc-500 text-[10px] uppercase tracking-wider mt-2.5 px-1 font-bold">2 HOURS AGO</p>
                                        </div>
                                    </div>

                                    {/* Post 2 */}
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between px-3 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-orange-500 border border-white/10 flex items-center justify-center text-white text-[10px] font-black">U</div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-xs text-white">usha_temple_tour</span>
                                                    <span className="text-[10px] text-zinc-500">Mylapore, Chennai</span>
                                                </div>
                                            </div>
                                            <div className="text-white p-2 cursor-pointer hover:bg-zinc-800 rounded-full transition-colors">
                                                <svg aria-label="More options" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="1.5"/><circle cx="6" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/></svg>
                                            </div>
                                        </div>
                                        <div className="w-full aspect-square bg-zinc-900/50 flex items-center justify-center text-8xl border-y border-white/5">🕯️</div>
                                        <div className="px-3 py-3">
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex gap-4 text-white">
                                                    <svg aria-label="Like" className="w-6 h-6 hover:text-red-500 cursor-pointer transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                                                    <svg aria-label="Comment" className="w-6 h-6 hover:text-zinc-400 cursor-pointer transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                                                    <svg aria-label="Share" className="w-6 h-6 hover:text-zinc-400 cursor-pointer transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"></path></svg>
                                                </div>
                                                <svg aria-label="Save" className="w-6 h-6 text-white hover:text-zinc-400 cursor-pointer transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                                            </div>
                                            <p className="font-bold text-xs mb-1 px-1 text-white">104 likes</p>
                                            <p className="text-xs leading-relaxed px-1 text-zinc-300"><span className="font-bold mr-1 text-white">usha_temple_tour</span>Beautiful evening at the temple 🙏</p>
                                            <p className="text-zinc-500 text-[10px] uppercase tracking-wider mt-2.5 px-1 font-bold">4 HOURS AGO</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Authentic Bottom Navigation Bar (Dark Mode) */}
                            <div className="absolute bottom-0 w-full bg-black border-t border-white/10 px-6 py-2 flex justify-between items-center pb-8 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
                                <div className="p-2 cursor-pointer hover:scale-110 transition-transform text-white">
                                    <svg aria-label="Home" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.099l-9 6.8V22h5v-6h8v6h5V8.899l-9-6.8zm-7 8.3l7-5.3 7 5.3V20h-2v-6H9v6H5v-9.6z" opacity="0"></path><path d="M12 2l-10 7.5V22h6v-6h4v6h6V9.5L12 2z"></path></svg>
                                </div>
                                <div className="p-2 cursor-pointer hover:scale-110 transition-transform text-zinc-500">
                                    <svg aria-label="Search" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                </div>
                                <div className="p-2 cursor-pointer hover:scale-110 transition-transform text-zinc-500">
                                    <svg aria-label="Explore" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
                                </div>
                                <div className="p-2 cursor-pointer hover:scale-110 transition-transform text-zinc-500">
                                    <svg aria-label="Reels" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                </div>
                                <div className="p-2 cursor-pointer hover:scale-110 transition-transform" onClick={() => setGameState('profile_investigation')}>
                                    <div className="w-7 h-7 rounded-full bg-zinc-800 border-2 border-transparent hover:border-white transition-all overflow-hidden flex items-center justify-center text-[10px]">
                                        👩
                                    </div>
                                </div>
                            </div>

                            {/* Premium Notification (Dark Mode Style) */}
                            <div className="absolute top-14 right-3 left-3 animate-in slide-in-from-top-4 fade-in duration-700 z-[100]">
                                <div className="bg-zinc-900/90 backdrop-blur-xl text-white p-3.5 px-4 rounded-[1.8rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] cursor-pointer hover:scale-[1.03] active:scale-95 transition-all border border-white/10 ring-1 ring-black/30"
                                    onClick={() => setGameState('message_received')}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3.5">
                                            <div className="relative">
                                                <div className="w-12 h-12 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-[1.1rem] flex items-center justify-center font-black text-white text-xl shadow-lg border border-white/10">N</div>
                                                <div className="absolute -top-1 -right-1 bg-red-600 w-5 h-5 rounded-full flex items-center justify-center border-2 border-zinc-900 shadow-sm">
                                                    <span className="text-[10px] text-white font-black leading-none">1</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-[15px] leading-tight tracking-tight text-white flex items-center gap-1.5">
                                                        nithya.k 
                                                        <span className="w-3.5 h-3.5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[8px] shadow-sm">✓</span>
                                                    </p>
                                                    <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
                                                    <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-wider">now</p>
                                                </div>
                                                <p className="text-[14px] text-zinc-300 font-medium tracking-tight truncate w-[220px]">Hey! Oh my god it's been so long!!</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-8 h-1 bg-zinc-700/50 rounded-full mx-auto mt-2" />
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
                <div className="absolute inset-0 z-0" style={{ backgroundImage: "url('/assets/bedplain.png')", backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3) blur(8px)' }} />
                    <div className="w-[380px] max-h-[90vh] h-[750px] bg-black border-x-[12px] border-t-[12px] border-b-[24px] border-black rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col">
                    <StatusBar dark={true} />

                    {/* Dynamic Island */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-50 flex items-center justify-center">
                        <div className="w-2 h-2 bg-slate-700 rounded-full" />
                    </div>

                    <div className="w-full h-full bg-black overflow-hidden flex flex-col relative pt-8">
                        {/* Instagram-style DM Header (Dark Mode) */}
                        <div className="bg-black border-b border-white/10 p-4 pt-8 flex items-center gap-3 text-white sticky top-0 z-20">
                            <button className="text-xl text-white hover:text-zinc-400 transition-colors" onClick={() => setGameState('social_media_feed')}>
                                <span>←</span>
                            </button>
                            <div className="relative">
                                <div className="w-10 h-10 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-black text-xs border border-white/10">N</div>
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-black"></div>
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-sm tracking-tight text-white line-clamp-1">Nithya Krishnan</p>
                                <p className="text-[10px] text-zinc-500 font-medium tracking-wide flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                    Active now
                                </p>
                            </div>
                            <div className="flex gap-4 pr-2">
                                <button className="text-white opacity-80 hover:opacity-100 transition-opacity disabled:opacity-30" disabled>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                </button>
                                <button className="text-white opacity-80 hover:opacity-100 transition-opacity disabled:opacity-30" disabled>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                </button>
                                <button className="text-white opacity-80 hover:opacity-100 transition-opacity" onClick={() => setGameState('profile_investigation')}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                </button>
                            </div>
                        </div>

                        {/* Messages (Dark Mode) */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black custom-scrollbar">
                            {messages.slice(0, messageStep + 1).map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.sender === 'you' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`max-w-[85%] p-3 px-4 shadow-sm ${msg.sender === 'you'
                                        ? 'bg-purple-600 text-white rounded-2xl rounded-tr-sm'
                                        : 'bg-zinc-800 text-zinc-100 rounded-2xl rounded-tl-sm border border-white/5'
                                        }`}>
                                        <p className="text-sm leading-relaxed tracking-tight">{msg.text}</p>
                                    </div>
                                </div>
                            ))}

                            {/* Typing indicator (Dark Mode) */}
                            {messageStep < messages.length - 1 && (
                                <div className="flex justify-start animate-in fade-in duration-300">
                                    <div className="bg-zinc-800 p-3 px-4 rounded-2xl rounded-tl-sm border border-white/5 shadow-sm">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })} />
                        </div>



                        {/* Action Area (Dark Mode) */}
                        <div className="p-4 bg-black border-t border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] sticky bottom-0 z-20">
                            {messageStep < messages.length - 1 ? (
                                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all active:scale-[0.98] shadow-[0_10px_30px_rgba(37,99,235,0.3)] flex items-center justify-center gap-3 group animate-in slide-in-from-bottom duration-500"
                                    onClick={() => setMessageStep(prev => prev + 1)}>
                                    <span className="text-[15px] tracking-tight">Continue Conversation</span>
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </button>
                            ) : messageStep === messages.length - 1 && showThought ? (
                                <div className="space-y-3">
                                    <button className="w-full bg-white hover:bg-zinc-100 text-black font-black py-4 rounded-2xl transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 group animate-in zoom-in-95 duration-500 origin-bottom"
                                        onClick={() => setGameState('profile_investigation')}>
                                        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform ring-4 ring-blue-600/10">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                        </div>
                                        <div className="flex flex-col items-start leading-none gap-1">
                                            <span className="text-[15px] tracking-tight text-black">Investigate Profile</span>
                                            <span className="text-[9px] text-blue-600 font-bold uppercase tracking-[0.15em]">Forensic Analysis</span>
                                        </div>
                                        <span className="ml-auto text-black opacity-30 group-hover:translate-x-1 transition-transform pr-2">➔</span>
                                    </button>
                                    <button className="w-full bg-white hover:bg-zinc-100 text-black font-bold py-3.5 rounded-2xl transition-all active:scale-[0.98] text-[10px] uppercase tracking-[0.2em] shadow-sm"
                                        onClick={() => setGameState('scam_sequence')}>
                                        Trust & Send ₹8,000
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-zinc-900 border border-white/5 p-4 rounded-2xl text-center flex items-center justify-center gap-2 text-zinc-500 text-[11px] font-bold uppercase tracking-widest animate-pulse">
                                    <div className="w-1.5 h-1.5 bg-zinc-700 rounded-full"></div>
                                    Analyzing conversation context...
                                </div>
                            )}
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

                {/* Phone with profile - matching Levels 1-3 style */}
                <div className="w-[380px] max-h-[90vh] h-[750px] bg-black border-x-[12px] border-t-[12px] border-b-[24px] border-black rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col flex-shrink-0 transition-transform duration-500 ease-in-out phone-container"
                    style={{ transform: isDetectiveModeOpen ? 'translateX(-150px)' : 'translateX(0)' }}>
                    <StatusBar dark={true} />

                    {/* Dynamic Island */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-50 flex items-center justify-center">
                        <div className="w-2 h-2 bg-slate-700 rounded-full" />
                    </div>

                    <div className="w-full h-full bg-black overflow-hidden flex flex-col relative pt-8">
                        {/* Instagram-style Profile Header (Dark Mode) */}
                        <div className="p-4 border-b border-white/10 flex justify-between items-center sticky top-0 bg-black z-20 text-white">
                            <span className="font-bold text-lg cursor-pointer flex items-center gap-3 active:opacity-60 transition-opacity" onClick={() => setGameState('message_received')}>
                                <span className="text-xl">←</span> <span>@nithya_krishnan</span>
                            </span>
                            <span className="text-xl cursor-pointer p-2 hover:bg-zinc-800 rounded-full transition-colors" onClick={() => setShowProfileMenu(true)}>⋮</span>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-black no-scrollbar pb-32">
                            {/* Profile Info Section */}
                            <div className="p-4 pb-2">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="relative group">
                                        <div className="w-[78px] h-[78px] rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-fuchsia-600 p-[2px] cursor-pointer hover:scale-105 transition-transform"
                                            onClick={() => {
                                                if (!reverseImageSearched) {
                                                    setReverseImageSearched(true);
                                                    setCluesFound(prev => [...prev, 2]);
                                                    showFeedback("🔍 Stock photo detected!");
                                                }
                                            }}>
                                            <div className="w-full h-full rounded-full border-[3px] border-black bg-zinc-900 overflow-hidden flex items-center justify-center text-4xl">
                                                👩
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-6 text-center pr-4 text-white">
                                        <div><div className="font-bold text-[15px]">3</div><div className="text-[11px] text-zinc-400">Posts</div></div>
                                        <div><div className="font-bold text-[15px]">{isFollowing ? "848" : "847"}</div><div className="text-[11px] text-zinc-400">Followers</div></div>
                                        <div className="cursor-pointer active:opacity-60" onClick={() => {
                                            if (!cluesFound.includes(6)) {
                                                setCluesFound(prev => [...prev, 6]);
                                                showFeedback("🔍 Bait Mutual Friends: Added 12 in bulk!");
                                            }
                                        }}>
                                            <div className="font-bold text-[15px]">12</div>
                                            <div className="text-[11px] text-zinc-400">Mutual</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h2 className="font-bold text-[13px] text-white flex items-center gap-1">
                                        Nithya Krishnan
                                        <span className="w-3 h-3 bg-blue-500 text-white rounded-full flex items-center justify-center text-[7px] shadow-sm">✓</span>
                                    </h2>
                                    <p className="text-[12px] text-zinc-300">Architecture @ Sathyabama | Travel ✈️ | Foodie 🍛</p>
                                    <p className="text-[12px] text-zinc-300">"Capturing moments, one click at a time. Proud Chennaiite! 🎀"</p>
                                    <a href="#" className="text-[12px] text-blue-400 font-medium mt-0.5 block hover:underline">sathyabama.edu/portfolio/nithya</a>
                                    
                                    <div className="flex items-center gap-1.5 mt-3 opacity-80 group">
                                        <div className="flex -space-x-2">
                                            <div className="w-5 h-5 rounded-full border-2 border-black bg-blue-400 flex items-center justify-center text-[6px] text-white font-bold">R</div>
                                            <div className="w-5 h-5 rounded-full border-2 border-black bg-pink-400 flex items-center justify-center text-[6px] text-white font-bold">Z</div>
                                        </div>
                                        <p className="text-[11px] text-zinc-400">Followed by <span className="text-white font-bold">rahul_99</span>, <span className="text-white font-bold">zara.v</span> and <span className="text-white font-bold">12 others</span></p>
                                    </div>
                                </div>

                                <div className="flex gap-2 mb-6">
                                    <button 
                                        className={`flex-1 font-bold py-1.5 rounded-lg text-xs transition-all active:scale-95 shadow-sm ${isFollowing ? 'bg-zinc-800 text-white border border-white/5' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                                        onClick={() => setIsFollowing(!isFollowing)}
                                    >
                                        {isFollowing ? "Following" : "Follow"}
                                    </button>
                                    <button className="flex-1 bg-zinc-800 border border-white/5 text-white font-bold py-1.5 rounded-lg text-xs hover:bg-zinc-700 transition-all active:scale-95 shadow-sm" onClick={() => setGameState('message_received')}>Message</button>
                                    <button className="bg-zinc-800 border border-white/5 text-white px-2 rounded-lg hover:bg-zinc-700 transition-all active:scale-95 text-xs shadow-sm">👤+</button>
                                </div>

                                {/* Highlights */}
                                <div className="flex gap-4 overflow-x-auto no-scrollbar mb-4 py-1">
                                    {[
                                        { name: "Dubai 🇦🇪", icon: "🏙️" },
                                        { name: "Work 📉", icon: "📐" },
                                        { name: "Foodie 🍕", icon: "🍱" },
                                        { name: "Fam 💖", icon: "🏠" }
                                    ].map((h, i) => (
                                        <div key={i} className="flex flex-col items-center gap-1 min-w-[56px] cursor-pointer active:opacity-60 transition-opacity">
                                            <div className="w-14 h-14 rounded-full border border-white/10 bg-zinc-900 flex items-center justify-center text-xl shadow-inner">
                                                {h.icon}
                                            </div>
                                            <span className="text-[10px] text-zinc-400 font-medium truncate w-full text-center">{h.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tab Bar */}
                            <div className="flex border-t border-white/10">
                                <button className="flex-1 py-3 flex justify-center border-b border-white text-white">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                                </button>
                                <button className="flex-1 py-3 flex justify-center text-zinc-500 hover:text-white transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </button>
                                <button className="flex-1 py-3 flex justify-center text-zinc-500 hover:text-white transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </button>
                            </div>

                            {/* Post Grid Section (Dark Mode) */}
                            <div className="grid grid-cols-3 gap-0.5">
                                {[
                                    { icon: '🏖️', color: 'bg-zinc-900', type: 'carousel' },
                                    { icon: '📐', color: 'bg-zinc-800', type: 'reel' },
                                    { icon: '☕', color: 'bg-zinc-900', type: 'post' }
                                ].map((post, i) => (
                                    <div key={i} className={`aspect-square ${post.color} flex items-center justify-center text-3xl hover:opacity-80 cursor-pointer relative group transition-opacity`}
                                        onClick={() => {
                                            if (!cluesFound.includes(5)) {
                                                setCluesFound(prev => [...prev, 5]);
                                                showFeedback("🔍 Engagement discrepancy: Comments disabled!");
                                            }
                                        }}>
                                        {post.icon}
                                        {post.type === 'carousel' && (
                                            <div className="absolute top-1.5 right-1.5">
                                                <svg className="w-3.5 h-3.5 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M19 19H5V5h14v14zM5 3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5z" /></svg>
                                            </div>
                                        )}
                                        {post.type === 'reel' && (
                                            <div className="absolute top-1.5 right-1.5">
                                                <svg className="w-3.5 h-3.5 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" /></svg>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sticky Action Button (Dark Mode) */}
                        <div className="absolute bottom-[57px] w-full p-3 bg-black/80 backdrop-blur-md border-t border-white/10 z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]">
                            <button 
                                className={`w-full font-black py-2.5 rounded-xl transition-all shadow-xl flex items-center justify-center gap-2 group ${cluesFound.length >= 6 ? 'bg-blue-500 hover:bg-blue-600 text-white active:scale-95' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-70 border border-slate-700'}`}
                                onClick={() => {
                                    if (cluesFound.length >= 6) {
                                        setGameState('call_real_nithya');
                                    }
                                }}
                                disabled={cluesFound.length < 6}
                            >
                                <span className="text-base">{cluesFound.length >= 6 ? '📞' : '🔒'}</span> 
                                <span className="text-[13px] tracking-tight">
                                    {cluesFound.length >= 6 ? 'Call Real Nithya' : `Gather Evidence (${cluesFound.length}/6)`}
                                </span>
                            </button>
                        </div>

                        <BottomNavBar active="profile" />

                        {/* 3-Dot Menu Modal (Instagram Style - Dark Mode) */}
                        {showProfileMenu && (
                            <div className="absolute inset-0 z-[100] flex items-end">
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowProfileMenu(false)} />
                                <div className="w-full bg-zinc-900 rounded-t-[2.5rem] p-6 relative z-10 animate-in slide-in-from-bottom duration-500 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] flex flex-col pt-4 border-t border-white/5">
                                    <div className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-8 shadow-inner" />
                                    
                                    <div className="flex items-center justify-between mb-6 px-1">
                                        <h3 className="text-white font-bold text-base">About this account</h3>
                                        <button className="text-zinc-500 hover:text-white transition-colors" onClick={() => setShowProfileMenu(false)}>
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-4 mb-4 overflow-y-auto custom-scrollbar pr-1">
                                        <div className="flex items-center gap-4 px-1 group cursor-pointer"
                                            onClick={() => {
                                                if (!cluesFound.includes(1)) {
                                                    setCluesFound(prev => [...prev, 1]);
                                                    showFeedback("🔍 Account created 4 days ago!");
                                                }
                                            }}>
                                            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-lg">📅</div>
                                            <div className="flex-1 pb-4 border-b border-white/5">
                                                <p className="text-[13px] text-white font-medium">Date joined</p>
                                                <p className="text-[12px] text-zinc-400">March 2026</p>
                                            </div>
                                            {cluesFound.includes(1) && <span className="text-red-500 text-sm">🚩</span>}
                                        </div>

                                        <div className="flex items-center gap-4 px-1 group cursor-pointer"
                                            onClick={() => {
                                                if (!cluesFound.includes(4)) {
                                                    setCluesFound(prev => [...prev, 4]);
                                                    showFeedback("🔍 Location mismatch: Account based in Lagos!");
                                                }
                                            }}>
                                            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-lg">📍</div>
                                            <div className="flex-1 pb-4 border-b border-white/5">
                                                <p className="text-[13px] text-white font-medium">Account based in</p>
                                                <p className="text-[12px] text-zinc-400">Lagos, Nigeria</p>
                                            </div>
                                            {cluesFound.includes(4) && <span className="text-red-500 text-sm">🚩</span>}
                                        </div>

                                        <div className="flex items-center gap-4 px-1 group cursor-pointer"
                                            onClick={() => {
                                                if (!cluesFound.includes(3)) {
                                                    setCluesFound(prev => [...prev, 3]);
                                                    showFeedback("🔍 Former usernames: 4 changes detected!");
                                                }
                                            }}>
                                            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-lg">📝</div>
                                            <div className="flex-1 pb-4 border-b border-white/5">
                                                <p className="text-[13px] text-white font-medium">Former usernames</p>
                                                <p className="text-[12px] text-zinc-400">4</p>
                                            </div>
                                            {cluesFound.includes(3) && <span className="text-red-500 text-sm">🚩</span>}
                                        </div>
                                        
                                        <div className="h-px bg-white/5 mx-1 my-2" />
                                        
                                        <button className="w-full text-left px-1 py-3 text-red-500 font-bold flex items-center gap-4 hover:opacity-80 transition-opacity">
                                            <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center text-lg">🚫</div>
                                            <span className="text-[13px]">Block this account</span>
                                        </button>
                                        <button className="w-full text-left px-1 py-1 text-red-500 font-bold flex items-center gap-4 hover:opacity-80 transition-opacity">
                                            <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center text-lg">🚩</div>
                                            <span className="text-[13px]">Report profile</span>
                                        </button>
                                    </div>

                                    <button className="w-full py-4 text-white font-bold text-sm border-t border-white/5 bg-transparent active:opacity-60 transition-opacity" onClick={() => setShowProfileMenu(false)}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Forensic Analysis Toggle (Detective Mode) */}
                        <div className="absolute bottom-10 left-6 z-100 flex flex-col items-center gap-2">
                            <button
                                className="w-14 h-14 bg-slate-900 hover:bg-black rounded-2xl flex items-center justify-center shadow-[0_15px_35px_rgba(0,0,0,0.4)] border border-white/20 group transition-all active:scale-90"
                                onClick={() => setIsDetectiveModeOpen(!isDetectiveModeOpen)}
                                title="Forensic Analysis"
                            >
                                <div className="relative">
                                    <svg className={`w-7 h-7 text-blue-400 group-hover:text-blue-300 transition-colors ${isDetectiveModeOpen ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h.01M12 12h.01M15 15h.01"></path>
                                    </svg>
                                    {cluesFound.length > 0 && (
                                        <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-lg animate-bounce">
                                            {cluesFound.length}
                                        </div>
                                    )}
                                </div>
                            </button>
                            <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] shadow-sm">Analysis</span>
                        </div>
                    </div>
                </div>

                {/* Detective Board - Cork board style */}
                <div
                    className="relative w-[580px] h-[750px] rounded-sm shadow-2xl z-[200] p-6 flex flex-col border-[16px] border-[#382315] overflow-hidden"
                    style={{
                        backgroundImage: `
                            url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23a)' opacity='.3'/%3E%3C/svg%3E"),
                            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139,69,19,0.05) 2px, rgba(139,69,19,0.05) 4px),
                            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,69,19,0.05) 2px, rgba(139,69,19,0.05) 4px)
                        `,
                        backgroundColor: '#9A6A45',
                        boxShadow: 'inset 0 0 80px rgba(0,0,0,0.6), -10px 0 40px rgba(0,0,0,0.5)'
                    }}
                >
                    {/* Dark gradient corners for realism */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none"></div>

                    {/* Removed Red Strings as per user request */}

                    {/* Header Label with Meter */}
                    <div className="flex justify-between items-start mb-6 z-10 gap-4 relative">
                        {/* Folder Tab Style Header */}
                        <div className="bg-[#EED09D] p-3 pl-5 pr-8 rounded-t-sm shadow-xl transform -rotate-2 border-b-2 border-[#D7B77E] relative before:absolute before:content-[''] before:top-0 before:right-[-20px] before:w-5 before:h-full before:bg-[#EED09D] before:skew-x-[20deg] before:origin-bottom" style={{ boxShadow: '2px 4px 10px rgba(0,0,0,0.3)' }}>
                            <h2 className="text-xl font-black text-[#5C4033] uppercase tracking-[0.1em] font-mono">
                                PROFILE FORENSICS
                            </h2>
                            <p className="text-[#8B6508] text-[10.5px] font-mono mt-0.5 font-bold uppercase tracking-widest">Case File: Impersonation</p>
                        </div>

                        {/* High-Tech Threat Intelligence Meter */}
                        <div className="bg-slate-900/90 backdrop-blur-md rounded-xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.7)] border border-slate-700/50 w-52 transform rotate-1 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/10 blur-xl rounded-full pointer-events-none"></div>
                            <h3 className="text-[11px] text-slate-300 uppercase font-mono font-bold tracking-widest mb-2 flex justify-between items-center">
                                <span>Threat Lvl</span>
                                <span className="font-black text-sm" style={{ color: cluesFound.length > 3 ? '#ef4444' : cluesFound.length > 1 ? '#eab308' : '#22c55e' }}>{cluesFound.length}/{CLUE_DATA.length}</span>
                            </h3>
                            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                                <div
                                    className="h-full transition-all duration-700 relative overflow-hidden"
                                    style={{
                                        width: `${(cluesFound.length / CLUE_DATA.length) * 100}%`,
                                        backgroundColor: cluesFound.length > 3 ? '#ef4444' : cluesFound.length > 1 ? '#eab308' : '#22c55e'
                                    }}
                                >
                                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:1rem_1rem] animate-[shimmer_1s_linear_infinite]"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative z-10 flex-1 w-full h-full">
                        {/* Clue Polaroids - Rectangular Case-File Note Style */}

                        {cluesFound.includes(1) && (
                            <div
                                className="absolute bg-[#FAFAFA] pt-5 px-4 pb-4 shadow-[0_15px_30px_rgba(0,0,0,0.6)] w-[260px] border border-stone-200 z-10 flex flex-col animate-in zoom-in-95 duration-500"
                                style={{ left: -20, top: 20, transform: 'rotate(-2deg)' }}
                            >
                                {/* Hyper-realistic Red Pin Component */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-400 to-red-700 shadow-[0_5px_8px_rgba(0,0,0,0.5),inset_0_-2px_4px_rgba(0,0,0,0.4)] border border-red-800 flex items-center justify-center relative">
                                        <div className="w-2 h-2 rounded-full bg-white/50 absolute top-0.5 right-0.5 blur-[0.5px]"></div>
                                        <div className="absolute top-[18px] left-[9px] w-[2px] h-3 bg-gradient-to-r from-gray-400 to-gray-200 shadow-[2px_2px_2px_rgba(0,0,0,0.4)] -z-10 transform -rotate-6"></div>
                                    </div>
                                    <div className="absolute top-2 left-3 w-3 h-3 rounded-full bg-black/50 blur-[1.5px] -z-20"></div>
                                </div>

                                <h4 className="font-bold text-red-900 tracking-wide mb-2 text-[11.5px] leading-tight border-b border-stone-300 pb-1.5 uppercase font-mono">Account vs. Relationship Age</h4>
                                <p className="text-[11.5px] text-stone-700 font-serif leading-relaxed">Your friendship with Nithya is 6 years old. Her real profile is 6 years old. This forged account was created a mere 4 days ago.</p>
                            </div>
                        )}

                        {cluesFound.includes(2) && (
                            <div
                                className="absolute bg-[#FAFAFA] pt-5 px-4 pb-4 shadow-[0_15px_30px_rgba(0,0,0,0.6)] w-[260px] border border-stone-200 z-10 flex flex-col animate-in zoom-in-95 duration-500"
                                style={{ left: 260, top: 20, transform: 'rotate(1.5deg)' }}
                            >
                                {/* Hyper-realistic Red Pin Component */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-400 to-red-700 shadow-[0_5px_8px_rgba(0,0,0,0.5),inset_0_-2px_4px_rgba(0,0,0,0.4)] border border-red-800 flex items-center justify-center relative">
                                        <div className="w-2 h-2 rounded-full bg-white/50 absolute top-0.5 right-0.5 blur-[0.5px]"></div>
                                        <div className="absolute top-[18px] left-[9px] w-[2px] h-3 bg-gradient-to-r from-gray-400 to-gray-200 shadow-[2px_2px_2px_rgba(0,0,0,0.4)] -z-10 transform rotate-12"></div>
                                    </div>
                                    <div className="absolute top-2 left-3 w-3 h-3 rounded-full bg-black/50 blur-[1.5px] -z-20"></div>
                                </div>

                                <h4 className="font-bold text-red-900 tracking-wide mb-2 text-[11.5px] leading-tight border-b border-stone-300 pb-1.5 uppercase font-mono">Stock Photo Identity</h4>
                                <p className="text-[11.5px] text-stone-700 font-serif leading-relaxed">Reverse image search reveals the profile photo is sourced from generic online stock libraries. Real Nithya uses personal photos.</p>
                            </div>
                        )}

                        {cluesFound.includes(3) && (
                            <div
                                className="absolute bg-[#FAFAFA] pt-5 px-4 pb-4 shadow-[0_15px_30px_rgba(0,0,0,0.6)] w-[260px] border border-stone-200 z-10 flex flex-col animate-in zoom-in-95 duration-500"
                                style={{ left: -20, top: 200, transform: 'rotate(-1.5deg)' }}
                            >
                                {/* Hyper-realistic Red Pin Component */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-400 to-red-700 shadow-[0_5px_8px_rgba(0,0,0,0.5),inset_0_-2px_4px_rgba(0,0,0,0.4)] border border-red-800 flex items-center justify-center relative">
                                        <div className="w-2 h-2 rounded-full bg-white/50 absolute top-0.5 right-0.5 blur-[0.5px]"></div>
                                        <div className="absolute top-[18px] left-[9px] w-[2px] h-3 bg-gradient-to-r from-gray-400 to-gray-200 shadow-[2px_2px_2px_rgba(0,0,0,0.4)] -z-10 transform -rotate-3"></div>
                                    </div>
                                    <div className="absolute top-2 left-3 w-3 h-3 rounded-full bg-black/50 blur-[1.5px] -z-20"></div>
                                </div>

                                <h4 className="font-bold text-red-900 tracking-wide mb-2 text-[11.5px] leading-tight border-b border-stone-300 pb-1.5 uppercase font-mono">Volatile Username History</h4>
                                <p className="text-[11.5px] text-stone-700 font-serif leading-relaxed">This account has changed its handle 4 times within a single month. This rapid switching is a blatant impersonation tactic.</p>
                            </div>
                        )}

                        {cluesFound.includes(4) && (
                            <div
                                className="absolute bg-[#FAFAFA] pt-5 px-4 pb-4 shadow-[0_15px_30px_rgba(0,0,0,0.6)] w-[260px] border border-stone-200 z-10 flex flex-col animate-in zoom-in-95 duration-500"
                                style={{ left: 260, top: 200, transform: 'rotate(2.5deg)' }}
                            >
                                {/* Hyper-realistic Red Pin Component */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-400 to-red-700 shadow-[0_5px_8px_rgba(0,0,0,0.5),inset_0_-2px_4px_rgba(0,0,0,0.4)] border border-red-800 flex items-center justify-center relative">
                                        <div className="w-2 h-2 rounded-full bg-white/50 absolute top-0.5 right-0.5 blur-[0.5px]"></div>
                                        <div className="absolute top-[18px] left-[9px] w-[2px] h-3 bg-gradient-to-r from-gray-400 to-gray-200 shadow-[2px_2px_2px_rgba(0,0,0,0.4)] -z-10 transform rotate-6"></div>
                                    </div>
                                    <div className="absolute top-2 left-3 w-3 h-3 rounded-full bg-black/50 blur-[1.5px] -z-20"></div>
                                </div>

                                <h4 className="font-bold text-red-900 tracking-wide mb-2 text-[11.5px] leading-tight border-b border-stone-300 pb-1.5 uppercase font-mono">Geolocation Mismatch</h4>
                                <p className="text-[11.5px] text-stone-700 font-serif leading-relaxed">Network metadata pinpoints the account to Nigeria, directly contradicting the Chennai/Coimbatore narrative. Clear offshore fraud indicator.</p>
                            </div>
                        )}

                        {cluesFound.includes(5) && (
                            <div
                                className="absolute bg-[#FAFAFA] pt-5 px-4 pb-4 shadow-[0_15px_30px_rgba(0,0,0,0.6)] w-[260px] border border-stone-200 z-10 flex flex-col animate-in zoom-in-95 duration-500"
                                style={{ left: -20, top: 380, transform: 'rotate(-2.5deg)' }}
                            >
                                {/* Hyper-realistic Red Pin Component */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-400 to-red-700 shadow-[0_5px_8px_rgba(0,0,0,0.5),inset_0_-2px_4px_rgba(0,0,0,0.4)] border border-red-800 flex items-center justify-center relative">
                                        <div className="w-2 h-2 rounded-full bg-white/50 absolute top-0.5 right-0.5 blur-[0.5px]"></div>
                                        <div className="absolute top-[18px] left-[9px] w-[2px] h-3 bg-gradient-to-r from-gray-400 to-gray-200 shadow-[2px_2px_2px_rgba(0,0,0,0.4)] -z-10 transform -rotate-12"></div>
                                    </div>
                                    <div className="absolute top-2 left-3 w-3 h-3 rounded-full bg-black/50 blur-[1.5px] -z-20"></div>
                                </div>

                                <h4 className="font-bold text-red-900 tracking-wide mb-2 text-[11.5px] leading-tight border-b border-stone-300 pb-1.5 uppercase font-mono">Engagement Discrepancy</h4>
                                <p className="text-[11.5px] text-stone-700 font-serif leading-relaxed">Despite boasting 847 followers, posts have zero organic comments and hidden likes. The followers are likely a purchased bot net.</p>
                            </div>
                        )}

                        {cluesFound.includes(6) && (
                            <div
                                className="absolute bg-[#FAFAFA] pt-5 px-4 pb-4 shadow-[0_15px_30px_rgba(0,0,0,0.6)] w-[260px] border border-stone-200 z-10 flex flex-col animate-in zoom-in-95 duration-500"
                                style={{ left: 260, top: 380, transform: 'rotate(1deg)' }}
                            >
                                {/* Hyper-realistic Red Pin Component */}
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-400 to-red-700 shadow-[0_5px_8px_rgba(0,0,0,0.5),inset_0_-2px_4px_rgba(0,0,0,0.4)] border border-red-800 flex items-center justify-center relative">
                                        <div className="w-2 h-2 rounded-full bg-white/50 absolute top-0.5 right-0.5 blur-[0.5px]"></div>
                                        <div className="absolute top-[18px] left-[9px] w-[2px] h-3 bg-gradient-to-r from-gray-400 to-gray-200 shadow-[2px_2px_2px_rgba(0,0,0,0.4)] -z-10 transform rotate-3"></div>
                                    </div>
                                    <div className="absolute top-2 left-3 w-3 h-3 rounded-full bg-black/50 blur-[1.5px] -z-20"></div>
                                </div>

                                <h4 className="font-bold text-red-900 tracking-wide mb-2 text-[11.5px] leading-tight border-b border-stone-300 pb-1.5 uppercase font-mono">Bait Mutual Network</h4>
                                <p className="text-[11.5px] text-stone-700 font-serif leading-relaxed">The fake account systematically added 12 mutual friends in a bulk operation just days ago to artificially engineer 'social proof'.</p>
                            </div>
                        )}

                        {/* Locked Evidence Cards - Rectangular Style */}
                        {!cluesFound.includes(1) && (
                            <div
                                className="absolute bg-stone-300/80 backdrop-blur-sm pt-5 px-4 pb-4 shadow-xl w-[260px] border-2 border-dashed border-stone-400 z-5 flex flex-col opacity-80"
                                style={{ left: -20, top: 20, transform: 'rotate(-1.5deg)' }}
                            >
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-stone-500 rounded-full flex items-center justify-center shadow-md border border-stone-600">
                                    <span className="text-white text-[10px] font-black">🔒</span>
                                </div>
                                <h4 className="font-black text-stone-600 tracking-widest mb-2 text-[10px] leading-tight border-b border-stone-400/50 pb-1 uppercase font-mono">FILE #01: PENDING</h4>
                                <p className="text-[11px] text-stone-600 italic font-serif leading-tight">Hint: Compare the creation date in account transparency with how long you've known her.</p>
                            </div>
                        )}

                        {!cluesFound.includes(2) && (
                            <div
                                className="absolute bg-stone-300/80 backdrop-blur-sm pt-5 px-4 pb-4 shadow-xl w-[260px] border-2 border-dashed border-stone-400 z-5 flex flex-col opacity-80"
                                style={{ left: 260, top: 20, transform: 'rotate(1.5deg)' }}
                            >
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-stone-500 rounded-full flex items-center justify-center shadow-md border border-stone-600">
                                    <span className="text-white text-[10px] font-black">🔒</span>
                                </div>
                                <h4 className="font-black text-stone-600 tracking-widest mb-2 text-[10px] leading-tight border-b border-stone-400/50 pb-1 uppercase font-mono">FILE #02: PENDING</h4>
                                <p className="text-[11px] text-stone-600 italic font-serif leading-tight">Hint: Is that profile picture a real selfie? Click the avatar to inspect.</p>
                            </div>
                        )}

                        {!cluesFound.includes(3) && (
                            <div
                                className="absolute bg-stone-300/80 backdrop-blur-sm pt-5 px-4 pb-4 shadow-xl w-[260px] border-2 border-dashed border-stone-400 z-5 flex flex-col opacity-80"
                                style={{ left: -20, top: 200, transform: 'rotate(0.5deg)' }}
                            >
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-stone-500 rounded-full flex items-center justify-center shadow-md border border-stone-600">
                                    <span className="text-white text-[10px] font-black">🔒</span>
                                </div>
                                <h4 className="font-black text-stone-600 tracking-widest mb-2 text-[10px] leading-tight border-b border-stone-400/50 pb-1 uppercase font-mono">FILE #03: PENDING</h4>
                                <p className="text-[11px] text-stone-600 italic font-serif leading-tight">Hint: Check the 'Former Usernames' count in the transparency menu.</p>
                            </div>
                        )}

                        {!cluesFound.includes(4) && (
                            <div
                                className="absolute bg-stone-300/80 backdrop-blur-sm pt-5 px-4 pb-4 shadow-xl w-[260px] border-2 border-dashed border-stone-400 z-5 flex flex-col opacity-80"
                                style={{ left: 260, top: 200, transform: 'rotate(-0.5deg)' }}
                            >
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-stone-500 rounded-full flex items-center justify-center shadow-md border border-stone-600">
                                    <span className="text-white text-[10px] font-black">🔒</span>
                                </div>
                                <h4 className="font-black text-stone-600 tracking-widest mb-2 text-[10px] leading-tight border-b border-stone-400/50 pb-1 uppercase font-mono">FILE #04: PENDING</h4>
                                <p className="text-[11px] text-stone-600 italic font-serif leading-tight">Hint: Inspect the actual geolocation data from the account transparency menu.</p>
                            </div>
                        )}

                        {!cluesFound.includes(5) && (
                            <div
                                className="absolute bg-stone-300/80 backdrop-blur-sm pt-5 px-4 pb-4 shadow-xl w-[260px] border-2 border-dashed border-stone-400 z-5 flex flex-col opacity-80"
                                style={{ left: -20, top: 380, transform: 'rotate(1deg)' }}
                            >
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-stone-500 rounded-full flex items-center justify-center shadow-md border border-stone-600">
                                    <span className="text-white text-[10px] font-black">🔒</span>
                                </div>
                                <h4 className="font-black text-stone-600 tracking-widest mb-2 text-[10px] leading-tight border-b border-stone-400/50 pb-1 uppercase font-mono">FILE #05: PENDING</h4>
                                <p className="text-[11px] text-stone-600 italic font-serif leading-tight">Hint: Click on the image grid. Why are the engagement metrics hidden or zero?</p>
                            </div>
                        )}

                        {!cluesFound.includes(6) && (
                            <div
                                className="absolute bg-stone-300/80 backdrop-blur-sm pt-5 px-4 pb-4 shadow-xl w-[260px] border-2 border-dashed border-stone-400 z-5 flex flex-col opacity-80"
                                style={{ left: 260, top: 380, transform: 'rotate(-1deg)' }}
                            >
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-stone-500 rounded-full flex items-center justify-center shadow-md border border-stone-600">
                                    <span className="text-white text-[10px] font-black">🔒</span>
                                </div>
                                <h4 className="font-black text-stone-600 tracking-widest mb-2 text-[10px] leading-tight border-b border-stone-400/50 pb-1 uppercase font-mono">FILE #06: PENDING</h4>
                                <p className="text-[11px] text-stone-600 italic font-serif leading-tight">Hint: Tap the 'Mutual' followers stat. Notice when they were added.</p>
                            </div>
                        )}

                        {cluesFound.length === 0 && (
                            <div className="absolute top-[25%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#382315]/40 text-center font-mono font-black text-2xl rotate-[-2deg] border-[3px] border-dashed border-[#382315]/20 p-8 rounded-xl z-0 pointer-events-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.1)]">
                                AWAITING EVIDENCE<br />
                                <span className="text-sm tracking-widest mt-2 block font-medium opacity-80 decoration-wavy">CLICK PROFILE ELEMENTS TO INVESTIGATE</span>
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
                    {/* Single Phone UI (Outgoing Call) */}
                    <div className="w-[380px] max-h-[90vh] h-[750px] bg-black border-x-[12px] border-t-[12px] border-b-[24px] border-black rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col items-center justify-center">
                        {/* Dynamic Island */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-50 flex items-center justify-center">
                            <div className="w-2 h-2 bg-slate-700 rounded-full" />
                        </div>

                        <div className="w-full h-full bg-black flex flex-col items-center text-white relative overflow-hidden pt-20">
                            {/* Ripple effect */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none mt-20 opacity-30">
                                <div className="w-64 h-64 border border-white/20 rounded-full animate-ping" />
                                <div className="absolute w-80 h-80 border border-white/10 rounded-full animate-ping" style={{ animationDelay: '0.8s' }} />
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

                                <button className="w-20 h-20 bg-neutral-800 hover:bg-neutral-700 rounded-full flex items-center justify-center border border-neutral-600 mx-auto transition-colors">
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
            }
        };



        return (
            <div className="w-full h-full flex items-center justify-center p-8 relative overflow-hidden bg-black">
                {/* Bedroom background */}
                <div className="absolute inset-0 z-0" style={{ backgroundImage: "url('/assets/bedplain.png')", backgroundSize: 'cover', backgroundPosition: 'center', filter: 'brightness(0.3) blur(8px)' }} />
                <div className="absolute inset-0 bg-black/60 mix-blend-multiply z-10 pointer-events-none"></div>

                <div className="relative z-20">
                    {/* Single Phone UI (Connected Call) */}
                    <div className="w-[380px] max-h-[90vh] h-[750px] bg-black border-x-[12px] border-t-[12px] border-b-[24px] border-black rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col">
                        <StatusBar dark={false} />

                        {/* Dynamic Island */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-50 flex items-center justify-center">
                            <div className="w-2 h-2 bg-slate-700 rounded-full" />
                            <div className="absolute right-3 w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse shadow-[0_0_5px_rgba(255,255,255,0.2)]" />
                        </div>

                        <div className="w-full h-full bg-black overflow-hidden flex flex-col relative pt-10">
                            {/* Blurred ambient background effect inside phone */}
                            <div className="absolute inset-0 z-0 opacity-10">
                                <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full blur-[80px]"></div>
                                <div className="absolute bottom-40 left-10 w-40 h-40 bg-white rounded-full blur-[80px]"></div>
                            </div>

                            {/* Call Header */}
                            <div className="px-6 py-4 flex flex-col items-center border-b border-white/5 bg-black/20 backdrop-blur-md z-10 mt-6">
                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-3xl mb-3 shadow-[0_5px_15px_rgba(0,0,0,0.3)] border-2 border-white/10">
                                    👩
                                </div>
                                <h2 className="text-white font-black text-xl mb-1 drop-shadow-md">Nithya</h2>
                                <div className="flex gap-2 items-center">
                                    <span className="text-white text-[11px] font-mono font-bold tracking-widest uppercase opacity-90">Connected 00:0{dialogueIndex + 2}</span>
                                </div>
                            </div>

                            {/* Live Transcript / Dialogue */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar z-10 pb-32">
                                <div className="flex justify-center items-end gap-1 h-12 mb-6 opacity-40">
                                    {[3, 5, 2, 8, 4, 3, 6, 2, 7, 4, 5, 2, 4, 3].map((h, i) => (
                                        <div key={i} className="w-1 bg-white rounded-full animate-pulse" style={{ height: `${h * 4}px`, animationDelay: `${i * 0.1}s` }} />
                                    ))}
                                </div>

                                {dialogueLines.slice(0, dialogueIndex + 1).map((line, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex flex-col ${line.sender === 'you' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-500`}
                                        style={{ animationDelay: `${idx * 0.1}s` }}
                                    >
                                        <span className={`text-[9px] mb-1 font-bold uppercase tracking-widest ${line.sender === 'you' ? 'text-neutral-400 mr-1' : 'text-neutral-400 ml-1'}`}>
                                            {line.sender === 'you' ? 'You' : 'Nithya (Real)'}
                                        </span>
                                        <div className={`max-w-[85%] p-4 rounded-[1.2rem] shadow-lg text-[13px] leading-relaxed border ${line.sender === 'you'
                                            ? 'bg-neutral-800 border-neutral-700 text-white rounded-tr-sm'
                                            : 'bg-white border-gray-200 text-black rounded-tl-sm'
                                            }`}>
                                            "{line.text}"
                                        </div>
                                    </div>
                                ))}
                                
                                <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })} />
                            </div>

                            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent z-20 pb-10 flex flex-col items-center">
                                {dialogueIndex < dialogueLines.length - 1 ? (
                                    <button
                                        className="w-full bg-white text-black font-bold py-4 rounded-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 hover:bg-gray-200"
                                        onClick={showNextLine}
                                    >
                                        <span>Continue Conversation</span>
                                    </button>
                                ) : (
                                        <button className="w-full bg-white text-black hover:bg-gray-200 font-bold py-4 rounded-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 text-sm max-w-sm mx-auto"
                                            onClick={() => setGameState('report_fake_account')}>
                                            Proceed to Report Account
                                        </button>
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
                <div className="w-[380px] max-h-[90vh] h-[700px] bg-black border-[2px] border-neutral-800 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col">
                    <StatusBar dark={false} />

                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-neutral-900 rounded-b-2xl z-50 flex items-center justify-center border-b border-x border-neutral-800">
                        <div className="w-2 h-2 bg-neutral-700 rounded-full" />
                    </div>

                    <div className="w-full h-full bg-black text-white flex flex-col relative pt-10 rounded-[3rem] mt-2 overflow-hidden border border-neutral-900">
                        <div className="border-b border-neutral-800 px-5 py-4 bg-neutral-900 flex-shrink-0">
                            <h2 className="font-bold text-lg text-white">Report Profile</h2>
                            <p className="text-xs text-neutral-400 mt-0.5">Help keep our community safe</p>
                        </div>

                        <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                            <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800">
                                <p className="font-bold mb-3 text-sm text-neutral-400">Reporting:</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center text-lg font-bold">N</div>
                                    <div>
                                        <p className="font-bold text-sm text-white">Nithya Krishnan</p>
                                        <p className="text-xs text-neutral-500">@nithya_krishnan</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="font-bold text-sm text-neutral-400">Reason for report:</p>
                                <label className="flex items-center gap-3 p-3 bg-neutral-800 border-2 border-white rounded-xl cursor-pointer">
                                    <input type="radio" name="report" className="w-4 h-4 accent-white" defaultChecked />
                                    <span className="font-bold text-white text-sm">Impersonation</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-xl cursor-pointer hover:bg-neutral-800 transition-colors">
                                    <input type="radio" name="report" className="w-4 h-4 accent-white" />
                                    <span className="text-neutral-300 font-medium text-sm">Spam</span>
                                </label>
                                <label className="flex items-center gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-xl cursor-pointer hover:bg-neutral-800 transition-colors">
                                    <input type="radio" name="report" className="w-4 h-4 accent-white" />
                                    <span className="text-neutral-300 font-medium text-sm">Fake Account</span>
                                </label>
                            </div>

                            <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800">
                                <p className="font-bold text-white mb-2 text-sm">Additional Details:</p>
                                <p className="text-xs text-neutral-400 leading-relaxed">This account is impersonating my real friend Nithya Krishnan to solicit money through fake emergency stories. The profile uses stock photos and was recently created.</p>
                            </div>
                        </div>

                        <div className="p-4 bg-black border-t border-neutral-800 space-y-3 flex-shrink-0">
                            <button className={`w-full font-bold py-4 rounded-xl transition-all shadow-xl active:scale-95 ${scamReported ? 'bg-emerald-500 text-white' : 'bg-white hover:bg-gray-200 text-black'}`}
                                onClick={() => {
                                    if(scamReported) return;
                                    setScamReported(true);
                                    showFeedback("Report submitted.");
                                    setTimeout(() => setGameState('alert_community'), 1500);
                                }}>
                                {scamReported ? '✓ Reported' : 'Submit Report'}
                            </button>
                            <button className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-medium py-3 rounded-xl transition-all text-sm border border-neutral-800"
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

                <div className="w-[380px] max-h-[90vh] h-[700px] bg-black border-[2px] border-neutral-800 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col">
                    <StatusBar />

                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-neutral-900 rounded-b-2xl z-50 flex items-center justify-center border-b border-x border-neutral-800">
                        <div className="w-2 h-2 bg-neutral-700 rounded-full" />
                    </div>

                    <div className="w-full h-full bg-black text-white flex flex-col relative pt-10 rounded-[3rem] mt-2 overflow-hidden border border-neutral-900">
                        <div className="bg-neutral-900 border-b border-neutral-800 px-5 py-4 flex-shrink-0">
                            <h2 className="font-bold text-lg text-white">College Friends Group</h2>
                            <p className="text-xs text-neutral-400 mt-0.5">12 members</p>
                        </div>

                        <div className="flex-1 p-4 space-y-4 bg-black overflow-y-auto custom-scrollbar">
                            {alertStep >= 1 && (
                                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl animate-in slide-in-from-bottom-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 bg-neutral-800 rounded-full flex items-center justify-center text-white font-bold text-sm">!</div>
                                        <p className="font-bold text-white text-sm">SECURITY ALERT</p>
                                    </div>
                                    <p className="text-xs text-neutral-400 leading-relaxed">A fake account impersonating Nithya Krishnan is sending fraud messages asking for money. DO NOT send any money. Report the account immediately. The real Nithya is safe in Chennai.</p>
                                </div>
                            )}

                            <div className="space-y-4 pt-2">
                                {alertStep >= 2 && (
                                    <div className="flex gap-3 items-start animate-in slide-in-from-bottom-2">
                                        <div className="w-9 h-9 bg-neutral-800 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">A</div>
                                        <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-2xl rounded-tl-sm flex-1">
                                            <p className="font-bold text-xs mb-1 text-neutral-300">Arjun</p>
                                            <p className="text-xs text-neutral-400">Thanks for the warning! I almost sent money yesterday</p>
                                        </div>
                                    </div>
                                )}

                                {alertStep >= 3 && (
                                    <div className="flex gap-3 items-start animate-in slide-in-from-bottom-2">
                                        <div className="w-9 h-9 bg-neutral-800 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">P</div>
                                        <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-2xl rounded-tl-sm flex-1">
                                            <p className="font-bold text-xs mb-1 text-neutral-300">Priya</p>
                                            <p className="text-xs text-neutral-400">Just reported the account! Everyone stay safe</p>
                                        </div>
                                    </div>
                                )}

                                {alertStep >= 4 && (
                                    <div className="flex gap-3 items-start animate-in slide-in-from-bottom-2">
                                        <div className="w-9 h-9 bg-neutral-800 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">R</div>
                                        <div className="bg-neutral-900 border border-neutral-800 p-3 rounded-2xl rounded-tl-sm flex-1">
                                            <p className="font-bold text-xs mb-1 text-neutral-300">Rahul</p>
                                            <p className="text-xs text-neutral-400">You saved us all! Thank you for being careful</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })} />
                        </div>

                        <div className="p-4 bg-black border-t border-neutral-800 flex-shrink-0">
                            {alertStep === 0 ? (
                                <button className="w-full bg-white hover:bg-gray-200 text-black font-bold py-4 rounded-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                                    onClick={() => {
                                        setAlertStep(1);
                                        setTimeout(() => setAlertStep(2), 1500);
                                        setTimeout(() => setAlertStep(3), 3000);
                                        setTimeout(() => setAlertStep(4), 4500);
                                    }}>
                                    <span>Send Warning</span>
                                </button>
                            ) : alertStep < 4 ? (
                                <div className="w-full bg-neutral-900 text-neutral-500 font-bold py-4 rounded-xl flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-neutral-500 border-t-white rounded-full animate-spin"></div>
                                    <span>Friends are typing...</span>
                                </div>
                            ) : (
                                <button className="w-full bg-neutral-800 hover:bg-red-600 border border-neutral-700 hover:border-red-600 text-white font-bold py-4 rounded-xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                                    onClick={() => {
                                        setCommunityAlerted(true);
                                        setGameState('final_sleep');
                                    }}>
                                    <span>Hang Up Call</span>
                                    <span className="text-xl rotate-[135deg]">📞</span>
                                </button>
                            )}
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

                    <div className={`absolute bottom-0 left-0 right-0 pointer-events-none transition-opacity duration-[2000ms] ${finalSleepStep >= 1 ? 'opacity-100' : 'opacity-0'} z-30 flex flex-col items-center pb-20`}>
                        {/* Dark gradient backdrop strip */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                        
                        <div className="relative flex flex-col items-center gap-4">
                            <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                            <p className="text-white text-xl font-bold uppercase tracking-[0.2em] px-12 max-w-3xl text-center drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                                "That's enough phone for today. Time to sleep."
                            </p>
                            <div className="h-px w-12 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        </div>
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
                        <div className="bg-black border border-slate-700/50 rounded-3xl p-8 w-56 shadow-2xl">
                            <div className="text-5xl text-emerald-400 font-black mb-3">+35</div>
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-[0.2em]">Safety Score</div>
                        </div>
                        <div className="bg-black border border-slate-700/50 rounded-3xl p-8 w-56 shadow-2xl flex flex-col items-center justify-center">
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
                    <button className="w-full bg-black hover:bg-black text-white font-black py-8 rounded-[2.5rem] text-3xl shadow-3xl transition-all hover:scale-105 active:scale-95 uppercase tracking-widest"
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

    return (
        <div className="w-full h-full bg-black relative overflow-hidden flex items-center justify-center">
            <LocalStyles />
            {/* LEVEL 9 GLOBAL WRAPPER - Ensures persistent black background and transitions */}
            <div className={`absolute inset-0 bg-black z-[9999] transition-opacity duration-[800ms] pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
            <FeedbackToast />
            {renderGameState()}
        </div>
    );
};

export default Level9;


