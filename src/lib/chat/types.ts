import type { CityId } from '@/types/shared';

// ---- Chat request / response ----

export interface ChatRequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  city: CityId | null;
  filters?: {
    datePreset: string;
    activeModes: string[];
  };
}

// ---- Tool parameter types ----

export interface DateRange {
  start: string; // ISO date string e.g. '2023-01-01'
  end: string;
}

export interface QueryRidershipParams {
  city: CityId;
  modes: string[];
  date_range: DateRange;
  aggregation: 'daily' | 'weekly' | 'monthly';
}

export interface CompareCitiesParams {
  metric: 'ridership' | 'recovery' | 'dow_pattern';
  modes_nyc: string[];
  modes_london: string[];
  date_range: DateRange;
  aggregation?: 'daily' | 'weekly' | 'monthly';
}

export interface GetStatisticsParams {
  city: CityId;
  mode: string;
  date_range: DateRange;
}

export interface GetRecoveryDataParams {
  city: CityId;
  modes: string[];
  date_range?: DateRange;
}

export interface GetDayOfWeekPatternsParams {
  city: CityId;
  modes: string[];
}

export interface GetAnomaliesParams {
  city: CityId;
  mode: string;
  date_range: DateRange;
  threshold?: number;
}

// ---- Tool result types ----

export interface QueryRidershipResult {
  city: string;
  aggregation: string;
  date_range: DateRange;
  record_count: number;
  data: Array<Record<string, number | string>>;
}

export interface CompareCitiesResult {
  metric: string;
  date_range: DateRange;
  nyc: {
    modes: string[];
    data: Array<Record<string, number | string>>;
    summary: { avg_total: number; min_total: number; max_total: number };
  };
  london: {
    modes: string[];
    data: Array<Record<string, number | string>>;
    summary: { avg_total: number; min_total: number; max_total: number };
  };
}

export interface GetStatisticsResult {
  city: string;
  mode: string;
  date_range: DateRange;
  record_count: number;
  statistics: {
    mean: number;
    median: number;
    min: { value: number; date: string };
    max: { value: number; date: string };
    std_dev: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    trend_pct_change: number;
  };
}

export interface GetRecoveryDataResult {
  city: string;
  modes: string[];
  date_range: DateRange;
  record_count: number;
  data: Array<Record<string, number | string | null>>;
  latest: Record<string, { recovery_pct: number; date: string }>;
}

export interface DowDataRow {
  day: string;
  total: number;
  [mode: string]: number | string;
}

export interface GetDayOfWeekPatternsResult {
  city: string;
  modes: string[];
  data: DowDataRow[];
  insights: {
    peak_day: string;
    trough_day: string;
    weekday_avg: number;
    weekend_avg: number;
    weekday_weekend_ratio: number;
  };
}

export interface AnomalyEntry {
  date: string;
  value: number;
  deviation: number;
  direction: 'high' | 'low';
  day_of_week: string;
}

export interface GetAnomaliesResult {
  city: string;
  mode: string;
  date_range: DateRange;
  threshold: number;
  baseline: { mean: number; std_dev: number };
  anomalies: AnomalyEntry[];
  anomaly_count: number;
}

// ---- Data file types ----

export interface NycDailyRecord {
  date: string;
  subway: number;
  bus: number;
  lirr: number;
  metroNorth: number;
  accessARide: number;
  bridgesTunnels: number;
  sir: number;
  total: number;
}

export interface LondonDailyRecord {
  date: string;
  tube: number;
  bus: number;
  overground: number;
  elizabeth: number;
  dlr: number;
  tram: number;
  total: number;
}

export interface NycWeeklyRecord {
  weekStart: string;
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

export interface LondonWeeklyRecord {
  date: string;
  tube: number;
  bus: number;
  overground: number;
  elizabeth: number;
  dlr: number;
  tram: number;
  total: number;
}

export interface NycMonthlyRecord {
  month: string;
  subway: number;
  bus: number;
  lirr: number;
  metroNorth: number;
  accessARide: number;
  bridgesTunnels: number;
  sir: number;
  total: number;
}

export interface LondonMonthlyRecord {
  date: string;
  tube: number;
  bus: number;
  overground: number;
  elizabeth: number;
  dlr: number;
  tram: number;
  total: number;
}

export interface NycRecoveryRecord {
  date: string;
  subwayPct: number;
  busPct: number;
  lirrPct: number;
  metroNorthPct: number;
  accessARidePct: number;
  bridgesTunnelsPct: number;
  sirPct: number;
}

export interface LondonRecoveryRecord {
  date: string;
  tubePct: number;
  busPct: number;
  overgroundPct: number;
  elizabethPct: number | null;
  dlrPct: number;
  tramPct: number;
  overallPct: number;
}

export interface NycDowRecord {
  dayOfWeek: string;
  avgSubway: number;
  avgBus: number;
  avgLirr: number;
  avgMetroNorth: number;
  avgAccessARide: number;
  avgBridgesTunnels: number;
  avgSir: number;
  avgTotal: number;
}

export interface LondonDowRecord {
  dayOfWeek: number;
  dayName: string;
  avgTube: number;
  avgBus: number;
  avgOverground: number;
  avgElizabeth: number;
  avgDlr: number;
  avgTram: number;
  avgTotal: number;
}

export interface NycKpi {
  totalRidership: number;
  change7d: number;
  change30d: number;
  recoveryPct: number;
  byMode: Record<
    string,
    { ridership: number; change: number; recoveryPct: number }
  >;
}

export interface LondonKpi {
  totalJourneys: number;
  change7d: number;
  change30d: number;
  recoveryPct: number;
  byMode: Record<
    string,
    { current: number; change7d: number; recoveryPct: number | null }
  >;
  lastUpdated: string;
}

// Mode name constants for each city
export const NYC_MODES = [
  'subway',
  'bus',
  'lirr',
  'metroNorth',
  'accessARide',
  'bridgesTunnels',
  'sir',
] as const;

export const LONDON_MODES = [
  'tube',
  'bus',
  'overground',
  'elizabeth',
  'dlr',
  'tram',
] as const;

export type NycMode = (typeof NYC_MODES)[number];
export type LondonMode = (typeof LONDON_MODES)[number];
