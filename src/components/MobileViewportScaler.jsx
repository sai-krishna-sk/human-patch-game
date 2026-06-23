import React, { useState, useEffect } from 'react';

// Store original descriptors to allow clean restoration
const descriptorWidth = Object.getOwnPropertyDescriptor(window, 'innerWidth') || 
                       Object.getOwnPropertyDescriptor(Window.prototype, 'innerWidth') || {
                           get: () => window.innerWidth
                       };
const descriptorHeight = Object.getOwnPropertyDescriptor(window, 'innerHeight') || 
                        Object.getOwnPropertyDescriptor(Window.prototype, 'innerHeight') || {
                            get: () => window.innerHeight
                        };

const MobileViewportScaler = ({ children, active }) => {
    const [scale, setScale] = useState(1);
    const [dims, setDims] = useState({ width: 1200, height: 800 });
    const [isPortrait, setIsPortrait] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const winWidth = document.documentElement.clientWidth;
            const winHeight = document.documentElement.clientHeight;
            
            const portrait = winHeight > winWidth;
            setIsPortrait(portrait);

            if (!active || portrait) {
                setScale(1);
                setDims({ width: winWidth, height: winHeight });
                return;
            }

            // Target fixed height of 800px for consistency across all levels
            const targetHeight = 800;
            const computedScale = winHeight / targetHeight;
            
            // Calculate dynamic width based on the scale factor to fill the entire screen width
            const computedWidth = winWidth / computedScale;

            setScale(computedScale);
            setDims({ width: computedWidth, height: targetHeight });
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        
        // Timeout to handle mobile orientation changes
        const timer = setTimeout(handleResize, 150);

        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timer);
        };
    }, [active]);

    // Apply getters to window.innerWidth/innerHeight
    useEffect(() => {
        if (active && !isPortrait) {
            try {
                Object.defineProperty(window, 'innerWidth', {
                    get: () => dims.width,
                    configurable: true
                });
                Object.defineProperty(window, 'innerHeight', {
                    get: () => dims.height,
                    configurable: true
                });
                // Dispatch resize event so levels update their dimensions
                window.dispatchEvent(new Event('resize'));
            } catch (e) {
                console.error("Failed to mock window dimensions:", e);
            }
        }

        return () => {
            if (active) {
                try {
                    Object.defineProperty(window, 'innerWidth', descriptorWidth);
                    Object.defineProperty(window, 'innerHeight', descriptorHeight);
                    window.dispatchEvent(new Event('resize'));
                } catch (e) {
                    console.error("Failed to restore window dimensions:", e);
                }
            }
        };
    }, [active, dims, isPortrait]);

    if (isPortrait) {
        return (
            <div className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center p-8 text-center text-white select-none">
                <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center animate-pulse">
                        <span className="text-5xl animate-bounce">🔄</span>
                    </div>
                </div>
                <h2 className="text-2xl font-black text-cyan-400 tracking-wider uppercase mb-2 font-mono">Rotate Your Device</h2>
                <p className="text-xs text-slate-400 max-w-xs leading-relaxed uppercase tracking-widest font-mono">
                    This game is designed to be played in landscape (horizontal) mode. Please turn your phone sideways.
                </p>
            </div>
        );
    }

    if (!active) {
        return children;
    }

    return (
        <div className="w-full h-full flex items-center justify-center bg-black overflow-hidden select-none touch-none">
            <div 
                style={{ 
                    transform: `scale(${scale})`, 
                    transformOrigin: 'center center',
                    width: `${dims.width}px`,
                    height: `${dims.height}px`,
                    flexShrink: 0
                }}
                className="relative flex items-center justify-center transition-transform duration-150 ease-out"
            >
                {children}
            </div>
        </div>
    );
};

export default MobileViewportScaler;
