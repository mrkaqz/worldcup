# 🏆 World Cup 2026 Predictor Pool

A premium, real-time prediction pool application designed for groups of friends or coworkers (supporting up to 30 players) to compete during the **FIFA World Cup 2026**.

Featuring a sleek, glassmorphic dark theme ("Midnight Neon"), automatic background schedule/score syncing, real-time leaderboard standings, and a full comparative prediction matrix grid.

---

## ✨ Key Features

- **🔐 PIN-based Login:** Simple secure login using a username and 4-digit PIN (no complex signup needed).
- **⏱️ Locked Predictions:** Predictions are automatically locked **15 minutes before kickoff** (Bangkok local time).
- **📊 Real-time Leaderboard:** Standings are calculated dynamically (1 point for correct outcome, 0 points for incorrect prediction).
- **🕸️ Analysis Matrix:** A scrollable comparison grid showing everyone's predictions side-by-side once a match kicks off.
- **🔄 Auto API Sync:** Automatically fetches real-time scores, match schedules, and updates directly from the official World Cup API in the background.
- **🛠️ Admin Panel:** Dedicated tools to manage players (up to 30), manually add custom matches, and record actual scores if needed.

---

## 🏗️ Architecture & Docker Persistence

To ensure zero downtime data loss, **the application code is separated from the database storage (`db.json`)**:

- The Docker container holds only the server logic and static web assets.
- A persistent named Docker volume (`worldcup-data`) is mounted at `/app/data/`.
- The database `db.json` is stored inside this volume.
- **Auto-Seeding:** If you run the container for the first time and the volume is empty, the app will automatically seed the volume with the default `db.json` template (containing all preloaded matches and country flag configurations) so that no configuration is required.

---

## 🚀 Deployment with Docker Compose (Recommended)

Make sure you have [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed.

### 1. Build and Start Container
Deploy the application in detached mode (in the background):
```bash
docker compose up -d --build
```
This builds the application image using the optimized `Dockerfile` and starts the app on port `3000`.

### 2. Verify Deployment
Ensure the container is running and check its logs:
```bash
docker compose ps
docker compose logs -f
```

The app will now be available at **`http://localhost:3000`**.

### 3. Stop Container
To stop the application without losing any data or predictions:
```bash
docker compose down
```

### 4. Updating the Application
When you pull new updates or bug fixes from Git, you can safely deploy them with:
```bash
git pull
docker compose up -d --build
```
Since the `db.json` is kept in a separate Docker volume, **your players, scores, and predictions will not be affected by updates**.

### 5. Completely Reset Data (Danger)
If you want to clear all data and reset the system back to the seed template:
```bash
docker compose down -v
docker compose up -d --build
```

---

## 🛠️ Local Development (Without Docker)

If you prefer to run the Node.js server directly on your host machine:

### Prerequisite
Install [Node.js](https://nodejs.org/) (v18 or newer).

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open **`http://localhost:3000`** in your browser.

---

## ⚙️ Configuration (Environment Variables)

The following environment variables can be configured inside `docker-compose.yml`:

| Environment Variable | Description | Default Value |
|----------------------|-------------|---------------|
| `PORT` | Port the web server listens on | `3000` |
| `DB_PATH` | Path where the JSON database is stored | `/app/data/db.json` |
| `NODE_ENV` | Mode of execution (`production` or `development`) | `production` |

---

## 📂 Project Structure

```
├── .github/workflows/
│   └── docker-build.yml     # Auto-Build CI Workflow
├── public/                  # Frontend Web Assets
│   ├── index.html           # Main Layout & SEO structure
│   ├── app.js               # Frontend controller & WebSockets/polling logic
│   └── style.css            # Stylesheets (Midnight Neon Theme)
├── db.json                  # Seed/Template Database
├── Dockerfile               # Production Dockerfile
├── docker-compose.yml       # Docker Compose Configuration
├── package.json             # App Metadata & Dependencies
└── server.js                # Express REST API & Background API Score Sync Job
```
