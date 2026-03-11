import React, { useState, useEffect } from 'react';
import { useGameState } from '../context/GameStateContext';
import Player from '../components/Player';

// ═══ CLUE DATA (Dual-View Edition) ═══
const CLUE_DATA = [
    // Top-Down Clues
    { id: 'barista_chat', name: 'Barista Interaction', desc: 'The café\'s only official network is BrewConnect_Guest with WPA2 encryption. Password: coffee2024.', points: 15, icon: '☕' },
    { id: 'hacker_corner', name: 'Suspicious Customer (Hacker)', desc: 'Laptop running network monitoring tools. A portable router hidden in his backpack is broadcasting SBI_SecureNet.', points: 30, icon: '🕵️' },
    { id: 'customer_screen', name: 'Victim\'s Screen (MITM Demo)', desc: 'Her banking URL shows http:// instead of https://. The hacker is silently capturing her login credentials.', points: 20, icon: '💻' },
    // POV Clues
    { id: 'secure_net_props', name: 'SBI_SecureNet Properties', desc: 'BSSID prefix E4:FA:C4 — identified as a mobile phone hotspot, NOT a commercial router. Banks never host open Wi-Fi in public spaces.', points: 25, icon: '📡' },
    { id: 'vpn_clue', name: 'VPN Protection', desc: 'A VPN encrypts all traffic even on public Wi-Fi. If you must use public Wi-Fi, always enable VPN first.', points: 10, icon: '🛡️' },
];

const NETWORKS = [
    { id: 'brew_connect', name: 'BrewConnect_Guest', signal: 3, locked: true, security: 'WPA2-PSK (AES-256)', mac: '00:1A:2B:3C:4D:5E', created: 'Router — Active 2+ years', desc: 'Official café network. Password protected with WPA2 encryption.', safe: true },
    { id: 'sbi_secure', name: 'SBI_SecureNet', signal: 4, locked: false, security: 'NONE (Open Network)', mac: 'E4:FA:C4:29:11:AB — Mobile Hotspot', created: 'Today, 09:47 AM (2 hours ago)', desc: 'Banks do NOT set up Wi-Fi networks in public spaces. This is a honeypot trap.', safe: false },
    { id: 'android_hotspot', name: 'AndroidHotspot_7291', signal: 1, locked: true, security: 'WPA2-PSK', mac: 'A0:B1:C2:D3:E4:F5', created: 'Personal device', desc: 'A customer\'s personal mobile hotspot. Low signal.', safe: true },
    { id: 'bsnl_fiber', name: 'BSNL_Fiber_Home42', signal: 1, locked: true, security: 'WPA2-PSK', mac: '00:FF:AA:BB:CC:DD', created: 'Router — Residential', desc: 'A home router from the building above. Very faint signal.', safe: true },
];

