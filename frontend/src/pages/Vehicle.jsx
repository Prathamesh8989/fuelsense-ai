import React, { useEffect, useState } from 'react';
import { getVehicles, createVehicle, deleteVehicle } from '../services/api';

/* =========================================================
   EXPORT: Planner-friendly formatter
   Converts a raw DB vehicle object into the shape that
   formatVehicleForPlanner() and the ML payload both expect.
========================================================= */
export const formatVehicleForPlanner = (v) => ({
  id:           v._id || v.id,
  name:         v.name,
  type:         v.type,
  vehicle_type: v.type === 'truck' ? 1 : 0, // binary encoding (unused by fuel-v2 model but kept for future)
  weight:       Number(v.weight) || 0,
  age:          Number(v.age)    || 0,
});

export default function Vehicle() {
  const [vehicles, setVehicles]           = useState([]);
  const [loading, setLoading]             = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [form, setForm]                   = useState({ name: '', type: 'car', weight: '', age: '' });
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');

  /* ─── FETCH ─── */
  const fetchVehicles = async () => {
    try {
      const res = await getVehicles();
      // const data = res.data?.vehicles || [];
      const data = res.vehicles || (Array.isArray(res) ? res : []);
      setVehicles(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('fetchVehicles error:', err);
      setError('Failed to load vehicles. Is the backend running?');
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  /* ─── ADD ─── */
  const handleAdd = async () => {
    if (!form.name.trim() || !form.weight || !form.age) {
      return setError('Please fill in all fields before adding.');
    }
    if (Number(form.weight) <= 0 || Number(form.age) < 0) {
      return setError('Weight must be positive and age must be 0 or greater.');
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await createVehicle({
        name:   form.name.trim(),
        type:   form.type,
        weight: Number(form.weight),
        age:    Number(form.age),
      });

      console.log('createVehicle response:', res.data);

      // Backend may wrap in { data: vehicle } or return the vehicle directly
      // const newVehicle = res.data?.data || res.data?.vehicle || res.data;
      const newVehicle = res.vehicle || res.data || res;

      if (newVehicle && (newVehicle._id || newVehicle.id)) {
        setVehicles(prev => [...prev, newVehicle]);
      } else {
        // Fallback: re-fetch if the created object isn't returned cleanly
        await fetchVehicles();
      }

      setForm({ name: '', type: 'car', weight: '', age: '' });
      setSuccess(`"${form.name.trim()}" added successfully.`);
      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      console.error('createVehicle error:', err);
      setError(err.response?.data?.message || 'Failed to add vehicle.');
    } finally {
      setLoading(false);
    }
  };

  /* ─── DELETE ─── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle? This cannot be undone.')) return;
    setError('');
    try {
      await deleteVehicle(id);
      setVehicles(prev => prev.filter(v => (v._id || v.id) !== id));
      if ((selectedVehicle?._id || selectedVehicle?.id) === id) setSelectedVehicle(null);
    } catch (err) {
      console.error('deleteVehicle error:', err);
      setError('Failed to delete vehicle.');
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '6rem 1.5rem 3rem' }}>

      {/* HEADER */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: '"Cinzel", serif', fontSize: '2rem', color: 'var(--text-primary)' }}>
          Vehicle <span style={{ color: 'var(--accent-gold)' }}>Manager</span>
        </h1>
        <p style={{ fontFamily: '"Cormorant Garamond", serif', color: 'var(--text-secondary)' }}>
          Manage your fleet. Vehicles selected here are used by the Planner for ML fuel predictions.
        </p>
        <div className="gold-divider" style={{ marginTop: '1rem', maxWidth: '140px' }} />
      </div>

      {/* ADD VEHICLE FORM */}
      <div className="card p-6" style={{ marginBottom: '2rem' }}>
        <p className="section-title" style={{ marginBottom: '1rem' }}>Add New Vehicle</p>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
          <input
            placeholder="Vehicle Name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            style={inputStyle}
          />
          <select
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })}
            style={inputStyle}
          >
            <option value="car">Car</option>
            <option value="truck">Truck</option>
          </select>
          <input
            placeholder="Weight (kg)"
            type="number"
            min="1"
            value={form.weight}
            onChange={e => setForm({ ...form, weight: e.target.value })}
            style={inputStyle}
          />
          <input
            placeholder="Age (years)"
            type="number"
            min="0"
            value={form.age}
            onChange={e => setForm({ ...form, age: e.target.value })}
            style={inputStyle}
          />
          <button onClick={handleAdd} disabled={loading} style={buttonStyle}>
            {loading ? 'ADDING...' : 'ADD'}
          </button>
        </div>

        {error && (
          <p style={{ color: '#e05252', marginTop: '1rem', fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.8rem' }}>
            ⚠ {error}
          </p>
        )}
        {success && (
          <p style={{ color: '#10b981', marginTop: '1rem', fontFamily: '"IBM Plex Mono",monospace', fontSize: '0.8rem' }}>
            ✅ {success}
          </p>
        )}
      </div>

      {/* VEHICLE LIST */}
      <div className="card p-6">
        <p className="section-title" style={{ marginBottom: '1rem' }}>
          Your Vehicles ({vehicles.length})
        </p>

        {vehicles.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontFamily: '"Cormorant Garamond",serif' }}>
            No vehicles added yet. Add one above to start using the Planner.
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {vehicles.map(v => {
              const id = v._id || v.id;
              const isSelected = (selectedVehicle?._id || selectedVehicle?.id) === id;

              return (
                <div
                  key={id}
                  onClick={() => setSelectedVehicle(v)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    borderRadius: '10px',
                    border: isSelected ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(255, 215, 0, 0.05)' : 'var(--bg-glass)',
                    cursor: 'pointer',
                    transition: '0.2s ease',
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 600, margin: 0 }}>
                      {v.name}{' '}
                      <span style={{ color: 'var(--accent-gold)' }}>({v.type})</span>
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: '"IBM Plex Mono", monospace', margin: '0.25rem 0 0' }}>
                      {Number(v.weight) || '?'} kg &bull; {Number(v.age) ?? '?'} yr
                      {/* Warn if weight is missing — helps debug bad DB records */}
                      {(v.weight === undefined || v.weight === null) && (
                        <span style={{ color: '#e05252' }}> ⚠ no weight</span>
                      )}
                    </p>
                  </div>

                  <button
                    onClick={e => { e.stopPropagation(); handleDelete(id); }}
                    style={{
                      background: '#e05252',
                      color: '#fff',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontFamily: '"IBM Plex Mono",monospace',
                      fontSize: '0.75rem',
                    }}
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Styles ── */
const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid var(--border-color)',
  borderRadius: '8px',
  background: 'var(--bg-glass)',
  color: 'var(--text-primary)',
  fontFamily: '"IBM Plex Mono",monospace',
  fontSize: '0.9rem',
};

const buttonStyle = {
  padding: '0.75rem 1.5rem',
  background: 'var(--accent-gold)',
  color: '#0a1a0f',
  border: 'none',
  borderRadius: '8px',
  fontWeight: 600,
  cursor: 'pointer',
  fontFamily: '"IBM Plex Mono",monospace',
  fontSize: '0.8rem',
  whiteSpace: 'nowrap',
};