'use client';

import { NycFilterProvider } from '@/cities/nyc/lib/filter-context';
import { NycDashboard } from '@/cities/nyc/components/NycDashboard';

export default function NycPage() {
  return (
    <div data-city="nyc">
      <NycFilterProvider>
        <NycDashboard />
      </NycFilterProvider>
    </div>
  );
}
