import type { MapBounds } from './types';

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
