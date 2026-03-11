import React, { useState, useEffect, useCallback, useRef } from 'react';

const GRID_W = 20;
const GRID_H = 12;
const CELL_SIZE = 40; // 800 x 480 game board

// Path nodes (in grid coordinates)
const PATH_NODES = [
    { x: -1, y: 2 },
    { x: 4, y: 2 },
    { x: 4, y: 9 },
    { x: 10, y: 9 },
    { x: 10, y: 3 },
    { x: 16, y: 3 },
    { x: 16, y: 7 },
    { x: 20, y: 7 }
];

const TOWER_TYPES = {
    FIREWALL: { id: 'FIREWALL', name: 'Firewall', cost: 50, range: 120, damage: 20, cooldown: 15, color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500', icon: '🧱' },
    RATELIMITER: { id: 'RATELIMITER', name: 'Rate Limiter', cost: 100, range: 100, damage: 10, cooldown: 8, slowFactor: 0.5, color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500', icon: '⏱️' },
    WAF: { id: 'WAF', name: 'WAF', cost: 150, range: 160, damage: 50, cooldown: 45, splash: 60, color: 'text-indigo-400', bg: 'bg-indigo-500/20', border: 'border-indigo-500', icon: '🛡️' }
};

const ENEMY_TYPES = {
    BOTNET: { id: 'BOTNET', hp: 50, speed: 2.5, reward: 5, color: '#ef4444', name: 'Botnet Ping', size: 16 },
    VOLUMETRIC: { id: 'VOLUMETRIC', hp: 200, speed: 1.5, reward: 15, color: '#f97316', name: 'DDoS Flood', size: 24 },
    ZERODAY: { id: 'ZERODAY', hp: 50, speed: 4.0, reward: 10, color: '#a855f7', name: '0-Day Exploit', size: 12 },
    BOSS: { id: 'BOSS', hp: 1500, speed: 0.6, reward: 100, color: '#dc2626', name: 'Ransomware Core', size: 36 },
    HEAL: { id: 'HEAL', hp: 99999, speed: 1.5, reward: 0, color: '#22c55e', name: 'Security Patch', size: 16 } // Towers ignore this
};

const INITIAL_BANDWIDTH = 100;
const INITIAL_INTEGRITY = 100;

// Helper to get exact pixel coords for path
const getPathPixels = () => PATH_NODES.map(n => ({ x: n.x * CELL_SIZE + CELL_SIZE / 2, y: n.y * CELL_SIZE + CELL_SIZE / 2 }));
const PATH_PIXELS = getPathPixels();

const QUIZ_DATA = [
    {
        knowledge: "A Distributed Denial of Service (DDoS) attack attempts to make an online service unavailable by overwhelming it with traffic from multiple sources.",
        question: "What is the primary goal of a DDoS attack?",
        options: ["Steal passwords", "Overwhelm a service", "Install malware", "Encrypt files"],
        correctIndex: 1
    },
    {
        knowledge: "Botnets are networks of hijacked computer devices used to carry out various scams and cyberattacks, commonly DDoS attacks.",
        question: "What is a network of hijacked devices called in a DDoS attack?",
        options: ["Phishing Net", "Ransomware", "Botnet", "Trojan"],
        correctIndex: 2
    },
    {
        knowledge: "A Firewall monitors and controls incoming and outgoing network traffic based on predetermined security rules, acting as a barrier.",
        question: "What does a firewall base its traffic control decisions on?",
        options: ["Random chance", "Predetermined security rules", "User passwords", "Internet speed"],
        correctIndex: 1
    },
    {
        knowledge: "Rate limiting is used to control the amount of incoming and outgoing traffic to or from a network. It helps prevent API abuse and DDoS attacks.",
        question: "How does rate limiting help against attacks?",
        options: ["Speeds up connection", "Controls traffic amount", "Decrypts packets", "Blocks all users"],
        correctIndex: 1
    },
    {
        knowledge: "A Web Application Firewall (WAF) helps protect web applications by filtering and monitoring HTTP traffic between a web application and the Internet.",
        question: "What kind of traffic does a WAF primarily monitor?",
        options: ["HTTP traffic", "Bluetooth signals", "Physical mail", "Voice calls"],
        correctIndex: 0
    },
    {
        knowledge: "Volumetric attacks aim to consume the bandwidth either within the target network/service, or between the target network/service and the rest of the Internet.",
        question: "What resource do volumetric attacks aim to consume?",
        options: ["CPU power", "Storage space", "Screen resolution", "Bandwidth"],
        correctIndex: 3
    },
    {
        knowledge: "Protocol attacks, also known as state-exhaustion attacks, cause a service disruption by consuming actual server resources, or those of intermediate communication equipment like firewalls.",
        question: "Which components are targeted in state-exhaustion attacks?",
        options: ["User endpoints", "Server resources and firewalls", "Database backups", "Cooling fans"],
        correctIndex: 1
    },
    {
        knowledge: "Application layer attacks (Layer 7) aim to exhaust the resources of the application itself rather than the network, making them harder to detect.",
        question: "Why are application layer attacks often hard to detect?",
        options: ["They are invisible", "They use normal-looking requests", "They occur at night", "They are too fast"],
        correctIndex: 1
    },
    {
        knowledge: "A zero-day exploit is a cyber attack that occurs on the same day a weakness is discovered in software, meaning developers have zero days to fix it.",
        question: "What characterizes a zero-day exploit?",
        options: ["It takes zero days to plan", "Developers have zero days to fix it before attack", "It causes zero damage", "It affects zero users"],
        correctIndex: 1
    },
    {
        knowledge: "Anycast network routing can scatter DDoS traffic across a distributed network of servers, absorbing the attack and keeping the service online.",
        question: "How does Anycast routing help mitigate DDoS attacks?",
        options: ["By encrypting traffic", "By distributing traffic across servers", "By changing passwords", "By banning IP addresses"],
        correctIndex: 1
    },
    {
        knowledge: "Ping of Death is a type of denial of service attack in which an attacker attempts to crash, destabilize, or freeze the targeted computer or service by sending malformed or oversized packets.",
        question: "What does a Ping of Death attack send to a target?",
        options: ["Small requests", "Malformed or oversized packets", "Phishing emails", "Fake access tokens"],
        correctIndex: 1
    },
    {
        knowledge: "SYN Floods exploit the TCP handshake process by sending a succession of SYN requests to a target's system in an attempt to consume enough server resources to make the system unresponsive to legitimate traffic.",
        question: "Which protocol's handshake is exploited in a SYN Flood?",
        options: ["UDP", "ICMP", "TCP", "HTTP"],
        correctIndex: 2
    },
    {
        knowledge: "An HTTP flood attack is a type of Layer 7 application attack that utilizes standard valid GET or POST requests to overwhelm a web server or application.",
        question: "What type of requests are used in an HTTP flood?",
        options: ["Invalid ICMP packets", "Valid GET or POST requests", "Encrypted SSH requests", "DNS queries"],
        correctIndex: 1
    },
    {
        knowledge: "Blackhole routing is a countermeasure where a network administrator or ISP routes all traffic (good and bad) intended for the targeted IP address to a null route (a 'black hole').",
        question: "What is the downside of blackhole routing?",
        options: ["It routes away legitimate traffic as well", "It is illegal", "It costs too much", "It speeds up the attack"],
        correctIndex: 0
    },
    {
        knowledge: "A CAPTCHA is often used during DDoS mitigation to differentiate between human users and automated bots that might be participating in a Layer 7 attack.",
        question: "What is the purpose of a CAPTCHA in DDoS mitigation?",
        options: ["To slow down the internet", "To block all traffic", "To differentiate humans from bots", "To test user intelligence"],
        correctIndex: 2
    },
    {
        knowledge: "DNS Amplification attacks use publicly accessible open DNS servers to flood a target system with DNS response traffic, essentially 'amplifying' the attacker's bandwidth.",
        question: "Which servers are abused in a DNS Amplification attack?",
        options: ["Closed database servers", "Open DNS servers", "Email servers", "Local print servers"],
        correctIndex: 1
    },
    {
        knowledge: "Intrusion Detection Systems (IDS) monitor network traffic for suspicious activity and issue alerts when such activity is discovered.",
        question: "What is the primary function of an IDS?",
        options: ["To block traffic", "To monitor and alert on suspicious activity", "To format hard drives", "To route traffic faster"],
        correctIndex: 1
    },
    {
        knowledge: "BGP (Border Gateway Protocol) is often involved in both mitigating DDoS attacks (by routing null traffic) and sometimes causing them if routes are hijacked.",
        question: "What protocol is used to route internet traffic between autonomous systems?",
        options: ["HTTP", "FTP", "BGP", "SMTP"],
        correctIndex: 2
    },
    {
        knowledge: "Spoofing involves changing the source IP address of the attacking packets so that it looks like they are coming from a different, often trusted, source.",
        question: "Why do attackers use IP spoofing?",
        options: ["To increase packet speed", "To hide their true identity or location", "To compress data", "To improve their own security"],
        correctIndex: 1
    },
    {
        knowledge: "Cloud-based DDoS protection services filter traffic through their massive scrubbing centers before it reaches the customer's origin server.",
        question: "Where do cloud-based protection services typically filter traffic?",
        options: ["In scrubbing centers", "On the user's laptop", "In the local ISP switch", "Inside the attacker's network"],
        correctIndex: 0
    },
    {
        knowledge: "Over-provisioning is a passive defense strategy where a company buys more bandwidth than it usually needs, allowing it to absorb small to medium volumetric attacks.",
        question: "What is the strategy of buying extra bandwidth called?",
        options: ["Under-provisioning", "Over-provisioning", "Bandwidth throttling", "Data capping"],
        correctIndex: 1
    },
    {
        knowledge: "Slowloris is a highly-targeted attack that allows a single machine to take down another machine's web server with minimal bandwidth and side effects on unrelated services.",
        question: "What makes Slowloris unique compared to volumetric attacks?",
        options: ["It requires massive bandwidth", "It requires minimal bandwidth", "It only targets databases", "It uses physical hardware damage"],
        correctIndex: 1
    },
    {
        knowledge: "IoT (Internet of Things) devices, like smart cameras and refrigerators, are often targeted by malware (like Mirai) to form massive botnets because they typically have weak default security.",
        question: "Why are IoT devices frequent targets for botnet recruitment?",
        options: ["They have very strong CPUs", "They typically have weak default security", "They are never connected to the internet", "They move around a lot"],
        correctIndex: 1
    },
    {
        knowledge: "The best defense against modern, multi-vector DDoS attacks is a hybrid approach, combining on-premise appliances for quick detection with cloud-based scrubbing for massive volume.",
        question: "What does a hybrid DDoS defense approach combine?",
        options: ["Two different ISP connections", "Antivirus and Firewalls", "On-premise appliances and cloud scrubbing", "Mac and Windows servers"],
        correctIndex: 2
    }
];

const DDOSDefense = ({ onBack }) => {
    const [gameState, setGameState] = useState('start'); // start, playing, paused, won, over, quiz
    const [bandwidth, setBandwidth] = useState(INITIAL_BANDWIDTH);
    const [integrity, setIntegrity] = useState(INITIAL_INTEGRITY);
    const [wave, setWave] = useState(1);
    const [selectedTower, setSelectedTower] = useState(null);
    const [hoverCell, setHoverCell] = useState(null);
    const [gameSpeed, setGameSpeed] = useState(1); // 0.5x, 1x, 2x, 4x
    const [quizIndex, setQuizIndex] = useState(0);
    const [quizAnswered, setQuizAnswered] = useState(null); // null, correct, wrong
    const [waveComposition, setWaveComposition] = useState({
        BOTNET: 0,
        VOLUMETRIC: 0,
        ZERODAY: 0,
        BOSS: 0
    });

    const requestRef = useRef();
    const [renderTrigger, setRenderTrigger] = useState(0);

    // Game state refs (mutated in loops)
    const enemiesRef = useRef([]);
    const towersRef = useRef([]);
    const projectilesRef = useRef([]);
    const particlesRef = useRef([]);
    const frameCountRef = useRef(0);
    const waveStateRef = useRef({
        active: false,
        spawnsRemaining: [],
        spawnTimer: 0
    });

    const isPathCell = (gx, gy) => {
        for (let i = 0; i < PATH_NODES.length - 1; i++) {
            const p1 = PATH_NODES[i];
            const p2 = PATH_NODES[i + 1];
            const minX = Math.min(p1.x, p2.x);
            const maxX = Math.max(p1.x, p2.x);
            const minY = Math.min(p1.y, p2.y);
            const maxY = Math.max(p1.y, p2.y);
            if (gx >= minX && gx <= maxX && gy >= minY && gy <= maxY) return true;
        }
        return false;
    };

    const handleGridClick = (gx, gy) => {
        if (gameState !== 'playing' || !selectedTower) return;
        if (isPathCell(gx, gy)) return;

        // Check if tower already exists
        const exists = towersRef.current.find(t => t.gx === gx && t.gy === gy);
        if (exists) return;

        const towerDef = TOWER_TYPES[selectedTower];
        if (bandwidth >= towerDef.cost) {
            setBandwidth(b => b - towerDef.cost);
            towersRef.current.push({
                ...towerDef,
                id: Math.random().toString(),
                gx, gy,
                x: gx * CELL_SIZE + CELL_SIZE / 2,
                y: gy * CELL_SIZE + CELL_SIZE / 2,
                cooldownTimer: 0,
                targetAngle: 0
            });
            setSelectedTower(null);
            spawnParticles(gx * CELL_SIZE + CELL_SIZE / 2, gy * CELL_SIZE + CELL_SIZE / 2, '#22d3ee', 15);
        }
    };

    const spawnParticles = (x, y, color, count = 10) => {
        for (let i = 0; i < count; i++) {
            particlesRef.current.push({
                id: Math.random(),
                x, y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1,
                color
            });
        }
    };

    const startNextWave = () => {
        if (waveStateRef.current.active) return;

        let spawns = [];
        // Boss wave every 5 levels
        const isBossWave = wave % 5 === 0;

        // After wave 5, enemy count explodes
        let numEnemies = wave > 5 ? Math.floor(5 + (wave * 4) + Math.pow(wave - 4, 1.8)) : 5 + Math.floor(wave * 4);

        if (isBossWave) {
            numEnemies = Math.floor(numEnemies / 3); // drastically reduce small enemies
            spawns.push(ENEMY_TYPES.BOSS); // Add the boss first
        }

        for (let i = 0; i < numEnemies; i++) {
            let type = ENEMY_TYPES.BOTNET;
            if (wave > 2 && Math.random() < Math.min(0.6, 0.15 + (wave * 0.05))) type = ENEMY_TYPES.VOLUMETRIC;
            if (wave > 4 && Math.random() < Math.min(0.5, 0.1 + (wave * 0.05))) type = ENEMY_TYPES.ZERODAY;
            spawns.push(type);
        }

        // Add 1-2 green heal packets randomly after wave 10
        if (wave > 10) {
            const numHeals = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < numHeals; i++) {
                spawns.splice(Math.floor(Math.random() * spawns.length), 0, ENEMY_TYPES.HEAL);
            }
        }

        waveStateRef.current = {
            active: true,
            spawnsRemaining: spawns,
            spawnTimer: 60
        };

        // Calculate composition for display
        const composition = { BOTNET: 0, VOLUMETRIC: 0, ZERODAY: 0, BOSS: 0 };
        spawns.forEach(s => {
            if (s.id === 'BOTNET') composition.BOTNET++;
            else if (s.id === 'VOLUMETRIC') composition.VOLUMETRIC++;
            else if (s.id === 'ZERODAY') composition.ZERODAY++;
            else if (s.id === 'BOSS') composition.BOSS++;
        });
        setWaveComposition(composition);
    };

    const handleDamage = (amt) => {
        setIntegrity(prev => {
            const next = prev - amt;
            if (next <= 0) setGameState('over');
            return next;
        });
    };

    const handleQuizAnswer = (idx) => {
        setQuizAnswered(idx);
        const completedWave = wave - 1;
        const currentData = QUIZ_DATA[quizIndex];
        if (idx === currentData.correctIndex) {
            const reward = Math.floor((completedWave - 1) / 5) * 5 + 5;
            setBandwidth(b => b + reward);
        }
    };

    const gameLoop = useCallback(() => {
        if (gameState !== 'playing') {
            requestRef.current = requestAnimationFrame(gameLoop);
            return;
        }

        // Apply game speed: run the inner simulation multiple times if speed > 1
        // If speed < 1, skip frames

        let iters = 1;
        let skipFrame = false;

        if (gameSpeed === 0.5) {
            if (renderTrigger % 2 === 0) skipFrame = true;
        } else {
            iters = gameSpeed;
        }

        if (!skipFrame) {
            for (let i = 0; i < iters; i++) {
                frameCountRef.current++;

                // Spawn logic
                if (waveStateRef.current.active) {
                    if (waveStateRef.current.spawnTimer <= 0 && waveStateRef.current.spawnsRemaining.length > 0) {
                        // Determine how many enemies to spawn this tick (burst spawning)
                        // Wave 1-2: 1 enemy. Wave 3+: 1-2 enemies. Wave 5+: 1-3 enemies.
                        let spawnCount = 1;
                        if (wave > 2 && Math.random() < 0.3) spawnCount = 2;
                        if (wave > 4 && Math.random() < 0.4) spawnCount = Math.floor(Math.random() * 3) + 1; // 1 to 3

                        // Spawn the calculated number of enemies
                        for (let i = 0; i < spawnCount; i++) {
                            if (waveStateRef.current.spawnsRemaining.length === 0) break;

                            const type = waveStateRef.current.spawnsRemaining.shift();

                            // Scale health exponentially after wave 5
                            let healthMultiplier = 1 + ((wave - 1) * 0.15);
                            if (wave > 5) {
                                healthMultiplier = 1 + ((wave - 1) * 0.15) + Math.pow(wave - 4, 1.5) * 0.4;
                            }

                            // Add slight offset so they don't perfectly overlap visually if spawning instantly
                            const offset = (Math.random() - 0.5) * 10;

                            enemiesRef.current.push({
                                ...type,
                                id: Math.random().toString(),
                                pathIndex: 0,
                                x: PATH_PIXELS[0].x + offset,
                                y: PATH_PIXELS[0].y + offset,
                                slowTimer: 0,
                                maxHp: type.hp * healthMultiplier,
                                hp: type.hp * healthMultiplier
                            });
                        }

                        // Spawns get extremely rapid after wave 5
                        const minSpawnRate = wave > 5 ? Math.max(5, 15 - (wave - 5) * 2) : 15;
                        waveStateRef.current.spawnTimer = Math.max(minSpawnRate, 40 + Math.random() * 40 - (wave * 3)); // gets faster and cap speed
                    }
                    if (waveStateRef.current.spawnTimer > 0) {
                        waveStateRef.current.spawnTimer--;
                    }
                    if (waveStateRef.current.spawnsRemaining.length === 0 && enemiesRef.current.length === 0) {
                        waveStateRef.current.active = false; // Wave cleared
                        const currentWave = wave;
                        if (currentWave >= 25) {
                            setGameState('won');
                        } else {
                            setGameState('quiz');
                            setQuizIndex(currentWave - 1);
                            setQuizAnswered(null);
                            setWave(w => w + 1);
                        }
                    }
                }

                // Move enemies
                for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
                    const e = enemiesRef.current[i];
                    const target = PATH_PIXELS[e.pathIndex + 1];
                    if (!target) {
                        // Reached end
                        enemiesRef.current.splice(i, 1);

                        if (e.id === 'HEAL') {
                            // Heal the server
                            setIntegrity(prev => Math.min(100, prev + 15));
                            spawnParticles(PATH_PIXELS[PATH_PIXELS.length - 1].x, PATH_PIXELS[PATH_PIXELS.length - 1].y, '#22c55e', 20);
                        } else {
                            handleDamage(e.maxHp / 10); // Deduct integrity based on enemy size
                        }

                        continue;
                    }

                    const dx = target.x - e.x;
                    const dy = target.y - e.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    let currentSpeed = e.speed;
                    if (e.slowTimer > 0) {
                        currentSpeed *= 0.5;
                        e.slowTimer--;
                    }

                    if (dist < currentSpeed) {
                        e.x = target.x;
                        e.y = target.y;
                        e.pathIndex++;
                    } else {
                        e.x += (dx / dist) * currentSpeed;
                        e.y += (dy / dist) * currentSpeed;
                    }
                }

                // Towers acquire targets & shoot
                towersRef.current.forEach(tower => {
                    if (tower.cooldownTimer > 0) tower.cooldownTimer--;

                    // Find closest non-heal enemy in range
                    let target = null;
                    let minDist = tower.range;
                    enemiesRef.current.forEach(e => {
                        if (e.id === 'HEAL') return; // Do not shoot the heal packets

                        const dist = Math.sqrt(Math.pow(e.x - tower.x, 2) + Math.pow(e.y - tower.y, 2));
                        if (dist < minDist) {
                            minDist = dist;
                            target = e;
                        }
                    });

                    if (target) {
                        // Face target
                        tower.targetAngle = Math.atan2(target.y - tower.y, target.x - tower.x) * (180 / Math.PI);

                        if (tower.cooldownTimer <= 0) {
                            tower.cooldownTimer = tower.cooldown;
                            // Shoot projectile
                            projectilesRef.current.push({
                                id: Math.random(),
                                x: tower.x, y: tower.y,
                                targetId: target.id,
                                targetX: target.x, targetY: target.y,
                                damage: tower.damage,
                                slowFactor: tower.slowFactor,
                                splash: tower.splash,
                                color: tower.color.includes('cyan') ? '#22d3ee' : tower.color.includes('indigo') ? '#818cf8' : '#34d399',
                                speed: 18 // Faster projectiles
                            });
                        }
                    }
                });

                // Update projectiles
                for (let i = projectilesRef.current.length - 1; i >= 0; i--) {
                    const p = projectilesRef.current[i];
                    const target = enemiesRef.current.find(e => e.id === p.targetId);
                    const tx = target ? target.x : p.targetX;
                    const ty = target ? target.y : p.targetY;

                    const dx = tx - p.x;
                    const dy = ty - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < p.speed) {
                        // Hit
                        projectilesRef.current.splice(i, 1);

                        // Apply damage
                        const appliesDamage = (enemy, dmg) => {
                            enemy.hp -= dmg;
                            if (p.slowFactor) enemy.slowTimer = 60;
                            if (enemy.hp <= 0) {
                                spawnParticles(enemy.x, enemy.y, enemy.color, 15);
                                setBandwidth(b => b + enemy.reward);
                                return true; // killed
                            }
                            return false;
                        };

                        if (target) {
                            if (p.splash) {
                                spawnParticles(tx, ty, p.color, 20); // big explosion
                                enemiesRef.current.forEach(e => {
                                    if (Math.sqrt(Math.pow(e.x - tx, 2) + Math.pow(e.y - ty, 2)) <= p.splash) {
                                        appliesDamage(e, p.damage);
                                    }
                                });
                            } else {
                                appliesDamage(target, p.damage);
                            }
                        }
                    } else {
                        p.x += (dx / dist) * p.speed;
                        p.y += (dy / dist) * p.speed;
                    }
                }

                // Clean up dead enemies
                enemiesRef.current = enemiesRef.current.filter(e => e.hp > 0);

                // Update particles
                particlesRef.current.forEach(p => {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.life -= 0.04;
                });
                particlesRef.current = particlesRef.current.filter(p => p.life > 0);
            }
        }

        setRenderTrigger(prev => prev + 1);
        requestRef.current = requestAnimationFrame(gameLoop);
    }, [gameState, wave, gameSpeed, renderTrigger]);

    useEffect(() => {
        requestRef.current = requestAnimationFrame(gameLoop);
        return () => cancelAnimationFrame(requestRef.current);
    }, [gameLoop]);

    const startGame = () => {
        setGameState('playing');
        setBandwidth(INITIAL_BANDWIDTH);
        setIntegrity(INITIAL_INTEGRITY);
        setWave(1);
        enemiesRef.current = [];
        towersRef.current = [];
        projectilesRef.current = [];
        particlesRef.current = [];
        waveStateRef.current = { active: false, spawnsRemaining: [], spawnTimer: 0 };
        setRenderTrigger(0);
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#f4f7fb] p-6 animate-fade-in relative z-0 overflow-hidden font-sans">
            {/* Premium Dynamic Background */}
            <div className="absolute inset-0 z-[-1] pointer-events-none overflow-hidden">
                {/* Soft ambient gradients */}
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-200/40 rounded-full blur-[120px] mix-blend-multiply animate-[pulse_10s_ease-in-out_infinite]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-200/40 rounded-full blur-[100px] mix-blend-multiply animate-[pulse_12s_ease-in-out_infinite_reverse]"></div>
                
                {/* Tech Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:3vw_3vw] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] opacity-40"></div>
                
                {/* Animated Scanner Lines */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-[scan_6s_ease-in-out_infinite] opacity-30"></div>
                <div className="absolute top-0 left-[20%] w-[2px] h-full bg-gradient-to-b from-transparent via-indigo-400 to-transparent animate-[scanVertical_8s_ease-in-out_infinite] opacity-20"></div>
                
                {/* Floating Tech Elements */}
                <div className="absolute top-[15%] left-[10%] w-24 h-24 border border-slate-300/50 rounded-full animate-[spin_20s_linear_infinite] flex items-center justify-center">
                    <div className="w-16 h-16 border border-slate-300/30 rounded-full border-dashed animate-[spin_15s_linear_infinite_reverse]"></div>
                </div>
                <div className="absolute bottom-[20%] right-[15%] w-32 h-32 border border-slate-300/40 rounded-full animate-[spin_25s_linear_infinite_reverse] flex items-center justify-center">
                    <div className="w-20 h-20 border border-slate-300/20 rounded-full border-dashed animate-[spin_18s_linear_infinite]"></div>
                </div>
                
                {/* Data Nodes */}
                <div className="absolute top-[30%] right-[25%] flex gap-2 opacity-40">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-75"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-150"></div>
                </div>
                <div className="absolute bottom-[25%] left-[25%] flex flex-col gap-2 opacity-30">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-ping"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-ping delay-100"></div>
                </div>
            </div>

            {/* Header / HUD */}
            <div className="w-full max-w-5xl flex justify-between items-center mb-6 z-10">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                        <span className="text-3xl animate-pulse text-red-500">🛡️</span>
                        DDoS Defense
                    </h2>
                    <p className="text-slate-500 font-mono text-xs uppercase tracking-widest mt-1">Fortify Core Infrastructure</p>
                </div>

                <div className="flex items-center gap-6 bg-white/90 backdrop-blur-md border-slate-200 px-6 py-2 rounded-full border border-slate-300 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-mono uppercase">Wave</span>
                        <span className="text-indigo-400 font-black text-xl tabular-nums leading-none tracking-wider">{wave}</span>
                    </div>
                    <div className="h-8 w-px bg-slate-300 mx-2"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-mono uppercase">Bandwidth</span>
                        <span className="text-emerald-400 font-mono font-bold text-xl tabular-nums leading-none flex items-center gap-1">
                            <span className="text-emerald-600 text-sm">₹</span>{bandwidth}
                        </span>
                    </div>
                    <div className="h-8 w-px bg-slate-300 mx-2"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-mono uppercase">System Integrity</span>
                        <div className="flex items-center gap-2">
                            <span className={`font-mono font-bold text-xl tabular-nums leading-none ${integrity < 30 ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                                {Math.max(0, Math.floor(integrity))}%
                            </span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onBack}
                    className="px-6 py-2 bg-slate-700 hover:bg-slate-800 rounded-lg text-white transition-all font-mono text-xs uppercase shadow-md"
                >
                    Abandon Link
                </button>
            </div>

            {/* Main Game Area */}
            <div className="flex flex-wrap lg:flex-nowrap gap-6 w-full max-w-7xl relative justify-center items-start">

                {/* Tower Selection Menu */}
                <div className="w-64 flex flex-col gap-4">
                    <div className="bg-white/80 border border-slate-300 rounded-xl p-4 shadow-lg backdrop-blur-md">
                        <h3 className="text-slate-500 font-mono text-sm uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">Defense Arsenal</h3>
                        <div className="flex flex-col gap-3">
                            {Object.values(TOWER_TYPES).map(tower => {
                                const canAfford = bandwidth >= tower.cost;
                                const isSelected = selectedTower === tower.id;
                                return (
                                    <div
                                        key={tower.id}
                                        onClick={() => canAfford && setSelectedTower(isSelected ? null : tower.id)}
                                        className={`p-3 rounded-lg border-2 transition-all cursor-pointer flex flex-col gap-2 ${isSelected ? `border-white ${tower.bg}` : canAfford ? `border-slate-300 hover:border-slate-500 bg-slate-200/50` : 'border-slate-200 bg-slate-100/80 opacity-50 cursor-not-allowed'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-600 flex items-center gap-2">
                                                <span>{tower.icon}</span> {tower.name}
                                            </span>
                                            <span className={`text-xs font-mono font-bold ${canAfford ? 'text-emerald-400' : 'text-red-500'}`}>${tower.cost}</span>
                                        </div>
                                        <div className="flex gap-2 text-[10px] uppercase font-mono text-slate-500">
                                            <span>DMG: {tower.damage}</span>
                                            <span>RNG: {tower.range}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Game Board */}
                <div
                    className="relative bg-white/60 backdrop-blur-xl border border-slate-300 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(15,23,42,0.1)] backdrop-filter"
                    style={{ width: GRID_W * CELL_SIZE, height: GRID_H * CELL_SIZE }}
                    onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const gx = Math.floor((e.clientX - rect.left) / CELL_SIZE);
                        const gy = Math.floor((e.clientY - rect.top) / CELL_SIZE);
                        setHoverCell({ x: gx, y: gy });
                    }}
                    onMouseLeave={() => setHoverCell(null)}
                    onClick={(e) => {
                        if (hoverCell) handleGridClick(hoverCell.x, hoverCell.y);
                    }}
                >
                    {/* Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] opacity-50" style={{ backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px` }}></div>

                    {/* Path Visuals */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        <polyline
                            points={PATH_PIXELS.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="#1e293b"
                            strokeWidth={CELL_SIZE - 4}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="drop-shadow-sm"
                        />
                        <polyline
                            points={PATH_PIXELS.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke="#06b6d4"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeDasharray="10 10"
                            className="animate-[dash_20s_linear_infinite] opacity-70"
                        />
                    </svg>


                    {/* Server Goal / Core */}
                    <div className="absolute z-10 flex flex-col items-center justify-center animate-pulse"
                        style={{ left: PATH_PIXELS[PATH_PIXELS.length - 1].x - 30, top: PATH_PIXELS[PATH_PIXELS.length - 1].y - 30, width: 60, height: 60 }}>
                        <div className="w-full h-full bg-cyan-500/20 rounded-full absolute blur-md"></div>
                        <div className="text-4xl">🖧</div>
                    </div>

                    {/* Hover indicator */}
                    {hoverCell && selectedTower && (
                        <div
                            className={`absolute flex items-center justify-center border-2 border-dashed z-20 transition-colors ${isPathCell(hoverCell.x, hoverCell.y) || towersRef.current.some(t => t.gx === hoverCell.x && t.gy === hoverCell.y) ? 'bg-red-500/20 border-red-500' : 'bg-emerald-500/20 border-emerald-500'}`}
                            style={{ left: hoverCell.x * CELL_SIZE, top: hoverCell.y * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}
                        >
                                <div
                                    className="absolute rounded-full border border-indigo-500/40 bg-indigo-500/10 pointer-events-none"
                                    style={{
                                        width: TOWER_TYPES[selectedTower].range * 2,
                                        height: TOWER_TYPES[selectedTower].range * 2,
                                        transform: 'translate(-50%, -50%)',
                                        left: '50%', top: '50%'
                                    }}
                                ></div>
                        </div>
                    )}

                    {/* rendering from refs */}
                    {gameState !== 'start' && (
                        <div className="absolute inset-0 pointer-events-none z-30">

                            {/* Towers */}
                            {towersRef.current.map(tower => (
                                <div key={tower.id} className="absolute flex items-center justify-center" style={{ left: tower.gx * CELL_SIZE, top: tower.gy * CELL_SIZE, width: CELL_SIZE, height: CELL_SIZE }}>
                                    <div className={`w-3/4 h-3/4 ${tower.bg} border ${tower.border} rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)]`}>
                                        <div
                                            className="text-lg transition-transform"
                                            style={{ transform: `rotate(${tower.targetAngle}deg)` }}
                                        >
                                            {tower.icon}
                                        </div>
                                    </div>
                                    {/* firing animation */}
                                    {tower.cooldownTimer === tower.cooldown - 1 && (
                                        <div className="absolute inset-0 border-2 border-white rounded-lg animate-ping opacity-50"></div>
                                    )}
                                </div>
                            ))}

                            {/* Enemies */}
                            {enemiesRef.current.map(enemy => (
                                <div key={enemy.id} className="absolute flex items-center justify-center" style={{ left: enemy.x - CELL_SIZE / 2, top: enemy.y - CELL_SIZE / 2, width: CELL_SIZE, height: CELL_SIZE }}>
                                    <div
                                        className="rounded shadow-[0_0_10px_currentColor]"
                                        style={{
                                            width: enemy.size, height: enemy.size,
                                            backgroundColor: enemy.slowTimer > 0 ? '#67e8f9' : enemy.color,
                                            color: enemy.color
                                        }}
                                    ></div>
                                    {/* HP Bar */}
                                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-slate-200 rounded overflow-hidden">
                                        <div className="h-full bg-red-500" style={{ width: `${(enemy.hp / enemy.maxHp) * 100}%` }}></div>
                                    </div>
                                </div>
                            ))}

                            {/* Projectiles */}
                            {projectilesRef.current.map(p => (
                                <div key={p.id} className="absolute rounded-full" style={{ left: p.x - 3, top: p.y - 3, width: 6, height: 6, backgroundColor: p.color, boxShadow: `0 0 8px ${p.color}` }}></div>
                            ))}

                            {/* Particles */}
                            {particlesRef.current.map(p => (
                                <div key={p.id} className="absolute rounded-sm" style={{ left: p.x, top: p.y, width: 4, height: 4, backgroundColor: p.color, opacity: p.life, transform: `scale(${p.life})`, boxShadow: `0 0 5px ${p.color}` }}></div>
                            ))}

                        </div>
                    )}
                </div>

                {/* Right Sidebar (Threat Analysis + Controls) */}
                <div className="w-60 flex flex-col gap-4 animate-fade-in hidden lg:flex">
                    {/* Threat Analysis Panel */}
                    <div className="bg-white/40 backdrop-blur-md border border-slate-300 rounded-xl p-4 shadow-xl pointer-events-none">
                        <div className="flex items-center gap-2 mb-3 border-b border-slate-300/50 pb-2">
                            <span className="text-red-500 animate-pulse text-sm">📡</span>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Threat Analysis</h4>
                        </div>
                        <div className="flex flex-col gap-3">
                            {[
                                { id: 'BOTNET', label: 'Botnet Pings', color: 'bg-red-400', count: waveComposition.BOTNET },
                                { id: 'VOLUMETRIC', label: 'DDoS Floods', color: 'bg-orange-400', count: waveComposition.VOLUMETRIC },
                                { id: 'ZERODAY', label: '0-Day Exploits', color: 'bg-purple-400', count: waveComposition.ZERODAY },
                                { id: 'BOSS', label: 'Ransomware', color: 'bg-red-600', count: waveComposition.BOSS }
                            ].map(item => (
                                <div key={item.id} className={`flex flex-col gap-1 transition-opacity duration-500 ${item.count > 0 ? 'opacity-100' : 'opacity-20'}`}>
                                    <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-600">
                                        <span>{item.label}</span>
                                        <span>{item.count}</span>
                                    </div>
                                    <div className="w-full h-1 bg-slate-200/50 rounded-full overflow-hidden border border-slate-300/20">
                                        <div 
                                            className={`h-full ${item.color} transition-all duration-1000 ease-out`}
                                            style={{ width: item.count > 0 ? '100%' : '0%' }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 pt-2 border-t border-slate-300/30">
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 uppercase">
                                <span>Risk Level</span>
                                <span className={wave > 15 ? 'text-red-500' : wave > 10 ? 'text-orange-500' : wave > 5 ? 'text-yellow-600' : 'text-emerald-500'}>
                                    {wave > 15 ? 'Critical' : wave > 10 ? 'High' : wave > 5 ? 'Moderate' : 'Low'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Controls Panel */}
                    <div className="bg-white/40 backdrop-blur-md border border-slate-300 rounded-xl p-4 shadow-xl flex flex-col gap-3">
                        {!waveStateRef.current.active ? (
                            <button
                                onClick={startNextWave}
                                className="w-full py-3 bg-indigo-500 text-slate-900 rounded-lg font-black uppercase tracking-[0.1em] text-xs hover:bg-indigo-400 transition-all shadow-[0_4px_12px_rgba(99,102,241,0.2)]"
                            >
                                Initiate Wave {wave}
                            </button>
                        ) : (
                            <div className="py-3 px-4 bg-slate-100/50 border border-slate-200 rounded-lg text-center">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest animate-pulse">Wave Active</span>
                            </div>
                        )}

                        <div className="flex gap-1">
                            {[0.5, 1, 2, 4].map(speed => (
                                <button
                                    key={speed}
                                    onClick={() => setGameSpeed(speed)}
                                    className={`flex-1 py-1.5 rounded-md border text-[10px] font-mono font-bold transition-all ${gameSpeed === speed ? 'bg-indigo-500 text-white border-indigo-600' : 'bg-white/50 text-slate-500 border-slate-200 hover:border-slate-300'}`}
                                >
                                    {speed}x
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

            </div>

            {/* Overlays */}
            {gameState === 'quiz' && (
                <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center z-50 backdrop-blur-md p-6">
                    <div className="bg-white p-8 rounded-2xl flex flex-col items-start w-full max-w-2xl shadow-2xl border-4 border-indigo-500">
                        <h3 className="text-2xl font-black text-indigo-600 mb-4 uppercase tracking-widest border-b-2 border-slate-100 pb-2 w-full">Wave {wave - 1} Cleared: Security Briefing</h3>
                        <p className="text-slate-700 text-lg mb-6 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200 w-full">
                            {QUIZ_DATA[quizIndex]?.knowledge}
                        </p>
                        <div className="w-full mb-6">
                            <p className="font-bold text-slate-800 mb-4 text-xl">{QUIZ_DATA[quizIndex]?.question}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {QUIZ_DATA[quizIndex]?.options.map((opt, idx) => {
                                    let btnClass = "p-4 text-left border-2 rounded-xl font-medium transition-all ";
                                    if (quizAnswered === null) {
                                        btnClass += "border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-slate-700 cursor-pointer";
                                    } else {
                                        if (idx === QUIZ_DATA[quizIndex].correctIndex) {
                                            btnClass += "border-emerald-500 bg-emerald-100 text-emerald-800";
                                        } else if (quizAnswered === idx) {
                                            btnClass += "border-red-500 bg-red-100 text-red-800";
                                        } else {
                                            btnClass += "border-slate-200 bg-slate-50 text-slate-400 opacity-50";
                                        }
                                    }
                                    return (
                                        <button
                                            key={idx}
                                            disabled={quizAnswered !== null}
                                            onClick={() => handleQuizAnswer(idx)}
                                            className={btnClass}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        {quizAnswered !== null && (
                            <div className={`w-full p-4 rounded-xl mb-6 ${quizAnswered === QUIZ_DATA[quizIndex].correctIndex ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                <p className="font-bold">
                                    {quizAnswered === QUIZ_DATA[quizIndex].correctIndex 
                                        ? `Correct! +$${Math.floor(((wave - 1) - 1) / 5) * 5 + 5} Bandwidth added.` 
                                        : `Incorrect. The correct answer was: ${QUIZ_DATA[quizIndex].options[QUIZ_DATA[quizIndex].correctIndex]}`}
                                </p>
                            </div>
                        )}
                        {quizAnswered !== null && (
                            <button
                                onClick={() => setGameState('playing')}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase tracking-widest transition-all"
                            >
                                Continue Defense
                            </button>
                        )}
                    </div>
                </div>
            )}

            {gameState === 'won' && (
                <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center z-50 backdrop-blur-md p-6">
                    <div className="bg-emerald-900/40 border border-emerald-500/50 p-8 rounded-2xl flex flex-col items-center text-center max-w-lg shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                        <span className="text-6xl mb-4 animate-bounce">🏆</span>
                        <h3 className="text-3xl font-black text-emerald-400 mb-2 uppercase">Network Secured</h3>
                        <p className="text-emerald-100 mb-6">You successfully defended the core infrastructure through all 25 waves!</p>
                        <p className="text-slate-300 font-mono mb-8 bg-slate-900/50 p-3 rounded-lg border border-emerald-500/30">Final System Integrity: {Math.max(0, Math.floor(integrity))}%</p>
                        <button
                            onClick={onBack}
                            className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition-all uppercase tracking-widest font-bold font-mono text-sm shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                        >
                            Return to Base
                        </button>
                    </div>
                </div>
            )}

            {gameState === 'start' && (
                <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-50 backdrop-blur-md">
                    <div className="bg-white border-2 border-cyan-500/30 p-10 rounded-3xl flex flex-col items-center text-center max-w-lg shadow-[0_0_50px_rgba(34,211,238,0.2)]">
                        <div className="text-6xl mb-6">🌐</div>
                        <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">DDoS Defense Array</h3>
                        <p className="text-slate-500 mb-8">
                            Malicious traffic is attempting to overwhelm the core server. Build defenses on the grid to filter and drop malicious packets before they reach the core.
                        </p>
                        <button
                            onClick={startGame}
                            className="px-10 py-4 bg-cyan-600 text-slate-900 rounded-xl font-bold uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                        >
                            Initialize Defenses
                        </button>
                    </div>
                </div>
            )}

            {gameState === 'over' && (
                <div className="absolute inset-0 bg-red-950/90 flex flex-col items-center justify-center z-50 backdrop-blur-md">
                    <div className="bg-red-900/40 border border-red-500/50 p-8 rounded-2xl flex flex-col items-center text-center max-w-sm">
                        <span className="text-5xl mb-4 animate-bounce text-red-500">💥</span>
                        <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase">Server Down</h3>
                        <p className="text-red-600 mb-6">The core infrastructure was overwhelmed by traffic.</p>
                        <p className="text-slate-400 font-mono text-xs mb-8">Waves survived: {wave - 1}</p>
                        <button
                            onClick={startGame}
                            className="px-8 py-3 bg-red-600 text-slate-900 rounded hover:bg-red-500 transition-all uppercase tracking-widest font-bold font-mono text-sm shadow-[0_0_15px_rgba(220,38,38,0.5)]"
                        >
                            Reboot Array
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DDOSDefense;
