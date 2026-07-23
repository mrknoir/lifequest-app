// --- 1. STATE MANAGEMENT ---
const STORAGE_KEY = 'gamifiedRoutineState';
let appState = {
    level: 1,
    xp: 0,
    lifetimeXp: 0,
    tasks: [],
    logs: [], 
    lastLoginDate: '',
    multiplierDays: [6],
    unlockedThemes: ['matrix'], 
    activeTheme: 'matrix',
    threatLevel: 0,
    currentStreak: 0,
    isOverclocked: false,
    dailyBountyTask: null, 
    bountyDate: '',         
    stasisActiveUntil: '', 
    inventory: { scraper: 0 },
    implants: { STR: false, INT: false, DIS: false, CHR: false },
    operations: [],
    unlockedArtifacts: [],
    tutorialCompleted: false
};

// --- 1.5 AUDIO SYNTHESIZER ENGINE ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type, duration, vol = 0.05) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

const SFX = {
    clack: () => { playTone(800, 'square', 0.1); },
    success: () => { 
        playTone(440, 'sine', 0.1); 
        setTimeout(() => playTone(660, 'sine', 0.2), 100); 
    },
    combo: () => {
        playTone(523.25, 'square', 0.1); // C5
        setTimeout(() => playTone(659.25, 'square', 0.1), 100); // E5
        setTimeout(() => playTone(783.99, 'square', 0.2), 200); // G5
    },
    error: () => { playTone(150, 'sawtooth', 0.3, 0.1); },
    levelUp: () => { 
        [300, 400, 500, 600, 800].forEach((f, i) => setTimeout(() => playTone(f, 'square', 0.15, 0.1), i * 100)); 
    },
    attack: () => { playTone(100, 'sawtooth', 0.2, 0.1); }, // Low, crunchy hit sound
    bossDefeat: () => { 
        [200, 300, 400, 500, 800, 1200].forEach((f, i) => setTimeout(() => playTone(f, 'square', 0.1, 0.15), i * 80)); 
    },
    
    // --- RANK UP ACOUSTICS ---
    promotion: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.start(); osc.stop(audioCtx.currentTime + 0.8);
    },
    
    // --- ELITE MILESTONE ACOUSTICS ---
    diamond: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        // High-pitched glassy shatter using multiple high-frequency oscillators and rapid decay
        const freqs = [1200, 2400, 3600, 4800, 7200];
        freqs.forEach((freq, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = i % 2 === 0 ? 'square' : 'sawtooth';
            osc.frequency.setValueAtTime(freq + (Math.random() * 500), audioCtx.currentTime);
            // Rapid, sharp decay to simulate breaking glass
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2 + (Math.random() * 0.2));
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(); osc.stop(audioCtx.currentTime + 0.5);
        });
    },
    
    grandmaster: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        // Dark, pulsing red energy using a Low Frequency Oscillator (LFO)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const lfo = audioCtx.createOscillator(); 

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(55, audioCtx.currentTime); // Low ominous bass note

        lfo.type = 'sine';
        lfo.frequency.value = 5; // Throbs 5 times per second

        const lfoGain = audioCtx.createGain();
        lfoGain.gain.value = 0.4; // Depth of the throb

        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain); // Modulate the master amplitude to create the pulse

        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 3.0); 

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(); lfo.start();
        osc.stop(audioCtx.currentTime + 3.0); lfo.stop(audioCtx.currentTime + 3.0);
    },

    challenger: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        // Layer 1: Glorious Arpeggio
        const frequencies = [220, 330, 440, 554, 659, 880];
        frequencies.forEach((freq, i) => {
            setTimeout(() => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
                osc.connect(gain); gain.connect(audioCtx.destination);
                osc.start(); osc.stop(audioCtx.currentTime + 1.5);
            }, i * 120); 
        });
        
        // Layer 2: Heavy Bass Drop (Triggers at the peak of the arpeggio)
        setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 1.5);
            gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.start(); osc.stop(audioCtx.currentTime + 1.5);
        }, 600);
    }
};

// --- 1.6 RPG LEVELING ENGINE ---
window.getLevelData = function(totalXp) {
    const level = Math.floor(Math.sqrt(totalXp / 500)) + 1;
    const currentLevelBaseXp = 500 * Math.pow(level - 1, 2);
    const nextLevelBaseXp = 500 * Math.pow(level, 2);
    const xpNeededForNext = nextLevelBaseXp - currentLevelBaseXp;
    const xpInCurrentLevel = totalXp - currentLevelBaseXp;
    
    return {
        level: level,
        currentXp: xpInCurrentLevel,
        requiredXp: xpNeededForNext
    };
};

// --- 1.7 RANKED LADDER ENGINE ---
window.getRankData = function(level) {
    if (level >= 75) return { name: 'CHALLENGER', class: 'rank-challenger', icon: 'bi-gem' };
    if (level >= 50) return { name: 'GRANDMASTER', class: 'rank-grandmaster', icon: 'bi-shield-fill-check' };
    if (level >= 40) return { name: 'MASTER', class: 'rank-master', icon: 'bi-shield-fill-exclamation' };
    if (level >= 30) return { name: 'DIAMOND', class: 'rank-diamond', icon: 'bi-suit-diamond-fill' };
    if (level >= 25) return { name: 'EMERALD', class: 'rank-emerald', icon: 'bi-hexagon-fill' };
    if (level >= 20) return { name: 'PLATINUM', class: 'rank-platinum', icon: 'bi-record-circle-fill' };
    if (level >= 15) return { name: 'GOLD', class: 'rank-gold', icon: 'bi-star-fill' };
    if (level >= 10) return { name: 'SILVER', class: 'rank-silver', icon: 'bi-moon-fill' };
    if (level >= 5) return { name: 'BRONZE', class: 'rank-bronze', icon: 'bi-award-fill' };
    
    return { name: 'IRON', class: 'rank-iron', icon: 'bi-nut-fill' };
};

// --- 1.7.5 RANK PROGRESSION PREDICTOR ---
window.getNextRankData = function(level) {
    if (level < 5) return { name: 'BRONZE', reqLevel: 5, class: 'rank-bronze' };
    if (level < 10) return { name: 'SILVER', reqLevel: 10, class: 'rank-silver' };
    if (level < 15) return { name: 'GOLD', reqLevel: 15, class: 'rank-gold' };
    if (level < 20) return { name: 'PLATINUM', reqLevel: 20, class: 'rank-platinum' };
    if (level < 25) return { name: 'EMERALD', reqLevel: 25, class: 'rank-emerald' };
    if (level < 30) return { name: 'DIAMOND', reqLevel: 30, class: 'rank-diamond' };
    if (level < 40) return { name: 'MASTER', reqLevel: 40, class: 'rank-master' };
    if (level < 50) return { name: 'GRANDMASTER', reqLevel: 50, class: 'rank-grandmaster' };
    if (level < 75) return { name: 'CHALLENGER', reqLevel: 75, class: 'rank-challenger' };
    return null; // Apex Predator achieved
};

