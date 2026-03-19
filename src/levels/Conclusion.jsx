import React, { useState, useEffect, useMemo } from 'react';
import { useGameState } from '../context/GameStateContext';

const Conclusion = () => {
    const { assets, enterLevel, adjustAssets } = useGameState();
    
    // ═══ STATE ═══
    const [phase, setPhase] = useState('dialogue'); // 'dialogue' | 'reward' | 'final'
    const [dialogueIndex, setDialogueIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // ═══ BUSINESS LOGIC ═══
    const successAmount = 3700000;
    const isSuccess = assets >= successAmount;
    const lostAmount = 4200000 - assets;

    // ═══ DIALOGUES ═══
    const currentDialogues = useMemo(() => {
        const pathADialogues = [
            { speaker: 'GRANDPA', text: "I am back. And I can already tell — you have a story to tell me.", portrait: '/assets/grandstudy.jpg' },
            { speaker: 'PLAYER', text: "Thatha… a lot happened while you were away.", portrait: '/assets/protagonist.png' },
            { speaker: 'GRANDPA', text: "Come. Sit. Before anything else — tell me one thing. I gave you forty-two lakh rupees to protect. How much of it is still safe?", portrait: '/assets/grandstudy.jpg' },
            { speaker: 'PLAYER', text: `Thatha — I have ₹${assets.toLocaleString('en-IN')} safe. Every scam that came, I stopped it. I did not share any OTP. I did not click suspicious links. I verified every call. I protected what you gave me.`, portrait: '/assets/protagonist.png' },
            { speaker: 'GRANDPA', text: "Do you know how many people lose everything to these scammers? Educated people. Smart people. They panic. They trust the wrong voice. They click without thinking.", portrait: '/assets/grandstudy.jpg' },
            { speaker: 'PLAYER', text: "I almost made mistakes too, Thatha. But I remembered your words.", portrait: '/assets/protagonist.png' },
            { speaker: 'GRANDPA', text: "And that is exactly why I chose you. The forty-two lakhs — they are yours.", portrait: '/assets/grandstudy.jpg' },
            { speaker: 'GRANDPA', text: "Every rupee. All accounts, all FD certificates, all insurance policies. Transferred to your name today.", portrait: '/assets/grandstudy.jpg' },
            { speaker: 'GRANDPA', text: "Plus — whatever extra you saved by stopping those scammers — that is your bonus. You earned every paisa of it.", portrait: '/assets/grandstudy.jpg' },
            { speaker: 'PLAYER', text: "Thatha… I don't know what to say.", portrait: '/assets/protagonist.png' },
            { speaker: 'GRANDPA', text: "Then don't say anything. Just promise me one thing — teach one person every month what you learned. Your neighbour, your friend, your colleague. One person. Every month.", portrait: '/assets/grandstudy.jpg' },
            { speaker: 'PLAYER', text: "I promise.", portrait: '/assets/protagonist.png' }
        ];

        const pathBDialogues = [
            { speaker: 'GRANDPA', text: "I am back. And I can already tell — you have a story to tell me.", portrait: '/assets/grandstudy.jpg' },
            { speaker: 'PLAYER', text: "Thatha… a lot happened while you were away.", portrait: '/assets/protagonist.png' },
            { speaker: 'GRANDPA', text: "Come. Sit. Before anything else — tell me one thing. I gave you forty-two lakh rupees to protect. How much of it is still safe?", portrait: '/assets/grandstudy.jpg' },
            { speaker: 'PLAYER', text: `Thatha… I tried. But some of them tricked me. I have ₹${assets.toLocaleString('en-IN')} left.`, portrait: '/assets/protagonist.png' },
            { speaker: 'GRANDPA', text: "How much was lost?", portrait: '/assets/grandstudy.jpg' },
            { speaker: 'PLAYER', text: `Around ₹${lostAmount.toLocaleString('en-IN')}, Thatha. I am sorry.`, portrait: '/assets/protagonist.png' },
            { speaker: 'GRANDPA', text: "Do not be sorry. Be curious. Tell me — which one caught you? Where did you slip?", portrait: '/assets/grandstudy.jpg' },
            { speaker: 'PLAYER', text: "[ You explain the scam that succeeded. Thatha listens without interrupting. ]", portrait: '/assets/protagonist.png' },
            { speaker: 'GRANDPA', text: "I see. You know what the scammer's biggest weapon was? Not technology. Not fake websites. It was your hesitation to verify. The moment you almost believed them — that was the moment they won.", portrait: '/assets/grandstudy.jpg' },
            { speaker: 'PLAYER', text: "I understand now. I should have slowed down.", portrait: '/assets/protagonist.png' },
            { speaker: 'GRANDPA', text: "Yes. And that is a lesson that money cannot teach — only experience can. What was lost — we can recover over time. What you learned today — that stays with you forever.", portrait: '/assets/grandstudy.jpg' },
            { speaker: 'GRANDPA', text: "You are close — but not there yet. Go back. Study every scam you missed. Understand why it worked on you. When you can stop each one without hesitation — that day, the full forty-two lakhs will be yours.", portrait: '/assets/grandstudy.jpg' },
        ];

        return isSuccess ? pathADialogues : pathBDialogues;
    }, [isSuccess, assets, lostAmount]);

    // ═══ TYPING EFFECT ═══
    useEffect(() => {
        if (phase !== 'dialogue') return;

        let isMounted = true;
        setDisplayedText('');
        setIsTyping(true);

        const currentText = currentDialogues[dialogueIndex].text;
        let i = 0;

        const typeChar = () => {
            if (!isMounted) return;
            if (i < currentText.length) {
                setDisplayedText(currentText.substring(0, i + 1));
                i++;
                setTimeout(typeChar, 35);
            } else {
                setIsTyping(false);
            }
        };

        const timer = setTimeout(typeChar, 35);
        return () => { isMounted = false; clearTimeout(timer); };
    }, [phase, dialogueIndex, currentDialogues]);

    const handleDialogueInteraction = () => {
        if (isTyping) {
            setDisplayedText(currentDialogues[dialogueIndex].text);
            setIsTyping(false);
        } else {
            if (dialogueIndex < currentDialogues.length - 1) {
                setDialogueIndex(prev => prev + 1);
            } else {
                setPhase('reward');
            }
        }
    };

    // ═══ RENDERERS ═══
    const renderDialogue = () => {
        const currentDialogue = currentDialogues[dialogueIndex];

        return (
            <div className="w-full h-full bg-black flex flex-col items-center justify-end p-8 pb-12 relative overflow-hidden cursor-pointer" onClick={handleDialogueInteraction}>
                {/* Background - Living Room Study Room Blend */}
                <div className="absolute inset-0 bg-cover bg-center blur-sm opacity-40 scale-105" style={{ backgroundImage: 'url("/assets/roomwithgrandpa.png")' }} />
                
                {/* Lighting Vignette */}
                <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]"></div>

                {/* Portraits */}
                <div className="absolute inset-x-0 bottom-0 top-0 flex items-end justify-between px-12 pb-48 pointer-events-none overflow-visible z-20">
                    <div className={`transition-all duration-700 transform ${currentDialogue.speaker === 'PLAYER' ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0'}`} style={{ width: '40%' }}>
                        <img src="/assets/protagonist.png" alt="Player" className="w-full h-auto max-h-[550px] object-contain drop-shadow-[0_20px_50px_rgba(79,70,229,0.4)]" />
                    </div>
                    <div className={`transition-all duration-700 transform ${currentDialogue.speaker === 'GRANDPA' ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0'}`} style={{ width: '40%' }}>
                        <img src="/assets/grandstudy.jpg" alt="Grandpa" className="w-full h-auto max-h-[550px] object-contain drop-shadow-[0_20px_50px_rgba(239,68,68,0.4)] scale-x-[-1]" />
                    </div>
                </div>

                {/* Dialogue Box */}
                <div className="relative z-30 w-full max-w-5xl animate-in slide-in-from-bottom-5 duration-500">
                    <div className="bg-slate-900/95 backdrop-blur-xl border-4 border-slate-700 p-6 md:p-8 rounded-2xl shadow-2xl relative min-h-[160px]">
                        <div className={`absolute -top-5 left-8 px-6 py-1.5 rounded-lg text-xs font-black tracking-widest uppercase border-2 shadow-lg ${currentDialogue.speaker === 'PLAYER' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-red-800 border-red-700 text-red-100'}`}>
                            {currentDialogue.speaker === 'PLAYER' ? 'You' : 'Grandfather Rajan'}
                        </div>
                        <div className="text-slate-100 text-lg md:text-xl font-medium leading-relaxed font-mono">
                            <span className="opacity-40 mr-2">"</span>
                            {displayedText}
                            {!isTyping && <span className="animate-pulse ml-2 text-cyan-400 font-black">▼</span>}
                            <span className="opacity-40 ml-2">"</span>
                        </div>
                        <div className="absolute bottom-4 right-6 text-[10px] text-slate-500 font-mono uppercase tracking-widest hidden sm:block font-bold">Click to continue</div>
                    </div>
                </div>
            </div>
        );
    };

    const renderReward = () => {
        if (isSuccess) {
            return (
                <div className="flex-1 flex flex-col bg-slate-950 p-6 md:p-12 overflow-y-auto custom-scrollbar relative font-sans w-full h-full align-center justify-center animate-in fade-in duration-1000">
                    <div className="absolute inset-0 bg-emerald-900/5 pointer-events-none"></div>
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-emerald-900/20 to-transparent pointer-events-none"></div>

                    <div className="max-w-4xl mx-auto w-full z-10 space-y-12">
                        {/* Success Reward Block */}
                        <div className="p-8 md:p-12 bg-slate-900/90 border-2 border-amber-500/50 rounded-[2rem] text-center shadow-[0_0_80px_rgba(245,158,11,0.2)] backdrop-blur-md relative overflow-hidden animate-in slide-in-from-bottom-10 duration-700">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[60px] rounded-full pointer-events-none"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none"></div>
                            
                            <h2 className="text-4xl md:text-5xl font-black text-amber-400 tracking-[0.2em] uppercase drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] mb-2">🏆 REWARD UNLOCKED 🏆</h2>
                            <p className="text-emerald-400 font-bold text-xl md:text-2xl mb-12 uppercase tracking-widest">Full ₹42,00,000 Transferred to You</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                                <div className="bg-slate-950/80 p-6 rounded-2xl border border-amber-500/30 text-left hover:bg-slate-900 transition-colors">
                                    <p className="text-xs text-slate-400 uppercase tracking-[0.2em] mb-2 font-mono">Bonus Reward</p>
                                    <p className="text-amber-500 font-black text-2xl">₹42 Crore + ₹{assets.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="bg-slate-950/80 p-6 rounded-2xl border border-indigo-500/30 text-left hover:bg-slate-900 transition-colors">
                                    <p className="text-xs text-slate-400 uppercase tracking-[0.2em] mb-2 font-mono">Final Rank</p>
                                    <p className="text-indigo-400 font-black text-2xl uppercase tracking-widest">Master Guardian</p>
                                </div>
                                <div className="bg-slate-950/80 p-6 rounded-2xl border border-cyan-500/30 text-left md:col-span-2 flex justify-between items-center hover:bg-slate-900 transition-colors">
                                    <div>
                                        <p className="text-xs text-slate-400 uppercase tracking-[0.2em] mb-2 font-mono">Cyber Safety Score</p>
                                        <p className="text-cyan-400 font-black text-3xl uppercase tracking-widest">EXCELLENT</p>
                                    </div>
                                    <div className="text-amber-400 text-4xl tracking-[0.1em] drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]">★★★★★</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center animate-in fade-in duration-1000 delay-500">
                            <button 
                                onClick={() => enterLevel(-2)}
                                className="group relative px-16 py-5 bg-white text-slate-900 font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-transform rounded-xl overflow-hidden shadow-[0_15px_40px_rgba(255,255,255,0.1)]"
                            >
                                <span className="relative z-10 flex items-center gap-4 text-lg">
                                    Continue <span className="group-hover:translate-x-2 transition-transform">→</span>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="flex-1 flex flex-col bg-slate-950 p-6 md:p-12 overflow-y-auto custom-scrollbar relative font-sans w-full h-full align-center justify-center animate-in fade-in duration-1000">
                    <div className="absolute inset-0 bg-red-900/5 pointer-events-none"></div>
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-red-900/10 to-transparent pointer-events-none"></div>

                    <div className="max-w-4xl mx-auto w-full z-10 space-y-12">
                        {/* Keep Learning Block */}
                        <div className="p-8 md:p-12 bg-slate-900/90 border-2 border-red-500/20 rounded-[2rem] text-center shadow-[0_0_80px_rgba(239,68,68,0.1)] backdrop-blur-md relative overflow-hidden animate-in slide-in-from-bottom-10 duration-700">
                            <h2 className="text-3xl font-black text-red-500 tracking-[0.2em] uppercase mb-12 flex items-center justify-center gap-6">
                                <span className="w-16 h-px bg-red-500/50 hidden md:block"></span>
                                RESULT — KEEP LEARNING
                                <span className="w-16 h-px bg-red-500/50 hidden md:block"></span>
                            </h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left mb-12">
                                <div className="bg-slate-950/80 p-6 rounded-2xl border border-red-500/20 flex items-start gap-4">
                                    <div className="text-3xl mt-1">💸</div>
                                    <div>
                                        <p className="text-slate-200 text-lg font-bold">₹{lostAmount.toLocaleString('en-IN')} Lost</p>
                                        <p className="text-slate-400 text-sm">Review what went wrong</p>
                                    </div>
                                </div>
                                <div className="bg-slate-950/80 p-6 rounded-2xl border border-blue-500/20 flex items-start gap-4">
                                    <div className="text-3xl mt-1">📚</div>
                                    <div>
                                        <p className="text-blue-300 text-lg font-bold">Action Needed</p>
                                        <p className="text-blue-500/80 text-sm">Go back and replay failed levels</p>
                                    </div>
                                </div>
                                <div className="bg-slate-950/80 p-6 rounded-2xl border border-slate-700/50 flex items-start gap-4">
                                    <div className="text-3xl mt-1 opacity-50 grayscale">🔒</div>
                                    <div>
                                        <p className="text-slate-400 text-lg font-black uppercase tracking-widest">Reward Locked</p>
                                        <p className="text-slate-600 text-sm">Complete your learning first</p>
                                    </div>
                                </div>
                                <div className="bg-slate-950/80 p-6 rounded-2xl border border-indigo-500/30 flex items-start gap-4">
                                    <div className="text-3xl mt-1">💪</div>
                                    <div>
                                        <p className="text-indigo-300 text-lg font-bold">Thatha's Message</p>
                                        <p className="text-indigo-500 text-sm italic">"You are close. Don't give up."</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-950/60 border border-amber-500/30 p-8 rounded-2xl text-left inline-block w-full max-w-3xl">
                                <h3 className="text-base font-black text-amber-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                                    <span>🎯</span> HOW TO UNLOCK THE SUCCESS PATH
                                </h3>
                                <ul className="space-y-4 font-mono text-sm text-slate-300">
                                    <li className="flex gap-4 items-start"><span className="text-amber-500 font-bold shrink-0">1.</span> Replay any level where you lost money.</li>
                                    <li className="flex gap-4 items-start"><span className="text-amber-500 font-bold shrink-0">2.</span> Study the Cyber Tip in each level carefully.</li>
                                    <li className="flex gap-4 items-start"><span className="text-amber-500 font-bold shrink-0">3.</span> Reach a final balance of ₹37,00,000 or above.</li>
                                    <li className="flex gap-4 items-start"><span className="text-amber-500 font-bold shrink-0">4.</span> Return to Thatha — the full ₹42 lakhs will be waiting.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex justify-center animate-in fade-in duration-1000 delay-500">
                            <button 
                                onClick={() => enterLevel(-2)}
                                className="group relative px-16 py-5 bg-white text-slate-900 font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-transform rounded-xl overflow-hidden shadow-[0_15px_40px_rgba(255,255,255,0.1)]"
                            >
                                <span className="relative z-10 flex items-center gap-4 text-lg">
                                    Continue <span className="group-hover:translate-x-2 transition-transform">→</span>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
    };



    return (
        <React.Fragment>
            {phase === 'dialogue' && renderDialogue()}
            {phase === 'reward' && renderReward()}
        </React.Fragment>
    );
};

export default Conclusion;
