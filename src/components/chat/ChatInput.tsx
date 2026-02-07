'use client';

import { useState, useRef, useCallback, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useChatContext } from './ChatProvider';

export function ChatInput() {
  const { sendMessage, status } = useChatContext();
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = status === 'submitted' || status === 'streaming';

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    // Max 4 lines (~96px)
    textarea.style.height = `${Math.min(textarea.scrollHeight, 96)}px`;
  }, []);

  const handleSend = useCallback(() => {
    if (!value.trim() || isLoading) return;
    sendMessage(value);
    setValue('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [value, isLoading, sendMessage]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="border-t border-border bg-background p-3">
      <div
        className={cn(
          'flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 focus-within:ring-offset-background'
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask about transit data..."
          disabled={isLoading}
          rows={1}
          className={cn(
            'flex-1 resize-none bg-transparent text-sm text-foreground',
            'placeholder:text-muted-foreground',
            'focus:outline-none',
            'disabled:opacity-50'
          )}
          aria-label="Chat message input"
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || isLoading}
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            'bg-primary text-primary-foreground',
            'transition-colors duration-150',
            'hover:bg-primary/90',
            'disabled:opacity-50 disabled:pointer-events-none',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
          aria-label="Send message"
        >
          {isLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}
