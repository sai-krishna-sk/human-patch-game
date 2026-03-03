import React, { useState, useEffect, useCallback, useRef } from 'react';

// ═══════════════════════════════════════════════════════════════
// EMAIL DATA
// ═══════════════════════════════════════════════════════════════
const EMAILS = [
    {
        id: 1,
        brand: 'Google',
        brandColor: '#4285F4',
        from: { name: 'Google', address: 'no-reply@accounts-google.com' },
        to: 'you@gmail.com',
        date: 'Mar 3, 2026, 10:42 AM',
        subject: '⚠️ Critical Security Alert for your Account',
        hasAttachment: false,
        body: [
            { type: 'brand-header', bgColor: '#4285F4', logo: 'G', logoColor: '#fff' },
            { type: 'heading', text: 'Someone knows your password' },
            { type: 'paragraph', text: 'Hi User,' },
            { type: 'paragraph', text: 'Someone just used your password to try to sign in to your Google Account. Google blocked them, but you should check what happened.' },
            { type: 'paragraph', text: 'Check activity on your account as soon as possible.' },
            { type: 'cta', text: 'CHECK ACTIVITY', bgColor: '#EA4335' },
            { type: 'alert', variant: 'danger', text: '⏰ Your account will be DELETED within 2 hours if no action is taken.' },
            { type: 'separator' },
            { type: 'small', text: "You can also check security events at https://myaccount.accounts-google.com/security" },
            { type: 'legal', text: "This email was sent to you because Google detected sign-in activity.\nGoogle LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043" },
        ],
        isLegit: false,
        difficulty: 'easy',
        clues: [
            'Domain is "accounts-google.com" — Google uses "accounts.google.com" (subdomain, not hyphen)',
            'Urgency tactic: "account deleted in 2 hours" is a fear technique',
            'Red CTA button — Google uses blue branded buttons',
            'Link in footer also points to the fake domain'
        ]
    },
    {
        id: 2,
        brand: 'Netflix',
        brandColor: '#E50914',
        from: { name: 'Netflix', address: 'info@mailer.netflix.com' },
        to: 'you@gmail.com',
        date: 'Mar 2, 2026, 6:15 PM',
        subject: 'Your membership is about to renew',
        hasAttachment: false,
        body: [
            { type: 'brand-header', bgColor: '#000', logo: 'NETFLIX', logoColor: '#E50914', logoFont: 'netflix' },
            { type: 'paragraph', text: 'Hi there,' },
            { type: 'paragraph', text: 'Just a friendly reminder — your current billing cycle ends on March 10, 2026. Your payment method on file will be automatically charged.' },
            { type: 'paragraph', text: "No action is needed on your part. If you'd like to update your payment details, you can do so from your Account Settings." },
            { type: 'cta', text: 'Go to Account', bgColor: '#E50914' },
            { type: 'separator' },
            { type: 'legal', text: "This email was sent from an address that can't receive replies.\nNetflix, Inc. 100 Winchester Circle, Los Gatos, CA 95032\nQuestions? Visit help.netflix.com" },
        ],
        isLegit: true,
        difficulty: 'easy',
        clues: [
            'Legitimate mailer.netflix.com subdomain',
            'No urgency or threatening language',
            'Professional, standard notification tone'
        ]
    },
    {
        id: 3,
        brand: 'HDFC Bank',
        brandColor: '#004C8F',
        from: { name: 'HDFC Bank Alerts', address: 'alerts@hdfcbk-secure.net' },
        to: 'you@email.com',
        date: 'Mar 3, 2026, 9:02 AM',
        subject: '🔒 Suspicious Login Activity Detected on Your Account',
        hasAttachment: true,
        attachmentName: 'Login_Details.pdf.exe',
        attachmentSize: '284 KB',
        body: [
            { type: 'brand-header', bgColor: '#004C8F', logo: 'HDFC BANK', logoColor: '#fff' },
            { type: 'heading', text: 'Unusual Activity on Your Account' },
            { type: 'paragraph', text: 'Dear Valued Customer,' },
            { type: 'paragraph', text: 'We have detected a login attempt from an unrecognized device in Moscow, Russia (IP: 185.233.XX.XX) at 02:14 AM IST.' },
            {
                type: 'detail-table', rows: [
                    ['Location', 'Moscow, Russia'],
                    ['Device', 'Unknown Linux Desktop'],
                    ['IP Address', '185.233.XX.XX'],
                    ['Status', '🟡 PENDING VERIFICATION']
                ]
            },
            { type: 'cta', text: 'VERIFY YOUR IDENTITY NOW', bgColor: '#DC2626' },
            { type: 'alert', variant: 'danger', text: 'Failure to verify within 24 hours will result in temporary account suspension for your safety.' },
            { type: 'separator' },
            { type: 'legal', text: "HDFC Bank Ltd. Regd. Office: HDFC Bank House, Senapati Bapat Marg, Lower Parel, Mumbai - 400013\nCIN: L65920MH1994PLC080618\nPlease do not reply to this email." },
        ],
        isLegit: false,
        difficulty: 'medium',
        clues: [
            'Domain "hdfcbk-secure.net" — HDFC uses hdfcbank.com',
            'Attachment: "Login_Details.pdf.exe" — double extension hides an executable!',
            'Threatening language about account suspension',
            'Partially masked IP address is suspicious'
        ]
    },
    {
        id: 4,
        brand: 'IT Dept',
        brandColor: '#6366F1',
        from: { name: 'IT Helpdesk', address: 'helpdesk@yourcompany.com' },
        to: 'all-staff@yourcompany.com',
        date: 'Mar 1, 2026, 11:30 AM',
        subject: 'Updated Password Policy — Effective April 1st',
        hasAttachment: true,
        attachmentName: 'Password_Policy_v3.pdf',
        attachmentSize: '1.2 MB',
        body: [
            { type: 'brand-header', bgColor: '#6366F1', logo: 'IT HELPDESK', logoColor: '#fff' },
            { type: 'heading', text: 'Password Policy Update' },
            { type: 'paragraph', text: 'Dear Team,' },
            { type: 'paragraph', text: 'As part of our ongoing security improvements, we are updating our password policy effective April 1, 2026. Key changes include:' },
            {
                type: 'bullet-list', items: [
                    'Minimum 14 characters (up from 12)',
                    'MFA required for all VPN access',
                    'Password rotation every 90 days',
                    'Passphrases are now recommended over complex character strings'
                ]
            },
            { type: 'paragraph', text: 'Please review the attached document for full details. No immediate action is required.' },
            { type: 'separator' },
            { type: 'legal', text: "IT Department | Internal Use Only\nDo not forward this email externally." },
        ],
        isLegit: true,
        difficulty: 'easy',
        clues: [
            'Legitimate internal company domain',
            'No urgent call-to-action or threatening language',
            'Attachment is a standard .pdf (not .exe)',
            'Sent to all-staff, a common internal alias'
        ]
    },
    {
        id: 5,
        brand: 'Amazon',
        brandColor: '#FF9900',
        from: { name: 'Amazon Logistics', address: 'shipment-track@amzn-deliveries.site' },
        to: 'you@gmail.com',
        date: 'Mar 3, 2026, 7:55 AM',
        subject: '🚚 Delivery Failed — Immediate Action Required',
        hasAttachment: false,
        body: [
            { type: 'brand-header', bgColor: '#232F3E', logo: 'amazon', logoColor: '#FF9900', logoFont: 'amazon' },
            { type: 'heading', text: "We couldn't deliver your package" },
            { type: 'paragraph', text: 'Hello,' },
            { type: 'paragraph', text: 'Your order #882-1927364-1129837 could not be delivered on March 2nd due to an incomplete address. If you do not update your address within 48 hours, the package will be returned to the seller.' },
            {
                type: 'detail-table', rows: [
                    ['Order #', '882-1927364-1129837'],
                    ['Item', 'Sony WH-1000XM5 Headphones'],
                    ['Delivery Attempt', 'March 2, 2026'],
                    ['Status', '❌ FAILED']
                ]
            },
            { type: 'cta', text: 'UPDATE ADDRESS NOW', bgColor: '#FF9900' },
            { type: 'separator' },
            { type: 'legal', text: "Amazon.com, Inc. or its affiliates. All rights reserved.\nThis message was sent by Amazon Logistics." },
        ],
        isLegit: false,
        difficulty: 'medium',
        clues: [
            'Domain "amzn-deliveries.site" — Amazon uses amazon.com/.in',
            '.site TLD is very commonly used in phishing',
            'Creates urgency with 48-hour deadline',
            'Generic greeting "Hello" instead of your name'
        ]
    },
    {
        id: 6,
        brand: 'Apple',
        brandColor: '#555555',
        from: { name: 'Apple', address: 'noreply@apple.com' },
        to: 'you@icloud.com',
        date: 'Mar 2, 2026, 3:12 PM',
        subject: 'Your receipt from Apple',
        hasAttachment: false,
        body: [
            { type: 'brand-header', bgColor: '#f5f5f7', logo: '🍎', logoColor: '#555', logoFont: 'apple' },
            { type: 'heading', text: 'Receipt' },
            { type: 'paragraph', text: 'Apple ID: you@icloud.com' },
            {
                type: 'detail-table', rows: [
                    ['Item', 'iCloud+ 50GB'],
                    ['Billed', 'March 2, 2026'],
                    ['Amount', '₹75.00'],
                    ['Payment', 'Visa •••• 4821']
                ]
            },
            { type: 'paragraph', text: 'If you did not authorize this purchase, you can manage your subscriptions in Settings > Apple ID > Subscriptions.' },
            { type: 'separator' },
            { type: 'small', text: 'Apple ID Summary • Terms of Sale • Privacy Policy' },
            { type: 'legal', text: "Apple Inc.\nOne Apple Park Way, Cupertino, CA 95014\nAll rights reserved. Get help at support.apple.com" },
        ],
        isLegit: true,
        difficulty: 'easy',
        clues: [
            'Valid apple.com domain',
            'Expected transactional receipt',
            'No urgency or aggressive CTA',
            'Partial card number matches standard bank redaction'
        ]
    },
    {
        id: 7,
        brand: 'Binance',
        brandColor: '#F0B90B',
        from: { name: 'Binance Team', address: 'support@binance-verify-sync.io' },
        to: 'you@email.com',
        date: 'Mar 3, 2026, 1:33 AM',
        subject: '🚨 Withdrawal Request Confirmed — 0.5 BTC',
        hasAttachment: false,
        body: [
            { type: 'brand-header', bgColor: '#1E2026', logo: 'BINANCE', logoColor: '#F0B90B' },
            { type: 'heading', text: 'Withdrawal Confirmation' },
            { type: 'paragraph', text: 'Dear User,' },
            { type: 'paragraph', text: 'A withdrawal request was initiated from your Binance account:' },
            {
                type: 'detail-table', rows: [
                    ['Amount', '0.5 BTC (~$32,450 USD)'],
                    ['Destination', '3FZbgi29cpjq2GjdwV8...'],
                    ['Time', 'Mar 3, 2026 01:30 AM UTC'],
                    ['IP Address', '91.108.XX.XX (Tor Network)']
                ]
            },
            { type: 'alert', variant: 'danger', text: '⚠️ If this was NOT you, cancel IMMEDIATELY to prevent permanent loss of funds.' },
            { type: 'cta', text: 'CANCEL WITHDRAWAL', bgColor: '#DC2626' },
            { type: 'separator' },
            { type: 'legal', text: "© 2026 Binance. All rights reserved.\nBinance.com" },
        ],
        isLegit: false,
        difficulty: 'hard',
        clues: [
            'Domain "binance-verify-sync.io" — Binance uses binance.com',
            'Mentions "Tor Network" to increase panic',
            'Fear-based urgency: "cancel IMMEDIATELY"',
            'Sent at 1:33 AM — unusual timing for a legitimate notification'
        ]
    },
    {
        id: 8,
        brand: 'LinkedIn',
        brandColor: '#0A66C2',
        from: { name: 'LinkedIn', address: 'messages-noreply@linkedin.com' },
        to: 'you@gmail.com',
        date: 'Mar 2, 2026, 4:45 PM',
        subject: 'You have 3 new connection requests',
        hasAttachment: false,
        body: [
            { type: 'brand-header', bgColor: '#0A66C2', logo: 'in', logoColor: '#fff', logoFont: 'linkedin' },
            { type: 'paragraph', text: 'Hi User,' },
            { type: 'paragraph', text: 'You have 3 pending connection requests waiting for your response:' },
            {
                type: 'connection-cards', connections: [
                    { name: 'Priya Sharma', title: 'Product Manager at Google', initials: 'PS', color: '#EA4335' },
                    { name: 'Alex Chen', title: 'Senior Engineer at Meta', initials: 'AC', color: '#0668E1' },
                    { name: 'Ravi Kumar', title: 'CS Student at IIT Delhi', initials: 'RK', color: '#6366F1' },
                ]
            },
            { type: 'cta', text: 'View Requests', bgColor: '#0A66C2' },
            { type: 'separator' },
            { type: 'small', text: 'You are receiving LinkedIn notification emails.' },
            { type: 'legal', text: "LinkedIn Corporation, 1000 W Maude Ave, Sunnyvale, CA 94085\nUnsubscribe · Help Center" },
        ],
        isLegit: true,
        difficulty: 'medium',
        clues: [
            'Legitimate linkedin.com domain',
            'Standard notification format with connection cards',
            'No urgency or threats',
            'Standard unsubscribe footer present'
        ]
    },
    {
        id: 9,
        brand: 'PayPal',
        brandColor: '#003087',
        from: { name: 'PayPal Security', address: 'service@paypaI-resolution.com' },
        to: 'you@email.com',
        date: 'Mar 3, 2026, 8:10 AM',
        subject: '⚠️ Your PayPal account has been limited',
        hasAttachment: true,
        attachmentName: 'PayPal_Resolution_Form.html',
        attachmentSize: '48 KB',
        body: [
            { type: 'brand-header', bgColor: '#003087', logo: 'PayPal', logoColor: '#fff' },
            { type: 'heading', text: 'Account Limitation Notice' },
            { type: 'paragraph', text: 'Dear Customer,' },
            { type: 'paragraph', text: "We've noticed unusual activity in your PayPal account. As a security measure, we have temporarily limited certain features of your account." },
            { type: 'paragraph', text: 'To restore full access, please verify your identity by completing the attached resolution form within 24 hours.' },
            {
                type: 'detail-table', rows: [
                    ['Case ID', 'PP-LIMIT-20260303-8841'],
                    ['Reason', 'Unusual login pattern'],
                    ['Action Required', 'Identity Verification'],
                    ['Deadline', '24 hours']
                ]
            },
            { type: 'cta', text: 'RESTORE ACCESS NOW', bgColor: '#DC2626' },
            { type: 'separator' },
            { type: 'legal', text: "PayPal, Inc. 2211 North First Street, San Jose, CA 95131\nPlease do not reply to this email." },
        ],
        isLegit: false,
        difficulty: 'hard',
        clues: [
            'Domain "paypaI-resolution.com" — uses capital I (I) instead of lowercase L (l) in "PayPal"!',
            'Attachment is an .html file — likely a credential harvesting phishing page',
            '24-hour deadline creates artificial urgency',
            'Generic "Dear Customer" instead of your real name'
        ]
    },
    {
        id: 10,
        brand: 'GitHub',
        brandColor: '#24292F',
        from: { name: 'GitHub', address: 'noreply@github.com' },
        to: 'you@gmail.com',
        date: 'Mar 2, 2026, 9:50 PM',
        subject: '[GitHub] A new public key was added to your account',
        hasAttachment: false,
        body: [
            { type: 'brand-header', bgColor: '#24292F', logo: 'GitHub', logoColor: '#fff' },
            { type: 'paragraph', text: 'Hey there!' },
            { type: 'paragraph', text: 'A new SSH public key was added to your account:' },
            {
                type: 'detail-table', rows: [
                    ['Title', 'MacBook Pro (Work)'],
                    ['Fingerprint', 'SHA256:nThbg6kXUpJ...'],
                    ['Added', 'March 2, 2026 at 21:48 UTC'],
                ]
            },
            { type: 'paragraph', text: 'If you believe this key was added without your authorization, you can remove it from your SSH and GPG keys settings page.' },
            { type: 'separator' },
            { type: 'small', text: 'Manage notification settings · Unsubscribe' },
            { type: 'legal', text: "GitHub, Inc. 88 Colin P. Kelly Jr. Street\nSan Francisco, CA 94107" },
        ],
        isLegit: true,
        difficulty: 'medium',
        clues: [
            'Legitimate github.com domain',
            'Factual notification without forced action',
            'Provides self-service resolution path',
            'Standard GitHub notification format'
        ]
    },
];

