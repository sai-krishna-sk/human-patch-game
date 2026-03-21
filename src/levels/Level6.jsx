import React, { useState, useEffect, useRef } from 'react';
import { useGameState } from '../context/GameStateContext';
import InteractionPrompt from '../components/InteractionPrompt';

// ═══ UTILITIES ═══
const ScrollStyle = () => (
    <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `}</style>
);

const StatusBar = () => (
    <div className="absolute top-0 left-0 right-0 h-6 px-6 flex justify-between items-center z-30 text-[10px] font-bold text-white/70 pointer-events-none">
        <div className="flex gap-1 items-center">
            <span>9:41</span>
        </div>
        <div className="flex gap-1.5 items-center scale-90">
            <span>📶</span>
            <span>📶</span>
            <span>🔋</span>
        </div>
    </div>
);

// ═══ PHONE APPS ═══

const PhoneCallApp = ({ step, callLog, handleAcceptLink, handleHangUp, callLogEndRef, pinnedNumber, playerChoices, handlePlayerChoice, showAnyDeskAction }) => {
    const isConnected = step >= 6;
    
    return (
        <div className="flex-1 flex flex-col min-h-0 w-full bg-slate-950 animate-in fade-in duration-700 relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-600/10 blur-[100px]" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/80 to-slate-950" />
            
            {/* Number Verification Overlay - always on top if mismatch */}
            {step >= 9 && pinnedNumber && (
                <div className="absolute inset-x-6 top-32 z-[100] animate-in slide-in-from-top duration-500">
                    <div className="bg-slate-900/95 backdrop-blur-md border border-red-500/40 rounded-2xl p-4 shadow-2xl ring-1 ring-white/10">
                        <div className="flex items-center justify-between gap-3 mb-3">
                             <div className="flex-1 text-center p-2 bg-red-950/30 rounded-lg border border-red-500/20">
                                 <p className="text-[8px] uppercase text-red-400 font-bold mb-0.5">Caller</p>
                                 <p className="text-red-400 font-mono font-black text-sm">1800-000-2233</p>
                             </div>
                             <span className="text-xl text-slate-600">≠</span>
                             <div className="flex-1 text-center p-2 bg-emerald-950/30 rounded-lg border border-emerald-500/20">
                                 <p className="text-[8px] uppercase text-emerald-400 font-bold mb-0.5">Official</p>
                                 <p className="text-emerald-400 font-mono font-black text-sm">{pinnedNumber}</p>
                             </div>
                        </div>
                        <p className="text-red-400 text-[10px] font-black uppercase text-center animate-pulse tracking-widest">⚠️ MISMATCH - SCAM CONFIRMED</p>
                    </div>
                </div>
            )}

            <div className="relative z-10 flex-1 flex flex-col min-h-0 pt-10">
                {!isConnected && step < 6 ? (
                    /* DIALING VIEW */
                    <div className="flex-1 flex flex-col px-6">
                        <div className="flex flex-col items-center mb-12 mt-12">
                            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-4xl shadow-2xl mb-6 ring-4 ring-white/5 relative">
                                <span className="relative z-10 text-white font-light">V</span>
                                <div className="absolute inset-0 bg-blue-400 blur-2xl opacity-20 animate-pulse" />
                            </div>
                            <h2 className="text-white font-light text-3xl mb-2 tracking-wide text-center">Vikram Support</h2>
                            <p className="text-emerald-400 text-xs font-bold uppercase tracking-[0.2em] animate-pulse">Calling...</p>
                        </div>
                        <div className="grid grid-cols-3 gap-y-8 gap-x-4 mb-4 opacity-50">
                             {[
                                { l: 'mute', i: '🎙️' }, { l: 'keypad', i: '🔢' }, { l: 'speaker', i: '🔊' },
                                { l: 'add call', i: '➕' }, { l: 'FaceTime', i: '📹' }, { l: 'contacts', i: '👤' }
                            ].map(ctrl => (
                                <div key={ctrl.l} className="flex flex-col items-center gap-2">
                                    <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-xl border border-white/5">{ctrl.i}</div>
                                    <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">{ctrl.l}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* CONNECTED CHAT VIEW */
                    <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {/* Compact Header */}
                        <div className="px-6 pb-6 border-b border-white/5 flex items-center gap-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-lg font-light border border-white/10">V</div>
                            <div className="flex-1">
                                <h2 className="text-white font-bold text-sm tracking-wide">Vikram Support</h2>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">In-call</p>
                                </div>
                            </div>
                            <div className="flex gap-4 text-white/40 text-lg">
                                <span>🎙️</span>
                                <span>🔊</span>
                            </div>
                        </div>

                        {/* Chat Log */}
                        <div className="flex-[1_1_0%] overflow-y-auto no-scrollbar pt-4 px-4 space-y-4 mb-1 pr-1 scroll-smooth min-h-0" ref={callLogEndRef}>
                            {callLog.map((log, i) => (
                                <div key={i} className={`flex transition-all duration-500 animate-in slide-in-from-bottom-2 ${log.sender === 'system' ? 'justify-center' : log.sender === 'vikram' ? 'justify-start' : 'justify-end'}`}>
                                    {log.sender === 'system' ? (
                                        <span className="text-[9px] text-white/20 font-bold uppercase tracking-[0.2em] bg-white/5 px-3 py-1 rounded-full my-2">{log.text}</span>
                                    ) : (
                                        <div className={`p-4 rounded-[1.5rem] max-w-[85%] text-[10.5px] leading-relaxed shadow-xl backdrop-blur-sm border ${
                                            log.sender === 'vikram' ? 'bg-slate-800/80 text-white/95 border-white/10 rounded-bl-sm' : 
                                            log.isInternal ? 'bg-slate-900/60 text-blue-300 border-blue-500/20 italic rounded-br-sm' :
                                            'bg-emerald-600/80 text-white border-emerald-400/20 rounded-br-sm'
                                        }`}>
                                            {log.text}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div className="h-4 w-full" />
                        </div>
                    </div>
                )}

                {/* Footer Controls / Dialogue Choices */}
                <div className="flex flex-col gap-4 pb-10 pt-4 px-6 border-t border-white/5 bg-slate-950/50 backdrop-blur-sm relative z-20">
                    {/* Player Dialogue Choices */}
                    {playerChoices && playerChoices.length > 0 && (
                        <div className="flex flex-col gap-3 animate-in slide-in-from-bottom-4 duration-500 max-h-[160px] overflow-y-auto no-scrollbar shrink-0 pb-2">
                            {playerChoices.map((choice, i) => (
                                <button
                                    key={i}
                                    onClick={() => handlePlayerChoice(choice)}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold py-4 px-6 rounded-2xl border border-white/10 text-left transition-all active:scale-[0.98] shadow-lg group"
                                >
                                    <div className="flex items-center justify-between">
                                        <span>{choice.text}</span>
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400">→</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-center gap-6 items-center">
                        {showAnyDeskAction && (
                            <button 
                                onClick={handleAcceptLink} 
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 transition-all animate-bounce border border-emerald-400/30 uppercase tracking-widest text-[10px]"
                            >
                                Download AnyDesk
                            </button>
                        )}
                        <button 
                            onClick={handleHangUp} 
                            className={`w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-3xl shadow-[0_0_25px_rgba(239,68,68,0.4)] active:scale-75 transition-all border-2 border-white/20 hover:brightness-110 ${step < 9 ? 'opacity-40 grayscale' : ''}`}
                        >
                            📞
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PhoneDialerApp = ({ pinnedNumber, startCall, step }) => (
    <div className="flex-1 flex flex-col w-full bg-slate-950 animate-in slide-in-from-bottom-4 duration-500 pt-10 px-6 pb-4">
        <div className="text-center mb-8 mt-4 select-none">
            <h2 className="text-white text-4xl font-light tracking-[0.1em] font-mono">1800-000-2233</h2>
            <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mt-2 hover:text-blue-400 cursor-pointer transition-colors">Add Number</p>
        </div>
        
        <div className="grid grid-cols-3 gap-y-4 gap-x-6 items-center content-start max-w-[280px] mx-auto pt-4 flex-1">
            {[
                { n: '1', s: '' }, { n: '2', s: 'ABC' }, { n: '3', s: 'DEF' },
                { n: '4', s: 'GHI' }, { n: '5', s: 'JKL' }, { n: '6', s: 'MNO' },
                { n: '7', s: 'PQRS' }, { n: '8', s: 'TUV' }, { n: '9', s: 'WXYZ' },
                { n: '*', s: '' }, { n: '0', s: '+' }, { n: '#', s: '' }
            ].map(key => (
                <div key={key.n} className="flex flex-col items-center justify-center w-16 h-16 rounded-full bg-white/5 active:scale-95 transition-all cursor-pointer hover:bg-white/10 group select-none">
                    <span className="text-2xl text-white font-light leading-none">{key.n}</span>
                    {key.s ? (
                        <span className="text-[7px] text-zinc-500 font-bold tracking-widest mt-0.5 group-hover:text-zinc-400">{key.s}</span>
                    ) : (
                        <div className="h-[11px]" />
                    )}
                </div>
            ))}
        </div>

        <div className="mt-8 flex justify-center mb-10">
                <button 
                    onClick={startCall} 
                    className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-2xl transition-all duration-500 bg-emerald-500 text-white shadow-[0_0_25px_rgba(16,185,129,0.4)] animate-bounce active:scale-95"
                >
                    📞
                </button>
        </div>

        <div className="flex justify-between items-center px-4 pt-4 border-t border-white/5 text-zinc-500 select-none">
             {[
                { l: 'Favorites', i: '⭐' },
                { l: 'Recents', i: '🕒' },
                { l: 'Contacts', i: '👤' },
                { l: 'Keypad', i: '🔢', active: true },
                { l: 'Voicemail', i: '🔘' }
             ].map(tab => (
                 <div key={tab.l} className={`flex flex-col items-center gap-1 cursor-pointer hover:text-zinc-400 transition-colors ${tab.active ? 'text-blue-500 hover:text-blue-400' : ''}`}>
                     <span className="text-lg">{tab.i}</span>
                     <span className="text-[7px] font-bold uppercase tracking-wider">{tab.l}</span>
                 </div>
             ))}
        </div>
    </div>
);

const PhoneSearchApp = ({ searchQuery, searchPhase, startTypingSearch, setSearchPhase, handleSearchResultClick }) => (
    <div className="flex-1 flex flex-col w-full bg-white rounded-t-[2.5rem] overflow-hidden animate-in slide-in-from-bottom-4 duration-500 mt-2 relative">
         {searchPhase !== 'results' ? (
            <div className="flex-1 flex flex-col bg-white">
                <div className="flex justify-end px-6 pt-10 mb-6">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200 shadow-sm text-xs select-none">A</div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-start px-8 pt-8">
                    <h1 className="text-5xl font-black mb-10 tracking-tighter flex items-center select-none">
                        <span className="text-blue-500">G</span>
                        <span className="text-red-500">o</span>
                        <span className="text-yellow-500">o</span>
                        <span className="text-blue-500">g</span>
                        <span className="text-green-500">l</span>
                        <span className="text-red-500">e</span>
                    </h1>
                    <div className="w-full h-14 border border-slate-200 rounded-full flex items-center px-6 gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group" onClick={startTypingSearch}>
                        <span className="text-slate-400 text-lg">🔍</span>
                        <div className="flex-1 text-slate-800 text-base font-medium truncate">
                            {searchQuery || <span className="text-slate-400">Search technical support...</span>}
                            {searchPhase === 'typing' && <span className="inline-block w-0.5 h-5 bg-blue-500 ml-0.5 animate-pulse align-middle" />}
                        </div>
                        <div className="flex gap-4 text-xl opacity-60">
                            <span>🎙️</span>
                            <span>📷</span>
                        </div>
                    </div>

                    <div className="mt-12 w-full">
                        <p className="text-[10px] text-zinc-400 font-black uppercase tracking-[0.2em] mb-4 pl-1">Recommended for you</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { t: 'Windows 11 Lag Fix', i: '🚀' },
                                { t: 'Update Support', i: '🛠️' },
                                { t: 'Security Patch', i: '🛡️' },
                                { t: 'System Help', i: '❓' }
                            ].map(item => (
                                <div key={item.t} className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center gap-3 active:scale-95 transition-transform cursor-pointer">
                                    <span className="text-lg">{item.i}</span>
                                    <span className="text-[10px] font-bold text-zinc-600 leading-tight">{item.t}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="flex-1 flex flex-col bg-zinc-50 pt-8">
                <div className="bg-white p-4 border-b border-zinc-200 shadow-sm flex items-center gap-4">
                     <button onClick={() => setSearchPhase('google_home')} className="text-zinc-500 p-1 hover:bg-zinc-100 rounded-full transition-colors">←</button>
                     <div className="flex-1 bg-zinc-100 rounded-full px-4 py-2 text-xs font-bold text-zinc-800 flex items-center gap-2">
                        <span className="text-blue-600 font-black text-[10px]">G</span>
                        <span className="truncate">{searchQuery}</span>
                     </div>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5">
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-zinc-200 hover:shadow-md transition-all cursor-pointer active:scale-[0.98]" onClick={handleSearchResultClick}>
                         <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] bg-zinc-800 text-white px-1.5 py-0.5 font-black rounded uppercase tracking-tighter">Ad</span>
                            <span className="text-[11px] text-zinc-500 truncate">https://www.microsoft-patch-fix.ml › support</span>
                         </div>
                         <h3 className="text-blue-700 text-base font-black leading-tight mb-2 hover:underline tracking-tight">Windows Update Support: 1800-000-2233</h3>
                         <p className="text-xs text-zinc-600 leading-relaxed">Highly recommended official technical support. Resolve performance lag and update errors immediately. Certified experts available 24/7.</p>
                         <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center gap-4 text-[10px] font-bold text-zinc-400">
                            <span>⭐ 4.9 (12.4k reviews)</span>
                            <span className="flex items-center gap-1">✅ Managed</span>
                         </div>
                    </div>
                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-zinc-200 opacity-50 select-none grayscale">
                         <div className="text-[11px] text-zinc-500 mb-1">https://support.microsoft.com › windows</div>
                         <h3 className="text-blue-700 text-sm font-bold mb-1">Windows Update: FAQ - Microsoft Support</h3>
                         <p className="text-xs text-zinc-600 line-clamp-2">Learn how to troubleshoot Windows Update errors. Common fixes for system lag and...</p>
                    </div>
                </div>
            </div>
        )}
    </div>
);

const PhoneHomeApp = ({ step, handleGoogleClick, setActivePhoneApp }) => (
    <div className="flex-1 flex flex-col pt-12 px-6 relative overflow-hidden bg-slate-950 animate-in fade-in duration-700">
         <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-black pointer-events-none" />
         <div className="flex flex-col items-center mb-16 mt-6 relative z-10 select-none">
            <h1 className="text-6xl font-extralight text-white/95 tracking-tighter">13:14</h1>
            <p className="text-[11px] font-bold text-white/40 uppercase tracking-[0.3em] mt-3">Friday, Mar 20</p>
         </div>

         {step === 3 && (
            <div className="mx-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl animate-in slide-in-from-top-6 duration-700 z-50 cursor-pointer hover:bg-slate-800 transition-all group active:scale-95 shadow-lg border-white/5" onClick={handleGoogleClick}>
                <div className="flex items-center gap-4">
                    <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg border border-white/10 group-hover:scale-105 transition-transform">🔍</div>
                    <div className="flex-1">
                        <p className="text-xs text-white font-bold leading-tight uppercase tracking-wider">Search Support?</p>
                        <p className="text-[10px] text-white/40 leading-tight mt-1">Found a fix for Windows Lag</p>
                    </div>
                    <div className="text-white/20 text-[9px] font-bold uppercase tracking-tighter">now</div>
                </div>
            </div>
         )}

         <div className="grid grid-cols-4 gap-y-12 gap-x-6 flex-1 items-start pt-8 relative z-10 px-2 overflow-y-auto no-scrollbar pb-12">
             {[
                { id: 'google', name: 'Google', icon: '🔍', bg: 'bg-white', action: handleGoogleClick },
                { id: 'phone', name: 'Phone', icon: '📞', bg: 'bg-emerald-500', action: () => setActivePhoneApp('dialer') },
                { id: 'whatsapp', name: 'WhatsApp', icon: '💬', bg: 'bg-[#25D366]' },
                { id: 'insta', name: 'Insta', icon: '📷', bg: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]' },
                { id: 'maps', name: 'Maps', icon: '📍', bg: 'bg-white' },
                { id: 'bank', name: 'Bank', icon: '🏦', bg: 'bg-blue-600' },
                { id: 'notes', name: 'Notes', icon: '📝', bg: 'bg-orange-400' },
                { id: 'gallery', name: 'Photos', icon: '🌸', bg: 'bg-white' },
             ].map(app => (
                <div key={app.id} onClick={app.action} className="flex flex-col items-center gap-3 active:scale-95 transition-transform cursor-pointer group">
                     <div className={`w-14 h-14 ${app.bg} rounded-[1.6rem] flex items-center justify-center text-2xl border border-white/10 shadow-xl group-hover:brightness-110 transition-all select-none`}>{app.icon}</div>
                     <span className="text-[10px] text-white/60 font-bold tracking-tight text-center truncate w-full select-none">{app.name}</span>
                </div>
             ))}
         </div>
    </div>
);

const PhoneUI = ({ 
    activePhoneApp, step, setIsPhoneOpen, startCall, pinnedNumber, 
    callLog, handleAcceptLink, handleHangUp, callLogEndRef,
    searchQuery, searchPhase, startTypingSearch, setSearchPhase, 
    handleSearchResultClick, handleGoogleClick, setActivePhoneApp,
    playerChoices, handlePlayerChoice, showAnyDeskAction
}) => (
    <div className="absolute inset-0 z-[500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden" onClick={() => setIsPhoneOpen(false)}>
        <ScrollStyle />
        <div className="w-[340px] h-[640px] bg-slate-950 rounded-[3.5rem] border-[10px] border-slate-900 relative shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <StatusBar />
            
            {activePhoneApp === 'call' ? (
                <PhoneCallApp 
                    step={step} callLog={callLog} handleAcceptLink={handleAcceptLink} 
                    handleHangUp={handleHangUp} callLogEndRef={callLogEndRef} 
                    pinnedNumber={pinnedNumber}
                    playerChoices={playerChoices}
                    handlePlayerChoice={handlePlayerChoice}
                    showAnyDeskAction={showAnyDeskAction}
                />
            ) : activePhoneApp === 'dialer' ? (
                <PhoneDialerApp pinnedNumber={pinnedNumber} startCall={startCall} step={step} />
            ) : activePhoneApp === 'search' ? (
                <PhoneSearchApp 
                    searchQuery={searchQuery} searchPhase={searchPhase} 
                    startTypingSearch={startTypingSearch} setSearchPhase={setSearchPhase} 
                    handleSearchResultClick={handleSearchResultClick} 
                />
            ) : (
                <PhoneHomeApp 
                    step={step} handleGoogleClick={handleGoogleClick} 
                    setActivePhoneApp={setActivePhoneApp} 
                />
            )}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-white/10 rounded-full mb-1" />
        </div>
    </div>
);

const NotebookUI = ({ notebookPage, notebookPages, pinnedNumber, handlePinNumber, setNotebookPage, setActiveZoom }) => {
    const page = notebookPages[notebookPage];
    return (
        <div className="absolute inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-8 animate-in fade-in duration-300">
            <div className="relative w-[800px] h-[550px] bg-[#fdfaf1] rounded-3xl shadow-2xl border-[16px] border-[#5c3a21] overflow-hidden flex transform -rotate-1">
                <div className="absolute left-1/2 top-0 bottom-0 w-8 bg-black/5 -translate-x-1/2 z-10" />
                <div className="flex-1 p-10 border-r border-black/5 flex flex-col">
                    <h3 className="font-mono text-stone-300 text-[10px] uppercase font-black mb-4">Page {notebookPage + 1} of {notebookPages.length}</h3>
                    <div className="text-center mb-6"><span className="text-5xl">{page.icon}</span></div>
                    <h4 className="font-serif font-black text-stone-800 text-xl mb-4">{page.title}</h4>
                    <p className="font-serif text-sm text-stone-600 leading-relaxed mb-6">{page.content}</p>
                    {page.numbers && (
                        <div className="space-y-3 mt-2">
                            {page.numbers.map((n, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <p className="font-serif text-[10px] uppercase text-stone-500 font-bold w-32">{n.label}:</p>
                                    {n.pinnable ? (
                                        <p onClick={() => handlePinNumber(n.number)} className={`font-serif text-xl font-black tracking-tight cursor-pointer transition-colors p-2 rounded-md ${pinnedNumber === n.number ? 'text-emerald-700 bg-emerald-100' : 'text-stone-900 hover:bg-amber-100 hover:text-amber-800'}`}>{n.number}</p>
                                    ) : (
                                        <p className="font-serif text-xl font-black text-stone-900 tracking-tight">{n.number}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    {page.hint && (
                        <div className="mt-auto p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-amber-700 text-xs italic">💡 {page.hint}</p>
                        </div>
                    )}
                </div>
                <div className="flex-1 p-10 flex flex-col items-center justify-center text-center">
                    {pinnedNumber ? (
                        <div className="animate-in zoom-in duration-500">
                            <div className="bg-emerald-50 p-6 border-t-8 border-emerald-600 shadow-xl transform rotate-2">
                                <h4 className="text-emerald-700 font-black uppercase text-xs mb-3">📌 Number Pinned</h4>
                                <p className="text-stone-700 text-sm font-serif leading-relaxed mb-4">Official number <span className="font-black text-emerald-800">{pinnedNumber}</span> pinned!</p>
                                <p className="text-stone-500 text-xs">Close the notebook and open your phone to compare numbers.</p>
                            </div>
                        </div>
                    ) : notebookPage < notebookPages.length - 1 ? (
                        <div onClick={() => setNotebookPage(prev => prev + 1)} className="w-full h-full bg-amber-50 rounded-xl border-2 border-dashed border-amber-200 flex flex-col items-center justify-center cursor-pointer hover:bg-amber-100 transition-all group">
                            <span className="text-5xl mb-4 group-hover:translate-x-2 transition-transform">→</span>
                            <p className="text-stone-400 font-black uppercase tracking-tighter text-[10px]">Next Page</p>
                            <p className="text-stone-500 text-xs italic mt-2">Click to turn the page</p>
                        </div>
                    ) : (
                        <div className="w-full h-full bg-amber-50 rounded-xl border-2 border-dashed border-amber-200 flex flex-col items-center justify-center">
                            <span className="text-5xl mb-4">📌</span>
                            <p className="text-stone-400 font-black uppercase tracking-tighter text-[10px]">Pin a number</p>
                            <p className="text-stone-500 text-xs italic mt-2 w-3/4">Click a helpline number on the left to pin it for verification.</p>
                        </div>
                    )}
                </div>
                <button onClick={() => setActiveZoom(null)} className="absolute top-6 right-8 text-stone-400 hover:text-stone-900 text-2xl font-light">×</button>
            </div>
        </div>
    );
};

const OutcomeUI = ({ outcomeType, completeLevel }) => (
    <div className="absolute inset-0 z-[2000] bg-slate-950 flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500">
        {outcomeType === 'scam' ? (
            <div className="max-w-xl">
                <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-8 animate-pulse">💸</div>
                <h1 className="text-5xl font-black text-white mb-6 uppercase">Total Loss</h1>
                <p className="text-slate-400 text-lg leading-relaxed mb-10">
                    By granting AnyDesk access, Vikram took control. Your savings were drained in minutes. Never share remote access with strangers!
                </p>
                <button onClick={() => window.location.reload()} className="bg-slate-800 hover:bg-slate-700 text-white font-black px-12 py-4 rounded-xl text-xs uppercase tracking-[0.3em] transition-all border border-slate-700">Try Again</button>
            </div>
        ) : (
            <div className="max-w-2xl">
                <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 shadow-xl">🛡️</div>
                <h1 className="text-5xl font-black text-white mb-4 uppercase">Success!</h1>
                <p className="text-emerald-400 font-bold mb-6 italic">"You stopped Vikram's scam in time!"</p>
                <p className="text-slate-400 text-lg leading-relaxed mb-12">
                    You verified the fraudulent number against official records and aborted the AnyDesk connection. Your account balance of <span className="text-emerald-400 font-black">₹4,20,000</span> is safe!
                </p>
                <button
                    onClick={() => completeLevel(true, 100, 0)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-16 py-5 rounded-2xl text-lg uppercase tracking-widest transition-all shadow-2xl active:scale-95"
                >
                    Finish Level
                </button>
            </div>
        )}
    </div>
);

const Level6 = () => {
    const { completeLevel, playTitleCardSound } = useGameState();

    // ═══ FLOW STEP — strict linear progression ═══
    // 0: briefing (click PC)
    // 1: full_pc_view (laggy PC + dialogues)
    // 2: desk_explore (prompt: use phone)
    // 3: phone_search (prompt: click Google)
    // 4: dialer_ready (prompt: click Call)
    // 5: call_active (conversation with Vikram)
    // 6: link_offered (Accept Support Link visible)
    // 7: anydesk_running (prompt: check notebook)
    // 8: reading_notebook (browsing clue pages)
    // 9: number_pinned (prompt: check phone to compare)
    // 10: number_verified (prompt: hang up)
    // 11: hung_up (prompt: abort from PC)
    // 12: outcome
    const [step, setStep] = useState(0);
    const [gameState, setGameState] = useState('playing'); // 'playing' or 'title_card'
    const [anydeskProgress, setAnydeskProgress] = useState(15);
    const [outroStep, setOutroStep] = useState(0); // 0: none, 1: pc_aborted, 2: temppho_dialogue, 3: end_card
    const [outroDialogueIdx, setOutroDialogueIdx] = useState(0);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const [timeLeft, setTimeLeft] = useState(90);
    const [feedbackMsg, setFeedbackMsg] = useState(null);
    const [outcomeType, setOutcomeType] = useState(null);
    const [activeZoom, setActiveZoom] = useState(null);
    const [isPhoneOpen, setIsPhoneOpen] = useState(false);
    const [isHoveringPC, setIsHoveringPC] = useState(false);
    const [isHoveringPhone, setIsHoveringPhone] = useState(false);
    const [isHoveringNotebook, setIsHoveringNotebook] = useState(false);
    const [activePhoneApp, setActivePhoneApp] = useState('home');
    const [callLog, setCallLog] = useState([]);
    const [pinnedNumber, setPinnedNumber] = useState(null);
    const [notebookPage, setNotebookPage] = useState(0);
    const [searchPhase, setSearchPhase] = useState('home'); // 'home', 'typing', 'results'
    const [searchQuery, setSearchQuery] = useState('');
    const [dialogueStep, setDialogueStep] = useState('none');
    const [playerChoices, setPlayerChoices] = useState([]);
    const [showAnyDeskAction, setShowAnyDeskAction] = useState(false);
    const [realizationStep, setRealizationStep] = useState(0); // 0: none, 1-3: thoughts

    // PC Intro
    const [pcDialogueIndex, setPcDialogueIndex] = useState(-1);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [laggedCursorPos, setLaggedCursorPos] = useState({ x: 0, y: 0 });
    const pcDialogues = [
        "What is wrong with pc...",
        "why is it lagging after update...",
        "I should contact support maybe."
    ];

    // Prompt messages for each step
    const [prompt, setPrompt] = useState(null);

    const timerRef = useRef(null);

    // Notebook clue pages
    const notebookPages = [
        {
            title: 'Common Scam Tactics',
            icon: '🚩',
            content: 'Scammers often pose as tech support from big companies like Microsoft, Apple, or your bank. They create urgency to rush you into giving remote access.',
            hint: 'Remember: Real support will NEVER cold-call you or ask for remote access.'
        },
        {
            title: 'How to Spot Fake URLs',
            icon: '🔗',
            content: 'Fake websites use domains like ".ml", ".tk", or ".xyz" instead of official ".com" or ".microsoft.com". Always check the URL carefully before trusting a website.',
            hint: 'The caller\'s website was "microsoft-patch-fix.ml" — that is NOT microsoft.com!'
        },
        {
            title: 'Verified Helplines',
            icon: '📞',
            isFinalClue: true,
            content: 'Always verify phone numbers with official records. Below are verified helplines:',
            numbers: [
                { label: 'Microsoft Support', number: '1800-425-3800', pinnable: true },
                { label: 'SBI Official Care', number: '1800-11-2211', pinnable: false }
            ]
        }
    ];

    // ═══ LOGIC ═══

    const showFeedback = (msg, color = 'cyan') => {
        setFeedbackMsg({ text: msg, color });
        setTimeout(() => setFeedbackMsg(null), 4000);
    };

    const showPrompt = (msg) => {
        setPrompt(msg);
        setTimeout(() => setPrompt(null), 5000);
    };

    const handlePinNumber = (num) => {
        setPinnedNumber(num);
        if (step === 8) {
            setStep(9);
            showPrompt("📌 Number pinned! Now open your phone and compare it with the caller's number.");
        } else {
            showPrompt("📌 Official number pinned! Now you can proceed with the call.");
        }
    };

    const callLogEndRef = useRef(null);
    useEffect(() => {
        if (callLogEndRef.current) {
            callLogEndRef.current.scrollTop = callLogEndRef.current.scrollHeight;
        }
    }, [callLog]);

    const DIALOGUES = {
        greeting: {
            text: "Hello sir, thank you for calling Microsoft Support. My name is Vikram. How can I help you today?",
            choices: [
                { text: "My PC is lagging after the last update.", next: "lag_explanation" },
                { text: "Is this the official Microsoft team?", next: "verification_attempt" }
            ]
        },
        verification_attempt: {
            text: "Yes sir, we are the Global Certified Support Team. I can see a critical kernel error on your IP address right now.",
            choices: [
                { text: "Oh, that sounds serious. Can you fix it?", next: "lag_explanation" }
            ]
        },
        lag_explanation: {
            text: "It is a known issue with the recent patch. It causes absolute system instability. I need to run a remote diagnostic to clear the cache.",
            choices: [
                { text: "Okay, how do we do that?", next: "offer_link" },
                { text: "Is my personal data safe?", next: "data_safety_lie" }
            ]
        },
        data_safety_lie: {
            text: "Absolutely sir, we use 256-bit encryption. Your data is 100% secure with Microsoft Certified engineers.",
            choices: [
                { text: "Fine, let's proceed with the fix.", next: "offer_link" }
            ]
        },
        offer_link: {
            text: "Great. I am sending you a secure support link. Please click the 'Download AnyDesk' button to establish a connection.",
            choices: [
                { text: "I'll download it now.", next: "proceed_link" },
                { text: "Wait, is there any other way to verify you?", next: "verification_doubt" }
            ],
            isAction: true,
            actionText: "Download AnyDesk"
        },
        verification_doubt: {
            text: "Sir, we are the only official Microsoft team. If you don't connect, your data will be permanently encrypted by the virus. Time is running out.",
            choices: [
                { text: "Okay, okay. I'll download it.", next: "proceed_link" }
            ]
        },
        proceed_link: {
            text: "Excellent. The link is active. Please proceed with the download.",
            isAction: true,
            actionText: "Download AnyDesk"
        }
    };

    const handlePlayerChoice = (choice) => {
        setCallLog(prev => [...prev, { sender: 'player', text: choice.text }]);
        setPlayerChoices([]);
        
        const nextDialogue = DIALOGUES[choice.next];
        if (nextDialogue) {
            setTimeout(() => {
                setCallLog(prev => [...prev, { sender: 'vikram', text: nextDialogue.text }]);
                if (nextDialogue.choices) {
                    setPlayerChoices(nextDialogue.choices);
                } else if (nextDialogue.isAction) {
                    setShowAnyDeskAction(true);
                }
            }, 1000);
        }
    };

    const startCall = () => {
        showFeedback("Connecting to Support...", "emerald");
        setTimeout(() => {
            setIsPhoneOpen(false);
            setGameState('title_card');
            if (typeof playTitleCardSound === 'function') playTitleCardSound();
        }, 100);

        setTimeout(() => {
            setGameState('playing');
            setStep(5);
            setIsPhoneOpen(true);
            setActivePhoneApp('call');
            setCallLog([{ sender: 'system', text: 'Calling 1800-000-2233...' }]);

            setTimeout(() => {
                setStep(6);
                setCallLog(prev => [...prev, { sender: 'system', text: 'Call connected.' }]);
                setTimeout(() => {
                    const firstDialogue = DIALOGUES.greeting;
                    setCallLog(prev => [...prev, { sender: 'vikram', text: firstDialogue.text }]);
                    setPlayerChoices(firstDialogue.choices);
                }, 1000);
            }, 1000);
        }, 3600);
    };

    const handleAcceptLink = () => {
        setShowAnyDeskAction(false);
        setCallLog(prev => [...prev, { sender: 'system', text: 'Connecting to AnyDesk...' }]);
        
        // Trigger Full-Screen Realization Overlay
        setRealizationStep(1);
    };

    const handleAbortSession = () => {
        clearInterval(timerRef.current);
        setOutroStep(1);
    };

    const handleHangUp = () => {
        if (step >= 5 && step < 11) {
            // During anydesk, hanging up should only work after verification (step 9+)
            if (step >= 9 && pinnedNumber) {
                setStep(11);
                setIsPhoneOpen(false);
                setActivePhoneApp('home');
                showPrompt("Good! Now quickly open the PC System Status and ABORT the connection!");
            } else {
                showFeedback("Vikram: Hello? Are you there? Please stay on the line to fix your PC!", "orange");
                showPrompt("⚠️ You cannot hang up yet! Verify the number in the records first.");
            }
        } else {
            setIsPhoneOpen(false);
            setActivePhoneApp('home');
        }
    };

    const handlePhoneClick = () => {
        if (step < 2) {
            showFeedback("Check your PC first — there's an update notification.", "orange");
            return;
        }
        setIsPhoneOpen(true);
        if (step === 2) {
            setStep(3);
            showPrompt("Search Google for 'Windows Update Support' help.");
        }
        if (step === 9) {
            setStep(10);
            showPrompt("Comparison confirmed! The numbers don't match. Hang up the call now!");
        }
    };

    const handleGoogleClick = () => {
        setActivePhoneApp('search');
        setSearchPhase('google_home');
        setSearchQuery('');
        if (step === 3) {
            showPrompt("Click the search bar to start searching.");
        }
    };

    const startTypingSearch = () => {
        if (searchPhase !== 'google_home') return;
        setSearchPhase('typing');
        const target = "Windows Update Support";
        let current = "";
        let i = 0;
        const interval = setInterval(() => {
            current += target[i];
            setSearchQuery(current);
            i++;
            if (i >= target.length) {
                clearInterval(interval);
                setTimeout(() => {
                    setSearchPhase('results');
                    if (step === 3) {
                        showPrompt("Click the search result link to call support.");
                    }
                }, 800);
            }
        }, 50);
    };

    const handleSearchResultClick = () => {
        setActivePhoneApp('dialer');
        if (step === 3) setStep(4);
        showPrompt("Press the green call button to connect.");
    };

    const handleNotebookClick = () => {
        if (step < 2) {
            showFeedback("Investigate the PC first.", "orange");
            return;
        }
        setActiveZoom('notebook');
        setNotebookPage(0);
        if (step === 7) {
            setStep(8);
        }
    };

    const handleMonitorClick = () => {
        if (step === 0) {
            setStep(1);
            return;
        }
        if (step === 11) {
            setActiveZoom('laptop-left');
            return;
        }
        if (step >= 7) {
            setActiveZoom('laptop-left');
            return;
        }
        if (step >= 2) {
            showFeedback("Nothing to do on the PC right now. Use your phone!", "orange");
        }
    };

    // ═══ EFFECTS ═══

    useEffect(() => {
        const handleMouseMove = (e) => setCursorPos({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    useEffect(() => {
        if (step === 1) {
            const interval = setInterval(() => {
                setLaggedCursorPos(prev => ({
                    x: prev.x + (cursorPos.x - prev.x) * 0.05,
                    y: prev.y + (cursorPos.y - prev.y) * 0.05
                }));
            }, 16);
            return () => clearInterval(interval);
        } else {
            setLaggedCursorPos(cursorPos);
        }
    }, [cursorPos, step]);

    useEffect(() => {
        if (step === 1) {
            let s = 0;
            const seqInterval = setInterval(() => {
                if (s < pcDialogues.length) {
                    setPcDialogueIndex(s);
                    s++;
                } else clearInterval(seqInterval);
            }, 3000);
            return () => clearInterval(seqInterval);
        } else {
            setPcDialogueIndex(-1);
        }
    }, [step]);

    useEffect(() => {
        if (step >= 7 && step < 12) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setOutcomeType('scam');
                        setStep(12);
                        return 0;
                    }
                    return prev - 1;
                });
                setAnydeskProgress(prev => Math.min(100, prev + 1.1));
            }, 1000);
        } else if (step < 7) {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [step]);

    // ═══ OUTRO LOGIC ═══
    useEffect(() => {
        let timer1, timer2;
        if (outroStep === 1) {
            timer1 = setTimeout(() => {
                setIsFadingOut(true);
                timer2 = setTimeout(() => {
                    setOutroStep(2);
                    setIsFadingOut(false);
                }, 1000);
            }, 2500);
        } else if (outroStep === 2) {
            const linesLength = 4;
            if (outroDialogueIdx < linesLength) {
                timer1 = setTimeout(() => {
                    if (outroDialogueIdx === linesLength - 1) {
                        setIsFadingOut(true);
                        timer2 = setTimeout(() => {
                            setOutroStep(3);
                            setIsFadingOut(false);
                        }, 1000);
                    } else {
                        setOutroDialogueIdx(prev => prev + 1);
                    }
                }, 3800);
            }
        }
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [outroStep, outroDialogueIdx]);

    // Step 9 → auto prompt to check phone
    useEffect(() => {
        if (step === 10) {
            showPrompt("The numbers don't match! This is a scam! Hang up the call now!");
        }
    }, [step]);


    const RealizationOverlay = ({ step, onComplete }) => {
    const thoughts = [
        "I don't feel it's real...",
        "Grandpa will have the number in his records.",
        "Let's search it first."
    ];

    useEffect(() => {
        if (step > 0 && step <= thoughts.length) {
            const timer = setTimeout(() => {
                onComplete(step + 1);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [step]);

    if (step === 0 || step > thoughts.length) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[5000] flex items-center justify-center p-12 text-center select-none animate-in fade-in duration-1000">
            <div className="max-w-3xl space-y-12">
                <div className="flex justify-center mb-8">
                    <div className="w-16 h-1 w-32 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-pulse" />
                </div>
                
                <h2 key={step} className="text-4xl md:text-5xl font-extralight text-white/95 tracking-tight leading-relaxed animate-realization italic">
                    "{thoughts[step - 1]}"
                </h2>

                <div className="flex justify-center mt-12">
                    <div className="flex gap-2">
                        {thoughts.map((_, i) => (
                            <div 
                                key={i} 
                                className={`w-2 h-2 rounded-full transition-all duration-1000 ${i + 1 === step ? 'bg-blue-500 w-8' : 'bg-white/10'}`} 
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// ═══ MAIN COMPONENT ═══
    return (
        <div className="w-full h-full flex items-center justify-center bg-zinc-950 font-sans overflow-hidden select-none relative">
            <div className="w-full h-full relative overflow-hidden">
                {/* BACKGROUND */}
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
                    style={{
                        backgroundImage: "url('/assets/temppho.png')",
                        transform: activeZoom ? 'scale(1.1) translateY(5%)' : 'scale(1)'
                    }}
                />

                {/* UPDATE INSTALLED NOTIFICATION */}
                {step === 0 && (
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 translate-y-12 z-20 animate-bounce">
                        <div className="bg-blue-600 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 border border-blue-400">
                            <span className="text-sm">🔄</span> Update Installed. Click to view.
                        </div>
                        <div className="w-3 h-3 bg-blue-600 transform rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2 border-r border-b border-blue-400"></div>
                    </div>
                )}

                {/* Laggy Cursor */}
                {step === 1 && (
                    <div
                        className="pointer-events-none fixed z-[3000] w-6 h-6 flex items-center justify-center animate-spin"
                        style={{ left: laggedCursorPos.x - 12, top: laggedCursorPos.y - 12, transition: 'none' }}
                    >
                        <div className="w-6 h-6 border-[6px] border-blue-500 border-t-transparent rounded-full shadow-lg" />
                    </div>
                )}

                {/* FULL PC VIEW */}
                {step === 1 && (
                    <div className="absolute inset-0 z-[100] bg-black animate-in fade-in duration-500 overflow-hidden flex flex-col select-none cursor-none">
                        <div className="absolute inset-0 flex flex-col">
                            <div className="flex-1 bg-gradient-to-br from-blue-600 to-indigo-900 border-b border-slate-700 p-4">
                                <div className="space-y-6">
                                    <div className="flex flex-col items-center w-20 gap-1 opacity-50">
                                        <div className="w-10 h-10 bg-white/20 rounded shadow-sm"></div>
                                        <div className="text-white text-[10px] text-center drop-shadow-md">Recycle Bin</div>
                                    </div>
                                    <div className="flex flex-col items-center w-20 gap-1 opacity-50">
                                        <div className="w-10 h-10 bg-blue-400/20 rounded shadow-sm"></div>
                                        <div className="text-white text-[10px] text-center drop-shadow-md">Browser</div>
                                    </div>
                                </div>
                            </div>
                            <div className="h-12 bg-slate-950 flex items-center px-4 justify-between border-t border-slate-800">
                                <div className="flex gap-2 items-center">
                                    <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center font-black text-blue-400 text-lg">⊞</div>
                                    <div className="w-48 h-8 bg-slate-900 rounded-md border border-slate-800 flex items-center px-3 text-slate-500 text-xs text-opacity-50">Search</div>
                                </div>
                                <div className="flex gap-4 items-center text-slate-400 text-xs">
                                    <span>ENG</span>
                                    <span>10:45 AM</span>
                                </div>
                            </div>
                        </div>

                        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                            {pcDialogues.map((text, idx) => (
                                <div
                                    key={idx}
                                    className={`text-3xl font-serif italic text-white font-bold drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] transition-all duration-1000 my-4 transform ${idx <= pcDialogueIndex ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}
                                >
                                    "{text}"
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => { setStep(2); showPrompt("Use your smartphone on the desk to search for help."); }}
                            className={`absolute bottom-20 left-1/2 -translate-x-1/2 z-30 bg-red-600 hover:bg-red-500 text-white font-black px-8 py-4 rounded-xl shadow-2xl transition-all uppercase tracking-widest text-sm cursor-auto ${pcDialogueIndex >= pcDialogues.length - 1 ? 'opacity-100 animate-bounce' : 'opacity-0 pointer-events-none'}`}
                        >
                            Quit PC Screen
                        </button>
                    </div>
                )}

                {/* HOTSPOTS */}
                {!activeZoom && step !== 12 && step !== 1 && (
                    <div className="absolute inset-0 z-10">
                        {/* Monitor */}
                        <button
                            onMouseEnter={() => setIsHoveringPC(true)}
                            onMouseLeave={() => setIsHoveringPC(false)}
                            onClick={handleMonitorClick}
                            className="absolute left-[43.5%] top-[39%] w-[27%] h-[27%] bg-transparent cursor-pointer group z-40 outline-none"
                            title="System Status"
                            aria-label="System Status"
                        >
                            {/* Hover Overlay Outline matching the monitor screen loosely */}
                            <div className={`absolute inset-0 border-2 rounded-sm transition-all duration-300 ${isHoveringPC || step === 11 ? (step === 11 ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)] bg-red-500/5' : 'border-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.3)] bg-cyan-400/5') : 'border-transparent'}`}></div>
                            
                            {step === 11 ? (
                                <span className="absolute inset-0 flex items-center justify-center text-white font-black text-[10px] uppercase tracking-widest bg-red-600/40 backdrop-blur-[2px] animate-pulse">🛑 Click to Abort</span>
                            ) : isHoveringPC && step >= 2 ? (
                                <span className="absolute inset-0 flex items-center justify-center text-white font-black text-[10px] uppercase tracking-widest bg-cyan-500/20 backdrop-blur-[2px]">System Status</span>
                            ) : null}
                        </button>

                        {/* Soft pulse on hit zone when not hovered to draw attention passively */}
                        {!isHoveringPC && (
                            <div className={`absolute left-[43.5%] top-[39%] w-[27%] h-[27%] border-2 rounded-sm animate-pulse pointer-events-none ${step === 11 ? 'border-red-500/40' : 'border-cyan-400/20'}`}></div>
                        )}

                        {/* Phone */}
                        <button
                            onMouseEnter={() => setIsHoveringPhone(true)}
                            onMouseLeave={() => setIsHoveringPhone(false)}
                            onClick={handlePhoneClick}
                            className="absolute left-[20%] top-[75%] w-[10%] h-[18%] bg-transparent cursor-pointer group z-40 outline-none"
                            title="Smartphone"
                            aria-label="Smartphone"
                        >
                            <div className={`absolute inset-0 border-2 rounded-xl transition-all duration-300 ${isHoveringPhone || step === 2 || step === 9 ? 'border-cyan-400/40 shadow-[0_0_15px_rgba(34,211,238,0.3)] bg-cyan-400/5' : 'border-transparent'}`}></div>
                        </button>
                        
                        {/* Phone Passive Pulse */}
                        {!isHoveringPhone && (step === 2 || step === 9) && (
                            <div className="absolute left-[20%] top-[75%] w-[10%] h-[18%] border-2 border-cyan-400/20 rounded-xl animate-pulse pointer-events-none"></div>
                        )}

                        {/* Notebook (Records) */}
                        <button
                            onMouseEnter={() => setIsHoveringNotebook(true)}
                            onMouseLeave={() => setIsHoveringNotebook(false)}
                            onClick={handleNotebookClick}
                            className="absolute right-[12%] top-[60%] w-[14%] h-[22%] bg-transparent cursor-pointer group z-40 outline-none"
                            title="Records"
                            aria-label="Records"
                        >
                            {/* Glowing yellow outline */}
                            <div className={`absolute inset-0 border-2 rounded-sm transition-all duration-300 ${isHoveringNotebook || step === 7 ? 'border-amber-400/60 shadow-[0_0_20px_rgba(251,191,36,0.4)] bg-amber-400/5' : 'border-transparent'}`}></div>
                        </button>
                        
                        {/* Notebook Passive Pulse - Now shows up early if number not pinned */}
                        {!isHoveringNotebook && (step === 7 || (step >= 2 && step < 5 && !pinnedNumber)) && (
                            <div className="absolute right-[12%] top-[60%] w-[14%] h-[22%] border-2 border-amber-400/40 rounded-sm animate-pulse pointer-events-none shadow-[0_0_20px_rgba(251,191,36,0.25)]"></div>
                        )}
                    </div>
                )}

                {/* SYSTEM STATUS ZOOM */}
                {activeZoom === 'laptop-left' && (
                    <div className="absolute inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-20 animate-in zoom-in-95 duration-300">
                        <div className="w-[650px] bg-slate-900 border-[10px] border-slate-800 rounded-3xl shadow-2xl flex flex-col p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-cyan-400 font-black uppercase text-sm tracking-widest">System Monitor</h2>
                                <button onClick={() => setActiveZoom(null)} className="text-slate-500 hover:text-white text-3xl">×</button>
                            </div>
                            <div className="space-y-6">
                                <div className="bg-black/40 p-5 border border-white/5 rounded-2xl">
                                    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500 mb-3">
                                        <span>Connection: AnyDesk</span>
                                        <span className={step >= 7 && step < 12 ? 'text-red-500 animate-pulse' : 'text-slate-600'}>
                                            {step >= 7 && step < 12 ? 'Active Transfer' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div className="h-4 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                                        <div className="h-full bg-red-600 transition-all duration-1000" style={{ width: `${anydeskProgress}%` }} />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-3 font-mono">Target: {step >= 7 && step < 12 ? 'anydesk-fix.ml' : 'None'}</p>
                                </div>

                                {step >= 7 && step < 12 && (
                                    <div className="space-y-4">
                                        {step >= 11 && pinnedNumber ? (
                                            <>
                                                <div className="bg-black/30 p-4 rounded-2xl border border-white/5">
                                                    <p className="text-[10px] uppercase font-bold text-slate-500 mb-3">Number Verification</p>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex-1 text-center p-3 bg-red-950/50 rounded-xl border border-red-500/30">
                                                            <p className="text-[9px] uppercase text-red-400 font-bold mb-1">Caller's Number</p>
                                                            <p className="text-red-400 font-mono font-black text-lg">1800-000-2233</p>
                                                        </div>
                                                        <span className="text-2xl text-slate-600">≠</span>
                                                        <div className="flex-1 text-center p-3 bg-emerald-950/50 rounded-xl border border-emerald-500/30">
                                                            <p className="text-[9px] uppercase text-emerald-400 font-bold mb-1">Official Record</p>
                                                            <p className="text-emerald-400 font-mono font-black text-lg">{pinnedNumber}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-red-400 text-[10px] font-bold uppercase mt-3 text-center animate-pulse">⚠️ SCAM CONFIRMED</p>
                                                </div>
                                                <button
                                                    onClick={handleAbortSession}
                                                    className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-sm"
                                                    disabled={outroStep > 0}
                                                >
                                                    {outroStep >= 1 ? "🛑 SESSION ABORTED" : "🛑 Force Abort Connection"}
                                                </button>
                                                {outroStep === 1 && (
                                                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 bg-red-600/90 text-white p-6 z-[60] animate-in zoom-in-95 duration-300 backdrop-blur-md shadow-[0_0_100px_rgba(220,38,38,0.5)]">
                                                        <h3 className="text-3xl font-black text-center tracking-[0.2em] uppercase italic">CONNECTION ABORTED</h3>
                                                        <p className="text-center font-mono text-xs mt-2 font-bold tracking-widest">THREAT NEUTRALIZED - REMOTE ACCESS TERMINATED</p>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="bg-amber-950/30 p-5 rounded-2xl border border-amber-500/20 text-center">
                                                <p className="text-amber-400 font-black text-xs uppercase tracking-widest mb-2">🔒 Verification Required</p>
                                                <p className="text-slate-400 text-xs leading-relaxed">
                                                    {step < 9
                                                        ? <>Check the <span className="text-amber-300 font-bold">Records notebook</span> on the desk and find the official number.</>
                                                        : step < 11
                                                            ? <>Verify the number on your <span className="text-amber-300 font-bold">phone</span> first, then hang up the call.</>
                                                            : <>Complete verification before aborting.</>
                                                    }
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* NOTEBOOK */}
                {activeZoom === 'notebook' && (
                    <NotebookUI 
                        notebookPage={notebookPage} 
                        notebookPages={notebookPages} 
                        pinnedNumber={pinnedNumber} 
                        handlePinNumber={handlePinNumber} 
                        setNotebookPage={setNotebookPage} 
                        setActiveZoom={setActiveZoom} 
                    />
                )}

                {/* INTERACTION PROMPTS (matching Level 3 style) */}
                {!activeZoom && step !== 12 && step !== 1 && (
                    <>
                        {(step === 0 || step === 11) && !isHoveringPC && (
                            <InteractionPrompt text="Click the computer" showKey={false} />
                        )}
                        {(step === 2 || step === 9) && !isHoveringPhone && (
                            <InteractionPrompt text="Click phone below" showKey={false} />
                        )}
                        {step === 7 && !isHoveringNotebook && (
                            <InteractionPrompt text="See the records on the table" showKey={false} />
                        )}
                    </>
                )}

                {/* UI OVERLAYS */}
                {isPhoneOpen && (
                    <PhoneUI 
                        activePhoneApp={activePhoneApp}
                        step={step}
                        setIsPhoneOpen={setIsPhoneOpen}
                        startCall={startCall}
                        pinnedNumber={pinnedNumber}
                        callLog={callLog}
                        handleAcceptLink={handleAcceptLink}
                        handleHangUp={handleHangUp}
                        callLogEndRef={callLogEndRef}
                        searchQuery={searchQuery}
                        searchPhase={searchPhase}
                        startTypingSearch={startTypingSearch}
                        setSearchPhase={setSearchPhase}
                        handleSearchResultClick={handleSearchResultClick}
                        handleGoogleClick={handleGoogleClick}
                        setActivePhoneApp={setActivePhoneApp}
                        playerChoices={playerChoices}
                        handlePlayerChoice={handlePlayerChoice}
                        showAnyDeskAction={showAnyDeskAction}
                    />
                )}

                <RealizationOverlay 
                    step={realizationStep} 
                    onComplete={(next) => {
                        if (next > 3) {
                            setRealizationStep(0);
                            setStep(7);
                            setIsPhoneOpen(false); 
                            showPrompt("⚠️ AnyDesk is running! Check the Records notebook on the desk.");
                        } else {
                            setRealizationStep(next);
                        }
                    }} 
                />
                {step === 12 && <OutcomeUI outcomeType={outcomeType} completeLevel={completeLevel} />}

                {/* HUD */}
                <div className="absolute top-8 left-8 z-20 flex gap-4">
                    {pinnedNumber && (
                        <div className="bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-4">
                            <span className="font-black text-xs uppercase tracking-widest">📌 Pinned</span>
                            <span className="font-mono text-xl font-black tracking-tight">{pinnedNumber}</span>
                        </div>
                    )}
                    {step >= 7 && step < 12 && (
                        <div className="bg-slate-900 border-2 border-red-500 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-4">
                            <span className="text-red-500 font-black text-xs uppercase tracking-widest animate-pulse">AnyDesk</span>
                            <span className="text-white font-mono text-xl font-black">00:{timeLeft.toString().padStart(2, '0')}</span>
                        </div>
                    )}
                </div>

                {/* PROMPT TOAST */}
                {prompt && (
                    <div className="absolute inset-x-0 bottom-12 flex justify-center z-[1500] pointer-events-none animate-in slide-in-from-bottom duration-500">
                        <div className="bg-slate-900/95 border border-slate-700 text-white px-8 py-4 rounded-2xl shadow-2xl max-w-xl text-center">
                            <p className="text-sm font-medium leading-relaxed">{prompt}</p>
                        </div>
                    </div>
                )}

                {/* FEEDBACK */}
                {feedbackMsg && (
                    <div className="absolute inset-x-0 top-32 flex justify-center z-[1000] pointer-events-none">
                        <div className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl animate-in slide-in-from-top duration-300 border-b-4 ${feedbackMsg.color === 'red' ? 'bg-red-600 border-red-800' : feedbackMsg.color === 'orange' ? 'bg-orange-500 border-orange-700' : feedbackMsg.color === 'emerald' ? 'bg-emerald-600 border-emerald-800' : 'bg-cyan-600 border-cyan-800'} text-white`}>
                            {feedbackMsg.text}
                        </div>
                    </div>
                )}

                {/* CINEMATIC OUTRO OVERLAY */}
                {outroStep >= 2 && (
                    <div className={`absolute inset-0 z-[10000] bg-black flex flex-col items-center justify-center transition-opacity duration-1000 ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
                        {outroStep === 2 && (
                            <div className="w-full h-full relative flex items-center justify-center">
                                {/* Background Image dimmed */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center brightness-[0.2]"
                                    style={{ backgroundImage: "url('/assets/temppho.png')" }}
                                />

                                <div className="relative z-20 text-center px-12 max-w-5xl">
                                    <div className="relative h-32 flex items-center justify-center">
                                        {[
                                            "There are scams everywhere... invisible hooks in every corner of the web. Be careful.",
                                            "I should just restart my PC, maybe that will fix the lag.",
                                            "Also, I'm hungry.",
                                            "I should go out for some snacks or something."
                                        ].map((line, idx) => (
                                            <div
                                                key={idx}
                                                className={`absolute inset-0 flex items-center justify-center text-4xl font-serif italic text-white font-bold drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] transition-all duration-1000 text-center ${idx === outroDialogueIdx ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'}`}
                                            >
                                                "{line}"
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {outroStep === 3 && (
                            <div className="w-full h-full bg-stone-950 flex flex-col items-center justify-center animate-fadeIn relative overflow-hidden text-center p-8">
                                {/* Scanning line effects */}
                                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%]" />
                                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-cyan-500/10 to-transparent animate-scanLine pointer-events-none" />

                                <div className="flex flex-col items-center relative z-10">
                                    <div className="absolute -inset-20 bg-cyan-500/5 blur-[100px] rounded-full animate-pulse" />

                                    <div className="relative mb-12">
                                        <h2 className="text-white text-5xl md:text-6xl font-black tracking-[0.4em] uppercase relative z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                            Level 6: Tech Support Fraud
                                        </h2>
                                        <div className="absolute top-1/2 left-[-10%] w-[120%] h-2 md:h-3 bg-red-600 shadow-[0_0_30px_rgba(220,38,38,0.8)] z-20 skew-y-[-1deg] animate-strikeThrough origin-left" />
                                    </div>

                                    <div className="text-7xl md:text-9xl font-black italic tracking-[0.15em] uppercase relative">
                                        <div className="bg-clip-text text-transparent bg-gradient-to-b from-emerald-300 via-emerald-500 to-emerald-700 animate-surge relative z-10">
                                            COMPLETED
                                        </div>
                                        {/* Chromatic layers */}
                                        <div className="absolute inset-0 text-cyan-400 opacity-40 translate-x-1 -z-10 animate-aberration">COMPLETED</div>
                                        <div className="absolute inset-0 text-red-500 opacity-40 -translate-x-1 -z-10 animate-aberration-alt">COMPLETED</div>
                                    </div>

                                    <div className="mt-16 flex flex-col items-center gap-6">
                                        <div className="h-px w-64 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
                                        <div className="text-[10px] font-mono text-zinc-500 tracking-[1em] uppercase opacity-70 animate-pulse">
                                            Forensics Deep Scan // Status: 100% Verified
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => completeLevel(true, 100, 0)}
                                        className="mt-20 group relative overflow-hidden bg-white/5 hover:bg-white/10 text-white font-black px-12 py-5 rounded-2xl text-xs uppercase tracking-[0.3em] transition-all border border-white/10 hover:border-white/20 hover:scale-105 active:scale-95 shadow-2xl"
                                    >
                                        <span className="relative z-10">Proceed to Next Mission</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Global Fade Overlay */}
                <div className={`fixed inset-0 z-[20000] bg-black pointer-events-none transition-opacity duration-1000 ${isFadingOut ? 'opacity-100' : 'opacity-0'}`} />

                {/* CINEMATIC TITLE CARD PHASE */}
                {gameState === 'title_card' && (
                    <div className="absolute inset-0 bg-black z-[9000] flex flex-col items-center justify-center animate-cinematic-sequence overflow-hidden">
                        <div className="flex flex-col items-center relative">
                            {/* Dramatic pulse rings */}
                            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-3xl animate-ping scale-[2.5] opacity-50" />

                            <div className="h-px w-32 bg-gradient-to-r from-transparent via-red-500 to-transparent mb-8 animate-width" />

                            <h2 className="text-white text-6xl font-black tracking-[0.4em] uppercase mb-4 relative opacity-0" style={{ animation: 'fadeIn 1s forwards, surge 3.5s infinite' }}>
                                <span className="relative z-10">Level 6</span>
                                {/* Chromatic aberration layers */}
                                <span className="absolute inset-0 text-red-500 opacity-60 translate-x-1 -z-10 animate-aberration">Level 6</span>
                                <span className="absolute inset-0 text-cyan-400 opacity-60 -translate-x-1 -z-10 animate-aberration-alt">Level 6</span>
                            </h2>

                            <h3 className="text-red-500 text-lg font-mono tracking-[0.8em] uppercase opacity-0 font-bold" style={{ animation: 'fadeIn 1s forwards 1.2s' }}>
                                Tech Support Fraud
                            </h3>

                            <div className="h-px w-32 bg-gradient-to-r from-transparent via-red-500 to-transparent mt-12 animate-width" />

                            {/* Tension metadata */}
                            <div className="mt-8 text-[8px] font-mono text-zinc-800 tracking-widest uppercase animate-pulse">
                                INITIALISING REMOTE ACCESS... [33%] [66%] [99%]
                            </div>
                        </div>
                    </div>
                )}

                <style dangerouslySetInnerHTML={{
                    __html: `
                .animate-cinematic-sequence { animation: cinematic-sequence 3.5s forwards; }
                .animate-width { animation: width 1.5s ease-in-out forwards; }
                .animate-aberration { animation: aberration 1.5s infinite; }
                .animate-aberration-alt { animation: aberration-alt 1.5s infinite; }

                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes width { from { width: 0; opacity: 0; } to { width: 12rem; opacity: 0.8; } }
                @keyframes surge {
                    0%, 100% { transform: scale(1); filter: brightness(1); }
                    50% { transform: scale(1.08); filter: brightness(1.3); drop-shadow: 0 0 40px rgba(255,255,255,0.4); }
                }
                @keyframes cinematic-sequence {
                    0% { opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { opacity: 0; }
                }
                @keyframes scanLine { from { transform: translateY(-100%); } to { transform: translateY(200%); } }
                @keyframes strikeThrough { from { width: 0; } to { width: 120%; } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes aberration {
                    0%, 100% { transform: translate(0, 0); opacity: 0.6; }
                    25% { transform: translate(-4px, 2px); opacity: 0.8; }
                    50% { transform: translate(4px, -2px); opacity: 0.6; }
                    75% { transform: translate(-2px, -4px); opacity: 0.8; }
                }
                @keyframes aberration-alt {
                    0%, 100% { transform: translate(0, 0); opacity: 0.6; }
                    25% { transform: translate(4px, -2px); opacity: 0.8; }
                    50% { transform: translate(-4px, 2px); opacity: 0.6; }
                    75% { transform: translate(2px, 4px); opacity: 0.8; }
                }

                @keyframes realization-fade {
                    0% { opacity: 0; transform: translateY(10px); }
                    15% { opacity: 1; transform: translateY(0); }
                    85% { opacity: 1; transform: translateY(0); }
                    100% { opacity: 0; transform: translateY(-10px); }
                }
                .animate-realization {
                    animation: realization-fade 2s ease-in-out forwards;
                }
            ` }} />
            </div>
        </div>
    );
};

export default Level6;
