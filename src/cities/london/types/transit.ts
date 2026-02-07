export type TransitMode = 'tube' | 'bus' | 'overground' | 'elizabeth' | 'dlr' | 'tram';

export interface DailyRidership {
  date: string; // ISO date string YYYY-MM-DD
  tube: number;
  bus: number;
  overground: number;
  elizabeth: number;
  dlr: number;
  tram: number;
  total: number;
}

export interface WeeklyRidership extends DailyRidership {} // Same shape, aggregated

export interface MonthlyRidership extends DailyRidership {}

export interface DayOfWeekData {
  dayOfWeek: number; // 0=Monday, 6=Sunday
  dayName: string;
  avgTube: number;
  avgBus: number;
  avgOverground: number;
  avgElizabeth: number;
  avgDlr: number;
  avgTram: number;
  avgTotal: number;
}

export interface RecoveryData {
  date: string;
  tubePct: number;
  busPct: number;
  overgroundPct: number;
  elizabethPct: number | null; // null before 2022
  dlrPct: number;
  tramPct: number;
  overallPct: number;
}

export interface KPIData {
  totalJourneys: number;
  change7d: number;
  change30d: number;
  recoveryPct: number;
  byMode: Record<
    TransitMode,
    {
      current: number;
      change7d: number;
      recoveryPct: number | null;
    }
  >;
  lastUpdated: string;
}

export interface StationData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  avgDailyJourneys: number;
  zone: number;
  lines: string[];
  recoveryPct: number;
}

export interface FilterState {
  dateRange: {
    start: Date;
    end: Date;
    preset: '7d' | '30d' | '90d' | 'ytd' | '1y' | 'all' | 'custom';
  };
  activeModes: Set<TransitMode>;
  rollingAverage: boolean;
}
