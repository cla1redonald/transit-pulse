import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  LondonFilterProvider,
  useLondonFilters,
  getLatestDate,
} from '@/cities/london/lib/filter-context';
import { RidershipTrendChart } from '@/cities/london/components/charts/RidershipTrendChart';
import { DailyRidership } from '@/cities/london/types/transit';
import dailyData from '../../data/london/daily.json';

const typedData = dailyData as DailyRidership[];
const latestDate = getLatestDate(typedData);

// Mock Recharts to avoid ResponsiveContainer issues in jsdom
vi.mock('recharts', () => {
  const React = require('react');
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      React.createElement('div', { 'data-testid': 'responsive-container' }, children),
    LineChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) =>
      React.createElement('div', { 'data-testid': 'line-chart', 'data-points': data?.length ?? 0 }, children),
    Line: ({ dataKey, name }: { dataKey: string; name: string }) =>
      React.createElement('div', { 'data-testid': `line-${dataKey}`, 'data-name': name }),
    XAxis: () => React.createElement('div', { 'data-testid': 'x-axis' }),
    YAxis: () => React.createElement('div', { 'data-testid': 'y-axis' }),
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => null,
  };
});

// Mock window.matchMedia
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Test harness with filter controls + chart
function LondonChartWithControls() {
  const { filters, setDatePreset, toggleMode, setRollingAverage } = useLondonFilters();

  return (
    <div>
      <span data-testid="active-mode-count">{filters.activeModes.size}</span>
      <span data-testid="rolling">{filters.rollingAverage ? 'on' : 'off'}</span>
      <button data-testid="set-7d" onClick={() => setDatePreset('7d')}>7d</button>
      <button data-testid="set-30d" onClick={() => setDatePreset('30d')}>30d</button>
      <button data-testid="set-all" onClick={() => setDatePreset('all')}>all</button>
      <button data-testid="toggle-tube" onClick={() => toggleMode('tube')}>toggle tube</button>
      <button data-testid="toggle-rolling" onClick={() => setRollingAverage(!filters.rollingAverage)}>
        toggle rolling
      </button>
      <RidershipTrendChart />
    </div>
  );
}

describe('London RidershipTrendChart Integration', () => {
  it('renders the chart within LondonFilterProvider', () => {
    render(
      <LondonFilterProvider latestDate={latestDate}>
        <LondonChartWithControls />
      </LondonFilterProvider>
    );
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders lines for active modes (5 by default, tram excluded)', () => {
    render(
      <LondonFilterProvider latestDate={latestDate}>
        <LondonChartWithControls />
      </LondonFilterProvider>
    );

    // Default active modes: tube, bus, overground, elizabeth, dlr (5)
    expect(screen.getByTestId('line-tube')).toBeInTheDocument();
    expect(screen.getByTestId('line-bus')).toBeInTheDocument();
    expect(screen.getByTestId('line-overground')).toBeInTheDocument();
    expect(screen.getByTestId('line-elizabeth')).toBeInTheDocument();
    expect(screen.getByTestId('line-dlr')).toBeInTheDocument();
    // Tram is excluded by default
    expect(screen.queryByTestId('line-tram')).not.toBeInTheDocument();
  });

  it('removes a line when a mode is toggled off', () => {
    render(
      <LondonFilterProvider latestDate={latestDate}>
        <LondonChartWithControls />
      </LondonFilterProvider>
    );

    expect(screen.getByTestId('line-tube')).toBeInTheDocument();

    act(() => {
      screen.getByTestId('toggle-tube').click();
    });

    expect(screen.queryByTestId('line-tube')).not.toBeInTheDocument();
    // Other lines should still exist
    expect(screen.getByTestId('line-bus')).toBeInTheDocument();
  });

  it('chart data point count changes when preset changes', () => {
    render(
      <LondonFilterProvider latestDate={latestDate}>
        <LondonChartWithControls />
      </LondonFilterProvider>
    );

    const chart = screen.getByTestId('line-chart');

    act(() => {
      screen.getByTestId('set-7d').click();
    });
    const points7d = Number(chart.getAttribute('data-points'));

    act(() => {
      screen.getByTestId('set-all').click();
    });
    const pointsAll = Number(chart.getAttribute('data-points'));

    // "all" includes data from 2019, should have more points than 7d
    expect(pointsAll).toBeGreaterThan(points7d);
  });

  it('chart uses correct mode labels from colors.ts', () => {
    render(
      <LondonFilterProvider latestDate={latestDate}>
        <LondonChartWithControls />
      </LondonFilterProvider>
    );

    const tubeLine = screen.getByTestId('line-tube');
    expect(tubeLine.getAttribute('data-name')).toBe('Tube');

    const busLine = screen.getByTestId('line-bus');
    expect(busLine.getAttribute('data-name')).toBe('Bus');
  });

  it('chart renders "Ridership Trends" heading', () => {
    render(
      <LondonFilterProvider latestDate={latestDate}>
        <LondonChartWithControls />
      </LondonFilterProvider>
    );

    expect(screen.getByText('Ridership Trends')).toBeInTheDocument();
  });

  it('chart has a 7-day rolling average toggle', () => {
    render(
      <LondonFilterProvider latestDate={latestDate}>
        <LondonChartWithControls />
      </LondonFilterProvider>
    );

    expect(screen.getByText('7-day avg')).toBeInTheDocument();
    // The switch element
    expect(screen.getByRole('switch')).toBeInTheDocument();
  });
});
