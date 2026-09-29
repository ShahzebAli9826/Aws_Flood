<div align="center">

# AEGIS: AI-Powered Multimodal Satellite Flood Detection & Autonomous Disaster Response System
</div>

<b>Aegis is an autonomous conversational agent that bridges large language models with real time physical world infrastructure data. Powered by Google Gemini 2.5 Flash and the MirEye Earth API, Aegis handles open ended conversational tasks while dynamically routing location sensitive queries to verified spatial, hydrological and environmental hazard tools across the United States.
  
Emergency managers, field responders and residents often lack instant verified physical world context during extreme weather events, forcing them to manually consult disjointed federal GIS portals. By fusing dual encoder satellite Earth observation (SAR + Optical) with Mireye's sub meter physical intelligence layer, continuous Topographic Wetness Index hydrology, and an in flight human in the loop decision engine, Aegis identifies imminent flash flood zones, dynamically routes evacuees away from submersed corridors, and empowers incident commanders in real time. Aegis bridges conversational AI with real time geospatial ground telemetry i.e. users ask questions about any US city, county or landmark in plain English and Aegis automatically resolves place names into coordinates, queries MirEye's sub meter Earth observation API and delivers actionable safety insights backed by authoritative federal citations (USGS, FEMA, NOAA).</b>
</p>

</div>

---

##  Executive Overview

During major flood disasters, emergency response operations suffer from two fatal blind spots:

1. The "Flat Map" Blind Spot: Standard satellite segmentation only tells you where surface water was when the satellite passed overhead. It cannot tell you ground elevation, soil saturation, building heights, population counts or which dry roads will submerge in the next 6 hours.
2. The "Naive Routing" Blind Spot: Evacuation navigation systems route evacuees based on shortest straight line distance, leading civilians directly into low elevation terrain depressions and flooded road basins.

Aegis bridges this gap by injecting physical telemetry from the Mireye API (USGS 3DEP DEM elevation, slope, FEMA 100/500 yr floodplains, USGS NHD hydrography, and Overture building footprints) into every routing, triage, and dispatch decision.

---

##  Deep Learning Architecture & Pipeline

Aegis implements a custom **Dual-Encoder Multimodal SegFormer architecture** specifically optimized for high-precision flood boundary delineation in challenging weather and all-terrain scenarios.

![AEGIS Deep Learning Architecture & Pipeline](assets/architecture_pipeline.png)

### System Architecture

```
 [Satellite SAR + Optical] ──► [NDWI Filter] ──► [Clean GeoJSON Inundation Mask]
                                                        │
                                                        ▼
                                            [Mireye Physical API]
                                    (DEM Elev, Slope, Floodplains, POIs)
                                                        │
                         ┌──────────────────────────────┴──────────────────────────────┐
                         ▼                                                             ▼
         [Predictive TWI Hydrology Layer]                            [DBSCAN Population Clustering]
              Flash-Flood Pooling Basins                                      │
                         │                                                             ▼
                         └──────────────────────────────┬──────────────────────────────┘
                                                        ▼
                                    [Elevation-Weighted Road Graph]
                                      (NetworkX / Dijkstra Routing)
                                                        │
                                                        ▼
                                       [Multi Criteria Triage Engine]
                                   Priority = Pop × (1 + Exp) / Elev_Safety
                                                        │
                                                        ▼
                                   [In Flight Feedback Interceptor]
                                (LangGraph: SHELTER_FULL / ROAD_CLOSED)
                                                        │
                         ┌──────────────────────────────┴──────────────────────────────┐
                         ▼                                                             ▼
         [Incident Commander Dashboard & SITREP]                      [Geo Targeted Citizen SMS]

```
 **Core Innovation: What Aegis Solves**

<img width="331" height="302" alt="image" src="https://github.com/user-attachments/assets/675f372e-c163-436f-878d-a582e7b2e31a" />   


## Empirical Validation: Does Mireye Context Matter?

To prove that the Mireye coordinate round-trip performs critical life-safety work rather than visual decoration, Aegis runs an empirical benchmark comparing a **Naive Straight-Line Strategy** against the **Mireye Context-Aware Strategy** across 33 real disaster clusters.

[SUMMARY RESULTS] 
  - Total Evaluated Clusters    : 33
  - Diverged Recommendations    : 2 clusters (6.1%)
  - Avg Extra Distance Accepted : +1.15 km (Safety Detour)
  - Sensitivity Projection      : 9.1% (Widened TWI Variance)

Context aware routing altered the primary shelter recommendation in 6.1% of disaster clusters, accepting an average of +1.15 km of travel to steer evacuees away from high risk, flood compromised access corridors.


