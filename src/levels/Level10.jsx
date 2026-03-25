import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useGameState } from '../context/GameStateContext';
import Player from '../components/Player';
import InteractionPrompt from '../components/InteractionPrompt';

const ROOM_WIDTH = 1200;
const ROOM_HEIGHT = 800;
const SPEED = 8;
const PLAYER_SIZE = 44;

const HintManager = ({ gameState, phoneApp, day, storyProgress, profileChecked }) => {
  const [hintText, setHintText] = useState(null);

  useEffect(() => {
    if (gameState === 'phone') {
      if (phoneApp === 'instagram' && day === 1 && storyProgress === 0) {
        const timer = setTimeout(() => {
          setHintText("Someone is saying they are lonely... I should check it out");
        }, 1000);
        return () => { clearTimeout(timer); setHintText(null); };
      } else if (phoneApp === 'insta_profile' && day === 1 && storyProgress === 0 && !profileChecked) {
        let timer2;
        const timer1 = setTimeout(() => {
          setHintText("I should check out the account");
          timer2 = setTimeout(() => {
            setHintText("I should message her");
          }, 5000);
        }, 1000);
        return () => { clearTimeout(timer1); clearTimeout(timer2); setHintText(null); };
      } else {
        setHintText(null);
      }
    } else {
      setHintText(null);
    }
  }, [gameState, phoneApp, day, storyProgress, profileChecked]);

  if (!hintText) return null;
  return <InteractionPrompt text={hintText} showKey={false} />;
};

