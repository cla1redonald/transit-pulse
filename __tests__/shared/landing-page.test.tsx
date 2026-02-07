import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
  }),
}));

// Mock next/link to render a plain anchor for testability
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => {
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    return <a href={href} {...props}>{children}</a>;
  },
}));

import Home from '@/app/page';

describe('Landing Page', () => {
  it('renders the main heading "Transit Pulse"', () => {
    render(<Home />);
    const headings = screen.getAllByText('Transit Pulse');
    // There may be multiple (header + hero), just verify at least one exists
    expect(headings.length).toBeGreaterThan(0);
  });

  it('renders city cards for NYC and London', () => {
    render(<Home />);

    // City names appear in both card titles and footer; verify at least one of each
    const nycElements = screen.getAllByText('New York City');
    expect(nycElements.length).toBeGreaterThanOrEqual(1);

    // "London" appears as both the header nav tab and the card/footer text
    const londonElements = screen.getAllByText('London');
    expect(londonElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders correct subtitles for each city', () => {
    render(<Home />);

    expect(screen.getByText('MTA Ridership Dashboard')).toBeInTheDocument();
    expect(screen.getByText('TfL Ridership Dashboard')).toBeInTheDocument();
  });

  it('NYC card links to /nyc', () => {
    render(<Home />);
    const nycLink = screen.getByText('New York City').closest('a');
    expect(nycLink).toHaveAttribute('href', '/nyc');
  });

  it('London card links to /london', () => {
    render(<Home />);
    // "London" appears in both the header nav and the city card.
    // Find the city card link by looking for the card's h3 heading.
    const londonHeadings = screen.getAllByText('London');
    // The card heading is inside an <a> with href="/london"
    const londonCardLink = londonHeadings
      .map((el) => el.closest('a'))
      .find((a) => a?.getAttribute('href') === '/london');
    expect(londonCardLink).toBeTruthy();
    expect(londonCardLink).toHaveAttribute('href', '/london');
  });

  it('renders descriptions for both cities', () => {
    render(<Home />);
    expect(
      screen.getByText(/Explore ridership trends across 7 MTA transit modes/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Track journey patterns across TfL services/)
    ).toBeInTheDocument();
  });

  it('renders "Explore Dashboard" call-to-action for each city', () => {
    render(<Home />);
    const exploreBtns = screen.getAllByText('Explore Dashboard');
    expect(exploreBtns).toHaveLength(2);
  });

  it('renders data source attribution', () => {
    render(<Home />);
    // Data source names appear in both the landing page body and the footer
    const mtaElements = screen.getAllByText('MTA Open Data');
    expect(mtaElements.length).toBeGreaterThanOrEqual(1);

    const tflElements = screen.getAllByText('TfL Open Data');
    expect(tflElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders data source links with correct hrefs', () => {
    render(<Home />);
    // Multiple "MTA Open Data" links exist (landing page + footer). Verify at least one has the correct href.
    const mtaLinks = screen.getAllByText('MTA Open Data').map((el) => el.closest('a'));
    const mtaCorrect = mtaLinks.find(
      (a) => a?.getAttribute('href') === 'https://data.ny.gov/Transportation/MTA-Daily-Ridership-Data-2020-2025/vxuj-8kew'
    );
    expect(mtaCorrect).toBeTruthy();

    const tflLinks = screen.getAllByText('TfL Open Data').map((el) => el.closest('a'));
    const tflCorrect = tflLinks.find(
      (a) => a?.getAttribute('href') === 'https://tfl.gov.uk/info-for/open-data-users/'
    );
    expect(tflCorrect).toBeTruthy();
  });
});
