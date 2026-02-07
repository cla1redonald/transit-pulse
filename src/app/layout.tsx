import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { ChatProvider } from '@/components/chat/ChatProvider';
import { ChatFAB } from '@/components/chat/ChatFAB';
import { ChatPanel } from '@/components/chat/ChatPanel';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Transit Pulse — Multi-City Ridership Dashboard',
  description:
    'Interactive dashboard visualizing transit ridership data for NYC and London.',
  authors: [{ name: 'Claire Donald' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          <ChatProvider>
            {children}
            <ChatFAB />
            <ChatPanel />
          </ChatProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
