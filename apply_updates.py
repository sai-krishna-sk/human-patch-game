import os
import re

file_path = r'c:\Users\terli\Documents\Gamethon\human-patch-game\src\levels\Level4.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update CLUE_DATA
old_clue_data_marker_start = "const CLUE_DATA = ["
old_clue_data_marker_end = "];"
start_idx = text.find(old_clue_data_marker_start)
end_idx = text.find(old_clue_data_marker_end, start_idx) + len(old_clue_data_marker_end)

if start_idx != -1 and end_idx != -1:
    new_clue_data = """const CLUE_DATA = [
    { id: 1, title: 'COLLECT vs PAY', desc: "In UPI, there are only two transaction types. A legitimate vendor creates a QR for a PAYMENT. A fraudster creates a QR for a COLLECT REQUEST (money TO them). Both require PIN.", noteColor: '#fff9c4' },
    { id: 2, title: 'Tampered QR', desc: "Scammers paste fake printed stickers over real QR codes. The only way to detect is looking for edges or asking the vendor for their UPI ID verbally.", noteColor: '#e1f5fe' },
    { id: 3, title: 'The ₹1 Trap', desc: "The fraudulent QR shows 'Collect ₹1'. Many think 'It's just one rupee.' Once you enter your PIN, you prove it works. Within seconds, they send requests for thousands.", noteColor: '#fce4ec' },
    { id: 4, title: 'Unknown UPI ID', desc: "Selvi's son registered her ID (e.g., selvi.veg). The fraudulent QR has a random string: '9944XXXXX@paytm'. If the name doesn't match the seller, STOP.", noteColor: '#e8f5e9' },
    { id: 5, title: 'Missing Name', desc: "Legitimate merchant QR shows: Merchant Name, Category. The fraudulent QR shows no merchant name—only a phone number handle. It is a personal collect request.", noteColor: '#fff3e0' },
    { id: 6, title: 'Vendor as Victim', desc: "Selvi did not create this fraud. Thousands of vendors are targeted this way. Alerting Selvi protects her and saves future customers.", noteColor: '#f3e5f5' },
];"""
    text = text[:start_idx] + new_clue_data + text[end_idx:]

# 2. Add Scam Sequence state variable if not exists
if "const [scamReported, setScamReported] = useState(false);" not in text:
    state_anchor = "const [inspectedZones, setInspectedZones] = useState([]);"
    state_insert = "\n    const [scamReported, setScamReported] = useState(false);"
    text = text.replace(state_anchor, state_anchor + state_insert)

# 3. Replace scan_result UI to make it smaller and add continue logic
scan_start = "if (gameState === 'scan_result') {"
scan_end_marker = "if (gameState === 'pin_entry') {"

scan_start_idx = text.find(scan_start)
scan_end_idx = text.find(scan_end_marker)

