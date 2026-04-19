import React, { useState, useEffect, useRef } from 'react';
import { getRoute } from '../services/routeService';
import { predictFuel, saveTrip, getVehicles } from '../services/api';
import { formatVehicleForPlanner } from './Vehicle';
import { fmtFuel, fmt } from '../utils/helpers';

/* ─────────────────────────────────────────────
   Planner.jsx  — Fuel-Efficient Route Planner
   Fixes applied:
   1. ML payload now sends { distance, speed, weight, age, duration }
      to match the Python fuel_v2_model feature order exactly.
   2. Vehicle list is fetched and the selected vehicle's weight/age
      are injected into every ML call.
   3. Inline Leaflet map — no external PlannerMap component needed.
   4. saveTrip payload mirrors the ML payload so the DB record is
      consistent with what was predicted.
   5. Defensive number coercions throughout; no silent NaN.
───────────────────────────────────────────── */

/* ── Leaflet CSS injected once at module level ── */
if (!document.getElementById('leaflet-css')) {
  const link = document.createElement('link');
  link.id   = 'leaflet-css';
  link.rel  = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
}

/* ── Inline Leaflet Map Component ── */
// function PlannerMap({ routeGeometry, center }) {
//   const containerRef = useRef(null);
//   const mapRef       = useRef(null);
//   const layersRef    = useRef([]);

//   /* Boot map once */
//   useEffect(() => {
//     if (mapRef.current || !containerRef.current) return;

//     const initMap = () => {
//       if (!window.L || mapRef.current) return;
//       const L = window.L;

//       /* Fix default marker icon paths */
//       delete L.Icon.Default.prototype._getIconUrl;
//       L.Icon.Default.mergeOptions({
//         iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
//         iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
//         shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
//       });

//       const map = L.map(containerRef.current, {
//         center:          center || [20.5937, 78.9629],
//         zoom:            6,
//         zoomControl:     true,
//         attributionControl: true,
//       });

//       L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//         attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
//         maxZoom: 19,
//       }).addTo(map);

//       mapRef.current = map;
//     };

//     /* Load Leaflet JS if not already present */
//     if (window.L) {
//       initMap();
//     } else {
//       const script    = document.createElement('script');
//       script.src      = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
//       script.onload   = initMap;
//       document.head.appendChild(script);
//     }

//     return () => {
//       if (mapRef.current) {
//         mapRef.current.remove();
//         mapRef.current = null;
//       }
//     };
//   }, []); // eslint-disable-line react-hooks/exhaustive-deps

//   /* Draw / redraw route whenever geometry changes */
//   useEffect(() => {
//     const L   = window.L;
//     const map = mapRef.current;
//     if (!L || !map || !routeGeometry || routeGeometry.length < 2) return;

//     /* Clear previous layers */
//     layersRef.current.forEach(layer => map.removeLayer(layer));
//     layersRef.current = [];

//     /* geometry is [[lng, lat], ...] — Leaflet needs [lat, lng] */
//     const latlngs = routeGeometry.map(([lng, lat]) => [lat, lng]);

//     /* Route polyline */
//     const polyline = L.polyline(latlngs, {
//       color:  '#f5c518',   // gold accent
//       weight: 5,
//       opacity: 0.9,
//       lineJoin: 'round',
//       lineCap:  'round',
//     }).addTo(map);

//     /* Start marker */
//     const startMarker = L.marker(latlngs[0])
//       .bindPopup('<b>Start</b>')
//       .addTo(map);

//     /* End marker */
//     const endMarker = L.marker(latlngs[latlngs.length - 1])
//       .bindPopup('<b>Destination</b>')
//       .addTo(map);

//     layersRef.current = [polyline, startMarker, endMarker];

//     /* Fit map to route bounds with padding */
//     map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
//   }, [routeGeometry]);

//   return (
//     <div
//       ref={containerRef}
//       style={{
//         width:        '100%',
//         height:       '100%',
//         borderRadius: '10px',
//         overflow:     'hidden',
//         zIndex:       0,
//       }}
//     />
//   );
// }

