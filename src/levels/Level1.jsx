import React, { useState, useEffect, useRef } from 'react';
import Player from '../components/Player';
import { useGameState } from '../context/GameStateContext';

const ROOM_WIDTH = 1200;
const ROOM_HEIGHT = 800;
const SPEED = 16;
const PLAYER_SIZE = 40;

const PHONE_DESK = { x: 500, y: 300, w: 200, h: 100 };

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
    const [playerPos, setPlayerPos] = useState({ x: 580, y: 700 });
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

                // Desk Collision (Solid object)
                if (checkCollision(newX, newY, PHONE_DESK)) {
                    if (prev.x + PLAYER_SIZE <= PHONE_DESK.x || prev.x >= PHONE_DESK.x + PHONE_DESK.w) newX = prev.x;
                    if (prev.y + PLAYER_SIZE <= PHONE_DESK.y || prev.y >= PHONE_DESK.y + PHONE_DESK.h) newY = prev.y;
                }

                const interactArea = { x: PHONE_DESK.x - 20, y: PHONE_DESK.y - 20, w: PHONE_DESK.w + 40, h: PHONE_DESK.h + 40 };
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

    return (
        <div className="w-full h-full flex items-center justify-center bg-zinc-950 px-8">
            <div
                className="relative bg-zinc-800 border-8 border-zinc-900 shadow-2xl overflow-hidden"
                style={{ width: ROOM_WIDTH, height: ROOM_HEIGHT }}
            >
                {/* Wood Floor */}
                <div className="absolute inset-0 bg-amber-900" style={{
                    backgroundImage: `
                        repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(0,0,0,0.3) 48px, rgba(0,0,0,0.3) 50px),
                        linear-gradient(90deg, rgba(120,53,15,0.7), rgba(160,75,20,0.7)),
                        repeating-linear-gradient(0deg, transparent, transparent 200px, rgba(0,0,0,0.3) 200px, rgba(0,0,0,0.3) 202px)
                    `
                }}></div>

                {/* Top Wall */}
                <div className="absolute top-0 left-0 right-0 h-[120px] bg-gradient-to-b from-slate-700 to-slate-600 z-0 border-b-4 border-amber-800">
                    {/* Wainscoting detail */}
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-slate-500/30"></div>
                    {/* Baseboard */}
                    <div className="absolute -bottom-1 left-0 right-0 h-2 bg-amber-900"></div>
                </div>

                {/* Window (top-center) */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[300px] h-[100px] bg-slate-950 border-8 border-amber-800 z-5 rounded-t-lg overflow-hidden" style={{ boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6)' }}>
                    {/* Night sky */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-indigo-950">
                        {/* Stars */}
                        <div className="absolute top-3 left-8 w-1 h-1 bg-white rounded-full opacity-60"></div>
                        <div className="absolute top-5 left-40 w-0.5 h-0.5 bg-white rounded-full opacity-40"></div>
                        <div className="absolute top-2 right-20 w-1 h-1 bg-white rounded-full opacity-50"></div>
                        <div className="absolute top-8 left-24 w-0.5 h-0.5 bg-white rounded-full opacity-30"></div>
                        <div className="absolute top-4 right-40 w-0.5 h-0.5 bg-white rounded-full opacity-50"></div>
                    </div>
                    {/* City skyline silhouette */}
                    <div className="absolute bottom-0 left-0 right-0 h-8 flex items-end gap-0.5 px-2">
                        <div className="w-6 h-6 bg-slate-800"></div>
                        <div className="w-4 h-8 bg-slate-800"></div>
                        <div className="w-8 h-5 bg-slate-800"></div>
                        <div className="w-3 h-7 bg-slate-800"></div>
                        <div className="w-10 h-4 bg-slate-800"></div>
                        <div className="w-5 h-6 bg-slate-800"></div>
                        <div className="w-6 h-8 bg-slate-800"></div>
                        <div className="w-8 h-3 bg-slate-800"></div>
                        <div className="w-4 h-7 bg-slate-800"></div>
                        <div className="w-12 h-5 bg-slate-800"></div>
                        <div className="w-5 h-6 bg-slate-800"></div>
                        <div className="w-3 h-4 bg-slate-800"></div>
                    </div>
                    {/* Window frame cross */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-amber-800 -translate-x-1/2"></div>
                    <div className="absolute left-0 right-0 top-1/2 h-1 bg-amber-800 -translate-y-1/2"></div>
                </div>

                {/* Picture frames on wall */}
                <div className="absolute top-6 left-[140px] w-16 h-12 bg-zinc-700 border-4 border-amber-700 z-5 rounded-sm" style={{ boxShadow: '2px 2px 6px rgba(0,0,0,0.4)' }}>
                    <div className="w-full h-full bg-gradient-to-br from-emerald-900/40 to-cyan-900/40"></div>
                </div>
                <div className="absolute top-8 right-[140px] w-14 h-10 bg-zinc-700 border-4 border-amber-700 z-5 rounded-sm" style={{ boxShadow: '2px 2px 6px rgba(0,0,0,0.4)' }}>
                    <div className="w-full h-full bg-gradient-to-br from-amber-900/40 to-red-900/40"></div>
                </div>

                {/* Rug */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[600px] h-[400px] bg-red-950 border-[10px] border-red-900/80 rounded-lg z-0 overflow-hidden" style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}>
                    <div className="w-[92%] h-[90%] m-auto mt-[5%] border-2 border-yellow-700/40 flex justify-center items-center">
                        <div className="w-[85%] h-[85%] border-2 border-red-800/60 flex justify-center items-center">
                            <div className="w-28 h-28 bg-yellow-700/20 rotate-45 border border-yellow-800/30"></div>
                        </div>
                    </div>
                </div>

                {/* Bookshelf 1 (left wall) */}
                <div className="absolute top-[120px] left-12 w-44 h-20 bg-amber-950 border-b-6 border-amber-900 z-10 flex p-2 gap-1 items-end rounded-b-sm" style={{ borderBottom: '6px solid #78350f', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                    <div className="w-3 h-14 bg-red-800 rounded-t-sm"></div>
                    <div className="w-4 h-12 bg-blue-800 rounded-t-sm"></div>
                    <div className="w-3 h-10 bg-green-800 rounded-t-sm transform -rotate-6"></div>
                    <div className="w-4 h-14 bg-yellow-700 rounded-t-sm ml-2"></div>
                    <div className="w-3 h-13 bg-slate-600 rounded-t-sm"></div>
                    <div className="w-4 h-11 bg-indigo-700 rounded-t-sm"></div>
                    <div className="w-3 h-14 bg-rose-700 rounded-t-sm"></div>
                </div>

                {/* Bookshelf 2 (right wall) */}
                <div className="absolute top-[120px] right-12 w-44 h-20 bg-amber-950 border-b-6 border-amber-900 z-10 flex p-2 gap-1 items-end justify-end rounded-b-sm" style={{ borderBottom: '6px solid #78350f', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                    <div className="w-3 h-12 bg-indigo-800 rounded-t-sm transform rotate-6"></div>
                    <div className="w-4 h-14 bg-rose-800 rounded-t-sm"></div>
                    <div className="w-5 h-10 bg-emerald-700 rounded-t-sm ml-2"></div>
                    <div className="w-3 h-14 bg-slate-700 rounded-t-sm"></div>
                    <div className="w-4 h-12 bg-cyan-800 rounded-t-sm"></div>
                    <div className="w-3 h-11 bg-amber-700 rounded-t-sm"></div>
                </div>

                {/* Potted Plant (corner, left) */}
                <div className="absolute top-[130px] left-4 z-20 flex flex-col items-center">
                    <div className="w-20 h-18 relative" style={{ height: 72 }}>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-6 bg-amber-800"></div>
                        <div className="w-18 h-12 bg-green-700 rounded-full absolute top-0 left-0" style={{ width: 72 }}></div>
                        <div className="w-14 h-10 bg-green-600 rounded-full absolute top-1 left-2" style={{ width: 56 }}></div>
                        <div className="w-10 h-8 bg-green-500/80 rounded-full absolute top-2 left-4" style={{ width: 40 }}></div>
                    </div>
                    <div className="w-14 h-10 bg-orange-800 rounded-b-lg rounded-t-sm border-2 border-orange-900 -mt-2" style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.4)' }}></div>
                </div>

                {/* Potted Plant (corner, right-bottom) */}
                <div className="absolute bottom-8 right-12 z-20 flex flex-col items-center">
                    <div className="w-16 h-14 relative" style={{ height: 56 }}>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-5 bg-amber-800"></div>
                        <div className="w-16 h-10 bg-emerald-700 rounded-full absolute top-0 left-0"></div>
                        <div className="w-12 h-8 bg-emerald-600 rounded-full absolute top-1 left-2"></div>
                    </div>
                    <div className="w-12 h-8 bg-zinc-700 rounded-b-lg rounded-t-sm border-2 border-zinc-800 -mt-2" style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.4)' }}></div>
                </div>

                {/* The Elegant L-Shaped Desk */}
                <div
                    className="absolute bg-amber-800 shadow-[0_20px_50px_rgba(0,0,0,0.9)] rounded-md z-10 flex"
                    style={{
                        left: PHONE_DESK.x, top: PHONE_DESK.y, width: PHONE_DESK.w, height: PHONE_DESK.h,
                        backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent)',
                        borderTop: '6px solid #b45309', borderLeft: '6px solid #b45309',
                        borderBottom: '12px solid #78350f', borderRight: '12px solid #78350f'
                    }}
                >
                    {/* The L-return piece of the desk */}
                    <div className="absolute top-[-6px] -left-20 w-20 h-56 bg-amber-800 rounded-md rounded-tr-none z-0"
                        style={{
                            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent)',
                            borderTop: '6px solid #b45309', borderLeft: '6px solid #b45309',
                            borderRight: '12px solid #78350f', borderBottom: '12px solid #78350f'
                        }}></div>

                    {/* Dual Monitor PC Setup */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-4 drop-shadow-2xl z-20">
                        {/* Monitor 1 */}
                        <div className="w-32 h-4 bg-slate-900 rounded border border-slate-700 flex justify-center mt-2 relative">
                            {/* Stand */}
                            <div className="w-8 h-6 bg-slate-800 absolute top-4 rounded-b"></div>
                            {/* Screen glow */}
                            <div className="absolute -bottom-8 w-24 h-8 bg-cyan-500/10 blur-md rounded-full"></div>
                        </div>
                        {/* Monitor 2 */}
                        <div className="w-32 h-4 bg-slate-900 rounded border border-slate-700 flex justify-center transform -rotate-12 translate-y-2 relative">
                            <div className="w-8 h-6 bg-slate-800 absolute top-4 rounded-b"></div>
                            {/* Screen glow */}
                            <div className="absolute -bottom-8 w-24 h-8 bg-cyan-500/10 blur-md rounded-full"></div>
                        </div>
                    </div>

                    {/* Keyboard & Mouse */}
                    <div className="absolute bottom-6 left-[110px] -translate-x-1/2 w-24 h-6 bg-zinc-900 rounded-sm shadow-black/50 shadow-inner flex justify-center items-center">
                        <div className="w-20 h-4 bg-zinc-800 rounded-sm opacity-50"></div>
                    </div>
                    <div className="absolute bottom-6 right-2 w-4 h-6 bg-zinc-900 rounded-full shadow-black/50 shadow-inner border-t border-zinc-700"></div>

                    {/* Coffee Mug */}
                    <div className="absolute top-4 left-4 w-8 h-8 bg-zinc-200 rounded-full shadow-[5px_5px_10px_rgba(0,0,0,0.6)] border border-slate-300 flex justify-center items-center">
                        <div className="w-5 h-5 rounded-full border-[3px] border-zinc-300 absolute -right-3 top-1 shadow-md"></div>
                        <div className="w-6 h-6 bg-amber-950 rounded-full flex justify-center items-center">
                            <div className="w-4 h-4 rounded-full border border-amber-900/50"></div>
                        </div>
                    </div>

                    {/* Glowing Desk Mat */}
                    <div className="absolute bottom-4 left-[-60px] w-16 h-28 bg-zinc-900 rounded border border-cyan-900/40 shadow-[0_0_15px_rgba(34,211,238,0.1)] z-10 flex justify-center items-center">
                        {/* Ringing Phone */}
                        <div className={`w-10 h-16 bg-slate-950 border-2 border-slate-700 rounded-lg ${gameState === 'ringing' ? 'animate-[wiggle_0.2s_ease-in-out_infinite] shadow-[0_0_20px_rgba(239,68,68,0.8)]' : 'shadow-xl'} relative overflow-hidden z-30`}>
                            {/* Phone Screen Glow */}
                            <div className="absolute inset-x-0 bottom-0 top-3 bg-red-500/50 rounded-b-sm"></div>
                            {/* Ringing indicators */}
                            {gameState === 'ringing' && (
                                <>
                                    <div className="absolute -left-6 top-4 text-red-500 font-bold text-sm animate-ping">)</div>
                                    <div className="absolute -right-6 top-4 text-red-500 font-bold text-sm animate-ping">(</div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Ergonomic Office Chair */}
                <div className="absolute w-16 h-16 rounded-3xl z-0 flex flex-col items-center" style={{ left: 560, top: 410 }}>
                    {/* Back rest */}
                    <div className="w-14 h-8 bg-zinc-800 border-t-4 border-zinc-700 rounded-t-xl z-0 shadow-lg absolute -top-4"></div>
                    {/* Seat */}
                    <div className="w-16 h-12 bg-zinc-900 border-b-4 border-zinc-950 rounded-b-3xl z-10 shadow-xl relative">
                        {/* Arm rests */}
                        <div className="absolute -left-2 top-2 w-2 h-8 bg-zinc-800 rounded-full shadow"></div>
                        <div className="absolute -right-2 top-2 w-2 h-8 bg-zinc-800 rounded-full shadow"></div>
                    </div>
                </div>

                <Player x={playerPos.x} y={playerPos.y} />

                {/* Interaction Prompt HUD overlay */}
                {canInteract && gameState === 'ringing' && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white text-black font-bold px-6 py-3 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)] z-50 flex items-center gap-3 animate-bounce">
                        <span className="bg-black text-white px-2 py-1 rounded shadow-inner">E</span>
                        <span>ANSWER PHONE</span>
                    </div>
                )}
                {canInteract && gameState === 'post_call' && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-emerald-500 text-black font-bold px-6 py-3 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] z-50 flex items-center gap-3 animate-bounce">
                        <span className="bg-black text-white px-2 py-1 rounded shadow-inner">E</span>
                        <span>USE PHONE</span>
                    </div>
                )}

                {/* Instruction HUD */}
                <div className="absolute top-4 left-4 text-emerald-500 font-mono text-xs z-50 bg-black/60 p-2 rounded">
                    {gameState === 'post_call' ? (
                        <>Objective: Report the scam. Go to the phone and call <span className="text-yellow-400 font-bold">1930</span>.<br />Controls: W A S D to move.</>
                    ) : (
                        <>Objective: Investigate the ringing phone.<br />Controls: W A S D to move.</>
                    )}
                </div>

                {/* POST-CALL ALERT BANNER */}
                {gameState === 'post_call' && (
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-yellow-500/90 text-black px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(234,179,8,0.6)] font-bold text-center animate-pulse max-w-lg">
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
                {/* GAME OVER OVERLAY (Remains in room) */}
                {
                    gameState === 'game_over' && (
                        <div className="absolute inset-0 bg-red-950/90 z-[300] backdrop-blur text-white flex flex-col items-center justify-center p-12 text-center overflow-hidden animate-fadeIn">
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

                {/* VICTORY OVERLAY (Remains in room) */}
                {
                    gameState === 'victory' && (
                        <div className="absolute inset-0 bg-emerald-950/90 z-[300] backdrop-blur text-white flex flex-col items-center justify-center p-12 text-center overflow-hidden animate-fadeIn">
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
