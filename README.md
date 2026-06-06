# 🏆 World Cup 2026 Predictor Pool

A premium, real-time prediction pool application designed for groups of friends or coworkers to compete during the **FIFA World Cup 2026**.

Featuring a sleek, glassmorphic dark theme ("Midnight Neon"), automatic background schedule/score syncing, real-time leaderboard standings, a full comparative prediction matrix grid, and a complete export & backup system.


---

## ✨ Key Features

- **🔐 PIN-based Login:** Simple secure login using a username and 4-digit PIN (no complex signup needed).
- **⏱️ Locked Predictions:** Predictions are automatically locked **15 minutes before kickoff** (Bangkok local time).
- **📊 Real-time Leaderboard:** Standings calculated dynamically — 1 point per correct outcome. Updates every 15 seconds.
- **🕸️ Analysis Matrix:** A horizontally-scrollable comparison grid showing everyone's predictions side-by-side with a sticky player-name column.
- **🔄 Auto API Sync:** Automatically fetches real-time scores, match schedules, and results from the official World Cup API every 5 minutes.
- **🛠️ Admin Panel:** Manage players, manually add custom matches, record actual scores, and access export tools.
- **📤 Export & Backup System:** Download predictions as a CSV (opens in Excel with full Thai character support) or export the full database as a JSON backup for disaster recovery.
- **📱 Mobile-Optimised:** Fully responsive layout across all screen sizes — match cards, leaderboard, and matrix all work cleanly on phones and tablets.

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
│   └── style.css            # Midnight Neon theme + responsive breakpoints
├── CLAUDE.md                # Codebase guide for AI-assisted development
├── db.json                  # Seed / template database
├── Dockerfile               # node:20-alpine, port 3000
├── docker-compose.yml       # Production compose with persistent volume
├── package.json             # Dependencies + version string
└── server.js                # Express REST API + background score-sync job
```

---

## 🔄 CI/CD Flow

1. Push to `main` → GitHub Actions triggers `.github/workflows/docker-build.yml`
2. Builds `linux/amd64` + `linux/arm64` image
3. Pushes to `ghcr.io/mrkaqz/worldcup:latest` and `ghcr.io/mrkaqz/worldcup:sha-<short>`
4. On your server: `docker compose pull && docker compose up -d`

Monitor builds at: [github.com/mrkaqz/worldcup/actions](https://github.com/mrkaqz/worldcup/actions)

---

## 📝 Version History

| Version | Highlights |
|---------|-----------|
| v2.0.1 | Fix CSV prediction matrix showing empty columns |
| v2.0.0 | Export & Backup system (CSV + JSON download) |
| v1.9.0 | Fix nav-to-content gap (CSS specificity fix for `main.container`) |
| v1.8.0 | Fix matrix sticky column gap / content bleed-through |
| v1.7.0 | Opaque sticky nav — prevents page content showing through tab bar when scrolling |
| v1.6.0 | Add top/bottom padding to main content area |
| v1.5.0 | Increase card padding and card-header spacing |
| v1.4.0 | Mobile overflow fixes — match cards, predict buttons, teams layout |
| v1.3.0 | Sticky header + nav improvements |
