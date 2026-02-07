'use client';

import {
  formatNumber,
  formatDate,
} from '@/cities/nyc/lib/format';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

export function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div
      className="rounded-lg border border-border p-3 shadow-lg"
      style={{
        backgroundColor: 'hsl(var(--card))',
        borderColor: 'hsl(var(--border))',
      }}
    >
      {label && (
        <p className="mb-2 text-sm font-medium text-foreground">
          {formatDate(label, 'MMM d, yyyy')}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">{entry.name}:</span>
            <span className="text-xs font-medium text-foreground">
              {formatNumber(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
