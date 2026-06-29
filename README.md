# 🏆 World Cup 2026 Predictor Pool

A premium, real-time prediction pool application designed for groups of friends or coworkers to compete during the **FIFA World Cup 2026**.

Featuring a sleek, glassmorphic dark theme ("Midnight Neon"), dual live-score APIs, real-time leaderboard standings, a full comparative prediction matrix grid, knockout-round support, and a complete export & backup system.


---

## ✨ Key Features

- **🔐 PIN-based Login:** Simple secure login using a username and 4-digit PIN (no complex signup needed).
- **⏱️ Locked Predictions:** Predictions are automatically locked **15 minutes before kickoff** (Bangkok local time).
- **📊 Real-time Leaderboard:** Standings calculated dynamically — 1 point per correct outcome. Updates every 15 seconds. Live matches count provisionally using the current score.
- **🕸️ Analysis Matrix:** A horizontally-scrollable comparison grid showing everyone's predictions side-by-side with a sticky player-name column. Sorted by kickoff time; old finished matches sink to the bottom.
- **🔄 Dual API Sync:** Fixtures and final results from `worldcup26.ir` every 60 seconds. Live scores, clock, and halftime status from ESPN every 60 seconds (only when a match is live).
- **🔴 Live Score + Clock:** Match cards show the current score and live clock (e.g. `67'`, `HT`, `45'+2'`) in the top-right badge during in-progress matches.
- **🥊 Knockout Round Support:** Draw option hidden for R32/R16/QF/SF/3rd/Final matches. Admin panel includes a penalty winner dropdown for shootout results.
- **🌐 Thai / English UI:** Toggle between Thai and English with a single button — all labels, dates, and match cards switch instantly.
- **🛠️ Admin Panel:** Manage players, manually add matches, record scores, select penalty winners, and access export tools.
- **📤 Export & Backup System:** Download predictions as a CSV (opens in Excel with full Thai character support) or export the full database as a JSON backup for disaster recovery.
- **📱 Mobile-Optimised:** Fully responsive layout across all screen sizes — match cards, leaderboard, and matrix all work cleanly on phones and tablets.
- **🚀 Cache-Busted Assets:** `index.html` is served with versioned asset URLs (`app.js?v=X.Y.Z`) so Cloudflare/CDN caches are automatically invalidated on every deploy.

---

## 🖥️ Screenshots

| Predict Tab | Leaderboard & Matrix | Admin Panel |
|---|---|---|
| Match cards with predict buttons | Live standings + prediction comparison | Player management + score entry |

---

## 🏗️ Architecture & Docker Persistence

To ensure zero-downtime data loss, **the application code is separated from the database storage (`db.json`)**:

- The Docker container holds only the server logic and static web assets.
- A persistent named Docker volume (`worldcup-data`) is mounted at `/app/data/`.
- The database `db.json` is stored inside this volume.
- **Auto-Seeding:** On first run with an empty volume, the app automatically seeds it with the default `db.json` template (preloaded matches + country flags) so no manual configuration is required.

### Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML + CSS + JS (no framework) |
| Backend | Node.js + Express |
| Database | JSON flat-file (`db.json`) |
| Container | Docker (`node:20-alpine`) |
| CI/CD | GitHub Actions → GHCR (`ghcr.io/mrkaqz/worldcup:latest`) |

### Live Score Architecture

Two APIs work together:

| API | Purpose | Frequency |
|-----|---------|-----------|
| `worldcup26.ir/get/games` | Fixtures, team names, flags, final results | Every 60s |
| ESPN scoreboard | Live scores, match clock, halftime detection | Every 60s (only when a match is live) |

`worldcup26.ir` does not provide live scores during matches — it only updates once a match is fully finished. ESPN fills this gap with real-time score and clock data. A time-based fallback marks any match as `live` once its kickoff time has passed, ensuring ESPN polling starts immediately.

---

## 🚀 Deployment with Docker Compose (Recommended)

You don't even need to clone this repository to deploy the application. Simply use the `docker-compose.yml` file and run it. The pre-built multi-arch image (`linux/amd64` + `linux/arm64`) is hosted on **GitHub Container Registry (GHCR)**.

