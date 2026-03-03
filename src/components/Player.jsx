import React from 'react';

const Player = React.memo(({ x, y }) => {
    return (
        <div
            className="absolute z-30 transition-none"
            style={{
                left: x,
                top: y,
                width: 44,
                height: 64,
            }}
        >
            <div className="relative w-full h-full flex flex-col items-center">
                {/* Ground Shadow */}
                <div className="absolute -bottom-1 w-10 h-3 bg-black/40 rounded-full blur-[3px]"></div>

                {/* --- FULL CHARACTER --- */}
                <div className="relative flex flex-col items-center z-10">

                    {/* Hair */}
                    <div className="w-10 h-3 bg-zinc-900 rounded-t-full absolute -top-1 z-20"></div>

                    {/* Head */}
                    <div className="w-10 h-10 bg-amber-200 rounded-full border-2 border-amber-300 flex flex-col items-center justify-center relative z-10 shadow-[inset_0_-3px_6px_rgba(0,0,0,0.15)]">
                        {/* Hair overlay */}
                        <div className="absolute top-0 left-0 right-0 h-4 bg-zinc-900 rounded-t-full z-20"></div>
                        {/* Eyes */}
                        <div className="flex gap-2.5 mt-1 relative z-30">
                            <div className="w-1.5 h-2 bg-zinc-800 rounded-full"></div>
                            <div className="w-1.5 h-2 bg-zinc-800 rounded-full"></div>
                        </div>
                        {/* Mouth */}
                        <div className="w-2 h-0.5 bg-amber-400 rounded-full mt-0.5 relative z-30"></div>
                    </div>

                    {/* Neck */}
                    <div className="w-3 h-1.5 bg-amber-200 -mt-1 z-0"></div>

                    {/* Torso — White Shirt + Blue Jacket */}
                    <div className="w-12 h-10 bg-slate-800 rounded-t-md rounded-b-sm border border-slate-900 relative flex justify-center overflow-hidden shadow-md -mt-0.5">
                        {/* Jacket lapels */}
                        <div className="absolute top-0 left-0 w-4 h-full bg-slate-700 skew-x-6 border-r border-slate-600"></div>
                        <div className="absolute top-0 right-0 w-4 h-full bg-slate-700 -skew-x-6 border-l border-slate-600"></div>
                        {/* Shirt collar visible */}
                        <div className="absolute top-0 w-4 h-3 bg-white z-10 rounded-b-sm"></div>
                        {/* Tie */}
                        <div className="absolute top-2 w-1.5 h-7 bg-red-600 z-20 rounded-b-sm shadow-sm"></div>
                        {/* Arms */}
                        <div className="absolute -left-2 top-1 w-3 h-8 bg-slate-700 rounded-full border border-slate-800"></div>
                        <div className="absolute -right-2 top-1 w-3 h-8 bg-slate-700 rounded-full border border-slate-800"></div>
                        {/* Hands */}
                        <div className="absolute -left-2 top-8 w-3 h-2.5 bg-amber-200 rounded-full"></div>
                        <div className="absolute -right-2 top-8 w-3 h-2.5 bg-amber-200 rounded-full"></div>
                    </div>

                    {/* Belt */}
                    <div className="w-11 h-1.5 bg-zinc-950 border-y border-zinc-700 -mt-0.5 flex justify-center items-center">
                        <div className="w-2 h-1 bg-yellow-600 rounded-sm"></div>
                    </div>

                    {/* Legs */}
                    <div className="flex gap-0.5 -mt-0.5">
                        <div className="w-4 h-5 bg-slate-900 rounded-b-sm border-l border-zinc-800"></div>
                        <div className="w-4 h-5 bg-slate-900 rounded-b-sm border-r border-zinc-800"></div>
                    </div>

                    {/* Shoes */}
                    <div className="flex gap-1 -mt-0.5">
                        <div className="w-5 h-2 bg-zinc-950 rounded-b-md rounded-t-sm shadow-sm"></div>
                        <div className="w-5 h-2 bg-zinc-950 rounded-b-md rounded-t-sm shadow-sm"></div>
                    </div>
                </div>

                {/* Name Tag */}
                <div className="mt-1 text-[9px] font-bold text-white bg-slate-800/90 px-2 py-0.5 rounded-sm shadow border border-slate-700 whitespace-nowrap z-30 tracking-wider">
                    AGENT
                </div>
            </div>
        </div>
    );
});


export default Player;
