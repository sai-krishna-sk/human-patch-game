import React, { useState, useEffect } from 'react';
import { useGameState } from '../context/GameStateContext';

const getKeyCode = (key) => {
    switch (key) {
        case 'w': return 87;
        case 'a': return 65;
        case 's': return 83;
        case 'd': return 68;
        case 'arrowup': return 38;
        case 'arrowdown': return 40;
        case 'arrowleft': return 37;
        case 'arrowright': return 39;
        case 'e': return 69;
        case ' ': return 32;
        case 'enter': return 13;
        case 'escape': return 27;
        default: return 0;
    }
};

const MobileControls = () => {
    const { 
        showTouchControls: enabled, 
        setShowTouchControls: setEnabled,
        touchControlsScale,
        setIsPaused,
        currentLevel
    } = useGameState();

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
        setIsMobile(isTouch);
    }, []);

    const triggerKey = (key, eventType, e) => {
        if (e) {
            if (e.cancelable) e.preventDefault();
            e.stopPropagation();
        }

        let keyVal = key;
        let codeVal = '';

        if (key === 'w') { keyVal = 'w'; codeVal = 'KeyW'; }
        else if (key === 'a') { keyVal = 'a'; codeVal = 'KeyA'; }
        else if (key === 's') { keyVal = 's'; codeVal = 'KeyS'; }
        else if (key === 'd') { keyVal = 'd'; codeVal = 'KeyD'; }
        else if (key === 'arrowup') { keyVal = 'ArrowUp'; codeVal = 'ArrowUp'; }
        else if (key === 'arrowdown') { keyVal = 'ArrowDown'; codeVal = 'ArrowDown'; }
        else if (key === 'arrowleft') { keyVal = 'ArrowLeft'; codeVal = 'ArrowLeft'; }
        else if (key === 'arrowright') { keyVal = 'ArrowRight'; codeVal = 'ArrowRight'; }
        else if (key === 'e') { keyVal = 'e'; codeVal = 'KeyE'; }
        else if (key === ' ') { keyVal = ' '; codeVal = 'Space'; }
        else if (key === 'enter') { keyVal = 'Enter'; codeVal = 'Enter'; }
        else if (key === 'escape') { keyVal = 'Escape'; codeVal = 'Escape'; }

        const event = new KeyboardEvent(eventType, {
            key: keyVal,
            code: codeVal,
            keyCode: getKeyCode(key),
            which: getKeyCode(key),
            bubbles: true,
            cancelable: true
        });
        window.dispatchEvent(event);
    };

    const handleDirectionStart = (dir, e) => {
        if (dir === 'up') {
            triggerKey('w', 'keydown', e);
            triggerKey('arrowup', 'keydown');
        } else if (dir === 'down') {
            triggerKey('s', 'keydown', e);
            triggerKey('arrowdown', 'keydown');
        } else if (dir === 'left') {
            triggerKey('a', 'keydown', e);
            triggerKey('arrowleft', 'keydown');
        } else if (dir === 'right') {
            triggerKey('d', 'keydown', e);
            triggerKey('arrowright', 'keydown');
        }
    };

    const handleDirectionEnd = (dir, e) => {
        if (dir === 'up') {
            triggerKey('w', 'keyup', e);
            triggerKey('arrowup', 'keyup');
        } else if (dir === 'down') {
            triggerKey('s', 'keyup', e);
            triggerKey('arrowdown', 'keyup');
        } else if (dir === 'left') {
            triggerKey('a', 'keyup', e);
            triggerKey('arrowleft', 'keyup');
        } else if (dir === 'right') {
            triggerKey('d', 'keyup', e);
            triggerKey('arrowright', 'keyup');
        }
    };

    const buttonClass = "w-12 h-12 rounded-full bg-slate-950/80 border flex items-center justify-center text-white font-black text-sm shadow-md active:scale-90 active:bg-indigo-600/40 active:border-indigo-500/80 transition-all select-none touch-none backdrop-blur-md";

    return (
        <>
            {/* Mobile Pause Button */}
            {isMobile && (
                <div className="absolute top-6 right-6 z-[9999] select-none pointer-events-auto">
                    <button
                        onClick={() => setIsPaused(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full border bg-slate-900/60 border-slate-700/50 hover:border-indigo-500/50 text-white text-xs font-bold font-mono tracking-wider shadow-lg backdrop-blur-md transition-all active:scale-95"
                    >
                        <span>⏸️</span>
                        <span>Pause</span>
                    </button>
                </div>
            )}

            {/* Virtual Controls Overlay */}
            {enabled && (
                <div className="absolute inset-0 pointer-events-none z-[9990] flex justify-between items-end p-4 pb-6 select-none">
                    
                    {/* D-PAD (Movement Controls) - Scaled Down & Fades Out when idle */}
                    <div 
                        className="pointer-events-auto flex items-center justify-center relative w-32 h-32 bg-slate-900/40 border border-slate-800/80 rounded-full backdrop-blur-sm shadow-[inset_0_0_15px_rgba(0,0,0,0.6)] ml-2 opacity-50 active:opacity-100 transition-opacity duration-300"
                        style={{
                            transform: `scale(${touchControlsScale || 1.0})`,
                            transformOrigin: 'bottom left'
                        }}
                    >
                        
                        <div className="absolute inset-3 rounded-full border border-cyan-500/10 pointer-events-none"></div>

                        {/* UP BUTTON */}
                        <button
                            onTouchStart={(e) => handleDirectionStart('up', e)}
                            onTouchEnd={(e) => handleDirectionEnd('up', e)}
                            onTouchCancel={(e) => handleDirectionEnd('up', e)}
                            onMouseDown={(e) => handleDirectionStart('up', e)}
                            onMouseUp={(e) => handleDirectionEnd('up', e)}
                            onMouseLeave={(e) => handleDirectionEnd('up', e)}
                            className="absolute top-1 left-1/2 -translate-x-1/2 w-10 h-10 bg-slate-950/80 border border-slate-700/60 active:border-cyan-400 active:bg-cyan-500/20 active:shadow-[0_0_10px_rgba(34,211,238,0.4)] rounded-md flex items-center justify-center text-white/50 active:text-cyan-400 transition-all font-bold text-sm select-none touch-none"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            ▲
                        </button>

                        {/* LEFT BUTTON */}
                        <button
                            onTouchStart={(e) => handleDirectionStart('left', e)}
                            onTouchEnd={(e) => handleDirectionEnd('left', e)}
                            onTouchCancel={(e) => handleDirectionEnd('left', e)}
                            onMouseDown={(e) => handleDirectionStart('left', e)}
                            onMouseUp={(e) => handleDirectionEnd('left', e)}
                            onMouseLeave={(e) => handleDirectionEnd('left', e)}
                            className="absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-950/80 border border-slate-700/60 active:border-cyan-400 active:bg-cyan-500/20 active:shadow-[0_0_10px_rgba(34,211,238,0.4)] rounded-md flex items-center justify-center text-white/50 active:text-cyan-400 transition-all font-bold text-sm select-none touch-none"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            ◀
                        </button>

                        {/* CENTER CORE */}
                        <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800/80 flex items-center justify-center shadow-inner">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/40 animate-pulse"></div>
                        </div>

                        {/* RIGHT BUTTON */}
                        <button
                            onTouchStart={(e) => handleDirectionStart('right', e)}
                            onTouchEnd={(e) => handleDirectionEnd('right', e)}
                            onTouchCancel={(e) => handleDirectionEnd('right', e)}
                            onMouseDown={(e) => handleDirectionStart('right', e)}
                            onMouseUp={(e) => handleDirectionEnd('right', e)}
                            onMouseLeave={(e) => handleDirectionEnd('right', e)}
                            className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-950/80 border border-slate-700/60 active:border-cyan-400 active:bg-cyan-500/20 active:shadow-[0_0_10px_rgba(34,211,238,0.4)] rounded-md flex items-center justify-center text-white/50 active:text-cyan-400 transition-all font-bold text-sm select-none touch-none"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            ▶
                        </button>

                        {/* DOWN BUTTON */}
                        <button
                            onTouchStart={(e) => handleDirectionStart('down', e)}
                            onTouchEnd={(e) => handleDirectionEnd('down', e)}
                            onTouchCancel={(e) => handleDirectionEnd('down', e)}
                            onMouseDown={(e) => handleDirectionStart('down', e)}
                            onMouseUp={(e) => handleDirectionEnd('down', e)}
                            onMouseLeave={(e) => handleDirectionEnd('down', e)}
                            className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-10 bg-slate-950/80 border border-slate-700/60 active:border-cyan-400 active:bg-cyan-500/20 active:shadow-[0_0_10px_rgba(34,211,238,0.4)] rounded-md flex items-center justify-center text-white/50 active:text-cyan-400 transition-all font-bold text-sm select-none touch-none"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            ▼
                        </button>
                    </div>

                    {/* ACTION BUTTONS (E, SPACE, ESC) - Scaled Down & Fades Out when idle */}
                    <div 
                        className="pointer-events-auto flex flex-col gap-2 items-end mr-2 opacity-50 active:opacity-100 transition-opacity duration-300"
                        style={{
                            transform: `scale(${touchControlsScale || 1.0})`,
                            transformOrigin: 'bottom right'
                        }}
                    >
                        
                        {/* ESC / MENU BUTTON */}
                        <button
                            onTouchStart={(e) => triggerKey('escape', 'keydown', e)}
                            onTouchEnd={(e) => triggerKey('escape', 'keyup', e)}
                            onTouchCancel={(e) => triggerKey('escape', 'keyup', e)}
                            onMouseDown={(e) => triggerKey('escape', 'keydown', e)}
                            onMouseUp={(e) => triggerKey('escape', 'keyup', e)}
                            className="w-8 h-8 rounded-lg bg-slate-950/70 border border-slate-700/60 flex items-center justify-center text-white/50 font-mono text-[9px] uppercase tracking-wider shadow-md active:scale-90 active:bg-red-500/20 active:border-red-400 transition-all select-none touch-none backdrop-blur-md"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                            ESC
                        </button>

                        <div className="flex gap-3 items-end">
                            {/* SPACE / ENTER BUTTON (Dialogue / Action) */}
                            <button
                                onTouchStart={(e) => { triggerKey(' ', 'keydown', e); triggerKey('enter', 'keydown'); }}
                                onTouchEnd={(e) => { triggerKey(' ', 'keyup', e); triggerKey('enter', 'keyup'); }}
                                onTouchCancel={(e) => { triggerKey(' ', 'keyup', e); triggerKey('enter', 'keyup'); }}
                                onMouseDown={(e) => { triggerKey(' ', 'keydown', e); triggerKey('enter', 'keydown'); }}
                                onMouseUp={(e) => { triggerKey(' ', 'keyup', e); triggerKey('enter', 'keyup'); }}
                                className={`${buttonClass} border-violet-700/50 hover:border-violet-500/80 active:bg-violet-600/40`}
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                            >
                                <div className="flex flex-col items-center">
                                    <span className="text-[8px] text-violet-400 font-mono tracking-tighter -mb-1">ACTION</span>
                                    <span className="text-xs font-bold">SPACE</span>
                                </div>
                            </button>

                            {/* E BUTTON (Interact) */}
                            <button
                                onTouchStart={(e) => triggerKey('e', 'keydown', e)}
                                onTouchEnd={(e) => triggerKey('e', 'keyup', e)}
                                onTouchCancel={(e) => triggerKey('e', 'keyup', e)}
                                onMouseDown={(e) => triggerKey('e', 'keydown', e)}
                                onMouseUp={(e) => triggerKey('e', 'keyup', e)}
                                className={`${buttonClass} w-14 h-14 bg-slate-950/80 border-pink-700/50 hover:border-pink-500/80 active:bg-pink-600/40 text-pink-400`}
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                            >
                                <div className="flex flex-col items-center">
                                    <span className="text-[8px] text-pink-500/70 font-mono tracking-widest -mb-1">TALK</span>
                                    <span className="text-lg font-black">E</span>
                                </div>
                            </button>
                        </div>
                    </div>

                </div>
            )}
        </>
    );
};

export default MobileControls;
