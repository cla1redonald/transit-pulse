'use client';

import { useMemo } from 'react';
import { Activity, TrendingUp, Target, Train, Bus, Cable } from 'lucide-react';
import { KPICard } from '@/components/kpi/KPICard';
import { MODE_COLORS } from '@/cities/london/lib/colors';
import { useLondonFilters, filterDataByDateRange } from '@/cities/london/lib/filter-context';
import { DailyRidership, TransitMode } from '@/cities/london/types/transit';
import dailyData from '../../../../../data/london/daily.json';

const typedData = dailyData as DailyRidership[];

// 2019 baseline average for recovery calculation
const entries2019 = typedData.filter((d) => d.date.startsWith('2019'));
const baseline2019Total =
  entries2019.length > 0 ? entries2019.reduce((sum, d) => sum + d.total, 0) / entries2019.length : 1;

/** Sum active modes for a single data entry */
function sumModes(d: DailyRidership, modes: TransitMode[]): number {
  return modes.reduce((sum, m) => sum + d[m], 0);
}

/** Average a computed value across an array of entries */
function avg(arr: DailyRidership[], fn: (d: DailyRidership) => number): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, d) => sum + fn(d), 0) / arr.length;
}

/** Downsample an array to roughly targetLen entries */
function downsample<T>(arr: T[], targetLen: number): T[] {
  if (arr.length <= targetLen) return arr;
  const step = Math.ceil(arr.length / targetLen);
  return arr.filter((_, i) => i % step === 0);
}

const TARGET_BARS = 30;

export function KPISection() {
  const { filters } = useLondonFilters();

  const activeModes = useMemo(
    () => Array.from(filters.activeModes) as TransitMode[],
    [filters.activeModes],
  );

  const kpis = useMemo(() => {
    const filtered = filterDataByDateRange(
      typedData,
      filters.dateRange.start,
      filters.dateRange.end,
    );

    if (filtered.length === 0 || activeModes.length === 0) {
      return {
        avgTotal: 0,
        periodChange: 0,
        recoveryPct: 0,
        avgTube: 0,
        tubeChange: 0,
        avgBus: 0,
        busChange: 0,
        avgRail: 0,
        railChange: 0,
        sparklines: {
          total: [] as number[],
          tube: [] as number[],
          bus: [] as number[],
          rail: [] as number[],
          wow: [] as number[],
          recovery: [] as number[],
        },
      };
    }

    // Helper to sum only the active modes
    const sumActive = (d: DailyRidership) => sumModes(d, activeModes);

    // Period averages (only active modes)
    const avgTotal = Math.round(avg(filtered, sumActive));
    const avgTube = Math.round(avg(filtered, (d) => d.tube));
    const avgBus = Math.round(avg(filtered, (d) => d.bus));
    const avgRail = Math.round(avg(filtered, (d) => d.overground + d.elizabeth + d.dlr));

    // Prior period for period-over-period change
    const periodLen = filtered.length;
    const priorEnd = new Date(filters.dateRange.start);
    priorEnd.setDate(priorEnd.getDate() - 1);
    const priorStart = new Date(priorEnd);
    priorStart.setDate(priorStart.getDate() - periodLen + 1);
    const priorFiltered = filterDataByDateRange(typedData, priorStart, priorEnd);

    const priorAvg = avg(priorFiltered, sumActive);
    const periodChange = priorAvg > 0 ? ((avgTotal - priorAvg) / priorAvg) * 100 : 0;

    // Mode-specific period changes
    const priorTubeAvg = avg(priorFiltered, (d) => d.tube);
    const tubeChange = priorTubeAvg > 0 ? ((avgTube - priorTubeAvg) / priorTubeAvg) * 100 : 0;
    const priorBusAvg = avg(priorFiltered, (d) => d.bus);
    const busChange = priorBusAvg > 0 ? ((avgBus - priorBusAvg) / priorBusAvg) * 100 : 0;
    const priorRailAvg = avg(priorFiltered, (d) => d.overground + d.elizabeth + d.dlr);
    const railChange = priorRailAvg > 0 ? ((avgRail - priorRailAvg) / priorRailAvg) * 100 : 0;

    // Recovery vs 2019 baseline (using active modes only)
    const baseline2019Active =
      entries2019.length > 0
        ? entries2019.reduce((sum, d) => sum + sumModes(d, activeModes), 0) / entries2019.length
        : 1;
    const recoveryPct = baseline2019Active > 0 ? (avgTotal / baseline2019Active) * 100 : 0;

    // Sparklines — downsample full filtered range to ~30 bars
    const sampled = downsample(filtered, TARGET_BARS);
    const sparklines = {
      total: sampled.map(sumActive),
      tube: sampled.map((d) => d.tube),
      bus: sampled.map((d) => d.bus),
      rail: sampled.map((d) => d.overground + d.elizabeth + d.dlr),
      wow: downsample(
        filtered.reduce<number[]>((acc, d, i, arr) => {
          if (i >= 7) {
            const prev = sumActive(arr[i - 7]);
            const curr = sumActive(d);
            acc.push(prev > 0 ? ((curr - prev) / prev) * 100 : 0);
          }
          return acc;
        }, []),
        TARGET_BARS,
      ),
      recovery: sampled.map((d) => {
        return baseline2019Active > 0 ? (sumActive(d) / baseline2019Active) * 100 : 0;
      }),
    };

    return {
      avgTotal,
      periodChange,
      recoveryPct,
      avgTube,
      tubeChange,
      avgBus,
      busChange,
      avgRail,
      railChange,
      sparklines,
    };
  }, [filters.dateRange.start, filters.dateRange.end, activeModes]);

  const railActive =
    filters.activeModes.has('overground') ||
    filters.activeModes.has('elizabeth') ||
    filters.activeModes.has('dlr');

  return (
    <section className="mb-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KPICard
          label="Avg Daily Journeys"
          value={kpis.avgTotal}
          delta={kpis.periodChange}
          icon={Activity}
          sparklineData={kpis.sparklines.total}
        />

        <KPICard
          label="Period Change"
          value={kpis.periodChange}
          icon={TrendingUp}
          sparklineData={kpis.sparklines.wow}
          valueFormat="percent"
        />

        <KPICard
          label="vs 2019 Baseline"
          value={kpis.recoveryPct}
          delta={kpis.recoveryPct - 100}
          icon={Target}
          sparklineData={kpis.sparklines.recovery}
          valueFormat="percent"
        />

        <KPICard
          label="Tube"
          value={kpis.avgTube}
          delta={kpis.tubeChange}
          icon={Train}
          color={MODE_COLORS.tube}
          sparklineData={kpis.sparklines.tube}
          dimmed={!filters.activeModes.has('tube')}
        />

        <KPICard
          label="Bus"
          value={kpis.avgBus}
          delta={kpis.busChange}
          icon={Bus}
          color={MODE_COLORS.bus}
          sparklineData={kpis.sparklines.bus}
          dimmed={!filters.activeModes.has('bus')}
        />

        <KPICard
          label="Rail"
          value={kpis.avgRail}
          delta={kpis.railChange}
          icon={Cable}
          color={MODE_COLORS.overground}
          sparklineData={kpis.sparklines.rail}
          dimmed={!railActive}
        />
      </div>
    </section>
  );
}
