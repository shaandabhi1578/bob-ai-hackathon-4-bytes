# Source Code Structure (`src/`)

This directory contains the entire client-side implementation of **GridGuard AI**:

```
src/
├── components/
│   ├── auth/              # Dual-role authentication & modal (Admin vs. Field Employee)
│   ├── common/            # Toast alerts, real-time dispatch banners, sound alerts
│   ├── copilot/           # AI Copilot assistant panel and guided query dispatcher
│   ├── dashboard/         # Real Leaflet Geospatial Map, SCADA summary metrics, quick actions
│   ├── demo/              # Guided 21-step interactive hackathon walkthrough controller
│   ├── layout/            # Top SCADA telemetry header, role badge, navigation sidebar
│   └── views/             # Core functional panels:
│       ├── AssetHealthView.tsx         # Sensor telemetry diagnostics & thermal curves
│       ├── CrewManagementView.tsx      # Proximity routing & dedicated employee work order portal
│       ├── FailurePredictionView.tsx   # Interactive multi-sensor simulation sandbox
│       ├── IncidentHistoryView.tsx     # Past failure logs & post-mortem analysis
│       ├── OutageNotificationsView.tsx # Multi-channel FCM outage broadcast registry
│       ├── SettingsView.tsx            # Admin security, AI weights & employee roster
│       ├── WeatherView.tsx             # Live Open-Meteo sync & meteorological simulation
│       └── WorkAnalysisView.tsx        # Grid performance & predictive accuracy analytics
├── context/
│   ├── AuthContext.tsx    # Role-based access control, session persistence & employee roster
│   └── GridContext.tsx    # Central state management, multi-tab broadcast event bus & physics
├── services/
│   ├── firebaseMessagingService.ts # FCM broadcast client helper
│   ├── smsService.ts               # Direct priority phone numbers & contact registry
│   └── weatherService.ts           # Open-Meteo REST API integration & WMO risk decoder
├── types/
│   └── index.ts           # Strict TypeScript definitions for assets, crews, weather & notifications
├── utils/
│   └── riskEngine.ts      # Multi-factor failure risk formulas & Haversine proximity calculations
├── App.tsx                # Main application layout, view switching & tour mounting
└── main.tsx               # Application bootstrap & CSS import
```
