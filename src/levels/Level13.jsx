import React, { useState, useEffect } from 'react';
import { useGameState } from '../context/GameStateContext';

const DIALOGUE_TREE = {
    opening: {
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
            { text: "I... I understand. I'll take the phone.", next: 'end_level' }
        ]
    },
    end_level: {
        agent: [],
        next: 'null'
    }
};

const Level13 = () => {
    const { enterLevel } = useGameState();
    const [phase, setPhase] = useState('time_skip'); // 'time_skip' -> 'zoom_dialogue' -> 'end'
    
    // Dialogue State
    const [currentNode, setCurrentNode] = useState('opening');
    const [lineIndex, setLineIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        if (phase === 'time_skip') {
            const timer = setTimeout(() => {
                setPhase('zoom_dialogue');
                setIsTyping(true);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [phase]);

    // Typewriter effect
    useEffect(() => {
        if (phase !== 'zoom_dialogue') return;

        const node = DIALOGUE_TREE[currentNode];
        if (!node || !node.agent || node.agent.length === 0) return;

        if (isTyping) {
            const currentLine = node.agent[lineIndex];
            let currentCharIndex = 0;
            setDisplayedText('');

            const typeInterval = setInterval(() => {
                if (currentCharIndex < currentLine.length) {
                    setDisplayedText(prev => prev + currentLine[currentCharIndex]);
                    currentCharIndex++;
                } else {
                    clearInterval(typeInterval);
                    setIsTyping(false);
                }
            }, 30);

            return () => clearInterval(typeInterval);
        }
    }, [currentNode, lineIndex, isTyping, phase]);

    const handleDialogueInteraction = () => {
        if (phase !== 'zoom_dialogue') return;
        
        const node = DIALOGUE_TREE[currentNode];
        if (isTyping) {
            // Skip typing
            setDisplayedText(node.agent[lineIndex]);
            setIsTyping(false);
        } else {
            // Next line
            if (lineIndex < node.agent.length - 1) {
                setLineIndex(prev => prev + 1);
                setIsTyping(true);
                setDisplayedText('');
            }
        }
    };

    const handleChoiceSelect = (nextId) => {
        if (nextId === 'end_level') {
            enterLevel(14); // Proceed to Scene 4 (Level 14) or next phase
            return;
        }

        setCurrentNode(nextId);
        setLineIndex(0);
        setDisplayedText('');
        setIsTyping(true);
    };

    const currentNodeData = DIALOGUE_TREE[currentNode];
    const isWaitingForChoice = !isTyping && lineIndex === (currentNodeData?.agent?.length - 1 || 0) && currentNodeData?.choices;

    return (
        <div className="relative w-full h-full bg-slate-950 flex items-center justify-center overflow-hidden font-sans select-none">
            
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

            {/* Desktop Background elements just to frame the phone slightly if needed */}
            <div className="absolute inset-0 bg-[#121c26]">
                {/* Subtle blurred background */}
                <div className="absolute inset-0 bg-blue-900/10 backdrop-blur-3xl"></div>
            </div>

            {/* Phone Device UI (Zoom Call Active) */}
            {(phase === 'zoom_dialogue') && (
                <div className="absolute inset-0 z-50 flex animate-fade-in pointer-events-none items-end justify-end p-8 transition-all duration-1000">
                    <div className="w-[320px] h-[650px] bg-slate-900 rounded-[50px] p-2 relative flex flex-col transform shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto border-[4px] border-slate-800 scale-[0.85] origin-bottom-right">
                        
                        {/* Hardware Buttons */}
                        <div className="absolute top-[120px] -left-2.5 w-1.5 h-12 bg-slate-700 rounded-l-md"></div>
                        <div className="absolute top-[180px] -left-2.5 w-1.5 h-12 bg-slate-700 rounded-l-md"></div>
                        <div className="absolute top-[140px] -right-2.5 w-1.5 h-16 bg-slate-700 rounded-r-md"></div>

                        {/* Phone Screen */}
                        <div 
                            className="flex-1 bg-slate-900 rounded-[40px] overflow-hidden relative flex flex-col items-center border-4 border-black cursor-pointer"
                            onClick={handleDialogueInteraction}
                        >
                            {/* Zoom Video Background */}
                            <div className="absolute inset-0 bg-black z-0 overflow-hidden">
                                {/* Fake webcam feed of officer */}
                                <div className="absolute inset-0 bg-slate-800">
                                    <div className="absolute inset-0 opacity-40 mix-blend-luminosity" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1550831107-1553da8c8464?q=80&w=1000&auto=format&fit=crop")', backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
                                    <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-slate-900/90"></div>
                                </div>

                                {/* Low Battery / Time Indicator */}
                                <div className="absolute top-12 right-4 flex items-center gap-2 z-20">
                                    <span className="text-white text-xs font-mono drop-shadow-md">12:45 PM</span>
                                    <div className="w-6 h-3 border border-red-500 rounded-sm p-[1px] relative">
                                        <div className="w-[15%] h-full bg-red-500 rounded-sm animate-pulse"></div>
                                        <div className="absolute -right-1 top-0.5 w-[1px] h-1.5 bg-red-500"></div>
                                    </div>
                                    <span className="text-red-500 text-[10px] font-bold absolute -bottom-4 right-0 whitespace-nowrap">Battery Low</span>
                                </div>
                                
                                <div className="absolute top-12 left-4 z-20 bg-black/50 px-2 py-1 rounded text-[10px] text-white flex items-center gap-1 backdrop-blur-sm border border-white/10">
                                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                                    REC 03:07:42
                                </div>
                            </div>

                            {/* Dialogue Area */}
                            {displayedText && (
                                <div className="absolute bottom-24 left-0 right-0 z-30 px-4 animate-fade-in pointer-events-none">
                                    <div className="bg-black/80 border border-slate-700 p-4 rounded-xl shadow-2xl backdrop-blur-md">
                                        <div className="text-xs text-blue-400 font-bold mb-1 uppercase tracking-wider flex items-center gap-2">
                                            <div className="w-4 h-4 bg-blue-900 rounded-full flex items-center justify-center border border-blue-500">
                                                <svg className="w-2.5 h-2.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                            </div>
                                            Sr. Officer Rajesh Sharma
                                        </div>
                                        <p className="text-white text-sm leading-relaxed font-medium">
                                            {displayedText}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Choices */}
                            {isWaitingForChoice && (
                                <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm flex flex-col justify-end p-4 pb-28 animate-fade-in pointer-events-auto">
                                    <div className="flex flex-col gap-2">
                                        {currentNodeData.choices.map((choice, i) => (
                                            <button
                                                key={i}
                                                className="bg-slate-800 hover:bg-slate-700 text-left text-white text-sm p-4 rounded-xl border border-slate-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleChoiceSelect(choice.next);
                                                }}
                                            >
                                                {choice.text}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Zoom Toolbar (Phone Version) */}
                            <div className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] h-14 flex items-center justify-around border-t border-slate-700/50 shadow-lg z-30 pointer-events-none">
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
                                <div className="flex flex-col items-center gap-1 opacity-30">
                                    <div className="px-3 py-1.5 rounded bg-red-600 text-white text-[10px] font-bold shadow-md">
                                        Leave
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fade-in-out { 0% { opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                `
            }} />
        </div>
    );
};

export default Level13;
