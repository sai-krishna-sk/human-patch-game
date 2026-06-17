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
            "Thank you, Mr. Mehta.",
            "My name is Vikram Sharma from FedEx International Compliance.",
            "I'm calling regarding an international shipment linked to your Aadhaar number."
        ],
        next: 'the_parcel'
    },
    opening_b: {
        agent: [
            "This is Vikram Sharma from FedEx International Compliance.",
            "I'm contacting you regarding a parcel that has been detained by Customs."
        ],
        next: 'the_parcel'
    },
    opening_c: {
        agent: [
            "It concerns an international parcel that is currently under investigation.",
            "Your identity documents appear to be connected to the shipment."
        ],
        next: 'the_parcel'
    },
    opening_d: {
        agent: [
            "Your number is listed as the contact number associated with the shipment documents."
        ],
        next: 'the_parcel'
    },
    the_parcel: {
        agent: [
            "Mr. Mehta, a parcel originating from Dubai was intercepted this morning at Mumbai Airport.",
            "The parcel was booked using your Aadhaar credentials.",
            "There are several serious irregularities."
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
            "That may be true, sir.",
            "Which is exactly why we are contacting you."
        ],
        next: 'personal_questions'
    },
    parcel_c: {
        agent: [
            "The package reportedly contained narcotics, forged passports, and multiple international banking cards."
        ],
        next: 'personal_questions'
    },
    parcel_d: {
        agent: [
            "I understand your concern.",
            "Unfortunately, this matter is already under official review."
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
            "Then it is possible your identity has been misused."
        ],
        next: 'tracking_info'
    },
    personal_b: {
        agent: [
            "That may explain how your details were obtained."
        ],
        next: 'tracking_info'
    },
    personal_c: {
        agent: [
            "Because we are trying to determine whether you are involved or whether your identity was stolen."
        ],
        next: 'tracking_info'
    },
    personal_d: {
        agent: [
            "I completely understand.",
            "You are free to verify the information.",
            "However, because the matter has already been escalated, delays may complicate the investigation."
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
            "Certainly.",
            "Tracking Number: FDX-INT-MUM-9921-CR."
        ],
        next: 'escalation'
    },
    tracking_b: {
        agent: [
            "I can send supporting documents to your phone."
        ],
        next: 'escalation'
    },
    tracking_c: {
        agent: [
            "Yes, I will arrange that."
        ],
        next: 'escalation'
    },
    tracking_d: {
        agent: [
            "Very well."
        ],
        next: 'escalation'
    },
    escalation: {
        agent: [
            "Mr. Mehta.",
            "Because narcotics and identity fraud are involved, FedEx can no longer handle this matter internally.",
            "The case has been referred to the Cyber Crime Division.",
            "...",
            "I am required to transfer you to the investigating officer."
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
            "I understand this is overwhelming.",
            "The investigating officer will explain everything."
        ],
        next: 'transfer_scene'
    },
    escalation_c: {
        agent: [
            "You are free to do so.",
            "However, the investigation process will continue regardless."
        ],
        next: 'transfer_scene'
    },
    escalation_d: {
        agent: [
            "If this were a scam, sir, we would not have your Aadhaar information.",
            "We are trying to help you resolve a serious legal matter."
        ],
        next: 'transfer_scene'
    },
    transfer_scene: {
        agent: [
            "Please remain connected.",
            "I am now transferring your case to Senior Officer Rajesh Sharma."
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
            "Good.",
            "I am Senior Officer Rajesh Sharma.",
            "I have been assigned to your case."
        ],
        next: 'interrogation_main'
    },
    zoom_intro_b: {
        agent: [
            "Cyber Crime Division.",
            "Mumbai Branch.",
            "You were informed by FedEx."
        ],
        next: 'interrogation_main'
    },
    zoom_intro_c: {
        agent: [
            "You may verify my credentials later.",
            "Right now we are dealing with a criminal investigation."
        ],
        clue: "Avoids providing proof.",
        next: 'interrogation_main'
    },
    zoom_intro_d: {
        agent: [
            "Silence will not help you.",
            "I am Senior Officer Rajesh Sharma.",
            "I have been assigned to your case."
        ],
        next: 'interrogation_main'
    },
    interrogation_main: {
        agent: [
            "Mr. Mehta.",
            "I need your full attention.",
            "The parcel linked to your Aadhaar has been connected to an international trafficking network.",
            "We have reasons to believe your identity has been used in multiple financial crimes."
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
            "I understand this is difficult.",
            "But you must cooperate."
        ],
        next: 'digital_arrest'
    },
    interrogation_b: {
        agent: [
            "We are trying to determine whether you are a victim or a participant."
        ],
        next: 'digital_arrest'
    },
    interrogation_c: {
        agent: [
            "The evidence will be shared shortly."
        ],
        clue: "No evidence yet.",
        next: 'digital_arrest'
    },
    interrogation_d: {
        agent: [
            "Mr. Mehta.",
            "This is not a joking matter."
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
            "It is a temporary legal restriction."
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
            "...",
            "The legal details are confidential."
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
            "From this moment.",
            "You may not leave your residence.",
            "You may not contact friends.",
            "You may not contact family.",
            "You may not discuss this investigation.",
            "You must remain visible on camera."
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
        agent: ["This prevents evidence tampering."],
        next: 'background_check'
    },
    restrict_c: {
        agent: ["This is standard procedure."],
        clue: "Avoids legal explanation.",
        next: 'background_check'
    },
    restrict_d: {
        agent: ["Refusal may result in immediate arrest."],
        next: 'background_check'
    },
    background_check: {
        agent: [
            "I need to verify some details.",
            "Confirm your date of birth."
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
            "Mr. Mehta.",
            "You are not in a position to question the investigation."
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
            "Mr. Mehta?",
            "You seem to be looking somewhere else.",
            "Where are you looking like that?",
            "Do not try to open anything."
        ]
    },
    search_caught: {
        agent: [
            "Where are you going?",
            "What are you searching?"
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
            "Mr. Mehta.",
            "I instructed you not to use other devices.",
            "You are obstructing an active investigation."
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
            "Mr. Mehta. I am sending the official documents to your WhatsApp.",
            "Check your WhatsApp immediately."
        ],
        isFileDelivery: true
    },
    final_arrest: {
        agent: [
            "You have reviewed the documents.",
            "You are now under strict Digital Arrest.",
            "Do not disconnect this call until the police arrive at your location."
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
            "The police are on their way to your location to arrest you.",
            "Do not move. Stay online."
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
            "Negative.",
            "You are under strict Digital Arrest.",
            "You cannot leave the camera's view."
        ],
        choices: [
            { text: "It's been three hours! I really need to go.", next: 'washroom_pushback_1' },
            { text: "Please, just for two minutes.", next: 'washroom_pushback_1' }
        ]
    },
    washroom_pushback_1: {
        agent: [
            "We cannot risk you tampering with evidence or contacting accomplices.",
            "If you must use the washroom, there is only one condition.",
            "You will take your mobile phone inside with you.",
            "And you will keep the video camera ON."
        ],
        choices: [
            { text: "What?! Are you serious?", next: 'camera_demand' },
            { text: "That's a violation of my privacy!", next: 'camera_demand' }
        ]
    },
    camera_demand: {
        agent: [
            "Privacy? You are a suspect in a narcotics and money laundering case.",
            "You have no right to privacy right now.",
            "Take the phone into the washroom, or face immediate physical arrest.",
            "Do you understand?"
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
    const { enterLevel } = useGameState();
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

    useEffect(() => {
        handleDialogueInteractionRef.current = handleDialogueInteraction;
    });

    const [keys, setKeys] = useState({});
    const [interactionTarget, setInteractionTarget] = useState(null);
    const [canInteract, setCanInteract] = useState(false);

    const isDesktopVisible = phase === 'zoom_dialogue' && (currentNode === 'secret_wait' || showBrowser);

    // Handle Keyboard
    useEffect(() => {
        const handleKeyDown = (e) => {
            const key = e.key.toLowerCase();
            setKeys(prev => ({ ...prev, [key]: true }));
        };
        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase();
            setKeys(prev => ({ ...prev, [key]: false }));
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // E key interaction
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key.toLowerCase() === 'e') {
                if (phase === 'study_walk' && interactionTarget === 'exit') {
                    setPhase('living_room_walk');
                } else if (phase === 'living_room_walk' && interactionTarget === 'bedroom') {
                    setPhase('washroom_walk');
                } else if (phase === 'washroom_walk' && interactionTarget === 'sleep') {
                    setPhase('washroom_inside');
                } else if (phase === 'bedroom_return_walk' && interactionTarget === 'exit') {
                    setPhase('living_room_return_walk');
                } else if (phase === 'living_room_return_walk' && interactionTarget === 'study') {
                    setPhase('study_return_walk');
                } else if (phase === 'living_room_return_walk' && interactionTarget === 'exit' && hasTorch) {
                    // removed: neighborKnock was moved to finding the torch
                } else if (phase === 'study_return_walk') {
                    if (interactionTarget === 'drawer' && !hasTorch) {
                        setHasTorch(true);
                        setNeighborKnock(true);
                    } else if (interactionTarget === 'exit') {
                        setPhase('living_room_return_walk');
                    }
                }

                if (neighborKnock) {
                    setNeighborKnock(false);
                    setPhase('garden_walk_night');
                } else if (phase === 'garden_walk_night' && interactionTarget === 'neighbor') {
                    setPhase('neighbor_conversation');
                } else if (phase === 'neighbor_conversation') {
                    if (neighborDialogStep < 5) {
                        setNeighborDialogStep(prev => prev + 1);
                    } else {
                        setFinalOutcome('escaped');
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
    }, [phase, interactionTarget, neighborKnock, finalOutcome, hasTorch]);

    // Space key interaction for dialogue
    useEffect(() => {
        const handleSpaceKey = (e) => {
            if (e.key === ' ' || e.code === 'Space') {
                if ((phase === 'dialogue' || phase === 'zoom_dialogue' || phase === 'whatsapp_noti_received') && !showBrowser) {
                    e.preventDefault();
                    if (handleDialogueInteractionRef.current) {
                        handleDialogueInteractionRef.current();
                    }
                } else if (phase === 'neighbor_conversation') {
                    e.preventDefault();
                    if (neighborDialogStep < 5) {
                        setNeighborDialogStep(prev => prev + 1);
                    } else {
                        setFinalOutcome('escaped');
                    }
                }
            }
        };
        window.addEventListener('keydown', handleSpaceKey);
        return () => window.removeEventListener('keydown', handleSpaceKey);
    }, [phase, neighborDialogStep, showBrowser]);

    // Play Knock Sound
    useEffect(() => {
        if (neighborKnock) {
            audioRef.current = new Audio('/audio/doorknock.mp3');
            audioRef.current.loop = true;
            audioRef.current.play().catch(e => console.log("Audio play blocked by browser interaction policy"));
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        }
        return () => {
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

    // Movement Loop
    useEffect(() => {
        if (!['study_walk', 'living_room_walk', 'washroom_walk', 'bedroom_return_walk', 'living_room_return_walk', 'study_return_walk', 'garden_walk_night'].includes(phase)) return;

        let frameId;
        const loop = () => {
            let newDir = null;
            if (keys['a'] || keys['arrowleft']) newDir = 'left';
            else if (keys['d'] || keys['arrowright']) newDir = 'right';
            else if (keys['w'] || keys['arrowup']) newDir = 'up';
            else if (keys['s'] || keys['arrowdown']) newDir = 'down';

            if (newDir && newDir !== lastFacingRef.current) {
                lastFacingRef.current = newDir;
                setFacingDir(newDir);
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
                    else if (Math.abs(nx - 200) < 150 && ny < 200) target = 'cupboard';
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
                    if (Math.abs(nx - 600) < 200 && ny > ROOM_HEIGHT - 200) target = 'neighbor';
                    setInteractionTarget(target);

                    return { x: nx, y: ny };
                });
            }
            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [keys, phase]);

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

    const handleDummyIconClick = (name) => {
        setDesktopAlert(`Access Denied: You do not have permission to open ${name}.`);
        setTimeout(() => setDesktopAlert(''), 3000);
    };

    const startZoomCall = () => {
        setPhase('zoom_dialogue');
        setCurrentNode('zoom_intro');
        setLineIndex(0);
        setDisplayedText('');
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
            {['study_walk', 'living_room_walk', 'washroom_walk', 'bedroom_return_walk', 'living_room_return_walk', 'study_return_walk', 'garden_walk_night'].includes(phase) && (
                <div className="absolute inset-0 z-[110] bg-zinc-950 flex items-center justify-center overflow-hidden font-mono">

                    {/* STUDY WALK */}
                    {/* DARKNESS OVERLAY FOR RETURN PHASES */}
                    {['bedroom_return_walk', 'living_room_return_walk', 'study_return_walk', 'garden_walk_night'].includes(phase) && !hasTorch && (
                        <div className="absolute inset-0 bg-black/80 z-[105] pointer-events-none" />
                    )}
                    {['bedroom_return_walk', 'living_room_return_walk', 'study_return_walk', 'garden_walk_night'].includes(phase) && hasTorch && (() => {
                        let activePos = playerPos;
                        if (phase === 'living_room_return_walk') activePos = livingRoomPlayerPos;
                        if (phase === 'bedroom_return_walk') activePos = bedroomPlayerPos;
                        if (phase === 'garden_walk_night') activePos = gardenPlayerPos;

                        // For living room, the viewport translates, so we keep the spotlight centered on the screen 
                        // because the player is mostly centered, but let's approximate it. For simplicity, just follow playerPos locally.
                        let px = activePos.x + (PLAYER_SIZE / 2);
                        let py = activePos.y + (PLAYER_SIZE / 2);

                        // In living room, we need to adjust for the camera pan
                        if (phase === 'living_room_return_walk') {
                            const VIEWPORT_WIDTH = 1200;
                            const VIEWPORT_HEIGHT = 800;
                            const offsetX = Math.max(0, Math.min(activePos.x - VIEWPORT_WIDTH / 2, LIVING_ROOM_WIDTH - VIEWPORT_WIDTH));
                            const offsetY = Math.max(0, Math.min(activePos.y - VIEWPORT_HEIGHT / 2, LIVING_ROOM_HEIGHT - VIEWPORT_HEIGHT));
                            px -= offsetX;
                            py -= offsetY;
                        }

                        // Project flashlight beam forward based on facing direction
                        let lightX = px;
                        let lightY = py;
                        const offset = 90; // offset amount to project flashlight forward
                        if (facingDir === 'left') lightX -= offset;
                        else if (facingDir === 'right') lightX += offset;
                        else if (facingDir === 'up') lightY -= offset;
                        else if (facingDir === 'down') lightY += offset;

                        return (
                            <div className="absolute inset-0 z-[105] pointer-events-none" style={{
                                background: `radial-gradient(circle 280px at ${lightX}px ${lightY}px, transparent 0%, rgba(0,0,0,0.95) 100%)`
                            }} />
                        );
                    })()}

                    {/* STUDY WALK / STUDY RETURN WALK */}
                    {(phase === 'study_walk' || phase === 'study_return_walk') && (
                        <div className="relative bg-zinc-800 border-8 border-zinc-900 shadow-2xl overflow-hidden" style={{ width: ROOM_WIDTH, height: ROOM_HEIGHT }}>
                            <div className="absolute inset-0 z-0" style={{ backgroundImage: "url('/assets/study.png')", backgroundSize: 'cover', backgroundPosition: 'center' }} />

                            {phase === 'study_walk' && !interactionTarget && <InteractionPrompt showKey={false} text="Go to the living room" />}
                            {phase === 'study_walk' && interactionTarget === 'exit' && <InteractionPrompt text="Press E to exit the room" />}

                            {phase === 'study_return_walk' && !interactionTarget && !hasTorch && <InteractionPrompt showKey={false} text="Find a torch in the dark" />}
                            {phase === 'study_return_walk' && !interactionTarget && hasTorch && <InteractionPrompt showKey={false} text="Go back to the living room" />}
                            {phase === 'study_return_walk' && interactionTarget === 'exit' && <InteractionPrompt text="Press E to exit the room" />}
                            {phase === 'study_return_walk' && interactionTarget === 'cupboard' && <InteractionPrompt text="Press E to search cupboard" />}
                            {phase === 'study_return_walk' && interactionTarget === 'drawer' && !hasTorch && <InteractionPrompt text="Press E to check desk drawer" />}
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

                                    <Player x={livingRoomPlayerPos.x} y={livingRoomPlayerPos.y} />
                                </div>
                                {phase === 'living_room_walk' && !interactionTarget && <InteractionPrompt showKey={false} text="Go to the bedroom" />}
                                {phase === 'living_room_walk' && interactionTarget === 'bedroom' && <InteractionPrompt text="Press E to enter bedroom" />}

                                {phase === 'living_room_return_walk' && !interactionTarget && <InteractionPrompt showKey={false} text={hasTorch ? "Escape through the front door" : "Go to the study"} />}
                                {phase === 'living_room_return_walk' && interactionTarget === 'exit' && <InteractionPrompt text={hasTorch ? "Press E to escape!" : "I need to find a torch first."} />}
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

                            <Player x={bedroomPlayerPos.x} y={bedroomPlayerPos.y} />
                        </div>
                    )}

                    {/* GARDEN NIGHT WALK */}
                    {phase === 'garden_walk_night' && (
                        <div className="relative border-8 border-slate-900 shadow-2xl overflow-hidden bg-zinc-900 animate-in fade-in duration-1000" style={{ width: ROOM_WIDTH, height: ROOM_HEIGHT }}>
                            <div className="absolute inset-0 z-0" style={{ backgroundImage: "url('/assets/garrrdennight.png')", backgroundSize: 'cover', backgroundPosition: 'center' }} />

                            {!interactionTarget && <InteractionPrompt showKey={false} text="Find the neighbor" />}
                            {interactionTarget === 'neighbor' && <InteractionPrompt text="Press E to speak to neighbor" />}

                            <Player x={gardenPlayerPos.x} y={gardenPlayerPos.y} />
                        </div>
                    )}

                    {/* NEIGHBOR CONVERSATION PHASE */}
                    {phase === 'neighbor_conversation' && (
                        <div className="absolute inset-0 z-[160] flex flex-col justify-end bg-black/60 backdrop-blur-sm p-12">
                            <div className="w-full max-w-4xl mx-auto bg-slate-900 border-4 border-slate-700 rounded-2xl p-8 shadow-2xl relative animate-slide-up">
                                {(() => {
                                    const conv = [
                                        { speaker: 'Arjun', text: 'Uncle! The police... are they outside?!' },
                                        { speaker: 'Neighbor', text: 'Police? What police? The street is completely empty. Current poyiduchu, do you have a spare candle?' },
                                        { speaker: 'Arjun', text: 'But the officer on the phone... the arrest team...' },
                                        { speaker: 'Neighbor', text: 'Arjun, are you okay? There is no one here.' },
                                        { speaker: 'System', text: '*You look at your phone. The Zoom call has abruptly ended. The number is blocked.*' },
                                        { speaker: 'Arjun', text: 'It was a scam... I almost lost everything.' }
                                    ];
                                    const currentLine = conv[neighborDialogStep];
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
                    {hasTorch && !neighborKnock && !finalOutcome && phase !== 'washroom_inside' && (
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-red-600/80 border-[3px] border-black text-white px-8 py-3 z-50 font-bold tracking-widest text-lg uppercase shadow-2xl animate-pulse text-center w-[80%] max-w-[800px]">
                            "I AM LOSING PATIENCE! PAY THE 50 LAKHS PENALTY FINE AND VERIFY YOUR BANK DETAILS NOW TO AVOID IMMEDIATE ARREST!"
                        </div>
                    )}

                    {/* NEIGHBOR KNOCK OVERLAY */}
                    {neighborKnock && !finalOutcome && !showMobileBank && (
                        <div className="absolute inset-0 z-[150] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
                            <div className="text-white text-3xl font-bold tracking-widest animate-pulse mb-12">
                                *LOUD KNOCKING AT THE DOOR*
                            </div>

                            <div className="flex gap-12 w-[900px] max-w-[90vw]">
                                {/* Officer Threat */}
                                <div className="flex-1 bg-red-900/80 border-4 border-red-500 p-6 rounded-xl animate-bounce-slight shadow-[0_0_50px_rgba(255,0,0,0.5)]">
                                    <div className="text-red-300 font-bold text-sm mb-2 uppercase tracking-widest">Phone Audio</div>
                                    <div className="text-white text-xl font-black">"THAT'S MY ARREST TEAM! DO NOT OPEN THE DOOR! TRANSFER THE 50 LAKHS NOW!"</div>
                                </div>

                                {/* Neighbor Request */}
                                <div className="flex-1 bg-blue-900/80 border-4 border-blue-500 p-6 rounded-xl">
                                    <div className="text-blue-300 font-bold text-sm mb-2 uppercase tracking-widest">Muffled Voice Outside</div>
                                    <div className="text-white text-xl font-bold">"Hello? Arjun uncle? Current poyiduchu... do you have a spare candle?"</div>
                                </div>
                            </div>

                            <div className="mt-16 flex gap-8">
                                <div className="bg-white text-black font-black px-8 py-4 rounded-xl text-xl animate-pulse border-4 border-black">
                                    Press [E] to open door
                                </div>
                                <div className="bg-black text-white font-black px-8 py-4 rounded-xl text-xl border-4 border-red-600">
                                    Press [M] to open Mobile Banking
                                </div>
                            </div>
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
                        <div className="absolute inset-0 z-[200] bg-black flex flex-col items-center justify-center">
                            <div className="w-16 h-16 rounded-full border-4 border-green-500 border-t-transparent animate-spin mb-8"></div>
                            <div className="text-green-500 text-2xl font-mono font-bold mb-12">Processing Transfer...</div>
                            <div className="text-red-600 text-4xl font-black tracking-widest animate-in slide-in-from-bottom duration-1000 delay-1000 fill-mode-both">
                                TRANSFER SUCCESSFUL
                            </div>
                            <div className="text-white text-xl font-serif mt-12 text-center max-w-2xl opacity-0 animate-in fade-in duration-2000 delay-2000 fill-mode-both">
                                The Zoom call abruptly disconnected.<br /><br />
                                The banging on the door stopped.<br /><br />
                                You sit alone in the dark house... realizing you were just robbed of everything.
                                <br /><br />
                                <button className="mt-12 px-8 py-3 border-2 border-white text-white hover:bg-white hover:text-black transition-colors" onClick={() => window.location.reload()}>RESTART GAME</button>
                            </div>
                        </div>
                    )}

                    {/* FINAL OUTCOME: ESCAPED */}
                    {finalOutcome === 'escaped' && (
                        <div className="absolute inset-0 z-[200] bg-zinc-900 flex flex-col items-center justify-center p-12 text-center">
                            <div className="text-green-400 text-6xl font-black tracking-widest animate-in zoom-in duration-1000 fill-mode-both">
                                YOU BROKE THE SCAM.
                            </div>
                            <div className="opacity-0 animate-in fade-in duration-1000 delay-1000 fill-mode-both mt-16">
                                <button className="px-12 py-4 bg-green-600 text-white font-bold hover:bg-green-700 transition-colors rounded-xl text-2xl shadow-xl hover:scale-105" onClick={() => enterLevel(14)}>
                                    CONTINUE
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            )}

            {/* Desktop OS (always in background) */}
            <div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[900px] h-[550px] bg-slate-900 border border-slate-600 rounded-xl flex flex-col transition-all duration-500 overflow-hidden ${isDesktopVisible
                        ? 'opacity-100 scale-100 pointer-events-auto shadow-[0_0_120px_rgba(0,0,0,0.5)]'
                        : 'opacity-0 scale-95 pointer-events-none'
                    }`}
            >

                {/* Desktop Wallpaper */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-900 to-indigo-900/40 z-0 bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(to bottom right, #0f172a, #1e3a8a)' }}></div>

                {/* Desktop Icons Grid */}
                <div className="relative z-10 flex-1 p-8 grid grid-cols-8 grid-rows-6 gap-6 content-start items-start">
                    {/* Google Chrome Icon */}
                    <div
                        className="flex flex-col items-center gap-2 cursor-pointer p-3 rounded-xl relative group transition-all duration-200 hover:bg-white/10 hover:-translate-y-1"
                        onDoubleClick={handleChromeClick}
                        onClick={handleChromeClick} // single click for ease of play
                    >
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-xl relative group-hover:shadow-2xl transition-shadow">
                            {/* Chrome icon CSS art */}
                            <div className="w-14 h-14 rounded-full border-[4px] border-red-500 flex items-center justify-center relative overflow-hidden bg-yellow-400">
                                <div className="absolute top-0 right-0 w-1/2 h-full bg-green-500"></div>
                                <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500 rounded-b-full"></div>
                                <div className="w-5 h-5 bg-blue-500 rounded-full border-[3px] border-white z-10 shadow-sm"></div>
                            </div>
                        </div>
                        <span className="text-white text-[13px] drop-shadow-md font-medium mt-1">Google Chrome</span>
                    </div>

                    {/* Dummy Icon: This PC */}
                    <div className="flex flex-col items-center gap-2 cursor-pointer p-3 rounded-xl group transition-all duration-200 hover:bg-white/10 hover:-translate-y-1" onClick={() => handleDummyIconClick("This PC")}>
                        <div className="w-16 h-16 flex items-center justify-center group-hover:drop-shadow-2xl transition-all">
                            <svg className="w-14 h-14 text-slate-300 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" /></svg>
                        </div>
                        <span className="text-white text-[13px] drop-shadow-md font-medium mt-1">This PC</span>
                    </div>

                    {/* Dummy Icon: Documents */}
                    <div className="flex flex-col items-center gap-2 cursor-pointer p-3 rounded-xl group transition-all duration-200 hover:bg-white/10 hover:-translate-y-1" onClick={() => handleDummyIconClick("Documents")}>
                        <div className="w-16 h-16 flex items-center justify-center group-hover:drop-shadow-2xl transition-all">
                            <svg className="w-14 h-14 text-yellow-400 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                        </div>
                        <span className="text-white text-[13px] drop-shadow-md font-medium mt-1">Documents</span>
                    </div>

                    {/* Dummy Icon: Recycle Bin */}
                    <div className="flex flex-col items-center gap-2 cursor-pointer p-3 rounded-xl group transition-all duration-200 hover:bg-white/10 hover:-translate-y-1" onClick={() => handleDummyIconClick("Recycle Bin")}>
                        <div className="w-16 h-16 flex items-center justify-center group-hover:drop-shadow-2xl transition-all">
                            <svg className="w-14 h-14 text-slate-400 drop-shadow-lg opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </div>
                        <span className="text-white text-[13px] drop-shadow-md font-medium mt-1">Recycle Bin</span>
                    </div>
                </div>

                {/* Desktop Alert Toast */}
                {desktopAlert && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-red-600/90 backdrop-blur-md text-white px-6 py-2.5 rounded shadow-2xl z-[60] font-mono text-sm border border-red-400 animate-slide-up flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-200" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        {desktopAlert}
                    </div>
                )}

                {/* Fake Browser Overlay for Secret Investigation on DASHBOARD */}
                {showBrowser && (
                    <div className="absolute inset-y-10 inset-x-20 bg-white rounded-lg shadow-2xl z-50 flex flex-col overflow-hidden pointer-events-auto border border-slate-400 animate-slide-up" onClick={e => e.stopPropagation()}>
                        {/* Browser Header */}
                        <div className="bg-slate-200 h-10 flex items-center px-4 border-b border-slate-300 gap-3">
                            <div className="flex gap-2">
                                <div className="w-3.5 h-3.5 bg-[#ff5f56] rounded-full cursor-pointer hover:bg-red-500 shadow-sm border border-[#e0443e]" onClick={() => setShowBrowser(false)}></div>
                                <div className="w-3.5 h-3.5 bg-[#ffbd2e] rounded-full shadow-sm border border-[#dea123]"></div>
                                <div className="w-3.5 h-3.5 bg-[#27c93f] rounded-full shadow-sm border border-[#1aab29]"></div>
                            </div>
                            <div className="flex-1 ml-4 bg-white rounded-md h-6 px-4 flex items-center text-xs text-slate-500 border border-slate-300 shadow-inner">
                                search.secureweb.com
                            </div>
                        </div>
                        {/* Browser Content */}
                        <div className="flex-1 bg-white p-8 flex flex-col items-center justify-center">
                            <h1 className="text-5xl font-bold text-blue-600 mb-8 flex items-center gap-1">
                                <span className="text-[#4285F4]">G</span>
                                <span className="text-[#EA4335]">o</span>
                                <span className="text-[#FBBC05]">o</span>
                                <span className="text-[#4285F4]">g</span>
                                <span className="text-[#34A853]">l</span>
                                <span className="text-[#EA4335]">e</span>
                            </h1>
                            <div className="w-3/4 max-w-2xl bg-white border border-slate-300 hover:shadow-md rounded-full h-12 px-6 flex items-center shadow-sm text-lg transition-shadow">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none text-slate-800"
                                    placeholder="Search Google or type a URL"
                                    disabled={searchStatus !== 'idle'}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && searchStatus === 'idle') {
                                            triggerSearch();
                                        }
                                    }}
                                    autoFocus
                                />
                            </div>
                            {searchStatus === 'idle' && (
                                <button
                                    className="mt-8 bg-[#f8f9fa] border border-[#f8f9fa] hover:border-[#dadce0] hover:shadow text-slate-700 px-6 py-2.5 rounded transition-all text-sm font-medium"
                                    onClick={triggerSearch}
                                >
                                    Google Search
                                </button>
                            )}
                            {searchStatus === 'searching' && (
                                <div className="mt-12 text-slate-500 font-mono animate-pulse text-sm">Searching the web...</div>
                            )}
                            {searchStatus === 'done' && (
                                <div className="mt-8 p-6 bg-red-50 border-l-4 border-red-500 w-3/4 max-w-2xl shadow-md rounded text-left animate-slide-up">
                                    <h3 className="text-red-700 font-bold text-xl mb-2 flex items-center gap-2">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        SCAM WARNING
                                    </h3>
                                    <p className="text-red-600 mb-3 font-medium text-sm">"Digital Arrest" is a common phrase used by cybercriminals impersonating police or customs officers.</p>
                                    <p className="text-red-800 text-xs">Indian law does not have a provision for 'Digital Arrest' over Skype or WhatsApp. Any officer demanding you stay on a video call is attempting a cyber extortion scam.</p>
                                    <div className="mt-5 bg-red-100 p-2 text-red-900 text-xs font-mono border border-red-300 rounded text-center font-bold tracking-widest animate-pulse">
                                        THE OFFICER ON YOUR PHONE IS WATCHING YOU...
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Windows 11 Style Taskbar */}
                <div className="h-12 bg-slate-800/80 backdrop-blur-lg border-t border-slate-700/50 flex items-center px-4 justify-between z-20 relative">
                    {/* Left: Start & Apps */}
                    <div className="flex items-center gap-3">
                        {/* Windows Start Button */}
                        <div className="w-10 h-10 hover:bg-white/10 rounded-md flex items-center justify-center cursor-pointer transition-colors">
                            <div className="grid grid-cols-2 gap-0.5">
                                <div className="w-3 h-3 bg-[#00a4ef] rounded-sm"></div>
                                <div className="w-3 h-3 bg-[#00a4ef] rounded-sm"></div>
                                <div className="w-3 h-3 bg-[#00a4ef] rounded-sm"></div>
                                <div className="w-3 h-3 bg-[#00a4ef] rounded-sm"></div>
                            </div>
                        </div>
                        {/* Taskbar Search */}
                        <div className="h-8 w-40 bg-slate-900/50 rounded-full flex items-center px-3 border border-slate-700/50 shadow-inner">
                            <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            <span className="text-slate-500 text-xs">Search</span>
                        </div>
                        {/* Taskbar Chrome Active Icon */}
                        {showBrowser && (
                            <div className="w-10 h-10 bg-white/20 rounded-md flex items-center justify-center border-b-2 border-[#4285F4] ml-2">
                                <div className="w-6 h-6 rounded-full border-[2px] border-red-500 flex items-center justify-center relative overflow-hidden bg-yellow-400">
                                    <div className="absolute top-0 right-0 w-1/2 h-full bg-green-500"></div>
                                    <div className="absolute top-0 left-0 w-full h-1/2 bg-red-500 rounded-b-full"></div>
                                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full border border-white z-10 shadow-sm"></div>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Right: System Tray & Clock */}
                    <div className="flex items-center gap-4 text-slate-200 text-xs px-2">
                        <div className="flex items-center gap-2 opacity-80">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" /></svg>
                        </div>
                        <div className="flex flex-col items-end leading-tight hover:bg-white/10 px-2 py-1 rounded cursor-pointer transition-colors">
                            <span className="font-medium">09:28 AM</span>
                            <span className="text-[10px] text-slate-400">16-06-2026</span>
                        </div>
                    </div>
                </div>
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
                                <div className="absolute inset-0 bg-[#efeae2] z-0">
                                    <div className="absolute inset-0 opacity-35 mix-blend-multiply" style={{ backgroundImage: 'url("https://w0.peakpx.com/wallpaper/508/606/HD-wallpaper-whatsapp-background-texture-seamless-pattern.jpg")', backgroundSize: 'cover' }}></div>
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
                                <span>{phase === 'whatsapp_file_delivery' ? '09:35' : '09:28'}</span>
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
                                    <div className="w-full h-full flex flex-col pt-12 pb-6 px-4 relative z-10">
                                        {/* Caller Avatar */}
                                        <div className="mt-12 flex flex-col items-center flex-1 w-full text-center">
                                            <div className="w-20 h-20 rounded-full bg-slate-850 flex items-center justify-center text-3xl text-white font-semibold mb-4 border border-slate-750 shadow-inner">
                                                FE
                                            </div>
                                            <div className="flex items-center gap-1.5 justify-center mb-1">
                                                <h2 className="text-3xl font-semibold text-white tracking-wide">FedEx</h2>
                                                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="text-emerald-400 text-[10px] font-bold tracking-wider uppercase mb-1">Verified Business Call</div>
                                            <div className="text-slate-400 font-mono text-xs">+1 (800) 463-3339</div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex w-full justify-between px-8 mb-12 pointer-events-auto mt-auto">
                                            <div
                                                className="flex flex-col items-center gap-2 cursor-pointer group"
                                                onClick={() => setPhase('working')}
                                            >
                                                <button className="w-[60px] h-[60px] bg-red-650 rounded-full flex items-center justify-center group-hover:bg-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)] pointer-events-none transition-all duration-200">
                                                    <svg className="w-7 h-7 text-white transform rotate-[135deg]" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                                                </button>
                                                <span className="text-slate-400 text-[11px] font-medium tracking-wide">Decline</span>
                                            </div>
                                            <div
                                                className="flex flex-col items-center gap-2 cursor-pointer group"
                                                onClick={() => setPhase('dialogue')}
                                            >
                                                <button className="w-[60px] h-[60px] bg-green-600 rounded-full flex items-center justify-center group-hover:bg-green-500 shadow-[0_0_20px_rgba(22,163,74,0.4)] animate-pulse pointer-events-none transition-all duration-200">
                                                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                                                </button>
                                                <span className="text-slate-400 text-[11px] font-medium tracking-wide">Accept</span>
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
                                                    00:14
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
                                        <div className="absolute top-0 left-0 right-0 bg-[#008069] h-[96px] flex flex-col z-20 pt-9 px-3 pb-1 shadow-md">
                                            <div className="flex items-center gap-2 flex-1">
                                                <svg 
                                                    className="w-5 h-5 text-white cursor-pointer hover:opacity-85 transition-opacity" 
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
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                                </svg>
                                                <div className="w-8 h-8 rounded-full bg-slate-200/20 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                                    <svg className="w-5 h-5 text-white/90" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <div className="flex flex-col flex-1 truncate">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-white font-semibold text-[13px] truncate">
                                                            {phase === 'whatsapp_file_delivery' ? 'Sr. Officer Rajesh Sharma' : '+91 98765 43210'}
                                                        </span>
                                                        <svg className="w-3.5 h-3.5 text-white fill-current bg-[#25d366] rounded-full p-[1px] shrink-0 shadow-sm" viewBox="0 0 24 24">
                                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" stroke="white" strokeWidth="2" />
                                                        </svg>
                                                    </div>
                                                    <span className="text-white/80 text-[10px] text-left">online</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-white">
                                                    <svg className="w-4 h-4 cursor-pointer hover:opacity-85" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                                                    <svg className="w-4 h-4 cursor-pointer hover:opacity-85" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" /></svg>
                                                    <svg className="w-4 h-4 cursor-pointer hover:opacity-85" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* WA Chat Body */}
                                        <div className="absolute inset-0 top-[96px] pb-[76px] z-10 flex flex-col p-3 overflow-y-auto custom-scrollbar">
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
                                                        <p className="text-[#111b21] text-[12.5px] leading-snug">Mr. Mehta, I am sending the official documents now. Review them carefully.</p>
                                                        <span className="text-[#8696a0] text-[9px] float-right mt-1 ml-2 font-medium">09:35 AM</span>
                                                    </div>
                                                    
                                                    {/* FIR Document */}
                                                    <div 
                                                        onClick={() => handleViewDocument('FIR')} 
                                                        className="bg-white p-2 rounded-2xl self-start w-[85%] max-w-[260px] relative shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] cursor-pointer hover:bg-slate-50 transition-all mt-1"
                                                    >
                                                        <div className="flex items-center gap-3 bg-[#f0f2f5] p-2.5 rounded-xl border-l-[3px] border-red-500">
                                                            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                                                                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                            <div className="flex flex-col flex-1 min-w-0">
                                                                <span className="text-[#111b21] text-[12px] font-bold truncate">FIR_Mumbai_Police.pdf</span>
                                                                <span className="text-[#8696a0] text-[9.5px] font-medium">2.4 MB • {viewedDocuments.includes('FIR') ? 'Opened' : 'Tap to View'}</span>
                                                            </div>
                                                            <div className="shrink-0 ml-1">
                                                                {viewedDocuments.includes('FIR') ? (
                                                                    <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg className="w-4.5 h-4.5 text-[#8696a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                    </svg>
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
                                                        className="bg-white p-2 rounded-2xl self-start w-[85%] max-w-[260px] relative shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] cursor-pointer hover:bg-slate-50 transition-all mt-1"
                                                    >
                                                        <div className="flex items-center gap-3 bg-[#f0f2f5] p-2.5 rounded-xl border-l-[3px] border-red-500">
                                                            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                                                                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                            <div className="flex flex-col flex-1 min-w-0">
                                                                <span className="text-[#111b21] text-[12px] font-bold truncate">Supreme_Court_Notice.pdf</span>
                                                                <span className="text-[#8696a0] text-[9.5px] font-medium">1.8 MB • {viewedDocuments.includes('CourtNotice') ? 'Opened' : 'Tap to View'}</span>
                                                            </div>
                                                            <div className="shrink-0 ml-1">
                                                                {viewedDocuments.includes('CourtNotice') ? (
                                                                    <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg className="w-4.5 h-4.5 text-[#8696a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                                    </svg>
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
                                                        className="bg-white p-2 rounded-2xl self-start w-[85%] max-w-[260px] relative shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] cursor-pointer hover:bg-slate-50 transition-all mt-1"
                                                    >
                                                        <div className="flex items-center gap-3 bg-[#f0f2f5] p-2.5 rounded-xl border-l-[3px] border-blue-500">
                                                            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                            <div className="flex flex-col flex-1 min-w-0">
                                                                <span className="text-[#111b21] text-[12px] font-bold truncate">Parcel_Evidence.jpg</span>
                                                                <span className="text-[#8696a0] text-[9.5px] font-medium">4.1 MB • {viewedDocuments.includes('Photos') ? 'Opened' : 'Tap to View'}</span>
                                                            </div>
                                                            <div className="shrink-0 ml-1">
                                                                {viewedDocuments.includes('Photos') ? (
                                                                    <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                    </svg>
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
                                                                className="bg-[#008069] text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-[#006653] transition-colors"
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
                            <div className="bg-[#fcfaf5] w-full max-w-2xl my-8 p-8 sm:p-12 text-black font-serif shadow-2xl relative border-[8px] border-double border-slate-800 shrink-0">
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
                                        <strong>IT IS HEREBY ORDERED</strong> that the suspect is placed under strict <span className="font-bold bg-yellow-200 px-1">DIGITAL ARREST</span>. The suspect must not terminate the video link with the investigating officer.
                                    </p>
                                    <p>
                                        Any attempt to contact third parties, use a secondary device, or leave the premises will be considered a direct violation of this court order, resulting in immediate physical apprehension by local law enforcement.
                                    </p>
                                </div>
                                <div className="absolute bottom-16 right-12 text-center">
                                    <div className="font-cursive text-3xl text-blue-900 mb-2 rotate-[-5deg]">S. N. Reddy</div>
                                    <div className="border-t-2 border-black pt-1 w-48">
                                        <p className="font-bold">Hon'ble Magistrate</p>
                                        <p className="text-xs">Special Cyber Tribunal</p>
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
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fade-in-out { 0% { opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                .animate-slide-up { animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                
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
