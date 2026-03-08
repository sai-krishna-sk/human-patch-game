import React, { useEffect, useRef, useState } from 'react';

const Player = React.memo(({ x = 0, y = 0 }) => {
    const prevPosRef = useRef({ x, y });
    const [isMoving, setIsMoving] = useState(false);
    const [facing, setFacing] = useState('right');
    const stopTimeoutRef = useRef(null);

    useEffect(() => {
        const parsePos = (val) => {
            if (typeof val === 'string') return parseFloat(val.replace(/[^\d.-]/g, '')) || 0;
            return val || 0;
        };

        const nx = parsePos(x);
        const ny = parsePos(y);
        const px = parsePos(prevPosRef.current.x);
        const py = parsePos(prevPosRef.current.y);

        const dx = nx - px;
        const dy = ny - py;

        if (Math.abs(dx) > 0.05 || Math.abs(dy) > 0.05) {
            setIsMoving(true);
            if (dx > 0.05) setFacing('right');
            else if (dx < -0.05) setFacing('left');

            if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
            stopTimeoutRef.current = setTimeout(() => {
                setIsMoving(false);
            }, 80);
        }
        prevPosRef.current = { x, y };
    }, [x, y]);

    return (
        <div
            className="absolute z-30 pointer-events-none"
            style={{
                transform: `translate(${x}px, ${y}px)`,
                width: 44,
                height: 64,
                willChange: 'transform'
            }}
        >

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes bob {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
                @keyframes legSwingR {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(25deg); }
                    75% { transform: rotate(-25deg); }
                }
                @keyframes legSwingL {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-25deg); }
                    75% { transform: rotate(25deg); }
                }
                @keyframes armSwingR {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(-20deg); }
                    75% { transform: rotate(20deg); }
                }
                @keyframes armSwingL {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(20deg); }
                    75% { transform: rotate(-20deg); }
                }
                .player-bob { animation: bob 0.7s infinite ease-in-out; }
                .leg-r-walk { animation: legSwingR 0.7s infinite ease-in-out; transform-origin: 50% 10%; }
                .leg-l-walk { animation: legSwingL 0.7s infinite ease-in-out; transform-origin: 50% 10%; }
                .arm-r-walk { animation: armSwingR 0.7s infinite ease-in-out; transform-origin: 50% 10%; }
                .arm-l-walk { animation: armSwingL 0.7s infinite ease-in-out; transform-origin: 50% 10%; }
            `}} />

            <div className="relative w-full h-full flex flex-col items-center">
                {/* Ground Shadow */}
                <div
                    className={`absolute -bottom-1 w-10 h-3 bg-black/40 rounded-full transition-all duration-200 ${isMoving ? 'scale-90 opacity-60' : 'scale-100 opacity-80'}`}
                ></div>

                {/* --- FULL CHARACTER --- */}
                <div
                    className={`relative flex flex-col items-center z-10 transition-transform duration-100 ${facing === 'left' ? '-scale-x-100' : 'scale-x-100'} ${isMoving ? 'player-bob' : ''}`}
                >
                    {/* Hair Detail (Back/Top) */}
                    <div className="w-11 h-4 bg-zinc-900 rounded-t-full absolute -top-1.5 z-20 shadow-sm"></div>

                    {/* Head */}
                    <div className="w-[42px] h-[40px] bg-amber-200 rounded-full border-[1.5px] border-amber-300 flex flex-col items-center justify-center relative z-10 shadow-[inset_0_-4px_6px_rgba(0,0,0,0.15),0_2px_4px_rgba(0,0,0,0.1)]">
                        {/* Hair fringe - made more natural and prominent */}
                        <div className="absolute top-[0px] right-0 left-0 h-[14px] bg-zinc-900 rounded-t-full z-20"></div>
                        <div className="absolute top-[8px] -left-[1px] w-[14px] h-[10px] bg-zinc-900 rounded-br-full z-20"></div>
                        <div className="absolute top-[6px] -right-[1px] w-[12px] h-[10px] bg-zinc-900 rounded-bl-full z-20"></div>

                        {/* Regular Eyes - Larger and clearer */}
                        <div className="flex gap-3 mt-3 relative z-30">
                            <div className="w-2 h-2.5 bg-zinc-900 rounded-full shadow-sm">
                                <div className="w-[3px] h-[3px] bg-white rounded-full ml-[1px] mt-[1px]"></div>
                            </div>
                            <div className="w-2 h-2.5 bg-zinc-900 rounded-full shadow-sm">
                                <div className="w-[3px] h-[3px] bg-white rounded-full ml-[1px] mt-[1px]"></div>
                            </div>
                        </div>

                        {/* Ear */}
                        <div className="absolute top-4 -right-[3px] w-[4px] h-[8px] bg-amber-300 rounded-r-md z-0 shadow-sm border-[1px] border-amber-400 border-l-0"></div>

                        {/* Mouth - Slight smirk */}
                        <div className="w-3 h-[2px] bg-amber-600 rounded-full mt-2 relative z-30 ml-2 rotate-[-5deg]"></div>
                    </div>

                    {/* Neck */}
                    <div className="w-[14px] h-[8px] bg-amber-300 -mt-1 z-0 shadow-[inset_0_3px_5px_rgba(0,0,0,0.2)]"></div>

                    {/* Torso - Black Suit */}
                    <div className="w-[48px] h-[40px] bg-zinc-900 rounded-t-[8px] rounded-b-sm border border-zinc-950 relative flex justify-center shadow-md -mt-1">
                        {/* Suit lapels */}
                        <div className="absolute top-0 left-1 w-[18px] h-full bg-zinc-800 skew-x-3 border-r border-zinc-950 shadow-sm z-10"></div>
                        <div className="absolute top-0 right-1 w-[18px] h-full bg-zinc-800 -skew-x-3 border-l border-zinc-950 shadow-sm z-10"></div>

                        {/* White Shirt visible */}
                        <div className="absolute top-0 w-[16px] h-[14px] bg-white z-0 rounded-b-md shadow-inner flex justify-center">
                            {/* Red Tie */}
                            <div className="w-[6px] h-[26px] bg-red-700 z-10 shadow-sm"></div>
                        </div>

                        {/* ID Badge on lapel */}
                        <div className="absolute top-4 left-3 w-[6px] h-[8px] bg-white rounded-[1px] border border-slate-400 z-20 flex flex-col items-center rotate-12 shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                            <div className="w-[4px] h-[2px] bg-blue-500 mt-[1px]"></div>
                        </div>

                        {/* Back Arm (Left) - Suit Sleeve */}
                        <div className={`absolute -left-1 top-1 w-[14px] h-[34px] bg-zinc-800 rounded-full border border-zinc-950 flex flex-col items-center z-0 ${isMoving ? 'arm-l-walk' : ''}`}>
                            <div className="absolute bottom-[4px] w-full h-[3px] bg-white z-10 border-b border-zinc-300"></div>
                            <div className="w-[10px] h-[10px] bg-amber-200 rounded-full absolute -bottom-1 shadow-sm"></div>
                        </div>

                        {/* Front Arm (Right) - Suit Sleeve */}
                        <div className={`absolute -right-[2px] top-1 w-[14px] h-[34px] bg-zinc-800 rounded-full border border-zinc-950 flex flex-col items-center z-30 shadow-[0_2px_4px_rgba(0,0,0,0.3)] ${isMoving ? 'arm-r-walk' : ''}`}>
                            <div className="absolute bottom-[4px] w-full h-[3px] bg-white z-10 border-b border-zinc-300"></div>
                            {/* Hand */}
                            <div className="w-[10px] h-[10px] bg-amber-200 rounded-full absolute -bottom-1 shadow-sm z-0"></div>
                        </div>
                    </div>

                    {/* Belt */}
                    <div className="w-[46px] h-[8px] bg-zinc-950 border-y border-black -mt-0.5 flex justify-center items-center z-20 relative shadow-[0_2px_3px_rgba(0,0,0,0.2)]">
                        <div className="w-[10px] h-[6px] bg-amber-400 rounded-[2px] shadow-sm ring-1 ring-amber-600/50"></div>
                    </div>

                    {/* Legs - Formal Pants */}
                    <div className="flex gap-[6px] -mt-[1px] z-10 relative">
                        {/* Back Leg (Left) */}
                        <div className={`w-[16px] h-[20px] bg-zinc-900 rounded-b-sm border-l border-zinc-950 relative ${isMoving ? 'leg-l-walk' : ''}`}>
                            {/* Formal Dress Shoe */}
                            <div className="absolute -bottom-[2px] -right-1 w-[20px] h-[10px] bg-black rounded-b-md rounded-tl-sm shadow-sm overflow-hidden flex flex-col justify-end">
                                <div className="w-full h-[3px] bg-zinc-900 border-t border-zinc-800"></div>
                            </div>
                        </div>

                        {/* Front Leg (Right) */}
                        <div className={`w-[16px] h-[20px] bg-zinc-900 rounded-b-sm border-r border-zinc-950 relative z-20 shadow-[-2px_0_4px_rgba(0,0,0,0.3)] ${isMoving ? 'leg-r-walk' : ''}`}>
                            {/* Formal Dress Shoe */}
                            <div className="absolute -bottom-[2px] -right-1 w-[20px] h-[10px] bg-black rounded-b-md rounded-tl-sm shadow-sm overflow-hidden flex flex-col justify-end">
                                <div className="w-full h-[3px] bg-zinc-900 border-t border-zinc-800"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Name Tag (Outside the scaled div to prevent text mirroring) */}
                <div
                    className={`absolute -top-7 text-[10px] font-bold text-white bg-slate-800/95 px-2 py-[2px] rounded border border-slate-600 z-40 tracking-wider shadow-[0_4px_8px_rgba(0,0,0,0.4)] transition-transform duration-[400ms] ${isMoving ? '-translate-y-2' : 'translate-y-0'}`}
                >
                    AGENT
                    <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-slate-800/95"></div>
                </div>
            </div>
        </div>
    );
});

export default Player;
