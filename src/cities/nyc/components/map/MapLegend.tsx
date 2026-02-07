'use client';

export function MapLegend() {
  return (
    <div className="absolute bottom-6 right-6 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg z-[1000]">
      <div className="text-xs font-medium text-foreground mb-2">
        Ridership Intensity
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Low</span>
        <div
          className="w-24 h-3 rounded-full"
          style={{
            background:
              'linear-gradient(to right, rgb(77, 146, 251), rgb(0, 57, 166), rgb(238, 53, 46))',
          }}
        />
        <span className="text-xs text-muted-foreground">High</span>
      </div>
    </div>
  );
}
