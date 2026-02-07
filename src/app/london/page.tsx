'use client';

import { LondonFilterProvider, getLatestDate } from '@/cities/london/lib/filter-context';
import { LondonDashboard } from '@/cities/london/components/LondonDashboard';
import { DailyRidership } from '@/cities/london/types/transit';
import dailyData from '../../../data/london/daily.json';

const latestDate = getLatestDate(dailyData as DailyRidership[]);

export default function LondonPage() {
  return (
    <div data-city="london">
      <LondonFilterProvider latestDate={latestDate}>
        <LondonDashboard />
      </LondonFilterProvider>
    </div>
  );
}
