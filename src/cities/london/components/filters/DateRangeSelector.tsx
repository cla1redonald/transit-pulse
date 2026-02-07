'use client';

import { useLondonFilters } from '@/cities/london/lib/filter-context';
import { FilterState } from '@/cities/london/types/transit';

const PRESETS: { label: string; value: FilterState['dateRange']['preset'] }[] = [
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: 'YTD', value: 'ytd' },
  { label: '1Y', value: '1y' },
  { label: 'All', value: 'all' },
];

export function DateRangeSelector() {
  const { filters, setDatePreset } = useLondonFilters();
  const activePreset = filters.dateRange.preset;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      {PRESETS.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => setDatePreset(value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
            activePreset === value
              ? 'bg-primary text-primary-foreground'
              : 'bg-[hsl(var(--surface-raised))] text-[hsl(var(--muted-foreground))] hover:text-foreground hover:bg-[hsl(var(--surface-overlay))]'
          }`}
          aria-pressed={activePreset === value}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
