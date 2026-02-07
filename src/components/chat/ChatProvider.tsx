'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { UIMessage } from 'ai';
import type { CityId } from '@/types/shared';

interface ChatContextValue {
  isOpen: boolean;
  messages: UIMessage[];
  activeCity: CityId | null;
  status: 'submitted' | 'streaming' | 'ready' | 'error';
  error: Error | undefined;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  sendMessage: (content: string) => void;
  clearChat: () => void;
  clearError: () => void;
  stop: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return ctx;
}

function getCityFromPathname(pathname: string): CityId | null {
  if (pathname.startsWith('/nyc')) return 'nyc';
  if (pathname.startsWith('/london')) return 'london';
  return null;
}

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const pathname = usePathname();
  const activeCity = getCityFromPathname(pathname);

  const [isOpen, setIsOpen] = useState(false);
  const [prevCity, setPrevCity] = useState<CityId | null>(activeCity);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: '/api/chat',
        body: () => ({ city: activeCity }),
      }),
    [activeCity]
  );

  const chat = useChat({
    transport,
  });

  // Clear chat when city changes
  useEffect(() => {
    if (activeCity !== prevCity) {
      chat.setMessages([]);
      setPrevCity(activeCity);
    }
  }, [activeCity, prevCity, chat]);

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const openPanel = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return;
      if (chat.status === 'submitted' || chat.status === 'streaming') return;
      chat.sendMessage({ text: content.trim() });
    },
    [chat]
  );

  const clearChat = useCallback(() => {
    chat.setMessages([]);
  }, [chat]);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        messages: chat.messages,
        activeCity,
        status: chat.status,
        error: chat.error,
        togglePanel,
        openPanel,
        closePanel,
        sendMessage,
        clearChat,
        clearError: chat.clearError,
        stop: chat.stop,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
