# Technical Architecture — GridGuard AI

## 1. System Architecture Diagram

```mermaid
graph TD
    subgraph ClientLayer["Frontend Command Center (React 19 + TypeScript + Vite)"]
        A[Dashboard Map - Leaflet / MapTiler]
        B[AI Risk Prediction & Simulator]
        C[Interactive Weather Portal]
        D[Spatial Crew Management]
        E[Outage Notification Center]
        F[Field Employee Terminal]
    end

    subgraph StateBus["Reactive State & Event Synchronization"]
        G[GridContext Provider]
        H[AuthContext - RBAC Engine]
        I[BroadcastChannel: gridguard_realtime_events]
        J[Universal LocalStorage Event Bus]
    end

    subgraph ExternalServices["External APIs & Messaging Infrastructure"]
        K[Open-Meteo REST API - Live Weather]
        L[MapTiler Cloud - Topographic & Satellite Tiles]
        M[Firebase Cloud Messaging API - /api/fcm]
        N[Web Push Notification API / Service Worker]
        O[WhatsApp Web & Native SMS Handlers]
    end

    A <--> G
    B <--> G
    C <--> G
    D <--> G
    E <--> G
    F <--> G

    G <--> H
    G <--> I
    G <--> J

    C -->|Fetch Real-Time Forecast| K
    A -->|Fetch Vector & Satellite Maps| L
    E -->|Broadcast JSON Outage Payload| M
    E -->|Direct Browser Alert| N
    E -->|1-Click Direct Cellular Link| O
```

---

## 2. Component Responsibility Matrix

