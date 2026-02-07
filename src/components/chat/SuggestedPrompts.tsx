'use client';

import { cn } from '@/lib/utils';
import { useChatContext } from './ChatProvider';
import type { CityId } from '@/types/shared';

const PROMPTS: Record<CityId | 'default', string[]> = {
  nyc: [
    'How has subway ridership recovered since COVID?',
    'What was the impact of congestion pricing?',
    'Compare weekday vs weekend ridership',
  ],
  london: [
    'How does tube recovery compare to bus?',
    'What are the busiest travel days?',
    'Compare ridership before and after Elizabeth line opening',
  ],
  default: [
    'Compare NYC and London pandemic recovery',
    'Which city has higher weekend ridership?',
    'What are the biggest differences between the two transit systems?',
  ],
};

export function SuggestedPrompts() {
  const { activeCity, sendMessage, messages } = useChatContext();

  // Only show when conversation is empty
  if (messages.length > 0) return null;

  const prompts = activeCity ? PROMPTS[activeCity] : PROMPTS.default;

  return (
    <div className="px-4 py-3">
      <p className="mb-3 text-sm text-muted-foreground">
        Ask me anything about transit data...
      </p>
      <div className="flex flex-wrap gap-2">
        {prompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => sendMessage(prompt)}
            className={cn(
              'rounded-full border border-border px-3 py-1.5',
              'text-xs text-foreground',
              'transition-colors duration-150',
              'hover:bg-accent hover:text-accent-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
