import React from 'react';

export const Building = React.memo(({ x, y, width = 120, height = 300, color = 'bg-slate-800', neon = 'bg-cyan-400', zIndexOffset = 0 }) => {
    const neonBright = neon === 'bg-cyan-400' ? '#22d3ee' :
        neon === 'bg-fuchsia-500' ? '#d946ef' :
            neon === 'bg-emerald-400' ? '#10b981' : '#fde047';

    // Stable random-ish seeds based on position
    const seed = Math.abs(Math.sin(x * 12.34 + y * 56.78));
    const hasBalcony = seed > 0.7;
    const hasACUnits = seed > 0.4;
    const hasExternalPipes = seed > 0.6;

    return (
        <div className="absolute flex flex-col items-center pointer-events-none" style={{ left: x, top: y, zIndex: Math.floor(y) + zIndexOffset }}>
            <div className={`${color} border-l border-t border-slate-700/50 shadow-[10px_0_30px_rgba(0,0,0,0.5),inset_-5px_0_15px_rgba(0,0,0,0.3)] relative group overflow-hidden`} style={{ width, height }}>

                {/* Structural Paneling Detail */}
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'linear-gradient(90deg, transparent 95%, rgba(0,0,0,0.5) 95%), linear-gradient(transparent 98%, rgba(0,0,0,0.5) 98%)',
                    backgroundSize: '40px 60px'
                }} />

                {/* Window Glow Grid */}
                <div className="absolute top-10 bottom-20 left-4 right-4 grid grid-cols-4 gap-2 opacity-40">
                    {[...Array(16)].map((_, i) => (
                        <div key={i} className={`w-full h-8 rounded-sm ${(i + Math.floor(seed * 10)) % 7 === 0 ? neon : 'bg-slate-900'} transition-colors duration-1000`}
                            style={{ boxShadow: (i + Math.floor(seed * 10)) % 7 === 0 ? `0 0 10px ${neonBright}66` : 'none' }} />
                    ))}
                </div>

                {/* External Props (CSS Details) */}
                {hasACUnits && (
                    <div className="absolute left-1 top-20 flex flex-col gap-12 opacity-80">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="w-4 h-3 bg-slate-700 border-b border-black rounded-sm shadow-md">
                                <div className="w-px h-full bg-slate-500 absolute left-1" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Balcony Detail */}
                {hasBalcony && (
                    <div className="absolute bottom-32 left-0 right-0 h-4 bg-slate-900 border-y border-slate-700 shadow-xl">
                        <div className="absolute inset-x-2 -top-2 h-2 flex gap-1">
                            {[...Array(6)].map((_, i) => <div key={i} className="flex-1 bg-slate-600" />)}
                        </div>
                    </div>
                )}

                {/* Vertical Neon Accent Line */}
                <div className="absolute top-0 right-2 w-0.5 h-full opacity-60" style={{ backgroundColor: neonBright, boxShadow: `0 0 15px ${neonBright}` }} />

                {/* External Piping */}
                {hasExternalPipes && (
                    <div className="absolute top-0 left-full -ml-2 w-1.5 h-full bg-slate-900 opacity-60 border-x border-slate-800" />
                )}

                {/* Roof Tech Props */}
                <div className="absolute -top-6 left-6 w-8 h-12 bg-slate-900 border-x border-slate-700">
                    <div className="w-1 h-1 bg-red-500 rounded-full absolute top-1 left-1 animate-pulse" />
                </div>

                {/* Ground Level Entrance Glow */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-20 bg-slate-950 border-t-2 border-x-2 border-slate-800 flex justify-center pt-2">
                    <div className="w-10 h-1 bg-cyan-400/20 blur-[2px]" />
                </div>

                {/* Side shadow depth */}
                <div className="absolute top-0 right-0 w-4 h-full bg-gradient-to-l from-black/40 to-transparent" />
            </div>
        </div>
    );
});

export const StreetLight = React.memo(({ x, y, isLeft = true }) => (
    <div className="absolute flex flex-col items-center pointer-events-none" style={{ left: x, top: y, zIndex: Math.floor(y) }}>
        {/* Soft Volumetric Light Pool on Ground */}
        <div className="absolute -bottom-4 w-48 h-12 bg-cyan-500/5 rounded-full blur-xl z-0" />
        <div className="absolute -bottom-2 w-20 h-6 bg-cyan-400/10 rounded-full blur-md z-0" />

        {/* Pole with Metallic Gradient */}
        <div className="w-2 h-36 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-800 rounded-t-full shadow-2xl relative z-10 border-x border-slate-500/20">
            {/* Base Detail */}
            <div className="absolute -bottom-1 -left-1 w-4 h-3 bg-slate-800 border-x border-t border-slate-600 rounded-t-sm" />
        </div>

        {/* Lamp Arm and Housing */}
        <div className={`absolute top-2 w-24 h-2 bg-slate-700 rounded-full ${isLeft ? 'left-1' : 'right-1'} z-20 border-b border-slate-800 shadow-md`}>
            {/* Lamp Head */}
            <div className={`absolute ${isLeft ? 'right-0' : 'left-0'} -bottom-1.5 w-12 h-4 bg-slate-800 rounded-sm border border-slate-600 shadow-xl flex justify-center items-center`}>
                <div className="w-8 h-1.5 bg-cyan-200 rounded-full shadow-[0_0_15px_rgba(165,243,252,0.8)]" />
            </div>

            {/* Volumetric Beam (CSS Gradient) */}
            <div className={`absolute top-4 ${isLeft ? 'right-0' : 'left-0'} w-40 h-80 opacity-10 pointer-events-none`} style={{
                background: `linear-gradient(to bottom, rgba(34,211,238,0.2) 0%, transparent 100%)`,
                clipPath: isLeft ? 'polygon(75% 0, 100% 0, 100% 100%, 0% 100%)' : 'polygon(0 0, 25% 0, 100% 100%, 0% 100%)'
            }} />
        </div>
    </div>
));

