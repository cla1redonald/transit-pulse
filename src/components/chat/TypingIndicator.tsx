'use client';

import { cn } from '@/lib/utils';

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3" aria-label="AI is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            'h-2 w-2 rounded-full bg-muted-foreground/60',
            'animate-bounce'
          )}
          style={{
            animationDelay: `${i * 150}ms`,
            animationDuration: '600ms',
          }}
        />
      ))}
    </div>
  );
}
