export function ChartSkeleton({ height = 400 }: { height?: number }) {
  return (
    <div
      className="w-full rounded-lg bg-[hsl(var(--surface-raised))] animate-pulse"
      style={{ height }}
    >
      <div className="h-full flex flex-col justify-between p-6">
        {/* Fake horizontal grid lines */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-full h-px bg-[hsl(var(--border))]/30" />
        ))}
      </div>
    </div>
  );
}
