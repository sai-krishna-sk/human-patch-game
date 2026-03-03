import React, { useState, useEffect, useCallback, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════
// EMAIL DATA
// ═══════════════════════════════════════════════════════════════
const EMAILS = [
    {
        id: 1,
        brand: 'Account Services',
        brandColor: "#EA4335",
        from: { name: 'Account Services', address: 'billing@secure-portal.com' },
        to: 'you@office.com',
        subject: "Overdue Invoice: #INV-99284",
        date: "Mar 3, 2026, 10:42 AM",
        body: [
            { type: 'brand-header', bgColor: '#EA4335', logo: 'PORTAL', logoColor: '#fff' },
            { type: 'heading', text: 'URGENT: Outstanding Payment' },
            { type: 'paragraph', text: 'Hi User,' },
            { type: 'paragraph', text: 'Our records show that your payment for the last quarter is currently overdue. To maintain uninterrupted access to your professional suite, please review the attached invoice immediately.' },
            { type: 'alert', variant: 'danger', text: '⚠️ Failure to comply within 24 hours may result in temporary account lockout and late fees.' },
            { type: 'cta', text: 'VIEW INVOICE', bgColor: '#EA4335' },
            { type: 'separator' },
            { type: 'legal', text: "Internal billing notification. Please do not reply to this automated message.\nSecure Portal LLC, 500 Enterprise Way, Ste 120" },
        ],
        attachment: {
            name: "Invoice_2024.pdf.exe",
            size: "1.2 MB",
            type: "executable",
            isMalicious: true,
            realExtension: ".exe",
            clue: "Double extension detected. Files ending in .exe are programs, not documents."
        }
    },
    {
        id: 2,
        brand: 'HR Department',
        brandColor: "#4285F4",
        from: { name: 'HR Department', address: 'hr@company-internal.com' },
        to: 'staff-all@company.com',
        subject: "Updated Holiday Calendar 2024",
        date: "Mar 3, 2026, 09:15 AM",
        body: [
            { type: 'brand-header', bgColor: '#4285F4', logo: 'HR CONNECT', logoColor: '#fff' },
            { type: 'paragraph', text: 'Dear Team,' },
            { type: 'paragraph', text: 'Please find the updated holiday calendar for the remaining year. We have made a few adjustments to the December schedule to better accommodate our winter break period.' },
            {
                type: 'bullet-list', items: [
                    'Winter break starts Dec 23',
                    'Office reopens Jan 02',
                    'Floating holidays updated in the portal'
                ]
            },
            { type: 'paragraph', text: 'Please acknowledge the receipt of this calendar by reviewing the document below.' },
            { type: 'separator' },
            { type: 'legal', text: "Confidential Internal Document\nHuman Resources | Company Internal" },
        ],
        attachment: {
            name: "Holiday_Calendar.pdf",
            size: "450 KB",
            type: "pdf",
            isMalicious: false,
            realExtension: ".pdf",
            clue: "Standard PDF file from a known internal department."
        }
    },
    {
        id: 3,
        brand: 'Bank Security',
        brandColor: "#FBBC05",
        from: { name: 'Bank Security', address: 'alerts@security-bank-verify.net' },
        to: 'customer@email.com',
        subject: "Security Update Required",
        date: "Mar 3, 2026, 11:05 AM",
        body: [
            { type: 'brand-header', bgColor: '#FBBC05', logo: 'S-BANK', logoColor: '#000' },
            { type: 'heading', text: 'System-wide Security Upgrade' },
            { type: 'paragraph', text: 'Important security patches are required to maintain the safety of your banking portal. We have issued a secondary verification tool to ensure your account is protected against recent unauthorized login attempts.' },
            { type: 'alert', variant: 'warning', text: 'Running the attached security tool is mandatory to prevent account suspension.' },
            {
                type: 'detail-table', rows: [
                    ['Update Version', 'v1.4.2'],
                    ['Priority', '🔴 CRITICAL'],
                    ['Status', 'PENDING_INSTALLATION']
                ]
            },
            { type: 'cta', text: 'START UPDATE', bgColor: '#000' },
            { type: 'separator' },
            { type: 'legal', text: "Member FDIC. Security alerts are sent for your protection.\nSecurity-Bank-Verify Group" },
        ],
        attachment: {
            name: "bank_update.scr",
            size: "2.5 MB",
            type: "screen-saver",
            isMalicious: true,
            realExtension: ".scr",
            clue: ".scr (Windows Screen Saver) files can contain malicious code and are often used in phishing."
        }
    },
    {
        id: 4,
        brand: 'Project Manager',
        brandColor: "#34A853",
        from: { name: 'Project Manager', address: 'pm.office@gmail.com' },
        to: 'team@company.com',
        subject: "Q4 Results - Final Draft",
        date: "Yesterday",
        body: [
            { type: 'brand-header', bgColor: '#34A853', logo: 'PROJECTS', logoColor: '#fff' },
            { type: 'heading', text: 'Final Q4 Review' },
            { type: 'paragraph', text: 'Hey Team,' },
            { type: 'paragraph', text: 'The final results for Q4 are ready for presentation. I have compiled the compressed data files into a single archive for your final review before the board meeting.' },
            { type: 'paragraph', text: 'Please ensure all figures are correct and match the departmental reports.' },
            { type: 'separator' },
            { type: 'small', text: 'Attachments: results.zip (15.4 MB)' },
            { type: 'legal', text: "Internal Project Communication\nDo not share outside the project group." },
        ],
        attachment: {
            name: "results.zip",
            size: "15.4 MB",
            type: "zip",
            isMalicious: true,
            realExtension: ".zip",
            clue: "Compressed files can hide malware that bypasses simple email filters. Gmail addresses for official PM office is a red flag."
        }
    },
    {
        id: 5,
        brand: 'Student Council',
        brandColor: "#673AB7",
        from: { name: 'Student Council', address: 'council@university-portal.edu' },
        to: 'student-body@university.edu',
        subject: "Meeting Notes - 3rd March",
        date: "Mon, Mar 3",
        body: [
            { type: 'brand-header', bgColor: '#673AB7', logo: 'COUNCIL', logoColor: '#fff' },
            { type: 'paragraph', text: "Hello Everyone," },
            { type: 'paragraph', text: "Attached are the notes from today's council meeting regarding the upcoming tech fest and the budget allocation for various student clubs." },
            {
                type: 'detail-table', rows: [
                    ['Meeting Date', 'March 3, 2026'],
                    ['Topic', 'Tech Fest & Budget'],
                    ['Attached', 'notes.pdf']
                ]
            },
            { type: 'paragraph', text: 'The next meeting is scheduled for next Monday. See you there.' },
            { type: 'separator' },
            { type: 'legal', text: "Student Council | University Portal\nTech Fest Planning Committee" },
        ],
        attachment: {
            name: "notes.pdf",
            size: "125 KB",
            type: "pdf",
            isMalicious: false,
            realExtension: ".pdf",
            clue: "Legitimate document from a trusted university domain."
        }
    }
];

const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const FileFortress = ({ onBack }) => {
    const [gameState, setGameState] = useState('intro');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [history, setHistory] = useState([]);
    const [feedback, setFeedback] = useState(null);
    const [expandedResult, setExpandedResult] = useState(null);
    const timerRef = useRef(null);

    const currentEmail = EMAILS[currentIndex];

    const startGame = useCallback(() => {
        setGameState('playing');
        setElapsed(0);
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

        const isMalicious = currentEmail.attachment.isMalicious;
        let isCorrect = false;

        // "Scan" is the choice for malicious files, "Open" for safe files
        if (action === 'scan') {
            isCorrect = isMalicious;
        } else if (action === 'open') {
            isCorrect = !isMalicious;
        }

        if (isCorrect) {
            setScore(prev => prev + 1000);
            setFeedback('correct');
        } else {
            setFeedback('wrong');
        }

        setHistory(prev => [...prev, { email: currentEmail, action, isCorrect }]);

        setTimeout(() => {
            setFeedback(null);
            if (currentIndex < EMAILS.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                if (timerRef.current) clearInterval(timerRef.current);
                setGameState('result');
            }
        }, 1500);
    };

    // ─── Email body renderer ──────────────────────────
    const renderEmailBody = (body, attachment) => {
        return (
            <div style={{ backgroundColor: '#f6f6f6', padding: '24px 0' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '0', overflow: 'hidden' }}>
                    {body.map((block, i) => {
                        switch (block.type) {
                            case 'brand-header':
                                return (
                                    <div key={i} style={{ backgroundColor: block.bgColor, padding: '24px 0', textAlign: 'center' }}>
                                        <span style={{
                                            color: block.logoColor,
                                            fontWeight: 800,
                                            fontSize: '24px',
                                            letterSpacing: '0.15em',
                                            textTransform: 'uppercase',
                                        }}>
                                            {block.logo}
                                        </span>
                                    </div>
                                );
                            case 'heading':
                                return <h3 key={i} style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a', margin: '24px 40px 16px', lineHeight: 1.3, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>{block.text}</h3>;
                            case 'paragraph':
                                return <p key={i} style={{ fontSize: '14px', color: '#444', lineHeight: 1.7, margin: '0 40px 16px', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>{block.text}</p>;
                            case 'cta':
                                return (
                                    <div key={i} style={{ textAlign: 'center', padding: '16px 40px' }}>
                                        <div style={{
                                            display: 'inline-block', backgroundColor: block.bgColor, color: '#fff',
                                            padding: '12px 32px', borderRadius: '4px', fontSize: '13px', fontWeight: 700,
                                            letterSpacing: '0.5px', cursor: 'default', fontFamily: "'Helvetica Neue', Arial, sans-serif",
                                            textDecoration: 'none',
                                        }}>
                                            {block.text}
                                        </div>
                                    </div>
                                );
                            case 'alert':
                                return (
                                    <div key={i} style={{
                                        margin: '16px 40px', padding: '12px 16px', borderRadius: '6px', fontSize: '13px',
                                        fontWeight: 600, lineHeight: 1.5, fontFamily: "'Helvetica Neue', Arial, sans-serif",
                                        backgroundColor: block.variant === 'danger' ? '#FEF2F2' : '#FFFBEB',
                                        border: `1px solid ${block.variant === 'danger' ? '#FECACA' : '#FDE68A'}`,
                                        color: block.variant === 'danger' ? '#991B1B' : '#92400E',
                                    }}>
                                        {block.text}
                                    </div>
                                );
                            case 'detail-table':
                                return (
                                    <div key={i} style={{ margin: '16px 40px', border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
                                            <tbody>
                                                {block.rows.map((row, ri) => (
                                                    <tr key={ri} style={{ backgroundColor: ri % 2 === 0 ? '#f9fafb' : '#fff' }}>
                                                        <td style={{ padding: '10px 14px', fontWeight: 600, color: '#6b7280', width: '35%', borderRight: '1px solid #f3f4f6', borderBottom: ri < block.rows.length - 1 ? '1px solid #f3f4f6' : 'none' }}>{row[0]}</td>
                                                        <td style={{ padding: '10px 14px', color: '#111827', borderBottom: ri < block.rows.length - 1 ? '1px solid #f3f4f6' : 'none' }}>{row[1]}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            case 'bullet-list':
                                return (
                                    <ul key={i} style={{ margin: '0 40px 16px', paddingLeft: '20px' }}>
                                        {block.items.map((item, li) => (
                                            <li key={li} style={{ fontSize: '14px', color: '#444', lineHeight: 1.7, marginBottom: '4px', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>{item}</li>
                                        ))}
                                    </ul>
                                );
                            case 'separator':
                                return <div key={i} style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '20px 40px' }} />;
                            case 'small':
                                return <p key={i} style={{ margin: '0 40px 8px', fontSize: '12px', color: '#666', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>{block.text}</p>;
                            case 'legal':
                                return (
                                    <div key={i} style={{ padding: '16px 40px', backgroundColor: '#f9fafb', borderTop: '1px solid #f3f4f6', marginTop: '12px' }}>
                                        <p style={{ fontSize: '10px', color: '#9ca3af', lineHeight: 1.8, whiteSpace: 'pre-line', fontFamily: "'Helvetica Neue', Arial, sans-serif", margin: 0 }}>{block.text}</p>
                                    </div>
                                );
                            default:
                                return null;
                        }
                    })}

                    {/* Attachment Integrated into Email container */}
                    {attachment && (
                        <div style={{ padding: '20px 40px 40px' }}>
                            <div style={{
                                padding: '12px',
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #e5e7eb',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                maxWidth: '320px',
                                cursor: 'default'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    backgroundColor: '#ffffff',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '28px',
                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                }}>
                                    {attachment.type === 'executable' ? '⚙️' :
                                        attachment.type === 'pdf' ? '📄' :
                                            attachment.type === 'zip' ? '📦' : '📄'}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1f1f1f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{attachment.name}</div>
                                    <div style={{ fontSize: '11px', color: '#5f6368' }}>{attachment.size}</div>
                                </div>
                                <div style={{ color: '#5f6368', fontSize: '14px' }}>📥</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderIntro = () => (
        <div className="flex flex-col items-center justify-center p-12 text-center max-w-2xl animate-fade-in h-[75vh]">
            <div className="w-24 h-24 bg-cyan-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.15)]">
                <span className="text-5xl">🛡️</span>
            </div>
            <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-6 underline decoration-cyan-500 underline-offset-8">File Fortress</h2>
            <p className="text-slate-400 leading-relaxed mb-10 text-lg font-mono">
                [ AEGIS_TERMINAL_V2.0 ]
                <br /><br />
                Desktop attachments can contain hidden threats.
                Analyze each email and its attachment.
                <br /><br />
                Choose <span className="text-amber-400 font-bold">SCAN</span> if you suspect malware.
                <br />
                Choose <span className="text-emerald-400 font-bold">OPEN</span> if the file is safe.
            </p>
            <div className="flex gap-4">
                <button onClick={onBack} className="px-10 py-4 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-black rounded-2xl transition-all uppercase tracking-[0.2em] text-xs border border-slate-800 active:scale-95">
                    ABORT
                </button>
                <button onClick={startGame} className="px-14 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all uppercase tracking-[0.2em] text-xs border border-cyan-400 active:scale-95">
                    START PROTOCOL
                </button>
            </div>
        </div>
    );

    const renderPlaying = () => (
        <div className="w-full h-full flex flex-col animate-fade-in font-sans text-slate-900">
            {/* Top Stats Bar */}
            <div className="shrink-0 w-full bg-slate-900 border-b border-slate-800 px-8 py-3 flex items-center justify-between z-50">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">FILES</span>
                        <span className="text-sm font-bold text-white">{currentIndex + 1} / {EMAILS.length}</span>
                    </div>
                    <div className="w-px h-6 bg-slate-800" />
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">TIME</span>
                        <span className="text-sm font-bold text-cyan-400 font-mono tracking-tighter">{formatTime(elapsed)}</span>
                    </div>
                    <div className="w-px h-6 bg-slate-800" />
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">SCORE</span>
                        <span className="text-sm font-black text-white">{score.toLocaleString()}</span>
                    </div>
                </div>
                <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                    SENTRY_ACTIVE
                </div>
            </div>

            {/* Main Layout */}
            <div className="flex-1 flex overflow-hidden bg-[#f6f8fc]">

                {/* Email Client Layout (Simplified Spot the Fish Style) */}
                <div className="flex-1 overflow-y-auto bg-gray-200" style={{ scrollBehavior: 'smooth' }}>
                    <div className="min-h-full flex justify-center py-6 px-6 text-slate-900">
                        <div className="w-full max-w-[850px] bg-white rounded-lg overflow-hidden relative shadow-[0_2px_20px_rgba(0,0,0,0.15)]">

                            {/* Gmail-style toolbar */}
                            <div className="flex items-center justify-between px-5 py-2.5 bg-gray-50 border-b border-gray-200">
                                <div className="flex items-center gap-4 text-gray-400">
                                    <span className="text-sm cursor-default">📥</span>
                                    <span className="text-sm cursor-default">⚠️</span>
                                    <span className="text-sm cursor-default">🗑️</span>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-sm cursor-default">📁</span>
                                    <span className="text-sm cursor-default">🏷️</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-400 text-xs">
                                    <span>{currentIndex + 1} of {EMAILS.length}</span>
                                    <span className="cursor-default hover:text-gray-600">◀</span>
                                    <span className="cursor-default hover:text-gray-600">▶</span>
                                </div>
                            </div>

                            {/* Subject */}
                            <div className="px-8 pt-6 pb-2">
                                <h2 className="text-[24px] font-normal text-gray-900 leading-[1.3]" style={{ fontFamily: "'Google Sans', sans-serif" }}>
                                    {currentEmail.subject}
                                </h2>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-sm font-medium">Inbox</span>
                                    <span className="text-[11px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-sm cursor-default">×</span>
                                </div>
                            </div>

                            {/* Sender Info */}
                            <div className="flex items-start gap-3.5 px-8 py-4">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 mt-1" style={{ backgroundColor: currentEmail.brandColor || '#555' }}>
                                    {currentEmail.brand[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-[14px] font-semibold text-gray-900" style={{ fontFamily: "'Google Sans', sans-serif" }}>{currentEmail.from.name}</span>
                                        <span className="text-[12px] text-gray-400">&lt;{currentEmail.from.address}&gt;</span>
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <span className="text-[12px] text-gray-500">to {currentEmail.to === 'you@office.com' ? 'me' : currentEmail.to}</span>
                                        <span className="text-[10px] text-gray-400">▼</span>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 flex items-center gap-4 text-gray-400">
                                    <span className="text-[12px] text-gray-500 font-sans">{currentEmail.date}</span>
                                    <span className="text-lg cursor-default">☆</span>
                                    <span className="text-sm cursor-default">↩️</span>
                                    <span className="text-sm cursor-default">⋮</span>
                                </div>
                            </div>

                            {/* Email Body & Integrated Attachment */}
                            <div className="border-t border-gray-100">
                                {renderEmailBody(currentEmail.body, currentEmail.attachment)}
                            </div>

                            {/* Feedback overlay */}
                            {feedback && (
                                <div className={`absolute inset-0 flex items-center justify-center z-[100] backdrop-blur-sm transition-all ${feedback === 'correct' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                                    <div className="text-center p-8 rounded-2xl bg-white shadow-2xl scale-110">
                                        <span className="text-8xl block mb-3 animate-bounce">{feedback === 'correct' ? '✅' : '❌'}</span>
                                        <span className={`text-4xl font-black uppercase tracking-wider ${feedback === 'correct' ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {feedback === 'correct' ? 'SECURE!' : 'BREACH!'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Verdict Sidebar */}
                <div className="shrink-0 w-72 bg-slate-950 border-l border-slate-800 flex flex-col items-center justify-center gap-6 p-8 z-40 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
                    <div className="text-center mb-4">
                        <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest block mb-2">Verdict Panel</span>
                        <h3 className="text-white font-bold text-sm tracking-tight px-4 leading-relaxed">Is this attachment safe to execute?</h3>
                    </div>

                    <button
                        onClick={() => handleAction('scan')}
                        disabled={!!feedback}
                        className="w-full py-8 bg-amber-600/10 border-2 border-amber-500/30 rounded-3xl group hover:bg-amber-600 hover:border-amber-400 transition-all flex flex-col items-center justify-center gap-3 disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                    >
                        <span className="text-5xl group-hover:scale-110 transition-transform">🔍</span>
                        <div className="text-center">
                            <span className="font-black text-amber-500 group-hover:text-white uppercase tracking-[0.2em] text-sm">Scan Security</span>
                            <p className="text-[9px] text-slate-600 group-hover:text-amber-200 mt-1 uppercase font-black">Identify Threat</p>
                        </div>
                    </button>

                    <button
                        onClick={() => handleAction('open')}
                        disabled={!!feedback}
                        className="w-full py-8 bg-emerald-600/10 border-2 border-emerald-500/30 rounded-3xl group hover:bg-emerald-600 hover:border-emerald-400 transition-all flex flex-col items-center justify-center gap-3 disabled:opacity-30 disabled:pointer-events-none active:scale-95"
                    >
                        <span className="text-5xl group-hover:scale-110 transition-transform">✅</span>
                        <div className="text-center">
                            <span className="font-black text-emerald-500 group-hover:text-white uppercase tracking-[0.2em] text-sm">Open File</span>
                            <p className="text-[9px] text-slate-600 group-hover:text-amber-200 mt-1 uppercase font-black">Allow Execution</p>
                        </div>
                    </button>

                    <div className="mt-8 border-t border-slate-900 pt-8 w-full">
                        <p className="text-[10px] text-slate-700 italic text-center px-4 leading-relaxed">Note: Choose Scan if you detect malicious markers. Choose Open if the file is verified.</p>
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
        const accuracy = Math.round((correctCount / EMAILS.length) * 100);

        const getGrade = () => {
            if (accuracy >= 100) return { grade: 'S', color: '#06b6d4', label: 'FORTRESS KEEPER' };
            if (accuracy >= 80) return { grade: 'A', color: '#10b981', label: 'WATCHMAN' };
            if (accuracy >= 60) return { grade: 'B', color: '#3b82f6', label: 'SENTRY' };
            if (accuracy >= 40) return { grade: 'C', color: '#f59e0b', label: 'GUARD' };
            return { grade: 'F', color: '#ef4444', label: 'VULNERABLE' };
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
                    <p className="text-slate-500 font-mono text-xs mt-2 uppercase tracking-widest">Protocol Complete — File Integrity Audit</p>
                </div>

                <div className="grid grid-cols-4 gap-4 w-full max-w-2xl mb-10">
                    {[
                        { label: 'Score', value: score.toLocaleString(), color: 'text-cyan-400' },
                        { label: 'Accuracy', value: `${accuracy}%`, color: accuracy >= 70 ? 'text-emerald-400' : 'text-red-400' },
                        { label: 'Time Taken', value: formatTime(elapsed), color: 'text-amber-400' },
                        { label: 'Inspected', value: `${correctCount}/${EMAILS.length}`, color: 'text-indigo-400' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                            <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest block mb-1">{stat.label}</span>
                            <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                        </div>
                    ))}
                </div>

                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 self-start">Integrity Breakdown</h3>
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
                                    {item.email.attachment.isMalicious ? '☣️' : '📄'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-bold text-white truncate">{item.email.attachment.name}</span>
                                        <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded ${item.isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {item.email.attachment.isMalicious ? 'THREAT' : 'SAFE'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-500 truncate block font-mono">Action: {item.action.toUpperCase()}</span>
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
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Malware Analysis</span>
                                    <p className="text-xs text-slate-400 leading-relaxed italic border-l-2 border-cyan-500 pl-4 py-1">
                                        "{item.email.attachment.explanation || 'No detailed analysis available.'}"
                                    </p>
                                    <div className="flex items-start gap-2 text-xs text-cyan-400/80 mt-3 font-mono">
                                        <span className="text-cyan-500 font-bold">Indicator:</span>
                                        <span>{item.email.attachment.clue}</span>
                                    </div>
                                    <div className="text-[10px] text-slate-600 mt-2">
                                        Sender: <span className="text-slate-400">{item.email.from.address}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button onClick={startGame} className="px-12 py-4 bg-cyan-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-indigo-50 transition-all hover:text-cyan-600 shadow-lg text-sm">
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

export default FileFortress;
