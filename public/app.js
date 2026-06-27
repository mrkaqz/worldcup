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

// 3-letter team abbreviations for matrix headers/cells
function teamAbbr(name) {
  const CODES = {
    'Mexico': 'MEX', 'South Africa': 'RSA', 'South Korea': 'KOR',
    'Czechia': 'CZE', 'Czech Republic': 'CZE', 'Canada': 'CAN',
    'Bosnia and Herzegovina': 'BIH', 'Bosnia & Herzegovina': 'BIH',
    'USA': 'USA', 'United States': 'USA', 'Paraguay': 'PAR',
    'Haiti': 'HAI', 'Scotland': 'SCO', 'Australia': 'AUS', 'Turkey': 'TUR',
    'Brazil': 'BRA', 'Morocco': 'MAR', 'Qatar': 'QAT', 'Switzerland': 'SUI',
    'Ivory Coast': 'CIV', "Côte d'Ivoire": 'CIV', 'Ecuador': 'ECU',
    'Germany': 'GER', 'Curaçao': 'CUW', 'Netherlands': 'NED', 'Japan': 'JPN',
    'Sweden': 'SWE', 'Tunisia': 'TUN', 'Iran': 'IRN', 'New Zealand': 'NZL',
    'Spain': 'ESP', 'Cape Verde': 'CPV', 'Belgium': 'BEL', 'Egypt': 'EGY',
    'Saudi Arabia': 'KSA', 'Uruguay': 'URU', 'France': 'FRA', 'Senegal': 'SEN',
    'Iraq': 'IRQ', 'Norway': 'NOR', 'Argentina': 'ARG', 'Algeria': 'ALG',
    'Austria': 'AUT', 'Jordan': 'JOR', 'Portugal': 'POR',
    'Democratic Republic of the Congo': 'COD', 'DR Congo': 'COD',
    'England': 'ENG', 'Croatia': 'CRO', 'Uzbekistan': 'UZB', 'Colombia': 'COL',
    'Ghana': 'GHA', 'Panama': 'PAN',
  };
  if (!name) return '???';
  if (CODES[name]) return CODES[name];
  // fallback for unknown teams: initials of each word, padded with last word chars
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return name.substring(0, 3).toUpperCase();
  const initials = words.map(w => w[0].toUpperCase()).join('');
  if (initials.length >= 3) return initials.substring(0, 3);
  return (initials + words[words.length - 1].substring(1).toUpperCase()).substring(0, 3);
}

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

function getGroupRoundLabel(group, type) {
  if (!group && !type) return '';
  const tp = type ? type.toLowerCase() : '';
  const g = group ? group.toUpperCase() : '';

  if (tp === 'group') {
    return g ? `${window.t('round_group_prefix')} ${g}` : window.t('round_group_stage');
  }

  switch (tp) {
    case 'r32': return window.t('round_32');
    case 'r16': return window.t('round_16');
    case 'qf':  return window.t('round_qf');
    case 'sf':  return window.t('round_sf');
    case 'third': return window.t('round_third');
    case 'final': return window.t('round_final');
    default:
      if (g === 'R32')   return window.t('round_32');
      if (g === 'R16')   return window.t('round_16');
      if (g === 'QF')    return window.t('round_qf');
      if (g === 'SF')    return window.t('round_sf');
      if (g === '3RD')   return window.t('round_third');
      if (g === 'FINAL') return window.t('round_final');
      return g || tp.toUpperCase();
  }
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
  loadVersion();

  // Start Background Timers
  startTimers();
}

