"""
FuelSense AI – Flask ML Microservice
Inputs : speed, distance, mileage, idle_time, accel_encoded, fuel_price
Run    : python app.py
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from predict import predict, load_model
import traceback
import logging

# ─────────────────────────────────────────────
#  App Setup
# ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s  %(levelname)s  %(message)s',
)
log = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Pre-load model at startup so first request is fast
try:
    bundle = load_model()
    if bundle:
        m = bundle['metrics']
        log.info(f"🧠  Model loaded  |  R²={m['r2']:.4f}  RMSE={m['rmse']:.4f} L")
    else:
        log.warning("⚠️   No model file found — run `python train.py` first.")
except Exception as exc:
    log.warning(f"⚠️   Model pre-load failed: {exc}")


# ─────────────────────────────────────────────
#  Helpers
# ─────────────────────────────────────────────
def _bad(msg: str, status: int = 400):
    return jsonify({'error': msg}), status

def _require_numeric(data: dict, field: str, lo: float, hi: float):
    """Return (float_value, None) or (None, error_response)."""
    if field not in data:
        return None, _bad(f"Missing required field: '{field}'")
    try:
        v = float(data[field])
    except (TypeError, ValueError):
        return None, _bad(f"Field '{field}' must be a number.")
    if not (lo <= v <= hi):
        return None, _bad(f"Field '{field}' must be between {lo} and {hi}.")
    return v, None

def _require_int_choice(data: dict, field: str, choices: list):
    if field not in data:
        return None, _bad(f"Missing required field: '{field}'")
    try:
        v = int(data[field])
    except (TypeError, ValueError):
        return None, _bad(f"Field '{field}' must be an integer.")
    if v not in choices:
        return None, _bad(f"Field '{field}' must be one of {choices}.")
    return v, None


# ─────────────────────────────────────────────
#  Routes
# ─────────────────────────────────────────────
@app.route('/health', methods=['GET'])
def health():
    bundle = load_model()
    return jsonify({
        'status':       'ok',
        'service':      'FuelSense ML Service',
        'model_loaded': bundle is not None,
        'metrics':      bundle['metrics'] if bundle else None,
    })


@app.route('/predict', methods=['POST'])
def predict_route():
    try:
        data = request.get_json(force=True, silent=True)
        if not data:
            return _bad("Request body must be valid JSON.")

        # ── Validate & parse ──────────────────────────────
        speed,      err = _require_numeric(data, 'speed',      5,   200);  
        if err: return err

        distance,   err = _require_numeric(data, 'distance',   0.5, 1000); 
        if err: return err

        mileage,    err = _require_numeric(data, 'mileage',    1,   50);   
        if err: return err

        idle_time,  err = _require_numeric(data, 'idle_time',  0,   120);  
        if err: return err

        accel_enc,  err = _require_int_choice(data, 'accel_encoded', [0, 1, 2]); 
        if err: return err

        # fuel_price is optional — defaults to 100
        fuel_price = 100.0
        if 'fuel_price' in data:
            fuel_price, err = _require_numeric(data, 'fuel_price', 1, 300)
            if err: return err

        # ── Predict ───────────────────────────────────────
        result = predict(
            speed         = speed,
            distance      = distance,
            mileage       = mileage,
            accel_encoded = accel_enc,
            idle_time     = idle_time,
            fuel_price    = fuel_price,
        )

        log.info(
            f"Predict  speed={speed} dist={distance} mileage={mileage} "
            f"accel={accel_enc} idle={idle_time} price={fuel_price}  "
            f"→ fuel={result['predictedFuel']} L"
        )
        return jsonify(result)

    except Exception:
        traceback.print_exc()
        return _bad("Internal server error.", 500)


@app.route('/feature-importance', methods=['GET'])
def feature_importance_route():
    try:
        bundle = load_model()
        if not bundle:
            return _bad("Model not loaded. Run train.py first.", 503)
        return jsonify({'featureImportance': bundle.get('feature_importance', {})})
    except Exception as exc:
        return _bad(str(exc), 500)


# ─────────────────────────────────────────────
#  Entry Point
# ─────────────────────────────────────────────
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=False)