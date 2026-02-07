import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'London — Transit Pulse',
  description:
    'Interactive dashboard visualizing TfL ridership data across Tube, Bus, Overground, Elizabeth line, DLR, and Tram.',
};

export default function LondonLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
