import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NYC Transit Pulse — MTA Ridership Dashboard',
  description:
    'Interactive dashboard visualizing MTA ridership data across subway, bus, LIRR, Metro-North, and more.',
};

export default function NycLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
