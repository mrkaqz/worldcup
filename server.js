const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = process.env.DB_PATH || path.join(__dirname, 'db.json');

// Ensure external database directory and file exist (useful for Docker volumes)
if (process.env.DB_PATH) {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const seedFile = path.join(__dirname, 'db.json');
    if (fs.existsSync(seedFile)) {
      console.log(`[DB] Seeding database to ${DB_FILE} from local template...`);
      fs.copyFileSync(seedFile, DB_FILE);
    } else {
      console.log(`[DB] Creating new empty database at ${DB_FILE}...`);
      fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], matches: [], predictions: [] }, null, 2));
    }
  }
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper to read database
function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading DB:', err);
    return { users: [], matches: [], predictions: [] };
  }
}

// Helper to write database
function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing DB:', err);
    return false;
  }
}

// Helper to check if match is locked (predictions closed 15 mins before kickoff)
function isMatchLocked(match) {
  const kickoffTime = new Date(match.kickoff).getTime();
  const currentTime = Date.now();
  const lockTime = kickoffTime - 15 * 60 * 1000; // 15 minutes before kickoff
  return currentTime >= lockTime;
}

// Helper to calculate leaderboard
function calculateLeaderboard(db) {
  const leaderboard = db.users
    .filter(u => u.role !== 'admin')
    .map(user => {
      let points = 0;
      let correctCount = 0;
      let totalPredicted = 0;

      // Find all predictions for this user
      const userPreds = db.predictions.filter(p => p.userId === user.id);

      // Process matches
      db.matches.forEach(match => {
        // Only count finished matches
        if (match.status === 'finished' && match.winner) {
          const pred = userPreds.find(p => p.matchId === match.id);
          const predictionValue = pred ? pred.prediction : 'draw';
          
          totalPredicted++;
          if (predictionValue === match.winner) {
            points += 1; // 1 point for correct winner/draw
            correctCount++;
          }
        }
      });

      return {
        id: user.id,
        name: user.name,
        username: user.username,
        points,
        correctCount,
        totalPredicted
      };
    });

  // Sort: points (desc), correctCount (desc), name (asc)
  return leaderboard.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.correctCount !== a.correctCount) return b.correctCount - a.correctCount;
    return a.name.localeCompare(b.name, 'th');
  });
}

// --- WORLD CUP API SYNC ---
const flagsMap = {
  'Mexico': '🇲🇽', 'South Africa': '🇿🇦', 'South Korea': '🇰🇷', 'Czech Republic': '🇨🇿', 'Czechia': '🇨🇿',
  'Canada': '🇨🇦', 'Bosnia and Herzegovina': '🇧🇦', 'United States': '🇺🇸', 'USA': '🇺🇸', 'Paraguay': '🇵🇾',
  'Haiti': '🇭🇹', 'Scotland': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Australia': '🇦🇺', 'Turkey': '🇹🇷', 'Türkiye': '🇹🇷', 'Brazil': '🇧🇷',
  'Morocco': '🇲🇦', 'Qatar': '🇶🇦', 'Switzerland': '🇨🇭', 'Ivory Coast': '🇨🇮', 'Ecuador': '🇪🇨',
  'Germany': '🇩🇪', 'Curaçao': '🇨🇼', 'Netherlands': '🇳🇱', 'Japan': '🇯🇵', 'Sweden': '🇸🇪',
  'Tunisia': '🇹🇳', 'Iran': '🇮🇷', 'New Zealand': '🇳🇿', 'Spain': '🇪🇸', 'Cape Verde': '🇨🇻',
  'Belgium': '🇧🇪', 'Egypt': '🇪🇬', 'Saudi Arabia': '🇸🇦', 'Uruguay': '🇺🇾', 'France': '🇫🇷',
  'Senegal': '🇸🇳', 'Iraq': '🇮🇶', 'Norway': '🇳🇴', 'Argentina': '🇦🇷', 'Algeria': '🇩🇿',
  'Austria': '🇦🇹', 'Jordan': '🇯🇴', 'Portugal': '🇵🇹', 'Democratic Republic of the Congo': '🇨🇩',
  'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Croatia': '🇭🇷', 'Uzbekistan': '🇺🇿', 'Colombia': '🇨🇴', 'Ghana': '🇬🇭',
  'Panama': '🇵🇦', 'Ivory Coast': '🇨🇮'
};

