'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { StationMarker } from './StationMarker';
import { MapLegend } from './MapLegend';
import type { StationData } from '@/cities/london/types/transit';
import stationData from '../../../../../data/london/stations.json';

const LONDON_CENTER: [number, number] = [51.505, -0.09];
const DEFAULT_ZOOM = 12;
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>';

interface StationMapProps {
  stations?: StationData[];
}

export default function StationMap({ stations }: StationMapProps) {
  const data = (stations ?? stationData) as StationData[];

  const { minJourneys, maxJourneys } = useMemo(() => {
    if (data.length === 0) return { minJourneys: 0, maxJourneys: 1 };
    const journeys = data.map((s) => s.avgDailyJourneys);
    return {
      minJourneys: Math.min(...journeys),
      maxJourneys: Math.max(...journeys),
    };
  }, [data]);

  return (
    <div className="relative w-full h-[500px] lg:h-[500px] md:h-[400px] sm:h-[350px] rounded-lg overflow-hidden">
      <MapContainer
        center={LONDON_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        {data.map((station) => (
          <StationMarker
            key={station.id}
            station={station}
            minJourneys={minJourneys}
            maxJourneys={maxJourneys}
          />
        ))}
      </MapContainer>
      <MapLegend />
    </div>
  );
}
