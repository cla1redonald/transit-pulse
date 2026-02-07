'use client';

import { TransitMode } from '@/cities/london/types/transit';
import { MODE_COLORS, MODE_LABELS } from '@/cities/london/lib/colors';
import kpiData from '../../../../../data/london/kpi.json';
import { KPIData } from '@/cities/london/types/transit';

const MODES: TransitMode[] = ['tube', 'bus', 'overground', 'elizabeth', 'dlr', 'tram'];

const typedKpi = kpiData as KPIData;

export function RecoveryKPIBars() {
  return (
    <div className="space-y-3">
      {MODES.map((mode) => {
        const data = typedKpi.byMode[mode];
        const pct = data.recoveryPct;
        const color = MODE_COLORS[mode];

        return (
          <div key={mode} className="flex items-center gap-3">
            <span className="text-sm text-[hsl(var(--muted-foreground))] w-24 shrink-0">
              {MODE_LABELS[mode]}
            </span>
            {pct === null ? (
              <span className="text-xs text-[hsl(var(--muted-foreground))] italic">
                N/A &mdash; opened 2022
              </span>
            ) : (
              <>
                <div className="flex-1 h-2.5 rounded-full bg-[hsl(var(--surface-overlay))] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(pct, 100)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                <span className="text-sm font-mono text-foreground w-12 text-right">
                  {Math.round(pct)}%
                </span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
