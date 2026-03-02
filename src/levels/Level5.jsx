import React, { useState, useEffect } from 'react';
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
                    <path d="M2 17h20v2H2zm1.15-4.05L4 11.47l.85 1.48 1.3-.75-.85-1.48H7v-1.5H5.3l.85-1.48L4.85 7.47 4 8.95l-.85-1.48L2.3 7.47l.85 1.48H1v1.5h2.15l-.85 1.48 1.3.75.85-1.48 1.3.75-.85 1.48z"/>
                </svg>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M1 9l2-2v8h18V7l2 2V5c0-.55-.45-1-1-1H3c-.55 0-1 .45-1 1v4z"/>
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

const Level5 = () => {
    const { completeLevel, adjustAssets, adjustLives } = useGameState();
    const [playerPos, setPlayerPos] = useState({ x: 200, y: 600 });
    const [keys, setKeys] = useState({});
    const [gameState, setGameState] = useState('room_intro');
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

    // Handle Interaction Key (E)
    useEffect(() => {
        if (keys['e'] && canInteract && gameState === 'room_intro') {
            setGameState('social_media_feed');
        }
    }, [keys, canInteract, gameState]);

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
        if (gameState !== 'room_intro') return;

        let frameId;
        const loop = () => {
            const currentRoomWidth = Math.max(ROOM_WIDTH, windowWidth);
            setPlayerPos(p => {
                let nx = p.x, ny = p.y;
                if (keys['w'] || keys['arrowup']) ny -= SPEED;
                if (keys['s'] || keys['arrowdown']) ny += SPEED;
                if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                if (keys['d'] || keys['arrowright']) nx += SPEED;
                nx = Math.max(0, Math.min(nx, currentRoomWidth - PLAYER_SIZE));
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

        return () => {
            if (frameId) {
                cancelAnimationFrame(frameId);
            }
        };
    }, [keys, gameState, windowWidth]);

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

    // No auto-escalation — player makes choices at each step

    const playerScale = 0.6 + (playerPos.y / ROOM_HEIGHT) * 0.4;

    const showFeedback = (msg) => { setFeedbackMsg(msg); setTimeout(() => setFeedbackMsg(null), 2500); };

    const FeedbackToast = () => feedbackMsg ? (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[500] bg-blue-500 text-white font-black px-10 py-4 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.5)] animate-bounce text-xl border-4 border-white">
            {feedbackMsg}
        </div>
    ) : null;

    // ROOM INTRO STATE
    if (gameState === 'room_intro') {

        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950 px-8">
                <FeedbackToast />
                <div className="relative bg-zinc-800 border-8 border-zinc-900 shadow-2xl overflow-hidden" style={{ width: ROOM_WIDTH > windowWidth ? windowWidth - 64 : ROOM_WIDTH, height: ROOM_HEIGHT }}>
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

                    {/* Window (night sky — it's 9:30 PM) */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[300px] h-[100px] bg-slate-950 border-8 border-amber-800 z-[5] rounded-t-lg overflow-hidden" style={{ boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6)' }}>
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/80 to-slate-950/90"></div>
                        <div className="absolute top-3 left-6 w-1 h-1 bg-white rounded-full opacity-80"></div>
                        <div className="absolute top-5 left-20 w-1.5 h-1.5 bg-white rounded-full opacity-60"></div>
                        <div className="absolute top-2 right-12 w-1 h-1 bg-yellow-200 rounded-full opacity-70"></div>
                        <div className="absolute top-6 right-24 w-1 h-1 bg-white rounded-full opacity-50"></div>
                        <div className="absolute top-4 left-[45%] w-6 h-6 bg-yellow-100 rounded-full opacity-20" style={{ filter: 'blur(2px)' }}></div>
                        <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-amber-800 -translate-x-1/2"></div>
                        <div className="absolute left-0 right-0 top-1/2 h-1 bg-amber-800 -translate-y-1/2"></div>
                    </div>

                    {/* Picture frames */}
                    <div className="absolute top-6 left-[140px] w-16 h-12 bg-zinc-700 border-4 border-amber-700 z-[5] rounded-sm" style={{ boxShadow: '2px 2px 6px rgba(0,0,0,0.4)' }}>
                        <div className="w-full h-full bg-gradient-to-br from-amber-900/40 to-amber-100/40 flex items-center justify-center text-lg opacity-40">&#128116;</div>
                    </div>
                    <div className="absolute top-8 right-[140px] w-14 h-10 bg-zinc-700 border-4 border-amber-700 z-[5] rounded-sm" style={{ boxShadow: '2px 2px 6px rgba(0,0,0,0.4)' }}>
                        <div className="w-full h-full bg-gradient-to-br from-emerald-900/40 to-cyan-900/40 flex items-center justify-center text-sm opacity-40">&#128106;</div>
                    </div>

                    {/* Rug */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[600px] h-[400px] bg-indigo-950 border-[10px] border-indigo-900/80 rounded-lg z-0 overflow-hidden" style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}>
                        <div className="w-[92%] h-[90%] m-auto mt-[5%] border-2 border-indigo-700/40 flex justify-center items-center">
                            <div className="w-[85%] h-[85%] border-2 border-indigo-800/60 flex justify-center items-center">
                                <div className="w-28 h-28 bg-indigo-700/20 rotate-45 border border-indigo-800/30"></div>
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

                    {/* Bed (left side) */}
                    <div className="absolute top-[200px] left-12 z-10">
                        <div className="w-52 h-24 bg-blue-900 border-4 border-blue-950 rounded-lg shadow-2xl relative">
                            <div className="absolute top-1 left-2 w-16 h-10 bg-white/90 rounded border border-blue-200"></div>
                            <div className="absolute top-2 right-2 w-14 h-8 bg-blue-100/80 rounded border border-blue-300"></div>
                            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-r from-blue-800 to-blue-700 rounded-b-lg"></div>
                        </div>
                        <div className="w-52 h-3 bg-amber-950 rounded-b-sm"></div>
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

                    {/* Potted Plant */}
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
                            onClick={() => setGameState('social_media_feed')}>
                            <span className="text-amber-300 mr-2">[ E ]</span> CHECK PHONE 📱
                        </div>
                    )}

                    {/* Day/Location label */}
                    <div className="absolute top-4 left-4 z-30 bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-700/50">
                        <p className="text-amber-400 font-bold text-xs tracking-widest uppercase">NIGHT — 9:30 PM</p>
                        <p className="text-slate-400 text-[10px] font-mono">YOUR ROOM</p>
                    </div>
                </div>
            </div>
        );
    }

    // SOCIAL MEDIA FEED STATE
    if (gameState === 'social_media_feed') {
        return (
            <div className="w-full h-full bg-slate-900 flex items-center justify-center p-8 relative overflow-hidden">
                <FeedbackToast />

                {/* Phone container - matching Levels 1-3 style */}
                <div className="w-[380px] h-[750px] bg-zinc-900 border-x-[12px] border-t-[12px] border-b-[24px] border-black rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col">
                    <StatusBar dark />
                    
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-2xl z-50"></div>

                    <div className="w-full h-full bg-white overflow-hidden flex flex-col relative pt-8">
                        {/* App header - simplified */}
                        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-900">SocialFeed</h2>
                            <div className="flex gap-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">&#128269;</div>
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center relative">
                                    &#128172;
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>

                        {/* Feed content */}
                        <div className="flex-1 overflow-y-auto bg-gray-50">
                            {/* Normal posts */}
                            <div className="p-4 space-y-4">
                                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-black">A</div>
                                        <div>
                                            <p className="font-black text-sm">Arjun Kumar</p>
                                            <p className="text-xs text-gray-500">2 hours ago</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-800 mb-2">Finally graduated! &#127877; Thanks to everyone who supported me through this journey!</p>
                                    <div className="w-full h-40 bg-blue-100 rounded-lg flex items-center justify-center text-4xl">&#127877;</div>
                                </div>

                                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-black">M</div>
                                        <div>
                                            <p className="font-black text-sm">Mom</p>
                                            <p className="text-xs text-gray-500">4 hours ago</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-800">Beautiful evening at the temple &#128583;</p>
                                    <div className="w-full h-40 bg-orange-100 rounded-lg flex items-center justify-center text-4xl">&#1585;&#1583;&#1575;</div>
                                </div>

                                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-black">F</div>
                                        <div>
                                            <p className="font-black text-sm">Foodie Chennai</p>
                                            <p className="text-xs text-gray-500">6 hours ago</p>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-800">New dosa recipe just dropped! Check it out &#127860;</p>
                                    <div className="w-full h-40 bg-yellow-100 rounded-lg flex items-center justify-center text-4xl">&#127855;</div>
                                </div>
                            </div>
                        </div>

                        {/* Notification appears after 3 seconds */}
                        <div className="absolute bottom-20 right-4 animate-in slide-in-from-right duration-500">
                            <div className="bg-blue-500 text-white p-4 rounded-2xl shadow-2xl cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => setGameState('message_received')}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">N</div>
                                    <div>
                                        <p className="font-black text-sm">Nithya Krishnan</p>
                                        <p className="text-xs opacity-90">Hey! Long time!!</p>
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
            <div className="w-full h-full bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
                <FeedbackToast />

                <div className="w-[380px] h-[750px] bg-zinc-900 border-x-[12px] border-t-[12px] border-b-[24px] border-black rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col">
                    <StatusBar />
                    
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-2xl z-50"></div>

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
        );
    }

    // PROFILE INVESTIGATION STATE
    if (gameState === 'profile_investigation') {
        return (
            <div className="w-full h-full bg-zinc-900 p-4 flex flex-row items-center justify-center gap-8 relative">
                <FeedbackToast />

                {/* Phone with profile - matching Levels 1-3 style */}
                <div className="w-[380px] h-[750px] bg-zinc-900 border-x-[12px] border-t-[12px] border-b-[24px] border-black rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col flex-shrink-0 transition-transform duration-500 ease-in-out phone-container"
                     style={{ transform: isDetectiveModeOpen ? 'translateX(-150px)' : 'translateX(0)' }}>
                    <StatusBar />
                    
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-2xl z-50"></div>

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
        );
    }

    // CALL REAL NITHYA STATE
    if (gameState === 'call_real_nithya') {
        return (
            <div className="w-full h-full bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
                <FeedbackToast />

                <div className="w-[400px] h-[820px] bg-gradient-to-br from-slate-900 to-slate-800 border-[2px] border-slate-700 rounded-[3.5rem] shadow-2xl relative overflow-hidden flex flex-col" 
                     style={{ 
                         boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
                         background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)'
                     }}>
                    <StatusBar />
                    
                    {/* Modern notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-black rounded-b-2xl z-50 flex items-center justify-center">
                        <div className="w-12 h-5 bg-slate-900 rounded-full"></div>
                    </div>
                    
                    {/* Side buttons */}
                    <div className="absolute left-0 top-32 w-1 h-12 bg-slate-700 rounded-r-full"></div>
                    <div className="absolute left-0 top-48 w-1 h-8 bg-slate-700 rounded-r-full"></div>
                    <div className="absolute right-0 top-36 w-1 h-16 bg-slate-700 rounded-l-full"></div>

                    <div className="w-full h-full overflow-hidden flex flex-col relative pt-12 rounded-[3rem] mt-2 bg-emerald-500">
                        {/* Modern Call header */}
                        <div className="px-6 py-4 pt-8 text-center text-white">
                            <p className="text-xs opacity-80 mb-1">Calling...</p>
                            <p className="font-black text-2xl">Nithya College</p>
                            <div className="flex items-center justify-center gap-2 mt-2">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                <span className="text-xs opacity-70">Connecting</span>
                            </div>
                        </div>

                        {/* Modern Call screen */}
                        <div className="flex-1 flex flex-col items-center justify-center text-white px-6">
                            <div className="w-36 h-36 bg-white/20 rounded-full flex items-center justify-center text-7xl mb-8 animate-pulse shadow-2xl backdrop-blur-sm">
                                &#128105;
                            </div>
                            <div className="text-center">
                                <p className="font-black text-3xl mb-2">Nithya Krishnan</p>
                                <p className="opacity-80 text-lg">Chennai, Tamil Nadu</p>
                                <div className="flex items-center justify-center gap-2 mt-3">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                                    </svg>
                                    <span className="text-sm opacity-70">Mobile</span>
                                </div>
                            </div>
                        </div>

                        {/* Modern Call controls */}
                        <div className="p-8 flex justify-center">
                            <button className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center text-white text-3xl shadow-2xl hover:scale-110 transition-all hover:bg-red-600 active:scale-95 border-4 border-red-600/30"
                                onClick={() => {
                                    setCalledRealNithya(true);
                                    setGameState('call_confirmation');
                                }}>
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/60 text-sm font-black animate-pulse bg-black/20 px-6 py-3 rounded-full backdrop-blur-sm">
                    Tap to answer the call...
                </div>
            </div>
        );
    }

    // CALL CONFIRMATION STATE
    if (gameState === 'call_confirmation') {
        return (
            <div className="w-full h-full bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
                <FeedbackToast />

                <div className="w-full max-w-2xl bg-white rounded-[3rem] p-10 shadow-2xl border-4 border-white/10">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">✓</div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Call Connected</h2>
                        <p className="text-gray-600">Real Nithya is safe in Chennai</p>
                    </div>

                    <div className="space-y-4 mb-8">
                        <div className="bg-blue-50 p-4 rounded-2xl border-l-4 border-blue-500">
                            <p className="font-black text-blue-900 mb-1">You:</p>
                            <p className="text-gray-700">"Nithya, are you in Coimbatore? Are you at a hospital?"</p>
                        </div>

                        <div className="bg-green-50 p-4 rounded-2xl border-l-4 border-green-500">
                            <p className="font-black text-green-900 mb-1">Nithya (Real):</p>
                            <p className="text-gray-700">"What?! No! I'm at home in Chennai, just finished dinner. Why? Did someone message you pretending to be me??"</p>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-2xl border-l-4 border-blue-500">
                            <p className="font-black text-blue-900 mb-1">You:</p>
                            <p className="text-gray-700">"Yes. A fake account in your name asked me to send ₹8,000 for a hospital emergency in Coimbatore. I didn't send anything — I verified first. But the account has 12 of our mutual friends added. We should warn them."</p>
                        </div>

                        <div className="bg-green-50 p-4 rounded-2xl border-l-4 border-green-500">
                            <p className="font-black text-green-900 mb-1">Nithya (Real):</p>
                            <p className="text-gray-700">"Oh my god. My account was not hacked — they made a COPY. I'm going to report this right now. Can you help me send a warning to our group?"</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {!scamReported && (
                            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-4 rounded-2xl transition-all shadow-xl active:scale-95"
                                onClick={() => setGameState('report_fake_account')}>
                                Report Fake Account &#128690;
                            </button>
                        )}
                        {!communityAlerted && (
                            <button className="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl transition-all shadow-xl active:scale-95"
                                onClick={() => setGameState('alert_community')}>
                                Alert Mutual Friends &#128101;
                            </button>
                        )}
                        {scamReported && communityAlerted && (
                            <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-2xl transition-all shadow-xl active:scale-95 animate-pulse"
                                onClick={() => setGameState('correct_path')}>
                                ✅ All Done — View Results
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // REPORT FAKE ACCOUNT STATE
    if (gameState === 'report_fake_account') {
        return (
            <div className="w-full h-full bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
                <FeedbackToast />

                <div className="w-[400px] h-[820px] bg-gradient-to-br from-slate-900 to-slate-800 border-[2px] border-slate-700 rounded-[3.5rem] shadow-2xl relative overflow-hidden flex flex-col" 
                     style={{ 
                         boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
                         background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)'
                     }}>
                    <StatusBar />
                    
                    {/* Modern notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-black rounded-b-2xl z-50 flex items-center justify-center">
                        <div className="w-12 h-5 bg-slate-900 rounded-full"></div>
                    </div>
                    
                    {/* Side buttons */}
                    <div className="absolute left-0 top-32 w-1 h-12 bg-slate-700 rounded-r-full"></div>
                    <div className="absolute left-0 top-48 w-1 h-8 bg-slate-700 rounded-r-full"></div>
                    <div className="absolute right-0 top-36 w-1 h-16 bg-slate-700 rounded-l-full"></div>

                    <div className="w-full h-full bg-white overflow-hidden flex flex-col relative pt-12 rounded-[3rem] mt-2">
                        {/* Modern Reporting interface */}
                        <div className="bg-gradient-to-r from-red-600 to-orange-600 px-6 py-4 pt-8 text-white shadow-lg">
                            <h2 className="font-black text-2xl">Report Profile</h2>
                            <p className="text-xs opacity-80 mt-1">Help keep our community safe</p>
                        </div>

                        <div className="flex-1 p-6 space-y-6">
                            <div className="bg-gray-50 p-5 rounded-3xl border border-gray-200">
                                <p className="font-black mb-3 text-lg">Reporting:</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center text-xl font-black shadow-md">N</div>
                                    <div>
                                        <p className="font-black text-sm">Nithya Krishnan</p>
                                        <p className="text-xs text-gray-500">@nithya_krishnan</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="font-black text-lg">Reason for report:</p>
                                <label className="flex items-center gap-4 p-4 bg-red-50 border-2 border-red-500 rounded-2xl cursor-pointer hover:bg-red-100 transition-all">
                                    <input type="radio" name="report" className="w-5 h-5" defaultChecked />
                                    <span className="font-black text-red-900">Impersonation</span>
                                </label>
                                <label className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all">
                                    <input type="radio" name="report" className="w-5 h-5" />
                                    <span className="text-gray-700 font-medium">Spam</span>
                                </label>
                                <label className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-100 transition-all">
                                    <input type="radio" name="report" className="w-5 h-5" />
                                    <span className="text-gray-700 font-medium">Fake Account</span>
                                </label>
                            </div>

                            <div className="bg-blue-50 p-5 rounded-3xl border border-blue-200">
                                <p className="font-black text-blue-900 mb-3">Additional Details:</p>
                                <p className="text-sm text-gray-700 leading-relaxed">This account is impersonating my real friend Nithya Krishnan to solicit money through fake emergency stories. The profile uses stock photos and was recently created.</p>
                            </div>
                        </div>

                        <div className="p-6 bg-white border-t border-gray-100 space-y-4">
                            <button className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl active:scale-95"
                                onClick={() => {
                                    setScamReported(true);
                                    showFeedback("✅ Fake account reported!");
                                    setGameState('call_confirmation');
                                }}>
                                Submit Report &#128690;
                            </button>
                            <button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-black py-4 rounded-2xl transition-all"
                                onClick={() => setGameState('call_confirmation')}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ALERT COMMUNITY STATE
    if (gameState === 'alert_community') {
        return (
            <div className="w-full h-full bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
                <FeedbackToast />

                <div className="w-[400px] h-[820px] bg-gradient-to-br from-slate-900 to-slate-800 border-[2px] border-slate-700 rounded-[3.5rem] shadow-2xl relative overflow-hidden flex flex-col" 
                     style={{ 
                         boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.1)',
                         background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e293b 100%)'
                     }}>
                    <StatusBar dark />
                    
                    {/* Modern notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-black rounded-b-2xl z-50 flex items-center justify-center">
                        <div className="w-12 h-5 bg-slate-900 rounded-full"></div>
                    </div>
                    
                    {/* Side buttons */}
                    <div className="absolute left-0 top-32 w-1 h-12 bg-slate-700 rounded-r-full"></div>
                    <div className="absolute left-0 top-48 w-1 h-8 bg-slate-700 rounded-r-full"></div>
                    <div className="absolute right-0 top-36 w-1 h-16 bg-slate-700 rounded-l-full"></div>

                    <div className="w-full h-full bg-white overflow-hidden flex flex-col relative pt-12 rounded-[3rem] mt-2">
                        {/* Modern Group chat interface */}
                        <div className="bg-gradient-to-r from-green-600 to-blue-600 px-6 py-4 pt-8 text-white shadow-lg">
                            <h2 className="font-black text-2xl">College Friends Group</h2>
                            <p className="text-xs opacity-80 mt-1">12 members</p>
                        </div>

                        <div className="flex-1 p-6 space-y-6 bg-gray-50">
                            <div className="bg-yellow-50 border-2 border-yellow-400 p-5 rounded-3xl shadow-lg">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-white font-black text-lg shadow-md">!</div>
                                    <p className="font-black text-yellow-900 text-lg">⚠️ SECURITY ALERT</p>
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">A fake account impersonating Nithya Krishnan is sending fraud messages asking for money. DO NOT send any money. Report the account immediately. The real Nithya is safe in Chennai.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-black shadow-md">A</div>
                                    <div className="bg-white p-4 rounded-3xl flex-1 shadow-sm border border-gray-100">
                                        <p className="font-black text-sm mb-1">Arjun</p>
                                        <p className="text-sm text-gray-700">Thanks for the warning! I almost sent money yesterday</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-black shadow-md">P</div>
                                    <div className="bg-white p-4 rounded-3xl flex-1 shadow-sm border border-gray-100">
                                        <p className="font-black text-sm mb-1">Priya</p>
                                        <p className="text-sm text-gray-700">Just reported the account! Everyone stay safe &#128583;</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-black shadow-md">R</div>
                                    <div className="bg-white p-4 rounded-3xl flex-1 shadow-sm border border-gray-100">
                                        <p className="font-black text-sm mb-1">Rahul</p>
                                        <p className="text-sm text-gray-700">You saved us all! Thank you for being careful &#128583;</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-white border-t border-gray-100">
                            <button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
                                onClick={() => {
                                    setCommunityAlerted(true);
                                    showFeedback("✅ Community alerted!");
                                    setGameState('call_confirmation');
                                }}>
                                <span className="text-xl">&#128226;</span>
                                <span>Send Alert</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // CORRECT PATH STATE
    if (gameState === 'correct_path') {
        const allActionsComplete = calledRealNithya && scamReported && communityAlerted;

        return (
            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-10 overflow-hidden relative">
                <FeedbackToast />

                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.3)_0%,transparent_70%)]"></div>

                <div className="w-full max-w-4xl bg-white/5 backdrop-blur-3xl rounded-[3rem] border-4 border-emerald-500/30 shadow-3xl overflow-hidden flex flex-col p-8 pb-6 animate-in zoom-in-95 duration-500 h-[680px]">
                    <div className="flex items-center gap-6 mb-8 flex-shrink-0">
                        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-4xl shadow-[0_0_50px_rgba(16,185,129,0.4)] border-4 border-black/20">&#128737;</div>
                        <div>
                            <h2 className="text-emerald-400 font-black text-5xl uppercase italic tracking-tighter drop-shadow-lg">Ghost Profile Exposed</h2>
                            <p className="text-slate-400 font-black text-lg uppercase tracking-widest mt-1">
                                {allActionsComplete ? "COMMUNITY PROTECTED" : "VERIFICATION COMPLETE"}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-12 overflow-y-auto pr-4 custom-scrollbar">
                        {/* Completed Steps */}
                        <div className="space-y-6">
                            <div className="p-6 rounded-[2rem] bg-emerald-900/20 border-2 border-emerald-500/50">
                                <h4 className="font-black text-xl mb-2 uppercase tracking-tighter text-emerald-400">✓ Step 1: Profile Investigation</h4>
                                <p className="text-slate-300 leading-relaxed text-sm">
                                    You discovered the fake profile was created 4 days ago, used stock photos, and had suspicious mutual friend patterns.
                                </p>
                            </div>

                            <div className="p-6 rounded-[2rem] bg-emerald-500 text-black border-4 border-transparent shadow-[0_10px_30px_rgba(16,185,129,0.3)]">
                                <h4 className="font-black text-xl mb-2 uppercase tracking-tighter">✓ Step 2: Real Contact Verified</h4>
                                <p className="text-black/80 text-sm leading-relaxed">Verified identity through a different channel before taking action.</p>
                            </div>

                            <div className="p-6 rounded-[2rem] bg-red-500 text-white border-4 border-transparent shadow-[0_10px_30px_rgba(220,38,38,0.3)]">
                                <h4 className="font-black text-xl mb-2 uppercase tracking-tighter">✓ Step 3: Fake Account Reported</h4>
                                <p className="text-white/80 text-sm leading-relaxed">Reported impersonation accounts to protect the community.</p>
                            </div>

                            <div className="p-6 rounded-[2rem] bg-blue-500 text-white border-4 border-transparent shadow-[0_10px_30px_rgba(59,130,246,0.3)]">
                                <h4 className="font-black text-xl mb-2 uppercase tracking-tighter">✓ Step 4: Community Alerted</h4>
                                <p className="text-white/80 text-sm leading-relaxed">Warned mutual friends about the impersonation attempt.</p>
                            </div>
                        </div>

                        {/* Impact Summary */}
                        <div className="bg-black/40 border-4 border-white/5 rounded-[2.5rem] p-8 relative flex flex-col justify-between overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
                            <div className="space-y-6 relative z-10">
                                <p className="text-white/30 font-black text-[10px] uppercase tracking-[0.4em] mb-2 border-b border-white/10 pb-2">Impact Summary</p>

                                <div className="space-y-4">
                                    <div className="bg-emerald-900/40 border border-emerald-500/30 rounded-xl p-4">
                                        <p className="text-emerald-400 font-black text-sm uppercase tracking-widest mb-1">Financial Loss Prevented</p>
                                        <p className="text-emerald-200 text-3xl font-black font-mono">₹8,000</p>
                                    </div>

                                    <div className="bg-blue-900/40 border border-blue-500/30 rounded-xl p-4">
                                        <p className="text-blue-400 font-black text-sm uppercase tracking-widest mb-1">Friends Protected</p>
                                        <p className="text-blue-200 text-3xl font-black font-mono">12</p>
                                    </div>

                                    <div className="bg-purple-900/40 border border-purple-500/30 rounded-xl p-4">
                                        <p className="text-purple-400 font-black text-sm uppercase tracking-widest mb-1">Cyber Safety Score</p>
                                        <p className="text-purple-200 text-3xl font-black font-mono">+35</p>
                                    </div>
                                </div>

                                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                    <p className="text-white/80 font-black text-sm mb-2">🏅 Achievement Unlocked:</p>
                                    <p className="text-white font-black text-lg">The Verifier</p>
                                    <p className="text-white/60 text-xs mt-1">Confirmed identity before acting, protected community</p>
                                </div>
                            </div>

                            {allActionsComplete && (
                                <div className="mt-8 animate-in fade-in duration-500">
                                    <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-xl shadow-[0_10px_30px_rgba(16,185,129,0.4)] animate-pulse"
                                        onClick={() => completeLevel(true, 35, 0)}>
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

    // SCAM SEQUENCE STATE
    if (gameState === 'scam_sequence') {
        const currentMsg = escalationStep < escalationMessages.length ? escalationMessages[escalationStep] : null;

        return (
            <div className="w-full h-full bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-red-600/5 animate-pulse"></div>

                <div className="z-10 w-full max-w-2xl bg-[#0a0c10] border-t-8 border-red-600 rounded-[3rem] p-10 shadow-[0_0_150px_rgba(220,38,38,0.4)] animate-in slide-in-from-bottom duration-500">
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
                            <button className="bg-red-600 hover:bg-red-500 text-white font-black py-6 rounded-2xl text-2xl shadow-[0_20px_60px_rgba(220,38,38,0.5)] uppercase tracking-widest animate-pulse border-4 border-white/10 transition-transform active:scale-95"
                                onClick={() => setGameState('recovery_screen')}>
                                &#128690; CALL 1930 Helpline
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
            <div className="w-full h-full bg-[#0a0c10] flex items-center justify-center p-12 overflow-hidden relative">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_70%)]"></div>

                <div className="z-10 w-full max-w-4xl bg-white rounded-[4rem] p-16 shadow-[0_50px_100px_rgba(0,0,0,0.5)] text-center animate-in zoom-in duration-500">
                    <div className="w-32 h-32 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-6xl mx-auto mb-10 shadow-inner">&#26a1;</div>
                    <h2 className="text-slate-900 font-black text-5xl uppercase tracking-tighter mb-4 italic">PARTIAL RECOVERY</h2>
                    <p className="text-slate-600 text-xl font-serif italic leading-relaxed mb-12 px-12 opacity-80">
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

export default Level5;
