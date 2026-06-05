// ==========================================================================
// STATE MANAGEMENT & INITIALIZATION
// ==========================================================================
const API_URL = '';
let currentUser = null;
let matchesData = [];
let leaderboardData = null;
let activeTab = 'predict-tab';
let matchFilter = 'all';
let serverTimeInterval = null;
let countdownInterval = null;
let refreshInterval = null;

// Country flag mapping (translates team name to FlagCDN ISO 2-letter codes)
const countryCodes = {
  'brazil': 'br', 'croatia': 'hr', 'france': 'fr', 'argentina': 'ar', 'mexico': 'mx', 
  'south africa': 'za', 'south korea': 'kr', 'czechia': 'cz', 'czech republic': 'cz',
  'canada': 'ca', 'bosnia and herzegovina': 'ba', 'bosnia': 'ba', 'usa': 'us', 'united states': 'us',
  'paraguay': 'py', 'haiti': 'ht', 'scotland': 'gb-sct', 'australia': 'au', 'turkey': 'tr',
  'türkiye': 'tr', 'morocco': 'ma', 'qatar': 'qa', 'switzerland': 'ch', 'ivory coast': 'ci',
  'ecuador': 'ec', 'germany': 'de', 'curaçao': 'cw', 'netherlands': 'nl', 'japan': 'jp',
  'sweden': 'se', 'tunisia': 'tn', 'iran': 'ir', 'new zealand': 'nz', 'spain': 'es',
  'cape verde': 'cv', 'belgium': 'be', 'egypt': 'eg', 'saudi arabia': 'sa', 'uruguay': 'uy',
  'senegal': 'sn', 'iraq': 'iq', 'norway': 'no', 'algeria': 'dz', 'austria': 'at',
  'jordan': 'jo', 'portugal': 'pt', 'democratic republic of the congo': 'cd', 'congo dr': 'cd',
  'england': 'gb-eng', 'uzbekistan': 'uz', 'colombia': 'co', 'ghana': 'gh', 'panama': 'pa'
};

// Returns HTML string for flag (using FlagCDN, fallbacks to emoji if not mapped)
function getFlagHtml(teamName, defaultFlag) {
  if (!teamName) return defaultFlag;
  const code = countryCodes[teamName.toLowerCase()];
  if (code) {
    return `<img src="https://flagcdn.com/w80/${code}.png" class="flag-img" alt="${teamName} Flag">`;
  }
  return `<span class="flag-emoji">${defaultFlag}</span>`;
}

// Small flags helper for tables and headers
function getFlagHtmlSmall(teamName, defaultFlag) {
  if (!teamName) return defaultFlag;
  const code = countryCodes[teamName.toLowerCase()];
  if (code) {
    return `<img src="https://flagcdn.com/w40/${code}.png" alt="${teamName}" class="flag-img-small" style="width: 22px; height: 15px; border-radius: 2px; box-shadow: 0 1px 3px rgba(0,0,0,0.3); margin: 0 3px; object-fit: cover; border: 1px solid rgba(255,255,255,0.1); vertical-align: middle;">`;
  }
  return defaultFlag;
}

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // Restore user session from localStorage
  const savedUser = localStorage.getItem('worldcup_user');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    updateUserUI();
  }

  // Setup Event Listeners
  setupEventListeners();

  // Load Initial Data
  loadMatches();
  loadLeaderboard();

  // Start Background Timers
  startTimers();
}

// ==========================================================================
// TIMERS & CLOCKS (REAL-TIME)
// ==========================================================================
function startTimers() {
  // Update footer digital clock and server time representation
  if (serverTimeInterval) clearInterval(serverTimeInterval);
  serverTimeInterval = setInterval(() => {
    const timeDisplay = document.getElementById('server-time-display');
    if (timeDisplay) {
      const now = new Date();
      timeDisplay.textContent = now.toLocaleTimeString('th-TH', { hour12: false }) + ' (UTC+7)';
    }
  }, 1000);

  // Update match countdown timers every second
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(updateCountdowns, 1000);

  // Polling data every 15 seconds for real-time leaderboard and match status
  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = setInterval(() => {
    loadMatches(true);
    loadLeaderboard(true);
  }, 15000);
}

