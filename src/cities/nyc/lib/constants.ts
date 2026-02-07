// NYC event markers for timeline visualization
export const NYC_EVENT_MARKERS = [
  { date: '2020-03-22', label: 'NY PAUSE (Lockdown)' },
  { date: '2020-06-08', label: 'Phase 1 Reopening' },
  { date: '2021-02-01', label: 'Indoor Dining Returns' },
  { date: '2021-06-15', label: 'Full Reopening' },
  { date: '2022-01-03', label: 'Omicron Peak' },
  { date: '2024-01-05', label: 'Congestion Pricing Launch' },
  { date: '2024-06-05', label: 'Congestion Pricing Paused' },
  { date: '2025-02-01', label: 'Congestion Pricing Resumed' },
] as const;

// Congestion pricing event dates (for analysis)
export const CONGESTION_PRICING_EVENTS = {
  launch: '2024-01-05',
  pause: '2024-06-05',
  resumption: '2025-02-01',
} as const;

// Borough names
export const BOROUGHS = [
  'Manhattan',
  'Brooklyn',
  'Queens',
  'Bronx',
  'Staten Island',
] as const;

// Days of week in order
export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

// Date range presets
export const DATE_RANGE_PRESETS = {
  '7d': { days: 7, label: '7 Days' },
  '30d': { days: 30, label: '30 Days' },
  '90d': { days: 90, label: '90 Days' },
  ytd: { label: 'Year to Date' },
  '1y': { days: 365, label: '1 Year' },
  all: { label: 'All Data' },
  custom: { label: 'Custom' },
} as const;