function getOffsetForStadium(stadiumId) {
  const eastern = ['8', '7', '9', '10', '11', '12'];
  const centralUS = ['5', '6', '4'];
  const centralMex = ['1', '2', '3'];
  const western = ['14', '13', '15', '16'];
  
  if (eastern.includes(stadiumId)) return '-04:00';
  if (centralUS.includes(stadiumId)) return '-05:00';
  if (centralMex.includes(stadiumId)) return '-06:00';
  if (western.includes(stadiumId)) return '-07:00';
  return '-05:00';
}

function parseAPIDate(localDateStr, stadiumId) {
  if (!localDateStr) return new Date().toISOString();
  const [datePart, timePart] = localDateStr.split(' ');
  const [month, day, year] = datePart.split('/');
  const offset = getOffsetForStadium(stadiumId);
  return `${year}-${month}-${day}T${timePart}:00${offset}`;
}

async function syncFromWorldCupAPI() {
  console.log('[API Sync] Fetching games data from worldcup26.ir...');
  try {
    const res = await fetch('https://worldcup26.ir/get/games');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    
    if (!data || !Array.isArray(data.games)) {
      console.log('[API Sync] Invalid games response structure');
      return;
    }
    
    const db = readDB();
    let updated = false;
    
    data.games.forEach(game => {
      const homeTeam = game.home_team_name_en;
      const awayTeam = game.away_team_name_en;
      
      if (!homeTeam || !awayTeam) return;
      
      // Match using team names
      let match = db.matches.find(m => 
        (m.team1.toLowerCase() === homeTeam.toLowerCase() || (homeTeam.toLowerCase() === 'united states' && m.team1.toLowerCase() === 'usa')) &&
        (m.team2.toLowerCase() === awayTeam.toLowerCase() || (awayTeam.toLowerCase() === 'czech republic' && m.team2.toLowerCase() === 'czechia'))
      );
      
      if (!match) {
        match = db.matches.find(m => 
          (m.team1.toLowerCase() === homeTeam.toLowerCase() || (homeTeam.toLowerCase() === 'united states' && m.team1.toLowerCase() === 'usa')) &&
          (m.team2.toLowerCase() === awayTeam.toLowerCase())
        );
      }
      
      const isFinished = game.finished === 'TRUE';
      const isLive = game.time_elapsed !== 'notstarted' && !isFinished;
      
      const homeScore = game.home_score !== 'null' ? parseInt(game.home_score) : null;
      const awayScore = game.away_score !== 'null' ? parseInt(game.away_score) : null;
      
      if (match) {
        let matchUpdated = false;
        
        // Sync kickoff time if it differs (to correct initial mockup values)
        const newKickoff = parseAPIDate(game.local_date, game.stadium_id);
        if (match.kickoff !== newKickoff) {
          match.kickoff = newKickoff;
          matchUpdated = true;
          console.log(`[API Sync] Match ${match.team1} vs ${match.team2} kickoff updated to ${newKickoff}`);
        }
        
        // Sync group and type/round
        if (match.group !== game.group || match.type !== game.type) {
          match.group = game.group;
          match.type = game.type;
          matchUpdated = true;
          console.log(`[API Sync] Match ${match.team1} vs ${match.team2} group/type updated to ${game.group}/${game.type}`);
        }
        
        // If API contains result and match status is not finished, sync it
        if (isFinished && match.status !== 'finished') {
          match.score1 = homeScore;
          match.score2 = awayScore;
          match.status = 'finished';
          
          if (homeScore > awayScore) match.winner = 'team1';
          else if (awayScore > homeScore) match.winner = 'team2';
          else match.winner = 'draw';
          
          matchUpdated = true;
          console.log(`[API Sync] Match ${match.team1} vs ${match.team2} finished: ${homeScore}-${awayScore}`);
        } else if (isLive && (match.score1 !== homeScore || match.score2 !== awayScore || match.status !== 'live')) {
          match.score1 = homeScore;
          match.score2 = awayScore;
          match.status = 'live';
          matchUpdated = true;
          console.log(`[API Sync] Match ${match.team1} vs ${match.team2} is Live: ${homeScore}-${awayScore}`);
        }
        
        if (matchUpdated) {
          updated = true;
        }
      } else {
        // Import game if it's not a placeholder
        const isPlaceholder = homeTeam.includes('Winner') || homeTeam.includes('Runner-up') || homeTeam.includes('3rd') ||
                              awayTeam.includes('Winner') || awayTeam.includes('Runner-up') || awayTeam.includes('3rd');
                              
        if (!isPlaceholder) {
          const newKickoff = parseAPIDate(game.local_date, game.stadium_id);
          const newMatch = {
            id: 'm_' + (game.id || Date.now().toString(36).substr(-4)),
            team1: homeTeam === 'United States' ? 'USA' : (homeTeam === 'Czech Republic' ? 'Czechia' : homeTeam),
            team1_flag: flagsMap[homeTeam] || '🏳️',
            team2: awayTeam === 'United States' ? 'USA' : (awayTeam === 'Czech Republic' ? 'Czechia' : awayTeam),
            team2_flag: flagsMap[awayTeam] || '🏳️',
            kickoff: newKickoff,
            score1: homeScore,
            score2: awayScore,
            status: isFinished ? 'finished' : (isLive ? 'live' : 'scheduled'),
            winner: isFinished ? (homeScore > awayScore ? 'team1' : (awayScore > homeScore ? 'team2' : 'draw')) : null,
            group: game.group,
            type: game.type
          };
          
          db.matches.push(newMatch);
          updated = true;
          console.log(`[API Sync] Imported new match: ${newMatch.team1} vs ${newMatch.team2} (${newKickoff})`);
        }
      }
    });
    
    if (updated) {
      writeDB(db);
      console.log('[API Sync] Database updated successfully.');
    } else {
      console.log('[API Sync] No changes detected.');
    }
  } catch (err) {
    console.error('[API Sync] Error syncing:', err);
  }
}

