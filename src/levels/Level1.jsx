import React, { useState, useEffect, useRef } from 'react';
import Player from '../components/Player';
import { useGameState } from '../context/GameStateContext';

const Level1 = () => {
    const { assets, completeLevel, adjustAssets } = useGameState();
    // STATE MACHINE: intro_pov -> phone_intro → active_call → final_decision → game_over/victory → level_complete
    const [gameState, setGameState] = useState('intro_pov');
    const [canInteract, setCanInteract] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState(null);
    const [dialerInput, setDialerInput] = useState('');
    const [callStep, setCallStep] = useState(0); // step in the 1930 call conversation
    const [callOutcome, setCallOutcome] = useState(null); // 'won' or 'lost' — determines what 1930 says
    const [outroStep, setOutroStep] = useState(0); // 0: none, 1: zoom reflection, 2: black screen card, 3: completed

    // CALL & DIALOGUE STATE
    const [dialogueIndex, setDialogueIndex] = useState(0);
    const [timer, setTimer] = useState(120); // 2:00
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    // TYPING ANIMATION
    const [typingProgress, setTypingProgress] = useState(0);
    const [isTypingDone, setIsTypingDone] = useState(false);
    const [typingTarget, setTypingTarget] = useState(''); // full text being typed

    // CHAT HISTORY — stores all displayed messages permanently
    // Each entry: { type: 'scammer'|'player'|'reply', text, parts?, dialogueIdx? }
    const [chatHistory, setChatHistory] = useState([]);
    const [showingOptions, setShowingOptions] = useState(false); // whether player options are visible

    // CLUES & DETECTIVE MODE
    const [clues, setClues] = useState([]);
    const [isDetectiveModeOpen, setIsDetectiveModeOpen] = useState(false);

    // SMS STATE
    const [isSmsVisible, setIsSmsVisible] = useState(false);
    const [isSmsExpanded, setIsSmsExpanded] = useState(false);

    // POV INTERACTION STATE
    const [isPhotoZoomed, setIsPhotoZoomed] = useState(false);
    const [showPhoneNoti, setShowPhoneNoti] = useState(false);
    const [visibleNotiCount, setVisibleNotiCount] = useState(0);
    const [showCallNotification, setShowCallNotification] = useState(false);

    // TUTORIAL STATE
    const [tutorialStep, setTutorialStep] = useState(0); // 0: none, 1: dragging, 2: board analysis
    const [hasSeenClueTutorial, setHasSeenClueTutorial] = useState(false);

    // PROCEDURAL AUDIO SYNTHESIZER
    const audioCtxRef = useRef(null);
    const ambienceNodesRef = useRef(null);

    const getAudioContext = () => {
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtxRef.current;
    };

    const playSynthSound = (type) => {
        const ctx = getAudioContext();
        if (ctx.state === 'suspended') ctx.resume();

        switch (type) {
            case 'wood_tap': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(100, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
                break;
            }
            case 'noti_buzz': {
                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                const gain = ctx.createGain();
                osc1.frequency.setValueAtTime(880, ctx.currentTime);
                osc2.frequency.setValueAtTime(1320, ctx.currentTime);
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
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
                gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
                gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.25);
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
            case 'call_vibration': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const mod = ctx.createOscillator();
                const gate = ctx.createGain();
                const gateOsc = ctx.createOscillator();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(55, ctx.currentTime); // Slightly lower frequency

                mod.type = 'triangle'; // Smoother transition than square
                mod.frequency.setValueAtTime(3, ctx.currentTime); // Slightly slower rhythm

                gain.gain.setValueAtTime(0.15, ctx.currentTime); // Lower volume

                // Gating logic: 0.7s on, 0.7s off (0.714 Hz cycle)
                gateOsc.type = 'square';
                gateOsc.frequency.setValueAtTime(0.714, ctx.currentTime);

                // Scale square wave (-1 to 1) to (0 to 1)
                const gateConst = ctx.createGain();
                gateConst.gain.setValueAtTime(0.5, ctx.currentTime);
                gateOsc.connect(gateConst);

                gate.gain.setValueAtTime(0.5, ctx.currentTime);
                gateConst.connect(gate.gain);

                mod.connect(gain.gain);
                osc.connect(gain);
                gain.connect(gate);
                gate.connect(ctx.destination);

                osc.start();
                mod.start();
                gateOsc.start();
                return { osc, mod, gain, gateOsc };
            }
            case 'acceptance_click': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.05);
                gain.gain.setValueAtTime(0.5, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.05);
                break;
            }
            case 'cinematic_surge': {
                const osc1 = ctx.createOscillator(); // Low thump/horn
                const osc2 = ctx.createOscillator(); // Riser
                const gain = ctx.createGain();
                const filter = ctx.createBiquadFilter();

                osc1.type = 'sawtooth';
                osc1.frequency.setValueAtTime(40, ctx.currentTime);
                osc1.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 2.5);

                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(200, ctx.currentTime);
                osc2.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 3);

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(100, ctx.currentTime);
                filter.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 2.5);

                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.5);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 3);

                osc1.connect(filter);
                osc2.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);

                osc1.start();
                osc2.start();
                osc1.stop(ctx.currentTime + 3);
                osc2.stop(ctx.currentTime + 3);
                break;
            }
            case 'digital_glitch': {
                const bufferSize = ctx.sampleRate * 0.11;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                const gain = ctx.createGain();
                const filter = ctx.createBiquadFilter();

                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(2000 + Math.random() * 3000, ctx.currentTime);

                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);
                noise.start();
                break;
            }
            case 'clue_drag': {
                const bufferSize = ctx.sampleRate * 0.2;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                const filter = ctx.createBiquadFilter();
                const gain = ctx.createGain();

                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(1000, ctx.currentTime);
                filter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.2);

                gain.gain.setValueAtTime(0.05, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);
                noise.start();
                break;
            }
            case 'clue_pin': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.05);
                break;
            }
            case 'board_opening': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(40, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
                break;
            }
        }
    };

    // AMBIENCE SYNTH (HUM)
    useEffect(() => {
        if (['intro_pov', 'phone_intro'].includes(gameState)) {
            const ctx = getAudioContext();
            if (!ambienceNodesRef.current) {
                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                const gain = ctx.createGain();

                osc1.type = 'sine';
                osc1.frequency.setValueAtTime(55, ctx.currentTime); // Low G

                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(110, ctx.currentTime); // G2

                gain.gain.setValueAtTime(0, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.015, ctx.currentTime + 2);

                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(ctx.destination);

                osc1.start();
                osc2.start();
                ambienceNodesRef.current = { osc1, osc2, gain };
            }
        } else {
            if (ambienceNodesRef.current) {
                const { osc1, osc2, gain } = ambienceNodesRef.current;
                gain.gain.linearRampToValueAtTime(0, getAudioContext().currentTime + 1);
                setTimeout(() => {
                    osc1.stop();
                    osc2.stop();
                }, 1000);
                ambienceNodesRef.current = null;
            }
        }
    }, [gameState]);

    // TRIGGER NOTIFICATION SOUND & VIBRATION
    useEffect(() => {
        if (showPhoneNoti || showCallNotification) {
            playSynthSound('noti_buzz');
            playSynthSound('noti_vibration');
        }
    }, [showPhoneNoti, showCallNotification]);

    // TRIGGER CALL VIBRATION
    const callVibrationRef = useRef(null);
    useEffect(() => {
        if (gameState === 'phone_calling' || showCallNotification) {
            if (!callVibrationRef.current) {
                callVibrationRef.current = playSynthSound('call_vibration');
            }
        } else {
            if (callVibrationRef.current) {
                const { osc, mod, gain, gateOsc } = callVibrationRef.current;
                gain.gain.exponentialRampToValueAtTime(0.001, getAudioContext().currentTime + 0.5);
                setTimeout(() => {
                    osc.stop();
                    mod.stop();
                    if (gateOsc) gateOsc.stop();
                    callVibrationRef.current = null;
                }, 500);
            }
        }
    }, [gameState, showCallNotification]);

    // INTERACTIVE DIALOGUE SEQUENCE
    const dialogueSequence = [
        {
            speaker: 'SCAMMER', parts: [
                { text: "Good afternoon, sir. Am I speaking with the primary account holder for " },
                { text: "your SBI account", isDraggable: true, clueId: 6, title: 'Knows Your Bank', desc: 'How does the caller already know which bank you use? They could be guessing or using leaked data.' },
                { text: "?" }
            ]
        },
        {
            speaker: 'PLAYER', options: [
                { text: "Yes, this is me. Who is this?", isCorrect: true, scammerReply: "Thank you for confirming, sir. I need to inform you of a very urgent security matter." },
                { text: "How did you get my number?", isCorrect: true, scammerReply: "Sir, we have your number on file as the registered contact. But that is not why I am calling — this is urgent." },
                { text: "I don't have any bank account!", isCorrect: false, penalty: 500, feedback: "Never reveal what banks you do or don't use to unknown callers.", scammerReply: "Sir, our records show otherwise. Please listen carefully, this is a matter of your financial security." }
            ]
        },
        {
            speaker: 'SCAMMER', parts: [
                { text: "Sir, I am Ravi Kumar, Senior Fraud Prevention Officer from the State Bank of India. My " },
                { text: "employee ID is SBI-CYB-4492", isDraggable: true, clueId: 1, title: 'Unverifiable Employee ID', desc: 'Anyone can make up an employee ID. There is no way to verify this over the phone.' },
                { text: ". I am calling on " },
                { text: "high priority", isHighlighted: true },
                { text: "." }
            ]
        },
        {
            speaker: 'SCAMMER', parts: [
                { text: "Our system has flagged three suspicious login attempts on your account from " },
                { text: "Bengaluru and outside India", isDraggable: true, clueId: 2, title: 'Scare Tactics', desc: 'Using specific foreign locations to trigger panic. They want you to stop thinking rationally.' },
                { text: ". Your entire balance is at risk." }
            ]
        },
        {
            speaker: 'PLAYER', options: [
                { text: "That sounds serious. What should I do?", isCorrect: true, scammerReply: "Don't worry sir, I will guide you through the security verification process right now." },
                { text: "Let me just transfer my money to a safe account!", isCorrect: false, penalty: 2000, feedback: "Never transfer money based on a phone call. That is exactly what scammers want.", scammerReply: "No no sir, do NOT transfer anything. We will secure it from our end. Just follow my instructions." }
            ]
        },
        {
            speaker: 'SCAMMER', parts: [
                { text: "To lock your account, I need to verify you are the genuine holder. It is a " },
                { text: "standard RBI security protocol", isDraggable: true, clueId: 3, title: 'Fake RBI Protocol', desc: 'RBI never asks banks to collect OTPs over the phone. Banks can lock accounts from their own systems.' },
                { text: "." }
            ]
        },
        {
            speaker: 'PLAYER', options: [
                { text: "Okay, what do you need from me?", isCorrect: true, scammerReply: "I will send an OTP to your registered mobile number. You just need to read it out to me for verification." },
                { text: "I will call my branch manager to confirm.", isCorrect: true, scammerReply: "Sir, by the time you reach your branch, the hackers will have already drained your account. We must act NOW." },
                { text: "Fine, just do whatever you need quickly!", isCorrect: false, penalty: 0, feedback: "Rushing is exactly what the scammer wants. Stay calm and listen carefully.", scammerReply: "That's the right attitude, sir. Time is critical. I am initiating the OTP process now." }
            ]
        },
        {
            speaker: 'SCAMMER', parts: [
                { text: "I am generating an OTP to your registered mobile number right now. Please " },
                { text: "tell me the OTP the moment you receive it", isDraggable: true, clueId: 7, title: 'Asking for OTP Directly', desc: 'No legitimate bank employee will ever ask you to read out your OTP over the phone. OTPs are for YOUR verification only.' },
                { text: ". You have exactly " },
                { text: "two minutes", isDraggable: true, clueId: 8, title: 'Artificial Time Pressure', desc: 'Scammers use fake deadlines to prevent you from thinking clearly or consulting someone.' },
                { text: " before the hacker's session locks you out permanently." }
            ], triggerTimer: true, triggerSms: true
        },
        {
            speaker: 'SCAMMER', parts: [
                { text: "Sir, did you receive the OTP? Please read it out immediately. Every second you wait, the risk increases." }
            ]
        },
        {
            speaker: 'SCAMMER', parts: [
                { text: "Sir! One minute left! If you don't read the OTP NOW, the entire " },
                { text: "forty-two lakhs will be at risk!", isDraggable: true, clueId: 5, title: 'Knows Your Exact Balance', desc: 'How does a random caller know your exact balance of ₹42 lakhs? This data was leaked or stolen.' }
            ], triggerEndCall: true
        }
    ];

    const startTyping = (fullText) => {
        setTypingTarget(fullText);
        setTypingProgress(0);
        setIsTypingDone(false);
    };

    useEffect(() => {
        if (!typingTarget) { setIsTypingDone(true); return; }
        setTypingProgress(0);
        setIsTypingDone(false);
        const interval = setInterval(() => {
            setTypingProgress(prev => {
                if (prev >= typingTarget.length) {
                    clearInterval(interval);
                    setIsTypingDone(true);
                    return prev;
                }
                return prev + 1;
            });
        }, 25);
        return () => clearInterval(interval);
    }, [typingTarget]);

    useEffect(() => {
        if (gameState === 'active_call' && chatHistory.length === 0) {
            const firstLine = dialogueSequence[0];
            const fullText = firstLine.parts.map(p => p.text).join('');
            setChatHistory([{ type: 'scammer', parts: firstLine.parts, dialogueIdx: 0 }]);
            startTyping(fullText);
        }
    }, [gameState]);

    // TRIGGER CLUE TUTORIAL
    useEffect(() => {
        const lastMsg = chatHistory[chatHistory.length - 1];
        if (lastMsg && lastMsg.parts?.some(p => p.isDraggable) && isTypingDone && !hasSeenClueTutorial && tutorialStep === 0) {
            const timer = setTimeout(() => {
                setTutorialStep(1);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [chatHistory, isTypingDone, hasSeenClueTutorial, tutorialStep]);

    useEffect(() => {
        if (isPhotoZoomed) {
            const timer = setTimeout(() => {
                setIsPhotoZoomed(false);
                setTimeout(() => {
                    setShowPhoneNoti(true);
                }, 2000);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isPhotoZoomed]);

    useEffect(() => {
        if (gameState === 'phone_intro') {
            let count = 0;
            const interval = setInterval(() => {
                count++;
                if (count <= 3) {
                    setVisibleNotiCount(count);
                    playSynthSound('noti_buzz');
                    playSynthSound('noti_vibration');
                } else if (count === 4) {
                    setShowCallNotification(true);
                    playSynthSound('noti_buzz'); // Final buzz for the call noti itself
                    clearInterval(interval);
                }
            }, 1500);
            return () => clearInterval(interval);
        } else {
            setVisibleNotiCount(0);
        }
    }, [gameState]);

    useEffect(() => {
        let interval;
        if (isTimerRunning && timer > 0 && gameState === 'active_call' && !isDetectiveModeOpen) {
            interval = setInterval(() => {
                setTimer(prev => {
                    if (prev === 1) {
                        setGameState('final_decision');
                        return prev;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (timer <= 0 && gameState === 'active_call') {
            handleGameOver();
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timer, gameState, isDetectiveModeOpen]);

    const advanceDialogue = () => {
        const nextIdx = dialogueIndex + 1;
        if (nextIdx >= dialogueSequence.length) return;
        const nextLine = dialogueSequence[nextIdx];
        setDialogueIndex(nextIdx);

        if (nextLine.speaker === 'SCAMMER') {
            const fullText = nextLine.parts.map(p => p.text).join('');
            setChatHistory(prev => [...prev, { type: 'scammer', parts: nextLine.parts, dialogueIdx: nextIdx }]);
            startTyping(fullText);
            setShowingOptions(false);
            if (nextLine.triggerTimer) setIsTimerRunning(true);
            if (nextLine.triggerSms) setIsSmsVisible(true);
            if (nextLine.triggerEndCall) setGameState('final_decision');
        } else if (nextLine.speaker === 'PLAYER') {
            setShowingOptions(true);
            setIsTypingDone(true);
            setTypingTarget('');
        }
    };

    const handleContinue = () => {
        const nextIdx = dialogueIndex + 1;
        if (nextIdx >= dialogueSequence.length) return;
        const nextLine = dialogueSequence[nextIdx];
        if (nextLine.speaker === 'PLAYER') {
            setDialogueIndex(nextIdx);
            setShowingOptions(true);
            setIsTypingDone(true);
            setTypingTarget('');
        } else {
            advanceDialogue();
        }
    };

    const handleOptionClick = (option) => {
        setShowingOptions(false);
        if (!option.isCorrect) {
            if (option.penalty > 0) adjustAssets(-option.penalty);
            setFeedbackMsg(option.penalty > 0 ? `⚠️ Wrong choice! -₹${option.penalty.toLocaleString()}. ${option.feedback}` : `💡 ${option.feedback}`);
            setTimeout(() => setFeedbackMsg(null), 2500);
        }
        setChatHistory(prev => [...prev, { type: 'player', text: option.text }]);
        if (option.scammerReply) {
            setChatHistory(prev => [...prev, { type: 'reply', text: option.scammerReply }]);
            startTyping(option.scammerReply);
        } else {
            advanceDialogue();
        }
    };

    useEffect(() => {
        if (gameState === 'cinematic_call_intro') {
            playSynthSound('cinematic_surge');

            // Random glitch loop
            const glitchInterval = setInterval(() => {
                if (Math.random() > 0.4) playSynthSound('digital_glitch');
            }, 400);

            const timer = setTimeout(() => {
                setGameState('active_call');
            }, 4000); // 4s build-up as previously planned

            return () => {
                clearTimeout(timer);
                clearInterval(glitchInterval);
            };
        }
    }, [gameState]);

    const handleAnswerPhone = () => {
        playSynthSound('acceptance_click');
        setShowCallNotification(false);
        setShowPhoneNoti(false);
        setGameState('cinematic_call_intro');
    };

    const handleGameOver = () => {
        setGameState('game_over');
        adjustAssets(-100000);
    };

    const handleVictory = () => {
        setGameState('victory');
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (gameState === 'calling_1930') {
        const callConversation = callOutcome === 'won' ? [
            { speaker: 'SYSTEM', text: '📞 Connecting to National Cyber Crime Helpline...' },
            { speaker: 'OFFICER', text: 'National Cyber Crime Helpline, this is Officer Sharma. How can I help you?' },
            { speaker: 'YOU', text: 'I just received a suspicious call from someone claiming to be from SBI Bank. They asked me for my OTP.' },
            { speaker: 'OFFICER', text: 'Good that you called us. Did you share the OTP with them?' },
            { speaker: 'YOU', text: 'No, I refused to share it. I identified multiple red flags in their conversation.' },
            { speaker: 'OFFICER', text: 'Excellent awareness! You did the right thing. We will trace this number and add it to our database. Always remember — no bank will ever ask for your OTP over a phone call.' },
            { speaker: 'SYSTEM', text: '✅ Complaint registered successfully. Case ID: CYB-2024-4829' },
            { speaker: 'SYSTEM', text: '🎉 You have completed Level 1: The OTP Trap!' },
        ] : [
            { speaker: 'SYSTEM', text: '📞 Connecting to National Cyber Crime Helpline...' },
            { speaker: 'OFFICER', text: 'National Cyber Crime Helpline, this is Officer Sharma. How can I help you?' },
            { speaker: 'YOU', text: 'I shared my OTP with someone who claimed to be from SBI. I think I\'ve been scammed.' },
            { speaker: 'OFFICER', text: 'I understand this is stressful. We are registering your complaint immediately. Please contact your bank RIGHT NOW and request an emergency freeze on your account.' },
            { speaker: 'OFFICER', text: 'In the future, remember: No bank employee will ever ask for your OTP. If someone does, hang up immediately and call us at 1930.' },
            { speaker: 'SYSTEM', text: '⚠️ Complaint registered. Case ID: CYB-2024-4830' },
            { speaker: 'SYSTEM', text: 'Level 1 complete. Learn from this experience — stay vigilant!' },
        ];

        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950 p-4">
                <div className="w-[380px] h-[750px] bg-zinc-900 border-x-[12px] border-t-[12px] border-b-[24px] border-black rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col items-center">
                    <div className="w-full bg-emerald-900 flex flex-col items-center py-4 rounded-b-3xl shadow-md border-b border-emerald-700">
                        <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center font-bold text-white text-xl mb-2">🛡️</div>
                        <h2 className="text-lg font-bold text-emerald-300 tracking-widest">CYBER CRIME HELPLINE</h2>
                        <p className="text-emerald-400 font-mono text-sm">1930</p>
                    </div>
                    <div className="flex-1 w-full flex flex-col justify-start p-4 pb-20 gap-3 overflow-y-auto custom-scrollbar">
                        {callConversation.map((msg, idx) => {
                            if (idx > callStep) return null;
                            if (msg.speaker === 'SYSTEM') return <div key={idx} className="bg-zinc-800 text-center text-zinc-300 p-3 rounded-xl text-sm border border-zinc-700 font-mono">{msg.text}</div>;
                            if (msg.speaker === 'OFFICER') return <div key={idx} className="bg-emerald-900/50 text-emerald-100 p-4 rounded-2xl rounded-tl-sm w-5/6 shadow-md border border-emerald-700/50"><span className="text-xs text-emerald-400 font-bold mb-1 block">OFFICER SHARMA</span>{msg.text}</div>;
                            if (msg.speaker === 'YOU') return <div key={idx} className="w-full flex justify-end"><div className="bg-blue-600/80 text-white p-3 rounded-2xl rounded-tr-sm w-5/6 text-left shadow-md border border-blue-500/50 text-sm">"{msg.text}"</div></div>;
                            return null;
                        })}
                        {callStep < callConversation.length - 1 ? (
                            <button className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white font-mono text-sm rounded-lg mt-4 shadow-xl transition-colors" onClick={() => setCallStep(prev => prev + 1)}>[ Continue... ]</button>
                        ) : (
                            <button className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 text-white font-bold text-sm rounded-lg mt-4 shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-colors" onClick={() => {
                                setGameState('cinematic_outro');
                                setOutroStep(1);
                                playSynthSound('wood_tap');
                                setTimeout(() => {
                                    setOutroStep(2);
                                    setTimeout(() => {
                                        setOutroStep(3);
                                        setTimeout(() => {
                                            completeLevel(callOutcome === 'won', callOutcome === 'won' ? 500 : 0, callOutcome === 'won' ? 4200000 : 0);
                                        }, 4000);
                                    }, 3000);
                                }, 3500);
                            }}>[ COMPLETE LEVEL ]</button>
                        )}
                        <div ref={(el) => { if (el) el.scrollIntoView({ behavior: 'smooth' }) }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex items-center justify-center bg-zinc-950 overflow-hidden relative">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, #000 40px, #000 80px)' }}></div>
            <div className="text-white font-mono text-[10px] absolute top-8 left-8 opacity-40 uppercase tracking-[0.5em] pointer-events-none">POV_SESSION_01 // LEVEL 1</div>
            <p className="text-red-500 font-bold fixed top-8 right-8 animate-pulse text-xs tracking-widest z-[1000]">
                {isTimerRunning && `⚠️ CALL IN PROGRESS: ${formatTime(timer)}`}
            </p>

            {gameState === 'intro_pov' && (
                <div className="w-full h-full bg-black flex items-center justify-center overflow-hidden relative">
                    <div
                        className="w-full h-full transition-all duration-300"
                        style={{
                            backgroundImage: `url("${isPhotoZoomed ? "/assets/framezoom.png" : showPhoneNoti ? "/assets/phone_noti.png" : "/assets/temppho.png"}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    />

                    {/* Narrative Reflection on Grandpa */}
                    {isPhotoZoomed && (
                        <div className="absolute bottom-20 w-full text-center animate-fadeIn pointer-events-none z-50">
                            <p className="text-white/95 text-2xl font-serif italic tracking-wider drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] px-8">
                                "Why did you leave so early, grandpa?"
                            </p>
                            <div className="mt-4 w-12 h-[2px] bg-white/30 mx-auto" />
                        </div>
                    )}

                    {/* Initial Tutorial Hints */}
                    {!isPhotoZoomed && !showPhoneNoti && (
                        <div className="absolute right-[12%] top-[50%] -translate-y-full flex flex-col items-center pointer-events-none animate-bounce">
                            <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-2xl border border-white/50 text-[#8b5e3c] font-black uppercase tracking-[0.2em] text-[11px] mb-4">
                                Inspect the photo frame
                            </div>
                            <div className="w-1 h-8 bg-gradient-to-b from-white/90 to-transparent shadow-lg" />
                        </div>
                    )}

                    {showPhoneNoti && (
                        <div className="absolute left-[20%] top-[70%] -translate-y-full flex flex-col items-center pointer-events-none animate-bounce">
                            <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-2xl border border-white/50 text-cyan-700 font-black uppercase tracking-[0.2em] text-[11px] mb-4">
                                Inspect the phone
                            </div>
                            <div className="w-1 h-8 bg-gradient-to-b from-white/90 to-transparent shadow-lg" />
                        </div>
                    )}

                    {!isPhotoZoomed && !showPhoneNoti && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsPhotoZoomed(true); playSynthSound('wood_tap'); }}
                            className="absolute right-[12%] top-[60%] w-[12%] h-[28%] bg-white/0 hover:bg-white/10 transition-all cursor-pointer rounded-sm group overflow-hidden"
                            title="Look at photo"
                        >
                            <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/20 transition-all" />
                        </button>
                    )}

                    {/* Restricted Phone Interaction Area (Locked to physical phone on bottom-left) */}
                    {showPhoneNoti && (
                        <button
                            onClick={() => setGameState('phone_intro')}
                            className="absolute left-[21.5%] top-[81%] w-[8.5%] h-[13.5%] bg-white/0 hover:bg-cyan-400/5 transition-all cursor-pointer flex flex-col items-center justify-center -rotate-[15deg] group z-40"
                            title="Open Phone"
                        >
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center rotate-[15deg]">
                                <div className="text-cyan-400 font-mono text-[9px] uppercase tracking-[0.2em] animate-pulse mb-1 whitespace-nowrap drop-shadow-md">Unlock Device</div>
                                <div className="w-6 h-6 rounded-full border border-cyan-400/40 flex items-center justify-center animate-ping">
                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                                </div>
                            </div>
                        </button>
                    )}

                    {showPhoneNoti && <div className="absolute inset-0 bg-cyan-400/5 animate-pulse pointer-events-none" />}
                </div>
            )}

            {gameState === 'phone_intro' && (
                <div className="w-full h-full bg-cover bg-center flex items-center justify-center relative overflow-hidden animate-fadeIn" style={{ backgroundImage: 'url("/assets/phone_noti.png")' }}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

                    {/* Realistic Premium Phone Body */}
                    <div className="w-[320px] h-[640px] bg-[#0a0a0a]/90 border-[6px] border-[#1a1a1a] rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.05)] relative overflow-hidden flex flex-col animate-zoomIn">
                        {/* Dynamic Island / Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-50 flex items-center justify-center p-1">
                            <div className="w-2 h-2 rounded-full bg-zinc-900 border border-zinc-800 ml-auto mr-4" />
                        </div>

                        {/* Status Bar */}
                        <div className="flex justify-between items-center pt-8 pb-4 px-8 text-white text-[11px] font-bold tracking-tight">
                            <span>10:42</span>
                            <div className="flex items-center gap-1.5 opacity-90">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.01 21.49L23.64 7c-.45-.34-4.93-4-11.64-4C5.28 3 .81 6.66.36 7l11.63 14.49.01.01.01-.01z" fillOpacity=".3" /><path d="M4.77 12.5L12.01 21.49l7.24-8.99C18.85 12.24 16.1 10 12.01 10c-4.09 0-6.84 2.24-7.24 2.5z" /></svg>
                                <span className="text-[9px] tracking-tighter">5G</span>
                                <div className="w-5 h-2.5 border border-white/40 rounded-[2px] relative p-[1px]">
                                    <div className="h-full bg-white rounded-[1px] w-[80%]" />
                                    <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-0.5 h-1 bg-white/40 rounded-r-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Lockscreen Clock */}
                        <div className="flex flex-col items-center mt-6 mb-12 animate-fadeIn">
                            <h1 className="text-white text-6xl font-light tracking-tight drop-shadow-lg">10:42</h1>
                            <p className="text-white/80 text-sm font-medium mt-1">Saturday, March 7</p>
                        </div>

                        {/* Notification Center */}
                        <div className="flex-1 px-4 space-y-2.5 overflow-y-auto pb-10 scrollbar-hide" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                            <style dangerouslySetInnerHTML={{ __html: `.scrollbar-hide::-webkit-scrollbar { display: none; }` }} />

                            {showCallNotification && (
                                <div onClick={() => setGameState('phone_calling')} className="mb-2.5 bg-red-600/90 backdrop-blur-xl border border-red-400/30 p-4 rounded-[1.5rem] shadow-lg animate-dropdown-bounce cursor-pointer hover:bg-red-700 transition-all z-20 group relative overflow-hidden ring-2 ring-red-500/20">
                                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-lg bg-white flex items-center justify-center text-[10px] text-red-600 shadow-sm font-bold animate-pulse">
                                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" /></svg>
                                            </div>
                                            <span className="text-white font-black text-[10px] tracking-widest uppercase">Ongoing Call</span>
                                        </div>
                                        <span className="text-white/60 text-[9px] font-bold uppercase tracking-wider animate-pulse">Now</span>
                                    </div>
                                    <h3 className="text-white text-sm font-black tracking-tight">UNKNOWN NUMBER</h3>
                                    <div className="mt-1.5 py-1.5 bg-white/10 rounded-xl text-white text-[9px] font-mono tracking-[0.2em] group-hover:bg-white/20 transition-all border border-white/10 uppercase text-center">[ Swipe to Answer ]</div>
                                </div>
                            )}

                            {[
                                { id: 3, sender: "SecureBank", text: "CREDIT: ₹4,200,000.00 processed. New balance: ₹4,242,000.00", time: "Now", color: "bg-amber-500", important: true },
                                { id: 2, sender: "Cousin Rohan", text: "Yo, I heard about the 42L! That is CRAZY. Grandpa really looked out for you.", time: "1m ago", color: "bg-green-500" },
                                { id: 1, sender: "Aunt Meera", text: "So sorry to hear about Papa. He loved you so much, beta.", time: "2m ago", color: "bg-blue-500" }
                            ].map((n, i) => {
                                const showCount = 3 - i;
                                return showCount <= visibleNotiCount && (
                                    <div key={n.id} className="bg-white/10 backdrop-blur-xl border border-white/10 p-4 rounded-[1.5rem] shadow-xl animate-dropdown-bounce transition-all hover:bg-white/15">
                                        <div className="flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-5 h-5 rounded-lg ${n.color} flex items-center justify-center text-[10px] text-white shadow-sm font-bold`}>
                                                    {n.sender[0]}
                                                </div>
                                                <span className="text-white font-bold text-xs tracking-tight">{n.sender}</span>
                                            </div>
                                            <span className="text-white/40 text-[9px] font-medium uppercase tracking-wider">{n.time}</span>
                                        </div>
                                        <p className={`text-[11px] leading-relaxed ${n.important ? 'text-amber-300 font-semibold' : 'text-white/80'}`}>{n.text}</p>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Home Indicator */}
                        <div className="mt-auto mb-2 flex justify-center w-full">
                            <div className="w-32 h-1.5 bg-white/30 rounded-full" />
                        </div>
                    </div>
                </div>
            )}

            {gameState === 'cinematic_call_intro' && (
                <div className="absolute inset-0 bg-black z-[1000] flex flex-col items-center justify-center animate-cinematic-sequence">
                    <div className="flex flex-col items-center relative">
                        {/* Dramatic pulse rings */}
                        <div className="absolute inset-0 bg-red-500/20 rounded-full blur-3xl animate-ping scale-[2.5] opacity-50" />

                        <div className="h-px w-32 bg-gradient-to-r from-transparent via-red-500 to-transparent mb-8 animate-[width_1.5s_ease-in-out]" />

                        <h2 className="text-white text-6xl font-black tracking-[0.4em] uppercase mb-4 relative opacity-0" style={{ animation: 'fadeIn 1s forwards, surge 3s infinite' }}>
                            <span className="relative z-10">Level 1</span>
                            {/* Chromatic aberration layers */}
                            <span className="absolute inset-0 text-red-500 opacity-60 translate-x-1 -z-10 animate-aberration">Level 1</span>
                            <span className="absolute inset-0 text-cyan-400 opacity-60 -translate-x-1 -z-10 animate-aberration-alt">Level 1</span>
                        </h2>

                        <h3 className="text-red-500 text-lg font-mono tracking-[0.8em] uppercase opacity-0 font-bold" style={{ animation: 'fadeIn 1s forwards 1.2s' }}>
                            The OTP Trap
                        </h3>

                        <div className="h-px w-32 bg-gradient-to-r from-transparent via-red-500 to-transparent mt-12 animate-[width_1.5s_ease-in-out]" />

                        {/* Tension metadata */}
                        <div className="mt-8 text-[8px] font-mono text-zinc-800 tracking-widest uppercase animate-pulse">
                            Initialising Fraud Sequence... [33%] [66%] [99%]
                        </div>
                    </div>
                </div>
            )}

            {gameState === 'phone_calling' && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-cover bg-center text-white p-8 relative animate-fadeIn" style={{ backgroundImage: 'url("/assets/phone_noti.png")' }}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    <div className="w-80 h-[600px] bg-zinc-950/90 border-8 border-zinc-800 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col items-center justify-center p-6 animate-zoomIn">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-2xl"></div>
                        <div className="flex flex-col items-center animate-pulse">
                            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white animate-bounce" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg></div>
                            </div>
                            <h2 className="text-2xl font-bold mb-1 tracking-wider text-red-500">UNKNOWN NUMBER</h2>
                            <p className="text-zinc-500 font-mono text-sm uppercase mb-1">Incoming Call...</p>
                        </div>
                        <div className="absolute bottom-16 flex w-full justify-around px-8">
                            <button className="w-16 h-16 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105" onClick={() => { setFeedbackMsg("They keep calling back... must be important."); setTimeout(() => setFeedbackMsg(null), 2000); }}><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white transform rotate-[135deg]" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg></button>
                            <button className="w-16 h-16 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.6)] transition-transform hover:scale-110 animate-pulse" onClick={handleAnswerPhone}><svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg></button>
                        </div>
                    </div>
                </div>
            )}

            {['active_call', 'scammer_reveal', 'final_decision'].includes(gameState) && (
                <div className="w-full h-full flex items-center justify-center bg-cover bg-center p-4 relative" style={{ backgroundImage: 'url("/assets/phone_noti.png")' }}>
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                    {feedbackMsg && <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-4 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.8)] z-[500] font-bold text-center animate-bounce border-2 border-red-300">{feedbackMsg}</div>}
                    <div className={`w-[380px] h-[750px] bg-zinc-900/95 border-x-[12px] border-t-[12px] border-b-[24px] border-black rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col items-center z-10 transition-transform duration-500 ease-in-out ${isDetectiveModeOpen ? '-translate-x-[250px]' : 'translate-x-0'}`}>
                        <div className="w-full bg-zinc-800 flex flex-col items-center py-4 rounded-b-3xl shadow-md border-b border-zinc-700 z-10">
                            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center font-bold text-white text-xl mb-2">📞</div>
                            <h2 className="text-xl font-bold text-white tracking-widest">UNKNOWN CALLER</h2>
                            <div className="text-green-400 font-mono text-lg animate-pulse">{isTimerRunning ? formatTime(timer) : '00:00'}</div>
                        </div>
                        <div className="flex gap-1 h-12 items-center mt-6">
                            {[...Array(15)].map((_, i) => (
                                <div key={i} className="w-2 bg-blue-500 rounded-full animate-pulse" style={{ height: `${20 + Math.random() * 30}px`, animationDelay: `${i * 0.1}s` }}></div>
                            ))}
                        </div>
                        <div className="flex-1 w-full flex flex-col justify-start p-4 pb-20 gap-3 overflow-y-auto custom-scrollbar">
                            {chatHistory.map((msg, idx) => {
                                const isLast = idx === chatHistory.length - 1;
                                if (msg.type === 'scammer') {
                                    const fullText = msg.parts.map(p => p.text).join('');
                                    return (
                                        <div key={idx} className="bg-zinc-800 text-white p-4 rounded-2xl rounded-tl-sm w-5/6 shadow-md border border-zinc-700">
                                            <span className="text-xs text-blue-400 font-bold mb-1 block">CALLER</span>
                                            {isLast && !isTypingDone ? (<span>{fullText.slice(0, typingProgress)}<span className="inline-block w-1 h-4 bg-white ml-0.5 animate-pulse" /></span>) : (
                                                msg.parts.map((p, i) => (
                                                    p.isDraggable && isLast && isTypingDone ? (
                                                        <span key={i} className="relative inline-block">
                                                            <span draggable onDragStart={(e) => {
                                                                e.dataTransfer.setData('application/json', JSON.stringify({ id: p.clueId, title: p.title, desc: p.desc, isFake: p.isFake }));
                                                                if (!isDetectiveModeOpen) {
                                                                    setIsDetectiveModeOpen(true);
                                                                    playSynthSound('board_opening');
                                                                }
                                                                playSynthSound('clue_drag');
                                                            }} className="cursor-grab border-b-2 border-dashed border-red-500 hover:bg-red-500/20 rounded px-1 text-red-100 transition-colors inline-block animate-pulse">
                                                                {p.text}
                                                            </span>

                                                            {tutorialStep === 1 && (
                                                                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 z-[600] animate-bounce pointer-events-none">
                                                                    <div className="bg-cyan-500 text-white text-[10px] font-bold py-2 p-3 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.5)] border border-cyan-300 relative">
                                                                        <div className="uppercase tracking-[0.1em] mb-1">🔍 Forensic Lead</div>
                                                                        Drag this to the left!
                                                                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-cyan-500 rotate-45 border-r border-b border-cyan-300"></div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </span>
                                                    ) : p.isHighlighted ? <span key={i} className="text-yellow-300 border-b border-yellow-500/50">{p.text}</span> : <span key={i}>{p.text}</span>
                                                ))
                                            )}
                                        </div>
                                    );
                                }
                                if (msg.type === 'player') return <div key={idx} className="w-full flex justify-end"><div className="bg-blue-600/80 text-white p-3 rounded-2xl rounded-tr-sm w-5/6 text-left shadow-md border border-blue-500/50 text-sm">"{msg.text}"</div></div>;
                                if (msg.type === 'reply') return <div key={idx} className="bg-zinc-800 text-white p-4 rounded-2xl rounded-tl-sm w-5/6 shadow-md border border-zinc-700"><span className="text-xs text-blue-400 font-bold mb-1 block">CALLER</span>{isLast && !isTypingDone ? (<span>{msg.text.slice(0, typingProgress)}<span className="inline-block w-1 h-4 bg-white ml-0.5 animate-pulse" /></span>) : <span className="text-white">{msg.text}</span>}</div>;
                                return null;
                            })}
                            {showingOptions && dialogueSequence[dialogueIndex]?.speaker === 'PLAYER' && (
                                <div className="w-full flex flex-col gap-3 mt-4 items-end animate-fadeIn">
                                    <span className="text-xs text-emerald-400 font-bold self-start ml-4 uppercase">Your response:</span>
                                    {dialogueSequence[dialogueIndex].options.map((opt, i) => <button key={i} onClick={() => handleOptionClick(opt)} className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-2xl rounded-tr-sm w-5/6 text-left shadow-xl transition-all border-2 border-blue-400 hover:scale-105 active:scale-95 text-sm">"{opt.text}"</button>)}
                                </div>
                            )}
                            {isTypingDone && !showingOptions && gameState === 'active_call' && (
                                <button className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white font-mono text-sm rounded-lg mt-4 shadow-xl transition-colors" onClick={handleContinue}>[ Continue... ]</button>
                            )}
                            <div ref={(el) => { if (el) el.scrollIntoView({ behavior: 'smooth' }) }} />
                        </div>
                        {isSmsVisible && !isSmsExpanded && (
                            <div className="absolute top-28 left-4 right-4 bg-slate-100 text-slate-900 rounded-2xl p-4 shadow-2xl border border-slate-300 cursor-pointer animate-dropdown z-50 transition-all hover:bg-white" onClick={() => setIsSmsExpanded(true)}>
                                <div className="flex items-center gap-2 mb-1"><span className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-[10px]">M</span><span className="font-bold text-sm">BANK SMS</span></div>
                                <p className="text-xs truncate">Your OTP is 584921 for transaction...</p>
                            </div>
                        )}
                        {isSmsExpanded && (
                            <div className="absolute bottom-0 left-0 w-full h-[55%] bg-slate-100 text-slate-900 rounded-t-3xl p-6 shadow-2xl z-50 flex flex-col border-t-2 border-slate-300 animate-slideUp">
                                <p className="text-lg leading-snug mb-4">Your OTP is <strong className="text-3xl text-blue-600 tracking-widest block mt-2">584921</strong></p>
                                <div className="bg-red-100 border-l-4 border-red-500 p-3 mt-auto mb-4 animate-[pulse_2s_infinite]">
                                    <p draggable onDragStart={(e) => {
                                        e.dataTransfer.setData('application/json', JSON.stringify({ id: 4, title: "The Warning is IN the SMS", desc: "The SMS directly says to NEVER share the OTP with bank officials." }));
                                        if (!isDetectiveModeOpen) {
                                            setIsDetectiveModeOpen(true);
                                            playSynthSound('board_opening');
                                        }
                                        playSynthSound('clue_drag');
                                    }} className="text-xs text-red-700 font-bold uppercase cursor-grab">⚠️ DO NOT SHARE THIS OTP WITH ANYONE, INCLUDING BANK OFFICIALS.</p>
                                </div>
                                <button className="w-full py-3 bg-slate-300 hover:bg-slate-400 font-bold rounded-xl" onClick={() => setIsSmsExpanded(false)}>CLOSE</button>
                            </div>
                        )}

                        {gameState === 'final_decision' && (
                            <div className="absolute inset-0 bg-black/90 z-[100] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                                <h3 className="text-red-500 font-black text-xl mb-6 tracking-widest uppercase">CRITICAL CHOICE</h3>
                                <div className="space-y-4 w-full">
                                    <button
                                        onClick={handleGameOver}
                                        className="w-full p-4 bg-red-900/40 hover:bg-red-900/60 border-2 border-red-500 text-white rounded-2xl transition-all font-bold"
                                    >
                                        Share the OTP
                                        <p className="text-[10px] text-red-300 font-normal mt-1 opacity-70 italic">"Here is the number: 584921..."</p>
                                    </button>
                                    <button
                                        onClick={handleVictory}
                                        className="w-full p-4 bg-emerald-900/40 hover:bg-emerald-900/60 border-2 border-emerald-500 text-white rounded-2xl transition-all font-bold"
                                    >
                                        Hang Up
                                        <p className="text-[10px] text-emerald-300 font-normal mt-1 opacity-70 italic">Disconnect from the call immediately.</p>
                                    </button>
                                </div>
                            </div>
                        )}
                        <button className="absolute bottom-6 left-6 w-14 h-14 bg-amber-500 rounded-full flex items-center justify-center shadow-lg border-2 border-amber-300 z-50 text-2xl" onClick={() => {
                            if (!isDetectiveModeOpen) playSynthSound('board_opening');
                            setIsDetectiveModeOpen(!isDetectiveModeOpen);
                        }}>🔍</button>
                    </div>

                    {isDetectiveModeOpen && (
                        <div className="absolute inset-y-12 right-12 w-[680px] bg-stone-200 rounded-lg shadow-2xl z-[200] p-10 flex flex-col border-[20px] border-[#4a2e1a] overflow-hidden" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23a)' opacity='.2'/%3E%3C/svg%3E")`, backgroundColor: '#dcc6a0' }} onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
                            e.preventDefault(); try {
                                const data = JSON.parse(e.dataTransfer.getData('application/json'));
                                if (data.isFake) { adjustAssets(-1000); setFeedbackMsg("Invalid Clue!"); setTimeout(() => setFeedbackMsg(null), 2000); }
                                else if (!clues.find(c => c.id === data.id) && clues.length < 6) {
                                    setClues(prev => [...prev, data]);
                                    playSynthSound('clue_pin');
                                    if (tutorialStep === 1) {
                                        setTutorialStep(2);
                                    }
                                }
                            } catch (err) { }
                        }}>
                            <div className="flex justify-between items-center mb-8 z-10 bg-white/90 backdrop-blur-sm p-4 rounded shadow-lg border-b-4 border-stone-400 self-stretch"><h2 className="text-2xl font-black text-stone-800 uppercase tracking-[0.2em] font-mono">🔍 Digital Evidence Wall</h2><button className="text-red-600 hover:text-red-700 font-black text-2xl transition-colors" onClick={() => setIsDetectiveModeOpen(false)}>✖</button></div>

                            {tutorialStep === 2 && (
                                <div className="absolute top-24 left-1/2 -translate-x-1/2 w-80 bg-stone-900/95 text-white p-6 rounded-lg shadow-2xl border-2 border-amber-500 z-[300] animate-fadeIn">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-stone-900 font-black">!</div>
                                        <h4 className="text-amber-500 font-black uppercase tracking-widest text-sm">Forensic Discovery</h4>
                                    </div>
                                    <p className="text-stone-300 text-xs leading-relaxed mb-6">
                                        Great work! These kind of <span className="text-red-500 font-bold">red lines</span> are clues which we can use to know if it is a scam or not.
                                    </p>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setTutorialStep(0);
                                            setHasSeenClueTutorial(true);
                                        }}
                                        className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold rounded shadow-lg transition-colors text-xs uppercase"
                                    >
                                        Got it
                                    </button>
                                </div>
                            )}
                            {/* 2x3 Grid Layout */}
                            <div className="flex-1 grid grid-cols-2 grid-rows-3 gap-6 relative p-4">
                                {[0, 1, 2, 3, 4, 5].map((idx) => {
                                    const clue = clues[idx];
                                    return (
                                        <div key={idx} className="relative border-4 border-dashed border-stone-400/30 rounded-xl bg-stone-300/20 shadow-inner flex flex-col items-center justify-center group overflow-hidden transition-all hover:bg-stone-300/40">
                                            {!clue ? (
                                                <div className="text-stone-400 font-mono text-[10px] uppercase tracking-widest animate-pulse font-bold">
                                                    Slot 0{idx + 1} Empty
                                                </div>
                                            ) : (
                                                <div className="w-full h-full p-4 bg-white/95 shadow-xl border-l-4 border-red-600 flex flex-col animate-pin-bounce">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-2 h-2 rounded-full bg-red-600" />
                                                        <h3 className="text-[12px] font-black uppercase text-red-700 leading-tight">{clue.title}</h3>
                                                    </div>
                                                    <p className="text-[10px] text-stone-700 leading-relaxed font-medium mb-3 italic">"{clue.desc}"</p>

                                                    {/* Decorative string connection effects */}
                                                    <div className="mt-auto pt-2 border-t border-stone-100 flex justify-between items-center">
                                                        <span className="text-[8px] text-stone-400 font-mono uppercase tracking-tighter">Verified Clue</span>
                                                        <div className="flex gap-0.5">
                                                            <div className="w-1 h-1 rounded-full bg-amber-500" />
                                                            <div className="w-3 h-1 rounded-full bg-amber-500/20" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Decorative Corner Tabs */}
                                            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-stone-400/50" />
                                            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-stone-400/50" />
                                            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-stone-400/50" />
                                            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-stone-400/50" />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {gameState === 'cinematic_outro' && (
                <div className="absolute inset-0 z-[2000] overflow-hidden bg-black">
                    {outroStep === 1 && (
                        <div className="w-full h-full bg-cover bg-center animate-fieldZoom relative" style={{ backgroundImage: 'url("/assets/framezoom.png")' }}>
                            <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />
                            <div className="absolute bottom-24 w-full text-center animate-fadeInSlow">
                                <p className="text-white text-4xl font-serif italic tracking-wide drop-shadow-[0_0_20px_rgba(255,255,255,0.4)] px-16 leading-relaxed">
                                    "Is this who you warned me about, grandpa?"
                                </p>
                                <div className="mt-8 w-32 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent mx-auto animate-shimmerWidth" />
                            </div>
                        </div>
                    )}

                    {(outroStep === 2 || outroStep === 3) && (
                        <div className="w-full h-full bg-stone-950 flex flex-col items-center justify-center animate-fadeIn relative overflow-hidden">
                            {/* Scanning line effects */}
                            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%]" />
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-cyan-500/5 to-transparent animate-scanLine pointer-events-none" />

                            <div className="relative group text-center">
                                <div className="absolute -inset-10 bg-white/5 blur-3xl rounded-full" />
                                <h2 className="text-white text-6xl font-black tracking-[0.5em] uppercase mb-12 relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                                    Level 1: The OTP Trap
                                    {outroStep === 3 && callOutcome === 'won' && (
                                        <div className="absolute top-1/2 left-[-10%] w-[120%] h-3 bg-red-600/90 -translate-y-1/2 animate-strikeThrough shadow-[0_0_25px_rgba(220,38,38,1)] z-20 skew-y-[-1deg]" />
                                    )}
                                </h2>

                                {outroStep === 3 && (
                                    <div className={`mt-12 text-8xl font-black italic tracking-[0.2em] uppercase animate-surge relative ${callOutcome === 'won' ? 'text-emerald-500' : 'text-red-600'}`}>
                                        <span className="relative z-10">{callOutcome === 'won' ? 'COMPLETED' : 'FAILED'}</span>
                                        {/* Chromatic aberration for text */}
                                        <span className={`absolute inset-0 opacity-40 translate-x-1 animate-aberration ${callOutcome === 'won' ? 'text-cyan-400' : 'text-red-400'}`}>{callOutcome === 'won' ? 'COMPLETED' : 'FAILED'}</span>
                                        <span className={`absolute inset-0 opacity-40 -translate-x-1 animate-aberration-alt ${callOutcome === 'won' ? 'text-emerald-300' : 'text-orange-600'}`}>{callOutcome === 'won' ? 'COMPLETED' : 'FAILED'}</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-20 flex flex-col items-center gap-4">
                                <div className="h-px w-80 bg-gradient-to-r from-transparent via-zinc-700 to-transparent" />
                                <div className="text-[11px] font-mono text-zinc-500 tracking-[0.8em] uppercase opacity-60 animate-pulse">
                                    Digital Forensics Session // {callOutcome === 'won' ? 'STATUS_CLEARED' : 'STATUS_COMPROMISED'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {gameState === 'game_over' && (
                <div className="absolute inset-0 bg-red-950/40 z-[500] backdrop-blur-xl text-white flex flex-col items-center justify-center p-12 text-center animate-fadeIn">
                    <div className="max-w-3xl bg-black/60 border border-red-500/30 p-16 rounded-[2rem] shadow-[0_0_100px_rgba(220,38,38,0.2)] relative overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.4)_0%,transparent_70%)]" />

                        <div className="w-24 h-24 bg-red-600/20 border-2 border-red-500 rounded-full flex items-center justify-center mb-10 mx-auto shadow-[0_0_30px_rgba(220,38,38,0.4)] animate-pulse">
                            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>

                        <h1 className="text-7xl font-black text-red-500 tracking-[0.2em] mb-6 uppercase drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">Critical Breach</h1>
                        <p className="text-xl text-red-200/80 max-w-xl mx-auto mb-16 leading-relaxed font-medium">The OTP was compromised. Grandpa's legacy fund has been completely drained by a coordinated transfer.</p>

                        <button
                            className="group relative px-12 py-6 bg-red-600 hover:bg-red-500 text-white font-black tracking-[0.3em] uppercase rounded-xl shadow-2xl transition-all hover:scale-105 active:scale-95"
                            onClick={() => { setGameState('calling_1930'); setCallOutcome('lost'); }}
                        >
                            <span className="relative z-10">Emergency: Call 1930</span>
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                        </button>
                    </div>
                </div>
            )}

            {gameState === 'victory' && (
                <div className="absolute inset-0 bg-emerald-950/40 z-[500] backdrop-blur-xl text-white flex flex-col items-center justify-center p-12 text-center animate-fadeIn">
                    <div className="max-w-3xl bg-black/60 border border-emerald-500/30 p-16 rounded-[2rem] shadow-[0_0_100px_rgba(16,185,129,0.2)] relative overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.4)_0%,transparent_70%)]" />

                        <div className="w-24 h-24 bg-emerald-600/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mb-10 mx-auto shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                            <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                        </div>

                        <h1 className="text-7xl font-black text-emerald-400 tracking-[0.2em] mb-6 uppercase drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">Case Closed</h1>
                        <p className="text-xl text-emerald-200/80 max-w-xl mx-auto mb-16 leading-relaxed font-medium">You identified the scam and secured the assets. Grandpa would be proud of your digital vigilance.</p>

                        <button
                            className="group relative px-12 py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black tracking-[0.3em] uppercase rounded-xl shadow-2xl transition-all hover:scale-105 active:scale-95"
                            onClick={() => { setGameState('calling_1930'); setCallOutcome('won'); }}
                        >
                            <span className="relative z-10">Formal Report: 1930</span>
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
                        </button>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes wiggle { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
                @keyframes dropdown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeInDelay { 0%, 50% { opacity: 0; } 100% { opacity: 1; } }
                @keyframes zoomIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                @keyframes width { from { width: 0; opacity: 0; } to { width: 8rem; opacity: 0.8; } }
                @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes scanLine { from { transform: translateY(-100%); } to { transform: translateY(200%); } }
                @keyframes fieldZoom { from { transform: scale(1); } to { transform: scale(1.1); } }
                @keyframes shimmerWidth { from { width: 0; } to { width: 8rem; } }
                @keyframes strikeThrough { from { width: 0; } to { width: 120%; } }
                @keyframes surge {
                    0%, 100% { transform: scale(1); filter: brightness(1); }
                    50% { transform: scale(1.08) filter: brightness(1.3) drop-shadow(0 0 40px rgba(255,255,255,0.4)); }
                }
                @keyframes fadeInSlow { from { opacity: 0; } 30% { opacity: 1; } to { opacity: 1; } }
                @keyframes pin-bounce {
                    0% { transform: scale(0.5) translateY(-20px); opacity: 0; }
                    60% { transform: scale(1.1) translateY(5px); opacity: 1; }
                    100% { transform: scale(1) translateY(0); opacity: 1; }
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
                @keyframes cinematic-sequence {
                    0% { opacity: 0; }
                    15% { opacity: 1; }
                    85% { opacity: 1; }
                    100% { opacity: 0; }
                }
            ` }} />
        </div>
    );
};

export default Level1;
