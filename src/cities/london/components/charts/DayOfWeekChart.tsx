'use client';

import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useLondonFilters } from '@/cities/london/lib/filter-context';
import { DayOfWeekData, TransitMode } from '@/cities/london/types/transit';
import { MODE_COLORS, MODE_LABELS } from '@/cities/london/lib/colors';
import { formatAxisNumber, formatNumber } from '@/cities/london/lib/format';
import dowData from '../../../../../data/london/dow.json';

const ALL_MODES: TransitMode[] = ['tube', 'bus', 'overground', 'elizabeth', 'dlr', 'tram'];

const MODE_TO_DOW_KEY: Record<TransitMode, keyof DayOfWeekData> = {
  tube: 'avgTube',
  bus: 'avgBus',
  overground: 'avgOverground',
  elizabeth: 'avgElizabeth',
  dlr: 'avgDlr',
  tram: 'avgTram',
};

type ViewMode = 'total' | 'byMode';

function TotalTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: DayOfWeekData }>;
  label?: string;
}) {
  if (!active || !payload?.[0] || !label) return null;

  const data = payload[0].payload;
  const total = data.avgTotal;

  return (
    <div className="bg-[hsl(var(--surface-raised))] border border-[hsl(var(--border))] rounded-lg p-3 shadow-xl text-sm min-w-[180px]">
      <p className="text-[hsl(var(--muted-foreground))] mb-2 font-medium">{label}</p>
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-foreground font-medium">Total</span>
        <span className="font-mono font-bold text-foreground">{formatNumber(total)}</span>
      </div>
      <div className="border-t border-[hsl(var(--border))] pt-2 space-y-1">
        {ALL_MODES.map((mode) => {
          const val = data[MODE_TO_DOW_KEY[mode]] as number;
          if (val === 0) return null;
          return (
            <div key={mode} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: MODE_COLORS[mode] }}
                />
                <span className="text-[hsl(var(--muted-foreground))] text-xs">
                  {MODE_LABELS[mode]}
                </span>
              </span>
              <span className="font-mono text-xs text-[hsl(var(--muted-foreground))]">
                {formatNumber(val)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ModeTooltip({
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
      <p className="text-[hsl(var(--muted-foreground))] mb-2 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-foreground">{p.name}</span>
          </span>
          <span className="font-mono text-foreground">{formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// Color intensity based on ridership relative to max
function getBarColor(value: number, max: number): string {
  const t = max > 0 ? value / max : 0;
  // Interpolate from muted blue to vibrant TfL blue
  const r = Math.round(100 - t * 100);
  const g = Math.round(140 - t * 115);
  const b = Math.round(200 + t * 55);
  return `rgb(${r}, ${g}, ${b})`;
}

export function DayOfWeekChart() {
  const { filters } = useLondonFilters();
  const [view, setView] = useState<ViewMode>('total');

  const typedData = dowData as DayOfWeekData[];

  const activeModes = useMemo(
    () => ALL_MODES.filter((m) => filters.activeModes.has(m)),
    [filters.activeModes],
  );

  const maxTotal = useMemo(() => Math.max(...typedData.map((d) => d.avgTotal)), [typedData]);

  // Find the peak day
  const peakDay = useMemo(() => {
    const peak = typedData.reduce(
      (max, d) => (d.avgTotal > max.avgTotal ? d : max),
      typedData[0],
    );
    return peak.dayName;
  }, [typedData]);

  return (
    <section aria-label="Day of week ridership chart">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Day-of-Week Patterns</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Average daily ridership by day of the week
          </p>
        </div>
        <div className="flex items-center gap-1 bg-[hsl(var(--surface-raised))] rounded-lg p-0.5">
          <button
            onClick={() => setView('total')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              view === 'total'
                ? 'bg-primary text-primary-foreground'
                : 'text-[hsl(var(--muted-foreground))] hover:text-foreground'
            }`}
          >
            Total
          </button>
          <button
            onClick={() => setView('byMode')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              view === 'byMode'
                ? 'bg-primary text-primary-foreground'
                : 'text-[hsl(var(--muted-foreground))] hover:text-foreground'
            }`}
          >
            By Mode
          </button>
        </div>
      </div>

      <div className="w-full bg-[hsl(var(--card))] rounded-lg p-4 border border-border">
        <ResponsiveContainer width="100%" height={350}>
          {view === 'total' ? (
            <BarChart data={typedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                strokeOpacity={0.15}
                vertical={false}
              />
              <XAxis
                dataKey="dayName"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: string) => value.slice(0, 3)}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatAxisNumber}
                width={50}
              />
              <Tooltip
                content={<TotalTooltip />}
                cursor={{ fill: 'hsl(var(--border))', fillOpacity: 0.3 }}
              />
              <Bar dataKey="avgTotal" name="Total Journeys" radius={[4, 4, 0, 0]} fillOpacity={0.9}>
                {typedData.map((entry, index) => (
                  <Cell key={index} fill={getBarColor(entry.avgTotal, maxTotal)} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <BarChart data={typedData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                strokeOpacity={0.15}
                vertical={false}
              />
              <XAxis
                dataKey="dayName"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: string) => value.slice(0, 3)}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatAxisNumber}
                width={50}
              />
              <Tooltip content={<ModeTooltip />} />
              {activeModes.map((mode) => (
                <Bar
                  key={mode}
                  dataKey={MODE_TO_DOW_KEY[mode]}
                  name={MODE_LABELS[mode]}
                  fill={MODE_COLORS[mode]}
                  radius={[2, 2, 0, 0]}
                  fillOpacity={0.85}
                />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))] italic">
        {peakDay} sees the highest ridership. Weekdays dominate, with Saturday and Sunday at roughly
        half the midweek peak.
      </p>
    </section>
  );
}
