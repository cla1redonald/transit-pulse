import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { NycFilterProvider, useNycFilters } from '@/cities/nyc/lib/filter-context';
import { RidershipTrendChart } from '@/cities/nyc/components/charts/RidershipTrendChart';

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
function NycChartWithControls() {
  const { setPreset, toggleMode, activeModes } = useNycFilters();

  return (
    <div>
      <span data-testid="active-mode-count">{activeModes.size}</span>
      <button data-testid="set-7d" onClick={() => setPreset('7d')}>7d</button>
      <button data-testid="set-all" onClick={() => setPreset('all')}>all</button>
      <button data-testid="toggle-subway" onClick={() => toggleMode('subway')}>toggle subway</button>
      <RidershipTrendChart />
    </div>
  );
}

describe('NYC RidershipTrendChart Integration', () => {
  it('renders the chart within NycFilterProvider', () => {
    render(
      <NycFilterProvider>
        <NycChartWithControls />
      </NycFilterProvider>
    );
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders a line for each active mode by default (7 modes)', () => {
    render(
      <NycFilterProvider>
        <NycChartWithControls />
      </NycFilterProvider>
    );

    // All 7 NYC modes should have lines
    expect(screen.getByTestId('line-subway')).toBeInTheDocument();
    expect(screen.getByTestId('line-bus')).toBeInTheDocument();
    expect(screen.getByTestId('line-lirr')).toBeInTheDocument();
    expect(screen.getByTestId('line-metroNorth')).toBeInTheDocument();
    expect(screen.getByTestId('line-accessARide')).toBeInTheDocument();
    expect(screen.getByTestId('line-bridgesTunnels')).toBeInTheDocument();
    expect(screen.getByTestId('line-sir')).toBeInTheDocument();
  });

  it('removes a line when a mode is toggled off', () => {
    render(
      <NycFilterProvider>
        <NycChartWithControls />
      </NycFilterProvider>
    );

    expect(screen.getByTestId('line-subway')).toBeInTheDocument();

    act(() => {
      screen.getByTestId('toggle-subway').click();
    });

    expect(screen.queryByTestId('line-subway')).not.toBeInTheDocument();
    // Other lines should still exist
    expect(screen.getByTestId('line-bus')).toBeInTheDocument();
  });

  it('chart data point count changes when preset changes', () => {
    render(
      <NycFilterProvider>
        <NycChartWithControls />
      </NycFilterProvider>
    );

    const chart = screen.getByTestId('line-chart');
    const pointsDefault = Number(chart.getAttribute('data-points'));

    act(() => {
      screen.getByTestId('set-7d').click();
    });
    const points7d = Number(chart.getAttribute('data-points'));

    act(() => {
      screen.getByTestId('set-all').click();
    });
    const pointsAll = Number(chart.getAttribute('data-points'));

    // "all" should have more data points than "7d"
    expect(pointsAll).toBeGreaterThan(points7d);
  });

  it('chart uses correct mode labels from colors.ts', () => {
    render(
      <NycFilterProvider>
        <NycChartWithControls />
      </NycFilterProvider>
    );

    const subwayLine = screen.getByTestId('line-subway');
    expect(subwayLine.getAttribute('data-name')).toBe('Subway');

    const busLine = screen.getByTestId('line-bus');
    expect(busLine.getAttribute('data-name')).toBe('Bus');
  });
});
