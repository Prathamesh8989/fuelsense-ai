# FuelSense AI - Project Overview

## 🎯 Project Summary
FuelSense AI is an AI-powered full-stack web application designed to optimize fuel consumption through machine learning predictions, driver behavior classification, and actionable insights. It provides an elegant dashboard for inputting trip data, getting instant ML predictions (fuel usage, eco scores, feature importance), analytics visualizations, and a trip planner.

**Core Value**: Helps users (fleet managers, drivers) reduce fuel costs with explainable AI recommendations like \"Maintain speeds below 90 km/h\".

**Status**: Under active development (see TODO.md for progress). Backend, frontend, and ML service implemented; integration and testing ongoing.

## 🗺️ Detailed Architecture & Component Breakdown

### Monorepo Structure & Responsibilities

```
FuelSense-AI (Current Working Dir)
├── .gitignore, package.json (root)     # Git ignores + potential shared Node deps
├── README.md                           # Full setup, API docs, features table
├── TODO.md                             # Task tracker (e.g., Dashboard.jsx bug fixes)

├── frontend/                           # Client-side SPA (Single Page App)
│   ├── index.html, vite.config.js      # Vite bundler entry + HMR dev server (npm run dev → localhost:5173)
│   ├── tailwind.config.js, postcss.config.js # Tailwind CSS styling (old-money theme: golds, serif fonts)
│   ├── package.json                    # React deps: react-router-dom, recharts, framer-motion, axios
│   └── src/
│       ├── main.jsx                    # React root render (<App /> to #root)
│       ├── App.jsx                     # Core app: React Router with lazy-loading Routes:
│       │                                - / (Home.jsx: landing/hero?)
│       │                                - /analytics (Analytics.jsx: charts/history)
│       │                                - /planner (Planner.jsx: map/simulator sliders)
│       │                                BackgroundDecor: subtle radial glows + grid SVG for premium feel
│       │                                Footer: monospace branding
│       ├── index.css                   # Global Tailwind + custom vars (--accent-gold, themes)
│       ├── hooks/useTheme.js           # Dark/light theme toggle (localStorage persist)
│       ├── components/
│       │   ├── Navbar.jsx              # Navigation + theme toggle
│       │   ├── Dashboard.jsx           # Main input form → predict button → results (recently fixed: idleTime payload, saveTrip)
│       │   ├── Charts.jsx              # Recharts viz (fuel trends, importance bars)
│       │   ├── Loader.jsx              # Suspense fallbacks (PageLoader)
│       │   ├── PlannerMap.jsx          # Interactive map? (route viz)
│       │   ├── RecommendationCard.jsx  # Insight cards (e.g., "Reduce idle time")
│       │   └── ThemeToggle.jsx         # Standalone toggle UI
│       ├── pages/                      # Routed views (lazy-loaded for perf)
│       ├── services/api.js             # Axios wrapper for backend calls (/predict, /trips)
│       └── utils/helpers.js            # fmtCost, clamping, etc. util fns

├── backend/                            # REST API server (npm run dev → localhost:5000)
│   ├── server.js                       # Startup: loads dotenv, connectDB(), app.listen(PORT)
│   │                                    Logs: "🚀 FuelSense Backend running", health check
│   │                                    Error handling: exits on DB fail
│   ├── app.js                          # Express app setup (likely middleware: cors, json, routes mount)
│   ├── config/db.js                    # Mongoose connect (async, retries?)
│   ├── controllers/
│   │   ├── tripController.js           # Logic for POST /trips (create+predict), GET /trips (paginated?)
│   │   └── routeController.js          # Route planning/optimization logic
│   ├── models/
│   │   ├── Trip.js                     # Mongoose schema: speed, distance, fuelUsed, driverType, predFuel, etc.
│   │   └── Vehicle.js                  # Fleet vehicles? (mileage, type)
│   ├── routes/
│   │   ├── tripRoutes.js               # /api/trips (router with controller binds)
│   │   └── routeRoutes.js              # /api/routes
│   ├── services/
│       ├── mlService.js                # Proxies requests to Python ML (axios/fetch to localhost:8000/predict)
│       └── routeService.js             # Computes optimal routes (distance matrix?)
│   └── package.json, package-lock.json # Deps: express, mongoose, dotenv, cors, axios

└── ml-model/                           # Standalone ML inference server (python app.py → localhost:8000)
    ├── app.py                          # Flask + CORS: /health (ok), /predict (POST json → ML), /feature-importance (global FI)
    │                                    Pre-loads model on startup
    ├── predict.py                       # Core ML: load_model() → RandomForest.predict + KMeans.labels_
    │                                    Inputs: speed, distance, mileage?, accel_pattern (onehot?), idle_time
    │                                    Outputs: predFuel, driverType, featureImportance dict, confidence
    ├── train.py                         # scikit-learn training: RF regressor (n_estimators=100), KMeans(n=4)
    │                                    Scales features, saves bundle (model + scaler + FI + clusterer) to fuel_model.pkl
    ├── requirements.txt                 # flask, scikit-learn, numpy, pandas, joblib
    └── model/fuel_model.pkl             # Pickled ML artifacts (load_model uses joblib.load)
```