Make sure you have [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed.

### 1. Download & Start Container

```bash
# Start the application in detached mode (it will pull the image from GHCR)
docker compose up -d
```

### 2. Verify Deployment

```bash
docker compose ps
docker compose logs -f
```

The app will be available at **`http://localhost:3000`**.

### 3. Stop Container

```bash
docker compose down
```

### 4. Updating to the Latest Version

```bash
docker compose pull
docker compose up -d
```

Since `db.json` lives in a separate Docker volume, **your players, scores, and predictions are never affected by updates**.

### 5. Completely Reset Data (Danger)

```bash
docker compose down -v
docker compose up -d
```

---

## 📤 Export & Backup

The Admin panel includes an **Export & Backup** section with two options:

| Button | Output | Format |
|--------|--------|--------|
| **ส่งออก Excel / CSV** | Leaderboard standings + full prediction matrix | `.csv` with UTF-8 BOM (Thai characters render correctly in Excel) |
| **สำรองฐานข้อมูล (JSON)** | Complete raw database snapshot | `.json` — restore by replacing `db.json` in the Docker volume |

> Both options require admin login.

---

## 🛠️ Local Development (Without Docker)

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or newer

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open **`http://localhost:3000`** in your browser.

---

## ⚙️ Configuration (Environment Variables)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port the web server listens on | `3000` |
| `DB_PATH` | Path where `db.json` is stored | `/app/data/db.json` |
| `NODE_ENV` | Execution mode | `production` |

---

## 📂 Project Structure

```
├── .github/workflows/
│   └── docker-build.yml     # CI: builds multi-arch Docker image on push to main
├── public/
│   ├── index.html           # Single-page app shell + all markup
│   ├── app.js               # SPA logic: polling, rendering, predictions, export
│   ├── i18n.js              # Thai/English translations + language switching
│   └── style.css            # Midnight Neon theme + responsive breakpoints
├── CLAUDE.md                # Codebase guide for AI-assisted development
├── db.json                  # Seed / template database
├── Dockerfile               # node:20-alpine, port 3000
├── docker-compose.yml       # Production compose with persistent volume
├── package.json             # Dependencies + version string
└── server.js                # Express REST API + dual live-score sync jobs
```

---

## 🔄 CI/CD Flow

1. Push to `main` → GitHub Actions triggers `.github/workflows/docker-build.yml`
2. Builds `linux/amd64` + `linux/arm64` image
3. Pushes to `ghcr.io/mrkaqz/worldcup:latest`, `ghcr.io/mrkaqz/worldcup:vX.Y.Z`, and `ghcr.io/mrkaqz/worldcup:sha-<short>`
4. Creates a GitHub Release for the new version automatically
5. On your server: `docker compose pull && docker compose up -d`

Monitor builds at: [github.com/mrkaqz/worldcup/actions](https://github.com/mrkaqz/worldcup/actions)

---

## 🔍 Debug Endpoints (Public)

| Endpoint | Description |
|----------|-------------|
| `GET /api/debug/worldcup` | Raw response from `worldcup26.ir` — useful for checking if the API has updated scores |
| `GET /api/debug/espn` | Raw ESPN scoreboard — shows live status, clock, and scores for today's matches |

---

## 📝 Version History

| Version | Highlights |
|---------|-----------|
| v2.7.0 | Show "Live ET" badge during extra time (e.g. "Live ET 107'", "Live ET HT") instead of plain "Live" |
| v2.6.1 | Recognize ESPN `STATUS_HALFTIME_ET` (break between extra-time periods) as live; show "HT" badge |
| v2.6.0 | Recognize ESPN `STATUS_OVERTIME` (extra time) as live |
| v2.5.9 | Recognize ESPN `STATUS_END_OF_REGULATION` (break before extra time) as live |
| v2.5.8 | Flat uniform background — removed decorative glow overlays |
| v2.5.7 | Fix England vs DR Congo not importing when API reshuffled game IDs (ID collision fallback) |
| v2.5.6 | Fix ESPN team-name match for DR Congo ("Congo DR" alias added) |
| v2.5.5 | Live clock and "Live" label use matching bold font weight |
| v2.5.4 | Show "HT" at halftime instead of raw clock value |
| v2.5.3 | Move live clock to top-right badge; clean score area shows numbers only |
| v2.5.2 | Live match clock (`67'`, `HT`, `45'+2'`) stored from ESPN and shown in badge |
| v2.5.1 | Knockout predict buttons use 2-column layout aligned under each team |
| v2.5.0 | Knockout round support: no Draw option; admin penalty winner dropdown; no draw in leaderboard/ESPN sync |
| v2.4.4 | Versioned asset URLs (`app.js?v=X`) injected into HTML to bypass Cloudflare cache on deploy |
| v2.4.3 | Proper 3-letter FIFA codes in prediction matrix (fixes RSA/KOR both showing as SOU) |
| v2.4.2 | Expand ESPN live status codes: `STATUS_FIRST_HALF`, `STATUS_SECOND_HALF`, `STATUS_EXTRA_TIME`, `STATUS_PENALTY` |
| v2.4.1 | Fix ESPN `STATUS_FULL_TIME` not recognised as finished (group-stage matches never use `STATUS_FINAL`) |
| v2.4.0 | ESPN secondary live-score API; dual sync every 60s; public debug endpoints; Docker version tags + auto GitHub Releases |
| v2.3.2 | Live score display with pulsing badge; 60s sync interval; time-based live fallback; pastKickoff guard against stale API data |
| v2.3.1 | Thai / English language toggle (i18n); locale-aware date formatting |
| v2.2.2 | Mask predictions as `***` until match locks; reveal all choices at lockout |
| v2.2.1 | Preserve open accordion state across background polls |
| v2.2.0 | Skip re-render when polled data is unchanged; Google Analytics integration |
| v2.1.0 | Gold / silver / bronze medals for top 3; equal prize split for tied players |
| v2.0.1 | Fix CSV prediction matrix showing empty columns |
| v2.0.0 | Export & Backup system (CSV + JSON download) |
| v1.9.0 | Fix nav-to-content gap (CSS specificity fix for `main.container`) |
| v1.8.0 | Fix matrix sticky column gap / content bleed-through |
| v1.7.0 | Opaque sticky nav — prevents page content showing through tab bar when scrolling |
