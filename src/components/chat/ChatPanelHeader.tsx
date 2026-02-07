'use client';

import { X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useChatContext } from './ChatProvider';

const CITY_LABELS: Record<string, { label: string; className: string }> = {
  nyc: {
    label: 'NYC',
    className: 'bg-[hsl(var(--chart-1))] text-primary-foreground border-transparent',
  },
  london: {
    label: 'London',
    className: 'bg-[hsl(var(--chart-2))] text-primary-foreground border-transparent',
  },
};

export function ChatPanelHeader() {
  const { activeCity, closePanel, clearChat, messages } = useChatContext();

  const cityConfig = activeCity ? CITY_LABELS[activeCity] : null;

  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">Transit AI</h2>
        {cityConfig && (
          <Badge className={cn('text-[10px]', cityConfig.className)}>
            {cityConfig.label}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1">
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md',
              'text-muted-foreground',
              'transition-colors duration-150',
              'hover:bg-accent hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
            aria-label="Clear conversation"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={closePanel}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md',
            'text-muted-foreground',
            'transition-colors duration-150',
            'hover:bg-accent hover:text-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
          aria-label="Close chat panel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