const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

// Fisher-Yates shuffle
const shuffleArray = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════
const SpotThePhish = ({ onBack }) => {
    const [gameState, setGameState] = useState('intro');
    const [shuffledEmails, setShuffledEmails] = useState(() => shuffleArray(EMAILS));
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [combo, setCombo] = useState(0);
    const [maxCombo, setMaxCombo] = useState(0);
    const [elapsed, setElapsed] = useState(0);
    const [feedback, setFeedback] = useState(null);
    const [history, setHistory] = useState([]);
    const [expandedResult, setExpandedResult] = useState(null);
    const timerRef = useRef(null);

    const startGame = useCallback(() => {
        setGameState('playing');
        setElapsed(0);
        timerRef.current = setInterval(() => {
            setElapsed(prev => prev + 1);
        }, 1000);
    }, []);

    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const handleAnswer = useCallback((isLegitChoice) => {
        if (feedback) return;
        const currentEmail = shuffledEmails[currentIndex];
        const correct = isLegitChoice === currentEmail.isLegit;

        if (correct) {
            const comboMultiplier = combo + 1;
            const difficultyBonus = currentEmail.difficulty === 'hard' ? 3 : currentEmail.difficulty === 'medium' ? 2 : 1;
            setScore(prev => prev + (100 * comboMultiplier * difficultyBonus));
            setCombo(prev => {
                const next = prev + 1;
                setMaxCombo(mc => Math.max(mc, next));
                return next;
            });
            setFeedback('correct');
        } else {
            setCombo(0);
            setFeedback('wrong');
        }

        setHistory(prev => [...prev, { ...currentEmail, userCorrect: correct, userChoice: isLegitChoice }]);

        setTimeout(() => {
            setFeedback(null);
            if (currentIndex < shuffledEmails.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                clearInterval(timerRef.current);
                setGameState('result');
            }
        }, 900);
    }, [currentIndex, combo, feedback, shuffledEmails]);

    const resetGame = () => {
        setGameState('intro');
        setShuffledEmails(shuffleArray(EMAILS));
        setCurrentIndex(0);
        setScore(0);
        setCombo(0);
        setMaxCombo(0);
        setElapsed(0);
        setHistory([]);
        setFeedback(null);
        setExpandedResult(null);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    // ─── Email body renderer ──────────────────────────
    const renderEmailBody = (body) => {
        return (
            <div style={{ backgroundColor: '#f6f6f6', padding: '24px 0' }}>
                <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '0', overflow: 'hidden' }}>
                    {body.map((block, i) => {
                        switch (block.type) {
                            case 'brand-header':
                                return (
                                    <div key={i} style={{ backgroundColor: block.bgColor, padding: '28px 0', textAlign: 'center' }}>
                                        <span style={{
                                            color: block.logoColor,
                                            fontWeight: 800,
                                            fontSize: block.logoFont === 'netflix' ? '36px' : block.logoFont === 'amazon' ? '34px' : block.logoFont === 'linkedin' ? '36px' : '28px',
                                            fontFamily: block.logoFont === 'netflix' || block.logoFont === 'amazon' ? "'Georgia', serif" : "'Helvetica Neue', Arial, sans-serif",
                                            fontStyle: block.logoFont === 'amazon' ? 'italic' : 'normal',
                                            letterSpacing: block.logo.length <= 2 ? '0.15em' : block.logoFont === 'netflix' ? '0.35em' : '0.02em',
                                            textTransform: block.logoFont === 'netflix' ? 'uppercase' : 'none',
                                        }}>
                                            {block.logo}
                                        </span>
                                    </div>
                                );
                            case 'heading':
                                return <h3 key={i} style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', margin: '24px 40px 16px', lineHeight: 1.3, fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>{block.text}</h3>;
                            case 'paragraph':
                                return <p key={i} style={{ fontSize: '15px', color: '#444', lineHeight: 1.8, margin: '0 40px 16px', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>{block.text}</p>;
                            case 'cta':
                                return (
                                    <div key={i} style={{ textAlign: 'center', padding: '20px 40px' }}>
                                        <div style={{
                                            display: 'inline-block', backgroundColor: block.bgColor, color: '#fff',
                                            padding: '14px 36px', borderRadius: '6px', fontSize: '14px', fontWeight: 700,
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
                                        margin: '16px 40px', padding: '14px 18px', borderRadius: '6px', fontSize: '14px',
                                        fontWeight: 600, lineHeight: 1.6, fontFamily: "'Helvetica Neue', Arial, sans-serif",
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
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>
                                            <tbody>
                                                {block.rows.map((row, ri) => (
                                                    <tr key={ri} style={{ backgroundColor: ri % 2 === 0 ? '#f9fafb' : '#fff' }}>
                                                        <td style={{ padding: '12px 16px', fontWeight: 600, color: '#6b7280', width: '35%', borderRight: '1px solid #f3f4f6', borderBottom: ri < block.rows.length - 1 ? '1px solid #f3f4f6' : 'none' }}>{row[0]}</td>
                                                        <td style={{ padding: '12px 16px', color: '#111827', borderBottom: ri < block.rows.length - 1 ? '1px solid #f3f4f6' : 'none' }}>{row[1]}</td>
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
                                            <li key={li} style={{ fontSize: '15px', color: '#444', lineHeight: 1.8, marginBottom: '4px', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>{item}</li>
                                        ))}
                                    </ul>
                                );
                            case 'connection-cards':
                                return (
                                    <div key={i} style={{ margin: '8px 40px' }}>
                                        {block.connections.map((c, ci) => (
                                            <div key={ci} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', backgroundColor: '#f9fafb', borderRadius: '10px', border: '1px solid #f3f4f6', marginBottom: '10px' }}>
                                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 700, flexShrink: 0 }}>{c.initials}</div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '15px', fontWeight: 600, color: '#111' }}>{c.name}</div>
                                                    <div style={{ fontSize: '13px', color: '#6b7280' }}>{c.title}</div>
                                                </div>
                                                <div style={{ backgroundColor: '#0A66C2', color: '#fff', padding: '8px 20px', borderRadius: '24px', fontSize: '12px', fontWeight: 700, cursor: 'default' }}>Connect</div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            case 'separator':
                                return <div key={i} style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '20px 40px' }} />;
                            case 'small':
                                return <p key={i} style={{ margin: '0 40px 8px', fontSize: '13px', color: '#2563EB', fontFamily: "'Helvetica Neue', Arial, sans-serif" }}>{block.text}</p>;
                            case 'legal':
                                return (
                                    <div key={i} style={{ padding: '20px 40px', backgroundColor: '#f9fafb', borderTop: '1px solid #f3f4f6', marginTop: '12px' }}>
                                        <p style={{ fontSize: '11px', color: '#9ca3af', lineHeight: 2, whiteSpace: 'pre-line', fontFamily: "'Helvetica Neue', Arial, sans-serif", margin: 0 }}>{block.text}</p>
                                    </div>
                                );
                            default:
                                return null;
                        }
                    })}
                </div>
            </div>
        );
    };

    const getGrade = () => {
        const pct = history.length > 0 ? (history.filter(h => h.userCorrect).length / history.length) * 100 : 0;
        if (pct >= 90) return { grade: 'S', color: '#F0B90B', label: 'SECURITY EXPERT' };
        if (pct >= 75) return { grade: 'A', color: '#22C55E', label: 'WELL TRAINED' };
        if (pct >= 50) return { grade: 'B', color: '#3B82F6', label: 'NEEDS IMPROVEMENT' };
        return { grade: 'C', color: '#EF4444', label: 'VULNERABLE' };
    };

    // ═══════════════════════ INTRO ═══════════════════════
    const renderIntro = () => (
        <div className="flex flex-col items-center gap-8 max-w-2xl text-center px-6 animate-fade-in">
            <div className="relative">
                <div className="w-28 h-28 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-3xl flex items-center justify-center border border-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.15)]">
                    <span className="text-6xl">📧</span>
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-black animate-bounce shadow-lg">
                    {EMAILS.length}
                </div>
            </div>

            <div>
                <h2 className="text-5xl font-black text-white uppercase tracking-tighter mb-2">Spot The Phish</h2>
                <p className="text-cyan-400 font-mono text-xs uppercase tracking-[0.3em]">Inbox Threat Analysis Protocol</p>
            </div>

            <p className="text-slate-400 leading-relaxed max-w-lg text-sm">
                Your inbox is under attack. Carefully analyze each email — check the sender domain, tone, links, and attachments.
                Classify all <span className="text-white font-bold">{EMAILS.length} emails</span>. We'll track how long it takes you.
            </p>

            <div className="w-full max-w-md bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-left space-y-4">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">HOW TO PLAY</h3>
                <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center border border-red-500/20 shrink-0"><span className="text-lg">🚫</span></div>
                    <div>
                        <span className="text-white font-bold text-sm">Click "PHISHING"</span>
                        <span className="text-slate-500 text-xs block">If you think the email is fake or malicious</span>
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20 shrink-0"><span className="text-lg">✅</span></div>
                    <div>
                        <span className="text-white font-bold text-sm">Click "LEGITIMATE"</span>
                        <span className="text-slate-500 text-xs block">If you think the email is real and safe</span>
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center border border-cyan-500/20 shrink-0"><span className="text-lg">🔍</span></div>
                    <div>
                        <span className="text-white font-bold text-sm">Analyze Everything</span>
                        <span className="text-slate-500 text-xs block">Domain, urgency, attachments, links, tone</span>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 mt-4">
                <button onClick={startGame} className="px-14 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 rounded-xl text-white font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 text-sm">
                    START DRILL
                </button>
                <button onClick={onBack} className="px-8 py-4 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all font-bold text-sm">
                    EXIT
                </button>
            </div>
        </div>
    );

    // ═══════════════════════ PLAYING ═══════════════════════
    const renderPlaying = () => {
        const email = shuffledEmails[currentIndex];

        return (
            <div className="w-full h-full flex flex-col" style={{ maxWidth: '100vw' }}>
                {/* ── Top Stats Bar ── */}
                <div className="shrink-0 w-full bg-slate-900/95 border-b border-slate-800 px-8 py-3 flex items-center justify-between backdrop-blur-md z-20">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest">Inbox</span>
                            <span className="text-sm font-bold text-white">{currentIndex + 1}<span className="text-slate-600"> / {shuffledEmails.length}</span></span>
                        </div>
                        <div className="w-px h-6 bg-slate-800" />
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest">Time</span>
                            <span className="text-sm font-bold text-cyan-400 tabular-nums font-mono">{formatTime(elapsed)}</span>
                        </div>
                        <div className="w-px h-6 bg-slate-800" />
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest">Score</span>
                            <span className="text-sm font-black text-white tabular-nums">{score.toLocaleString()}</span>
                        </div>
                        <div className="w-px h-6 bg-slate-800" />
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest">Combo</span>
                            <span className={`text-sm font-black ${combo > 0 ? 'text-amber-400' : 'text-slate-600'}`}>×{combo}</span>
                        </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${email.difficulty === 'hard' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                        email.difficulty === 'medium' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                            'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                        }`}>{email.difficulty}</span>
                </div>

                {/* ── Progress Bar ── */}
                <div className="shrink-0 w-full h-1 bg-slate-900">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500" style={{ width: `${((currentIndex) / shuffledEmails.length) * 100}%` }} />
                </div>

                {/* ── Main Content: Email Client Layout ── */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Email reading pane — takes up most of the screen */}
                    <div className="flex-1 overflow-y-auto bg-gray-200" style={{ scrollBehavior: 'smooth' }}>
                        <div className="min-h-full flex justify-center py-6 px-6">
                            <div className="w-full max-w-[800px] bg-white rounded-lg overflow-hidden relative" style={{ boxShadow: '0 2px 20px rgba(0,0,0,0.15)' }}>

                                {/* Gmail-style toolbar */}
                                <div className="flex items-center justify-between px-5 py-2.5 bg-gray-50 border-b border-gray-200">
                                    <div className="flex items-center gap-4 text-gray-400">
                                        <span className="cursor-default hover:text-gray-600 text-sm" title="Archive">📥</span>
                                        <span className="cursor-default hover:text-gray-600 text-sm" title="Report spam">⚠️</span>
                                        <span className="cursor-default hover:text-gray-600 text-sm" title="Delete">🗑️</span>
                                        <span className="text-gray-300">|</span>
                                        <span className="cursor-default hover:text-gray-600 text-sm" title="Move to">📁</span>
                                        <span className="cursor-default hover:text-gray-600 text-sm" title="Labels">🏷️</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-400 text-xs">
                                        <span>{currentIndex + 1} of {shuffledEmails.length}</span>
                                        <span className="cursor-default hover:text-gray-600">◀</span>
                                        <span className="cursor-default hover:text-gray-600">▶</span>
                                    </div>
                                </div>

                                {/* Subject */}
                                <div className="px-8 pt-5 pb-2">
                                    <h2 className="text-[22px] font-normal text-gray-900 leading-[1.4]" style={{ fontFamily: "'Google Sans', 'Segoe UI', Roboto, sans-serif" }}>
                                        {email.subject}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-sm font-medium">Inbox</span>
                                        <span className="text-[11px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-sm cursor-default">×</span>
                                    </div>
                                </div>

                                {/* Sender row */}
                                <div className="flex items-start gap-3.5 px-8 py-3">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 mt-1" style={{ backgroundColor: email.brandColor }}>
                                        {email.brand[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline gap-2 flex-wrap">
                                            <span className="text-[14px] font-semibold text-gray-900" style={{ fontFamily: "'Google Sans', 'Segoe UI', sans-serif" }}>{email.from.name}</span>
                                            <span className="text-[12px] text-gray-400">&lt;{email.from.address}&gt;</span>
                                        </div>
                                        <div className="flex items-center gap-1 mt-0.5">
                                            <span className="text-[12px] text-gray-500">to {email.to === 'you@gmail.com' ? 'me' : email.to}</span>
                                            <svg className="w-3 h-3 text-gray-400 cursor-default" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 flex items-center gap-4">
                                        <span className="text-[12px] text-gray-500" style={{ fontFamily: "'Google Sans', sans-serif" }}>{email.date}</span>
                                        <span className="text-gray-400 text-lg cursor-default" title="Star this message">☆</span>
                                        <svg className="w-5 h-5 text-gray-400 cursor-default" title="Reply" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                        <svg className="w-5 h-5 text-gray-400 cursor-default" title="More" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                                    </div>
                                </div>

                                {/* Security info bar (like Gmail shows) */}
                                {!email.isLegit && (
                                    <div className="mx-8 mb-2 px-3 py-1.5 bg-gray-50 rounded text-[11px] text-gray-400 flex items-center gap-2" style={{ fontFamily: "'Google Sans', sans-serif" }}>
                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                        <span>Standard encryption (TLS)</span>
                                    </div>
                                )}
                                {email.isLegit && (
                                    <div className="mx-8 mb-2 px-3 py-1.5 bg-gray-50 rounded text-[11px] text-gray-400 flex items-center gap-2" style={{ fontFamily: "'Google Sans', sans-serif" }}>
                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                        <span>Standard encryption (TLS)</span>
                                    </div>
                                )}

                                {/* Attachment */}
                                {email.hasAttachment && (
                                    <div className="mx-8 mt-2 mb-1 flex items-center gap-3 border border-gray-200 rounded-lg overflow-hidden cursor-default" style={{ height: '56px' }}>
                                        <div className="w-14 h-full flex items-center justify-center shrink-0" style={{ backgroundColor: email.attachmentName.endsWith('.exe') || email.attachmentName.endsWith('.html') ? '#FEE2E2' : '#F3F4F6' }}>
                                            <span className="text-lg">{email.attachmentName.endsWith('.exe') ? '⚙️' : email.attachmentName.endsWith('.html') ? '🌐' : '📄'}</span>
                                        </div>
                                        <div className="flex-1 min-w-0 pr-4">
                                            <span className="text-[13px] text-gray-800 font-medium block truncate" style={{ fontFamily: "'Google Sans', sans-serif" }}>{email.attachmentName}</span>
                                            <span className="text-[11px] text-gray-400">{email.attachmentSize}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Email Body — rendered as a real HTML email template */}
                                <div>
                                    {renderEmailBody(email.body)}
                                </div>

                                {/* Bottom reply bar (like Gmail) */}
                                <div className="mx-8 mb-6 border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-3 cursor-default bg-gray-50">
                                    <span className="text-gray-400 text-sm">↩️</span>
                                    <span className="text-gray-400 text-[14px]" style={{ fontFamily: "'Google Sans', 'Segoe UI', sans-serif" }}>Click here to <b>Reply</b></span>
                                    <div className="ml-auto flex items-center gap-4 text-gray-300">
                                        <span className="text-sm cursor-default">↩️↩️</span>
                                        <span className="text-sm cursor-default">↪️</span>
                                    </div>
                                </div>

                                {/* Feedback overlay */}
                                {feedback && (
                                    <div className={`absolute inset-0 flex items-center justify-center z-30 backdrop-blur-sm transition-all ${feedback === 'correct' ? 'bg-emerald-500/25' : 'bg-red-500/25'}`}>
                                        <div className="text-center p-8 rounded-2xl" style={{ backgroundColor: feedback === 'correct' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }}>
                                            <span className="text-8xl block mb-3">{feedback === 'correct' ? '✅' : '❌'}</span>
                                            <span className={`text-4xl font-black uppercase tracking-wider ${feedback === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {feedback === 'correct' ? 'CORRECT!' : 'WRONG!'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right-side verdict panel */}
                    <div className="shrink-0 w-[280px] bg-slate-950 border-l border-slate-800 flex flex-col items-center justify-center gap-6 p-6">
                        <div className="text-center mb-4">
                            <span className="text-[10px] text-slate-600 uppercase font-black tracking-widest block mb-2">Your Verdict</span>
                            <span className="text-slate-400 text-xs">Is this email real or fake?</span>
                        </div>

                        <button
                            onClick={() => handleAnswer(false)}
                            disabled={!!feedback}
                            className="w-full py-6 bg-red-600/10 border-2 border-red-500/30 rounded-2xl group hover:bg-red-600 hover:border-red-500 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-30 disabled:pointer-events-none"
                        >
                            <span className="text-4xl group-hover:scale-110 transition-transform">🚫</span>
                            <span className="font-black text-red-400 group-hover:text-white uppercase tracking-widest text-sm">Phishing</span>
                            <span className="text-[10px] text-slate-600 group-hover:text-red-200">This email is fake</span>
                        </button>

                        <button
                            onClick={() => handleAnswer(true)}
                            disabled={!!feedback}
                            className="w-full py-6 bg-emerald-600/10 border-2 border-emerald-500/30 rounded-2xl group hover:bg-emerald-600 hover:border-emerald-500 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-30 disabled:pointer-events-none"
                        >
                            <span className="text-4xl group-hover:scale-110 transition-transform">✅</span>
                            <span className="font-black text-emerald-400 group-hover:text-white uppercase tracking-widest text-sm">Legitimate</span>
                            <span className="text-[10px] text-slate-600 group-hover:text-emerald-200">This email is real</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ═══════════════════════ RESULTS ═══════════════════════
    const renderResult = () => {
        const grade = getGrade();
        const correctCount = history.filter(h => h.userCorrect).length;
        const accuracy = history.length > 0 ? Math.round((correctCount / history.length) * 100) : 0;

        return (
            <div className="w-full max-w-5xl px-6 py-8 flex flex-col items-center animate-fade-in overflow-y-auto" style={{ maxHeight: '92vh' }}>
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 mb-4 shadow-lg"
                        style={{ borderColor: grade.color, boxShadow: `0 0 50px ${grade.color}33` }}>
                        <span className="text-5xl font-black" style={{ color: grade.color }}>{grade.grade}</span>
                    </div>
                    <h2 className="text-4xl font-black text-white uppercase tracking-tighter">{grade.label}</h2>
                    <p className="text-slate-500 font-mono text-xs mt-2 uppercase tracking-widest">Drill Complete — Threat Analysis Report</p>
                </div>

                <div className="grid grid-cols-4 gap-4 w-full max-w-2xl mb-10">
                    {[
                        { label: 'Score', value: score.toLocaleString(), color: 'text-cyan-400' },
                        { label: 'Accuracy', value: `${accuracy}%`, color: accuracy >= 70 ? 'text-emerald-400' : 'text-red-400' },
                        { label: 'Time Taken', value: formatTime(elapsed), color: 'text-amber-400' },
                        { label: 'Max Combo', value: `×${maxCombo}`, color: 'text-indigo-400' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-center">
                            <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest block mb-1">{stat.label}</span>
                            <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                        </div>
                    ))}
                </div>

                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 self-start">Email Analysis Breakdown</h3>
                <div className="w-full space-y-3 mb-10">
                    {history.map((item, idx) => (
                        <div
                            key={idx}
                            className={`rounded-xl border overflow-hidden transition-all cursor-pointer ${item.userCorrect
                                ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                                : 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
                                }`}
                            onClick={() => setExpandedResult(expandedResult === idx ? null : idx)}
                        >
                            <div className="flex items-center gap-4 px-5 py-4">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black shrink-0" style={{ backgroundColor: item.brandColor }}>
                                    {item.brand[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-sm font-bold text-white truncate">{item.from.name}</span>
                                        <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded ${item.isLegit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {item.isLegit ? 'LEGIT' : 'PHISH'}
                                        </span>
                                    </div>
                                    <span className="text-xs text-slate-500 truncate block">{item.subject}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`text-sm font-bold ${item.userCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {item.userCorrect ? '✓' : '✗'}
                                    </span>
                                    <span className="text-slate-600 text-xs">{expandedResult === idx ? '▲' : '▼'}</span>
                                </div>
                            </div>

                            {expandedResult === idx && (
                                <div className="border-t border-slate-800 bg-slate-950/50 px-5 py-4 space-y-2">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Key Indicators</span>
                                    {item.clues.map((clue, ci) => (
                                        <div key={ci} className="flex items-start gap-2 text-xs text-slate-400">
                                            <span className={item.isLegit ? 'text-emerald-500' : 'text-red-500'}>→</span>
                                            <span>{clue}</span>
                                        </div>
                                    ))}
                                    <div className="mt-3 text-[10px] text-slate-600 font-mono">
                                        Sender: <span className={`font-bold ${item.isLegit ? 'text-emerald-400' : 'text-red-400'}`}>{item.from.address}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button onClick={resetGame} className="px-12 py-4 bg-gradient-to-r from-white to-slate-200 text-slate-950 font-black uppercase tracking-widest rounded-xl hover:from-cyan-400 hover:to-emerald-400 transition-all shadow-lg text-sm">
                        RETRY DRILL
                    </button>
                    <button onClick={onBack} className="px-8 py-4 border border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all font-bold text-sm">
                        BACK TO LAB
                    </button>
                </div>
            </div>
        );
    };

    // ═══════════════════════ MAIN ═══════════════════════
    return (
        <div className="w-full h-screen flex items-center justify-center">
            {gameState === 'intro' && renderIntro()}
            {gameState === 'playing' && renderPlaying()}
            {gameState === 'result' && (
                <div className="w-full h-full flex items-center justify-center overflow-y-auto">
                    {renderResult()}
                </div>
            )}
        </div>
    );
};

export default SpotThePhish;
