'use client';

import { MessageSquareText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatContext } from './ChatProvider';

export function ChatFAB() {
  const { isOpen, togglePanel, activeCity } = useChatContext();

  // Only show on dashboard pages (when a city is active)
  if (!activeCity) return null;

  return (
    <button
      onClick={togglePanel}
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'h-14 w-14 rounded-full',
        'bg-primary text-primary-foreground',
        'shadow-lg hover:shadow-xl',
        'flex items-center justify-center',
        'transition-all duration-300 ease-out',
        'hover:scale-105 active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        isOpen && 'scale-0 pointer-events-none opacity-0'
      )}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      {isOpen ? (
        <X className="h-6 w-6" />
      ) : (
        <MessageSquareText className="h-6 w-6" />
      )}
    </button>
  );
}
