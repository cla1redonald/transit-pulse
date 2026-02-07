'use client';

import { MapContainer, TileLayer } from 'react-leaflet';
import { StationMarker } from './StationMarker';
import { MapLegend } from './MapLegend';
import { useFilters } from '@/cities/nyc/lib/filter-context';
import stationsData from '../../../../../data/nyc/stations.json';
import type { StationData } from '@/cities/nyc/types/transit';
import 'leaflet/dist/leaflet.css';

const stations = stationsData as StationData[];

export function StationMap() {
  const { activeModes } = useFilters();
  const isSubwayActive = activeModes.has('subway');

  // Filter or dim stations based on subway mode toggle
  const visibleStations = isSubwayActive ? stations : [];

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={[40.758, -73.9855]}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {visibleStations.map((station) => (
          <StationMarker key={station.id} station={station} />
        ))}
      </MapContainer>
      <MapLegend />
    </div>
  );
}