## Project Structure

```
Mireye/
├── api/                                    # Mireye Live API Client & Data Models
│   ├── client.py                           # Batch queries, retries, exponential backoff
│   └── models.py                           # Pydantic schemas (FloodPolygon, LatLng, PhysicalContext)
│
├── pipeline/                               # Hydrology & Inundation Pipelines
│   ├── predictive_twi.py                   # TWI computation (D8 flow accumulation & slope)
│   ├── flood_prone.py                      # Multi-factor Flood Susceptibility Index (FSI)
│   ├── batch_predictive_hazard.py          # Multi-county live batch execution runner
│   ├── physical_data_hazard_engine.py      # Ground-truth processor for physical_data.json
│   └── flood_data.py                       # Polygon loader & GeoJSON utilities
│
├── decision_engine/                        # Autonomous Triage & Interceptor
│   ├── triage.py                           # Priority ranking & shelter capacity allocation
│   ├── interceptor.py                      # LangGraph in-flight feedback & course correction
│   └── mireye_value_experiment.py          # Day 11 empirical validation experiment
│
├── shelters/                               # Safe Shelter Discovery
│   └── finder.py                           # Multi-source shelter finder & elevation ranker
│
├── routing/                                # Road Graph & Route Engine
│   ├── elevation_router.py                 # Elevation-penalized Dijkstra routing
│   └── network_builder.py                  # NetworkX road network graph constructor
│
├── visualization/                          # Tactical Disaster Maps
│   └── map_plotter.py                      # 100% watermark-free Folium map visualizer with HUD
│
├── chatbot/                                # Conversational Spatial Agent
│   └── agent.py                            # Gemini 2.5 Flash agent with MirEye physical tools & geocoding
│
├── data/                                   # Input Flood Polygons
│   └── model_flood_polygons.json           # 24 benchmark flooded county coordinates
│
├── output/                                 # Generated Datasets and Maps
│   ├── all_counties_predictive_hazard.json # Consolidated 24 county predictive hazard report
│   ├── physical_data_predictive_hazard.json# 11 region ground truth analysis
│   ├── mireye_value_comparison.json        # Empirical validation dataset
│   ├── day11_empirical_validation_report.md# Validation markdown report
│   ├── twi_risk_surface.json               # Cluster TWI surface matrices
│   ├── evacuation_plans.json               # Cluster evacuation routes & shelters
│   └── *.html                              # Interactive Folium tactical disaster maps
│
├── main.py                                 # Main Unified Command-Line Interface (CLI)
├── run_aegis_master.py                     # Master end-to-end execution script
├── requirements.txt                        # Python dependencies
├──  README.md                               # Project documentation

```

---

### 🚀 Installation & Full Quickstart Guide

#### 1. Clone the Repository
```bash
git clone https://github.com/RajatRawal-06/Aegis.git
cd Aegis
```

---

#### 2. Backend Setup (`dell-flood-backend`)

1. **Navigate to backend folder:**
   ```bash
   cd dell-flood-backend
   ```
2. **Create & activate a virtual environment:**
   ```bash
   python -m venv venv
   # On Windows (PowerShell):
   .\venv\Scripts\activate
   # On Linux / macOS:
   source venv/bin/activate
   ```
3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Configure Environment Variables (`.env`):**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *Fill in optional API keys (OpenAI, Gemini, Sentinel Hub, Twilio, Mapbox) as needed.*

5. **Start the FastAPI Backend Server:**
   ```bash
   python main.py
   # Or directly via uvicorn (binding to all network interfaces for mobile access):
   python -m uvicorn main:app --host 0.0.0.0 --port 8000
   ```
   - **Backend API:** `http://localhost:8000` or `http://<YOUR_LOCAL_IP>:8000`
   - **Interactive API Docs:** `http://localhost:8000/docs`

---

#### 3. Frontend Web Setup (`dell-flood-app`)

1. **Open a new terminal & navigate to app folder:**
   ```bash
   cd dell-flood-app
   ```
2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```
3. **Start on Website (React Native Web):**
   ```bash
   npm run web
   # Or:
   npx expo start --web
   ```
   - Access the live web app in browser at: `http://localhost:8081`

---

#### 4. Running on Mobile Phone using Expo Go 📱

To run the mobile app on an actual Android or iOS device using **Expo Go**:

1. **Connect to Same Wi-Fi:** Ensure your phone and development computer are connected to the **same local Wi-Fi network**.
2. **Find Local IP Address:**
   - **Windows:** Run `ipconfig` in CMD/PowerShell (look for IPv4 Address under Wireless LAN/Ethernet, e.g., `192.168.1.7`).
   - **macOS / Linux:** Run `ifconfig` or `ip a` (e.g., `192.168.1.7`).
