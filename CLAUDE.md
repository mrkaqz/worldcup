# World Cup 2026 Predictor — CLAUDE.md

## Repository
- **GitHub**: https://github.com/mrkaqz/worldcup
- **Production URL**: https://wp.ronnarong.dev
- **Docker image**: `ghcr.io/mrkaqz/worldcup:latest` (GitHub Container Registry)

---

## Architecture

This is a **single-server web app** — no build step, no framework, no bundler.

```
worldcup/
├── public/
│   ├── index.html      # Single HTML page (~354 lines) — markup, Thai labels, font/icon imports
│   ├── style.css       # All styles (~1753 lines) — glassmorphic dark theme, two breakpoints
│   └── app.js          # All client-side JS (~1310 lines) — SPA logic, polling, DOM rendering
├── server.js           # Express backend (~689 lines) — REST API + JSON DB + live sync
├── db.json             # JSON flat-file database — users, matches, predictions
├── package.json        # Node deps (express, cors) + version string
├── Dockerfile          # node:20-alpine, exposes port 3000
├── docker-compose.yml  # Production compose — mounts worldcup-data volume for db.json
└── .github/
    └── workflows/
        └── docker-build.yml  # CI: builds multi-arch image (amd64 + arm64) on push to main
```

### Frontend
Vanilla HTML + CSS + JS. No React, no Vue, no TypeScript.
- `app.js` polls `/api/matches` and `/api/leaderboard` every 15 seconds for real-time updates.
- Tab switching, match card rendering, prediction submission, and countdown timers are all in `app.js`.
- Styles use CSS custom properties (`--bg-main`, `--primary-glow`, etc.) defined at `:root`.
- All UI text is in **Thai language**. Time formatting uses `toLocaleString('th-TH')` at UTC+7 (Bangkok).
- FontAwesome 6.4.0 and Google Fonts (Outfit, Noto Sans Thai) are loaded from CDN.

### Backend (`server.js`)
Express REST API with CORS enabled. Full endpoint list:

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/login` | None | Authenticate by username + 4-digit PIN |
| GET | `/api/matches` | Optional (`X-User-Id`) | List matches with user's prediction state |
| POST | `/api/predict` | Required (`X-User-Id`) | Submit or cancel a prediction |
| GET | `/api/leaderboard` | None | Standings + prediction comparison matrix |
| GET | `/api/admin/players` | Admin | List all players |
| POST | `/api/admin/players` | Admin | Create new player |
| PATCH | `/api/admin/players/:id/pin` | Admin | Change any user's PIN |
| DELETE | `/api/admin/players/:id` | Admin | Remove player + cascade delete predictions |
| POST | `/api/admin/matches` | Admin | Create new match |
| PUT | `/api/admin/matches/:id/result` | Admin | Set score + status; auto-calculates winner |
| POST | `/api/admin/reset` | Admin | Clear all non-admin users and predictions, re-sync API |
| GET | `/api/admin/export` | Admin | Download full db.json as file backup |

Auth is header-based: `X-User-Id` header contains the user's `id` string (no tokens, no sessions).
Admin middleware checks `role === 'admin'` in `db.json`.

The server syncs live match data from `https://worldcup26.ir/get/games` on startup and every 5 minutes.

### Database
`db.json` is a plain JSON file read/written synchronously by `server.js`. On Docker it lives in the `worldcup-data` named volume at `/app/data/db.json` so it persists across container restarts.

**Schema:**
```json
{
  "users": [
    {
      "id": "u_admin | u_<timestamp>",
      "username": "string (unique, compared case-insensitively)",
      "name": "string",
      "pin": "4-digit string (stored in plaintext)",
      "role": "admin | player"
    }
  ],
  "matches": [
    {
      "id": "m_<number or timestamp>",
      "team1": "string",
      "team1_flag": "emoji or 🏳️",
      "team2": "string",
      "team2_flag": "emoji or 🏳️",
      "kickoff": "ISO 8601 with timezone offset (e.g. '2026-06-11T13:00:00-06:00')",
      "score1": "number | null",
      "score2": "number | null",
      "status": "scheduled | live | finished",
      "winner": "team1 | team2 | draw | null",
      "group": "string (A–L, R16, QF, SF, 3RD, FINAL)",
      "type": "group | r32 | r16 | qf | sf | third | final"
    }
  ],
  "predictions": [
    {
      "userId": "u_<id>",
      "matchId": "m_<id>",
      "prediction": "team1 | team2 | draw"
    }
  ]
}
```

---

## Key Behaviors