// --- API ROUTES ---

// Login
app.post('/api/login', (req, res) => {
  const { username, pin } = req.body;
  if (!username || !pin) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้และ PIN' });
  }

  const db = readDB();
  const user = db.users.find(
    u => u.username.toLowerCase() === username.toLowerCase() && u.pin === pin
  );

  if (!user) {
    return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือ PIN ไม่ถูกต้อง' });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    }
  });
});

// Get matches (with prediction status for current user)
app.get('/api/matches', (req, res) => {
  const userId = req.headers['x-user-id'];
  const db = readDB();

  const matchesWithPredictions = db.matches.map(match => {
    const locked = isMatchLocked(match);
    
    // Find current user's prediction
    let userPrediction = null;
    if (userId) {
      const pred = db.predictions.find(p => p.userId === userId && p.matchId === match.id);
      userPrediction = pred ? pred.prediction : (locked ? 'draw' : null);
    }

    // Get all predictions for this match (default to draw when locked)
    let allPredictions = [];
    if (locked || match.status === 'finished') {
      allPredictions = db.users
        .filter(u => u.role !== 'admin')
        .map(u => {
          const pred = db.predictions.find(p => p.userId === u.id && p.matchId === match.id);
          return {
            userId: u.id,
            userName: u.name,
            prediction: pred ? pred.prediction : 'draw'
          };
        });
    } else {
      allPredictions = db.predictions
        .filter(p => p.matchId === match.id && p.prediction)
        .map(p => {
          const u = db.users.find(user => user.id === p.userId);
          return {
            userId: p.userId,
            userName: u ? u.name : 'Unknown',
            prediction: p.prediction
          };
        });
    }

    return {
      ...match,
      locked,
      userPrediction,
      allPredictions
    };
  });

  res.json(matchesWithPredictions);
});

