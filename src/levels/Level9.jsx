import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useGameState } from '../context/GameStateContext';
import Player from '../components/Player';

const ROOM_WIDTH = 1600;
const ROOM_HEIGHT = 1100;
const STREET_WIDTH = 2400;
const VIEWPORT_WIDTH = 1200;
const VIEWPORT_HEIGHT = 800;
const PLAYER_SIZE = 40;
const SPEED = 15;

const PHONE_DESK = { x: 600, y: 400, w: 400, h: 350 };

const checkCollision = (px, py, rect) => (
  px < rect.x + rect.w && px + PLAYER_SIZE > rect.x &&
  py < rect.y + rect.h && py + PLAYER_SIZE > rect.y
);

const CLUE_INFO = {
  'sender_number': { title: "Mobile Sender Alert", desc: "Real services use shortcodes. Mobile numbers (+91-88...) are suspicious.", icon: "📱" },
  'url_chain': { title: "Redirect Deception", desc: "bit.ly hides 4 hops leading to a malware download site.", icon: "🔗" },
  'domain_age': { title: "Fresh Fraud Domains", desc: "The destination domains were registered 3-5 days ago. High fraud risk.", icon: "📅" },
  'apk_endpoint': { title: "Malware Payload", desc: "The link ends in a .apk file. Financial tools don't ask you to install apps via SMS.", icon: "💀" },
  'linkedin_fake': { title: "Social Validation Bait", desc: "Suspicious account created 3 days ago. Bio is fake. Profile is watching you.", icon: "💼" },
  'official_cibil': { title: "Official Warning", desc: "cibil.com confirms they never send links via SMS. Your score is actually fine.", icon: "🔒" }
};

