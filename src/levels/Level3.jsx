import React, { useState, useEffect } from 'react';
import Player from '../components/Player';
import { useGameState } from '../context/GameStateContext';

const ROOM_WIDTH = 1400;
const ROOM_HEIGHT = 900;
const SPEED = 6;
const PLAYER_SIZE = 40;

const FRIEND_ZONE = { x: 700, y: 400, w: 40, h: 40 };

const checkCollision = (px, py, rect) => {
    return (
        px < rect.x + rect.w &&
        px + PLAYER_SIZE > rect.x &&
        py < rect.y + rect.h &&
        py + PLAYER_SIZE > rect.y
    );
};

const Level3 = () => {
    const { assets, completeLevel, adjustAssets, adjustLives } = useGameState();
    const [playerPos, setPlayerPos] = useState({ x: 100, y: 800 });
    const [keys, setKeys] = useState({});

    // STATE MACHINE: walk → chat_ui → comparison_ui → permission_cascade → final_decision
    const [gameState, setGameState] = useState('walk');
    const [canInteract, setCanInteract] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState(null);

    // CLUE BOARD LOGIC
    const [clues, setClues] = useState([]);
    const [isDetectiveModeOpen, setIsDetectiveModeOpen] = useState(false);
    const [isClueButtonVisible, setIsClueButtonVisible] = useState(false);
    const [usedClueBoard, setUsedClueBoard] = useState(false);

    // APP TRAP STATE
    const [selectedApp, setSelectedApp] = useState(null);
    const [permissionStep, setPermissionStep] = useState(0);

    // MINI-GAME STATE
    const [apps, setApps] = useState([
        { id: 'a1', name: 'YONO SBI', dev: 'State Bank of India', docs: true, isSafe: true, status: 'unassigned' },
        { id: 'a2', name: 'SBI YONO UPDATE', dev: 'BankToolsPro', docs: false, isSafe: false, status: 'unassigned' },
        { id: 'a3', name: 'WhatsApp Messenger', dev: 'WhatsApp LLC', docs: true, isSafe: true, status: 'unassigned' },
        { id: 'a4', name: 'Free Netflix App', dev: 'HackerCorp', docs: false, isSafe: false, status: 'unassigned' }
    ]);
    const [draggedAppId, setDraggedAppId] = useState(null);
    const [miniGameOver, setMiniGameOver] = useState(false);

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

    // Movement Loop
    useEffect(() => {
        if (gameState !== 'walk') return;
        let animationFrameId;
        const gameLoop = () => {
            setPlayerPos(prev => {
                let newX = prev.x;
                let newY = prev.y;

                if (keys['w'] || keys['arrowup']) newY -= SPEED;
                if (keys['s'] || keys['arrowdown']) newY += SPEED;
                if (keys['a'] || keys['arrowleft']) newX -= SPEED;
                if (keys['d'] || keys['arrowright']) newX += SPEED;

                newX = Math.max(0, Math.min(newX, ROOM_WIDTH - PLAYER_SIZE));
                newY = Math.max(0, Math.min(newY, ROOM_HEIGHT - PLAYER_SIZE));

                if (checkCollision(newX, newY, FRIEND_ZONE)) {
                    if (prev.x + PLAYER_SIZE <= FRIEND_ZONE.x || prev.x >= FRIEND_ZONE.x + FRIEND_ZONE.w) newX = prev.x;
                    if (prev.y + PLAYER_SIZE <= FRIEND_ZONE.y || prev.y >= FRIEND_ZONE.y + FRIEND_ZONE.h) newY = prev.y;
                }

                const interactArea = { x: FRIEND_ZONE.x - 40, y: FRIEND_ZONE.y - 40, w: FRIEND_ZONE.w + 80, h: FRIEND_ZONE.h + 80 };
                setCanInteract(checkCollision(newX, newY, interactArea));

                return { x: newX, y: newY };
            });
            animationFrameId = requestAnimationFrame(gameLoop);
        };
        animationFrameId = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [keys, gameState]);

    // Handle Interaction Key (E)
    useEffect(() => {
        if (keys['e'] && canInteract && gameState === 'walk') {
            setGameState('chat_ui');
            setIsClueButtonVisible(true);
            unlockClue(8, { title: 'Social Trust Vector', desc: 'Malware often spreads through trusted contacts whose devices are already compromised.' });
        }
    }, [keys, canInteract, gameState]);

    const unlockClue = (clueId, clueData) => {
        if (!clues.find(c => c.id === clueId)) {
            setClues(prev => [...prev, { id: clueId, ...clueData }]);
            setFeedbackMsg("🔍 Clue Discovered!");
            setTimeout(() => setFeedbackMsg(null), 2000);
        }
    };

    // --- RENDERERS ---

    if (gameState === 'walk') {
        const camX = window.innerWidth / 2 - playerPos.x - PLAYER_SIZE / 2;
        const camY = window.innerHeight / 2 - playerPos.y - PLAYER_SIZE / 2;
        return (
            <div className="w-full h-full bg-emerald-900/20 overflow-hidden relative">
                {/* Action hint HUD */}
                <div className="absolute top-4 left-4 z-[900] bg-slate-900/95 p-4 border border-slate-700/50 rounded-lg shadow-xl">
                    <h1 className="text-lg font-black tracking-[0.15em] text-emerald-500 uppercase">COLLEGE CAMPUS</h1>
                    <p className="text-[10px] text-slate-400 font-mono uppercase mt-1">Talk to your friend Arjun.</p>
                </div>

                <div className="absolute will-change-transform" style={{ width: ROOM_WIDTH, height: ROOM_HEIGHT, transform: `translate(${camX}px, ${camY}px)` }}>
                    {/* Campus Grass Floor */}
                    <div className="absolute inset-0 bg-emerald-950" style={{
                        backgroundImage: `radial-gradient(#064e3b 2px, transparent 2px), radial-gradient(#064e3b 2px, transparent 2px)`,
                        backgroundSize: '30px 30px', backgroundPosition: '0 0, 15px 15px', opacity: 0.8
                    }}></div>

                    {/* Pathways */}
                    <div className="absolute bg-slate-800 border-2 border-slate-700 w-full h-24 top-1/2 -translate-y-1/2 flex gap-4 overflow-hidden">
                        {[...Array(20)].map((_, i) => <div key={i} className="w-16 h-full bg-slate-700 opacity-50 skew-x-12"></div>)}
                    </div>

                    {/* Friend 'Arjun' NPC */}
                    <div className="absolute bg-blue-500 rounded-full flex items-center justify-center animate-bounce shadow-2xl"
                        style={{ left: FRIEND_ZONE.x, top: FRIEND_ZONE.y, width: FRIEND_ZONE.w, height: FRIEND_ZONE.h }}>
                        <div className="absolute -top-6 text-xs font-bold text-white bg-black/50 px-2 py-0.5 rounded uppercase tracking-wider">Arjun</div>
                        🧑🏽‍🎓
                    </div>

                    {/* Interaction Hint */}
                    {canInteract && (
                        <div className="absolute z-50 bg-black/80 text-white px-3 py-1.5 rounded-full text-xs font-bold font-mono tracking-widest shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                            style={{ left: playerPos.x - 30, top: playerPos.y - 40 }}>
                            [ E ] TALK TO ARJUN
                        </div>
                    )}

                    <Player x={playerPos.x} y={playerPos.y} />
                </div>
            </div>
        );
    }

    if (['chat_ui', 'comparison_ui', 'permission_cascade'].includes(gameState)) {
        return (
            <div className="w-full h-full bg-slate-950 p-8 flex items-center justify-center relative">

                {/* Feedback Toast */}
                {feedbackMsg && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-[0_0_30px_rgba(37,99,235,0.8)] z-[1000] font-bold text-center animate-bounce border-2 border-blue-400">
                        {feedbackMsg}
                    </div>
                )}

                {/* Smartphone Bezel */}
                <div className="w-[400px] h-[800px] bg-black rounded-[3rem] border-[14px] border-slate-900 shadow-[0_0_80px_rgba(0,0,0,0.8)] flex overflow-hidden relative ring-4 ring-slate-800">

                    {/* Screen Content */}
                    <div className="w-full h-full bg-slate-100 flex flex-col relative text-slate-800 font-sans">

                        {/* Status Bar */}
                        <div className="h-8 bg-black/10 flex justify-between items-center px-6 text-xs font-bold text-slate-700">
                            <span>10:30</span>
                            <div className="flex gap-2">
                                <span>📶</span>
                                <span>🔋 85%</span>
                            </div>
                        </div>

                        {/* --- CHAT UI --- */}
                        {gameState === 'chat_ui' && (
                            <div className="flex-1 flex flex-col bg-[#efeae2]">
                                <div className="bg-[#008069] text-white p-4 flex items-center gap-4 shadow-md z-10">
                                    <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center text-xl">🧑🏽‍🎓</div>
                                    <div>
                                        <h2 className="font-bold">Arjun (Classmate)</h2>
                                        <p className="text-xs text-white/80">online</p>
                                    </div>
                                </div>
                                <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
                                    <div className="bg-white rounded-lg p-3 max-w-[85%] self-start shadow-sm border border-slate-200">
                                        Hey man, did you see the new college circular? We need to pay the semester fee by tomorrow.
                                    </div>
                                    <div className="bg-[#dcf8c6] rounded-lg p-3 max-w-[85%] self-end shadow-sm border border-green-200 text-right">
                                        Yeah I saw it. Going to pay through YONO app now.
                                    </div>
                                    <div className="bg-white rounded-lg p-3 max-w-[85%] self-start shadow-sm border border-slate-200">
                                        Wait, the old app is crashing for everyone making payments today.
                                    </div>
                                    <div className="bg-white rounded-lg p-3 max-w-[85%] self-start shadow-sm border border-slate-200">
                                        The bank circulated a direct update link because Play Store is taking time to reflect the new version.
                                        <br /><br />
                                        Use this link to install the new APK, otherwise your transaction might fail:
                                        <br />
                                        <span
                                            className="text-blue-600 underline cursor-help hover:bg-blue-100 p-1 rounded font-bold break-all inline-block mt-2"
                                            onMouseEnter={() => unlockClue(7, { title: 'Third-Party APK Source', desc: 'Secure apps like banking are NEVER distributed via Google Drive or direct APK links.' })}
                                            onClick={() => setGameState('comparison_ui')}
                                        >
                                            http://bit.ly/YONO_V2_Update_APK
                                        </span>
                                    </div>
                                </div>
                                <div className="p-2 bg-[#f0f2f5]">
                                    <div className="bg-white rounded-full px-4 py-2 text-slate-400">Message</div>
                                </div>
                            </div>
                        )}

                        {/* --- COMPARISON UI --- */}
                        {gameState === 'comparison_ui' && !selectedApp && (
                            <div className="flex-1 flex flex-col bg-slate-50 relative">
                                <div className="p-4 bg-white shadow flex items-center justify-between z-10">
                                    <h2 className="font-bold text-lg">Choose App Source</h2>
                                </div>

                                <div className="p-4 text-sm text-slate-600 text-center italic bg-yellow-50 border-b border-yellow-200">
                                    Wait, let me double-check the Play Store before installing that APK...
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 pb-24">
                                    {/* App A: Official */}
                                    <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 cursor-pointer hover:border-blue-400 transition-colors"
                                        onClick={() => setSelectedApp('A')}
                                    >
                                        <div className="flex gap-4 mb-3">
                                            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xs shadow-inner">YONO</div>
                                            <div>
                                                <h3 className="font-bold text-lg">YONO SBI</h3>
                                                <p className="text-xs text-green-700 font-bold">State Bank of India</p>
                                                <div className="flex mt-1 text-xs text-slate-500 gap-3">
                                                    <span>⭐ 4.5</span>
                                                    <span>50M+ Downloads</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-500 mb-3">
                                            Permissions: Location, Camera, Contacts
                                        </div>
                                        <button className="w-full bg-slate-100 text-slate-700 py-2 rounded font-bold uppercase text-sm" onClick={(e) => { e.stopPropagation(); setSelectedApp('A'); }}>View Details</button>
                                    </div>

                                    <div className="text-center font-bold text-slate-400 uppercase tracking-widest text-xs">- OR -</div>

                                    {/* App B: Fake (From Arjun's Link) */}
                                    <div className="bg-white p-4 rounded-xl shadow-md border-2 border-dashed border-red-300 cursor-pointer hover:border-red-500 transition-colors relative"
                                        onClick={() => setSelectedApp('B')}
                                    >
                                        <div className="absolute -top-3 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow">Arjun's Link</div>
                                        <div className="flex gap-4 mb-3">
                                            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white font-bold text-xs shadow-inner ring-2 ring-red-400">YONO V2</div>
                                            <div>
                                                <h3 className="font-bold text-lg">SBI YONO UPDATE</h3>
                                                <p
                                                    className="text-xs text-slate-600 font-bold cursor-help hover:text-red-600 inline-block px-1 rounded"
                                                    onMouseEnter={() => unlockClue(1, { title: 'Unverified Developer', desc: 'The developer is listed as "NetToolsInc", not "State Bank of India".' })}
                                                >
                                                    NetToolsInc
                                                </p>
                                                <div className="flex mt-1 text-xs gap-3">
                                                    <span
                                                        className="cursor-help hover:bg-yellow-100 px-1 rounded"
                                                        onMouseEnter={() => unlockClue(3, { title: 'Fake Ratings', desc: 'A 5.0 rating with exactly 5 reviews is statistically improbable and artificially generated.' })}
                                                    >
                                                        ⭐ 5.0 (5)
                                                    </span>
                                                    <span
                                                        className="cursor-help hover:bg-yellow-100 px-1 rounded"
                                                        onMouseEnter={() => unlockClue(2, { title: 'Suspicious Downloads', desc: 'A major bank update will have millions of downloads, not 500+.' })}
                                                    >
                                                        500+ Downloads
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-red-600 font-bold mb-3 flex items-center gap-1 cursor-help w-max"
                                            onMouseEnter={() => unlockClue(5, { title: 'Excessive Permissions', desc: 'Why would a banking app need to independently Read SMS or Record Audio in the background?' })}
                                        >
                                            ⚠️ Permissions: SMS, Contacts, Microphone, Storage
                                        </div>
                                        <button className="w-full bg-slate-100 text-slate-700 py-2 rounded font-bold uppercase text-sm" onClick={(e) => { e.stopPropagation(); setSelectedApp('B'); }}>Inspect APK Details</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- APP DETAILS VIEW --- */}
                        {gameState === 'comparison_ui' && selectedApp && (
                            <div className="flex-1 flex flex-col bg-white overflow-y-auto animate-fadeIn relative pb-20">
                                <div className="sticky top-0 bg-white/90 backdrop-blur p-4 border-b flex items-center gap-4 z-20">
                                    <button className="text-2xl" onClick={() => setSelectedApp(null)}>←</button>
                                    <span className="font-bold">App Info</span>
                                </div>

                                {selectedApp === 'A' ? (
                                    <div className="p-6 flex flex-col items-center">
                                        <div className="w-24 h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white font-bold text-xl shadow-lg mb-4">YONO</div>
                                        <h2 className="text-2xl font-bold">YONO SBI</h2>
                                        <p className="text-green-700 font-bold text-sm mb-4">State Bank of India ✅</p>

                                        <p className="text-center text-sm text-slate-600 mb-8 border-b pb-8">
                                            The official banking application from SBI. Secure, verified, and trusted by millions. Play Protect certified.
                                        </p>

                                        <button
                                            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-full shadow-lg"
                                            onClick={() => setGameState('final_decision')}
                                        >
                                            INSTALL OFFICIAL APP
                                        </button>
                                    </div>
                                ) : (
                                    <div className="p-6 flex flex-col items-center">
                                        <div className="w-24 h-24 bg-blue-500 rounded-[2rem] flex items-center justify-center text-white font-bold text-xl shadow-lg mb-4 border-2 border-red-400">YONO V2</div>
                                        <h2 className="text-2xl font-bold flex items-center gap-2">SBI YONO UPDATE <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded">APK</span></h2>
                                        <p className="text-slate-500 font-bold text-sm mb-4">NetToolsInc</p>

                                        <div className="w-full bg-red-50 p-4 rounded-lg border border-red-200 text-sm text-red-800 mb-6 font-mono">
                                            <p className="font-bold mb-2 uppercase">Requested Permissions:</p>
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li
                                                    className="cursor-help hover:bg-red-200"
                                                    onMouseEnter={() => unlockClue(4, { title: 'SMS Permission', desc: 'Allows the app to silently read incoming OTPs without you knowing.' })}
                                                >
                                                    Read & Send SMS messages
                                                </li>
                                                <li>Read Contacts</li>
                                                <li
                                                    className="cursor-help hover:bg-red-200"
                                                    onMouseEnter={() => unlockClue(6, { title: 'Microphone Access', desc: 'Malware often records background audio to exploit voice authentication.' })}
                                                >
                                                    Record Audio (Microphone)
                                                </li>
                                                <li>Modify System Settings</li>
                                                <li>Draw over other apps</li>
                                            </ul>
                                        </div>

                                        <button
                                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                                            onClick={() => {
                                                setGameState('permission_cascade');
                                                setPermissionStep(1);
                                            }}
                                        >
                                            INSTALL APK (Arjun's Link)
                                        </button>
                                        <p className="text-xs text-slate-400 mt-4 text-center">Your friend recommended this update.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* --- PERMISSION CASCADE --- */}
                        {gameState === 'permission_cascade' && (
                            <div className="absolute inset-0 bg-black/80 z-[100] flex items-center justify-center p-6 backdrop-blur-sm animate-fadeIn">
                                <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
                                    <div className="bg-slate-800 p-4 flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">Y V2</div>
                                        <span className="text-white font-bold">System Permission Request</span>
                                    </div>
                                    <div className="p-6 bg-slate-50">
                                        <p className="text-slate-800 font-bold text-lg mb-2">
                                            {permissionStep === 1 ? 'Allow SBI YONO UPDATE to access your contacts?' :
                                                permissionStep === 2 ? 'Allow SBI YONO UPDATE to send and view SMS messages?' :
                                                    'Allow SBI YONO UPDATE to record audio?'}
                                        </p>
                                        <p className="text-sm text-slate-500 mb-6">
                                            {permissionStep === 1 ? 'This is required to sync your friend list.' :
                                                permissionStep === 2 ? 'This allows the app to automatically read your financial OTPs.' :
                                                    'The app will be able to record audio at any time.'}
                                        </p>
                                        <div className="flex flex-col gap-3">
                                            <button
                                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-full hover:bg-blue-700"
                                                onClick={() => {
                                                    if (permissionStep < 3) setPermissionStep(p => p + 1);
                                                    else setGameState('scam_outcome');
                                                }}
                                            >
                                                Allow
                                            </button>
                                            <button
                                                className="w-full bg-slate-200 text-slate-700 font-bold py-3 rounded-full hover:bg-slate-300"
                                                onClick={() => setGameState('comparison_ui')}
                                            >
                                                Deny & Cancel Installation
                                            </button>
                                        </div>
                                    </div>
                                    {/* Progress indicator */}
                                    <div className="h-1 bg-slate-200 w-full">
                                        <div className="h-full bg-red-500 transition-all" style={{ width: `${(permissionStep / 3) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* THE INVESTIGATE BUTTON */}
                        {isClueButtonVisible && (
                            <button
                                className={`absolute bottom-6 right-6 w-14 h-14 bg-amber-500 hover:bg-amber-400 rounded-full flex flex-col items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.6)] border-2 border-amber-300 z-50 text-xl transition-transform hover:scale-105 ${!usedClueBoard ? 'animate-pulse' : ''}`}
                                onClick={() => {
                                    setIsDetectiveModeOpen(true);
                                    setUsedClueBoard(true);
                                }}
                            >
                                🔍
                                {clues.length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex justify-center items-center shadow-md">{clues.length}</span>}
                            </button>
                        )}

                        {/* Clue Board Overlay */}
                        {isDetectiveModeOpen && (
                            <div className="absolute inset-0 bg-black/95 z-[200] flex animate-[fadeIn_0.3s_ease-out] rounded-[2rem] overflow-hidden">
                                {/* Simplified mobile deductive board */}
                                <div className="w-full h-full p-6 flex flex-col items-center bg-zinc-900 shadow-2xl z-10">
                                    <h2 className="text-xl font-bold font-mono text-amber-500 mb-2 uppercase tracking-widest text-center">Mobile Evidence Log</h2>
                                    <div className="text-xs text-zinc-400 uppercase font-mono mb-4 flex justify-between w-full border-b border-zinc-700 pb-2">
                                        <span>Progress: {clues.length}/8 CLUES</span>
                                    </div>

                                    <div className="w-full flex-1 overflow-y-auto pr-2 flex flex-col gap-3 custom-scrollbar mb-4">
                                        {clues.map(c => (
                                            <div key={c.id} className="bg-amber-100 p-3 border-l-4 border-red-600 rounded text-slate-900 shadow">
                                                <h4 className="font-bold text-red-800 text-xs mb-1">{c.title}</h4>
                                                <p className="text-[10px] font-mono text-slate-700 leading-tight">{c.desc}</p>
                                            </div>
                                        ))}
                                        {clues.length === 0 && (
                                            <p className="text-slate-500 text-center font-mono text-sm mt-10 p-4">
                                                No evidence found.<br />Close and inspect Arjun's message closely.
                                            </p>
                                        )}
                                    </div>

                                    {clues.length >= 5 && (
                                        <div className="bg-red-900/50 p-4 rounded-xl border border-red-500/50 backdrop-blur w-full mb-4">
                                            <h2 className="text-lg font-bold text-red-400 mb-1 animate-pulse text-center">MALWARE CONFIRMED</h2>
                                            <p className="text-red-200 text-xs text-center border-t border-red-500/30 pt-2">
                                                Arjun's link is a malicious payload disguised as a banking update.
                                            </p>
                                        </div>
                                    )}

                                    <button
                                        className="w-full bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-bold transition-all border border-slate-600 mb-2"
                                        onClick={() => setIsDetectiveModeOpen(false)}
                                    >
                                        RETURN TO PHONE
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        );
    }

    // --- MINI GAME ---
    if (gameState === 'mini_game') {
        const handleDragStart = (e, id) => {
            setDraggedAppId(id);
            e.dataTransfer.setData("text/plain", id);
        };

        const handleDragOver = (e) => e.preventDefault();

        const handleDrop = (e, bucket) => {
            e.preventDefault();
            if (!draggedAppId) return;
            setApps(prev => prev.map(a => a.id === draggedAppId ? { ...a, status: bucket } : a));
            setDraggedAppId(null);
        };

        const unassignedApps = apps.filter(a => a.status === 'unassigned');
        const safeBucket = apps.filter(a => a.status === 'safe');
        const maliciousBucket = apps.filter(a => a.status === 'malicious');

        const isComplete = unassignedApps.length === 0;

        const checkResults = () => {
            const correctSafe = safeBucket.filter(a => a.isSafe).length;
            const correctMalicious = maliciousBucket.filter(a => !a.isSafe).length;
            const totalCorrect = correctSafe + correctMalicious;

            if (totalCorrect === 4) {
                setFeedbackMsg("🏆 Perfect! +3 Cyber points!");
                completeLevel(true, 3, 0);
            } else {
                setFeedbackMsg(`❌ You got ${totalCorrect}/4 correct. Try again!`);
                setTimeout(() => setFeedbackMsg(null), 3000);
            }
            setMiniGameOver(true);
        };

        return (
            <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center relative p-8 font-mono">
                <div className="w-full max-w-5xl bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl p-8 flex flex-col h-[800px]">
                    <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-white tracking-widest uppercase">Training: App Authenticity</h2>
                            <p className="text-slate-400">Drag each App into the correct bucket.</p>
                        </div>
                        <button className="text-slate-400 hover:text-white" onClick={() => setGameState('chat_ui')}>
                            ✕ Close Training
                        </button>
                    </div>

                    {!miniGameOver ? (
                        <>
                            <div className="flex-1 w-full flex justify-center gap-4 mb-12 flex-wrap">
                                {unassignedApps.map(a => (
                                    <div
                                        key={a.id} draggable onDragStart={(e) => handleDragStart(e, a.id)}
                                        className="bg-white text-slate-900 w-64 p-4 rounded shadow-lg border-2 border-slate-300 cursor-grab active:cursor-grabbing hover:scale-105"
                                    >
                                        <div className="font-bold text-lg">{a.name}</div>
                                        <div className="text-xs text-slate-500 mb-2">{a.dev}</div>
                                        <div className="text-xs font-bold text-blue-600">{a.docs ? "Verified Documentation" : "No Official Docs"}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-center gap-12 w-full h-64">
                                <div className="flex-1 border-4 border-dashed border-emerald-600/50 bg-emerald-900/20 rounded-xl p-4 flex flex-col items-center hover:bg-emerald-900/40"
                                    onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'safe')}>
                                    <h3 className="text-2xl font-bold text-emerald-500 mb-4 bg-emerald-950 px-4 py-2 rounded-full border border-emerald-800">✅ SAFE APPS</h3>
                                    {safeBucket.map(a => <div key={a.id} className="bg-emerald-100 text-emerald-900 w-full p-2 mb-2 rounded font-bold text-sm text-center">{a.name}</div>)}
                                </div>
                                <div className="flex-1 border-4 border-dashed border-red-600/50 bg-red-900/20 rounded-xl p-4 flex flex-col items-center hover:bg-red-900/40"
                                    onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, 'malicious')}>
                                    <h3 className="text-2xl font-bold text-red-500 mb-4 bg-red-950 px-4 py-2 rounded-full border border-red-800">🚨 MALICIOUS APPS</h3>
                                    {maliciousBucket.map(a => <div key={a.id} className="bg-red-100 text-red-900 w-full p-2 mb-2 rounded font-bold text-sm text-center">{a.name}</div>)}
                                </div>
                            </div>

                            {isComplete && (
                                <div className="mt-8 flex justify-center h-16">
                                    <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xl font-bold px-12 py-3 rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] animate-bounce" onClick={checkResults}>
                                        Verify Sort
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center">
                            <h2 className="text-5xl mb-6">{feedbackMsg.includes('Perfect') ? '🎉' : '❌'}</h2>
                            <h3 className="text-3xl font-bold text-white mb-8">{feedbackMsg}</h3>
                            <button className="bg-slate-700 hover:bg-slate-600 px-8 py-4 rounded font-bold text-lg" onClick={() => setGameState('chat_ui')}>
                                Return to Phone
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- OUTCOMES ---
    if (gameState === 'scam_outcome') {
        return (
            <div className="w-full h-full bg-red-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/60 z-0"></div>
                <div className="z-10 text-center max-w-3xl">
                    <span className="text-7xl mb-6 inline-block animate-bounce">📱</span>
                    <h1 className="text-5xl font-black text-red-500 uppercase tracking-widest mb-4">DEVICE COMPROMISED</h1>

                    <div className="bg-black/50 p-8 rounded-xl border border-red-500/30 mb-8 backdrop-blur text-left">
                        <p className="text-red-200 text-lg mb-4">
                            You installed the rogue APK and granted it invasive permissions.
                        </p>
                        <p className="text-red-300 text-lg mb-4">
                            The malware quietly monitored your SMS for bank OTPs and intercepted your contact list to spread further. Your bank account was drained behind your back.
                        </p>
                        <hr className="border-red-900/50 my-6" />
                        <div className="flex justify-between items-center text-xl font-mono text-red-400">
                            <span>FUNDS STOLEN:</span>
                            <span className="font-bold">-₹{usedClueBoard ? '4,20,000' : '4,62,000'}</span>
                        </div>
                        {!usedClueBoard && (
                            <div className="flex justify-between items-center text-sm font-mono text-amber-500 mt-2">
                                <span>No-Investigation Penalty (10%):</span>
                                <span>-₹42,000</span>
                            </div>
                        )}
                        <div className="mt-4 p-4 bg-red-900/30 border border-red-500/30 rounded text-red-200 text-sm">
                            <strong>System Note:</strong> Even "trusted" friends can unknowingly forward malicious links. Always verify the source.
                        </div>
                    </div>

                    <button
                        className="bg-red-600 hover:bg-red-500 px-8 py-4 rounded font-bold tracking-widest uppercase transition-colors border border-red-400"
                        onClick={() => {
                            const basePenalty = 420000;
                            const finalPenalty = usedClueBoard ? basePenalty : basePenalty * 1.1;
                            adjustAssets(-finalPenalty);
                            if (!usedClueBoard) adjustLives(-1);
                            completeLevel(false, 0, 0);
                        }}
                    >
                        Accept Consequences
                    </button>
                </div>
            </div>
        );
    }

    if (gameState === 'victory_outcome') {
        return (
            <div className="w-full h-full bg-emerald-950 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/60 z-0"></div>
                <div className="z-10 text-center max-w-3xl">
                    <span className="text-7xl mb-6 inline-block animate-bounce">📱</span>
                    <h1 className="text-5xl font-black text-emerald-400 uppercase tracking-widest mb-4">DEVICE SECURED</h1>

                    <div className="bg-black/50 p-8 rounded-xl border border-emerald-500/30 mb-8 backdrop-blur text-left">
                        <h3 className="text-emerald-300 font-bold mb-4 uppercase tracking-wider text-xl">Cyber Tip: App Authentication</h3>
                        <p className="text-emerald-100 text-lg mb-4 leading-relaxed">
                            You successfully identified the fake app by checking its developer, reviews, and absurd permission requests.
                        </p>
                        <p className="text-emerald-100/80 text-md leading-relaxed">
                            By warning your friend Arjun, you also stopped the malware from spreading further across campus. Community vigilance is the strongest defense.
                        </p>

                        <hr className="border-emerald-900/50 my-6" />
                        <div className="flex justify-between items-center text-xl font-mono text-emerald-400">
                            <span>CYBER SCORE EARNED:</span>
                            <span className="font-bold">+{usedClueBoard ? '15' : '10'} PTS</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold text-blue-400 mt-2">
                            <span>COMMUNITY GUARDIAN BONUS:</span>
                            <span>+5 PTS</span>
                        </div>
                    </div>

                    <button
                        className="bg-emerald-600 hover:bg-emerald-500 px-8 py-4 rounded font-bold tracking-widest uppercase transition-colors border border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                        onClick={() => completeLevel(true, usedClueBoard ? 20 : 15, 0)}
                    >
                        Continue to Next Day
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default Level3;
