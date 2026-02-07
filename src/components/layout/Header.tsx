'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Github } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CITIES = [
  { id: 'nyc', label: 'NYC', href: '/nyc' },
  { id: 'london', label: 'London', href: '/london' },
] as const;

export function Header() {
  const pathname = usePathname();
  const activeCity = CITIES.find((c) => pathname.startsWith(c.href))?.id ?? null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Left: Title + City Tabs */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-lg md:text-xl font-semibold tracking-tight">
              Transit Pulse
            </h1>
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
          </Link>

          {/* City Tabs */}
          <nav className="flex items-center gap-1" aria-label="City selection">
            {CITIES.map((city) => (
              <Link
                key={city.id}
                href={city.href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  activeCity === city.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                {city.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right: Theme Toggle + GitHub */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" asChild>
            <a
              href="https://github.com/cla1redonald/transit-pulse"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View on GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
