// Transit mode types
export type TransitMode =
  | 'subway'
  | 'bus'
  | 'lirr'
  | 'metroNorth'
  | 'accessARide'
  | 'bridgesTunnels'
  | 'sir';

// Daily ridership data for all 7 modes
export interface DailyRidership {
  date: string; // ISO date string
  subway: number;
  bus: number;
  lirr: number;
  metroNorth: number;
  accessARide: number;
  bridgesTunnels: number;
  sir: number;
  total: number;
}

// Weekly ridership aggregation
export interface WeeklyRidership {
  weekStart: string; // ISO date string for Monday of the week
  weekEnd: string;
  subway: number;
  bus: number;
  lirr: number;
  metroNorth: number;
  accessARide: number;
  bridgesTunnels: number;
  sir: number;
  total: number;
}

// Monthly ridership aggregation
export interface MonthlyRidership {
  month: string; // YYYY-MM format
  subway: number;
  bus: number;
  lirr: number;
  metroNorth: number;
  accessARide: number;
  bridgesTunnels: number;
  sir: number;
  total: number;
}

// Day of week pattern data
export interface DayOfWeekData {
  dayOfWeek:
    | 'Monday'
    | 'Tuesday'
    | 'Wednesday'
    | 'Thursday'
    | 'Friday'
    | 'Saturday'
    | 'Sunday';
  avgSubway: number;
  avgBus: number;
  avgLirr: number;
  avgMetroNorth: number;
  avgAccessARide: number;
  avgBridgesTunnels: number;
  avgSir: number;
  avgTotal: number;
}

// Recovery percentage data (vs pre-pandemic baseline)
export interface RecoveryData {
  date: string; // ISO date string
  subwayPct: number;
  busPct: number;
  lirrPct: number;
  metroNorthPct: number;
  accessARidePct: number;
  bridgesTunnelsPct: number;
  sirPct: number;
}

// Subway station data for map
export interface StationData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  lines: string[]; // e.g., ["1", "2", "3", "A", "C", "E"]
  borough: 'Manhattan' | 'Brooklyn' | 'Queens' | 'Bronx' | 'Staten Island';
  avgDailyRidership: number;
  recoveryPct: number;
}

// KPI summary data
export interface KPIData {
  totalRidership: number; // Latest day total
  change7d: number; // Percentage change vs 7 days ago
  change30d: number; // Percentage change vs 30 days ago
  recoveryPct: number; // Weighted average recovery percentage
  byMode: {
    subway: {
      ridership: number;
      change: number;
      recoveryPct: number;
    };
    bus: {
      ridership: number;
      change: number;
      recoveryPct: number;
    };
    lirr: {
      ridership: number;
      change: number;
      recoveryPct: number;
    };
    metroNorth: {
      ridership: number;
      change: number;
      recoveryPct: number;
    };
    accessARide: {
      ridership: number;
      change: number;
      recoveryPct: number;
    };
    bridgesTunnels: {
      ridership: number;
      change: number;
      recoveryPct: number;
    };
    sir: {
      ridership: number;
      change: number;
      recoveryPct: number;
    };
  };
}

// Congestion pricing impact data
export interface CongestionPricingData {
  event: 'launch' | 'pause' | 'resumption';
  date: string; // ISO date string
  before30d: {
    avgSubway: number;
    avgBridgesTunnels: number;
    avgTotal: number;
  };
  after30d: {
    avgSubway: number;
    avgBridgesTunnels: number;
    avgTotal: number;
  };
  subwayDelta: number; // Percentage change
  bridgesDelta: number; // Percentage change
}

// MTA CSV raw row (for processing)
export interface MTARawRow {
  Date: string;
  'Subways: Total Estimated Ridership': string;
  'Subways: % of Comparable Pre-Pandemic Day': string;
  'Buses: Total Estimated Ridership': string;
  'Buses: % of Comparable Pre-Pandemic Day': string;
  'LIRR: Total Estimated Ridership': string;
  'LIRR: % of Comparable Pre-Pandemic Day': string;
  'Metro-North: Total Estimated Ridership': string;
  'Metro-North: % of Comparable Pre-Pandemic Day': string;
  'Access-A-Ride: Total Scheduled Trips': string;
  'Access-A-Ride: % of Comparable Pre-Pandemic Day': string;
  'Bridges and Tunnels: Total Traffic': string;
  'Bridges and Tunnels: % of Comparable Pre-Pandemic Day': string;
  'Staten Island Railway: Total Estimated Ridership': string;
  'Staten Island Railway: % of Comparable Pre-Pandemic Day': string;
}