// Submit prediction
app.post('/api/predict', (req, res) => {
  const userId = req.headers['x-user-id'];
  const { matchId, prediction } = req.body; // prediction: 'team1', 'team2', 'draw', or null

  if (!userId) {
    return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบก่อนทำการทายผล' });
  }

  const db = readDB();
  
  // Verify user exists and is a player
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(403).json({ success: false, message: 'ไม่พบผู้ใช้นี้ในระบบ' });
  }

  // Find match
  const match = db.matches.find(m => m.id === matchId);
  if (!match) {
    return res.status(404).json({ success: false, message: 'ไม่พบคู่การแข่งขันนี้' });
  }

  // Check if locked
  if (isMatchLocked(match)) {
    return res.status(400).json({ success: false, message: 'การทายผลคู่นี้ปิดแล้ว (ปิดก่อนแข่ง 15 นาที)' });
  }

  // Find or create prediction
  const predIndex = db.predictions.findIndex(p => p.userId === userId && p.matchId === matchId);

  if (prediction === null) {
    // Remove prediction
    if (predIndex !== -1) {
      db.predictions.splice(predIndex, 1);
    }
  } else {
    // Add/Update prediction
    if (predIndex !== -1) {
      db.predictions[predIndex].prediction = prediction;
    } else {
      db.predictions.push({ userId, matchId, prediction });
    }
  }

  writeDB(db);
  res.json({ success: true, message: 'บันทึกการทายผลสำเร็จ' });
});

// Get leaderboard
app.get('/api/leaderboard', (req, res) => {
  const db = readDB();
  const leaderboard = calculateLeaderboard(db);
  
  // Provide full prediction grid data for real-time comparison (all matches)
  const allMatches = db.matches;
  
  // Create a grid of predictions: { [userId]: { [matchId]: prediction } }
  const predictionGrid = {};
  db.users.filter(u => u.role !== 'admin').forEach(u => {
    predictionGrid[u.id] = {};
    allMatches.forEach(m => {
      const locked = isMatchLocked(m);
      if (locked || m.status === 'finished') {
        const pred = db.predictions.find(p => p.userId === u.id && p.matchId === m.id);
        predictionGrid[u.id][m.id] = pred ? pred.prediction : 'draw';
      } else {
        const pred = db.predictions.find(p => p.userId === u.id && p.matchId === m.id);
        if (pred) {
          predictionGrid[u.id][m.id] = pred.prediction;
        }
      }
    });
  });

  res.json({
    leaderboard,
    matches: allMatches.map(m => ({
      id: m.id,
      team1: m.team1,
      team1_flag: m.team1_flag,
      team2: m.team2,
      team2_flag: m.team2_flag,
      winner: m.winner,
      status: m.status,
      score1: m.score1,
      score2: m.score2,
      group: m.group,
      type: m.type
    })),
    predictionGrid
  });
});

// --- ADMIN ROUTES ---

// Middleware to check admin access
function adminOnly(req, res, next) {
  const adminId = req.headers['x-user-id'];
  if (!adminId) {
    return res.status(401).json({ success: false, message: 'สิทธิ์การเข้าถึงถูกปฏิเสธ' });
  }

  const db = readDB();
  const user = db.users.find(u => u.id === adminId && u.role === 'admin');
  if (!user) {
    return res.status(403).json({ success: false, message: 'สำหรับผู้ดูแลระบบเท่านั้น' });
  }
  next();
}

// Get players
app.get('/api/admin/players', adminOnly, (req, res) => {
  const db = readDB();
  const players = db.users.filter(u => u.role === 'player');
  res.json(players);
});

// Add player
app.post('/api/admin/players', adminOnly, (req, res) => {
  const { name, username, pin } = req.body;
  if (!name || !username || !pin) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  const db = readDB();

  // Check unique username
  const exists = db.users.some(u => u.username.toLowerCase() === username.toLowerCase());
  if (exists) {
    return res.status(400).json({ success: false, message: 'มีชื่อผู้ใช้นี้ในระบบแล้ว' });
  }

  const newPlayer = {
    id: 'u_' + Date.now().toString(36).substr(-4),
    username,
    name,
    pin,
    role: 'player'
  };

  db.users.push(newPlayer);
  writeDB(db);
  res.json({ success: true, player: newPlayer });
});

