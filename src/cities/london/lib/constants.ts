import { TransitMode } from '@/cities/london/types/transit';

// Pandemic event markers (UK dates)
export const PANDEMIC_EVENTS = [
  { date: '2020-03-23', label: 'UK National Lockdown' },
  { date: '2020-06-15', label: 'Face Coverings Required' },
  { date: '2021-01-06', label: 'Third National Lockdown' },
  { date: '2021-07-19', label: 'Freedom Day' },
  { date: '2022-02-24', label: 'Plan B Restrictions End' },
  { date: '2023-03-01', label: 'Elizabeth Line Full Service' },
];

// Default filter state
export const DEFAULT_FILTER_STATE = {
  dateRange: {
    preset: '1y' as const,
  },
  activeModes: new Set<TransitMode>(['tube', 'bus', 'overground', 'elizabeth', 'dlr']),
  rollingAverage: false,
};

// Responsive breakpoints (in pixels)
export const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280,
};

// Chart dimensions
export const CHART_HEIGHTS = {
  desktop: {
    trend: 400,
    map: 500,
    recovery: 500,
    dayOfWeek: 350,
    modeComparison: 350,
  },
  tablet: {
    trend: 350,
    map: 400,
    recovery: 400,
    dayOfWeek: 300,
    modeComparison: 300,
  },
  mobile: {
    trend: 300,
    map: 350,
    recovery: 350,
    dayOfWeek: 280,
    modeComparison: 280,
  },
};
