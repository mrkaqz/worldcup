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
│   ├── index.html      # Single HTML page — all markup, font/icon links
│   ├── style.css       # All styles (~1600 lines) — mobile-first, two breakpoints (768px, 480px)
│   └── app.js          # All client-side JS (~1100 lines) — SPA logic, polling, DOM rendering
├── server.js           # Express backend (~624 lines) — REST API + JSON DB reads/writes
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

### Backend (`server.js`)
Express REST API. Key endpoints:
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/login` | Authenticate user by username + PIN |
| GET | `/api/matches` | List matches with user's prediction state |
| POST | `/api/predict` | Submit or cancel a prediction |
| GET | `/api/leaderboard` | Standings + prediction comparison matrix |
| POST | `/api/admin/players` | Add player (admin only) |
| DELETE | `/api/admin/players/:id` | Remove player |
| POST | `/api/admin/matches` | Create match |
| PUT | `/api/admin/matches/:id/result` | Set match result |
| POST | `/api/admin/reset` | Reset all predictions |

The server also syncs live match data from `https://worldcup26.ir/get/games` every 5 minutes.

### Database
`db.json` is a plain JSON file read/written directly by `server.js`. On Docker it lives in the `worldcup-data` named volume at `/app/data/db.json` so it persists across container restarts.

---

## Version bumping

The version appears in **two places** — both must be updated together:

1. `package.json` → `"version"` field
2. `public/index.html` → footer line containing `v1.x.x`

Forgetting either means the displayed version in the app footer won't match the actual release.

Current version: **v1.4.0**

---

## How to push an update to production

### 1. Make your changes locally

Edit files in the repo. All frontend changes are in `public/`.

### 2. Bump the version (if it's a meaningful change)

```bash
# In package.json — increment version
"version": "1.5.0"

# In public/index.html — find the footer line and update
| v1.5.0
```

### 3. Commit and push to `main`

```bash
git add .
git commit -m "feat: your change description"
git push origin HEAD:main   # or: git push origin main
```

### 4. GitHub Actions builds the Docker image automatically

- Workflow: `.github/workflows/docker-build.yml`
- Triggers on any push to `main` or `master`
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

## Mobile breakpoints

The CSS has two responsive breakpoints:
- `@media (max-width: 768px)` — tablet and smaller
- `@media (max-width: 480px)` — phone-sized screens

Match cards use `minmax(min(350px, 100%), 1fr)` so they never overflow on narrow phones.
