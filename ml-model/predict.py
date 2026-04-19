"""
FuelSense AI – Prediction Engine
Inputs : speed, distance, mileage, idle_time, accel_encoded (0/1/2), fuel_price
Outputs: full result dict consumed by the Express controller
"""

import numpy as np
import pickle
import os
from typing import Optional

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'model', 'fuel_model.pkl')
_bundle: Optional[dict] = None


# ─────────────────────────────────────────────
#  Model Loading
# ─────────────────────────────────────────────
def load_model() -> Optional[dict]:
    global _bundle
    if _bundle is None:
        if not os.path.exists(MODEL_PATH):
            return None
        with open(MODEL_PATH, 'rb') as f:
            _bundle = pickle.load(f)
    return _bundle


# ─────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────
def _clamp(n: float, lo: float, hi: float) -> float:
    return float(max(lo, min(hi, n)))

def _r2(v: float) -> float:
    return round(float(v), 2)

def _accel_str(encoded: int) -> str:
    return {0: 'smooth', 1: 'moderate', 2: 'aggressive'}.get(int(encoded), 'moderate')


# ─────────────────────────────────────────────
#  Physics Modifiers  (must mirror train.py)
# ─────────────────────────────────────────────
def _speed_modifier(speed: float) -> float:
    s = float(speed)
    if   s < 40:   return 1.12
    elif s <= 60:  return 1.02
    elif s <= 90:  return 1.00
    elif s <= 110: return 1.10
    elif s <= 130: return 1.24
    else:          return 1.40

def _accel_modifier(accel: str) -> float:
    return {'smooth': 0.92, 'moderate': 1.00, 'aggressive': 1.25}.get(accel, 1.00)

def _idle_modifier(idle_time: float, distance: float) -> float:
    idle_fuel = float(idle_time) * 0.04
    base_est  = max(float(distance) / 10.0, 0.1)
    return 1.0 + (idle_fuel / base_est)

def _composite_modifier(speed, accel, idle_time, distance) -> float:
    return _clamp(
        _speed_modifier(speed) *
        _accel_modifier(accel) *
        _idle_modifier(idle_time, distance),
        0.7, 2.5
    )


# ─────────────────────────────────────────────
#  Ancillary Outputs
# ─────────────────────────────────────────────
def _mileage_insight(mileage: float) -> dict:
    m = float(mileage)
    if   m >= 20: return {"rating": "Excellent",     "note": "Top-tier fuel efficiency."}
    elif m >= 15: return {"rating": "Good",           "note": "Above-average efficiency."}
    elif m >= 10: return {"rating": "Average",        "note": "Servicing may help."}
    else:         return {"rating": "Below Average",  "note": "Check engine and tyres."}

def _trip_rating(score: int) -> str:
    if   score >= 80: return "Excellent"
    elif score >= 65: return "Good"
    elif score >= 45: return "Average"
    else:             return "Poor"

def _driver_type(speed: float, accel: str, idle: float) -> str:
    if accel == 'smooth' and speed <= 90 and idle <= 5:
        return "Smooth Driver"
    elif accel == 'aggressive' or speed > 120:
        return "Aggressive Driver"
    elif idle > 10:
        return "Moderate Driver"
    else:
        return "Efficient Driver"

def _efficiency_score(mod: float, speed: float, accel: str, idle: float) -> int:
    score = 100
    score -= _clamp((mod - 1.0) * 55, 0, 35)
    if speed > 110:            score -= 8
    if speed > 130:            score -= 10
    if accel == 'aggressive':  score -= 15
    if idle > 10:              score -= 10
    elif idle > 5:             score -= 5
    return int(_clamp(score, 0, 100))

def _confidence_interval(predicted: float, has_ml: bool) -> dict:
    sigma = predicted * (0.04 if has_ml else 0.12)
    return {
        "lower":      _r2(max(0.0, predicted - sigma)),
        "upper":      _r2(predicted + sigma),
        "confidence": "95%" if has_ml else "80%",
    }

def _factor_impact(base: float, speed: float, accel: str,
                   idle_time: float) -> dict:
    return {
        "Speed Effect":        _r2(base * (_speed_modifier(speed) - 1.0)),
        "Acceleration Effect": _r2(base * (_accel_modifier(accel) - 1.0)),
        "Idle Penalty":        _r2(idle_time * 0.04),
        "Base Consumption":    _r2(base),
    }