3. **Configure API Endpoint:**
   - By default, `dell-flood-app/src/services/api.ts` targets `http://192.168.1.7:8000/api`.
   - If your IP is different, update `DEFAULT_API_URL` in `src/services/api.ts` or change it dynamically inside the **App Settings Panel** within the app UI.
4. **Start Expo LAN Server:**
   ```bash
   npx expo start --lan
   ```
5. **Open in Expo Go:**
   - **Android:** Open the **Expo Go** app, tap **Scan QR Code**, and scan the QR code printed in your terminal (or type `exp://<YOUR_LOCAL_IP>:8081`).
   - **iOS:** Open the default **Camera App**, scan the QR code, and open in Expo Go.

---

#### 5. Building Standalone Android APK (EAS Build)

To build a standalone installable `.apk` file for Android:

1. Install EAS CLI (if not installed):
   ```bash
   npm install -g eas-cli
   ```
2. Run EAS Preview Build:
   ```bash
   npx eas-cli build --platform android --profile preview
   ```
3. Once completed on Expo Cloud, download and install the resulting `.apk` file directly on any Android phone.

---

### 🛡️ Environment & Git Security Configuration
- `.env` files contain sensitive API credentials and are automatically ignored via `.gitignore`.
- Reference templates are provided in `.env.example` in both root and `dell-flood-backend/`.
- Heavy ML weights (`*.pth`, `*.onnx`) and build artifacts (`node_modules/`, `dist/`, `.expo/`) are excluded from Git history.

---

CLI Reference

Aegis provides a powerful, modular CLI via `main.py`:

| Command | Description | Example |
| :--- | :--- | :--- |
| `python main.py run` | Ingest flood polygon & extract Mireye physical context | `python main.py run -p philadelphia_county_pa -n 10` |
| `python main.py evacuate` | Run DBSCAN clustering & elevation-weighted road routing | `python main.py evacuate -p houston_harvey` |
| `python main.py predict` | Compute TWI hydrology & flood susceptibility models | `python main.py predict -p charleston_county_sc -n 25` |
| `python main.py predict -f` | Ingest & analyze comprehensive `physical_data.json` | `python main.py predict -f physical_data.json` |
| `python main.py validate` | Run Day 11 empirical validation experiment | `python main.py validate` |
| `python main.py chat` | Launch conversational Gemini 2.5 Flash agent with MirEye tools | `python main.py chat -m "Flood risk in Charleston, SC"` |
| `python main.py usage` | Check live Mireye API credit balance & limits | `python main.py usage` |
| `python main.py catalog` | View all supported Mireye physical attributes | `python main.py catalog` |

---

## Tactical Disaster Map Visualizations

Aegis renders **100% watermark-free, high-contrast Folium HTML maps** built for emergency management operations. Every map includes an interactive Disaster HUD legend and multi-layer toggles:

*  **Active Inundation Footprint:** High contrast danger polygon extracted via dual encoder SAR/Optical satellite imagery.
*  **Critical Runoff Nodes:** Glowing magenta markers identifying concave terrain basins with high TWI scores prone to flash pooling.
*  **Affected Neighborhood Centroids:** High contrast targets displaying population estimates and building counts from DBSCAN clustering.
*  **Safe Emergency Shelters:** Emerald pins indicating safe facilities tagged with ground DEM elevation.
*  **Elevation-Weighted Evacuation Paths:** Cyan polyline corridors steering clear of flood prone road segments.

> Maps are automatically generated . Open any map directly in a web browser to inspect interactive popups with DEM heights, slope angles, FEMA status, and soil drainage properties.

## Honest Caveats & Open Items

In the interest of full technical integrity and transparency:
1. **DEM Smoothing Resolution:** In synthetic raster tests, continuous DEM smoothing compressed TWI scores into a narrow band (mean 6.8–7.3). When evaluated against real point level ground truth in `physical_data.json`, TWI scores showed realistic variance ranging from 7.16 to 12.89.
2. **Road-Risk Field Status:** Road risk scores currently use a synthetic topographic hazard proxy until Mireye's native road exposure attributes are enabled.
3. **Shelter Verification:** Athens County, Ohio utilizes verified, real world community shelters (Athens Community Center & Athens High School), other regions utilize geographically distributed benchmark facilities that should be verified with local emergency management agencies prior to deployment.



## 📄 License

This project is licensed under the **MIT License**. Built with physical intelligence powered by **Mireye**.
