import type { TransitMode } from '@/cities/nyc/types/transit';

// MTA Mode Colors
export const MODE_COLORS: Record<TransitMode, string> = {
  subway: '#0039A6', // MTA Blue
  bus: '#FF6319', // MTA Orange
  lirr: '#FCCC0A', // LIRR Gold
  metroNorth: '#00A65C', // Metro-North Green
  accessARide: '#B933AD', // Purple
  bridgesTunnels: '#6D6E71', // Gray
  sir: '#1D5DA8', // Staten Island Railway Light Blue
};

// MTA Mode Labels
export const MODE_LABELS: Record<TransitMode, string> = {
  subway: 'Subway',
  bus: 'Bus',
  lirr: 'LIRR',
  metroNorth: 'Metro-North',
  accessARide: 'Access-A-Ride',
  bridgesTunnels: 'Bridges & Tunnels',
  sir: 'Staten Island Railway',
};

// Short labels for mobile/compact displays
export const MODE_LABELS_SHORT: Record<TransitMode, string> = {
  subway: 'Subway',
  bus: 'Bus',
  lirr: 'LIRR',
  metroNorth: 'Metro-N',
  accessARide: 'AAR',
  bridgesTunnels: 'B&T',
  sir: 'SIR',
};

// Subway line colors for station popovers
export const SUBWAY_LINE_COLORS: Record<string, string> = {
  '1': '#EE352E', // Red
  '2': '#EE352E',
  '3': '#EE352E',
  '4': '#00933C', // Green
  '5': '#00933C',
  '6': '#00933C',
  '7': '#B933AD', // Purple
  A: '#0039A6', // Blue
  C: '#0039A6',
  E: '#0039A6',
  B: '#FF6319', // Orange
  D: '#FF6319',
  F: '#FF6319',
  M: '#FF6319',
  G: '#6CBE45', // Light Green
  J: '#996633', // Brown
  Z: '#996633',
  L: '#A7A9AC', // Gray
  N: '#FCCC0A', // Yellow
  Q: '#FCCC0A',
  R: '#FCCC0A',
  W: '#FCCC0A',
  S: '#808183', // Dark Gray (Shuttle)
};

// Helper function to get mode color
export function getModeColor(mode: TransitMode): string {
  return MODE_COLORS[mode];
}

// Helper function to get mode label
export function getModeLabel(mode: TransitMode, short = false): string {
  return short ? MODE_LABELS_SHORT[mode] : MODE_LABELS[mode];
}

// Helper function to get subway line color
export function getLineColor(line: string): string {
  return SUBWAY_LINE_COLORS[line.toUpperCase()] || '#808183'; // Default to shuttle gray
}
