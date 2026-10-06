import type { Coordinate, MapBounds, MarkerColor, MarkerProps } from './types';

/** 보여줄 곳이 정해지지 않았을 때 지도가 처음 잡는 자리. 서울시청이다. */
export const DEFAULT_MAP_CENTER: Coordinate = { lat: 37.5665, lng: 126.978 };

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

export function serializeCoordinates(value: Coordinate[]) {
  return value.map(coor => `${coor.lat}:${coor.lng}`).join(',');
}
