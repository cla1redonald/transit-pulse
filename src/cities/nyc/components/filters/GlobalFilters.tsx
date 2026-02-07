'use client';

import {
  useFilters,
  type DatePreset,
} from '@/cities/nyc/lib/filter-context';
import { DATE_RANGE_PRESETS } from '@/cities/nyc/lib/constants';
import { MODE_COLORS, MODE_LABELS_SHORT } from '@/cities/nyc/lib/colors';
import type { TransitMode } from '@/cities/nyc/types/transit';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DATE_PRESET_KEYS: DatePreset[] = ['7d', '30d', '90d', '1y', 'all'];

const MODE_KEYS: TransitMode[] = [
  'subway',
  'bus',
  'lirr',
  'metroNorth',
  'accessARide',
  'bridgesTunnels',
  'sir',
];

export function GlobalFilters() {
  const { dateRange, activeModes, setPreset, toggleMode } = useFilters();

  return (
    <div className="sticky top-14 z-40 bg-background/95 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="py-4 space-y-3">
        {/* Date Range Presets */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Date Range:
          </span>
          <div className="flex gap-2">
            {DATE_PRESET_KEYS.map((preset) => (
              <Button
                key={preset}
                variant={dateRange.preset === preset ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreset(preset)}
                className="whitespace-nowrap"
              >
                {DATE_RANGE_PRESETS[preset]?.label || preset.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>

        {/* Mode Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
            Modes:
          </span>
          <div className="flex gap-2">
            {MODE_KEYS.map((mode) => {
              const isActive = activeModes.has(mode);
              const color = MODE_COLORS[mode];
              return (
                <button
                  key={mode}
                  onClick={() => toggleMode(mode)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border-2',
                    isActive
                      ? 'text-white shadow-md'
                      : 'bg-transparent text-foreground border-border hover:border-muted-foreground'
                  )}
                  style={
                    isActive
                      ? {
                          backgroundColor: color,
                          borderColor: color,
                        }
                      : undefined
                  }
                  aria-pressed={isActive}
                >
                  {MODE_LABELS_SHORT[mode]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
