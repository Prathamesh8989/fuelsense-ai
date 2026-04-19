# 🚀 FuelSense-AI: Complete Project Documentation

FuelSense-AI is a premium, AI-powered full-stack web application for **fuel consumption optimization**. It uses machine learning to predict fuel usage, classify driver behavior, provide explainable insights, and visualize analytics. Designed for fleet managers, drivers, and logistics teams to reduce costs through data-driven recommendations.

**Core Flow**: Input trip parameters (speed, distance, acceleration pattern, idle time) → ML prediction (fuel liters, driver type, feature importance) → Interactive dashboard with charts, recommendations, and trip history.

## 🎯 Key Features
| Feature | Description |
|---------|-------------|
| **Real-time Predictions** | Instant ML fuel estimates with confidence scores |
| **Driver Classification** | K-Means clustering: Efficient/Smooth/Aggressive/Idle-heavy |
| **Explainable AI** | Random Forest feature importance (speed:32%, distance:28%, etc.) |
| **Analytics Dashboard** | Recharts visualizations: trends, bars, eco scores, cost tracking |
| **Trip Planner** | Map-based route simulation with what-if sliders |
| **Trip History** | MongoDB persistence, pagination, stats aggregation |
| **Premium UI** | Tailwind 'old-money' theme (golds, serif fonts), dark/light toggle |
| **Resilient** | Backend mocks if ML offline; full error handling |

**Status**: Active development. Core ML/backend/frontend integrated; vehicle module stubbed (see TODO.md).

## 🗺️ Architecture & File Structure
Monorepo with 3 services. Absolute paths relative to `c:/Users/Jitesh/Desktop/Prathamesh/jh/New folder/FuelSense-AI`.

```
FuelSense-AI/
├── READMEfull.md              # ← This file: Full docs
├── PROJECT_OVERVIEW.md        # Architecture deep dive
├── PROJECT_STRUCTURE.md       # File status (✅ complete, ⚠️ stubs)
├── TODO.md                    # Progress tracker (Dashboard fixes ✅)
├── package.json               # Root scripts (dev:backend/frontend/ml)
├── .gitignore                 # Node/Python/ML ignores
│
├── frontend/                  # React 18 + Vite + Tailwind + Recharts
│   ├── package.json           # Deps: react-router-dom, recharts, leaflet, framer-motion
│   ├── vite.config.js         # Dev server: localhost:5173
│   ├── tailwind.config.js     # Old-money theme
│   ├── src/
│   │   ├── App.jsx            # Router: Home/Analytics/Planner/Vehicle; BackgroundDecor
│   │   ├── main.jsx           # ReactDOM.render
│   │   ├── index.css          # Global styles/CSS vars
│   │   ├── hooks/useTheme.js  # Theme persistence
│   │   ├── components/        # Navbar, Dashboard (form+predict), Charts, Loader, PlannerMap, RecCard, ThemeToggle
│   │   ├── pages/             # Home, Analytics (history/charts), Planner (map/sliders), Vehicle (stub)
│   │   ├── services/api.js    # Axios to backend (/predict, /trips)
│   │   └── utils/helpers.js   # Utils (fmtCost, etc.)
│   └── index.html             # Vite entry
│
├── backend/                   # Node/Express/MongoDB API (localhost:5000)
│   ├── package.json           # Deps: express, mongoose, axios, cors
│   ├── server.js              # Startup: DB connect, app.listen(5000), health logs
│   ├── app.js                 # Express middleware (CORS/JSON/routes)
│   ├── config/db.js           # Mongoose connect
│   ├── controllers/           # tripController (POST/GET /trips), routeController
│   ├── models/                # Trip (schema: speed/dist/fuel/driverType/predFuel), Vehicle (stub)
│   ├── routes/                # tripRoutes, routeRoutes, vehicleRoutes
│   └── services/              # mlService (proxy to Python), routeService (optimization), fuelV2Service
│
└── ml-model/                  # Python/Flask ML microservice (localhost:8000)
    ├── app.py                 # Flask: /predict, /health, model preload
    ├── predict.py             # Core: RF predict + KMeans cluster + FI
    ├── train.py               # Train RF regressor + KMeans; save fuel_model.pkl
    ├── requirements.txt       # flask, scikit-learn, joblib, numpy/pandas
    ├── model/fuel_model.pkl   # Pickled bundle (RF, KMeans, scalers)
    └── fuel-v2/               # Variant models
```

