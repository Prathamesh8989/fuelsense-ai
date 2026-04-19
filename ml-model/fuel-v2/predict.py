import pickle
import numpy as np

MODEL_PATH = "fuel_v2_model.pkl"

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

def predict_fuel(data):
    """
    Expected input:
    {
      distance: float,
      speed: float,
      weight: float,
      age: float,
      duration: float (minutes)
    }
    """

    try:
        features = np.array([[
            data["distance"],
            data["speed"],
            data["weight"],
            data["age"],
            data["duration"]
        ]])

        prediction = model.predict(features)[0]

        return {
            "predictedFuel": round(float(prediction), 2),
            "unit": "liters",
            "model": "fuel-v2"
        }

    except Exception as e:
        return {
            "error": str(e)
        }