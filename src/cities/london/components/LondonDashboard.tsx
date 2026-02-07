'use client';

import dynamic from 'next/dynamic';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AnimatedSection } from '@/components/layout/AnimatedSection';
import { KPISection } from '@/cities/london/components/kpi/KPISection';
import { GlobalFilters } from '@/cities/london/components/filters/GlobalFilters';
import { RidershipTrendChart } from '@/cities/london/components/charts/RidershipTrendChart';
import { ModeComparisonChart } from '@/cities/london/components/charts/ModeComparisonChart';
import { PandemicRecoveryChart } from '@/cities/london/components/charts/PandemicRecoveryChart';
import { DayOfWeekChart } from '@/cities/london/components/charts/DayOfWeekChart';
import { ChartSkeleton } from '@/cities/london/components/charts/ChartSkeleton';

const StationMap = dynamic(() => import('@/cities/london/components/map/StationMap'), {
  ssr: false,
  loading: () => <ChartSkeleton height={500} />,
});

export function LondonDashboard() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Global Filters - sticky below header */}
        <GlobalFilters />

        {/* KPI Cards */}
        <AnimatedSection>
          <KPISection />
        </AnimatedSection>

        {/* Ridership Trend Chart - full width */}
        <AnimatedSection
          as="section"
          aria-label="Ridership trends"
          className="bg-[hsl(var(--surface))] rounded-lg border border-border p-4 md:p-6"
        >
          <RidershipTrendChart />
        </AnimatedSection>

        {/* Two-column: Map + Recovery */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnimatedSection
            as="section"
            aria-label="Station activity map"
            className="bg-[hsl(var(--surface))] rounded-lg border border-border p-4 md:p-6"
          >
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">Station Activity</h2>
              <p className="text-sm text-muted-foreground">
                Tube station ridership intensity across London
              </p>
            </div>
            <StationMap />
          </AnimatedSection>

          <AnimatedSection
            as="section"
            aria-label="Pandemic recovery"
            className="bg-[hsl(var(--surface))] rounded-lg border border-border p-4 md:p-6"
          >
            <PandemicRecoveryChart />
          </AnimatedSection>
        </div>

        {/* Day-of-Week Patterns - full width */}
        <AnimatedSection
          as="section"
          aria-label="Weekly patterns"
          className="bg-[hsl(var(--surface))] rounded-lg border border-border p-4 md:p-6"
        >
          <DayOfWeekChart />
        </AnimatedSection>

        {/* Mode Comparison - full width */}
        <AnimatedSection
          as="section"
          aria-label="Mode breakdown"
          className="bg-[hsl(var(--surface))] rounded-lg border border-border p-4 md:p-6"
        >
          <ModeComparisonChart />
        </AnimatedSection>
      </div>
    </DashboardShell>
  );
}
