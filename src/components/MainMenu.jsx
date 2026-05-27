import React from 'react';
import { useGameState } from '../context/GameStateContext';

const MainMenu = () => {
    const { enterLevel, resetProgress, colorBlindFilter, setColorBlindFilter, visualProfile, setVisualProfile } = useGameState();
    const [menuView, setMenuView] = React.useState('main'); // 'main' or 'story'
    const [showAccessibility, setShowAccessibility] = React.useState(false);
    const [isFilterDropdownOpen, setIsFilterDropdownOpen] = React.useState(false);
    const [isVisualDropdownOpen, setIsVisualDropdownOpen] = React.useState(false);

    const visualProfileOptions = [
        { id: 'none', name: 'None' },
        { id: 'low-vision', name: 'Mild Low Vision' },
        { id: 'photophobia', name: 'Light Sensitivity (Photophobia)' },
        { id: 'refractive-error', name: 'Refractive Errors' },
    ];

    const filterOptions = [
        { id: 'normal', name: 'Normal Vision' },
        { id: 'protanopia-daltonize', name: 'Protanopia (Red-Blind Correction)' },
        { id: 'deuteranopia-daltonize', name: 'Deuteranopia (Green-Blind Correction)' },
        { id: 'tritanopia-daltonize', name: 'Tritanopia (Blue-Blind Correction)' },
        { id: 'protanopia-sim', name: 'Protanopia Simulation' },
        { id: 'protanomaly-sim', name: 'Protanomaly Simulation' },
        { id: 'deuteranopia-sim', name: 'Deuteranopia Simulation' },
        { id: 'deuteranomaly-sim', name: 'Deuteranomaly Simulation' },
        { id: 'tritanopia-sim', name: 'Tritanopia Simulation' },
        { id: 'tritanomaly-sim', name: 'Tritanomaly Simulation' },
        { id: 'achromatopsia', name: 'Achromatopsia (Monochrome)' },
        { id: 'achromatomaly', name: 'Achromatomaly (Partial Monochrome)' },
    ];

    const menuButtonStyle = "group relative px-8 py-4 bg-slate-900/40 hover:bg-indigo-600/20 border border-slate-700/50 hover:border-indigo-500/50 rounded-lg transition-all duration-300 backdrop-blur-md overflow-hidden w-72 text-left";

    return (
        <div className="relative w-screen h-screen overflow-hidden flex flex-col justify-end items-end p-16 animate-fade-in font-mono">
            {/* Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-[10s] hover:scale-105"
                style={{
                    backgroundImage: 'url("/assets/Title.png")',
                    backgroundColor: '#0f172a'
                }}
            />

            {/* Dark Overlay for better button visibility */}
            <div className="absolute inset-0 z-[1] bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

            {/* Menu Content */}
            <div className="relative z-10 flex flex-col gap-6 items-end">
                <div className="mb-12" />

                {menuView === 'main' ? (
                    <>
                        {/* ═══ INITIAL SELECTION ═══ */}
                        <button
                            onClick={() => setMenuView('story')}
                            className={menuButtonStyle}
                        >
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <span className="block text-xs font-mono text-cyan-400 uppercase tracking-widest mb-1">Investigation</span>
                                    <span className="block text-2xl font-black text-white uppercase tracking-tight">Story Mode</span>
                                </div>
                                <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">🕵️‍♂️</span>
                            </div>
                            <div className="absolute bottom-0 left-0 h-1 bg-cyan-500 w-0 group-hover:w-full transition-all duration-500" />
                        </button>

                        <button
                            onClick={() => enterLevel(-4)} // Quiz Mode
                            className={menuButtonStyle}
                        >
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <span className="block text-xs font-mono text-indigo-400 uppercase tracking-widest mb-1">Defense Training</span>
                                    <span className="block text-2xl font-black text-white uppercase tracking-tight">Cyber Defense Lab</span>
                                </div>
                                <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">🧪</span>
                            </div>
                            <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 w-0 group-hover:w-full transition-all duration-500" />
                        </button>
                    </>
                ) : (
                    <>
                        {/* ═══ STORY SUB-MENU ═══ */}
                        <button
                            onClick={() => { resetProgress(); enterLevel(-3); }} // New Game (Prologue) — wipes saved data
                            className={menuButtonStyle}
                        >
                            <div className="relative z-10">
                                <span className="block text-xs font-mono text-emerald-400 uppercase tracking-widest mb-1">Establish Record</span>
                                <span className="block text-2xl font-black text-white uppercase tracking-tight">New Game</span>
                            </div>
                            <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 w-0 group-hover:w-full transition-all duration-500" />
                        </button>

                        <button
                            onClick={() => enterLevel(-1)} // Continue (Selector/Overworld)
                            className={menuButtonStyle}
                        >
                            <div className="relative z-10">
                                <span className="block text-xs font-mono text-slate-400 uppercase tracking-widest mb-1">Resume Protocol</span>
                                <span className="block text-2xl font-black text-white uppercase tracking-tight">Continue</span>
                            </div>
                            <div className="absolute bottom-0 left-0 h-1 bg-slate-500 w-0 group-hover:w-full transition-all duration-500" />
                        </button>

                        <button
                            onClick={() => setMenuView('main')}
                            className="mt-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] hover:text-white transition-colors flex items-center gap-2 pr-4"
                        >
                            <span className="text-lg">←</span> Back to Main
                        </button>
                    </>
                )}
            </div>

            {/* Accessibility / Eye button floating in top-right */}
            <div className="absolute top-8 right-8 z-50">
                <button
                    onClick={() => setShowAccessibility(!showAccessibility)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/50 hover:border-indigo-500/50 rounded-full transition-all duration-300 backdrop-blur-md text-white text-xs font-bold font-mono tracking-wider shadow-lg"
                >
                    <span className="text-sm">👁️</span>
                    <span>Accessibility</span>
                </button>

                {showAccessibility && (
                    <div className="absolute right-0 mt-3 w-80 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-5 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 font-mono text-left">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-800">
                            <span className="text-[11px] font-black text-cyan-400 uppercase tracking-widest">Color Filters</span>
                            <button onClick={() => setShowAccessibility(false)} className="text-zinc-500 hover:text-white text-xs">✕</button>
                        </div>
                        
                        <div className="relative mb-4">
                            <button
                                onClick={() => {
                                    setIsFilterDropdownOpen(!isFilterDropdownOpen);
                                    setIsVisualDropdownOpen(false);
                                }}
                                className="w-full px-4 py-3 bg-black/40 border border-slate-700 hover:border-indigo-500/50 text-white text-xs font-semibold rounded-xl flex items-center justify-between transition-all"
                            >
                                <span className="truncate pr-2">
                                    {filterOptions.find(opt => opt.id === colorBlindFilter)?.name || 'Normal Vision'}
                                </span>
                                <span className="text-zinc-500 shrink-0">{isFilterDropdownOpen ? '▲' : '▼'}</span>
                            </button>

                            {isFilterDropdownOpen && (
                                <div className="absolute left-0 right-0 mt-2 max-h-56 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 divide-y divide-slate-800/50 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                    {filterOptions.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => {
                                                setColorBlindFilter(opt.id);
                                                setIsFilterDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-[11px] font-bold transition-colors hover:bg-indigo-600 hover:text-white ${
                                                colorBlindFilter === opt.id ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-400'
                                            }`}
                                        >
                                            {opt.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => {
                                    setIsVisualDropdownOpen(!isVisualDropdownOpen);
                                    setIsFilterDropdownOpen(false);
                                }}
                                className="w-full px-4 py-3 bg-black/40 border border-slate-700 hover:border-indigo-500/50 text-white text-xs font-semibold rounded-xl flex items-center justify-between transition-all"
                            >
                                <span className="truncate pr-2">
                                    {visualProfileOptions.find(opt => opt.id === visualProfile)?.name || 'None'}
                                </span>
                                <span className="text-zinc-500 shrink-0">{isVisualDropdownOpen ? '▲' : '▼'}</span>
                            </button>

                            {isVisualDropdownOpen && (
                                <div className="absolute left-0 right-0 mt-2 max-h-56 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 divide-y divide-slate-800/50 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                    {visualProfileOptions.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => {
                                                setVisualProfile(opt.id);
                                                setIsVisualDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-4 py-2.5 text-[11px] font-bold transition-colors hover:bg-indigo-600 hover:text-white ${
                                                visualProfile === opt.id ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-400'
                                            }`}
                                        >
                                            {opt.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <p className="mt-3 text-[9px] text-zinc-500 leading-normal uppercase tracking-tight">
                            Configure accessibility profiles to adjust color spectrums, contrast levels, text sizing, and layouts.
                        </p>
                    </div>
                )}
            </div>

            {/* Build Version */}
            <div className="absolute bottom-4 left-6 z-10">
                <span className="text-slate-600 font-mono text-[10px] uppercase tracking-tighter">Build v0.4.2-PROLOGUE</span>
            </div>
        </div>
    );
};

export default MainMenu;
