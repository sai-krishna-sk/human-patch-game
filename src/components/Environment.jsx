import React from 'react';

export const Building = ({ x, y, width = 120, height = 300, color = 'bg-slate-800', neon = 'bg-cyan-400', zIndexOffset = 0 }) => {
    const neonRgba = neon === 'bg-cyan-400' ? 'rgba(34,211,238,0.4)' :
        neon === 'bg-fuchsia-500' ? 'rgba(217,70,239,0.4)' :
            neon === 'bg-emerald-400' ? 'rgba(16,185,129,0.4)' : 'rgba(253,224,71,0.4)';

    const neonBright = neon === 'bg-cyan-400' ? '#22d3ee' :
        neon === 'bg-fuchsia-500' ? '#d946ef' :
            neon === 'bg-emerald-400' ? '#10b981' : '#fde047';

    return (
        <div className="absolute flex flex-col items-center pointer-events-none" style={{ left: x, top: y, zIndex: Math.floor(y) + zIndexOffset }}>
            <div className={`${color} border-l-2 border-t-2 border-slate-600/50 relative overflow-hidden`} style={{ width, height, boxShadow: `inset -4px 0 15px rgba(0,0,0,0.5), 10px 0 25px rgba(0,0,0,0.6)` }}>
                {/* Roof machinery */}
                <div className="w-full h-6 bg-slate-900 border-b border-slate-700 absolute top-0 flex items-center px-3 gap-2">
                    <div className="w-6 h-10 bg-slate-700 absolute -top-10 left-3 border border-slate-600">
                        <div className="w-2 h-2 bg-red-500 rounded-full absolute -top-1 left-2" style={{ boxShadow: `0 0 6px rgba(239,68,68,0.8)` }}></div>
                    </div>
                    {width > 150 && <div className="w-3 h-14 bg-slate-600 absolute -top-14 right-6"></div>}
                </div>

                {/* Window grid — pure CSS pattern */}
                <div className="absolute top-8 bottom-24 left-4 right-4 opacity-50" style={{
                    backgroundImage: `
                        linear-gradient(${neonRgba} 1px, transparent 1px),
                        linear-gradient(90deg, ${neonRgba} 1px, transparent 1px),
                        radial-gradient(circle 2px, ${neonBright}44 0%, transparent 3px)
                    `,
                    backgroundSize: '20px 24px, 20px 24px, 20px 24px',
                    backgroundPosition: '0 0, 0 0, 10px 12px'
                }}></div>

                {/* Neon accent strip on side */}
                <div className="absolute top-0 right-0 w-0.5 h-full" style={{ backgroundColor: neonBright, boxShadow: `0 0 8px ${neonRgba}` }}></div>

                {/* Ground fog */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent"></div>

                {/* Ground floor entrance */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-16 bg-zinc-950 border-t-2 border-x-2 rounded-t-sm" style={{ borderColor: neonBright + '66' }}></div>
            </div>
        </div>
    );
};

export const StreetLight = ({ x, y, isLeft = true }) => (
    <div className="absolute flex flex-col items-center pointer-events-none" style={{ left: x, top: y, zIndex: Math.floor(y) }}>
        {/* Light pool on ground */}
        <div className="absolute -bottom-2 w-36 h-8 bg-cyan-900/20 rounded-full blur-lg z-0"></div>
        <div className="absolute -bottom-2 w-16 h-4 bg-cyan-400/10 rounded-full blur-md z-0"></div>

        {/* Pole */}
        <div className="w-1.5 h-28 bg-slate-600 rounded-t-sm z-10 relative border-l border-slate-500" style={{ boxShadow: '3px 0 8px rgba(0,0,0,0.4)' }}>
            {/* Base plate */}
            <div className="absolute -bottom-1 -left-2 w-6 h-2 bg-slate-700 rounded-sm"></div>
        </div>

        {/* Lamp arm */}
        <div className={`absolute top-0 w-20 h-1.5 bg-slate-600 rounded-full ${isLeft ? 'left-0' : 'right-0'} z-10`}>
            {/* Lamp housing */}
            <div className={`absolute ${isLeft ? 'right-0' : 'left-0'} -bottom-1 w-10 h-3 bg-slate-700 rounded-sm flex justify-center items-center`}>
                <div className="w-6 h-1.5 bg-cyan-300 rounded-sm" style={{ boxShadow: '0 0 8px rgba(34,211,238,0.8)' }}></div>
            </div>
            {/* Light cone — static, no filter for performance */}
            <div className={`absolute top-4 ${isLeft ? 'right-0' : 'left-0'} w-24 h-32 opacity-10`} style={{
                background: 'linear-gradient(to bottom, rgba(34,211,238,0.3), transparent)',
                transform: isLeft ? 'skewX(-10deg)' : 'skewX(10deg)'
            }}></div>
        </div>
    </div>
);

export const Billboard = ({ x, y, text = "CYBER", color = "text-fuchsia-500", glow = "shadow-[0_0_30px_rgba(217,70,239,0.5)]" }) => (
    <div className="absolute flex flex-col items-center pointer-events-none" style={{ left: x, top: y, zIndex: Math.floor(y) }}>
        {/* Support poles */}
        <div className="flex gap-16 absolute top-16 z-0">
            <div className="w-3 h-28 bg-slate-800 border-l border-slate-600"></div>
            <div className="w-3 h-28 bg-slate-800 border-l border-slate-600"></div>
        </div>

        {/* Billboard screen */}
        <div className={`w-48 h-20 bg-slate-950 border-2 border-slate-700 rounded z-10 relative flex items-center justify-center overflow-hidden ${glow}`}>
            {/* Scanline effect — pure CSS */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.1) 3px, rgba(255,255,255,0.1) 4px)' }}></div>
            <h2 className={`font-black text-2xl ${color} tracking-[0.3em] z-10`} style={{ textShadow: '0 0 8px currentColor' }}>
                {text}
            </h2>
        </div>
    </div>
);

export const ConcreteBlock = ({ x, y }) => (
    <div className="absolute flex flex-col items-center pointer-events-none" style={{ left: x, top: y, zIndex: Math.floor(y) }}>
        <div className="w-14 h-10 bg-slate-600 border-t-2 border-l-2 border-slate-500 rounded-sm relative z-10 flex overflow-hidden" style={{ boxShadow: '6px 6px 12px rgba(0,0,0,0.5)' }}>
            <div className="w-3.5 h-full bg-yellow-500/80"></div>
            <div className="w-3.5 h-full bg-zinc-900/80"></div>
            <div className="w-3.5 h-full bg-yellow-500/80"></div>
            <div className="w-3.5 h-full bg-zinc-900/80"></div>
        </div>
        <div className="w-18 h-3 bg-black/40 rounded-full blur-[3px] absolute -bottom-1 z-0" style={{ width: '72px' }}></div>
    </div>
);
