'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  useLondonFilters,
  filterDataByDateRange,
  computeRollingAverage,
} from '@/cities/london/lib/filter-context';
import { DailyRidership, TransitMode } from '@/cities/london/types/transit';
import { MODE_COLORS, MODE_LABELS } from '@/cities/london/lib/colors';
import { formatAxisNumber, formatNumber, formatDate } from '@/cities/london/lib/format';
import dailyData from '../../../../../data/london/daily.json';

const ALL_MODES: TransitMode[] = ['tube', 'bus', 'overground', 'elizabeth', 'dlr', 'tram'];

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

  const total = payload.reduce((sum, p) => sum + p.value, 0);

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
          <span className="font-mono text-foreground">{formatNumber(p.value)}</span>
        </div>
      ))}
      <div className="border-t border-[hsl(var(--border))] mt-2 pt-2 flex items-center justify-between gap-4">
        <span className="text-[hsl(var(--muted-foreground))]">Total</span>
        <span className="font-mono font-medium text-foreground">{formatNumber(total)}</span>
      </div>
    </div>
  );
}

export function RidershipTrendChart() {
  const { filters, setRollingAverage } = useLondonFilters();

  const chartData = useMemo(() => {
    const typedData = dailyData as DailyRidership[];
    let filtered = filterDataByDateRange(
      typedData,
      filters.dateRange.start,
      filters.dateRange.end,
    );

    if (filters.rollingAverage) {
      filtered = computeRollingAverage(filtered, ALL_MODES);
    }

    // Downsample for large datasets to keep chart performant
    if (filtered.length > 365) {
      const step = Math.ceil(filtered.length / 365);
      filtered = filtered.filter((_, i) => i % step === 0);
    }

    return filtered;
  }, [filters.dateRange.start, filters.dateRange.end, filters.rollingAverage]);

  const activeModes = useMemo(
    () => ALL_MODES.filter((m) => filters.activeModes.has(m)),
    [filters.activeModes],
  );

  // Compute tick count based on data length
  const xTickCount = chartData.length > 180 ? 6 : chartData.length > 60 ? 8 : 12;

  return (
    <section aria-label="Ridership trend chart">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Ridership Trends</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Daily journeys by transport mode
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] cursor-pointer">
          <span>7-day avg</span>
          <button
            role="switch"
            aria-checked={filters.rollingAverage}
            onClick={() => setRollingAverage(!filters.rollingAverage)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              filters.rollingAverage ? 'bg-primary' : 'bg-[hsl(var(--surface-overlay))]'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                filters.rollingAverage ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>
      </div>

      <div className="w-full bg-[hsl(var(--card))] rounded-lg p-4 border border-border">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
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
              tickCount={xTickCount}
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
              tickFormatter={formatAxisNumber}
              width={50}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: 'hsl(var(--muted-foreground))',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
            />
            {activeModes.map((mode) => (
              <Line
                key={mode}
                type="monotone"
                dataKey={mode}
                name={MODE_LABELS[mode]}
                stroke={MODE_COLORS[mode]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
