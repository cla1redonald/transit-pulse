'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useLondonFilters, filterDataByDateRange } from '@/cities/london/lib/filter-context';
import { RecoveryData } from '@/cities/london/types/transit';
import { PANDEMIC_EVENTS } from '@/cities/london/lib/constants';
import { formatDate } from '@/cities/london/lib/format';
import recoveryData from '../../../../../data/london/recovery.json';
import { RecoveryKPIBars } from './RecoveryKPIBars';

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload || !label) return null;

  return (
    <div className="bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))] rounded-lg p-3 shadow-xl text-sm">
      <p className="text-[hsl(var(--muted-foreground))] mb-2 font-medium">
        {formatDate(label, 'short')}
      </p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-foreground">{p.name}</span>
          </span>
          <span className="font-mono text-foreground">{Math.round(p.value)}%</span>
        </div>
      ))}
    </div>
  );
}

export function PandemicRecoveryChart() {
  const { filters } = useLondonFilters();

  const chartData = useMemo(() => {
    const typed = recoveryData as RecoveryData[];
    // Filter by date range directly since RecoveryData also has .date
    const startTime = filters.dateRange.start.getTime();
    const endTime = filters.dateRange.end.getTime();
    let filtered = typed.filter((d) => {
      const t = new Date(d.date).getTime();
      return t >= startTime && t <= endTime;
    });

    // Downsample for large datasets
    if (filtered.length > 365) {
      const step = Math.ceil(filtered.length / 365);
      filtered = filtered.filter((_, i) => i % step === 0);
    }

    return filtered;
  }, [filters.dateRange.start, filters.dateRange.end]);

  // Find visible event markers within the date range
  const visibleEvents = useMemo(() => {
    const startTime = filters.dateRange.start.getTime();
    const endTime = filters.dateRange.end.getTime();
    return PANDEMIC_EVENTS.filter((ev) => {
      const t = new Date(ev.date).getTime();
      return t >= startTime && t <= endTime;
    });
  }, [filters.dateRange.start, filters.dateRange.end]);

  // Get the latest recovery percentage for annotation
  const latestRecovery =
    chartData.length > 0 ? Math.round(chartData[chartData.length - 1].overallPct) : null;

  return (
    <section aria-label="Pandemic recovery chart">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pandemic Recovery</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Current ridership as percentage of 2019 baseline
          </p>
        </div>
        {latestRecovery !== null && (
          <div className="text-right">
            <span className="text-2xl font-bold text-foreground">{latestRecovery}%</span>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">of 2019 levels</p>
          </div>
        )}
      </div>

      <div className="w-full bg-[hsl(var(--card))] rounded-lg p-4 border border-border">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              strokeOpacity={0.15}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: string) => {
                const d = new Date(value);
                return d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
              }}
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => `${value}%`}
              width={45}
              domain={[0, 'auto']}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: 'hsl(var(--muted-foreground))',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
            />

            {/* 100% baseline reference */}
            <ReferenceLine
              y={100}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="4 4"
              strokeOpacity={0.5}
              label={{
                value: '2019 Baseline',
                position: 'right',
                fill: 'hsl(var(--muted-foreground))',
                fontSize: 10,
              }}
            />

            {/* Event markers */}
            {visibleEvents.map((ev) => (
              <ReferenceLine
                key={ev.date}
                x={ev.date}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="3 3"
                strokeOpacity={0.4}
                label={{
                  value: ev.label,
                  position: 'top',
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 9,
                  angle: -45,
                }}
              />
            ))}

            <Area
              type="monotone"
              dataKey="overallPct"
              name="Overall Recovery"
              stroke="#0019A8"
              fill="#0019A8"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-3">
          Recovery by Mode
        </h3>
        <RecoveryKPIBars />
      </div>
    </section>
  );
}
