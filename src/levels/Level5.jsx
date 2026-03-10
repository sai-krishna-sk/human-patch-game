import React, { useState, useEffect, useMemo } from 'react';
import Player from '../components/Player';
import { useGameState } from '../context/GameStateContext';

const ROOM_WIDTH = 1600;
const ROOM_HEIGHT = 1100;
const LIVING_ROOM_WIDTH = 1600;
const LIVING_ROOM_HEIGHT = 1100;
const VIEWPORT_WIDTH = 1200;
const VIEWPORT_HEIGHT = 800;
const SPEED = 12;
const PLAYER_SIZE = 40;
const SELVI_ZONE = { x: 800, y: 250, w: 300, h: 300 }; // Raised center-left stall area

// Interactive Area Constants (Relative to Room) - From Level 2
const DESK_PARTS = [
    { x: 600, y: 400, w: 400, h: 140 }, // Top
    { x: 600, y: 540, w: 140, h: 210 }  // Left Return
];
const LAPTOP_AREA = { x: 740, y: 420, w: 140, h: 100 };
const TABLE_LEFT_AREA = { x: 610, y: 560, w: 90, h: 120 }; // Left side of table (return)
const TABLE_PHOTO_AREA = { x: 935, y: 465, w: 60, h: 60 }; // Behind Grandpa frame on table (moved right)
const BOOK_AREA = { x: 40, y: 60, w: 160, h: 380 }; // Left Bookshelf (Higher up)
const BOOK_RIGHT_AREA = { x: 1400, y: 60, w: 160, h: 380 }; // Right Bookshelf (Higher up)
const PLANT_AREA = { x: 50, y: 850, w: 200, h: 200 }; // Left Flower Pot (At the bottom)
const PLANT_RIGHT_AREA = { x: 1350, y: 850, w: 200, h: 200 }; // Right Flower Pot (At the bottom)

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

