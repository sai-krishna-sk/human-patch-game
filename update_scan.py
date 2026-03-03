import os

file_path = r'c:\Users\terli\Documents\Gamethon\human-patch-game\src\levels\Level4.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

start_marker = "if (gameState === 'scan_result') {"
end_marker = "// ═══════════════════════════════════════════\n    // PIN ENTRY (Scam path)"

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print(f"Could not find markers. start: {start_idx}, end: {end_idx}")
    exit(1)

new_ui = """if (gameState === 'scan_result') {
        // Red circle markup for found clues
        const RedCircle = () => (
            <svg className="absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)] pointer-events-none drop-shadow-md z-50 animate-in zoom-in duration-300" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M50 5C20 8 5 30 10 60C15 90 40 95 70 90C95 85 95 40 80 15C65 -5 30 5 50 15" fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" 
                      style={{ strokeDasharray: 300, strokeDashoffset: 0, animation: 'dash 0.5s ease-out forwards' }} />
            </svg>
        );

        return (
            <div className="w-full h-full bg-[#1a1c1e] flex p-8 gap-8 overflow-hidden relative font-sans">
                <FeedbackToast />
                
                {/* 
                 * ==========================================
                 * LEFT SIDE: THE PHONE / SCANNED QR CONTEXT
                 * ==========================================
                 */}
                <div className="w-[420px] h-[860px] bg-black rounded-[4rem] p-4 relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-[8px] border-zinc-800 flex-shrink-0 animate-in slide-in-from-left duration-500 mx-auto">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-black rounded-b-3xl z-50"></div>
                    
                    {/* Screen */}
                    <div className="w-full h-full bg-slate-50 rounded-[3rem] overflow-hidden flex flex-col relative pt-8">
                        
                        {/* Status Bar */}
                        <div className="px-8 pb-4 flex justify-between text-slate-400 text-xs font-black">
                            <span>8:15 AM</span>
                            <div className="flex gap-2 font-mono"><span>5G</span><span>🔋 88%</span></div>
                        </div>

                        {/* UPI App Header */}
                        <div className="bg-[#1c2128] p-8 pt-6 flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                                <div className="bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xs">UPI</div>
                                <button className="text-white/40 font-black text-sm hover:text-white" onClick={() => setGameState('market_walk')}>CANCEL</button>
                            </div>
                            <div>
                                <h4 className="text-white/60 font-black text-[10px] uppercase tracking-widest">Transaction Status</h4>
                                <h3 className="text-white text-xl font-black">APPROVAL REQUIRED</h3>
                            </div>
                        </div>

                        {/* Main Interaction Area */}
                        <div className="flex-1 p-6 flex flex-col gap-6 relative">
                            {/* Clue 1: COLLECT REQUEST warning */}
                            <div onClick={() => { if (!cluesFound.includes(1)) { setCluesFound(p => [...p, 1]); showFeedback("🔍 Collect Request Found!") } }}
                                className="relative group cursor-pointer transition-transform hover:scale-[1.02]">
                                <div className="bg-red-500 text-white p-5 rounded-3xl shadow-lg border-b-4 border-red-700">
                                    <h5 className="font-black text-[10px] uppercase tracking-widest opacity-80 decoration-white/20 underline underline-offset-4">Alert!</h5>
                                    <p className="text-xl font-bold mt-1">COLLECT REQUEST</p>
                                    <p className="text-[10px] font-medium opacity-80 mt-1 italic">Authorized money will be DEBITED from your account</p>
                                </div>
                                {cluesFound.includes(1) && <RedCircle />}
                            </div>

                            <div className="space-y-4">
                                {/* Clue 4: Unknown UPI ID */}
                                <div onClick={() => { if (!cluesFound.includes(4)) { setCluesFound(p => [...p, 4]); showFeedback("🔍 Unknown UPI ID!") } }}
                                    className="relative p-4 rounded-2xl border-2 bg-white border-slate-100 hover:border-slate-300 cursor-pointer transition-transform hover:scale-[1.02] group">
                                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Requested From</p>
                                    <p className="text-slate-900 font-mono font-bold">9944XXXXX@paytm</p>
                                    {cluesFound.includes(4) && <RedCircle />}
                                </div>
                                
                                {/* Clue 5: Missing Name / Suspicious Merchant details */}
                                <div onClick={() => { if (!cluesFound.includes(5)) { setCluesFound(p => [...p, 5]); showFeedback("🔍 Suspicious Merchant!") } }}
                                    className="relative p-4 rounded-2xl border-2 bg-white border-slate-100 hover:border-slate-300 cursor-pointer transition-transform hover:scale-[1.02] group">
                                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Merchant Details</p>
                                    <p className="text-slate-900 font-mono font-bold">unknown_collector@oksbi</p>
                                    {cluesFound.includes(5) && <RedCircle />}
                                </div>
                            </div>

                            {/* Clue 3: The ₹1 Trap (Amount) */}
                            <div className="flex-1 flex flex-col items-center justify-center border-y-2 border-dashed border-slate-200 py-6 relative">
                                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Amount Request</p>
                                <div onClick={() => { if (!cluesFound.includes(3)) { setCluesFound(p => [...p, 3]); showFeedback("🔍 The ₹1 Trap Spotted!") } }}
                                    className="relative cursor-pointer transition-transform hover:scale-110 group p-2">
                                    <div className="text-6xl font-black text-slate-900 font-mono">
                                        ₹1.00
                                    </div>
                                    {cluesFound.includes(3) && <RedCircle />}
                                </div>
                            </div>

                            {/* Safe/Danger Actions */}
                            <div className="space-y-3 pt-6 relative z-10">
                                <button className="w-full bg-[#1c2128] hover:bg-black text-white py-4 rounded-2xl font-black text-lg transition-all shadow-xl active:scale-95" onClick={() => setGameState('pin_entry')}>
                                    APPROVE & ENTER PIN
                                </button>
                                <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-black py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95" onClick={() => setGameState('correct_path')}>
                                    DECLINE PAYMENT (SAFE)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 
                 * ==========================================
                 * RIGHT SIDE: THE CASE EVIDENCE BOARD
                 * ==========================================
                 */}
                <div className="flex-1 h-full bg-[#2d1810] rounded-[3rem] border-8 border-[#5d4037] p-8 flex flex-col relative overflow-hidden shadow-2xl animate-in slide-in-from-right duration-700">
                    {/* Board Texture */}
                    <div className="absolute inset-0 z-0 opacity-30 mix-blend-overlay pointer-events-none" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23a)' opacity='.2'/%3E%3C/svg%3E")`,
                        backgroundColor: '#8d6e63'
                    }}></div>

                    {/* Header */}
                    <div className="relative z-10 flex justify-between items-center bg-black/40 p-6 rounded-2xl backdrop-blur-md border border-white/10 mb-8">
                        <div>
                            <h2 className="text-amber-400 font-black text-4xl uppercase italic tracking-tighter drop-shadow-md">
                                🔍 INVESTIGATION BOARD
                            </h2>
                            <p className="text-amber-200/60 font-black tracking-widest uppercase text-xs mt-1">Tap suspicious details on the phone to uncover evidence</p>
                        </div>
                        <div className="text-right">
                            <div className="text-amber-500 font-black text-3xl">{cluesFound.filter(id => id !== 2 && id !== 6).length} / {CLUE_DATA.length - 2}</div>
                            <div className="text-white/50 text-[10px] uppercase tracking-widest">Clues Found</div>
                        </div>
                    </div>

                    {/* Evidence Grid Layout */}
                    <div className="relative z-10 flex-1 grid grid-cols-2 gap-6 overflow-y-auto custom-scrollbar pr-4 pb-4">
                        {/* We filter out clues 2 and 6 as they relate to physical QR inspection in the NEXT stage */}
                        {CLUE_DATA.filter(c => c.id !== 2 && c.id !== 6).map((clue, idx) => {
                            const found = cluesFound.includes(clue.id);
                            // Slight random rotations for polaroid/note effect
                            const rotation = (idx % 2 === 0 ? 1 : -1) * (1 + (idx % 3));
                            
                            return (
                                <div key={clue.id}
                                    className={`relative p-6 rounded-xl transition-all duration-700 ${found ? 'scale-100 opacity-100' : 'scale-95 opacity-50 grayscale blur-[2px]'}`}
                                    style={{
                                        backgroundColor: found ? clue.noteColor : '#d6d3d1',
                                        transform: found ? `rotate(${rotation}deg)` : 'rotate(0deg)',
                                        boxShadow: found ? '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)' : 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
                                        border: found ? '1px solid rgba(0,0,0,0.1)' : '2px dashed #a8a29e'
                                    }}>
                                    
                                    {/* Tape / Pin */}
                                    {found && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-white/40 backdrop-blur-sm shadow-sm rotate-[-2deg] border border-white/60"></div>
                                    )}

                                    <h4 className={`font-black text-xl mb-3 pb-2 border-b-2 ${found ? 'text-slate-900 border-slate-900/20' : 'text-slate-500 border-slate-400'}`}>
                                        {found ? clue.title : `LOCKED FILE #${idx + 1}`}
                                    </h4>
                                    <p className={`text-base leading-relaxed font-serif ${found ? 'text-slate-800' : 'text-slate-500 italic'}`}>
                                        {found ? clue.desc : "Tap the corresponding suspicious element on the phone screen to unlock this evidence."}
                                    </p>
                                    
                                    {found && (
                                        <div className="mt-6 flex items-center justify-between opacity-50">
                                            <div className="text-[10px] font-black font-mono uppercase tracking-widest">EVID-REF:{clue.id}00</div>
                                            <div className="w-3 h-3 bg-red-600 rounded-full shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <style>{`
                    @keyframes dash { to { stroke-dashoffset: 0; } }
                    .animate-in svg path { stroke-dashoffset: 300; animation: dash 0.6s ease-out forwards; }
                `}</style>
            </div>
        );
    }
    
    // """

text = text[:start_idx] + new_ui + text[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("QR scan state rewritten successfully to side-by-side mode")
