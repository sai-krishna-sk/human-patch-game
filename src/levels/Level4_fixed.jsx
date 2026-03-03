// Fixed version of Level4 market_walk section
if (gameState === 'market_walk') {
    const cameraX = Math.max(0, Math.min(playerPos.x - window.innerWidth / 2, ROOM_WIDTH - window.innerWidth));
    return (
        <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden relative">
            <FeedbackToast />

            {/* Parallax Layers with Enhanced Depth */}
            <div className="relative flex-1" style={{ width: ROOM_WIDTH, transform: `translateX(${-cameraX}px)`, transition: 'transform 0.1s linear' }}>
                {/* All the market content would go here */}
                {/* Sky, buildings, stalls, characters, etc. */}
            </div>

            {/* HUD Overlay */}
            <div className="absolute top-6 left-6 z-50 bg-black/60 p-5 rounded-2xl border-2 border-white/10 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <h3 className="text-white font-black text-lg tracking-tighter uppercase">Level 4: The QR Code Scam</h3>
                </div>
                <p className="text-amber-500 text-xs font-black font-mono tracking-[0.2em] mt-1">KAILASH NAGAR MARKET · PEAK MORNING</p>
            </div>
        </div>
    );
}
