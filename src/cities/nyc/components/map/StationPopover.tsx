'use client';

import type { StationData } from '@/cities/nyc/types/transit';
import { getLineColor } from '@/cities/nyc/lib/colors';
import { formatNumber } from '@/cities/nyc/lib/format';

interface StationPopoverProps {
  station: StationData;
}

export function StationPopover({ station }: StationPopoverProps) {
  const isTopStation = station.avgDailyRidership >= 95000;

  return (
    <div className="min-w-[200px] text-foreground">
      <div className="font-bold text-base mb-2">{station.name}</div>

      <div className="flex flex-wrap gap-1 mb-2">
        {station.lines.map((line) => {
          const lineColor = getLineColor(line);
          return (
            <span
              key={line}
              className="inline-flex items-center gap-1 text-xs font-medium"
            >
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: lineColor }}
                aria-hidden="true"
              />
              <span>{line}</span>
            </span>
          );
        })}
      </div>

      <div className="text-sm space-y-1">
        <div>
          <span className="text-muted-foreground">Borough:</span>{' '}
          <span className="font-medium">{station.borough}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Daily Ridership:</span>{' '}
          <span className="font-medium">
            {formatNumber(station.avgDailyRidership)}
          </span>
        </div>
        {isTopStation && (
          <div className="mt-2 pt-2 border-t border-border">
            <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
              Top 15 busiest station
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