async function loadVersion() {
  try {
    const res = await fetch(`${API_URL}/api/version`);
    const { version } = await res.json();
    const el = document.getElementById('app-version');
    if (el) el.textContent = version;
  } catch (e) {
    // silently ignore — version display is cosmetic
  }
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
      const lang = window.getCurrentLang ? window.getCurrentLang() : 'th';
      timeDisplay.textContent = now.toLocaleTimeString(lang === 'th' ? 'th-TH' : 'en-US', { hour12: false }) + ' (UTC+7)';
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
      ? `<i class="fa-solid fa-plus"></i> ${window.t('admin_add_match_btn')}`
      : `<i class="fa-solid fa-minus"></i> ${window.t('admin_hide_form_btn')}`;
  });

  // Admin: Cancel Add Match
  document.getElementById('cancel-match-btn').addEventListener('click', () => {
    addMatchForm.classList.add('hidden');
    addMatchTrigger.innerHTML = `<i class="fa-solid fa-plus"></i> ${window.t('admin_add_match_btn')}`;
  });

  // Admin: Add Match Form Submission
  addMatchForm.addEventListener('submit', handleAddMatch);

  // Admin: Reset Database
  document.getElementById('reset-db-btn').addEventListener('click', async () => {
    const confirmReset = confirm(window.t('confirm_reset'));
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
        showToast(data.message || window.t('toast_reset_success'), 'success');
        // Refresh all local data
        loadAdminData();
        loadMatches(true);
        loadLeaderboard(true);
        switchTab('predict-tab');
      } else {
        showToast(data.message || window.t('toast_reset_fail'), 'error');
      }
    } catch (err) {
      console.error(err);
      showToast(window.t('toast_server_error'), 'error');
    }
  });

  // Export CSV
  document.getElementById('export-csv-btn').addEventListener('click', exportToCSV);

  // Export JSON backup
  document.getElementById('export-json-btn').addEventListener('click', downloadBackupJSON);
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

  // Track tab switch as virtual pageview in Google Analytics
  const tabTitles = {
    'predict-tab': window.t('ga_predict'),
    'leaderboard-tab': window.t('ga_leaderboard'),
    'admin-tab': window.t('ga_admin')
  };
  if (typeof gtag === 'function') {
    gtag('event', 'page_view', {
      page_title: tabTitles[tabId] || tabId,
      page_location: window.location.href,
      page_path: '/#' + tabId
    });
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
      showToast(window.t('toast_welcome', { name: currentUser.name }), 'success');

      // Reload matching dataset
      loadMatches();
      loadLeaderboard();

      if (currentUser.role === 'admin') {
        switchTab('admin-tab');
      }
    } else {
      showToast(data.message || window.t('toast_login_fail'), 'error');
    }
  } catch (err) {
    console.error(err);
    showToast(window.t('toast_server_error'), 'error');
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
  showToast(window.t('toast_logout'), 'info');
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
    userRole.textContent = currentUser.role === 'admin' ? window.t('role_admin') : window.t('role_player');
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
        <i class="fa-solid fa-circle-notch fa-spin"></i> ${window.t('loading_matches')}
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

    const newData = await response.json();
    const hasChanged = JSON.stringify(newData) !== JSON.stringify(matchesData);
    matchesData = newData;
    window.matchesData = matchesData;
    updateFilterCounts();
    if (!silent || hasChanged) {
      renderMatches();
    }
  } catch (err) {
    console.error(err);
    if (!silent) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-triangle-exclamation text-danger"></i>
          <p>${window.t('error_load_matches')}</p>
        </div>
      `;
    }
  }
}

function updateFilterCounts() {
  const counts = {
    all: matchesData.length,
    open: matchesData.filter(m => !m.locked && m.status !== 'finished').length,
    locked: matchesData.filter(m => m.locked && m.status !== 'finished').length,
    finished: matchesData.filter(m => m.status === 'finished').length,
  };
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const countEl = btn.querySelector('.filter-count');
    if (countEl) countEl.textContent = counts[btn.dataset.filter] ?? '';
  });
}

function renderMatches() {
  const grid = document.getElementById('matches-grid');

  // Preserve which accordions are open before re-rendering
  const openAccordions = new Set();
  grid.querySelectorAll('.match-card').forEach(card => {
    const list = card.querySelector('.predictions-summary-list');
    if (list && !list.classList.contains('hidden')) {
      openAccordions.add(card.dataset.matchId);
    }
  });

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
        <p>${window.t('no_matches_in_filter')}</p>
      </div>
    `;
    return;
  }

  // Sort: kickoff ascending; in "all" view, finished > 1 day ago sink to the bottom
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    if (matchFilter === 'all') {
      const aOld = a.status === 'finished' && (now - new Date(a.kickoff).getTime()) > oneDayMs;
      const bOld = b.status === 'finished' && (now - new Date(b.kickoff).getTime()) > oneDayMs;
      if (aOld !== bOld) return aOld ? 1 : -1;
    }
    return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
  });

  // Create match cards
  const cardsHtml = sortedMatches.map(match => {
    const kickoffDate = new Date(match.kickoff);
    const lang = window.getCurrentLang ? window.getCurrentLang() : 'th';
    const kickoffStr = kickoffDate.toLocaleString(lang === 'th' ? 'th-TH' : 'en-US', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }) + (lang === 'th' ? ' น.' : '');

    // Classes for cards based on state
    let cardStateClass = 'open-card';
    if (match.status === 'finished') cardStateClass = 'finished';
    else if (match.locked) cardStateClass = 'locked-card';

    // Set prediction buttons state
    const isButtonsDisabled = !currentUser || match.locked || match.status === 'finished' ? 'disabled' : '';
    const isKnockout = match.type && match.type !== 'group';

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
      countdownBadgeHtml = `<span class="countdown locked"><i class="fa-solid fa-circle"></i> ${window.t('finished_label')}</span>`;
    } else {
      countdownBadgeHtml = `
        <span class="countdown kickoff-countdown" data-kickoff="${match.kickoff}" data-locked="${match.locked}" data-clock="${match.clock || ''}">
          <i class="fa-regular fa-clock"></i> ${window.t('loading_time')}
        </span>
      `;
    }

    // Predictions disclosure section
    let otherPredictionsAccordion = '';
    if (match.allPredictions && match.allPredictions.length > 0) {
      const predItems = match.allPredictions.map(p => {
        let choiceBadge = `<span class="pred-choice pred-hidden">***</span>`;
        if (p.prediction === 'team1') choiceBadge = `<span class="pred-choice team1">${getFlagHtmlSmall(match.team1, match.team1_flag)} ${window.t('wins')}</span>`;
        else if (p.prediction === 'draw') choiceBadge = `<span class="pred-choice draw">${window.t('draw')}</span>`;
        else if (p.prediction === 'team2') choiceBadge = `<span class="pred-choice team2">${getFlagHtmlSmall(match.team2, match.team2_flag)} ${window.t('wins')}</span>`;
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
            <span><i class="fa-solid fa-users"></i> ${window.t('view_all_predictions')} (${match.allPredictions.length})</span>
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
      loginPrompt = `<p class="text-center text-muted" style="font-size:0.75rem; margin-top:0.5rem;"><i class="fa-solid fa-circle-exclamation"></i> ${window.t('login_to_predict')}</p>`;
    }

    // Score display if finished/live
    const vsOrScoreHtml = match.status === 'finished'
      ? `<div class="live-score">${match.score1} - ${match.score2}</div>`
      : match.status === 'live'
      ? `<div class="live-score live-active">${match.score1 ?? 0} - ${match.score2 ?? 0}</div>`
      : `<span class="vs-text">VS</span>`;

    const groupRound = getGroupRoundLabel(match.group, match.type);
    const knockoutClass = (match.type && match.type.toLowerCase() !== 'group') ? 'knockout' : '';
    const groupRoundBadgeHtml = groupRound ? `<span class="match-badge ${knockoutClass}">${groupRound}</span>` : '';

    return `
      <div class="glass-card match-card ${cardStateClass} animate-fade-in" data-match-id="${match.id}">
        <div class="match-header">
          <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <span class="kickoff-time">${kickoffStr}</span>
            ${groupRoundBadgeHtml}
          </div>
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
          <div class="predict-buttons${isKnockout ? ' two-col' : ''}">
            <button class="predict-btn ${isT1Selected} ${t1ResultClass} team1-win"
                    ${isButtonsDisabled}
                    onclick="submitPrediction('${match.id}', 'team1')">
              ${match.team1} ${window.t('wins')}
            </button>
            ${!isKnockout ? `<button class="predict-btn ${isDrSelected} ${drResultClass} draw-win"
                    ${isButtonsDisabled}
                    onclick="submitPrediction('${match.id}', 'draw')">
              ${window.t('draw')}
            </button>` : ''}
            <button class="predict-btn ${isT2Selected} ${t2ResultClass} team2-win"
                    ${isButtonsDisabled}
                    onclick="submitPrediction('${match.id}', 'team2')">
              ${match.team2} ${window.t('wins')}
            </button>
          </div>
          ${loginPrompt}
          ${otherPredictionsAccordion}
        </div>
      </div>
    `;
  }).join('');

  grid.innerHTML = cardsHtml;

  // Restore previously open accordions
  if (openAccordions.size > 0) {
    grid.querySelectorAll('.match-card').forEach(card => {
      if (openAccordions.has(card.dataset.matchId)) {
        const list = card.querySelector('.predictions-summary-list');
        const icon = card.querySelector('.accordion-trigger .fa-chevron-down');
        if (list) list.classList.remove('hidden');
        if (icon) icon.className = 'fa-solid fa-chevron-up';
      }
    });
  }
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
    showToast(window.t('toast_login_required'), 'error');
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
      showToast(newPrediction ? window.t('toast_predict_success') : window.t('toast_predict_cancel'), 'success');

      // Update leaderboard data in background
      loadLeaderboard(true);
    } else {
      showToast(data.message || window.t('toast_predict_fail'), 'error');
    }
  } catch (err) {
    console.error(err);
    showToast(window.t('toast_server_error'), 'error');
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
        timeText = `${days}${window.t('days')} ${hours}${window.t('hours')}`;
      } else if (hours > 0) {
        timeText = `${hours}${window.t('hours')} ${minutes}${window.t('minutes')}`;
      } else {
        timeText = `${minutes}${window.t('minutes')} ${seconds}${window.t('seconds')}`;
      }

      el.innerHTML = `<i class="fa-regular fa-clock text-success"></i> ${window.t('closes_in')} ${timeText}`;
      el.className = 'countdown open';
    } else {
      // Predictions locked
      const timeLeftToKickoff = kickoffTime - now;
      if (timeLeftToKickoff > 0) {
        el.innerHTML = `<i class="fa-solid fa-lock text-warning"></i> ${window.t('locked_waiting')}`;
        el.className = 'countdown locked';
      } else {
        // Kickoff started
        const clock = el.dataset.clock;
        el.innerHTML = `<i class="fa-solid fa-futbol text-danger live"></i> ${window.t('live_label')}${clock ? ` <span class="live-clock">${clock}</span>` : ''}`;
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
    body.innerHTML = `<tr><td colspan="4" class="text-center"><i class="fa-solid fa-circle-notch fa-spin"></i> ${window.t('loading_leaderboard')}</td></tr>`;
  }

  try {
    const headers = {};
    if (currentUser) headers['X-User-Id'] = currentUser.id;
    const response = await fetch(`${API_URL}/api/leaderboard`, { headers });
    if (!response.ok) throw new Error('Failed to fetch leaderboard');

    const newLeaderboard = await response.json();
    const leaderboardChanged = JSON.stringify(newLeaderboard) !== JSON.stringify(leaderboardData);
    leaderboardData = newLeaderboard;
    window.leaderboardData = leaderboardData;
    if (!silent || leaderboardChanged) {
      renderLeaderboard();
    }
  } catch (err) {
    console.error(err);
    if (!silent) {
      body.innerHTML = `<tr><td colspan="4" class="text-center text-danger"><i class="fa-solid fa-circle-exclamation"></i> ${window.t('error_load_leaderboard')}</td></tr>`;
    }
  }
}