if scan_start_idx != -1 and scan_end_idx != -1:
    new_scan_ui = """if (gameState === 'scan_result') {
        // Red circle markup for found clues
        const RedCircle = () => (
            <svg className="absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)] pointer-events-none drop-shadow-md z-50 animate-in zoom-in duration-300" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M50 5C20 8 5 30 10 60C15 90 40 95 70 90C95 85 95 40 80 15C65 -5 30 5 50 15" fill="none" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" 
                      style={{ strokeDasharray: 300, strokeDashoffset: 0, animation: 'dash 0.5s ease-out forwards' }} />
            </svg>
        );

        const foundDeviceClues = cluesFound.filter(id => id !== 2 && id !== 6);
        const allCluesCollected = foundDeviceClues.length >= 4;

        return (
            <div className="w-full h-full bg-[#1a1c1e] flex items-center justify-center p-8 gap-12 overflow-hidden relative font-sans">
                <FeedbackToast />
                
                {/* Background market elements */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url("${MARKET_BKG}")`, backgroundSize: 'cover' }}></div>

                {/* 
                 * ==========================================
                 * LEFT SIDE: THE PHONE / SCANNED QR CONTEXT
                 * (Scaled down significantly to be less intrusive)
                 * ==========================================
                 */}
                <div className="w-[336px] h-[688px] relative flex-shrink-0 animate-in slide-in-from-left duration-500">
                    <div className="w-[420px] h-[860px] bg-black rounded-[4rem] p-4 relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-[8px] border-zinc-800 origin-top-left scale-[0.8]">
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

                                {/* Safe/Danger Actions (Shown only after clues found) */}
                                {allCluesCollected ? (
                                    <div className="space-y-3 pt-4 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-black py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95 text-xl" onClick={() => setGameState('correct_path')}>
                                            DECLINE PAYMENT (SAFE)
                                        </button>
                                        <button className="w-full bg-[#1c2128] hover:bg-black text-white py-4 rounded-2xl font-black transition-all shadow-xl active:scale-95" onClick={() => setGameState('pin_entry')}>
                                            APPROVE & ENTER PIN
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3 pt-4 relative z-10 flex flex-col">
                                        <div className="w-full border-2 border-dashed border-slate-400 text-slate-400 py-4 rounded-2xl font-black text-center text-sm animate-pulse bg-slate-100">
                                            COLLECT ALL 4 CLUES ON SCREEN TO DECIDE
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 
                 * ==========================================
                 * RIGHT SIDE: THE CASE EVIDENCE BOARD
                 * (Scaled down significantly)
                 * ==========================================
                 */}
                <div className="flex-1 max-w-4xl h-[700px] bg-[#2d1810] rounded-[2rem] border-8 border-[#5d4037] p-8 flex flex-col relative overflow-hidden shadow-2xl animate-in slide-in-from-right duration-700">
                    {/* Board Texture */}
                    <div className="absolute inset-0 z-0 opacity-30 mix-blend-overlay pointer-events-none" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23a)' opacity='.2'/%3E%3C/svg%3E")`,
                        backgroundColor: '#8d6e63'
                    }}></div>

                    {/* Header */}
                    <div className="relative z-10 flex justify-between items-center bg-black/40 p-5 rounded-2xl backdrop-blur-md border border-white/10 mb-6">
                        <div>
                            <h2 className="text-amber-400 font-black text-3xl uppercase italic tracking-tighter drop-shadow-md">
                                🔍 INVESTIGATION BOARD
                            </h2>
                            <p className="text-amber-200/60 font-black tracking-widest uppercase text-xs mt-1">Tap suspicious details on the phone to uncover evidence</p>
                        </div>
                        <div className="text-right">
                            <div className="text-amber-500 font-black text-2xl">{foundDeviceClues.length} / {CLUE_DATA.length - 2}</div>
                            <div className="text-white/50 text-[9px] uppercase tracking-widest">Clues Found</div>
                        </div>
                    </div>

                    {/* Evidence Grid Layout */}
                    <div className="relative z-10 flex-1 grid grid-cols-2 gap-4 overflow-y-auto custom-scrollbar pr-2 pb-4">
                        {/* We filter out clues 2 and 6 as they relate to physical QR inspection in the NEXT stage */}
                        {CLUE_DATA.filter(c => c.id !== 2 && c.id !== 6).map((clue, idx) => {
                            const found = cluesFound.includes(clue.id);
                            // Slight random rotations for polaroid/note effect
                            const rotation = (idx % 2 === 0 ? 1 : -1) * (1 + (idx % 3));
                            
                            return (
                                <div key={clue.id}
                                    className={`relative p-5 rounded-xl transition-all duration-700 \${found ? 'scale-100 opacity-100' : 'scale-95 opacity-50 grayscale blur-[1px]'}`}
                                    style={{
                                        backgroundColor: found ? clue.noteColor : '#d6d3d1',
                                        transform: found ? `rotate(${rotation}deg)` : 'rotate(0deg)',
                                        boxShadow: found ? '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)' : 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
                                        border: found ? '1px solid rgba(0,0,0,0.1)' : '2px dashed #a8a29e'
                                    }}>
                                    
                                    {/* Tape / Pin */}
                                    {found && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-5 bg-white/50 backdrop-blur-sm shadow-sm rotate-[-2deg] border border-white/60"></div>
                                    )}

                                    <h4 className={`font-black text-sm mb-2 pb-1 border-b \${found ? 'text-slate-900 border-slate-900/20' : 'text-slate-500 border-slate-400'}`}>
                                        {found ? clue.title : `LOCKED FILE #${idx + 1}`}
                                    </h4>
                                    <p className={`text-xs leading-relaxed font-serif \${found ? 'text-slate-800' : 'text-slate-500 italic'}`}>
                                        {found ? clue.desc : "Tap the corresponding suspicious element on the phone screen to unlock this evidence."}
                                    </p>
                                    
                                    {found && (
                                        <div className="mt-4 flex items-center justify-between opacity-50">
                                            <div className="text-[8px] font-black font-mono uppercase tracking-widest">EVID-REF:{clue.id}00</div>
                                            <div className="w-2 h-2 bg-red-600 rounded-full shadow-[0_0_5px_rgba(220,38,38,0.8)]"></div>
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
    text = text[:scan_start_idx] + new_scan_ui + text[scan_end_idx:]


# 4. Now handle correct_path and add scam_sequence
pin_start_marker = "if (gameState === 'pin_entry') {"
mini_game_start_marker = "if (gameState === 'mini_game') {"

pin_start_idx = text.find(pin_start_marker)
mini_game_start_idx = text.find(mini_game_start_marker)

if pin_start_idx != -1 and mini_game_start_idx != -1:
    new_end_states = """// ═══════════════════════════════════════════
    // PIN ENTRY (Scam path)
    // ═══════════════════════════════════════════
    if (gameState === 'pin_entry') {
        const handlePinDigit = (digit) => {
            const next = pinInput + digit;
            setPinInput(next);
            if (next.length >= 4) {
                setTimeout(() => {
                    setPinInput('');
                    setGameState('scam_sequence');
                }, 400);
            }
        };
        return (
            <div className="w-full h-full bg-[#1a1c1e] flex items-center justify-center p-8">
                <div className="w-[336px] h-[688px] relative flex-shrink-0">
                    <div className="w-[420px] h-[860px] bg-black rounded-[4rem] p-4 relative shadow-[0_50px_100px_rgba(0,0,0,0.8)] border-[8px] border-zinc-800 origin-top-left scale-[0.8]">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-black rounded-b-3xl z-50"></div>
                        <div className="w-full h-full bg-zinc-900 rounded-[3rem] overflow-hidden flex flex-col relative">
                            <div className="bg-[#1c2128] p-8 pt-14 text-center">
                                <h3 className="text-white text-2xl font-black uppercase">Enter UPI PIN</h3>
                                <p className="text-white/40 text-xs mt-2 font-mono">Authorize collect request of ₹1.00</p>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center gap-10 p-8">
                                <div className="flex gap-4">
                                    {[0, 1, 2, 3].map(i => (
                                        <div key={i} className={`w-16 h-16 rounded-2xl border-4 flex items-center justify-center text-3xl font-black transition-all ${i < pinInput.length ? 'bg-white border-white text-black' : 'bg-transparent border-white/20 text-transparent'
                                            }`}>
                                            {i < pinInput.length ? '•' : ''}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-3 gap-4 w-full max-w-[300px]">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((d, i) => (
                                        d === '' ? <div key={i}></div> :
                                            d === '⌫' ? (
                                                <button key={i} className="h-16 bg-white/5 rounded-2xl text-white/40 font-black text-xl hover:bg-white/10 transition-all active:scale-90"
                                                    onClick={() => setPinInput(p => p.slice(0, -1))}>{d}</button>
                                            ) : (
                                                <button key={i} className="h-16 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-black text-2xl transition-all active:scale-90 shadow-lg"
                                                    onClick={() => handlePinDigit(String(d))}>{d}</button>
                                            )
                                    ))}
                                </div>
                            </div>
                            <button className="mx-8 mb-8 bg-white/5 text-white/30 py-4 rounded-2xl font-black transition-all hover:bg-white/10" onClick={() => setGameState('scan_result')}>CANCEL</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    // ═══════════════════════════════════════════
    // SCAM SEQUENCE (If Player Enters PIN)
    // ═══════════════════════════════════════════
    if (gameState === 'scam_sequence') {
        return (
            <div className="w-full h-full bg-[#0a0c10] flex items-center justify-center p-12 overflow-hidden relative">
                <div className="absolute inset-0 bg-red-900/10 pointer-events-none animate-pulse"></div>
                
                <div className="w-full max-w-5xl bg-black rounded-[3rem] border-4 border-red-900/50 shadow-[0_0_100px_rgba(220,38,38,0.2)] overflow-hidden flex flex-col p-12 relative z-10 animate-in zoom-in-95 duration-500">
                    <div className="flex items-center gap-6 mb-8 border-b-2 border-red-900/30 pb-8">
                        <div className="w-24 h-24 bg-red-600 rounded-2xl flex items-center justify-center text-5xl shadow-[0_0_50px_rgba(220,38,38,0.4)] border-2 border-red-400">💀</div>
                        <div>
                            <h2 className="text-red-500 font-black text-5xl uppercase italic tracking-tighter drop-shadow-lg">FRAUD COMPLETED</h2>
                            <p className="text-red-400/80 font-black text-lg uppercase tracking-widest mt-1">₹1 Trap Successfully Triggered</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 flex-1">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-red-400 font-black text-sm uppercase tracking-[0.3em] mb-4 border-b border-red-900/50 pb-2">Transaction Log — What Happened</h3>
                                <div className="bg-zinc-900/80 border border-red-900/30 rounded-xl p-5 font-mono text-xs leading-loose text-red-100 shadow-inner">
                                    <p className="text-emerald-400">08:17:23 AM — Collect Request Approved: ₹1.00 (PIN confirmed)</p>
                                    <p className="text-red-400 mt-2 font-bold animate-pulse">08:17:25 AM — Collect Request Auto-Processed: ₹1,50,000</p>
                                    <p className="text-red-400 font-bold animate-pulse">08:17:26 AM — Collect Request Auto-Processed: ₹1,50,000</p>
                                    <p className="text-zinc-500 mt-2">08:17:27 AM — Transaction Declined (insufficient balance for 3rd request)</p>
                                    <div className="mt-4 pt-4 border-t border-red-900/50 text-red-500 font-black text-lg uppercase">
                                        TOTAL STOLEN: ₹3,00,000 in 4 seconds
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="text-amber-500 font-black text-sm uppercase tracking-[0.3em] mb-4 border-b border-amber-900/50 pb-2">Subsequent Damage</h3>
                                <ul className="space-y-3 text-sm font-medium text-amber-100/70">
                                    <li className="flex gap-3"><span className="text-red-500">❌</span> Your UPI is flagged by fraud detection system — account restricted for 48 hours</li>
                                    <li className="flex gap-3"><span className="text-red-500">❌</span> ₹3,00,000 transferred to mule accounts — laundered within hours via crypto</li>
                                    <li className="flex gap-3"><span className="text-red-500">❌</span> Digital Estate reduced: ₹42,00,000 → ₹39,00,000</li>
                                    <li className="flex gap-3"><span className="text-red-500">❌</span> Selvi Vegetables receives angry calls. Her market reputation is severely damaged.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl p-8 flex flex-col justify-between">
                            <div>
                                <div className="inline-block bg-blue-900/30 text-blue-400 px-3 py-1 rounded border border-blue-900 mb-6 font-black text-xs tracking-widest uppercase">Recovery Option</div>
                                <h3 className="text-white font-black text-2xl mb-4">The Golden Hour</h3>
                                <p className="text-slate-400 leading-relaxed text-sm">
                                    If you file a complaint at <strong className="text-white">1930 (Cyber Crime Helpline)</strong> within the first few hours, some funds are potentially recoverable through the bank's fraud reversal process. If reported late — total loss is permanent. Speed of reporting determines recovery.
                                </p>
                            </div>

                            {scamReported ? (
                                <div className="mt-8 text-center animate-in zoom-in duration-300">
                                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(59,130,246,0.5)] mx-auto mb-4 border-2 border-white">📞</div>
                                    <p className="text-emerald-400 font-black text-lg">REPORT FILED SUCCESSFULLY</p>
                                    <p className="text-slate-400 text-sm mt-1">₹1,50,000 frozen in mule account.</p>
                                    <button className="w-full mt-6 bg-zinc-800 hover:bg-zinc-700 text-white font-black py-4 rounded-xl transition-all" onClick={() => setGameState('scan_result')}>
                                        UNDO MISTAKE & RETRY SCAN
                                    </button>
                                </div>
                            ) : (
                                <button className="w-full mt-8 bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl text-xl shadow-[0_10px_30px_rgba(37,99,235,0.4)] transition-all animate-pulse"
                                    onClick={() => {
                                        setScamReported(true);
                                        adjustAssets(-150000); // Penalty
                                        adjustLives(-1); // Penalty
                                    }}>
                                    QUICK REPORT TO 1930
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ═══════════════════════════════════════════
    // CORRECT PATH (Alerting Selvie)
    // ═══════════════════════════════════════════
    if (gameState === 'correct_path') {
        const hasVerifiedBoard = inspectedZones.includes(20);
        
        return (
            <div className="w-full h-full bg-[#0a0c10] flex items-center justify-center p-10 overflow-hidden relative">
                <FeedbackToast />
                {/* Background market elements */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: `url("${MARKET_BKG}")`, backgroundSize: 'cover' }}></div>

                <div className="w-full max-w-6xl bg-white/5 backdrop-blur-3xl rounded-[3rem] border-4 border-emerald-500/30 shadow-3xl overflow-hidden flex flex-col p-12 pb-8 animate-in zoom-in-95 duration-500 h-[720px]">
                    <div className="flex items-center gap-6 mb-8 flex-shrink-0">
                        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-4xl shadow-[0_0_50px_rgba(16,185,129,0.4)] border-4 border-black/20">🛡️</div>
                        <div>
                            <h2 className="text-emerald-400 font-black text-5xl uppercase italic tracking-tighter drop-shadow-lg">Fraud Prevented</h2>
                            <p className="text-slate-400 font-black text-lg uppercase tracking-widest mt-1">
                                {hasVerifiedBoard ? "STOLEN IDENTITY EXPOSED" : "YOU CANCELLED THE COLLECT REQUEST!"}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 grid grid-cols-2 gap-12 overflow-y-auto pr-4 custom-scrollbar">
                        {/* Action Steps */}
                        <div className="space-y-6">
                            {/* Step 1: Cancel */}
                            <div className="p-6 rounded-[2rem] bg-emerald-900/20 border-2 border-emerald-500/50">
                                <h4 className="font-black text-xl mb-2 uppercase tracking-tighter text-emerald-400">✓ Step 1: Cancel & Question</h4>
                                <p className="text-slate-300 leading-relaxed text-sm">
                                    You tapped CANCEL on the collect request. You asked Selvi for her registered UPI ID: 'selvi.vegetables@oksbi'. The scanned ID was a random number.
                                </p>
                            </div>

                            {/* Step 2: Physical Inspection */}
                            <div className={`p-6 rounded-[2rem] transition-all border-4 ${hasVerifiedBoard ? 'bg-emerald-500 text-black border-transparent shadow-[0_10px_30px_rgba(16,185,129,0.3)]' : 'bg-white/5 border-white/10'}`}>
                                <h4 className="font-black text-xl mb-2 uppercase tracking-tighter">
                                    {hasVerifiedBoard ? '✓ Step 2: Sticker Removed' : 'Step 2: Inspect Physical QR'}
                                </h4>
                                <p className={`text-sm leading-relaxed ${hasVerifiedBoard ? 'text-black/80' : 'text-slate-400'}`}>
                                    Look for tampered stickers on Selvi's payment board to prove the scam to her.
                                </p>
                                {!hasVerifiedBoard && (
                                    <button className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-4 rounded-xl mt-4 text-sm shadow-xl transition-all active:scale-95"
                                        onClick={() => { 
                                            setInspectedZones(prev => [...prev, 20]); 
                                            setCluesFound(prev => [...new Set([...prev, 2, 6])]); 
                                            showFeedback("🔍 Fake Sticker Found & Removed!") 
                                        }}>
                                        PHYSICALLY EXAMINE SELVI'S BOARD 🔍
                                    </button>
                                )}
                            </div>

                            {/* Step 3: Correct Payment */}
                            <div className={`p-6 rounded-[2rem] transition-all border-4 ${hasVerifiedBoard && stickerPeeled ? 'bg-blue-500 text-white border-transparent shadow-[0_10px_30px_rgba(59,130,246,0.3)]' : 'bg-white/5 border-white/10 opacity-50'}`}>
                                <h4 className="font-black text-xl mb-2 uppercase tracking-tighter">
                                    {stickerPeeled ? '✓ Step 3: Payment Sent' : 'Step 3: Pay Correctly'}
                                </h4>
                                <p className={`text-sm leading-relaxed ${stickerPeeled ? 'text-white/80' : 'text-slate-400'}`}>
                                    Open BHIM app manually, type 'selvi.vegetables@oksbi', enter ₹150, confirm with PIN.
                                </p>
                                {hasVerifiedBoard && !stickerPeeled && (
                                    <button className="w-full bg-blue-500 hover:bg-blue-400 text-white font-black py-4 rounded-xl mt-4 text-sm shadow-xl transition-all active:scale-95"
                                        onClick={() => { 
                                            setStickerPeeled(true); 
                                            showFeedback("💸 ₹150 Sent Safely!") 
                                        }}>
                                        MANUALLY PAY IN BHIM APP ✨
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Dialogue/Scene Overlay */}
                        <div className="bg-black/40 border-4 border-white/5 rounded-[2.5rem] p-8 relative flex flex-col justify-between overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
                            <div className="space-y-6 relative z-10 w-full">
                                <p className="text-white/30 font-black text-[10px] uppercase tracking-[0.4em] mb-2 border-b border-white/10 pb-2">Dialogue Log</p>
                                <div className="space-y-4">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0 animate-pulse"></div>
                                        <p className="text-slate-300 text-lg font-serif italic">"Selvi akka, your QR code is asking me to COLLECT money. This is a scam! What is the UPI ID your son gave you?"</p>
                                    </div>
                                    <div className="flex gap-4 animate-in slide-in-from-left duration-500 delay-200">
                                        <div className="w-10 h-10 border-2 border-amber-500/50 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-amber-900/30">
                                            <img src="/assets/selvi_portrait.png" className="w-full h-full object-cover opacity-80" alt="Selvi" />
                                        </div>
                                        <p className="text-amber-500 text-lg font-serif italic font-bold">"He said it is 'selvi.vegetables@oksbi'. Why? What happened sir?"</p>
                                    </div>
                                    
                                    {hasVerifiedBoard && (
                                        <div className="flex gap-4 animate-in slide-in-from-right duration-500">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0"></div>
                                            <p className="text-emerald-400/90 text-lg font-serif italic">"Look, someone pasted a fake sticker over yours. The scanner was reading '9944XXXXX@paytm'."</p>
                                        </div>
                                    )}

                                    {stickerPeeled && (
                                        <div className="flex gap-4 animate-in slide-in-from-left duration-500">
                                            <div className="w-10 h-10 border-2 border-amber-500/50 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 bg-amber-900/30">
                                                <img src="/assets/selvi_portrait.png" className="w-full h-full object-cover opacity-80" alt="Selvi" />
                                            </div>
                                            <p className="text-amber-500 text-lg font-serif italic font-bold">"Aiyo! Thank you, grandson! I will share a photo of this fake sticker on the market WhatsApp group immediately to warn others!"</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {stickerPeeled && (
                                <div className="mt-8 animate-in fade-in duration-500">
                                    <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 mb-4 text-center">
                                        <p className="text-emerald-400 font-black text-sm uppercase tracking-widest">🎖️ Cyber Safety Score: +30</p>
                                        <p className="text-emerald-200 text-xs mt-1">Market Sentinel Achievement Unlocked</p>
                                    </div>
                                    <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl text-xl shadow-[0_10px_30px_rgba(16,185,129,0.4)] animate-pulse"
                                        onClick={() => completeLevel(4, 30)}>
                                        COMPLETE LEVEL ➔
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    // ═══════════════════════════════════════════
    // MINI GAME (QR SORTING Overhaul)"""
    text = text[:pin_start_idx] + new_end_states + text[mini_game_start_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated Level4 UI and content constraints")
