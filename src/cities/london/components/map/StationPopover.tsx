'use client';

import { Popup } from 'react-leaflet';
import { formatNumber } from '@/cities/london/lib/format';
import type { StationData } from '@/cities/london/types/transit';

interface StationPopoverProps {
  station: StationData;
}

export function StationPopover({ station }: StationPopoverProps) {
  return (
    <Popup>
      <div className="min-w-[200px] p-1">
        <h3 className="font-semibold text-sm text-foreground mb-1">{station.name}</h3>
        <div className="text-xs text-muted-foreground mb-2">
          Zone {station.zone} &middot; {station.lines.join(', ')}
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Avg Daily Journeys</span>
            <span className="font-medium text-foreground">
              {formatNumber(station.avgDailyJourneys)}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Recovery vs 2019</span>
            <span className="font-medium text-foreground">{station.recoveryPct}%</span>
          </div>

          <div className="w-full bg-muted/30 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full"
              style={{
                width: `${Math.min(100, station.recoveryPct)}%`,
                backgroundColor:
                  station.recoveryPct >= 90
                    ? '#22c55e'
                    : station.recoveryPct >= 80
                      ? '#eab308'
                      : '#ef4444',
              }}
            />
          </div>
        </div>
      </div>
    </Popup>
  );
}