### End-to-End Data Flow (Elaborated)
1. **Frontend Input**: User fills form in Dashboard.jsx (speed slider, distance input, accel dropdown: 'aggressive/moderate/smooth', idleTime mins).
2. **Frontend Service**: api.js POST to backend `/api/predict` (quick, no-save) or `/api/trip` (save to user's trips).
3. **Backend Handling**:
   - Controller extracts payload, calls mlService.js.
   - mlService forwards to ML /predict (axios post localhost:8000).
   - If ML down: fallback mock/rule-based (per README).
4. **ML Processing** (predict.py):
   - Preprocess: encode accel_pattern, scale features.
   - Regress: rf.predict(X) → predictedFuel liters.
   - Cluster: kmeans.predict(X_scaled) → driverType (0=Efficient,1=Smooth,2=Aggressive,3=Idle-heavy).
   - Explain: rf.feature_importances_ → dict {'speed':0.32, ...}, tree variance → confidence.
   - Recommendations: rule-based text from pred + type.
5. **Persist** (if /trip): Save enriched Trip doc to MongoDB (userId?, timestamp, raw inputs, ML outputs).
6. **Response Chain**: ML → backend → frontend → state update → Charts.jsx render (bar for importance, line for trends).

**Error Resilience**: ML offline → backend mock; DB fail → server crashlog + exit; Frontend Suspense + loaders.

### UI Components Deep Dive
- **App.jsx**: Orchestrates everything. BackgroundDecor adds premium glow/grid (pointer-events:none for perf).
- **Navbar/ThemeToggle**: Persists theme (CSS vars switched via class).
- **Dashboard.jsx** (recent fixes): Form validation, idleTime in payload, SAVE button (api.saveTrip → trips list refresh).
- **Charts.jsx**: Recharts <BarChart>, <LineChart> for FI, history.
- **PlannerMap.jsx**: Likely Leaflet/React-Leaflet for route viz (polyline from routeService).


### Key Features (from README.md)
- **Dashboard**: Instant predictions + eco score.
- **Analytics**: Trip history, trends, clusters, costs.
- **Planner/Simulator**: What-if sliders, maps.
- **Explainable AI**: SHAP-like feature importance, confidence scores.
- **UI/UX**: Old-money aesthetic (Cinzel/Playfair fonts, gold accents), dark/light theme.

## 🧠 ML Pipeline: Algorithms, Training & Inference Deep Dive

### Models & Training (train.py)
**1. Fuel Consumption Regression**
- **Algo**: `RandomForestRegressor(n_estimators=100, random_state=42)` – ensemble of decision trees for robust non-linear pred.
- **Features** (5 total): `speed (km/h)`, `distance (km)`, `acceleration_pattern` (categorical: encoded as 0=aggressive/1=moderate/2=smooth), `idle_time (mins)`, `mileage?` (vehicle eff? inferred from structure).
- **Target**: `fuel_used (liters)` – trained on synthetic/real telematics data.
- **Preprocessing**: `StandardScaler()` on numerics; `OneHotEncoder` on accel_pattern.
- **Metrics**: R² ≈0.93 (high, explains 93% variance); MAE low for liters.
- **Output**: Single value `predictedFuel: 5.18` liters.

**2. Driver Behavior Clustering**
- **Algo**: `KMeans(n_clusters=4, random_state=42)` – unsupervised grouping by driving style.
- **Same Features** (scaled): Groups into behavioral clusters.
- **Labels**: 
  | Cluster | Driver Type | Characteristics |
  |---------|-------------|-----------------|
  | 0 | Efficient Driver | Low speed variance, optimal accel, minimal idle |
  | 1 | Smooth Driver | Steady speeds, gentle accel |
  | 2 | Aggressive Driver | High speeds, hard accel |
  | 3 | Idle-heavy Driver | Long stops/idle |
- **Persistence**: Full bundle (rf, kmeans, scalers, encoders, feature_importance) → `joblib.dump` to `model/fuel_model.pkl`.

**Training Command**: `python ml-model/train.py` – generates model, prints metrics/FI.

### Inference (predict.py + app.py)
- **load_model()**: `joblib.load('model/fuel_model.pkl')` → returns dict with all artifacts (pre-loaded at Flask startup).
- **predict()**:
  ```python pseudocode
  X = preprocess([speed, dist, accel_encoded, idle])
  pred_fuel = rf.predict(X)[0]
  cluster = kmeans.predict(X)[0]
  fi = rf.feature_importances_
  conf = 1 - pred_std(rf.tree_preds)  # tree variance
  driver_type = ['Efficient','Smooth','Aggressive','Idle-heavy'][cluster]
  recs = generate_rules(pred_fuel, cluster)  # e.g. "Reduce speed variance"
  return {'predictedFuel': pred_fuel, 'driverType': driver_type, 'featureImportance': dict(zip(features,fi)), ...}
  ```
- **Flask Endpoints**:
  | Method | Path | Does What |
  |--------|------|-----------|
  | POST | /predict | Full pipeline on JSON payload → ML response (400 if missing fields) |
  | GET | /feature-importance | Global `rf.feature_importances_` dict (model-wide) |
  | GET | /health | `{'status':'ok'}` ping |

**Production Notes**: Model retrain on new data; scale with joblib parallelism; containerize for deploy.

## 🚀 Setup & Run (Summary from README)
1. **ML**: `cd ml-model && pip install -r requirements.txt && python train.py && python app.py` (localhost:8000).
2. **Backend**: `cd backend && npm install && npm run dev` (localhost:5000; set .env: MONGODB_URI, ML_SERVICE_URL).
3. **Frontend**: `cd frontend && npm install && npm run dev` (localhost:5173).

**Env Vars**:
- Backend: MONGODB_URI, ML_SERVICE_URL=http://localhost:8000.
- Frontend: VITE_API_URL=http://localhost:5000/api.

## 🔌 Full API Surface & Contracts

### Backend API (localhost:5000/api – Express routes)
**Trip Management** (/api/trips – tripRoutes.js → tripController.js)
| Method | Path | Payload | Does | Response |
|--------|------|---------|------|----------|
| POST | /trips | `{speed, distance, fuelUsed, accelPattern, idleTime}` | Save Trip to MongoDB + call ML for enrichment → return full pred | `{success:true, trip: {_id, ...ML fields}, prediction:{...}}` |
| GET | /trips | `?page=1&limit=50` (query) | Fetch paginated user trips (last 50 by default) | `[{_id, timestamp, speed, ..., driverType, predFuel}]` |
| GET | /trips/stats | None | Aggregates: avg fuel/km, total cost, driverType distro | `{avgEfficiency: 12.4, totalTrips:42, ...}` |

**ML Proxy** (/api/predict – no-save, instant)
| POST | /predict | Same as /trips | Forward to ML service → direct pass-thru (mock if down) | Same as ML /predict |

**Route Optimization** (/api/routes – routeRoutes.js → routeController/routeService)
| POST | /routes/optimize | `{origin, dest, vehicleId}` | Compute fuel-optimal path (via routeService: dist matrix + ML est) | `{route: [coords], estFuel:4.2, savings:15%}` |

**Health/Info**
| GET | /health | None | Backend + DB status | `{'status':'ok', dbConnected:true}` |

### ML Microservice API (localhost:8000)
| POST | /predict | `{speed:90, distance:60, mileage:12, accelerationPattern:'moderate', idleTime:8}` | Full ML (validate required fields) | `{predictedFuel:5.18, driverType:'Smooth Driver', featureImportance:{speed:0.32,...}, confidenceScore:0.874, recommendations:['Maintain <90kmh']}` |
| GET | /feature-importance | None | Model-global importances | `{featureImportance:{speed:0.32, distance:0.28, ...}}` |
| GET | /health | None | Service ready? | `{'status':'ok', 'service':'FuelSense ML'}` |

**Notes**: CORS enabled everywhere; JSON only; Backend proxies ML for single frontend origin.

## 📈 Current Progress (from TODO.md)
- Dashboard.jsx fixes: Added idleTime, validation, SAVE button, UX polish (✅ edits done).
- Pending: Testing, completion.

## 📋 Next Steps Suggestions
- Integrate all services end-to-end.
- Add auth/users.
- Deploy (Docker? Vercel/Netlify frontend, Railway backend, Render ML).
- Enhance: Real maps (Leaflet/Google), more ML (time-series LSTM).

This overview is auto-generated from project files/structure as of now. For full setup/API, see README.md.

---
*FuelSense AI: Data Meets the Road – Optimized.*