function renderLeaderboard() {
  if (!leaderboardData) return;

  const { leaderboard, predictionGrid } = leaderboardData;

  // Sort matrix matches: kickoff ascending, finished > 1 day ago sink to bottom
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const matches = [...leaderboardData.matches].sort((a, b) => {
    const aOld = a.status === 'finished' && (now - new Date(a.kickoff).getTime()) > oneDayMs;
    const bOld = b.status === 'finished' && (now - new Date(b.kickoff).getTime()) > oneDayMs;
    if (aOld !== bOld) return aOld ? 1 : -1;
    return new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime();
  });

  // Render leaderboard standings table
  const body = document.getElementById('leaderboard-body');
  if (leaderboard.length === 0) {
    body.innerHTML = `<tr><td colspan="4" class="text-center text-muted">${window.t('no_players_leaderboard')}</td></tr>`;
  } else {
    body.innerHTML = leaderboard.map(player => {
      const rank = player.rank;
      let rankClass = '';
      if (rank === 1) rankClass = 'top-rank-1';
      else if (rank === 2) rankClass = 'top-rank-2';
      else if (rank === 3) rankClass = 'top-rank-3';

      const medalHtml = rank === 1
        ? ' <i class="fa-solid fa-medal" style="color:#ffd700;"></i>'
        : rank === 2
        ? ' <i class="fa-solid fa-medal" style="color:#c0c0c0;"></i>'
        : rank === 3
        ? ' <i class="fa-solid fa-medal" style="color:#cd7f32;"></i>'
        : '';

      return `
        <tr class="${rankClass} animate-fade-in">
          <td><span class="rank-number">${rank}</span></td>
          <td>${player.name}${medalHtml}</td>
          <td class="text-center font-bold">${player.correctCount} / ${player.totalPredicted}</td>
          <td class="text-right text-gold font-bold" style="font-size:1.1rem;">${player.points} pt</td>
        </tr>
      `;
    }).join('');
  }

  // Render comparison matrix header
  const matrixHeaderRow = document.getElementById('matrix-header-row');
  let headerHtml = `<th class="player-name-col">${window.t('matrix_player_col')}</th>`;

  if (matches.length === 0) {
    headerHtml += `<th>${window.t('no_locked_matches')}</th>`;
    matrixHeaderRow.innerHTML = headerHtml;

    const matrixBody = document.getElementById('matrix-body');
    matrixBody.innerHTML = `<tr><td class="player-name-col">--</td><td class="text-muted">${window.t('matrix_empty_msg')}</td></tr>`;
    return;
  }

  // Add a column header for each locked/finished match
  matches.forEach(match => {
    headerHtml += `
      <th title="${match.team1} vs ${match.team2}">
        <div class="match-flag-header">
          <span class="flags">${getFlagHtmlSmall(match.team1, match.team1_flag)}${getFlagHtmlSmall(match.team2, match.team2_flag)}</span>
          <span>${teamAbbr(match.team1)} vs ${teamAbbr(match.team2)}</span>
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

      if (pred === 'hidden') {
        displayVal = '***';
        cellClass = 'pred-hidden';
      } else if (pred) {
        if (pred === 'team1') {
          displayVal = teamAbbr(match.team1);
          cellClass = 'pred-team1';
        } else if (pred === 'draw') {
          displayVal = 'Draw';
          cellClass = 'pred-draw';
        } else if (pred === 'team2') {
          displayVal = teamAbbr(match.team2);
          cellClass = 'pred-team2';
        }

        // Apply green/red coloring if the match has concluded
        if (match.status === 'finished' && match.winner) {
          cellClass = pred === match.winner ? 'pred-correct' : 'pred-wrong';
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
  body.innerHTML = `<tr><td colspan="4" class="text-center"><i class="fa-solid fa-circle-notch fa-spin"></i> ${window.t('admin_loading_players')}</td></tr>`;

  try {
    const response = await fetch(`${API_URL}/api/admin/players`, {
      headers: { 'X-User-Id': currentUser.id }
    });

    if (!response.ok) throw new Error('Failed to fetch players');
    const players = await response.json();

    // Update count display
    document.getElementById('player-count').textContent = players.length;

    if (players.length === 0) {
      body.innerHTML = `<tr><td colspan="4" class="text-center text-muted">${window.t('admin_no_players')}</td></tr>`;
      return;
    }

    body.innerHTML = players.map(player => {
      return `
        <tr class="animate-fade-in">
          <td><strong>${player.name}</strong></td>
          <td><code>${player.username}</code></td>
          <td id="pin-cell-${player.id}"><code>${player.pin}</code></td>
          <td class="text-center" style="white-space:nowrap;">
            <button class="btn-sm-primary" onclick="showChangePinInline('${player.id}', '${player.name.replace(/'/g, "\\'")}')">
              <i class="fa-solid fa-key"></i> PIN
            </button>
            <button class="btn-sm-danger" onclick="deletePlayer('${player.id}', '${player.name.replace(/'/g, "\\'")}')">
              <i class="fa-regular fa-trash-can"></i> ${window.t('admin_btn_delete')}
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error(err);
    body.innerHTML = `<tr><td colspan="4" class="text-center text-danger"><i class="fa-solid fa-circle-exclamation"></i> ${window.t('admin_error_load')}</td></tr>`;
  }
}