### Prediction Locking
- Predictions lock **15 minutes before kickoff** (`kickoffTime - 15 * 60 * 1000`).
- After lock, the match card shows all players' predictions (transparency feature).
- Users can toggle/remove their prediction any time before lock.

### Scoring (Leaderboard)
- 1 point per correct prediction on a finished match.
- Sorted by: points (desc) → correctCount (desc) → name (asc, Thai collation).
- Admin users are excluded from leaderboard.
- Prediction matrix shows only locked/finished/live matches or matches with ≥1 prediction.

### API Sync (`worldcup26.ir`)
- Runs on startup and every 5 minutes.
- Converts stadium local times to US timezone offsets (Eastern/Central/Mountain/Pacific) using a hardcoded stadium→timezone map.
- Team names are normalized: `"USA"` → `"United States"`, `"Czechia"` → `"Czech Republic"`, etc.
- 108+ flag emojis are stored in a hardcoded map on the server.
- Placeholder team names like `"Winner of..."` and `"Runner-up..."` are filtered out.

### Exports
- **CSV export**: Leaderboard + prediction matrix, UTF-8 BOM, downloadable as `.csv`.
- **JSON backup**: Full `db.json` file download via `/api/admin/export`.

---

## Version Bumping

The version appears in **two places** — both must be updated together:

1. `package.json` → `"version"` field
2. `public/index.html` → footer line containing `v2.x.x`

Forgetting either means the displayed version in the app footer won't match the actual release.

**Current version: v2.1.1**

---

## How to Push an Update to Production

### 1. Make your changes
Edit files in the repo. All frontend changes are in `public/`.

### 2. Bump the version (if it's a meaningful change)
```bash
# In package.json
"version": "2.2.0"

# In public/index.html — find the footer line
| v2.2.0
```

### 3. Commit and push to `main`
```bash
git add .
git commit -m "feat: your change description"
git push origin main
```

### 4. GitHub Actions builds the Docker image automatically
- Workflow: `.github/workflows/docker-build.yml`
- Triggers on push/PR to `main` or `master`
- Builds multi-arch image (`linux/amd64` + `linux/arm64`)
- Pushes to `ghcr.io/mrkaqz/worldcup:latest` and `ghcr.io/mrkaqz/worldcup:sha-<short>`
- Takes ~1–2 minutes. Monitor at: https://github.com/mrkaqz/worldcup/actions

### 5. Pull and restart on the production server
SSH into the server and run:
```bash
docker pull ghcr.io/mrkaqz/worldcup:latest
docker compose up -d
```

The `worldcup-data` volume is preserved across restarts so `db.json` is not lost.

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3000` | HTTP server port |
| `DB_PATH` | `./db.json` | Path to database file (Docker sets `/app/data/db.json`) |
| `NODE_ENV` | `development` | Set to `production` in Docker |

No API keys are required. The `worldcup26.ir` sync endpoint is public.

---

## CSS & Responsive Design

- **Design language**: Glassmorphic dark theme. Background `#060a16`. Primary accent `#00f2fe` (cyan). Secondary `#4facfe` (blue). Gold accents `#fda085` / `#ffc72c`.
- **Breakpoints**:
  - `@media (max-width: 768px)` — tablet and smaller
  - `@media (max-width: 480px)` — phone-sized screens
- Match cards use `minmax(min(350px, 100%), 1fr)` grid so they never overflow on narrow phones.
- Animations: `fadeIn`, `pulse`, `slideInUp` (0.2s–0.35s `cubic-bezier` transitions).

---

## Frontend Patterns

- **State**: global vars `currentUser`, `matchesData`, `leaderboardData`, `activeTab`, `matchFilter`.
- **Persistence**: `currentUser` stored in `localStorage` as `worldcup_user` (JSON).
- **DOM**: `document.querySelector()` + `.innerHTML` assignments. Inline `onclick="func(...)"` handlers.
- **Render functions**: `renderMatches()`, `renderLeaderboard()`.
- **UI components**: toast notifications (4s auto-dismiss), loading spinners (FA icons), login modal, accordion predictions, inline admin forms.
- **Tab system**: `switchTab(tabId)` — tabs: `predict`, `leaderboard`, `admin`.

---

## Known Issues

- **Duplicate match entries in `db.json`**: Some match IDs appear multiple times due to repeated API sync runs. The server has deduplication logic as a workaround; the root cause has not been fixed.
- **Synchronous file I/O**: `readFileSync`/`writeFileSync` block the event loop on every DB operation. Acceptable for this scale but would need async migration for heavier load.
- **No CSRF protection, no rate limiting, PINs stored in plaintext**: This is a private pool app, not a public-facing security-sensitive service.