// Change PIN for any user (player or admin)
app.patch('/api/admin/players/:id/pin', adminOnly, (req, res) => {
  const { id } = req.params;
  const { pin } = req.body;

  if (!pin || !/^\d{4}$/.test(pin)) {
    return res.status(400).json({ success: false, message: 'PIN ต้องเป็นตัวเลข 4 หลักเท่านั้น' });
  }

  const db = readDB();
  const user = db.users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้นี้' });
  }

  user.pin = pin;
  writeDB(db);
  res.json({ success: true, message: `เปลี่ยน PIN ของ ${user.name} สำเร็จ` });
});

// Remove player
app.delete('/api/admin/players/:id', adminOnly, (req, res) => {
  const { id } = req.params;
  const db = readDB();
  
  const index = db.users.findIndex(u => u.id === id && u.role === 'player');
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'ไม่พบผู้เล่นนี้' });
  }

  db.users.splice(index, 1);
  // Clean up player's predictions as well
  db.predictions = db.predictions.filter(p => p.userId !== id);

  writeDB(db);
  res.json({ success: true, message: 'ลบผู้เล่นสำเร็จ' });
});

// Add match
app.post('/api/admin/matches', adminOnly, (req, res) => {
  const { team1, team1_flag, team2, team2_flag, kickoff, group, type } = req.body;
  if (!team1 || !team2 || !kickoff) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  const db = readDB();
  const newMatch = {
    id: 'm_' + Date.now().toString(36).substr(-4),
    team1,
    team1_flag: team1_flag || '🏳️',
    team2,
    team2_flag: team2_flag || '🏳️',
    kickoff, // ISO datetime string
    score1: null,
    score2: null,
    status: 'scheduled',
    winner: null,
    group: group || '',
    type: type || 'group'
  };

  db.matches.push(newMatch);
  writeDB(db);
  res.json({ success: true, match: newMatch });
});

// Update match result
app.put('/api/admin/matches/:id/result', adminOnly, (req, res) => {
  const { id } = req.params;
  const { score1, score2, status } = req.body; // status: 'finished' or 'scheduled'

  const db = readDB();
  const match = db.matches.find(m => m.id === id);

  if (!match) {
    return res.status(404).json({ success: false, message: 'ไม่พบคู่การแข่งขันนี้' });
  }

  if (status === 'finished') {
    if (score1 === null || score2 === null || isNaN(score1) || isNaN(score2)) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกสกอร์การแข่งขัน' });
    }

    const s1 = parseInt(score1);
    const s2 = parseInt(score2);

    match.score1 = s1;
    match.score2 = s2;
    match.status = 'finished';
    
    if (s1 > s2) {
      match.winner = 'team1';
    } else if (s2 > s1) {
      match.winner = 'team2';
    } else {
      match.winner = 'draw';
    }
  } else {
    // Reset match status to scheduled
    match.score1 = null;
    match.score2 = null;
    match.status = 'scheduled';
    match.winner = null;
  }

  writeDB(db);
  res.json({ success: true, match });
});

// Reset database to initial template and trigger api sync
app.post('/api/admin/reset', adminOnly, async (req, res) => {
  const cleanDB = {
    users: [
      {
        id: 'u_admin',
        username: 'admin',
        name: 'Administrator',
        pin: '8888',
        role: 'admin'
      }
    ],
    matches: [],
    predictions: []
  };

  const success = writeDB(cleanDB);
  if (!success) {
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  }

  // Trigger sync in background to re-import official matches immediately
  syncFromWorldCupAPI().catch(err => {
    console.error('Error syncing after database reset:', err);
  });

  res.json({ success: true, message: 'รีเซ็ตระบบเริ่มต้นใหม่และซิงค์ข้อมูลจริงสำเร็จ' });
});

// Export full database as JSON backup
app.get('/api/admin/export', adminOnly, (req, res) => {
  const db = readDB();
  const timestamp = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
  res.setHeader('Content-Disposition', `attachment; filename="worldcup-backup-${timestamp}.json"`);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json(db);
});

// Catch all for client SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  
  // Initial sync from World Cup 2026 API
  await syncFromWorldCupAPI();
  
  // Sync every 5 minutes in background
  setInterval(syncFromWorldCupAPI, 5 * 60 * 1000);
});
