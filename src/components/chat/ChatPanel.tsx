'use client';

import { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useChatContext } from './ChatProvider';
import { ChatPanelHeader } from './ChatPanelHeader';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';

export function ChatPanel() {
  const { isOpen, closePanel, activeCity } = useChatContext();

  // Escape key handler -- must be declared before conditional return
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closePanel();
      }
    },
    [isOpen, closePanel]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Only render on dashboard pages
  if (!activeCity) return null;

  return (
    <>
      {/* Scrim for smaller screens */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={closePanel}
          aria-hidden="true"
        />
      )}

      {/* Panel */}
      <aside
        className={cn(
          'fixed top-0 right-0 z-50 h-screen',
          'flex flex-col',
          'bg-card border-l border-border shadow-2xl',
          'transition-transform duration-300 ease-out',
          // Width: 420px on desktop, full-screen on mobile/tablet
          'w-full lg:w-[420px]',
          // Slide animation
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="complementary"
        aria-label="AI Chat Panel"
        aria-hidden={!isOpen}
      >
        <ChatPanelHeader />
        <ChatMessageList />
        <ChatInput />
      </aside>
    </>
  );
}
