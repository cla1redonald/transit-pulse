import Link from 'next/link';
import { Train, Globe, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CITIES, type CityId } from '@/types/shared';

const CITY_CARDS: Record<
  CityId,
  {
    icon: typeof Train;
    accent: string;
    description: string;
  }
> = {
  nyc: {
    icon: Train,
    accent: '#0039A6',
    description:
      'Explore ridership trends across 7 MTA transit modes including Subway, Bus, LIRR, Metro-North, and more.',
  },
  london: {
    icon: Globe,
    accent: '#0019A8',
    description:
      'Track journey patterns across TfL services including the Tube, Bus, Overground, Elizabeth line, DLR, and Tram.',
  },
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-14">
        <div className="container mx-auto px-4 py-12 md:py-20">
          {/* Hero */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Transit Pulse
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Interactive dashboards visualizing ridership trends across major
              transit systems. Compare patterns, track recovery, and explore
              station-level data.
            </p>
          </div>

          {/* City Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {(Object.keys(CITIES) as CityId[]).map((cityId) => {
              const city = CITIES[cityId];
              const cardConfig = CITY_CARDS[cityId];
              const Icon = cardConfig.icon;

              return (
                <Link key={cityId} href={`/${cityId}`} className="group block">
                  <Card className="h-full transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                    <CardContent className="p-8">
                      <div className="flex items-start gap-4 mb-4">
                        <div
                          className="p-3 rounded-xl shrink-0"
                          style={{
                            backgroundColor: `${cardConfig.accent}15`,
                          }}
                        >
                          <Icon
                            className="h-6 w-6"
                            style={{ color: cardConfig.accent }}
                          />
                        </div>
                        <div>
                          <h3 className="text-2xl font-semibold mb-1 group-hover:text-primary transition-colors">
                            {city.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {city.subtitle}
                          </p>
                        </div>
                      </div>

                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        {cardConfig.description}
                      </p>

                      <div className="flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3 transition-all">
                        <span>Explore Dashboard</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Data Sources */}
          <div className="mt-16 text-center">
            <p className="text-sm text-muted-foreground">
              Powered by open data from{' '}
              <a
                href={CITIES.nyc.dataSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                {CITIES.nyc.dataSource}
              </a>{' '}
              and{' '}
              <a
                href={CITIES.london.dataSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground transition-colors"
              >
                {CITIES.london.dataSource}
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
