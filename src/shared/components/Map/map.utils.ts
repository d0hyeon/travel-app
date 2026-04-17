import type { MapBounds, MarkerColor, MarkerProps } from './types';

const SEMANTIC_COLORS: Record<string, string> = {
  default: '#ef5350',
  selected: '#1976d2',
  disabled: '#9e9e9e',
};

export function resolveMarkerColor(color?: MarkerColor, variant?: MarkerProps['variant']): string {
  if (color != null) {
    return SEMANTIC_COLORS[color] ?? color;
  }
  return variant === 'circle' ? '#4285f4' : '#ef5350';
}

/** 10% 패딩 포함 — 경계 근처 마커가 갑자기 사라지는 현상 방지 */
export function isInMapBounds(lat: number, lng: number, bounds: MapBounds): boolean {
  const latPad = (bounds.north - bounds.south) * 0.1;
  const lngPad = (bounds.east - bounds.west) * 0.1;
  return (
    lat >= bounds.south - latPad &&
    lat <= bounds.north + latPad &&
    lng >= bounds.west - lngPad &&
    lng <= bounds.east + lngPad
  );
}
