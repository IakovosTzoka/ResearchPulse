// --- 0. INSTANT UI SILENCER ---
(function() {
    const isDistracted = window.location.href.includes("/shorts/") || 
                         window.location.href.includes("/reels/") || 
                         window.location.href.includes("tiktok.com");
    
    const grace = localStorage.getItem('rp_grace_until') || 0;
    if (isDistracted && Date.now() > grace) {
        const style = document.createElement('style');
        style.id = 'rp-hide-body';
        style.innerHTML = `body { display: none !important; }`;
        document.documentElement.appendChild(style);
    }
})();

// --- 1. CONFIGURATION & LIBRARY ---
const ARXIV_LIBRARY = {
    "Physics (Condensed Matter)": "cond-mat",
    "Physics (High Energy)": "hep-ex",
    "Quantum Physics": "quant-ph",
    "Computer Science": "cs",
    "Mathematics": "math",
    "Electrical Engineering": "eess",
    "Quantitative Biology": "q-bio",
    "Quantitative Finance": "q-fin",
    "Statistics": "stat"
};

let isOverlayPresent = false;
let startTime = null;
let gracePeriodUntil = parseInt(localStorage.getItem('rp_grace_until') || '0');
let titleObserver = null;

// --- 2. STATS & INTEREST LOGIC ---
const getRankData = (mins) => {
    if (mins < 15) return { title: "Lab Assistant", min: 0, max: 15, color: "#94a3b8" };
    if (mins < 60) return { title: "Undergrad", min: 15, max: 60, color: "#38bdf8" };
    if (mins < 300) return { title: "Graduate", min: 60, max: 300, color: "#818cf8" };
    if (mins < 900) return { title: "Post Doc", min: 300, max: 900, color: "#a78bfa" };
    if (mins < 3000) return { title: "Professor", min: 900, max: 3000, color: "#fb7185" };
    return { title: "Nobel", min: 3000, max: 10000, color: "#fbbf24" };
};

const updateStat = (key, val = 1) => {
    const current = parseInt(localStorage.getItem(key) || '0');
    localStorage.setItem(key, current + val);
};

const getStreak = () => {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('rp_last_date');
    let streak = parseInt(localStorage.getItem('rp_streak') || '0');
    if (lastDate === today) return streak; 
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastDate === yesterday.toDateString()) { streak++; } 
    else { streak = 1; }
    localStorage.setItem('rp_streak', streak);
    localStorage.setItem('rp_last_date', today);
    return streak;
};

const getUserInterests = () => {
    try { return JSON.parse(localStorage.getItem('rp_interests')); } catch (e) { return null; }
};

const getRecentSearches = () => {
    try { return JSON.parse(localStorage.getItem('rp_history') || '[]'); } catch (e) { return []; }
};

const saveSearch = (term) => {
    if (!term || term.trim() === "") return;
    try {
        let history = getRecentSearches();
        history = history.filter(h => h.toLowerCase() !== term.toLowerCase());
        history.unshift(term);
        if (history.length > 3) history.pop();
        localStorage.setItem('rp_history', JSON.stringify(history));
    } catch (e) { console.warn("History save failed."); }
};

// --- 3. DYNAMIC SCRAPER ---
async function getArxivPaper() {
    try {
        const interests = getUserInterests() || ["quant-ph"];
        const randomSlug = interests[Math.floor(Math.random() * interests.length)];
        const response = await fetch(`https://arxiv.org/list/${randomSlug}/new`);
        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");
        const listItems = doc.querySelectorAll('dl#articles dt');
        const metaItems = doc.querySelectorAll('dl#articles dd');
        
        if (listItems.length > 0) {
            const idx = Math.floor(Math.random() * Math.min(listItems.length, 15));
            const titleEl = metaItems[idx].querySelector('.list-title');
            const title = titleEl ? titleEl.textContent.replace('Title:', '').trim() : "Research Entry";
            const authors = metaItems[idx].querySelector('.list-authors')?.innerText.replace('Authors:', '').trim() || "Unknown Researchers";
            const pdfLink = listItems[idx].querySelector('a[title="Download PDF"]');
            const paperUrl = pdfLink ? `https://arxiv.org${pdfLink.getAttribute('href')}` : "https://arxiv.org";
            
            let cleanAbstract = "";
            const abstractEl = metaItems[idx].querySelector('.list-abstract') || metaItems[idx].querySelector('p.mathjax');
            if (abstractEl) {
                let tempDiv = abstractEl.cloneNode(true);
                const descriptor = tempDiv.querySelector('.descriptor');
                if (descriptor) descriptor.remove();
                cleanAbstract = tempDiv.textContent.replace(/^Abstract:\s*/i, '').trim();
            }

            return { title, authors, fullAbstract: cleanAbstract || "Abstract in PDF.", paperUrl, category: randomSlug.toUpperCase() };
        }
    } catch (e) { console.error(e); }
    return { title: "Connection Error", authors: "N/A", fullAbstract: "Check connection.", paperUrl: "https://arxiv.org", category: "SYSTEM" };
}

