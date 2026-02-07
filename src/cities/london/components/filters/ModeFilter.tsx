'use client';

import { useLondonFilters } from '@/cities/london/lib/filter-context';
import { TransitMode } from '@/cities/london/types/transit';
import { MODE_COLORS, MODE_LABELS } from '@/cities/london/lib/colors';

const ALL_MODES: TransitMode[] = ['tube', 'bus', 'overground', 'elizabeth', 'dlr', 'tram'];

export function ModeFilter() {
  const { filters, toggleMode } = useLondonFilters();

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      {ALL_MODES.map((mode) => {
        const active = filters.activeModes.has(mode);
        const color = MODE_COLORS[mode];

        return (
          <button
            key={mode}
            onClick={() => toggleMode(mode)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-all border ${
              active
                ? 'text-white border-transparent'
                : 'bg-transparent border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-foreground'
            }`}
            style={active ? { backgroundColor: color, borderColor: color } : undefined}
            aria-pressed={active}
          >
            {MODE_LABELS[mode]}
          </button>
        );
      })}
    </div>
  );
}
