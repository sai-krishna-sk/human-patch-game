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
  },
  {
    id: 'fake_security',
    name: 'False Security Badge',
    description: 'The "Secured Checkout - 100% Safe" badge is a static image, not a verified SSL certificate. Scammers add these to build false trust.',
    points: 15
  },
  {
    id: 'too_good_to_be_true',
    name: 'Unrealistic Pricing',
    description: 'A Samsung Galaxy S24 Ultra for ₹2,499 (97% discount) is logically impossible. Scammers use extreme discounts to bypass critical thinking.',
    points: 25
  }
];

const Level8 = () => {
  const { completeLevel, adjustAssets, adjustLives, playTitleCardSound } = useGameState();

  // ═══ STATE ═══
  const [gameState, setGameState] = useState('garden'); // garden, living-room, whatsapp, website, trust-score, outcome
  const [cluesFound, setCluesFound] = useState([]);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [activeClue, setActiveClue] = useState(null);
  const [showDetectiveBoard, setShowDetectiveBoard] = useState(false);
  const [isPhoneVibrating, setIsPhoneVibrating] = useState(false);
  const [scamProgress, setScamProgress] = useState(0); // For trust score meter
  const [outcomeType, setOutcomeType] = useState(null); // 'victory', 'scam'
  const [showChat, setShowChat] = useState(false);
  const [chatStep, setChatStep] = useState(0);
  const [trustScoreLogs, setTrustScoreLogs] = useState([]);
  const [showWhatsAppWarn, setShowWhatsAppWarn] = useState(false);
  const [hasWarned, setHasWarned] = useState(false);

  // Movement State
  const [playerPos, setPlayerPos] = useState({ x: 750, y: 430 }); // Default living room pos
  const [gardenPlayerPos, setGardenPlayerPos] = useState({ x: 800, y: 400 }); // Centered around car
  const [keys, setKeys] = useState({});
  const [interactionActive, setInteractionActive] = useState(false);
  const [interactionTarget, setInteractionTarget] = useState(null);
  const [isCarExited, setIsCarExited] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [tvDialogueShown, setTvDialogueShown] = useState(false);
  const [phoneTriggered, setPhoneTriggered] = useState(false);
  const [activeDialogue, setActiveDialogue] = useState(null);
  const [epilogueStep, setEpilogueStep] = useState(0);

  const triggerTransition = (newState, newPos = null) => {
    setIsTransitioning(true);
    setTimeout(() => {
        if (newState) setGameState(newState);
        if (newPos) setPlayerPos(newPos);
        setTimeout(() => setIsTransitioning(false), 500);
    }, 500);
  };

  const handleClueDiscovery = useCallback((clueId) => {
    if (cluesFound.some(c => c.id === clueId)) return;
    // Show cinematic dialogue first, don't log the clue yet
    setActiveDialogue(clueId);
  }, [cluesFound]);

  const handleDialogueComplete = useCallback((clueId) => {
    setActiveDialogue(null);
    if (cluesFound.some(c => c.id === clueId)) return;
    const clueDef = CLUE_DATA.find(c => c.id === clueId);
    if (!clueDef) return;

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
    setShowDetectiveBoard(true);
  }, [cluesFound]);

  // Epilogue sequence timers
  useEffect(() => {
    if (gameState === 'epilogue') {
      const timers = [
        setTimeout(() => setEpilogueStep(1), 2000),
        setTimeout(() => setEpilogueStep(2), 6000),
        setTimeout(() => setEpilogueStep(3), 9000),
        setTimeout(() => setEpilogueStep(4), 11000),
      ];
      return () => timers.forEach(t => clearTimeout(t));
    }
  }, [gameState]);

  // Remove initial phone vibration on load, we trigger it based on proximity now
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setIsPhoneVibrating(true);
  //     showFeedback("WhatsApp Notification from Aunty Priya", "indigo");
  //   }, 2000);
  //   return () => clearTimeout(timer);
  // }, []);

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
    // Only process if no modal is active
    if (showWhatsApp || showWhatsAppWarn || gameState === 'cybercrime-portal') return;

    let animationFrameId;
    const speed = 7;
    const ROOM_WIDTH = 1600;
    const ROOM_HEIGHT = 1100;

    const gameLoop = () => {
      if (gameState === 'living-room') {
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

          // Interaction zone for the sofa to sit down
          let target = null;
          const nearSofa = Math.abs(newX - 740) < 150 && Math.abs(newY - 550) < 150;
          if (nearSofa) target = 'sofa';
          
          setInteractionActive(nearSofa);
          setInteractionTarget(target);

          return { x: newX, y: newY };
        });
      } else if (gameState === 'garden') {
        setGardenPlayerPos(prev => {
          let newX = prev.x;
          let newY = prev.y;

          if (keys['w'] || keys['arrowup']) newY -= speed;
          if (keys['s'] || keys['arrowdown']) newY += speed;
          if (keys['a'] || keys['arrowleft']) newX -= speed;
          if (keys['d'] || keys['arrowright']) newX += speed;

          const currentRoomWidth = Math.max(ROOM_WIDTH, window.innerWidth);
          const currentRoomHeight = window.innerHeight; // Use window height for vertical bounds
          
          // Constrain movement based on car exit status
          if (!isCarExited) {
              // Stay inside car bounds
              newX = currentRoomWidth / 2;
              newY = currentRoomHeight / 2 + 100; // Place closer to bottom
          } else {
              newX = Math.max(0, Math.min(newX, currentRoomWidth - 40));
              newY = Math.max(50, Math.min(newY, currentRoomHeight - 40));
          }

          let target = null;
          // Entering the house zone
          const doorZone = { x: currentRoomWidth / 2 - 100, y: 0, w: 200, h: 200 };
          const px = newX;
          const py = newY;
          if (!isCarExited) {
              target = 'exit_car';
          } else if (px > doorZone.x && px < doorZone.x + doorZone.w && py < doorZone.y + doorZone.h) {
              target = 'enter_house';
          }
          
          setInteractionTarget(target);

          return { x: newX, y: newY };
        });
      }
      
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [keys, gameState, showWhatsApp, showWhatsAppWarn, isCarExited, phoneTriggered, hasWarned]);

  // Handle Interaction Key 'E'
  useEffect(() => {
    const handleActionKey = (e) => {
      if (e.key.toLowerCase() === 'e') {
        if (activeDialogue) {
            handleDialogueComplete(activeDialogue);
            return;
        }

        if (gameState === 'garden') {
            if (interactionTarget === 'exit_car' && !isCarExited) {
                setIsCarExited(true);
            } else if (interactionTarget === 'enter_house') {
                triggerTransition('living-room', { x: 800, y: 150 });
            }
        } else if (gameState === 'living-room' && interactionTarget === 'sofa') {
            triggerTransition('living-pov');
            setKeys(k => ({ ...k, 'e': false }));
        } else if (gameState === 'living-pov' && e.key.toLowerCase() === 'escape') {
            triggerTransition('living-room');
        }
      }
    };

    window.addEventListener('keydown', handleActionKey);
    return () => window.removeEventListener('keydown', handleActionKey);
  }, [gameState, interactionTarget, isCarExited, showWhatsApp, hasWarned, showWhatsAppWarn, phoneTriggered, activeDialogue]);

  // Handle Dialogue after entering Living Room
  useEffect(() => {
      if (gameState === 'living-room' && !tvDialogueShown) {
          setTvDialogueShown(true);
          // Small delay so transition finishes before the dialogue appears
          setTimeout(() => {
              showFeedback("I feel like watching TV.", "cyan");
          }, 800);
      }
  }, [gameState, tvDialogueShown]);

  // Handle phone notification in POV
  useEffect(() => {
    if (gameState === 'living-pov' && !phoneTriggered && !hasWarned) {
      const timer = setTimeout(() => {
        setPhoneTriggered(true);
        setIsPhoneVibrating(true);
        showFeedback("WhatsApp Notification from Aunty Priya", "indigo");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [gameState, phoneTriggered, hasWarned]);

  // Handle Title Card Transition
  useEffect(() => {
    if (gameState === 'title-card') {
      playTitleCardSound();
      const timer = setTimeout(() => {
        triggerTransition('website');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [gameState, playTitleCardSound]);

  // ═══ COMPONENTS ═══

  const LivingRoom = () => {
    const VIEWPORT_WIDTH = 1200;
    const VIEWPORT_HEIGHT = 800;
    const ROOM_WIDTH = 1600;
    const ROOM_HEIGHT = 1100;

    const cameraX = Math.max(0, Math.min(playerPos.x - VIEWPORT_WIDTH / 2, ROOM_WIDTH - VIEWPORT_WIDTH));
    const cameraY = Math.max(0, Math.min(playerPos.y - VIEWPORT_HEIGHT / 2, ROOM_HEIGHT - VIEWPORT_HEIGHT));

    return (
      <div className={`w-full h-full flex items-center justify-center bg-zinc-950 px-8 transition-opacity duration-1000 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
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

            {/* INTERACTION HINT UI */}
            {interactionTarget === 'sofa' && (
              <div className="absolute z-30 pointer-events-none" style={{ left: playerPos.x, top: playerPos.y - 60 }}>
                <div className="bg-white text-slate-900 px-3 py-1 rounded shadow-xl border-2 border-slate-500 font-bold animate-bounce text-sm whitespace-nowrap">
                  Press [E] to sit down
                </div>
              </div>
            )}

            {/* THE PLAYER AVATAR */}
            {gameState === 'living-room' && <Player x={playerPos.x} y={playerPos.y} />}
          </div>
        </div>
      </div>
    );
  };

  const LivingPov = () => (
    <div className={`w-full h-full flex flex-col items-center justify-center bg-black relative animate-in fade-in duration-1000 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      <img src="/assets/living_pov.png" alt="Living POV" className="w-full h-full object-cover" />
      
      {/* Clickable Phone Area */}
      {!hasWarned ? (
          <div 
            className={`absolute cursor-pointer transition-all ${isPhoneVibrating ? 'animate-[shake_0.5s_infinite] ring-4 ring-emerald-500 rounded-[20px] bg-emerald-500/20' : 'hover:ring-4 hover:ring-cyan-500 rounded-[20px] hover:bg-cyan-500/10'}`}
            style={{ width: '10%', height: '22%', left: '45.5%', top: '70%' }}
            onClick={() => {
              if (phoneTriggered) {
                  setIsPhoneVibrating(false);
                  setShowWhatsApp(true);
              }
            }}
          >
             {isPhoneVibrating && (
                <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 bg-white text-slate-900 px-4 py-2 rounded shadow-xl border-2 border-emerald-500 font-bold animate-bounce text-sm whitespace-nowrap z-50">
                  Click to read message
                </div>
             )}
          </div>
      ) : (
          <div 
            className="absolute cursor-pointer transition-all hover:ring-4 hover:ring-indigo-500 rounded-[20px] hover:bg-indigo-500/20 group animate-[shake_1.5s_infinite]"
            style={{ width: '10%', height: '22%', left: '45.5%', top: '70%' }}
            onClick={() => {
              setGameState('cybercrime-portal');
            }}
          >
             <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 bg-white text-slate-900 px-4 py-2 rounded shadow-xl border-2 border-indigo-500 font-bold animate-bounce text-sm whitespace-nowrap z-50">
                Click to open Cybercrime Portal
             </div>
          </div>
      )}

    </div>
  );

  const Garden = () => {
    const ROOM_WIDTH = 1600;
    const currentRoomWidth = Math.max(ROOM_WIDTH, window.innerWidth);
    const cameraX = Math.max(0, Math.min(gardenPlayerPos.x - window.innerWidth / 2, currentRoomWidth - window.innerWidth));

    return (
      <div className={`w-full h-full flex flex-col bg-slate-900 overflow-hidden relative font-sans transition-opacity duration-1000 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        {interactionTarget === 'exit_car' && !isCarExited && (
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-[100] animate-pulse">
            <div className="h-[2px] w-12 bg-white/30 mb-3" />
            <div className="text-white/80 font-mono text-[11px] uppercase tracking-[0.4em] drop-shadow-md">
                Press E to exit car
            </div>
          </div>
        )}
        {interactionTarget === 'enter_house' && (
          <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-[100] animate-pulse">
            <div className="h-[2px] w-12 bg-white/30 mb-3" />
            <div className="text-white/80 font-mono text-[11px] uppercase tracking-[0.4em] drop-shadow-md">
                Press E to enter house
            </div>
          </div>
        )}

        <div className="relative flex-1" style={{ width: currentRoomWidth, transform: `translateX(${-cameraX}px)` }}>
          <div className="absolute top-0 left-0 w-full h-full z-0">
            <img src="/assets/aftergarden.png" alt="Garden Day" className="w-full h-full object-[100%_100%]" style={{ objectFit: 'fill' }} />
          </div>

          {isCarExited && <Player x={gardenPlayerPos.x} y={gardenPlayerPos.y} />}
        </div>
      </div>
    );
  };

  const WhatsAppThread = () => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-in fade-in zoom-in duration-300">
      <div className="w-[400px] bg-[#efeae2] rounded-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-[85vh] max-h-[850px] border border-white/10 ring-4 ring-black/40">
        
        {/* iOS StatusBar Mock */}
        <div className="bg-[#008069] w-full h-[30px] flex justify-between items-end px-6 pb-1 text-white/90 text-[11px] font-medium tracking-wide">
            <span>19:29</span>
            <div className="flex items-center gap-1.5">
                <span className="mb-[1px]">LTE</span>
                <div className="w-5 h-2.5 border border-white/60 rounded-[3px] p-[1px] relative">
                    <div className="w-[80%] h-full bg-white rounded-[1px]"></div>
                    <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-[4px] bg-white/60 rounded-r-sm"></div>
                </div>
            </div>
        </div>

        {/* WhatsApp Header */}
        <div className="px-4 py-3 flex items-center gap-3 bg-[#008069] shadow-sm z-10">
          <button onClick={() => setShowWhatsApp(false)} className="text-white hover:bg-white/10 w-10 h-10 rounded-full flex items-center justify-center transition-all -ml-2">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <div className="w-10 h-10 bg-emerald-700 rounded-full flex items-center justify-center overflow-hidden border border-emerald-500/50 cursor-pointer">
            <span className="text-xl">👩‍🍳</span>
          </div>
          <div className="flex flex-col flex-1 cursor-pointer">
            <h3 className="text-white font-semibold text-[16px] leading-tight">Aunty Priya</h3>
            <span className="text-white/80 text-[12px] font-medium">online</span>
          </div>
          <div className="flex gap-4 text-white p-2">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
          </div>
        </div>

        {/* Chat Background */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto" style={{
          backgroundImage: 'url("https://user-images.githubusercontent.com/1507727/101833400-33499000-3b4d-11eb-8283-bc7b9d6d23f3.png")',
          backgroundSize: '400px',
          backgroundColor: '#efeae2',
          backgroundBlendMode: 'overlay'
        }}>
          <div className="flex justify-center mb-6">
            <div className="bg-[#D1EAF1]/80 backdrop-blur-sm text-[#54656f] text-[11px] font-medium px-3 py-1 rounded-lg">TODAY</div>
          </div>

          {/* Message 1 (Text + Link Card) */}
          <div className="flex items-start gap-2 max-w-[85%]">
            <div className="bg-white p-2 pb-1.5 rounded-lg rounded-tl-none shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative text-[14.5px] text-[#111b21] leading-[1.35]">
              {/* Message Tail SVG */}
              <svg viewBox="0 0 8 13" width="8" height="13" className="absolute -left-[8px] top-0 text-white fill-current">
                <path opacity=".13" fill="#0000000" d="M1.533 3.568 8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z"></path>
                <path opacity=".08" d="M1.533 3.568 8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z"></path>
                <path d="M1.533 2.568 8 11.193V0H2.812C1.042 0 .474 1.156 1.533 2.568z"></path>
              </svg>
              
              <div className="flex items-center gap-1.5 mb-1 text-[12px] text-[#8696a0] italic">
                <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M5.5 10.3 2.2 7l1.4-1.4 1.9 1.9L11.8 1l1.4 1.4L5.5 10.3z"></path><path d="M10.5 10.3 7.2 7l1.4-1.4 1.9 1.9L16.8 1l1.4 1.4-7.7 7.9z"></path></svg>
                <span>Forwarded many times</span>
              </div>
              
              <p className="px-1 whitespace-pre-wrap">AMAZING SALE!!! 🤯🔥 Buy Samsung S24 for only ₹4,999!!! Limited stock!! Only 47 left!!! My neighbour bought two yesterday! I just ordered one for Karthik’s birthday!</p>
              
              <div
                className="mt-2 bg-[#f0f2f5] rounded-md overflow-hidden border border-[#d1d7db] cursor-pointer hover:bg-[#e2e5e9] transition-colors"
                onClick={() => {
                  setShowWhatsApp(false);
                  setGameState('title-card');
                }}
              >
                <div className="w-full h-[140px] bg-[#d1d7db] relative flex items-center justify-center overflow-hidden">
                   <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-black/60 to-transparent"></div>
                   <div className="text-[60px]">📦</div>
                   <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">FLASH SALE LIVE</div>
                </div>
                <div className="p-3">
                  <div className="text-[14px] font-semibold text-[#111b21] leading-tight mb-1 truncate">Samsung Galaxy S24 Ultra - 97% OFF!</div>
                  <div className="text-[12px] text-[#54656f] leading-snug line-clamp-2">Click to claim yours now before stock ends. Final units remaining. Official sale.</div>
                  <div className="text-[11px] text-[#8696a0] uppercase mt-2 font-medium tracking-wide">techdeals-india.shop</div>
                </div>
              </div>

              <div className="flex justify-end items-center gap-1 mt-1 -mb-0.5">
                <span className="text-[11px] text-[#667781]">19:29</span>
              </div>
            </div>
          </div>

          {/* Message 2 (Voice Note) */}
          <div className="flex items-start gap-2 max-w-[85%]">
            <div className="bg-white px-3 py-2 rounded-lg shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative">
              <div className="flex items-center gap-4">
                {/* Play Button */}
                <div className="w-10 h-10 rounded-full flex justify-center items-center cursor-pointer">
                    <svg viewBox="0 0 24 24" width="30" height="30" fill="#54656f"><path d="M8 5.14v14l11-7-11-7z"></path></svg>
                </div>
                
                {/* Waveform Visualization Fake */}
                <div className="flex-1 flex items-center h-8 gap-[2px]">
                   {[2, 4, 3, 5, 8, 5, 3, 2, 6, 9, 12, 8, 4, 2, 3, 5, 4, 2].map((h, i) => (
                       <div key={i} className="w-[3px] bg-[#00a884] rounded-full" style={{ height: `${h * 2}px` }}></div>
                   ))}
                   {[6, 8, 5, 3, 2, 4, 5, 3, 2, 4, 5].map((h, i) => (
                       <div key={i} className="w-[3px] bg-[#d1d7db] rounded-full" style={{ height: `${h * 2}px` }}></div>
                   ))}
                </div>
                
                {/* Profile Pic Thumb */}
                <div className="w-10 h-10 bg-emerald-700/80 rounded-full overflow-hidden flex items-center justify-center text-lg shadow-sm border border-emerald-900/10">👩‍🍳</div>
              </div>
              
              <div className="flex justify-between items-center mt-1 w-full px-1">
                 <span className="text-[11px] text-[#54656f] font-medium">0:12</span>
                 <span className="text-[11px] text-[#667781]">19:30</span>
              </div>
            </div>
          </div>
          
          {/* Subtitle helper for audio context */}
          <div className="flex items-start gap-2 max-w-[85%] mt-1">
             <div className="bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/40 text-[11px] text-[#54656f] italic leading-tight shadow-sm">
                 Audio transcript: "Dei, this is real da, my neighbour actually got the phone already, share with everyone!"
             </div>
          </div>

        </div>

        {/* Chat Input Area */}
        <div className="bg-[#f0f2f5] p-2 flex items-end gap-2 z-10">
          <div className="flex-1 bg-white rounded-full min-h-[42px] flex items-center px-4 shadow-sm border border-[#e2e5e9]">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#54656f" className="cursor-pointer mr-3"><path d="M9.15 8.16C8.89 7.02 8 6.09 6.83 5.8 5.67 5.51 4.46 6 3.84 6.94c-.66.99-.5 2.37.38 3.19.06.05.12.11.19.16.89.72 1.94.94 2.89.65.68-.21 1.25-.66 1.6-1.28.16-.29.41-.39.75-.43l.03-.01c.29-.04.49-.07.64-.19.03-.02.04-.05.07-.07.03-.03.05-.07.08-.11.23-.42.23-1.02.03-1.4l-.35-.71zM14.52 7.03c-1.12-1-2.8-.75-3.61.54-.78 1.25-.45 2.94.75 3.8.31.22.65.37.99.43l-.04.01c-.13.06-.2.18-.32.32-.23.28-.48.65-.63.99-.04.09-.08.19-.11.29 0 .01-.01.02-.02.03l-.02.13c-.02.11-.05.23-.05.35v.06c-.03.46.07.92.3 1.32.22.37.52.68.88.92.36.25.76.43 1.18.52.33.06.67.1.1 0 .68-.08 1.33-.36 1.83-.8l.21-.19c.14-.14.28-.29.4-.44.75-.95.83-2.31.18-3.34-.14-.23-.32-.44-.52-.61-1.05-.88-2.67-.93-3.79-.1l-1.04.79c-.19.14-.3.21-.49.19-.18-.02-.3-.13-.42-.31-.1-.13-.17-.28-.2-.44v-.03c-.01-.11-.02-.23-.01-.34 0-.01.01-.02.01-.03.02-.09.05-.18.08-.28.11-.27.28-.56.46-.78.09-.11.16-.18.23-.21.05-.02.43.08.7.07.93-.03 1.8-.46 2.39-1.2.62-.77.83-1.8.56-2.73-.24-.84-.79-1.54-1.55-1.92zm-9.35 12.01c-.06.26-.05.51.01.76.12.5.42.92.83 1.2.39.26.85.39 1.31.39.19 0 .38-.02.58-.06.66-.14 1.22-.55 1.58-1.14.36-.6.44-1.32.23-1.96-.21-.63-.66-1.15-1.25-1.46-.38-.2-.79-.31-1.21-.31-.22 0-.44.03-.66.08-.66.14-1.22.54-1.58 1.13-.19.33-.29.68-.29 1.05 0 .11 0 .22.01.32h-.01c.06-.06.27-.33.44-.5zm8.56 1.96c.73-1 2.22-1.23 3.23-.5.98.71 1.23 2.15.54 3.16-.72 1.03-2.26 1.26-3.23.5-.96-.73-1.25-2.11-.54-3.16z"></path></svg>
            <span className="flex-1 text-[#8696a0] text-[15px]">Message</span>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#54656f" className="cursor-pointer ml-2"><path d="M21.58 12.09l-19.16 8.3c-.22.1-.48.09-.7-.03-.22-.12-.34-.34-.32-.59l1.63-7.58 8.04-1.42c.16-.03.26-.18.23-.33-.03-.13-.13-.23-.27-.24L2.94 8.79 1.38 1.22c-.03-.24.09-.47.3-.59.22-.11.47-.1.68.01l19.19 8.27c.28.12.45.39.44.69.02.29-.14.56-.41.69z"></path></svg>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#54656f" className="cursor-pointer ml-3"><path d="M11.999 14.942c2.001 0 3.531-1.53 3.531-3.531V4.35c0-2.001-1.53-3.531-3.531-3.531S8.469 2.35 8.469 4.35v7.061c0 2.001 1.53 3.531 3.53 3.531zm6.238-3.53c0 3.531-2.942 6.002-6.237 6.002s-6.237-2.471-6.237-6.002H3.761c0 4.001 3.178 7.297 7.061 7.885v3.884h2.354v-3.884c3.884-.588 7.061-3.884 7.061-7.885h-2z"></path></svg>
          </div>
        </div>
      </div>
    </div>
  );

  const WhatsAppWarnThread = () => (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md animate-in fade-in zoom-in duration-300">
      <div className="w-[400px] bg-[#efeae2] rounded-[30px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-[85vh] max-h-[850px] border border-white/10 ring-4 ring-black/40">
        
        {/* iOS StatusBar Mock */}
        <div className="bg-[#008069] w-full h-[30px] flex justify-between items-end px-6 pb-1 text-white/90 text-[11px] font-medium tracking-wide">
            <span>20:16</span>
            <div className="flex items-center gap-1.5">
                <span className="mb-[1px]">LTE</span>
                <div className="w-5 h-2.5 border border-white/60 rounded-[3px] p-[1px] relative">
                    <div className="w-[80%] h-full bg-white rounded-[1px]"></div>
                    <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-[4px] bg-white/60 rounded-r-sm"></div>
                </div>
            </div>
        </div>

        {/* WhatsApp Header */}
        <div className="px-4 py-3 flex items-center gap-3 bg-[#008069] shadow-sm z-10 transition-colors">
          <button className="text-white w-8 h-8 rounded-full flex items-center justify-center transition-all -ml-2">
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          </button>
          <div className="w-10 h-10 bg-emerald-700 rounded-full flex items-center justify-center overflow-hidden border border-emerald-500/50 cursor-pointer">
            <span className="text-xl">👩‍🍳</span>
          </div>
          <div className="flex flex-col flex-1 cursor-pointer">
            <h3 className="text-white font-semibold text-[16px] leading-tight">Aunty Priya</h3>
            <span className="text-white/80 text-[12px] font-medium">taking a deep breath...</span>
          </div>
        </div>

        {/* Chat Background */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto" style={{
          backgroundImage: 'url("https://user-images.githubusercontent.com/1507727/101833400-33499000-3b4d-11eb-8283-bc7b9d6d23f3.png")',
          backgroundSize: '400px',
          backgroundColor: '#efeae2',
          backgroundBlendMode: 'overlay'
        }}>
          <div className="flex flex-col gap-3 pt-6">
            
            {/* Outgoing Message 1 */}
            <div className="self-end max-w-[85%] bg-[#d9fdd3] p-2 pb-1.5 rounded-lg rounded-tr-none shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative text-[14.5px] text-[#111b21] leading-[1.35] animate-in slide-in-from-right duration-300">
              <svg viewBox="0 0 8 13" width="8" height="13" className="absolute -right-[8px] top-0 text-[#d9fdd3] fill-current">
                <path opacity=".13" d="M5.188 1H8v11.193l-6.467-8.625C.474 2.156 1.042 1 2.812 1h2.376z"></path>
                <path d="M5.188 0H8v11.193l-6.467-8.625C.474 1.156 1.042 0 2.812 0h2.376z"></path>
              </svg>
              <p className="px-1 whitespace-pre-wrap">Aunty STOP! 🛑 Do not buy anything and don't share this link! The website is a complete scam. They have no GST, the domain was created 19 days ago, and the security badges are fake images.</p>
              <div className="flex justify-end items-center gap-1 mt-1 -mb-0.5">
                <span className="text-[11px] text-[#667781]">20:15</span>
                <svg viewBox="0 0 16 15" width="16" height="15"><path fill="#53bdeb" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path></svg>
              </div>
            </div>

            {/* Incoming Reply */}
            <div className="self-start max-w-[85%] bg-white p-2 pb-1.5 rounded-lg rounded-tl-none shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative text-[14.5px] text-[#111b21] leading-[1.35] animate-in slide-in-from-left duration-500 delay-1000 fill-mode-both">
              <svg viewBox="0 0 8 13" width="8" height="13" className="absolute -left-[8px] top-0 text-white fill-current">
                <path opacity=".13" fill="#0000000" d="M1.533 3.568 8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z"></path>
                <path opacity=".08" d="M1.533 3.568 8 12.193V1H2.812C1.042 1 .474 2.156 1.533 3.568z"></path>
                <path d="M1.533 2.568 8 11.193V0H2.812C1.042 0 .474 1.156 1.533 2.568z"></path>
              </svg>
              <p className="px-1 whitespace-pre-wrap">Oh my god thank you Kannaa!! 🙏 I will block the sender immediately and delete the link. How do we stop this from spreading to others??</p>
              <div className="flex justify-end items-center gap-1 mt-1 -mb-0.5">
                <span className="text-[11px] text-[#667781]">20:16</span>
              </div>
            </div>

            {/* Outgoing Message 2 */}
            <div className="self-end max-w-[85%] bg-[#d9fdd3] p-2 pb-1.5 rounded-lg rounded-tr-none shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] relative text-[14.5px] text-[#111b21] leading-[1.35] animate-in slide-in-from-right duration-500 delay-[2500ms] fill-mode-both">
              <svg viewBox="0 0 8 13" width="8" height="13" className="absolute -right-[8px] top-0 text-[#d9fdd3] fill-current">
                <path opacity=".13" d="M5.188 1H8v11.193l-6.467-8.625C.474 2.156 1.042 1 2.812 1h2.376z"></path>
                <path d="M5.188 0H8v11.193l-6.467-8.625C.474 1.156 1.042 0 2.812 0h2.376z"></path>
              </svg>
              <p className="px-1 whitespace-pre-wrap">Don't worry, I have collected all the evidence on my Evidence Board. I need to go to my laptop right now and file an official report on the Cybercrime Portal. I'll handle it!</p>
              <div className="flex justify-end items-center gap-1 mt-1 -mb-0.5">
                <span className="text-[11px] text-[#667781]">20:16</span>
                <svg viewBox="0 0 16 15" width="16" height="15"><path fill="#8696a0" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Action / Objective Button */}
        <div className="absolute inset-x-8 bottom-8 flex flex-col gap-3 z-20 animate-in slide-in-from-bottom duration-1000 delay-[3500ms] fill-mode-both">
           <div className="bg-white/90 backdrop-blur shadow-lg border border-red-200 p-3 rounded-xl scale-[0.9] origin-bottom text-center mb-2 animate-pulse">
              <div className="text-[11px] font-bold text-red-600 uppercase tracking-widest mb-1">New Objective</div>
              <div className="text-[13px] text-[#111b21] font-semibold">Report the incident to the Cyber Cell</div>
           </div>
           <button
            className="w-full bg-[#00a884] hover:bg-[#01886b] text-white font-bold py-4 rounded-xl shadow-[0_8px_20px_rgba(0,168,132,0.4)] transition-all font-sans text-lg flex items-center justify-center gap-3 scale-100 hover:scale-[1.02] active:scale-95 uppercase tracking-wide"
            onClick={() => {
              setShowWhatsAppWarn(false);
              setHasWarned(true);
              setGameState('cybercrime-portal');
            }}
          >
            Access Cybercrime Portal 💻
          </button>
        </div>
      </div>
    </div>
  );

  const CybercrimePortal = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAttachmentAdded, setIsAttachmentAdded] = useState(false);

    const handleSubmit = () => {
      setIsSubmitting(true);
      setTimeout(() => {
        setGameState('epilogue');
        setEpilogueStep(0);
      }, 2000); // simulate loading
    };

    return (
      <div className="fixed inset-0 z-[1000] bg-zinc-900 flex items-center justify-center font-sans tracking-wide">
        <div className="max-w-4xl w-full h-[90vh] bg-white rounded-t-lg shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-700">
          {/* Fake Browser Toolbar */}
          <div className="bg-zinc-200 h-10 border-b border-zinc-300 flex items-center px-4 gap-4">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
            </div>
            <div className="flex-1 bg-white rounded-md h-6 px-3 flex items-center shadow-sm text-xs font-mono text-zinc-600">
              🔒 https://cybercrime.gov.in/report-incident
            </div>
          </div>

          {/* Portal Header */}
          <div className="bg-[#0b1f52] p-6 text-white flex items-center gap-6 border-b-4 border-amber-500">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center font-serif text-3xl font-bold text-[#0b1f52] shrink-0">In</div>
            <div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider font-serif">National Cyber Crime Reporting Portal</h1>
              <p className="text-cyan-200 text-xs md:text-sm italic font-medium">Ministry of Home Affairs, Government Of India</p>
            </div>
          </div>

          {/* Portal Content */}
          <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-slate-50 hide-scrollbar">
            <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 border-b-2 border-slate-100 pb-4 mb-6 uppercase flex items-center gap-3">
                <span>📝</span> File a Suspect Website Report
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs md:text-sm font-bold text-slate-700 mb-2">Suspect URL / Domain name <span className="text-red-500">*</span></label>
                  <input type="text" readOnly value="https://techdeals-india.shop/sale24" className="w-full bg-slate-100 border border-slate-300 rounded-lg py-3 px-4 text-slate-600 font-mono text-sm" />
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-bold text-slate-700 mb-2">Category of Fraud <span className="text-red-500">*</span></label>
                  <select disabled className="w-full bg-slate-100 border border-slate-300 rounded-lg py-3 px-4 text-slate-600 font-medium text-sm">
                    <option>Online Shopping / E-Commerce Scam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-bold text-slate-700 mb-2">Incident Details <span className="text-red-500">*</span></label>
                  <textarea readOnly className="w-full bg-slate-100 border border-slate-300 rounded-lg py-3 px-4 text-slate-600 h-24 text-sm" value="Fraudulent e-commerce store spreading via WhatsApp links. Offers massive fake discounts to steal money directly via UPI to personal accounts. Domain registered recently with masked identity. Uses fake pressure tactics."></textarea>
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-bold text-slate-700 mb-2">Evidence / Logs Attached <span className="text-red-500">*</span></label>
                  {!isAttachmentAdded ? (
                    <button
                      className="w-full bg-amber-100 hover:bg-amber-200 border-2 border-dashed border-amber-400 text-amber-800 font-bold py-6 rounded-xl flex items-center justify-center gap-3 transition-colors outline-none"
                      onClick={() => setIsAttachmentAdded(true)}
                    >
                      <span className="text-2xl">📋</span>
                      <span>Attach Evidence Board Clues ({cluesFound.length} Items)</span>
                    </button>
                  ) : (
                    <div className="w-full bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3 text-emerald-700 font-bold">
                        <span className="text-2xl">✅</span>
                        <span className="text-sm md:text-base">evidence_logs.zip ({cluesFound.length} items successfully attached)</span>
                      </div>
                      <span className="text-xs text-emerald-600 font-mono">1.2MB</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Actions */}
            <div className="mt-8 flex justify-end">
              <button
                disabled={!isAttachmentAdded || isSubmitting}
                onClick={handleSubmit}
                className={`font-black py-4 px-8 md:px-12 rounded-lg text-sm md:text-lg uppercase tracking-widest transition-all outline-none ${!isAttachmentAdded ? 'bg-slate-300 text-slate-500 cursor-not-allowed border-none' : isSubmitting ? 'bg-cyan-600 text-white animate-pulse' : 'bg-[#0b1f52] hover:bg-blue-900 text-white shadow-lg shadow-blue-900/40 hover:scale-105 active:scale-95'}`}
              >
                {isSubmitting ? 'Submitting to Cyber Cell...' : 'Submit Final Report'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Epilogue = () => {
    return (
      <div className="absolute inset-0 z-[1000] bg-black">
        {/* Living Room POV Background */}
        {epilogueStep < 3 && (
          <div className="absolute inset-0 animate-in fade-in duration-1000">
            <img src="/assets/living_pov.png" alt="Cricket Match" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/30" />
            
            {/* Cricket score overlay */}
            <div className="absolute top-8 right-8 bg-black/70 backdrop-blur-md border border-white/20 rounded-2xl px-8 py-4 text-center z-10">
              <div className="text-emerald-400 text-xs font-mono uppercase tracking-[0.3em] mb-1">Live Score</div>
              <div className="text-white font-black text-3xl tracking-tight">IND 287/4</div>
              <div className="text-white/50 text-xs font-bold mt-1">India won by 6 wickets 🏏</div>
            </div>
          </div>
        )}

        {/* Dialogue Step 1 */}
        {epilogueStep === 1 && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute bottom-32 w-full text-center animate-fadeInSlow">
              <p className="text-white text-4xl font-serif italic tracking-wide drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] px-16 leading-relaxed max-w-5xl mx-auto">
                "Yesss! India won the match! What a chase! Kohli was unreal tonight."
              </p>
            </div>
          </div>
        )}

        {/* Dialogue Step 2 */}
        {epilogueStep === 2 && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <div className="absolute bottom-32 w-full text-center animate-fadeInSlow">
              <p className="text-white text-4xl font-serif italic tracking-wide drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] px-16 leading-relaxed max-w-5xl mx-auto">
                "Aunty Priya is safe, the scam site is reported... I guess it's time to call it a night."
              </p>
            </div>
          </div>
        )}

        {/* End Card (Step 3+) */}
        {epilogueStep >= 3 && (
          <div className="absolute inset-0 bg-stone-950 flex flex-col items-center justify-center animate-in fade-in duration-1000 overflow-hidden z-30">
            {/* Scanning line effects */}
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%]" />
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" style={{ animation: 'scanLine 3s linear infinite' }} />

            <div className="relative group text-center">
              <div className="absolute -inset-10 bg-white/5 blur-3xl rounded-full" />
              <h2 className="text-white text-6xl font-black tracking-[0.5em] uppercase mb-12 relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                Level 8: Ghost Store
                {epilogueStep === 4 && (
                  <div className="absolute top-1/2 left-[-10%] w-[120%] h-3 bg-red-600/90 -translate-y-1/2 shadow-[0_0_25px_rgba(220,38,38,1)] z-20 skew-y-[-1deg]" style={{ animation: 'strikeThrough 0.5s ease-out forwards' }} />
                )}
              </h2>

              {epilogueStep === 4 && (
                <div className="mt-12 text-8xl font-black italic tracking-[0.2em] uppercase relative text-emerald-500" style={{ animation: 'surge 3s infinite' }}>
                  <span className="relative z-10">COMPLETED</span>
                  <span className="absolute inset-0 opacity-40 translate-x-1 text-cyan-400" style={{ animation: 'aberration 1.5s infinite' }}>COMPLETED</span>
                  <span className="absolute inset-0 opacity-40 -translate-x-1 text-emerald-300" style={{ animation: 'aberration-alt 1.5s infinite' }}>COMPLETED</span>
                </div>
              )}
            </div>

            <div className="mt-20 flex flex-col items-center gap-4">
              <div className="h-px w-80 bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
              <div className="text-[11px] font-mono text-zinc-500 tracking-[0.8em] uppercase opacity-60 animate-pulse">
                Digital Forensics Session // STATUS_CLEARED
              </div>
            </div>

            {epilogueStep === 4 && (
              <button
                onClick={() => completeLevel(true, 150, 0)}
                className="mt-16 group relative px-16 py-8 bg-emerald-600 hover:bg-emerald-500 text-white font-black tracking-[0.3em] uppercase rounded-xl shadow-2xl transition-all hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-bottom duration-700"
              >
                <span className="relative z-10">Continue</span>
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const GhostStore = ({ 
    activeDialogue, 
    setActiveDialogue, 
    cluesFound, 
    activeClue, 
    setActiveClue, 
    handleDialogueComplete,
    handleClueDiscovery,
    showDetectiveBoard,
    setShowDetectiveBoard
  }) => {
    const [activePage, setActivePage] = useState('home');
    const [showChatWindow, setShowChatWindow] = useState(false);
    const [isAgentTyping, setIsAgentTyping] = useState(false);
    const [chatMessages, setChatMessages] = useState([
      { role: 'agent', text: 'Hello! Only 12 units left in Flash Sale. Need help checking out with UPI?' }
    ]);
    const [chatOptions, setChatOptions] = useState([
      { id: 'card', text: 'Can I pay with credit card?' },
      { id: 'cod', text: 'Is Cash on Delivery available?' },
      { id: 'gst', text: 'Can you provide your GSTIN number?' }
    ]);
    const [originalOptions] = useState([
      { id: 'card', text: 'Can I pay with credit card?' },
      { id: 'cod', text: 'Is Cash on Delivery available?' },
      { id: 'gst', text: 'Can you provide your GSTIN number?' }
    ]);
    const [clickedOptions, setClickedOptions] = useState([]);
    const [showWhoisModal, setShowWhoisModal] = useState(false);
    const [showReviewsHighlight, setShowReviewsHighlight] = useState(false);
    const [isPaymentVisible, setIsPaymentVisible] = useState(false);


    const handleChatOption = (option) => {
      setChatMessages(prev => [...prev, { role: 'user', text: option.text }]);
      const newClicked = [...clickedOptions, option.id];
      setClickedOptions(newClicked);
      setChatOptions([]);
      setIsAgentTyping(true);
      
      setTimeout(() => {
        setIsAgentTyping(false);
        if (option.id === 'gst') {
          setChatMessages(prev => [...prev, { role: 'agent', text: 'Sir/Madam, hurry! Only 8 units left now! Please pay via UPI immediately to secure your order. GST statement will be sent later.' }]);
        } else if (option.id === 'card') {
          setChatMessages(prev => [...prev, { role: 'agent', text: 'Only 10 units left! Our card gateway is under maintenance due to huge traffic. Only direct UPI transfers are working.' }]);
        } else if (option.id === 'cod') {
          setChatMessages(prev => [...prev, { role: 'agent', text: 'Stock is literally flying, 9 units left! COD is not available for promotional items with 90%+ discounts.' }]);
        }

        // Only give clue when all 3 options are clicked
        if (newClicked.length === 3) {
            handleClueDiscovery('pressure_chat');
            setChatOptions([]); // no more options
        } else {
            // Restore unclicked options
            setChatOptions(originalOptions.filter(opt => !newClicked.includes(opt.id)));
        }
      }, 1500);
    };

    return (
    <div className={`absolute top-0 bottom-0 left-0 bg-[#f4f5f9] flex flex-col font-sans animate-in slide-in-from-bottom-20 duration-1000 overflow-y-auto transition-all ${showDetectiveBoard ? 'w-[65%]' : 'w-full'}`}>
      {/* Browser Header */}
      <div className="sticky top-0 z-[50] bg-zinc-900 border-b border-black/80 px-2 py-2 flex flex-col gap-2 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex gap-2 ml-3">
            <div className="w-3 h-3 rounded-full bg-red-500/90 border border-red-900/50" />
            <div className="w-3 h-3 rounded-full bg-amber-500/90 border border-amber-900/50" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/90 border border-emerald-900/50" />
          </div>
          <div
            className="flex-1 max-w-4xl bg-[#1e1e1e] border border-white/10 rounded-lg h-8 flex items-center px-4 gap-3 cursor-pointer transition-all hover:bg-[#262626] group mx-auto relative shadow-inner"
            onClick={() => {
                setShowWhoisModal(true);
                handleClueDiscovery('domain_lookup');
            }}
          >
            <span className="text-white/40 text-sm">🔒</span>
            <span className="text-[13px] font-mono text-white/50 tracking-wide mt-[2px]">https://www.<span className="text-white">techdeals-india.shop</span>/{activePage === 'home' ? 'sale24' : activePage}</span>
            <div className="absolute inset-0 rounded-lg border border-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-cyan-600 text-white text-[11px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-all group-hover:translate-y-0 translate-y-2 whitespace-nowrap z-50 shadow-2xl before:absolute before:-top-1 before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-b-cyan-600">Inspect URL Metadata</div>
          </div>
          <div className="text-white/40 pr-3 flex gap-4">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
          </div>
        </div>
        {/* Bookmark Bar */}
        <div className="px-14 flex items-center gap-6 mt-1 mb-1 text-[11px] font-medium text-white/40">
           <div className="flex items-center gap-1.5 hover:text-white/80 cursor-pointer transition-colors"><span className="text-[#34a853]">★</span> Bookmarks</div>
           <div className="flex items-center gap-1.5 hover:text-white/80 cursor-pointer transition-colors">TechDeals Official</div>
           <div className="flex items-center gap-1.5 hover:text-white/80 cursor-pointer transition-colors">Order Tracking</div>
        </div>
      </div>

      {/* Website Content */}
      <div className="w-full bg-white flex-1 flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.1)]">
        {/* Top Promo Bar */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white text-[11px] text-center py-2 font-bold tracking-widest uppercase shadow-md relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-white/20"></div>
          SAMSUNG FESTIVAL SALE • UP TO 97% OFF ON GALAXY S24 ULTRA • FREE DELIVERY IN 24 HOURS
        </div>

        {/* Main Nav Banner */}
        <header className="py-6 px-16 flex justify-between items-center border-b border-gray-100 bg-white sticky top-16 z-40">
          <div className="flex items-center gap-6">
            <div className="text-black font-black text-4xl tracking-tighter" style={{ fontFamily: 'Arial, sans-serif' }}>SAMSUNG</div>
            <div className="h-8 w-px bg-gray-200"></div>
            <div className="text-gray-900 font-extrabold text-xl tracking-tight leading-none">
                <span className="text-blue-600 block text-[10px] uppercase tracking-widest mb-1">Authorized Channel</span>
                TechDeals India
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* False Positive Clue */}
            <div 
              className="hidden lg:flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-blue-600 cursor-pointer transition-colors mr-6 px-4 py-2 hover:bg-gray-50 rounded-lg"
              onClick={() => {
                showFeedback("False Alarm! This is a generic tracking button. (-5 pts)", "orange");
                adjustAssets(-5); 
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 16A1.5 1.5 0 0 1 4 17.5A1.5 1.5 0 0 1 2.5 16A1.5 1.5 0 0 1 4 14.5A1.5 1.5 0 0 1 5.5 16zM19.5 16A1.5 1.5 0 0 1 18 17.5A1.5 1.5 0 0 1 16.5 16A1.5 1.5 0 0 1 18 14.5A1.5 1.5 0 0 1 19.5 16z"></path></svg>
              <span>Track My Order</span>
            </div>
            <div
              className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-800 px-6 py-3 rounded-xl border border-emerald-200/60 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-sm shadow-emerald-900/5 group"
              onClick={() => handleClueDiscovery('fake_security')}
            >
              <span className="text-xl group-hover:animate-pulse">🔒</span>
              <div className="flex flex-col">
                  <span className="font-extrabold text-sm leading-tight text-emerald-900">100% Secure Checkout</span>
                  <span className="font-medium text-[10px] uppercase tracking-widest text-emerald-600">Verified Protection™</span>
              </div>
            </div>
          </div>
        </header>

        {activePage === 'home' && (
          <>
        {/* Primary Sale Section */}
        <section className="max-w-[1400px] mx-auto w-full p-16 pt-12 grid grid-cols-[1fr_1.1fr] gap-x-20">
          {/* Visuals Column */}
          <div className="space-y-8">
            <div className="relative aspect-[4/3] bg-[#f8f9fa] rounded-3xl flex items-center justify-center p-12 overflow-hidden group hover:shadow-[0_40px_80px_rgba(0,0,0,0.07)] transition-all duration-700 border border-gray-200">
                {/* Radial gradient background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(0,0,0,0.02)_0%,_transparent_100%)]"></div>

              {/* Realistic Phone Mock View */}
              <div className="w-[48%] h-[88%] bg-[#1a1a1a] rounded-[2.5rem] shadow-[-20px_20px_60px_rgba(0,0,0,0.2)] border-2 border-[#666] relative transform rotate-[-4deg] group-hover:rotate-0 transition-transform duration-700 flex items-center justify-center overflow-hidden group-hover:scale-105 z-10">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0f1c] via-[#1a2333] to-[#0f172a] border-[6px] border-[#111] rounded-[2.4rem] overflow-hidden">
                  
                  {/* Phone Bezel Reflection */}
                  <div className="absolute inset-0 rounded-[2.2rem] ring-1 ring-white/10 inset-ring-1 inset-ring-black/50 z-20 pointer-events-none"></div>
                  
                  {/* Screen Glare */}
                  <div className="absolute top-0 -left-[100%] w-[50%] h-[200%] bg-gradient-to-r from-transparent via-white/5 to-transparent rotate-[35deg] transform group-hover:translate-x-[400%] transition-transform duration-1000 z-10"></div>
                  
                  {/* Mock Screen UI Content */}
                  <div className="w-full h-full relative z-0 flex flex-col">
                      {/* Status Bar */}
                      <div className="h-8 flex justify-between items-center px-5 pt-1">
                          <span className="text-white/60 text-[10px] font-medium tracking-wide">10:42</span>
                          <div className="flex gap-1.5 opacity-60">
                              <div className="w-3 h-2.5 border border-white rounded-[2px] relative"><div className="w-[8px] h-full bg-white rounded-sm"></div></div>
                          </div>
                      </div>
                      
                      {/* App Content Fake */}
                      <div className="flex-1 px-4 pt-10 pb-4 flex flex-col">
                          <div className="text-4xl font-light text-white leading-tight mb-8 opacity-90"><span className="block text-blue-400 font-normal">Galaxy</span> AI is here</div>
                          <div className="mt-auto flex gap-3 mb-6">
                              <div className="flex-1 h-32 bg-white/10 rounded-2xl backdrop-blur-md"></div>
                              <div className="flex-1 h-32 bg-white/10 rounded-2xl backdrop-blur-md"></div>
                          </div>
                          <div className="h-14 bg-white/10 rounded-full backdrop-blur-md flex items-center justify-between px-6 border border-white/5">
                              <div className="h-1 w-1/3 bg-white/30 rounded-full mx-auto"></div>
                          </div>
                      </div>
                  </div>
                </div>
                {/* Hardware Buttons */}
                <div className="absolute -right-[4px] top-1/4 h-16 w-1 bg-[#333] rounded-l-md"></div>
                <div className="absolute -right-[4px] top-[15%] h-10 w-1 bg-[#333] rounded-l-md"></div>
              </div>

              {/* Fake Promotional Floating Badge */}
               <div className="absolute top-8 left-8 bg-black text-white font-black px-5 py-3 rounded-lg shadow-2xl text-sm tracking-widest flex items-center gap-3 z-30">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  FLASH SALE 97% OFF
              </div>
            </div>
            {/* Thumbnail Gallery */}
            <div className="flex gap-5 justify-center mt-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`w-24 h-24 rounded-2xl border-2 hover:border-blue-600 cursor-pointer transition-all flex items-center justify-center p-2 ${i === 1 ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-transparent bg-[#f8f9fa] hover:bg-white hover:shadow-md'}`}>
                  <div className={`w-10 h-16 rounded shadow-sm border ${i === 1 ? 'bg-gradient-to-tr from-slate-900 to-slate-800 border-slate-700' : 
                                                                    i === 2 ? 'bg-gradient-to-tr from-[#3f3f46] to-[#d4d4d8] border-gray-400' : 
                                                                    i === 3 ? 'bg-gradient-to-tr from-[#fcd34d] to-[#fffbeb] border-amber-200' : 
                                                                    'bg-gradient-to-tr from-[#e2e8f0] to-white border-gray-200'}`}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Details Column */}
          <div className="flex flex-col">
            <div className="space-y-3 mb-10">
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-sm text-xs font-bold uppercase tracking-widest mb-2 border border-blue-100">
                  <span>Choice</span>
                  <span className="opacity-50">#1 Top Rated</span>
              </div>
              <h1 className="text-5xl font-black tracking-tight text-gray-900 leading-[1.1]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
                Galaxy S24 Ultra, 256GB, Titanium Gray (Unlocked)
              </h1>
              <div className="flex items-center gap-4 mt-4 text-sm font-medium">
                <div className="flex items-center gap-1.5 text-[#ff9e00]">
                  <span className="text-xl -mt-1">★★★★★</span>
                  <span className="text-gray-800 font-bold ml-1 text-base">4.9</span>
                </div>
                <div className="w-[1px] h-4 bg-gray-300"></div>
                <span className="text-blue-600 hover:underline cursor-pointer transition-colors">(114 Verified Ratings)</span>
                <div className="w-[1px] h-4 bg-gray-300"></div>
                <span className="text-emerald-600 font-bold flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>In Stock. Ready to ship.</span>
              </div>
            </div>

            {/* Pricing Box highly manicured */}
            <div 
              className="bg-gradient-to-br from-[#fcfcfd] to-[#f4f5f9] p-10 rounded-[2.5rem] shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-200 relative overflow-hidden group hover:border-red-400/50 cursor-pointer transition-all"
              onClick={() => handleClueDiscovery('too_good_to_be_true')}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
              
              <div className="flex flex-col gap-2 relative z-10">
                <div className="flex items-start gap-1 text-red-600 font-black text-2xl tracking-tight mb-2">
                    <span className="text-3xl mt-1.5">-97%</span>
                </div>
                <div className="flex items-start gap-1">
                  <span className="text-[20px] text-gray-900 font-bold mt-2">₹</span>
                  <span className="text-[72px] font-black text-gray-900 tracking-tighter leading-none" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>2,499</span>
                  <span className="text-[20px] text-gray-900 font-bold mt-2">00</span>
                </div>
                
                <div className="flex items-center gap-4 text-sm mt-3">
                  <span className="text-gray-500 font-medium">Original Price: <span className="line-through decoration-gray-400">₹1,29,999.00</span></span>
                  <div className="px-3 py-1 bg-green-100 text-green-800 rounded font-bold uppercase tracking-wider text-[10px]">You Save: ₹1,27,500</div>
                </div>
                <p className="text-[13px] text-gray-500 font-medium mt-1">Inclusive of all taxes. Fast & Free delivery applied.</p>
              </div>

              <div className="h-px w-full bg-gray-200 my-8 relative z-10"></div>

              <div className="flex items-center justify-between bg-red-50 text-red-800 px-6 py-4 rounded-xl border border-red-200/50 relative z-10">
                <div className="flex items-center gap-3">
                     <span className="text-2xl animate-pulse">⏰</span>
                     <div className="flex flex-col">
                         <span className="font-extrabold text-[13px] uppercase tracking-wider">Flash Sale Ends In</span>
                         <span className="font-mono text-xs opacity-70">Price goes up to ₹1,29,999</span>
                     </div>
                </div>
                <span className="font-black tabular-nums text-3xl font-mono tracking-tighter">02:14:33</span>
              </div>

              {/* Payment Options (Clue 5) Designed as a Checkout Selection */}
              <div
                className={`mt-8 border-2 border-transparent bg-white rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 ring-1 ring-gray-200 relative z-10 ${isPaymentVisible ? 'hover:border-red-400/50 hover:shadow-[0_10px_40px_rgba(239,68,68,0.15)] cursor-pointer group' : ''}`}
                onClick={() => {
                   if (isPaymentVisible) handleClueDiscovery('payment_trap');
                }}
              >
                {!isPaymentVisible ? (
                  <div className="p-8 flex flex-col items-center justify-center text-center bg-gray-50/50 backdrop-blur-sm">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 shadow-inner">
                         <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" strokeWidth="2" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                      </div>
                      <h4 className="font-black text-gray-900 text-lg mb-2">Secure Payment Gateway</h4>
                      <p className="text-gray-500 text-sm mb-6 max-w-xs">Complete your order securely to reserve your device at the discounted price.</p>
                      <button 
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-[0_4px_14px_rgba(37,99,235,0.3)] transition-all flex items-center gap-2 group hover:scale-105"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsPaymentVisible(true);
                        }}
                      >
                         <span>View Payment Options</span>
                         <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" className="group-hover:translate-x-1 transition-transform"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                      </button>
                  </div>
                ) : (
                  <>
                    <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 flex justify-between items-center backdrop-blur-sm animate-in fade-in">
                      <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black">1</div>
                          <span className="font-black text-gray-900 text-[15px] uppercase tracking-wide">Payment Method</span>
                      </div>
                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-widest bg-white px-2 py-1 rounded shadow-sm">Required</span>
                    </div>
                    <div className="p-6 flex flex-col gap-5 animate-in slide-in-from-top-4 duration-500">
                      <label className="flex items-start gap-4 cursor-pointer group-hover:bg-blue-50/30 p-2 -m-2 rounded-lg transition-colors relative z-20">
                        <div className="mt-1 w-5 h-5 rounded-full border-[5px] border-blue-600 bg-white shadow-sm ring-2 ring-blue-600/20 flex-shrink-0"></div>
                        <div className="flex flex-col">
                          <span className="text-[15px] font-black text-gray-900 flex items-center gap-2">
                            Direct UPI Transfer 
                            <span className="text-[9px] bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-0.5 rounded shadow-sm font-bold uppercase tracking-widest">Recommended Fastest</span>
                          </span>
                          <span className="text-[13px] text-gray-500 mt-1.5 font-medium flex items-center gap-2">
                              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" className="text-gray-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                              Pay automatically to: <span className="font-mono bg-gray-100 px-2 rounded text-gray-800 font-bold border border-gray-200">techdeals2024@ybl</span>
                          </span>
                        </div>
                      </label>
                      
                      <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                      
                      <label className="flex items-start gap-4 opacity-40 cursor-not-allowed grayscale">
                        <div className="mt-1 w-5 h-5 rounded-full border-2 border-gray-300 bg-gray-50 flex-shrink-0"></div>
                        <div className="flex flex-col">
                          <span className="text-[15px] font-bold text-gray-900 flex items-center gap-2">Credit / Debit Card</span>
                          <span className="text-[12px] text-red-600 mt-1 font-bold bg-red-50 inline-flex self-start px-2 py-0.5 rounded">⚠ Temporarily disabled for flash sales</span>
                        </div>
                      </label>
                      
                      <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                      
                      <label className="flex items-start gap-4 opacity-40 cursor-not-allowed grayscale">
                        <div className="mt-1 w-5 h-5 rounded-full border-2 border-gray-300 bg-gray-50 flex-shrink-0"></div>
                        <div className="flex flex-col">
                          <span className="text-[15px] font-bold text-gray-900">Cash on Delivery (COD)</span>
                          <span className="text-[12px] text-red-600 mt-1 font-bold bg-red-50 inline-flex self-start px-2 py-0.5 rounded">⚠ Not eligible on 90%+ discounted items</span>
                        </div>
                      </label>
                    </div>
                    <div className="p-6 bg-gray-50/50 border-t border-gray-100 animate-in slide-in-from-top-6 duration-700 relative z-30">
                      <button
                        className="w-full bg-[#fdd835] hover:bg-[#fbc02d] text-gray-900 font-black py-5 rounded-2xl text-[16px] shadow-[0_4px_14px_rgba(253,216,53,0.4)] transition-all border border-[#fbc02d] uppercase tracking-wider flex justify-center items-center gap-3 group-hover:scale-[1.02] cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOutcomeType('scam');
                          setGameState('outcome');
                        }}
                      >
                        <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        Proceed to Pay Securely
                      </button>
                      <div className="text-center mt-4 pointer-events-none">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                              <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                              SSL Encrypted Transaction
                          </span>
                      </div>
                    </div>
                  </>
                )}
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
            onClick={() => {
                setShowReviewsHighlight(true);
                handleClueDiscovery('fake_reviews');
            }}
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
                <p className={`text-sm leading-relaxed transition-colors ${showReviewsHighlight ? 'bg-red-100 text-red-800 font-bold px-1 rounded' : 'text-gray-600'}`}>
                  "I received the phone in 2 days. The packaging was perfect and the phone works flawlessly. TechDeals is truly the best shopping site in India. I am very happy."
                </p>
                <div className={`text-xs transition-colors ${showReviewsHighlight ? 'text-red-600 font-bold' : 'text-gray-400'}`}>Reviewed in India on 3 Days Ago</div>
              </div>
            ))}
          </div>
        </section>
        </>
        )}

        {/* Multi-Stage Pages */}
        {activePage === 'about' && (
             <section className="max-w-[1200px] mx-auto w-full p-16 min-h-[500px] animate-in slide-in-from-right duration-500">
               <h1 className="text-4xl font-extrabold mb-8 text-gray-900 border-b-2 border-gray-100 pb-4">About TechDeals India</h1>
               <div className="prose prose-lg text-gray-600 max-w-4xl space-y-6">
                 <p>Welcome to TechDeals India, your number one source for the latest electronics and smartphones at unparalleled prices.</p>
                 <p>We're dedicated to giving you the very best of consumer technology, with a focus on fast shipping, stellar customer service, and absolute security.</p>
                 <p>Founded with the vision to make premium smartphones accessible to everyone, we have quickly become the fastest-growing online retailer in the country.</p>
                 <div className="mt-8 p-6 bg-blue-50 border border-blue-100 rounded-xl">
                   <h3 className="text-xl font-bold text-blue-900 mb-2">Our Mission</h3>
                   <p className="text-blue-800">To provide flash sales that disrupt the industry standards. <span className="font-bold cursor-pointer hover:underline text-blue-600" onClick={() => setActivePage('legal')}>Read our Legal Policies</span> for more information on how we operate.</p>
                 </div>
               </div>
             </section>
        )}

        {activePage === 'legal' && (
             <section className="max-w-[1200px] mx-auto w-full p-16 min-h-[500px] animate-in slide-in-from-right duration-500">
               <h1 className="text-4xl font-extrabold mb-8 text-gray-900 border-b-2 border-gray-100 pb-4">Legal & Privacy Policies</h1>
               <div className="prose prose-lg text-gray-600 max-w-4xl space-y-6">
                 <p>We respect your privacy. Any personal information you provide to us including and similar to your name, address, telephone number and e-mail address will not be released, sold, or rented to any entities or individuals outside of our organization.</p>
                 
                 <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-4">Credit card details</h2>
                 <p>For your absolute security we never process credit card info. We rely exclusively on direct peer-to-peer UPI networks to ensure your money stays in your control.</p>
                 
                 <div className="mt-8 p-6 bg-amber-50 border border-amber-100 rounded-xl">
                   <h3 className="text-xl font-bold text-amber-900 mb-2">Detailed Terms</h3>
                   <p className="text-amber-800">By using our services, you agree to our comprehensive <span className="font-bold cursor-pointer hover:underline text-amber-600" onClick={() => setActivePage('terms')}>Terms of Service</span>. Please review them carefully.</p>
                 </div>
               </div>
             </section>
        )}

        {activePage === 'terms' && (
             <section className="max-w-[1200px] mx-auto w-full p-16 min-h-[500px] animate-in slide-in-from-right duration-500">
               <h1 className="text-4xl font-extrabold mb-8 text-gray-900 border-b-2 border-gray-100 pb-4">Terms of Service</h1>
               <div className="prose text-sm text-gray-500 max-w-4xl space-y-4">
                 <p>These terms and conditions outline the rules and regulations for the use of TechDeals's Website.</p>
                 <p>By accessing this website we assume you accept these terms and conditions. Do not continue to use TechDeals if you do not agree to take all of the terms and conditions stated on this page.</p>
                 <br/><br/><br/><br/>
                 <div 
                    className="p-6 bg-gray-50 border border-gray-200 rounded text-xs text-gray-400 hover:bg-white hover:border-red-200 hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => handleClueDiscovery('contact_forensics')}
                 >
                    <h4 className="font-bold text-gray-600 mb-2 group-hover:text-red-600 transition-colors">7. Corporate Entity Information</h4>
                    <p>TechDeals operates as an independent facilitation platform. The website owners are not liable for direct, indirect, or consequential loss.</p>
                    <p className="mt-2 text-[10px] font-mono opacity-60">Registered Business Entity Info: N/A.</p>
                    <p className="mt-1 text-[10px] font-mono opacity-60">GSTIN: NOT PROVIDED.</p>
                    <p className="mt-1 text-[10px] font-mono opacity-60">Physical Operations: Undisclosed.</p>
                    <div className="text-red-500 font-bold mt-3 text-xs uppercase tracking-wider group-hover:opacity-100 opacity-0 transition-opacity">
                      ⚠️ CLICK TO LOG ENTITY FRAUD
                    </div>
                 </div>
               </div>
             </section>
        )}

        {/* Footer Section (Contact/Policy) */}
        <footer className="bg-[#232F3E] text-white p-16 pb-32 mt-auto">
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
                className="space-y-3 text-sm text-gray-300 font-medium overflow-hidden relative p-3 -ml-3 rounded transition-colors hover:bg-white/5 border border-transparent"
              >
                <div className="flex gap-3 items-center"><span className="opacity-70">📱</span> +91 89XXXXXXXX (WhatsApp Only)</div>
                <div className="flex gap-3 items-center"><span className="opacity-70">✉️</span> techdeals.india2024@gmail.com</div>
                <div className="flex gap-3 items-center"><span className="opacity-70">🏢</span> Shop 14, Commercial Complex, Delhi</div>
                <div 
                    className="mt-4 pt-4 border-t border-gray-700/50 text-blue-400 hover:text-white cursor-pointer transition-colors text-xs font-bold uppercase tracking-wider"
                    onClick={(e) => {
                        e.stopPropagation();
                        setActivePage('about');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                >
                    Learn more About Us →
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Interactive Chatbot */}
      {showChatWindow ? (
        <div className="fixed bottom-8 right-8 w-[320px] h-[450px] bg-white rounded-xl shadow-[0_15px_50px_rgba(0,0,0,0.3)] flex flex-col border border-gray-200 overflow-hidden z-[200] animate-in slide-in-from-bottom flex flex-col">
          <div className="bg-[#007185] text-white p-4 font-bold text-sm flex items-center justify-between shadow-md z-10">
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="w-3 h-3 rounded-full bg-green-400 absolute -bottom-1 -right-1 border-2 border-[#007185]"></span>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-lg">👩‍💼</div>
              </div>
              <div className="flex flex-col">
                <span className="leading-tight">Riya (Agent)</span>
                <span className="text-[10px] text-white/70 font-medium">Customer Support</span>
              </div>
            </div>
            <span className="cursor-pointer text-xl hover:bg-white/20 w-8 h-8 flex items-center justify-center rounded-full transition-colors" onClick={() => setShowChatWindow(false)}>×</span>
          </div>
          <div className="flex-1 bg-gray-50 p-4 overflow-y-auto flex flex-col gap-3">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}>
                  <div className={`p-3 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-[#007185] text-white rounded-tr-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'}`}>
                      {msg.text}
                  </div>
              </div>
            ))}
            {isAgentTyping && (
                <div className="self-start bg-white p-3 rounded-2xl rounded-tl-sm border border-gray-200 shadow-sm flex items-center gap-1.5 w-16 h-10">
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{animationDelay: '0ms'}}></span>
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{animationDelay: '150ms'}}></span>
                    <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{animationDelay: '300ms'}}></span>
                </div>
            )}
            <div className="mt-auto pt-4 flex flex-col gap-2">
              {chatOptions.map(opt => (
                  <button 
                    key={opt.id}
                    onClick={() => handleChatOption(opt)}
                    className="bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-bold py-2.5 px-3 rounded-xl text-left shadow-sm transition-colors w-full"
                  >
                      {opt.text}
                  </button>
              ))}
            </div>
          </div>
          <div className="border-t border-gray-200 p-3 bg-white flex gap-2">
            <input type="text" disabled placeholder="Select an option above..." className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-not-allowed border border-gray-200" />
            <button disabled className="bg-[#007185] opacity-50 text-white p-2 rounded-lg cursor-not-allowed">
               <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </div>
      ) : (
        <div
          className="fixed bottom-8 right-8 w-[250px] bg-white rounded-t-xl rounded-bl-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] flex flex-col cursor-pointer border border-gray-200 overflow-hidden hover:shadow-[0_15px_50px_rgba(0,0,0,0.3)] transition-all z-[200] group animate-bounce"
          onClick={() => setShowChatWindow(true)}
        >
          <div className="bg-[#007185] text-white p-3 font-bold text-sm flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Chat Support (1)</div>
            <span>+</span>
          </div>
          <div className="p-4 bg-gray-50 flex flex-col gap-2">
            <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm text-xs text-gray-700 font-medium self-start inline-block">
              {chatMessages[chatMessages.length - 1].text}
            </div>
          </div>
        </div>
      )}

      {/* WHOIS Modal Overlay (for URL inspect) */}
      {showWhoisModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowWhoisModal(false)}>
            <div className="bg-zinc-900 border border-zinc-700 w-full max-w-2xl rounded-lg overflow-hidden shadow-2xl font-mono text-sm animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="bg-zinc-800 px-4 py-2 border-b border-zinc-700 flex justify-between items-center text-zinc-300">
                    <div className="flex gap-2">
                        <span className="text-red-500">●</span>
                        <span className="text-amber-500">●</span>
                        <span className="text-emerald-500">●</span>
                    </div>
                    <span className="font-bold">Terminal - whois techdeals-india.shop</span>
                    <span className="cursor-pointer hover:text-white" onClick={() => setShowWhoisModal(false)}>✕</span>
                </div>
                <div className="p-6 text-emerald-400 h-[300px] overflow-y-auto w-full leading-relaxed">
                    <p className="opacity-70 mb-4">$ whois techdeals-india.shop</p>
                    <p>Domain Name: techdeals-india.shop</p>
                    <p>Registry Domain ID: 329188204_DOMAIN_SHOP-VRSN</p>
                    <p>Registrar WHOIS Server: whois.namesilo.com</p>
                    <p className="text-red-400 font-bold bg-red-400/10 inline-block px-1">Creation Date: 2024-03-01T14:22:11Z (19 days ago)</p>
                    <p className="text-amber-400 font-bold bg-amber-400/10 mt-2 p-2 rounded">
                       WARNING: Domain Age is extremely young.<br/>
                       High risk indicator for e-commerce sites.
                    </p>
                    <p className="mt-4">Registrar: NameSilo, LLC</p>
                    <p>Registrant Organization: PrivacyGuardian.org</p>
                    <p>Registrant State/Province: Arizona</p>
                    <p className="text-red-400 font-bold bg-red-400/10 inline-block px-1 mt-2">Registrant Country: US (Hidden by Proxy)</p>
                    <p className="mt-4">Name Server: ns1.dns-parking.com</p>
                    <p>Name Server: ns2.dns-parking.com</p>
                    <p className="text-zinc-500 mt-4">DNSSEC: unsigned</p>
                    <p className="text-zinc-500">{'>>>'} Last update of WHOIS database: 2024-03-20T00:00:00Z {'<<<'}</p>
                </div>
            </div>
        </div>
      )}

      {/* CINEMATIC INTERNAL MONOLOGUE OVERLAY */}
      {activeDialogue && (
          <div className="fixed inset-0 z-[5000] pointer-events-auto flex flex-col justify-end">
              {/* Full screen dim */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-700"></div>
              
              <div className="absolute bottom-24 w-full text-center animate-fadeInSlow flex flex-col items-center">
                  <p className="text-white text-4xl font-serif italic tracking-wide drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] px-16 leading-relaxed max-w-6xl mx-auto mb-16">
                      "{activeDialogue === 'domain_lookup' && "Wait... this website was registered only 19 days ago? And the owner's identity is hidden behind a proxy in the US? That's a huge red flag for a so-called established business."}
                      {activeDialogue === 'fake_reviews' && "These reviews... They all sound identical and generic. One says 'received in 2 days' but was posted 3 days ago for a site created 19 days ago? Definitely artificially scripted."}
                      {activeDialogue === 'pressure_chat' && "That's odd. The customer support agent isn't answering my questions about payment options or GST details. They are just creating panic about stock and rushing me to pay via UPI."}
                      {activeDialogue === 'contact_forensics' && "No corporate entity listed? The GSTIN number is 'NOT PROVIDED' and their physical operations are undisclosed... Who am I actually buying this from at this point?"}
                      {activeDialogue === 'vague_policy' && "A 45-60 day return policy that requires 'management approval'? And no chargebacks allowed on flash sale items? They're legally ensuring I can't get my money back."}
                      {activeDialogue === 'fake_security' && "100% Secure Checkout? Verified Protection? These are just static text labels, not actual certificates. Scammers add these to build fake trust."}
                      {activeDialogue === 'payment_trap' && "They've disabled Credit Cards and COD... only direct UPI to a personal account? That means zero protection for me once the money leaves my account."}
                      {activeDialogue === 'too_good_to_be_true' && "₹2,499 for a Galaxy S24 Ultra? That's a 97% discount on a flagship device. It's not just a 'deal'—it's a mathematical impossibility used to bait victims."}"
                  </p>
                  
                  {/* Interaction Prompt (Press E) */}
                  <div 
                      className="flex flex-col items-center gap-3 cursor-pointer group animate-pulse hover:animate-none transition-all"
                      onClick={() => handleDialogueComplete(activeDialogue)}
                  >
                      <div className="w-14 h-14 rounded-full border border-white/30 flex items-center justify-center bg-black/40 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.1)] group-hover:bg-white/10 group-hover:border-white/60 transition-colors">
                          <span className="text-white font-bold text-xl shadow-sm">E</span>
                      </div>
                      <span className="text-[10px] text-white/50 uppercase tracking-[0.3em] font-bold group-hover:text-white transition-colors drop-shadow-md">Log Clue</span>
                  </div>
              </div>
          </div>
      )}

      {/* DETECTIVE POPUP (Clue details) removed as redundant */}


    </div>
    );
  };

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
            <span style={{ color: cluesFound.length > 3 ? '#ef4444' : cluesFound.length > 1 ? '#eab308' : '#22c55e' }}>{cluesFound.length}/7 CLUES</span>
          </h3>
          <div className="w-full h-4 bg-zinc-950 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${(cluesFound.length / 7) * 100}%`,
                backgroundColor: cluesFound.length > 3 ? '#ef4444' : cluesFound.length > 1 ? '#eab308' : '#22c55e'
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
    <div className="absolute inset-0 z-[1000] flex flex-col items-center justify-center p-12 text-center overflow-hidden">
      {/* Background Image & Overlay */}
      <img src="/assets/living_pov.png" alt="Living POV" className="absolute inset-0 w-full h-full object-cover z-0" />
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-10"></div>
      
      <div className="max-w-4xl space-y-16 relative z-20 animate-in fade-in zoom-in duration-500">
        <div className="w-40 h-40 bg-indigo-600 rounded-[55px] flex items-center justify-center text-8xl mx-auto shadow-[0_0_80px_rgba(79,70,229,0.5)] border-4 border-indigo-400 animate-pulse italic">👵</div>
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
              setShowWhatsAppWarn(true);
              // don't change game state yet, keep Outcome background beneath
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

  const TitleCard = () => (
    <div className="absolute inset-0 bg-black z-[1000] flex flex-col items-center justify-center animate-cinematic-sequence">
      <div className="flex flex-col items-center relative">
        {/* Dramatic pulse rings */}
        <div className="absolute inset-0 bg-red-500/20 rounded-full blur-3xl animate-ping scale-[2.5] opacity-50" />

        <div className="h-px w-32 bg-gradient-to-r from-transparent via-red-500 to-transparent mb-8 animate-[width_1.5s_ease-in-out]" />

        <h2 className="text-white text-6xl font-black tracking-[0.4em] uppercase mb-4 relative opacity-0" style={{ animation: 'fadeIn 1s forwards, surge 3s infinite' }}>
          <span className="relative z-10">Level 8</span>
          {/* Chromatic aberration layers */}
          <span className="absolute inset-0 text-red-500 opacity-60 translate-x-1 -z-10 animate-aberration">Level 8</span>
          <span className="absolute inset-0 text-cyan-400 opacity-60 -translate-x-1 -z-10 animate-aberration-alt">Level 8</span>
        </h2>

        <h3 className="text-red-500 text-lg font-mono tracking-[0.8em] uppercase opacity-0 font-bold" style={{ animation: 'fadeIn 1s forwards 1.2s' }}>
          Identifying Digital Illusions
        </h3>

        <div className="h-px w-32 bg-gradient-to-r from-transparent via-red-500 to-transparent mt-12 animate-[width_1.5s_ease-in-out]" />

        {/* Tension metadata */}
        <div className="mt-8 text-[8px] font-mono text-zinc-800 tracking-widest uppercase animate-pulse">
            Establishing Secure Connection... [33%] [66%] [99%]
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full bg-black relative selection:bg-cyan-500/30 overflow-hidden font-sans">
      <div className={`fixed inset-0 bg-black z-[1000] pointer-events-none transition-opacity duration-700 ${isTransitioning ? 'opacity-100' : 'opacity-0'}`} />
      
      {gameState === 'garden' && Garden()}
      {gameState === 'living-room' && LivingRoom()}
      {gameState === 'living-pov' && LivingPov()}
      {gameState === 'title-card' && TitleCard()}
      {gameState === 'website' && <GhostStore 
        activeDialogue={activeDialogue} 
        setActiveDialogue={setActiveDialogue} 
        cluesFound={cluesFound} 
        activeClue={activeClue} 
        setActiveClue={setActiveClue} 
        handleDialogueComplete={handleDialogueComplete} 
        handleClueDiscovery={handleClueDiscovery}
        showDetectiveBoard={showDetectiveBoard}
        setShowDetectiveBoard={setShowDetectiveBoard}
      />}
      {gameState === 'outcome-pre' && <OutcomeDecision />}
      {gameState === 'outcome' && <OutcomeFinal />}
      {gameState === 'epilogue' && <Epilogue />}
      {gameState === 'cybercrime-portal' && <CybercrimePortal />}

      {showWhatsApp && <WhatsAppThread />}
      {showWhatsAppWarn && <WhatsAppWarnThread />}

      {showDetectiveBoard && <EvidenceBoard />}

      {/* DETECTIVE MODE HUD BUTTON */}
      {!['title-card', 'outcome', 'outcome-pre', 'cybercrime-portal'].includes(gameState) && (
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
      )}



      <style dangerouslySetInnerHTML={{
        __html: `
        .animate-cinematic-sequence { animation: cinematic-sequence 4s forwards; }
        .animate-aberration { animation: aberration 1.5s infinite; }
        .animate-aberration-alt { animation: aberration-alt 1.5s infinite; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes surge {
            0%, 100% { transform: scale(1); filter: brightness(1); }
            50% { transform: scale(1.08); filter: brightness(1.3); drop-shadow: 0 0 40px rgba(255,255,255,0.4); }
        }
        @keyframes cinematic-sequence {
            0% { opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { opacity: 0; }
        }
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
        @keyframes scanLine { from { transform: translateY(-100%); } to { transform: translateY(200%); } }
        @keyframes strikeThrough { from { width: 0; } to { width: 120%; } }
        `
      }} />
    </div>
  );
};

export default Level8;