// --- 1.7.6 COMPETITIVE LADDER RENDERER ---
function renderLadder() {
    const container = document.getElementById('ladder-container');
    const xpDisplay = document.getElementById('ladder-total-xp');
    if (!container) return;
    
    container.innerHTML = '';
    xpDisplay.textContent = `LIFETIME: ${appState.lifetimeXp} XP`;

    const currentLvlData = getLevelData(appState.lifetimeXp);
    const currentRank = getRankData(currentLvlData.level);
    const nextRank = getNextRankData(currentLvlData.level);

    // Array of all ranks in descending order (Challenger at the top)
    const rankHierarchy = [
        { name: 'CHALLENGER', level: 75, class: 'rank-challenger', icon: 'bi-gem', desc: 'APEX PREDATOR' },
        { name: 'GRANDMASTER', level: 50, class: 'rank-grandmaster', icon: 'bi-shield-fill-check', desc: 'ELITE OPERATIVE' },
        { name: 'MASTER', level: 40, class: 'rank-master', icon: 'bi-shield-fill-exclamation', desc: 'VETERAN COMMANDER' },
        { name: 'DIAMOND', level: 30, class: 'rank-diamond', icon: 'bi-suit-diamond-fill', desc: 'TACTICAL EXPERT' },
        { name: 'EMERALD', level: 25, class: 'rank-emerald', icon: 'bi-hexagon-fill', desc: 'ADVANCED USER' },
        { name: 'PLATINUM', level: 20, class: 'rank-platinum', icon: 'bi-record-circle-fill', desc: 'SENIOR TECHNICIAN' },
        { name: 'GOLD', level: 15, class: 'rank-gold', icon: 'bi-star-fill', desc: 'EXPERIENCED' },
        { name: 'SILVER', level: 10, class: 'rank-silver', icon: 'bi-moon-fill', desc: 'SYS_ADMIN' },
        { name: 'BRONZE', level: 5, class: 'rank-bronze', icon: 'bi-award-fill', desc: 'INITIATE' },
        { name: 'IRON', level: 1, class: 'rank-iron', icon: 'bi-nut-fill', desc: 'NOVICE' }
    ];

    rankHierarchy.forEach(rank => {
        const isCurrent = rank.name === currentRank.name;
        const isAchieved = currentLvlData.level >= rank.level && !isCurrent;
        const isNext = nextRank && rank.name === nextRank.name;
        
        let cardStyle = 'bg-dark border-secondary opacity-50';
        let statusBadge = `<span class="badge bg-transparent border border-secondary text-secondary"><i class="bi bi-lock-fill me-1"></i>UNLOCKS @ LVL ${rank.level}</span>`;
        
        if (isCurrent) {
            cardStyle = `bg-black border-success shadow-lg" style="border-width: 2px !important;`;
            statusBadge = `<span class="badge bg-success text-dark shadow"><i class="bi bi-geo-alt-fill me-1"></i>CURRENT_TIER</span>`;
        } else if (isAchieved) {
            cardStyle = 'bg-transparent border-secondary opacity-75';
            statusBadge = `<span class="badge bg-secondary text-light">ACHIEVED</span>`;
        } else if (isNext) {
            const requiredXp = 500 * Math.pow(rank.level - 1, 2);
            const xpRemaining = requiredXp - appState.lifetimeXp;
            cardStyle = 'bg-black border-warning';
            statusBadge = `
                <div class="text-end">
                    <span class="badge bg-warning text-dark mb-1 flash-text"><i class="bi bi-crosshair me-1"></i>NEXT_MILESTONE</span><br>
                    <span class="text-warning small fw-bold mt-1 d-block">> REQ: ${xpRemaining} XP TO ASCEND</span>
                </div>
            `;
        }

        const rankCard = document.createElement('div');
        rankCard.className = `card p-3 ${cardStyle} transition-all`;
        
        rankCard.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div class="d-flex align-items-center">
                    <i class="bi ${rank.icon} fs-1 me-4 ${rank.class}"></i>
                    <div>
                        <h4 class="mb-0 fw-bold ${rank.class}" style="letter-spacing: 2px;">${rank.name}</h4>
                        <small class="text-muted fw-bold text-uppercase">> ${rank.desc} | BASE_LVL: ${rank.level}</small>
                    </div>
                </div>
                <div>
                    ${statusBadge}
                </div>
            </div>
        `;
        
        container.appendChild(rankCard);
    });
}

// --- 1.8 PROMOTION SEQUENCE CONTROLLER ---
window.showPromotionScreen = function(rankData) {
    const overlay = document.getElementById('promotion-overlay');
    const icon = document.getElementById('promo-icon');
    const rankText = document.getElementById('promo-rank');
    const contentDiv = document.querySelector('.promo-content');

    // Wipe old classes and inject new rank data
    icon.className = `bi ${rankData.icon}`;
    rankText.className = `fw-bold text-uppercase mt-2 mb-4 ${rankData.class}`;
    
    // Clear all specific elite FX classes before evaluating
    contentDiv.classList.remove('promo-challenger', 'promo-grandmaster', 'promo-diamond'); 

    rankText.textContent = rankData.name;

    // Trigger the CSS scale-in animation
    overlay.classList.remove('d-none');
    void overlay.offsetWidth; // Force DOM reflow
    overlay.classList.add('active');

    // Evaluate acoustics and particle effects based on specific rank thresholds
    if (rankData.name === 'CHALLENGER') {
        contentDiv.classList.add('promo-challenger');
        SFX.challenger();
    } else if (rankData.name === 'GRANDMASTER') {
        contentDiv.classList.add('promo-grandmaster');
        SFX.grandmaster();
    } else if (rankData.name === 'DIAMOND') {
        contentDiv.classList.add('promo-diamond');
        SFX.diamond();
    } else {
        // Standard ranks (Bronze, Silver, Gold, etc.)
        SFX.promotion();
    }
};

window.closePromotion = function() {
    const overlay = document.getElementById('promotion-overlay');
    overlay.classList.remove('active');
    SFX.clack();
    setTimeout(() => { overlay.classList.add('d-none'); }, 400); 
};

// Example dynamic loadout mapped to RPG Attributes
const defaultTasks = [
    { name: 'Circuit Training Protocol', xp: 30, subtasks: ['Standing Oblique Crunch', 'Goblet Squats', 'Overhead Press'], activeDays: [0,1,2,3,4,5,6], attribute: 'STR', manual: "> PROTOCOL: STANDING OBLIQUE CRUNCH\n\n1. Target: Core & Obliques\n2. Stance: Stand tall, feet shoulder-width apart.\n3. Engagement: Keep core tight, hands behind your head.\n4. Execution: Bring left elbow down to meet your left knee as you lift it.\n5. Reps: 3 sets of 15 per side." },
    { name: 'CC 103: Java & SQL', xp: 50, subtasks: [], activeDays: [1,2,3,4,5], attribute: 'INT', manual: "" },
    { name: 'QCUROTC Field Prep', xp: 40, subtasks: ['Pack Type C Uniform', 'Iron Denim Pants', 'Wash White T-Shirt'], activeDays: [6], attribute: 'DIS', manual: "> SOP: MILITARY ATTIRE (TYPE C)\n\n- Plain white round-neck T-shirt (Must be pristine, no logos).\n- Standard issue denim pants (No rips or fading).\n- Inspect for complete uniformity prior to Saturday assembly." },
    { name: 'KyusiyuSphere Development', xp: 100, subtasks: ['Deploy Vercel Build', 'Manage Jira Tickets'], activeDays: [0,1,2,3,4,5,6], attribute: 'INT', manual: "> SOP: KYUSIYUSPHERE REPOSITORY\n\n- Ensure locator system database is synced.\n- DELIMITATION: Reservation functionality is out of scope. Do not merge reservation PRs.\n- Verify UI layout and SHA-256 encryption on admin dashboard before pushing to GitHub." }
];

function initApp() {
    // Look for permanent local data instead of session data
    const stored = localStorage.getItem(STORAGE_KEY);
    
    // If the data exists and isn't empty, parse it
    if (stored && stored !== 'null' && stored !== '') {
        appState = JSON.parse(stored);
        
        // Data Migration Fallbacks (Keep your existing fallbacks here)
        appState.tasks.forEach(t => { 
            if(!t.subtasks) t.subtasks = []; 
            if(!t.activeDays) t.activeDays = [0,1,2,3,4,5,6]; 
            if(!t.attribute) t.attribute = 'DIS'; 
            if(t.manual === undefined) t.manual = ""; 
            if(t.deadline === undefined) t.deadline = ""; 
        });

        if(!appState.multiplierDays) appState.multiplierDays = [6];
        if(!appState.unlockedThemes) appState.unlockedThemes = ['matrix'];
        if(!appState.activeTheme) appState.activeTheme = 'matrix';
        if(appState.threatLevel === undefined) appState.threatLevel = 0;
        if(appState.dailyBountyTask === undefined) appState.dailyBountyTask = null;
        if(appState.bountyDate === undefined) appState.bountyDate = '';
        if(appState.stasisActiveUntil === undefined) appState.stasisActiveUntil = '';
        if(appState.inventory === undefined) appState.inventory = { scraper: 0, time_turner: 0 };
        if(appState.implants === undefined) appState.implants = { STR: false, INT: false, DIS: false, CHR: false };
        if(appState.lifetimeXp === undefined) appState.lifetimeXp = appState.xp; 
        if(appState.unlockedArtifacts === undefined) appState.unlockedArtifacts = []; 
        if(appState.tutorialCompleted === undefined) appState.tutorialCompleted = false;
        
        if (!appState.operations) {
            appState.operations = [
                { name: 'OP: GENESIS_PROJECT', desc: 'TARGET: INITIALIZE TRACKER', maxHp: 1000, currentHp: 1000, defeated: false }
            ];
        }
    } else {
        // If it is a brand new initialization, load the default arrays
        appState.tasks = [...defaultTasks];
        appState.operations = [
            { name: 'OP: GENESIS_PROJECT', desc: 'TARGET: INITIALIZE TRACKER', maxHp: 1000, currentHp: 1000, defeated: false }
        ];
        saveState(); 
    }

    appState.level = getLevelData(appState.lifetimeXp).level;
    document.documentElement.className = `theme-${appState.activeTheme}`;
    checkMidnightRollover();
    assignDailyBounty(); 
    evaluateArtifacts(true);
    renderAll();
}

// --- BOUNTY ASSIGNMENT PROTOCOL ---
function assignDailyBounty() {
    const today = getTodayStr();
    if (appState.bountyDate !== today) {
        const todayNum = new Date().getDay();
        
        // Find tasks scheduled for today that aren't completed yet
        const activeTasks = appState.tasks.filter(t => t.activeDays.includes(todayNum));
        const incompleteTasks = activeTasks.filter(t => !appState.logs.includes(`${today}|${t.name}`));

        if (incompleteTasks.length > 0) {
            // Pick one completely at random
            const randomTask = incompleteTasks[Math.floor(Math.random() * incompleteTasks.length)];
            appState.dailyBountyTask = randomTask.name;
        } else {
            appState.dailyBountyTask = null; 
        }
        appState.bountyDate = today;
        saveState();
    }
}

// --- UPGRADED: PURE OFFLINE SAVE ENGINE ---
function saveState() {
    const payloadStr = JSON.stringify(appState);
    
    // Save to localStorage so it persists even if you close the browser tab or restart your PC
    localStorage.setItem(STORAGE_KEY, payloadStr);
}

function getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function checkMidnightRollover() {
    const today = getTodayStr();
    
    if (appState.lastLoginDate !== '' && appState.lastLoginDate !== today) {
        // IT IS A NEW DAY: Evaluate Threat!
        if (appState.stasisActiveUntil === today) {
            // Stasis is active! Virus cannot spread.
            console.log("SYS_MSG: STASIS PROTOCOL PREVENTED VIRUS SPREAD.");
        } else {
            appState.threatLevel = Math.min(100, appState.threatLevel + 25);
        }
    }
    
    if (appState.lastLoginDate !== today) {
        appState.lastLoginDate = today;
        assignDailyBounty();
        saveState();
        renderAll();
    }
    setTimeout(checkMidnightRollover, 60000); 
}

// Logs standard tasks AND acts as the final combo trigger
function logTask(taskName, xpReward, isCombo = false) {
    const logEntry = `${getTodayStr()}|${taskName}`;
    if (!appState.logs.includes(logEntry)) {
        appState.logs.push(logEntry);
        
        const todayNum = new Date().getDay();
        const isMultiplier = appState.multiplierDays.includes(todayNum);
        const baseXP = isMultiplier ? (xpReward * 2) : xpReward;
        
        let finalXP = isCombo ? baseXP + 15 : baseXP;
        
        // --- CYBERWARE IMPLANT BUFF (+20%) ---
        const taskData = appState.tasks.find(t => t.name === taskName);
        const taskAttr = taskData ? taskData.attribute : null;
        if (taskAttr && appState.implants[taskAttr]) {
            finalXP = Math.floor(finalXP * 1.2);
            console.log(`[SYS] Cyberware buff applied to ${taskAttr}`);
        }
        
        // --- CHRONO DECAY PENALTY ---
        const chrono = getChronoData();
        finalXP = Math.floor(finalXP * chrono.multiplier);
        
        // --- BOUNTY CHECK ---
        const isBounty = (taskName === appState.dailyBountyTask && appState.bountyDate === getTodayStr());
        if (isBounty) {
            finalXP += 50; // MASSIVE XP EXPLOIT
            appState.threatLevel = Math.max(0, appState.threatLevel - 15); // CLEARS 15% THREAT!
        } else {
            appState.threatLevel = Math.max(0, appState.threatLevel - 5);
        }

        // Apply Overclock Multiplier
        if (appState.isOverclocked) {
            finalXP = Math.floor(finalXP * 1.2);
        }
        
        appState.xp += finalXP;         // Adds to spendable currency
        appState.lifetimeXp += finalXP; // Adds to permanent level progression
        
        const levelData = getLevelData(appState.lifetimeXp);
        if (levelData.level > appState.level) {
            const oldRank = getRankData(appState.level).name;
            appState.level = levelData.level;
            const newRankData = getRankData(appState.level);
            
            if (newRankData.name !== oldRank) {
                // MASSIVE RANK UP (REPLACED SYS_MODAL WITH FULL SCREEN TRIGGER)
                showPromotionScreen(newRankData);
            } else {
                // STANDARD LEVEL UP
                SFX.levelUp(); 
                showSysModal(`[SYS_MSG] Lvl Up Initiated:\nLEVEL ${appState.level}!`, 'success');
            }
        } else if (isBounty) {
            SFX.levelUp(); 
            setTimeout(() => showSysModal(`[CRITICAL_BOUNTY_CLEARED]\n> +50 XP EXPLOIT GRANTED.\n> THREAT LEVEL REDUCED 15%.`, 'success'), 50); // UPDATED
        } else if (isCombo) {
            SFX.combo();
        } else {
            SFX.success();
        }
        
        saveState();
        renderAll();
        
        const xpDisplay = document.getElementById('xp-display');
        xpDisplay.classList.add('flash-text');
        setTimeout(() => xpDisplay.classList.remove('flash-text'), 300);
    }
}

// Logs an individual sub-task and checks if the parent is ready to combo
window.logSubTask = function(parentTaskName, subTaskName, parentXpReward, totalSubTasksCount, subIndex) {
    const today = getTodayStr();
    // Inject the subIndex into the unique string signature
    const logEntry = `${today}|${parentTaskName}|${subIndex}|${subTaskName}`; 
    
    if (!appState.logs.includes(logEntry)) {
        appState.logs.push(logEntry);
        SFX.clack(); 
        saveState();
        
        // Check if ALL subtasks for this parent are now done today
        // By checking if it starts with the parent name, we catch all indexed subtasks
        const completedSubTasks = appState.logs.filter(log => log.startsWith(`${today}|${parentTaskName}|`)).length;
        
        if (completedSubTasks === totalSubTasksCount) {
            // Trigger the Combo!
            logTask(parentTaskName, parentXpReward, true);
        } else {
            renderDashboard(); // Just re-render to lock the checkbox
        }
    }
};

// --- 2. NAVIGATION LOGIC ---
document.querySelectorAll('.nav-link').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-link').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        
        const targetId = e.target.getAttribute('data-target');
        document.querySelectorAll('section').forEach(s => {
            s.classList.add('d-none');
            s.classList.remove('active-section');
        });
        const targetSection = document.getElementById(targetId);
        targetSection.classList.remove('d-none');
        targetSection.classList.add('active-section');
        
        renderAll(); 
    });
});

// --- ANTIVIRUS PROTOCOL ---
window.runAntivirus = function() {
    if (appState.xp >= 200 && appState.threatLevel > 0) {
        SFX.success(); 
        appState.xp -= 200;
        appState.threatLevel = Math.max(0, appState.threatLevel - 50); 
        
        saveState();
        renderAll();
    } else if (appState.xp < 200) {
        SFX.error(); 
        showSysModal("SYS_ERR: INSUFFICIENT XP FOR ANTIVIRUS PROTOCOL.", "danger");
    } else if (appState.threatLevel === 0) {
        SFX.error();
        showSysModal("SYS_MSG: THREAT LEVEL ALREADY AT 0%.\nNO INFECTION DETECTED.", "info");
    }
};

// --- 3. TAB RENDERING: DASHBOARD ---
function renderDashboard() {
    const todayNum = new Date().getDay();
    const isMultiplier = appState.multiplierDays.includes(todayNum);
    
    // --- UPDATED: RANK INJECTION ---
    const levelData = getLevelData(appState.lifetimeXp);
    const rankData = getRankData(levelData.level);
    
    document.getElementById('level-display').innerHTML = `LEVEL ${appState.level} ${isMultiplier ? '<span class="multiplier-text ms-2">[2X_XP_ACTIVE]</span>' : ''}`;
    
    const rankBadge = document.getElementById('rank-display');
    rankBadge.className = `badge bg-black border ${rankData.class}`;
    rankBadge.innerHTML = `<i class="bi ${rankData.icon} me-1"></i>${rankData.name}`;

    document.getElementById('xp-display').textContent = `${levelData.currentXp} / ${levelData.requiredXp} XP`;
    document.getElementById('xp-bar-fill').style.width = `${(levelData.currentXp / levelData.requiredXp) * 100}%`;

    // ---  INJECT RANK PROGRESS TELEMETRY ---
    const rankProgContainer = document.getElementById('rank-progress-container');
    if (rankProgContainer) {
        const nextRank = getNextRankData(levelData.level);
        if (nextRank) {
            // Calculate the absolute total XP required to hit the target level based on your RPG curve
            const nextRankTotalXp = 500 * Math.pow(nextRank.reqLevel - 1, 2);
            const xpRemaining = nextRankTotalXp - appState.lifetimeXp;
            
            rankProgContainer.innerHTML = `> NEXT_TIER: <span class="${nextRank.class} ms-1 me-1">${nextRank.name}</span> (LVL ${nextRank.reqLevel}) <span class="text-muted ms-2">//</span> <span class="text-info ms-2">${xpRemaining} XP REMAINING</span>`;
        } else {
            // If they are Level 75+
            rankProgContainer.innerHTML = `<span class="rank-challenger">> MAX_TIER_ACHIEVED: APEX_PREDATOR</span>`;
        }
    }

    // --- RENDER THREAT LEVEL ---
    document.getElementById('threat-display').textContent = `${appState.threatLevel}%`;
    document.getElementById('threat-bar-fill').style.width = `${appState.threatLevel}%`;
    
    // Check for Critical Lockdown (100% Threat)
    if (appState.threatLevel >= 100) {
        document.body.classList.add('system-lockdown');
        document.getElementById('threat-display').textContent = `100% [CRITICAL]`;
    } else {
        document.body.classList.remove('system-lockdown');
    }

    const container = document.getElementById('objectives-container');
    container.innerHTML = '';
    const today = getTodayStr();

    // --- DYNAMIC LOADOUT FILTER ---
    const currentDayOfWeek = new Date().getDay();
    const activeLoadout = appState.tasks.filter(task => task.activeDays.includes(currentDayOfWeek));

    // Only render tasks assigned to today!
    activeLoadout.forEach(task => {
        const isMainDone = appState.logs.includes(`${today}|${task.name}`);
        const hasSubtasks = task.subtasks && task.subtasks.length > 0;
        
        // --- BOUNTY TARGET ACQUIRED ---
        const isBountyTarget = (task.name === appState.dailyBountyTask && appState.bountyDate === today);
        
        // --- TIME EVALUATION ENGINE ---
        // Check if the system logs contain a manual override for this specific task today
        const isHacked = appState.logs.includes(`${today}|SYS_TIME_HACK|${task.name}`);
        
        let isExpired = false;
        // If there's a deadline, it's not hacked, and it's not done yet, evaluate the time
        if (task.deadline && task.deadline !== "" && !isHacked) {
            const now = new Date();
            const currentMins = now.getHours() * 60 + now.getMinutes();
            const [dHour, dMin] = task.deadline.split(':').map(Number);
            const deadMins = dHour * 60 + dMin;
            
            if (currentMins >= deadMins && !isMainDone) {
                isExpired = true;
            }
        }
        
        // Bootstrap Column
        const col = document.createElement('div');
        col.className = 'col-md-6';
        
        // Bootstrap Card (Inject Bounty Styles if targeted and not yet complete)
        const card = document.createElement('div');
        card.className = `card task-card bg-dark border-secondary ${isMainDone ? 'completed' : ''} ${isBountyTarget && !isMainDone ? 'bounty-card' : ''}`;
        
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';
        
        // Header (Main Task)
        const headerDiv = document.createElement('div');
        headerDiv.className = 'd-flex align-items-center justify-content-between mb-2';
        
        const checkWrap = document.createElement('div');
        checkWrap.className = 'form-check form-check-inline m-0';
        
        const mainCheckbox = document.createElement('input');
        mainCheckbox.className = 'form-check-input flex-shrink-0 mt-1';
        mainCheckbox.style.width = '1.25em';
        mainCheckbox.style.height = '1.25em';
        mainCheckbox.type = 'checkbox';
        mainCheckbox.checked = isMainDone;
        mainCheckbox.disabled = isMainDone || hasSubtasks || isExpired;
        
        if (!hasSubtasks) {
            mainCheckbox.addEventListener('change', () => {
                if (mainCheckbox.checked) {
                    mainCheckbox.disabled = true;
                    logTask(task.name, task.xp);
                }
            });
        }

        // Update label to strike-through and turn red on expiration
        const label = document.createElement('label');
        label.className = `form-check-label ms-2 fw-bold text-light task-title ${isMainDone ? 'completed-text' : ''} ${isExpired ? 'text-danger text-decoration-line-through' : ''}`;
        label.textContent = task.name;
        
        checkWrap.appendChild(mainCheckbox);
        checkWrap.appendChild(label);
        headerDiv.appendChild(checkWrap);

        // --- INJECT DATA SCRAPER BUTTON ---
        if (!isMainDone && appState.inventory.scraper > 0) {
            const scraperBtn = document.createElement('button');
            scraperBtn.className = 'btn btn-outline-warning btn-scraper ms-2';
            scraperBtn.innerHTML = '<i class="bi bi-bug-fill"></i> HACK';
            scraperBtn.onclick = () => {
                showSysModal(`> DEPLOY DATA_SCRAPER ON [${task.name}]?\nTHIS WILL CONSUME 1 ITEM AND YIELD 0 XP.`, "warning", () => {
                    // Exploit Execution
                    appState.inventory.scraper--;
                    appState.logs.push(`${today}|${task.name}`);
                    SFX.clack();
                    saveState();
                    renderAll();
                    setTimeout(() => showSysModal(`[SYS_MSG] TASK BYPASSED.\n0 XP GRANTED.`, "success"), 400);
                });
            };
            headerDiv.appendChild(scraperBtn);
        }

        // --- INJECT CODEX BUTTON ---
        if (task.manual && task.manual.trim() !== '') {
            const manualBtn = document.createElement('button');
            manualBtn.className = 'btn btn-outline-info btn-scraper ms-2';
            manualBtn.innerHTML = '<i class="bi bi-journal-code"></i> SOP';
            manualBtn.onclick = () => openCodex(task.name, task.manual);
            headerDiv.appendChild(manualBtn);
        }
        
        // --- INJECT DEADLINE BADGES ---
        if (isExpired) {
            const expBadge = document.createElement('span');
            expBadge.className = 'badge bg-danger ms-auto';
            expBadge.innerHTML = `<i class="bi bi-x-octagon-fill me-1"></i> EXPIRED: ${task.deadline}`;
            headerDiv.appendChild(expBadge);
            
            // --- CHRONO_BYPASS DEPLOYMENT ---
            if (appState.inventory.time_turner > 0) {
                const bypassBtn = document.createElement('button');
                bypassBtn.className = 'btn btn-outline-warning btn-scraper ms-2';
                bypassBtn.innerHTML = '<i class="bi bi-unlock-fill"></i> BYPASS';
                bypassBtn.onclick = () => {
                    showSysModal(`> DEPLOY CHRONO_BYPASS ON [${task.name}]?\nTHIS WILL CONSUME 1 ITEM AND REOPEN THE NODE.`, "warning", () => {
                        appState.inventory.time_turner--;
                        // Inject the silent hacking log into the database
                        appState.logs.push(`${today}|SYS_TIME_HACK|${task.name}`);
                        SFX.success();
                        saveState();
                        renderAll();
                        setTimeout(() => showSysModal(`[SYS_MSG] TEMPORAL LOCK SHATTERED.\nNODE REOPENED.`, "success"), 400);
                    });
                };
                headerDiv.appendChild(bypassBtn);
            }
        } else if (task.deadline && !isMainDone) {
            const dueBadge = document.createElement('span');
            dueBadge.className = 'badge bg-transparent border border-secondary text-secondary ms-auto';
            dueBadge.innerHTML = `<i class="bi bi-clock-history me-1"></i> DUE: ${task.deadline}`;
            headerDiv.appendChild(dueBadge);
        } else if (isBountyTarget && !isMainDone) {
            const badge = document.createElement('span');
            badge.className = 'bounty-badge ms-auto';
            badge.innerHTML = '<i class="bi bi-crosshair text-danger fw-bold"></i> [BOUNTY]';
            headerDiv.appendChild(badge);
        } else if (hasSubtasks && isMainDone) {
            const badge = document.createElement('span');
            badge.className = 'combo-badge ms-auto';
            badge.innerHTML = '<i class="bi bi-fire"></i> +15 XP COMBO';
            headerDiv.appendChild(badge);
        }

        cardBody.appendChild(headerDiv);

        // Subtasks UI (Bootstrap List Group)
        if (hasSubtasks && !isMainDone) {
            const subListDiv = document.createElement('ul');
            subListDiv.className = 'list-group list-group-flush mt-2 ms-4 border-start border-secondary';
            
            // UPGRADED: Now tracks by array index to allow duplicate names
            task.subtasks.forEach((sub, index) => {
                const isSubDone = appState.logs.includes(`${today}|${task.name}|${index}|${sub}`);
                
                const subLi = document.createElement('li');
                subLi.className = 'list-group-item bg-transparent border-0 py-1 ps-3 pe-0';
                
                const subCheckWrap = document.createElement('div');
                subCheckWrap.className = 'form-check';
                
                const subCheck = document.createElement('input');
                subCheck.className = 'form-check-input';
                subCheck.type = 'checkbox';
                subCheck.checked = isSubDone;
                subCheck.disabled = isSubDone;
                
                subCheck.addEventListener('change', () => {
                    if (subCheck.checked) {
                        subCheck.disabled = true;
                        // Pass the index to the logging function
                        logSubTask(task.name, sub, task.xp, task.subtasks.length, index); 
                    }
                });
                
                const subLabel = document.createElement('label');
                subLabel.className = `form-check-label text-muted small ${isSubDone ? 'text-decoration-line-through' : ''}`;
                subLabel.textContent = sub;
                
                subCheckWrap.appendChild(subCheck);
                subCheckWrap.appendChild(subLabel);
                subLi.appendChild(subCheckWrap);
                subListDiv.appendChild(subLi);
            });
            cardBody.appendChild(subListDiv);
        }
        
        card.appendChild(cardBody);
        col.appendChild(card);
        container.appendChild(col);
    });

    renderHeatmap();
}

