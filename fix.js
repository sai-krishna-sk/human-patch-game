const fs = require('fs');

const path = 'e:\\\\human patch game\\\\src\\\\levels\\\\Level10.jsx';
let content = fs.readFileSync(path, 'utf8');

const startStr = "  const WhatsAppApp = () => {\\n    const renderPlayerMsg = (text) => (";
const endStr = "    return null;\\n  };\\n\\n  // --- MAIN RENDERS ---";

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx === -1) {
    console.log("Could not find start string.");
    process.exit(1);
}

if (endIdx === -1) {
    console.log("Could not find end string.");
    process.exit(1);
}

const replacement = \`  // --- SHARED WHATSAPP HELPERS ---
  const renderWARPlayerMsg = (text) => (
    <div className="flex justify-end mb-4">
      <div className="max-w-[80%] bg-[#dcf8c6] text-black p-3 rounded-2xl rounded-tr-sm text-xs leading-relaxed animate-fadeIn">
        {text}
      </div>
    </div>
  );

  const renderWARPriyaMsg = (text) => (
    <div className="flex justify-start mb-4">
      <div className="max-w-[80%] bg-white text-black p-3 rounded-2xl rounded-tl-sm text-xs leading-relaxed shadow-sm border border-black/5 animate-fadeIn">
        {text}
      </div>
    </div>
  );

  const renderWARSystemMsg = (text) => (
    <div className="text-center text-[9px] text-[#075e54] bg-[#e1f5fe]/80 rounded px-2 py-1 mx-auto my-2 w-fit uppercase font-bold">
      {text}
    </div>
  );

  const renderWARChoices = (opts) => (
    <div className="flex flex-col gap-1 p-4 bg-[#f0f0f0] border-t border-black/10">
      <p className="text-[10px] text-zinc-500 uppercase tracking-widest text-center mb-1">Select Option</p>
      {opts.map((opt, i) => (
        <button key={i} onClick={() => handleChoice(opt)} className="w-full py-2.5 bg-[#075e54] hover:bg-[#128c7e] text-white text-[10px] font-bold rounded-lg border border-black/5 transition-all active:scale-95 leading-tight shadow-sm">
          {opt.text}
        </button>
      ))}
    </div>
  );

  const WAHeader = ({ title, subtitle, isCall }) => (
    <div className="bg-[#075e54] p-4 pt-10 flex items-center gap-3 text-white sticky top-0 z-20 shadow-md">
      <div className="w-10 h-10 rounded-full bg-zinc-300 overflow-hidden flex items-center justify-center">
        <div className="w-full h-full bg-indigo-600 border border-white/20" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-sm leading-tight">{title}</p>
        {subtitle && <p className="text-[10px] opacity-80">{subtitle}</p>}
      </div>
      <div className="flex gap-4 opacity-80">
        {!isCall && <><span>📹</span><span>📞</span><span>⋮</span></>}
      </div>
    </div>
  );

  const HomeScreen = () => (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-zinc-800">
      <div className="absolute inset-0 bg-cover bg-center opacity-40 blur-sm pointer-events-none" style={{ backgroundImage: 'url("/assets/study.png")' }} />
      <div className="grid grid-cols-4 gap-4 p-6 z-10 pt-16">
        <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => setPhoneApp('instagram')}>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white text-2xl shadow-lg">📸</div>
          <span className="text-[10px] text-white drop-shadow-md font-bold">Insta</span>
        </div>
        <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => {
            if (storyProgress >= 7 && savedContact) setPhoneApp('whatsapp');
            else setFeedback("No new messages yet.");
        }}>
          <div className="w-12 h-12 rounded-2xl bg-[#25d366] flex items-center justify-center text-white text-2xl shadow-lg relative">
            💬
            {storyProgress >= 7 && savedContact && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-transparent animate-pulse">1</div>}
          </div>
          <span className="text-[10px] text-white drop-shadow-md font-bold">WhatsApp</span>
        </div>
        <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => setPhoneApp('contacts')}>
          <div className="w-12 h-12 rounded-2xl bg-zinc-700 flex items-center justify-center text-white text-2xl shadow-lg border border-white/10">👤</div>
          <span className="text-[10px] text-white drop-shadow-md font-bold">Contacts</span>
        </div>
      </div>
    </div>
  );

  const ContactsApp = () => {
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState('');

    if (adding) {
      return (
        <div className="flex-1 flex flex-col bg-zinc-50 text-black pt-10">
          <div className="p-4 bg-zinc-100 border-b border-zinc-300 flex items-center justify-between">
            <span className="text-zinc-500 cursor-pointer text-sm" onClick={() => setAdding(false)}>Cancel</span>
            <span className="font-bold text-sm">New Contact</span>
            <span className="text-blue-500 font-bold cursor-pointer text-sm" onClick={() => {
              if (name.trim() !== '') {
                if (name.toLowerCase().includes('priya') && storyProgress === 6) {
                   setSavedContact(true);
                   setPhoneApp('whatsapp_audio_call');
                   setDay(13);
                   setStoryProgress(7);
                } else {
                   setAdding(false);
                }
              }
            }}>Done</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="w-24 h-24 rounded-full bg-zinc-300 mx-auto flex items-center justify-center text-4xl text-white shadow-inner">👤</div>
            <input type="text" placeholder="First Name" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 border-b border-zinc-300 bg-transparent outline-none text-sm placeholder-zinc-400 font-bold" autoFocus />
            <input type="text" placeholder="Phone" defaultValue="+91 94440 12345" className="w-full p-3 border-b border-zinc-300 bg-transparent outline-none text-sm font-mono text-zinc-500" />
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col bg-white text-black pt-10">
        <div className="p-4 flex justify-between items-center border-b border-zinc-200">
          <span className="font-bold text-lg">Contacts</span>
          <span className="text-blue-500 text-2xl cursor-pointer leading-none" onClick={() => setAdding(true)}>+</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-400">👤</div><span className="font-bold text-sm">Amma</span></div>
          <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-400">👤</div><span className="font-bold text-sm">Appa</span></div>
          {savedContact && <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex justify-center items-center font-black">P</div><span className="font-bold text-sm">Priya</span></div>}
          <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-400">👤</div><span className="font-bold text-sm">Rahul (College)</span></div>
        </div>
      </div>
    );
  };

  const WAAudioCall = () => (
    <div className="flex-1 flex flex-col bg-[#075e54] relative text-white pt-10">
      <div className="flex-1 p-4 flex flex-col items-center justify-center relative border-b border-[#25d366]/20">
        <p className="z-10 text-lg text-white/80 mb-8 font-mono">Incoming Voice Call</p>
        <div className="z-10 w-32 h-32 rounded-full bg-zinc-300 mb-6 flex items-center justify-center text-4xl shadow-xl border-4 border-[#25d366]/50 mb-4 overflow-hidden relative">
           <div className="w-full h-full bg-indigo-600 animate-pulse" />
           <div className="absolute font-black text-6xl text-white/50">P</div>
        </div>
        <p className="z-10 text-3xl font-bold mb-2">Priya</p>
        <p className="z-10 text-sm opacity-80 mb-2 font-mono">+91 94440 12345</p>
      </div>
      <div className="h-48 flex justify-around items-center px-8 pb-10 bg-[#075e54]">
        <div onClick={() => {
           setPhoneApp('whatsapp');
           setFeedback("You couldn't decline. The call ended, she texted.");
        }} className="flex flex-col items-center gap-2 cursor-pointer">
          <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-3xl shadow-lg">📞</div>
          <span className="text-white/80 text-sm">Decline</span>
        </div>
        <div onClick={() => setPhoneApp('whatsapp')} className="flex flex-col items-center gap-2 cursor-pointer animate-bounce">
          <div className="w-16 h-16 rounded-full bg-[#25d366] flex items-center justify-center text-3xl shadow-lg">📞</div>
          <span className="text-white/80 text-sm font-bold">Answer</span>
        </div>
      </div>
    </div>
  );

  const WAVideoCall = () => (
    <div className="flex-1 flex flex-col bg-zinc-900 relative pt-10">
      <WAHeader title="Priya" subtitle="WhatsApp Video" isCall={true} />
      <div className="absolute inset-0 top-[72px] bg-zinc-800 animate-pulse opacity-20" />
      <div className="flex-1 p-4 overflow-y-auto text-center flex flex-col items-center justify-center z-10">
        <div className="w-32 h-32 rounded-full border-4 border-[#25d366] border-t-transparent animate-spin mb-4" />
        <div className="w-24 h-24 rounded-full bg-indigo-600 absolute shadow-[0_0_30px_rgba(37,211,102,0.4)]" />
        <p className="font-bold text-white text-lg mt-8 drop-shadow-md">Incoming Video Call: Priya</p>
        <p className="text-[#25d366] text-sm mt-2 font-mono">Connecting...</p>
      </div>
      <div className="z-10 bg-black/60 backdrop-blur-md pb-8 pt-4">
        <div className="flex justify-around items-center px-12 mb-4">
          <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => handleChoice({ text: "C) Decline: 'Let's meet for coffee first.'", points: 25, nextStep: 8, setDay: 15, setApp: 'whatsapp' })}>
              <div className="w-14 h-14 rounded-full bg-red-500 flex items-center justify-center text-xl shadow-lg">📞</div>
              <span className="text-white/80 text-xs text-center leading-tight mt-1">Decline<br/>Point +25</span>
          </div>
          
          <div className="flex flex-col items-center gap-2 cursor-pointer animate-bounce" onClick={() => handleChoice({ text: "A) Accept Video Call (Identity recorded).", points: 0, nextStep: 8, setDay: 15, setApp: 'whatsapp' })}>
              <div className="w-14 h-14 rounded-full bg-[#25d366] flex items-center justify-center text-xl shadow-lg">📹</div>
              <span className="text-[#25d366] font-bold text-xs text-center leading-tight mt-1">Accept<br/>(Danger!)</span>
          </div>
        </div>
        <div className="flex justify-center border-t border-white/10 pt-3 mt-2">
              <button onClick={() => handleChoice({ text: "B) Suggest Google Meet for safety.", points: 20, nextStep: 8, setDay: 15, setApp: 'whatsapp' })} className="text-[10px] text-white/60 uppercase tracking-widest hover:text-white transition-colors">Suggest Google Meet Instead (+20)</button>
        </div>
      </div>
    </div>
  );

  const WhatsAppApp = () => {
    if (storyProgress === 7) {
      return (
        <div className="flex-1 flex flex-col bg-[#ece5dd]">
          <WAHeader title="Priya" subtitle="Voice Call 00:47" isCall={true} />
          <div className="flex-1 p-4 overflow-y-auto text-center flex flex-col items-center justify-center relative pb-10">
            <div className="absolute inset-0 bg-[#075e54]/5 z-0" />
            <div className="z-10 w-24 h-24 rounded-full bg-[#128c7e] mb-6 animate-pulse flex items-center justify-center text-4xl shadow-xl border-4 border-[#25d366]/50">📞</div>
            <p className="z-10 text-xl font-bold text-zinc-800 mb-2">Priya</p>
            <p className="z-10 text-sm text-zinc-600 mb-8 font-mono">00:47</p>
            <div className="z-10 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm max-w-[80%]">
              <p className="text-sm text-black italic">"Hiii! You sound exactly like I imagined! Did your grandfather leave anything for you? I hope you're taken care of."</p>
            </div>
          </div>
          <div className="pb-10">
          {renderWARChoices([
             { text: "A) Change subject: 'I'd rather not talk finances.'", points: 20, nextStep: 8, setDay: 14, setApp: 'whatsapp_video_call' },
             { text: "B) 'A little. Enough to be okay.'", points: 10, nextStep: 8, setDay: 14, setApp: 'whatsapp_video_call' },
             { text: "C) Tell her about the ₹42 lakh specifically.", points: 0, nextStep: 8, setDay: 14, setApp: 'whatsapp_video_call' }
          ])}
          </div>
        </div>
      );
    }

    if (storyProgress === 8) {
      return (
        <div className="flex-1 flex flex-col bg-[#ece5dd] relative pb-10">
          <div className="absolute inset-0 bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover opacity-10 pointer-events-none" />
          <WAHeader title="Priya" subtitle="online" />
          <div className="flex-1 p-4 overflow-y-auto scroll-smooth z-10">
            {renderWARSystemMsg("TODAY")}
            {renderWARPriyaMsg("Krish... I need ₹45,000 BY 6 PM or I'm out of my house. Please... 😭")}
          </div>
          <div className="z-10 pb-4">
            {renderWARChoices([
              { text: "A) Send ₹45,000 via UPI immediately.", points: 0, nextStep: 9, setDay: 16 },
              { text: "B) 'Give me your landlord's number to verify.'", points: 20, nextStep: 9, setDay: 16 },
              { text: "C) 'I cannot send money to anyone online.'", points: 25, nextStep: 9, setDay: 16 }
            ])}
          </div>
        </div>
      );
    }

    if (storyProgress === 9) {
      return (
        <div className="flex-1 flex flex-col bg-[#ece5dd] relative pb-10">
          <div className="absolute inset-0 bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover opacity-10 pointer-events-none" />
          <WAHeader title="Priya" subtitle="typing..." />
          <div className="flex-1 p-4 overflow-y-auto z-10">
            {renderWARSystemMsg("TODAY")}
            {renderWARPriyaMsg("Krish where are you?? ₹80,000 ASAP!!")}
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-black text-[10px] my-4 leading-tight font-bold shadow-sm">
              <span className="text-red-700 block mb-1">Unknown Number:</span>
              "Pay ₹1,20,000 NOW or we release your video call screenshots. We know about the ₹42 lakhs."
            </div>
            {renderWARPriyaMsg("i'm sorry Krish... i had to tell them. just pay and it goes away. 😭")}
          </div>
          <div className="z-10 pb-4">
            {renderWARChoices([
              { text: "A) Pay ₹1,20,000 immediately.", points: 0, nextScene: 'act3' },
              { text: "B) Send partial amount (₹50,000).", points: 0, nextScene: 'act3' },
              { text: "C) Screenshot, Block, and Dial 1930 / cybercrime.gov.in.", points: 45, impact: () => { }, feedback: "CORRECT: Never pay blackmailers. Report immediately.", nextScene: 'act3' }
            ])}
          </div>
        </div>
      );
    }

    return null;
  };

  // --- MAIN RENDERS ---`;

const newContent = content.substring(0, startIdx) + replacement + content.substring(endIdx + endStr.length);
fs.writeFileSync(path, newContent);
console.log("Successfully fixed Level10.jsx!");
