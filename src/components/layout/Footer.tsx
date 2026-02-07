import { Separator } from '@/components/ui/separator';
import { CITIES, CityId } from '@/types/shared';

export function Footer() {
  return (
    <footer className="mt-16 border-t bg-card/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4 text-center text-sm text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            {(Object.keys(CITIES) as CityId[]).map((cityId, i) => {
              const city = CITIES[cityId];
              return (
                <span key={cityId} className="flex items-center gap-2 sm:gap-4">
                  {i > 0 && (
                    <Separator
                      orientation="vertical"
                      className="hidden sm:block h-4"
                    />
                  )}
                  <span>
                    {city.name}:{' '}
                    <a
                      href={city.dataSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground transition-colors"
                    >
                      {city.dataSource}
                    </a>
                  </span>
                </span>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <span>Built with Next.js, Recharts, and Leaflet</span>
            <Separator
              orientation="vertical"
              className="hidden sm:block h-4"
            />
            <a
              href="https://github.com/cla1redonald/transit-pulse"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
