import type { Coordinate, MarkerData } from './types';

export interface Cluster {
  id: string;
  center: Coordinate;
  markers: MarkerData[];
}


export interface Pixel {
  x: number;
  y: number;
}

export type ToPixel = (coord: Coordinate) => Pixel;

/**
 * 마커를 픽셀 거리 기반으로 그룹핑한다. 좌표→픽셀 변환은 provider가 주입한다.
 * center는 plain Coordinate로 반환하며, 지도 SDK 좌표 객체로의 변환은 소비처의 책임이다.
 */
export function clusterMarkers(markers: MarkerData[], toPixel: ToPixel, gridSize: number): Cluster[] {
  if (markers.length === 0) return [];

  const markerPixels = markers.map(marker => ({ marker, pixel: toPixel(marker.position) }));
  const processed = new Set<string>();

  return markerPixels.reduce<Cluster[]>((clusters, { marker, pixel }) => {
    if (processed.has(marker.id)) return clusters;
    processed.add(marker.id);
    
    const nearMarkers = markerPixels.reduce<MarkerData[]>((group, other) => {
      if (processed.has(other.marker.id)) return group;
      const dx = pixel.x - other.pixel.x;
      const dy = pixel.y - other.pixel.y;
      if (Math.sqrt(dx * dx + dy * dy) <= gridSize) {
        group.push(other.marker);
        processed.add(other.marker.id);
      }
      return group;
    }, [marker])
    
    if (nearMarkers.length >= 2) {
      const centerLat = nearMarkers.reduce((sum, m) => sum + m.position.lat, 0) / nearMarkers.length;
      const centerLng = nearMarkers.reduce((sum, m) => sum + m.position.lng, 0) / nearMarkers.length;
      // map 이 새 배열을 만들므로 sort 가 원본을 건드리지 않는다.
      const stableId = nearMarkers.map(m => m.id).sort().join(',');
      clusters.push({ id: `cluster_${stableId}`, center: { lat: centerLat, lng: centerLng }, markers: nearMarkers });
    } else {
      clusters.push({ id: `single_${marker.id}`, center: marker.position, markers: [marker] });
    }
    return clusters;
  }, [])
}

