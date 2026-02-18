export interface Zone {
  name: string;
  label: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export const ZONES: Zone[] = [
  { name: 'park',   label: 'парк',          x1: 60, y1: 83, x2: 95, y2: 98 },
  { name: 'road',   label: 'дорога',        x1: 48.5, y1: 48.4, x2: 99, y2: 58 },
  { name: 'square', label: 'площадь',       x1: 13.4, y1: 35.9, x2: 48, y2: 74.6 },
];

export function getZoneLabel(x: number, y: number): string {
  for (const zone of ZONES) {
    if (x >= zone.x1 && x <= zone.x2 && y >= zone.y1 && y <= zone.y2) {
      return zone.label;
    }
  }
  return '';
}
