import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// We need to mock next/navigation for each test scenario
let mockPathname = '/';
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
  }),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => {
    return <a href={href} {...props}>{children}</a>;
  },
}));

import { Header } from '@/components/layout/Header';

describe('Header', () => {
  it('renders "Transit Pulse" title', () => {
    mockPathname = '/';
    render(<Header />);
    expect(screen.getByText('Transit Pulse')).toBeInTheDocument();
  });

  it('renders NYC and London navigation tabs', () => {
    mockPathname = '/';
    render(<Header />);
    expect(screen.getByText('NYC')).toBeInTheDocument();
    expect(screen.getByText('London')).toBeInTheDocument();
  });

  it('NYC tab links to /nyc', () => {
    mockPathname = '/';
    render(<Header />);
    const nycTab = screen.getByText('NYC').closest('a');
    expect(nycTab).toHaveAttribute('href', '/nyc');
  });

  it('London tab links to /london', () => {
    mockPathname = '/';
    render(<Header />);
    const londonTab = screen.getByText('London').closest('a');
    expect(londonTab).toHaveAttribute('href', '/london');
  });

  it('highlights NYC tab when pathname is /nyc', () => {
    mockPathname = '/nyc';
    render(<Header />);
    const nycTab = screen.getByText('NYC');
    // Active city gets bg-primary class
    expect(nycTab.className).toContain('bg-primary');
    // London should NOT have bg-primary
    const londonTab = screen.getByText('London');
    expect(londonTab.className).not.toContain('bg-primary');
  });

  it('highlights London tab when pathname is /london', () => {
    mockPathname = '/london';
    render(<Header />);
    const londonTab = screen.getByText('London');
    expect(londonTab.className).toContain('bg-primary');
    // NYC should NOT have bg-primary
    const nycTab = screen.getByText('NYC');
    expect(nycTab.className).not.toContain('bg-primary');
  });

  it('no city tab is highlighted when on landing page (/)', () => {
    mockPathname = '/';
    render(<Header />);
    const nycTab = screen.getByText('NYC');
    const londonTab = screen.getByText('London');
    // Neither should have bg-primary
    expect(nycTab.className).not.toContain('bg-primary');
    expect(londonTab.className).not.toContain('bg-primary');
  });

  it('has a city selection navigation landmark', () => {
    mockPathname = '/';
    render(<Header />);
    expect(screen.getByLabelText('City selection')).toBeInTheDocument();
  });

  it('renders GitHub link', () => {
    mockPathname = '/';
    render(<Header />);
    const githubLink = screen.getByLabelText('View on GitHub');
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute('href', 'https://github.com/cla1redonald/transit-pulse');
    expect(githubLink).toHaveAttribute('target', '_blank');
  });

  it('title links back to home page', () => {
    mockPathname = '/nyc';
    render(<Header />);
    const titleLink = screen.getByText('Transit Pulse').closest('a');
    expect(titleLink).toHaveAttribute('href', '/');
  });
});
