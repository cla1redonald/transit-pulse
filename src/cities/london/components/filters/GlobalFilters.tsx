'use client';

import { DateRangeSelector } from './DateRangeSelector';
import { ModeFilter } from './ModeFilter';

export function GlobalFilters() {
  return (
    <div className="sticky top-14 z-40 -mx-4 px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <DateRangeSelector />
        <ModeFilter />
      </div>
    </div>
  );
}