async function handleAddPlayer(e) {
  e.preventDefault();
  const name = document.getElementById('new-player-name').value.trim();
  const username = document.getElementById('new-player-username').value.trim();
  const pin = document.getElementById('new-player-pin').value.trim();

  if (!pin.match(/^\d{4}$/)) {
    showToast(window.t('toast_pin_invalid'), 'error');
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
      showToast(window.t('toast_player_added', { name }), 'success');
      document.getElementById('add-player-form').reset();
      loadAdminPlayers();
      loadLeaderboard(true);
    } else {
      showToast(data.message || window.t('toast_player_add_fail'), 'error');
    }
  } catch (err) {
    console.error(err);
    showToast(window.t('toast_server_error'), 'error');
  }
}

async function deletePlayer(id, name) {
  if (!confirm(window.t('confirm_delete_player', { name }))) {
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/players/${id}`, {
      method: 'DELETE',
      headers: { 'X-User-Id': currentUser.id }
    });

    const data = await response.json();
    if (data.success) {
      showToast(window.t('toast_player_deleted', { name }), 'success');
      loadAdminPlayers();
      loadLeaderboard(true);
    } else {
      showToast(data.message || window.t('toast_player_delete_fail'), 'error');
    }
  } catch (err) {
    console.error(err);
    showToast(window.t('toast_server_error'), 'error');
  }
}

async function loadAdminMatches() {
  const body = document.getElementById('admin-matches-body');
  body.innerHTML = `<tr><td colspan="4" class="text-center"><i class="fa-solid fa-circle-notch fa-spin"></i> ${window.t('admin_loading_matches')}</td></tr>`;

  try {
    const response = await fetch(`${API_URL}/api/matches`);
    if (!response.ok) throw new Error('Failed to fetch matches');
    const matches = await response.json();

    if (matches.length === 0) {
      body.innerHTML = `<tr><td colspan="4" class="text-center text-muted">${window.t('admin_no_matches')}</td></tr>`;
      return;
    }

    body.innerHTML = matches.map(match => {
      const lang = window.getCurrentLang ? window.getCurrentLang() : 'th';
      const date = new Date(match.kickoff).toLocaleString(lang === 'th' ? 'th-TH' : 'en-US', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      }) + (lang === 'th' ? ' น.' : '');

      // Form for entry score
      let scoreHtml = '';
      let actionHtml = '';

      if (match.status === 'finished') {
        scoreHtml = `<strong style="font-size: 1.1rem; color:#10b981;">${match.score1} - ${match.score2}</strong>`;
        actionHtml = `
          <button class="btn-sm-primary" style="background-color:rgba(245,158,11,0.15); border-color:rgba(245,158,11,0.3); color:#fbbf24;" onclick="resetMatchResult('${match.id}')">
            <i class="fa-solid fa-rotate-left"></i> ${window.t('admin_btn_reset_score')}
          </button>
        `;
      } else {
        const isMatchKnockout = match.type && match.type !== 'group';
        const penaltyWinnerHtml = isMatchKnockout ? `
          <div style="margin-top:6px;font-size:0.78rem;color:var(--text-muted);">
            ผู้ชนะ (กรณียิงจุดโทษ):
            <select id="winner-${match.id}" style="background:var(--card-bg);color:var(--text-primary);border:1px solid var(--border-color);border-radius:4px;padding:2px 4px;font-size:0.78rem;margin-left:4px;">
              <option value="auto">อัตโนมัติ</option>
              <option value="team1">${match.team1}</option>
              <option value="team2">${match.team2}</option>
            </select>
          </div>` : '';
        scoreHtml = `
          <div class="admin-score-entry" id="score-form-${match.id}">
            <input type="number" min="0" placeholder="0" class="score-input-1" id="score1-${match.id}">
            <span>-</span>
            <input type="number" min="0" placeholder="0" class="score-input-2" id="score2-${match.id}">
          </div>
          ${penaltyWinnerHtml}
        `;
        actionHtml = `
          <button class="btn-sm-primary" style="background-color:rgba(16,185,129,0.15); border-color:rgba(16,185,129,0.3); color:#34d399;" onclick="saveMatchResult('${match.id}')">
            <i class="fa-solid fa-floppy-disk"></i> ${window.t('admin_btn_save_score')}
          </button>
        `;
      }

      const groupRound = getGroupRoundLabel(match.group, match.type);
      const knockoutClass = (match.type && match.type.toLowerCase() !== 'group') ? 'knockout' : '';
      const groupRoundBadgeHtml = groupRound ? `<br><span class="match-badge ${knockoutClass}" style="margin-top: 4px; display: inline-block;">${groupRound}</span>` : '';

      return `
        <tr class="animate-fade-in">
          <td><small class="text-muted">${date}</small></td>
          <td>
            <strong>${getFlagHtmlSmall(match.team1, match.team1_flag)} ${match.team1}</strong> vs
            <strong>${getFlagHtmlSmall(match.team2, match.team2_flag)} ${match.team2}</strong>
            ${groupRoundBadgeHtml}
          </td>
          <td class="text-center">${scoreHtml}</td>
          <td class="text-center">${actionHtml}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error(err);
    body.innerHTML = `<tr><td colspan="4" class="text-center text-danger"><i class="fa-solid fa-circle-exclamation"></i> ${window.t('admin_error_load_matches')}</td></tr>`;
  }
}

