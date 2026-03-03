import React, { useState, useEffect, useCallback, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════
// WEBSITE SCENARIOS
// ═══════════════════════════════════════════════════════════════
const WEBSITES = [
    {
        id: 1,
        title: "Global Finance Bank",
        url: "https://www.globalfinance.com/login",
        isSecure: true,
        hasCertError: false,
        siteType: "bank",
        correctAction: "enter",
        explanation: "This is a legitimate bank portal with valid encryption and a correct domain.",
        clue: "The URL matches the official brand and the SSL lock is valid."
    },
    {
        id: 2,
        title: "Social Connect",
        url: "https://login.sociaIconnect.com/auth",
        isSecure: true,
        hasCertError: false,
        siteType: "social",
        correctAction: "exit",
        explanation: "Homograph Attack: The 'l' in 'social' is actually a capital 'I'.",
        clue: "Look closely at 'sociaI'—that's a capital 'I' instead of 'l'."
    },
    {
        id: 3,
        title: "Internal Corporate Portal",
        url: "https://portal.corp-internal.net",
        isSecure: true,
        hasCertError: true,
        certWarning: "Your connection is not private. Attackers might be trying to steal your information.",
        siteType: "portal",
        correctAction: "exit",
        explanation: "Certificate errors on sensitive portals often indicate a Man-in-the-Middle attack.",
        clue: "The browser is explicitly warning you about an invalid certificate chain."
    },
    {
        id: 4,
        title: "Mega Discount Store",
        url: "http://super-deals-cheap.xyz/checkout",
        isSecure: false,
        hasCertError: false,
        siteType: "shop",
        correctAction: "exit",
        explanation: "Unsecured HTTP connection on a checkout page is a major risk for data theft.",
        clue: "The site is 'Not Secure' (HTTP) and asks for sensitive payment info."
    },
    {
        id: 5,
        title: "Official Mail Login",
        url: "https://secure-mail-update.security-verify.com",
        isSecure: true,
        hasCertError: false,
        siteType: "email",
        correctAction: "exit",
        explanation: "Subdomain trickery: The real domain is 'security-verify.com', not 'secure-mail'.",
        clue: "Phishers use long subdomains to hide the suspicious primary domain."
    },
    {
        id: 6,
        title: "EtherPulse Wallet Connect",
        url: "https://etherpuIse.io/connect",
        isSecure: true,
        hasCertError: false,
        siteType: "crypto",
        correctAction: "exit",
        explanation: "Phishing: Asking for a 12-word seed phrase is a critical red flag. Also homograph 'I' in URL.",
        clue: "Legitimate wallet connects NEVER ask for your seed phrase in a browser window."
    },
    {
        id: 7,
        title: "Microsoft Azure SSO",
        url: "https://login.microsoftonline.com/auth",
        isSecure: true,
        hasCertError: false,
        siteType: "sso",
        correctAction: "enter",
        explanation: "Standard Microsoft SSO authentication page with correct domain and security markers.",
        clue: "Official Microsoft domain and familiar UI indicate a safe authentication flow."
    },
    {
        id: 8,
        title: "CloudDrop Storage",
        url: "https://clouddrop-files.share-utility.top/view",
        isSecure: true,
        hasCertError: false,
        siteType: "cloud",
        correctAction: "exit",
        explanation: "Credential Harvesting: Using a generic 'share-utility.top' domain instead of the brand domain.",
        clue: "The domain 'share-utility.top' is unrelated to the CloudDrop brand."
    },
    {
        id: 9,
        title: "Prime Stream Plus",
        url: "https://primestream.com/account/billing",
        isSecure: true,
        hasCertError: false,
        siteType: "streaming",
        correctAction: "enter",
        explanation: "Valid billing update page for a known streaming service.",
        clue: "Simple, clean URL and standard billing layout with HTTPS."
    },
    {
        id: 10,
        title: "Tax Authority Portal",
        url: "https://government-tax-refund.online/claim",
        isSecure: true,
        hasCertError: false,
        siteType: "gov",
        correctAction: "exit",
        explanation: "Social Engineering: Government portals use .gov or .org, never .online or .claim.",
        clue: "The TLD '.online' is a common indicator of a scam tax refund site."
    }
];

const BrowserSentry = ({ onBack }) => {
    const [gameState, setGameState] = useState('intro');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [history, setHistory] = useState([]);
    const [feedback, setFeedback] = useState(null);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [expandedResult, setExpandedResult] = useState(null);
    const timerRef = useRef(null);

    const currentSite = WEBSITES[currentIndex];

    const startGame = useCallback(() => {
        setGameState('playing');
        setElapsed(0);
        setShowAdvanced(false);
        setExpandedResult(null);
        timerRef.current = setInterval(() => {
            setElapsed(prev => prev + 1);
        }, 1000);
    }, []);

    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const handleAction = (action) => {
        if (feedback) return;

        const isCorrect = currentSite.correctAction === action;

        if (isCorrect) {
            setScore(prev => prev + 1200);
            setFeedback('correct');
        } else {
            setFeedback('wrong');
        }

        setHistory(prev => [...prev, { site: currentSite, action, isCorrect }]);

        setTimeout(() => {
            setFeedback(null);
            setShowAdvanced(false);
            if (currentIndex < WEBSITES.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                if (timerRef.current) clearInterval(timerRef.current);
                setGameState('result');
            }
        }, 1800);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const renderIntro = () => (
        <div className="flex flex-col items-center justify-center p-12 text-center max-w-2xl animate-fade-in h-[75vh]">
            <div className="w-24 h-24 bg-indigo-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-indigo-500/20 shadow-[0_0_50px_rgba(99,102,241,0.15)]">
                <span className="text-5xl">🌐</span>
            </div>
            <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-6 underline decoration-indigo-500 underline-offset-8 italic">Browser Sentry</h2>
            <p className="text-slate-400 leading-relaxed mb-10 text-lg font-mono">
                [ AEGIS_WEB_SENTRY_V2.5 ]
                <br /><br />
                A simulation of modern browser threats.
                Inspect the URL, SSL status, and page content.
                Decide: Enter Credentials or Exit Page.
            </p>
            <div className="flex gap-4">
                <button onClick={onBack} className="px-10 py-4 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-black rounded-2xl transition-all uppercase tracking-[0.2em] text-xs border border-slate-800 active:scale-95">
                    ABORT
                </button>
                <button onClick={startGame} className="px-14 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all uppercase tracking-[0.2em] text-xs border border-indigo-400 active:scale-95">
                    INITIALIZE BROWSER
                </button>
            </div>
        </div>
    );

    const renderSiteContent = (site) => {
        switch (site.siteType) {
            case 'bank':
                return (
                    <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-50">
                        <div className="w-full max-w-sm bg-white p-10 rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.05)] border border-gray-100">
                            <div className="text-3xl font-black text-[#1a237e] mb-10 flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#1a237e] rounded-xl flex items-center justify-center text-white text-xl">🏦</div>
                                <span className="tracking-tighter">GlobalFinance</span>
                            </div>
                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Identifier</label>
                                    <div className="h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 flex items-center text-slate-300 text-sm italic">Enter user ID...</div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Secret PIN</label>
                                    <div className="h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 flex items-center text-slate-300 text-sm tracking-widest">••••••••</div>
                                </div>
                                <button className="w-full h-14 bg-[#1a237e] hover:bg-[#0d1642] text-white font-black rounded-xl mt-4 text-xs tracking-[0.2em] transition-all shadow-lg shadow-blue-900/10">SECURE ACCESS</button>
                            </div>
                            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between text-[9px] font-black text-blue-600 uppercase tracking-widest">
                                <span className="hover:underline cursor-pointer">Recover Access</span>
                                <span className="hover:underline cursor-pointer">Open Account</span>
                            </div>
                        </div>
                    </div>
                );
            case 'social':
                return (
                    <div className="flex flex-col items-center justify-center h-full p-8 bg-[#f0f2f5]">
                        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div className="hidden md:block">
                                <h1 className="text-5xl font-black text-[#1877f2] mb-4 tracking-tighter">SocialConnect</h1>
                                <p className="text-2xl text-slate-700 leading-snug">Connect with friends and the world around you on SocialConnect.</p>
                            </div>
                            <div className="w-full max-w-[400px] bg-white p-6 rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.1),0_8px_16px_rgba(0,0,0,0.1)] border border-gray-200 mx-auto">
                                <div className="space-y-4">
                                    <div className="h-12 bg-white border border-gray-200 rounded-lg px-4 flex items-center text-gray-400 text-sm shadow-sm">Email or phone number</div>
                                    <div className="h-12 bg-white border border-gray-200 rounded-lg px-4 flex items-center text-gray-400 text-sm shadow-sm">Password</div>
                                    <button className="w-full h-12 bg-[#1877f2] text-white font-black rounded-lg text-lg tracking-tight active:scale-[0.98] transition-all">Log In</button>
                                </div>
                                <div className="mt-4 text-center border-b border-gray-200 pb-6">
                                    <span className="text-[#1877f2] text-[12px] hover:underline cursor-pointer">Forgotten password?</span>
                                </div>
                                <div className="mt-6 flex justify-center">
                                    <button className="px-6 h-12 bg-[#42b72a] text-white font-black rounded-lg text-sm border-none shadow-md">Create new account</button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'crypto':
                return (
                    <div className="flex flex-col h-full bg-[#0d1117] text-white">
                        <div className="h-16 w-full border-b border-white/10 flex items-center px-8 justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center font-black">E</div>
                                <span className="font-black tracking-tighter">EtherPulse</span>
                            </div>
                            <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/10 text-[10px] font-bold">Connect Wallet</div>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[radial-gradient(circle_at_50%_50%,rgba(249,115,22,0.1)_0%,transparent_100%)]">
                            <div className="w-full max-w-sm bg-[#161b22] border border-white/10 rounded-2xl p-8 shadow-2xl">
                                <h2 className="text-xl font-black mb-2 flex items-center gap-2 text-orange-400">
                                    <span>🔑</span> Re-Verify Ownership
                                </h2>
                                <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">Due to network upgrades, please re-input your recovery phrase to synchronize your local EtherPulse nodes.</p>

                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    {[...Array(12)].map((_, i) => (
                                        <div key={i} className="flex flex-col gap-1">
                                            <span className="text-[8px] text-slate-600 font-bold uppercase">{i + 1}</span>
                                            <div className="h-8 bg-black/40 border border-white/5 rounded-lg"></div>
                                        </div>
                                    ))}
                                </div>

                                <button className="w-full h-12 bg-white text-black font-black rounded-xl text-xs uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all">SYNCHRONIZE_WALLET</button>
                                <p className="text-center mt-4 text-[9px] text-rose-400 font-bold italic animate-pulse">CRITICAL: Syncing required for transaction access.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'sso':
                return (
                    <div className="flex flex-col items-center justify-center h-full bg-[#f2f2f2]">
                        <div className="w-full max-w-[440px] bg-white p-12 shadow-[0_2px_4px_rgba(0,0,0,0.1)] border border-gray-200">
                            <div className="mb-6 h-6 flex items-center gap-2">
                                <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                                    <div className="bg-[#f25022]"></div>
                                    <div className="bg-[#7fba00]"></div>
                                    <div className="bg-[#00a4ef]"></div>
                                    <div className="bg-[#ffb900]"></div>
                                </div>
                                <span className="text-xl font-bold text-slate-600 font-sans">Microsoft</span>
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 mb-4">Sign in</h2>
                            <div className="space-y-4">
                                <div className="h-9 border-b border-slate-900 flex items-center text-sm text-slate-500">someone@example.com</div>
                                <div className="flex gap-2 py-4">
                                    <span className="text-xs text-slate-600">No account?</span>
                                    <span className="text-xs text-[#0067b8] hover:underline cursor-pointer">Create one!</span>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <button className="px-10 py-2 bg-[#0067b8] text-white font-bold text-sm">Next</button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'cloud':
                return (
                    <div className="flex flex-col h-full bg-white">
                        <div className="h-16 w-full px-10 border-b border-gray-100 flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl">☁️</div>
                            <span className="text-xl font-black text-slate-900 tracking-tighter">CloudDrop</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center p-10 bg-slate-50">
                            <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
                                <div className="flex flex-col items-center text-center mb-8">
                                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-4 text-blue-600 shadow-inner">📄</div>
                                    <h3 className="text-lg font-black text-slate-900">Encrypted_File_Shared.pdf</h3>
                                    <p className="text-xs text-slate-500">Shared via CloudDrop Enterprise</p>
                                </div>
                                <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-600/10 mb-8">
                                    <p className="text-[10px] text-blue-800 font-bold mb-3 uppercase tracking-widest text-center">Identity Authentication Required</p>
                                    <div className="space-y-3">
                                        <div className="h-10 bg-white border border-gray-300 rounded-xl px-4 flex items-center text-gray-400 text-[10px]">CloudDrop Email Address</div>
                                        <div className="h-10 bg-white border border-gray-300 rounded-xl px-4 flex items-center text-gray-400 text-[10px]">Portal Password</div>
                                    </div>
                                </div>
                                <button className="w-full h-12 bg-blue-600 text-white font-black rounded-xl text-xs uppercase tracking-widest active:scale-95 transition-all">VIEW PROTECTED FILE</button>
                            </div>
                        </div>
                    </div>
                );
            case 'streaming':
                return (
                    <div className="flex flex-col h-full bg-black text-white">
                        <div className="h-20 px-12 items-center flex justify-between fixed top-0 w-full bg-gradient-to-b from-black/80 to-transparent z-10">
                            <span className="text-3xl font-black text-red-600 tracking-tighter">PRIME STREAM</span>
                            <div className="px-6 py-2 bg-red-600 rounded text-xs font-black uppercase tracking-widest">Sign In</div>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[url('https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=2069&auto=format&fit=crop')] bg-cover bg-center">
                            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
                            <div className="w-full max-w-xl bg-black/60 p-16 rounded shadow-2xl relative z-10 border border-white/5">
                                <h1 className="text-4xl font-black mb-8">Subscription Update</h1>
                                <div className="space-y-6">
                                    <p className="text-slate-300 leading-relaxed mb-6">Your payment method for <span className="text-white font-bold underline decoration-red-600">Premium Plan</span> could not be processed. Please update your details to continue streaming.</p>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="h-14 bg-[#333] rounded px-4 flex items-center text-slate-400 font-bold text-xs uppercase tracking-widest">Cardholder Name</div>
                                        <div className="h-14 bg-[#333] rounded px-4 flex items-center text-slate-400 font-bold text-xs uppercase tracking-widest">6 XXXX XXXX XXXX 0123</div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="h-14 bg-[#333] rounded px-4 flex items-center text-slate-400 font-bold text-xs uppercase tracking-widest">MM/YY</div>
                                            <div className="h-14 bg-[#333] rounded px-4 flex items-center text-slate-400 font-bold text-xs uppercase tracking-widest">CVV</div>
                                        </div>
                                    </div>
                                    <button className="w-full h-16 bg-red-600 hover:bg-red-700 font-black rounded text-lg uppercase tracking-widest mt-6 transition-colors">UPDATE_PROTOCOL</button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'gov':
                return (
                    <div className="flex flex-col h-full bg-white">
                        <div className="h-2 w-full bg-[#1e40af]"></div>
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-white text-4xl">🏛️</div>
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900 uppercase">National Revenue Agency</h1>
                                    <p className="text-[10px] text-slate-500 font-black tracking-[0.3em] uppercase">Security Verification Protocol</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black uppercase text-rose-600 block mb-1">Status: Action Required</span>
                                <span className="text-sm font-mono text-slate-400">REF-92384-NRA</span>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50">
                            <div className="w-full max-w-2xl bg-white p-12 rounded-lg border border-gray-200 shadow-sm">
                                <h2 className="text-3xl font-black text-slate-900 mb-6 uppercase italic">Tax Refund: $1,240.45</h2>
                                <p className="text-slate-600 mb-10 leading-relaxed text-lg border-l-4 border-blue-600 pl-6 py-2">Our records indicate a surplus in your 2025 contributions. To finalize your refund via instant wire transfer, please confirm your active credentials.</p>

                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Verification ID</label>
                                        <div className="h-12 bg-slate-50 border border-slate-200 rounded flex items-center px-4 italic text-sm text-slate-300">Login username...</div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Key</label>
                                        <div className="h-12 bg-slate-50 border border-slate-200 rounded flex items-center px-4 italic text-sm text-slate-300">••••••••</div>
                                    </div>
                                </div>
                                <button className="w-full h-16 bg-[#1e40af] text-white font-black uppercase tracking-[0.4em] mt-10 text-xs shadow-xl shadow-blue-900/10 active:scale-95 transition-all hover:bg-blue-800">DISPATCH_REFUND_SIGNAL</button>
                                <p className="text-center mt-6 text-[10px] text-slate-400 uppercase tracking-widest font-black">Encrypted via S-Protocol 256</p>
                            </div>
                        </div>
                    </div>
                );
            case 'shop_legit':
            // For variety
            case 'portal':
                return (
                    <div className="flex flex-col items-center justify-center h-full bg-slate-100">
                        <div className="w-full max-w-md bg-white p-10 rounded-lg shadow-sm border border-slate-200">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-slate-900 rounded flex items-center justify-center text-white font-black text-xl">C</div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 uppercase">CoreSystems Internal</h2>
                                    <p className="text-[10px] text-slate-500 font-mono">AUTHORIZED ACCESS ONLY</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="p-4 bg-amber-50 border border-amber-100 rounded text-amber-800 text-xs">
                                    You are attempting to access a secured corporate subnet. Credentials must be re-verified.
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee ID</label>
                                    <div className="h-12 bg-slate-50 border border-slate-200 rounded px-4 flex items-center"></div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SSO Key</label>
                                    <div className="h-12 bg-slate-50 border border-slate-200 rounded px-4 flex items-center"></div>
                                </div>
                                <button className="w-full h-12 bg-slate-900 text-white font-black rounded uppercase tracking-widest text-xs">Verify & Enter</button>
                            </div>
                        </div>
                    </div>
                );
            case 'email':
                return (
                    <div className="flex flex-col h-full bg-white">
                        <div className="h-14 w-full bg-[#f8f9fa] border-b border-gray-200 flex items-center px-6">
                            <span className="text-xl font-black bg-gradient-to-r from-blue-500 via-red-500 to-yellow-500 text-transparent bg-clip-text">G-Mail</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center p-10">
                            <div className="w-full max-w-sm text-center">
                                <h1 className="text-2xl font-bold mb-2">Account Recovery</h1>
                                <p className="text-sm text-slate-600 mb-8">Confirm your credentials to keep your account safe from unauthorized changes.</p>
                                <div className="text-left space-y-4">
                                    <div className="border-2 border-blue-500 rounded-xl p-4 flex items-center gap-4 bg-blue-50/30">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">👤</div>
                                        <div className="flex-1">
                                            <p className="text-sm font-black text-slate-900">user@official-mail.com</p>
                                            <p className="text-[10px] text-slate-400 uppercase font-black">Primary Profile</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password Verification</label>
                                        <div className="h-14 border border-gray-300 rounded-xl px-4 flex items-center text-gray-300 italic text-sm">••••••••••••••••</div>
                                    </div>
                                    <button className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl mt-4 tracking-widest text-xs">COMMIT UPDATES</button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'shop':
                return (
                    <div className="flex flex-col h-full bg-white font-sans">
                        <div className="h-20 w-full border-b border-gray-100 flex items-center px-12 justify-between">
                            <span className="text-2xl font-black text-red-600 italic tracking-tighter">MEGA_DEALS</span>
                            <div className="flex gap-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span className="text-slate-900 underline decoration-red-600 decoration-2 underline-offset-4 pointer">SALE</span>
                                <span className="hover:text-slate-900 cursor-pointer">Electronics</span>
                                <span className="hover:text-slate-900 cursor-pointer">Clothing</span>
                                <span className="hover:text-slate-900 cursor-pointer">Cart (1)</span>
                            </div>
                        </div>
                        <div className="flex-1 p-16 flex gap-12 bg-slate-50/30">
                            <div className="flex-1 space-y-12">
                                <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter decoration-red-600 underline decoration-4 underline-offset-8">Checkout Sequence</h2>
                                <div className="grid grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <span className="w-4 h-4 bg-slate-900 rounded-full text-[10px] text-white flex items-center justify-center">1</span> Shipping Protocol
                                        </h3>
                                        <div className="h-12 bg-white rounded-xl border border-gray-200 px-4 flex items-center italic text-slate-300 text-xs shadow-sm">Street Address</div>
                                        <div className="h-12 bg-white rounded-xl border border-gray-200 px-4 flex items-center italic text-slate-300 text-xs shadow-sm">City / Zip Code</div>
                                    </div>
                                    <div className="space-y-6">
                                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <span className="w-4 h-4 bg-slate-900 rounded-full text-[10px] text-white flex items-center justify-center">2</span> Payment Matrix
                                        </h3>
                                        <div className="h-12 bg-white border border-gray-200 rounded-xl px-4 flex items-center text-xs text-slate-300 italic shadow-sm">Card Primary Number</div>
                                        <div className="h-12 bg-rose-50 border-2 border-rose-500/20 rounded-xl px-4 flex items-center text-[9px] text-rose-600 font-black uppercase tracking-widest shadow-inner">IDENTITY: SOCIAL SECURITY NUMBER (REQUIRED)</div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-72 bg-white p-8 rounded-[2.5rem] border border-gray-100 h-fit shadow-2xl">
                                <h3 className="text-[10px] font-black mb-6 uppercase tracking-widest text-slate-400 border-b border-gray-100 pb-4">Order_Manifest</h3>
                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-600">Pro Gamer Headset</span>
                                        <span className="font-black">$0.01</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-600">Shipping</span>
                                        <span className="font-black text-emerald-500">FREE</span>
                                    </div>
                                </div>
                                <div className="border-t-2 border-slate-900 pt-6 flex justify-between font-black text-lg italic tracking-tighter mb-8">
                                    <span>TOTAL</span>
                                    <span>$0.01</span>
                                </div>
                                <button className="w-full py-4 bg-red-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg shadow-red-600/20 active:scale-95 transition-all">AUTHORIZE_PAYMENT</button>
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    const renderPlaying = () => (
        <div className="w-screen h-screen flex flex-col animate-fade-in font-sans bg-slate-950 overflow-hidden">
            {/* Top Navigation Bar (Status) */}
            <div className="shrink-0 w-full bg-black/60 border-b border-slate-800 px-8 py-3 flex items-center justify-between z-50 backdrop-blur-md">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">WEBSITES</span>
                        <span className="text-sm font-bold text-white">{currentIndex + 1} / {WEBSITES.length}</span>
                    </div>
                    <div className="w-px h-6 bg-slate-800" />
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">ELAPSED</span>
                        <span className="text-sm font-bold text-indigo-400 font-mono tracking-tighter">{formatTime(elapsed)}</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-0.5">AWARD_VALUE</span>
                        <span className="text-lg font-black text-indigo-400 italic tracking-tighter">{score.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main Browser Window */}
                <div className="flex-1 flex flex-col p-6 items-center justify-center relative bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.05)_0%,transparent_70%)]">

                    <div className="w-full h-full max-w-[1000px] max-h-[700px] bg-[#1a1c1e] rounded-t-2xl shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/10 flex flex-col overflow-hidden relative group">

                        {/* Browser Chrome: Tabs */}
                        <div className="h-10 w-full flex items-end px-4 gap-1 bg-[#1a1c1e] border-b border-black/40">
                            <div className="h-8 px-4 bg-white/5 rounded-t-lg flex items-center gap-2 border-x border-t border-white/10 relative">
                                <div className="w-3 h-3 bg-indigo-500/20 rounded-full flex items-center justify-center text-[8px]">🎯</div>
                                <span className="text-[11px] text-gray-300 font-bold truncate max-w-[120px]">{currentSite.title}</span>
                                <span className="text-[10px] text-gray-600">✕</span>
                            </div>
                            <div className="h-7 w-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-white/5 transition-colors cursor-pointer mb-1 text-sm">+</div>
                        </div>

                        {/* Browser Chrome: Address Bar */}
                        <div className="h-12 w-full bg-[#1a1c1e] border-b border-black/80 flex items-center px-4 gap-4">
                            <div className="flex gap-4 text-gray-500">
                                <span className="hover:text-white cursor-pointer transition-colors">←</span>
                                <span className="hover:text-white cursor-pointer transition-colors">→</span>
                                <span className="hover:text-white cursor-pointer transition-colors">↻</span>
                            </div>
                            <div className={`flex-1 h-8 rounded-full border px-4 flex items-center gap-3 transition-all duration-300 shadow-inner
                                ${currentSite.isSecure
                                    ? 'bg-[#0f1112] border-white/5 text-gray-400'
                                    : 'bg-rose-500/5 border-rose-500/20 text-rose-400'}`}>

                                {currentSite.isSecure ? (
                                    <span className="text-emerald-500 text-xs">🔒</span>
                                ) : (
                                    <span className="text-rose-500 text-[9px] font-black uppercase tracking-tighter bg-rose-500/10 px-2 py-0.5 rounded">⚠ NOT SECURE</span>
                                )}

                                <span className="text-xs font-mono tracking-tight flex-1">
                                    {currentSite.url.split('//')[0]}//<span className="text-white font-bold">{currentSite.url.split('//')[1]}</span>
                                </span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs text-gray-500">★</div>
                        </div>

                        {/* Browser Content Area */}
                        <div className="flex-1 relative overflow-auto bg-white">
                            {renderSiteContent(currentSite)}

                            {/* Cert Error Overlay */}
                            {currentSite.hasCertError && (
                                <div className="absolute inset-0 z-[60] bg-[#1a1c1e] flex flex-col items-center justify-center p-20 text-white animate-fade-in text-center">
                                    <div className="max-w-xl flex flex-col items-center">
                                        <div className="w-24 h-24 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mb-8 border border-rose-500/20 animate-pulse">
                                            <span className="text-5xl">⚠️</span>
                                        </div>
                                        <h2 className="text-4xl font-black uppercase mb-4 tracking-tighter decoration-rose-500 underline underline-offset-8 decoration-4 italic">Privacy Intercepted</h2>
                                        <p className="text-slate-400 text-lg leading-relaxed mb-10 opacity-80">
                                            {currentSite.certWarning}
                                        </p>
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => handleAction('exit')}
                                                    className="px-12 py-4 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl uppercase tracking-[0.2em] text-xs transition-all active:scale-95 shadow-xl shadow-rose-900/20"
                                                >
                                                    TERMINATE CONNECTION
                                                </button>
                                                <button
                                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                                    className={`px-10 py-4 rounded-xl uppercase tracking-[0.2em] text-[10px] transition-all border ${showAdvanced ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-transparent text-slate-500 hover:bg-white/10'}`}
                                                >
                                                    Advanced Logic
                                                </button>
                                            </div>

                                            {showAdvanced && (
                                                <div className="animate-fade-in py-4 px-6 bg-black/40 border border-white/5 rounded-2xl flex flex-col items-center gap-4">
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                                                        Warning: Proceeding with an unverified certificate allows attackers to decrypt your traffic.
                                                    </p>
                                                    <button
                                                        onClick={() => handleAction('enter')}
                                                        className="text-[10px] text-rose-500 font-black hover:underline underline-offset-4 tracking-[0.2em] uppercase"
                                                    >
                                                        Proceed to {currentSite.url.split('//')[1]} (Unsafe)
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Feedback Overlay */}
                            {feedback && (
                                <div className={`absolute inset-0 z-[100] flex flex-col items-center justify-center backdrop-blur-md transition-all duration-300 ${feedback === 'correct' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                                    <div className="p-12 rounded-[3.5rem] bg-slate-900 border border-white/10 shadow-2xl flex flex-col items-center text-center scale-110 shadow-[0_0_100px_rgba(0,0,0,1)]">
                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 text-4xl border ${feedback === 'correct' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.2)]'}`}>
                                            {feedback === 'correct' ? '✓' : '✗'}
                                        </div>
                                        <h4 className={`text-3xl font-black uppercase tracking-tighter italic ${feedback === 'correct' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {feedback === 'correct' ? 'SECURE_ROUTE' : 'INTEGRITY_BREACH'}
                                        </h4>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Verdict Sidebar */}
                <div className="shrink-0 w-80 bg-black border-l border-slate-900 flex flex-col shadow-[-20px_0_40px_rgba(0,0,0,0.4)] z-40">

                    {/* Verdict Controls */}
                    <div className="flex-1 flex flex-col p-8 justify-center gap-4 border-b border-slate-900">
                        <div className="text-center mb-6">
                            <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest block mb-2 underline decoration-indigo-500">Judgment Module</span>
                            <h3 className="text-white font-bold text-xs tracking-tight leading-relaxed">Identity Protection Protocol</h3>
                        </div>

                        <button
                            onClick={() => handleAction('enter')}
                            disabled={!!feedback || currentSite.hasCertError}
                            className="w-full py-6 bg-emerald-600/10 border-2 border-emerald-500/20 rounded-2xl group hover:bg-emerald-600 hover:border-emerald-400 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-5 active:scale-95"
                        >
                            <span className="text-3xl group-hover:scale-110 transition-transform">🔑</span>
                            <span className="font-black text-emerald-500 group-hover:text-white uppercase tracking-widest text-[10px]">Enter Credentials</span>
                        </button>

                        <button
                            onClick={() => handleAction('exit')}
                            disabled={!!feedback}
                            className="w-full py-6 bg-rose-600/10 border-2 border-rose-500/20 rounded-2xl group hover:bg-rose-600 hover:border-rose-400 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-20 active:scale-95"
                        >
                            <span className="text-3xl group-hover:scale-110 transition-transform">🚪</span>
                            <span className="font-black text-rose-500 group-hover:text-white uppercase tracking-widest text-[10px]">Exit Page</span>
                        </button>
                    </div>

                    {/* Tactical Analysis Section (Requested style) */}
                    <div className="p-6 bg-[#050505]">
                        <h4 className="text-[10px] text-slate-500 opacity-50 font-black uppercase tracking-widest mb-6">Analyzing Available Infrastructure</h4>

                        <div className="space-y-6">
                            <div className="flex gap-4 group">
                                <span className="text-xl grayscale group-hover:grayscale-0 transition-all">🔍</span>
                                <div>
                                    <h5 className="text-slate-200 font-black text-[9px] uppercase tracking-wider mb-1">Check URL</h5>
                                    <p className="text-slate-600 text-[8px] leading-relaxed">Each SSID reveals intent. Look for typos, homographs, or suspicious subdomains in the address bar.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 group">
                                <span className="text-xl grayscale group-hover:grayscale-0 transition-all text-emerald-500">🔒</span>
                                <div>
                                    <h5 className="text-slate-200 font-black text-[9px] uppercase tracking-wider mb-1">SSL lock icon</h5>
                                    <p className="text-slate-600 text-[8px] leading-relaxed">The padlock indicates an encrypted connection. Lack of it is a significant red flag for input forms.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 group">
                                <span className="text-xl grayscale group-hover:grayscale-0 transition-all text-rose-500">📑</span>
                                <div>
                                    <h5 className="text-slate-200 font-black text-[9px] uppercase tracking-wider mb-1">Certificate warning</h5>
                                    <p className="text-slate-600 text-[8px] leading-relaxed">A certificate chain error on a public page typically indicates a hostile intercept attempt.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 group">
                                <span className="text-xl grayscale group-hover:grayscale-0 transition-all text-indigo-400">💳</span>
                                <div>
                                    <h5 className="text-slate-200 font-black text-[9px] uppercase tracking-wider mb-1">Payment form layout</h5>
                                    <p className="text-slate-600 text-[8px] leading-relaxed">Legitimate sites don't usually ask for SSN or excessive data on a standard payment form.</p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-900">
                            <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10 border-dashed text-center">
                                <span className="text-[8px] text-indigo-400 font-black uppercase tracking-widest block mb-1">Aegis Guidance</span>
                                <p className="text-[8px] text-slate-500 italic leading-snug">"Infrastructure is only as secure as the user connecting to it."</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );

    const renderResult = () => {
        const correctCount = history.filter(h => h.isCorrect).length;
        const accuracy = Math.round((correctCount / WEBSITES.length) * 100);

        const getGrade = () => {
            if (accuracy >= 100) return { grade: 'S', color: '#6366f1', label: 'APEX SENTINEL' };
            if (accuracy >= 80) return { grade: 'A', color: '#22c55e', label: 'NET GUARDIAN' };
            if (accuracy >= 60) return { grade: 'B', color: '#3b82f6', label: 'WEB SENTRY' };
            if (accuracy >= 40) return { grade: 'C', color: '#f59e0b', label: 'VERIFIER' };
            return { grade: 'F', color: '#ef4444', label: 'COMPROMISED' };
        };

        const resultGrade = getGrade();

        return (
            <div className="w-full max-w-5xl px-6 py-8 flex flex-col items-center animate-fade-in overflow-y-auto" style={{ maxHeight: '92vh' }}>
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 mb-4 shadow-lg"
                        style={{ borderColor: resultGrade.color, boxShadow: `0 0 50px ${resultGrade.color}33` }}>
                        <span className="text-5xl font-black" style={{ color: resultGrade.color }}>{resultGrade.grade}</span>
                    </div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter">{resultGrade.label}</h2>
                    <p className="text-slate-500 font-mono text-xs mt-2 uppercase tracking-widest">Session Complete — Infrastructure Audit</p>
                </div>

                <div className="grid grid-cols-4 gap-4 w-full max-w-2xl mb-10">
                    {[
                        { label: 'Score', value: score.toLocaleString(), color: 'text-indigo-400' },
                        { label: 'Accuracy', value: `${accuracy}%`, color: accuracy >= 70 ? 'text-emerald-400' : 'text-red-400' },
                        { label: 'Time Taken', value: formatTime(elapsed), color: 'text-amber-400' },
                        { label: 'Secured', value: `${correctCount}/${WEBSITES.length}`, color: 'text-cyan-400' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                            <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest block mb-1">{stat.label}</span>
                            <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                        </div>
                    ))}
                </div>

                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 self-start">Traffic Breakdown</h3>
                <div className="w-full space-y-3 mb-10">
                    {history.map((item, idx) => (
                        <div
                            key={idx}
                            className={`rounded-xl border overflow-hidden transition-all cursor-pointer ${item.isCorrect
                                ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                                : 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                                }`}
                            onClick={() => setExpandedResult(expandedResult === idx ? null : idx)}
                        >
                            <div className="flex items-center gap-4 px-5 py-4">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-800 text-white text-xs font-black shrink-0">
                                    {item.site.title[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-bold text-white truncate">{item.site.title}</span>
                                        <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded ${item.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {item.site.correctAction === 'enter' ? 'LEGIT' : 'THREAT'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-500 truncate block font-mono">{item.site.url}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`text-sm font-bold ${item.isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {item.isCorrect ? '✓' : '✗'}
                                    </span>
                                    <span className="text-slate-600 text-xs">{expandedResult === idx ? '▲' : '▼'}</span>
                                </div>
                            </div>

                            {expandedResult === idx && (
                                <div className="border-t border-slate-800 bg-slate-950/50 px-5 py-4 space-y-2 animate-fade-in">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Forensic Analysis</span>
                                    <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-indigo-500 pl-4 py-1">
                                        "{item.site.explanation}"
                                    </p>
                                    <div className="flex items-start gap-2 text-xs text-indigo-400/80 mt-3 font-mono">
                                        <span className="text-indigo-500 font-bold">Indicator:</span>
                                        <span>{item.site.clue}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button onClick={startGame} className="px-12 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-indigo-50 transition-all hover:text-indigo-600 shadow-lg text-sm">
                        RETRY AUDIT
                    </button>
                    <button onClick={onBack} className="px-8 py-4 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all font-bold text-sm">
                        BACK TO LAB
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center font-sans overflow-hidden bg-transparent">
            {gameState === 'intro' && renderIntro()}
            {gameState === 'playing' && renderPlaying()}
            {gameState === 'result' && renderResult()}
        </div>
    );
};

export default BrowserSentry;
