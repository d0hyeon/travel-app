import { useQuery } from '@tanstack/react-query';
import { loadGoogleMaps } from '../components/Map/google/loader';
import { getDirections as getKakaoDirections } from '../lib/kakaoMobility';
import type { MapType, Coordinate } from '../components/Map/types';

interface UseDirectionsOptions {
  type: MapType;
  waypoints: Coordinate[] | undefined;
}

/**
 * 도로 기반 경로 좌표를 가져오는 hook
 * type에 따라 카카오 모빌리티 또는 Google Directions API 사용
 */
export function useDirections({ type, waypoints }: UseDirectionsOptions) {
  const { data } = useQuery({
    queryKey: ['directions', type, waypoints?.map((p) => `${p.lat},${p.lng}`).join('|')],
    queryFn: () => {
      if (type === 'kakao') {
        return getKakaoDirections(waypoints!);
      } else {
        return getGoogleDirections(waypoints!);
      }
    },
    enabled: !!waypoints && waypoints.length >= 2,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    refetchInterval: false,
    refetchOnMount: false,
  });

  return data ?? waypoints;
}

/**
 * Google Directions API를 사용하여 경로 좌표 반환
 */
async function getGoogleDirections(waypoints: Coordinate[]): Promise<Coordinate[]> {
  if (waypoints.length < 2) {
    return waypoints;
  }

  await loadGoogleMaps();

  return new Promise((resolve) => {
    const directionsService = new google.maps.DirectionsService();

    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const intermediateWaypoints = waypoints.slice(1, -1);

    const request: google.maps.DirectionsRequest = {
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      waypoints: intermediateWaypoints.map((wp) => ({
        location: { lat: wp.lat, lng: wp.lng },
        stopover: true,
      })),
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false, // 순서 유지
    };

    directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        const coordinates: Coordinate[] = [];

        // 모든 leg의 step에서 path 추출
        result.routes[0]?.legs.forEach((leg) => {
          leg.steps.forEach((step) => {
            step.path?.forEach((point) => {
              coordinates.push({
                lat: point.lat(),
                lng: point.lng(),
              });
            });
          });
        });

        resolve(coordinates.length > 0 ? coordinates : waypoints);
      } else {
        console.error('Google Directions 오류:', status);
        resolve(waypoints); // fallback: 직선
      }
    });
  });
}

// 기존 useRoadPath와 호환되는 별칭
export { useDirections as useRoadPath };
