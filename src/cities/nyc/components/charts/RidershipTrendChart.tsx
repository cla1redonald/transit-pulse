'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useFilters } from '@/cities/nyc/lib/filter-context';
import { MODE_COLORS, MODE_LABELS } from '@/cities/nyc/lib/colors';
import { formatCompactNumber } from '@/cities/nyc/lib/format';
import { CustomTooltip } from './CustomTooltip';
import type { DailyRidership, TransitMode } from '@/cities/nyc/types/transit';

// Import data
import dailyData from '../../../../../data/nyc/daily.json';

export function RidershipTrendChart() {
  const { filterDataByDateRange, activeModes } = useFilters();

  // Filter and process data
  const chartData = useMemo(() => {
    const filtered = filterDataByDateRange(dailyData as DailyRidership[]);
    return filtered;
  }, [filterDataByDateRange]);

  // Get active modes as array for line rendering
  const activeModesArray = useMemo(
    () => Array.from(activeModes),
    [activeModes]
  );

  if (!chartData.length) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border border-border bg-card">
        <p className="text-muted-foreground">
          No data available for selected date range
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-6">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.3}
          />
          <XAxis
            dataKey="date"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => {
              const date = new Date(value);
              return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
            }}
            minTickGap={30}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => formatCompactNumber(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
            formatter={(value) => (
              <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
            )}
          />

          {/* Render lines for active modes using .map() pattern */}
          {activeModesArray.map((mode) => (
            <Line
              key={mode}
              type="monotone"
              dataKey={mode}
              name={MODE_LABELS[mode]}
              stroke={MODE_COLORS[mode]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
