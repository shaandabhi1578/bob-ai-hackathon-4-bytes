# GridGuard AI — Power Grid Intelligence & Maintenance Command Center

**Team:** bob-ai-hackathon-4-bytes  
**Track:** AI  
**Theme:** Turn Idea into Impact Faster  
**Built with:** IBM Bob IDE & Intelligent Development Workflow  
**Live Production URL:** [https://gridguard-app.vercel.app](https://gridguard-app.vercel.app)  
**Production Mirror:** [https://gridguard-ai-app.vercel.app](https://gridguard-ai-app.vercel.app)

---

## ⚡ Executive Summary

**GridGuard AI** is a state-of-the-art **Transmission & Substation Intelligence Operating System (OS)** engineered for regional State Load Despatch Centres (SLDC Gujarat). It empowers dispatchers, grid operations directors, and field maintenance crews to:

1. **Predict Equipment Failure Before Blackouts:** AI models synthesize SCADA multi-sensor telemetry (temperature ramp, vibration velocity, SF6 gas pressure, oil quality, and winding load) to detect early-stage catastrophic transformer failures 3 to 7 days in advance.
2. **Dynamic Meteorological Hazard Forecasting:** Integrates real-time meteorological feeds (Open-Meteo API) with interactive weather simulations (severe squalls, extreme heatwaves, monsoon downpours) that dynamically ripple through grid assets to adjust failure risks across Gujarat corridors (Ahmedabad, Gandhinagar, Vadodara, and Sanand).
3. **Automated Algorithmic Crew Routing & Dispatch:** Computes real-time Haversine proximity routing between 21 specialized field maintenance units and high-risk electrical assets, enforcing strict availability constraints (preventing double-dispatch of active or resting units).
4. **Multi-Channel Emergency Outage Broadcasting:** Dispatches instant outage alerts via Firebase Cloud Messaging (FCM Topic: `gridguard-outages`), paired with browser/mobile push notifications, audible terminal alarms, and WhatsApp/SMS triggers to registered critical contacts.
5. **Strict Role-Based Access Control (RBAC):**
   - **Chief Dispatcher (Admin):** Full command authority to simulate scenarios, adjust AI model weights, dispatch field crews, and trigger mass outage broadcasts.
   - **Field Technician (Employee):** Restricted, read-only operational terminal showcasing assigned work orders, unit staging status, and incoming emergency dispatch orders in real time.

---

## 🎯 How IBM Bob Accelerated Delivery

Developing GridGuard AI leveraged **IBM Bob IDE** as an intelligent development partner:

- **End-to-End Architecture & Full-Stack Scaffolding:** Bob structured the unified React + TypeScript architecture, integrating Leaflet geospatial visualization, complex risk engines, and responsive SCADA panels.
- **Dynamic Physics & Weather Calculation Engine:** Bob implemented mathematical formulations combining ambient meteorological vectors with SCADA telemetry — the weather risk contribution is computed as `asset.temperature + (region.temperature − 36) × 0.7`, feeding into the composite risk formula `(0.40 × Sensor) + (0.25 × Weather) + (0.20 × History) + (0.15 × Criticality)`.
- **Cross-Tab & Cross-Device Event Synchronization:** Bob integrated native `BroadcastChannel` and `localStorage` event buses enabling instantaneous multi-tab reflection between Admin and Employee screens.
- **Clean Production Deployment & Zero-Debt Refactoring:** Automated production builds, Vercel deployments, and strict type checking with zero compiler warnings.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies & Implementations |
|---|---|
| **Core Frontend** | React 19, TypeScript, Vite, Vanilla CSS design tokens |
| **Geospatial & SCADA** | Leaflet, MapTiler Satellite/Topo layers, Custom SVG Transmission Topologies |
| **AI Inference & Diagnostics** | Multi-factor risk engine (Sensor 40%, Weather 25%, History 20%, Criticality 15%) |
| **Meteorological Intelligence** | Open-Meteo REST API, live WMO weather code categorization |
| **Push & Broadcast Engine** | Firebase Cloud Messaging (FCM Admin SDK via Vercel Serverless Function), Web Push API, Native Audio Synthesis |
| **Security & RBAC** | Role-Based Access Control with dual-session simulation (Admin & Field Employee) |

---

## 🚀 Live Demo & Guided Hackathon Flow

Visit [https://gridguard-app.vercel.app](https://gridguard-app.vercel.app) to experience the platform:

1. **Hackathon Demo Tour:** Click the **"Hackathon Demo Flow"** button in the top header to launch a guided 21-step interactive tour.
2. **Real-Time Weather Simulation:** Navigate to **Weather**, click **"Extreme Heatwave"** or drag sliders, and observe immediate failure risk recalculations across regional transformers.
3. **Crew Dispatch:** In **Crew Management**, select an incident (e.g. `Transformer T-104`) and click **"Assign Crew"** to trigger proximity dispatch.
4. **Employee Role Isolation:** Click the profile icon in the top header, switch to **Field Technician (Employee)** with `EMP-04` and `EMP-04_Sharma`, and observe the read-only restricted interface with live assigned work order telemetry.
5. **Outage Broadcast:** Review transparent FCM routing in **Outage Notifications**, broadcasting to `gridguard-outages`.

---

## 📁 Hackathon Submission Deliverables (`bob_sessions/`)

In compliance with the **IBM Bob Hackathon Guide (Pages 18–19)**:
- Task session reports and consumption summaries are stored in the [`bob_sessions/`](./bob_sessions/) directory.
- All private API keys and credentials are saved exclusively in ignored environment files (`.env`, `firebase-service-account.json`) and are **not** committed to the public repository.

---

## 🧪 Testing & Security

- **105 automated tests** covering the full risk engine (71 unit tests) and React context integration (34 tests), powered by **Vitest + React Testing Library**.
- **PBKDF2-SHA-256** (210,000 iterations) password hashing with timing-safe comparison — no plaintext passwords stored anywhere.
- **5-attempt / 30-second lockout** on all login forms, with live countdown UI.
- **8-hour session TTL** with automatic expiry and re-authentication prompt.
- **BroadcastChannel schema validation** prevents malformed cross-tab event injection.
- **FCM serverless endpoint** secured with explicit CORS origin allowlist; fails closed (503) if credentials are absent.