async function handleAddMatch(e) {
  e.preventDefault();
  const team1 = document.getElementById('match-team1').value.trim();
  const team1_flag = document.getElementById('match-team1-flag').value.trim();
  const team2 = document.getElementById('match-team2').value.trim();
  const team2_flag = document.getElementById('match-team2-flag').value.trim();
  const group = document.getElementById('match-group').value.trim();
  const type = document.getElementById('match-type').value;
  const kickoffStr = document.getElementById('match-kickoff').value;

  if (!kickoffStr) {
    showToast(window.t('toast_kickoff_missing'), 'error');
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
      body: JSON.stringify({ team1, team1_flag, team2, team2_flag, group, type, kickoff })
    });

    const data = await response.json();
    if (data.success) {
      showToast(window.t('toast_match_added', { team1, team2 }), 'success');
      document.getElementById('add-match-form').reset();
      document.getElementById('add-match-form').classList.add('hidden');
      document.getElementById('add-match-trigger-btn').innerHTML = `<i class="fa-solid fa-plus"></i> ${window.t('admin_add_match_btn')}`;

      loadAdminMatches();
      loadMatches(true);
    } else {
      showToast(data.message || window.t('toast_match_add_fail'), 'error');
    }
  } catch (err) {
    console.error(err);
    showToast(window.t('toast_server_error'), 'error');
  }
}

