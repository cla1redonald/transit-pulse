'use client';

import { CircleMarker } from 'react-leaflet';
import { StationPopover } from './StationPopover';
import type { StationData } from '@/cities/london/types/transit';

/**
 * Compute circle marker radius scaled linearly between min and max ridership.
 */
export function computeMarkerRadius(
  avgDailyJourneys: number,
  minJourneys: number,
  maxJourneys: number,
  minRadius: number = 4,
  maxRadius: number = 20,
): number {
  if (maxJourneys === minJourneys) return (minRadius + maxRadius) / 2;
  const t = (avgDailyJourneys - minJourneys) / (maxJourneys - minJourneys);
  const clamped = Math.max(0, Math.min(1, t));
  return minRadius + clamped * (maxRadius - minRadius);
}

/**
 * Compute marker color interpolated from blue (low) to red (high) ridership.
 */
export function computeMarkerColor(
  avgDailyJourneys: number,
  minJourneys: number,
  maxJourneys: number,
): string {
  if (maxJourneys === minJourneys) return '#3b82f6';
  const t = (avgDailyJourneys - minJourneys) / (maxJourneys - minJourneys);
  const clamped = Math.max(0, Math.min(1, t));

  // Interpolate from blue (#3b82f6) to red (#ef4444)
  const r = Math.round(59 + clamped * (239 - 59));
  const g = Math.round(130 + clamped * (68 - 130));
  const b = Math.round(246 + clamped * (68 - 246));

  return `rgb(${r}, ${g}, ${b})`;
}

interface StationMarkerProps {
  station: StationData;
  minJourneys: number;
  maxJourneys: number;
}

export function StationMarker({ station, minJourneys, maxJourneys }: StationMarkerProps) {
  const radius = computeMarkerRadius(station.avgDailyJourneys, minJourneys, maxJourneys);
  const color = computeMarkerColor(station.avgDailyJourneys, minJourneys, maxJourneys);

  return (
    <CircleMarker
      center={[station.lat, station.lng]}
      radius={radius}
      pathOptions={{
        fillColor: color,
        fillOpacity: 0.7,
        color: '#ffffff',
        weight: 1,
        opacity: 1,
      }}
    >
      <StationPopover station={station} />
    </CircleMarker>
  );
}