function renderHeatmap() {
    const container = document.getElementById('heatmap-container');
    container.innerHTML = '';
    
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate(); 
    
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    document.getElementById('heatmap-title').innerHTML = `> RENDER_${monthNames[month]}_HEATMAP [${daysInMonth}_DAYS]`;

    const currentMonthDates = [];
    for (let i = 1; i <= daysInMonth; i++) {
        currentMonthDates.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`);
    }

    currentMonthDates.forEach(dateStr => {
        // --- 1. DATA EXTRACTION ---
        const logsForDay = appState.logs.filter(log => log.startsWith(dateStr));
        const completedCount = logsForDay.length;
        
        // Find tasks that were active on this specific day of the week
        const dayOfWeek = new Date(dateStr).getDay();
        const activeTasksForDay = appState.tasks.filter(t => t.activeDays.includes(dayOfWeek)).length || 1;
        
        const ratio = completedCount / activeTasksForDay;
        const hasRepair = appState.logs.includes(`${dateStr}|SYS_STREAK_REPAIR`);
        
        // Identify specialty completions for Gizmo-style icons
        const didCoding = logsForDay.some(l => l.includes('Java & SQL'));
        const didROTC = logsForDay.some(l => l.includes('ROTC'));

        // --- 2. CELL GENERATION ---
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell d-flex align-items-center justify-content-center';
        
        if (hasRepair) {
            // Repaired State (Cyan)
            cell.className += ' repaired-streak';
            cell.innerHTML = '<i class="bi bi-tools text-info-custom" style="font-size: 14px;"></i>';
            cell.title = `${dateStr} // SYS_OVERRIDE_APPLIED`;
        } else if (ratio === 0) {
            // Empty State
            cell.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
            cell.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            cell.title = `${dateStr} // NO_DATA`;
        } else {
            // Active State (GitHub Intensity Scale)
            if (ratio <= 0.33) cell.className += ' intensity-low';
            else if (ratio <= 0.66) cell.className += ' intensity-med';
            else if (ratio < 1.0) cell.className += ' intensity-high';
            else cell.className += ' intensity-max';

            // Inject Gizmo-style icons based on specific achievements
            if (ratio >= 1.0) {
                cell.innerHTML = '<i class="bi bi-star-fill text-dark" style="font-size: 14px;"></i>'; // Perfect Day
            } else if (didCoding) {
                cell.innerHTML = '<i class="bi bi-code-slash text-dark" style="font-size: 14px;"></i>';
            } else if (didROTC) {
                cell.innerHTML = '<i class="bi bi-shield-fill text-dark" style="font-size: 14px;"></i>';
            }

            cell.title = `${dateStr} // LOGS: ${completedCount}/${activeTasksForDay}`;
        }
        
        container.appendChild(cell);
    });
}