export const Billboard = React.memo(({ x, y, text = "PATCH", color = "text-cyan-400", glow = "shadow-[0_0_40px_rgba(34,211,238,0.3)]" }) => (
    <div className="absolute flex flex-col items-center pointer-events-none" style={{ left: x, top: y, zIndex: Math.floor(y) }}>
        <div className="flex gap-20 absolute top-20 z-0">
            <div className="w-4 h-48 bg-slate-900 border-x border-slate-800 shadow-2xl" />
            <div className="w-4 h-48 bg-slate-900 border-x border-slate-800 shadow-2xl" />
        </div>
        <div className={`w-64 h-32 bg-slate-950 border-4 border-slate-800 rounded-lg z-10 relative flex flex-col items-center justify-center overflow-hidden ${glow}`}>
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-20 pointer-events-none animate-pulse" />
            <h2 className={`font-black text-4xl ${color} tracking-widest z-10 scale-110 drop-shadow-[0_0_15px_currentColor] animate-flicker`}>
                {text}
            </h2>
            <div className="absolute bottom-2 right-4 flex gap-1 opacity-50">
                <div className="w-1 h-3 bg-red-500 animate-pulse" />
                <div className="w-1 h-3 bg-emerald-500 animate-pulse [animation-delay:0.5s]" />
            </div>
            <style jsx>{`
                @keyframes flicker {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    92% { opacity: 1; transform: scale(1); }
                    93% { opacity: 0.5; transform: scale(0.98); }
                    94% { opacity: 1; transform: scale(1.02); }
                    95% { opacity: 0.8; }
                }
                .animate-flicker { animation: flicker 5s infinite; }
            `}</style>
        </div>
    </div>
));

export const CyberCrate = React.memo(({ x, y, variant = 'blue' }) => {
    const glow = variant === 'blue' ? 'shadow-[0_0_10px_rgba(34,211,238,0.4)] border-cyan-500/50' : 'shadow-[0_0_10px_rgba(239,68,68,0.4)] border-red-500/50';
    const accent = variant === 'blue' ? 'bg-cyan-500' : 'bg-red-500';

    return (
        <div className="absolute pointer-events-none" style={{ left: x, top: y, zIndex: Math.floor(y) }}>
            <div className={`w-12 h-12 bg-slate-900 border-2 ${glow} rounded-md relative flex flex-col items-center justify-center`}>
                <div className={`w-8 h-1 ${accent} opacity-40 mb-1 rounded-full`} />
                <div className="w-6 h-0.5 bg-slate-700 rounded-full" />
                <div className="w-10 h-0.5 bg-slate-800 absolute top-2" />
                <div className="w-10 h-0.5 bg-slate-800 absolute bottom-2" />
            </div>
            <div className="w-14 h-4 bg-black/40 rounded-full blur-[2px] -mt-2 -ml-1" />
        </div>
    );
});

export const TrashCan = React.memo(({ x, y }) => (
    <div className="absolute pointer-events-none" style={{ left: x, top: y, zIndex: Math.floor(y) }}>
        <div className="w-8 h-10 bg-slate-800 border-x border-slate-700 relative rounded-b-sm">
            <div className="absolute -top-1 w-10 -left-1 h-2 bg-slate-900 border border-slate-700 rounded-t-lg" />
            <div className="w-full h-px bg-slate-700 absolute top-2" />
            <div className="w-full h-px bg-slate-700 absolute top-5" />
            <div className="w-full h-px bg-slate-700 absolute top-8" />
        </div>
        <div className="w-10 h-3 bg-black/40 rounded-full blur-[3px] -mt-1 -ml-1" />
    </div>
));

export const UtilityBox = React.memo(({ x, y }) => (
    <div className="absolute pointer-events-none" style={{ left: x, top: y, zIndex: Math.floor(y) }}>
        <div className="w-16 h-24 bg-slate-900 border border-slate-700 relative shadow-xl">
            <div className="absolute top-2 left-2 w-12 h-8 bg-slate-950 border border-slate-800">
                <div className="w-full h-px bg-cyan-500/20 absolute top-1/2" />
                <div className="w-1 h-1 bg-emerald-500 absolute bottom-1 right-1 animate-pulse" />
            </div>
            <div className="absolute bottom-4 left-4 w-8 h-8 rounded-full border border-slate-800 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700" />
            </div>
            <div className="absolute -right-1 top-4 w-1 h-8 bg-slate-700 rounded-r-sm" />
        </div>
        <div className="w-18 h-4 bg-black/40 rounded-full blur-[2px] -mt-2 -ml-1" />
    </div>
));
