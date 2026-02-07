'use client';

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from 'react';
import { subDays, startOfYear, parse } from 'date-fns';
import type { TransitMode, DailyRidership } from '@/cities/nyc/types/transit';

export type DatePreset =
  | '7d'
  | '30d'
  | '90d'
  | 'ytd'
  | '1y'
  | 'all'
  | 'custom';

interface DateRange {
  start: Date;
  end: Date;
  preset: DatePreset;
}

interface FilterState {
  dateRange: DateRange;
  activeModes: Set<TransitMode>;
  rollingAverage: boolean;
}

interface FilterContextValue extends FilterState {
  setDateRange: (range: DateRange) => void;
  setPreset: (preset: DatePreset) => void;
  toggleMode: (mode: TransitMode) => void;
  setRollingAverage: (enabled: boolean) => void;
  filterDataByDateRange: <T extends { date: string }>(data: T[]) => T[];
  computeDateRange: (
    preset: DatePreset,
    customStart?: Date,
    customEnd?: Date
  ) => DateRange;
}

const FilterContext = createContext<FilterContextValue | null>(null);

// All modes active by default
const DEFAULT_ACTIVE_MODES = new Set<TransitMode>([
  'subway',
  'bus',
  'lirr',
  'metroNorth',
  'accessARide',
  'bridgesTunnels',
  'sir',
]);

// Default to 1 year
// Use latest data date (2025-01-09) instead of "today" since data is static
const LATEST_DATA_DATE = new Date('2025-01-09');

const computeInitialDateRange = (): DateRange => {
  const end = LATEST_DATA_DATE;
  const start = subDays(end, 365);
  return { start, end, preset: '1y' };
};

export function NycFilterProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>(
    computeInitialDateRange()
  );
  const [activeModes, setActiveModes] =
    useState<Set<TransitMode>>(DEFAULT_ACTIVE_MODES);
  const [rollingAverage, setRollingAverage] = useState(false);

  const computeDateRange = useMemo(
    () =>
      (
        preset: DatePreset,
        customStart?: Date,
        customEnd?: Date
      ): DateRange => {
        // Use latest data date instead of "today" since data is static
        const latestDate = LATEST_DATA_DATE;

        switch (preset) {
          case '7d':
            return { start: subDays(latestDate, 7), end: latestDate, preset };
          case '30d':
            return { start: subDays(latestDate, 30), end: latestDate, preset };
          case '90d':
            return { start: subDays(latestDate, 90), end: latestDate, preset };
          case 'ytd':
            return {
              start: startOfYear(latestDate),
              end: latestDate,
              preset,
            };
          case '1y':
            return { start: subDays(latestDate, 365), end: latestDate, preset };
          case 'all':
            // MTA data starts March 2020
            return {
              start: new Date('2020-03-01'),
              end: latestDate,
              preset,
            };
          case 'custom':
            if (!customStart || !customEnd) {
              return {
                start: subDays(latestDate, 365),
                end: latestDate,
                preset: '1y',
              };
            }
            return { start: customStart, end: customEnd, preset };
          default:
            return {
              start: subDays(latestDate, 365),
              end: latestDate,
              preset: '1y',
            };
        }
      },
    []
  );

  const setPreset = (preset: DatePreset) => {
    const range = computeDateRange(preset);
    setDateRange(range);
  };

  const toggleMode = (mode: TransitMode) => {
    setActiveModes((prev) => {
      const next = new Set(prev);
      if (next.has(mode)) {
        // Prevent deselecting all modes
        if (next.size === 1) {
          return prev;
        }
        next.delete(mode);
      } else {
        next.add(mode);
      }
      return next;
    });
  };

  const filterDataByDateRange = <T extends { date: string }>(
    data: T[]
  ): T[] => {
    const startTime = dateRange.start.getTime();
    const endTime = dateRange.end.getTime();

    return data.filter((item) => {
      const itemDate = parse(item.date, 'yyyy-MM-dd', new Date());
      const itemTime = itemDate.getTime();
      return itemTime >= startTime && itemTime <= endTime;
    });
  };

  const value: FilterContextValue = {
    dateRange,
    activeModes,
    rollingAverage,
    setDateRange,
    setPreset,
    toggleMode,
    setRollingAverage,
    filterDataByDateRange,
    computeDateRange,
  };

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}

export function useNycFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useNycFilters must be used within a NycFilterProvider');
  }
  return context;
}

// Keep backward-compatible alias
export const useFilters = useNycFilters;
