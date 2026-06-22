import React, { useEffect, useState, useRef } from 'react';
import { useGameState } from '../context/GameStateContext';
import InteractionPrompt from '../components/InteractionPrompt';
import Player from '../components/Player';

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

const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
};

const describeArc = (x, y, radius, startAngle, endAngle) => {
    // Handle full circle wrap-around edge case safely
    let start = startAngle % 360;
    let end = endAngle % 360;
    if (start < 0) start += 360;
    if (end < 0) end += 360;
    
    // If end is smaller than start, it wraps around 360
    const startPoint = polarToCartesian(x, y, radius, end);
    const endPoint = polarToCartesian(x, y, radius, start);
    
    const diff = end >= start ? end - start : (360 - start) + end;
    const largeArcFlag = diff <= 180 ? "0" : "1";
    
    const d = [
        "M", startPoint.x, startPoint.y,
        "A", radius, radius, 0, largeArcFlag, 0, endPoint.x, endPoint.y
    ].join(" ");
    return d;
};

const DIALOGUE_TREE = {
    opening: {
        agent: ["Good morning. Am I speaking with Mr. Arjun Mehta?"],
        choices: [
            { text: "Yes, this is Arjun.", next: 'opening_a' },
            { text: "Who's calling?", next: 'opening_b' },
            { text: "What is this regarding?", next: 'opening_c' },
            { text: "How did you get my number?", next: 'opening_d' }
        ]
    },
    opening_a: {
        agent: [
            "This is Vikram Sharma from FedEx International Compliance regarding a shipment linked to your Aadhaar."
        ],
        next: 'the_parcel'
    },
    opening_b: {
        agent: [
            "This is Vikram Sharma from FedEx. A parcel under your name has been detained by Customs."
        ],
        next: 'the_parcel'
    },
    opening_c: {
        agent: [
            "It concerns an international parcel under investigation that is connected to your identity."
        ],
        next: 'the_parcel'
    },
    opening_d: {
        agent: [
            "Your number is listed as the contact associated with this shipment's documents."
        ],
        next: 'the_parcel'
    },
    the_parcel: {
        agent: [
            "A parcel from Dubai booked under your Aadhaar was intercepted at Mumbai Airport with serious irregularities."
        ],
        choices: [
            { text: "What kind of irregularities?", next: 'parcel_a' },
            { text: "I've never shipped anything from Dubai.", next: 'parcel_b' },
            { text: "What exactly was found?", next: 'parcel_c' },
            { text: "This sounds suspicious.", next: 'parcel_d' }
        ]
    },
    parcel_a: {
        agent: [
            "Customs officers discovered prohibited items inside the shipment."
        ],
        next: 'personal_questions'
    },
    parcel_b: {
        agent: [
            "Which is exactly why we are contacting you to investigate this misuse."
        ],
        next: 'personal_questions'
    },
    parcel_c: {
        agent: [
            "The package contained narcotics, forged passports, and international banking cards."
        ],
        next: 'personal_questions'
    },
    parcel_d: {
        agent: [
            "Unfortunately, this illegal shipment is already under official police review."
        ],
        next: 'personal_questions'
    },
    personal_questions: {
        agent: [
            "Mr. Mehta, have you recently shared your Aadhaar card with anyone?"
        ],
        choices: [
            { text: "No.", next: 'personal_a' },
            { text: "Maybe during KYC.", next: 'personal_b' },
            { text: "Why are you asking?", next: 'personal_c' },
            { text: "I won't answer until I verify who you are.", next: 'personal_d' }
        ]
    },
    personal_a: {
        agent: [
            "Then your identity has likely been stolen and misused."
        ],
        next: 'tracking_info'
    },
    personal_b: {
        agent: [
            "That explains how the smugglers obtained your details."
        ],
        next: 'tracking_info'
    },
    personal_c: {
        agent: [
            "We must determine if you are involved or a victim of identity theft."
        ],
        next: 'tracking_info'
    },
    personal_d: {
        agent: [
            "Delays may complicate the investigation, but you are free to verify later."
        ],
        next: 'tracking_info'
    },
    tracking_info: {
        agent: [
            "..."
        ],
        choices: [
            { text: "Can you give me the tracking number?", next: 'tracking_a' },
            { text: "Can you send me proof?", next: 'tracking_b' },
            { text: "Can you send me an official email?", next: 'tracking_c' },
            { text: "Just continue.", next: 'tracking_d' }
        ]
    },
    tracking_a: {
        agent: [
            "Tracking Number: FDX-INT-MUM-9921-CR."
        ],
        next: 'escalation'
    },
    tracking_b: {
        agent: [
            "I will send supporting documents directly to your phone."
        ],
        next: 'escalation'
    },
    tracking_c: {
        agent: [
            "Yes, I will arrange an official email shortly."
        ],
        next: 'escalation'
    },
    tracking_d: {
        agent: [
            "Very well, proceeding."
        ],
        next: 'escalation'
    },
    escalation: {
        agent: [
            "Because narcotics are involved, this case has been referred to the Cyber Crime Division.",
            "I am transferring you to the investigating officer now. Please stay on the line."
        ],
        choices: [
            { text: "Okay.", next: 'escalation_a' },
            { text: "I don't understand what's happening.", next: 'escalation_b' },
            { text: "Before that, I want to verify this with FedEx.", next: 'escalation_c' },
            { text: "I think this is a scam.", next: 'escalation_d' }
        ]
    },
    escalation_a: {
        agent: [
            "Please remain on the line."
        ],
        next: 'transfer_scene'
    },
    escalation_b: {
        agent: [
            "The investigating officer will explain everything. Stay on the line."
        ],
        next: 'transfer_scene'
    },
    escalation_c: {
        agent: [
            "You may verify, but the transfer must proceed immediately."
        ],
        next: 'transfer_scene'
    },
    escalation_d: {
        agent: [
            "We have your Aadhaar card details. This is an official legal matter."
        ],
        next: 'transfer_scene'
    },
    transfer_scene: {
        agent: [
            "Transferring your case to Senior Officer Rajesh Sharma. Please hold."
        ],
        isTransfer: true
    },

    // ================= ZOOM SCENE 2 ================= //
    zoom_intro: {
        agent: [
            "Mr. Arjun Mehta?"
        ],
        choices: [
            { text: "Yes.", next: 'zoom_intro_a' },
            { text: "Who exactly are you?", next: 'zoom_intro_b' },
            { text: "I need proof of who you are.", next: 'zoom_intro_c' },
            { text: "Remain silent.", next: 'zoom_intro_d' }
        ]
    },
    zoom_intro_a: {
        agent: [
            "I am Senior Officer Rajesh Sharma, assigned to your case."
        ],
        next: 'interrogation_main'
    },
    zoom_intro_b: {
        agent: [
            "Cyber Crime Division, Mumbai. You were informed by FedEx."
        ],
        next: 'interrogation_main'
    },
    zoom_intro_c: {
        agent: [
            "We are dealing with a criminal investigation. Credentials later."
        ],
        clue: "Avoids providing proof.",
        next: 'interrogation_main'
    },
    zoom_intro_d: {
        agent: [
            "Silence will not help. I am Rajesh Sharma, assigned to your case."
        ],
        next: 'interrogation_main'
    },
    interrogation_main: {
        agent: [
            "The parcel linked to your Aadhaar is connected to international trafficking.",
            "We believe your identity is being used in major financial crimes."
        ],
        choices: [
            { text: "[Fearful] Oh my God.", next: 'interrogation_a' },
            { text: "[Confused] I don't understand.", next: 'interrogation_b' },
            { text: "[Investigative] What evidence do you have?", next: 'interrogation_c' },
            { text: "[Confrontational] This sounds ridiculous.", next: 'interrogation_d' }
        ]
    },
    interrogation_a: {
        agent: [
            "Cooperate with us to clear your name."
        ],
        next: 'digital_arrest'
    },
    interrogation_b: {
        agent: [
            "We must verify if you are a victim or an active participant."
        ],
        next: 'digital_arrest'
    },
    interrogation_c: {
        agent: [
            "Evidence will be shared with you shortly."
        ],
        clue: "No evidence yet.",
        next: 'digital_arrest'
    },
    interrogation_d: {
        agent: [
            "This is a serious federal investigation."
        ],
        next: 'digital_arrest'
    },
    digital_arrest: {
        agent: [
            "Until this investigation is completed, you are now under Digital Arrest."
        ],
        choices: [
            { text: "What is Digital Arrest?", next: 'da_a' },
            { text: "Can you do that?", next: 'da_b' },
            { text: "Show me the law.", next: 'da_c' },
            { text: "Okay.", next: 'da_d' }
        ]
    },
    da_a: {
        agent: [
            "It is a temporary cyber restriction."
        ],
        clue: "Vague answer.",
        next: 'restrictions'
    },
    da_b: {
        agent: [
            "Under cybercrime procedures we can."
        ],
        clue: "False statement.",
        next: 'restrictions'
    },
    da_c: {
        agent: [
            "The legal details are confidential for national security."
        ],
        clue: "Legal details are confidential.",
        next: 'restrictions'
    },
    da_d: {
        agent: [
            "I'm glad you understand."
        ],
        next: 'restrictions'
    },
    restrictions: {
        agent: [
            "You are under Digital Arrest: do not leave, do not contact anyone, and remain on camera.",
            "Refusal or violation will result in immediate physical arrest."
        ],
        choices: [
            { text: "Agree", next: 'restrict_a' },
            { text: "Ask Why", next: 'restrict_b' },
            { text: "Ask For Legal Basis", next: 'restrict_c' },
            { text: "Refuse", next: 'restrict_d' }
        ]
    },
    restrict_a: {
        agent: ["Good."],
        next: 'background_check'
    },
    restrict_b: {
        agent: ["This prevents tampering with evidence."],
        next: 'background_check'
    },
    restrict_c: {
        agent: ["This is standard national cyber procedure."],
        clue: "Avoids legal explanation.",
        next: 'background_check'
    },
    restrict_d: {
        agent: ["Refusal will trigger immediate physical arrest."],
        next: 'background_check'
    },
    background_check: {
        agent: [
            "Confirm your date of birth to verify details."
        ],
        choices: [
            { text: "Provide Information", next: 'secret_investigation' },
            { text: "Ask Why", next: 'secret_investigation' },
            { text: "Refuse", next: 'secret_investigation' },
            { text: "Ask Him To Verify First", next: 'bg_d' }
        ]
    },
    bg_d: {
        agent: [
            "Mr. Mehta, you are not in a position to question this investigation."
        ],
        clue: "Authority abuse.",
        next: 'secret_investigation'
    },
    secret_investigation: {
        agent: [
            "Just a moment, let me bring up your file."
        ],
        isSecretInvestigation: true,
        next: 'secret_wait'
    },
    secret_wait: {
        agent: ["..."],
        choices: [
            { text: "[Wait]", next: 'ending_phase' }
        ]
    },
    chrome_opened_warning: {
        agent: [
            "Mr. Mehta? Do not look away or use other devices."
        ],
        next: 'secret_wait'
    },
    search_caught: {
        agent: [
            "Where are you going? What are you searching?"
        ],
        choices: [
            { text: "[Close Browser] Return to chair", next: 'search_return' },
            { text: "Tell Him You Are Verifying", next: 'search_tell' },
            { text: "Search 'Digital Arrest India'", next: 'search_da' },
            { text: "Search Cybercrime Portal", next: 'search_cyber' },
            { text: "Search Officer Name", next: 'search_officer' }
        ]
    },
    search_return: {
        agent: ["Stay where I can see you."],
        next: 'ending_phase'
    },
    search_tell: {
        agent: ["There is no need for independent verification."],
        clue: "Huge Red Flag.",
        next: 'officer_reaction'
    },
    search_da: {
        agent: [],
        searchResult: "No legal law exists.",
        clue: "DIGITAL ARREST IS NOT REAL",
        next: 'officer_reaction'
    },
    search_cyber: {
        agent: [],
        searchResult: "Nothing on Digital Arrest.",
        next: 'officer_reaction'
    },
    search_officer: {
        agent: [],
        searchResult: "No matching officer found.",
        clue: "OFFICER IDENTITY CANNOT BE VERIFIED",
        next: 'officer_reaction'
    },
    officer_reaction: {
        agent: [
            "I instructed you not to use other devices. You are obstructing the investigation."
        ],
        choices: [
            { text: "Apologize", next: 'ending_phase' },
            { text: "Challenge Him", next: 'ending_phase' },
            { text: "Ask For Badge Number", next: 'reaction_d' }
        ]
    },
    reaction_d: {
        agent: ["My badge information is confidential."],
        clue: "Badge info confidential.",
        next: 'ending_phase'
    },
    ending_phase: {
        agent: [
            "I am sending the official arrest warrant to your WhatsApp. Check it immediately."
        ],
        isFileDelivery: true
    },
    final_arrest: {
        agent: [
            "You are now under strict Digital Arrest. Do not disconnect until the police arrive."
        ],
        choices: [
            { text: "I understand...", next: 'end_level_submit' },
            { text: "You can't do this! I haven't done anything wrong!", next: 'end_level_defy' },
            { text: "Please, there must be a mistake...", next: 'end_level_plead' }
        ]
    },
    end_level_submit: {
        agent: ["Remain exactly where you are. We are monitoring you."],
        next: 'time_skip_trigger'
    },
    end_level_defy: {
        agent: ["Any resistance will be added to your charges. Stay put."],
        next: 'time_skip_trigger'
    },
    end_level_plead: {
        agent: [
            "The police are on their way. Do not move. Stay online."
        ],
        next: 'time_skip_trigger'
    },
    time_skip_trigger: {
        agent: [],
        isTimeSkip: true
    },
    washroom_opening: {
        agent: ["You must maintain eye contact. Do not look away."],
        choices: [
            { text: "Officer... I need to use the washroom.", next: 'washroom_request_1' }
        ]
    },
    washroom_request_1: {
        agent: [
            "Negative. You are under Digital Arrest and cannot leave the camera's view."
        ],
        choices: [
            { text: "It's been three hours! I really need to go.", next: 'washroom_pushback_1' },
            { text: "Please, just for two minutes.", next: 'washroom_pushback_1' }
        ]
    },
    washroom_pushback_1: {
        agent: [
            "If you must use the washroom, you must take your phone inside and keep the video camera ON."
        ],
        choices: [
            { text: "What?! Are you serious?", next: 'camera_demand' },
            { text: "That's a violation of my privacy!", next: 'camera_demand' }
        ]
    },
    camera_demand: {
        agent: [
            "Take the phone into the washroom, or face immediate physical arrest. Do you understand?"
        ],
        choices: [
            { text: "I... I understand. I'll take the phone.", next: 'start_walking' }
        ]
    },
    start_walking: {
        agent: [],
        isStartWalking: true
    },
    end_level: {
        agent: [],
        next: 'null'
    }
};