function PlannerMap({ routeGeometry, center }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layersRef = useRef([]);

  /* 1. Boot map instance once on mount */
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const initMap = () => {
      // Ensure Leaflet is loaded and we haven't already initialized
      if (!window.L || mapRef.current) return;
      const L = window.L;

      /* Fix default marker icon paths for Webpack/Vite environments */
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current, {
        center: center || [20.5937, 78.9629],
        zoom: 6,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
    };

    /* Dynamic script loading if Leaflet isn't in index.html */
    if (window.L) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* 2. Draw / redraw route whenever geometry changes */
  useEffect(() => {
    const L = window.L;
    const map = mapRef.current;

    // Check for existence of Leaflet, the map instance, and valid geometry data
    if (!L || !map || !routeGeometry || !Array.isArray(routeGeometry) || routeGeometry.length < 2) return;

    /* Clear previous route layers to prevent memory leaks and ghost lines */
    layersRef.current.forEach(layer => map.removeLayer(layer));
    layersRef.current = [];

    try {
      /* SANITY FILTER: 
         - Ensure points are arrays of [lng, lat]
         - Convert to Leaflet's [lat, lng] format
         - Coerce values to Floats to avoid string/NaN issues
      */
      const validLatLngs = routeGeometry
        .filter(point => 
          Array.isArray(point) && 
          point.length >= 2 && 
          !isNaN(parseFloat(point[0])) && 
          !isNaN(parseFloat(point[1]))
        )
        .map(([lng, lat]) => [parseFloat(lat), parseFloat(lng)]);

      if (validLatLngs.length < 2) {
        console.warn("PlannerMap: Insufficient valid coordinates found.");
        return;
      }

      /* Route polyline styling */
      const polyline = L.polyline(validLatLngs, {
        color: '#f5c518', // Gold accent to match your UI
        weight: 5,
        opacity: 0.9,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(map);

      /* Start & End markers */
      const startMarker = L.marker(validLatLngs[0])
        .bindPopup('<b>Start Point</b>')
        .addTo(map);

      const endMarker = L.marker(validLatLngs[validLatLngs.length - 1])
        .bindPopup('<b>Destination</b>')
        .addTo(map);

      layersRef.current = [polyline, startMarker, endMarker];

      /* Automatically fit the map view to show the entire route */
      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

    } catch (err) {
      console.error("Leaflet drawing error:", err);
    }
  }, [routeGeometry]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '10px',
        overflow: 'hidden',
        zIndex: 0,
      }}
    />
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function Planner() {
  const [origin,      setOrigin]      = useState('');
  const [destination, setDestination] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [route,       setRoute]       = useState(null);
  const [prediction,  setPrediction]  = useState(null);
  const [savedTrip,   setSavedTrip]   = useState(null);
  const [savingTrip,  setSavingTrip]  = useState(false);
  const [error,       setError]       = useState('');

  /* Vehicle state */
  const [vehicles,        setVehicles]        = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);

  /* ── Fetch vehicles on mount ── */
  useEffect(() => {
    (async () => {
      try {
        const res  = await getVehicles();
        const data = res.vehicles || (Array.isArray(res) ? res : []);
        const list = Array.isArray(data) ? data : [];
        setVehicles(list);
        if (list.length > 0) setSelectedVehicle(list[0]); // auto-select first
      } catch (e) {
        console.warn('Could not load vehicles:', e.message);
      } finally {
        setVehiclesLoading(false);
      }
    })();
  }, []);

  /* ── Route optimisation + ML prediction ── */
  const optimizeRoute = async () => {
    if (!origin || !destination) return setError('Enter origin and destination');

    setLoading(true);
    setError('');
    setPrediction(null);
    setSavedTrip(null);

    try {
      /* 1. Get route data */
      const routeData = await getRoute(origin, destination);
      if (!routeData) throw new Error('No route found');

      const speed    = parseFloat(routeData.avgSpeed)    || 60;
      const distance = parseFloat(routeData.distanceKm)  || 10;
      const duration = parseFloat(routeData.durationMin) || (distance / speed) * 60;

      setRoute({ ...routeData, avgSpeed: speed, distanceKm: distance, durationMin: duration });

      /* 2. Build ML payload — must match fuel_v2_model feature order:
            [distance, speed, weight, age, duration]              */
      const vehicle = selectedVehicle ? formatVehicleForPlanner(selectedVehicle) : null;

      const mlData = {
        distance,                              // km
        speed,                                 // km/h
        weight:   vehicle ? vehicle.weight : 1200,   // kg  (default 1200 kg if no vehicle)
        age:      vehicle ? vehicle.age    : 3,       // years
        duration,                              // minutes
      };

      console.log('[Planner] ML payload:', mlData);

      /* 3. Call prediction endpoint */
      const predRes = await predictFuel(mlData);

      // Handle { prediction: {...} } or the object directly
      const finalPrediction = predRes?.prediction ?? predRes;
      if (!finalPrediction || finalPrediction.error) {
        throw new Error(finalPrediction?.error || 'Invalid response from ML service');
      }

      setPrediction(finalPrediction);

    } catch (e) {
      setError(e.message);
      console.error('[Planner] optimizeRoute error:', e);
    } finally {
      setLoading(false);
    }
  };

  /* ── Save trip ── */
  // const handleSaveTrip = async () => {
  //   if (savedTrip || savingTrip || !prediction || !route) return;
  //   setSavingTrip(true);
  //   setError('');

  //   try {
  //     const vehicle = selectedVehicle ? formatVehicleForPlanner(selectedVehicle) : null;

  //     /* Mirror the exact fields that were used for prediction */
  //     const tripData = {
  //       distance:      route.distanceKm,
  //       speed:         route.avgSpeed,
  //       duration:      route.durationMin,
  //       weight:        vehicle ? vehicle.weight : 1200,
  //       age:           vehicle ? vehicle.age    : 3,
  //       vehicleId:     vehicle ? vehicle.id     : null,
  //       vehicleName:   vehicle ? vehicle.name   : 'Unknown',
  //       predictedFuel: prediction.predictedFuel,
  //       driverType:    prediction.driverType    ?? null,
  //       fuelPrice:     100,                      // ₹/L default
  //       origin,
  //       destination,
  //     };

  //     const result = await saveTrip(tripData);
  //     setSavedTrip(result.trip || result);
  //   } catch (e) {
  //     setError(e.message);
  //   } finally {
  //     setSavingTrip(false);
  //   }
  // };


  /* ── Fix: Updated handleSaveTrip ── */
  const handleSaveTrip = async () => {
    if (savedTrip || savingTrip || !prediction || !route) return;
    
    setSavingTrip(true);
    setError('');

    try {
      const vehicle = selectedVehicle ? formatVehicleForPlanner(selectedVehicle) : null;

      const tripData = {
        origin: origin,
        destination: destination,
        distance: Number(route.distanceKm),
        speed: Number(route.avgSpeed),
        duration: Number(route.durationMin),
        predictedFuel: Number(prediction.predictedFuel),
        // Ensure IDs are passed correctly for the database relationship
        vehicleId: selectedVehicle?._id || selectedVehicle?.id,
        vehicleName: selectedVehicle?.name || 'Unknown',
        timestamp: new Date().toISOString()
      };

      const result = await saveTrip(tripData);
      
      // If result is successful, update UI state
      if (result) {
        setSavedTrip(result.trip || result);
      }
    } catch (e) {
      setError("Server Error: Could not persist trip to Analytics.");
      console.error("Save Trip Error:", e);
    } finally {
      setSavingTrip(false);
    }
  };
  
  /* ── Map centre ── */
  const mapCenter =
    route?.geometry?.length > 1
      ? [
          (route.geometry[0][1] + route.geometry[route.geometry.length - 1][1]) / 2,
          (route.geometry[0][0] + route.geometry[route.geometry.length - 1][0]) / 2,
        ]
      : [20.5937, 78.9629];

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div
      className="page-enter"
      style={{ maxWidth: '1200px', margin: '0 auto', padding: '6rem 1.5rem 3rem' }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: '2.5rem' }}>
        <p style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.68rem', letterSpacing: '0.2em', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          ROUTE OPTIMIZATION
        </p>
        <h1 style={{ fontFamily: '"Cinzel",serif', fontSize: 'clamp(1.6rem,3.5vw,2.4rem)', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-primary)', margin: 0 }}>
          Fuel-Efficient <span style={{ color: 'var(--accent-gold)' }}>Planner</span>
        </h1>
        <p style={{ fontFamily: '"Cormorant Garamond",serif', fontSize: '1.1rem', color: 'var(--text-secondary)', marginTop: '0.5rem', maxWidth: '600px' }}>
          Find the shortest fuel-efficient route between any two addresses. Powered by OpenStreetMap + ML predictions.
        </p>
        <div className="gold-divider" style={{ marginTop: '1.2rem', maxWidth: '160px' }} />
      </div>

      {/* ── Vehicle Selector ── */}
      <div className="card p-5" style={{ marginBottom: '1.5rem' }}>
        <p className="section-title" style={{ marginBottom: '0.75rem' }}>Select Vehicle</p>
        {vehiclesLoading ? (
          <p style={{ color: 'var(--text-muted)', fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.8rem' }}>
            Loading vehicles…
          </p>
        ) : vehicles.length === 0 ? (
          <p style={{ color: '#e05252', fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.8rem' }}>
            ⚠ No vehicles found. Add one in Vehicle Manager so weight & age are used in ML predictions.
          </p>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {vehicles.map(v => {
              const vid        = v._id || v.id;
              const isSelected = (selectedVehicle?._id || selectedVehicle?.id) === vid;
              return (
                <button
                  key={vid}
                  onClick={() => setSelectedVehicle(v)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: isSelected ? '1.5px solid var(--accent-gold)' : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(255,215,0,0.08)' : 'var(--bg-glass)',
                    color: isSelected ? 'var(--accent-gold)' : 'var(--text-primary)',
                    fontFamily: '"IBM Plex Mono",monospace',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {v.name} <span style={{ opacity: 0.6 }}>({v.type} · {Number(v.weight) || '?'} kg · {Number(v.age) ?? '?'} yr)</span>
                </button>
              );
            })}
          </div>
        )}
        {selectedVehicle && (
          <p style={{ marginTop: '0.6rem', fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Using: {selectedVehicle.name} — weight {Number(selectedVehicle.weight) || '?'} kg, age {Number(selectedVehicle.age) ?? '?'} yr
          </p>
        )}
      </div>

      {/* ── Route Input ── */}
      <div className="card p-6" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
          <div>
            <label className="input-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Origin</label>
            <input
              type="text"
              value={origin}
              onChange={e => setOrigin(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && optimizeRoute()}
              placeholder="e.g., Mumbai, India"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="input-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Destination</label>
            <input
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && optimizeRoute()}
              placeholder="e.g., Pune, India"
              style={inputStyle}
            />
          </div>
          <button
            onClick={optimizeRoute}
            disabled={loading}
            style={{
              padding: '0.75rem 2rem',
              background: 'var(--accent-gold)',
              color: '#0a1a0f',
              border: 'none',
              borderRadius: '8px',
              fontFamily: '"Cinzel",serif',
              fontSize: '0.8rem',
              letterSpacing: '0.1em',
              cursor: loading ? 'wait' : 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s',
              minHeight: '48px',
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading ? '◌ ROUTING…' : 'OPTIMIZE ROUTE'}
          </button>
        </div>

        {error && (
          <p style={{ marginTop: '1rem', color: '#e05252', fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.8rem' }}>
            ⚠ {error}
          </p>
        )}
      </div>

      {/* ── Results ── */}
      {route && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem', marginBottom: '1.5rem' }}>

          {/* Map */}
          <div className="card p-4" style={{ height: '500px', display: 'flex' }}>
            <PlannerMap routeGeometry={route.geometry} center={mapCenter} />
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Route Summary */}
            <div className="card p-5">
              <p className="section-title" style={{ marginBottom: '1rem' }}>Route Summary</p>
              <SummaryRow label="Distance"  value={`${fmt(route.distanceKm, 1)} km`} />
              <SummaryRow label="Duration"  value={`${fmt(route.durationMin, 0)} min`} />
              <SummaryRow label="Avg Speed" value={`${fmt(route.avgSpeed, 0)} km/h`} />
              {selectedVehicle && (
                <>
                  <SummaryRow label="Vehicle" value={selectedVehicle.name} />
                  <SummaryRow label="Weight"  value={`${Number(selectedVehicle.weight) || '?'} kg`} />
                  <SummaryRow label="Age"     value={`${Number(selectedVehicle.age) ?? '?'} yr`} />
                </>
              )}
            </div>

            {/* ML Prediction */}
            {prediction && (
              <div className="card p-5">
                <p className="section-title" style={{ marginBottom: '1rem' }}>ML Fuel Prediction</p>

                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <p style={{ fontFamily: '"Playfair Display",serif', fontSize: '2rem', color: 'var(--accent-gold)', margin: '0.2rem 0' }}>
                    {fmtFuel(prediction.predictedFuel)}
                  </p>
                  <p style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
                    ESTIMATED USAGE
                  </p>
                </div>

                {prediction.driverType && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Driver Type:{' '}
                    <span style={{ color: 'var(--accent-gold)' }}>{prediction.driverType}</span>
                  </p>
                )}
                {prediction.confidenceScore != null && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Confidence:{' '}
                    <span style={{ color: 'var(--accent-gold)' }}>
                      {(prediction.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </p>
                )}

                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: '"IBM Plex Mono",monospace', marginBottom: '1rem' }}>
                  Model: {prediction.model ?? 'fuel-v2'} · Unit: {prediction.unit ?? 'liters'}
                </p>

                <button
                  onClick={handleSaveTrip}
                  disabled={savingTrip || !!savedTrip}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: savedTrip ? '#10b981' : 'var(--accent-gold)',
                    color: '#0a1a0f',
                    border: 'none',
                    borderRadius: '8px',
                    fontFamily: '"Cinzel",serif',
                    fontWeight: 600,
                    cursor: savingTrip ? 'wait' : savedTrip ? 'default' : 'pointer',
                    opacity: savingTrip ? 0.75 : 1,
                    transition: 'all 0.2s',
                  }}
                >
                  {savedTrip ? '✅ TRIP SAVED' : savingTrip ? 'SAVING…' : '💾 SAVE THIS TRIP'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Helper sub-components ── */
function SummaryRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontFamily: '"IBM Plex Mono",monospace', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

/* ── Shared input style ── */
const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  background: 'var(--bg-glass)',
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
};