const Level5 = () => {
    const { completeLevel, adjustAssets, adjustLives } = useGameState();
    const [playerPos, setPlayerPos] = useState({ x: 200, y: 600 });
    const [keys, setKeys] = useState({});
    const [gameState, setGameState] = useState('waking_up');
    const [isTransitioning, setIsTransitioning] = useState(true);
    const [bedroomPlayerPos, setBedroomPlayerPos] = useState({ x: 800, y: 400 });
    const [bedroomInteractionTarget, setBedroomInteractionTarget] = useState(null);
    const [livingRoomPlayerPos, setLivingRoomPlayerPos] = useState({ x: 800, y: 920 });
    const [livingRoomStep, setLivingRoomStep] = useState(0);
    const [livingRoomInteractionTarget, setLivingRoomInteractionTarget] = useState(null);
    const [hasTriggeredHunger, setHasTriggeredHunger] = useState(false);
    const [canInteract, setCanInteract] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState(null);
    const [cluesFound, setCluesFound] = useState([]);
    const [pinInput, setPinInput] = useState('');
    const [stickerPeeled, setStickerPeeled] = useState(false);
    const [inspectedZones, setInspectedZones] = useState([]);
    const [scamReported, setScamReported] = useState(false);
    const [complaintSubmitted, setComplaintSubmitted] = useState(false);
    const [peelProgress, setPeelProgress] = useState(0);
    const [isDraggingPeel, setIsDraggingPeel] = useState(false);
    const [evidence, setEvidence] = useState([]);
    const [isBinderOpen, setIsBinderOpen] = useState(false);

    // Garden state
    const [gardenPlayerPos, setGardenPlayerPos] = useState({ x: 600, y: 150 });
    const [isNearCar, setIsNearCar] = useState(false);
    const [gardenFadeOut, setGardenFadeOut] = useState(false);
    const [isGardenReturnCar, setIsGardenReturnCar] = useState(false);

    // Room walk state (post-payment room scene) - Using Level 2 constants
    const [roomPlayerPos, setRoomPlayerPos] = useState({ x: 800, y: 950 });
    const [canInteractLaptop, setCanInteractLaptop] = useState(false);
    const [interactionTarget, setInteractionTarget] = useState(null);

    // Mini-game state
    const [safeBucket, setSafeBucket] = useState([]);
    const [scamBucket, setScamBucket] = useState([]);
    const [draggedQR, setDraggedQR] = useState(null);
    const [miniGameOver, setMiniGameOver] = useState(false);

    // Stable QR pattern for the FAKE sticker
    const qrPattern = useMemo(() => {
        return Array.from({ length: 12 }, () =>
            Array.from({ length: 12 }, () => Math.random() > 0.4)
        );
    }, []);

    // Different QR pattern for Selvi's ORIGINAL real QR underneath
    const originalQrPattern = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) =>
            Array.from({ length: 12 }, (_, j) => ((i * 7 + j * 13 + 3) % 5) > 1)
        );
    }, []);

    const triggerTransition = (newState, newBedroomPos = null, newLivingPos = null) => {
        setIsTransitioning(true);
        setTimeout(() => {
            if (newState) setGameState(newState);
            if (newBedroomPos) setBedroomPlayerPos(newBedroomPos);
            if (newLivingPos) setLivingRoomPlayerPos(newLivingPos);
            setTimeout(() => {
                setIsTransitioning(false);
            }, 200);
        }, 500);
    };

    useEffect(() => {
        const timer = setTimeout(() => setIsTransitioning(false), 500);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (gameState === 'living_room' && !hasTriggeredHunger) {
            const timer = setTimeout(() => {
                setHasTriggeredHunger(true);
                setLivingRoomStep(1);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [gameState, hasTriggeredHunger]);

    useEffect(() => {
        if (gameState === 'living_room') {
            if (livingRoomStep === 1) {
                const timer = setTimeout(() => setLivingRoomStep(2), 2500);
                return () => clearTimeout(timer);
            } else if (livingRoomStep === 2) {
                const timer = setTimeout(() => setLivingRoomStep(3), 2500);
                return () => clearTimeout(timer);
            }
        }
    }, [gameState, livingRoomStep]);

    // Handle Title Card transition for Level 5
    useEffect(() => {
        if (gameState === 'title_card') {
            // Play cinematic surge sound
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                if (ctx.state === 'suspended') ctx.resume();

                const masterGain = ctx.createGain();
                masterGain.connect(ctx.destination);
                masterGain.gain.setValueAtTime(0, ctx.currentTime);
                masterGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
                masterGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);

                const osc1 = ctx.createOscillator();
                osc1.type = 'sawtooth';
                osc1.frequency.setValueAtTime(50, ctx.currentTime);
                osc1.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 2);
                osc1.connect(masterGain);

                const osc2 = ctx.createOscillator();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(40, ctx.currentTime);
                osc2.frequency.exponentialRampToValueAtTime(10, ctx.currentTime + 3);
                osc2.connect(masterGain);

                osc1.start(); osc2.start();
                osc1.stop(ctx.currentTime + 3);
                osc2.stop(ctx.currentTime + 3);
            } catch (err) { console.error("Audio error", err); }

            const timer = setTimeout(() => {
                setGardenPlayerPos({ x: 800, y: 100 });
                triggerTransition('garden');
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [gameState]);

    useEffect(() => {
        const dk = (e) => setKeys(k => ({ ...k, [e.key.toLowerCase()]: true }));
        const uk = (e) => setKeys(k => ({ ...k, [e.key.toLowerCase()]: false }));
        window.addEventListener('keydown', dk);
        window.addEventListener('keyup', uk);
        return () => { window.removeEventListener('keydown', dk); window.removeEventListener('keyup', uk); };
    }, []);

    // E key logic
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key.toLowerCase() === 'e') {
                if (gameState === 'waking_up') {
                    triggerTransition('bedroom', { x: 800, y: 400 });
                } else if (gameState === 'bedroom' && bedroomInteractionTarget === 'bathroom') {
                    triggerTransition('bedroom_freshened');
                } else if (gameState === 'bedroom_freshened' && bedroomInteractionTarget === 'living_room_door') {
                    triggerTransition('living_room', null, { x: 800, y: 920 });
                } else if (gameState === 'living_room' && (livingRoomStep === 1 || livingRoomStep === 2)) {
                    setLivingRoomStep(3);
                } else if (gameState === 'living_room' && livingRoomInteractionTarget === 'main_door' && livingRoomStep === 3) {
                    triggerTransition('title_card');
                } else if (gameState === 'garden' && isNearCar) {
                    triggerTransition('travel');
                } else if (canInteract && gameState === 'market_walk') {
                    setGameState('dialogue');
                } else if (canInteractLaptop && gameState === 'room_walk') {
                    setGameState('incident_report');
                }
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [canInteract, gameState, bedroomInteractionTarget, livingRoomInteractionTarget, livingRoomStep, canInteractLaptop, isNearCar]);

    // Room walk movement loop
    useEffect(() => {
        if (gameState !== 'room_walk') return;
        let frameId;
        const loop = () => {
            setRoomPlayerPos(p => {
                let nx = p.x, ny = p.y;
                if (keys['w'] || keys['arrowup']) ny -= SPEED;
                if (keys['s'] || keys['arrowdown']) ny += SPEED;
                if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                if (keys['d'] || keys['arrowright']) nx += SPEED;
                nx = Math.max(0, Math.min(nx, ROOM_WIDTH - PLAYER_SIZE));
                ny = Math.max(0, Math.min(ny, ROOM_HEIGHT - PLAYER_SIZE));

                // Obstacle check: DESK (L-Shape) - Using Level 2 constants
                DESK_PARTS.forEach(part => {
                    if (checkCollision(nx, ny, part)) {
                        if (p.x + PLAYER_SIZE <= part.x || p.x >= part.x + part.w) nx = p.x;
                        if (p.y + PLAYER_SIZE <= part.y || p.y >= part.y + part.h) ny = p.y;
                    }
                });

                // Interaction detection - Level 2 style
                const testArea = (area) => checkCollision(nx, ny, area);
                let target = null;
                if (testArea(LAPTOP_AREA)) target = 'laptop';
                else if (testArea(TABLE_LEFT_AREA)) target = 'rule_symbols';
                else if (testArea(TABLE_PHOTO_AREA)) target = 'rule_pii';
                else if (testArea(BOOK_AREA)) target = 'rule_length';
                else if (testArea(BOOK_RIGHT_AREA)) target = 'empty_book';
                else if (testArea(PLANT_AREA)) target = 'rule_patterns';
                else if (testArea(PLANT_RIGHT_AREA)) target = 'empty_plant';

                setInteractionTarget(target);

                const interactArea = { x: LAPTOP_AREA.x - 40, y: LAPTOP_AREA.y - 40, w: LAPTOP_AREA.w + 80, h: LAPTOP_AREA.h + 80 };
                setCanInteractLaptop(checkCollision(nx, ny, interactArea));
                return { x: nx, y: ny };
            });
            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [keys, gameState]);

    // E key to pick laptop (room)
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key.toLowerCase() === 'e' && canInteractLaptop && gameState === 'room_walk') {
                setGameState('incident_report');
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [canInteractLaptop, gameState]);

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

    // Garden movement loop
    useEffect(() => {
        if (gameState !== 'garden') return;
        let frameId;
        const loop = () => {
            const currentRoomWidth = Math.max(ROOM_WIDTH, window.innerWidth);
            setGardenPlayerPos(p => {
                let nx = p.x, ny = p.y;
                if (keys['w'] || keys['arrowup']) ny -= SPEED;
                if (keys['s'] || keys['arrowdown']) ny += SPEED;
                if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                if (keys['d'] || keys['arrowright']) nx += SPEED;
                nx = Math.max(0, Math.min(nx, currentRoomWidth - PLAYER_SIZE));
                ny = Math.max(50, Math.min(ny, ROOM_HEIGHT - PLAYER_SIZE)); // Allow reaching top door area

                return { x: nx, y: ny };
            });
            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [keys, gameState]);

    // Garden car proximity check
    useEffect(() => {
        if (gameState !== 'garden') return;
        const currentRoomWidth = Math.max(ROOM_WIDTH, window.innerWidth);
        const carZone = { x: currentRoomWidth / 2 - 140, y: ROOM_HEIGHT / 2 - 140, w: 280, h: 280 };
        setIsNearCar(checkCollision(gardenPlayerPos.x, gardenPlayerPos.y, carZone));
    }, [gardenPlayerPos, gameState]);

    // Travel to Market transition
    useEffect(() => {
        if (gameState === 'travel') {
            const timer = setTimeout(() => triggerTransition('market_walk'), 2000);
            return () => clearTimeout(timer);
        }
    }, [gameState]);

    // Bedroom movement loop
    useEffect(() => {
        if (gameState !== 'bedroom' && gameState !== 'bedroom_freshened') return;
        let frameId;
        const loop = () => {
            setBedroomPlayerPos(p => {
                let nx = p.x, ny = p.y;
                if (keys['w'] || keys['arrowup']) ny -= SPEED;
                if (keys['s'] || keys['arrowdown']) ny += SPEED;
                if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                if (keys['d'] || keys['arrowright']) nx += SPEED;
                // Limit movement to bedroom area (avoid black surrounding areas only)
                nx = Math.max(250, Math.min(nx, 1300)); // Left and right black areas
                ny = Math.max(300, Math.min(ny, 650)); // Stop at door level, prevent going below door

                let target = null;
                if (nx < 350) target = 'bathroom'; // Bathroom activation at left side (around x: 250)
                if (gameState === 'bedroom_freshened' && ny > 600 && nx > 550 && nx < 950) target = 'living_room_door'; // Door activation at bottom center (around y: 650)
                setBedroomInteractionTarget(target);

                return { x: nx, y: ny };
            });
            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [keys, gameState]);

    // Living room movement loop
    useEffect(() => {
        if (gameState !== 'living_room' || livingRoomStep === 1 || livingRoomStep === 2) return; // Freeze movement during dim dialog
        let frameId;
        const loop = () => {
            setLivingRoomPlayerPos(p => {
                let nx = p.x, ny = p.y;
                if (keys['w'] || keys['arrowup']) ny -= SPEED;
                if (keys['s'] || keys['arrowdown']) ny += SPEED;
                if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                if (keys['d'] || keys['arrowright']) nx += SPEED;

                // Boundaries for CSS Room
                nx = Math.max(120, Math.min(nx, LIVING_ROOM_WIDTH - 120));
                ny = Math.max(120, Math.min(ny, LIVING_ROOM_HEIGHT - 120));

                let target = null;
                if (Math.abs(nx - 800) < 120 && ny < 150) target = 'main_door';
                setLivingRoomInteractionTarget(target);

                return { x: nx, y: ny };
            });
            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [keys, gameState, livingRoomStep]);

    // Check interaction zone outside of state updater
    useEffect(() => {
        const near = checkCollision(playerPos.x, playerPos.y, {
            x: SELVI_ZONE.x - 80, y: SELVI_ZONE.y - 80,
            w: SELVI_ZONE.w + 160, h: SELVI_ZONE.h + 160
        });
        setCanInteract(near);
    }, [playerPos]);

    // -----------------------------------------------------------
    // RETURN SEQUENCE LOGIC
    // -----------------------------------------------------------

    // Market Return Loop
    useEffect(() => {
        if (gameState !== 'market_return') return;
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
                return { x: nx, y: ny };
            });
            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [keys, gameState]);

    // Market Return Interaction
    useEffect(() => {
        const handleKey = (e) => {
            if (gameState === 'market_return' && e.key.toLowerCase() === 'e' && playerPos.x < 150) {
                triggerTransition('travel_return');
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [gameState, playerPos]);

    // Travel Return Logic
    useEffect(() => {
        if (gameState === 'travel_return') {
            const timer = setTimeout(() => {
                setIsGardenReturnCar(true);
                const currentRoomWidth = Math.max(ROOM_WIDTH, window.innerWidth);
                setGardenPlayerPos({ x: currentRoomWidth / 2 - 140, y: ROOM_HEIGHT / 2 - 140 });
                triggerTransition('garden_return');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [gameState]);

    // Garden Return Loop
    useEffect(() => {
        if (gameState !== 'garden_return' || isGardenReturnCar) return;
        let frameId;
        const loop = () => {
            const currentRoomWidth = Math.max(ROOM_WIDTH, window.innerWidth);
            setGardenPlayerPos(p => {
                let nx = p.x, ny = p.y;
                if (keys['w'] || keys['arrowup']) ny -= SPEED;
                if (keys['s'] || keys['arrowdown']) ny += SPEED;
                if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                if (keys['d'] || keys['arrowright']) nx += SPEED;
                nx = Math.max(0, Math.min(nx, currentRoomWidth - PLAYER_SIZE));
                ny = Math.max(50, Math.min(ny, ROOM_HEIGHT - PLAYER_SIZE));
                return { x: nx, y: ny };
            });
            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [keys, gameState, isGardenReturnCar]);

    // Garden Return Interaction
    useEffect(() => {
        const handleKey = (e) => {
            if (gameState === 'garden_return' && e.key.toLowerCase() === 'e') {
                if (isGardenReturnCar) {
                    setIsGardenReturnCar(false);
                    const currentRoomWidth = Math.max(ROOM_WIDTH, window.innerWidth);
                    setGardenPlayerPos({ x: currentRoomWidth / 2 - 200, y: ROOM_HEIGHT / 2 });
                } else if (gardenPlayerPos.y < 150) {
                    triggerTransition('living_room_return', null, { x: 800, y: 150 });
                }
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [gameState, isGardenReturnCar, gardenPlayerPos]);

    // Living Room Return Loop
    useEffect(() => {
        if (gameState !== 'living_room_return') return;
        let frameId;
        const loop = () => {
            setLivingRoomPlayerPos(p => {
                let nx = p.x, ny = p.y;
                if (keys['w'] || keys['arrowup']) ny -= SPEED;
                if (keys['s'] || keys['arrowdown']) ny += SPEED;
                if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                if (keys['d'] || keys['arrowright']) nx += SPEED;
                nx = Math.max(120, Math.min(nx, LIVING_ROOM_WIDTH - 120));
                ny = Math.max(120, Math.min(ny, LIVING_ROOM_HEIGHT - 120));
                return { x: nx, y: ny };
            });
            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [keys, gameState]);

    // Living Room Return Interaction
    useEffect(() => {
        const handleKey = (e) => {
            if (gameState === 'living_room_return' && e.key.toLowerCase() === 'e') {
                if (livingRoomPlayerPos.x > 1400) {
                    setRoomPlayerPos({ x: 800, y: 950 });
                    setGameState('room_walk');
                }
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [gameState, livingRoomPlayerPos]);

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
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[500] bg-slate-900/95 backdrop-blur-xl text-white font-bold px-8 py-4 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(6,182,212,0.2)] animate-bounce text-lg border border-cyan-500/30 flex items-center gap-3">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            {feedbackMsg}
        </div>
    ) : null;

    const EvidenceBinder = () => (
        <>
            <div className="fixed top-[220px] right-8 z-[400] group">
                <button className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-500/40 w-16 h-16 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.2)] flex items-center justify-center text-3xl hover:scale-110 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all relative backdrop-blur-sm" onClick={() => setIsBinderOpen(true)}>
                    📁
                    {evidence.length > 0 && !scamReported && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white w-7 h-7 rounded-full border-2 border-slate-900 flex items-center justify-center font-black text-xs shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse">
                            {evidence.length}
                        </div>
                    )}
                </button>
                <span className="absolute right-0 top-full mt-2 bg-black/80 text-cyan-300 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-wider">Evidence Folder</span>
            </div>

            {isBinderOpen && (
                <div className="fixed inset-0 z-[500] flex items-start justify-end p-8 pointer-events-none animate-in fade-in duration-300">
                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm pointer-events-auto" onClick={() => setIsBinderOpen(false)}></div>

                    <div className="w-full max-w-sm relative pointer-events-auto mt-12 mr-2 z-10">
                        {/* Main Panel */}
                        <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.6)] border border-cyan-500/20 overflow-hidden">
                            {/* Header */}
                            <div className="bg-gradient-to-r from-cyan-900/50 to-blue-900/50 px-6 py-4 border-b border-cyan-500/20 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                                        <span className="text-lg">🗂️</span>
                                    </div>
                                    <div>
                                        <h2 className="text-white font-black text-sm uppercase tracking-wider">Evidence Folder</h2>
                                        <p className="text-cyan-400/60 text-[10px] font-mono">{evidence.length} ITEM{evidence.length !== 1 ? 'S' : ''} COLLECTED</p>
                                    </div>
                                </div>
                                <button className="w-8 h-8 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-white/60 hover:text-white font-bold transition-all" onClick={() => setIsBinderOpen(false)}>✕</button>
                            </div>

                            {/* Evidence List */}
                            <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar space-y-3">
                                {evidence.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-3xl mb-4 animate-pulse border border-slate-700">📭</div>
                                        <p className="text-slate-400 font-bold text-sm uppercase tracking-wider">No Evidence</p>
                                        <p className="text-slate-500 text-xs mt-1">Investigate the scene to collect evidence</p>
                                    </div>
                                ) : evidence.map((ev, i) => (
                                    <div key={i} draggable onDragStart={(e) => {
                                        e.dataTransfer.setData('text/plain', ev.id);
                                        e.dataTransfer.effectAllowed = 'move';
                                        // Auto-close binder so backdrop doesn't block the drop zone
                                        setTimeout(() => setIsBinderOpen(false), 100);
                                    }} className="bg-slate-800/80 p-4 rounded-xl border border-slate-700/50 hover:border-cyan-500/30 transition-all cursor-grab active:cursor-grabbing group hover:shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-red-500/20 group-hover:border-red-500/40 transition-colors">
                                                {ev.id === 'fake_qr' ? (
                                                    <span className="text-2xl">🏷️</span>
                                                ) : (
                                                    <span className="text-2xl">📄</span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-white text-xs uppercase tracking-wide">{ev.title}</h4>
                                                    <span className="bg-red-500/20 text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Evidence</span>
                                                </div>
                                                <p className="text-slate-400 text-[11px] leading-relaxed break-all">{ev.desc}</p>
                                            </div>
                                        </div>
                                        {/* Drag hint */}
                                        <div className="mt-2 pt-2 border-t border-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-cyan-400/60 text-[9px] font-mono uppercase tracking-wider text-center">↕ Drag to Cybercrime Portal</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );

    // WAKING UP STATE
    // ═══════════════════════════════════════════
    if (gameState === 'waking_up') {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center overflow-hidden relative font-sans">
                <div className={`fixed inset-0 z-[9999] bg-black transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
                <div
                    className="w-full h-full transition-all duration-1000"
                    style={{
                        backgroundImage: `url("/assets/morning_bed.png")`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                />

                {/* Ultra-Minimalist Cinematic Prompt */}
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 animate-pulse">
                    <div className="h-[2px] w-12 bg-white/30 mb-3" />
                    <div className="text-white/80 font-mono text-[11px] uppercase tracking-[0.4em] drop-shadow-md">
                        Press E to get up from bed
                    </div>
                </div>
            </div>
        );
    }

    // BEDROOM STATE
    // ═══════════════════════════════════════════
    if (gameState === 'bedroom' || gameState === 'bedroom_freshened') {
        const currentRoomWidth = Math.max(ROOM_WIDTH, window.innerWidth);
        const cameraX = Math.max(0, Math.min(bedroomPlayerPos.x - window.innerWidth / 2, currentRoomWidth - window.innerWidth));
        return (
            <div className="w-full h-full flex flex-col bg-black overflow-hidden relative font-sans">
                <FeedbackToast />
                <div className={`fixed inset-0 z-[9999] bg-black transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />

                <div className="relative flex-1" style={{ width: currentRoomWidth, transform: `translateX(${-cameraX}px)`, transition: 'transform 0.1s linear' }}>
                    <div className="absolute top-0 left-0 w-full h-full z-0">
                        <img src="/assets/morning_bedplain.png" alt="Bedroom" className="w-full h-full object-[100%_100%]" style={{ objectFit: 'fill' }} />
                    </div>

                    {/* Player Position - Direct Control for Animation */}
                    <Player x={bedroomPlayerPos.x} y={bedroomPlayerPos.y} />

                    {/* Interactive Bathroom (Left) */}
                    {bedroomInteractionTarget === 'bathroom' && gameState === 'bedroom' && (
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 animate-pulse">
                            <div className="h-[2px] w-12 bg-white/30 mb-3" />
                            <div className="text-white/80 font-mono text-[11px] uppercase tracking-[0.4em] drop-shadow-md">
                                Press E to freshen up
                            </div>
                        </div>
                    )}

                    {/* Interactive Living Room Door (Bottom) */}
                    {bedroomInteractionTarget === 'living_room_door' && gameState === 'bedroom_freshened' && (
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 animate-pulse">
                            <div className="h-[2px] w-12 bg-white/30 mb-3" />
                            <div className="text-white/80 font-mono text-[11px] uppercase tracking-[0.4em] drop-shadow-md">
                                Press E to exit room
                            </div>
                        </div>
                    )}
                </div>

                {gameState === 'bedroom_freshened' && (
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 animate-pulse">
                        <div className="bg-black/60 px-6 py-2 rounded-full border border-white/20 text-white/90 font-mono text-[11px] uppercase tracking-[0.2em] drop-shadow-md">
                            Walk to the living room (door at bottom)
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // LIVING ROOM STATE (Exact copy from Level 2)
    // ═══════════════════════════════════════════
    if (gameState === 'living_room') {
        const cameraX = Math.max(0, Math.min(livingRoomPlayerPos.x - VIEWPORT_WIDTH / 2, LIVING_ROOM_WIDTH - VIEWPORT_WIDTH));
        const cameraY = Math.max(0, Math.min(livingRoomPlayerPos.y - VIEWPORT_HEIGHT / 2, LIVING_ROOM_HEIGHT - VIEWPORT_HEIGHT));

        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950 px-8 animate-in fade-in duration-1000 font-sans relative">
                <FeedbackToast />
                <div className={`fixed inset-0 z-[9999] bg-black transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />

                {/* Dialogue Overlay */}
                {(livingRoomStep === 1 || livingRoomStep === 2) && (
                    <div className="fixed inset-0 z-[9000] bg-black/80 flex flex-col justify-end pb-32 items-center animate-in fade-in duration-500">
                        <div className="text-center pointer-events-none">
                            <p className="text-white/95 text-3xl font-serif italic tracking-wider drop-shadow-[0_4px_12px_rgba(0,0,0,1)] px-12 animate-slideUp">
                                {livingRoomStep === 1 ? '"I am hungry but there is no food at home..."' : '"I should go to the market and buy some."'}
                            </p>
                            <div className="mt-6 w-16 h-[2px] bg-white/40 mx-auto animate-drawWidth" />
                        </div>
                    </div>
                )}

                <div
                    className="relative border-8 border-slate-900 shadow-2xl overflow-hidden bg-zinc-900"
                    style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}
                >
                    <div
                        className="absolute inset-0"
                        style={{
                            width: LIVING_ROOM_WIDTH,
                            height: LIVING_ROOM_HEIGHT,
                            transform: `translate(${-cameraX}px, ${-cameraY}px)`,
                            backgroundColor: '#2c3e50',
                            transition: 'transform 0.1s linear'
                        }}
                    >

                        {/* Wood Floor */}
                        <div className="absolute inset-0 opacity-80" style={{
                            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(0,0,0,0.2) 38px, rgba(0,0,0,0.2) 40px)'
                        }}></div>

                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 pointer-events-none z-10"></div>

                        {/* DOORS AND OPENINGS */}
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
                        <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-[60px] h-[180px] bg-[#8a5a44] border-4 border-black border-r-0 p-3 flex flex-col items-center justify-center z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] ${livingRoomInteractionTarget === 'study_room' ? 'scale-105' : ''} transition-all`}>
                            <div className="text-[9px] text-white/60 font-black rotate-90 mb-8 tracking-[0.3em]">STUDY</div>
                            <div className="w-[30px] h-[80px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                            <div className="absolute left-2 bottom-6 w-1 h-6 bg-black"></div>
                        </div>

                        {/* Bottom Single Door (Bedroom entry point) */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[240px] h-[60px] bg-[#8a5a44] border-4 border-black border-b-0 p-3 flex items-center justify-center z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                            <div className="text-[9px] text-white/60 font-black tracking-[0.3em] mr-8">BEDROOM</div>
                            <div className="w-[120px] h-[30px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                            <div className="absolute right-6 top-2 w-6 h-1 bg-black"></div>
                        </div>

                        {/* RUGS FROM LEVEL 2 */}
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

                        {/* FURNITURE FROM LEVEL 2 */}
                        {/* SOFA */}
                        <div className="absolute right-[480px] top-1/2 -translate-y-1/2 w-[140px] h-[320px] bg-[#445265] border-4 border-black flex flex-row items-center justify-start z-20 shadow-[0_20px_60px_rgba(0,0,0,0.8)]">
                            <div className="w-[80px] h-full flex flex-col justify-center items-start pl-2 gap-4">
                                <div className="w-[60px] h-[100px] bg-[#364253] border-2 border-black ml-2 mt-2 shadow-inner"></div>
                                <div className="w-[60px] h-[100px] bg-[#364253] border-2 border-black ml-2 mb-2 shadow-inner"></div>
                            </div>
                            <div className="absolute right-0 top-0 bottom-0 w-[40px] bg-[#4a586e] border-l-[3px] border-black shadow-inner"></div>
                            <div className="absolute top-0 left-0 w-[100px] h-[30px] bg-[#4a586e] border-b-[3px] border-black shadow-inner"></div>
                            <div className="absolute bottom-0 left-0 w-[100px] h-[30px] bg-[#4a586e] border-t-[3px] border-black shadow-inner"></div>
                            {/* Sofa Shadow */}
                            <div className="absolute -bottom-8 left-4 right-4 h-8 bg-black/40 blur-xl rounded-full -z-10"></div>
                        </div>

                        {/* COFFEE TABLE (Interaction Target) */}
                        <div className="absolute left-[740px] top-1/2 -translate-y-1/2 w-[100px] h-[180px] bg-[#383a48]/90 backdrop-blur-md border-4 border-[#222938] z-20 shadow-2xl flex items-center justify-center">
                            <div className="w-[80px] h-[160px] border border-white/10"></div>
                            {/* Shadow */}
                            <div className="absolute top-full left-2 right-2 h-6 bg-black/40 blur-xl rounded-full -z-10"></div>
                        </div>

                        {/* LAMPS FROM LEVEL 2 */}
                        <div className="absolute right-[410px] top-[330px] w-[50px] h-[50px] bg-[#383a48] border-2 border-black flex items-center justify-center z-10 shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                            <div className="w-6 h-6 bg-[#d98536] rounded-full border-2 border-[#ffb969] shadow-[0_0_20px_#ffeb3b,inset_0_0_10px_#fff] animate-pulse"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-yellow-500/10 blur-2xl rounded-full -z-10 animate-pulse"></div>
                        </div>
                        <div className="absolute right-[410px] bottom-[330px] w-[50px] h-[50px] bg-[#383a48] border-2 border-black flex items-center justify-center z-10 shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                            <div className="w-6 h-6 bg-[#d98536] rounded-full border-2 border-[#ffb969] shadow-[0_0_20px_#ffeb3b,inset_0_0_10px_#fff] animate-pulse"></div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-yellow-500/10 blur-2xl rounded-full -z-10 animate-pulse"></div>
                        </div>

                        {/* TV UNIT FROM LEVEL 2 */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[180px] h-[340px] bg-[#222938] border-4 border-l-0 border-black flex items-center z-20 shadow-[20px_0_40px_rgba(0,0,0,0.6)]">
                            <div className="w-[120px] h-[260px] bg-[#1e4868] border-4 border-[#122336] ml-4 relative overflow-hidden shadow-inner">
                                <div className="w-[180px] h-[40px] bg-white/10 -rotate-45 absolute top-4 -left-8"></div>
                                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-blue-500/20 blur-lg animate-pulse"></div>
                                <div className="absolute top-1/2 left-full -translate-y-1/2 w-40 h-56 bg-blue-500/5 blur-2xl rounded-full -z-10 animate-pulse"></div>
                            </div>
                        </div>

                        {/* CORNER PLANTS FROM LEVEL 2 */}
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

                        {/* Player in Living Room - Direct Control for Animation */}
                        <Player x={livingRoomPlayerPos.x} y={livingRoomPlayerPos.y} />

                    </div>
                </div>

                {livingRoomInteractionTarget === 'main_door' && livingRoomStep === 3 && (
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 animate-pulse">
                        <div className="h-[2px] w-12 bg-white/30 mb-3" />
                        <div className="text-white/80 font-mono text-[11px] uppercase tracking-[0.4em] drop-shadow-md">
                            Press E to go to garden
                        </div>
                    </div>
                )}
                {livingRoomStep === 3 && !livingRoomInteractionTarget && (
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 animate-pulse">
                        <div className="bg-black/60 px-6 py-2 rounded-full border border-white/20 text-white/90 font-mono text-[11px] uppercase tracking-[0.2em] drop-shadow-md">
                            Go to the main door (top)
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // GARDEN STATE
    // ═══════════════════════════════════════════
    if (gameState === 'garden') {
        const currentRoomWidth = Math.max(ROOM_WIDTH, window.innerWidth);
        const cameraX = Math.max(0, Math.min(gardenPlayerPos.x - window.innerWidth / 2, currentRoomWidth - window.innerWidth));
        return (
            <div className="w-full h-full flex flex-col bg-slate-900 overflow-hidden relative font-sans">
                <FeedbackToast />
                {/* Fade overlays */}
                <div className={`fixed inset-0 z-[9999] bg-black transition-opacity duration-1000 pointer-events-none ${isTransitioning || gardenFadeOut ? 'opacity-100' : 'opacity-0'}`} />

                <div className="relative flex-1" style={{ width: currentRoomWidth, transform: `translateX(${-cameraX}px)`, transition: 'transform 0.1s linear' }}>

                    {/* The Full Reference Background Image */}
                    <div className="absolute top-0 left-0 w-full h-full z-0">
                        <img src="/assets/garden_day.png" alt="Garden Day" className="w-full h-full object-[100%_100%]" style={{ objectFit: 'fill' }} />
                    </div>

                    {/* Player Position - Direct Control for Animation */}
                    <Player x={gardenPlayerPos.x} y={gardenPlayerPos.y} />

                    {/* Interactive Car Trigger Area */}
                    {isNearCar && !gardenFadeOut && (
                        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 animate-pulse">
                            <div className="h-[2px] w-12 bg-white/30 mb-3" />
                            <div className="text-white/80 font-mono text-[11px] uppercase tracking-[0.4em] drop-shadow-md">
                                Press E to get into car
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // TRAVEL STATE
    // ═══════════════════════════════════════════
    if (gameState === 'travel') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden relative font-sans">
                <div className={`fixed inset-0 z-[9999] bg-black transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
                <div className="absolute inset-0 bg-cover bg-center animate-[pulse_3s_infinite]" style={{ backgroundImage: 'url("/assets/daycar.png")' }} />

                {/* Movement lines overlay effect to simulate traveling */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 100px, rgba(255,255,255,0.1) 100px, rgba(255,255,255,0.1) 105px)', animation: 'scroll-left-daycar 2s linear infinite' }}></div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                        @keyframes scroll-left-daycar {
                            from { transform: translateX(0); }
                            to { transform: translateX(-105px); }
                        }
                    `
                }} />
            </div>
        );
    }

    // MARKET WALK STATE
    // ═══════════════════════════════════════════
    if (gameState === 'market_walk') {
        const currentRoomWidth = Math.max(ROOM_WIDTH, window.innerWidth);
        const cameraX = Math.max(0, Math.min(playerPos.x - window.innerWidth / 2, currentRoomWidth - window.innerWidth));
        return (
            <div className="w-full h-full flex flex-col bg-[#7fc2ed] overflow-hidden relative font-sans">
                <FeedbackToast />
                <EvidenceBinder />
                <div className={`fixed inset-0 z-[9999] bg-black transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />

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
                    {/* The Sound Box */}
                    <div className="absolute z-20 group cursor-pointer" style={{ left: 850, bottom: 350 }}>
                        <div className="absolute -top-12 -left-20 bg-slate-800 text-white font-black text-[10px] px-3 py-2 rounded-xl border border-slate-600 shadow-md z-[60] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            Selvi's Payment Box. Linked to: Selvi_vegetables@bank
                            <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 transform rotate-45 border-b border-r border-slate-600"></div>
                        </div>
                        {/* Sound Box Graphic */}
                        <div className="w-10 h-14 bg-blue-600 rounded-md border-2 border-slate-800 shadow-xl flex flex-col items-center pt-1 hover:scale-110 transition-transform">
                            <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center border border-slate-900 shadow-inner">
                            </div>
                            <div className="mt-auto mb-1 w-full flex justify-end px-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]"></div>
                            </div>
                        </div>
                    </div>

                    {/* (Seafood stall area based on image) */}
                    <div className="absolute w-[400px] h-[300px] right-[100px] bottom-[100px] z-10 group cursor-pointer">
                        <div className="absolute -top-12 left-12 bg-white text-black font-black text-[12px] px-3 py-2 rounded-[20px] border-2 border-slate-700 shadow-md z-50 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            "Fresh catch! Scan QR here!"
                            <div className="absolute bottom-[-6px] left-6 w-3 h-3 bg-white border-b-2 border-r-2 border-slate-700 transform rotate-45"></div>
                        </div>
                    </div>

                    {/* Player in Market - Direct Control for Animation */}
                    <Player x={playerPos.x} y={playerPos.y} />

                    {/* Premium Interaction UI - Triggered when near Selvi */}
                    {canInteract && (
                        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 animate-pulse">
                            <div className="h-[2px] w-12 bg-white/30 mb-3" />
                            <div className="text-white/80 font-mono text-[11px] uppercase tracking-[0.4em] drop-shadow-md">
                                Press E to talk to Selvi
                            </div>
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
                            <button className="bg-amber-500 hover:bg-amber-400 text-black px-16 py-5 rounded-2xl font-black text-2xl shadow-[0_15px_40px_rgba(245,158,11,0.4)] transition-transform hover:scale-105 active:scale-95" onClick={() => setGameState('phone_home')}>
                                OK, SCAN QR 📱
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // PHONE HOME SCREEN (App selection)
    // ═══════════════════════════════════════════
    if (gameState === 'phone_home') {
        const apps = [
            { name: 'WhatsApp', icon: '💬', color: 'bg-green-500' },
            { name: 'Gallery', icon: '🖼️', color: 'bg-purple-500' },
            { name: 'Settings', icon: '⚙️', color: 'bg-slate-500' },
            { name: 'Camera', icon: '📷', color: 'bg-slate-700' },
            { name: 'Messages', icon: '📬', color: 'bg-blue-500' },
            { name: 'Chrome', icon: '🌐', color: 'bg-amber-500' },
            { name: 'Phone', icon: '📞', color: 'bg-green-600' },
            { name: 'Gmail', icon: '✉️', color: 'bg-red-500' },
            { name: 'UPI Pay', icon: '💳', color: 'bg-indigo-500' },
            { name: 'Clock', icon: '⏰', color: 'bg-teal-500' },
            { name: 'Maps', icon: '🗺️', color: 'bg-green-400' },
            { name: 'QR Scanner', icon: '📱', color: 'bg-cyan-500', action: 'qr_scan', highlight: true },
        ];
        return (
            <div className="w-full h-full bg-[#1a1c1e] flex items-center justify-center p-4">
                <FeedbackToast />
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url("${MARKET_BKG}")`, backgroundSize: 'cover' }}></div>

                {/* Phone Container */}
                <div className="w-[360px] h-[700px] bg-black rounded-[3rem] p-3 relative shadow-[0_50px_100px_rgba(0,0,0,0.8)] border-[6px] border-zinc-800">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-black rounded-b-2xl z-50"></div>
                    {/* Home Bar */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/30 rounded-full z-50"></div>

                    {/* Screen */}
                    <div className="w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2.5rem] overflow-hidden flex flex-col relative">
                        {/* Status Bar */}
                        <div className="px-6 pt-10 pb-4 flex justify-between text-white/40 text-xs font-black">
                            <span>8:15 AM</span>
                            <div className="flex gap-2 font-mono"><span>5G</span><span>🔋 88%</span></div>
                        </div>

                        {/* Date & Greeting */}
                        <div className="px-6 pb-6">
                            <p className="text-white/30 text-xs font-mono uppercase tracking-widest">Monday, March 3</p>
                            <h3 className="text-white/80 font-bold text-lg mt-1">Select an app</h3>
                        </div>

                        {/* App Grid */}
                        <div className="flex-1 px-6 pb-6">
                            <div className="grid grid-cols-4 gap-4">
                                {apps.map((app, i) => (
                                    <button key={i}
                                        onClick={() => app.action ? setGameState(app.action) : showFeedback(`📱 ${app.name} is not needed now`)}
                                        className={`flex flex-col items-center gap-1.5 group transition-all ${app.highlight ? 'animate-pulse' : ''}`}>
                                        <div className={`w-14 h-14 ${app.color} rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform ${app.highlight ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 shadow-[0_0_20px_rgba(6,182,212,0.5)]' : ''}`}>
                                            {app.icon}
                                        </div>
                                        <span className={`text-[10px] font-bold ${app.highlight ? 'text-cyan-400' : 'text-white/50'}`}>{app.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Hint at bottom */}
                        <div className="px-6 pb-8 text-center">
                            <p className="text-cyan-400/60 text-[10px] font-mono uppercase tracking-wider animate-bounce">↑ Tap QR Scanner to scan the payment code</p>
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

                {/* iPhone Shape Container — sized to fit viewport */}
                <div className="w-[360px] h-[700px] bg-black rounded-[3rem] p-3 relative shadow-[0_50px_100px_rgba(0,0,0,0.8)] border-[6px] border-zinc-800">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-black rounded-b-2xl z-50"></div>

                    {/* Home Bar */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/30 rounded-full z-50"></div>

                    {/* Phone Screen */}
                    <div className="w-full h-full bg-zinc-900 rounded-[2.5rem] overflow-hidden flex flex-col relative">
                        <div className="flex-1 bg-slate-900 flex flex-col">
                            <div className="px-6 pt-10 pb-2 flex justify-between text-white/40 text-xs font-black">
                                <span>8:15 AM</span>
                                <div className="flex gap-2 font-mono"><span>5G</span><span>🔋 88%</span></div>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center px-8 pb-16">
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
                                <p className="text-white font-black text-center mt-6 uppercase tracking-widest text-sm opacity-60">Focus on the QR code</p>
                            </div>
                            <button className="absolute bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-white/20 border-4 border-white/40 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform" onClick={() => setGameState('scan_result')}>
                                <div className="w-12 h-12 bg-white rounded-full"></div>
                            </button>
                        </div>
                    </div>
                </div>

                <style>{`
                    @keyframes aberration {
                        0%, 100% { transform: translate(0, 0); opacity: 0.6; }
                        25% { transform: translate(-4px, 2px); opacity: 0.8; }
                        50% { transform: translate(4px, -2px); opacity: 0.6; }
                        75% { transform: translate(-2px, -4px); opacity: 0.8; }
                    }
                    @keyframes aberration-alt {
                        0%, 100% { transform: translate(0, 0); opacity: 0.6; }
                        25% { transform: translate(4px, -2px); opacity: 0.8; }
                        50% { transform: translate(-4px, 2px); opacity: 0.6; }
                        75% { transform: translate(2px, 4px); opacity: 0.8; }
                    }
                    @keyframes cinematic-sequence {
                        0% { opacity: 0; }
                        15% { opacity: 1; }
                        85% { opacity: 1; }
                        100% { opacity: 0; }
                    }
                    @keyframes surge {
                        0%, 100% { transform: scale(1); filter: brightness(1); }
                        50% { transform: scale(1.08); filter: brightness(1.3); }
                    }
                    @keyframes width { from { width: 0; opacity: 0; } to { width: 12rem; opacity: 0.8; } }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                    .animate-cinematic-sequence { animation: cinematic-sequence 3.5s forwards; }
                    .animate-width { animation: width 1.5s ease-in-out forwards; }
                    .animate-aberration { animation: aberration 1.5s infinite; }
                    .animate-aberration-alt { animation: aberration-alt 1.5s infinite; }
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
                <div className="w-[320px] h-[640px] relative flex-shrink-0 animate-in slide-in-from-left duration-500">
                    <div className="w-[400px] h-[800px] bg-black rounded-[3.5rem] p-3 relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-[6px] border-zinc-800 origin-top-left scale-[0.8]">
                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-black rounded-b-2xl z-50"></div>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/30 rounded-full z-50"></div>

                        {/* Screen */}
                        <div className="w-full h-full bg-slate-50 rounded-[2.5rem] overflow-hidden flex flex-col relative pt-8">

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

                            {/* Main Interaction Area — scrollable so Decline button is visible */}
                            <div className="flex-1 px-4 py-3 flex flex-col gap-3 relative overflow-y-auto custom-scrollbar">
                                {/* Clue 1: COLLECT REQUEST warning */}
                                <div onClick={() => { if (!cluesFound.includes(1)) { setCluesFound(p => [...p, 1]); showFeedback("🔍 Collect Request Found!") } }}
                                    className="relative group cursor-pointer transition-transform hover:scale-[1.02]">
                                    <div className="bg-red-500 text-white p-3 rounded-2xl shadow-lg border-b-4 border-red-700">
                                        <h5 className="font-black text-[9px] uppercase tracking-widest opacity-80">Alert!</h5>
                                        <p className="text-base font-bold mt-0.5">COLLECT REQUEST</p>
                                        <p className="text-[9px] font-medium opacity-80 mt-0.5 italic">Authorized money will be DEBITED from your account</p>
                                    </div>
                                    {cluesFound.includes(1) && <RedCircle />}
                                </div>

                                <div className="space-y-3">
                                    {/* Clue 4: Unknown UPI ID */}
                                    <div onClick={() => { if (!cluesFound.includes(4)) { setCluesFound(p => [...p, 4]); showFeedback("🔍 Unknown UPI ID!") } }}
                                        className="relative p-3 rounded-xl border-2 bg-white border-slate-100 hover:border-slate-300 cursor-pointer transition-transform hover:scale-[1.02] group">
                                        <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-0.5">Requested From</p>
                                        <p className="text-slate-900 font-mono font-bold text-sm">9944XXXXX@paytm</p>
                                        {cluesFound.includes(4) && <RedCircle />}
                                    </div>

                                    {/* Clue 5: Missing Name / Suspicious Merchant details */}
                                    <div onClick={() => { if (!cluesFound.includes(5)) { setCluesFound(p => [...p, 5]); showFeedback("🔍 Suspicious Merchant!") } }}
                                        className="relative p-3 rounded-xl border-2 bg-white border-slate-100 hover:border-slate-300 cursor-pointer transition-transform hover:scale-[1.02] group">
                                        <p className="text-slate-400 text-[8px] font-black uppercase tracking-widest mb-0.5">Merchant Details</p>
                                        <p className="text-slate-900 font-mono font-bold text-sm">unknown_collector@oksbi</p>
                                        {cluesFound.includes(5) && <RedCircle />}
                                    </div>
                                </div>

                                {/* Clue 3: The ₹1 Trap (Amount) */}
                                <div className="flex flex-col items-center justify-center border-y-2 border-dashed border-slate-200 py-3 relative">
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Amount Request</p>
                                    <div onClick={() => { if (!cluesFound.includes(3)) { setCluesFound(p => [...p, 3]); showFeedback("🔍 The ₹1 Trap Spotted!") } }}
                                        className="relative cursor-pointer transition-transform hover:scale-110 group p-1">
                                        <div className="text-5xl font-black text-slate-900 font-mono">
                                            ₹1.00
                                        </div>
                                        {cluesFound.includes(3) && <RedCircle />}
                                    </div>
                                </div>

                                {/* Safe/Danger Actions (Shown only after clues found) */}
                                {allCluesCollected ? (
                                    <div className="space-y-2 pb-4 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-shrink-0">
                                        <button className="w-full bg-[#1c2128] hover:bg-slate-800 text-white py-3 rounded-2xl font-black transition-all shadow-xl active:scale-95 text-base border border-white/10" onClick={() => setGameState('correct_path')}>
                                            DECLINE PAYMENT
                                        </button>
                                        <button className="w-full bg-[#1c2128] hover:bg-slate-800 text-white py-3 rounded-2xl font-black transition-all shadow-xl active:scale-95 text-base border border-white/10" onClick={() => setGameState('pin_entry')}>
                                            APPROVE & ENTER PIN
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2 pb-4 relative z-10 flex flex-col flex-shrink-0">
                                        <div className="w-full border-2 border-dashed border-slate-400 text-slate-400 py-3 rounded-2xl font-black text-center text-xs animate-pulse bg-slate-100">
                                            COLLECT ALL 4 CLUES TO DECIDE
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
                    setGameState('scam_dialogue');
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
    // SCAM DIALOGUE (Failed Sound Box)
    // ═══════════════════════════════════════════
    if (gameState === 'scam_dialogue') {
        return (
            <div className="w-full h-full flex items-center justify-center p-12 relative overflow-hidden bg-black/90">
                <div className="z-10 w-full max-w-6xl flex gap-12 items-start animate-in slide-in-from-bottom-20 duration-500">
                    <div className="w-[400px] h-[500px] flex-shrink-0 relative flex flex-col items-center justify-start">
                        <img src="/assets/selvi_portrait.png" alt="Selvi" className="w-[80%] h-auto object-contain object-top drop-shadow-2xl" />
                    </div>

                    <div className="flex-1 bg-red-950/40 backdrop-blur-2xl border-4 border-red-500/30 rounded-[3rem] p-12 shadow-[0_0_50px_rgba(220,38,38,0.2)] mb-12 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-amber-500 font-black text-4xl uppercase italic tracking-tighter">Selvi</h2>
                                </div>
                                {/* The Silent Sound Box */}
                                <div className="bg-blue-600 w-32 h-40 rounded-2xl border-4 border-slate-800 shadow-xl flex flex-col items-center p-3 relative overflow-hidden">
                                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mt-2 border-2 border-slate-900 shadow-inner">
                                        <div className="w-12 h-12 bg-slate-700/50 rounded-full flex gap-1 items-center justify-center">
                                            <div className="w-1 h-3 bg-red-500/20 rounded-full"></div>
                                            <div className="w-1 h-5 bg-red-500/20 rounded-full"></div>
                                            <div className="w-1 h-3 bg-red-500/20 rounded-full"></div>
                                        </div>
                                    </div>
                                    <div className="mt-auto w-full flex justify-between items-center px-1">
                                        <span className="text-white text-[8px] font-black uppercase">PAY-BOX</span>
                                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                                    </div>
                                    <div className="absolute inset-0 bg-red-500/10 pointer-events-none"></div>
                                </div>
                            </div>
                            <p className="text-red-200 text-3xl leading-snug font-serif italic">
                                "Thambi, my box didn't speak. Did you really send it? My phone didn't beep either."
                            </p>
                        </div>
                        <div className="flex justify-end gap-6 mt-12">
                            <button className="bg-red-600 hover:bg-red-500 text-white px-10 py-5 rounded-2xl font-black text-xl transition-all shadow-[0_10px_30px_rgba(220,38,38,0.4)]" onClick={() => setGameState('scam_sequence')}>
                                Uh oh...
                            </button>
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
                <EvidenceBinder />
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

                    <div className="flex-1 grid grid-cols-2 gap-12 min-h-0">
                        {/* Action Steps - scrollable */}
                        <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
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
                                            setGameState('peeling_minigame');
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
                                            showFeedback("💸 ₹150 Sent Safely!");
                                            const msg = new SpeechSynthesisUtterance("Received one hundred and fifty rupees!");
                                            window.speechSynthesis.speak(msg);
                                        }}>
                                        MANUALLY PAY IN BHIM APP ✨
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Dialogue/Scene Overlay - scrollable */}
                        <div className="bg-black/40 border-4 border-white/5 rounded-[2.5rem] p-8 relative flex flex-col overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10 w-full">
                                <p className="text-white/30 font-black text-[10px] uppercase tracking-[0.4em] mb-4 border-b border-white/10 pb-2 sticky top-0 bg-black/40 backdrop-blur-sm">Dialogue Log</p>
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
                                        <div className="flex flex-col gap-4 animate-in slide-in-from-left duration-500">
                                            <div className="flex items-center gap-4 bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/20 w-max">
                                                {/* Happy Sound Box */}
                                                <div className="w-8 h-10 bg-blue-600 rounded flex flex-col items-center pt-1 border border-slate-800 drop-shadow-lg">
                                                    <div className="w-4 h-4 bg-slate-800 rounded-full border border-slate-900 flex justify-center items-center">
                                                        <div className="w-2 h-2 bg-emerald-500/30 rounded-full animate-ping"></div>
                                                    </div>
                                                    <div className="mt-auto mb-0.5 w-full flex justify-end px-1">
                                                        <div className="w-1 h-1 rounded-full bg-emerald-500 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-emerald-400 font-mono text-[10px] uppercase tracking-widest mb-1">Sound Box Verification</p>
                                                    <p className="text-emerald-300 font-black text-xs italic">"Received one hundred and fifty rupees!"</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-4 mt-2">
                                                <div className="w-10 h-10 border-2 border-amber-500/50 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-amber-900/30">
                                                    <img src="/assets/selvi_portrait.png" className="w-full h-full object-cover opacity-80" alt="Selvi" />
                                                </div>
                                                <p className="text-amber-500 text-lg font-serif italic font-bold">"Aiyo! Thank you, grandson! I heard the box. The sticker is fake! I will share a photo on the WhatsApp group to warn others!"</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BACK button - always visible at bottom, outside the grid */}
                    {stickerPeeled && (
                        <div className="mt-6 flex-shrink-0 animate-in fade-in slide-in-from-bottom duration-500">
                            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3 mb-3 text-center">
                                <p className="text-emerald-400 font-black text-sm uppercase tracking-widest">🎖️ Cyber Safety Score: +30</p>
                                <p className="text-emerald-200 text-xs mt-1">Go back to your room and report this scam on the Cyber Crime Portal!</p>
                            </div>
                            <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-xl shadow-[0_10px_30px_rgba(16,185,129,0.4)] animate-pulse flex items-center justify-center gap-3 transition-all active:scale-95"
                                onClick={() => { setPlayerPos({ x: 800, y: 600 }); setGameState('market_return'); }}>
                                ⬅ BACK — Go to Room & Report Scam
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // PEELING EDGE MINI GAME (Peel from LEFT)
    // ═══════════════════════════════════════════
    if (gameState === 'peeling_minigame') {
        const handlePointerMove = (e) => {
            if (!isDraggingPeel) return;
            const bound = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - bound.top;
            const x = e.clientX - bound.left;

            // Peel from LEFT: distance from top-left corner
            const maxDist = 350;
            const dist = Math.sqrt(Math.pow(y, 2) + Math.pow(x, 2));
            const progress = Math.min(100, Math.max(0, (dist / maxDist) * 100));
            setPeelProgress(progress);
        };

        const handlePointerUp = () => {
            if (!isDraggingPeel) return;
            setIsDraggingPeel(false);
            if (peelProgress > 80) {
                try {
                    const bgSynth = new window.AudioContext();
                    const o = bgSynth.createOscillator();
                    const g = bgSynth.createGain();
                    o.type = 'sawtooth';
                    o.frequency.exponentialRampToValueAtTime(800, bgSynth.currentTime + 0.5);
                    g.gain.setValueAtTime(0.1, bgSynth.currentTime);
                    g.gain.exponentialRampToValueAtTime(0.01, bgSynth.currentTime + 0.5);
                    o.connect(g);
                    g.connect(bgSynth.destination);
                    o.start();
                    o.stop(bgSynth.currentTime + 0.5);
                } catch (e) { }

                setEvidence(prev => {
                    if (!prev.find(e => e.id === 'fake_qr')) {
                        return [...prev, { id: 'fake_qr', title: 'Fraudulent QR Overlay', desc: 'Scans to: unknown_collector@okSbi. Recovered from: Selvi\'s Vegetable Stall.' }];
                    }
                    return prev;
                });

                showFeedback("📁 Evidence auto-filed to Incident Folder!");
                setIsBinderOpen(true);
                setTimeout(() => setIsBinderOpen(false), 2000);

                setTimeout(() => {
                    setGameState('correct_path');
                    setInspectedZones(prev => [...prev, 20]);
                    setCluesFound(prev => [...new Set([...prev, 2, 6])]);
                    showFeedback("🔍 Fake Sticker Found & Removed!");
                }, 2500);
            } else {
                setPeelProgress(0);
            }
        };

        return (
            <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
                style={{ touchAction: 'none', background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0f 100%)' }}>
                <FeedbackToast />
                <EvidenceBinder />

                {/* Ambient particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="absolute w-1 h-1 bg-cyan-400/30 rounded-full animate-ping"
                            style={{ left: `${15 + i * 15}%`, top: `${20 + i * 10}%`, animationDelay: `${i * 0.5}s`, animationDuration: '3s' }}></div>
                    ))}
                </div>

                {/* QR Board Container — significantly redesigned */}
                <div className="w-[420px] h-[480px] bg-gradient-to-b from-slate-200 to-slate-100 p-5 rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.8),0_0_60px_rgba(59,130,246,0.1)] relative select-none border-2 border-white/50"
                    onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>

                    {/* Board clip at top */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-24 h-8 bg-gradient-to-b from-slate-400 to-slate-500 rounded-t-lg shadow-md border border-slate-600 z-20 flex items-center justify-center">
                        <div className="w-16 h-2 bg-slate-300 rounded-full"></div>
                    </div>

                    {/* The Real Underneath QR — same position as fake, different pattern, black on white */}
                    <div className="absolute inset-5 bg-white rounded-xl flex items-center justify-center relative overflow-hidden" style={{ zIndex: 2 }}>
                        <div className="absolute inset-0 flex flex-col gap-0.5 p-6">
                            {originalQrPattern.map((row, i) => (
                                <div key={i} className="flex gap-0.5 flex-1">
                                    {row.map((filled, j) => (
                                        <div key={j} className={`flex-1 rounded-[1px] ${filled ? 'bg-black' : 'bg-transparent'}`}></div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        {/* Selvi's UPI ID — only shows when peeled enough */}
                        {peelProgress > 50 && (
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-800 px-3 py-1 rounded-full z-20 animate-in fade-in duration-300">
                                <span className="text-white font-mono text-[9px] uppercase tracking-[0.2em] font-bold">selvi.vegetables@oksbi</span>
                            </div>
                        )}
                        {/* "ORIGINAL" label — only shows when peeled enough */}
                        {peelProgress > 50 && (
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-emerald-600 px-4 py-1.5 rounded-full z-20 shadow-md animate-in fade-in duration-300">
                                <span className="text-white font-mono text-[10px] uppercase tracking-[0.3em] font-bold">✓ ORIGINAL QR</span>
                            </div>
                        )}
                    </div>

                    {/* The Fake Peeling Sticker — peels from top-left to bottom-right */}
                    <div className="absolute inset-5 bg-white border-4 border-sky-200 rounded-xl overflow-hidden shadow-[0_8px_25px_rgba(0,0,0,0.4)] flex items-center justify-center pointer-events-none"
                        style={{
                            clipPath: `polygon(${peelProgress}% 0, 100% 0, 100% 100%, 0 100%, 0 ${peelProgress}%)`,
                            transition: isDraggingPeel ? 'none' : 'clip-path 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            zIndex: 5
                        }}>
                        <div className="absolute inset-0 flex flex-col gap-0.5 p-6">
                            {qrPattern.map((row, i) => (
                                <div key={i} className="flex gap-0.5 flex-1">
                                    {row.map((filled, j) => (
                                        <div key={j} className={`flex-1 rounded-[1px] ${filled ? 'bg-black' : 'bg-transparent'}`}></div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        {/* Red "FAKE" watermark on sticker */}
                        {peelProgress > 30 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-red-500/20 font-black text-6xl uppercase rotate-[-25deg] tracking-[0.3em]">FAKE</span>
                            </div>
                        )}
                    </div>

                    {/* The Curl Effect — small fold at top-left corner */}
                    <div className="absolute left-5 top-5 bg-gradient-to-br from-slate-300 via-slate-200 to-white origin-top-left shadow-[4px_4px_12px_rgba(0,0,0,0.3)] cursor-pointer"
                        style={{
                            width: `${Math.min(120, Math.max(40, peelProgress * 1.5))}px`,
                            height: `${Math.min(120, Math.max(40, peelProgress * 1.5))}px`,
                            clipPath: 'polygon(0 0, 100% 0, 0 100%)',
                            transition: isDraggingPeel ? 'none' : 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            opacity: peelProgress > 80 ? 0 : 1,
                            zIndex: 3
                        }}
                        onPointerDown={(e) => {
                            setIsDraggingPeel(true);
                            e.currentTarget.setPointerCapture(e.pointerId);
                            try {
                                const bgSynth = new window.AudioContext();
                                const o = bgSynth.createOscillator();
                                const g = bgSynth.createGain();
                                o.type = 'triangle';
                                o.frequency.value = 100;
                                g.gain.setValueAtTime(0.05, bgSynth.currentTime);
                                o.connect(g);
                                g.connect(bgSynth.destination);
                                o.start();
                                o.stop(bgSynth.currentTime + 0.1);
                            } catch (err) { }
                        }}>
                        <div className="w-full h-full bg-gradient-to-br from-slate-400 to-white"></div>
                    </div>

                    {/* Pulsing arrow hint — points diagonally toward bottom-right */}
                    {peelProgress < 10 && (
                        <div className="absolute left-12 top-12 z-20 animate-bounce pointer-events-none">
                            <div className="bg-cyan-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-[0_0_15px_rgba(6,182,212,0.6)] flex items-center gap-1">
                                ↘ DRAG HERE
                            </div>
                        </div>
                    )}
                </div>

                {/* Title & Progress — BELOW the board so no overlap */}
                <div className="mt-8 text-center z-10">
                    <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 font-black text-3xl uppercase tracking-[0.2em] mb-2">Peel the Sticker</h2>
                    <p className="text-white/40 font-serif italic text-base mb-4">Drag from the curled corner to reveal the real QR underneath...</p>

                    {/* Animated progress bar */}
                    <div className="w-64 mx-auto">
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                            <div className="h-full rounded-full transition-all duration-200"
                                style={{
                                    width: `${peelProgress}%`,
                                    background: peelProgress > 80 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #06b6d4, #3b82f6)'
                                }}></div>
                        </div>
                        <p className="text-white/30 font-mono text-xs mt-2 tracking-[0.3em]">{Math.round(peelProgress)}% PEELED</p>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // ROOM WALK (Study Room - Level 2 Style)
    // ═══════════════════════════════════════════
    if (gameState === 'room_walk') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950 px-8">
                <div
                    className="relative border-8 border-slate-900 shadow-2xl overflow-hidden font-sans"
                    style={{
                        width: VIEWPORT_WIDTH,
                        height: VIEWPORT_HEIGHT
                    }}
                >
                    <div
                        className="absolute inset-0"
                        style={{
                            width: ROOM_WIDTH,
                            height: ROOM_HEIGHT,
                            transform: `translate(${-Math.max(0, Math.min(roomPlayerPos.x - VIEWPORT_WIDTH / 2, ROOM_WIDTH - VIEWPORT_WIDTH))}px, ${-Math.max(0, Math.min(roomPlayerPos.y - VIEWPORT_HEIGHT / 2, ROOM_HEIGHT - VIEWPORT_HEIGHT))}px)`,
                            willChange: 'transform'
                        }}
                    >
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

                            {/* Collision Areas Only - No Visual Elements */}
                            {/* Desk Parts - Collision Only (L-Shape) */}
                            {DESK_PARTS.map((part, index) => (
                                <div
                                    key={index}
                                    className="absolute"
                                    style={{
                                        left: part.x,
                                        top: part.y,
                                        width: part.w,
                                        height: part.h,
                                        // Invisible collision area
                                    }}
                                />
                            ))}

                            <Player x={roomPlayerPos.x} y={roomPlayerPos.y} />
                        </div>
                    </div>

                    {/* Interaction Prompt - Level 5 Style */}
                    {interactionTarget && (
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 animate-pulse">
                            <div className="h-[2px] w-12 bg-white/30 mb-3" />
                            <div className="text-white/80 font-mono text-[11px] uppercase tracking-[0.4em] drop-shadow-md">
                                {(() => {
                                    switch (interactionTarget) {
                                        case 'laptop': return "Press E to open laptop";
                                        case 'rule_symbols': return "Press E to search draws";
                                        case 'rule_pii': return "Press E to check frame";
                                        case 'rule_length':
                                        case 'empty_book': return "Press E to inspect bookshelf";
                                        case 'rule_patterns':
                                        case 'empty_plant': return "Press E to inspect plant";
                                        default: return "Press E to inspect";
                                    }
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Laptop-specific interaction prompt */}
                    {canInteractLaptop && (
                        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 animate-pulse">
                            <div className="h-[2px] w-12 bg-white/30 mb-3" />
                            <div className="text-white/80 font-mono text-[11px] uppercase tracking-[0.4em] drop-shadow-md">
                                Press E to open laptop
                            </div>
                        </div>
                    )}

                    {/* HUD — Enhanced */}
                    <div className="absolute top-4 left-4 z-50 bg-black/70 backdrop-blur-sm p-3 rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                            <span className="text-cyan-300 font-black text-xs uppercase tracking-wider">Objective</span>
                        </div>
                        <p className="text-white/70 font-mono text-xs">Report the QR scam on the Cyber Crime Portal.</p>
                        <p className="text-white/40 font-mono text-[10px] mt-1">Controls: W A S D to move</p>
                    </div>

                    {/* Right sidebar HUD — positioned well below global Assets/Lives/Score/Rank HUD */}
                    <div className="absolute top-[240px] right-4 z-30 bg-black/80 backdrop-blur-sm rounded-xl border border-cyan-500/20 overflow-hidden shadow-lg">
                        {[{ label: 'EVIDENCE', val: evidence.length, color: 'text-cyan-400' }, { label: 'CLUES', val: cluesFound.length, color: 'text-amber-400' }].map((item, i) => (
                            <div key={i} className="px-4 py-2.5 border-b border-slate-700/50 last:border-b-0">
                                <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider block">{item.label}</span>
                                <span className={`${item.color} font-black text-lg`}>{item.val}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // INCIDENT REPORT (Final Exam)
    // ═══════════════════════════════════════════
    if (gameState === 'incident_report') {
        const handleDragOverReport = (e) => e.preventDefault();
        const handleDropReport = (e) => {
            e.preventDefault();
            const droppedId = e.dataTransfer.getData('text/plain');
            if (droppedId === 'fake_qr') {
                try {
                    const bgSynth = new window.AudioContext();
                    const o = bgSynth.createOscillator();
                    o.type = 'sine'; o.frequency.value = 600; o.connect(bgSynth.destination); o.start(); o.stop(bgSynth.currentTime + 0.2);
                } catch (err) { }

                showFeedback("✅ Evidence Accepted! +20 Points");
                setTimeout(() => {
                    completeLevel(true, 50 + (stickerPeeled ? 15 : 0), 0);
                }, 2000);
            } else {
                showFeedback("❌ Incorrect evidence. Try again.");
            }
        };

        return (
            <div className="w-full h-full flex items-center justify-center relative overflow-hidden font-sans">
                {/* Background Room */}
                <div className="absolute inset-0 bg-black">
                    <img src="/assets/home_office.jpeg" className="w-full h-full object-cover opacity-60" alt="Room" />
                </div>

                <EvidenceBinder />
                <FeedbackToast />

                {/* Laptop Screen */}
                <div className="z-10 w-full max-w-5xl bg-slate-100 rounded-t-[2rem] rounded-b-xl p-4 shadow-[0_50px_100px_rgba(0,0,0,0.8)] border-[16px] border-slate-900 flex flex-col mb-[-100px] animate-in slide-in-from-bottom duration-700 h-[80vh]">

                    {/* Browser UI Header */}
                    <div className="bg-slate-300 w-full rounded-t-xl p-3 flex items-center gap-4 mb-2 shadow-sm border-b border-slate-400">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                            <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                        </div>
                        <div className="flex-1 bg-white rounded-md px-4 py-1.5 text-slate-500 font-mono text-sm border border-slate-300 flex items-center gap-2">
                            <span>🔒</span> https://cybercrime.gov.in/report
                        </div>
                    </div>

                    {/* Cybercrime Portal Body */}
                    <div className="flex-1 bg-white rounded-b-xl border border-slate-200 overflow-y-auto flex flex-col">
                        <div className="bg-blue-900 px-8 py-6 text-white border-b-4 border-amber-500 flex justify-between items-center">
                            <div>
                                <h2 className="font-black text-3xl tracking-wide">National Cyber Crime Reporting Portal</h2>
                                <p className="text-blue-200 text-sm mt-1 uppercase tracking-widest">Ministry of Home Affairs, Government of India</p>
                            </div>
                            <div className="text-5xl">🛡️</div>
                        </div>

                        <div className="flex-1 p-8 bg-slate-50 flex flex-col items-center">
                            <h3 className="text-slate-800 font-bold text-2xl mb-2 text-center">Filing a New Complaint</h3>
                            <p className="text-slate-500 mb-6 text-center max-w-2xl">To help us investigate this Financial Fraud (QR Code Tampering), please upload the physical evidence of the tampered overlay sticker.</p>

                            {!scamReported ? (
                                <>
                                    {/* Drop zone - drag evidence from binder */}
                                    <div
                                        className="w-full max-w-xl bg-blue-50/50 border-4 border-dashed border-blue-300 rounded-2xl p-10 text-center transition-all flex flex-col items-center justify-center gap-4 hover:bg-blue-100 hover:border-blue-500 hover:shadow-lg"
                                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-blue-100', 'border-blue-500', 'scale-105'); }}
                                        onDragLeave={(e) => { e.currentTarget.classList.remove('bg-blue-100', 'border-blue-500', 'scale-105'); }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.classList.remove('bg-blue-100', 'border-blue-500', 'scale-105');
                                            const droppedId = e.dataTransfer.getData('text/plain');
                                            if (droppedId === 'fake_qr') {
                                                setScamReported(true);
                                                setIsBinderOpen(false);
                                                try {
                                                    const bgSynth = new window.AudioContext();
                                                    const o = bgSynth.createOscillator();
                                                    o.type = 'sine'; o.frequency.value = 600; o.connect(bgSynth.destination); o.start(); o.stop(bgSynth.currentTime + 0.2);
                                                } catch (err) { }
                                                showFeedback("✅ Evidence Uploaded Successfully!");
                                            } else {
                                                showFeedback("❌ Wrong evidence! Drag the fake QR sticker.");
                                            }
                                        }}
                                    >
                                        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                                            <span className="text-4xl text-blue-500">📥</span>
                                        </div>
                                        <div>
                                            <h4 className="text-blue-900 font-bold text-lg">Drag & Drop Evidence Here</h4>
                                            <p className="text-blue-600/70 text-sm mt-1">Open the 📁 Evidence Folder (top-right) → Drag the QR sticker here</p>
                                        </div>
                                    </div>
                                </>
                            ) : !complaintSubmitted ? (
                                <>
                                    {/* Evidence attached + Complaint form */}
                                    <div className="w-full max-w-2xl">
                                        {/* Evidence confirmation */}
                                        <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-4 flex items-center gap-4 mb-6 animate-in zoom-in duration-300">
                                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                <span className="text-2xl">✅</span>
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-emerald-800 font-bold text-sm">Evidence Attached</h4>
                                                <p className="text-emerald-600 text-xs font-mono break-all">fake_qr_overlay_sticker.png</p>
                                            </div>
                                        </div>

                                        {/* Complaint Form */}
                                        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                                            <h4 className="text-slate-800 font-bold text-lg border-b border-slate-200 pb-2">📝 Complaint Details</h4>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <label className="text-slate-400 font-bold text-xs uppercase tracking-wider">Complaint Type</label>
                                                    <div className="mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-semibold">Financial Fraud - QR Code Tampering</div>
                                                </div>
                                                <div>
                                                    <label className="text-slate-400 font-bold text-xs uppercase tracking-wider">Date of Incident</label>
                                                    <div className="mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-semibold">{new Date().toLocaleDateString('en-IN')}</div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-slate-400 font-bold text-xs uppercase tracking-wider">Victim / Affected Party</label>
                                                <div className="mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-semibold">Selvi Akka (Vegetable Vendor)</div>
                                            </div>

                                            <div>
                                                <label className="text-slate-400 font-bold text-xs uppercase tracking-wider">Shop / Location</label>
                                                <div className="mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-semibold">📍 Selvi's Vegetable Stall, Main Market Road, Local Bazaar</div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <label className="text-slate-400 font-bold text-xs uppercase tracking-wider">Original UPI ID</label>
                                                    <div className="mt-1 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-emerald-700 font-mono font-bold text-xs">selvi.vegetables@oksbi</div>
                                                </div>
                                                <div>
                                                    <label className="text-slate-400 font-bold text-xs uppercase tracking-wider">Fraudulent UPI ID</label>
                                                    <div className="mt-1 bg-red-50 border border-red-200 rounded-lg p-2.5 text-red-700 font-mono font-bold text-xs">9944XXXXX@paytm</div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-slate-400 font-bold text-xs uppercase tracking-wider">Description</label>
                                                <div className="mt-1 bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-700 text-sm leading-relaxed">
                                                    A fraudulent QR code sticker was pasted over Selvi Akka's original payment QR code at her vegetable stall.
                                                    The fake QR redirected payments to UPI ID '9944XXXXX@paytm' instead of her legitimate ID 'selvi.vegetables@oksbi'.
                                                    The tampered sticker was physically peeled off and preserved as evidence.
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-slate-400 font-bold text-xs uppercase tracking-wider">Evidence Uploaded</label>
                                                <div className="mt-1 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-center gap-3">
                                                    <span className="text-xl">🏷️</span>
                                                    <div>
                                                        <p className="text-amber-800 font-bold text-sm">Fraudulent QR Overlay Sticker</p>
                                                        <p className="text-amber-600 text-xs">Recovered from Selvi's Vegetable Stall board</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            className="mt-6 w-full py-4 px-6 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-black text-xl shadow-[0_10px_30px_rgba(30,58,138,0.4)] transition-all active:scale-95 animate-pulse flex items-center justify-center gap-3 mb-8"
                                            onClick={() => setComplaintSubmitted(true)}
                                        >
                                            🛡️ SUBMIT REPORT
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Complaint Submitted Success Screen */}
                                    <div className="w-full max-w-2xl text-center animate-in zoom-in duration-500 py-8">
                                        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-6 shadow-inner">
                                            ✅
                                        </div>
                                        <h3 className="text-emerald-700 font-black text-3xl mb-2">Complaint Submitted Successfully!</h3>
                                        <p className="text-slate-500 text-sm mb-8">Your complaint has been registered with the National Cyber Crime Reporting Portal.</p>

                                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6 text-left space-y-3">
                                            <div className="flex justify-between items-center border-b border-blue-200 pb-3">
                                                <span className="text-blue-400 font-bold text-xs uppercase tracking-wider">Complaint Reference ID</span>
                                                <span className="text-blue-900 font-black text-lg font-mono">NCRP/2024/FIN/{Math.floor(100000 + Math.random() * 900000)}</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                                                <span className="text-slate-400 font-bold text-xs uppercase">Status</span>
                                                <span className="bg-amber-100 text-amber-800 font-bold text-xs px-3 py-1 rounded-full">UNDER INVESTIGATION</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                                                <span className="text-slate-400 font-bold text-xs uppercase">Category</span>
                                                <span className="text-slate-700 font-semibold text-sm">Financial Fraud — QR Code Tampering</span>
                                            </div>
                                            <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                                                <span className="text-slate-400 font-bold text-xs uppercase">Location</span>
                                                <span className="text-slate-700 font-semibold text-sm">Main Market Road, Local Bazaar</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-slate-400 font-bold text-xs uppercase">Evidence</span>
                                                <span className="text-emerald-700 font-semibold text-sm">✅ 1 file attached</span>
                                            </div>
                                        </div>

                                        <p className="text-slate-400 text-xs mb-6 italic">You will receive updates on this complaint via SMS and email. For follow-up, call the Cyber Crime Helpline: 1930</p>

                                        <button
                                            className="w-full py-4 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xl shadow-[0_10px_30px_rgba(16,185,129,0.4)] transition-all active:scale-95 flex items-center justify-center gap-3"
                                            onClick={() => {
                                                showFeedback("🎉 Level 5 Complete! You are a Cyber Guardian!");
                                                setTimeout(() => {
                                                    completeLevel(true, 50 + (stickerPeeled ? 15 : 0), 0);
                                                }, 2000);
                                            }}
                                        >
                                            🌟 FINISH LEVEL 5
                                        </button>
                                    </div>
                                </>
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
            <div className="w-full h-full bg-black flex flex-col items-center justify-start p-8 relative overflow-y-auto custom-scrollbar">
                <div className="absolute inset-0 bg-red-600/5 animate-pulse pointer-events-none"></div>

                <div className="z-10 w-full max-w-4xl bg-[#0a0c10] border-t-8 border-red-600 rounded-[3rem] p-12 shadow-[0_0_150px_rgba(220,38,38,0.4)] animate-in slide-in-from-bottom duration-500 my-8">
                    <div className="flex items-center gap-8 mb-10 pb-8 border-b border-white/5">
                        <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-5xl font-black shrink-0 shadow-[0_0_50px_rgba(220,38,38,0.8)] animate-bounce italic">!</div>
                        <div>
                            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none mb-2 underline decoration-red-600 decoration-4">CRITICAL BREACH</h1>
                            <p className="text-red-500 font-black font-mono text-sm uppercase tracking-[0.3em]">OUTGOING FINANCIAL FLOW DETECTED</p>
                        </div>
                    </div>

                    <div className="space-y-4 font-mono">
                        {[
                            { t: '08:17:23 AM', msg: 'Collect Approved: ₹1.00', status: 'PIN_CONFIRMED', color: 'text-slate-500' },
                            { t: '08:17:25 AM', msg: 'Auto-Processed: ₹1,50,000.00', status: 'DEBIT_SUCCESS', color: 'text-red-500' },
                            { t: '08:17:26 AM', msg: 'Auto-Processed: ₹1,50,000.00', status: 'DEBIT_SUCCESS', color: 'text-red-500' },
                            { t: '08:17:27 AM', msg: 'User dialled 1930 — Cyber Helpline', status: 'REPORTED', color: 'text-amber-500' },
                            { t: '08:17:30 AM', msg: 'Bank account freeze requested', status: 'BLOCKED', color: 'text-cyan-400' }
                        ].map((log, i) => (
                            <div key={i} className={`p-5 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center animate-in fade-in slide-in-from-right duration-500`} style={{ animationDelay: `${i * 200}ms` }}>
                                <div className="flex flex-col">
                                    <span className="text-white/20 text-xs font-black mb-1">{log.t}</span>
                                    <span className={`text-xl font-black ${log.color}`}>{log.msg}</span>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-widest ${log.color === 'text-red-500' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                    log.color === 'text-amber-500' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                        log.color === 'text-cyan-400' ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400' :
                                            'bg-white/5 border-white/10 text-white/40'
                                    }`}>
                                    {log.status}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Total stolen summary */}
                    <div className="mt-8 p-8 bg-red-600/10 rounded-2xl border-4 border-red-600/20 text-center shadow-inner relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(45deg, #dc2626 25%, transparent 25%, transparent 50%, #dc2626 50%, #dc2626 75%, transparent 75%, transparent 100%)', backgroundSize: '10px 10px' }}></div>
                        <h2 className="text-red-500 text-xl font-black mb-2 uppercase tracking-[0.4em]">TOTAL AMOUNT SENT TO HACKER</h2>
                        <span className="text-6xl font-black text-white font-mono drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">-₹{stolenAmount.toLocaleString('en-IN')}</span>
                        <p className="text-red-400/60 text-sm font-mono mt-3 uppercase tracking-wider">Funds transferred to unknown_collector@oksbi</p>
                    </div>

                    {/* Lives impact */}
                    <div className="mt-6 p-6 bg-slate-900/80 rounded-2xl border border-slate-700/50 text-center">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">IMPACT ON YOUR GAME</p>
                        <div className="flex items-center justify-center gap-6">
                            <div className="text-center">
                                <p className="text-red-500 font-black text-2xl">-₹3,00,000</p>
                                <p className="text-slate-500 text-[10px] uppercase tracking-wider">Assets Lost</p>
                            </div>
                            <div className="w-px h-10 bg-slate-700"></div>
                            <div className="text-center">
                                <p className="text-red-500 font-black text-2xl">❤️ -1</p>
                                <p className="text-slate-500 text-[10px] uppercase tracking-wider">Life Lost</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-6">
                        <button className="bg-white/5 hover:bg-white/10 text-white/40 font-black py-5 rounded-2xl text-lg uppercase tracking-widest transition-all"
                            onClick={() => { adjustAssets(-stolenAmount); adjustLives(-1); setGameState('correct_path'); }}>
                            Accept Defeat
                        </button>
                        <button className="bg-red-600 hover:bg-red-500 text-white font-black py-5 rounded-2xl text-xl shadow-[0_20px_60px_rgba(220,38,38,0.5)] uppercase tracking-widest animate-pulse border-4 border-white/10 transition-transform active:scale-95"
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
            <div className="w-full h-full bg-[#0a0c10] flex items-center justify-center p-8 overflow-y-auto relative">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0%,transparent_70%)]"></div>

                <div className="z-10 w-full max-w-3xl bg-white rounded-[3rem] p-12 shadow-[0_50px_100px_rgba(0,0,0,0.5)] text-center animate-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-inner">⚡</div>
                    <h2 className="text-slate-900 font-black text-4xl uppercase tracking-tighter mb-3 italic">GOLDEN HOUR RECOVERY</h2>
                    <p className="text-slate-600 text-lg font-serif italic leading-relaxed mb-8 px-8 opacity-80">
                        "The 1930 Cyber Helpline initiated the 'Financial Fraud Reverse' protocol. Since you called within the first 30 minutes, there's a chance to freeze the funds in mule accounts."
                    </p>
                    <div className="bg-emerald-50 border-4 border-emerald-500/20 p-8 rounded-[2rem] mb-8 flex justify-between items-center shadow-inner">
                        <div className="text-left">
                            <h4 className="text-emerald-900 font-black uppercase text-xs tracking-widest mb-1">Recovery Protocol Success</h4>
                            <p className="text-emerald-600 text-4xl font-black font-mono mt-1">+₹1,50,000</p>
                        </div>
                        <div className="text-slate-300 w-px h-16 bg-emerald-500/20 mx-6"></div>
                        <div className="text-right">
                            <h4 className="text-slate-400 font-black uppercase text-xs tracking-widest mb-1">Remaining Loss</h4>
                            <p className="text-red-500 text-4xl font-black font-mono mt-1">-₹1,50,000</p>
                        </div>
                    </div>
                    <p className="text-slate-500 text-sm mb-6">Your assets will be updated: <strong className="text-slate-800">₹42,00,000 - ₹3,00,000 + ₹1,50,000 = ₹40,50,000</strong></p>
                    <button className="w-full bg-slate-950 hover:bg-black text-white font-black py-6 rounded-[2rem] text-2xl shadow-3xl transition-all hover:scale-105 active:scale-95 uppercase tracking-widest"
                        onClick={() => { adjustAssets(-300000 + 150000); completeLevel(false, 0, 0); }}>
                        Accept & Continue →
                    </button>
                </div>
            </div>
        );
    }

    // -----------------------------------------------------------
    // RETURN SEQUENCE RENDER
    // -----------------------------------------------------------

    if (gameState === 'title_card') {
        return (
            <div className="absolute inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden font-sans">
                <div className="flex flex-col items-center relative">
                    <div className="absolute inset-0 bg-red-500/10 rounded-full blur-3xl animate-ping scale-[2.5] opacity-30" />
                    <div className="h-px w-32 bg-gradient-to-r from-transparent via-red-500 to-transparent mb-8 animate-width" />

                    <h2 className="text-white text-6xl font-black tracking-[0.4em] uppercase mb-4 relative opacity-0" style={{ animation: 'fadeIn 1s forwards, surge 3.5s infinite' }}>
                        <span className="relative z-10">Level 5</span>
                        {/* Chromatic aberration layers */}
                        <span className="absolute inset-0 text-red-500 opacity-60 translate-x-1 -z-10 animate-aberration">Level 5</span>
                        <span className="absolute inset-0 text-cyan-400 opacity-60 -translate-x-1 -z-10 animate-aberration-alt">Level 5</span>
                    </h2>

                    <h3 className="text-red-500 text-lg font-mono tracking-[0.8em] uppercase opacity-0 font-bold" style={{ animation: 'fadeIn 1s forwards 1.2s' }}>
                        The QR Scam
                    </h3>

                    <div className="h-px w-32 bg-gradient-to-r from-transparent via-red-500 to-transparent mt-12 animate-width" />

                    {/* Tension metadata */}
                    <div className="mt-8 text-[8px] font-mono text-zinc-800 tracking-widest uppercase animate-pulse">
                        INITIALISING MARKET FORENSICS... [25%] [50%] [75%] [100%]
                    </div>
                </div>

                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes aberration {
                        0%, 100% { transform: translate(0, 0); opacity: 0.6; }
                        25% { transform: translate(-4px, 2px); opacity: 0.8; }
                        50% { transform: translate(4px, -2px); opacity: 0.6; }
                        75% { transform: translate(-2px, -4px); opacity: 0.8; }
                    }
                    @keyframes aberration-alt {
                        0%, 100% { transform: translate(0, 0); opacity: 0.6; }
                        25% { transform: translate(4px, -2px); opacity: 0.8; }
                        50% { transform: translate(-4px, 2px); opacity: 0.6; }
                        75% { transform: translate(2px, 4px); opacity: 0.8; }
                    }
                    @keyframes surge {
                        0%, 100% { transform: scale(1); filter: brightness(1); }
                        50% { transform: scale(1.08); filter: brightness(1.3); }
                    }
                    @keyframes width { from { width: 0; opacity: 0; } to { width: 12rem; opacity: 0.8; } }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                    .animate-width { animation: width 1.5s ease-in-out forwards; }
                    .animate-aberration { animation: aberration 1.5s infinite; }
                    .animate-aberration-alt { animation: aberration-alt 1.5s infinite; }
                ` }} />
            </div>
        );
    }

    if (gameState === 'market_return') {
        const currentRoomWidth = Math.max(ROOM_WIDTH, window.innerWidth);
        const cameraX = Math.max(0, Math.min(playerPos.x - window.innerWidth / 2, currentRoomWidth - window.innerWidth));
        return (
            <div className="w-full h-full flex flex-col bg-[#7fc2ed] overflow-hidden relative font-sans">
                <FeedbackToast />
                <div className={`fixed inset-0 z-[9999] bg-black transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />

                <div className="relative flex-1" style={{ width: currentRoomWidth, transform: `translateX(${-cameraX}px)`, transition: 'transform 0.1s linear' }}>
                    <div className="absolute top-0 left-0 w-full h-full z-0">
                        <img src="/assets/market_bg.png" alt="Kailash Market" className="w-full h-full object-[100%_100%]" style={{ objectFit: 'fill' }} />
                    </div>

                    {/* Adjusted Player Position - Direct Control for Animation */}
                    <Player x={playerPos.x} y={playerPos.y} />

                    {/* Prompt to leave */}
                    {playerPos.x < 150 && (
                        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 animate-pulse">
                            <div className="h-[2px] w-12 bg-white/30 mb-3" />
                            <div className="text-white/80 font-mono text-[11px] uppercase tracking-[0.4em] drop-shadow-md">
                                Press E to go to car
                            </div>
                        </div>
                    )}
                </div>

                {/* HUD */}
                <div className="absolute top-8 left-8 z-50 bg-white/95 p-4 rounded-3xl border-2 border-slate-800 shadow-[0_4px_0_#1e293b] flex items-center gap-4">
                    <div className="w-10 h-10 bg-sky-100 rounded-lg border-2 border-slate-800 flex items-center justify-center text-xl shadow-inner">🚗</div>
                    <div>
                        <h3 className="text-slate-900 font-black text-lg uppercase tracking-wide">Return Home</h3>
                        <p className="text-slate-500 text-[10px] font-bold font-mono">WALK TO LEFT TO FIND CAR</p>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'travel_return') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden relative font-sans">
                <div className={`fixed inset-0 z-[9999] bg-black transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
                <div className="absolute inset-0 bg-cover bg-center animate-[pulse_3s_infinite]" style={{ backgroundImage: 'url("/assets/daycar.png")' }} />
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 100px, rgba(255,255,255,0.1) 100px, rgba(255,255,255,0.1) 105px)', animation: 'scroll-left-daycar 2s linear infinite' }}></div>
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-black/50 text-white px-6 py-2 rounded-full font-mono text-xs uppercase tracking-widest backdrop-blur-md border border-white/20">
                    Heading back to estate...
                </div>
            </div>
        );
    }

    if (gameState === 'garden_return') {
        const currentRoomWidth = Math.max(ROOM_WIDTH, window.innerWidth);
        const cameraX = Math.max(0, Math.min(gardenPlayerPos.x - window.innerWidth / 2, currentRoomWidth - window.innerWidth));
        return (
            <div className="w-full h-full flex flex-col bg-slate-900 overflow-hidden relative font-sans">
                <FeedbackToast />
                <div className={`fixed inset-0 z-[9999] bg-black transition-opacity duration-1000 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />

                <div className="relative flex-1" style={{ width: currentRoomWidth, transform: `translateX(${-cameraX}px)`, transition: 'transform 0.1s linear' }}>
                    <div className="absolute top-0 left-0 w-full h-full z-0">
                        <img src="/assets/garden_day.png" alt="Garden Day" className="w-full h-full object-[100%_100%]" style={{ objectFit: 'fill' }} />
                    </div>

                    {/* If inside car, don't show player, show prompt */}
                    {!isGardenReturnCar && (
                        <Player x={gardenPlayerPos.x} y={gardenPlayerPos.y} />
                    )}

                    {isGardenReturnCar && (
                        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 animate-pulse">
                            <div className="h-[2px] w-12 bg-white/30 mb-3" />
                            <div className="text-white/80 font-mono text-[11px] uppercase tracking-[0.4em] drop-shadow-md">
                                Press E to get down from car
                            </div>
                        </div>
                    )}

                    {!isGardenReturnCar && gardenPlayerPos.y < 150 && (
                        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 animate-pulse">
                            <div className="h-[2px] w-12 bg-white/30 mb-3" />
                            <div className="text-white/80 font-mono text-[11px] uppercase tracking-[0.4em] drop-shadow-md">
                                Press E to enter Home
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (gameState === 'living_room_return') {
        const cameraX = Math.max(0, Math.min(livingRoomPlayerPos.x - VIEWPORT_WIDTH / 2, LIVING_ROOM_WIDTH - VIEWPORT_WIDTH));
        const cameraY = Math.max(0, Math.min(livingRoomPlayerPos.y - VIEWPORT_HEIGHT / 2, LIVING_ROOM_HEIGHT - VIEWPORT_HEIGHT));

        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950 px-8 animate-in fade-in duration-1000 font-sans relative">
                <FeedbackToast />
                <div className={`fixed inset-0 z-[9999] bg-black transition-opacity duration-500 pointer-events-none ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />

                <div
                    className="relative border-8 border-slate-900 shadow-2xl overflow-hidden bg-zinc-900"
                    style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}
                >
                    <div
                        className="absolute inset-0"
                        style={{
                            width: LIVING_ROOM_WIDTH,
                            height: LIVING_ROOM_HEIGHT,
                            transform: `translate(${-cameraX}px, ${-cameraY}px)`,
                            backgroundColor: '#2c3e50',
                            transition: 'transform 0.1s linear'
                        }}
                    >
                        {/* Reusing Living Room Background logic manually since it's inline in original */}
                        <div className="absolute inset-0 opacity-80" style={{
                            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(0,0,0,0.2) 38px, rgba(0,0,0,0.2) 40px)'
                        }}></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 pointer-events-none z-10"></div>

                        {/* Top Double Door (Main Exit) */}
                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[240px] h-[80px] bg-[#8a5a44] border-4 border-black border-t-0 flex z-10 transition-all opacity-100`}>
                            <div className="flex-1 border-r-2 border-black p-2 flex items-center justify-center text-[10px] text-white font-bold uppercase tracking-widest bg-emerald-900/20">EXIT</div>
                            <div className="flex-1 border-l-2 border-black p-2 flex items-center justify-center">
                                <div className="w-[80px] h-[50px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                            </div>
                        </div>

                        {/* Bottom Single Door (Bedroom entry point) */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[240px] h-[60px] bg-[#8a5a44] border-4 border-black border-b-0 p-3 flex items-center justify-center z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                            <div className="text-[9px] text-white/60 font-black tracking-[0.3em] mr-8">BEDROOM</div>
                        </div>

                        {/* RIGHT SIDE STUDY ROOM DOOR */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[60px] h-[240px] bg-[#8a5a44] border-4 border-black border-r-0 flex flex-col items-center justify-center z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                            <div className="text-[9px] text-white/60 font-black tracking-[0.3em] rotate-90 whitespace-nowrap">STUDY ROOM</div>
                        </div>

                        {/* Furniture (simplified or same) */}
                        {/* Rugs */}
                        <div className="absolute left-[180px] right-[120px] top-1/2 -translate-y-1/2 h-[260px] bg-[#cb3234] border-y-2 border-black z-0"></div>

                        <Player x={livingRoomPlayerPos.x} y={livingRoomPlayerPos.y} />
                    </div>
                </div>

                {/* Study Room Prompt */}
                {livingRoomPlayerPos.x > 1400 && (
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 animate-pulse">
                        <div className="bg-black/60 px-6 py-2 rounded-full border border-white/20 text-white/90 font-mono text-[11px] uppercase tracking-[0.2em] drop-shadow-md">
                            Press E to enter Study Room
                        </div>
                    </div>
                )}

                {livingRoomPlayerPos.x <= 1400 && (
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-50 animate-pulse">
                        <div className="bg-black/60 px-6 py-2 rounded-full border border-white/20 text-white/90 font-mono text-[11px] uppercase tracking-[0.2em] drop-shadow-md">
                            Go to Study Room (Right)
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
};

export default Level5;