async function saveMatchResult(matchId) {
  const score1Input = document.getElementById(`score1-${matchId}`);
  const score2Input = document.getElementById(`score2-${matchId}`);

  if (score1Input.value === '' || score2Input.value === '') {
    showToast(window.t('toast_score_missing'), 'error');
    return;
  }

  const score1 = parseInt(score1Input.value);
  const score2 = parseInt(score2Input.value);

  const winnerSelect = document.getElementById(`winner-${matchId}`);
  const winnerOverride = winnerSelect && winnerSelect.value !== 'auto' ? winnerSelect.value : undefined;

  try {
    const response = await fetch(`${API_URL}/api/admin/matches/${matchId}/result`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': currentUser.id
      },
      body: JSON.stringify({ score1, score2, status: 'finished', ...(winnerOverride ? { winner: winnerOverride } : {}) })
    });

    const data = await response.json();
    if (data.success) {
      showToast(window.t('toast_score_saved'), 'success');
      loadAdminMatches();
      loadMatches(true);
      loadLeaderboard(true);
    } else {
      showToast(data.message || window.t('toast_score_fail'), 'error');
    }
  } catch (err) {
    console.error(err);
    showToast(window.t('toast_server_error'), 'error');
  }
}

async function resetMatchResult(matchId) {
  if (!confirm(window.t('confirm_reset_match'))) {
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
      showToast(window.t('toast_match_reset'), 'success');
      loadAdminMatches();
      loadMatches(true);
      loadLeaderboard(true);
    } else {
      showToast(data.message || window.t('toast_match_reset_fail'), 'error');
    }
  } catch (err) {
    console.error(err);
    showToast(window.t('toast_server_error'), 'error');
  }
}

