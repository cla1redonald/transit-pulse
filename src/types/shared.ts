export type CityId = 'nyc' | 'london';

export type DatePreset = '7d' | '30d' | '90d' | 'ytd' | '1y' | 'all' | 'custom';

export interface CityConfig {
  id: CityId;
  name: string;
  subtitle: string;
  dataSource: string;
  dataSourceUrl: string;
}

export const CITIES: Record<CityId, CityConfig> = {
  nyc: {
    id: 'nyc',
    name: 'New York City',
    subtitle: 'MTA Ridership Dashboard',
    dataSource: 'MTA Open Data',
    dataSourceUrl: 'https://data.ny.gov/Transportation/MTA-Daily-Ridership-Data-2020-2025/vxuj-8kew',
  },
  london: {
    id: 'london',
    name: 'London',
    subtitle: 'TfL Ridership Dashboard',
    dataSource: 'TfL Open Data',
    dataSourceUrl: 'https://tfl.gov.uk/info-for/open-data-users/',
  },
};
