'use client';

import dynamic from 'next/dynamic';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { GlobalFilters } from './filters/GlobalFilters';
import { KPISection } from './kpi/KPISection';
import { RidershipTrendChart } from './charts/RidershipTrendChart';
import { ModeComparisonChart } from './charts/ModeComparisonChart';
import { PandemicRecoveryChart } from './charts/PandemicRecoveryChart';
import { CongestionPricingChart } from './charts/CongestionPricingChart';
import { DayOfWeekChart } from './charts/DayOfWeekChart';

const StationMap = dynamic(
  () =>
    import('./map/StationMap').then((mod) => ({
      default: mod.StationMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] md:h-[500px] rounded-xl border border-border bg-card shadow-sm flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    ),
  }
);

export function NycDashboard() {
  return (
    <DashboardShell>
      {/* Sticky Global Filters */}
      <GlobalFilters />

      {/* Main Dashboard Content */}
      <div className="space-y-8 mt-6">
        {/* KPI Overview Section */}
        <KPISection />

        {/* Ridership Trends Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Ridership Trends
            </h2>
            <p className="text-sm text-muted-foreground">
              Daily ridership patterns across all MTA transit modes
            </p>
          </div>
          <RidershipTrendChart />
        </section>

        {/* Mode Breakdown Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Mode Breakdown
            </h2>
            <p className="text-sm text-muted-foreground">
              Transit mode composition over time
            </p>
          </div>
          <ModeComparisonChart />
        </section>

        {/* Pandemic Recovery Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Pandemic Recovery
            </h2>
            <p className="text-sm text-muted-foreground">
              Recovery progress compared to pre-pandemic levels
            </p>
          </div>
          <PandemicRecoveryChart />
        </section>

        {/* Congestion Pricing Impact Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Congestion Pricing Impact
            </h2>
            <p className="text-sm text-muted-foreground">
              Ridership changes around congestion pricing events
            </p>
          </div>
          <CongestionPricingChart />
        </section>

        {/* Two-Column Grid: Map and Day-of-Week */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Subway Station Map */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Subway Station Map
              </h2>
              <p className="text-sm text-muted-foreground">
                Interactive map of subway stations by ridership intensity
              </p>
            </div>
            <StationMap />
          </section>

          {/* Day-of-Week Patterns */}
          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Day-of-Week Patterns
              </h2>
              <p className="text-sm text-muted-foreground">
                Average ridership by day of the week
              </p>
            </div>
            <DayOfWeekChart />
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
