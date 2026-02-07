import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPICard } from '@/components/kpi/KPICard';
import { Train } from 'lucide-react';

// Mock window.matchMedia for jsdom (prefers-reduced-motion check)
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: true, // Simulate reduced motion so animation skips
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('KPICard', () => {
  it('renders label', () => {
    render(<KPICard label="Avg Daily Ridership" value={5000000} />);
    expect(screen.getByText('Avg Daily Ridership')).toBeInTheDocument();
  });

  it('renders formatted number value', () => {
    render(<KPICard label="Test" value={5000000} />);
    expect(screen.getByText('5.0M')).toBeInTheDocument();
  });

  it('renders percentage value when valueFormat is percent', () => {
    render(<KPICard label="Recovery" value={85.3} valueFormat="percent" />);
    expect(screen.getByText('85.3%')).toBeInTheDocument();
  });

  it('renders delta with arrow icon', () => {
    render(<KPICard label="Test" value={1000} delta={3.2} />);
    expect(screen.getByText('+3.2%')).toBeInTheDocument();
  });

  it('renders negative delta', () => {
    render(<KPICard label="Test" value={1000} delta={-1.5} />);
    expect(screen.getByText('-1.5%')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <KPICard label="Test" value={1000} icon={Train} color="#0039A6" />
    );
    // The icon renders as an SVG, the card should have the colored icon container
    const iconContainer = document.querySelector('.p-2.rounded-lg');
    expect(iconContainer).toBeInTheDocument();
  });

  it('applies dimmed styling when dimmed is true', () => {
    const { container } = render(
      <KPICard label="Test" value={1000} dimmed={true} />
    );
    const card = container.querySelector('.opacity-40');
    expect(card).toBeInTheDocument();
  });

  it('does not apply dimmed styling when dimmed is false', () => {
    const { container } = render(
      <KPICard label="Test" value={1000} dimmed={false} />
    );
    const card = container.querySelector('.opacity-40');
    expect(card).toBeNull();
  });

  it('renders sparkline bars when sparklineData is provided', () => {
    render(
      <KPICard label="Test" value={1000} sparklineData={[10, 20, 30, 40]} />
    );
    const bars = document.querySelectorAll('.bg-primary\\/30');
    expect(bars.length).toBe(4);
  });

  it('does not render sparkline when sparklineData is empty', () => {
    render(<KPICard label="Test" value={1000} sparklineData={[]} />);
    const bars = document.querySelectorAll('.bg-primary\\/30');
    expect(bars.length).toBe(0);
  });

  it('handles zero value sparkline data without division by zero', () => {
    render(
      <KPICard label="Test" value={1000} sparklineData={[0, 0, 0]} />
    );
    const bars = document.querySelectorAll('.bg-primary\\/30');
    expect(bars.length).toBe(3);
    // All bars should have 0% height
    bars.forEach((bar) => {
      expect((bar as HTMLElement).style.height).toBe('0%');
    });
  });
});