| Component / File | Technology | Responsibility |
|---|---|---|
| [`src/context/GridContext.tsx`](file:///Users/shaandabhi/Documents/PROJECTS/Bob_hackathon/src/context/GridContext.tsx) | React Context, Web Audio API | Single source of truth for assets, crews, simulation parameters, and cross-tab event handling |
| [`src/context/AuthContext.tsx`](file:///Users/shaandabhi/Documents/PROJECTS/Bob_hackathon/src/context/AuthContext.tsx) | React Context, LocalStorage | Manages user authentication, employee rosters, and Role-Based Access Control (Admin vs. Employee vs. Testing) |
| [`src/services/weatherService.ts`](file:///Users/shaandabhi/Documents/PROJECTS/Bob_hackathon/src/services/weatherService.ts) | TypeScript, Fetch API | Asynchronously fetches live weather telemetry from Open-Meteo for Gujarat anchors |
| [`src/services/firebaseMessagingService.ts`](file:///Users/shaandabhi/Documents/PROJECTS/Bob_hackathon/src/services/firebaseMessagingService.ts) | TypeScript, Fetch API | Client service initiating POST requests to `/api/fcm` |
| [`api/fcm.js`](file:///Users/shaandabhi/Documents/PROJECTS/Bob_hackathon/api/fcm.js) | Node.js, Firebase Admin SDK | Serverless API route broadcasting emergency alerts to FCM topic `gridguard-outages` |
| [`src/components/dashboard/RealLeafletMap.tsx`](file:///Users/shaandabhi/Documents/PROJECTS/Bob_hackathon/src/components/dashboard/RealLeafletMap.tsx) | Leaflet, React Leaflet | Geospatial rendering of transmission lines, substations, storm hazard overlays, and routing trajectories |
| [`src/components/views/WeatherView.tsx`](file:///Users/shaandabhi/Documents/PROJECTS/Bob_hackathon/src/components/views/WeatherView.tsx) | React, CSS Grid | Interactive meteorological sliders, scenario presets, and real-time regional asset tables |
| [`src/components/views/CrewManagementView.tsx`](file:///Users/shaandabhi/Documents/PROJECTS/Bob_hackathon/src/components/views/CrewManagementView.tsx) | React, Lucide Icons | Algorithmic crew matching, availability guards, and employee dedicated work order portal |
| [`src/components/views/OutageNotificationsView.tsx`](file:///Users/shaandabhi/Documents/PROJECTS/Bob_hackathon/src/components/views/OutageNotificationsView.tsx) | React | Multi-channel broadcast dispatch, FCM destination transparency, and contact registry |
| [`src/components/common/RealtimeAlertBanner.tsx`](file:///Users/shaandabhi/Documents/PROJECTS/Bob_hackathon/src/components/common/RealtimeAlertBanner.tsx) | React, CSS Animation | Floating real-time alert banner displaying incoming dispatches with audible tone |

---

## 3. End-to-End Data Flow

1. **SCADA Ingestion & Weather Sync:**
   - Every second, SCADA sensor streams update winding temperatures, vibration patterns, and load percentages.
   - The weather service periodically queries the Open-Meteo REST API or processes interactive slider inputs.
2. **Dynamic Risk Assessment:**
   - The risk calculation engine evaluates:
     $$\text{Total Risk} = (0.40 \times \text{Sensor}) + (0.25 \times \text{Weather}) + (0.20 \times \text{History}) + (0.15 \times \text{Criticality})$$
   - Equipment with risk > 80% is escalated to `Critical` status.
3. **Crew Proximity Algorithm:**
   - For a critical asset, Haversine spherical geometry calculates the distance to all units staged across Gujarat depots:
     $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
   - Only units with `status === 'Available'` are eligible for recommendation.
4. **Broadcast & Cross-Device Reflection:**
   - When Admin clicks **"Assign Crew"**, a structured JSON event is dispatched via `BroadcastChannel` and `localStorage`.
   - Employee tabs immediately play a 440Hz alert chime and pop up the work order acknowledgment banner.
   - Outage notifications transmit via `/api/fcm` to Firebase Cloud Messaging topic `gridguard-outages`.

---

## 4. Security & Compliance

### 4.1 Credential Segregation
- `.env` and `firebase-service-account.json` are excluded via `.gitignore`.
- The FCM serverless function (`api/fcm.js`) reads `FIREBASE_SERVICE_ACCOUNT` from environment variables only; it returns HTTP 503 if the variable is absent rather than falling back to any hardcoded value.
- The FCM endpoint enforces an explicit `ALLOWED_ORIGINS` allowlist (production + localhost) instead of a wildcard `Access-Control-Allow-Origin: *`.

### 4.2 Authentication — PBKDF2-SHA-256
All user credentials are protected by a hardened authentication layer implemented in [`src/utils/crypto.ts`](../src/utils/crypto.ts) and [`src/context/AuthContext.tsx`](../src/context/AuthContext.tsx):

| Property | Value |
|---|---|
| **Hash algorithm** | PBKDF2-SHA-256 via Web Crypto API (`crypto.subtle`) |
| **Iterations** | 210,000 (OWASP 2023 minimum for PBKDF2-SHA-256) |
| **Salt** | 16-byte cryptographically random salt per credential, stored with hash |
| **Comparison** | Timing-safe (constant 300 ms floor to prevent side-channel timing attacks) |
| **Storage** | `localStorage` key holds `salt:hash` hex pair — no plaintext ever written |
| **Migration** | On first login, any legacy plaintext password is silently upgraded to PBKDF2 |

### 4.3 Session Management & Brute-Force Protection
- **8-hour session TTL:** Stored session timestamps are checked on every `AuthContext` mount; expired sessions are cleared and the user is prompted to re-authenticate.
- **5-attempt / 30-second lockout:** After five consecutive failed login attempts the account is locked for 30 seconds. The UI displays a live countdown in the [`LoginModal`](../src/components/auth/LoginModal.tsx).
- **User enumeration prevention:** Invalid-username and invalid-password paths both delay for the full PBKDF2 duration before returning an error, making them indistinguishable to an attacker.

### 4.4 Role-Based Boundaries
Non-admin accounts are restricted from accessing system settings, modifying model parameters, or initiating mass broadcasts. Employee login uses strict string equality (no case-folding) to prevent credential bypass.

### 4.5 BroadcastChannel Event Hardening
All cross-tab messages received on `BroadcastChannel('gridguard_realtime_events')` are validated against a strict schema before any state mutation. Unknown event types and payloads that fail regex or type guards are silently dropped, preventing cross-tab injection attacks.
