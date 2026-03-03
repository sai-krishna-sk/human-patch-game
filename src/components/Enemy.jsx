import React from 'react';

const Enemy = React.memo(({ x, y, type }) => {
    // Different threat colors based on type
    const visorColor = type === 'Phisher' ? 'bg-red-500' :
        type === 'OTP Scammer' ? 'bg-amber-500' :
            type === 'Data Broker' ? 'bg-fuchsia-500' : 'bg-cyan-400';

    const glowColor = type === 'Phisher' ? 'shadow-[0_0_8px_rgba(239,68,68,0.8)]' :
        type === 'OTP Scammer' ? 'shadow-[0_0_8px_rgba(245,158,11,0.8)]' :
            type === 'Data Broker' ? 'shadow-[0_0_8px_rgba(217,70,239,0.8)]' : 'shadow-[0_0_8px_rgba(34,211,238,0.8)]';

    const labelBorder = type === 'Phisher' ? 'border-red-500/40' :
        type === 'OTP Scammer' ? 'border-amber-500/40' :
            type === 'Data Broker' ? 'border-fuchsia-500/40' : 'border-cyan-500/40';

    const labelText = type === 'Phisher' ? 'text-red-400' :
        type === 'OTP Scammer' ? 'text-amber-400' :
            type === 'Data Broker' ? 'text-fuchsia-400' : 'text-cyan-400';

    const threatLevel = type === 'Phisher' ? 'LVL 2' :
        type === 'OTP Scammer' ? 'LVL 1' :
            type === 'Data Broker' ? 'LVL 3' : 'LVL 4';

    return (
        <div
            className="absolute z-20"
            style={{
                left: x,
                top: y,
                width: 50,
                height: 75,
            }}
        >
            <div className="relative w-full h-full flex flex-col items-center group cursor-pointer">
                {/* Ground Shadow */}
                <div className="absolute -bottom-1 w-14 h-3 bg-black/40 rounded-full blur-[3px]"></div>

                {/* Character */}
                <div className="relative flex flex-col items-center z-10">

                    {/* Hood */}
                    <div className="w-11 h-7 bg-zinc-900 rounded-t-full absolute -top-1 z-20 border-t border-zinc-700"></div>

                    {/* Head */}
                    <div className="w-10 h-10 bg-zinc-950 rounded-full border border-zinc-800 flex flex-col items-center justify-center relative z-10 shadow-[inset_0_-3px_8px_rgba(0,0,0,0.9)]">
                        {/* Hood shadow */}
                        <div className="absolute top-0 left-0 right-0 h-5 bg-zinc-900 rounded-t-full z-20"></div>
                        {/* Glowing Visor */}
                        <div className={`w-7 h-2 ${visorColor} rounded-sm mt-1 relative z-30 ${glowColor}`}></div>
                    </div>

                    {/* Body — Dark Hoodie */}
                    <div className="w-13 h-12 bg-zinc-900 rounded-md border border-zinc-800 relative flex justify-center overflow-hidden shadow-lg -mt-1" style={{ width: '52px' }}>
                        {/* Hood drawstrings */}
                        <div className="absolute top-0 left-5 w-0.5 h-3 bg-zinc-600"></div>
                        <div className="absolute top-0 right-5 w-0.5 h-3 bg-zinc-600"></div>
                        {/* Hoodie pocket */}
                        <div className="absolute bottom-2 w-10 h-4 bg-zinc-950/50 rounded-t-sm border-t border-zinc-700/50"></div>
                        {/* Arms */}
                        <div className="absolute -left-2 top-0 w-3 h-9 bg-zinc-800 rounded-full border border-zinc-700"></div>
                        <div className="absolute -right-2 top-0 w-3 h-9 bg-zinc-800 rounded-full border border-zinc-700"></div>
                        {/* Gloved hands */}
                        <div className="absolute -left-2 top-8 w-3 h-2.5 bg-zinc-950 rounded-full"></div>
                        <div className="absolute -right-2 top-8 w-3 h-2.5 bg-zinc-950 rounded-full"></div>
                    </div>

                    {/* Legs */}
                    <div className="flex gap-0.5 -mt-0.5">
                        <div className="w-4 h-4 bg-zinc-950 rounded-b-sm"></div>
                        <div className="w-4 h-4 bg-zinc-950 rounded-b-sm"></div>
                    </div>

                    {/* Shoes */}
                    <div className="flex gap-1 -mt-0.5">
                        <div className="w-4.5 h-1.5 bg-zinc-800 rounded-b-md rounded-t-sm" style={{ width: '18px' }}></div>
                        <div className="w-4.5 h-1.5 bg-zinc-800 rounded-b-md rounded-t-sm" style={{ width: '18px' }}></div>
                    </div>
                </div>

                {/* Threat Label */}
                <div className={`mt-1.5 text-[9px] font-mono ${labelText} bg-zinc-950/90 px-2 py-0.5 border ${labelBorder} whitespace-nowrap ${glowColor} flex items-center gap-1`}>
                    <span className="text-green-500">▸</span>
                    {type}
                    <span className="text-zinc-600 ml-1">{threatLevel}</span>
                </div>

                {/* Threat Awareness Ring (hover only, no animation) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border border-red-500/10 rounded-full pointer-events-none group-hover:border-red-500/40 transition-colors"></div>

                {/* Hover Tooltip */}
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-xs font-bold px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-xl z-50 pointer-events-none border border-zinc-700">
                    ⚠️ Threat: {type}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-900 transform rotate-45 border-b border-r border-zinc-700"></div>
                </div>
            </div>
        </div>
    );
});


export default Enemy;
