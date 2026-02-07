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
  ReferenceLine,
} from 'recharts';
import { useFilters } from '@/cities/nyc/lib/filter-context';
import { MODE_COLORS, MODE_LABELS } from '@/cities/nyc/lib/colors';
import { formatPercentage } from '@/cities/nyc/lib/format';
import { CustomTooltip } from './CustomTooltip';
import { NYC_EVENT_MARKERS } from '@/cities/nyc/lib/constants';
import type { RecoveryData, TransitMode } from '@/cities/nyc/types/transit';

// Import data
import recoveryData from '../../../../../data/nyc/recovery.json';

export function PandemicRecoveryChart() {
  const { filterDataByDateRange, activeModes } = useFilters();

  // Filter data by date range
  const chartData = useMemo(() => {
    const filtered = filterDataByDateRange(recoveryData as RecoveryData[]);

    // Convert decimal to percentage (e.g., 0.85 -> 85)
    return filtered.map((item) => ({
      ...item,
      subwayPct: item.subwayPct * 100,
      busPct: item.busPct * 100,
      lirrPct: item.lirrPct * 100,
      metroNorthPct: item.metroNorthPct * 100,
      accessARidePct: item.accessARidePct * 100,
      bridgesTunnelsPct: item.bridgesTunnelsPct * 100,
      sirPct: item.sirPct * 100,
    }));
  }, [filterDataByDateRange]);

  // Get active modes as array
  const activeModesArray = useMemo(
    () => Array.from(activeModes),
    [activeModes]
  );

  // Calculate latest recovery percentages for KPI bars
  const latestRecovery = useMemo(() => {
    if (!chartData.length) return null;
    const latest = chartData[chartData.length - 1];
    return {
      subway: latest.subwayPct,
      bus: latest.busPct,
      lirr: latest.lirrPct,
      metroNorth: latest.metroNorthPct,
      accessARide: latest.accessARidePct,
      bridgesTunnels: latest.bridgesTunnelsPct,
      sir: latest.sirPct,
    };
  }, [chartData]);

  // Map mode to recovery data key
  const MODE_TO_PCT_KEY: Record<TransitMode, string> = {
    subway: 'subwayPct',
    bus: 'busPct',
    lirr: 'lirrPct',
    metroNorth: 'metroNorthPct',
    accessARide: 'accessARidePct',
    bridgesTunnels: 'bridgesTunnelsPct',
    sir: 'sirPct',
  };

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
            tickFormatter={(value) => `${value}%`}
            domain={[0, 180]}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;
              const formattedPayload = payload.map((entry) => ({
                ...entry,
                value: `${typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}%`,
              }));
              return (
                <CustomTooltip
                  active={active}
                  payload={formattedPayload as any[]}
                  label={typeof label === 'number' ? String(label) : label}
                />
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

          {/* 100% reference line (pre-pandemic baseline) */}
          <ReferenceLine
            y={100}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="5 5"
            strokeWidth={2}
            label={{
              value: 'Pre-Pandemic (100%)',
              position: 'right',
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 12,
            }}
          />

          {/* Event markers */}
          {NYC_EVENT_MARKERS.map((event) => {
            // Only show markers within the filtered date range
            const eventDate = new Date(event.date);
            const startDate = new Date(chartData[0].date);
            const endDate = new Date(chartData[chartData.length - 1].date);

            if (eventDate >= startDate && eventDate <= endDate) {
              return (
                <ReferenceLine
                  key={event.date}
                  x={event.date}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                  label={{
                    value: event.label,
                    position: 'top',
                    fill: 'hsl(var(--muted-foreground))',
                    fontSize: 10,
                    angle: -45,
                  }}
                />
              );
            }
            return null;
          })}

          {/* Render areas for active modes using .map() pattern */}
          {activeModesArray.map((mode) => (
            <Area
              key={mode}
              type="monotone"
              dataKey={MODE_TO_PCT_KEY[mode]}
              name={MODE_LABELS[mode]}
              stroke={MODE_COLORS[mode]}
              fill={MODE_COLORS[mode]}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>

      {/* Recovery KPI Bars */}
      {latestRecovery && (
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-foreground">
            Current Recovery Status
          </h4>
          <div className="space-y-2">
            {activeModesArray.map((mode) => {
              const modeKey = mode as keyof typeof latestRecovery;
              const pct = latestRecovery[modeKey];
              const isAboveBaseline = pct > 100;

              return (
                <div key={mode} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {MODE_LABELS[mode]}
                    </span>
                    <span
                      className={`font-medium ${
                        isAboveBaseline ? 'text-green-500' : 'text-foreground'
                      }`}
                    >
                      {formatPercentage(pct, 1)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: MODE_COLORS[mode],
                      }}
                    />
                    {isAboveBaseline && (
                      <div
                        className="h-full -mt-2 transition-all"
                        style={{
                          width: `${Math.min(pct - 100, 100)}%`,
                          backgroundColor: MODE_COLORS[mode],
                          opacity: 0.5,
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
