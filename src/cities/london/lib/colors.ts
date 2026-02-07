import { TransitMode } from '@/cities/london/types/transit';

export const MODE_COLORS: Record<TransitMode, string> = {
  tube: '#0019A8',
  bus: '#CE1249',
  overground: '#E86A10',
  elizabeth: '#6950A1',
  dlr: '#00AFAD',
  tram: '#66CC00',
};

export const MODE_LABELS: Record<TransitMode, string> = {
  tube: 'Tube',
  bus: 'Bus',
  overground: 'Overground',
  elizabeth: 'Elizabeth line',
  dlr: 'DLR',
  tram: 'Tram',
};

export function getModeColor(mode: TransitMode): string {
  return MODE_COLORS[mode];
}

export function getModeLabel(mode: TransitMode): string {
  return MODE_LABELS[mode];
}