// ==========================================================================
// PIN MANAGEMENT
// ==========================================================================

function showChangePinInline(playerId, playerName) {
  const cell = document.getElementById(`pin-cell-${playerId}`);
  if (!cell) return;
  cell.innerHTML = `
    <div style="display:flex;gap:0.35rem;align-items:center;">
      <input type="text" id="pin-input-${playerId}" maxlength="4" inputmode="numeric"
        placeholder="${window.t('admin_pin_ph_small')}"
        style="width:68px;padding:0.25rem 0.4rem;border-radius:6px;
               background:rgba(0,0,0,0.3);border:1px solid rgba(0,242,254,0.4);
               color:#fff;font-family:var(--font-primary);font-size:0.85rem;text-align:center;"
        onkeydown="if(event.key==='Enter')submitPinChange('${playerId}','${playerName.replace(/'/g, "\\'")}');
                   if(event.key==='Escape')loadAdminPlayers();">
      <button class="btn-sm-success" title="${window.t('admin_save')}"
        onclick="submitPinChange('${playerId}', '${playerName.replace(/'/g, "\\'")}')">
        <i class="fa-solid fa-check"></i>
      </button>
      <button class="btn-sm-ghost" title="${window.t('admin_cancel')}" onclick="loadAdminPlayers()">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>`;
  const input = document.getElementById(`pin-input-${playerId}`);
  if (input) input.focus();
}

async function submitPinChange(playerId, playerName) {
  const input = document.getElementById(`pin-input-${playerId}`);
  if (!input) return;
  const newPin = input.value.trim();

  if (!/^\d{4}$/.test(newPin)) {
    showToast(window.t('toast_pin_invalid'), 'error');
    input.focus();
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/admin/players/${playerId}/pin`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUser.id },
      body: JSON.stringify({ pin: newPin })
    });
    const data = await res.json();
    if (data.success) {
      showToast(window.t('toast_pin_changed', { name: playerName }), 'success');
      loadAdminPlayers();
    } else {
      showToast(data.message || window.t('toast_pin_change_fail'), 'error');
    }
  } catch (err) {
    console.error(err);
    showToast(window.t('toast_connection_error'), 'error');
  }
}

async function submitAdminPinChange() {
  const input = document.getElementById('admin-self-pin-input');
  if (!input) return;
  const newPin = input.value.trim();

  if (!/^\d{4}$/.test(newPin)) {
    showToast(window.t('toast_pin_invalid'), 'error');
    input.focus();
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/admin/players/${currentUser.id}/pin`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUser.id },
      body: JSON.stringify({ pin: newPin })
    });
    const data = await res.json();
    if (data.success) {
      showToast(window.t('toast_pin_changed', { name: 'Admin' }), 'success');
      input.value = '';
    } else {
      showToast(data.message || window.t('toast_pin_change_fail'), 'error');
    }
  } catch (err) {
    console.error(err);
    showToast(window.t('toast_connection_error'), 'error');
  }
}

