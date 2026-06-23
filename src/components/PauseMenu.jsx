import React from 'react';
import { useGameState } from '../context/GameStateContext';

const PauseMenu = () => {
    const { 
        setIsPaused, 
        enterLevel, 
        currentLevel, 
        assets, 
        lives, 
        safetyScore, 
        rank,
        colorBlindFilter,
        setColorBlindFilter,
        visualProfile,
        setVisualProfile,
        showTouchControls,
        setShowTouchControls,
        touchControlsScale,
        setTouchControlsScale
    } = useGameState();

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

    const handleResume = () => {
        setIsPaused(false);
    };

    const handleQuit = () => {
        setIsPaused(false);
        enterLevel(-2); // Back to Main Menu
    };

    return (
        <div className="absolute inset-0 z-[10000] flex items-center justify-center p-4">
            {/* Backdrop Blur */}
            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-300" onClick={handleResume}></div>

            {/* Menu Container */}
            <div className="relative z-10 w-full max-w-md max-h-[92%] overflow-y-auto bg-white/10 border border-white/20 backdrop-blur-xl rounded-[2rem] p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-300 custom-scrollbar">
                <div className="text-center mb-5">
                    <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-1">Game Paused</h2>
                    <div className="h-1 w-16 bg-indigo-500 mx-auto rounded-full"></div>
                </div>

                {/* HUD Stats Implementation */}
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5 space-y-3 mb-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Global Assets</span>
                        <span className="text-lg font-black text-emerald-400 font-mono tracking-tighter italic">
                             ₹{assets.toLocaleString('en-IN')}
                        </span>
                    </div>

                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Safety Score</span>
                        <span className="text-base font-black text-cyan-400 font-mono italic">
                            {safetyScore} PTS
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Active Rank</span>
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.2em] bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 italic">
                            {rank}
                        </span>
                    </div>
                </div>

                {/* Accessibility Settings */}
                <div className="mb-3 relative font-mono text-left">
                    <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Color Accessibility</label>
                    <button
                        onClick={() => {
                            setIsFilterDropdownOpen(!isFilterDropdownOpen);
                            setIsVisualDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2.5 bg-black/40 border border-white/10 hover:border-white/20 text-white text-xs font-semibold rounded-xl flex items-center justify-between transition-all"
                    >
                        <span className="truncate pr-2">
                            {filterOptions.find(opt => opt.id === colorBlindFilter)?.name || 'Normal Vision'}
                        </span>
                        <span className="text-zinc-500 shrink-0">{isFilterDropdownOpen ? '▲' : '▼'}</span>
                    </button>
                    
                    {isFilterDropdownOpen && (
                        <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-slate-900 border border-white/25 rounded-xl shadow-2xl z-50 divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {filterOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        setColorBlindFilter(opt.id);
                                        setIsFilterDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-[10px] font-bold transition-colors hover:bg-indigo-600 hover:text-white ${
                                        colorBlindFilter === opt.id ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-300'
                                    }`}
                                >
                                    {opt.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Visual Assistance Profile */}
                <div className="mb-4 relative font-mono text-left">
                    <label className="block text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5">Visual Assistance</label>
                    <button
                        onClick={() => {
                            setIsVisualDropdownOpen(!isVisualDropdownOpen);
                            setIsFilterDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2.5 bg-black/40 border border-white/10 hover:border-white/20 text-white text-xs font-semibold rounded-xl flex items-center justify-between transition-all"
                    >
                        <span className="truncate pr-2">
                            {visualProfileOptions.find(opt => opt.id === visualProfile)?.name || 'None'}
                        </span>
                        <span className="text-zinc-500 shrink-0">{isVisualDropdownOpen ? '▲' : '▼'}</span>
                    </button>
                    
                    {isVisualDropdownOpen && (
                        <div className="absolute left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-slate-900 border border-white/25 rounded-xl shadow-2xl z-50 divide-y divide-white/5 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {visualProfileOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => {
                                        setVisualProfile(opt.id);
                                        setIsVisualDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-[10px] font-bold transition-colors hover:bg-indigo-600 hover:text-white ${
                                        visualProfile === opt.id ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-300'
                                    }`}
                                >
                                    {opt.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Touch Controls Toggle & Size Slider */}
                <div className="mb-4 flex flex-col font-mono bg-black/20 rounded-xl p-3.5 border border-white/5 gap-3.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                            <span>🎮</span> Touch Controls
                        </span>
                        <button
                            onClick={() => setShowTouchControls(!showTouchControls)}
                            className={`px-3.5 py-1.5 rounded-full border text-[9px] font-bold tracking-widest uppercase transition-all duration-300 ${
                                showTouchControls 
                                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.2)]' 
                                    : 'bg-slate-800/40 border-slate-700 text-zinc-400 hover:text-white'
                            }`}
                        >
                            {showTouchControls ? 'Enabled' : 'Disabled'}
                        </button>
                    </div>

                    {showTouchControls && (
                        <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                            <div className="flex justify-between items-center text-[9px] font-black text-zinc-400 uppercase tracking-widest">
                                <span>Button Size</span>
                                <span className="text-cyan-400 font-bold">{Math.round(touchControlsScale * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0.8"
                                max="1.8"
                                step="0.05"
                                value={touchControlsScale}
                                onChange={(e) => setTouchControlsScale(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-3.5">
                    <button 
                        onClick={handleResume}
                        className="w-full py-3.5 bg-white text-black font-black uppercase tracking-[0.2em] rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center justify-center gap-3 group text-xs"
                    >
                        <span>Resume</span>
                        <span className="group-hover:translate-x-1 transition-transform">▸</span>
                    </button>

                    {currentLevel !== -2 && (
                        <button 
                            onClick={handleQuit}
                            className="w-full py-3.5 bg-red-500/10 border border-red-500/20 text-red-500 font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-red-500/20 hover:border-red-500/40 transition-all font-mono italic text-[10px]"
                        >
                            Quit to Menu
                        </button>
                    )}
                </div>

                <div className="mt-5 text-center border-t border-white/5 pt-4">
                    <p className="text-[8px] text-zinc-500 font-mono uppercase tracking-[0.4em]">Current Status // Level {currentLevel}</p>
                </div>
            </div>
        </div>
    );
};

export default PauseMenu;
