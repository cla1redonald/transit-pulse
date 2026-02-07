'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
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
  formatPercentage,
} from '@/cities/nyc/lib/format';
import type { CongestionPricingData } from '@/cities/nyc/types/transit';

// Import data
import congestionData from '../../../../../data/nyc/congestion-pricing.json';

export function CongestionPricingChart() {
  const { activeModes } = useFilters();

  // Prepare chart data from congestion pricing events
  const chartData = useMemo(() => {
    const data = congestionData as CongestionPricingData[];

    // Create comparison bars for each event
    const comparisonData: Array<{
      label: string;
      event: string;
      period: string;
      date: string;
      subway?: number;
      bridgesTunnels?: number;
    }> = [];

    data.forEach((event) => {
      // Only show subway and bridges/tunnels if they're active
      if (activeModes.has('subway')) {
        comparisonData.push({
          label: `${event.event === 'launch' ? 'Launch' : event.event === 'pause' ? 'Pause' : 'Resumption'} - Before`,
          event: event.event,
          period: 'before',
          date: event.date,
          subway: event.before30d.avgSubway,
          bridgesTunnels: event.before30d.avgBridgesTunnels,
        });
        comparisonData.push({
          label: `${event.event === 'launch' ? 'Launch' : event.event === 'pause' ? 'Pause' : 'Resumption'} - After`,
          event: event.event,
          period: 'after',
          date: event.date,
          subway: event.after30d.avgSubway,
          bridgesTunnels: event.after30d.avgBridgesTunnels,
        });
      }
    });

    return comparisonData;
  }, [activeModes]);

  // Calculate deltas for display
  const eventDeltas = useMemo(() => {
    return (congestionData as CongestionPricingData[]).map((event) => ({
      event: event.event,
      date: event.date,
      subwayDelta: event.subwayDelta,
      bridgesDelta: event.bridgesDelta,
    }));
  }, []);

  if (!chartData.length) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border border-border bg-card">
        <p className="text-muted-foreground">
          No congestion pricing data available
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-6">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.3}
          />
          <XAxis
            dataKey="label"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => formatCompactNumber(value)}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;

              const data = payload[0].payload;
              return (
                <div
                  className="rounded-lg border border-border p-3 shadow-lg"
                  style={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                  }}
                >
                  <p className="mb-2 text-sm font-medium text-foreground">
                    {data.label}
                  </p>
                  <p className="mb-1 text-xs text-muted-foreground">
                    {data.date}
                  </p>
                  <div className="space-y-1">
                    {payload.map((entry, index) => (
                      <div
                        key={`item-${index}`}
                        className="flex items-center gap-2"
                      >
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {entry.name}:
                        </span>
                        <span className="text-xs font-medium text-foreground">
                          {formatCompactNumber(Number(entry.value))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="rect"
            formatter={(value) => (
              <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
            )}
          />

          {/* Render bars for active modes */}
          {activeModes.has('subway') && (
            <Bar
              dataKey="subway"
              name={MODE_LABELS.subway}
              fill={MODE_COLORS.subway}
              radius={[4, 4, 0, 0]}
            />
          )}
          {activeModes.has('bridgesTunnels') && (
            <Bar
              dataKey="bridgesTunnels"
              name={MODE_LABELS.bridgesTunnels}
              fill={MODE_COLORS.bridgesTunnels}
              radius={[4, 4, 0, 0]}
            />
          )}
        </BarChart>
      </ResponsiveContainer>

      {/* Event Impact Summary */}
      <div className="mt-6 space-y-4">
        <h4 className="text-sm font-medium text-foreground">Impact Summary</h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {eventDeltas.map((delta) => (
            <div
              key={delta.event}
              className="rounded-lg border border-border bg-muted/50 p-4"
            >
              <div className="mb-2">
                <span className="text-sm font-medium capitalize text-foreground">
                  {delta.event}
                </span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {delta.date}
                </span>
              </div>
              <div className="space-y-1">
                {activeModes.has('subway') && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Subway:
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        delta.subwayDelta > 0
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {delta.subwayDelta > 0 ? '+' : ''}
                      {formatPercentage(delta.subwayDelta, 1)}
                    </span>
                  </div>
                )}
                {activeModes.has('bridgesTunnels') && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Bridges & Tunnels:
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        delta.bridgesDelta > 0
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {delta.bridgesDelta > 0 ? '+' : ''}
                      {formatPercentage(delta.bridgesDelta, 1)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
