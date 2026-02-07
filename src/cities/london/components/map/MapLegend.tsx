'use client';

export function MapLegend() {
  return (
    <div className="absolute bottom-4 left-4 z-[1000] bg-[hsl(var(--surface-raised))]/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border">
      <div className="text-[10px] text-muted-foreground mb-1 font-medium">Ridership</div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground">Low</span>
        <div
          className="w-20 h-2 rounded-full"
          style={{
            background: 'linear-gradient(to right, #3b82f6, #ef4444)',
          }}
        />
        <span className="text-[10px] text-muted-foreground">High</span>
      </div>
    </div>
  );
}
