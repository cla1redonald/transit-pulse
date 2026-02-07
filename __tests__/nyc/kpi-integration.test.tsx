import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { NycFilterProvider, useNycFilters } from '@/cities/nyc/lib/filter-context';
import { KPISection } from '@/cities/nyc/components/kpi/KPISection';

// Mock window.matchMedia for jsdom (prefers-reduced-motion check in KPICard)
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: true, // Simulate reduced motion so animation skips immediately to final value
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

// Mock ResizeObserver which Recharts may use
beforeEach(() => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

// Helper component to change filters and re-render KPISection
function NycKPIWithControls() {
  const { setPreset, toggleMode, dateRange, activeModes } = useNycFilters();

  return (
    <div>
      <span data-testid="current-preset">{dateRange.preset}</span>
      <span data-testid="active-mode-count">{activeModes.size}</span>
      <button data-testid="set-7d" onClick={() => setPreset('7d')}>7d</button>
      <button data-testid="set-30d" onClick={() => setPreset('30d')}>30d</button>
      <button data-testid="set-all" onClick={() => setPreset('all')}>all</button>
      <button data-testid="toggle-subway" onClick={() => toggleMode('subway')}>toggle subway</button>
      <button data-testid="toggle-bus" onClick={() => toggleMode('bus')}>toggle bus</button>
      <KPISection />
    </div>
  );
}

describe('NYC KPISection Integration', () => {
  it('renders 3 KPI cards within NycFilterProvider', () => {
    render(
      <NycFilterProvider>
        <NycKPIWithControls />
      </NycFilterProvider>
    );

    expect(screen.getByText('Avg Daily Ridership')).toBeInTheDocument();
    expect(screen.getByText('Period Change')).toBeInTheDocument();
    expect(screen.getByText('vs. Pre-Pandemic')).toBeInTheDocument();
  });

  it('renders KPI section with "Overview" heading', () => {
    render(
      <NycFilterProvider>
        <NycKPIWithControls />
      </NycFilterProvider>
    );

    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('displays a non-zero value for Avg Daily Ridership on default preset', () => {
    render(
      <NycFilterProvider>
        <NycKPIWithControls />
      </NycFilterProvider>
    );

    // KPICard displays formatted numbers. The "Avg Daily Ridership" card should show a non-zero value.
    // With prefers-reduced-motion, the count-up animation is skipped and final value is shown immediately.
    const kpiSection = screen.getByLabelText('Key Performance Indicators');
    // The value should contain at least one digit
    const textContent = kpiSection.textContent || '';
    // There should be numeric content (M/K for millions/thousands or digits)
    expect(textContent).toMatch(/\d/);
  });

  it('KPI values change when switching from "all" to "7d" preset', async () => {
    render(
      <NycFilterProvider>
        <NycKPIWithControls />
      </NycFilterProvider>
    );

    // Get the KPI section content with default 1y preset
    const kpiSection = screen.getByLabelText('Key Performance Indicators');
    const content1y = kpiSection.textContent;

    // Switch to 'all' to get all data
    act(() => {
      screen.getByTestId('set-all').click();
    });
    const contentAll = kpiSection.textContent;

    // Switch to 7d to get a very small window
    act(() => {
      screen.getByTestId('set-7d').click();
    });
    const content7d = kpiSection.textContent;

    // The computed values should differ between "all" and "7d" ranges
    // because different date ranges include different amounts of data
    expect(contentAll).not.toEqual(content7d);
  });

  it('KPI values change when a transit mode is toggled off', () => {
    render(
      <NycFilterProvider>
        <NycKPIWithControls />
      </NycFilterProvider>
    );

    const kpiSection = screen.getByLabelText('Key Performance Indicators');
    const contentAllModes = kpiSection.textContent;

    // Toggle subway off -- subway is the highest-volume NYC mode
    act(() => {
      screen.getByTestId('toggle-subway').click();
    });
    const contentWithoutSubway = kpiSection.textContent;

    // Avg Daily Ridership should be lower without subway
    expect(contentWithoutSubway).not.toEqual(contentAllModes);
  });

  it('KPI values differ between 30d and all presets (verifying data state change, not just UI)', () => {
    render(
      <NycFilterProvider>
        <NycKPIWithControls />
      </NycFilterProvider>
    );

    const kpiSection = screen.getByLabelText('Key Performance Indicators');

    act(() => {
      screen.getByTestId('set-30d').click();
    });
    const content30d = kpiSection.textContent;

    act(() => {
      screen.getByTestId('set-all').click();
    });
    const contentAll = kpiSection.textContent;

    // The "all" range averages across pandemic-era data (much lower ridership),
    // so the average should differ from the most recent 30 days
    expect(content30d).not.toEqual(contentAll);
  });
});
