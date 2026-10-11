<div align="center">

# AEGIS: AI-Powered Multimodal Satellite Flood Detection & Autonomous Disaster Response System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat&logo=fastapi)](https://fastapi.tiangolo.com)
[![Expo](https://img.shields.io/badge/Expo-v57.0-000020.svg?style=flat&logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB.svg?style=flat&logo=react)](https://reactnative.dev)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?style=flat&logo=python)](https://python.org)
[![MCP](https://img.shields.io/badge/MCP-Formal%20Server-8A2BE2.svg?style=flat)](https://modelcontextprotocol.io)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

**Aegis** is an autonomous disaster response platform bridging satellite Earth observation, spatiotemporal deep learning, and multi-agent coordination with real-world physical infrastructure data. Powered by dual-encoder SAR + Optical fusion, 4D ConvGRU depth nowcasting, formal Model Context Protocol (MCP) tools, and an autonomous 6-agent LangGraph pipeline, Aegis detects imminent flash flood zones, dynamically routes evacuees away from submersed corridors, and empowers incident commanders and citizens in real time.

---

## ⚡ Key Capabilities

- **🛰️ Multimodal Dual-Encoder Segmentation:** Fuses all-weather Sentinel-1 SAR backscatter with Sentinel-2 multispectral imagery via a custom SegFormer MiT-B2 architecture, outputting clean georeferenced inundation masks even during severe cloud cover.
- **⏱️ 4D Spatiotemporal Depth Nowcasting:** Multi-scale 3-level ConvGRU network predicting flood depth progression, water flow velocity vectors, and peak inundation timestamps across upcoming 1 to 6-hour forecast horizons.
- **🤖 Autonomous 6-Agent LangGraph Pipeline:** Orchestrates ingestion, segmentation, predictive hydrology, DBSCAN population clustering, elevation-penalized Dijkstra routing, and advisory synthesis with live audit logs and human-in-the-loop control.
- **🔌 Formal Model Context Protocol (MCP) Server:** Exposes standardized AI tools (`fetch_radar_data`, `run_segformer_detection`, `run_nowcast_simulation`, `calculate_evacuation_routes`, `trigger_emergency_alert`) directly for LLM assistants at `/api/mcp/tools`.
- **📢 Automated Multi-Channel Emergency Dispatch:** Automated Twilio Voice call and SMS broadcasts with localized English and Hindi speech synthesis for field teams and impacted communities.
- **📱 Real-Time Citizen Ground Reporting:** Offline-first ground report logging with local AsyncStorage queuing, automated categorization, and real-time synchronization with emergency log feeds.
- **🗺️ Cross-Platform Mobile & Web Interface:** High-contrast tactical UI built on Expo / React Native featuring instant location presets (Patna, Houston, Charleston, Athens County), live radar layers, and safe shelter navigators.

---

## 🏗️ System Architecture

```
                       [Sentinel-1 SAR + Sentinel-2 Optical]
                                         │
                                         ▼
                      [Dual-Encoder SegFormer MiT-B2 Fusion]
                                         │
                                         ▼
                   [Clean GeoJSON Inundation & Hydro Mask]
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
    [4D Multi-Scale ConvGRU]                         [Predictive TWI Hydrology]
    Depth & Velocity Nowcasting                      Topographic Wetness Index
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
                           [DBSCAN Population Clustering]
                           High-Density Risk Neighborhoods
                                         │
                                         ▼
                          [Elevation-Penalized Road Graph]
                            Dijkstra Evacuation Corridors
                                         │
                                         ▼
                         [Autonomous 6-Agent LangGraph]
                     (Ingest ➔ Seg ➔ Hydro ➔ Triage ➔ Route ➔ Alert)
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
    [MCP Server Tools API]                         [Automated Twilio Dispatch]
    FastAPI /api/mcp/tools                         Bilingual Voice & SMS Alerts
                 │                                               │
                 └───────────────────────┬───────────────────────┘
                                         ▼
                         [Aegis Tactical Expo Frontend]
                           Web & Native Mobile Interface
```

---

## 📁 Repository Structure

```
Aegis/
├── dell-flood-backend/                     # FastAPI Backend & AI Pipeline
│   ├── app/
│   │   ├── aegis/                          # Core Hydrology, Routing & Detection
│   │   │   ├── api/                        # MirEye & Elevation API Clients
│   │   │   ├── decision_engine/            # Triage & In-flight feedback interceptors
│   │   │   ├── pipeline/                   # TWI hydrology & DBSCAN clustering
│   │   │   ├── routing/                    # Elevation-penalized Dijkstra route engine
│   │   │   └── shelters/                   # Safe shelter discovery & ranking
│   │   ├── agent/                          # Autonomous 6-Agent LangGraph System
│   │   │   ├── graph.py                    # LangGraph workflow definition
│   │   │   └── tools.py                    # Dispatch, SMS, and Twilio voice call tools
│   │   ├── api/                            # REST Endpoints
│   │   │   └── endpoints.py                # Pipeline, nowcast, alerts, complaints
│   │   ├── mcp/                            # Formal Model Context Protocol (MCP)
│   │   │   └── aegis_mcp_server.py         # FastMCP server tool definitions
│   │   └── ml/                             # Deep Learning Models
│   │       ├── segformer_inference.py      # Dual-encoder SAR+Optical segmentation
│   │       └── urnn_nowcaster.py           # 4D ConvGRU spatiotemporal nowcasting
│   ├── main.py                             # Backend entrypoint (port 8000)
│   ├── requirements.txt                    # Python dependencies
│   └── .env.example                        # Backend environment variable template
│
├── dell-flood-app/                         # Cross-Platform React Native (Expo) App
│   ├── src/
│   │   ├── components/                     # Tactical UI Components
│   │   │   ├── NowcastPanel.tsx            # 4D Nowcasting player & location presets
│   │   │   ├── ReportForm.tsx              # Citizen ground issue reporting form
│   │   │   ├── SatelliteDetectionView.tsx  # Dual-encoder satellite radar inspection
│   │   │   ├── EvacuationRoutesView.tsx    # Interactive evacuation corridors
│   │   │   ├── AgenticPipelineView.tsx     # Live agent execution logs & SITREP
│   │   │   └── SettingsModal.tsx           # Bilingual toggle & API endpoint config
│   │   ├── services/
│   │   │   └── api.ts                      # Backend REST client & offline sync queue
│   │   ├── types/                          # TypeScript schemas
│   │   └── utils/
│   │       └── i18n.ts                     # Bilingual (English & Hindi) dictionary
│   ├── App.tsx                             # Application root & dashboard layout
│   ├── package.json                        # Node dependencies & Expo scripts
│   └── app.json                            # Expo app configuration
│
└── README.md                               # Project documentation
```

---

## 🚀 Quickstart Guide

### 1. Clone the Repository

```bash
git clone https://github.com/ShahzebAli9826/Aws_Flood.git
cd Aws_Flood
```

---

### 2. Backend Setup (`dell-flood-backend`)

1. **Navigate to the backend directory:**
   ```bash
   cd dell-flood-backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Windows (PowerShell):
   python -m venv .venv
   .\.venv\Scripts\activate

   # Linux / macOS:
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   *Add your credentials for Google Gemini, Twilio, Sentinel Hub, and Mapbox as needed.*

5. **Start the FastAPI backend server:**
   ```bash
   python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   - **Backend API:** [http://localhost:8000](http://localhost:8000)
   - **Interactive API Docs (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
   - **MCP Tool Catalog:** [http://localhost:8000/api/mcp/tools](http://localhost:8000/api/mcp/tools)

---

### 3. Frontend Setup (`dell-flood-app`)

1. **Open a new terminal and navigate to the app directory:**
   ```bash
   cd dell-flood-app
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Launch the web application:**
   ```bash
   npm run web
   # Or:
   npx expo start --web
   ```
   - Access the live app in your browser at: [http://localhost:8081](http://localhost:8081)

4. **Launch on mobile (Expo Go):**
   ```bash
   npx expo start --lan
   ```
   - Scan the terminal QR code with the **Expo Go** app on Android or the default **Camera** app on iOS.

---

## 🔬 Core Components & Innovations

### 1. Dual-Encoder SegFormer SAR + Optical Fusion
Standard optical segmentation fails during monsoon downpours and thick cloud cover. Aegis fuses:
- **Sentinel-1 SAR C-Band VV/VH backscatter** (penetrates dense clouds and rain)
- **Sentinel-2 Multispectral Optical bands** (NIR, Red, Green for NDWI confirmation)
- **Elevation Normalization** via 3DEP DEM slope filtering to eliminate false water specular returns from steep radar-shadowed mountains.

### 2. 4D ConvGRU Spatiotemporal Nowcasting
Rather than displaying a static historical footprint, Aegis propagates water volume forward through time using a 3-scale ConvGRU architecture:
- Computes flow velocity vectors $(\mathbf{u}, \mathbf{v})$ based on local terrain slope and surface friction.
- Forecasts flood depth $d(x, y, t)$ across $t \in [1\text{h}, 6\text{h}]$.
- Automatically pinpoints projected peak inundation times and warning levels.

### 3. Autonomous 6-Agent LangGraph Pipeline
A stateful multi-agent system executing sequentially with fallback protection:
1. **Ingestion Agent:** Validates satellite raster availability and hydro telemetry.
2. **Segmentation Agent:** Executes SegFormer inference to delineate active flood masks.
3. **Hydrology Agent:** Calculates Topographic Wetness Index (TWI) pooling basins.
4. **Cluster & Triage Agent:** Runs population density clustering to prioritize high-risk communities.
5. **Routing Agent:** Generates elevation-weighted Dijkstra paths to the nearest certified safe shelters.
6. **Public Advisory Agent:** Synthesizes actionable situational reports (SITREP) and dispatches localized alerts.

### 4. Bilingual Support (English & Hindi)
Designed for global deployments including high-risk flood corridors in Northern and Eastern India (e.g., Patna, Bihar). The interface, audio alerts, and automated Twilio voice notifications seamlessly toggle between English and Hindi.

---

## 🛡️ Security & Privacy
- Sensitive keys (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `GEMINI_API_KEY`) are kept strictly inside `.env` files and excluded from source control.
- Citizen ground reports are handled locally and can operate in an offline-cached queue mode before synchronization.

---

## 📄 License
This project is licensed under the **MIT License**.
