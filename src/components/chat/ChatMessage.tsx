'use client';

import { cn } from '@/lib/utils';
import type { UIMessage } from 'ai';

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  // Extract text content from message parts
  const textContent = message.parts
    .filter((part): part is Extract<typeof part, { type: 'text' }> => part.type === 'text')
    .map((part) => part.text)
    .join('');

  if (!textContent) return null;

  return (
    <div
      className={cn(
        'flex w-full px-4 py-1.5',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-muted/30 text-foreground rounded-bl-sm'
        )}
      >
        <div className="whitespace-pre-wrap break-words">{textContent}</div>
      </div>
    </div>
  );
}
