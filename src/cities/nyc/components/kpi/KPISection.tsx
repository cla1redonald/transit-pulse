'use client';

import { useMemo } from 'react';
import { KPICard } from '@/components/kpi/KPICard';
import { useFilters } from '@/cities/nyc/lib/filter-context';
import type {
  DailyRidership,
  TransitMode,
  RecoveryData,
} from '@/cities/nyc/types/transit';
import dailyDataRaw from '../../../../../data/nyc/daily.json';
import recoveryDataRaw from '../../../../../data/nyc/recovery.json';

const dailyData = dailyDataRaw as DailyRidership[];
const recoveryData = recoveryDataRaw as RecoveryData[];

const TARGET_BARS = 30;

const MODE_TO_RECOVERY_KEY: Record<TransitMode, keyof RecoveryData> = {
  subway: 'subwayPct',
  bus: 'busPct',
  lirr: 'lirrPct',
  metroNorth: 'metroNorthPct',
  accessARide: 'accessARidePct',
  bridgesTunnels: 'bridgesTunnelsPct',
  sir: 'sirPct',
};

function sumModes(d: DailyRidership, modes: TransitMode[]): number {
  let sum = 0;
  for (const m of modes) {
    sum += (d[m] as number) || 0;
  }
  return sum;
}

function avg(
  data: DailyRidership[],
  fn: (d: DailyRidership) => number
): number {
  if (data.length === 0) return 0;
  return data.reduce((acc, d) => acc + fn(d), 0) / data.length;
}

function downsample(data: DailyRidership[], target: number): DailyRidership[] {
  if (data.length <= target) return data;
  const step = data.length / target;
  const result: DailyRidership[] = [];
  for (let i = 0; i < target; i++) {
    result.push(data[Math.floor(i * step)]);
  }
  return result;
}

export function KPISection() {
  const { activeModes, filterDataByDateRange } = useFilters();

  const activeModesArray = useMemo(
    () => Array.from(activeModes) as TransitMode[],
    [activeModes]
  );

  const kpis = useMemo(() => {
    const filtered = filterDataByDateRange(dailyData);

    if (filtered.length === 0) {
      return {
        avgTotal: 0,
        periodChange: 0,
        recoveryPct: 0,
        sparklineTotal: [] as number[],
        sparklinePeriod: [] as number[],
      };
    }

    const sumActive = (d: DailyRidership) => sumModes(d, activeModesArray);

    // PERIOD AVERAGE (not last day's value)
    const avgTotal = Math.round(avg(filtered, sumActive));

    // Period-over-period change: compare current period avg to equivalent prior period avg
    const periodLen = filtered.length;
    const priorStart = new Date(filtered[0].date);
    priorStart.setDate(priorStart.getDate() - periodLen);
    const priorData = dailyData.filter((d) => {
      const dt = new Date(d.date);
      return dt >= priorStart && dt < new Date(filtered[0].date);
    });
    const priorAvg = avg(priorData, sumActive);
    const periodChange =
      priorAvg > 0 ? ((avgTotal - priorAvg) / priorAvg) * 100 : 0;

    // Recovery % from actual recovery data (not hardcoded)
    const filteredRecovery = filterDataByDateRange(recoveryData);
    let recoveryPct = 0;
    if (filteredRecovery.length > 0) {
      // Weighted average of active modes' recovery percentages
      let totalWeight = 0;
      let weightedSum = 0;
      for (const mode of activeModesArray) {
        const key = MODE_TO_RECOVERY_KEY[mode];
        const modeAvgRecovery =
          filteredRecovery.reduce(
            (acc, d) => acc + ((d[key] as number) || 0),
            0
          ) / filteredRecovery.length;
        // Weight by ridership volume
        const modeAvgRidership = avg(
          filtered,
          (d) => (d[mode] as number) || 0
        );
        weightedSum += modeAvgRecovery * modeAvgRidership;
        totalWeight += modeAvgRidership;
      }
      recoveryPct = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
    }

    // Sparklines: downsample FULL filtered range to ~30 bars
    const sampled = downsample(filtered, TARGET_BARS);
    const sparklineTotal = sampled.map(sumActive);

    // Recovery sparkline from sampled recovery data
    const sampledRecovery =
      filteredRecovery.length <= TARGET_BARS
        ? filteredRecovery
        : (() => {
            const step = filteredRecovery.length / TARGET_BARS;
            const r: RecoveryData[] = [];
            for (let i = 0; i < TARGET_BARS; i++) {
              r.push(filteredRecovery[Math.floor(i * step)]);
            }
            return r;
          })();
    const sparklineRecovery = sampledRecovery.map((d) => {
      let total = 0;
      let count = 0;
      for (const mode of activeModesArray) {
        const val = d[MODE_TO_RECOVERY_KEY[mode]] as number;
        if (val > 0) {
          total += val;
          count++;
        }
      }
      return count > 0 ? (total / count) * 100 : 0;
    });

    return {
      avgTotal,
      periodChange,
      recoveryPct,
      sparklineTotal,
      sparklineRecovery,
    };
  }, [activeModesArray, filterDataByDateRange]);

  return (
    <section className="space-y-4" aria-label="Key Performance Indicators">
      <h2 className="text-2xl font-bold">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          label="Avg Daily Ridership"
          value={kpis.avgTotal}
          delta={kpis.periodChange}
          sparklineData={kpis.sparklineTotal}
          valueFormat="number"
        />
        <KPICard
          label="Period Change"
          value={Math.abs(kpis.periodChange)}
          delta={kpis.periodChange}
          sparklineData={kpis.sparklineTotal.slice(-7)}
          valueFormat="percent"
        />
        <KPICard
          label="vs. Pre-Pandemic"
          value={kpis.recoveryPct}
          sparklineData={kpis.sparklineRecovery}
          valueFormat="percent"
        />
      </div>
    </section>
  );
}
