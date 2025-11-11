import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon issue in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapProps {
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  height?: string;
}

const Map: React.FC<MapProps> = ({ 
  address, 
  city, 
  latitude, 
  longitude,
  height = '300px'
}) => {
  // Default coordinates for different areas in Addis Ababa
  const getCoordinatesForArea = (addr: string): [number, number] => {
    const lowerAddr = addr.toLowerCase();
    
    if (lowerAddr.includes('bole')) return [8.9806, 38.7578];
    if (lowerAddr.includes('cmc')) return [9.0084, 38.7636];
    if (lowerAddr.includes('kazanchis')) return [9.0180, 38.7580];
    if (lowerAddr.includes('old airport')) return [9.0065, 38.7490];
    if (lowerAddr.includes('megenagna')) return [9.0195, 38.7910];
    if (lowerAddr.includes('sarbet')) return [9.0150, 38.7490];
    if (lowerAddr.includes('gerji')) return [9.0350, 38.7890];
    if (lowerAddr.includes('mexico')) return [9.0340, 38.7640];
    if (lowerAddr.includes('piassa')) return [9.0330, 38.7400];
    if (lowerAddr.includes('merkato')) return [9.0120, 38.7250];
    
    // Default to Addis Ababa center
    return [9.0320, 38.7469];
  };

  const position: [number, number] = useMemo(() => {
    if (latitude && longitude) {
      return [latitude, longitude];
    }
    return getCoordinatesForArea(address);
  }, [latitude, longitude, address]);

  return (
    <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden">
      <MapContainer
        center={position}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>
            <div className="text-sm">
              <strong>{address}</strong>
              <br />
              {city}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default Map;
