'use client';

import { CircleMarker, Popup } from 'react-leaflet';
import type { StationData } from '@/cities/nyc/types/transit';
import { StationPopover } from './StationPopover';

interface StationMarkerProps {
  station: StationData;
}

// Color gradient based on ridership intensity
function getRidershipColor(
  ridership: number,
  minRidership: number,
  maxRidership: number
): string {
  // Logarithmic scale for better visual distribution
  const logMin = Math.log(minRidership);
  const logMax = Math.log(maxRidership);
  const logValue = Math.log(ridership);
  const normalizedValue = (logValue - logMin) / (logMax - logMin);

  // Gradient: Low (blue) → Medium (MTA blue) → High (MTA red)
  if (normalizedValue < 0.5) {
    // Blue to MTA blue
    const t = normalizedValue * 2;
    const r = Math.round(77 + (0 - 77) * t);
    const g = Math.round(146 + (57 - 146) * t);
    const b = Math.round(251 + (166 - 251) * t);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // MTA blue to MTA red
    const t = (normalizedValue - 0.5) * 2;
    const r = Math.round(0 + (238 - 0) * t);
    const g = Math.round(57 + (53 - 57) * t);
    const b = Math.round(166 + (46 - 166) * t);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

// Size based on ridership (logarithmic scale)
function getRidershipRadius(
  ridership: number,
  minRidership: number,
  maxRidership: number
): number {
  const minRadius = 4;
  const maxRadius = 20;

  const logMin = Math.log(minRidership);
  const logMax = Math.log(maxRidership);
  const logValue = Math.log(ridership);
  const normalizedValue = (logValue - logMin) / (logMax - logMin);

  return minRadius + (maxRadius - minRadius) * normalizedValue;
}

export function StationMarker({ station }: StationMarkerProps) {
  // These values should ideally come from the data, but we'll use reasonable estimates
  const minRidership = 60000; // Based on the data
  const maxRidership = 175000; // Based on the data

  const color = getRidershipColor(
    station.avgDailyRidership,
    minRidership,
    maxRidership
  );
  const radius = getRidershipRadius(
    station.avgDailyRidership,
    minRidership,
    maxRidership
  );

  return (
    <CircleMarker
      center={[station.lat, station.lng]}
      radius={radius}
      pathOptions={{
        fillColor: color,
        fillOpacity: 0.7,
        color: color,
        weight: 2,
        opacity: 0.9,
      }}
    >
      <Popup>
        <StationPopover station={station} />
      </Popup>
    </CircleMarker>
  );
}
