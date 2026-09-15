# Setup & Execution Guide — GridGuard AI

This document provides exact, reproducible steps to set up, build, and run **GridGuard AI** on a clean machine.

---

## 1. Prerequisites

Ensure your system has the following installed:
- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **npm:** v9.0.0 or higher
- **Git:** v2.30.0 or higher
- **Modern Browser:** Chrome, Edge, Safari, or Firefox (with JavaScript & Audio enabled)

Verify your versions:
```bash
node -v
npm -v
git --version
```

---

## 2. Environment Variables Setup

GridGuard AI works out of the box with standard OpenStreetMap tiles. To enable high-resolution MapTiler satellite and topographic layers, configure your local environment file:

1. Copy the template:
```bash
cp src/.env.example .env
```

2. The `.env` file should look like this:
```bash
# Local Environment Configuration (GridGuard AI)
# Private API Keys loaded exclusively from local files
VITE_MAPTILER_API_KEY=your_maptiler_key_here
```
*(Note: If no MapTiler key is provided, the application gracefully falls back to open OpenStreetMap tiles).*

---

## 3. Installation & Local Development

### Step 1: Clone the Repository
```bash
git clone https://github.com/shaandabhi/Bob_hackathon.git
cd Bob_hackathon
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start Development Server
```bash
npm run dev
```

The application will start locally at:
```
http://localhost:5173/
```

---

## 4. Production Build & Verification

To verify that the application compiles and bundles cleanly without TypeScript errors:

```bash
npm run build
```

Expected output:
```
vite v8.3.0 building client environment for production...
transforming...
✓ 1897 modules transformed.
rendering chunks...
dist/index.html                   1.20 kB
dist/assets/index-JGlzlNV4.css    8.91 kB
dist/assets/index-DvQkQelr.js   618.38 kB
✓ built in 135ms
```

To preview the production bundle locally:
```bash
npm run preview
```

---

## 5. Live Production Deployment URLs

If you prefer testing without local installation, the application is deployed live to Vercel:
- **Primary Live URL:** [https://gridguard-app.vercel.app](https://gridguard-app.vercel.app)
- **Mirror Live URL:** [https://gridguard-ai-app.vercel.app](https://gridguard-ai-app.vercel.app)

---

## 6. Verification Checklist & Demo Guide

Follow these steps to verify key features:

| Step | Action | Expected Behavior |
|---|---|---|
| **1. Hackathon Tour** | Click **"Hackathon Demo Flow"** button in header | Guided 21-step tour highlights core SCADA capabilities |
| **2. Live Weather Feed** | Open **Weather** tab, click **"Fetch Live Weather"** | Pulls real-time meteorological conditions for Gujarat via Open-Meteo API |
| **3. Storm Simulation** | Click **"Extreme Heatwave"** preset or drag sliders | Recalculates risk across regional transformers in real time |
| **4. Crew Proximity Dispatch** | Open **Crew Management**, select `Transformer T-104`, click **"Assign Crew"** | Unit status shifts to `Assigned` with Haversine ETA and route line drawn on Map |
| **5. Multi-Tab Real-Time Sync** | Open two browser windows (one Admin, one Employee `EMP-04`) | Dispatching a crew in Window 1 immediately triggers an audio chime and work order popup in Window 2 |
| **6. Employee Role Isolation** | Switch profile to Field Technician (`EMP-04` / `EMP-04_Sharma`) | Settings is hidden; dispatch buttons show `🔒 Read-Only Dispatch Terminal` |
| **7. FCM Outage Advisory** | Open **Outage Notifications** | View transparent FCM routing to topic `gridguard-outages` |

---

## 7. Troubleshooting Common Issues

| Issue | Root Cause | Solution |
|---|---|---|
| **Map tiles not loading** | Network blocking MapTiler CDN | Switch layer dropdown on top-right of Map to **OpenStreetMap** |
| **Audio chime not playing** | Browser autoplay policy | Click anywhere on the application interface to grant audio gesture permission |
| **Port 5173 already in use** | Another local dev process is running | Run `npm run dev -- --port 5174` or kill the existing process |
| **Build fails with TS error** | Dependency mismatch | Run `rm -rf node_modules package-lock.json && npm install` |