const Level7 = () => {
    const { completeLevel, adjustAssets, adjustLives } = useGameState();

    const [gameState, setGameState] = useState('pov_intro');
    const [cluesFound, setCluesFound] = useState([]);
    const [feedbackMsg, setFeedbackMsg] = useState(null);
    const [activeNetwork, setActiveNetwork] = useState(null);
    const [outcomeType, setOutcomeType] = useState(null);
    const [activeCluePanel, setActiveCluePanel] = useState(null);
    const [showCluesSidebar, setShowCluesSidebar] = useState(false);
    const [cafePhase, setCafePhase] = useState('arrived'); // arrived, ordered, eating, need_wifi, investigating, leaving
    const [outroStep, setOutroStep] = useState(0);

    // Cinematic & Movement States
    const [isChairExited, setIsChairExited] = useState(false);
    const [isCarExited, setIsCarExited] = useState(false);
    const [playerPos, setPlayerPos] = useState({ x: 800, y: 600 });
    const [livingRoomPlayerPos, setLivingRoomPlayerPos] = useState({ x: 800, y: 800 });
    const [gardenPlayerPos, setGardenPlayerPos] = useState({ x: 200, y: 800 });
    const [cafeExteriorPlayerPos, setCafeExteriorPlayerPos] = useState({ x: 400, y: 950 }); // Entry point by the car
    const [cafePlayerPos, setCafePlayerPos] = useState({ x: 1800, y: 400 }); // Entry point at the mid right doors
    const [keys, setKeys] = useState({});
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [interactionTarget, setInteractionTarget] = useState(null);
    const [travelTime, setTravelTime] = useState(0);

    const SPEED = 12;
    const PLAYER_SIZE = 40;
    const VIEWPORT_WIDTH = 1200;
    const VIEWPORT_HEIGHT = 800;
    const ROOM_WIDTH = 1600;
    const ROOM_HEIGHT = 1100;

    const showFeedback = (msg, color = 'cyan') => {
        setFeedbackMsg({ text: msg, color });
        setTimeout(() => setFeedbackMsg(null), 3500);
    };

    const handleClueClick = (clueId) => {
        if (!cluesFound.includes(clueId)) {
            const clue = CLUE_DATA.find(c => c.id === clueId);
            if (clue) {
                setCluesFound(prev => [...prev, clueId]);
                showFeedback(`🔍 CLUE FOUND: ${clue.name} (+${clue.points} pts)`, 'emerald');
            }
        }
        setActiveCluePanel(clueId);
    };

    const triggerTransition = (newState, newPos = null, newLivingRoomPos = null, newGardenPos = null, newCafePos = null, newCafeExteriorPos = null) => {
        setIsTransitioning(true);
        setTimeout(() => {
            if (newState) setGameState(newState);
            if (newPos) setPlayerPos(newPos);
            if (newLivingRoomPos) setLivingRoomPlayerPos(newLivingRoomPos);
            if (newGardenPos) setGardenPlayerPos(newGardenPos);
            if (newCafePos) setCafePlayerPos(newCafePos);
            if (newCafeExteriorPos) setCafeExteriorPlayerPos(newCafeExteriorPos);

            setTimeout(() => setIsTransitioning(false), 500);
        }, 500);
    };

    const handleFinalChoice = (choice) => {
        setIsTransitioning(true);
        setTimeout(() => {
            if (choice === 'safe') {
                setCafePhase('leaving');
                setGameState('cafe_topdown');
                showFeedback("File successfully sent! Let's finish up and leave.", 'emerald');
            } else if (choice === 'sbi_secure') {
                setOutcomeType('defeat');
                setGameState('outcome');
            }
            setIsTransitioning(false);
        }, 800);
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
            if (gameState === 'room_intro' && isChairExited) {
                setPlayerPos(p => {
                    let nx = p.x, ny = p.y;
                    if (keys['w'] || keys['arrowup']) ny -= SPEED;
                    if (keys['s'] || keys['arrowdown']) ny += SPEED;
                    if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                    if (keys['d'] || keys['arrowright']) nx += SPEED;

                    nx = Math.max(50, Math.min(nx, ROOM_WIDTH - PLAYER_SIZE));
                    ny = Math.max(50, Math.min(ny, ROOM_HEIGHT - PLAYER_SIZE));

                    let target = null;
                    if (Math.abs(nx - 800) < 150 && ny > 950) target = 'room_door';
                    setInteractionTarget(target);

                    return { x: nx, y: ny };
                });
            } else if (gameState === 'living_room') {
                setLivingRoomPlayerPos(p => {
                    let nx = p.x, ny = p.y;
                    if (keys['w'] || keys['arrowup']) ny -= SPEED;
                    if (keys['s'] || keys['arrowdown']) ny += SPEED;
                    if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                    if (keys['d'] || keys['arrowright']) nx += SPEED;

                    nx = Math.max(120, Math.min(nx, ROOM_WIDTH - 120));
                    ny = Math.max(120, Math.min(ny, ROOM_HEIGHT - 120));

                    let target = null;
                    if (Math.abs(nx - 800) < 120 && ny < 150) target = 'main_door';
                    setInteractionTarget(target);

                    return { x: nx, y: ny };
                });
            } else if (gameState === 'garden') {
                setGardenPlayerPos(p => {
                    let nx = p.x, ny = p.y;
                    if (keys['w'] || keys['arrowup']) ny -= SPEED;
                    if (keys['s'] || keys['arrowdown']) ny += SPEED;
                    if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                    if (keys['d'] || keys['arrowright']) nx += SPEED;

                    const currentRoomWidth = Math.max(ROOM_WIDTH, window.innerWidth);
                    nx = Math.max(0, Math.min(nx, currentRoomWidth - PLAYER_SIZE));
                    ny = Math.max(50, Math.min(ny, ROOM_HEIGHT - PLAYER_SIZE));

                    const carZone = { x: currentRoomWidth / 2 - 140, y: ROOM_HEIGHT / 2 - 140, w: 280, h: 280 };
                    let target = null;
                    if (checkCollision(nx, ny, carZone)) target = 'car';
                    setInteractionTarget(target);

                    return { x: nx, y: ny };
                });
            } else if (gameState === 'cafe_exterior') {
                if (!isCarExited) {
                    setInteractionTarget('exterior_car_exit');
                    return;
                }
                setCafeExteriorPlayerPos(p => {
                    let nx = p.x, ny = p.y;
                    if (keys['w'] || keys['arrowup']) ny -= SPEED;
                    if (keys['s'] || keys['arrowdown']) ny += SPEED;
                    if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                    if (keys['d'] || keys['arrowright']) nx += SPEED;

                    const extWidth = 1920;
                    const extHeight = 1080;

                    nx = Math.max(50, Math.min(nx, extWidth - PLAYER_SIZE - 50));
                    ny = Math.max(800, Math.min(ny, extHeight - PLAYER_SIZE - 50)); // Restrict walking to sidewalk

                    const carZone = { x: 200, y: 850, w: 400, h: 200 };
                    const cafeDoorZone = { x: 1400, y: 800, w: 200, h: 150 };

                    let target = null;
                    if (checkCollision(nx, ny, carZone)) target = 'exterior_car';
                    else if (checkCollision(nx, ny, cafeDoorZone)) target = 'cafe_door';
                    setInteractionTarget(target);

                    return { x: nx, y: ny };
                });
            } else if (gameState === 'cafe_topdown') {
                setCafePlayerPos(p => {
                    let nx = p.x, ny = p.y;
                    if (keys['w'] || keys['arrowup']) ny -= SPEED;
                    if (keys['s'] || keys['arrowdown']) ny += SPEED;
                    if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                    if (keys['d'] || keys['arrowright']) nx += SPEED;

                    const cafeWidth = 1920; // Assuming wide aspect ratio for the image
                    const cafeHeight = 1080;

                    nx = Math.max(50, Math.min(nx, cafeWidth - PLAYER_SIZE - 50));
                    ny = Math.max(50, Math.min(ny, cafeHeight - PLAYER_SIZE - 50));

                    // Interaction Zones based on the image layout
                    const baristaZone = { x: 1000, y: 350, w: 300, h: 300 }; // Center-right L-counter (shifted right & down)
                    const hackerZone = { x: 1500, y: 700, w: 350, h: 350 }; // Full bottom right corner
                    const studentZone = { x: 100, y: 350, w: 400, h: 350 }; // Middle left tables
                    const phoneZone = { x: 800, y: 780, w: 400, h: 300 }; // Table directly below barista, touching bottom edge

                    let target = null;
                    if (checkCollision(nx, ny, baristaZone)) target = 'barista_chat';
                    else if (checkCollision(nx, ny, hackerZone)) target = 'hacker_corner';
                    else if (checkCollision(nx, ny, studentZone)) target = 'customer_screen';
                    else if (checkCollision(nx, ny, phoneZone)) target = 'phone_pov';

                    if (cafePhase === 'leaving') {
                        const exitZone = { x: 1800, y: 200, w: 120, h: 400 }; // Entrance/exit area on right
                        if (checkCollision(nx, ny, exitZone)) {
                            triggerTransition('cafe_exterior', null, null, null, null, { x: 1400, y: 700 });
                            return p;
                        }
                    }

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
    }, [gameState, keys, isChairExited]);

    // Action Handler
    useEffect(() => {
        const handleE = (e) => {
            if (e.key.toLowerCase() === 'e') {
                if (gameState === 'pov_intro') {
                    setIsChairExited(true);
                    triggerTransition('room_intro', { x: 800, y: 600 });
                    setTimeout(() => {
                        showFeedback("I'm starving... I'll drive down to the café and grab something to eat.", 'cyan');
                    }, 1000);
                } else if (gameState === 'room_intro' && interactionTarget === 'room_door') {
                    // Enter Living Room from the right door (Study entrance)
                    triggerTransition('living_room', null, { x: 1480, y: 550 });
                } else if (gameState === 'living_room' && interactionTarget === 'main_door') {
                    // Enter Garden from the top door (House entrance)
                    triggerTransition('garden', null, null, { x: 800, y: 100 });
                } else if (gameState === 'garden' && interactionTarget === 'car') {
                    triggerTransition('travel');
                } else if (gameState === 'cafe_exterior') {
                    if (interactionTarget === 'exterior_car_exit') {
                        setIsCarExited(true);
                        showFeedback("Time to get a coffee.", 'cyan');
                    } else if (interactionTarget === 'exterior_car') {
                        if (cafePhase === 'leaving') {
                            setGameState('cinematic_outro');
                            setOutroStep(2);
                            setTimeout(() => {
                                setOutroStep(3);
                                setTimeout(() => {
                                    completeLevel(true, cluesFound.length, 0);
                                }, 5000);
                            }, 3000);
                        } else {
                            showFeedback("I already drove here. Time to get a coffee.", 'orange');
                        }
                    } else if (interactionTarget === 'cafe_door') {
                        if (cafePhase === 'leaving') {
                            showFeedback("I already sent the email. Let's go home now.", 'orange');
                        } else {
                            triggerTransition('level_title_card');
                        }
                    }
                } else if (gameState === 'cafe_topdown') {
                    if (interactionTarget === 'barista_chat') {
                        if (cafePhase === 'arrived') {
                            showFeedback("Ordered a croissant and coffee! I should find a seat at the table directly below the counter.", 'emerald');
                            setCafePhase('ordered');
                        } else if (cafePhase === 'need_wifi' || cafePhase === 'investigating') {
                            handleClueClick('barista_chat');
                        } else if (cafePhase === 'ordered' || cafePhase === 'eating') {
                            showFeedback("The Barista is preparing my order. I should go find a seat.", 'orange');
                        } else if (cafePhase === 'leaving') {
                            showFeedback("Barista: Have a great day! Stay safe online.", 'cyan');
                        }
                    }
                    else if (interactionTarget === 'hacker_corner') {
                        if (cafePhase === 'need_wifi' || cafePhase === 'investigating') handleClueClick('hacker_corner');
                        else showFeedback("I shouldn't spy on other customers right now.", 'orange');
                    }
                    else if (interactionTarget === 'customer_screen') {
                        if (cafePhase === 'need_wifi' || cafePhase === 'investigating') handleClueClick('customer_screen');
                        else showFeedback("I shouldn't spy on other customers right now.", 'orange');
                    }
                    else if (interactionTarget === 'phone_pov') {
                        if (cafePhase === 'arrived') {
                            showFeedback("I should order some food at the counter first.", 'orange');
                        } else {
                            if (cafePhase === 'ordered') setCafePhase('eating');
                            setGameState('cafe_pov');
                        }
                    }
                }
            } else if (e.key.toLowerCase() === 'v') {
                if (gameState === 'cafe_topdown') {
                    if (cafePhase === 'arrived') {
                        showFeedback("I should order some food at the counter first.", 'orange');
                    } else {
                        if (cafePhase === 'ordered') setCafePhase('eating');
                        setGameState('cafe_pov');
                    }
                }
                else if (gameState === 'cafe_pov') setGameState('cafe_topdown');
            }
        };

        window.addEventListener('keydown', handleE);
        return () => window.removeEventListener('keydown', handleE);
    }, [gameState, interactionTarget]);

    // Travel Effect
    useEffect(() => {
        if (gameState === 'travel') {
            const timer = setTimeout(() => {
                triggerTransition('cafe_exterior');
                showFeedback("Arrived at the café. Press [E] to get out of the car and head inside.", 'cyan');
            }, 3500);
            return () => clearTimeout(timer);
        }
    }, [gameState]);

    // Title Card Effect
    useEffect(() => {
        if (gameState === 'level_title_card') {
            const timer = setTimeout(() => {
                triggerTransition('cafe_topdown');
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [gameState]);

    // Eating Effect
    useEffect(() => {
        if (gameState === 'cafe_pov' && cafePhase === 'eating') {
            const timer = setTimeout(() => {
                showFeedback("Enjoying the food... Oh wait, I need to send a large file for work! My mobile data is too slow. I should connect to the Wi-Fi.", "orange");
                setCafePhase('need_wifi');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [gameState, cafePhase]);

    // ═══════════════════════════════════════
    // FEEDBACK TOAST
    // ═══════════════════════════════════════
    const FeedbackToast = () => feedbackMsg && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 py-4 px-8 rounded-2xl shadow-2xl z-[600] animate-in slide-in-from-top duration-500 font-black tracking-wider text-sm flex items-center gap-3 border backdrop-blur-xl ${feedbackMsg.color === 'emerald' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' :
            feedbackMsg.color === 'orange' ? 'bg-amber-950/90 border-amber-500/50 text-amber-200' :
                'bg-cyan-950/90 border-cyan-500/50 text-cyan-200'
            }`}>
            <div className={`w-3 h-3 rounded-full animate-pulse ${feedbackMsg.color === 'emerald' ? 'bg-emerald-400' :
                feedbackMsg.color === 'orange' ? 'bg-amber-400' : 'bg-cyan-400'
                }`} />
            {feedbackMsg.text}
        </div>
    );

    // ═══════════════════════════════════════
    // CLUES SIDEBAR (compact)
    // ═══════════════════════════════════════
    const CluesSidebar = () => (
        <div className={`fixed right-0 top-0 bottom-0 w-[340px] bg-slate-950/95 backdrop-blur-xl border-l border-white/10 z-[400] transform transition-transform duration-500 flex flex-col ${showCluesSidebar ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <div>
                    <h3 className="text-white font-black text-lg uppercase tracking-wider">Evidence Found</h3>
                    <p className="text-slate-500 text-xs font-bold mt-1">{cluesFound.length} / {CLUE_DATA.length} clues</p>
                </div>
                <button onClick={() => setShowCluesSidebar(false)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 transition-all">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {CLUE_DATA.map(clue => {
                    const found = cluesFound.includes(clue.id);
                    return (
                        <div key={clue.id} className={`p-4 rounded-xl border transition-all ${found ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5 opacity-40'}`}>
                            <div className="flex items-center gap-3">
                                <span className="text-xl">{found ? clue.icon : '❓'}</span>
                                <div>
                                    <h4 className={`text-sm font-black ${found ? 'text-emerald-300' : 'text-slate-500'}`}>{found ? clue.name : 'Undiscovered'}</h4>
                                    {found && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{clue.desc}</p>}
                                </div>
                            </div>
                            {found && <div className="mt-2 text-right"><span className="text-emerald-400 text-xs font-black">+{clue.points} pts</span></div>}
                        </div>
                    );
                })}
            </div>
            <div className="p-4 border-t border-white/10">
                <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${cluesFound.length >= 3 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${(cluesFound.length / CLUE_DATA.length) * 100}%` }} />
                </div>
                <p className="text-center text-xs text-slate-500 mt-2 font-bold">{cluesFound.length >= 3 ? '✓ Ready to make your choice' : `Find ${3 - cluesFound.length} more clues`}</p>
            </div>
        </div>
    );

    // ═══════════════════════════════════════
    // CLUE DETAIL PANEL (modal overlay)
    // ═══════════════════════════════════════
    const ClueDetailPanel = () => {
        if (!activeCluePanel) return null;
        const clue = CLUE_DATA.find(c => c.id === activeCluePanel);
        if (!clue) return null;

        const details = {
            secure_net_props: {
                title: 'Network Analysis', items: [
                    { label: 'Network Name (SSID)', value: 'SBI_SecureNet' },
                    { label: 'Security', value: 'NONE (Open — No Encryption)', danger: true },
                    { label: 'MAC Address', value: 'E4:FA:C4:29:11:AB — Mobile Phone Hotspot', danger: true },
                    { label: 'Network Created', value: 'Today, 09:47 AM (2 hours ago)', danger: true },
                ], warning: 'Banks do NOT set up Wi-Fi networks in public spaces. Any network named after a bank should be treated as a scam.'
            },
            barista_chat: {
                title: 'Official Wi-Fi Verification', items: [
                    { label: 'Network', value: 'BrewConnect_Guest' },
                    { label: 'Password', value: 'coffee2024' },
                    { label: 'Security', value: 'WPA2 Encrypted ✓' },
                ], warning: 'A password-protected Wi-Fi with WPA2 encryption is safer than an open network. Verification from official staff is key.'
            },
            hacker_corner: {
                title: 'Suspicious Individual Report', items: [
                    { label: 'Equipment', value: 'Laptop + Portable Router in Backpack', danger: true },
                    { label: 'Software', value: 'Network monitoring & packet sniffing tools', danger: true },
                    { label: 'Broadcasting', value: 'SBI_SecureNet (the fake network)', danger: true },
                    { label: 'Connected Devices', value: '6 victims currently connected', danger: true },
                ], warning: 'This person has set up a HONEYPOT. He is intercepting all data from devices connected to SBI_SecureNet.'
            },
            customer_screen: {
                title: 'Man-in-the-Middle Attack Demo', items: [
                    { label: 'Victim', value: 'College student checking bank balance' },
                    { label: 'Connection', value: 'SBI_SecureNet (the fake network)' },
                    { label: 'URL Displayed', value: 'http:// (NOT https://)', danger: true },
                    { label: 'Data Captured', value: 'Login credentials, session tokens', danger: true },
                ], warning: 'A MITM attack captures data silently. The victim never knows. The attacker can read passwords, OTPs, account numbers.'
            },

            vpn_clue: {
                title: 'VPN Protection', items: [
                    { label: 'Status', value: 'Currently OFF (Not Protected)', danger: true },
                    { label: 'Function', value: 'Encrypts ALL internet traffic end-to-end' },
                ], warning: 'A VPN makes MITM attacks ineffective. If you MUST use public Wi-Fi for banking, always turn on a trusted VPN first.'
            },
        };

        const d = details[activeCluePanel] || { title: clue.name, items: [], warning: clue.desc };

        return (
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setActiveCluePanel(null)}>
                <div className="max-w-lg w-full bg-slate-900 border-2 border-white/10 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-3xl border border-emerald-500/30">{clue.icon}</div>
                        <div>
                            <h3 className="text-white font-black text-xl">{d.title}</h3>
                            <p className="text-emerald-400 text-xs font-bold mt-1 uppercase tracking-wider">+{clue.points} Detective Points</p>
                        </div>
                    </div>

                    <div className="space-y-3 mb-6">
                        {d.items.map((item, i) => (
                            <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/5">
                                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block mb-1">{item.label}</span>
                                <span className={`text-sm font-black ${item.danger ? 'text-red-400' : 'text-white'}`}>{item.value}</span>
                            </div>
                        ))}
                    </div>

                    {d.warning && (
                        <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl mb-6">
                            <p className="text-amber-200 text-sm leading-relaxed">⚠️ {d.warning}</p>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setActiveCluePanel(null); }}
                        className="w-full bg-white/10 hover:bg-white/15 text-white font-black py-4 rounded-xl transition-all cursor-pointer pointer-events-auto"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    };

    // ═══════════════════════════════════════
    // CINEMATIC COMPONENTS
    // ═══════════════════════════════════════
    const InteractionPrompt = ({ text, target }) => (
        interactionTarget === target && (
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-[100] animate-pulse">
                <div className="h-[2px] w-12 bg-white/30 mb-3" />
                <div className="text-white/80 font-mono text-[11px] uppercase tracking-[0.4em] drop-shadow-md">
                    Press E to {text}
                </div>
            </div>
        )
    );

    // Fade Overlay
    const FadeOverlay = () => (
        <div className={`fixed inset-0 bg-black z-[1000] pointer-events-none transition-opacity duration-700 ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
    );

    if (gameState === 'pov_intro') {
        return (
            <div className="w-full h-full bg-black relative overflow-hidden flex items-center justify-center">
                {FadeOverlay()}
                <img src="/assets/temppho.png" alt="POV intro" className="w-full h-full object-cover opacity-60 scale-105 animate-[pulse_6s_infinite]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 animate-pulse">
                    <div className="h-[2px] w-12 bg-white/30 mb-3" />
                    <div className="text-white/80 font-mono text-[11px] uppercase tracking-[0.4em] drop-shadow-md">
                        Press E to get down from chair
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'room_intro') {
        const camX = Math.max(0, Math.min(playerPos.x - VIEWPORT_WIDTH / 2, ROOM_WIDTH - VIEWPORT_WIDTH));
        const camY = Math.max(0, Math.min(playerPos.y - VIEWPORT_HEIGHT / 2, ROOM_HEIGHT - VIEWPORT_HEIGHT));

        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950 px-8">
                <div className="relative border-8 border-slate-900 shadow-2xl overflow-hidden bg-zinc-900" style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}>
                    {FadeOverlay()}
                    {InteractionPrompt({ text: 'exit to living room', target: 'room_door' })}

                    <div className="absolute transition-transform duration-100 ease-out" style={{ transform: `translate(${-camX}px, ${-camY}px)`, width: ROOM_WIDTH, height: ROOM_HEIGHT }}>
                        {/* Room Environment */}
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
                        </div>

                        {/* Exit Door Area */}
                        <div className="absolute left-[700px] bottom-0 w-[200px] h-10 bg-black/20 rounded-t-xl" />

                        <Player x={playerPos.x} y={playerPos.y} />
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'living_room') {
        const camX = Math.max(0, Math.min(livingRoomPlayerPos.x - VIEWPORT_WIDTH / 2, ROOM_WIDTH - VIEWPORT_WIDTH));
        const camY = Math.max(0, Math.min(livingRoomPlayerPos.y - VIEWPORT_HEIGHT / 2, ROOM_HEIGHT - VIEWPORT_HEIGHT));

        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950 px-8">
                <div className="relative border-8 border-slate-900 shadow-2xl overflow-hidden bg-zinc-900" style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}>
                    {FadeOverlay()}
                    {InteractionPrompt({ text: 'exit to garden', target: 'main_door' })}

                    <div className="absolute transition-transform duration-100 ease-out" style={{ transform: `translate(${-camX}px, ${-camY}px)`, width: ROOM_WIDTH, height: ROOM_HEIGHT }}>
                        <div className="absolute inset-0">
                            {/* Wood Floor */}
                            <div className="absolute inset-0 bg-[#2c3e50] opacity-80" style={{
                                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(0,0,0,0.2) 38px, rgba(0,0,0,0.2) 40px)'
                            }}></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 pointer-events-none z-10"></div>

                            {/* Top Double Door (Main Exit) */}
                            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[240px] h-[80px] bg-[#8a5a44] border-4 border-black border-t-0 flex z-10 ${interactionTarget === 'main_door' ? 'opacity-100 scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]' : 'opacity-80'} transition-all`}>
                                <div className="flex-1 border-r-2 border-black p-2 flex items-center justify-center text-[10px] text-white font-bold uppercase tracking-widest bg-emerald-900/20 text-center">EXIT TO GARDEN</div>
                                <div className="flex-1 border-l-2 border-black p-2 flex items-center justify-center">
                                    <div className="w-[80px] h-[50px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                                </div>
                            </div>

                            {/* Right Single Door (Coming from Study) */}
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[60px] h-[180px] bg-[#8a5a44] border-4 border-black border-r-0 p-3 flex flex-col items-center justify-center z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
                                <div className="text-[9px] text-white/60 font-black rotate-90 mb-8 tracking-[0.3em] whitespace-nowrap">STUDY</div>
                                <div className="w-[30px] h-[80px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                            </div>

                            {/* RUGS */}
                            <div className="absolute left-[180px] right-[120px] top-1/2 -translate-y-1/2 h-[260px] bg-[#cb3234] border-y-2 border-black z-0">
                                <div className="flex flex-col justify-between h-full -ml-2 absolute left-0 py-2">
                                    {[...Array(18)].map((_, i) => <div key={i} className="w-2 h-1 bg-black"></div>)}
                                </div>
                                <div className="flex flex-col justify-between h-full -mr-2 absolute right-0 py-2">
                                    {[...Array(18)].map((_, i) => <div key={i} className="w-2 h-1 bg-black"></div>)}
                                </div>
                            </div>
                            <div className="absolute top-[80px] bottom-[80px] left-1/2 -translate-x-1/2 w-[260px] bg-[#cb3234] border-x-2 border-black z-0">
                                <div className="flex justify-between w-full -mt-2 absolute top-0 px-2">
                                    {[...Array(18)].map((_, i) => <div key={i} className="w-1 h-2 bg-black"></div>)}
                                </div>
                                <div className="flex justify-between w-full -mb-2 absolute bottom-0 px-2">
                                    {[...Array(18)].map((_, i) => <div key={i} className="w-1 h-2 bg-black"></div>)}
                                </div>
                            </div>

                            {/* FURNITURE */}
                            <div className="absolute right-[480px] top-1/2 -translate-y-1/2 w-[140px] h-[320px] bg-[#445265] border-4 border-black flex flex-row items-center justify-start z-20 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
                                <div className="w-[80px] h-full flex flex-col justify-center items-start pl-2 gap-4">
                                    <div className="w-[60px] h-[100px] bg-[#364253] border-2 border-black ml-2 mt-2 shadow-inner"></div>
                                    <div className="w-[60px] h-[100px] bg-[#364253] border-2 border-black ml-2 mb-2 shadow-inner"></div>
                                </div>
                                <div className="absolute right-0 top-0 bottom-0 w-[40px] bg-[#4a586e] border-l-[3px] border-black shadow-inner"></div>
                                <div className="absolute top-0 left-0 w-[100px] h-[30px] bg-[#4a586e] border-b-[3px] border-black shadow-inner"></div>
                                <div className="absolute bottom-0 left-0 w-[100px] h-[30px] bg-[#4a586e] border-t-[3px] border-black shadow-inner"></div>
                            </div>

                            {/* COFFEE TABLE */}
                            <div className="absolute left-[740px] top-1/2 -translate-y-1/2 w-[100px] h-[180px] bg-[#383a48]/90 backdrop-blur-md border-4 border-[#222938] z-20 shadow-2xl flex items-center justify-center">
                                <div className="w-[80px] h-[160px] border border-white/10"></div>
                            </div>

                            {/* TV UNIT */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[180px] h-[340px] bg-[#222938] border-4 border-l-0 border-black flex items-center z-20 shadow-[20px_0_40px_rgba(0,0,0,0.6)]">
                                <div className="w-[120px] h-[260px] bg-[#1e4868] border-4 border-[#122336] ml-4 relative overflow-hidden shadow-inner font-mono text-[10px] text-white/10 flex items-center justify-center uppercase tracking-tighter italic">News Feed</div>
                            </div>

                            {/* PLANTS */}
                            <div className="absolute left-[30px] top-[140px] w-[60px] h-[60px] bg-[#1d273a] rounded-full border-[3px] border-black flex items-center justify-center shadow-lg">
                                <div className="w-[44px] h-[44px] rounded-full bg-[#1b2f4f] flex items-center justify-center relative overflow-hidden text-[10px]">🌿</div>
                            </div>
                            <div className="absolute right-[30px] top-[140px] w-[60px] h-[60px] bg-[#1d273a] rounded-full border-[3px] border-black flex items-center justify-center shadow-lg">
                                <div className="w-[44px] h-[44px] rounded-full bg-[#1b2f4f] flex items-center justify-center relative overflow-hidden text-[10px]">🌿</div>
                            </div>
                        </div>

                        <Player x={livingRoomPlayerPos.x} y={livingRoomPlayerPos.y} />
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'garden') {
        const currentRoomWidth = Math.max(ROOM_WIDTH, window.innerWidth);
        const cameraX = Math.max(0, Math.min(gardenPlayerPos.x - window.innerWidth / 2, currentRoomWidth - window.innerWidth));

        return (
            <div className="w-full h-full flex flex-col bg-slate-900 overflow-hidden relative font-sans">
                {FadeOverlay()}
                {InteractionPrompt({ text: 'get into car', target: 'car' })}

                <div className="relative flex-1" style={{ width: currentRoomWidth, transform: `translateX(${-cameraX}px)`, transition: 'transform 0.1s linear' }}>
                    {/* The Full Reference Background Image */}
                    <div className="absolute top-0 left-0 w-full h-full z-0">
                        <img src="/assets/aftergarden.png" alt="Garden Day" className="w-full h-full object-[100%_100%]" style={{ objectFit: 'fill' }} />
                    </div>

                    <Player x={gardenPlayerPos.x} y={gardenPlayerPos.y} />
                </div>
            </div>
        );
    }

    if (gameState === 'travel') {
        return (
            <div className="w-full h-full bg-black relative overflow-hidden flex items-center justify-center">
                {FadeOverlay()}
                <div className="absolute inset-0 bg-black animate-pulse opacity-40" />
                <img src="/assets/aftercar.png" alt="Traveling" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="flex gap-4 mb-4">
                        <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                        <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                    <h2 className="text-white font-black text-3xl uppercase tracking-[0.3em] animate-pulse">Traveling to Café</h2>
                </div>
            </div>
        );
    }
    if (gameState === 'cafe_exterior') {
        const EXT_WIDTH = 1920;
        const EXT_HEIGHT = 1080;

        const camX = Math.max(0, Math.min(cafeExteriorPlayerPos.x - window.innerWidth / 2, EXT_WIDTH - window.innerWidth));
        const camY = Math.max(0, Math.min(cafeExteriorPlayerPos.y - window.innerHeight / 2, EXT_HEIGHT - window.innerHeight));

        return (
            <div className="w-full h-full bg-slate-950 overflow-hidden relative font-sans">
                {FadeOverlay()}
                {FeedbackToast()}

                {interactionTarget === 'exterior_car_exit' && InteractionPrompt({ text: 'get out of car', target: 'exterior_car_exit' })}
                {interactionTarget === 'exterior_car' && InteractionPrompt({ text: 'get in car', target: 'exterior_car' })}
                {interactionTarget === 'cafe_door' && InteractionPrompt({ text: 'enter Café', target: 'cafe_door' })}

                <div
                    className="absolute"
                    style={{
                        width: EXT_WIDTH,
                        height: EXT_HEIGHT,
                        transform: `translate(${-camX}px, ${-camY}px)`,
                        transition: 'transform 0.1s linear'
                    }}
                >
                    <img src="/assets/cafe.png" alt="Cafe Exterior" className="w-full h-full object-[100%_100%]" style={{ objectFit: 'fill' }} />
                    {isCarExited && <Player x={cafeExteriorPlayerPos.x} y={cafeExteriorPlayerPos.y} />}
                </div>
            </div>
        );
    }

    if (gameState === 'level_title_card') {
        return (
            <div className="absolute inset-0 bg-black z-[1000] flex flex-col items-center justify-center animate-cinematic-sequence">
                <div className="flex flex-col items-center relative">
                    {/* Dramatic pulse rings */}
                    <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-3xl animate-ping scale-[2.5] opacity-50" />

                    <div className="h-px w-32 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mb-8 animate-[width_1.5s_ease-in-out]" />

                    <h2 className="text-white text-6xl font-black tracking-[0.4em] uppercase mb-4 relative opacity-0" style={{ animation: 'fadeIn 1s forwards, surge 3s infinite' }}>
                        <span className="relative z-10">Level 7</span>
                        {/* Chromatic aberration layers */}
                        <span className="absolute inset-0 text-cyan-500 opacity-60 translate-x-1 -z-10 animate-aberration">Level 7</span>
                        <span className="absolute inset-0 text-emerald-400 opacity-60 -translate-x-1 -z-10 animate-aberration-alt">Level 7</span>
                    </h2>

                    <h3 className="text-cyan-500 text-lg font-mono tracking-[0.8em] uppercase opacity-0 font-bold" style={{ animation: 'fadeIn 1s forwards 1.2s' }}>
                        The Public Network
                    </h3>

                    <div className="h-px w-32 bg-gradient-to-r from-transparent via-cyan-500 to-transparent mt-12 animate-[width_1.5s_ease-in-out]" />

                    {/* Tension metadata */}
                    <div className="mt-8 text-[8px] font-mono text-zinc-800 tracking-widest uppercase animate-pulse">
                        Scanning Available Networks... [33%] [66%] [99%]
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'cafe_topdown') {
        const CAFE_WIDTH = 1920;
        const CAFE_HEIGHT = 1080;

        // Center camera precisely around player while respecting map bounds
        const camX = Math.max(0, Math.min(cafePlayerPos.x - window.innerWidth / 2, CAFE_WIDTH - window.innerWidth));
        const camY = Math.max(0, Math.min(cafePlayerPos.y - window.innerHeight / 2, CAFE_HEIGHT - window.innerHeight));

        return (
            <div className="w-full h-full bg-slate-950 overflow-hidden relative font-sans">
                {FadeOverlay()}
                {FeedbackToast()}
                {CluesSidebar()}
                {ClueDetailPanel()}

                {interactionTarget === 'barista_chat' && InteractionPrompt({ text: cafePhase === 'arrived' ? 'order food' : (cafePhase === 'need_wifi' || cafePhase === 'investigating' ? 'ask for Wi-Fi password' : 'talk to Barista'), target: 'barista_chat' })}
                {interactionTarget === 'hacker_corner' && InteractionPrompt({ text: 'inspect Hacker', target: 'hacker_corner' })}
                {interactionTarget === 'customer_screen' && InteractionPrompt({ text: 'check Student', target: 'customer_screen' })}
                {interactionTarget === 'phone_pov' && InteractionPrompt({ text: 'sit and use phone (V to toggle)', target: 'phone_pov' })}

                <div
                    className="absolute"
                    style={{
                        width: CAFE_WIDTH,
                        height: CAFE_HEIGHT,
                        transform: `translate(${-camX}px, ${-camY}px)`,
                        transition: 'transform 0.1s linear'
                    }}
                >
                    <img src="/assets/cafe_in.jpeg" alt="Cafe Top Down" className="w-full h-full object-[100%_100%]" style={{ objectFit: 'fill' }} />

                    {/* Glowing Interaction Zones */}
                    {/* Barista */}
                    {(cafePhase === 'arrived' || cafePhase === 'need_wifi' || cafePhase === 'investigating') && (
                        <div className="absolute flex items-center justify-center pointer-events-none" style={{ left: 1000, top: 350, width: 300, height: 300 }}>
                            <div className="w-[150px] h-[150px] rounded-full border-4 border-amber-400/40 bg-amber-400/10 animate-[pulse_2s_infinite] shadow-[0_0_40px_rgba(251,191,36,0.2)]" />
                        </div>
                    )}

                    {/* Table / Phone Phase */}
                    {(cafePhase === 'ordered' || ((cafePhase === 'need_wifi' || cafePhase === 'investigating') && cluesFound.length >= 3)) && (
                        <div className="absolute flex items-center justify-center pointer-events-none" style={{ left: 800, top: 780, width: 400, height: 300 }}>
                            <div className="w-[150px] h-[150px] rounded-full border-4 border-cyan-400/40 bg-cyan-400/10 animate-[ping_3s_infinite] shadow-[0_0_40px_rgba(34,211,238,0.2)]" />
                        </div>
                    )}

                    {/* Hacker */}
                    {(cafePhase === 'need_wifi' || cafePhase === 'investigating') && !cluesFound.includes('hacker_corner') && (
                        <div className="absolute flex items-center justify-center pointer-events-none" style={{ left: 1500, top: 700, width: 350, height: 350 }}>
                            <div className="w-[150px] h-[150px] rounded-full border-4 border-red-500/40 bg-red-500/10 animate-[pulse_2s_infinite] shadow-[0_0_40px_rgba(239,68,68,0.2)]" />
                        </div>
                    )}

                    {/* Student */}
                    {(cafePhase === 'need_wifi' || cafePhase === 'investigating') && !cluesFound.includes('customer_screen') && (
                        <div className="absolute flex items-center justify-center pointer-events-none" style={{ left: 100, top: 350, width: 400, height: 350 }}>
                            <div className="w-[150px] h-[150px] rounded-full border-4 border-amber-400/40 bg-amber-400/10 animate-[pulse_2s_infinite] shadow-[0_0_40px_rgba(251,191,36,0.2)]" />
                        </div>
                    )}

                    <Player x={cafePlayerPos.x} y={cafePlayerPos.y} />
                </div>

                {/* Top instruction bar */}
                <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur border border-white/10 px-6 py-3 rounded-xl z-40 w-[700px]">
                    <p className="text-white/80 text-sm font-bold text-center leading-relaxed">
                        {cafePhase === 'arrived' && "☕ I just got here. I should go to the counter and order some food from the Barista."}
                        {cafePhase === 'ordered' && "🍔 Order placed! I should find a seat at the empty table directly below the counter."}
                        {cafePhase === 'leaving' && "🚶 Request sent. I should head to the right exit of the café to leave."}
                        {(cafePhase === 'need_wifi' || cafePhase === 'investigating' || cafePhase === 'eating') && (
                            cluesFound.length < 3
                                ? "🔍 I need Wi-Fi right now. Let me explore the café and investigate people/objects to gather clues before connecting."
                                : "📱 I have enough evidence here. I should press [V] to inspect the table and connect."
                        )}
                    </p>
                </div>

                {/* View Switch Button HUD */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40">
                    <button onClick={() => setGameState('cafe_pov')} className="bg-slate-900/90 backdrop-blur border-2 border-cyan-500/50 hover:border-cyan-400 text-white px-6 py-3 rounded-xl font-black text-sm shadow-[0_0_30px_rgba(34,211,238,0.2)] flex items-center gap-3 group transition-all">
                        <span className="text-cyan-400 group-hover:animate-ping">👁️</span>
                        <span className="tracking-widest uppercase">Inspect Table POV [V]</span>
                    </button>
                    <p className="text-center text-[10px] text-cyan-400/60 mt-2 font-bold uppercase tracking-widest">Toggle View Mode</p>
                </div>

                {/* ═══ BOTTOM HUD ═══ */}
                <div className="absolute bottom-4 left-4 flex gap-3 z-40">
                    <button onClick={() => setShowCluesSidebar(!showCluesSidebar)} className="bg-slate-900/90 backdrop-blur border border-white/10 hover:border-amber-500 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg">
                        🔍 Evidence ({cluesFound.length}/{CLUE_DATA.length})
                        {cluesFound.length > 0 && !showCluesSidebar && <span className="w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center animate-bounce">{cluesFound.length}</span>}
                    </button>
                </div>
            </div>
        );
    }

    if (gameState === 'cafe_pov') {
        return (
            <div className="w-full h-full bg-[#1a0e08] relative overflow-hidden">
                {FeedbackToast()}
                {CluesSidebar()}
                {ClueDetailPanel()}

                {/* Warm café background */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #2d1810 0%, #1a0e08 60%, #0d0705 100%)' }} />

                {/* View Switch Button HUD */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40">
                    <button onClick={() => setGameState('cafe_topdown')} className="bg-slate-900/90 backdrop-blur border-2 border-amber-500/50 hover:border-amber-400 text-white px-6 py-3 rounded-xl font-black text-sm shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-center gap-3 group transition-all">
                        <span className="text-amber-400 group-hover:animate-ping">🗺️</span>
                        <span className="tracking-widest uppercase">Back to Top-Down [V]</span>
                    </button>
                    <p className="text-center text-[10px] text-amber-400/60 mt-2 font-bold uppercase tracking-widest">Toggle View Mode</p>
                </div>

                {/* Brick wall texture */}
                <div className="absolute inset-x-0 top-0 h-[55%] opacity-20" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 18px, rgba(139,90,43,0.3) 18px, rgba(139,90,43,0.3) 20px), repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(139,90,43,0.2) 38px, rgba(139,90,43,0.2) 40px)',
                    backgroundSize: '40px 20px'
                }} />

                {/* Warm light rays from windows */}
                <div className="absolute top-0 left-[10%] w-[250px] h-[600px] bg-gradient-to-b from-amber-400/15 to-transparent skew-x-[-15deg] blur-[40px] pointer-events-none" />
                <div className="absolute top-0 left-[50%] w-[200px] h-[500px] bg-gradient-to-b from-amber-300/10 to-transparent skew-x-[-10deg] blur-[60px] pointer-events-none" />

                {/* Window (left) */}
                <div className="absolute left-[5%] top-[5%] w-[30%] h-[45%] bg-gradient-to-b from-indigo-950/40 to-slate-950/60 border-[12px] border-[#3d2415] rounded-t-lg overflow-hidden">
                    <div className="absolute bottom-4 left-4 w-20 h-10 bg-amber-400/10 rounded blur-lg animate-pulse" />
                    <div className="absolute bottom-8 right-8 w-12 h-8 bg-white/5 rounded blur-sm" />
                    <div className="absolute top-4 right-4 text-xs text-white/20 font-mono">STREET VIEW</div>
                </div>

                {/* Window (right) */}
                <div className="absolute right-[5%] top-[5%] w-[25%] h-[40%] bg-gradient-to-b from-indigo-950/30 to-slate-950/50 border-[12px] border-[#3d2415] rounded-t-lg" />

                {/* Floor */}
                <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-[#0a0604] to-[#1a0e08]" style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(100,60,20,0.05) 60px, rgba(100,60,20,0.05) 62px)',
                }} />

                {/* Edison bulbs */}
                {[15, 35, 55, 75].map((left, i) => (
                    <div key={i} className="absolute z-10 pointer-events-none" style={{ left: `${left}%`, top: 0 }}>
                        <div className="w-px h-16 bg-amber-900/60 mx-auto" />
                        <div className="w-4 h-6 bg-amber-400/60 rounded-full mx-auto shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse" style={{ animationDelay: `${i * 0.7}s` }} />
                    </div>
                ))}

                {/* ═══ RESTRICTED HOTSPOTS in POV ═══ */}
                {/* Clues like Hacker and MITM have been moved to top-down view */}

                {/* 4. THE PHONE (center table) with VPN + 4G clues */}
                <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 z-30">
                    {/* Table surface */}
                    <div className="w-[400px] h-[200px] bg-gradient-to-b from-[#8B5A2C] to-[#6B4423] rounded-t-xl border-t-4 border-[#A0724A] relative shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                        {/* Coffee mug */}
                        <div className="absolute left-8 top-4 w-14 h-16 bg-white rounded-b-[20px] border-2 border-stone-200 shadow-lg">
                            <div className="absolute -top-1 inset-x-0 h-4 bg-amber-900/80 rounded-full" />
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-2">
                                <div className="w-1 h-6 bg-white/20 rounded-full blur animate-bounce" style={{ animationDelay: '0s' }} />
                                <div className="w-1 h-8 bg-white/15 rounded-full blur animate-bounce" style={{ animationDelay: '0.5s' }} />
                            </div>
                        </div>

                        {/* Phone on table */}
                        <div className="absolute right-12 top-2 w-[140px] h-[260px] bg-black rounded-[24px] border-4 border-zinc-800 shadow-xl overflow-hidden group">
                            {/* Notch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-b-xl z-10" />
                            {/* Status bar */}
                            <div className="pt-7 px-3 flex justify-between items-center">
                                <span className="text-[8px] text-white font-bold">11:45</span>
                                <div className="flex items-center gap-1">
                                    {/* 4G icon - non-clickable */}
                                    <div className="flex items-end gap-[1px] h-3">
                                        {[...Array(4)].map((_, i) => <div key={i} className="w-[2px] bg-white rounded-full" style={{ height: `${(i + 1) * 25}%` }} />)}
                                        <span className="text-[6px] text-white font-bold ml-[2px]">4G</span>
                                    </div>
                                    <div className="w-5 h-[8px] border border-white/40 rounded-sm p-[1px]">
                                        <div className="h-full bg-green-400 rounded-sm" style={{ width: '80%' }} />
                                    </div>
                                </div>
                            </div>
                            {/* Screen content */}
                            <div className="p-3 flex flex-col gap-2 flex-1 relative">
                                {!cluesFound.includes('vpn_clue') && (cafePhase === 'need_wifi' || cafePhase === 'investigating') && (
                                    <div className="absolute -left-20 top-4 text-[10px] text-cyan-400 font-bold bg-cyan-950/80 px-2 py-1 rounded border border-cyan-500/30 animate-pulse whitespace-nowrap">
                                        Check Security →
                                    </div>
                                )}

                                {/* VPN app */}
                                <div className="cursor-pointer hover:scale-105 transition-all bg-white/5 p-2 rounded-lg border border-white/5" onClick={(e) => { e.stopPropagation(); handleClueClick('vpn_clue'); }}>
                                    <div className="flex items-center gap-2">
                                        <div className="text-lg">🛡️</div>
                                        <div>
                                            <div className="text-[7px] text-white font-bold">VPN App</div>
                                            <div className="text-[6px] text-red-400">OFF — Not Protected</div>
                                        </div>
                                    </div>

                                </div>
                                {/* Scan networks button */}
                                <div className="mt-auto">
                                    {cafePhase === 'eating' || cafePhase === 'arrived' || cafePhase === 'ordered' ? (
                                        <div className="bg-white/10 text-white/40 text-[8px] font-black py-2 rounded-lg text-center uppercase tracking-wider">
                                            📡 Scan Wi-Fi (Not needed yet)
                                        </div>
                                    ) : (
                                        <div
                                            className="bg-gradient-to-r from-cyan-600 to-indigo-600 text-white text-[8px] font-black py-2 rounded-lg text-center uppercase tracking-wider shadow-lg hover:shadow-cyan-500/50 cursor-pointer pointer-events-auto"
                                            onClick={(e) => { e.stopPropagation(); setGameState('radar'); setCafePhase(prev => (prev === 'need_wifi' ? 'investigating' : prev)); }}
                                        >
                                            📡 Scan Wi-Fi Networks
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Home bar */}
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-16 h-1 bg-white/30 rounded-full" />
                        </div>

                        {/* Croissant */}
                        <div className="absolute left-28 top-8 w-12 h-8 bg-amber-400/60 rounded-[50%] rotate-12 border border-amber-600/30 shadow-md" />
                    </div>
                </div>

                {/* Counter / Barista area */}
                <div className="absolute right-0 bottom-0 w-[35%] h-[55%] bg-gradient-to-t from-[#0a0604] to-[#2d1810] border-l-[10px] border-[#3d2415]">
                    {/* Barista */}
                    <div className="absolute -top-20 left-12 flex flex-col items-center">
                        <div className="w-12 h-12 bg-amber-900/40 rounded-full" />
                        <div className="w-24 h-32 bg-gradient-to-b from-emerald-900/40 to-black rounded-t-[30px] mt-1 relative">
                            <div className="absolute top-0 inset-x-4 h-full bg-emerald-800/20 border-x border-emerald-700/10" />
                        </div>
                    </div>
                    {/* Menu board */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[80%] h-24 bg-zinc-900 rounded-lg border-4 border-[#3d2415] p-3">
                        <div className="text-[8px] text-amber-400 font-black text-center mb-1">☕ MENU</div>
                        <div className="text-[6px] text-stone-400 space-y-0.5 text-center font-mono">
                            <p>Filter Coffee ₹80 | Latte ₹150</p>
                            <p>Croissant ₹120 | Sandwich ₹200</p>
                        </div>
                    </div>
                </div>

                {/* ═══ BOTTOM HUD ═══ */}
                <div className="absolute bottom-4 left-4 flex gap-3 z-40">
                    <button onClick={() => setShowCluesSidebar(!showCluesSidebar)} className="bg-slate-900/90 backdrop-blur border border-white/10 hover:border-amber-500 text-white px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg">
                        🔍 Evidence ({cluesFound.length}/{CLUE_DATA.length})
                        {cluesFound.length > 0 && !showCluesSidebar && <span className="w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center animate-bounce">{cluesFound.length}</span>}
                    </button>
                </div>

                {/* Top instruction bar for POV */}
                <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur border border-white/10 px-6 py-3 rounded-xl z-40">
                    <p className="text-white/80 text-xs font-bold text-center">
                        {cafePhase === 'need_wifi' || cafePhase === 'investigating'
                            ? "📱 Inspect the VPN app on your phone, then click 'Scan Wi-Fi Networks'."
                            : "☕ Eating your meal. Wait a moment or press [V] to get back up."}
                    </p>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════
    // NETWORK RADAR
    // ═══════════════════════════════════════
    if (gameState === 'radar') {
        return (
            <div className="w-full h-full bg-[#040810] relative overflow-hidden">
                {FeedbackToast()}
                {CluesSidebar()}

                {/* Sonar rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="absolute rounded-full border border-cyan-500/10" style={{ width: (i + 1) * 180, height: (i + 1) * 180 }} />
                    ))}
                    {/* Sweep line */}
                    <div className="absolute w-[600px] h-[600px] animate-[spin_6s_linear_infinite] pointer-events-none">
                        <div className="absolute top-1/2 left-1/2 w-1/2 h-px bg-gradient-to-r from-cyan-400/40 to-transparent" />
                    </div>
                </div>

                {/* Grid overlay */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }} />

                {/* Center device */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 pointer-events-none">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-indigo-800 rounded-2xl flex items-center justify-center shadow-[0_0_60px_rgba(34,211,238,0.3)] border-2 border-white/20">
                        <span className="text-2xl">📱</span>
                    </div>
                    <div className="mt-3 px-4 py-1.5 bg-cyan-950/80 border border-cyan-500/30 rounded-full">
                        <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Your Device</span>
                    </div>
                </div>

                {/* Network bubbles */}
                {NETWORKS.map((net, idx) => {
                    const positions = [
                        { x: '65%', y: '20%' },
                        { x: '15%', y: '25%' },
                        { x: '75%', y: '70%' },
                        { x: '20%', y: '72%' },
                    ];
                    const pos = positions[idx];
                    const isActive = activeNetwork === net.id;
                    const isSelected = activeNetwork === net.id;

                    return (
                        <div key={net.id} className="absolute z-20 cursor-pointer group" style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
                            onClick={() => { setActiveNetwork(net.id); if (net.id === 'sbi_secure') handleClueClick('secure_net_props'); }}>
                            {/* Pulse ring */}
                            <div className={`absolute inset-[-10px] rounded-full border animate-ping ${!net.safe ? 'border-red-500/20' : 'border-cyan-500/10'}`} />
                            {/* Bubble */}
                            <div className={`w-28 h-28 rounded-full flex flex-col items-center justify-center transition-all duration-500 border-2 ${isActive ? (!net.safe ? 'border-red-400 bg-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.3)]' : 'border-cyan-400 bg-cyan-500/20 shadow-[0_0_40px_rgba(34,211,238,0.3)]')
                                : 'border-slate-700 bg-slate-900/50 group-hover:border-slate-500'
                                }`}>
                                <span className="text-2xl mb-1">{net.locked ? '🔒' : '🔓'}</span>
                                {/* Signal bars */}
                                <div className="flex gap-1 items-end h-3">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className={`w-1 rounded-full transition-all ${i < net.signal ? (!net.safe ? 'bg-red-400' : 'bg-cyan-400') : 'bg-slate-700'
                                            }`} style={{ height: `${(i + 1) * 25}%` }} />
                                    ))}
                                </div>
                            </div>
                            {/* Name label */}
                            <div className={`absolute -bottom-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${isActive ? (!net.safe ? 'bg-red-600 border-red-400 text-white' : 'bg-cyan-600 border-cyan-400 text-white')
                                : 'bg-slate-900/80 border-slate-700 text-slate-400 group-hover:text-white'
                                }`}>
                                {net.name}
                            </div>
                        </div>
                    );
                })}

                {/* Network Inspector Panel (right side) */}
                {activeNetwork && (() => {
                    const net = NETWORKS.find(n => n.id === activeNetwork);
                    return (
                        <div className="absolute top-6 bottom-6 right-6 w-[360px] bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 z-30 flex flex-col animate-in slide-in-from-right duration-500 shadow-2xl overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-white font-black text-lg">Network Details</h3>
                                <button onClick={() => setActiveNetwork(null)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 text-sm">✕</button>
                            </div>

                            <div className="space-y-4 flex-1">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">SSID</span>
                                    <span className="text-white font-black text-lg">{net.name}</span>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Security</span>
                                    <span className={`font-black text-sm ${net.safe ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {net.safe ? '🛡️' : '⚠️'} {net.security}
                                    </span>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">MAC Address</span>
                                    <span className={`font-mono text-xs ${!net.safe ? 'text-red-400' : 'text-slate-300'}`}>{net.mac}</span>
                                </div>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block mb-1">Origin</span>
                                    <span className={`text-sm font-bold ${!net.safe ? 'text-red-400' : 'text-slate-300'}`}>{net.created}</span>
                                </div>

                                {!net.safe && (
                                    <div className="bg-red-500/10 border-2 border-red-500/30 p-4 rounded-xl animate-pulse">
                                        <p className="text-red-300 text-sm font-bold leading-relaxed">⚠️ {net.desc}</p>
                                    </div>
                                )}
                                {net.safe && net.id === 'brew_connect' && (
                                    <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl">
                                        <p className="text-emerald-300 text-sm font-bold leading-relaxed">✓ {net.desc}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 space-y-3">
                                {net.id === 'sbi_secure' && (
                                    <button onClick={() => handleFinalChoice('sbi_secure')} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-black text-sm transition-all border border-white/10">
                                        Connect to {net.name}
                                    </button>
                                )}
                                {net.id === 'brew_connect' && (
                                    <button onClick={() => handleFinalChoice('safe')} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-xl font-black text-sm transition-all border border-white/10">
                                        Connect to {net.name}
                                    </button>
                                )}
                                {(net.id === 'android_hotspot' || net.id === 'bsnl_fiber') && (
                                    <div className="text-center text-slate-500 text-xs font-bold py-4">Signal too weak to connect</div>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* Use Mobile Data button */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-30">
                    <button onClick={() => setGameState('cafe_pov')} className="bg-slate-800/90 backdrop-blur border border-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-700 transition-all">
                        ← Back to Café
                    </button>
                    <button onClick={() => handleFinalChoice('safe')} className="bg-slate-800/90 backdrop-blur border border-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-700 transition-all">
                        📶 Use Mobile Data Instead
                    </button>
                    <button onClick={() => setShowCluesSidebar(!showCluesSidebar)} className="bg-slate-800/90 backdrop-blur border border-white/10 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-slate-700 transition-all">
                        🔍 Evidence ({cluesFound.length})
                    </button>
                </div>

                {/* Top info */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur border border-white/10 px-6 py-3 rounded-xl z-30">
                    <p className="text-white/80 text-xs font-bold text-center">📡 Click a network bubble to inspect it. Choose wisely before connecting.</p>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════
    // OUTCOME
    // ═══════════════════════════════════════
    if (gameState === 'outcome') {
        const totalPoints = cluesFound.reduce((sum, id) => sum + (CLUE_DATA.find(c => c.id === id)?.points || 0), 0);

        if (outcomeType === 'victory') {
            return (
                <div className="w-full h-full bg-[#040810] flex items-center justify-center p-8 overflow-y-auto">
                    <div className="max-w-3xl w-full text-center animate-in zoom-in-95 duration-500">
                        <div className="w-28 h-28 bg-emerald-500 rounded-3xl flex items-center justify-center text-6xl mx-auto mb-8 shadow-[0_0_80px_rgba(16,185,129,0.4)] animate-bounce">🛡️</div>
                        <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-4">THREAT NEUTRALIZED</h1>
                        <p className="text-slate-400 text-lg italic mb-10 max-w-xl mx-auto leading-relaxed">
                            You refused the honeypot trap, used safe mobile data, and alerted the café staff. The hacker packed up and left. Six other customers were saved.
                        </p>

                        <div className="grid grid-cols-3 gap-6 mb-10">
                            <div className="bg-slate-900 border border-emerald-500/30 p-6 rounded-2xl">
                                <span className="text-emerald-400 text-3xl font-black">+{totalPoints}</span>
                                <p className="text-slate-500 text-xs font-bold mt-2 uppercase tracking-wider">Detective Points</p>
                            </div>
                            <div className="bg-slate-900 border border-indigo-500/30 p-6 rounded-2xl">
                                <span className="text-indigo-400 text-lg font-black">Community Guardian</span>
                                <p className="text-slate-500 text-xs font-bold mt-2 uppercase tracking-wider">Badge Unlocked</p>
                            </div>
                            <div className="bg-slate-900 border border-cyan-500/30 p-6 rounded-2xl">
                                <span className="text-cyan-400 text-lg font-black">₹0 Lost</span>
                                <p className="text-slate-500 text-xs font-bold mt-2 uppercase tracking-wider">Assets Protected</p>
                            </div>
                        </div>

                        <div className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-2xl mb-8 text-left">
                            <h3 className="text-emerald-400 font-black text-sm uppercase tracking-wider mb-3">🔐 Cyber Tip — Level 7</h3>
                            <ul className="text-slate-300 text-sm space-y-2 leading-relaxed">
                                <li>• <strong>NEVER</strong> do banking on public/open Wi-Fi</li>
                                <li>• A <strong>Honeypot</strong> is a fake Wi-Fi that looks legitimate</li>
                                <li>• <strong>Mobile data (4G/5G)</strong> is always safest for banking</li>
                                <li>• If you must use public Wi-Fi, enable a <strong>trusted VPN</strong></li>
                                <li>• <strong>MITM attacks</strong> are silent — the victim never knows</li>
                            </ul>
                        </div>

                        <button onClick={() => completeLevel(true, totalPoints, 0)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-12 py-5 rounded-2xl text-xl transition-all shadow-xl active:scale-95 uppercase tracking-wider">
                            Complete Mission →
                        </button>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="w-full h-full bg-black flex items-center justify-center p-8 overflow-y-auto">
                    <div className="max-w-3xl w-full text-center animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-[0_0_80px_rgba(220,38,38,0.5)] animate-bounce">!</div>
                        <h1 className="text-5xl font-black text-white uppercase tracking-tighter mb-4">CREDENTIALS COMPROMISED</h1>
                        <p className="text-slate-400 text-lg italic mb-8 max-w-xl mx-auto leading-relaxed">
                            By connecting to <span className="text-red-400 font-bold">SBI_SecureNet</span>, your banking credentials were captured by the hacker's MITM attack. ₹1,20,000 was transferred to a mule account.
                        </p>

                        <div className="space-y-3 mb-8 font-mono text-left max-w-md mx-auto">
                            {[
                                { t: '11:46 AM', msg: 'Connected to SBI_SecureNet', status: 'CONNECTED', color: 'text-slate-500' },
                                { t: '11:47 AM', msg: 'YONO login credentials captured', status: 'INTERCEPTED', color: 'text-red-500' },
                                { t: '11:48 AM', msg: 'Session token cloned', status: 'HIJACKED', color: 'text-red-500' },
                                { t: '11:49 AM', msg: 'UPI transfer: ₹1,20,000', status: 'DEBIT', color: 'text-red-500' },
                                { t: '11:50 AM', msg: 'User called 1930 Helpline', status: 'REPORTED', color: 'text-amber-500' },
                                { t: '11:51 AM', msg: 'Bank account freeze requested', status: 'BLOCKED', color: 'text-cyan-400' },
                            ].map((log, i) => (
                                <div key={i} className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center animate-in fade-in duration-500" style={{ animationDelay: `${i * 150}ms` }}>
                                    <div>
                                        <span className="text-white/20 text-[10px] block">{log.t}</span>
                                        <span className={`text-sm font-black ${log.color}`}>{log.msg}</span>
                                    </div>
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${log.color === 'text-red-500' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                        log.color === 'text-amber-500' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                            log.color === 'text-cyan-400' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' :
                                                'bg-white/5 border-white/10 text-white/40'
                                        }`}>{log.status}</span>
                                </div>
                            ))}
                        </div>

                        <div className="bg-red-600/10 border-2 border-red-600/30 p-6 rounded-2xl mb-8">
                            <h2 className="text-red-500 text-lg font-black uppercase tracking-wider mb-2">Total Lost to Hacker</h2>
                            <span className="text-4xl font-black text-white font-mono">-₹1,20,000</span>
                        </div>

                        <div className="flex gap-4 justify-center">
                            <button onClick={() => { adjustAssets(-120000); adjustLives(-1); setGameState('cafe_topdown'); setCluesFound([]); setActiveNetwork(null); setOutcomeType(null); }}
                                className="bg-slate-800 hover:bg-slate-700 text-white font-black px-8 py-4 rounded-xl text-sm transition-all border border-white/10">
                                Try Again
                            </button>
                            <button onClick={() => { adjustAssets(-120000); adjustLives(-1); completeLevel(false, 0, 0); }}
                                className="bg-red-600 hover:bg-red-500 text-white font-black px-8 py-4 rounded-xl text-sm transition-all">
                                Accept Loss & Continue
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
    }

    if (gameState === 'cinematic_outro') {
        return (
            <div className="absolute inset-0 z-[2000] overflow-hidden bg-black">
                <div className="w-full h-full bg-stone-950 flex flex-col items-center justify-center animate-fadeIn relative overflow-hidden">
                    {/* Scanning line effects */}
                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(0,255,255,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%]" />
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-cyan-500/5 to-transparent animate-scanLine pointer-events-none" />

                    <div className="relative group text-center">
                        <div className="absolute -inset-10 bg-white/5 blur-3xl rounded-full" />
                        <h2 className="text-white text-6xl font-black tracking-[0.5em] uppercase mb-12 relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            Level 7: The Public Network
                            {outroStep === 3 && (
                                <div className="absolute top-1/2 left-[-10%] w-[120%] h-3 bg-red-600/90 -translate-y-1/2 animate-strikeThrough shadow-[0_0_25px_rgba(220,38,38,1)] z-20 skew-y-[-1deg]" />
                            )}
                        </h2>

                        {outroStep === 3 && (
                            <div className="mt-12 text-8xl font-black italic tracking-[0.2em] uppercase animate-surge relative text-cyan-400">
                                <span className="relative z-10">COMPLETED</span>
                                {/* Chromatic aberration for text */}
                                <span className="absolute inset-0 opacity-40 translate-x-1 animate-aberration text-emerald-400">COMPLETED</span>
                                <span className="absolute inset-0 opacity-40 -translate-x-1 animate-aberration-alt text-blue-400">COMPLETED</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-20 flex flex-col items-center gap-4">
                        <div className="h-px w-80 bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
                        <div className="text-[11px] font-mono text-zinc-500 tracking-[0.8em] uppercase opacity-60 animate-pulse">
                            Digital Forensics Session // STATUS_CLEARED
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};

export default Level7;
