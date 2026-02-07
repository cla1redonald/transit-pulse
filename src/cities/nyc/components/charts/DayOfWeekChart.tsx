'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useFilters } from '@/cities/nyc/lib/filter-context';
import { MODE_COLORS, MODE_LABELS } from '@/cities/nyc/lib/colors';
import { formatCompactNumber } from '@/cities/nyc/lib/format';
import { DAYS_OF_WEEK } from '@/cities/nyc/lib/constants';
import type { DayOfWeekData, TransitMode } from '@/cities/nyc/types/transit';

// Import data
import dowData from '../../../../../data/nyc/dow.json';

type ViewMode = 'total' | 'byMode';

export function DayOfWeekChart() {
  const { activeModes } = useFilters();
  const [viewMode, setViewMode] = useState<ViewMode>('total');

  // Prepare chart data
  const chartData = useMemo(() => {
    const data = dowData as DayOfWeekData[];

    if (viewMode === 'total') {
      // Total view: single bar per day with color intensity
      return data.map((item) => {
        // Calculate total only for active modes
        let total = 0;
        if (activeModes.has('subway')) total += item.avgSubway;
        if (activeModes.has('bus')) total += item.avgBus;
        if (activeModes.has('lirr')) total += item.avgLirr;
        if (activeModes.has('metroNorth')) total += item.avgMetroNorth;
        if (activeModes.has('accessARide')) total += item.avgAccessARide;
        if (activeModes.has('bridgesTunnels')) total += item.avgBridgesTunnels;
        if (activeModes.has('sir')) total += item.avgSir;

        return {
          dayOfWeek: item.dayOfWeek,
          total,
          // Keep individual values for tooltip
          subway: item.avgSubway,
          bus: item.avgBus,
          lirr: item.avgLirr,
          metroNorth: item.avgMetroNorth,
          accessARide: item.avgAccessARide,
          bridgesTunnels: item.avgBridgesTunnels,
          sir: item.avgSir,
        };
      });
    } else {
      // By Mode view: grouped bars per day
      return data.map((item) => ({
        dayOfWeek: item.dayOfWeek,
        ...(activeModes.has('subway') && { subway: item.avgSubway }),
        ...(activeModes.has('bus') && { bus: item.avgBus }),
        ...(activeModes.has('lirr') && { lirr: item.avgLirr }),
        ...(activeModes.has('metroNorth') && {
          metroNorth: item.avgMetroNorth,
        }),
        ...(activeModes.has('accessARide') && {
          accessARide: item.avgAccessARide,
        }),
        ...(activeModes.has('bridgesTunnels') && {
          bridgesTunnels: item.avgBridgesTunnels,
        }),
        ...(activeModes.has('sir') && { sir: item.avgSir }),
      }));
    }
  }, [viewMode, activeModes]);

  // Find peak day
  const peakDay = useMemo(() => {
    if (!chartData.length) return null;
    const sorted = [...chartData].sort((a, b) => {
      let aTotal = 0;
      let bTotal = 0;

      if (viewMode === 'total' && 'total' in a) {
        aTotal = a.total as number;
      } else {
        Object.entries(a).forEach(([key, val]) => {
          if (key !== 'dayOfWeek' && typeof val === 'number') {
            aTotal += val;
          }
        });
      }

      if (viewMode === 'total' && 'total' in b) {
        bTotal = b.total as number;
      } else {
        Object.entries(b).forEach(([key, val]) => {
          if (key !== 'dayOfWeek' && typeof val === 'number') {
            bTotal += val;
          }
        });
      }

      return bTotal - aTotal;
    });
    return sorted[0]?.dayOfWeek;
  }, [chartData, viewMode]);

  // Get active modes as array
  const activeModesArray = useMemo(
    () => Array.from(activeModes),
    [activeModes]
  );

  // Calculate color intensity for total view
  const getBarColor = (value: number, maxValue: number) => {
    const intensity = value / maxValue;
    const baseHue = 220; // Blue hue
    const lightness = 70 - intensity * 30; // Darker for higher values
    return `hsl(${baseHue}, 70%, ${lightness}%)`;
  };

  const maxTotal = useMemo(() => {
    if (viewMode !== 'total') return 0;
    return Math.max(
      ...chartData.map((d) =>
        'total' in d && typeof d.total === 'number' ? d.total : 0
      )
    );
  }, [chartData, viewMode]);

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm p-6">
      <div className="mb-4 flex items-center justify-end">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('total')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              viewMode === 'total'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Total
          </button>
          <button
            onClick={() => setViewMode('byMode')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              viewMode === 'byMode'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            By Mode
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            opacity={0.3}
          />
          <XAxis
            dataKey="dayOfWeek"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => value.slice(0, 3)} // Mon, Tue, Wed, etc.
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => formatCompactNumber(value)}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;

              if (viewMode === 'total') {
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
                      {label}
                    </p>
                    <p className="mb-2 text-xs font-semibold text-foreground">
                      Total: {formatCompactNumber(data.total)}
                    </p>
                    <div className="space-y-1">
                      {activeModesArray.map((mode) => (
                        <div
                          key={mode}
                          className="flex items-center gap-2"
                        >
                          <div
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor: MODE_COLORS[mode],
                            }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {MODE_LABELS[mode]}:
                          </span>
                          <span className="text-xs font-medium text-foreground">
                            {formatCompactNumber(data[mode])}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              } else {
                return (
                  <div
                    className="rounded-lg border border-border p-3 shadow-lg"
                    style={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                    }}
                  >
                    <p className="mb-2 text-sm font-medium text-foreground">
                      {label}
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
              }
            }}
          />
          {viewMode === 'byMode' && (
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="rect"
              formatter={(value) => (
                <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
              )}
            />
          )}

          {viewMode === 'total' ? (
            <Bar dataKey="total" name="Total Ridership" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(
                    'total' in entry && typeof entry.total === 'number'
                      ? entry.total
                      : 0,
                    maxTotal
                  )}
                />
              ))}
            </Bar>
          ) : (
            <>
              {activeModesArray.map((mode) => (
                <Bar
                  key={mode}
                  dataKey={mode}
                  name={MODE_LABELS[mode]}
                  fill={MODE_COLORS[mode]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </>
          )}
        </BarChart>
      </ResponsiveContainer>

      {/* Peak day annotation */}
      {peakDay && (
        <div className="mt-4 rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{peakDay}</span> sees
            the highest ridership on average, reflecting peak midweek commute
            patterns.
          </p>
        </div>
      )}
    </div>
  );
}
