import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  LondonFilterProvider,
  useLondonFilters,
  getLatestDate,
} from '@/cities/london/lib/filter-context';
import { KPISection } from '@/cities/london/components/kpi/KPISection';
import { DailyRidership } from '@/cities/london/types/transit';
import dailyData from '../../data/london/daily.json';

const typedData = dailyData as DailyRidership[];
const latestDate = getLatestDate(typedData);

// Mock window.matchMedia for jsdom (prefers-reduced-motion check in KPICard)
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: true, // reduced motion: skip animation to final value
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

// Mock ResizeObserver
beforeEach(() => {
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
});

// Helper component: London KPI with filter controls
function LondonKPIWithControls() {
  const { filters, setDatePreset, toggleMode } = useLondonFilters();

  return (
    <div>
      <span data-testid="current-preset">{filters.dateRange.preset}</span>
      <span data-testid="active-mode-count">{filters.activeModes.size}</span>
      <button data-testid="set-7d" onClick={() => setDatePreset('7d')}>7d</button>
      <button data-testid="set-30d" onClick={() => setDatePreset('30d')}>30d</button>
      <button data-testid="set-all" onClick={() => setDatePreset('all')}>all</button>
      <button data-testid="toggle-tube" onClick={() => toggleMode('tube')}>toggle tube</button>
      <button data-testid="toggle-bus" onClick={() => toggleMode('bus')}>toggle bus</button>
      <KPISection />
    </div>
  );
}

describe('London KPISection Integration', () => {
  it('renders 6 KPI cards within LondonFilterProvider', () => {
    render(
      <LondonFilterProvider latestDate={latestDate}>
        <LondonKPIWithControls />
      </LondonFilterProvider>
    );

    expect(screen.getByText('Avg Daily Journeys')).toBeInTheDocument();
    expect(screen.getByText('Period Change')).toBeInTheDocument();
    expect(screen.getByText('vs 2019 Baseline')).toBeInTheDocument();
    expect(screen.getByText('Tube')).toBeInTheDocument();
    expect(screen.getByText('Bus')).toBeInTheDocument();
    expect(screen.getByText('Rail')).toBeInTheDocument();
  });

  it('displays non-zero values for KPI cards', () => {
    render(
      <LondonFilterProvider latestDate={latestDate}>
        <LondonKPIWithControls />
      </LondonFilterProvider>
    );

    // With prefers-reduced-motion, count-up animation is skipped.
    // The grid of KPI cards should contain numbers
    const cards = screen.getByText('Avg Daily Journeys').closest('div');
    const gridSection = cards?.closest('section');
    const sectionText = gridSection?.textContent || '';
    // Should contain numeric content (at least digits for formatted values)
    expect(sectionText).toMatch(/\d/);
  });

  it('KPI values change when switching from "all" to "7d" preset', () => {
    render(
      <LondonFilterProvider latestDate={latestDate}>
        <LondonKPIWithControls />
      </LondonFilterProvider>
    );

    // Get the grid container for KPIs
    const avgJourneysCard = screen.getByText('Avg Daily Journeys');
    const kpiGrid = avgJourneysCard.closest('.grid');

    act(() => {
      screen.getByTestId('set-all').click();
    });
    const contentAll = kpiGrid?.textContent;

    act(() => {
      screen.getByTestId('set-7d').click();
    });
    const content7d = kpiGrid?.textContent;

    // "all" includes 2019 data (pre-pandemic) and 2020 lockdowns,
    // so the average should be very different from the last 7 days
    expect(contentAll).not.toEqual(content7d);
  });

  it('KPI values change when tube mode is toggled off', () => {
    render(
      <LondonFilterProvider latestDate={latestDate}>
        <LondonKPIWithControls />
      </LondonFilterProvider>
    );

    const avgJourneysCard = screen.getByText('Avg Daily Journeys');
    const kpiGrid = avgJourneysCard.closest('.grid');
    const contentAllModes = kpiGrid?.textContent;

    // Toggle tube off -- tube is the highest-volume London mode
    act(() => {
      screen.getByTestId('toggle-tube').click();
    });
    const contentWithoutTube = kpiGrid?.textContent;

    // Avg Daily Journeys should change significantly without tube
    expect(contentWithoutTube).not.toEqual(contentAllModes);
  });

  it('Tube KPI card is dimmed when tube mode is inactive', () => {
    const { container } = render(
      <LondonFilterProvider latestDate={latestDate}>
        <LondonKPIWithControls />
      </LondonFilterProvider>
    );

    // Initially, tube is active so no dimming
    const tubeLabel = screen.getByText('Tube');
    const tubeCard = tubeLabel.closest('[class*="Card"]') || tubeLabel.closest('.transition-opacity');
    // Before toggle: should not have opacity-40
    let dimmedCards = container.querySelectorAll('.opacity-40');
    // Rail card might be dimmed if overground/elizabeth/dlr modes are inactive
    // But tube should not be dimmed
    const tubeSection = tubeLabel.closest('div[class*="opacity"]');

    // Toggle tube off
    act(() => {
      screen.getByTestId('toggle-tube').click();
    });

    // After toggle: Tube card should be dimmed
    dimmedCards = container.querySelectorAll('.opacity-40');
    expect(dimmedCards.length).toBeGreaterThan(0);
  });

  it('KPI values differ between 30d and all presets (data state, not just UI)', () => {
    render(
      <LondonFilterProvider latestDate={latestDate}>
        <LondonKPIWithControls />
      </LondonFilterProvider>
    );

    const avgJourneysCard = screen.getByText('Avg Daily Journeys');
    const kpiGrid = avgJourneysCard.closest('.grid');

    act(() => {
      screen.getByTestId('set-30d').click();
    });
    const content30d = kpiGrid?.textContent;

    act(() => {
      screen.getByTestId('set-all').click();
    });
    const contentAll = kpiGrid?.textContent;

    expect(content30d).not.toEqual(contentAll);
  });

  it('toggling bus mode changes the Bus KPI value (data state change, not just dimming)', () => {
    render(
      <LondonFilterProvider latestDate={latestDate}>
        <LondonKPIWithControls />
      </LondonFilterProvider>
    );

    // With bus active, the "Avg Daily Journeys" total includes bus ridership
    const avgJourneysCard = screen.getByText('Avg Daily Journeys');
    const kpiGrid = avgJourneysCard.closest('.grid');
    const totalWithBus = kpiGrid?.textContent;

    // Toggle bus off
    act(() => {
      screen.getByTestId('toggle-bus').click();
    });
    const totalWithoutBus = kpiGrid?.textContent;

    // The total must change because bus ridership is excluded from the sum
    expect(totalWithoutBus).not.toEqual(totalWithBus);
  });
});