const AuditItem = ({ audit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div className={`bg-white rounded-2xl border ${audit.isCorrect ? 'border-emerald-100 shadow-[0_2px_10px_rgba(16,185,129,0.05)]' : 'border-red-100 shadow-[0_2px_10px_rgba(239,68,68,0.05)]'} overflow-hidden transition-all duration-300`}>
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full p-5 flex justify-between items-center text-left transition-colors ${audit.isCorrect ? 'hover:bg-emerald-50/50' : 'hover:bg-red-50/50'}`}
      >
        <div className="flex items-center gap-4">
          <div className={`w-3 h-3 rounded-full ${audit.isCorrect ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
          <h4 className={`font-bold text-sm ${audit.isCorrect ? 'text-emerald-900' : 'text-red-900'} pr-4`}>{audit.title}</h4>
        </div>
        <span className={`text-xl transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          {isExpanded ? '−' : '+'}
        </span>
      </button>
      {isExpanded && (
        <div className={`px-12 pb-6 pt-2 animate-fadeIn text-xs leading-relaxed font-medium ${audit.isCorrect ? 'text-emerald-700' : 'text-red-700'}`}>
          <p className="bg-slate-50/50 p-4 rounded-xl border border-current/10 whitespace-pre-wrap">
            {audit.isCorrect ? audit.correctDetail : audit.wrongDetail}
          </p>
        </div>
      )}
    </div>
  );
};

const Level10 = () => {
  const { assets, completeLevel, adjustAssets, adjustSafetyScore } = useGameState();

  // CORE STATE
  const [gameState, setGameState] = useState('waking_up'); // intro, exploration, phone, results, awareness, act3, profile_view, waking_up
  const [day, setDay] = useState(1);
  const [points, setPoints] = useState(0);
  const [playerPos, setPlayerPos] = useState({ x: 500, y: 550 });
  const keysRef = useRef({});

  // PHONE STATE
  const [phoneApp, setPhoneApp] = useState('home');
  const [savedContact, setSavedContact] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [transitionMsg, setTransitionMsg] = useState(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [addingContact, setAddingContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [waHistory, setWaHistory] = useState([]);
  const [waUnknownHistory, setWaUnknownHistory] = useState([]);
  const [showUnknownNotif, setShowUnknownNotif] = useState(false);
  const [blackmailProgress, setBlackmailProgress] = useState(0);
  const [notiReceived, setNotiReceived] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionText, setTransitionText] = useState("");
  const [isPostTransition, setIsPostTransition] = useState(false);
  const [decisions, setDecisions] = useState([]);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [likedPosts, setLikedPosts] = useState([]);
  const [bgCycleIndex, setBgCycleIndex] = useState(-1);
  const footstepAudio = useRef(null);
  const transitionBgs = ['/assets/bed.png', '/assets/home_office.jpeg', '/assets/morning_bed.png', '/assets/temppho.png'];

  const getBackground = () => {
    if (bgCycleIndex >= 0) return transitionBgs[bgCycleIndex];
    if (day === 1) {
      if (gameState === 'room_walk' || gameState === 'room_walk_freshened' || gameState === 'exploration') {
          return '/assets/morning_bedplain.png';
      }
      return '/assets/morning_bed.png';
    }
    if (day >= 2 && day <= 7) return '/assets/bedplain.png';
    if (day >= 8 && day <= 13) return '/assets/garden_night.png';
    if (day === 14) return '/assets/morning_bed.png';
    if (day === 15) return '/assets/office_inside.png';
    if (day >= 16) return '/assets/study.png';
    return '/assets/study.png';
  };

  const toggleLike = (postId) => {
    setLikedPosts(prev => 
      prev.includes(postId) ? prev.filter(id => id !== postId) : [...prev, postId]
    );
  };

  // ROOM WALK STATE & AUDIO
  const [roomPlayerPos, setRoomPlayerPos] = useState({ x: 800, y: 450 });
  const [roomInteractionTarget, setRoomInteractionTarget] = useState(null);

  const audioCtxRef = useRef(null);
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  };

  const playSynthSound = (type) => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    if (type === 'noti_buzz') {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.frequency.setValueAtTime(880, ctx.currentTime);
      osc2.frequency.setValueAtTime(1320, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.5);
      osc2.stop(ctx.currentTime + 0.5);
    } else if (type === 'noti_vibration') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      mod.type = 'square';
      mod.frequency.setValueAtTime(10, ctx.currentTime);
      modGain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.25);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      mod.connect(modGain);
      modGain.connect(osc.frequency);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      mod.start();
      osc.stop(ctx.currentTime + 0.45);
      mod.stop(ctx.currentTime + 0.45);
    }
  };

  // CHAT SEQUENCER STATE
  const [dmHistory, setDmHistory] = useState([{ type: 'system', text: "Day 1" }]);
  const [pendingSequence, setPendingSequence] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [choicesLocked, setChoicesLocked] = useState(false);
  const dmEndRef = useRef(null);

  // Scroll to bottom of DMs
  useEffect(() => {
    if (dmEndRef.current) {
      dmEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [dmHistory, isTyping]);

  // FLAGS (Narrative Choices)
  const [profileChecked, setProfileChecked] = useState(false);
  const [firstMsgType, setFirstMsgType] = useState(null);
  const [convoDay1Done, setConvoDay1Done] = useState(false);
  const [profileBonusFound, setProfileBonusFound] = useState(false);

  // KEYBOARD INPUT
  useEffect(() => {
    const dk = (e) => { keysRef.current[e.key.toLowerCase()] = true; };
    const uk = (e) => { keysRef.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', dk);
    window.addEventListener('keyup', uk);
    return () => { window.removeEventListener('keydown', dk); window.removeEventListener('keyup', uk); };
  }, []);

  // Walking Audio Initialization
  useEffect(() => {
    footstepAudio.current = new Audio('/audio/foot.m4a');
    if (footstepAudio.current) {
      footstepAudio.current.loop = true;
      footstepAudio.current.volume = 0.4;
    }
    return () => {
      if (footstepAudio.current) {
        footstepAudio.current.pause();
        footstepAudio.current = null;
      }
    };
  }, []);

  // Walking Audio Monitor
  useEffect(() => {
    const isMovingState = gameState === 'exploration' || gameState === 'room_walk' || gameState === 'room_walk_freshened';
    if (!isMovingState) {
      if (footstepAudio.current) footstepAudio.current.pause();
      return;
    }

    let frameId;
    const checkMovement = () => {
      const keys = keysRef.current;
      const isMoving = keys['w'] || keys['s'] || keys['a'] || keys['d'] || 
                       keys['arrowup'] || keys['arrowdown'] || keys['arrowleft'] || keys['arrowright'];
      
      if (isMoving) {
        if (footstepAudio.current && footstepAudio.current.paused) {
          footstepAudio.current.play().catch(() => {});
        }
      } else {
        if (footstepAudio.current && !footstepAudio.current.paused) {
          footstepAudio.current.pause();
        }
      }
      frameId = requestAnimationFrame(checkMovement);
    };

    frameId = requestAnimationFrame(checkMovement);
    return () => {
      cancelAnimationFrame(frameId);
      if (footstepAudio.current) footstepAudio.current.pause();
    };
  }, [gameState]);

  // Cinematic transition helper
  const triggerSceneTransition = (newStateUpdate, text = "") => {
    setIsTransitioning(true);
    setTransitionText(text);
    setTimeout(() => {
      newStateUpdate();
      setTimeout(() => {
        setIsTransitioning(false);
      }, 400);
    }, 600);
  };

  // E KEY TO TOGGLE PHONE
  useEffect(() => {
    const handleKey = (e) => {
      // Don't toggle the phone if the user is typing in the Contacts app
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

      if (e.key.toLowerCase() === 'e') {
        if (gameState === 'waking_up') {
          setGameState('phone');
          setPhoneApp('instagram');
        } else if (gameState === 'exploration') {
          setGameState('phone');
        } else if (gameState === 'phone') {
          if (storyProgress === 0.5) {
            triggerSceneTransition(() => {
              setGameState('room_walk');
              setRoomPlayerPos({ x: 800, y: 400 });
            });
          }
        } else if (gameState === 'room_walk' && roomInteractionTarget === 'bathroom') {
          triggerSceneTransition(() => {
            setGameState('room_walk_freshened');
          }, "freshening up...");
        } else if (gameState === 'room_walk_freshened' && roomInteractionTarget === 'bed') {
          setGameState('phone');
          setPhoneApp('dm');
          setStoryProgress(1);
          
          const responseText = firstMsgType === 'A' ? "hey… that’s actually really sweet of u 🥺 most ppl just ignore… i’m okay i guess" :
                            firstMsgType === 'B' ? "omg really? 🥺 i thought i was the only one… yeah let’s talk" :
                            "oh no… i’m really sorry 😔 that must be so hard… i’m here if u wanna talk";
          
          setPendingSequence(prev => [
            ...prev, 
            { type: 'priya', text: responseText, app: 'dm' },
            { type: 'priya', text: "honestly today felt so empty. like scrolling all day but still feeling nothing. do u ever feel like that?", app: 'dm' }
          ]);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, storyProgress, roomInteractionTarget, firstMsgType]);

  // MOVEMENT LOOP
  useEffect(() => {
    if (gameState !== 'exploration') return;
    let frameId;
    const loop = () => {
      setPlayerPos(p => {
        let nx = p.x, ny = p.y;
        const keys = keysRef.current;
        if (keys['w'] || keys['arrowup']) ny -= SPEED;
        if (keys['s'] || keys['arrowdown']) ny += SPEED;
        if (keys['a'] || keys['arrowleft']) nx -= SPEED;
        if (keys['d'] || keys['arrowright']) nx += SPEED;
        nx = Math.max(0, Math.min(nx, ROOM_WIDTH - PLAYER_SIZE));
        ny = Math.max(300, Math.min(ny, ROOM_HEIGHT - PLAYER_SIZE));
        return { x: nx, y: ny };
      });
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [gameState]);

  // ROOM WALK MOVEMENT LOOP
  useEffect(() => {
    if (gameState !== 'room_walk' && gameState !== 'room_walk_freshened') return;
    let frameId;
    const loop = () => {
      setRoomPlayerPos(p => {
        let nx = p.x, ny = p.y;
        const keys = keysRef.current;
        if (keys['w'] || keys['arrowup']) ny -= SPEED;
        if (keys['s'] || keys['arrowdown']) ny += SPEED;
        if (keys['a'] || keys['arrowleft']) nx -= SPEED;
        if (keys['d'] || keys['arrowright']) nx += SPEED;
        
        // Approximate boundaries for Level 5 bedroom
        nx = Math.max(250, Math.min(nx, 1300));
        ny = Math.max(300, Math.min(ny, 650));

        let target = null;
        if (nx < 350) target = 'bathroom';
        if (nx > 500 && ny > 300) target = 'bed';
        setRoomInteractionTarget(target);

        return { x: nx, y: ny };
      });
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [gameState]);

  // FRESHENED NOTIFICATION
  useEffect(() => {
    if (gameState === 'room_walk_freshened') {
      const timer = setTimeout(() => {
        playSynthSound('noti_buzz');
        playSynthSound('noti_vibration');
        setNotiReceived(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [gameState]);
  // CHAT SEQUENCER LOGIC
  useEffect(() => {
    if (pendingSequence.length > 0) {
      setChoicesLocked(true);
      const nextMsg = pendingSequence[0];
      let timer;
      if (nextMsg.type === 'priya') {
        setIsTyping(true);
        const delay = Math.max(1500, Math.min(nextMsg.text.length * 40, 4000));
        timer = setTimeout(() => {
          setIsTyping(false);
          if (nextMsg.app === 'wa') setWaHistory(prev => [...prev, nextMsg]);
          else setDmHistory(prev => [...prev, nextMsg]);
          setPendingSequence(prev => prev.slice(1));
        }, delay);
      } else if (nextMsg.type === 'transition') {
        setTransitionText(nextMsg.text);
        setIsTransitioning(true);
        timer = setTimeout(() => {
          setIsTransitioning(false);
          setIsPostTransition(true);
          
          // Look ahead to see if there's a message that should appear instantly after transition
          const nextInitialMsg = pendingSequence[1];
          
          if (nextMsg.app === 'wa') {
            const newHist = [{ type: 'system', text: nextMsg.text }];
            if (nextInitialMsg) newHist.push(nextInitialMsg);
            setWaHistory(newHist);
          } else {
            const newHist = [{ type: 'system', text: nextMsg.text }];
            if (nextInitialMsg) newHist.push(nextInitialMsg);
            setDmHistory(newHist);
          }
          
          if (nextMsg.text.includes("5 DAYS LATER") || bgCycleIndex >= 0) {
            setBgCycleIndex(prev => (prev + 1) % transitionBgs.length);
          }
          
          setPendingSequence(prev => prev.slice(nextInitialMsg ? 2 : 1));
        }, 3000);
      } else if (nextMsg.type === 'system') {
        timer = setTimeout(() => {
          if (nextMsg.app === 'wa') setWaHistory(prev => [...prev, nextMsg]);
          else setDmHistory(prev => [...prev, nextMsg]);
          setPendingSequence(prev => prev.slice(1));
        }, 800);
      } else {
        // player
        setIsTyping(false);
        timer = setTimeout(() => {
          if (nextMsg.app === 'wa') setWaHistory(prev => [...prev, nextMsg]);
          else setDmHistory(prev => [...prev, nextMsg]);
          setPendingSequence(prev => prev.slice(1));
        }, 500);
      }
      return () => { clearTimeout(timer); setIsTyping(false); };
    } else {
      setChoicesLocked(false);
    }
  }, [pendingSequence]);

  const handleChoice = (option) => {
    if (option.impact) option.impact();
    setPoints(prev => prev + (option.points || 0));

    // Log decision for the report audit
    if (option.text && !['Continue', 'Open WhatsApp', 'Go To Home Screen'].includes(option.text)) {
      setDecisions(prev => [...prev, {
        label: option.chatText || option.text,
        points: option.points || 0,
        isCorrect: (option.points || 0) > 0 || (option.text.includes("Block") && !option.text.includes("Contacts")),
        category: phoneApp.includes('whatsapp') ? 'WhatsApp' : 'Instagram'
      }]);
    }

    if (option.feedback) {
      setFeedback(option.feedback);
      setTimeout(() => setFeedback(null), 3500);
    }

    if (option.text && option.text !== "Continue" && option.text !== "Open WhatsApp" && option.text !== "Go To Home Screen" && !option.noBubble) {
      // Strip A) B) C) prefixes for the chat bubble
      const rawText = option.chatText || option.text;
      const cleanText = rawText.replace(/^[A-C]\)\s*['"]?/, '').replace(/['"]?$/, '');
      const playerMsg = { type: 'player', text: cleanText, app: (phoneApp.includes('whatsapp') ? 'wa' : 'dm') };
      if (playerMsg.app === 'wa') setWaHistory(prev => [...prev, playerMsg]);
      else setDmHistory(prev => [...prev, playerMsg]);
    }

    if (option.priyaResponse) {
      setPendingSequence(prev => [...prev, { type: 'priya', text: option.priyaResponse, app: (phoneApp.includes('whatsapp') ? 'wa' : 'dm') }]);
    }

    if (option.transition) {
      setPendingSequence(prev => [...prev, { type: 'transition', text: option.transition, app: (phoneApp.includes('whatsapp') ? 'wa' : 'dm') }]);
    }

    if (option.nextMessages) {
      setPendingSequence(prev => [...prev, ...option.nextMessages.map(m => ({ ...m, app: (phoneApp.includes('whatsapp') ? 'wa' : 'dm') }))]);
    }

    if (option.nextStep !== undefined) setStoryProgress(option.nextStep);
    if (option.setDay !== undefined) setDay(option.setDay);
    if (option.nextScene) setGameState(option.nextScene);
    if (option.switchToWA) setPhoneApp('whatsapp');
  };

  // --- COMPONENTS ---

  const InstagramApp = () => {
    const posts = [
      { id: 'feed_1', user: 'celebrity_quotes', img: '/assets/celebrity_girl.png', text: '“The sun will rise again. Believe in yourself.” ✨', comments: ['Stay strong!', 'Needed this today.'] },
      { id: 'feed_2', user: 'foodie_chennai', img: '/assets/market_bg.png', text: 'Best Biryani in Anna Nagar! 🍛', comments: ['Price?', 'Address please!'] },
      { id: 'feed_3', user: 'digital_safety', img: '/assets/phone_noti.png', text: 'Never share your OTP with anyone. Stay safe!', comments: ['Thanks for the tip.', 'Important!'] },
    ];

    return (
      <div className="flex-1 flex flex-col bg-zinc-950 overflow-y-auto custom-scrollbar pt-8">
        <div className="p-4 border-b border-white/10 flex justify-between items-center sticky top-0 bg-zinc-950 z-20">
          <span className="font-serif italic text-xl font-bold">Instagram</span>
          <div className="flex gap-4">
            <span onClick={() => { if (day > 1 || convoDay1Done) setPhoneApp('dm'); }} className="cursor-pointer relative">
              ✉️ {(convoDay1Done || day > 1) && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-8 pb-20">
          {posts.map((post, i) => (
            <div key={i} className="flex flex-col border-b border-white/5 pb-4">
              <div className="flex items-center gap-2 p-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden">
                  <img src={post.user === 'celebrity_quotes' ? '/assets/celebrity_girl.png' : '/assets/priya_real.png'} className="w-full h-full object-cover" alt="avatar" />
                </div>
                <span className="text-xs font-bold">{post.user}</span>
              </div>
              <div className="aspect-square bg-zinc-900 overflow-hidden">
                <img src={post.img} className="w-full h-full object-cover" alt="post" />
              </div>
              <div className="p-3">
                <div className="flex gap-4 mb-2 text-xl">
                  <span 
                    onClick={() => toggleLike(post.id)} 
                    className={`cursor-pointer transition-transform active:scale-125 ${likedPosts.includes(post.id) ? 'text-red-500' : 'text-white/40'}`}
                  >
                    {likedPosts.includes(post.id) ? '❤️' : '🤍'}
                  </span> 
                  <span>💬</span> 
                  <span>🚀</span>
                </div>
                <div className="text-xs mb-1"><span className="font-bold">{post.user}</span> {post.text}</div>
                {(day === 1 || storyProgress === 0) && i === 0 && (
                  <div className="bg-indigo-500/20 p-2 mt-2 rounded border border-indigo-500/30 animate-pulse cursor-pointer"
                    onClick={() => setPhoneApp('insta_profile')}>
                    <p className="text-[11px]"><span className="font-bold underline">_priya.sunshine_:</span> dm for frndz chat... im so loneoly 😔 just need smone to tlk to...</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const InstaProfileApp = ({
    profileBonusFound, setProfileBonusFound, setPoints, setFeedback, 
    setProfileChecked, setPhoneApp, day, storyProgress, likedPosts, toggleLike
  }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [selectedPostId, setSelectedPostId] = useState(null);
    const scrollContainerRef = useRef(null);

    // Auto-scroll to selected post when feed view opens
    useEffect(() => {
      if (selectedPostId !== null && scrollContainerRef.current) {
        const postElement = document.getElementById(`full-post-${selectedPostId}`);
        if (postElement) {
          const headerOffset = 60; // approximate height of sticky header
          scrollContainerRef.current.scrollTop = postElement.offsetTop - headerOffset;
        }
      }
    }, [selectedPostId]);

    const handleCheckAbout = () => {
      if (!profileBonusFound) {
        setProfileBonusFound(true);
        setPoints(prev => prev + 15);
        setFeedback("Hidden Clue Found: This account is a fake! (+15 pts)");
      }
    };

    if (selectedPostId !== null) {
      return (
        <div className="flex-1 flex flex-col bg-zinc-950 overflow-y-auto custom-scrollbar text-white relative" ref={scrollContainerRef}>
          <div className="p-4 border-b border-white/10 flex items-center sticky top-0 bg-zinc-950 z-20 shadow-md">
            <span className="text-xl cursor-pointer mr-4" onClick={() => setSelectedPostId(null)}>←</span> 
            <span className="font-bold text-lg">Posts</span>
          </div>
          <div className="flex flex-col pb-10">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((num) => (
              <div key={num} id={`full-post-${num}`} className="flex flex-col border-b border-white/5 pb-4 pt-2">
                <div className="flex items-center gap-2 p-3">
                  <div className="w-8 h-8 rounded-full border border-indigo-500 overflow-hidden bg-zinc-800 shrink-0">
                    <img src="/assets/priya_real.png" className="w-full h-full object-cover" alt="Profile" />
                  </div>
                  <span className="font-bold text-sm">_priya.sunshine_</span>
                </div>
                <div className="aspect-square bg-zinc-900 overflow-hidden">
                  <img src={`/assets/${num}.png`} className="w-full h-full object-cover" alt={`Post ${num}`} />
                </div>
                <div className="p-3">
                  <div className="flex gap-4 mb-2 text-xl">
                    <span 
                      onClick={() => toggleLike(`profile_${num}`)} 
                      className={`cursor-pointer transition-transform active:scale-125 ${likedPosts.includes(`profile_${num}`) ? 'text-red-500' : 'text-white/40'}`}
                    >
                      {likedPosts.includes(`profile_${num}`) ? '❤️' : '🤍'}
                    </span>
                    <span>💬</span> 
                    <span>🚀</span>
                  </div>
                  <div className="text-xs mb-1">
                    <span className="font-bold">_priya.sunshine_</span> {num === 1 ? "Lost in the colors of the sky 🎀✨" : "random dumps ✨"}
                  </div>
                  <div className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">{14 - num} DAYS AGO</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col bg-zinc-950 overflow-y-auto custom-scrollbar pt-8 text-white relative">
        <div className="p-4 border-b border-white/10 flex justify-between items-center sticky top-0 bg-zinc-950 z-20">
          <span className="font-bold text-lg flex items-center gap-2">
            <span>@_priya.sunshine_</span>
          </span>
          <span className="text-xl cursor-pointer p-2" onClick={() => { setShowMenu(true); if (!profileBonusFound) handleCheckAbout(); }}>⋮</span>
        </div>

        {/* Profile Header */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="w-20 h-20 rounded-full border border-indigo-500 overflow-hidden bg-zinc-800 shrink-0">
              <img src="/assets/priya_real.png" className="w-full h-full object-cover" alt="Profile" />
            </div>
            <div className="flex gap-4 text-center">
              <div><div className="font-bold text-lg">13</div><div className="text-[10px] text-zinc-400">Posts</div></div>
              <div><div className="font-bold text-lg">{isFollowing ? "1,241" : "1,240"}</div><div className="text-[10px] text-zinc-400">Followers</div></div>
              <div><div className="font-bold text-lg">4,521</div><div className="text-[10px] text-zinc-400">Following</div></div>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="font-bold text-sm">Priya</h2>
            <p className="text-xs text-zinc-400 mb-1">Anime Vibes | Cozy corner 🍵 | Dreaming of magic ✨</p>
            <p className="text-[10px] italic pr-4">"Lost in the colors of the sky. Let's be friends? 🎀"</p>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 bg-indigo-600 font-bold py-1.5 rounded-lg text-sm transition-colors active:bg-indigo-700 leading-none" onClick={() => { setProfileChecked(true); setPhoneApp('dm'); }}>Message</button>
            <button className={`flex-1 font-bold py-1.5 rounded-lg text-sm transition-colors leading-none ${isFollowing ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-black hover:bg-zinc-300'}`} onClick={() => setIsFollowing(!isFollowing)}>{isFollowing ? "Following" : "Follow"}</button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-[2px] mt-2 pb-12 px-[1px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(num => (
            <div key={num} onClick={() => setSelectedPostId(num)} className="aspect-square bg-zinc-800 overflow-hidden relative border border-zinc-900/30 cursor-pointer">
              <img src={`/assets/${num}.png`} className="w-full h-full object-cover" alt={`Post ${num}`} />
            </div>
          ))}
        </div>

        {/* 3-Dot Menu Modal */}
        {showMenu && (
          <div className="absolute inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMenu(false)} />
            <div className="w-full bg-zinc-900 rounded-t-2xl p-4 relative z-10 animate-fadeIn min-h-[50%] flex flex-col justify-end shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
              <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-6 opacity-30" />
              
              <div className="w-full text-left p-4 bg-zinc-800/50 border border-white/5 rounded-xl flex flex-col gap-1 mb-4">
                <div className="flex items-center gap-3 text-zinc-400 mb-1">
                  <span className="text-lg">ℹ️</span>
                  <span className="font-bold text-[10px] uppercase tracking-widest text-zinc-500">Account Information</span>
                </div>
                <div className="text-xs text-zinc-300 pl-8 leading-relaxed">
                  <p>Date joined: May 2024</p>
                  <p>Former usernames: <span className="text-indigo-400 font-bold">3</span></p>
                </div>
              </div>

              <button className="w-full text-left p-4 hover:bg-zinc-800/80 rounded-xl text-red-500 font-bold mb-2 text-sm flex items-center gap-4 transition-colors">
                <span className="text-xl opacity-70">🚩</span> Report
              </button>
              <button className="w-full text-left p-4 hover:bg-zinc-800/80 rounded-xl text-red-500 font-bold mb-6 text-sm flex items-center gap-4 transition-colors" onClick={() => setShowMenu(false)}>
                <span className="text-xl opacity-70">🚫</span> Block
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const DMApp = () => {
    // Removed auto-trigger Step 1 response logic from here as it's now handled in the 'E' key transition
    // for more reliable single-execution.


    const renderMessage = (msg, index, isLast) => {
      const anim = isLast ? 'animate-fadeIn' : '';
      if (msg.type === 'player') {
        return (
          <div key={index} className="flex justify-end mb-4">
            <div className={`max-w-[80%] bg-indigo-600 p-3 rounded-2xl rounded-tr-sm text-xs leading-relaxed ${anim}`}>
              {msg.text}
            </div>
          </div>
        );
      } else if (msg.type === 'priya') {
        return (
          <div key={index} className="flex justify-start mb-4">
            <div className={`max-w-[80%] bg-zinc-800 p-3 rounded-2xl rounded-tl-sm text-xs leading-relaxed ${anim}`}>
              {msg.text}
            </div>
          </div>
        );
      } else {
        return (
          <div key={index} className="text-center text-[9px] text-zinc-600 uppercase py-2">
            {msg.text}
          </div>
        );
      }
    };

    const renderChoices = (opts) => (
      <div className="flex flex-col gap-1 p-4 pb-12 bg-zinc-900 border-t border-white/10 shrink-0">
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest text-center mb-1">Select Option</p>
        {opts.map((opt, i) => (
          <button key={i} onClick={() => handleChoice(opt)} disabled={choicesLocked} className={`w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold rounded-lg border border-white/5 transition-all active:scale-95 leading-tight ${choicesLocked ? 'opacity-50 grayscale' : ''}`}>
            {opt.text}
          </button>
        ))}
      </div>
    );

    const getChoices = () => {
      if (storyProgress === 0) {
        return [
          { text: "A) 'Hey, saw your comment. Hope you're okay. Just saying hi.'", impact: () => setFirstMsgType('A'), nextStep: 0.5 },
          { text: "B) 'Hey! I also feel lonely sometimes. Wanna talk?'", impact: () => setFirstMsgType('B'), nextStep: 0.5 },
          { text: "C) 'Hi, my grandfather just passed away and I'm really struggling. Wanna talk?'", impact: () => setFirstMsgType('C'), nextStep: 0.5 }
        ];
      }
      if (storyProgress === 1) {
        return [
          { text: "A) Yeah… all the time actually", priyaResponse: "same 😭 it just doesn’t go away sometimes", nextMessages: [{ type: 'priya', text: "hey... i've been thinking. life is kinda messy rn. my family is always on my case 😔" }], nextStep: 2 },
          { text: "B) Sometimes… depends on the day", priyaResponse: "yeah… today was just one of those days for me", nextMessages: [{ type: 'priya', text: "hey... i've been thinking. life is kinda messy rn. my family is always on my case 😔" }], nextStep: 2 },
          { text: "C) Not really, I stay busy", priyaResponse: "oh… lucky u then 😅 wish i could do that", nextMessages: [{ type: 'priya', text: "hey... i've been thinking. life is kinda messy rn. my family is always on my case 😔" }], nextStep: 2 }
        ];
      }
      if (storyProgress === 2) {
        return [
          { text: "A) That sounds stressful… hope it gets better", priyaResponse: "thanks… that actually means a lot ❤️", nextMessages: [{ type: 'priya', text: "honestly feels good to just talk to someone normal. most guys who dm me are just weird lol" }], nextStep: 3 },
          { text: "B) Why what happened?", priyaResponse: "they don’t support what i do… always comparing me 😔", nextMessages: [{ type: 'priya', text: "honestly feels good to just talk to someone normal. most guys who dm me are just weird lol" }], nextStep: 3 },
          { text: "C) Just ignore them", priyaResponse: "i wish it was that easy… it still hurts 😞", nextMessages: [{ type: 'priya', text: "honestly feels good to just talk to someone normal. most guys who dm me are just weird lol" }], nextStep: 3 }
        ];
      }
      if (storyProgress === 3) {
        return [
          { text: "A) haha yeah insta is full of weird people", priyaResponse: "exactly 😭 finally someone normal", nextStep: 4, transition: "5 DAYS LATER...", nextMessages: [{ type: 'priya', text: "i was thinking about what u said earlier... who do u miss the most? u mentioned someone close." }] },
          { text: "B) I’m not like them", priyaResponse: "hmm… we’ll see 🤭 but u seem nice", nextStep: 4, transition: "5 DAYS LATER...", nextMessages: [{ type: 'priya', text: "i was thinking about what u said earlier... who do u miss the most? u mentioned someone close." }] },
          { text: "C) what do you mean by weird?", priyaResponse: "they get creepy or annoying… u’re different tho", nextStep: 4, transition: "5 DAYS LATER...", nextMessages: [{ type: 'priya', text: "i was thinking about what u said earlier... who do u miss the most? u mentioned someone close." }] }
        ];
      }
      if (storyProgress === 4) {
        return [
          { text: "A) Someone close… not ready to say", points: 20, priyaResponse: "that’s okay… take your time ❤️", nextMessages: [{ type: 'priya', text: "honestly talking to u makes me feel so much better. everything else just feels so heavy right now. do you have anyone you can really talk to? like... a safety net?" }], nextStep: 5 },
          { text: "B) My grandfather", priyaResponse: "i’m sorry… that must hurt a lot 😔", nextMessages: [{ type: 'priya', text: "honestly talking to u makes me feel so much better. everything else just feels so heavy right now. do you have anyone you can really talk to? like... a safety net?" }], nextStep: 5 },
          { text: "C) My grandfather passed away… left me money too", priyaResponse: "oh… that’s really tough 😔 at least he cared for u", nextMessages: [{ type: 'priya', text: "honestly talking to u makes me feel so much better. everything else just feels so heavy right now. do you have anyone you can really talk to? like... a safety net?" }], nextStep: 5 }
        ];
      }
      if (storyProgress === 5) {
        return [
          { text: "A) You’ll figure it out", priyaResponse: "i hope so… just feels overwhelming", nextMessages: [{ type: 'priya', text: "hey... i'm asking because i'm trying to sort out my own financial life. do you have any savings or like... family money for your future?" }], nextStep: 6 },
          { text: "B) You can talk to me anytime", priyaResponse: "that actually makes me feel better 🥺", nextMessages: [{ type: 'priya', text: "hey... i'm asking because i'm trying to sort out my own financial life. do you have any savings or like... family money for your future?" }], nextStep: 6 },
          { text: "C) I can help you if you need anything", priyaResponse: "really?… that’s so sweet of u ❤️", nextMessages: [{ type: 'priya', text: "hey... i'm asking because i'm trying to sort out my own financial life. do you have any savings or like... family money for your future?" }], nextStep: 6 }
        ];
      }
      if (storyProgress === 6) {
        return [
          { text: "A) not really… still a student", points: 25, priyaResponse: "yeah same… life is tough rn 😭", transition: "A FEW DAYS LATER...", nextMessages: [{ type: 'priya', text: "Krish I think i'm starting to... idk. like you? more than just a friend? ❤️" }], nextStep: 7 },
          { text: "B) a little bit, family money", priyaResponse: "oh okay… that’s nice at least", transition: "A FEW DAYS LATER...", nextMessages: [{ type: 'priya', text: "Krish I think i'm starting to... idk. like you? more than just a friend? ❤️" }], nextStep: 7 },
          { text: "C) yeah… i have quite a lot", priyaResponse: "oh wow… that’s really good… lucky u", transition: "A FEW DAYS LATER...", nextMessages: [{ type: 'priya', text: "Krish I think i'm starting to... idk. like you? more than just a friend? ❤️" }], nextStep: 7 }
        ];
      }
      if (storyProgress === 7) {
        return [
          { 
            text: "A) Let’s take it slow", 
            points: 10,
            priyaResponse: "yeah… i just wanted to be honest ❤️", 
            nextMessages: [{ type: 'priya', text: "hey... can i have your whatsapp? instagram is kinda glitchy. 📱" }],
            nextStep: 8 
          },
          { 
            text: "B) I feel the same", 
            priyaResponse: "really?? 🥺❤️ that makes me so happy", 
            nextMessages: [{ type: 'priya', text: "hey... can i have your whatsapp? instagram is kinda glitchy. 📱" }],
            nextStep: 8 
          },
          { 
            text: "C) Can we video call?", 
            priyaResponse: "maybe later 😅 i’m kinda shy", 
            nextMessages: [{ type: 'priya', text: "hey... can i have your whatsapp? instagram is kinda glitchy. 📱" }],
            nextStep: 8 
          }
        ];
      }
      if (storyProgress === 8) {
        return [
          {
            text: "A) Sure! It's 98*******",
            priyaResponse: "yay! messaging u now ❤️",
            impact: () => {
              setTransitionText("SWITCHING TO WHATSAPP...");
              setIsTransitioning(true);
              if (bgCycleIndex >= 0) setBgCycleIndex(prev => (prev + 1) % transitionBgs.length);
              setTimeout(() => {
                setIsTransitioning(false);
                setIsPostTransition(true);
                setStoryProgress(9);
                setPhoneApp("whatsapp");
              }, 3000);
            }
          },
          {
            text: "B) I don't know... maybe later?",
            points: 10,
            priyaResponse: "aww pls? 🥺 i just wanna talk more comfortably. insta is so annoying.",
            nextMessages: [{ type: 'priya', text: "just trust me? ❤️" }],
            nextStep: 8.5
          }
        ];
      }
      if (storyProgress === 8.5) {
        return [
          {
            text: "A) Fine... it's 98*******",
            priyaResponse: "yay! messaging u now ❤️",
            impact: () => {
              setTransitionText("SWITCHING TO WHATSAPP...");
              setIsTransitioning(true);
              if (bgCycleIndex >= 0) setBgCycleIndex(prev => (prev + 1) % transitionBgs.length);
              setTimeout(() => {
                setIsTransitioning(false);
                setIsPostTransition(true);
                setStoryProgress(9);
                setPhoneApp("whatsapp");
              }, 3000);
            }
          }
        ];
      }
      return null;
    };

    const choices = getChoices();

    return (
      <div className="flex-1 flex flex-col bg-zinc-950 h-full">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center bg-zinc-950 shrink-0">
          <div className="w-8 h-8 rounded-full bg-indigo-600 mr-3 overflow-hidden">
            <img src="/assets/priya_real.png" className="w-full h-full object-cover" alt="DP" />
          </div>
          <div>
            <p className="font-bold text-xs">_priya.sunshine_</p>
            <p className="text-[9px] text-green-500"></p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col">
          {dmHistory.length === 1 && !isPostTransition && (
            <div className="text-center p-6 bg-zinc-900/30 rounded-2xl mb-6 border border-white/5 mx-4 mt-4">
              <div className="w-16 h-16 rounded-full bg-indigo-600 mx-auto mb-3 overflow-hidden border-2 border-indigo-500/50">
                <img src="/assets/priya_real.png" className="w-full h-full object-cover" alt="DP" />
              </div>
              <p className="font-bold text-sm">Priya</p>
              <p className="text-[10px] text-zinc-400 mb-2">Chennai | music + chai lover ✨</p>
              <button onClick={() => setPhoneApp('insta_profile')} className="text-[10px] text-indigo-400 font-bold hover:underline">View Profile</button>
            </div>
          )}
          
          {dmHistory.map((msg, i) => renderMessage(msg, i, i === dmHistory.length - 1))}
          
          {isTyping && (
            <div className="flex justify-start mb-4">
              <div className="bg-zinc-800 p-3 rounded-2xl rounded-tl-sm text-xs animate-pulse flex gap-1">
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          )}
          
          <div ref={dmEndRef} />
        </div>

        {/* Footer / Choices */}
        {storyProgress === 0.5 && (
          <div className="absolute bottom-[100px] left-0 right-0 flex justify-center z-30 pointer-events-none animate-fadeIn">
            <InteractionPrompt text="probably time to freshen up" showKey={false} />
          </div>
        )}
        {choices && !isTyping && pendingSequence.length === 0 ? renderChoices(choices) : storyProgress === 0.5 && (
          <InteractionPrompt text="get up" />
        )}
      </div>
    );
  };

  // --- SHARED WHATSAPP HELPERS ---
  const renderWARPlayerMsg = (text, isLast) => (
    <div className="flex justify-end mb-4 relative z-0">
      <div className={`max-w-[85%] bg-[#dcf8c6] text-black pt-2 pb-2.5 px-3 rounded-lg rounded-tr-none text-[12px] leading-snug shadow-sm relative ${isLast ? 'animate-fadeIn' : ''} before:content-[''] before:absolute before:top-0 before:-right-2 before:w-0 before:h-0 before:border-[8px] before:border-transparent before:border-t-[#dcf8c6] before:border-l-[#dcf8c6]`}>
        {text}
        <span className="float-right text-[9px] text-black/40 mt-1 ml-3 mt-1.5 flex items-center gap-1">
          <svg viewBox="0 0 16 15" width="12" height="12" className="text-[#53bdeb]"><path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path></svg>
        </span>
      </div>
    </div>
  );

  const renderWARPriyaMsg = (text, isLast) => (
    <div className="flex justify-start mb-4 relative z-0">
      <div className={`max-w-[85%] bg-white text-black pt-2 pb-2.5 px-3 rounded-lg rounded-tl-none text-[12px] leading-snug shadow-sm relative ${isLast ? 'animate-fadeIn' : ''} before:content-[''] before:absolute before:top-0 before:-left-2 before:w-0 before:h-0 before:border-[8px] before:border-transparent before:border-t-white before:border-r-white`}>
        {text}
        <span className="float-right text-[9px] text-black/40 mt-1 ml-3 mt-1.5"></span>
      </div>
    </div>
  );

  const renderWARSystemMsg = (text) => (
    <div className="text-center text-[10px] text-zinc-500 bg-[#e1f5fe]/80 rounded-lg px-3 py-1 mx-auto my-3 w-fit font-semibold shadow-sm">
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
  
  const renderChatStream = (history, chatEndRef) => (
    <div className="flex-1 p-4 flex flex-col pt-6 pb-6 overflow-y-auto custom-scrollbar relative z-10 w-full">
      {history.map((msg, idx) => {
        const isLast = idx === history.length - 1;
        if (msg.type === 'system') return <React.Fragment key={idx}>{renderWARSystemMsg(msg.text)}</React.Fragment>;
        if (msg.type === 'priya') return <React.Fragment key={idx}>{renderWARPriyaMsg(msg.text, isLast)}</React.Fragment>;
        if (msg.type === 'unknown') return (
          <div key={idx} className={`p-3 bg-red-100 border border-red-300 rounded-lg text-black text-[10px] my-4 leading-tight font-bold shadow-sm ${isLast ? 'animate-fadeIn' : ''}`}>
            <span className="text-red-700 block mb-1">Unknown Number:</span>
            {msg.text}
            {msg.img && (
              <div className="mt-2 rounded-lg overflow-hidden border border-red-400">
                <img src={msg.img} className="w-auto h-auto" alt="blackmail" />
              </div>
            )}
          </div>
        );
        return <React.Fragment key={idx}>{renderWARPlayerMsg(msg.text, isLast)}</React.Fragment>;
      })}
      <div ref={chatEndRef} />
    </div>
  );

  const WAHeader = ({ title, subtitle, isCall, showBack }) => (
    <div className="bg-[#075e54] p-4 pt-10 flex items-center gap-3 text-white sticky top-0 z-20 shadow-md">
      {showBack && (
        <div className="cursor-pointer font-bold text-xl mr-1 hover:text-white/80 active:scale-95 transition-transform" onClick={() => setPhoneApp('whatsapp_list')}>←</div>
      )}
      <div className="w-10 h-10 rounded-full bg-zinc-300 overflow-hidden flex items-center justify-center">
        <img src="/assets/priya_real.png" className="w-full h-full object-cover" alt="DP" />
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


  const GPayApp = ({ amount }) => {
    useEffect(() => {
      const timer = setTimeout(() => {
        adjustAssets(-amount);
        if (amount === 45000) {
          setPhoneApp('whatsapp');
        } else {
          setGameState('act3');
        }
      }, 2500);
      return () => clearTimeout(timer);
    }, [amount, adjustAssets]);

    return (
      <div className="flex-1 flex flex-col bg-white items-center justify-center text-black relative pt-10 px-8">
        <div className="absolute top-0 inset-x-0 h-48 bg-blue-600 rounded-b-[3rem] -z-10" />
        <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-6 text-4xl font-black text-blue-600">
          <span className="italic">G</span>
        </div>
        <p className="text-sm font-bold text-zinc-500 mb-2 uppercase tracking-widest">Paying</p>
        <p className="text-2xl font-black mb-8 text-black">{amount === 45000 ? "Priya" : "+91 98941 23094 (Unknown)"}</p>
        <div className="bg-zinc-50 rounded-3xl p-8 w-full shadow-inner border border-zinc-100 flex flex-col items-center">
          <span className="text-5xl font-black text-zinc-800 mb-2">₹{amount.toLocaleString('en-IN')}</span>
          <span className="text-xs text-zinc-400 font-mono mb-6">Banking Name: RAMESH V</span>
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-bold text-blue-600 animate-pulse">Processing Payment...</p>
        </div>
      </div>
    );
  };

  const HomeScreen = () => (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-zinc-800">
      <div className="absolute inset-0 bg-cover bg-center opacity-40 blur-sm pointer-events-none" style={{ backgroundImage: 'url("/assets/study.png")' }} />
      <div className="grid grid-cols-4 gap-4 p-6 z-10 pt-16">
        <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => setPhoneApp('instagram')}>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center text-white text-2xl shadow-lg">📸</div>
          <span className="text-[10px] text-white drop-shadow-md font-bold">Insta</span>
        </div>
        <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => {
          if (storyProgress >= 9 && savedContact) setPhoneApp('whatsapp_list');
          else setFeedback("No new messages yet.");
        }}>
          <div className="w-12 h-12 rounded-2xl bg-[#25d366] flex items-center justify-center text-white text-2xl shadow-lg relative">
            💬
            {storyProgress >= 9 && savedContact && <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white border border-transparent animate-pulse">1</div>}
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

  const renderContactsApp = () => {
    if (addingContact) {
      return (
        <div className="flex-1 flex flex-col bg-zinc-50 text-black pt-10">
          <div className="p-4 bg-zinc-100 border-b border-zinc-300 flex items-center justify-between">
            <span className="text-zinc-500 cursor-pointer text-sm" onClick={() => setAddingContact(false)}>Cancel</span>
            <span className="font-bold text-sm">New Contact</span>
            <span className="text-blue-500 font-bold cursor-pointer text-sm" onClick={() => {
              if (contactName.trim() !== '') {
                if (contactName.toLowerCase().includes('priya') && (storyProgress === 8)) {
                  setSavedContact(true);
                  setPhoneApp('whatsapp');
                  setDay(13);
                  setStoryProgress(9);
                } else {
                  setAddingContact(false);
                }
              }
            }}>Done</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="w-24 h-24 rounded-full bg-zinc-300 mx-auto flex items-center justify-center text-4xl text-white shadow-inner">👤</div>
            <input type="text" placeholder="First Name" value={contactName} onChange={e => setContactName(e.target.value)} className="w-full p-3 border-b border-zinc-300 bg-transparent outline-none text-sm placeholder-zinc-400 font-bold" autoFocus />
            <input type="text" placeholder="Phone" defaultValue="+91 94440 12345" className="w-full p-3 border-b border-zinc-300 bg-transparent outline-none text-sm font-mono text-zinc-500" />
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col bg-white text-black pt-10">
        <div className="p-4 flex justify-between items-center border-b border-zinc-200">
          <span className="font-bold text-lg">Contacts</span>
          <span className="text-blue-500 text-2xl cursor-pointer leading-none" onClick={() => setAddingContact(true)}>+</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-400">👤</div><span className="font-bold text-sm">Amma</span></div>
          <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-400">👤</div><span className="font-bold text-sm">Appa</span></div>
          {savedContact && <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-zinc-100 overflow-hidden"><img src="/assets/priya_real.png" className="w-full h-full object-cover" alt="P" /></div><span className="font-bold text-sm">Priya</span></div>}
          <div className="flex items-center gap-4"><div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-400">👤</div><span className="font-bold text-sm">Rahul (College)</span></div>
        </div>
      </div>
    );
  };

  const WAAudioCall = () => {
    const [isRinging, setIsRinging] = useState(true);
    const [callDuration, setCallDuration] = useState(0);
    const audioRef = useRef(null);
    const timerRef = useRef(null);
    const safetyTimeoutRef = useRef(null);

    useEffect(() => {
      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.onended = null;
          audioRef.current.onerror = null;
        }
        if (timerRef.current) clearInterval(timerRef.current);
        if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
      };
    }, []);

    const handleAnswer = () => {
      console.log("Answering WhatsApp call...");

      // 1. PRIME/UNLOCK AUDIO IMMEDIATELY (Pattern from Level1.jsx)
      // This ensures the browser respects the user interaction synchronously for media playback
      const audio = new Audio();
      audio.play().catch(() => { }); // silent permission grant
      audio.pause();

      setIsRinging(false);

      // 2. SET SOURCE AND PLAY (Using capital Dia_audio for consistency with Level1.jsx)
      audio.src = '/Dia_audio/lvl1/lvlpriya.mpeg.mp3';
      audioRef.current = audio;
      audio.volume = 1.0;

      const endCall = () => {
        console.log("Ending call and transitioning to next chat...");
        if (timerRef.current) clearInterval(timerRef.current);
        if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);

        // Transition to next chat state
        setStoryProgress(11);
        setPhoneApp('whatsapp');
      };

      audio.onended = () => {
        console.log("Audio finished naturally.");
        endCall();
      };

      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        // Fallback to end call if audio fails
        setTimeout(endCall, 1500);
      };

      audio.onplay = () => {
        console.log("Audio started playing successfully.");
      };

      // Safety fallback: Ensure transition even if events fail to fire (30s)
      safetyTimeoutRef.current = setTimeout(() => {
        console.warn("Safety timeout reached in WAAudioCall.");
        endCall();
      }, 30000);

      // Attempt to play
      audio.load();
      audio.play().catch(err => {
        console.error("Audio play failed (interaction or path?):", err);
        // If play completely fails, transition anyway after a brief delay
        setTimeout(endCall, 1000);
      });

      // Start duration timer for UI feedback
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    };

    const formatTime = (secs) => {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
      <div className="flex-1 flex flex-col bg-[#075e54] relative text-white pt-10">
        <div className="flex-1 p-4 flex flex-col items-center justify-center relative border-b border-[#25d366]/20">
          <p className="z-10 text-lg text-white/80 mb-8 font-mono">
            {isRinging ? "Incoming Voice Call" : "Voice Call"}
          </p>
          <div className="z-10 w-32 h-32 rounded-full bg-zinc-300 mb-6 flex items-center justify-center text-4xl shadow-xl border-4 border-[#25d366]/50 mb-4 overflow-hidden relative">
            <img src="/assets/priya_real.png" className="w-full h-full object-cover" alt="DP" />
          </div>
          <p className="z-10 text-3xl font-bold mb-2">Priya</p>
          <p className="z-10 text-sm opacity-80 mb-2 font-mono">+91 94440 12345</p>
        </div>
        <div className="h-48 flex justify-around items-center px-8 pb-10 bg-[#075e54]">
          <div onClick={() => {
            if (audioRef.current) audioRef.current.pause();
            setPhoneApp('whatsapp');
            setFeedback("You hung up. She texted.");
            setStoryProgress(11);
          }} className="flex flex-col items-center gap-2 cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-3xl shadow-lg hover:scale-105 transition-transform"><span className="rotate-[135deg]">📞</span></div>
            <span className="text-white/80 text-sm">{isRinging ? "Decline" : "End Call"}</span>
          </div>
          {isRinging && (
            <div onClick={handleAnswer} className="flex flex-col items-center gap-2 cursor-pointer animate-bounce hover:scale-105 transition-transform">
              <div className="w-16 h-16 rounded-full bg-[#25d366] flex items-center justify-center text-3xl shadow-lg">📞</div>
              <span className="text-white/80 text-sm font-bold">Answer</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const WAVideoCall = () => {
    const [isAccepted, setIsAccepted] = useState(false);
    const [showResponse, setShowResponse] = useState(false);
    const videoRef = useRef(null);
    const playerVideoRef = useRef(null);

    // Removed camera access logic to respect user privacy
    useEffect(() => {
      // Logic for camera access removed per user request
    }, []);

    const handleEndCall = useCallback(() => {
      console.log("Video call ended. Transitioning...");
      setTransitionText("2 HOURS LATER");
      setIsTransitioning(true);
      setFeedback("Call ended. Screen went black.");
      setTimeout(() => {
        setIsTransitioning(false);
        setStoryProgress(11.5);
        setDay(16);
        setPhoneApp('whatsapp');
      }, 2500);
    }, []);

    if (isAccepted) {
      return (
        <div className="flex-1 flex flex-col bg-black relative pt-10 overflow-hidden">
          {/* Scammer Video (Main View) */}
          <video
            ref={videoRef}
            src="/Dia_audio/lvl1/priyavideo.mp4"
            autoPlay
            playsInline
            onEnded={() => {
              setTimeout(handleEndCall, 1500);
            }}
            className="w-full h-full object-cover"
          />

          {/* Player PIP (Picture-in-Picture) */}
          <div className="absolute top-24 right-4 w-28 h-40 bg-zinc-800 rounded-lg border-2 border-white/20 z-20 shadow-xl overflow-hidden">
            <img
              src="/assets/protagonist.png"
              alt="Player"
              className="object-cover w-full h-full scale-x-[-1]"
            />
          </div>

          {/* Call Controls Overlay */}
          <div className="absolute inset-x-0 bottom-12 flex justify-center z-30">
            <div
              onClick={handleEndCall}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-2xl shadow-xl border-2 border-white/20 cursor-pointer hover:scale-110 active:scale-95 transition-transform"
            >
              <span className="rotate-[135deg] text-white">📞</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col bg-zinc-900 relative pt-10 overflow-hidden">
        <WAHeader title="Priya" subtitle="WhatsApp Video" isCall={true} />

        {/* Background (Blurred Character Image) */}
        <div className="absolute inset-0 bg-zinc-900 z-0 overflow-hidden">
          <img src="/assets/protagonist.png" alt="Protagonist" className="object-cover w-full h-full scale-x-[-1] opacity-40 blur-sm" />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="flex-1 p-4 text-center flex flex-col items-center justify-center z-20">
          <div className="w-32 h-32 rounded-full border-4 border-[#25d366] border-t-transparent animate-spin mb-4" />
          <div className="w-24 h-24 rounded-full bg-indigo-600 absolute flex items-center justify-center text-4xl font-black text-white/50 shadow-[0_0_30px_rgba(79,70,229,0.5)] overflow-hidden">
            <img src="/assets/priya_real.png" className="w-full h-full object-cover" alt="DP" />
          </div>
          <p className="font-bold text-white text-xl mt-8 drop-shadow-md">Incoming Video Call</p>
          <p className="text-[#25d366] text-sm mt-2 font-mono uppercase tracking-widest animate-pulse">Priya is calling...</p>
        </div>

        <div className="z-20 bg-black/60 backdrop-blur-md pb-12 pt-6 shrink-0 relative">
          <div className="flex justify-around items-center px-12">
            <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => {
              setTransitionText("2 HOURS LATER");
              setIsTransitioning(true);
              setFeedback("Call declined. You went on with your day.");
              setTimeout(() => {
                setIsTransitioning(false);
                setStoryProgress(11.5);
                setDay(16);
                setPhoneApp('whatsapp');
              }, 2500);
            }}>
              <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-2xl shadow-lg transition-transform hover:scale-110 active:scale-95 text-white">📞</div>
              <span className="text-white/60 text-[10px] font-bold uppercase tracking-tighter">Decline</span>
            </div>

            <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setIsAccepted(true)}>
              <div className="w-16 h-16 rounded-full bg-[#25d366] flex items-center justify-center text-2xl shadow-lg transition-transform hover:scale-110 active:scale-95 text-white animate-bounce">📹</div>
              <span className="text-white/60 text-[10px] font-bold uppercase tracking-tighter">Answer</span>
            </div>
          </div>
        </div>
      </div>
    );
  };
  const WhatsAppApp = ({ 
    storyProgress, setStoryProgress, 
    waHistory, setWaHistory, 
    waUnknownHistory, setWaUnknownHistory,
    savedContact, setSavedContact,
    setFeedback, phoneApp, setPhoneApp,
    showUnknownNotif, setShowUnknownNotif,
    blackmailProgress, setBlackmailProgress,
    handleChoice, renderWARChoices, WAHeader, renderChatStream,
    isTyping, setIsTyping
  }) => {
    // Determine which chat to show based on phoneApp override, otherwise default to Priya
    const isUnknown = phoneApp === 'whatsapp_unknown';
    const currentHistory = isUnknown ? waUnknownHistory : waHistory;

    // Helper to auto-scroll to bottom of chat
    const chatEndRef = useRef(null);
    useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [waHistory, waUnknownHistory, phoneApp]);

    useEffect(() => {
      if (storyProgress === 9) {
        setWaHistory(prev => {
          if (prev.length > 0) return prev;
          return [
            { type: 'system', text: 'TODAY' },
            { type: 'priya', text: "Hey! It's Priya from Insta. Saved your number! ❤️" }
          ];
        });
      }
      if (storyProgress === 9.5) {
        setWaHistory(prev => {
          if (prev.some(m => m.text.includes('exactly like I imagined'))) return prev;
          return prev;
        });
      }
      if (storyProgress === 11) {
        setWaHistory(prev => {
          if (prev.some(m => m.text.includes('exactly like I imagined'))) return prev;
          return [
            ...prev,
            { type: 'priya', text: "Hiii! You sound exactly like I imagined! Did your grandfather leave anything for you? I hope you're taken care of." }
          ];
        });
      }
      if (storyProgress === 11.5) {
        setWaHistory(prev => {
          if (prev.some(m => m.text.includes('₹45,000 BY 6 PM'))) return prev;
          return [
            ...prev,
            { type: 'system', text: '2 HOURS LATER' },
            { type: 'priya', text: "Krish... I need ₹45,000 BY 6 PM or I'm out of my house. Please... 😭" }
          ];
        });
      }
      if (storyProgress === 12.5) {
        setWaHistory(prev => {
          if (prev.some(m => m.text.includes('i had to tell them'))) return prev;
          return [
            ...prev,
            { type: 'priya', text: "i'm sorry Krish... i had to tell them. just pay and it goes away. 😭" }
          ];
        });
      }
    }, [storyProgress]);

    const addToWA = (msg) => setWaHistory(prev => [...prev, msg]);
    const addToUnknown = (msg) => setWaUnknownHistory(prev => [...prev, msg]);

    if (isUnknown) {
      return (
        <div className="flex-1 flex flex-col bg-[#ece5dd] relative w-full h-full">
          <div className="absolute inset-0 bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover opacity-10 pointer-events-none" />
          <WAHeader title="+91 98941 23094" subtitle="online" showBack={true} />
          {renderChatStream(waUnknownHistory)}
          <div className="z-20 pb-10 pt-2 shrink-0 w-full bg-[#f0f0f0] shadow-[0_-5px_15px_rgba(0,0,0,0.05)] flex flex-col">
            {blackmailProgress === 0 && renderWARChoices([
              {
                text: "Send: 'Who is this? How did you get that?'", noBubble: true, points: 0, impact: () => {
                  addToUnknown({ type: 'player', text: "Who is this? How did you get that?" });
                  setBlackmailProgress(1);
                  setTimeout(() => {
                    addToUnknown({ type: 'unknown', text: "Doesn't matter. You have 2 minutes to decide. ₹1,20,000 or your life is ruined." });
                  }, 1500);
                }
              }
            ])}
            {blackmailProgress === 1 && waUnknownHistory.some(m => m.text.includes("Doesn't matter")) && renderWARChoices([
              {
                text: "Send: 'I need time.'", noBubble: true, points: 0, impact: () => {
                  addToUnknown({ type: 'player', text: "I need time." });
                  setBlackmailProgress(2);
                  setTimeout(() => {
                    addToUnknown({ type: 'unknown', text: "No time. Priya told us you have the money from Thatha." });
                  }, 1500);
                }
              }
            ])}
            {blackmailProgress === 2 && waUnknownHistory.some(m => m.text.includes("Priya told us")) && renderWARChoices([
              {
                text: "Return to Priya's Chat", noBubble: true, points: 0, nextStep: 12.5, impact: () => {
                  setPhoneApp('whatsapp');
                  setStoryProgress(12.5);
                }
              }
            ])}
          </div>
        </div>
      );
    }

    // Default: Priya Chat
    return (
      <div className="flex-1 flex flex-col bg-[#ece5dd] relative w-full h-full">
        <div className="absolute inset-0 bg-[url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover opacity-10 pointer-events-none" />
        <WAHeader title={savedContact ? "Priya" : "+91 94440 12345"} subtitle={savedContact ? (isTyping ? "typing..." : "") : "Unknown"} showBack={true} />


        {!savedContact && (
          <div className="bg-white/90 backdrop-blur p-4 border-b border-zinc-200 flex flex-col gap-3 relative z-20 animate-fadeIn">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-center">This sender is not in your contacts</span>
            <div className="flex gap-2">
              <button onClick={() => {
                setSavedContact(true);
                setFeedback("Contact Saved: Priya");
              }} className="flex-1 bg-[#25d366] text-white py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-[#128c7e] shadow-sm transition-colors">Add to Contacts</button>
              <button className="flex-1 bg-zinc-200 text-zinc-600 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-zinc-300 transition-colors">Block</button>
            </div>
          </div>
        )}

        {showUnknownNotif && (
          <div className="absolute top-20 left-4 right-4 bg-zinc-800 text-white p-4 rounded-xl shadow-2xl border border-white/20 z-50 flex items-start gap-4 cursor-pointer hover:bg-zinc-700 transition animate-bounce"
            onClick={() => {
              setShowUnknownNotif(false);
              setPhoneApp('whatsapp_unknown');
              setWaUnknownHistory([{ type: 'system', text: 'TODAY' }, { type: 'unknown', text: 'Pay ₹1,20,000 NOW or we release your video call screenshots. We know about the ₹42 lakhs.', img: '/assets/blackmail_proof.png' }]);
            }}>
            <div className="w-10 h-10 bg-[#25d366] rounded-full flex items-center justify-center text-xl">💬</div>
            <div className="flex-1">
              <p className="font-bold text-xs">Message from +91 98941 23094</p>
              <p className="text-[10px] opacity-80 mt-1 line-clamp-2">Pay ₹1,20,000 NOW or we release your video call screenshots...</p>
            </div>
          </div>
        )}

        {renderChatStream(waHistory, chatEndRef)}

        <div className="z-20 pb-10 pt-2 shrink-0 w-full bg-[#f0f0f0] shadow-[0_-5px_15px_rgba(0,0,0,0.05)] flex flex-col">
            {storyProgress === 9 && renderWARChoices([
            {
              text: "Hey, this is Krish from Insta.", points: 0, impact: () => {
                setStoryProgress(9.6);
                setTimeout(() => {
                  addToWA({ type: 'priya', text: "Hiiii! Let's talk!" });
                  setTimeout(() => {
                    setPhoneApp('whatsapp_audio_call');
                    setStoryProgress(10);
                  }, 2000);
                }, 1500);
              }
            }
          ])}

          {storyProgress === 11 && renderWARChoices([
            {
              text: "A) Change subject: I'd rather not talk finances.", chatText: "I'd rather not talk finances.", points: 20, setDay: 14, impact: () => {
                setStoryProgress(11.1); // intermediary state to remove options and wait
                setTimeout(() => {
                  addToWA({ type: 'priya', text: "oh... okay. sorry for asking 😔" });
                  setTimeout(() => {
                    setTransitionText("1 DAY LATER");
                    setIsTransitioning(true);
                    if (bgCycleIndex >= 0) setBgCycleIndex(prev => (prev + 1) % transitionBgs.length);
                    setTimeout(() => {
                      setIsTransitioning(false);
                      setIsPostTransition(true);
                      setPhoneApp('whatsapp_video_call');
                      setDay(15);
                    }, 3000);
                  }, 2000);
                }, 1500);
              }
            },
            {
              text: "B) A little. Enough to be okay.", chatText: "A little. Enough to be okay.", points: 10, setDay: 14, impact: () => {
                setStoryProgress(11.1);
                setTimeout(() => {
                  addToWA({ type: 'priya', text: "oh... that's good! glad you're sorted ❤️" });
                  setTimeout(() => {
                    setTransitionText("1 DAY LATER");
                    setIsTransitioning(true);
                    if (bgCycleIndex >= 0) setBgCycleIndex(prev => (prev + 1) % transitionBgs.length);
                    setTimeout(() => {
                      setIsTransitioning(false);
                      setIsPostTransition(true);
                      setPhoneApp('whatsapp_video_call');
                      setDay(15);
                    }, 3000);
                  }, 2000);
                }, 1500);
              }
            },
            {
              text: "C) Tell her about the ₹42 lakh specifically.", chatText: "I have some inheritance, about 42 lakhs.", points: 0, setDay: 14, impact: () => {
                setStoryProgress(11.1);
                setTimeout(() => {
                  addToWA({ type: 'priya', text: "omg that's amazing! you're so lucky 🥺" });
                  setTimeout(() => {
                    setTransitionText("1 DAY LATER");
                    setIsTransitioning(true);
                    if (bgCycleIndex >= 0) setBgCycleIndex(prev => (prev + 1) % transitionBgs.length);
                    setTimeout(() => {
                      setIsTransitioning(false);
                      setIsPostTransition(true);
                      setPhoneApp('whatsapp_video_call');
                      setDay(15);
                    }, 3000);
                  }, 2000);
                }, 1500);
              }
            }
          ])}

          {storyProgress === 11.5 && renderWARChoices([
            {
              text: "A) Send ₹45,000 via UPI immediately.", points: 0, setDay: 16, impact: () => {
                setStoryProgress(12);
                setPhoneApp('gpay_45k');
                setTimeout(() => setShowUnknownNotif(true), 1500);
              }
            },
            {
              text: "B) Give me your landlord's number to verify.", points: 20, setDay: 16, impact: () => {
                setStoryProgress(12);
                setTimeout(() => setShowUnknownNotif(true), 1500);
              }
            },
            {
              text: "C) I cannot send money to anyone online.", points: 25, setDay: 16, impact: () => {
                setStoryProgress(12);
                setTimeout(() => setShowUnknownNotif(true), 1500);
              }
            }
          ])}

          {storyProgress === 12.5 && renderWARChoices([
            {
              text: "A) Pay scammers ₹1,20,000 immediately.", points: 0, impact: () => setPhoneApp('gpay_120k')
            },
            {
              text: "B) Send partial amount (₹50,000).", points: 0, impact: () => setPhoneApp('gpay_50k')
            },
            {
              text: "C) Screenshot, Block, and Dial 1930 / cybercrime.gov.in.", points: 45, impact: () => { }, feedback: "CORRECT: Never pay blackmailers. Report immediately.", nextScene: 'act3'
            }
          ])}
        </div>
      </div>
    );
  };

  // --- MAIN RENDERS ---

  const renderIntro = () => (
    <div className="flex flex-col items-center justify-center h-full bg-zinc-950 text-center p-12">
      <h1 className="text-7xl font-black mb-6 tracking-tighter italic">I'M SO LONELY</h1>
      <div className="bg-red-600 px-6 py-2 text-sm font-black uppercase tracking-widest mb-10 skew-x-[-10deg]">Advanced Romance Fraud Mystery</div>
      <p className="max-w-xl text-zinc-400 text-lg leading-relaxed mb-12">
        Explore the study. Press <span className="text-white font-bold">E</span> for your phone.
      </p>
      <button onClick={() => setGameState('exploration')} className="px-16 py-5 bg-white text-black font-black uppercase tracking-widest">
        Enter The Study
      </button>
    </div>
  );

  const renderWakingUp = () => (
    <div className="w-full h-full bg-[#0f172a] flex items-center justify-center overflow-hidden relative font-sans">
      <div
          className="w-full h-full transition-all duration-1000"
          style={{
              backgroundImage: `url(${getBackground()})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
          }}
      />
      <div className="absolute top-1/4 inset-x-0 text-center z-50 animate-fadeIn px-10">
        <p className="text-white font-serif italic text-3xl font-bold tracking-wide drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">"Nothing to do... maybe see what's trending on Instagram."</p>
      </div>
      <InteractionPrompt text="Press E to open Insta" />
    </div>
  );

  const renderExploration = () => {
    const getLocationTitle = () => {
      if (day === 1) return "Bedroom";
      if (day >= 2 && day <= 7) return "Bedroom";
      if (day >= 8 && day <= 13) return "Garden Terrace";
      if (day === 14) return "Bedroom";
      if (day === 15) return "Office";
      if (day >= 16) return "Thatha's Study";
      return "Thatha's Study";
    };

    const getLocationDesc = () => {
      if (day === 1) return "Nothing to do... maybe see what's trending on Instagram.";
      if (day >= 2 && day <= 7) return "The glow of the phone is the only light.";
      if (day >= 8 && day <= 13) return "Warm evening breeze.";
      if (day === 14) return "Morning sun streams in.";
      if (day === 15) return "The harsh light of a new day.";
      if (day >= 16) return "The room feels cold again.";
      return "The room feels cold again.";
    };

    return (
      <div className="w-full h-full relative bg-zinc-900 overflow-hidden text-white">
        <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: `url("${getBackground()}")` }} />
        {/* Removed Day HUD overlay per user request */}
        <Player x={playerPos.x} y={playerPos.y} />
        <InteractionPrompt text="Check Phone" />
        {feedback && (
          <div className="absolute bottom-32 inset-x-0 flex justify-center z-[100] animate-fadeIn px-4">
            <div className="bg-indigo-600 px-12 py-4 rounded-full text-center shadow-2xl border border-indigo-400">
              <p className="text-white font-black italic">{feedback}</p>
            </div>
          </div>
        )}
      </div>
    );
  };



  // Stabilize hook-bearing inner components to prevent remounting/refreshing
  const StableInstaProfileApp = useMemo(() => InstaProfileApp, []);
  const StableWhatsAppApp = useMemo(() => WhatsAppApp, []);
  const StableWAAudioCall = useMemo(() => WAAudioCall, []);
  const StableWAVideoCall = useMemo(() => WAVideoCall, []);
  const StableGPayApp = useMemo(() => GPayApp, []);

  const renderPhone = () => {
    let AppToRender = HomeScreen();
    if (phoneApp === 'instagram') AppToRender = InstagramApp();
    else if (phoneApp === 'insta_profile') AppToRender = (
      <StableInstaProfileApp 
        profileBonusFound={profileBonusFound} setProfileBonusFound={setProfileBonusFound}
        setPoints={setPoints} setFeedback={setFeedback}
        setProfileChecked={setProfileChecked} setPhoneApp={setPhoneApp}
        day={day} storyProgress={storyProgress}
        likedPosts={likedPosts} toggleLike={toggleLike}
      />
    );
    else if (phoneApp === 'dm') AppToRender = DMApp();
    else if (phoneApp === 'contacts') AppToRender = renderContactsApp();
    else if (phoneApp === 'whatsapp') AppToRender = (
      <StableWhatsAppApp 
        storyProgress={storyProgress} setStoryProgress={setStoryProgress}
        waHistory={waHistory} setWaHistory={setWaHistory}
        waUnknownHistory={waUnknownHistory} setWaUnknownHistory={setWaUnknownHistory}
        savedContact={savedContact} setSavedContact={setSavedContact}
        setFeedback={setFeedback} phoneApp={phoneApp} setPhoneApp={setPhoneApp}
        showUnknownNotif={showUnknownNotif} setShowUnknownNotif={setShowUnknownNotif}
        blackmailProgress={blackmailProgress} setBlackmailProgress={setBlackmailProgress}
        handleChoice={handleChoice} renderWARChoices={renderWARChoices} 
        WAHeader={WAHeader} renderChatStream={(history, ref) => renderChatStream(history, ref)}
        isTyping={isTyping} setIsTyping={setIsTyping}
      />
    );
    else if (phoneApp === 'whatsapp_unknown') AppToRender = (
      <StableWhatsAppApp 
        storyProgress={storyProgress} setStoryProgress={setStoryProgress}
        waHistory={waHistory} setWaHistory={setWaHistory}
        waUnknownHistory={waUnknownHistory} setWaUnknownHistory={setWaUnknownHistory}
        savedContact={savedContact} setSavedContact={setSavedContact}
        setFeedback={setFeedback} phoneApp={phoneApp} setPhoneApp={setPhoneApp}
        showUnknownNotif={showUnknownNotif} setShowUnknownNotif={setShowUnknownNotif}
        blackmailProgress={blackmailProgress} setBlackmailProgress={setBlackmailProgress}
        handleChoice={handleChoice} renderWARChoices={renderWARChoices} 
        WAHeader={WAHeader} renderChatStream={(history, ref) => renderChatStream(history, ref)}
        isTyping={isTyping} setIsTyping={setIsTyping}
      />
    );
    else if (phoneApp === 'dm_transition') AppToRender = (
      <div className="flex-1 flex flex-col bg-zinc-950 items-center justify-center text-white p-6 text-center animate-fadeIn relative overflow-hidden">
        <p className="font-mono text-xl tracking-widest text-zinc-400 z-10 animate-pulse">{transitionText}</p>
      </div>
    );
    else if (phoneApp === 'whatsapp_list') AppToRender = (
      <div className="flex-1 flex flex-col bg-white text-black pt-10">
        <div className="bg-[#075e54] p-4 flex justify-between items-center text-white shadow-md z-10 w-full">
          <span className="font-bold text-lg">WhatsApp</span>
          <span className="text-xl">🔍 ⋮</span>
        </div>
        <div className="flex-1 overflow-y-auto cursor-pointer">
          <div className="flex items-center gap-4 p-4 border-b border-zinc-100 hover:bg-zinc-50" onClick={() => setPhoneApp('whatsapp')}>
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex justify-center items-center font-black text-xl overflow-hidden shadow-inner shrink-0">
              <div className="w-full h-full bg-indigo-600 border border-white/20" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-bold text-sm truncate">{savedContact ? "Priya" : "+91 94440 12345"}</span>
                <span className="text-[10px] text-zinc-400"></span>
              </div>
              <p className="text-xs text-zinc-500 truncate">{waHistory.length > 0 ? waHistory[waHistory.length - 1]?.text : "Waiting for messages..."}</p>
            </div>
            {(storyProgress === 6.5 || storyProgress === 8 || storyProgress === 9.5) && <div className="w-5 h-5 bg-[#25d366] rounded-full flex items-center justify-center text-[10px] text-white font-bold ml-2 shrink-0">1</div>}
          </div>

          {waUnknownHistory.length > 0 && (
            <div className="flex items-center gap-4 p-4 border-b border-zinc-100 bg-red-50 hover:bg-red-100 transition-colors" onClick={() => {
              setPhoneApp('whatsapp_unknown');
            }}>
              <div className="w-12 h-12 rounded-full bg-zinc-300 text-zinc-600 flex justify-center items-center font-black text-xl shrink-0">👤</div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-bold text-sm truncate text-red-600">+91 98941 23094</span>
                  <span className="text-[10px] text-[#25d366] font-bold"></span>
                </div>
                <p className="text-xs text-zinc-600 truncate font-semibold italic">{waUnknownHistory[waUnknownHistory.length - 1]?.text}</p>
              </div>
              {storyProgress === 9 && <div className="w-5 h-5 bg-[#25d366] rounded-full flex items-center justify-center text-[10px] text-white font-bold ml-2 shrink-0">1</div>}
            </div>
          )}
        </div>
      </div>
    );
    else if (phoneApp === 'whatsapp_audio_call') AppToRender = <StableWAAudioCall />;
    else if (phoneApp === 'whatsapp_video_call') AppToRender = <StableWAVideoCall />;
    else if (phoneApp.startsWith('gpay_')) {
      const amount = phoneApp === 'gpay_45k' ? 45000 : phoneApp === 'gpay_120k' ? 120000 : 50000;
      AppToRender = <StableGPayApp amount={amount} />;
    }
    else if (phoneApp === 'whatsapp_transition_2h') AppToRender = null;


    return (
      <div className="w-full h-full bg-black/40 flex items-center justify-center animate-in zoom-in duration-300 backdrop-blur-sm z-[200] absolute inset-0 py-8">
        <div className="w-[360px] h-full max-h-[760px] shrink-0 bg-zinc-900 rounded-[3rem] border-[10px] border-zinc-950 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col ring-1 ring-zinc-800">
          <div className="h-8 flex justify-between px-8 items-center text-[10px] text-white font-mono absolute top-0 left-0 right-0 z-[100] mix-blend-difference pointer-events-none">
            <span></span>
            <div className="flex gap-1 items-center"><span>📱 🛜 🔋</span></div>
          </div>
          {AppToRender}
          {phoneApp !== 'home' && (
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/80 to-transparent pointer-events-none flex justify-center items-end pb-3 z-[150]">
              <div className="w-24 h-1.5 bg-white/50 hover:bg-white rounded-full transition-colors pointer-events-auto cursor-pointer" onClick={() => setPhoneApp('home')} title="Return to Home Screen" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderResults = () => {
    const rank = points >= 170 ? "Cyber Detective Elite" : points >= 110 ? "Vigilant Defender" : points >= 60 ? "Awareness Student" : "Compromised";
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12 bg-zinc-950">
        <h1 className="text-9xl font-black mb-2 italic tracking-tighter">{points} / 170</h1>
        <p className="text-3xl font-black text-indigo-400 mb-12 uppercase">{rank}</p>
        <div className="max-w-2xl text-zinc-400 italic mb-12 text-lg">
          "You kept your promise, beta. You protected the assets. I am proud of you." <span className="text-white block mt-2">— Grandfather Rajan</span>
        </div>
        <button onClick={() => { adjustSafetyScore(points); completeLevel(points >= 150, points); }} className="px-16 py-6 bg-white text-black font-black text-xl italic uppercase">
          Finish Chapter 10
        </button>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-black text-white font-sans overflow-hidden">
      <style dangerouslySetInnerHTML={{
        __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 10px; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
                .animate-fadeOut { animation: fadeOut 0.3s ease-in forwards; }
            `}} />
      {gameState === 'intro' && renderIntro()}
      {gameState === 'waking_up' && renderWakingUp()}
      {gameState === 'phone' && (
        <div className={`w-full h-full transition-all duration-1000 blur-sm scale-105 opacity-60`}>
          <img 
            src={getBackground()} 
            className="w-full h-full object-cover" 
            alt="bg" 
          />
        </div>
      )}
      {gameState === 'exploration' && (
        <div className="w-full h-full">
          {renderExploration()}
        </div>
      )}
      {gameState === 'phone' && renderPhone()}
      {gameState === 'room_walk' && renderRoomWalk()}
      {gameState === 'room_walk_freshened' && renderRoomWalkFreshened()}
      {gameState === 'act3' && renderAct3()}
      {gameState === 'awareness' && renderAwareness()}
      {gameState === 'report' && renderReport()}
      {gameState === 'results' && renderResults()}



        <HintManager 
          gameState={gameState} 
          phoneApp={phoneApp} 
          day={day} 
          storyProgress={storyProgress} 
          profileChecked={profileChecked} 
        />

        {isTransitioning && (
          <div className="fixed inset-0 z-[1000] bg-black flex items-center justify-center animate-fadeIn">
            <p className="font-mono text-xl md:text-3xl tracking-[0.3em] text-zinc-400 animate-pulse uppercase">
              {transitionText}
            </p>
          </div>
        )}
      </div>
    );

  function renderRoomWalk() {
    return (
      <div className="flex-1 w-full h-full relative bg-black overflow-hidden animate-fadeIn">
        <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: `url(${getBackground()})` }} />
        <Player x={roomPlayerPos.x} y={roomPlayerPos.y} />

        {roomInteractionTarget !== 'bathroom' && (
          <InteractionPrompt text="Walk left to get freshen up" showKey={false} />
        )}
        {roomInteractionTarget === 'bathroom' && (
          <InteractionPrompt text="freshen up" showKey={true} />
        )}
      </div>
    );
  }

  function renderRoomWalkFreshened() {
    return (
      <div className="flex-1 w-full h-full relative bg-black overflow-hidden animate-fadeIn">
        <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: `url(${getBackground()})` }} />
        <Player x={roomPlayerPos.x} y={roomPlayerPos.y} />
        
        <div className="absolute top-[400px] left-[700px] w-20 h-20 bg-indigo-500/20 rounded-full animate-ping pointer-events-none"></div>

        {notiReceived && roomInteractionTarget !== 'bed' && (
          <InteractionPrompt text="Walk to bed to see phone" showKey={false} />
        )}
        {notiReceived && roomInteractionTarget === 'bed' && (
          <InteractionPrompt text="see phone" showKey={true} />
        )}
      </div>
    );
  }

  function renderAct3() {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-zinc-950 p-6 md:p-12 overflow-y-auto relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full animate-pulse delay-1000" />
        </div>

        <div className="max-w-4xl w-full z-10 animate-fadeIn">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]">THE UNMASKING</h1>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500 to-transparent" />
          </div>

          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl space-y-8 flex flex-col items-center text-center">
            <p className="text-zinc-300 text-lg md:text-xl leading-relaxed max-w-2xl font-medium">
              The operator was <span className="text-white font-black underline decoration-red-500/50 underline-offset-4">Ramesh</span>, running 12 'Priya' accounts from a rented room.
              <br />He targeted you using your grief about <span className="text-white font-bold italic">Grandfather Rajan</span>.
            </p>

            <div className="relative group w-full max-w-2xl">
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-black/60 border border-red-500/30 p-6 md:p-8 rounded-2xl italic text-red-200 text-lg leading-relaxed shadow-inner">
                "The video call used a real-time deepfake. You were recorded without consent for blackmail."
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-12">
            <button
              onClick={() => setGameState('awareness')}
              className="group relative px-12 py-5 bg-white font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.1)] overflow-hidden"
            >
              <div className="absolute inset-0 w-0 bg-red-600 transition-all duration-300 group-hover:w-full group-hover:left-0 z-0" style={{ left: '100%' }}></div>
              <span className="relative z-10 text-black transition-colors group-hover:text-white flex items-center gap-3">
                Next: Red Flags <span className="translate-x-0 group-hover:translate-x-2 transition-transform">→</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderAwareness() {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-zinc-950 p-6 md:p-12 overflow-y-auto relative">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-indigo-600/5 blur-[150px] rounded-full animate-pulse" />
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-emerald-600/5 blur-[150px] rounded-full animate-pulse delay-700" />
        </div>

        <div className="max-w-6xl w-full z-10 animate-fadeIn">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tight text-white mb-4">ROMANCE FRAUD RED FLAGS</h1>
            <div className="h-1.5 w-32 bg-indigo-600 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {[
              {
                title: "Catfishing",
                desc: "Fake online identities created to deceive for emotional or financial gain. They use stolen photos and elaborate backstories to build trust rapidly.",
                icon: "🎭",
                color: "indigo"
              },
              {
                title: "Urgent Money",
                desc: "Sudden rental emergencies, medical needs, or travel issues intended to bypass your logical thinking and exploit your empathy.",
                icon: "💰",
                color: "emerald"
              }
            ].map((flag, i) => (
              <div key={i} className="group relative p-8 md:p-12 bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[2rem] hover:bg-zinc-900/80 transition-all duration-500 hover:-translate-y-2 overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${flag.color}-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className="text-5xl mb-6">{flag.icon}</div>
                <h3 className="font-black text-2xl md:text-3xl mb-4 text-white uppercase tracking-tight">{flag.title}</h3>
                <p className="text-lg text-zinc-400 leading-relaxed font-medium">
                  {flag.desc}
                </p>

                {/* Micro-interaction element */}
                <div className="mt-8 flex items-center gap-2 text-zinc-500 font-bold text-xs uppercase tracking-widest group-hover:text-white transition-colors">
                  <span>Knowledge Found</span>
                  <div className={`h-px flex-1 bg-${flag.color}-500/20 group-hover:bg-${flag.color}-500/50 transition-colors`} />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mt-20">
            <button
              onClick={() => setGameState('report')}
              className="group relative px-16 py-6 bg-emerald-600 text-white font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(16,185,129,0.2)] hover:shadow-[0_25px_60px_rgba(16,185,129,0.4)] transition-all hover:-translate-y-1 active:translate-y-0 rounded-2xl"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
              <span className="relative z-10 flex items-center gap-4 text-xl">
                Read Police Report <span className="text-2xl group-hover:rotate-12 transition-transform">📄</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderReport() {
    const amountLost = 4200000 - assets;
    const isSuccess = amountLost === 0;

    return (
      <div className="flex flex-col h-full bg-[#f8fafc] text-slate-900 p-4 md:p-8 overflow-y-auto font-sans relative">
        <div className="max-w-4xl mx-auto w-full space-y-8 pb-12 animate-fadeIn">
          
          {/* Header Section */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Case Review: Romance Fraud</h1>
            <p className="text-slate-500 font-medium tracking-wide pb-4 border-b border-slate-200">
              National Cyber Crime Reporting Portal • Case #CYB/2024/00847
            </p>
          </div>

          {/* Impact Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Financial Loss</span>
              <span className={`text-4xl font-black ${amountLost > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                ₹{amountLost.toLocaleString('en-IN')}
              </span>
              <p className="text-sm text-slate-500 mt-2">
                {isSuccess ? "Excellent! You protected the full inheritance." : "Partial funds were lost to the scammer."}
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Investigation Status</span>
              <span className="text-4xl font-black text-indigo-600">RESOLVED</span>
              <p className="text-sm text-slate-500 mt-2">Suspect traced to Rajasthan & Arrested.</p>
            </div>
          </div>

          {/* Case Narrative Card */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h3 className="font-black text-lg uppercase tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
              Investigation Summary
            </h3>
            <p className="text-slate-600 leading-relaxed">
              The suspect, <span className="font-bold text-slate-900">Ramesh (31)</span>, operated the fake identity <span className="font-bold text-indigo-600">@_priya.sunshine_</span> from a rented room in Rajasthan. He used AI-powered deepfake technology during video calls to mimic a woman's face and voice, targeting you during a period of emotional vulnerability. 
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              {['Catfishing', 'Deepfake', 'Social Engineering', 'Blackmail'].map(tag => (
                <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">{tag}</span>
              ))}
            </div>
          </div>

          {/* Key Risk Factors & Lessons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 space-y-3">
              <h4 className="font-black text-red-800 text-sm uppercase flex items-center gap-2">
                ⚠️ Critical Risks Found
              </h4>
              <ul className="text-sm text-red-900 leading-relaxed space-y-2">
                <li className="flex gap-2"><span>•</span> Responding to strangers' social media comments.</li>
                <li className="flex gap-2"><span>•</span> Sharing personal grief and financial details early.</li>
                <li className="flex gap-2"><span>•</span> Accepting video calls with unverified online contacts.</li>
              </ul>
            </div>
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 space-y-3">
              <h4 className="font-black text-emerald-800 text-sm uppercase flex items-center gap-2">
                ✅ Protective Actions
              </h4>
              <ul className="text-sm text-emerald-900 leading-relaxed space-y-2">
                <li className="flex gap-2"><span>•</span> Reporting to 1930 immediately after the threat.</li>
                <li className="flex gap-2"><span>•</span> Refusing to pay any amount despite pressure.</li>
                <li className="flex gap-2"><span>•</span> Documenting evidence before blocking intruders.</li>
              </ul>
            </div>
          </div>

          {/* Expandable Behavioral Audit */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <span className="w-8 h-px bg-slate-200"></span>
              Behavioral Breakdown
              <span className="w-8 h-px bg-slate-200"></span>
            </h3>
            
            {[
              {
                id: 'profile',
                title: 'Check "Account Information" via the 3-dot menu',
                isCorrect: profileBonusFound,
                correctDetail: "Excellent. You verified the account's history (Date joined, former usernames) before trusting the profile. This is the first line of defense against catfishing.",
                wrongDetail: "You engaged with the profile without checking its validity. Scammers often use new accounts or change usernames frequently to hide their history."
              },
              {
                id: 'privacy',
                title: 'Option A: "Someone close… not ready to say"',
                isCorrect: decisions.some(d => d.label.includes("not ready to say")),
                correctDetail: "By keeping your personal grief private, you denied the scammer the emotional leverage they needed to build a false 'soulmate' connection.",
                wrongDetail: "Sharing deep personal losses with strangers online provides them with 'emotional hooks' that they use to manipulate you into a false sense of intimacy."
              },
              {
                id: 'finance_status',
                title: 'Option A: "not really… still a student"',
                isCorrect: decisions.some(d => d.label.includes("still a student")),
                correctDetail: "Smart move. Hiding your financial status makes you a 'low value' target for scammers who are primarily looking for large inheritance or savings.",
                wrongDetail: "Mentioning inheritance or assets immediately signaled to the scammer that you were worth the time and effort of a long-term 'pig butchering' scam."
              },
              {
                id: 'boundaries',
                title: 'Option A: "Let’s take it slow"',
                isCorrect: decisions.some(d => d.label.includes("Let’s take it slow")),
                correctDetail: "Setting boundaries is critical. Scammers use 'Love Bombing' to create rapid intimacy; slowing down breaks their planned psychological cycle.",
                wrongDetail: "Reciprocating romantic intensity too quickly allows the scammer to accelerate the grooming process and prepare you for a financial 'emergency'."
              },
              {
                id: 'platform',
                title: "Option B: \"I don't know... maybe later?\"",
                isCorrect: decisions.some(d => d.label.includes("maybe later?")),
                correctDetail: "You resisted moving to WhatsApp. Scammers move off-platform to avoid being flagged by Instagram's security algorithms and to control the environment.",
                wrongDetail: "Agreeing to move to WhatsApp immediately is a high-risk action. It takes the conversation into an unmonitored space where reporting becomes harder."
              },
              {
                id: 'finance_direct',
                title: 'Option A: "I\'d rather not talk finances"',
                isCorrect: decisions.some(d => d.label.includes("I'd rather not talk finances")),
                correctDetail: "Direct rejection of financial questions is a perfect defense. Valid online contacts do not need to know your private banking details.",
                wrongDetail: "Discussing specific inheritance amounts confirmed you had the 42 lakhs. This information is what triggered the final 'emergency' and blackmail phase."
              },
              {
                id: 'emergency',
                title: 'Option C: "I cannot send money to anyone online"',
                isCorrect: decisions.some(d => d.label.includes("I cannot send money to anyone online")),
                correctDetail: "Maintaining a 'No Online Transfers' rule is a foolproof way to stay safe from romance fraud, regardless of how convincing the story sounds.",
                wrongDetail: "Attempting to verify an emergency or sending funds is the ultimate goal of the fraud. Scammers create fake crises to bypass your logical thinking."
              },
              {
                id: 'blackmail',
                title: 'Option C: Screenshot, Block, and Dial 1930',
                isCorrect: decisions.some(d => d.label.includes("Screenshot, Block, and Dial 1930")),
                correctDetail: "You handled the blackmail perfectly. Reporting to 1930 and blocking is the only way to stop the cycle. Paying never makes it go away.",
                wrongDetail: "Engagement/payment during blackmail only signals to the criminal that you are easy to squeeze for more. They never delete the evidence after payment."
              }
            ].map((audit, idx) => (
              <AuditItem key={idx} audit={audit} />
            ))}
          </div>

          {/* Final Advice Card */}
          <div className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-indigo-500/30 transition-colors"></div>
            <h4 className="font-black text-xl mb-3">A Message from the Cyber Cell</h4>
            <p className="text-slate-300 leading-relaxed text-sm mb-6">
              "You were targeted during a painful time. Scammers exploit grief, but you broke the chain by reporting it. Your actions protected yourself and 23 other potential victims."
            </p>
            <div className="flex justify-between items-center border-t border-white/10 pt-6">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Digital Signature</span>
                <span className="font-serif italic text-lg opacity-80 underline underline-offset-4 decoration-indigo-500">I.G. Cyber Crime Cell</span>
              </div>
              <button 
                onClick={() => setGameState('results')} 
                className="px-8 py-3 bg-white text-slate-900 font-black uppercase text-xs tracking-widest rounded-xl hover:bg-slate-100 transition shadow-lg hover:shadow-white/10 active:scale-95"
              >
                Sign & Finalize Results
              </button>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] pt-4 pb-4">
            cybercrime.gov.in • Helpline: 1930
            <br /><span>Team: Human Patch — Amrita Vishwa Vidyapeetham</span>
          </div>
        </div>
      </div>
    );
  }
};

export default Level10;