const Level9 = () => {
  const { completeLevel, adjustAssets, adjustLives } = useGameState();
  const [gameState, setGameState] = useState('room'); // room, phone, outcome
  const [playerPos, setPlayerPos] = useState({ x: 780, y: 750 });
  const [keys, setKeys] = useState({});
  const [canInteract, setCanInteract] = useState(false);
  const [activeApp, setActiveApp] = useState('home');
  const [cluesFound, setCluesFound] = useState([]);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [isDetectiveModeOpen, setIsDetectiveModeOpen] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [appStates, setAppStates] = useState({
    linkedin: 'initial', // initial, scanning, flagged
    browser: 'initial',  // initial, verified
    sms: 'unread',       // unread, read
    expander: 'idle'     // idle, tracing, done
  });
  const [traceStep, setTraceStep] = useState(0);
  const [expanderUrl, setExpanderUrl] = useState('');

  // UI Helpers
  const showFeedback = (msg) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const discoverClue = (id) => {
    if (!cluesFound.includes(id)) {
      setCluesFound(prev => [...prev, id]);
      showFeedback("🔍 INTELLIGENCE GATHERED");
    }
  };

  // Movement Loop
  useEffect(() => {
    const handleKD = (e) => setKeys(k => ({ ...k, [e.key.toLowerCase()]: true }));
    const handleKU = (e) => setKeys(k => ({ ...k, [e.key.toLowerCase()]: false }));
    window.addEventListener('keydown', handleKD);
    window.addEventListener('keyup', handleKU);
    return () => { window.removeEventListener('keydown', handleKD); window.removeEventListener('keyup', handleKU); };
  }, []);

  useEffect(() => {
    if (gameState !== 'room') return;
    let frameId;
    const loop = () => {
      setPlayerPos(p => {
        let nx = p.x, ny = p.y;
        const limitX = ROOM_WIDTH;
        const limitY = ROOM_HEIGHT;

        if (keys['w'] || keys['arrowup']) ny -= SPEED;
        if (keys['s'] || keys['arrowdown']) ny += SPEED;
        if (keys['a'] || keys['arrowleft']) nx -= SPEED;
        if (keys['d'] || keys['arrowright']) nx += SPEED;

        nx = Math.max(0, Math.min(nx, limitX - PLAYER_SIZE));
        ny = Math.max(0, Math.min(ny, limitY - PLAYER_SIZE));

        const deskParts = [
          { x: PHONE_DESK.x, y: PHONE_DESK.y, w: PHONE_DESK.w, h: 140 }, // Main Board
          { x: PHONE_DESK.x, y: PHONE_DESK.y + 140, w: 140, h: 210 }    // L-Return
        ];

        for (const rect of deskParts) {
          if (checkCollision(nx, ny, rect)) {
            if (p.x + PLAYER_SIZE <= rect.x || p.x >= rect.x + rect.w) nx = p.x;
            if (p.y + PLAYER_SIZE <= rect.y || p.y >= rect.y + rect.h) ny = p.y;
          }
        }
        const interactArea = { x: PHONE_DESK.x - 40, y: PHONE_DESK.y - 40, w: PHONE_DESK.w + 80, h: PHONE_DESK.h + 80 };
        setCanInteract(checkCollision(nx, ny, interactArea));

        return { x: nx, y: ny };
      });
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [keys, gameState]);

  // Interaction Key Listener
  useEffect(() => {
    if (keys['e'] && canInteract) {
      if (gameState === 'room') {
        setGameState('phone');
        setActiveApp('home'); // Reset on entry
        setIsDetectiveModeOpen(false);
      }
    }
  }, [keys, canInteract, gameState]);

  // -------------------------------------------------------------------------
  // RENDER: LEVEL 1 ROOM ASSETS
  // -------------------------------------------------------------------------
  const renderPlant = (x, y) => (
    <div className="absolute z-20" style={{ left: x, top: y }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60px] h-[60px] bg-[#c05a3c] rounded-full border-[8px] border-[#9c452e] shadow-xl"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140px] h-[140px] pointer-events-none">
        {[0, 45, 90, 135].map(deg => (
          <div key={deg} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140px] h-[30px] bg-[#3e8549] rounded-full flex items-center`} style={{ transform: `translate(-50%, -50%) rotate(${deg}deg)`, boxShadow: '0 5px 15px rgba(0,0,0,0.4)', zIndex: deg }}>
            <div className="w-full h-[2px] bg-[#2d6335]"></div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBookshelf = (x, y) => (
    <div className="absolute z-10 bg-[#e08e50] border-[12px] border-[#b86b35] shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col justify-evenly p-2" style={{ left: x, top: y, width: 140, height: 450 }}>
      <div className="w-full h-[10px] bg-[#9c5525] shadow-sm"></div>
      <div className="flex items-end h-[60px] px-2 gap-1">
        <div className="w-4 h-10 bg-red-600 shadow-sm border-l border-white/20"></div><div className="w-5 h-12 bg-blue-600 shadow-sm border-l border-white/20"></div><div className="w-4 h-14 bg-yellow-500 ml-2 shadow-sm border-l border-white/20"></div>
      </div>
      <div className="w-full h-[10px] bg-[#9c5525] shadow-sm"></div>
      <div className="flex items-end h-[60px] px-2 gap-1 justify-end">
        <div className="w-6 h-12 bg-emerald-600 shadow-sm border-l border-white/20"></div><div className="w-4 h-9 bg-purple-600 shadow-sm border-l border-white/20"></div>
      </div>
      <div className="w-full h-[10px] bg-[#9c5525] shadow-sm"></div>
      <div className="flex items-end h-[60px] px-2 gap-1">
        <div className="w-5 h-14 bg-cyan-600 shadow-sm border-l border-white/20"></div><div className="w-4 h-12 bg-red-500 shadow-sm border-l border-white/20"></div><div className="w-6 h-10 bg-slate-600 ml-4 shadow-sm border-l border-white/20"></div>
      </div>
      <div className="w-full h-[10px] bg-[#9c5525] shadow-sm"></div>
    </div>
  );

  const renderWindow = (x, y) => (
    <div className="absolute z-5 bg-[#1e293b] border-x-[16px] border-t-[16px] border-[#8da5b2] shadow-[inset_0_0_50px_rgba(0,0,0,0.8),0_10px_30px_rgba(0,0,0,0.6)] overflow-hidden" style={{ left: x, top: y, width: 450, height: 180 }}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] to-[#1e3a8a]"></div>
      <div className="absolute bottom-0 left-0 right-0 h-[80px] flex items-end gap-[1px]">
        {[40, 60, 30, 80, 50, 45, 70, 35, 90, 40, 65, 55].map((h, i) => (
          <div key={i} className={`flex-1 bg-[#090e1a] flex flex-wrap gap-1 p-1 items-start justify-center`} style={{ height: h }}>
            {Math.random() > 0.5 && <div className="w-2 h-2 bg-yellow-100/80 rounded-sm shadow-[0_0_5px_rgba(254,240,138,0.8)]"></div>}
            {Math.random() > 0.7 && <div className="w-2 h-2 bg-yellow-100/80 rounded-sm shadow-[0_0_5px_rgba(254,240,138,0.8)]"></div>}
          </div>
        ))}
      </div>
      <div className="absolute top-0 bottom-0 left-1/2 w-[16px] bg-[#8da5b2] -translate-x-1/2 shadow-xl"></div>
    </div>
  );

  const NightRoom = () => {
    const cameraX = Math.max(0, Math.min(playerPos.x - VIEWPORT_WIDTH / 2, ROOM_WIDTH - VIEWPORT_WIDTH));
    const cameraY = Math.max(0, Math.min(playerPos.y - VIEWPORT_HEIGHT / 2, ROOM_HEIGHT - VIEWPORT_HEIGHT));

    return (
      <div className="w-full h-full flex items-center justify-center bg-zinc-950 px-8">
        <div className="relative border-8 border-slate-900 shadow-2xl overflow-hidden font-sans bg-zinc-900" style={{ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT }}>
          <div className="absolute inset-0 transition-transform duration-100 ease-out" style={{ width: ROOM_WIDTH, height: ROOM_HEIGHT, transform: `translate(${-cameraX}px, ${-cameraY}px)` }}>
            <div className="absolute inset-0 bg-[#2c3e50] overflow-hidden">
              {/* Wood Floor */}
              <div className="absolute inset-0 opacity-80" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(0,0,0,0.2) 38px, rgba(0,0,0,0.2) 40px)' }}></div>
              {/* Top Wall */}
              <div className="absolute top-0 left-0 right-0 h-[180px] bg-[#233547] z-0 border-b-[12px] border-slate-800 shadow-xl"></div>
              {/* Light Casts from Windows */}
              <div className="absolute top-[180px] left-[350px] w-[500px] h-[900px] bg-blue-400/10 z-0 transform skew-x-[-25deg] origin-top-left pointer-events-none mix-blend-screen" style={{ WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)', maskImage: 'linear-gradient(to bottom, black, transparent)' }}></div>
              <div className="absolute top-[180px] right-[250px] w-[500px] h-[900px] bg-blue-400/10 z-0 transform skew-x-[25deg] origin-top-right pointer-events-none mix-blend-screen" style={{ WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)', maskImage: 'linear-gradient(to bottom, black, transparent)' }}></div>

              {renderWindow(320, 0)}
              {renderWindow(930, 0)}
              {renderBookshelf(60, 350)}
              {renderBookshelf(1400, 350)}
              {renderPlant(180, 850)}
              {renderPlant(1420, 850)}

              {/* Desk */}
              <div className="absolute z-10" style={{ left: PHONE_DESK.x, top: PHONE_DESK.y, width: PHONE_DESK.w, height: PHONE_DESK.h }}>
                <div className="absolute -inset-10 top-[140px] bg-black/40 blur-2xl z-[-1] rounded-[100px]"></div>
                <div className="absolute right-0 top-0 w-full h-[140px] bg-[#e08e50] shadow-2xl rounded-sm" style={{ borderBottom: '16px solid #b86b35', borderRight: '12px solid #b86b35', borderLeft: '12px solid #b86b35' }}></div>
                <div className="absolute left-0 top-[140px] w-[140px] h-[210px] bg-[#e08e50] shadow-2xl rounded-b-sm" style={{ borderBottom: '16px solid #b86b35', borderLeft: '12px solid #b86b35', borderRight: '12px solid #b86b35' }}></div>

                {/* Monitors */}
                <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 flex items-end gap-2 drop-shadow-2xl z-30">
                  <div className="w-[160px] h-[20px] bg-[#2a3b4c] rounded-sm flex justify-center transform -rotate-[24deg] translate-y-4 translate-x-4 border border-[#1e2a38] shadow-[0_15px_30px_rgba(0,0,0,0.8)] relative">
                    <div className="absolute top-full mt-1 w-[50px] h-[35px] bg-[#cbd5e1] rounded shadow-lg -z-10"></div>
                  </div>
                  <div className="w-[200px] h-[22px] bg-[#2a3b4c] rounded border border-[#1e2a38] shadow-[0_15px_30px_rgba(0,0,0,0.8)] flex justify-center relative z-10">
                    <div className="absolute top-full mt-1 w-[70px] h-[40px] bg-[#cbd5e1] rounded shadow-lg -z-10"></div>
                  </div>
                </div>

                {/* Lamp */}
                <div className="absolute top-6 right-[30px] z-30 flex items-center justify-center">
                  <div className="w-[45px] h-[45px] bg-white rounded-full shadow-[inset_-5px_-5px_10px_rgba(0,0,0,0.2),0_10px_20px_rgba(0,0,0,0.6)] border border-slate-200"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] bg-amber-400/10 blur-[30px] rounded-full pointer-events-none"></div>
                </div>

                {/* Keyboard/Mouse */}
                <div className="absolute top-[80px] left-[230px] w-[110px] h-[36px] bg-slate-200 flex flex-wrap gap-[2px] p-1.5 rounded shadow-[0_5px_10px_rgba(0,0,0,0.4)] border border-slate-400 z-30"></div>
                <div className="absolute top-[85px] left-[360px] w-[18px] h-[28px] bg-white rounded-full shadow-[0_5px_10px_rgba(0,0,0,0.4)] border border-slate-300 z-30"></div>

                {/* Phone Trigger */}
                <div className="absolute top-[120px] left-[70px] z-40">
                  <div className={`w-[28px] h-[50px] bg-slate-900 border-[3px] border-slate-700 rounded-lg shadow-2xl relative animate-pulse`}>
                    <div className={`absolute inset-0 bg-blue-500/20 ${canInteract ? 'animate-pulse bg-blue-500/40' : ''}`}></div>
                  </div>
                </div>
              </div>

              {/* Chair */}
              <div className="absolute w-[100px] h-[100px] z-20 flex flex-col items-center drop-shadow-2xl" style={{ left: 750, top: 600 }}>
                <div className="w-[70px] h-[45px] bg-[#3a4f6d] rounded-t-2xl border-x-[6px] border-t-[6px] border-[#2c3e50] absolute -top-4 z-0"></div>
                <div className="w-[85px] h-[55px] bg-[#4a6285] rounded-b-[40px] border-b-[8px] border-[#2c3e50] relative z-10 shadow-[0_15px_30px_rgba(0,0,0,0.8)]"></div>
              </div>

              <Player x={playerPos.x} y={playerPos.y} />
            </div>
          </div>

          {canInteract && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white text-black font-bold px-6 py-3 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)] z-[400] flex items-center gap-3 animate-bounce" onClick={() => { if (gameState === 'room') setGameState('phone') }}>
              <span className="bg-black text-white px-2 py-1 rounded shadow-inner">E</span>
              <span>CHECK PHONE</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // -------------------------------------------------------------------------
  // RENDER: PHONE (FORENSIC TOOLS)
  // -------------------------------------------------------------------------
  const PhoneMode = () => {
    const [isJacketOpen, setIsJacketOpen] = useState(false);

    return (
      <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-3xl animate-in fade-in transition-all duration-1000 ${gameState === 'transition' ? 'scale-[3] opacity-0 blur-2xl' : 'scale-1 opacity-100'}`}>
        <div className="w-[400px] h-[800px] bg-[#111111] border-x-[14px] border-t-[14px] border-b-[32px] border-[#222222] rounded-[3.5rem] shadow-[0_0_150px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col">
          <div className="w-full flex flex-col bg-zinc-900/40 border-b border-white/5">
            <div className="w-full flex justify-between px-10 pt-8 pb-3 text-[10px] font-black tracking-widest text-zinc-500 uppercase italic">
              <span>11:47 PM</span>
              <div className="flex gap-2"><span>5G</span><span>🔋 88%</span></div>
            </div>
            {/* Objective Banner */}
            <div className="px-6 py-2 bg-indigo-600/20 flex items-center justify-between border-y border-indigo-500/20">
              <span className="text-[7px] font-black uppercase tracking-tighter text-indigo-300">
                Objective: {cluesFound.length < 4 ? 'Scan for Evidence [Need 4/6]' : 'CLOSE THE CASE'}
              </span>
              <span className="text-[8px] font-mono text-indigo-400">{cluesFound.length}/6</span>
            </div>
            {activeApp !== 'home' && (
              <div className="px-8 py-3 flex items-center gap-4 bg-zinc-950/40">
                <button onClick={() => setActiveApp('home')} className="text-cyan-400 font-black text-xs transition-hover hover:scale-110">← BACK</button>
                <div className="flex-1 text-center">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest italic">{activeApp}</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 overflow-hidden relative flex flex-col pt-2">
            {activeApp === 'home' && (
              <div className="grid grid-cols-4 gap-6 p-8">
                {[
                  { id: 'sms', i: '💬', name: 'Messages' },
                  { id: 'browser', i: '🌐', name: 'Web' },
                  { id: 'mission', i: '📋', name: 'Mission' },
                  { id: 'linkedin', i: '💼', name: 'Profile' }
                ].map(a => (
                  <button key={a.id} onClick={() => setActiveApp(a.id)} className="flex flex-col items-center gap-2 group">
                    <div className="w-14 h-14 bg-zinc-800 rounded-3xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:bg-zinc-700 transition-all border border-white/5 relative">
                      {a.i}
                      {((a.id === 'sms' && cluesFound.length < 1) || (a.id === 'mission' && cluesFound.length >= 4)) && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-zinc-900 animate-pulse" />}
                    </div>
                    <span className="text-zinc-500 text-[8px] font-black uppercase tracking-tighter">{a.name}</span>
                  </button>
                ))}
              </div>
            )}
            {activeApp === 'sms' && (
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                <div className="bg-[#1c1c1e] p-5 rounded-3xl border border-white/5 relative">
                  <span className="text-[10px] font-black text-red-500 tracking-tighter uppercase italic mb-2 block">+91-88XXXXXX42</span>
                  <p className="text-white text-xs leading-relaxed font-medium mb-3">⚠️ ALERT: Your CIBIL credit score has DROPPED by 74 points! Urgent action required:<br /><span className="text-blue-400 underline">bit.ly/3xRf9K2</span></p>
                  <button
                    onClick={() => {
                      discoverClue('sender_number');
                      setExpanderUrl('bit.ly/3xRf9K2');
                      setActiveApp('expander');
                      showFeedback("LINK COPIED TO TRACER");
                    }}
                    className="w-full py-2 bg-blue-600/20 border border-blue-500/40 text-blue-400 rounded-xl text-[9px] font-black uppercase italic tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                  >
                    📋 AUTO-TRACE LINK
                  </button>
                </div>
                <div className="bg-[#1c1c1e] p-5 rounded-3xl border border-white/5 opacity-80">
                  <span className="text-[10px] font-black text-blue-400 tracking-tighter uppercase italic mb-2 block">+91-77XXXXXX19</span>
                  <p className="text-white text-xs leading-relaxed font-medium">Congrats on your inheritance! CIBIL repair offer: <span className="text-blue-400 underline cursor-pointer">cutt.ly/Ak9dPr</span></p>
                </div>
              </div>
            )}

            {activeApp === 'browser' && (
              <div className="flex-1 bg-white p-4 flex flex-col items-center">
                <div className="w-full bg-slate-100 p-2 rounded-lg flex items-center gap-2 mb-6 border border-slate-200">
                  <span className="text-[8px] text-slate-400">🔒</span>
                  <span className="text-[10px] text-slate-600 font-mono italic">cibil.com/official-check</span>
                </div>
                {appStates.browser === 'initial' ? (
                  <div className="w-full space-y-4 animate-in fade-in duration-500">
                    <div className="p-10 bg-slate-100 rounded-2xl flex flex-col items-center gap-4 border border-dashed border-slate-300">
                      <div className="text-4xl grayscale opacity-50">📑</div>
                      <p className="text-[10px] text-slate-400 font-black uppercase text-center">Score Data Hidden • Encrypted</p>
                      <button
                        onClick={() => {
                          setAppStates(s => ({ ...s, browser: 'verified' }));
                          discoverClue('official_cibil');
                        }}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase italic"
                      >
                        Fingerprint Login & Verify
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full space-y-4 animate-in zoom-in-95 duration-500">
                    <div className="p-6 bg-emerald-50 border-2 border-emerald-500/30 rounded-2xl text-center relative overflow-hidden">
                      <div className="absolute top-2 right-2 text-[8px] bg-emerald-500 text-white px-2 py-0.5 rounded font-black italic">VERIFIED</div>
                      <h3 className="text-slate-900 font-black italic uppercase text-[10px] mb-2 opacity-50">Official Credit Report</h3>
                      <div className="text-5xl font-black text-emerald-600 mb-2">785</div>
                      <p className="text-emerald-700 text-[10px] font-black uppercase italic bg-emerald-100 py-1 rounded-lg">Status: EXCELLENT</p>
                    </div>
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-red-800 text-[9px] font-black leading-relaxed italic uppercase">
                        🚩 WARNING: Official records show NO drop. The SMS alert was a SMOKESCREEN.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeApp === 'linkedin' && (
              <div className="flex-1 bg-[#f3f6f8] flex flex-col">
                <div className="bg-white p-4 border-b border-zinc-200 flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0a66c2] rounded flex items-center justify-center text-white font-bold">in</div>
                  <div className="flex-1 bg-slate-100 rounded-lg h-8 border border-zinc-200" />
                </div>
                <div className="p-6">
                  {appStates.linkedin === 'initial' ? (
                    <div className="bg-white p-6 rounded-2xl shadow-xl border border-zinc-200 text-center space-y-4 animate-in slide-in-from-bottom duration-500">
                      <div className="w-20 h-20 bg-zinc-100 rounded-full mx-auto flex items-center justify-center text-4xl shadow-inner">👤</div>
                      <div>
                        <h4 className="text-zinc-900 font-black text-lg">Rajesh Kumar</h4>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Financial Specialist</p>
                      </div>
                      <button
                        onClick={() => {
                          setAppStates(s => ({ ...s, linkedin: 'scanning' }));
                          setTimeout(() => {
                            setAppStates(s => ({ ...s, linkedin: 'flagged' }));
                            discoverClue('linkedin_fake');
                          }, 2000);
                        }}
                        className="w-full py-3 bg-[#0a66c2] text-white rounded-full font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-transform"
                      >
                        Deep Scan Profile
                      </button>
                    </div>
                  ) : appStates.linkedin === 'scanning' ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-20">
                      <div className="w-16 h-16 border-4 border-[#0a66c2] border-t-transparent rounded-full animate-spin" />
                      <p className="text-[#0a66c2] font-black text-[10px] uppercase tracking-widest animate-pulse">Analyzing Connection Patterns...</p>
                    </div>
                  ) : (
                    <div className="bg-white p-6 rounded-2xl shadow-xl border-4 border-red-500 text-center space-y-4 animate-in zoom-in-95 duration-500 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />
                      <div className="w-20 h-20 bg-red-50 rounded-full mx-auto flex items-center justify-center text-4xl border-2 border-red-200">🚩</div>
                      <div>
                        <h4 className="text-red-600 font-black text-lg">MALICIOUS_BOT</h4>
                        <p className="text-zinc-500 text-[9px] font-black uppercase tracking-widest">Inconsistency Detected</p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-xl text-left text-red-900 text-[10px] font-medium leading-relaxed">
                        • Verified connections: <span className="font-black text-red-600">ZERO</span><br />
                        • Account creation: <span className="font-black text-red-600">3 DAYS AGO</span><br />
                        • Bio match: <span className="font-black text-red-600">AI GENERATED</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeApp === 'mission' && (
              <div className="flex-1 bg-[#111] p-6 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-white font-black italic uppercase text-lg tracking-tighter italic">Investigation_Log</h3>
                  <div className="bg-indigo-600 text-white text-[9px] font-black px-3 py-1 rounded-full">{cluesFound.length}/6 CLUES</div>
                </div>
                <div className="space-y-3">
                  {[
                    { id: 'step1', t: "Analyze the SMS sender & link", c: cluesFound.includes('sender_number') },
                    { id: 'step2', t: "Trace the bit.ly link chain", c: cluesFound.includes('url_chain') },
                    { id: 'step3', t: "Verify official credit records", c: cluesFound.includes('official_cibil') },
                    { id: 'step4', t: "Inspect the suspect's LinkedIn", c: cluesFound.includes('linkedin_fake') }
                  ].map(s => (
                    <div key={s.id} className={`p-4 rounded-2xl border flex items-center gap-4 transition-all duration-500 ${s.c ? 'bg-indigo-600/20 border-indigo-500/40 opacity-50' : 'bg-zinc-800 border-white/5'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${s.c ? 'bg-indigo-500 text-white' : 'border-2 border-zinc-600 text-zinc-600'}`}>
                        {s.c ? '✓' : ''}
                      </div>
                      <span className={`text-[10px] font-black uppercase italic tracking-widest ${s.c ? 'text-indigo-300' : 'text-zinc-400'}`}>{s.t}</span>
                    </div>
                  ))}
                </div>
                {cluesFound.length >= 4 && (
                  <div className="mt-auto space-y-4 animate-in slide-in-from-bottom duration-700">
                    <div className="p-6 bg-emerald-600/20 border-2 border-emerald-500/40 rounded-[30px] text-center">
                      <p className="text-emerald-400 font-black text-[10px] uppercase italic tracking-widest">Case Solved - Fraud Proven</p>
                    </div>
                    <button
                      onClick={() => { setOutcome('won'); setGameState('outcome'); }}
                      className="w-full py-6 bg-red-600 text-white rounded-[30px] font-black text-sm uppercase italic tracking-[0.2em] shadow-[0_15px_40px_rgba(220,38,38,0.5)] hover:scale-105 active:scale-95 transition-all animate-bounce"
                    >
                      🚩 COMPLETE_INVESTIGATION
                    </button>
                    <p className="text-[8px] text-zinc-500 text-center font-bold uppercase italic">Report this scammer to authorities</p>
                  </div>
                )}
              </div>
            )}
            {activeApp === 'expander' && (
              <div className="flex-1 p-6 space-y-6">
                <div className="bg-cyan-500/10 border border-cyan-500/20 p-5 rounded-3xl">
                  <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest italic mb-3 block">LINK_TRACER_v4</span>
                  <div className="flex gap-2">
                    <input value={expanderUrl} onChange={e => setExpanderUrl(e.target.value)} placeholder="Paste shortlink..." className="flex-1 bg-black rounded-xl px-4 py-3 text-white font-mono text-xs border border-white/10 outline-none" />
                    <button onClick={() => { if (expanderUrl.includes('bit.ly')) setTraceStep(1); discoverClue('url_chain'); }} className="bg-cyan-600 px-5 rounded-xl font-black text-white text-xs hover:bg-cyan-500 transition-colors">TRACE</button>
                  </div>
                </div>
                {traceStep > 0 && (
                  <div className="space-y-3">
                    {[
                      { u: 'bit.ly/3xRf9K2', t: 'ENTRY' },
                      { u: 'cibil-verify.in', t: 'HOP_1', age: '5 days', ic: true },
                      { u: 'malware-download.xyz/payload.apk', t: 'END', isApk: true }
                    ].slice(0, traceStep).map((h, i) => (
                      <div key={i} className={`p-4 rounded-2xl border transition-all animate-in slide-in-from-left duration-500 ${h.isApk ? 'bg-red-950/20 border-red-500/40' : 'bg-zinc-800/40 border-white/5'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded italic ${h.isApk ? 'bg-red-600 text-white' : 'bg-cyan-600 text-white'}`}>{h.t}</span>
                          <span className={`text-[11px] font-mono font-black ${h.isApk ? 'text-red-400' : 'text-blue-400'}`}>{h.u}</span>
                        </div>
                        <div className="flex gap-2">
                          {h.age && <button onClick={() => discoverClue('domain_age')} className="text-[8px] bg-white/5 px-2 py-1 rounded-md text-zinc-500 font-black italic">📅 AGE: {h.age}</button>}
                          {h.isApk && <button onClick={() => discoverClue('apk_endpoint')} className="text-[8px] bg-red-600 px-2 py-1 rounded-md text-white font-black italic">💀 WARNING: APK PAYLOAD</button>}
                        </div>
                      </div>
                    ))}
                    {traceStep > 0 && traceStep < 3 && <div className="text-center text-cyan-500 text-[8px] font-black italic tracking-widest animate-pulse mt-4" onAnimationEnd={() => setTimeout(() => setTraceStep(s => s + 1), 1000)}>HOPPING THROUGH TUNNEL...</div>}
                  </div>
                )}
              </div>
            )}
            <div className={`absolute bottom-0 w-full transition-all duration-500 ${isJacketOpen ? 'h-36 bg-zinc-950 border-t-2 border-indigo-500/40' : 'h-10 bg-zinc-900 border-t border-white/5'} flex flex-col items-center z-50`}>
              <button onClick={() => setIsJacketOpen(!isJacketOpen)} className={`w-12 h-1 rounded-full my-4 ${isJacketOpen ? 'bg-indigo-500 animate-pulse' : 'bg-white/10'}`} />
              {isJacketOpen && (
                <div className="flex gap-12 animate-in slide-in-from-bottom duration-300">
                  <button onClick={() => { setActiveApp('expander'); setIsJacketOpen(false); }} className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-2xl border border-indigo-500/20 shadow-xl">🔗</div>
                    <span className="text-[7px] text-zinc-500 font-black tracking-widest uppercase">Expander</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="w-full h-8 flex items-center justify-center bg-zinc-900 relative">
            <div className="w-1/3 h-1 bg-white/20 rounded-full" />
            <button onClick={() => setActiveApp('home')} className="absolute inset-0 w-full h-full cursor-pointer hover:bg-white/5 transition-colors" title="Home" />
          </div>
        </div>
        <button onClick={() => setGameState('room')} className="absolute top-10 right-10 px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl italic tracking-widest uppercase text-[10px] border border-white/10 transition-all">
          Exit Phone
        </button>
      </div>
    );
  };

  const OutcomeScreen = () => (
    <div className="fixed inset-0 z-[1000] bg-black flex items-center justify-center p-12 overflow-hidden text-center text-white">
      {outcome === 'won' ? (
        <div className="max-w-4xl space-y-12 animate-in zoom-in-95 duration-1000">
          <div className="space-y-4">
            <h1 className="text-[110px] font-black uppercase tracking-tighter italic leading-none">FORENSIC_MASTER</h1>
            <p className="text-cyan-400 font-mono text-xl tracking-[0.3em] uppercase">Level 09: The Invisible Hook Cleared</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-10 rounded-[40px] text-left relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 text-6xl opacity-20 group-hover:scale-110 transition-transform">🛡️</div>
            <h3 className="text-amber-400 font-black italic uppercase text-2xl mb-4 tracking-widest">CYBER_TIP: THE REDIRECTION TRAP</h3>
            <p className="text-zinc-300 text-lg leading-relaxed font-medium max-w-2xl">
              Phishers use shortened URLs (bit.ly, cutt.ly) to mask the ultimate destination of a link.
              Always use a <span className="text-white font-black underline">URL Expander</span> to see the full redirect chain.
              If a link ends in a <span className="text-red-500 font-black">.APK</span> or <span className="text-red-500 font-black">.EXE</span> file, it's malware, not a website.
            </p>
          </div>

          <button onClick={() => {
            adjustAssets(200);
            setSafetyScore(prev => prev + 500);
            enterLevel(10);
          }} className="bg-indigo-600 hover:bg-indigo-500 px-24 py-10 rounded-[60px] text-2xl font-black italic uppercase transition-all shadow-[0_20px_50px_rgba(79,70,229,0.4)] hover:-translate-y-2">CONTINUE_MISSION_L10</button>
        </div>
      ) : (
        <div className="space-y-12 animate-in zoom-in-95">
          <h1 className="text-[120px] font-black uppercase tracking-tighter italic text-red-600">HOOKED</h1>
          <button onClick={() => {
            adjustAssets(-380000);
            adjustLives(-1);
            setGameState('room');
            setCluesFound([]);
            setPlayerPos({ x: 780, y: 750 });
            setOutcome(null);
            setAppStates({ linkedin: 'initial', browser: 'initial', sms: 'unread', expander: 'idle' });
            setTraceStep(0);
          }} className="bg-zinc-900 border-2 border-white/10 px-20 py-10 rounded-[60px] text-lg font-black italic uppercase">TERMINATE_L9_RETRY</button>
        </div>
      )}
    </div>
  );

  const InvestigationBoard = () => (
    <div className="fixed inset-y-14 right-14 w-[650px] bg-[#d9af82] p-12 flex flex-col border-[20px] border-[#3f2b1d] z-[300] overflow-y-auto">
      <div className="bg-white/90 p-5 mb-12 flex justify-between items-center text-black">
        <h2 className="text-2xl font-black uppercase italic">EVIDENTIARY_RECORD_v9</h2>
        <button onClick={() => setIsDetectiveModeOpen(false)} className="text-red-700 font-black text-3xl">✕</button>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-10">
        {cluesFound.map(cid => (
          <div key={cid} className="bg-[#fdfcf0] p-6 shadow-2xl border-l-[6px] border-red-600 text-stone-900 italic font-black text-xs uppercase">
            <h4 className="border-b-2 border-stone-200 mb-3 pb-3">{CLUE_INFO[cid].title}</h4>
            <p>{CLUE_INFO[cid].desc}</p>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-screen h-screen bg-black overflow-hidden select-none text-white">
      {gameState === 'room' && <NightRoom />}
      {(gameState === 'phone' || gameState === 'transition') && <PhoneMode />}
      {gameState === 'outcome' && <OutcomeScreen />}
      {gameState !== 'outcome' && (
        <div className="fixed bottom-12 left-12 z-[500] flex gap-4">
          <button onClick={() => setIsDetectiveModeOpen(!isDetectiveModeOpen)} className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center text-4xl border-[6px] border-amber-300 shadow-2xl transition-hover hover:scale-110" title="Evidence Board">🕵️‍♂️</button>
        </div>
      )}
      {isDetectiveModeOpen && <InvestigationBoard />}
      <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
        {feedbackMsg && <div className="bg-indigo-600 px-12 py-4 rounded-[2.5rem] text-white font-black italic uppercase tracking-widest animate-in slide-in-from-top duration-300 shadow-[0_0_40px_rgba(79,70,229,0.4)]">{feedbackMsg}</div>}
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes dataFlow {
          0% { transform: translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(${STREET_WIDTH + 200}px); opacity: 0; }
        }
        .animate-dataFlow { animation: dataFlow linear infinite; }
        @keyframes flicker {
          0%, 100% { opacity: 1; text-shadow: 0 0 20px rgba(220,38,38,0.8); }
          50% { opacity: 0.4; text-shadow: none; }
          52% { opacity: 1; text-shadow: 0 0 20px rgba(220,38,38,0.8); }
        }
        .animate-passageFlicker { animation: flicker 3s infinite; }
      `}} />
    </div>
  );
};

export default Level9;
