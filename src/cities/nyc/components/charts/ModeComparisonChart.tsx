'use client';

import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useFilters } from '@/cities/nyc/lib/filter-context';
import { MODE_COLORS, MODE_LABELS } from '@/cities/nyc/lib/colors';
import {
  formatCompactNumber,
  formatNumber,
} from '@/cities/nyc/lib/format';
import type { DailyRidership, TransitMode } from '@/cities/nyc/types/transit';

// Import data
import dailyData from '../../../../../data/nyc/daily.json';

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

interface CustomStackedTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

function CustomStackedTooltip({
  active,
  payload,
  label,
}: CustomStackedTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  // Calculate total
  const total = payload.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div
      className="rounded-lg border border-border p-3 shadow-lg"
      style={{
        backgroundColor: 'hsl(var(--card))',
        borderColor: 'hsl(var(--border))',
      }}
    >
      {label && (
        <p className="mb-2 text-sm font-medium text-foreground">
          {new Date(label).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      )}
      <div className="mb-2 border-b border-border pb-2">
        <span className="text-xs text-muted-foreground">Total: </span>
        <span className="text-xs font-semibold text-foreground">
          {formatNumber(total)}
        </span>
      </div>
      <div className="space-y-1">
        {payload
          .slice()
          .reverse()
          .map((entry, index) => {
            const percentage = ((entry.value / total) * 100).toFixed(1);
            return (
              <div
                key={`item-${index}`}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {entry.name}:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {formatNumber(entry.value)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export function ModeComparisonChart() {
  const { filterDataByDateRange, activeModes } = useFilters();

  // Filter data
  const chartData = useMemo(() => {
    const filtered = filterDataByDateRange(dailyData as DailyRidership[]);
    return filtered;
  }, [filterDataByDateRange]);

  // Get active modes as array
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
        <AreaChart
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
          <Tooltip content={<CustomStackedTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="square"
            formatter={(value) => (
              <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
            )}
          />

          {/* Render areas for active modes using .map() pattern */}
          {activeModesArray.map((mode) => (
            <Area
              key={mode}
              type="monotone"
              dataKey={mode}
              name={MODE_LABELS[mode]}
              stackId="1"
              stroke={MODE_COLORS[mode]}
              fill={MODE_COLORS[mode]}
              fillOpacity={0.8}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