## 🔄 End-to-End Workflow
1. **Frontend (Dashboard/Planner)**: User inputs {speed, distance, accelPattern, idleTime} → POST `/api/predict` or `/api/trips`.
2. **Backend (tripController)**: Validate → mlService proxy to Python → enrich → save Trip (Mongo) → return JSON.
3. **ML Service (predict.py)**:
   - Load `fuel_model.pkl` (RF regressor, KMeans n=4).
   - Preprocess: OneHot accel, StandardScaler nums.
   - `rf.predict(X) → predFuel`; `kmeans.predict(X) → driverType`.
   - `rf.feature_importances_ → {'speed':0.32, ...}`; tree variance → confidence.
   - Rule-based recs: e.g., 'Reduce idle' for Idle-heavy.
4. **Response**: Charts update (feature bars), RecCard shows insights, trips list refreshes.
5. **Analytics**: GET `/trips` → aggregate stats → Recharts viz.

**Error Handling**: ML down → backend mock; DB fail → log/exit; Frontend loaders/Suspense.

## 🧠 ML Deep Dive
- **Regression**: RandomForestRegressor(n=100) on synthetic/telematics data. R²~0.93, features weighted by importance.
- **Clustering**: KMeans(4): 0=Efficient,1=Smooth,2=Aggressive,3=Idle-heavy.
- **Training**: `python ml-model/train.py` → metrics/FI printed.
- **Endpoints**: POST /predict (JSON in/out), GET /feature-importance.

## 🚀 Setup & Run (Detailed)
### 1. ML Service
```bash
cd ml-model
pip install -r requirements.txt  # Or python -m venv env; source env/bin/activate; pip install...
python train.py                  # Train & save model.pkl
python app.py                    # → http://localhost:8000/health
```
Test: `curl -X POST http://localhost:8000/predict -H 'Content-Type:application/json' -d '{"speed":90,"distance":60,"accelerationPattern":"moderate","idleTime":8}'`

### 2. Backend
```bash
cd backend
npm install
# .env: MONGODB_URI=mongodb://localhost:27017/fuelsense, ML_SERVICE_URL=http://localhost:8000
npm run dev  # nodemon server.js → http://localhost:5000/health
```
Test: `curl -X POST http://localhost:5000/api/predict -H 'Content-Type:application/json' -d '{"speed":90,...}'`

### 3. Frontend
```bash
cd frontend
npm install
npm run dev  # → http://localhost:5173
```
Root scripts: `npm run dev:backend`, etc.

**Full Stack**: 3 terminals (ML→Backend→Frontend). No auth yet (add JWT/users next).

## 📡 Full API Docs
### Backend (`/api`)
- **POST /predict**: Instant ML (no DB).
- **POST /trips**: Save + predict.
- **GET /trips?page=1&limit=50**: History.
- **GET /trips/stats**: Aggregates (avg km/l, total cost).
- **POST /routes/optimize**: {origin,dest} → fuel-optimal path.

### ML (`http://localhost:8000`)
- **POST /predict**: ML payload → {predictedFuel, driverType, featureImportance, confidenceScore, recommendations}.
- **GET /feature-importance**: Global FI.

**Contracts**: See PROJECT_OVERVIEW.md.

## 🎨 UI Components Breakdown
- **App.jsx**: Router + theme provider + decor (glow/grid).
- **Dashboard.jsx**: Form → predict/save → results/charts (idleTime fix ✅).
- **Planner.jsx**: Map (Leaflet?) + sliders → routeService.
- **Charts.jsx**: Recharts (bar/line for FI/trends).
- **Navbar/ThemeToggle**: Responsive nav + localStorage theme.

## 📊 Progress & Next (from TODO.md/PROJECT_STRUCTURE.md)
- ✅ Dashboard/Planner integration.
- ⚠️ Stubs: Vehicle.jsx/model, vehicleRoutes.
- Next: Auth, real maps, deploy (Docker/Vercel), LSTM time-series ML.

## 🔧 Troubleshooting
- ML offline: Backend auto-mocks.
- DB: `mongosh` → use fuelsense; check Trips.
- CORS: Enabled everywhere.
- Logs: Server startup verbose.

---
*FuelSense-AI: Optimize Fuel, Maximize Efficiency. Generated from project analysis.*