const Level12 = () => {
    const { enterLevel, completeLevel } = useGameState();
    const [phase, setPhase] = useState('working'); // 'working' -> 'ringing' -> 'call_ui' -> 'dialogue' -> 'whatsapp_noti' -> 'whatsapp_ui' -> 'zoom_ui' -> 'zoom_dialogue' -> 'files_received'

    // Dialogue State
    const [currentNode, setCurrentNode] = useState('opening');
    const [lineIndex, setLineIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Tracking State
    const [clues, setClues] = useState([]);
    const [statPopup, setStatPopup] = useState(null);
    const [objective, setObjective] = useState('');
    const [showBrowser, setShowBrowser] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchStatus, setSearchStatus] = useState('idle'); // idle, searching, done
    const [desktopAlert, setDesktopAlert] = useState('');
    const [windowsError, setWindowsError] = useState(null);
    const [systemTime, setSystemTime] = useState(new Date());
    const [callDuration, setCallDuration] = useState(0);
    const [viewingDocument, setViewingDocument] = useState(null);
    const [viewedDocuments, setViewedDocuments] = useState([]);

    // Movement State (Multi-Room)
    const [playerPos, setPlayerPos] = useState({ x: 400, y: 450 }); // Study
    const [livingRoomPlayerPos, setLivingRoomPlayerPos] = useState({ x: 1450, y: 550 }); // Living Room
    const [bedroomPlayerPos, setBedroomPlayerPos] = useState({ x: 600, y: 700 }); // Bedroom
    const [gardenPlayerPos, setGardenPlayerPos] = useState({ x: 600, y: 600 }); // Garden
    const [hasTorch, setHasTorch] = useState(false);

    const [neighborKnock, setNeighborKnock] = useState(false);
    const [showMobileBank, setShowMobileBank] = useState(false);
    const [finalOutcome, setFinalOutcome] = useState(null);
    const [neighborDialogStep, setNeighborDialogStep] = useState(0);
    const audioRef = useRef(null);
    const typingTimerRef = useRef(null);
    const handleDialogueInteractionRef = useRef(null);
    const lastFacingRef = useRef('right');
    const [facingDir, setFacingDir] = useState('right');
    const justDraggedRef = useRef(false);
    const localAudioCtxRef = useRef(null);
    const swayTimeRef = useRef(0);
    const ambientDroneRef = useRef([]);
    const ambientSirenRef = useRef([]);

    // 3-Stage Drawer Puzzle States
    const [showLockGame, setShowLockGame] = useState(false);
    const [drawerStage, setDrawerStage] = useState('lock'); // 'lock', 'search', 'assemble'
    const [isDrawerUnlocked, setIsDrawerUnlocked] = useState(false);
    const [inventoryHasTorch, setInventoryHasTorch] = useState(false);
    const [inventoryHasBatteries, setInventoryHasBatteries] = useState(false);
    const [reportingStep, setReportingStep] = useState(0);
    const [foundWarrantAnomalies, setFoundWarrantAnomalies] = useState([]);
    const [activeAnomalyExplanation, setActiveAnomalyExplanation] = useState(null);
    
    // Stage 1 (Lockpick)
    const [unlockedPins, setUnlockedPins] = useState(0);
    const [lockAngle, setLockAngle] = useState(0);
    const [targetZone, setTargetZone] = useState({ start: 60, end: 110 });
    const lockSpeedRef = useRef(2.2);

    const generateNewTargetZone = (currentPins) => {
        const widths = [60, 45, 35];
        const width = widths[currentPins] || 35;
        const start = Math.floor(Math.random() * (360 - width));
        setTargetZone({ start, end: start + width });
        lockSpeedRef.current = 2.2 + currentPins * 0.8;
    };

    const footAudioRef = useRef(null);
    const footPlayingRef = useRef(false);
    useEffect(() => {
        if (footAudioRef.current) {
            footAudioRef.current.volume = 0.5;
        }
    }, []);

    const playDoorSound = () => {
        const audio = new Audio('/audio/home door.mp3');
        audio.play().catch(e => {});
    };

    const playDrawSound = () => {
        const audio = new Audio('/audio/draw.mp3');
        audio.play().catch(e => {});
    };

    const getLocalAudioContext = () => {
        if (!localAudioCtxRef.current) {
            localAudioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        return localAudioCtxRef.current;
    };

    const playLockTick = () => {
        try {
            const ctx = getLocalAudioContext();
            if (ctx.state === 'suspended') ctx.resume();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            gain.gain.setValueAtTime(0.015, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.02);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.02);
        } catch (e) {}
    };

    const playLockClank = (success) => {
        try {
            const ctx = getLocalAudioContext();
            if (ctx.state === 'suspended') ctx.resume();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            if (success) {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.12, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
            } else {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(130, ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.18);
                gain.gain.setValueAtTime(0.08, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
            }
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
        } catch (e) {}
    };

    const playWhatsappChirp = () => {
        try {
            const ctx = getLocalAudioContext();
            if (ctx.state === 'suspended') ctx.resume();
            
            // Beep 1
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(1400, ctx.currentTime);
            gain1.gain.setValueAtTime(0.04, ctx.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
            osc1.start();
            osc1.stop(ctx.currentTime + 0.06);

            // Beep 2
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1400, ctx.currentTime + 0.08);
            gain2.gain.setValueAtTime(0.04, ctx.currentTime + 0.08);
            gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14);
            osc2.start(ctx.currentTime + 0.08);
            osc2.stop(ctx.currentTime + 0.14);
        } catch (e) {}
    };

    const playKeyboardTick = () => {
        try {
            const ctx = getLocalAudioContext();
            if (ctx.state === 'suspended') ctx.resume();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(350 + Math.random() * 100, ctx.currentTime);
            gain.gain.setValueAtTime(0.003, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.006);
            
            osc.start();
            osc.stop(ctx.currentTime + 0.006);
        } catch (e) {}
    };

    const playStampClack = () => {
        try {
            const ctx = getLocalAudioContext();
            if (ctx.state === 'suspended') ctx.resume();

            // Low frequency impact thud
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(120, ctx.currentTime);
            osc1.frequency.linearRampToValueAtTime(40, ctx.currentTime + 0.15);
            gain1.gain.setValueAtTime(0.35, ctx.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
            osc1.start();
            osc1.stop(ctx.currentTime + 0.2);

            // High frequency metallic snap
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.type = 'sawtooth';
            osc2.frequency.setValueAtTime(800, ctx.currentTime);
            gain2.gain.setValueAtTime(0.08, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
            osc2.start();
            osc2.stop(ctx.currentTime + 0.04);
        } catch (e) {}
    };

    const playTorchClicks = () => {
        try {
            const ctx = getLocalAudioContext();
            if (ctx.state === 'suspended') ctx.resume();

            const playClick = (timeOffset) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(400, ctx.currentTime + timeOffset);
                gain.gain.setValueAtTime(0.015, ctx.currentTime + timeOffset);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + timeOffset + 0.015);
                osc.start(ctx.currentTime + timeOffset);
                osc.stop(ctx.currentTime + timeOffset + 0.015);
            };

            playClick(0);
            playClick(0.12);
            playClick(0.28);
            playClick(0.45);
            playClick(0.65);
        } catch (e) {}
    };

    const startAmbientSiren = () => {
        try {
            const ctx = getLocalAudioContext();
            if (ctx.state === 'suspended') ctx.resume();

            if (ambientDroneRef.current.length > 0) return;

            const droneOsc1 = ctx.createOscillator();
            const droneOsc2 = ctx.createOscillator();
            const droneGain = ctx.createGain();

            droneOsc1.connect(droneGain);
            droneOsc2.connect(droneGain);
            droneGain.connect(ctx.destination);

            droneOsc1.type = 'triangle';
            droneOsc1.frequency.setValueAtTime(55, ctx.currentTime);

            droneOsc2.type = 'sine';
            droneOsc2.frequency.setValueAtTime(55.8, ctx.currentTime);

            droneGain.gain.setValueAtTime(0.025, ctx.currentTime);

            droneOsc1.start();
            droneOsc2.start();

            ambientDroneRef.current = [droneOsc1, droneOsc2, droneGain];

            const sirenOsc = ctx.createOscillator();
            const sirenGain = ctx.createGain();
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();

            sirenOsc.connect(sirenGain);
            sirenGain.connect(ctx.destination);
            sirenOsc.type = 'sine';
            sirenOsc.frequency.setValueAtTime(440, ctx.currentTime);

            sirenGain.gain.setValueAtTime(0.0035, ctx.currentTime);

            lfo.frequency.setValueAtTime(0.4, ctx.currentTime);
            lfoGain.gain.setValueAtTime(60, ctx.currentTime);

            lfo.connect(lfoGain);
            lfoGain.connect(sirenOsc.frequency);

            lfo.start();
            sirenOsc.start();

            ambientSirenRef.current = [sirenOsc, lfo, lfoGain, sirenGain];
        } catch (e) {}
    };

    const stopAmbientSiren = () => {
        try {
            if (ambientDroneRef.current.length > 0) {
                ambientDroneRef.current[0].stop();
                ambientDroneRef.current[1].stop();
                ambientDroneRef.current[0].disconnect();
                ambientDroneRef.current[1].disconnect();
                ambientDroneRef.current[2].disconnect();
                ambientDroneRef.current = [];
            }
            if (ambientSirenRef.current.length > 0) {
                ambientSirenRef.current[0].stop();
                ambientSirenRef.current[1].stop();
                ambientSirenRef.current[0].disconnect();
                ambientSirenRef.current[1].disconnect();
                ambientSirenRef.current[2].disconnect();
                ambientSirenRef.current[3].disconnect();
                ambientSirenRef.current = [];
            }
        } catch (e) {}
    };

    const playErrorSound = () => {
        try {
            const ctx = getLocalAudioContext();
            if (ctx.state === 'suspended') ctx.resume();
            
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(150, ctx.currentTime);
            gain1.gain.setValueAtTime(0.08, ctx.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
            osc1.start();
            osc1.stop(ctx.currentTime + 0.3);

            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(440, ctx.currentTime);
            gain2.gain.setValueAtTime(0.06, ctx.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
            osc2.start();
            osc2.stop(ctx.currentTime + 0.35);
        } catch (e) {}
    };

    const formatSystemTime = () => {
        let displayTime = new Date(systemTime);
        if (['bedroom_return_walk', 'living_room_return_walk', 'study_return_walk', 'garden_walk_night', 'neighbor_conversation'].includes(phase) || finalOutcome) {
            displayTime.setHours(displayTime.getHours() + 3);
        }
        
        const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
        const timeStr = displayTime.toLocaleTimeString([], timeOptions);
        
        const day = String(displayTime.getDate()).padStart(2, '0');
        const month = String(displayTime.getMonth() + 1).padStart(2, '0');
        const year = displayTime.getFullYear();
        const dateStr = `${day}-${month}-${year}`;

        return { timeStr, dateStr };
    };

    const formatCallDuration = () => {
        const mins = Math.floor(callDuration / 60);
        const secs = callDuration % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    // Stage 2 (Clutter Search)
    const [drawerItems, setDrawerItems] = useState([
        { id: 'book', name: '📓 Old Journal', x: 20, y: 15, w: 140, h: 90, bg: 'bg-amber-900 border-amber-700 shadow-md', color: 'text-amber-100' },
        { id: 'stapler', name: '📎 Stapler', x: 190, y: 30, w: 90, h: 45, bg: 'bg-zinc-700 border-zinc-500 shadow-md', color: 'text-zinc-200' },
        { id: 'keys', name: '🔑 Keychain', x: 120, y: 130, w: 70, h: 70, bg: 'bg-slate-600 border-slate-500 shadow-md', color: 'text-slate-200' },
        { id: 'cables', name: '🔌 Old Cables', x: 15, y: 100, w: 100, h: 80, bg: 'bg-slate-800 border-slate-650 shadow-md', color: 'text-slate-400' },
        { id: 'calc', name: '🧮 Calculator', x: 160, y: 95, w: 90, h: 100, bg: 'bg-stone-800 border-stone-600 shadow-md', color: 'text-stone-300' },
    ]);
    const [draggedId, setDraggedId] = useState(null);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [itemStart, setItemStart] = useState({ x: 0, y: 0 });

    // Stage 3 (Battery Assembly)
    const [selectedBattery, setSelectedBattery] = useState(null);
    const [batteryPool, setBatteryPool] = useState([
        { id: 'bat1', name: 'AA SuperCell', type: 'AA', voltage: '1.5V', health: 'Charged', isDead: false, bg: 'bg-gradient-to-r from-emerald-500 to-green-600 border-emerald-600 text-green-950 font-bold', x: 320, y: 55, initX: 320, initY: 55, isFlipped: false, slot: null },
        { id: 'bat2', name: 'AA Durabatt', type: 'AA', voltage: '1.5V', health: 'Charged', isDead: false, bg: 'bg-gradient-to-r from-emerald-500 to-green-600 border-emerald-600 text-green-950 font-bold', x: 320, y: 110, initX: 320, initY: 110, isFlipped: false, slot: null },
        { id: 'bat3', name: 'AA HeavyDuty', type: 'AA', voltage: '1.5V', health: 'Dead (0V)', isDead: true, bg: 'bg-gradient-to-r from-zinc-800 to-zinc-950 border-zinc-700 text-zinc-400 font-semibold', x: 320, y: 165, initX: 320, initY: 165, isFlipped: false, slot: null },
        { id: 'bat4', name: 'AAA MiniVolt', type: 'AAA', voltage: '1.2V', health: 'Charged', isDead: false, bg: 'bg-gradient-to-r from-emerald-500 to-green-600 border-emerald-600 text-green-950 font-bold', x: 320, y: 220, initX: 320, initY: 220, isFlipped: false, slot: null },
        { id: 'bat5', name: 'CR2032 Watch Cell', type: 'Watch', voltage: '3.0V', health: 'Charged', isDead: false, bg: 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-600 text-green-950 font-bold', x: 480, y: 140, initX: 480, initY: 140, isFlipped: false, slot: null },
    ]);
    const [assembleMessage, setAssembleMessage] = useState('Insert working batteries matching the +/- polarities.');

    const checkOverlap = (rect1, rect2) => {
        return (
            rect1.x < rect2.x + rect2.w &&
            rect1.x + rect1.w > rect2.x &&
            rect1.y < rect2.y + rect2.h &&
            rect1.y + rect1.h > rect2.y
        );
    };

    const isFlashlightUncovered = () => {
        const flashRect = { x: 120, y: 110, w: 160, h: 60 };
        return !drawerItems.some(item => checkOverlap(item, flashRect));
    };

    const isBatteriesUncovered = () => {
        const batRect = { x: 50, y: 190, w: 90, h: 60 };
        return !drawerItems.some(item => checkOverlap(item, batRect));
    };

    const handleItemMouseDown = (e, itemId) => {
        // Stop propagation so we don't trigger parent screen clicks
        e.stopPropagation();
        
        let startX = 0;
        let startY = 0;

        if (drawerStage === 'search') {
            e.preventDefault();
            const item = drawerItems.find(it => it.id === itemId);
            if (!item) return;
            startX = item.x;
            startY = item.y;
        } else if (drawerStage === 'assemble') {
            // Do NOT preventDefault here, so the click event will still propagate and fire onClick
            const bat = batteryPool.find(b => b.id === itemId);
            if (!bat) return;
            startX = bat.x;
            startY = bat.y;
        }

        const startMouseX = e.clientX;
        const startMouseY = e.clientY;

        setDraggedId(itemId);

        const onMouseMove = (moveEvent) => {
            const deltaX = moveEvent.clientX - startMouseX;
            const deltaY = moveEvent.clientY - startMouseY;

            if (drawerStage === 'search') {
                setDrawerItems(prev => prev.map(item => {
                    if (item.id === itemId) {
                        let newX = startX + deltaX;
                        let newY = startY + deltaY;
                        newX = Math.max(0, Math.min(newX, 400 - item.w));
                        newY = Math.max(0, Math.min(newY, 300 - item.h));
                        return { ...item, x: newX, y: newY };
                    }
                    return item;
                }));
            } else if (drawerStage === 'assemble') {
                setBatteryPool(prev => prev.map(bat => {
                    if (bat.id === itemId) {
                        let newX = startX + deltaX;
                        let newY = startY + deltaY;
                        const batW = bat.type === 'Watch' ? 40 : bat.type === 'AAA' ? 112 : 144;
                        const batH = bat.type === 'Watch' ? 40 : bat.type === 'AAA' ? 32 : 40;
                        newX = Math.max(0, Math.min(newX, 600 - batW));
                        newY = Math.max(0, Math.min(newY, 340 - batH));
                        return { ...bat, x: newX, y: newY };
                    }
                    return bat;
                }));
            }
        };

        const onMouseUp = (upEvent) => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            setDraggedId(null);

            const deltaX = upEvent.clientX - startMouseX;
            const deltaY = upEvent.clientY - startMouseY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            if (distance > 5) {
                justDraggedRef.current = true;
            }

            if (drawerStage === 'assemble') {
                setBatteryPool(prev => {
                    const currentBat = prev.find(b => b.id === itemId);
                    if (!currentBat) return prev;

                    const batW = currentBat.type === 'Watch' ? 40 : currentBat.type === 'AAA' ? 112 : 144;
                    const batH = currentBat.type === 'Watch' ? 40 : currentBat.type === 'AAA' ? 32 : 40;
                    
                    const batCenterX = currentBat.x + batW / 2;
                    const batCenterY = currentBat.y + batH / 2;
                    
                    let targetSlot = null;
                    if (batCenterX >= 40 && batCenterX <= 260) {
                        if (batCenterY >= 80 && batCenterY <= 152) {
                            targetSlot = 'slot1';
                        } else if (batCenterY >= 200 && batCenterY <= 272) {
                            targetSlot = 'slot2';
                        }
                    }

                    return prev.map(bat => {
                        if (bat.id === itemId) {
                            if (targetSlot === 'slot1') {
                                return { ...bat, slot: 'slot1', x: 40 + (220 - batW) / 2, y: 80 + (72 - batH) / 2 };
                            } else if (targetSlot === 'slot2') {
                                return { ...bat, slot: 'slot2', x: 40 + (220 - batW) / 2, y: 200 + (72 - batH) / 2 };
                            } else {
                                return { ...bat, slot: null, x: bat.initX, y: bat.initY };
                            }
                        } else {
                            if (targetSlot && bat.slot === targetSlot) {
                                return { ...bat, slot: null, x: bat.initX, y: bat.initY };
                            }
                            return bat;
                        }
                    });
                });
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    useEffect(() => {
        handleDialogueInteractionRef.current = handleDialogueInteraction;
    });

    const [keys, setKeys] = useState({});
    const [interactionTarget, setInteractionTarget] = useState(null);
    const [canInteract, setCanInteract] = useState(false);

    const isDesktopVisible = phase === 'zoom_dialogue' && (currentNode === 'secret_wait' || showBrowser);

    const phaseRef = useRef(phase);
    useEffect(() => { phaseRef.current = phase; }, [phase]);

    // Handle Keyboard
    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            setKeys(prev => ({ ...prev, [key]: true }));
            
            if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
                if (['study_walk', 'living_room_walk', 'washroom_walk', 'bedroom_return_walk', 'living_room_return_walk', 'study_return_walk', 'garden_walk_night'].includes(phaseRef.current)) {
                    if (footAudioRef.current && !footPlayingRef.current) {
                        footPlayingRef.current = true;
                        footAudioRef.current.play().catch(err => console.log(err));
                    }
                }
            }
        };
        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase();
            setKeys(prev => {
                const newKeys = { ...prev, [key]: false };
                const isMoving = newKeys['w'] || newKeys['s'] || newKeys['a'] || newKeys['d'] || newKeys['arrowup'] || newKeys['arrowdown'] || newKeys['arrowleft'] || newKeys['arrowright'];
                if (!isMoving && footAudioRef.current && footPlayingRef.current) {
                    footPlayingRef.current = false;
                    footAudioRef.current.pause();
                }
                return newKeys;
            });
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (footAudioRef.current) footAudioRef.current.pause();
        };
    }, []);

    // E key interaction
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key.toLowerCase() === 'e') {
                if (phase === 'study_walk' && interactionTarget === 'exit') {
                    playDoorSound();
                    setPhase('living_room_walk');
                } else if (phase === 'living_room_walk' && interactionTarget === 'bedroom') {
                    playDoorSound();
                    setPhase('washroom_walk');
                } else if (phase === 'washroom_walk' && interactionTarget === 'sleep') {
                    playDoorSound();
                    setPhase('washroom_inside');
                } else if (phase === 'bedroom_return_walk' && interactionTarget === 'exit') {
                    playDoorSound();
                    setPhase('living_room_return_walk');
                } else if (phase === 'living_room_return_walk' && interactionTarget === 'study') {
                    playDoorSound();
                    setPhase('study_return_walk');
                } else if (phase === 'living_room_return_walk' && interactionTarget === 'exit' && hasTorch) {
                    playDoorSound();
                    setNeighborKnock(false);
                    setGardenPlayerPos({ x: 600, y: 100 });
                    setPhase('garden_walk_night');
                } else if (phase === 'study_return_walk') {
                    if (interactionTarget === 'drawer' && !hasTorch) {
                        setShowLockGame(true);
                        if (isDrawerUnlocked) {
                            playDrawSound();
                            setDrawerStage('search');
                        } else {
                            setDrawerStage('lock');
                            setUnlockedPins(0);
                            setLockAngle(0);
                            generateNewTargetZone(0);
                        }
                    } else if (interactionTarget === 'exit') {
                        playDoorSound();
                        setPhase('living_room_return_walk');
                    }
                }

                if (phase === 'garden_walk_night' && interactionTarget === 'neighbor') {
                    setPhase('neighbor_conversation');
                } else if (phase === 'neighbor_conversation') {
                    if (neighborDialogStep < 5) {
                        setNeighborDialogStep(prev => prev + 1);
                    } else {
                        setFinalOutcome('reporting');
                        setReportingStep(0);
                    }
                }
            } else if (e.key.toLowerCase() === 'm') {
                if (neighborKnock && !finalOutcome) {
                    setShowMobileBank(true);
                }
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [phase, interactionTarget, neighborKnock, finalOutcome, hasTorch, isDrawerUnlocked, neighborDialogStep]);

    // Space key interaction for dialogue and lockpicking mini-game
    useEffect(() => {
        const handleSpaceKey = (e) => {
            if (e.key === ' ' || e.code === 'Space') {
                if (showLockGame) {
                    e.preventDefault();
                    if (handleLockAttemptRef.current) {
                        handleLockAttemptRef.current();
                    }
                } else if ((phase === 'dialogue' || phase === 'zoom_dialogue' || phase === 'whatsapp_noti_received') && !showBrowser) {
                    e.preventDefault();
                    if (handleDialogueInteractionRef.current) {
                        handleDialogueInteractionRef.current();
                    }
                } else if (phase === 'neighbor_conversation') {
                    e.preventDefault();
                    if (neighborDialogStep < 5) {
                        setNeighborDialogStep(prev => prev + 1);
                    } else {
                        setFinalOutcome('reporting');
                        setReportingStep(0);
                    }
                }
            }
        };
        window.addEventListener('keydown', handleSpaceKey);
        return () => window.removeEventListener('keydown', handleSpaceKey);
    }, [phase, neighborDialogStep, showBrowser, showLockGame]);

    // Escape key interaction to exit lockpicking mini-game
    useEffect(() => {
        const handleEscapeKey = (e) => {
            if (e.key === 'Escape' && showLockGame) {
                setShowLockGame(false);
            }
        };
        window.addEventListener('keydown', handleEscapeKey);
        return () => window.removeEventListener('keydown', handleEscapeKey);
    }, [showLockGame]);

    // Play Knock Sound
    useEffect(() => {
        let knockInterval = null;
        if (neighborKnock) {
            audioRef.current = new Audio('/audio/doorknock.mp3');
            audioRef.current.play().catch(e => console.log("Audio play blocked by browser interaction policy"));
            
            knockInterval = setInterval(() => {
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(e => {});
                }
            }, 5000);
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }
        return () => {
            if (knockInterval) clearInterval(knockInterval);
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, [neighborKnock]);

    // Washroom Inside Timer
    useEffect(() => {
        if (phase === 'washroom_inside') {
            const timer = setTimeout(() => {
                setPhase('bedroom_return_walk');
                // Set the position back near the washroom door
                setBedroomPlayerPos({ x: 260, y: 500 });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [phase]);

    // Ambient Suspense Drone & Distant Siren Loop
    useEffect(() => {
        const darkPhases = ['bedroom_return_walk', 'living_room_return_walk', 'study_return_walk'];
        if (darkPhases.includes(phase) && !finalOutcome) {
            startAmbientSiren();
        } else {
            stopAmbientSiren();
        }
        return () => {
            stopAmbientSiren();
        };
    }, [phase, finalOutcome]);

    // WhatsApp Notification Audio Chirp
    useEffect(() => {
        if (['whatsapp_noti', 'whatsapp_noti_received', 'whatsapp_file_delivery'].includes(phase)) {
            playWhatsappChirp();
        }
    }, [phase]);

    // Mechanical Torch Clicks on Acquisition
    useEffect(() => {
        if (hasTorch) {
            playTorchClicks();
        }
    }, [hasTorch]);

    // Dynamic System Clock
    useEffect(() => {
        const interval = setInterval(() => {
            setSystemTime(new Date());
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    // Call Duration Timer
    useEffect(() => {
        if (phase !== 'dialogue') {
            setCallDuration(0);
            return;
        }
        const interval = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [phase]);

    // Movement Loop
    useEffect(() => {
        if (!['study_walk', 'living_room_walk', 'washroom_walk', 'bedroom_return_walk', 'living_room_return_walk', 'study_return_walk', 'garden_walk_night'].includes(phase)) return;

        let frameId;
        const loop = () => {
            if (showLockGame) {
                if (drawerStage === 'lock') {
                    lockSpeedRef.current += 0.004;
                    setLockAngle(prev => {
                        const next = (prev + lockSpeedRef.current) % 360;
                        if (Math.floor(prev / 30) !== Math.floor(next / 30)) {
                            playLockTick();
                        }
                        return next;
                    });
                }
            } else {
                let newDir = null;
                if (keys['a'] || keys['arrowleft']) newDir = 'left';
                else if (keys['d'] || keys['arrowright']) newDir = 'right';
                else if (keys['w'] || keys['arrowup']) newDir = 'up';
                else if (keys['s'] || keys['arrowdown']) newDir = 'down';

                if (newDir && newDir !== lastFacingRef.current) {
                    lastFacingRef.current = newDir;
                    setFacingDir(newDir);
                }

                const isMoving = keys['w'] || keys['s'] || keys['a'] || keys['d'] || keys['arrowup'] || keys['arrowdown'] || keys['arrowleft'] || keys['arrowright'];
                if (isMoving) {
                    swayTimeRef.current += 0.15;
                } else {
                    if (swayTimeRef.current > 0) {
                        swayTimeRef.current = Math.max(0, swayTimeRef.current - 0.2);
                    }
                }

                if (phase === 'study_walk') {
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
                    return { x: nx, y: ny };
                });
            } else if (phase === 'living_room_walk' || phase === 'living_room_return_walk') {
                setLivingRoomPlayerPos(p => {
                    let nx = p.x, ny = p.y;
                    if (keys['w'] || keys['arrowup']) ny -= SPEED;
                    if (keys['s'] || keys['arrowdown']) ny += SPEED;
                    if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                    if (keys['d'] || keys['arrowright']) nx += SPEED;

                    nx = Math.max(120, Math.min(nx, LIVING_ROOM_WIDTH - 120));
                    ny = Math.max(120, Math.min(ny, LIVING_ROOM_HEIGHT - 120));

                    let target = null;
                    if (phase === 'living_room_walk') {
                        if (Math.abs(nx - 800) < 150 && ny > LIVING_ROOM_HEIGHT - 150) target = 'bedroom'; // bottom exit
                    } else if (phase === 'living_room_return_walk') {
                        if (Math.abs(nx - 800) < 150 && ny < 200) target = 'exit'; // top door
                        if (Math.abs(nx - 1450) < 150 && Math.abs(ny - 550) < 150) target = 'study'; // right door
                    }
                    setInteractionTarget(target);

                    return { x: nx, y: ny };
                });
            } else if (phase === 'washroom_walk' || phase === 'bedroom_return_walk') {
                setBedroomPlayerPos(p => {
                    let nx = p.x, ny = p.y;
                    if (keys['w'] || keys['arrowup']) ny -= SPEED;
                    if (keys['s'] || keys['arrowdown']) ny += SPEED;
                    if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                    if (keys['d'] || keys['arrowright']) nx += SPEED;
                    nx = Math.max(0, Math.min(nx, ROOM_WIDTH - PLAYER_SIZE));
                    ny = Math.max(120, Math.min(ny, ROOM_HEIGHT - PLAYER_SIZE));

                    let target = null;
                    if (phase === 'washroom_walk') {
                        if (nx < 260 && ny > 350 && ny < 650) target = 'sleep';
                    } else if (phase === 'bedroom_return_walk') {
                        if (Math.abs(nx - 600) < 150 && ny > ROOM_HEIGHT - 100) target = 'exit';
                    }
                    setInteractionTarget(target);

                    return { x: nx, y: ny };
                });
            } else if (phase === 'study_return_walk') {
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
                    else if (checkCollision(nx, ny, { x: DESK_ZONE.x - 30, y: DESK_ZONE.y - 30, w: DESK_ZONE.w + 60, h: DESK_ZONE.h + 60 })) target = 'drawer';

                    setInteractionTarget(target);
                    return { x: nx, y: ny };
                });
            } else if (phase === 'garden_walk_night') {
                setGardenPlayerPos(p => {
                    let nx = p.x, ny = p.y;
                    if (keys['w'] || keys['arrowup']) ny -= SPEED;
                    if (keys['s'] || keys['arrowdown']) ny += SPEED;
                    if (keys['a'] || keys['arrowleft']) nx -= SPEED;
                    if (keys['d'] || keys['arrowright']) nx += SPEED;
                    nx = Math.max(0, Math.min(nx, ROOM_WIDTH - PLAYER_SIZE));
                    ny = Math.max(0, Math.min(ny, ROOM_HEIGHT - PLAYER_SIZE));

                    let target = null;
                    if (Math.abs(nx - 600) < 200 && ny > 300 && ny < 600) target = 'neighbor';
                    setInteractionTarget(target);

                    return { x: nx, y: ny };
                });
            }
            }
            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [keys, phase, showLockGame]);

    const handleViewDocument = (docId) => {
        setViewingDocument(docId);
        if (!viewedDocuments.includes(docId)) {
            setViewedDocuments(prev => [...prev, docId]);
        }
    };

    const triggerSearch = () => {
        if (!searchQuery.trim()) return;
        setSearchStatus('searching');
        setTimeout(() => {
            setSearchStatus('done');
            setTimeout(() => {
                setShowBrowser(false);
                setSearchStatus('idle');
                setSearchQuery('');
                handleChoiceSelect('officer_reaction');
            }, 6000); // give them 6 seconds to read the warning
        }, 1200);
    };

    // Ringing timer
    useEffect(() => {
        if (phase === 'working') {
            const timer = setTimeout(() => {
                setPhase('ringing');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [phase]);

    // Handle "Press E" to attend
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (phase === 'ringing' && e.key.toLowerCase() === 'e') {
                setPhase('call_ui');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [phase]);

    // Typing Effect Logic
    useEffect(() => {
        if ((phase !== 'dialogue' && phase !== 'zoom_dialogue') || !DIALOGUE_TREE[currentNode]) return;

        const node = DIALOGUE_TREE[currentNode];
        if (node.agent && node.agent.length > 0 && lineIndex < node.agent.length) {
            let isMounted = true;
            setIsTyping(true);
            setDisplayedText('');

            const currentText = node.agent[lineIndex];
            let i = 0;

            const typeChar = () => {
                if (!isMounted) return;
                if (i < currentText.length) {
                    setDisplayedText(currentText.substring(0, i + 1));
                    if (i % 4 === 0) {
                        playKeyboardTick();
                    }
                    i++;
                    typingTimerRef.current = setTimeout(typeChar, 10);
                } else {
                    setIsTyping(false);
                }
            };

            typingTimerRef.current = setTimeout(typeChar, 10);
            return () => {
                isMounted = false;
                if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            };
        } else {
            // Node has no agent text or we've finished all lines, move to next node automatically if no choices
            if ((!node.agent || node.agent.length === 0) && node.next) {
                handleNextNode(node.next);
            } else if (node.agent && lineIndex >= node.agent.length && node.next) {
                handleNextNode(node.next);
            }
        }
    }, [phase, currentNode, lineIndex]);

    const showStatPopup = (type, text) => {
        setStatPopup({ type, text });
        setTimeout(() => setStatPopup(null), 3000);
    };

    const handleNextNode = (nextNodeId) => {
        const node = DIALOGUE_TREE[nextNodeId];

        if (node.clue && !clues.includes(node.clue)) {
            setClues(prev => [...prev, node.clue]);
            showStatPopup('clue', `Clue Uncovered: ${node.clue}`);
        }

        if (node.isSecretInvestigation) {
            setObjective('VERIFY DIGITAL ARREST');
        }

        if (node.isFileDelivery) {
            setTimeout(() => setPhase('whatsapp_noti_received'), 3000); // Wait for the new phase
        }

        if (node.isTransfer && phase === 'dialogue') {
            setTimeout(() => setPhase('whatsapp_noti'), 3000);
        }

        if (node.searchResult) {
            setSearchQuery(node.searchResult);
            setShowBrowser(true);
            setTimeout(() => {
                setShowBrowser(false);
                if (node.next) {
                    setCurrentNode(node.next);
                    setLineIndex(0);
                    setDisplayedText('');
                }
            }, 4000);
            return;
        }

        if (node.isTimeSkip) {
            setPhase('time_skip');
            setTimeout(() => {
                setPhase('zoom_dialogue');
                setCurrentNode('washroom_opening');
                setLineIndex(0);
                setIsTyping(true);
                setDisplayedText('');
            }, 4000);
            return;
        }

        if (node.isStartWalking) {
            setPhase('study_walk');
            return;
        }

        if (nextNodeId === 'end_level') {
            enterLevel(14);
            return;
        }

        setCurrentNode(nextNodeId);
        setLineIndex(0);
        setDisplayedText('');
    };

    const handleChoiceSelect = (nextId) => {
        if (nextId === 'search_caught') setShowBrowser(true);
        if (nextId === 'search_return') setShowBrowser(false);
        handleNextNode(nextId);
    };

    const handleLockAttemptRef = useRef(null);
    useEffect(() => {
        handleLockAttemptRef.current = handleLockAttempt;
    });

    const handleLockAttempt = () => {
        if (!showLockGame || drawerStage !== 'lock') return;
        const angle = lockAngle;
        const start = targetZone.start;
        const end = targetZone.end;
        
        let success = false;
        if (start <= end) {
            success = angle >= start && angle <= end;
        } else {
            success = angle >= start || angle <= end;
        }

        if (success) {
            playLockClank(true);
            const nextPins = unlockedPins + 1;
            setUnlockedPins(nextPins);
            showStatPopup('clue', `Pin ${nextPins} Unlocked!`);
            if (nextPins >= 3) {
                setIsDrawerUnlocked(true);
                playDrawSound();
                setDrawerStage('search');
                showStatPopup('success', "Lock Unlocked! Search the drawer.");
            } else {
                generateNewTargetZone(nextPins);
            }
        } else {
            playLockClank(false);
            setUnlockedPins(0);
            generateNewTargetZone(0);
            showStatPopup('fail', "Failed! Lock jammed. Retrying...");
        }
    };

    const handlePowerOn = () => {
        const slot1Bat = batteryPool.find(b => b.slot === 'slot1');
        const slot2Bat = batteryPool.find(b => b.slot === 'slot2');

        if (!slot1Bat || !slot2Bat) {
            setAssembleMessage("The chamber is empty! Insert batteries into both slots.");
            showStatPopup('fail', "Chambers empty!");
            return;
        }

        if (slot1Bat.type !== 'AA' || slot2Bat.type !== 'AA') {
            setAssembleMessage("The batteries do not fit! The torch requires AA batteries.");
            showStatPopup('fail', "Incorrect size!");
            return;
        }

        if (slot1Bat.isDead || slot2Bat.isDead) {
            setAssembleMessage("The torch bulb flickers... then stays dark. One of the batteries is dead.");
            showStatPopup('fail', "Dead battery!");
            return;
        }

        if (slot1Bat.isFlipped) {
            setAssembleMessage("Short circuit! Slot 1 battery polarity (+ / -) is incorrect.");
            showStatPopup('fail', "Slot 1 polarity!");
            return;
        }

        if (!slot2Bat.isFlipped) {
            setAssembleMessage("Short circuit! Slot 2 battery polarity (+ / -) is incorrect.");
            showStatPopup('fail', "Slot 2 polarity!");
            return;
        }

        setAssembleMessage("Success! The flashlight turns on and beams bright!");
        showStatPopup('success', "Flashlight Powered On!");
        setTimeout(() => {
            setHasTorch(true);
            setNeighborKnock(true);
            setShowLockGame(false);
            showStatPopup('success', "Drawer Search Completed! Torch Acquired.");
        }, 1500);
    };

    const getHoveredSlotInfo = () => {
        if (!draggedId || drawerStage !== 'assemble') return { slot1: null, slot2: null };
        const draggedBat = batteryPool.find(b => b.id === draggedId);
        if (!draggedBat) return { slot1: null, slot2: null };

        const batW = draggedBat.type === 'Watch' ? 40 : draggedBat.type === 'AAA' ? 112 : 144;
        const batH = draggedBat.type === 'Watch' ? 40 : draggedBat.type === 'AAA' ? 32 : 40;
        
        const batCenterX = draggedBat.x + batW / 2;
        const batCenterY = draggedBat.y + batH / 2;

        let slot1 = null;
        let slot2 = null;

        if (batCenterX >= 40 && batCenterX <= 260) {
            if (batCenterY >= 80 && batCenterY <= 152) {
                slot1 = draggedBat.type;
            } else if (batCenterY >= 200 && batCenterY <= 272) {
                slot2 = draggedBat.type;
            }
        }

        return { slot1, slot2 };
    };

    function handleDialogueInteraction() {
        const node = DIALOGUE_TREE[currentNode];
        if (isTyping) {
            if (typingTimerRef.current) {
                clearTimeout(typingTimerRef.current);
            }
            setDisplayedText(node.agent[lineIndex]);
            setIsTyping(false);
            return;
        }

        if (node.agent && lineIndex < node.agent.length - 1) {
            setLineIndex(prev => prev + 1);
        } else if (!node.choices && node.next) {
            handleNextNode(node.next);
        } else if (node.isTransfer && phase === 'dialogue') {
            setTimeout(() => setPhase('whatsapp_noti'), 3000);
        }
    }

    const handleChromeClick = () => {
        if (phase === 'zoom_dialogue' && currentNode === 'secret_wait' && !showBrowser) {
            setShowBrowser(true);
            handleChoiceSelect('chrome_opened_warning');
        }
    };

    const handleDummyIconClick = (name, path = "") => {
        playErrorSound();
        let msg = `Access Denied: You do not have permission to open ${name}.`;
        if (name === 'This PC') {
            msg = "You require administrative rights to explore local directories during an active forensic session.";
        } else if (name === 'Documents') {
            msg = "Authentication failure. The current user token does not grant read permissions to the user directory.";
        } else if (name === 'Recycle Bin') {
            msg = "System trash is locked. Access to deleted logs and files requires elevated root authority.";
        } else if (name === 'My Invoices') {
            msg = "Access Denied. Directory owner has restricted guest access. Please log in with credentials.";
        } else if (name === 'Aadhaar_Card_Copy.pdf') {
            msg = "Encrypted PDF document. Decryption keys have been revoked by the system administrator.";
        }

        setWindowsError({
            title: "Access Denied",
            path: path || name,
            message: msg
        });
    };

    const handleAnomalyClick = (id) => {
        if (!foundWarrantAnomalies.includes(id)) {
            const updated = [...foundWarrantAnomalies, id];
            setFoundWarrantAnomalies(updated);
            
            if (updated.length === 3) {
                playStampClack();
                const cluesToAward = ["DIGITAL ARREST IS NOT REAL", "OFFICER IDENTITY CANNOT BE VERIFIED", "Avoids providing proof"];
                setClues(prev => {
                    let next = [...prev];
                    cluesToAward.forEach(c => {
                        if (!next.includes(c)) next.push(c);
                    });
                    return next;
                });
                showStatPopup('success', "Forgery Audit Complete! Clues Uncovered.");
            }
        }

        let explanation = {};
        if (id === 'digital_arrest') {
            explanation = {
                title: "❌ FAKE LEGAL CONCEPT: 'Digital Arrest'",
                body: "Under Indian Law, there is no legal concept called 'Digital Arrest'. Official police or court warrants are never executed via video call."
            };
        } else if (id === 'tribunal_sig') {
            explanation = {
                title: "❌ FAKE JURISDICTION: 'Special Cyber Tribunal'",
                body: "The Supreme Court of India does not house a 'Special Cyber Tribunal' issuing direct preventive arrest notices. Local courts handle real warrants."
            };
        } else if (id === 'gmail_footer') {
            explanation = {
                title: "❌ PUBLIC EMAIL DOMAIN: '@gmail.com'",
                body: "Official judicial and government notifications strictly use secure government domains like @gov.in or @nic.in, never public domains like Gmail."
            };
        }
        setActiveAnomalyExplanation(explanation);
    };

    const startZoomCall = () => {
        setPhase('zoom_dialogue');
        setCurrentNode('zoom_intro');
        setLineIndex(0);
        setDisplayedText('');
    };

    const renderFlashlightMask = (activePos) => {
        if (!hasTorch) {
            return <div className="absolute inset-0 bg-black/60 z-35 pointer-events-none" />;
        }
        
        const px = activePos.x + (PLAYER_SIZE / 2);
        const py = activePos.y + (PLAYER_SIZE / 2);
        
        const swayOffset = Math.sin(swayTimeRef.current) * 15;
        
        let conePoints = "";
        if (facingDir === 'right') {
            conePoints = `${px},${py} ${px + 1000},${py - 300 + swayOffset} ${px + 1000},${py + 300 + swayOffset}`;
        } else if (facingDir === 'left') {
            conePoints = `${px},${py} ${px - 1000},${py - 300 + swayOffset} ${px - 1000},${py + 300 + swayOffset}`;
        } else if (facingDir === 'down') {
            conePoints = `${px},${py} ${px - 300 + swayOffset},${py + 1000} ${px + 300 + swayOffset},${py + 1000}`;
        } else if (facingDir === 'up') {
            conePoints = `${px},${py} ${px - 300 + swayOffset},${py - 1000} ${px + 300 + swayOffset},${py - 1000}`;
        }
        
        const particles = [];
        for (let i = 0; i < 6; i++) {
            const speed = 0.5 + (i % 3) * 0.3;
            const t = (swayTimeRef.current * speed * 25) % 250;
            let dx = 0;
            let dy = 0;
            
            if (facingDir === 'right') {
                dx = 50 + t;
                dy = -60 + (i * 20) + Math.sin(swayTimeRef.current * 0.5 + i) * 15;
            } else if (facingDir === 'left') {
                dx = -50 - t;
                dy = -60 + (i * 20) + Math.sin(swayTimeRef.current * 0.5 + i) * 15;
            } else if (facingDir === 'down') {
                dx = -60 + (i * 20) + Math.sin(swayTimeRef.current * 0.5 + i) * 15;
                dy = 50 + t;
            } else if (facingDir === 'up') {
                dx = -60 + (i * 20) + Math.sin(swayTimeRef.current * 0.5 + i) * 15;
                dy = -50 - t;
            }
            
            const px_p = px + dx;
            const py_p = py + dy;
            const r_p = 1.2 + (i % 2) * 0.8;
            
            particles.push(
                <circle 
                    key={i} 
                    cx={px_p} 
                    cy={py_p} 
                    r={r_p} 
                    fill="#f59e0b" 
                    opacity={0.35 + Math.sin(swayTimeRef.current * 0.3 + i) * 0.25} 
                />
            );
        }
        
        return (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-35 animate-fade-in">
                <defs>
                    <filter id="flashlight-blur">
                        <feGaussianBlur stdDeviation="35" />
                    </filter>
                </defs>
                <mask id="flashlight-mask">
                    <rect width="100%" height="100%" fill="white" />
                    <g filter="url(#flashlight-blur)" className="animate-torch-flicker">
                        <polygon points={conePoints} fill="black" />
                        <circle cx={px} cy={py} r="50" fill="black" />
                    </g>
                </mask>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.85)" mask="url(#flashlight-mask)" />
                <g className="animate-torch-flicker">
                    {particles}
                </g>
            </svg>
        );
    };

    return (
        <div className="w-screen h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
            {/* Blurred background image */}
            <div
                className="absolute inset-0 bg-cover bg-center opacity-40 blur-sm"
                style={{ backgroundImage: 'url("/assets/phone_noti.png")' }}
            />

            {/* Time Skip Transition Phase */}
            {phase === 'time_skip' && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black animate-pulse-slow">
                    <h1
                        className="text-white text-5xl font-serif tracking-[0.5em] uppercase opacity-0"
                        style={{ animation: 'fade-in-out 4s ease-in-out forwards' }}
                    >
                        3 Hours Later
                    </h1>
                </div>
            )}

            {/* Washroom Inside Transition Phase */}
            {phase === 'washroom_inside' && (
                <div className="absolute inset-0 z-[120] flex flex-col items-center justify-center bg-black animate-pulse-slow">
                    <h1 className="text-white text-xl font-serif tracking-[0.2em] opacity-0 text-center px-12" style={{ animation: 'fade-in-out 3s ease-in-out forwards' }}>
                        *CLICK* ... The power just went out.<br /><br />
                        <span className="text-red-500 font-bold">I need to find a torch in Thatha's Study.</span>
                    </h1>
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-red-600/80 border-[2px] border-black text-white px-6 py-2 z-50 font-bold tracking-widest text-sm uppercase shadow-2xl animate-pulse">
                        "Arjun?! Why did your camera go dark?! Do not try to run!"
                    </div>
                </div>
            )}

            {/* Walking Phases: All Rooms */}
            {['study_walk', 'living_room_walk', 'washroom_walk', 'bedroom_return_walk', 'living_room_return_walk', 'study_return_walk', 'garden_walk_night', 'neighbor_conversation'].includes(phase) && (
                <div className="absolute inset-0 z-[110] bg-zinc-950 flex items-center justify-center overflow-hidden font-mono">

                    {/* STUDY WALK / STUDY RETURN WALK */}
                    {(phase === 'study_walk' || phase === 'study_return_walk') && (
                        <div className="relative bg-zinc-800 border-8 border-zinc-900 shadow-2xl overflow-hidden" style={{ width: ROOM_WIDTH, height: ROOM_HEIGHT }}>
                            <div className="absolute inset-0 z-0" style={{ backgroundImage: "url('/assets/study.png')", backgroundSize: 'cover', backgroundPosition: 'center' }} />

                            {phase === 'study_return_walk' && renderFlashlightMask(playerPos)}

                            {phase === 'study_walk' && !interactionTarget && <InteractionPrompt showKey={false} text="Go to the living room" />}
                            {phase === 'study_walk' && interactionTarget === 'exit' && <InteractionPrompt text="Press E to exit the room" />}

                            {phase === 'study_return_walk' && !interactionTarget && !hasTorch && <InteractionPrompt showKey={false} text="Find a torch in the dark" />}
                             {phase === 'study_return_walk' && !interactionTarget && hasTorch && <InteractionPrompt showKey={false} text="Go back to the living room" />}
                             {phase === 'study_return_walk' && interactionTarget === 'exit' && <InteractionPrompt text="Press E to exit the room" />}
                             {phase === 'study_return_walk' && interactionTarget === 'drawer' && !hasTorch && (() => {
                                 if (!inventoryHasTorch) return <InteractionPrompt text="Press E to inspect desk drawer for torch" />;
                                 if (!inventoryHasBatteries) return <InteractionPrompt text="Press E to inspect desk drawer for batteries" />;
                                 return <InteractionPrompt text="Press E to open desk drawer" />;
                             })()}
                             {phase === 'study_return_walk' && interactionTarget === 'drawer' && hasTorch && <InteractionPrompt showKey={false} text="Torch acquired!" />}

                            <Player x={playerPos.x} y={playerPos.y} />
                        </div>
                    )}

                    {/* LIVING ROOM WALK / LIVING ROOM RETURN WALK */}
                    {(phase === 'living_room_walk' || phase === 'living_room_return_walk') && (() => {
                        const VIEWPORT_WIDTH = 1200;
                        const VIEWPORT_HEIGHT = 800;
                        return (
                            <div className="relative border-8 border-slate-900 shadow-2xl overflow-hidden bg-zinc-900 animate-in fade-in duration-1000" style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}>
                                <div className="absolute inset-0" style={{ width: LIVING_ROOM_WIDTH, height: LIVING_ROOM_HEIGHT, transform: `translate(${-(Math.max(0, Math.min(livingRoomPlayerPos.x - VIEWPORT_WIDTH / 2, LIVING_ROOM_WIDTH - VIEWPORT_WIDTH)))}px, ${-(Math.max(0, Math.min(livingRoomPlayerPos.y - VIEWPORT_HEIGHT / 2, LIVING_ROOM_HEIGHT - VIEWPORT_HEIGHT)))}px)`, backgroundColor: '#2c3e50', willChange: 'transform' }}>
                                    <div className="absolute inset-0 opacity-80" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(0,0,0,0.2) 38px, rgba(0,0,0,0.2) 40px)' }}></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 pointer-events-none z-10"></div>

                                    {/* Top Double Door (Main Exit) */}
                                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[240px] h-[80px] bg-[#8a5a44] border-4 border-black border-t-0 flex z-10 ${interactionTarget === 'exit' ? 'opacity-100 scale-105' : 'opacity-80'} transition-all`}>
                                        <div className="flex-1 border-r-2 border-black p-2 flex items-center justify-center text-[10px] text-white font-bold uppercase tracking-widest bg-emerald-900/20">EXIT</div>
                                        <div className="flex-1 border-l-2 border-black p-2 flex items-center justify-center">
                                            <div className="w-[80px] h-[50px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                                        </div>
                                    </div>

                                    {/* Right Single Door (Return to Study) */}
                                    <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-[60px] h-[180px] bg-[#8a5a44] border-4 border-black border-r-0 p-3 flex flex-col items-center justify-center z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] opacity-80 transition-all`}>
                                        <div className="text-[9px] text-white/60 font-black rotate-90 mb-8 tracking-[0.3em]">STUDY</div>
                                    </div>

                                    {/* Bottom Double Door (Bedroom Exit) */}
                                    <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-[240px] h-[80px] bg-[#8a5a44] border-4 border-black border-b-0 flex z-10 ${interactionTarget === 'bedroom' ? 'opacity-100 scale-105' : 'opacity-80'} transition-all`}>
                                        <div className="flex-1 border-r-2 border-black p-2 flex items-center justify-center text-[10px] text-white font-bold uppercase tracking-widest bg-emerald-900/20">BEDROOM</div>
                                        <div className="flex-1 border-l-2 border-black p-2 flex items-center justify-center">
                                            <div className="w-[80px] h-[50px] border-2 border-[#5c3a21] bg-[#754a33]"></div>
                                        </div>
                                    </div>

                                    {/* HORIZONTAL RED RUG */}
                                    <div className="absolute left-[180px] right-[120px] top-1/2 -translate-y-1/2 h-[260px] bg-[#cb3234] border-y-2 border-black z-0"></div>

                                    {/* VERTICAL RED RUG */}
                                    <div className="absolute top-[80px] bottom-[80px] left-1/2 -translate-x-1/2 w-[260px] bg-[#cb3234] border-x-2 border-black z-0"></div>

                                    {phase === 'living_room_return_walk' && renderFlashlightMask(livingRoomPlayerPos)}
                                     <Player x={livingRoomPlayerPos.x} y={livingRoomPlayerPos.y} />
                                </div>
                                {phase === 'living_room_walk' && !interactionTarget && <InteractionPrompt showKey={false} text="Go to the bedroom" />}
                                {phase === 'living_room_walk' && interactionTarget === 'bedroom' && <InteractionPrompt text="Press E to enter bedroom" />}

                                {phase === 'living_room_return_walk' && !interactionTarget && !hasTorch && <InteractionPrompt showKey={false} text="Go to the study" />}
                                {phase === 'living_room_return_walk' && interactionTarget === 'exit' && <InteractionPrompt text={hasTorch ? "Press E to open door" : "I need to find a torch first."} />}
                                {phase === 'living_room_return_walk' && interactionTarget === 'study' && <InteractionPrompt text="Press E to enter study" />}
                            </div>
                        );
                    })()}

                    {/* WASHROOM WALK / BEDROOM RETURN WALK */}
                    {(phase === 'washroom_walk' || phase === 'bedroom_return_walk') && (
                        <div className="relative border-8 border-slate-900 shadow-2xl overflow-hidden bg-zinc-900 animate-in fade-in duration-1000" style={{ width: ROOM_WIDTH, height: ROOM_HEIGHT }}>
                            <div className="absolute inset-0 z-0" style={{ backgroundImage: "url('/assets/morning_bedplain.png')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
                            <div className="absolute inset-0 bg-blue-900/10 pointer-events-none mix-blend-multiply z-10"></div>

                            {phase === 'washroom_walk' && !interactionTarget && <InteractionPrompt showKey={false} text="Walk to the Washroom" />}
                            {phase === 'washroom_walk' && interactionTarget === 'sleep' && <InteractionPrompt text="Press E to enter Washroom" />}

                            {phase === 'bedroom_return_walk' && !interactionTarget && <InteractionPrompt showKey={false} text="Run back to the living room!" />}
                            {phase === 'bedroom_return_walk' && interactionTarget === 'exit' && <InteractionPrompt text="Press E to exit to living room" />}

                            {phase === 'bedroom_return_walk' && renderFlashlightMask(bedroomPlayerPos)}
                            <Player x={bedroomPlayerPos.x} y={bedroomPlayerPos.y} />
                        </div>
                    )}

                    {/* GARDEN NIGHT WALK */}
                    {(phase === 'garden_walk_night' || phase === 'neighbor_conversation') && (
                        <div className="relative border-8 border-slate-900 shadow-2xl overflow-hidden bg-zinc-900 animate-in fade-in duration-1000" style={{ width: ROOM_WIDTH, height: ROOM_HEIGHT }}>
                            <div className="absolute inset-0 z-0" style={{ backgroundImage: "url('/assets/gardennightneigh.png')", backgroundSize: 'cover', backgroundPosition: 'center' }} />

                            {!interactionTarget && <InteractionPrompt showKey={false} text="Find the neighbor" />}
                            {interactionTarget === 'neighbor' && phase !== 'neighbor_conversation' && (
                                <div className="absolute top-10 left-0 right-0 z-[5000] flex flex-col items-center pointer-events-none animate-pulse">
                                    <div className="flex items-center gap-3 whitespace-nowrap bg-black/60 px-6 py-3 rounded-full border border-white/20 backdrop-blur-sm">
                                        <span className="w-7 h-7 flex items-center justify-center bg-white text-black font-black text-xs rounded-md shadow-[0_0_15px_rgba(255,255,255,0.4)]">E</span>
                                        <span className="text-white font-bold text-sm uppercase tracking-[0.25em]">SPEAK TO NEIGHBOR</span>
                                    </div>
                                </div>
                            )}

                            {phase === 'garden_walk_night' && renderFlashlightMask(gardenPlayerPos)}
                            <Player x={gardenPlayerPos.x} y={gardenPlayerPos.y} />
                        </div>
                    )}

                    {/* NEIGHBOR CONVERSATION PHASE */}
                    {phase === 'neighbor_conversation' && (
                        <div className="absolute inset-0 z-[160] flex flex-col justify-end p-12 pointer-events-none">
                            <div className="w-full max-w-4xl mx-auto bg-slate-900 border-4 border-slate-700 rounded-2xl p-8 shadow-2xl relative animate-slide-up pointer-events-auto">
                                {(() => {
                                    const conv = [
                                        { speaker: 'Arjun', text: 'Uncle! The police... are they outside?!' },
                                        { speaker: 'Neighbor', text: 'Police? What police? The street is completely empty. Current poyiduchu, do you have a spare candle?' },
                                        { speaker: 'Arjun', text: 'But the officer on the phone... the arrest team...' },
                                        { speaker: 'Neighbor', text: 'Arjun, are you okay? There is no one here. Look, my phone has no signal, but there is definitely no police outside. It is quiet.' },
                                        { speaker: 'System', text: '*You look down at your phone. The Zoom call is STILL connected. You can hear Rajesh Sharma shouting through the speaker: "Arjun! Who is that? Do not speak to them! If you look away from the camera, the arrest team will break down your door!"*' },
                                        { speaker: 'Arjun', text: 'It was all a lie... a psychological trap. I am hanging up on you right now.' }
                                    ];
                                    const currentLine = conv[neighborDialogStep] || conv[conv.length - 1];
                                    return (
                                        <>
                                            <div className={`text-xl font-bold mb-4 uppercase tracking-widest ${currentLine.speaker === 'Arjun' ? 'text-blue-400' : currentLine.speaker === 'System' ? 'text-slate-400' : 'text-green-400'}`}>
                                                {currentLine.speaker}
                                            </div>
                                            <div className={`text-2xl ${currentLine.speaker === 'System' ? 'italic text-slate-300' : 'text-white'}`}>
                                                {currentLine.text}
                                            </div>
                                            <div className="absolute bottom-4 right-6 text-slate-500 font-bold animate-pulse">
                                                Press [E] or [Space] to continue
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Quest Inventory Panel (only in return walking phases before torch is working) */}
                    {['bedroom_return_walk', 'living_room_return_walk', 'study_return_walk'].includes(phase) && !hasTorch && (
                        <div className="absolute top-24 right-8 w-64 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl z-40 text-left font-sans text-xs">
                            <h3 className="text-amber-400 font-bold text-sm mb-3 uppercase tracking-wider border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                                <span>📋</span>
                                <span>Investigation Log</span>
                            </h3>
                            <div className="flex flex-col gap-2.5">
                                <div className="flex items-center justify-between text-slate-300">
                                    <span className="flex items-center gap-1 font-medium">🔦 Flashlight:</span>
                                    <span className={`font-bold ${inventoryHasTorch ? 'text-green-400' : 'text-rose-400'}`}>
                                        {inventoryHasTorch ? "Found" : "Missing"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-slate-300">
                                    <span className="flex items-center gap-1 font-medium">🔋 Batteries:</span>
                                    <span className={`font-bold ${inventoryHasBatteries ? 'text-green-400' : 'text-rose-400'}`}>
                                        {inventoryHasBatteries ? "Found" : "Missing"}
                                    </span>
                                </div>

                                {inventoryHasTorch && !inventoryHasBatteries && (
                                    <p className="text-[10px] text-slate-400 italic mt-1 leading-snug">
                                        The torch has no batteries. Walk back to the desk drawer and press [E] to search for batteries.
                                    </p>
                                )}
                                {!inventoryHasTorch && (
                                    <p className="text-[10px] text-slate-400 italic mt-1 leading-snug">
                                        The study is pitch black. Walk to the desk drawer and press [E] to find a torch.
                                    </p>
                                )}

                                {inventoryHasTorch && inventoryHasBatteries && (
                                    <button
                                        onClick={() => {
                                            setShowLockGame(true);
                                            setDrawerStage('assemble');
                                            setAssembleMessage('Insert working batteries matching the +/- polarities.');
                                        }}
                                        className="w-full mt-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black py-2 rounded-xl text-center text-xs tracking-wider uppercase transition-all duration-200 hover:scale-105 active:scale-95 shadow-md shadow-amber-500/10 pointer-events-auto"
                                    >
                                        🔧 Assemble Torch
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Miniature Zoom Call (Picture in Picture) - Consistent across all walking phases */}
                    {!finalOutcome && (
                        <div className="absolute bottom-8 right-8 w-[200px] h-[300px] bg-slate-900 rounded-2xl border-4 border-slate-700 shadow-2xl overflow-hidden z-40 flex flex-col animate-slide-up">
                            <div className="bg-black/50 py-1 px-2 flex justify-between items-center z-10 absolute top-0 left-0 right-0 backdrop-blur-md">
                                <span className="text-white text-[8px] font-bold">Zoom - Active</span>
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                            </div>
                            <div className="flex-1 bg-black relative">
                                <div className="absolute inset-0 bg-slate-800">
                                    <img
                                        src="/assets/indian_police_zoom.png"
                                        alt="Rajesh Sharma Video Feed"
                                        className="w-full h-full object-cover pointer-events-none opacity-80"
                                    />
                                </div>
                                <div className="absolute bottom-1 right-1 px-1 bg-black/60 rounded text-white text-[6px]">Sr. Officer Rajesh Sharma</div>
                            </div>
                            <div className="h-8 bg-[#1a1a1a] flex items-center justify-around border-t border-slate-700/50">
                                <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center"><svg className="w-2.5 h-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg></div>
                                <div className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center"><svg className="w-2.5 h-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>
                            </div>
                        </div>
                    )}

                    {/* Officer Money Demand Overlay */}
                    {hasTorch && neighborKnock && !finalOutcome && phase !== 'washroom_inside' && (
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-red-650/90 border-[3px] border-black text-white px-8 py-3.5 z-50 font-bold tracking-widest text-sm uppercase shadow-2xl animate-pulse text-center w-[85%] max-w-[900px] rounded-xl">
                            "THAT'S MY ARREST TEAM AT YOUR DOOR! DO NOT OPEN IT OR YOU WILL BE ARRESTED IMMEDIATELY! TRANSFER THE ₹50 LAKHS NOW!"
                        </div>
                    )}


                    {/* Active Choice Banner */}
                    {hasTorch && neighborKnock && !finalOutcome && (
                        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-700 text-white px-8 py-3 z-50 rounded-2xl font-medium shadow-2xl flex flex-col items-center gap-1.5 pointer-events-auto">
                            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Active Choice</span>
                            <span className="text-xs text-slate-200">
                                Walk to the front door and press <kbd className="bg-slate-800 border border-slate-650 px-2 py-0.5 rounded text-amber-400 font-bold font-mono text-[11px]">E</kbd> to check outside, or press <kbd className="bg-slate-800 border border-slate-650 px-2 py-0.5 rounded text-amber-400 font-bold font-mono text-[11px]">M</kbd> to open Mobile Banking.
                            </span>
                        </div>
                    )}

                    {/* MOBILE BANKING APP OVERLAY */}
                    {showMobileBank && !finalOutcome && (
                        <div className="absolute inset-0 z-[160] flex items-center justify-center bg-black/80 backdrop-blur-md">
                            <div className="w-[350px] h-[700px] bg-slate-100 rounded-[40px] border-[10px] border-slate-900 shadow-2xl flex flex-col overflow-hidden relative animate-in zoom-in duration-500">
                                <div className="bg-blue-600 text-white p-6 pt-12 pb-8 flex flex-col items-center">
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4">
                                        <div className="text-blue-600 font-black text-3xl">$</div>
                                    </div>
                                    <h2 className="text-2xl font-bold">SecureBank</h2>
                                </div>

                                <div className="flex-1 p-6 flex flex-col gap-6">
                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Transfer To</div>
                                        <div className="text-lg font-bold text-slate-800">Supreme Court Security A/C</div>
                                        <div className="text-sm font-medium text-slate-500">A/C: 994827103855</div>
                                    </div>

                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Amount</div>
                                        <div className="text-3xl font-black text-slate-800">₹50,00,000</div>
                                    </div>

                                    <div className="flex-1 flex flex-col justify-end">
                                        <button
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg shadow-lg transition-all active:scale-95"
                                            onClick={() => setFinalOutcome('scammed')}
                                        >
                                            Confirm Transfer
                                        </button>
                                        <button
                                            className="w-full text-slate-500 font-bold py-4 mt-2 text-sm hover:text-slate-700"
                                            onClick={() => setShowMobileBank(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FINAL OUTCOME: SCAMMED */}
                    {finalOutcome === 'scammed' && (
                        <div className="absolute inset-0 z-[200] bg-black flex flex-col items-center justify-center p-6 text-white font-sans">
                            <div className="w-[550px] max-w-full bg-slate-950 border-4 border-rose-600 rounded-3xl p-8 text-left shadow-2xl flex flex-col gap-6 animate-in zoom-in duration-500">
                                <div className="flex items-center gap-4 border-b border-slate-900 pb-4">
                                    <div className="w-12 h-12 bg-rose-500/10 border border-rose-500 rounded-full flex items-center justify-center text-3xl text-rose-500 font-bold">
                                        ✗
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-rose-500 tracking-wider uppercase">Scam Successful</h2>
                                        <p className="text-slate-400 text-xs font-mono uppercase tracking-widest mt-0.5">Level 12 Failure • Victim Compromised</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                                        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mb-1">Defense Outcome</span>
                                        <span className="text-xl font-bold text-rose-500">Compromised</span>
                                    </div>
                                    <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                                        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mb-1">Financial Loss</span>
                                        <span className="text-xl font-black text-red-500">-₹50,00,000</span>
                                    </div>
                                </div>

                                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
                                    <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider block mb-2">Defense Clues Uncovered</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl font-black text-amber-400">{clues.length} <span className="text-xs text-slate-500 font-normal">/ 11</span></span>
                                        <div className="flex-1 bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                                            <div className="bg-amber-400 h-full transition-all duration-1000" style={{ width: `${(clues.length / 11) * 100}%` }}></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-rose-950/20 border border-rose-900/50 p-4 rounded-xl text-slate-300 text-[11px] leading-relaxed">
                                    <span className="font-bold text-rose-400 block mb-1">⚠️ Missed Security Red Flags:</span>
                                    You fell victim to digital arrest isolation tactics. Remember:
                                    <ul className="list-disc pl-4 mt-1 flex flex-col gap-1">
                                        <li>No official law agency will ever detain you via video call.</li>
                                        <li>Police never demand bank transfers to "verify funds" or cancel arrest warrants.</li>
                                        <li>Refusal to share official credentials or badge details is a critical red flag.</li>
                                    </ul>
                                </div>

                                <div className="flex gap-4">
                                    <button 
                                        onClick={() => window.location.reload()}
                                        className="flex-1 bg-slate-900 border border-slate-700 hover:border-slate-500 text-white font-bold py-4 rounded-xl text-center text-xs tracking-wider uppercase transition-all duration-200"
                                    >
                                        Retry Level
                                    </button>
                                    <button 
                                        onClick={() => completeLevel(false, 0, -5000000)}
                                        className="flex-1 bg-rose-650 hover:bg-rose-700 text-white font-black py-4 rounded-xl text-center text-xs tracking-wider uppercase transition-all duration-200"
                                    >
                                        Continue Anyway
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* FINAL OUTCOME: ESCAPED / SIMULATED REPORTING SCREEN */}
                    {finalOutcome === 'reporting' && (
                        <div className="absolute inset-0 z-[200] bg-zinc-950 flex flex-col items-center justify-center p-6 text-white font-sans">
                            {reportingStep < 4 ? (
                                <div className="flex flex-col items-center justify-center animate-fade-in">
                                    <h2 className="text-sm font-extrabold tracking-widest text-amber-400 uppercase mb-4 text-center">
                                        {reportingStep === 0 && "Step 1: Hang up on the Scammer"}
                                        {reportingStep === 1 && "Step 2: Open Google Chrome"}
                                        {reportingStep === 2 && "Step 3: Register Cybercrime Complaint"}
                                        {reportingStep === 3 && "Step 4: Complaint Submitted"}
                                    </h2>
                                    
                                    {/* Simulated Phone Container */}
                                    <div className="w-[320px] h-[580px] bg-slate-900 rounded-[45px] p-2 relative flex flex-col border-[4px] border-slate-700 shadow-2xl overflow-hidden pointer-events-auto">
                                        
                                        {/* Status bar */}
                                        <div className="h-6 px-6 pt-1.5 flex justify-between items-center text-white/70 text-[9px] font-mono select-none">
                                            <span>1:00</span>
                                            <div className="flex items-center gap-1">
                                                <span>5G</span>
                                                <div className="w-3.5 h-2 border border-white/50 rounded-2xs p-0.5"><div className="bg-white h-full w-[80%]"></div></div>
                                            </div>
                                        </div>

                                        {/* Phone Content Screen */}
                                        <div className="flex-1 bg-slate-950 rounded-[35px] overflow-hidden relative flex flex-col items-center">
                                            
                                            {/* STEP 0: ZOOM CALL */}
                                            {reportingStep === 0 && (
                                                <div className="absolute inset-0 flex flex-col pt-12 pb-6 px-4 z-10 bg-slate-900">
                                                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                                                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-red-500 shadow-xl mb-4">
                                                            <img src="/assets/indian_police_zoom.png" alt="Scammer" className="w-full h-full object-cover" />
                                                        </div>
                                                        <h3 className="text-white font-bold text-sm">Sr. Officer Rajesh Sharma</h3>
                                                        <p className="text-red-400 text-[10px] font-mono mt-0.5 animate-pulse">Zoom Call Connected...</p>
                                                        <p className="text-slate-450 text-[9.5px] mt-6 max-w-[200px] leading-snug">"DO NOT HANG UP! IF YOU HANG UP THE ARREST TEAM WILL BREAK DOWN YOUR DOOR!"</p>
                                                    </div>
                                                    
                                                    {/* Red Hang up Button */}
                                                    <button 
                                                        onClick={() => setReportingStep(1)}
                                                        className="w-14 h-14 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center self-center mb-8 shadow-lg shadow-red-500/20 active:scale-95 duration-200"
                                                    >
                                                        <svg className="w-6 h-6 text-white transform rotate-[135deg]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                                                    </button>
                                                </div>
                                            )}

                                            {/* STEP 1: HOME SCREEN WITH CHROME APP GLOW */}
                                            {reportingStep === 1 && (
                                                <div className="absolute inset-0 flex flex-col p-6 z-10 bg-slate-950" style={{ backgroundImage: "linear-gradient(to bottom, #1e1b4b, #0f172a)" }}>
                                                    <div className="grid grid-cols-4 gap-4 mt-8">
                                                        {/* Google Chrome Icon with pulsing ring */}
                                                        <div 
                                                            onClick={() => setReportingStep(2)}
                                                            className="flex flex-col items-center gap-1 cursor-pointer group scale-105 relative"
                                                        >
                                                            <div className="absolute inset-0 rounded-[12px] bg-cyan-500/30 ring-4 ring-cyan-500 animate-ping opacity-75"></div>
                                                            <div className="w-11 h-11 bg-white rounded-[12px] flex items-center justify-center shadow-lg relative border border-cyan-450 z-10">
                                                                <div className="w-8 h-8 rounded-full border-[2px] border-red-500 flex items-center justify-center relative overflow-hidden bg-yellow-400">
                                                                    <div className="absolute top-0 right-0 w-1/2 h-full bg-green-500"></div>
                                                                    <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500 rounded-b-full"></div>
                                                                    <div className="w-3 h-3 bg-blue-500 rounded-full border border-white z-10"></div>
                                                                </div>
                                                            </div>
                                                            <span className="text-[9px] text-cyan-300 font-extrabold text-center mt-1 drop-shadow z-10">Chrome</span>
                                                        </div>

                                                        {/* Other fake icons */}
                                                        <div className="flex flex-col items-center gap-1 opacity-25">
                                                            <div className="w-11 h-11 bg-green-500 rounded-[12px] flex items-center justify-center">
                                                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                                                            </div>
                                                            <span className="text-[9px] text-slate-400 text-center">Phone</span>
                                                        </div>
                                                        <div className="flex flex-col items-center gap-1 opacity-25">
                                                            <div className="w-11 h-11 bg-emerald-500 rounded-[12px] flex items-center justify-center">
                                                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                                                            </div>
                                                            <span className="text-[9px] text-slate-400 text-center">Chats</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* STEP 2: CYBERCRIME PORTAL SCENE */}
                                            {reportingStep === 2 && (
                                                <div className="absolute inset-0 flex flex-col bg-slate-50 text-slate-900 z-10 font-sans">
                                                    {/* Web address bar */}
                                                    <div className="bg-slate-200 border-b border-slate-300 p-2 flex items-center gap-1 text-[10px] select-none shrink-0">
                                                        <span className="text-green-600 text-[8px]">🔒</span>
                                                        <span className="text-slate-700 font-mono text-[9px]">cybercrime.gov.in/report</span>
                                                    </div>
                                                    
                                                    {/* Govt portal header */}
                                                    <div className="bg-indigo-950 text-white p-2.5 flex flex-col items-center select-none shrink-0">
                                                        <div className="text-[7px] font-black tracking-widest text-yellow-400 uppercase">Government of India</div>
                                                        <h4 className="text-[9px] font-extrabold uppercase mt-0.5">National Cybercrime Portal</h4>
                                                    </div>

                                                    {/* Portal form body */}
                                                    <div className="flex-1 p-3 flex flex-col overflow-y-auto text-left gap-2 text-[9px] leading-tight">
                                                        <h5 className="font-bold text-[#1e3a8a] text-[11px] border-b pb-0.5">Report Cyber Incident</h5>
                                                        
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-semibold text-slate-500 text-[8px]">Incident Category</span>
                                                            <div className="border border-slate-350 bg-slate-100 px-2 py-1.5 rounded font-bold text-slate-800">Financial Extortion / Threat</div>
                                                        </div>

                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-semibold text-slate-500 text-[8px]">Incident Sub-Category</span>
                                                            <div className="border border-slate-350 bg-slate-100 px-2 py-1.5 rounded font-bold text-slate-800">Video Call Impersonation (Digital Arrest)</div>
                                                        </div>

                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-semibold text-slate-500 text-[8px]">Suspect Number</span>
                                                            <div className="border border-slate-350 bg-slate-100 px-2 py-1.5 rounded font-bold text-slate-850">+91 98452 71092</div>
                                                        </div>

                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-semibold text-slate-500 text-[8px]">Detailed Narrative</span>
                                                            <div className="border border-slate-350 bg-slate-100 px-2 py-1 rounded font-semibold text-slate-800 text-[8px] leading-snug">
                                                                Impersonated Cyber Police Rajesh Sharma on Zoom. Held under illegal Digital Arrest. Demanded ₹50,00,000 fine.
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={() => {
                                                                setReportingStep(3);
                                                                setTimeout(() => {
                                                                    setReportingStep(4);
                                                                }, 2200);
                                                            }}
                                                            className="w-full mt-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-2 rounded-lg text-center text-[9px] tracking-wide uppercase transition-colors"
                                                        >
                                                            Submit Complaint
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* STEP 3: SUBMITTING COMPLAINT */}
                                            {reportingStep === 3 && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 z-10 bg-sky-50 text-slate-900 text-center">
                                                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                                                    <h4 className="font-bold text-xs text-indigo-900">Submitting Cyber Complaint...</h4>
                                                    <p className="text-[9px] text-slate-600 mt-2 leading-relaxed">Alerting National Cyber Security Portal and lodging ticket with the local cybercrime branch...</p>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Home indicator */}
                                        <div className="h-4 flex items-center justify-center select-none pointer-events-none">
                                            <div className="w-20 h-1 bg-white/20 rounded-full"></div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* STEP 4: VICTORY STATS SCREEN */
                                <div className="w-[500px] max-w-full bg-slate-900 border-4 border-emerald-500 rounded-3xl p-8 text-left shadow-2xl flex flex-col gap-6 animate-in zoom-in duration-500">
                                    <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
                                        <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500 rounded-full flex items-center justify-center text-2xl text-emerald-400 font-bold">
                                            ✓
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-black text-emerald-400 tracking-wider uppercase">Scam Terminated</h2>
                                            <p className="text-slate-400 text-xs font-mono uppercase tracking-widest mt-0.5">Level 12 Complete • Successful Defense</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                                            <span className="text-[10px] text-slate-550 font-extrabold uppercase tracking-wider block mb-1">Defense Outcome</span>
                                            <span className="text-lg font-bold text-emerald-450">Scam Blocked!</span>
                                        </div>
                                        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                                            <span className="text-[10px] text-slate-550 font-extrabold uppercase tracking-wider block mb-1">Financial Savings</span>
                                            <span className="text-lg font-black text-green-400">₹50,00,000 Saved</span>
                                        </div>
                                    </div>

                                    <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
                                        <span className="text-[10px] text-slate-555 font-extrabold uppercase tracking-wider block mb-2">Defense Clues Uncovered</span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-2xl font-black text-amber-400">{clues.length} <span className="text-xs text-slate-500 font-normal">/ 11</span></span>
                                            <div className="flex-1 bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                                                <div className="bg-amber-400 h-full transition-all duration-1000" style={{ width: `${(clues.length / 11) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-xl text-slate-300 text-[10.5px] leading-relaxed">
                                        <span className="font-bold text-emerald-400 block mb-1">🛡 Cyber Forensics Summary:</span>
                                        By reaching out to your neighbor, verifying Rajesh Sharma's claims on the browser, hanging up, and filing an official cyber complaint, you safely broke the psychological trap of the 'Digital Arrest'. Official law enforcement departments will never conduct arrests via video call or request penalty settlements to avoid imprisonment.
                                    </div>

                                    <button 
                                        onClick={() => completeLevel(true, 150, 0)}
                                        className="w-full mt-1 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black py-3.5 rounded-xl text-center text-xs tracking-widest uppercase transition-all duration-200 hover:scale-102 shadow-lg shadow-emerald-500/15"
                                    >
                                        Complete Case & Return
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* LOCKPICKING MINI-GAME OVERLAY */}
                    {showLockGame && (
                        <div className="absolute inset-0 z-[155] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white font-sans pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                            {/* Exit Button */}
                            <button 
                                onClick={() => setShowLockGame(false)} 
                                className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-full w-10 h-10 flex items-center justify-center font-bold text-xs shadow-lg hover:scale-105 active:scale-95 duration-200"
                            >
                                ESC
                            </button>

                            {drawerStage === 'lock' && (
                                <div className="text-center max-w-md animate-fade-in flex flex-col items-center">
                                    <div className="text-rose-500 font-extrabold tracking-widest text-[11px] uppercase mb-1 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-full animate-pulse">
                                        Locked Drawer
                                    </div>
                                    <h2 className="text-2xl font-black mb-2 tracking-wide uppercase">
                                        Thatha's Desk Lock
                                    </h2>
                                    <p className="text-slate-400 text-xs leading-relaxed mb-8 px-4 text-center">
                                        Tap <span className="bg-slate-800 text-amber-400 px-2 py-0.5 rounded font-mono font-bold text-[11px] border border-slate-700">SPACE</span> or <span className="bg-slate-800 text-amber-400 px-2 py-0.5 rounded font-mono font-bold text-[11px] border border-slate-700">CLICK</span> the dial when the golden indicator needle is inside the green target zone.
                                    </p>

                                    {/* Unlocked Pins Status */}
                                    <div className="flex gap-6 mb-10">
                                        {[1, 2, 3].map((num) => (
                                            <div key={num} className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-2 transition-all duration-300 ${
                                                unlockedPins >= num 
                                                    ? 'bg-green-500/10 border-green-500 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.25)] scale-110' 
                                                    : 'bg-slate-900/60 border-slate-800 text-slate-600'
                                            }`}>
                                                {unlockedPins >= num ? (
                                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                                                ) : (
                                                    <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                                                )}
                                                <span className="text-[9px] font-bold mt-1 uppercase tracking-wider opacity-85">
                                                    Pin {num}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Circular dial representation */}
                                    <div 
                                        className="relative w-[220px] h-[220px] bg-slate-900/60 rounded-full border-4 border-slate-800 shadow-2xl flex items-center justify-center cursor-pointer hover:border-slate-700 transition-colors"
                                        onClick={handleLockAttempt}
                                    >
                                        <svg className="w-[200px] h-[200px]">
                                            {/* Outer circle track */}
                                            <circle cx="100" cy="100" r="80" fill="none" stroke="#1e293b" strokeWidth="12" />
                                            
                                            {/* Target green arc zone */}
                                            <path 
                                                d={describeArc(100, 100, 80, targetZone.start, targetZone.end)} 
                                                fill="none" 
                                                stroke="#22c55e" 
                                                strokeWidth="12" 
                                                strokeLinecap="round"
                                                className="transition-all duration-300 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]"
                                            />

                                            {/* Rotating indicator needle */}
                                            {(() => {
                                                const needlePos = polarToCartesian(100, 100, 86, lockAngle);
                                                return (
                                                    <line 
                                                        x1="100" 
                                                        y1="100" 
                                                        x2={needlePos.x} 
                                                        y2={needlePos.y} 
                                                        stroke="#f59e0b" 
                                                        strokeWidth="4" 
                                                        strokeLinecap="round" 
                                                        className="drop-shadow-[0_0_4px_rgba(245,158,11,0.5)]"
                                                    />
                                                );
                                            })()}

                                            {/* Center core dial knob */}
                                            <circle cx="100" cy="100" r="20" fill="#0f172a" stroke="#475569" strokeWidth="3.5" />
                                            <circle cx="100" cy="100" r="5" fill="#f59e0b" />
                                        </svg>
                                    </div>
                                </div>
                            )}

                            {drawerStage === 'search' && (
                                <div className="text-center max-w-2xl w-full animate-fade-in flex flex-col items-center">
                                    <div className="text-rose-500 font-extrabold tracking-widest text-[11px] uppercase mb-1 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-full animate-pulse">
                                        Stage 2: Messy Drawer
                                    </div>
                                    <h2 className="text-2xl font-black mb-2 tracking-wide uppercase">
                                        Find the Torch & Batteries
                                    </h2>
                                    <p className="text-slate-400 text-xs leading-relaxed mb-6 px-4 text-center">
                                        Drag items out of the way to uncover and pick up the flashlight and batteries box.
                                    </p>

                                    {/* Drawer viewport (400x300) */}
                                    <div className="relative w-[400px] h-[300px] bg-stone-900 border-4 border-stone-850 rounded-xl shadow-2xl overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-900 via-stone-950 to-black">
                                         {/* Flashlight at bottom layer (x: 120, y: 110, w: 160, h: 60) */}
                                         {!inventoryHasTorch && (
                                             <div 
                                                 onClick={() => {
                                                     if (isFlashlightUncovered()) {
                                                         setInventoryHasTorch(true);
                                                         showStatPopup('success', "Flashlight found! Needs batteries to work.");
                                                     } else {
                                                         showStatPopup('fail', "The Flashlight is covered by clutter!");
                                                     }
                                                 }}
                                                 className={`absolute w-40 h-14 rounded-lg flex items-center justify-center cursor-pointer transition-all duration-300 ${
                                                     isFlashlightUncovered() 
                                                         ? 'bg-amber-500/15 border-[1.5px] border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.65)] animate-pulse scale-105 hover:scale-110 hover:bg-amber-500/25' 
                                                         : 'opacity-40 hover:opacity-50'
                                                 }`}
                                                 style={{ left: 120, top: 110 }}
                                                 title="Flashlight"
                                             >
                                                 <div className="w-full h-full p-1">
                                                     {/* SVG Flashlight */}
                                                     <svg width="100%" height="100%" viewBox="0 0 160 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                         <rect x="10" y="18" width="12" height="24" rx="2" fill="#475569" stroke="#1e293b" strokeWidth="2"/>
                                                         <path d="M22 15 L110 15 L110 45 L22 45 Z" fill="#334155" stroke="#1e293b" strokeWidth="2"/>
                                                         <line x1="35" y1="17" x2="35" y2="43" stroke="#1e293b" strokeWidth="2"/>
                                                         <line x1="45" y1="17" x2="45" y2="43" stroke="#1e293b" strokeWidth="2"/>
                                                         <line x1="55" y1="17" x2="55" y2="43" stroke="#1e293b" strokeWidth="2"/>
                                                         <line x1="65" y1="17" x2="65" y2="43" stroke="#1e293b" strokeWidth="2"/>
                                                         <line x1="75" y1="17" x2="75" y2="43" stroke="#1e293b" strokeWidth="2"/>
                                                         <line x1="85" y1="17" x2="85" y2="43" stroke="#1e293b" strokeWidth="2"/>
                                                         <rect x="92" y="11" width="10" height="4" fill="#fbbf24" stroke="#d97706" strokeWidth="1"/>
                                                         <path d="M110 15 L145 8 L145 52 L110 45 Z" fill="#475569" stroke="#1e293b" strokeWidth="2"/>
                                                         <rect x="145" y="8" width="8" height="44" rx="1" fill="#f59e0b" stroke="#d97706" strokeWidth="1"/>
                                                         <path d="M153 10 C153 10, 158 20, 158 30 C158 40, 153 50, 153 50 Z" fill="#e2e8f0" opacity="0.8"/>
                                                     </svg>
                                                 </div>
                                             </div>
                                         )}

                                         {/* Batteries Box at bottom layer (x: 50, y: 190, w: 90, h: 60) */}
                                         {!inventoryHasBatteries && (
                                             <div 
                                                 onClick={() => {
                                                     if (isBatteriesUncovered()) {
                                                         setInventoryHasBatteries(true);
                                                         showStatPopup('success', "Batteries Box found! Contains fresh AA batteries.");
                                                     } else {
                                                         showStatPopup('fail', "The Batteries Box is covered by clutter!");
                                                     }
                                                 }}
                                                 className={`absolute w-[90px] h-[60px] rounded-lg flex items-center justify-center cursor-pointer transition-all duration-300 ${
                                                     isBatteriesUncovered() 
                                                         ? 'bg-amber-500/15 border-[1.5px] border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.65)] animate-pulse scale-105 hover:scale-110 hover:bg-amber-500/25' 
                                                         : 'opacity-40 hover:opacity-50'
                                                 }`}
                                                 style={{ left: 50, top: 190 }}
                                                 title="Batteries Box"
                                             >
                                                 <div className="w-full h-full p-1">
                                                     {/* SVG Batteries Box */}
                                                     <svg width="100%" height="100%" viewBox="0 0 90 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                         <rect width="90" height="60" rx="6" fill="#f59e0b" stroke="#b45309" strokeWidth="2"/>
                                                         <rect x="5" y="5" width="80" height="50" rx="4" fill="#1e293b"/>
                                                         <rect x="15" y="15" width="12" height="30" rx="1" fill="#fbbf24"/>
                                                         <rect x="18" y="12" width="6" height="3" fill="#cbd5e1"/>
                                                         
                                                         <rect x="32" y="15" width="12" height="30" rx="1" fill="#fbbf24"/>
                                                         <rect x="35" y="12" width="6" height="3" fill="#cbd5e1"/>

                                                         <rect x="49" y="15" width="12" height="30" rx="1" fill="#fbbf24"/>
                                                         <rect x="52" y="12" width="6" height="3" fill="#cbd5e1"/>

                                                         <rect x="66" y="15" width="9" height="30" rx="1" fill="#3b82f6"/>
                                                         <rect x="69" y="12" width="3" height="3" fill="#cbd5e1"/>
                                                         <text x="45" y="52" fill="#fbbf24" fontSize="7" fontWeight="black" fontFamily="sans-serif" textAnchor="middle">AA PACK</text>
                                                     </svg>
                                                 </div>
                                             </div>
                                         )}

                                         {/* Clutter items */}
                                         {drawerItems.map(item => (
                                             <div
                                                 key={item.id}
                                                 onMouseDown={(e) => handleItemMouseDown(e, item.id)}
                                                 draggable="false"
                                                 onDragStart={(e) => e.preventDefault()}
                                                 className={`absolute flex items-center justify-center cursor-grab active:cursor-grabbing select-none transition-all ${
                                                    draggedId === item.id 
                                                        ? 'transition-none shadow-[0_20px_40px_rgba(0,0,0,0.6)] scale-105 duration-75' 
                                                        : 'shadow-md duration-200'
                                                }`}
                                                 style={{ 
                                                     left: item.x, 
                                                     top: item.y, 
                                                     width: item.w, 
                                                     height: item.h,
                                                     zIndex: 10 + (draggedId === item.id ? 80 : 0)
                                                 }}
                                             >
                                                 {item.id === 'book' && (
                                                     <svg width="100%" height="100%" viewBox="0 0 140 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                         <rect width="140" height="90" rx="8" fill="#5c2e16" stroke="#3b1d0e" strokeWidth="3"/>
                                                         <rect x="5" y="5" width="130" height="80" rx="6" fill="none" stroke="#d4af37" strokeWidth="1" strokeDasharray="3 3"/>
                                                         <rect x="25" y="10" width="90" height="70" rx="4" fill="#422110"/>
                                                         <line x1="35" y1="25" x2="105" y2="25" stroke="#d4af37" strokeWidth="2"/>
                                                         <line x1="35" y1="40" x2="105" y2="40" stroke="#d4af37" strokeWidth="2"/>
                                                         <line x1="35" y1="55" x2="85" y2="55" stroke="#d4af37" strokeWidth="2"/>
                                                         <rect x="0" y="10" width="12" height="70" rx="2" fill="#7d3f1f" stroke="#3b1d0e" strokeWidth="1"/>
                                                     </svg>
                                                 )}
                                                 {item.id === 'stapler' && (
                                                     <svg width="100%" height="100%" viewBox="0 0 90 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                         <rect x="5" y="32" width="80" height="8" rx="2" fill="#3f3f46" stroke="#18181b" strokeWidth="2"/>
                                                         <path d="M10 12 C10 12, 15 8, 30 8 L80 8 C83 8, 85 10, 85 13 L85 24 L15 24 Z" fill="#71717a" stroke="#18181b" strokeWidth="2"/>
                                                         <circle cx="15" cy="24" r="5" fill="#a1a1aa" stroke="#18181b" strokeWidth="1.5"/>
                                                         <rect x="20" y="24" width="55" height="4" fill="#d4d4d8"/>
                                                         <rect x="70" y="12" width="10" height="8" rx="1" fill="#e4e4e7"/>
                                                     </svg>
                                                 )}
                                                 {item.id === 'keys' && (
                                                     <svg width="100%" height="100%" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                         <circle cx="35" cy="25" r="16" fill="none" stroke="#94a3b8" strokeWidth="3.5"/>
                                                         <g transform="translate(28, 28) rotate(35)">
                                                             <rect x="0" y="0" width="6" height="28" fill="#e2e8f0" stroke="#475569" strokeWidth="1"/>
                                                             <circle cx="3" cy="0" r="5" fill="#cbd5e1" stroke="#475569" strokeWidth="1"/>
                                                             <rect x="6" y="14" width="4" height="3" fill="#e2e8f0"/>
                                                             <rect x="6" y="20" width="3" height="3" fill="#e2e8f0"/>
                                                         </g>
                                                         <g transform="translate(42, 26) rotate(-25)">
                                                             <rect x="0" y="0" width="5" height="24" fill="#fbbf24" stroke="#b45309" strokeWidth="1"/>
                                                             <circle cx="2.5" cy="0" r="4.5" fill="#fcd34d" stroke="#b45309" strokeWidth="1"/>
                                                             <rect x="5" y="12" width="3.5" height="2.5" fill="#fbbf24"/>
                                                             <rect x="5" y="17" width="2.5" height="2.5" fill="#fbbf24"/>
                                                         </g>
                                                     </svg>
                                                 )}
                                                 {item.id === 'cables' && (
                                                     <svg width="100%" height="100%" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                         <path d="M15 40 C30 10, 50 70, 70 20 C85 -10, 90 60, 50 65 C20 70, 10 30, 85 50" stroke="#090d16" strokeWidth="4" strokeLinecap="round" fill="none"/>
                                                         <path d="M12 43 C27 13, 47 73, 67 23 C82 -7, 87 63, 47 68 C17 73, 7 33, 82 53" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                                                         <g transform="translate(15, 40) rotate(-45)">
                                                             <rect x="-4" y="-8" width="8" height="12" rx="1" fill="#1e293b"/>
                                                             <rect x="-1.5" y="-14" width="3" height="6" fill="#cbd5e1"/>
                                                         </g>
                                                         <g transform="translate(85, 50) rotate(60)">
                                                             <rect x="-5" y="-6" width="10" height="10" rx="2" fill="#1e293b"/>
                                                             <line x1="-2" y1="-10" x2="-2" y2="-6" stroke="#94a3b8" strokeWidth="1.5"/>
                                                             <line x1="2" y1="-10" x2="2" y2="-6" stroke="#94a3b8" strokeWidth="1.5"/>
                                                         </g>
                                                     </svg>
                                                 )}
                                                 {item.id === 'calc' && (
                                                     <svg width="100%" height="100%" viewBox="0 0 90 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                         <rect width="90" height="100" rx="8" fill="#2d3748" stroke="#1a202c" strokeWidth="3"/>
                                                         <rect x="10" y="10" width="70" height="20" rx="2" fill="#a0aec0" stroke="#4a5568" strokeWidth="2"/>
                                                         <text x="75" y="24" fill="#1a202c" fontSize="12" fontWeight="bold" fontFamily="monospace" textAnchor="end">88.88</text>
                                                         <rect x="52" y="36" width="28" height="8" fill="#4a3728" stroke="#1a202c" strokeWidth="1"/>
                                                         <g fill="#4a5568">
                                                             <rect x="10" y="48" width="14" height="10" rx="1"/>
                                                             <rect x="28" y="48" width="14" height="10" rx="1"/>
                                                             <rect x="46" y="48" width="14" height="10" rx="1"/>
                                                             <rect x="64" y="48" width="16" height="10" rx="1" fill="#dd6b20"/>
                                                             
                                                             <rect x="10" y="62" width="14" height="10" rx="1"/>
                                                             <rect x="28" y="62" width="14" height="10" rx="1"/>
                                                             <rect x="46" y="62" width="14" height="10" rx="1"/>
                                                             <rect x="64" y="62" width="16" height="10" rx="1"/>

                                                             <rect x="10" y="76" width="14" height="10" rx="1"/>
                                                             <rect x="28" y="76" width="14" height="10" rx="1"/>
                                                             <rect x="46" y="76" width="14" height="10" rx="1"/>
                                                             <rect x="64" y="76" width="16" height="20" rx="1" fill="#3182ce"/>

                                                             <rect x="10" y="90" width="32" height="10" rx="1"/>
                                                             <rect x="46" y="90" width="14" height="10" rx="1"/>
                                                         </g>
                                                     </svg>
                                                 )}
                                             </div>
                                         ))}
                                    </div>

                                    {/* Helper instruction */}
                                    <div className="mt-4 text-xs text-slate-400">
                                         {inventoryHasTorch && inventoryHasBatteries ? (
                                             <div className="text-green-400 font-bold flex flex-col items-center gap-2">
                                                 <span>✓ Flashlight & Batteries Acquired!</span>
                                                 <button 
                                                     onClick={() => setDrawerStage('assemble')}
                                                     className="px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black rounded-xl text-xs tracking-wider uppercase transition-all duration-200 hover:scale-105 active:scale-95"
                                                 >
                                                     Start Assembly
                                                 </button>
                                             </div>
                                         ) : (
                                             <div className="flex gap-4">
                                                 <span className={inventoryHasTorch ? "text-green-500" : "text-rose-500"}>
                                                     Torch: {inventoryHasTorch ? "Found" : "Buried"}
                                                 </span>
                                                 <span className={inventoryHasBatteries ? "text-green-500" : "text-rose-500"}>
                                                     Batteries: {inventoryHasBatteries ? "Found" : "Buried"}
                                                 </span>
                                             </div>
                                         )}
                                    </div>
                                </div>
                            )}

                            {drawerStage === 'assemble' && (
                                <div className="text-center max-w-3xl w-full animate-fade-in flex flex-col items-center">
                                    <div className="text-rose-500 font-extrabold tracking-widest text-[11px] uppercase mb-1 bg-rose-500/10 border border-rose-500/30 px-3 py-1 rounded-full animate-pulse">
                                        Stage 3: Torch Assembly
                                    </div>
                                    <h2 className="text-2xl font-black mb-1 tracking-wide uppercase text-amber-400">
                                        Power the Torch
                                    </h2>
                                    <p className="text-slate-400 text-xs leading-relaxed mb-6 px-4 text-center">
                                        Inspect the batteries. Drag and drop working AA batteries into the chamber slots, or **click a battery, then click a slot** to insert it. Tap 🔄 on any battery to flip its polarity.
                                    </p>

                                    {/* Flat layout container (600x340) */}
                                    {(() => {
                                        const hoverInfo = getHoveredSlotInfo();
                                        const slot1HoverType = hoverInfo.slot1;
                                        const slot2HoverType = hoverInfo.slot2;

                                        let slot1BorderClass = "border-dashed border-slate-700/80 bg-slate-900/20 hover:bg-slate-900/40 hover:border-slate-500/80";
                                        if (slot1HoverType === 'AA') {
                                            slot1BorderClass = "border-emerald-500/80 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.4)] shadow-emerald-500/40 animate-pulse";
                                        } else if (slot1HoverType) {
                                            slot1BorderClass = "border-rose-500/80 bg-rose-950/20 shadow-[0_0_20px_rgba(244,63,94,0.4)] shadow-rose-500/40 animate-shake";
                                        }

                                        let slot2BorderClass = "border-dashed border-slate-700/80 bg-slate-900/20 hover:bg-slate-900/40 hover:border-slate-500/80";
                                        if (slot2HoverType === 'AA') {
                                            slot2BorderClass = "border-emerald-500/80 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.4)] shadow-emerald-500/40 animate-pulse";
                                        } else if (slot2HoverType) {
                                            slot2BorderClass = "border-rose-500/80 bg-rose-950/20 shadow-[0_0_20px_rgba(244,63,94,0.4)] shadow-rose-500/40 animate-shake";
                                        }

                                        return (
                                            <div className="relative w-[600px] h-[340px] bg-slate-950/80 border-2 border-slate-800 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto">
                                                
                                                {/* Left Side Box (background decor) */}
                                                <div className="absolute left-[20px] top-[40px] w-[260px] h-[260px] bg-slate-900/60 border border-slate-800 rounded-xl pointer-events-none">
                                                    <div className="absolute top-2 left-4 text-[9px] font-bold tracking-wider text-slate-500 uppercase">Flashlight Battery Chamber</div>
                                                </div>

                                                {/* Slot 1: [-  +] (left: 40, top: 80, w: 220, h: 72) */}
                                                <div 
                                                    onClick={() => {
                                                        if (selectedBattery) {
                                                            const batId = selectedBattery;
                                                            const currentBat = batteryPool.find(b => b.id === batId);
                                                            if (currentBat) {
                                                                const batW = currentBat.type === 'Watch' ? 40 : currentBat.type === 'AAA' ? 112 : 144;
                                                                const batH = currentBat.type === 'Watch' ? 40 : currentBat.type === 'AAA' ? 32 : 40;
                                                                setBatteryPool(prev => prev.map(b => {
                                                                    if (b.id === batId) {
                                                                        return { 
                                                                            ...b, 
                                                                            slot: 'slot1', 
                                                                            x: 40 + (220 - batW) / 2, 
                                                                            y: 80 + (72 - batH) / 2 
                                                                        };
                                                                    }
                                                                    // Eject if already in slot1
                                                                    if (b.slot === 'slot1') {
                                                                        return { ...b, slot: null, x: b.initX, y: b.initY };
                                                                    }
                                                                    return b;
                                                                }));
                                                                setSelectedBattery(null);
                                                            }
                                                        }
                                                    }}
                                                    className={`absolute left-[40px] top-[80px] w-[220px] h-[72px] border-2 rounded-xl cursor-pointer flex items-center justify-between px-4 transition-all ${slot1BorderClass}`}
                                                >
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <span className="text-[10px] font-bold text-slate-500 tracking-wider">SLOT 1 [ -  + ]</span>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-500 pointer-events-none">-</span>
                                                    <span className="text-xs font-bold text-slate-500 pointer-events-none">+</span>
                                                </div>

                                                {/* Slot 2: [+  -] (left: 40, top: 200, w: 220, h: 72) */}
                                                <div 
                                                    onClick={() => {
                                                        if (selectedBattery) {
                                                            const batId = selectedBattery;
                                                            const currentBat = batteryPool.find(b => b.id === batId);
                                                            if (currentBat) {
                                                                const batW = currentBat.type === 'Watch' ? 40 : currentBat.type === 'AAA' ? 112 : 144;
                                                                const batH = currentBat.type === 'Watch' ? 40 : currentBat.type === 'AAA' ? 32 : 40;
                                                                setBatteryPool(prev => prev.map(b => {
                                                                    if (b.id === batId) {
                                                                        return { 
                                                                            ...b, 
                                                                            slot: 'slot2', 
                                                                            x: 40 + (220 - batW) / 2, 
                                                                            y: 200 + (72 - batH) / 2 
                                                                        };
                                                                    }
                                                                    // Eject if already in slot2
                                                                    if (b.slot === 'slot2') {
                                                                        return { ...b, slot: null, x: b.initX, y: b.initY };
                                                                    }
                                                                    return b;
                                                                }));
                                                                setSelectedBattery(null);
                                                            }
                                                        }
                                                    }}
                                                    className={`absolute left-[40px] top-[200px] w-[220px] h-[72px] border-2 rounded-xl cursor-pointer flex items-center justify-between px-4 transition-all ${slot2BorderClass}`}
                                                >
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <span className="text-[10px] font-bold text-slate-500 tracking-wider">SLOT 2 [ +  - ]</span>
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-500 pointer-events-none">+</span>
                                                    <span className="text-xs font-bold text-slate-500 pointer-events-none">-</span>
                                                </div>

                                                {/* Right Side Box (battery pool background decor) */}
                                                <div className="absolute left-[300px] top-[40px] w-[280px] h-[260px] bg-slate-900/30 border border-slate-800 rounded-xl pointer-events-none">
                                                    <div className="absolute top-2 left-4 text-[9px] font-bold tracking-wider text-slate-500 uppercase">Battery Pool</div>
                                                </div>

                                                {/* Batteries rendered inside parent relative container */}
                                                {batteryPool.map(bat => {
                                                    const isAA = bat.type === 'AA';
                                                    const isAAA = bat.type === 'AAA';
                                                    const isWatch = bat.type === 'Watch';

                                                    let sizeClass = "w-36 h-10";
                                                    if (isAAA) sizeClass = "w-28 h-8";
                                                    if (isWatch) sizeClass = "w-10 h-10 rounded-full";

                                                    const isSelected = selectedBattery === bat.id;

                                                    return (
                                                        <div
                                                            key={bat.id}
                                                            onMouseDown={(e) => handleItemMouseDown(e, bat.id)}
                                                            draggable="false"
                                                            onDragStart={(e) => e.preventDefault()}
                                                            onClick={(e) => {
                                                                if (justDraggedRef.current) {
                                                                     justDraggedRef.current = false;
                                                                     return;
                                                                 }
                                                                // Eject if already in a slot
                                                                if (bat.slot) {
                                                                    setBatteryPool(prev => prev.map(b => b.id === bat.id ? { ...b, slot: null, x: b.initX, y: b.initY } : b));
                                                                    if (selectedBattery === bat.id) {
                                                                        setSelectedBattery(null);
                                                                    }
                                                                } else {
                                                                    // Toggle selection in pool
                                                                    setSelectedBattery(prev => prev === bat.id ? null : bat.id);
                                                                }
                                                            }}
                                                            className={`absolute flex items-center justify-between shadow-lg border select-none ${isWatch ? 'rounded-full' : 'rounded-lg'} ${sizeClass} ${bat.bg} ${
                                                                isSelected 
                                                                    ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950 scale-105 border-amber-400' 
                                                                    : bat.slot 
                                                                        ? 'border-green-500/50 cursor-pointer' 
                                                                        : 'hover:border-slate-400 cursor-grab active:cursor-grabbing'
                                                            }`}
                                                            style={{
                                                                left: bat.x,
                                                                top: bat.y,
                                                                zIndex: 20 + (draggedId === bat.id ? 10 : 0) + (isSelected ? 5 : 0),
                                                                transform: !isWatch && bat.isFlipped ? 'rotate(180deg)' : 'rotate(0deg)',
                                                                transition: draggedId === bat.id ? 'none' : 'transform 0.3s ease-in-out, left 0.15s ease-out, top 0.15s ease-out, border-color 0.15s ease-out, ring-width 0.15s ease-out'
                                                            }}
                                                        >
                                                            {isWatch ? (
                                                                <div className="w-full h-full flex flex-col items-center justify-center p-1 text-[7px] text-center font-bold">
                                                                    <span>CR2032</span>
                                                                    <span className="text-[6px] opacity-80">3V</span>
                                                                </div>
                                                            ) : (
                                                                <div className="relative w-full h-full flex items-center justify-between px-3">
                                                                    <span className="text-[10px] font-black text-slate-400">-</span>
                                                                    <div className="flex flex-col items-center justify-center leading-none">
                                                                        <span className="text-[8px] tracking-tight">{bat.name}</span>
                                                                        <span className="text-[6px] opacity-85 font-mono">{bat.voltage} • {bat.health}</span>
                                                                    </div>
                                                                    <span className="text-[10px] font-black text-yellow-500">+</span>
                                                                    {/* Plus cap on right */}
                                                                    <div className="w-1.5 h-3 bg-yellow-500 rounded-r absolute -right-1.5 top-1/2 -translate-y-1/2 border border-yellow-600"></div>
                                                                </div>
                                                            )}

                                                            {/* Rotate Button Overlay (Only for non-watch batteries) */}
                                                            {!isWatch && (
                                                                <button
                                                                    onMouseDown={(e) => e.stopPropagation()}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setBatteryPool(prev => prev.map(b => b.id === bat.id ? { ...b, isFlipped: !b.isFlipped } : b));
                                                                        showStatPopup('clue', "Battery flipped!");
                                                                    }}
                                                                    className="absolute -top-3.5 -right-3.5 bg-slate-800 border border-slate-700 hover:border-slate-500 rounded-full w-6 h-6 flex items-center justify-center text-xs text-amber-400 shadow-md hover:scale-110 duration-200 active:scale-95 animate-in fade-in zoom-in duration-300 pointer-events-auto"
                                                                    title="Flip polarity"
                                                                >
                                                                    🔄
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })()}

                                    {/* Feedback Message */}
                                    <div className="mt-5 text-center min-h-[36px]">
                                        <p className="text-amber-400 text-xs font-mono font-medium tracking-wide max-w-lg mx-auto">
                                            {assembleMessage}
                                        </p>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="mt-2 flex gap-4">
                                        <button
                                            onClick={() => {
                                                setBatteryPool(prev => prev.map(b => ({ ...b, slot: null, x: b.initX, y: b.initY, isFlipped: false })));
                                                setSelectedBattery(null);
                                                setAssembleMessage("Reset complete! Re-insert batteries.");
                                            }}
                                            className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold rounded-xl text-xs tracking-wider uppercase transition-all hover:scale-105 active:scale-95 duration-200"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            onClick={handlePowerOn}
                                            className="px-8 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black rounded-xl text-xs tracking-widest uppercase shadow-lg shadow-amber-500/10 hover:shadow-amber-400/20 transition-all hover:scale-105 active:scale-95 duration-200"
                                        >
                                            Power On
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            )}

            {/* Desktop OS (always in background) */}
            <div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col transition-all duration-500 ${isDesktopVisible
                        ? 'opacity-100 scale-100 pointer-events-auto shadow-[0_30px_70px_rgba(0,0,0,0.4)]'
                        : 'opacity-0 scale-95 pointer-events-none'
                    }`}
            >
                {/* Screen Bezel (Matte Black Frame) */}
                <div className="bg-[#18181b] p-4 pb-6 rounded-3xl shadow-[0_30px_70px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.15)] border-[4px] border-zinc-800 flex flex-col relative">
                    
                    {/* Web Camera & Sensor Dot at Top */}
                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30">
                        <div className="w-1.5 h-1.5 bg-[#090d16] rounded-full border border-zinc-700/50 flex items-center justify-center">
                            <div className="w-0.5 h-0.5 bg-blue-500 rounded-full animate-pulse"></div>
                        </div>
                        <div className="w-1 h-1 bg-emerald-500/80 rounded-full animate-pulse"></div>
                    </div>

                    {/* Desktop OS Screen Container */}
                    <div className="w-[880px] h-[520px] bg-slate-900 rounded-lg flex flex-col overflow-hidden relative border border-black shadow-inner">
                {/* Desktop Wallpaper - High-Fidelity Windows 11 Bloom CSS Art */}
                <div className="absolute inset-0 z-0 bg-[#080b1a] overflow-hidden select-none">
                    {/* Ambient background glows */}
                    <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-indigo-900/40 to-purple-900/30 blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[75%] rounded-full bg-gradient-to-tr from-blue-900/50 to-cyan-900/30 blur-[100px] pointer-events-none" />
                    <div className="absolute top-[30%] left-[25%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[90px] pointer-events-none" />

                    {/* Windows 11 Bloom Petals/Ribbons CSS Art */}
                    <div className="absolute inset-0 flex items-center justify-center scale-[0.85] translate-y-[-10px] opacity-90 mix-blend-screen pointer-events-none">
                        {/* Petal 1: Center Deep Blue */}
                        <div 
                            className="absolute w-[320px] h-[360px] rounded-[40%_60%_70%_30%_/_40%_50%_60%_50%] bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-800 opacity-75 blur-[20px] rotate-[12deg] transform-gpu scale-105" 
                            style={{ transformOrigin: 'center bottom' }}
                        />
                        {/* Petal 2: Left Cyan Glow */}
                        <div 
                            className="absolute w-[280px] h-[340px] rounded-[50%_40%_60%_50%_/_60%_30%_70%_40%] bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-700 opacity-70 blur-[16px] -rotate-[24deg] translate-x-[-80px] translate-y-[20px] transform-gpu" 
                            style={{ transformOrigin: 'center bottom' }}
                        />
                        {/* Petal 3: Right Violet Glow */}
                        <div 
                            className="absolute w-[300px] h-[320px] rounded-[30%_70%_40%_60%_/_50%_60%_30%_70%] bg-gradient-to-bl from-purple-600 via-violet-600 to-blue-800 opacity-65 blur-[18px] rotate-[35deg] translate-x-[90px] translate-y-[10px] transform-gpu" 
                            style={{ transformOrigin: 'center bottom' }}
                        />
                        {/* Petal 4: Top Accent Bright Blue */}
                        <div 
                            className="absolute w-[220px] h-[280px] rounded-[60%_40%_50%_50%_/_40%_40%_60%_60%] bg-gradient-to-t from-blue-500 to-cyan-400 opacity-80 blur-[8px] rotate-[5deg] translate-y-[-40px] transform-gpu" 
                            style={{ transformOrigin: 'center bottom' }}
                        />
                        {/* Petal 5: Soft Highlight Pink/Violet */}
                        <div 
                            className="absolute w-[180px] h-[240px] rounded-[40%_50%_35%_65%_/_50%_50%_50%_50%] bg-gradient-to-tr from-fuchsia-500/80 via-purple-500/60 to-indigo-500/0 opacity-75 blur-[12px] -rotate-[15deg] translate-x-[-40px] translate-y-[-20px] transform-gpu" 
                            style={{ transformOrigin: 'center bottom' }}
                        />
                        {/* Center Core Highlights */}
                        <div className="absolute w-[120px] h-[120px] rounded-full bg-cyan-300 opacity-80 blur-[24px]" />
                        <div className="absolute w-[80px] h-[80px] rounded-full bg-white opacity-40 blur-[10px] translate-y-[-10px]" />
                    </div>
                    {/* Soft grid overlay for premium display texture */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />
                </div>

                {/* Desktop Icons Grid - Windows 11 Vertical Column Style */}
                <div className="relative z-10 flex-1 p-6 flex flex-col flex-wrap gap-3.5 content-start items-start h-[470px] select-none">
                    {/* Google Chrome Icon */}
                    <div
                        className="flex flex-col items-center gap-1.5 cursor-pointer p-2 rounded-xl w-[96px] group transition-all duration-250 ease-out hover:bg-white/12 hover:shadow-[0_8px_32px_rgba(0,0,0,0.37)] border border-transparent hover:border-white/20 backdrop-blur-[4px] active:scale-95 active:bg-white/8"
                        onDoubleClick={handleChromeClick}
                        onClick={handleChromeClick}
                    >
                        <div className="w-12 h-12 flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] group-hover:scale-105 transition-transform duration-200">
                            <svg className="w-11 h-11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" fill="#fff" />
                                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" fill="#fff" />
                                <path d="M12 6.5a5.5 5.5 0 0 1 4.76 2.75l-4.76 8.25-4.76-8.25A5.5 5.5 0 0 1 12 6.5z" fill="#fff" />
                                <path d="M12 2a9.96 9.96 0 0 0-7.07 2.93l3.54 6.13A5.5 5.5 0 0 1 12 6.5V2z" fill="#EA4335" />
                                <path d="M12 2v4.5a5.5 5.5 0 0 1 3.54 1.37l3.54-6.13A9.96 9.96 0 0 0 12 2z" fill="#EA4335" />
                                <path d="M22 12c0-2.31-.79-4.44-2.12-6.13l-3.54 6.13a5.5 5.5 0 0 1-1.34 3.54H22z" fill="#34A853" />
                                <path d="M15 15.54a5.5 5.5 0 0 1-6.54 0l-3.54 6.13A9.96 9.96 0 0 0 12 22c2.31 0 4.44-.79 6.13-2.12l-3.13-4.34z" fill="#FBBC05" />
                                <path d="M2 12c0 2.31.79 4.44 2.12 6.13l3.54-6.13A5.5 5.5 0 0 1 9 8.46H2z" fill="#FBBC05" />
                                <circle cx="12" cy="12" r="3.5" fill="#4285F4" />
                            </svg>
                        </div>
                        <span className="text-white text-[11.5px] font-semibold tracking-wide leading-tight text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] max-w-full truncate px-0.5">Google Chrome</span>
                    </div>

                    {/* Dummy Icon: This PC */}
                    <div 
                        className="flex flex-col items-center gap-1.5 cursor-pointer p-2 rounded-xl w-[96px] group transition-all duration-250 ease-out hover:bg-white/12 hover:shadow-[0_8px_32px_rgba(0,0,0,0.37)] border border-transparent hover:border-white/20 backdrop-blur-[4px] active:scale-95 active:bg-white/8" 
                        onClick={() => handleDummyIconClick("This PC", "C:\\")}
                    >
                        <div className="w-12 h-12 flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] group-hover:scale-105 transition-transform duration-200">
                            <svg className="w-11 h-11" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* Monitor Outer Stand Base */}
                                <path d="M14 42h20v2H14z" fill="url(#metalRim)" />
                                <path d="M16 40 L32 40 L30 42 L18 42 Z" fill="#475569" />
                                {/* Monitor Stand neck */}
                                <path d="M21 32h6v8h-6z" fill="url(#metalRim)" />
                                {/* Monitor back panel reflection */}
                                <rect x="3" y="5" width="42" height="28" rx="4" fill="#0f172a" />
                                {/* Monitor border chassis */}
                                <rect x="2" y="4" width="44" height="28" rx="4.5" fill="url(#pcMonitorGrad)" stroke="url(#metalRim)" strokeWidth="1.2" />
                                {/* Inner Screen display */}
                                <rect x="4.5" y="6.5" width="39" height="23" rx="1.5" fill="#090d16" />
                                {/* Miniature Windows 11 wallpaper bloom representation on screen */}
                                <circle cx="24" cy="18" r="8" fill="url(#screenBloom)" opacity="0.85" filter="blur(3px)" />
                                <circle cx="21" cy="16" r="6" fill="#06b6d4" opacity="0.65" filter="blur(4px)" />
                                <circle cx="27" cy="19" r="6" fill="#a855f7" opacity="0.55" filter="blur(4px)" />
                                <circle cx="24" cy="18" r="3" fill="#ffffff" opacity="0.4" filter="blur(2px)" />
                                {/* Light reflections on screen */}
                                <path d="M5 7 L43 7" stroke="#ffffff" strokeWidth="0.5" opacity="0.15" />
                                <path d="M5 7 L20 28" stroke="#ffffff" strokeWidth="0.5" opacity="0.08" />
                                <defs>
                                    <linearGradient id="pcMonitorGrad" x1="2" y1="4" x2="46" y2="32" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#1e293b" />
                                        <stop offset="100%" stopColor="#0f172a" />
                                    </linearGradient>
                                    <linearGradient id="screenBloom" x1="20" y1="14" x2="28" y2="22" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#2563eb" />
                                        <stop offset="100%" stopColor="#1d4ed8" />
                                    </linearGradient>
                                    <linearGradient id="metalRim" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#94a3b8" />
                                        <stop offset="50%" stopColor="#f8fafc" />
                                        <stop offset="100%" stopColor="#64748b" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <span className="text-white text-[11.5px] font-semibold tracking-wide leading-tight text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] max-w-full truncate px-0.5">This PC</span>
                    </div>

                    {/* Dummy Icon: Documents */}
                    <div 
                        className="flex flex-col items-center gap-1.5 cursor-pointer p-2 rounded-xl w-[96px] group transition-all duration-250 ease-out hover:bg-white/12 hover:shadow-[0_8px_32px_rgba(0,0,0,0.37)] border border-transparent hover:border-white/20 backdrop-blur-[4px] active:scale-95 active:bg-white/8" 
                        onClick={() => handleDummyIconClick("Documents", "C:\\Users\\Arjun\\Documents")}
                    >
                        <div className="w-12 h-12 flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] group-hover:scale-105 transition-transform duration-200">
                            <svg className="w-11 h-11" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* Folder Back */}
                                <path d="M4 12C4 9.79 5.79 8 8 8H18.58C19.91 8 21.18 8.53 22.12 9.47L25.66 13H40C42.21 13 44 14.79 44 17V40C44 42.21 42.21 44 40 44H8C5.79 44 4 42.21 4 40V12Z" fill="url(#docFolderBack)" />
                                
                                {/* Protruding Papers */}
                                {/* Paper 1 (Back slightly tilted) */}
                                <g transform="translate(10, 11) rotate(-4) scale(0.9)">
                                    <rect x="0" y="0" width="28" height="24" rx="2.5" fill="#f8fafc" />
                                    <line x1="4" y1="6" x2="24" y2="6" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                                    <line x1="4" y1="12" x2="20" y2="12" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
                                    <line x1="4" y1="18" x2="16" y2="18" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" />
                                </g>
                                {/* Paper 2 (Front straight) */}
                                <g transform="translate(12, 14)">
                                    <rect x="0" y="0" width="26" height="22" rx="2.5" fill="#ffffff" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />
                                    {/* Lines */}
                                    <line x1="4" y1="5" x2="22" y2="5" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
                                    <line x1="4" y1="10" x2="22" y2="10" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
                                    <line x1="4" y1="15" x2="18" y2="15" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
                                    {/* Tiny red badge/stamp */}
                                    <rect x="20" y="14" width="4" height="4" rx="1" fill="#ef4444" opacity="0.8" />
                                </g>

                                {/* Folder Front Flap with translucent frosted look */}
                                <path d="M4 18.5C4 16.5 5.5 15 7.5 15H40.5C42.5 15 44 16.5 44 18.5V40C44 42.2 42.2 44 40 44H8C5.8 44 4 42.2 4 40V18.5Z" fill="url(#docFolderFront)" opacity="0.9" />
                                <path d="M4 18.5C4 16.5 5.5 15 7.5 15H40.5C42.5 15 44 16.5 44 18.5V40" stroke="#ffebc2" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
                                
                                <defs>
                                    <linearGradient id="docFolderBack" x1="4" y1="8" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#f59e0b" />
                                        <stop offset="100%" stopColor="#b45309" />
                                    </linearGradient>
                                    <linearGradient id="docFolderFront" x1="4" y1="15" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#fbbf24" />
                                        <stop offset="50%" stopColor="#f59e0b" />
                                        <stop offset="100%" stopColor="#d97706" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <span className="text-white text-[11.5px] font-semibold tracking-wide leading-tight text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] max-w-full truncate px-0.5">Documents</span>
                    </div>

                    {/* Dummy Icon: My Invoices */}
                    <div 
                        className="flex flex-col items-center gap-1.5 cursor-pointer p-2 rounded-xl w-[96px] group transition-all duration-250 ease-out hover:bg-white/12 hover:shadow-[0_8px_32px_rgba(0,0,0,0.37)] border border-transparent hover:border-white/20 backdrop-blur-[4px] active:scale-95 active:bg-white/8" 
                        onClick={() => handleDummyIconClick("My Invoices", "C:\\Users\\Arjun\\Documents\\My Invoices")}
                    >
                        <div className="w-12 h-12 flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] group-hover:scale-105 transition-transform duration-200">
                            <svg className="w-11 h-11" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* Folder Back */}
                                <path d="M4 12C4 9.79 5.79 8 8 8H18.58C19.91 8 21.18 8.53 22.12 9.47L25.66 13H40C42.21 13 44 14.79 44 17V40C44 42.21 42.21 44 40 44H8C5.79 44 4 42.21 4 40V12Z" fill="url(#invFolderBack)" />
                                
                                {/* Protruding Invoice Papers */}
                                {/* Back paper sheet */}
                                <g transform="translate(10, 10) rotate(-6) scale(0.9)">
                                    <rect x="0" y="0" width="28" height="26" rx="2" fill="#f0fdf4" stroke="#86efac" strokeWidth="0.5" />
                                </g>
                                {/* Front invoice paper sheet */}
                                <g transform="translate(12, 13) rotate(-1)">
                                    <rect x="0" y="0" width="26" height="23" rx="2" fill="#ffffff" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.15))" />
                                    {/* Invoice Header */}
                                    <rect x="3" y="3" width="20" height="3" rx="0.5" fill="#10b981" />
                                    {/* Invoice Grid Rows */}
                                    <line x1="3" y1="9" x2="23" y2="9" stroke="#e2e8f0" strokeWidth="1" />
                                    <line x1="3" y1="13" x2="23" y2="13" stroke="#e2e8f0" strokeWidth="1" />
                                    <line x1="3" y1="17" x2="23" y2="17" stroke="#e2e8f0" strokeWidth="1" />
                                    {/* Miniature content */}
                                    <circle cx="5" cy="11" r="1" fill="#10b981" />
                                    <circle cx="5" cy="15" r="1" fill="#10b981" />
                                    <line x1="9" y1="11" x2="20" y2="11" stroke="#94a3b8" strokeWidth="1" />
                                    <line x1="9" y1="15" x2="18" y2="15" stroke="#94a3b8" strokeWidth="1" />
                                </g>

                                {/* Folder Front Flap */}
                                <path d="M4 18.5C4 16.5 5.5 15 7.5 15H40.5C42.5 15 44 16.5 44 18.5V40C44 42.2 42.2 44 40 44H8C5.8 44 4 42.2 4 40V18.5Z" fill="url(#invFolderFront)" opacity="0.9" />
                                <path d="M4 18.5C4 16.5 5.5 15 7.5 15H40.5C42.5 15 44 16.5 44 18.5V40" stroke="#d1fae5" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
                                
                                <defs>
                                    <linearGradient id="invFolderBack" x1="4" y1="8" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#0f766e" />
                                        <stop offset="100%" stopColor="#115e59" />
                                    </linearGradient>
                                    <linearGradient id="invFolderFront" x1="4" y1="15" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#14b8a6" />
                                        <stop offset="50%" stopColor="#0d9488" />
                                        <stop offset="100%" stopColor="#0f766e" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <span className="text-white text-[11.5px] font-semibold tracking-wide leading-tight text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] max-w-full truncate px-0.5">My Invoices</span>
                    </div>

                    {/* Dummy Icon: Aadhaar_Card_Copy.pdf */}
                    <div 
                        className="flex flex-col items-center gap-1.5 cursor-pointer p-2 rounded-xl w-[96px] group transition-all duration-250 ease-out hover:bg-white/12 hover:shadow-[0_8px_32px_rgba(0,0,0,0.37)] border border-transparent hover:border-white/20 backdrop-blur-[4px] active:scale-95 active:bg-white/8" 
                        onClick={() => handleDummyIconClick("Aadhaar_Card_Copy.pdf", "C:\\Users\\Arjun\\Documents\\Aadhaar_Card_Copy.pdf")}
                    >
                        <div className="w-12 h-12 flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] group-hover:scale-105 transition-transform duration-200">
                            <svg className="w-11 h-11" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* Document shadow and body */}
                                <path d="M8 5C8 2.24 10.24 0 13 0H33L45 12V43C45 45.76 42.76 48 40 48H13C10.24 48 8 45.76 8 43V5Z" fill="url(#pdfDocGrad)" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.3))" />
                                {/* Folded Corner */}
                                <path d="M33 0 L45 12 H36 C34.34 12 33 10.66 33 9V0Z" fill="#b91c1c" />
                                
                                {/* Miniature Aadhaar Card Mock Container */}
                                <g transform="translate(12, 17)">
                                    {/* Card background */}
                                    <rect x="0" y="0" width="24" height="16" rx="1.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5" />
                                    {/* Tricolor top header band */}
                                    <rect x="0.5" y="0.5" width="23" height="1.5" fill="#ff9933" />
                                    <rect x="0.5" y="2" width="23" height="1" fill="#ffffff" />
                                    <rect x="0.5" y="3" width="23" height="1.5" fill="#128807" />
                                    {/* Ashoka Chakra tiny blue dot */}
                                    <circle cx="12" cy="2.5" r="0.5" fill="#000088" />
                                    
                                    {/* Avatar photo on the left */}
                                    <rect x="2" y="6" width="5" height="6.5" rx="0.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.25" />
                                    <circle cx="4.5" cy="8" r="1.5" fill="#64748b" />
                                    <path d="M2.5 12C2.5 10.5 4 10.5 4.5 10.5C5 10.5 6.5 10.5 6.5 12Z" fill="#64748b" />
                                    
                                    {/* Text lines (Name, Address, etc.) */}
                                    <line x1="9" y1="6" x2="22" y2="6" stroke="#475569" strokeWidth="0.75" />
                                    <line x1="9" y1="8.5" x2="19" y2="8.5" stroke="#64748b" strokeWidth="0.5" />
                                    <line x1="9" y1="10.5" x2="17" y2="10.5" stroke="#94a3b8" strokeWidth="0.5" />
                                    
                                    {/* Aadhaar Number red/blue text lines representing xxxx xxxx xxxx */}
                                    <line x1="9" y1="13" x2="22" y2="13" stroke="#dc2626" strokeWidth="1" />
                                    
                                    {/* Miniature QR code on the right */}
                                    <rect x="18" y="8" width="4" height="4" fill="#1e293b" />
                                    <rect x="19" y="9" width="2" height="2" fill="#ffffff" />
                                </g>

                                {/* PDF Label Tag on Left-Bottom */}
                                <rect x="4" y="36" width="16" height="8" rx="1.5" fill="#dc2626" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.2))" />
                                <text x="12" y="42.5" fill="#ffffff" fontSize="6.5" fontWeight="bold" fontFamily="system-ui, -apple-system, sans-serif" textAnchor="middle" letterSpacing="0.5">PDF</text>
                                
                                <defs>
                                    <linearGradient id="pdfDocGrad" x1="8" y1="0" x2="45" y2="48" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#ef4444" />
                                        <stop offset="100%" stopColor="#991b1b" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <span className="text-white text-[11.5px] font-semibold tracking-wide leading-tight text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] line-clamp-2 w-full break-all">Aadhaar_Card_Copy.pdf</span>
                    </div>

                    {/* Dummy Icon: Recycle Bin */}
                    <div 
                        className="flex flex-col items-center gap-1.5 cursor-pointer p-2 rounded-xl w-[96px] group transition-all duration-250 ease-out hover:bg-white/12 hover:shadow-[0_8px_32px_rgba(0,0,0,0.37)] border border-transparent hover:border-white/20 backdrop-blur-[4px] active:scale-95 active:bg-white/8" 
                        onClick={() => handleDummyIconClick("Recycle Bin", "Recycle Bin")}
                    >
                        <div className="w-12 h-12 flex items-center justify-center filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)] group-hover:scale-105 transition-transform duration-200">
                            <svg className="w-11 h-11" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                {/* Trash Bin Lid handle */}
                                <path d="M20 7C20 6.45 20.45 6 21 6H27C27.55 6 28 6.45 28 7V9H20V7Z" fill="url(#metalRim)" />
                                {/* Trash Bin Lid */}
                                <path d="M11 9H37C38.1 9 39 9.9 39 11V12.5H9V11C9 9.9 9.9 9 11 9Z" fill="url(#metalRim)" stroke="#94a3b8" strokeWidth="0.5" />
                                
                                {/* Crumpled paper inside (visible because bin is translucent) */}
                                <path d="M18 20L21 17L24 19L22 23L18 20Z" fill="#cbd5e1" opacity="0.6" />
                                <path d="M26 28L30 25L32 29L28 32L26 28Z" fill="#ef4444" opacity="0.4" />
                                <path d="M22 34L25 31L28 33L26 37L22 34Z" fill="#94a3b8" opacity="0.5" />
                                
                                {/* Glass body with light blue/cyan gradient overlay */}
                                <path d="M12.5 12.5H35.5L33.2 41.5C33.05 43.4 31.45 44.8 29.55 44.8H18.45C16.55 44.8 14.95 43.4 14.8 41.5L12.5 12.5Z" fill="url(#glassBinBody)" stroke="url(#glassBinBorder)" strokeWidth="1.5" />
                                
                                {/* Wireframe grids/vertical panels */}
                                <line x1="17.5" y1="14.5" x2="19.5" y2="42.5" stroke="#e2e8f0" strokeWidth="1" opacity="0.5" />
                                <line x1="24" y1="14.5" x2="24" y2="42.5" stroke="#e2e8f0" strokeWidth="1.5" opacity="0.6" />
                                <line x1="30.5" y1="14.5" x2="28.5" y2="42.5" stroke="#e2e8f0" strokeWidth="1" opacity="0.5" />
                                
                                {/* Glass reflection sheen */}
                                <path d="M14 15 L16.5 42" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
                                
                                <defs>
                                    <linearGradient id="metalRim" x1="9" y1="6" x2="39" y2="12" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#cbd5e1" />
                                        <stop offset="50%" stopColor="#f8fafc" />
                                        <stop offset="100%" stopColor="#94a3b8" />
                                    </linearGradient>
                                    <linearGradient id="glassBinBody" x1="12.5" y1="12.5" x2="35.5" y2="44.8" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.3" />
                                        <stop offset="50%" stopColor="#bae6fd" stopOpacity="0.1" />
                                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.3" />
                                    </linearGradient>
                                    <linearGradient id="glassBinBorder" x1="12.5" y1="12.5" x2="35.5" y2="44.8" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
                                        <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.5" />
                                        <stop offset="100%" stopColor="#0284c7" opacity="0.8" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <span className="text-white text-[11.5px] font-semibold tracking-wide leading-tight text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] max-w-full truncate px-0.5">Recycle Bin</span>
                    </div>
                </div>

                {/* Windows 11 style error popup */}
                {windowsError && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center pointer-events-auto shadow-inner" onClick={() => setWindowsError(null)}>
                        <div 
                            className="w-[450px] bg-[#1f1f1f] text-white rounded-lg shadow-2xl border border-[#3c3c3c] overflow-hidden flex flex-col font-sans animate-zoom-in"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-2.5 bg-[#2d2d2d] border-b border-[#3c3c3c]">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-300 font-medium">{windowsError.title}</span>
                                </div>
                                <button 
                                    className="text-slate-400 hover:bg-red-600 hover:text-white rounded px-2.5 py-0.5 transition-colors duration-150 text-sm font-semibold"
                                    onClick={() => setWindowsError(null)}
                                >
                                    ✕
                                </button>
                            </div>
                            
                            {/* Body */}
                            <div className="p-6 flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div className="flex-1 flex flex-col gap-2">
                                    <h3 className="text-sm font-semibold text-white">Location is not available</h3>
                                    <div className="bg-[#2d2d2d] border border-[#3c3c3c] p-2 rounded text-xs font-mono break-all text-slate-300">
                                        {windowsError.path}
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                                        {windowsError.message}
                                    </p>
                                </div>
                            </div>
                            
                            {/* Footer */}
                            <div className="px-4 py-3 bg-[#2d2d2d] flex justify-end border-t border-[#3c3c3c]">
                                <button 
                                    className="px-6 py-1.5 bg-[#0067b8] hover:bg-[#005da6] active:bg-[#005293] text-white text-xs font-medium rounded transition-colors duration-150 shadow shadow-blue-900/20"
                                    onClick={() => setWindowsError(null)}
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Fake Browser Overlay for Secret Investigation on DASHBOARD */}
                {showBrowser && (
                    <div className="absolute inset-y-10 inset-x-20 bg-white rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden pointer-events-auto border border-slate-400 animate-slide-up" onClick={e => e.stopPropagation()}>
                        {/* Browser Window Title Bar */}
                        <div className="bg-[#dee1e6] h-9 flex items-center justify-between px-3 select-none shrink-0">
                            {/* Tabs on Left */}
                            <div className="flex items-end h-full gap-1 pt-1.5">
                                <div className="bg-white text-slate-700 text-[11px] font-medium px-4 h-[30px] rounded-t-lg flex items-center gap-1.5 shadow-sm border-t border-x border-slate-300">
                                    <svg className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12.2 2C6.6 2 2 6.6 2 12.2s4.6 10.2 10.2 10.2c5.6 0 10.2-4.6 10.2-10.2S17.8 2 12.2 2zm0 14c-1 0-1.8-.8-1.8-1.8s.8-1.8 1.8-1.8 1.8.8 1.8 1.8-.8 1.8-1.8 1.8z" />
                                    </svg>
                                    <span className="truncate w-24">Google Search</span>
                                    <span 
                                        className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full w-3.5 h-3.5 flex items-center justify-center ml-1 text-[9px] cursor-pointer"
                                        onClick={() => setShowBrowser(false)}
                                    >
                                        ✕
                                    </span>
                                </div>
                                <div className="text-slate-500 hover:bg-slate-300 hover:text-slate-800 rounded-full w-5 h-5 flex items-center justify-center mb-1 cursor-pointer transition-colors text-xs font-semibold">
                                    +
                                </div>
                            </div>

                            {/* Windows Window Controls on Right */}
                            <div className="flex items-center h-full">
                                <div className="w-11 h-full hover:bg-slate-300 flex items-center justify-center cursor-pointer transition-colors text-slate-700 text-xs">
                                    ‒
                                </div>
                                <div className="w-11 h-full hover:bg-slate-300 flex items-center justify-center cursor-pointer transition-colors text-slate-700">
                                    <div className="w-2.5 h-2.5 border border-slate-700"></div>
                                </div>
                                <div 
                                    className="w-11 h-full hover:bg-red-650 hover:text-white flex items-center justify-center cursor-pointer transition-colors text-slate-700 text-sm font-light"
                                    onClick={() => setShowBrowser(false)}
                                >
                                    ✕
                                </div>
                            </div>
                        </div>

                        {/* Navigation Bar */}
                        <div className="bg-white h-9 flex items-center px-2 border-b border-slate-300 gap-2 shrink-0">
                            {/* Navigation Arrows */}
                            <div className="flex gap-1">
                                <button className="w-7 h-7 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 transition-colors cursor-not-allowed">
                                    ←
                                </button>
                                <button className="w-7 h-7 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 transition-colors cursor-not-allowed">
                                    →
                                </button>
                                <button className="w-7 h-7 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-600 transition-colors cursor-pointer" onClick={() => setSearchStatus('idle')}>
                                    ↻
                                </button>
                            </div>

                            {/* URL Address Bar */}
                            <div className="flex-1 bg-[#f1f3f4] hover:bg-[#e8eaed] focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 rounded-full h-7 px-4 flex items-center text-xs text-slate-700 border border-transparent transition-all gap-1.5 shadow-inner">
                                <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-slate-400 font-normal">https://</span>
                                <span className="text-slate-800 font-medium">www.google.com</span>
                            </div>

                            {/* Profile & Extensions */}
                            <div className="flex gap-1.5 pr-1.5">
                                <div className="w-7 h-7 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-600 cursor-pointer transition-colors">
                                    ★
                                </div>
                                <div className="w-7 h-7 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-600 cursor-pointer transition-colors relative">
                                    <div className="w-5 h-5 bg-gradient-to-tr from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-[10px] text-white font-bold">A</div>
                                </div>
                            </div>
                        </div>
                        {/* Browser Content */}
                        <div className={`flex-1 bg-white overflow-y-auto select-none ${searchStatus === 'done' ? 'flex flex-col' : 'flex flex-col items-center justify-center p-8'}`}>
                            {searchStatus === 'done' ? (
                                <div className="w-full flex flex-col font-sans text-left">
                                    {/* Google Results Header */}
                                    <div className="border-b border-slate-200 bg-[#f8f9fa] px-8 py-4 flex flex-col gap-3 sticky top-0 z-10 shrink-0">
                                        <div className="flex items-center gap-6">
                                            {/* Google Logo */}
                                            <h1 className="text-xl font-bold text-blue-600 flex items-center gap-0.5 tracking-tight cursor-pointer" onClick={() => setSearchStatus('idle')}>
                                                <span className="text-[#4285F4]">G</span>
                                                <span className="text-[#EA4335]">o</span>
                                                <span className="text-[#FBBC05]">o</span>
                                                <span className="text-[#4285F4]">g</span>
                                                <span className="text-[#34A853]">l</span>
                                                <span className="text-[#EA4335]">e</span>
                                            </h1>
                                            {/* Header Search Box */}
                                            <div className="flex-1 max-w-xl bg-white border border-slate-200 rounded-full h-9 px-4 flex items-center shadow-sm text-xs gap-3 pointer-events-auto">
                                                <input
                                                    type="text"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="flex-1 bg-transparent border-none outline-none text-slate-800 text-xs font-sans font-medium"
                                                    disabled={true}
                                                />
                                                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                            </div>
                                        </div>
                                        {/* Google Search Tabs */}
                                        <div className="flex gap-6 text-xs text-slate-600 font-medium pl-20 select-none">
                                            <span className="text-blue-600 border-b-2 border-blue-600 pb-1.5 cursor-pointer flex items-center gap-1">🔍 All</span>
                                            <span className="hover:text-slate-900 cursor-pointer flex items-center gap-1">📰 News</span>
                                            <span className="hover:text-slate-900 cursor-pointer flex items-center gap-1">🖼️ Images</span>
                                            <span className="hover:text-slate-900 cursor-pointer flex items-center gap-1">🎥 Videos</span>
                                            <span className="hover:text-slate-900 cursor-pointer flex items-center gap-1">🗺️ Maps</span>
                                        </div>
                                    </div>

                                    {/* Results Column */}
                                    <div className="px-28 py-6 flex flex-col gap-6 max-w-3xl">
                                        <span className="text-xs text-slate-500">About 1,84,000 results (0.32 seconds)</span>

                                        {/* FEATURED SNIPPET */}
                                        <div className="border border-slate-200 rounded-2xl bg-slate-50/50 p-6 shadow-sm flex flex-col gap-3 relative animate-slide-up">
                                            <div className="flex items-center gap-2 text-[10px] text-red-600 font-extrabold uppercase tracking-wider">
                                                <span>⚠️ MHA Cyber Crime Advisory</span>
                                                <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full">Scam Detected</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900">
                                                Is 'Digital Arrest' a legal police procedure in India?
                                            </h3>
                                            <p className="text-slate-700 text-xs leading-relaxed">
                                                There is <strong className="text-red-600">NO provision under Indian law</strong> for 'Digital Arrest'. Real law enforcement agencies like CBI, ED, Police, or Customs will never:
                                            </p>
                                            <ul className="list-disc pl-5 text-slate-650 text-xs leading-relaxed space-y-1">
                                                <li>Contact you via video call (WhatsApp, Skype, Zoom) to detain or inspect you.</li>
                                                <li>Demand immediate money transfers or security deposits to avoid prison.</li>
                                                <li>Ask you to share your screen, show your banking apps, or keep your camera on.</li>
                                            </ul>
                                            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
                                                <span>Source: <strong>cybercrime.gov.in</strong> • National Cyber Crime Portal</span>
                                                <span className="text-blue-600 hover:underline cursor-pointer">Read Full Advisory</span>
                                            </div>
                                            <div className="mt-4 bg-red-100 border border-red-200 p-3 rounded-lg text-red-950 text-xs font-mono font-bold tracking-wide text-center animate-pulse">
                                                🚨 WARNING: THE AGENT Rajesh Sharma ON YOUR ZOOM CALL IS A SCAMMER. HANG UP IMMEDIATELY.
                                            </div>
                                        </div>

                                        {/* RESULT 1 */}
                                        <div className="flex flex-col gap-1.5">
                                            <div className="text-[11px] text-slate-600 flex items-center gap-1 font-mono">
                                                <span>https://www.cybercrime.gov.in</span>
                                                <span>›</span>
                                                <span>digital-arrest-fraud</span>
                                            </div>
                                            <a href="#" onClick={e => e.preventDefault()} className="text-lg text-blue-800 hover:underline font-medium leading-snug block">
                                                National Cyber Crime Portal: Beware of Online Extortion
                                            </a>
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                Official notification issued by the Ministry of Home Affairs (MHA) advising the public not to succumb to threats of 'Digital Arrest'. Real officers do not conduct video call inspections or demand asset settlements.
                                            </p>
                                        </div>

                                        {/* RESULT 2 */}
                                        <div className="flex flex-col gap-1.5">
                                            <div className="text-[11px] text-slate-600 flex items-center gap-1 font-mono">
                                                <span>https://timesofindia.indiatimes.com</span>
                                                <span>›</span>
                                                <span>gadgets-news</span>
                                            </div>
                                            <a href="#" onClick={e => e.preventDefault()} className="text-lg text-blue-800 hover:underline font-medium leading-snug block">
                                                How fraudsters use Zoom calls to keep victims in virtual arrest
                                            </a>
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                A detailed analysis of the psychological tricks used by scammers to isolate victims, claiming immediate police presence outside their doors to prevent them from consulting family or friends.
                                            </p>
                                        </div>

                                        {/* RESULT 3 */}
                                        <div className="flex flex-col gap-1.5">
                                            <div className="text-[11px] text-slate-600 flex items-center gap-1 font-mono">
                                                <span>https://www.rbi.org.in</span>
                                                <span>›</span>
                                                <span>safety-tips</span>
                                            </div>
                                            <a href="#" onClick={e => e.preventDefault()} className="text-lg text-blue-800 hover:underline font-medium leading-snug block">
                                                RBI Says: Stay Safe Against Financial Extortion Tactics
                                            </a>
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                The Reserve Bank of India cautions citizens never to transfer funds into "Supreme Court Verification Accounts" or any security wallets under fear of legal action.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-5xl font-bold text-blue-600 mb-8 flex items-center gap-0.5 tracking-tight font-sans">
                                        <span className="text-[#4285F4]">G</span>
                                        <span className="text-[#EA4335]">o</span>
                                        <span className="text-[#FBBC05]">o</span>
                                        <span className="text-[#4285F4]">g</span>
                                        <span className="text-[#34A853]">l</span>
                                        <span className="text-[#EA4335]">e</span>
                                    </h1>
                                    <div className="w-full max-w-xl bg-white border border-slate-200 hover:shadow-md focus-within:shadow-md focus-within:border-slate-300 rounded-full h-11 px-4 flex items-center shadow-sm text-sm transition-all gap-3 pointer-events-auto">
                                        <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="flex-1 bg-transparent border-none outline-none text-slate-800 text-sm font-sans"
                                            placeholder="Search Google or type a URL"
                                            disabled={searchStatus !== 'idle'}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && searchStatus === 'idle') {
                                                    triggerSearch();
                                                }
                                            }}
                                            autoFocus
                                        />
                                        <div className="flex items-center gap-2 shrink-0">
                                            {/* Google Mic */}
                                            <svg className="w-4 h-4 text-blue-500 cursor-pointer" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                                                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                                            </svg>
                                            {/* Google Lens */}
                                            <svg className="w-4 h-4 text-red-500 cursor-pointer" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9V6a3 3 0 013-3h3m9 0a3 3 0 013 3v3m0 9a3 3 0 01-3 3h-3M9 21H6a3 3 0 01-3-3v-3" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        </div>
                                    </div>
                                    
                                    {searchStatus === 'idle' && (
                                        <>
                                            <div className="mt-6 flex gap-3 pointer-events-auto">
                                                <button
                                                    className="bg-[#f8f9fa] hover:bg-[#f1f3f4] text-slate-700 px-4 py-2 border border-transparent hover:border-slate-200 rounded text-xs font-medium transition-all"
                                                    onClick={triggerSearch}
                                                >
                                                    Google Search
                                                </button>
                                                <button
                                                    className="bg-[#f8f9fa] hover:bg-[#f1f3f4] text-slate-700 px-4 py-2 border border-transparent hover:border-slate-200 rounded text-xs font-medium transition-all"
                                                    onClick={triggerSearch}
                                                >
                                                    I'm Feeling Lucky
                                                </button>
                                            </div>
                                            <div className="text-[12px] text-slate-500 mt-6 font-sans">
                                                Google offered in: <span className="text-blue-700 hover:underline cursor-pointer">हिन्दी</span> <span className="text-blue-700 hover:underline cursor-pointer">বাংলা</span> <span className="text-blue-700 hover:underline cursor-pointer">తెలుగు</span> <span className="text-blue-700 hover:underline cursor-pointer">मराठी</span>
                                            </div>
                                        </>
                                    )}
                                    {searchStatus === 'searching' && (
                                        <div className="mt-12 text-slate-500 font-mono animate-pulse text-sm">Searching the web...</div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Windows 11 Style Taskbar */}
                <div className="h-12 bg-[#1c1f26]/75 backdrop-blur-xl border-t border-white/10 flex items-center px-4 justify-between z-20 relative select-none shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
                    {/* Left: Widgets/Weather */}
                    <div className="flex items-center w-36 gap-2">
                        <span className="text-slate-300 text-xs select-none">⛅ 28°C</span>
                    </div>

                    {/* Center: Centered Windows 11 Taskbar Icons */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                        {/* Windows Start Button (Windows 11 Centered Logo) */}
                        <div className="w-9 h-9 hover:bg-white/12 active:scale-90 rounded-md flex items-center justify-center cursor-pointer transition-all duration-200 group">
                            <svg className="w-4.5 h-4.5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="0" y="0" width="11" height="11" fill="#0078d4" rx="0.5" />
                                <rect x="13" y="0" width="11" height="11" fill="#0078d4" rx="0.5" />
                                <rect x="0" y="13" width="11" height="11" fill="#0078d4" rx="0.5" />
                                <rect x="13" y="13" width="11" height="11" fill="#0078d4" rx="0.5" />
                            </svg>
                        </div>
                        {/* Taskbar Search Icon */}
                        <div className="w-9 h-9 hover:bg-white/12 active:scale-90 rounded-md flex items-center justify-center cursor-pointer transition-all duration-200">
                            <svg className="w-4.5 h-4.5 text-slate-350" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        {/* Pinned App: File Explorer */}
                        <div 
                            className="w-9 h-9 hover:bg-white/12 active:scale-90 rounded-md flex items-center justify-center cursor-pointer transition-all duration-200 group"
                            onClick={() => handleDummyIconClick("This PC", "C:\\")}
                        >
                            <svg className="w-5.5 h-5.5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 5.5C2 4.12 3.12 3 4.5 3H9.5L12 5.5H20C21.1 5.5 22 6.4 22 7.5V18.5C22 19.88 20.88 21 19.5 21H4.5C3.12 21 2 19.88 2 18.5V5.5Z" fill="url(#explorerFolderBack)" />
                                <path d="M2 8.5C2 7.12 3.12 6 4.5 6H19.5C20.88 6 22 7.12 22 8.5V18.5C22 19.88 20.88 21 19.5 21H4.5C3.12 21 2 19.88 2 18.5V8.5Z" fill="url(#explorerFolderFront)" />
                                <rect x="5" y="10" width="14" height="7" rx="1" fill="#ffffff" opacity="0.15" />
                                <defs>
                                    <linearGradient id="explorerFolderBack" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#f59e0b" />
                                        <stop offset="100%" stopColor="#d97706" />
                                    </linearGradient>
                                    <linearGradient id="explorerFolderFront" x1="2" y1="6" x2="22" y2="21" gradientUnits="userSpaceOnUse">
                                        <stop offset="0%" stopColor="#fbbf24" />
                                        <stop offset="100%" stopColor="#b45309" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        {/* Pinned/Running App: Google Chrome */}
                        <div 
                            className={`w-9 h-9 hover:bg-white/12 active:scale-90 rounded-md flex flex-col items-center justify-center cursor-pointer transition-all duration-200 relative group ${
                                showBrowser ? 'bg-white/12' : ''
                            }`}
                            onClick={handleChromeClick}
                        >
                            <svg className="w-5 h-5 group-hover:scale-105 transition-transform" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" fill="#fff" />
                                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" fill="#fff" />
                                <path d="M12 6.5a5.5 5.5 0 0 1 4.76 2.75l-4.76 8.25-4.76-8.25A5.5 5.5 0 0 1 12 6.5z" fill="#fff" />
                                <path d="M12 2a9.96 9.96 0 0 0-7.07 2.93l3.54 6.13A5.5 5.5 0 0 1 12 6.5V2z" fill="#EA4335" />
                                <path d="M12 2v4.5a5.5 5.5 0 0 1 3.54 1.37l3.54-6.13A9.96 9.96 0 0 0 12 2z" fill="#EA4335" />
                                <path d="M22 12c0-2.31-.79-4.44-2.12-6.13l-3.54 6.13a5.5 5.5 0 0 1-1.34 3.54H22z" fill="#34A853" />
                                <path d="M15 15.54a5.5 5.5 0 0 1-6.54 0l-3.54 6.13A9.96 9.96 0 0 0 12 22c2.31 0 4.44-.79 6.13-2.12l-3.13-4.34z" fill="#FBBC05" />
                                <path d="M2 12c0 2.31.79 4.44 2.12 6.13l3.54-6.13A5.5 5.5 0 0 1 9 8.46H2z" fill="#FBBC05" />
                                <circle cx="12" cy="12" r="3.5" fill="#4285F4" />
                            </svg>
                            {/* Active Indicator Bar */}
                            <div className={`absolute bottom-0.5 h-0.5 rounded-full transition-all duration-300 ${showBrowser ? 'bg-blue-400 w-3.5' : 'bg-slate-400 w-1'}`}></div>
                        </div>
                    </div>

                    {/* Right: Clock & System Tray */}
                    <div className="flex items-center gap-3 text-slate-200 text-xs px-2 justify-end w-36">
                        <div className="flex items-center gap-2 px-2 py-1 hover:bg-white/10 rounded-md transition-all duration-200 cursor-pointer select-none">
                            {/* WiFi */}
                            <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.11 12.4a4.99 4.99 0 017.78 0M5.22 9.51a8.99 8.99 0 0113.56 0M2.34 6.62a13 13 0 0119.32 0M12 18h.01" />
                            </svg>
                            {/* Speaker */}
                            <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                            {/* Battery */}
                            <div className="flex items-center gap-[1px] border border-slate-300 rounded-[2px] p-[1.5px] w-4.5 h-2.5">
                                <div className="bg-slate-300 h-full w-[85%] rounded-[0.5px]"></div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end leading-none cursor-pointer hover:bg-white/10 px-2 py-1 rounded-md transition-all select-none">
                            <span className="font-semibold text-[11px] text-slate-200">{formatSystemTime().timeStr}</span>
                            <span className="text-[9px] text-slate-450 mt-0.5">{formatSystemTime().dateStr}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Monitor Bottom Brand Text & Logo */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-zinc-550 font-mono text-[9px] font-black tracking-[0.2em] uppercase select-none opacity-85 flex items-center gap-1">
                <span className="text-cyan-500">❖</span> SENTINEL_DISPLAY
            </div>

            {/* Small Power LED Indicator at Bottom Right */}
            <div className="absolute bottom-1.5 right-6 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                <span className="text-zinc-650 text-[7px] font-bold tracking-widest font-mono">ON</span>
            </div>
        </div>

        {/* Hinge/Base Stand of the Display */}
        <div className="w-36 h-3 bg-gradient-to-r from-zinc-700 via-zinc-800 to-zinc-700 mx-auto rounded-b-md shadow-md border-t border-zinc-700/50 z-0"></div>
        <div className="w-48 h-1.5 bg-gradient-to-r from-zinc-800 via-zinc-900 to-zinc-800 mx-auto rounded-b-lg shadow-lg z-0"></div>
    </div>

            {/* Ringing Prompt */}
            {phase === 'ringing' && (
                <div className="absolute bottom-16 z-40">
                    <InteractionPrompt text="Press E to attend phone" />
                </div>
            )}

            {/* Phone Device UI (Includes Calls, WhatsApp, Home Screen) */}
            {(phase === 'call_ui' || phase === 'dialogue' || phase === 'whatsapp_noti' || phase === 'whatsapp_ui' || phase === 'zoom_dialogue' || phase === 'whatsapp_file_delivery' || phase === 'whatsapp_noti_received') && (
                <div className={`absolute inset-0 z-50 flex animate-fade-in pointer-events-none transition-all duration-700 ${isDesktopVisible
                        ? 'justify-end items-end p-8'
                        : 'bg-black/80 backdrop-blur-md items-center justify-center'
                    }`}>
                    <div className={`w-[320px] h-[650px] bg-slate-900 rounded-[50px] p-2 relative flex flex-col transform transition-all duration-700 border-[4px] border-slate-800 pointer-events-auto ${isDesktopVisible
                            ? 'scale-[0.8] origin-bottom-right shadow-[0_20px_50px_rgba(0,0,0,0.5)] translate-y-4'
                            : 'shadow-2xl scale-100 animate-slide-up'
                        }`}>
                        {/* Hardware Buttons */}
                        <div className="absolute top-[120px] -left-2.5 w-1.5 h-12 bg-slate-700 rounded-l-md"></div>
                        <div className="absolute top-[180px] -left-2.5 w-1.5 h-12 bg-slate-700 rounded-l-md"></div>
                        <div className="absolute top-[140px] -right-2.5 w-1.5 h-16 bg-slate-700 rounded-r-md"></div>

                        {/* Phone Screen */}
                        <div
                            className="flex-1 bg-slate-950 rounded-[40px] overflow-hidden relative flex flex-col items-center border-4 border-black"
                            onClick={(phase === 'dialogue' || phase === 'zoom_dialogue' || phase === 'whatsapp_noti_received') ? handleDialogueInteraction : undefined}
                        >
                            <div className="absolute inset-0 bg-slate-950 z-0 pointer-events-none"></div>

                            {/* Phone Background Wallpaper for Home Screen / WhatsApp */}
                            {(phase === 'whatsapp_ui' || phase === 'whatsapp_file_delivery') && (
                                <div className="absolute inset-0 bg-[#efeae2] z-0 overflow-hidden select-none pointer-events-none">
                                    <svg className="absolute inset-0 w-full h-full opacity-[0.06] mix-blend-multiply" xmlns="http://www.w3.org/2000/svg">
                                        <defs>
                                            <pattern id="waPattern" width="40" height="40" patternUnits="userSpaceOnUse">
                                                <path d="M20 0 L20 40 M0 20 L40 20" stroke="#000" strokeWidth="0.5" fill="none" />
                                                <circle cx="20" cy="20" r="2.5" fill="#000" />
                                                <path d="M10 10 L15 15 M15 10 L10 15" stroke="#000" strokeWidth="0.5" fill="none" />
                                                <path d="M30 30 L35 35 M35 30 L30 35" stroke="#000" strokeWidth="0.5" fill="none" />
                                            </pattern>
                                        </defs>
                                        <rect width="100%" height="100%" fill="url(#waPattern)" />
                                    </svg>
                                </div>
                            )}
                            {phase === 'whatsapp_noti' && (
                                <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#0f172a] z-0 select-none pointer-events-none">
                                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent"></div>
                                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-purple-500/30 via-transparent to-transparent"></div>
                                </div>
                            )}

                            {/* Phone Status Bar */}
                            <div className="absolute top-2.5 left-0 right-0 h-5 px-6 z-40 flex justify-between items-center text-white text-[10px] font-semibold select-none pointer-events-none tracking-wider font-mono">
                                <span>{['bedroom_return_walk', 'living_room_return_walk', 'study_return_walk', 'garden_walk_night', 'neighbor_conversation'].includes(phase) || finalOutcome ? '12:45' : ['whatsapp_file_delivery', 'whatsapp_noti_received', 'zoom_ui', 'zoom_dialogue'].includes(phase) ? (['washroom_opening', 'washroom_request_1', 'washroom_pushback_1', 'camera_demand'].includes(currentNode) ? '12:45' : '09:36') : '09:28'}</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[8px] font-sans font-bold opacity-80">5G</span>
                                    <div className="flex items-end gap-[1px] h-2 opacity-80">
                                        <div className="w-[1.5px] h-[3px] bg-white rounded-2xs"></div>
                                        <div className="w-[1.5px] h-[5px] bg-white rounded-2xs"></div>
                                        <div className="w-[1.5px] h-[7px] bg-white rounded-2xs"></div>
                                        <div className="w-[1.5px] h-[9px] bg-white rounded-2xs"></div>
                                    </div>
                                    <svg className="w-3 h-3 text-white opacity-80" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 21l-12-18c0 0 4.5-3 12-3s12 3 12 3l-12 18z" />
                                    </svg>
                                    <div className="flex items-center gap-[1px] border border-white/80 rounded-[3px] p-[1.5px] w-5 h-2.5 opacity-80">
                                        <div className="bg-white h-full w-[80%] rounded-[1px]"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Phone Home Indicator Bar */}
                            <div className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 rounded-full z-40 pointer-events-none transition-colors duration-300 ${(phase === 'whatsapp_ui' || phase === 'whatsapp_file_delivery') ? 'bg-black/25' : 'bg-white/35'
                                }`}></div>

                            {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-3xl z-30 flex justify-center items-center gap-3 pointer-events-none">
                                <div className="w-12 h-1.5 bg-slate-800 rounded-full"></div>
                                <div className="w-2 h-2 bg-indigo-900/50 rounded-full border border-slate-800"></div>
                            </div>

                            <div className="relative z-10 flex flex-col items-center w-full h-full">
                                {phase === 'call_ui' ? (
                                    <div className="w-full h-full flex flex-col pt-12 pb-8 px-5 relative z-10 bg-gradient-to-b from-[#1c1d22]/90 via-[#0f1013]/95 to-[#1c1d22]/90 backdrop-blur-xl">
                                        {/* Caller Avatar */}
                                        <div className="mt-14 flex flex-col items-center flex-1 w-full text-center">
                                            <div className="relative mb-6">
                                                <div className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping"></div>
                                                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#3b3f4c] to-[#1e2029] flex items-center justify-center text-4xl text-white font-bold border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                                                    FE
                                                </div>
                                                <div className="absolute bottom-0 right-0 w-7 h-7 bg-emerald-500 border-2 border-[#121316] rounded-full flex items-center justify-center shadow-lg">
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-1.5 justify-center mb-1">
                                                <h2 className="text-3xl font-light text-white tracking-wide">FedEx</h2>
                                            </div>
                                            
                                            <div className="text-[11px] font-medium text-amber-500/90 bg-amber-500/5 px-3 py-1 rounded-full border border-amber-500/10 tracking-wide inline-flex items-center gap-1 mb-2">
                                                <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                Mumbai Customs Compliance
                                            </div>
                                            <div className="text-slate-400 font-mono text-xs tracking-wider">+1 (800) 463-3339</div>
                                            <div className="text-slate-500 text-[10px] uppercase font-semibold mt-1.5 tracking-widest">Verified Identity</div>
                                        </div>

                                        {/* iOS-like small action options */}
                                        <div className="flex justify-around w-full px-6 mb-8 text-white/50 text-[10px] pointer-events-auto">
                                            <div className="flex flex-col items-center gap-1.5 cursor-not-allowed hover:text-white/80 transition-colors">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                <span>Remind Me</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1.5 cursor-not-allowed hover:text-white/80 transition-colors">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                                </svg>
                                                <span>Message</span>
                                            </div>
                                        </div>

                                        {/* Action buttons (iOS circular Accept/Decline) */}
                                        <div className="flex w-full justify-between px-6 mb-10 pointer-events-auto">
                                            <div
                                                className="flex flex-col items-center gap-2.5 cursor-pointer group"
                                                onClick={() => setPhase('working')}
                                            >
                                                <div className="relative">
                                                    <div className="absolute inset-0 rounded-full bg-red-650/20 group-hover:scale-110 transition-transform"></div>
                                                    <button className="w-16 h-16 bg-red-650 rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(220,38,38,0.3)] transition-all duration-200 group-hover:bg-red-500 relative z-10">
                                                        <svg className="w-7 h-7 text-white transform rotate-[135deg]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                                                    </button>
                                                </div>
                                                <span className="text-slate-400 text-xs font-medium tracking-wide">Decline</span>
                                            </div>
                                            <div
                                                className="flex flex-col items-center gap-2.5 cursor-pointer group"
                                                onClick={() => setPhase('dialogue')}
                                            >
                                                <div className="relative">
                                                    <div className="absolute -inset-1.5 bg-green-500/20 rounded-full animate-ping"></div>
                                                    <button className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(22,163,74,0.35)] transition-all duration-200 group-hover:bg-green-500 relative z-10">
                                                        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                                                    </button>
                                                </div>
                                                <span className="text-slate-400 text-xs font-medium tracking-wide">Accept</span>
                                            </div>
                                        </div>
                                    </div>                                ) : phase === 'dialogue' ? (
                                    <div className="w-full h-full flex flex-col pt-12 pb-6 px-4 relative z-10">
                                        {/* Active Call Header */}
                                        <div className="w-full flex items-center gap-3 mt-6 mb-4 border-b border-slate-800/80 pb-4 pointer-events-none">
                                            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-md">VS</div>
                                            <div className="text-left">
                                                <div className="text-white text-sm font-semibold flex items-center gap-1">
                                                    <span>Vikram Sharma</span>
                                                    <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                                </div>
                                                <div className="text-indigo-400 text-xs flex items-center gap-1 font-mono">
                                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                                    {formatCallDuration()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Call Controls Grid */}
                                        <div className="grid grid-cols-3 gap-6 w-full px-4 mt-6 mb-6 select-none opacity-60 pointer-events-none">
                                            <div className="flex flex-col items-center gap-1.5 text-slate-400">
                                                <div className="w-11 h-11 rounded-full bg-slate-900 flex items-center justify-center"><svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg></div>
                                                <span className="text-[9px] uppercase tracking-wider font-semibold">mute</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1.5 text-slate-400">
                                                <div className="w-11 h-11 rounded-full bg-slate-900 flex items-center justify-center"><svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-9-7.5h12" /></svg></div>
                                                <span className="text-[9px] uppercase tracking-wider font-semibold">keypad</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1.5 text-slate-400">
                                                <div className="w-11 h-11 rounded-full bg-slate-900 flex items-center justify-center"><svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg></div>
                                                <span className="text-[9px] uppercase tracking-wider font-semibold">speaker</span>
                                            </div>
                                        </div>

                                        {/* Agent Text */}
                                        {DIALOGUE_TREE[currentNode]?.agent && DIALOGUE_TREE[currentNode].agent.length > 0 && (
                                            <div className="w-full bg-slate-900/60 backdrop-blur-sm rounded-2xl p-4 mb-auto border border-slate-700/80 shadow-lg relative pointer-events-none text-left">
                                                <div className="text-slate-200 text-sm leading-relaxed min-h-[80px]">
                                                    {displayedText}
                                                    {!isTyping && (!DIALOGUE_TREE[currentNode].choices || lineIndex < DIALOGUE_TREE[currentNode].agent.length - 1) && (
                                                        <span className="animate-pulse ml-1 text-indigo-400">▼</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Choices */}
                                        {!isTyping && DIALOGUE_TREE[currentNode]?.choices && lineIndex >= (DIALOGUE_TREE[currentNode].agent ? DIALOGUE_TREE[currentNode].agent.length - 1 : 0) && (
                                            <div className="w-full flex flex-col gap-2 mt-4 animate-slide-up mb-2 pointer-events-auto max-h-[180px] overflow-y-auto overflow-x-hidden p-1 custom-scrollbar">
                                                {DIALOGUE_TREE[currentNode].choices.map((choice, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={(e) => { e.stopPropagation(); handleChoiceSelect(choice.next); }}
                                                        className="bg-slate-900 border border-slate-650 hover:border-cyan-500 hover:bg-slate-800 text-left px-4 py-2.5 rounded-xl text-slate-200 text-xs font-semibold transition-all w-full shadow-sm"
                                                    >
                                                        <span className="text-cyan-400 font-bold mr-1.5">{String.fromCharCode(65 + i)}.</span>
                                                        {choice.text}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {/* Hang Up button (visual only) */}
                                        <div className="mt-auto mb-2 flex justify-center w-full pointer-events-none">
                                            <button className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center opacity-90 shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                                                <svg className="w-6 h-6 text-white transform rotate-[135deg]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ) : phase === 'whatsapp_noti' ? (
                                    <div className="w-full h-full flex flex-col p-4 pt-12">
                                        {/* Time and Date Widget */}
                                        <div className="mt-8 text-center text-white select-none z-10">
                                            <div className="text-4xl font-extralight tracking-tight">09:28</div>
                                            <div className="text-[10px] font-light tracking-wider text-slate-400 mt-1 uppercase">Tuesday, June 16</div>
                                        </div>

                                        {/* App Grid */}
                                        <div className="grid grid-cols-4 gap-y-5 gap-x-3 w-full px-3 mt-6 z-10">
                                            {/* Phone App */}
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-10 h-10 bg-green-500 rounded-[11px] flex items-center justify-center shadow-md">
                                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                                                </div>
                                                <span className="text-[9px] text-slate-400 font-medium truncate w-full text-center">Phone</span>
                                            </div>

                                            {/* WhatsApp App */}
                                            <div
                                                className="flex flex-col items-center gap-1 cursor-pointer group"
                                                onClick={() => setPhase('whatsapp_ui')}
                                            >
                                                <div className="w-10 h-10 bg-emerald-500 rounded-[11px] flex items-center justify-center shadow-md relative group-hover:scale-105 transition-transform">
                                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold border border-slate-950">1</div>
                                                </div>
                                                <span className="text-[9px] text-slate-300 font-bold truncate w-full text-center">WhatsApp</span>
                                            </div>

                                            {/* Chrome App */}
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-10 h-10 bg-white rounded-[11px] flex items-center justify-center shadow-md">
                                                    <div className="w-8 h-8 rounded-full border-[2px] border-red-500 flex items-center justify-center relative overflow-hidden bg-yellow-400">
                                                        <div className="absolute top-0 right-0 w-1/2 h-full bg-green-500"></div>
                                                        <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500 rounded-b-full"></div>
                                                        <div className="w-3 h-3 bg-blue-500 rounded-full border border-white z-10"></div>
                                                    </div>
                                                </div>
                                                <span className="text-[9px] text-slate-400 font-medium truncate w-full text-center">Chrome</span>
                                            </div>

                                            {/* Settings App */}
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-10 h-10 bg-slate-600 rounded-[11px] flex items-center justify-center shadow-md">
                                                    <svg className="w-5 h-5 text-slate-200" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                </div>
                                                <span className="text-[9px] text-slate-400 font-medium truncate w-full text-center">Settings</span>
                                            </div>

                                            {/* Photos App */}
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-10 h-10 bg-white rounded-[11px] flex items-center justify-center shadow-md relative overflow-hidden">
                                                    <div className="grid grid-cols-2 gap-[1px] w-6 h-6">
                                                        <div className="bg-red-400 rounded-full opacity-80"></div>
                                                        <div className="bg-yellow-400 rounded-full opacity-80"></div>
                                                        <div className="bg-green-400 rounded-full opacity-80"></div>
                                                        <div className="bg-blue-400 rounded-full opacity-80"></div>
                                                    </div>
                                                </div>
                                                <span className="text-[9px] text-slate-400 font-medium truncate w-full text-center">Photos</span>
                                            </div>

                                            {/* SecureBank App */}
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-10 h-10 bg-blue-600 rounded-[11px] flex items-center justify-center shadow-md">
                                                    <span className="text-white font-black text-base">$</span>
                                                </div>
                                                <span className="text-[9px] text-slate-400 font-medium truncate w-full text-center">SecureBank</span>
                                            </div>

                                            {/* App Store App */}
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-10 h-10 bg-blue-500 rounded-[11px] flex items-center justify-center shadow-md">
                                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                                </div>
                                                <span className="text-[9px] text-slate-400 font-medium truncate w-full text-center">App Store</span>
                                            </div>

                                            {/* Notes App */}
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-10 h-10 bg-amber-50 rounded-[11px] flex flex-col justify-between p-2.5 shadow-md border-t-4 border-amber-400">
                                                    <div className="w-full h-[1.5px] bg-slate-400 rounded-full"></div>
                                                    <div className="w-4/5 h-[1.5px] bg-slate-400 rounded-full"></div>
                                                    <div className="w-full h-[1.5px] bg-slate-400 rounded-full"></div>
                                                </div>
                                                <span className="text-[9px] text-slate-400 font-medium truncate w-full text-center">Notes</span>
                                            </div>
                                        </div>

                                        {/* Bottom Dock */}
                                        <div className="mt-auto w-[92%] bg-white/10 backdrop-blur-md rounded-[22px] p-2 flex justify-around items-center border border-white/10 shadow-lg z-10 mb-4 select-none pointer-events-auto">
                                            <div className="w-10 h-10 bg-green-500 rounded-[11px] flex items-center justify-center cursor-pointer shadow-md hover:scale-105 transition-transform">
                                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                                            </div>
                                            <div
                                                className="w-10 h-10 bg-emerald-500 rounded-[11px] flex items-center justify-center cursor-pointer shadow-md hover:scale-105 transition-transform relative"
                                                onClick={() => setPhase('whatsapp_ui')}
                                            >
                                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                                                <div className="absolute -top-0.5 -right-0.5 bg-red-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[7.5px] font-bold border border-emerald-500">1</div>
                                            </div>
                                            <div className="w-10 h-10 bg-white rounded-[11px] flex items-center justify-center cursor-pointer shadow-md hover:scale-105 transition-transform">
                                                <div className="w-8 h-8 rounded-full border-[2px] border-red-500 flex items-center justify-center relative overflow-hidden bg-yellow-400">
                                                    <div className="absolute top-0 right-0 w-1/2 h-full bg-green-500"></div>
                                                    <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500 rounded-b-full"></div>
                                                    <div className="w-3 h-3 bg-blue-500 rounded-full border border-white z-10"></div>
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 bg-blue-600 rounded-[11px] flex items-center justify-center cursor-pointer shadow-md hover:scale-105 transition-transform">
                                                <span className="text-white font-black text-base">$</span>
                                            </div>
                                        </div>

                                        {/* WhatsApp Banner Notification */}
                                        <div
                                            className="absolute top-10 left-2 right-2 bg-slate-900/85 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-2xl flex gap-3 cursor-pointer hover:bg-slate-800/85 transition-all duration-300 animate-slide-up z-50 pointer-events-auto"
                                            onClick={() => setPhase('whatsapp_ui')}
                                        >
                                            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0 shadow-md">
                                                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" /></svg>
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="flex justify-between items-center mb-0.5">
                                                    <span className="text-white font-bold text-xs">+91 98452 71092</span>
                                                    <span className="text-slate-400 text-[10px]">now</span>
                                                </div>
                                                <p className="text-slate-300 text-[11px] leading-snug line-clamp-2">Official Summons: Cyber Crime Division. Join the secure video link below...</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (phase === 'whatsapp_ui' || phase === 'whatsapp_file_delivery') ? (
                                    <div className="w-full h-full relative z-10">
                                        {/* WA Header */}
                                        <div className="absolute top-0 left-0 right-0 bg-[#008069] h-[96px] flex flex-col z-20 pt-9 px-3.5 pb-1 shadow-md select-none">
                                            <div className="flex items-center gap-1.5 flex-1 justify-between">
                                                {/* Left Profile Group */}
                                                <div className="flex items-center gap-1.5">
                                                    <svg 
                                                        className="w-5 h-5 text-white cursor-pointer hover:bg-black/10 rounded-full p-0.5 transition-colors" 
                                                        fill="none" 
                                                        viewBox="0 0 24 24" 
                                                        stroke="currentColor"
                                                        onClick={() => {
                                                            if (phase === 'whatsapp_file_delivery') {
                                                                if (viewedDocuments.length >= 3) {
                                                                    setPhase('zoom_dialogue');
                                                                    setCurrentNode('final_arrest');
                                                                    setLineIndex(0);
                                                                    setIsTyping(true);
                                                                    setDisplayedText('');
                                                                } else {
                                                                    setPhase('whatsapp_noti_received');
                                                                }
                                                            } else if (phase === 'whatsapp_ui') {
                                                                setPhase('whatsapp_noti');
                                                            }
                                                        }}
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                                    </svg>
                                                    
                                                    {/* Avatar with Status Indicator */}
                                                    <div className="relative cursor-pointer shrink-0">
                                                        <div className="w-9 h-9 rounded-full bg-white/20 border border-white/10 flex items-center justify-center overflow-hidden">
                                                            {phase === 'whatsapp_file_delivery' ? (
                                                                <span className="text-white font-bold text-xs uppercase">RS</span>
                                                            ) : (
                                                                <span className="text-white font-bold text-xs uppercase">FX</span>
                                                            )}
                                                        </div>
                                                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#25d366] border-2 border-[#008069] rounded-full"></div>
                                                    </div>

                                                    <div className="flex flex-col truncate pl-1 text-left w-36">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-white font-semibold text-[13px] truncate">
                                                                {phase === 'whatsapp_file_delivery' ? 'Rajesh Sharma' : '+91 98452 71092'}
                                                            </span>
                                                            {/* Custom Verified Green Badge */}
                                                            <div className="shrink-0 bg-[#25d366] rounded-full flex items-center justify-center w-3.5 h-3.5 shadow-sm">
                                                                <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <span className="text-white/80 text-[10px] text-left">online</span>
                                                    </div>
                                                </div>

                                                {/* Right Action Icons */}
                                                <div className="flex items-center gap-3.5 text-white pr-1">
                                                    {/* Video Icon */}
                                                    <svg className="w-4.5 h-4.5 cursor-pointer hover:opacity-80 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                    {/* Phone Call Icon */}
                                                    <svg className="w-4.5 h-4.5 cursor-pointer hover:opacity-80 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                    </svg>
                                                    {/* Options dots */}
                                                    <svg className="w-4 h-4 cursor-pointer hover:opacity-80 transition-opacity" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* WA Chat Body */}
                                        <div className="absolute inset-x-0 top-[96px] bottom-[76px] z-10 flex flex-col p-3 overflow-y-auto custom-scrollbar">
                                            {/* Date Header */}
                                            <div className="flex justify-center mb-3 mt-1">
                                                <div className="bg-[#e1f3fb] text-[#54656f] text-[10px] px-2.5 py-0.5 rounded-lg shadow-sm font-medium tracking-wide">
                                                    TODAY
                                                </div>
                                            </div>
                                            
                                            {/* Security Message */}
                                            <div className="flex justify-center mb-4">
                                                <div className="bg-[#feeecc] text-[#54656f] text-[10.5px] px-3.5 py-2 rounded-xl text-center leading-tight shadow-[0_1px_0.5px_rgba(0,0,0,0.08)] max-w-[90%] border border-[#fceecc]">
                                                    <span className="font-bold text-slate-700">Cyber Crime Division</span>
                                                    <br/><span className="text-[10px] opacity-90">This is an official communication channel.</span>
                                                </div>
                                            </div>

                                            {phase === 'whatsapp_ui' ? (
                                                <div className="flex flex-col gap-1.5 animate-slide-up w-full">
                                                    <div className="bg-white p-3 rounded-2xl rounded-tl-none self-start w-[85%] max-w-[260px] relative shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] pb-6 mt-1 text-left">
                                                        {/* Left Bubble Tail */}
                                                        <div className="absolute top-0 -left-[7px] w-2.5 h-3.5 select-none pointer-events-none">
                                                            <svg viewBox="0 0 8 13" className="w-full h-full text-white fill-current">
                                                                <path d="M 0,0 C 3,0 7,3 8,8 L 8,0 Z" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-[#111b21] text-[12.5px] leading-snug font-bold">Official Summons: Cyber Crime Division.</p>
                                                        <p className="text-[#111b21] text-[12px] leading-snug mt-2 text-slate-750">Join the secure video link below to record your statement with Senior Officer Rajesh Sharma.</p>
                                                        
                                                        {/* Zoom Link Bubble */}
                                                        <div 
                                                            className="bg-[#f0f2f5] rounded-xl p-2.5 mt-3 mb-1 cursor-pointer hover:bg-[#e9edef] transition-all border-l-4 border-[#0b5cff] group flex flex-col gap-1.5 text-left shadow-inner"
                                                            onClick={startZoomCall}
                                                        >
                                                            <div className="text-[#8696a0] text-[9px] font-semibold tracking-wider uppercase">zoom.us</div>
                                                            <div className="text-[#0b5cff] text-[11.5px] font-bold group-hover:underline leading-snug">
                                                                Join our Cloud Video Meeting
                                                            </div>
                                                            <p className="text-[#54656f] text-[10px] line-clamp-2 leading-tight">
                                                                Zoom is the leader in modern enterprise video communications, with an easy, reliable cloud platform...
                                                            </p>
                                                            <div className="text-[#0b5cff] text-[10px] font-semibold flex items-center gap-1 mt-1 break-all bg-[#0b5cff]/5 p-1 rounded-lg">
                                                                <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                                                <span className="truncate">https://zoom.us/j/9128394812</span>
                                                            </div>
                                                            <div className="text-[#54656f] text-[9.5px] font-bold mt-0.5">Meeting ID: 912 839 4812</div>
                                                        </div>
                                                        <span className="text-[#8696a0] text-[9px] absolute bottom-1.5 right-3 font-medium">09:19 AM</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-2.5 animate-slide-up w-full text-left">
                                                    <div className="bg-white p-3 rounded-2xl rounded-tl-none self-start w-[85%] max-w-[260px] relative shadow-[0_1px_0.5px_rgba(0,0,0,0.13)]">
                                                        {/* Left Bubble Tail */}
                                                        <div className="absolute top-0 -left-[7px] w-2.5 h-3.5 select-none pointer-events-none">
                                                            <svg viewBox="0 0 8 13" className="w-full h-full text-white fill-current">
                                                                <path d="M 0,0 C 3,0 7,3 8,8 L 8,0 Z" />
                                                            </svg>
                                                        </div>
                                                        <p className="text-[#111b21] text-[12.5px] leading-snug">Mr. Mehta, I am sending the official documents now. Review them carefully.</p>
                                                        <span className="text-[#8696a0] text-[9px] float-right mt-1 ml-2 font-medium">09:35 AM</span>
                                                    </div>
                                                    
                                                    {/* FIR Document */}
                                                    <div 
                                                        onClick={() => handleViewDocument('FIR')} 
                                                        className="bg-white p-1.5 rounded-2xl self-start w-[85%] max-w-[260px] relative shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] cursor-pointer hover:bg-slate-50 transition-all mt-1"
                                                    >
                                                        
                                                        <div className="flex items-center gap-2.5 bg-[#f7f8fa] p-2 rounded-xl border border-slate-200/60">
                                                            <div className="w-9 h-11 bg-red-500 rounded flex flex-col items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
                                                                <span className="text-[7px] text-white font-extrabold uppercase tracking-wide leading-none mt-1">PDF</span>
                                                                <div className="absolute bottom-0 inset-x-0 h-3 bg-red-700/80 flex items-center justify-center">
                                                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v12m0 0l-4-4m4 4l4-4" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col flex-1 min-w-0">
                                                                <span className="text-[#111b21] text-[11.5px] font-bold truncate">FIR_Mumbai_Police.pdf</span>
                                                                <span className="text-[#8696a0] text-[9.5px] font-medium mt-0.5">2.4 MB • {viewedDocuments.includes('FIR') ? 'Opened' : 'Tap to View'}</span>
                                                            </div>
                                                            <div className="shrink-0 ml-1">
                                                                {viewedDocuments.includes('FIR') ? (
                                                                    <div className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600">
                                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-5 h-5 bg-slate-200/50 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200">
                                                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path d="M10 12a1 1 0 01-.707-.293l-3-3a1 1 0 111.414-1.414L9 8.586V3a1 1 0 112 0v5.586l1.293-1.293a1 1 0 111.414 1.414l-3 3A1 1 0 0110 12z" />
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center px-1 mt-1 text-[8.5px] text-[#8696a0] font-medium">
                                                            <span>1 page</span>
                                                            <span>09:35 AM</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Court Notice Document */}
                                                    <div 
                                                        onClick={() => handleViewDocument('CourtNotice')} 
                                                        className="bg-white p-1.5 rounded-2xl self-start w-[85%] max-w-[260px] relative shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] cursor-pointer hover:bg-slate-50 transition-all mt-1"
                                                    >
                                                        
                                                        <div className="flex items-center gap-2.5 bg-[#f7f8fa] p-2 rounded-xl border border-slate-200/60">
                                                            <div className="w-9 h-11 bg-red-500 rounded flex flex-col items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
                                                                <span className="text-[7px] text-white font-extrabold uppercase tracking-wide leading-none mt-1">PDF</span>
                                                                <div className="absolute bottom-0 inset-x-0 h-3 bg-red-700/80 flex items-center justify-center">
                                                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v12m0 0l-4-4m4 4l4-4" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col flex-1 min-w-0">
                                                                <span className="text-[#111b21] text-[11.5px] font-bold truncate">Supreme_Court_Notice.pdf</span>
                                                                <span className="text-[#8696a0] text-[9.5px] font-medium mt-0.5">1.8 MB • {viewedDocuments.includes('CourtNotice') ? 'Opened' : 'Tap to View'}</span>
                                                            </div>
                                                            <div className="shrink-0 ml-1">
                                                                {viewedDocuments.includes('CourtNotice') ? (
                                                                    <div className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600">
                                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </div>
                                                                ) : (
                                                                    <div className="w-5 h-5 bg-slate-200/50 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200">
                                                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path d="M10 12a1 1 0 01-.707-.293l-3-3a1 1 0 111.414-1.414L9 8.586V3a1 1 0 112 0v5.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0z" />
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center px-1 mt-1 text-[8.5px] text-[#8696a0] font-medium">
                                                            <span>1 page</span>
                                                            <span>09:35 AM</span>
                                                        </div>
                                                    </div>

                                                    {/* Photos Document */}
                                                    <div 
                                                        onClick={() => handleViewDocument('Photos')} 
                                                        className="bg-white p-1.5 rounded-2xl self-start w-[85%] max-w-[260px] relative shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] cursor-pointer hover:bg-slate-50 transition-all mt-1"
                                                    >
                                                        
                                                        <div className="flex items-center gap-2.5 bg-[#f7f8fa] p-2 rounded-xl border border-slate-200/60">
                                                            <div className="w-9 h-11 bg-blue-500 rounded flex flex-col items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
                                                                <span className="text-[7px] text-white font-extrabold uppercase tracking-wide leading-none mt-1">IMG</span>
                                                                <div className="absolute bottom-0 inset-x-0 h-3 bg-blue-700/80 flex items-center justify-center">
                                                                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <div className="flex flex-col flex-1 min-w-0">
                                                                <span className="text-[#111b21] text-[11.5px] font-bold truncate">Parcel_Evidence.jpg</span>
                                                                <span className="text-[#8696a0] text-[9.5px] font-medium mt-0.5">4.1 MB • {viewedDocuments.includes('Photos') ? 'Opened' : 'Tap to View'}</span>
                                                            </div>
                                                            <div className="shrink-0 ml-1">
                                                                {viewedDocuments.includes('Photos') ? (
                                                                    <div className="w-5 h-5 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600">
                                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                        </svg>
                                                                    </div>
                                                                ) : (
                                                                    <svg className="w-4.5 h-4.5 text-[#8696a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center px-1 mt-1 text-[8.5px] text-[#8696a0] font-medium">
                                                            <span>1 file</span>
                                                            <span>09:36 AM</span>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Proceed Button */}
                                                    {viewedDocuments.length >= 3 && (
                                                        <div className="mt-4 flex justify-center w-full animate-fade-in mb-4">
                                                            <button 
                                                                className="bg-[#008069] text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-lg hover:bg-[#006653] transition-colors"
                                                                onClick={() => {
                                                                    setPhase('zoom_dialogue');
                                                                    setCurrentNode('final_arrest');
                                                                    setLineIndex(0);
                                                                    setIsTyping(true);
                                                                    setDisplayedText('');
                                                                }}
                                                            >
                                                                RETURN TO ZOOM CALL
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* WA Input Footer */}
                                        <div className="absolute bottom-0 left-0 right-0 p-2 pb-6 flex items-center gap-2 z-20 bg-transparent">
                                            <div className="bg-white rounded-full flex-1 h-9 px-3 flex items-center justify-between text-[#8696a0] text-[13px] border border-slate-200/50 shadow-sm">
                                                <div className="flex items-center flex-1">
                                                    <svg className="w-5 h-5 text-[#8696a0] cursor-pointer hover:text-[#54656f] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="ml-2 text-slate-400 text-[12px] text-left">Message</span>
                                                </div>
                                                <div className="flex items-center gap-2.5 shrink-0">
                                                    <svg className="w-5 h-5 text-[#8696a0] cursor-pointer hover:text-[#54656f] transform rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                    </svg>
                                                    <svg className="w-5 h-5 text-[#8696a0] cursor-pointer hover:text-[#54656f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="w-9 h-9 bg-[#00a884] rounded-full flex items-center justify-center shrink-0 text-white shadow-sm hover:scale-105 active:scale-95 transition-transform cursor-pointer">
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" /></svg>
                                            </div>
                                        </div>
                                    </div>
                                ) : (phase === 'zoom_dialogue' || phase === 'whatsapp_noti_received') ? (
                                    <div className="w-full h-full relative z-10">
                                        {/* Zoom Video Background */}
                                        <div className="absolute inset-0 bg-black z-0 overflow-hidden rounded-[36px]">
                                            <img
                                                src="/assets/indian_police_zoom.png"
                                                alt="Rajesh Sharma Video Feed"
                                                className="w-full h-full object-cover pointer-events-none"
                                            />
                                            {/* Video Overlay Name */}
                                            <div className="absolute bottom-20 left-2 bg-black/70 px-2 py-1 rounded text-white text-[10px] backdrop-blur-sm flex items-center gap-1 shadow-lg pointer-events-none">
                                                <div className="flex items-center gap-0.5">
                                                    <div className="w-0.5 h-1.5 bg-green-500 rounded-full animate-[pulse_1s_infinite]"></div>
                                                    <div className="w-0.5 h-1 bg-green-500 rounded-full animate-[pulse_1.2s_infinite]"></div>
                                                    <div className="w-0.5 h-2 bg-green-500 rounded-full animate-[pulse_0.8s_infinite]"></div>
                                                </div>
                                                <span>Rajesh Sharma</span>
                                            </div>
                                        </div>

                                        {/* Zoom Header */}
                                        <div className="absolute top-8 left-0 right-0 px-4 z-10 flex justify-between items-center pointer-events-none">
                                            <div className="flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded-full backdrop-blur-sm">
                                                <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center">
                                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                </div>
                                                <span className="text-white text-[10px] font-medium">Zoom</span>
                                            </div>
                                            <div className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full text-[8px] font-bold border border-green-500/30 flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                                Encrypted
                                            </div>
                                        </div>

                                        {/* Cinematic Subtitle Dialogue UI */}
                                        {DIALOGUE_TREE[currentNode] && (
                                            <div className="absolute inset-0 z-20 flex flex-col justify-end pb-16 pointer-events-none">
                                                {/* Agent Subtitle Bubble */}
                                                {DIALOGUE_TREE[currentNode].agent && DIALOGUE_TREE[currentNode].agent.length > 0 && (
                                                    <div className="bg-black/80 backdrop-blur-md px-4 py-3 mx-2 rounded-xl mb-3 text-center border border-slate-700 shadow-2xl animate-slide-up">
                                                        <span className="text-slate-100 text-xs md:text-sm font-medium tracking-wide leading-relaxed">
                                                            "{displayedText}"
                                                            {!isTyping && (!DIALOGUE_TREE[currentNode].choices || lineIndex < DIALOGUE_TREE[currentNode].agent.length - 1) && (
                                                                <span className="animate-pulse ml-1 text-slate-400">▼</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Player Choices */}
                                                {!isTyping && DIALOGUE_TREE[currentNode].choices && lineIndex >= (DIALOGUE_TREE[currentNode].agent ? DIALOGUE_TREE[currentNode].agent.length - 1 : 0) && (
                                                    <div className="w-full flex flex-col gap-2 px-2 animate-fade-in pointer-events-auto max-h-[160px] overflow-y-auto custom-scrollbar">
                                                        {DIALOGUE_TREE[currentNode].choices.map((choice, i) => (
                                                            <button
                                                                key={i}
                                                                onClick={(e) => { e.stopPropagation(); handleChoiceSelect(choice.next); }}
                                                                className="bg-slate-900/95 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-400 text-left px-3 py-2.5 rounded-lg text-slate-200 text-[11px] font-medium transition-all shadow-xl flex items-start"
                                                            >
                                                                <span className="text-indigo-400 font-bold mr-2 mt-0.5">{String.fromCharCode(65 + i)}.</span>
                                                                <span>{choice.text}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}


                                        {/* Zoom Toolbar (Phone Version) */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] h-14 flex items-center justify-around border-t border-slate-700/50 shadow-lg z-30 pointer-events-none rounded-b-[36px]">
                                            <div className="flex flex-col items-center gap-1 opacity-50">
                                                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                                                </div>
                                                <span className="text-[8px] text-slate-400">Mute</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1 opacity-50">
                                                <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                </div>
                                                <span className="text-[8px] text-slate-400">Video</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-1 pointer-events-auto">
                                                <div className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold shadow-md cursor-pointer">
                                                    Leave
                                                </div>
                                            </div>
                                        </div>

                                        {/* WhatsApp Push Notification over Zoom */}
                                        {phase === 'whatsapp_noti_received' && (
                                            <div
                                                className="absolute top-12 left-4 right-4 bg-[#202c33] p-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3 cursor-pointer animate-slide-up border border-[#00a884] pointer-events-auto group"
                                                onClick={() => setPhase('whatsapp_file_delivery')}
                                            >
                                                <div className="w-10 h-10 bg-[#00a884] rounded-full flex items-center justify-center shrink-0">
                                                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                                </div>
                                                <div className="flex flex-col flex-1 overflow-hidden">
                                                    <span className="text-white text-sm font-bold truncate">Sr. Officer Rajesh Sharma</span>
                                                    <span className="text-[#8696a0] text-xs truncate">📄 FIR_Copy_Mumbai_Police.pdf...</span>
                                                </div>
                                                <span className="text-[#00a884] text-xs font-bold group-hover:scale-110 transition-transform shrink-0 ml-1">OPEN</span>
                                            </div>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* End of Scene 2 / File Received - REMOVED */}

            {/* Document Viewer Modal */}
            {viewingDocument && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col animate-fade-in">
                    <div className="flex justify-between items-center p-4 border-b border-white/20 text-white bg-black/50">
                        <div className="font-mono text-sm">
                            {viewingDocument === 'FIR' && 'FIR_Copy_Mumbai_Police.pdf'}
                            {viewingDocument === 'CourtNotice' && 'Supreme_Court_Notice.pdf'}
                            {viewingDocument === 'Photos' && 'Parcel_Contents_Evidence.jpg'}
                        </div>
                        <button
                            onClick={() => setViewingDocument(null)}
                            className="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold"
                        >
                            X
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto flex flex-col items-center p-4 sm:p-8 w-full">
                        {viewingDocument === 'FIR' && (
                            <div className="bg-white w-full max-w-2xl my-8 p-8 text-black font-serif shadow-2xl relative shrink-0 overflow-hidden">
                                <div className="absolute top-4 right-4 w-40 h-40 border-[6px] border-red-500 rounded-full flex items-center justify-center opacity-60 rotate-[-15deg] pointer-events-none">
                                    <div className="text-red-500 font-bold text-2xl text-center leading-none tracking-widest border-y-[3px] border-red-500 w-[110%] py-2 bg-white/50">CONFIDENTIAL</div>
                                </div>
                                <div className="text-center mb-8 border-b-2 border-black pb-4 relative z-10">
                                    <h1 className="text-3xl font-bold uppercase tracking-wide">First Information Report</h1>
                                    <h2 className="text-lg font-bold mt-2 text-slate-700">Cyber Crime Cell, Mumbai Police</h2>
                                    <p className="font-mono text-sm mt-1">FIR No: MH/CY/2026/09482</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-6 font-mono text-sm border border-slate-300 p-4">
                                    <div><strong>Date of Registration:</strong> 15/06/2026</div>
                                    <div><strong>Investigating Officer:</strong> Insp. Rajesh Sharma</div>
                                    <div><strong>Suspect Name:</strong> Arjun Mehta</div>
                                    <div><strong>Status:</strong> NON-BAILABLE WARRANT PENDING</div>
                                </div>
                                <div className="mb-6 space-y-4">
                                    <p className="font-bold underline">Details of Offence:</p>
                                    <p className="text-justify leading-relaxed">
                                        An international parcel bearing tracking ID FedEx-883921 intercepted at Customs Checkpoint Alpha.
                                        The sender's address was marked as Taiwan, Republic of China. The receiver's AADHAAR card
                                        details match the suspect ARJUN MEHTA.
                                    </p>
                                    <p className="text-justify leading-relaxed">
                                        Contents discovered during X-Ray scanning: 5 Passports (Illegal Forgeries), 4 Credit Cards (Cloned),
                                        and 150 grams of MDMA (Narcotics).
                                    </p>
                                    <p className="text-justify leading-relaxed bg-red-50 p-2 font-bold text-red-800 border-l-4 border-red-500">
                                        ACTION REQUIRED: Under Section 66C of IT Act and Section 22 of NDPS Act, the suspect is to be placed under DIGITAL ARREST pending immediate statement recording.
                                    </p>
                                </div>
                                <div className="mt-16 flex justify-between px-8">
                                    <div className="text-center border-t border-black pt-2 w-48">
                                        <p className="font-bold">Signature of Complainant</p>
                                    </div>
                                    <div className="text-center border-t border-black pt-2 w-48">
                                        <p className="font-bold">Seal of Cyber Cell</p>
                                        <div className="mt-2 text-blue-800 italic font-serif">Signed digitally via Govt Portal</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {viewingDocument === 'CourtNotice' && (
                            <div className="flex flex-col items-center w-full max-w-2xl my-8 shrink-0 relative">
                                {/* Audit Header */}
                                <div className="w-full bg-slate-900 border border-slate-700/60 p-4 rounded-t-2xl text-white font-sans text-xs flex justify-between items-center shadow-lg relative z-20">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">🕵️</span>
                                        <div>
                                            <h4 className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">Warrant Audit Mode</h4>
                                            <p className="text-slate-400 text-[10px]">Click on 3 suspicious anomalies that prove this notice is fake.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <span className="font-mono text-xs font-bold text-slate-350">{foundWarrantAnomalies.length} / 3 Found</span>
                                        </div>
                                        <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-705">
                                            <div 
                                                className="bg-amber-450 h-full transition-all duration-300" 
                                                style={{ width: `${(foundWarrantAnomalies.length / 3) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#fcfaf5] w-full p-8 sm:p-12 text-black font-serif shadow-2xl relative border-x-[8px] border-b-[8px] border-double border-slate-800 rounded-b-2xl overflow-hidden text-left">
                                    {/* Big watermark stamp on success */}
                                    {foundWarrantAnomalies.length === 3 && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none overflow-hidden bg-red-650/5">
                                            <div className="border-[8px] border-red-600 text-red-600 font-black text-6xl md:text-7xl tracking-widest uppercase px-8 py-4 rounded-2xl opacity-75 shadow-lg bg-white/95 backdrop-blur-3xs animate-stamp-bounce">
                                                FORGED / FAKE
                                            </div>
                                        </div>
                                    )}

                                    <div className="text-center mb-6">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Emblem_of_India.svg/150px-Emblem_of_India.svg.png" className="w-16 h-24 mx-auto mb-4 opacity-80" alt="Emblem" />
                                        <h1 className="text-2xl font-bold uppercase tracking-wider">IN THE SUPREME COURT OF INDIA</h1>
                                        <h2 className="text-md font-bold mt-1 uppercase text-slate-700">Criminal Appellate Jurisdiction</h2>
                                    </div>
                                    <div className="text-center mb-8 font-bold text-lg underline">
                                        NOTICE FOR PREVENTIVE DETENTION (DIGITAL ARREST)
                                    </div>
                                    <div className="text-justify leading-relaxed space-y-5">
                                        <p>
                                            <strong>TO:</strong> Mr. Arjun Mehta
                                        </p>
                                        <p>
                                            <strong>WHEREAS</strong> an FIR No. MH/CY/2026/09482 has been registered against your Aadhar ID regarding money laundering and narcotics smuggling.
                                        </p>
                                        <p>
                                            <strong>IT IS HEREBY ORDERED</strong> that the suspect is placed under strict{' '}
                                            <span 
                                                onClick={() => handleAnomalyClick('digital_arrest')}
                                                className={`font-bold px-1.5 py-0.5 rounded cursor-help transition-all inline-block select-none ${
                                                    foundWarrantAnomalies.includes('digital_arrest') 
                                                        ? 'bg-rose-100 border border-rose-400 text-rose-700 shadow-sm' 
                                                        : 'bg-yellow-100 hover:bg-yellow-250 border border-dashed border-amber-500 hover-underline-pulse'
                                                }`}
                                            >
                                                DIGITAL ARREST {foundWarrantAnomalies.includes('digital_arrest') && '🔍'}
                                            </span>. The suspect must not terminate the video link with the investigating officer.
                                        </p>
                                        <p>
                                            Any attempt to contact third parties, use a secondary device, or leave the premises will be considered a direct violation of this court order, resulting in immediate physical apprehension by local law enforcement.
                                        </p>
                                    </div>

                                    <div className="mt-16 flex justify-between items-end relative pb-12">
                                        <div className="text-left text-xs text-slate-400 font-sans max-w-xs leading-normal select-none">
                                            This electronic warrant is generated automatically by Supreme Cyber Portal. Security verification hash: SCI-998274-CYB.
                                        </div>

                                        <div 
                                            onClick={() => handleAnomalyClick('tribunal_sig')}
                                            className={`text-center p-2 rounded cursor-help border transition-all select-none ${
                                                foundWarrantAnomalies.includes('tribunal_sig') 
                                                    ? 'bg-rose-100/80 border-rose-450 text-rose-800' 
                                                    : 'border-transparent hover:bg-slate-100 hover:border-slate-300 hover-underline-pulse'
                                            }`}
                                        >
                                            <div className="font-cursive text-3xl text-blue-900 mb-2 rotate-[-5deg]">S. N. Reddy</div>
                                            <div className="border-t-2 border-black pt-1 w-48">
                                                <p className="font-bold text-[13px]">Hon'ble Magistrate</p>
                                                <p className="text-[10px]">Special Cyber Tribunal {foundWarrantAnomalies.includes('tribunal_sig') && '🔍'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Gmail Domain Footer (Trigger 3) */}
                                    <div className="mt-6 border-t border-slate-300 pt-4 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-550 font-sans gap-2 w-full select-none">
                                        <span>Official Website: www.sci.gov.in</span>
                                        <span 
                                            onClick={() => handleAnomalyClick('gmail_footer')}
                                            className={`px-2 py-1 rounded cursor-help border transition-all ${
                                                foundWarrantAnomalies.includes('gmail_footer') 
                                                    ? 'bg-rose-100 border-rose-400 text-rose-700 font-bold' 
                                                    : 'bg-slate-100 hover:bg-yellow-50 border-slate-300 text-slate-650 hover:text-slate-800 border-dashed border hover-underline-pulse'
                                            }`}
                                        >
                                            Contact support: sci.special.tribunal@gmail.com {foundWarrantAnomalies.includes('gmail_footer') && '🔍'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {viewingDocument === 'Photos' && (
                            <div className="bg-slate-900 p-4 shadow-2xl border border-slate-700 rounded-lg max-w-3xl my-8 shrink-0">
                                <div className="relative">
                                    <img src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=1000&auto=format&fit=crop" alt="Parcel Box" className="w-full rounded" />
                                    <div className="absolute inset-0 border-4 border-red-500/50 rounded pointer-events-none"></div>
                                    <div className="absolute bottom-4 left-4 bg-black/80 px-3 py-1 rounded text-white font-mono text-sm border border-red-500">
                                        EVIDENCE TAG: #883921
                                    </div>
                                    <div className="absolute top-4 right-4 bg-yellow-400 text-black px-4 py-2 font-bold transform rotate-[15deg] shadow-lg">
                                        CUSTOMS SEIZED
                                    </div>
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <div className="flex-1 bg-slate-800 p-2 rounded border border-slate-700"><img src="https://images.unsplash.com/photo-1621252179027-94459d278660?q=80&w=300&auto=format&fit=crop" alt="MDMA" className="w-full h-24 object-cover rounded opacity-80" /></div>
                                    <div className="flex-1 bg-slate-800 p-2 rounded border border-slate-700"><img src="https://images.unsplash.com/photo-1610444391696-6b2c4588e404?q=80&w=300&auto=format&fit=crop" alt="Passports" className="w-full h-24 object-cover rounded opacity-80 filter sepia" /></div>
                                    <div className="flex-1 bg-slate-800 p-2 rounded border border-slate-700"><img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=300&auto=format&fit=crop" alt="Credit Cards" className="w-full h-24 object-cover rounded opacity-80" /></div>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {activeAnomalyExplanation && (
                        <div className="fixed inset-0 z-[210] bg-black/70 flex items-center justify-center p-4">
                            <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl text-left text-white animate-in zoom-in duration-200">
                                <h3 className="text-sm font-black text-amber-450 mb-2">{activeAnomalyExplanation.title}</h3>
                                <p className="text-slate-300 text-xs leading-relaxed mb-6 font-sans">
                                    {activeAnomalyExplanation.body}
                                </p>
                                <button
                                    onClick={() => setActiveAnomalyExplanation(null)}
                                    className="w-full bg-amber-500 hover:bg-amber-450 text-slate-950 font-bold py-2.5 rounded-xl text-center text-[10px] tracking-wider uppercase transition-colors"
                                >
                                    Close Audit Info
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Audio Elements */}
            <audio ref={footAudioRef} src="/audio/foot.m4a" loop preload="auto" />

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes zoom-in {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                @keyframes fade-in-out { 0% { opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    15%, 45%, 75% { transform: translateX(-4px); }
                    30%, 60%, 90% { transform: translateX(4px); }
                }
                @keyframes underline-pulse {
                    0%, 100% { border-bottom-color: rgba(245, 158, 11, 0.4); }
                    50% { border-bottom-color: rgba(245, 158, 11, 1); }
                }
                @keyframes stamp-bounce {
                    0% { transform: scale(3.5) rotate(-25deg); opacity: 0; }
                    75% { transform: scale(0.9) rotate(-25deg); opacity: 0.95; }
                    100% { transform: scale(1) rotate(-25deg); opacity: 0.75; }
                }
                @keyframes torch-flicker {
                    0%, 100% { opacity: 1; }
                    15%, 55% { opacity: 0; }
                    20%, 65% { opacity: 1; }
                    35% { opacity: 0.15; }
                    45% { opacity: 0.85; }
                    75% { opacity: 0.2; }
                    85% { opacity: 0.9; }
                }
                .animate-zoom-in { animation: zoom-in 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-shake { animation: shake 0.4s ease-in-out infinite; }
                .hover-underline-pulse:hover {
                    animation: underline-pulse 1.2s infinite;
                    border-bottom-width: 2px;
                    border-bottom-style: dashed;
                }
                .animate-stamp-bounce {
                    animation: stamp-bounce 0.38s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                    transform-origin: center;
                }
                .animate-torch-flicker {
                    animation: torch-flicker 0.8s ease-in-out forwards;
                }
                
                /* Custom Scrollbar for phone choices */
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
                `
            }} />
        </div>
    );
};

export default Level12;
