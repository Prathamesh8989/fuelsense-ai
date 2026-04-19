import React, { memo } from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PlannerMap = ({ routeGeometry, center = [20.5937, 78.9629] }) => {
  const polylinePositions = React.useMemo(() => 
    routeGeometry ? routeGeometry.map(([lng, lat]) => [lat, lng]) : [], 
    [routeGeometry]
  );

  const mapKey = `map-${center[0]}-${center[1]}-${polylinePositions.length}`;

  return (
    <div style={{ height: '100%', width: '100%', minHeight: '400px', background: '#1a1a1a' }}>
      <MapContainer
        key={mapKey} 
        center={center}
        zoom={polylinePositions.length > 0 ? 12 : 5}
        style={{ height: '100%', width: '100%', borderRadius: '12px' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {polylinePositions.length > 0 && (
          <Polyline positions={polylinePositions} color="#d4af37" weight={5} opacity={0.8} />
        )}
      </MapContainer>
    </div>
  );
};

// memo prevents the map from re-rendering unless props actually change
export default memo(PlannerMap);