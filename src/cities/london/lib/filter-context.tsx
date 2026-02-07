'use client';

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { FilterState, TransitMode, DailyRidership } from '@/cities/london/types/transit';
import { DEFAULT_FILTER_STATE } from '@/cities/london/lib/constants';

interface FilterContextValue {
  filters: FilterState;
  setDatePreset: (preset: FilterState['dateRange']['preset']) => void;
  setCustomDateRange: (start: Date, end: Date) => void;
  toggleMode: (mode: TransitMode) => void;
  setRollingAverage: (enabled: boolean) => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

function computeDateRange(
  preset: FilterState['dateRange']['preset'],
  latestDate: Date,
): { start: Date; end: Date } {
  const end = new Date(latestDate);
  const start = new Date(latestDate);

  switch (preset) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    case 'ytd':
      start.setMonth(0, 1);
      break;
    case '1y':
      start.setFullYear(end.getFullYear() - 1);
      break;
    case 'all':
      start.setFullYear(2019, 0, 1);
      break;
    default:
      start.setFullYear(end.getFullYear() - 1);
  }

  return { start, end };
}

export function getLatestDate(data: DailyRidership[]): Date {
  if (data.length === 0) return new Date();
  return new Date(data[data.length - 1].date);
}

interface LondonFilterProviderProps {
  children: ReactNode;
  latestDate: Date;
}

export function LondonFilterProvider({ children, latestDate }: LondonFilterProviderProps) {
  const initialRange = computeDateRange(DEFAULT_FILTER_STATE.dateRange.preset, latestDate);

  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      start: initialRange.start,
      end: initialRange.end,
      preset: DEFAULT_FILTER_STATE.dateRange.preset,
    },
    activeModes: new Set(DEFAULT_FILTER_STATE.activeModes),
    rollingAverage: DEFAULT_FILTER_STATE.rollingAverage,
  });

  const setDatePreset = useCallback(
    (preset: FilterState['dateRange']['preset']) => {
      const { start, end } = computeDateRange(preset, latestDate);
      setFilters((prev) => ({
        ...prev,
        dateRange: { start, end, preset },
      }));
    },
    [latestDate],
  );

  const setCustomDateRange = useCallback((start: Date, end: Date) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: { start, end, preset: 'custom' },
    }));
  }, []);

  const toggleMode = useCallback((mode: TransitMode) => {
    setFilters((prev) => {
      const next = new Set(prev.activeModes);
      if (next.has(mode)) {
        // Don't allow deselecting the last mode
        if (next.size <= 1) return prev;
        next.delete(mode);
      } else {
        next.add(mode);
      }
      return { ...prev, activeModes: next };
    });
  }, []);

  const setRollingAverage = useCallback((enabled: boolean) => {
    setFilters((prev) => ({
      ...prev,
      rollingAverage: enabled,
    }));
  }, []);

  const value = useMemo(
    () => ({
      filters,
      setDatePreset,
      setCustomDateRange,
      toggleMode,
      setRollingAverage,
    }),
    [filters, setDatePreset, setCustomDateRange, toggleMode, setRollingAverage],
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useLondonFilters(): FilterContextValue {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useLondonFilters must be used within a LondonFilterProvider');
  }
  return context;
}

/**
 * Filter daily data by the current date range
 */
export function filterDataByDateRange(
  data: DailyRidership[],
  start: Date,
  end: Date,
): DailyRidership[] {
  const startTime = start.getTime();
  const endTime = end.getTime();
  return data.filter((d) => {
    const t = new Date(d.date).getTime();
    return t >= startTime && t <= endTime;
  });
}

/**
 * Compute 7-day rolling average for a numeric series
 */
export function computeRollingAverage(
  data: DailyRidership[],
  modes: TransitMode[],
): DailyRidership[] {
  if (data.length < 7) return data;

  return data.map((entry, i) => {
    if (i < 6) return entry;
    const window = data.slice(i - 6, i + 1);
    const averaged: DailyRidership = { ...entry };
    for (const mode of modes) {
      averaged[mode] = Math.round(window.reduce((sum, d) => sum + d[mode], 0) / 7);
    }
    averaged.total = Math.round(window.reduce((sum, d) => sum + d.total, 0) / 7);
    return averaged;
  });
}

export { computeDateRange };
