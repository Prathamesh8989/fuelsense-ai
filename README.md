# 🚀 FuelSense AI — Intelligent Fuel Consumption Optimizer

> A premium AI-powered full-stack application for predicting fuel consumption, classifying driving behaviour, and delivering explainable ML insights.

---

## ✨ Features

| Module | What it does |
|---|---|
| **Dashboard** | Input trip data → get instant ML prediction + eco score + feature importance |
| **Analytics** | Visualise trip history, trends, driver-type clusters, cost tracking |
| **Simulator** | Real-time what-if sliders with animated live predictions |
| **ML Service** | Random Forest regression + K-Means clustering, Python/Flask |
| **Explainable AI** | Feature importance charts, confidence scores, text insight labels |
| **Old Money UI** | Dark/light theme with Cinzel/Playfair fonts, gold accents |

---

## 🗂 Project Structure

```
FuelSense-AI/
├── frontend/          # React + Tailwind + Recharts
├── backend/           # Node.js + Express + Mongoose
├── ml-model/          # Python Flask ML microservice
└── README.md
```

---

## ⚙️ Tech Stack

- **Frontend**: React 18, Tailwind CSS, Recharts, Framer Motion, Vite
- **Backend**: Node.js, Express, Mongoose (MongoDB)
- **Database**: MongoDB
- **ML Service**: Python, Flask, scikit-learn, NumPy, Pandas

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.9
- MongoDB running locally (or provide MONGODB_URI)

---

### 1. Install & Run ML Service

```bash
cd ml-model

# Install Python dependencies
pip install -r requirements.txt

# Train the model (generates model/fuel_model.pkl)
python train.py

# Start ML API on port 8000
python app.py
```

ML service will be available at: `http://localhost:8000`

---

### 2. Install & Run Backend

```bash
cd backend

# Install dependencies
npm install

# Copy env file and configure
cp .env.example .env
# Edit .env: set MONGODB_URI and ML_SERVICE_URL

# Start backend (port 5000)
npm run dev
```

Backend API available at: `http://localhost:5000`

---

### 3. Install & Run Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (port 5173)
npm run dev
```

Frontend available at: `http://localhost:5173`

---

## 📡 API Reference

### Backend (Express)

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/predict` | Get ML prediction (no save) |
| `POST` | `/api/trip` | Save trip + get ML prediction |
| `GET` | `/api/trips` | Fetch trip history (last 50) |
| `GET` | `/api/trips/stats` | Aggregated statistics |

#### POST /api/predict — Request Body
```json
{
  "speed": 90,
  "distance": 60,
  "fuelUsed": 5.2,
  "accelerationPattern": "moderate",
  "idleTime": 8
}
```

#### Response
```json
{
  "success": true,
  "prediction": {
    "predictedFuel": 5.18,
    "driverType": "Smooth Driver",
    "featureImportance": {
      "speed": 0.32,
      "distance": 0.28,
      "accel_encoded": 0.22,
      "idle_time": 0.18
    },
    "confidenceScore": 0.874,
    "recommendations": ["Maintain speeds below 90 km/h for best efficiency"]
  }
}
```

---

### ML Service (Flask)

| Method | Route | Description |
|---|---|---|
| `POST` | `/predict` | Full ML prediction |
| `GET` | `/feature-importance` | Global feature importance |
| `GET` | `/health` | Health check |

---

## 🧠 Machine Learning Details

### Models

**1. Regression — Fuel Consumption**
- Algorithm: `RandomForestRegressor` (100 trees)
- Features: speed, distance, acceleration pattern (encoded), idle time
- Target: fuel used (litres)
- Metric: R² ≈ 0.93+

**2. Clustering — Driver Classification**
- Algorithm: `KMeans` (4 clusters)
- Classes: `Efficient Driver`, `Smooth Driver`, `Aggressive Driver`, `Idle-heavy Driver`
- Scaled with `StandardScaler`

### Explainability
- **Feature importance** extracted directly from Random Forest `feature_importances_`
- **Confidence score** calculated from standard deviation across tree predictions
- **Text insights** auto-generated from prediction context

---

## 🎨 UI Design

### Dark Mode (default)
- Background: deep forest greens (`#0a1a0f`)
- Accents: antique gold (`#c9993a`)
- Typography: Cinzel (display), Playfair Display (headings), Cormorant Garamond (body)

### Light Mode
- Background: ivory/parchment tones
- Elegant minimal aesthetic

---

## 🔧 Environment Variables

### Backend `.env`
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fuelsense
ML_SERVICE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env` (optional)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📦 Deployment Notes

- ML service and backend should both be running before using the frontend
- If ML service is offline, backend will fall back to a rule-based mock prediction
- For production: use `npm run build` in frontend and serve with nginx/Vercel

---

## 🏗 Development Workflow (Claude → Cursor)

1. Use this codebase as the foundation
2. Open in **Cursor** for AI-assisted refinements
3. Run `python train.py` to generate fresh model
4. Start all 3 services and test end-to-end

---

*Built with ♦ FuelSense AI — Where Data Meets the Road*
