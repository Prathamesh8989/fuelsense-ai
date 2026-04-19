"""
FuelSense AI – Training Script (Realistic World Model)

Key design decisions vs previous version:
  1. Multi-source noise — road gradient, AC load, tyre wear, traffic,
     altitude, fuel quality all add independent variance.
  2. Non-linear interactions — speed × load, idle × AC, gradient × accel
     create cross-terms the GBR must discover, not memorise.
  3. Deliberate label noise (heteroscedastic) — error grows with fuel
     consumption, matching real sensor/measurement variance.
  4. Outlier injection — 3% of rows are "real world anomalies"
     (stuck in traffic, coasting downhill, etc.)
  5. Train/val/test split — val used for early stopping proxy,
     test is completely held out and NEVER used during training.
  6. Target is reported as realistic L/100km alongside raw litres
     so you can sanity-check against published vehicle specs.
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split, KFold
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import pickle, os, warnings
warnings.filterwarnings('ignore')

# ─────────────────────────────────────────────
# SEED
# ─────────────────────────────────────────────
RNG = np.random.default_rng(42)
N   = 12_000

# ─────────────────────────────────────────────
# 1. PRIMARY INPUTS  (user-controlled)
# ─────────────────────────────────────────────
speed         = RNG.uniform(15, 140, N)
distance      = RNG.uniform(2,  400, N)
mileage_rated = RNG.uniform(8,  25,  N)    # ARAI / manufacturer figure
idle_time     = RNG.uniform(0,  45,  N)
accel_encoded = RNG.choice([0, 1, 2], N, p=[0.30, 0.45, 0.25])

# ─────────────────────────────────────────────
# 2. LATENT / HIDDEN VARIABLES
#    NOT given as model inputs — become noise
#    the model must be robust to.
# ─────────────────────────────────────────────
gradient      = RNG.normal(0, 3.5, N)          # % road grade
ambient_temp  = RNG.normal(28, 8, N)           # °C
cold_penalty  = np.where(ambient_temp < 15, (15 - ambient_temp) * 0.008, 0.0)

ac_load       = RNG.choice([0, 1, 2], N, p=[0.15, 0.45, 0.40])
ac_fuel_cost  = np.array([0.0, 0.3, 0.65])[ac_load]   # litres added per trip

tyre_deficit  = RNG.uniform(0, 12, N)          # PSI below recommended
tyre_penalty  = tyre_deficit * 0.002

payload_kg    = RNG.uniform(0, 350, N)
payload_factor= 1.0 + payload_kg * 0.00025

fuel_quality  = RNG.normal(1.0, 0.025, N)

traffic_index = RNG.uniform(0, 1, N)
traffic_factor= 1.0 + traffic_index * 0.18

# ─────────────────────────────────────────────
# 3. PHYSICS MODIFIERS
# ─────────────────────────────────────────────
def speed_mod(s):
    m = np.ones_like(s, dtype=float)
    m = np.where(s < 40,            1.12, m)
    m = np.where((s>=40)&(s<60),    1.02, m)
    m = np.where((s>=60)&(s<=90),   1.00, m)
    m = np.where((s>90)&(s<=110),   1.10, m)
    m = np.where((s>110)&(s<=130),  1.24, m)
    m = np.where(s > 130,           1.40, m)
    return m

def accel_mod(a):
    return np.array([0.92, 1.00, 1.25])[a.astype(int)]

def idle_mod(idle, dist):
    return 1.0 + (idle * 0.04) / np.maximum(dist / 10.0, 0.1)

def gradient_mod(grad):
    return 1.0 + grad * 0.012

# ─────────────────────────────────────────────
# 4. BASE FUEL
#    Rated mileage is 15-25% better than real world
# ─────────────────────────────────────────────
real_world_penalty = RNG.uniform(0.75, 0.90, N)
effective_mileage  = mileage_rated * real_world_penalty
base_fuel          = distance / effective_mileage

# ─────────────────────────────────────────────
# 5. COMPOSITE + REALISTIC NOISE
# ─────────────────────────────────────────────
composite = (
    speed_mod(speed)
    * accel_mod(accel_encoded)
    * idle_mod(idle_time, distance)
    * gradient_mod(gradient)
    * payload_factor
    * traffic_factor
    * fuel_quality
    + cold_penalty
    + tyre_penalty
)
composite = np.clip(composite, 0.7, 3.0)

true_fuel     = base_fuel * composite + ac_fuel_cost
sigma         = 0.04 * true_fuel + 0.15       # heteroscedastic noise
observed_fuel = true_fuel + RNG.normal(0, sigma, N)
observed_fuel = np.clip(observed_fuel, 0.3, None)

# 3% outlier injection (traffic jams, coasting, etc.)
n_out = int(0.03 * N)
out_idx = RNG.choice(N, n_out, replace=False)
observed_fuel[out_idx] *= RNG.uniform(0.5, 2.0, n_out)

# ─────────────────────────────────────────────
# 6. SANITY CHECK — L/100km
# ─────────────────────────────────────────────
l_per_100 = (observed_fuel / np.maximum(distance, 0.1)) * 100
print("─" * 55)
print("Sanity check — L/100 km distribution:")
print(f"  p5  = {np.percentile(l_per_100,  5):.1f}  (expect ~4-6)")
print(f"  p50 = {np.percentile(l_per_100, 50):.1f}  (expect ~8-12)")
print(f"  p95 = {np.percentile(l_per_100, 95):.1f}  (expect ~16-22)")
print("─" * 55)

# ─────────────────────────────────────────────
# 7. FEATURES — only the 5 user inputs
# ─────────────────────────────────────────────
FEATURES = ['speed', 'distance', 'mileage', 'accel_encoded', 'idle_time']

df = pd.DataFrame({
    'speed':         speed,
    'distance':      distance,
    'mileage':       mileage_rated,   # model sees ARAI, not real-world figure
    'accel_encoded': accel_encoded,
    'idle_time':     idle_time,
    'fuel':          observed_fuel,
})

print(f"\n✅  Dataset: {N:,} rows")
print(df[FEATURES + ['fuel']].describe().round(2))

# ─────────────────────────────────────────────
# 8. TRAIN / VAL / TEST  (60 / 20 / 20)
# ─────────────────────────────────────────────
X = df[FEATURES].values
y = df['fuel'].values

X_tmp,  X_test,  y_tmp,  y_test  = train_test_split(X, y, test_size=0.20, random_state=42)
X_train, X_val,  y_train, y_val  = train_test_split(X_tmp, y_tmp, test_size=0.25, random_state=42)

print(f"\nSplit — train:{len(X_train):,}  val:{len(X_val):,}  test:{len(X_test):,}")

# ─────────────────────────────────────────────
# 9. MODEL — conservative depth to prevent
#    memorising the physics formula
# ─────────────────────────────────────────────
pipe = Pipeline([
    ('scaler', StandardScaler()),
    ('gbr', GradientBoostingRegressor(
        n_estimators        = 500,
        max_depth           = 4,       # shallower = less overfit
        learning_rate       = 0.04,
        subsample           = 0.75,    # stochastic GBR
        min_samples_leaf    = 20,      # forces smoother splits
        max_features        = 'sqrt',
        validation_fraction = 0.15,
        n_iter_no_change    = 30,      # early stopping
        tol                 = 1e-4,
        random_state        = 42,
    )),
])

print("\n⏳  Training …")
pipe.fit(X_train, y_train)

actual_trees = pipe.named_steps['gbr'].n_estimators_
print(f"   Early stop at {actual_trees} trees")

# ─────────────────────────────────────────────
# 10. EVALUATION
# ─────────────────────────────────────────────
def report(name, yt, yp):
    mse  = mean_squared_error(yt, yp)
    mae  = mean_absolute_error(yt, yp)
    r2   = r2_score(yt, yp)
    rmse = np.sqrt(mse)
    mask = yt > 0.5
    mape = np.mean(np.abs((yt[mask] - yp[mask]) / yt[mask])) * 100
    print(f"\n{name}")
    print(f"  R²   = {r2:.4f}   (real-world target: 0.82–0.92)")
    print(f"  RMSE = {rmse:.3f} L")
    print(f"  MAE  = {mae:.3f} L")
    print(f"  MAPE = {mape:.1f}%  (target <12%)")
    return {'mse': mse, 'rmse': rmse, 'mae': mae, 'r2': r2, 'mape': mape}

report("Validation",      y_val,  pipe.predict(X_val))
test_m = report("Test (held-out)", y_test, pipe.predict(X_test))

# 5-fold CV
kf    = KFold(n_splits=5, shuffle=True, random_state=42)
cv_r2 = []
for tr, va in kf.split(X):
    p = Pipeline([
        ('s', StandardScaler()),
        ('g', GradientBoostingRegressor(
            n_estimators=actual_trees, max_depth=4,
            learning_rate=0.04, subsample=0.75,
            min_samples_leaf=20, max_features='sqrt',
            random_state=42,
        ))
    ])
    p.fit(X[tr], y[tr])
    cv_r2.append(r2_score(y[va], p.predict(X[va])))

print(f"\n5-Fold CV R² = {np.mean(cv_r2):.4f} ± {np.std(cv_r2):.4f}")

# ─────────────────────────────────────────────
# 11. FEATURE IMPORTANCE
# ─────────────────────────────────────────────
feat_names = ['Speed', 'Distance', 'Mileage', 'Acceleration', 'Idle Time']
gbr        = pipe.named_steps['gbr']
importance = dict(zip(feat_names, gbr.feature_importances_))

print("\n🔍  Feature Importance")
for k, v in sorted(importance.items(), key=lambda x: -x[1]):
    print(f"   {k:<15} {'█' * int(v * 50)}  {v:.3f}")

# ─────────────────────────────────────────────
# 12. SAVE
# ─────────────────────────────────────────────
os.makedirs('model', exist_ok=True)

bundle = {
    'model':              pipe,
    'feature_names':      FEATURES,
    'feature_importance': importance,
    'metrics': {
        'mse':         round(test_m['mse'],  6),
        'rmse':        round(test_m['rmse'], 6),
        'mae':         round(test_m['mae'],  6),
        'r2':          round(test_m['r2'],   6),
        'mape':        round(test_m['mape'], 4),
        'cv_r2':       round(float(np.mean(cv_r2)), 6),
        'modelActive': True,
    },
}

with open('model/fuel_model.pkl', 'wb') as f:
    pickle.dump(bundle, f)

print("\n✅  Saved → model/fuel_model.pkl")
print("🎉  Training complete!")