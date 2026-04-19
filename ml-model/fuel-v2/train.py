import pandas as pd
import numpy as np
import pickle
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error

# =========================
# 1. DATA GENERATION
# =========================
def generate_data(n=3000):
    np.random.seed(42)

    data = {
        "distance": np.random.uniform(5, 500, n),        # km
        "speed": np.random.uniform(20, 120, n),          # km/h
        "weight": np.random.uniform(800, 5000, n),       # kg
        "age": np.random.uniform(0, 15, n),              # years
        "duration": np.random.uniform(10, 720, n),      # minutes (UPDATED)
    }

    df = pd.DataFrame(data)

    # =========================
    # 2. FUEL FORMULA (UPDATED FOR MINUTES)
    # =========================
    df["fuel"] = (
        (df["distance"] * 0.07) +
        (df["weight"] * 0.00025) +
        (df["speed"] * 0.015) +
        (df["age"] * 0.12) +
        (df["duration"] * 0.0015)   # scaled down because minutes are large
    )

    return df


df = generate_data()

# =========================
# 3. FEATURES
# =========================
features = ["distance", "speed", "weight", "age", "duration"]
target = "fuel"

X = df[features]
y = df[target]

# =========================
# 4. TRAIN MODEL
# =========================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestRegressor(
    n_estimators=150,
    max_depth=12,
    random_state=42
)

model.fit(X_train, y_train)

# =========================
# 5. EVALUATION
# =========================
preds = model.predict(X_test)
mae = mean_absolute_error(y_test, preds)

print("✅ Fuel-v2 trained (duration in minutes)")
print(f"📊 MAE: {mae:.3f}")

# =========================
# 6. SAVE MODEL
# =========================
with open("fuel_v2_model.pkl", "wb") as f:
    pickle.dump(model, f)

print("💾 Model saved")