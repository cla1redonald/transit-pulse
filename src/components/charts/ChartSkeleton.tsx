import { Skeleton } from '@/components/ui/skeleton';

interface ChartSkeletonProps {
  height?: string;
}

export function ChartSkeleton({ height = 'h-80' }: ChartSkeletonProps) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <Skeleton className="h-6 w-48 mb-4" />
      <Skeleton className={`w-full ${height}`} />
    </div>
  );
}
