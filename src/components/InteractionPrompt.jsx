import React from 'react';

const InteractionPrompt = ({ text, showKey = true }) => (
    <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-[5000] flex flex-col items-center pb-8">
        {/* Dark gradient backdrop strip */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        
        {/* Content */}
        <div className="relative flex flex-col items-center gap-3 animate-pulse">
            {/* Gradient line */}
            <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            
            {/* Prompt with key badge */}
            <div className="flex items-center gap-3 whitespace-nowrap">
                {showKey && (
                    <span className="w-7 h-7 flex items-center justify-center bg-white text-black font-black text-xs rounded-md shadow-[0_0_15px_rgba(255,255,255,0.4)] border border-white/80">
                        E
                    </span>
                )}
                <span className="text-white font-bold text-sm uppercase tracking-[0.25em] drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    {text.replace(/^Press E (to )?/i, '')}
                </span>
            </div>
        </div>
    </div>
);

export default InteractionPrompt;