// --- 4. ONBOARDING ---
function renderOnboarding(overlay) {
    overlay.innerHTML = `
        <div id="ui-container" style="max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; padding: 40px; background: rgba(15, 23, 42, 0.95); border-radius: 35px; border: 1px solid rgba(56, 189, 248, 0.2); backdrop-filter: blur(20px); text-align: center; box-sizing: border-box;">
            <h1 style="font-size: 2rem; color: #fff; margin-bottom: 10px;">Welcome, Researcher</h1>
            <p style="color: #94a3b8; margin-bottom: 30px;">Select fields you wish to master.</p>
            <div id="interest-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 35px;">
                ${Object.keys(ARXIV_LIBRARY).map(name => `<div class="interest-item" data-slug="${ARXIV_LIBRARY[name]}" style="padding: 12px; border: 1px solid #334155; border-radius: 12px; cursor: pointer; color: #94a3b8; transition: 0.2s; font-size: 0.85rem;">${name}</div>`).join('')}
            </div>
            <button id="btn-save-interests" style="padding: 16px 40px; background: #38bdf8; color: #0f172a; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; width: 100%; opacity: 0.5; pointer-events: none;">SELECT AT LEAST ONE</button>
        </div>`;

    const selected = new Set();
    const btn = document.getElementById("btn-save-interests");
    document.querySelectorAll('.interest-item').forEach(item => {
        item.onclick = () => {
            const slug = item.dataset.slug;
            if (selected.has(slug)) { selected.delete(slug); item.style.borderColor = "#334155"; item.style.background = "transparent"; }
            else { selected.add(slug); item.style.borderColor = "#38bdf8"; item.style.background = "rgba(56, 189, 248, 0.1)"; }
            btn.style.opacity = selected.size > 0 ? "1" : "0.5";
            btn.style.pointerEvents = selected.size > 0 ? "all" : "none";
        };
    });
    btn.onclick = () => {
        localStorage.setItem('rp_interests', JSON.stringify(Array.from(selected)));
        isOverlayPresent = false; overlay.remove(); renderIntervention();
    };
}

