import { ReactNode } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-14">
        <div className="container mx-auto px-4 py-6 md:py-8">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
