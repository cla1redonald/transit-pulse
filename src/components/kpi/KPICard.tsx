'use client';

import * as React from 'react';
import { ArrowDown, ArrowUp, LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatNumber, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';

interface KPICardProps {
  label: string;
  value: number;
  delta?: number;
  icon?: LucideIcon;
  color?: string;
  sparklineData?: number[];
  dimmed?: boolean;
  valueFormat?: 'number' | 'percent';
}

export function KPICard({
  label,
  value,
  delta,
  icon: Icon,
  color,
  sparklineData,
  dimmed = false,
  valueFormat = 'number',
}: KPICardProps) {
  const [displayValue, setDisplayValue] = React.useState(0);
  const [hasAnimated, setHasAnimated] = React.useState(false);

  // Count-up animation on mount using requestAnimationFrame with easing
  React.useEffect(() => {
    if (hasAnimated) return;

    // Respect prefers-reduced-motion
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setDisplayValue(value);
      setHasAnimated(true);
      return;
    }

    const duration = 1000;
    let startTime: number | null = null;
    let rafId: number;

    function easeOutCubic(t: number): number {
      return 1 - Math.pow(1 - t, 3);
    }

    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      const animated = eased * value;
      setDisplayValue(
        valueFormat === 'percent'
          ? Math.round(animated * 10) / 10
          : Math.round(animated)
      );

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
        setHasAnimated(true);
      }
    }

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [value, hasAnimated, valueFormat]);

  const deltaColor = delta && delta >= 0 ? 'text-green-500' : 'text-red-500';
  const DeltaIcon = delta && delta >= 0 ? ArrowUp : ArrowDown;

  return (
    <Card
      className={cn(
        'transition-opacity duration-300',
        dimmed && 'opacity-40'
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            {Icon && (
              <div
                className="p-2 rounded-lg"
                style={{
                  backgroundColor: color ? `${color}20` : undefined,
                }}
              >
                <Icon className="h-4 w-4" style={{ color: color }} />
              </div>
            )}
            <span className="text-sm text-muted-foreground">{label}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-3xl font-bold tracking-tight">
            {valueFormat === 'percent'
              ? `${displayValue.toFixed(1)}%`
              : formatNumber(displayValue)}
          </div>

          {delta !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 text-sm font-medium',
                deltaColor
              )}
            >
              <DeltaIcon className="h-4 w-4" />
              <span>{formatPercent(delta)}</span>
            </div>
          )}

          {sparklineData && sparklineData.length > 0 && (
            <div className="h-12 flex items-end gap-0.5">
              {sparklineData.map((val, i) => {
                const max = Math.max(...sparklineData);
                const height = max > 0 ? (val / max) * 100 : 0;
                return (
                  <div
                    key={i}
                    className="flex-1 bg-primary/30 rounded-sm transition-all"
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