// --- 5. MAIN INTERVENTION ---
async function renderIntervention() {
    if (isOverlayPresent) return;
    isOverlayPresent = true;
    startTime = Date.now();

    // Time Heartbeat (Saves progress every minute)
    const timeHeartbeat = setInterval(() => {
        if (isOverlayPresent) {
            updateStat('rp_minutes', 1);
            const disp = document.getElementById("stat-minutes-display");
            if (disp) disp.innerText = `${localStorage.getItem('rp_minutes')} Minutes Saved`;
        }
    }, 60000);

    const hider = document.getElementById('rp-hide-body');
    if (hider) hider.remove();
    document.body.style.display = "block"; 

    if (!document.getElementById("mathjax-config")) {
        const configScript = document.createElement("script");
        configScript.id = "mathjax-config";
        configScript.text = `window.MathJax = { tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']], displayMath: [['$$', '$$']], processEscapes: true } };`;
        document.head.appendChild(configScript);
        const mjScript = document.createElement("script");
        mjScript.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js";
        mjScript.async = true;
        document.head.appendChild(mjScript);
    }

    const originalTitle = document.title;
    const targetTitle = "Research Pulse";
    document.title = targetTitle;
    
    titleObserver = new MutationObserver(() => { if (document.title !== targetTitle) document.title = targetTitle; });
    titleObserver.observe(document.querySelector('title'), { subtree: true, characterData: true, childList: true });

    const setFavicon = (emoji) => {
        const canvas = document.createElement("canvas"); canvas.height = 64; canvas.width = 64;
        const ctx = canvas.getContext("2d"); ctx.font = "64px serif"; ctx.fillText(emoji, 0, 56);
        let link = document.createElement('link');
        link.id = 'rp-favicon'; 
        link.rel = 'icon';
        link.href = canvas.toDataURL();
        document.head.appendChild(link);
    };
    setFavicon("🧠");

    const restoreTab = () => { 
        clearInterval(timeHeartbeat);
        if (titleObserver) titleObserver.disconnect(); 
        document.title = originalTitle; 
        const customFavicon = document.getElementById('rp-favicon');
        if (customFavicon) customFavicon.remove(); 
    };

    const silence = () => document.querySelectorAll('video').forEach(v => { v.pause(); v.muted = true; });
    silence();
    const silenceInterval = setInterval(silence, 300);

    const overlay = document.createElement("div");
    overlay.id = "focus-overlay";
    overlay.style.cssText = `position:fixed; top:0; left:0; width:100vw; height:100vh; background: radial-gradient(circle at center, #1e293b, #0f172a); color:white; z-index:2147483647; display:flex; flex-direction:column; align-items:center; justify-content:center; font-family:-apple-system, sans-serif; padding: 20px; box-sizing: border-box;`;
    document.body.appendChild(overlay);

    if (!getUserInterests()) { renderOnboarding(overlay); return; }

    const paper = await getArxivPaper();
    const stats = { minutes: parseInt(localStorage.getItem('rp_minutes') || '0'), papers: localStorage.getItem('rp_pdfs') || '0' };
    const rank = getRankData(stats.minutes);
    const streak = getStreak();
    const progress = Math.min(100, Math.floor(((stats.minutes - rank.min) / (rank.max - rank.min)) * 100));

    const history = getRecentSearches();
    const historyHTML = history.map(term => `<button class="h-chip" data-term="${term}" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#94a3b8; padding:5px 12px; border-radius:15px; cursor:pointer; font-size:0.75rem; white-space: nowrap; border:none;">↺ ${term}</button>`).join('');

    overlay.innerHTML = `
        <style>
            #ui-container { width: 95%; max-width: 820px; max-height: 85vh; display: flex; flex-direction: column; }
            .stats-header { display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 820px; margin-bottom: 30px; }
            .h-chip:hover { background: rgba(255,255,255,0.15) !important; color: white !important; }
            #arxiv-abstract::-webkit-scrollbar { width: 6px; }
            #arxiv-abstract::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
            .header-box { background: rgba(255,255,255,0.03); padding: 15px 25px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
            .gear-icon { font-size: 1.4rem; cursor: pointer; vertical-align: middle; margin-left: 10px; opacity: 0.9; color: #38bdf8; transition: transform 0.3s ease; }
            .gear-icon:hover { transform: rotate(45deg); opacity: 1; }
            .progress-bg { width: 100%; height: 6px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-top: 10px; overflow: hidden; }
            .progress-fill { height: 100%; width: ${progress}%; background: ${rank.color}; transition: width 0.5s ease; }
        </style>

        <div class="stats-header">
            <div class="header-box" style="text-align: left; min-width: 200px;">
                <div style="font-size: 0.8rem; color: #64748b; letter-spacing: 2px; font-weight: 800;">CURRENT RANK</div>
                <div style="display: flex; align-items: center;">
                    <span style="font-size: 1.8rem; font-weight: 900; color: #fff;">${rank.title.toUpperCase()}</span>
                    <span id="btn-reset" class="gear-icon">⚙</span>
                </div>
                <div class="progress-bg">
                    <div class="progress-fill"></div>
                </div>
            </div>
            <div class="header-box" style="text-align: right;">
                <div style="font-size: 0.8rem; color: #64748b; letter-spacing: 2px; font-weight: 800;">TOTAL IMPACT | 🔥 ${streak} DAY STREAK</div>
                <div style="font-size: 1.4rem; font-weight: 900; color: #38bdf8;">${stats.papers} Papers Read</div>
                <div id="stat-minutes-display" style="font-size: 1.4rem; font-weight: 900; color: #38bdf8;">${stats.minutes} Minutes Saved</div>
            </div>
        </div>

        <div id="ui-container" style="padding: 40px; background: rgba(15, 23, 42, 0.8); border-radius: 35px; border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(25px); box-sizing: border-box; overflow:hidden;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-shrink: 0;">
                <h1 style="font-size: 1.8rem; font-weight: 800; margin:0;">🧠 Research Pulse</h1>
                <span style="background: rgba(56, 189, 248, 0.15); color: #38bdf8; padding: 6px 14px; border-radius: 20px; font-weight: 700; font-size: 0.75rem;">${paper.category}</span>
            </div>
            
            <div id="math-root" style="background: rgba(0, 0, 0, 0.2); border-radius: 20px; padding: 25px; margin-bottom: 20px; display: flex; flex-direction: column; overflow: hidden; flex-grow: 1;">
                <h2 style="font-size: 1.4rem; color: #fff; margin-bottom: 5px; line-height: 1.2;">${paper.title}</h2>
                <div style="color: #38bdf8; font-size: 0.85rem; margin-bottom: 12px;">By: ${paper.authors}</div>
                <div id="arxiv-abstract" style="color: #cbd5e1; overflow-y: auto; margin-bottom: 15px; line-height: 1.6; font-size: 1rem; flex-grow: 1; padding-right: 10px;">
                    ${paper.fullAbstract}
                </div>
                <button id="btn-arxiv-link" style="background:#38bdf8; color:#0f172a; padding: 12px 24px; border-radius:10px; font-weight:800; border:none; cursor:pointer; width: fit-content; flex-shrink:0;">READ FULL PDF ↗</button>
            </div>

            <div style="flex-shrink: 0;">
                <input type="text" id="research-topic" placeholder="What are you curious about?" style="padding:18px; width:100%; border-radius:15px; border: 1px solid #1e293b; background:rgba(0,0,0,0.3); color:white; margin-bottom:12px; text-align: center; outline:none; box-sizing: border-box; font-size: 1rem;" />
                <div style="display:flex; gap:8px; justify-content:center; margin-bottom: 15px; overflow-x: auto;">${historyHTML}</div>
                <div style="display:flex; gap:10px; justify-content:center;">
                    <button id="btn-go" style="flex: 1; padding:18px; background:#fff; color:#000; font-weight:800; border-radius:15px; cursor:pointer; border:none; font-size: 1.1rem;">EXPLORE TOPIC</button>
                    <button id="btn-guilt" style="padding:12px; background:transparent; color:#475569; border:none; cursor:pointer; font-weight:600;">I’d rather waste my potential</button>
                </div>
            </div>
        </div>
    `;

    const runMathTypeset = () => {
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([document.getElementById('math-root')]).catch((err) => console.dir(err));
        }
    };
    runMathTypeset();
    setTimeout(runMathTypeset, 600);

    const runSearch = (val) => { 
        const sessionMins = Math.max(1, Math.floor((Date.now() - startTime) / 60000));
        updateStat('rp_minutes', sessionMins);
        saveSearch(val); 
        restoreTab(); 
        window.location.assign(`https://consensus.app/results/?q=${encodeURIComponent(val)}`); 
    };

    document.getElementById("btn-reset").onclick = () => { localStorage.removeItem('rp_interests'); location.reload(); };
    document.getElementById("btn-arxiv-link").onclick = () => { updateStat('rp_pdfs'); window.open(paper.paperUrl, '_blank'); };
    document.getElementById("btn-go").onclick = () => runSearch(document.getElementById("research-topic").value || "Physics");
    document.querySelectorAll(".h-chip").forEach(c => c.onclick = () => runSearch(c.dataset.term));
    
    document.getElementById("btn-guilt").onclick = () => {
        const confirmed = window.confirm("Stop learning and return to doom-scrolling?");
        if (confirmed) {
            const sessionMins = Math.max(1, Math.floor((Date.now() - startTime) / 60000));
            updateStat('rp_minutes', sessionMins);
            localStorage.setItem('rp_grace_until', Date.now() + (5 * 60 * 1000)); 
            overlay.remove(); 
            clearInterval(silenceInterval); 
            isOverlayPresent = false; 
            restoreTab();
        }
    };
}

function checkAndBlock() {
    const isDistracted = window.location.href.includes("/shorts/") || 
                         window.location.href.includes("/reels/") || 
                         window.location.href.includes("tiktok.com");
    
    if (isDistracted && !isOverlayPresent && Date.now() > parseInt(localStorage.getItem('rp_grace_until') || '0')) {
        renderIntervention();
    }
}

checkAndBlock();
setInterval(checkAndBlock, 1000);