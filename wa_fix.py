import os
import re

path = r"e:\human patch game\src\levels\Level10.jsx"
with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# 1. State updates
state_marker = "  const [addingContact, setAddingContact] = useState(false);"
new_state = """  const [addingContact, setAddingContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [waHistory, setWaHistory] = useState([]);
  const [waUnknownHistory, setWaUnknownHistory] = useState([]);
  const [showUnknownNotif, setShowUnknownNotif] = useState(false);"""
text = text.replace("  const [addingContact, setAddingContact] = useState(false);\n  const [contactName, setContactName] = useState('');", new_state)


# 2. WhatsAppApp component rewrite
wa_start = "  const WhatsAppApp = () => {\n"
wa_end = "    return null;\n  };\n\n  // --- MAIN RENDERS ---"
wa_start_idx = text.find(wa_start)
wa_end_idx = text.find(wa_end) + len(wa_end)

new_wa = """  const WhatsAppApp = () => {
    // Determine which chat to show based on phoneApp override, otherwise default to Priya
    const isUnknown = phoneApp === 'whatsapp_unknown';
    const currentHistory = isUnknown ? waUnknownHistory : waHistory;

    // Helper to auto-scroll to bottom of chat
    const chatEndRef = useRef(null);
    useEffect(() => {
       chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [waHistory, waUnknownHistory, phoneApp]);

    // Setup initial history on state changes if empty
    useEffect(() => {
       if (storyProgress === 6.5 && waHistory.length === 0) {
           setWaHistory([{ type: 'system', text: 'TODAY' }]);
       }
       if (storyProgress === 8 && waHistory.length <= 3) {
           setWaHistory(prev => [
               ...prev,
               { type: 'system', text: 'TODAY' },
               { type: 'priya', text: "Krish... I need ₹45,000 BY 6 PM or I'm out of my house. Please... 😭" }
            ]);
       }
       if (storyProgress === 9 && waHistory.length <= 8) {
           setWaHistory(prev => [
               ...prev,
               { type: 'priya', text: "Krish where are you?? ₹80,000 ASAP!!" }
           ]);
           setTimeout(() => setShowUnknownNotif(true), 1500);
       }
    }, [storyProgress]);

    const addToWA = (msg) => setWaHistory(prev => [...prev, msg]);
    const addToUnknown = (msg) => setWaUnknownHistory(prev => [...prev, msg]);

    const renderChatStream = (history) => (
       <div className="flex-1 p-4 overflow-y-auto z-10 flex flex-col pt-6 pb-20 custom-scrollbar">
          {history.map((msg, idx) => {
             if (msg.type === 'system') return <React.Fragment key={idx}>{renderWARSystemMsg(msg.text)}</React.Fragment>;
             if (msg.type === 'priya') return <React.Fragment key={idx}>{renderWARPriyaMsg(msg.text)}</React.Fragment>;
             if (msg.type === 'unknown') return (
                 <div key={idx} className="p-3 bg-red-100 border border-red-300 rounded-lg text-black text-[10px] my-4 leading-tight font-bold shadow-sm animate-fadeIn">
                    <span className="text-red-700 block mb-1">Unknown Number:</span>
                    {msg.text}
                 </div>
             );
             return <React.Fragment key={idx}>{renderWARPlayerMsg(msg.text)}</React.Fragment>;
          })}
          <div ref={chatEndRef} />
       </div>
    );

    if (isUnknown) {
        return (
          <div className="flex-1 flex flex-col bg-[#ece5dd] relative pb-10">
            <div className="absolute inset-0 bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover opacity-10 pointer-events-none" />
            <WAHeader title="+91 98941 23094" subtitle="online" />
            {renderChatStream(waUnknownHistory)}
            <div className="z-10 pb-4 absolute bottom-0 left-0 right-0 bg-[#f0f0f0]">
              {renderWARChoices([
                { text: "A) Pay ₹1,20,000 immediately.", points: 0, nextScene: 'act3' },
                { text: "B) Send partial amount (₹50,000).", points: 0, nextScene: 'act3' },
                { text: "C) Screenshot, Block, and Dial 1930 / cybercrime.gov.in.", points: 45, impact: () => { }, feedback: "CORRECT: Never pay blackmailers. Report immediately.", nextScene: 'act3' }
              ])}
            </div>
          </div>
        );
    }

    // Default: Priya Chat
    return (
      <div className="flex-1 flex flex-col bg-[#ece5dd] relative pb-10">
        <div className="absolute inset-0 bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover opacity-10 pointer-events-none" />
        <WAHeader title="Priya" subtitle={storyProgress === 6.5 ? "online" : "typing..."} />
        {showUnknownNotif && (
            <div className="absolute top-20 left-4 right-4 bg-zinc-800 text-white p-4 rounded-xl shadow-2xl border border-white/20 z-50 flex items-start gap-4 cursor-pointer hover:bg-zinc-700 transition animate-bounce"
                 onClick={() => {
                     setShowUnknownNotif(false);
                     setPhoneApp('whatsapp_unknown');
                     setWaUnknownHistory([{ type: 'system', text: 'TODAY' }, { type: 'unknown', text: 'Pay ₹1,20,000 NOW or we release your video call screenshots. We know about the ₹42 lakhs.' }]);
                     setTimeout(() => {
                        setWaHistory(prev => [...prev, { type: 'priya', text: "i'm sorry Krish... i had to tell them. just pay and it goes away. 😭" }]);
                     }, 2000);
                 }}>
               <div className="w-10 h-10 bg-[#25d366] rounded-full flex items-center justify-center text-xl">💬</div>
               <div className="flex-1">
                  <p className="font-bold text-xs">Message from +91 98941 23094</p>
                  <p className="text-[10px] opacity-80 mt-1 line-clamp-2">Pay ₹1,20,000 NOW or we release your video call screenshots...</p>
               </div>
            </div>
        )}
        
        {renderChatStream(waHistory)}

        <div className="z-10 pb-4 absolute bottom-0 left-0 right-0 bg-[#f0f0f0]">
          {storyProgress === 6.5 && renderWARChoices([
            { text: "Send: 'Hey, this is Krish from Insta.'", points: 0, impact: () => {
                addToWA({ type: 'player', text: "Hey, this is Krish from Insta." });
                setStoryProgress(6.6);
                setTimeout(() => {
                    addToWA({ type: 'priya', text: "Hiiii! Let's talk!" });
                    setTimeout(() => {
                        setPhoneApp('whatsapp_audio_call');
                        setStoryProgress(7);
                    }, 2000);
                }, 1500);
            }}
          ])}
          
          {storyProgress === 8 && renderWARChoices([
            { text: "A) Send ₹45,000 via UPI immediately.", points: 0, setDay: 16, impact: () => {
                addToWA({ type: 'player', text: "Okay, sending it now." });
                setStoryProgress(9);
            }},
            { text: "B) 'Give me your landlord's number to verify.'", points: 20, setDay: 16, impact: () => {
                addToWA({ type: 'player', text: "Give me your landlord's number to verify." });
                setStoryProgress(9);
            }},
            { text: "C) 'I cannot send money to anyone online.'", points: 25, setDay: 16, impact: () => {
                addToWA({ type: 'player', text: "I cannot send money to anyone online." });
                setStoryProgress(9);
            }}
          ])}
        </div>
      </div>
    );
  };

  // --- MAIN RENDERS ---"""

text = text[:wa_start_idx] + new_wa + text[wa_end_idx:]

with open(path, "w", encoding="utf-8") as f:
    f.write(text)

print(f"Successfully modified JS File!")