def _graph_data(fuel: float, distance: float, mod: float) -> list:
    """Five waypoints along the journey for the cumulative fuel curve."""
    phases = ['Start', '25%', '50%', '75%', 'End']
    fracs  = [0.05, 0.25, 0.50, 0.78, 1.00]
    return [{'name': p, 'fuel': _r2(fuel * f)} for p, f in zip(phases, fracs)]

def _recommendations(speed, accel, idle, mileage, distance, fuel_price) -> list:
    recs = []
    if speed > 120:
        recs.append("Reduce cruising speed below 120 km/h — aerodynamic drag rises sharply, costing up to 25% extra fuel.")
    elif speed > 100:
        recs.append("Try to keep speed under 100 km/h on highways for optimal fuel economy.")

    if accel == 'aggressive':
        recs.append("Ease off aggressive acceleration — smooth starts can reduce fuel use by up to 15%.")
    elif accel == 'smooth':
        recs.append("Excellent acceleration style — keep it up!")

    if idle > 10:
        recs.append("Turn off the engine during stops longer than 60 seconds to eliminate idle fuel waste.")
    elif idle > 5:
        recs.append("Try to reduce idling — even 5 extra minutes of idle costs measurable fuel.")

    if mileage < 10:
        recs.append("Your vehicle's mileage is low — a full service check (air filter, tyres, spark plugs) could recover 10–15%.")
    elif mileage >= 20:
        recs.append("Your vehicle is highly fuel-efficient — great choice.")

    if distance < 5:
        recs.append("Very short trips are inefficient as the engine never reaches operating temperature. Combine errands where possible.")
    elif distance > 250:
        recs.append("On long drives, take breaks every 2 hours — fatigue affects driving smoothness and fuel use.")

    if fuel_price > 110:
        recs.append(f"With fuel at ₹{fuel_price:.0f}/L, reducing speed by 10 km/h could save ₹{fuel_price * 0.08:.0f}+ per trip.")

    return recs if recs else ["All parameters look optimal — great trip!"]


# ─────────────────────────────────────────────
#  MAIN PREDICT
# ─────────────────────────────────────────────
def predict(
    speed:                float,
    distance:             float,
    mileage:              float,
    accel_encoded:        int,
    idle_time:            float,
    fuel_price:           float = 100.0,
) -> dict:

    # Sanitise
    speed       = _clamp(float(speed),       5,   200)
    distance    = _clamp(float(distance),    0.5, 1000)
    mileage     = _clamp(float(mileage),     1,   50)
    accel_enc   = int(accel_encoded)          # 0 / 1 / 2
    idle_time   = _clamp(float(idle_time),   0,   120)
    fuel_price  = _clamp(float(fuel_price),  1,   300)
    accel       = _accel_str(accel_enc)

    bundle = load_model()
    has_ml = bundle is not None

    # Physics baseline
    base = distance / mileage
    mod  = _composite_modifier(speed, accel, idle_time, distance)

    # ML prediction  (blended 60 / 40 with physics)
    if has_ml:
        try:
            features = np.array([[speed, distance, mileage, accel_enc, idle_time]])
            ml_pred  = float(bundle['model'].predict(features)[0])
            physics  = base * mod
            final    = 0.60 * ml_pred + 0.40 * physics
            mod      = final / max(base, 0.01)
        except Exception:
            pass   # fall through to pure physics

    fuel = _r2(max(base * mod, 0.1))
    cost = _r2(fuel * fuel_price)
    eco  = _efficiency_score(mod, speed, accel, idle_time)

    impact       = _factor_impact(base, speed, accel, idle_time)
    contribution = {
        k: _r2(v / max(fuel, 0.01) * 100)
        for k, v in impact.items()
    }

    model_metrics = (
        {**bundle['metrics'], 'modelActive': True}
        if has_ml else
        {'mse': None, 'r2': None, 'modelActive': False}
    )

    return {
        "predictedFuel":     fuel,
        "totalCost":         cost,
        "co2Kg":             _r2(fuel * 2.31),
        "efficiencyScore":   eco,
        "tripRating":        _trip_rating(eco),
        "driverType":        _driver_type(speed, accel, idle_time),
        "mileageInsight":    _mileage_insight(mileage),
        "factorImpact":      impact,
        "factorContribution":contribution,
        "featureImportance": bundle['feature_importance'] if has_ml else {},
        "confidenceInterval":_confidence_interval(fuel, has_ml),
        "graphData":         _graph_data(fuel, distance, mod),
        "recommendations":   _recommendations(speed, accel, idle_time, mileage, distance, fuel_price),
        "metrics":           model_metrics,
    }