// --- 4. TAB RENDERING: CALENDAR ---
let currentCalMonth = new Date(); 

document.getElementById('prev-month').addEventListener('click', () => {
    currentCalMonth.setMonth(currentCalMonth.getMonth() - 1);
    renderCalendar();
});

document.getElementById('next-month').addEventListener('click', () => {
    currentCalMonth.setMonth(currentCalMonth.getMonth() + 1);
    renderCalendar();
});

function renderCalendar() {
    const year = currentCalMonth.getFullYear();
    const month = currentCalMonth.getMonth();
    
    const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    document.getElementById('calendar-title').textContent = `${monthNames[month]} ${year}`;

    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';

    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    days.forEach((day, index) => {
        const el = document.createElement('div');
        // Paint header gold if it's a multiplier day
        el.className = `day-label ${appState.multiplierDays.includes(index) ? 'multiplier-zone' : ''}`;
        el.textContent = day;
        grid.appendChild(el);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = getTodayStr();

    for (let i = 0; i < firstDay; i++) {
        grid.appendChild(document.createElement('div'));
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const isToday = (cellDateStr === todayStr);
        const hasActivity = appState.logs.some(log => log.startsWith(cellDateStr));
        const isRepaired = appState.logs.includes(`${cellDateStr}|SYS_STREAK_REPAIR`);
        
        const cellDateObj = new Date(year, month, i);
        const isBoxMultiplier = appState.multiplierDays.includes(cellDateObj.getDay());

        const cell = document.createElement('div');
        // Apply appropriate classes based on normal activity vs artificial patch
        cell.className = `cal-cell ${isToday ? 'today' : ''} ${hasActivity && !isRepaired ? 'active-streak' : ''} ${isRepaired ? 'repaired-streak' : ''} ${isBoxMultiplier ? 'multiplier-zone' : ''}`;
        
        const dateNum = document.createElement('div');
        dateNum.className = 'fw-bold mb-1 text-light';
        dateNum.textContent = i;
        cell.appendChild(dateNum);

        if (hasActivity) {
            const icon = document.createElement('i');
            // Cyan wrench for repaired, green star for naturally earned
            icon.className = isRepaired ? 'bi bi-tools text-info-custom' : 'bi bi-star-fill text-success'; 
            cell.appendChild(icon);
        }

        cell.addEventListener('click', () => {
            const logsForDay = appState.logs.filter(log => log.startsWith(cellDateStr));
            const logOutput = document.getElementById('execution-log-output');
            const repairBtn = document.getElementById('btn-repair-streak');

            let outputText = `> cat /var/log/syslog/${cellDateStr}.log\n\n`;

            if (logsForDay.length === 0) {
                outputText += `[!] ERR_404: NO_LOGS_FOUND_FOR_THIS_CYCLE.\n`;
                
                // Compare dates to see if this is in the past
                const todayObj = new Date(todayStr);
                const isPastDate = cellDateObj < todayObj;

                if (isPastDate) {
                    repairBtn.classList.remove('d-none');
                    if (appState.xp >= 500) {
                        repairBtn.disabled = false;
                        repairBtn.textContent = `> OVERRIDE_STREAK (-500 XP)`;
                        repairBtn.onclick = () => executeStreakRepair(cellDateStr);
                    } else {
                        repairBtn.disabled = true;
                        repairBtn.textContent = `> INSUFFICIENT_FUNDS (REQ: 500 XP)`;
                        repairBtn.onclick = null;
                    }
                } else {
                    repairBtn.classList.add('d-none');
                }
            } else {
                repairBtn.classList.add('d-none');
                
                if (isRepaired) {
                     outputText += `[+] SYS_OVERRIDE_APPLIED:\n  > STREAK_REPAIR_PROTOCOL_ENGAGED.\n  > INTEGRITY_RESTORED.\n`;
                } else {
                    outputText += `[+] TASKS_EXECUTED:\n`;
                    const printedMainTasks = new Set();
                    logsForDay.forEach(log => {
                        const parts = log.split('|');
                        const mainTask = parts[1];
                        const subTask = parts[2];
                        if (!subTask) {
                            outputText += `  > ${mainTask} [COMPLETE]\n`;
                        } else {
                            if (!printedMainTasks.has(mainTask)) {
                                outputText += `  > ${mainTask}:\n`;
                                printedMainTasks.add(mainTask);
                            }
                            outputText += `      -- ${subTask}\n`;
                        }
                    });
                }
            }

            logOutput.textContent = outputText;
            const modal = new bootstrap.Modal(document.getElementById('executionLogModal'));
            modal.show();
        });

        grid.appendChild(cell);
    }
}

// --- 5. ENCRYPTED ARTIFACT ENGINE ---

// MODULE A: Centralized Achievement Logic
window.getAchievementsState = function() {
    const logCountsByDate = {};
    let timeHacks = 0;
    let rotcCount = 0;
    let circuitCount = 0;
    let codeCount = 0;
    let opsDefeated = appState.operations.filter(op => op.defeated).length;

    appState.logs.forEach(log => {
        const parts = log.split('|');
        const date = parts[0];
        const task = parts[1];
        
        if (task !== 'SYS_STREAK_REPAIR' && task !== 'SYS_TIME_HACK') {
            if (parts.length === 2) {
                logCountsByDate[date] = (logCountsByDate[date] || 0) + 1;
            }
        }
        
        if (task === 'SYS_TIME_HACK') timeHacks++;
        if (task.includes('QCUROTC') || task.includes('ROTC')) rotcCount++;
        if (task.includes('Circuit Training')) circuitCount++;
        if (task.includes('Java') || task.includes('SQL') || task.includes('KyusiyuSphere')) codeCount++;
    });
    
    let isPerfectDay = false;
    for (const [dateStr, completedCount] of Object.entries(logCountsByDate)) {
        const [y, m, d] = dateStr.split('-');
        const dateObj = new Date(y, m - 1, d);
        const dayOfWeek = dateObj.getDay();
        const scheduledTasksCount = appState.tasks.filter(t => t.activeDays.includes(dayOfWeek)).length;
        if (scheduledTasksCount > 0 && completedCount >= scheduledTasksCount) {
            isPerfectDay = true; break; 
        }
    }

    return [
        { id: 'ach-1', name: "INITIATE [LVL_02]", desc: "REACH LEVEL 2", unlocked: appState.level >= 2, icon: "bi-shield-check" },
        { id: 'ach-2', name: "SYS_ADMIN [LVL_10]", desc: "REACH LEVEL 10", unlocked: appState.level >= 10, icon: "bi-diagram-3-fill" },
        { id: 'ach-3', name: "PERFECT_DAY [100%]", desc: "CLEAR ALL OBJECTIVES", unlocked: isPerfectDay, icon: "bi-trophy-fill" },
        { id: 'ach-4', name: "OVERCLOCKED_MIND", desc: "MAINTAIN 3-DAY STREAK", unlocked: appState.currentStreak >= 3, icon: "bi-lightning-charge-fill" },
        { id: 'ach-5', name: "IRON_CODER", desc: "COMMIT CODE/SQL 5X", unlocked: codeCount >= 5, icon: "bi-braces-asterisk" },
        { id: 'ach-6', name: "VANGUARD_CADET", desc: "FIELD PREP CLEARED 3X", unlocked: rotcCount >= 3, icon: "bi-crosshair" },
        { id: 'ach-7', name: "IRON_CORE", desc: "CIRCUIT CONDITIONING 5X", unlocked: circuitCount >= 5, icon: "bi-heart-pulse-fill" },
        { id: 'ach-8', name: "TIME_HACKER", desc: "DEPLOY CHRONO BYPASS", unlocked: timeHacks > 0, icon: "bi-hourglass-bottom" },
        { id: 'ach-9', name: "ICE_BREAKER", desc: "SHATTER 1 OPERATION", unlocked: opsDefeated >= 1, icon: "bi-hdd-network-fill" }
    ];
};

// MODULE B: Real-Time Evaluator & Popup Trigger
window.evaluateArtifacts = function(silent = false) {
    const achievements = getAchievementsState();
    let newlyUnlocked = [];

    achievements.forEach(ach => {
        // If condition is met but it's NOT in our database yet...
        if (ach.unlocked && !appState.unlockedArtifacts.includes(ach.id)) {
            appState.unlockedArtifacts.push(ach.id);
            if (!silent) newlyUnlocked.push(ach.name);
        }
    });

    if (newlyUnlocked.length > 0) {
        saveState();
        if (!silent) {
            setTimeout(() => {
                SFX.bossDefeat(); 
                const names = newlyUnlocked.map(n => `> ${n}`).join('\n');
                showSysModal(`[+] ARTIFACT ACQUIRED [+]\n\n${names}\n\nDATA VAULT UPDATED.`, "success");
            }, 1200); // 1.2s delay ensures it pops up right after level-up modals finish
        }
    }
};

// MODULE C: Vault User Interface
function renderTrophies() {
    const container = document.getElementById('trophy-container');
    if (!container) return;
    container.innerHTML = '';

    const achievements = getAchievementsState();

    achievements.forEach(ach => {
        // UI strictly checks the database, not the live conditions
        const isActuallyUnlocked = appState.unlockedArtifacts.includes(ach.id);
        const col = document.createElement('div');
        col.className = 'col-md-4 col-sm-6 mb-4';
        
        const card = document.createElement('div');
        card.className = `card h-100 text-center artifact-card ${isActuallyUnlocked ? 'artifact-unlocked' : 'artifact-locked'}`;
        
        card.innerHTML = `
            <div class="card-body py-4">
                <div class="artifact-icon-container">
                    <i class="bi ${isActuallyUnlocked ? ach.icon : 'bi-lock-fill'} artifact-icon ${isActuallyUnlocked ? 'text-success' : ''}"></i>
                </div>
                <h6 class="card-title fw-bold mb-1 ${isActuallyUnlocked ? 'text-success' : 'text-secondary'}">${ach.name}</h6>
                <small class="text-muted" style="font-size: 10px; letter-spacing: 1px;">> ${ach.desc}</small>
            </div>
        `;
        
        col.appendChild(card);
        container.appendChild(col);
    });
}

// --- 6. TAB RENDERING: SETTINGS ---
let selectedSettingsTask = null;

function renderSettings() {
    const tbody = document.getElementById('task-table-body');
    tbody.innerHTML = '';
    selectedSettingsTask = null; 

    appState.tasks.forEach((task) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td class="text-light fw-bold align-middle">${task.name}</td><td class="text-end text-light align-middle"><span class="badge bg-secondary">${task.xp} XP</span></td>`;
        
        tr.addEventListener('click', () => {
            document.querySelectorAll('#task-table-body tr').forEach(row => row.classList.remove('selected'));
            tr.classList.add('selected');
            selectedSettingsTask = task.name;
        });
        
        tbody.appendChild(tr);
    });
}

document.getElementById('btn-add-task').addEventListener('click', () => {
    const nameInput = document.getElementById('input-task-name');
    const xpInput = document.getElementById('input-xp-reward');
    const subtasksInput = document.getElementById('input-subtasks'); 
    const attributeInput = document.getElementById('input-attribute'); 
    const manualInput = document.getElementById('input-manual'); 
    const deadlineInput = document.getElementById('input-deadline'); // NEW
    
    const dayCheckboxes = document.querySelectorAll('.day-cb:checked');
    const activeDays = Array.from(dayCheckboxes).map(cb => parseInt(cb.value, 10));
    
    const name = nameInput.value.trim();
    const xp = parseInt(xpInput.value.trim(), 10);
    const subtasks = subtasksInput ? subtasksInput.value.split(',').map(s => s.trim()).filter(s => s !== '') : [];
    const attribute = attributeInput.value; 
    const manual = manualInput ? manualInput.value.trim() : "";
    const deadline = deadlineInput ? deadlineInput.value : ""; // NEW

    if (name && !isNaN(xp) && activeDays.length > 0) {
        if (!appState.tasks.some(t => t.name === name)) {
            // Push the deadline data into the DB
            appState.tasks.push({ name, xp, subtasks, activeDays, attribute, manual, deadline }); 
            saveState();
            
            // Reset inputs
            nameInput.value = '';
            xpInput.value = '';
            if (subtasksInput) subtasksInput.value = ''; 
            if (manualInput) manualInput.value = '';
            if (deadlineInput) deadlineInput.value = ''; // NEW
            
            renderAll();
            SFX.success(); // <-- ADD THIS LINE
            showSysModal(`[+] TASK ADDED TO DATABASE:\n${name}`, "success");
        } else {
            SFX.error();
            showSysModal("SYS_ERR: TASK_ALREADY_EXISTS!", "danger");
        }
    } else {
        SFX.error();
        showSysModal("SYS_ERR: INVALID_PARAMETERS.\nCHECK NAME, XP, OR ACTIVE DAYS.", "danger");
    }
});

document.getElementById('btn-delete-task').addEventListener('click', () => {
    if (selectedSettingsTask) {
        SFX.error(); // Warning sound when the destructive prompt opens
        showSysModal(`DROP TASK: [${selectedSettingsTask}]?`, 'danger', () => {
            appState.tasks = appState.tasks.filter(t => t.name !== selectedSettingsTask);
            saveState();
            renderAll();
            SFX.attack(); // Crunchy deletion sound when confirmed
        });
    } else {
        SFX.error(); // Error sound if no task is selected
        showSysModal("SYS_ERR: SELECT A TASK TO DROP.", "danger");
    }
});

// --- 7. TAB RENDERING: BLACK MARKET (STORE) ---
const storeInventory = [
    { id: 'matrix', name: 'MATRIX_GREEN [DEFAULT]', cost: 0, icon: 'bi-terminal' },
    { id: 'cyber', name: 'CYBER_BLUE [NETRUNNER]', cost: 1000, icon: 'bi-cpu' },
    { id: 'blood', name: 'BLOOD_RED [BERSERK_MODE]', cost: 2500, icon: 'bi-heart-pulse' },
    { id: 'gold', name: 'IMPERIAL_GOLD [EXECUTIVE]', cost: 5000, icon: 'bi-bank' }
];

function renderStore() {
    document.getElementById('market-xp-display').textContent = `AVAILABLE: ${appState.xp} XP`;
    const container = document.getElementById('store-container');
    container.innerHTML = '';

    // --- 1. RENDER THEMES ---
    storeInventory.forEach(item => {
        const isUnlocked = appState.unlockedThemes.includes(item.id);
        const isEquipped = appState.activeTheme === item.id;
        const canAfford = appState.xp >= item.cost;
        const isSystemLocked = appState.threatLevel >= 100;

        const col = document.createElement('div');
        col.className = 'col-md-6';
        
        const card = document.createElement('div');
        card.className = `card h-100 p-3 ${isEquipped ? 'border-success bg-success bg-opacity-10' : 'border-secondary'}`;
        
        let buttonHTML = '';
        if (isSystemLocked) {
            buttonHTML = `<button class="btn btn-outline-danger w-100 fw-bold disabled"><i class="bi bi-lock-fill me-2"></i>SYS_LOCKED</button>`;
        } else if (isEquipped) {
            buttonHTML = `<button class="btn btn-success w-100 fw-bold disabled">EQUIPPED</button>`;
        } else if (isUnlocked) {
            buttonHTML = `<button class="btn btn-outline-success w-100 fw-bold" onclick="equipTheme('${item.id}')">> EQUIP_OVERRIDE</button>`;
        } else {
            buttonHTML = `<button class="btn ${canAfford ? 'btn-outline-success' : 'btn-outline-secondary'} w-100 fw-bold" 
                            ${canAfford ? `onclick="purchaseTheme('${item.id}', ${item.cost})"` : 'disabled'}>
                            ${canAfford ? `> PURCHASE (-${item.cost} XP)` : `INSUFFICIENT_FUNDS (${item.cost} XP)`}
                          </button>`;
        }

        card.innerHTML = `
            <div class="d-flex align-items-center mb-3">
                <i class="bi ${item.icon} fs-2 me-3 ${isUnlocked ? 'text-success' : 'text-secondary'}"></i>
                <div>
                    <h6 class="mb-0 fw-bold ${isUnlocked ? 'text-success' : 'text-muted'}">${item.name}</h6>
                    <small class="text-muted">COST: ${item.cost} XP</small>
                </div>
            </div>
            ${buttonHTML}
        `;
        
        col.appendChild(card);
        container.appendChild(col);
    });

    // --- 2. RENDER CONSUMABLES ---
    const consContainer = document.getElementById('consumables-container');
    if (consContainer) {
        consContainer.innerHTML = '';
        
       
    const isStasisActive = appState.stasisActiveUntil && new Date(appState.stasisActiveUntil) >= new Date(getTodayStr());
    document.getElementById('inventory-display').textContent = `SCRAPERS: ${appState.inventory.scraper} | BYPASS: ${appState.inventory.time_turner} | STASIS: ${isStasisActive ? 'ACTIVE' : 'OFFLINE'}`;

        consumableItems.forEach(item => {
            const canAfford = appState.xp >= item.cost;
            const col = document.createElement('div');
            col.className = 'col-md-6';
            
            col.innerHTML = `
                <div class="card h-100 p-3 consumable-card">
                    <div class="d-flex align-items-center mb-3">
                        <i class="bi ${item.icon} fs-2 me-3 text-warning"></i>
                        <div>
                            <h6 class="mb-0 fw-bold text-warning">${item.name}</h6>
                            <small class="text-muted text-uppercase">${item.desc}</small>
                        </div>
                    </div>
                    <button class="btn ${canAfford ? 'btn-outline-warning' : 'btn-outline-secondary'} w-100 fw-bold text-uppercase" 
                            ${canAfford ? `onclick="buyConsumable('${item.id}', ${item.cost})"` : 'disabled'}>
                            ${canAfford ? `> EXTRACT (-${item.cost} XP)` : `INSUFFICIENT FUNDS (${item.cost} XP)`}
                    </button>
                </div>
            `;
            consContainer.appendChild(col);
        });
    }

    // --- 3. RENDER CYBERWARE ---
    const cyberContainer = document.getElementById('cyberware-container');
    if (cyberContainer) {
        cyberContainer.innerHTML = '';
        
        cyberwareItems.forEach(item => {
            const isInstalled = appState.implants[item.id];
            const canAfford = appState.xp >= item.cost;
            const col = document.createElement('div');
            col.className = 'col-md-6';
            
            col.innerHTML = `
                <div class="card h-100 p-3 ${isInstalled ? 'border-info bg-info bg-opacity-10' : 'border-secondary'}">
                    <div class="d-flex align-items-center mb-3">
                        <i class="bi ${item.icon} fs-2 me-3 ${isInstalled ? 'text-info' : 'text-secondary'}"></i>
                        <div>
                            <h6 class="mb-0 fw-bold ${isInstalled ? 'text-info' : 'text-muted'}">${item.name}</h6>
                            <small class="${isInstalled ? 'text-info' : 'text-muted'} text-uppercase">${item.desc}</small>
                        </div>
                    </div>
                    <button class="btn ${isInstalled ? 'btn-info text-dark' : (canAfford ? 'btn-outline-info' : 'btn-outline-secondary')} w-100 fw-bold text-uppercase" 
                            ${isInstalled || !canAfford ? 'disabled' : `onclick="buyCyberware('${item.id}', ${item.cost})"`}>
                            ${isInstalled ? '> INSTALLED' : (canAfford ? `> INSTALL (-${item.cost} XP)` : `INSUFFICIENT FUNDS (${item.cost} XP)`)}
                    </button>
                </div>
            `;
            cyberContainer.appendChild(col);
        });
    }
}

// --- THEME STORE TRANSACTION LOGIC ---
window.purchaseTheme = function(themeId, cost) {
    if (appState.xp >= cost && !appState.unlockedThemes.includes(themeId)) {
        appState.xp -= cost;
        appState.unlockedThemes.push(themeId);
        
        SFX.success();
        showSysModal(`[+] ENCRYPTION BROKEN:\n${themeId.toUpperCase()} THEME UNLOCKED.`, "success");
        
        saveState();
        renderAll();
    } else {
        SFX.error();
        showSysModal("SYS_ERR: INSUFFICIENT FUNDS OR ALREADY UNLOCKED.", "danger");
    }
};

window.equipTheme = function(themeId) {
    if (appState.unlockedThemes.includes(themeId)) {
        appState.activeTheme = themeId;
        document.documentElement.className = `theme-${themeId}`;
        SFX.clack();
        saveState();
        renderAll();
    }
};

// --- CONSUMABLES INVENTORY ---
const consumableItems = [
    { id: 'stasis', name: 'STASIS_PROTOCOL', desc: 'FREEZE_THREAT_METER_FOR_24H', cost: 300, icon: 'bi-snow2' },
    { id: 'scraper', name: 'DATA_SCRAPER', desc: 'AUTO_EXECUTE_1_OBJECTIVE_(0_XP)', cost: 500, icon: 'bi-bug' },
    { id: 'time_turner', name: 'CHRONO_BYPASS', desc: 'UNLOCK_1_EXPIRED_DEADLINE', cost: 750, icon: 'bi-unlock-fill' } // <-- NEW ITEM
];


window.buyConsumable = function(itemId, cost) {
    if (appState.xp >= cost) {
        appState.xp -= cost;
        SFX.success();
        
        if (itemId === 'scraper') {
            appState.inventory.scraper++;
            showSysModal("UTILITY ACQUIRED: DATA_SCRAPER INJECTED INTO INVENTORY.", "info");
        } else if (itemId === 'stasis') {
            // Set stasis to tomorrow
            const tmrw = new Date();
            tmrw.setDate(tmrw.getDate() + 1);
            appState.stasisActiveUntil = `${tmrw.getFullYear()}-${String(tmrw.getMonth() + 1).padStart(2, '0')}-${String(tmrw.getDate()).padStart(2, '0')}`;
            showSysModal(`UTILITY ACQUIRED: STASIS_PROTOCOL ENGAGED.\nTHREAT FROZEN UNTIL: ${appState.stasisActiveUntil}`, "info");
        } else if (itemId === 'time_turner') { // <-- NEW LOGIC
            appState.inventory.time_turner++;
            showSysModal("UTILITY ACQUIRED: CHRONO_BYPASS INJECTED INTO INVENTORY.", "info");
        }
    
        saveState();
        renderAll();
    } else {
        SFX.error();
        showSysModal("SYS_ERR: INSUFFICIENT FUNDS.", "danger");
    }
};

// --- CYBERWARE INVENTORY ---
const cyberwareItems = [
    { id: 'STR', name: 'SYNTHETIC_MUSCLE', desc: '+20% XP ON [STR] TASKS', cost: 2000, icon: 'bi-activity' },
    { id: 'INT', name: 'NEURAL_COPROCESSOR', desc: '+20% XP ON [INT] TASKS', cost: 2000, icon: 'bi-motherboard' },
    { id: 'DIS', name: 'LIMBIC_INHIBITOR', desc: '+20% XP ON [DIS] TASKS', cost: 2000, icon: 'bi-stopwatch' },
    { id: 'CHR', name: 'PHEROMONE_MODULATOR', desc: '+20% XP ON [CHR] TASKS', cost: 2000, icon: 'bi-people' }
];

window.buyCyberware = function(attrId, cost) {
    if (appState.xp >= cost && !appState.implants[attrId]) {
        appState.xp -= cost;
        appState.implants[attrId] = true;
        
        SFX.success();
        showSysModal(`[+] HARDWARE INSTALLED:\n${attrId} PROTOCOLS ENHANCED BY 20%.`, "info");
        
        saveState();
        renderAll();
    } else {
        SFX.error();
        showSysModal("SYS_ERR: INSUFFICIENT FUNDS OR ALREADY INSTALLED.", "danger");
    }
};

// --- 8. RPG STAT RADAR ENGINE ---
let radarChartInstance = null;

function renderStatRadar() {
    const ctx = document.getElementById('statRadarCanvas');
    if (!ctx) return;

    // Tally up lifetime XP per attribute based on completion logs
    const stats = { STR: 0, INT: 0, DIS: 0, CHR: 0 };
    
    appState.logs.forEach(log => {
        const parts = log.split('|');
        if (parts[1] === 'SYS_STREAK_REPAIR') return; 
        
        // Count main task completions (ignores sub-tasks so we don't over-count)
        if (parts.length === 2) {
            const taskName = parts[1];
            const taskData = appState.tasks.find(t => t.name === taskName);
            if (taskData) {
                stats[taskData.attribute || 'DIS'] += taskData.xp;
            }
        }
    });

    // Add a base flat value of 10 to everything so the radar has a shape even at Level 1
    const dataValues = [stats.STR + 10, stats.INT + 10, stats.DIS + 10, stats.CHR + 10];

    // Dynamically pull the colors from your active Black Market theme
    const style = getComputedStyle(document.body);
    const neonColor = style.getPropertyValue('--neon-green').trim() || '#39ff14';
    const rgbColor = style.getPropertyValue('--bs-success-rgb').trim() || '57, 255, 20';

    if (radarChartInstance) radarChartInstance.destroy();

    radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['[STR] STRENGTH', '[INT] INTELLIGENCE', '[DIS] DISCIPLINE', '[CHR] CHARISMA'],
            datasets: [{
                label: 'LIFETIME_XP',
                data: dataValues,
                backgroundColor: `rgba(${rgbColor}, 0.25)`,
                borderColor: neonColor,
                pointBackgroundColor: '#000',
                pointBorderColor: neonColor,
                pointHoverBackgroundColor: neonColor,
                pointHoverBorderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.15)' },
                    grid: { color: 'rgba(255, 255, 255, 0.15)' },
                    pointLabels: {
                        color: neonColor,
                        font: { family: "'Fira Code', monospace", size: 11, weight: 'bold' }
                    },
                    ticks: { display: false, beginAtZero: true } 
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// --- 9. OVERCLOCK & STREAK ENGINE ---
function calculateOverclock() {
    let pastStreak = 0;
    const d = new Date();
    d.setDate(d.getDate() - 1); // Start checking from yesterday backwards
    
    // Scan up to 365 days into the past
    for (let i = 0; i < 365; i++) {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const dayNum = d.getDay();
        
        const activeTasks = appState.tasks.filter(t => t.activeDays.includes(dayNum)).length;
        const logsForDay = appState.logs.filter(log => log.startsWith(dateStr));
        
        const isRepaired = logsForDay.some(l => l.includes('SYS_STREAK_REPAIR'));
        const mainTaskLogs = logsForDay.filter(l => l.split('|').length === 2 && !l.includes('SYS_STREAK_REPAIR'));
        
        if (isRepaired || (activeTasks > 0 && mainTaskLogs.length >= activeTasks)) {
            pastStreak++;
            d.setDate(d.getDate() - 1);
        } else if (activeTasks === 0) {
            // Rest days don't break the streak
            d.setDate(d.getDate() - 1); 
        } else {
            break; // Streak broken!
        }
    }

    // Check Today's status
    const todayStr = getTodayStr();
    const todayDayNum = new Date().getDay();
    const todayActiveTasks = appState.tasks.filter(t => t.activeDays.includes(todayDayNum)).length;
    const todayLogs = appState.logs.filter(log => log.startsWith(todayStr));
    const todayMainTaskLogs = todayLogs.filter(l => l.split('|').length === 2 && !l.includes('SYS_STREAK_REPAIR'));
    
    const isTodayPerfect = todayActiveTasks > 0 && todayMainTaskLogs.length >= todayActiveTasks;
    
    appState.currentStreak = pastStreak + (isTodayPerfect ? 1 : 0);
    appState.isOverclocked = appState.currentStreak >= 3;
    
    // Toggle Visuals
    const banner = document.getElementById('overclock-banner');
    if (appState.isOverclocked) {
        document.body.classList.add('overclocked');
        if(banner) banner.classList.remove('d-none');
    } else {
        document.body.classList.remove('overclocked');
        if(banner) banner.classList.add('d-none');
    }
}

// --- 9.5 CHRONO DECAY ENGINE ---
window.getChronoData = function() {
    const hour = new Date().getHours();
    
    // PHASE 1: 00:00 to 11:59 (100% Yield)
    if (hour < 12) {
        return { multiplier: 1.0, status: "OPTIMAL_PHASE [100% YIELD]", color: "text-success" };
    } 
    // PHASE 2: 12:00 to 17:59 (80% Yield)
    else if (hour < 18) {
        return { multiplier: 0.8, status: "DEGRADE_PHASE_1 [80% YIELD]", color: "text-warning" };
    } 
    // PHASE 3: 18:00 to 23:59 (50% Yield)
    else {
        return { multiplier: 0.5, status: "CRITICAL_DECAY [50% YIELD]", color: "text-danger" };
    }
};

window.renderChronoDecay = function() {
    const banner = document.getElementById('chrono-banner');
    const statusText = document.getElementById('chrono-status');
    
    if (banner && statusText) {
        const chrono = getChronoData();
        statusText.textContent = chrono.status;
        
        // Strip old color classes and apply the new dynamic color
        statusText.className = ''; 
        statusText.classList.add(chrono.color);
    }
};

// --- 10. NESTED DAEMON ENGINE ---
function renderDaemon() {
    const asciiEl = document.getElementById('daemon-ascii');
    const dialogueEl = document.getElementById('daemon-dialogue');
    const statusEl = document.getElementById('daemon-status');
    const container = document.getElementById('daemon-container');
    const borderEl = document.getElementById('daemon-border');
    if(!asciiEl) return;

    // 1. Determine highest RPG Stat
    const stats = { STR: 0, INT: 0, DIS: 0, CHR: 0 };
    appState.logs.forEach(log => {
        const parts = log.split('|');
        if (parts.length === 2 && parts[1] !== 'SYS_STREAK_REPAIR') {
            const taskData = appState.tasks.find(t => t.name === parts[1]);
            if (taskData) stats[taskData.attribute || 'DIS'] += taskData.xp;
        }
    });
    const highestStat = Object.keys(stats).reduce((a, b) => stats[a] > stats[b] ? a : b);

    // 2. Define State Variables
    let asciiArt = "";
    let dialogue = "";
    let status = "ONLINE";

    // 3. Evaluate System Threat & Voltage
    if (appState.threatLevel >= 100) {
        asciiArt = ` [!]\n(x_x)\n/|||\\`;
        dialogue = "CRITICAL ERROR. SYSTEM HIJACKED. DEPLOY ANTIVIRUS IMMEDIATELY.";
        status = "LOCKED";
        
        container.className = "card mb-4 border-danger daemon-card";
        borderEl.className = "border-start border-danger ps-4 w-100";
        asciiEl.className = "mb-0 me-4 fw-bold daemon-glitch";
        statusEl.className = "badge bg-danger text-dark";
    } 
    else if (appState.threatLevel >= 50) {
        asciiArt = ` [?]\n(~_~)\n/|||\\`;
        dialogue = "Warning. Threat spreading. System integrity compromised. Execute objectives to purge.";
        status = "INFECTED";
        
        container.className = "card mb-4 border-warning daemon-card";
        borderEl.className = "border-start border-warning ps-4 w-100";
        asciiEl.className = "mb-0 me-4 fw-bold text-warning daemon-glitch";
        statusEl.className = "badge bg-warning text-dark";
    } 
    else if (appState.isOverclocked) {
        asciiArt = ` [*]\n(0_0)\n/|||\\`;
        dialogue = "Grid voltage maximum. 1.2X routing stable. Maintain velocity.";
        status = "OVERCLOCKED";
        
        container.className = "card mb-4 border-info daemon-card";
        borderEl.className = "border-start border-info ps-4 w-100";
        asciiEl.className = "mb-0 me-4 fw-bold daemon-overclocked";
        statusEl.className = "badge bg-info text-dark";
    } 
    else {
        asciiArt = ` [.]\n(>_<)\n/|||\\`;
        status = "ONLINE";
        
        container.className = "card mb-4 border-success daemon-card";
        borderEl.className = "border-start border-success ps-4 w-100";
        asciiEl.className = "mb-0 me-4 fw-bold text-success";
        statusEl.className = "badge bg-success text-dark";

        // Flavor text based on your actual real-world habits
        const flavors = {
            STR: "Sensors indicate optimal physical conditioning. Keep lifting.",
            INT: "Algorithms compiled. Processing speed nominal. Keep coding.",
            DIS: "Routines synchronized. Consistency is the true ultimate weapon.",
            CHR: "Social matrix stable. Maintenance protocols complete."
        };
        dialogue = flavors[highestStat];
        
        // Dynamic Bounty Alert
        if (appState.dailyBountyTask) {
            const todayStr = getTodayStr();
            const isBountyDone = appState.logs.includes(`${todayStr}|${appState.dailyBountyTask}`);
            
            if (!isBountyDone) {
                dialogue += `\n>> PRIORITY: Neutralize [${appState.dailyBountyTask}] for XP exploit.`;
            } else {
                dialogue += `\n>> PRIORITY: Target [${appState.dailyBountyTask}] neutralized. Awaiting next cycle.`;
            }
        }
    }

    // Inject to DOM
    asciiEl.textContent = asciiArt;
    dialogueEl.textContent = dialogue;
    statusEl.textContent = status;
}

// --- 11. CUSTOM SYSTEM ALERTS ---
let sysModalInstance = null;

function showSysModal(message, type = 'info', onConfirm = null) {
    if (!sysModalInstance) {
        sysModalInstance = new bootstrap.Modal(document.getElementById('sysModal'));
    }
    
    const content = document.getElementById('sysModalContent');
    const icon = document.getElementById('sysModalIcon');
    const msgEl = document.getElementById('sysModalMessage');
    const btnContainer = document.getElementById('sysModalButtons');
    
    // Reset styles
    content.className = 'modal-content bg-black rounded-0 border';
    btnContainer.innerHTML = '';
    msgEl.textContent = message;

    // Apply thematic styling based on alert type
    if (type === 'danger') {
        content.classList.add('border-danger');
        icon.innerHTML = '<i class="bi bi-exclamation-triangle-fill text-danger"></i>';
        msgEl.className = 'fw-bold mb-4 text-danger';
    } else if (type === 'success') {
        content.classList.add('border-success');
        icon.innerHTML = '<i class="bi bi-check-circle-fill text-success"></i>';
        msgEl.className = 'fw-bold mb-4 text-success';
    } else {
        content.classList.add('border-info');
        icon.innerHTML = '<i class="bi bi-info-circle-fill text-info"></i>';
        msgEl.className = 'fw-bold mb-4 text-info';
    }

    if (onConfirm) {
        // Build a Confirmation Dialog (Two Buttons)
        const btnCancel = document.createElement('button');
        btnCancel.className = 'btn btn-outline-secondary fw-bold rounded-0';
        btnCancel.textContent = '> ABORT';
        btnCancel.onclick = () => sysModalInstance.hide();

        const btnOk = document.createElement('button');
        btnOk.className = `btn ${type === 'danger' ? 'btn-outline-danger' : 'btn-outline-success'} fw-bold rounded-0`;
        btnOk.textContent = '> EXECUTE';
        btnOk.onclick = () => {
            sysModalInstance.hide();
            onConfirm();
        };

        btnContainer.appendChild(btnCancel);
        btnContainer.appendChild(btnOk);
    } else {
        // Build a Standard Alert (One Button)
        const btnOk = document.createElement('button');
        btnOk.className = `btn ${type === 'danger' ? 'btn-outline-danger' : 'btn-outline-success'} fw-bold rounded-0 w-100`;
        btnOk.textContent = '> ACKNOWLEDGE';
        btnOk.onclick = () => sysModalInstance.hide();
        btnContainer.appendChild(btnOk);
    }

    sysModalInstance.show();
}

// --- 12. BLACK ICE OPERATIONS ENGINE ---
window.attackBoss = function(index, damage) {
    const boss = appState.operations[index];
    if (boss.defeated) return;

    if (appState.xp >= damage) {
        appState.xp -= damage;
        boss.currentHp = Math.max(0, boss.currentHp - damage);

        SFX.attack();
        
        const bossCard = document.getElementById(`boss-card-${index}`);
        if(bossCard) {
            bossCard.classList.add('taking-damage');
            setTimeout(() => bossCard.classList.remove('taking-damage'), 300);
        }

        saveState();
        renderOperations(); 
        renderDashboard();  

        if (boss.currentHp <= 0) {
            boss.defeated = true;
            
            // --- CALCULATE AND INJECT BONUS REWARD ---
            const reward = Math.floor(boss.maxHp * 0.5);
            appState.xp += reward;
            appState.lifetimeXp += reward;
            
            const levelData = getLevelData(appState.lifetimeXp);
            if (levelData.level > appState.level) {
                const oldRank = getRankData(appState.level).name;
                appState.level = levelData.level;
                const newRankData = getRankData(appState.level);
                
                if (newRankData.name !== oldRank) {
                    // --- REMOVED THE setTimeout and showSysModal ---
                    // --- INJECTED FULL SCREEN OVERLAY TRIGGER ---
                    showPromotionScreen(newRankData); 
                } else {
                    SFX.levelUp();
                }
            }
            
            saveState();
            setTimeout(() => {
                SFX.bossDefeat();
                showSysModal(`[!] SYSTEM BREACHED [!]\n\nOPERATION [${boss.name}] COMPLETE.\n\nENCRYPTION SHATTERED.\n> +${reward} XP BONUS REWARD.`, "success");
                renderOperations();
                renderDashboard(); // Force update the XP bar
            }, 400);
        }
    } else {
        SFX.error();
        showSysModal(`SYS_ERR: INSUFFICIENT XP TO COMPILE MALWARE.\nREQUIRES: ${damage} XP.`, "danger");
    }
};

function renderOperations() {
    const container = document.getElementById('operations-container');
    if (!container) return;
    container.innerHTML = '';

    appState.operations.forEach((boss, index) => {
        const hpPercent = (boss.currentHp / boss.maxHp) * 100;
        const isDefeated = boss.defeated;

        const col = document.createElement('div');
        col.className = 'col-md-6';

        col.innerHTML = `
            <div class="card border-${isDefeated ? 'success' : 'danger'} h-100 boss-card" id="boss-card-${index}">
                <div class="card-header border-${isDefeated ? 'success' : 'danger'} text-${isDefeated ? 'success' : 'danger'} fw-bold d-flex justify-content-between align-items-center">
                    <span class="text-truncate me-2"><i class="bi bi-hdd-network-fill me-2"></i>> ${boss.name}</span>
                    <span class="badge bg-${isDefeated ? 'success' : 'danger'} text-dark">${isDefeated ? 'BREACHED' : 'ENCRYPTED'}</span>
                </div>
                <div class="card-body text-center py-4">
                    <i class="bi bi-server display-3 text-${isDefeated ? 'success' : 'danger'} mb-3 d-block boss-icon"></i>
                    <p class="text-muted small mb-4">> ${boss.desc}</p>
                    
                    <div class="d-flex justify-content-between fw-bold mb-1 text-${isDefeated ? 'success' : 'danger'} small">
                        <span>INTEGRITY_SHIELD</span>
                        <span>${boss.currentHp} / ${boss.maxHp} HP</span>
                    </div>
                    <div class="progress rounded-0 border border-${isDefeated ? 'success' : 'danger'} bg-black mb-4" style="height: 20px;">
                        <div class="progress-bar bg-${isDefeated ? 'success' : 'danger'} boss-hp-bar" style="width: ${hpPercent}%;"></div>
                    </div>

                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-${isDefeated ? 'success' : 'danger'} w-100 fw-bold btn-attack flex-fill p-1" 
                            onclick="attackBoss(${index}, 100)" ${isDefeated || appState.xp < 100 ? 'disabled' : ''}>
                            > INJECT (-100)
                        </button>
                        <button class="btn btn-${isDefeated ? 'success' : 'danger'} text-dark w-100 fw-bold btn-attack flex-fill p-1" 
                            onclick="attackBoss(${index}, 500)" ${isDefeated || appState.xp < 500 ? 'disabled' : ''}>
                            > NUKE (-500)
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

function renderAll() {
    calculateOverclock();
    renderChronoDecay();
    renderDashboard();
    renderStatRadar();
    renderDaemon();
    renderCalendar();
    renderLadder();
    renderTrophies();
    renderSettings();
    renderStore();
    renderOperations();
    evaluateArtifacts(false);
}

document.getElementById('btn-hard-reset').addEventListener('click', () => {
    showSysModal("SYS_WARN: INITIATE FULL DATABASE PURGE?\nTHIS CANNOT BE UNDONE.", 'danger', () => {
        
        // Wait 300ms for the first modal's fade animation to clear
        setTimeout(() => {
            SFX.error(); // <-- ADD THIS LINE TOO
            showSysModal("FINAL OVERRIDE:\nCONFIRM SYSTEM WIPE.", 'danger', () => {
                localStorage.removeItem(STORAGE_KEY);
                window.location.reload(); 
            });
        }, 300); 
        
    });
});

// --- 7. STREAK REPAIR LOGIC ---
function executeStreakRepair(dateStr) {
    if (appState.xp >= 500) {
        appState.xp -= 500; // Deduct the currency
        
        // Inject the artificial patch log
        appState.logs.push(`${dateStr}|SYS_STREAK_REPAIR`);
        saveState();
        
        // Close the modal and re-render the UI
        const modalEl = document.getElementById('executionLogModal');
        const modalInstance = bootstrap.Modal.getInstance(modalEl);
        modalInstance.hide();
        
        renderAll();
    }
}

// ==========================================
// HARD DRIVE SAVE & LOAD SYSTEM
// ==========================================

async function saveToDisk() {
    try {
        // 1. Opens the Windows "Save As" dialog so you can choose your D: drive
        const fileHandle = await window.showSaveFilePicker({
            suggestedName: 'lifequest_database.json',
            types: [{
                description: 'LifeQuest Save File',
                accept: { 'application/json': ['.json'] },
            }],
        });

        // 2. Creates a writable stream
        const writable = await fileHandle.createWritable();
        
        // 3. Writes your current app state into the file
        await writable.write(JSON.stringify(appState));
        
        // 4. Closes the file to save it safely
        await writable.close();
        
        alert("Success: LifeQuest database securely saved to your PC!");
    } catch (err) {
        // Ignore the error if the user just clicked "Cancel" on the popup
        if (err.name !== 'AbortError') {
            console.error("Save failed:", err);
            alert("Failed to save. Your browser might not support this feature.");
        }
    }
}

async function loadFromDisk() {
    try {
        // 1. Opens the Windows "Open File" dialog
        const [fileHandle] = await window.showOpenFilePicker({
            types: [{
                description: 'LifeQuest Save File',
                accept: { 'application/json': ['.json'] },
            }],
        });

        // 2. Reads the file you selected from the D: drive
        const file = await fileHandle.getFile();
        const contents = await file.text();
        
        // 3. Injects the loaded data into your app and local storage
        appState = JSON.parse(contents);
        localStorage.setItem(STORAGE_KEY, contents);
        
        // 4. Refreshes the page to visually apply all loaded data
        location.reload();
    } catch (err) {
        if (err.name !== 'AbortError') {
            console.error("Load failed:", err);
            alert("Failed to load file. Ensure it is a valid LifeQuest JSON file.");
        }
    }
}

// --- 13. OPERATION DEPLOYMENT LOGIC ---
document.getElementById('btn-update-boss').addEventListener('click', () => {
    const nameInput = document.getElementById('input-boss-name').value.trim();
    const descInput = document.getElementById('input-boss-desc').value.trim();
    const hpInput = parseInt(document.getElementById('input-boss-hp').value.trim(), 10);

    if (nameInput && descInput && !isNaN(hpInput) && hpInput > 0) {
        showSysModal(`> DEPLOY NEW OPERATION [${nameInput}]?`, 'danger', () => {
            
            // Push to array instead of overwriting!
            appState.operations.push({
                name: nameInput,
                desc: descInput,
                maxHp: hpInput,
                currentHp: hpInput,
                defeated: false
            });
            saveState();
            
            // Clear the input fields
            document.getElementById('input-boss-name').value = '';
            document.getElementById('input-boss-desc').value = '';
            document.getElementById('input-boss-hp').value = '';
            
            renderAll();
            
            setTimeout(() => {
                showSysModal(`[SYS_MSG] NEW OPERATION DEPLOYED TO GRID.`, 'success');
            }, 300);
            
        });
    } else {
        SFX.error();
        showSysModal("SYS_ERR: INVALID_PARAMETERS.\nALL FIELDS REQUIRE VALID DATA.", "danger");
    }
});

// --- 14. TELEMETRY BACKUP PROTOCOL (EXPORT/IMPORT) ---

// Export Logic
window.exportTelemetry = function() {
    const dataStr = JSON.stringify(appState, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    // Generate a precise timestamp (e.g., 1430 for 2:30 PM)
    const now = new Date();
    const timeSig = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    
    const a = document.createElement('a');
    a.href = url;
    // Append the time signature to the filename
    a.download = `lifequest_telemetry_${getTodayStr()}_${timeSig}.json`; 
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    SFX.success();
    showSysModal("SYS_MSG: TELEMETRY EXPORTED SUCCESSFULLY.\nSAFEGUARD THIS PAYLOAD.", "success");
};

// Import Logic (Trigger hidden file input)
document.getElementById('btn-import-telemetry').addEventListener('click', () => {
    document.getElementById('file-import-input').click();
});

// Import Logic (Process the uploaded file)
document.getElementById('file-import-input').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedState = JSON.parse(e.target.result);
            
            // Basic security check to ensure it's actually our app's save file
            if (importedState && importedState.tasks !== undefined && importedState.xp !== undefined) {
                
                showSysModal(`> DECRYPT PAYLOAD [${file.name}]?\nTHIS WILL OVERRIDE CURRENT SYSTEM STATE.`, "warning", () => {
                    // Inject the new data and restart the UI
                    appState = importedState;
                    saveState();
                    SFX.bossDefeat(); // Play the massive fanfare
                    window.location.reload(); 
                });
                
            } else {
                SFX.error();
                showSysModal("SYS_ERR: INVALID PAYLOAD SIGNATURE.\nFILE REJECTED.", "danger");
            }
        } catch (err) {
            SFX.error();
            showSysModal("SYS_ERR: CORRUPT JSON FILE.\nDECRYPTION FAILED.", "danger");
        }
        
        // Reset the input so you can upload the same file again if needed
        event.target.value = ''; 
    };
    reader.readAsText(file);
});

// --- 15. SPRINT RETROSPECTIVE (ANALYTICS ENGINE) ---
window.generateSprintDebrief = function() {
    // 1. Establish Timeframe (Last 7 Days)
    const today = new Date();
    const past7Days = [];
    for(let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        past7Days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }

    let cycleXp = 0;
    const stats = { STR: 0, INT: 0, DIS: 0, CHR: 0 };
    let tasksScheduled = 0;
    let tasksCompleted = 0;
    const dailyCounts = [];

    // 2. Data Mining
    past7Days.forEach(dateStr => {
        const logsForDay = appState.logs.filter(log => log.startsWith(dateStr));
        const d = new Date(dateStr);
        const dayOfWeek = d.getDay();
        
        // Count how many tasks were supposed to be done this day
        const activeTasks = appState.tasks.filter(t => t.activeDays.includes(dayOfWeek));
        tasksScheduled += activeTasks.length;
        
        let dayCompletion = 0;

        logsForDay.forEach(log => {
            const parts = log.split('|');
            if(parts.length === 2 && parts[1] !== 'SYS_STREAK_REPAIR') {
                const taskData = appState.tasks.find(t => t.name === parts[1]);
                if (taskData) {
                    // Include Cyberware multipliers in the audit
                    let xpEarned = taskData.xp;
                    if (appState.implants && appState.implants[taskData.attribute]) {
                        xpEarned = Math.floor(xpEarned * 1.2);
                    }
                    cycleXp += xpEarned;
                    stats[taskData.attribute || 'DIS'] += xpEarned;
                    tasksCompleted++;
                    dayCompletion++;
                }
            } else if (parts[1] === 'SYS_STREAK_REPAIR') {
                dayCompletion = activeTasks.length; // Override for graph if streak was repaired
            }
        });
        
        dailyCounts.push(dayCompletion);
    });

    // 3. Populate UI Text
    document.getElementById('debrief-xp').textContent = `+${cycleXp}`;
    
    let dominant = 'N/A';
    let maxStat = 0;
    for (const [key, value] of Object.entries(stats)) {
        if(value > maxStat) { maxStat = value; dominant = `[${key}]`; }
    }
    document.getElementById('debrief-stat').textContent = dominant;
    
    const rate = tasksScheduled > 0 ? Math.round((tasksCompleted / tasksScheduled) * 100) : 0;
    document.getElementById('debrief-rate').textContent = `${rate}%`;

    // 4. Render Dynamic Bar Graph
    const graph = document.getElementById('debrief-graph');
    const labels = document.getElementById('debrief-labels');
    graph.innerHTML = '';
    labels.innerHTML = '';
    
    const maxCount = Math.max(...dailyCounts, 1); // Avoid division by zero
    
    dailyCounts.forEach((count, i) => {
        const heightPct = (count / maxCount) * 100;
        
        // Bar wrapper
        const barWrap = document.createElement('div');
        barWrap.className = 'd-flex flex-column justify-content-end align-items-center w-100';
        barWrap.style.height = '100%';
        barWrap.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        
        // Actual glowing bar
        const bar = document.createElement('div');
        bar.className = 'bg-success';
        bar.style.width = '100%';
        bar.style.height = '0%'; // Start at 0 for animation
        bar.style.transition = 'height 1s cubic-bezier(0.4, 0, 0.2, 1)';
        bar.style.boxShadow = '0 0 10px rgba(57, 255, 20, 0.5)';
        
        barWrap.appendChild(bar);
        graph.appendChild(barWrap);
        
        // Trigger CSS animation slightly after load
        setTimeout(() => { bar.style.height = `${heightPct}%`; }, 100 + (i * 50));
        
        // X-Axis Labels
        const d = new Date(past7Days[i]);
        const dayName = ['SUN','MON','TUE','WED','THU','FRI','SAT'][d.getDay()];
        const label = document.createElement('div');
        label.className = 'w-100 text-center';
        label.textContent = dayName;
        labels.appendChild(label);
    });

    SFX.clack();
    const modal = new bootstrap.Modal(document.getElementById('debriefModal'));
    modal.show();
};

// --- 16. ENCRYPTED CODEX ENGINE ---
window.openCodex = function(taskName, manualText) {
    document.getElementById('codex-title').textContent = `> ${taskName}_MANUAL`;
    document.getElementById('codex-content').textContent = manualText;
    SFX.clack();
    const modal = new bootstrap.Modal(document.getElementById('codexModal'));
    modal.show();
};

// --- 16.5 ONBOARDING & BEGINNER'S MANUAL ---
const tutorialSteps = [
    "> INITIATING FIRST BOOT PROTOCOL...\n> WELCOME TO LIFEQUEST, SYSTEM ADMIN.\n\nI AM YOUR SYS_DAEMON. I WILL BE GUIDING YOUR INITIAL CALIBRATION.",
    "> ZONE 1: THE VITALS\n\nYour dashboard tracks LEVEL, XP, and THREAT LEVEL.\nSkipping routines increases THREAT. If Threat hits 100%, the system initiates CRITICAL LOCKDOWN.",
    "> ZONE 2: THE BATTLEFIELD\n\nExecute tasks in [TODAYS_OBJECTIVES] to earn XP.\nComplete Sub-tasks to trigger COMBO BONUSES.\nBeware of CHRONO DECAY: XP yields degrade as the day gets later.",
    "> ZONE 3: BLACK MARKET & OPS\n\nSpend XP in the [BLACK_MARKET] to buy CYBERWARE, CONSUMABLES, and THEMES.\n\nDeploy [BLACK_ICE_OPS] to shatter server bosses for massive XP explosions.",
    "> CALIBRATION COMPLETE.\n\n> THE GRIND IS NOW LIVE. DO NOT FAIL."
];

let currentTutorialStep = 0;

window.runOnboardingProtocol = function() {
    if (appState.tutorialCompleted) return;
    
    const overlay = document.getElementById('tutorial-overlay');
    const textEl = document.getElementById('tutorial-text');
    const btn = document.getElementById('btn-tutorial-next');
    
    overlay.classList.remove('d-none');
    btn.classList.add('d-none');
    textEl.innerHTML = '';
    
    let charIndex = 0;
    const currentText = tutorialSteps[currentTutorialStep];
    
    // Hacker Typewriter Effect
    const typeInterval = setInterval(() => {
        textEl.innerHTML += currentText.charAt(charIndex);
        if (charIndex % 3 === 0) SFX.clack(); // Play sound every 3 characters
        charIndex++;
        
        if (charIndex >= currentText.length) {
            clearInterval(typeInterval);
            btn.classList.remove('d-none');
            SFX.success();
        }
    }, 25);
    
    btn.onclick = () => {
        currentTutorialStep++;
        SFX.clack();
        if (currentTutorialStep < tutorialSteps.length) {
            runOnboardingProtocol(); // Load next slide
        } else {
            appState.tutorialCompleted = true;
            saveState();
            overlay.classList.add('d-none');
            SFX.levelUp(); // Fanfare on completion
        }
    };
};

window.openBeginnersManual = function() {
    const manualText = `> LIFEQUEST_MASTER_PROTOCOL (v1.0.0)

// 1. CORE LOOP
- Execute tasks to grind XP.
- XP is the currency for Upgrades and Boss Attacks.
- Leveling up promotes your Competitive Rank on the Ladder.

// 2. THREAT SYSTEM
- Every day you skip tasks, THREAT LEVEL rises.
- At 100% Threat, the terminal LOCKS DOWN.
- Spend 200 XP to INJECT_ANTIVIRUS and lower Threat.

// 3. CHRONO DECAY
- Morning (00:00 - 11:59): 100% XP Yield.
- Afternoon (12:00 - 17:59): 80% XP Yield.
- Night (18:00 - 23:59): 50% XP Yield.
* Execute early to maximize gains.

// 4. ECONOMY & UPGRADES
- BLACK MARKET: Buy Themes, Cyberware (+20% attribute XP), and Consumables (Data Scrapers, Chrono Bypasses).
- BLACK ICE OPS: Spend XP to deal damage to Bosses. Defeating them yields a massive bonus reward.

// 5. ARTIFACT VAULT
- Artifacts are unlocked silently by reaching hidden conditions (e.g., maintaining streaks, hoarding time bypasses, or crushing your code deployments).`;
    
    openCodex("LIFEQUEST_MASTER_PROTOCOL", manualText);
};

// --- 17. SYSTEM BOOT SEQUENCE ---
const bootLines = [
    "BIOS Date 06/03/26 12:24:17 Ver 08.00.15",
    "CPU: Neural Coprocessor @ 4.2GHz",
    "Memory Test: 65536K OK",
    "Mounting /dev/sda1... OK",
    "Loading LifeQuest Master Protocol...",
    "Decrypting payload...",
    "Access Granted. Welcome, System Admin."
];

function runBootSequence() {
    const bootScreen = document.getElementById('boot-screen');
    const bootText = document.getElementById('boot-text');
    
    // Fallback in case HTML isn't added
    if (!bootScreen || !bootText) {
        initApp();
        return;
    }

    let delay = 0;
    bootText.innerHTML = "";

    // Iterate through lines with randomized delays for a stuttering hacker-terminal effect
    bootLines.forEach((line, index) => {
        setTimeout(() => {
            bootText.innerHTML += `> ${line}\n`;
            SFX.clack(); 
        }, delay);
        
        delay += Math.floor(Math.random() * 300) + 150; 
    });

    // Terminate sequence and load the dashboard
    setTimeout(() => {
        bootScreen.classList.add('hidden');
        SFX.success(); 
        initApp(); 
        
        // Purge the element from the DOM after the fade animation completes
        setTimeout(() => {
            bootScreen.remove();
            // --- TRIGGER ONBOARDING IF NOT COMPLETE ---
            if (!appState.tutorialCompleted) {
                runOnboardingProtocol();
            }
        }, 800);
    }, delay + 500);
}

// Override default initialization
window.onload = runBootSequence;