// ==========================================================================
// EXPORT & BACKUP
// ==========================================================================

async function exportToCSV() {
  try {
    const res = await fetch('/api/leaderboard');
    if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');
    const { leaderboard, matches, predictionGrid } = await res.json();

    // Deduplicate matches by id (db may have duplicates from sync bug)
    const seenIds = new Set();
    const uniqueMatches = matches.filter(m => {
      if (seenIds.has(m.id)) return false;
      seenIds.add(m.id);
      return true;
    });

    const rows = [];
    const ts = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

    // ── Section 1: Leaderboard ────────────────────────────────────────────
    rows.push([`World Cup 2026 Predictor — Export: ${ts}`]);
    rows.push([]);
    rows.push(['=== ตารางคะแนนผู้เล่น (Leaderboard) ===']);
    rows.push(['อันดับ', 'ชื่อ', 'Username', 'ทายถูก', 'ทั้งหมด', 'คะแนน']);
    leaderboard.forEach((p, i) => {
      rows.push([i + 1, p.name, p.username || '', p.correct ?? 0, p.total ?? 0, p.score ?? 0]);
    });

    // ── Section 2: Prediction Matrix ─────────────────────────────────────
    rows.push([]);
    rows.push(['=== ตารางผลทาย (Prediction Matrix) ===']);

    // Include any match that has at least one prediction recorded in the grid
    const matchesWithPreds = uniqueMatches.filter(m =>
      leaderboard.some(p => predictionGrid[p.id] && predictionGrid[p.id][m.id] != null)
    );
    // Fall back to all matches if none have predictions yet
    const matrixMatches = matchesWithPreds.length > 0 ? matchesWithPreds : uniqueMatches;

    const matchHeader = ['ผู้เล่น', ...matrixMatches.map(m => `${m.team1} vs ${m.team2}`)];
    rows.push(matchHeader);

    // Result row
    const resultRow = ['ผลจริง', ...matrixMatches.map(m => {
      if (m.winner === 'team1') return m.team1;
      if (m.winner === 'team2') return m.team2;
      if (m.winner === 'draw') return 'Draw';
      return '-';
    })];
    rows.push(resultRow);

    leaderboard.forEach(player => {
      const grid = predictionGrid[player.id] || {};
      const row = [player.name, ...matrixMatches.map(m => {
        const pred = grid[m.id];
        if (!pred) return '-';
        if (pred === 'team1') return m.team1;
        if (pred === 'team2') return m.team2;
        if (pred === 'draw') return 'Draw';
        return pred;
      })];
      rows.push(row);
    });

    // ── Build CSV with UTF-8 BOM for Thai Excel compatibility ─────────────
    const csv = '﻿' + rows.map(r =>
      r.map(cell => {
        const str = String(cell ?? '');
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"` : str;
      }).join(',')
    ).join('\r\n');

    const date = new Date().toISOString().slice(0, 10);
    triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `worldcup-export-${date}.csv`);
    showToast('ส่งออก CSV สำเร็จ', 'success');
  } catch (err) {
    console.error(err);
    showToast('ส่งออกไม่สำเร็จ: ' + err.message, 'error');
  }
}

async function downloadBackupJSON() {
  if (!currentUser || currentUser.role !== 'admin') {
    showToast('เฉพาะผู้ดูแลระบบเท่านั้น', 'error');
    return;
  }
  try {
    const res = await fetch('/api/admin/export', {
      headers: { 'X-User-Id': currentUser.id }
    });
    if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');
    const blob = await res.blob();
    const date = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
    triggerDownload(blob, `worldcup-backup-${date}.json`);
    showToast('ดาวน์โหลด Backup สำเร็จ', 'success');
  } catch (err) {
    console.error(err);
    showToast('ดาวน์โหลดไม่สำเร็จ: ' + err.message, 'error');
  }
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Expose functions needed by i18n.js for re-render on language switch
window.renderMatches = renderMatches;
window.renderLeaderboard = renderLeaderboard;
window.loadAdminPlayers = loadAdminPlayers;
window.loadAdminMatches = loadAdminMatches;
