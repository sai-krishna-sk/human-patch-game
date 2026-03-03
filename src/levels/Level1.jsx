import React, { useState, useEffect, useRef } from 'react';
import Player from '../components/Player';
import { useGameState } from '../context/GameStateContext';

const ROOM_WIDTH = 1600;
const ROOM_HEIGHT = 1100;
const VIEWPORT_WIDTH = 1200;
const VIEWPORT_HEIGHT = 800;
const SPEED = 15;
const PLAYER_SIZE = 40;

const PHONE_DESK = { x: 600, y: 400, w: 400, h: 350 };

const checkCollision = (px, py, rect) => {
    return (
        px < rect.x + rect.w &&
        px + PLAYER_SIZE > rect.x &&
        py < rect.y + rect.h &&
        py + PLAYER_SIZE > rect.y
    );
};

const Level1 = () => {
    const { assets, completeLevel, adjustAssets } = useGameState();
    const [playerPos, setPlayerPos] = useState({ x: 780, y: 750 });
    const [keys, setKeys] = useState({});

    // STATE MACHINE: ringing → phone_ui → active_call → final_decision → game_over/victory → post_call → dialer → calling_1930 → level_complete
    const [gameState, setGameState] = useState('ringing');
    const [canInteract, setCanInteract] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState(null);
    const [dialerInput, setDialerInput] = useState('');
    const [callStep, setCallStep] = useState(0); // step in the 1930 call conversation
    const [callOutcome, setCallOutcome] = useState(null); // 'won' or 'lost' — determines what 1930 says

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

    // INTERACTIVE DIALOGUE SEQUENCE
    // 7 draggable clues + clue 4 from SMS
    // Other suspicious phrases are highlighted (yellow) but NOT draggable
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

    // Start typing a new message
    const startTyping = (fullText) => {
        setTypingTarget(fullText);
        setTypingProgress(0);
        setIsTypingDone(false);
    };

    // Typing animation effect
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

    // Push first scammer message on mount
    useEffect(() => {
        const firstLine = dialogueSequence[0];
        const fullText = firstLine.parts.map(p => p.text).join('');
        setChatHistory([{ type: 'scammer', parts: firstLine.parts, dialogueIdx: 0 }]);
        startTyping(fullText);
    }, []);

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
        if (gameState !== 'ringing' && gameState !== 'walk' && gameState !== 'post_call') return;

        let animationFrameId;

        const gameLoop = () => {
            setPlayerPos(prev => {
                let newX = prev.x;
                let newY = prev.y;

                if (keys['w'] || keys['arrowup']) newY -= SPEED;
                if (keys['s'] || keys['arrowdown']) newY += SPEED;
                if (keys['a'] || keys['arrowleft']) newX -= SPEED;
                if (keys['d'] || keys['arrowright']) newX += SPEED;

                // Boundaries of the room
                newX = Math.max(0, Math.min(newX, ROOM_WIDTH - PLAYER_SIZE));
                newY = Math.max(0, Math.min(newY, ROOM_HEIGHT - PLAYER_SIZE));

                // Desk Collisions (L-Shape split)
                const deskParts = [
                    { x: PHONE_DESK.x, y: PHONE_DESK.y, w: PHONE_DESK.w, h: 140 }, // Main Board
                    { x: PHONE_DESK.x, y: PHONE_DESK.y + 140, w: 140, h: 210 }    // L-Return
                ];

                for (const rect of deskParts) {
                    if (checkCollision(newX, newY, rect)) {
                        if (prev.x + PLAYER_SIZE <= rect.x || prev.x >= rect.x + rect.w) newX = prev.x;
                        if (prev.y + PLAYER_SIZE <= rect.y || prev.y >= rect.y + rect.h) newY = prev.y;
                    }
                }

                const interactArea = { x: PHONE_DESK.x - 40, y: PHONE_DESK.y - 40, w: PHONE_DESK.w + 80, h: PHONE_DESK.h + 80 };
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
        if (keys['e'] && canInteract && gameState === 'ringing') {
            setGameState('phone_ui');
        }
        if (keys['e'] && canInteract && gameState === 'post_call') {
            setDialerInput('');
            setGameState('dialer');
        }
    }, [keys, canInteract, gameState]);

    // Timer Logic
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

    // Advance to the next dialogue line (scammer lines only)
    const advanceDialogue = () => {
        const nextIdx = dialogueIndex + 1;
        if (nextIdx >= dialogueSequence.length) return;

        const nextLine = dialogueSequence[nextIdx];
        setDialogueIndex(nextIdx);

        if (nextLine.speaker === 'SCAMMER') {
            // Push scammer message and start typing
            const fullText = nextLine.parts.map(p => p.text).join('');
            setChatHistory(prev => [...prev, { type: 'scammer', parts: nextLine.parts, dialogueIdx: nextIdx }]);
            startTyping(fullText);
            setShowingOptions(false);

            if (nextLine.triggerTimer) setIsTimerRunning(true);
            if (nextLine.triggerSms) setIsSmsVisible(true);
            if (nextLine.triggerEndCall) {
                setGameState('final_decision');
            }
        } else if (nextLine.speaker === 'PLAYER') {
            // Show player options (no typing needed)
            setShowingOptions(true);
            setIsTypingDone(true);
            setTypingTarget('');
        }
    };

    // Handle Continue button click (after scammer message or custom reply)
    const handleContinue = () => {
        const nextIdx = dialogueIndex + 1;
        if (nextIdx >= dialogueSequence.length) return;

        const nextLine = dialogueSequence[nextIdx];

        if (nextLine.speaker === 'PLAYER') {
            // Next is player options — show them
            setDialogueIndex(nextIdx);
            setShowingOptions(true);
            setIsTypingDone(true);
            setTypingTarget('');
        } else {
            // Next is another scammer line — advance normally
            advanceDialogue();
        }
    };

    // Handle player option click
    const handleOptionClick = (option) => {
        setShowingOptions(false);

        // Penalty for wrong choices
        if (!option.isCorrect) {
            if (option.penalty > 0) adjustAssets(-option.penalty);
            setFeedbackMsg(option.penalty > 0
                ? `⚠️ Wrong choice! -₹${option.penalty.toLocaleString()}. ${option.feedback}`
                : `💡 ${option.feedback}`);
            setTimeout(() => setFeedbackMsg(null), 2500);
        }

        // Push the player's chosen text into chat history
        setChatHistory(prev => [...prev, { type: 'player', text: option.text }]);

        // If there's a branching scammer reply, push it and type it
        if (option.scammerReply) {
            setChatHistory(prev => [...prev, { type: 'reply', text: option.scammerReply }]);
            startTyping(option.scammerReply);
        } else {
            // No reply — just advance
            advanceDialogue();
        }
    };

    const handleAnswerPhone = () => {
        setGameState('active_call');
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

    if (gameState === 'phone_ui') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-black/90 text-white p-8 relative">
                <div className="w-80 h-[600px] bg-zinc-950 border-8 border-zinc-800 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col items-center justify-center p-6">
                    {/* Notch */}
                    <div className="absolute top-0 w-32 h-6 bg-zinc-800 rounded-b-2xl"></div>

                    <div className="flex flex-col items-center animate-pulse">
                        <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white animate-bounce" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-1 tracking-wider text-red-500">UNKNOWN NUMBER</h2>
                        <p className="text-zinc-500 font-mono text-sm">+91 9XXXX XXXXX</p>
                    </div>

                    <div className="absolute bottom-16 flex w-full justify-around px-8">
                        <button className="w-16 h-16 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105" onClick={() => setGameState('ringing')}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white transform rotate-[135deg]" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                        </button>
                        <button
                            className="w-16 h-16 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.6)] transition-transform hover:scale-110 animate-pulse"
                            onClick={handleAnswerPhone}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (['active_call', 'scammer_reveal', 'final_decision'].includes(gameState)) {

        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950 p-4 relative">

                {feedbackMsg && (
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-4 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.8)] z-[500] font-bold text-center animate-bounce border-2 border-red-300">
                        {feedbackMsg}
                    </div>
                )}

                {/* The Main Phone Sim UI */}
                <div className={`w-[380px] h-[750px] bg-zinc-900 border-x-[12px] border-t-[12px] border-b-[24px] border-black rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col items-center z-10 transition-transform duration-500 ease-in-out ${isDetectiveModeOpen ? '-translate-x-[250px]' : 'translate-x-0'}`}>

                    {/* Header */}
                    <div className="w-full bg-zinc-800 flex flex-col items-center py-4 rounded-b-3xl shadow-md border-b border-zinc-700 z-10">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center font-bold text-white text-xl mb-2">📞</div>
                        <h2 className="text-xl font-bold text-white tracking-widest">UNKNOWN CALLER</h2>
                        <div className="text-green-400 font-mono text-lg animate-pulse">{isTimerRunning ? formatTime(timer) : '00:00'}</div>
                    </div>

                    {/* Audio Waveform */}
                    <div className="flex gap-1 h-12 items-center mt-6">
                        {[...Array(15)].map((_, i) => (
                            <div key={i} className={`w-2 bg-blue-500 rounded-full animate-pulse`} style={{ height: `${20 + Math.random() * 30}px`, animationDelay: `${i * 0.1}s` }}></div>
                        ))}
                    </div>

                    {/* Dialogue Feed — renders from chatHistory */}
                    <div className="flex-1 w-full flex flex-col justify-start p-4 pb-20 gap-3 overflow-y-auto custom-scrollbar">
                        {chatHistory.map((msg, idx) => {
                            const isLast = idx === chatHistory.length - 1;

                            // SCAMMER MESSAGE
                            if (msg.type === 'scammer') {
                                const fullText = msg.parts.map(p => p.text).join('');
                                return (
                                    <div key={idx} className="bg-zinc-800 text-white p-4 rounded-2xl rounded-tl-sm w-5/6 shadow-md border border-zinc-700">
                                        <span className="text-xs text-blue-400 font-bold mb-1 block">CALLER</span>
                                        {isLast && !isTypingDone ? (
                                            <span className="text-white">
                                                {fullText.slice(0, typingProgress)}
                                                <span className="inline-block w-1 h-4 bg-white ml-0.5 animate-pulse" />
                                            </span>
                                        ) : (
                                            msg.parts.map((p, i) => {
                                                if (p.isDraggable && isLast && isTypingDone) {
                                                    return (
                                                        <span
                                                            key={i}
                                                            draggable
                                                            onDragStart={(e) => {
                                                                e.dataTransfer.setData('application/json', JSON.stringify({ id: p.clueId, title: p.title, desc: p.desc, isFake: p.isFake }));
                                                                setIsDetectiveModeOpen(true);
                                                            }}
                                                            className="cursor-grab border-b-2 border-dashed border-red-500 hover:bg-red-500/20 rounded px-1 text-red-100 transition-colors inline-block animate-pulse"
                                                        >
                                                            {p.text}
                                                        </span>
                                                    );
                                                }
                                                if (p.isDraggable && !isLast) {
                                                    return <span key={i} className="text-red-200/50">{p.text}</span>;
                                                }
                                                if (p.isHighlighted) {
                                                    return <span key={i} className="text-yellow-300 border-b border-yellow-500/50">{p.text}</span>;
                                                }
                                                return <span key={i}>{p.text}</span>;
                                            })
                                        )}
                                    </div>
                                );
                            }

                            // PLAYER'S CHOSEN RESPONSE (past)
                            if (msg.type === 'player') {
                                return (
                                    <div key={idx} className="w-full flex justify-end">
                                        <div className="bg-blue-600/80 text-white p-3 rounded-2xl rounded-tr-sm w-5/6 text-left shadow-md border border-blue-500/50 text-sm">
                                            "{msg.text}"
                                        </div>
                                    </div>
                                );
                            }

                            // SCAMMER BRANCHING REPLY (same style as normal scammer messages)
                            if (msg.type === 'reply') {
                                return (
                                    <div key={idx} className="bg-zinc-800 text-white p-4 rounded-2xl rounded-tl-sm w-5/6 shadow-md border border-zinc-700">
                                        <span className="text-xs text-blue-400 font-bold mb-1 block">CALLER</span>
                                        {isLast && !isTypingDone ? (
                                            <span className="text-white">
                                                {msg.text.slice(0, typingProgress)}
                                                <span className="inline-block w-1 h-4 bg-white ml-0.5 animate-pulse" />
                                            </span>
                                        ) : (
                                            <span className="text-white">{msg.text}</span>
                                        )}
                                    </div>
                                );
                            }

                            return null;
                        })}

                        {/* PLAYER OPTIONS — show when it's a player turn */}
                        {showingOptions && dialogueSequence[dialogueIndex]?.speaker === 'PLAYER' && (
                            <div className="w-full flex flex-col gap-3 mt-4 items-end animate-fadeIn">
                                <span className="text-xs text-emerald-400 font-bold self-start ml-4 uppercase">Your response:</span>
                                {dialogueSequence[dialogueIndex].options.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleOptionClick(opt)}
                                        className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-2xl rounded-tr-sm w-5/6 text-left shadow-xl transition-all border-2 border-blue-400 hover:scale-105 active:scale-95 text-sm"
                                    >
                                        "{opt.text}"
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* CONTINUE BUTTON — after any scammer/reply message finishes typing */}
                        {isTypingDone && !showingOptions && gameState === 'active_call' && (
                            <button
                                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white font-mono text-sm rounded-lg mt-4 shadow-xl transition-colors"
                                onClick={handleContinue}
                            >
                                [ Continue... ]
                            </button>
                        )}

                        {/* Auto scroll anchor */}
                        {<div ref={(el) => { el?.scrollIntoView({ behavior: 'smooth' }) }} />}
                    </div>

                    {/* SMS Dropdown Simulation (Half-screen) */}
                    {isSmsVisible && !isSmsExpanded && (
                        <div
                            className="absolute top-28 left-4 right-4 bg-slate-100 text-slate-900 rounded-2xl p-4 shadow-[0_20px_40px_rgba(0,0,0,0.8)] border border-slate-300 cursor-pointer animate-dropdown z-50 hover:bg-white"
                            onClick={() => {
                                setIsSmsExpanded(true);
                                setClues(prev => [...prev, { id: 4, title: "The Warning is IN the SMS", desc: "The SMS directly says to NEVER share the OTP with bank officials." }]);
                            }}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <span className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-bold">M</span>
                                <span className="font-bold text-sm">SBI MESSAGES</span>
                                <span className="text-xs text-slate-500 ml-auto">now</span>
                            </div>
                            <p className="text-sm font-semibold truncate leading-tight">Your OTP is 584921 for transaction...</p>
                            <p className="text-xs text-blue-600 mt-2 font-bold text-center uppercase tracking-widest">[ Tap to expand message ]</p>
                        </div>
                    )}

                    {/* SMS Expanded View */}
                    {isSmsExpanded && (
                        <div className="absolute bottom-0 left-0 w-full h-[55%] bg-slate-100 text-slate-900 rounded-t-3xl p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] z-50 flex flex-col border-t-2 border-slate-300 animate-[slideUp_0.3s_ease-out]">
                            <div className="w-12 h-1 bg-slate-300 rounded-full self-center mb-6"></div>
                            <p className="text-sm mb-4"><strong>From:</strong> BO-SBI</p>
                            <p className="text-lg leading-snug mb-4">Your OTP is <strong className="text-3xl text-blue-600 tracking-widest block mt-2 mb-2">584921</strong> for transaction verification. Valid for 10 mins.</p>

                            <div className="bg-red-100 border-l-4 border-red-500 p-3 mt-auto mb-4 animate-[pulse_2s_infinite]">
                                <p
                                    className="text-sm text-red-700 font-bold uppercase cursor-grab hover:bg-yellow-200 rounded p-1 transition-colors"
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('application/json', JSON.stringify({ id: 4, title: "The Warning is IN the SMS", desc: "The SMS directly says to NEVER share the OTP with bank officials." }));
                                        setIsDetectiveModeOpen(true);
                                    }}
                                >
                                    ⚠️ DO NOT SHARE THIS OTP WITH ANYONE, INCLUDING BANK OFFICIALS. SBI NEVER ASKS FOR OTP.
                                </p>
                            </div>

                            <button
                                className="w-full py-3 bg-slate-300 hover:bg-slate-400 font-bold rounded-xl transition-colors"
                                onClick={() => setIsSmsExpanded(false)}
                            >
                                CLOSE MESSAGE
                            </button>
                        </div>
                    )}

                    {/* Detective Mode Button */}
                    <button
                        className="absolute bottom-6 left-6 w-14 h-14 bg-amber-500 hover:bg-amber-400 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.6)] border-2 border-amber-300 z-50 text-2xl"
                        onClick={() => setIsDetectiveModeOpen(!isDetectiveModeOpen)}
                    >
                        🔍
                        {clues.length > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold w-6 h-6 rounded-full flex justify-center items-center">{clues.length}</span>}
                    </button>
                    <div className="absolute bottom-1 left-4 font-mono text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Detective Mode</div>

                </div> {/* END PHONE UI */}

                {/* SCAMMER REVEAL SPLIT SCREEN OVERLAY */}
                {gameState === 'scammer_reveal' && (
                    <div className="absolute inset-0 z-[100] bg-black/90 flex flex-col justify-center items-center p-12 backdrop-blur-md animate-fadeIn">
                        <div className="flex gap-12 w-full max-w-5xl">
                            {/* Player Phone Side */}
                            <div className="flex-1 border-2 border-zinc-700 bg-zinc-900 rounded-xl p-8 flex flex-col items-center">
                                <h3 className="text-cyan-400 font-mono tracking-widest mb-6">WHAT YOU SEE</h3>
                                <div className="text-4xl text-white font-bold tracking-widest">OTP: <span className="text-green-400">584921</span></div>
                                <p className="text-zinc-400 text-center mt-6">You are holding the key that unlocks the door.</p>
                            </div>
                            {/* Scammer PC Side */}
                            <div className="flex-1 border-2 border-red-900 bg-red-950/20 rounded-xl p-8 flex flex-col items-center shadow-[0_0_50px_rgba(239,68,68,0.2)]">
                                <h3 className="text-red-500 font-mono tracking-widest mb-6">WHAT HE SEES</h3>
                                <div className="w-full h-32 bg-white rounded border-4 border-slate-300 p-4 relative overflow-hidden">
                                    <div className="w-full h-4 bg-blue-600 mb-2"></div>
                                    <div className="w-3/4 h-2 bg-slate-300 mb-1"></div>
                                    <div className="w-1/2 h-2 bg-slate-300 mb-4"></div>
                                    <div className="text-black font-bold text-xs uppercase mb-1">Enter OTP to Authenticate Transfer: ₹4,50,000</div>
                                    <div className="w-32 h-8 border-2 border-red-500 bg-red-50 animate-pulse flex items-center px-2">_ _ _ _ _ _</div>
                                </div>
                                <p className="text-red-300 text-center mt-6">He is on the login page right now. He needs YOU to give him the keys.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* DETECTIVE BOARD OVERLAY */}
                {isDetectiveModeOpen && (
                    <div
                        className="absolute inset-y-8 right-8 w-[600px] bg-amber-100 rounded-lg shadow-[-20px_0_50px_rgba(0,0,0,0.8)] z-[200] p-8 flex flex-col border-[16px] border-[#5c3a21] animate-[slideLeft_0.3s_ease-out] overflow-hidden"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23a)' opacity='.2'/%3E%3C/svg%3E")`,
                            backgroundColor: '#e6c280'
                        }}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                        onDrop={(e) => {
                            e.preventDefault();
                            try {
                                const data = e.dataTransfer.getData('application/json');
                                if (data) {
                                    const parsedClue = JSON.parse(data);
                                    if (parsedClue.isFake) {
                                        adjustAssets(-1000);
                                        setFeedbackMsg("Invalid Clue! That's just a normal conversational phrase. Penalty: -₹1,000");
                                        setTimeout(() => setFeedbackMsg(null), 3000);
                                    } else if (!clues.find(c => c.id === parsedClue.id)) {
                                        // Valid clue! Calculate grid-based position to prevent stacking
                                        const gridPositions = [
                                            { x: 140, y: 160 },
                                            { x: 380, y: 200 },
                                            { x: 150, y: 380 },
                                            { x: 380, y: 400 },
                                            { x: 260, y: 550 },
                                            { x: 200, y: 280 }
                                        ];
                                        const pos = gridPositions[clues.length % gridPositions.length];
                                        const x = pos.x + (Math.random() * 40 - 20); // Add a tiny bit of random scatter
                                        const y = pos.y + (Math.random() * 40 - 20);
                                        setClues(prev => [...prev, { ...parsedClue, x, y }]);
                                    }
                                }
                            } catch (err) { }
                        }}
                    >
                        {/* Draw Red Strings Between Clues */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                            {clues.map((clue, idx) => {
                                if (idx > 0) {
                                    const prev = clues[idx - 1];
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
                            <button className="text-red-600 hover:text-red-800 font-black text-2xl ml-6" onClick={() => setIsDetectiveModeOpen(false)}>✖</button>
                        </div>

                        {/* Clue Polaroids */}
                        {clues.map((clue, idx) => (
                            <div
                                key={idx}
                                className="absolute bg-yellow-50 p-4 shadow-xl w-48 border border-yellow-200 z-10 flex flex-col"
                                style={{
                                    left: clue.x - 96,
                                    top: clue.y - 48,
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
                                <p className="text-xs text-stone-700 font-mono leading-tight">{clue.desc}</p>
                            </div>
                        ))}

                        {clues.length === 0 && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-stone-700/50 text-center font-mono font-bold text-2xl rotate-[-5deg] border-4 border-dashed border-stone-700/30 p-8 rounded-xl z-0 pointer-events-none">
                                DRAG SUSPECTED CLUES<br />HERE TO PIN THEM.
                            </div>
                        )}

                        {/* Footer Suspicion Meter */}
                        <div className="absolute bottom-6 left-6 right-6 bg-zinc-900 rounded-xl p-4 shadow-[0_10px_20px_rgba(0,0,0,0.8)] z-10 border-2 border-zinc-700">
                            <h3 className="text-xs text-zinc-400 uppercase font-mono mb-2 flex justify-between">
                                <span>Threat Intelligence Meter</span>
                                <span style={{ color: clues.length > 3 ? '#ef4444' : clues.length > 1 ? '#eab308' : '#22c55e' }}>{clues.length}/5 CLUES</span>
                            </h3>
                            <div className="w-full h-4 bg-zinc-950 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className="h-full transition-all duration-500"
                                    style={{
                                        width: `${(clues.length / 5) * 100}%`,
                                        backgroundColor: clues.length > 3 ? '#ef4444' : clues.length > 1 ? '#eab308' : '#22c55e'
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* FINAL DECISION OVERLAY */}
                {gameState === 'final_decision' && (
                    <div className="absolute inset-x-8 bottom-8 h-80 bg-black/95 border-t-4 border-red-600 rounded-t-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.9)] z-[300] p-10 flex flex-col justify-between animate-[slideUp_0.5s_ease-out]">
                        <div className="text-center">
                            <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-widest drop-shadow-md">CRITICAL DECISION</h2>
                            <p className="text-red-400 text-lg italic">"If the bank wants to protect my account... why do they need MY OTP to do it?"</p>
                        </div>
                        <div className="flex gap-8 justify-center mt-6">
                            <button
                                className="flex-1 bg-red-950/50 hover:bg-red-900 border-2 border-red-500/50 hover:border-red-500 p-6 rounded-2xl transition-all group"
                                onClick={handleGameOver}
                            >
                                <h3 className="text-2xl font-bold text-red-500 mb-2 group-hover:drop-shadow-[0_0_10px_rgba(239,68,68,1)] uppercase">❌ Share the OTP</h3>
                                <p className="text-red-200/50 text-sm">Read the numbers aloud to the caller to "secure" your account.</p>
                            </button>
                            <button
                                className="flex-1 bg-emerald-950/50 hover:bg-emerald-900 border-2 border-emerald-500/50 hover:border-emerald-500 p-6 rounded-2xl transition-all group"
                                onClick={handleVictory}
                            >
                                <h3 className="text-2xl font-bold text-emerald-500 mb-2 group-hover:drop-shadow-[0_0_10px_rgba(16,185,129,1)] uppercase">✅ Hang Up & Verify</h3>
                                <p className="text-emerald-200/50 text-sm">Disconnect instantly. The bank doesn't need your OTP. Call official numbers later.</p>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // DIALER UI  player types a number and calls
    if (gameState === 'dialer') {
        return (
            <div className="w-full h-full flex items-center justify-center bg-zinc-950 p-4">
                <div className="w-[380px] h-[750px] bg-zinc-900 border-x-[12px] border-t-[12px] border-b-[24px] border-black rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col items-center">
                    {/* Header */}
                    <div className="w-full bg-zinc-800 flex flex-col items-center py-4 rounded-b-3xl shadow-md border-b border-zinc-700">
                        <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center font-bold text-white text-xl mb-2">📞</div>
                        <h2 className="text-xl font-bold text-white tracking-widest">DIAL A NUMBER</h2>
                    </div>

                    <div className="flex-1 w-full flex flex-col items-center justify-center gap-6 p-8">
                        {/* Number Display */}
                        <div className="w-full bg-black rounded-xl p-6 text-center border border-zinc-700">
                            <span className="text-4xl font-mono text-white tracking-[0.3em]">
                                {dialerInput || '_ _ _ _'}
                            </span>
                        </div>

                        {/* Hint */}
                        <div className="text-yellow-400 text-sm text-center animate-pulse font-bold">
                            💡 Remember: Cyber Crime Helpline is <span className="text-2xl">1930</span>
                        </div>

                        {/* Number Pad */}
                        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => setDialerInput(prev => (prev.length < 10 ? prev + num : prev))}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-white text-2xl font-bold py-4 rounded-xl border border-zinc-600 transition-all active:scale-95 shadow-lg"
                                >
                                    {num}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-4 w-full max-w-[280px]">
                            {/* Backspace */}
                            <button
                                onClick={() => setDialerInput(prev => prev.slice(0, -1))}
                                className="flex-1 bg-red-900 hover:bg-red-800 text-white py-3 rounded-xl border border-red-700 font-bold transition-all"
                            >
                                ⌫
                            </button>
                            {/* Call Button */}
                            <button
                                onClick={() => {
                                    if (dialerInput === '1930') {
                                        setCallStep(0);
                                        setGameState('calling_1930');
                                    } else if (dialerInput.length > 0) {
                                        setFeedbackMsg('❌ Wrong number! Think — what is the Cyber Crime Helpline number?');
                                        setTimeout(() => setFeedbackMsg(null), 2000);
                                        setDialerInput('');
                                    }
                                }}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl border border-emerald-400 font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                            >
                                📞 CALL
                            </button>
                        </div>
                    </div>

                    {feedbackMsg && (
                        <div className="absolute top-32 left-4 right-4 bg-red-600 text-white px-4 py-3 rounded-xl shadow-xl z-50 font-bold text-center text-sm">
                            {feedbackMsg}
                        </div>
                    )}

                    {/* Back Button */}
                    <button
                        className="absolute bottom-8 text-zinc-500 hover:text-white text-sm font-mono transition-colors"
                        onClick={() => setGameState('post_call')}
                    >
                        [ Cancel ]
                    </button>
                </div>
            </div>
        );
    }

    // CALLING 1930 — Cybercrime Helpline conversation
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
                    {/* Header */}
                    <div className="w-full bg-emerald-900 flex flex-col items-center py-4 rounded-b-3xl shadow-md border-b border-emerald-700">
                        <div className="w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center font-bold text-white text-xl mb-2">🛡️</div>
                        <h2 className="text-lg font-bold text-emerald-300 tracking-widest">CYBER CRIME HELPLINE</h2>
                        <p className="text-emerald-400 font-mono text-sm">1930</p>
                    </div>

                    {/* Conversation */}
                    <div className="flex-1 w-full flex flex-col justify-start p-4 pb-20 gap-3 overflow-y-auto custom-scrollbar">
                        {callConversation.map((msg, idx) => {
                            if (idx > callStep) return null;

                            if (msg.speaker === 'SYSTEM') {
                                return (
                                    <div key={idx} className="bg-zinc-800 text-center text-zinc-300 p-3 rounded-xl text-sm border border-zinc-700 font-mono">
                                        {msg.text}
                                    </div>
                                );
                            }
                            if (msg.speaker === 'OFFICER') {
                                return (
                                    <div key={idx} className="bg-emerald-900/50 text-emerald-100 p-4 rounded-2xl rounded-tl-sm w-5/6 shadow-md border border-emerald-700/50">
                                        <span className="text-xs text-emerald-400 font-bold mb-1 block">OFFICER SHARMA</span>
                                        {msg.text}
                                    </div>
                                );
                            }
                            if (msg.speaker === 'YOU') {
                                return (
                                    <div key={idx} className="w-full flex justify-end">
                                        <div className="bg-blue-600/80 text-white p-3 rounded-2xl rounded-tr-sm w-5/6 text-left shadow-md border border-blue-500/50 text-sm">
                                            "{msg.text}"
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })}

                        {/* Continue or Complete */}
                        {callStep < callConversation.length - 1 ? (
                            <button
                                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 text-white font-mono text-sm rounded-lg mt-4 shadow-xl transition-colors"
                                onClick={() => setCallStep(prev => prev + 1)}
                            >
                                [ Continue... ]
                            </button>
                        ) : (
                            <button
                                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 text-white font-bold text-sm rounded-lg mt-4 shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-colors"
                                onClick={() => {
                                    completeLevel(callOutcome === 'won', callOutcome === 'won' ? 500 : 0, callOutcome === 'won' ? 0 : 100000);
                                }}
                            >
                                [ COMPLETE LEVEL ]
                            </button>
                        )}

                        {<div ref={(el) => { el?.scrollIntoView({ behavior: 'smooth' }) }} />}
                    </div>
                </div>
            </div>
        );
    }

    const renderPlant = (x, y) => (
        <div className="absolute z-20" style={{ left: x, top: y }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60px] h-[60px] bg-[#c05a3c] rounded-full border-[8px] border-[#9c452e] shadow-xl"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140px] h-[140px] pointer-events-none">
                {[0, 45, 90, 135].map(deg => (
                    <div key={deg} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140px] h-[30px] bg-[#3e8549] rounded-full flex items-center`} style={{ transform: `translate(-50%, -50%) rotate(${deg}deg)`, boxShadow: '0 5px 15px rgba(0,0,0,0.4)', zIndex: deg }}>
                        <div className="w-full h-[2px] bg-[#2d6335]"></div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderBookshelf = (x, y) => (
        <div className="absolute z-10 bg-[#e08e50] border-[12px] border-[#b86b35] shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col justify-evenly p-2" style={{ left: x, top: y, width: 140, height: 450 }}>
            <div className="w-full h-[10px] bg-[#9c5525] shadow-sm"></div>
            <div className="flex items-end h-[60px] px-2 gap-1">
                <div className="w-4 h-10 bg-red-600 shadow-sm border-l border-white/20"></div><div className="w-5 h-12 bg-blue-600 shadow-sm border-l border-white/20"></div><div className="w-4 h-14 bg-yellow-500 ml-2 shadow-sm border-l border-white/20"></div>
            </div>
            <div className="w-full h-[10px] bg-[#9c5525] shadow-sm"></div>
            <div className="flex items-end h-[60px] px-2 gap-1 justify-end">
                <div className="w-6 h-12 bg-emerald-600 shadow-sm border-l border-white/20"></div><div className="w-4 h-9 bg-purple-600 shadow-sm border-l border-white/20"></div>
            </div>
            <div className="w-full h-[10px] bg-[#9c5525] shadow-sm"></div>
            <div className="flex items-end h-[60px] px-2 gap-1">
                <div className="w-5 h-14 bg-cyan-600 shadow-sm border-l border-white/20"></div><div className="w-4 h-12 bg-red-500 shadow-sm border-l border-white/20"></div><div className="w-6 h-10 bg-slate-600 ml-4 shadow-sm border-l border-white/20"></div>
            </div>
            <div className="w-full h-[10px] bg-[#9c5525] shadow-sm"></div>
        </div>
    );

    const renderWindow = (x, y) => (
        <div className="absolute z-5 bg-[#1e293b] border-x-[16px] border-t-[16px] border-[#8da5b2] shadow-[inset_0_0_50px_rgba(0,0,0,0.8),0_10px_30px_rgba(0,0,0,0.6)] overflow-hidden" style={{ left: x, top: y, width: 450, height: 180 }}>
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] to-[#1e3a8a]"></div>
            <div className="absolute bottom-0 left-0 right-0 h-[80px] flex items-end gap-[1px]">
                {[40, 60, 30, 80, 50, 45, 70, 35, 90, 40, 65, 55].map((h, i) => (
                    <div key={i} className={`flex-1 bg-[#090e1a] flex flex-wrap gap-1 p-1 items-start justify-center`} style={{ height: h }}>
                        {Math.random() > 0.5 && <div className="w-2 h-2 bg-yellow-100/80 rounded-sm shadow-[0_0_5px_rgba(254,240,138,0.8)]"></div>}
                        {Math.random() > 0.7 && <div className="w-2 h-2 bg-yellow-100/80 rounded-sm shadow-[0_0_5px_rgba(254,240,138,0.8)]"></div>}
                    </div>
                ))}
            </div>
            <div className="absolute top-0 bottom-0 left-1/2 w-[16px] bg-[#8da5b2] -translate-x-1/2 shadow-xl"></div>
        </div>
    );

    const cameraX = Math.max(0, Math.min(playerPos.x - VIEWPORT_WIDTH / 2, ROOM_WIDTH - VIEWPORT_WIDTH));
    const cameraY = Math.max(0, Math.min(playerPos.y - VIEWPORT_HEIGHT / 2, ROOM_HEIGHT - VIEWPORT_HEIGHT));

    return (
        <div className="w-full h-full flex items-center justify-center bg-zinc-950 px-8">
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
                        transform: `translate(${-cameraX}px, ${-cameraY}px)`
                    }}
                >
                    <div className="absolute inset-0 bg-[#2c3e50] overflow-hidden">
                        {/* Wood Floor */}
                        <div className="absolute inset-0 opacity-80" style={{
                            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(0,0,0,0.2) 38px, rgba(0,0,0,0.2) 40px)'
                        }}></div>

                        {/* Top Wall */}
                        <div className="absolute top-0 left-0 right-0 h-[180px] bg-[#233547] z-0 border-b-[12px] border-slate-800 shadow-xl"></div>

                        {/* Light Casts from Windows */}
                        <div className="absolute top-[180px] left-[350px] w-[500px] h-[900px] bg-blue-400/10 z-0 transform skew-x-[-25deg] origin-top-left pointer-events-none mix-blend-screen" style={{ WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)', maskImage: 'linear-gradient(to bottom, black, transparent)' }}></div>
                        <div className="absolute top-[180px] right-[250px] w-[500px] h-[900px] bg-blue-400/10 z-0 transform skew-x-[25deg] origin-top-right pointer-events-none mix-blend-screen" style={{ WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)', maskImage: 'linear-gradient(to bottom, black, transparent)' }}></div>

                        {/* Windows */}
                        {renderWindow(320, 0)}
                        {renderWindow(930, 0)}

                        {/* Bookshelves */}
                        {renderBookshelf(60, 350)}
                        {renderBookshelf(1400, 350)}

                        {/* Potted Plants */}
                        {renderPlant(180, 850)}
                        {renderPlant(1420, 850)}

                        {/* The Extravagant L-Shaped Desk */}
                        <div className="absolute z-10" style={{ left: PHONE_DESK.x, top: PHONE_DESK.y, width: PHONE_DESK.w, height: PHONE_DESK.h }}>

                            {/* Shadow underneath desk */}
                            <div className="absolute -inset-10 top-[140px] bg-black/40 blur-2xl z-[-1] rounded-[100px]"></div>

                            {/* Main Desk Board */}
                            <div className="absolute right-0 top-0 w-full h-[140px] bg-[#e08e50] shadow-2xl rounded-sm" style={{ borderBottom: '16px solid #b86b35', borderRight: '12px solid #b86b35', borderLeft: '12px solid #b86b35' }}></div>

                            {/* L-Return (Left side extension) */}
                            <div className="absolute left-0 top-[140px] w-[140px] h-[210px] bg-[#e08e50] shadow-2xl rounded-b-sm" style={{ borderBottom: '16px solid #b86b35', borderLeft: '12px solid #b86b35', borderRight: '12px solid #b86b35' }}></div>

                            {/* Monitors Setup */}
                            <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 flex items-end gap-2 drop-shadow-2xl z-30">
                                {/* Left Angled Monitor */}
                                <div className="w-[160px] h-[20px] bg-[#2a3b4c] rounded-sm flex justify-center transform -rotate-[24deg] translate-y-4 translate-x-4 border border-[#1e2a38] shadow-[0_15px_30px_rgba(0,0,0,0.8)] relative">
                                    <div className="absolute -bottom-6 w-[120px] h-[10px] bg-cyan-400/20 blur-[6px] rounded-full"></div>
                                    <div className="absolute top-full mt-1 w-[50px] h-[35px] bg-[#cbd5e1] rounded shadow-lg -z-10"></div>
                                </div>
                                {/* Main Center Monitor */}
                                <div className="w-[200px] h-[22px] bg-[#2a3b4c] rounded border border-[#1e2a38] shadow-[0_15px_30px_rgba(0,0,0,0.8)] flex justify-center relative z-10">
                                    <div className="absolute -bottom-8 w-[160px] h-[12px] bg-blue-400/20 blur-[8px] rounded-full"></div>
                                    <div className="absolute top-full mt-1 w-[70px] h-[40px] bg-[#cbd5e1] rounded shadow-lg -z-10"></div>
                                </div>
                            </div>

                            {/* Spherical Desk Lamp */}
                            <div className="absolute top-6 right-[30px] z-30 flex items-center justify-center">
                                <div className="w-[45px] h-[45px] bg-white rounded-full shadow-[inset_-5px_-5px_10px_rgba(0,0,0,0.2),0_10px_20px_rgba(0,0,0,0.6)] border border-slate-200"></div>
                                <div className="absolute -top-3 right-5 w-1.5 h-8 bg-slate-400 transform rotate-[35deg] rounded-full shadow-md"></div>
                                {/* Ambient Lamp Glow */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-amber-400/10 blur-[30px] rounded-full pointer-events-none"></div>
                            </div>

                            {/* Coffee Cup */}
                            <div className="absolute top-20 left-[180px] w-[24px] h-[24px] bg-white rounded-full shadow-[5px_10px_15px_rgba(0,0,0,0.6)] border-2 border-slate-200 z-30">
                                <div className="absolute top-1 left-1 w-3 h-3 bg-[#3a2010] rounded-full flex items-center justify-center overflow-hidden">
                                    <div className="w-4 h-1 bg-amber-900/40 blur-[1px]"></div>
                                </div>
                                <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-5 border-4 border-slate-300 rounded-l-full"></div>
                            </div>

                            {/* Keyboard */}
                            <div className="absolute top-[80px] left-[230px] w-[110px] h-[36px] bg-slate-200 flex flex-wrap gap-[2px] p-1.5 rounded shadow-[0_5px_10px_rgba(0,0,0,0.4)] border border-slate-400 z-30 text-[0px]">
                                {[...Array(30)].map((_, i) => <div key={i} className="w-[7px] h-[5px] bg-white rounded-sm shadow-sm border border-slate-100"></div>)}
                            </div>

                            {/* Mouse */}
                            <div className="absolute top-[85px] left-[360px] w-[18px] h-[28px] bg-white rounded-full shadow-[0_5px_10px_rgba(0,0,0,0.4)] border border-slate-300 z-30 overflow-hidden">
                                <div className="w-full h-1/2 border-b-2 border-slate-200 flex justify-center">
                                    <div className="w-1 h-3 bg-slate-200 rounded-full mt-1"></div>
                                </div>
                                <div className="absolute -top-[40px] left-1/2 w-0.5 h-[40px] bg-slate-600 -translate-x-1/2 -z-10"></div>
                            </div>

                            {/* Stack of Books (left side) */}
                            <div className="absolute top-[180px] left-[30px] z-30 shadow-xl transform -rotate-[15deg] group">
                                <div className="w-[60px] h-[45px] bg-red-700 rounded-sm border-r-[6px] border-[#7f1d1d] shadow-md flex items-center justify-end pr-2"><div className="w-1 h-6 bg-yellow-400"></div></div>
                                <div className="w-[55px] h-[40px] bg-amber-600 rounded-sm border-r-[6px] border-[#92400e] shadow-md absolute top-[-6px] left-[2px] transform rotate-3"></div>
                                <div className="w-[50px] h-[35px] bg-white rounded-sm border-r-[6px] border-slate-300 shadow-md absolute top-[-10px] left-[4px] transform rotate-6 flex items-center justify-center">
                                    <div className="w-[40px] h-[25px] bg-slate-100 border border-slate-200"></div>
                                </div>
                            </div>

                            {/* === THE INTERACTABLE PHONE === */}
                            <div className="absolute top-[120px] left-[70px] z-40">
                                <div className={`w-[28px] h-[50px] bg-slate-900 border-[3px] border-slate-700 rounded-lg shadow-2xl relative ${gameState === 'ringing' ? 'animate-[wiggle_0.2s_ease-in-out_infinite] shadow-[0_0_25px_rgba(239,68,68,1)]' : ''}`}>
                                    {gameState === 'ringing' && (
                                        <div className="absolute inset-0 bg-red-500/40 animate-pulse rounded border border-red-500"></div>
                                    )}
                                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3 h-0.5 bg-slate-700 rounded-full"></div>
                                </div>
                                {/* Phone glow */}
                                {gameState === 'ringing' && (
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] bg-red-500/10 blur-[20px] rounded-full pointer-events-none -z-10"></div>
                                )}
                            </div>
                        </div>

                        {/* Ergonomic Office Chair */}
                        <div className="absolute w-[100px] h-[100px] z-20 flex flex-col items-center drop-shadow-2xl" style={{ left: 750, top: 600 }}>
                            <div className="w-[70px] h-[45px] bg-[#3a4f6d] rounded-t-2xl border-x-[6px] border-t-[6px] border-[#2c3e50] absolute -top-4 z-0"></div>
                            <div className="w-[85px] h-[55px] bg-[#4a6285] rounded-b-[40px] border-b-[8px] border-[#2c3e50] relative z-10 shadow-[0_15px_30px_rgba(0,0,0,0.8)]">
                                <div className="absolute -left-4 top-2 w-[16px] h-[35px] bg-[#3a4f6d] rounded-full shadow-lg border-2 border-[#2c3e50]"></div>
                                <div className="absolute -right-4 top-2 w-[16px] h-[35px] bg-[#3a4f6d] rounded-full shadow-lg border-2 border-[#2c3e50]"></div>
                            </div>
                            <div className="absolute -bottom-8 w-6 h-6 rounded-full bg-slate-800 shadow-[0_10px_20px_rgba(0,0,0,0.8)] z-0 flex items-center justify-center">
                                <div className="w-20 h-1.5 bg-slate-700 transform rotate-45 rounded-full"></div>
                                <div className="absolute w-20 h-1.5 bg-slate-700 transform -rotate-45 rounded-full"></div>
                            </div>
                        </div>

                        <Player x={playerPos.x} y={playerPos.y} />

                    </div>
                </div>

                {/* Interaction Prompt HUD overlay (Outside camera, pinned to screen) */}
                {canInteract && gameState === 'ringing' && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white text-black font-bold px-6 py-3 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)] z-[400] flex items-center gap-3 animate-bounce">
                        <span className="bg-black text-white px-2 py-1 rounded shadow-inner">E</span>
                        <span>ANSWER PHONE</span>
                    </div>
                )}
                {canInteract && gameState === 'post_call' && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-black font-bold px-6 py-3 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] z-[400] flex items-center gap-3 animate-bounce">
                        <span className="bg-black text-white px-2 py-1 rounded shadow-inner">E</span>
                        <span>USE PHONE</span>
                    </div>
                )}

                {/* Instruction HUD (Outside camera) */}
                <div className="absolute top-4 left-4 text-emerald-500 font-mono text-xs z-[400] bg-black/60 p-2 rounded">
                    {gameState === 'post_call' ? (
                        <>Objective: Report the scam. Go to the phone and call <span className="text-yellow-400 font-bold">1930</span>.<br />Controls: W A S D to move.</>
                    ) : (
                        <>Objective: Investigate the ringing phone.<br />Controls: W A S D to move.</>
                    )}
                </div>

                {/* POST-CALL ALERT BANNER (Outside camera) */}
                {gameState === 'post_call' && (
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[400] bg-yellow-500/90 text-black px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(234,179,8,0.6)] font-bold text-center animate-pulse max-w-lg">
                        📞 You need to report this to the Cyber Crime Helpline!<br />
                        <span className="text-2xl">Dial 1930</span> from the phone on your desk.
                    </div>
                )}

                <style jsx>{`
                    @keyframes wiggle {
                        0%, 100% { transform: rotate(-5deg); }
                        50% { transform: rotate(5deg); }
                    }
                `}</style>

                {/* GAME OVER OVERLAY (Pinned to screen) */}
                {
                    gameState === 'game_over' && (
                        <div className="absolute inset-0 bg-red-950/90 z-[500] backdrop-blur text-white flex flex-col items-center justify-center p-12 text-center overflow-hidden animate-fadeIn fixed">
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 40px, #000 40px, #000 80px)' }}></div>
                            <h1 className="text-7xl font-black text-red-500 tracking-widest mb-6 drop-shadow-[0_0_20px_rgba(239,68,68,1)] z-10">GAME OVER</h1>
                            <h2 className="text-4xl font-bold mb-10 z-10">You Shared the OTP.</h2>

                            <div className="bg-black/50 border border-red-900 p-8 rounded-2xl max-w-2xl mb-12 shadow-xl z-10">
                                <p className="text-xl text-red-200 mb-6 leading-relaxed">
                                    In exactly 28 seconds, the fraudster used your OTP to authenticate a net banking transfer.
                                    The funds were instantly scattered across 7 mule accounts.
                                </p>
                                <div className="flex justify-between font-mono text-red-500 border-t border-red-900 pt-4">
                                    <span>ASSETS LOST:</span>
                                    <span className="font-bold text-2xl">-₹1,00,000</span>
                                </div>
                            </div>

                            <button
                                className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold tracking-widest uppercase rounded tracking-[0.2em] shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all z-10 relative"
                                onClick={() => {
                                    setCallOutcome('lost');
                                    setGameState('post_call');
                                }}
                            >
                                [ RETURN TO ROOM ]
                            </button>
                        </div>
                    )
                }

                {/* VICTORY OVERLAY (Pinned to screen) */}
                {
                    gameState === 'victory' && (
                        <div className="absolute inset-0 bg-emerald-950/90 z-[500] backdrop-blur text-white flex flex-col items-center justify-center p-12 text-center overflow-hidden animate-fadeIn fixed">
                            <div className="absolute inset-0 bg-black/50"></div>

                            <div className="w-32 h-32 bg-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(16,185,129,0.8)] z-10">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-emerald-950" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>

                            <h1 className="text-6xl font-black text-emerald-400 tracking-widest mb-6 drop-shadow-[0_0_20px_rgba(16,185,129,0.8)] z-10 uppercase">Assets Secured</h1>

                            <div className="bg-black/60 border border-emerald-900 p-8 rounded-2xl max-w-2xl mb-12 shadow-xl z-10">
                                <p className="text-lg text-emerald-100 mb-6 leading-relaxed text-left">
                                    You hung up the phone. A real bank never needs your OTP to lock your account.
                                    By maintaining your composure under pressure and evaluating the clues, you protected your grandfather's inheritance.
                                </p>
                                <div className="flex justify-between items-center text-emerald-400 border-t border-emerald-900 pt-4 font-mono">
                                    <span className="uppercase tracking-widest">Digital Assets Protected:</span>
                                    <span className="font-bold text-2xl font-sans">₹42,00,000</span>
                                </div>
                                <div className="flex justify-between items-center text-cyan-400 border-t border-emerald-900 pt-4 mt-2 font-mono">
                                    <span className="uppercase tracking-widest">Cyber Safety Score:</span>
                                    <span className="font-bold text-2xl font-sans">+500 PTS</span>
                                </div>
                            </div>

                            <button
                                className="px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black tracking-widest uppercase rounded tracking-[0.2em] shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all z-10 relative"
                                onClick={() => {
                                    setCallOutcome('won');
                                    setGameState('post_call');
                                }}
                            >
                                [ RETURN TO ROOM ]
                            </button>
                        </div>
                    )
                }

            </div>
        </div>
    );
};


export default Level1;