// ==========================================================================
// EVENT LISTENERS
// ==========================================================================
function setupEventListeners() {
  // Tab Navigation
  const tabs = document.querySelectorAll('.tab-link');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const targetTab = e.currentTarget.dataset.tab;
      switchTab(targetTab);
    });
  });

  // Filters for Matches
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      matchFilter = e.currentTarget.dataset.filter;
      renderMatches();
    });
  });

  // Login Modal Trigger
  document.getElementById('login-trigger-btn').addEventListener('click', () => {
    showLoginModal(true);
  });
  
  document.getElementById('close-login-btn').addEventListener('click', () => {
    showLoginModal(false);
  });

  // Login Form Submission
  document.getElementById('login-form').addEventListener('submit', handleLogin);

  // Logout Button
  document.getElementById('logout-btn').addEventListener('click', handleLogout);

  // Admin: Add Player Form
  document.getElementById('add-player-form').addEventListener('submit', handleAddPlayer);

  // Admin: Toggle Add Match Form
  const addMatchTrigger = document.getElementById('add-match-trigger-btn');
  const addMatchForm = document.getElementById('add-match-form');
  addMatchTrigger.addEventListener('click', () => {
    addMatchForm.classList.toggle('hidden');
    addMatchTrigger.innerHTML = addMatchForm.classList.contains('hidden') 
      ? '<i class="fa-solid fa-plus"></i> เพิ่มคู่แข่ง' 
      : '<i class="fa-solid fa-minus"></i> ซ่อนฟอร์ม';
  });

  // Admin: Cancel Add Match
  document.getElementById('cancel-match-btn').addEventListener('click', () => {
    addMatchForm.classList.add('hidden');
    addMatchTrigger.innerHTML = '<i class="fa-solid fa-plus"></i> เพิ่มคู่แข่ง';
  });

  // Admin: Add Match Form Submission
  addMatchForm.addEventListener('submit', handleAddMatch);

  // Admin: Reset Database
  document.getElementById('reset-db-btn').addEventListener('click', async () => {
    const confirmReset = confirm('⚠️ คำเตือน: คุณต้องการล้างข้อมูลผู้เล่น คะแนน และผลการทายทั้งหมดในระบบใช่หรือไม่? (บัญชีผู้ดูแลระบบ (Admin) จะไม่ถูกลบ)');
    if (!confirmReset) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/reset`, {
        method: 'POST',
        headers: {
          'X-User-Id': currentUser.id
        }
      });

      const data = await response.json();
      if (data.success) {
        showToast(data.message || 'รีเซ็ตระบบและดึงข้อมูลแข่งขันจริงสำเร็จ!', 'success');
        // Refresh all local data
        loadAdminData();
        loadMatches(true);
        loadLeaderboard(true);
        switchTab('predict-tab');
      } else {
        showToast(data.message || 'ไม่สามารถรีเซ็ตระบบได้', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
    }
  });
}

function switchTab(tabId) {
  activeTab = tabId;
  
  // Update nav links styling
  const tabs = document.querySelectorAll('.tab-link');
  tabs.forEach(tab => {
    if (tab.dataset.tab === tabId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // Toggle visible sections
  const contents = document.querySelectorAll('.tab-content');
  contents.forEach(content => {
    if (content.id === tabId) {
      content.classList.remove('hidden');
    } else {
      content.classList.add('hidden');
    }
  });

  // Specific tab actions
  if (tabId === 'leaderboard-tab') {
    loadLeaderboard();
  } else if (tabId === 'admin-tab' && currentUser && currentUser.role === 'admin') {
    loadAdminData();
  } else if (tabId === 'predict-tab') {
    loadMatches();
  }
}

// ==========================================================================
// TOAST NOTIFICATIONS
// ==========================================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'fa-circle-info';
  if (type === 'success') icon = 'fa-circle-check';
  if (type === 'error') icon = 'fa-circle-exclamation';
  
  toast.innerHTML = `
    <i class="fa-solid ${icon}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.3s reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==========================================================================
// AUTHENTICATION
// ==========================================================================
function showLoginModal(show) {
  const modal = document.getElementById('login-modal');
  if (show) {
    modal.classList.remove('hidden');
    document.getElementById('login-username').focus();
  } else {
    modal.classList.add('hidden');
    document.getElementById('login-form').reset();
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const pin = document.getElementById('login-pin').value;
  
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');

  // Loading UI
  btnText.classList.add('hidden');
  btnSpinner.classList.remove('hidden');
  submitBtn.disabled = true;

  try {
    const response = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, pin })
    });

    const data = await response.json();
    
    if (data.success) {
      currentUser = data.user;
      localStorage.setItem('worldcup_user', JSON.stringify(currentUser));
      updateUserUI();
      showLoginModal(false);
      showToast(`ยินดีต้อนรับคุณ ${currentUser.name}!`, 'success');
      
      // Reload matching dataset
      loadMatches();
      loadLeaderboard();
      
      if (currentUser.role === 'admin') {
        switchTab('admin-tab');
      }
    } else {
      showToast(data.message || 'เข้าสู่ระบบล้มเหลว', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
  } finally {
    btnText.classList.remove('hidden');
    btnSpinner.classList.add('hidden');
    submitBtn.disabled = false;
  }
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('worldcup_user');
  updateUserUI();
  showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
  switchTab('predict-tab');
  loadMatches();
  loadLeaderboard();
}

function updateUserUI() {
  const userStatus = document.getElementById('user-status');
  const loginTriggerBtn = document.getElementById('login-trigger-btn');
  const displayName = document.getElementById('display-name');
  const userRole = document.getElementById('user-role');
  const adminTabBtn = document.getElementById('admin-tab-btn');

  if (currentUser) {
    displayName.textContent = currentUser.name;
    userRole.textContent = currentUser.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'ผู้เล่น (Player)';
    userStatus.classList.remove('hidden');
    loginTriggerBtn.classList.add('hidden');

    if (currentUser.role === 'admin') {
      adminTabBtn.classList.remove('hidden');
    } else {
      adminTabBtn.classList.add('hidden');
    }
  } else {
    userStatus.classList.add('hidden');
    loginTriggerBtn.classList.remove('hidden');
    adminTabBtn.classList.add('hidden');
  }
}

// ==========================================================================
// MATCH DATA MANAGEMENT
// ==========================================================================
async function loadMatches(silent = false) {
  const grid = document.getElementById('matches-grid');
  if (!silent && matchesData.length === 0) {
    grid.innerHTML = `
      <div class="loading-spinner">
        <i class="fa-solid fa-circle-notch fa-spin"></i> กำลังโหลดตารางแข่งแข่งขัน...
      </div>
    `;
  }

  const headers = {};
  if (currentUser) {
    headers['X-User-Id'] = currentUser.id;
  }

  try {
    const response = await fetch(`${API_URL}/api/matches`, { headers });
    if (!response.ok) throw new Error('Failed to fetch matches');
    
    matchesData = await response.json();
    renderMatches();
  } catch (err) {
    console.error(err);
    if (!silent) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-triangle-exclamation text-danger"></i>
          <p>ไม่สามารถดึงข้อมูลตารางแข่งขันได้ในขณะนี้</p>
        </div>
      `;
    }
  }
}

function renderMatches() {
  const grid = document.getElementById('matches-grid');
  
  // Filter matches
  const filteredMatches = matchesData.filter(match => {
    if (matchFilter === 'all') return true;
    if (matchFilter === 'open') return !match.locked && match.status !== 'finished';
    if (matchFilter === 'locked') return match.locked && match.status !== 'finished';
    if (matchFilter === 'finished') return match.status === 'finished';
    return true;
  });

  if (filteredMatches.length === 0) {
    grid.innerHTML = `
      <div class="empty-state animate-fade-in">
        <i class="fa-regular fa-calendar-times"></i>
        <p>ไม่มีรายการแข่งขันในหมวดหมู่ที่เลือก</p>
      </div>
    `;
    return;
  }

  // Create match cards
  const cardsHtml = filteredMatches.map(match => {
    const kickoffDate = new Date(match.kickoff);
    const kickoffStr = kickoffDate.toLocaleString('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }) + ' น.';

    // Classes for cards based on state
    let cardStateClass = 'open-card';
    if (match.status === 'finished') cardStateClass = 'finished';
    else if (match.locked) cardStateClass = 'locked-card';

    // Set prediction buttons state
    const isButtonsDisabled = !currentUser || match.locked || match.status === 'finished' ? 'disabled' : '';

    // Check prediction buttons active selection
    const isT1Selected = match.userPrediction === 'team1' ? 'selected' : '';
    const isDrSelected = match.userPrediction === 'draw' ? 'selected' : '';
    const isT2Selected = match.userPrediction === 'team2' ? 'selected' : '';

    // Result marking classes (if match finished)
    let t1ResultClass = '', drResultClass = '', t2ResultClass = '';
    if (match.status === 'finished') {
      if (match.winner === 'team1') {
        t1ResultClass = match.userPrediction === 'team1' ? 'result-correct' : 'result-actual';
        drResultClass = match.userPrediction === 'draw' ? 'result-wrong' : '';
        t2ResultClass = match.userPrediction === 'team2' ? 'result-wrong' : '';
      } else if (match.winner === 'draw') {
        t1ResultClass = match.userPrediction === 'team1' ? 'result-wrong' : '';
        drResultClass = match.userPrediction === 'draw' ? 'result-correct' : 'result-actual';
        t2ResultClass = match.userPrediction === 'team2' ? 'result-wrong' : '';
      } else if (match.winner === 'team2') {
        t1ResultClass = match.userPrediction === 'team1' ? 'result-wrong' : '';
        drResultClass = match.userPrediction === 'draw' ? 'result-wrong' : '';
        t2ResultClass = match.userPrediction === 'team2' ? 'result-correct' : 'result-actual';
      }
    }

    // Countdown Badge HTML
    let countdownBadgeHtml = '';
    if (match.status === 'finished') {
      countdownBadgeHtml = `<span class="countdown locked"><i class="fa-solid fa-circle"></i> จบการแข่งขัน</span>`;
    } else {
      countdownBadgeHtml = `
        <span class="countdown kickoff-countdown" data-kickoff="${match.kickoff}" data-locked="${match.locked}">
          <i class="fa-regular fa-clock"></i> โหลดเวลา...
        </span>
      `;
    }

    // Predictions disclosure section
    let otherPredictionsAccordion = '';
    if (match.allPredictions && match.allPredictions.length > 0) {
      const predItems = match.allPredictions.map(p => {
        let choiceBadge = '';
        if (p.prediction === 'team1') choiceBadge = `<span class="pred-choice team1">${getFlagHtmlSmall(match.team1, match.team1_flag)} ชนะ</span>`;
        else if (p.prediction === 'draw') choiceBadge = `<span class="pred-choice draw">เสมอ</span>`;
        else if (p.prediction === 'team2') choiceBadge = `<span class="pred-choice team2">${getFlagHtmlSmall(match.team2, match.team2_flag)} ชนะ</span>`;
        return `
          <div class="pred-summary-item">
            <span>${p.userName}</span>
            ${choiceBadge}
          </div>
        `;
      }).join('');

      otherPredictionsAccordion = `
        <div class="all-predictions-accordion">
          <button class="accordion-trigger" onclick="toggleAccordion(this)">
            <span><i class="fa-solid fa-users"></i> ดูคำทายของผู้เล่นทั้งหมด (${match.allPredictions.length})</span>
            <i class="fa-solid fa-chevron-down"></i>
          </button>
          <div class="predictions-summary-list hidden animate-fade-in">
            ${predItems}
          </div>
        </div>
      `;
    }

    // Custom text warning if user is not logged in
    let loginPrompt = '';
    if (!currentUser && !match.locked && match.status !== 'finished') {
      loginPrompt = `<p class="text-center text-muted" style="font-size:0.75rem; margin-top:0.5rem;"><i class="fa-solid fa-circle-exclamation"></i> กรุณาเข้าสู่ระบบเพื่อทำการทายผล</p>`;
    }

    // Score display if finished/live
    const vsOrScoreHtml = match.status === 'finished' 
      ? `<div class="live-score">${match.score1} - ${match.score2}</div>`
      : `<span class="vs-text">VS</span>`;

    return `
      <div class="glass-card match-card ${cardStateClass} animate-fade-in" data-match-id="${match.id}">
        <div class="match-header">
          <span class="kickoff-time">${kickoffStr}</span>
          ${countdownBadgeHtml}
        </div>
        
        <div class="teams-container">
          <div class="team">
            ${getFlagHtml(match.team1, match.team1_flag)}
            <span class="team-name">${match.team1}</span>
          </div>
          
          <div class="vs-block">
            ${vsOrScoreHtml}
          </div>
          
          <div class="team">
            ${getFlagHtml(match.team2, match.team2_flag)}
            <span class="team-name">${match.team2}</span>
          </div>
        </div>

        <div class="predict-actions">
          <div class="predict-buttons">
            <button class="predict-btn ${isT1Selected} ${t1ResultClass} team1-win" 
                    ${isButtonsDisabled} 
                    onclick="submitPrediction('${match.id}', 'team1')">
              ${match.team1} ชนะ
            </button>
            <button class="predict-btn ${isDrSelected} ${drResultClass} draw-win" 
                    ${isButtonsDisabled} 
                    onclick="submitPrediction('${match.id}', 'draw')">
              เสมอ
            </button>
            <button class="predict-btn ${isT2Selected} ${t2ResultClass} team2-win" 
                    ${isButtonsDisabled} 
                    onclick="submitPrediction('${match.id}', 'team2')">
              ${match.team2} ชนะ
            </button>
          </div>
          ${loginPrompt}
          ${otherPredictionsAccordion}
        </div>
      </div>
    `;
  }).join('');

  grid.innerHTML = cardsHtml;
}

// Global function to support inline accordion clicks
window.toggleAccordion = function(button) {
  const list = button.nextElementSibling;
  const icon = button.querySelector('.fa-chevron-down') || button.querySelector('.fa-chevron-up');
  
  list.classList.toggle('hidden');
  
  if (list.classList.contains('hidden')) {
    icon.className = 'fa-solid fa-chevron-down';
  } else {
    icon.className = 'fa-solid fa-chevron-up';
  }
};

async function submitPrediction(matchId, prediction) {
  if (!currentUser) {
    showToast('กรุณาเข้าสู่ระบบก่อนทำการทายผล', 'error');
    showLoginModal(true);
    return;
  }

  // Find local match object to check if selection is a toggle-off
  const match = matchesData.find(m => m.id === matchId);
  const newPrediction = match && match.userPrediction === prediction ? null : prediction;

  const headers = {
    'Content-Type': 'application/json',
    'X-User-Id': currentUser.id
  };

  try {
    const response = await fetch(`${API_URL}/api/predict`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ matchId, prediction: newPrediction })
    });

    const data = await response.json();
    if (data.success) {
      // Optimistic UI update
      if (match) {
        match.userPrediction = newPrediction;
        renderMatches();
      }
      showToast(newPrediction ? `ทายผลสำเร็จ!` : 'ยกเลิกการทายผลสำเร็จ', 'success');
      
      // Update leaderboard data in background
      loadLeaderboard(true);
    } else {
      showToast(data.message || 'ไม่สามารถบันทึกผลการทายได้', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
  }
}

function updateCountdowns() {
  const countdownElements = document.querySelectorAll('.kickoff-countdown');
  const now = Date.now();

  countdownElements.forEach(el => {
    const kickoffTime = new Date(el.dataset.kickoff).getTime();
    const isLockedState = el.dataset.locked === 'true';
    const lockTime = kickoffTime - 15 * 60 * 1000;
    
    // Time left until predictions lock (15 minutes before kickoff)
    const timeLeft = lockTime - now;

    if (timeLeft > 0) {
      // Open for predictions
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      let timeText = '';
      if (days > 0) {
        timeText = `${days}วัน ${hours}ชม.`;
      } else if (hours > 0) {
        timeText = `${hours}ชม. ${minutes}นาที`;
      } else {
        timeText = `${minutes}นาที ${seconds}วิ`;
      }

      el.innerHTML = `<i class="fa-regular fa-clock text-success"></i> ปิดทายใน: ${timeText}`;
      el.className = 'countdown open';
    } else {
      // Predictions locked
      const timeLeftToKickoff = kickoffTime - now;
      if (timeLeftToKickoff > 0) {
        el.innerHTML = `<i class="fa-solid fa-lock text-warning"></i> ปิดทายผลแล้ว (รอเริ่มแข่ง)`;
        el.className = 'countdown locked';
      } else {
        // Kickoff started
        el.innerHTML = `<i class="fa-solid fa-futbol text-danger live"></i> กำลังแข่งขัน`;
        el.className = 'countdown live';
      }
      
      // If client state is not yet marked as locked, trigger a reload to fetch other users' predictions
      if (!isLockedState) {
        el.dataset.locked = 'true';
        loadMatches(true);
      }
    }
  });
}

// ==========================================================================
// LEADERBOARD & MATRIX COMPARE VIEW
// ==========================================================================
async function loadLeaderboard(silent = false) {
  const body = document.getElementById('leaderboard-body');
  if (!silent && !leaderboardData) {
    body.innerHTML = `<tr><td colspan="4" class="text-center"><i class="fa-solid fa-circle-notch fa-spin"></i> กำลังโหลดตารางอันดับ...</td></tr>`;
  }

  try {
    const response = await fetch(`${API_URL}/api/leaderboard`);
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    
    leaderboardData = await response.json();
    renderLeaderboard();
  } catch (err) {
    console.error(err);
    if (!silent) {
      body.innerHTML = `<tr><td colspan="4" class="text-center text-danger"><i class="fa-solid fa-circle-exclamation"></i> ไม่สามารถดึงข้อมูลตารางอันดับได้</td></tr>`;
    }
  }
}

function renderLeaderboard() {
  if (!leaderboardData) return;

  const { leaderboard, matches, predictionGrid } = leaderboardData;

  // Render leaderboard standings table
  const body = document.getElementById('leaderboard-body');
  if (leaderboard.length === 0) {
    body.innerHTML = `<tr><td colspan="4" class="text-center text-muted">ยังไม่มีรายชื่อผู้ทายผลในระบบ</td></tr>`;
  } else {
    body.innerHTML = leaderboard.map((player, index) => {
      const rank = index + 1;
      let rankClass = '';
      if (rank === 1) rankClass = 'top-rank-1';
      else if (rank === 2) rankClass = 'top-rank-2';
      else if (rank === 3) rankClass = 'top-rank-3';

      const trophyHtml = rank === 1 ? ' <i class="fa-solid fa-trophy text-gold"></i>' : '';

      return `
        <tr class="${rankClass} animate-fade-in">
          <td><span class="rank-number">${rank}</span></td>
          <td>${player.name}${trophyHtml}</td>
          <td class="text-center font-bold">${player.correctCount} / ${player.totalPredicted}</td>
          <td class="text-right text-gold font-bold" style="font-size:1.1rem;">${player.points} pt</td>
        </tr>
      `;
    }).join('');
  }

  // Render comparison matrix header
  const matrixHeaderRow = document.getElementById('matrix-header-row');
  let headerHtml = `<th class="player-name-col">ผู้เล่น</th>`;
  
  if (matches.length === 0) {
    headerHtml += `<th>ไม่มีคู่แข่งขันที่แข่งขันหรือปิดรับผลแล้ว</th>`;
    matrixHeaderRow.innerHTML = headerHtml;
    
    const matrixBody = document.getElementById('matrix-body');
    matrixBody.innerHTML = `<tr><td class="player-name-col">--</td><td class="text-muted">ตารางวิเคราะห์เปรียบเทียบจะเปิดหลังจากมีคู่อย่างน้อย 1 คู่ที่เริ่มการแข่งขัน</td></tr>`;
    return;
  }

  // Add a column header for each locked/finished match
  matches.forEach(match => {
    headerHtml += `
      <th title="${match.team1} vs ${match.team2}">
        <div class="match-flag-header">
          <span class="flags">${getFlagHtmlSmall(match.team1, match.team1_flag)}${getFlagHtmlSmall(match.team2, match.team2_flag)}</span>
          <span>${match.team1.substring(0,3)} vs ${match.team2.substring(0,3)}</span>
        </div>
      </th>
    `;
  });
  matrixHeaderRow.innerHTML = headerHtml;

  // Render matrix rows for each user
  const matrixBody = document.getElementById('matrix-body');
  matrixBody.innerHTML = leaderboard.map(player => {
    const userGrid = predictionGrid[player.id] || {};
    let playerRowHtml = `<td class="player-name-col">${player.name.split(' ')[0]}</td>`;

    matches.forEach(match => {
      const pred = userGrid[match.id];
      let displayVal = '-';
      let cellClass = '';

      if (pred) {
        if (pred === 'team1') {
          displayVal = match.team1.substring(0, 3).toUpperCase(); // e.g. MEX
          cellClass = 'pred-team1';
        } else if (pred === 'draw') {
          displayVal = 'Draw'; // Draw
          cellClass = 'pred-draw';
        } else if (pred === 'team2') {
          displayVal = match.team2.substring(0, 3).toUpperCase(); // e.g. AUS
          cellClass = 'pred-team2';
        }

        // Apply green/red coloring if the match has concluded
        if (match.status === 'finished' && match.winner) {
          if (pred === match.winner) {
            cellClass = 'pred-correct';
          } else {
            cellClass = 'pred-wrong';
          }
        }
      }

      playerRowHtml += `<td class="matrix-cell ${cellClass}">${displayVal}</td>`;
    });

    return `<tr class="animate-fade-in">${playerRowHtml}</tr>`;
  }).join('');
}

// ==========================================================================
// ADMIN DASHBOARD
// ==========================================================================
async function loadAdminData() {
  loadAdminPlayers();
  loadAdminMatches();
}

async function loadAdminPlayers() {
  const body = document.getElementById('admin-players-body');
  body.innerHTML = `<tr><td colspan="4" class="text-center"><i class="fa-solid fa-circle-notch fa-spin"></i> โหลดข้อมูลผู้เล่น...</td></tr>`;

  try {
    const response = await fetch(`${API_URL}/api/admin/players`, {
      headers: { 'X-User-Id': currentUser.id }
    });
    
    if (!response.ok) throw new Error('Failed to fetch players');
    const players = await response.json();

    // Update count display
    document.getElementById('player-count').textContent = players.length;

    if (players.length === 0) {
      body.innerHTML = `<tr><td colspan="4" class="text-center text-muted">ไม่มีผู้เล่นในระบบ (เพิ่มผู้เล่นใหม่ได้จากฟอร์มด้านบน)</td></tr>`;
      return;
    }

    body.innerHTML = players.map(player => {
      return `
        <tr class="animate-fade-in">
          <td><strong>${player.name}</strong></td>
          <td><code>${player.username}</code></td>
          <td><code>${player.pin}</code></td>
          <td class="text-center">
            <button class="btn-sm-danger" onclick="deletePlayer('${player.id}', '${player.name}')">
              <i class="fa-regular fa-trash-can"></i> ลบ
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error(err);
    body.innerHTML = `<tr><td colspan="4" class="text-center text-danger"><i class="fa-solid fa-circle-exclamation"></i> ไม่สามารถดึงข้อมูลได้</td></tr>`;
  }
}

async function handleAddPlayer(e) {
  e.preventDefault();
  const name = document.getElementById('new-player-name').value.trim();
  const username = document.getElementById('new-player-username').value.trim();
  const pin = document.getElementById('new-player-pin').value.trim();

  if (!pin.match(/^\d{4}$/)) {
    showToast('PIN ต้องเป็นตัวเลข 4 หลักเท่านั้น', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/players`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': currentUser.id
      },
      body: JSON.stringify({ name, username, pin })
    });

    const data = await response.json();
    if (data.success) {
      showToast(`เพิ่มผู้เล่น ${name} สำเร็จ!`, 'success');
      document.getElementById('add-player-form').reset();
      loadAdminPlayers();
      loadLeaderboard(true);
    } else {
      showToast(data.message || 'ไม่สามารถเพิ่มผู้เล่นได้', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
  }
}

async function deletePlayer(id, name) {
  if (!confirm(`คุณแน่ใจหรือไม่ที่จะลบผู้เล่น "${name}"?\nการลบจะลบผลทายทั้งหมดของผู้เล่นนี้ด้วยและไม่สามารถกู้คืนได้`)) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/players/${id}`, {
      method: 'DELETE',
      headers: { 'X-User-Id': currentUser.id }
    });

    const data = await response.json();
    if (data.success) {
      showToast(`ลบผู้เล่น ${name} สำเร็จ`, 'success');
      loadAdminPlayers();
      loadLeaderboard(true);
    } else {
      showToast(data.message || 'ลบไม่สำเร็จ', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
  }
}

async function loadAdminMatches() {
  const body = document.getElementById('admin-matches-body');
  body.innerHTML = `<tr><td colspan="4" class="text-center"><i class="fa-solid fa-circle-notch fa-spin"></i> โหลดตารางแข่งขัน...</td></tr>`;

  try {
    const response = await fetch(`${API_URL}/api/matches`);
    if (!response.ok) throw new Error('Failed to fetch matches');
    const matches = await response.json();

    if (matches.length === 0) {
      body.innerHTML = `<tr><td colspan="4" class="text-center text-muted">ไม่มีข้อมูลตารางแข่งขัน</td></tr>`;
      return;
    }

    body.innerHTML = matches.map(match => {
      const date = new Date(match.kickoff).toLocaleString('th-TH', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      }) + ' น.';

      // Form for entry score
      let scoreHtml = '';
      let actionHtml = '';

      if (match.status === 'finished') {
        scoreHtml = `<strong style="font-size: 1.1rem; color:#10b981;">${match.score1} - ${match.score2}</strong>`;
        actionHtml = `
          <button class="btn-sm-primary" style="background-color:rgba(245,158,11,0.15); border-color:rgba(245,158,11,0.3); color:#fbbf24;" onclick="resetMatchResult('${match.id}')">
            <i class="fa-solid fa-rotate-left"></i> ยกเลิก/รีเซ็ต
          </button>
        `;
      } else {
        scoreHtml = `
          <div class="admin-score-entry" id="score-form-${match.id}">
            <input type="number" min="0" placeholder="0" class="score-input-1" id="score1-${match.id}">
            <span>-</span>
            <input type="number" min="0" placeholder="0" class="score-input-2" id="score2-${match.id}">
          </div>
        `;
        actionHtml = `
          <button class="btn-sm-primary" style="background-color:rgba(16,185,129,0.15); border-color:rgba(16,185,129,0.3); color:#34d399;" onclick="saveMatchResult('${match.id}')">
            <i class="fa-solid fa-floppy-disk"></i> บันทึกผล
          </button>
        `;
      }

      return `
        <tr class="animate-fade-in">
          <td><small class="text-muted">${date}</small></td>
          <td>
            <strong>${getFlagHtmlSmall(match.team1, match.team1_flag)} ${match.team1}</strong> vs 
            <strong>${getFlagHtmlSmall(match.team2, match.team2_flag)} ${match.team2}</strong>
          </td>
          <td class="text-center">${scoreHtml}</td>
          <td class="text-center">${actionHtml}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error(err);
    body.innerHTML = `<tr><td colspan="4" class="text-center text-danger"><i class="fa-solid fa-circle-exclamation"></i> ไม่สามารถดึงข้อมูลตารางแข่งได้</td></tr>`;
  }
}

async function handleAddMatch(e) {
  e.preventDefault();
  const team1 = document.getElementById('match-team1').value.trim();
  const team1_flag = document.getElementById('match-team1-flag').value.trim();
  const team2 = document.getElementById('match-team2').value.trim();
  const team2_flag = document.getElementById('match-team2-flag').value.trim();
  const kickoffStr = document.getElementById('match-kickoff').value;

  if (!kickoffStr) {
    showToast('กรุณาระบุเวลาแข่งขัน', 'error');
    return;
  }

  // Convert HTML local datetime input (which is in local time zone) to full ISO string with timezone offset (or simple ISO string)
  const kickoff = new Date(kickoffStr).toISOString();

  try {
    const response = await fetch(`${API_URL}/api/admin/matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': currentUser.id
      },
      body: JSON.stringify({ team1, team1_flag, team2, team2_flag, kickoff })
    });

    const data = await response.json();
    if (data.success) {
      showToast(`เพิ่มคู่แข่ง ${team1} vs ${team2} สำเร็จ!`, 'success');
      document.getElementById('add-match-form').reset();
      document.getElementById('add-match-form').classList.add('hidden');
      document.getElementById('add-match-trigger-btn').innerHTML = '<i class="fa-solid fa-plus"></i> เพิ่มคู่แข่ง';
      
      loadAdminMatches();
      loadMatches(true);
    } else {
      showToast(data.message || 'ไม่สามารถเพิ่มคู่แข่งขันได้', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
  }
}

async function saveMatchResult(matchId) {
  const score1Input = document.getElementById(`score1-${matchId}`);
  const score2Input = document.getElementById(`score2-${matchId}`);

  if (score1Input.value === '' || score2Input.value === '') {
    showToast('กรุณากรอกสกอร์การแข่งขันให้ครบทั้งสองทีม', 'error');
    return;
  }

  const score1 = parseInt(score1Input.value);
  const score2 = parseInt(score2Input.value);

  try {
    const response = await fetch(`${API_URL}/api/admin/matches/${matchId}/result`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': currentUser.id
      },
      body: JSON.stringify({ score1, score2, status: 'finished' })
    });

    const data = await response.json();
    if (data.success) {
      showToast('บันทึกสกอร์และจบการแข่งขันสำเร็จ!', 'success');
      loadAdminMatches();
      loadMatches(true);
      loadLeaderboard(true);
    } else {
      showToast(data.message || 'บันทึกสกอร์ล้มเหลว', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
  }
}

async function resetMatchResult(matchId) {
  if (!confirm('คุณต้องการยกเลิกผลการแข่งขันนี้และให้ผู้เล่นกลับไปทายผลใหม่ได้ (หากยังไม่ถึงเวลาแข่งขัน)?')) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/matches/${matchId}/result`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': currentUser.id
      },
      body: JSON.stringify({ status: 'scheduled' })
    });

    const data = await response.json();
    if (data.success) {
      showToast('ยกเลิกผลการแข่งขันและรีเซ็ตสถานะสำเร็จ', 'success');
      loadAdminMatches();
      loadMatches(true);
      loadLeaderboard(true);
    } else {
      showToast(data.message || 'รีเซ็ตไม่สำเร็จ', 'error');
    }
  } catch (err) {
    console.error(err);
    showToast('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'error');
  }
}
